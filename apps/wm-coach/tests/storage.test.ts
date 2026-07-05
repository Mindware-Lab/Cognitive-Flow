import { describe, expect, it } from "vitest";
import { DEFAULT_PROGRESS, progressForBrowserDevice } from "../src/storage";
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
