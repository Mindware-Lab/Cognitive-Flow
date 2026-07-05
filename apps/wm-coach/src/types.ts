export type Construct = "ACC" | "BSE";
export type Layer = "relational_memory" | "binding_memory";
export type PublicLabel = "Relational Memory" | "Binding Memory";
export type TechnicalLabel = "Relational WMC" | "Binding WMC";
export type Carrier = "arrow" | "flow";
export type StimulusCarrier = "arrow" | "optic_flow";
export type Frame = "abs" | "rel";
export type CanonicalFrame = "absolute" | "relational";
export type CellKey = "arrow_abs" | "flow_abs" | "arrow_rel" | "flow_rel" | "mixed";
export type PhaseLabel =
  | "P1_ARROW_ABS"
  | "P2_FLOW_ABS"
  | "P3_ARROW_REL"
  | "P4_FLOW_REL"
  | "P1_FLOW_ABS"
  | "P2_ARROW_ABS"
  | "P3_FLOW_REL"
  | "P4_ARROW_REL"
  | "P5_MIXED"
  | "P6_DELAYED";
export type PhaseStatus =
  | "active"
  | "flattening"
  | "ready_to_swap"
  | "recovering"
  | "mixed"
  | "delayed"
  | "extended_for_learning_curve"
  | "completed";
export type TransitionKey = "T_CM_BASE" | "T_FRAME_ARROW" | "T_FRAME_FLOW" | "T_CM_REL" | "T_MIXED" | "T_DELAYED";
export type TransitionType = "carrier_swap" | "frame_ramp" | "mixed_switch" | "delayed_recheck";
export type ProtocolGroup = "commercial_arrows_first" | "validation_arrows_first" | "validation_flow_first";
export type ScratchBaselineSource =
  | "counterbalanced_cohort"
  | "historical_norm"
  | "device_tier_norm"
  | "personal_early_prior"
  | "within_user_proxy"
  | "unavailable";
export type ConfidenceLabel =
  | "insufficient_data"
  | "calibrating"
  | "moderate_confidence"
  | "high_confidence"
  | "timing_limited"
  | "unstable_estimate";
export type TrendLabel = "improving" | "steady" | "developing" | "variable_today" | "needs_more_data";
export type Ratio = "5:0" | "4:1" | "3:2";
export type TimingQuality = "good" | "acceptable" | "poor";
export type DirectionRelation = "left" | "right" | "up" | "down" | "out" | "in" | "cw" | "ccw";
export type CanonicalRelation =
  | "LEFT"
  | "RIGHT"
  | "UP"
  | "DOWN"
  | "UP_LEFT"
  | "UP_RIGHT"
  | "DOWN_LEFT"
  | "DOWN_RIGHT"
  | "OUT"
  | "IN"
  | "CW"
  | "CCW"
  | "SPIRAL_OUT_CW"
  | "SPIRAL_OUT_CCW"
  | "SPIRAL_IN_CW"
  | "SPIRAL_IN_CCW";
export type RelationFamily = "absolute_direction" | "radial" | "tangential" | "spiral" | "mixed";
export type TokenColor = "blue" | "yellow" | "green" | "purple";
export type BseToken = `${DirectionRelation}_${TokenColor}`;

export interface Point {
  x: number;
  y: number;
}

export interface DeviceReadiness {
  refreshRateHz: number;
  medianFrameMs: number;
  frameMadMs: number;
  droppedFrameRate: number;
  inputLatencyMs: number | null;
  arrowRenderOk: boolean;
  flowRenderOk: boolean;
  quality: TimingQuality;
  flowEligible: boolean;
  sampledFrames: number;
  checkedAt: string;
  browserDeviceId?: string;
}

export interface TrialCondition {
  ratio: Ratio;
  exposureMs: number;
  nLevel?: number;
}

export interface StimulusItem {
  positionIndex: number;
  position: Point;
  relation: DirectionRelation;
  color?: TokenColor;
  vector: Point;
}

export interface TrialDefinition {
  id: string;
  sessionId: string;
  miniBlockId: string;
  trialIndex: number;
  construct: Construct;
  phase: PhaseLabel;
  cellKey: CellKey;
  transitionKey: TransitionKey | null;
  isReferenceRecheck: boolean;
  ratio: Ratio;
  exposureMsRequested: number;
  majorityCount: 3 | 4 | 5;
  responseOptions: string[];
  correctResponse: string | null;
  items: StimulusItem[];
  seed: string;
  appId: "wm-coach";
  layer: Layer;
  publicLabel: PublicLabel;
  technicalLabel: TechnicalLabel;
  stimulusCarrier: StimulusCarrier;
  frame: CanonicalFrame;
  relationFamily: RelationFamily;
  relation: CanonicalRelation;
  colour: TokenColor | null;
  wrapperId: string;
  nLevel: number;
  activeRelationSetSize: number;
  activeRelationsJson: CanonicalRelation[];
  lureType: string | null;
  confidenceLabel: ConfidenceLabel;
  modelVersion: string;
  isWarmup: boolean;
  isMatch: boolean;
  targetTrialId: string | null;
}

export interface TrialResult {
  trial: TrialDefinition;
  response: string | null;
  isCorrect: boolean;
  rtMs: number | null;
  exposureMsActual: number;
  actualStimulusFrames: number;
  deviceRefreshRateEstimate: number;
  droppedFrameCount: number;
  timingQuality: TimingQuality;
}

