import { authenticatedUser, serviceClient } from "../_shared/supabase.ts";
import { CORS, json, readPayload } from "../_shared/http.ts";

async function refreshMetricNorms(
  supabase: ReturnType<typeof serviceClient>,
  appId: "attention_coach" | "wm_coach",
  metricKeys: string[],
): Promise<void> {
  for (const metricKey of metricKeys) {
    const { data, error } = await supabase
      .from("coach_metric_observations")
      .select("metric_value, recorded_at")
      .eq("app_id", appId)
      .eq("metric_key", metricKey);
    if (error) continue;
    const values = (data || [])
      .map((row) => Number(row.metric_value))
      .filter((value) => Number.isFinite(value));
    if (!values.length) {
      await supabase
        .from("coach_metric_norms")
        .delete()
        .eq("app_id", appId)
        .eq("metric_key", metricKey)
        .eq("cohort_key", "global_beta");
      continue;
    }
    const n = values.length;
    const mean = values.reduce((total, value) => total + value, 0) / n;
    const variance = n > 1
      ? values.reduce((total, value) => total + (value - mean) ** 2, 0) / (n - 1)
      : 0;
    const latest = (data || [])
      .map((row) => typeof row.recorded_at === "string" ? row.recorded_at : null)
      .filter((value): value is string => Boolean(value))
      .sort()
      .at(-1) ?? null;
    await supabase.from("coach_metric_norms").upsert(
      {
        app_id: appId,
        metric_key: metricKey,
        cohort_key: "global_beta",
        n,
        mean_value: mean,
        stddev_value: n > 1 ? Math.sqrt(variance) : null,
        min_value: Math.min(...values),
        max_value: Math.max(...values),
        last_observation_at: latest,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "app_id,metric_key,cohort_key" },
    );
  }
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (request.method !== "DELETE" && request.method !== "POST") return json(405, { error: "Method not allowed." });

  const user = await authenticatedUser(request);
  if (!user) return json(401, { error: "Authentication required." });
  const payload = await readPayload<{ confirm?: string }>(request);
  if (payload?.confirm !== "delete-wm-data") return json(400, { error: "Explicit confirmation required." });

  const supabase = serviceClient();
  const { data: metricRows } = await supabase
    .from("coach_metric_observations")
    .select("metric_key")
    .eq("user_id", user.id)
    .eq("app_id", "wm_coach");
  const metricKeys = Array.from(new Set((metricRows || []).map((row) => String(row.metric_key))));
  for (const table of [
    "coach_metric_observations",
    "wm_trials",
    "wm_blocks",
    "wm_capacity_estimates",
    "wm_trajectory_windows",
    "wm_phase_controller_events",
    "wm_transition_events",
    "wm_transfer_metrics",
    "wm_score_snapshots",
    "wm_device_checks",
    "wm_sessions",
    "wm_user_settings",
    "wm_adaptive_events",
    "wm_progress_state",
    "wm_proof_benchmarks",
  ]) {
    let query = supabase.from(table).delete().eq("user_id", user.id);
    if (table === "coach_metric_observations") query = query.eq("app_id", "wm_coach");
    const { error } = await query;
    if (error) return json(500, { error: error.message, table });
  }
  await refreshMetricNorms(supabase, "wm_coach", metricKeys);
  return json(200, { deleted: true });
});
