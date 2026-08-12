import type {
  CccAttentionAnswer,
  CccDelayedRecheckConfig,
  CccRegimeConfig,
  CccRegimeId,
  CccRelationalWmConfig,
  CccResponseLabels,
  CccShiftViewConfig,
  CccTrialTimingConfig,
  CccWrapperId,
} from "./cccTypes";

export const CCC_APP_ID = "cognitive_control_coach" as const;
export const CCC_PROTOCOL_VERSION = "ccc-multisession-transfer-v0.4";
export const CCC_CONFIG_VERSION = "ccc-programme-p1-v0.4";

export const CCC_TRIAL_TIMING: CccTrialTimingConfig = {
  fixationCueMs: 350,
  minimumExposureBeforeAnswerMs: 350,
  maxResponseWindowMs: 4000,
  // Published MFT-M mask duration, followed by the original Attention Coach's
  // separate post-mask response state.
  signalMaskMs: 500,
  signalResponseDeadlineMs: 2500,
  outcomeFeedbackMs: 350,
  interTrialIntervalMs: 250,
  omissionPoints: 0,
  validTrialsPerRegimeMicrocycle: 6,
  minimumBalancedMicrocyclesBeforeFlattening: 3,
};

export const CCC_REGIMES: Record<CccRegimeId, CccRegimeConfig> = {
  clear_sprint: {
    id: "clear_sprint",
    label: "Clear Sprint",
    ratioPriors: { "5:0": 0.6, "4:1": 0.3, "3:2": 0.1 },
    correctPot: 50,
    errorLoss: 10,
    drainPointsPerSecond: 15,
  },
  calculated_risk: {
    id: "calculated_risk",
    label: "Calculated Risk",
    ratioPriors: { "5:0": 0.1, "4:1": 0.3, "3:2": 0.6 },
    correctPot: 50,
    errorLoss: 10,
    drainPointsPerSecond: 15,
  },
  clean_precision: {
    id: "clean_precision",
    label: "Clean Precision",
    ratioPriors: { "5:0": 0.6, "4:1": 0.3, "3:2": 0.1 },
    correctPot: 10,
    errorLoss: 50,
    drainPointsPerSecond: 2.5,
  },
  deep_check: {
    id: "deep_check",
    label: "Deep Check",
    ratioPriors: { "5:0": 0.1, "4:1": 0.3, "3:2": 0.6 },
    correctPot: 10,
    errorLoss: 50,
    drainPointsPerSecond: 1.5,
  },
};

export const CCC_REGIME_PAIRS = [
  ["clear_sprint", "deep_check"],
  ["calculated_risk", "clean_precision"],
  ["clear_sprint", "calculated_risk"],
  ["clear_sprint", "clean_precision"],
  ["calculated_risk", "deep_check"],
  ["clean_precision", "deep_check"],
] as const satisfies readonly (readonly [CccRegimeId, CccRegimeId])[];

export const CCC_RATIO_MAJORITY_COUNTS = {
  "5:0": 5,
  "4:1": 4,
  "3:2": 3,
} as const;

export const CCC_WRAPPER_RESPONSE_LABELS: Record<CccWrapperId, CccResponseLabels> = {
  arrow_abs: {
    answerOptions: ["left", "right"],
    labels: { left: "Left", right: "Right" },
  },
  flow_abs: {
    answerOptions: ["left", "right"],
    labels: { left: "Left", right: "Right" },
  },
  arrow_rel: {
    answerOptions: ["in", "out"],
    labels: { in: "In", out: "Out" },
  },
  flow_rel: {
    answerOptions: ["in", "out"],
    labels: { in: "Contract", out: "Expand" },
  },
};

export const CCC_WM_RESPONSE_LABELS: CccResponseLabels = {
  answerOptions: ["match", "different"],
  labels: { match: "Match", different: "Different" },
};

export const CCC_P0_PRACTICE_VALID_TRIALS = 4;
export const CCC_SIGNAL_ANCHOR_VALID_TRIALS = 24;

export const CCC_P0_BLOCK_MICROCYCLES = {
  arrowRelStabilisation: 2,
  flowFirstContact: 1,
  flowRecovery: 2,
  arrowReturn: 1,
  relativeMix: 2,
} as const;

