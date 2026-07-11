import { authenticatedUser, serviceClient } from "../_shared/supabase.ts";
import { CORS, json, readPayload } from "../_shared/http.ts";

interface SubmitBlockPayload {
  clientSessionId: string;
  clientBlockId: string;
  programmeRunId?: string;
  programmeCycle?: number;
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
    phaseLabel: string;
    isReferenceRecheck: boolean;
    response: string | null;
    correctResponse: string | null;
    isCorrect: boolean;
    rtMs: number | null;
    ratio: string;
    exposureMsRequested: number;
    exposureMsActual: number;
    actualStimulusFrames: number;
    deviceRefreshRateEstimate: number;
    droppedFrameCount: number;
    timingQuality: string;
    wrapperId?: string | null;
    wrapperIdProtocol?: string | null;
    carrier?: string | null;
    protocolFrame?: string | null;
    probeStatus?: string | null;
    mixRatio?: number | null;
    mappingTiming?: string | null;
    lureType?: string | null;
    transferEventId?: string | null;
  }>;
}

function isMissingProgrammeColumn(error: { code?: string; message?: string } | null): boolean {
  return Boolean(
    error &&
      (error.code === "42703" ||
        error.message?.includes("programme_run_id") ||
        error.message?.includes("programme_cycle")),
  );
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
  if (payload.trials.length < 20) return json(400, { error: "Blocks must contain at least 20 trials." });

  const supabase = serviceClient();
  const sessionRow = {
        user_id: user.id,
        client_session_id: payload.clientSessionId,
        programme_run_id: payload.programmeRunId || null,
        programme_cycle: payload.programmeCycle || 1,
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
    .from("wm_sessions")
    .upsert(sessionRow, { onConflict: "user_id,client_session_id" })
    .select("id")
    .single();
  if (isMissingProgrammeColumn(sessionResult.error)) {
    const legacySessionRow: Record<string, unknown> = { ...sessionRow };
    delete legacySessionRow.programme_run_id;
    delete legacySessionRow.programme_cycle;
    sessionResult = await supabase
      .from("wm_sessions")
      .upsert(legacySessionRow, { onConflict: "user_id,client_session_id" })
      .select("id")
      .single();
  }
  const { data: session, error: sessionError } = sessionResult;
  if (sessionError) return json(500, { error: sessionError.message });

  const { data: block, error: blockError } = await supabase
    .from("wm_blocks")
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
    wrapper_id: trial.wrapperIdProtocol || trial.cellKey || null,
    carrier: trial.carrier || null,
    frame: trial.protocolFrame || null,
    probe_status: trial.probeStatus || null,
    mix_ratio: trial.mixRatio ?? null,
    mapping_timing: trial.mappingTiming || null,
    lure_type: trial.lureType || null,
    transfer_event_id: trial.transferEventId || null,
  }));
  const { error: trialError } = await supabase.from("wm_trials").upsert(rows, {
    onConflict: "session_id,client_trial_id",
  });
  if (trialError) return json(500, { error: trialError.message });
  return json(200, { accepted: true, sessionId: session.id, blockId: block.id });
});
