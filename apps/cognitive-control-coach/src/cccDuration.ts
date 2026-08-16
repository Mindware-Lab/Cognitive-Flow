import {
  CCC_P0_PRACTICE_VALID_TRIALS,
  CCC_RELATIONAL_WM,
  CCC_SHIFT_VIEW,
  CCC_TRIAL_TIMING,
} from "./cccConfig";
import type { CccSessionPlan } from "./cccTypes";

export type CccDurationScenarioId = "fast" | "typical" | "deliberate";

export interface CccDurationAssumptions {
  practiceDecisionMs: number;
  meanSignalExposureMs: number;
  signalDecisionMs: number;
  policyDecisionMs: number;
  wmDecisionMs: number;
  manualScreenMs: number;
}

export interface CccDurationEstimate {
  scenario: CccDurationScenarioId;
  automatedTaskMs: number;
  manualScreenMs: number;
  totalMs: number;
  totalMinutes: number;
}

/**
 * One workflow chooser, two practice explanations, one practice review,
 * five screens for each of the two P0 blocks, and two final review screens.
 * The count is an explicit product-planning assumption, not observed telemetry.
 */
export const CCC_GUIDED_MANUAL_SCREEN_COUNT = 16;

/** Later sessions omit workflow selection and practice but retain five guided screens per block. */
export function guidedManualScreenCount(plan: CccSessionPlan): number {
  return plan.programmeSessionKind === "p0_foundation"
    ? CCC_GUIDED_MANUAL_SCREEN_COUNT
    : plan.blocks.length * 5 + 2;
}

/** Person-level planning scenarios. Pilot telemetry must replace these values. */
export const CCC_DURATION_ASSUMPTIONS: Record<CccDurationScenarioId, CccDurationAssumptions> = {
  fast: {
    practiceDecisionMs: 800,
    meanSignalExposureMs: 350,
    signalDecisionMs: 650,
    policyDecisionMs: 900,
    wmDecisionMs: 650,
    manualScreenMs: 6500,
  },
  typical: {
    practiceDecisionMs: 1100,
    meanSignalExposureMs: 500,
    signalDecisionMs: 850,
    policyDecisionMs: 1250,
    wmDecisionMs: 850,
    manualScreenMs: 11000,
  },
  deliberate: {
    practiceDecisionMs: 1600,
    meanSignalExposureMs: 700,
    signalDecisionMs: 1250,
    policyDecisionMs: 1900,
    wmDecisionMs: 1250,
    manualScreenMs: 17000,
  },
};

export const CCC_SESSION_DURATION_LABEL = "Usually 10–15 minutes · up to about 20";

function trialSequenceMs(count: number, bodyMs: number): number {
  if (count <= 0) return 0;
  return count * bodyMs + Math.max(0, count - 1) * CCC_TRIAL_TIMING.interTrialIntervalMs;
}

export function estimateCccSessionDuration(
  plan: CccSessionPlan,
  scenario: CccDurationScenarioId,
): CccDurationEstimate {
  const assumptions = CCC_DURATION_ASSUMPTIONS[scenario];
  const signalCount = plan.trials.filter((trial) => trial.estimand === "signal_capacity").length;
  const wmCount = plan.trials.filter((trial) => trial.estimand === "relational_wm").length;
  const policyCount = plan.trials.length - signalCount - wmCount;
  const practiceBody = CCC_TRIAL_TIMING.fixationCueMs
    + assumptions.practiceDecisionMs
    + CCC_TRIAL_TIMING.outcomeFeedbackMs;
  const signalBody = CCC_TRIAL_TIMING.fixationCueMs
    + assumptions.meanSignalExposureMs
    + CCC_TRIAL_TIMING.signalMaskMs
    + assumptions.signalDecisionMs
    + CCC_TRIAL_TIMING.outcomeFeedbackMs;
  const policyBody = CCC_TRIAL_TIMING.fixationCueMs
    + assumptions.policyDecisionMs
    + CCC_TRIAL_TIMING.outcomeFeedbackMs;
  const wmBody = CCC_RELATIONAL_WM.defaultPresentationMs;
  const policyIntervals = plan.blocks
    .filter((block) => block.estimand === "policy" || block.estimand === "transfer")
    .reduce((total, block) => total + Math.max(0, block.validTrialCount - 1) * CCC_TRIAL_TIMING.interTrialIntervalMs, 0);
  const practiceCount = plan.programmeSessionKind === "p0_foundation" ? CCC_P0_PRACTICE_VALID_TRIALS : 0;
  const automatedTaskMs = trialSequenceMs(practiceCount, practiceBody)
    + trialSequenceMs(signalCount, signalBody)
    + policyCount * policyBody
    + policyIntervals
    + wmCount * wmBody
    + (plan.shiftViewEligible ? CCC_SHIFT_VIEW.durationMs : 0);
  const manualScreenMs = guidedManualScreenCount(plan) * assumptions.manualScreenMs;
  const totalMs = automatedTaskMs + manualScreenMs;
  return {
    scenario,
    automatedTaskMs,
    manualScreenMs,
    totalMs,
    totalMinutes: Math.round(totalMs / 6000) / 10,
  };
}
