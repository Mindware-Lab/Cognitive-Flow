import { describe, expect, it } from "vitest";
import { createP0AttentionCarrierTransferPlan } from "../src/cccGenerator";
import { scoreCccAttentionTrial, summarizeCccAttentionScores } from "../src/cccValue";

const [trial] = createP0AttentionCarrierTransferPlan({ seed: "value-test", regimePairIndex: 0, microcyclesPerWrapper: 1 }).trials;

describe("CCC value scoring", () => {
  it("drains the correct reward over one shared 4000 ms response window", () => {
    const scored = scoreCccAttentionTrial({ trial: { ...trial, regimeId: "clear_sprint", correctResponse: "left" }, response: "left", responseTimeMs: 1000 });
    expect(scored.responseClass).toBe("answer");
    expect(scored.isCorrect).toBe(true);
    expect(scored.rewardRemaining).toBe(35);
    expect(scored.pointsRealised).toBe(35);
    expect(scored.normalizedValue).toBeCloseTo(35 / 60);
  });

  it("applies error losses by regime and keeps withhold at zero", () => {
    const wrong = scoreCccAttentionTrial({ trial: { ...trial, regimeId: "deep_check", correctResponse: "right" }, response: "left", responseTimeMs: 1200 });
    const withheld = scoreCccAttentionTrial({ trial: { ...trial, regimeId: "deep_check", correctResponse: "right" }, response: "withhold", responseTimeMs: 1200 });
    expect(wrong.pointsRealised).toBe(-50);
    expect(wrong.isValidDecision).toBe(true);
    expect(withheld.responseClass).toBe("withhold");
    expect(withheld.pointsRealised).toBe(0);
    expect(withheld.isValidDecision).toBe(true);
  });

  it("records omissions separately from invalid early or aborted trials", () => {
    const omitted = scoreCccAttentionTrial({ trial, response: null, responseTimeMs: null });
    const late = scoreCccAttentionTrial({ trial, response: trial.correctResponse, responseTimeMs: 4010 });
    const early = scoreCccAttentionTrial({ trial, response: trial.correctResponse, responseTimeMs: 200 });
    const aborted = scoreCccAttentionTrial({ trial, response: trial.correctResponse, responseTimeMs: 900, invalidated: true, invalidReason: "aborted" });
    const focusLoss = scoreCccAttentionTrial({ trial, response: null, responseTimeMs: 900, invalidated: true, invalidReason: "focus_loss" });
    expect(omitted.responseClass).toBe("omission");
    expect(late.responseClass).toBe("omission");
    expect(early.responseClass).toBe("invalid");
    expect(aborted.responseClass).toBe("invalid");
    expect(aborted.invalidReason).toBe("aborted");
    expect(focusLoss.invalidReason).toBe("focus_loss");
  });

  it("summarizes valid decisions, omissions, invalidations, and answered accuracy", () => {
    const scores = [
      scoreCccAttentionTrial({ trial, response: trial.correctResponse, responseTimeMs: 900 }),
      scoreCccAttentionTrial({ trial, response: "withhold", responseTimeMs: 900 }),
      scoreCccAttentionTrial({ trial, response: null, responseTimeMs: null }),
      scoreCccAttentionTrial({ trial, response: trial.correctResponse, responseTimeMs: 100, invalidated: true }),
    ];
    expect(summarizeCccAttentionScores(scores)).toMatchObject({
      validDecisionCount: 2,
      answeredCount: 1,
      withholdCount: 1,
      omissionCount: 1,
      invalidCount: 1,
      answeredAccuracy: 1,
    });
  });
});
