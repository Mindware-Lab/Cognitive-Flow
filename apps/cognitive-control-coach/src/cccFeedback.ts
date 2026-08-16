import { CCC_REGIMES } from "./cccConfig";
import { cccInformationThroughputBps } from "./cccLearningCurve";
import { signalDemandBitsPerSecond } from "./cccSignal";
import { cccWmInformationThroughputBps } from "./cccWmProgress";
import type { CccRatio, CccRecordedTrial, CccRegimeId, CccSessionMetrics } from "./cccTypes";

export interface CccClarityMetric {
  ratio: CccRatio;
  label: string;
  count: number;
  accuracy: number | null;
  medianDecisionMs: number | null;
}

export interface CccNicheMetric {
  regimeId: CccRegimeId;
  label: string;
  count: number;
  accuracy: number | null;
  medianDecisionMs: number | null;
  points: number;
  pointsKeptPercent: number;
}

export interface CccBlockFeedback {
  observationCount: number;
  attentionThroughputBps: number | null;
  wmThroughputBps: number | null;
  accuracy: number | null;
  omissionCount: number;
  medianDecisionMs: number | null;
  points: number;
  pointsKeptPercent: number;
  clarity: CccClarityMetric[];
  niches: CccNicheMetric[];
  timingShiftMs: number | null;
  attentionControlBps: number | null;
  signalTimingQuality: "good" | "mixed" | "poor" | "insufficient";
  wmBalancedAccuracy: number | null;
  wmMissRate: number | null;
  wmFalseAlarmRate: number | null;
  wmLureFalseAlarmRate: number | null;
}

