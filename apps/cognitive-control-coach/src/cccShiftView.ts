export type SpherePoint = { x: number; y: number; z: number };

export function createSpherePoints(count = 180): SpherePoint[] {
  const points: SpherePoint[] = [];
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  for (let index = 0; index < count; index += 1) {
    const y = 1 - (index / Math.max(1, count - 1)) * 2;
    const radius = Math.sqrt(Math.max(0, 1 - y * y));
    const angle = goldenAngle * index;
    points.push({ x: Math.cos(angle) * radius, y, z: Math.sin(angle) * radius });
  }
  return points;
}

export function rotateSpherePoint(point: SpherePoint, angle: number): SpherePoint {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return {
    x: point.x * cos + point.z * sin,
    y: point.y,
    z: -point.x * sin + point.z * cos,
  };
}

export function startAmbiguousSphere(canvas: HTMLCanvasElement, options: { staticMode?: boolean } = {}): () => void {
  const context = canvas.getContext("2d");
  if (!context) return () => undefined;
  const points = createSpherePoints();
  const startedAt = performance.now();
  let frame = 0;
  let stopped = false;

  const draw = (now: number) => {
    if (stopped) return;
    const box = canvas.getBoundingClientRect();
    const size = Math.max(180, Math.min(box.width || 420, box.height || 420));
    const density = Math.min(window.devicePixelRatio || 1, 2);
    const pixelSize = Math.round(size * density);
    if (canvas.width !== pixelSize || canvas.height !== pixelSize) {
      canvas.width = pixelSize;
      canvas.height = pixelSize;
    }
    context.setTransform(density, 0, 0, density, 0, 0);
    context.clearRect(0, 0, size, size);
    const centre = size / 2;
    const radius = size * 0.37;
    const angle = options.staticMode ? Math.PI / 8 : (now - startedAt) * 0.00048;

    const wash = context.createRadialGradient(centre, centre, radius * 0.15, centre, centre, radius * 1.18);
    wash.addColorStop(0, "rgba(20, 88, 255, 0.045)");
    wash.addColorStop(1, "rgba(20, 88, 255, 0)");
    context.fillStyle = wash;
    context.beginPath();
    context.arc(centre, centre, radius * 1.18, 0, Math.PI * 2);
    context.fill();

    context.strokeStyle = "rgba(20, 88, 255, 0.2)";
    context.lineWidth = 1.25;
    context.beginPath();
    context.arc(centre, centre, radius, 0, Math.PI * 2);
    context.stroke();

    context.fillStyle = "rgba(10, 42, 114, 0.72)";
    for (const point of points) {
      const rotated = rotateSpherePoint(point, angle);
      const x = centre + rotated.x * radius;
      const y = centre + rotated.y * radius;
      context.beginPath();
      context.arc(x, y, Math.max(1.25, size * 0.0052), 0, Math.PI * 2);
      context.fill();
    }

    if (!options.staticMode) frame = window.requestAnimationFrame(draw);
  };

  frame = window.requestAnimationFrame(draw);
  return () => {
    stopped = true;
    window.cancelAnimationFrame(frame);
  };
}