export const CCC_RELATIONAL_WM: CccRelationalWmConfig = {
  onsetToOnsetCadenceMs: 5000,
  responseDeadlineMs: 4000,
  initialNBack: 1,
  launchProgression: [1, 2],
  matchFrequency: 0.5,
  differentFrequency: 0.5,
  wrongLagLureRateOfFeasibleDifferent: 0.25,
  resetBufferOnRegimeTransition: true,
  excludeFirstNItemsFromScoring: true,
  advancementAnsweredAccuracy: 0.75,
  advancementOmissionCeiling: 0.1,
  advancementBalancedCycles: 2,
};

export const CCC_DELAYED_RECHECK: CccDelayedRecheckConfig = {
  minimumReentryHours: 18,
  targetReentryWindowHours: [24, 72],
  minimumFreshValidDecisions: 12,
  supportedUnlockAfterFailedChecks: 3,
  supportedUnlockMinimumAttentionSessions: 5,
};

export const CCC_SHIFT_VIEW: CccShiftViewConfig = {
  enabled: true,
  consumerLabel: "Shift the View",
  durationMs: 30000,
  reducedMotionAlternative: true,
  scoreAffecting: false,
  researchConditioningEnabled: false,
  allocation: "none",
};

export function answersForWrapper(wrapperId: CccWrapperId): readonly CccAttentionAnswer[] {
  return CCC_WRAPPER_RESPONSE_LABELS[wrapperId].answerOptions as readonly CccAttentionAnswer[];
}

export function validateCccPilotConfig(): string[] {
  const issues: string[] = [];
  for (const regime of Object.values(CCC_REGIMES)) {
    const priorTotal = Object.values(regime.ratioPriors).reduce((total, value) => total + value, 0);
    if (Math.abs(priorTotal - 1) > 0.000001) issues.push(`${regime.id} ratio priors must sum to 1.`);
    if (regime.correctPot <= 0) issues.push(`${regime.id} correct pot must be positive.`);
    if (regime.errorLoss <= 0) issues.push(`${regime.id} error loss must be positive.`);
    if (regime.drainPointsPerSecond < 0) issues.push(`${regime.id} drain must be non-negative.`);
  }

  if (CCC_TRIAL_TIMING.minimumExposureBeforeAnswerMs > CCC_TRIAL_TIMING.maxResponseWindowMs) {
    issues.push("Minimum exposure cannot exceed the response window.");
  }
  if (CCC_TRIAL_TIMING.signalMaskMs <= 0 || CCC_TRIAL_TIMING.signalResponseDeadlineMs <= 0) {
    issues.push("Signal mask and response timings must be positive.");
  }
  if (CCC_TRIAL_TIMING.validTrialsPerRegimeMicrocycle % 2 !== 0) {
    issues.push("Balanced attention microcycles require an even trial count for two target classes.");
  }
  for (const pair of CCC_REGIME_PAIRS) {
    if (String(pair[0]) === String(pair[1])) issues.push("A session regime pair must contain two distinct regimes.");
    if (!CCC_REGIMES[pair[0]] || !CCC_REGIMES[pair[1]]) issues.push("A session regime pair references an unknown regime.");
  }
  if (CCC_RELATIONAL_WM.onsetToOnsetCadenceMs <= CCC_RELATIONAL_WM.responseDeadlineMs) {
    issues.push("WM cadence must leave room after the response deadline before the next item.");
  }
  if (Math.abs(CCC_RELATIONAL_WM.matchFrequency + CCC_RELATIONAL_WM.differentFrequency - 1) > 0.000001) {
    issues.push("WM match and different frequencies must sum to 1.");
  }
  if (CCC_DELAYED_RECHECK.minimumReentryHours > CCC_DELAYED_RECHECK.targetReentryWindowHours[0]) {
    issues.push("Delayed re-entry minimum cannot exceed the target lower bound.");
  }
  if (CCC_SHIFT_VIEW.consumerLabel !== "Shift the View" || CCC_SHIFT_VIEW.scoreAffecting !== false) {
    issues.push("Shift the View must remain consumer-labelled and score-neutral.");
  }
  return issues;
}
