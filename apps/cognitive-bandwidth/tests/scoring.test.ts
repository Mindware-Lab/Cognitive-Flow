import { describe, expect, it } from "vitest";
import {
  CAPACITY_CONDITIONS,
  CAPACITY_P0,
  informationRateBitsPerSecond,
} from "../src/capacityModel";
import { generateTrial } from "../src/generator";
import { mulberry32 } from "../src/random";
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
  it("derives the published five-arrow grouping probabilities and information loads", () => {
    expect(CAPACITY_CONDITIONS["5:0"].groupProbability).toBeCloseTo(1);
    expect(CAPACITY_CONDITIONS["4:1"].groupProbability).toBeCloseTo(0.4);
    expect(CAPACITY_CONDITIONS["3:2"].groupProbability).toBeCloseTo(0.1);
    expect(CAPACITY_CONDITIONS["5:0"].informationBits).toBeCloseTo(1.58496, 5);
    expect(CAPACITY_CONDITIONS["4:1"].informationBits).toBeCloseTo(2.90689, 5);
    expect(CAPACITY_CONDITIONS["3:2"].informationBits).toBeCloseTo(4.90689, 5);
    expect(informationRateBitsPerSecond("3:2", 500)).toBeCloseTo(9.81378, 5);
  });

  it("uses the specified fixed asymptotic performance", () => {
    expect(predictedCorrect(4, "5:0", 500)).toBeCloseTo(CAPACITY_P0);
    expect(CAPACITY_P0).toBe(0.97);
  });

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

  it("excludes catch, anticipatory, timeout, and over-deadline trials from capacity fitting", () => {
    const valid = result(1, true);
    const catchResult = result(2, true);
    catchResult.trial = generateTrial("score-seed", "abs_lr", 2, {
      ratio: "5:0",
      exposureMs: 500,
    });
    const anticipatory = { ...result(3, true), rtMs: 80 };
    const timeout = { ...result(4, false), response: null, rtMs: null };
    const late = { ...result(5, true), rtMs: 2201 };
    const estimate = estimateCapacity([valid, catchResult, anticipatory, timeout, late]);
    expect(estimate.validTrials).toBe(1);
  });

  it("recovers a known simulated capacity from valid estimation trials", () => {
    const trueCapacity = 3.2;
    const random = mulberry32(20260614);
    const conditions = [
      { ratio: "4:1" as const, exposureMs: 250 },
      { ratio: "4:1" as const, exposureMs: 500 },
      { ratio: "3:2" as const, exposureMs: 500 },
      { ratio: "3:2" as const, exposureMs: 800 },
    ];
    const results = Array.from({ length: 600 }, (_, index) => {
      const condition = conditions[index % conditions.length];
      const trial = generateTrial("capacity-recovery", "abs_lr", index, condition);
      const isCorrect =
        random() < predictedCorrect(trueCapacity, condition.ratio, condition.exposureMs);
      return {
        trial,
        response: isCorrect
          ? trial.correctResponse
          : trial.correctResponse === "left"
            ? "right"
            : "left",
        isCorrect,
        rtMs: 500,
        exposureMsActual: condition.exposureMs,
        frameCountExpected: 30,
        frameCountObserved: 30,
        timingContaminated: false,
      } satisfies TrialResult;
    });

    expect(estimateCapacity(results).capacityBps).toBeCloseTo(trueCapacity, 0);
  });
});
