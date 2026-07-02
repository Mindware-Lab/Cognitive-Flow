import { PHASE_NAMES, TARGET_ENVELOPE_SESSIONS } from "./protocol";
import type {
  AttentionScoreSnapshot,
  CellEvidence,
  CellKey,
  ConfidenceLabel,
  FarTransferBoundarySignal,
  FarTransferEvidence,
  FarTransferWindow,
  PhaseLabel,
  PhaseStatus,
  ProtocolGroup,
  ScorePanel,
  ScratchBaseline,
  ScratchBaselineSource,
  TransferComponent,
  TransitionKey,
  TrendLabel,
  TrialResult,
} from "./types";

export const CALIBRATION_TABLE_ID = "masked-majority-v1-initial";
export const FAR_TRANSFER_MODEL_VERSION = "functional-mi-entropy-transfer-v0.1";
const H_CONDITION_BITS: Record<string, number> = {
  "5:0": 1.58,
  "4:1": 2.91,
  "3:2": 4.91,
};

function adjustedExposureSeconds(result: TrialResult): number {
  const refreshRate = result.deviceRefreshRateEstimate || 60;
  const frameSeconds = result.actualStimulusFrames > 0 ? result.actualStimulusFrames / refreshRate : 0;
  return frameSeconds || result.exposureMsActual / 1000 || result.trial.exposureMsRequested / 1000;
}

function informationBits(result: TrialResult): number {
  if (result.trial.construct === "BSE") return Math.log2(Math.max(2, result.trial.responseOptions.length));
  return H_CONDITION_BITS[result.trial.ratio] ?? H_CONDITION_BITS["4:1"];
}

function trialDemandBps(result: TrialResult): number {
  return informationBits(result) / adjustedExposureSeconds(result);
}

function entropyBits(values: string[]): number {
  if (values.length === 0) return 0;
  const counts = new Map<string, number>();
  for (const value of values) counts.set(value, (counts.get(value) || 0) + 1);
  let entropy = 0;
  for (const count of counts.values()) {
    const p = count / values.length;
    entropy -= p * Math.log2(p);
  }
  return entropy;
}

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

function percentile(values: number[], p: number): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.max(0, Math.min(sorted.length - 1, Math.round((sorted.length - 1) * p)));
  return sorted[index];
}

function iqr(values: number[]): number | null {
  const q1 = percentile(values, 0.25);
  const q3 = percentile(values, 0.75);
  return q1 === null || q3 === null ? null : q3 - q1;
}

function frameForCell(cellKey: CellKey): "abs" | "rel" | "mixed" {
  if (cellKey.endsWith("_rel")) return "rel";
  if (cellKey.endsWith("_abs")) return "abs";
  return "mixed";
}

function carrierForCell(cellKey: CellKey): "arrow" | "flow" | "mixed" {
  if (cellKey.startsWith("arrow")) return "arrow";
  if (cellKey.startsWith("flow")) return "flow";
  return "mixed";
}

function conditionSignature(result: TrialResult): string {
  const exposureBucket = Math.round(result.exposureMsActual / 25) * 25;
  return [
    result.trial.construct,
    carrierForCell(result.trial.cellKey),
    frameForCell(result.trial.cellKey),
    result.trial.ratio,
    exposureBucket,
    result.trial.responseOptions.length,
    result.trial.isReferenceRecheck ? "reference" : "current",
    result.timingQuality,
  ].join("|");
}

function timingPenalty(results: TrialResult[]): number {
  if (results.length === 0) return 0;
  const penalty = results.reduce((total, result) => {
    const qualityPenalty = result.timingQuality === "poor" ? 1 : result.timingQuality === "acceptable" ? 0.35 : 0;
    const dropPenalty = Math.min(1, result.droppedFrameCount / 3);
    return total + Math.max(qualityPenalty, dropPenalty);
  }, 0);
  return Math.max(0, Math.min(1, penalty / results.length));
}

function bounded(value: number, min = 0, max = 1): number {
  return Math.max(min, Math.min(max, value));
}

function sigmoid(value: number): number {
  return 1 / (1 + Math.exp(-value));
}

function logit(value: number): number {
  return Math.log(value / (1 - value));
}

