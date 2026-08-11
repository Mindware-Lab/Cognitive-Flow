import { describe, expect, it } from "vitest";
import {
  conditionForLevel,
  hConditionBits,
  INITIAL_STAIRCASE_LEVEL,
  nextStaircaseLevel,
} from "../src/staircase";

describe("adaptive staircase sampling", () => {
  it("starts near the middle of the fixed frame-safe grid", () => {
    expect(conditionForLevel(INITIAL_STAIRCASE_LEVEL)).toEqual({ ratio: "4:1", exposureMs: 500 });
  });

  it("moves harder after correct responses and easier after incorrect responses", () => {
    expect(conditionForLevel(nextStaircaseLevel(INITIAL_STAIRCASE_LEVEL, true))).toEqual({
      ratio: "3:2",
      exposureMs: 700,
    });
    expect(conditionForLevel(nextStaircaseLevel(INITIAL_STAIRCASE_LEVEL, false))).toEqual({
      ratio: "4:1",
      exposureMs: 700,
    });
  });

  it("uses versioned protocol entropy values for ACC ratios", () => {
    expect(hConditionBits("5:0")).toBe(1.58);
    expect(hConditionBits("4:1")).toBe(2.91);
    expect(hConditionBits("3:2")).toBe(4.91);
  });
});
