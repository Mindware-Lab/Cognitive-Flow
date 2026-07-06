import type { CellKey, PhaseLabel, PhaseStatus, ProtocolGroup, TransitionKey, TransitionType } from "./types";

export const PROTOCOL_VERSION = "wm-coach-wap-v0.1";
export const SESSION_TRIAL_COUNT = 88;
export const MINI_BLOCK_COUNT = 4;
export const MINI_BLOCK_TRIALS = 22;
export const ACC_TRIALS_PER_SESSION = 66;
export const BSE_TRIALS_PER_SESSION = 22;
export const TARGET_ENVELOPE_SESSIONS = 20;

export const PHASE_ORDER: PhaseLabel[] = [
  "P1_ARROW_ABS",
  "P2_FLOW_ABS",
  "P3_ARROW_REL",
  "P4_FLOW_REL",
  "P5_ARROW_MIXED",
  "P6_FLOW_MIXED",
  "P7_FULL_MIXED",
  "P8_BIND_ARROW_REL",
  "P9_BIND_FLOW_REL",
  "P10_BIND_MIXED",
  "P11_DELAYED",
];

export const FLOW_FIRST_PHASE_ORDER: PhaseLabel[] = [
  "P1_FLOW_ABS",
  "P2_ARROW_ABS",
  "P3_FLOW_REL",
  "P4_ARROW_REL",
  "P5_FLOW_MIXED",
  "P6_ARROW_MIXED",
  "P7_FULL_MIXED",
  "P8_BIND_FLOW_REL",
  "P9_BIND_ARROW_REL",
  "P10_BIND_MIXED",
  "P11_DELAYED",
];

export const PHASE_ORDER_BY_GROUP: Record<ProtocolGroup, PhaseLabel[]> = {
  commercial_arrows_first: PHASE_ORDER,
  validation_arrows_first: PHASE_ORDER,
  validation_flow_first: FLOW_FIRST_PHASE_ORDER,
};

export const PHASE_CELL: Record<PhaseLabel, CellKey> = {
  P1_ARROW_ABS: "arrow_abs",
  P2_FLOW_ABS: "flow_abs",
  P3_ARROW_REL: "arrow_rel",
  P4_FLOW_REL: "flow_rel",
  P1_FLOW_ABS: "flow_abs",
  P2_ARROW_ABS: "arrow_abs",
  P3_FLOW_REL: "flow_rel",
  P4_ARROW_REL: "arrow_rel",
  P5_ARROW_MIXED: "mixed",
  P6_FLOW_MIXED: "mixed",
  P5_FLOW_MIXED: "mixed",
  P6_ARROW_MIXED: "mixed",
  P7_FULL_MIXED: "mixed",
  P8_BIND_ARROW_REL: "arrow_rel",
  P9_BIND_FLOW_REL: "flow_rel",
  P8_BIND_FLOW_REL: "flow_rel",
  P9_BIND_ARROW_REL: "arrow_rel",
  P10_BIND_MIXED: "mixed",
  P11_DELAYED: "mixed",
  P5_MIXED: "mixed",
  P6_DELAYED: "mixed",
};

export const PHASE_NAMES: Record<PhaseLabel, string> = {
  P1_ARROW_ABS: "Arrow N-back",
  P2_FLOW_ABS: "Flow N-back",
  P3_ARROW_REL: "Relational Arrow N-back",
  P4_FLOW_REL: "Relational Flow N-back",
  P1_FLOW_ABS: "Flow N-back",
  P2_ARROW_ABS: "Arrow N-back",
  P3_FLOW_REL: "Relational Flow N-back",
  P4_ARROW_REL: "Relational Arrow N-back",
  P5_ARROW_MIXED: "Mixed Arrow Frames",
  P6_FLOW_MIXED: "Mixed Flow Frames",
  P5_FLOW_MIXED: "Mixed Flow Frames",
  P6_ARROW_MIXED: "Mixed Arrow Frames",
  P7_FULL_MIXED: "Full Mixed N-back",
  P8_BIND_ARROW_REL: "Binding Arrow Relations",
  P9_BIND_FLOW_REL: "Binding Flow Relations",
  P8_BIND_FLOW_REL: "Binding Flow Relations",
  P9_BIND_ARROW_REL: "Binding Arrow Relations",
  P10_BIND_MIXED: "Mixed Binding N-back",
  P11_DELAYED: "Return Check",
  P5_MIXED: "Mixed N-back",
  P6_DELAYED: "Return Check",
};

