import type { TimingCheck, TimingQuality } from "./types";

function median(values: readonly number[]): number {
  if (!values.length) return 0;
  const sorted = values.slice().sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? sorted[middle]
    : (sorted[middle - 1] + sorted[middle]) / 2;
}

function qualityFor(mad: number, droppedRate: number): TimingQuality {
  if (droppedRate <= 0.01 && mad <= 0.6) return "Good";
  if (droppedRate <= 0.05 && mad <= 1.5) return "Acceptable";
  return "Limited";
}

export async function runTimingCheck(sampleFrames = 120): Promise<TimingCheck> {
  const timestamps: number[] = [];
  await new Promise<void>((resolve) => {
    const collect = (timestamp: number) => {
      timestamps.push(timestamp);
      if (timestamps.length >= sampleFrames + 1) resolve();
      else requestAnimationFrame(collect);
    };
    requestAnimationFrame(collect);
  });
  const intervals = timestamps.slice(1).map((timestamp, index) => timestamp - timestamps[index]);
  const warmIntervals = intervals.slice(Math.min(20, Math.floor(intervals.length / 6)));
  const medianFrameMs = median(warmIntervals);
  const deviations = warmIntervals.map((interval) => Math.abs(interval - medianFrameMs));
  const frameMadMs = median(deviations);
  const dropped = warmIntervals.filter((interval) => interval > medianFrameMs * 1.5).length;
  const droppedFrameRate = warmIntervals.length ? dropped / warmIntervals.length : 1;
  return {
    refreshRateHz: medianFrameMs ? 1000 / medianFrameMs : 0,
    medianFrameMs,
    frameMadMs,
    droppedFrameRate,
    quality: qualityFor(frameMadMs, droppedFrameRate),
    sampledFrames: warmIntervals.length,
  };
}

export async function nextAnimationFrame(): Promise<number> {
  return new Promise((resolve) => requestAnimationFrame(resolve));
}

export async function waitFrames(frameCount: number): Promise<{ start: number; end: number; observed: number }> {
  const start = await nextAnimationFrame();
  let end = start;
  let observed = 0;
  while (observed < frameCount) {
    end = await nextAnimationFrame();
    observed += 1;
  }
  return { start, end, observed };
}
