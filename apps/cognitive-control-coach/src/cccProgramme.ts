import { CCC_DELAYED_RECHECK, CCC_LEARNING_CURVE, CCC_REGIME_PAIRS, CCC_RELATIONAL_WM } from "./cccConfig";
import { hashSeed } from "./random";
import { buildCccSessionMetrics } from "./cccFeedback";
import {
  CCC_ATTENTION_MAX_INFORMATION_THROUGHPUT_BPS,
  attentionLearningStageForBlock,
  cccLearningCurvePointForResults,
  learningCurvePointsForResults,
} from "./cccLearningCurve";
import {
  CCC_WM_MAX_CAPACITY_THROUGHPUT,
  CCC_WM_RELATION_INFORMATION_BITS,
  cccWmCurveIsStable,
  evaluateCccWmPair,
  wmHistoryPoint,
} from "./cccWmProgress";
import type { CccSavedJourney } from "./cccStorage";
import type {
  CccAttentionBlockPlan,
  CccNBackLevel,
  CccProgrammeSessionKind,
  CccProgrammeState,
  CccRecordedTrial,
  CccRegimeId,
} from "./cccTypes";

export const CCC_PROGRAMME_VERSION = 1 as const;
export const CCC_PROGRAMME_GATE_VERSION = "ccc-programme-gates-v0.6";
export const CCC_DELAY_MS = CCC_DELAYED_RECHECK.minimumReentryHours * 60 * 60 * 1000;
export const CCC_MIN_WM_STABILITY_PASSES = 1;
export const CCC_MIN_WM_TRANSFER_PASSES = 1;
export const CCC_MIN_INTEGRATION_CARRIER_POINTS = 3;

const REGIME_IDS: readonly CccRegimeId[] = [
  "clear_sprint",
  "calculated_risk",
  "clean_precision",
  "deep_check",
];

export type CccNextProgrammeAction =
  | { type: "session"; kind: CccProgrammeSessionKind; stage: "P0" | "P1a" | "P1b" | "P1c" }
  | { type: "wait"; availableAt: string }
  | { type: "complete" };

export function createInitialProgrammeState(now = new Date(), programmeRunId: string = crypto.randomUUID()): CccProgrammeState {
  const timestamp = now.toISOString();
  return {
    programmeVersion: CCC_PROGRAMME_VERSION,
    programmeRunId,
    status: "active",
    currentStage: "P0",
    transferStatus: "building",
    sessionNumber: 0,
    attentionSessionCount: 0,
    attentionWrapperStage: "arrow_stabilisation",
    wmLevel: 1,
    wmWrapperStage: "arrow_stabilisation",
    wmPendingPairLevel: null,
    wmPracticeCompletedLevels: [],
    delayedRecheckDueAt: null,
    delayedRecheckWindowEndsAt: null,
    regimeExposure: {
      clear_sprint: 0,
      calculated_risk: 0,
      clean_precision: 0,
      deep_check: 0,
    },
    pairHistory: [],
    evidence: {
      carrierFirstContactObserved: false,
      carrierFirstContactPassed: false,
      carrierFirstContactPerformance: null,
      recoveryPasses: 0,
      returnPasses: 0,
      mixedPasses: 0,
      delayedPasses: 0,
      failedDelayedChecks: 0,
      policyCoverageSessions: 0,
      wmStabilityPasses: 0,
      wmRecoveryPasses: 0,
      wmReturnPasses: 0,
      wmMixedPasses: 0,
      returnToNowPasses: 0,
      integrationPasses: 0,
      integrationCarriers: [],
      finalDelayedPasses: 0,
      failedFinalDelayedChecks: 0,
      attentionLearningCurve: [],
      attentionSourceLearningCurve: [],
      wmLearningCurve: [],
      integrationLearningCurve: [],
    },
    sessions: [],
    proofScores: [],
    createdAt: timestamp,
    updatedAt: timestamp,
    completedAt: null,
  };
}

