import "../../../UX/iqmindware-app-design-system/tokens.css";
import "./cccStyles.css";
import { buildCccBlockSubmissionPayload } from "./blockPayload";
import { arrowPolygonPoints, diamondPolygonPoints } from "./cccStimulusGeometry";
import {
  cccOpticFlowAperturesForTrial,
  cccOpticFlowMaskAperturesForTrial,
} from "./cccOpticFlow";
import {
  PHASE_COPY,
  REGIME_COPY,
  WORKFLOW_CHOICES,
  reconnectAction,
  workflowBridge,
  type WorkflowChoice,
} from "./cccCopy";
import {
  CCC_CONFIG_VERSION,
  CCC_REGIMES,
  CCC_RELATIONAL_WM,
  CCC_SHIFT_VIEW,
  CCC_TRIAL_TIMING,
  CCC_WM_PRACTICE_PASS_CORRECT,
} from "./cccConfig";
import {
  adaptSignalTrial,
  createCccReplacementTrial,
  createP0AttentionCarrierTransferPlan,
  createP0PracticeBlock,
  createP0PracticeTrials,
} from "./cccGenerator";
import {
  createProgrammeSessionPlan,
  createWmPracticeBlock,
  createWmPracticeTrials,
} from "./cccProgrammeGenerator";
import { buildCccBlockFeedback, buildCccSessionMetrics } from "./cccFeedback";
import { evaluateCccLearningCurve, isCccLearningCurveBoundary } from "./cccLearningCurve";
import { evaluateCccWmPair } from "./cccWmProgress";
import { buildCccStrategyFeedback, type CccRegimeStrategyFeedback } from "./cccStrategy";
import {
  displayTrainingScore,
  firstValidBaseline,
  populationModeAvailable,
  progressSparkline,
  sessionMetricValue,
  type CccComparisonMode,
  type CccPopulationScore,
  type CccProgressMetricKey,
} from "./cccProgress";
import { CCC_SESSION_DURATION_LABEL } from "./cccDuration";
import { classifySignalTiming, signalStaircaseStateAfterResults } from "./cccSignal";
import { CCC_SHIFT_VIEW_RENDER_SETTINGS, startAmbiguousSphere } from "./cccShiftView";
import {
  clearCccJourney,
  clearCccProgramme,
  journeyCompletionRatio,
  loadCccJourney,
  loadCccProgramme,
  saveCccJourney,
  saveCccComparisonMode,
  saveCccProgramme,
  type CccSavedJourney,
} from "./cccStorage";
import {
  loadDataMode,
  loadDataModeSeen,
  saveDataMode,
  saveDataModeSeen,
  type DataMode,
} from "./storage";
import {
  applyCompletedSession,
  createInitialProgrammeState,
  migrateCccProgrammeState,
  missingTransferEvidence,
  nextProgrammeAction,
  programmeProgressPercent,
  selectBalancedRegimePair,
} from "./cccProgramme";
import type {
  CccAttentionBlockPlan,
  CccAttentionTrialDefinition,
  CccInputMode,
  CccNBackLevel,
  CccProgrammePhase,
  CccProgrammeState,
  CccProofDomain,
  CccProofScore,
  CccRecordedTrial,
  CccResponseChoice,
  CccRuntimeEvent,
} from "./cccTypes";
import { scoreCccAttentionTrial } from "./cccValue";
import {
  currentAuthUser,
  deleteCoachData,
  exportCoachData,
  finalizeCoachSession,
  isSupabaseConfigured,
  loadCccGTrackScores,
  loadStandardizedScores,
  loadCccRemoteProgress,
  onAuthChange,
  saveCccRemoteProgress,
  sendEmailSignInLink,
  signOutUser,
  submitCoachBlock,
  verifyEmailSignInCode,
  type AuthUser,
  type StandardizedScoreRow,
} from "./supabaseClient";

type View =
  | "auth"
  | "welcome"
  | "workflow"
  | "practice_intro"
  | "practice_guide"
  | "wm_practice_intro"
  | "wm_practice_result"
  | "phase_intro"
  | "phase_guide"
  | "regime_intro"
  | "task"
  | "paused"
  | "block_complete"
  | "block_insights"
  | "block_reconnect"
  | "shift_view"
  | "complete"
  | "full_transfer"
  | "complete_reconnect"
  | "progress"
  | "data";
type TaskStage = "fixation" | "evidence" | "mask" | "response" | "feedback" | "interval";
type TaskMode = "practice" | "wm_practice" | "guided";
type ProgressPanel = "session" | "history" | "proof";
type ProgressHistoryPage = "overview" | "skills";
type DataPanel = "options" | "manage";

const appElement = document.querySelector<HTMLDivElement>("#app");
if (!appElement) throw new Error("Missing #app root.");
const appRoot: HTMLDivElement = appElement;

const APP_BASE = import.meta.env.BASE_URL || "/";
let journey = loadCccJourney();
function needsRelationalStimulusReset(saved: CccSavedJourney | null): boolean {
  return Boolean(saved
    && !saved.completedAt
    && saved.plan.configVersion !== CCC_CONFIG_VERSION
    && saved.plan.blocks.some((block) => block.operator === "relational_wm"));
}

if (needsRelationalStimulusReset(journey)) {
  // Preserve the programme and saved n-back level, but do not resume an
  // in-progress sequence generated with the retired four-relation stimulus set.
  clearCccJourney();
  journey = null;
}
let programme: CccProgrammeState = migrateCccProgrammeState(loadCccProgramme() || journey?.programme || createInitialProgrammeState());
if (journey) {
  journey.programme = programme;
  journey.plan.programmeRunId ||= programme.programmeRunId;
  journey.plan.programmeSessionNumber ||= Math.max(1, programme.sessionNumber + (journey.completedAt ? 0 : 1));
  journey.plan.programmeSessionKind ||= "p0_foundation";
  journey.plan.delayedRecheckNotBefore ??= null;
  journey.plan.blocks.forEach((block) => { block.wmNLevel ??= null; });
  journey.plan.blocks.forEach((block) => {
    block.wmPairIndex ??= null;
    block.wmPairPosition ??= null;
    block.selectedExposureMs ??= null;
  });
  journey.plan.blocks.forEach((block) => {
    block.learningCurveGate ??= block.phase === "arrow_rel_stabilisation" || block.phase === "p1a_arrow_stabilisation"
      ? "source_stabilisation"
      : null;
  });
  journey.plan.trials.forEach((trial) => {
    trial.wmNLevel ??= null;
    trial.wmIsMatch ??= null;
    trial.wmBuffer ??= false;
    trial.wmLureType ??= null;
  });
  if (journey.completedAt) {
    const migrated = applyCompletedSession(programme, journey);
    programme = migrated.programme;
    journey.programme = programme;
    saveCccProgramme(programme);
    saveCccJourney(journey);
  }
  journey.wmPracticeLevel ??= null;
}
let selectedWorkflow: WorkflowChoice = journey?.workflowChoice || "focused_work";
let dataModeSeen = loadDataModeSeen();
let view: View = dataModeSeen ? "welcome" : isSupabaseConfigured ? "auth" : "data";
let dataReturnView: View = "welcome";
let progressReturnView: View = "welcome";
let progressPanel: ProgressPanel = journey && !journey.completedAt ? "session" : "history";
let progressHistoryPage: ProgressHistoryPage = "overview";
let dataPanel: DataPanel = "options";
let taskMode: TaskMode = journey?.wmPracticeLevel ? "wm_practice" : journey?.practiceComplete ? "guided" : "practice";
let taskStage: TaskStage = "fixation";
let evidenceStartedAt = 0;
let responseEnabled = false;
let responseLocked = false;
let feedbackMessage = "";
let feedbackTrial: CccAttentionTrialDefinition | null = null;
let feedbackResult: CccRecordedTrial | null = null;
let pauseAfterFeedback = false;
let taskTimers: number[] = [];
let potTimer = 0;
let taskAnimationFrame = 0;
let signalExposureMsActual: number | null = null;
let signalStimulusFrames: number | null = null;
let signalRefreshRate: number | null = null;
let sphereStop: (() => void) | null = null;
let shiftTimer = 0;
let shiftStartedAt = 0;
let shiftConfirmedAt: number | null = null;
let shiftNotFormedRecorded = false;
let shiftReversalCount = 0;
let shiftLastReversalAt = 0;
let shiftStaticMode = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
let authUser: AuthUser | null = null;
let accountMessage = "";
let signInEmail = "";
let signInLinkSent = false;
let signInBusy = false;
let dataMode: DataMode = isSupabaseConfigured ? loadDataMode() : "local";
let cloudStatus = isSupabaseConfigured
  ? "Sign in to sync your progress across devices."
  : "Progress is saved on this device.";
let pendingCloudSaves: Promise<void>[] = [];
let comparisonMode: CccComparisonMode = dataMode === "cloud_benchmark" ? "population" : "personal";
let populationScores: Record<string, CccPopulationScore> = {};
let progressMessage = "";
let pendingRegimeIntro: CccAttentionTrialDefinition | null = null;
let lastIntroducedRegimeKey = "";

function cloudSyncActive(): boolean {
  return isSupabaseConfigured && dataMode !== "local" && Boolean(authUser);
}

function dataModeLabel(mode: DataMode = dataMode): string {
  if (mode === "local") return "Local personal progress";
  if (mode === "cloud_benchmark") return "Standardised cloud comparison";
  return "Personal cloud progress";
}

function populationScoreMap(rows: StandardizedScoreRow[]): Record<string, CccPopulationScore> {
  const map: Record<string, CccPopulationScore> = {};
  for (const row of rows) {
    if (map[row.metric_key]) continue;
    const lowerIsBetter = row.metric_key === "session.decision_time_ms" || row.metric_key === "session.omission_rate";
    const directionalScore = lowerIsBetter && row.z_score !== null ? Math.round(100 - 15 * row.z_score) : row.standard_score;
    map[row.metric_key] = { standardScore: directionalScore, normN: row.norm_n };
  }
  return map;
}

async function hydrateProgressFeedback(): Promise<void> {
  if (!cloudSyncActive()) {
    populationScores = {};
    comparisonMode = dataMode === "cloud_benchmark" ? "population" : "personal";
    return;
  }
  try {
    const [rows, proofScores] = await Promise.all([
      dataMode === "cloud_benchmark" ? loadStandardizedScores("cognitive_control_coach") : Promise.resolve([]),
      loadCccGTrackScores(),
    ]);
    populationScores = populationScoreMap(rows);
    comparisonMode = dataMode === "cloud_benchmark" ? "population" : "personal";
    saveCccComparisonMode(comparisonMode);
    if (proofScores.length) {
      const byId = new Map<string, CccProofScore>();
      [...(programme.proofScores || []), ...proofScores].forEach((score) => byId.set(score.id, score));
      programme.proofScores = Array.from(byId.values());
      if (journey) journey.programme = programme;
      saveCccProgramme(programme);
      saveJourney();
    }
  } catch (error) {
    console.warn("Progress feedback could not be refreshed.", error);
  }
}

function assetPath(path: string): string {
  return `${APP_BASE}${path.replace(/^\/+/, "")}`;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;",
  })[character] || character);
}

function formatPointTotal(value: number): string {
  const rounded = Math.round(value);
  return rounded < 0 ? `−${Math.abs(rounded)}` : String(rounded);
}

function currentViewportClass(): CccRecordedTrial["viewportClass"] {
  if (window.innerWidth < 640) return "mobile";
  if (window.innerWidth < 1024) return "tablet";
  return "desktop";
}

function currentBlock(): CccAttentionBlockPlan | null {
  if (!journey) return null;
  if (taskMode === "wm_practice" && journey.wmPracticeLevel) return createWmPracticeBlock(journey.plan, journey.wmPracticeLevel);
  if (taskMode === "practice") return createP0PracticeBlock(journey.plan);
  return journey.plan.blocks[journey.activeBlockIndex] || null;
}

function shouldRunShiftView(block: CccAttentionBlockPlan | null = currentBlock()): boolean {
  if (!journey || !block || !CCC_SHIFT_VIEW.enabled || journey.shiftViewCompleted) return false;
  if (!block.shiftViewBefore || block.practice || !block.diagnostic) return false;
  if (!block.sourceWrapperId || block.wrappers.length !== 1) return false;
  if (block.wrappers[0] === block.sourceWrapperId) return false;
  return block.transitionKind === "carrier_transfer" || block.transitionKind === "wm_carrier_transfer";
}

function currentQueue(): CccAttentionTrialDefinition[] {
  if (!journey) return [];
  if (taskMode === "practice" || taskMode === "wm_practice") return journey.practiceQueue;
  const block = currentBlock();
  return block ? journey.blockQueues[block.id] || [] : [];
}

function currentResults(): CccRecordedTrial[] {
  if (!journey) return [];
  if (taskMode === "practice" || taskMode === "wm_practice") return journey.practiceResults;
  const block = currentBlock();
  return block ? journey.blockResults[block.id] || [] : [];
}

function activeTrial(): CccAttentionTrialDefinition | null {
  return currentQueue()[currentResults().length] || null;
}

function blockIsComplete(block = currentBlock()): boolean {
  if (!journey || !block) return false;
  const queue = taskMode === "practice" || taskMode === "wm_practice" ? journey.practiceQueue : journey.blockQueues[block.id] || [];
  const results = taskMode === "practice" || taskMode === "wm_practice" ? journey.practiceResults : journey.blockResults[block.id] || [];
  if (taskMode === "guided" && block.learningCurveGate === "source_stabilisation") {
    return evaluateCccLearningCurve(block, results, undefined, programme.evidence.attentionSourceLearningCurve).shouldEndBlock;
  }
  return results.length >= queue.length
    && results.filter((result) => result.scoring.countsTowardQuota).length >= block.validTrialCount;
}

function totalJourneyPoints(): number {
  if (!journey) return 0;
  return Object.values(journey.blockResults)
    .flat()
    .reduce((total, result) => total + result.scoring.pointsRealised, 0);
}

function recordEvent(eventType: string, payload: Record<string, unknown> = {}, blockId?: string | null): CccRuntimeEvent | null {
  if (!journey) return null;
  const event: CccRuntimeEvent = {
    id: crypto.randomUUID(),
    eventType,
    occurredAt: new Date().toISOString(),
    sessionId: journey.plan.sessionId,
    blockId: blockId === undefined ? currentBlock()?.id || null : blockId,
    payload,
  };
  journey.events.push(event);
  saveJourney();
  return event;
}

function saveJourney(): void {
  if (!journey) return;
  journey.programme = programme;
  saveCccJourney(journey);
}

function clearTaskTiming(): void {
  for (const timer of taskTimers) window.clearTimeout(timer);
  taskTimers = [];
  if (potTimer) window.clearInterval(potTimer);
  potTimer = 0;
  if (taskAnimationFrame) window.cancelAnimationFrame(taskAnimationFrame);
  taskAnimationFrame = 0;
}

function stopShiftView(): void {
  sphereStop?.();
  sphereStop = null;
  if (shiftTimer) window.clearInterval(shiftTimer);
  shiftTimer = 0;
}

function setView(next: View): void {
  clearTaskTiming();
  if (view === "shift_view" && next !== "shift_view") stopShiftView();
  view = next;
  render();
}

function progressNavigationAvailable(currentView: View = view): boolean {
  return currentView !== "auth"
    && currentView !== "data"
    && currentView !== "task"
    && currentView !== "shift_view";
}

function headerNavigation(): string {
  if (!progressNavigationAvailable()) return "";
  const activeJourney = Boolean(journey && !journey.completedAt);
  const returnAction = activeJourney ? "return-session" : "return-home";
  const progressDefault: ProgressPanel = activeJourney ? "session" : "history";
  const progressActive = view === "progress";
  return `<nav class="ccc-header-nav" aria-label="Cognitive Control Coach sections">
    <button data-action="${progressActive ? returnAction : "session-current"}" class="${progressActive ? "" : "is-active"}" aria-current="${progressActive ? "false" : "page"}">${activeJourney ? "Session" : "Home"}</button>
    <button data-action="show-progress" data-progress-panel="${progressDefault}" class="${progressActive ? "is-active" : ""}" aria-current="${progressActive ? "page" : "false"}">Progress</button>
  </nav>`;
}

function header(): string {
  const activeJourney = journey && !journey.completedAt;
  const sessionCompletion = journey && !journey.completedAt ? Math.round(journeyCompletionRatio(journey) * 100) : 0;
  const completion = programmeProgressPercent(programme);
  return `
    <a class="ccc-skip-link" href="#ccc-content">Skip to content</a>
    <header class="ccc-header">
      <a class="ccc-brand" href="https://www.iqmindware.com" aria-label="IQ Mindware home">
        <img class="ccc-brand-mark" src="${assetPath("iqmindware-eye.svg")}" alt="" />
        <span class="ccc-brand-lockup">
          <strong><span>IQ</span> MINDWARE</strong>
          <small>Cognitive Control Coach</small>
        </span>
      </a>
      <div class="ccc-header-actions">
        ${activeJourney ? `
          <div class="ccc-header-progress" aria-label="Session ${sessionCompletion}% complete">
            <span>Session</span>
            <div class="ccc-header-progress-track" role="progressbar" aria-label="Session completion" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${sessionCompletion}"><i style="width:${sessionCompletion}%"></i></div>
          </div>` : `<span class="ccc-status-chip">Programme ${completion}%</span>`}
        ${headerNavigation()}
        <button class="ccc-account-button" data-action="open-data" title="${escapeHtml(dataModeLabel())}">Data</button>
      </div>
    </header>`;
}

function shell(content: string, className = ""): string {
  return `<main class="ccc-app ${className}">${header()}<div class="ccc-main" id="ccc-content" tabindex="-1">${content}</div><footer class="ccc-footer"><span>IQ Mindware · practice for demanding work and study</span><span>Training and practice only</span><span><a href="https://www.iqmindware.com/privacy/">Privacy</a> · <a href="https://www.iqmindware.com/terms/">Terms</a></span></footer></main>`;
}

const JOURNEY_LABELS: Partial<Record<CccProgrammePhase, string>> = {
  signal_anchor: "Direction",
  arrow_rel_stabilisation: "In / Out",
  flow_rel_first_contact: "Change",
  flow_rel_recovery: "Practise",
  arrow_rel_return: "Return",
  relative_mix: "Switch",
  p1a_arrow_stabilisation: "Arrows",
  p1a_flow_first_contact: "Change",
  p1a_flow_recovery: "Practise",
  p1a_arrow_return: "Return",
  p1a_relative_mix: "Switch",
  p1a_delayed_recheck: "Return",
  p1b_attention_bridge: "In / Out",
  p1b_wm_arrow_stabilisation: "Memory",
  p1b_wm_flow_first_contact: "Change",
  p1b_wm_flow_recovery: "Practise",
  p1b_wm_arrow_return: "Return",
  p1b_wm_relative_mix: "Switch",
  p1c_attention_entry: "In / Out",
  p1c_delayed_reentry: "Return",
  p1c_wm_hold: "Memory",
  p1c_attention_reentry: "In / Out",
  p1c_operator_mix: "Memory",
};

