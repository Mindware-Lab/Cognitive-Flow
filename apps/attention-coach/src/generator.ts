import { OCTAGON_POSITIONS, vectorForRelation } from "./geometry";
import {
  ACC_TRIALS_PER_SESSION,
  MINI_BLOCK_TRIALS,
  PHASE_CELL,
  PHASE_INSTRUCTIONS,
  PHASE_NAMES,
  SESSION_TRIAL_COUNT,
} from "./protocol";
import { probeStatusForTransferPhase } from "./transferController";
import { ATOMIC_WRAPPERS, atomicWrapperForCell } from "./wrapperDefinitions";
import { hashSeed, mulberry32, shuffle, takeBalanced } from "./random";
import type {
  BseToken,
  CellKey,
  CanonicalFrame,
  Construct,
  DirectionRelation,
  EvidencePurpose,
  MappingTiming,
  MiniBlockPlan,
  PhaseLabel,
  PhaseStatus,
  ProbeStatus,
  Ratio,
  SessionPlan,
  StimulusCarrier,
  StimulusItem,
  TokenColor,
  TransferControllerState,
  TrialCondition,
  TrialDefinition,
  TransitionKey,
  WrapperId,
  WrapperMix,
} from "./types";

const RATIO_COUNTS: Record<Ratio, 3 | 4 | 5> = {
  "5:0": 5,
  "4:1": 4,
  "3:2": 3,
};

export const EXPOSURE_GRID_MS = [100, 150, 200, 300, 400, 500, 700, 1000, 1500] as const;
export const RATIO_GRID: Ratio[] = ["5:0", "4:1", "3:2"];
const TOKEN_COLORS: TokenColor[] = ["blue", "yellow"];
const ALL_CELLS: CellKey[] = ["arrow_abs", "flow_abs", "arrow_rel", "flow_rel"];
const ATOMIC_CELLS: WrapperId[] = ATOMIC_WRAPPERS;

function carrierForCell(cellKey: CellKey): StimulusCarrier {
  if (cellKey === "mixed") return "mixed";
  return cellKey.startsWith("flow") ? "optic_flow" : "arrow";
}

function frameForCell(cellKey: CellKey): CanonicalFrame {
  if (cellKey === "mixed") return "mixed";
  return cellKey.endsWith("_rel") ? "relative" : "absolute";
}

function latestTransferEventId(state: TransferControllerState | null | undefined): string | null {
  const latest = state?.transferEvents?.[state.transferEvents.length - 1];
  return latest?.id || null;
}

function conditionFor(seed: string): TrialCondition {
  const random = mulberry32(hashSeed(seed));
  return {
    ratio: RATIO_GRID[Math.floor(random() * RATIO_GRID.length)],
    exposureMs: EXPOSURE_GRID_MS[Math.floor(random() * EXPOSURE_GRID_MS.length)],
  };
}

export function relationOptionsForCell(cellKey: CellKey): DirectionRelation[] {
  if (cellKey === "arrow_abs" || cellKey === "flow_abs") return ["left", "right"];
  if (cellKey === "arrow_rel" || cellKey === "flow_rel") return ["out", "in"];
  return ["left", "right", "out", "in"];
}

function transitionKeyForCell(phase: PhaseLabel, cellKey: CellKey): TransitionKey | null {
  if (phase === "P2_FLOW_ABS" && cellKey === "flow_abs") return "T_CM_BASE";
  if (phase === "P3_ARROW_REL" && cellKey === "arrow_rel") return "T_FRAME_ARROW";
  if (phase === "P4_FLOW_REL" && cellKey === "flow_rel") return "T_CM_REL";
  if (phase === "P2_ARROW_ABS" && cellKey === "arrow_abs") return "T_CM_BASE";
  if (phase === "P3_FLOW_REL" && cellKey === "flow_rel") return "T_FRAME_FLOW";
  if (phase === "P4_ARROW_REL" && cellKey === "arrow_rel") return "T_CM_REL";
  if (phase === "P5_MIXED") return "T_MIXED";
  if (phase === "P6_DELAYED") return "T_DELAYED";
  return null;
}

function bseOptions(relations: DirectionRelation[]): BseToken[] {
  return relations.flatMap((relation) => TOKEN_COLORS.map((color) => `${relation}_${color}` as BseToken));
}

