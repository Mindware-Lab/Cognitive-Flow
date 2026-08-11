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
  const { data, error } = await supabase
    .from("coach_sessions")
    .update({
      status: "completed",
      completed_at: completedAt,
      summary: objectValue(payload.summary),
    })
    .eq("user_id", user.id)
    .eq("app_id", CCC_APP_ID)
    .eq("client_session_id", stringValue(payload.clientSessionId))
    .select("id")
    .maybeSingle();
  if (error) return json(500, { error: error.message });
  if (!data) return json(404, { error: "Session not found. Complete at least one saved stage before finalising." });

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
