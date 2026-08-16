import { describe, expect, it } from "vitest";
import { buildCccBlockSubmissionPayload } from "../src/blockPayload";
import { createP0AttentionCarrierTransferPlan } from "../src/cccGenerator";
import { createProgrammeSessionPlan } from "../src/cccProgrammeGenerator";
import { scoreCccAttentionTrial } from "../src/cccValue";
import type { CccRecordedTrial } from "../src/cccTypes";

describe("CCC block payload", () => {
  it("serialises the value, validity, transfer and workflow contract", () => {
    const plan = createProgrammeSessionPlan({
      sessionId: "payload",
      seed: "payload",
      programmeRunId: "payload",
      programmeSessionNumber: 2,
      kind: "p1a_consolidation",
      regimePair: ["clear_sprint", "deep_check"],
      wmLevel: 1,
      attentionWrapperStage: "flow_first_contact",
    });
    const block = plan.blocks[0];
    const trial = plan.trials.find((candidate) => candidate.blockId === block.id)!;
    const scoring = scoreCccAttentionTrial({ trial, response: trial.correctResponse, responseTimeMs: 900 });
    const result: CccRecordedTrial = {
      trial,
      response: trial.correctResponse,
      scoring,
      recordedAt: "2026-08-11T12:00:00.000Z",
      viewportClass: "desktop",
      inputMode: "keyboard",
      focusLost: false,
      exposureMsActual: null,
      actualStimulusFrames: null,
      deviceRefreshRateEstimate: null,
      timingQuality: "not_applicable",
    };
    const payload = buildCccBlockSubmissionPayload({
      plan,
      block,
      results: [result],
      events: [{
        id: "event-1",
        eventType: "shift_view_completed",
        occurredAt: "2026-08-11T11:59:59.000Z",
        sessionId: plan.sessionId,
        blockId: block.id,
        payload: { scoreAffecting: false },
      }],
      workflowChoice: "ai_assisted",
    });
    const serialized = (payload.trials as Array<Record<string, unknown>>)[0];

    expect(payload).toMatchObject({
      appId: "cognitive_control_coach",
      workflowChoice: "ai_assisted",
      phase: "p1a_flow_first_contact",
    });
    expect(serialized).toMatchObject({
      wrapperId: "flow_rel",
      sourceWrapperId: "arrow_rel",
      phase: "p1a_flow_first_contact",
      estimand: "transfer",
      presentationMode: "self_paced_value",
      diagnostic: true,
      assistedFirstContact: true,
      validForProgression: false,
      countsTowardQuota: true,
      minimumExposureMs: 350,
      deadlineMs: 4000,
      inputMode: "keyboard",
    });
    expect((payload.events as Array<Record<string, unknown>>)[0]).toMatchObject({
      eventType: "shift_view_completed",
    });
  });

  it("keeps the protected signal timing separate from policy value fields", () => {
    const plan = createP0AttentionCarrierTransferPlan({ seed: "signal-payload", regimePairIndex: 0 });
    const block = plan.blocks[0];
    const trial = plan.trials.find((candidate) => candidate.blockId === block.id)!;
    const scoring = scoreCccAttentionTrial({ trial, response: trial.correctResponse, responseTimeMs: 930 });
    const result: CccRecordedTrial = {
      trial,
      response: trial.correctResponse,
      scoring,
      recordedAt: "2026-08-11T12:00:00.000Z",
      viewportClass: "mobile",
      inputMode: "touch",
      focusLost: false,
      exposureMsActual: 516,
      actualStimulusFrames: 31,
      deviceRefreshRateEstimate: 60.1,
      timingQuality: "good",
    };
    const payload = buildCccBlockSubmissionPayload({
      plan,
      block,
      results: [result],
      events: [],
      workflowChoice: "focused_work",
    });
    const serialized = (payload.trials as Array<Record<string, unknown>>)[0];

    expect(serialized).toMatchObject({
      estimand: "signal_capacity",
      presentationMode: "masked_forced_choice",
      wrapperId: "arrow_abs",
      initialReward: null,
      drainRatePerSecond: null,
      errorLoss: null,
      minimumExposureMs: null,
      deadlineMs: 2500,
      exposureMsRequested: 500,
      exposureMsActual: 516,
      actualStimulusFrames: 31,
      deviceRefreshRateEstimate: 60.1,
      timingQuality: "good",
      signalStaircaseLevel: 4,
      countsTowardQuota: true,
      validForProgression: false,
    });
  });
});