export function migrateCccProgrammeState(programme: CccProgrammeState): CccProgrammeState {
  const legacy = programme as CccProgrammeState & {
    wmLevel?: number;
    wmWrapperStage?: CccProgrammeState["wmWrapperStage"];
    wmPendingPairLevel?: number | null;
    wmPracticeCompletedLevels?: number[];
    attentionWrapperStage?: CccProgrammeState["attentionWrapperStage"];
  };
  const boundedLevel = (value: number | null | undefined, fallback: CccNBackLevel): CccNBackLevel => {
    if (!Number.isFinite(value)) return fallback;
    return Math.max(1, Math.min(5, Math.round(Number(value)))) as CccNBackLevel;
  };
  programme.wmLevel = boundedLevel(legacy.wmLevel, 1);
  programme.attentionWrapperStage ||= "arrow_stabilisation";
  programme.wmWrapperStage ||= "arrow_stabilisation";
  programme.wmPendingPairLevel = legacy.wmPendingPairLevel === null || legacy.wmPendingPairLevel === undefined
    ? null
    : boundedLevel(legacy.wmPendingPairLevel, programme.wmLevel);
  programme.wmPracticeCompletedLevels = [...new Set((legacy.wmPracticeCompletedLevels || [])
    .filter((value) => Number.isFinite(value))
    .map((value) => boundedLevel(value, 1)))]
    .sort((left, right) => left - right);
  programme.evidence.attentionSourceLearningCurve = (programme.evidence.attentionSourceLearningCurve || [])
    .filter((point) => Number.isFinite(point.informationThroughputBps));
  programme.evidence.attentionLearningCurve = (programme.evidence.attentionLearningCurve
    || programme.evidence.attentionSourceLearningCurve.map((point) => ({
      ...point,
      wrapperStage: point.wrapperStage || "arrow_stabilisation",
    })))
    .filter((point) => Number.isFinite(point.informationThroughputBps));
  programme.evidence.carrierFirstContactPerformance ??= null;
  programme.evidence.wmLearningCurve = (programme.evidence.wmLearningCurve || []).map((point) => {
    const hasRecordedPace = Number.isFinite(point.meanPresentationMs) && Number.isFinite(point.presentationRateHz);
    if (hasRecordedPace && Number.isFinite(point.informationThroughputBps)) return point;
    const meanPresentationMs = hasRecordedPace ? point.meanPresentationMs : CCC_RELATIONAL_WM.defaultPresentationMs;
    const presentationRateHz = hasRecordedPace ? point.presentationRateHz : 1000 / meanPresentationMs;
    const informationThroughputBps = point.capacityIndex
      * CCC_WM_RELATION_INFORMATION_BITS
      * (hasRecordedPace ? 1 : presentationRateHz);
    return {
      ...point,
      meanPresentationMs,
      presentationRateHz,
      informationThroughputBps,
      // Legacy capacity omitted information units and, before v0.13, pace.
      capacityIndex: informationThroughputBps,
    };
  });
  programme.evidence.integrationLearningCurve ||= [];
  programme.proofScores ||= [];
  return programme;
}

export function nextProgrammeAction(programme: CccProgrammeState, now = new Date()): CccNextProgrammeAction {
  if (programme.currentStage === "complete" || programme.status !== "active") return { type: "complete" };
  if (programme.currentStage === "P0") return { type: "session", kind: "p0_foundation", stage: "P0" };
  if (programme.currentStage === "P1a") {
    if (programme.delayedRecheckDueAt) {
      const due = Date.parse(programme.delayedRecheckDueAt);
      if (Number.isFinite(due) && now.getTime() < due) return { type: "wait", availableAt: programme.delayedRecheckDueAt };
      return { type: "session", kind: "p1a_delayed_recheck", stage: "P1a" };
    }
    return { type: "session", kind: "p1a_consolidation", stage: "P1a" };
  }
  if (programme.currentStage === "P1b") return { type: "session", kind: "p1b_wm_bridge", stage: "P1b" };
  if (programme.delayedRecheckDueAt) {
    const due = Date.parse(programme.delayedRecheckDueAt);
    if (Number.isFinite(due) && now.getTime() < due) return { type: "wait", availableAt: programme.delayedRecheckDueAt };
    return { type: "session", kind: "p1c_delayed_integration", stage: "P1c" };
  }
  return { type: "session", kind: "p1c_operator_integration", stage: "P1c" };
}

