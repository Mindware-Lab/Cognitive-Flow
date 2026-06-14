import { DEMO_CONDITIONS } from "./generator";
import type { CapacityEstimate, Ratio, TrialCondition, TrialResult } from "./types";

const GROUP_PROBABILITY: Record<Ratio, number> = {
  "5:0": 1,
  "4:1": 0.4,
  "3:2": 0.1,
};

const P0 = 0.98;
const GUESS = 0.5;

export function predictedCorrect(
  capacityBps: number,
  ratio: Ratio,
  exposureMs: number,
  p0 = P0,
): number {
  const groupProbability = GROUP_PROBABILITY[ratio];
  const samples = (2 ** capacityBps * (exposureMs / 1000)) / 3;
  const searchProbability = 1 - (1 - groupProbability) ** samples;
  return p0 * searchProbability + GUESS * (1 - searchProbability);
}

function likelihood(capacityBps: number, trials: readonly TrialResult[]): number {
  return trials.reduce((total, result) => {
    const probability = Math.min(
      0.999,
      Math.max(
        0.001,
        predictedCorrect(
          capacityBps,
          result.trial.ratio,
          result.exposureMsActual || result.trial.exposureMs,
        ),
      ),
    );
    return total + Math.log(result.isCorrect ? probability : 1 - probability);
  }, 0);
}

export function estimateCapacity(results: readonly TrialResult[]): CapacityEstimate {
  const valid = results.filter(
    (result) => !result.trial.practice && !result.timingContaminated && result.response !== null,
  );
  if (!valid.length) {
    return {
      capacityBps: 0,
      logLikelihood: 0,
      validTrials: 0,
      accuracy: 0,
      intervalLow: 0,
      intervalHigh: 10,
      intervalWidth: 10,
      reliability: "Still calibrating",
    };
  }

  let bestCapacity = 0;
  let bestLikelihood = Number.NEGATIVE_INFINITY;
  const curve: Array<{ capacity: number; likelihood: number }> = [];
  for (let step = 0; step <= 1000; step += 1) {
    const capacity = step / 100;
    const value = likelihood(capacity, valid);
    curve.push({ capacity, likelihood: value });
    if (value > bestLikelihood) {
      bestLikelihood = value;
      bestCapacity = capacity;
    }
  }

  const profile = curve.filter(({ likelihood: value }) => 2 * (bestLikelihood - value) <= 3.84);
  const intervalLow = profile[0]?.capacity ?? 0;
  const intervalHigh = profile.at(-1)?.capacity ?? 10;
  return {
    capacityBps: bestCapacity,
    logLikelihood: bestLikelihood,
    validTrials: valid.length,
    accuracy: valid.filter((result) => result.isCorrect).length / valid.length,
    intervalLow,
    intervalHigh,
    intervalWidth: intervalHigh - intervalLow,
    reliability: valid.length < 36 ? "Illustrative only" : "Still calibrating",
  };
}

function fisherInformation(capacityBps: number, condition: TrialCondition): number {
  const delta = 0.01;
  const probability = predictedCorrect(capacityBps, condition.ratio, condition.exposureMs);
  const derivative =
    (predictedCorrect(capacityBps + delta, condition.ratio, condition.exposureMs) -
      predictedCorrect(capacityBps - delta, condition.ratio, condition.exposureMs)) /
    (2 * delta);
  return derivative ** 2 / Math.max(0.001, probability * (1 - probability));
}

export function chooseNextCondition(
  results: readonly TrialResult[],
  timingLimited: boolean,
  random: () => number,
): TrialCondition {
  const estimate = estimateCapacity(results);
  const candidates = DEMO_CONDITIONS.filter(
    (condition) => !timingLimited || condition.exposureMs >= 500,
  );
  if (results.filter((result) => !result.trial.practice).length % 9 === 8) {
    return { ratio: "5:0", exposureMs: timingLimited ? 1000 : 500 };
  }
  const weighted = candidates.map((condition) => {
    const uses = results.filter(
      (result) =>
        result.trial.ratio === condition.ratio &&
        result.trial.exposureMs === condition.exposureMs,
    ).length;
    return {
      condition,
      weight: fisherInformation(estimate.capacityBps || 3.5, condition) / (1 + uses * 0.6),
    };
  });
  const total = weighted.reduce((sum, item) => sum + item.weight, 0);
  let cursor = random() * total;
  for (const item of weighted) {
    cursor -= item.weight;
    if (cursor <= 0) return item.condition;
  }
  return weighted.at(-1)!.condition;
}
