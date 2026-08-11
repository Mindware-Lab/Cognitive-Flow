import type {
  CccCarrier,
  CccProgressionStage,
  CccProgressionStep,
  CccReferenceFrame,
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

export const COGNITIVE_CONTROL_STAGE_SEQUENCE: readonly CccProgressionStage[] = [
  {
    id: "P0",
    label: "Protected signal anchor, relative Attention policy and carrier transfer",
    releaseGate: "private_pilot",
    steps: [
      {
        id: "p0_signal_anchor",
        stage: "P0",
        order: 1,
        operator: "attention",
        label: "Protected masked signal anchor",
        sourceWrapperId: null,
        targetWrapperId: "arrow_abs",
        wrappers: ["arrow_abs"],
        transitionKind: "baseline_stabilization",
        strictCarrierTransferBoundary: false,
        requiresShiftViewGate: false,
        contributesToAttentionPortability: false,
      },
      {
        id: "p0_arrow_rel_stabilise",
        stage: "P0",
        order: 2,
        operator: "attention",
        label: "Stabilise relative arrows",
        sourceWrapperId: "arrow_abs",
        targetWrapperId: "arrow_rel",
        wrappers: ["arrow_rel"],
        transitionKind: "reference_frame_extension",
        strictCarrierTransferBoundary: false,
        requiresShiftViewGate: false,
        contributesToAttentionPortability: true,
      },
      {
        id: "p0_flow_rel_first_contact",
        stage: "P0",
        order: 3,
        operator: "attention",
        label: "Transfer the relative rule to expansion and contraction",
        sourceWrapperId: "arrow_rel",
        targetWrapperId: "flow_rel",
        wrappers: ["arrow_rel", "flow_rel"],
        transitionKind: "carrier_transfer",
        strictCarrierTransferBoundary: true,
        requiresShiftViewGate: true,
        contributesToAttentionPortability: true,
      },
    ],
  },
  {
    id: "P1a",
    label: "Held-out and delayed Attention Portability validation",
    releaseGate: "private_pilot",
    steps: [
      {
        id: "p1a_held_out_relative_recheck",
        stage: "P1a",
        order: 4,
        operator: "attention",
        label: "Recheck the relative rule with held-out flow trials",
        sourceWrapperId: "arrow_rel",
        targetWrapperId: "flow_rel",
        wrappers: ["arrow_rel", "flow_rel"],
        transitionKind: "carrier_transfer",
        strictCarrierTransferBoundary: true,
        requiresShiftViewGate: false,
        contributesToAttentionPortability: true,
      },
      {
        id: "p1a_delayed_relative_mix",
        stage: "P1a",
        order: 5,
        operator: "attention",
        label: "Recheck relative arrows and flow after a delay",
        sourceWrapperId: null,
        targetWrapperId: null,
        wrappers: ["arrow_rel", "flow_rel"],
        transitionKind: "mixed_attention_portability",
        strictCarrierTransferBoundary: false,
        requiresShiftViewGate: false,
        contributesToAttentionPortability: true,
      },
    ],
  },
  {
    id: "P1b",
    label: "Upward WM introduction and WM carrier transfer",
    releaseGate: "preview",
    steps: [
      {
        id: "p1b_wm_arrow_rel_intro",
        stage: "P1b",
        order: 6,
        operator: "relational_wm",
        label: "Introduce relational WM in familiar relative arrows",
        sourceWrapperId: "arrow_rel",
        targetWrapperId: "arrow_rel",
        wrappers: ["arrow_rel"],
        transitionKind: "wm_introduction",
        strictCarrierTransferBoundary: false,
        requiresShiftViewGate: false,
        contributesToAttentionPortability: false,
      },
      {
        id: "p1b_wm_flow_rel_transfer",
        stage: "P1b",
        order: 7,
        operator: "relational_wm",
        label: "Transfer relational WM to flow",
        sourceWrapperId: "arrow_rel",
        targetWrapperId: "flow_rel",
        wrappers: ["arrow_rel", "flow_rel"],
        transitionKind: "wm_carrier_transfer",
        strictCarrierTransferBoundary: false,
        requiresShiftViewGate: false,
        contributesToAttentionPortability: false,
      },
    ],
  },
  {
    id: "P1c",
    label: "Return to Now and bidirectional operator integration",
    releaseGate: "preview",
    steps: [
      {
        id: "p1c_return_to_now_attention",
        stage: "P1c",
        order: 8,
        operator: "attention",
        label: "Return to Now attention re-entry",
        sourceWrapperId: "flow_rel",
        targetWrapperId: "flow_rel",
        wrappers: ["flow_rel"],
        transitionKind: "return_to_now",
        strictCarrierTransferBoundary: false,
        requiresShiftViewGate: false,
        contributesToAttentionPortability: true,
      },
      {
        id: "p1c_cued_operator_miniblocks",
        stage: "P1c",
        order: 9,
        operator: "attention",
        label: "Cued Attention and WM mini-block integration",
        sourceWrapperId: "flow_rel",
        targetWrapperId: "flow_rel",
        wrappers: ["flow_rel"],
        transitionKind: "operator_integration",
        strictCarrierTransferBoundary: false,
        requiresShiftViewGate: false,
        contributesToAttentionPortability: true,
      },
    ],
  },
  {
    id: "PublicLaunch",
    label: "Complete Cognitive Control Coach journey",
    releaseGate: "public_launch",
    steps: [],
  },
];

export function flatProgressionSteps(): CccProgressionStep[] {
  return COGNITIVE_CONTROL_STAGE_SEQUENCE.flatMap((stage) => [...stage.steps]).sort((left, right) => left.order - right.order);
}

export function progressionStepById(stepId: string): CccProgressionStep | null {
  return flatProgressionSteps().find((step) => step.id === stepId) || null;
}

export function switchesOperatorAndWrapperTogether(previous: CccProgressionStep, next: CccProgressionStep): boolean {
  if (previous.operator === next.operator) return false;
  if (!previous.targetWrapperId || !next.targetWrapperId) return false;
  return previous.targetWrapperId !== next.targetWrapperId;
}
