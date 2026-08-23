import { describe, expect, it } from "vitest";
import {
  CCC_BRIDGE_MOVE_COPY,
  bridgeCeilingForProgramme,
  bridgeDelayedProbeDue,
  createInitialBridgeState,
  evaluateBridgeAdvance,
  markExplicitBridgePrompt,
  migrateBridgeState,
  recordBridgeObservation,
  type CccBridgeProgressionState,
} from "../src/cccBridgeProgression";
import { createInitialProgrammeState } from "../src/cccProgramme";

function observationBase() {
  return {
    move: null,
    selectedMove: null,
    retrievalCorrect: null,
    spontaneousRecall: null,
    spontaneousUse: null,
    sourceWorkflow: null,
    targetWorkflow: null,
    helped: null,
    notes: null,
  } as const;
}

describe("CCC Bridge progression", () => {
  it("keeps one stable plain-English definition for each control move", () => {
    expect(CCC_BRIDGE_MOVE_COPY.find).toEqual({
      label: "Find",
      definition: "Identify what matters now.",
      question: "What matters?",
    });
    expect(CCC_BRIDGE_MOVE_COPY.hold.definition).toBe("Keep what matters available.");
    expect(CCC_BRIDGE_MOVE_COPY.update.definition).toContain("keep what still fits");
    expect(CCC_BRIDGE_MOVE_COPY.act.question).toBe("Enough to move?");
  });

  it("migrates missing legacy Bridge state without affecting the programme", () => {
    const state = migrateBridgeState(null);
    expect(state.level).toBe("b1_guided");
    expect(state.guidedReviewedCount).toBe(0);
    expect(state.history).toEqual([]);
  });

  it("uses cognitive transfer evidence only as a ceiling", () => {
    const programme = createInitialProgrammeState();
    expect(bridgeCeilingForProgramme(programme)).toBe("b1_guided");

    programme.evidence.carrierFirstContactObserved = true;
    expect(bridgeCeilingForProgramme(programme)).toBe("b2_retrieval");

    programme.evidence.recoveryPasses = 1;
    expect(bridgeCeilingForProgramme(programme)).toBe("b3_personalised");

    programme.evidence.returnPasses = 1;
    expect(bridgeCeilingForProgramme(programme)).toBe("b4_faded");

    programme.evidence.mixedPasses = 1;
    expect(bridgeCeilingForProgramme(programme)).toBe("b5_changed_context");

    programme.evidence.delayedPasses = 1;
    expect(bridgeCeilingForProgramme(programme)).toBe("b6_delayed");
  });

  it("does not advance B1 from game evidence alone", () => {
    const programme = createInitialProgrammeState();
    programme.evidence.recoveryPasses = 1;
    const result = evaluateBridgeAdvance(createInitialBridgeState(), programme);
    expect(result.advanced).toBe(false);
    expect(result.level).toBe("b1_guided");
  });

  it("advances B1 only after guided experience and an adequate game ceiling", () => {
    const programme = createInitialProgrammeState();
    programme.evidence.carrierFirstContactObserved = true;
    const state = createInitialBridgeState();
    state.guidedReviewedCount = 2;

    const result = evaluateBridgeAdvance(state, programme);
    expect(result.advanced).toBe(true);
    expect(result.level).toBe("b2_retrieval");
  });

  it("requires retrieval practice before B3", () => {
    const programme = createInitialProgrammeState();
    programme.evidence.recoveryPasses = 1;
    const state = createInitialBridgeState();
    state.level = "b2_retrieval";
    state.highestLevelReached = "b2_retrieval";
    state.retrievalAttemptCount = 2;
    state.retrievalCorrectCount = 0;

    expect(evaluateBridgeAdvance(state, programme).advanced).toBe(false);
    state.retrievalCorrectCount = 1;
    expect(evaluateBridgeAdvance(state, programme).level).toBe("b3_personalised");
  });

  it("records Bridge observations without mutating cognitive evidence", () => {
    const programme = createInitialProgrammeState();
    const cognitiveEvidenceBefore = JSON.stringify(programme.evidence);
    const state = recordBridgeObservation(
      createInitialBridgeState(),
      {
        ...observationBase(),
        kind: "guided_review",
        move: "find",
        helped: true,
      },
      new Date("2026-08-23T09:00:00Z"),
    );

    expect(state.guidedReviewedCount).toBe(1);
    expect(state.history).toHaveLength(1);
    expect(JSON.stringify(programme.evidence)).toBe(cognitiveEvidenceBefore);
  });

  it("records retrieval accuracy separately from cognitive scores", () => {
    let state = createInitialBridgeState();
    state.level = "b2_retrieval";
    state.highestLevelReached = "b2_retrieval";
    state = recordBridgeObservation(state, {
      ...observationBase(),
      kind: "retrieval_attempt",
      move: "hold",
      selectedMove: "hold",
      retrievalCorrect: true,
    });

    expect(state.retrievalAttemptCount).toBe(1);
    expect(state.retrievalCorrectCount).toBe(1);
  });

  it("does not regress after a failed or difficult real-life attempt", () => {
    let state = createInitialBridgeState();
    state.level = "b4_faded";
    state.highestLevelReached = "b4_faded";
    state = recordBridgeObservation(state, {
      ...observationBase(),
      kind: "faded_probe",
      spontaneousRecall: false,
      spontaneousUse: false,
      helped: false,
    });

    expect(state.level).toBe("b4_faded");
    expect(state.highestLevelReached).toBe("b4_faded");
    expect(state.fadedProbeCount).toBe(1);
  });

  it("requires a genuine elapsed interval before B6", () => {
    const programme = createInitialProgrammeState();
    programme.evidence.delayedPasses = 1;
    let state: CccBridgeProgressionState = createInitialBridgeState();
    state.level = "b5_changed_context";
    state.highestLevelReached = "b5_changed_context";
    state.changedContextReviewedCount = 1;
    state = markExplicitBridgePrompt(state, new Date("2026-08-21T12:00:00Z"));

    expect(bridgeDelayedProbeDue(state, new Date("2026-08-22T12:00:00Z"))).toBe(false);
    expect(evaluateBridgeAdvance(state, programme, new Date("2026-08-22T12:00:00Z")).advanced).toBe(false);

    const delayed = evaluateBridgeAdvance(state, programme, new Date("2026-08-23T12:00:01Z"));
    expect(bridgeDelayedProbeDue(state, new Date("2026-08-23T12:00:01Z"))).toBe(true);
    expect(delayed.advanced).toBe(true);
    expect(delayed.level).toBe("b6_delayed");
  });
});
