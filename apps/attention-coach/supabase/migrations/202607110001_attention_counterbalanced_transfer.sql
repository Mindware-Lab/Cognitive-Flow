alter table public.attention_sessions
  add column if not exists protocol_group text,
  add column if not exists start_carrier text,
  add column if not exists start_cohort text,
  add column if not exists start_wrapper text,
  add column if not exists carrier_target_wrapper text,
  add column if not exists frame_target_wrapper text,
  add column if not exists held_out_wrapper text,
  add column if not exists held_out_status text;

alter table public.attention_trials
  add column if not exists start_carrier text,
  add column if not exists start_cohort text,
  add column if not exists start_wrapper text,
  add column if not exists carrier_target_wrapper text,
  add column if not exists frame_target_wrapper text,
  add column if not exists held_out_wrapper text,
  add column if not exists held_out_status text;

alter table public.attention_score_snapshots
  add column if not exists protocol_group text,
  add column if not exists start_carrier text,
  add column if not exists start_cohort text,
  add column if not exists start_wrapper text,
  add column if not exists carrier_target_wrapper text,
  add column if not exists frame_target_wrapper text,
  add column if not exists held_out_wrapper text,
  add column if not exists held_out_status text;

alter table public.coach_metric_observations
  add column if not exists start_carrier text,
  add column if not exists start_cohort text,
  add column if not exists start_wrapper text,
  add column if not exists carrier_target_wrapper text,
  add column if not exists frame_target_wrapper text,
  add column if not exists held_out_wrapper text,
  add column if not exists held_out_status text;

create index if not exists attention_trials_transfer_path_idx
  on public.attention_trials (user_id, start_cohort, start_wrapper, carrier_target_wrapper, frame_target_wrapper, held_out_wrapper);

create index if not exists coach_metric_observations_transfer_path_idx
  on public.coach_metric_observations (app_id, metric_key, start_cohort, start_wrapper, carrier_target_wrapper, held_out_wrapper, recorded_at desc);
