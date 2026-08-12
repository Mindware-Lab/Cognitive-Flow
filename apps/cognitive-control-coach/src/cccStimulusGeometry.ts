/**
 * Arrow and mask geometry retained from the original Attention Coach.
 * Keeping both shapes in the same 100 × 100 coordinate system ensures that
 * every post-stimulus diamond is centred over, and fully covers, its arrow.
 */
export function arrowPolygonPoints(): string {
  return "-5,-4 5,0 -5,4 -2,0";
}

export function diamondPolygonPoints(position: { x: number; y: number }): string {
  const size = 7.2;
  return `${position.x},${position.y - size} ${position.x + size},${position.y} ${position.x},${position.y + size} ${position.x - size},${position.y}`;
}
