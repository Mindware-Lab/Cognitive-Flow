import type { TrialDefinition } from "./types";

export function stimulusTimingForTrial(
  trial: TrialDefinition,
  stimulusStartedAtMs = 0,
): { stimulusStartedAtMs: number; stimulusEndedAtMs: number; exposureMsActual: number; actualStimulusFrames: number } {
  const exposureMsActual = trial.exposureMsRequested;
  return {
    stimulusStartedAtMs,
    stimulusEndedAtMs: stimulusStartedAtMs + exposureMsActual,
    exposureMsActual,
    actualStimulusFrames: Math.max(1, Math.round(trial.exposureMsRequested / 16.67)),
  };
}
