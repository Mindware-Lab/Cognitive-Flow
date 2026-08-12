import "../../../UX/iqmindware-app-design-system/tokens.css";
import "./cccStyles.css";
import { buildCccBlockSubmissionPayload } from "./blockPayload";
import {
  PHASE_COPY,
  REGIME_COPY,
  WORKFLOW_CHOICES,
  reconnectAction,
  workflowBridge,
  type WorkflowChoice,
} from "./cccCopy";
import {
  CCC_REGIMES,
  CCC_RELATIONAL_WM,
  CCC_SHIFT_VIEW,
  CCC_TRIAL_TIMING,
} from "./cccConfig";
import {
  adaptSignalTrial,
  createCccReplacementTrial,
  createP0AttentionCarrierTransferPlan,
  createP0PracticeBlock,
  createP0PracticeTrials,
} from "./cccGenerator";
import { createProgrammeSessionPlan } from "./cccProgrammeGenerator";
import { buildCccBlockFeedback } from "./cccFeedback";
import { CCC_SESSION_DURATION_LABEL } from "./cccDuration";
import { classifySignalTiming, signalStaircaseStateAfterResults } from "./cccSignal";
import { startAmbiguousSphere } from "./cccShiftView";
import {
  clearCccJourney,
  clearCccProgramme,
  journeyCompletionRatio,
  loadCccJourney,
  loadCccProgramme,
  saveCccJourney,
  saveCccProgramme,
  type CccSavedJourney,
} from "./cccStorage";
import {
  applyCompletedSession,
  allRegimesBalanced,
  createInitialProgrammeState,
  missingTransferEvidence,
  nextProgrammeAction,
  programmeProgressPercent,
  selectBalancedRegimePair,
} from "./cccProgramme";
import type {
  CccAttentionBlockPlan,
  CccAttentionTrialDefinition,
  CccInputMode,
  CccProgrammePhase,
  CccProgrammeState,
  CccRecordedTrial,
  CccResponseChoice,
  CccRuntimeEvent,
} from "./cccTypes";
import { scoreCccAttentionTrial } from "./cccValue";
import {
  currentAuthUser,
  finalizeCoachSession,
  isSupabaseConfigured,
  loadCccRemoteProgress,
  onAuthChange,
  saveCccRemoteProgress,
  sendEmailSignInLink,
  signOutUser,
  submitCoachBlock,
  type AuthUser,
} from "./supabaseClient";

type View =
  | "welcome"
  | "workflow"
  | "practice_intro"
  | "practice_guide"
  | "phase_intro"
  | "phase_guide"
  | "task"
  | "paused"
  | "block_complete"
  | "block_insights"
  | "block_reconnect"
  | "shift_view"
  | "complete"
  | "full_transfer"
  | "complete_reconnect"
  | "account";
type TaskStage = "fixation" | "evidence" | "mask" | "feedback" | "interval";
type TaskMode = "practice" | "guided";

const appElement = document.querySelector<HTMLDivElement>("#app");
if (!appElement) throw new Error("Missing #app root.");
const appRoot: HTMLDivElement = appElement;

const APP_BASE = import.meta.env.BASE_URL || "/";
let journey = loadCccJourney();
let programme: CccProgrammeState = loadCccProgramme() || journey?.programme || createInitialProgrammeState();
if (journey) {
  journey.programme = programme;
  journey.plan.programmeRunId ||= programme.programmeRunId;
  journey.plan.programmeSessionNumber ||= Math.max(1, programme.sessionNumber + (journey.completedAt ? 0 : 1));
  journey.plan.programmeSessionKind ||= "p0_foundation";
  journey.plan.delayedRecheckNotBefore ??= null;
  journey.plan.blocks.forEach((block) => { block.wmNLevel ??= null; });
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
}
let selectedWorkflow: WorkflowChoice = journey?.workflowChoice || "focused_work";
let view: View = "welcome";
let taskMode: TaskMode = journey?.practiceComplete ? "guided" : "practice";
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
let shiftStaticMode = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
let authUser: AuthUser | null = null;
let accountMessage = "";
let cloudStatus = isSupabaseConfigured ? "Cloud save is available after sign-in." : "Progress is saved on this device.";
let pendingCloudSaves: Promise<void>[] = [];

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

function formatPoints(value: number): string {
  return `${value >= 0 ? "+" : "−"}${Math.abs(Math.round(value))}`;
}

function currentViewportClass(): CccRecordedTrial["viewportClass"] {
  if (window.innerWidth < 640) return "mobile";
  if (window.innerWidth < 1024) return "tablet";
  return "desktop";
}

function currentBlock(): CccAttentionBlockPlan | null {
  if (!journey) return null;
  if (taskMode === "practice") return createP0PracticeBlock(journey.plan);
  return journey.plan.blocks[journey.activeBlockIndex] || null;
}

function currentQueue(): CccAttentionTrialDefinition[] {
  if (!journey) return [];
  if (taskMode === "practice") return journey.practiceQueue;
  const block = currentBlock();
  return block ? journey.blockQueues[block.id] || [] : [];
}

function currentResults(): CccRecordedTrial[] {
  if (!journey) return [];
  if (taskMode === "practice") return journey.practiceResults;
  const block = currentBlock();
  return block ? journey.blockResults[block.id] || [] : [];
}

function activeTrial(): CccAttentionTrialDefinition | null {
  return currentQueue()[currentResults().length] || null;
}

