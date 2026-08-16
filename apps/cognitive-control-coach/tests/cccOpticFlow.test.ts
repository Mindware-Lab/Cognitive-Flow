import { describe, expect, it } from "vitest";
import { createProgrammeSessionPlan } from "../src/cccProgrammeGenerator";
import {
  cccOpticFlowAperturesForTrial,
  cccOpticFlowDotsForTrial,
  cccOpticFlowSpeedScale,
} from "../src/cccOpticFlow";
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

describe("CCC global-centre motion segments", () => {
  it("uses five deterministic centre-aligned annular sectors", () => {
    const trial = plan.trials.find((candidate) => candidate.carrier === "flow")!;
    const first = cccOpticFlowDotsForTrial(trial);
    const second = cccOpticFlowDotsForTrial(trial);
    const apertures = cccOpticFlowAperturesForTrial(trial);

    expect(apertures).toHaveLength(5);
    expect(first).toHaveLength(80);
    expect(second).toEqual(first);
    expect(apertures.every((aperture) => aperture.path.includes(" A "))).toBe(true);
    expect(apertures.every((aperture) => !("guidePath" in aperture))).toBe(true);
    expect(apertures.every((aperture) => aperture.innerRadius === 29 && aperture.outerRadius === 47)).toBe(true);
    expect(apertures.every((aperture) => aperture.dots.every((dot) => {
      const radius = distanceFromFieldCentre(dot.x, dot.y);
      const dotAngle = Math.atan2(dot.y - 50, dot.x - 50);
      const angleDelta = Math.atan2(
        Math.sin(dotAngle - aperture.centreAngle),
        Math.cos(dotAngle - aperture.centreAngle),
      );
      return radius > aperture.innerRadius
        && radius < aperture.outerRadius
        && Math.abs(angleDelta) < aperture.halfAngle;
    }))).toBe(true);
  });

  it("uses a shallow full-field speed gradient for radial and rotational motion", () => {
    const trials = [
      ...createOpticFlowTesterPlan("attention", "gradient-radial").trials,
      ...createOpticFlowTesterPlan("attention_rotational", "gradient-rotational").trials,
    ];
    const dots = trials.flatMap((trial) => cccOpticFlowDotsForTrial(trial));
    const ordered = [...dots].sort((a, b) => a.fieldDistance - b.fieldDistance);

    expect(new Set(dots.map((dot) => dot.relation))).toEqual(new Set(["in", "out", "cw", "ccw"]));
    expect(dots.every((dot) => dot.speedScale === cccOpticFlowSpeedScale(dot.x, dot.y))).toBe(true);
    expect(dots.every((dot) => {
      const travel = Math.hypot(dot.toX - dot.fromX, dot.toY - dot.fromY);
      return Math.abs(travel / dot.speedScale - 6.1) < 0.000_001;
    })).toBe(true);
    expect(ordered.at(-1)!.speedScale).toBeGreaterThan(ordered[0].speedScale);
    expect(ordered.at(-1)!.speedScale - ordered[0].speedScale).toBeLessThan(0.1);
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

  it("does not treat each segment centre as a local expansion centre", () => {
    const trial = plan.trials.find((candidate) => candidate.carrier === "flow")!;
    const nonRadialWithinSegment = cccOpticFlowDotsForTrial(trial).some((dot) => {
      const localPositionX = dot.x - dot.apertureX;
      const localPositionY = dot.y - dot.apertureY;
      const travelX = dot.toX - dot.fromX;
      const travelY = dot.toY - dot.fromY;
      return Math.abs(localPositionX * travelY - localPositionY * travelX) > 0.1;
    });
    expect(nonRadialWithinSegment).toBe(true);
  });

  it("renders clockwise and anti-clockwise dot trajectories with the correct screen-space sign", () => {
    expect(meanScreenCrossForRelation("cw")).toBeGreaterThan(0);
    expect(meanScreenCrossForRelation("ccw")).toBeLessThan(0);
  });
});
