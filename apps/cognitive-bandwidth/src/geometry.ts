import type { Point } from "./types";

export const STIMULUS_CENTRE: Point = { x: 50, y: 50 };
export const STIMULUS_RADIUS = 34;

// Wu et al. (2016): arrow length = mask diameter = 0.37 degrees;
// radius from fixation to item centre = approximately 1.5 degrees.
export const PAPER_ARROW_TO_RADIUS_RATIO = 0.37 / 1.5;
export const ARROW_LENGTH = STIMULUS_RADIUS * PAPER_ARROW_TO_RADIUS_RATIO;
export const MASK_DIAMETER = ARROW_LENGTH;

// Match the arrowhead triangle to approximately one half of the diamond mask.
// The mask and full arrow share a diameter, so this uses half that length and
// the full mask width for a consistent silhouette at every rendered size.
export const ARROW_HEAD_LENGTH_RATIO = 0.5;
export const ARROW_HEAD_WIDTH_RATIO = 1;
export const ARROW_SHAFT_WIDTH_RATIO = 0.18;

export const OCTAGON_POSITIONS: Point[] = Array.from({ length: 8 }, (_, index) => {
  const angle = -Math.PI / 2 + index * (Math.PI / 4);
  return {
    x: STIMULUS_CENTRE.x + Math.cos(angle) * STIMULUS_RADIUS,
    y: STIMULUS_CENTRE.y + Math.sin(angle) * STIMULUS_RADIUS,
  };
});

export function arrowPolygonPoints(): string {
  const halfLength = ARROW_LENGTH / 2;
  const headStart = halfLength - ARROW_LENGTH * ARROW_HEAD_LENGTH_RATIO;
  const halfHeadWidth = (ARROW_LENGTH * ARROW_HEAD_WIDTH_RATIO) / 2;
  const halfShaftWidth = (ARROW_LENGTH * ARROW_SHAFT_WIDTH_RATIO) / 2;
  return [
    [-halfLength, -halfShaftWidth],
    [headStart, -halfShaftWidth],
    [headStart, -halfHeadWidth],
    [halfLength, 0],
    [headStart, halfHeadWidth],
    [headStart, halfShaftWidth],
    [-halfLength, halfShaftWidth],
  ]
    .map(([x, y]) => `${x.toFixed(3)},${y.toFixed(3)}`)
    .join(" ");
}

export function diamondPolygonPoints(position: Point): string {
  const radius = MASK_DIAMETER / 2;
  return [
    [position.x, position.y - radius],
    [position.x + radius, position.y],
    [position.x, position.y + radius],
    [position.x - radius, position.y],
  ]
    .map(([x, y]) => `${x.toFixed(3)},${y.toFixed(3)}`)
    .join(" ");
}

export function normalize(point: Point): Point {
  const length = Math.hypot(point.x, point.y);
  if (!length) return { x: 0, y: 0 };
  return { x: point.x / length, y: point.y / length };
}

export function radialVector(position: Point): Point {
  return normalize({
    x: position.x - STIMULUS_CENTRE.x,
    y: position.y - STIMULUS_CENTRE.y,
  });
}

export function vectorAngleDegrees(vector: Point): number {
  return (Math.atan2(vector.y, vector.x) * 180) / Math.PI;
}

export function clockwiseTangent(radial: Point): Point {
  return { x: -radial.y || 0, y: radial.x || 0 };
}

export function anticlockwiseTangent(radial: Point): Point {
  return { x: radial.y || 0, y: -radial.x || 0 };
}
