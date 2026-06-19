import { hashSeed, mulberry32, shuffle } from "./random";
import type { Point } from "./types";

export type RelationalNBackLevel = 1 | 2;
export type RelationalNBackRelation =
  | "in"
  | "out"
  | "clockwise"
  | "counterclockwise"
  | "spiral_in"
  | "spiral_out";

export interface RelationalNBackArrow {
  position: Point;
  vector: Point;
}

export interface RelationalNBackTrial {
  index: number;
  relation: RelationalNBackRelation;
  alignmentIndex: number;
  arrows: [RelationalNBackArrow, RelationalNBackArrow];
  isMatch: boolean;
}

export interface RelationalNBackOutcome {
  trial: RelationalNBackTrial;
  responded: boolean;
  isCorrect: boolean;
  classification: "hit" | "miss" | "false_alarm" | "correct_rejection";
  rtMs: number | null;
}

export interface RelationalNBackSummary {
  level: RelationalNBackLevel;
  totalTrials: number;
  scoredTrials: number;
  hits: number;
  misses: number;
  falseAlarms: number;
  correctRejections: number;
  accuracy: number;
  meanRtMs: number | null;
}

export const RELATIONAL_NBACK_BASE_TRIALS = 10;
export const RELATIONAL_NBACK_MATCH_RATE = 0.3;
export const RELATIONAL_NBACK_DISPLAY_MS = 800;
export const RELATIONAL_NBACK_RESPONSE_MS = 1200;

export const RELATIONAL_NBACK_RELATIONS: readonly RelationalNBackRelation[] = [
  "in",
  "out",
  "clockwise",
  "counterclockwise",
  "spiral_in",
  "spiral_out",
];

const ALIGNMENT_ANGLES_DEGREES = [-90, -45, 0, 45] as const;
const CENTRE: Point = { x: 50, y: 50 };
const RADIUS = 31;

function normalize(vector: Point): Point {
  const length = Math.hypot(vector.x, vector.y) || 1;
  return { x: vector.x / length, y: vector.y / length };
}

function add(first: Point, second: Point): Point {
  return normalize({ x: first.x + second.x, y: first.y + second.y });
}

function scale(vector: Point, multiplier: number): Point {
  return { x: vector.x * multiplier, y: vector.y * multiplier };
}

function pointForAngle(angleDegrees: number): Point {
  const angle = (angleDegrees * Math.PI) / 180;
  return {
    x: CENTRE.x + Math.cos(angle) * RADIUS,
    y: CENTRE.y + Math.sin(angle) * RADIUS,
  };
}

function vectorForRelation(
  relation: RelationalNBackRelation,
  position: Point,
): Point {
  const radial = normalize({
    x: position.x - CENTRE.x,
    y: position.y - CENTRE.y,
  });
  const clockwise = { x: -radial.y, y: radial.x };
  if (relation === "out") return radial;
  if (relation === "in") return scale(radial, -1);
  if (relation === "clockwise") return clockwise;
  if (relation === "counterclockwise") return scale(clockwise, -1);
  if (relation === "spiral_out") return add(radial, clockwise);
  return add(scale(radial, -1), clockwise);
}

function arrowsFor(
  relation: RelationalNBackRelation,
  alignmentIndex: number,
): [RelationalNBackArrow, RelationalNBackArrow] {
  const firstAngle = ALIGNMENT_ANGLES_DEGREES[alignmentIndex];
  const positions: [Point, Point] = [
    pointForAngle(firstAngle),
    pointForAngle(firstAngle + 180),
  ];
  return positions.map((position) => ({
    position,
    vector: vectorForRelation(relation, position),
  })) as [RelationalNBackArrow, RelationalNBackArrow];
}

function scheduleMatches(
  totalTrials: number,
  level: RelationalNBackLevel,
  random: () => number,
): Set<number> {
  const candidates = Array.from(
    { length: totalTrials - level },
    (_, index) => index + level,
  );
  const targetCount = Math.round(candidates.length * RELATIONAL_NBACK_MATCH_RATE);
  const selected: number[] = [];
  for (const candidate of shuffle(random, candidates)) {
    if (selected.length >= targetCount) break;
    if (selected.every((existing) => Math.abs(existing - candidate) > 1)) {
      selected.push(candidate);
    }
  }
  for (const candidate of candidates) {
    if (selected.length >= targetCount) break;
    if (!selected.includes(candidate)) selected.push(candidate);
  }
  return new Set(selected);
}

export function generateRelationalNBackBlock(
  seed: string,
  level: RelationalNBackLevel,
): RelationalNBackTrial[] {
  const random = mulberry32(hashSeed(`${seed}:relational-nback:${level}`));
  const totalTrials = RELATIONAL_NBACK_BASE_TRIALS + level;
  const matchIndices = scheduleMatches(totalTrials, level, random);
  const relations: RelationalNBackRelation[] = [];

  for (let index = 0; index < totalTrials; index += 1) {
    if (index >= level && matchIndices.has(index)) {
      relations.push(relations[index - level]);
      continue;
    }
    const excluded = index >= level ? relations[index - level] : null;
    const options = RELATIONAL_NBACK_RELATIONS.filter(
      (relation) => relation !== excluded,
    );
    relations.push(options[Math.floor(random() * options.length)]);
  }

  return relations.map((relation, index) => {
    const alignmentIndex = Math.floor(random() * ALIGNMENT_ANGLES_DEGREES.length);
    return {
      index,
      relation,
      alignmentIndex,
      arrows: arrowsFor(relation, alignmentIndex),
      isMatch: index >= level && relation === relations[index - level],
    };
  });
}

export function classifyRelationalNBackResponse(
  isMatch: boolean,
  responded: boolean,
): RelationalNBackOutcome["classification"] {
  if (isMatch) return responded ? "hit" : "miss";
  return responded ? "false_alarm" : "correct_rejection";
}

export function summarizeRelationalNBack(
  level: RelationalNBackLevel,
  outcomes: readonly RelationalNBackOutcome[],
): RelationalNBackSummary {
  const scored = outcomes.filter((outcome) => outcome.trial.index >= level);
  const count = (classification: RelationalNBackOutcome["classification"]) =>
    scored.filter((outcome) => outcome.classification === classification).length;
  const hits = count("hit");
  const misses = count("miss");
  const falseAlarms = count("false_alarm");
  const correctRejections = count("correct_rejection");
  const responseTimes = scored
    .map((outcome) => outcome.rtMs)
    .filter((value): value is number => value !== null);
  return {
    level,
    totalTrials: outcomes.length,
    scoredTrials: scored.length,
    hits,
    misses,
    falseAlarms,
    correctRejections,
    accuracy: scored.length ? (hits + correctRejections) / scored.length : 0,
    meanRtMs: responseTimes.length
      ? responseTimes.reduce((sum, value) => sum + value, 0) / responseTimes.length
      : null,
  };
}

export function relationalNBackLabel(
  relation: RelationalNBackRelation,
): string {
  return {
    in: "In",
    out: "Out",
    clockwise: "Clockwise",
    counterclockwise: "Counterclockwise",
    spiral_in: "Spiral in",
    spiral_out: "Spiral out",
  }[relation];
}
