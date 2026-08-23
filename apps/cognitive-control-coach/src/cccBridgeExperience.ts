import { WORKFLOW_CHOICES, type WorkflowChoice } from "./cccCopy";
import {
  CCC_BRIDGE_MOVE_COPY,
  bridgePromptStrength,
  type CccBridgeLevel,
  type CccBridgeMove,
  type CccBridgeProgressionState,
} from "./cccBridgeProgression";

export type CccBridgeSessionEndKind =
  | "guided_mission"
  | "retrieval_mission"
  | "personalise_mission"
  | "no_new_mission"
  | "changed_context_mission"
  | "no_new_delayed_mission";

export type CccBridgeWelcomeProbeKind = "none" | "faded" | "delayed";

export interface CccBridgeMoveOption {
  move: CccBridgeMove;
  label: string;
  definition: string;
  question: string;
}

export interface CccBridgeCueOption {
  id: string;
  label: string;
  detail: string;
}

export interface CccBridgeSessionEndModel {
  level: CccBridgeLevel;
  kind: CccBridgeSessionEndKind;
  kicker: string;
  title: string;
  body: string;
  showMoveDefinition: boolean;
  promptStrength: ReturnType<typeof bridgePromptStrength>;
}

export interface CccBridgeWelcomeProbeModel {
  kind: CccBridgeWelcomeProbeKind;
  kicker: string;
  title: string;
  body: string;
  revealMoveOnlyAfterPositiveResponse: boolean;
}

export const CCC_BRIDGE_MOVE_OPTIONS: readonly CccBridgeMoveOption[] = (
  Object.entries(CCC_BRIDGE_MOVE_COPY) as Array<[CccBridgeMove, (typeof CCC_BRIDGE_MOVE_COPY)[CccBridgeMove]]>
).map(([move, copy]) => ({ move, ...copy }));

const GENERIC_CUES: Record<CccBridgeMove, { label: string; detail: string }> = {
  find: {
    label: "Several things compete for attention",
    detail: "Different messages, sources or tasks are pulling you in different directions.",
  },
  hold: {
    label: "You return after an interruption",
    detail: "You need to recover the result, important limit and next useful step.",
  },
  update: {
    label: "Something relevant changes",
    detail: "New information affects part of the task, but not necessarily all of it.",
  },
  act: {
    label: "You have enough but keep checking",
    detail: "The next step is supported and reversible, but you are still gathering more information.",
  },
};

const WORKFLOW_CUE_DETAILS: Record<WorkflowChoice, Partial<Record<CccBridgeMove, string>>> = {
  focused_work: {
    find: "Email, chat, tabs or requests compete while you are trying to finish one piece of work.",
    hold: "A meeting or message interrupts a document, analysis or project task.",
    update: "A new figure, request or source changes one part of the work.",
    act: "You keep checking a draft or decision after the next useful step is already clear.",
  },
  study: {
    find: "Several papers, notes or ideas compete while you are trying to answer one question.",
    hold: "You return to reading or writing after a break and need to recover where you were.",
    update: "A new paper or example changes one part of your explanation.",
    act: "You keep collecting material after you have enough to make the next argument or study decision.",
  },
  ai_assisted: {
    find: "A long AI response contains many plausible suggestions and you need the part that matters for your goal.",
    hold: "You move between AI output, your own draft and source material without losing the goal or evidence limit.",
    update: "AI output changes or misses one requirement and only part of the plan needs revision.",
    act: "You keep prompting or comparing outputs after you already have enough to take the next useful step yourself.",
  },
  everyday_planning: {
    find: "Messages, errands and small jobs compete with the most important part of your plan.",
    hold: "You return to a plan after an interruption and need to recover what is already done and what comes next.",
    update: "An appointment, route or practical constraint changes one part of the plan.",
    act: "You keep reconsidering options after you have enough information for a sensible next step.",
  },
};

export function bridgeCueOptions(workflow: WorkflowChoice): readonly CccBridgeCueOption[] {
  return (Object.keys(GENERIC_CUES) as CccBridgeMove[]).map((move) => ({
    id: `cue_${move}`,
    label: GENERIC_CUES[move].label,
    detail: WORKFLOW_CUE_DETAILS[workflow][move] || GENERIC_CUES[move].detail,
  }));
}

export function moveForCueOption(cueId: string): CccBridgeMove | null {
  const move = cueId.replace(/^cue_/, "") as CccBridgeMove;
  return move in CCC_BRIDGE_MOVE_COPY ? move : null;
}

