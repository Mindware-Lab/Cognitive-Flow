import { describe, expect, it } from "vitest";
import { vectorForRelation } from "../src/geometry";
import { createInitialTransferControllerState } from "../src/transferController";
import { eligibleFreePlayWrappers, responseAxisForCell, ruleCueForCell, WRAPPER_DEFINITIONS } from "../src/wrapperDefinitions";
import type { Point } from "../src/types";

function dot(left: Point, right: Point): number {
  return left.x * right.x + left.y * right.y;
}

describe("horizontal transfer wrapper definitions", () => {
  it("defines the four retained wrappers as carrier by reference-computation cells", () => {
    expect(WRAPPER_DEFINITIONS.arrow_abs).toMatchObject({
      carrier: "arrow",
      referenceComputation: "fixed_axis",
      responseAxis: "left_right",
    });
    expect(WRAPPER_DEFINITIONS.flow_rel).toMatchObject({
      carrier: "flow",
      referenceComputation: "common_centre",
      responseAxis: "in_out",
      heldOutByDefault: true,
    });
  });

  it("keeps fixed-axis classification independent of item position", () => {
    const positions: Point[] = [{ x: 12, y: 50 }, { x: 88, y: 50 }, { x: 50, y: 12 }];

    for (const position of positions) {
      expect(vectorForRelation("left", position)).toEqual({ x: -1, y: 0 });
      expect(vectorForRelation("right", position)).toEqual({ x: 1, y: 0 });
    }
  });

  it("makes common-centre classification depend on position relative to the centre", () => {
    const leftOfCentre = { x: 12, y: 50 };
    const rightOfCentre = { x: 88, y: 50 };

    expect(dot(vectorForRelation("out", leftOfCentre), { x: -1, y: 0 })).toBeGreaterThan(0);
    expect(dot(vectorForRelation("in", leftOfCentre), { x: -1, y: 0 })).toBeLessThan(0);
    expect(dot(vectorForRelation("out", rightOfCentre), { x: 1, y: 0 })).toBeGreaterThan(0);
    expect(dot(vectorForRelation("in", rightOfCentre), { x: 1, y: 0 })).toBeLessThan(0);
  });

  it("maps rule cues to response axes", () => {
    expect(responseAxisForCell("arrow_abs")).toBe("left_right");
    expect(ruleCueForCell("flow_abs")).toBe("LEFT / RIGHT");
    expect(responseAxisForCell("arrow_rel")).toBe("in_out");
    expect(ruleCueForCell("flow_rel")).toBe("IN / OUT");
  });

  it("excludes clean held-out flow_rel from free-play pools", () => {
    const state = {
      ...createInitialTransferControllerState(),
      activeTargetWrapper: "flow_abs" as const,
    };

    expect(eligibleFreePlayWrappers(state)).toContain("arrow_abs");
    expect(eligibleFreePlayWrappers(state)).toContain("flow_abs");
    expect(eligibleFreePlayWrappers(state)).not.toContain("flow_rel");
    expect(eligibleFreePlayWrappers({ ...state, heldOutStatus: "contaminated" })).toContain("flow_rel");
  });
});