function journeyRail(completedBeforeIndex: number, currentIndex: number | null = null): string {
  if (!journey) return "";
  const visibleStages = journey.plan.blocks
    .map((block, planIndex) => ({ block, planIndex }))
    .filter(({ block }) => block.phase !== "practice");
  const steps = visibleStages.map(({ block, planIndex }, stageIndex) => {
    const isComplete = planIndex < completedBeforeIndex;
    const isCurrent = currentIndex === planIndex;
    const state = isComplete ? "is-complete" : isCurrent ? "is-current" : "";
    const marker = isComplete ? "✓" : String(stageIndex + 1);
    return `<li class="${state}" ${isCurrent ? 'aria-current="step"' : ""}><span aria-hidden="true">${marker}</span><small>${JOURNEY_LABELS[block.phase] || "Train"}</small></li>`;
  }).join("");
  return `<ol class="ccc-journey-rail" style="--ccc-journey-count:${Math.max(1, visibleStages.length)}" aria-label="Training journey">${steps}</ol>`;
}

function workflowIcon(id: WorkflowChoice): string {
  const common = 'viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"';
  if (id === "focused_work") return `<svg ${common}><circle cx="16" cy="16" r="10"/><circle cx="16" cy="16" r="4"/><path d="M16 3v4M29 16h-4M16 29v-4M3 16h4"/></svg>`;
  if (id === "study") return `<svg ${common}><path d="M5 7.5c4-1 7.7-.2 11 2.2v16c-3.3-2.4-7-3.2-11-2.2v-16Z"/><path d="M27 7.5c-4-1-7.7-.2-11 2.2v16c3.3-2.4 7-3.2 11-2.2v-16Z"/></svg>`;
  if (id === "ai_assisted") return `<svg ${common}><path d="m16 4 1.8 5.2L23 11l-5.2 1.8L16 18l-1.8-5.2L9 11l5.2-1.8L16 4Z"/><circle cx="7" cy="23" r="2.5"/><circle cx="25" cy="23" r="2.5"/><path d="M9.5 23h13M16 18v5"/></svg>`;
  return `<svg ${common}><path d="M7 6h18v20H7z"/><path d="m11 12 2 2 4-4M11 20l2 2 4-4M20 12h2M20 20h2"/></svg>`;
}

function workflowCards(disabled = false): string {
  return (Object.entries(WORKFLOW_CHOICES) as Array<[WorkflowChoice, (typeof WORKFLOW_CHOICES)[WorkflowChoice]]>)
    .map(([id, item]) => `
      <button class="ccc-workflow-card ${selectedWorkflow === id ? "is-selected" : ""}" data-action="choose-workflow" data-workflow="${id}" aria-pressed="${selectedWorkflow === id}" ${disabled ? "disabled" : ""}>
        <span class="ccc-workflow-icon">${workflowIcon(id)}</span>
        <span class="ccc-choice-mark" aria-hidden="true">${selectedWorkflow === id ? "✓" : ""}</span>
        <strong>${item.label}</strong>
        <span>${item.example}</span>
      </button>`)
    .join("");
}

function renderWelcome(): string {
  const hasJourney = Boolean(journey && !journey.completedAt);
  const completion = journey ? Math.round(journeyCompletionRatio(journey) * 100) : 0;
  const nextAction = nextProgrammeAction(programme);
  const mainAction = hasJourney
    ? `<button class="ccc-button ccc-button-primary" data-action="continue-journey">Continue your journey</button>`
    : programme.sessions.length === 0
      ? `<button class="ccc-button ccc-button-primary" data-action="show-workflow">Choose your workflow</button>`
      : nextAction.type === "session"
        ? `<button class="ccc-button ccc-button-primary" data-action="begin-next-session">Start session ${programme.sessionNumber + 1}</button>`
        : nextAction.type === "wait"
          ? `<button class="ccc-button ccc-button-primary" disabled>Re-check opens ${new Intl.DateTimeFormat("en-GB", { weekday: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(nextAction.availableAt))}</button>`
          : programme.status === "full_transfer"
            ? `<button class="ccc-button ccc-button-primary" data-action="show-full-transfer">View your programme achievement</button>`
            : `<button class="ccc-button ccc-button-primary" data-action="show-complete-reconnect">Review your programme</button>`;
  const programmeComplete = programme.status !== "active";
  const stageLabel = programme.currentStage === "P0" ? "Foundation"
    : programme.currentStage === "P1a" ? "Changing patterns"
      : programme.currentStage === "P1b" ? "Hold and compare"
        : programme.currentStage === "P1c" ? "Switch and return"
          : "Programme complete";
  const missing = missingTransferEvidence(programme);
  return shell(hasJourney ? `
      <section class="ccc-resume-card">
        <div class="ccc-card-heading"><div><span class="ccc-kicker">Your current journey</span><h2>Pick up where you left off.</h2></div><strong class="ccc-progress-number">${completion}%</strong></div>
        <div class="ccc-progress-track" role="progressbar" aria-label="Journey progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${completion}"><span style="width:${completion}%"></span></div>
        <p>Your chosen task is <strong>${WORKFLOW_CHOICES[journey!.workflowChoice].label.toLowerCase()}</strong>. Your place is saved.</p>
        ${mainAction}
      </section>` : programme.sessions.length ? `
      <section class="ccc-resume-card ccc-programme-card">
        <div class="ccc-card-heading"><div><span class="ccc-kicker">Your multi-session programme</span><h2>${programmeComplete ? "Your programme record is ready." : `${stageLabel} is next.`}</h2></div><strong class="ccc-progress-number">${programmeProgressPercent(programme)}%</strong></div>
        <div class="ccc-progress-track" role="progressbar" aria-label="Programme completion" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${programmeProgressPercent(programme)}"><span style="width:${programmeProgressPercent(programme)}%"></span></div>
        <div class="ccc-summary-grid ccc-programme-summary">
          <article><span>Sessions completed</span><strong>${programme.sessionNumber}</strong></article>
          <article><span>Current stage</span><strong>${stageLabel}</strong></article>
          <article><span>${programme.currentStage === "P1b" || programme.currentStage === "P1c" ? "Saved memory level" : "Current progress"}</span><strong>${programme.currentStage === "P1b" || programme.currentStage === "P1c" ? `${programme.wmLevel}-back` : programme.transferStatus === "attention_portable" ? "Return check complete" : programme.transferStatus === "supported_unlock" ? "Next stages ready" : "Building"}</strong></article>
        </div>
        <p>${programmeComplete
          ? programme.status === "full_transfer"
            ? "You completed every stage, including returning after a break and switching between task types."
            : "You completed the programme."
          : nextAction.type === "wait"
            ? "Your next check opens after some time away. Take a break and return when it is ready."
            : missing.length
              ? `Coming up: ${missing.slice(0, 3).join(", ")}.`
              : "Your next set of stages is ready."}</p>
        ${mainAction}
      </section>` : `
    <section class="ccc-hero">
      <div class="ccc-hero-copy">
        <span class="ccc-kicker">Focus practice</span>
        <h1>Focus, hold and update <em>what matters.</em></h1>
        <p class="ccc-lead">Practise staying with the goal when distractions or a changing format pull your attention elsewhere.</p>
        <div class="ccc-hero-facts" aria-label="Journey overview">
          <span>${CCC_SESSION_DURATION_LABEL}</span><span>Four work conditions</span><span>Progress at your pace</span>
        </div>
        <div class="ccc-actions">${mainAction}</div>
      </div>
      <aside class="ccc-control-panel">
        <span class="ccc-kicker">Three simple moves</span>
        <h2>The pattern changes. The core moves stay the same.</h2>
        <div class="ccc-control-strip" aria-label="The three moves trained in this app">
          <article><span>1</span><strong>Find what matters</strong><small>Spot the main pattern among competing information.</small></article>
          <article><span>2</span><strong>Take in enough</strong><small>Keep looking until the pattern is clear enough.</small></article>
          <article><span>3</span><strong>Make the call</strong><small>Commit to your best choice at the right time.</small></article>
        </div>
      </aside>
    </section>
  `, "ccc-welcome ccc-viewport-view");
}

function renderWorkflow(): string {
  return shell(`
    <section class="ccc-section ccc-workflow-picker">
      <span class="ccc-kicker">Choose a real task</span>
      <h1>Where do you want stronger focus?</h1>
      <p>Choose where you want to use these skills.</p>
      <div class="ccc-workflow-grid">${workflowCards()}</div>
      <div class="ccc-actions">
        <button class="ccc-button ccc-button-primary" data-action="begin-journey">Start with a short practice</button>
        <button class="ccc-button ccc-button-quiet" data-action="back-welcome">Back</button>
      </div>
    </section>
  `, "ccc-workflow-view ccc-viewport-view");
}

function renderPracticeIntro(): string {
  if (!journey) return renderWelcome();
  return shell(`
    <section class="ccc-narrow-card">
      <div class="ccc-stage-line"><span>Practice</span><span>About one minute</span></div>
      <span class="ccc-kicker">Start with a few examples</span>
      <h1>Find the direction followed by most arrows.</h1>
      <p>Look at all five arrows. Choose <strong>Left</strong> or <strong>Right</strong>.</p>
      <div class="ccc-example-card" aria-label="Example: four arrows point right and one points left, so the answer is right">
        <span aria-hidden="true">→</span><span aria-hidden="true">→</span><span class="is-odd" aria-hidden="true">←</span><span aria-hidden="true">→</span><span aria-hidden="true">→</span><strong>Most point right</strong>
      </div>
      <div class="ccc-actions">
        <button class="ccc-button ccc-button-primary" data-action="show-practice-guide">Continue</button>
        <button class="ccc-button ccc-button-quiet" data-action="back-welcome">Back</button>
      </div>
    </section>
  `, "ccc-practice-view ccc-viewport-view");
}

function renderPracticeGuide(): string {
  if (!journey) return renderWelcome();
  return shell(`
    <section class="ccc-narrow-card">
      <div class="ccc-stage-line"><span>Practice</span><span>Left or Right</span></div>
      <span class="ccc-kicker">How to choose</span>
      <h1>Watch. Remember. Choose.</h1>
      <div class="ccc-instruction-grid">
        <article><strong>Watch the arrows</strong><span>Find the direction followed by most.</span></article>
        <article><strong>Choose after the mask</strong><span>Left or Right—even if unsure.</span></article>
      </div>
      <div class="ccc-actions">
        <button class="ccc-button ccc-button-primary" data-action="start-practice">Begin practice</button>
        <button class="ccc-button ccc-button-quiet" data-action="back-practice-intro">Back</button>
      </div>
    </section>
  `, "ccc-practice-view ccc-viewport-view");
}

function wmPracticeExample(level: CccNBackLevel): string {
  if (level === 1) {
    return `<div class="ccc-wm-worked-example" aria-label="One-back example">
      <div><span>1</span><strong>In</strong><small>Remember this</small></div>
      <i aria-hidden="true">→</i>
      <div class="is-answer"><span>2</span><strong>In</strong><small>Same as 1 step back: Match</small></div>
      <i aria-hidden="true">→</i>
      <div class="is-answer"><span>3</span><strong>Out</strong><small>Different from 1 step back: Different</small></div>
    </div>`;
  }
  const middleLabel = level === 2 ? "2" : `2–${level}`;
  const middleCopy = level === 2 ? "Out" : `${level - 1} other patterns`;
  return `<div class="ccc-wm-worked-example" aria-label="${level}-back example">
    <div><span>1</span><strong>In</strong><small>Remember</small></div>
    <i aria-hidden="true">→</i>
    <div><span>${middleLabel}</span><strong>${middleCopy}</strong><small>Keep the sequence moving</small></div>
    <i aria-hidden="true">→</i>
    <div class="is-answer"><span>${level + 1}</span><strong>In</strong><small>Same as ${level} steps back: Match</small></div>
  </div>`;
}

function renderWmPracticeIntro(): string {
  if (!journey?.wmPracticeLevel) return renderPhaseIntro();
  const level = journey.wmPracticeLevel;
  return shell(`
    <section class="ccc-narrow-card">
      <div class="ccc-stage-line"><span>Learn ${level}-back</span><span>Four examples</span></div>
      <span class="ccc-kicker">Practise first</span>
      <h1>Compare each pattern with ${level === 1 ? "the one just before it" : `the one ${level} steps earlier`}.</h1>
      <p>Choose <strong>Match</strong> when the main direction is the same, or <strong>Different</strong> when it has changed.</p>
      ${wmPracticeExample(level)}
      <div class="ccc-actions">
        <button class="ccc-button ccc-button-primary" data-action="start-wm-practice">Begin ${level}-back practice</button>
        <button class="ccc-button ccc-button-quiet" data-action="back-phase-intro">Back</button>
      </div>
    </section>
  `, "ccc-practice-view ccc-wm-practice-view ccc-viewport-view");
}

function wmPracticeAnsweredResults(): CccRecordedTrial[] {
  return journey?.practiceResults.filter((result) => !result.trial.wmBuffer && result.scoring.responseClass === "answer") || [];
}

function renderWmPracticeResult(): string {
  if (!journey?.wmPracticeLevel) return renderPhaseIntro();
  const level = journey.wmPracticeLevel;
  const answered = wmPracticeAnsweredResults();
  const correct = answered.filter((result) => result.scoring.isCorrect).length;
  const passed = correct >= CCC_WM_PRACTICE_PASS_CORRECT;
  return shell(`
    <section class="ccc-narrow-card">
      <div class="ccc-stage-line"><span>${level}-back practice</span><span>${correct} of 4 correct</span></div>
      <span class="ccc-kicker">${passed ? "Ready to continue" : "One more short try"}</span>
      <h1>${passed ? `You have the ${level}-back rule.` : "Let’s make the comparison clearer."}</h1>
      <p>You answered <strong>${correct} of 4</strong> practice comparisons correctly.</p>
      <aside class="ccc-workflow-bridge"><span>Remember</span><strong>Compare with exactly ${level} ${level === 1 ? "step" : "steps"} back—not simply the most recent pattern.</strong></aside>
      <div class="ccc-actions">
        <button class="ccc-button ccc-button-primary" data-action="${passed ? "complete-wm-practice" : "retry-wm-practice"}">${passed ? "Continue to the first block" : "Try four more"}</button>
        <button class="ccc-button ccc-button-quiet" data-action="back-welcome">Save and leave</button>
      </div>
    </section>
  `, "ccc-review-view ccc-wm-practice-view ccc-viewport-view");
}

function renderPhaseIntro(): string {
  if (!journey) return renderWelcome();
  taskMode = "guided";
  const block = currentBlock();
  if (!block || block.phase === "practice") return renderWelcome();
  const copy = PHASE_COPY[block.phase];
  const stageNumber = journey.activeBlockIndex + 1;
  return shell(`
    <section class="ccc-narrow-card">
      <div class="ccc-stage-line"><span>Stage ${stageNumber} of ${journey.plan.blocks.length}</span><span>${Math.round(journeyCompletionRatio(journey) * 100)}% complete</span></div>
      ${journeyRail(journey.activeBlockIndex, journey.activeBlockIndex)}
      <span class="ccc-kicker">${copy.eyebrow}</span>
      <h1>${copy.title}</h1>
      <p>${copy.body}</p>
      <div class="ccc-actions">
        <button class="ccc-button ccc-button-primary" data-action="show-phase-guide">Continue</button>
        <button class="ccc-button ccc-button-quiet" data-action="back-welcome">Save and leave</button>
      </div>
    </section>
  `, "ccc-stage-view ccc-stage-overview ccc-viewport-view");
}

function renderPhaseGuide(): string {
  if (!journey) return renderWelcome();
  taskMode = "guided";
  const block = currentBlock();
  if (!block || block.phase === "practice") return renderWelcome();
  const stageNumber = journey.activeBlockIndex + 1;
  const isSignal = block.estimand === "signal_capacity";
  const isWm = block.operator === "relational_wm";
  const canPractiseAgain = isWm && block.wmNLevel !== null;
  return shell(`
    <section class="ccc-narrow-card">
      <div class="ccc-stage-line"><span>Stage ${stageNumber} of ${journey.plan.blocks.length}</span><span>${Math.round(journeyCompletionRatio(journey) * 100)}% complete</span></div>
      <span class="ccc-kicker">Before you begin</span>
      <h1>${isSignal ? "Watch. Remember. Choose." : isWm ? `Compare ${block.wmNLevel} ${block.wmNLevel === 1 ? "step" : "steps"} back.` : "Find the main direction."}</h1>
      ${isSignal ? `
        <div class="ccc-instruction-grid">
          <article><strong>Watch the arrows</strong><span>Find the direction followed by most.</span></article>
          <article><strong>Choose after the mask</strong><span>Left or Right—even if unsure.</span></article>
        </div>
        ` : isWm ? `
        <div class="ccc-instruction-grid">
          <article><strong>Remember</strong><span>Keep each main direction in mind.</span></article>
          <article><strong>Compare</strong><span>Choose Match or Different.</span></article>
        </div>
        <p class="ccc-soft-note">The first ${block.wmNLevel} ${block.wmNLevel === 1 ? "pattern starts" : "patterns start"} the sequence.</p>` : `
        <div class="ccc-instruction-grid">
          <article><strong>Find the majority</strong><span>Choose In or Out.</span></article>
          <article><strong>Use the points</strong><span>Check longer when mistakes cost more; choose sooner when points fade fast.</span></article>
        </div>`}
      <div class="ccc-actions">
        <button class="ccc-button ccc-button-primary" data-action="start-phase">${block.shiftViewBefore && !journey.shiftViewCompleted ? "Start the changeover" : "Begin this stage"}</button>
        ${canPractiseAgain ? `<button class="ccc-button ccc-button-secondary" data-action="practise-wm-again">Practise ${block.wmNLevel}-back again</button>` : ""}
        <button class="ccc-button ccc-button-quiet" data-action="back-phase-intro">Back</button>
      </div>
    </section>
  `, "ccc-stage-view ccc-stage-guide ccc-viewport-view");
}

function renderRegimeIntro(): string {
  if (!journey || !pendingRegimeIntro) return renderWelcome();
  const trial = pendingRegimeIntro;
  const copy = REGIME_COPY[trial.regimeId];
  const regime = CCC_REGIMES[trial.regimeId];
  const block = currentBlock();
  const isWm = trial.operator === "relational_wm";
  const selectedExposure = block?.selectedExposureMs || CCC_RELATIONAL_WM.defaultPresentationMs;
  const conditionNumber = isWm ? (journey.activeBlockIndex % 4) + 1 : Math.max(1, (currentBlock()?.regimePair.indexOf(trial.regimeId) ?? 0) + 1);
  return shell(`
    <section class="ccc-narrow-card ccc-regime-intro-card">
      <div class="ccc-stage-line"><span>Work condition</span><span>${conditionNumber} of ${isWm ? 4 : currentBlock()?.regimePair.length || 2}</span></div>
      <span class="ccc-kicker">Points for this block</span>
      <h1>${copy.title}</h1>
      <p>${copy.instruction}</p>
      <div class="ccc-payoff-grid" aria-label="${copy.title} payoffs">
        <article><span>Correct</span><strong>Up to ${regime.correctPot}</strong><small>Choose sooner to keep more</small></article>
        <article><span>Wrong</span><strong>−${regime.errorLoss}</strong><small>Cost of a mistake</small></article>
        <article><span>Waiting</span><strong>−${regime.drainPointsPerSecond}/sec</strong><small>Points fade while viewing</small></article>
      </div>
      <aside class="ccc-strategy-principle"><span>Your strategy</span><strong>${copy.strategy}</strong></aside>
      ${isWm ? `<section class="ccc-speed-choice">
        <div><span>Choose your viewing time</span><strong id="ccc-wm-speed-value">${(selectedExposure / 1000).toFixed(2)} seconds</strong></div>
        <input id="ccc-wm-speed-slider" type="range" min="${CCC_RELATIONAL_WM.minimumPresentationMs}" max="${CCC_RELATIONAL_WM.maximumPresentationMs}" step="${CCC_RELATIONAL_WM.presentationStepMs}" value="${selectedExposure}" aria-label="Pattern viewing time" />
        <div class="ccc-speed-labels"><span>Faster presentation</span><span>More time to check</span></div>
      </section>` : ""}
      <div class="ccc-actions">
        <button class="ccc-button ccc-button-primary" data-action="continue-regime">${isWm ? "Use this viewing time" : "I understand — continue"}</button>
        <button class="ccc-button ccc-button-quiet" data-action="back-welcome">Save and leave</button>
      </div>
    </section>
  `, "ccc-regime-intro-view ccc-viewport-view");
}

