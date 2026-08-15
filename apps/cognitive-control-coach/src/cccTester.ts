import { createProgrammeSessionPlan } from "./cccProgrammeGenerator";
import type { CccNBackLevel, CccSessionPlan } from "./cccTypes";

export type OpticFlowTesterExercise = "attention" | "wm_1" | "wm_2";

function singleBlockPlan(plan: CccSessionPlan, blockId: string): CccSessionPlan {
  const block = plan.blocks.find((candidate) => candidate.id === blockId);
  if (!block) throw new Error(`Missing tester block: ${blockId}`);
  return {
    ...plan,
    planId: `${plan.planId}:tester:${blockId}`,
    blocks: [block],
    trials: plan.trials.filter((trial) => trial.blockId === blockId),
    shiftViewEligible: false,
  };
}

export function createOpticFlowTesterPlan(
  exercise: OpticFlowTesterExercise,
  sessionId = `optic-flow-test-${crypto.randomUUID()}`,
): CccSessionPlan {
  const common = {
    sessionId,
    seed: sessionId,
    programmeRunId: "optic-flow-test",
    programmeSessionNumber: 1,
    regimePair: ["clear_sprint", "clean_precision"] as const,
    wmLevel: 1 as CccNBackLevel,
  };

  if (exercise === "attention") {
    const plan = createProgrammeSessionPlan({
      ...common,
      kind: "p1a_consolidation",
      includeFirstContact: false,
    });
    return singleBlockPlan(plan, "p1a-flow-recovery");
  }

  const level: CccNBackLevel = exercise === "wm_2" ? 2 : 1;
  const plan = createProgrammeSessionPlan({
    ...common,
    kind: "p1b_wm_bridge",
    wmLevel: level,
    wmPairLevels: [level, level],
    wmWrapperStage: "flow_recovery",
  });
  return singleBlockPlan(plan, "p1b-wm-flow_recovery-1-a");
}
