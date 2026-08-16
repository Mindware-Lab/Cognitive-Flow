# Cognitive Control Coach Supabase

This folder intentionally does not carry forward the copied Attention Coach Edge Functions or `attention_*` migrations.

CCC v1 uses a hybrid shared schema:

- Shared tables: `coach_sessions`, `coach_trials`, `coach_events`, `coach_protocol_assignments`
- CCC state table: `cognitive_control_progress`

Implemented service-role Edge Functions:

- `submit-coach-block`: idempotently stores variable-length practice and guided blocks, trial-level value data, validity flags and transition events.
- `sync-coach-progress`: loads and saves the versioned CCC journey state.
- `finalize-coach-session`: marks a stored session complete and records its summary.
- `create-iq-coach-checkout-session`: creates a server-priced Stripe Checkout Session for one of the three live IQ Mindware products.
- `iq-coach-stripe-webhook`: verifies Stripe events and records 12-month email access grants before sending the Supabase sign-in code.

## IQ Coach paid access

Apply `202608160001_iq_coach_suite_access.sql`, then deploy both commerce functions to the shared Coach Supabase project. Configure these Edge Function secrets:

- `STRIPE_SECRET_KEY`
- `STRIPE_G_TRACK_PRICE_ID=price_1U52vZAZLCi6B66bnR6knpcI`
- `STRIPE_COGNITIVE_CONTROL_COACH_PRICE_ID=price_1U535eAZLCi6B66bpMjbkJ0V`
- `STRIPE_COMPLETE_COGNITIVE_ROUTE_PRICE_ID=price_1U538PAZLCi6B66bYSYg376D`
- `STRIPE_IQ_COACH_WEBHOOK_SECRET`
- `G_TRACK_APP_URL=https://www.iqmindware.com/g-track-test-battery/`
- `COGNITIVE_CONTROL_COACH_APP_URL=https://www.iqmindware.com/cognitive-control-coach/`

Create a Stripe webhook endpoint for `iq-coach-stripe-webhook` and subscribe it to `checkout.session.completed` and `checkout.session.async_payment_succeeded`. Deploy this function without JWT verification (`supabase/config.toml` contains the matching setting), because Stripe authenticates with its signature rather than a Supabase token. The webhook, not the browser return page, grants access. It retrieves the Checkout Session from Stripe and verifies the canonical Price ID before writing a grant.

Entitlement mapping:

| Purchased product | 12-month entitlements |
| --- | --- |
| G Track Measurement Pass | `g_track` |
| Cognitive Control Coach Programme | `cognitive_control_coach` |
| Complete Cognitive Route | `g_track` and `cognitive_control_coach` |

In Supabase Dashboard, open **Authentication > Email Templates > Magic Link**. Use the subject `Your IQ Mindware sign-in code` and copy the HTML from `email-templates/iq-mindware-sign-in-code.html`. The `{{ .Token }}` placeholder is required because both apps accept the six-digit email code. Add both production URLs to **Authentication > URL Configuration > Redirect URLs**.

Before live sales, configure **Authentication > Emails > SMTP Settings** with a production email provider and an IQ Mindware sender address. Supabase's built-in sender is for limited testing, not customer delivery.

In Stripe Dashboard, enable **Settings > Business > Customer emails > Successful payments** and set `admin@iqmindware.com` as the support email under **Business details > Public details**. Stripe receipts confirm payment; the Supabase email supplies the activation code and product links.

Website purchase buttons should call `create-iq-coach-checkout-session` with one of `g_track`, `cognitive_control_coach`, or `complete_cognitive_route`. Do not create separate Stripe Payment Links: the server-created Checkout Session carries the verified product code, canonical Price ID and product-specific return URL used by the entitlement webhook.

Set `VITE_IQ_COACH_COMMERCE_ENABLED=true` only after the migration, functions, secrets and webhook have been tested. While the flag is false, existing live access is unchanged. The private `?tester=optic-flow` route intentionally bypasses the commerce gate.

For a non-Stripe beta tester, insert an `active` row into `private.iq_coach_access_grants` with `source = 'beta'` and the appropriate `product_code`. Their entitlement is claimed only after they authenticate with that exact email address.

Apply migrations in timestamp order. `202608120001_cognitive_control_dual_estimand.sql` adds the v0.3 signal/policy/transfer separation, quota validity and frame-timing fields without rewriting the shared schema.

For the v0.3 forced-choice Attention protocol, `is_valid_decision` is true only for an answer. A timing-clean deadline omission is stored with `counts_toward_quota = true` and `is_valid_decision = false`; interrupted or invalid observations have both flags false and are replaced by the client.

Clients authenticate with the normal Supabase session. The functions validate the user and perform writes with the service role; authenticated clients retain read-own access only. Existing Attention Coach and WM Coach cloud data remain in their legacy app schemas and are not converted into CCC progression credit.
