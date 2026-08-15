import { describe, expect, it } from "vitest";
import { createProgrammeSessionPlan } from "../src/cccProgrammeGenerator";
import { cccOpticFlowAperturesForTrial, cccOpticFlowDotsForTrial } from "../src/cccOpticFlow";
import { createOpticFlowTesterPlan } from "../src/cccTester";

const plan = createProgrammeSessionPlan({
  programmeRunId: "motion-geometry",
  sessionId: "motion-geometry-session",
  seed: "motion-geometry-seed",
  programmeSessionNumber: 3,
  kind: "p1b_wm_bridge",
  regimePair: ["clear_sprint", "deep_check"],
  wmLevel: 2,
  wmPairLevels: [2, 2],
  wmWrapperStage: "flow_recovery",
});

function distanceFromFieldCentre(x: number, y: number): number {
  return Math.hypot(x - 50, y - 50);
}

function meanScreenCrossForRelation(relation: "cw" | "ccw"): number {
  const rotationalPlan = createOpticFlowTesterPlan("attention_rotational", `motion-${relation}`);
  const crosses = rotationalPlan.trials.flatMap((trial) => cccOpticFlowDotsForTrial(trial))
    .filter((dot) => dot.relation === relation)
    .map((dot) => {
      const midpointX = (dot.fromX + dot.toX) / 2;
      const midpointY = (dot.fromY + dot.toY) / 2;
      const radialX = midpointX - 50;
      const radialY = midpointY - 50;
      const travelX = dot.toX - dot.fromX;
      const travelY = dot.toY - dot.fromY;
      return radialX * travelY - radialY * travelX;
    });
  return crosses.reduce((total, value) => total + value, 0) / crosses.length;
}

describe("CCC global-centre motion patches", () => {
  it("uses five circular clipping patches with deterministic flecks", () => {
    const trial = plan.trials.find((candidate) => candidate.carrier === "flow")!;
    const first = cccOpticFlowDotsForTrial(trial);
    const second = cccOpticFlowDotsForTrial(trial);

    expect(cccOpticFlowAperturesForTrial(trial)).toHaveLength(5);
    expect(first).toHaveLength(80);
    expect(second).toEqual(first);
    expect(first.every((dot) => Math.hypot(dot.x - dot.apertureX, dot.y - dot.apertureY) <= dot.apertureRadius)).toBe(true);
  });

  it("moves each fleck relative to the one centre of the whole screen", () => {
    for (const trial of plan.trials.filter((candidate) => candidate.carrier === "flow")) {
      for (const dot of cccOpticFlowDotsForTrial(trial)) {
        const fromDistance = distanceFromFieldCentre(dot.fromX, dot.fromY);
        const toDistance = distanceFromFieldCentre(dot.toX, dot.toY);
        if (dot.relation === "out") expect(toDistance).toBeGreaterThan(fromDistance);
        if (dot.relation === "in") expect(toDistance).toBeLessThan(fromDistance);
      }
    }
  });

  it("does not treat each patch centre as a local expansion centre", () => {
    const trial = plan.trials.find((candidate) => candidate.carrier === "flow")!;
    const nonRadialWithinPatch = cccOpticFlowDotsForTrial(trial).some((dot) => {
      const localPositionX = dot.x - dot.apertureX;
      const localPositionY = dot.y - dot.apertureY;
      const travelX = dot.toX - dot.fromX;
      const travelY = dot.toY - dot.fromY;
      return Math.abs(localPositionX * travelY - localPositionY * travelX) > 0.1;
    });
    expect(nonRadialWithinPatch).toBe(true);
  });

  it("renders clockwise and anti-clockwise dot trajectories with the correct screen-space sign", () => {
    expect(meanScreenCrossForRelation("cw")).toBeGreaterThan(0);
    expect(meanScreenCrossForRelation("ccw")).toBeLessThan(0);
  });
});
