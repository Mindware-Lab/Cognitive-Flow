import { describe, expect, it } from "vitest";
import { generateTrial } from "../src/generator";
import { estimateCapacity, predictedCorrect } from "../src/scoring";
import type { TrialResult } from "../src/types";

function result(index: number, correct: boolean, contaminated = false): TrialResult {
  const trial = generateTrial("score-seed", "abs_lr", index, {
    ratio: index % 2 ? "4:1" : "3:2",
    exposureMs: index % 3 ? 1000 : 500,
  });
  return {
    trial,
    response: correct ? trial.correctResponse : trial.correctResponse === "left" ? "right" : "left",
    isCorrect: correct,
    rtMs: 500,
    exposureMsActual: trial.exposureMs,
    frameCountExpected: 60,
    frameCountObserved: 60,
    timingContaminated: contaminated,
  };
}

describe("MFT-M scoring", () => {
  it("predicts higher accuracy at higher capacity", () => {
    expect(predictedCorrect(4, "3:2", 1000)).toBeGreaterThan(
      predictedCorrect(2, "3:2", 1000),
    );
  });

  it("treats 5:0 catches as capacity-independent", () => {
    expect(predictedCorrect(1, "5:0", 250)).toBeCloseTo(
      predictedCorrect(8, "5:0", 2000),
    );
  });

  it("excludes contaminated trials from the estimate", () => {
    const estimate = estimateCapacity([
      result(1, true),
      result(2, false),
      result(3, true, true),
    ]);
    expect(estimate.validTrials).toBe(2);
    expect(estimate.capacityBps).toBeGreaterThanOrEqual(0);
    expect(estimate.capacityBps).toBeLessThanOrEqual(10);
  });
});
