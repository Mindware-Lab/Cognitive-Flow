import { describe, expect, it } from "vitest";
import migration from "../supabase/migrations/202608110001_cognitive_control_shared_schema.sql?raw";

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
});