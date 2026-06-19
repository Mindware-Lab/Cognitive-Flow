import { describe, expect, it } from "vitest";
import {
  computeTransferProfile,
  readinessBand,
} from "../src/transferReadiness";

describe("transfer readiness profile", () => {
  it("uses the specified readiness bands", () => {
    expect(readinessBand(80)).toBe("strong");
    expect(readinessBand(60)).toBe("moderate");
    expect(readinessBand(40)).toBe("weak");
    expect(readinessBand(39)).toBe("critical");
  });

  it("uses the demo weights and averaged lure resistance", () => {
    const profile = computeTransferProfile({
      bandwidthReadiness: 80,
      frameMemoryReadiness: 70,
      pathPredictionReadiness: 60,
      reasoningTransferReadiness: 90,
      srLureResistance: 70,
      reasoningLureResistance: 90,
    });
    expect(profile.lureResistance).toBe(80);
    expect(profile.transferReadiness).toBe(76);
  });

  it("flags a layer below 60 when the preceding layer is at least 70", () => {
    const profile = computeTransferProfile({
      bandwidthReadiness: 82,
      frameMemoryReadiness: 74,
      pathPredictionReadiness: 55,
      reasoningTransferReadiness: 80,
      srLureResistance: 70,
      reasoningLureResistance: 80,
    });
    expect(profile.likelyBottleneck).toBe("Path Prediction");
  });
});
