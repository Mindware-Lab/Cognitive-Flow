import { authenticatedUser, serviceClient } from "../_shared/supabase.ts";
import { CORS, json, readPayload } from "../_shared/http.ts";

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (request.method !== "DELETE" && request.method !== "POST") return json(405, { error: "Method not allowed." });

  const user = await authenticatedUser(request);
  if (!user) return json(401, { error: "Authentication required." });
  const payload = await readPayload<{ confirm?: string }>(request);
  if (payload?.confirm !== "delete-wm-data") return json(400, { error: "Explicit confirmation required." });

  const supabase = serviceClient();
  for (const table of [
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
    const { error } = await supabase.from(table).delete().eq("user_id", user.id);
    if (error) return json(500, { error: error.message, table });
  }
  return json(200, { deleted: true });
});
