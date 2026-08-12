import { describe, expect, it } from "vitest";
import migration from "../supabase/migrations/202608110001_cognitive_control_shared_schema.sql?raw";
import dualEstimandMigration from "../supabase/migrations/202608120001_cognitive_control_dual_estimand.sql?raw";
import programmeMigration from "../supabase/migrations/202608120002_cognitive_control_multisession_programme.sql?raw";

describe("CCC shared schema migration", () => {
  it("creates the approved hybrid table shape", () => {
    expect(migration).toContain("create table if not exists public.coach_sessions");
    expect(migration).toContain("create table if not exists public.coach_trials");
    expect(migration).toContain("create table if not exists public.coach_events");
    expect(migration).toContain("create table if not exists public.coach_protocol_assignments");
    expect(migration).toContain("create table if not exists public.cognitive_control_progress");
  });

  it("does not carry forward Attention-specific tables into the CCC migration", () => {
    expect(migration).not.toMatch(/public\.attention_/);
    expect(migration).toContain("app_id text not null");
    expect(migration).not.toContain("app_id in ('attention_coach', 'wm_coach')");
  });

  it("stores the full P0 validity and value contract idempotently", () => {
    expect(migration).toContain("client_session_id text not null");
    expect(migration).toContain("valid_for_progression boolean not null default false");
    expect(migration).toContain("assisted_first_contact boolean not null default false");
    expect(migration).toContain("drain_rate_per_second numeric");
    expect(migration).toContain("client_event_id text not null");
    expect(migration).toContain("unique (session_id, trial_id)");
    expect(migration).toContain("drop policy if exists");
  });

  it("adds the protected signal, policy and timing fields without rewriting the shared schema", () => {
    expect(dualEstimandMigration).toContain("add column if not exists estimand text");
    expect(dualEstimandMigration).toContain("add column if not exists presentation_mode text");
    expect(dualEstimandMigration).toContain("add column if not exists counts_toward_quota boolean");
    expect(dualEstimandMigration).toContain("add column if not exists actual_stimulus_frames integer");
    expect(dualEstimandMigration).toContain("add column if not exists signal_staircase_level integer");
  });

  it("adds relational-memory and multi-session telemetry additively", () => {
    expect(programmeMigration).toContain("add column if not exists n_level integer");
    expect(programmeMigration).toContain("add column if not exists match_status text");
    expect(programmeMigration).toContain("add column if not exists lure_type text");
    expect(programmeMigration).toContain("add column if not exists wm_buffer boolean");
  });
});
