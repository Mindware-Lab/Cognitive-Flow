export type SrStateId = "expansion" | "rotation" | "diagonal_contraction" | "contraction";
export type SrEventType = "stream" | "break";
export type SrResponse = "left" | "right" | "break" | "none";

export interface OpticFlowState {
  id: SrStateId;
  label: string;
}

export interface SrEvent {
  id: string;
  index: number;
  eventType: SrEventType;
  currentStateId: SrStateId;
  nextStateId?: SrStateId;
  candidateLeftId?: SrStateId;
  candidateRightId?: SrStateId;
  correctResponse: SrResponse;
  roleSource?: "A" | "D";
}

export interface SrOutcome {
  event: SrEvent;
  response: SrResponse;
  correct: boolean | null;
  rtMs: number | null;
}

export interface SrMetrics {
  immediateAccuracy: number;
  lookaheadAccuracy: number;
  breakDetectionRate: number;
  falseAlarmRate: number;
  lureResistance: number;
  identityRoleTransfer: number;
  meanProbeRt: number | null;
  meanBreakRt: number | null;
  srHorizonScore: 0 | 1 | 2;
  pathPredictionReadiness: number;
}

export const OPTIC_FLOW_STATES: Record<SrStateId, OpticFlowState> = {
  expansion: { id: "expansion", label: "Expansion" },
  rotation: { id: "rotation", label: "Rotation" },
  diagonal_contraction: {
    id: "diagonal_contraction",
    label: "Diagonal contraction",
  },
  contraction: { id: "contraction", label: "Contraction" },
};

const NORMAL_CYCLE: readonly SrStateId[] = [
  "expansion",
  "rotation",
  "diagonal_contraction",
];

export const SR_EVENT_COUNT = 21;

export function generateSrBlock(_seed: string): SrEvent[] {
  const sequence: SrStateId[] = [
    ...NORMAL_CYCLE,
    ...NORMAL_CYCLE,
    ...NORMAL_CYCLE,
    "contraction",
    "rotation",
    "diagonal_contraction",
    ...NORMAL_CYCLE,
    ...NORMAL_CYCLE,
    ...NORMAL_CYCLE,
  ];

  return sequence.map((stateId, index) => {
    const isWrongStart = index === 9;
    return {
      id: `optic-flow-${index}`,
      index,
      eventType: isWrongStart ? "break" : "stream",
      currentStateId: stateId,
      correctResponse: isWrongStart ? "break" : "none",
    };
  });
}

function meanRt(outcomes: readonly SrOutcome[]): number | null {
  const values = outcomes
    .map((outcome) => outcome.rtMs)
    .filter((value): value is number => value !== null);
  return values.length
    ? values.reduce((total, value) => total + value, 0) / values.length
    : null;
}

export function scoreSrBlock(outcomes: readonly SrOutcome[]): SrMetrics {
  const breaks = outcomes.filter((outcome) => outcome.event.eventType === "break");
  const streams = outcomes.filter((outcome) => outcome.event.eventType === "stream");
  const breakDetectionRate = breaks.length
    ? breaks.filter((outcome) => outcome.response === "break").length / breaks.length
    : 0;
  const falseAlarmRate = streams.length
    ? streams.filter((outcome) => outcome.response === "break").length / streams.length
    : 0;
  const readiness = Math.max(0, breakDetectionRate - falseAlarmRate);

  return {
    immediateAccuracy: breakDetectionRate,
    lookaheadAccuracy: breakDetectionRate,
    breakDetectionRate,
    falseAlarmRate,
    lureResistance: 1 - falseAlarmRate,
    identityRoleTransfer: 1,
    meanProbeRt: null,
    meanBreakRt: meanRt(breaks.filter((outcome) => outcome.response === "break")),
    srHorizonScore: breakDetectionRate >= 0.5 ? 1 : 0,
    pathPredictionReadiness: Math.round(readiness * 100),
  };
}