function blockIsComplete(block = currentBlock()): boolean {
  if (!journey || !block) return false;
  const queue = taskMode === "practice" ? journey.practiceQueue : journey.blockQueues[block.id] || [];
  const results = taskMode === "practice" ? journey.practiceResults : journey.blockResults[block.id] || [];
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

function header(): string {
  const accountLabel = authUser?.email ? "Signed in" : "Save progress";
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
        <button class="ccc-account-button" data-action="open-account">${accountLabel}</button>
      </div>
    </header>`;
}

function shell(content: string, className = ""): string {
  return `<main class="ccc-app ${className}">${header()}<div class="ccc-main" id="ccc-content" tabindex="-1">${content}</div><footer class="ccc-footer"><span>IQ Mindware · cognitive training for demanding workflows</span><span>Non-clinical · broader benefit is checked, not assumed</span><span><a href="https://www.iqmindware.com/privacy/">Privacy</a> · <a href="https://www.iqmindware.com/terms/">Terms</a></span></footer></main>`;
}

const JOURNEY_LABELS: Partial<Record<Exclude<CccProgrammePhase, "practice">, string>> = {
  signal_anchor: "Signal",
  arrow_rel_stabilisation: "Relate",
  flow_rel_first_contact: "Change",
  flow_rel_recovery: "Recover",
  arrow_rel_return: "Return",
  relative_mix: "Switch",
  p1a_arrow_stabilisation: "Stabilise",
  p1a_flow_first_contact: "Change",
  p1a_flow_recovery: "Recover",
  p1a_arrow_return: "Return",
  p1a_relative_mix: "Mix",
  p1a_delayed_recheck: "Re-check",
  p1b_attention_bridge: "Read",
  p1b_wm_arrow_stabilisation: "Hold",
  p1b_wm_flow_first_contact: "Change",
  p1b_wm_flow_recovery: "Recover",
  p1b_wm_arrow_return: "Return",
  p1b_wm_relative_mix: "Mix",
  p1c_attention_entry: "Read",
  p1c_delayed_reentry: "Re-check",
  p1c_wm_hold: "Hold",
  p1c_attention_reentry: "Re-enter",
  p1c_operator_mix: "Switch",
};

function journeyRail(completedBeforeIndex: number, currentIndex: number | null = null): string {
  if (!journey) return "";
  const steps = journey.plan.blocks.map((block, index) => {
    if (block.phase === "practice") return "";
    const isComplete = index < completedBeforeIndex;
    const isCurrent = currentIndex === index;
    const state = isComplete ? "is-complete" : isCurrent ? "is-current" : "";
    const marker = isComplete ? "✓" : String(index + 1);
    return `<li class="${state}" ${isCurrent ? 'aria-current="step"' : ""}><span aria-hidden="true">${marker}</span><small>${JOURNEY_LABELS[block.phase] || "Train"}</small></li>`;
  }).join("");
  return `<ol class="ccc-journey-rail" aria-label="Training journey">${steps}</ol>`;
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
            ? `<button class="ccc-button ccc-button-primary" data-action="show-full-transfer">View your Full Transfer achievement</button>`
            : `<button class="ccc-button ccc-button-primary" data-action="show-complete-reconnect">Review your programme</button>`;
  const programmeComplete = programme.status !== "active";
  const stageLabel = programme.currentStage === "P0" ? "Foundation"
    : programme.currentStage === "P1a" ? "Attention portability"
      : programme.currentStage === "P1b" ? "Relational memory"
        : programme.currentStage === "P1c" ? "Return to Now"
          : "Programme complete";
  const missing = missingTransferEvidence(programme);
  return shell(hasJourney ? `
      <section class="ccc-resume-card">
        <div class="ccc-card-heading"><div><span class="ccc-kicker">Your current journey</span><h2>Pick up where you left off.</h2></div><strong class="ccc-progress-number">${completion}%</strong></div>
        ${journeyRail(journey!.activeBlockIndex, journey!.activeBlockIndex)}
        <div class="ccc-progress-track" role="progressbar" aria-label="Journey progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${completion}"><span style="width:${completion}%"></span></div>
        <p>Your selected context is <strong>${WORKFLOW_CHOICES[journey!.workflowChoice].label.toLowerCase()}</strong>. Your place is saved on this device.</p>
        ${mainAction}
      </section>` : programme.sessions.length ? `
      <section class="ccc-resume-card ccc-programme-card">
        <div class="ccc-card-heading"><div><span class="ccc-kicker">Your multi-session programme</span><h2>${programmeComplete ? "Your programme record is ready." : `${stageLabel} is next.`}</h2></div><strong class="ccc-progress-number">${programmeProgressPercent(programme)}%</strong></div>
        <div class="ccc-progress-track" role="progressbar" aria-label="Programme completion" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${programmeProgressPercent(programme)}"><span style="width:${programmeProgressPercent(programme)}%"></span></div>
        <div class="ccc-summary-grid ccc-programme-summary">
          <article><span>Sessions completed</span><strong>${programme.sessionNumber}</strong></article>
          <article><span>Current layer</span><strong>${stageLabel}</strong></article>
          <article><span>Transfer evidence</span><strong>${programme.transferStatus === "attention_portable" ? "Delayed gate passed" : programme.transferStatus === "supported_unlock" ? "Supported route" : "Building"}</strong></article>
        </div>
        <p>${programmeComplete
          ? programme.status === "full_transfer"
            ? "All protected trained-format gates passed, including the delayed return and bidirectional re-entry checks."
            : "The programme was completed through supported progression; it is not labelled full transfer."
          : nextAction.type === "wait"
            ? "The next evidence must be collected after time away. Same-day practice cannot substitute for the protected delayed re-check."
            : missing.length
              ? `Still to establish: ${missing.slice(0, 3).join(", ")}.`
              : "The next layer opens from the evidence already recorded."}</p>
        ${mainAction}
      </section>` : `
    <section class="ccc-hero">
      <div class="ccc-hero-copy">
        <span class="ccc-kicker">Precision cognitive training</span>
        <h1>Focus, hold and update <em>what matters.</em></h1>
        <p class="ccc-lead">Practise staying with the goal when distraction, interference or a changing format pulls your attention elsewhere.</p>
        <div class="ccc-hero-facts" aria-label="Journey overview">
          <span>${CCC_SESSION_DURATION_LABEL}</span><span>Four decision environments</span><span>Evidence-gated progression</span>
        </div>
        <div class="ccc-actions">${mainAction}</div>
      </div>
      <aside class="ccc-control-panel">
        <span class="ccc-kicker">One control loop</span>
        <h2>The pattern changes. The core moves stay the same.</h2>
        <div class="ccc-control-strip" aria-label="The three moves trained in this app">
          <article><span>1</span><strong>Find what matters</strong><small>Separate the useful signal from competing information.</small></article>
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
      <span class="ccc-kicker">Connect to what matters</span>
      <h1>Where is your workflow under strain?</h1>
      <p>Choose the closest broad context. This changes only the prompts that help you reconnect.</p>
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
      <div class="ccc-stage-line"><span>Before the journey</span><span>About one minute</span></div>
      <span class="ccc-kicker">A short, unscored practice</span>
      <h1>Find the direction followed by most arrows.</h1>
      <p>Look at all five arrows. Choose <strong>Left</strong> or <strong>Right</strong> for the direction followed by the majority.</p>
      <div class="ccc-example-card" aria-label="Example: four arrows point right and one points left, so the answer is right">
        <span aria-hidden="true">→</span><span aria-hidden="true">→</span><span class="is-odd" aria-hidden="true">←</span><span aria-hidden="true">→</span><span aria-hidden="true">→</span><strong>Most point right</strong>
      </div>
      <div class="ccc-actions">
        <button class="ccc-button ccc-button-primary" data-action="show-practice-guide">See how choices work</button>
        <button class="ccc-button ccc-button-quiet" data-action="back-welcome">Back</button>
      </div>
    </section>
  `, "ccc-practice-view ccc-viewport-view");
}

function renderPracticeGuide(): string {
  if (!journey) return renderWelcome();
  return shell(`
    <section class="ccc-narrow-card">
      <div class="ccc-stage-line"><span>Before the journey</span><span>Practice is not scored</span></div>
      <span class="ccc-kicker">A forced choice</span>
      <h1>Look. Weigh. Choose.</h1>
      <div class="ccc-instruction-grid">
        <article><strong>Look first</strong><span>The buttons appear after a brief viewing moment.</span></article>
        <article><strong>Choose every time</strong><span>Use Left or Right in practice. If uncertain, make your best choice.</span></article>
        <article><strong>Points come later</strong><span>The guided stages add different costs and time pressure; practice stays unscored.</span></article>
      </div>
      <p class="ccc-soft-note">The practice is brief. It helps you learn the controls and does not count towards your journey.</p>
      <div class="ccc-actions">
        <button class="ccc-button ccc-button-primary" data-action="start-practice">Begin practice</button>
        <button class="ccc-button ccc-button-quiet" data-action="back-practice-intro">Back</button>
      </div>
    </section>
  `, "ccc-practice-view ccc-viewport-view");
}

function regimeCards(block: CccAttentionBlockPlan): string {
  return block.regimePair.map((regimeId) => {
    const copy = REGIME_COPY[regimeId];
    return `<article class="ccc-regime-card"><span>${copy.title}</span><strong>${copy.cue}</strong><small>${copy.instruction}</small></article>`;
  }).join("");
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
      <aside class="ccc-workflow-bridge">
        <span>Bridge to ${WORKFLOW_CHOICES[journey.workflowChoice].label.toLowerCase()}</span>
        <strong>${PHASE_COPY[block.phase].bridge}</strong>
      </aside>
      <div class="ccc-actions">
        <button class="ccc-button ccc-button-primary" data-action="show-phase-guide">See how this stage works</button>
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
  return shell(`
    <section class="ccc-narrow-card">
      <div class="ccc-stage-line"><span>Stage ${stageNumber} of ${journey.plan.blocks.length}</span><span>${Math.round(journeyCompletionRatio(journey) * 100)}% complete</span></div>
      ${journeyRail(journey.activeBlockIndex, journey.activeBlockIndex)}
      <span class="ccc-kicker">Before you begin</span>
      <h1>${isSignal ? "Brief pattern. Mask. Best choice." : isWm ? `Hold the relation · ${block.wmNLevel}-back` : "Two work conditions, one relation."}</h1>
      ${isSignal ? `
        <div class="ccc-instruction-grid">
          <article><strong>Adaptive view</strong><span>The display becomes shorter or harder as the check learns from your answers.</span></article>
          <article><strong>Always choose</strong><span>Respond Left or Right after the mask, even when uncertain.</span></article>
          <article><strong>Kept separate</strong><span>No points or niches enter this signal estimate.</span></article>
        </div>
        <p class="ccc-soft-note">This is a short MFT-M-derived anchor. The app reports it as provisional, not as a literature-standard MFT-M-R assessment.</p>` : isWm ? `
        <div class="ccc-instruction-grid">
          <article><strong>Extract</strong><span>Find the current majority relation across the five items.</span></article>
          <article><strong>Hold and compare</strong><span>Compare it with the relation ${block.wmNLevel === 1 ? "one step" : "two steps"} earlier.</span></article>
          <article><strong>Commit</strong><span>Choose Match or Different. Each item keeps a fixed five-second rhythm.</span></article>
        </div>
        <p class="ccc-soft-note">The first ${block.wmNLevel === 1 ? "item" : "two items"} in each condition fills the memory buffer and is not scored. A missed deadline remains an omission.</p>` : `
        <div class="ccc-regime-grid">${regimeCards(block)}</div>
        ${block.diagnostic ? `<p class="ccc-soft-note">Your first try in this format is kept apart from later recovery practice, so the change itself remains visible.</p>` : `<p class="ccc-soft-note">Every trial is In/Out or Expand/Contract. Make your best forced choice before time ends.</p>`}`}
      <div class="ccc-actions">
        <button class="ccc-button ccc-button-primary" data-action="start-phase">${block.shiftViewBefore && !journey.shiftViewCompleted ? "Start the changeover" : "Begin this stage"}</button>
        <button class="ccc-button ccc-button-quiet" data-action="back-phase-intro">Back</button>
      </div>
    </section>
  `, "ccc-stage-view ccc-stage-guide ccc-viewport-view");
}

function arrowStimulus(trial: CccAttentionTrialDefinition): string {
  const arrows = trial.stimulusItems.map((item) => {
    const x = item.position.x * 3.6;
    const y = item.position.y * 3.6;
    const angle = Math.atan2(item.vector.y, item.vector.x) * 180 / Math.PI;
    return `<g transform="translate(${x} ${y}) rotate(${angle})"><path d="M-24 -8 H6 V-16 L26 0 L6 16 V8 H-24 Z" /></g>`;
  }).join("");
  const label = trial.referenceFrame === "relative"
    ? "Five arrows pointing towards or away from the centre"
    : "Five arrows pointing left or right";
  return `<svg class="ccc-stimulus-svg" viewBox="0 0 360 360" role="img" aria-label="${label}"><circle class="ccc-centre-marker" cx="180" cy="180" r="5" /><g class="ccc-arrow-items">${arrows}</g></svg>`;
}

function flowStimulus(trial: CccAttentionTrialDefinition): string {
  const definitions = trial.stimulusItems.map((item, index) => {
    const x = item.position.x * 3.6;
    const y = item.position.y * 3.6;
    return `<clipPath id="flow-clip-${index}"><circle cx="0" cy="0" r="31" /></clipPath>`;
  }).join("");
  const apertures = trial.stimulusItems.map((item, index) => {
    const x = item.position.x * 3.6;
    const y = item.position.y * 3.6;
    const dots = Array.from({ length: 9 }, (_, dotIndex) => {
      const angle = dotIndex / 9 * Math.PI * 2 + (index % 3) * 0.22;
      const inner = 5 + (dotIndex % 3) * 3.5;
      const outer = 25 + (dotIndex % 3) * 2;
      const rotational = item.relation === "cw" || item.relation === "ccw";
      const expanding = item.relation === "out";
      const radius = 10 + (dotIndex % 3) * 7;
      const fromRadius = rotational ? radius : expanding ? inner : outer;
      const toRadius = rotational ? radius : expanding ? outer : inner;
      const turn = item.relation === "cw" ? 0.9 : item.relation === "ccw" ? -0.9 : 0;
      const fromX = Math.cos(angle) * fromRadius;
      const fromY = Math.sin(angle) * fromRadius;
      const toX = Math.cos(angle + turn) * toRadius;
      const toY = Math.sin(angle + turn) * toRadius;
      return `<circle r="3.1"><animate attributeName="cx" values="${fromX};${toX}" dur="0.95s" begin="${-dotIndex * 0.08}s" repeatCount="indefinite" /><animate attributeName="cy" values="${fromY};${toY}" dur="0.95s" begin="${-dotIndex * 0.08}s" repeatCount="indefinite" /></circle>`;
    }).join("");
    return `<g clip-path="url(#flow-clip-${index})" transform="translate(${x} ${y})"><rect x="-34" y="-34" width="68" height="68" rx="34" /><g class="ccc-flow-points">${dots}</g></g><circle class="ccc-flow-ring" cx="${x}" cy="${y}" r="31" />`;
  }).join("");
  const label = trial.operator === "relational_wm"
    ? "Five moving dot fields showing a majority spatial relation"
    : "Five moving dot fields expanding or contracting";
  return `<svg class="ccc-stimulus-svg" viewBox="0 0 360 360" role="img" aria-label="${label}"><circle class="ccc-centre-marker" cx="180" cy="180" r="5" /><defs>${definitions}</defs>${apertures}</svg>`;
}

function stimulusFor(trial: CccAttentionTrialDefinition): string {
  return trial.carrier === "arrow" ? arrowStimulus(trial) : flowStimulus(trial);
}

function maskStimulus(): string {
  const marks = Array.from({ length: 42 }, (_, index) => {
    const x = 26 + (index * 67) % 308;
    const y = 24 + (index * 101) % 312;
    return `<circle cx="${x}" cy="${y}" r="${3 + index % 4}" />`;
  }).join("");
  return `<svg class="ccc-stimulus-svg ccc-mask-svg" viewBox="0 0 360 360" role="img" aria-label="Visual mask"><g>${marks}</g></svg>`;
}

function taskProgress(block: CccAttentionBlockPlan): string {
  const valid = currentResults().filter((result) => result.scoring.countsTowardQuota).length;
  const target = block.validTrialCount;
  const percentage = Math.min(100, Math.round(valid / Math.max(1, target) * 100));
  return `<div class="ccc-task-progress" role="progressbar" aria-label="Stage observations" aria-valuemin="0" aria-valuemax="${target}" aria-valuenow="${Math.min(valid, target)}"><span style="width:${percentage}%"></span></div><small>${Math.min(valid, target)} of ${target} patterns</small>`;
}

function renderTask(): string {
  const trial = taskStage === "feedback" ? feedbackTrial : activeTrial();
  const block = currentBlock();
  if (!journey || !trial || !block) return renderWelcome();
  const regime = CCC_REGIMES[trial.regimeId];
  const regimeCopy = REGIME_COPY[trial.regimeId];
  const isPractice = taskMode === "practice";
  const isSignal = trial.estimand === "signal_capacity";
  const isWm = trial.operator === "relational_wm";
  const wrapperLabel = trial.operator === "relational_wm"
    ? `${trial.wrapperId === "arrow_rel" ? "Relational arrows" : "Relational motion"} · ${trial.wmNLevel}-back`
    : trial.wrapperId === "arrow_abs" ? "Left / Right arrows"
      : trial.wrapperId === "arrow_rel" ? "In / Out arrows"
        : "Expand / Contract motion";
  const responseStage = isSignal ? taskStage === "mask" : taskStage === "evidence";
  const controlsDisabled = trial.wmBuffer || !responseStage || !responseEnabled || responseLocked;
  const feedbackPoints = feedbackResult?.scoring.pointsRealised ?? 0;
  const feedbackState = feedbackResult?.scoring.isCorrect
    ? "is-correct"
    : feedbackResult?.scoring.responseClass === "answer"
        ? "is-incorrect"
        : "is-neutral";
  const feedbackIcon = feedbackState === "is-correct" ? "✓" : feedbackState === "is-incorrect" ? "×" : "·";
  const pot = regime.correctPot;
  const taskTitle = isSignal ? "Signal check" : isWm ? `Hold and compare · ${trial.wmNLevel}-back` : isPractice ? "Practice" : regimeCopy.title;
  const taskCue = taskStage === "fixation" ? "Get ready"
    : taskStage === "interval" ? "Next pattern"
      : taskStage === "feedback" ? feedbackMessage
        : taskStage === "mask" ? "Make your best choice"
          : isSignal ? "Hold the majority direction"
            : isWm ? trial.wmBuffer ? "Take in this relation" : `Does this match ${trial.wmNLevel === 1 ? "one step" : "two steps"} back?`
              : regimeCopy.cue;
  const stimulus = taskStage === "fixation"
    ? `<span class="ccc-fixation" aria-label="Get ready">+</span>`
    : taskStage === "interval"
      ? `<span class="ccc-interval-dot" aria-hidden="true"></span>`
      : taskStage === "mask"
        ? maskStimulus()
        : stimulusFor(trial);
  const responseButtons = trial.answerOptions.map((answer, index) => {
    const label = trial.responseLabels.labels[answer] || answer;
    const icon = answer === "left" ? "←" : answer === "right" ? "→" : answer === "in" ? "⇥" : answer === "out" ? "⇤" : answer === "match" ? "=" : "≠";
    const key = index === 0 ? "←" : "→";
    return `<button class="ccc-response" data-response="${answer}" aria-label="Choose ${label}" ${controlsDisabled ? "disabled" : ""}><span aria-hidden="true">${icon}</span><strong>${label}</strong><kbd>${key}</kbd></button>`;
  }).join("");
  return shell(`
    <section class="ccc-task-card">
      <div class="ccc-task-topline">
        <div><span>${isPractice ? "Practice" : `Stage ${journey.activeBlockIndex + 1} of ${journey.plan.blocks.length}`}</span><strong>${wrapperLabel}</strong></div>
        <div class="ccc-task-progress-wrap">${taskProgress(block)}</div>
        <button class="ccc-exit" data-action="pause-session">Pause</button>
      </div>
      <div class="ccc-task-cue">
        <span>${taskTitle}</span>
        <strong>${taskCue}</strong>
      </div>
      <div class="ccc-stimulus-stage ${taskStage === "fixation" || taskStage === "interval" ? "is-fixation" : ""} ${taskStage === "feedback" ? "is-feedback" : ""}">
        ${stimulus}
      </div>
      ${taskStage === "feedback" ? `
        <div class="ccc-value-panel ccc-result-panel ${feedbackState}" role="status" aria-live="polite">
          <span class="ccc-feedback-icon" aria-hidden="true">${feedbackIcon}</span>
          <div><span>${isSignal || isPractice ? "This pattern" : "This choice"}</span><strong>${isSignal || isPractice ? (feedbackResult?.scoring.isCorrect ? "Correct" : "Recorded") : formatPoints(feedbackPoints)}</strong></div>
          <small>${feedbackMessage}</small>
        </div>` : `
        ${isSignal ? `<div class="ccc-value-panel ccc-signal-panel"><div><span>Protected timing</span><strong>${trial.exposureMsRequested} ms</strong></div><small>The mask separates signal extraction from later self-paced decisions.</small></div>`
          : isPractice ? `<div class="ccc-value-panel ccc-signal-panel"><div><span>Practice</span><strong>Unscored</strong></div><small>Make a Left or Right choice on every pattern.</small></div>`
          : trial.wmBuffer ? `<div class="ccc-value-panel ccc-signal-panel"><div><span>Memory buffer</span><strong>Hold this relation</strong></div><small>This item sets the ${trial.wmNLevel}-back sequence and is not scored.</small></div>`
          : `<div class="ccc-value-panel">
          <div><span>Available if correct</span><strong id="ccc-live-pot">${Math.round(pot)}</strong></div>
          <div class="ccc-pot-track"><span id="ccc-pot-bar" style="width:100%"></span></div>
          <small>Correct: keep what remains · Wrong: ${regime.errorLoss} points lost · No response: no points</small>
        </div>`}`}
      <div class="ccc-response-row" aria-label="${isWm ? "Choose Match or Different" : "Choose the majority relation"}">
        ${responseButtons}
      </div>
      <p class="ccc-task-helper" aria-live="polite">${taskStage === "fixation" || taskStage === "interval" ? "The next pattern is about to appear." : taskStage === "feedback" ? "" : isSignal ? (taskStage === "mask" ? "Choose Left or Right—even if uncertain." : "Take in the pattern before the mask.") : trial.wmBuffer ? "Hold this relation; the response begins after the buffer." : isWm ? responseEnabled ? "Choose Match or Different before the rhythm moves on." : "Extract the current relation first." : responseEnabled ? "Make your best choice when you have enough evidence." : "Look at the whole pattern first."}</p>
    </section>
  `, "ccc-task-view");
}

function renderPaused(): string {
  return shell(`
    <section class="ccc-narrow-card">
      <span class="ccc-kicker">Training paused</span>
      <h1>Your place is saved.</h1>
      <p>If the window lost focus, that item has been set aside and will return later. It will not count against your progress.</p>
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
  return value === null ? "—" : `${(value / 1000).toFixed(2)} s`;
}

function metricBar(label: string, value: number | null, maximum: number, display: string, tone = "blue"): string {
  const percentage = value === null ? 0 : Math.max(0, Math.min(100, value / maximum * 100));
  return `<div class="ccc-metric-row"><div><span>${label}</span><strong>${display}</strong></div><div class="ccc-metric-bar is-${tone}" role="img" aria-label="${label}: ${display}"><i style="width:${percentage}%"></i></div></div>`;
}

function renderBlockComplete(): string {
  if (!journey) return renderWelcome();
  const block = currentBlock();
  if (!block) return renderComplete();
  const results = currentResults();
  const feedback = buildCccBlockFeedback(results);
  const isPractice = taskMode === "practice";
  const isSignal = block.estimand === "signal_capacity";
  const copy = block.phase === "practice" ? {
    title: "You know the task.",
    body: "Next comes a protected signal check, followed by In/Out policy practice.",
  } : isSignal ? {
    title: "Your signal check is complete.",
    body: "This short estimate is kept apart from the later points, time pressure and format changes.",
  } : block.diagnostic ? {
    title: "Your first look is recorded.",
    body: "This first encounter is kept separate from the recovery practice that comes next.",
  } : {
    title: "Stage complete.",
    body: "You completed both parts of this stage while keeping the same goal.",
  };
  return shell(`
    <section class="ccc-narrow-card">
      ${journeyRail(isPractice ? 0 : Math.min(journey.plan.blocks.length, journey.activeBlockIndex + 1), null)}
      <span class="ccc-kicker">${isPractice ? "Practice complete" : `Stage ${journey.activeBlockIndex + 1} complete`}</span>
      <h1>${copy.title}</h1>
      <p>${copy.body}</p>
      ${isPractice ? "" : `
        <div class="ccc-summary-grid">
          <article><span>${isSignal ? "Patterns resolved" : "Best-choice accuracy"}</span><strong>${formatPercent(feedback.accuracy)}</strong></article>
          <article><span>${isSignal ? "Signal estimate" : "Typical decision time"}</span><strong>${isSignal ? (feedback.attentionControlBps === null ? "Calibrating" : `${feedback.attentionControlBps} bps`) : formatTime(feedback.medianDecisionMs)}</strong></article>
          <article><span>${isSignal ? "Timing quality" : "Points kept"}</span><strong>${isSignal ? feedback.signalTimingQuality : `${feedback.pointsKeptPercent}%`}</strong></article>
        </div>`}
      ${isPractice ? "" : `<p class="ccc-metric-note"><strong>${isSignal ? "A provisional signal anchor." : "Read accuracy, time and value together."}</strong> ${isSignal ? "The estimate uses masked, frame-timed forced choices and remains separate from policy or transfer." : "A missed deadline counts as an unresolved pattern; it is not removed or replaced."}</p>`}
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
    ? "More matched trials are needed before comparing the two conditions."
    : Math.abs(feedback.timingShiftMs) < 100
      ? "You used a similar viewing time in both conditions."
      : feedback.timingShiftMs > 0
        ? `You looked ${Math.abs(feedback.timingShiftMs)} ms longer when mistakes cost more.`
        : `You looked ${Math.abs(feedback.timingShiftMs)} ms less when mistakes cost more.`;
  return shell(`
    <section class="ccc-narrow-card ccc-insights-card">
      <div class="ccc-stage-line"><span>Stage ${journey.activeBlockIndex + 1} feedback</span><span>${feedback.observationCount} patterns</span></div>
      <span class="ccc-kicker">${isSignal ? "Spot the pattern" : "Take in enough, then commit"}</span>
      <h1>${isSignal ? "How clarity affected the signal check" : "How your decisions changed with the conditions"}</h1>
      <div class="ccc-chart-grid ${isSignal ? "is-single" : ""}">
        <section><h2>Accuracy by clarity</h2>${clarityBars}</section>
        ${isSignal ? "" : `<section><h2>Viewing time by condition</h2>${nicheBars}</section>`}
      </div>
      <p class="ccc-insight-callout"><strong>${isSignal ? "Everyday meaning:" : "Your timing response:"}</strong> ${isSignal ? "Clear and close patterns show how signal competition changes what you can resolve under brief viewing. This is exercise evidence, not a claim about a real task." : `${shift} In a real workflow, the comparable skill is changing how long you check when time pressure or the cost of an error changes; this graph measures only the exercise.`}</p>
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
  const isLast = journey.activeBlockIndex === journey.plan.blocks.length - 1;
  return shell(`
    <section class="ccc-narrow-card ccc-block-reconnect-card">
      <div class="ccc-stage-line"><span>Stage ${journey.activeBlockIndex + 1} complete</span><span>${Math.round(journeyCompletionRatio(journey) * 100)}% complete</span></div>
      <span class="ccc-kicker">From exercise to workflow</span>
      <h1>Reconnect before you move on.</h1>
      <aside class="ccc-workflow-bridge">
        <span>${WORKFLOW_CHOICES[journey.workflowChoice].label}</span>
        <strong>${workflowBridge(block.phase, journey.workflowChoice)}</strong>
      </aside>
      <p class="ccc-soft-note">This is a practical bridge, not evidence that the exercise has changed performance outside the app.</p>
      <div class="ccc-actions">
        <button class="ccc-button ccc-button-primary" data-action="continue-after-block">${isLast ? "See your journey review" : "Continue to the next stage"}</button>
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
      <h1>Let the dots form one moving ball.</h1>
      <p id="ccc-shift-instruction">Watch the whole pattern rather than following one dot.</p>
      <canvas id="ccc-sphere" class="ccc-sphere" role="img" aria-label="A rotating dotted sphere that may appear to reverse"></canvas>
      <div id="ccc-shift-controls" class="ccc-shift-controls">
        ${shiftStaticMode
          ? `<p class="ccc-soft-note">Quiet visual reset selected. The timing stays the same.</p>`
          : `<button class="ccc-button ccc-button-secondary" data-action="shift-confirm">I see the ball</button><button class="ccc-button ccc-button-quiet" data-action="shift-not-yet">Not yet</button>`}
      </div>
      <button class="ccc-text-button" data-action="shift-toggle-motion">${shiftStaticMode ? "Use the moving version" : "Use a still reset"}</button>
      <p class="ccc-soft-note">There is no score. This short changeover does not affect your points or progress.</p>
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
  const next = nextProgrammeAction(programme);
  return shell(`
    <section class="ccc-complete-card">
      <span class="ccc-kicker">Session ${journey.plan.programmeSessionNumber} · ${journey.plan.stage}</span>
      <h1>This session is complete.</h1>
      <p>${sessionSummary?.gateDecisions.at(-1) || "Your evidence has been added to the multi-session programme record."}</p>
      ${journeyRail(journey.plan.blocks.length, null)}
      <div class="ccc-summary-grid">
        <article><span>${hasSignal ? "Attention Control signal" : "Attention accuracy"}</span><strong>${hasSignal ? (signalFeedback.attentionControlBps === null ? "Calibrating" : `${signalFeedback.attentionControlBps} bps`) : formatPercent(attentionFeedback.accuracy)}</strong></article>
        <article><span>${hasWm ? "Relational memory" : "Decision Fit"}</span><strong>${hasWm ? formatPercent(wmFeedback.accuracy) : policyFeedback.timingShiftMs === null ? "Calibrating" : `${policyFeedback.timingShiftMs >= 0 ? "+" : "−"}${Math.abs(policyFeedback.timingShiftMs)} ms`}</strong></article>
        <article><span>Programme evidence</span><strong>${programmeProgressPercent(programme)}%</strong></article>
      </div>
      <p class="ccc-metric-note"><strong>Completion and transfer remain separate.</strong> ${programme.status === "full_transfer" ? "All protected trained-format gates have passed." : next.type === "wait" ? "The next gate must use fresh responses after the scheduled delay." : programme.transferStatus === "supported_unlock" ? "Later layers are open through supported progression, without a full-transfer label." : "The next session is chosen from the evidence still missing."}</p>
      <div class="ccc-actions">
        <button class="ccc-button ccc-button-primary" data-action="show-complete-reconnect">Reconnect to ${WORKFLOW_CHOICES[journey.workflowChoice].label.toLowerCase()}</button>
        <button class="ccc-button ccc-button-quiet" data-action="return-home">Programme overview</button>
      </div>
    </section>`, "ccc-complete-view ccc-viewport-view");
}

function renderFullTransfer(): string {
  if (programme.status !== "full_transfer") return renderWelcome();
  const environmentEvidence = allRegimesBalanced(programme) ? "All four environments balanced" : "Four-environment record retained";
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
      <h1 id="ccc-full-transfer-title">Congratulations — Full Transfer!</h1>
      <p class="ccc-achievement-lead">You completed the full trained-format challenge: finding, holding and updating the target relation across changing formats, decision environments, operations and delayed returns.</p>
      <div class="ccc-achievement-badge"><span>Adaptive Cognition</span><strong>FULL TRANSFER</strong><small>P1a · P1b · P1c complete</small></div>
      <div class="ccc-achievement-evidence" aria-label="Evidence unlocked">
        <span>Protected change</span>
        <span>Recovery + return</span>
        <span>Mixed formats</span>
        <span>Delayed re-checks</span>
        <span>Attention ↔ memory</span>
        <span>${environmentEvidence}</span>
      </div>
      <p class="ccc-achievement-boundary"><strong>This is a game achievement for the trained programme.</strong> Judge broader benefit in the real task itself; the badge is not a claim of general or clinical transfer.</p>
      <div class="ccc-actions">
        <button class="ccc-button ccc-button-primary" data-action="show-complete-reconnect">Take the win back to your workflow</button>
        <button class="ccc-button ccc-button-quiet" data-action="return-home">Programme overview</button>
      </div>
    </section>`, "ccc-full-transfer-view ccc-viewport-view");
}

function renderCompleteReconnect(): string {
  if (!journey) return renderWelcome();
  const reconnect = reconnectAction(journey.workflowChoice);
  return shell(`
    <section class="ccc-complete-card ccc-reconnect-view">
      <span class="ccc-kicker">From exercise to workflow</span>
      <h1>Take one move back to the task.</h1>
      <p class="ccc-reconnect-lead">Use this prompt, then judge the result in the real task itself.</p>
      <aside class="ccc-reconnect-card">
        <span>Reconnect to ${WORKFLOW_CHOICES[journey.workflowChoice].label.toLowerCase()}</span>
        <h2>${reconnect.title}</h2>
        <p>${reconnect.action}</p>
      </aside>
      <p class="ccc-compact-boundary"><strong>Keep the outcomes separate.</strong> Use the real task—not this score—to judge whether the prompt helped.</p>
      <div class="ccc-actions">
        <button class="ccc-button ccc-button-primary" data-action="return-home">Return to overview</button>
        <button class="ccc-button ccc-button-quiet" data-action="restart-journey">Start a fresh programme</button>
      </div>
    </section>`, "ccc-reconnect-screen ccc-viewport-view");
}

function renderAccount(): string {
  const content = !isSupabaseConfigured
    ? `<p>This preview is running in local mode. Your place is saved only in this browser.</p>`
    : authUser
      ? `<p>Signed in as <strong>${escapeHtml(authUser.email || "IQ Mindware user")}</strong>.</p><p>${escapeHtml(cloudStatus)}</p><button class="ccc-button ccc-button-secondary" data-action="sign-out">Sign out</button>`
      : `<p>Sign in to save completed stages across devices. You can continue without an account.</p>
         <label class="ccc-field"><span>Email address</span><input id="ccc-account-email" type="email" autocomplete="email" placeholder="you@example.com" /></label>
         <button class="ccc-button ccc-button-primary" data-action="send-sign-in">Email me a sign-in link</button>`;
  return shell(`
    <section class="ccc-narrow-card">
      <span class="ccc-kicker">Your progress</span>
      <h1>Save in the way that suits you.</h1>
      ${content}
      ${accountMessage ? `<p class="ccc-account-message">${escapeHtml(accountMessage)}</p>` : ""}
      <p class="ccc-soft-note">The workflow choice is a broad category. The app does not ask you to enter confidential work, study or personal details.</p>
      <p class="ccc-account-links"><a href="https://www.iqmindware.com/privacy/">Privacy</a> · <a href="https://www.iqmindware.com/terms/">Terms</a></p>
      <button class="ccc-button ccc-button-quiet" data-action="close-account">Back</button>
    </section>`, "ccc-account-view ccc-viewport-view");
}

function render(): void {
  const content = view === "welcome" ? renderWelcome()
    : view === "workflow" ? renderWorkflow()
      : view === "practice_intro" ? renderPracticeIntro()
        : view === "practice_guide" ? renderPracticeGuide()
          : view === "phase_intro" ? renderPhaseIntro()
            : view === "phase_guide" ? renderPhaseGuide()
              : view === "task" ? renderTask()
                : view === "paused" ? renderPaused()
                  : view === "block_complete" ? renderBlockComplete()
                    : view === "block_insights" ? renderBlockInsights()
                      : view === "block_reconnect" ? renderBlockReconnect()
                      : view === "shift_view" ? renderShiftView()
                        : view === "complete" ? renderComplete()
                          : view === "full_transfer" ? renderFullTransfer()
                            : view === "complete_reconnect" ? renderCompleteReconnect()
                              : renderAccount();
  appRoot.innerHTML = content;
  if (view === "shift_view") mountShiftView();
}

function createNewJourney(): void {
  const next = nextProgrammeAction(programme);
  if (next.type !== "session") return;
  const sessionId = crypto.randomUUID();
  const regimePair = selectBalancedRegimePair(programme, `${programme.programmeRunId}:${programme.sessionNumber + 1}:${sessionId}`);
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
    shiftViewCompleted: false,
    events: [],
    startedAt: now,
    updatedAt: now,
    completedAt: null,
  };
  taskMode = journey.practiceComplete ? "guided" : "practice";
  recordEvent("journey_started", {
    workflowChoice: selectedWorkflow,
    programmeRunId: programme.programmeRunId,
    programmeSessionNumber: plan.programmeSessionNumber,
    programmeSessionKind: plan.programmeSessionKind,
    regimePair,
    allocationRule: "least-exposed-pair-without-immediate-repeat",
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
  if (!journey.practiceComplete) {
    taskMode = "practice";
    setView(blockIsComplete(createP0PracticeBlock(journey.plan)) ? "block_complete" : "practice_intro");
    return;
  }
  taskMode = "guided";
  setView(blockIsComplete() ? "block_complete" : "phase_intro");
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
    evidenceStartedAt = performance.now();
    responseEnabled = true;
    render();
    enableResponseControls();
    taskTimers.push(window.setTimeout(() => completeTrial(null, "deadline"), CCC_TRIAL_TIMING.signalResponseDeadlineMs));
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
    }, trial.operator === "relational_wm" ? CCC_RELATIONAL_WM.responseDeadlineMs : CCC_TRIAL_TIMING.maxResponseWindowMs));
  }, CCC_TRIAL_TIMING.fixationCueMs));
}