function median(values: readonly number[]): number | null {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

function scoredObservations(results: readonly CccRecordedTrial[]): CccRecordedTrial[] {
  return results.filter((result) => result.scoring.countsTowardQuota);
}

function accuracy(results: readonly CccRecordedTrial[]): number | null {
  const observations = scoredObservations(results);
  return observations.length ? observations.filter((result) => result.scoring.isCorrect).length / observations.length : null;
}

function medianDecisionMs(results: readonly CccRecordedTrial[]): number | null {
  return median(results
    .filter((result) => result.scoring.responseClass === "answer" && result.scoring.valueTimeMs !== null)
    .map((result) => Number(result.scoring.valueTimeMs)));
}

function pointsKeptPercent(results: readonly CccRecordedTrial[]): number {
  const observations = scoredObservations(results).filter((result) => result.trial.presentationMode === "self_paced_value");
  const available = observations.reduce((total, result) => total + CCC_REGIMES[result.trial.regimeId].correctPot, 0);
  const realised = observations.reduce((total, result) => total + result.scoring.pointsRealised, 0);
  return available > 0 ? Math.round(Math.max(0, Math.min(1, realised / available)) * 100) : 0;
}

function estimateAttentionControlBps(results: readonly CccRecordedTrial[]): number | null {
  const valid = results.filter((result) => result.trial.estimand === "signal_capacity"
    && result.scoring.countsTowardQuota
    && result.timingQuality !== "poor"
    && signalDemandBitsPerSecond(result) !== null);
  if (valid.length < 16) return null;
  const chance = 0.5;
  const lapse = 0.08;
  const usable = 1 - chance - lapse;
  const scale = 1.15;
  let bestTheta = 1;
  let bestLoss = Number.POSITIVE_INFINITY;
  for (let theta = 0.5; theta <= 18; theta += 0.05) {
    let loss = 0;
    for (const result of valid) {
      const demand = signalDemandBitsPerSecond(result) || 0;
      const p = Math.max(0.001, Math.min(0.999, chance + usable / (1 + Math.exp(-(theta - demand) / scale))));
      loss += result.scoring.isCorrect ? -Math.log(p) : -Math.log(1 - p);
    }
    if (loss < bestLoss) {
      bestLoss = loss;
      bestTheta = theta;
    }
  }
  const target = Math.max(0.01, Math.min(0.99, (0.75 - chance) / usable));
  return Math.round(Math.max(0.5, bestTheta - Math.log(target / (1 - target)) * scale) * 10) / 10;
}

function signalTimingQuality(results: readonly CccRecordedTrial[]): CccBlockFeedback["signalTimingQuality"] {
  const signal = results.filter((result) => result.trial.estimand === "signal_capacity" && result.scoring.countsTowardQuota);
  if (signal.length < 16) return "insufficient";
  const poor = signal.filter((result) => result.timingQuality === "poor").length;
  const acceptable = signal.filter((result) => result.timingQuality === "acceptable").length;
  if (poor / signal.length > 0.1) return "poor";
  if (acceptable || poor) return "mixed";
  return "good";
}

function isCarefulNiche(regimeId: CccRegimeId): boolean {
  const regime = CCC_REGIMES[regimeId];
  return regime.errorLoss / Math.max(0.1, regime.drainPointsPerSecond) >= 8;
}

export function buildCccBlockFeedback(results: readonly CccRecordedTrial[]): CccBlockFeedback {
  const observations = scoredObservations(results);
  const clarityLabels: Record<CccRatio, string> = { "5:0": "Clear", "4:1": "Mixed", "3:2": "Close" };
  const clarity = (["5:0", "4:1", "3:2"] as const).map((ratio) => {
    const group = results.filter((result) => result.trial.ratio === ratio);
    return {
      ratio,
      label: clarityLabels[ratio],
      count: scoredObservations(group).length,
      accuracy: accuracy(group),
      medianDecisionMs: medianDecisionMs(group),
    };
  });
  const regimeIds = Array.from(new Set(results.map((result) => result.trial.regimeId)));
  const niches = regimeIds.map((regimeId) => {
    const group = results.filter((result) => result.trial.regimeId === regimeId);
    return {
      regimeId,
      label: CCC_REGIMES[regimeId].label,
      count: scoredObservations(group).length,
      accuracy: accuracy(group),
      medianDecisionMs: medianDecisionMs(group),
      points: group.reduce((total, result) => total + result.scoring.pointsRealised, 0),
      pointsKeptPercent: pointsKeptPercent(group),
    };
  });
  const carefulTimes = niches.filter((niche) => isCarefulNiche(niche.regimeId) && niche.medianDecisionMs !== null).map((niche) => Number(niche.medianDecisionMs));
  const quickTimes = niches.filter((niche) => !isCarefulNiche(niche.regimeId) && niche.medianDecisionMs !== null).map((niche) => Number(niche.medianDecisionMs));
  const carefulMedian = median(carefulTimes);
  const quickMedian = median(quickTimes);
  const wm = observations.filter((result) => result.trial.operator === "relational_wm" && !result.trial.wmBuffer);
  const wmMatches = wm.filter((result) => result.trial.wmIsMatch === true);
  const wmDifferent = wm.filter((result) => result.trial.wmIsMatch === false);
  const wmLures = wm.filter((result) => result.trial.wmLureType === "wrong_lag");
  const wmHitRate = wmMatches.length ? wmMatches.filter((result) => result.scoring.isCorrect).length / wmMatches.length : null;
  const wmCorrectRejectionRate = wmDifferent.length ? wmDifferent.filter((result) => result.scoring.isCorrect).length / wmDifferent.length : null;
  const attention = observations.filter((result) => result.trial.operator === "attention"
    && result.trial.estimand !== "signal_capacity");

  return {
    observationCount: observations.length,
    attentionThroughputBps: attention.length ? cccInformationThroughputBps(attention) : null,
    wmThroughputBps: cccWmInformationThroughputBps(wm),
    accuracy: accuracy(results),
    omissionCount: observations.filter((result) => result.scoring.responseClass === "omission").length,
    medianDecisionMs: medianDecisionMs(results),
    points: results.reduce((total, result) => total + result.scoring.pointsRealised, 0),
    pointsKeptPercent: pointsKeptPercent(results),
    clarity,
    niches,
    timingShiftMs: carefulMedian !== null && quickMedian !== null ? Math.round(carefulMedian - quickMedian) : null,
    attentionControlBps: estimateAttentionControlBps(results),
    signalTimingQuality: signalTimingQuality(results),
    wmBalancedAccuracy: wmHitRate === null || wmCorrectRejectionRate === null ? null : (wmHitRate + wmCorrectRejectionRate) / 2,
    wmMissRate: wmMatches.length ? wmMatches.filter((result) => !result.scoring.isCorrect).length / wmMatches.length : null,
    wmFalseAlarmRate: wmDifferent.length ? wmDifferent.filter((result) => result.response === "match").length / wmDifferent.length : null,
    wmLureFalseAlarmRate: wmLures.length ? wmLures.filter((result) => result.response === "match").length / wmLures.length : null,
  };
}

export function buildCccSessionMetrics(results: readonly CccRecordedTrial[]): CccSessionMetrics {
  const scored = results.filter((result) => !result.trial.practice && !result.trial.wmBuffer);
  const signal = scored.filter((result) => result.trial.estimand === "signal_capacity");
  const attention = scored.filter((result) => result.trial.operator === "attention" && result.trial.estimand !== "signal_capacity");
  const wm = scored.filter((result) => result.trial.operator === "relational_wm");
  const policy = scored.filter((result) => result.trial.estimand !== "signal_capacity");
  const allFeedback = buildCccBlockFeedback(scored);
  const signalFeedback = buildCccBlockFeedback(signal);
  const attentionFeedback = buildCccBlockFeedback(attention);
  const wmFeedback = buildCccBlockFeedback(wm);
  const policyFeedback = buildCccBlockFeedback(policy);
  return {
    attentionThroughputBps: attentionFeedback.attentionThroughputBps,
    wmThroughputBps: wmFeedback.wmThroughputBps,
    attentionAccuracy: attentionFeedback.accuracy,
    signalAccuracy: signalFeedback.accuracy,
    wmAccuracy: wmFeedback.accuracy,
    medianDecisionMs: allFeedback.medianDecisionMs,
    pointsKeptPercent: policyFeedback.observationCount ? policyFeedback.pointsKeptPercent : null,
    omissionRate: allFeedback.observationCount ? allFeedback.omissionCount / allFeedback.observationCount : null,
    timingShiftMs: policyFeedback.timingShiftMs,
    closePatternAccuracy: allFeedback.clarity.find((item) => item.ratio === "3:2")?.accuracy ?? null,
    attentionControlBps: signalFeedback.attentionControlBps,
    observationCount: allFeedback.observationCount,
  };
}
