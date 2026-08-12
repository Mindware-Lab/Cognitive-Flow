import { describe, expect, it } from "vitest";
import { createP0AttentionCarrierTransferPlan } from "../src/cccGenerator";
import { scoreCccAttentionTrial, summarizeCccAttentionScores } from "../src/cccValue";

const plan = createP0AttentionCarrierTransferPlan({ seed: "value-test", regimePairIndex: 0, microcyclesPerWrapper: 1 });
const policyTrial = plan.trials.find((trial) => trial.estimand === "policy")!;
const signalTrial = plan.trials.find((trial) => trial.estimand === "signal_capacity")!;

describe("CCC forced-choice value scoring", () => {
  it("drains rewards only in self-paced value blocks", () => {
    const trial = { ...policyTrial, regimeId: "clear_sprint" as const };
    const scored = scoreCccAttentionTrial({ trial, response: trial.correctResponse, responseTimeMs: 1000 });
    expect(scored).toMatchObject({ responseClass: "answer", isCorrect: true, rewardRemaining: 35, pointsRealised: 35 });
    expect(scored.normalizedValue).toBeCloseTo(35 / 60);
  });

  it("applies the niche error loss and has no voluntary withhold action", () => {
    const trial = { ...policyTrial, regimeId: "deep_check" as const };
    const wrongResponse = trial.answerOptions.find((answer) => answer !== trial.correctResponse)!;
    const wrong = scoreCccAttentionTrial({ trial, response: wrongResponse, responseTimeMs: 1200 });
    expect(wrong).toMatchObject({ pointsRealised: -50, isValidDecision: true, countsTowardQuota: true });
  });

  it("counts deadline omissions as unresolved observations but replaces interruptions and early responses", () => {
    const omitted = scoreCccAttentionTrial({ trial: policyTrial, response: null, responseTimeMs: null });
    const late = scoreCccAttentionTrial({ trial: policyTrial, response: policyTrial.correctResponse, responseTimeMs: 4010 });
    const early = scoreCccAttentionTrial({ trial: policyTrial, response: policyTrial.correctResponse, responseTimeMs: 200 });
    const aborted = scoreCccAttentionTrial({ trial: policyTrial, response: policyTrial.correctResponse, responseTimeMs: 900, invalidated: true, invalidReason: "aborted" });
    expect(omitted).toMatchObject({ responseClass: "omission", countsTowardQuota: true, isCorrect: false });
    expect(late).toMatchObject({ responseClass: "omission", countsTowardQuota: true });
    expect(early).toMatchObject({ responseClass: "invalid", countsTowardQuota: false });
    expect(aborted).toMatchObject({ responseClass: "invalid", countsTowardQuota: false, invalidReason: "aborted" });
  });

  it("keeps masked signal choices free from value scoring and the policy minimum-view rule", () => {
    const scored = scoreCccAttentionTrial({ trial: signalTrial, response: signalTrial.correctResponse, responseTimeMs: 250 });
    const afterMaskDeadline = scoreCccAttentionTrial({ trial: signalTrial, response: signalTrial.correctResponse, responseTimeMs: 2510 });
    expect(scored).toMatchObject({ responseClass: "answer", isCorrect: true, rewardRemaining: 0, pointsRealised: 0, countsTowardQuota: true });
    expect(afterMaskDeadline).toMatchObject({ responseClass: "omission", deadlineExceeded: true, countsTowardQuota: true });
  });

  it("summarises answered accuracy without removing omissions from the recorded block", () => {
    const wrongResponse = policyTrial.answerOptions.find((answer) => answer !== policyTrial.correctResponse)!;
    const scores = [
      scoreCccAttentionTrial({ trial: policyTrial, response: policyTrial.correctResponse, responseTimeMs: 900 }),
      scoreCccAttentionTrial({ trial: policyTrial, response: wrongResponse, responseTimeMs: 900 }),
      scoreCccAttentionTrial({ trial: policyTrial, response: null, responseTimeMs: null }),
      scoreCccAttentionTrial({ trial: policyTrial, response: policyTrial.correctResponse, responseTimeMs: 100, invalidated: true }),
    ];
    expect(summarizeCccAttentionScores(scores)).toMatchObject({
      validDecisionCount: 2,
      answeredCount: 2,
      omissionCount: 1,
      invalidCount: 1,
      answeredAccuracy: 0.5,
    });
  });
});
