import { PHASE_CELL, phaseStatusForPhase } from "./protocol";
import type {
  CellEvidence,
  HeldOutStatus,
  LegacyTransferStatus,
  PhaseLabel,
  PhaseStatus,
  ProbeStatus,
  ProtocolGroup,
  StartCarrier,
  TransferControllerState,
  TransferEvent,
  TransferMetricSnapshot,
  TransferPhase,
  TransitionKey,
  WapDecision,
  WapUserState,
  WrapperId,
  WrapperMix,
  WrapperState,
} from "./types";

export const wmTransferDefaults = {
  baseFlatteningMinValidTrials: 240,
  baseFlatteningMinWindows: 4,
  baseFlatteningMaxAbsSlope: 0.02,
  accuracyBandMin: 0.7,
  accuracyBandMax: 0.82,
  diagnosticProbeRatio: 0.05,
  transitionProbeRatio: 0.2,
  firstContactTrials: 5,
  earlyTransitionMinTrials: 12,
  targetRecoveryMinTrials: 44,
  targetRecoveryMinWindows: 2,
  recoveryStartingRatio: 0.7,
  readyToMixRatio: 0.8,
  mixedStabilityMinTrials: 88,
  mixedStabilityRatio: 0.8,
  mixedStabilityMinAccuracy: 0.7,
  delayedRecheckMinSessionsAfterMix: 1,
} as const;

export const TRANSFER_DEFAULTS = wmTransferDefaults;

const WRAPPERS: WrapperId[] = ["arrow_abs", "flow_abs", "arrow_rel", "flow_rel"];
const ALL_WRAPPER_MIX: WrapperMix = {
  wrapperRatios: { arrow_abs: 0.25, flow_abs: 0.25, arrow_rel: 0.25, flow_rel: 0.25 },
  randomised: true,
};

const EMPTY_METRICS: TransferMetricSnapshot = {
  initialDip: null,
  recoverySlope: null,
  recoveryRatio: null,
  returnStrength: null,
  mixedWrapperStability: null,
  compositionalTransfer: null,
  delayedRecovery: null,
  lateCueCost: null,
  earlyCueReinstatement: null,
};

type TransferPath = {
  startCarrier: StartCarrier;
  startCohort: "arrows_first" | "optic_flow_first";
  startWrapper: WrapperId;
  carrierTargetWrapper: WrapperId;
  frameTargetWrapper: WrapperId;
  heldOutWrapper: WrapperId;
};

const ARROWS_FIRST_PATH: TransferPath = {
  startCarrier: "arrows",
  startCohort: "arrows_first",
  startWrapper: "arrow_abs",
  carrierTargetWrapper: "flow_abs",
  frameTargetWrapper: "arrow_rel",
  heldOutWrapper: "flow_rel",
};

const FLOW_FIRST_PATH: TransferPath = {
  startCarrier: "optic_flow",
  startCohort: "optic_flow_first",
  startWrapper: "flow_abs",
  carrierTargetWrapper: "arrow_abs",
  frameTargetWrapper: "flow_rel",
  heldOutWrapper: "arrow_rel",
};

function pathForStartCarrier(startCarrier: StartCarrier): TransferPath {
  return startCarrier === "optic_flow" ? FLOW_FIRST_PATH : ARROWS_FIRST_PATH;
}

function startCarrierForProtocolGroup(protocolGroup?: ProtocolGroup | null): StartCarrier {
  return protocolGroup === "validation_flow_first" ? "optic_flow" : "arrows";
}

function startCarrierForPhase(phase: PhaseLabel): StartCarrier {
  return phase === "P1_FLOW_ABS" || phase === "P2_ARROW_ABS" || phase === "P3_FLOW_REL" || phase === "P4_ARROW_REL"
    ? "optic_flow"
    : "arrows";
}

function inferredPath(input: {
  existing?: TransferControllerState | null;
  currentPhase?: PhaseLabel;
  protocolGroup?: ProtocolGroup | null;
}): TransferPath {
  if (input.existing?.startCarrier) return pathForStartCarrier(input.existing.startCarrier);
  if (input.protocolGroup) return pathForStartCarrier(startCarrierForProtocolGroup(input.protocolGroup));
  if (input.currentPhase) return pathForStartCarrier(startCarrierForPhase(input.currentPhase));
  return ARROWS_FIRST_PATH;
}

export function transferPathForState(state: TransferControllerState | null | undefined): TransferPath {
  return pathForStartCarrier(state?.startCarrier || "arrows");
}

function wrapperState(wrapperId: WrapperId, path: TransferPath): WrapperState {
  return {
    wrapperId,
    status: wrapperId === path.startWrapper ? "base" : "locked",
    validTrials: 0,
    rollingWindowCount: 0,
    balancedAccuracy: 0,
    recentSlope: 0,
    recoveryRatio: null,
    returnStrength: null,
    lastSeenSession: null,
    dueDelayedRecheck: false,
  };
}

