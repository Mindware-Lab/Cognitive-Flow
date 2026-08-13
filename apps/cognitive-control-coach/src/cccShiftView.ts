export type SpherePoint = { x: number; y: number; z: number };

type AnimatedSphereDot = {
  point: SpherePoint;
  lifeCycle: number;
  lifeOffsetMs: number;
  colour: string;
};

const BLUE = "rgba(39, 100, 183, 0.82)";
const GREEN = "rgba(102, 204, 51, 0.84)";
const LIME = "rgba(204, 255, 102, 0.96)";

export const CCC_SHIFT_VIEW_RENDER_SETTINGS = {
  dotCount: 120,
  dotRadiusPx: 2.2,
  rotationPeriodMs: 7000,
  dotLifeMs: 640,
  dotColours: [BLUE, GREEN, LIME] as const,
  backgroundColour: "#f7f9fb",
  outlineColour: "rgba(39, 100, 183, 0.20)",
} as const;

export function createSpherePoints(count = CCC_SHIFT_VIEW_RENDER_SETTINGS.dotCount): SpherePoint[] {
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

function hashedUnit(value: number): number {
  let hash = value | 0;
  hash = Math.imul(hash ^ (hash >>> 16), 0x45d9f3b);
  hash = Math.imul(hash ^ (hash >>> 16), 0x45d9f3b);
  hash ^= hash >>> 16;
  return (hash >>> 0) / 4294967296;
}

function replacementPoint(index: number, lifeCycle: number): SpherePoint {
  const seed = Math.imul(index + 1, 73856093) ^ Math.imul(lifeCycle + 1, 19349663);
  const y = 1 - 2 * hashedUnit(seed);
  const angle = Math.PI * 2 * hashedUnit(seed ^ 0x9e3779b9);
  const radius = Math.sqrt(Math.max(0, 1 - y * y));
  return { x: Math.cos(angle) * radius, y, z: Math.sin(angle) * radius };
}

function colourForDot(index: number): string {
  // Keep colour independent of depth. Five blue, two green and one lime dot in
  // every eight preserve the agreed palette without turning colour into a
  // front/back cue.
  const slot = index % 8;
  if (slot < 5) return BLUE;
  if (slot < 7) return GREEN;
  return LIME;
}

function createAnimatedDots(): AnimatedSphereDot[] {
  return createSpherePoints().map((point, index) => ({
    point,
    lifeCycle: 0,
    lifeOffsetMs: index / CCC_SHIFT_VIEW_RENDER_SETTINGS.dotCount * CCC_SHIFT_VIEW_RENDER_SETTINGS.dotLifeMs,
    colour: colourForDot(index),
  }));
}

export function startAmbiguousSphere(canvas: HTMLCanvasElement, options: { staticMode?: boolean } = {}): () => void {
  const context = canvas.getContext("2d");
  if (!context) return () => undefined;
  const dots = createAnimatedDots();
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
    context.fillStyle = CCC_SHIFT_VIEW_RENDER_SETTINGS.backgroundColour;
    context.fillRect(0, 0, size, size);

    const centre = size / 2;
    const radius = size * 0.37;
    const elapsedMs = now - startedAt;
    const angle = options.staticMode
      ? Math.PI / 8
      : elapsedMs / CCC_SHIFT_VIEW_RENDER_SETTINGS.rotationPeriodMs * Math.PI * 2;

    context.strokeStyle = CCC_SHIFT_VIEW_RENDER_SETTINGS.outlineColour;
    context.lineWidth = 1.25;
    context.beginPath();
    context.arc(centre, centre, radius, 0, Math.PI * 2);
    context.stroke();

    for (let index = 0; index < dots.length; index += 1) {
      const dot = dots[index];
      if (!options.staticMode) {
        const lifeCycle = Math.floor((elapsedMs + dot.lifeOffsetMs) / CCC_SHIFT_VIEW_RENDER_SETTINGS.dotLifeMs);
        if (lifeCycle !== dot.lifeCycle) {
          dot.lifeCycle = lifeCycle;
          dot.point = replacementPoint(index, lifeCycle);
        }
      }
      const rotated = rotateSpherePoint(dot.point, angle);
      const x = centre + rotated.x * radius;
      const y = centre + rotated.y * radius;
      context.fillStyle = dot.colour;
      context.beginPath();
      context.arc(x, y, CCC_SHIFT_VIEW_RENDER_SETTINGS.dotRadiusPx, 0, Math.PI * 2);
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
