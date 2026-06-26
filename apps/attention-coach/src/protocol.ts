import type { CellKey, PhaseLabel, PhaseStatus, TransitionKey, TransitionType } from "./types";

export const PROTOCOL_VERSION = "attention-coach-wap-v0.1";
export const SESSION_TRIAL_COUNT = 80;
export const MINI_BLOCK_COUNT = 4;
export const MINI_BLOCK_TRIALS = 20;
export const ACC_TRIALS_PER_SESSION = 60;
export const BSE_TRIALS_PER_SESSION = 20;
export const TARGET_ENVELOPE_SESSIONS = 20;

export const PHASE_ORDER: PhaseLabel[] = [
  "P1_ARROW_ABS",
  "P2_FLOW_ABS",
  "P3_ARROW_REL",
  "P4_FLOW_REL",
  "P5_MIXED",
  "P6_DELAYED",
];

export const PHASE_CELL: Record<PhaseLabel, CellKey> = {
  P1_ARROW_ABS: "arrow_abs",
  P2_FLOW_ABS: "flow_abs",
  P3_ARROW_REL: "arrow_rel",
  P4_FLOW_REL: "flow_rel",
  P5_MIXED: "mixed",
  P6_DELAYED: "mixed",
};

export const PHASE_NAMES: Record<PhaseLabel, string> = {
  P1_ARROW_ABS: "Direction Foundation",
  P2_FLOW_ABS: "Motion Foundation",
  P3_ARROW_REL: "Relation Foundation",
  P4_FLOW_REL: "Motion Relations",
  P5_MIXED: "Mixed Mastery",
  P6_DELAYED: "Return Check",
};

export const PHASE_INSTRUCTIONS: Record<PhaseLabel, string> = {
  P1_ARROW_ABS: "Build your attention baseline with static direction patterns.",
  P2_FLOW_ABS: "The same skill now appears in moving patterns. A short dip is normal when the format changes.",
  P3_ARROW_REL: "Now the task shifts from simple direction to direction relative to the centre.",
  P4_FLOW_REL: "You will practise recovering relative direction in moving patterns.",
  P5_MIXED: "Formats will now switch unpredictably, so your attention has to stay flexible.",
  P6_DELAYED: "This re-check shows what still carries over after spacing.",
};

export const NOMINAL_BANDS: Record<PhaseLabel, string> = {
  P1_ARROW_ABS: "roughly sessions 1-5",
  P2_FLOW_ABS: "roughly sessions 6-8",
  P3_ARROW_REL: "roughly sessions 9-12",
  P4_FLOW_REL: "roughly sessions 13-15",
  P5_MIXED: "roughly sessions 16-18",
  P6_DELAYED: "roughly sessions 19-20+",
};

export const TRANSITIONS: Record<
  TransitionKey,
  {
    from: CellKey;
    to: CellKey;
    type: TransitionType;
    isCrossModalTransferBoundary: boolean;
    isValidationBoundary: boolean;
  }
> = {
  T_CM_BASE: {
    from: "arrow_abs",
    to: "flow_abs",
    type: "carrier_swap",
    isCrossModalTransferBoundary: true,
    isValidationBoundary: false,
  },
  T_FRAME_ARROW: {
    from: "arrow_abs",
    to: "arrow_rel",
    type: "frame_ramp",
    isCrossModalTransferBoundary: false,
    isValidationBoundary: true,
  },
  T_FRAME_FLOW: {
    from: "flow_abs",
    to: "flow_rel",
    type: "frame_ramp",
    isCrossModalTransferBoundary: false,
    isValidationBoundary: true,
  },
  T_CM_REL: {
    from: "arrow_rel",
    to: "flow_rel",
    type: "carrier_swap",
    isCrossModalTransferBoundary: true,
    isValidationBoundary: false,
  },
  T_MIXED: {
    from: "flow_rel",
    to: "mixed",
    type: "mixed_switch",
    isCrossModalTransferBoundary: false,
    isValidationBoundary: false,
  },
  T_DELAYED: {
    from: "mixed",
    to: "mixed",
    type: "delayed_recheck",
    isCrossModalTransferBoundary: false,
    isValidationBoundary: false,
  },
};

export function transitionEventsForPhaseAdvance(
  fromPhase: PhaseLabel,
  toPhase: PhaseLabel,
): TransitionKey[] {
  if (fromPhase === "P1_ARROW_ABS" && toPhase === "P2_FLOW_ABS") return ["T_CM_BASE"];
  if (fromPhase === "P2_FLOW_ABS" && toPhase === "P3_ARROW_REL") return ["T_FRAME_ARROW"];
  if (fromPhase === "P3_ARROW_REL" && toPhase === "P4_FLOW_REL") return ["T_CM_REL", "T_FRAME_FLOW"];
  if (fromPhase === "P4_FLOW_REL" && toPhase === "P5_MIXED") return ["T_MIXED"];
  if (fromPhase === "P5_MIXED" && toPhase === "P6_DELAYED") return ["T_DELAYED"];
  return [];
}

export function phaseStatusForPhase(phase: PhaseLabel): PhaseStatus {
  if (phase === "P5_MIXED") return "mixed";
  if (phase === "P6_DELAYED") return "delayed";
  return "active";
}