function initialWrapperStates(path: TransferPath): Record<WrapperId, WrapperState> {
  return {
    arrow_abs: wrapperState("arrow_abs", path),
    flow_abs: wrapperState("flow_abs", path),
    arrow_rel: wrapperState("arrow_rel", path),
    flow_rel: wrapperState("flow_rel", path),
  };
}

export function createInitialTransferControllerState(options: { startCarrier?: StartCarrier } = {}): TransferControllerState {
  const path = pathForStartCarrier(options.startCarrier || "arrows");
  return {
    version: "horizontal-transfer-v1.0",
    startCarrier: path.startCarrier,
    startCohort: path.startCohort,
    startWrapper: path.startWrapper,
    carrierTargetWrapper: path.carrierTargetWrapper,
    frameTargetWrapper: path.frameTargetWrapper,
    heldOutWrapper: path.heldOutWrapper,
    activeBaseWrapper: path.startWrapper,
    activeTargetWrapper: null,
    phase: "base_fluency",
    mixRatio: null,
    activeMix: null,
    wrapperStates: initialWrapperStates(path),
    transferEvents: [],
    delayedRechecks: [],
    heldOutCompositionLogged: false,
    heldOutStatus: "clean",
    legacyFlowRelExposure: false,
    legacyHeldOutExposure: false,
    legacyStatus: "none",
    completedAtSession: null,
    maintenanceSessionCount: 0,
  };
}

function phaseForWrapper(path: TransferPath, wrapper: WrapperId | null | undefined): PhaseLabel {
  if (wrapper === path.startWrapper) return path.startCarrier === "optic_flow" ? "P1_FLOW_ABS" : "P1_ARROW_ABS";
  if (wrapper === path.carrierTargetWrapper) return path.startCarrier === "optic_flow" ? "P2_ARROW_ABS" : "P2_FLOW_ABS";
  if (wrapper === path.frameTargetWrapper) return path.startCarrier === "optic_flow" ? "P3_FLOW_REL" : "P3_ARROW_REL";
  if (wrapper === path.heldOutWrapper) return path.startCarrier === "optic_flow" ? "P4_ARROW_REL" : "P4_FLOW_REL";
  return path.startCarrier === "optic_flow" ? "P1_FLOW_ABS" : "P1_ARROW_ABS";
}

function phaseFromLegacy(phase: PhaseLabel, path: TransferPath): Pick<
  TransferControllerState,
  | "activeBaseWrapper"
  | "activeTargetWrapper"
  | "phase"
  | "mixRatio"
  | "activeMix"
  | "heldOutCompositionLogged"
  | "heldOutStatus"
  | "legacyFlowRelExposure"
  | "legacyHeldOutExposure"
  | "legacyStatus"
> {
  if (phase === "P2_FLOW_ABS" || phase === "P2_ARROW_ABS") return legacyPatch(path.startWrapper, path.carrierTargetWrapper, "recovering", null, null, "clean", false, false, "legacy_active");
  if (phase === "P3_ARROW_REL" || phase === "P3_FLOW_REL") return legacyPatch(path.startWrapper, path.frameTargetWrapper, "recovering", null, null, "clean", false, false, "legacy_active");
  if (phase === "P4_FLOW_REL" || phase === "P4_ARROW_REL") return legacyPatch(path.frameTargetWrapper, path.heldOutWrapper, "recovering", null, null, "legacy_exposed", path.heldOutWrapper === "flow_rel", true, "legacy_exposed");
  if (
    phase === "P5_ARROW_MIXED" ||
    phase === "P6_FLOW_MIXED" ||
    phase === "P5_FLOW_MIXED" ||
    phase === "P6_ARROW_MIXED" ||
    phase === "P7_FULL_MIXED" ||
    phase === "P10_BIND_MIXED" ||
    phase === "P5_MIXED"
  ) {
    return legacyPatch(null, null, "full_factorial_mix", null, ALL_WRAPPER_MIX, "legacy_exposed", path.heldOutWrapper === "flow_rel", true, "legacy_mixed_unknown");
  }
  if (phase === "P11_DELAYED" || phase === "P6_DELAYED") {
    return legacyPatch(null, null, "delayed_recheck", null, ALL_WRAPPER_MIX, "legacy_exposed", path.heldOutWrapper === "flow_rel", true, "legacy_mixed_unknown");
  }
  return legacyPatch(path.startWrapper, null, "base_fluency", null, null, "clean", false, false, "none");
}