function arrowStimulus(trial: CccAttentionTrialDefinition): string {
  const arrows = trial.stimulusItems.map((item) => {
    const angle = Math.atan2(item.vector.y, item.vector.x) * 180 / Math.PI;
    return `<g transform="translate(${item.position.x} ${item.position.y}) rotate(${angle})"><polygon points="${arrowPolygonPoints()}" /></g>`;
  }).join("");
  const label = trial.referenceFrame === "relative"
    ? "Five arrows pointing towards or away from the centre"
    : "Five arrows pointing left or right";
  return `<svg class="ccc-stimulus-svg" viewBox="0 0 100 100" role="img" aria-label="${label}"><g class="ccc-centre-fixation" aria-hidden="true"><line x1="46.5" y1="50" x2="53.5" y2="50" /><line x1="50" y1="46.5" x2="50" y2="53.5" /></g><g class="ccc-arrow-items">${arrows}</g></svg>`;
}

function flowStimulus(trial: CccAttentionTrialDefinition): string {
  const clipRoot = `ccc-flow-${trial.id.replace(/[^a-zA-Z0-9_-]/g, "-")}`;
  const apertures = cccOpticFlowAperturesForTrial(trial).map((aperture) => {
    const clipId = `${clipRoot}-${aperture.index}`;
    const dots = aperture.dots.map((dot) => `
      <circle class="ccc-flow-dot" cx="${dot.x.toFixed(2)}" cy="${dot.y.toFixed(2)}" r="${dot.r.toFixed(2)}" opacity="${dot.opacity.toFixed(2)}">
        <animate attributeName="cx" values="${dot.fromX.toFixed(2)};${dot.toX.toFixed(2)}" dur="${dot.durationMs}ms" begin="${dot.delayMs}ms" repeatCount="indefinite" />
        <animate attributeName="cy" values="${dot.fromY.toFixed(2)};${dot.toY.toFixed(2)}" dur="${dot.durationMs}ms" begin="${dot.delayMs}ms" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.14;${dot.opacity.toFixed(2)};0.16" dur="${dot.durationMs}ms" begin="${dot.delayMs}ms" repeatCount="indefinite" />
      </circle>`).join("");
    return `<defs><clipPath id="${clipId}"><circle cx="${aperture.x}" cy="${aperture.y}" r="${aperture.radius}" /></clipPath></defs>
      <circle class="ccc-flow-patch" cx="${aperture.x}" cy="${aperture.y}" r="${aperture.radius}" />
      <g clip-path="url(#${clipId})" class="ccc-flow-points">${dots}</g>
      <circle class="ccc-flow-ring" cx="${aperture.x}" cy="${aperture.y}" r="${aperture.radius}" />`;
  }).join("");
  return `<svg class="ccc-stimulus-svg ccc-flow-svg" viewBox="0 0 100 100" role="img" aria-label="Five circular patches of moving flecks travelling towards or away from the centre"><circle class="ccc-flow-orbit" cx="50" cy="50" r="34" />${apertures}<g class="ccc-centre-fixation" aria-hidden="true"><line x1="46.5" y1="50" x2="53.5" y2="50" /><line x1="50" y1="46.5" x2="50" y2="53.5" /></g></svg>`;
}

function flowMaskStimulus(trial: CccAttentionTrialDefinition): string {
  const clipRoot = `ccc-flow-mask-${trial.id.replace(/[^a-zA-Z0-9_-]/g, "-")}`;
  const apertures = cccOpticFlowMaskAperturesForTrial(trial).map((aperture) => {
    const clipId = `${clipRoot}-${aperture.index}`;
    const dots = aperture.dots.map((dot) => {
      const size = dot.r * 1.75;
      const points = `${dot.x.toFixed(2)},${(dot.y - size).toFixed(2)} ${(dot.x + size).toFixed(2)},${dot.y.toFixed(2)} ${dot.x.toFixed(2)},${(dot.y + size).toFixed(2)} ${(dot.x - size).toFixed(2)},${dot.y.toFixed(2)}`;
      return `<polygon class="ccc-flow-mask-dot" points="${points}" opacity="${dot.opacity.toFixed(2)}" />`;
    }).join("");
    return `<defs><clipPath id="${clipId}"><circle cx="${aperture.x}" cy="${aperture.y}" r="${aperture.radius}" /></clipPath></defs>
      <circle class="ccc-flow-patch" cx="${aperture.x}" cy="${aperture.y}" r="${aperture.radius}" />
      <g clip-path="url(#${clipId})" class="ccc-flow-mask-field">${dots}</g>
      <circle class="ccc-flow-ring is-mask" cx="${aperture.x}" cy="${aperture.y}" r="${aperture.radius}" />`;
  }).join("");
  return `<svg class="ccc-stimulus-svg ccc-flow-svg" viewBox="0 0 100 100" role="img" aria-label="Five patterned masks covering the previous motion patches"><circle class="ccc-flow-orbit" cx="50" cy="50" r="34" />${apertures}</svg>`;
}

function stimulusFor(trial: CccAttentionTrialDefinition): string {
  return trial.carrier === "arrow" ? arrowStimulus(trial) : flowStimulus(trial);
}

function maskStimulus(trial: CccAttentionTrialDefinition): string {
  const masks = trial.stimulusItems
    .map((item) => `<polygon points="${diamondPolygonPoints(item.position)}" />`)
    .join("");
  return `<svg class="ccc-stimulus-svg ccc-mask-svg" viewBox="0 0 100 100" role="img" aria-label="Five diamond masks covering the previous arrow positions"><g class="ccc-mask-items">${masks}</g></svg>`;
}

function taskProgress(block: CccAttentionBlockPlan): string {
  const valid = currentResults().filter((result) => result.scoring.countsTowardQuota).length;
  const target = block.validTrialCount;
  const percentage = Math.min(100, Math.round(valid / Math.max(1, target) * 100));
  return `<div class="ccc-task-progress" role="progressbar" aria-label="Stage progress" aria-valuemin="0" aria-valuemax="${target}" aria-valuenow="${Math.min(valid, target)}"><span style="width:${percentage}%"></span></div><small>${Math.min(valid, target)} of ${target} patterns</small>`;
}

function renderTask(): string {
  const trial = taskStage === "feedback" ? feedbackTrial : activeTrial();
  const block = currentBlock();
  if (!journey || !trial || !block) return renderWelcome();
  const regime = CCC_REGIMES[trial.regimeId];
  const regimeCopy = REGIME_COPY[trial.regimeId];
  const isPractice = taskMode === "practice" || taskMode === "wm_practice";
  const isWmPractice = taskMode === "wm_practice";
  const isSignal = trial.estimand === "signal_capacity";
  const isWm = trial.operator === "relational_wm";
  const showBlockPoints = !isPractice && !isSignal;
  const blockPoints = currentResults().reduce((total, result) => total + result.scoring.pointsRealised, 0);
  const wrapperLabel = trial.operator === "relational_wm"
    ? `${trial.wrapperId === "arrow_rel" ? "Arrow patterns" : "Moving-dot patterns"} · ${trial.wmNLevel}-back`
    : trial.wrapperId === "arrow_abs" ? "Left / Right arrows"
      : trial.wrapperId === "arrow_rel" ? "In / Out arrows"
        : "In / Out moving dots";
  const responseStage = isSignal || isWm ? taskStage === "response" : taskStage === "evidence";
  const controlsDisabled = trial.wmBuffer || !responseStage || !responseEnabled || responseLocked;
  const feedbackState = feedbackResult?.trial.wmBuffer
    ? "is-neutral"
    : feedbackResult?.scoring.isCorrect
    ? "is-correct"
    : feedbackResult?.scoring.responseClass === "answer" || feedbackResult?.scoring.responseClass === "omission"
        ? "is-incorrect"
        : "is-neutral";
  const feedbackIcon = feedbackState === "is-correct" ? "✓" : feedbackState === "is-incorrect" ? "×" : "·";
  const practiceComparisonCount = isWmPractice
    ? currentResults().filter((result) => !result.trial.wmBuffer && result.scoring.responseClass === "answer").length
    : 0;
  const feedbackOutcome = feedbackResult?.trial.wmBuffer
    ? "Keep this pattern in mind"
    : feedbackResult?.scoring.responseClass === "answer"
      ? feedbackResult.scoring.isCorrect ? "Correct" : "Incorrect"
      : feedbackResult?.scoring.responseClass === "omission" ? "No response" : "Paused";
  const trialFeedbackMarkup = `<div class="ccc-trial-result ${feedbackState}" role="status" aria-live="polite" aria-atomic="true" aria-label="${feedbackOutcome}"><span class="ccc-feedback-icon" aria-hidden="true">${feedbackIcon}</span></div>`;
  const feedbackDetailMarkup = trial.wmBuffer
    ? `<div class="ccc-value-panel ccc-signal-panel" aria-hidden="true"><div><span>Start the sequence</span><strong>Remember this pattern</strong></div><small></small></div>`
    : isSignal
      ? `<div class="ccc-value-panel ccc-signal-panel" aria-hidden="true"><div><span>Pattern check</span><strong>Watch, then choose</strong></div><small></small></div>`
      : isPractice
        ? `<div class="ccc-value-panel ccc-signal-panel" aria-hidden="true"><div><span>${isWmPractice ? `${trial.wmNLevel}-back practice` : "Practice"}</span><strong>${isWmPractice ? "Compare, then choose" : "Left or Right"}</strong></div><small>${isWmPractice ? `Practice ${Math.min(4, practiceComparisonCount)} of 4` : ""}</small></div>`
        : `<div class="ccc-feedback-spacer" aria-hidden="true"></div>`;
  const pot = regime.correctPot;
  const taskTitle = isSignal ? "Pattern check" : isWm ? `${isWmPractice ? "Practice" : "Hold and compare"} · ${trial.wmNLevel}-back` : isPractice ? "Practice" : regimeCopy.title;
  const taskCue = taskStage === "fixation" ? "Get ready"
    : taskStage === "interval" ? "Next pattern"
    : taskStage === "feedback" ? trial.wmBuffer ? "Remembered" : "Result"
        : taskStage === "mask" ? "Pattern covered"
          : taskStage === "response" ? "Make your best choice"
          : isSignal ? "Hold the majority direction"
            : isWm ? trial.wmBuffer ? "Remember this pattern" : `Does this match ${trial.wmNLevel} steps back?`
              : regimeCopy.cue;
  const stimulus = taskStage === "fixation"
    ? `<span class="ccc-fixation" aria-label="Get ready">+</span>`
    : taskStage === "interval"
      ? `<span class="ccc-interval-dot" aria-hidden="true"></span>`
      : taskStage === "mask"
        ? trial.carrier === "arrow" ? maskStimulus(trial) : flowMaskStimulus(trial)
        : taskStage === "response"
          ? `<span class="ccc-fixation" aria-label="Choose now">+</span>`
          : stimulusFor(trial);
  const responseButtons = trial.answerOptions.map((answer, index) => {
    const label = trial.responseLabels.labels[answer] || answer;
    const icon = answer === "left" ? "←" : answer === "right" ? "→" : answer === "in" ? "⇥" : answer === "out" ? "⇤" : answer === "match" ? "=" : "≠";
    const key = index === 0 ? "←" : "→";
    return `<button class="ccc-response" data-response="${answer}" aria-label="Choose ${label}" ${controlsDisabled ? "disabled" : ""}><span aria-hidden="true">${icon}</span><strong>${label}</strong><kbd>${key}</kbd></button>`;
  }).join("");
  return shell(`
    <section class="ccc-task-card">
      <div class="ccc-task-topline ${showBlockPoints ? "has-points" : ""}">
        <div><span>${isPractice ? "Practice" : `Stage ${journey.activeBlockIndex + 1} of ${journey.plan.blocks.length}`}</span><strong>${wrapperLabel}</strong></div>
        <div class="ccc-task-progress-wrap">${taskProgress(block)}</div>
        ${showBlockPoints ? `<div class="ccc-block-points" aria-label="Block points ${formatPointTotal(blockPoints)}"><span>Block points</span><strong>${formatPointTotal(blockPoints)}</strong></div>` : ""}
        <button class="ccc-exit" data-action="pause-session">Pause</button>
      </div>
      <div class="ccc-task-cue">
        <span>${taskTitle}</span>
        <strong>${taskCue}</strong>
      </div>
      <div class="ccc-stimulus-stage ${taskStage === "fixation" || taskStage === "response" || taskStage === "interval" ? "is-fixation" : ""} ${taskStage === "feedback" ? "is-feedback" : ""}">
        ${taskStage === "feedback" ? trialFeedbackMarkup : stimulus}
      </div>
      ${taskStage === "feedback" ? feedbackDetailMarkup : `
        ${isSignal ? `<div class="ccc-value-panel ccc-signal-panel"><div><span>Pattern check</span><strong>Watch, then choose</strong></div><small>Choose when the buttons appear.</small></div>`
          : isPractice ? `<div class="ccc-value-panel ccc-signal-panel"><div><span>Practice</span><strong>${isWmPractice ? trial.wmBuffer ? "Remember this pattern" : "Match or Different" : "Left or Right"}</strong></div><small></small></div>`
          : trial.wmBuffer ? `<div class="ccc-value-panel ccc-signal-panel"><div><span>Start the sequence</span><strong>Remember this pattern</strong></div><small>The first ${trial.wmNLevel} ${trial.wmNLevel === 1 ? "pattern starts" : "patterns start"} the sequence.</small></div>`
          : `<div class="ccc-value-panel">
          <div><span>Available if correct</span><strong id="ccc-live-pot">${Math.round(pot)}</strong></div>
          <div class="ccc-pot-track"><span id="ccc-pot-bar" style="width:100%"></span></div>
          <small>${isWm ? `Viewing time ${((block.selectedExposureMs || CCC_RELATIONAL_WM.defaultPresentationMs) / 1000).toFixed(2)} s · ` : ""}Wrong choice −${regime.errorLoss}</small>
        </div>`}`}
      <div class="ccc-response-row ${trial.wmBuffer ? "is-hidden" : ""}" aria-label="${isWm ? "Choose Match or Different" : "Choose the main direction"}" ${trial.wmBuffer ? "aria-hidden=\"true\"" : ""}>
        ${responseButtons}
      </div>
      <p class="ccc-task-helper" aria-live="polite">${taskStage === "fixation" || taskStage === "interval" ? "The next pattern is about to appear." : taskStage === "feedback" ? "" : isSignal ? taskStage === "response" ? "Choose Left or Right—even if you are unsure." : taskStage === "mask" ? "Keep your first impression in mind." : "Take in the pattern before the mask." : trial.wmBuffer ? "Remember this pattern; you will compare it with a later one." : isWm ? responseEnabled ? `Choose Match or Different by comparing with ${trial.wmNLevel} ${trial.wmNLevel === 1 ? "step" : "steps"} back.` : "Find the current pattern first." : responseEnabled ? "Look at the whole pattern, then make your best choice." : "Look at the whole pattern first."}</p>
    </section>
  `, "ccc-task-view");
}

function renderPaused(): string {
  return shell(`
    <section class="ccc-narrow-card">
      <span class="ccc-kicker">Training paused</span>
      <h1>Your place is saved.</h1>
      <p>Continue when you are ready.</p>
      <div class="ccc-actions">
        <button class="ccc-button ccc-button-primary" data-action="resume-task">Continue</button>
        <button class="ccc-button ccc-button-quiet" data-action="back-welcome">Leave for now</button>
      </div>
    </section>`, "ccc-pause-view ccc-viewport-view");
}

function formatPercent(value: number | null): string {
  return value === null ? "—" : `${Math.round(value * 100)}%`;
}

function formatTime(value: number | null): string {
  return value === null ? "—" : `${(value / 1000).toFixed(1)} s`;
}

function timingShiftMeaning(value: number | null): string {
  if (value === null) return "Still building";
  if (Math.abs(value) < 100) return "Used similar timing";
  return value > 0 ? "Slowed when mistakes cost more" : "Sped up when delay cost more";
}

function metricBar(label: string, value: number | null, maximum: number, display: string, tone = "blue"): string {
  const percentage = value === null ? 0 : Math.max(0, Math.min(100, value / maximum * 100));
  return `<div class="ccc-metric-row"><div><span>${label}</span><strong>${display}</strong></div><div class="ccc-metric-bar is-${tone}" role="img" aria-label="${label}: ${display}"><i style="width:${percentage}%"></i></div></div>`;
}

function strategyHistoryForCurrentBlock(): CccRecordedTrial[] {
  if (!journey) return [];
  const block = currentBlock();
  if (!block) return [];
  return journey.plan.blocks
    .slice(0, journey.activeBlockIndex + 1)
    .filter((candidate) => candidate.operator === block.operator)
    .flatMap((candidate) => journey!.blockResults[candidate.id] || []);
}

function renderStrategyCard(item: CccRegimeStrategyFeedback): string {
  const timing = item.observedMedianMs === null
    ? `${item.observationCount} choices recorded`
    : item.estimatedBestMs === null
      ? `You used ${(item.observedMedianMs / 1000).toFixed(1)} s`
      : `You used ${(item.observedMedianMs / 1000).toFixed(1)} s · try about ${(item.estimatedBestMs / 1000).toFixed(1)} s`;
  return `<article class="ccc-strategy-card is-${item.direction}">
    <span>${REGIME_COPY[item.regimeId].title}</span>
    <strong>${item.title}</strong>
    <p>${item.guidance}</p>
    <small>${timing}</small>
  </article>`;
}

function renderPolicyCoaching(block: CccAttentionBlockPlan): string {
  if (block.estimand === "signal_capacity") return "";
  const strategy = buildCccStrategyFeedback(strategyHistoryForCurrentBlock(), block.regimePair, block.operator);
  return `<section class="ccc-policy-coaching">
    <div class="ccc-section-heading"><span>Try this next</span><strong>Match how long you look to the rewards and costs</strong></div>
    <div class="ccc-strategy-grid">${strategy.regimes.map(renderStrategyCard).join("")}</div>
    <p class="ccc-strategy-principle"><strong>Keep this principle:</strong> ${strategy.principle}</p>
  </section>`;
}

function strategyFeedbackForResults(results: readonly CccRecordedTrial[]) {
  const counts = {
    attention: results.filter((result) => result.trial.operator === "attention"
      && result.trial.presentationMode === "self_paced_value").length,
    relational_wm: results.filter((result) => result.trial.operator === "relational_wm"
      && result.trial.presentationMode === "self_paced_value").length,
  };
  const operator = counts.relational_wm > counts.attention ? "relational_wm" : "attention";
  const regimeIds = journey?.plan.regimePair || [];
  return regimeIds.length ? buildCccStrategyFeedback(results, regimeIds, operator) : null;
}

