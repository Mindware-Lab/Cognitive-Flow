import { describe, expect, it } from "vitest";
import { generateTrial } from "../src/generator";
import {
  opticFlowAperturesForTrial,
  opticFlowDotsForTrial,
  opticFlowMaskAperturesForTrial,
  opticFlowMaskDotsForTrial,
} from "../src/opticFlow";

function distanceFromCenter(x: number, y: number): number {
  return Math.hypot(x - 50, y - 50);
}

describe("optic flow stimulus generation", () => {
  it("generates deterministic sparse-dot optic flow for every flow trial", () => {
    const trial = generateTrial("session", "block", 0, "ACC", "P2_FLOW_ABS", "flow_abs", false, {
      ratio: "3:2",
      exposureMs: 300,
    });

    const first = opticFlowDotsForTrial(trial);
    const second = opticFlowDotsForTrial(trial);

    expect(first).toHaveLength(80);
    expect(second).toEqual(first);
    expect(first.every((dot) => dot.x >= 4 && dot.x <= 96 && dot.y >= 4 && dot.y <= 96)).toBe(true);
    expect(
      first.every(
        (dot) =>
          Math.hypot(dot.x - dot.apertureX, dot.y - dot.apertureY) <= dot.apertureRadius,
      ),
    ).toBe(true);
  });

  it("preserves the five-aperture majority-ratio structure", () => {
    const trial = generateTrial("session", "block", 0, "ACC", "P2_FLOW_ABS", "flow_abs", false, {
      ratio: "4:1",
      exposureMs: 300,
    });
    const apertures = opticFlowAperturesForTrial(trial);
    const counts = apertures.reduce<Record<string, number>>((accumulator, aperture) => {
      accumulator[aperture.relation] = (accumulator[aperture.relation] || 0) + 1;
      return accumulator;
    }, {});

    expect(apertures).toHaveLength(5);
    expect(Math.max(...Object.values(counts))).toBe(4);
  });

  it("uses translation vectors for absolute optic-flow motion", () => {
    const trial = generateTrial("session", "block", 1, "ACC", "P2_FLOW_ABS", "flow_abs", false, {
      ratio: "4:1",
      exposureMs: 300,
    });
    const dots = opticFlowDotsForTrial(trial);

    for (const dot of dots) {
      expect(dot.toY).toBeCloseTo(dot.fromY, 5);
      if (dot.relation === "left") expect(dot.toX).toBeLessThan(dot.fromX);
      if (dot.relation === "right") expect(dot.toX).toBeGreaterThan(dot.fromX);
    }
  });

  it("uses the game-window centre for relative optic-flow expansion and contraction", () => {
    const trial = generateTrial("session", "block", 2, "ACC", "P4_FLOW_REL", "flow_rel", false, {
      ratio: "4:1",
      exposureMs: 300,
    });
    const dots = opticFlowDotsForTrial(trial);

    for (const dot of dots) {
      const fromDistance = distanceFromCenter(dot.fromX, dot.fromY);
      const toDistance = distanceFromCenter(dot.toX, dot.toY);
      if (dot.relation === "out") expect(toDistance).toBeGreaterThan(fromDistance);
      if (dot.relation === "in") expect(toDistance).toBeLessThan(fromDistance);
    }
  });

  it("keeps BSE flow as coloured relation-token evidence", () => {
    const trial = generateTrial("session", "block", 3, "BSE", "P4_FLOW_REL", "flow_rel", false, {
      ratio: "3:2",
      exposureMs: 300,
    });
    const apertures = opticFlowAperturesForTrial(trial);
    const dots = apertures.flatMap((aperture) => aperture.dots);

    expect(trial.responseOptions).toEqual(["out_blue", "out_yellow", "in_blue", "in_yellow"]);
    expect(apertures).toHaveLength(5);
    expect(new Set(dots.map((dot) => dot.color)).size).toBeGreaterThan(1);
  });

  it("creates a dense backward mask for optic-flow apertures", () => {
    const trial = generateTrial("session", "block", 4, "ACC", "P2_FLOW_ABS", "flow_abs", false, {
      ratio: "5:0",
      exposureMs: 300,
    });

    expect(opticFlowMaskAperturesForTrial(trial)).toHaveLength(5);
    expect(opticFlowMaskDotsForTrial(trial).length).toBeGreaterThan(opticFlowDotsForTrial(trial).length);
  });
});