function legacyPatch(
  activeBaseWrapper: WrapperId | null,
  activeTargetWrapper: WrapperId | null,
  phase: TransferPhase,
  mixRatio: number | null,
  activeMix: WrapperMix | null,
  heldOutStatus: HeldOutStatus,
  legacyFlowRelExposure: boolean,
  legacyHeldOutExposure: boolean,
  legacyStatus: LegacyTransferStatus,
) {
  return {
    activeBaseWrapper,
    activeTargetWrapper,
    phase,
    mixRatio,
    activeMix,
    heldOutCompositionLogged: false,
    heldOutStatus,
    legacyFlowRelExposure,
    legacyHeldOutExposure,
    legacyStatus,
  };
}

export function migrateTransferControllerState(input: {
  existing?: TransferControllerState | null;
  currentPhase: PhaseLabel;
  sessionNumber: number;
  evidence: CellEvidence[];
  protocolGroup?: ProtocolGroup | null;
}): TransferControllerState {
  const path = inferredPath(input);
  const fresh = createInitialTransferControllerState({ startCarrier: path.startCarrier });
  const base = input.existing?.version === "horizontal-transfer-v1.0"
    ? input.existing
    : { ...fresh, ...phaseFromLegacy(input.currentPhase, path) };
  const normalized: TransferControllerState = {
    ...fresh,
    ...base,
    startCarrier: path.startCarrier,
    startCohort: path.startCohort,
    startWrapper: path.startWrapper,
    carrierTargetWrapper: path.carrierTargetWrapper,
    frameTargetWrapper: path.frameTargetWrapper,
    heldOutWrapper: path.heldOutWrapper,
    activeBaseWrapper: atomicOrNull(base.activeBaseWrapper) || (base.phase === "base_fluency" ? path.startWrapper : null),
    activeTargetWrapper: atomicOrNull(base.activeTargetWrapper),
    activeMix: base.activeMix || null,
    transferEvents: base.transferEvents || [],
    delayedRechecks: (base.delayedRechecks || []).map((item) => ({
      ...item,
      wrapperIds: item.wrapperIds || [atomicOrNull((item as unknown as { wrapperId?: WrapperId }).wrapperId)].filter(Boolean) as WrapperId[],
    })),
    heldOutStatus: base.heldOutStatus || (base.legacyHeldOutExposure || base.legacyFlowRelExposure ? "legacy_exposed" : "clean"),
    legacyFlowRelExposure: Boolean(base.legacyFlowRelExposure),
    legacyHeldOutExposure: Boolean(base.legacyHeldOutExposure || (path.heldOutWrapper === "flow_rel" && base.legacyFlowRelExposure)),
    legacyStatus: base.legacyStatus || (base.legacyHeldOutExposure || base.legacyFlowRelExposure ? "legacy_exposed" : "none"),
    wrapperStates: normalizeWrapperStates(base.wrapperStates, path),
  };
  return refreshWrapperStates(normalized, input.evidence, input.sessionNumber);
}

function atomicOrNull(wrapper: unknown): WrapperId | null {
  return WRAPPERS.includes(wrapper as WrapperId) ? (wrapper as WrapperId) : null;
}

function normalizeWrapperStates(input: Partial<Record<WrapperId, WrapperState>> | undefined, path: TransferPath): Record<WrapperId, WrapperState> {
  const base = initialWrapperStates(path);
  for (const wrapper of WRAPPERS) {
    if (input?.[wrapper]) base[wrapper] = { ...base[wrapper], ...input[wrapper], wrapperId: wrapper };
  }
  if (base[path.startWrapper].status === "locked") base[path.startWrapper] = { ...base[path.startWrapper], status: "base" };
  return base;
}

function evidenceFor(evidence: CellEvidence[], construct: "ACC", wrapper: WrapperId): CellEvidence | null {
  return evidence.find((item) => item.construct === construct && item.cellKey === wrapper) || null;
}

function refreshWrapperStates(
  state: TransferControllerState,
  evidence: CellEvidence[],
  sessionNumber: number,
): TransferControllerState {
  const path = transferPathForState(state);
  const wrapperStates = normalizeWrapperStates(state.wrapperStates, path);
  for (const wrapper of WRAPPERS) {
    const current = wrapperStates[wrapper];
    const ev = evidenceFor(evidence, "ACC", wrapper);
    wrapperStates[wrapper] = {
      ...current,
      validTrials: ev?.validTrials ?? current.validTrials,
      rollingWindowCount: ev?.rollingWindowCount ?? current.rollingWindowCount,
      balancedAccuracy: ev?.balancedAccuracy ?? current.balancedAccuracy,
      recentSlope: ev?.recentCapacitySlope ?? current.recentSlope,
      lastSeenSession: ev && ev.validTrials > current.validTrials ? sessionNumber : current.lastSeenSession,
    };
  }
  return { ...state, wrapperStates };
}

function wmLayerStable(evidence: CellEvidence): boolean {
  return !evidence.currentNLevel || !evidence.stableNLevel || evidence.currentNLevel <= evidence.stableNLevel + 1;
}

