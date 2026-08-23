import type { WorkflowChoice } from "./cccCopy";
import type { CccProgrammeState } from "./cccTypes";

export type CccBridgeMove = "find" | "hold" | "update" | "act";

export type CccBridgeLevel =
  | "b1_guided"
  | "b2_retrieval"
  | "b3_personalised"
  | "b4_faded"
  | "b5_changed_context"
  | "b6_delayed";

export type CccBridgePromptStrength =
  | "full"
  | "cue_only"
  | "personalised"
  | "faded"
  | "changed_context"
  | "unsupported_delayed";

export type CccBridgeObservationKind =
  | "guided_review"
  | "retrieval_attempt"
  | "personal_cue_created"
  | "personal_mission_review"
  | "faded_probe"
  | "changed_context_review"
  | "delayed_probe";

export interface CccBridgeMoveCopy {
  label: string;
  definition: string;
  question: string;
}

export const CCC_BRIDGE_MOVE_COPY: Record<CccBridgeMove, CccBridgeMoveCopy> = {
  find: {
    label: "Find",
    definition: "Identify what matters now.",
    question: "What matters?",
  },
  hold: {
    label: "Hold",
    definition: "Keep what matters available.",
    question: "What must stay available?",
  },
  update: {
    label: "Update",
    definition: "Change what needs changing; keep what still fits.",
    question: "What changed?",
  },
  act: {
    label: "Act",
    definition: "When you have enough, take the next useful step.",
    question: "Enough to move?",
  },
};

export interface CccBridgeObservation {
  id: string;
  kind: CccBridgeObservationKind;
  level: CccBridgeLevel;
  recordedAt: string;
  move: CccBridgeMove | null;
  selectedMove: CccBridgeMove | null;
  retrievalCorrect: boolean | null;
  spontaneousRecall: boolean | null;
  spontaneousUse: boolean | null;
  sourceWorkflow: WorkflowChoice | null;
  targetWorkflow: WorkflowChoice | null;
  helped: boolean | null;
  notes?: string | null;
}

export interface CccBridgeProgressionState {
  version: 1;
  level: CccBridgeLevel;
  highestLevelReached: CccBridgeLevel;
  guidedReviewedCount: number;
  retrievalAttemptCount: number;
  retrievalCorrectCount: number;
  personalCueCreatedCount: number;
  personalMissionReviewedCount: number;
  fadedProbeCount: number;
  spontaneousRecallCount: number;
  spontaneousUseCount: number;
  changedContextReviewedCount: number;
  delayedProbeCount: number;
  delayedUnsupportedUseCount: number;
  personalCueClass: string | null;
  personalMove: CccBridgeMove | null;
  sourceWorkflow: WorkflowChoice | null;
  lastChangedContextWorkflow: WorkflowChoice | null;
  lastExplicitPromptAt: string | null;
  lastBridgeReviewAt: string | null;
  history: CccBridgeObservation[];
}

export interface CccBridgeAdvanceResult {
  state: CccBridgeProgressionState;
  previousLevel: CccBridgeLevel;
  level: CccBridgeLevel;
  ceiling: CccBridgeLevel;
  advanced: boolean;
  reason: string;
}

export const CCC_BRIDGE_VERSION = 1 as const;
export const CCC_BRIDGE_DELAY_MIN_HOURS = 48;

export const CCC_BRIDGE_LEVELS: readonly CccBridgeLevel[] = [
  "b1_guided",
  "b2_retrieval",
  "b3_personalised",
  "b4_faded",
  "b5_changed_context",
  "b6_delayed",
];

export const CCC_BRIDGE_LEVEL_LABELS: Record<CccBridgeLevel, string> = {
  b1_guided: "Guided",
  b2_retrieval: "Policy recovery",
  b3_personalised: "Personal cue",
  b4_faded: "Independent use",
  b5_changed_context: "Changed context",
  b6_delayed: "Delayed use",
};

export function bridgeLevelIndex(level: CccBridgeLevel): number {
  return CCC_BRIDGE_LEVELS.indexOf(level);
}

