import { PHASE_CELL, PHASE_ORDER_BY_GROUP, TRANSITIONS, transitionEventsForPhaseAdvance } from "./protocol";
import type {
  BlockFeedbackPoint,
  CellKey,
  ConfidenceLabel,
  MiniBlockPlan,
  PhaseLabel,
  PhaseStatus,
  ProtocolGroup,
  TimingQuality,
  TrialResult,
  TransitionKey,
} from "./types";

export type InterblockPhaseLabel =
  | "improving"
  | "flattening"
  | "ready_to_switch"
  | "expected_dip"
  | "recovery_starting"
  | "stable_at_level"
  | "ready_to_mix"
  | "mixed_stable"
  | "delayed_recheck"
  | "support_needed"
  | "timing_limited";

export interface GraphPoint {
  label: string;
  rawValue: number | null;
  smoothedValue: number | null;
  deltaFromBaseline: number | null;
}

export interface InterblockGraph {
  label: string;
  unit: string;
  axisMin: number;
  axisMax: number;
  baseline: number | null;
  mode: "raw" | "delta";
  points: GraphPoint[];
}

export interface InterblockFeedback {
  isCalibrating: boolean;
  phaseLabel: InterblockPhaseLabel;
  phaseLabelText: string;
  interpretationText: string;
  nextActionText: string;
  confidenceLabel: ConfidenceLabel;
  timingQuality: TimingQuality;
  accuracyGraph: InterblockGraph;
  coreGraph: InterblockGraph;
}

function scoredResults(results: TrialResult[]): TrialResult[] {
  return results.filter((result) => !result.trial.isWarmup && result.timingQuality !== "poor");
}

function timingQuality(results: TrialResult[]): TimingQuality {
  if (results.some((result) => result.timingQuality === "poor")) return "poor";
  if (results.some((result) => result.timingQuality === "acceptable")) return "acceptable";
  return "good";
}

function confidenceForBlock(results: TrialResult[], quality: TimingQuality): ConfidenceLabel {
  if (quality === "poor") return "timing_limited";
  if (results.length < 10) return "insufficient_data";
  return "moderate_confidence";
}

function mean(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((total, value) => total + value, 0) / values.length;
}

function primaryCellForBlock(block: MiniBlockPlan, results: TrialResult[]): CellKey {
  return results[0]?.trial.cellKey || block.cells[0] || "mixed";
}

function blockTransitionKey(results: TrialResult[]): TransitionKey | null {
  return results.find((result) => result.trial.transitionKey)?.trial.transitionKey || null;
}

function blockMetrics(results: TrialResult[]) {
  const scored = scoredResults(results);
  const targetTrials = scored.filter((result) => result.trial.isMatch);
  const nonTargetTrials = scored.filter((result) => !result.trial.isMatch);
  const hits = targetTrials.filter((result) => result.response === "MATCH").length;
  const misses = targetTrials.length - hits;
  const falseAlarms = nonTargetTrials.filter((result) => result.response === "MATCH").length;
  const correctRejections = nonTargetTrials.length - falseAlarms;
  const hitRate = targetTrials.length ? hits / targetTrials.length : 0;
  const correctRejectionRate = nonTargetTrials.length ? correctRejections / nonTargetTrials.length : 0;
  const balancedAccuracy = targetTrials.length || nonTargetTrials.length ? (hitRate + correctRejectionRate) / 2 : 0;
  return {
    scored,
    accuracy: scored.length ? scored.filter((result) => result.isCorrect).length / scored.length : 0,
    balancedAccuracy,
    falseAlarmRate: nonTargetTrials.length ? falseAlarms / nonTargetTrials.length : null,
    missRate: targetTrials.length ? misses / targetTrials.length : null,
  };
}

export function createBlockFeedbackPoint(input: {
  programmeRunId: string;
  programmeCycle: number;
  sessionNumber: number;
  phase: PhaseLabel;
  phaseStatus: PhaseStatus;
  block: MiniBlockPlan;
  results: TrialResult[];
  createdAt?: string;
}): BlockFeedbackPoint | null {
  if (input.results.length === 0) return null;
  const metrics = blockMetrics(input.results);
  const quality = timingQuality(input.results);
  return {
    programmeRunId: input.programmeRunId,
    programmeCycle: input.programmeCycle,
    sessionNumber: input.sessionNumber,
    phase: input.phase,
    phaseStatus: input.phaseStatus,
    blockIndex: input.block.index,
    blockId: input.block.id,
    wrapperId: input.block.wrapperId,
    construct: input.block.construct,
    cellKey: primaryCellForBlock(input.block, input.results),
    accuracy: metrics.accuracy,
    balancedAccuracy: metrics.balancedAccuracy,
    coreMetricName: "n_back_level",
    coreMetricValue: input.block.nLevel,
    coreMetricUnit: "level",
    falseAlarmRate: metrics.falseAlarmRate,
    missRate: metrics.missRate,
    lapseRate: metrics.missRate,
    timingQuality: quality,
    confidenceLabel: confidenceForBlock(input.results, quality),
    transitionKey: blockTransitionKey(input.results),
    createdAt: input.createdAt || new Date().toISOString(),
  };
}