function flattened(evidence: CellEvidence | null): boolean {
  return Boolean(
    evidence &&
      evidence.validTrials >= TRANSFER_DEFAULTS.baseFlatteningMinValidTrials &&
      evidence.rollingWindowCount >= TRANSFER_DEFAULTS.baseFlatteningMinWindows &&
      Math.abs(evidence.recentCapacitySlope) < TRANSFER_DEFAULTS.baseFlatteningMaxAbsSlope &&
      evidence.balancedAccuracy >= TRANSFER_DEFAULTS.accuracyBandMin &&
      evidence.balancedAccuracy <= TRANSFER_DEFAULTS.accuracyBandMax &&
      evidence.lapseRate <= 0.18 &&
      evidence.timingQuality !== "poor" &&
      wmLayerStable(evidence),
  );
}

function recoveryRatio(source: CellEvidence | null, target: CellEvidence | null): number | null {
  return source?.currentCapacityBps && target?.currentCapacityBps ? target.currentCapacityBps / source.currentCapacityBps : null;
}

function recoveryStarting(source: CellEvidence | null, target: CellEvidence | null): boolean {
  if (!target || target.timingQuality === "poor") return false;
  const ratio = recoveryRatio(source, target);
  return (
    (ratio !== null && ratio >= TRANSFER_DEFAULTS.recoveryStartingRatio) ||
    (target.rollingWindowCount >= 1 && target.recentCapacitySlope > 0 && target.validTrials >= TRANSFER_DEFAULTS.earlyTransitionMinTrials)
  );
}

function readyToMix(source: CellEvidence | null, target: CellEvidence | null): boolean {
  if (!target || target.timingQuality === "poor") return false;
  const ratio = recoveryRatio(source, target);
  return Boolean(
    target.validTrials >= TRANSFER_DEFAULTS.targetRecoveryMinTrials &&
      target.rollingWindowCount >= TRANSFER_DEFAULTS.targetRecoveryMinWindows &&
      ratio !== null &&
      ratio >= TRANSFER_DEFAULTS.readyToMixRatio &&
      target.balancedAccuracy >= TRANSFER_DEFAULTS.mixedStabilityMinAccuracy &&
      target.lapseRate <= 0.2 &&
      target.lureErrorRate <= 0.35 &&
      wmLayerStable(target),
  );
}

function mixFor(base: WrapperId, target: WrapperId, targetRatio: number, randomised = false): WrapperMix {
  return {
    wrapperRatios: { [base]: 1 - targetRatio, [target]: targetRatio },
    randomised,
  };
}

function weightedBlockedCapacity(evidence: CellEvidence[], mix: WrapperMix): number | null {
  let total = 0;
  let weight = 0;
  for (const wrapper of WRAPPERS) {
    const ratio = mix.wrapperRatios[wrapper] || 0;
    const capacity = evidenceFor(evidence, "ACC", wrapper)?.currentCapacityBps;
    if (ratio > 0 && capacity) {
      total += ratio * capacity;
      weight += ratio;
    }
  }
  return weight > 0 ? total / weight : null;
}

function mixedStabilityRatio(evidence: CellEvidence[], mix: WrapperMix): number | null {
  const expected = weightedBlockedCapacity(evidence, mix);
  const represented = WRAPPERS.filter((wrapper) => (mix.wrapperRatios[wrapper] || 0) > 0)
    .map((wrapper) => evidenceFor(evidence, "ACC", wrapper))
    .filter((item): item is CellEvidence => Boolean(item));
  if (!expected || represented.length === 0) return null;
  const observed = represented.reduce((sum, item) => sum + (item.currentCapacityBps || 0), 0) / represented.length;
  return observed / expected;
}

function mixedStable(evidence: CellEvidence[], mix: WrapperMix): boolean {
  const wrappers = WRAPPERS.filter((wrapper) => (mix.wrapperRatios[wrapper] || 0) > 0);
  const seen = wrappers.map((wrapper) => evidenceFor(evidence, "ACC", wrapper)).filter((item): item is CellEvidence => Boolean(item));
  const stability = mixedStabilityRatio(evidence, mix);
  return Boolean(
    seen.length === wrappers.length &&
      stability !== null &&
      stability >= TRANSFER_DEFAULTS.mixedStabilityRatio &&
      seen.every((item) =>
        item.validTrials >= TRANSFER_DEFAULTS.earlyTransitionMinTrials &&
        item.balancedAccuracy >= TRANSFER_DEFAULTS.mixedStabilityMinAccuracy &&
        item.timingQuality !== "poor" &&
        item.lapseRate <= 0.2 &&
        item.lureErrorRate <= 0.35 &&
        wmLayerStable(item)
      ),
  );
}

