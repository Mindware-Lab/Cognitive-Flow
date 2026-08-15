import type { CccProgrammePhase, CccRegimeId } from "./cccTypes";

export type WorkflowChoice = "focused_work" | "study" | "ai_assisted" | "everyday_planning";

export const WORKFLOW_CHOICES: Record<WorkflowChoice, { label: string; shortLabel: string; example: string }> = {
  focused_work: {
    label: "Focused work",
    shortLabel: "your work",
    example: "Stay with the main task when messages or documents compete for attention.",
  },
  study: {
    label: "Demanding study",
    shortLabel: "your study",
    example: "Keep your main question in mind as sources and notes change.",
  },
  ai_assisted: {
    label: "AI-assisted work",
    shortLabel: "your AI-assisted task",
    example: "Keep your goal in mind as prompts, drafts and outputs change.",
  },
  everyday_planning: {
    label: "Everyday planning",
    shortLabel: "your everyday task",
    example: "Return to the next useful step after an interruption.",
  },
};

export const REGIME_COPY: Record<CccRegimeId, { title: string; instruction: string; cue: string; strategy: string }> = {
  clear_sprint: {
    title: "Move when it is clear",
    instruction: "Patterns are usually clear, but points fade quickly.",
    cue: "Find the majority, then choose.",
    strategy: "Choose as soon as the majority is clear enough.",
  },
  calculated_risk: {
    title: "Read a changing pattern",
    instruction: "Patterns are often close and points fade quickly.",
    cue: "Look carefully, but do not wait too long.",
    strategy: "Give close patterns a little more time, then choose.",
  },
  clean_precision: {
    title: "Check before you choose",
    instruction: "Patterns are usually clear, but mistakes cost more.",
    cue: "Check the majority before choosing.",
    strategy: "Take enough time to avoid a costly mistake.",
  },
  deep_check: {
    title: "Take the time you need",
    instruction: "Patterns are often close and mistakes cost more.",
    cue: "Take time to be sure enough.",
    strategy: "Look longer when the majority is hard to see.",
  },
};