export const PHASE_INSTRUCTIONS: Record<PhaseLabel, string> = {
  P1_ARROW_ABS: "Build your working-memory baseline with static direction n-back.",
  P2_FLOW_ABS: "Use the same n-back rule with moving optic-flow patterns.",
  P3_ARROW_REL: "Now track relationships to the centre, not only screen direction.",
  P4_FLOW_REL: "Apply relational n-back to moving radial, tangential and spiral patterns.",
  P1_FLOW_ABS: "Build your working-memory baseline with moving patterns.",
  P2_ARROW_ABS: "Use the same n-back rule with static arrows.",
  P3_FLOW_REL: "Now track motion relationships to the centre.",
  P4_ARROW_REL: "Apply relational n-back to static arrows.",
  P5_ARROW_MIXED: "Static arrows now switch between absolute and relative frames.",
  P6_FLOW_MIXED: "Optic-flow patterns now switch between absolute and relative frames.",
  P5_FLOW_MIXED: "Optic-flow patterns now switch between absolute and relative frames.",
  P6_ARROW_MIXED: "Static arrows now switch between absolute and relative frames.",
  P7_FULL_MIXED: "Arrows, optic flow, absolute frames and relative frames now alternate.",
  P8_BIND_ARROW_REL: "Bind relative arrow relations with colour conjunctions.",
  P9_BIND_FLOW_REL: "Bind relative optic-flow relations with colour conjunctions.",
  P8_BIND_FLOW_REL: "Bind relative optic-flow relations with colour conjunctions.",
  P9_BIND_ARROW_REL: "Bind relative arrow relations with colour conjunctions.",
  P10_BIND_MIXED: "Keep relation and colour bound while frame and carrier demands switch.",
  P11_DELAYED: "This re-check shows what returns after spacing.",
  P5_MIXED: "Carriers, frames and relation families now switch across blocks.",
  P6_DELAYED: "This re-check shows what returns after spacing.",
};

export const NOMINAL_BANDS: Record<PhaseLabel, string> = {
  P1_ARROW_ABS: "roughly sessions 1-5",
  P2_FLOW_ABS: "roughly sessions 6-8",
  P3_ARROW_REL: "roughly sessions 9-12",
  P4_FLOW_REL: "roughly sessions 13-15",
  P1_FLOW_ABS: "roughly sessions 1-5",
  P2_ARROW_ABS: "roughly sessions 6-8",
  P3_FLOW_REL: "roughly sessions 9-12",
  P4_ARROW_REL: "roughly sessions 13-15",
  P5_ARROW_MIXED: "roughly sessions 16-17",
  P6_FLOW_MIXED: "roughly sessions 18-19",
  P5_FLOW_MIXED: "roughly sessions 16-17",
  P6_ARROW_MIXED: "roughly sessions 18-19",
  P7_FULL_MIXED: "roughly sessions 20-21",
  P8_BIND_ARROW_REL: "roughly sessions 22-23",
  P9_BIND_FLOW_REL: "roughly sessions 24-25",
  P8_BIND_FLOW_REL: "roughly sessions 22-23",
  P9_BIND_ARROW_REL: "roughly sessions 24-25",
  P10_BIND_MIXED: "roughly sessions 26-27",
  P11_DELAYED: "roughly sessions 28+",
  P5_MIXED: "roughly sessions 16-18",
  P6_DELAYED: "roughly sessions 19-20+",
};

export const TRANSITIONS: Record<
  TransitionKey,
  { from: CellKey; to: CellKey; type: TransitionType; isCrossModalTransferBoundary: boolean; isValidationBoundary: boolean }
