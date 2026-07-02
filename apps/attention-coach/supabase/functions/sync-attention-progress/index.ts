import { authenticatedUser, serviceClient } from "../_shared/supabase.ts";
import { CORS, json, readPayload } from "../_shared/http.ts";

interface SyncProgressPayload {
  action: "load" | "save";
  progress?: Record<string, unknown>;
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (request.method !== "POST") return json(405, { error: "Method not allowed." });

  const user = await authenticatedUser(request);
  if (!user) return json(401, { error: "Authentication required." });

  const payload = await readPayload<SyncProgressPayload>(request);
  if (payload?.action !== "load" && payload?.action !== "save") {
    return json(400, { error: "Invalid progress sync action." });
  }

  const supabase = serviceClient();

  if (payload.action === "load") {
    const { data, error } = await supabase
      .from("attention_progress_state")
      .select("progress, updated_at")
      .eq("user_id", user.id)
      .maybeSingle();
    if (error) return json(500, { error: error.message });
    return json(200, { progress: data?.progress ?? null, updatedAt: data?.updated_at ?? null });
  }

  if (!payload.progress || typeof payload.progress !== "object") {
    return json(400, { error: "Progress payload is required." });
  }

  const { error } = await supabase.from("attention_progress_state").upsert(
    {
      user_id: user.id,
      progress: payload.progress,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );
  if (error) return json(500, { error: error.message });

  return json(200, { saved: true });
});