function pairKey(pair: readonly [CccRegimeId, CccRegimeId]): string {
  return [...pair].sort().join("+");
}

export function selectBalancedRegimePair(
  programme: CccProgrammeState,
  seed: string,
): readonly [CccRegimeId, CccRegimeId] {
  const previous = programme.pairHistory.at(-1) || null;
  const scored = CCC_REGIME_PAIRS.map((pair) => ({
    pair,
    key: pairKey(pair),
    exposure: programme.regimeExposure[pair[0]] + programme.regimeExposure[pair[1]],
  }));
  const withoutRepeat = scored.some((item) => item.key !== previous)
    ? scored.filter((item) => item.key !== previous)
    : scored;
  const minimum = Math.min(...withoutRepeat.map((item) => item.exposure));
  const candidates = withoutRepeat.filter((item) => item.exposure === minimum);
  const chosen = candidates[hashSeed(`${seed}:pair`) % candidates.length].pair;
  return hashSeed(`${seed}:order`) % 2 === 0 ? [chosen[0], chosen[1]] : [chosen[1], chosen[0]];
}

function quotaResults(results: readonly CccRecordedTrial[]): CccRecordedTrial[] {
  return results.filter((result) => result.scoring.countsTowardQuota);
}

function blockResults(journey: CccSavedJourney, block: CccAttentionBlockPlan): CccRecordedTrial[] {
  return quotaResults(journey.blockResults[block.id] || []);
}

function blockForPhase(journey: CccSavedJourney, phases: readonly string[]): CccAttentionBlockPlan | null {
  return journey.plan.blocks.find((block) => phases.includes(block.phase)) || null;
}

function hasBalancedPolicyCoverage(journey: CccSavedJourney): boolean {
  const policyResults = Object.values(journey.blockResults)
    .flat()
    .filter((result) => result.scoring.countsTowardQuota && result.trial.presentationMode === "self_paced_value");
  return journey.plan.regimePair.every((regime) => policyResults.filter((result) => result.trial.regimeId === regime).length >= 6);
}

function scheduleDelayed(state: CccProgrammeState, completedAt: Date): void {
  const lower = new Date(completedAt.getTime() + CCC_DELAY_MS);
  const upper = new Date(completedAt.getTime() + CCC_DELAYED_RECHECK.targetReentryWindowHours[1] * 60 * 60 * 1000);
  state.delayedRecheckDueAt = lower.toISOString();
  state.delayedRecheckWindowEndsAt = upper.toISOString();
}

function mean(values: readonly number[]): number {
  return values.length ? values.reduce((total, value) => total + value, 0) / values.length : 0;
}

function slope(values: readonly number[]): number | null {
  if (values.length < 2) return null;
  const centre = (values.length - 1) / 2;
  const average = mean(values);
  const numerator = values.reduce((total, value, index) => total + (index - centre) * (value - average), 0);
  const denominator = values.reduce((total, _value, index) => total + (index - centre) ** 2, 0);
  return denominator ? numerator / denominator : null;
}

function curveIsFlat(
  values: readonly number[],
  minimumPoints: number,
  recentPoints: number,
  maximumAbsoluteSlope: number,
  maximumRecentRange: number,
): boolean {
  if (values.length < minimumPoints) return false;
  const recent = values.slice(-recentPoints);
  const recentMean = mean(recent);
  const scale = Math.max(0.05, Math.abs(recentMean));
  const rawSlope = slope(recent);
  const recentSlope = rawSlope === null ? null : rawSlope / scale;
  const range = (Math.max(...recent) - Math.min(...recent)) / scale;
  return recentSlope !== null
    && Math.abs(recentSlope) <= maximumAbsoluteSlope
    && range <= maximumRecentRange;
}

