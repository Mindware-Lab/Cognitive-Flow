create extension if not exists "pgcrypto";

create table if not exists public.cognitive_bandwidth_partner_feedback (
  id uuid primary key default gen_random_uuid(),
  run_id text not null check (char_length(run_id) between 8 and 128),
  prototype_version text not null default 'partner-prototype-v1',
  audience text not null,
  clarity smallint not null check (clarity between 1 and 5),
  credibility smallint not null check (credibility between 1 and 5),
  fit text,
  evidence_needed text,
  interest text not null,
  contact_email text,
  timing_quality text check (timing_quality in ('Good', 'Acceptable', 'Limited')),
  direction_bps numeric,
  frame_bps numeric,
  frame_cost_bps numeric,
  user_agent text,
  created_at timestamptz not null default now()
);

alter table public.cognitive_bandwidth_partner_feedback enable row level security;

revoke all on public.cognitive_bandwidth_partner_feedback from anon, authenticated;

create index if not exists cognitive_bandwidth_partner_feedback_created_idx
  on public.cognitive_bandwidth_partner_feedback (created_at desc);

create index if not exists cognitive_bandwidth_partner_feedback_interest_idx
  on public.cognitive_bandwidth_partner_feedback (interest, created_at desc);
