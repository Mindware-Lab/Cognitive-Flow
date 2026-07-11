import { PHASE_CELL, PHASE_NAMES, TARGET_ENVELOPE_SESSIONS } from "./protocol";
import { transferMetricsFromEvidence } from "./transferController";
import type {
  CellEvidence,
  CellKey,
  ConfidenceLabel,
  Construct,
  FarTransferBoundarySignal,
  FarTransferEvidence,
  FarTransferWindow,
  PhaseLabel,
  ScratchBaseline,
  ScorePanel,
  TimingQuality,
  TransferComponent,
  TransitionKey,
  TrialResult,
  WorkingMemoryScoreSnapshot,
} from "./types";

export const SCORING_MODEL_VERSION = "wm-coach-nlevel-scoring-v0.1";

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = values.slice().sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : Math.round((sorted[middle - 1] + sorted[middle]) / 2);
}

function bounded(value: number, min = 0, max = 1): number {
  return Math.max(min, Math.min(max, value));
}

function key(construct: Construct, cellKey: CellKey): string {
  return `${construct}:${cellKey}`;
}

function timingQuality(results: TrialResult[]): TimingQuality {
  if (results.some((result) => result.timingQuality === "poor")) return "poor";
  if (results.some((result) => result.timingQuality === "acceptable")) return "acceptable";
  return "good";
}

function metricsFor(results: TrialResult[]) {
  const scored = results.filter((result) => !result.trial.isWarmup);
  const targetTrials = scored.filter((result) => result.trial.isMatch);
  const nonTargetTrials = scored.filter((result) => !result.trial.isMatch);
  const lureTrials = scored.filter((result) => result.trial.lureType !== null);
  const hits = targetTrials.filter((result) => result.response === "MATCH").length;
  const misses = targetTrials.length - hits;
  const falseAlarms = nonTargetTrials.filter((result) => result.response === "MATCH").length;
  const correctRejections = nonTargetTrials.length - falseAlarms;
  const hitRate = targetTrials.length ? hits / targetTrials.length : 0;
  const correctRejectionRate = nonTargetTrials.length ? correctRejections / nonTargetTrials.length : 0;
  const balancedAccuracy = targetTrials.length || nonTargetTrials.length ? (hitRate + correctRejectionRate) / 2 : 0;
  const falseAlarmRate = nonTargetTrials.length ? falseAlarms / nonTargetTrials.length : 0;
  const missRate = targetTrials.length ? misses / targetTrials.length : 0;
  const lureErrorRate = lureTrials.length ? lureTrials.filter((result) => result.response === "MATCH").length / lureTrials.length : 0;
  const rtMedianMs = median(scored.map((result) => result.rtMs).filter((value): value is number => value !== null));
  const nLevel = Math.max(...results.map((result) => result.trial.nLevel), 1);
  return {
    scored,
    validTrials: scored.length,
    nLevel,
    balancedAccuracy,
    lapseRate: missRate,
    falseAlarmRate,
    missRate,
    lureErrorRate,
    rtMedianMs,
    timingQuality: timingQuality(results),
  };
}

function evidenceFromResults(results: TrialResult[], previous: CellEvidence | null): CellEvidence {
  const first = results[0].trial;
  const metrics = metricsFor(results);
  const previousN = previous?.currentNLevel ?? previous?.currentCapacityBps ?? metrics.nLevel;
  const currentN = metrics.nLevel;
  const stableN = metrics.balancedAccuracy >= 0.75 ? currentN : Math.max(1, Math.min(currentN, previous?.stableNLevel ?? currentN - 1));
  const peakN = Math.max(previous?.peakNLevel ?? 0, metrics.balancedAccuracy >= 0.75 ? currentN : 0);
  return {
    construct: first.construct,
    cellKey: first.cellKey,
    validTrials: (previous?.validTrials || 0) + metrics.validTrials,
    rollingWindowCount: (previous?.rollingWindowCount || 0) + 1,
    recentCapacitySlope: currentN - previousN,
    balancedAccuracy: metrics.balancedAccuracy,
    lapseRate: metrics.missRate,
    timingQuality: metrics.timingQuality,
    localAsymptoteBps: Math.max(previous?.localAsymptoteBps || 0, peakN || currentN),
    currentCapacityBps: currentN,
    currentNLevel: currentN,
    stableNLevel: stableN,
    peakNLevel: peakN || currentN,
    falseAlarmRate: metrics.falseAlarmRate,
    missRate: metrics.missRate,
    lureErrorRate: metrics.lureErrorRate,
    medianRtMs: metrics.rtMedianMs,
  };
}

