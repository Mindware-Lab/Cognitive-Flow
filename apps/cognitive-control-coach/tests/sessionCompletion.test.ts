import { describe, expect, it } from "vitest";
import { createSessionPlan } from "../src/generator";
import {
  DEFAULT_GUIDED_NO_INPUT_TRIAL_LIMIT,
  blockCompletionGuard,
  guidedSessionCompletionGuard,
  nextNoInputTrialCount,
  shouldExitForNoInput,
} from "../src/sessionCompletion";
import type { MiniBlockPlan, TrialResult } from "../src/types";

function block(trialCount = 20): MiniBlockPlan {
  return {
    id: "acc-1",
    index: 1,
    construct: "ACC",
    label: "Attention Control",
    instruction: "Complete the block.",
    cells: ["arrow_abs"],
    trialCount,
    currentTrials: trialCount,
    referenceTrials: 0,
    wrapperId: "arrow_abs",
    probeStatus: "base",
    evidencePurpose: "training",
    mixRatio: null,
    transferEventId: null,
  };
}

function results(count: number): TrialResult[] {
  return Array.from({ length: count }, () => ({}) as TrialResult);
}

describe("guided session completion guards", () => {
  it("does not treat an ended guided block as complete when trials are missing", () => {
    expect(blockCompletionGuard(block(), results(0))).toMatchObject({
      completed: false,
      completedTrials: 0,
      requiredTrials: 20,
    });
    expect(blockCompletionGuard(block(), results(19)).completed).toBe(false);
  });

  it("allows block progression only after the full block trial count", () => {
    expect(blockCompletionGuard(block(), results(20))).toMatchObject({
      completed: true,
      completedTrials: 20,
      requiredTrials: 20,
    });
  });

  it("does not count a guided session completed unless every guided trial is present", () => {
    const plan = createSessionPlan(1, "P1_ARROW_ABS", "active", "adaptive route", "guarded-session");
    expect(guidedSessionCompletionGuard(plan, results(0))).toMatchObject({
      completed: false,
      completedTrials: 0,
      requiredTrials: 80,
    });
    expect(guidedSessionCompletionGuard(plan, results(79)).completed).toBe(false);
    expect(guidedSessionCompletionGuard(plan, results(80)).completed).toBe(true);
  });

  it("exits a guided block after the no-input threshold and resets the streak on response", () => {
    let streak = 0;
    for (let index = 0; index < DEFAULT_GUIDED_NO_INPUT_TRIAL_LIMIT - 1; index += 1) {
      streak = nextNoInputTrialCount(streak, null);
      expect(shouldExitForNoInput(streak)).toBe(false);
    }

    streak = nextNoInputTrialCount(streak, "left");
    expect(streak).toBe(0);
    expect(shouldExitForNoInput(streak)).toBe(false);

    for (let index = 0; index < DEFAULT_GUIDED_NO_INPUT_TRIAL_LIMIT; index += 1) {
      streak = nextNoInputTrialCount(streak, null);
    }
    expect(shouldExitForNoInput(streak)).toBe(true);
  });
});
