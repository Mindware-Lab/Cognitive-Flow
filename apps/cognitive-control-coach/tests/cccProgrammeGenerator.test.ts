import { describe, expect, it } from "vitest";
import { createProgrammeSessionPlan } from "../src/cccProgrammeGenerator";

const base = {
  programmeRunId: "programme-test",
  regimePair: ["clear_sprint", "deep_check"] as const,
  wmLevel: 1 as const,
};

describe("CCC multi-session plan generator", () => {
  it("gates the familiar attention wrapper on a rolling learning curve before another transfer probe", () => {
    const plan = createProgrammeSessionPlan({
      ...base,
      sessionId: "attention-stabilisation",
      seed: "attention-stabilisation",
      programmeSessionNumber: 2,
      kind: "p1a_consolidation",
    });
    const source = plan.blocks.find((block) => block.phase === "p1a_arrow_stabilisation")!;
    expect(source).toMatchObject({
      learningCurveGate: "source_stabilisation",
      microcycleCount: 10,
      validTrialCount: 120,
    });
    expect(plan.blocks.find((block) => block.phase === "p1a_flow_first_contact")?.learningCurveGate).toBeNull();
  });

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

  it("builds four A-B-A-B memory blocks with 20 scored decisions plus the current n", () => {
    const plan = createProgrammeSessionPlan({
      ...base,
      sessionId: "wm-one",
      seed: "wm-one",
      programmeSessionNumber: 3,
      kind: "p1b_wm_bridge",
      wmPairLevels: [2, 3],
    });
    expect(plan.blocks.map((block) => block.operator)).toEqual([
      "relational_wm",
      "relational_wm",
      "relational_wm",
      "relational_wm",
    ]);
    expect(plan.blocks.map((block) => [block.wmPairIndex, block.wmPairPosition, block.regimePair.indexOf(plan.trials.find((trial) => trial.blockId === block.id)!.regimeId)])).toEqual([
      [1, "A", 0],
      [1, "B", 1],
      [2, "A", 0],
      [2, "B", 1],
    ]);
    expect(plan.blocks.map((block) => block.wmNLevel)).toEqual([2, 2, 3, 3]);
    for (const block of plan.blocks) {
      const trials = plan.trials.filter((trial) => trial.blockId === block.id);
      const scored = trials.filter((trial) => !trial.wmBuffer);
      expect(trials.filter((trial) => trial.wmBuffer)).toHaveLength(block.wmNLevel || 0);
      expect(scored).toHaveLength(20);
      expect(scored.filter((trial) => trial.correctResponse === "match")).toHaveLength(10);
      expect(scored.filter((trial) => trial.correctResponse === "different")).toHaveLength(10);
      const expectedRatios = scored[0].regimeId === "clear_sprint"
        ? { "5:0": 12, "4:1": 6, "3:2": 2 }
        : { "5:0": 2, "4:1": 6, "3:2": 12 };
      for (const ratio of ["5:0", "4:1", "3:2"] as const) {
        expect(scored.filter((trial) => trial.ratio === ratio)).toHaveLength(expectedRatios[ratio]);
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
