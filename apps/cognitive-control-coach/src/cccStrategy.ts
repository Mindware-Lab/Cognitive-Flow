import { CCC_REGIMES, CCC_RELATIONAL_WM, CCC_TRIAL_TIMING } from "./cccConfig";
import type { CccOperator, CccRatio, CccRecordedTrial, CccRegimeId } from "./cccTypes";

export type CccStrategyDirection = "speed_up" | "slow_down" | "well_balanced" | "keep_learning";

export interface CccRegimeStrategyFeedback {
  regimeId: CccRegimeId;
  label: string;
  observationCount: number;
  observedMedianMs: number | null;
  estimatedBestMs: number | null;
  expectedGainPerTrial: number | null;
  direction: CccStrategyDirection;
  title: string;
  guidance: string;
}

export interface CccStrategyFeedback {
  modelReady: boolean;
  answeredCount: number;
  regimes: CccRegimeStrategyFeedback[];
  principle: string;
}

interface AccuracyModel {
  intercept: number;
  time: number;
  mixed: number;
  close: number;
}

const MIN_MODEL_ANSWERS = 18;
const MIN_REGIME_ANSWERS = 5;
const ACTIONABLE_TIME_GAP_MS = 200;
const ACTIONABLE_VALUE_GAIN = 0.75;