function renderStrategyTakeaway(results: readonly CccRecordedTrial[], persistent = false): string {
  const strategy = strategyFeedbackForResults(results);
  if (!strategy) return "";
  const actionable = strategy.regimes.find((item) => item.direction === "slow_down" || item.direction === "speed_up");
  const balanced = strategy.regimes.find((item) => item.direction === "well_balanced");
  const lead = actionable || balanced;
  return `<section class="ccc-strategy-takeaway ${persistent ? "is-persistent" : ""}">
    <span>${persistent ? "Latest strategy guidance" : "Strategy takeaway"}</span>
    <strong>${lead?.title || "Adjust certainty to the payoffs"}</strong>
    <p>${lead?.guidance || strategy.principle}</p>
    ${lead ? `<small>${REGIME_COPY[lead.regimeId].title}</small>` : ""}
  </section>`;
}

function blockMeaning(feedback: ReturnType<typeof buildCccBlockFeedback>, isWm: boolean, isSignal: boolean): string {
  const accuracy = isWm ? feedback.wmBalancedAccuracy : feedback.accuracy;
  if (accuracy === null) return "This block has set a starting point. The next blocks will show whether the skill is becoming steadier.";
  if (isSignal) {
    if (accuracy >= 0.85) return "You found the main pattern reliably, including when the signal was less obvious.";
    if (accuracy >= 0.7) return "You found the main pattern most of the time. The less obvious patterns offer the clearest room to improve.";
    return "The main pattern was difficult to pick out. Take in the whole display before settling on a direction.";
  }
  const skill = isWm ? "held and compared the patterns" : "found the main pattern";
  if (accuracy >= 0.8 && feedback.pointsKeptPercent < 50) {
    return `You ${skill} accurately, but waiting used up many of the available points. Try committing a little sooner when the answer is clear.`;
  }
  if (accuracy < 0.7) {
    return `This block was demanding: missed choices cost more points than waiting. Give the less obvious patterns enough time before choosing.`;
  }
  if (feedback.pointsKeptPercent >= 65) {
    return `You ${skill} while keeping a good share of the available points — a useful balance of accuracy and timing.`;
  }
  return `You ${skill} in most trials. The next step is to adjust when you commit so that accuracy and timing work together.`;
}

function renderBlockComplete(): string {
  if (!journey) return renderWelcome();
  const block = currentBlock();
  if (!block) return renderComplete();
  const results = currentResults();
  const feedback = buildCccBlockFeedback(results);
  const learningCurve = evaluateCccLearningCurve(block, results, undefined, programme.evidence.attentionSourceLearningCurve);
  const isPractice = taskMode === "practice";
  const isSignal = block.estimand === "signal_capacity";
  const isWm = block.operator === "relational_wm";
  const wmPairDecision = isWm && block.wmPairPosition === "B" && block.wmPairIndex
    ? evaluateCccWmPair(
        journey.plan.blocks
          .filter((candidate) => candidate.operator === "relational_wm" && candidate.wmPairIndex === block.wmPairIndex)
          .flatMap((candidate) => journey!.blockResults[candidate.id] || []),
        block.wmNLevel || programme.wmLevel,
      )
    : null;
  const wmLevelMessage = wmPairDecision
    ? wmPairDecision.nextLevel > wmPairDecision.currentLevel
      ? `Next: ${wmPairDecision.nextLevel}-back.`
      : wmPairDecision.nextLevel < wmPairDecision.currentLevel
        ? `Next: ${wmPairDecision.nextLevel}-back to rebuild accuracy.`
        : wmPairDecision.direction === "increase"
          ? `You reached the current maximum of ${wmPairDecision.currentLevel}-back.`
          : `Next: stay at ${wmPairDecision.currentLevel}-back.`
    : "";
  const copy = block.phase === "practice" ? {
    title: "You know the task.",
    body: "Next comes a quick pattern check, followed by In and Out practice.",
  } : isSignal ? {
    title: "Your pattern check is complete.",
    body: "Next you will practise with points, time pressure and changing formats.",
  } : block.diagnostic ? {
    title: "First try complete.",
    body: "Next: more practice with this display.",
  } : {
    title: learningCurve.status === "stabilised" ? "Your recent results were steady." : "Stage complete.",
    body: learningCurve.status === "stabilised"
      ? "A new display is ready."
      : learningCurve.status === "exposure_ceiling"
        ? "Today’s practice is complete. Continue next time."
        : "You completed both parts of this stage.",
  };
  return shell(`
    <section class="ccc-narrow-card">
      <span class="ccc-kicker">${isPractice ? "Practice complete" : `Stage ${journey.activeBlockIndex + 1} complete`}</span>
      <h1>${copy.title}</h1>
      ${isPractice ? `<p>${copy.body}</p>` : ""}
      ${isPractice ? "" : `<aside class="ccc-block-meaning"><span>What this block shows</span><strong>${blockMeaning(feedback, isWm, isSignal)}</strong></aside>`}
      ${isPractice ? "" : `
        <div class="ccc-summary-grid ${isSignal ? "" : "ccc-points-summary"}">
          <article><span>${isWm ? "Holding and comparing" : "Finding the main pattern"}</span><strong>${formatPercent(isWm ? feedback.wmBalancedAccuracy : feedback.accuracy)}</strong><small>Correct choices</small></article>
          ${isSignal
            ? `<article><span>Time before choosing</span><strong>${formatTime(feedback.medianDecisionMs)}</strong><small>Typical response</small></article>
              <article><span>Patterns completed</span><strong>${feedback.observationCount}</strong><small>Useful responses</small></article>`
            : `<article class="is-points-total"><span>Points earned</span><strong>${formatPointTotal(feedback.points)}</strong><small>This block’s total</small></article>
              <article><span>Decision balance</span><strong>${feedback.pointsKeptPercent}%</strong><small>Available points kept through accuracy and timely choices</small></article>`}
        </div>`}
      ${wmLevelMessage ? `<p class="ccc-learning-status"><strong>Memory level:</strong> ${wmLevelMessage}</p>` : ""}
      ${learningCurve.status === "stabilised" ? `<p class="ccc-learning-status"><strong>New display next.</strong> Your recent results were steady.</p>` : ""}
      ${learningCurve.status === "exposure_ceiling" ? `<p class="ccc-learning-status"><strong>Continue next time.</strong> Today’s practice is complete.</p>` : ""}
      ${isPractice ? `<aside class="ccc-workflow-bridge"><span>Next</span><strong>${WORKFLOW_CHOICES[journey.workflowChoice].example}</strong></aside>` : ""}
      <div class="ccc-actions">
        <button class="ccc-button ccc-button-primary" data-action="${isPractice ? "continue-after-block" : "show-block-insights"}">${isPractice ? "Continue" : "See what changed"}</button>
        <button class="ccc-button ccc-button-quiet" data-action="back-welcome">Save and leave</button>
      </div>
    </section>`, `ccc-review-view ccc-viewport-view ${isPractice ? "ccc-practice-review" : ""}`);
}

function renderBlockInsights(): string {
  if (!journey) return renderWelcome();
  const block = currentBlock();
  if (!block || block.phase === "practice") return renderWelcome();
  const feedback = buildCccBlockFeedback(currentResults());
  const isSignal = block.estimand === "signal_capacity";
  const clarityBars = feedback.clarity.map((item) => metricBar(
    `${item.label} pattern`,
    item.accuracy,
    1,
    item.count ? formatPercent(item.accuracy) : "Not shown",
    item.ratio === "3:2" ? "focus" : "blue",
  )).join("");
  const nicheBars = feedback.niches.map((item) => metricBar(
    item.label,
    item.medianDecisionMs,
    CCC_TRIAL_TIMING.maxResponseWindowMs,
    formatTime(item.medianDecisionMs),
    "teal",
  )).join("");
  const shift = feedback.timingShiftMs === null
    ? "Keep practising to compare the two conditions."
    : Math.abs(feedback.timingShiftMs) < 100
      ? "You used a similar viewing time in both conditions."
      : feedback.timingShiftMs > 0
        ? `You looked ${(Math.abs(feedback.timingShiftMs) / 1000).toFixed(1)} s longer when mistakes cost more.`
        : `You looked ${(Math.abs(feedback.timingShiftMs) / 1000).toFixed(1)} s less when mistakes cost more.`;
  return shell(`
    <section class="ccc-narrow-card ccc-insights-card">
      <div class="ccc-stage-line"><span>Stage ${journey.activeBlockIndex + 1} feedback</span><span>${feedback.observationCount} patterns</span></div>
      <span class="ccc-kicker">${isSignal ? "Clear and less obvious patterns" : "Look, then choose"}</span>
      <h1>${isSignal ? "What made the pattern easier or harder" : "How the rewards and costs changed your choices"}</h1>
      <div class="ccc-chart-grid ${isSignal ? "is-single" : ""}">
        <section><h2>Finding the main pattern</h2>${clarityBars}</section>
        ${isSignal ? "" : `<section><h2>Time before choosing</h2>${nicheBars}</section>`}
      </div>
      <p class="ccc-insight-callout"><strong>What to notice:</strong> ${isSignal ? "Compare how often you found the direction when it was clear with when it was less obvious." : shift}</p>
      ${renderPolicyCoaching(block)}
      <div class="ccc-actions">
        <button class="ccc-button ccc-button-primary" data-action="show-block-reconnect">Connect this to your workflow</button>
        <button class="ccc-button ccc-button-quiet" data-action="back-welcome">Save and leave</button>
      </div>
    </section>`, "ccc-insights-view ccc-viewport-view");
}

function renderBlockReconnect(): string {
  if (!journey) return renderWelcome();
  const block = currentBlock();
  if (!block || block.phase === "practice") return renderWelcome();
  const learningCurve = evaluateCccLearningCurve(block, currentResults(), undefined, programme.evidence.attentionSourceLearningCurve);
  const exposureStopped = learningCurve.status === "exposure_ceiling";
  const isLast = exposureStopped || journey.activeBlockIndex === journey.plan.blocks.length - 1;
  const isWm = block.operator === "relational_wm";
  return shell(`
    <section class="ccc-narrow-card ccc-block-reconnect-card">
      <div class="ccc-stage-line"><span>Stage ${journey.activeBlockIndex + 1} complete</span><span>${Math.round(journeyCompletionRatio(journey) * 100)}% complete</span></div>
      <span class="ccc-kicker">${isWm ? "Next block" : "Your chosen task"}</span>
      <h1>${isWm ? "Choose your next strategy." : "Reconnect before you move on."}</h1>
      <aside class="ccc-workflow-bridge">
        <span>${WORKFLOW_CHOICES[journey.workflowChoice].label}</span>
        <strong>${workflowBridge(block.phase, journey.workflowChoice)}</strong>
      </aside>
      <p class="ccc-soft-note">${isWm ? "The rule stays the same, but the points change. Choose a viewing time for the new conditions." : "Try this in your real task and notice whether it helps."}</p>
      <div class="ccc-actions">
        <button class="ccc-button ccc-button-primary" data-action="continue-after-block">${exposureStopped ? "Finish today’s practice" : isLast ? "See your journey review" : isWm ? "Continue to the next block" : "Continue to the next stage"}</button>
        <button class="ccc-button ccc-button-quiet" data-action="back-welcome">Save and leave</button>
      </div>
    </section>`, "ccc-block-reconnect-view ccc-viewport-view");
}

function renderShiftView(): string {
  return shell(`
    <section class="ccc-shift-card">
      <div class="ccc-stage-line"><span>New pattern ahead</span><strong id="ccc-shift-countdown">0:30</strong></div>
      <div class="ccc-shift-progress" aria-hidden="true"><span id="ccc-shift-progress-bar"></span></div>
      <span class="ccc-kicker">Shift the View</span>
      <h1>Actively group the dots into one rotating sphere.</h1>
      <p id="ccc-shift-instruction">Bring the dots together as one complete 3D ball, rather than two flat sheets.</p>
      <canvas id="ccc-sphere" class="ccc-sphere" role="img" aria-label="A sparse, slowly rotating field of soft-blue dots that can be actively grouped into one ambiguous sphere"></canvas>
      <div id="ccc-shift-controls" class="ccc-shift-controls">
        ${shiftStaticMode
          ? `<p class="ccc-soft-note">Still image selected.</p>`
          : `<button class="ccc-button ccc-button-secondary" data-action="shift-confirm">I see one whole sphere</button><button class="ccc-button ccc-button-quiet" data-action="shift-not-yet">Not yet</button>`}
      </div>
      <button class="ccc-text-button" data-action="shift-toggle-motion">${shiftStaticMode ? "Use the moving version" : "Use a still reset"}</button>
    </section>
  `, "ccc-shift-view ccc-viewport-view");
}

function renderComplete(): string {
  if (!journey) return renderWelcome();
  const allResults = Object.values(journey.blockResults).flat();
  const signalFeedback = buildCccBlockFeedback(allResults.filter((result) => result.trial.estimand === "signal_capacity"));
  const policyFeedback = buildCccBlockFeedback(allResults.filter((result) => result.trial.estimand !== "signal_capacity" && !result.trial.wmBuffer));
  const attentionFeedback = buildCccBlockFeedback(allResults.filter((result) => result.trial.operator === "attention" && result.trial.estimand !== "signal_capacity"));
  const wmFeedback = buildCccBlockFeedback(allResults.filter((result) => result.trial.operator === "relational_wm" && !result.trial.wmBuffer));
  const hasSignal = signalFeedback.observationCount > 0;
  const hasWm = wmFeedback.observationCount > 0;
  const sessionSummary = programme.sessions.find((session) => session.sessionId === journey?.plan.sessionId);
  return shell(`
    <section class="ccc-complete-card">
      <span class="ccc-kicker">Session ${journey.plan.programmeSessionNumber} complete</span>
      <h1>This session is complete.</h1>
      <p>${sessionSummary?.gateDecisions.at(-1) || "Your progress is saved."}</p>
      <div class="ccc-summary-grid">
        <article><span>Finding the main pattern</span><strong>${hasSignal ? formatPercent(signalFeedback.accuracy) : formatPercent(attentionFeedback.accuracy)}</strong></article>
        <article><span>${hasWm ? "Holding and comparing" : "Adjusting to different stakes"}</span><strong>${hasWm ? formatPercent(wmFeedback.wmBalancedAccuracy) : timingShiftMeaning(policyFeedback.timingShiftMs)}</strong></article>
        <article><span>${hasWm ? "Saved memory challenge" : "Programme progress"}</span><strong>${hasWm ? `${programme.wmLevel} ${programme.wmLevel === 1 ? "pattern" : "patterns"} back` : `${programmeProgressPercent(programme)}%`}</strong></article>
      </div>
      ${renderStrategyTakeaway(allResults)}
      <div class="ccc-actions">
        <button class="ccc-button ccc-button-primary" data-action="show-complete-reconnect">Use this in ${WORKFLOW_CHOICES[journey.workflowChoice].label.toLowerCase()}</button>
        <button class="ccc-button ccc-button-quiet" data-action="return-home">Return home</button>
      </div>
    </section>`, "ccc-complete-view ccc-viewport-view");
}

const TRAINING_METRICS: Array<{
  key: CccProgressMetricKey;
  label: string;
  detail: string;
  populationKey: string;
  lowerIsBetter?: boolean;
  rawValue?: boolean;
}> = [
  { key: "accuracy", label: "Finding the pattern", detail: "How reliably you picked out the main direction", populationKey: "session.attention_accuracy" },
  { key: "decisionTime", label: "Time before choosing", detail: "How long you gathered information before deciding", populationKey: "session.decision_time_ms", rawValue: true },
  { key: "pointsKept", label: "Decision balance", detail: "How well you balanced accuracy with timely choices", populationKey: "session.points_kept" },
  { key: "closePatterns", label: "Finding a weak signal", detail: "How accurately you responded when the answer was less obvious", populationKey: "session.close_pattern_accuracy" },
  { key: "workingMemory", label: "Holding and comparing", detail: "How reliably you compared the current relation with an earlier one", populationKey: "session.wm_accuracy" },
];

function latestSessionMetrics() {
  return programme.sessions.filter((session) => session.metrics).at(-1)?.metrics;
}

function trainingScoreFor(key: CccProgressMetricKey): number | null {
  const sessions = programme.sessions.filter((session) => session.metrics);
  const latest = sessions.at(-1);
  const metric = TRAINING_METRICS.find((item) => item.key === key)!;
  if (metric.rawValue) return sessionMetricValue(latest?.metrics, key);
  return displayTrainingScore({
    value: sessionMetricValue(latest?.metrics, key),
    baseline: firstValidBaseline(sessions, key),
    mode: comparisonMode,
    population: populationScores[metric.populationKey],
    lowerIsBetter: metric.lowerIsBetter,
  });
}

function scoreForSessionMetric(
  session: CccProgrammeState["sessions"][number],
  metric: typeof TRAINING_METRICS[number],
  mode: CccComparisonMode,
): number | null {
  if (metric.rawValue) return sessionMetricValue(session.metrics, metric.key);
  return displayTrainingScore({
    value: sessionMetricValue(session.metrics, metric.key),
    baseline: firstValidBaseline(programme.sessions, metric.key),
    mode,
    population: mode === "population" && session === programme.sessions.at(-1) ? populationScores[metric.populationKey] : null,
    lowerIsBetter: metric.lowerIsBetter,
  });
}

function scoreStatus(score: number | null): string {
  if (score === null) return "Building";
  if (comparisonMode === "population") {
    if (score >= 110) return "Above other app users’ average";
    if (score >= 90) return "Around other app users’ average";
    return "Below other app users’ average";
  }
  if (score >= 110) return "Clear improvement from your start";
  if (score > 100) return "Improving from your start";
  if (score >= 95) return "Close to where you started";
  return "Below your starting result for now";
}

function metricDisplay(metric: typeof TRAINING_METRICS[number], value: number | null): string {
  if (value === null) return "—";
  return metric.rawValue ? `${(value / 1000).toFixed(1)} s` : String(value);
}

function trainingMetricCard(metric: typeof TRAINING_METRICS[number]): string {
  const score = trainingScoreFor(metric.key);
  const values = programme.sessions
    .filter((session) => session.metrics)
    .map((session) => scoreForSessionMetric(session, metric, comparisonMode))
    .filter((value): value is number => value !== null);
  const points = progressSparkline(values, 260, 58);
  return `<article class="ccc-progress-metric-card">
    <div><span>${metric.label}</span><strong>${metricDisplay(metric, score)}</strong></div>
    <p>${metric.detail}</p>
    ${points ? `<svg viewBox="0 0 260 68" role="img" aria-label="${metric.label} session trend"><line x1="0" x2="260" y1="58" y2="58"></line><polyline points="${points}"></polyline></svg>` : ""}
    <small>${metric.rawValue
      ? "Read this with accuracy and decision balance"
      : comparisonMode === "population" && score === null
        ? "Waiting for enough comparable user results · the other-user average will be 100"
        : `${scoreStatus(score)} · ${comparisonMode === "personal" ? "your starting result is 100" : "the other-user average is 100"}`}</small>
  </article>`;
}

const SESSION_TREND_SERIES: Array<{
  key: CccProgressMetricKey;
  label: string;
  className: string;
}> = [
  { key: "accuracy", label: "Finding the pattern", className: "is-attention" },
  { key: "pointsKept", label: "Decision balance", className: "is-points" },
  { key: "workingMemory", label: "Holding and comparing", className: "is-memory" },
];

