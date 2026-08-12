-- Session feedback observations and population comparisons for Cognitive Control Coach.
create table if not exists public.coach_metric_observations (
  id uuid primary key default gen_random_uuid(),
  app_id text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  client_session_id text not null,
  source_session_id uuid references public.coach_sessions(id) on delete cascade,
  programme_run_id text,
  session_number integer not null,
  metric_key text not null,
  metric_group text not null default 'session_feedback',
  metric_unit text,
  metric_value numeric not null,
  recorded_at timestamptz not null default now(),
  unique (app_id, user_id, client_session_id, metric_key)
);

create table if not exists public.coach_metric_norms (
  app_id text not null,
  metric_key text not null,
  cohort_key text not null default 'global_beta',
  n integer not null default 0,
  mean_value numeric,
  stddev_value numeric,
  last_observation_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (app_id, metric_key, cohort_key)
);

do $$
declare constraint_row record;
begin
  for constraint_row in
    select conname, conrelid::regclass as relation_name
    from pg_constraint
    where conrelid in ('public.coach_metric_observations'::regclass, 'public.coach_metric_norms'::regclass)
      and contype = 'c'
      and pg_get_constraintdef(oid) like '%app_id%'
  loop
    execute format('alter table %s drop constraint %I', constraint_row.relation_name, constraint_row.conname);
  end loop;
end $$;

alter table public.coach_metric_observations enable row level security;
alter table public.coach_metric_norms enable row level security;

alter table public.coach_metric_observations
  add column if not exists source_session_id uuid references public.coach_sessions(id) on delete cascade,
  add column if not exists programme_run_id text,
  add column if not exists programme_cycle integer not null default 1,
  add column if not exists phase_label text,
  add column if not exists phase_status text,
  add column if not exists protocol_group text,
  add column if not exists device_quality text,
  add column if not exists start_carrier text,
  add column if not exists start_cohort text,
  add column if not exists start_wrapper text,
  add column if not exists carrier_target_wrapper text,
  add column if not exists frame_target_wrapper text,
  add column if not exists held_out_wrapper text,
  add column if not exists held_out_status text,
  add column if not exists metric_group text not null default 'session_feedback',
  add column if not exists metric_unit text,
  add column if not exists metric_context jsonb not null default '{}'::jsonb,
  add column if not exists scoring_version text;

alter table public.coach_metric_norms
  add column if not exists last_observation_at timestamptz;

drop policy if exists "CCC users read own metric observations" on public.coach_metric_observations;
drop policy if exists "CCC users read aggregate metric norms" on public.coach_metric_norms;

create policy "CCC users read own metric observations"
  on public.coach_metric_observations for select
  using (auth.uid() = user_id);

create policy "CCC users read aggregate metric norms"
  on public.coach_metric_norms for select
  using (true);

revoke insert, update, delete on public.coach_metric_observations from anon, authenticated;
revoke insert, update, delete on public.coach_metric_norms from anon, authenticated;
grant select on public.coach_metric_observations to authenticated;
grant select on public.coach_metric_norms to authenticated;
grant all on public.coach_metric_observations to service_role;
grant all on public.coach_metric_norms to service_role;

create unique index if not exists coach_metric_observations_app_user_session_metric_uidx
  on public.coach_metric_observations (app_id, user_id, client_session_id, metric_key);

create index if not exists coach_metric_observations_app_metric_idx
  on public.coach_metric_observations (app_id, metric_key, recorded_at desc);

drop view if exists public.coach_metric_standardized_scores;

create view public.coach_metric_standardized_scores
with (security_invoker = true)
as
select
  o.id,
  o.app_id,
  o.user_id,
  o.client_session_id,
  o.source_session_id,
  o.programme_run_id,
  coalesce(o.programme_cycle, 1) as programme_cycle,
  o.session_number,
  o.phase_label,
  o.phase_status,
  o.protocol_group,
  o.device_quality,
  o.start_carrier,
  o.start_cohort,
  o.start_wrapper,
  o.carrier_target_wrapper,
  o.frame_target_wrapper,
  o.held_out_wrapper,
  o.held_out_status,
  o.metric_key,
  o.metric_group,
  o.metric_unit,
  o.metric_value,
  o.metric_context,
  o.scoring_version,
  o.recorded_at,
  n.n as norm_n,
  case when n.stddev_value is null or n.stddev_value = 0 then null
    else (o.metric_value - n.mean_value) / n.stddev_value end as z_score,
  case when n.stddev_value is null or n.stddev_value = 0 then null
    else 100 + 15 * ((o.metric_value - n.mean_value) / n.stddev_value) end as standard_score
from public.coach_metric_observations o
left join public.coach_metric_norms n
  on n.app_id = o.app_id
  and n.metric_key = o.metric_key
  and n.cohort_key = 'global_beta';

grant select on public.coach_metric_standardized_scores to authenticated;
grant select on public.coach_metric_standardized_scores to service_role;