function event(
  eventType: TransferEvent["eventType"],
  sourceWrapper: WrapperId,
  targetWrapper: WrapperId,
  sessionNumber: number,
  phase: TransferPhase,
  mixRatio: number | null,
  heldOut = false,
  metrics: Partial<TransferMetricSnapshot> = {},
): TransferEvent {
  return {
    id: `${eventType}-${sourceWrapper}-${targetWrapper}-${sessionNumber}-${Date.now()}`,
    eventType,
    sourceWrapper,
    targetWrapper,
    sessionNumber,
    phase,
    mixRatio,
    heldOut,
    metrics,
    createdAt: new Date().toISOString(),
  };
}

function appendEvent(state: TransferControllerState, nextEvent: TransferEvent): TransferControllerState {
  const duplicate = state.transferEvents.some(
    (item) =>
      item.eventType === nextEvent.eventType &&
      item.sourceWrapper === nextEvent.sourceWrapper &&
      item.targetWrapper === nextEvent.targetWrapper &&
      item.phase === nextEvent.phase,
  );
  return duplicate ? state : { ...state, transferEvents: [...state.transferEvents, nextEvent].slice(-80) };
}

function legacyPhaseFor(state: TransferControllerState): PhaseLabel {
  const path = transferPathForState(state);
  switch (state.phase) {
    case "base_fluency":
    case "diagnostic_probe":
    case "flattening":
    case "return_to_base":
      return phaseForWrapper(path, path.startWrapper);
    case "transition_probe":
    case "expected_dip":
    case "recovering":
      return phaseForWrapper(path, state.activeTargetWrapper || path.carrierTargetWrapper);
    case "held_out_composition":
      return phaseForWrapper(path, path.heldOutWrapper);
    case "delayed_recheck":
      return "P6_DELAYED";
    default:
      return "P5_MIXED";
  }
}

function statusForTransferPhase(phase: TransferPhase): PhaseStatus {
  if (phase === "flattening") return "flattening";
  if (phase === "recovering" || phase === "expected_dip" || phase === "transition_probe") return "recovering";
  if (phase.includes("mix") || phase === "full_factorial_mix" || phase === "portable" || phase === "maintenance_mix") return "mixed";
  if (phase === "delayed_recheck") return "delayed";
  return "active";
}

export function probeStatusForTransferPhase(phase: TransferPhase): ProbeStatus {
  if (phase === "diagnostic_probe") return "diagnostic_probe";
  if (phase === "transition_probe" || phase === "expected_dip") return "transition_probe";
  if (phase === "recovering") return "recovery";
  if (phase === "return_to_base") return "return_to_base";
  if (phase === "held_out_composition") return "held_out";
  if (phase === "delayed_recheck") return "delayed_recheck";
  if (phase.includes("mix") || phase === "full_factorial_mix" || phase === "portable" || phase === "maintenance_mix") return "mix";
  return "base";
}

function sourceForTarget(target: WrapperId, path: TransferPath, evidence: CellEvidence[]): CellEvidence | null {
  if (target === path.carrierTargetWrapper || target === path.frameTargetWrapper) return evidenceFor(evidence, "ACC", path.startWrapper);
  if (target === path.heldOutWrapper) return evidenceFor(evidence, "ACC", path.frameTargetWrapper);
  return evidenceFor(evidence, "ACC", path.startWrapper);
}

function currentPairMix(state: TransferControllerState): WrapperMix {
  if (state.activeMix) return state.activeMix;
  if (state.activeBaseWrapper && state.activeTargetWrapper && state.mixRatio !== null) {
    return mixFor(state.activeBaseWrapper, state.activeTargetWrapper, state.mixRatio, state.phase === "random_mix");
  }
  return ALL_WRAPPER_MIX;
}

function nextMixPhase(state: TransferControllerState, phase: TransferPhase, mixRatio: number | null): TransferControllerState {
  const randomised = phase === "random_mix";
  return {
    ...state,
    phase,
    mixRatio,
    activeMix: state.activeBaseWrapper && state.activeTargetWrapper && mixRatio !== null
      ? mixFor(state.activeBaseWrapper, state.activeTargetWrapper, mixRatio, randomised)
      : state.activeMix,
  };
}

