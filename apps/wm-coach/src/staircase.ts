import type { TrialCondition } from "./types";

export const INITIAL_STAIRCASE_LEVEL = 2;
export const MIN_N_LEVEL = 1;
export const MAX_N_LEVEL = 7;

export function clampNLevel(level: number): number {
  return Math.max(MIN_N_LEVEL, Math.min(MAX_N_LEVEL, Math.round(level)));
}

export function conditionForLevel(level: number): TrialCondition {
  return { ratio: "5:0", exposureMs: 1200, nLevel: clampNLevel(level) };
}

export function nextStaircaseLevel(currentLevel: number, correct: boolean): number {
  return clampNLevel(currentLevel + (correct ? 1 : -1));
}

export function nextNLevelFromAccuracy(currentLevel: number, balancedAccuracy: number): number {
  if (balancedAccuracy >= 0.9) return clampNLevel(currentLevel + 1);
  if (balancedAccuracy < 0.75) return clampNLevel(currentLevel - 1);
  return clampNLevel(currentLevel);
}

export function hConditionBits(): number {
  return 0;
}
