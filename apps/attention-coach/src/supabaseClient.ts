import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: { flowType: "pkce", persistSession: true, autoRefreshToken: true },
    })
  : null;

export async function submitAttentionBlock(payload: Record<string, unknown>): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.functions.invoke("submit-attention-block", { body: payload });
  if (error) throw new Error(error.message);
}

export async function finalizeAttentionSession(payload: Record<string, unknown>): Promise<unknown> {
  if (!supabase) return null;
  const { data, error } = await supabase.functions.invoke("finalize-attention-session", { body: payload });
  if (error) throw new Error(error.message);
  return data;
}
