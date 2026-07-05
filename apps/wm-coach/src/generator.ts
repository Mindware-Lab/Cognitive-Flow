import { OCTAGON_POSITIONS, vectorForRelation } from "./geometry";
import { PHASE_CELL, PHASE_INSTRUCTIONS, PHASE_NAMES } from "./protocol";
import { hashSeed, mulberry32, shuffle } from "./random";
import { INITIAL_STAIRCASE_LEVEL, clampNLevel } from "./staircase";
import type {
  BseToken,
  CanonicalRelation,
  CellKey,
  Construct,
  DirectionRelation,
  Layer,
  MiniBlockPlan,
  PhaseLabel,
  PhaseStatus,
  PublicLabel,
  RelationFamily,
  SessionPlan,
  StimulusCarrier,
  StimulusItem,
  TechnicalLabel,
  TokenColor,
  TrialCondition,
  TrialDefinition,
  TransitionKey,
} from "./types";

const MODEL_VERSION = "wm-nback-v0.1";
const DISPLAYED_BASE_TRIALS = 20;
const EXPOSURE_MS = 1200;
const TOKEN_COLORS: TokenColor[] = ["blue", "yellow", "green", "purple"];
const ABS_RELATIONS: DirectionRelation[] = ["left", "right", "up", "down"];
const RADIAL_RELATIONS: DirectionRelation[] = ["out", "in"];
const TANGENTIAL_RELATIONS: DirectionRelation[] = ["cw", "ccw"];

type Token = {
  relation: CanonicalRelation;
  renderRelation: DirectionRelation;
  colour: TokenColor | null;
  family: RelationFamily;
};

function layerForConstruct(construct: Construct): { layer: Layer; publicLabel: PublicLabel; technicalLabel: TechnicalLabel } {
  return construct === "BSE"
    ? { layer: "binding_memory", publicLabel: "Binding Memory", technicalLabel: "Binding WMC" }
    : { layer: "relational_memory", publicLabel: "Relational Memory", technicalLabel: "Relational WMC" };
}

export function carrierForCell(cellKey: CellKey): StimulusCarrier {
  return cellKey === "flow_abs" || cellKey === "flow_rel" ? "optic_flow" : "arrow";
}

export function frameForCell(cellKey: CellKey): "absolute" | "relational" {
  return cellKey === "arrow_rel" || cellKey === "flow_rel" ? "relational" : "absolute";
}

export function relationFamiliesForCell(cellKey: CellKey): RelationFamily[] {
  if (cellKey === "arrow_abs" || cellKey === "flow_abs") return ["absolute_direction"];
  if (cellKey === "arrow_rel") return ["radial", "tangential"];
  if (cellKey === "flow_rel") return ["radial", "tangential", "spiral"];
  return ["absolute_direction", "radial", "tangential", "spiral"];
}

function canonicalRelation(relation: DirectionRelation, family: RelationFamily, random: () => number): CanonicalRelation {
  if (family === "spiral") {
    if (relation === "out") return random() < 0.5 ? "SPIRAL_OUT_CW" : "SPIRAL_OUT_CCW";
    if (relation === "in") return random() < 0.5 ? "SPIRAL_IN_CW" : "SPIRAL_IN_CCW";
    if (relation === "cw") return random() < 0.5 ? "SPIRAL_OUT_CW" : "SPIRAL_IN_CW";
    return random() < 0.5 ? "SPIRAL_OUT_CCW" : "SPIRAL_IN_CCW";
  }
  if (relation === "left") return "LEFT";
  if (relation === "right") return "RIGHT";
  if (relation === "up") return "UP";
  if (relation === "down") return "DOWN";
  if (relation === "out") return "OUT";
  if (relation === "in") return "IN";
  if (relation === "cw") return "CW";
  return "CCW";
}

function relationOptionsForFamily(family: RelationFamily): DirectionRelation[] {
  if (family === "absolute_direction") return ABS_RELATIONS;
  if (family === "radial") return RADIAL_RELATIONS;
  if (family === "tangential") return TANGENTIAL_RELATIONS;
  if (family === "spiral") return ["out", "in", "cw", "ccw"];
  return [...ABS_RELATIONS, ...RADIAL_RELATIONS, ...TANGENTIAL_RELATIONS];
}

export function relationOptionsForCell(cellKey: CellKey): DirectionRelation[] {
  return Array.from(new Set(relationFamiliesForCell(cellKey).flatMap(relationOptionsForFamily)));
}

