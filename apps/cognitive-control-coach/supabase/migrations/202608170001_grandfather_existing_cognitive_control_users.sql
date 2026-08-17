-- Preserve access for authenticated Cognitive Control Coach users who stored
-- cloud activity before the paid gate was enabled. This deliberately excludes
-- users known only through other IQ Mindware apps and local-only browser data.

with eligible_users as (
  select user_id from public.cognitive_control_progress
  union
  select user_id from public.coach_sessions where app_id = 'cognitive_control_coach'
  union
  select user_id from public.coach_protocol_assignments where app_id = 'cognitive_control_coach'
  union
  select user_id from public.coach_events where app_id = 'cognitive_control_coach'
  union
  select user_id from public.coach_metric_observations where app_id = 'cognitive_control_coach'
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
  'cognitive_control_coach',
  'active',
  'beta',
  'grandfathered-ccc-cloud-user-20260817',
  now() + interval '1 year'
from eligible_users
join auth.users as users on users.id = eligible_users.user_id
where users.email is not null
on conflict (email, product_code) do nothing;

with eligible_users as (
  select user_id from public.cognitive_control_progress
  union
  select user_id from public.coach_sessions where app_id = 'cognitive_control_coach'
  union
  select user_id from public.coach_protocol_assignments where app_id = 'cognitive_control_coach'
  union
  select user_id from public.coach_events where app_id = 'cognitive_control_coach'
  union
  select user_id from public.coach_metric_observations where app_id = 'cognitive_control_coach'
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
  'cognitive_control_coach',
  'active',
  'beta',
  'grandfathered-ccc-cloud-user-20260817',
  now(),
  now() + interval '1 year',
  jsonb_build_object('cohort', 'pre_paid_gate_cloud_user'),
  now()
from eligible_users
on conflict (user_id, product_code) do nothing;
