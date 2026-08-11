import type { TrialResult } from "./types";

export interface DelayedEvidenceContext {
  sessionId: string;
  programmeRunId?: string;
  programmeCycle?: number;
}

export function selectFreshDelayedRecheckResults(
  results: TrialResult[],
  context: DelayedEvidenceContext,
): TrialResult[] {
  return results.filter((result) => {
    if (result.trial.sessionId !== context.sessionId) return false;
    if (context.programmeRunId !== undefined && result.programmeRunId !== context.programmeRunId) return false;
    if (context.programmeCycle !== undefined && result.programmeCycle !== context.programmeCycle) return false;
    if (result.blockPurpose !== "delayed_recheck") return false;
    if (result.trial.evidencePurpose !== "delayed_recheck") return false;
    if (typeof result.blockStartedAtMs !== "number" || typeof result.completedAtMs !== "number") return false;
    return result.completedAtMs >= result.blockStartedAtMs;
  });
}
