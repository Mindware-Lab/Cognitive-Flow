import { OCTAGON_POSITIONS, vectorForRelation } from "./geometry";
import { PHASE_CELL, PHASE_INSTRUCTIONS, PHASE_NAMES } from "./protocol";
import { probeStatusForTransferPhase } from "./transferController";
import { hashSeed, mulberry32, shuffle } from "./random";
import { INITIAL_STAIRCASE_LEVEL, clampNLevel } from "./staircase";
import type {
  BseToken,
  CapacitySpeed,
  CapacityTargetModality,
  CapacityWrapper,
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
  TransferControllerState,
  ProbeStatus,
  MappingTiming,
  WrapperId,
  WrapperMix,
} from "./types";

const MODEL_VERSION = "wm-nback-v0.1";
const DISPLAYED_BASE_TRIALS = 20;
const HUB_DISPLAY_RATIO = 0.65;
const HUB_SOA_MS: Record<CapacitySpeed, number> = {
  slow: 3000,
  fast: 1400,
};
const DEFAULT_SPEED: CapacitySpeed = "slow";
const EXPOSURE_MS = Math.round(HUB_SOA_MS.slow * HUB_DISPLAY_RATIO);
const HUB_ARENA_RADIUS_PCT = 28;
const TOKEN_COLORS: TokenColor[] = ["blue", "yellow", "green", "purple"];
const ATOMIC_CELLS: WrapperId[] = ["arrow_abs", "flow_abs", "arrow_rel", "flow_rel"];
const ABS_RELATIONS: DirectionRelation[] = ["left", "right", "up", "down"];
const RADIAL_RELATIONS: DirectionRelation[] = ["out", "in"];
const TANGENTIAL_RELATIONS: DirectionRelation[] = ["cw", "ccw"];
const RESIST_CARDINAL_ANGLES = [-90, 0, 90, 180];
const RELATE_VECTOR_MARKER_ANGLES = [-90, -45, 0, 45, 90, 135, 180, 225];
const RELATE_VECTOR_ALIGNMENTS = [
  { key: "vertical", label: "Vertical", markerIndices: [0, 4], axisDeg: 90 },
  { key: "diagonal_left", label: "Diagonal left", markerIndices: [1, 5], axisDeg: 135 },
  { key: "horizontal", label: "Horizontal", markerIndices: [2, 6], axisDeg: 180 },
  { key: "diagonal_right", label: "Diagonal right", markerIndices: [3, 7], axisDeg: 225 },
] as const;
const RELATE_VECTOR_RELATIONS = [
  { key: "toward", label: "Toward" },
  { key: "away", label: "Away" },
  { key: "same", label: "Same direction" },
  { key: "diagonal", label: "Diagonal" },
] as const;
const RESIST_VECTOR_SYMBOLS = ["Up", "Right", "Down", "Left"] as const;

type Token = {
  relation: CanonicalRelation;
  renderRelation: DirectionRelation;
  colour: TokenColor | null;
  family: RelationFamily;
};

type CapacityReferenceTrial = {
  trialIndex: number;
  isMatch: boolean;
  isLure: boolean;
  lureMatchedModality: string | null;
  canonKey: string;
  relation: CanonicalRelation;
  renderRelation: DirectionRelation;
  relationFamily: RelationFamily;
  display: TrialDefinition["capacityDisplay"];
};

function randomInt(random: () => number, min: number, max: number): number {
  return Math.floor(random() * (max - min + 1)) + min;
}

function normalizeAngleDeg(value: number): number {
  const normalized = value % 360;
  return normalized < 0 ? normalized + 360 : normalized;
}

function markerPositionForAngle(thetaDeg: number, radiusPct = HUB_ARENA_RADIUS_PCT): { xPct: number; yPct: number } {
  const theta = (thetaDeg * Math.PI) / 180;
  return {
    xPct: 50 + radiusPct * Math.cos(theta),
    yPct: 50 + radiusPct * Math.sin(theta),
  };
}

function selectIndicesPreferNonAdjacent(
  random: () => number,
  candidates: number[],
  targetCount: number,
  { avoidFinalPair = false, totalTrials = 0, allowFallback = true } = {},
): number[] {
  if (!targetCount || !candidates.length) return [];
  let best: number[] = [];
  for (let attempt = 0; attempt < 120; attempt += 1) {
    const selected: number[] = [];
    const ordered = shuffle(random, candidates);
    for (const value of ordered) {
      const leftTaken = selected.includes(value - 1);
      const rightTaken = selected.includes(value + 1);
      const finalPairConflict = avoidFinalPair && (
        (value === totalTrials - 1 && selected.includes(totalTrials - 2)) ||
        (value === totalTrials - 2 && selected.includes(totalTrials - 1))
      );
      if (leftTaken || rightTaken || finalPairConflict) continue;
      selected.push(value);
      if (selected.length >= targetCount) break;
    }
    if (selected.length > best.length) best = selected.slice();
    if (best.length >= targetCount) break;
  }
  if (best.length >= targetCount) return best.slice(0, targetCount);
  if (!allowFallback) return best;
  const remaining = shuffle(random, candidates.filter((value) => !best.includes(value)));
  while (best.length < targetCount && remaining.length) best.push(remaining.pop() as number);
  return best;
}

