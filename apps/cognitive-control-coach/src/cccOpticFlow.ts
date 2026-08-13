import { hashSeed, mulberry32, shuffle } from "./random";
import type { CccAttentionTrialDefinition, CccStimulusRelation } from "./cccTypes";

export interface CccOpticFlowDot {
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
  relation: CccStimulusRelation;
  delayMs: number;
  durationMs: number;
}

export interface CccOpticFlowAperture {
  index: number;
  x: number;
  y: number;
  radius: number;
  relation: CccStimulusRelation;
  dots: CccOpticFlowDot[];
}

export interface CccOpticMaskDot {
  apertureIndex: number;
  apertureX: number;
  apertureY: number;
  apertureRadius: number;
  x: number;
  y: number;
  r: number;
  opacity: number;
}

export interface CccOpticMaskAperture {
  index: number;
  x: number;
  y: number;
  radius: number;
  dots: CccOpticMaskDot[];
}

const FIELD_CENTRE = 50;
const APERTURE_RADIUS = 9.4;
const DOTS_PER_APERTURE = 16;
const MASK_DOTS_PER_APERTURE = 24;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function normalise(dx: number, dy: number): { x: number; y: number } {
  const length = Math.hypot(dx, dy) || 1;
  return { x: dx / length, y: dy / length };
}

/**
 * Relative motion is defined by the single centre of the whole stimulus field.
 * The circular apertures only clip the flecks; they are not local expansion or
 * contraction centres. This reproduces the original Attention Coach geometry.
 */
function relationUnitVector(relation: CccStimulusRelation, x: number, y: number): { x: number; y: number } {
  if (relation === "left") return { x: -1, y: 0 };
  if (relation === "right") return { x: 1, y: 0 };

  const radial = normalise(x - FIELD_CENTRE, y - FIELD_CENTRE);
  if (relation === "out") return radial;
  if (relation === "in") return { x: -radial.x, y: -radial.y };
  if (relation === "cw") return { x: radial.y, y: -radial.x };
  return { x: -radial.y, y: radial.x };
}

function positionInAperture(
  random: () => number,
  centreX: number,
  centreY: number,
): { x: number; y: number } {
  const angle = random() * Math.PI * 2;
  const radius = Math.sqrt(random()) * (APERTURE_RADIUS * 0.78);
  return {
    x: centreX + Math.cos(angle) * radius,
    y: centreY + Math.sin(angle) * radius,
  };
}

export function cccOpticFlowAperturesForTrial(
  trial: CccAttentionTrialDefinition,
): CccOpticFlowAperture[] {
  const random = mulberry32(hashSeed(`${trial.seed}:ccc-optic-flow:dots`));

  return trial.stimulusItems.map((item, apertureIndex) => {
    const centreX = item.position.x;
    const centreY = item.position.y;
    const dots = Array.from({ length: DOTS_PER_APERTURE }, (_, dotIndex) => {
      const position = positionInAperture(random, centreX, centreY);
      const vector = relationUnitVector(item.relation, position.x, position.y);
      const travel = 5.2 + random() * 1.8;
      const halfTravel = travel / 2;
      const fromX = clamp(position.x - vector.x * halfTravel, 1, 99);
      const fromY = clamp(position.y - vector.y * halfTravel, 1, 99);
      const toX = clamp(position.x + vector.x * halfTravel, 1, 99);
      const toY = clamp(position.y + vector.y * halfTravel, 1, 99);

      return {
        apertureIndex,
        apertureX: centreX,
        apertureY: centreY,
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
        delayMs: -Math.round((dotIndex % 8) * 92 + random() * 70),
        durationMs: 900,
      };
    });

    return {
      index: apertureIndex,
      x: centreX,
      y: centreY,
      radius: APERTURE_RADIUS,
      relation: item.relation,
      dots,
    };
  });
}

export function cccOpticFlowDotsForTrial(
  trial: CccAttentionTrialDefinition,
): CccOpticFlowDot[] {
  return cccOpticFlowAperturesForTrial(trial).flatMap((aperture) => aperture.dots);
}

export function cccOpticFlowMaskAperturesForTrial(
  trial: CccAttentionTrialDefinition,
): CccOpticMaskAperture[] {
  const random = mulberry32(hashSeed(`${trial.seed}:ccc-optic-flow:mask`));

  return trial.stimulusItems.map((item, apertureIndex) => {
    const centreX = item.position.x;
    const centreY = item.position.y;
    const dots = shuffle(
      random,
      Array.from({ length: MASK_DOTS_PER_APERTURE }, () => {
        const position = positionInAperture(random, centreX, centreY);
        return {
          apertureIndex,
          apertureX: centreX,
          apertureY: centreY,
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
      x: centreX,
      y: centreY,
      radius: APERTURE_RADIUS,
      dots,
    };
  });
}

export function cccOpticFlowMaskDotsForTrial(
  trial: CccAttentionTrialDefinition,
): CccOpticMaskDot[] {
  return cccOpticFlowMaskAperturesForTrial(trial).flatMap((aperture) => aperture.dots);
}
