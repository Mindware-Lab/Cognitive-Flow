import { describe, expect, it } from "vitest";
import { CCC_TRIAL_TIMING } from "../src/cccConfig";
import { createP0AttentionCarrierTransferPlan } from "../src/cccGenerator";

describe("CCC P0 attention generator", () => {
  it("creates absolute arrow stabilization followed by strict absolute flow carrier transfer", () => {
    const plan = createP0AttentionCarrierTransferPlan({ seed: "p0-plan", regimePairIndex: 0 });
    expect(plan.appId).toBe("cognitive_control_coach");
    expect(plan.stage).toBe("P0");
    expect(plan.blocks.map((block) => block.stepId)).toEqual(["p0_arrow_abs_stabilize", "p0_flow_abs_transfer"]);
    expect(plan.blocks[0]).toMatchObject({ wrapperId: "arrow_abs", transitionKind: "baseline_stabilization", strictCarrierTransferBoundary: false });
    expect(plan.blocks[1]).toMatchObject({ wrapperId: "flow_abs", sourceWrapperId: "arrow_abs", transitionKind: "carrier_transfer", strictCarrierTransferBoundary: true });
    expect(new Set(plan.trials.map((trial) => trial.wrapperId))).toEqual(new Set(["arrow_abs", "flow_abs"]));
    expect(plan.trials.every((trial) => trial.referenceFrame === "absolute")).toBe(true);
  });

  it("balances target classes inside every wrapper, regime, and microcycle", () => {
    const plan = createP0AttentionCarrierTransferPlan({ seed: "balance-check", regimePairIndex: 1 });
    for (const wrapperId of ["arrow_abs", "flow_abs"] as const) {
      for (let microcycle = 1; microcycle <= CCC_TRIAL_TIMING.minimumBalancedMicrocyclesBeforeFlattening; microcycle += 1) {
        for (const regimeId of plan.regimePair) {
          const group = plan.trials.filter((trial) => trial.wrapperId === wrapperId && trial.microcycleIndex === microcycle && trial.regimeId === regimeId);
          expect(group).toHaveLength(CCC_TRIAL_TIMING.validTrialsPerRegimeMicrocycle);
          const left = group.filter((trial) => trial.targetClass === "left").length;
          const right = group.filter((trial) => trial.targetClass === "right").length;
          expect(left).toBe(right);
        }
      }
    }
  });

  it("keeps first-pilot visual coherence noise disabled and generates deterministic plans", () => {
    const first = createP0AttentionCarrierTransferPlan({ seed: "deterministic", regimePairIndex: 0 });
    const second = createP0AttentionCarrierTransferPlan({ seed: "deterministic", regimePairIndex: 0 });
    expect(first).toEqual(second);
    expect(first.trials.every((trial) => trial.coherenceNoiseLevel === 0)).toBe(true);
    expect(first.trials.every((trial) => trial.responseLabels.labels.withhold === "Withhold")).toBe(true);
  });
});