-- Preserve access for authenticated G Track users who stored cloud activity
-- before the paid gate was enabled. The public CPT app uses a different
-- Supabase project, so these rows identify users of the shared G Track backend.

with eligible_users as (
  select user_id from public.cpt_attempts
  union
  select user_id from public.cpt_test_sessions
  union
  select id as user_id
  from public.profiles
  where cpt_consent_version like 'gtrack-%'
)
insert into private.iq_coach_access_grants (
  email,
  product_code,
  status,
  source,
  source_reference,
  expires_at
)
select
  lower(btrim(users.email)),
  'g_track',
  'active',
  'beta',
  'grandfathered-g-track-cloud-user-20260817',
  now() + interval '1 year'
from eligible_users
join auth.users as users on users.id = eligible_users.user_id
where users.email is not null
on conflict (email, product_code) do nothing;

with eligible_users as (
  select user_id from public.cpt_attempts
  union
  select user_id from public.cpt_test_sessions
  union
  select id as user_id
  from public.profiles
  where cpt_consent_version like 'gtrack-%'
)
insert into public.user_entitlements (
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
  'g_track',
  'active',
  'beta',
  'grandfathered-g-track-cloud-user-20260817',
  now(),
  now() + interval '1 year',
  jsonb_build_object('cohort', 'pre_paid_gate_cloud_user'),
  now()
from eligible_users
on conflict (user_id, product_code) do nothing;
