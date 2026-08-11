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
    cue: "Use the time you need, then make your best choice.",
  },
  deep_check: {
    title: "Take the time you need",
    instruction: "The pattern is often close and a wrong answer costs more.",
    cue: "Keep looking, then make your best choice.",
  },
};

export const PHASE_COPY: Record<Exclude<CccP0Phase, "practice">, {
  eyebrow: string;
  title: string;
  body: string;
  bridge: string;
}> = {
  signal_anchor: {
    eyebrow: "Check the signal",
    title: "Start with a protected signal check",
    body: "The arrows appear briefly, then a mask covers them. Choose Left or Right every time; the viewing time adapts to your answers.",
    bridge: "This checks how much competing visual information you can resolve under controlled timing. It is kept apart from the later decision-policy practice.",
  },
  arrow_rel_stabilisation: {
    eyebrow: "Find the relation",
    title: "Move from Left and Right to In and Out",
    body: "Choose whether most arrows point towards the centre or away from it. The two work conditions change clarity, time pressure and the cost of a wrong choice.",
    bridge: "In a demanding workflow, relevance is often relational: whether information supports or moves away from the goal—not simply where it appears.",
  },
  flow_rel_first_contact: {
    eyebrow: "Train through change",
    title: "The same relation is about to move",
    body: "The arrows become moving dot fields. Choose whether most fields expand or contract; your first encounter is protected from later recovery practice.",
    bridge: "A dashboard, document or AI output can change its presentation while the underlying decision still points towards or away from the goal.",
  },
  flow_rel_recovery: {
    eyebrow: "Recover the same relation",
    title: "Settle into expansion and contraction",
    body: "Keep finding the majority motion while the evidence moves. Adjust how long you look across the two work conditions, then make a forced choice.",
    bridge: "When a tool or source changes, recover the governing relation before reacting to new surface detail.",
  },
  arrow_rel_return: {
    eyebrow: "Return without losing the base",
    title: "Come back to radial arrows",
    body: "Return to In and Out arrows and check that the relative rule remains available after adapting to motion.",
    bridge: "Adaptation should not make the familiar workflow harder when you return to it.",
  },
  relative_mix: {
    eyebrow: "Keep the relation across formats",
    title: "Switch without losing In and Out",
    body: "Radial arrows and expanding or contracting motion will alternate. The carrier changes; the relative decision stays the same.",
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
      action: "Write down the one output that matters before your next high-focus task. After an interruption, restate it before continuing.",
    },
    study: {
      title: "Reconnect to a study task",
      action: "Write down the question you need to answer. Bring it with you whenever you move between sources or notes.",
    },
    ai_assisted: {
      title: "Reconnect to an AI-assisted task",
      action: "Write down the constraint an AI answer must satisfy. Recheck it before accepting or revising each new output.",
    },
    everyday_planning: {
      title: "Reconnect to an everyday task",
      action: "Name the next useful decision. After an interruption or change of plan, return to it before acting.",
    },
  };
  return actions[workflow];
}

export const EVIDENCE_BOUNDARY_COPY = "This exercise records practice and recovery across its trained formats. Use the reconnect prompt as a separate real-life check; an in-app score does not establish a wider benefit.";
