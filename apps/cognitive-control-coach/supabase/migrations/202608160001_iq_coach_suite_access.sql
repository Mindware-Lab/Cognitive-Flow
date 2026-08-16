-- Checkout-first access for the IQ Coach product family.
--
-- Stripe records a private email grant with the service role. After the
-- purchaser follows the Supabase email link, the authenticated user claims
-- every active grant matching the server-side email on their auth account.

create extension if not exists pgcrypto;
create schema if not exists private;

revoke all on schema private from public, anon, authenticated;
grant usage on schema private to service_role;

create table if not exists private.iq_coach_checkout_purchases (
  checkout_session_id text primary key,
  email text not null,
  purchased_product_code text not null
    check (purchased_product_code in ('g_track', 'cognitive_control_coach', 'complete_cognitive_route')),
  stripe_customer_id text,
  purchased_at timestamptz not null,
  access_email_sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists private.iq_coach_access_grants (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  product_code text not null
    check (product_code in ('g_track', 'cognitive_control_coach')),
  status text not null default 'active'
    check (status in ('active', 'revoked')),
  source text not null
    check (source in ('stripe_checkout', 'beta', 'admin')),
  source_reference text,
  stripe_customer_id text,
  purchased_at timestamptz,
  expires_at timestamptz,
  claimed_user_id uuid references auth.users(id) on delete set null,
  claimed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (email, product_code)
);

create index if not exists iq_coach_access_grants_source_reference_idx
  on private.iq_coach_access_grants (source_reference)
  where source_reference is not null;

create table if not exists public.user_entitlements (
  user_id uuid not null references auth.users(id) on delete cascade,
  product_code text not null
    check (product_code in ('g_track', 'cognitive_control_coach')),
  status text not null default 'active' check (status in ('active', 'revoked')),
  source text not null check (source in ('stripe_checkout', 'beta', 'admin')),
  source_reference text,
  granted_at timestamptz not null default now(),
  expires_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, product_code)
);

create table if not exists public.user_data_preferences (
  user_id uuid not null references auth.users(id) on delete cascade,
  product_code text not null
    check (product_code in ('g_track', 'cognitive_control_coach')),
  data_mode text not null check (data_mode in ('cloud_personal', 'cloud_benchmark', 'local')),
  consent_version text,
  updated_at timestamptz not null default now(),
  primary key (user_id, product_code)
);

alter table public.user_entitlements enable row level security;
alter table public.user_data_preferences enable row level security;

drop policy if exists "users read own entitlements" on public.user_entitlements;
create policy "users read own entitlements"
  on public.user_entitlements for select
  using (auth.uid() = user_id);

drop policy if exists "users read own data preferences" on public.user_data_preferences;
drop policy if exists "users insert own data preferences" on public.user_data_preferences;
drop policy if exists "users update own data preferences" on public.user_data_preferences;
create policy "users read own data preferences"
  on public.user_data_preferences for select
  using (auth.uid() = user_id);
create policy "users insert own data preferences"
  on public.user_data_preferences for insert
  with check (auth.uid() = user_id);
create policy "users update own data preferences"
  on public.user_data_preferences for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

revoke all on private.iq_coach_checkout_purchases from public, anon, authenticated;
revoke all on private.iq_coach_access_grants from public, anon, authenticated;
revoke insert, update, delete on public.user_entitlements from anon, authenticated;
grant select on public.user_entitlements to authenticated;
grant select, insert, update on public.user_data_preferences to authenticated;
grant all on private.iq_coach_checkout_purchases to service_role;
grant all on private.iq_coach_access_grants to service_role;
grant all on public.user_entitlements to service_role;
grant all on public.user_data_preferences to service_role;

