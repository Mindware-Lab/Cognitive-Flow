import { CCC_DELAYED_RECHECK, CCC_REGIME_PAIRS } from "./cccConfig";
import { hashSeed } from "./random";
import type { CccSavedJourney } from "./cccStorage";
import type {
  CccAttentionBlockPlan,
  CccProgrammeSessionKind,
  CccProgrammeState,
  CccRecordedTrial,
  CccRegimeId,
} from "./cccTypes";

export const CCC_PROGRAMME_VERSION = 1 as const;
export const CCC_PROGRAMME_GATE_VERSION = "ccc-programme-gates-v0.4";
export const CCC_DELAY_MS = CCC_DELAYED_RECHECK.minimumReentryHours * 60 * 60 * 1000;
export const CCC_MIN_ATTENTION_STABILITY_SESSIONS = 4;
export const CCC_MIN_WM_STABILITY_PASSES = 5;
export const CCC_MIN_WM_TRANSFER_PASSES = 4;
export const CCC_MIN_INTEGRATION_PASSES = 4;

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
    wmLevel: 1,
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
    },
    sessions: [],
    createdAt: timestamp,
    updatedAt: timestamp,
    completedAt: null,
  };
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

function blockAccuracy(results: readonly CccRecordedTrial[]): number {
  return results.length ? results.filter((result) => result.scoring.isCorrect).length / results.length : 0;
}

function omissionRate(results: readonly CccRecordedTrial[]): number {
  return results.length ? results.filter((result) => result.scoring.isOmission).length / results.length : 1;
}

function passesBlock(results: readonly CccRecordedTrial[], minimum = 12, accuracy = 0.75, omissionCeiling = 0.1): boolean {
  return results.length >= minimum && blockAccuracy(results) >= accuracy && omissionRate(results) <= omissionCeiling;
}

function blockForPhase(journey: CccSavedJourney, phases: readonly string[]): CccAttentionBlockPlan | null {
  return journey.plan.blocks.find((block) => phases.includes(block.phase)) || null;
}

