import type { CccProgrammeSessionSummary, CccSessionMetrics } from "./cccTypes";

export type CccComparisonMode = "personal" | "population";
export type CccProgressMetricKey = "accuracy" | "decisionTime" | "pointsKept" | "closePatterns" | "workingMemory";

export interface CccPopulationScore {
  standardScore: number | null;
  normN: number | null;
}

export const CCC_POPULATION_MIN_N = 30;

export function sessionMetricValue(metrics: CccSessionMetrics | undefined, key: CccProgressMetricKey): number | null {
  if (!metrics) return null;
  if (key === "accuracy") return metrics.attentionAccuracy ?? metrics.signalAccuracy;
  if (key === "decisionTime") return metrics.medianDecisionMs;
  if (key === "pointsKept") return metrics.pointsKeptPercent;
  if (key === "closePatterns") return metrics.closePatternAccuracy;
  return metrics.wmAccuracy;
}

export function firstValidBaseline(
  sessions: readonly CccProgrammeSessionSummary[],
  key: CccProgressMetricKey,
): number | null {
  for (const session of sessions) {
    const value = sessionMetricValue(session.metrics, key);
    if (value !== null && Number.isFinite(value)) return value;
  }
  return null;
}

export function personalIndex(value: number | null, baseline: number | null, lowerIsBetter = false): number | null {
  if (value === null || baseline === null || !Number.isFinite(value) || !Number.isFinite(baseline) || baseline === 0) return null;
  const ratio = lowerIsBetter ? baseline / value : value / baseline;
  return Math.round(Math.max(55, Math.min(145, ratio * 100)));
}

export function displayTrainingScore(input: {
  value: number | null;
  baseline: number | null;
  mode: CccComparisonMode;
  population?: CccPopulationScore | null;
  lowerIsBetter?: boolean;
}): number | null {
  if (input.mode === "population") {
    return input.population && (input.population.normN ?? 0) >= CCC_POPULATION_MIN_N
      ? input.population.standardScore
      : null;
  }
  return personalIndex(input.value, input.baseline, input.lowerIsBetter);
}

export function populationModeAvailable(scores: Record<string, CccPopulationScore>): boolean {
  return Object.values(scores).some((score) => score.standardScore !== null && (score.normN ?? 0) >= CCC_POPULATION_MIN_N);
}

export function progressSparkline(values: readonly number[], width = 280, height = 84): string {
  if (!values.length) return "";
  const min = Math.min(...values, 85);
  const max = Math.max(...values, 115);
  const range = Math.max(1, max - min);
  return values.map((value, index) => {
    const x = values.length === 1 ? width / 2 : index / (values.length - 1) * width;
    const y = height - ((value - min) / range) * height;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
}
