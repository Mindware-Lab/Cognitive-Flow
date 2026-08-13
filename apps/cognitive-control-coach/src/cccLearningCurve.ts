import { CCC_LEARNING_CURVE, CCC_REGIMES, CCC_TRIAL_TIMING } from "./cccConfig";
import type {
  CccAttentionBlockPlan,
  CccLearningCurveConfig,
  CccLearningCurveHistoryPoint,
  CccRecordedTrial,
} from "./cccTypes";

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
    accuracyReady: boolean;
    omissionsReady: boolean;
    slopeReady: boolean;
    rangeReady: boolean;
    learningObserved: boolean;
  };
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

function pointFor(microcycleIndex: number, results: readonly CccRecordedTrial[]): CurvePoint {
  const correct = results.filter((result) => result.scoring.isCorrect).length;
  const omissions = results.filter((result) => result.scoring.isOmission).length;
  const accuracy = results.length ? correct / results.length : 0;
  const omissionRate = results.length ? omissions / results.length : 1;
  const efficiency = mean(results.map(valueEfficiency));
  return {
    microcycleIndex,
    observationCount: results.length,
    accuracy,
    omissionRate,
    valueEfficiency: efficiency,
    // Accuracy remains primary; payoff efficiency adds the regime-sensitive
    // speed/accuracy policy component without treating faster as inherently better.
    performanceIndex: 0.65 * accuracy + 0.35 * efficiency,
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
      accuracyReady: false,
      omissionsReady: false,
      slopeReady: false,
      rangeReady: false,
      learningObserved: false,
    },
  };
}

export function evaluateCccLearningCurve(
  block: CccAttentionBlockPlan,
  allResults: readonly CccRecordedTrial[],
  config: CccLearningCurveConfig = CCC_LEARNING_CURVE,
  history: readonly CccLearningCurveHistoryPoint[] = [],
): CccLearningCurveDecision {
  if (block.learningCurveGate !== "source_stabilisation") return emptyDecision();
  const currentPoints = learningCurvePointsForResults(block, allResults);
  const points = [
    ...history.map(({ sessionId: _sessionId, ...point }) => point),
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
  const performanceSlope = slope(recentValues);
  const early = points.slice(0, Math.max(2, points.length - config.recentWindowMicrocycles));
  const performanceGain = recentPerformance === null || !early.length
    ? null
    : recentPerformance - mean(early.map((point) => point.performanceIndex));
  const recentRange = recentValues.length
    ? Math.max(...recentValues) - Math.min(...recentValues)
    : null;
  const checks = {
    minimumExposure: completedMicrocycles >= config.minimumBalancedMicrocycles,
    accuracyReady: recentAccuracy !== null && recentAccuracy >= config.accuracyFloor,
    omissionsReady: recentOmissionRate !== null && recentOmissionRate <= config.omissionCeiling,
    slopeReady: performanceSlope !== null && Math.abs(performanceSlope) <= config.maximumAbsoluteSlope,
    rangeReady: recentRange !== null && recentRange <= config.maximumRecentRange,
    learningObserved: performanceGain !== null
      && (performanceGain >= config.minimumLearningGain || (recentPerformance ?? 0) >= config.highPerformanceBypass),
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
  if (block.learningCurveGate !== "source_stabilisation") return [];
  const eligible = allResults.filter((result) => result.trial.blockId === block.id
    && result.scoring.countsTowardQuota
    && result.trial.operator === "attention"
    && result.trial.presentationMode === "self_paced_value"
    && !result.trial.diagnostic);
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
    .map(([index, results]) => pointFor(index, results.slice(0, expectedPerCycle)));
}

export function isCccLearningCurveBoundary(
  block: CccAttentionBlockPlan,
  results: readonly CccRecordedTrial[],
): boolean {
  if (block.learningCurveGate !== "source_stabilisation") return false;
  const eligible = results.filter((result) => result.scoring.countsTowardQuota);
  const perCycle = CCC_TRIAL_TIMING.validTrialsPerRegimeMicrocycle * block.regimePair.length;
  return eligible.length > 0 && eligible.length % perCycle === 0;
}
