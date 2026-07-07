create extension if not exists "pgcrypto";

create table if not exists public.coach_metric_observations (
  id uuid primary key default gen_random_uuid(),
  app_id text not null check (app_id in ('attention_coach', 'wm_coach')),
  user_id uuid not null,
  client_session_id text not null,
  source_session_id uuid,
  programme_run_id text,
  programme_cycle integer not null default 1,
  session_number integer not null,
  phase_label text,
  phase_status text,
  protocol_group text,
  device_quality text,
  metric_key text not null,
  metric_group text not null,
  metric_unit text,
  metric_value numeric not null,
  metric_context jsonb not null default '{}'::jsonb,
  scoring_version text,
  recorded_at timestamptz not null default now(),
  unique (app_id, user_id, client_session_id, metric_key)
);

create table if not exists public.coach_metric_norms (
  app_id text not null check (app_id in ('attention_coach', 'wm_coach')),
  metric_key text not null,
  cohort_key text not null default 'global_beta',
  n integer not null default 0,
  mean_value numeric,
  stddev_value numeric,
  min_value numeric,
  max_value numeric,
  last_observation_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (app_id, metric_key, cohort_key)
);

alter table public.coach_metric_observations enable row level security;
alter table public.coach_metric_norms enable row level security;

create policy "Coach metrics read own observations"
  on public.coach_metric_observations
  for select
  using (auth.uid() = user_id);

create policy "Coach metrics read aggregate norms"
  on public.coach_metric_norms
  for select
  using (true);

revoke insert, update, delete on public.coach_metric_observations from anon, authenticated;
revoke insert, update, delete on public.coach_metric_norms from anon, authenticated;

create index if not exists coach_metric_observations_metric_idx
  on public.coach_metric_observations (app_id, metric_key, recorded_at desc);

create index if not exists coach_metric_observations_user_idx
  on public.coach_metric_observations (user_id, app_id, programme_cycle, session_number);

create or replace view public.coach_metric_standardized_scores
with (security_invoker = true)
as
select
  o.id,
  o.app_id,
  o.user_id,
  o.client_session_id,
  o.source_session_id,
  o.programme_run_id,
  o.programme_cycle,
  o.session_number,
  o.phase_label,
  o.phase_status,
  o.protocol_group,
  o.device_quality,
  o.metric_key,
  o.metric_group,
  o.metric_unit,
  o.metric_value,
  o.metric_context,
  o.scoring_version,
  o.recorded_at,
  n.cohort_key,
  n.n as norm_n,
  n.mean_value,
  n.stddev_value,
  case
    when n.stddev_value is null or n.stddev_value = 0 then null
    else (o.metric_value - n.mean_value) / n.stddev_value
  end as z_score,
  case
    when n.stddev_value is null or n.stddev_value = 0 then null
    else 100 + 15 * ((o.metric_value - n.mean_value) / n.stddev_value)
  end as standard_score
from public.coach_metric_observations o
left join public.coach_metric_norms n
  on n.app_id = o.app_id
  and n.metric_key = o.metric_key
  and n.cohort_key = 'global_beta';
