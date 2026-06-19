import { describe, expect, it } from "vitest";
import {
  ARROW_HEAD_LENGTH_RATIO,
  ARROW_HEAD_WIDTH_RATIO,
  ARROW_LENGTH,
  ARROW_SHAFT_WIDTH_RATIO,
  MASK_DIAMETER,
  OCTAGON_POSITIONS,
  PAPER_ARROW_TO_RADIUS_RATIO,
  STIMULUS_CENTRE,
  STIMULUS_RADIUS,
  anticlockwiseTangent,
  arrowPolygonPoints,
  clockwiseTangent,
  diamondPolygonPoints,
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

  it("matches the published arrow, mask, and radius proportions", () => {
    expect(ARROW_LENGTH).toBeCloseTo(MASK_DIAMETER);
    expect(ARROW_LENGTH / STIMULUS_RADIUS).toBeCloseTo(PAPER_ARROW_TO_RADIUS_RATIO);
    for (const position of OCTAGON_POSITIONS) {
      expect(
        Math.hypot(position.x - STIMULUS_CENTRE.x, position.y - STIMULUS_CENTRE.y),
      ).toBeCloseTo(STIMULUS_RADIUS);
    }
  });

  it("uses a bounded, versioned arrow silhouette", () => {
    expect(ARROW_HEAD_LENGTH_RATIO).toBe(0.5);
    expect(ARROW_HEAD_WIDTH_RATIO).toBe(1);
    expect(ARROW_SHAFT_WIDTH_RATIO).toBe(0.18);
    const coordinates = arrowPolygonPoints()
      .split(" ")
      .map((point) => point.split(",").map(Number));
    const xs = coordinates.map(([x]) => x);
    expect(Math.max(...xs) - Math.min(...xs)).toBeCloseTo(ARROW_LENGTH, 2);
  });

  it("renders a mask whose horizontal and vertical diameters equal the arrow length", () => {
    const position = OCTAGON_POSITIONS[0];
    const coordinates = diamondPolygonPoints(position)
      .split(" ")
      .map((point) => point.split(",").map(Number));
    const xs = coordinates.map(([x]) => x);
    const ys = coordinates.map(([, y]) => y);
    expect(Math.max(...xs) - Math.min(...xs)).toBeCloseTo(ARROW_LENGTH, 2);
    expect(Math.max(...ys) - Math.min(...ys)).toBeCloseTo(ARROW_LENGTH, 2);
  });
});