> = {
  T_CM_BASE: { from: "arrow_abs", to: "flow_abs", type: "carrier_swap", isCrossModalTransferBoundary: true, isValidationBoundary: false },
  T_FRAME_ARROW: { from: "arrow_abs", to: "arrow_rel", type: "frame_ramp", isCrossModalTransferBoundary: false, isValidationBoundary: true },
  T_FRAME_FLOW: { from: "flow_abs", to: "flow_rel", type: "frame_ramp", isCrossModalTransferBoundary: false, isValidationBoundary: true },
  T_CM_REL: { from: "arrow_rel", to: "flow_rel", type: "carrier_swap", isCrossModalTransferBoundary: true, isValidationBoundary: false },
  T_MIXED: { from: "flow_rel", to: "mixed", type: "mixed_switch", isCrossModalTransferBoundary: false, isValidationBoundary: false },
  T_DELAYED: { from: "mixed", to: "mixed", type: "delayed_recheck", isCrossModalTransferBoundary: false, isValidationBoundary: false },
};

export function transitionEventsForPhaseAdvance(fromPhase: PhaseLabel, toPhase: PhaseLabel): TransitionKey[] {
  if (fromPhase === "P1_ARROW_ABS" && toPhase === "P2_FLOW_ABS") return ["T_CM_BASE"];
  if (fromPhase === "P2_FLOW_ABS" && toPhase === "P3_ARROW_REL") return ["T_FRAME_ARROW"];
  if (fromPhase === "P3_ARROW_REL" && toPhase === "P4_FLOW_REL") return ["T_CM_REL", "T_FRAME_FLOW"];
  if (fromPhase === "P4_FLOW_REL" && toPhase === "P5_ARROW_MIXED") return ["T_MIXED"];
  if (fromPhase === "P5_ARROW_MIXED" && toPhase === "P6_FLOW_MIXED") return ["T_MIXED"];
  if (fromPhase === "P6_FLOW_MIXED" && toPhase === "P7_FULL_MIXED") return ["T_MIXED"];
  if (fromPhase === "P7_FULL_MIXED" && toPhase === "P8_BIND_ARROW_REL") return ["T_MIXED"];
  if (fromPhase === "P8_BIND_ARROW_REL" && toPhase === "P9_BIND_FLOW_REL") return ["T_CM_REL"];
  if (fromPhase === "P9_BIND_FLOW_REL" && toPhase === "P10_BIND_MIXED") return ["T_MIXED"];
  if (fromPhase === "P10_BIND_MIXED" && toPhase === "P11_DELAYED") return ["T_DELAYED"];
  if (fromPhase === "P4_FLOW_REL" && toPhase === "P5_MIXED") return ["T_MIXED"];
  if (fromPhase === "P1_FLOW_ABS" && toPhase === "P2_ARROW_ABS") return ["T_CM_BASE"];
  if (fromPhase === "P2_ARROW_ABS" && toPhase === "P3_FLOW_REL") return ["T_FRAME_FLOW"];
  if (fromPhase === "P3_FLOW_REL" && toPhase === "P4_ARROW_REL") return ["T_CM_REL", "T_FRAME_ARROW"];
  if (fromPhase === "P4_ARROW_REL" && toPhase === "P5_FLOW_MIXED") return ["T_MIXED"];
  if (fromPhase === "P5_FLOW_MIXED" && toPhase === "P6_ARROW_MIXED") return ["T_MIXED"];
  if (fromPhase === "P6_ARROW_MIXED" && toPhase === "P7_FULL_MIXED") return ["T_MIXED"];
  if (fromPhase === "P7_FULL_MIXED" && toPhase === "P8_BIND_FLOW_REL") return ["T_MIXED"];
  if (fromPhase === "P8_BIND_FLOW_REL" && toPhase === "P9_BIND_ARROW_REL") return ["T_CM_REL"];
  if (fromPhase === "P9_BIND_ARROW_REL" && toPhase === "P10_BIND_MIXED") return ["T_MIXED"];
  if (fromPhase === "P4_ARROW_REL" && toPhase === "P5_MIXED") return ["T_MIXED"];
  if (fromPhase === "P5_MIXED" && toPhase === "P6_DELAYED") return ["T_DELAYED"];
  return [];
}

export function phaseStatusForPhase(phase: PhaseLabel): PhaseStatus {
  if (phase === "P5_ARROW_MIXED" || phase === "P6_FLOW_MIXED" || phase === "P5_FLOW_MIXED" || phase === "P6_ARROW_MIXED" || phase === "P7_FULL_MIXED" || phase === "P10_BIND_MIXED" || phase === "P5_MIXED") return "mixed";
  if (phase === "P11_DELAYED" || phase === "P6_DELAYED") return "delayed";
  return "active";
}
