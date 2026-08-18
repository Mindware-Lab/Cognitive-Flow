import { describe, expect, it } from "vitest";
import accessMigration from "../supabase/migrations/202608160001_iq_coach_suite_access.sql?raw";
import grandfatherMigration from "../supabase/migrations/202608170001_grandfather_existing_cognitive_control_users.sql?raw";
import legacyAttentionGrandfatherMigration from "../supabase/migrations/202608170003_grandfather_legacy_attention_coach_users.sql?raw";
import checkoutFunction from "../supabase/functions/create-iq-coach-checkout-session/index.ts?raw";
import webhookFunction from "../supabase/functions/iq-coach-stripe-webhook/index.ts?raw";
import functionConfig from "../supabase/config.toml?raw";
import checkoutHandoff from "../public/ccc-checkout-handoff.js?raw";
import appHtml from "../index.html?raw";
import mainSource from "../src/main.ts?raw";
import productionEnvironment from "../.env.production?raw";

describe("IQ Coach product checkout-first access", () => {
  it("keeps private email grants separate from public user entitlements", () => {
    expect(accessMigration).toContain("private.iq_coach_checkout_purchases");
    expect(accessMigration).toContain("private.iq_coach_access_grants");
    expect(accessMigration).toContain("public.user_entitlements");
    expect(accessMigration).toContain("public.user_data_preferences");
    expect(accessMigration).toContain("revoke all on private.iq_coach_access_grants from public, anon, authenticated");
    expect(accessMigration).toContain("users read own entitlements");
  });

  it("claims by the authenticated user's server-side email", () => {
    expect(accessMigration).toContain("create or replace function public.claim_my_iq_coach_access()");
    expect(accessMigration).toContain("current_user_id uuid := auth.uid()");
    expect(accessMigration).toContain("from auth.users");
    expect(accessMigration).not.toMatch(/claim_my_iq_coach_access\(\s*p_email/i);
  });

  it("maps the Complete Cognitive Route to both 12-month entitlements", () => {
    expect(accessMigration).toContain("when 'complete_cognitive_route' then array['g_track', 'cognitive_control_coach']");
    expect(accessMigration).toContain("purchase_time + interval '1 year'");
    expect(accessMigration).toContain("product_code in ('g_track', 'cognitive_control_coach')");
  });

  it("uses the three server-controlled Stripe Prices and hosted Checkout", () => {
    expect(checkoutFunction).toContain('Deno.env.get("STRIPE_G_TRACK_PRICE_ID")');
    expect(checkoutFunction).toContain('Deno.env.get("STRIPE_COGNITIVE_CONTROL_COACH_PRICE_ID")');
    expect(checkoutFunction).toContain('Deno.env.get("STRIPE_COMPLETE_COGNITIVE_ROUTE_PRICE_ID")');
    expect(checkoutFunction).toContain('Deno.env.get("G_TRACK_APP_URL")');
    expect(checkoutFunction).toContain('Deno.env.get("COGNITIVE_CONTROL_COACH_APP_URL")');
    expect(checkoutFunction).toContain('"line_items[0][price]": priceId');
    expect(checkoutFunction).toContain('"custom_text[submit][message]"');
    expect(checkoutFunction).toContain('checkoutUrl.hostname !== "checkout.stripe.com"');
    expect(checkoutFunction).not.toContain("unit_amount");
    expect(functionConfig).toContain("[functions.create-iq-coach-checkout-session]\nverify_jwt = false");
  });

  it("treats the verified webhook as the authority for normal and authorised campaign prices", () => {
    expect(webhookFunction).toContain("verifiesStripeSignature");
    expect(webhookFunction).toContain("verifiedCheckoutSession");
    expect(webhookFunction).toContain('Deno.env.get("STRIPE_COMPLETE_COGNITIVE_ROUTE_PRICE_ID")');
    expect(webhookFunction).toContain("COMPLETE_ROUTE_PROMO_PRICE_IDS");
    expect(webhookFunction).toContain('"price_1U5RaBAZLCi6B66bgtw7tW0q"');
    expect(webhookFunction).toContain("allowedPriceIds.includes(purchasedPriceId)");
    expect(webhookFunction).toContain('session?.payment_status !== "paid"');
    expect(webhookFunction).toContain("lineItems.length !== 1");
    expect(webhookFunction).toContain("session?.metadata?.product_code !== productCode");
    expect(webhookFunction).toContain('supabase.rpc("record_iq_coach_checkout"');
    expect(webhookFunction).toContain("p_product_code: productCode");
  });

  it("gates normal and tester views behind the same production entitlement", () => {
    expect(mainSource).toContain('const testerRequested = new URLSearchParams(window.location.search).get("tester") === "optic-flow"');
    expect(mainSource).toContain("return isIqCoachCommerceEnabled");
    expect(mainSource).toContain('if (testerRequested) view = "tester"');
    expect(mainSource).toContain('next !== "access" && next !== "auth"');
    expect(mainSource).toContain('resolveIqCoachAccess("cognitive_control_coach")');
    expect(mainSource).toContain('data-product-code="cognitive_control_coach"');
    expect(mainSource).toContain('data-product-code="complete_cognitive_route"');
  });

  it("routes paid checkout returns straight to the existing secure code-verification UI", () => {
    expect(appHtml).toContain("ccc-checkout-handoff.js?v=20260818-1");
    expect(checkoutHandoff).toContain('checkoutState !== "complete" && checkoutState !== "access"');
    expect(checkoutHandoff).toContain("[data-action='access-sign-in']");
    expect(checkoutHandoff).toContain('codeInput.id = "ccc-account-code"');
    expect(checkoutHandoff).toContain('verify.dataset.action = "verify-sign-in"');
    expect(checkoutHandoff).toContain("verificationStarted = true");
    expect(checkoutHandoff).not.toContain("suiteAccessStatus");
    expect(checkoutHandoff).not.toContain("user_entitlements");
    expect(mainSource).toContain('const entitlement = await resolveIqCoachAccess("cognitive_control_coach")');
  });

  it("enables the entitlement gate in production builds", () => {
    expect(productionEnvironment).toContain("VITE_IQ_COACH_COMMERCE_ENABLED=true");
  });

  it("grandfathers only existing Cognitive Control Coach cloud users", () => {
    expect(grandfatherMigration).toContain("public.cognitive_control_progress");
    expect(grandfatherMigration).toContain("app_id = 'cognitive_control_coach'");
    expect(grandfatherMigration).toContain("'grandfathered-ccc-cloud-user-20260817'");
    expect(grandfatherMigration).toContain("'beta'");
    expect(grandfatherMigration).toContain("now() + interval '1 year'");
    expect(grandfatherMigration).toContain("on conflict (user_id, product_code) do nothing");
    expect(grandfatherMigration).not.toContain("attention_progress");
    expect(grandfatherMigration).not.toContain("wm_progress");
  });

  it("extends Cognitive Control Coach access to legacy Attention Coach cloud users", () => {
    expect(legacyAttentionGrandfatherMigration).toContain("public.attention_progress_state");
    expect(legacyAttentionGrandfatherMigration).toContain("public.attention_sessions");
    expect(legacyAttentionGrandfatherMigration).toContain("public.attention_user_settings");
    expect(legacyAttentionGrandfatherMigration).toContain("app_id = 'attention_coach'");
    expect(legacyAttentionGrandfatherMigration).toContain("'cognitive_control_coach'");
    expect(legacyAttentionGrandfatherMigration).toContain("'grandfathered-legacy-attention-cloud-user-20260817'");
    expect(legacyAttentionGrandfatherMigration).toContain("on conflict (email, product_code) do update");
    expect(legacyAttentionGrandfatherMigration).toContain("where grants.status = 'active'");
    expect(legacyAttentionGrandfatherMigration).toContain("where entitlements.status = 'active'");
    expect(legacyAttentionGrandfatherMigration).toContain("now() + interval '1 year'");
    expect(legacyAttentionGrandfatherMigration).not.toContain("select id from auth.users");
    expect(legacyAttentionGrandfatherMigration).not.toContain("wm_coach");
  });
});