function enableResponseControls(): void {
  document.querySelectorAll<HTMLButtonElement>("[data-response]").forEach((button) => {
    button.disabled = false;
  });
  const helper = document.querySelector<HTMLElement>(".ccc-task-helper");
  if (helper) helper.textContent = currentBlock()?.estimand === "signal_capacity"
    ? "Choose Left or Right—even if uncertain."
    : currentBlock()?.operator === "relational_wm"
      ? "Choose Match or Different before the rhythm moves on."
      : "Make your best choice when you have enough evidence.";
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
  if (taskMode === "practice") journey.practiceQueue.push(replacement);
  else journey.blockQueues[original.blockId].push(replacement);
}

function feedbackFor(result: CccRecordedTrial): string {
  if (result.scoring.responseClass === "invalid") return "Paused — this item will return.";
  if (result.trial.wmBuffer) return "Relation held — the scored comparison follows.";
  if (result.scoring.responseClass === "omission") return result.trial.practice
    ? "Time ended — this practice item will return."
    : "Time ended — counted as an unresolved pattern.";
  if (result.trial.estimand === "signal_capacity") return result.scoring.isCorrect ? "Correct." : "Not quite — the next view will adapt.";
  return result.scoring.isCorrect
    ? taskMode === "practice" ? "Correct." : `${formatPoints(result.scoring.pointsRealised)} points`
    : taskMode === "practice" ? "Not quite." : `${formatPoints(result.scoring.pointsRealised)} points`;
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
  const exposureMsActual = trial.estimand === "signal_capacity" ? signalExposureMsActual : null;
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
  if (taskMode === "practice") journey.practiceResults.push(result);
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
    if (blockIsComplete()) {
      finishCurrentBlock();
      return;
    }
    taskStage = "interval";
    render();
    const fixedCadenceRemainder = trial.operator === "relational_wm"
      ? Math.max(CCC_TRIAL_TIMING.interTrialIntervalMs, CCC_RELATIONAL_WM.onsetToOnsetCadenceMs
          - (responseTimeMs ?? CCC_RELATIONAL_WM.responseDeadlineMs)
          - CCC_TRIAL_TIMING.outcomeFeedbackMs
          - CCC_TRIAL_TIMING.fixationCueMs)
      : CCC_TRIAL_TIMING.interTrialIntervalMs;
    taskTimers.push(window.setTimeout(beginTrial, fixedCadenceRemainder));
  }, CCC_TRIAL_TIMING.outcomeFeedbackMs));
}

