import { describe, expect, it } from "vitest";
import { CCC_TRIAL_TIMING } from "../src/cccConfig";
import {
  adaptSignalTrial,
  createCccReplacementTrial,
  createP0AttentionCarrierTransferPlan,
  createP0PracticeBlock,
  createP0PracticeTrials,
} from "../src/cccGenerator";
import { createProgrammeSessionPlan } from "../src/cccProgrammeGenerator";

describe("CCC P0 dual-estimand generator", () => {
  it("creates the signal anchor and first arrow learning curve without pre-scheduling later wrappers", () => {
    const plan = createP0AttentionCarrierTransferPlan({ seed: "p0-plan", regimePairIndex: 0 });
    expect(plan.blocks.map((block) => block.phase)).toEqual([
      "signal_anchor",
      "arrow_rel_stabilisation",
    ]);
    expect(plan.blocks[0]).toMatchObject({
      wrapperId: "arrow_abs",
      estimand: "signal_capacity",
      presentationMode: "masked_forced_choice",
      validTrialCount: 24,
    });
    expect(plan.blocks[1]).toMatchObject({ wrapperId: "arrow_rel", estimand: "policy" });
    expect(plan.blocks[1]).toMatchObject({
      learningCurveGate: "stage_stabilisation",
      microcycleCount: 10,
      validTrialCount: 120,
    });
    const relative = plan.trials.filter((trial) => trial.referenceFrame === "relative");
    expect(relative.length / plan.trials.length).toBeGreaterThanOrEqual(0.8);
    expect(relative.every((trial) => trial.answerOptions.join("|") === "in|out")).toBe(true);
  });

  it("protects relative-flow first contact and does not contaminate recovery", () => {
    const common = {
      programmeRunId: "boundary-check",
      programmeSessionNumber: 2,
      kind: "p1a_consolidation" as const,
      regimePair: ["clear_sprint", "deep_check"] as const,
      wmLevel: 1 as const,
    };
    const firstContact = createProgrammeSessionPlan({ ...common, sessionId: "first-contact", seed: "first-contact", attentionWrapperStage: "flow_first_contact" });
    const recovery = createProgrammeSessionPlan({ ...common, sessionId: "recovery", seed: "recovery", attentionWrapperStage: "flow_recovery" });
    const boundaryTrials = firstContact.trials.filter((trial) => trial.strictCarrierTransferBoundary);
    expect(new Set(boundaryTrials.map((trial) => trial.phase))).toEqual(new Set(["p1a_flow_first_contact"]));
    expect(boundaryTrials.every((trial) => trial.diagnostic && trial.assistedFirstContact)).toBe(true);
    expect(recovery.trials.every((trial) => !trial.diagnostic && trial.phase === "p1a_flow_recovery")).toBe(true);
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
