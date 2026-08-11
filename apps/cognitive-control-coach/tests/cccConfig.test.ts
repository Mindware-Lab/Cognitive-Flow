import { describe, expect, it } from "vitest";
import {
  CCC_DELAYED_RECHECK,
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
    expect(CCC_TRIAL_TIMING.validTrialsPerRegimeMicrocycle).toBe(6);
    expect(CCC_REGIMES.clear_sprint).toMatchObject({ correctPot: 50, errorLoss: 10, drainPointsPerSecond: 15 });
    expect(CCC_REGIMES.deep_check).toMatchObject({ correctPot: 10, errorLoss: 50, drainPointsPerSecond: 1.5 });
  });

  it("keeps the withhold action available under a plain-language label", () => {
    expect(CCC_WRAPPER_RESPONSE_LABELS.arrow_abs.labels).toMatchObject({ left: "Left", right: "Right", withhold: "Not sure" });
    expect(CCC_WRAPPER_RESPONSE_LABELS.flow_abs.labels).toMatchObject({ left: "Left", right: "Right", withhold: "Not sure" });
    expect(CCC_WRAPPER_RESPONSE_LABELS.arrow_rel.labels).toMatchObject({ in: "Inward", out: "Outward", withhold: "Not sure" });
    expect(CCC_WRAPPER_RESPONSE_LABELS.flow_rel.labels).toMatchObject({ in: "Inward", out: "Outward", withhold: "Not sure" });
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
      onsetToOnsetCadenceMs: 4500,
      responseDeadlineMs: 4000,
      initialNBack: 1,
      matchFrequency: 0.5,
      differentFrequency: 0.5,
      wrongLagLureRateOfFeasibleDifferent: 0.25,
    });
    expect(CCC_DELAYED_RECHECK).toMatchObject({
      minimumReentryHours: 18,
      minimumFreshValidDecisions: 12,
      supportedUnlockAfterFailedChecks: 3,
      supportedUnlockMinimumAttentionSessions: 5,
    });
  });
});
