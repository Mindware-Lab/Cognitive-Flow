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
    expect(mainSource).toContain("evaluateCccLearningCurve");
    expect(mainSource).toContain("isCccLearningCurveBoundary");
    expect(mainSource).toContain("adaptSignalTrial");
    expect(mainSource).toContain("buildCccBlockFeedback");
    expect(mainSource).toContain("startAmbiguousSphere");
    expect(mainSource).not.toContain('from "./generator"');
    expect(mainSource).not.toContain("Binding Focus");
    expect(mainSource).not.toContain("Improves focus");
    expect(mainSource).not.toContain("Transferable cognitive skill reached");
    expect(mainSource).not.toContain('data-response="withhold"');
    expect(mainSource).not.toContain("Not sure");
    expect(mainSource).toContain("Five circular patches of moving flecks travelling towards or away from the centre");
    expect(mainSource).toContain("cccOpticFlowAperturesForTrial");
    expect(mainSource).toContain("maskStimulus");
  });

  it("changes attention wrappers near a stable learning plateau rather than at a fixed quota", () => {
    expect(mainSource).toContain('learningCurve.status === "stabilised"');
    expect(mainSource).toContain('learningCurve.status === "exposure_ceiling"');
    expect(mainSource).toContain('recordEvent("learning_curve_evaluated"');
    expect(mainSource).toContain('recordEvent("wrapper_change_deferred"');
    expect(mainSource).toContain('reason: "learning_curve_not_stabilised_before_session_cap"');
    expect(mainSource).toContain("New display next.");
    expect(mainSource).toContain("Your recent results were steady.");
  });

  it("reuses the original Attention Coach arrow proportions and location-matched diamond masks", () => {
    expect(mainSource).toContain('viewBox="0 0 100 100"');
    expect(mainSource).toContain('<polygon points="${arrowPolygonPoints()}"');
    expect(mainSource).toContain('<polygon points="${diamondPolygonPoints(item.position)}"');
    expect(mainSource).toContain("maskStimulus(trial)");
    expect(mainSource).not.toContain("Array.from({ length: 42 }");
    expect(mainSource).not.toContain("M-24 -8 H6 V-16 L26 0 L6 16 V8 H-24 Z");
    expect(appStyles).toMatch(/\.ccc-mask-items\s*\{[\s\S]*?fill: var\(--blue-700\);/);
  });

  it("uses a brief literature-timed mask followed by a separate response state", () => {
    expect(mainSource).toContain('type TaskStage = "fixation" | "evidence" | "mask" | "response" | "feedback" | "interval"');
    expect(mainSource).toContain('taskStage = "mask"');
    expect(mainSource).toContain('taskStage = "response"');
    expect(mainSource).toContain('CCC_TRIAL_TIMING.signalMaskMs');
    expect(mainSource).toContain('setTimeout(() => completeTrial(null, "deadline"), CCC_TRIAL_TIMING.signalResponseDeadlineMs)');
    expect(mainSource).toContain('taskStage === "response"');
    expect(mainSource).not.toContain('estimand === "signal_capacity" ? taskStage === "mask"');
    expect(mainSource).not.toContain("<span>Viewing time</span>");
    expect(mainSource).not.toContain("trial.exposureMsRequested} ms");
  });

  it("keeps consumer copy plain and workflow-centred", () => {
    const visibleCopy = JSON.stringify({
      phases: PHASE_COPY,
      conditions: REGIME_COPY,
      workflows: WORKFLOW_CHOICES,
      reconnect: reconnectAction("ai_assisted"),
      boundary: EVIDENCE_BOUNDARY_COPY,
    });
    for (const technicalTerm of [
      "carrier transfer",
      "reference frame",
      "entropy",
      "operator integration",
      "valid observation",
      "protected",
      "diagnostic",
      "forced choice",
      "decision-policy",
      "evidence",
      "estimand",
      "mft-m",
      "provisional",
      "literature-standard",
      "memory buffer",
      "operation boundary",
    ]) {
      expect(visibleCopy.toLowerCase()).not.toContain(technicalTerm);
    }
    expect(visibleCopy).toContain("AI-assisted work");
    expect(visibleCopy).toContain("Notice whether this helps");
    for (const removedCopy of [
      "MFT-M-derived anchor",
      "literature-standard MFT-M-R assessment",
      "A provisional signal anchor",
      "frame-timed forced choices",
      "Full Transfer!",
      "trained-format gates",
      "No points or niches",
      "the check learns",
      "task adjusts to your answers",
      "Pool enough evidence",
      "Balanced accuracy",
      "false alarms",
      "Adjust your policy",
      "performance flattened above the target level",
      "Population scale",
    ]) {
      expect(mainSource).not.toContain(removedCopy);
    }
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
    expect(mainSource).toContain('return result.scoring.isCorrect ? "Correct." : "Incorrect."');
    expect(mainSource).not.toContain('"Not quite."');
  });

  it("keeps stage numbering continuous and lays every journey rail out responsively", () => {
    expect(mainSource).toContain('.filter(({ block }) => block.phase !== "practice")');
    expect(mainSource).toContain("String(stageIndex + 1)");
    expect(mainSource).toContain("--ccc-journey-count:${Math.max(1, visibleStages.length)}");
    expect(appStyles).toContain("repeat(var(--ccc-journey-count, 1), minmax(0, 1fr))");
    expect(appStyles).toContain("@media (max-width: 560px)");
    expect(appStyles).toContain("li:nth-child(3):not(:last-child)::after");
    expect(appStyles).toMatch(/li:nth-child\(4\)\s*\{[\s\S]*?grid-column: 3;[\s\S]*?grid-row: 2;/);
    expect(appStyles).toMatch(/li:nth-child\(5\)\s*\{[\s\S]*?grid-column: 2;[\s\S]*?grid-row: 2;/);
    expect(appStyles).toMatch(/li:nth-child\(6\)\s*\{[\s\S]*?grid-column: 1;[\s\S]*?grid-row: 2;/);
    expect(appStyles).toContain("The second row proceeds from right to left.");
    expect(appStyles).not.toContain("grid-template-columns: repeat(5, minmax(0, 1fr))");
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
    expect(appStyles).toContain("grid-template-rows: auto var(--ccc-task-cue-row) minmax(0, 1fr) var(--ccc-task-detail-row) var(--ccc-task-response-row) var(--ccc-task-helper-row)");
    expect(appStyles).toContain("--ccc-task-detail-row: 68px");
    expect(appStyles).toContain("row-gap: clamp(6px, 1.1vh, 10px)");
    expect(appStyles).toMatch(/\.ccc-stimulus-stage\s*\{[\s\S]*?margin: 0 auto;/);
    expect(appStyles).toMatch(/\.ccc-value-panel\s*\{[\s\S]*?position: relative;[\s\S]*?margin: 0;/);
    expect(mainSource).toContain("CCC_SESSION_DURATION_LABEL");
    expect(appStyles).toContain("@media (max-height: 519px)");
    expect(appStyles).toContain("overflow-y: auto");
  });

  it("reserves the congratulations achievement screen for the completed programme state", () => {
    expect(mainSource).toContain('programme.status !== "full_transfer"');
    expect(mainSource).toContain("Congratulations — Programme Complete!");
    expect(mainSource).toContain("This badge marks your progress in the app");
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
    expect(finaliseFunction).toContain('from("coach_metric_observations")');
    expect(finaliseFunction).toContain('from("coach_metric_norms")');
    expect(finaliseFunction).toContain("latestByUser");
  });

  it("makes stage, session and G Track feedback accessible in the UX", () => {
    expect(mainSource).toContain("Your results so far");
    expect(mainSource).toContain("Your session");
    expect(mainSource).toContain("Points for this block");
    expect(mainSource).toContain("Adjust your viewing time to the points");
    expect(mainSource).toContain("Strategy takeaway");
    expect(mainSource).toContain("See how your results change");
    expect(mainSource).toContain("G Track check-ins");
    expect(mainSource).toContain("Personal progress");
    expect(mainSource).toContain("Other users");
    expect(mainSource).toContain("loadCccGTrackScores");
  });
});
