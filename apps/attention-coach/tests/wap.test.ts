import { describe, expect, it } from "vitest";
import { transitionEventsForPhaseAdvance } from "../src/protocol";
import { chooseNextPhase } from "../src/wap";
import type { CellEvidence, WapUserState } from "../src/types";

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

  it("creates all actual transition events, but only carrier swaps are transfer boundaries", () => {
    expect(transitionEventsForPhaseAdvance("P1_ARROW_ABS", "P2_FLOW_ABS")).toEqual(["T_CM_BASE"]);
    expect(transitionEventsForPhaseAdvance("P2_FLOW_ABS", "P3_ARROW_REL")).toEqual(["T_FRAME_ARROW"]);
    expect(transitionEventsForPhaseAdvance("P3_ARROW_REL", "P4_FLOW_REL")).toEqual([
      "T_CM_REL",
      "T_FRAME_FLOW",
    ]);
  });
});