function buildItems(
  random: () => number,
  cellKey: CellKey,
  relationCategories: DirectionRelation[],
  colors: TokenColor[] | null,
  majorityCount: 3 | 4 | 5,
): { items: StimulusItem[]; correctResponse: string; responseOptions: string[] } {
  const majorityRelation = relationCategories[Math.floor(random() * relationCategories.length)];
  const minorityRelation = relationCategories.find((relation) => relation !== majorityRelation) || majorityRelation;
  const relationList = shuffle(random, [
    ...Array<DirectionRelation>(majorityCount).fill(majorityRelation),
    ...Array<DirectionRelation>(5 - majorityCount).fill(minorityRelation),
  ]);
  const positions = shuffle(random, Array.from({ length: 8 }, (_, index) => index)).slice(0, 5);

  if (!colors) {
    const items = positions.map((positionIndex, itemIndex) => {
      const position = OCTAGON_POSITIONS[positionIndex];
      const relation = relationList[itemIndex];
      return {
        positionIndex,
        position,
        relation,
        vector: vectorForRelation(relation, position),
      };
    });
    return { items, correctResponse: majorityRelation, responseOptions: relationCategories };
  }

  const responseOptions = bseOptions(relationCategories);
  const majorityColor = colors[Math.floor(random() * colors.length)];
  const majorityToken = `${majorityRelation}_${majorityColor}` as BseToken;
  const otherTokens = responseOptions.filter((token) => token !== majorityToken);
  const tokens = shuffle(random, [
    ...Array<BseToken>(majorityCount).fill(majorityToken),
    ...takeBalanced(random, otherTokens, 5 - majorityCount),
  ]);
  const items = positions.map((positionIndex, itemIndex) => {
    const [relation, color] = tokens[itemIndex].split("_") as [DirectionRelation, TokenColor];
    const position = OCTAGON_POSITIONS[positionIndex];
    return {
      positionIndex,
      position,
      relation,
      color,
      vector: vectorForRelation(relation, position),
    };
  });
  return { items, correctResponse: majorityToken, responseOptions };
}

export function generateTrial(
  sessionId: string,
  miniBlockId: string,
  trialIndex: number,
  construct: Construct,
  phase: PhaseLabel,
  cellKey: CellKey,
  isReferenceRecheck: boolean,
  conditionOverride?: TrialCondition,
  transferMeta?: {
    probeStatus?: ProbeStatus;
    evidencePurpose?: EvidencePurpose;
    mixRatio?: number | null;
    mappingTiming?: MappingTiming;
    lureType?: string | null;
    transferEventId?: string | null;
  },
): TrialDefinition {
  const seed = `${sessionId}:${miniBlockId}:${trialIndex}:${construct}:${phase}:${cellKey}`;
  const random = mulberry32(hashSeed(seed));
  const condition = conditionOverride || conditionFor(seed);
  const majorityCount = RATIO_COUNTS[condition.ratio];
  const relations = relationOptionsForCell(cellKey);
  const built = buildItems(random, cellKey, relations, construct === "BSE" ? TOKEN_COLORS : null, majorityCount);
  return {
    id: `${miniBlockId}-${trialIndex}`,
    sessionId,
    miniBlockId,
    trialIndex,
    construct,
    phase,
    cellKey,
    transitionKey: transitionKeyForCell(phase, cellKey),
    isReferenceRecheck,
    wrapperId: atomicWrapperForCell(cellKey) || "arrow_abs",
    carrier: carrierForCell(cellKey),
    frame: frameForCell(cellKey),
    probeStatus: transferMeta?.probeStatus || (isReferenceRecheck ? "return_to_base" : "base"),
    evidencePurpose: transferMeta?.evidencePurpose || evidencePurposeForProbeStatus(transferMeta?.probeStatus || (isReferenceRecheck ? "return_to_base" : "base")),
    mixRatio: transferMeta?.mixRatio ?? null,
    mappingTiming: transferMeta?.mappingTiming ?? null,
    lureType: transferMeta?.lureType ?? null,
    transferEventId: transferMeta?.transferEventId ?? null,
    ratio: condition.ratio,
    exposureMsRequested: condition.exposureMs,
    majorityCount,
    responseOptions: built.responseOptions,
    correctResponse: built.correctResponse,
    items: built.items,
    seed,
  };
}

