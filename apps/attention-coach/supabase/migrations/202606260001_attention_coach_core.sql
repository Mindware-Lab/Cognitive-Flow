create extension if not exists "pgcrypto";

create table if not exists public.attention_user_settings (
  user_id uuid primary key,
  current_phase_label text not null default 'P1_ARROW_ABS'
    check (current_phase_label in ('P1_ARROW_ABS','P2_FLOW_ABS','P3_ARROW_REL','P4_FLOW_REL','P5_MIXED','P6_DELAYED')),
  current_cell_key text check (current_cell_key in ('arrow_abs','flow_abs','arrow_rel','flow_rel','mixed')),
  phase_transition_mode text not null default 'learning_curve'
    check (phase_transition_mode in ('learning_curve','manual_research_override')),
  phase_status text not null default 'active'
    check (phase_status in ('active','flattening','ready_to_swap','recovering','mixed','delayed','extended_for_learning_curve','completed')),
  nominal_session_band text,
  research_mode boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.attention_device_checks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  refresh_rate_hz numeric,
  median_frame_ms numeric,
  frame_mad_ms numeric,
  dropped_frame_rate numeric,
  input_latency_ms numeric,
  arrow_render_ok boolean not null default false,
  flow_render_ok boolean not null default false,
  timing_quality text not null check (timing_quality in ('good','acceptable','poor')),
  flow_eligible boolean not null default false,
  sampled_frames integer,
  created_at timestamptz not null default now()
);

create table if not exists public.attention_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  session_number integer not null,
  phase_label text not null,
  phase_status text not null,
  nominal_session_band text,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  client_session_id text not null,
  protocol_version text not null,
  generator_version text not null,
  adaptive_version text not null,
  scoring_version text not null,
  unique (user_id, client_session_id)
);

create table if not exists public.attention_blocks (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.attention_sessions(id) on delete cascade,
  user_id uuid not null,
  client_block_id text not null,
  block_index integer not null check (block_index between 1 and 4),
  construct text not null check (construct in ('ACC','BSE')),
  label text not null,
  trial_count integer not null default 20,
  created_at timestamptz not null default now(),
  unique (session_id, client_block_id)
);

create table if not exists public.attention_trials (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.attention_sessions(id) on delete cascade,
  block_id uuid references public.attention_blocks(id) on delete cascade,
  user_id uuid not null,
  client_trial_id text not null,
  construct text not null check (construct in ('ACC','BSE')),
  cell_key text not null check (cell_key in ('arrow_abs','flow_abs','arrow_rel','flow_rel','mixed')),
  transition_key text check (transition_key in ('T_CM_BASE','T_FRAME_ARROW','T_FRAME_FLOW','T_CM_REL','T_MIXED','T_DELAYED')),
  phase_label text not null,
  is_reference_recheck boolean not null default false,
  response text,
  correct_response text not null,
  is_correct boolean not null,
  rt_ms numeric,
  ratio text check (ratio in ('5:0','4:1','3:2')),
  exposure_ms_requested numeric,
  exposure_ms_actual numeric,
  actual_stimulus_frames integer,
  device_refresh_rate_estimate numeric,
  dropped_frame_count integer default 0,
  mask_ms_requested numeric,
  mask_ms_actual numeric,
  response_window_ms integer,
  fixation_ms integer,
  iti_ms integer,
  staircase_level integer,
  staircase_direction text check (staircase_direction in ('harder','easier','maintain')),
  h_condition_bits numeric,
  calibration_table_id text,
  timing_quality text check (timing_quality in ('good','acceptable','poor')),
  trajectory_window_id uuid,
  created_at timestamptz not null default now(),
  unique (session_id, client_trial_id)
);

create table if not exists public.attention_capacity_estimates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  session_id uuid references public.attention_sessions(id) on delete set null,
  construct text not null check (construct in ('ACC','BSE')),
  cell_key text not null check (cell_key in ('arrow_abs','flow_abs','arrow_rel','flow_rel','mixed')),
  et_75_ms numeric,
  h_condition_at_threshold_bits numeric,
  capacity_bps numeric,
  capacity_se numeric,
  valid_trials integer not null default 0,
  confidence_label text check (confidence_label in ('insufficient_data','calibrating','moderate_confidence','high_confidence','timing_limited','unstable_estimate')),
  staircase_summary jsonb,
  calibration_table_id text,
  model_version text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.attention_trajectory_windows (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  session_id uuid references public.attention_sessions(id) on delete set null,
  construct text not null check (construct in ('ACC','BSE')),
  phase_label text not null,
  cell_key text not null check (cell_key in ('arrow_abs','flow_abs','arrow_rel','flow_rel','mixed')),
  window_index integer not null,
  valid_trials integer not null,
  state_vector jsonb not null,
  delta_vector jsonb,
  model_version text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.attention_phase_controller_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  session_id uuid references public.attention_sessions(id) on delete set null,
  from_phase text not null,
  to_phase text not null,
  should_transition boolean not null,
  transition_keys text[] not null default '{}',
  phase_status text not null,
  reason text not null,
  readiness jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.attention_transition_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  construct text not null check (construct in ('ACC','BSE')),
  transition_key text not null check (transition_key in ('T_CM_BASE','T_FRAME_ARROW','T_FRAME_FLOW','T_CM_REL','T_MIXED','T_DELAYED')),
  from_cell_key text not null,
  to_cell_key text not null,
  from_phase text not null,
  to_phase text not null,
  transition_type text not null check (transition_type in ('carrier_swap','frame_ramp','mixed_switch','delayed_recheck')),
  is_cross_modal_transfer_boundary boolean not null default false,
  is_validation_boundary boolean not null default false,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  notes jsonb
);

