import type {
  CccCarrier,
  CccOperator,
  CccProgressionStage,
  CccProgressionStep,
  CccReferenceFrame,
  CccStageId,
  CccTransitionKind,
  CccWrapperId,
} from "./cccTypes";

const WRAPPER_META: Record<CccWrapperId, { carrier: CccCarrier; referenceFrame: CccReferenceFrame }> = {
  arrow_abs: { carrier: "arrow", referenceFrame: "absolute" },
  flow_abs: { carrier: "flow", referenceFrame: "absolute" },
  arrow_rel: { carrier: "arrow", referenceFrame: "relative" },
  flow_rel: { carrier: "flow", referenceFrame: "relative" },
};

export function carrierForWrapper(wrapperId: CccWrapperId): CccCarrier {
  return WRAPPER_META[wrapperId].carrier;
}

export function referenceFrameForWrapper(wrapperId: CccWrapperId): CccReferenceFrame {
  return WRAPPER_META[wrapperId].referenceFrame;
}

export function classifyWrapperTransition(sourceWrapperId: CccWrapperId, targetWrapperId: CccWrapperId): CccTransitionKind {
  const source = WRAPPER_META[sourceWrapperId];
  const target = WRAPPER_META[targetWrapperId];
  const carrierChanged = source.carrier !== target.carrier;
  const frameChanged = source.referenceFrame !== target.referenceFrame;
  if (carrierChanged && !frameChanged) return "carrier_transfer";
  if (!carrierChanged && frameChanged) return "reference_frame_extension";
  if (!carrierChanged && !frameChanged) return "baseline_stabilization";
  return "mixed_attention_portability";
}

export function isStrictCarrierTransfer(sourceWrapperId: CccWrapperId, targetWrapperId: CccWrapperId): boolean {
  return classifyWrapperTransition(sourceWrapperId, targetWrapperId) === "carrier_transfer";
}

function step(
  id: string,
  stage: CccStageId,
  order: number,
  operator: CccOperator,
  label: string,
  sourceWrapperId: CccWrapperId | null,
  targetWrapperId: CccWrapperId | null,
  wrappers: readonly CccWrapperId[],
  transitionKind: CccTransitionKind,
  options: Partial<Pick<CccProgressionStep, "strictCarrierTransferBoundary" | "requiresShiftViewGate" | "contributesToAttentionPortability">> = {},
): CccProgressionStep {
  return {
    id,
    stage,
    order,
    operator,
    label,
    sourceWrapperId,
    targetWrapperId,
    wrappers,
    transitionKind,
    strictCarrierTransferBoundary: options.strictCarrierTransferBoundary ?? false,
    requiresShiftViewGate: options.requiresShiftViewGate ?? false,
    contributesToAttentionPortability: options.contributesToAttentionPortability ?? false,
  };
}

