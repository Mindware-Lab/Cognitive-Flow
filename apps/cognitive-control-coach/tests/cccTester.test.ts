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

  it.each([
    ["wm_1", 1],
    ["wm_2", 2],
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
});