export function bridgeActionForMove(move: CccBridgeMove, workflow: WorkflowChoice): string {
  const context = WORKFLOW_CHOICES[workflow].label.toLowerCase();
  switch (move) {
    case "find":
      return `In ${context}, identify the result you are trying to produce and the information that should steer the next choice.`;
    case "hold":
      return `In ${context}, recover the result, one important limit and the next useful step before continuing.`;
    case "update":
      return `In ${context}, change the part affected by the new information and keep the parts that still fit.`;
    case "act":
      return `In ${context}, when the important constraint is satisfied and the next step is supported, take that step instead of checking everything again.`;
  }
}

export function bridgeSessionEndModel(state: CccBridgeProgressionState): CccBridgeSessionEndModel {
  const promptStrength = bridgePromptStrength(state.level);
  switch (state.level) {
    case "b1_guided":
      return {
        level: state.level,
        kind: "guided_mission",
        kicker: "One method to try",
        title: "Use today's move once in a real task.",
        body: "The app will give you the cue and the action. Try it once before your next session.",
        showMoveDefinition: true,
        promptStrength,
      };
    case "b2_retrieval":
      return {
        level: state.level,
        kind: "retrieval_mission",
        kicker: "Recover the move",
        title: "Which CCC move fits this situation?",
        body: "Use the cue first. Choose Find, Hold, Update or Act before the app reveals the suggested action.",
        showMoveDefinition: false,
        promptStrength,
      };
    case "b3_personalised":
      return {
        level: state.level,
        kind: "personalise_mission",
        kicker: "Make the cue yours",
        title: "Choose a situation you actually meet.",
        body: "Pick a recurring cue from your own kind of work, study or everyday activity, then choose the CCC move you want that cue to recover.",
        showMoveDefinition: false,
        promptStrength,
      };
    case "b4_faded":
      return {
        level: state.level,
        kind: "no_new_mission",
        kicker: "Less prompting now",
        title: "No new strategy to remember today.",
        body: "Continue normally. On a later visit the app will ask whether one of the methods came to mind without naming it first.",
        showMoveDefinition: false,
        promptStrength,
      };
    case "b5_changed_context":
      return {
        level: state.level,
        kind: "changed_context_mission",
        kicker: "Same move, different situation",
        title: "Try the same method somewhere different.",
        body: "Keep the control move the same while changing the real-world context. The aim is recovery of the invariant, not a new strategy.",
        showMoveDefinition: false,
        promptStrength,
      };
    case "b6_delayed":
      return {
        level: state.level,
        kind: "no_new_delayed_mission",
        kicker: "Unsupported recovery",
        title: "No new mission today.",
        body: "The next delayed check asks what survived without an explicit reminder.",
        showMoveDefinition: false,
        promptStrength,
      };
  }
}

export function bridgeWelcomeProbeModel(state: CccBridgeProgressionState): CccBridgeWelcomeProbeModel {
  if (state.level === "b4_faded") {
    return {
      kind: "faded",
      kicker: "Real-life check-in",
      title: "Did one of the CCC methods come to mind while you were doing something else?",
      body: "Answer before the app names the four moves. This is a self-report about independent recall, not a training score.",
      revealMoveOnlyAfterPositiveResponse: true,
    };
  }
  if (state.level === "b6_delayed") {
    return {
      kind: "delayed",
      kicker: "Delayed real-life check",
      title: "Over the last few days, did you use anything from CCC without the app reminding you first?",
      body: "If yes, the app will ask what you used and what brought it to mind. This remains separate from cognitive task progression.",
      revealMoveOnlyAfterPositiveResponse: true,
    };
  }
  return {
    kind: "none",
    kicker: "",
    title: "",
    body: "",
    revealMoveOnlyAfterPositiveResponse: false,
  };
}

export function changedContextOptions(
  sourceWorkflow: WorkflowChoice,
): ReadonlyArray<{ workflow: WorkflowChoice; label: string; example: string }> {
  return (Object.entries(WORKFLOW_CHOICES) as Array<[WorkflowChoice, (typeof WORKFLOW_CHOICES)[WorkflowChoice]]>)
    .filter(([workflow]) => workflow !== sourceWorkflow)
    .map(([workflow, copy]) => ({ workflow, label: copy.label, example: copy.example }));
}