function attentionCurveIsStable(
  state: CccProgrammeState,
  stage: NonNullable<CccProgrammeState["evidence"]["attentionLearningCurve"][number]["wrapperStage"]>,
): boolean {
  const values = state.evidence.attentionLearningCurve
    .filter((point) => point.wrapperStage === stage)
    .map((point) => point.performanceIndex);
  return curveIsFlat(
    values,
    CCC_LEARNING_CURVE.minimumBalancedMicrocycles,
    CCC_LEARNING_CURVE.recentWindowMicrocycles,
    CCC_LEARNING_CURVE.maximumAbsoluteSlope,
    CCC_LEARNING_CURVE.maximumRecentRange,
  );
}

function integrationCarrierIsStable(state: CccProgrammeState, carrier: "arrow" | "flow"): boolean {
  const values = state.evidence.integrationLearningCurve
    .filter((point) => point.carrier === carrier)
    .map((point) => point.performanceIndex);
  return curveIsFlat(
    values,
    CCC_MIN_INTEGRATION_CARRIER_POINTS,
    CCC_MIN_INTEGRATION_CARRIER_POINTS,
    CCC_RELATIONAL_WM.learningCurveMaximumAbsoluteSlope,
    CCC_RELATIONAL_WM.learningCurveMaximumRecentRange,
  );
}

function immediateAttentionEvidenceReady(state: CccProgrammeState): boolean {
  return state.evidence.carrierFirstContactObserved
    && attentionCurveIsStable(state, "flow_recovery")
    && attentionCurveIsStable(state, "arrow_return")
    && attentionCurveIsStable(state, "mixed");
}

function supportedUnlockReady(state: CccProgrammeState): boolean {
  return state.evidence.failedDelayedChecks >= CCC_DELAYED_RECHECK.supportedUnlockAfterFailedChecks
    && state.attentionSessionCount >= CCC_DELAYED_RECHECK.supportedUnlockMinimumAttentionSessions;
}

function uniqueCarriers(carriers: CccProgrammeState["evidence"]["integrationCarriers"]): CccProgrammeState["evidence"]["integrationCarriers"] {
  return carriers.filter((carrier, index) => carriers.indexOf(carrier) === index);
}

