import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const INTERESTS = new Set([
  "Discuss a pilot",
  "Discuss an affiliate relationship",
  "Discuss research collaboration",
  "Possibly, after further validation",
  "Not currently",
]);

interface FeedbackPayload {
  runId: string;
  prototypeVersion?: string;
  fit?: string;
  evidence?: string;
  interest: string;
  email?: string;
  timingQuality?: string;
  directionBps?: number;
  frameBps?: number;
  frameCostBps?: number;
  website?: string;
}

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

function cleanText(value: unknown, maximum: number): string | null {
  if (typeof value !== "string") return null;
  const cleaned = value.trim();
  return cleaned ? cleaned.slice(0, maximum) : null;
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (request.method !== "POST") return json(405, { error: "Method not allowed." });

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) return json(500, { error: "Feedback storage is not configured." });

  let payload: FeedbackPayload;
  try {
    payload = await request.json();
  } catch {
    return json(400, { error: "Malformed feedback payload." });
  }

  // Honeypot field for low-cost bot rejection.
  if (payload.website) return json(200, { accepted: true });
  if (typeof payload.runId !== "string" || !/^[a-f0-9]{16,128}$/i.test(payload.runId)) {
    return json(400, { error: "Invalid run identifier." });
  }
  if (!INTERESTS.has(payload.interest)) return json(400, { error: "Invalid interest selection." });

  const email = cleanText(payload.email, 320);
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json(400, { error: "Invalid contact email." });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });
  const { error } = await supabase.from("cognitive_bandwidth_partner_feedback").insert({
    run_id: payload.runId,
    prototype_version: cleanText(payload.prototypeVersion, 80) || "partner-prototype-v1",
    fit: cleanText(payload.fit, 2000),
    evidence_needed: cleanText(payload.evidence, 2000),
    interest: payload.interest,
    contact_email: email,
    timing_quality: ["Good", "Acceptable", "Limited"].includes(payload.timingQuality || "")
      ? payload.timingQuality
      : null,
    direction_bps:
      typeof payload.directionBps === "number" && Number.isFinite(payload.directionBps)
        ? payload.directionBps
        : null,
    frame_bps:
      typeof payload.frameBps === "number" && Number.isFinite(payload.frameBps)
        ? payload.frameBps
        : null,
    frame_cost_bps:
      typeof payload.frameCostBps === "number" && Number.isFinite(payload.frameCostBps)
        ? payload.frameCostBps
        : null,
    user_agent: cleanText(request.headers.get("User-Agent"), 500),
  });
  if (error) return json(500, { error: "Feedback could not be stored." });
  return json(200, { accepted: true });
});
