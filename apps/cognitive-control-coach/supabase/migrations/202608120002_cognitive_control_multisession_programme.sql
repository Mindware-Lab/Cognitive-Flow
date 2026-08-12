alter table public.coach_trials
  add column if not exists n_level integer,
  add column if not exists match_status text,
  add column if not exists lure_type text,
  add column if not exists wm_buffer boolean not null default false;

create index if not exists coach_trials_user_app_operator_n_idx
  on public.coach_trials (user_id, app_id, operator, n_level, created_at desc);

comment on column public.coach_trials.wm_buffer is
  'True for the first n items after each regime reset; retained in telemetry but excluded from scoring and progression.';
