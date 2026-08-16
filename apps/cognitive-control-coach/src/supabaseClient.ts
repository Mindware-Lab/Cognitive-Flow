import { createClient } from "@supabase/supabase-js";
import { CCC_APP_ID } from "./cccConfig";
import type { ScratchBaseline } from "./types";
import type { DeviceReadiness } from "./types";
import type { LocalProgress, ProofBenchmarkEntry } from "./storage";
import type { CccProofDomain, CccProofScore, CccProofTimepoint } from "./cccTypes";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
export const isIqCoachCommerceEnabled = import.meta.env.VITE_IQ_COACH_COMMERCE_ENABLED === "true";
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

export type IqCoachEntitlement = {
  product_code: IqCoachEntitlementCode;
  status: "active" | "revoked";
  source: "stripe_checkout" | "beta" | "admin";
  granted_at: string;
  expires_at: string | null;
};

export type IqCoachEntitlementCode = "g_track" | "cognitive_control_coach";
export type IqCoachPurchaseProductCode = IqCoachEntitlementCode | "complete_cognitive_route";

export type GTrackHistoryResult = {
  id: string;
  testId: string;
  testVersion: string;
  attemptNumber: number;
  completedAt: string;
  summary: Record<string, unknown>;
  gTrackScore?: {
    construct?: string;
    timepoint?: string | null;
    testId?: string | null;
    provisionalIndex?: number | string | null;
    confidenceLabel?: string | null;
    normStatus?: string | null;
    publicScores?: Record<string, unknown> | null;
  } | null;
  issuedNorm: Record<string, { standardScore?: number | null; normStatus?: { label?: string; confidence?: string } } | undefined> | null;
  latestNorm: Record<string, { standardScore?: number | null; normStatus?: { label?: string; confidence?: string } } | undefined> | null;
  normPool: string;
  completionQuality: string;
};

export type GTrackProofScore = NonNullable<GTrackHistoryResult["gTrackScore"]> & {
  completedAt?: string | null;
  score?: number | string | null;
  standardScore?: number | string | null;
  displayStandardScore?: number | string | null;
  raw?: number | string | null;
  maxRaw?: number | string | null;
  standardError?: number | string | null;
  metrics?: Record<string, number | null> | null;
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

export async function verifyEmailSignInCode(email: string, token: string): Promise<AuthUser | null> {
  if (!supabase) throw new Error("Supabase is not configured.");
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: "email",
  });
  if (error) throw new Error(error.message);
  return data.user ? { id: data.user.id, email: data.user.email || undefined } : null;
}

export async function signOutUser(): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(error.message);
}

export async function createIqCoachCheckoutSession(productCode: IqCoachPurchaseProductCode): Promise<string> {
  if (!supabase) throw new Error("Checkout is unavailable because Supabase is not configured.");
  const { data, error } = await supabase.functions.invoke("create-iq-coach-checkout-session", {
    body: { productCode },
  });
  if (error) throw new Error(await functionErrorMessage(error));
  const urlValue = data && typeof data === "object" ? (data as { url?: unknown }).url : null;
  if (typeof urlValue !== "string") throw new Error("Stripe Checkout did not return a payment URL.");
  const checkoutUrl = new URL(urlValue);
  if (checkoutUrl.protocol !== "https:" || checkoutUrl.hostname !== "checkout.stripe.com") {
    throw new Error("Stripe Checkout returned an invalid payment URL.");
  }
  return checkoutUrl.toString();
}

export async function claimIqCoachAccess(): Promise<boolean> {
  if (!supabase) return false;
  const { data, error } = await supabase.rpc("claim_my_iq_coach_access");
  if (error) throw new Error(error.message);
  return data === true;
}

export async function loadIqCoachAccess(productCode: IqCoachEntitlementCode): Promise<IqCoachEntitlement | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("user_entitlements")
    .select("product_code,status,source,granted_at,expires_at")
    .eq("product_code", productCode)
    .eq("status", "active")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  if (data.expires_at && Date.parse(data.expires_at) <= Date.now()) return null;
  return data as IqCoachEntitlement;
}

export async function resolveIqCoachAccess(productCode: IqCoachEntitlementCode): Promise<IqCoachEntitlement | null> {
  if (!supabase) return null;
  await claimIqCoachAccess();
  return loadIqCoachAccess(productCode);
}

