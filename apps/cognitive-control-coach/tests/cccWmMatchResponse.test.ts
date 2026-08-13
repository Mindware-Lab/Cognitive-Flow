import { describe, expect, it } from "vitest";
import { CCC_RELATIONAL_WM, CCC_WM_RESPONSE_LABELS } from "../src/cccConfig";
import { createProgrammeSessionPlan } from "../src/cccProgrammeGenerator";
import { scoreCccAttentionTrial } from "../src/cccValue";

const plan = createProgrammeSessionPlan({
  sessionId: "wm-match-response",
  seed: "wm-match-response",
  programmeRunId: "wm-match-response",
  programmeSessionNumber: 3,
  kind: "p1b_wm_bridge",
  regimePair: ["clear_sprint", "deep_check"],
  wmLevel: 1,
  wmPairLevels: [1, 1],
});

const matchTrial = {
  ...plan.trials.find((trial) => !trial.wmBuffer && trial.wmIsMatch === true)!,
  exposureMsRequested: 1200,
};
const nonMatchTrial = {
  ...plan.trials.find((trial) => !trial.wmBuffer && trial.wmIsMatch === false)!,
  exposureMsRequested: 1200,
};

describe("CCC relational WM Match-only response rule", () => {
  it("exposes Match as the only overt response", () => {
    expect(CCC_WM_RESPONSE_LABELS).toEqual({ answerOptions: ["match"], labels: { match: "Match" } });
    expect(matchTrial.answerOptions).toEqual(["match"]);
    expect(nonMatchTrial.answerOptions).toEqual(["match"]);
  });

  it("scores a Match press on a match trial as a hit", () => {
    const score = scoreCccAttentionTrial({ trial: matchTrial, response: "match", responseTimeMs: 650 });
    expect(score).toMatchObject({
      responseClass: "answer",
      isCorrect: true,
      isOmission: false,
      countsTowardQuota: true,
    });
  });

  it("scores withholding on a match trial as a miss", () => {
    const score = scoreCccAttentionTrial({
      trial: matchTrial,
      response: null,
      responseTimeMs: CCC_RELATIONAL_WM.responseDeadlineMs + 5,
    });
    expect(score).toMatchObject({
      responseClass: "answer",
      isCorrect: false,
      isOmission: true,
      countsTowardQuota: true,
      invalidReason: "deadline",
    });
    expect(score.responseTimeMs).toBeNull();
    expect(score.pointsRealised).toBeLessThan(0);
  });

  it("scores a Match press on a non-match trial as a false alarm", () => {
    const score = scoreCccAttentionTrial({ trial: nonMatchTrial, response: "match", responseTimeMs: 650 });
    expect(score).toMatchObject({
      responseClass: "answer",
      isCorrect: false,
      isOmission: false,
      countsTowardQuota: true,
    });
    expect(score.pointsRealised).toBeLessThan(0);
  });

  it("scores withholding on a non-match trial as a correct rejection", () => {
    const score = scoreCccAttentionTrial({
      trial: nonMatchTrial,
      response: null,
      responseTimeMs: CCC_RELATIONAL_WM.responseDeadlineMs + 5,
    });
    expect(score).toMatchObject({
      responseClass: "answer",
      isCorrect: true,
      isOmission: false,
      countsTowardQuota: true,
      invalidReason: null,
    });
    expect(score.responseTimeMs).toBeNull();
    expect(score.pointsRealised).toBeGreaterThan(0);
  });
});
