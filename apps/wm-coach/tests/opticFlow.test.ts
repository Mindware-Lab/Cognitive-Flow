import { describe, expect, it } from "vitest";
import { generateTrial } from "../src/generator";
import { opticFlowAperturesForTrial, opticFlowDotsForTrial, opticFlowMaskAperturesForTrial } from "../src/opticFlow";

function distanceFromCenter(x: number, y: number): number {
  return Math.hypot(x - 50, y - 50);
}

describe("WM optic-flow stimuli", () => {
  it("generates deterministic optic flow for one n-back stimulus", () => {
    const trial = generateTrial("session", "block", 0, "ACC", "P2_FLOW_ABS", "flow_abs", false, { ratio: "5:0", exposureMs: 1200, nLevel: 2 });
    const first = opticFlowDotsForTrial(trial);
    const second = opticFlowDotsForTrial(trial);
    expect(opticFlowAperturesForTrial(trial)).toHaveLength(1);
    expect(first).toHaveLength(16);
    expect(second).toEqual(first);
  });

  it("uses translation vectors for absolute optic-flow motion", () => {
    const trial = generateTrial("session", "block", 1, "ACC", "P2_FLOW_ABS", "flow_abs", false, { ratio: "5:0", exposureMs: 1200, nLevel: 2 });
    const dots = opticFlowDotsForTrial(trial);
    for (const dot of dots) {
      if (dot.relation === "left") expect(dot.toX).toBeLessThan(dot.fromX);
      if (dot.relation === "right") expect(dot.toX).toBeGreaterThan(dot.fromX);
      if (dot.relation === "up") expect(dot.toY).toBeLessThan(dot.fromY);
      if (dot.relation === "down") expect(dot.toY).toBeGreaterThan(dot.fromY);
    }
  });

  it("uses centre-relative vectors for relational optic flow", () => {
    const trial = generateTrial("session", "block", 2, "ACC", "P4_FLOW_REL", "flow_rel", false, { ratio: "5:0", exposureMs: 1200, nLevel: 2 });
    const dots = opticFlowDotsForTrial(trial);
    for (const dot of dots) {
      const fromDistance = distanceFromCenter(dot.fromX, dot.fromY);
      const toDistance = distanceFromCenter(dot.toX, dot.toY);
      if (dot.relation === "out") expect(toDistance).toBeGreaterThan(fromDistance);
      if (dot.relation === "in") expect(toDistance).toBeLessThan(fromDistance);
    }
  });

  it("keeps binding flow colour metadata", () => {
    const trial = generateTrial("session", "block", 3, "BSE", "P4_FLOW_REL", "flow_rel", false, { ratio: "5:0", exposureMs: 1200, nLevel: 2 });
    expect(trial.layer).toBe("binding_memory");
    expect(trial.colour).not.toBeNull();
    expect(opticFlowAperturesForTrial(trial)[0].dots[0].color).toMatch(/^#/);
  });

  it("creates an optic-flow mask for the single stimulus", () => {
    const trial = generateTrial("session", "block", 4, "ACC", "P2_FLOW_ABS", "flow_abs", false, { ratio: "5:0", exposureMs: 1200, nLevel: 2 });
    expect(opticFlowMaskAperturesForTrial(trial)).toHaveLength(1);
  });
});
