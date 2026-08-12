export type CccAppId = "cognitive_control_coach";
export type CccStageId = "P0" | "P1a" | "P1b" | "P1c" | "PublicLaunch";
export type CccOperator = "attention" | "relational_wm";
export type CccSessionOperator = CccOperator | "integrated";
export type CccCarrier = "arrow" | "flow";
export type CccReferenceFrame = "absolute" | "relative";
export type CccWrapperId = "arrow_abs" | "flow_abs" | "arrow_rel" | "flow_rel";
export type CccRatio = "5:0" | "4:1" | "3:2";
export type CccRegimeId = "clear_sprint" | "calculated_risk" | "clean_precision" | "deep_check";
export type CccAttentionAnswer = "left" | "right" | "in" | "out";
export type CccWmAnswer = "match" | "different";
export type CccResponseChoice = CccAttentionAnswer | CccWmAnswer;
export type CccStimulusRelation = CccAttentionAnswer | "cw" | "ccw";
export type CccResponseClass = "answer" | "omission" | "invalid";
export type CccEstimand = "practice" | "signal_capacity" | "policy" | "transfer" | "relational_wm";
export type CccPresentationMode = "masked_forced_choice" | "self_paced_value";
export type CccTimingQuality = "good" | "acceptable" | "poor" | "not_applicable";
export type CccTransitionKind =
  | "baseline_stabilization"
  | "carrier_transfer"
  | "reference_frame_extension"
  | "mixed_attention_portability"
  | "wm_introduction"
  | "wm_carrier_transfer"
  | "return_to_now"
  | "operator_integration"
  | "supported_unlock";
export type CccSessionType = "guided_p0" | "practice" | "portability_check" | "wm_bridge" | "return_to_now";
export type CccProgrammeSessionKind =
  | "p0_foundation"
  | "p1a_consolidation"
  | "p1a_delayed_recheck"
  | "p1b_wm_bridge"
  | "p1c_operator_integration"
  | "p1c_delayed_integration";
export type CccAttentionTrialPurpose = "training" | "practice" | "carrier_probe" | "recovery" | "return" | "reference_extension" | "mix" | "delayed_recheck" | "wm_training" | "wm_carrier_probe" | "wm_recovery" | "wm_return" | "wm_mix" | "return_to_now" | "operator_integration";
export type CccP0Phase =
  | "practice"
  | "signal_anchor"
  | "arrow_rel_stabilisation"
  | "flow_rel_first_contact"
  | "flow_rel_recovery"
  | "arrow_rel_return"
  | "relative_mix";
export type CccProgrammePhase = CccP0Phase
  | "p1a_arrow_stabilisation"
  | "p1a_flow_first_contact"
  | "p1a_flow_recovery"
  | "p1a_arrow_return"
  | "p1a_relative_mix"
  | "p1a_delayed_recheck"
  | "p1b_attention_bridge"
  | "p1b_wm_arrow_stabilisation"
  | "p1b_wm_flow_first_contact"
  | "p1b_wm_flow_recovery"
  | "p1b_wm_arrow_return"
  | "p1b_wm_relative_mix"
  | "p1c_attention_entry"
  | "p1c_delayed_reentry"
  | "p1c_wm_hold"
  | "p1c_attention_reentry"
  | "p1c_operator_mix";

export type CccTransferStatus = "building" | "attention_portable" | "supported_unlock";
export type CccProgrammeStatus = "active" | "programme_complete" | "full_transfer" | "supported_completion";

export interface CccProgrammeEvidence {
  carrierFirstContactObserved: boolean;
  carrierFirstContactPassed: boolean;
  recoveryPasses: number;
  returnPasses: number;
  mixedPasses: number;
  delayedPasses: number;
  failedDelayedChecks: number;
  policyCoverageSessions: number;
  wmStabilityPasses: number;
  wmRecoveryPasses: number;
  wmReturnPasses: number;
  wmMixedPasses: number;
  returnToNowPasses: number;
  integrationPasses: number;
  integrationCarriers: CccCarrier[];
  finalDelayedPasses: number;
  failedFinalDelayedChecks: number;
}