function blockPlan(
  id: string,
  index: number,
  construct: Construct,
  label: string,
  instruction: string,
  cells: CellKey[],
  probeStatus: ProbeStatus = "base",
  evidencePurpose: EvidencePurpose = evidencePurposeForProbeStatus(probeStatus),
  mixRatio: number | null = null,
  transferEventId: string | null = null,
): MiniBlockPlan {
  const currentCell = cells[0];
  const currentTrials = cells.filter((cell) => cell === currentCell).length;
  const wrapperId = atomicWrapperForCell(currentCell) || "arrow_abs";
  return {
    id,
    index,
    construct,
    label,
    instruction,
    cells,
    trialCount: MINI_BLOCK_TRIALS,
    currentTrials,
    referenceTrials: MINI_BLOCK_TRIALS - currentTrials,
    wrapperId,
    probeStatus,
    evidencePurpose,
    mixRatio,
    transferEventId,
  };
}

function evidencePurposeForProbeStatus(probeStatus: ProbeStatus): EvidencePurpose {
  if (probeStatus === "diagnostic_probe") return "diagnostic";
  if (probeStatus === "transition_probe" || probeStatus === "held_out") return "formal_probe";
  if (probeStatus === "recovery") return "recovery";
  if (probeStatus === "return_to_base") return "return";
  if (probeStatus === "mix") return "mix";
  if (probeStatus === "delayed_recheck") return "delayed_recheck";
  return "training";
}

function cellsByRatio(base: CellKey, target: CellKey, count: number, targetRatio: number): CellKey[] {
  const targetCount = Math.max(1, Math.min(count - 1, Math.round(count * targetRatio)));
  return [...Array<CellKey>(count - targetCount).fill(base), ...Array<CellKey>(targetCount).fill(target)];
}

function balancedCells(cells: CellKey[], count: number): CellKey[] {
  return Array.from({ length: count }, (_, index) => cells[index % cells.length]);
}

function cellsFromMix(mix: WrapperMix, count: number): CellKey[] {
  const entries = ATOMIC_CELLS
    .map((wrapper) => ({ wrapper, ratio: mix.wrapperRatios[wrapper] || 0 }))
    .filter((entry) => entry.ratio > 0);
  if (!entries.length) return Array<CellKey>(count).fill("arrow_abs");
  const allocated: CellKey[] = [];
  let remaining = count;
  entries.forEach((entry, index) => {
    const itemCount = index === entries.length - 1 ? remaining : Math.max(1, Math.round(count * entry.ratio));
    allocated.push(...Array<CellKey>(Math.min(remaining, itemCount)).fill(entry.wrapper));
    remaining -= itemCount;
  });
  while (allocated.length < count) allocated.push(entries[allocated.length % entries.length].wrapper);
  return allocated.slice(0, count);
}

