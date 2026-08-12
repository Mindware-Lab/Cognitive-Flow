import { describe, expect, it } from "vitest";
import {
  CCC_POPULATION_MIN_N,
  displayTrainingScore,
  firstValidBaseline,
  personalIndex,
  populationModeAvailable,
} from "../src/cccProgress";
import type { CccProgrammeSessionSummary } from "../src/cccTypes";

const sessions: CccProgrammeSessionSummary[] = [
  {
    sessionId: "one",
    sessionNumber: 1,
    stage: "P0",
    kind: "p0_foundation",
    regimePair: ["clear_sprint", "deep_check"],
    startedAt: "2026-08-12T10:00:00.000Z",
    completedAt: "2026-08-12T10:10:00.000Z",
    gateDecisions: [],
    metrics: {
      attentionAccuracy: 0.75,
      signalAccuracy: 0.7,
      wmAccuracy: null,
      medianDecisionMs: 1200,
      pointsKeptPercent: 60,
      omissionRate: 0.05,
      timingShiftMs: 200,
      closePatternAccuracy: 0.6,
      attentionControlBps: null,
      observationCount: 24,
    },
  },
];

describe("CCC progress score views", () => {
  it("sets a user's first valid result to 100 and shows proportional change", () => {
    expect(firstValidBaseline(sessions, "accuracy")).toBe(0.75);
    expect(personalIndex(0.75, 0.75)).toBe(100);
    expect(personalIndex(0.825, 0.75)).toBe(110);
    expect(personalIndex(1000, 1200, true)).toBe(120);
  });

  it("keeps the population view unavailable until the sample threshold is met", () => {
    const below = { standardScore: 108, normN: CCC_POPULATION_MIN_N - 1 };
    const ready = { standardScore: 108, normN: CCC_POPULATION_MIN_N };
    expect(displayTrainingScore({ value: 0.8, baseline: 0.75, mode: "population", population: below })).toBeNull();
    expect(displayTrainingScore({ value: 0.8, baseline: 0.75, mode: "population", population: ready })).toBe(108);
    expect(populationModeAvailable({ accuracy: below })).toBe(false);
    expect(populationModeAvailable({ accuracy: ready })).toBe(true);
  });
});
