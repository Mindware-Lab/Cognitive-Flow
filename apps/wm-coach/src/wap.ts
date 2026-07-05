import { PHASE_CELL, PHASE_ORDER_BY_GROUP, TARGET_ENVELOPE_SESSIONS, transitionEventsForPhaseAdvance } from "./protocol";
import type { CellEvidence, PhaseLabel, PhaseStatus, WapDecision, WapUserState } from "./types";

const MIN_VALID_TRIALS = 80;
const MIN_WINDOWS = 3;
const MAX_ABS_SLOPE = 1;
const MIN_BALANCED_ACCURACY = 0.75;
const MAX_BALANCED_ACCURACY = 0.98;
const MAX_FALSE_ALARM_RATE = 0.25;
const MAX_MISS_RATE = 0.3;

function evidenceFor(state: WapUserState, cellKey: string): CellEvidence | null {
  if (cellKey === "mixed") {
    const candidates = state.evidence.filter((item) => item.construct === "ACC");
    return candidates.sort((a, b) => (b.validTrials || 0) - (a.validTrials || 0))[0] || null;
  }
  return state.evidence.find((item) => item.construct === "ACC" && item.cellKey === cellKey) || null;
}

function readiness(evidence: CellEvidence | null, state: WapUserState) {
  const minimumTrials = Boolean(evidence && evidence.validTrials >= MIN_VALID_TRIALS);
  const enoughWindows = Boolean(evidence && evidence.rollingWindowCount >= MIN_WINDOWS);
  const slopeStable = Boolean(evidence && Math.abs(evidence.recentCapacitySlope) <= MAX_ABS_SLOPE);
  const accuracyInBand = Boolean(
    evidence && evidence.balancedAccuracy >= MIN_BALANCED_ACCURACY && evidence.balancedAccuracy <= MAX_BALANCED_ACCURACY,
  );
  const lapseStable = Boolean(evidence && evidence.falseAlarmRate <= MAX_FALSE_ALARM_RATE && evidence.missRate <= MAX_MISS_RATE);
  const timingAcceptable = Boolean(evidence && evidence.timingQuality !== "poor");
  const noGlobalBlocker = !state.hasGlobalFatigueFlag && !state.hasTimingLimitedFlag;
  return { minimumTrials, enoughWindows, slopeStable, accuracyInBand, lapseStable, timingAcceptable, noGlobalBlocker };
}

function allReady(flags: ReturnType<typeof readiness>): boolean {
  return Object.values(flags).every(Boolean);
}

function recoveryReady(evidence: CellEvidence | null, state: WapUserState): ReturnType<typeof readiness> {
  const flags = readiness(evidence, state);
  const recovered = Boolean(
    evidence?.localAsymptoteBps &&
      evidence.currentNLevel &&
      evidence.currentNLevel >= evidence.localAsymptoteBps * 0.9 &&
      evidence.balancedAccuracy >= MIN_BALANCED_ACCURACY,
  );
  return { ...flags, slopeStable: flags.slopeStable || recovered };
}

function nextPhase(phase: PhaseLabel, state: WapUserState): PhaseLabel {
  const order = PHASE_ORDER_BY_GROUP[state.protocolGroup || "commercial_arrows_first"];
  return order[Math.min(order.indexOf(phase) + 1, order.length - 1)] || phase;
}

function statusForStay(state: WapUserState, flags: ReturnType<typeof readiness>): PhaseStatus {
  if (state.sessionNumber > TARGET_ENVELOPE_SESSIONS && !allReady(flags)) return "extended_for_learning_curve";
  if (flags.minimumTrials && flags.enoughWindows && !allReady(flags)) return "flattening";
  return state.phaseStatus;
}

export function chooseNextPhase(state: WapUserState): WapDecision {
  const phase = state.currentPhase;
  const targetPhase = nextPhase(phase, state);
  const cell = PHASE_CELL[phase];
  const evidence = evidenceFor(state, cell);
  const flags = phase === "P2_FLOW_ABS" || phase === "P4_FLOW_REL" || phase === "P2_ARROW_ABS" || phase === "P4_ARROW_REL"
    ? recoveryReady(evidence, state)
    : readiness(evidence, state);

  if (phase === "P6_DELAYED") {
    return {
      fromPhase: phase,
      toPhase: phase,
      phaseStatus: "completed",
      shouldTransition: false,
      transitionKey: null,
      reason: "Delayed re-check is the final WM Coach phase.",
      readiness: flags,
    };
  }

  if (phase === "P5_MIXED") {
    const mixedStable = flags.minimumTrials && flags.enoughWindows && flags.timingAcceptable && flags.noGlobalBlocker;
    if (mixedStable) {
      return {
        fromPhase: phase,
        toPhase: "P6_DELAYED",
        phaseStatus: "ready_to_swap",
        shouldTransition: true,
        transitionKey: "T_DELAYED",
        reason: "Mixed n-back stability is sufficient for delayed re-check.",
        readiness: flags,
      };
    }
  } else if (allReady(flags)) {
    return {
      fromPhase: phase,
      toPhase: targetPhase,
      phaseStatus: "ready_to_swap",
      shouldTransition: true,
      transitionKey: transitionEventsForPhaseAdvance(phase, targetPhase)[0] || null,
      reason: "N-back evidence is stable enough for the next wrapper.",
      readiness: flags,
    };
  }

  return {
    fromPhase: phase,
    toPhase: phase,
    phaseStatus: statusForStay(state, flags),
    shouldTransition: false,
    transitionKey: null,
    reason: "Continue current wrapper until n-back accuracy and stability are clearer.",
    readiness: flags,
  };
}