function median(values: readonly number[]): number | null {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

function logistic(value: number): number {
  if (value >= 0) return 1 / (1 + Math.exp(-value));
  const exp = Math.exp(value);
  return exp / (1 + exp);
}

function logit(probability: number): number {
  const bounded = Math.max(0.02, Math.min(0.98, probability));
  return Math.log(bounded / (1 - bounded));
}

function timeBounds(operator: CccOperator): readonly [number, number] {
  return operator === "relational_wm"
    ? [CCC_RELATIONAL_WM.minimumPresentationMs, CCC_RELATIONAL_WM.maximumPresentationMs]
    : [CCC_TRIAL_TIMING.minimumExposureBeforeAnswerMs, CCC_TRIAL_TIMING.maxResponseWindowMs];
}

function features(responseTimeMs: number, ratio: CccRatio, operator: CccOperator): readonly [number, number, number, number] {
  const [minimumMs, maximumMs] = timeBounds(operator);
  const time = (Math.max(minimumMs, responseTimeMs) - minimumMs) / Math.max(1, maximumMs - minimumMs);
  return [1, time, ratio === "4:1" ? 1 : 0, ratio === "3:2" ? 1 : 0];
}

/**
 * A deliberately small, regularised accuracy-time model for in-session coaching.
 * Time is constrained to have a non-negative contribution, and harder patterns
 * cannot be estimated as easier than clear ones. It supports cautious coaching;
 * it is not exposed as a psychometric or diagnostic estimate.
 */
function fitAccuracyModel(results: readonly CccRecordedTrial[], operator: CccOperator): AccuracyModel | null {
  const answered = results.filter((result) => result.scoring.responseClass === "answer"
    && result.scoring.valueTimeMs !== null);
  if (answered.length < MIN_MODEL_ANSWERS) return null;
  const responseTimes = answered.map((result) => Number(result.scoring.valueTimeMs));
  const correctCount = answered.filter((result) => result.scoring.isCorrect).length;
  if (Math.max(...responseTimes) - Math.min(...responseTimes) < 400
    || correctCount < 3
    || answered.length - correctCount < 3) return null;
  const smoothedAccuracy = (answered.filter((result) => result.scoring.isCorrect).length + 2) / (answered.length + 4);
  const beta = [logit(smoothedAccuracy), 0.55, -0.35, -0.85];
  const ridge = 1.6;
  const rate = 0.24 / answered.length;
  for (let iteration = 0; iteration < 700; iteration += 1) {
    const gradient = [0, 0, 0, 0];
    for (const result of answered) {
      const x = features(Number(result.scoring.valueTimeMs), result.trial.ratio, operator);
      const probability = logistic(beta.reduce((sum, coefficient, index) => sum + coefficient * x[index], 0));
      const residual = (result.scoring.isCorrect ? 1 : 0) - probability;
      for (let index = 0; index < gradient.length; index += 1) gradient[index] += residual * x[index];
    }
    for (let index = 1; index < gradient.length; index += 1) gradient[index] -= ridge * beta[index];
    for (let index = 0; index < beta.length; index += 1) beta[index] += rate * gradient[index];
    beta[1] = Math.max(0, Math.min(5, beta[1]));
    beta[2] = Math.min(0, beta[2]);
    beta[3] = Math.min(beta[2], beta[3]);
  }
  if (beta[1] < 0.12) return null;
  return { intercept: beta[0], time: beta[1], mixed: beta[2], close: beta[3] };
}

function probabilityCorrect(model: AccuracyModel, responseTimeMs: number, ratio: CccRatio, operator: CccOperator): number {
  const x = features(responseTimeMs, ratio, operator);
  return logistic(model.intercept * x[0] + model.time * x[1] + model.mixed * x[2] + model.close * x[3]);
}

function expectedValueAt(model: AccuracyModel, regimeId: CccRegimeId, responseTimeMs: number, operator: CccOperator): number {
  const regime = CCC_REGIMES[regimeId];
  const reward = Math.max(0, regime.correctPot - regime.drainPointsPerSecond * responseTimeMs / 1000);
  return (Object.entries(regime.ratioPriors) as Array<[CccRatio, number]>).reduce((total, [ratio, weight]) => {
    const correct = probabilityCorrect(model, responseTimeMs, ratio, operator);
    return total + weight * (correct * reward - (1 - correct) * regime.errorLoss);
  }, 0);
}

function bestEstimatedTime(model: AccuracyModel, regimeId: CccRegimeId, operator: CccOperator): { timeMs: number; value: number } {
  const [minimumMs, maximumMs] = timeBounds(operator);
  let best = { timeMs: minimumMs, value: Number.NEGATIVE_INFINITY };
  for (let timeMs = minimumMs;
    timeMs <= maximumMs;
    timeMs += 50) {
    const value = expectedValueAt(model, regimeId, timeMs, operator);
    if (value > best.value) best = { timeMs, value };
  }
  return best;
}

function learningGuidance(regimeId: CccRegimeId): Pick<CccRegimeStrategyFeedback, "title" | "guidance"> {
  const regime = CCC_REGIMES[regimeId];
  if (regime.errorLoss >= 40) return {
    title: "Build enough certainty",
    guidance: "A wrong choice is costly here. Give close patterns more viewing time, but choose once extra looking is no longer making the majority clearer.",
  };
  return {
    title: "Protect the fading points",
    guidance: "Points disappear quickly here. Pool enough evidence to see the majority, then commit rather than waiting for complete certainty.",
  };
}

function strategyForRegime(
  regimeId: CccRegimeId,
  results: readonly CccRecordedTrial[],
  model: AccuracyModel | null,
  operator: CccOperator,
): CccRegimeStrategyFeedback {
  const regime = CCC_REGIMES[regimeId];
  const answered = results.filter((result) => result.trial.regimeId === regimeId
    && result.scoring.responseClass === "answer"
    && result.scoring.valueTimeMs !== null);
  const observedMedianMs = median(answered.map((result) => Number(result.scoring.valueTimeMs)));
  const omissions = results.filter((result) => result.trial.regimeId === regimeId
    && result.scoring.responseClass === "omission").length;
  if (omissions >= 2 && omissions / Math.max(1, omissions + answered.length) >= 0.15) {
    return {
      regimeId,
      label: regime.label,
      observationCount: answered.length,
      observedMedianMs,
      estimatedBestMs: null,
      expectedGainPerTrial: null,
      direction: "speed_up",
      title: "Commit before time runs out",
      guidance: "Several patterns ended without a choice. Aim for enough certainty to identify the majority, then make your best choice before the deadline.",
    };
  }
  if (!model || answered.length < MIN_REGIME_ANSWERS || observedMedianMs === null) {
    return {
      regimeId,
      label: regime.label,
      observationCount: answered.length,
      observedMedianMs,
      estimatedBestMs: null,
      expectedGainPerTrial: null,
      direction: "keep_learning",
      ...learningGuidance(regimeId),
    };
  }
  const best = bestEstimatedTime(model, regimeId, operator);
  const observedValue = expectedValueAt(model, regimeId, observedMedianMs, operator);
  const gain = Math.max(0, best.value - observedValue);
  const gap = observedMedianMs - best.timeMs;
  if (gain < ACTIONABLE_VALUE_GAIN || Math.abs(gap) < ACTIONABLE_TIME_GAP_MS) {
    return {
      regimeId,
      label: regime.label,
      observationCount: answered.length,
      observedMedianMs,
      estimatedBestMs: best.timeMs,
      expectedGainPerTrial: gain,
      direction: "well_balanced",
      title: "Your timing is well matched",
      guidance: "Your current balance of certainty, time and points is close to the best estimate from this session. Keep adjusting a little for clearer and closer patterns.",
    };
  }
  if (gap > 0) {
    return {
      regimeId,
      label: regime.label,
      observationCount: answered.length,
      observedMedianMs,
      estimatedBestMs: best.timeMs,
      expectedGainPerTrial: gain,
      direction: "speed_up",
      title: "Commit a little sooner",
      guidance: "Extra viewing is currently costing more points than the added certainty is returning. On similar patterns, choose once the majority is clear enough.",
    };
  }
  return {
    regimeId,
    label: regime.label,
    observationCount: answered.length,
    observedMedianMs,
    estimatedBestMs: best.timeMs,
    expectedGainPerTrial: gain,
      direction: "slow_down",
      title: "Take in a little more information",
      guidance: "A little more viewing is likely to prevent enough costly errors to improve your points. On similar patterns, wait until the majority is clearer before choosing.",
  };
}

export function buildCccStrategyFeedback(
  results: readonly CccRecordedTrial[],
  regimeIds: readonly CccRegimeId[],
  operator: CccOperator,
): CccStrategyFeedback {
  const eligible = results.filter((result) => !result.trial.practice
    && !result.trial.wmBuffer
    && result.trial.presentationMode === "self_paced_value"
    && result.trial.operator === operator
    && result.scoring.countsTowardQuota);
  const model = fitAccuracyModel(eligible, operator);
  return {
    modelReady: model !== null,
    answeredCount: eligible.filter((result) => result.scoring.responseClass === "answer").length,
    regimes: regimeIds.map((regimeId) => strategyForRegime(regimeId, eligible, model, operator)),
    principle: "Use more viewing time when errors are costly or the pattern is close. When points are fading quickly, choose as soon as the majority is clear enough—not when certainty feels perfect.",
  };
}