create or replace function public.record_iq_coach_checkout(
  p_email text,
  p_stripe_customer_id text,
  p_checkout_session_id text,
  p_product_code text,
  p_purchased_at timestamptz
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  normalized_email text := lower(btrim(p_email));
  purchase_time timestamptz := coalesce(p_purchased_at, now());
  entitlement_code text;
  entitlement_codes text[];
  email_sent_at timestamptz;
begin
  if normalized_email is null
    or length(normalized_email) > 320
    or normalized_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
    or nullif(btrim(p_checkout_session_id), '') is null
    or p_product_code not in ('g_track', 'cognitive_control_coach', 'complete_cognitive_route') then
    raise exception 'Invalid IQ Coach checkout grant';
  end if;

  insert into private.iq_coach_checkout_purchases as purchases (
    checkout_session_id,
    email,
    purchased_product_code,
    stripe_customer_id,
    purchased_at,
    updated_at
  ) values (
    p_checkout_session_id,
    normalized_email,
    p_product_code,
    nullif(btrim(p_stripe_customer_id), ''),
    purchase_time,
    now()
  )
  on conflict (checkout_session_id) do update
  set
    stripe_customer_id = coalesce(excluded.stripe_customer_id, purchases.stripe_customer_id),
    updated_at = now()
  returning access_email_sent_at into email_sent_at;

  entitlement_codes := case p_product_code
    when 'complete_cognitive_route' then array['g_track', 'cognitive_control_coach']
    else array[p_product_code]
  end;

  foreach entitlement_code in array entitlement_codes loop
    insert into private.iq_coach_access_grants as grants (
      email,
      product_code,
      status,
      source,
      source_reference,
      stripe_customer_id,
      purchased_at,
      expires_at,
      updated_at
    ) values (
      normalized_email,
      entitlement_code,
      'active',
      'stripe_checkout',
      p_checkout_session_id,
      nullif(btrim(p_stripe_customer_id), ''),
      purchase_time,
      purchase_time + interval '1 year',
      now()
    )
    on conflict (email, product_code) do update
    set
      status = 'active',
      source = 'stripe_checkout',
      source_reference = excluded.source_reference,
      stripe_customer_id = coalesce(excluded.stripe_customer_id, grants.stripe_customer_id),
      purchased_at = excluded.purchased_at,
      expires_at = case
        when grants.expires_at is null then null
        when grants.source_reference = excluded.source_reference then greatest(grants.expires_at, excluded.expires_at)
        else greatest(grants.expires_at, excluded.purchased_at) + interval '1 year'
      end,
      updated_at = now();
  end loop;

  return email_sent_at is null;
end;
$$;

create or replace function public.mark_iq_coach_access_email_sent(
  p_checkout_session_id text
)
returns void
language sql
security definer
set search_path = ''
as $$
  update private.iq_coach_checkout_purchases
  set access_email_sent_at = coalesce(access_email_sent_at, now()), updated_at = now()
  where checkout_session_id = p_checkout_session_id;
$$;

create or replace function public.claim_my_iq_coach_access()
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  normalized_email text;
begin
  if current_user_id is null then
    return false;
  end if;

  select lower(btrim(email)) into normalized_email
  from auth.users
  where id = current_user_id;

  if normalized_email is null then
    return false;
  end if;

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
    current_user_id,
    grants.product_code,
    'active',
    grants.source,
    grants.source_reference,
    coalesce(grants.purchased_at, grants.created_at),
    grants.expires_at,
    jsonb_build_object('grant_id', grants.id),
    now()
  from private.iq_coach_access_grants as grants
  where grants.email = normalized_email
    and grants.status = 'active'
    and (grants.expires_at is null or grants.expires_at > now())
  on conflict (user_id, product_code) do update
  set
    status = 'active',
    source = excluded.source,
    source_reference = excluded.source_reference,
    granted_at = excluded.granted_at,
    expires_at = case
      when entitlements.expires_at is null or excluded.expires_at is null then null
      else greatest(entitlements.expires_at, excluded.expires_at)
    end,
    metadata = excluded.metadata,
    updated_at = now();

  update private.iq_coach_access_grants
  set claimed_user_id = current_user_id,
      claimed_at = coalesce(claimed_at, now()),
      updated_at = now()
  where email = normalized_email
    and status = 'active'
    and (expires_at is null or expires_at > now());

  return exists (
    select 1 from public.user_entitlements
    where user_id = current_user_id
      and status = 'active'
      and (expires_at is null or expires_at > now())
  );
end;
$$;

revoke all on function public.record_iq_coach_checkout(text, text, text, text, timestamptz) from public;
revoke all on function public.mark_iq_coach_access_email_sent(text) from public;
revoke all on function public.claim_my_iq_coach_access() from public;
grant execute on function public.record_iq_coach_checkout(text, text, text, text, timestamptz) to service_role;
grant execute on function public.mark_iq_coach_access_email_sent(text) to service_role;
grant execute on function public.claim_my_iq_coach_access() to authenticated;
