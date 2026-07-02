import { authenticatedUser, serviceClient } from "../_shared/supabase.ts";
import { CORS, json } from "../_shared/http.ts";

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (request.method !== "GET" && request.method !== "POST") return json(405, { error: "Method not allowed." });

  const user = await authenticatedUser(request);
  if (!user) return json(401, { error: "Authentication required." });
  const supabase = serviceClient();
  const [sessions, trials, snapshots, transitions, progressState, proofBenchmarks, deviceChecks] = await Promise.all([
    supabase.from("attention_sessions").select("*").eq("user_id", user.id),
    supabase.from("attention_trials").select("*").eq("user_id", user.id),
    supabase.from("attention_score_snapshots").select("*").eq("user_id", user.id),
    supabase.from("attention_transition_events").select("*").eq("user_id", user.id),
    supabase.from("attention_progress_state").select("*").eq("user_id", user.id),
    supabase.from("attention_proof_benchmarks").select("*").eq("user_id", user.id),
    supabase.from("attention_device_checks").select("*").eq("user_id", user.id),
  ]);
  return json(200, {
    exportedAt: new Date().toISOString(),
    sessions: sessions.data || [],
    trials: trials.data || [],
    snapshots: snapshots.data || [],
    transitions: transitions.data || [],
    progressState: progressState.data || [],
    proofBenchmarks: proofBenchmarks.data || [],
    deviceChecks: deviceChecks.data || [],
  });
});
