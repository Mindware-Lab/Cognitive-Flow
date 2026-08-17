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
    sessionId: "session-3",
    sessionKind: "p1a_consolidation",
    sessionNumber: 3,
    blockIndex: 1,
    ...overrides,
  };
}

describe("session-level strategic themes", () => {
  it("keeps one theme across the two P0 foundation blocks while changing the block angle", () => {
    const signal = resolveRealLifePracticePreset(context({
      sessionKind: "p0_foundation",
      sessionNumber: 1,
      phase: "signal_anchor",
      transitionKind: "baseline_stabilization",
      blockIndex: 1,
    }));
    const relative = resolveRealLifePracticePreset(context({
      sessionKind: "p0_foundation",
      sessionNumber: 1,
      phase: "arrow_rel_stabilisation",
      transitionKind: "reference_frame_extension",
      blockIndex: 2,
    }));

    expect(signal.themeFamilyId).toBe("foundation_focus");
    expect(relative.themeFamilyId).toBe("foundation_focus");
    expect(signal.themeId).toBe(relative.themeId);
    expect(signal.themeTitle).toBe(relative.themeTitle);
    expect(signal.angleTitle).not.toBe(relative.angleTitle);
    expect(signal.example).not.toBe(relative.example);
  });

  it("keeps one theme through a P1b first-contact session even when later blocks are labelled recovery", () => {
    const phases = [
      ["p1b_wm_flow_first_contact", "wm_carrier_transfer", 1],
      ["p1b_wm_flow_recovery", "baseline_stabilization", 2],
      ["p1b_wm_flow_recovery", "baseline_stabilization", 3],
      ["p1b_wm_flow_recovery", "baseline_stabilization", 4],
    ] as const;
    const presets = phases.map(([phase, transitionKind, blockIndex]) => resolveRealLifePracticePreset(context({
      sessionKind: "p1b_wm_bridge",
      sessionNumber: 9,
      sessionAnchorPhase: "p1b_wm_flow_first_contact",
      phase,
      operator: "relational_wm",
      transitionKind,
      blockIndex,
    })));

    expect(new Set(presets.map((preset) => preset.themeFamilyId))).toEqual(new Set(["relations_across_change"]));
    expect(new Set(presets.map((preset) => preset.themeId)).size).toBe(1);
    expect(new Set(presets.map((preset) => preset.themeTitle)).size).toBe(1);
    expect(new Set(presets.map((preset) => preset.angleTitle)).size).toBe(4);
  });

  it("keeps one P1c theme while Find, Hold, Update and Act provide different block angles", () => {
    const phases = [
      ["p1c_attention_entry", "attention", "return_to_now", 1],
      ["p1c_wm_hold", "relational_wm", "operator_integration", 2],
      ["p1c_attention_reentry", "attention", "return_to_now", 3],
      ["p1c_operator_mix", "relational_wm", "operator_integration", 4],
    ] as const;
    const presets = phases.map(([phase, operator, transitionKind, blockIndex]) => resolveRealLifePracticePreset(context({
      sessionKind: "p1c_operator_integration",
      sessionNumber: 12,
      phase,
      operator,
      transitionKind,
      blockIndex,
    })));

    expect(new Set(presets.map((preset) => preset.themeId)).size).toBe(1);
    expect(new Set(presets.map((preset) => preset.themeTitle)).size).toBe(1);
    expect(new Set(presets.map((preset) => preset.angleTitle)).size).toBe(4);
    expect(presets.map((preset) => preset.move)).toEqual(["find", "hold", "update", "act"]);
  });

  it("rotates equivalent theme variants when a user needs more sessions at the same progression point", () => {
    const first = resolveRealLifePracticePreset(context({ phase: "p1a_flow_recovery", sessionNumber: 6 }));
    const second = resolveRealLifePracticePreset(context({ phase: "p1a_flow_recovery", sessionNumber: 7 }));
    const fifth = resolveRealLifePracticePreset(context({ phase: "p1a_flow_recovery", sessionNumber: 10 }));

    expect(first.themeFamilyId).toBe("adapt_locally");
    expect(second.themeFamilyId).toBe("adapt_locally");
    expect(first.themeId).not.toBe(second.themeId);
    expect(fifth.themeId).toBe(first.themeId);
  });

  it("always supplies a concrete workflow example alongside the framework move", () => {
    const workflows = ["focused_work", "study", "ai_assisted", "everyday_planning"] as const;
    for (const workflow of workflows) {
      const preset = resolveRealLifePracticePreset(context({
        workflow,
        sessionKind: "p1b_wm_bridge",
        phase: "p1b_wm_arrow_stabilisation",
        operator: "relational_wm",
        transitionKind: "wm_introduction",
        blockIndex: 2,
      }));
      expect(preset.example.length).toBeGreaterThan(40);
      expect(preset.explanation.length).toBeGreaterThan(60);
      expect(preset.missionCue.length).toBeGreaterThan(15);
      expect(preset.missionAction.length).toBeGreaterThan(30);
    }
  });
});

