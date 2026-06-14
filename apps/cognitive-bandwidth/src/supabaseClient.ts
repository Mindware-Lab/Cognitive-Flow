import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: { flowType: "pkce", persistSession: true, autoRefreshToken: true },
    })
  : null;

export async function sendMagicLink(email: string): Promise<void> {
  if (!supabase) throw new Error("Email sign-in is not configured for this preview.");
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${window.location.origin}${window.location.pathname}`,
      shouldCreateUser: true,
    },
  });
  if (error) throw error;
}

export interface PartnerFeedbackPayload {
  runId: string;
  prototypeVersion: string;
  audience: string;
  clarity: number;
  credibility: number;
  fit: string;
  evidence: string;
  interest: string;
  email: string;
  timingQuality: string;
  directionBps: number;
  frameBps: number;
  frameCostBps: number;
  website: string;
}

export async function submitPartnerFeedback(payload: PartnerFeedbackPayload): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase.functions.invoke("partner-feedback", { body: payload });
  if (error) throw new Error(error.message);
  return true;
}
