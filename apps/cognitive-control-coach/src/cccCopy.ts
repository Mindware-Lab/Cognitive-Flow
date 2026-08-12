import type { CccProgrammePhase, CccRegimeId } from "./cccTypes";

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

export const PHASE_COPY: Record<Exclude<CccProgrammePhase, "practice">, {
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
  p1a_arrow_stabilisation: {
    eyebrow: "Stabilise the rule",
    title: "Strengthen In and Out before the next change",
    body: "Use the same relative decision across two different work conditions. Accuracy, decision time and value remain separate readings.",
    bridge: "A reliable strategy needs to hold before its presentation changes again.",
  },
  p1a_flow_first_contact: {
    eyebrow: "Protected first contact",
    title: "Meet the moving format without practice credit",
    body: "Expansion and contraction appear as a fresh check. These first responses are kept apart from the recovery that follows.",
    bridge: "The first attempt after a tool or display changes reveals disruption that later familiarity can hide.",
  },
  p1a_flow_recovery: {
    eyebrow: "Recover in motion",
    title: "Rebuild the same decision in moving evidence",
    body: "Find the majority motion while clarity and decision costs change across the two work conditions.",
    bridge: "Recovery means regaining the useful rule rather than merely spending more time with the new surface.",
  },
  p1a_arrow_return: {
    eyebrow: "Protect the base",
    title: "Return to arrows without losing the familiar rule",
    body: "Come back to In and Out arrows after motion and check that adaptation has not displaced the original skill.",
    bridge: "A portable strategy should still work when you return to the original tool or task view.",
  },
  p1a_relative_mix: {
    eyebrow: "Stabilise across formats",
    title: "Switch between arrows and motion",
    body: "The surface changes from trial to trial while the relative decision remains In or Out.",
    bridge: "Mixed practice asks you to preserve the goal while the source or interface changes repeatedly.",
  },
  p1a_delayed_recheck: {
    eyebrow: "Fresh delayed re-check",
    title: "See what returns after time away",
    body: "This mixed-format check comes before any same-day recovery practice. Only new responses from the scheduled return count.",
    bridge: "A skill that reappears after a break is stronger evidence than performance measured immediately after practice.",
  },
  p1b_attention_bridge: {
    eyebrow: "Read the present",
    title: "Find the current relation before holding it",
    body: "Resolve the majority In or Out relation under the two work conditions. The next stage will ask whether that relation repeats over time.",
    bridge: "Working memory cannot protect a relation that was not extracted accurately in the first place.",
  },
  p1b_wm_arrow_stabilisation: {
    eyebrow: "Hold the relation",
    title: "Compare the current arrow relation with an earlier one",
    body: "Choose Match or Different. The first one or two patterns in each condition fill the memory buffer and are not scored.",
    bridge: "This practises keeping the relevant relation available while new information arrives.",
  },
  p1b_wm_flow_first_contact: {
    eyebrow: "Memory through change",
    title: "Carry the held relation into motion",
    body: "The memory rule stays Match or Different while arrows become moving relational patterns. First contact remains diagnostic.",
    bridge: "The challenge is to preserve what matters when both new evidence and a new presentation arrive.",
  },
  p1b_wm_flow_recovery: {
    eyebrow: "Recover the held relation",
    title: "Settle the memory rule in motion",
    body: "Continue comparing the current motion relation with the one held from one or two steps earlier.",
    bridge: "Recovery means holding the same dependency after the surrounding format changes.",
  },
  p1b_wm_arrow_return: {
    eyebrow: "Return with memory",
    title: "Bring the relation back to arrows",
    body: "Return to the familiar arrow display while keeping the same Match or Different memory rule.",
    bridge: "Returning tests whether adapting to a new tool has made the original workflow less accessible.",
  },
  p1b_wm_relative_mix: {
    eyebrow: "Hold across formats",
    title: "Keep the relation while arrows and motion alternate",
    body: "Compare relations across time even when the current surface differs from the one held in memory.",
    bridge: "In real workflows, a dependency may begin in one source and need to be checked in another.",
  },
  p1c_attention_entry: {
    eyebrow: "Return to now",
    title: "Read the relation that is present",
    body: "Begin with a direct majority decision in one format before memory load is added.",
    bridge: "This establishes the current signal before asking you to hold and update it.",
  },
  p1c_delayed_reentry: {
    eyebrow: "Final delayed re-entry",
    title: "See whether the control loop returns after time away",
    body: "This direct relation check comes before any same-day memory or re-entry practice. Its fresh timing is protected.",
    bridge: "Returning after a break tests whether the trained control sequence can be re-entered without an immediate warm-up.",
  },
  p1c_wm_hold: {
    eyebrow: "Hold over time",
    title: "Keep the relation active as new patterns arrive",
    body: "Choose Match or Different using the same display and work conditions as the preceding attention block.",
    bridge: "The task moves from what matters now to whether that same relation persists across time.",
  },
  p1c_attention_reentry: {
    eyebrow: "Re-enter the present",
    title: "Release the memory rule and read what is here now",
    body: "Return to a direct majority decision in the same format. This checks whether the simpler control operation remains available.",
    bridge: "After holding several dependencies, effective work often requires returning cleanly to the immediate next decision.",
  },
  p1c_operator_mix: {
    eyebrow: "Switch the operation",
    title: "Hold the format while the mental operation changes",
    body: "Use the same visual surface for a final relational-memory block. The format stays fixed at the operation boundary.",
    bridge: "Flexible control means changing what you do with information without also needing the interface to change.",
  },
};

export function workflowBridge(phase: Exclude<CccProgrammePhase, "practice">, workflow: WorkflowChoice): string {
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
