import { describe, expect, it } from "vitest";
import { createScoreSnapshot } from "../src/scoring";
import type { CellEvidence } from "../src/types";

const evidence: CellEvidence[] = [
  {
    construct: "ACC",
    cellKey: "arrow_abs",
    validTrials: 240,
    rollingWindowCount: 6,
    recentCapacitySlope: 0.01,
    balancedAccuracy: 0.75,
    lapseRate: 0.08,
    timingQuality: "good",
    localAsymptoteBps: 4,
    currentCapacityBps: 3.8,
  },
  {
    construct: "BSE",
    cellKey: "arrow_abs",
    validTrials: 20,
    rollingWindowCount: 0,
    recentCapacitySlope: 0.04,
    balancedAccuracy: 0.7,
    lapseRate: 0.12,
    timingQuality: "good",
    localAsymptoteBps: 2.7,
    currentCapacityBps: 2.6,
  },
];

describe("score snapshots", () => {
  it("keeps transfer visible before the first carrier swap", () => {
    const snapshot = createScoreSnapshot({
      sessionNumber: 1,
      activePhase: "P1_ARROW_ABS",
      phaseStatus: "active",
      nominalBand: "typical sessions 1-5",
      evidence,
      completedTransitions: [],
    });
    expect(snapshot.transfer.score).toBeNull();
    expect(snapshot.transfer.status).toBe("calibrating");
    expect(snapshot.transfer.motionRecovery.status).toBe("coming_up");
  });

  it("marks BSE lag separately from ACC progression", () => {
    const snapshot = createScoreSnapshot({
      sessionNumber: 5,
      activePhase: "P2_FLOW_ABS",
      phaseStatus: "active",
      nominalBand: "typical sessions 6-8",
      evidence,
      completedTransitions: ["T_CM_BASE"],
    });
    expect(snapshot.bindingFocus.lagFlag).toBe("insufficient_data");
    expect(snapshot.transfer.motionRecovery.status).toBe("calibrating");
  });

  it("shows target-envelope completion without forcing missing transfer components", () => {
    const snapshot = createScoreSnapshot({
      sessionNumber: 20,
      activePhase: "P3_ARROW_REL",
      phaseStatus: "extended_for_learning_curve",
      nominalBand: "typical sessions 9-12",
      evidence,
      completedTransitions: ["T_CM_BASE"],
    });
    expect(snapshot.transfer.relationRecovery.status).toBe("coming_up");
    expect(snapshot.transfer.mixedFlexibility.status).toBe("coming_up");
  });
});
