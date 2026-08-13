import { CCC_CONFIG_VERSION, CCC_REGIMES, CCC_RELATIONAL_WM, CCC_TRIAL_TIMING } from "./cccConfig";
import type { CccAttentionResponseInput, CccAttentionTrialScoring, CccResponseChoice, CccResponseClass } from "./cccTypes";

export const CCC_VALUE_SCORING_VERSION = "ccc-dual-value-v0.4";

function bounded(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function isScoredWmTrial(input: CccAttentionResponseInput): boolean {
  return input.trial.operator === "relational_wm" && !input.trial.wmBuffer;
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
  if (!isSignal && input.trial.operator !== "relational_wm"
    && responseTimeMs !== null && responseTimeMs < CCC_TRIAL_TIMING.minimumExposureBeforeAnswerMs) return "invalid";

  if (isScoredWmTrial(input)) {
    // Every completed WM trial yields a binary decision at the deadline. A Match
    // press is the overt target response; withholding is the implicit non-match
    // response. A late overt response remains an omission.
    if (input.response && (responseTimeMs === null || responseTimeMs > deadlineMs)) return "omission";
    return "answer";
  }

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
  const scoredWmTrial = isScoredWmTrial(input);
  const answeredBeforeMinimumExposure = !isSignal && input.trial.operator !== "relational_wm"
    && responseTimeMs !== null && responseTimeMs < CCC_TRIAL_TIMING.minimumExposureBeforeAnswerMs;
  const implicitWmResponse = scoredWmTrial && !input.response;
  const deadlineExceeded = !implicitWmResponse && responseTimeMs !== null && responseTimeMs > deadlineMs;
  const response = input.response as CccResponseChoice | null | undefined;
  const isCorrect = scoredWmTrial
    ? input.trial.wmIsMatch === true
      ? responseClass === "answer" && response === "match"
      : responseClass === "answer" && (!response || response === "different")
    : responseClass === "answer" && response === input.trial.correctResponse;
  const wmMiss = scoredWmTrial && input.trial.wmIsMatch === true && !isCorrect;
  const isValueTrial = input.trial.presentationMode === "self_paced_value" && !input.trial.practice && !input.trial.wmBuffer;
  const valueTimeMs = input.trial.operator === "relational_wm" && input.trial.exposureMsRequested !== null
    ? input.trial.exposureMsRequested
    : responseTimeMs;
  const rewardRemaining = isValueTrial ? rewardRemainingForResponse(input.trial.regimeId, valueTimeMs) : 0;
  const pointsRealised = !isValueTrial
    ? 0
    : isCorrect
      ? rewardRemaining
      : responseClass === "answer" || wmMiss
        ? -regime.errorLoss
        : CCC_TRIAL_TIMING.omissionPoints;
  const denominator = regime.correctPot + regime.errorLoss;
  const invalidReason = input.invalidated
    ? input.invalidReason || "aborted"
    : answeredBeforeMinimumExposure
      ? "early_response"
      : wmMiss && !response
        ? "deadline"
        : responseClass === "omission"
          ? "deadline"
          : null;
  const countsTowardQuota = input.trial.wmBuffer
    ? false
    : input.trial.practice
      ? responseClass === "answer"
      : responseClass !== "invalid";
  const validForProgression = !input.trial.practice
    && !input.trial.diagnostic
    && !input.trial.wmBuffer
    && (scoredWmTrial ? responseClass !== "invalid" : responseClass === "answer");
  const storedResponseTimeMs = implicitWmResponse ? null : responseTimeMs;

  return {
    scoringVersion: CCC_VALUE_SCORING_VERSION,
    responseClass,
    isCorrect,
    isValidDecision: responseClass === "answer",
    isOmission: responseClass === "omission" || (wmMiss && !response),
    isInvalidated: responseClass === "invalid",
    answeredBeforeMinimumExposure,
    deadlineExceeded,
    responseTimeMs: storedResponseTimeMs,
    valueTimeMs,
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
    omissionCount: scores.filter((score) => score.isOmission).length,
    invalidCount: scores.filter((score) => score.responseClass === "invalid").length,
    answeredAccuracy: answered.length > 0 ? answered.filter((score) => score.isCorrect).length / answered.length : null,
    totalPoints: scores.reduce((total, score) => total + score.pointsRealised, 0),
  };
}
