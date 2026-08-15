import { createProgrammeSessionPlan } from "./cccProgrammeGenerator";
import type { CccNBackLevel, CccSessionPlan } from "./cccTypes";

export type OpticFlowTesterExercise =
  | "attention"
  | "attention_rotational"
  | "wm_1"
  | "wm_2"
  | "wm_3"
  | "arrow_wm_1"
  | "arrow_wm_2"
  | "arrow_wm_3";

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

  if (exercise === "attention" || exercise === "attention_rotational") {
    const plan = createProgrammeSessionPlan({
      ...common,
      kind: "p1a_consolidation",
      includeFirstContact: false,
      attentionPairOverride: exercise === "attention_rotational" ? "rotational" : "radial",
    });
    return singleBlockPlan(plan, "p1a-flow-recovery");
  }

  const level: CccNBackLevel = exercise.endsWith("_3") ? 3 : exercise.endsWith("_2") ? 2 : 1;
  const arrow = exercise.startsWith("arrow_");
  const plan = createProgrammeSessionPlan({
    ...common,
    kind: "p1b_wm_bridge",
    wmLevel: level,
    wmPairLevels: [level, level],
    wmWrapperStage: arrow ? "arrow_stabilisation" : "flow_recovery",
  });
  return singleBlockPlan(plan, `p1b-wm-${arrow ? "arrow_stabilisation" : "flow_recovery"}-1-a`);
}
