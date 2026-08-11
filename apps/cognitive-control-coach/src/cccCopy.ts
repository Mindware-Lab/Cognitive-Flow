import type { CccP0Phase, CccRegimeId } from "./cccTypes";

export type WorkflowChoice = "focused_work" | "study" | "ai_assisted" | "everyday_planning";

export const WORKFLOW_CHOICES: Record<WorkflowChoice, { label: string; shortLabel: string; example: string }> = {
  focused_work: {
    label: "Focused work",
    shortLabel: "your work",
    example: "Keep the main output active while messages, documents and displays compete for attention.",
  },
  study: {
    label: "Demanding study",
    shortLabel: "your study",
    example: "Keep the question you are answering active as sources, notes and formats change.",
  },
  ai_assisted: {
    label: "AI-assisted work",
    shortLabel: "your AI-assisted task",
    example: "Keep the goal and constraints active while prompts, drafts and tool outputs change.",
  },
  everyday_planning: {
    label: "Everyday planning",
    shortLabel: "your everyday task",
    example: "Return to the next useful decision after an interruption or change of plan.",
  },
};

export const REGIME_COPY: Record<CccRegimeId, { title: string; instruction: string; cue: string }> = {
  clear_sprint: {
    title: "Move when it is clear",
    instruction: "The pattern is often clear and the available points fade quickly.",
    cue: "Find what matters, then make the call.",
  },
  calculated_risk: {
    title: "Read a changing pattern",
    instruction: "The pattern is often less clear and the available points fade quickly.",
    cue: "Take in enough before you choose.",
  },
  clean_precision: {
    title: "Check before you choose",
    instruction: "The pattern is often clear, but a wrong answer costs more.",
    cue: "Use the time you need; do not guess.",
  },
  deep_check: {
    title: "Take the time you need",
    instruction: "The pattern is often close and a wrong answer costs more.",
    cue: "Keep looking until the evidence is good enough.",
  },
};

export const PHASE_COPY: Record<Exclude<CccP0Phase, "practice">, {
  eyebrow: string;
  title: string;
  body: string;
  bridge: string;
}> = {
  arrow_stabilisation: {
    eyebrow: "Find what matters",
    title: "Build a steady starting point",
    body: "Choose the direction followed by most arrows. The points help you practise when to answer and when not to guess.",
    bridge: "In a crowded task, this is the move of finding the instruction, figure or signal that matters now.",
  },
  flow_first_contact: {
    eyebrow: "Train through change",
    title: "The display is about to move",
    body: "The look of the task will change, but your goal will not: find the direction followed by most patterns.",
    bridge: "A dashboard, document or AI output can change its presentation while the underlying goal stays the same.",
  },
  flow_recovery: {
    eyebrow: "Recover the same skill",
    title: "Settle into the new format",
    body: "Keep finding the majority direction while the information moves. Use the same careful decision rule as before.",
    bridge: "When a tool or source changes, recover the goal before reacting to the new surface details.",
  },
  arrow_return: {
    eyebrow: "Return without losing the base",
    title: "Come back to the original format",
    body: "Return to arrows and check that the starting task still feels clear after adapting to motion.",
    bridge: "Adaptation should not make the familiar workflow harder when you return to it.",
  },
  absolute_mix: {
    eyebrow: "Keep the goal across formats",
    title: "Switch without losing what matters",
    body: "Arrows and moving patterns will now alternate. The surface changes; the decision stays the same.",
    bridge: "This resembles moving between sources, tools or views while keeping the same work or study goal active.",
  },
};

export function workflowBridge(phase: Exclude<CccP0Phase, "practice">, workflow: WorkflowChoice): string {
  const context = WORKFLOW_CHOICES[workflow];
  return `${PHASE_COPY[phase].bridge} For ${context.shortLabel}, the aim is to notice the change without dropping the task.`;
}

export function reconnectAction(workflow: WorkflowChoice): { title: string; action: string } {
  const actions: Record<WorkflowChoice, { title: string; action: string }> = {
    focused_work: {
      title: "Reconnect to a focused work task",
      action: "Before your next high-focus task, write down the one output that matters. When a message, document or display interrupts you, restate that output before continuing.",
    },
    study: {
      title: "Reconnect to a study task",
      action: "Before your next reading block, write down the question you need to answer. When you move between sources or notes, bring that question with you.",
    },
    ai_assisted: {
      title: "Reconnect to an AI-assisted task",
      action: "Before opening an AI tool, write down the constraint its answer must satisfy. After each new output, check that the constraint is still active before accepting or revising the result.",
    },
    everyday_planning: {
      title: "Reconnect to an everyday task",
      action: "Before a multi-step task, name the next useful decision. After an interruption or change of plan, return to that decision before acting.",
    },
  };
  return actions[workflow];
}

export const EVIDENCE_BOUNDARY_COPY = "This exercise records practice and recovery across its trained formats. Use the reconnect prompt as a separate real-life check; an in-app score does not establish a wider benefit.";