function renderSessionTrendChart(): string {
  const scoredSessions = programme.sessions.filter((session) => session.metrics);
  const sessions = comparisonMode === "population" ? scoredSessions.slice(-1) : scoredSessions.slice(-8);
  if (!sessions.length) return "";
  const width = 720;
  const height = 220;
  const left = 44;
  const right = 18;
  const top = 18;
  const bottom = 34;
  const plotWidth = width - left - right;
  const plotHeight = height - top - bottom;
  const xFor = (index: number) => sessions.length === 1
    ? left + plotWidth / 2
    : left + index / (sessions.length - 1) * plotWidth;
  const yFor = (value: number) => top + (130 - Math.max(70, Math.min(130, value))) / 60 * plotHeight;
  const series = SESSION_TREND_SERIES.map((item) => {
    const metric = TRAINING_METRICS.find((candidate) => candidate.key === item.key)!;
    const values = sessions.map((session) => scoreForSessionMetric(session, metric, comparisonMode));
    const available = values
      .map((value, index) => value === null ? null : { value, index, x: xFor(index), y: yFor(value) })
      .filter((point): point is { value: number; index: number; x: number; y: number } => point !== null);
    return { ...item, values, available, latest: [...values].reverse().find((value) => value !== null) ?? null };
  });
  const visibleSeries = series.filter((item) => item.available.length);
  const grid = [80, 100, 120].map((value) => `
    <line class="${value === 100 ? "is-baseline" : "is-grid"}" x1="${left}" x2="${width - right}" y1="${yFor(value).toFixed(1)}" y2="${yFor(value).toFixed(1)}"></line>
    <text class="ccc-session-trend-axis" x="8" y="${(yFor(value) + 4).toFixed(1)}">${value}</text>
  `).join("");
  const xLabels = sessions.map((session, index) => `<text class="ccc-session-trend-axis" x="${xFor(index).toFixed(1)}" y="${height - 8}" text-anchor="middle">${comparisonMode === "population" ? "Latest" : `S${session.sessionNumber}`}</text>`).join("");
  const populationComparison = comparisonMode === "population";
  if (populationComparison && !visibleSeries.length) return `<section class="ccc-session-trend-card ccc-standardised-waiting">
    <div class="ccc-session-trend-heading">
      <div><span>Standardised comparison</span><strong>Other-user comparison is being prepared</strong></div>
      <small>The average will be 100 when enough comparable app results are available.</small>
    </div>
    <p>Your session data is synced, but no comparison score is shown until the reference group is large enough.</p>
  </section>`;
  return `<section class="ccc-session-trend-card" aria-labelledby="ccc-session-trend-title">
    <div class="ccc-session-trend-heading">
      <div><span>${populationComparison ? "Standardised comparison" : "Personal progress"}</span><strong id="ccc-session-trend-title">${populationComparison ? "Your latest result against other app users" : "Change across your sessions"}</strong></div>
      <small>${populationComparison ? "100 marks the other-user average. Above 100 means above average." : "100 marks where you started. A line above 100 shows improvement."}</small>
    </div>
    <div class="ccc-session-trend-legend">${visibleSeries.map((item) => `<span class="${item.className}"><i></i>${item.label}<strong>${item.latest ?? "—"}</strong></span>`).join("")}</div>
    <svg class="ccc-session-trend-chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="${populationComparison ? "Latest cognitive-control results compared with other app users" : "Finding the pattern, decision balance and holding-and-comparing performance across sessions"}">
      ${grid}
      ${visibleSeries.map((item) => `<path class="ccc-session-trend-line ${item.className}" d="${item.available.map((point, index) => `${index ? "L" : "M"}${point.x.toFixed(1)} ${point.y.toFixed(1)}`).join(" ")}"></path>`).join("")}
      ${visibleSeries.map((item) => item.available.map((point) => `<circle class="ccc-session-trend-dot ${item.className}" cx="${point.x.toFixed(1)}" cy="${point.y.toFixed(1)}" r="4"></circle>`).join("")).join("")}
      <line class="ccc-session-trend-axis-line" x1="${left}" x2="${width - right}" y1="${height - bottom}" y2="${height - bottom}"></line>
      ${xLabels}
    </svg>
    <p class="ccc-session-trend-explainer">${populationComparison ? "Each point shows where your latest standardised skill score sits around the other-user average of 100." : "The graph separates finding relevant information, holding it across time and choosing efficiently enough for the current rewards and costs."}</p>
  </section>`;
}

function proofScoresFor(domain: CccProofDomain): CccProofScore[] {
  return [...(programme.proofScores || [])]
    .filter((score) => score.domain === domain)
    .sort((a, b) => a.completedAt.localeCompare(b.completedAt));
}

function proofCard(domain: CccProofDomain, label: string): string {
  const scores = proofScoresFor(domain);
  const latest = scores.at(-1);
  const values = scores.map((score) => score.score).filter((value): value is number => value !== null);
  const points = progressSparkline(values, 260, 58);
  const meaning = domain === "attention"
    ? "Staying focused and resisting distraction"
    : domain === "working_memory"
      ? "Holding and updating information"
      : "Finding patterns and solving new problems";
  return `<article class="ccc-proof-card is-${domain.replace("_", "-")}">
    <div><span>${label}</span><strong>${latest?.score ?? "—"}</strong></div>
    ${points ? `<svg viewBox="0 0 260 68" role="img" aria-label="${label} G Track trend"><line x1="0" x2="260" y1="58" y2="58"></line><polyline points="${points}"></polyline></svg>` : ""}
    <p>${meaning}</p>
    <small>${latest ? `Latest check ${latest.completedAt} · 100 is the reference-group average` : authUser ? "No G Track result found yet" : "Sign in to import your G Track results"}</small>
  </article>`;
}

function renderComparisonContext(): string {
  const available = populationModeAvailable(populationScores);
  const standardSelected = dataMode === "cloud_benchmark";
  const storage = dataMode === "local" ? "Saved in this browser" : "Saved to your cloud account";
  const comparison = standardSelected
    ? available ? "100 is the other-user average" : "The other-user average is still building"
    : "100 is your own starting result";
  return `<section class="ccc-comparison-context">
    <div><span>How to read these scores</span><strong>${standardSelected ? "Compared with other app users" : "Compared with your own starting point"}</strong><small>${storage} · ${comparison}</small></div>
    <button class="ccc-text-button" data-action="open-data">Change data option</button>
  </section>`;
}

function progressPanelNavigation(): string {
  const hasSession = Boolean(journey);
  return `<nav class="ccc-progress-segments" aria-label="Progress view">
    ${hasSession ? `<button data-action="show-session-progress" class="${progressPanel === "session" ? "is-active" : ""}" aria-pressed="${progressPanel === "session"}">This session</button>` : ""}
    <button data-action="show-history-progress" class="${progressPanel === "history" ? "is-active" : ""}" aria-pressed="${progressPanel === "history"}">Across sessions</button>
    <button data-action="show-proof-progress" class="${progressPanel === "proof" ? "is-active" : ""}" aria-pressed="${progressPanel === "proof"}">G Track scores</button>
  </nav>`;
}

function currentSessionResults(): CccRecordedTrial[] {
  return journey ? Object.values(journey.blockResults).flat() : [];
}

function sessionStageCounts(): { complete: number; total: number } {
  if (!journey) return { complete: 0, total: 0 };
  const stages = journey.plan.blocks
    .map((block, index) => ({ block, index }))
    .filter(({ block }) => block.phase !== "practice");
  const complete = stages.filter(({ block, index }) => {
    if (index < journey!.activeBlockIndex) return true;
    if (index > journey!.activeBlockIndex) return false;
    const results = journey!.blockResults[block.id] || [];
    const counted = results.filter((result) => result.scoring.countsTowardQuota).length;
    return counted >= block.validTrialCount || Boolean(journey!.completedAt);
  }).length;
  return { complete, total: stages.length };
}

function sessionMetricTile(label: string, value: string, detail: string): string {
  return `<article><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong><small>${escapeHtml(detail)}</small></article>`;
}

function progressReturnLabel(): string {
  if (journey?.completedAt) return "Return to session review";
  if (progressReturnView === "block_complete" || progressReturnView === "block_insights" || progressReturnView === "block_reconnect") return "Return to block feedback";
  if (progressReturnView === "paused") return "Return to paused session";
  if (progressReturnView === "wm_practice_result") return "Return to practice feedback";
  if (progressReturnView === "welcome") return "Resume session";
  return "Return to session";
}

function progressReturnTarget(): View {
  if (journey?.completedAt) return "complete";
  return progressReturnView === "progress" || progressReturnView === "data" || progressReturnView === "auth"
    ? "welcome"
    : progressReturnView;
}

function renderCurrentSessionProgress(): string {
  if (!journey) return `<section class="ccc-progress-section ccc-empty-session-progress">
    <div class="ccc-section-heading"><span>This session</span><strong>Not started</strong></div>
    <h2>Start a session to see progress here.</h2>
  </section>`;
  const results = currentSessionResults();
  const metrics = buildCccSessionMetrics(results);
  const stages = sessionStageCounts();
  const current = journey.plan.blocks[journey.activeBlockIndex] || null;
  const stageLabel = current ? JOURNEY_LABELS[current.phase] || current.label : "Review";
  const completion = Math.round(journeyCompletionRatio(journey) * 100);
  const blockFeedback = buildCccBlockFeedback(results.filter((result) => !result.trial.wmBuffer));
  const relevantAccuracy = metrics.wmAccuracy ?? metrics.attentionAccuracy ?? metrics.signalAccuracy;
  const hasPolicyResults = metrics.pointsKeptPercent !== null;
  const operatorResults = current
    ? journey.plan.blocks
        .slice(0, journey.activeBlockIndex + 1)
        .filter((block) => block.operator === current.operator)
        .flatMap((block) => journey!.blockResults[block.id] || [])
    : [];
  const strategy = current && current.estimand !== "signal_capacity"
    ? buildCccStrategyFeedback(operatorResults, current.regimePair, current.operator)
    : null;
  const strategyLead = strategy?.regimes.find((item) => item.direction === "slow_down" || item.direction === "speed_up")
    || strategy?.regimes.find((item) => item.direction === "well_balanced")
    || strategy?.regimes[0];
  return `<section class="ccc-current-session-progress">
    <div class="ccc-progress-hero ccc-session-progress-hero">
      <div><span class="ccc-kicker">Session ${journey.plan.programmeSessionNumber} · ${stageLabel}</span><h1>${journey.completedAt ? "Your session review" : "Your session so far"}</h1></div>
      <div class="ccc-progress-hero-stat"><span>Session complete</span><strong>${completion}%</strong><small>${stages.complete} of ${stages.total} stages complete</small></div>
    </div>
    ${progressPanelNavigation()}
    <section class="ccc-progress-section">
      <div class="ccc-section-heading"><span>Results so far</span><strong>${blockFeedback.observationCount ? `${blockFeedback.observationCount} patterns completed` : "Your first results will appear here"}</strong></div>
      <div class="ccc-live-session-grid">
        ${sessionMetricTile(metrics.wmAccuracy !== null ? "Holding and comparing" : "Finding the main pattern", formatPercent(relevantAccuracy), metrics.wmAccuracy !== null ? `${programme.wmLevel} ${programme.wmLevel === 1 ? "pattern" : "patterns"} back is saved` : "How often you chose the main direction")}
        ${sessionMetricTile("Time before choosing", formatTime(metrics.medianDecisionMs), "How long you gathered information")}
        ${sessionMetricTile("Decision balance", hasPolicyResults ? `${metrics.pointsKeptPercent}%` : "—", hasPolicyResults ? "Accuracy and timely choices together" : "Starts when points are used")}
        ${sessionMetricTile("Finding a weak signal", formatPercent(metrics.closePatternAccuracy), "Accuracy when the answer was least obvious")}
      </div>
    </section>
    <section class="ccc-progress-section ccc-session-strategy">
      <div class="ccc-section-heading"><span>Current strategy</span><strong>${strategyLead ? REGIME_COPY[strategyLead.regimeId].title : "Notice the pattern first"}</strong></div>
      <h2>${escapeHtml(strategyLead?.title || "Build a clear first impression")}</h2>
      <p>${escapeHtml(strategyLead?.guidance || "Watch the whole pattern and make your best choice when the main direction is clear enough.")}</p>
      ${strategy ? `<small>${escapeHtml(strategy.principle)}</small>` : ""}
    </section>
    <div class="ccc-progress-return"><button class="ccc-button ccc-button-primary" data-action="return-session">${progressReturnLabel()}</button></div>
  </section>`;
}

function renderProgressHistory(): string {
  const sessionsWithMetrics = programme.sessions.filter((session) => session.metrics);
  const latest = latestSessionMetrics();
  if (progressHistoryPage === "skills") {
    return `<section class="ccc-progress-screen ccc-progress-detail-screen">
      <div class="ccc-progress-compact-heading"><span class="ccc-kicker">Across sessions</span><h1>Skill details</h1><p>Each card explains one part of cognitive control in everyday language.</p></div>
      ${progressPanelNavigation()}
      ${renderComparisonContext()}
      <section class="ccc-progress-section ccc-skill-detail-section">
        <div class="ccc-progress-metric-grid">${TRAINING_METRICS.map(trainingMetricCard).join("")}</div>
      </section>
      <div class="ccc-page-actions"><button class="ccc-button ccc-button-secondary" data-action="show-history-overview">Back to running graph</button>${journey && !journey.completedAt ? `<button class="ccc-button ccc-button-primary" data-action="return-session">${progressReturnLabel()}</button>` : ""}</div>
    </section>`;
  }
  return `<section class="ccc-progress-screen">
    <div class="ccc-progress-hero">
      <div><span class="ccc-kicker">Across sessions</span><h1>${comparisonMode === "population" ? "Your latest results" : "How your results change"}</h1></div>
      <div class="ccc-progress-hero-stat"><span>Sessions with feedback</span><strong>${sessionsWithMetrics.length}</strong><small>Programme ${programmeProgressPercent(programme)}% complete</small></div>
    </div>
    ${progressPanelNavigation()}
    ${renderComparisonContext()}
    ${progressMessage ? `<p class="ccc-progress-message">${escapeHtml(progressMessage)}</p>` : ""}
    <section class="ccc-progress-section">
      <div class="ccc-section-heading"><span>Running graph</span><strong>${latest ? "Change across completed sessions" : "Complete a session to start"}</strong></div>
      ${renderSessionTrendChart()}
      <div class="ccc-inline-actions"><button class="ccc-button ccc-button-secondary" data-action="show-history-skills">View skill details</button></div>
    </section>
    ${journey && !journey.completedAt ? `<div class="ccc-progress-return"><button class="ccc-button ccc-button-primary" data-action="return-session">${progressReturnLabel()}</button></div>` : ""}
  </section>`;
}

function renderGTrackProgress(): string {
  const imported = (programme.proofScores || []).length;
  return `<section class="ccc-progress-screen ccc-gtrack-progress-screen">
    <div class="ccc-progress-hero">
      <div><span class="ccc-kicker">Independent cognitive check-ins</span><h1>Your G Track scores</h1></div>
      <div class="ccc-progress-hero-stat"><span>Scores imported</span><strong>${imported}</strong><small>Kept separate from training performance</small></div>
    </div>
    ${progressPanelNavigation()}
    ${progressMessage ? `<p class="ccc-progress-message">${escapeHtml(progressMessage)}</p>` : ""}
    <section class="ccc-progress-section ccc-proof-section">
      <div class="ccc-section-heading"><span>G Track cognitive skills</span><strong>Compared with a reference group · average 100</strong></div>
      <div class="ccc-proof-grid">${proofCard("attention", "Attention Control")}${proofCard("working_memory", "Working Memory")}${proofCard("reasoning", "Matrix Reasoning")}</div>
      <div class="ccc-actions"><a class="ccc-button ccc-button-primary" href="/g-track-test-battery/">Take a G Track check-in</a></div>
    </section>
    ${journey && !journey.completedAt ? `<div class="ccc-progress-return"><button class="ccc-button ccc-button-primary" data-action="return-session">${progressReturnLabel()}</button></div>` : ""}
  </section>`;
}

function renderProgress(): string {
  const content = progressPanel === "proof"
    ? renderGTrackProgress()
    : progressPanel === "session" && journey
      ? renderCurrentSessionProgress()
      : renderProgressHistory();
  return shell(content, "ccc-progress-view ccc-viewport-view");
}

function renderFullTransfer(): string {
  if (programme.status !== "full_transfer") return renderWelcome();
  return shell(`
    <section class="ccc-full-transfer-card" aria-labelledby="ccc-full-transfer-title">
      <div class="ccc-achievement-burst" aria-hidden="true">
        <span></span><span></span><span></span><span></span><span></span><span></span>
        <svg viewBox="0 0 160 160" role="presentation">
          <path d="M52 28h56v28c0 25-12 43-28 51-16-8-28-26-28-51V28Z" />
          <path d="M52 42H32v13c0 19 12 30 30 31M108 42h20v13c0 19-12 30-30 31" />
          <path d="M80 107v18M58 136h44" />
          <path class="ccc-trophy-check" d="m65 63 10 10 22-25" />
        </svg>
      </div>
      <span class="ccc-kicker">Achievement unlocked · Session ${programme.sessionNumber}</span>
      <h1 id="ccc-full-transfer-title">Congratulations — Programme Complete!</h1>
      <p class="ccc-achievement-lead">You completed the full challenge: finding, remembering and updating the main pattern as the display and task changed.</p>
      <div class="ccc-achievement-badge"><span>Adaptive Cognition</span><strong>PROGRAMME COMPLETE</strong><small>All stages finished</small></div>
      <p class="ccc-achievement-boundary"><strong>This badge marks your progress in the app.</strong> The most useful next step is to try the skills in the work, study or everyday task you chose.</p>
      <div class="ccc-actions">
        <button class="ccc-button ccc-button-primary" data-action="show-complete-reconnect">Use this in your task</button>
        <button class="ccc-button ccc-button-quiet" data-action="return-home">Return home</button>
      </div>
    </section>`, "ccc-full-transfer-view ccc-viewport-view");
}

function renderCompleteReconnect(): string {
  if (!journey) return renderWelcome();
  const reconnect = reconnectAction(journey.workflowChoice);
  return shell(`
    <section class="ccc-complete-card ccc-reconnect-view">
      <span class="ccc-kicker">Use it in your task</span>
      <h1>Take one move back to the task.</h1>
      <p class="ccc-reconnect-lead">Use this prompt, then judge the result in the real task itself.</p>
      <aside class="ccc-reconnect-card">
        <span>Reconnect to ${WORKFLOW_CHOICES[journey.workflowChoice].label.toLowerCase()}</span>
        <h2>${reconnect.title}</h2>
        <p>${reconnect.action}</p>
      </aside>
      <p class="ccc-compact-boundary"><strong>Try it in your real task.</strong> Notice whether the prompt helps you return to what matters.</p>
      <div class="ccc-actions">
        <button class="ccc-button ccc-button-primary" data-action="return-home">Return to overview</button>
        <button class="ccc-button ccc-button-quiet" data-action="restart-journey">Start a fresh programme</button>
      </div>
    </section>`, "ccc-reconnect-screen ccc-viewport-view");
}

