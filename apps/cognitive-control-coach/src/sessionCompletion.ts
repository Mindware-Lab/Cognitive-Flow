import type { MiniBlockPlan, SessionPlan, TrialResult } from "./types";

export const DEFAULT_GUIDED_NO_INPUT_TRIAL_LIMIT = 6;

export type CompletionGuard = {
  completed: boolean;
  completedTrials: number;
  requiredTrials: number;
};

export function blockCompletionGuard(block: MiniBlockPlan | null | undefined, results: TrialResult[]): CompletionGuard {
  const requiredTrials = Math.max(0, block?.trialCount ?? 0);
  const completedTrials = results.length;
  return {
    completed: requiredTrials > 0 && completedTrials >= requiredTrials,
    completedTrials,
    requiredTrials,
  };
}

export function guidedSessionCompletionGuard(plan: SessionPlan | null | undefined, results: TrialResult[]): CompletionGuard {
  const requiredTrials = (plan?.miniBlocks || []).reduce((total, block) => total + Math.max(0, block.trialCount), 0);
  const completedTrials = results.length;
  return {
    completed: requiredTrials > 0 && completedTrials >= requiredTrials,
    completedTrials,
    requiredTrials,
  };
}

export function nextNoInputTrialCount(previousCount: number, response: string | null): number {
  return response === null ? previousCount + 1 : 0;
}

export function shouldExitForNoInput(
  consecutiveNoInputTrials: number,
  limit = DEFAULT_GUIDED_NO_INPUT_TRIAL_LIMIT,
): boolean {
  return consecutiveNoInputTrials >= limit;
}
