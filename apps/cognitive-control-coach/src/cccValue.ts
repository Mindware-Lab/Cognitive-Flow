import { CCC_CONFIG_VERSION, CCC_REGIMES, CCC_TRIAL_TIMING } from "./cccConfig";
import type { CccAttentionResponseInput, CccAttentionTrialScoring, CccResponseChoice, CccResponseClass } from "./cccTypes";

export const CCC_VALUE_SCORING_VERSION = "ccc-value-v0.1";

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
  if (input.invalidated) return "invalid";
  if (responseTimeMs !== null && responseTimeMs < CCC_TRIAL_TIMING.minimumExposureBeforeAnswerMs) return "invalid";
  if (responseTimeMs === null || responseTimeMs > CCC_TRIAL_TIMING.maxResponseWindowMs) return "omission";
  if (input.response === "withhold") return "withhold";
  if (!input.response) return "omission";
  return "answer";
}

export function scoreCccAttentionTrial(input: CccAttentionResponseInput): CccAttentionTrialScoring {
  const responseTimeMs = Number.isFinite(input.responseTimeMs) ? Number(input.responseTimeMs) : null;
  const regime = CCC_REGIMES[input.trial.regimeId];
  const responseClass = classifyCccAttentionResponse(input);
  const answeredBeforeMinimumExposure = responseTimeMs !== null && responseTimeMs < CCC_TRIAL_TIMING.minimumExposureBeforeAnswerMs;
  const deadlineExceeded = responseTimeMs !== null && responseTimeMs > CCC_TRIAL_TIMING.maxResponseWindowMs;
  const rewardRemaining = rewardRemainingForResponse(input.trial.regimeId, responseTimeMs);
  const response = input.response as CccResponseChoice | null | undefined;
  const isCorrect = responseClass === "answer" && response === input.trial.correctResponse;
  const pointsRealised = isCorrect
    ? rewardRemaining
    : responseClass === "answer"
      ? -regime.errorLoss
      : responseClass === "withhold"
        ? CCC_TRIAL_TIMING.voluntaryWithholdPoints
        : CCC_TRIAL_TIMING.omissionPoints;
  const denominator = regime.correctPot + regime.errorLoss;
  const invalidReason = input.invalidated
    ? input.invalidReason || "aborted"
    : answeredBeforeMinimumExposure
      ? "early_response"
      : responseClass === "omission"
        ? "deadline"
        : null;
  const validForProgression = (responseClass === "answer" || responseClass === "withhold")
    && !input.trial.practice
    && !input.trial.diagnostic;

  return {
    scoringVersion: CCC_VALUE_SCORING_VERSION,
    responseClass,
    isCorrect,
    isValidDecision: responseClass === "answer" || responseClass === "withhold",
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
    invalidReason,
  };
}

export function summarizeCccAttentionScores(scores: readonly CccAttentionTrialScoring[]): {
  validDecisionCount: number;
  answeredCount: number;
  withholdCount: number;
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
    withholdCount: scores.filter((score) => score.responseClass === "withhold").length,
    omissionCount: scores.filter((score) => score.responseClass === "omission").length,
    invalidCount: scores.filter((score) => score.responseClass === "invalid").length,
    answeredAccuracy: answered.length > 0 ? answered.filter((score) => score.isCorrect).length / answered.length : null,
    totalPoints: scores.reduce((total, score) => total + score.pointsRealised, 0),
  };
}