async function submitCurrentBlock(block: CccAttentionBlockPlan, results: CccRecordedTrial[]): Promise<void> {
  if (!journey || !authUser) return;
  try {
    const payload = buildCccBlockSubmissionPayload({
      plan: journey.plan,
      block,
      results,
      events: journey.events.filter((event) => event.blockId === block.id),
      workflowChoice: journey.workflowChoice,
    });
    await submitCoachBlock(payload);
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
  recordEvent("block_completed", {
    phase: block.phase,
    observationCount: results.filter((result) => result.scoring.countsTowardQuota).length,
    answeredDecisionCount: results.filter((result) => result.scoring.isValidDecision).length,
    plannedValidTrialCount: block.validTrialCount,
    diagnostic: block.diagnostic,
    practice: block.practice,
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
  if (authUser) {
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
          workflowChoice: journey.workflowChoice,
          totalPoints: totalJourneyPoints(),
          completedBlocks: journey.plan.blocks.length,
          shiftViewCompleted: journey.shiftViewCompleted,
          programmeRunId: programme.programmeRunId,
          programmeSessionNumber: programme.sessionNumber,
          programmeStage: programme.currentStage,
          transferStatus: programme.transferStatus,
          programmeStatus: programme.status,
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
  if (journey.activeBlockIndex >= journey.plan.blocks.length - 1) {
    void finaliseJourney().finally(() => setView(programme.status === "full_transfer" ? "full_transfer" : "complete"));
    return;
  }
  journey.activeBlockIndex += 1;
  saveJourney();
  setView("phase_intro");
}

function mountShiftView(): void {
  stopShiftView();
  const canvas = document.querySelector<HTMLCanvasElement>("#ccc-sphere");
  if (!canvas || !journey) return;
  sphereStop = startAmbiguousSphere(canvas, { staticMode: shiftStaticMode });
  shiftStartedAt = performance.now();
  shiftConfirmedAt = null;
  shiftNotFormedRecorded = false;
  recordEvent("shift_view_started", {
    durationMs: CCC_SHIFT_VIEW.durationMs,
    reducedMotion: shiftStaticMode,
    scoreAffecting: false,
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
    controls.innerHTML = `<p class="ccc-soft-note">Quiet visual reset selected. The timing stays the same.</p>`;
    instruction.textContent = "Let your eyes rest on the whole pattern.";
    return;
  }
  if (shiftConfirmedAt !== null) {
    controls.innerHTML = `<button class="ccc-button ccc-button-secondary" data-action="shift-reversal">The whole ball reversed</button>`;
    instruction.textContent = "Keep watching the whole sphere. Tap only when the whole ball appears to reverse.";
    return;
  }
  if (shiftNotFormedRecorded) {
    controls.innerHTML = `<button class="ccc-button ccc-button-secondary" data-action="shift-confirm">I see the ball now</button>`;
    instruction.textContent = "Keep watching the whole pattern. If one ball forms, let us know.";
  }
}

function completeShiftView(): void {
  if (!journey || journey.shiftViewCompleted) return;
  stopShiftView();
  journey.shiftViewCompleted = true;
  recordEvent("shift_view_completed", {
    durationMs: CCC_SHIFT_VIEW.durationMs,
    sphereConfirmed: shiftConfirmedAt !== null,
    reducedMotion: shiftStaticMode,
    scoreAffecting: false,
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
  try {
    await sendEmailSignInLink(email);
    accountMessage = "Check your email for the sign-in link.";
  } catch (error) {
    accountMessage = error instanceof Error ? error.message : "The sign-in link could not be sent.";
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
    const responseStage = trial?.estimand === "signal_capacity" ? taskStage === "mask" : taskStage === "evidence";
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
    setView(journey?.practiceComplete ? "phase_intro" : "practice_intro");
  } else if (action === "begin-next-session") {
    createNewJourney();
    setView(journey?.practiceComplete ? "phase_intro" : "practice_intro");
  } else if (action === "continue-journey") {
    resumeJourney();
  } else if (action === "show-practice-guide") {
    setView("practice_guide");
  } else if (action === "back-practice-intro") {
    setView("practice_intro");
  } else if (action === "start-practice") {
    startTask("practice");
  } else if (action === "show-phase-guide") {
    setView("phase_guide");
  } else if (action === "back-phase-intro") {
    setView("phase_intro");
  } else if (action === "start-phase") {
    const block = currentBlock();
    if (journey && block?.shiftViewBefore && !journey.shiftViewCompleted) setView("shift_view");
    else startTask("guided");
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
  } else if (action === "pause-session") {
    recordEvent("pause", { taskStage });
    if (taskStage === "fixation" || taskStage === "evidence" || taskStage === "mask") completeTrial(null, "system", true, false, "aborted");
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
  } else if (action === "open-account") {
    accountMessage = "";
    setView("account");
  } else if (action === "close-account") {
    setView("welcome");
  } else if (action === "send-sign-in") {
    void sendSignIn();
  } else if (action === "sign-out") {
    void signOutUser().then(() => {
      authUser = null;
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
    recordEvent("perceived_reversal", { elapsedMs: Math.round(performance.now() - shiftStartedAt) });
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

window.addEventListener("keydown", (event) => {
  const trial = activeTrial();
  const responseStage = trial?.estimand === "signal_capacity" ? taskStage === "mask" : taskStage === "evidence";
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
  if (taskStage === "fixation" || taskStage === "evidence" || taskStage === "mask") {
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
    if (remote && [2, 3].includes(Number(remote.storageVersion)) && remote.plan?.appId === "cognitive_control_coach"
      && (!journey || Date.parse(remote.updatedAt) > Date.parse(journey.updatedAt))) {
      journey = remote;
      programme = remote.programme || programme;
      journey.storageVersion = 3;
      journey.programme = programme;
      selectedWorkflow = remote.workflowChoice;
      taskMode = remote.practiceComplete ? "guided" : "practice";
      saveJourney();
      cloudStatus = "Your latest saved journey is ready on this device.";
    } else if (journey) {
      await saveCccRemoteProgress(journey as unknown as Record<string, unknown>);
    }
  } catch (error) {
    console.warn("Cloud progress could not be checked.", error);
    cloudStatus = "This device has your progress. Cloud save will retry later.";
  }
}

if (isSupabaseConfigured) {
  void currentAuthUser().then(async (user) => {
    authUser = user;
    if (user) {
      cloudStatus = "Signed in. Completed stages can be saved across devices.";
      await hydrateCloudProgress(user);
    }
    render();
  });
  onAuthChange((user) => {
    authUser = user;
    if (user) {
      cloudStatus = "Signed in. Completed stages can be saved across devices.";
      void hydrateCloudProgress(user).finally(render);
      return;
    }
    render();
  });
}

render();
