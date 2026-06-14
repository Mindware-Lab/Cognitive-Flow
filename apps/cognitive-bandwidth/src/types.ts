export type WrapperId = "abs_lr" | "rel_inout";
export type Category = "left" | "right" | "out" | "in";
export type Ratio = "5:0" | "4:1" | "3:2";
export type TimingQuality = "Good" | "Acceptable" | "Limited";

export interface Point {
  x: number;
  y: number;
}

export interface StimulusItem {
  positionIndex: number;
  position: Point;
  vector: Point;
  category: Category;
}

export interface TrialCondition {
  ratio: Ratio;
  exposureMs: number;
}

export interface TrialDefinition extends TrialCondition {
  id: string;
  wrapperId: WrapperId;
  majorityCount: 3 | 4 | 5;
  majorityCategory: Category;
  correctResponse: Category;
  items: StimulusItem[];
  seedIndex: number;
  practice: boolean;
}

export interface TrialResult {
  trial: TrialDefinition;
  response: Category | null;
  isCorrect: boolean;
  rtMs: number | null;
  exposureMsActual: number;
  frameCountExpected: number;
  frameCountObserved: number;
  timingContaminated: boolean;
}

export interface TimingCheck {
  refreshRateHz: number;
  medianFrameMs: number;
  frameMadMs: number;
  droppedFrameRate: number;
  quality: TimingQuality;
  sampledFrames: number;
}

export interface CapacityEstimate {
  capacityBps: number;
  logLikelihood: number;
  validTrials: number;
  accuracy: number;
  intervalLow: number;
  intervalHigh: number;
  intervalWidth: number;
  reliability: "Illustrative only" | "Still calibrating";
}

export interface StoredPrototypeRun {
  id: string;
  completedAt: string;
  timing: TimingCheck;
  direction: CapacityEstimate;
  frame: CapacityEstimate;
  frameCost: number;
  consentedTelemetry: boolean;
}
