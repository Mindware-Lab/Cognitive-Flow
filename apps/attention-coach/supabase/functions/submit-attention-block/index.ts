import { authenticatedUser, serviceClient } from "../_shared/supabase.ts";
import { CORS, json, readPayload } from "../_shared/http.ts";

interface SubmitBlockPayload {
  clientSessionId: string;
  programmeRunId?: string;
  programmeCycle?: number;
  protocolGroup?: string | null;
  startCarrier?: string | null;
  startCohort?: string | null;
  startWrapper?: string | null;
  carrierTargetWrapper?: string | null;
  frameTargetWrapper?: string | null;
  heldOutWrapper?: string | null;
  heldOutStatus?: string | null;
  clientBlockId: string;
  sessionNumber: number;
  phaseLabel: string;
  phaseStatus: string;
  nominalSessionBand?: string;
  protocolVersion: string;
  generatorVersion: string;
  adaptiveVersion: string;
  scoringVersion: string;
  blockIndex: number;
  construct: "ACC" | "BSE";
  label: string;
  trials: Array<{
    clientTrialId: string;
    construct: "ACC" | "BSE";
    cellKey: string;
    transitionKey?: string | null;
    wrapperId?: string | null;
    carrier?: string | null;
    frame?: string | null;
    probeStatus?: string | null;
    mixRatio?: number | null;
    mappingTiming?: string | null;
    lureType?: string | null;
    transferEventId?: string | null;
    startCarrier?: string | null;
    startCohort?: string | null;
    startWrapper?: string | null;
    carrierTargetWrapper?: string | null;
    frameTargetWrapper?: string | null;
    heldOutWrapper?: string | null;
    heldOutStatus?: string | null;
    phaseLabel: string;
    isReferenceRecheck: boolean;
    response: string | null;
    correctResponse: string;
    isCorrect: boolean;
    rtMs: number | null;
    ratio: string;
    exposureMsRequested: number;
    exposureMsActual: number;
    actualStimulusFrames: number;
    deviceRefreshRateEstimate: number;
    droppedFrameCount: number;
    timingQuality: string;
  }>;
}