function dataModeCard(mode: DataMode, kicker: string, title: string): string {
  const selected = dataMode === mode;
  const cloud = mode !== "local";
  const standardised = mode === "cloud_benchmark";
  return `<button class="ccc-data-mode-card is-${mode.replace("_", "-")} ${selected ? "is-selected" : ""}" data-action="select-data-mode" data-mode="${mode}" aria-pressed="${selected}">
    <span>${kicker}</span><strong>${title}</strong>
    <dl class="ccc-data-mode-facts">
      <div><dt>Stored</dt><dd>${cloud ? "Cloud · across devices" : "This browser only"}</dd></div>
      <div><dt>Feedback compares</dt><dd>${standardised ? "You with other app users · average 100" : "You with your own start · starting result 100"}</dd></div>
    </dl>
    <em>${selected ? "Selected" : "Choose"}</em>
  </button>`;
}

function renderAuth(): string {
  const form = !isSupabaseConfigured
    ? `<p>Cloud sign-in is unavailable in this build.</p><button class="ccc-button ccc-button-primary" data-action="continue-local-data">Review data options</button>`
    : signInLinkSent
      ? `<p>Enter the code from your email here, or use the link in the message.</p>
         <label class="ccc-field"><span>Email address</span><input id="ccc-account-email" type="email" autocomplete="email" value="${escapeHtml(signInEmail)}" /></label>
         <label class="ccc-field"><span>Sign-in code</span><input id="ccc-account-code" type="text" inputmode="numeric" autocomplete="one-time-code" placeholder="123456" /></label>
         <div class="ccc-auth-actions"><button class="ccc-button ccc-button-primary" data-action="verify-sign-in" ${signInBusy ? "disabled" : ""}>${signInBusy ? "Checking…" : "Sign in"}</button><button class="ccc-button ccc-button-secondary" data-action="send-sign-in" ${signInBusy ? "disabled" : ""}>Send a new code</button></div>`
      : `<p>Sign in to restore your progress and use the same account across IQ Mindware apps.</p>
         <label class="ccc-field"><span>Email address</span><input id="ccc-account-email" type="email" autocomplete="email" value="${escapeHtml(signInEmail)}" placeholder="you@example.com" /></label>
         <button class="ccc-button ccc-button-primary" data-action="send-sign-in" ${signInBusy ? "disabled" : ""}>${signInBusy ? "Sending…" : "Email me a sign-in code"}</button>`;
  return shell(`<section class="ccc-auth-screen">
    <span class="ccc-kicker">Sign in</span><h1>Continue with your IQ Mindware account.</h1>${form}
    ${accountMessage ? `<p class="ccc-account-message">${escapeHtml(accountMessage)}</p>` : ""}
    <p class="ccc-account-links"><a href="https://www.iqmindware.com/privacy/">Privacy</a> · <a href="https://www.iqmindware.com/terms/">Terms</a></p>
  </section>`, "ccc-auth-view ccc-viewport-view");
}

function renderData(): string {
  const cloudSelected = dataMode !== "local";
  const personalReference = dataMode !== "cloud_benchmark";
  const accountContent = !isSupabaseConfigured
    ? `<p>Cloud sync is unavailable in this build. Progress stays in this browser.</p>`
    : !cloudSelected
      ? `<p>Cloud sync is off for this app. Feedback still uses your own starting point.${authUser?.email ? ` You remain signed in as <strong>${escapeHtml(authUser.email)}</strong>.` : ""}</p>`
      : authUser
        ? `<p>Signed in as <strong>${escapeHtml(authUser.email || "IQ Mindware user")}</strong>. ${escapeHtml(cloudStatus)}</p>
           <button class="ccc-button ccc-button-secondary" data-action="sign-out">Sign out</button>`
        : `<p>Sign in to sync your progress across devices and use ${personalReference ? "your own starting point" : "the other-user average"} for feedback.</p>
           <label class="ccc-field"><span>Email address</span><input id="ccc-account-email" type="email" autocomplete="email" placeholder="you@example.com" /></label>
           <button class="ccc-button ccc-button-primary" data-action="send-sign-in">Email me a sign-in link</button>`;
  if (dataPanel === "manage") {
    return shell(`
      <section class="ccc-data-screen ccc-data-manage-screen">
        <div class="ccc-data-heading"><span class="ccc-kicker">Data account</span><h1>Manage saved data</h1></div>
        <section class="ccc-data-account"><strong>${escapeHtml(dataModeLabel())}</strong><div class="ccc-data-current-reference"><span>Feedback reference</span><b>${personalReference ? "Your own starting result = 100" : "Other app users’ average = 100"}</b></div>${accountContent}${accountMessage ? `<p class="ccc-account-message">${escapeHtml(accountMessage)}</p>` : ""}</section>
        <div class="ccc-data-actions">
          <button class="ccc-button ccc-button-secondary" data-action="export-data">Export data</button>
          <button class="ccc-button ccc-button-quiet" data-action="delete-data">Remove data</button>
          <button class="ccc-button ccc-button-primary" data-action="show-data-options">Back to options</button>
        </div>
        <p class="ccc-account-links"><a href="https://www.iqmindware.com/privacy/">Privacy</a> · <a href="https://www.iqmindware.com/terms/">Terms</a></p>
      </section>`, "ccc-data-view ccc-viewport-view");
  }
  return shell(`
    <section class="ccc-data-screen">
      <div class="ccc-data-heading"><span class="ccc-kicker">Data and feedback</span><h1>Choose how progress is stored and compared</h1></div>
      <div class="ccc-data-mode-grid">
        ${dataModeCard("cloud_personal", "Cloud · own baseline", "My progress across devices")}
        ${dataModeCard("cloud_benchmark", "Cloud · user average", "Compare with other users")}
        ${dataModeCard("local", "Device · own baseline", "My progress on this device")}
      </div>
      <section class="ccc-data-current-choice"><span>Selected</span><strong>${escapeHtml(dataModeLabel())}</strong><small>${personalReference ? "Your own starting result = 100" : "Other app users’ average = 100"}</small></section>
      ${accountMessage ? `<p class="ccc-account-message ccc-data-option-message">${escapeHtml(accountMessage)}</p>` : ""}
      <div class="ccc-data-actions">
        <button class="ccc-button ccc-button-secondary" data-action="show-data-management">${cloudSelected && !authUser ? "Sign in or manage data" : "Manage saved data"}</button>
        <button class="ccc-button ccc-button-primary" data-action="close-data">Done</button>
      </div>
    </section>`, "ccc-data-view ccc-viewport-view");
}

function render(): void {
  const content = view === "auth" ? renderAuth()
    : view === "welcome" ? renderWelcome()
    : view === "workflow" ? renderWorkflow()
      : view === "practice_intro" ? renderPracticeIntro()
        : view === "practice_guide" ? renderPracticeGuide()
          : view === "wm_practice_intro" ? renderWmPracticeIntro()
            : view === "wm_practice_result" ? renderWmPracticeResult()
          : view === "phase_intro" ? renderPhaseIntro()
            : view === "phase_guide" ? renderPhaseGuide()
              : view === "regime_intro" ? renderRegimeIntro()
                : view === "task" ? renderTask()
                : view === "paused" ? renderPaused()
                  : view === "block_complete" ? renderBlockComplete()
                    : view === "block_insights" ? renderBlockInsights()
                      : view === "block_reconnect" ? renderBlockReconnect()
                      : view === "shift_view" ? renderShiftView()
                        : view === "complete" ? renderComplete()
                          : view === "full_transfer" ? renderFullTransfer()
                          : view === "complete_reconnect" ? renderCompleteReconnect()
                            : view === "progress" ? renderProgress()
                              : renderData();
  appRoot.innerHTML = content;
  if (view === "shift_view") mountShiftView();
}

function currentWmLevel(): CccNBackLevel | null {
  return currentBlock()?.operator === "relational_wm" ? currentBlock()?.wmNLevel || null : null;
}

function levelNeedsWmPractice(level: CccNBackLevel | null): level is CccNBackLevel {
  return level !== null && !programme.wmPracticeCompletedLevels.includes(level);
}

function beginWmPractice(level: CccNBackLevel, attempt = 1): void {
  if (!journey) return;
  journey.wmPracticeLevel = level;
  journey.practiceQueue = createWmPracticeTrials(journey.plan, level, attempt);
  journey.practiceResults = [];
  taskMode = "wm_practice";
  saveJourney();
  recordEvent("wm_practice_prepared", { wmNLevel: level, attempt }, null);
  setView("wm_practice_intro");
}

function routeToCurrentBlockIntro(): void {
  const level = currentWmLevel();
  if (levelNeedsWmPractice(level)) {
    beginWmPractice(level);
    return;
  }
  taskMode = "guided";
  setView("phase_intro");
}

function createNewJourney(): void {
  const next = nextProgrammeAction(programme);
  if (next.type !== "session") return;
  const sessionId = crypto.randomUUID();
  const regimePair = selectBalancedRegimePair(programme, `${programme.programmeRunId}:${programme.sessionNumber + 1}:${sessionId}`);
  const wmPairLevels = next.kind === "p1b_wm_bridge"
    ? [programme.wmLevel, programme.wmPendingPairLevel || programme.wmLevel] as const
    : undefined;
  const plan = next.kind === "p0_foundation"
    ? createP0AttentionCarrierTransferPlan({
        sessionId,
        seed: sessionId,
        regimePair,
        programmeRunId: programme.programmeRunId,
        programmeSessionNumber: programme.sessionNumber + 1,
      })
    : createProgrammeSessionPlan({
        sessionId,
        seed: sessionId,
        programmeRunId: programme.programmeRunId,
        programmeSessionNumber: programme.sessionNumber + 1,
        kind: next.kind,
        regimePair,
        wmLevel: programme.wmLevel,
        wmPairLevels,
        wmWrapperStage: programme.wmWrapperStage,
        delayedRecheckNotBefore: next.kind === "p1a_delayed_recheck" || next.kind === "p1c_delayed_integration" ? programme.delayedRecheckDueAt : null,
        includeFirstContact: !programme.evidence.carrierFirstContactObserved,
      });
  const queues = Object.fromEntries(plan.blocks.map((block) => [
    block.id,
    plan.trials.filter((trial) => trial.blockId === block.id),
  ]));
  const results = Object.fromEntries(plan.blocks.map((block) => [block.id, [] as CccRecordedTrial[]]));
  const now = new Date().toISOString();
  journey = {
    storageVersion: 3,
    programme,
    plan,
    workflowChoice: selectedWorkflow,
    activeBlockIndex: 0,
    blockQueues: queues,
    blockResults: results,
    practiceQueue: next.kind === "p0_foundation" ? createP0PracticeTrials(plan) : [],
    practiceResults: [],
    practiceComplete: next.kind !== "p0_foundation",
    wmPracticeLevel: null,
    shiftViewCompleted: false,
    events: [],
    startedAt: now,
    updatedAt: now,
    completedAt: null,
  };
  if (next.kind === "p1b_wm_bridge") {
    programme.wmPendingPairLevel = wmPairLevels?.[1] || programme.wmLevel;
    const firstLevel = plan.blocks.find((block) => block.operator === "relational_wm")?.wmNLevel || null;
    if (levelNeedsWmPractice(firstLevel)) {
      journey.wmPracticeLevel = firstLevel;
      journey.practiceQueue = createWmPracticeTrials(plan, firstLevel);
      journey.practiceResults = [];
    }
  }
  taskMode = journey.wmPracticeLevel ? "wm_practice" : journey.practiceComplete ? "guided" : "practice";
  recordEvent("journey_started", {
    workflowChoice: selectedWorkflow,
    programmeRunId: programme.programmeRunId,
    programmeSessionNumber: plan.programmeSessionNumber,
    programmeSessionKind: plan.programmeSessionKind,
    regimePair,
    allocationRule: "least-exposed-pair-without-immediate-repeat",
    wmLevelAtStart: programme.wmLevel,
    wmPairLevels: wmPairLevels || null,
    wmWrapperStage: programme.wmWrapperStage,
  }, null);
  saveJourney();
}

function resumeJourney(): void {
  if (!journey) {
    setView("welcome");
    return;
  }
  if (journey.completedAt) {
    setView("welcome");
    return;
  }
  if (journey.wmPracticeLevel) {
    taskMode = "wm_practice";
    setView(blockIsComplete(createWmPracticeBlock(journey.plan, journey.wmPracticeLevel)) ? "wm_practice_result" : "wm_practice_intro");
    return;
  }
  if (!journey.practiceComplete) {
    taskMode = "practice";
    setView(blockIsComplete(createP0PracticeBlock(journey.plan)) ? "block_complete" : "practice_intro");
    return;
  }
  taskMode = "guided";
  if (blockIsComplete()) setView("block_complete");
  else if (shouldRunShiftView()) setView("shift_view");
  else routeToCurrentBlockIntro();
}

function startTask(mode: TaskMode): void {
  taskMode = mode;
  const block = currentBlock();
  if (!journey || !block) return;
  recordEvent("block_started", {
    phase: block.phase,
    estimand: block.estimand,
    presentationMode: block.presentationMode,
    wrappers: block.wrappers,
    transitionKind: block.transitionKind,
    practice: block.practice,
  }, block.id);
  if (block.sourceWrapperId && block.wrappers.length === 1 && block.sourceWrapperId !== block.wrappers[0]) {
    recordEvent("wrapper_transition", {
      sourceWrapperId: block.sourceWrapperId,
      targetWrapperId: block.wrappers[0],
      transitionKind: block.transitionKind,
      strictCarrierTransferBoundary: block.strictCarrierTransferBoundary,
    }, block.id);
  }
  pendingRegimeIntro = null;
  lastIntroducedRegimeKey = "";
  setView("task");
  beginTrial();
}

function prepareActiveTrial(): CccAttentionTrialDefinition | null {
  if (!journey) return null;
  const queue = currentQueue();
  const resultIndex = currentResults().length;
  const template = queue[resultIndex];
  if (!template || template.estimand !== "signal_capacity") return template || null;
  const state = signalStaircaseStateAfterResults(currentResults());
  const adapted = adaptSignalTrial(template, state.level);
  queue[resultIndex] = adapted;
  saveJourney();
  return adapted;
}

function startSignalExposure(trial: CccAttentionTrialDefinition): void {
  const requestedMs = trial.exposureMsRequested || 500;
  taskStage = "evidence";
  evidenceStartedAt = performance.now();
  const exposureStartedAt = evidenceStartedAt;
  signalExposureMsActual = null;
  signalStimulusFrames = 0;
  signalRefreshRate = null;
  render();
  const step = (now: number) => {
    signalStimulusFrames = (signalStimulusFrames || 0) + 1;
    const elapsed = now - exposureStartedAt;
    if (elapsed < requestedMs) {
      taskAnimationFrame = window.requestAnimationFrame(step);
      return;
    }
    taskAnimationFrame = 0;
    signalExposureMsActual = Math.max(1, Math.round(elapsed));
    signalRefreshRate = Math.round(((signalStimulusFrames || 1) / (signalExposureMsActual / 1000)) * 10) / 10;
    taskStage = "mask";
    responseEnabled = false;
    render();
    taskTimers.push(window.setTimeout(() => {
      if (responseLocked || view !== "task") return;
      taskStage = "response";
      evidenceStartedAt = performance.now();
      responseEnabled = true;
      render();
      enableResponseControls();
      taskTimers.push(window.setTimeout(() => completeTrial(null, "deadline"), CCC_TRIAL_TIMING.signalResponseDeadlineMs));
    }, CCC_TRIAL_TIMING.signalMaskMs));
  };
  taskAnimationFrame = window.requestAnimationFrame(step);
}

function beginTrial(): void {
  clearTaskTiming();
  const trial = prepareActiveTrial();
  if (!trial) {
    finishCurrentBlock();
    return;
  }
  responseLocked = false;
  responseEnabled = false;
  pauseAfterFeedback = false;
  feedbackMessage = "";
  feedbackTrial = null;
  feedbackResult = null;
  taskStage = "fixation";
  evidenceStartedAt = 0;
  signalExposureMsActual = null;
  signalStimulusFrames = null;
  signalRefreshRate = null;
  const previous = currentResults().at(-1)?.trial;
  const regimeIntroKey = trial.operator === "relational_wm"
    ? trial.blockId
    : `${trial.blockId}:${trial.microcycleIndex}:${trial.regimeId}`;
  if (taskMode === "guided"
    && trial.presentationMode === "self_paced_value"
    && lastIntroducedRegimeKey !== regimeIntroKey) {
    pendingRegimeIntro = trial;
    lastIntroducedRegimeKey = regimeIntroKey;
    recordEvent("regime_preview", {
      regimeId: trial.regimeId,
      microcycleIndex: trial.microcycleIndex,
      correctPot: CCC_REGIMES[trial.regimeId].correctPot,
      errorLoss: CCC_REGIMES[trial.regimeId].errorLoss,
      drainPointsPerSecond: CCC_REGIMES[trial.regimeId].drainPointsPerSecond,
    }, trial.blockId);
    setView("regime_intro");
    return;
  }
  if (previous && previous.regimeId !== trial.regimeId) {
    recordEvent("regime_transition", { from: previous.regimeId, to: trial.regimeId }, trial.blockId);
  }
  if (previous && previous.wrapperId !== trial.wrapperId) {
    recordEvent("wrapper_transition", {
      sourceWrapperId: previous.wrapperId,
      targetWrapperId: trial.wrapperId,
      transitionKind: trial.transitionKind,
      withinMixedBlock: trial.phase === "relative_mix",
    }, trial.blockId);
  }
  render();
  taskTimers.push(window.setTimeout(() => {
    if (trial.presentationMode === "masked_forced_choice") {
      startSignalExposure(trial);
      return;
    }
    if (trial.operator === "relational_wm") {
      startWmExposure(trial);
      return;
    }
    taskStage = "evidence";
    evidenceStartedAt = performance.now();
    render();
    startPotDisplay(trial);
    taskTimers.push(window.setTimeout(() => {
      if (!trial.wmBuffer) {
        responseEnabled = true;
        enableResponseControls();
      }
    }, CCC_TRIAL_TIMING.minimumExposureBeforeAnswerMs));
    taskTimers.push(window.setTimeout(() => {
      completeTrial(null, "deadline");
    }, CCC_TRIAL_TIMING.maxResponseWindowMs));
  }, CCC_TRIAL_TIMING.fixationCueMs));
}

function startWmExposure(trial: CccAttentionTrialDefinition): void {
  const block = currentBlock();
  const exposureMs = block?.selectedExposureMs || CCC_RELATIONAL_WM.defaultPresentationMs;
  trial.exposureMsRequested = exposureMs;
  taskStage = "evidence";
  evidenceStartedAt = performance.now();
  responseEnabled = false;
  render();
  startPotDisplay(trial);
  taskTimers.push(window.setTimeout(() => {
    if (responseLocked || view !== "task") return;
    taskStage = "mask";
    responseEnabled = false;
    render();
    taskTimers.push(window.setTimeout(() => {
      if (responseLocked || view !== "task") return;
      if (trial.wmBuffer) {
        completeTrial(null, "system");
        return;
      }
      taskStage = "response";
      evidenceStartedAt = performance.now();
      responseEnabled = true;
      render();
      enableResponseControls();
      taskTimers.push(window.setTimeout(() => completeTrial(null, "deadline"), CCC_RELATIONAL_WM.responseDeadlineMs));
    }, CCC_RELATIONAL_WM.maskMs));
  }, exposureMs));
}

