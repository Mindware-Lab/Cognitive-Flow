import { describe, expect, it } from "vitest";
import { createP0AttentionCarrierTransferPlan } from "../src/cccGenerator";
import { buildCccStrategyFeedback } from "../src/cccStrategy";
import { scoreCccAttentionTrial } from "../src/cccValue";
import type { CccAttentionTrialDefinition, CccRecordedTrial, CccRatio, CccRegimeId } from "../src/cccTypes";

const template = createP0AttentionCarrierTransferPlan({
  seed: "strategy-feedback",
  regimePair: ["clear_sprint", "deep_check"],
  microcyclesPerWrapper: 1,
}).trials.find((trial) => trial.estimand === "policy")!;

function result(
  regimeId: CccRegimeId,
  responseTimeMs: number,
  correct: boolean,
  ratio: CccRatio = "3:2",
): CccRecordedTrial {
  const trial: CccAttentionTrialDefinition = { ...template, regimeId, ratio };
  const response = correct
    ? trial.correctResponse
    : trial.answerOptions.find((answer) => answer !== trial.correctResponse)!;
  return {
    trial,
    response,
    scoring: scoreCccAttentionTrial({ trial, response, responseTimeMs }),
    recordedAt: "2026-08-13T00:00:00.000Z",
    viewportClass: "desktop",
    inputMode: "keyboard",
    focusLost: false,
    exposureMsActual: null,
    actualStimulusFrames: null,
    deviceRefreshRateEstimate: null,
    timingQuality: "not_applicable",
  };
}

describe("CCC strategic policy coaching", () => {
  it("uses principle-first guidance until there are enough informative choices", () => {
    const feedback = buildCccStrategyFeedback([
      result("clear_sprint", 850, true),
      result("deep_check", 1100, false),
    ], ["clear_sprint", "deep_check"], "attention");
    expect(feedback.modelReady).toBe(false);
    expect(feedback.regimes.map((item) => item.direction)).toEqual(["keep_learning", "keep_learning"]);
    expect(feedback.principle).toContain("errors are costly");
    expect(feedback.principle).toContain("points are fading quickly");
    expect(feedback.principle).not.toContain("evidence");
  });

  it("keeps each regime separate when estimating strategy", () => {
    const observations = [
      ...Array.from({ length: 12 }, (_, index) => result("clear_sprint", 1850 + index * 100, index < 10, index % 3 === 0 ? "4:1" : "3:2")),
      ...Array.from({ length: 12 }, (_, index) => result("deep_check", 450 + index * 55, index >= 5, index % 3 === 0 ? "4:1" : "3:2")),
    ];
    const feedback = buildCccStrategyFeedback(observations, ["clear_sprint", "deep_check"], "attention");
    expect(feedback.modelReady).toBe(true);
    expect(feedback.regimes).toHaveLength(2);
    expect(feedback.regimes[0].regimeId).toBe("clear_sprint");
    expect(feedback.regimes[1].regimeId).toBe("deep_check");
    expect(feedback.regimes.every((item) => item.observationCount >= 5)).toBe(true);
  });
});