function estimateLapseRate(valid: TrialResult[]): number {
  if (valid.length < 8) return 0.08;
  const sorted = [...valid].sort((a, b) => trialDemandBps(a) - trialDemandBps(b));
  const easiest = sorted.slice(0, Math.max(4, Math.ceil(sorted.length * 0.2)));
  const errorRate = easiest.filter((result) => !result.isCorrect).length / easiest.length;
  return Math.max(0.02, Math.min(0.22, errorRate));
}

function estimateCapacityBps(results: TrialResult[]): {
  capacityBps: number | null;
  balancedAccuracy: number;
  lapseRate: number;
  validTrials: number;
  timingQuality: "good" | "acceptable" | "poor";
} {
  const valid = results.filter((result) => result.timingQuality !== "poor");
  const validTrials = valid.length;
  const balancedAccuracy =
    validTrials > 0 ? valid.filter((result) => result.isCorrect).length / validTrials : 0;
  const lapseRate = estimateLapseRate(valid);
  const timingQuality = results.some((result) => result.timingQuality === "poor")
    ? "poor"
    : results.some((result) => result.timingQuality === "acceptable")
      ? "acceptable"
      : "good";
  if (validTrials < 8) {
    return { capacityBps: null, balancedAccuracy, lapseRate, validTrials, timingQuality };
  }

  const typicalChance = results[0]?.trial.construct === "BSE" ? 0.25 : 0.5;
  const usableRange = Math.max(0.05, 1 - typicalChance - lapseRate);
  const scale = 1.15;
  let bestTheta = 1;
  let bestLoss = Number.POSITIVE_INFINITY;
  for (let theta = 0.5; theta <= 18; theta += 0.05) {
    let loss = 0;
    for (const result of valid) {
      const chance = 1 / Math.max(2, result.trial.responseOptions.length);
      const usable = Math.max(0.05, 1 - chance - lapseRate);
      const p = Math.max(0.001, Math.min(0.999, chance + usable * sigmoid((theta - trialDemandBps(result)) / scale)));
      loss += result.isCorrect ? -Math.log(p) : -Math.log(1 - p);
    }
    if (loss < bestLoss) {
      bestLoss = loss;
      bestTheta = theta;
    }
  }

  const targetRatio = Math.max(0.01, Math.min(0.99, (0.75 - typicalChance) / usableRange));
  const capacityBps = Math.max(0.5, bestTheta - logit(targetRatio) * scale);
  return { capacityBps, balancedAccuracy, lapseRate, validTrials, timingQuality };
}

export function updateEvidenceFromResults(existingEvidence: CellEvidence[], results: TrialResult[]): CellEvidence[] {
  const evidence = new Map<string, CellEvidence>();
  for (const item of existingEvidence) evidence.set(`${item.construct}:${item.cellKey}`, { ...item });
  const grouped = new Map<string, TrialResult[]>();
  for (const result of results) {
    const key = `${result.trial.construct}:${result.trial.cellKey}`;
    grouped.set(key, [...(grouped.get(key) || []), result]);
  }
  for (const [key, group] of grouped) {
    const [construct, cellKey] = key.split(":") as [CellEvidence["construct"], CellEvidence["cellKey"]];
    const previous =
      evidence.get(key) ||
      ({
        construct,
        cellKey,
        validTrials: 0,
        rollingWindowCount: 0,
        recentCapacitySlope: 0,
        balancedAccuracy: 0,
        lapseRate: 0.08,
        timingQuality: "good",
        localAsymptoteBps: null,
        currentCapacityBps: null,
      } satisfies CellEvidence);
    const estimate = estimateCapacityBps(group);
    const totalValid = previous.validTrials + estimate.validTrials;
    const currentCapacityBps = estimate.capacityBps ?? previous.currentCapacityBps;
    const priorCapacity = previous.currentCapacityBps ?? currentCapacityBps;
    evidence.set(key, {
      ...previous,
      validTrials: totalValid,
      rollingWindowCount: Math.floor(totalValid / 40),
      recentCapacitySlope:
        currentCapacityBps !== null && priorCapacity !== null ? (currentCapacityBps - priorCapacity) / Math.max(1, Math.ceil(group.length / 40)) : 0,
      balancedAccuracy:
        totalValid > 0
          ? (previous.balancedAccuracy * previous.validTrials + estimate.balancedAccuracy * estimate.validTrials) / totalValid
          : estimate.balancedAccuracy,
      lapseRate: estimate.lapseRate,
      timingQuality: previous.timingQuality === "poor" || estimate.timingQuality === "poor"
        ? "poor"
        : previous.timingQuality === "acceptable" || estimate.timingQuality === "acceptable"
          ? "acceptable"
          : "good",
      localAsymptoteBps:
        currentCapacityBps === null
          ? previous.localAsymptoteBps
          : Math.max(previous.localAsymptoteBps || 0, currentCapacityBps),
      currentCapacityBps,
    });
  }
  return Array.from(evidence.values());
}

