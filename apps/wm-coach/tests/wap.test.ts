import { describe, expect, it } from "vitest";
import { PHASE_ORDER, transitionEventsForPhaseAdvance } from "../src/protocol";
import { chooseNextPhase } from "../src/wap";
import type { CellEvidence, WapUserState } from "../src/types";

function evidence(overrides: Partial<CellEvidence> = {}): CellEvidence {
  return {
    construct: "ACC",
    cellKey: "arrow_abs",
    validTrials: 90,
    rollingWindowCount: 3,
    recentCapacitySlope: 0,
    balancedAccuracy: 0.82,
    lapseRate: 0.1,
    timingQuality: "good",
    localAsymptoteBps: 3,
    currentCapacityBps: 3,
    currentNLevel: 3,
    stableNLevel: 3,
    peakNLevel: 3,
    falseAlarmRate: 0.1,
    missRate: 0.1,
    lureErrorRate: 0.1,
    medianRtMs: 430,
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

describe("WM WAP phase controller", () => {
  it("advances when n-back evidence is stable", () => {
    const decision = chooseNextPhase(state());
    expect(decision.shouldTransition).toBe(true);
    expect(decision.toPhase).toBe("P2_FLOW_ABS");
    expect(decision.transitionKey).toBe("T_CM_BASE");
  });

  it("blocks progression when false alarms are high", () => {
    const decision = chooseNextPhase(state({ evidence: [evidence({ falseAlarmRate: 0.4 })] }));
    expect(decision.shouldTransition).toBe(false);
    expect(decision.readiness.lapseStable).toBe(false);
  });

  it("keeps the planned transition sequence", () => {
    expect(transitionEventsForPhaseAdvance("P3_ARROW_REL", "P4_FLOW_REL")).toEqual(["T_CM_REL", "T_FRAME_FLOW"]);
  });

  it("splits the guided mixed and binding progression into explicit phases", () => {
    expect(PHASE_ORDER.slice(4)).toEqual([
      "P5_ARROW_MIXED",
      "P6_FLOW_MIXED",
      "P7_FULL_MIXED",
      "P8_BIND_ARROW_REL",
      "P9_BIND_FLOW_REL",
      "P10_BIND_MIXED",
      "P11_DELAYED",
    ]);
    expect(transitionEventsForPhaseAdvance("P10_BIND_MIXED", "P11_DELAYED")).toEqual(["T_DELAYED"]);
  });
});