function passedPhase(
  journey: CccSavedJourney,
  phases: readonly string[],
  minimum = 12,
  accuracy = 0.75,
  omissionCeiling = 0.1,
): boolean {
  const block = blockForPhase(journey, phases);
  return block ? passesBlock(blockResults(journey, block), minimum, accuracy, omissionCeiling) : false;
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

function immediateAttentionEvidenceReady(state: CccProgrammeState): boolean {
  const evidence = state.evidence;
  return evidence.carrierFirstContactObserved
    && evidence.recoveryPasses >= CCC_MIN_ATTENTION_STABILITY_SESSIONS
    && evidence.returnPasses >= CCC_MIN_ATTENTION_STABILITY_SESSIONS
    && evidence.mixedPasses >= CCC_MIN_ATTENTION_STABILITY_SESSIONS
    && evidence.policyCoverageSessions >= CCC_MIN_ATTENTION_STABILITY_SESSIONS;
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
  const programme = structuredClone(current);
  const decisions: string[] = [];
  const evidence = programme.evidence;
  const completedAt = new Date(journey.completedAt);

  programme.sessionNumber += 1;
  if (journey.plan.stage === "P0" || journey.plan.stage === "P1a" || journey.plan.stage === "P1c") {
    programme.attentionSessionCount += 1;
  }
  for (const regime of journey.plan.regimePair) programme.regimeExposure[regime] += 1;
  programme.pairHistory.push(pairKey(journey.plan.regimePair));

  const firstContact = blockForPhase(journey, ["flow_rel_first_contact", "p1a_flow_first_contact"]);
  if (firstContact) {
    const results = blockResults(journey, firstContact);
    evidence.carrierFirstContactObserved = results.length >= 6;
    if (passesBlock(results, 6, 2 / 3, 1 / 6)) evidence.carrierFirstContactPassed = true;
  }
  if (passedPhase(journey, ["flow_rel_recovery", "p1a_flow_recovery"])) evidence.recoveryPasses += 1;
  if (passedPhase(journey, ["arrow_rel_return", "p1a_arrow_return"])) evidence.returnPasses += 1;
  if (passedPhase(journey, ["relative_mix", "p1a_relative_mix"])) evidence.mixedPasses += 1;
  if (hasBalancedPolicyCoverage(journey)) evidence.policyCoverageSessions += 1;

  const delayedBlock = blockForPhase(journey, ["p1a_delayed_recheck"]);
  if (delayedBlock) {
    const fresh = blockResults(journey, delayedBlock);
    const notBefore = journey.plan.delayedRecheckNotBefore ? Date.parse(journey.plan.delayedRecheckNotBefore) : NaN;
    const started = Date.parse(journey.startedAt);
    const timingValid = Number.isFinite(notBefore) && Number.isFinite(started) && started >= notBefore;
    if (timingValid && passesBlock(fresh, CCC_DELAYED_RECHECK.minimumFreshValidDecisions)) {
      evidence.delayedPasses += 1;
      programme.transferStatus = "attention_portable";
      programme.currentStage = "P1b";
      programme.delayedRecheckDueAt = null;
      programme.delayedRecheckWindowEndsAt = null;
      decisions.push("Your return check went well. The next set of hold-and-compare stages is ready.");
    } else {
      evidence.failedDelayedChecks += 1;
      programme.delayedRecheckDueAt = null;
      programme.delayedRecheckWindowEndsAt = null;
      decisions.push("This return check was harder. Your next session will keep working on the same skill.");
      if (supportedUnlockReady(programme)) {
        programme.transferStatus = "supported_unlock";
        programme.currentStage = "P1b";
        decisions.push("The next set of stages is now ready.");
      }
    }
  } else if ((journey.plan.stage === "P0" || journey.plan.stage === "P1a") && immediateAttentionEvidenceReady(programme)) {
    programme.currentStage = "P1a";
    scheduleDelayed(programme, completedAt);
    decisions.push("You completed this set. A return check is now scheduled after some time away.");
  } else if (journey.plan.stage === "P0" || journey.plan.stage === "P1a") {
    programme.currentStage = "P1a";
    decisions.push("You are still building consistency. The next session will revisit the areas that need more practice.");
  }

  if (passedPhase(journey, ["p1b_wm_arrow_stabilisation"], 12)) evidence.wmStabilityPasses += 1;
  if (passedPhase(journey, ["p1b_wm_flow_recovery"], 12)) evidence.wmRecoveryPasses += 1;
  if (passedPhase(journey, ["p1b_wm_arrow_return"], 12)) evidence.wmReturnPasses += 1;
  if (passedPhase(journey, ["p1b_wm_relative_mix"], 12)) evidence.wmMixedPasses += 1;
  if (evidence.wmStabilityPasses >= 1) programme.wmLevel = 2;
  if (journey.plan.stage === "P1b") {
    const wmReady = evidence.wmStabilityPasses >= CCC_MIN_WM_STABILITY_PASSES
      && evidence.wmRecoveryPasses >= CCC_MIN_WM_TRANSFER_PASSES
      && evidence.wmReturnPasses >= CCC_MIN_WM_TRANSFER_PASSES
      && evidence.wmMixedPasses >= CCC_MIN_WM_TRANSFER_PASSES;
    programme.currentStage = wmReady ? "P1c" : "P1b";
    decisions.push(wmReady
      ? "You held and compared the patterns consistently. The final set of stages is ready."
      : "You are still building consistency with holding and comparing patterns.");
  }

  if (passedPhase(journey, ["p1c_attention_reentry"], 12)) evidence.returnToNowPasses += 1;
  if (passedPhase(journey, ["p1c_operator_mix"], 12)) {
    evidence.integrationPasses += 1;
    const carrier = blockForPhase(journey, ["p1c_operator_mix"])?.wrappers[0]?.startsWith("flow") ? "flow" : "arrow";
    evidence.integrationCarriers = uniqueCarriers([...evidence.integrationCarriers, carrier]);
  }
  if (journey.plan.stage === "P1c") {
    const integrationReady = evidence.returnToNowPasses >= CCC_MIN_INTEGRATION_PASSES
      && evidence.integrationPasses >= CCC_MIN_INTEGRATION_PASSES
      && evidence.integrationCarriers.length >= 2;
    if (journey.plan.programmeSessionKind === "p1c_delayed_integration") {
      const delayed = blockForPhase(journey, ["p1c_delayed_reentry"]);
      const fresh = delayed ? blockResults(journey, delayed) : [];
      const notBefore = journey.plan.delayedRecheckNotBefore ? Date.parse(journey.plan.delayedRecheckNotBefore) : NaN;
      const started = Date.parse(journey.startedAt);
      const timingValid = Number.isFinite(notBefore) && Number.isFinite(started) && started >= notBefore;
      const delayedPassed = timingValid
        && passesBlock(fresh, CCC_DELAYED_RECHECK.minimumFreshValidDecisions)
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
          ? "You completed every stage, including returning after time away and switching in both directions."
          : "You completed the programme.");
      } else {
        evidence.failedFinalDelayedChecks += 1;
        programme.currentStage = "P1c";
        scheduleDelayed(programme, completedAt);
        decisions.push("This return check was harder. Another check has been scheduled after some time away.");
      }
    } else if (integrationReady) {
      programme.currentStage = "P1c";
      scheduleDelayed(programme, completedAt);
      decisions.push("You switched smoothly between finding and holding the pattern. A final return check is now scheduled.");
    } else {
      programme.currentStage = "P1c";
      decisions.push("You are still building consistency when switching between finding and holding the pattern.");
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
  });
  programme.updatedAt = new Date().toISOString();
  return { programme, gateDecisions: decisions };
}