function latestWindow(
  windows: FarTransferWindow[],
  construct: "ACC" | "BSE",
  cellKey: CellKey,
): FarTransferWindow | null {
  const matches = windows
    .filter((window) => window.construct === construct && window.cellKey === cellKey)
    .sort((a, b) => a.sessionNumber - b.sessionNumber);
  return matches[matches.length - 1] || null;
}

function updateMagnitude(previous: FarTransferWindow | null, current: {
  capacityBps: number | null;
  balancedAccuracy: number;
  lapseRate: number;
  timingPenalty: number;
  rtMedianMs: number | null;
  conditionEntropyRatio: number;
}): number | null {
  if (!previous || previous.capacityBps === null || current.capacityBps === null) return null;
  const capacityDelta = Math.abs(current.capacityBps - previous.capacityBps) / Math.max(1, previous.capacityBps);
  const accuracyDelta = Math.abs(current.balancedAccuracy - previous.balancedAccuracy);
  const lapseDelta = Math.abs(current.lapseRate - previous.lapseRate);
  const timingDelta = Math.abs(current.timingPenalty - previous.timingPenalty);
  const entropyDelta = Math.abs(current.conditionEntropyRatio - previous.conditionEntropyRatio);
  const rtDelta =
    previous.rtMedianMs && current.rtMedianMs
      ? Math.abs(current.rtMedianMs - previous.rtMedianMs) / Math.max(100, previous.rtMedianMs)
      : 0;
  return Math.sqrt(
    capacityDelta ** 2 +
      accuracyDelta ** 2 +
      lapseDelta ** 2 +
      timingDelta ** 2 +
      entropyDelta ** 2 +
      rtDelta ** 2,
  );
}

function mutualInfoFunctionalProxy(
  conditionEntropyRatio: number,
  magnitude: number | null,
  penalty: number,
): number | null {
  if (magnitude === null) return null;
  const updateSignal = bounded(magnitude / (magnitude + 0.35));
  return Math.round(100 * conditionEntropyRatio * updateSignal * (1 - penalty * 0.35));
}

export function createFarTransferWindows(input: {
  existingWindows?: FarTransferWindow[];
  results: TrialResult[];
  sessionNumber: number;
}): FarTransferWindow[] {
  const existing = input.existingWindows || [];
  const grouped = new Map<string, TrialResult[]>();
  for (const result of input.results) {
    if (result.timingQuality === "poor") continue;
    const key = `${result.trial.construct}:${result.trial.cellKey}`;
    grouped.set(key, [...(grouped.get(key) || []), result]);
  }

  const windows: FarTransferWindow[] = [];
  for (const [key, group] of grouped) {
    if (group.length < 8) continue;
    const [construct, cellKey] = key.split(":") as ["ACC" | "BSE", CellKey];
    const estimate = estimateCapacityBps(group);
    const rts = group.map((result) => result.rtMs).filter((value): value is number => value !== null);
    const conditionEntropyBits = entropyBits(group.map(conditionSignature));
    const conditionEntropyRatio = bounded(conditionEntropyBits / 3.5);
    const penalty = timingPenalty(group);
    const previous = latestWindow(existing, construct, cellKey);
    const currentState = {
      capacityBps: estimate.capacityBps,
      balancedAccuracy: estimate.balancedAccuracy,
      lapseRate: estimate.lapseRate,
      timingPenalty: penalty,
      rtMedianMs: median(rts),
      conditionEntropyRatio,
    };
    const magnitude = updateMagnitude(previous, currentState);
    windows.push({
      modelVersion: FAR_TRANSFER_MODEL_VERSION,
      sessionNumber: input.sessionNumber,
      construct,
      cellKey,
      phase: group[0].trial.phase,
      transitionKey: group.find((result) => result.trial.transitionKey)?.trial.transitionKey || null,
      validTrials: estimate.validTrials,
      capacityBps: estimate.capacityBps,
      balancedAccuracy: estimate.balancedAccuracy,
      lapseRate: estimate.lapseRate,
      timingPenalty: penalty,
      rtMedianMs: currentState.rtMedianMs,
      rtIqrMs: iqr(rts),
      conditionEntropyBits,
      conditionEntropyRatio,
      updateMagnitude: magnitude,
      mutualInfoProxy: mutualInfoFunctionalProxy(conditionEntropyRatio, magnitude, penalty),
    });
  }

  return [...existing, ...windows].slice(-36);
}