function scheduleMatchFlags(totalTrials: number, nLevel: number, random: () => number): boolean[] {
  const flags = Array.from({ length: totalTrials }, () => false);
  if (totalTrials <= 0 || nLevel < 1 || nLevel >= totalTrials) return flags;
  const eligible = Array.from({ length: totalTrials - nLevel }, (_, index) => index + nLevel);
  const requested = Math.round(eligible.length * 0.3);
  const maxNoAdjacent = Math.ceil(eligible.length / 2);
  const target = Math.max(0, Math.min(requested, maxNoAdjacent));
  const selected = selectIndicesPreferNonAdjacent(random, eligible, target, {
    avoidFinalPair: true,
    totalTrials,
    allowFallback: false,
  });
  selected.forEach((index) => {
    flags[index] = true;
  });
  return flags;
}

function scheduleLureFlags(matchFlags: boolean[], nLevel: number, random: () => number): boolean[] {
  const totalTrials = matchFlags.length;
  const flags = Array.from({ length: totalTrials }, () => false);
  if (nLevel < 1) return flags;
  const candidates = Array.from({ length: totalTrials - nLevel }, (_, index) => index + nLevel).filter((index) => !matchFlags[index]);
  const targetCount = Math.max(0, Math.min(Math.round(candidates.length * 0.1), candidates.length));
  const selected = selectIndicesPreferNonAdjacent(random, candidates, targetCount);
  selected.forEach((index) => {
    flags[index] = true;
  });
  return flags;
}

function pickDifferent(previous: number, random: () => number, count = 4): number {
  let next = randomInt(random, 0, count - 1);
  while (next === previous) next = randomInt(random, 0, count - 1);
  return next;
}

function buildTargetStream(totalTrials: number, nLevel: number, matchFlags: boolean[], random: () => number, count = 4): number[] {
  const values = Array.from({ length: totalTrials }, () => 0);
  for (let index = 0; index < totalTrials; index += 1) {
    if (index < nLevel) {
      values[index] = randomInt(random, 0, count - 1);
    } else if (matchFlags[index]) {
      values[index] = values[index - nLevel];
    } else {
      values[index] = pickDifferent(values[index - nLevel], random, count);
    }
  }
  return values;
}

function buildConstrainedStream(totalTrials: number, nLevel: number, constraints: string[], random: () => number, count = 4): number[] {
  const values = Array.from({ length: totalTrials }, () => 0);
  for (let index = 0; index < totalTrials; index += 1) {
    if (index < nLevel) {
      values[index] = randomInt(random, 0, count - 1);
    } else if (constraints[index] === "match") {
      values[index] = values[index - nLevel];
    } else if (constraints[index] === "nonmatch") {
      values[index] = pickDifferent(values[index - nLevel], random, count);
    } else {
      values[index] = randomInt(random, 0, count - 1);
    }
  }
  return values;
}

function buildBindStreams(totalTrials: number, nLevel: number, matchFlags: boolean[], lureFlags: boolean[], random: () => number) {
  const streams = {
    loc: Array.from({ length: totalTrials }, () => 0),
    col: Array.from({ length: totalTrials }, () => 0),
    sym: Array.from({ length: totalTrials }, () => 0),
    lureMatchedModality: Array.from({ length: totalTrials }, (): string | null => null),
  };
  const targetPair = ["sym", "col"] as const;
  const nonTarget = "loc";
  for (let index = 0; index < totalTrials; index += 1) {
    if (index < nLevel) {
      streams.loc[index] = randomInt(random, 0, 3);
      streams.col[index] = randomInt(random, 0, 3);
      streams.sym[index] = randomInt(random, 0, 3);
      continue;
    }
    if (matchFlags[index]) {
      targetPair.forEach((modality) => {
        streams[modality][index] = streams[modality][index - nLevel];
      });
      streams[nonTarget][index] = randomInt(random, 0, 3);
      continue;
    }
    if (lureFlags[index]) {
      const matched = targetPair[randomInt(random, 0, targetPair.length - 1)];
      const nonMatched = targetPair.find((modality) => modality !== matched) as "sym" | "col";
      streams[matched][index] = streams[matched][index - nLevel];
      streams[nonMatched][index] = pickDifferent(streams[nonMatched][index - nLevel], random, 4);
      streams[nonTarget][index] = random() < 0.5
        ? streams[nonTarget][index - nLevel]
        : randomInt(random, 0, 3);
      streams.lureMatchedModality[index] = matched;
      continue;
    }
    targetPair.forEach((modality) => {
      streams[modality][index] = pickDifferent(streams[modality][index - nLevel], random);
    });
    streams[nonTarget][index] = randomInt(random, 0, 3);
  }
  return streams;
}

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
  if (
    phase === "P5_ARROW_MIXED" ||
    phase === "P6_FLOW_MIXED" ||
    phase === "P5_FLOW_MIXED" ||
    phase === "P6_ARROW_MIXED" ||
    phase === "P7_FULL_MIXED" ||
    phase === "P10_BIND_MIXED" ||
    phase === "P5_MIXED"
  ) return "T_MIXED";
  if (phase === "P11_DELAYED" || phase === "P6_DELAYED") return "T_DELAYED";
  return null;
}

