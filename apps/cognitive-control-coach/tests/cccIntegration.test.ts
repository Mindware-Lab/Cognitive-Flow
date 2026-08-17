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
    expect(mainSource).toContain("function relativeStimulusDirectionLabel");
    expect(mainSource).toContain('trial.attentionPair === "rotational" ? "clockwise or anti-clockwise" : "in or out"');
    expect(mainSource).not.toContain("Five circular patches whose majority moves in, out, clockwise or counter-clockwise around the centre");
    expect(mainSource).toContain("function needsStimulusCompatibilityReset");
    expect(mainSource).toContain('trial.targetClass === "cw" || trial.targetClass === "ccw"');
    expect(mainSource).toContain("configRevision(saved.plan.configVersion) < 10");
    expect(mainSource).toContain("return hasMixedPairDisplay || hasLegacyRotationalVectors || hasLegacyAbsoluteProgression");
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
    expect(mainSource).toContain("attentionWrapperStage: programme.attentionWrapperStage");
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

  it("keeps relational n-back continuous without a mask or blank interval", () => {
    const wmExposureSource = mainSource.match(/function startWmExposure[\s\S]*?(?=function showWmFeedback)/)?.[0] || "";
    expect(wmExposureSource).toContain("const soaMs = block.selectedExposureMs");
    expect(wmExposureSource).toContain('taskStage = "evidence"');
    expect(wmExposureSource).not.toContain('taskStage = "mask"');
    expect(wmExposureSource).not.toContain('taskStage = "interval"');
    expect(wmExposureSource).not.toContain("displayMs");
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

  it("uses one clear central outcome flash without changing the task timing", () => {
    expect(mainSource).toContain('class="ccc-trial-result ${feedbackState}"');
    expect(mainSource).toContain('aria-label="${feedbackOutcome}"');
    expect(mainSource).not.toContain("<strong>${feedbackOutcome}</strong>");
    expect(mainSource).toContain('taskStage === "feedback" ? trialFeedbackMarkup : stimulus');
    expect(mainSource).toContain('feedbackState === "is-correct" ? "✓" : feedbackState === "is-incorrect" ? "×" : "·"');
    expect(mainSource).toContain('aria-atomic="true"');
    expect(mainSource).toContain("CCC_TRIAL_TIMING.outcomeFeedbackMs");
    expect(mainSource).toContain("CCC_TRIAL_TIMING.interTrialIntervalMs");
    expect(mainSource).not.toContain("ccc-result-panel");
    expect(appStyles).toMatch(/\.ccc-trial-result\.is-correct \.ccc-feedback-icon\s*\{[\s\S]*?background: var\(--correct\);/);
    expect(appStyles).toMatch(/\.ccc-trial-result\.is-incorrect \.ccc-feedback-icon\s*\{[\s\S]*?background: var\(--error\);/);
  });

  it("keeps a persistent block-points tally separate from correctness feedback", () => {
    expect(mainSource).toContain('class="ccc-block-points"');
    expect(mainSource).toContain("Block points ${formatPointTotal(blockPoints)}");
    expect(mainSource).toContain('class="is-points-total"');
    expect(mainSource).toContain("formatPointTotal(feedback.points)");
    expect(mainSource).toContain("feedback.pointsKeptPercent");
    expect(mainSource).not.toContain("feedbackPointsAnnouncement");
    expect(mainSource).not.toContain("Points this choice");
    expect(appStyles).toContain(".ccc-block-points");
    expect(appStyles).toContain(".ccc-summary-grid.ccc-points-summary");
  });

  it("explains between-block results in plain language", () => {
    expect(mainSource).toContain("What this block shows");
    expect(mainSource).toContain("Finding the main pattern");
    expect(mainSource).toContain("Holding and comparing");
    expect(mainSource).toContain("Points earned");
    expect(mainSource).toContain("Decision balance");
    expect(mainSource).toContain("What to notice:");
    expect(mainSource).toContain("Try this next");
    expect(mainSource).not.toContain("renderBetweenBlockTrends");
    expect(appStyles).toContain(".ccc-block-meaning");
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
    expect(mainSource).toContain('type ProgressHistoryPage = "overview" | "skills"');
    expect(mainSource).toContain('type DataPanel = "options" | "manage"');
    expect(mainSource).toContain('data-action="show-history-skills"');
    expect(mainSource).toContain('data-action="show-history-overview"');
    expect(mainSource).toContain('data-action="show-data-management"');
    expect(mainSource).toContain('data-action="show-data-options"');
    expect(appStyles).not.toMatch(/overflow-[xy]:\s*(auto|scroll)/);
    expect(appStyles).not.toMatch(/overflow:\s*(auto|scroll)/);
  });

  it("keeps progress available at safe session boundaries and returns without advancing", () => {
    expect(mainSource).toContain('type ProgressPanel = "session" | "history" | "proof"');
    expect(mainSource).toContain("function headerNavigation()");
    expect(mainSource).toContain('currentView !== "task"');
    expect(mainSource).toContain('currentView !== "shift_view"');
    expect(mainSource).toContain('data-action="show-session-progress"');
    expect(mainSource).toContain('data-action="show-history-progress"');
    expect(mainSource).toContain('data-action="return-session"');
    expect(mainSource).toContain("Your session so far");
    expect(mainSource).toContain("Results so far");
    expect(mainSource).toContain("Current strategy");
    expect(mainSource).toContain("patterns completed");
    expect(appStyles).toContain(".ccc-progress-segments");
    expect(appStyles).toContain(".ccc-live-session-grid");
    expect(appStyles).toContain(".ccc-header-nav");
    expect(appStyles).toContain(".ccc-header-nav button.is-active");
    expect(appStyles).not.toContain(".ccc-app-tabs");
  });

  it("provides isolated, entitlement-gated optic-flow test access without saving or syncing results", () => {
    expect(mainSource).toContain('get("tester") === "optic-flow"');
    expect(mainSource).toContain('type TaskMode = "practice" | "wm_practice" | "guided" | "tester"');
    expect(mainSource).toContain('if (testerRequested || !journey) return;');
    expect(mainSource).toContain('if (isSupabaseConfigured)');
    expect(mainSource).toContain('if (testerRequested) view = "tester"');
    expect(mainSource).toContain('startTask("tester")');
    expect(mainSource).toContain("they do not change unlocks, baselines, progress or cloud data");
    expect(mainSource).toContain("Optic-flow attention");
    expect(mainSource).toContain("Optic-flow · 1-back");
    expect(mainSource).toContain("Optic-flow · 2-back");
  });

  it("keeps the welcome screen readable without oversized titles or clipped content", () => {
    expect(mainSource).toContain('<p class="ccc-app-title">Cognitive Control Coach</p>');
    expect(appStyles).toMatch(/\.ccc-app-title\s*\{[\s\S]*?max-width: 100%;[\s\S]*?overflow-wrap: anywhere;/);
    expect(appStyles).toMatch(/h1\s*\{[\s\S]*?font-size: clamp\(1\.7rem, min\(3\.2vw, 4\.6vh\), 2\.8rem\)/);
    expect(appStyles).toMatch(/\.ccc-welcome \.ccc-main\s*\{[\s\S]*?align-items: start;/);
    expect(appStyles).toMatch(/\.ccc-workflow-picker h1,[\s\S]*?font-size: clamp\(1\.65rem, min\(3\.1vw, 4\.6vh\), 2\.35rem\)/);
    expect(mainSource.match(/journeyRail\(/g)).toHaveLength(2);
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
    expect(finaliseFunction).toContain('"session.attention_throughput_bps"');
    expect(finaliseFunction).toContain('"session.wm_throughput_bps"');
  });

  it("makes stage, session and G Track feedback accessible in the UX", () => {
    expect(mainSource).toContain("Results so far");
    expect(mainSource).toContain("Task performance");
    expect(mainSource).toContain("Correct MFT-M-derived information processed per second");
    expect(mainSource).toContain("Relational information throughput across n-back level, pace, accuracy and interference");
    expect(mainSource).toContain("Your session");
    expect(mainSource).toContain("Points for this block");
    expect(mainSource).toContain("Match how long you look to the rewards and costs");
    expect(mainSource).toContain("Strategy takeaway");
    expect(mainSource).toContain("How your results change");
    expect(mainSource).toContain("Independent cognitive check-ins");
    expect(mainSource).toContain("Compared with your own starting point");
    expect(mainSource).toContain("Other app users’ average");
    expect(mainSource).toContain("loadCccGTrackScores");
  });

  it("leads with plain-language graphs and gives G Track scores their own progress view", () => {
    expect(mainSource).toContain("Change across your sessions");
    expect(mainSource).toContain("100 marks where you started. A line above 100 shows improvement.");
    expect(mainSource).toContain("Attention performance");
    expect(mainSource).toContain("Memory performance");
    expect(mainSource).toContain("information-throughput measures used by the learning curves");
    expect(mainSource).toContain("Finding the pattern");
    expect(mainSource).toContain("Holding and comparing");
    expect(mainSource).toContain("Decision balance");
    expect(mainSource).toContain('data-action="show-proof-progress"');
    expect(mainSource).toContain("Your G Track scores");
    expect(mainSource).toContain("Compared with a reference group · average 100");
    expect(mainSource).toContain("100 is the reference-group average");
    expect(mainSource).not.toContain("Population-standardised");
    expect(appStyles).toContain(".ccc-session-trend-chart");
  });

  it("offers Attention Coach-style data choices with cloud personal as the default", () => {
    expect(mainSource).toContain('| "auth"');
    expect(mainSource).toContain("loadDataModeSeen()");
    expect(mainSource).toContain("verifyEmailSignInCode");
    expect(mainSource).toContain("Email me a sign-in code");
    expect(mainSource).toContain("Check your email for the code or sign-in link.");
    expect(mainSource).toContain('view = user ? "data" : "auth"');
    expect(mainSource).toContain("saveDataModeSeen()");
    expect(mainSource).toContain('data-action="open-data"');
    expect(mainSource).toContain(">Data</button>");
    expect(mainSource).not.toContain("Save progress");
    expect(mainSource).toContain('dataModeCard("cloud_personal", "Cloud · own baseline", "My progress across devices"');
    expect(mainSource).toContain('dataModeCard("cloud_benchmark", "Cloud · user average", "Compare with other users"');
    expect(mainSource).toContain('dataModeCard("local", "Device · own baseline", "My progress on this device"');
    expect(mainSource).toContain("You with your own start · starting result 100");
    expect(mainSource).toContain("You with other app users · average 100");
    expect(mainSource).toContain("This browser only");
    expect(mainSource).toContain("Cloud · across devices");
    expect(mainSource).toContain("function cloudSyncActive()");
    expect(mainSource).toContain('dataMode !== "local"');
    expect(mainSource).toContain('dataMode === "cloud_benchmark" ? loadStandardizedScores');
  });

  it("uses the selected data mode as the progress comparison reference", () => {
    expect(mainSource).toContain('dataMode === "cloud_benchmark" ? "population" : "personal"');
    expect(mainSource).toContain("your starting result is 100");
    expect(mainSource).toContain("the other-user average is 100");
    expect(mainSource).toContain("no personal-baseline score is substituted");
    expect(mainSource).toContain("Other-user comparison is being prepared");
    expect(mainSource).toContain("100 marks the other-user average. Above 100 means above average.");
  });
});
