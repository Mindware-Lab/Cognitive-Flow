import { describe, expect, it } from "vitest";
import { CCC_LEARNING_CURVE } from "../src/cccConfig";
import { createP0AttentionCarrierTransferPlan } from "../src/cccGenerator";
import { evaluateCccLearningCurve, isCccLearningCurveBoundary } from "../src/cccLearningCurve";
import type { CccAttentionBlockPlan, CccRecordedTrial } from "../src/cccTypes";
import { scoreCccAttentionTrial } from "../src/cccValue";

const plan = createP0AttentionCarrierTransferPlan({
  seed: "learning-curve",
  regimePair: ["clear_sprint", "deep_check"],
});
const source = plan.blocks.find((block) => block.learningCurveGate === "source_stabilisation")!;

function resultsFor(outcomes: readonly number[], block: CccAttentionBlockPlan = source): CccRecordedTrial[] {
  const trials = plan.trials.filter((trial) => trial.blockId === block.id);
  return outcomes.flatMap((correctCount, cycleIndex) => {
    const cycle = cycleIndex + 1;
    const cycleTrials = trials.filter((trial) => trial.microcycleIndex === cycle);
    return cycleTrials.map((trial, index) => {
      const correct = index < correctCount;
      const response = correct
        ? trial.correctResponse
        : trial.answerOptions.find((answer) => answer !== trial.correctResponse)!;
      return {
        trial,
        response,
        scoring: scoreCccAttentionTrial({ trial, response, responseTimeMs: 900 }),
        recordedAt: "2026-08-13T12:00:00.000Z",
        viewportClass: "desktop",
        inputMode: "keyboard",
        focusLost: false,
        exposureMsActual: null,
        actualStimulusFrames: null,
        deviceRefreshRateEstimate: null,
        timingQuality: "not_applicable",
      } satisfies CccRecordedTrial;
    });
  });
}

describe("CCC source-wrapper learning-curve gate", () => {
  it("does not switch after one good block or before the protocol exposure floor", () => {
    const results = resultsFor([12, 12, 12, 12]);
    const decision = evaluateCccLearningCurve(source, results);
    expect(decision.status).toBe("collecting");
    expect(decision.shouldEndBlock).toBe(false);
    expect(decision.checks.minimumExposure).toBe(false);
    expect(isCccLearningCurveBoundary(source, results)).toBe(true);
  });

  it("detects a learned, stable plateau above the accuracy floor", () => {
    const decision = evaluateCccLearningCurve(source, resultsFor([8, 9, 10, 11, 11, 11, 11]));
    expect(decision.status).toBe("stabilised");
    expect(decision.shouldEndBlock).toBe(true);
    expect(decision.completedTrials).toBe(84);
    expect(decision.recentAccuracy).toBeGreaterThanOrEqual(CCC_LEARNING_CURVE.accuracyFloor);
    expect(Math.abs(decision.performanceSlope!)).toBeLessThanOrEqual(CCC_LEARNING_CURVE.maximumAbsoluteSlope);
    expect(decision.checks.learningObserved).toBe(true);
  });

  it("continues while recent performance is still improving", () => {
    const decision = evaluateCccLearningCurve(source, resultsFor([7, 7, 8, 8, 9, 10, 11]));
    expect(decision.status).toBe("still_improving");
    expect(decision.shouldEndBlock).toBe(false);
    expect(decision.checks.slopeReady).toBe(false);
  });

  it("uses the maximum exposure as a supported-probe safeguard, not a plateau claim", () => {
    const decision = evaluateCccLearningCurve(source, resultsFor([6, 7, 6, 7, 6, 7, 6, 7, 6, 7]));
    expect(decision.status).toBe("exposure_ceiling");
    expect(decision.shouldEndBlock).toBe(true);
    expect(decision.checks.accuracyReady).toBe(false);
  });

  it("requires a complete current-session microcycle before acting on historical stability", () => {
    const historical = resultsFor([8, 9, 10, 11, 11, 11, 11]).map((result) => result);
    const historyDecision = evaluateCccLearningCurve(source, historical);
    const history = historyDecision.points.map((point) => ({ ...point, sessionId: "earlier-session" }));
    const empty = evaluateCccLearningCurve(source, [], undefined, history);
    expect(empty.status).not.toBe("stabilised");
    expect(empty.shouldEndBlock).toBe(false);
    const currentCycle = resultsFor([11]);
    expect(evaluateCccLearningCurve(source, currentCycle, undefined, history).status).toBe("stabilised");
  });

  it("never applies the plateau gate to protected first-contact blocks", () => {
    const probe = plan.blocks.find((block) => block.phase === "flow_rel_first_contact")!;
    const decision = evaluateCccLearningCurve(probe, []);
    expect(decision.status).toBe("not_applicable");
    expect(decision.shouldEndBlock).toBe(false);
  });
});
