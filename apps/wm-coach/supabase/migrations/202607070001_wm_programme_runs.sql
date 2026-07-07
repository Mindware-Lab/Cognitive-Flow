alter table public.wm_sessions
  add column if not exists programme_run_id text,
  add column if not exists programme_cycle integer not null default 1;

alter table public.wm_score_snapshots
  add column if not exists programme_run_id text,
  add column if not exists programme_cycle integer not null default 1;

create index if not exists wm_sessions_programme_idx
  on public.wm_sessions (user_id, programme_cycle, programme_run_id, session_number);
