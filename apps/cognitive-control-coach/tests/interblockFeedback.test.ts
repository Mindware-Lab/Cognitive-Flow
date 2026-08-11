import { describe, expect, it } from "vitest";
import { buildInterblockFeedback, getInterblockPhaseLabel, getInvariantPrompt } from "../src/interblockFeedback";
import type { BlockFeedbackPoint } from "../src/types";

function point(overrides: Partial<BlockFeedbackPoint> = {}): BlockFeedbackPoint {
  return {
    programmeRunId: "run-1",
    programmeCycle: 1,
    sessionNumber: 1,
    phase: "P1_ARROW_ABS",
    phaseStatus: "active",
    blockIndex: 1,
    blockId: "b1",
    construct: "ACC",
    cellKey: "arrow_abs",
    accuracy: 0.75,
    balancedAccuracy: 0.75,
    coreMetricName: "bits_per_second",
    coreMetricValue: 3,
    coreMetricUnit: "bits/sec",
    lapseRate: 0.12,
    timingQuality: "good",
    confidenceLabel: "moderate_confidence",
    transitionKey: null,
    createdAt: "2026-07-08T00:00:00.000Z",
    ...overrides,
  };
}

describe("Attention interblock feedback", () => {
  it("selects invariant prompts from the transition table", () => {
    expect(getInvariantPrompt({ phase: "P2_FLOW_ABS", protocolGroup: "commercial_arrows_first" })).toBe(
      "The look will change. Keep tracking what most items are doing.",
    );
    expect(getInvariantPrompt({ phase: "P3_ARROW_REL", protocolGroup: "commercial_arrows_first" })).toBe(
      "Now use the centre. Track direction relative to it.",
    );
    expect(getInvariantPrompt({ phase: "P4_FLOW_REL", protocolGroup: "commercial_arrows_first" })).toBe(
      "The look will change. Keep tracking direction relative to the centre.",
    );
    expect(getInvariantPrompt({ phase: "P5_MIXED", protocolGroup: "commercial_arrows_first" })).toBe(
      "The format may change from trial to trial. Find the signal before reacting to the look.",
    );
    expect(getInvariantPrompt({ phase: "P6_DELAYED", protocolGroup: "commercial_arrows_first" })).toBe(
      "Can you recover the same rule after time has passed?",
    );
  });

  it("keeps first block feedback in calibrating mode", () => {
    const feedback = buildInterblockFeedback({
      history: [point()],
      currentProgrammeRunId: "run-1",
      wapStatus: "active",
      phase: "P1_ARROW_ABS",
    });
    expect(feedback?.isCalibrating).toBe(true);
    expect(feedback?.interpretationText).toContain("Baseline started");
  });

  it("emits raw and smoothed graph points without resetting axes", () => {
    const feedback = buildInterblockFeedback({
      history: [
        point({ coreMetricValue: 3, balancedAccuracy: 0.7 }),
        point({ blockIndex: 2, coreMetricValue: 4, balancedAccuracy: 0.8 }),
        point({ blockIndex: 3, coreMetricValue: 3.5, balancedAccuracy: 0.76, transitionKey: "T_CM_BASE" }),
      ],
      currentProgrammeRunId: "run-1",
      wapStatus: "active",
      phase: "P2_FLOW_ABS",
    });
    expect(feedback?.isCalibrating).toBe(false);
    expect(feedback?.accuracyGraph.axisMin).toBe(0);
    expect(feedback?.accuracyGraph.axisMax).toBe(100);
    expect(feedback?.coreGraph.axisMin).toBe(-50);
    expect(feedback?.coreGraph.axisMax).toBe(50);
    expect(feedback?.coreGraph.points[2].rawValue).toBe(3.5);
    expect(feedback?.coreGraph.points[2].smoothedValue).toBeCloseTo(3.5);
  });

  it("prioritises support and timing labels", () => {
    expect(
      getInterblockPhaseLabel({
        wapStatus: "active",
        phase: "P1_ARROW_ABS",
        recentAccuracySlope: 6,
        recentCoreMetricSlope: 1,
        postSwap: false,
        timingQuality: "poor",
        lapseRate: 0,
        pointCount: 2,
      }),
    ).toBe("timing_limited");
    expect(
      getInterblockPhaseLabel({
        wapStatus: "active",
        phase: "P1_ARROW_ABS",
        recentAccuracySlope: -8,
        recentCoreMetricSlope: -1,
        postSwap: false,
        timingQuality: "good",
        lapseRate: 0.5,
        pointCount: 2,
      }),
    ).toBe("support_needed");
  });
});