function wrapperIdFor(construct: Construct, phase: PhaseLabel, cellKey: CellKey, blockIndex = 1): string {
  const layer = construct === "BSE" ? "binding_memory" : "relational_memory";
  const cell = cellKey === "mixed" ? "mixed" : cellKey;
  return `${layer}:${phase}:${cell}:b${blockIndex}`;
}

function latestTransferEventId(state: TransferControllerState | null | undefined): string | null {
  const latest = state?.transferEvents?.[state.transferEvents.length - 1];
  return latest?.id || null;
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

function speedSoaMs(speed: CapacitySpeed): number {
  return HUB_SOA_MS[speed] || HUB_SOA_MS.slow;
}

function speedDisplayMs(speed: CapacitySpeed): number {
  return Math.round(speedSoaMs(speed) * HUB_DISPLAY_RATIO);
}

function speedForBlock(index: number, requested?: CapacitySpeed): CapacitySpeed {
  if (requested) return requested;
  return index % 2 === 0 ? "fast" : "slow";
}

function capacityWrapperForCell(cellKey: CellKey): CapacityWrapper {
  if (cellKey === "arrow_abs") return "resist_vectors";
  if (cellKey === "arrow_rel") return "relate_vectors";
  return "optic_flow";
}

function capacityTargetForCell(cellKey: CellKey): CapacityTargetModality {
  return cellKey === "arrow_rel" || cellKey === "flow_rel" ? "rel" : "sym";
}

function canonicalForResistSym(symIdx: number): { relation: CanonicalRelation; renderRelation: DirectionRelation; family: RelationFamily } {
  if (symIdx === 0) return { relation: "UP", renderRelation: "up", family: "absolute_direction" };
  if (symIdx === 1) return { relation: "RIGHT", renderRelation: "right", family: "absolute_direction" };
  if (symIdx === 2) return { relation: "DOWN", renderRelation: "down", family: "absolute_direction" };
  return { relation: "LEFT", renderRelation: "left", family: "absolute_direction" };
}

function canonicalForRelateRelation(relationIdx: number): { relation: CanonicalRelation; renderRelation: DirectionRelation; family: RelationFamily } {
  if (relationIdx === 0) return { relation: "IN", renderRelation: "in", family: "radial" };
  if (relationIdx === 1) return { relation: "OUT", renderRelation: "out", family: "radial" };
  if (relationIdx === 2) return { relation: "RIGHT", renderRelation: "right", family: "absolute_direction" };
  return { relation: "CW", renderRelation: "cw", family: "tangential" };
}

function buildRelateVectorDisplay(relationIdx: number, alignmentIdx: number, random: () => number): TrialDefinition["capacityDisplay"] {
  const markerPositions = RELATE_VECTOR_MARKER_ANGLES.map((angleDeg) => markerPositionForAngle(angleDeg));
  const alignment = RELATE_VECTOR_ALIGNMENTS[alignmentIdx];
  const relation = RELATE_VECTOR_RELATIONS[relationIdx];
  let arrowAngles: number[];
  if (relation.key === "toward") {
    arrowAngles = [normalizeAngleDeg(alignment.axisDeg), normalizeAngleDeg(alignment.axisDeg + 180)];
  } else if (relation.key === "away") {
    arrowAngles = [normalizeAngleDeg(alignment.axisDeg + 180), normalizeAngleDeg(alignment.axisDeg)];
  } else if (relation.key === "same") {
    const baseAngle = RELATE_VECTOR_MARKER_ANGLES[randomInt(random, 0, RELATE_VECTOR_MARKER_ANGLES.length - 1)];
    arrowAngles = [baseAngle, baseAngle];
  } else {
    const diagonalOffset = random() < 0.5 ? -45 : 45;
    arrowAngles = [normalizeAngleDeg(alignment.axisDeg + diagonalOffset), normalizeAngleDeg(alignment.axisDeg - diagonalOffset)];
  }
  return {
    markerPositions,
    pairTokens: alignment.markerIndices.map((markerIndex, index) => ({
      pointPct: markerPositions[markerIndex],
      angleDeg: arrowAngles[index],
    })),
    relationLabel: relation.label,
    alignmentLabel: alignment.label,
  };
}

function buildCapacityReferenceTrials(input: {
  sessionId: string;
  miniBlockId: string;
  construct: Construct;
  cellKey: CellKey;
  nLevel: number;
  trialCount: number;
}): CapacityReferenceTrial[] {
  const random = mulberry32(hashSeed(`${input.sessionId}:${input.miniBlockId}:capacity-reference`));
  const matchFlags = scheduleMatchFlags(input.trialCount, input.nLevel, random);
  const lureFlags = scheduleLureFlags(matchFlags, input.nLevel, random);
  const wrapper = capacityWrapperForCell(input.cellKey);
  const targetModality = capacityTargetForCell(input.cellKey);

  if (input.construct === "BSE") {
    const streams = buildBindStreams(input.trialCount, input.nLevel, matchFlags, lureFlags, random);
    const markerPositions = input.cellKey === "arrow_rel" || input.cellKey === "flow_rel"
      ? RELATE_VECTOR_MARKER_ANGLES.map((angleDeg) => markerPositionForAngle(angleDeg))
      : RESIST_CARDINAL_ANGLES.map((angleDeg) => markerPositionForAngle(angleDeg));
    return streams.sym.map((symIdx, index) => {
      const relation = input.cellKey === "arrow_rel" || input.cellKey === "flow_rel"
        ? canonicalForRelateRelation(symIdx)
        : canonicalForResistSym(symIdx);
      const colour = TOKEN_COLORS[streams.col[index]];
      const baseDisplay = input.cellKey === "arrow_rel"
        ? buildRelateVectorDisplay(symIdx, streams.loc[index], random)
        : {
            markerPositions,
            pointPct: markerPositions[streams.loc[index] % markerPositions.length],
            symbolLabel: RESIST_VECTOR_SYMBOLS[symIdx],
          };
      return {
        trialIndex: index,
        isMatch: index >= input.nLevel && matchFlags[index],
        isLure: index >= input.nLevel && lureFlags[index],
        lureMatchedModality: lureFlags[index] ? streams.lureMatchedModality[index] : null,
        canonKey: `sym-col:${symIdx}-${streams.col[index]}`,
        relation: relation.relation,
        renderRelation: relation.renderRelation,
        relationFamily: relation.family,
        display: {
          ...baseDisplay,
          colour,
          pairTokens: baseDisplay.pairTokens?.map((token) => ({ ...token, colour })),
        },
      };
    });
  }

  if (wrapper === "resist_vectors") {
    const targetStream = buildTargetStream(input.trialCount, input.nLevel, matchFlags, random, 4);
    const locConstraints = Array.from({ length: input.trialCount }, () => "free");
    for (let index = input.nLevel; index < input.trialCount; index += 1) {
      locConstraints[index] = lureFlags[index] ? "match" : matchFlags[index] ? "free" : "nonmatch";
    }
    const locStream = buildConstrainedStream(input.trialCount, input.nLevel, locConstraints, random, 4);
    const markerPositions = RESIST_CARDINAL_ANGLES.map((angleDeg) => markerPositionForAngle(angleDeg));
    return targetStream.map((symIdx, index) => {
      const relation = canonicalForResistSym(symIdx);
      return {
        trialIndex: index,
        isMatch: index >= input.nLevel && matchFlags[index],
        isLure: index >= input.nLevel && lureFlags[index],
        lureMatchedModality: lureFlags[index] ? "loc" : null,
        canonKey: `${targetModality}:${symIdx}`,
        relation: relation.relation,
        renderRelation: relation.renderRelation,
        relationFamily: relation.family,
        display: {
          markerPositions,
          pointPct: markerPositions[locStream[index]],
          symbolLabel: RESIST_VECTOR_SYMBOLS[symIdx],
        },
      };
    });
  }

  if (wrapper === "relate_vectors") {
    const relationStream = buildTargetStream(input.trialCount, input.nLevel, matchFlags, random, 4);
    const alignmentConstraints = Array.from({ length: input.trialCount }, () => "free");
    for (let index = input.nLevel; index < input.trialCount; index += 1) {
      alignmentConstraints[index] = lureFlags[index] ? "match" : matchFlags[index] ? "free" : "nonmatch";
    }
    const alignmentStream = buildConstrainedStream(input.trialCount, input.nLevel, alignmentConstraints, random, 4);
    return relationStream.map((relationIdx, index) => {
      const relation = canonicalForRelateRelation(relationIdx);
      return {
        trialIndex: index,
        isMatch: index >= input.nLevel && matchFlags[index],
        isLure: index >= input.nLevel && lureFlags[index],
        lureMatchedModality: lureFlags[index] ? "sym" : null,
        canonKey: `rel:${relationIdx}`,
        relation: relation.relation,
        renderRelation: relation.renderRelation,
        relationFamily: relation.family,
        display: buildRelateVectorDisplay(relationIdx, alignmentStream[index], random),
      };
    });
  }

  const targetStream = buildTargetStream(input.trialCount, input.nLevel, matchFlags, random, 4);
  return targetStream.map((relationIdx, index) => {
    const relation = input.cellKey === "flow_rel"
      ? canonicalForRelateRelation(relationIdx)
      : canonicalForResistSym(relationIdx);
    return {
      trialIndex: index,
      isMatch: index >= input.nLevel && matchFlags[index],
      isLure: index >= input.nLevel && lureFlags[index],
      lureMatchedModality: lureFlags[index] ? "carrier" : null,
      canonKey: `${targetModality}:${relationIdx}`,
      relation: relation.relation,
      renderRelation: relation.renderRelation,
      relationFamily: relation.family,
      display: {
        markerPositions: [],
        relationLabel: relation.renderRelation,
      },
    };
  });
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
  speed: CapacitySpeed;
  capacityWrapper?: CapacityWrapper;
  capacityTargetModality?: CapacityTargetModality;
  capacityCanonKey?: string;
  soaMs?: number;
  capacityDisplay?: TrialDefinition["capacityDisplay"];
  probeStatus?: ProbeStatus;
  mixRatio?: number | null;
  mappingTiming?: MappingTiming;
  transferEventId?: string | null;
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
    carrier: carrierForCell(input.cellKey),
    protocolFrame: input.cellKey === "arrow_rel" || input.cellKey === "flow_rel" ? "relative" : "absolute",
    probeStatus: input.probeStatus || (input.isReferenceRecheck ? "return_to_base" : "base"),
    mixRatio: input.mixRatio ?? null,
    mappingTiming: input.mappingTiming ?? null,
    transferEventId: input.transferEventId ?? null,
    ratio: "5:0",
    exposureMsRequested: speedDisplayMs(input.speed),
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
    capacityWrapper: input.capacityWrapper || capacityWrapperForCell(input.cellKey),
    capacityTargetModality: input.capacityTargetModality || capacityTargetForCell(input.cellKey),
    capacitySpeed: input.speed,
    capacityCanonKey: input.capacityCanonKey || `${capacityTargetForCell(input.cellKey)}:${input.token.relation}`,
    soaMs: input.soaMs || speedSoaMs(input.speed),
    capacityDisplay: input.capacityDisplay || {},
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
  speed?: CapacitySpeed;
  probeStatus?: ProbeStatus;
  mixRatio?: number | null;
  mappingTiming?: MappingTiming;
  transferEventId?: string | null;
}): TrialDefinition[] {
  const random = mulberry32(hashSeed(`${input.sessionId}:${input.miniBlockId}:nback`));
  const speed = input.speed || DEFAULT_SPEED;
  if (input.construct === "ACC" || input.construct === "BSE") {
    const capacityTrials = buildCapacityReferenceTrials(input);
    const activeRelations = Array.from(new Set(capacityTrials.map((trial) => trial.relation)));
    return capacityTrials.map((capacityTrial) => {
      const token: Token = {
        relation: capacityTrial.relation,
        renderRelation: capacityTrial.renderRelation,
        colour: capacityTrial.display.colour || null,
        family: capacityTrial.relationFamily,
      };
      return buildTrial({
        ...input,
        speed,
        trialIndex: capacityTrial.trialIndex,
        token,
        isWarmup: capacityTrial.trialIndex < input.nLevel,
        isMatch: capacityTrial.isMatch,
        lureType: capacityTrial.isLure ? `${capacityTrial.lureMatchedModality || "distractor"}_lure` : null,
        activeRelations,
        targetTrialId: capacityTrial.trialIndex >= input.nLevel ? `${input.miniBlockId}-${capacityTrial.trialIndex - input.nLevel}` : null,
        capacityWrapper: capacityWrapperForCell(input.cellKey),
        capacityTargetModality: capacityTargetForCell(input.cellKey),
        capacityCanonKey: capacityTrial.canonKey,
        soaMs: speedSoaMs(speed),
        capacityDisplay: capacityTrial.display,
      });
    });
  }
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
      speed,
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
  speed = speedForBlock(index),
  probeStatus: ProbeStatus = "base",
  mixRatio: number | null = null,
  transferEventId: string | null = null,
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
    probeStatus,
    mixRatio,
    transferEventId,
    nLevel,
    layer: construct === "BSE" ? "binding_memory" : "relational_memory",
    speed,
  };
}

