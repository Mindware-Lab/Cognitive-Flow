import { CCC_LEARNING_CURVE, CCC_REGIMES, CCC_TRIAL_TIMING } from "./cccConfig";
import { CCC_SIGNAL_INFORMATION_BITS } from "./cccSignal";
import type {
  CccAttentionLearningStage,
  CccAttentionBlockPlan,
  CccLearningCurveConfig,
  CccLearningCurveHistoryPoint,
  CccRecordedTrial,
} from "./cccTypes";

export const CCC_ATTENTION_MAX_INFORMATION_THROUGHPUT_BPS = CCC_SIGNAL_INFORMATION_BITS["3:2"]
  / (CCC_TRIAL_TIMING.minimumExposureBeforeAnswerMs / 1000);

export type CccLearningCurveStatus =
  | "not_applicable"
  | "collecting"
  | "still_improving"
  | "stabilised"
  | "exposure_ceiling";

export interface CccLearningCurvePoint {
  microcycleIndex: number;
  observationCount: number;
  accuracy: number;
  omissionRate: number;
  valueEfficiency: number;
  informationThroughputBps: number;
  performanceIndex: number;
}

type CurvePoint = Omit<CccLearningCurveHistoryPoint, "sessionId">;

export interface CccLearningCurveDecision {
  status: CccLearningCurveStatus;
  shouldEndBlock: boolean;
  completedMicrocycles: number;
  completedTrials: number;
  recentAccuracy: number | null;
  recentOmissionRate: number | null;
  recentPerformance: number | null;
  performanceSlope: number | null;
  performanceGain: number | null;
  recentRange: number | null;
  points: CccLearningCurvePoint[];
  checks: {
    minimumExposure: boolean;
    slopeReady: boolean;
    rangeReady: boolean;
  };
}

function hasLearningCurveGate(block: CccAttentionBlockPlan): boolean {
  return block.learningCurveGate === "stage_stabilisation" || block.learningCurveGate === "source_stabilisation";
}

export function attentionLearningStageForBlock(block: CccAttentionBlockPlan): CccAttentionLearningStage | null {
  if (block.phase === "arrow_rel_stabilisation" || block.phase === "p1a_arrow_stabilisation") return "arrow_stabilisation";
  if (block.phase === "flow_rel_recovery" || block.phase === "p1a_flow_recovery") return "flow_recovery";
  if (block.phase === "arrow_rel_return" || block.phase === "p1a_arrow_return") return "arrow_return";
  if (block.phase === "relative_mix" || block.phase === "p1a_relative_mix") return "mixed";
  if (block.phase === "p1a_delayed_recheck") return "delayed_recheck";
  if (block.phase === "p1c_delayed_reentry") return "final_delayed_reentry";
  return null;
}

function mean(values: readonly number[]): number {
  return values.length ? values.reduce((total, value) => total + value, 0) / values.length : 0;
}

function slope(values: readonly number[]): number | null {
  if (values.length < 2) return null;
  const centre = (values.length - 1) / 2;
  const numerator = values.reduce((total, value, index) => total + (index - centre) * (value - mean(values)), 0);
  const denominator = values.reduce((total, _value, index) => total + (index - centre) ** 2, 0);
  return denominator > 0 ? numerator / denominator : null;
}

function valueEfficiency(result: CccRecordedTrial): number {
  if (!result.scoring.isValidDecision || !result.scoring.isCorrect) return 0;
  const regime = CCC_REGIMES[result.trial.regimeId];
  const denominator = regime.correctPot + regime.errorLoss;
  return denominator > 0
    ? Math.max(0, Math.min(1, (result.scoring.pointsRealised + regime.errorLoss) / denominator))
    : 0;
}

/**
 * MFT-M-derived correct information throughput. The grouping-search entropy
 * attached to each majority ratio is credited only when that relation is
 * resolved correctly, while every observation contributes its effective
 * processing time. This is an app training metric in bits/s, not a validated
 * MFT-M or MFT-M-R capacity estimate.
 */
export function cccInformationThroughputBps(results: readonly CccRecordedTrial[]): number {
  const observations = results.filter((result) => result.scoring.countsTowardQuota);
  const correctBits = observations.reduce(
    (total, result) => total + (result.scoring.isCorrect ? CCC_SIGNAL_INFORMATION_BITS[result.trial.ratio] : 0),
    0,
  );
  const processingMs = observations.reduce((total, result) => {
    const measured = result.scoring.valueTimeMs
      ?? result.trial.exposureMsRequested
      ?? CCC_TRIAL_TIMING.maxResponseWindowMs;
    return total + Math.max(1, measured);
  }, 0);
  return processingMs > 0 ? correctBits / (processingMs / 1000) : 0;
}

export function cccLearningCurvePointForResults(
  microcycleIndex: number,
  results: readonly CccRecordedTrial[],
): CurvePoint {
  const correct = results.filter((result) => result.scoring.isCorrect).length;
  const omissions = results.filter((result) => result.scoring.isOmission).length;
  const accuracy = results.length ? correct / results.length : 0;
  const omissionRate = results.length ? omissions / results.length : 1;
  const efficiency = mean(results.map(valueEfficiency));
  const informationThroughputBps = cccInformationThroughputBps(results);
  return {
    microcycleIndex,
    observationCount: results.length,
    accuracy,
    omissionRate,
    valueEfficiency: efficiency,
    informationThroughputBps,
    // Kept as the generic persisted curve ordinate.
    performanceIndex: informationThroughputBps,
  };
}

