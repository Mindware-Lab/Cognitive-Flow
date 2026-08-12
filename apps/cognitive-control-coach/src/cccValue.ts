import { CCC_CONFIG_VERSION, CCC_REGIMES, CCC_RELATIONAL_WM, CCC_TRIAL_TIMING } from "./cccConfig";
import type { CccAttentionResponseInput, CccAttentionTrialScoring, CccResponseChoice, CccResponseClass } from "./cccTypes";

export const CCC_VALUE_SCORING_VERSION = "ccc-dual-value-v0.3";

function bounded(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function rewardRemainingForResponse(regimeId: CccAttentionResponseInput["trial"]["regimeId"], responseTimeMs: number | null): number {
  const regime = CCC_REGIMES[regimeId];
  if (responseTimeMs === null) return 0;
  const drained = regime.drainPointsPerSecond * (responseTimeMs / 1000);
  return bounded(regime.correctPot - drained, 0, regime.correctPot);
}

export function classifyCccAttentionResponse(input: CccAttentionResponseInput): CccResponseClass {
  const responseTimeMs = Number.isFinite(input.responseTimeMs) ? Number(input.responseTimeMs) : null;
  const isSignal = input.trial.presentationMode === "masked_forced_choice";
  const deadlineMs = isSignal
    ? CCC_TRIAL_TIMING.signalResponseDeadlineMs
    : input.trial.operator === "relational_wm"
      ? CCC_RELATIONAL_WM.responseDeadlineMs
      : CCC_TRIAL_TIMING.maxResponseWindowMs;
  if (input.invalidated) return "invalid";
  if (!isSignal && responseTimeMs !== null && responseTimeMs < CCC_TRIAL_TIMING.minimumExposureBeforeAnswerMs) return "invalid";
  if (responseTimeMs === null || responseTimeMs > deadlineMs) return "omission";
  if (!input.response) return "omission";
  return "answer";
}

export function scoreCccAttentionTrial(input: CccAttentionResponseInput): CccAttentionTrialScoring {
  const responseTimeMs = Number.isFinite(input.responseTimeMs) ? Number(input.responseTimeMs) : null;
  const isSignal = input.trial.presentationMode === "masked_forced_choice";
  const deadlineMs = isSignal
    ? CCC_TRIAL_TIMING.signalResponseDeadlineMs
    : input.trial.operator === "relational_wm"
      ? CCC_RELATIONAL_WM.responseDeadlineMs
      : CCC_TRIAL_TIMING.maxResponseWindowMs;
  const regime = CCC_REGIMES[input.trial.regimeId];
  const responseClass = classifyCccAttentionResponse(input);
  const answeredBeforeMinimumExposure = !isSignal && responseTimeMs !== null && responseTimeMs < CCC_TRIAL_TIMING.minimumExposureBeforeAnswerMs;
  const deadlineExceeded = responseTimeMs !== null && responseTimeMs > deadlineMs;
  const response = input.response as CccResponseChoice | null | undefined;
  const isCorrect = responseClass === "answer" && response === input.trial.correctResponse;
  const isValueTrial = input.trial.presentationMode === "self_paced_value" && !input.trial.practice && !input.trial.wmBuffer;
  const rewardRemaining = isValueTrial ? rewardRemainingForResponse(input.trial.regimeId, responseTimeMs) : 0;
  const pointsRealised = !isValueTrial
    ? 0
    : isCorrect
      ? rewardRemaining
      : responseClass === "answer"
        ? -regime.errorLoss
        : CCC_TRIAL_TIMING.omissionPoints;
  const denominator = regime.correctPot + regime.errorLoss;
  const invalidReason = input.invalidated
    ? input.invalidReason || "aborted"
    : answeredBeforeMinimumExposure
      ? "early_response"
      : responseClass === "omission"
        ? "deadline"
        : null;
  const countsTowardQuota = input.trial.wmBuffer
    ? false
    : input.trial.practice
    ? responseClass === "answer"
    : responseClass !== "invalid";
  const validForProgression = responseClass === "answer"
    && !input.trial.practice
    && !input.trial.diagnostic
    && !input.trial.wmBuffer;

  return {
    scoringVersion: CCC_VALUE_SCORING_VERSION,
    responseClass,
    isCorrect,
    isValidDecision: responseClass === "answer",
    isOmission: responseClass === "omission",
    isInvalidated: responseClass === "invalid",
    answeredBeforeMinimumExposure,
    deadlineExceeded,
    responseTimeMs,
    rewardRemaining,
    pointsRealised,
    normalizedValue: denominator > 0 ? pointsRealised / denominator : 0,
    regimeId: input.trial.regimeId,
    configVersion: CCC_CONFIG_VERSION,
    validForProgression,
    countsTowardQuota,
    invalidReason,
  };
}

export function summarizeCccAttentionScores(scores: readonly CccAttentionTrialScoring[]): {
  validDecisionCount: number;
  answeredCount: number;
  omissionCount: number;
  invalidCount: number;
  answeredAccuracy: number | null;
  totalPoints: number;
} {
  const validDecisionCount = scores.filter((score) => score.isValidDecision).length;
  const answered = scores.filter((score) => score.responseClass === "answer");
  return {
    validDecisionCount,
    answeredCount: answered.length,
    omissionCount: scores.filter((score) => score.responseClass === "omission").length,
    invalidCount: scores.filter((score) => score.responseClass === "invalid").length,
    answeredAccuracy: answered.length > 0 ? answered.filter((score) => score.isCorrect).length / answered.length : null,
    totalPoints: scores.reduce((total, score) => total + score.pointsRealised, 0),
  };
}