function transferMiniBlockPlans(
  phase: PhaseLabel,
  state: TransferControllerState,
  sessionSeed: string,
): MiniBlockPlan[] {
  const random = mulberry32(hashSeed(`${sessionSeed}:${state.phase}:transfer-blocks`));
  const probeStatus = probeStatusForTransferPhase(state.phase);
  const eventId = latestTransferEventId(state);
  const base = state.activeBaseWrapper || "arrow_abs";
  const target = state.activeTargetWrapper || base;
  const ratio = state.mixRatio ?? (state.phase === "transition_probe" || state.phase === "expected_dip" ? 0.2 : null);

  if (state.phase === "diagnostic_probe") {
    return [
      blockPlan("acc-1", 1, "ACC", "Base Attention", "Keep finding the base signal.", Array(20).fill(base), "base", "training", null, eventId),
      blockPlan("acc-2", 2, "ACC", "Base Attention", "Keep the current rule stable.", Array(20).fill(base), "base", "training", null, eventId),
      blockPlan("acc-3", 3, "ACC", "Diagnostic Probe", "A few new-format trials check transfer readiness.", cellsByRatio(base, target, 20, 0.1), "diagnostic_probe", "diagnostic", 0.1, eventId),
      blockPlan("bse-1", 4, "BSE", "Binding Focus", "Keep direction and colour together.", Array(20).fill(base), "base", "training", null, eventId),
    ];
  }

  if (state.phase === "transition_probe" || state.phase === "expected_dip") {
    return [
      blockPlan("acc-1", 1, "ACC", "Anchor", "Start from the familiar signal.", Array(20).fill(base), "base", "training", null, eventId),
      blockPlan("acc-2", 2, "ACC", "Transfer Probe", "The new format appears at a controlled dose.", shuffle(random, cellsByRatio(base, target, 20, 0.2)), "transition_probe", "formal_probe", 0.2, eventId),
      blockPlan("acc-3", 3, "ACC", "Recovery Check", "Recover the same rule without increasing difficulty.", Array(20).fill(target), "recovery", "recovery", null, eventId),
      blockPlan("bse-1", 4, "BSE", "Binding Focus", "Binding stays in the familiar format today.", Array(20).fill(base), "base", "training", null, eventId),
    ];
  }

  if (state.phase === "recovering") {
    return [
      blockPlan("acc-1", 1, "ACC", "Recovery 1", PHASE_INSTRUCTIONS[phase], Array(20).fill(target), "recovery", "recovery", null, eventId),
      blockPlan("acc-2", 2, "ACC", "Recovery 2", "Hold demand steady in the new format.", Array(20).fill(target), "recovery", "recovery", null, eventId),
      blockPlan("acc-3", 3, "ACC", "Recovery 3", "Look for the same relation, not the old surface.", Array(20).fill(target), "recovery", "recovery", null, eventId),
      blockPlan("bse-1", 4, "BSE", "Binding Focus", "Keep direction and colour together.", Array(20).fill(target), "recovery", "recovery", null, eventId),
    ];
  }

  if (state.phase === "return_to_base") {
    return [
      blockPlan("acc-1", 1, "ACC", "Return Check 1", "Return to the base format.", Array(20).fill(base), "return_to_base", "return", null, eventId),
      blockPlan("acc-2", 2, "ACC", "Return Check 2", "Check that the original signal is still available.", Array(20).fill(base), "return_to_base", "return", null, eventId),
      blockPlan("acc-3", 3, "ACC", "Return Check 3", "Keep the base rule stable.", Array(20).fill(base), "return_to_base", "return", null, eventId),
      blockPlan("bse-1", 4, "BSE", "Binding Focus", "Binding returns to the base format.", Array(20).fill(base), "return_to_base", "return", null, eventId),
    ];
  }

  if (state.phase === "held_out_composition") {
    const heldOut = state.heldOutWrapper || "flow_rel";
    const nearestLearned = state.frameTargetWrapper || "arrow_rel";
    return [
      blockPlan("acc-1", 1, "ACC", "Held-out Probe", "First exposure to the recombined format.", Array(20).fill(heldOut), "held_out", "formal_probe", null, eventId),
      blockPlan("acc-2", 2, "ACC", "Recovery Start", "Recover the same relation in the held-out format.", Array(20).fill(heldOut), "recovery", "recovery", null, eventId),
      blockPlan("acc-3", 3, "ACC", "Base Re-entry", "Return briefly to the nearest learned relation.", Array(20).fill(nearestLearned), "return_to_base", "return", null, eventId),
      blockPlan("bse-1", 4, "BSE", "Binding Focus", "Binding uses the nearest learned relation.", Array(20).fill(nearestLearned), "return_to_base", "return", null, eventId),
    ];
  }

  if (state.phase.includes("mix") && state.phase !== "maintenance_mix") {
    const targetRatio = ratio ?? 0.5;
    const activeMix = state.activeMix || { wrapperRatios: { [base]: 1 - targetRatio, [target]: targetRatio }, randomised: state.phase === "random_mix" };
    const accCells = shuffle(random, cellsFromMix(activeMix, 60));
    const bseCells = shuffle(random, cellsFromMix(activeMix, 20));
    return [
      blockPlan("acc-1", 1, "ACC", "Mixed Attention 1", "Formats now mix at a controlled ratio.", accCells.slice(0, 20), "mix", "mix", targetRatio, eventId),
      blockPlan("acc-2", 2, "ACC", "Mixed Attention 2", "Keep the rule stable as formats change.", accCells.slice(20, 40), "mix", "mix", targetRatio, eventId),
      blockPlan("acc-3", 3, "ACC", "Mixed Attention 3", "Stay flexible through the final attention block.", accCells.slice(40, 60), "mix", "mix", targetRatio, eventId),
      blockPlan("bse-1", 4, "BSE", "Mixed Binding", "Direction-colour pairs switch across formats.", bseCells, "mix", "mix", targetRatio, eventId),
    ];
  }

  if (state.phase === "full_factorial_mix" || state.phase === "maintenance_mix" || state.phase === "portable" || state.phase === "delayed_recheck" || state.phase === "maintenance_pending") {
    const cells: CellKey[] = ["arrow_abs", "flow_abs", "arrow_rel", "flow_rel"];
    const accCells = shuffle(random, balancedCells(cells, 60));
    const bseCells = shuffle(random, balancedCells(cells, 20));
    const isDelayedCollection = state.phase === "delayed_recheck" || state.phase === "maintenance_pending";
    const status = isDelayedCollection ? "delayed_recheck" : "mix";
    const purpose = isDelayedCollection ? "delayed_recheck" : "mix";
    return [
      blockPlan("acc-1", 1, "ACC", "Full Mix 1", "All trained formats can appear.", accCells.slice(0, 20), status, purpose, null, eventId),
      blockPlan("acc-2", 2, "ACC", "Full Mix 2", "Use the relation before reacting to the surface.", accCells.slice(20, 40), status, purpose, null, eventId),
      blockPlan("acc-3", 3, "ACC", "Full Mix 3", "Keep the rule stable across switching.", accCells.slice(40, 60), status, purpose, null, eventId),
      blockPlan("bse-1", 4, "BSE", "Full Mix Binding", "Binding follows the same wrapper mix.", bseCells, status, purpose, null, eventId),
    ];
  }

  return [];
}

