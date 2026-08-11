import { describe, expect, it } from "vitest";
import { buildAttentionBlockSubmissionPayload } from "../src/blockPayload";
import { createSessionPlan } from "../src/generator";
import { createInitialTransferControllerState } from "../src/transferController";
import type { TrialResult } from "../src/types";

describe("attention block payload", () => {
  it("preserves atomic cellKey and wrapperId through serialization", () => {
    const transferState = {
      ...createInitialTransferControllerState(),
      phase: "delayed_recheck" as const,
      activeMix: {
        wrapperRatios: { arrow_abs: 0.25, flow_abs: 0.25, arrow_rel: 0.25, flow_rel: 0.25 },
        randomised: true,
      },
    };
    const plan = createSessionPlan(20, "P6_DELAYED", "delayed", "return check", "payload-seed", "run", 1, transferState);
    const trial = plan.trials.find((item) => item.construct === "ACC" && item.cellKey === "flow_rel");
    expect(trial).toBeDefined();
    const block = plan.miniBlocks.find((item) => item.id === trial?.miniBlockId);
    expect(block).toBeDefined();
    const result: TrialResult = {
      trial: trial!,
      blockPurpose: block!.evidencePurpose,
      blockStartedAtMs: 1000,
      completedAtMs: 1200,
      programmeRunId: plan.programmeRunId,
      programmeCycle: plan.programmeCycle,
      response: trial!.correctResponse,
      isCorrect: true,
      rtMs: 240,
      exposureMsActual: 300,
      actualStimulusFrames: 18,
      deviceRefreshRateEstimate: 60,
      droppedFrameCount: 0,
      timingQuality: "good",
    };

    const payload = buildAttentionBlockSubmissionPayload({
      plan,
      block: block!,
      results: [result],
      protocolGroup: "commercial_arrows_first",
      transferState,
      generatorVersion: "generator-test",
      adaptiveVersion: "adaptive-test",
      scoringVersion: "scoring-test",
    });
    const serializedTrial = (payload.trials as Array<Record<string, unknown>>)[0];

    expect(serializedTrial.cellKey).toBe("flow_rel");
    expect(serializedTrial.wrapperId).toBe("flow_rel");
    expect(serializedTrial.wrapperId).not.toBe("mixed");
    expect(serializedTrial.wrapperId).not.toBe("arrow_abs");
  });
});
