import { describe, expect, it } from "vitest";
import { createP0AttentionCarrierTransferPlan } from "../src/cccGenerator";
import {
  allRegimesBalanced,
  applyCompletedSession,
  createInitialProgrammeState,
  nextProgrammeAction,
  selectBalancedRegimePair,
} from "../src/cccProgramme";
import { createProgrammeSessionPlan } from "../src/cccProgrammeGenerator";
import type { CccSavedJourney } from "../src/cccStorage";
import type { CccProgrammeState, CccRecordedTrial, CccSessionPlan } from "../src/cccTypes";
import { scoreCccAttentionTrial } from "../src/cccValue";

function completedJourney(
  plan: CccSessionPlan,
  programme: CccProgrammeState,
  startedAt: string,
  completedAt: string,
): CccSavedJourney {
  const blockResults = Object.fromEntries(plan.blocks.map((block) => {
    const trials = plan.trials.filter((trial) => trial.blockId === block.id);
    const results = trials.map((trial): CccRecordedTrial => {
      const response = trial.wmBuffer ? null : trial.correctResponse;
      const responseTimeMs = trial.wmBuffer ? 4000 : 900;
      return {
        trial,
        response,
        scoring: scoreCccAttentionTrial({ trial, response, responseTimeMs }),
        recordedAt: completedAt,
        viewportClass: "desktop",
        inputMode: trial.wmBuffer ? "system" : "keyboard",
        focusLost: false,
        exposureMsActual: trial.exposureMsRequested,
        actualStimulusFrames: trial.estimand === "signal_capacity" ? 30 : null,
        deviceRefreshRateEstimate: trial.estimand === "signal_capacity" ? 60 : null,
        timingQuality: trial.estimand === "signal_capacity" ? "good" : "not_applicable",
      };
    });
    return [block.id, results];
  }));
  return {
    storageVersion: 3,
    programme,
    plan,
    workflowChoice: "focused_work",
    activeBlockIndex: plan.blocks.length - 1,
    blockQueues: Object.fromEntries(plan.blocks.map((block) => [block.id, plan.trials.filter((trial) => trial.blockId === block.id)])),
    blockResults,
    practiceQueue: [],
    practiceResults: [],
    practiceComplete: true,
    shiftViewCompleted: true,
    events: [],
    startedAt,
    updatedAt: completedAt,
    completedAt,
  };
}

