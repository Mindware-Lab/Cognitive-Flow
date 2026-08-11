import { describe, expect, it } from "vitest";
import { generateTrial } from "../src/generator";
import { selectFreshDelayedRecheckResults } from "../src/delayedEvidence";
import type { EvidencePurpose, TrialResult } from "../src/types";

function result(input: {
  sessionId?: string;
  programmeRunId?: string;
  programmeCycle?: number;
  blockPurpose?: EvidencePurpose;
  evidencePurpose?: EvidencePurpose;
  blockStartedAtMs?: number;
  completedAtMs?: number;
} = {}): TrialResult {
  const sessionId = input.sessionId || "session-current";
  const trial = generateTrial(sessionId, "acc-1", 0, "ACC", "P6_DELAYED", "flow_rel", false, undefined, {
    probeStatus: input.evidencePurpose === "delayed_recheck" ? "delayed_recheck" : "mix",
    evidencePurpose: input.evidencePurpose || "delayed_recheck",
  });
  return {
    trial,
    blockPurpose: input.blockPurpose ?? "delayed_recheck",
    blockStartedAtMs: input.blockStartedAtMs ?? 1000,
    completedAtMs: input.completedAtMs ?? 1200,
    programmeRunId: input.programmeRunId ?? "run-current",
    programmeCycle: input.programmeCycle ?? 1,
    response: trial.correctResponse,
    isCorrect: true,
    rtMs: 300,
    exposureMsActual: 500,
    actualStimulusFrames: 30,
    deviceRefreshRateEstimate: 60,
    droppedFrameCount: 0,
    timingQuality: "good",
  };
}

describe("fresh delayed evidence selection", () => {
  it("requires current session, current attempt, delayed block purpose, delayed evidence purpose, and post-block timing", () => {
    const valid = result();
    const selected = selectFreshDelayedRecheckResults([
      valid,
      result({ blockPurpose: "mix" }),
      result({ evidencePurpose: "mix" }),
      result({ sessionId: "session-prior" }),
      result({ programmeRunId: "run-prior" }),
      result({ programmeCycle: 0 }),
      result({ blockStartedAtMs: 1000, completedAtMs: 900 }),
    ], {
      sessionId: "session-current",
      programmeRunId: "run-current",
      programmeCycle: 1,
    });

    expect(selected).toEqual([valid]);
  });

  it("does not count delayed-tagged trials from an ordinary mixed block", () => {
    const selected = selectFreshDelayedRecheckResults([
      result({ blockPurpose: "mix", evidencePurpose: "delayed_recheck" }),
    ], {
      sessionId: "session-current",
      programmeRunId: "run-current",
      programmeCycle: 1,
    });

    expect(selected).toEqual([]);
  });
});