function baseline(values: Array<number | null>): number | null {
  const first = values.find((value): value is number => value !== null && Number.isFinite(value));
  return first ?? null;
}

function trailingAverage(values: Array<number | null>, index: number): number | null {
  const window = values.slice(Math.max(0, index - 2), index + 1).filter((value): value is number => value !== null);
  return mean(window);
}

function graphPoints(points: BlockFeedbackPoint[], metric: "accuracy" | "core"): GraphPoint[] {
  const raw = points.map((point) => metric === "accuracy" ? point.balancedAccuracy * 100 : point.coreMetricValue);
  const base = baseline(raw);
  return points.map((point, index) => {
    const rawValue = raw[index] ?? null;
    return {
      label: `S${point.sessionNumber} B${point.blockIndex}`,
      rawValue,
      smoothedValue: trailingAverage(raw, index),
      deltaFromBaseline: rawValue === null || base === null ? null : rawValue - base,
    };
  });
}

function slope(points: GraphPoint[]): number | null {
  if (points.length < 2) return null;
  const current = points[points.length - 1]?.rawValue;
  const previous = points[points.length - 2]?.rawValue;
  return current === null || previous === null ? null : current - previous;
}

function trend(value: number | null, threshold: number): "rising" | "falling" | "flat" {
  if (value === null) return "flat";
  if (value > threshold) return "rising";
  if (value < -threshold) return "falling";
  return "flat";
}

function isMixedPhase(phase: PhaseLabel): boolean {
  return (
    phase === "P5_ARROW_MIXED" ||
    phase === "P6_FLOW_MIXED" ||
    phase === "P5_FLOW_MIXED" ||
    phase === "P6_ARROW_MIXED" ||
    phase === "P7_FULL_MIXED" ||
    phase === "P10_BIND_MIXED" ||
    phase === "P5_MIXED"
  );
}

function isDelayedPhase(phase: PhaseLabel): boolean {
  return phase === "P11_DELAYED" || phase === "P6_DELAYED";
}

function isBindingPhase(phase: PhaseLabel): boolean {
  return (
    phase === "P8_BIND_ARROW_REL" ||
    phase === "P9_BIND_FLOW_REL" ||
    phase === "P8_BIND_FLOW_REL" ||
    phase === "P9_BIND_ARROW_REL" ||
    phase === "P10_BIND_MIXED"
  );
}

function labelText(label: InterblockPhaseLabel): string {
  return {
    improving: "Improving",
    flattening: "Flattening",
    ready_to_switch: "Ready to switch",
    expected_dip: "Expected dip",
    recovery_starting: "Recovery starting",
    stable_at_level: "Stable at this level",
    ready_to_mix: "Ready to mix",
    mixed_stable: "Mixed stable",
    delayed_recheck: "Delayed re-check",
    support_needed: "Support needed",
    timing_limited: "Timing limited",
  }[label];
}

export function getInterblockPhaseLabel(input: {
  wapStatus: PhaseStatus;
  phase: PhaseLabel;
  recentAccuracySlope: number | null;
  recentCoreMetricSlope: number | null;
  postSwap: boolean;
  timingQuality: TimingQuality;
  falseAlarmRate: number | null;
  missRate: number | null;
  pointCount: number;
}): InterblockPhaseLabel {
  if (input.timingQuality === "poor") return "timing_limited";
  if ((input.falseAlarmRate ?? 0) > 0.35 || (input.missRate ?? 0) > 0.35) return "support_needed";
  if (isDelayedPhase(input.phase)) return "delayed_recheck";
  if (input.wapStatus === "ready_to_swap") return "ready_to_switch";
  if (input.pointCount < 2) return "stable_at_level";
  const accuracyTrend = trend(input.recentAccuracySlope, 3);
  const coreTrend = trend(input.recentCoreMetricSlope, 0.25);
  if (input.postSwap && accuracyTrend === "falling") return "expected_dip";
  if (input.postSwap && accuracyTrend === "rising") return "recovery_starting";
  if (isMixedPhase(input.phase) && accuracyTrend !== "falling" && coreTrend !== "falling") return "mixed_stable";
  if (input.wapStatus === "flattening") return "flattening";
  if (accuracyTrend === "rising" && coreTrend === "rising") return "improving";
  if (accuracyTrend === "flat" && coreTrend === "rising") return "improving";
  if (accuracyTrend === "rising" && coreTrend === "flat") return "stable_at_level";
  if (accuracyTrend === "flat" && coreTrend === "flat") return "flattening";
  if (accuracyTrend === "falling" && coreTrend === "falling") return "support_needed";
  return "stable_at_level";
}