describe("CCC evidence-gated programme", () => {
  it("balances four environments through constrained random pairs", () => {
    const state = createInitialProgrammeState(new Date("2026-08-12T10:00:00.000Z"), "balanced");
    for (let index = 0; index < 12; index += 1) {
      const pair = selectBalancedRegimePair(state, `session-${index}`);
      pair.forEach((regime) => { state.regimeExposure[regime] += 1; });
      state.pairHistory.push([...pair].sort().join("+"));
      if (index) expect(state.pairHistory[index]).not.toBe(state.pairHistory[index - 1]);
    }
    expect(allRegimesBalanced(state)).toBe(true);
    expect(new Set(state.pairHistory).size).toBeGreaterThanOrEqual(4);
  });

  it("requires delayed attention evidence, a stable WM learning curve and two-carrier re-entry before full transfer", () => {
    let programme = createInitialProgrammeState(new Date("2026-08-12T08:00:00.000Z"), "route");
    const pair = selectBalancedRegimePair(programme, "p0");
    const p0Plan = createP0AttentionCarrierTransferPlan({
      sessionId: "p0",
      seed: "p0",
      regimePair: pair,
      programmeRunId: programme.programmeRunId,
      programmeSessionNumber: 1,
    });
    programme = applyCompletedSession(programme, completedJourney(
      p0Plan,
      programme,
      "2026-08-12T08:00:00.000Z",
      "2026-08-12T08:15:00.000Z",
    )).programme;
    expect(programme.currentStage).toBe("P1a");
    expect(nextProgrammeAction(programme, new Date("2026-08-12T12:00:00.000Z"))).toMatchObject({ type: "session", kind: "p1a_consolidation" });

    for (const sessionNumber of [2, 3, 4]) {
      const attentionPlan = createProgrammeSessionPlan({
        sessionId: `attention-${sessionNumber}`,
        seed: `attention-${sessionNumber}`,
        programmeRunId: programme.programmeRunId,
        programmeSessionNumber: sessionNumber,
        kind: "p1a_consolidation",
        regimePair: selectBalancedRegimePair(programme, `attention-${sessionNumber}`),
        wmLevel: programme.wmLevel,
        includeFirstContact: !programme.evidence.carrierFirstContactObserved,
      });
      programme = applyCompletedSession(programme, completedJourney(
        attentionPlan,
        programme,
        `2026-08-${11 + sessionNumber}T08:00:00.000Z`,
        `2026-08-${11 + sessionNumber}T08:15:00.000Z`,
      )).programme;
    }
    expect(nextProgrammeAction(programme, new Date("2026-08-15T12:00:00.000Z")).type).toBe("wait");

    const due = programme.delayedRecheckDueAt!;
    const delayedPlan = createProgrammeSessionPlan({
      sessionId: "delayed",
      seed: "delayed",
      programmeRunId: programme.programmeRunId,
      programmeSessionNumber: 5,
      kind: "p1a_delayed_recheck",
      regimePair: selectBalancedRegimePair(programme, "delayed"),
      wmLevel: programme.wmLevel,
      delayedRecheckNotBefore: due,
    });
    const delayedStart = new Date(Date.parse(due) + 60_000).toISOString();
    programme = applyCompletedSession(programme, completedJourney(
      delayedPlan,
      programme,
      delayedStart,
      new Date(Date.parse(delayedStart) + 12 * 60_000).toISOString(),
    )).programme;
    expect(programme.transferStatus).toBe("attention_portable");
    expect(programme.currentStage).toBe("P1b");

    let sessionNumber = 6;
    const savedLevels: number[] = [];
    while (programme.currentStage === "P1b" && sessionNumber < 25) {
      const savedLevelAtStart = programme.wmLevel;
      savedLevels.push(savedLevelAtStart);
      const wmPlan = createProgrammeSessionPlan({
        sessionId: `wm-${sessionNumber}`,
        seed: `wm-${sessionNumber}`,
        programmeRunId: programme.programmeRunId,
        programmeSessionNumber: sessionNumber,
        kind: "p1b_wm_bridge",
        regimePair: selectBalancedRegimePair(programme, `wm-${sessionNumber}`),
        wmLevel: programme.wmLevel,
        wmWrapperStage: programme.wmWrapperStage,
      });
      expect(wmPlan.blocks[0]?.wmNLevel).toBe(savedLevelAtStart);
      programme = applyCompletedSession(programme, completedJourney(
        wmPlan,
        programme,
        `2026-08-${10 + sessionNumber}T08:00:00.000Z`,
        `2026-08-${10 + sessionNumber}T08:15:00.000Z`,
      )).programme;
      sessionNumber += 1;
    }
    expect(programme.currentStage).toBe("P1c");
    expect(savedLevels[0]).toBe(1);
    expect(savedLevels).toContain(5);

    for (let integrationIndex = 0; integrationIndex < 4; integrationIndex += 1) {
      const integrationSessionNumber = sessionNumber + integrationIndex;
      const integrationPlan = createProgrammeSessionPlan({
        sessionId: `integration-${integrationSessionNumber}`,
        seed: `integration-${integrationSessionNumber}`,
        programmeRunId: programme.programmeRunId,
        programmeSessionNumber: integrationSessionNumber,
        kind: "p1c_operator_integration",
        regimePair: selectBalancedRegimePair(programme, `integration-${integrationSessionNumber}`),
        wmLevel: programme.wmLevel,
      });
      programme = applyCompletedSession(programme, completedJourney(
        integrationPlan,
        programme,
        new Date(Date.UTC(2026, 8, integrationSessionNumber, 8, 0)).toISOString(),
        new Date(Date.UTC(2026, 8, integrationSessionNumber, 8, 15)).toISOString(),
      )).programme;
    }
    expect(programme.currentStage).toBe("P1c");
    expect(programme.status).toBe("active");
    const finalDue = programme.delayedRecheckDueAt!;
    const finalPlan = createProgrammeSessionPlan({
      sessionId: "final-delayed",
      seed: "final-delayed",
      programmeRunId: programme.programmeRunId,
      programmeSessionNumber: programme.sessionNumber + 1,
      kind: "p1c_delayed_integration",
      regimePair: selectBalancedRegimePair(programme, "final-delayed"),
      wmLevel: programme.wmLevel,
      delayedRecheckNotBefore: finalDue,
    });
    const finalStart = new Date(Date.parse(finalDue) + 60_000).toISOString();
    programme = applyCompletedSession(programme, completedJourney(
      finalPlan,
      programme,
      finalStart,
      new Date(Date.parse(finalStart) + 12 * 60_000).toISOString(),
    )).programme;
    expect(programme.currentStage).toBe("complete");
    expect(programme.status).toBe("full_transfer");
    expect(programme.sessionNumber).toBe(finalPlan.programmeSessionNumber);
    expect(allRegimesBalanced(programme)).toBe(true);
    expect(programme.evidence.integrationCarriers.sort()).toEqual(["arrow", "flow"]);
  });
});