export interface CccProgrammeSessionSummary {
  sessionId: string;
  sessionNumber: number;
  stage: CccStageId;
  kind: CccProgrammeSessionKind;
  regimePair: readonly [CccRegimeId, CccRegimeId];
  startedAt: string;
  completedAt: string;
  gateDecisions: string[];
}

export interface CccProgrammeState {
  programmeVersion: 1;
  programmeRunId: string;
  status: CccProgrammeStatus;
  currentStage: Exclude<CccStageId, "PublicLaunch"> | "complete";
  transferStatus: CccTransferStatus;
  sessionNumber: number;
  attentionSessionCount: number;
  wmLevel: 1 | 2;
  delayedRecheckDueAt: string | null;
  delayedRecheckWindowEndsAt: string | null;
  regimeExposure: Record<CccRegimeId, number>;
  pairHistory: string[];
  evidence: CccProgrammeEvidence;
  sessions: CccProgrammeSessionSummary[];
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
}

export interface CccPoint {
  x: number;
  y: number;
}

export interface CccTrialTimingConfig {
  fixationCueMs: number;
  minimumExposureBeforeAnswerMs: number;
  maxResponseWindowMs: number;
  signalResponseDeadlineMs: number;
  outcomeFeedbackMs: number;
  interTrialIntervalMs: number;
  omissionPoints: number;
  validTrialsPerRegimeMicrocycle: number;
  minimumBalancedMicrocyclesBeforeFlattening: number;
}

export interface CccRegimeConfig {
  id: CccRegimeId;
  label: string;
  ratioPriors: Record<CccRatio, number>;
  correctPot: number;
  errorLoss: number;
  drainPointsPerSecond: number;
}

export interface CccRelationalWmConfig {
  onsetToOnsetCadenceMs: number;
  responseDeadlineMs: number;
  initialNBack: 1;
  launchProgression: readonly [1, 2];
  matchFrequency: number;
  differentFrequency: number;
  wrongLagLureRateOfFeasibleDifferent: number;
  resetBufferOnRegimeTransition: boolean;
  excludeFirstNItemsFromScoring: boolean;
  advancementAnsweredAccuracy: number;
  advancementOmissionCeiling: number;
  advancementBalancedCycles: number;
}

export interface CccDelayedRecheckConfig {
  minimumReentryHours: number;
  targetReentryWindowHours: readonly [number, number];
  minimumFreshValidDecisions: number;
  supportedUnlockAfterFailedChecks: number;
  supportedUnlockMinimumAttentionSessions: number;
}

export interface CccShiftViewConfig {
  enabled: boolean;
  consumerLabel: "Shift the View";
  durationMs: number;
  reducedMotionAlternative: boolean;
  scoreAffecting: false;
  researchConditioningEnabled: boolean;
  allocation: "none" | "deterministic_pulse_vs_neutral";
}

export interface CccResponseLabels {
  answerOptions: readonly CccResponseChoice[];
  labels: Partial<Record<CccResponseChoice, string>>;
}

export interface CccStimulusItem {
  positionIndex: number;
  position: CccPoint;
  relation: CccStimulusRelation;
  vector: CccPoint;
}

export interface CccAttentionBlockPlan {
  id: string;
  index: number;
  stage: CccStageId;
  stepId: string;
  label: string;
  operator: CccOperator;
  phase: CccProgrammePhase;
  estimand: CccEstimand;
  presentationMode: CccPresentationMode;
  wrapperId: CccWrapperId | "mixed_abs" | "mixed_rel";
  wrappers: readonly CccWrapperId[];
  sourceWrapperId: CccWrapperId | null;
  transitionKind: CccTransitionKind;
  strictCarrierTransferBoundary: boolean;
  regimePair: readonly [CccRegimeId, CccRegimeId];
  microcycleCount: number;
  validTrialCount: number;
  practice: boolean;
  diagnostic: boolean;
  shiftViewBefore: boolean;
  wmNLevel: 1 | 2 | null;
}

