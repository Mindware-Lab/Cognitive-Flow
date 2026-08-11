import {
  CCC_CONFIG_VERSION,
  CCC_PROTOCOL_VERSION,
  CCC_REGIMES,
  CCC_TRIAL_TIMING,
} from "./cccConfig";
import { CCC_VALUE_SCORING_VERSION } from "./cccValue";
import type {
  CccAttentionBlockPlan,
  CccRecordedTrial,
  CccRuntimeEvent,
  CccSessionPlan,
} from "./cccTypes";
import type { WorkflowChoice } from "./cccCopy";

export interface CccBlockPayloadInput {
  plan: CccSessionPlan;
  block: CccAttentionBlockPlan;
  results: readonly CccRecordedTrial[];
  events: readonly CccRuntimeEvent[];
  workflowChoice: WorkflowChoice;
}

export function buildCccBlockSubmissionPayload(input: CccBlockPayloadInput): Record<string, unknown> {
  const { plan, block } = input;
  return {
    appId: plan.appId,
    clientSessionId: plan.sessionId,
    sessionType: plan.sessionType,
    stage: plan.stage,
    stepId: block.stepId,
    phase: block.phase,
    protocolVersion: CCC_PROTOCOL_VERSION,
    configVersion: CCC_CONFIG_VERSION,
    scoringVersion: CCC_VALUE_SCORING_VERSION,
    workflowChoice: input.workflowChoice,
    block: {
      clientBlockId: block.id,
      blockIndex: block.index,
      label: block.label,
      phase: block.phase,
      transitionKind: block.transitionKind,
      wrapperId: block.wrapperId,
      wrappers: block.wrappers,
      sourceWrapperId: block.sourceWrapperId,
      strictCarrierTransferBoundary: block.strictCarrierTransferBoundary,
      diagnostic: block.diagnostic,
      plannedValidTrialCount: block.validTrialCount,
    },
    trials: input.results.map((result) => {
      const trial = result.trial;
      const scoring = result.scoring;
      const regime = CCC_REGIMES[trial.regimeId];
      return {
        clientTrialId: trial.id,
        trialIndex: trial.trialIndex,
        blockTrialIndex: trial.blockTrialIndex,
        operator: trial.operator,
        wrapperId: trial.wrapperId,
        sourceWrapperId: trial.sourceWrapperId,
        referenceFrame: trial.referenceFrame,
        carrier: trial.carrier,
        regimeId: trial.regimeId,
        phase: trial.phase,
        stepId: trial.stepId,
        purpose: trial.purpose,
        transitionKind: trial.transitionKind,
        strictCarrierTransferBoundary: trial.strictCarrierTransferBoundary,
        relationClass: trial.targetClass,
        evidenceLevel: trial.ratio,
        majorityRatio: trial.ratio,
        majorityCount: trial.majorityCount,
        initialReward: regime.correctPot,
        drainRatePerSecond: regime.drainPointsPerSecond,
        errorLoss: regime.errorLoss,
        withholdValue: CCC_TRIAL_TIMING.voluntaryWithholdPoints,
        omissionValue: CCC_TRIAL_TIMING.omissionPoints,
        minimumExposureMs: CCC_TRIAL_TIMING.minimumExposureBeforeAnswerMs,
        deadlineMs: CCC_TRIAL_TIMING.maxResponseWindowMs,
        correctResponse: trial.correctResponse,
        response: result.response,
        responseClass: scoring.responseClass,
        correct: scoring.isCorrect,
        responseTimeMs: scoring.responseTimeMs,
        rewardRemaining: scoring.rewardRemaining,
        pointsRealised: scoring.pointsRealised,
        normalisedValue: scoring.normalizedValue,
        practice: trial.practice,
        diagnostic: trial.diagnostic,
        assistedFirstContact: trial.assistedFirstContact,
        validForProgression: scoring.validForProgression,
        invalidReason: scoring.invalidReason,
        viewportClass: result.viewportClass,
        inputMode: result.inputMode,
        focusLost: result.focusLost,
        replacementOfTrialId: trial.replacementOfTrialId,
        stimulus: {
          ratio: trial.ratio,
          majorityCount: trial.majorityCount,
          coherenceNoiseLevel: trial.coherenceNoiseLevel,
          items: trial.stimulusItems,
          seed: trial.seed,
        },
        scoring: {
          version: scoring.scoringVersion,
          answeredBeforeMinimumExposure: scoring.answeredBeforeMinimumExposure,
          deadlineExceeded: scoring.deadlineExceeded,
        },
        recordedAt: result.recordedAt,
      };
    }),
    events: input.events.map((event) => ({
      clientEventId: event.id,
      eventType: event.eventType,
      occurredAt: event.occurredAt,
      blockId: event.blockId,
      payload: event.payload,
    })),
  };
}