function enableResponseControls(): void {
  document.querySelectorAll<HTMLButtonElement>("[data-response]").forEach((button) => {
    button.disabled = false;
  });
  const helper = document.querySelector<HTMLElement>(".ccc-task-helper");
  if (helper) helper.textContent = currentBlock()?.estimand === "signal_capacity"
    ? "Choose Left or Right—even if you are unsure."
    : currentBlock()?.operator === "relational_wm"
      ? "Choose Match or Different before the next pattern."
      : "Look at the whole pattern, then make your best choice.";
}

function startPotDisplay(trial: CccAttentionTrialDefinition): void {
  if (potTimer) window.clearInterval(potTimer);
  const regime = CCC_REGIMES[trial.regimeId];
  const update = () => {
    if (taskStage !== "evidence" || !evidenceStartedAt) return;
    const elapsed = performance.now() - evidenceStartedAt;
    const remaining = Math.max(0, regime.correctPot - regime.drainPointsPerSecond * elapsed / 1000);
    const number = document.querySelector<HTMLElement>("#ccc-live-pot");
    const bar = document.querySelector<HTMLElement>("#ccc-pot-bar");
    if (number) number.textContent = String(Math.round(remaining));
    if (bar) bar.style.width = `${remaining / regime.correctPot * 100}%`;
  };
  update();
  potTimer = window.setInterval(update, 50);
}

function appendReplacement(original: CccAttentionTrialDefinition): void {
  if (!journey) return;
  const allTrials = [
    ...journey.practiceQueue,
    ...Object.values(journey.blockQueues).flat(),
  ];
  const nextIndex = Math.max(0, ...allTrials.map((trial) => trial.trialIndex)) + 1;
  const rootId = original.replacementOfTrialId || original.id;
  const replacementCount = allTrials.filter((trial) => trial.replacementOfTrialId === rootId).length + 1;
  const replacement = createCccReplacementTrial(original, replacementCount, nextIndex);
  if (taskMode === "practice" || taskMode === "wm_practice") journey.practiceQueue.push(replacement);
  else journey.blockQueues[original.blockId].push(replacement);
}

function feedbackFor(result: CccRecordedTrial): string {
  if (result.scoring.responseClass === "invalid") return "Paused — this item will return.";
  if (result.trial.wmBuffer) return "Relation held — the scored comparison follows.";
  if (result.scoring.responseClass === "omission") return result.trial.practice
    ? "Time ended — this practice item will return."
    : "Time ended — counted as an unresolved pattern.";
  if (result.trial.estimand === "signal_capacity") return result.scoring.isCorrect ? "Correct." : "Incorrect.";
  return result.scoring.isCorrect ? "Correct." : "Incorrect.";
}

function completeTrial(
  response: CccResponseChoice | null,
  inputMode: CccInputMode,
  invalidated = false,
  focusLost = false,
  invalidReason?: "focus_loss" | "aborted",
): void {
  if (responseLocked || !journey) return;
  const trial = activeTrial();
  if (!trial) return;
  responseLocked = true;
  const responseTimeMs = evidenceStartedAt > 0 ? Math.max(0, Math.round(performance.now() - evidenceStartedAt)) : null;
  clearTaskTiming();
  const scoring = scoreCccAttentionTrial({ trial, response, responseTimeMs, invalidated, invalidReason });
  const exposureMsActual = trial.estimand === "signal_capacity"
    ? signalExposureMsActual
    : trial.operator === "relational_wm"
      ? trial.exposureMsRequested
      : null;
  const timingQuality = trial.estimand === "signal_capacity" && trial.exposureMsRequested && exposureMsActual
    ? classifySignalTiming(trial.exposureMsRequested, exposureMsActual)
    : "not_applicable";
  const result: CccRecordedTrial = {
    trial,
    response,
    scoring,
    recordedAt: new Date().toISOString(),
    viewportClass: currentViewportClass(),
    inputMode,
    focusLost,
    exposureMsActual,
    actualStimulusFrames: trial.estimand === "signal_capacity" ? signalStimulusFrames : null,
    deviceRefreshRateEstimate: trial.estimand === "signal_capacity" ? signalRefreshRate : null,
    timingQuality,
  };
  if (taskMode === "practice" || taskMode === "wm_practice") journey.practiceResults.push(result);
  else journey.blockResults[trial.blockId].push(result);
  if (scoring.responseClass === "invalid") appendReplacement(trial);
  feedbackTrial = trial;
  feedbackResult = result;
  feedbackMessage = feedbackFor(result);
  taskStage = "feedback";
  pauseAfterFeedback = invalidated || focusLost;
  recordEvent("trial_completed", {
    trialId: trial.id,
    phase: trial.phase,
    wrapperId: trial.wrapperId,
    regimeId: trial.regimeId,
    responseClass: scoring.responseClass,
    estimand: trial.estimand,
    presentationMode: trial.presentationMode,
    countsTowardQuota: scoring.countsTowardQuota,
    validForProgression: scoring.validForProgression,
    exposureMsRequested: trial.exposureMsRequested,
    exposureMsActual,
    actualStimulusFrames: result.actualStimulusFrames,
    timingQuality,
    invalidReason: scoring.invalidReason,
  }, trial.blockId);
  saveJourney();
  render();
  taskTimers.push(window.setTimeout(() => {
    if (pauseAfterFeedback) {
      setView("paused");
      return;
    }
    const activeBlock = currentBlock();
    if (activeBlock && isCccLearningCurveBoundary(activeBlock, currentResults())) {
      const decision = evaluateCccLearningCurve(activeBlock, currentResults(), undefined, programme.evidence.attentionSourceLearningCurve);
      recordEvent("learning_curve_evaluated", {
        status: decision.status,
        completedMicrocycles: decision.completedMicrocycles,
        completedTrials: decision.completedTrials,
        recentAccuracy: decision.recentAccuracy,
        recentOmissionRate: decision.recentOmissionRate,
        performanceSlope: decision.performanceSlope,
        performanceGain: decision.performanceGain,
        recentRange: decision.recentRange,
        checks: decision.checks,
      }, activeBlock.id);
    }
    if (blockIsComplete(activeBlock)) {
      finishCurrentBlock();
      return;
    }
    taskStage = "interval";
    render();
    taskTimers.push(window.setTimeout(beginTrial, CCC_TRIAL_TIMING.interTrialIntervalMs));
  }, CCC_TRIAL_TIMING.outcomeFeedbackMs));
}

async function submitCurrentBlock(block: CccAttentionBlockPlan, results: CccRecordedTrial[]): Promise<void> {
  if (!journey || !cloudSyncActive()) return;
  try {
    const payload = buildCccBlockSubmissionPayload({
      plan: journey.plan,
      block,
      results,
      events: journey.events.filter((event) => event.blockId === block.id),
      workflowChoice: journey.workflowChoice,
    });
    await submitCoachBlock({
      ...payload,
      dataMode,
    });
    await saveCccRemoteProgress(journey as unknown as Record<string, unknown>);
    cloudStatus = "Your latest completed stage is saved.";
  } catch (error) {
    console.warn("Cloud save is pending.", error);
    cloudStatus = "This device has your latest progress. Cloud save will retry after the next completed stage.";
  }
}

function finishCurrentBlock(): void {
  if (!journey) return;
  const block = currentBlock();
  if (!block) return;
  const results = [...currentResults()];
  if (taskMode === "practice") journey.practiceComplete = true;
  const learningCurve = evaluateCccLearningCurve(block, results, undefined, programme.evidence.attentionSourceLearningCurve);
  let wmPairDecision = null as ReturnType<typeof evaluateCccWmPair> | null;
  if (block.operator === "relational_wm" && block.wmPairPosition === "B" && block.wmPairIndex) {
    const pairBlocks = journey.plan.blocks.filter((candidate) => candidate.operator === "relational_wm"
      && candidate.wmPairIndex === block.wmPairIndex);
    const pairResults = pairBlocks.flatMap((candidate) => journey!.blockResults[candidate.id] || []);
    wmPairDecision = evaluateCccWmPair(pairResults, block.wmNLevel || programme.wmLevel);
    if (block.wmPairIndex === 1) {
      programme.wmPendingPairLevel = wmPairDecision.nextLevel;
      const secondPairBlocks = journey.plan.blocks.filter((candidate) => candidate.operator === "relational_wm"
        && candidate.wmPairIndex === 2);
      const regenerated = createProgrammeSessionPlan({
        sessionId: journey.plan.sessionId,
        seed: journey.plan.sessionId,
        programmeRunId: programme.programmeRunId,
        programmeSessionNumber: journey.plan.programmeSessionNumber,
        kind: "p1b_wm_bridge",
        regimePair: journey.plan.regimePair,
        wmLevel: pairBlocks[0]?.wmNLevel || programme.wmLevel,
        wmPairLevels: [pairBlocks[0]?.wmNLevel || programme.wmLevel, wmPairDecision.nextLevel],
        wmWrapperStage: programme.wmWrapperStage,
      });
      const secondPairIds = new Set(secondPairBlocks.map((candidate) => candidate.id));
      const regeneratedBlocks = new Map(regenerated.blocks.map((candidate) => [candidate.id, candidate]));
      for (const candidate of secondPairBlocks) {
        const replacement = regeneratedBlocks.get(candidate.id);
        if (replacement) Object.assign(candidate, replacement);
        journey.blockQueues[candidate.id] = regenerated.trials.filter((trial) => trial.blockId === candidate.id);
      }
      journey.plan.trials = [
        ...journey.plan.trials.filter((trial) => !secondPairIds.has(trial.blockId)),
        ...regenerated.trials.filter((trial) => secondPairIds.has(trial.blockId)),
      ].sort((left, right) => left.trialIndex - right.trialIndex);
      saveCccProgramme(programme);
    }
    recordEvent("wm_pair_level_decision", {
      pairIndex: block.wmPairIndex,
      ...wmPairDecision,
    }, block.id);
  }
  if (learningCurve.shouldEndBlock && block.learningCurveGate === "source_stabilisation") {
    block.validTrialCount = results.filter((result) => result.scoring.countsTowardQuota).length;
  }
  if (taskMode === "wm_practice") {
    recordEvent("wm_practice_attempt_completed", {
      wmNLevel: journey.wmPracticeLevel,
      correctCount: wmPracticeAnsweredResults().filter((result) => result.scoring.isCorrect).length,
      comparisonCount: wmPracticeAnsweredResults().length,
      passed: wmPracticeAnsweredResults().filter((result) => result.scoring.isCorrect).length >= CCC_WM_PRACTICE_PASS_CORRECT,
    }, block.id);
    saveJourney();
    setView("wm_practice_result");
    return;
  }
  recordEvent("block_completed", {
    phase: block.phase,
    observationCount: results.filter((result) => result.scoring.countsTowardQuota).length,
    answeredDecisionCount: results.filter((result) => result.scoring.isValidDecision).length,
    plannedValidTrialCount: block.validTrialCount,
    diagnostic: block.diagnostic,
    practice: block.practice,
    learningCurveStatus: learningCurve.status,
    learningCurveMicrocycles: learningCurve.completedMicrocycles,
    learningCurveSlope: learningCurve.performanceSlope,
    learningCurveGain: learningCurve.performanceGain,
    learningCurveChecks: learningCurve.checks,
    wmPairDecision,
    selectedExposureMs: block.selectedExposureMs,
  }, block.id);
  saveJourney();
  const pending = submitCurrentBlock(block, results);
  pendingCloudSaves.push(pending);
  void pending.finally(() => {
    pendingCloudSaves = pendingCloudSaves.filter((candidate) => candidate !== pending);
  });
  setView("block_complete");
}

async function finaliseJourney(): Promise<void> {
  if (!journey) return;
  if (pendingCloudSaves.length) await Promise.allSettled([...pendingCloudSaves]);
  journey.completedAt = new Date().toISOString();
  recordEvent("journey_completed", {
    workflowChoice: journey.workflowChoice,
    totalPoints: totalJourneyPoints(),
  }, null);
  const progression = applyCompletedSession(programme, journey);
  programme = progression.programme;
  journey.programme = programme;
  recordEvent("programme_gate_decision", {
    gateVersion: "ccc-programme-gates-v0.4",
    decisions: progression.gateDecisions,
    currentStage: programme.currentStage,
    transferStatus: programme.transferStatus,
    programmeStatus: programme.status,
  }, null);
  saveCccProgramme(programme);
  saveJourney();
  const sessionMetrics = buildCccSessionMetrics(Object.values(journey.blockResults).flat());
  if (cloudSyncActive()) {
    try {
      await finalizeCoachSession({
        clientSessionId: journey.plan.sessionId,
        protocolVersion: journey.plan.protocolVersion,
        configVersion: journey.plan.configVersion,
        completedAt: journey.completedAt,
        events: journey.events
          .filter((event) => event.blockId === null)
          .map((event) => ({
            clientEventId: event.id,
            eventType: event.eventType,
            occurredAt: event.occurredAt,
            blockId: event.blockId,
            payload: event.payload,
          })),
        summary: {
          dataMode,
          workflowChoice: journey.workflowChoice,
          totalPoints: totalJourneyPoints(),
          completedBlocks: Math.min(journey.plan.blocks.length, journey.activeBlockIndex + 1),
          shiftViewCompleted: journey.shiftViewCompleted,
          programmeRunId: programme.programmeRunId,
          programmeSessionNumber: programme.sessionNumber,
          programmeStage: programme.currentStage,
          transferStatus: programme.transferStatus,
          programmeStatus: programme.status,
          metrics: sessionMetrics,
        },
      });
      await saveCccRemoteProgress(journey as unknown as Record<string, unknown>);
      cloudStatus = "Your completed journey is saved.";
    } catch (error) {
      console.warn("Final cloud save is pending.", error);
      cloudStatus = "Your completed journey is saved on this device. Cloud save is pending.";
    }
  }
}

function continueAfterBlock(): void {
  if (!journey) return;
  if (taskMode === "practice") {
    taskMode = "guided";
    setView("phase_intro");
    return;
  }
  const block = currentBlock();
  if (block && evaluateCccLearningCurve(block, currentResults(), undefined, programme.evidence.attentionSourceLearningCurve).status === "exposure_ceiling") {
    recordEvent("wrapper_change_deferred", {
      reason: "learning_curve_not_stabilised_before_session_cap",
      phase: block.phase,
      nextWrapper: journey.plan.blocks[journey.activeBlockIndex + 1]?.wrapperId || null,
    }, block.id);
    void finaliseJourney().finally(() => setView("complete"));
    return;
  }
  if (journey.activeBlockIndex >= journey.plan.blocks.length - 1) {
    void finaliseJourney().finally(() => setView(programme.status === "full_transfer" ? "full_transfer" : "complete"));
    return;
  }
  journey.activeBlockIndex += 1;
  saveJourney();
  if (shouldRunShiftView()) setView("shift_view");
  else routeToCurrentBlockIntro();
}

function mountShiftView(): void {
  stopShiftView();
  const canvas = document.querySelector<HTMLCanvasElement>("#ccc-sphere");
  const block = currentBlock();
  if (!canvas || !journey || !shouldRunShiftView(block)) return;
  sphereStop = startAmbiguousSphere(canvas, { staticMode: shiftStaticMode });
  shiftStartedAt = performance.now();
  shiftConfirmedAt = null;
  shiftNotFormedRecorded = false;
  shiftReversalCount = 0;
  shiftLastReversalAt = 0;
  recordEvent("shift_view_started", {
    durationMs: CCC_SHIFT_VIEW.durationMs,
    reducedMotion: shiftStaticMode,
    scoreAffecting: false,
    renderVersion: "ccc-shift-view-v2",
    sourceWrapperId: block?.sourceWrapperId || null,
    targetWrapperId: block?.wrappers.length === 1 ? block.wrappers[0] : null,
    dotCount: CCC_SHIFT_VIEW_RENDER_SETTINGS.dotCount,
    rotationPeriodMs: CCC_SHIFT_VIEW_RENDER_SETTINGS.rotationPeriodMs,
    dotLifeMs: CCC_SHIFT_VIEW_RENDER_SETTINGS.dotLifeMs,
    dotColours: [...CCC_SHIFT_VIEW_RENDER_SETTINGS.dotColours],
  });
  const update = () => {
    if (!journey) return;
    const elapsed = performance.now() - shiftStartedAt;
    const remainingMs = Math.max(0, CCC_SHIFT_VIEW.durationMs - elapsed);
    const countdown = document.querySelector<HTMLElement>("#ccc-shift-countdown");
    const progress = document.querySelector<HTMLElement>("#ccc-shift-progress-bar");
    if (countdown) countdown.textContent = `0:${String(Math.ceil(remainingMs / 1000)).padStart(2, "0")}`;
    if (progress) progress.style.width = `${Math.max(0, Math.min(100, elapsed / CCC_SHIFT_VIEW.durationMs * 100))}%`;
    if (!shiftStaticMode && elapsed >= 10000 && shiftConfirmedAt === null && !shiftNotFormedRecorded) {
      shiftNotFormedRecorded = true;
      recordEvent("sphere_not_formed", { elapsedMs: Math.round(elapsed) });
      updateShiftControls();
    }
    if (remainingMs <= 0) completeShiftView();
  };
  update();
  shiftTimer = window.setInterval(update, 100);
}

function updateShiftControls(): void {
  const controls = document.querySelector<HTMLElement>("#ccc-shift-controls");
  const instruction = document.querySelector<HTMLElement>("#ccc-shift-instruction");
  if (!controls || !instruction) return;
  if (shiftStaticMode) {
    controls.innerHTML = `<p class="ccc-soft-note">Still image selected.</p>`;
    instruction.textContent = "Let your eyes rest on the complete pattern for the full 30 seconds.";
    return;
  }
  if (shiftConfirmedAt !== null) {
    controls.innerHTML = `<button class="ccc-button ccc-button-secondary ccc-reversal-button" data-action="shift-reversal"><span>The whole sphere reversed</span><kbd>Space</kbd></button>`;
    instruction.textContent = "Count only whole-object reversals. Press Space every time the complete sphere appears to reverse.";
    return;
  }
  if (shiftNotFormedRecorded) {
    controls.innerHTML = `<button class="ccc-button ccc-button-secondary" data-action="shift-confirm">I see one whole sphere now</button>`;
    instruction.textContent = "Keep actively bringing the separate dots or sheets together. Respond when they form one complete sphere.";
  }
}

function recordShiftReversal(inputMode: "keyboard" | "pointer" | "touch"): void {
  if (view !== "shift_view" || shiftStaticMode || shiftConfirmedAt === null) return;
  const now = performance.now();
  if (now - shiftLastReversalAt < 180) return;
  shiftLastReversalAt = now;
  shiftReversalCount += 1;
  recordEvent("perceived_reversal", {
    elapsedMs: Math.round(now - shiftStartedAt),
    reversalIndex: shiftReversalCount,
    inputMode,
    wholeSphere: true,
  });
  const button = document.querySelector<HTMLElement>("[data-action='shift-reversal']");
  button?.classList.add("is-key-pressed");
  window.setTimeout(() => button?.classList.remove("is-key-pressed"), 150);
}