describe("one session-end implementation intention", () => {
  it("stores versioned theme identifiers without duplicating user-facing copy", () => {
    const sourceContext = context({
      workflow: "ai_assisted",
      sessionKind: "p1c_operator_integration",
      sessionNumber: 14,
      phase: "p1c_operator_mix",
      operator: "relational_wm",
      transitionKind: "operator_integration",
      blockIndex: 4,
    });
    const preset = resolveRealLifePracticePreset(sourceContext);
    const mission = createRealLifePracticeMission(
      preset,
      sourceContext,
      "session-14",
      new Date("2026-08-17T12:00:00.000Z"),
      "mission-1",
    );

    expect(mission.presetVersion).toBe(CCC_REAL_LIFE_PRESET_VERSION);
    expect(mission.themeFamilyId).toBe(preset.themeFamilyId);
    expect(mission.themeId).toBe(preset.themeId);
    expect(mission.sessionNumber).toBe(14);
    expect(mission.blockIndex).toBe(4);
    expect(mission.status).toBe("pending");
    expect(mission.outcome).toBeNull();
    expect(mission).not.toHaveProperty("themeTitle");
    expect(mission).not.toHaveProperty("angleTitle");
    expect(mission).not.toHaveProperty("example");
    expect(mission).not.toHaveProperty("missionCue");
    expect(mission).not.toHaveProperty("missionAction");
    expect(realLifePracticePresetForMission(mission)).toMatchObject({
      id: preset.id,
      themeId: preset.themeId,
      themeTitle: preset.themeTitle,
      missionCue: preset.missionCue,
      missionAction: preset.missionAction,
    });
  });

  it("keeps block reconnects explanatory and reserves cue-action commitment for session completion", () => {
    const mainSource = readFileSync(new URL("../src/main.ts", import.meta.url), "utf8");
    expect(mainSource).toContain("Today's theme");
    expect(mainSource).toContain("One practical example");
    expect(mainSource).not.toContain("Translate this block into one real-life move.");
    expect(mainSource).toContain("If this happens");
    expect(mainSource).toContain("Then I’ll");
    expect(mainSource).toContain("sessionAnchorPhase");
  });

  it("requires an explicit choice before a pending mission can be replaced", () => {
    const mainSource = readFileSync(new URL("../src/main.ts", import.meta.url), "utf8");
    expect(mainSource).toContain('data-action="keep-real-life-practice"');
    expect(mainSource).toContain('data-action="replace-real-life-practice"');
    expect(mainSource).toContain("state.currentMission?.status === \"pending\" && !replacePending");
    expect(mainSource).toContain("commitRealLifePractice(true)");
  });
});

describe("commerce, scoring and authentication isolation", () => {
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
    expect(mainSource).toContain("scoreAffecting: false");
  });
});
