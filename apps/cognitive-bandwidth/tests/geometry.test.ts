import { describe, expect, it } from "vitest";
import {
  anticlockwiseTangent,
  clockwiseTangent,
  normalize,
  vectorAngleDegrees,
} from "../src/geometry";

describe("geometry", () => {
  it("normalizes vectors", () => {
    expect(normalize({ x: 3, y: 4 })).toEqual({ x: 0.6, y: 0.8 });
  });

  it("uses the browser-coordinate clockwise convention", () => {
    const radialRight = { x: 1, y: 0 };
    expect(clockwiseTangent(radialRight)).toEqual({ x: 0, y: 1 });
    expect(anticlockwiseTangent(radialRight)).toEqual({ x: 0, y: -1 });
  });

  it("converts vectors to SVG rotation angles", () => {
    expect(vectorAngleDegrees({ x: 1, y: 0 })).toBeCloseTo(0);
    expect(vectorAngleDegrees({ x: 0, y: 1 })).toBeCloseTo(90);
  });
});
