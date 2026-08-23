import { describe, expect, it } from "vitest";
import {
  CCC_BRIDGE_MOVE_OPTIONS,
  bridgeActionForMove,
  bridgeCueOptions,
  bridgeSessionEndModel,
  bridgeWelcomeProbeModel,
  changedContextOptions,
  moveForCueOption,
} from "../src/cccBridgeExperience";
import { createInitialBridgeState } from "../src/cccBridgeProgression";

describe("CCC Bridge experience", () => {
  it("uses the four stable user-facing control moves", () => {
    expect(CCC_BRIDGE_MOVE_OPTIONS.map((item) => item.label)).toEqual(["Find", "Hold", "Update", "Act"]);
    expect(CCC_BRIDGE_MOVE_OPTIONS.map((item) => item.definition)).toEqual([
      "Identify what matters now.",
      "Keep what matters available.",
      "Change what needs changing; keep what still fits.",
      "When you have enough, take the next useful step.",
    ]);
  });

  it("changes support rather than inventing new moves at each Bridge level", () => {
    const state = createInitialBridgeState();
    expect(bridgeSessionEndModel(state).kind).toBe("guided_mission");
    expect(bridgeSessionEndModel(state).showMoveDefinition).toBe(true);

    state.level = "b2_retrieval";
    expect(bridgeSessionEndModel(state).kind).toBe("retrieval_mission");
    expect(bridgeSessionEndModel(state).showMoveDefinition).toBe(false);

    state.level = "b4_faded";
    expect(bridgeSessionEndModel(state).kind).toBe("no_new_mission");

    state.level = "b6_delayed";
    expect(bridgeSessionEndModel(state).kind).toBe("no_new_delayed_mission");
  });

  it("asks faded and delayed questions before revealing move names", () => {
    const state = createInitialBridgeState();
    state.level = "b4_faded";
    const faded = bridgeWelcomeProbeModel(state);
    expect(faded.kind).toBe("faded");
    expect(faded.revealMoveOnlyAfterPositiveResponse).toBe(true);
    expect(faded.title).not.toMatch(/Find|Hold|Update|Act/);

    state.level = "b6_delayed";
    const delayed = bridgeWelcomeProbeModel(state);
    expect(delayed.kind).toBe("delayed");
    expect(delayed.revealMoveOnlyAfterPositiveResponse).toBe(true);
    expect(delayed.title).not.toMatch(/Find|Hold|Update|Act/);
  });

  it("offers user-relevant cue classes while keeping cue and move separate", () => {
    const cues = bridgeCueOptions("ai_assisted");
    expect(cues).toHaveLength(4);
    expect(cues[0].detail).toContain("AI response");
    expect(moveForCueOption("cue_update")).toBe("update");
    expect(moveForCueOption("unknown")).toBeNull();
  });

  it("changes context without changing the selected move", () => {
    const targets = changedContextOptions("focused_work");
    expect(targets.map((item) => item.workflow)).not.toContain("focused_work");
    expect(targets).toHaveLength(3);
    expect(bridgeActionForMove("hold", "study")).toContain("recover the result");
    expect(bridgeActionForMove("hold", "ai_assisted")).toContain("recover the result");
  });
});
