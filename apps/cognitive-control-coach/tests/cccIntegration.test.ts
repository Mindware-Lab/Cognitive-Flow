import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import mainSource from "../src/main.ts?raw";
import submitFunction from "../supabase/functions/submit-coach-block/index.ts?raw";
import syncFunction from "../supabase/functions/sync-coach-progress/index.ts?raw";
import finaliseFunction from "../supabase/functions/finalize-coach-session/index.ts?raw";
import { EVIDENCE_BOUNDARY_COPY, PHASE_COPY, REGIME_COPY, WORKFLOW_CHOICES, reconnectAction } from "../src/cccCopy";

const appStyles = readFileSync(new URL("../src/cccStyles.css", import.meta.url), "utf8");
const sharedTokens = readFileSync(new URL("../../../UX/iqmindware-app-design-system/tokens.css", import.meta.url), "utf8");

describe("CCC playable integration", () => {
  it("uses the CCC runtime rather than the copied Attention Coach task", () => {
    expect(mainSource).toContain('from "./cccGenerator"');
    expect(mainSource).toContain('from "./cccValue"');
    expect(mainSource).toContain("createP0AttentionCarrierTransferPlan");
    expect(mainSource).toContain("createCccReplacementTrial");
    expect(mainSource).toContain("startAmbiguousSphere");
    expect(mainSource).not.toContain('from "./generator"');
    expect(mainSource).not.toContain("Binding Focus");
    expect(mainSource).not.toContain("Improves focus");
    expect(mainSource).not.toContain("Transferable cognitive skill reached");
  });

  it("keeps consumer copy plain, workflow-centred and evidence-bounded", () => {
    const visibleCopy = JSON.stringify({
      phases: PHASE_COPY,
      conditions: REGIME_COPY,
      workflows: WORKFLOW_CHOICES,
      reconnect: reconnectAction("ai_assisted"),
      boundary: EVIDENCE_BOUNDARY_COPY,
    });
    for (const technicalTerm of ["carrier transfer", "reference frame", "entropy", "operator integration", "valid observation"]) {
      expect(visibleCopy.toLowerCase()).not.toContain(technicalTerm);
    }
    expect(visibleCopy).toContain("AI-assisted work");
    expect(visibleCopy).toContain("workflow");
    expect(visibleCopy).toContain("an in-app score does not establish a wider benefit");
  });

  it("uses the shared IQ Mindware app identity and accessible semantic colour roles", () => {
    expect(appStyles).toContain("@fontsource-variable/manrope/files/manrope-latin-wght-normal.woff2");
    expect(mainSource).toContain("iqmindware-app-design-system/tokens.css");
    expect(mainSource).toContain('aria-label="Journey completion"');
    expect(appStyles).toContain("var(--iqm-cyan)");
    expect(appStyles).toContain("var(--iqm-accumulate-text)");
    expect(appStyles).toContain("var(--iqm-commit-text)");
    expect(sharedTokens).toContain("--iqm-evidence: #ccff66");
    expect(sharedTokens).toContain("--iqm-font-sans");
  });

  it("provides the three authenticated shared-schema functions used by the browser", () => {
    expect(submitFunction).toContain('from("coach_sessions")');
    expect(submitFunction).toContain('from("coach_trials")');
    expect(submitFunction).toContain('from("coach_events")');
    expect(submitFunction).toContain("valid_for_progression");
    expect(syncFunction).toContain('from("cognitive_control_progress")');
    expect(finaliseFunction).toContain('status: "completed"');
    expect(finaliseFunction).toContain('from("coach_events")');
    expect(finaliseFunction).toContain("client_event_id");
  });
});
