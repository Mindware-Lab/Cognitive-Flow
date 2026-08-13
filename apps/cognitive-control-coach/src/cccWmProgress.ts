import { CCC_RELATIONAL_WM } from "./cccConfig";
import type { CccNBackLevel, CccRecordedTrial, CccWmLearningCurveHistoryPoint } from "./cccTypes";

export type CccWmLevelDirection = "increase" | "maintain" | "decrease";

export interface CccWmPairDecision {
  direction: CccWmLevelDirection;
  currentLevel: CccNBackLevel;
  nextLevel: CccNBackLevel;
  observationCount: number;
  balancedAccuracy: number;
  omissionRate: number;
  missRate: number;
  falseAlarmRate: number;
  lureFalseAlarmRate: number | null;
  capacityIndex: number;
}

function boundedLevel(value: number): CccNBackLevel {
  return Math.max(CCC_RELATIONAL_WM.minimumNBack, Math.min(CCC_RELATIONAL_WM.maximumNBack, value)) as CccNBackLevel;
}

export function evaluateCccWmPair(results: readonly CccRecordedTrial[], level: CccNBackLevel): CccWmPairDecision {
  const scored = results.filter((result) => result.trial.operator === "relational_wm"
    && !result.trial.wmBuffer
    && result.scoring.countsTowardQuota);
  const matches = scored.filter((result) => result.trial.wmIsMatch === true);
  const different = scored.filter((result) => result.trial.wmIsMatch === false);
  const hits = matches.filter((result) => result.scoring.isCorrect).length;
  const correctRejections = different.filter((result) => result.scoring.isCorrect).length;
  const misses = matches.length - hits;
  const falseAlarms = different.filter((result) => result.response === "match").length;
  const lureTrials = scored.filter((result) => result.trial.wmLureType === "wrong_lag");
  const lureFalseAlarms = lureTrials.filter((result) => result.response === "match").length;
  const omissionCount = scored.filter((result) => result.scoring.isOmission).length;
  const hitRate = matches.length ? hits / matches.length : 0;
  const correctRejectionRate = different.length ? correctRejections / different.length : 0;
  const balancedAccuracy = (hitRate + correctRejectionRate) / 2;
  const omissionRate = scored.length ? omissionCount / scored.length : 1;
  const missRate = matches.length ? misses / matches.length : 1;
  const falseAlarmRate = different.length ? falseAlarms / different.length : 1;
  const lureFalseAlarmRate = lureTrials.length ? lureFalseAlarms / lureTrials.length : null;
  const enoughData = scored.length >= CCC_RELATIONAL_WM.scoredTrialsPerBlock * 2;
  const advance = enoughData
    && balancedAccuracy >= CCC_RELATIONAL_WM.advancementAnsweredAccuracy
    && omissionRate <= CCC_RELATIONAL_WM.advancementOmissionCeiling
    && missRate <= CCC_RELATIONAL_WM.maximumMissRateForAdvance
    && falseAlarmRate <= CCC_RELATIONAL_WM.maximumFalseAlarmRateForAdvance;
  const decrease = enoughData && balancedAccuracy < CCC_RELATIONAL_WM.maintenanceAnsweredAccuracy;
  const direction: CccWmLevelDirection = advance ? "increase" : decrease ? "decrease" : "maintain";
  const nextLevel = boundedLevel(level + (direction === "increase" ? 1 : direction === "decrease" ? -1 : 0));
  return {
    direction,
    currentLevel: level,
    nextLevel,
    observationCount: scored.length,
    balancedAccuracy,
    omissionRate,
    missRate,
    falseAlarmRate,
    lureFalseAlarmRate,
    capacityIndex: level * balancedAccuracy * (1 - (lureFalseAlarmRate ?? falseAlarmRate)),
  };
}

export function wmHistoryPoint(
  sessionId: string,
  wrapperStage: CccWmLearningCurveHistoryPoint["wrapperStage"],
  pairIndex: 1 | 2,
  decision: CccWmPairDecision,
): CccWmLearningCurveHistoryPoint {
  return {
    sessionId,
    wrapperStage,
    pairIndex,
    nLevel: decision.currentLevel,
    observationCount: decision.observationCount,
    balancedAccuracy: decision.balancedAccuracy,
    omissionRate: decision.omissionRate,
    missRate: decision.missRate,
    falseAlarmRate: decision.falseAlarmRate,
    lureFalseAlarmRate: decision.lureFalseAlarmRate,
    capacityIndex: decision.capacityIndex,
  };
}

function slope(values: readonly number[]): number | null {
  if (values.length < 2) return null;
  const centre = (values.length - 1) / 2;
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const numerator = values.reduce((sum, value, index) => sum + (index - centre) * (value - mean), 0);
  const denominator = values.reduce((sum, _value, index) => sum + (index - centre) ** 2, 0);
  return denominator ? numerator / denominator : null;
}

export function cccWmCurveIsStable(history: readonly CccWmLearningCurveHistoryPoint[]): boolean {
  if (history.length < CCC_RELATIONAL_WM.learningCurveMinimumPairs) return false;
  const recent = history.slice(-CCC_RELATIONAL_WM.learningCurveRecentPairs);
  const levels = new Set(recent.map((point) => point.nLevel));
  const capacitySlope = slope(recent.map((point) => point.capacityIndex));
  return levels.size === 1
    && recent.every((point) => point.balancedAccuracy >= CCC_RELATIONAL_WM.maintenanceAnsweredAccuracy
      && point.omissionRate <= CCC_RELATIONAL_WM.advancementOmissionCeiling
      && point.missRate <= 0.3
      && point.falseAlarmRate <= 0.3)
    && capacitySlope !== null
    && Math.abs(capacitySlope) <= CCC_RELATIONAL_WM.learningCurveMaximumAbsoluteSlope;
}
