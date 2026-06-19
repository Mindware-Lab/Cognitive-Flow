import { describe, expect, it } from "vitest";
import {
  REASONING_ITEMS,
  scoreReasoning,
  type ReasoningOutcome,
} from "../src/reasoningTransfer";

describe("reasoning transfer", () => {
  it("contains eight balanced symbolic and nonsense-semantic items", () => {
    expect(REASONING_ITEMS).toHaveLength(8);
    expect(
      REASONING_ITEMS.filter((item) => item.wrapper === "symbolic"),
    ).toHaveLength(4);
    expect(
      REASONING_ITEMS.filter((item) => item.wrapper === "nonsense_semantic"),
    ).toHaveLength(4);
    expect(REASONING_ITEMS.filter((item) => item.lureType)).toHaveLength(4);
  });

  it("scores accuracy, lures, wrappers, and the SR bridge", () => {
    const outcomes: ReasoningOutcome[] = REASONING_ITEMS.map((item) => ({
      item,
      answer: item.correctAnswer,
      correct: true,
      rtMs: 4000,
    }));
    const metrics = scoreReasoning(outcomes, 80);
    expect(metrics.accuracy).toBe(1);
    expect(metrics.identityAccuracy).toBe(1);
    expect(metrics.lureResistance).toBe(1);
    expect(metrics.nonsenseWrapperAccuracy).toBe(1);
    expect(metrics.reasoningTransferReadiness).toBeGreaterThanOrEqual(90);
    expect(metrics.srToReasoningRecovery).toBeGreaterThanOrEqual(80);
  });
});