function cellsFromMix(mix: WrapperMix, count: number): CellKey[] {
  const entries = ATOMIC_CELLS
    .map((wrapper) => ({ wrapper, ratio: mix.wrapperRatios[wrapper] || 0 }))
    .filter((entry) => entry.ratio > 0);
  if (!entries.length) return Array<CellKey>(count).fill("arrow_abs");
  const cells: CellKey[] = [];
  let remaining = count;
  entries.forEach((entry, index) => {
    const itemCount = index === entries.length - 1 ? remaining : Math.max(1, Math.round(count * entry.ratio));
    cells.push(...Array<CellKey>(Math.min(remaining, itemCount)).fill(entry.wrapper));
    remaining -= itemCount;
  });
  while (cells.length < count) cells.push(entries[cells.length % entries.length].wrapper);
  return cells.slice(0, count);
}

function transferMiniBlockPlans(
  phase: PhaseLabel,
  sessionSeed: string,
  nLevels: Record<string, number>,
  state: TransferControllerState,
): MiniBlockPlan[] {
  const random = mulberry32(hashSeed(`${sessionSeed}:${state.phase}:transfer-blocks`));
  const eventId = latestTransferEventId(state);
  const base = state.activeBaseWrapper || "arrow_abs";
  const target = state.activeTargetWrapper || base;
  const ratio = state.mixRatio ?? (state.phase === "transition_probe" || state.phase === "expected_dip" ? 0.2 : null);
  const block = (
    id: string,
    index: number,
    construct: Construct,
    label: string,
    instruction: string,
    cell: CellKey,
    probeStatus: ProbeStatus,
    mixRatio: number | null = null,
  ) => blockPlan(id, index, construct, label, instruction, cell, phase, nLevels, "slow", probeStatus, mixRatio, eventId);

  if (state.phase === "diagnostic_probe") {
    return [
      block("rel-1", 1, "ACC", "Base Relational Memory", "Keep the base n-back rule stable.", base, "base"),
      block("rel-2", 2, "ACC", "Base Relational Memory", "Same n-back rule, new sequence.", base, "base"),
      block("rel-3", 3, "ACC", "Diagnostic Probe", "A few new-format trials check transfer readiness.", target, "diagnostic_probe", 0.05),
      block("bind-1", 4, "BSE", "Binding Memory", "Track the relation and colour together.", base, "base"),
    ];
  }

  if (state.phase === "transition_probe" || state.phase === "expected_dip") {
    return [
      block("rel-1", 1, "ACC", "Anchor", "Start from the familiar n-back signal.", base, "base"),
      block("rel-2", 2, "ACC", "Transfer Probe", "The new wrapper appears without raising n-level.", target, "transition_probe", ratio ?? 0.2),
      block("rel-3", 3, "ACC", "Recovery Check", "Recover the same relation in the new wrapper.", target, "recovery"),
      block("bind-1", 4, "BSE", "Binding Memory", "Binding stays in the familiar wrapper today.", base, "base"),
    ];
  }

  if (state.phase === "recovering") {
    return [
      block("rel-1", 1, "ACC", "Recovery 1", "Hold n-level steady in the new wrapper.", target, "recovery"),
      block("rel-2", 2, "ACC", "Recovery 2", "Same relation, new sequence.", target, "recovery"),
      block("rel-3", 3, "ACC", "Recovery 3", "Keep response timing controlled.", target, "recovery"),
      block("bind-1", 4, "BSE", "Binding Memory", "Binding uses the current wrapper without driving advancement.", target, "recovery"),
    ];
  }

  if (state.phase === "return_to_base") {
    return [
      block("rel-1", 1, "ACC", "Return Check 1", "Return to the base wrapper.", base, "return_to_base"),
      block("rel-2", 2, "ACC", "Return Check 2", "Check that the original n-back signal remains available.", base, "return_to_base"),
      block("rel-3", 3, "ACC", "Return Check 3", "Keep the base wrapper stable.", base, "return_to_base"),
      block("bind-1", 4, "BSE", "Binding Memory", "Binding returns to the base wrapper.", base, "return_to_base"),
    ];
  }

  if (state.phase === "held_out_composition") {
    const heldOut = state.heldOutWrapper || "flow_rel";
    const nearestLearned = state.frameTargetWrapper || "arrow_rel";
    return [
      block("rel-1", 1, "ACC", "Held-out Probe", "First exposure to the recombined wrapper.", heldOut, "held_out"),
      block("rel-2", 2, "ACC", "Recovery Start", "Recover the same relation in the held-out wrapper.", heldOut, "recovery"),
      block("rel-3", 3, "ACC", "Base Re-entry", "Return briefly to the nearest learned relation.", nearestLearned, "return_to_base"),
      block("bind-1", 4, "BSE", "Binding Memory", "Binding uses the nearest learned relation.", nearestLearned, "return_to_base"),
    ];
  }

  if (state.phase.includes("mix") && state.phase !== "maintenance_mix") {
    const targetRatio = ratio ?? 0.5;
    const mix = state.activeMix || { wrapperRatios: { [base]: 1 - targetRatio, [target]: targetRatio }, randomised: state.phase === "random_mix" };
    const cells = shuffle(random, cellsFromMix(mix, 4));
    return [
      block("rel-1", 1, "ACC", "Mixed Relational Memory 1", "Wrappers now mix at a controlled ratio.", cells[0], "mix", targetRatio),
      block("rel-2", 2, "ACC", "Mixed Relational Memory 2", "Keep the n-back relation stable as wrappers change.", cells[1], "mix", targetRatio),
      block("rel-3", 3, "ACC", "Mixed Relational Memory 3", "Stay flexible through the final relation block.", cells[2], "mix", targetRatio),
      block("bind-1", 4, "BSE", "Binding Memory", "Binding follows the same wrapper mix.", cells[3], "mix", targetRatio),
    ];
  }

  if (state.phase === "full_factorial_mix" || state.phase === "maintenance_mix" || state.phase === "portable" || state.phase === "delayed_recheck") {
    const cells = shuffle(random, [...ATOMIC_CELLS]);
    const status = state.phase === "delayed_recheck" ? "delayed_recheck" : "mix";
    return [
      block("rel-1", 1, "ACC", "Full Mix 1", "All trained wrappers can appear.", cells[0], status),
      block("rel-2", 2, "ACC", "Full Mix 2", "Use the relation before reacting to the wrapper.", cells[1], status),
      block("rel-3", 3, "ACC", "Full Mix 3", "Keep the rule stable across switching.", cells[2], status),
      block("bind-1", 4, "BSE", "Binding Memory", "Binding follows the same wrapper mix.", cells[3], status),
    ];
  }

  return [];
}

