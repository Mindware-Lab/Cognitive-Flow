import { describe, expect, it } from "vitest";
import { OCTAGON_POSITIONS, radialVector, vectorForRelation } from "../src/geometry";

function screenCross(
  radial: { x: number; y: number },
  tangent: { x: number; y: number },
): number {
  return radial.x * tangent.y - radial.y * tangent.x;
}

describe("CCC arrow relation geometry", () => {
  it("uses visually clockwise and anti-clockwise tangents in screen coordinates", () => {
    for (const position of OCTAGON_POSITIONS) {
      const radial = radialVector(position);
      const clockwise = vectorForRelation("cw", position);
      const antiClockwise = vectorForRelation("ccw", position);

      // The SVG y axis points down, so a positive screen-space cross product
      // is clockwise and a negative one is anti-clockwise.
      expect(screenCross(radial, clockwise)).toBeGreaterThan(0);
      expect(screenCross(radial, antiClockwise)).toBeLessThan(0);
    }
  });

  it("points clockwise downwards and anti-clockwise upwards at the right edge", () => {
    expect(vectorForRelation("cw", { x: 88, y: 50 })).toEqual({ x: -0, y: 1 });
    expect(vectorForRelation("ccw", { x: 88, y: 50 })).toEqual({ x: 0, y: -1 });
  });
});
