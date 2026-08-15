import { describe, expect, it } from "vitest";
import {
  CCC_DELAYED_RECHECK,
  CCC_LEARNING_CURVE,
  CCC_REGIMES,
  CCC_RELATIONAL_WM,
  CCC_SHIFT_VIEW,
  CCC_TRIAL_TIMING,
  CCC_WRAPPER_RESPONSE_LABELS,
  validateCccPilotConfig,
} from "../src/cccConfig";

describe("CCC pilot configuration", () => {
  it("matches the accepted v0.2 timing and value parameters", () => {
    expect(validateCccPilotConfig()).toEqual([]);
    expect(CCC_TRIAL_TIMING.fixationCueMs).toBe(350);
    expect(CCC_TRIAL_TIMING.minimumExposureBeforeAnswerMs).toBe(350);
    expect(CCC_TRIAL_TIMING.maxResponseWindowMs).toBe(4000);
    expect(CCC_TRIAL_TIMING.signalMaskMs).toBe(500);
    expect(CCC_TRIAL_TIMING.signalResponseDeadlineMs).toBe(2500);
    expect(CCC_TRIAL_TIMING.validTrialsPerRegimeMicrocycle).toBe(6);
    expect(CCC_LEARNING_CURVE).toMatchObject({
      recentWindowMicrocycles: 4,
      minimumBalancedMicrocycles: 7,
      maximumBalancedMicrocycles: 10,
      accuracyFloor: 0.75,
      omissionCeiling: 0.1,
    });
    expect(CCC_REGIMES.clear_sprint).toMatchObject({ correctPot: 50, errorLoss: 10, drainPointsPerSecond: 15 });
    expect(CCC_REGIMES.deep_check).toMatchObject({ correctPot: 10, errorLoss: 50, drainPointsPerSecond: 1.5 });
  });

  it("keeps every MFT-M-derived wrapper forced choice on the same In/Out response axis", () => {
    expect(CCC_WRAPPER_RESPONSE_LABELS.arrow_abs).toEqual({ answerOptions: ["left", "right"], labels: { left: "Left", right: "Right" } });
    expect(CCC_WRAPPER_RESPONSE_LABELS.arrow_rel).toEqual({ answerOptions: ["in", "out"], labels: { in: "In", out: "Out" } });
    expect(CCC_WRAPPER_RESPONSE_LABELS.flow_rel).toEqual({ answerOptions: ["in", "out"], labels: { in: "In", out: "Out" } });
    expect(JSON.stringify(CCC_WRAPPER_RESPONSE_LABELS)).not.toContain("Not sure");
  });

  it("keeps Shift the View configurable and score-neutral", () => {
    expect(CCC_SHIFT_VIEW).toMatchObject({
      enabled: true,
      consumerLabel: "Shift the View",
      durationMs: 30000,
      reducedMotionAlternative: true,
      scoreAffecting: false,
      researchConditioningEnabled: false,
    });
  });

  it("captures relational WM and delayed-unlock parameters for later P1 stages", () => {
    expect(CCC_RELATIONAL_WM).toMatchObject({
      scoredTrialsPerBlock: 20,
      blocksPerSession: 4,
      minimumPresentationMs: 350,
      maximumPresentationMs: 3500,
      defaultPresentationMs: 1200,
      maskMs: 350,
      responseDeadlineMs: 4000,
      initialNBack: 1,
      maximumNBack: 5,
      matchFrequency: 0.3,
      differentFrequency: 0.7,
      wrongLagLureRateOfFeasibleDifferent: 0.25,
      advancementAnsweredAccuracy: 0.85,
      maintenanceAnsweredAccuracy: 0.7,
    });
    expect(CCC_DELAYED_RECHECK).toMatchObject({
      minimumReentryHours: 18,
      minimumFreshValidDecisions: 12,
      supportedUnlockAfterFailedChecks: 3,
      supportedUnlockMinimumAttentionSessions: 5,
    });
  });
});