function completeShiftView(): void {
  if (!journey || journey.shiftViewCompleted) return;
  const block = currentBlock();
  stopShiftView();
  journey.shiftViewCompleted = true;
  recordEvent("shift_view_completed", {
    durationMs: CCC_SHIFT_VIEW.durationMs,
    sphereConfirmed: shiftConfirmedAt !== null,
    reversalCount: shiftReversalCount,
    reducedMotion: shiftStaticMode,
    scoreAffecting: false,
    renderVersion: "ccc-shift-view-v2",
    sourceWrapperId: block?.sourceWrapperId || null,
    targetWrapperId: block?.wrappers.length === 1 ? block.wrappers[0] : null,
  });
  saveJourney();
  setView("phase_intro");
}

async function sendSignIn(): Promise<void> {
  const input = document.querySelector<HTMLInputElement>("#ccc-account-email");
  const email = input?.value.trim() || "";
  if (!email) {
    accountMessage = "Enter your email address first.";
    render();
    return;
  }
  signInEmail = email;
  signInBusy = true;
  accountMessage = "Sending your sign-in code…";
  render();
  try {
    await sendEmailSignInLink(email);
    signInLinkSent = true;
    accountMessage = "Check your email for the code or sign-in link.";
    view = "auth";
  } catch (error) {
    accountMessage = error instanceof Error ? error.message : "The sign-in link could not be sent.";
  }
  signInBusy = false;
  render();
}

async function verifySignIn(): Promise<void> {
  const email = document.querySelector<HTMLInputElement>("#ccc-account-email")?.value.trim() || signInEmail;
  const code = document.querySelector<HTMLInputElement>("#ccc-account-code")?.value.replace(/\s+/g, "") || "";
  if (!email || !code) {
    accountMessage = "Enter your email address and the code from the email.";
    render();
    return;
  }
  signInBusy = true;
  accountMessage = "Checking your code…";
  render();
  try {
    const user = await verifyEmailSignInCode(email, code);
    authUser = user;
    signInBusy = false;
    accountMessage = "";
    signInLinkSent = false;
    if (user && dataMode !== "local") await hydrateCloudProgress(user);
    dataReturnView = "welcome";
    setView("data");
  } catch (error) {
    signInBusy = false;
    accountMessage = error instanceof Error ? error.message : "The code could not be verified.";
    render();
  }
}

function downloadJson(filename: string, payload: unknown): void {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function setDataMode(nextMode: DataMode): void {
  dataMode = isSupabaseConfigured ? nextMode : "local";
  saveDataMode(dataMode);
  populationScores = {};
  comparisonMode = dataMode === "cloud_benchmark" ? "population" : "personal";
  saveCccComparisonMode(comparisonMode);
  accountMessage = dataMode === "local"
    ? "Progress will stay in this browser and be compared with your own starting point."
    : dataMode === "cloud_benchmark"
      ? "Feedback will use the other-user average of 100 when enough results are available."
      : "Feedback will compare later results with your own starting result of 100.";
  if (cloudSyncActive() && authUser) {
    cloudStatus = `${dataModeLabel()} selected. Syncing your progress.`;
    void hydrateCloudProgress(authUser).finally(render);
    return;
  }
  cloudStatus = dataMode === "local"
    ? "Cloud sync is off for this app."
    : "Sign in to sync your progress across devices.";
  render();
}

async function exportCurrentData(): Promise<void> {
  try {
    const date = new Date().toISOString().slice(0, 10);
    if (cloudSyncActive()) {
      downloadJson(`cognitive-control-coach-cloud-${date}.json`, await exportCoachData());
      accountMessage = "Cloud data export created.";
    } else {
      downloadJson(`cognitive-control-coach-local-${date}.json`, {
        exportedAt: new Date().toISOString(),
        mode: "local",
        journey,
        programme,
      });
      accountMessage = "Local data export created.";
    }
  } catch (error) {
    accountMessage = error instanceof Error ? error.message : "Data export failed.";
  }
  render();
}

async function deleteCurrentData(): Promise<void> {
  const target = cloudSyncActive() ? "your cloud and browser data" : "the progress in this browser";
  if (!window.confirm(`Permanently remove ${target}? This cannot be undone.`)) return;
  try {
    if (cloudSyncActive()) await deleteCoachData();
    clearCccJourney();
    clearCccProgramme();
    journey = null;
    programme = createInitialProgrammeState();
    populationScores = {};
    comparisonMode = dataMode === "cloud_benchmark" ? "population" : "personal";
    saveCccComparisonMode(comparisonMode);
    accountMessage = "Your Cognitive Control Coach data has been removed.";
  } catch (error) {
    accountMessage = error instanceof Error ? error.message : "Data could not be removed.";
  }
  render();
}

appRoot.addEventListener("click", (event) => {
  const target = event.target as HTMLElement;
  const button = target.closest<HTMLElement>("[data-action], [data-response]");
  if (!button) return;
  const response = button.dataset.response as CccResponseChoice | undefined;
  if (response) {
    const trial = activeTrial();
    const responseStage = trial?.estimand === "signal_capacity" || trial?.operator === "relational_wm"
      ? taskStage === "response"
      : taskStage === "evidence";
    if (view !== "task" || !responseStage || !responseEnabled || responseLocked) return;
    const inputMode: CccInputMode = event instanceof PointerEvent && event.pointerType === "touch" ? "touch" : "pointer";
    completeTrial(response, inputMode);
    return;
  }
  const action = button.dataset.action;
  if (action === "choose-workflow") {
    selectedWorkflow = button.dataset.workflow as WorkflowChoice;
    render();
  } else if (action === "show-workflow") {
    setView("workflow");
  } else if (action === "begin-journey") {
    createNewJourney();
    if (journey?.practiceComplete) routeToCurrentBlockIntro();
    else setView("practice_intro");
  } else if (action === "begin-next-session") {
    createNewJourney();
    if (journey?.practiceComplete) routeToCurrentBlockIntro();
    else setView("practice_intro");
  } else if (action === "continue-journey") {
    resumeJourney();
  } else if (action === "show-practice-guide") {
    setView("practice_guide");
  } else if (action === "back-practice-intro") {
    setView("practice_intro");
  } else if (action === "start-practice") {
    startTask("practice");
  } else if (action === "start-wm-practice") {
    startTask("wm_practice");
  } else if (action === "retry-wm-practice") {
    const level = journey?.wmPracticeLevel;
    if (journey && level) {
      const attempt = journey.events.filter((event) => event.eventType === "wm_practice_prepared" && event.payload.wmNLevel === level).length + 1;
      journey.practiceQueue = createWmPracticeTrials(journey.plan, level, attempt);
      journey.practiceResults = [];
      saveJourney();
      recordEvent("wm_practice_prepared", { wmNLevel: level, attempt }, null);
      setView("wm_practice_intro");
    }
  } else if (action === "complete-wm-practice") {
    const level = journey?.wmPracticeLevel;
    const correct = wmPracticeAnsweredResults().filter((result) => result.scoring.isCorrect).length;
    if (journey && level && correct >= CCC_WM_PRACTICE_PASS_CORRECT) {
      if (!programme.wmPracticeCompletedLevels.includes(level)) programme.wmPracticeCompletedLevels.push(level);
      programme.wmPracticeCompletedLevels.sort((left, right) => left - right);
      journey.wmPracticeLevel = null;
      journey.practiceQueue = [];
      journey.practiceResults = [];
      taskMode = "guided";
      recordEvent("wm_practice_level_completed", { wmNLevel: level, correctCount: correct }, null);
      saveCccProgramme(programme);
      saveJourney();
      if (cloudSyncActive()) {
        const pending = saveCccRemoteProgress(journey as unknown as Record<string, unknown>);
        pendingCloudSaves.push(pending);
        void pending.finally(() => {
          pendingCloudSaves = pendingCloudSaves.filter((candidate) => candidate !== pending);
        });
      }
      setView("phase_intro");
    }
  } else if (action === "practise-wm-again") {
    const level = currentWmLevel();
    if (level) beginWmPractice(level);
  } else if (action === "show-phase-guide") {
    setView("phase_guide");
  } else if (action === "back-phase-intro") {
    setView("phase_intro");
  } else if (action === "start-phase") {
    const block = currentBlock();
    const level = currentWmLevel();
    if (journey?.wmPracticeLevel) setView("wm_practice_intro");
    else if (levelNeedsWmPractice(level)) beginWmPractice(level);
    else if (shouldRunShiftView(block)) setView("shift_view");
    else startTask("guided");
  } else if (action === "continue-regime") {
    const block = currentBlock();
    if (block?.operator === "relational_wm") {
      const slider = document.querySelector<HTMLInputElement>("#ccc-wm-speed-slider");
      const selected = Number(slider?.value || CCC_RELATIONAL_WM.defaultPresentationMs);
      block.selectedExposureMs = Math.max(CCC_RELATIONAL_WM.minimumPresentationMs, Math.min(CCC_RELATIONAL_WM.maximumPresentationMs, selected));
      for (const trial of journey?.blockQueues[block.id] || []) trial.exposureMsRequested = block.selectedExposureMs;
      recordEvent("wm_presentation_time_selected", {
        exposureMs: block.selectedExposureMs,
        regimeId: pendingRegimeIntro?.regimeId || null,
        wmNLevel: block.wmNLevel,
        pairIndex: block.wmPairIndex,
        pairPosition: block.wmPairPosition,
      }, block.id);
      saveJourney();
    }
    pendingRegimeIntro = null;
    setView("task");
    beginTrial();
  } else if (action === "continue-after-block") {
    continueAfterBlock();
  } else if (action === "show-block-insights") {
    setView("block_insights");
  } else if (action === "show-block-reconnect") {
    setView("block_reconnect");
  } else if (action === "show-complete-reconnect") {
    setView("complete_reconnect");
  } else if (action === "show-full-transfer") {
    setView("full_transfer");
  } else if (action === "show-progress") {
    progressMessage = "";
    progressReturnView = view === "progress" ? progressReturnView : view;
    progressPanel = (button.dataset.progressPanel as ProgressPanel | undefined)
      || (journey && !journey.completedAt ? "session" : "history");
    progressHistoryPage = "overview";
    setView("progress");
    if (cloudSyncActive()) void hydrateProgressFeedback().finally(render);
  } else if (action === "show-session-progress") {
    progressPanel = "session";
    render();
  } else if (action === "show-history-progress") {
    progressPanel = "history";
    progressHistoryPage = "overview";
    render();
    if (cloudSyncActive()) void hydrateProgressFeedback().finally(render);
  } else if (action === "show-history-skills") {
    progressHistoryPage = "skills";
    render();
  } else if (action === "show-history-overview") {
    progressHistoryPage = "overview";
    render();
  } else if (action === "show-proof-progress") {
    progressPanel = "proof";
    render();
    if (cloudSyncActive()) void hydrateProgressFeedback().finally(render);
  } else if (action === "return-session") {
    setView(progressReturnTarget());
  } else if (action === "session-current") {
    // The highlighted tab represents the screen already being viewed.
  } else if (action === "select-personal-mode") {
    if (dataMode === "cloud_benchmark") setDataMode("cloud_personal");
    else {
      comparisonMode = "personal";
      saveCccComparisonMode(comparisonMode);
    }
    progressMessage = "Showing change from your starting score of 100.";
    render();
  } else if (action === "select-population-mode") {
    if (isSupabaseConfigured) {
      if (dataMode !== "cloud_benchmark") setDataMode("cloud_benchmark");
      comparisonMode = "population";
      saveCccComparisonMode(comparisonMode);
      if (populationModeAvailable(populationScores)) {
        progressMessage = "Showing your latest result around the other-user average of 100.";
      } else {
        progressMessage = "Other-user scores will appear when the reference group is large enough; no personal-baseline score is substituted.";
      }
      if (!authUser) setView("data");
      else render();
    }
  } else if (action === "pause-session") {
    recordEvent("pause", { taskStage });
    if (taskStage === "fixation" || taskStage === "evidence" || taskStage === "mask" || taskStage === "response") completeTrial(null, "system", true, false, "aborted");
    else setView("paused");
  } else if (action === "resume-task") {
    recordEvent("resume", {});
    setView("task");
    beginTrial();
  } else if (action === "back-welcome" || action === "return-home") {
    setView("welcome");
  } else if (action === "restart-journey") {
    if (window.confirm("Start a fresh programme on this device? Your completed cloud record, if any, will not be deleted.")) {
      clearCccJourney();
      clearCccProgramme();
      journey = null;
      programme = createInitialProgrammeState();
      setView("welcome");
    }
  } else if (action === "open-data") {
    accountMessage = "";
    dataPanel = "options";
    if (!dataModeSeen && !authUser && isSupabaseConfigured) {
      setView("auth");
      return;
    }
    dataReturnView = view === "task" ? "paused" : view;
    if (view === "task") recordEvent("pause", { taskStage, reason: "data_screen" });
    setView("data");
  } else if (action === "close-data") {
    if (!dataModeSeen) {
      dataModeSeen = true;
      saveDataModeSeen();
      dataReturnView = "welcome";
    }
    setView(dataReturnView === "data" ? "welcome" : dataReturnView);
  } else if (action === "select-data-mode") {
    setDataMode(button.dataset.mode as DataMode);
  } else if (action === "show-data-management") {
    dataPanel = "manage";
    render();
  } else if (action === "show-data-options") {
    dataPanel = "options";
    render();
  } else if (action === "export-data") {
    void exportCurrentData();
  } else if (action === "delete-data") {
    void deleteCurrentData();
  } else if (action === "send-sign-in") {
    void sendSignIn();
  } else if (action === "verify-sign-in") {
    void verifySignIn();
  } else if (action === "continue-local-data") {
    dataMode = "local";
    saveDataMode(dataMode);
    setView("data");
  } else if (action === "sign-out") {
    void signOutUser().then(() => {
      authUser = null;
      populationScores = {};
      comparisonMode = dataMode === "cloud_benchmark" ? "population" : "personal";
      saveCccComparisonMode(comparisonMode);
      accountMessage = "Signed out. This browser still holds your local progress.";
      render();
    });
  } else if (action === "shift-confirm") {
    if (shiftConfirmedAt === null) {
      shiftConfirmedAt = performance.now();
      recordEvent("sphere_confirmed", { elapsedMs: Math.round(shiftConfirmedAt - shiftStartedAt) });
      updateShiftControls();
    }
  } else if (action === "shift-not-yet") {
    if (!shiftNotFormedRecorded) {
      shiftNotFormedRecorded = true;
      recordEvent("sphere_not_formed", { elapsedMs: Math.round(performance.now() - shiftStartedAt), explicit: true });
      updateShiftControls();
    }
  } else if (action === "shift-reversal") {
    const inputMode = event instanceof PointerEvent && event.pointerType === "touch" ? "touch" : "pointer";
    recordShiftReversal(inputMode);
  } else if (action === "shift-toggle-motion") {
    shiftStaticMode = !shiftStaticMode;
    recordEvent("shift_view_motion_changed", { reducedMotion: shiftStaticMode });
    sphereStop?.();
    const canvas = document.querySelector<HTMLCanvasElement>("#ccc-sphere");
    if (canvas) sphereStop = startAmbiguousSphere(canvas, { staticMode: shiftStaticMode });
    const toggle = document.querySelector<HTMLElement>("[data-action='shift-toggle-motion']");
    if (toggle) toggle.textContent = shiftStaticMode ? "Use the moving version" : "Use a still reset";
    updateShiftControls();
  }
});

appRoot.addEventListener("input", (event) => {
  const slider = (event.target as HTMLElement).closest<HTMLInputElement>("#ccc-wm-speed-slider");
  if (!slider) return;
  const output = document.querySelector<HTMLElement>("#ccc-wm-speed-value");
  if (output) output.textContent = `${(Number(slider.value) / 1000).toFixed(2)} seconds`;
});

window.addEventListener("keydown", (event) => {
  if (view === "shift_view" && event.code === "Space") {
    if (!event.repeat && shiftConfirmedAt !== null && !shiftStaticMode) {
      event.preventDefault();
      recordShiftReversal("keyboard");
    }
    return;
  }
  const trial = activeTrial();
  const responseStage = trial?.estimand === "signal_capacity" || trial?.operator === "relational_wm"
    ? taskStage === "response"
    : taskStage === "evidence";
  if (view !== "task" || !responseStage || !responseEnabled || responseLocked || !trial) return;
  const response = event.key === "ArrowLeft" ? trial.answerOptions[0]
    : event.key === "ArrowRight" ? trial.answerOptions[1]
      : null;
  if (!response) return;
  event.preventDefault();
  completeTrial(response, "keyboard");
});

document.addEventListener("visibilitychange", () => {
  if (!document.hidden || view !== "task" || responseLocked) return;
  if (taskStage === "fixation" || taskStage === "evidence" || taskStage === "mask" || taskStage === "response") {
    completeTrial(null, "system", true, true, "focus_loss");
    recordEvent("focus_loss", { taskStage });
  }
});

let resizeDebounce = 0;
window.addEventListener("resize", () => {
  if (!journey || journey.completedAt) return;
  window.clearTimeout(resizeDebounce);
  resizeDebounce = window.setTimeout(() => {
    recordEvent("viewport_changed", { viewportClass: currentViewportClass(), width: window.innerWidth, height: window.innerHeight });
  }, 500);
});

window.addEventListener("beforeunload", saveJourney);

async function hydrateCloudProgress(user: AuthUser): Promise<void> {
  try {
    const remote = await loadCccRemoteProgress() as unknown as CccSavedJourney | null;
    if (needsRelationalStimulusReset(remote)) {
      programme = migrateCccProgrammeState(remote?.programme || programme);
      saveCccProgramme(programme);
      cloudStatus = "Your saved level is ready. Start a fresh session with the corrected motion patterns.";
      await hydrateProgressFeedback();
      return;
    }
    if (remote && [2, 3].includes(Number(remote.storageVersion)) && remote.plan?.appId === "cognitive_control_coach"
      && (!journey || Date.parse(remote.updatedAt) > Date.parse(journey.updatedAt))) {
      journey = remote;
      programme = migrateCccProgrammeState(remote.programme || programme);
      journey.storageVersion = 3;
      journey.programme = programme;
      selectedWorkflow = remote.workflowChoice;
      taskMode = remote.wmPracticeLevel ? "wm_practice" : remote.practiceComplete ? "guided" : "practice";
      saveJourney();
      cloudStatus = "Your latest saved journey is ready on this device.";
    } else if (journey) {
      await saveCccRemoteProgress(journey as unknown as Record<string, unknown>);
    }
  } catch (error) {
    console.warn("Cloud progress could not be checked.", error);
    cloudStatus = "This device has your progress. Cloud save will retry later.";
  }
  await hydrateProgressFeedback();
}

if (isSupabaseConfigured) {
  void currentAuthUser().then(async (user) => {
    authUser = user;
    if (user && dataMode !== "local") {
      cloudStatus = "Signed in. Progress sync is on.";
      await hydrateCloudProgress(user);
    } else if (user) {
      cloudStatus = "Signed in. Cloud sync is off for this app.";
    }
    if (!dataModeSeen) view = user ? "data" : "auth";
    render();
  });
  onAuthChange((user) => {
    authUser = user;
    if (user && dataMode !== "local") {
      cloudStatus = "Signed in. Progress sync is on.";
      if (!dataModeSeen) {
        dataReturnView = "welcome";
        view = "data";
      }
      void hydrateCloudProgress(user).finally(render);
      return;
    }
    populationScores = {};
    comparisonMode = dataMode === "cloud_benchmark" ? "population" : "personal";
    if (!user && !dataModeSeen) view = "auth";
    render();
  });
}

render();