function confidenceFor(evidence: CellEvidence | null): ConfidenceLabel {
  if (!evidence || evidence.validTrials < 80) return "insufficient_data";
  if (evidence.timingQuality === "poor") return "timing_limited";
  if (evidence.validTrials < 240) return "calibrating";
  if (Math.abs(evidence.recentCapacitySlope) > 0.08) return "unstable_estimate";
  return evidence.validTrials >= 360 ? "high_confidence" : "moderate_confidence";
}

function trendFor(evidence: CellEvidence | null): TrendLabel {
  if (!evidence || evidence.validTrials < 80) return "needs_more_data";
  if (Math.abs(evidence.recentCapacitySlope) <= 0.01) return "steady";
  if (evidence.recentCapacitySlope > 0.01) return "improving";
  if (Math.abs(evidence.recentCapacitySlope) > 0.08) return "variable_today";
  return "developing";
}

function trainingScore(bitsPerSec: number | null): number | null {
  if (bitsPerSec === null) return null;
  return Math.round(85 + bitsPerSec * 5);
}

function panel(evidence: CellEvidence | null): ScorePanel {
  const bitsPerSec = evidence?.currentCapacityBps ?? null;
  return {
    bitsPerSec,
    trainingScore: trainingScore(bitsPerSec),
    confidence: confidenceFor(evidence),
    trend: trendFor(evidence),
  };
}

function evidenceFor(evidence: CellEvidence[], construct: "ACC" | "BSE", cellKey: string): CellEvidence | null {
  return evidence.find((item) => item.construct === construct && item.cellKey === cellKey && item.currentCapacityBps !== null) || null;
}

function recoveryScore(source: CellEvidence | null, target: CellEvidence | null): number | null {
  if (!source?.currentCapacityBps || !target?.currentCapacityBps) return null;
  if (source.validTrials < 80 || target.validTrials < 40) return null;
  return Math.max(0, Math.min(100, Math.round((target.currentCapacityBps / source.currentCapacityBps) * 100)));
}

function matchedScratchBaseline(input: {
  baselines: ScratchBaseline[];
  construct: "ACC" | "BSE";
  targetCell: CellKey;
  protocolGroup: ProtocolGroup;
}): ScratchBaseline | null {
  const candidates = input.baselines.filter(
    (baseline) =>
      baseline.construct === input.construct &&
      baseline.targetCell === input.targetCell &&
      baseline.source !== "unavailable",
  );
  if (candidates.length === 0) return null;
  const priority: ScratchBaselineSource[] =
    input.protocolGroup === "commercial_arrows_first"
      ? ["historical_norm", "device_tier_norm", "personal_early_prior", "counterbalanced_cohort", "within_user_proxy"]
      : ["counterbalanced_cohort", "device_tier_norm", "historical_norm", "personal_early_prior", "within_user_proxy"];
  return (
    candidates
      .sort((a, b) => {
        const priorityDelta = priority.indexOf(a.source) - priority.indexOf(b.source);
        if (priorityDelta !== 0) return priorityDelta;
        return (b.cohortN || 0) - (a.cohortN || 0);
      })[0] || null
  );
}

function windowsForCell(
  windows: FarTransferWindow[],
  construct: "ACC" | "BSE",
  cellKey: CellKey,
): FarTransferWindow[] {
  return windows
    .filter((window) => window.construct === construct && window.cellKey === cellKey)
    .sort((a, b) => a.sessionNumber - b.sessionNumber);
}

