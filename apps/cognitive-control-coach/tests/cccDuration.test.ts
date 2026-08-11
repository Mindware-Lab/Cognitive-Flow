import { describe, expect, it } from "vitest";
import {
  CCC_DURATION_ASSUMPTIONS,
  CCC_GUIDED_MANUAL_SCREEN_COUNT,
  CCC_SESSION_DURATION_LABEL,
  estimateCccSessionDuration,
} from "../src/cccDuration";
import { createP0AttentionCarrierTransferPlan } from "../src/cccGenerator";

describe("CCC session-duration planning model", () => {
  const plan = createP0AttentionCarrierTransferPlan({ seed: "duration-model", regimePairIndex: 0 });

  it("uses the actual 24-signal and 96-policy observation schedule", () => {
    expect(plan.trials.filter((trial) => trial.estimand === "signal_capacity")).toHaveLength(24);
    expect(plan.trials.filter((trial) => trial.estimand !== "signal_capacity")).toHaveLength(96);
    expect(CCC_GUIDED_MANUAL_SCREEN_COUNT).toBe(36);
  });

  it("reports transparent fast, typical and deliberate planning scenarios", () => {
    const estimates = (["fast", "typical", "deliberate"] as const)
      .map((scenario) => estimateCccSessionDuration(plan, scenario));
    expect(estimates.map((estimate) => estimate.totalMinutes)).toEqual([8.2, 11.6, 16.6]);
    expect(estimates[0].totalMs).toBeLessThan(estimates[1].totalMs);
    expect(estimates[1].totalMs).toBeLessThan(estimates[2].totalMs);
    expect(CCC_DURATION_ASSUMPTIONS.typical.policyDecisionMs).toBe(1250);
    expect(CCC_SESSION_DURATION_LABEL).toBe("About 10–15 minutes");
  });
});