function nextTransferState(state: TransferControllerState, input: WapUserState): TransferControllerState {
  const path = transferPathForState(state);
  const evidence = input.evidence;
  const startEvidence = evidenceFor(evidence, "ACC", path.startWrapper);

  if (state.phase === "portable" || state.phase === "maintenance_mix") {
    return {
      ...state,
      phase: input.sessionNumber < 20 ? "maintenance_mix" : "portable",
      activeBaseWrapper: null,
      activeTargetWrapper: null,
      mixRatio: null,
      activeMix: ALL_WRAPPER_MIX,
      maintenanceSessionCount: state.maintenanceSessionCount + 1,
    };
  }

  if (state.phase === "base_fluency") {
    if (flattened(startEvidence)) {
      const next = {
        ...state,
        phase: "transition_probe" as TransferPhase,
        activeBaseWrapper: path.startWrapper,
        activeTargetWrapper: path.carrierTargetWrapper,
        mixRatio: TRANSFER_DEFAULTS.transitionProbeRatio,
        activeMix: mixFor(path.startWrapper, path.carrierTargetWrapper, TRANSFER_DEFAULTS.transitionProbeRatio),
      };
      return appendEvent(next, event("transition_probe", path.startWrapper, path.carrierTargetWrapper, input.sessionNumber, "transition_probe", TRANSFER_DEFAULTS.transitionProbeRatio));
    }
    if ((startEvidence?.validTrials || 0) >= 88 && !state.transferEvents.some((item) => item.eventType === "diagnostic_probe")) {
      const next = {
        ...state,
        phase: "diagnostic_probe" as TransferPhase,
        activeBaseWrapper: path.startWrapper,
        activeTargetWrapper: path.carrierTargetWrapper,
        mixRatio: TRANSFER_DEFAULTS.diagnosticProbeRatio,
        activeMix: mixFor(path.startWrapper, path.carrierTargetWrapper, TRANSFER_DEFAULTS.diagnosticProbeRatio),
      };
      return appendEvent(next, event("diagnostic_probe", path.startWrapper, path.carrierTargetWrapper, input.sessionNumber, "diagnostic_probe", TRANSFER_DEFAULTS.diagnosticProbeRatio));
    }
    if ((startEvidence?.validTrials || 0) >= TRANSFER_DEFAULTS.baseFlatteningMinValidTrials) {
      return { ...state, phase: "flattening", activeBaseWrapper: path.startWrapper, activeTargetWrapper: null, mixRatio: null, activeMix: null };
    }
    return state;
  }

  if (state.phase === "diagnostic_probe" || state.phase === "flattening") {
    if (flattened(startEvidence)) {
      const next = {
        ...state,
        phase: "transition_probe" as TransferPhase,
        activeBaseWrapper: path.startWrapper,
        activeTargetWrapper: path.carrierTargetWrapper,
        mixRatio: TRANSFER_DEFAULTS.transitionProbeRatio,
        activeMix: mixFor(path.startWrapper, path.carrierTargetWrapper, TRANSFER_DEFAULTS.transitionProbeRatio),
      };
      return appendEvent(next, event("transition_probe", path.startWrapper, path.carrierTargetWrapper, input.sessionNumber, "transition_probe", TRANSFER_DEFAULTS.transitionProbeRatio));
    }
    return { ...state, phase: "flattening", activeBaseWrapper: path.startWrapper, activeTargetWrapper: null, mixRatio: null, activeMix: null };
  }

  if (state.phase === "transition_probe") return { ...state, phase: "expected_dip", activeTargetWrapper: state.activeTargetWrapper || path.carrierTargetWrapper };
  if (state.phase === "expected_dip") return { ...state, phase: "recovering", activeTargetWrapper: state.activeTargetWrapper || path.carrierTargetWrapper, mixRatio: null, activeMix: null };

  if (state.phase === "recovering") {
    const target = state.activeTargetWrapper || path.carrierTargetWrapper;
    const source = sourceForTarget(target, path, evidence);
    const targetEvidence = evidenceFor(evidence, "ACC", target);
    if (!recoveryStarting(source, targetEvidence)) return state;
    if (!readyToMix(source, targetEvidence)) return { ...state, phase: "recovering" };
    if (target === path.carrierTargetWrapper) {
      return appendEvent(
        { ...state, phase: "return_to_base", activeBaseWrapper: path.startWrapper, activeTargetWrapper: null, mixRatio: null, activeMix: null },
        event("recovery", path.startWrapper, path.carrierTargetWrapper, input.sessionNumber, "recovering", null, false, { recoveryRatio: recoveryRatio(source, targetEvidence) }),
      );
    }
    if (target === path.frameTargetWrapper) {
      return appendEvent(
        { ...state, phase: "mix_80_20", activeBaseWrapper: path.startWrapper, activeTargetWrapper: path.frameTargetWrapper, mixRatio: 0.2, activeMix: mixFor(path.startWrapper, path.frameTargetWrapper, 0.2) },
        event("recovery", path.startWrapper, path.frameTargetWrapper, input.sessionNumber, "recovering", null),
      );
    }
    return appendEvent(
      {
        ...state,
        phase: "full_factorial_mix",
        activeBaseWrapper: null,
        activeTargetWrapper: null,
        mixRatio: null,
        activeMix: ALL_WRAPPER_MIX,
        heldOutCompositionLogged: true,
        heldOutStatus: state.heldOutStatus === "clean" ? "first_exposure_logged" : state.heldOutStatus,
      },
      event("recovery", path.frameTargetWrapper, path.heldOutWrapper, input.sessionNumber, "recovering", null),
    );
  }

  if (state.phase === "return_to_base") {
    return appendEvent(
      { ...state, phase: "mix_80_20", activeBaseWrapper: path.startWrapper, activeTargetWrapper: path.carrierTargetWrapper, mixRatio: 0.2, activeMix: mixFor(path.startWrapper, path.carrierTargetWrapper, 0.2) },
      event("return_to_base", path.carrierTargetWrapper, path.startWrapper, input.sessionNumber, "return_to_base", null),
    );
  }

  if (state.phase === "mix_80_20") return nextMixPhase(state, "mix_60_40", 0.4);
  if (state.phase === "mix_60_40") return nextMixPhase(state, "mix_50_50", 0.5);
  if (state.phase === "mix_50_50") return nextMixPhase(state, "random_mix", 0.5);

  if (state.phase === "random_mix") {
    const mix = currentPairMix({ ...state, activeMix: state.activeMix ? { ...state.activeMix, randomised: true } : state.activeMix });
    if (!mixedStable(evidence, mix)) return { ...state, activeMix: { ...mix, randomised: true } };
    if (state.activeTargetWrapper === path.carrierTargetWrapper) {
      return appendEvent(
        { ...state, phase: "recovering", activeBaseWrapper: path.startWrapper, activeTargetWrapper: path.frameTargetWrapper, mixRatio: null, activeMix: null },
        event("transition_probe", path.startWrapper, path.frameTargetWrapper, input.sessionNumber, "transition_probe", TRANSFER_DEFAULTS.transitionProbeRatio),
      );
    }
    if (state.heldOutStatus === "clean") {
      return appendEvent(
        { ...state, phase: "held_out_composition", activeBaseWrapper: path.frameTargetWrapper, activeTargetWrapper: path.heldOutWrapper, mixRatio: null, activeMix: null },
        event("held_out_composition", path.frameTargetWrapper, path.heldOutWrapper, input.sessionNumber, "held_out_composition", null, true),
      );
    }
    return { ...state, phase: "recovering", activeBaseWrapper: path.frameTargetWrapper, activeTargetWrapper: path.heldOutWrapper, mixRatio: null, activeMix: null, legacyStatus: state.legacyStatus === "none" ? "rebaseline_required" : state.legacyStatus };
  }

  if (state.phase === "held_out_composition") {
    return {
      ...state,
      phase: "recovering",
      activeBaseWrapper: path.frameTargetWrapper,
      activeTargetWrapper: path.heldOutWrapper,
      mixRatio: null,
      activeMix: null,
      heldOutCompositionLogged: true,
      heldOutStatus: "first_exposure_logged",
    };
  }

  if (state.phase === "full_factorial_mix") {
    if (!mixedStable(evidence, ALL_WRAPPER_MIX)) return { ...state, activeBaseWrapper: null, activeTargetWrapper: null, activeMix: ALL_WRAPPER_MIX };
    return appendEvent(
      {
        ...state,
        phase: "delayed_recheck",
        activeBaseWrapper: null,
        activeTargetWrapper: null,
        activeMix: ALL_WRAPPER_MIX,
        delayedRechecks: state.delayedRechecks.length
          ? state.delayedRechecks
          : [{ id: `delayed-${input.sessionNumber}`, dueAfterSession: input.sessionNumber + TRANSFER_DEFAULTS.delayedRecheckMinSessionsAfterMix, completedSession: null, wrapperIds: [...WRAPPERS], passed: null }],
      },
      event("mix_step", path.startWrapper, path.heldOutWrapper, input.sessionNumber, "full_factorial_mix", null),
    );
  }

  if (state.phase === "delayed_recheck") {
    const due = state.delayedRechecks.every((item) => item.completedSession !== null || input.sessionNumber >= item.dueAfterSession);
    if (!due) return state;
    return appendEvent(
      {
        ...state,
        phase: input.sessionNumber < 20 ? "maintenance_mix" : "portable",
        activeBaseWrapper: null,
        activeTargetWrapper: null,
        activeMix: ALL_WRAPPER_MIX,
        completedAtSession: input.sessionNumber,
        delayedRechecks: state.delayedRechecks.map((item) => item.completedSession === null ? { ...item, completedSession: input.sessionNumber, passed: true } : item),
      },
      event("delayed_recheck", path.startWrapper, path.heldOutWrapper, input.sessionNumber, "delayed_recheck", null),
    );
  }

  return state;
}

