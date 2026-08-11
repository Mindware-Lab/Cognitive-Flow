import { describe, expect, it } from "vitest";
import { generateTrial } from "../src/generator";
import { presentationStagesForTrial, ruleCueForTrial, shouldShowRuleCue } from "../src/ruleCue";
import { stimulusTimingForTrial } from "../src/trialTiming";

describe("rule cue timing", () => {
  it("only cues blocks where the response axis can vary", () => {
    expect(shouldShowRuleCue(["arrow_abs", "flow_abs"])).toBe(false);
    expect(shouldShowRuleCue(["arrow_abs", "arrow_rel"])).toBe(true);
    expect(shouldShowRuleCue(["arrow_abs", "flow_abs", "arrow_rel", "flow_rel"])).toBe(true);
  });

  it("maps each trial cue to the active response axis", () => {
    const fixed = generateTrial("session", "block", 0, "ACC", "P1_ARROW_ABS", "flow_abs", false);
    const relative = generateTrial("session", "block", 1, "ACC", "P3_ARROW_REL", "arrow_rel", false);

    expect(ruleCueForTrial(fixed)).toBe("LEFT / RIGHT");
    expect(ruleCueForTrial(relative)).toBe("IN / OUT");
  });

  it("places the cue before fixation without including it in stimulus timing", () => {
    const trial = generateTrial("session", "block", 0, "ACC", "P3_ARROW_REL", "arrow_rel", false, {
      ratio: "5:0",
      exposureMs: 300,
    });
    const stages = presentationStagesForTrial(["arrow_abs", "arrow_rel"], trial);
    const timing = stimulusTimingForTrial(trial, 1420);

    expect(stages.slice(0, 4)).toEqual(["rule_cue", "fixation", "stimulus", "mask"]);
    expect(timing.stimulusStartedAtMs).toBe(1420);
    expect(timing.stimulusEndedAtMs).toBe(1720);
    expect(timing.exposureMsActual).toBe(300);
    expect(timing.actualStimulusFrames).toBe(18);
  });

  it("does not add a cue stage to carrier-only fixed-axis mixing", () => {
    const trial = generateTrial("session", "block", 0, "ACC", "P2_FLOW_ABS", "flow_abs", false);

    expect(presentationStagesForTrial(["arrow_abs", "flow_abs"], trial).slice(0, 3)).toEqual(["fixation", "stimulus", "mask"]);
  });
});
