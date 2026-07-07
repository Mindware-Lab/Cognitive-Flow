import { authenticatedUser, serviceClient } from "../_shared/supabase.ts";
import { CORS, json, readPayload } from "../_shared/http.ts";

interface FinalizePayload {
  clientSessionId: string;
  programmeRunId?: string;
  programmeCycle?: number;
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

  if (payload.controllerEvent) {
    const readiness = objectPayload(payload.controllerEvent.readiness);
    const telemetry = {
      protocolGroup: payload.controllerEvent.protocolGroup ?? null,
      completedSession: payload.controllerEvent.completedSession ?? null,
      nextState: payload.controllerEvent.nextState ?? null,
      scoreSnapshotState: payload.controllerEvent.scoreSnapshotState ?? null,
      scratchBaselineSources: payload.controllerEvent.scratchBaselineSources ?? [],
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
