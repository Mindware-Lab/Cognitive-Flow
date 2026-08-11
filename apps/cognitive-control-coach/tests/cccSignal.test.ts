import { describe, expect, it } from "vitest";
import {
  CCC_SIGNAL_INITIAL_LEVEL,
  classifySignalTiming,
  nextSignalStaircaseState,
  signalConditionForLevel,
} from "../src/cccSignal";

describe("CCC protected signal staircase", () => {
  it("uses a frame-safe MFT-M-derived condition grid", () => {
    expect(signalConditionForLevel(CCC_SIGNAL_INITIAL_LEVEL)).toEqual({ ratio: "4:1", exposureMs: 500 });
    expect(signalConditionForLevel(9)).toEqual({ ratio: "3:2", exposureMs: 150 });
  });

  it("moves harder after two correct responses and easier after an error", () => {
    const first = nextSignalStaircaseState({ level: 4, consecutiveCorrect: 0 }, true);
    const second = nextSignalStaircaseState(first, true);
    const error = nextSignalStaircaseState(second, false);
    expect(first).toEqual({ level: 4, consecutiveCorrect: 1 });
    expect(second).toEqual({ level: 5, consecutiveCorrect: 0 });
    expect(error).toEqual({ level: 4, consecutiveCorrect: 0 });
  });

  it("grades actual exposure timing against the requested duration", () => {
    expect(classifySignalTiming(500, 516)).toBe("good");
    expect(classifySignalTiming(500, 620)).toBe("acceptable");
    expect(classifySignalTiming(500, 800)).toBe("poor");
  });
});