function isMissingProgrammeColumn(error: { message?: string } | null): boolean {
  return Boolean(error?.message && /programme_(run_id|cycle)|protocol_group|start_(carrier|cohort|wrapper)|carrier_target_wrapper|frame_target_wrapper|held_out_(wrapper|status)|schema cache/i.test(error.message));
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (request.method !== "POST") return json(405, { error: "Method not allowed." });

  const user = await authenticatedUser(request);
  if (!user) return json(401, { error: "Authentication required." });

  const payload = await readPayload<SubmitBlockPayload>(request);
  if (!payload || !payload.clientSessionId || !payload.clientBlockId || !Array.isArray(payload.trials)) {
    return json(400, { error: "Invalid block payload." });
  }
  if (payload.trials.length !== 20) return json(400, { error: "Blocks must contain exactly 20 trials." });

  const supabase = serviceClient();
  const sessionRow = {
    user_id: user.id,
    client_session_id: payload.clientSessionId,
    programme_run_id: payload.programmeRunId || null,
    programme_cycle: payload.programmeCycle || 1,
    protocol_group: payload.protocolGroup || null,
    start_carrier: payload.startCarrier || null,
    start_cohort: payload.startCohort || null,
    start_wrapper: payload.startWrapper || null,
    carrier_target_wrapper: payload.carrierTargetWrapper || null,
    frame_target_wrapper: payload.frameTargetWrapper || null,
    held_out_wrapper: payload.heldOutWrapper || null,
    held_out_status: payload.heldOutStatus || null,
    session_number: payload.sessionNumber,
    phase_label: payload.phaseLabel,
    phase_status: payload.phaseStatus,
    nominal_session_band: payload.nominalSessionBand || null,
    protocol_version: payload.protocolVersion,
    generator_version: payload.generatorVersion,
    adaptive_version: payload.adaptiveVersion,
    scoring_version: payload.scoringVersion,
  };
  let sessionResult = await supabase
    .from("attention_sessions")
    .upsert(sessionRow, { onConflict: "user_id,client_session_id" })
    .select("id")
    .single();
  if (isMissingProgrammeColumn(sessionResult.error)) {
    const {
      programme_run_id: _runId,
      programme_cycle: _cycle,
      protocol_group: _protocolGroup,
      start_carrier: _startCarrier,
      start_cohort: _startCohort,
      start_wrapper: _startWrapper,
      carrier_target_wrapper: _carrierTargetWrapper,
      frame_target_wrapper: _frameTargetWrapper,
      held_out_wrapper: _heldOutWrapper,
      held_out_status: _heldOutStatus,
      ...legacySessionRow
    } = sessionRow;
    sessionResult = await supabase
      .from("attention_sessions")
      .upsert(legacySessionRow, { onConflict: "user_id,client_session_id" })
      .select("id")
      .single();
  }
  const { data: session, error: sessionError } = sessionResult;
  if (sessionError) return json(500, { error: sessionError.message });

  const { data: block, error: blockError } = await supabase
    .from("attention_blocks")
    .upsert(
      {
        session_id: session.id,
        user_id: user.id,
        client_block_id: payload.clientBlockId,
        block_index: payload.blockIndex,
        construct: payload.construct,
        label: payload.label,
        trial_count: payload.trials.length,
      },
      { onConflict: "session_id,client_block_id" },
    )
    .select("id")
    .single();
  if (blockError) return json(500, { error: blockError.message });

  const rows = payload.trials.map((trial) => ({
    session_id: session.id,
    block_id: block.id,
    user_id: user.id,
    client_trial_id: trial.clientTrialId,
    construct: trial.construct,
    cell_key: trial.cellKey,
    transition_key: trial.transitionKey || null,
    wrapper_id: trial.wrapperId || null,
    carrier: trial.carrier || null,
    frame: trial.frame || null,
    probe_status: trial.probeStatus || null,
    mix_ratio: trial.mixRatio ?? null,
    mapping_timing: trial.mappingTiming || null,
    lure_type: trial.lureType || null,
    transfer_event_id: trial.transferEventId || null,
    start_carrier: trial.startCarrier || payload.startCarrier || null,
    start_cohort: trial.startCohort || payload.startCohort || null,
    start_wrapper: trial.startWrapper || payload.startWrapper || null,
    carrier_target_wrapper: trial.carrierTargetWrapper || payload.carrierTargetWrapper || null,
    frame_target_wrapper: trial.frameTargetWrapper || payload.frameTargetWrapper || null,
    held_out_wrapper: trial.heldOutWrapper || payload.heldOutWrapper || null,
    held_out_status: trial.heldOutStatus || payload.heldOutStatus || null,
    phase_label: trial.phaseLabel,
    is_reference_recheck: trial.isReferenceRecheck,
    response: trial.response,
    correct_response: trial.correctResponse,
    is_correct: trial.isCorrect,
    rt_ms: trial.rtMs,
    ratio: trial.ratio,
    exposure_ms_requested: trial.exposureMsRequested,
    exposure_ms_actual: trial.exposureMsActual,
    actual_stimulus_frames: trial.actualStimulusFrames,
    device_refresh_rate_estimate: trial.deviceRefreshRateEstimate,
    dropped_frame_count: trial.droppedFrameCount,
    timing_quality: trial.timingQuality,
  }));
  let { error: trialError } = await supabase.from("attention_trials").upsert(rows, {
    onConflict: "session_id,client_trial_id",
  });
  if (isMissingProgrammeColumn(trialError)) {
    const legacyRows = rows.map((row) => {
      const {
        start_carrier: _startCarrier,
        start_cohort: _startCohort,
        start_wrapper: _startWrapper,
        carrier_target_wrapper: _carrierTargetWrapper,
        frame_target_wrapper: _frameTargetWrapper,
        held_out_wrapper: _heldOutWrapper,
        held_out_status: _heldOutStatus,
        ...legacyRow
      } = row;
      return legacyRow;
    });
    const retry = await supabase.from("attention_trials").upsert(legacyRows, {
      onConflict: "session_id,client_trial_id",
    });
    trialError = retry.error;
  }
  if (trialError) return json(500, { error: trialError.message });
  return json(200, { accepted: true, sessionId: session.id, blockId: block.id });
});
