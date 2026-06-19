import type { Ratio } from "./types";

export interface CapacityConditionModel {
  nSize: number;
  nMajoritySample: number;
  nCongruent: number;
  groupProbability: number;
  informationBits: number;
  isCatch: boolean;
}

export const CAPACITY_MODEL_VERSION = "grouping-search-v0.2";
export const CAPACITY_P0 = 0.97;
export const CAPACITY_GUESS_RATE = 0.5;
export const CAPACITY_MIN_RT_MS = 100;
export const CAPACITY_RESPONSE_WINDOW_MS = 2200;

function combinations(n: number, k: number): number {
  if (k < 0 || k > n) return 0;
  const reducedK = Math.min(k, n - k);
  let value = 1;
  for (let index = 1; index <= reducedK; index += 1) {
    value = (value * (n - reducedK + index)) / index;
  }
  return value;
}

function createCondition(nCongruent: number, isCatch = false): CapacityConditionModel {
  const nSize = 5;
  const nMajoritySample = 3;
  const groupProbability =
    combinations(nCongruent, nMajoritySample) / combinations(nSize, nMajoritySample);
  return Object.freeze({
    nSize,
    nMajoritySample,
    nCongruent,
    groupProbability,
    informationBits: Math.log2(nMajoritySample / groupProbability),
    isCatch,
  });
}

export const CAPACITY_CONDITIONS: Readonly<Record<Ratio, CapacityConditionModel>> =
  Object.freeze({
    "5:0": createCondition(5, true),
    "4:1": createCondition(4),
    "3:2": createCondition(3),
  });

export function informationRateBitsPerSecond(ratio: Ratio, exposureMs: number): number {
  if (!Number.isFinite(exposureMs) || exposureMs <= 0) return 0;
  return CAPACITY_CONDITIONS[ratio].informationBits / (exposureMs / 1000);
}
