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

export const REGIME_COPY: Record<CccRegimeId, { title: string; instruction: string; cue: string; strategy: string }> = {
  clear_sprint: {
    title: "Move when it is clear",
    instruction: "The pattern is often clear and the available points fade quickly.",
    cue: "Find what matters, then make the call.",
    strategy: "Aim for enough certainty to see the majority, then commit before too many points disappear.",
  },
  calculated_risk: {
    title: "Read a changing pattern",
    instruction: "The pattern is often less clear and the available points fade quickly.",
    cue: "Take in enough before you choose.",
    strategy: "Take in a little more information for close patterns, without waiting for perfect certainty.",
  },
  clean_precision: {
    title: "Check before you choose",
    instruction: "The pattern is often clear, but a wrong answer costs more.",
    cue: "Use the time you need, then make your best choice.",
    strategy: "Protect against the costly error, but commit once the clear majority is reliable.",
  },
  deep_check: {
    title: "Take the time you need",
    instruction: "The pattern is often close and a wrong answer costs more.",
    cue: "Keep looking, then make your best choice.",
    strategy: "Build more certainty before choosing; here, avoiding a wrong answer is worth extra viewing time.",
  },
};

export const PHASE_COPY: Record<Exclude<CccProgrammePhase, "practice">, {
  eyebrow: string;
  title: string;
  body: string;
  bridge: string;
}> = {
  signal_anchor: {
    eyebrow: "Check the pattern",
    title: "Start with a quick pattern check",
    body: "The arrows appear briefly, then a mask covers them. Choose Left or Right every time; the viewing time adapts to your answers.",
    bridge: "Start by finding the main direction when several arrows compete for your attention.",
  },
  arrow_rel_stabilisation: {
    eyebrow: "Find the main direction",
    title: "Move from Left and Right to In and Out",
    body: "Choose whether most arrows point towards the centre or away from it. The two work conditions change difficulty, time pressure and the cost of a wrong choice.",
    bridge: "In a demanding workflow, what matters often depends on whether information supports the goal—not simply where it appears.",
  },
  flow_rel_first_contact: {
    eyebrow: "Train through change",
    title: "The same pattern is about to move",
    body: "The arrows become circular patches of moving flecks. Choose whether most patches move towards or away from the centre.",
    bridge: "A dashboard, document or AI output can change its presentation while the underlying decision still points towards or away from the goal.",
  },
  flow_rel_recovery: {
    eyebrow: "Find the pattern again",
    title: "Settle into the moving pattern",
    body: "Keep finding the majority motion. Take the time you need, then make your best choice.",
    bridge: "When a tool or source changes, return to the main rule before reacting to its new appearance.",
  },
  arrow_rel_return: {
    eyebrow: "Return to the familiar",
    title: "Come back to radial arrows",
    body: "Return to In and Out arrows and check that the familiar rule still feels clear after working with motion.",
    bridge: "Adaptation should not make the familiar workflow harder when you return to it.",
  },
  relative_mix: {
    eyebrow: "Keep the rule across formats",
    title: "Switch without losing In and Out",
    body: "Radial arrows and centre-directed motion will alternate. The display changes, but your In or Out choice stays the same.",
    bridge: "This resembles moving between sources, tools or views while keeping the same work or study goal active.",
  },
  p1a_arrow_stabilisation: {
    eyebrow: "Stabilise the rule",
    title: "Strengthen In and Out before the next change",
    body: "Use the same In or Out choice across two different work conditions. Notice how speed and accuracy change.",
    bridge: "A reliable strategy needs to hold before its presentation changes again.",
  },
  p1a_flow_first_contact: {
    eyebrow: "Meet a new format",
    title: "Try the moving pattern for the first time",
    body: "The arrows become patches of flecks moving towards or away from the centre. Keep using the same In or Out choice.",
    bridge: "A new tool or display can look unfamiliar even when the goal stays the same.",
  },
  p1a_flow_recovery: {
    eyebrow: "Recover in motion",
    title: "Rebuild the same decision in motion",
    body: "Find the majority motion while clarity, time pressure and points change across the two work conditions.",
    bridge: "When a tool changes, return to the useful rule instead of getting caught by its new appearance.",
  },
  p1a_arrow_return: {
    eyebrow: "Return to the familiar",
    title: "Return to arrows without losing the familiar rule",
    body: "Come back to In and Out arrows after motion and use the familiar rule again.",
    bridge: "A useful strategy should still work when you return to the original tool or task view.",
  },
  p1a_relative_mix: {
    eyebrow: "Stabilise across formats",
    title: "Switch between arrows and motion",
    body: "The display changes from one pattern to the next while your choice remains In or Out.",
    bridge: "Keep the goal in mind while the source or interface changes repeatedly.",
  },
  p1a_delayed_recheck: {
    eyebrow: "Return after a break",
    title: "See what returns after time away",
    body: "Switch between arrows and motion again after spending some time away from the app.",
    bridge: "Returning after a break is a useful chance to notice what comes back easily and what needs a little more practice.",
  },
  p1b_attention_bridge: {
    eyebrow: "Read the present",
    title: "Find the current pattern before holding it",
    body: "Find whether most arrows point In or Out under the two work conditions. The next stage will ask whether that pattern repeats over time.",
    bridge: "Find the current pattern clearly before trying to remember and compare it.",
  },
  p1b_wm_arrow_stabilisation: {
    eyebrow: "Hold the pattern",
    title: "Compare the current arrow pattern with an earlier one",
    body: "Choose Match or Different. The first one or two patterns give you something to compare with and are not scored.",
    bridge: "This practises keeping the important pattern in mind while new information arrives.",
  },
  p1b_wm_flow_first_contact: {
    eyebrow: "Memory through change",
    title: "Carry the remembered pattern into motion",
    body: "The choice stays Match or Different while arrows become moving patterns.",
    bridge: "The challenge is to remember what matters while new information arrives in a new form.",
  },
  p1b_wm_flow_recovery: {
    eyebrow: "Find the remembered pattern",
    title: "Settle the memory rule in motion",
    body: "Continue comparing the current motion pattern with the one from one or two steps earlier.",
    bridge: "Keep the same important detail in mind after the surrounding format changes.",
  },
  p1b_wm_arrow_return: {
    eyebrow: "Return with memory",
    title: "Bring the remembered pattern back to arrows",
    body: "Return to the familiar arrow display while keeping the same Match or Different memory rule.",
    bridge: "After using a new tool, return to the original view and pick up the task again.",
  },
  p1b_wm_relative_mix: {
    eyebrow: "Hold across formats",
    title: "Keep the pattern while arrows and motion alternate",
    body: "Compare patterns across time even when the current display differs from the one you remember.",
    bridge: "In real workflows, an important detail may begin in one source and need to be checked in another.",
  },
  p1c_attention_entry: {
    eyebrow: "Return to now",
    title: "Read the pattern that is present",
    body: "Begin with a direct majority choice in one format before adding a memory step.",
    bridge: "Start with what is here now before asking yourself to remember and compare it.",
  },
  p1c_delayed_reentry: {
    eyebrow: "Final return",
    title: "Come back after time away",
    body: "Start with a direct majority choice before moving into the memory stages.",
    bridge: "After a break, pause for a moment and return to the goal before continuing.",
  },
  p1c_wm_hold: {
    eyebrow: "Hold over time",
    title: "Keep the pattern in mind as new patterns arrive",
    body: "Choose Match or Different using the same display and work conditions as the previous stage.",
    bridge: "The task moves from what matters now to whether that same pattern returns over time.",
  },
  p1c_attention_reentry: {
    eyebrow: "Re-enter the present",
    title: "Release the memory rule and read what is here now",
    body: "Return to a direct majority choice in the same format.",
    bridge: "After holding several details in mind, return cleanly to the next decision in front of you.",
  },
  p1c_operator_mix: {
    eyebrow: "Switch what you do",
    title: "Keep the display while the task changes",
    body: "Use the same visual display for a final round of remembering and comparing.",
    bridge: "Sometimes the information stays the same while the question you need to answer changes.",
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

export const EVIDENCE_BOUNDARY_COPY = "Use your app results as a guide. The most useful check is whether the skill helps in the work, study or everyday task you chose.";
