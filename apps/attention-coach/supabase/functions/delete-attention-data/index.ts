import { authenticatedUser, serviceClient } from "../_shared/supabase.ts";
import { CORS, json, readPayload } from "../_shared/http.ts";

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (request.method !== "DELETE" && request.method !== "POST") return json(405, { error: "Method not allowed." });

  const user = await authenticatedUser(request);
  if (!user) return json(401, { error: "Authentication required." });
  const payload = await readPayload<{ confirm?: string }>(request);
  if (payload?.confirm !== "delete-attention-data") return json(400, { error: "Explicit confirmation required." });

  const supabase = serviceClient();
  for (const table of [
    "attention_trials",
    "attention_blocks",
    "attention_capacity_estimates",
    "attention_trajectory_windows",
    "attention_phase_controller_events",
    "attention_transition_events",
    "attention_transfer_metrics",
    "attention_score_snapshots",
    "attention_device_checks",
    "attention_sessions",
    "attention_user_settings",
    "attention_adaptive_events",
  ]) {
    const { error } = await supabase.from(table).delete().eq("user_id", user.id);
    if (error) return json(500, { error: error.message, table });
  }
  return json(200, { deleted: true });
});