export function chooseNextTransferState(input: WapUserState): WapDecision {
  const current = migrateTransferControllerState({
    existing: input.transferControllerState,
    currentPhase: input.currentPhase,
    sessionNumber: input.sessionNumber,
    evidence: input.evidence,
    protocolGroup: input.protocolGroup,
  });
  const next = nextTransferState(current, input);
  const toPhase = legacyPhaseFor(next);
  const phaseStatus = statusForTransferPhase(next.phase) || phaseStatusForPhase(toPhase);
  const shouldTransition = toPhase !== input.currentPhase || phaseStatus !== input.phaseStatus || next.phase !== current.phase;
  const activeCell = PHASE_CELL[toPhase] === "mixed" ? transferPathForState(next).startWrapper : PHASE_CELL[toPhase];
  const activeEvidence = evidenceFor(input.evidence, "ACC", activeCell as WrapperId);
  const ready = flattened(activeEvidence);
  return {
    fromPhase: input.currentPhase,
    toPhase,
    phaseStatus,
    shouldTransition,
    transitionKey: transitionKeyForTransfer(current, next),
    reason: reasonFor(next.phase, next),
    transferControllerState: next,
    readiness: {
      minimumTrials: Boolean(activeEvidence && activeEvidence.validTrials >= TRANSFER_DEFAULTS.baseFlatteningMinValidTrials),
      enoughWindows: Boolean(activeEvidence && activeEvidence.rollingWindowCount >= TRANSFER_DEFAULTS.baseFlatteningMinWindows),
      slopeStable: Boolean(activeEvidence && Math.abs(activeEvidence.recentCapacitySlope) < TRANSFER_DEFAULTS.baseFlatteningMaxAbsSlope),
      accuracyInBand: Boolean(activeEvidence && activeEvidence.balancedAccuracy >= TRANSFER_DEFAULTS.accuracyBandMin && activeEvidence.balancedAccuracy <= TRANSFER_DEFAULTS.accuracyBandMax),
      lapseStable: Boolean(activeEvidence && activeEvidence.lapseRate <= 0.18),
      timingAcceptable: Boolean(activeEvidence && activeEvidence.timingQuality !== "poor"),
      noGlobalBlocker: !input.hasGlobalFatigueFlag && !input.hasTimingLimitedFlag && ready,
    },
  };
}

