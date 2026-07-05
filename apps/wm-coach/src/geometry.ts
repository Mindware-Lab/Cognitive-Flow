import type { DirectionRelation, Point } from "./types";

export const OCTAGON_POSITIONS: Point[] = [
  { x: 50, y: 12 },
  { x: 77, y: 23 },
  { x: 88, y: 50 },
  { x: 77, y: 77 },
  { x: 50, y: 88 },
  { x: 23, y: 77 },
  { x: 12, y: 50 },
  { x: 23, y: 23 },
];

export function radialVector(position: Point): Point {
  const dx = position.x - 50;
  const dy = position.y - 50;
  const length = Math.hypot(dx, dy) || 1;
  return { x: dx / length, y: dy / length };
}

export function vectorForRelation(relation: DirectionRelation, position: Point): Point {
  if (relation === "left") return { x: -1, y: 0 };
  if (relation === "right") return { x: 1, y: 0 };
  if (relation === "up") return { x: 0, y: -1 };
  if (relation === "down") return { x: 0, y: 1 };
  const radial = radialVector(position);
  if (relation === "out") return radial;
  if (relation === "in") return { x: -radial.x, y: -radial.y };
  if (relation === "cw") return { x: radial.y, y: -radial.x };
  return { x: -radial.y, y: radial.x };
}