create table if not exists public.attention_transfer_metrics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  construct text not null check (construct in ('ACC','BSE')),
  transition_event_id uuid references public.attention_transition_events(id) on delete set null,
  transition_key text not null,
  metric_name text not null check (metric_name in ('MIR','ASI','CBA','LISS','PRR','TE_boundary','FAV_MI_shape','FAV_compression','FAV_beta_parallel','FAV_PR_equivalence','Mixed_Stability','Delayed_Recovery')),
  value numeric,
  se numeric,
  ci_lower numeric,
  ci_upper numeric,
  confidence_label text check (confidence_label in ('insufficient_data','calibrating','moderate_confidence','high_confidence','timing_limited','unstable_estimate')),
  scratch_baseline_source text check (scratch_baseline_source in ('counterbalanced_cohort','historical_norm','within_user_proxy','not_required')),
  model_version text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.attention_score_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  session_id uuid references public.attention_sessions(id) on delete set null,
  session_number integer not null,
  active_phase text not null,
  phase_status text not null,
  nominal_band text,
  snapshot jsonb not null,
  scoring_version text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.attention_calibration_tables (
  id text primary key,
  model_version text not null,
  construct text not null check (construct in ('ACC','BSE')),
  set_size integer not null,
  majority_ratio text not null,
  h_condition_bits numeric not null,
  source_note text,
  created_at timestamptz not null default now(),
  retired_at timestamptz
);

create table if not exists public.attention_adaptive_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  session_id uuid references public.attention_sessions(id) on delete cascade,
  construct text not null check (construct in ('ACC','BSE')),
  cell_key text not null,
  event_type text not null,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

insert into public.attention_calibration_tables
  (id, model_version, construct, set_size, majority_ratio, h_condition_bits, source_note)
values
  ('acc-fixed5-5-0-v0.1', 'attention-coach-wap-v0.1', 'ACC', 5, '5:0', 1.58, 'Initial v3.3 protocol table'),
  ('acc-fixed5-4-1-v0.1', 'attention-coach-wap-v0.1', 'ACC', 5, '4:1', 2.91, 'Initial v3.3 protocol table'),
  ('acc-fixed5-3-2-v0.1', 'attention-coach-wap-v0.1', 'ACC', 5, '3:2', 4.91, 'Initial v3.3 protocol table'),
  ('bse-token4-v0.1', 'attention-coach-wap-v0.1', 'BSE', 5, 'token4', 2.00, '2 relations x 2 colours')
on conflict (id) do nothing;

alter table public.attention_user_settings enable row level security;
alter table public.attention_device_checks enable row level security;
alter table public.attention_sessions enable row level security;
alter table public.attention_blocks enable row level security;
alter table public.attention_trials enable row level security;
alter table public.attention_capacity_estimates enable row level security;
alter table public.attention_trajectory_windows enable row level security;
alter table public.attention_phase_controller_events enable row level security;
alter table public.attention_transition_events enable row level security;
alter table public.attention_transfer_metrics enable row level security;
alter table public.attention_score_snapshots enable row level security;
alter table public.attention_calibration_tables enable row level security;
alter table public.attention_adaptive_events enable row level security;

create policy "attention read own settings" on public.attention_user_settings for select using (auth.uid() = user_id);
create policy "attention read own device checks" on public.attention_device_checks for select using (auth.uid() = user_id);
create policy "attention read own sessions" on public.attention_sessions for select using (auth.uid() = user_id);
create policy "attention read own blocks" on public.attention_blocks for select using (auth.uid() = user_id);
create policy "attention read own trials" on public.attention_trials for select using (auth.uid() = user_id);
create policy "attention read own estimates" on public.attention_capacity_estimates for select using (auth.uid() = user_id);
create policy "attention read own windows" on public.attention_trajectory_windows for select using (auth.uid() = user_id);
create policy "attention read own controller events" on public.attention_phase_controller_events for select using (auth.uid() = user_id);
create policy "attention read own transitions" on public.attention_transition_events for select using (auth.uid() = user_id);
create policy "attention read own transfer metrics" on public.attention_transfer_metrics for select using (auth.uid() = user_id);
create policy "attention read own snapshots" on public.attention_score_snapshots for select using (auth.uid() = user_id);
create policy "attention read calibration tables" on public.attention_calibration_tables for select using (true);
create policy "attention read own adaptive events" on public.attention_adaptive_events for select using (auth.uid() = user_id);

revoke insert, update, delete on public.attention_trials from anon, authenticated;
revoke insert, update, delete on public.attention_capacity_estimates from anon, authenticated;
revoke insert, update, delete on public.attention_score_snapshots from anon, authenticated;

create index if not exists attention_trials_session_idx on public.attention_trials (session_id, construct, cell_key);
create index if not exists attention_snapshots_user_created_idx on public.attention_score_snapshots (user_id, created_at desc);
create index if not exists attention_transitions_user_key_idx on public.attention_transition_events (user_id, transition_key, started_at desc);