function transitionKeyForCell(phase: PhaseLabel, cellKey: CellKey): TransitionKey | null {
  if ((phase === "P2_FLOW_ABS" || phase === "P2_ARROW_ABS") && (cellKey === "flow_abs" || cellKey === "arrow_abs")) return "T_CM_BASE";
  if ((phase === "P3_ARROW_REL" || phase === "P4_ARROW_REL") && cellKey === "arrow_rel") return "T_FRAME_ARROW";
  if ((phase === "P3_FLOW_REL" || phase === "P4_FLOW_REL") && cellKey === "flow_rel") return "T_FRAME_FLOW";
  if (phase === "P4_FLOW_REL" || phase === "P4_ARROW_REL") return "T_CM_REL";
  if (phase === "P5_MIXED") return "T_MIXED";
  if (phase === "P6_DELAYED") return "T_DELAYED";
  return null;
}

function wrapperIdFor(construct: Construct, phase: PhaseLabel, cellKey: CellKey, blockIndex = 1): string {
  const layer = construct === "BSE" ? "binding_memory" : "relational_memory";
  const cell = cellKey === "mixed" ? "mixed" : cellKey;
  return `${layer}:${phase}:${cell}:b${blockIndex}`;
}

function tokenSignature(token: Token): string {
  return `${token.relation}:${token.colour || "none"}`;
}

function randomToken(random: () => number, cellKey: CellKey, construct: Construct, avoid?: Token[]): Token {
  const families = relationFamiliesForCell(cellKey);
  const avoidSignatures = new Set((avoid || []).map(tokenSignature));
  for (let attempt = 0; attempt < 50; attempt += 1) {
    const family = families[Math.floor(random() * families.length)];
    const renderRelation = relationOptionsForFamily(family)[Math.floor(random() * relationOptionsForFamily(family).length)];
    const relation = canonicalRelation(renderRelation, family, random);
    const colour = construct === "BSE" ? TOKEN_COLORS[Math.floor(random() * TOKEN_COLORS.length)] : null;
    const token = { relation, renderRelation, colour, family };
    if (!avoidSignatures.has(tokenSignature(token))) return token;
  }
  const family = families[0];
  const renderRelation = relationOptionsForFamily(family)[0];
  return {
    relation: canonicalRelation(renderRelation, family, random),
    renderRelation,
    colour: construct === "BSE" ? "blue" : null,
    family,
  };
}

function lureToken(random: () => number, target: Token, cellKey: CellKey, construct: Construct): Token {
  if (construct === "BSE" && target.colour) {
    const otherColour = shuffle(random, TOKEN_COLORS.filter((colour) => colour !== target.colour))[0];
    return { ...target, colour: otherColour };
  }
  const relation = randomToken(random, cellKey, construct, [target]);
  return { ...relation, colour: target.colour };
}

function positionForTrial(random: () => number, trialIndex: number) {
  const positions = [0, 1, 2, 3, 4, 5, 6, 7];
  const base = positions[trialIndex % positions.length];
  return OCTAGON_POSITIONS[base + Math.floor(random() * 2) % positions.length] || OCTAGON_POSITIONS[base];
}

function itemForToken(random: () => number, token: Token, trialIndex: number): StimulusItem {
  const positionIndex = trialIndex % OCTAGON_POSITIONS.length;
  const position = positionForTrial(random, trialIndex);
  return {
    positionIndex,
    position,
    relation: token.renderRelation,
    color: token.colour || undefined,
    vector: vectorForRelation(token.renderRelation, position),
  };
}