export const COGNITIVE_CONTROL_STAGE_SEQUENCE: readonly CccProgressionStage[] = [
  {
    id: "P0",
    label: "Protected signal anchor, relative Attention policy and carrier transfer",
    releaseGate: "private_pilot",
    steps: [
      step("p0_signal_anchor", "P0", 1, "attention", "Protected masked signal anchor", null, "arrow_abs", ["arrow_abs"], "baseline_stabilization"),
      step("p0_arrow_rel_stabilise", "P0", 2, "attention", "Stabilise relative arrows", "arrow_abs", "arrow_rel", ["arrow_rel"], "reference_frame_extension", { contributesToAttentionPortability: true }),
      step("p0_flow_rel_first_contact", "P0", 3, "attention", "Protected first contact in motion", "arrow_rel", "flow_rel", ["arrow_rel", "flow_rel"], "carrier_transfer", { strictCarrierTransferBoundary: true, requiresShiftViewGate: true, contributesToAttentionPortability: true }),
    ],
  },
  {
    id: "P1a",
    label: "Repeated and delayed Attention Portability validation",
    releaseGate: "private_pilot",
    steps: [
      step("p1a_arrow_stabilise", "P1a", 4, "attention", "Stabilise the familiar relative rule", "arrow_rel", "arrow_rel", ["arrow_rel"], "baseline_stabilization", { contributesToAttentionPortability: true }),
      step("p1a_held_out_relative_recheck", "P1a", 5, "attention", "Protect the carrier-change observation", "arrow_rel", "flow_rel", ["flow_rel"], "carrier_transfer", { strictCarrierTransferBoundary: true, requiresShiftViewGate: true, contributesToAttentionPortability: true }),
      step("p1a_recovery", "P1a", 6, "attention", "Recover performance in motion", "flow_rel", "flow_rel", ["flow_rel"], "baseline_stabilization", { contributesToAttentionPortability: true }),
      step("p1a_return", "P1a", 7, "attention", "Return to the familiar carrier", "flow_rel", "arrow_rel", ["arrow_rel"], "carrier_transfer", { contributesToAttentionPortability: true }),
      step("p1a_mix", "P1a", 8, "attention", "Stabilise an interleaved carrier mix", null, null, ["arrow_rel", "flow_rel"], "mixed_attention_portability", { contributesToAttentionPortability: true }),
      step("p1a_delayed_relative_mix", "P1a", 9, "attention", "Run a fresh re-check after time away", null, null, ["arrow_rel", "flow_rel"], "mixed_attention_portability", { contributesToAttentionPortability: true }),
    ],
  },
  {
    id: "P1b",
    label: "Relational-memory introduction, carrier recovery and return",
    releaseGate: "private_pilot",
    steps: [
      step("p1b_attention_bridge", "P1b", 10, "attention", "Find the current relation", "arrow_rel", "arrow_rel", ["arrow_rel"], "baseline_stabilization"),
      step("p1b_wm_arrow_rel_intro", "P1b", 11, "relational_wm", "Hold the relation in familiar arrows", "arrow_rel", "arrow_rel", ["arrow_rel"], "wm_introduction"),
      step("p1b_wm_flow_rel_transfer", "P1b", 12, "relational_wm", "Protect first relational-memory contact in motion", "arrow_rel", "flow_rel", ["flow_rel"], "wm_carrier_transfer", { strictCarrierTransferBoundary: true, requiresShiftViewGate: true }),
      step("p1b_wm_flow_recovery", "P1b", 13, "relational_wm", "Recover the held relation in motion", "flow_rel", "flow_rel", ["flow_rel"], "baseline_stabilization"),
      step("p1b_wm_arrow_return", "P1b", 14, "relational_wm", "Return with the held relation", "flow_rel", "arrow_rel", ["arrow_rel"], "wm_carrier_transfer"),
      step("p1b_wm_relative_mix", "P1b", 15, "relational_wm", "Hold across an interleaved carrier mix", null, null, ["arrow_rel", "flow_rel"], "operator_integration"),
    ],
  },
  {
    id: "P1c",
    label: "Return to Now and bidirectional operator integration",
    releaseGate: "private_pilot",
    steps: [
      step("p1c_attention_entry", "P1c", 16, "attention", "Read the present relation", "arrow_rel", "arrow_rel", ["arrow_rel", "flow_rel"], "return_to_now", { contributesToAttentionPortability: true }),
      step("p1c_wm_hold", "P1c", 17, "relational_wm", "Hold the relation without changing carrier", "arrow_rel", "arrow_rel", ["arrow_rel", "flow_rel"], "operator_integration"),
      step("p1c_return_to_now_attention", "P1c", 18, "attention", "Return to what is here now", "arrow_rel", "arrow_rel", ["arrow_rel", "flow_rel"], "return_to_now", { contributesToAttentionPortability: true }),
      step("p1c_cued_operator_miniblocks", "P1c", 19, "relational_wm", "Switch the operation while keeping the carrier", "arrow_rel", "arrow_rel", ["arrow_rel", "flow_rel"], "operator_integration", { contributesToAttentionPortability: true }),
      step("p1c_delayed_reentry", "P1c", 20, "attention", "Run the final fresh re-entry after time away", "arrow_rel", "arrow_rel", ["arrow_rel", "flow_rel"], "return_to_now", { contributesToAttentionPortability: true }),
    ],
  },
  {
    id: "PublicLaunch",
    label: "Complete evidence-gated Cognitive Control Coach programme",
    releaseGate: "public_launch",
    steps: [],
  },
];

export function flatProgressionSteps(): CccProgressionStep[] {
  return COGNITIVE_CONTROL_STAGE_SEQUENCE.flatMap((stage) => [...stage.steps]).sort((left, right) => left.order - right.order);
}

export function progressionStepById(stepId: string): CccProgressionStep | null {
  return flatProgressionSteps().find((candidate) => candidate.id === stepId) || null;
}

export function switchesOperatorAndWrapperTogether(previous: CccProgressionStep, next: CccProgressionStep): boolean {
  if (previous.operator === next.operator) return false;
  if (!previous.targetWrapperId || !next.targetWrapperId) return false;
  return previous.targetWrapperId !== next.targetWrapperId;
}
