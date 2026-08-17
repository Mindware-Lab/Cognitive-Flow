import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  CCC_REAL_LIFE_PRESET_VERSION,
  createRealLifePracticeMission,
  realLifePracticePresetForMission,
  resolveRealLifePracticePreset,
} from "../src/cccRealLifePractice";
import type { CccRealLifePracticeContext } from "../src/cccRealLifePractice";

function context(overrides: Partial<CccRealLifePracticeContext> = {}): CccRealLifePracticeContext {
  return {
    workflow: "focused_work",
    operator: "attention",
    transitionKind: "baseline_stabilization",
    phase: "p1a_arrow_stabilisation",
    strategyDirection: "well_balanced",
    ...overrides,
  };
}

describe("real-life practice resolver", () => {
  it("uses a workflow-specific baseline move when training does not demand an override", () => {
    expect(resolveRealLifePracticePreset(context({ workflow: "focused_work" })).move).toBe("find");
    expect(resolveRealLifePracticePreset(context({ workflow: "study" })).move).toBe("update");
    expect(resolveRealLifePracticePreset(context({ workflow: "ai_assisted" })).move).toBe("hold");
    expect(resolveRealLifePracticePreset(context({ workflow: "everyday_planning" })).move).toBe("act");
  });

  it("maps relational working memory to Hold", () => {
    const result = resolveRealLifePracticePreset(context({ operator: "relational_wm" }));
    expect(result.move).toBe("hold");
    expect(result.action).toContain("GOAL · CONSTRAINT · NEXT");
  });

  it("maps changed wrappers to Update", () => {
    expect(resolveRealLifePracticePreset(context({ transitionKind: "carrier_transfer" })).move).toBe("update");
    expect(resolveRealLifePracticePreset(context({ transitionKind: "operator_integration" })).move).toBe("update");
  });

  it("maps delayed return to Act", () => {
    expect(resolveRealLifePracticePreset(context({ phase: "p1a_delayed_recheck" })).move).toBe("act");
    expect(resolveRealLifePracticePreset(context({ transitionKind: "return_to_now" })).move).toBe("act");
  });

  it("uses attention strategy feedback for Find versus Act", () => {
    expect(resolveRealLifePracticePreset(context({ strategyDirection: "slow_down" })).move).toBe("find");
    expect(resolveRealLifePracticePreset(context({ strategyDirection: "speed_up" })).move).toBe("act");
  });
});

describe("real-life practice persistence", () => {
  it("stores identifiers and response state rather than duplicated prompt copy", () => {
    const sourceContext = context({ workflow: "ai_assisted", strategyDirection: "speed_up" });
    const preset = resolveRealLifePracticePreset(sourceContext);
    const mission = createRealLifePracticeMission(
      preset,
      sourceContext,
      "session-1",
      new Date("2026-08-17T12:00:00.000Z"),
      "mission-1",
    );

    expect(mission.presetVersion).toBe(CCC_REAL_LIFE_PRESET_VERSION);
    expect(mission.status).toBe("pending");
    expect(mission.outcome).toBeNull();
    expect(mission.deferredCount).toBe(0);
    expect(mission).not.toHaveProperty("title");
    expect(mission).not.toHaveProperty("cue");
    expect(mission).not.toHaveProperty("action");
    expect(realLifePracticePresetForMission(mission)).toMatchObject({
      id: preset.id,
      move: preset.move,
      title: preset.title,
      action: preset.action,
    });
  });
});

describe("commerce and authentication isolation", () => {
  it("keeps the real-life module independent of Stripe, entitlement and auth code", () => {
    const realLifeSource = readFileSync(new URL("../src/cccRealLifePractice.ts", import.meta.url), "utf8");
    expect(realLifeSource).not.toContain("supabaseClient");
    expect(realLifeSource).not.toContain("Stripe");
    expect(realLifeSource).not.toContain("entitlement");
  });

  it("retains the production checkout, email sign-in and entitlement access hooks in main", () => {
    const mainSource = readFileSync(new URL("../src/main.ts", import.meta.url), "utf8");
    expect(mainSource).toContain("createIqCoachCheckoutSession");
    expect(mainSource).toContain("resolveIqCoachAccess");
    expect(mainSource).toContain("sendEmailSignInLink");
    expect(mainSource).toContain("verifyEmailSignInCode");
    expect(mainSource).toContain('data-action="start-product-checkout"');
    expect(mainSource).toContain("Use the email address from checkout.");
  });
});
