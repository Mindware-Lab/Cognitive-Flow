import { describe, expect, it } from "vitest";
import { createSessionPlan } from "../src/generator";
import { transitionEventsForPhaseAdvance } from "../src/protocol";
import { createInitialTransferControllerState, migrateTransferControllerState } from "../src/transferController";
import { chooseNextPhase } from "../src/wap";
import type { CellEvidence, WapUserState, WrapperId } from "../src/types";

function evidence(overrides: Partial<CellEvidence> = {}): CellEvidence {
  return {
    construct: "ACC",
    cellKey: "arrow_abs",
    validTrials: 240,
    rollingWindowCount: 6,
    recentCapacitySlope: 0.01,
    balancedAccuracy: 0.76,
    lapseRate: 0.08,
    timingQuality: "good",
    localAsymptoteBps: 4,
    currentCapacityBps: 3.8,
    ...overrides,
  };
}

function state(overrides: Partial<WapUserState> = {}): WapUserState {
  return {
    currentPhase: "P1_ARROW_ABS",
    sessionNumber: 4,
    phaseStatus: "active",
    completedTransitions: [],
    evidence: [evidence()],
    ...overrides,
  };
}

function delayedEvidence(overrides: Partial<CellEvidence> = {}): CellEvidence[] {
  return (["arrow_abs", "flow_abs", "arrow_rel", "flow_rel"] as const).map((cellKey) =>
    evidence({
      cellKey,
      validTrials: 15,
      rollingWindowCount: 0,
      balancedAccuracy: 0.8,
      currentCapacityBps: 4,
      ...overrides,
    }),
  );
}

function delayedState(overrides: Partial<WapUserState> = {}): WapUserState {
  return state({
    currentPhase: "P6_DELAYED",
    sessionNumber: 20,
    transferControllerState: {
      ...createInitialTransferControllerState(),
      phase: "delayed_recheck" as const,
      activeBaseWrapper: null,
      activeTargetWrapper: null,
      activeMix: {
        wrapperRatios: { arrow_abs: 0.25, flow_abs: 0.25, arrow_rel: 0.25, flow_rel: 0.25 },
        randomised: true,
      },
      delayedRechecks: [{
        id: "delayed-19",
        dueAfterSession: 20,
        completedSession: null,
        wrapperIds: ["arrow_abs", "flow_abs", "arrow_rel", "flow_rel"] as WrapperId[],
        passed: null,
      }],
    },
    ...overrides,
  });
}