export function applyCompletedSession(
  current: CccProgrammeState,
  journey: CccSavedJourney,
): { programme: CccProgrammeState; gateDecisions: string[] } {
  if (!journey.completedAt || current.sessions.some((session) => session.sessionId === journey.plan.sessionId)) {
    return { programme: current, gateDecisions: [] };
  }
  const programme = migrateCccProgrammeState(structuredClone(current));
  const decisions: string[] = [];
  const evidence = programme.evidence;
  const completedAt = new Date(journey.completedAt);
  const attentionStageAtStart = programme.attentionWrapperStage;

  programme.sessionNumber += 1;
  if (journey.plan.stage === "P0" || journey.plan.stage === "P1a" || journey.plan.stage === "P1c") {
    programme.attentionSessionCount += 1;
  }
  for (const regime of journey.plan.regimePair) programme.regimeExposure[regime] += 1;
  programme.pairHistory.push(pairKey(journey.plan.regimePair));

  for (const curveBlock of journey.plan.blocks.filter((block) => block.learningCurveGate)) {
    const wrapperStage = attentionLearningStageForBlock(curveBlock);
    if (!wrapperStage) continue;
    const points = learningCurvePointsForResults(curveBlock, blockResults(journey, curveBlock)).map((point) => ({
      ...point,
      sessionId: journey.plan.sessionId,
      wrapperStage,
    }));
    evidence.attentionLearningCurve.push(...points);
    if (wrapperStage === "arrow_stabilisation") evidence.attentionSourceLearningCurve.push(...points);
  }

  const firstContact = blockForPhase(journey, ["flow_rel_first_contact", "p1a_flow_first_contact"]);
  if (firstContact) {
    const results = blockResults(journey, firstContact);
    evidence.carrierFirstContactObserved = results.length >= 6;
    evidence.carrierFirstContactPassed = evidence.carrierFirstContactObserved;
    if (results.length) evidence.carrierFirstContactPerformance = cccLearningCurvePointForResults(1, results).performanceIndex;
  }
  if (attentionCurveIsStable(programme, "flow_recovery")) evidence.recoveryPasses = Math.max(1, evidence.recoveryPasses);
  if (attentionCurveIsStable(programme, "arrow_return")) evidence.returnPasses = Math.max(1, evidence.returnPasses);
  if (attentionCurveIsStable(programme, "mixed")) evidence.mixedPasses = Math.max(1, evidence.mixedPasses);
  if (hasBalancedPolicyCoverage(journey)) evidence.policyCoverageSessions += 1;

  const delayedBlock = blockForPhase(journey, ["p1a_delayed_recheck"]);
  if (delayedBlock) {
    const notBefore = journey.plan.delayedRecheckNotBefore ? Date.parse(journey.plan.delayedRecheckNotBefore) : NaN;
    const started = Date.parse(journey.startedAt);
    const timingValid = Number.isFinite(notBefore) && Number.isFinite(started) && started >= notBefore;
    if (timingValid && attentionCurveIsStable(programme, "delayed_recheck")) {
      evidence.delayedPasses += 1;
      programme.transferStatus = "attention_portable";
      programme.currentStage = "P1b";
      programme.delayedRecheckDueAt = null;
      programme.delayedRecheckWindowEndsAt = null;
      decisions.push("Your return went well. The memory stages are ready.");
    } else {
      evidence.failedDelayedChecks += 1;
      programme.delayedRecheckDueAt = null;
      programme.delayedRecheckWindowEndsAt = null;
      decisions.push("This return was harder. Next time, keep practising the same skill.");
      if (supportedUnlockReady(programme)) {
        programme.transferStatus = "supported_unlock";
        programme.currentStage = "P1b";
        decisions.push("The next stages are ready.");
      }
    }
  } else if (journey.plan.stage === "P0" || journey.plan.stage === "P1a") {
    programme.currentStage = "P1a";
    if (attentionStageAtStart === "arrow_stabilisation" && attentionCurveIsStable(programme, "arrow_stabilisation")) {
      programme.attentionWrapperStage = "flow_first_contact";
      decisions.push("Your arrow learning curve has flattened. Next: the first moving-dot check.");
    } else if (attentionStageAtStart === "flow_first_contact" && evidence.carrierFirstContactObserved) {
      programme.attentionWrapperStage = "flow_recovery";
      decisions.push("The initial motion dip is recorded. Next: build the motion learning curve.");
    } else if (attentionStageAtStart === "flow_recovery" && attentionCurveIsStable(programme, "flow_recovery")) {
      programme.attentionWrapperStage = "arrow_return";
      decisions.push("Your motion learning curve has flattened. Next: return to arrows.");
    } else if (attentionStageAtStart === "arrow_return" && attentionCurveIsStable(programme, "arrow_return")) {
      programme.attentionWrapperStage = "mixed";
      decisions.push("Your returning arrow curve has flattened. Next: alternate arrows and motion.");
    } else if (attentionStageAtStart === "mixed" && immediateAttentionEvidenceReady(programme)) {
      scheduleDelayed(programme, completedAt);
      decisions.push("Your alternating-format curve has flattened. Return after a break.");
    } else {
      decisions.push("Next time, continue this learning curve until it flattens.");
    }
  }

  if (journey.plan.stage === "P1b") {
    const wmBlocks = journey.plan.blocks.filter((block) => block.operator === "relational_wm");
    const pairDecisions = ([1, 2] as const).map((pairIndex) => {
      const blocks = wmBlocks.filter((block) => block.wmPairIndex === pairIndex);
      const results = blocks.flatMap((block) => blockResults(journey, block));
      const level = blocks[0]?.wmNLevel || programme.wmLevel;
      return evaluateCccWmPair(results, level);
    });
    const stageAtStart = programme.wmWrapperStage;
    pairDecisions.forEach((decision, index) => evidence.wmLearningCurve.push(wmHistoryPoint(
      journey.plan.sessionId,
      stageAtStart,
      (index + 1) as 1 | 2,
      decision,
    )));
    programme.wmLevel = pairDecisions.at(-1)?.nextLevel || programme.wmLevel;
    programme.wmPendingPairLevel = null;
    const stageHistory = evidence.wmLearningCurve.filter((point) => point.wrapperStage === stageAtStart);
    const stable = cccWmCurveIsStable(stageHistory);
    if (stageAtStart === "flow_first_contact") {
      programme.wmWrapperStage = "flow_recovery";
      decisions.push("Next: keep practising with moving dots.");
    } else if (stable) {
      if (stageAtStart === "arrow_stabilisation") {
        evidence.wmStabilityPasses += 1;
        programme.wmWrapperStage = "flow_first_contact";
        decisions.push("Next: use the same memory level with moving dots.");
      } else if (stageAtStart === "flow_recovery") {
        evidence.wmRecoveryPasses += 1;
        programme.wmWrapperStage = "arrow_return";
        decisions.push("Next: return to arrows.");
      } else if (stageAtStart === "arrow_return") {
        evidence.wmReturnPasses += 1;
        programme.wmWrapperStage = "mixed";
        decisions.push("Next: switch between arrows and moving dots.");
      } else {
        evidence.wmMixedPasses += 1;
        decisions.push("Your memory level was steady across both displays.");
      }
    } else {
      decisions.push(pairDecisions.at(-1)?.direction === "increase"
          ? `Next: continue at ${programme.wmLevel}-back.`
          : pairDecisions.at(-1)?.direction === "decrease"
          ? `Next: use ${programme.wmLevel}-back to rebuild accuracy.`
          : `Next: stay at ${programme.wmLevel}-back.`);
    }
    const wmReady = evidence.wmStabilityPasses >= CCC_MIN_WM_STABILITY_PASSES
      && evidence.wmRecoveryPasses >= CCC_MIN_WM_TRANSFER_PASSES
      && evidence.wmReturnPasses >= CCC_MIN_WM_TRANSFER_PASSES
      && evidence.wmMixedPasses >= CCC_MIN_WM_TRANSFER_PASSES;
    programme.currentStage = wmReady ? "P1c" : "P1b";
    decisions.push(wmReady
      ? "The final stages are ready."
      : "Next time, keep practising the Match-only n-back stream.");
  }

  if (journey.plan.stage === "P1c") {
    if (journey.plan.programmeSessionKind === "p1c_operator_integration") {
      const attentionBlock = blockForPhase(journey, ["p1c_attention_reentry"]);
      const wmBlock = blockForPhase(journey, ["p1c_operator_mix"]);
      const attentionResults = attentionBlock ? blockResults(journey, attentionBlock) : [];
      const wmResults = wmBlock ? blockResults(journey, wmBlock) : [];
      if (attentionBlock && wmBlock && attentionResults.length && wmResults.length) {
        const carrier = wmBlock.wrappers[0]?.startsWith("flow") ? "flow" as const : "arrow" as const;
        const attentionThroughputBps = cccLearningCurvePointForResults(1, attentionResults).informationThroughputBps;
        const attentionPerformance = Math.max(0, Math.min(1,
          attentionThroughputBps / CCC_ATTENTION_MAX_INFORMATION_THROUGHPUT_BPS,
        ));
        const wmDecision = evaluateCccWmPair(wmResults, wmBlock.wmNLevel || programme.wmLevel);
        const wmCapacity = Math.max(0, Math.min(1, wmDecision.capacityIndex / CCC_WM_MAX_CAPACITY_THROUGHPUT));
        evidence.integrationLearningCurve.push({
          sessionId: journey.plan.sessionId,
          carrier,
          observationCount: attentionResults.length + wmResults.length,
          attentionPerformance,
          wmCapacity,
          performanceIndex: mean([attentionPerformance, wmCapacity]),
        });
        evidence.returnToNowPasses = evidence.integrationLearningCurve.length;
        evidence.integrationPasses = evidence.integrationLearningCurve.length;
        evidence.integrationCarriers = uniqueCarriers([...evidence.integrationCarriers, carrier]);
      }
    }
    const integrationReady = integrationCarrierIsStable(programme, "arrow")
      && integrationCarrierIsStable(programme, "flow");
    if (journey.plan.programmeSessionKind === "p1c_delayed_integration") {
      const notBefore = journey.plan.delayedRecheckNotBefore ? Date.parse(journey.plan.delayedRecheckNotBefore) : NaN;
      const started = Date.parse(journey.startedAt);
      const timingValid = Number.isFinite(notBefore) && Number.isFinite(started) && started >= notBefore;
      const delayedPassed = timingValid
        && attentionCurveIsStable(programme, "final_delayed_reentry")
        && integrationReady
        && allRegimesBalanced(programme);
      if (delayedPassed) {
        evidence.finalDelayedPasses += 1;
        programme.currentStage = "complete";
        programme.completedAt = journey.completedAt;
        programme.delayedRecheckDueAt = null;
        programme.delayedRecheckWindowEndsAt = null;
        programme.status = programme.transferStatus === "attention_portable" ? "full_transfer" : "supported_completion";
        decisions.push(programme.status === "full_transfer"
          ? "You completed every stage."
          : "You completed the programme.");
      } else {
        evidence.failedFinalDelayedChecks += 1;
        programme.currentStage = "P1c";
        scheduleDelayed(programme, completedAt);
        decisions.push("The delayed re-entry curve has not flattened yet. Try again after a break.");
      }
    } else if (integrationReady) {
      programme.currentStage = "P1c";
      scheduleDelayed(programme, completedAt);
      decisions.push("Both carrier-integration curves have flattened. The final return is ready after a break.");
    } else {
      programme.currentStage = "P1c";
      decisions.push("Next time, continue the alternating carrier-integration curves.");
    }
  }

  programme.sessions.push({
    sessionId: journey.plan.sessionId,
    sessionNumber: programme.sessionNumber,
    stage: journey.plan.stage,
    kind: journey.plan.programmeSessionKind,
    regimePair: journey.plan.regimePair,
    startedAt: journey.startedAt,
    completedAt: journey.completedAt,
    gateDecisions: decisions,
    metrics: buildCccSessionMetrics(Object.values(journey.blockResults).flat()),
  });
  programme.updatedAt = new Date().toISOString();
  return { programme, gateDecisions: decisions };
}