export function miniBlockPlansForPhase(
  phase: PhaseLabel,
  sessionSeed: string,
  transferState?: TransferControllerState | null,
): MiniBlockPlan[] {
  if (transferState?.version === "horizontal-transfer-v1.0") {
    const transferPlans = transferMiniBlockPlans(phase, transferState, sessionSeed);
    if (transferPlans.length > 0) return transferPlans;
  }
  const current = PHASE_CELL[phase];
  const random = mulberry32(hashSeed(`${sessionSeed}:${phase}:blocks`));
  if (phase === "P1_ARROW_ABS" || phase === "P1_FLOW_ABS") {
    return [
      blockPlan("acc-1", 1, "ACC", "Attention Control 1", PHASE_INSTRUCTIONS[phase], Array(20).fill(current)),
      blockPlan("acc-2", 2, "ACC", "Attention Control 2", "Keep finding the majority direction.", Array(20).fill(current)),
      blockPlan("acc-3", 3, "ACC", "Attention Control 3", "One more attention block before Binding Focus.", Array(20).fill(current)),
      blockPlan("bse-1", 4, "BSE", "Binding Focus", "Report the direction-colour pair that appears most often.", Array(20).fill(current)),
    ];
  }
  if (phase === "P2_FLOW_ABS" || phase === "P3_ARROW_REL" || phase === "P2_ARROW_ABS" || phase === "P3_FLOW_REL") {
    const reference: CellKey =
      phase === "P2_ARROW_ABS" || phase === "P3_FLOW_REL"
        ? "flow_abs"
        : "arrow_abs";
    return [
      blockPlan("acc-1", 1, "ACC", "Attention Control 1", PHASE_INSTRUCTIONS[phase], Array(20).fill(current)),
      blockPlan("acc-2", 2, "ACC", "Attention Control 2", "Stay with the current format.", Array(20).fill(current)),
      blockPlan("acc-3", 3, "ACC", "Progress Check", "A short check shows how well earlier skills are staying active.", [
        ...Array<CellKey>(8).fill(current),
        ...Array<CellKey>(12).fill(reference),
      ]),
      blockPlan("bse-1", 4, "BSE", "Binding Focus", "Keep direction and colour together.", [
        ...Array<CellKey>(16).fill(current),
        ...Array<CellKey>(4).fill(reference),
      ]),
    ];
  }
  if (phase === "P4_FLOW_REL" || phase === "P4_ARROW_REL") {
    const absoluteReference: CellKey = phase === "P4_ARROW_REL" ? "arrow_abs" : "flow_abs";
    const relationalReference: CellKey = phase === "P4_ARROW_REL" ? "flow_rel" : "arrow_rel";
    return [
      blockPlan("acc-1", 1, "ACC", "Attention Control 1", PHASE_INSTRUCTIONS[phase], Array(20).fill(current)),
      blockPlan("acc-2", 2, "ACC", "Attention Control 2", "Recover the relation in the new format.", Array(20).fill(current)),
      blockPlan("acc-3", 3, "ACC", "Progress Check", "A short mix checks how earlier skills are carrying forward.", [
        ...Array<CellKey>(10).fill(absoluteReference),
        ...Array<CellKey>(10).fill(relationalReference),
      ]),
      blockPlan("bse-1", 4, "BSE", "Binding Focus", "Keep direction and colour together as the format changes.", [
        ...Array<CellKey>(12).fill(current),
        ...Array<CellKey>(4).fill(absoluteReference),
        ...Array<CellKey>(4).fill(relationalReference),
      ]),
    ];
  }
  const mixedAcc = shuffle(random, ALL_CELLS.flatMap((cell) => Array<CellKey>(15).fill(cell)));
  const mixedBse = shuffle(random, ALL_CELLS.flatMap((cell) => Array<CellKey>(5).fill(cell)));
  return [
    blockPlan("acc-1", 1, "ACC", "Flexible Attention 1", PHASE_INSTRUCTIONS[phase], mixedAcc.slice(0, 20)),
    blockPlan("acc-2", 2, "ACC", "Flexible Attention 2", "Formats keep switching. Use the response labels.", mixedAcc.slice(20, 40)),
    blockPlan("acc-3", 3, "ACC", "Flexible Attention 3", "Stay flexible through the final attention block.", mixedAcc.slice(40, 60)),
    blockPlan("bse-1", 4, "BSE", "Flexible Binding", "Direction-colour pairs switch across formats.", mixedBse),
  ];
}

