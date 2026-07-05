import { authenticatedUser } from "../_shared/supabase.ts";
import { CORS, json } from "../_shared/http.ts";

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (request.method !== "POST") return json(405, { error: "Method not allowed." });

  const user = await authenticatedUser(request);
  if (!user) return json(401, { error: "Authentication required." });

  // V1 beta has no cohort calibration table yet. Return an empty set so the
  // app can continue with within-user evidence until research norms are added.
  return json(200, []);
});
