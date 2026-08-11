create extension if not exists pgcrypto;

create table if not exists public.coach_protocol_assignments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  app_id text not null,
  protocol_version text not null,
  config_version text not null,
  assignment_key text not null,
  assignment jsonb not null default '{}'::jsonb,
  assigned_at timestamptz not null default now(),
  unique (user_id, app_id, protocol_version, assignment_key)
);

create table if not exists public.coach_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  app_id text not null,
  client_session_id text not null,
  protocol_version text not null,
  config_version text not null,
  session_type text not null,
  session_number integer,
  progression_stage text,
  progression_step_id text,
  workflow_choice text,
  status text not null default 'started' check (status in ('started', 'completed', 'aborted', 'invalidated')),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  summary jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  unique (user_id, app_id, client_session_id)
);

create table if not exists public.coach_trials (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.coach_sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  app_id text not null,
  protocol_version text not null,
  config_version text not null,
  trial_id text not null,
  block_id text,
  trial_index integer not null,
  block_trial_index integer,
  operator text not null check (operator in ('attention', 'relational_wm')),
  wrapper_id text,
  source_wrapper_id text,
  reference_frame text check (reference_frame in ('absolute', 'relative') or reference_frame is null),
  carrier text check (carrier in ('arrow', 'flow') or carrier is null),
  regime_id text,
  phase text,
  progression_step_id text,
  purpose text,
  transition_kind text,
  strict_carrier_transfer_boundary boolean not null default false,
  relation_class text,
  evidence_level text,
  majority_ratio text,
  majority_count integer,
  target_class text,
  correct_response text,
  response text,
  response_class text,
  is_correct boolean,
  is_valid_decision boolean,
  is_omission boolean,
  response_time_ms integer,
  initial_reward numeric,
  drain_rate_per_second numeric,
  error_loss numeric,
  withhold_value numeric,
  omission_value numeric,
  minimum_exposure_ms integer,
  deadline_ms integer,
  reward_remaining numeric,
  points_realised numeric,
  normalized_value numeric,
  practice boolean not null default false,
  diagnostic boolean not null default false,
  assisted_first_contact boolean not null default false,
  valid_for_progression boolean not null default false,
  invalid_reason text,
  viewport_class text,
  input_mode text,
  focus_lost boolean not null default false,
  replacement_of_trial_id text,
  stimulus jsonb not null default '{}'::jsonb,
  scoring jsonb not null default '{}'::jsonb,
  recorded_at timestamptz,
  created_at timestamptz not null default now(),
  unique (session_id, trial_id)
);

create table if not exists public.coach_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  app_id text not null,
  protocol_version text not null,
  config_version text not null,
  session_id uuid references public.coach_sessions(id) on delete cascade,
  client_event_id text not null,
  block_id text,
  event_type text not null,
  event_payload jsonb not null default '{}'::jsonb,
  occurred_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, app_id, client_event_id)
);

create table if not exists public.cognitive_control_progress (
  user_id uuid primary key references auth.users(id) on delete cascade,
  app_id text not null default 'cognitive_control_coach' check (app_id = 'cognitive_control_coach'),
  protocol_version text not null,
  config_version text not null,
  stage text not null default 'P0',
  step_id text not null default 'p0_arrow_abs_stabilize',
  progression_status text not null default 'active',
  attention_portability_state jsonb not null default '{}'::jsonb,
  wm_portability_state jsonb not null default '{}'::jsonb,
  supported_unlock boolean not null default false,
  supported_unlock_reason text,
  return_to_now_state jsonb not null default '{}'::jsonb,
  shift_view_state jsonb not null default '{}'::jsonb,
  state jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.coach_protocol_assignments enable row level security;
alter table public.coach_sessions enable row level security;
alter table public.coach_trials enable row level security;
alter table public.coach_events enable row level security;
alter table public.cognitive_control_progress enable row level security;

drop policy if exists "coach assignments read own" on public.coach_protocol_assignments;
drop policy if exists "coach sessions read own" on public.coach_sessions;
drop policy if exists "coach trials read own" on public.coach_trials;
drop policy if exists "coach events read own" on public.coach_events;
drop policy if exists "cognitive control progress read own" on public.cognitive_control_progress;

create policy "coach assignments read own" on public.coach_protocol_assignments for select using (auth.uid() = user_id);
create policy "coach sessions read own" on public.coach_sessions for select using (auth.uid() = user_id);
create policy "coach trials read own" on public.coach_trials for select using (auth.uid() = user_id);
create policy "coach events read own" on public.coach_events for select using (auth.uid() = user_id);
create policy "cognitive control progress read own" on public.cognitive_control_progress for select using (auth.uid() = user_id);

revoke insert, update, delete on public.coach_protocol_assignments from anon, authenticated;
revoke insert, update, delete on public.coach_sessions from anon, authenticated;
revoke insert, update, delete on public.coach_trials from anon, authenticated;
revoke insert, update, delete on public.coach_events from anon, authenticated;
revoke insert, update, delete on public.cognitive_control_progress from anon, authenticated;

grant select on public.coach_protocol_assignments to authenticated;
grant select on public.coach_sessions to authenticated;
grant select on public.coach_trials to authenticated;
grant select on public.coach_events to authenticated;
grant select on public.cognitive_control_progress to authenticated;

grant all on public.coach_protocol_assignments to service_role;
grant all on public.coach_sessions to service_role;
grant all on public.coach_trials to service_role;
grant all on public.coach_events to service_role;
grant all on public.cognitive_control_progress to service_role;

create index if not exists coach_protocol_assignments_user_app_idx
  on public.coach_protocol_assignments (user_id, app_id, assigned_at desc);
create index if not exists coach_sessions_user_app_idx
  on public.coach_sessions (user_id, app_id, started_at desc);
create index if not exists coach_trials_session_idx
  on public.coach_trials (session_id, trial_index);
create index if not exists coach_trials_user_app_wrapper_idx
  on public.coach_trials (user_id, app_id, wrapper_id, regime_id, created_at desc);
create index if not exists coach_events_user_app_type_idx
  on public.coach_events (user_id, app_id, event_type, created_at desc);