export async function submitCoachBlock(payload: Record<string, unknown>): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.functions.invoke("submit-coach-block", { body: { ...payload, appId: CCC_APP_ID } });
  if (error) throw new Error(await functionErrorMessage(error));
}

export async function finalizeCoachSession(payload: Record<string, unknown>): Promise<unknown> {
  if (!supabase) return null;
  const { data, error } = await supabase.functions.invoke("finalize-coach-session", { body: { ...payload, appId: CCC_APP_ID } });
  if (error) throw new Error(await functionErrorMessage(error));
  return data;
}

export async function fetchCoachScratchBaselines(payload: Record<string, unknown>): Promise<ScratchBaseline[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.functions.invoke("get-coach-scratch-baselines", { body: { ...payload, appId: CCC_APP_ID } });
  if (error) throw new Error(await functionErrorMessage(error));
  return Array.isArray(data) ? (data as ScratchBaseline[]) : [];
}

export async function loadRemoteProgress(): Promise<LocalProgress | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.functions.invoke("sync-coach-progress", {
    body: { action: "load", appId: CCC_APP_ID },
  });
  if (error) throw new Error(await functionErrorMessage(error));
  return data?.progress ?? null;
}

export async function saveRemoteProgress(progress: LocalProgress): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.functions.invoke("sync-coach-progress", {
    body: { action: "save", appId: CCC_APP_ID, progress },
  });
  if (error) throw new Error(await functionErrorMessage(error));
}

export async function loadCccRemoteProgress(): Promise<Record<string, unknown> | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.functions.invoke("sync-coach-progress", {
    body: { action: "load", appId: CCC_APP_ID },
  });
  if (error) throw new Error(await functionErrorMessage(error));
  return data?.progress && typeof data.progress === "object" ? data.progress as Record<string, unknown> : null;
}

export async function saveCccRemoteProgress(progress: Record<string, unknown>): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.functions.invoke("sync-coach-progress", {
    body: { action: "save", appId: CCC_APP_ID, progress },
  });
  if (error) throw new Error(await functionErrorMessage(error));
}

export async function recordDeviceCheck(readiness: DeviceReadiness): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.functions.invoke("record-coach-device-check", { body: { appId: CCC_APP_ID, readiness } });
  if (error) throw new Error(await functionErrorMessage(error));
}

export async function saveProofBenchmark(entry: ProofBenchmarkEntry): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.functions.invoke("sync-proof-benchmark", {
    body: { action: "upsert", appId: CCC_APP_ID, entry },
  });
  if (error) throw new Error(await functionErrorMessage(error));
}

export async function deleteProofBenchmark(id: string): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.functions.invoke("sync-proof-benchmark", {
    body: { action: "delete", appId: CCC_APP_ID, id },
  });
  if (error) throw new Error(await functionErrorMessage(error));
}

export async function exportCoachData(): Promise<Record<string, unknown>> {
  if (!supabase) throw new Error("Supabase is not configured.");
  const { data, error } = await supabase.functions.invoke("export-coach-data", {
    body: { appId: CCC_APP_ID },
  });
  if (error) throw new Error(await functionErrorMessage(error));
  return (data && typeof data === "object" ? data : {}) as Record<string, unknown>;
}

export async function deleteCoachData(): Promise<void> {
  if (!supabase) throw new Error("Supabase is not configured.");
  const { error } = await supabase.functions.invoke("delete-coach-data", {
    body: { appId: CCC_APP_ID, confirm: "delete-coach-data" },
  });
  if (error) throw new Error(await functionErrorMessage(error));
}

export async function loadStandardizedScores(appId: "attention_coach" | "wm_coach" | "cognitive_control_coach"): Promise<StandardizedScoreRow[]> {
  if (!supabase) return [];
  if (appId === "attention_coach") {
    const exportData = await exportCoachData();
    const rows = Array.isArray(exportData.standardizedScores) ? exportData.standardizedScores : [];
    return rows
      .map((row) => row && typeof row === "object" ? row as Record<string, unknown> : null)
      .filter((row): row is Record<string, unknown> => Boolean(row))
      .map((row) => ({
        metric_key: String(row.metric_key || ""),
        standard_score: finiteNumberOrNull(row.standard_score),
        z_score: finiteNumberOrNull(row.z_score),
        norm_n: finiteNumberOrNull(row.norm_n),
        session_number: finiteNumberOrNull(row.session_number),
        recorded_at: typeof row.recorded_at === "string" ? row.recorded_at : null,
      }))
      .filter((row) => row.metric_key);
  }
  const { data, error } = await supabase
    .from("coach_metric_standardized_scores")
    .select("metric_key,standard_score,z_score,norm_n,session_number,recorded_at")
    .eq("app_id", appId)
    .order("recorded_at", { ascending: false })
    .limit(200);
  if (error) throw new Error(error.message);
  return (data || []) as StandardizedScoreRow[];
}

