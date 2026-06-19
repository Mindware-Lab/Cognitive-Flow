import { describe, expect, it } from "vitest";
import {
  generateSrBlock,
  scoreSrBlock,
  type SrOutcome,
} from "../src/srPathPrediction";

describe("optic-flow path prediction", () => {
  it("builds the fixed demo stream with one wrong fourth-cycle start", () => {
    const events = generateSrBlock("demo-seed");
    expect(events).toHaveLength(21);
    expect(events.map((event) => event.currentStateId)).toEqual([
      "expansion",
      "rotation",
      "diagonal_contraction",
      "expansion",
      "rotation",
      "diagonal_contraction",
      "expansion",
      "rotation",
      "diagonal_contraction",
      "contraction",
      "rotation",
      "diagonal_contraction",
      "expansion",
      "rotation",
      "diagonal_contraction",
      "expansion",
      "rotation",
      "diagonal_contraction",
      "expansion",
      "rotation",
      "diagonal_contraction",
    ]);
    expect(events.filter((event) => event.eventType === "break")).toHaveLength(1);
    expect(events[9].correctResponse).toBe("break");
  });

  it("scores a correct wrong-sequence press as full break detection", () => {
    const outcomes: SrOutcome[] = generateSrBlock("accurate").map((event) => ({
      event,
      response: event.correctResponse,
      correct: event.eventType === "stream" ? null : true,
      rtMs: event.eventType === "break" ? 700 : null,
    }));
    const metrics = scoreSrBlock(outcomes);
    expect(metrics.breakDetectionRate).toBe(1);
    expect(metrics.falseAlarmRate).toBe(0);
    expect(metrics.pathPredictionReadiness).toBe(100);
  });
});
