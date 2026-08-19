-- Permanently grandfather every account that already existed in the shared
-- IQ Mindware Supabase Auth project before the 2026-08-19 access-policy
-- decision into Cognitive Control Coach.
--
-- Business rule:
-- - These pre-existing accounts represent legacy IQ Mindware / Attention Coach
--   sign-ups in this Supabase project.
-- - Matrix-only users were hosted in a separate Supabase project.
-- - Legacy CCC access is permanent (expires_at = null).
-- - Existing Stripe/admin/beta provenance is preserved rather than rewritten.
-- - Explicit revocations, if any are introduced, are not overridden.
-- - The timestamp cutoff prevents later accounts from being grandfathered if
--   this migration is replayed in the future.

with legacy_users as (
  select
    users.id as user_id,
    lower(btrim(users.email)) as email
  from auth.users as users
  where users.email is not null
    and users.created_at < timestamptz '2026-08-19 11:00:00+00'
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
  legacy_users.email,
  'cognitive_control_coach',
  'active',
  'admin',
  'grandfathered-legacy-iqmindware-auth-user-20260819',
  null,
  now()
from legacy_users
on conflict (email, product_code) do update
set
  expires_at = null,
  updated_at = now()
where grants.status = 'active';

with legacy_users as (
  select
    users.id as user_id,
    lower(btrim(users.email)) as email
  from auth.users as users
  where users.email is not null
    and users.created_at < timestamptz '2026-08-19 11:00:00+00'
),
eligible_grants as (
  select
    legacy_users.user_id,
    grants.source,
    grants.source_reference,
    coalesce(grants.purchased_at, grants.created_at, now()) as granted_at
  from legacy_users
  join private.iq_coach_access_grants as grants
    on grants.email = legacy_users.email
   and grants.product_code = 'cognitive_control_coach'
   and grants.status = 'active'
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
  eligible_grants.user_id,
  'cognitive_control_coach',
  'active',
  eligible_grants.source,
  eligible_grants.source_reference,
  eligible_grants.granted_at,
  null,
  jsonb_build_object(
    'legacy_grandfathered', true,
    'legacy_grandfather_policy', 'all_existing_iqmindware_auth_users_20260819'
  ),
  now()
from eligible_grants
on conflict (user_id, product_code) do update
set
  expires_at = null,
  metadata = entitlements.metadata || excluded.metadata,
  updated_at = now()
where entitlements.status = 'active';