export function updateEvidenceFromResults(existing: CellEvidence[], results: TrialResult[]): CellEvidence[] {
  const groups = new Map<string, TrialResult[]>();
  results.forEach((result) => {
    const groupKey = key(result.trial.construct, result.trial.cellKey);
    groups.set(groupKey, [...(groups.get(groupKey) || []), result]);
  });
  const next = existing.slice();
  groups.forEach((groupResults, groupKey) => {
    const index = next.findIndex((item) => key(item.construct, item.cellKey) === groupKey);
    const updated = evidenceFromResults(groupResults, index >= 0 ? next[index] : null);
    if (index >= 0) next[index] = updated;
    else next.push(updated);
  });
  return next;
}

export function createFarTransferWindows(input: {
  existingWindows: FarTransferWindow[];
  results: TrialResult[];
  sessionNumber: number;
}): FarTransferWindow[] {
  const groups = new Map<string, TrialResult[]>();
  input.results.forEach((result) => {
    const groupKey = key(result.trial.construct, result.trial.cellKey);
    groups.set(groupKey, [...(groups.get(groupKey) || []), result]);
  });
  const windows = Array.from(groups.values()).map((results) => {
    const first = results[0].trial;
    const metrics = metricsFor(results);
    return {
      modelVersion: SCORING_MODEL_VERSION,
      sessionNumber: input.sessionNumber,
      construct: first.construct,
      cellKey: first.cellKey,
      phase: first.phase,
      transitionKey: first.transitionKey,
      validTrials: metrics.validTrials,
      capacityBps: metrics.nLevel,
      balancedAccuracy: metrics.balancedAccuracy,
      lapseRate: metrics.missRate,
      timingPenalty: metrics.timingQuality === "poor" ? 1 : metrics.timingQuality === "acceptable" ? 0.35 : 0,
      rtMedianMs: metrics.rtMedianMs,
      rtIqrMs: null,
      conditionEntropyBits: 0,
      conditionEntropyRatio: 1,
      updateMagnitude: null,
      mutualInfoProxy: Math.round(metrics.balancedAccuracy * 100),
      nLevel: metrics.nLevel,
      falseAlarmRate: metrics.falseAlarmRate,
      missRate: metrics.missRate,
      lureErrorRate: metrics.lureErrorRate,
    } satisfies FarTransferWindow;
  });
  return [...input.existingWindows, ...windows].slice(-80);
}

function evidenceFor(evidence: CellEvidence[], construct: Construct, cellKey: CellKey): CellEvidence | null {
  return evidence.find((item) => item.construct === construct && item.cellKey === cellKey) || null;
}

function primaryEvidenceFor(evidence: CellEvidence[], construct: Construct, cellKey: CellKey): CellEvidence | null {
  if (cellKey !== "mixed") return evidenceFor(evidence, construct, cellKey);
  const candidates = evidence.filter((item) => item.construct === construct);
  if (candidates.length === 0) return null;
  return candidates.sort((a, b) => (b.validTrials || 0) - (a.validTrials || 0))[0];
}

function confidenceForEvidence(evidence: CellEvidence | null): ConfidenceLabel {
  if (!evidence || evidence.validTrials < 80) return "calibrating";
  if (evidence.timingQuality === "poor") return "timing_limited";
  if (evidence.rollingWindowCount >= 4 && Math.abs(evidence.recentCapacitySlope) <= 1 && evidence.balancedAccuracy >= 0.75) return "moderate_confidence";
  return "calibrating";
}

