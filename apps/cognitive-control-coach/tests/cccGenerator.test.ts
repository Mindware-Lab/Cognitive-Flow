import { describe, expect, it } from "vitest";
import { CCC_TRIAL_TIMING } from "../src/cccConfig";
import {
  adaptSignalTrial,
  createCccReplacementTrial,
  createP0AttentionCarrierTransferPlan,
  createP0PracticeBlock,
  createP0PracticeTrials,
} from "../src/cccGenerator";

describe("CCC P0 dual-estimand generator", () => {
  it("creates a protected signal anchor followed by the complete relative carrier-transfer journey", () => {
    const plan = createP0AttentionCarrierTransferPlan({ seed: "p0-plan", regimePairIndex: 0 });
    expect(plan.blocks.map((block) => block.phase)).toEqual([
      "signal_anchor",
      "arrow_rel_stabilisation",
      "flow_rel_first_contact",
      "flow_rel_recovery",
      "arrow_rel_return",
      "relative_mix",
    ]);
    expect(plan.blocks[0]).toMatchObject({
      wrapperId: "arrow_abs",
      estimand: "signal_capacity",
      presentationMode: "masked_forced_choice",
      validTrialCount: 24,
    });
    expect(plan.blocks[1]).toMatchObject({ wrapperId: "arrow_rel", estimand: "policy" });
    expect(plan.blocks[1]).toMatchObject({
      learningCurveGate: "source_stabilisation",
      microcycleCount: 10,
      validTrialCount: 120,
    });
    expect(plan.blocks[2]).toMatchObject({
      wrapperId: "flow_rel",
      sourceWrapperId: "arrow_rel",
      transitionKind: "carrier_transfer",
      strictCarrierTransferBoundary: true,
      diagnostic: true,
      shiftViewBefore: true,
      learningCurveGate: null,
    });
    expect(plan.blocks[5]).toMatchObject({ wrapperId: "mixed_rel", wrappers: ["arrow_rel", "flow_rel"] });
    const relative = plan.trials.filter((trial) => trial.referenceFrame === "relative");
    expect(relative.length / plan.trials.length).toBeGreaterThanOrEqual(0.8);
    expect(relative.every((trial) => trial.answerOptions.join("|") === "in|out")).toBe(true);
  });

  it("protects relative-flow first contact and does not contaminate recovery", () => {
    const plan = createP0AttentionCarrierTransferPlan({ seed: "boundary-check", regimePairIndex: 0 });
    const boundaryTrials = plan.trials.filter((trial) => trial.strictCarrierTransferBoundary);
    expect(new Set(boundaryTrials.map((trial) => trial.phase))).toEqual(new Set(["flow_rel_first_contact"]));
    expect(boundaryTrials.every((trial) => trial.diagnostic && trial.assistedFirstContact)).toBe(true);
    expect(plan.trials.filter((trial) => trial.phase === "flow_rel_recovery").every((trial) => !trial.diagnostic)).toBe(true);
  });

  it("balances forced-choice targets and constrains clarity quotas within each niche microcycle", () => {
    const plan = createP0AttentionCarrierTransferPlan({ seed: "balance-check", regimePairIndex: 1 });
    for (const block of plan.blocks.filter((candidate) => candidate.presentationMode === "self_paced_value")) {
      for (let microcycle = 1; microcycle <= block.microcycleCount; microcycle += 1) {
        for (const regimeId of plan.regimePair) {
          const group = plan.trials.filter((trial) => trial.blockId === block.id
            && trial.microcycleIndex === microcycle
            && trial.regimeId === regimeId);
          expect(group).toHaveLength(CCC_TRIAL_TIMING.validTrialsPerRegimeMicrocycle);
          expect(group.filter((trial) => trial.targetClass === "in")).toHaveLength(group.length / 2);
          expect(group.filter((trial) => trial.targetClass === "out")).toHaveLength(group.length / 2);
          const quota = Object.fromEntries(["5:0", "4:1", "3:2"].map((ratio) => [ratio, group.filter((trial) => trial.ratio === ratio).length]));
          expect(Object.values(quota).sort()).toEqual([1, 2, 3]);
        }
      }
    }
  });

  it("keeps absolute Left/Right practice brief, unscored and outside the guided relative quota", () => {
    const plan = createP0AttentionCarrierTransferPlan({ seed: "practice", regimePairIndex: 0 });
    const practice = createP0PracticeTrials(plan);
    const practiceBlock = createP0PracticeBlock(plan);
    expect(practice).toHaveLength(4);
    expect(practiceBlock).toMatchObject({ practice: true, validTrialCount: 4, phase: "practice", estimand: "practice" });
    expect(practice.every((trial) => trial.wrapperId === "arrow_abs" && trial.answerOptions.join("|") === "left|right")).toBe(true);
    const first = createCccReplacementTrial(practice[0], 1, 999);
    expect(first).toMatchObject({ replacementOfTrialId: practice[0].id, trialIndex: 999 });
  });

  it("adapts signal conditions deterministically without changing target balance or response ontology", () => {
    const plan = createP0AttentionCarrierTransferPlan({ seed: "adaptive", regimePairIndex: 0 });
    const signal = plan.trials.find((trial) => trial.phase === "signal_anchor")!;
    const first = adaptSignalTrial(signal, 7);
    const second = adaptSignalTrial(signal, 7);
    expect(first).toEqual(second);
    expect(first).toMatchObject({ ratio: "3:2", exposureMsRequested: 300, signalStaircaseLevel: 7 });
    expect(first.answerOptions).toEqual(["left", "right"]);
    expect(JSON.stringify(first.responseLabels)).not.toContain("withhold");
  });
});
