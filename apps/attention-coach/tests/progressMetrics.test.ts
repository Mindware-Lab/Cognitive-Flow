import { describe, expect, it } from "vitest";
import { progressMetricScores } from "../src/progressMetrics";
import type { CellEvidence } from "../src/types";

function evidence(
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

describe("progress metric scores", () => {
  it("uses flow-first evidence for flow-first protocol users", () => {
    const scores = progressMetricScores({
      protocolGroup: "validation_flow_first",
      activePhase: "P1_FLOW_ABS",
      evidence: [
        evidence("ACC", "flow_abs", 4),
        evidence("BSE", "flow_abs", 3),
      ],
    });

    expect(scores.cognitiveBandwidth).toBe(105);
    expect(scores.patternBinding).toBe(100);
  });

  it("keeps arrow-first evidence as the primary commercial score source", () => {
    const scores = progressMetricScores({
      protocolGroup: "commercial_arrows_first",
      activePhase: "P1_ARROW_ABS",
      evidence: [
        evidence("ACC", "flow_abs", 8),
        evidence("ACC", "arrow_abs", 4),
      ],
    });

    expect(scores.cognitiveBandwidth).toBe(105);
  });
});
