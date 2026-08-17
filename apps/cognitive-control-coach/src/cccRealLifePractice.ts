import type { CccStrategyDirection } from "./cccStrategy";
import type {
  CccOperator,
  CccTransitionKind,
} from "./cccTypes";
import type { WorkflowChoice } from "./cccCopy";

export type CccRealLifeMove = "find" | "hold" | "update" | "act";
export type CccRealLifePracticeOutcome = "helped" | "not_helpful" | "setting_difficult" | "not_yet";
export type CccRealLifePracticeBarrier = "forgot_cue" | "interruptions" | "time_or_authority" | "strategy_mismatch";

export interface CccRealLifePracticeMission {
  id: string;
  presetId: string;
  presetVersion: number;
  sourceSessionId: string;
  workflow: WorkflowChoice;
  operator: CccOperator;
  transitionKind: CccTransitionKind;
  phase: string;
  strategyDirection: CccStrategyDirection | null;
  move: CccRealLifeMove;
  createdAt: string;
  status: "pending" | "reviewed";
  outcome: Exclude<CccRealLifePracticeOutcome, "not_yet"> | null;
  barrier: CccRealLifePracticeBarrier | null;
  reviewedAt: string | null;
  deferredCount: number;
  lastDeferredAt: string | null;
}

export interface CccRealLifePracticeState {
  currentMission: CccRealLifePracticeMission | null;
  reviewedCount: number;
  attemptedCount: number;
  helpedCount: number;
}

declare module "./cccTypes" {
  interface CccProgrammeState {
    realLifePractice?: CccRealLifePracticeState;
  }
}

export const CCC_REAL_LIFE_PRESET_VERSION = 1;

export interface CccRealLifePracticePreset {
  id: string;
  version: number;
  move: CccRealLifeMove;
  title: string;
  cue: string;
  action: string;
}

export interface CccRealLifePracticeContext {
  workflow: WorkflowChoice;
  operator: CccOperator;
  transitionKind: CccTransitionKind;
  phase: string;
  strategyDirection?: CccStrategyDirection | null;
}

export const REAL_LIFE_MOVE_COPY: Record<CccRealLifeMove, { label: string; question: string }> = {
  find: { label: "Find", question: "What matters now?" },
  hold: { label: "Hold", question: "What must stay available?" },
  update: { label: "Update", question: "What changed, and what stays stable?" },
  act: { label: "Act", question: "Is the next step supported enough?" },
};

export const REAL_LIFE_OUTCOME_COPY: Record<CccRealLifePracticeOutcome, string> = {
  helped: "Yes—it helped",
  not_helpful: "I tried it, but it did not help",
  setting_difficult: "The situation made it difficult",
  not_yet: "Not yet",
};

export const REAL_LIFE_BARRIER_COPY: Record<CccRealLifePracticeBarrier, string> = {
  forgot_cue: "I forgot at the relevant moment",
  interruptions: "Too many interruptions",
  time_or_authority: "Not enough time or authority",
  strategy_mismatch: "The strategy did not fit",
};

function preset(
  value: Omit<CccRealLifePracticePreset, "version">,
): CccRealLifePracticePreset {
  return { ...value, version: CCC_REAL_LIFE_PRESET_VERSION };
}

const WORKFLOW_BASELINES: Record<WorkflowChoice, CccRealLifePracticePreset> = {
  focused_work: preset({
    id: "focused-work-return-to-result",
    move: "find",
    title: "Return to the result that matters",
    cue: "When a message, tab, or new request pulls you away…",
    action: "Reread the one result you are trying to complete before choosing what to do next.",
  }),
  study: preset({
    id: "study-main-question",
    move: "update",
    title: "Update your answer, not your question",
    cue: "After each new source or section…",
    action: "Ask: What does this add or change about my main question?",
  }),
  ai_assisted: preset({
    id: "ai-goal-and-requirement",
    move: "hold",
    title: "Keep the requirement visible",
    cue: "Before accepting a new AI output…",
    action: "Check it against your main goal and one requirement that must not be lost.",
  }),
  everyday_planning: preset({
    id: "planning-restart-step",
    move: "act",
    title: "Rebuild your next step",
    cue: "After an interruption…",
    action: "Name the last completed step and the next useful step before continuing.",
  }),
};

