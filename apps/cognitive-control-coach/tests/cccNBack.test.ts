import { describe, expect, it } from "vitest";
import {
  CCC_NBACK_RELATIONS,
  classifyNBackOutcome,
  differentNBackRelation,
  feedbackIconForNBackOutcome,
  scheduleNBackMatches,
} from "../src/cccNBack";

describe("CCC continuous n-back engine", () => {
  it("schedules six targets in twenty scored comparisons without avoidable adjacent targets", () => {
    let value = 0;
    const matches = scheduleNBackMatches(20, 3, 0.3, () => (value = (value + 0.173) % 1));
    expect(matches.size).toBe(6);
    expect([...matches].every((slot) => slot >= 3 && slot < 23)).toBe(true);
    expect([...matches].every((slot) => !matches.has(slot + 1))).toBe(true);
  });

  it("uses a four-relation alphabet and excludes the true n-back value for non-targets", () => {
    expect(CCC_NBACK_RELATIONS).toEqual(["in", "out", "cw", "ccw"]);
    for (const relation of CCC_NBACK_RELATIONS) {
      expect(differentNBackRelation([relation], () => 0)).not.toBe(relation);
    }
  });

  it("classifies go/no-go outcomes and keeps correct rejections silent", () => {
    expect(classifyNBackOutcome(false, true, true)).toBe("hit");
    expect(classifyNBackOutcome(false, true, false)).toBe("miss");
    expect(classifyNBackOutcome(false, false, true)).toBe("false_alarm");
    expect(classifyNBackOutcome(false, false, false)).toBe("correct_rejection");
    expect(feedbackIconForNBackOutcome("hit", true)).toBe("check");
    expect(feedbackIconForNBackOutcome("miss", true)).toBe("cross");
    expect(feedbackIconForNBackOutcome("false_alarm", true)).toBe("cross");
    expect(feedbackIconForNBackOutcome("correct_rejection", true)).toBeNull();
    expect(feedbackIconForNBackOutcome("hit", false)).toBeNull();
  });
});