function finiteNumberOrNull(value: unknown): number | null {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

export async function loadGTrackHistory(): Promise<GTrackHistoryResult[]> {
  if (!supabase) return [];
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) return [];
  const response = await fetch("/api/cpt/history", {
    headers: { Authorization: `Bearer ${token}` },
    credentials: "same-origin",
  });
  if (!response.ok) return [];
  const payload = await response.json() as { results?: GTrackHistoryResult[] };
  return Array.isArray(payload.results) ? payload.results : [];
}

export async function loadGTrackProofSummary(): Promise<GTrackProofScore[]> {
  if (!supabase) return [];
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) return [];
  const response = await fetch("/api/gtrack/proof-summary", {
    headers: { Authorization: `Bearer ${token}` },
    credentials: "same-origin",
  });
  if (!response.ok) return [];
  const payload = await response.json() as { scores?: GTrackProofScore[] };
  return Array.isArray(payload.scores) ? payload.scores : [];
}

function finiteStandardScore(value: unknown): number | null {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) && numberValue >= 55 && numberValue <= 145 ? numberValue : null;
}

function publicStandardScore(publicScores: Record<string, unknown> | null | undefined, key: string): number | null {
  const value = publicScores?.[key];
  if (!value || typeof value !== "object") return null;
  const row = value as { displayStandardScore?: unknown; standardScore?: unknown };
  return finiteStandardScore(row.displayStandardScore) ?? finiteStandardScore(row.standardScore);
}

function proofDomain(construct: string | undefined): CccProofDomain | null {
  if (construct === "attention_control") return "attention";
  if (construct === "working_memory") return "working_memory";
  if (construct === "matrix_reasoning") return "reasoning";
  return null;
}

function proofTimepoint(value: string | null | undefined): CccProofTimepoint {
  return value === "baseline" || value === "midpoint" || value === "post" || value === "follow_up" ? value : "ad_hoc";
}

function proofScoreValue(score: GTrackProofScore): number | null {
  const direct = finiteStandardScore(score.provisionalIndex)
    ?? finiteStandardScore(score.displayStandardScore)
    ?? finiteStandardScore(score.standardScore)
    ?? finiteStandardScore(score.score);
  if (direct !== null) return direct;
  const composite = publicStandardScore(score.publicScores, "composite");
  if (composite !== null) return composite;
  const keys = score.construct === "attention_control"
    ? ["conflictControl", "sustainedStability", "responseEfficiency"]
    : score.construct === "working_memory" ? ["workingMemoryCapacity", "bindingPrecision"] : [];
  const values = keys.map((key) => publicStandardScore(score.publicScores, key)).filter((value): value is number => value !== null);
  return values.length ? values.reduce((total, value) => total + value, 0) / values.length : null;
}

function proofLabel(domain: CccProofDomain): string {
  if (domain === "attention") return "G Track Attention";
  if (domain === "working_memory") return "G Track Working Memory";
  return "G Track Matrix Reasoning";
}

export async function loadCccGTrackScores(): Promise<CccProofScore[]> {
  const scores = await loadGTrackProofSummary();
  return scores.flatMap((score) => {
    const domain = proofDomain(score.construct);
    const value = proofScoreValue(score);
    if (!domain || value === null) return [];
    const completedAt = String(score.completedAt || new Date().toISOString()).slice(0, 10);
    const timepoint = proofTimepoint(score.timepoint);
    return [{
      id: `gtrack-${domain}-${score.testId || "score"}-${timepoint}-${completedAt}`,
      domain,
      timepoint,
      label: proofLabel(domain),
      score: Math.round(value),
      completedAt,
      source: "G Track" as const,
    }];
  });
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
