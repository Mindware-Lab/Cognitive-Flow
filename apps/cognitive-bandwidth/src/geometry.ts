import type { Point } from "./types";

export const OCTAGON_POSITIONS: Point[] = Array.from({ length: 8 }, (_, index) => {
  const angle = -Math.PI / 2 + index * (Math.PI / 4);
  return {
    x: 50 + Math.cos(angle) * 34,
    y: 50 + Math.sin(angle) * 34,
  };
});

export function normalize(point: Point): Point {
  const length = Math.hypot(point.x, point.y);
  if (!length) return { x: 0, y: 0 };
  return { x: point.x / length, y: point.y / length };
}

export function radialVector(position: Point): Point {
  return normalize({ x: position.x - 50, y: position.y - 50 });
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