function interpretationFor(label: InterblockPhaseLabel, calibrating: boolean): string {
  if (calibrating) return "Baseline started. We'll show the curve as more blocks are completed.";
  return {
    improving: "You are improving and handling more demand.",
    flattening: "Your curve is flattening. This may be a good transfer point.",
    ready_to_switch: "Ready for a format change. The surface changes, but the core demand stays familiar.",
    expected_dip: "The dip is expected. The surface changed.",
    recovery_starting: "You are recovering the same skill in the new format.",
    stable_at_level: "Same level, better control.",
    ready_to_mix: "Ready to mix formats.",
    mixed_stable: "The rule is holding across formats.",
    delayed_recheck: "This checks whether the pattern comes back after time has passed.",
    support_needed: "This block looked too costly. We will simplify.",
    timing_limited: "Timing quality limited this block, so read the graph cautiously.",
  }[label];
}

function nextActionFor(label: InterblockPhaseLabel, calibrating: boolean): string {
  if (calibrating) return "Next: complete another guided block.";
  if (label === "ready_to_switch") return "Next: try the same pattern in a new format.";
  if (label === "expected_dip" || label === "recovery_starting") return "Next: recover reliability before pushing level.";
  if (label === "support_needed" || label === "timing_limited") return "Next: repeat or simplify before moving on.";
  if (label === "mixed_stable" || label === "ready_to_mix") return "Next: keep the rule steady as formats change.";
  return "Next: continue the guided route.";
}

export function buildInterblockFeedback(input: {
  history: BlockFeedbackPoint[];
  currentProgrammeRunId: string;
  wapStatus: PhaseStatus;
  phase: PhaseLabel;
}): InterblockFeedback | null {
  const points = input.history
    .filter((point) => point.programmeRunId === input.currentProgrammeRunId)
    .slice(-20);
  if (points.length === 0) return null;
  const accuracyPoints = graphPoints(points, "accuracy");
  const corePoints = graphPoints(points, "core");
  const latest = points[points.length - 1];
  const calibrating = points.length < 2;
  const label = getInterblockPhaseLabel({
    wapStatus: input.wapStatus,
    phase: input.phase,
    recentAccuracySlope: calibrating ? null : slope(accuracyPoints),
    recentCoreMetricSlope: calibrating ? null : slope(corePoints),
    postSwap: Boolean(latest.transitionKey),
    timingQuality: latest.timingQuality,
    falseAlarmRate: latest.falseAlarmRate,
    missRate: latest.missRate,
    pointCount: points.length,
  });
  return {
    isCalibrating: calibrating,
    phaseLabel: label,
    phaseLabelText: labelText(label),
    interpretationText: interpretationFor(label, calibrating),
    nextActionText: nextActionFor(label, calibrating),
    confidenceLabel: latest.confidenceLabel,
    timingQuality: latest.timingQuality,
    accuracyGraph: {
      label: "Reliability",
      unit: "%",
      axisMin: 0,
      axisMax: 100,
      baseline: baseline(points.map((point) => point.balancedAccuracy * 100)),
      mode: "raw",
      points: accuracyPoints,
    },
    coreGraph: {
      label: isBindingPhase(input.phase) ? "Binding Memory" : "Relational Memory",
      unit: "N-level",
      axisMin: 1,
      axisMax: 7,
      baseline: baseline(points.map((point) => point.coreMetricValue)),
      mode: "raw",
      points: corePoints,
    },
  };
}

function transitionKeyForCurrentPhase(phase: PhaseLabel, group: ProtocolGroup): TransitionKey | null {
  const order = PHASE_ORDER_BY_GROUP[group];
  const phaseIndex = order.indexOf(phase);
  if (phaseIndex <= 0) return null;
  const previousPhase = order[phaseIndex - 1];
  return transitionEventsForPhaseAdvance(previousPhase, phase)[0] || null;
}

function frameForPhase(phase: PhaseLabel): "absolute" | "relational" | "mixed" {
  const cell = PHASE_CELL[phase];
  if (cell === "mixed") return "mixed";
  return cell.endsWith("_rel") ? "relational" : "absolute";
}

export function invariantPromptKey(phase: PhaseLabel, group: ProtocolGroup, programmeRunId: string): string | null {
  const transitionKey = transitionKeyForCurrentPhase(phase, group);
  return transitionKey ? `${programmeRunId}:${phase}:${transitionKey}` : null;
}

export function getInvariantPrompt(input: {
  phase: PhaseLabel;
  protocolGroup: ProtocolGroup;
}): string | null {
  const transitionKey = transitionKeyForCurrentPhase(input.phase, input.protocolGroup);
  if (!transitionKey) return null;
  if (isBindingPhase(input.phase)) return "The look will change. Keep the pair together.";
  const transition = TRANSITIONS[transitionKey];
  if (transition.type === "carrier_swap") {
    return frameForPhase(input.phase) === "relational"
      ? "New format, same memory task. Work out the pattern, then compare it with n-back."
      : "The look will change. Hold the label, not the look.";
  }
  if (transition.type === "frame_ramp") return "Now the pattern depends on the centre. Hold the centre-relative label.";
  if (transition.type === "mixed_switch") return "The format may change from trial to trial. Identify the label first, then compare it with n-back.";
  if (transition.type === "delayed_recheck") return "Can you recover the same pattern after time has passed?";
  return null;
}