function cellsForPhase(phase: PhaseLabel): CellKey[] {
  if (phase === "P5_ARROW_MIXED" || phase === "P6_ARROW_MIXED") return ["arrow_abs", "arrow_rel"];
  if (phase === "P6_FLOW_MIXED" || phase === "P5_FLOW_MIXED") return ["flow_abs", "flow_rel"];
  if (phase === "P7_FULL_MIXED" || phase === "P10_BIND_MIXED" || phase === "P11_DELAYED" || phase === "P5_MIXED" || phase === "P6_DELAYED") return ["arrow_abs", "flow_abs", "arrow_rel", "flow_rel"];
  return [PHASE_CELL[phase]];
}

function isBindingPhase(phase: PhaseLabel): boolean {
  return phase === "P8_BIND_ARROW_REL" || phase === "P9_BIND_FLOW_REL" || phase === "P8_BIND_FLOW_REL" || phase === "P9_BIND_ARROW_REL" || phase === "P10_BIND_MIXED";
}

export function miniBlockPlansForPhase(
  phase: PhaseLabel,
  sessionSeed: string,
  nLevels: Record<string, number> = {},
  transferState?: TransferControllerState | null,
): MiniBlockPlan[] {
  if (transferState?.version === "horizontal-transfer-v1.0") {
    const transferPlans = transferMiniBlockPlans(phase, sessionSeed, nLevels, transferState);
    if (transferPlans.length > 0) return transferPlans;
  }
  const random = mulberry32(hashSeed(`${sessionSeed}:${phase}:blocks`));
  const phaseCells = cellsForPhase(phase);
  const nextCell = (offset: number) => phaseCells[offset % phaseCells.length];
  const constructForBlock = (index: number): Construct => {
    if (isBindingPhase(phase)) return "BSE";
    return index === 4 ? "BSE" : "ACC";
  };
  const labelForBlock = (index: number): string => {
    if (isBindingPhase(phase)) return `Binding Memory ${index}`;
    if (
      phase === "P5_ARROW_MIXED" ||
      phase === "P6_FLOW_MIXED" ||
      phase === "P5_FLOW_MIXED" ||
      phase === "P6_ARROW_MIXED" ||
      phase === "P7_FULL_MIXED" ||
      phase === "P5_MIXED" ||
      phase === "P6_DELAYED"
    ) return `Mixed Relational Memory ${index}`;
    return `Relational Memory ${index}`;
  };
  return [
    blockPlan("rel-1", 1, constructForBlock(1), labelForBlock(1), PHASE_INSTRUCTIONS[phase], nextCell(Math.floor(random() * phaseCells.length)), phase, nLevels),
    blockPlan("rel-2", 2, constructForBlock(2), labelForBlock(2), "Same n-back rule, new sequence.", nextCell(1), phase, nLevels),
    blockPlan("rel-3", 3, constructForBlock(3), labelForBlock(3), isBindingPhase(phase) ? "Keep relation and colour bound together." : "One more relation-only n-back block before binding.", nextCell(2), phase, nLevels),
    blockPlan("bind-1", 4, constructForBlock(4), labelForBlock(4), isBindingPhase(phase) ? "Track the relation and the colour together." : "Track the relation and the colour together.", nextCell(3), phase, nLevels),
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
  transferMeta?: {
    probeStatus?: ProbeStatus;
    mixRatio?: number | null;
    mappingTiming?: MappingTiming;
    transferEventId?: string | null;
  },
): TrialDefinition {
  const nLevel = clampNLevel(conditionOverride?.nLevel ?? INITIAL_STAIRCASE_LEVEL);
  const speed = conditionOverride?.speed || DEFAULT_SPEED;
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
    speed,
    probeStatus: transferMeta?.probeStatus,
    mixRatio: transferMeta?.mixRatio,
    mappingTiming: transferMeta?.mappingTiming,
    transferEventId: transferMeta?.transferEventId,
  })[trialIndex];
}

