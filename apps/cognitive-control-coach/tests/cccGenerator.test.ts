import { describe, expect, it } from "vitest";
import { CCC_TRIAL_TIMING } from "../src/cccConfig";
import {
  createCccReplacementTrial,
  createP0AttentionCarrierTransferPlan,
  createP0PracticeBlock,
  createP0PracticeTrials,
} from "../src/cccGenerator";

describe("CCC P0 attention generator", () => {
  it("creates the complete protected carrier-transfer journey", () => {
    const plan = createP0AttentionCarrierTransferPlan({ seed: "p0-plan", regimePairIndex: 0 });
    expect(plan.appId).toBe("cognitive_control_coach");
    expect(plan.stage).toBe("P0");
    expect(plan.shiftViewEligible).toBe(true);
    expect(plan.blocks.map((block) => block.phase)).toEqual([
      "arrow_stabilisation",
      "flow_first_contact",
      "flow_recovery",
      "arrow_return",
      "absolute_mix",
    ]);
    expect(plan.blocks[0]).toMatchObject({ wrapperId: "arrow_abs", strictCarrierTransferBoundary: false });
    expect(plan.blocks[1]).toMatchObject({
      wrapperId: "flow_abs",
      sourceWrapperId: "arrow_abs",
      transitionKind: "carrier_transfer",
      strictCarrierTransferBoundary: true,
      diagnostic: true,
      shiftViewBefore: true,
    });
    expect(plan.blocks[2]).toMatchObject({ wrapperId: "flow_abs", diagnostic: false, strictCarrierTransferBoundary: false });
    expect(plan.blocks[3]).toMatchObject({ wrapperId: "arrow_abs", strictCarrierTransferBoundary: false });
    expect(plan.blocks[4]).toMatchObject({ wrapperId: "mixed_abs", wrappers: ["arrow_abs", "flow_abs"] });
    expect(plan.trials.every((trial) => trial.referenceFrame === "absolute")).toBe(true);
  });

  it("protects first contact and does not label later flow recovery as the boundary", () => {
    const plan = createP0AttentionCarrierTransferPlan({ seed: "boundary-check", regimePairIndex: 0 });
    const boundaryTrials = plan.trials.filter((trial) => trial.strictCarrierTransferBoundary);
    expect(new Set(boundaryTrials.map((trial) => trial.phase))).toEqual(new Set(["flow_first_contact"]));
    expect(boundaryTrials.every((trial) => trial.diagnostic && trial.assistedFirstContact)).toBe(true);
    expect(plan.trials.filter((trial) => trial.phase === "flow_recovery").every((trial) => !trial.diagnostic)).toBe(true);
  });

  it("balances target classes within every wrapper, regime and microcycle", () => {
    const plan = createP0AttentionCarrierTransferPlan({ seed: "balance-check", regimePairIndex: 1 });
    for (const block of plan.blocks) {
      for (let microcycle = 1; microcycle <= block.microcycleCount; microcycle += 1) {
        for (const regimeId of plan.regimePair) {
          for (const wrapperId of block.wrappers) {
            const group = plan.trials.filter((trial) => trial.blockId === block.id
              && trial.wrapperId === wrapperId
              && trial.microcycleIndex === microcycle
              && trial.regimeId === regimeId);
            expect(group).toHaveLength(CCC_TRIAL_TIMING.validTrialsPerRegimeMicrocycle);
            expect(group.filter((trial) => trial.targetClass === "left")).toHaveLength(group.length / 2);
            expect(group.filter((trial) => trial.targetClass === "right")).toHaveLength(group.length / 2);
          }
        }
      }
    }
  });

  it("creates excluded brief practice and deterministic quota replacements", () => {
    const plan = createP0AttentionCarrierTransferPlan({ seed: "practice", regimePairIndex: 0 });
    const practice = createP0PracticeTrials(plan);
    const practiceBlock = createP0PracticeBlock(plan);
    expect(practice).toHaveLength(4);
    expect(practiceBlock).toMatchObject({ practice: true, validTrialCount: 4, phase: "practice" });
    expect(practice.every((trial) => trial.practice && trial.phase === "practice")).toBe(true);
    const first = createCccReplacementTrial(practice[0], 1, 999);
    const second = createCccReplacementTrial(practice[0], 1, 999);
    expect(first).toEqual(second);
    expect(first).toMatchObject({
      regimeId: practice[0].regimeId,
      targetClass: practice[0].targetClass,
      replacementOfTrialId: practice[0].id,
      trialIndex: 999,
    });
  });

  it("generates deterministic plans with first-pilot coherence noise disabled", () => {
    const first = createP0AttentionCarrierTransferPlan({ seed: "deterministic", regimePairIndex: 0 });
    const second = createP0AttentionCarrierTransferPlan({ seed: "deterministic", regimePairIndex: 0 });
    expect(first).toEqual(second);
    expect(first.trials.every((trial) => trial.coherenceNoiseLevel === 0)).toBe(true);
    expect(first.trials.every((trial) => trial.responseLabels.labels.withhold === "Not sure")).toBe(true);
  });
});
