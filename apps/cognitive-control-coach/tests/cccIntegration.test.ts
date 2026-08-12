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
    expect(mainSource).toContain("createProgrammeSessionPlan");
    expect(mainSource).toContain("applyCompletedSession");
    expect(mainSource).toContain("adaptSignalTrial");
    expect(mainSource).toContain("buildCccBlockFeedback");
    expect(mainSource).toContain("startAmbiguousSphere");
    expect(mainSource).not.toContain('from "./generator"');
    expect(mainSource).not.toContain("Binding Focus");
    expect(mainSource).not.toContain("Improves focus");
    expect(mainSource).not.toContain("Transferable cognitive skill reached");
    expect(mainSource).not.toContain('data-response="withhold"');
    expect(mainSource).not.toContain("Not sure");
    expect(mainSource).toContain("Five moving dot fields expanding or contracting");
    expect(mainSource).toContain("maskStimulus");
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
    expect(mainSource).toContain('aria-label="Programme completion"');
    expect(appStyles).toContain("var(--iqm-cyan)");
    expect(appStyles).toContain("var(--iqm-accumulate-text)");
    expect(appStyles).toContain("var(--iqm-commit-text)");
    expect(appStyles).toContain("var(--iqm-commit-soft)");
    expect(appStyles).not.toContain("--orange");
    expect(appStyles).not.toContain("rgba(217, 140, 22");
    expect(appStyles).toMatch(/\.ccc-signal-panel\s*\{[\s\S]*?border-color: var\(--control-line\);[\s\S]*?background: var\(--control-soft\);/);
    expect(sharedTokens).toContain("--iqm-evidence: #ccff66");
    expect(sharedTokens).toContain("--iqm-commit: #0b8fdf");
    expect(sharedTokens).toContain("--iqm-commit-soft: rgba(34, 170, 255, 0.07)");
    expect(sharedTokens).toContain("--iqm-font-sans");
  });

  it("shows explicit correct or incorrect outcomes for every answered practice item", () => {
    expect(mainSource).toContain('feedbackResult.scoring.isCorrect ? "Correct" : "Incorrect"');
    expect(mainSource).toContain('taskMode === "practice" ? "Incorrect."');
    expect(mainSource).not.toContain('taskMode === "practice" ? "Not quite."');
  });

  it("paginates long explanations and keeps every state inside the viewport shell", () => {
    for (const view of ["workflow", "practice_guide", "phase_guide", "block_insights", "block_reconnect", "full_transfer", "complete_reconnect"]) {
      expect(mainSource).toContain(`| "${view}"`);
    }
    for (const action of ["show-workflow", "show-practice-guide", "show-phase-guide", "show-block-insights", "show-block-reconnect", "show-full-transfer", "show-complete-reconnect"]) {
      expect(mainSource).toContain(action);
    }
    expect(appStyles).toContain("html,\nbody,\n#app");
    expect(appStyles).toContain("height: calc(100dvh - 32px)");
    expect(appStyles).toContain(".ccc-viewport-view .ccc-footer");
    expect(appStyles).toContain("grid-template-rows: auto auto minmax(0, 1fr) auto auto auto");
    expect(appStyles).toContain("row-gap: clamp(6px, 1.1vh, 10px)");
    expect(appStyles).toMatch(/\.ccc-stimulus-stage\s*\{[\s\S]*?margin: 0 auto;/);
    expect(appStyles).toMatch(/\.ccc-value-panel\s*\{[\s\S]*?position: relative;[\s\S]*?margin: 0;/);
    expect(mainSource).toContain("CCC_SESSION_DURATION_LABEL");
    expect(appStyles).toContain("@media (max-height: 519px)");
    expect(appStyles).toContain("overflow-y: auto");
  });

  it("reserves the congratulations achievement screen for the full-transfer state", () => {
    expect(mainSource).toContain('programme.status !== "full_transfer"');
    expect(mainSource).toContain("Congratulations — Full Transfer!");
    expect(mainSource).toContain("game achievement for the trained programme");
    expect(mainSource).toContain('programme.status === "full_transfer" ? "full_transfer" : "complete"');
    expect(appStyles).toContain(".ccc-full-transfer-card");
    expect(appStyles).toContain("ccc-achievement-pop");
  });

  it("provides the three authenticated shared-schema functions used by the browser", () => {
    expect(submitFunction).toContain('from("coach_sessions")');
    expect(submitFunction).toContain('from("coach_trials")');
    expect(submitFunction).toContain('from("coach_events")');
    expect(submitFunction).toContain("valid_for_progression");
    expect(submitFunction).toContain("counts_toward_quota");
    expect(submitFunction).toContain("actual_stimulus_frames");
    expect(syncFunction).toContain('from("cognitive_control_progress")');
    expect(finaliseFunction).toContain('status: "completed"');
    expect(finaliseFunction).toContain('from("coach_events")');
    expect(finaliseFunction).toContain("client_event_id");
  });
});
