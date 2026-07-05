import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";

export function serviceClient() {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) throw new Error("Supabase service role is not configured.");
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });
}

export async function authenticatedUser(request: Request) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader) return null;
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (!supabaseUrl || !anonKey) throw new Error("Supabase auth is not configured.");
  const client = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false },
  });
  const { data, error } = await client.auth.getUser();
  if (error) return null;
  return data.user;
}
