import { hashSeed, mulberry32, shuffle } from "./random";
import type { DirectionRelation, TokenColor, TrialDefinition } from "./types";

export interface OpticFlowDot {
  apertureIndex: number;
  apertureX: number;
  apertureY: number;
  apertureRadius: number;
  x: number;
  y: number;
  r: number;
  opacity: number;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  relation: DirectionRelation;
  color: string;
  delayMs: number;
  durationMs: number;
}

export interface OpticFlowAperture {
  index: number;
  x: number;
  y: number;
  radius: number;
  relation: DirectionRelation;
  color: string;
  dots: OpticFlowDot[];
}

export interface OpticMaskDot {
  apertureIndex: number;
  apertureX: number;
  apertureY: number;
  apertureRadius: number;
  x: number;
  y: number;
  r: number;
  opacity: number;
}

export interface OpticMaskAperture {
  index: number;
  x: number;
  y: number;
  radius: number;
  dots: OpticMaskDot[];
}

const CENTER = 50;
const APERTURE_RADIUS = 9.4;
const DOTS_PER_APERTURE = 16;
const MASK_DOTS_PER_APERTURE = 24;
const TOKEN_COLOR_HEX: Record<TokenColor, string> = {
  blue: "#1d56d8",
  yellow: "#d9a900",
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function normalise(dx: number, dy: number): { x: number; y: number } {
  const length = Math.hypot(dx, dy) || 1;
  return { x: dx / length, y: dy / length };
}

function relationUnitVector(relation: DirectionRelation, x: number, y: number): { x: number; y: number } {
  if (relation === "left") return { x: -1, y: 0 };
  if (relation === "right") return { x: 1, y: 0 };
  if (relation === "up") return { x: 0, y: -1 };
  if (relation === "down") return { x: 0, y: 1 };

  const radial = normalise(x - CENTER, y - CENTER);
  if (relation === "out") return radial;
  if (relation === "in") return { x: -radial.x, y: -radial.y };
  // SVG/screen coordinates increase downwards on the y axis. Rotating a
  // radial vector 90 degrees clockwise therefore uses (-y, x), while the
  // anti-clockwise tangent uses (y, -x).
  if (relation === "cw") return { x: -radial.y, y: radial.x };
  return { x: radial.y, y: -radial.x };
}

function positionInAperture(random: () => number, centerX: number, centerY: number): { x: number; y: number } {
  const angle = random() * Math.PI * 2;
  const radius = Math.sqrt(random()) * (APERTURE_RADIUS * 0.78);
  return {
    x: centerX + Math.cos(angle) * radius,
    y: centerY + Math.sin(angle) * radius,
  };
}

export function opticFlowAperturesForTrial(trial: TrialDefinition): OpticFlowAperture[] {
  const random = mulberry32(hashSeed(`${trial.seed}:optic-flow:dots`));

  return trial.items.map((item, apertureIndex) => {
    const centerX = item.position.x;
    const centerY = item.position.y;
    const color = item.color ? TOKEN_COLOR_HEX[item.color] : "#1d56d8";
    const dots = Array.from({ length: DOTS_PER_APERTURE }, (_, dotIndex) => {
      const position = positionInAperture(random, centerX, centerY);
      const vector = relationUnitVector(item.relation, position.x, position.y);
      const travel = trial.cellKey === "flow_abs" ? 5.8 + random() * 1.6 : 5.2 + random() * 1.8;
      const halfTravel = travel / 2;
      const fromX = clamp(position.x - vector.x * halfTravel, 1, 99);
      const fromY = clamp(position.y - vector.y * halfTravel, 1, 99);
      const toX = clamp(position.x + vector.x * halfTravel, 1, 99);
      const toY = clamp(position.y + vector.y * halfTravel, 1, 99);

      return {
        apertureIndex,
        apertureX: centerX,
        apertureY: centerY,
        apertureRadius: APERTURE_RADIUS,
        x: position.x,
        y: position.y,
        r: 0.62 + random() * 0.38,
        opacity: 0.46 + random() * 0.34,
        fromX,
        fromY,
        toX,
        toY,
        relation: item.relation,
        color,
        delayMs: -Math.round((dotIndex % 8) * 92 + random() * 70),
        durationMs: trial.cellKey === "flow_abs" ? 780 : 900,
      };
    });

    return {
      index: apertureIndex,
      x: centerX,
      y: centerY,
      radius: APERTURE_RADIUS,
      relation: item.relation,
      color,
      dots,
    };
  });
}

export function opticFlowDotsForTrial(trial: TrialDefinition): OpticFlowDot[] {
  return opticFlowAperturesForTrial(trial).flatMap((aperture) => aperture.dots);
}

export function opticFlowMaskAperturesForTrial(trial: TrialDefinition): OpticMaskAperture[] {
  const random = mulberry32(hashSeed(`${trial.seed}:optic-flow:mask`));

  return trial.items.map((item, apertureIndex) => {
    const centerX = item.position.x;
    const centerY = item.position.y;
    const dots = shuffle(
      random,
      Array.from({ length: MASK_DOTS_PER_APERTURE }, () => {
        const position = positionInAperture(random, centerX, centerY);
        return {
          apertureIndex,
          apertureX: centerX,
          apertureY: centerY,
          apertureRadius: APERTURE_RADIUS,
          x: position.x,
          y: position.y,
          r: 0.8 + random() * 0.9,
          opacity: 0.38 + random() * 0.44,
        };
      }),
    );

    return {
      index: apertureIndex,
      x: centerX,
      y: centerY,
      radius: APERTURE_RADIUS,
      dots,
    };
  });
}

export function opticFlowMaskDotsForTrial(trial: TrialDefinition): OpticMaskDot[] {
  return opticFlowMaskAperturesForTrial(trial).flatMap((aperture) => aperture.dots);
}
