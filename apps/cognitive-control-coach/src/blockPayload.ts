import { PROTOCOL_VERSION } from "./protocol";
import type { MiniBlockPlan, ProtocolGroup, SessionPlan, TransferControllerState, TrialResult } from "./types";

export interface AttentionBlockPayloadInput {
  plan: SessionPlan;
  block: MiniBlockPlan;
  results: TrialResult[];
  protocolGroup: ProtocolGroup;
  transferState: TransferControllerState;
  generatorVersion: string;
  adaptiveVersion: string;
  scoringVersion: string;
}

export function buildAttentionBlockSubmissionPayload(input: AttentionBlockPayloadInput): Record<string, unknown> {
  const { plan, block, results, protocolGroup, transferState } = input;
  return {
    clientSessionId: plan.sessionId,
    programmeRunId: plan.programmeRunId,
    programmeCycle: plan.programmeCycle,
    protocolGroup,
    startCarrier: transferState.startCarrier,
    startCohort: transferState.startCohort,
    startWrapper: transferState.startWrapper,
    carrierTargetWrapper: transferState.carrierTargetWrapper,
    frameTargetWrapper: transferState.frameTargetWrapper,
    heldOutWrapper: transferState.heldOutWrapper,
    heldOutStatus: transferState.heldOutStatus,
    clientBlockId: block.id,
    sessionNumber: plan.sessionNumber,
    phaseLabel: plan.phase,
    phaseStatus: plan.phaseStatus,
    nominalSessionBand: plan.nominalBand,
    protocolVersion: PROTOCOL_VERSION,
    generatorVersion: input.generatorVersion,
    adaptiveVersion: input.adaptiveVersion,
    scoringVersion: input.scoringVersion,
    blockIndex: block.index,
    blockPurpose: block.evidencePurpose,
    construct: block.construct,
    label: block.label,
    trials: results.map((result) => ({
      clientTrialId: result.trial.id,
      construct: result.trial.construct,
      cellKey: result.trial.cellKey,
      transitionKey: result.trial.transitionKey,
      wrapperId: result.trial.wrapperId,
      carrier: result.trial.carrier,
      frame: result.trial.frame,
      probeStatus: result.trial.probeStatus,
      evidencePurpose: result.trial.evidencePurpose,
      mixRatio: result.trial.mixRatio,
      mappingTiming: result.trial.mappingTiming,
      lureType: result.trial.lureType,
      transferEventId: result.trial.transferEventId,
      startCarrier: transferState.startCarrier,
      startCohort: transferState.startCohort,
      startWrapper: transferState.startWrapper,
      carrierTargetWrapper: transferState.carrierTargetWrapper,
      frameTargetWrapper: transferState.frameTargetWrapper,
      heldOutWrapper: transferState.heldOutWrapper,
      heldOutStatus: transferState.heldOutStatus,
      phaseLabel: result.trial.phase,
      isReferenceRecheck: result.trial.isReferenceRecheck,
      ratio: result.trial.ratio,
      exposureMsRequested: result.trial.exposureMsRequested,
      majorityCount: result.trial.majorityCount,
      correctResponse: result.trial.correctResponse,
      response: result.response,
      isCorrect: result.isCorrect,
      rtMs: result.rtMs,
      exposureMsActual: result.exposureMsActual,
      actualStimulusFrames: result.actualStimulusFrames,
      deviceRefreshRateEstimate: result.deviceRefreshRateEstimate,
      droppedFrameCount: result.droppedFrameCount,
      timingQuality: result.timingQuality,
    })),
  };
}
