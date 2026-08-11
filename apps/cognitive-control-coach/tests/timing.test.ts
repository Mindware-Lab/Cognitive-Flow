import { describe, expect, it } from "vitest";
import { timingQualityFromSamples } from "../src/timing";

describe("timing quality", () => {
  it("classifies good, acceptable, and poor timing samples", () => {
    expect(timingQualityFromSamples(0.4, 0)).toBe("good");
    expect(timingQualityFromSamples(1.1, 0.03)).toBe("acceptable");
    expect(timingQualityFromSamples(2.2, 0.08)).toBe("poor");
  });
});