export interface MiniBlockPlan {
  id: string;
  index: number;
  construct: Construct;
  label: string;
  instruction: string;
  cells: CellKey[];
  trialCount: number;
  currentTrials: number;
  referenceTrials: number;
  wrapperId: string;
  nLevel: number;
  layer: Layer;
}

export interface SessionPlan {
  sessionId: string;
  sessionNumber: number;
  phase: PhaseLabel;
  phaseStatus: PhaseStatus;
  nominalBand: string | null;
  miniBlocks: MiniBlockPlan[];
  trials: TrialDefinition[];
}

export interface ScorePanel {
  bitsPerSec: number | null;
  trainingScore: number | null;
  nLevel: number | null;
  stableNLevel: number | null;
  peakNLevel: number | null;
  confidence: ConfidenceLabel;
  trend: TrendLabel;
}

export interface TransferComponent {
  score: number | null;
  status: "calibrating" | "available" | "coming_up" | "not_enough_evidence";
  label: string;
  confidence: ConfidenceLabel;
}

export interface FarTransferWindow {
  modelVersion: string;
  sessionNumber: number;
  construct: Construct;
  cellKey: CellKey;
  phase: PhaseLabel;
  transitionKey: TransitionKey | null;
  validTrials: number;
  capacityBps: number | null;
  balancedAccuracy: number;
  lapseRate: number;
  timingPenalty: number;
  rtMedianMs: number | null;
  rtIqrMs: number | null;
  conditionEntropyBits: number;
  conditionEntropyRatio: number;
  updateMagnitude: number | null;
  mutualInfoProxy: number | null;
  nLevel: number | null;
  falseAlarmRate: number;
  missRate: number;
  lureErrorRate: number;
}

export interface ScratchBaseline {
  modelVersion: string;
  source: ScratchBaselineSource;
  construct: Construct;
  targetCell: CellKey;
  protocolGroup?: ProtocolGroup;
  deviceTier?: string;
  ageBand?: string;
  cohortN?: number;
  tau90Windows: number | null;
  asymptoticCapacityBps: number | null;
  asymptoticMiProxy: number | null;
  stabilityCv: number | null;
  timingPenaltyMedian: number | null;
  confidence: ConfidenceLabel;
}

export interface FarTransferBoundarySignal {
  boundary: TransitionKey;
  status: "not_reached" | "calibrating" | "available";
  sourceCell: CellKey;
  targetCell: CellKey;
  sourceCapacityBps: number | null;
  targetCapacityBps: number | null;
  recoveryRatio: number | null;
  entropySupport: number | null;
  mutualInfoProxy: number | null;
  scratchBaselineSource: ScratchBaselineSource;
  scratchBaseline: ScratchBaseline | null;
  tau90TransferWindows: number | null;
  transferEfficiency: number | null;
  stabilityAdvantage: number | null;
  functionalTransferScore: number | null;
}

export interface FarTransferEvidence {
  modelVersion: string;
  caveat: "functional_proxy_not_zhang_tang";
  summary: string;
  protocolGroup: ProtocolGroup;
  windows: FarTransferWindow[];
  boundarySignals: FarTransferBoundarySignal[];
}

export interface WorkingMemoryScoreSnapshot {
  sessionNumber: number;
  activePhase: PhaseLabel;
  phaseStatus: PhaseStatus;
  nominalBand: string | null;
  workingMemoryControl: ScorePanel;
  bindingFocus: ScorePanel & {
    lagFlag?: "on_track" | "lagging" | "insufficient_data";
  };
  transfer: {
    score: number | null;
    status: "calibrating" | "developing" | "strong" | "not_enough_evidence";
    motionRecovery: TransferComponent;
    relationRecovery: TransferComponent;
    mixedFlexibility: TransferComponent;
    returnStrength: TransferComponent;
  };
  nextChallenge: {
    label: string;
    state: "current_phase" | "coming_up" | "ready_next_session" | "not_enough_evidence";
  };
  farTransfer?: FarTransferEvidence;
}

export interface CellEvidence {
  construct: Construct;
  cellKey: CellKey;
  validTrials: number;
  rollingWindowCount: number;
  recentCapacitySlope: number;
  balancedAccuracy: number;
  lapseRate: number;
  timingQuality: TimingQuality;
  localAsymptoteBps: number | null;
  currentCapacityBps: number | null;
  currentNLevel: number | null;
  stableNLevel: number | null;
  peakNLevel: number | null;
  falseAlarmRate: number;
  missRate: number;
  lureErrorRate: number;
  medianRtMs: number | null;
}

export interface WapUserState {
  currentPhase: PhaseLabel;
  sessionNumber: number;
  phaseStatus: PhaseStatus;
  protocolGroup?: ProtocolGroup;
  completedTransitions: TransitionKey[];
  evidence: CellEvidence[];
  hasGlobalFatigueFlag?: boolean;
  hasTimingLimitedFlag?: boolean;
}

export interface WapDecision {
  fromPhase: PhaseLabel;
  toPhase: PhaseLabel;
  phaseStatus: PhaseStatus;
  shouldTransition: boolean;
  transitionKey: TransitionKey | null;
  reason: string;
  readiness: {
    minimumTrials: boolean;
    enoughWindows: boolean;
    slopeStable: boolean;
    accuracyInBand: boolean;
    lapseStable: boolean;
    timingAcceptable: boolean;
    noGlobalBlocker: boolean;
  };
}
