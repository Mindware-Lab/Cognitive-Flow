import { describe, expect, it } from "vitest";
import { createOpticFlowTesterPlan } from "../src/cccTester";

describe("optic-flow tester plans", () => {
  it("uses the real non-diagnostic attention recovery block", () => {
    const plan = createOpticFlowTesterPlan("attention", "tester-attention");
    expect(plan.blocks).toHaveLength(1);
    expect(plan.blocks[0]).toMatchObject({
      operator: "attention",
      phase: "p1a_flow_recovery",
      wrapperId: "flow_rel",
      diagnostic: false,
      shiftViewBefore: false,
    });
    expect(plan.trials.length).toBeGreaterThan(0);
    expect(plan.trials.every((trial) => trial.wrapperId === "flow_rel" && trial.carrier === "flow")).toBe(true);
  });

  it("offers a separately cued rotational binary attention block", () => {
    const plan = createOpticFlowTesterPlan("attention_rotational", "tester-rotation");
    expect(plan.blocks[0].attentionPair).toBe("rotational");
    expect(new Set(plan.trials.flatMap((trial) => trial.answerOptions))).toEqual(new Set(["cw", "ccw"]));
    expect(new Set(plan.trials.map((trial) => trial.targetClass))).toEqual(new Set(["cw", "ccw"]));
    expect(plan.trials.every((trial) => trial.responseLabels.labels.cw === "Clockwise")).toBe(true);
    expect(plan.trials.every((trial) => trial.responseLabels.labels.ccw === "Anti-clockwise")).toBe(true);
    expect(plan.trials.flatMap((trial) => trial.answerOptions)).not.toContain("in");
    expect(plan.trials.flatMap((trial) => trial.answerOptions)).not.toContain("out");
  });

  it.each([
    ["wm_1", 1],
    ["wm_2", 2],
    ["wm_3", 3],
  ] as const)("uses the real optic-flow %s-back memory block", (exercise, level) => {
    const plan = createOpticFlowTesterPlan(exercise, `tester-${exercise}`);
    expect(plan.blocks).toHaveLength(1);
    expect(plan.blocks[0]).toMatchObject({
      operator: "relational_wm",
      phase: "p1b_wm_flow_recovery",
      wrapperId: "flow_rel",
      wmNLevel: level,
      diagnostic: false,
      shiftViewBefore: false,
    });
    expect(plan.trials.filter((trial) => trial.wmBuffer)).toHaveLength(level);
    expect(plan.trials.every((trial) => trial.wrapperId === "flow_rel" && trial.carrier === "flow")).toBe(true);
  });

  it.each([
    ["arrow_wm_1", 1],
    ["arrow_wm_2", 2],
    ["arrow_wm_3", 3],
  ] as const)("uses the same continuous %s-back plan for arrows", (exercise, level) => {
    const plan = createOpticFlowTesterPlan(exercise, `tester-${exercise}`);
    expect(plan.blocks[0]).toMatchObject({ wrapperId: "arrow_rel", wmNLevel: level });
    expect(plan.trials).toHaveLength(20 + level);
    expect(plan.trials.every((trial) => trial.carrier === "arrow")).toBe(true);
  });
});
