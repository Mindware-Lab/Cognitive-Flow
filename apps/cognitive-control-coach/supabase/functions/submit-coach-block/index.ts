import { CORS, json, readPayload } from "../_shared/http.ts";
import {
  CCC_APP_ID,
  authenticatedUser,
  booleanValue,
  numberValue,
  objectValue,
  serviceClient,
  stringValue,
} from "../_shared/supabase.ts";

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (request.method !== "POST") return json(405, { error: "Method not allowed." });

  const user = await authenticatedUser(request);
  if (!user) return json(401, { error: "Authentication required." });
  const payload = await readPayload(request);
  if (!payload || payload.appId !== CCC_APP_ID) return json(400, { error: "Invalid app." });

  const clientSessionId = stringValue(payload.clientSessionId);
  const protocolVersion = stringValue(payload.protocolVersion);
  const configVersion = stringValue(payload.configVersion);
  const block = objectValue(payload.block);
  const trials = Array.isArray(payload.trials) ? payload.trials : [];
  const events = Array.isArray(payload.events) ? payload.events : [];
  if (!clientSessionId || !protocolVersion || !configVersion || !stringValue(block.clientBlockId)) {
    return json(400, { error: "Incomplete block payload." });
  }
  if (trials.length > 500 || events.length > 500) return json(413, { error: "Block payload is too large." });

  const supabase = serviceClient();
  const { data: session, error: sessionError } = await supabase
    .from("coach_sessions")
    .upsert({
      user_id: user.id,
      app_id: CCC_APP_ID,
      client_session_id: clientSessionId,
      protocol_version: protocolVersion,
      config_version: configVersion,
      session_type: stringValue(payload.sessionType, "guided_p0"),
      progression_stage: stringValue(payload.stage, "P0"),
      progression_step_id: stringValue(payload.stepId) || null,
      workflow_choice: stringValue(payload.workflowChoice) || null,
      metadata: {
        scoringVersion: stringValue(payload.scoringVersion),
        latestBlock: block,
      },
    }, { onConflict: "user_id,app_id,client_session_id" })
    .select("id")
    .single();
  if (sessionError) return json(500, { error: sessionError.message });

  const trialRows = trials.map((value) => {
    const trial = objectValue(value);
    return {
      session_id: session.id,
      user_id: user.id,
      app_id: CCC_APP_ID,
      protocol_version: protocolVersion,
      config_version: configVersion,
      trial_id: stringValue(trial.clientTrialId),
      block_id: stringValue(block.clientBlockId),
      trial_index: numberValue(trial.trialIndex) ?? 0,
      block_trial_index: numberValue(trial.blockTrialIndex),
      operator: stringValue(trial.operator, "attention"),
      wrapper_id: stringValue(trial.wrapperId) || null,
      source_wrapper_id: stringValue(trial.sourceWrapperId) || null,
      reference_frame: stringValue(trial.referenceFrame) || null,
      carrier: stringValue(trial.carrier) || null,
      regime_id: stringValue(trial.regimeId) || null,
      phase: stringValue(trial.phase) || null,
      progression_step_id: stringValue(trial.stepId) || null,
      purpose: stringValue(trial.purpose) || null,
      transition_kind: stringValue(trial.transitionKind) || null,
      strict_carrier_transfer_boundary: booleanValue(trial.strictCarrierTransferBoundary),
      relation_class: stringValue(trial.relationClass) || null,
      evidence_level: stringValue(trial.evidenceLevel) || null,
      majority_ratio: stringValue(trial.majorityRatio) || null,
      majority_count: numberValue(trial.majorityCount),
      target_class: stringValue(trial.relationClass) || null,
      correct_response: stringValue(trial.correctResponse) || null,
      response: stringValue(trial.response) || null,
      response_class: stringValue(trial.responseClass) || null,
      is_correct: booleanValue(trial.correct),
      is_valid_decision: ["answer", "withhold"].includes(stringValue(trial.responseClass)),
      is_omission: stringValue(trial.responseClass) === "omission",
      response_time_ms: numberValue(trial.responseTimeMs),
      initial_reward: numberValue(trial.initialReward),
      drain_rate_per_second: numberValue(trial.drainRatePerSecond),
      error_loss: numberValue(trial.errorLoss),
      withhold_value: numberValue(trial.withholdValue),
      omission_value: numberValue(trial.omissionValue),
      minimum_exposure_ms: numberValue(trial.minimumExposureMs),
      deadline_ms: numberValue(trial.deadlineMs),
      reward_remaining: numberValue(trial.rewardRemaining),
      points_realised: numberValue(trial.pointsRealised),
      normalized_value: numberValue(trial.normalisedValue),
      practice: booleanValue(trial.practice),
      diagnostic: booleanValue(trial.diagnostic),
      assisted_first_contact: booleanValue(trial.assistedFirstContact),
      valid_for_progression: booleanValue(trial.validForProgression),
      invalid_reason: stringValue(trial.invalidReason) || null,
      viewport_class: stringValue(trial.viewportClass) || null,
      input_mode: stringValue(trial.inputMode) || null,
      focus_lost: booleanValue(trial.focusLost),
      replacement_of_trial_id: stringValue(trial.replacementOfTrialId) || null,
      stimulus: objectValue(trial.stimulus),
      scoring: objectValue(trial.scoring),
      recorded_at: stringValue(trial.recordedAt) || null,
    };
  }).filter((row) => row.trial_id);
  if (trialRows.length) {
    const { error } = await supabase.from("coach_trials").upsert(trialRows, { onConflict: "session_id,trial_id" });
    if (error) return json(500, { error: error.message });
  }

  const eventRows = events.map((value) => {
    const event = objectValue(value);
    return {
      user_id: user.id,
      app_id: CCC_APP_ID,
      protocol_version: protocolVersion,
      config_version: configVersion,
      session_id: session.id,
      client_event_id: stringValue(event.clientEventId),
      block_id: stringValue(event.blockId) || null,
      event_type: stringValue(event.eventType),
      event_payload: objectValue(event.payload),
      occurred_at: stringValue(event.occurredAt) || null,
    };
  }).filter((row) => row.client_event_id && row.event_type);
  if (eventRows.length) {
    const { error } = await supabase.from("coach_events").upsert(eventRows, { onConflict: "user_id,app_id,client_event_id" });
    if (error) return json(500, { error: error.message });
  }

  return json(200, { accepted: true, sessionId: session.id, trialCount: trialRows.length });
});
