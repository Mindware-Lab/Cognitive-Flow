import { CORS, json, readPayload } from "../_shared/http.ts";
import {
  CCC_APP_ID,
  authenticatedUser,
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
  if (!payload || payload.appId !== CCC_APP_ID || !["load", "save"].includes(stringValue(payload.action))) {
    return json(400, { error: "Invalid progress request." });
  }
  const supabase = serviceClient();
  if (payload.action === "load") {
    const { data, error } = await supabase
      .from("cognitive_control_progress")
      .select("state, updated_at")
      .eq("user_id", user.id)
      .maybeSingle();
    if (error) return json(500, { error: error.message });
    return json(200, { progress: data?.state ?? null, updatedAt: data?.updated_at ?? null });
  }

  const progress = objectValue(payload.progress);
  if (!Object.keys(progress).length || JSON.stringify(progress).length > 2_000_000) {
    return json(400, { error: "Progress payload is missing or too large." });
  }
  const plan = objectValue(progress.plan);
  const blocks = Array.isArray(plan.blocks) ? plan.blocks : [];
  const activeBlockIndex = Number(progress.activeBlockIndex) || 0;
  const activeBlock = objectValue(blocks[activeBlockIndex]);
  const { error } = await supabase.from("cognitive_control_progress").upsert({
    user_id: user.id,
    app_id: CCC_APP_ID,
    protocol_version: stringValue(plan.protocolVersion, "unknown"),
    config_version: stringValue(plan.configVersion, "unknown"),
    stage: stringValue(plan.stage, "P0"),
    step_id: stringValue(activeBlock.stepId, "p0_arrow_abs_stabilize"),
    progression_status: progress.completedAt ? "completed" : "active",
    shift_view_state: { completed: progress.shiftViewCompleted === true },
    state: progress,
    updated_at: new Date().toISOString(),
  }, { onConflict: "user_id" });
  if (error) return json(500, { error: error.message });
  return json(200, { saved: true });
});