export const PHASE_COPY: Record<Exclude<CccProgrammePhase, "practice">, {
  eyebrow: string;
  title: string;
  body: string;
  bridge: string;
}> = {
  signal_anchor: {
    eyebrow: "Left or Right",
    title: "Find the main direction",
    body: "Watch the arrows. After the mask, choose Left or Right.",
    bridge: "Find the direction followed by most arrows.",
  },
  arrow_rel_stabilisation: {
    eyebrow: "In or Out",
    title: "Find the main direction",
    body: "Choose whether most arrows point towards or away from the centre.",
    bridge: "Keep the main direction in mind.",
  },
  flow_rel_first_contact: {
    eyebrow: "Moving dots",
    title: "Use the same In or Out rule",
    body: "Choose whether most dot patches move towards or away from the centre.",
    bridge: "The display changes; the choice stays the same.",
  },
  flow_rel_recovery: {
    eyebrow: "Moving dots",
    title: "Keep finding the main direction",
    body: "Choose the direction followed by most dot patches.",
    bridge: "Return to the In or Out rule.",
  },
  arrow_rel_return: {
    eyebrow: "Return to the familiar",
    title: "Return to arrows",
    body: "Use the In or Out rule with arrows again.",
    bridge: "Return to the familiar display.",
  },
  relative_mix: {
    eyebrow: "Switch displays",
    title: "Keep the In or Out rule",
    body: "Arrows and moving dots will alternate. Your choice stays the same.",
    bridge: "Keep the rule as the display changes.",
  },
  p1a_arrow_stabilisation: {
    eyebrow: "In or Out",
    title: "Strengthen the arrow rule",
    body: "Find the direction followed by most arrows.",
    bridge: "Keep the same rule across different point conditions.",
  },
  p1a_flow_first_contact: {
    eyebrow: "Moving dots",
    title: "Use the same rule with moving dots",
    body: "Choose whether most dot patches move In or Out.",
    bridge: "The display changes; the choice stays the same.",
  },
  p1a_flow_recovery: {
    eyebrow: "Moving dots",
    title: "Keep practising the same rule",
    body: "Find the direction followed by most dot patches.",
    bridge: "Return to the In or Out rule.",
  },
  p1a_arrow_return: {
    eyebrow: "Return to the familiar",
    title: "Return to arrows",
    body: "Use the In or Out rule with arrows again.",
    bridge: "Return to the familiar display.",
  },
  p1a_relative_mix: {
    eyebrow: "New binary pair",
    title: "Clockwise or Anti-clockwise",
    body: "The choice is still binary, but this block uses the rotational pair. The pair stays fixed until the block ends.",
    bridge: "Keep the active two-choice rule clear as the display changes.",
  },
  p1a_delayed_recheck: {
    eyebrow: "Return after a break",
    title: "Switch between both displays again",
    body: "Return using the clearly cued Clockwise or Anti-clockwise pair.",
    bridge: "Notice what feels easy and what needs practice.",
  },
  p1b_attention_bridge: {
    eyebrow: "Find the pattern",
    title: "Start with In or Out",
    body: "Find the direction followed by most arrows.",
    bridge: "Find the current pattern before comparing it over time.",
  },
  p1b_wm_arrow_stabilisation: {
    eyebrow: "Continuous n-back",
    title: "Compare with an earlier pattern",
    body: "Press Match only when the current majority relation repeats n steps back.",
    bridge: "Keep the earlier pattern in mind as new ones arrive.",
  },
  p1b_wm_flow_first_contact: {
    eyebrow: "Moving dots",
    title: "Keep the Match rule",
    body: "Press Match only for an n-back repeat in the moving-dot stream.",
    bridge: "The display changes; the memory rule stays the same.",
  },
  p1b_wm_flow_recovery: {
    eyebrow: "Moving dots",
    title: "Keep comparing patterns",
    body: "Compare each pattern with the one n steps back.",
    bridge: "Keep the earlier pattern in mind.",
  },
  p1b_wm_arrow_return: {
    eyebrow: "Return to arrows",
    title: "Keep the memory rule",
    body: "Press Match only for an n-back repeat with arrows again.",
    bridge: "Return to the familiar display.",
  },
  p1b_wm_relative_mix: {
    eyebrow: "Switch displays",
    title: "Compare across arrows and moving dots",
    body: "Press Match only for an n-back repeat as the display changes.",
    bridge: "Keep the earlier pattern in mind as the display changes.",
  },
  p1c_attention_entry: {
    eyebrow: "Find the pattern",
    title: "Start with In or Out",
    body: "Choose the direction followed by most.",
    bridge: "Start with the current pattern.",
  },
  p1c_delayed_reentry: {
    eyebrow: "Return after a break",
    title: "Start with In or Out",
    body: "Choose the direction followed by most.",
    bridge: "Return to the main rule.",
  },
  p1c_wm_hold: {
    eyebrow: "Continuous n-back",
    title: "Keep an earlier pattern in mind",
    body: "Compare each pattern with the one n steps back.",
    bridge: "Keep the earlier pattern in mind as new ones arrive.",
  },
  p1c_attention_reentry: {
    eyebrow: "Return to now",
    title: "Choose Clockwise or Anti-clockwise",
    body: "Use the clearly cued rotational pair for this whole block.",
    bridge: "Return to the current pattern.",
  },
  p1c_operator_mix: {
    eyebrow: "Continuous n-back",
    title: "Finish with the memory rule",
    body: "Compare each pattern with the one n steps back.",
    bridge: "Keep the rule as the task changes.",
  },
};

export function workflowBridge(phase: Exclude<CccProgrammePhase, "practice">, workflow: WorkflowChoice): string {
  void workflow;
  return PHASE_COPY[phase].bridge;
}

export function reconnectAction(workflow: WorkflowChoice): { title: string; action: string } {
  const actions: Record<WorkflowChoice, { title: string; action: string }> = {
    focused_work: {
      title: "Reconnect to a focused work task",
      action: "Write down the one result that matters. Return to it after an interruption.",
    },
    study: {
      title: "Reconnect to a study task",
      action: "Write down your main question. Return to it as you change sources.",
    },
    ai_assisted: {
      title: "Reconnect to an AI-assisted task",
      action: "Write down the main requirement. Check each new output against it.",
    },
    everyday_planning: {
      title: "Reconnect to an everyday task",
      action: "Name the next useful step. Return to it after an interruption.",
    },
  };
  return actions[workflow];
}

export const EVIDENCE_BOUNDARY_COPY = "Notice whether this helps in the task you chose.";
