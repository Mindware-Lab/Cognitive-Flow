import type { CccRatio, CccRecordedTrial } from "./cccTypes";

export interface CccSignalCondition {
  ratio: CccRatio;
  exposureMs: number;
}

export interface CccSignalStaircaseState {
  level: number;
  consecutiveCorrect: number;
}

// A short, frame-safe adaptive grid for the protected signal anchor. This is
// MFT-M-derived, but it is not the published MFT-M-R CAT item-selection model.
export const CCC_SIGNAL_CONDITIONS: readonly CccSignalCondition[] = [
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
] as const;

export const CCC_SIGNAL_INITIAL_LEVEL = 4;

export const CCC_SIGNAL_INFORMATION_BITS: Record<CccRatio, number> = {
  "5:0": 1.58,
  "4:1": 2.91,
  "3:2": 4.91,
};

export function clampSignalLevel(level: number): number {
  return Math.max(0, Math.min(CCC_SIGNAL_CONDITIONS.length - 1, level));
}

export function signalConditionForLevel(level: number): CccSignalCondition {
  return CCC_SIGNAL_CONDITIONS[clampSignalLevel(level)];
}

/** Two correct responses move one step harder; an incorrect/omitted response moves one step easier. */
export function nextSignalStaircaseState(
  state: CccSignalStaircaseState,
  correct: boolean,
): CccSignalStaircaseState {
  if (!correct) return { level: clampSignalLevel(state.level - 1), consecutiveCorrect: 0 };
  const consecutiveCorrect = state.consecutiveCorrect + 1;
  if (consecutiveCorrect < 2) return { ...state, consecutiveCorrect };
  return { level: clampSignalLevel(state.level + 1), consecutiveCorrect: 0 };
}

export function signalStaircaseStateAfterResults(
  results: readonly CccRecordedTrial[],
): CccSignalStaircaseState {
  return results
    .filter((result) => result.trial.estimand === "signal_capacity" && result.scoring.responseClass !== "invalid")
    .reduce(
      (state, result) => nextSignalStaircaseState(state, result.scoring.isCorrect),
      { level: CCC_SIGNAL_INITIAL_LEVEL, consecutiveCorrect: 0 },
    );
}

export function signalDemandBitsPerSecond(result: CccRecordedTrial): number | null {
  if (result.trial.estimand !== "signal_capacity" || !result.exposureMsActual || result.exposureMsActual <= 0) return null;
  return CCC_SIGNAL_INFORMATION_BITS[result.trial.ratio] / (result.exposureMsActual / 1000);
}

export function classifySignalTiming(
  requestedMs: number,
  actualMs: number,
): CccRecordedTrial["timingQuality"] {
  const error = Math.abs(actualMs - requestedMs);
  const proportion = error / Math.max(1, requestedMs);
  if (error <= Math.max(20, requestedMs * 0.15)) return "good";
  if (proportion <= 0.3) return "acceptable";
  return "poor";
}
