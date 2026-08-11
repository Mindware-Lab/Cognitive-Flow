import { describe, expect, it } from "vitest";
import {
  classifyWrapperTransition,
  COGNITIVE_CONTROL_STAGE_SEQUENCE,
  flatProgressionSteps,
  isStrictCarrierTransfer,
  progressionStepById,
  switchesOperatorAndWrapperTogether,
} from "../src/cccProgression";

describe("CCC staged progression", () => {
  it("distinguishes carrier transfer from reference-frame extension", () => {
    expect(classifyWrapperTransition("arrow_abs", "flow_abs")).toBe("carrier_transfer");
    expect(classifyWrapperTransition("arrow_rel", "flow_rel")).toBe("carrier_transfer");
    expect(classifyWrapperTransition("arrow_abs", "arrow_rel")).toBe("reference_frame_extension");
    expect(isStrictCarrierTransfer("arrow_abs", "flow_abs")).toBe(true);
    expect(isStrictCarrierTransfer("arrow_abs", "arrow_rel")).toBe(false);
  });

  it("keeps public launch behind the complete Attention to WM to Attention journey", () => {
    expect(COGNITIVE_CONTROL_STAGE_SEQUENCE.map((stage) => stage.id)).toEqual(["P0", "P1a", "P1b", "P1c", "PublicLaunch"]);
    expect(COGNITIVE_CONTROL_STAGE_SEQUENCE.at(-1)?.releaseGate).toBe("public_launch");
    expect(progressionStepById("p1c_return_to_now_attention")?.transitionKind).toBe("return_to_now");
  });

  it("does not switch operator and wrapper at the same progression boundary", () => {
    const steps = flatProgressionSteps();
    for (let index = 1; index < steps.length; index += 1) {
      expect(switchesOperatorAndWrapperTogether(steps[index - 1], steps[index])).toBe(false);
    }
  });
});