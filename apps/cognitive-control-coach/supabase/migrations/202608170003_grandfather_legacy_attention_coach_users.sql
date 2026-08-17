-- Preserve Cognitive Control Coach access for users of the legacy Attention
-- Coach who stored authenticated cloud activity before the paid gate.
--
-- Deliberately do not grant every account in the shared Supabase project:
-- G Track-only and WM Coach-only users are separate product cohorts. Existing
-- explicit revocations are also preserved.

with eligible_users as (
  select user_id from public.attention_progress_state
  union
  select user_id from public.attention_sessions
  union
  select user_id from public.attention_user_settings
  union
  select user_id from public.attention_device_checks
  union
  select user_id from public.attention_score_snapshots
  union
  select user_id from public.attention_proof_benchmarks
  union
  select user_id from public.coach_metric_observations where app_id = 'attention_coach'
)
insert into private.iq_coach_access_grants as grants (
  email,
  product_code,
  status,
  source,
  source_reference,
  expires_at,
  updated_at
)
select
  lower(btrim(users.email)),
  'cognitive_control_coach',
  'active',
  'beta',
  'grandfathered-legacy-attention-cloud-user-20260817',
  now() + interval '1 year',
  now()
from eligible_users
join auth.users as users on users.id = eligible_users.user_id
where users.email is not null
on conflict (email, product_code) do update
set
  expires_at = case
    when grants.expires_at is null then null
    else greatest(grants.expires_at, excluded.expires_at)
  end,
  updated_at = now()
where grants.status = 'active';

with eligible_users as (
  select user_id from public.attention_progress_state
  union
  select user_id from public.attention_sessions
  union
  select user_id from public.attention_user_settings
  union
  select user_id from public.attention_device_checks
  union
  select user_id from public.attention_score_snapshots
  union
  select user_id from public.attention_proof_benchmarks
  union
  select user_id from public.coach_metric_observations where app_id = 'attention_coach'
)
insert into public.user_entitlements as entitlements (
  user_id,
  product_code,
  status,
  source,
  source_reference,
  granted_at,
  expires_at,
  metadata,
  updated_at
)
select
  eligible_users.user_id,
  'cognitive_control_coach',
  'active',
  'beta',
  'grandfathered-legacy-attention-cloud-user-20260817',
  now(),
  now() + interval '1 year',
  jsonb_build_object('cohort', 'legacy_attention_coach_cloud_user'),
  now()
from eligible_users
on conflict (user_id, product_code) do update
set
  expires_at = case
    when entitlements.expires_at is null then null
    else greatest(entitlements.expires_at, excluded.expires_at)
  end,
  metadata = entitlements.metadata || excluded.metadata,
  updated_at = now()
where entitlements.status = 'active';
