import { CORS, json, readPayload } from "../_shared/http.ts";
import {
  CCC_APP_ID,
  authenticatedUser,
  objectValue,
  numberValue,
  serviceClient,
  stringValue,
} from "../_shared/supabase.ts";

const SESSION_METRICS: Array<[string, string, string]> = [
  ["attentionThroughputBps", "session.attention_throughput_bps", "bits_per_second"],
  ["wmThroughputBps", "session.wm_throughput_bps", "bits_per_second"],
  ["attentionAccuracy", "session.attention_accuracy", "ratio"],
  ["signalAccuracy", "session.signal_accuracy", "ratio"],
  ["wmAccuracy", "session.wm_accuracy", "ratio"],
  ["medianDecisionMs", "session.decision_time_ms", "ms"],
  ["pointsKeptPercent", "session.points_kept", "percent"],
  ["omissionRate", "session.omission_rate", "ratio"],
  ["timingShiftMs", "session.timing_shift_ms", "ms"],
  ["closePatternAccuracy", "session.close_pattern_accuracy", "ratio"],
];

async function recordSessionMetrics(input: {
  supabase: ReturnType<typeof serviceClient>;
  userId: string;
  sourceSessionId: string;
  clientSessionId: string;
  summary: Record<string, unknown>;
  completedAt: string;
}): Promise<void> {
  const metrics = objectValue(input.summary.metrics);
  const rows = SESSION_METRICS.flatMap(([sourceKey, metricKey, unit]) => {
    const metricValue = numberValue(metrics[sourceKey]);
    return metricValue === null ? [] : [{
      app_id: CCC_APP_ID,
      user_id: input.userId,
      client_session_id: input.clientSessionId,
      source_session_id: input.sourceSessionId,
      programme_run_id: stringValue(input.summary.programmeRunId) || null,
      session_number: numberValue(input.summary.programmeSessionNumber) ?? 1,
      metric_key: metricKey,
      metric_group: "session_feedback",
      metric_unit: unit,
      metric_value: metricValue,
      recorded_at: input.completedAt,
    }];
  });
  if (!rows.length) return;
  const { error } = await input.supabase.from("coach_metric_observations")
    .upsert(rows, { onConflict: "app_id,user_id,client_session_id,metric_key" });
  if (error) throw new Error(error.message);
  for (const metricKey of rows.map((row) => row.metric_key)) {
    const { data: observations } = await input.supabase.from("coach_metric_observations")
      .select("user_id,metric_value,recorded_at")
      .eq("app_id", CCC_APP_ID)
      .eq("metric_key", metricKey);
    const latestByUser = new Map<string, { value: number; recordedAt: string }>();
    for (const row of observations || []) {
      const value = Number(row.metric_value);
      const userId = stringValue(row.user_id);
      const recordedAt = stringValue(row.recorded_at);
      if (!userId || !Number.isFinite(value)) continue;
      const previous = latestByUser.get(userId);
      if (!previous || recordedAt > previous.recordedAt) latestByUser.set(userId, { value, recordedAt });
    }
    const values = Array.from(latestByUser.values()).map((row) => row.value);
    if (!values.length) continue;
    const n = values.length;
    const mean = values.reduce((total, value) => total + value, 0) / n;
    const variance = n > 1 ? values.reduce((total, value) => total + (value - mean) ** 2, 0) / (n - 1) : 0;
    const latest = Array.from(latestByUser.values()).map((row) => row.recordedAt).filter(Boolean).sort().at(-1) || null;
    const { error: normError } = await input.supabase.from("coach_metric_norms").upsert({
      app_id: CCC_APP_ID,
      metric_key: metricKey,
      cohort_key: "global_beta",
      n,
      mean_value: mean,
      stddev_value: n > 1 ? Math.sqrt(variance) : null,
      last_observation_at: latest,
      updated_at: new Date().toISOString(),
    }, { onConflict: "app_id,metric_key,cohort_key" });
    if (normError) throw new Error(normError.message);
  }
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (request.method !== "POST") return json(405, { error: "Method not allowed." });
  const user = await authenticatedUser(request);
  if (!user) return json(401, { error: "Authentication required." });
  const payload = await readPayload(request);
  if (!payload || payload.appId !== CCC_APP_ID || !stringValue(payload.clientSessionId)) {
    return json(400, { error: "Invalid finalisation request." });
  }
  const supabase = serviceClient();
  const completedAt = stringValue(payload.completedAt, new Date().toISOString());
  const protocolVersion = stringValue(payload.protocolVersion);
  const configVersion = stringValue(payload.configVersion);
  const events = Array.isArray(payload.events) ? payload.events : [];
  if (!protocolVersion || !configVersion || events.length > 100) {
    return json(400, { error: "Incomplete or oversized finalisation request." });
  }
  const summary = objectValue(payload.summary);
  const { data, error } = await supabase
    .from("coach_sessions")
    .update({
      status: "completed",
      completed_at: completedAt,
      summary,
    })
    .eq("user_id", user.id)
    .eq("app_id", CCC_APP_ID)
    .eq("client_session_id", stringValue(payload.clientSessionId))
    .select("id")
    .maybeSingle();
  if (error) return json(500, { error: error.message });
  if (!data) return json(404, { error: "Session not found. Complete at least one saved stage before finalising." });
  await recordSessionMetrics({
    supabase,
    userId: user.id,
    sourceSessionId: data.id,
    clientSessionId: stringValue(payload.clientSessionId),
    summary,
    completedAt,
  });

  const eventRows = events.map((value) => {
    const event = objectValue(value);
    return {
      user_id: user.id,
      app_id: CCC_APP_ID,
      protocol_version: protocolVersion,
      config_version: configVersion,
      session_id: data.id,
      client_event_id: stringValue(event.clientEventId),
      block_id: stringValue(event.blockId) || null,
      event_type: stringValue(event.eventType),
      event_payload: objectValue(event.payload),
      occurred_at: stringValue(event.occurredAt) || null,
    };
  }).filter((row) => row.client_event_id && row.event_type);
  if (eventRows.length) {
    const { error: eventError } = await supabase
      .from("coach_events")
      .upsert(eventRows, { onConflict: "user_id,app_id,client_event_id" });
    if (eventError) return json(500, { error: eventError.message });
  }
  return json(200, { completed: true, sessionId: data.id });
});
