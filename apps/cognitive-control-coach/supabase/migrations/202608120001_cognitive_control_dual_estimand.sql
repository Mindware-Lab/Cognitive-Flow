-- Cognitive Control Coach v0.3: separate signal, policy and transfer estimands.
alter table public.coach_trials
  add column if not exists estimand text,
  add column if not exists presentation_mode text,
  add column if not exists counts_toward_quota boolean not null default false,
  add column if not exists exposure_ms_requested integer,
  add column if not exists exposure_ms_actual numeric,
  add column if not exists actual_stimulus_frames integer,
  add column if not exists device_refresh_rate_estimate numeric,
  add column if not exists timing_quality text,
  add column if not exists signal_staircase_level integer;

comment on column public.coach_trials.estimand is
  'Separate practice, signal_capacity, policy, and transfer outcomes; never pool by default.';

comment on column public.coach_trials.counts_toward_quota is
  'True for completed answers and deadline omissions; false for interrupted or otherwise invalid trials.';