describe("WAP phase controller", () => {
  it("advances P1 only when the ACC source cell meets readiness criteria", () => {
    const decision = chooseNextPhase(state());
    expect(decision.shouldTransition).toBe(true);
    expect(decision.toPhase).toBe("P2_FLOW_ABS");
    expect(decision.transitionKey).toBe("T_CM_BASE");
  });

  it("uses the assigned flow-first validation order when choosing the next phase", () => {
    const decision = chooseNextPhase(
      state({
        currentPhase: "P1_FLOW_ABS",
        protocolGroup: "validation_flow_first",
        evidence: [evidence({ cellKey: "flow_abs" })],
      }),
    );
    expect(decision.shouldTransition).toBe(true);
    expect(decision.toPhase).toBe("P2_ARROW_ABS");
    expect(decision.transitionKey).toBe("T_CM_BASE");
  });

  it("does not advance on nominal session number alone", () => {
    const decision = chooseNextPhase(
      state({
        sessionNumber: 8,
        evidence: [evidence({ validTrials: 120 })],
      }),
    );
    expect(decision.shouldTransition).toBe(false);
    expect(decision.toPhase).toBe("P1_ARROW_ABS");
  });

  it("does not block phase progression when stable accuracy is above the old target band", () => {
    const decision = chooseNextPhase(
      state({
        sessionNumber: 13,
        evidence: [evidence({ balancedAccuracy: 0.92 })],
      }),
    );
    expect(decision.shouldTransition).toBe(true);
    expect(decision.readiness.accuracyInBand).toBe(true);
  });

  it("extends for learning curve after the target envelope when readiness is still incomplete", () => {
    const decision = chooseNextPhase(
      state({
        sessionNumber: 21,
        evidence: [evidence({ validTrials: 220 })],
      }),
    );
    expect(decision.shouldTransition).toBe(false);
    expect(decision.phaseStatus).toBe("extended_for_learning_curve");
  });

  it("blocks progression on poor timing", () => {
    const decision = chooseNextPhase(state({ evidence: [evidence({ timingQuality: "poor" })] }));
    expect(decision.shouldTransition).toBe(false);
    expect(decision.readiness.timingAcceptable).toBe(false);
  });

  it("blocks progression when a global fatigue flag is present", () => {
    const decision = chooseNextPhase(state({ hasGlobalFatigueFlag: true }));
    expect(decision.shouldTransition).toBe(false);
    expect(decision.toPhase).toBe("P1_ARROW_ABS");
    expect(decision.readiness.noGlobalBlocker).toBe(false);
    expect(decision.readiness.slopeStable).toBe(true);
  });

  it("creates all actual transition events, but only carrier swaps are transfer boundaries", () => {
    expect(transitionEventsForPhaseAdvance("P1_ARROW_ABS", "P2_FLOW_ABS")).toEqual(["T_CM_BASE"]);
    expect(transitionEventsForPhaseAdvance("P2_FLOW_ABS", "P3_ARROW_REL")).toEqual(["T_FRAME_ARROW"]);
    expect(transitionEventsForPhaseAdvance("P3_ARROW_REL", "P4_FLOW_REL")).toEqual([
      "T_CM_REL",
      "T_FRAME_FLOW",
    ]);
  });

  it("does not expose carrier return-to-base as a backwards jump to P1", () => {
    const transferControllerState = {
      ...createInitialTransferControllerState(),
      phase: "return_to_base" as const,
      activeBaseWrapper: "arrow_abs" as const,
      activeTargetWrapper: null,
    };
    const decision = chooseNextPhase(
      state({
        currentPhase: "P2_FLOW_ABS",
        sessionNumber: 8,
        transferControllerState,
      }),
    );

    expect(decision.toPhase).toBe("P2_FLOW_ABS");
    expect(decision.shouldTransition).toBe(false);
  });

  it("does not expose pair-mix transfer probes as full mixed mastery", () => {
    const transferControllerState = {
      ...createInitialTransferControllerState(),
      phase: "mix_80_20" as const,
      activeBaseWrapper: "arrow_abs" as const,
      activeTargetWrapper: "flow_abs" as const,
      mixRatio: 0.2,
      activeMix: {
        wrapperRatios: { arrow_abs: 0.8, flow_abs: 0.2, arrow_rel: 0, flow_rel: 0 },
        randomised: false,
      },
    };
    const decision = chooseNextPhase(
      state({
        currentPhase: "P2_FLOW_ABS",
        sessionNumber: 9,
        transferControllerState,
      }),
    );

    expect(decision.toPhase).toBe("P2_FLOW_ABS");
    expect(decision.shouldTransition).toBe(false);
  });

  it("does not assign portable from delayed completion without fresh delayed evidence", () => {
    const decision = chooseNextPhase(delayedState({ evidence: delayedEvidence() }));

    expect(decision.transferControllerState?.phase).toBe("maintenance_pending");
    expect(decision.transferControllerState?.completedAtSession).toBeNull();
  });

  it("keeps delayed collection pending when a required wrapper is missing fresh evidence", () => {
    const decision = chooseNextPhase(delayedState({
      freshDelayedEvidence: delayedEvidence().filter((item) => item.cellKey !== "flow_rel"),
    }));

    expect(decision.transferControllerState?.phase).toBe("maintenance_pending");
    expect(decision.transferControllerState?.completedAtSession).toBeNull();
  });

  it("does not assign portable when one required delayed wrapper has poor timing", () => {
    const freshDelayedEvidence = delayedEvidence().map((item) =>
      item.cellKey === "flow_rel" ? { ...item, timingQuality: "poor" as const } : item,
    );
    const decision = chooseNextPhase(delayedState({ freshDelayedEvidence }));

    expect(decision.transferControllerState?.phase).toBe("maintenance_mix");
    expect(decision.transferControllerState?.delayedRechecks[0].passed).toBe(false);
  });

  it("routes adequate but failed fresh delayed evidence to maintenance", () => {
    const decision = chooseNextPhase(delayedState({
      freshDelayedEvidence: delayedEvidence({ balancedAccuracy: 0.5 }),
    }));

    expect(decision.transferControllerState?.phase).toBe("maintenance_mix");
    expect(decision.transferControllerState?.delayedRechecks[0].passed).toBe(false);
  });

  it("does not promote maintenance to portable by session number alone", () => {
    const decision = chooseNextPhase(delayedState({
      sessionNumber: 24,
      transferControllerState: {
        ...createInitialTransferControllerState(),
        phase: "maintenance_mix" as const,
        activeBaseWrapper: null,
        activeTargetWrapper: null,
        activeMix: {
          wrapperRatios: { arrow_abs: 0.25, flow_abs: 0.25, arrow_rel: 0.25, flow_rel: 0.25 },
          randomised: true,
        },
        delayedRechecks: [{
          id: "delayed-19",
          dueAfterSession: 20,
          completedSession: 20,
          wrapperIds: ["arrow_abs", "flow_abs", "arrow_rel", "flow_rel"] as WrapperId[],
          passed: false,
        }],
      },
      freshDelayedEvidence: undefined,
    }));

    expect(decision.transferControllerState?.phase).toBe("maintenance_mix");
    expect(decision.transferControllerState?.completedAtSession).toBeNull();
  });

  it("assigns portable only when fresh delayed all-four evidence passes", () => {
    const decision = chooseNextPhase(delayedState({
      freshDelayedEvidence: delayedEvidence(),
    }));

    expect(decision.transferControllerState?.phase).toBe("portable");
    expect(decision.transferControllerState?.delayedRechecks[0].passed).toBe(true);
  });

  it("resumes maintenance pending as delayed evidence collection", () => {
    const saved = {
      ...createInitialTransferControllerState(),
      phase: "maintenance_pending" as const,
      activeBaseWrapper: null,
      activeTargetWrapper: null,
      activeMix: {
        wrapperRatios: { arrow_abs: 0.25, flow_abs: 0.25, arrow_rel: 0.25, flow_rel: 0.25 },
        randomised: true,
      },
      delayedRechecks: [{
        id: "delayed-19",
        dueAfterSession: 20,
        completedSession: null,
        wrapperIds: ["arrow_abs", "flow_abs", "arrow_rel", "flow_rel"] as WrapperId[],
        passed: null,
      }],
    };
    const resumed = migrateTransferControllerState({
      existing: saved,
      currentPhase: "P6_DELAYED",
      sessionNumber: 21,
      evidence: delayedEvidence(),
    });
    const decision = chooseNextPhase(delayedState({
      sessionNumber: 21,
      transferControllerState: resumed,
      freshDelayedEvidence: undefined,
    }));
    const plan = createSessionPlan(21, "P6_DELAYED", "delayed", "return check", "resume-delayed", "run", 1, decision.transferControllerState);

    expect(resumed.phase).toBe("maintenance_pending");
    expect(decision.shouldTransition).toBe(false);
    expect(decision.transferControllerState?.phase).toBe("maintenance_pending");
    expect(decision.transferControllerState?.completedAtSession).toBeNull();
    expect(plan.miniBlocks.every((block) => block.evidencePurpose === "delayed_recheck")).toBe(true);
  });
});