export function programmeProgressPercent(programme: CccProgrammeState): number {
  const evidence = programme.evidence;
  const checks = [
    evidence.carrierFirstContactObserved,
    evidence.recoveryPasses >= CCC_MIN_ATTENTION_STABILITY_SESSIONS,
    evidence.returnPasses >= CCC_MIN_ATTENTION_STABILITY_SESSIONS,
    evidence.mixedPasses >= CCC_MIN_ATTENTION_STABILITY_SESSIONS,
    programme.transferStatus !== "building",
    evidence.wmStabilityPasses >= CCC_MIN_WM_STABILITY_PASSES,
    evidence.wmRecoveryPasses >= CCC_MIN_WM_TRANSFER_PASSES,
    evidence.wmReturnPasses >= CCC_MIN_WM_TRANSFER_PASSES,
    evidence.wmMixedPasses >= CCC_MIN_WM_TRANSFER_PASSES,
    evidence.returnToNowPasses >= CCC_MIN_INTEGRATION_PASSES,
    evidence.integrationPasses >= CCC_MIN_INTEGRATION_PASSES && evidence.integrationCarriers.length >= 2,
    evidence.finalDelayedPasses >= 1,
  ];
  return Math.round(checks.filter(Boolean).length / checks.length * 100);
}

export function missingTransferEvidence(programme: CccProgrammeState): string[] {
  const evidence = programme.evidence;
  const missing: string[] = [];
  if (!evidence.carrierFirstContactObserved) missing.push("trying the moving format");
  if (evidence.recoveryPasses < CCC_MIN_ATTENTION_STABILITY_SESSIONS) missing.push("more practice with motion");
  if (evidence.returnPasses < CCC_MIN_ATTENTION_STABILITY_SESSIONS) missing.push("returning to arrows");
  if (evidence.mixedPasses < CCC_MIN_ATTENTION_STABILITY_SESSIONS) missing.push("switching between formats");
  if (programme.transferStatus === "building") missing.push("a check after time away");
  return missing;
}

export function allRegimesBalanced(programme: CccProgrammeState): boolean {
  const values = REGIME_IDS.map((regime) => programme.regimeExposure[regime]);
  return values.every((value) => value > 0) && Math.max(...values) - Math.min(...values) <= 1;
}
