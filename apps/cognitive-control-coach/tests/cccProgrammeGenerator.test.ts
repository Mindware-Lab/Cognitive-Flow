import { describe, expect, it } from "vitest";
import { createProgrammeSessionPlan } from "../src/cccProgrammeGenerator";

const base = {
  programmeRunId: "programme-test",
  regimePair: ["clear_sprint", "deep_check"] as const,
  wmLevel: 1 as const,
};

describe("CCC multi-session plan generator", () => {
  it("puts a protected delayed re-check before same-session recovery", () => {
    const plan = createProgrammeSessionPlan({
      ...base,
      sessionId: "delayed",
      seed: "delayed",
      programmeSessionNumber: 2,
      kind: "p1a_delayed_recheck",
      delayedRecheckNotBefore: "2026-08-13T12:00:00.000Z",
    });
    expect(plan.blocks[0].phase).toBe("p1a_delayed_recheck");
    expect(plan.blocks[0].diagnostic).toBe(true);
    expect(plan.blocks[0].validTrialCount).toBe(12);
    expect(plan.delayedRecheckNotBefore).toBe("2026-08-13T12:00:00.000Z");
  });

  it("builds P1b with Attention first, fixed-operator carrier changes and balanced WM decisions", () => {
    const plan = createProgrammeSessionPlan({
      ...base,
      sessionId: "wm-one",
      seed: "wm-one",
      programmeSessionNumber: 3,
      kind: "p1b_wm_bridge",
    });
    expect(plan.blocks.map((block) => block.operator)).toEqual([
      "attention",
      "relational_wm",
      "relational_wm",
      "relational_wm",
      "relational_wm",
      "relational_wm",
    ]);
    for (let index = 1; index < plan.blocks.length; index += 1) {
      const previous = plan.blocks[index - 1];
      const current = plan.blocks[index];
      if (previous.operator !== current.operator) expect(previous.wrappers[0]).toBe(current.wrappers[0]);
    }
    for (const block of plan.blocks.filter((item) => item.operator === "relational_wm")) {
      const trials = plan.trials.filter((trial) => trial.blockId === block.id);
      expect(trials.filter((trial) => trial.wmBuffer)).toHaveLength(2);
      expect(trials.filter((trial) => !trial.wmBuffer)).toHaveLength(12);
      for (const regime of plan.regimePair) {
        const scored = trials.filter((trial) => trial.regimeId === regime && !trial.wmBuffer);
        expect(scored.filter((trial) => trial.correctResponse === "match")).toHaveLength(3);
        expect(scored.filter((trial) => trial.correctResponse === "different")).toHaveLength(3);
      }
    }
  });

  it("keeps one carrier fixed across P1c Attention to WM to Attention boundaries", () => {
    const plan = createProgrammeSessionPlan({
      ...base,
      sessionId: "return",
      seed: "return",
      programmeSessionNumber: 5,
      kind: "p1c_operator_integration",
      wmLevel: 2,
    });
    expect(new Set(plan.blocks.flatMap((block) => block.wrappers))).toEqual(new Set(["flow_rel"]));
    expect(plan.blocks.map((block) => block.operator)).toEqual([
      "attention",
      "relational_wm",
      "attention",
      "relational_wm",
    ]);
  });
});
