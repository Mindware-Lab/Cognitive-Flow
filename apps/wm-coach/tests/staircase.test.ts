import { describe, expect, it } from "vitest";
import { nextNLevelFromAccuracy } from "../src/staircase";

describe("WM n-level adaptation", () => {
  it("moves up, down or holds using Capacity Gym thresholds", () => {
    expect(nextNLevelFromAccuracy(2, 0.9)).toBe(3);
    expect(nextNLevelFromAccuracy(2, 0.74)).toBe(1);
    expect(nextNLevelFromAccuracy(2, 0.82)).toBe(2);
  });
});
