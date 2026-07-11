import { authenticatedUser, serviceClient } from "../_shared/supabase.ts";
import { CORS, json, readPayload } from "../_shared/http.ts";

interface FinalizePayload {
  clientSessionId: string;
  programmeRunId?: string;
  programmeCycle?: number;
  dataMode?: "local" | "cloud_personal" | "cloud_benchmark";
  benchmarkConsent?: boolean;
  snapshot: Record<string, unknown>;
  scoringVersion: string;
  controllerEvent?: Record<string, unknown>;
}

function objectPayload(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function isMissingProgrammeColumn(error: { code?: string; message?: string } | null): boolean {
  return Boolean(
    error &&
      (error.code === "42703" ||
        error.message?.includes("programme_run_id") ||
        error.message?.includes("programme_cycle")),
  );
}

type MetricRow = {
  metricKey: string;
  metricGroup: string;
  metricUnit: string | null;
  metricValue: number;
  metricContext?: Record<string, unknown>;
};

function finiteNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function nestedNumber(source: Record<string, unknown>, path: string[]): number | null {
  let value: unknown = source;
  for (const key of path) {
    if (!value || typeof value !== "object" || Array.isArray(value)) return null;
    value = (value as Record<string, unknown>)[key];
  }
  return finiteNumber(value);
}

function pushMetric(
  rows: MetricRow[],
  metricKey: string,
  metricGroup: string,
  metricUnit: string | null,
  metricValue: unknown,
  metricContext: Record<string, unknown> = {},
): void {
  const value = finiteNumber(metricValue);
  if (value === null) return;
  rows.push({ metricKey, metricGroup, metricUnit, metricValue: value, metricContext });
}

function metricRowsFromSnapshot(snapshot: Record<string, unknown>): MetricRow[] {
  const rows: MetricRow[] = [];
  const control = objectPayload(snapshot.workingMemoryControl);
  const binding = objectPayload(snapshot.bindingFocus);
  const transfer = objectPayload(snapshot.transfer);
  const transferMetrics = objectPayload(snapshot.transferMetrics);

  pushMetric(rows, "control.bits_per_sec", "control", "bps", control.bitsPerSec);
  pushMetric(rows, "control.training_score", "control", "score", control.trainingScore);
  pushMetric(rows, "control.n_level", "control", "n_level", control.nLevel);
  pushMetric(rows, "control.stable_n_level", "control", "n_level", control.stableNLevel);
  pushMetric(rows, "control.peak_n_level", "control", "n_level", control.peakNLevel);
  pushMetric(rows, "binding.bits_per_sec", "binding", "bps", binding.bitsPerSec);
  pushMetric(rows, "binding.training_score", "binding", "score", binding.trainingScore);
  pushMetric(rows, "binding.n_level", "binding", "n_level", binding.nLevel);
  pushMetric(rows, "transfer.score", "transfer", "score", transfer.score, { status: transfer.status ?? null });
  pushMetric(rows, "transfer.motion_recovery", "transfer", "score", nestedNumber(transfer, ["motionRecovery", "score"]));
  pushMetric(rows, "transfer.relation_recovery", "transfer", "score", nestedNumber(transfer, ["relationRecovery", "score"]));
  pushMetric(rows, "transfer.mixed_flexibility", "transfer", "score", nestedNumber(transfer, ["mixedFlexibility", "score"]));
  pushMetric(rows, "transfer.return_strength", "transfer", "score", nestedNumber(transfer, ["returnStrength", "score"]));
  pushMetric(rows, "transfer.initial_dip", "transfer_protocol", "ratio", transferMetrics.initialDip);
  pushMetric(rows, "transfer.recovery_slope", "transfer_protocol", "slope", transferMetrics.recoverySlope);
  pushMetric(rows, "transfer.recovery_ratio", "transfer_protocol", "ratio", transferMetrics.recoveryRatio);
  pushMetric(rows, "transfer.return_strength_protocol", "transfer_protocol", "ratio", transferMetrics.returnStrength);
  pushMetric(rows, "transfer.mixed_wrapper_stability", "transfer_protocol", "ratio", transferMetrics.mixedWrapperStability);
  pushMetric(rows, "transfer.compositional_transfer", "transfer_protocol", "ratio", transferMetrics.compositionalTransfer);
  pushMetric(rows, "transfer.delayed_recovery", "transfer_protocol", "ratio", transferMetrics.delayedRecovery);
  pushMetric(rows, "transfer.late_cue_cost", "transfer_protocol", "ratio", transferMetrics.lateCueCost);
  pushMetric(rows, "transfer.early_cue_reinstatement", "transfer_protocol", "ratio", transferMetrics.earlyCueReinstatement);

  const farTransfer = objectPayload(snapshot.farTransfer);
  const boundarySignals = Array.isArray(farTransfer.boundarySignals) ? farTransfer.boundarySignals : [];
  for (const signalValue of boundarySignals) {
    const signal = objectPayload(signalValue);
    const boundary = typeof signal.boundary === "string" ? signal.boundary.toLowerCase() : "unknown";
    const context = {
      boundary: signal.boundary ?? null,
      status: signal.status ?? null,
      sourceCell: signal.sourceCell ?? null,
      targetCell: signal.targetCell ?? null,
    };
    pushMetric(rows, `transfer.boundary.${boundary}.functional_score`, "transfer_boundary", "score", signal.functionalTransferScore, context);
    pushMetric(rows, `transfer.boundary.${boundary}.efficiency`, "transfer_boundary", "ratio", signal.transferEfficiency, context);
    pushMetric(rows, `transfer.boundary.${boundary}.stability_advantage`, "transfer_boundary", "ratio", signal.stabilityAdvantage, context);
    pushMetric(rows, `transfer.boundary.${boundary}.recovery_ratio`, "transfer_boundary", "ratio", signal.recoveryRatio, context);
  }

  return rows;
}

async function upsertMetricNorm(
  supabase: ReturnType<typeof serviceClient>,
  appId: "attention_coach" | "wm_coach",
  metricKey: string,
  cohortKey: string,
  protocolGroup?: string | null,
): Promise<void> {
  let query = supabase
    .from("coach_metric_observations")
    .select("metric_value, recorded_at")
    .eq("app_id", appId)
    .eq("metric_key", metricKey);
  if (protocolGroup) query = query.eq("protocol_group", protocolGroup);
  const { data, error } = await query;
  if (error || !data?.length) return;
  const values = data
    .map((row) => Number(row.metric_value))
    .filter((value) => Number.isFinite(value));
  if (!values.length) return;
  const n = values.length;
  const mean = values.reduce((total, value) => total + value, 0) / n;
  const variance = n > 1
    ? values.reduce((total, value) => total + (value - mean) ** 2, 0) / (n - 1)
    : 0;
  const latest = data
    .map((row) => typeof row.recorded_at === "string" ? row.recorded_at : null)
    .filter((value): value is string => Boolean(value))
    .sort()
    .at(-1) ?? null;
  await supabase.from("coach_metric_norms").upsert(
    {
      app_id: appId,
      metric_key: metricKey,
      cohort_key: cohortKey,
      n,
      mean_value: mean,
      stddev_value: n > 1 ? Math.sqrt(variance) : null,
      min_value: Math.min(...values),
      max_value: Math.max(...values),
      last_observation_at: latest,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "app_id,metric_key,cohort_key" },
  );
}

async function updateMetricNorms(
  supabase: ReturnType<typeof serviceClient>,
  appId: "attention_coach" | "wm_coach",
  metricKeys: string[],
  protocolGroup: string | null,
): Promise<void> {
  for (const metricKey of metricKeys) {
    await upsertMetricNorm(supabase, appId, metricKey, "global_beta");
    if (protocolGroup) {
      await upsertMetricNorm(supabase, appId, metricKey, `protocol:${protocolGroup}`, protocolGroup);
    }
  }
}

async function recordCoachMetrics(input: {
  supabase: ReturnType<typeof serviceClient>;
  appId: "attention_coach" | "wm_coach";
  userId: string;
  sessionId: string;
  payload: FinalizePayload;
  sessionNumber: number;
  phaseLabel: string;
  phaseStatus: string;
  snapshot: Record<string, unknown>;
}): Promise<void> {
  const metrics = metricRowsFromSnapshot(input.snapshot);
  if (!metrics.length) return;
  const controllerEvent = objectPayload(input.payload.controllerEvent);
  const rows = metrics.map((metric) => ({
    app_id: input.appId,
    user_id: input.userId,
    client_session_id: input.payload.clientSessionId,
    source_session_id: input.sessionId,
    programme_run_id: input.payload.programmeRunId || null,
    programme_cycle: input.payload.programmeCycle || 1,
    session_number: input.sessionNumber,
    phase_label: input.phaseLabel,
    phase_status: input.phaseStatus,
    protocol_group: typeof controllerEvent.protocolGroup === "string" ? controllerEvent.protocolGroup : null,
    device_quality: typeof controllerEvent.deviceQuality === "string" ? controllerEvent.deviceQuality : null,
    metric_key: metric.metricKey,
    metric_group: metric.metricGroup,
    metric_unit: metric.metricUnit,
    metric_value: metric.metricValue,
    metric_context: metric.metricContext || {},
    scoring_version: input.payload.scoringVersion,
    recorded_at: new Date().toISOString(),
  }));
  const { error } = await input.supabase
    .from("coach_metric_observations")
    .upsert(rows, { onConflict: "app_id,user_id,client_session_id,metric_key" });
  if (error) {
    console.warn("Coach metric observations were not recorded.", error.message);
    return;
  }
  const protocolGroup = typeof controllerEvent.protocolGroup === "string" ? controllerEvent.protocolGroup : null;
  await updateMetricNorms(input.supabase, input.appId, Array.from(new Set(metrics.map((metric) => metric.metricKey))), protocolGroup);
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (request.method !== "POST") return json(405, { error: "Method not allowed." });

  const user = await authenticatedUser(request);
  if (!user) return json(401, { error: "Authentication required." });

  const payload = await readPayload<FinalizePayload>(request);
  if (!payload?.clientSessionId || !payload.snapshot || !payload.scoringVersion) {
    return json(400, { error: "Invalid finalization payload." });
  }

  const supabase = serviceClient();
  const { data: session, error: sessionError } = await supabase
    .from("wm_sessions")
    .update({ completed_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .eq("client_session_id", payload.clientSessionId)
    .select("id, session_number, phase_label, phase_status, nominal_session_band")
    .single();
  if (sessionError) return json(500, { error: sessionError.message });

  const snapshot = payload.snapshot as {
    sessionNumber?: number;
    activePhase?: string;
    phaseStatus?: string;
    nominalBand?: string | null;
  };

  const snapshotRow = {
    user_id: user.id,
    session_id: session.id,
    programme_run_id: payload.programmeRunId || null,
    programme_cycle: payload.programmeCycle || 1,
    session_number: snapshot.sessionNumber || session.session_number,
    active_phase: snapshot.activePhase || session.phase_label,
    phase_status: snapshot.phaseStatus || session.phase_status,
    nominal_band: snapshot.nominalBand || session.nominal_session_band,
    snapshot: payload.snapshot,
    scoring_version: payload.scoringVersion,
  };
  let snapshotResult = await supabase.from("wm_score_snapshots").insert(snapshotRow);
  if (isMissingProgrammeColumn(snapshotResult.error)) {
    const legacySnapshotRow: Record<string, unknown> = { ...snapshotRow };
    delete legacySnapshotRow.programme_run_id;
    delete legacySnapshotRow.programme_cycle;
    snapshotResult = await supabase.from("wm_score_snapshots").insert(legacySnapshotRow);
  }
  const { error: snapshotError } = snapshotResult;
  if (snapshotError) return json(500, { error: snapshotError.message });

  if (payload.benchmarkConsent === true) {
    await recordCoachMetrics({
      supabase,
      appId: "wm_coach",
      userId: user.id,
      sessionId: session.id,
      payload,
      sessionNumber: snapshot.sessionNumber || session.session_number,
      phaseLabel: snapshot.activePhase || session.phase_label,
      phaseStatus: snapshot.phaseStatus || session.phase_status,
      snapshot: payload.snapshot,
    });
  }

  if (payload.controllerEvent) {
    const readiness = objectPayload(payload.controllerEvent.readiness);
    const telemetry = {
      protocolGroup: payload.controllerEvent.protocolGroup ?? null,
      completedSession: payload.controllerEvent.completedSession ?? null,
      nextState: payload.controllerEvent.nextState ?? null,
      scoreSnapshotState: payload.controllerEvent.scoreSnapshotState ?? null,
      scratchBaselineSources: payload.controllerEvent.scratchBaselineSources ?? [],
      dataMode: payload.dataMode ?? payload.controllerEvent.dataMode ?? null,
      benchmarkConsent: payload.benchmarkConsent === true,
    };
    await supabase.from("wm_phase_controller_events").insert({
      user_id: user.id,
      session_id: session.id,
      from_phase: String(payload.controllerEvent.fromPhase || snapshot.activePhase || session.phase_label),
      to_phase: String(payload.controllerEvent.toPhase || snapshot.activePhase || session.phase_label),
      should_transition: Boolean(payload.controllerEvent.shouldTransition),
      transition_keys: payload.controllerEvent.transitionKeys || [],
      phase_status: String(payload.controllerEvent.phaseStatus || snapshot.phaseStatus || session.phase_status),
      reason: String(payload.controllerEvent.reason || "Session finalized."),
      readiness: { ...readiness, telemetry },
    });
  }

  return json(200, { finalized: true, snapshot: payload.snapshot });
});
