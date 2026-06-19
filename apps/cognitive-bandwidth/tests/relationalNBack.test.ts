import { describe, expect, it } from "vitest";
import {
  RELATIONAL_NBACK_BASE_TRIALS,
  RELATIONAL_NBACK_RELATIONS,
  classifyRelationalNBackResponse,
  generateRelationalNBackBlock,
  summarizeRelationalNBack,
} from "../src/relationalNBack";
import type { RelationalNBackOutcome } from "../src/relationalNBack";

describe("relational vector n-back", () => {
  it("builds deterministic 10+n mono blocks", () => {
    const oneBack = generateRelationalNBackBlock("demo", 1);
    const twoBack = generateRelationalNBackBlock("demo", 2);
    expect(oneBack).toHaveLength(RELATIONAL_NBACK_BASE_TRIALS + 1);
    expect(twoBack).toHaveLength(RELATIONAL_NBACK_BASE_TRIALS + 2);
    expect(generateRelationalNBackBlock("demo", 1)).toEqual(oneBack);
  });

  it("uses only the six requested relative-direction relations", () => {
    const trials = generateRelationalNBackBlock("relations", 2);
    expect(
      trials.every((trial) => RELATIONAL_NBACK_RELATIONS.includes(trial.relation)),
    ).toBe(true);
  });

  it("marks scheduled matches from the canonical relation at lag n", () => {
    for (const level of [1, 2] as const) {
      const trials = generateRelationalNBackBlock("matches", level);
      for (const trial of trials) {
        expect(trial.isMatch).toBe(
          trial.index >= level &&
            trial.relation === trials[trial.index - level]?.relation,
        );
      }
      expect(trials.filter((trial) => trial.isMatch)).toHaveLength(3);
    }
  });

  it("classifies mono match responses and excludes warm-up trials from accuracy", () => {
    expect(classifyRelationalNBackResponse(true, true)).toBe("hit");
    expect(classifyRelationalNBackResponse(true, false)).toBe("miss");
    expect(classifyRelationalNBackResponse(false, true)).toBe("false_alarm");
    expect(classifyRelationalNBackResponse(false, false)).toBe("correct_rejection");

    const trials = generateRelationalNBackBlock("summary", 1);
    const outcomes = trials.map((trial) => ({
      trial,
      responded: trial.isMatch,
      isCorrect: true,
      classification: classifyRelationalNBackResponse(
        trial.isMatch,
        trial.isMatch,
      ),
      rtMs: trial.isMatch ? 320 : null,
    })) satisfies RelationalNBackOutcome[];
    const summary = summarizeRelationalNBack(1, outcomes);
    expect(summary.scoredTrials).toBe(10);
    expect(summary.accuracy).toBe(1);
  });
});
