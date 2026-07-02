import { authenticatedUser, serviceClient } from "../_shared/supabase.ts";
import { CORS, json, readPayload } from "../_shared/http.ts";

interface ProofBenchmarkEntry {
  id: string;
  domain: "attention" | "working_memory" | "reasoning";
  timepoint: "baseline" | "midpoint" | "post" | "follow_up" | "ad_hoc";
  label: string;
  score: number | null;
  confidence: string;
  source: string;
  completedAt: string;
  notes: string;
}

interface SyncProofPayload {
  action: "upsert" | "delete";
  entry?: ProofBenchmarkEntry;
  id?: string;
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (request.method !== "POST") return json(405, { error: "Method not allowed." });

  const user = await authenticatedUser(request);
  if (!user) return json(401, { error: "Authentication required." });

  const payload = await readPayload<SyncProofPayload>(request);
  const supabase = serviceClient();

  if (payload?.action === "delete") {
    if (!payload.id) return json(400, { error: "Benchmark id is required." });
    const { error } = await supabase
      .from("attention_proof_benchmarks")
      .delete()
      .eq("user_id", user.id)
      .eq("id", payload.id);
    if (error) return json(500, { error: error.message });
    return json(200, { deleted: true });
  }

  if (payload?.action !== "upsert" || !payload.entry?.id) {
    return json(400, { error: "Invalid benchmark sync action." });
  }

  const entry = payload.entry;
  const { error } = await supabase.from("attention_proof_benchmarks").upsert(
    {
      id: entry.id,
      user_id: user.id,
      domain: entry.domain,
      timepoint: entry.timepoint,
      label: entry.label,
      score: entry.score,
      confidence: entry.confidence,
      source: entry.source,
      completed_at: entry.completedAt || null,
      notes: entry.notes,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,id" },
  );
  if (error) return json(500, { error: error.message });

  return json(200, { saved: true });
});
