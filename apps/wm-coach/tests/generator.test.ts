import { describe, expect, it } from "vitest";
import { createFreePlaySessionPlan, createSessionPlan, relationOptionsForCell } from "../src/generator";

describe("WM n-back generator", () => {
  it("creates four mini-blocks with 20 + n displayed trials", () => {
    const plan = createSessionPlan(1, "P1_ARROW_ABS", "active", "sessions 1-5", {});
    expect(plan.miniBlocks).toHaveLength(4);
    expect(plan.miniBlocks.every((block) => block.trialCount === 22)).toBe(true);
    expect(plan.trials).toHaveLength(88);
    expect(plan.trials.filter((trial) => trial.construct === "ACC")).toHaveLength(66);
    expect(plan.trials.filter((trial) => trial.construct === "BSE")).toHaveLength(22);
  });

  it("marks warm-up, match, lure and canonical metadata fields", () => {
    const plan = createSessionPlan(1, "P4_FLOW_REL", "active", "sessions 13-15", { "ACC:flow_rel": 3 });
    const block = plan.miniBlocks[0];
    const trials = plan.trials.filter((trial) => trial.miniBlockId === block.id);
    expect(block.nLevel).toBe(3);
    expect(trials).toHaveLength(23);
    expect(trials.filter((trial) => trial.isWarmup)).toHaveLength(3);
    expect(trials.some((trial) => trial.isMatch && trial.correctResponse === "MATCH")).toBe(true);
    expect(trials.some((trial) => trial.lureType !== null)).toBe(true);
    expect(trials[0]).toMatchObject({
      appId: "wm-coach",
      layer: "relational_memory",
      stimulusCarrier: "optic_flow",
      frame: "relational",
      nLevel: 3,
      modelVersion: "wm-nback-v0.1",
    });
  });

  it("maps relation sets by carrier and frame", () => {
    expect(relationOptionsForCell("arrow_abs")).toEqual(["left", "right", "up", "down"]);
    expect(relationOptionsForCell("arrow_rel")).toEqual(["out", "in", "cw", "ccw"]);
    expect(relationOptionsForCell("flow_rel")).toEqual(["out", "in", "cw", "ccw"]);
  });

  it("creates one-block practice using the requested layer and wrapper", () => {
    const plan = createFreePlaySessionPlan("BSE", "flow_rel");
    expect(plan.miniBlocks).toHaveLength(1);
    expect(plan.trials.every((trial) => trial.layer === "binding_memory")).toBe(true);
    expect(plan.trials.every((trial) => trial.cellKey === "flow_rel")).toBe(true);
  });
});
