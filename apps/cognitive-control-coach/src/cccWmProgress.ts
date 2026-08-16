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
  meanPresentationMs: number;
  presentationRateHz: number;
  informationThroughputBps: number;
  /** Alias retained for persisted curve logic; expressed in bits per second. */
  capacityIndex: number;
}

/** Four possible relations carry two bits before accuracy/interference adjustment. */
export const CCC_WM_RELATION_INFORMATION_BITS = Math.log2(4);
export const CCC_WM_MAX_CAPACITY_THROUGHPUT = CCC_RELATIONAL_WM.maximumNBack
  * CCC_WM_RELATION_INFORMATION_BITS
  * (1000 / CCC_RELATIONAL_WM.minimumPresentationMs);

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
  const requestedPresentationTimes = scored
    .map((result) => result.trial.exposureMsRequested)
    .filter((value): value is number => typeof value === "number" && value > 0);
  const meanPresentationMs = requestedPresentationTimes.length
    ? requestedPresentationTimes.reduce((sum, value) => sum + value, 0) / requestedPresentationTimes.length
    : CCC_RELATIONAL_WM.defaultPresentationMs;
  const presentationRateHz = 1000 / meanPresentationMs;
  const enoughData = scored.length >= CCC_RELATIONAL_WM.scoredTrialsPerBlock * 2;
  const advance = enoughData
    && balancedAccuracy >= CCC_RELATIONAL_WM.advancementAnsweredAccuracy
    && omissionRate <= CCC_RELATIONAL_WM.advancementOmissionCeiling
    && missRate <= CCC_RELATIONAL_WM.maximumMissRateForAdvance
    && falseAlarmRate <= CCC_RELATIONAL_WM.maximumFalseAlarmRateForAdvance;
  const decrease = enoughData && balancedAccuracy < CCC_RELATIONAL_WM.maintenanceAnsweredAccuracy;
  const direction: CccWmLevelDirection = advance ? "increase" : decrease ? "decrease" : "maintain";
  const nextLevel = boundedLevel(level + (direction === "increase" ? 1 : direction === "decrease" ? -1 : 0));
  const informationThroughputBps = level
    * CCC_WM_RELATION_INFORMATION_BITS
    * presentationRateHz
    * balancedAccuracy
    * (1 - (lureFalseAlarmRate ?? falseAlarmRate));
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
    meanPresentationMs,
    presentationRateHz,
    informationThroughputBps,
    capacityIndex: informationThroughputBps,
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
    meanPresentationMs: decision.meanPresentationMs,
    presentationRateHz: decision.presentationRateHz,
    informationThroughputBps: decision.informationThroughputBps,
    capacityIndex: decision.capacityIndex,
  };
}

/** Weighted session/block aggregate across any n-levels present in the results. */
export function cccWmInformationThroughputBps(results: readonly CccRecordedTrial[]): number | null {
  const scored = results.filter((result) => result.trial.operator === "relational_wm"
    && !result.trial.wmBuffer
    && result.scoring.countsTowardQuota
    && result.trial.wmNLevel !== null);
  if (!scored.length) return null;
  const groups = new Map<CccNBackLevel, CccRecordedTrial[]>();
  for (const result of scored) {
    const level = result.trial.wmNLevel as CccNBackLevel;
    groups.set(level, [...(groups.get(level) || []), result]);
  }
  const decisions = [...groups.entries()].map(([level, group]) => evaluateCccWmPair(group, level));
  const observations = decisions.reduce((sum, decision) => sum + decision.observationCount, 0);
  return observations
    ? decisions.reduce((sum, decision) => sum + decision.informationThroughputBps * decision.observationCount, 0) / observations
    : null;
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
  const recentCapacity = recent.map((point) => point.capacityIndex);
  const capacityMean = recentCapacity.reduce((sum, value) => sum + value, 0) / recentCapacity.length;
  const capacityScale = Math.max(0.05, Math.abs(capacityMean));
  const rawCapacitySlope = slope(recentCapacity);
  const capacitySlope = rawCapacitySlope === null ? null : rawCapacitySlope / capacityScale;
  const capacityRange = (Math.max(...recentCapacity) - Math.min(...recentCapacity)) / capacityScale;
  return levels.size === 1
    && capacitySlope !== null
    && Math.abs(capacitySlope) <= CCC_RELATIONAL_WM.learningCurveMaximumAbsoluteSlope
    && capacityRange <= CCC_RELATIONAL_WM.learningCurveMaximumRecentRange;
}
