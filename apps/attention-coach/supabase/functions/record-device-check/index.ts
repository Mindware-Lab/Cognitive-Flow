import { authenticatedUser, serviceClient } from "../_shared/supabase.ts";
import { CORS, json, readPayload } from "../_shared/http.ts";

interface DeviceCheckPayload {
  refreshRateHz: number;
  medianFrameMs: number;
  frameMadMs: number;
  droppedFrameRate: number;
  inputLatencyMs: number | null;
  arrowRenderOk: boolean;
  flowRenderOk: boolean;
  quality: "good" | "acceptable" | "poor";
  flowEligible: boolean;
  sampledFrames: number;
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (request.method !== "POST") return json(405, { error: "Method not allowed." });

  const user = await authenticatedUser(request);
  if (!user) return json(401, { error: "Authentication required." });

  const payload = await readPayload<DeviceCheckPayload>(request);
  if (!payload || typeof payload.refreshRateHz !== "number" || !payload.quality) {
    return json(400, { error: "Invalid device check payload." });
  }

  const supabase = serviceClient();
  const { error } = await supabase.from("attention_device_checks").insert({
    user_id: user.id,
    refresh_rate_hz: payload.refreshRateHz,
    median_frame_ms: payload.medianFrameMs,
    frame_mad_ms: payload.frameMadMs,
    dropped_frame_rate: payload.droppedFrameRate,
    input_latency_ms: payload.inputLatencyMs,
    arrow_render_ok: payload.arrowRenderOk,
    flow_render_ok: payload.flowRenderOk,
    timing_quality: payload.quality,
    flow_eligible: payload.flowEligible,
    sampled_frames: payload.sampledFrames,
  });
  if (error) return json(500, { error: error.message });

  return json(200, { recorded: true });
});
