import { describe, expect, it } from "vitest";
import { createFreePlaySessionPlan, createSessionPlan } from "../src/generator";

describe("session generator", () => {
  it("creates exactly four 20-trial blocks and an 80-trial session", () => {
    const plan = createSessionPlan(1, "P1_ARROW_ABS", "active", "typical sessions 1-5", "seed");
    expect(plan.miniBlocks).toHaveLength(4);
    expect(plan.trials).toHaveLength(80);
    expect(plan.miniBlocks.every((block) => block.trialCount === 20)).toBe(true);
    expect(plan.trials.filter((trial) => trial.construct === "ACC")).toHaveLength(60);
    expect(plan.trials.filter((trial) => trial.construct === "BSE")).toHaveLength(20);
  });

  it("uses the P2 current/reference split", () => {
    const plan = createSessionPlan(6, "P2_FLOW_ABS", "active", "typical sessions 6-8", "seed");
    const acc = plan.trials.filter((trial) => trial.construct === "ACC");
    const bse = plan.trials.filter((trial) => trial.construct === "BSE");
    expect(acc.filter((trial) => trial.cellKey === "flow_abs")).toHaveLength(48);
    expect(acc.filter((trial) => trial.cellKey === "arrow_abs")).toHaveLength(12);
    expect(bse.filter((trial) => trial.cellKey === "flow_abs")).toHaveLength(16);
    expect(bse.filter((trial) => trial.cellKey === "arrow_abs")).toHaveLength(4);
  });

  it("uses the P4 reference split", () => {
    const plan = createSessionPlan(13, "P4_FLOW_REL", "active", "typical sessions 13-15", "seed");
    const acc = plan.trials.filter((trial) => trial.construct === "ACC");
    const bse = plan.trials.filter((trial) => trial.construct === "BSE");
    expect(acc.filter((trial) => trial.cellKey === "flow_rel")).toHaveLength(40);
    expect(acc.filter((trial) => trial.cellKey === "flow_abs")).toHaveLength(10);
    expect(acc.filter((trial) => trial.cellKey === "arrow_rel")).toHaveLength(10);
    expect(bse.filter((trial) => trial.cellKey === "flow_rel")).toHaveLength(12);
    expect(bse.filter((trial) => trial.cellKey === "flow_abs")).toHaveLength(4);
    expect(bse.filter((trial) => trial.cellKey === "arrow_rel")).toHaveLength(4);
  });

  it("randomises P5 mixed cells while preserving 15 ACC and 5 BSE trials per cell", () => {
    const plan = createSessionPlan(16, "P5_MIXED", "mixed", "typical sessions 16-18", "seed");
    for (const cell of ["arrow_abs", "flow_abs", "arrow_rel", "flow_rel"] as const) {
      expect(plan.trials.filter((trial) => trial.construct === "ACC" && trial.cellKey === cell)).toHaveLength(15);
      expect(plan.trials.filter((trial) => trial.construct === "BSE" && trial.cellKey === cell)).toHaveLength(5);
    }
    const accCells = plan.trials.filter((trial) => trial.construct === "ACC").map((trial) => trial.cellKey);
    expect(new Set(accCells.slice(0, 20)).size).toBeGreaterThan(1);
  });

  it("builds BSE trials as relation-colour token majority reports", () => {
    const plan = createSessionPlan(1, "P1_ARROW_ABS", "active", "typical sessions 1-5", "seed");
    const bse = plan.trials.find((trial) => trial.construct === "BSE");
    expect(bse?.responseOptions).toEqual(["left_blue", "left_yellow", "right_blue", "right_yellow"]);
    expect(bse?.correctResponse).toMatch(/_(blue|yellow)$/);
  });

  it("creates a one-block free play game for a selected construct and cell", () => {
    const plan = createFreePlaySessionPlan("BSE", "flow_rel", "free-test");
    expect(plan.nominalBand).toBe("free play");
    expect(plan.miniBlocks).toHaveLength(1);
    expect(plan.trials).toHaveLength(20);
    expect(plan.trials.every((trial) => trial.construct === "BSE")).toBe(true);
    expect(plan.trials.every((trial) => trial.cellKey === "flow_rel")).toBe(true);
  });

  it("creates mixed free play with every carrier-frame cell represented", () => {
    const plan = createFreePlaySessionPlan("ACC", "mixed", "free-mixed");
    for (const cell of ["arrow_abs", "flow_abs", "arrow_rel", "flow_rel"] as const) {
      expect(plan.trials.filter((trial) => trial.cellKey === cell)).toHaveLength(5);
    }
  });
});
