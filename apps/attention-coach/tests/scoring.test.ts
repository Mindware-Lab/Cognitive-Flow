import { describe, expect, it } from "vitest";
import { generateTrial } from "../src/generator";
import { createScoreSnapshot, progressionResultsForEvidence } from "../src/scoring";
import type { CellEvidence, TrialResult } from "../src/types";

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

function cellEvidence(
  construct: CellEvidence["construct"],
  cellKey: CellEvidence["cellKey"],
  currentCapacityBps: number,
): CellEvidence {
  return {
    construct,
    cellKey,
    validTrials: 240,
    rollingWindowCount: 6,
    recentCapacitySlope: 0.01,
    balancedAccuracy: 0.75,
    lapseRate: 0.08,
    timingQuality: "good",
    localAsymptoteBps: currentCapacityBps,
    currentCapacityBps,
  };
}

function result(cellKey: "arrow_abs" | "flow_abs", evidencePurpose: TrialResult["trial"]["evidencePurpose"]): TrialResult {
  const trial = generateTrial("session", "block", cellKey === "arrow_abs" ? 0 : 1, "ACC", "P1_ARROW_ABS", cellKey, false, {
    ratio: "4:1",
    exposureMs: 500,
  }, {
    evidencePurpose,
    probeStatus: evidencePurpose === "diagnostic" ? "diagnostic_probe" : "base",
  });
  return {
    trial,
    response: trial.correctResponse,
    isCorrect: true,
    rtMs: 500,
    exposureMsActual: 500,
    actualStimulusFrames: 30,
    deviceRefreshRateEstimate: 60,
    droppedFrameCount: 0,
    timingQuality: "good",
  };
}

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

  it("uses active phase cell evidence for headline ACC and BSE panels", () => {
    const snapshot = createScoreSnapshot({
      sessionNumber: 6,
      activePhase: "P2_FLOW_ABS",
      phaseStatus: "active",
      nominalBand: "typical sessions 6-8",
      evidence: [
        cellEvidence("ACC", "arrow_abs", 2),
        cellEvidence("ACC", "flow_abs", 6),
        cellEvidence("BSE", "arrow_abs", 1),
        cellEvidence("BSE", "flow_abs", 5),
      ],
      completedTransitions: ["T_CM_BASE"],
    });
    expect(snapshot.attentionControl.bitsPerSec).toBe(6);
    expect(snapshot.bindingFocus.bitsPerSec).toBe(5);
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

  it("excludes diagnostic target-wrapper trials while retaining diagnostic base trials", () => {
    const base = result("arrow_abs", "diagnostic");
    const target = result("flow_abs", "diagnostic");
    const recovery = result("flow_abs", "recovery");

    expect(progressionResultsForEvidence([base, target, recovery], "flow_abs")).toEqual([base, recovery]);
  });
});