function buildTrial(input: {
  sessionId: string;
  miniBlockId: string;
  trialIndex: number;
  construct: Construct;
  phase: PhaseLabel;
  cellKey: CellKey;
  isReferenceRecheck: boolean;
  wrapperId: string;
  nLevel: number;
  token: Token;
  isWarmup: boolean;
  isMatch: boolean;
  lureType: string | null;
  activeRelations: CanonicalRelation[];
  targetTrialId: string | null;
}): TrialDefinition {
  const seed = `${input.sessionId}:${input.miniBlockId}:${input.trialIndex}:${input.construct}:${input.phase}:${input.cellKey}`;
  const random = mulberry32(hashSeed(seed));
  const layer = layerForConstruct(input.construct);
  return {
    id: `${input.miniBlockId}-${input.trialIndex}`,
    sessionId: input.sessionId,
    miniBlockId: input.miniBlockId,
    trialIndex: input.trialIndex,
    construct: input.construct,
    phase: input.phase,
    cellKey: input.cellKey,
    transitionKey: transitionKeyForCell(input.phase, input.cellKey),
    isReferenceRecheck: input.isReferenceRecheck,
    ratio: "5:0",
    exposureMsRequested: EXPOSURE_MS,
    majorityCount: 5,
    responseOptions: ["MATCH"],
    correctResponse: input.isMatch ? "MATCH" : null,
    items: [itemForToken(random, input.token, input.trialIndex)],
    seed,
    appId: "wm-coach",
    layer: layer.layer,
    publicLabel: layer.publicLabel,
    technicalLabel: layer.technicalLabel,
    stimulusCarrier: carrierForCell(input.cellKey),
    frame: frameForCell(input.cellKey),
    relationFamily: input.token.family,
    relation: input.token.relation,
    colour: input.token.colour,
    wrapperId: input.wrapperId,
    nLevel: input.nLevel,
    activeRelationSetSize: input.activeRelations.length,
    activeRelationsJson: input.activeRelations,
    lureType: input.lureType,
    confidenceLabel: "calibrating",
    modelVersion: MODEL_VERSION,
    isWarmup: input.isWarmup,
    isMatch: input.isMatch,
    targetTrialId: input.targetTrialId,
  };
}

function buildNBackTrials(input: {
  sessionId: string;
  miniBlockId: string;
  construct: Construct;
  phase: PhaseLabel;
  cellKey: CellKey;
  isReferenceRecheck: boolean;
  wrapperId: string;
  nLevel: number;
  trialCount: number;
}): TrialDefinition[] {
  const random = mulberry32(hashSeed(`${input.sessionId}:${input.miniBlockId}:nback`));
  const activeRelations = Array.from(
    new Set(
      relationFamiliesForCell(input.cellKey).flatMap((family) =>
        relationOptionsForFamily(family).map((relation) => canonicalRelation(relation, family, random)),
      ),
    ),
  );
  const matchSlots = new Set<number>();
  const lureSlots = new Set<number>();
  const scored = Array.from({ length: input.trialCount - input.nLevel }, (_, index) => index + input.nLevel);
  shuffle(random, scored).slice(0, Math.max(1, Math.round(scored.length * 0.3))).forEach((slot) => matchSlots.add(slot));
  shuffle(random, scored.filter((slot) => !matchSlots.has(slot)))
    .slice(0, Math.max(1, Math.round(scored.length * 0.1)))
    .forEach((slot) => lureSlots.add(slot));

  const tokens: Token[] = [];
  const trials: TrialDefinition[] = [];
  for (let index = 0; index < input.trialCount; index += 1) {
    const target = index >= input.nLevel ? tokens[index - input.nLevel] : null;
    const isMatch = Boolean(target && matchSlots.has(index));
    const isLure = Boolean(target && lureSlots.has(index));
    const token = isMatch && target
      ? target
      : isLure && target
        ? lureToken(random, target, input.cellKey, input.construct)
        : randomToken(random, input.cellKey, input.construct, target ? [target] : []);
    tokens.push(token);
    trials.push(buildTrial({
      ...input,
      trialIndex: index,
      token,
      isWarmup: index < input.nLevel,
      isMatch,
      lureType: isLure ? (input.construct === "BSE" ? "colour_lure" : "relation_lure") : null,
      activeRelations,
      targetTrialId: target ? `${input.miniBlockId}-${index - input.nLevel}` : null,
    }));
  }
  return trials;
}

function blockPlan(
  id: string,
  index: number,
  construct: Construct,
  label: string,
  instruction: string,
  cellKey: CellKey,
  phase: PhaseLabel,
  nLevels: Record<string, number>,
): MiniBlockPlan {
  const wrapperId = wrapperIdFor(construct, phase, cellKey, index);
  const nLevel = clampNLevel(nLevels[wrapperId] ?? nLevels[`${construct}:${cellKey}`] ?? INITIAL_STAIRCASE_LEVEL);
  const trialCount = DISPLAYED_BASE_TRIALS + nLevel;
  return {
    id,
    index,
    construct,
    label,
    instruction,
    cells: Array(trialCount).fill(cellKey),
    trialCount,
    currentTrials: trialCount,
    referenceTrials: 0,
    wrapperId,
    nLevel,
    layer: construct === "BSE" ? "binding_memory" : "relational_memory",
  };
}

function cellsForPhase(phase: PhaseLabel): CellKey[] {
  if (phase === "P5_MIXED" || phase === "P6_DELAYED") return ["arrow_abs", "flow_abs", "arrow_rel", "flow_rel"];
  return [PHASE_CELL[phase]];
}

