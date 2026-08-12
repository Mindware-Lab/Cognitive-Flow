import { describe, expect, it } from "vitest";
import {
  CCC_DURATION_ASSUMPTIONS,
  CCC_GUIDED_MANUAL_SCREEN_COUNT,
  CCC_SESSION_DURATION_LABEL,
  estimateCccSessionDuration,
  guidedManualScreenCount,
} from "../src/cccDuration";
import { createP0AttentionCarrierTransferPlan } from "../src/cccGenerator";
import { createProgrammeSessionPlan } from "../src/cccProgrammeGenerator";

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
    expect(estimates.map((estimate) => estimate.totalMinutes)).toEqual([8.4, 11.8, 16.8]);
    expect(estimates[0].totalMs).toBeLessThan(estimates[1].totalMs);
    expect(estimates[1].totalMs).toBeLessThan(estimates[2].totalMs);
    expect(CCC_DURATION_ASSUMPTIONS.typical.policyDecisionMs).toBe(1250);
    expect(CCC_SESSION_DURATION_LABEL).toBe("About 10–15 minutes");
  });

  it("uses the fixed five-second item cadence for relational-memory sessions", () => {
    const wmPlan = createProgrammeSessionPlan({
      sessionId: "duration-wm",
      seed: "duration-wm",
      programmeRunId: "duration-programme",
      programmeSessionNumber: 6,
      kind: "p1b_wm_bridge",
      regimePair: ["clear_sprint", "deep_check"],
      wmLevel: 1,
    });
    const wmItems = wmPlan.trials.filter((trial) => trial.estimand === "relational_wm").length;
    const estimate = estimateCccSessionDuration(wmPlan, "typical");
    expect(wmItems).toBeGreaterThan(0);
    expect(guidedManualScreenCount(wmPlan)).toBe(wmPlan.blocks.length * 5 + 2);
    expect(estimate.automatedTaskMs).toBeGreaterThanOrEqual(wmItems * 5000);
  });
});
