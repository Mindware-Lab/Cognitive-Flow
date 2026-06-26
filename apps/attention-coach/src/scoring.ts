import { PHASE_NAMES, TARGET_ENVELOPE_SESSIONS } from "./protocol";
import type {
  AttentionScoreSnapshot,
  CellEvidence,
  ConfidenceLabel,
  PhaseLabel,
  PhaseStatus,
  ScorePanel,
  TransferComponent,
  TransitionKey,
  TrendLabel,
} from "./types";

function confidenceFor(evidence: CellEvidence | null): ConfidenceLabel {
  if (!evidence || evidence.validTrials < 80) return "insufficient_data";
  if (evidence.timingQuality === "poor") return "timing_limited";
  if (evidence.validTrials < 240) return "calibrating";
  if (Math.abs(evidence.recentCapacitySlope) > 0.08) return "unstable_estimate";
  return evidence.validTrials >= 360 ? "high_confidence" : "moderate_confidence";
}

function trendFor(evidence: CellEvidence | null): TrendLabel {
  if (!evidence || evidence.validTrials < 80) return "needs_more_data";
  if (Math.abs(evidence.recentCapacitySlope) <= 0.01) return "steady";
  if (evidence.recentCapacitySlope > 0.01) return "improving";
  if (Math.abs(evidence.recentCapacitySlope) > 0.08) return "variable_today";
  return "developing";
}

function trainingScore(bitsPerSec: number | null): number | null {
  if (bitsPerSec === null) return null;
  return Math.round(85 + bitsPerSec * 5);
}

function panel(evidence: CellEvidence | null): ScorePanel {
  const bitsPerSec = evidence?.currentCapacityBps ?? null;
  return {
    bitsPerSec,
    trainingScore: trainingScore(bitsPerSec),
    confidence: confidenceFor(evidence),
    trend: trendFor(evidence),
  };
}

function component(
  label: string,
  transition: TransitionKey,
  completedTransitions: readonly TransitionKey[],
  score: number | null,
): TransferComponent {
  if (!completedTransitions.includes(transition)) {
    return {
      score: null,
      status: "coming_up",
      label,
      confidence: "insufficient_data",
    };
  }
  if (score === null) {
    return {
      score: null,
      status: "calibrating",
      label,
      confidence: "calibrating",
    };
  }
  return {
    score,
    status: "available",
    label,
    confidence: score >= 75 ? "moderate_confidence" : "calibrating",
  };
}

export function createScoreSnapshot(input: {
  sessionNumber: number;
  activePhase: PhaseLabel;
  phaseStatus: PhaseStatus;
  nominalBand: string | null;
  evidence: CellEvidence[];
  completedTransitions: TransitionKey[];
}): AttentionScoreSnapshot {
  const activeAcc =
    input.evidence.find((item) => item.construct === "ACC" && item.currentCapacityBps !== null) || null;
  const activeBse =
    input.evidence.find((item) => item.construct === "BSE" && item.currentCapacityBps !== null) || null;
  const motion = component("Motion Recovery", "T_CM_BASE", input.completedTransitions, null);
  const relation = component("Relation Recovery", "T_CM_REL", input.completedTransitions, null);
  const mixed = component("Mixed Flexibility", "T_MIXED", input.completedTransitions, null);
  const delayed = component("Return Strength", "T_DELAYED", input.completedTransitions, null);
  const availableScores = [motion, relation, mixed, delayed].filter((item) => item.status === "available");
  const transferScore =
    availableScores.length > 0
      ? Math.round(
          availableScores.reduce((total, item) => total + (item.score || 65), 0) / availableScores.length,
        )
      : null;
  const status =
    transferScore === null
      ? input.sessionNumber >= TARGET_ENVELOPE_SESSIONS
        ? "not_enough_evidence"
        : "calibrating"
      : transferScore >= 80
        ? "strong"
        : "developing";
  return {
    sessionNumber: input.sessionNumber,
    activePhase: input.activePhase,
    phaseStatus: input.phaseStatus,
    nominalBand: input.nominalBand,
    attentionControl: panel(activeAcc),
    bindingFocus: {
      ...panel(activeBse),
      lagFlag:
        !activeBse || activeBse.validTrials < 80
          ? "insufficient_data"
          : activeBse.validTrials < (activeAcc?.validTrials || 0) / 2
            ? "lagging"
            : "on_track",
    },
    transfer: {
      score: transferScore,
      status,
      motionRecovery: motion,
      relationRecovery: relation,
      mixedFlexibility: mixed,
      returnStrength: delayed,
    },
    nextChallenge: {
      label: PHASE_NAMES[input.activePhase],
      state:
        input.phaseStatus === "ready_to_swap"
          ? "ready_next_session"
          : input.phaseStatus === "extended_for_learning_curve"
            ? "not_enough_evidence"
            : "current_phase",
    },
  };
}