function workflowAnchor(workflow: WorkflowChoice): string {
  if (workflow === "study") return "your main question";
  if (workflow === "ai_assisted") return "your main goal and one requirement";
  if (workflow === "everyday_planning") return "the intended result";
  return "the one result you are trying to complete";
}

function isChangedFormat(transitionKind: CccTransitionKind): boolean {
  return transitionKind === "carrier_transfer"
    || transitionKind === "wm_carrier_transfer"
    || transitionKind === "reference_frame_extension"
    || transitionKind === "mixed_attention_portability"
    || transitionKind === "operator_integration";
}

export function resolveRealLifePracticePreset(context: CccRealLifePracticeContext): CccRealLifePracticePreset {
  const anchor = workflowAnchor(context.workflow);
  if (context.operator === "relational_wm") {
    return preset({
      id: `hold-task-state-${context.workflow}`,
      move: "hold",
      title: "Keep the task state visible",
      cue: "When new information or an interruption arrives…",
      action: "Write three short lines: GOAL · CONSTRAINT · NEXT. Re-read them before continuing.",
    });
  }
  if (context.phase.includes("delayed") || context.transitionKind === "return_to_now") {
    return preset({
      id: `return-after-break-${context.workflow}`,
      move: "act",
      title: "Reconstruct before you restart",
      cue: "When you return after time away…",
      action: `Name the last completed step, then the next useful step towards ${anchor}.`,
    });
  }
  if (isChangedFormat(context.transitionKind)) {
    return preset({
      id: `surface-change-stable-rule-${context.workflow}`,
      move: "update",
      title: "Separate the change from the rule",
      cue: "When the source, format, or output changes…",
      action: `Ask: What changed on the surface, and what must stay true about ${anchor}?`,
    });
  }
  if (context.strategyDirection === "slow_down") {
    return preset({
      id: `check-decision-fact-${context.workflow}`,
      move: "find",
      title: "Check the fact that could change the choice",
      cue: "When an error would matter…",
      action: `Pause and check one fact that could change your next step towards ${anchor}.`,
    });
  }
  if (context.strategyDirection === "speed_up") {
    return preset({
      id: `commit-reversible-step-${context.workflow}`,
      move: "act",
      title: "Commit when it is clear enough",
      cue: "When the next step is reversible and the key information is clear…",
      action: `Take the next useful step towards ${anchor} instead of checking again.`,
    });
  }
  return WORKFLOW_BASELINES[context.workflow];
}

export function createRealLifePracticeMission(
  selectedPreset: CccRealLifePracticePreset,
  context: CccRealLifePracticeContext,
  sourceSessionId: string,
  now = new Date(),
  id: string = crypto.randomUUID(),
): CccRealLifePracticeMission {
  return {
    id,
    presetId: selectedPreset.id,
    presetVersion: selectedPreset.version,
    sourceSessionId,
    workflow: context.workflow,
    operator: context.operator,
    transitionKind: context.transitionKind,
    phase: context.phase,
    strategyDirection: context.strategyDirection || null,
    move: selectedPreset.move,
    createdAt: now.toISOString(),
    status: "pending",
    outcome: null,
    barrier: null,
    reviewedAt: null,
    deferredCount: 0,
    lastDeferredAt: null,
  };
}

export function realLifePracticePresetForMission(
  mission: CccRealLifePracticeMission,
): CccRealLifePracticePreset {
  return resolveRealLifePracticePreset({
    workflow: mission.workflow,
    operator: mission.operator,
    transitionKind: mission.transitionKind,
    phase: mission.phase,
    strategyDirection: mission.strategyDirection,
  });
}