export function createSessionPlan(
  sessionNumber: number,
  phase: PhaseLabel,
  phaseStatus: PhaseStatus,
  nominalBand: string | null,
  nLevels: Record<string, number> = {},
  programmeRunId = "wm-programme-1-legacy",
  programmeCycle = 1,
  transferState?: TransferControllerState | null,
): SessionPlan {
  const sessionId = `${programmeRunId}:wm-${sessionNumber}-${phase}-${Date.now()}`;
  const miniBlocks = miniBlockPlansForPhase(phase, sessionId, nLevels, transferState);
  const trials = miniBlocks.flatMap((block) => buildNBackTrials({
    sessionId,
    miniBlockId: block.id,
    construct: block.construct,
    phase,
    cellKey: block.cells[0],
    isReferenceRecheck: phase === "P11_DELAYED" || phase === "P6_DELAYED",
    wrapperId: block.wrapperId,
    nLevel: block.nLevel,
    trialCount: block.trialCount,
    speed: block.speed,
    probeStatus: block.probeStatus,
    mixRatio: block.mixRatio,
    transferEventId: block.transferEventId,
  }));
  return { sessionId, programmeRunId, programmeCycle, sessionNumber, phase, phaseStatus, nominalBand, transferPhase: transferState?.phase, miniBlocks, trials };
}

