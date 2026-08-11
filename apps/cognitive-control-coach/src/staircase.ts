import type { Ratio, TrialCondition } from "./types";

export const STAIRCASE_CONDITIONS: TrialCondition[] = [
  { ratio: "5:0", exposureMs: 1500 },
  { ratio: "5:0", exposureMs: 1000 },
  { ratio: "4:1", exposureMs: 1000 },
  { ratio: "4:1", exposureMs: 700 },
  { ratio: "4:1", exposureMs: 500 },
  { ratio: "3:2", exposureMs: 700 },
  { ratio: "3:2", exposureMs: 500 },
  { ratio: "3:2", exposureMs: 300 },
  { ratio: "3:2", exposureMs: 200 },
  { ratio: "3:2", exposureMs: 150 },
];

export const INITIAL_STAIRCASE_LEVEL = 4;

export function clampStaircaseLevel(level: number): number {
  return Math.max(0, Math.min(STAIRCASE_CONDITIONS.length - 1, level));
}

export function conditionForLevel(level: number): TrialCondition {
  return STAIRCASE_CONDITIONS[clampStaircaseLevel(level)];
}

export function nextStaircaseLevel(currentLevel: number, correct: boolean): number {
  return clampStaircaseLevel(currentLevel + (correct ? 1 : -1));
}

export function hConditionBits(ratio: Ratio): number {
  if (ratio === "5:0") return 1.58;
  if (ratio === "4:1") return 2.91;
  return 4.91;
}
