import { PHASE_CELL, PHASE_ORDER_BY_GROUP, TARGET_ENVELOPE_SESSIONS, transitionEventsForPhaseAdvance } from "./protocol";
import type { CellEvidence, PhaseLabel, PhaseStatus, WapDecision, WapUserState } from "./types";

const MIN_VALID_TRIALS = 240;
const MIN_WINDOWS = 4;
const MAX_ABS_SLOPE = 0.02;
const MIN_BALANCED_ACCURACY = 0.7;
const MAX_BALANCED_ACCURACY = 0.82;
const MAX_STABLE_LAPSE = 0.18;

function evidenceFor(state: WapUserState, cellKey: string): CellEvidence | null {
  return state.evidence.find((item) => item.construct === "ACC" && item.cellKey === cellKey) || null;
}

function readiness(evidence: CellEvidence | null, state: WapUserState) {
  const minimumTrials = Boolean(evidence && evidence.validTrials >= MIN_VALID_TRIALS);
  const enoughWindows = Boolean(evidence && evidence.rollingWindowCount >= MIN_WINDOWS);
  const slopeStable = Boolean(evidence && Math.abs(evidence.recentCapacitySlope) < MAX_ABS_SLOPE);
  const accuracyInBand = Boolean(
    evidence &&
      evidence.balancedAccuracy >= MIN_BALANCED_ACCURACY &&
      evidence.balancedAccuracy <= MAX_BALANCED_ACCURACY,
  );
  const lapseStable = Boolean(evidence && evidence.lapseRate <= MAX_STABLE_LAPSE);
  const timingAcceptable = Boolean(evidence && evidence.timingQuality !== "poor");
  const noGlobalBlocker = !state.hasGlobalFatigueFlag && !state.hasTimingLimitedFlag;
  return {
    minimumTrials,
    enoughWindows,
    slopeStable,
    accuracyInBand,
    lapseStable,
    timingAcceptable,
    noGlobalBlocker,
  };
}

function allReady(flags: ReturnType<typeof readiness>): boolean {
  return Object.values(flags).every(Boolean);
}

function recoveryReady(evidence: CellEvidence | null, state: WapUserState): ReturnType<typeof readiness> {
  const flags = readiness(evidence, state);
  const recoveredToLocalAsymptote = Boolean(
    evidence &&
      evidence.localAsymptoteBps &&
      evidence.currentCapacityBps &&
      evidence.currentCapacityBps >= evidence.localAsymptoteBps * 0.9,
  );
  return { ...flags, slopeStable: flags.slopeStable || recoveredToLocalAsymptote };
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
  const flags =
    phase === "P2_FLOW_ABS" || phase === "P4_FLOW_REL" || phase === "P2_ARROW_ABS" || phase === "P4_ARROW_REL"
      ? recoveryReady(evidence, state)
      : readiness(evidence, state);

  if (phase === "P6_DELAYED") {
    return {
      fromPhase: phase,
      toPhase: phase,
      phaseStatus: "completed",
      shouldTransition: false,
      transitionKey: null,
      reason: "Delayed re-check is the final WAP phase.",
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
        reason: "Mixed stability evidence is sufficient for return check.",
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
      reason: "ACC learning curve meets WAP readiness criteria.",
      readiness: flags,
    };
  }

  return {
    fromPhase: phase,
    toPhase: phase,
    phaseStatus: statusForStay(state, flags),
    shouldTransition: false,
    transitionKey: null,
    reason: "Continue current phase until the ACC learning curve is stable enough.",
    readiness: flags,
  };
}