export function createFreePlaySessionPlan(construct: Construct, cellKey: CellKey, speed: CapacitySpeed = DEFAULT_SPEED, phaseOverride?: PhaseLabel): SessionPlan {
  const phase: PhaseLabel = phaseOverride || (cellKey === "mixed" ? "P7_FULL_MIXED" : cellKey === "flow_abs" ? "P2_FLOW_ABS" : cellKey === "arrow_rel" ? "P3_ARROW_REL" : cellKey === "flow_rel" ? "P4_FLOW_REL" : "P1_ARROW_ABS");
  const sessionId = `wm-free-${construct}-${phase}-${cellKey}-${Date.now()}`;
  const nLevel = INITIAL_STAIRCASE_LEVEL;
  const phaseCells = cellKey === "mixed" ? cellsForPhase(phase) : [cellKey];
  const miniBlocks = phaseCells.map((phaseCell, index): MiniBlockPlan => {
    const wrapperId = wrapperIdFor(construct, phase, phaseCell, index + 1);
    return {
      id: `free-${index + 1}`,
      index: index + 1,
      construct,
      label: construct === "BSE" ? `Binding Memory Practice ${index + 1}` : `Relational Memory Practice ${index + 1}`,
      instruction: "Practice only. This does not change your guided progress.",
      cells: Array(DISPLAYED_BASE_TRIALS + nLevel).fill(phaseCell),
      trialCount: DISPLAYED_BASE_TRIALS + nLevel,
      currentTrials: DISPLAYED_BASE_TRIALS + nLevel,
      referenceTrials: 0,
      wrapperId,
      probeStatus: "base",
      mixRatio: null,
      transferEventId: null,
      nLevel,
      layer: construct === "BSE" ? "binding_memory" : "relational_memory",
      speed,
    };
  });
  return {
    sessionId,
    programmeRunId: "free-play",
    programmeCycle: 0,
    sessionNumber: 0,
    phase,
    phaseStatus: "active",
    nominalBand: "free practice",
    miniBlocks,
    trials: miniBlocks.flatMap((block) => buildNBackTrials({
      sessionId,
      miniBlockId: block.id,
      construct,
      phase,
      cellKey: block.cells[0],
      isReferenceRecheck: false,
      wrapperId: block.wrapperId,
      nLevel,
      trialCount: block.trialCount,
      speed,
      probeStatus: block.probeStatus,
      mixRatio: block.mixRatio,
      transferEventId: block.transferEventId,
    })),
  };
}

export function phaseIntro(phase: PhaseLabel): { title: string; body: string } {
  return {
    title: PHASE_NAMES[phase],
    body: PHASE_INSTRUCTIONS[phase],
  };
}