export function bridgeLevelAtLeast(level: CccBridgeLevel, threshold: CccBridgeLevel): boolean {
  return bridgeLevelIndex(level) >= bridgeLevelIndex(threshold);
}

export function bridgePromptStrength(level: CccBridgeLevel): CccBridgePromptStrength {
  switch (level) {
    case "b1_guided": return "full";
    case "b2_retrieval": return "cue_only";
    case "b3_personalised": return "personalised";
    case "b4_faded": return "faded";
    case "b5_changed_context": return "changed_context";
    case "b6_delayed": return "unsupported_delayed";
  }
}

export function createInitialBridgeState(): CccBridgeProgressionState {
  return {
    version: CCC_BRIDGE_VERSION,
    level: "b1_guided",
    highestLevelReached: "b1_guided",
    guidedReviewedCount: 0,
    retrievalAttemptCount: 0,
    retrievalCorrectCount: 0,
    personalCueCreatedCount: 0,
    personalMissionReviewedCount: 0,
    fadedProbeCount: 0,
    spontaneousRecallCount: 0,
    spontaneousUseCount: 0,
    changedContextReviewedCount: 0,
    delayedProbeCount: 0,
    delayedUnsupportedUseCount: 0,
    personalCueClass: null,
    personalMove: null,
    sourceWorkflow: null,
    lastChangedContextWorkflow: null,
    lastExplicitPromptAt: null,
    lastBridgeReviewAt: null,
    history: [],
  };
}

function finiteCount(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? Math.floor(value) : 0;
}

function nullableString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

function validMove(value: unknown): CccBridgeMove | null {
  return value === "find" || value === "hold" || value === "update" || value === "act" ? value : null;
}

function validWorkflow(value: unknown): WorkflowChoice | null {
  return value === "focused_work" || value === "study" || value === "ai_assisted" || value === "everyday_planning"
    ? value
    : null;
}

function validBridgeLevel(value: unknown): CccBridgeLevel | null {
  return CCC_BRIDGE_LEVELS.includes(value as CccBridgeLevel) ? value as CccBridgeLevel : null;
}

export function migrateBridgeState(
  saved?: Partial<CccBridgeProgressionState> | null,
): CccBridgeProgressionState {
  const initial = createInitialBridgeState();
  if (!saved || typeof saved !== "object") return initial;

  const level = validBridgeLevel(saved.level) || initial.level;
  const highestSaved = validBridgeLevel(saved.highestLevelReached) || level;
  const highestLevelReached = bridgeLevelIndex(highestSaved) >= bridgeLevelIndex(level) ? highestSaved : level;
  const history = Array.isArray(saved.history)
    ? saved.history.filter((item): item is CccBridgeObservation => Boolean(
        item
        && typeof item === "object"
        && typeof item.id === "string"
        && typeof item.recordedAt === "string"
        && validBridgeLevel(item.level),
      ))
    : [];

  return {
    version: CCC_BRIDGE_VERSION,
    level,
    highestLevelReached,
    guidedReviewedCount: finiteCount(saved.guidedReviewedCount),
    retrievalAttemptCount: finiteCount(saved.retrievalAttemptCount),
    retrievalCorrectCount: finiteCount(saved.retrievalCorrectCount),
    personalCueCreatedCount: finiteCount(saved.personalCueCreatedCount),
    personalMissionReviewedCount: finiteCount(saved.personalMissionReviewedCount),
    fadedProbeCount: finiteCount(saved.fadedProbeCount),
    spontaneousRecallCount: finiteCount(saved.spontaneousRecallCount),
    spontaneousUseCount: finiteCount(saved.spontaneousUseCount),
    changedContextReviewedCount: finiteCount(saved.changedContextReviewedCount),
    delayedProbeCount: finiteCount(saved.delayedProbeCount),
    delayedUnsupportedUseCount: finiteCount(saved.delayedUnsupportedUseCount),
    personalCueClass: nullableString(saved.personalCueClass),
    personalMove: validMove(saved.personalMove),
    sourceWorkflow: validWorkflow(saved.sourceWorkflow),
    lastChangedContextWorkflow: validWorkflow(saved.lastChangedContextWorkflow),
    lastExplicitPromptAt: nullableString(saved.lastExplicitPromptAt),
    lastBridgeReviewAt: nullableString(saved.lastBridgeReviewAt),
    history,
  };
}

