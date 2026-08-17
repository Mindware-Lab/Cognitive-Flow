import type { CccStrategyDirection } from "./cccStrategy";
import type {
  CccOperator,
  CccProgrammeSessionKind,
  CccTransitionKind,
} from "./cccTypes";
import type { WorkflowChoice } from "./cccCopy";

export type CccRealLifeMove = "find" | "hold" | "update" | "act";
export type CccRealLifePracticeOutcome = "helped" | "not_helpful" | "setting_difficult" | "not_yet";
export type CccRealLifePracticeBarrier = "forgot_cue" | "interruptions" | "time_or_authority" | "strategy_mismatch";
export type CccRealLifeThemeFamilyId =
  | "foundation_focus"
  | "steady_goal"
  | "inspect_change"
  | "adapt_locally"
  | "return_with_learning"
  | "switch_without_drift"
  | "restart_state"
  | "task_state"
  | "relations_across_change"
  | "portable_structure"
  | "right_operation"
  | "review_and_bank";

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
  themeFamilyId: CccRealLifeThemeFamilyId;
  themeId: string;
  sessionKind: CccProgrammeSessionKind;
  sessionNumber: number;
  blockIndex: number;
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

export const CCC_REAL_LIFE_PRESET_VERSION = 2;

export interface CccRealLifePracticePreset {
  id: string;
  version: number;
  move: CccRealLifeMove;
  themeFamilyId: CccRealLifeThemeFamilyId;
  themeId: string;
  themeTitle: string;
  angleTitle: string;
  explanation: string;
  example: string;
  missionCue: string;
  missionAction: string;
  /** Compatibility aliases retained for saved-state and check-in rendering. */
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
  sessionId?: string;
  sessionKind?: CccProgrammeSessionKind;
  sessionNumber?: number;
  blockIndex?: number;
  sessionAnchorPhase?: string;
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

const THEME_TITLES: Record<CccRealLifeThemeFamilyId, readonly string[]> = {
  foundation_focus: [
    "Stay with what matters",
    "Give one result priority",
    "Find the part that should steer the next choice",
    "Keep the main task in front of the noise",
  ],
  steady_goal: [
    "Keep the goal steady while the surface changes",
    "Use one stable reference point",
    "Keep one requirement fixed long enough to learn",
    "Let the method settle before redesigning it",
  ],
  inspect_change: [
    "Ask what really changed",
    "New format does not always mean new problem",
    "Check the change before changing the plan",
    "Inspect surprise before you rebuild",
  ],
  adapt_locally: [
    "Change the method, keep the result",
    "Revise the part that stopped fitting",
    "Keep what still works and update the rest",
    "Make a local adjustment before a whole-plan rewrite",
  ],
  return_with_learning: [
    "Return without starting over",
    "Come back with what you learned",
    "Use the familiar route without losing the update",
    "Bring the useful change back to the original task",
  ],
  switch_without_drift: [
    "Switch formats without switching goals",
    "Change tools without losing the task",
    "Use one decision standard across several sources",
    "Let the format change, not the purpose",
  ],
  restart_state: [
    "Restart from the last useful point",
    "Reconstruct before you resume",
    "Remember the goal, then check what is true now",
    "Use yesterday's structure, not yesterday's assumptions",
  ],
  task_state: [
    "Keep the task state visible",
    "Keep the goal, limit and next step together",
    "Remember what matters for the next decision",
    "Do not make memory carry what the workspace can display",
  ],
  relations_across_change: [
    "Update the details without losing what belongs together",
    "Keep the source attached to the claim",
    "Preserve the relationship while the presentation changes",
    "Change the detail without scrambling the structure",
  ],
  portable_structure: [
    "Bring the useful structure back across contexts",
    "Carry the same small task model into a new format",
    "Return with the relationship intact",
    "Use the same structure without copying the old surface",
  ],
  right_operation: [
    "Use the right thinking operation at the right time",
    "Check, hold, update, then move",
    "Refresh what is true before relying on memory",
    "Keep enough structure to act without rechecking everything",
  ],
  review_and_bank: [
    "Keep what still works after a break",
    "Use the result to decide what to retain",
    "Return, test, then keep or revise",
    "Bank the useful part and reopen only what failed",
  ],
};

type WorkflowScenario = {
  result: string;
  constraint: string;
  competing: string;
  newFormat: string;
  changedDetail: string;
  returnTask: string;
  sources: string;
  delayedTask: string;
};

const WORKFLOW_SCENARIOS: Record<WorkflowChoice, WorkflowScenario> = {
  focused_work: {
    result: "finish the proposal",
    constraint: "keep it under two pages",
    competing: "email, chat and several open tabs",
    newFormat: "a spreadsheet replaces the email summary",
    changedDetail: "the supplier price changes",
    returnTask: "your draft after a meeting",
    sources: "the document, spreadsheet and meeting notes",
    delayedTask: "the project tomorrow morning",
  },
  study: {
    result: "answer the essay question",
    constraint: "separate evidence from interpretation",
    competing: "several papers, lecture notes and highlighted passages",
    newFormat: "a diagram presents the same mechanism differently from the textbook",
    changedDetail: "a new paper challenges one part of your explanation",
    returnTask: "the original question after solving a related problem",
    sources: "the textbook, paper, diagram and your notes",
    delayedTask: "your notes the next day",
  },
  ai_assisted: {
    result: "produce the final answer you actually need",
    constraint: "do not lose the evidence limits",
    competing: "a long AI response with many plausible suggestions",
    newFormat: "a new model gives a very different-looking answer",
    changedDetail: "the AI output misses one requirement",
    returnTask: "your own draft after exploring alternatives with AI",
    sources: "the chat answer, generated table and source document",
    delayedTask: "the AI-assisted task after time away",
  },
  everyday_planning: {
    result: "complete the most important part of the plan",
    constraint: "leave by 3:30",
    competing: "messages, errands and several small jobs",
    newFormat: "a train cancellation changes the route information",
    changedDetail: "one appointment moves",
    returnTask: "the original task after an interruption",
    sources: "your calendar, messages and notes",
    delayedTask: "the plan after a long interruption",
  },
};

function inferredSessionKind(context: CccRealLifePracticeContext): CccProgrammeSessionKind {
  if (context.sessionKind) return context.sessionKind;
  if (context.phase === "p1a_delayed_recheck") return "p1a_delayed_recheck";
  if (context.phase.startsWith("p1a_")) return "p1a_consolidation";
  if (context.phase.startsWith("p1b_")) return "p1b_wm_bridge";
  if (context.phase === "p1c_delayed_reentry") return "p1c_delayed_integration";
  if (context.phase.startsWith("p1c_")) return "p1c_operator_integration";
  return "p0_foundation";
}

function themeFamilyFor(context: CccRealLifePracticeContext): CccRealLifeThemeFamilyId {
  const sessionKind = inferredSessionKind(context);
  if (sessionKind === "p0_foundation") return "foundation_focus";
  if (sessionKind === "p1a_delayed_recheck") return "restart_state";
  if (sessionKind === "p1b_wm_bridge") {
    const progressionPhase = context.sessionAnchorPhase || context.phase;
    if (progressionPhase === "p1b_wm_arrow_stabilisation" || progressionPhase === "p1b_attention_bridge") return "task_state";
    if (progressionPhase === "p1b_wm_flow_first_contact" || progressionPhase === "p1b_wm_flow_recovery") return "relations_across_change";
    return "portable_structure";
  }
  if (sessionKind === "p1c_delayed_integration") return "review_and_bank";
  if (sessionKind === "p1c_operator_integration") return "right_operation";
  if (context.phase === "p1a_flow_first_contact") return "inspect_change";
  if (context.phase === "p1a_flow_recovery") return "adapt_locally";
  if (context.phase === "p1a_arrow_return") return "return_with_learning";
  if (context.phase === "p1a_relative_mix") return "switch_without_drift";
  return "steady_goal";
}

function themeVariant(family: CccRealLifeThemeFamilyId, context: CccRealLifePracticeContext): { id: string; title: string } {
  const titles = THEME_TITLES[family];
  const sessionNumber = Math.max(1, Math.round(context.sessionNumber || 1));
  const index = (sessionNumber - 1) % titles.length;
  return { id: `${family}-${index + 1}`, title: titles[index] };
}

function repeatedAngleIndex(context: CccRealLifePracticeContext): number {
  return (Math.max(1, Math.round(context.blockIndex || 1)) - 1) % 4;
}

function blockAngle(context: CccRealLifePracticeContext, family: CccRealLifeThemeFamilyId): { move: CccRealLifeMove; title: string; explanation: string } {
  if (context.phase === "signal_anchor") return {
    move: "find",
    title: "Pick the information that should steer the next choice",
    explanation: "This block asked you to find the main direction in a busy display. In ordinary tasks, the parallel is deciding which piece of information actually deserves to guide what you do next.",
  };
  if (context.phase === "arrow_rel_stabilisation") return {
    move: "hold",
    title: "Keep one useful reference point while details compete",
    explanation: "The display changed from simple left/right judgements to judging direction relative to position. The practical lesson is to keep a useful goal or limit steady while the surrounding details compete for attention.",
  };
  if (family === "steady_goal") return {
    move: "hold",
    title: "Let one criterion stay fixed long enough to become useful",
    explanation: "This stage builds a stable way of reading the task before another format is introduced. In real work, constant changes to the goal can make it impossible to tell whether a method is actually working.",
  };
  if (family === "inspect_change") return {
    move: "update",
    title: "Separate a changed presentation from a changed problem",
    explanation: "The same judgement arrived in a new-looking display. A useful real-world parallel is when information is reformatted or comes from a new source: first check whether the facts changed or only the presentation.",
  };
  if (family === "adapt_locally") return {
    move: "update",
    title: "Learn the new surface without rebuilding everything",
    explanation: "You stayed with the changed format long enough to learn it rather than abandoning the old rule after the first dip. In real tasks, that often means changing the affected part while keeping the rest of the plan intact.",
  };
  if (family === "return_with_learning") return {
    move: "act",
    title: "Come back to the familiar task with the useful update",
    explanation: "You returned to a familiar format after practising another one. The real-world test is whether you can resume the original task without either starting from zero or slipping back into the old routine unchanged.",
  };
  if (family === "switch_without_drift") return {
    move: "update",
    title: "Change how you read the information, not what you are trying to resolve",
    explanation: "The format alternated, so the way you inspected the display had to change while the task stayed stable. Real work often asks for the same thing when you move between documents, tables, messages or tools.",
  };
  if (family === "restart_state") return {
    move: "act",
    title: "Rebuild only the state you need after a gap",
    explanation: "You returned without an immediate warm-up. The everyday parallel is reopening a task later: recover what is already done, check what changed, and identify the next useful step instead of rebuilding the whole context.",
  };
  if (family === "task_state") {
    const angles = [
      { title: "Keep the result visible", explanation: "This memory block adds new information while asking you to preserve what matters from earlier. In a real task, the first part of that state is the result you are trying to produce." },
      { title: "Keep one important limit attached to the result", explanation: "Remembering the goal alone is often not enough. A useful task state also includes the condition that would make an otherwise good answer wrong or unusable." },
      { title: "Keep track of where you are in the sequence", explanation: "The comparison depends on what came before, not just what is visible now. In multi-step work, knowing the last completed step prevents unnecessary restarting." },
      { title: "Make the next step easy to recover", explanation: "A compact task state should help you continue after interruption. The useful memory is not every detail; it is enough structure to know what to do next." },
    ];
    const angle = angles[repeatedAngleIndex(context)];
    return { move: "hold", ...angle };
  }
  if (family === "relations_across_change") {
    const angles = [
      { title: "Keep the source attached to the information", explanation: "The memory demand stayed similar while the display changed. In real work, a claim is easier to judge when you still know where it came from." },
      { title: "Keep the condition attached to the recommendation", explanation: "A useful conclusion often depends on a limit, assumption or condition. When the presentation changes, keep that condition connected to the conclusion rather than remembering them separately." },
      { title: "Update one relationship without scrambling the rest", explanation: "New information can change one link in a task without changing every other link. The practical skill is selective updating rather than total reconstruction." },
      { title: "Check that the same pieces still belong together", explanation: "A changed format can make familiar information feel new. Before reorganising the task, check whether the same goal, evidence and constraint still form the relevant set." },
    ];
    const angle = angles[repeatedAngleIndex(context)];
    return { move: "update", ...angle };
  }
  if (family === "portable_structure") {
    const angles = [
      { title: "Bring the useful structure back to the earlier format", explanation: "Returning to a familiar display tests whether the relationship you learned elsewhere comes back with you." },
      { title: "Keep the same small task model across different surfaces", explanation: "When the display changes, the useful structure can stay compact: what you are trying to do, what must not be lost and what comes next." },
      { title: "Compare across formats without merging them", explanation: "Different sources can describe the same task differently. Keep their details separate while using the same goal and constraints to compare them." },
      { title: "Recover the structure quickly when the format changes again", explanation: "Portability means not having to rebuild the whole task model each time the presentation changes." },
    ];
    const angle = angles[repeatedAngleIndex(context)];
    return { move: context.phase === "p1b_wm_arrow_return" ? "act" : "hold", ...angle };
  }
  if (family === "right_operation") {
    if (context.phase === "p1c_wm_hold") return {
      move: "hold",
      title: "Keep the useful structure available while new information arrives",
      explanation: "This block asks you to carry a relationship forward while the stream continues. In a real task, that means keeping the result and one important limit available while you process something new.",
    };
    if (context.phase === "p1c_attention_reentry") return {
      move: "update",
      title: "Refresh the plan from what is true now",
      explanation: "After holding earlier information, you return to the current display. In real work, this is the point to update only the part of the plan that the new evidence actually changes.",
    };
    if (context.phase === "p1c_operator_mix") return {
      move: "act",
      title: "Stop checking when the next move is clear enough",
      explanation: "The task now alternates between finding what is present and holding what came before. In ordinary work, once the current facts and the important constraint line up, another round of checking may add less than taking the next reversible step.",
    };
    return {
      move: "find",
      title: "Check what is true now before relying on the remembered plan",
      explanation: "This block starts by reading the present situation. The real-world parallel is simple: memory tells you what you expected, but the current evidence tells you whether that plan still fits.",
    };
  }
  if (family === "review_and_bank") {
    if (context.phase === "p1c_wm_hold") return {
      move: "hold",
      title: "Recover the small amount of structure that is still useful",
      explanation: "After a delay, do not try to remember everything. Recover the result, the important limit and the next step that still matter now.",
    };
    if (context.phase === "p1c_attention_reentry") return {
      move: "update",
      title: "Check which old assumptions survived the break",
      explanation: "A delayed return is useful because it reveals what still works without immediate priming. Compare the old plan with the current situation and reopen only the parts that no longer fit.",
    };
    if (context.phase === "p1c_operator_mix") return {
      move: "act",
      title: "Keep the useful rule and move on",
      explanation: "Once the task still works across attention, memory and delay, the useful response is not endless rechecking. Keep the part that travels and use it in the next real situation.",
    };
    return {
      move: "find",
      title: "See what still works after time away",
      explanation: "The delayed return checks whether the useful pattern can be recovered after immediate context has faded. Real-world learning works the same way: see what survives before deciding what to practise or change next.",
    };
  }
  return {
    move: "find",
    title: "Notice the part that matters for the next decision",
    explanation: "Use the just-completed block to notice which information, relationship or change should matter outside the app. The concrete example below shows what that can look like in your selected workflow.",
  };
}

function concreteExample(family: CccRealLifeThemeFamilyId, context: CccRealLifePracticeContext): string {
  const scenario = WORKFLOW_SCENARIOS[context.workflow];
  const angle = repeatedAngleIndex(context);
  if (context.phase === "signal_anchor") return `You have ${scenario.competing}. Before switching again, name the one result you are trying to produce: “${scenario.result}”.`;
  if (context.phase === "arrow_rel_stabilisation" || family === "steady_goal") return `Keep “${scenario.result}” and “${scenario.constraint}” visible while deciding what deserves attention.`;
  if (family === "inspect_change") return `${scenario.newFormat}. Check whether the underlying facts changed or only the presentation before changing the plan.`;
  if (family === "adapt_locally") return `${scenario.changedDetail}. Change the affected part first while keeping “${scenario.result}” and “${scenario.constraint}” intact.`;
  if (family === "return_with_learning") return `When you return to ${scenario.returnTask}, start from the last completed step and carry forward the one useful update you learned elsewhere.`;
  if (family === "switch_without_drift") return `Move between ${scenario.sources}, but judge each one against the same result — “${scenario.result}” — and the same limit — “${scenario.constraint}”.`;
  if (family === "restart_state") return `When you reopen ${scenario.delayedTask}, state what is already done, what matters now and the next useful step before continuing.`;
  if (family === "task_state") {
    const examples = [
      `Keep the result visible: “${scenario.result}”.`,
      `Keep the result and one limit together: “${scenario.result}” + “${scenario.constraint}”.`,
      `After an interruption, note the last completed step before you decide what comes next in “${scenario.result}”.`,
      `Leave yourself a one-line next step for “${scenario.result}” so you can resume without reconstructing everything.`,
    ];
    return examples[angle];
  }
  if (family === "relations_across_change") {
    const examples = [
      `${scenario.newFormat}. Keep track of which source each claim came from before comparing them.`,
      `Keep the recommendation tied to its limit: “${scenario.constraint}”. A good-looking option that breaks that limit is still the wrong option.`,
      `${scenario.changedDetail}. Update the affected relationship without reopening every settled part of “${scenario.result}”.`,
      `When the presentation changes, check whether “${scenario.result}” and “${scenario.constraint}” still belong together before reorganising the task.`,
    ];
    return examples[angle];
  }
  if (family === "portable_structure") {
    const examples = [
      `Return to ${scenario.returnTask} with the same compact structure: “${scenario.result}” + “${scenario.constraint}” + the next step.`,
      `Move from one of ${scenario.sources} to another without rebuilding the task: keep “${scenario.result}” and “${scenario.constraint}” fixed.`,
      `Compare ${scenario.sources} against the same goal, but do not blend their details together before checking where each came from.`,
      `If the format changes again, recover just three things: “${scenario.result}”, “${scenario.constraint}” and what you will do next.`,
    ];
    return examples[angle];
  }
  if (family === "right_operation") {
    if (context.phase === "p1c_wm_hold") return `While new information arrives, keep “${scenario.result}” and “${scenario.constraint}” visible rather than relying on memory alone.`;
    if (context.phase === "p1c_attention_reentry") return `After checking the new information, change only the part of “${scenario.result}” that the evidence actually affects.`;
    if (context.phase === "p1c_operator_mix") return `If “${scenario.constraint}” is satisfied and the next step is reversible, continue with “${scenario.result}” instead of checking everything again.`;
    return `Before relying on your remembered plan for ${scenario.returnTask}, check what is true now.`;
  }
  if (family === "review_and_bank") return `When you reopen ${scenario.delayedTask}, compare what you expected with what actually happened; keep one part that worked and revise one part that did not.`;
  return `Use “${scenario.result}” and “${scenario.constraint}” as the concrete reference points for this block.`;
}

function missionCopy(family: CccRealLifeThemeFamilyId, workflow: WorkflowChoice): { cue: string; action: string } {
  const scenario = WORKFLOW_SCENARIOS[workflow];
  switch (family) {
    case "foundation_focus":
      return { cue: "several things compete for my attention", action: `I will name “${scenario.result}” and check “${scenario.constraint}” before switching again.` };
    case "steady_goal":
      return { cue: "a new source, tool or request changes how the task looks", action: `I will keep “${scenario.result}” and “${scenario.constraint}” visible before deciding whether the plan needs to change.` };
    case "inspect_change":
      return { cue: "information arrives in a new format", action: "I will ask what actually changed before changing the decision or rebuilding the task." };
    case "adapt_locally":
      return { cue: "one part of the plan stops fitting", action: `I will change the affected part first and keep “${scenario.result}” plus “${scenario.constraint}” intact unless the evidence says they also need to change.` };
    case "return_with_learning":
      return { cue: "I return to a task after working on something else", action: `I will name the last completed step towards “${scenario.result}” and carry forward the one useful update before continuing.` };
    case "switch_without_drift":
      return { cue: "I move between sources, tools or formats", action: `I will judge each one against the same result — “${scenario.result}” — and the same limit — “${scenario.constraint}”.` };
    case "restart_state":
      return { cue: "I reopen a task after a longer break", action: "I will name what is already done, what changed and the next useful step before continuing." };
    case "task_state":
      return { cue: "new information or an interruption arrives", action: `I will keep three short items visible: “${scenario.result}” · “${scenario.constraint}” · next useful step.` };
    case "relations_across_change":
      return { cue: "a familiar task appears in a different format", action: "I will keep the source, important condition and conclusion connected while I update only what the new information changes." };
    case "portable_structure":
      return { cue: "I switch back to a familiar task or format", action: `I will recover “${scenario.result}”, “${scenario.constraint}” and the next step rather than rebuilding the whole context.` };
    case "right_operation":
      return { cue: "I return to a task after something has changed", action: "I will check what is true now, keep the important limit in view, then take the next reversible step when it is clear enough." };
    case "review_and_bank":
      return { cue: "I revisit a task after enough time to lose the immediate context", action: "I will compare what I expected with what happened, keep one thing that worked and revise one thing that did not." };
  }
}

export function resolveRealLifePracticePreset(context: CccRealLifePracticeContext): CccRealLifePracticePreset {
  const family = themeFamilyFor(context);
  const theme = themeVariant(family, context);
  const angle = blockAngle(context, family);
  const example = concreteExample(family, context);
  const mission = missionCopy(family, context.workflow);
  return {
    id: `${theme.id}:${context.phase}:${Math.max(1, Math.round(context.blockIndex || 1))}`,
    version: CCC_REAL_LIFE_PRESET_VERSION,
    move: angle.move,
    themeFamilyId: family,
    themeId: theme.id,
    themeTitle: theme.title,
    angleTitle: angle.title,
    explanation: angle.explanation,
    example,
    missionCue: mission.cue,
    missionAction: mission.action,
    title: theme.title,
    cue: mission.cue,
    action: mission.action,
  };
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
    themeFamilyId: selectedPreset.themeFamilyId,
    themeId: selectedPreset.themeId,
    sessionKind: inferredSessionKind(context),
    sessionNumber: Math.max(1, Math.round(context.sessionNumber || 1)),
    blockIndex: Math.max(1, Math.round(context.blockIndex || 1)),
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
    sessionId: mission.sourceSessionId,
    sessionKind: mission.sessionKind,
    sessionNumber: mission.sessionNumber,
    blockIndex: mission.blockIndex,
  });
}
