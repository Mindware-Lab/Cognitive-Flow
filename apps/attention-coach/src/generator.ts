import { OCTAGON_POSITIONS, vectorForRelation } from "./geometry";
import {
  ACC_TRIALS_PER_SESSION,
  MINI_BLOCK_TRIALS,
  PHASE_CELL,
  PHASE_INSTRUCTIONS,
  PHASE_NAMES,
  SESSION_TRIAL_COUNT,
} from "./protocol";
import { hashSeed, mulberry32, shuffle, takeBalanced } from "./random";
import type {
  BseToken,
  CellKey,
  Construct,
  DirectionRelation,
  MiniBlockPlan,
  PhaseLabel,
  PhaseStatus,
  Ratio,
  SessionPlan,
  StimulusItem,
  TokenColor,
  TrialCondition,
  TrialDefinition,
  TransitionKey,
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
    ratio: condition.ratio,
    exposureMsRequested: condition.exposureMs,
    majorityCount,
    responseOptions: built.responseOptions,
    correctResponse: built.correctResponse,
    items: built.items,
    seed,
  };
}

function blockPlan(id: string, index: number, construct: Construct, label: string, instruction: string, cells: CellKey[]): MiniBlockPlan {
  const currentCell = cells[0];
  const currentTrials = cells.filter((cell) => cell === currentCell).length;
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
  };
}

export function miniBlockPlansForPhase(phase: PhaseLabel, sessionSeed: string): MiniBlockPlan[] {
  const current = PHASE_CELL[phase];
  const random = mulberry32(hashSeed(`${sessionSeed}:${phase}:blocks`));
  if (phase === "P1_ARROW_ABS") {
    return [
      blockPlan("acc-1", 1, "ACC", "Attention Control 1", PHASE_INSTRUCTIONS[phase], Array(20).fill(current)),
      blockPlan("acc-2", 2, "ACC", "Attention Control 2", "Keep finding the majority direction.", Array(20).fill(current)),
      blockPlan("acc-3", 3, "ACC", "Attention Control 3", "One more attention block before Binding Focus.", Array(20).fill(current)),
      blockPlan("bse-1", 4, "BSE", "Binding Focus", "Report the direction-colour pair that appears most often.", Array(20).fill(current)),
    ];
  }
  if (phase === "P2_FLOW_ABS" || phase === "P3_ARROW_REL") {
    const reference: CellKey = "arrow_abs";
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
  if (phase === "P4_FLOW_REL") {
    return [
      blockPlan("acc-1", 1, "ACC", "Attention Control 1", PHASE_INSTRUCTIONS[phase], Array(20).fill(current)),
      blockPlan("acc-2", 2, "ACC", "Attention Control 2", "Recover the relation in motion.", Array(20).fill(current)),
      blockPlan("acc-3", 3, "ACC", "Progress Check", "A short mix checks how earlier skills are carrying forward.", [
        ...Array<CellKey>(10).fill("flow_abs"),
        ...Array<CellKey>(10).fill("arrow_rel"),
      ]),
      blockPlan("bse-1", 4, "BSE", "Binding Focus", "Keep direction and colour together under motion.", [
        ...Array<CellKey>(12).fill(current),
        ...Array<CellKey>(4).fill("flow_abs"),
        ...Array<CellKey>(4).fill("arrow_rel"),
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
): SessionPlan {
  const miniBlocks = miniBlockPlansForPhase(phase, sessionSeed).map((block) => ({
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
    sessionNumber,
    phase,
    phaseStatus,
    nominalBand,
    miniBlocks,
    trials,
  };
}

export function createFreePlaySessionPlan(
  construct: Construct,
  cellKey: CellKey,
  sessionSeed = `free-${construct}-${cellKey}-${Date.now()}`,
): SessionPlan {
  const random = mulberry32(hashSeed(`${sessionSeed}:free-play`));
  const cells =
    cellKey === "mixed"
      ? shuffle(random, ALL_CELLS.flatMap((cell) => Array<CellKey>(5).fill(cell)))
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