/**
 * Existing cognitive transfer evidence sets the maximum independence that the
 * Bridge controller is allowed to request. It does not prove real-life
 * portability and never advances the Bridge controller by itself.
 */
export function bridgeCeilingForProgramme(programme: CccProgrammeState): CccBridgeLevel {
  const evidence = programme.evidence;

  if (evidence.finalDelayedPasses > 0 || evidence.delayedPasses > 0) {
    return "b6_delayed";
  }

  if (
    evidence.mixedPasses > 0
    || evidence.wmMixedPasses > 0
    || evidence.integrationPasses > 0
    || evidence.integrationCarriers.length > 1
  ) {
    return "b5_changed_context";
  }

  if (
    evidence.returnPasses > 0
    || evidence.wmReturnPasses > 0
    || evidence.returnToNowPasses > 0
  ) {
    return "b4_faded";
  }

  if (evidence.recoveryPasses > 0 || evidence.wmRecoveryPasses > 0) {
    return "b3_personalised";
  }

  if (
    evidence.carrierFirstContactObserved
    || programme.attentionSessionCount > 0
    || evidence.wmStabilityPasses > 0
  ) {
    return "b2_retrieval";
  }

  return "b1_guided";
}

export function hoursSince(isoDate: string | null, now = new Date()): number | null {
  if (!isoDate) return null;
  const time = Date.parse(isoDate);
  if (!Number.isFinite(time)) return null;
  return Math.max(0, (now.getTime() - time) / 3_600_000);
}

export function bridgeDelayedProbeDue(
  state: CccBridgeProgressionState,
  now = new Date(),
  minimumHours = CCC_BRIDGE_DELAY_MIN_HOURS,
): boolean {
  const elapsed = hoursSince(state.lastExplicitPromptAt, now);
  return elapsed !== null && elapsed >= minimumHours;
}

function currentLevelRequirementMet(
  state: CccBridgeProgressionState,
  now: Date,
): { met: boolean; reason: string } {
  switch (state.level) {
    case "b1_guided":
      return state.guidedReviewedCount >= 2
        ? { met: true, reason: "Two guided missions have been reviewed." }
        : { met: false, reason: "More guided use is needed before retrieval support is reduced." };
    case "b2_retrieval":
      return state.retrievalAttemptCount >= 2 && state.retrievalCorrectCount >= 1
        ? { met: true, reason: "The user has practised recovering the control move from a cue." }
        : { met: false, reason: "More cue-to-move retrieval evidence is needed." };
    case "b3_personalised":
      return state.personalCueCreatedCount >= 1 && state.personalMissionReviewedCount >= 1
        ? { met: true, reason: "A personal cue-policy mapping has been created and tried." }
        : { met: false, reason: "A personal cue-policy mission still needs to be created and reviewed." };
    case "b4_faded":
      return state.fadedProbeCount >= 1
        ? { met: true, reason: "At least one genuine faded interval has been observed." }
        : { met: false, reason: "A faded interval is needed before testing a changed context." };
    case "b5_changed_context":
      if (state.changedContextReviewedCount < 1) {
        return { met: false, reason: "The same policy still needs a reviewed changed-context attempt." };
      }
      return bridgeDelayedProbeDue(state, now)
        ? { met: true, reason: "Changed-context use has been reviewed and the delayed interval is due." }
        : { met: false, reason: "Changed-context evidence is present; wait for a genuine unsupported delay." };
    case "b6_delayed":
      return { met: false, reason: "Delayed unsupported recovery is the terminal Bridge level." };
  }
}

function nextBridgeLevel(level: CccBridgeLevel): CccBridgeLevel {
  const index = bridgeLevelIndex(level);
  return CCC_BRIDGE_LEVELS[Math.min(CCC_BRIDGE_LEVELS.length - 1, index + 1)];
}

