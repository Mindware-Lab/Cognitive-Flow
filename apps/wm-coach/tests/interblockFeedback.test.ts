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
    wrapperId: "ACC:P1_ARROW_ABS:arrow_abs:1",
    construct: "ACC",
    cellKey: "arrow_abs",
    accuracy: 0.75,
    balancedAccuracy: 0.75,
    coreMetricName: "n_back_level",
    coreMetricValue: 2,
    coreMetricUnit: "level",
    falseAlarmRate: 0.1,
    missRate: 0.1,
    lapseRate: 0.1,
    timingQuality: "good",
    confidenceLabel: "moderate_confidence",
    transitionKey: null,
    createdAt: "2026-07-08T00:00:00.000Z",
    ...overrides,
  };
}

describe("WM interblock feedback", () => {
  it("selects invariant prompts from the transition table", () => {
    expect(getInvariantPrompt({ phase: "P2_FLOW_ABS", protocolGroup: "commercial_arrows_first" })).toBe(
      "The look will change. Hold the label, not the look.",
    );
    expect(getInvariantPrompt({ phase: "P3_ARROW_REL", protocolGroup: "commercial_arrows_first" })).toBe(
      "Now the pattern depends on the centre. Hold the centre-relative label.",
    );
    expect(getInvariantPrompt({ phase: "P4_FLOW_REL", protocolGroup: "commercial_arrows_first" })).toBe(
      "New format, same memory task. Work out the pattern, then compare it with n-back.",
    );
    expect(getInvariantPrompt({ phase: "P5_ARROW_MIXED", protocolGroup: "commercial_arrows_first" })).toBe(
      "The format may change from trial to trial. Identify the label first, then compare it with n-back.",
    );
    expect(getInvariantPrompt({ phase: "P8_BIND_ARROW_REL", protocolGroup: "commercial_arrows_first" })).toBe(
      "The look will change. Keep the pair together.",
    );
    expect(getInvariantPrompt({ phase: "P11_DELAYED", protocolGroup: "commercial_arrows_first" })).toBe(
      "Can you recover the same pattern after time has passed?",
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

  it("uses fixed axes and emits raw plus smoothed n-level points", () => {
    const feedback = buildInterblockFeedback({
      history: [
        point({ coreMetricValue: 2, balancedAccuracy: 0.7 }),
        point({ blockIndex: 2, coreMetricValue: 3, balancedAccuracy: 0.8 }),
        point({ blockIndex: 3, coreMetricValue: 2, balancedAccuracy: 0.76, transitionKey: "T_CM_BASE" }),
      ],
      currentProgrammeRunId: "run-1",
      wapStatus: "active",
      phase: "P2_FLOW_ABS",
    });
    expect(feedback?.accuracyGraph.axisMin).toBe(0);
    expect(feedback?.accuracyGraph.axisMax).toBe(100);
    expect(feedback?.coreGraph.axisMin).toBe(1);
    expect(feedback?.coreGraph.axisMax).toBe(7);
    expect(feedback?.coreGraph.points[2].rawValue).toBe(2);
    expect(feedback?.coreGraph.points[2].smoothedValue).toBeCloseTo(7 / 3);
  });

  it("treats same n-level with improving accuracy as progress", () => {
    const feedback = buildInterblockFeedback({
      history: [
        point({ coreMetricValue: 2, balancedAccuracy: 0.7 }),
        point({ blockIndex: 2, coreMetricValue: 2, balancedAccuracy: 0.82 }),
      ],
      currentProgrammeRunId: "run-1",
      wapStatus: "active",
      phase: "P1_ARROW_ABS",
    });
    expect(feedback?.phaseLabel).toBe("stable_at_level");
    expect(feedback?.interpretationText).toBe("Same level, better control.");
  });

  it("prioritises timing and support labels", () => {
    expect(
      getInterblockPhaseLabel({
        wapStatus: "active",
        phase: "P1_ARROW_ABS",
        recentAccuracySlope: 5,
        recentCoreMetricSlope: 1,
        postSwap: false,
        timingQuality: "poor",
        falseAlarmRate: 0,
        missRate: 0,
        pointCount: 2,
      }),
    ).toBe("timing_limited");
    expect(
      getInterblockPhaseLabel({
        wapStatus: "active",
        phase: "P1_ARROW_ABS",
        recentAccuracySlope: -5,
        recentCoreMetricSlope: -1,
        postSwap: false,
        timingQuality: "good",
        falseAlarmRate: 0.4,
        missRate: 0.1,
        pointCount: 2,
      }),
    ).toBe("support_needed");
  });
});
