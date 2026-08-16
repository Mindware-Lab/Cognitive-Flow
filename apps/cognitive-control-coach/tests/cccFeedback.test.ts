import { describe, expect, it } from "vitest";
import { buildCccBlockFeedback, buildCccSessionMetrics } from "../src/cccFeedback";
import { createP0AttentionCarrierTransferPlan } from "../src/cccGenerator";
import { scoreCccAttentionTrial } from "../src/cccValue";
import type { CccAttentionTrialDefinition, CccRecordedTrial } from "../src/cccTypes";

const plan = createP0AttentionCarrierTransferPlan({ seed: "feedback", regimePairIndex: 0, microcyclesPerWrapper: 1 });
const policyTemplate = plan.trials.find((trial) => trial.estimand === "policy")!;
const signalTemplate = plan.trials.find((trial) => trial.estimand === "signal_capacity")!;

function recorded(trial: CccAttentionTrialDefinition, responseTimeMs: number, correct = true): CccRecordedTrial {
  const response = correct
    ? trial.correctResponse
    : trial.answerOptions.find((answer) => answer !== trial.correctResponse)!;
  return {
    trial,
    response,
    scoring: scoreCccAttentionTrial({ trial, response, responseTimeMs }),
    recordedAt: "2026-08-12T00:00:00.000Z",
    viewportClass: "desktop",
    inputMode: "keyboard",
    focusLost: false,
    exposureMsActual: trial.exposureMsRequested,
    actualStimulusFrames: trial.exposureMsRequested ? Math.round(trial.exposureMsRequested / 1000 * 60) : null,
    deviceRefreshRateEstimate: trial.exposureMsRequested ? 60 : null,
    timingQuality: trial.exposureMsRequested ? "good" : "not_applicable",
  };
}

describe("CCC block feedback", () => {
  it("separates clarity, niche timing and retained value", () => {
    const quick = { ...policyTemplate, regimeId: "clear_sprint" as const, ratio: "5:0" as const };
    const careful = { ...policyTemplate, regimeId: "deep_check" as const, ratio: "3:2" as const };
    const feedback = buildCccBlockFeedback([
      recorded(quick, 700, true),
      recorded(quick, 900, true),
      recorded(careful, 1500, true),
      recorded(careful, 1700, false),
    ]);
    expect(feedback.accuracy).toBe(0.75);
    expect(feedback.niches).toHaveLength(2);
    expect(feedback.timingShiftMs).toBe(800);
    expect(feedback.attentionThroughputBps).toBeCloseTo((1.58 + 1.58 + 4.91) / 4.8);
    expect(feedback.clarity.find((item) => item.ratio === "5:0")?.accuracy).toBe(1);
    expect(feedback.clarity.find((item) => item.ratio === "3:2")?.accuracy).toBe(0.5);
  });

  it("returns a provisional signal-rate estimate only after enough timing-clean observations", () => {
    const few = Array.from({ length: 8 }, (_, index) => recorded({ ...signalTemplate, ratio: index % 2 ? "4:1" : "3:2", exposureMsRequested: 500 }, 800, index % 4 !== 0));
    const enough = [...few, ...Array.from({ length: 10 }, (_, index) => recorded({ ...signalTemplate, ratio: index % 2 ? "4:1" : "3:2", exposureMsRequested: 700 }, 1000, index % 3 !== 0))];
    expect(buildCccBlockFeedback(few).attentionControlBps).toBeNull();
    expect(buildCccBlockFeedback(enough).attentionControlBps).not.toBeNull();
    expect(buildCccBlockFeedback(enough).signalTimingQuality).toBe("good");
  });

  it("creates a plain session summary from recorded trials", () => {
    const attention = { ...policyTemplate, operator: "attention" as const, regimeId: "clear_sprint" as const };
    const wm = { ...policyTemplate, operator: "relational_wm" as const, estimand: "relational_wm" as const, wmNLevel: 1 as const };
    const metrics = buildCccSessionMetrics([
      recorded(attention, 800, true),
      recorded(attention, 1000, false),
      recorded(wm, 1100, true),
    ]);
    expect(metrics.attentionAccuracy).toBe(0.5);
    expect(metrics.attentionThroughputBps).not.toBeNull();
    expect(metrics.attentionThroughputBps).toBeGreaterThan(0);
    expect(metrics.wmAccuracy).toBe(1);
    expect(metrics.wmThroughputBps).toBe(0);
    expect(metrics.medianDecisionMs).toBe(1000);
    expect(metrics.observationCount).toBe(3);
  });
});
