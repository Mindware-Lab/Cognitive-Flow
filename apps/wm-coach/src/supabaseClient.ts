import { createClient } from "@supabase/supabase-js";
import type { ScratchBaseline } from "./types";
import type { DeviceReadiness } from "./types";
import type { LocalProgress, ProofBenchmarkEntry } from "./storage";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: { flowType: "pkce", persistSession: true, autoRefreshToken: true },
    })
  : null;

export type AuthUser = {
  id: string;
  email?: string;
};

export type StandardizedScoreRow = {
  metric_key: string;
  standard_score: number | null;
  z_score: number | null;
  norm_n: number | null;
  session_number: number | null;
  recorded_at: string | null;
};

export async function currentAuthUser(): Promise<AuthUser | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return { id: data.user.id, email: data.user.email || undefined };
}

export function onAuthChange(callback: (user: AuthUser | null) => void): { unsubscribe: () => void } | null {
  if (!supabase) return null;
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user ? { id: session.user.id, email: session.user.email || undefined } : null);
  });
  return { unsubscribe: () => data.subscription.unsubscribe() };
}

export async function sendEmailSignInLink(email: string): Promise<void> {
  if (!supabase) throw new Error("Supabase is not configured.");
  const redirectTo = `${window.location.origin}${window.location.pathname}`;
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: redirectTo },
  });
  if (error) throw new Error(error.message);
}

export async function signOutUser(): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(error.message);
}

export async function submitWorkingMemoryBlock(payload: Record<string, unknown>): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.functions.invoke("submit-wm-block", { body: payload });
  if (error) throw new Error(await functionErrorMessage(error));
}

export async function finalizeWorkingMemorySession(payload: Record<string, unknown>): Promise<unknown> {
  if (!supabase) return null;
  const { data, error } = await supabase.functions.invoke("finalize-wm-session", { body: payload });
  if (error) throw new Error(await functionErrorMessage(error));
  return data;
}

export async function fetchWorkingMemoryScratchBaselines(payload: Record<string, unknown>): Promise<ScratchBaseline[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.functions.invoke("get-wm-scratch-baselines", { body: payload });
  if (error) throw new Error(await functionErrorMessage(error));
  return Array.isArray(data) ? (data as ScratchBaseline[]) : [];
}

export async function loadRemoteProgress(): Promise<LocalProgress | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.functions.invoke("sync-wm-progress", {
    body: { action: "load" },
  });
  if (error) throw new Error(await functionErrorMessage(error));
  return data?.progress ?? null;
}

export async function saveRemoteProgress(progress: LocalProgress): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.functions.invoke("sync-wm-progress", {
    body: { action: "save", progress },
  });
  if (error) throw new Error(await functionErrorMessage(error));
}

export async function recordDeviceCheck(readiness: DeviceReadiness): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.functions.invoke("record-wm-device-check", { body: readiness });
  if (error) throw new Error(await functionErrorMessage(error));
}

export async function saveProofBenchmark(entry: ProofBenchmarkEntry): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.functions.invoke("sync-wm-proof-benchmark", {
    body: { action: "upsert", entry },
  });
  if (error) throw new Error(await functionErrorMessage(error));
}

export async function deleteProofBenchmark(id: string): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.functions.invoke("sync-wm-proof-benchmark", {
    body: { action: "delete", id },
  });
  if (error) throw new Error(await functionErrorMessage(error));
}

export async function exportWorkingMemoryData(): Promise<Record<string, unknown>> {
  if (!supabase) throw new Error("Supabase is not configured.");
  const { data, error } = await supabase.functions.invoke("export-wm-data", {
    method: "GET",
  });
  if (error) throw new Error(await functionErrorMessage(error));
  return (data && typeof data === "object" ? data : {}) as Record<string, unknown>;
}

export async function deleteWorkingMemoryData(): Promise<void> {
  if (!supabase) throw new Error("Supabase is not configured.");
  const { error } = await supabase.functions.invoke("delete-wm-data", {
    body: { confirm: "delete-wm-data" },
  });
  if (error) throw new Error(await functionErrorMessage(error));
}

export async function loadStandardizedScores(appId: "attention_coach" | "wm_coach"): Promise<StandardizedScoreRow[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("coach_metric_standardized_scores")
    .select("metric_key,standard_score,z_score,norm_n,session_number,recorded_at")
    .eq("app_id", appId)
    .order("recorded_at", { ascending: false })
    .limit(200);
  if (error) throw new Error(error.message);
  return (data || []) as StandardizedScoreRow[];
}

async function functionErrorMessage(error: unknown): Promise<string> {
  const fallback = error instanceof Error ? error.message : "Supabase request failed.";
  const context = error && typeof error === "object" && "context" in error
    ? (error as { context?: Response }).context
    : null;
  if (!context || typeof context.clone !== "function") return fallback;
  try {
    const body = await context.clone().json() as { error?: unknown; message?: unknown };
    const detail = typeof body.error === "string" ? body.error : typeof body.message === "string" ? body.message : "";
    return detail || fallback;
  } catch {
    try {
      const text = await context.clone().text();
      return text || fallback;
    } catch {
      return fallback;
    }
  }
}

