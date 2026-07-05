import { describe, expect, it } from "vitest";
import { createScoreSnapshot, updateEvidenceFromResults } from "../src/scoring";
import { createSessionPlan } from "../src/generator";
import type { CellEvidence, TrialResult } from "../src/types";

function result(trial: ReturnType<typeof createSessionPlan>["trials"][number], response: string | null): TrialResult {
  return {
    trial,
    response,
    isCorrect: response === trial.correctResponse,
    rtMs: response ? 420 : null,
    exposureMsActual: trial.exposureMsRequested,
    actualStimulusFrames: 72,
    deviceRefreshRateEstimate: 60,
    droppedFrameCount: 0,
    timingQuality: "good",
  };
}

function evidence(overrides: Partial<CellEvidence> = {}): CellEvidence {
  return {
    construct: "ACC",
    cellKey: "arrow_abs",
    validTrials: 90,
    rollingWindowCount: 3,
    recentCapacitySlope: 0,
    balancedAccuracy: 0.86,
    lapseRate: 0.1,
    timingQuality: "good",
    localAsymptoteBps: 3,
    currentCapacityBps: 3,
    currentNLevel: 3,
    stableNLevel: 3,
    peakNLevel: 4,
    falseAlarmRate: 0.08,
    missRate: 0.1,
    lureErrorRate: 0.1,
    medianRtMs: 430,
    ...overrides,
  };
}

describe("WM n-level scoring", () => {
  it("updates evidence from n-back hits, withholds and lures", () => {
    const plan = createSessionPlan(1, "P1_ARROW_ABS", "active", null, { "ACC:arrow_abs": 2 });
    const trials = plan.trials.filter((trial) => trial.miniBlockId === plan.miniBlocks[0].id);
    const results = trials.map((trial) => result(trial, trial.correctResponse));
    const evidenceSet = updateEvidenceFromResults([], results);
    expect(evidenceSet[0].currentNLevel).toBe(2);
    expect(evidenceSet[0].balancedAccuracy).toBeGreaterThan(0.95);
    expect(evidenceSet[0].falseAlarmRate).toBe(0);
    expect(evidenceSet[0].missRate).toBe(0);
  });

  it("uses active phase evidence for relational and binding panels", () => {
    const snapshot = createScoreSnapshot({
      sessionNumber: 6,
      activePhase: "P2_FLOW_ABS",
      phaseStatus: "active",
      nominalBand: null,
      evidence: [
        evidence({ construct: "ACC", cellKey: "flow_abs", currentNLevel: 4, stableNLevel: 4, currentCapacityBps: 4 }),
        evidence({ construct: "BSE", cellKey: "flow_abs", currentNLevel: 3, stableNLevel: 3, currentCapacityBps: 3 }),
      ],
      completedTransitions: ["T_CM_BASE"],
    });
    expect(snapshot.workingMemoryControl.nLevel).toBe(4);
    expect(snapshot.bindingFocus.nLevel).toBe(3);
  });
});