export function programmeProgressPercent(programme: CccProgrammeState): number {
  const evidence = programme.evidence;
  const checks = [
    evidence.carrierFirstContactObserved,
    attentionCurveIsStable(programme, "flow_recovery"),
    attentionCurveIsStable(programme, "arrow_return"),
    attentionCurveIsStable(programme, "mixed"),
    programme.transferStatus !== "building",
    evidence.wmStabilityPasses >= CCC_MIN_WM_STABILITY_PASSES,
    evidence.wmRecoveryPasses >= CCC_MIN_WM_TRANSFER_PASSES,
    evidence.wmReturnPasses >= CCC_MIN_WM_TRANSFER_PASSES,
    evidence.wmMixedPasses >= CCC_MIN_WM_TRANSFER_PASSES,
    integrationCarrierIsStable(programme, "arrow"),
    integrationCarrierIsStable(programme, "flow"),
    evidence.finalDelayedPasses >= 1,
  ];
  return Math.round(checks.filter(Boolean).length / checks.length * 100);
}

export function missingTransferEvidence(programme: CccProgrammeState): string[] {
  const evidence = programme.evidence;
  const missing: string[] = [];
  if (!evidence.carrierFirstContactObserved) missing.push("trying the moving format");
  if (!attentionCurveIsStable(programme, "flow_recovery")) missing.push("a flattened motion learning curve");
  if (!attentionCurveIsStable(programme, "arrow_return")) missing.push("a flattened arrow-return curve");
  if (!attentionCurveIsStable(programme, "mixed")) missing.push("a flattened alternating-format curve");
  if (programme.transferStatus === "building") missing.push("a check after time away");
  return missing;
}

export function allRegimesBalanced(programme: CccProgrammeState): boolean {
  const values = REGIME_IDS.map((regime) => programme.regimeExposure[regime]);
  return values.every((value) => value > 0) && Math.max(...values) - Math.min(...values) <= 1;
}