function transitionKeyForTransfer(previous: TransferControllerState, next: TransferControllerState): TransitionKey | null {
  const path = transferPathForState(next);
  if (next.phase === "delayed_recheck") return "T_DELAYED";
  if (next.phase.includes("mix") || next.phase === "full_factorial_mix" || next.phase === "maintenance_mix") return "T_MIXED";
  const target = next.activeTargetWrapper || previous.activeTargetWrapper;
  if (target === path.carrierTargetWrapper) return "T_CM_BASE";
  if (target === path.frameTargetWrapper) return target === "flow_rel" ? "T_FRAME_FLOW" : "T_FRAME_ARROW";
  if (target === path.heldOutWrapper) return "T_CM_REL";
  return null;
}

function reasonFor(phase: TransferPhase, state: TransferControllerState): string {
  const path = transferPathForState(state);
  if (phase === "diagnostic_probe") return "Add a small diagnostic wrapper probe without advancing the curriculum.";
  if (phase === "flattening") return "Continue until the base representation is stable enough to challenge.";
  if (phase === "transition_probe") return "Flattening gate passed; start the controlled wrapper probe.";
  if (phase === "expected_dip") return "Measure the expected first-exposure dip in the new wrapper.";
  if (phase === "recovering") return "Hold demand steady while the same relation recovers in the new wrapper.";
  if (phase === "return_to_base") return "Return to the base wrapper before mixing.";
  if (phase.includes("mix") || phase === "full_factorial_mix") return "Practise the relation under unpredictable wrapper selection.";
  if (phase === "held_out_composition") return `Log held-out ${path.heldOutWrapper} composition before direct practice.`;
  if (phase === "delayed_recheck") return "Re-check whether mixed-wrapper performance returns after spacing.";
  if (phase === "maintenance_mix") return "Use remaining programme sessions for mixed transfer maintenance.";
  if (phase === "portable") return "The relation has passed mixed and delayed checks.";
  return "Build the base representation.";
}

export function transferMetricsFromEvidence(evidence: CellEvidence[], protocolGroup?: ProtocolGroup | null): TransferMetricSnapshot {
  const path = pathForStartCarrier(startCarrierForProtocolGroup(protocolGroup));
  const start = evidenceFor(evidence, "ACC", path.startWrapper);
  const carrierTarget = evidenceFor(evidence, "ACC", path.carrierTargetWrapper);
  const frameTarget = evidenceFor(evidence, "ACC", path.frameTargetWrapper);
  const heldOut = evidenceFor(evidence, "ACC", path.heldOutWrapper);
  return {
    ...EMPTY_METRICS,
    recoverySlope: carrierTarget?.recentCapacitySlope ?? null,
    recoveryRatio: recoveryRatio(start, carrierTarget),
    returnStrength: start?.balancedAccuracy ?? null,
    mixedWrapperStability: mixedStabilityRatio(evidence, ALL_WRAPPER_MIX),
    compositionalTransfer: recoveryRatio(frameTarget, heldOut),
    delayedRecovery: mixedStable(evidence, ALL_WRAPPER_MIX) ? 1 : null,
  };
}