function emptyDecision(status: CccLearningCurveStatus = "not_applicable"): CccLearningCurveDecision {
  return {
    status,
    shouldEndBlock: false,
    completedMicrocycles: 0,
    completedTrials: 0,
    recentAccuracy: null,
    recentOmissionRate: null,
    recentPerformance: null,
    performanceSlope: null,
    performanceGain: null,
    recentRange: null,
    points: [],
    checks: {
      minimumExposure: false,
      slopeReady: false,
      rangeReady: false,
    },
  };
}

export function evaluateCccLearningCurve(
  block: CccAttentionBlockPlan,
  allResults: readonly CccRecordedTrial[],
  config: CccLearningCurveConfig = CCC_LEARNING_CURVE,
  history: readonly CccLearningCurveHistoryPoint[] = [],
): CccLearningCurveDecision {
  if (!hasLearningCurveGate(block)) return emptyDecision();
  const currentPoints = learningCurvePointsForResults(block, allResults);
  const learningStage = attentionLearningStageForBlock(block);
  const relevantHistory = history.filter((point) => point.wrapperStage === learningStage
    || (point.wrapperStage === undefined && learningStage === "arrow_stabilisation"));
  const points = [
    ...relevantHistory.map(({ sessionId: _sessionId, wrapperStage: _wrapperStage, ...point }) => point),
    ...currentPoints,
  ].map((point, index) => ({ ...point, microcycleIndex: index + 1 }));
  if (!points.length) return emptyDecision("collecting");

  const currentMicrocycles = currentPoints.length;
  const completedMicrocycles = points.length;
  const completedTrials = points.reduce((total, point) => total + point.observationCount, 0);
  const recent = points.slice(-config.recentWindowMicrocycles);
  const recentTrialCount = recent.reduce((total, point) => total + point.observationCount, 0);
  const recentAccuracy = recentTrialCount
    ? recent.reduce((total, point) => total + point.accuracy * point.observationCount, 0) / recentTrialCount
    : null;
  const recentOmissionRate = recentTrialCount
    ? recent.reduce((total, point) => total + point.omissionRate * point.observationCount, 0) / recentTrialCount
    : null;
  const recentValues = recent.map((point) => point.performanceIndex);
  const recentPerformance = recentValues.length ? mean(recentValues) : null;
  const recentScale = Math.max(0.05, Math.abs(recentPerformance ?? 0));
  const rawPerformanceSlope = slope(recentValues);
  const performanceSlope = rawPerformanceSlope === null ? null : rawPerformanceSlope / recentScale;
  const early = points.slice(0, Math.max(2, points.length - config.recentWindowMicrocycles));
  const performanceGain = recentPerformance === null || !early.length
    ? null
    : recentPerformance - mean(early.map((point) => point.performanceIndex));
  const recentRange = recentValues.length
    ? (Math.max(...recentValues) - Math.min(...recentValues)) / recentScale
    : null;
  const checks = {
    minimumExposure: completedMicrocycles >= config.minimumBalancedMicrocycles,
    slopeReady: performanceSlope !== null && Math.abs(performanceSlope) <= config.maximumAbsoluteSlope,
    rangeReady: recentRange !== null && recentRange <= config.maximumRecentRange,
  };
  const stabilised = currentMicrocycles >= 1 && Object.values(checks).every(Boolean);
  const atCeiling = currentMicrocycles >= config.maximumBalancedMicrocycles;
  return {
    status: stabilised
      ? "stabilised"
      : atCeiling
        ? "exposure_ceiling"
        : checks.minimumExposure
          ? "still_improving"
          : "collecting",
    // Both outcomes end today's stabilisation block, but only `stabilised`
    // authorises a wrapper change. The caller must treat the exposure ceiling
    // as a session stop and resume the familiar wrapper later.
    shouldEndBlock: stabilised || atCeiling,
    completedMicrocycles,
    completedTrials,
    recentAccuracy,
    recentOmissionRate,
    recentPerformance,
    performanceSlope,
    performanceGain,
    recentRange,
    points,
    checks,
  };
}

export function learningCurvePointsForResults(
  block: CccAttentionBlockPlan,
  allResults: readonly CccRecordedTrial[],
): CccLearningCurvePoint[] {
  if (!hasLearningCurveGate(block)) return [];
  const eligible = allResults.filter((result) => result.trial.blockId === block.id
    && result.scoring.countsTowardQuota
    && result.trial.operator === "attention"
    && result.trial.presentationMode === "self_paced_value"
    && (!result.trial.diagnostic || result.trial.purpose === "delayed_recheck"));
  const expectedPerCycle = CCC_TRIAL_TIMING.validTrialsPerRegimeMicrocycle * block.regimePair.length;
  const groups = new Map<number, CccRecordedTrial[]>();
  for (const result of eligible) {
    const group = groups.get(result.trial.microcycleIndex) || [];
    group.push(result);
    groups.set(result.trial.microcycleIndex, group);
  }
  return [...groups.entries()]
    .filter(([, results]) => results.length >= expectedPerCycle)
    .sort(([left], [right]) => left - right)
    .map(([index, results]) => cccLearningCurvePointForResults(index, results.slice(0, expectedPerCycle)));
}

export function isCccLearningCurveBoundary(
  block: CccAttentionBlockPlan,
  results: readonly CccRecordedTrial[],
): boolean {
  if (!hasLearningCurveGate(block)) return false;
  const eligible = results.filter((result) => result.scoring.countsTowardQuota);
  const perCycle = CCC_TRIAL_TIMING.validTrialsPerRegimeMicrocycle * block.regimePair.length;
  return eligible.length > 0 && eligible.length % perCycle === 0;
}
