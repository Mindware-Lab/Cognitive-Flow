import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_PROGRESS, loadDataMode, newerProgress, progressForBrowserDevice, saveDataMode } from "../src/storage";
import type { DeviceReadiness } from "../src/types";

const readiness: DeviceReadiness = {
  refreshRateHz: 60,
  medianFrameMs: 16.67,
  frameMadMs: 0.4,
  droppedFrameRate: 0,
  inputLatencyMs: null,
  arrowRenderOk: true,
  flowRenderOk: true,
  quality: "good",
  flowEligible: true,
  sampledFrames: 100,
  checkedAt: "2026-07-04T00:00:00.000Z",
  browserDeviceId: "browser-a",
};

beforeEach(() => {
  const values = new Map<string, string>();
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
    clear: () => values.clear(),
  });
});

afterEach(() => vi.unstubAllGlobals());

describe("progress browser-device readiness", () => {
  it("keeps readiness for the same browser device", () => {
    const progress = { ...DEFAULT_PROGRESS, deviceReadiness: readiness };
    expect(progressForBrowserDevice(progress, "browser-a").deviceReadiness).toBe(readiness);
  });

  it("clears readiness from another browser device", () => {
    const progress = { ...DEFAULT_PROGRESS, deviceReadiness: readiness };
    expect(progressForBrowserDevice(progress, "browser-b").deviceReadiness).toBeNull();
  });

  it("clears legacy readiness without a browser device id", () => {
    const progress = { ...DEFAULT_PROGRESS, deviceReadiness: { ...readiness, browserDeviceId: undefined } };
    expect(progressForBrowserDevice(progress, "browser-a").deviceReadiness).toBeNull();
  });
});

describe("progress freshness", () => {
  it("keeps newer local session progress over a stale remote record", () => {
    const local = {
      ...DEFAULT_PROGRESS,
      programmeRunId: "run-a",
      sessionNumber: 14,
      completions: [
        {
          id: "completion-13",
          date: "2026-07-19",
          route: "guided" as const,
          completedAt: "2026-07-19T09:00:00.000Z",
          programmeRunId: "run-a",
          programmeCycle: 1,
          sessionNumber: 13,
          phase: "P1_ARROW_ABS" as const,
        },
      ],
    };
    const remote = {
      ...DEFAULT_PROGRESS,
      programmeRunId: "run-a",
      sessionNumber: 6,
      completions: [
        {
          id: "completion-5",
          date: "2026-07-18",
          route: "guided" as const,
          completedAt: "2026-07-18T09:00:00.000Z",
          programmeRunId: "run-a",
          programmeCycle: 1,
          sessionNumber: 5,
          phase: "P1_ARROW_ABS" as const,
        },
      ],
    };

    expect(newerProgress(local, remote)).toBe(local);
  });

  it("keeps a newer remote programme cycle over an older local cycle", () => {
    const local = { ...DEFAULT_PROGRESS, programmeCycle: 1, sessionNumber: 20 };
    const remote = { ...DEFAULT_PROGRESS, programmeCycle: 2, sessionNumber: 2 };

    expect(newerProgress(local, remote)).toBe(remote);
  });
});

describe("data mode", () => {
  it("defaults to cloud personal scoring", () => {
    localStorage.clear();
    expect(loadDataMode()).toBe("cloud_personal");
  });

  it("keeps an explicit local-storage choice", () => {
    localStorage.clear();
    saveDataMode("local");
    expect(loadDataMode()).toBe("local");
  });
});