function tau90Windows(windows: FarTransferWindow[], baseline: ScratchBaseline | null): number | null {
  const valid = windows.filter((window) => window.mutualInfoProxy !== null || window.capacityBps !== null);
  if (valid.length === 0) return null;
  const first = valid[0];
  const firstValue = first.mutualInfoProxy ?? first.capacityBps;
  const asymptote = baseline?.asymptoticMiProxy ?? valid[valid.length - 1].mutualInfoProxy ?? baseline?.asymptoticCapacityBps ?? valid[valid.length - 1].capacityBps;
  if (firstValue === null || asymptote === null) return null;
  const target = firstValue + 0.9 * (asymptote - firstValue);
  const direction = asymptote >= firstValue ? 1 : -1;
  const reachedIndex = valid.findIndex((window) => {
    const value = window.mutualInfoProxy ?? window.capacityBps;
    return value !== null && (value - target) * direction >= 0;
  });
  return reachedIndex < 0 ? null : reachedIndex + 1;
}

function coefficientOfVariation(values: number[]): number | null {
  if (values.length < 2) return null;
  const mean = values.reduce((total, value) => total + value, 0) / values.length;
  if (Math.abs(mean) < 0.0001) return null;
  const variance = values.reduce((total, value) => total + (value - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance) / Math.abs(mean);
}

function transferEfficiency(tauTransfer: number | null, baseline: ScratchBaseline | null): number | null {
  if (tauTransfer === null || !baseline?.tau90Windows || baseline.tau90Windows <= 0) return null;
  return bounded((baseline.tau90Windows - tauTransfer) / baseline.tau90Windows, -1, 1);
}

function stabilityAdvantage(windows: FarTransferWindow[], baseline: ScratchBaseline | null): number | null {
  if (!baseline?.stabilityCv || baseline.stabilityCv <= 0) return null;
  const values = windows
    .map((window) => window.updateMagnitude)
    .filter((value): value is number => value !== null);
  const cv = coefficientOfVariation(values);
  return cv === null ? null : bounded(1 - cv / baseline.stabilityCv, -1, 1);
}

function transferEfficiencyScore(input: {
  recovery: number;
  entropySupport: number;
  miSupport: number;
  timingPenalty: number;
  transferEfficiency: number | null;
  stabilityAdvantage: number | null;
  baseline: ScratchBaseline | null;
}): number {
  const timingSupport = 1 - input.timingPenalty * 0.2;
  const evidenceSupport = 0.66 + input.entropySupport * 0.18 + input.miSupport * 0.08;
  const hasScratch = input.baseline !== null && input.baseline.source !== "within_user_proxy";
  const baselineSupport = hasScratch
    ? 1 + (input.transferEfficiency ?? 0) * 0.24 + (input.stabilityAdvantage ?? 0) * 0.14
    : 0.84 + (input.transferEfficiency ?? 0) * 0.08;
  return Math.max(0, Math.min(100, Math.round(input.recovery * evidenceSupport * baselineSupport * timingSupport)));
}

function mixedStabilityScore(evidence: CellEvidence[]): number | null {
  const cells = ["arrow_abs", "flow_abs", "arrow_rel", "flow_rel"]
    .map((cell) => evidenceFor(evidence, "ACC", cell))
    .filter((item): item is CellEvidence => Boolean(item));
  if (cells.length < 4 || cells.some((item) => item.validTrials < 40 || item.currentCapacityBps === null)) return null;
  const capacities = cells.map((item) => item.currentCapacityBps || 0);
  const mean = capacities.reduce((total, value) => total + value, 0) / capacities.length;
  if (mean <= 0) return null;
  const variance = capacities.reduce((total, value) => total + (value - mean) ** 2, 0) / capacities.length;
  const cv = Math.sqrt(variance) / mean;
  return Math.max(0, Math.min(100, Math.round(100 - cv * 100)));
}

function component(
  label: string,
  transition: TransitionKey,
  completedTransitions: readonly TransitionKey[],
  score: number | null,
): TransferComponent {
  if (!completedTransitions.includes(transition)) {
    return {
      score: null,
      status: "coming_up",
      label,
      confidence: "insufficient_data",
    };
  }
  if (score === null) {
    return {
      score: null,
      status: "calibrating",
      label,
      confidence: "calibrating",
    };
  }
  return {
    score,
    status: "available",
    label,
    confidence: score >= 75 ? "moderate_confidence" : "calibrating",
  };
}

function boundarySignal(input: {
  boundary: TransitionKey;
  completedTransitions: readonly TransitionKey[];
  evidence: CellEvidence[];
  windows: FarTransferWindow[];
  scratchBaselines: ScratchBaseline[];
  protocolGroup: ProtocolGroup;
  sourceCell: CellKey;
  targetCell: CellKey;
}): FarTransferBoundarySignal {
  const source = evidenceFor(input.evidence, "ACC", input.sourceCell);
  const target = evidenceFor(input.evidence, "ACC", input.targetCell);
  const targetWindow = latestWindow(input.windows, "ACC", input.targetCell);
  const targetWindows = windowsForCell(input.windows, "ACC", input.targetCell);
  const scratchBaseline = matchedScratchBaseline({
    baselines: input.scratchBaselines,
    construct: "ACC",
    targetCell: input.targetCell,
    protocolGroup: input.protocolGroup,
  });
  const tauTransfer = tau90Windows(targetWindows, scratchBaseline);
  const efficiency = transferEfficiency(tauTransfer, scratchBaseline);
  const stability = stabilityAdvantage(targetWindows, scratchBaseline);
  const recovery = recoveryScore(source, target);
  if (!input.completedTransitions.includes(input.boundary)) {
    return {
      boundary: input.boundary,
      status: "not_reached",
      sourceCell: input.sourceCell,
      targetCell: input.targetCell,
      sourceCapacityBps: source?.currentCapacityBps ?? null,
      targetCapacityBps: target?.currentCapacityBps ?? null,
      recoveryRatio: null,
      entropySupport: null,
      mutualInfoProxy: null,
      scratchBaselineSource: "unavailable",
      scratchBaseline: null,
      tau90TransferWindows: null,
      transferEfficiency: null,
      stabilityAdvantage: null,
      functionalTransferScore: null,
    };
  }
  if (recovery === null) {
    return {
      boundary: input.boundary,
      status: "calibrating",
      sourceCell: input.sourceCell,
      targetCell: input.targetCell,
      sourceCapacityBps: source?.currentCapacityBps ?? null,
      targetCapacityBps: target?.currentCapacityBps ?? null,
      recoveryRatio: null,
      entropySupport: targetWindow?.conditionEntropyRatio ?? null,
      mutualInfoProxy: targetWindow?.mutualInfoProxy ?? null,
      scratchBaselineSource: scratchBaseline?.source ?? "unavailable",
      scratchBaseline,
      tau90TransferWindows: tauTransfer,
      transferEfficiency: efficiency,
      stabilityAdvantage: stability,
      functionalTransferScore: null,
    };
  }
  const entropySupport = targetWindow?.conditionEntropyRatio ?? 0.5;
  const miSupport = targetWindow?.mutualInfoProxy === null || targetWindow?.mutualInfoProxy === undefined
    ? 0.5
    : bounded(targetWindow.mutualInfoProxy / 100);
  return {
    boundary: input.boundary,
    status: "available",
    sourceCell: input.sourceCell,
    targetCell: input.targetCell,
    sourceCapacityBps: source?.currentCapacityBps ?? null,
    targetCapacityBps: target?.currentCapacityBps ?? null,
    recoveryRatio: recovery / 100,
    entropySupport,
    mutualInfoProxy: targetWindow?.mutualInfoProxy ?? null,
    scratchBaselineSource: scratchBaseline?.source ?? "unavailable",
    scratchBaseline,
    tau90TransferWindows: tauTransfer,
    transferEfficiency: efficiency,
    stabilityAdvantage: stability,
    functionalTransferScore: transferEfficiencyScore({
      recovery,
      entropySupport,
      miSupport,
      timingPenalty: targetWindow?.timingPenalty ?? 0,
      transferEfficiency: efficiency,
      stabilityAdvantage: stability,
      baseline: scratchBaseline,
    }),
  };
}

function createFarTransferEvidence(input: {
  evidence: CellEvidence[];
  completedTransitions: TransitionKey[];
  windows: FarTransferWindow[];
  scratchBaselines: ScratchBaseline[];
  protocolGroup: ProtocolGroup;
}): FarTransferEvidence {
  const flowFirst = input.protocolGroup === "validation_flow_first";
  const boundarySignals = [
    boundarySignal({
      boundary: "T_CM_BASE",
      completedTransitions: input.completedTransitions,
      evidence: input.evidence,
      windows: input.windows,
      scratchBaselines: input.scratchBaselines,
      protocolGroup: input.protocolGroup,
      sourceCell: flowFirst ? "flow_abs" : "arrow_abs",
      targetCell: flowFirst ? "arrow_abs" : "flow_abs",
    }),
    boundarySignal({
      boundary: "T_CM_REL",
      completedTransitions: input.completedTransitions,
      evidence: input.evidence,
      windows: input.windows,
      scratchBaselines: input.scratchBaselines,
      protocolGroup: input.protocolGroup,
      sourceCell: flowFirst ? "flow_rel" : "arrow_rel",
      targetCell: flowFirst ? "arrow_rel" : "flow_rel",
    }),
  ];
  return {
    modelVersion: FAR_TRANSFER_MODEL_VERSION,
    caveat: "functional_proxy_not_zhang_tang",
    summary:
      "Functional transfer evidence combines entropy-weighted condition variation, performance-vector update evidence, carrier-swap recovery, and matched scratch-baseline comparison when available.",
    protocolGroup: input.protocolGroup,
    windows: input.windows,
    boundarySignals,
  };
}

export function createScoreSnapshot(input: {
  sessionNumber: number;
  activePhase: PhaseLabel;
  phaseStatus: PhaseStatus;
  nominalBand: string | null;
  evidence: CellEvidence[];
  completedTransitions: TransitionKey[];
  farTransferWindows?: FarTransferWindow[];
  scratchBaselines?: ScratchBaseline[];
  protocolGroup?: ProtocolGroup;
}): AttentionScoreSnapshot {
  const activeAcc =
    input.evidence.find((item) => item.construct === "ACC" && item.currentCapacityBps !== null) || null;
  const activeBse =
    input.evidence.find((item) => item.construct === "BSE" && item.currentCapacityBps !== null) || null;
  const farTransfer = createFarTransferEvidence({
    evidence: input.evidence,
    completedTransitions: input.completedTransitions,
    windows: input.farTransferWindows || [],
    scratchBaselines: input.scratchBaselines || [],
    protocolGroup: input.protocolGroup || "commercial_arrows_first",
  });
  const motionSignal = farTransfer.boundarySignals.find((signal) => signal.boundary === "T_CM_BASE");
  const relationSignal = farTransfer.boundarySignals.find((signal) => signal.boundary === "T_CM_REL");
  const motion = component(
    "Motion Recovery",
    "T_CM_BASE",
    input.completedTransitions,
    motionSignal?.functionalTransferScore ?? null,
  );
  const relation = component(
    "Relation Recovery",
    "T_CM_REL",
    input.completedTransitions,
    relationSignal?.functionalTransferScore ?? null,
  );
  const mixed = component("Mixed Flexibility", "T_MIXED", input.completedTransitions, mixedStabilityScore(input.evidence));
  const delayed = component("Return Strength", "T_DELAYED", input.completedTransitions, mixedStabilityScore(input.evidence));
  const availableScores = [motion, relation, mixed, delayed].filter((item) => item.status === "available");
  const transferScore =
    availableScores.length > 0
      ? Math.round(
          availableScores.reduce((total, item) => total + (item.score || 65), 0) / availableScores.length,
        )
      : null;
  const status =
    transferScore === null
      ? input.sessionNumber >= TARGET_ENVELOPE_SESSIONS
        ? "not_enough_evidence"
        : "calibrating"
      : transferScore >= 80
        ? "strong"
        : "developing";
  return {
    sessionNumber: input.sessionNumber,
    activePhase: input.activePhase,
    phaseStatus: input.phaseStatus,
    nominalBand: input.nominalBand,
    attentionControl: panel(activeAcc),
    bindingFocus: {
      ...panel(activeBse),
      lagFlag:
        !activeBse || activeBse.validTrials < 80
          ? "insufficient_data"
          : activeBse.validTrials < (activeAcc?.validTrials || 0) / 2
            ? "lagging"
            : "on_track",
    },
    transfer: {
      score: transferScore,
      status,
      motionRecovery: motion,
      relationRecovery: relation,
      mixedFlexibility: mixed,
      returnStrength: delayed,
    },
    nextChallenge: {
      label: PHASE_NAMES[input.activePhase],
      state:
        input.phaseStatus === "ready_to_swap"
          ? "ready_next_session"
          : input.phaseStatus === "extended_for_learning_curve"
            ? "not_enough_evidence"
            : "current_phase",
    },
    farTransfer,
  };
}
