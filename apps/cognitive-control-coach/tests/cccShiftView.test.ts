import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { CCC_SHIFT_VIEW } from "../src/cccConfig";
import { createP0AttentionCarrierTransferPlan } from "../src/cccGenerator";
import { createProgrammeSessionPlan } from "../src/cccProgrammeGenerator";
import { CCC_SHIFT_VIEW_RENDER_SETTINGS, createSpherePoints } from "../src/cccShiftView";
import type { CccSessionPlan } from "../src/cccTypes";

function pulseBlocks(plan: CccSessionPlan) {
  return plan.blocks.filter((block) => block.shiftViewBefore);
}

function expectOnlyFirstContactSwaps(plan: CccSessionPlan, expectedCount: number) {
  const pulses = pulseBlocks(plan);
  expect(pulses).toHaveLength(expectedCount);
  for (const block of pulses) {
    expect(block.practice).toBe(false);
    expect(block.diagnostic).toBe(true);
    expect(block.sourceWrapperId).not.toBeNull();
    expect(block.wrappers).toHaveLength(1);
    expect(block.wrappers[0]).not.toBe(block.sourceWrapperId);
    expect(["carrier_transfer", "wm_carrier_transfer"]).toContain(block.transitionKind);
    expect(block.phase).not.toContain("delayed");
    expect(block.phase).not.toContain("mix");
  }
}

describe("CCC Shift the View protocol", () => {
  it("uses a fixed sparse, slow, soft-blue 30-second display", () => {
    expect(CCC_SHIFT_VIEW.durationMs).toBe(30_000);
    expect(CCC_SHIFT_VIEW.scoreAffecting).toBe(false);
    expect(CCC_SHIFT_VIEW_RENDER_SETTINGS).toMatchObject({
      dotCount: 120,
      dotRadiusPx: 2.2,
      rotationPeriodMs: 7000,
      dotLifeMs: 640,
      dotColours: [
        "rgba(39, 100, 183, 0.82)",
        "rgba(102, 204, 51, 0.84)",
        "rgba(204, 255, 102, 0.96)",
      ],
      backgroundColour: "#f7f9fb",
    });
    expect(createSpherePoints()).toHaveLength(120);
  });

  it("appears only immediately before genuine first-contact wrapper swaps", () => {
    expectOnlyFirstContactSwaps(createP0AttentionCarrierTransferPlan({ sessionId: "p0-pulse", seed: "p0-pulse" }), 1);
    expectOnlyFirstContactSwaps(createProgrammeSessionPlan({
      sessionId: "p1a-pulse", seed: "p1a-pulse", programmeRunId: "programme", programmeSessionNumber: 2,
      kind: "p1a_consolidation", regimePair: ["clear_sprint", "deep_check"], wmLevel: 1,
    }), 1);
    expectOnlyFirstContactSwaps(createProgrammeSessionPlan({
      sessionId: "p1b-pulse", seed: "p1b-pulse", programmeRunId: "programme", programmeSessionNumber: 3,
      kind: "p1b_wm_bridge", regimePair: ["clear_sprint", "deep_check"], wmLevel: 1,
      wmPairLevels: [1, 1], wmWrapperStage: "flow_first_contact",
    }), 1);
    expectOnlyFirstContactSwaps(createProgrammeSessionPlan({
      sessionId: "delayed-no-pulse", seed: "delayed-no-pulse", programmeRunId: "programme", programmeSessionNumber: 4,
      kind: "p1a_delayed_recheck", regimePair: ["clear_sprint", "deep_check"], wmLevel: 1,
    }), 0);
    expectOnlyFirstContactSwaps(createProgrammeSessionPlan({
      sessionId: "integration-no-pulse", seed: "integration-no-pulse", programmeRunId: "programme", programmeSessionNumber: 5,
      kind: "p1c_operator_integration", regimePair: ["clear_sprint", "deep_check"], wmLevel: 2,
    }), 0);
  });

  it("instructs active whole-sphere grouping and a Space response for every reversal", () => {
    const source = readFileSync(new URL("../src/main.ts", import.meta.url), "utf8");
    expect(source).toContain("Actively group the dots into one rotating sphere.");
    expect(source).toContain("two flat sheets");
    expect(source).toContain("Count only whole-object reversals");
    expect(source).toContain('event.code === "Space"');
    expect(source).toContain('recordShiftReversal("keyboard")');
    expect(source).toContain('reversalCount: shiftReversalCount');
  });
});
