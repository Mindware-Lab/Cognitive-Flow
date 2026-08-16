import { hashSeed, mulberry32, shuffle } from "./random";
import type { CccAttentionTrialDefinition, CccStimulusRelation } from "./cccTypes";

export interface CccOpticFlowDot {
  apertureIndex: number;
  apertureX: number;
  apertureY: number;
  apertureRadius: number;
  x: number;
  y: number;
  fieldDistance: number;
  speedScale: number;
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

interface CccOpticFlowSector {
  index: number;
  x: number;
  y: number;
  radius: number;
  innerRadius: number;
  outerRadius: number;
  centreAngle: number;
  halfAngle: number;
  path: string;
}

export interface CccOpticFlowAperture extends CccOpticFlowSector {
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

export interface CccOpticMaskAperture extends CccOpticFlowSector {
  dots: CccOpticMaskDot[];
}

const FIELD_CENTRE = 50;
const FULL_FIELD_RADIUS = Math.hypot(FIELD_CENTRE, FIELD_CENTRE);
const SECTOR_INNER_RADIUS = 29;
const SECTOR_OUTER_RADIUS = 47;
const SECTOR_HALF_ANGLE = 11.5 * Math.PI / 180;
const DOT_RADIAL_INSET = 2.6;
const DOT_ANGULAR_INSET = 2.25 * Math.PI / 180;
const BASE_TRAVEL = 6.1;
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
 * The annular sectors only clip the flecks; they are not local expansion or
 * contraction centres. Every trajectory is derived from the one field centre.
 */
function relationUnitVector(relation: CccStimulusRelation, x: number, y: number): { x: number; y: number } {
  if (relation === "left") return { x: -1, y: 0 };
  if (relation === "right") return { x: 1, y: 0 };

  const radial = normalise(x - FIELD_CENTRE, y - FIELD_CENTRE);
  if (relation === "out") return radial;
  if (relation === "in") return { x: -radial.x, y: -radial.y };
  // SVG/screen coordinates increase downwards on the y axis. Rotating a
  // radial vector 90 degrees clockwise therefore uses (-y, x), while the
  // anti-clockwise tangent uses (y, -x).
  if (relation === "cw") return { x: -radial.y, y: radial.x };
  return { x: radial.y, y: -radial.x };
}

function distanceFromFieldCentre(x: number, y: number): number {
  return Math.hypot(x - FIELD_CENTRE, y - FIELD_CENTRE);
}

function polarPoint(radius: number, angle: number): { x: number; y: number } {
  return {
    x: FIELD_CENTRE + Math.cos(angle) * radius,
    y: FIELD_CENTRE + Math.sin(angle) * radius,
  };
}

function sectorPath(centreAngle: number): string {
  const startAngle = centreAngle - SECTOR_HALF_ANGLE;
  const endAngle = centreAngle + SECTOR_HALF_ANGLE;
  const innerStart = polarPoint(SECTOR_INNER_RADIUS, startAngle);
  const outerStart = polarPoint(SECTOR_OUTER_RADIUS, startAngle);
  const outerEnd = polarPoint(SECTOR_OUTER_RADIUS, endAngle);
  const innerEnd = polarPoint(SECTOR_INNER_RADIUS, endAngle);
  return [
    `M ${innerStart.x.toFixed(2)} ${innerStart.y.toFixed(2)}`,
    `L ${outerStart.x.toFixed(2)} ${outerStart.y.toFixed(2)}`,
    `A ${SECTOR_OUTER_RADIUS} ${SECTOR_OUTER_RADIUS} 0 0 1 ${outerEnd.x.toFixed(2)} ${outerEnd.y.toFixed(2)}`,
    `L ${innerEnd.x.toFixed(2)} ${innerEnd.y.toFixed(2)}`,
    `A ${SECTOR_INNER_RADIUS} ${SECTOR_INNER_RADIUS} 0 0 0 ${innerStart.x.toFixed(2)} ${innerStart.y.toFixed(2)}`,
    "Z",
  ].join(" ");
}

function positionInSector(random: () => number, centreAngle: number): { x: number; y: number } {
  const innerRadius = SECTOR_INNER_RADIUS + DOT_RADIAL_INSET;
  const outerRadius = SECTOR_OUTER_RADIUS - DOT_RADIAL_INSET;
  const radius = Math.sqrt(innerRadius ** 2 + random() * (outerRadius ** 2 - innerRadius ** 2));
  const usableHalfAngle = SECTOR_HALF_ANGLE - DOT_ANGULAR_INSET;
  const angle = centreAngle + (random() * 2 - 1) * usableHalfAngle;
  return polarPoint(radius, angle);
}

/**
 * A deliberately shallow, linear full-field gradient. The field centre maps
 * to 0.8× speed and the furthest screen corner to 1.2×, so the change within
 * any one small sector remains subtle while farther flecks always move faster.
 */
export function cccOpticFlowSpeedScale(x: number, y: number): number {
  return 0.8 + 0.4 * clamp(distanceFromFieldCentre(x, y) / FULL_FIELD_RADIUS, 0, 1);
}

function sectorForPosition(index: number, x: number, y: number): CccOpticFlowSector {
  const centreAngle = Math.atan2(y - FIELD_CENTRE, x - FIELD_CENTRE);
  return {
    index,
    x,
    y,
    radius: (SECTOR_OUTER_RADIUS - SECTOR_INNER_RADIUS) / 2,
    innerRadius: SECTOR_INNER_RADIUS,
    outerRadius: SECTOR_OUTER_RADIUS,
    centreAngle,
    halfAngle: SECTOR_HALF_ANGLE,
    path: sectorPath(centreAngle),
  };
}

export function cccOpticFlowAperturesForTrial(
  trial: CccAttentionTrialDefinition,
): CccOpticFlowAperture[] {
  const random = mulberry32(hashSeed(`${trial.seed}:ccc-optic-flow:dots`));

  return trial.stimulusItems.map((item, apertureIndex) => {
    const sector = sectorForPosition(apertureIndex, item.position.x, item.position.y);
    const dots = Array.from({ length: DOTS_PER_APERTURE }, (_, dotIndex) => {
      const position = positionInSector(random, sector.centreAngle);
      const vector = relationUnitVector(item.relation, position.x, position.y);
      const fieldDistance = distanceFromFieldCentre(position.x, position.y);
      const speedScale = cccOpticFlowSpeedScale(position.x, position.y);
      const travel = BASE_TRAVEL * speedScale;
      const halfTravel = travel / 2;
      const fromX = clamp(position.x - vector.x * halfTravel, 1, 99);
      const fromY = clamp(position.y - vector.y * halfTravel, 1, 99);
      const toX = clamp(position.x + vector.x * halfTravel, 1, 99);
      const toY = clamp(position.y + vector.y * halfTravel, 1, 99);

      return {
        apertureIndex,
        apertureX: sector.x,
        apertureY: sector.y,
        apertureRadius: sector.radius,
        x: position.x,
        y: position.y,
        fieldDistance,
        speedScale,
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
      ...sector,
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
    const sector = sectorForPosition(apertureIndex, item.position.x, item.position.y);
    const dots = shuffle(
      random,
      Array.from({ length: MASK_DOTS_PER_APERTURE }, () => {
        const position = positionInSector(random, sector.centreAngle);
        return {
          apertureIndex,
          apertureX: sector.x,
          apertureY: sector.y,
          apertureRadius: sector.radius,
          x: position.x,
          y: position.y,
          r: 0.8 + random() * 0.9,
          opacity: 0.38 + random() * 0.44,
        };
      }),
    );

    return {
      ...sector,
      dots,
    };
  });
}

export function cccOpticFlowMaskDotsForTrial(
  trial: CccAttentionTrialDefinition,
): CccOpticMaskDot[] {
  return cccOpticFlowMaskAperturesForTrial(trial).flatMap((aperture) => aperture.dots);
}
