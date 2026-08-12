import { describe, expect, it } from "vitest";
import { arrowPolygonPoints, diamondPolygonPoints } from "../src/cccStimulusGeometry";

describe("original Attention Coach stimulus geometry", () => {
  it("uses the original broad four-point arrow", () => {
    expect(arrowPolygonPoints()).toBe("-5,-4 5,0 -5,4 -2,0");
  });

  it("centres a 7.2-unit diamond over each arrow location", () => {
    expect(diamondPolygonPoints({ x: 50, y: 12 })).toBe("50,4.8 57.2,12 50,19.2 42.8,12");
    expect(diamondPolygonPoints({ x: 23, y: 77 })).toBe("23,69.8 30.2,77 23,84.2 15.8,77");
  });
});