export interface CccAttentionTrialDefinition {
  id: string;
  sessionId: string;
  blockId: string;
  trialIndex: number;
  blockTrialIndex: number;
  stage: CccStageId;
  stepId: string;
  phase: CccProgrammePhase;
  operator: CccOperator;
  estimand: CccEstimand;
  presentationMode: CccPresentationMode;
  purpose: CccAttentionTrialPurpose;
  wrapperId: CccWrapperId;
  sourceWrapperId: CccWrapperId | null;
  carrier: CccCarrier;
  referenceFrame: CccReferenceFrame;
  transitionKind: CccTransitionKind;
  strictCarrierTransferBoundary: boolean;
  regimeId: CccRegimeId;
  microcycleIndex: number;
  balancedSlotIndex: number;
  ratio: CccRatio;
  majorityCount: 3 | 4 | 5;
  targetClass: CccStimulusRelation;
  correctResponse: CccResponseChoice;
  answerOptions: readonly CccResponseChoice[];
  responseLabels: CccResponseLabels;
  stimulusItems: CccStimulusItem[];
  coherenceNoiseLevel: 0;
  seed: string;
  practice: boolean;
  diagnostic: boolean;
  assistedFirstContact: boolean;
  exposureMsRequested: number | null;
  signalStaircaseLevel: number | null;
  wmNLevel: 1 | 2 | null;
  wmIsMatch: boolean | null;
  wmBuffer: boolean;
  wmLureType: "none" | "wrong_lag" | null;
  replacementOfTrialId: string | null;
}

export interface CccSessionPlan {
  planId: string;
  appId: CccAppId;
  protocolVersion: string;
  configVersion: string;
  sessionId: string;
  sessionType: CccSessionType;
  stage: CccStageId;
  operator: CccSessionOperator;
  programmeRunId: string | null;
  programmeSessionNumber: number;
  programmeSessionKind: CccProgrammeSessionKind;
  delayedRecheckNotBefore: string | null;
  regimePair: readonly [CccRegimeId, CccRegimeId];
  shiftViewEligible: boolean;
  blocks: CccAttentionBlockPlan[];
  trials: CccAttentionTrialDefinition[];
}

export interface CccAttentionResponseInput {
  trial: CccAttentionTrialDefinition;
  response: CccResponseChoice | null | undefined;
  responseTimeMs: number | null | undefined;
  invalidated?: boolean;
  invalidReason?: "focus_loss" | "aborted";
}

export interface CccAttentionTrialScoring {
  scoringVersion: string;
  responseClass: CccResponseClass;
  isCorrect: boolean;
  isValidDecision: boolean;
  isOmission: boolean;
  isInvalidated: boolean;
  answeredBeforeMinimumExposure: boolean;
  deadlineExceeded: boolean;
  responseTimeMs: number | null;
  rewardRemaining: number;
  pointsRealised: number;
  normalizedValue: number;
  regimeId: CccRegimeId;
  configVersion: string;
  validForProgression: boolean;
  countsTowardQuota: boolean;
  invalidReason: "early_response" | "deadline" | "focus_loss" | "aborted" | null;
}

export type CccInputMode = "pointer" | "touch" | "keyboard" | "deadline" | "system";

export interface CccRecordedTrial {
  trial: CccAttentionTrialDefinition;
  response: CccResponseChoice | null;
  scoring: CccAttentionTrialScoring;
  recordedAt: string;
  viewportClass: "mobile" | "tablet" | "desktop";
  inputMode: CccInputMode;
  focusLost: boolean;
  exposureMsActual: number | null;
  actualStimulusFrames: number | null;
  deviceRefreshRateEstimate: number | null;
  timingQuality: CccTimingQuality;
}

export interface CccRuntimeEvent {
  id: string;
  eventType: string;
  occurredAt: string;
  sessionId: string;
  blockId: string | null;
  payload: Record<string, unknown>;
}

export interface CccProgressionStep {
  id: string;
  stage: CccStageId;
  order: number;
  operator: CccOperator;
  label: string;
  sourceWrapperId: CccWrapperId | null;
  targetWrapperId: CccWrapperId | null;
  wrappers: readonly CccWrapperId[];
  transitionKind: CccTransitionKind;
  strictCarrierTransferBoundary: boolean;
  requiresShiftViewGate: boolean;
  contributesToAttentionPortability: boolean;
}

export interface CccProgressionStage {
  id: CccStageId;
  label: string;
  releaseGate: "preview" | "private_pilot" | "public_launch";
  steps: readonly CccProgressionStep[];
}