export function createSessionPlan(
  sessionNumber: number,
  phase: PhaseLabel,
  phaseStatus: PhaseStatus,
  nominalBand: string | null,
  sessionSeed = `attention-${sessionNumber}-${phase}`,
  programmeRunId = "programme-1-legacy",
  programmeCycle = 1,
  transferState?: TransferControllerState | null,
): SessionPlan {
  const miniBlocks = miniBlockPlansForPhase(phase, sessionSeed, transferState).map((block) => ({
    ...block,
    cells: shuffle(mulberry32(hashSeed(`${sessionSeed}:${block.id}:cells`)), block.cells),
  }));
  const trials = miniBlocks.flatMap((block) =>
    block.cells.map((cellKey, index) =>
      generateTrial(
        sessionSeed,
        block.id,
        index,
        block.construct,
        phase,
        cellKey,
        cellKey !== PHASE_CELL[phase] && PHASE_CELL[phase] !== "mixed",
        undefined,
        {
          probeStatus: block.probeStatus,
          evidencePurpose: block.evidencePurpose,
          mixRatio: block.mixRatio,
          transferEventId: block.transferEventId,
        },
      ),
    ),
  );
  if (trials.length !== SESSION_TRIAL_COUNT) {
    throw new Error(`Session plan must contain ${SESSION_TRIAL_COUNT} trials.`);
  }
  const accTrials = trials.filter((trial) => trial.construct === "ACC");
  const bseTrials = trials.filter((trial) => trial.construct === "BSE");
  if (accTrials.length !== ACC_TRIALS_PER_SESSION || bseTrials.length !== 20) {
    throw new Error("Session plan must use the 60 ACC / 20 BSE v1 budget.");
  }
  return {
    sessionId: sessionSeed,
    programmeRunId,
    programmeCycle,
    sessionNumber,
    phase,
    phaseStatus,
    nominalBand,
    transferPhase: transferState?.phase,
    miniBlocks,
    trials,
  };
}

export function createFreePlaySessionPlan(
  construct: Construct,
  cellKey: CellKey,
  sessionSeed = `free-${construct}-${cellKey}-${Date.now()}`,
  mixedCells: WrapperId[] = ATOMIC_CELLS,
): SessionPlan {
  const random = mulberry32(hashSeed(`${sessionSeed}:free-play`));
  const cells =
    cellKey === "mixed"
      ? shuffle(random, balancedCells(mixedCells, 20))
      : Array<CellKey>(20).fill(cellKey);
  const block = blockPlan(
    "free-1",
    1,
    construct,
    construct === "ACC" ? "Attention Control Practice" : "Binding Focus Practice",
    "Practise this game directly. This block does not change your guided learning path.",
    cells,
  );
  return {
    sessionId: sessionSeed,
    programmeRunId: "free-play",
    programmeCycle: 0,
    sessionNumber: 0,
    phase: cellKey === "flow_rel" ? "P4_FLOW_REL" : cellKey === "arrow_rel" ? "P3_ARROW_REL" : cellKey === "flow_abs" ? "P2_FLOW_ABS" : "P1_ARROW_ABS",
    phaseStatus: "active",
    nominalBand: "free play",
    miniBlocks: [block],
    trials: block.cells.map((cell, index) =>
      generateTrial(sessionSeed, block.id, index, construct, "P1_ARROW_ABS", cell, false),
    ),
  };
}

export function phaseIntro(phase: PhaseLabel): { title: string; body: string } {
  return {
    title: PHASE_NAMES[phase],
    body: PHASE_INSTRUCTIONS[phase],
  };
}
