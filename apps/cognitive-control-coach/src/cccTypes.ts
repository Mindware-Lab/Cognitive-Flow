export type CccAppId = "cognitive_control_coach";
export type CccStageId = "P0" | "P1a" | "P1b" | "P1c" | "PublicLaunch";
export type CccOperator = "attention" | "relational_wm";
export type CccCarrier = "arrow" | "flow";
export type CccReferenceFrame = "absolute" | "relative";
export type CccWrapperId = "arrow_abs" | "flow_abs" | "arrow_rel" | "flow_rel";
export type CccRatio = "5:0" | "4:1" | "3:2";
export type CccRegimeId = "clear_sprint" | "calculated_risk" | "clean_precision" | "deep_check";
export type CccAttentionAnswer = "left" | "right" | "in" | "out";
export type CccResponseChoice = CccAttentionAnswer | "withhold";
export type CccResponseClass = "answer" | "withhold" | "omission" | "invalid";
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
export type CccSessionType = "guided_p0" | "practice" | "portability_check" | "return_to_now";
export type CccAttentionTrialPurpose = "training" | "practice" | "carrier_probe" | "recovery" | "return" | "reference_extension" | "mix" | "return_to_now";
export type CccP0Phase =
  | "practice"
  | "arrow_stabilisation"
  | "flow_first_contact"
  | "flow_recovery"
  | "arrow_return"
  | "absolute_mix";

export interface CccPoint {
  x: number;
  y: number;
}

export interface CccTrialTimingConfig {
  fixationCueMs: number;
  minimumExposureBeforeAnswerMs: number;
  maxResponseWindowMs: number;
  outcomeFeedbackMs: number;
  interTrialIntervalMs: number;
  voluntaryWithholdPoints: number;
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
  answerOptions: readonly CccAttentionAnswer[];
  labels: Partial<Record<CccResponseChoice, string>> & { withhold: string };
}

export interface CccStimulusItem {
  positionIndex: number;
  position: CccPoint;
  relation: CccAttentionAnswer;
  vector: CccPoint;
}

export interface CccAttentionBlockPlan {
  id: string;
  index: number;
  stage: CccStageId;
  stepId: string;
  label: string;
  operator: "attention";
  phase: CccP0Phase;
  wrapperId: CccWrapperId | "mixed_abs";
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
}

export interface CccAttentionTrialDefinition {
  id: string;
  sessionId: string;
  blockId: string;
  trialIndex: number;
  blockTrialIndex: number;
  stage: CccStageId;
  stepId: string;
  phase: CccP0Phase;
  operator: "attention";
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
  targetClass: CccAttentionAnswer;
  correctResponse: CccAttentionAnswer;
  answerOptions: readonly CccAttentionAnswer[];
  responseLabels: CccResponseLabels;
  stimulusItems: CccStimulusItem[];
  coherenceNoiseLevel: 0;
  seed: string;
  practice: boolean;
  diagnostic: boolean;
  assistedFirstContact: boolean;
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
  operator: CccOperator;
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