function panel(evidence: CellEvidence | null): ScorePanel {
  const n = evidence?.stableNLevel ?? evidence?.currentNLevel ?? evidence?.currentCapacityBps ?? null;
  return {
    bitsPerSec: n,
    trainingScore: n === null ? null : n,
    nLevel: n,
    stableNLevel: evidence?.stableNLevel ?? null,
    peakNLevel: evidence?.peakNLevel ?? null,
    confidence: confidenceForEvidence(evidence),
    trend: evidence ? (evidence.recentCapacitySlope > 0 ? "improving" : "steady") : "needs_more_data",
  };
}

function recoveryRatio(source: CellEvidence | null, target: CellEvidence | null): number | null {
  const sourceN = source?.stableNLevel ?? source?.currentNLevel ?? null;
  const targetN = target?.stableNLevel ?? target?.currentNLevel ?? null;
  if (!sourceN || !targetN) return null;
  return bounded(targetN / sourceN, 0, 1.25);
}

function component(label: string, transition: TransitionKey, completedTransitions: readonly TransitionKey[], score: number | null): TransferComponent {
  if (!completedTransitions.includes(transition)) return { score: null, status: "coming_up", label, confidence: "insufficient_data" };
  if (score === null) return { score: null, status: "calibrating", label, confidence: "calibrating" };
  return { score, status: "available", label, confidence: score >= 75 ? "moderate_confidence" : "calibrating" };
}

function signal(input: {
  boundary: TransitionKey;
  completedTransitions: readonly TransitionKey[];
  evidence: CellEvidence[];
  sourceCell: CellKey;
  targetCell: CellKey;
}): FarTransferBoundarySignal {
  const source = evidenceFor(input.evidence, "ACC", input.sourceCell);
  const target = evidenceFor(input.evidence, "ACC", input.targetCell);
  const ratio = recoveryRatio(source, target);
  return {
    boundary: input.boundary,
    status: !input.completedTransitions.includes(input.boundary) ? "not_reached" : ratio === null ? "calibrating" : "available",
    sourceCell: input.sourceCell,
    targetCell: input.targetCell,
    sourceCapacityBps: source?.currentNLevel ?? source?.currentCapacityBps ?? null,
    targetCapacityBps: target?.currentNLevel ?? target?.currentCapacityBps ?? null,
    recoveryRatio: ratio,
    entropySupport: target ? 1 : null,
    mutualInfoProxy: target ? Math.round(target.balancedAccuracy * 100) : null,
    scratchBaselineSource: "unavailable",
    scratchBaseline: null,
    tau90TransferWindows: null,
    transferEfficiency: null,
    stabilityAdvantage: null,
    functionalTransferScore: ratio === null ? null : Math.round(bounded(ratio) * 100),
  };
}

function mixedStabilityScore(evidence: CellEvidence[]): number | null {
  const cells = ["arrow_abs", "flow_abs", "arrow_rel", "flow_rel"] as CellKey[];
  const values = cells.map((cell) => evidenceFor(evidence, "ACC", cell)?.stableNLevel ?? null).filter((value): value is number => value !== null);
  if (values.length < 3) return null;
  const mean = values.reduce((total, value) => total + value, 0) / values.length;
  if (mean <= 0) return null;
  const variance = values.reduce((total, value) => total + (value - mean) ** 2, 0) / values.length;
  return Math.round(100 - bounded(Math.sqrt(variance) / mean, 0, 1) * 100);
}

