alter table public.wm_trials
  add column if not exists wrapper_id text,
  add column if not exists carrier text,
  add column if not exists frame text,
  add column if not exists probe_status text,
  add column if not exists mix_ratio numeric,
  add column if not exists mapping_timing text,
  add column if not exists lure_type text,
  add column if not exists transfer_event_id text;

alter table public.wm_transfer_metrics
  drop constraint if exists wm_transfer_metrics_metric_name_check;

alter table public.wm_transfer_metrics
  add constraint wm_transfer_metrics_metric_name_check
  check (
    metric_name in (
      'MIR',
      'ASI',
      'CBA',
      'LISS',
      'PRR',
      'TE_boundary',
      'FAV_MI_shape',
      'FAV_compression',
      'FAV_beta_parallel',
      'FAV_PR_equivalence',
      'Mixed_Stability',
      'Delayed_Recovery',
      'initial_dip',
      'recovery_slope',
      'recovery_ratio',
      'return_strength',
      'mixed_wrapper_stability',
      'compositional_transfer',
      'delayed_recovery',
      'late_cue_cost',
      'early_cue_reinstatement'
    )
  );

create index if not exists wm_trials_transfer_event_idx
  on public.wm_trials (user_id, transfer_event_id);