export function evaluateBridgeAdvance(
  inputState: CccBridgeProgressionState,
  programme: CccProgrammeState,
  now = new Date(),
): CccBridgeAdvanceResult {
  const state = migrateBridgeState(inputState);
  const previousLevel = state.level;
  const ceiling = bridgeCeilingForProgramme(programme);

  if (state.level === "b6_delayed") {
    return {
      state,
      previousLevel,
      level: state.level,
      ceiling,
      advanced: false,
      reason: "Delayed unsupported recovery is already the highest Bridge level.",
    };
  }

  const candidate = nextBridgeLevel(state.level);
  if (bridgeLevelIndex(candidate) > bridgeLevelIndex(ceiling)) {
    return {
      state,
      previousLevel,
      level: state.level,
      ceiling,
      advanced: false,
      reason: "Bridge support stays in place until the game has enough transfer evidence for the next level.",
    };
  }

  const requirement = currentLevelRequirementMet(state, now);
  if (!requirement.met) {
    return {
      state,
      previousLevel,
      level: state.level,
      ceiling,
      advanced: false,
      reason: requirement.reason,
    };
  }

  state.level = candidate;
  if (bridgeLevelIndex(candidate) > bridgeLevelIndex(state.highestLevelReached)) {
    state.highestLevelReached = candidate;
  }

  return {
    state,
    previousLevel,
    level: candidate,
    ceiling,
    advanced: true,
    reason: requirement.reason,
  };
}

function createObservationId(kind: CccBridgeObservationKind, now: Date): string {
  return `bridge-${kind}-${now.getTime()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function recordBridgeObservation(
  inputState: CccBridgeProgressionState,
  observation: Omit<CccBridgeObservation, "id" | "level" | "recordedAt">,
  now = new Date(),
): CccBridgeProgressionState {
  const state = migrateBridgeState(inputState);
  const recorded: CccBridgeObservation = {
    id: createObservationId(observation.kind, now),
    level: state.level,
    recordedAt: now.toISOString(),
    ...observation,
  };

  state.history.push(recorded);
  state.lastBridgeReviewAt = recorded.recordedAt;

  switch (observation.kind) {
    case "guided_review":
      state.guidedReviewedCount += 1;
      break;
    case "retrieval_attempt":
      state.retrievalAttemptCount += 1;
      if (observation.retrievalCorrect) state.retrievalCorrectCount += 1;
      break;
    case "personal_cue_created":
      state.personalCueCreatedCount += 1;
      if (observation.notes?.trim()) state.personalCueClass = observation.notes.trim();
      if (observation.selectedMove) state.personalMove = observation.selectedMove;
      state.sourceWorkflow = observation.sourceWorkflow;
      break;
    case "personal_mission_review":
      state.personalMissionReviewedCount += 1;
      break;
    case "faded_probe":
      state.fadedProbeCount += 1;
      if (observation.spontaneousRecall) state.spontaneousRecallCount += 1;
      if (observation.spontaneousUse) state.spontaneousUseCount += 1;
      break;
    case "changed_context_review":
      state.changedContextReviewedCount += 1;
      state.lastChangedContextWorkflow = observation.targetWorkflow;
      break;
    case "delayed_probe":
      state.delayedProbeCount += 1;
      if (observation.spontaneousUse) state.delayedUnsupportedUseCount += 1;
      break;
  }

  return state;
}

export function markExplicitBridgePrompt(
  inputState: CccBridgeProgressionState,
  now = new Date(),
): CccBridgeProgressionState {
  const state = migrateBridgeState(inputState);
  state.lastExplicitPromptAt = now.toISOString();
  return state;
}

export function bridgeEvidenceSummary(stateInput: CccBridgeProgressionState): Array<{
  level: CccBridgeLevel;
  label: string;
  status: "complete" | "current" | "upcoming";
}> {
  const state = migrateBridgeState(stateInput);
  const current = bridgeLevelIndex(state.level);
  return CCC_BRIDGE_LEVELS.map((level, index) => ({
    level,
    label: CCC_BRIDGE_LEVEL_LABELS[level],
    status: index < current ? "complete" : index === current ? "current" : "upcoming",
  }));
}