function createFarTransferEvidence(input: {
  evidence: CellEvidence[];
  completedTransitions: TransitionKey[];
  windows: FarTransferWindow[];
  scratchBaselines: ScratchBaseline[];
  protocolGroup: "commercial_arrows_first" | "validation_arrows_first" | "validation_flow_first";
}): FarTransferEvidence {
  const flowFirst = input.protocolGroup === "validation_flow_first";
  return {
    modelVersion: SCORING_MODEL_VERSION,
    caveat: "functional_proxy_not_zhang_tang",
    summary: "WM Coach transfer evidence compares n-back level recovery across carrier, frame, mixed, and delayed re-checks.",
    protocolGroup: input.protocolGroup,
    windows: input.windows,
    boundarySignals: [
      signal({
        boundary: "T_CM_BASE",
        completedTransitions: input.completedTransitions,
        evidence: input.evidence,
        sourceCell: flowFirst ? "flow_abs" : "arrow_abs",
        targetCell: flowFirst ? "arrow_abs" : "flow_abs",
      }),
      signal({
        boundary: "T_CM_REL",
        completedTransitions: input.completedTransitions,
        evidence: input.evidence,
        sourceCell: flowFirst ? "flow_rel" : "arrow_rel",
        targetCell: flowFirst ? "arrow_rel" : "flow_rel",
      }),
    ],
  };
}

export function createScoreSnapshot(input: {
  sessionNumber: number;
  activePhase: PhaseLabel;
  phaseStatus: "active" | "flattening" | "ready_to_swap" | "recovering" | "mixed" | "delayed" | "extended_for_learning_curve" | "completed";
  nominalBand: string | null;
  evidence: CellEvidence[];
  completedTransitions: TransitionKey[];
  farTransferWindows?: FarTransferWindow[];
  scratchBaselines?: ScratchBaseline[];
  protocolGroup?: "commercial_arrows_first" | "validation_arrows_first" | "validation_flow_first";
}): WorkingMemoryScoreSnapshot {
  const activeCell = PHASE_CELL[input.activePhase];
  const activeRelational = primaryEvidenceFor(input.evidence, "ACC", activeCell);
  const activeBinding = primaryEvidenceFor(input.evidence, "BSE", activeCell);
  const farTransfer = createFarTransferEvidence({
    evidence: input.evidence,
    completedTransitions: input.completedTransitions,
    windows: input.farTransferWindows || [],
    scratchBaselines: input.scratchBaselines || [],
    protocolGroup: input.protocolGroup || "commercial_arrows_first",
  });
  const motionSignal = farTransfer.boundarySignals.find((item) => item.boundary === "T_CM_BASE");
  const relationSignal = farTransfer.boundarySignals.find((item) => item.boundary === "T_CM_REL");
  const motion = component("Arrow to flow", "T_CM_BASE", input.completedTransitions, motionSignal?.functionalTransferScore ?? null);
  const relation = component("Frame change", "T_CM_REL", input.completedTransitions, relationSignal?.functionalTransferScore ?? null);
  const mixed = component("Mixed stability", "T_MIXED", input.completedTransitions, mixedStabilityScore(input.evidence));
  const delayed = component("Delayed return", "T_DELAYED", input.completedTransitions, mixedStabilityScore(input.evidence));
  const availableScores = [motion, relation, mixed, delayed].filter((item) => item.status === "available" && item.score !== null);
  const transferScore = availableScores.length
    ? Math.round(availableScores.reduce((total, item) => total + (item.score || 0), 0) / availableScores.length)
    : null;
  return {
    sessionNumber: input.sessionNumber,
    activePhase: input.activePhase,
    phaseStatus: input.phaseStatus,
    nominalBand: input.nominalBand,
    workingMemoryControl: panel(activeRelational),
    bindingFocus: {
      ...panel(activeBinding),
      lagFlag: !activeBinding || activeBinding.validTrials < 80 ? "insufficient_data" : "on_track",
    },
    transfer: {
      score: transferScore,
      status: transferScore === null ? (input.sessionNumber >= TARGET_ENVELOPE_SESSIONS ? "not_enough_evidence" : "calibrating") : transferScore >= 80 ? "strong" : "developing",
      motionRecovery: motion,
      relationRecovery: relation,
      mixedFlexibility: mixed,
      returnStrength: delayed,
    },
    nextChallenge: {
      label: PHASE_NAMES[input.activePhase],
      state: input.phaseStatus === "ready_to_swap" ? "ready_next_session" : input.phaseStatus === "extended_for_learning_curve" ? "not_enough_evidence" : "current_phase",
    },
    farTransfer,
    transferMetrics: transferMetricsFromEvidence(input.evidence, input.protocolGroup),
  };
}