export function miniBlockPlansForPhase(phase: PhaseLabel, sessionSeed: string, nLevels: Record<string, number> = {}): MiniBlockPlan[] {
  const random = mulberry32(hashSeed(`${sessionSeed}:${phase}:blocks`));
  const phaseCells = cellsForPhase(phase);
  const nextCell = (offset: number) => phaseCells[offset % phaseCells.length];
  const relLabel = phase === "P5_MIXED" || phase === "P6_DELAYED" ? "Mixed Relational Memory" : "Relational Memory";
  return [
    blockPlan("rel-1", 1, "ACC", `${relLabel} 1`, PHASE_INSTRUCTIONS[phase], nextCell(Math.floor(random() * phaseCells.length)), phase, nLevels),
    blockPlan("rel-2", 2, "ACC", `${relLabel} 2`, "Same n-back rule, new sequence.", nextCell(1), phase, nLevels),
    blockPlan("rel-3", 3, "ACC", `${relLabel} 3`, "One more relation-only n-back block before binding.", nextCell(2), phase, nLevels),
    blockPlan("bind-1", 4, "BSE", "Binding Memory", "Track the relation and the colour together.", nextCell(3), phase, nLevels),
  ];
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
): TrialDefinition {
  const nLevel = clampNLevel(conditionOverride?.nLevel ?? INITIAL_STAIRCASE_LEVEL);
  return buildNBackTrials({
    sessionId,
    miniBlockId,
    construct,
    phase,
    cellKey,
    isReferenceRecheck,
    wrapperId: wrapperIdFor(construct, phase, cellKey),
    nLevel,
    trialCount: DISPLAYED_BASE_TRIALS + nLevel,
  })[trialIndex];
}

export function createSessionPlan(
  sessionNumber: number,
  phase: PhaseLabel,
  phaseStatus: PhaseStatus,
  nominalBand: string | null,
  nLevels: Record<string, number> = {},
): SessionPlan {
  const sessionId = `wm-${sessionNumber}-${phase}-${Date.now()}`;
  const miniBlocks = miniBlockPlansForPhase(phase, sessionId, nLevels);
  const trials = miniBlocks.flatMap((block) => buildNBackTrials({
    sessionId,
    miniBlockId: block.id,
    construct: block.construct,
    phase,
    cellKey: block.cells[0],
    isReferenceRecheck: phase === "P6_DELAYED",
    wrapperId: block.wrapperId,
    nLevel: block.nLevel,
    trialCount: block.trialCount,
  }));
  return { sessionId, sessionNumber, phase, phaseStatus, nominalBand, miniBlocks, trials };
}

export function createFreePlaySessionPlan(construct: Construct, cellKey: CellKey): SessionPlan {
  const phase: PhaseLabel = cellKey === "flow_abs" ? "P2_FLOW_ABS" : cellKey === "arrow_rel" ? "P3_ARROW_REL" : cellKey === "flow_rel" ? "P4_FLOW_REL" : "P1_ARROW_ABS";
  const sessionId = `wm-free-${construct}-${cellKey}-${Date.now()}`;
  const wrapperId = wrapperIdFor(construct, phase, cellKey, 1);
  const nLevel = INITIAL_STAIRCASE_LEVEL;
  const block: MiniBlockPlan = {
    id: "free-1",
    index: 1,
    construct,
    label: construct === "BSE" ? "Binding Memory Practice" : "Relational Memory Practice",
    instruction: "Practice only. This does not change your guided progress.",
    cells: Array(DISPLAYED_BASE_TRIALS + nLevel).fill(cellKey),
    trialCount: DISPLAYED_BASE_TRIALS + nLevel,
    currentTrials: DISPLAYED_BASE_TRIALS + nLevel,
    referenceTrials: 0,
    wrapperId,
    nLevel,
    layer: construct === "BSE" ? "binding_memory" : "relational_memory",
  };
  return {
    sessionId,
    sessionNumber: 0,
    phase,
    phaseStatus: "active",
    nominalBand: "free practice",
    miniBlocks: [block],
    trials: buildNBackTrials({ sessionId, miniBlockId: block.id, construct, phase, cellKey, isReferenceRecheck: false, wrapperId, nLevel, trialCount: block.trialCount }),
  };
}

export function phaseIntro(phase: PhaseLabel): { title: string; body: string } {
  return {
    title: PHASE_NAMES[phase],
    body: PHASE_INSTRUCTIONS[phase],
  };
}
