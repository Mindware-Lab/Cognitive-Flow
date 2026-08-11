import "../../../UX/iqmindware-app-design-system/tokens.css";
import "./cccStyles.css";
import { buildCccBlockSubmissionPayload } from "./blockPayload";
import {
  EVIDENCE_BOUNDARY_COPY,
  PHASE_COPY,
  REGIME_COPY,
  WORKFLOW_CHOICES,
  reconnectAction,
  workflowBridge,
  type WorkflowChoice,
} from "./cccCopy";
import {
  CCC_REGIMES,
  CCC_SHIFT_VIEW,
  CCC_TRIAL_TIMING,
} from "./cccConfig";
import {
  createCccReplacementTrial,
  createP0AttentionCarrierTransferPlan,
  createP0PracticeBlock,
  createP0PracticeTrials,
} from "./cccGenerator";
import { startAmbiguousSphere } from "./cccShiftView";
import {
  clearCccJourney,
  journeyCompletionRatio,
  loadCccJourney,
  saveCccJourney,
  type CccSavedJourney,
} from "./cccStorage";
import type {
  CccAttentionBlockPlan,
  CccAttentionTrialDefinition,
  CccInputMode,
  CccP0Phase,
  CccRecordedTrial,
  CccResponseChoice,
  CccRuntimeEvent,
} from "./cccTypes";
import { scoreCccAttentionTrial, summarizeCccAttentionScores } from "./cccValue";
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
  | "practice_intro"
  | "phase_intro"
  | "task"
  | "paused"
  | "block_complete"
  | "shift_view"
  | "complete"
  | "account";
type TaskStage = "fixation" | "evidence" | "feedback" | "interval";
type TaskMode = "practice" | "guided";

const appElement = document.querySelector<HTMLDivElement>("#app");
if (!appElement) throw new Error("Missing #app root.");
const appRoot: HTMLDivElement = appElement;

const APP_BASE = import.meta.env.BASE_URL || "/";
let journey = loadCccJourney();
let selectedWorkflow: WorkflowChoice = journey?.workflowChoice || "focused_work";
let view: View = journey?.completedAt ? "complete" : "welcome";
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
    && results.filter((result) => result.scoring.isValidDecision).length >= block.validTrialCount;
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
  saveCccJourney(journey);
}

function clearTaskTiming(): void {
  for (const timer of taskTimers) window.clearTimeout(timer);
  taskTimers = [];
  if (potTimer) window.clearInterval(potTimer);
  potTimer = 0;
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
  const completion = journey ? Math.round(journeyCompletionRatio(journey) * 100) : 0;
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
          <div class="ccc-header-progress" aria-label="Journey ${completion}% complete">
            <span>Journey</span>
            <div class="ccc-header-progress-track" role="progressbar" aria-label="Journey completion" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${completion}"><i style="width:${completion}%"></i></div>
          </div>` : `<span class="ccc-status-chip">Early access</span>`}
        <button class="ccc-account-button" data-action="open-account">${accountLabel}</button>
      </div>
    </header>`;
}

function shell(content: string, className = ""): string {
  return `<main class="ccc-app ${className}">${header()}<div class="ccc-main" id="ccc-content" tabindex="-1">${content}</div><footer class="ccc-footer"><span>IQ Mindware · cognitive training for demanding workflows</span><span>Non-clinical · broader benefit is checked, not assumed</span><span><a href="https://www.iqmindware.com/privacy/">Privacy</a> · <a href="https://www.iqmindware.com/terms/">Terms</a></span></footer></main>`;
}

const JOURNEY_LABELS: Record<Exclude<CccP0Phase, "practice">, string> = {
  arrow_stabilisation: "Find",
  flow_first_contact: "Change",
  flow_recovery: "Recover",
  arrow_return: "Return",
  absolute_mix: "Switch",
};

function journeyRail(completedBeforeIndex: number, currentIndex: number | null = null): string {
  if (!journey) return "";
  const steps = journey.plan.blocks.map((block, index) => {
    if (block.phase === "practice") return "";
    const isComplete = index < completedBeforeIndex;
    const isCurrent = currentIndex === index;
    const state = isComplete ? "is-complete" : isCurrent ? "is-current" : "";
    const marker = isComplete ? "✓" : String(index + 1);
    return `<li class="${state}" ${isCurrent ? 'aria-current="step"' : ""}><span aria-hidden="true">${marker}</span><small>${JOURNEY_LABELS[block.phase]}</small></li>`;
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
  const mainAction = hasJourney
    ? `<button class="ccc-button ccc-button-primary" data-action="continue-journey">Continue your journey</button>`
    : `<button class="ccc-button ccc-button-primary" data-action="begin-journey">Start with a short practice</button>`;
  return shell(`
    <section class="ccc-hero">
      <div class="ccc-hero-copy">
        <span class="ccc-kicker">Precision cognitive training</span>
        <h1>Focus, hold and update <em>what matters.</em></h1>
        <p class="ccc-lead">Practise staying with the goal when distraction, interference or a changing format pulls your attention elsewhere.</p>
        <div class="ccc-hero-facts" aria-label="Journey overview">
          <span>Brief practice</span><span>Five guided stages</span><span>Workflow reconnect</span>
        </div>
      </div>
      <aside class="ccc-control-panel">
        <span class="ccc-kicker">One control loop</span>
        <h2>The pattern changes. The core moves stay the same.</h2>
        <div class="ccc-control-strip" aria-label="The three moves trained in this app">
          <article><span>1</span><strong>Find what matters</strong><small>Separate the useful signal from competing information.</small></article>
          <article><span>2</span><strong>Take in enough</strong><small>Keep looking until the pattern is clear enough.</small></article>
          <article><span>3</span><strong>Make the call</strong><small>Choose at the right time—or avoid a guess.</small></article>
        </div>
      </aside>
    </section>
    ${hasJourney ? `
      <section class="ccc-resume-card">
        <div class="ccc-card-heading"><div><span class="ccc-kicker">Your current journey</span><h2>Pick up where you left off.</h2></div><strong class="ccc-progress-number">${completion}%</strong></div>
        ${journeyRail(journey!.activeBlockIndex, journey!.activeBlockIndex)}
        <div class="ccc-progress-track" role="progressbar" aria-label="Journey progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${completion}"><span style="width:${completion}%"></span></div>
        <p>Your selected context is <strong>${WORKFLOW_CHOICES[journey!.workflowChoice].label.toLowerCase()}</strong>. Your place is saved on this device.</p>
        ${mainAction}
      </section>` : `
      <section class="ccc-section">
        <div class="ccc-card-heading"><div><span class="ccc-kicker">Connect training to a task that matters</span><h2>Where is your workflow under strain?</h2></div><span class="ccc-privacy-note">Broad context only</span></div>
        <p>Choose the closest context. The exercise remains the same; only the prompts that help you reconnect it to real work, study or planning will change.</p>
        <div class="ccc-workflow-grid">${workflowCards()}</div>
        ${mainAction}
      </section>`}
    <aside class="ccc-evidence-note"><strong>Progress means more than a higher exercise score.</strong><span>${EVIDENCE_BOUNDARY_COPY}</span></aside>
  `, "ccc-welcome");
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
      <div class="ccc-instruction-grid">
        <article><strong>Look first</strong><span>The buttons appear after a brief viewing moment.</span></article>
        <article><strong>Watch the points</strong><span>A correct answer keeps the points still available. A wrong answer can lose points.</span></article>
        <article><strong>Do not guess</strong><span>Choose <em>Not sure</em> when the evidence is not good enough.</span></article>
      </div>
      <p class="ccc-soft-note">Practice is brief and does not count towards your journey.</p>
      <div class="ccc-actions">
        <button class="ccc-button ccc-button-primary" data-action="start-practice">Begin practice</button>
        <button class="ccc-button ccc-button-quiet" data-action="back-welcome">Back</button>
      </div>
    </section>
  `);
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
        <strong>${workflowBridge(block.phase, journey.workflowChoice)}</strong>
      </aside>
      <h2 class="ccc-subheading">Two ways this stage may feel</h2>
      <div class="ccc-regime-grid">${regimeCards(block)}</div>
      ${block.diagnostic ? `<p class="ccc-soft-note">Your first try in this format is kept apart from later practice, so you can see how quickly you settle in.</p>` : ""}
      <div class="ccc-actions">
        <button class="ccc-button ccc-button-primary" data-action="start-phase">${block.shiftViewBefore && !journey.shiftViewCompleted ? "Start the changeover" : "Begin this stage"}</button>
        <button class="ccc-button ccc-button-quiet" data-action="back-welcome">Save and leave</button>
      </div>
    </section>
  `);
}

function arrowStimulus(trial: CccAttentionTrialDefinition): string {
  const arrows = trial.stimulusItems.map((item) => {
    const x = item.position.x * 3.6;
    const y = item.position.y * 3.6;
    const angle = Math.atan2(item.vector.y, item.vector.x) * 180 / Math.PI;
    return `<g transform="translate(${x} ${y}) rotate(${angle})"><path d="M-24 -8 H6 V-16 L26 0 L6 16 V8 H-24 Z" /></g>`;
  }).join("");
  return `<svg class="ccc-stimulus-svg" viewBox="0 0 360 360" role="img" aria-label="Five arrows pointing left or right"><g class="ccc-arrow-items">${arrows}</g></svg>`;
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
    const direction = item.vector.x >= 0 ? 1 : -1;
    const dots = Array.from({ length: 9 }, (_, dotIndex) => {
      const start = -46 + dotIndex * 12;
      const end = start + direction * 48;
      return `<circle cy="${-18 + (dotIndex % 4) * 12}" r="3.2"><animate attributeName="cx" values="${start};${end}" dur="1.05s" begin="${-dotIndex * 0.09}s" repeatCount="indefinite" /></circle>`;
    }).join("");
    return `<g clip-path="url(#flow-clip-${index})" transform="translate(${x} ${y})"><rect x="-34" y="-34" width="68" height="68" rx="34" /><g class="ccc-flow-points">${dots}</g></g><circle class="ccc-flow-ring" cx="${x}" cy="${y}" r="31" />`;
  }).join("");
  return `<svg class="ccc-stimulus-svg" viewBox="0 0 360 360" role="img" aria-label="Five moving dot patterns travelling left or right"><defs>${definitions}</defs>${apertures}</svg>`;
}

function stimulusFor(trial: CccAttentionTrialDefinition): string {
  return trial.wrapperId === "arrow_abs" ? arrowStimulus(trial) : flowStimulus(trial);
}

function taskProgress(block: CccAttentionBlockPlan): string {
  const valid = currentResults().filter((result) => result.scoring.isValidDecision).length;
  const target = block.validTrialCount;
  const percentage = Math.min(100, Math.round(valid / Math.max(1, target) * 100));
  return `<div class="ccc-task-progress" role="progressbar" aria-label="Stage decisions" aria-valuemin="0" aria-valuemax="${target}" aria-valuenow="${Math.min(valid, target)}"><span style="width:${percentage}%"></span></div><small>${Math.min(valid, target)} of ${target} decisions</small>`;
}

function renderTask(): string {
  const trial = taskStage === "feedback" ? feedbackTrial : activeTrial();
  const block = currentBlock();
  if (!journey || !trial || !block) return renderWelcome();
  const regime = CCC_REGIMES[trial.regimeId];
  const regimeCopy = REGIME_COPY[trial.regimeId];
  const isPractice = taskMode === "practice";
  const wrapperLabel = trial.wrapperId === "arrow_abs" ? "Arrows" : "Moving patterns";
  const controlsDisabled = taskStage !== "evidence" || !responseEnabled || responseLocked;
  const feedbackPoints = feedbackResult?.scoring.pointsRealised ?? 0;
  const feedbackState = feedbackResult?.scoring.isCorrect
    ? "is-correct"
    : feedbackResult?.scoring.responseClass === "withhold"
      ? "is-withhold"
      : feedbackResult?.scoring.responseClass === "answer"
        ? "is-incorrect"
        : "is-neutral";
  const feedbackIcon = feedbackState === "is-correct" ? "✓" : feedbackState === "is-withhold" ? "–" : feedbackState === "is-incorrect" ? "×" : "↻";
  const pot = regime.correctPot;
  return shell(`
    <section class="ccc-task-card">
      <div class="ccc-task-topline">
        <div><span>${isPractice ? "Practice" : `Stage ${journey.activeBlockIndex + 1} of ${journey.plan.blocks.length}`}</span><strong>${wrapperLabel}</strong></div>
        <div class="ccc-task-progress-wrap">${taskProgress(block)}</div>
        <button class="ccc-exit" data-action="pause-session">Pause</button>
      </div>
      <div class="ccc-task-cue">
        <span>${regimeCopy.title}</span>
        <strong>${taskStage === "fixation" ? "Get ready" : taskStage === "interval" ? "Next pattern" : taskStage === "feedback" ? feedbackMessage : regimeCopy.cue}</strong>
      </div>
      <div class="ccc-stimulus-stage ${taskStage === "fixation" || taskStage === "interval" ? "is-fixation" : ""} ${taskStage === "feedback" ? "is-feedback" : ""}">
        ${taskStage === "fixation" ? `<span class="ccc-fixation" aria-label="Get ready">+</span>` : taskStage === "interval" ? `<span class="ccc-interval-dot" aria-hidden="true"></span>` : stimulusFor(trial)}
      </div>
      ${taskStage === "feedback" ? `
        <div class="ccc-value-panel ccc-result-panel ${feedbackState}" role="status" aria-live="polite">
          <span class="ccc-feedback-icon" aria-hidden="true">${feedbackIcon}</span>
          <div><span>This choice</span><strong>${formatPoints(feedbackPoints)}</strong></div>
          <small>${feedbackMessage}</small>
        </div>` : `
        <div class="ccc-value-panel">
          <div><span>Available if correct</span><strong id="ccc-live-pot">${Math.round(pot)}</strong></div>
          <div class="ccc-pot-track"><span id="ccc-pot-bar" style="width:100%"></span></div>
          <small>Correct: keep what remains · Wrong: ${regime.errorLoss} points lost · Not sure: 0</small>
        </div>`}
      <div class="ccc-response-row" aria-label="Choose the majority direction">
        <button class="ccc-response ccc-response-left" data-response="left" aria-label="Choose left" ${controlsDisabled ? "disabled" : ""}><span aria-hidden="true">←</span><strong>Left</strong><kbd>←</kbd></button>
        <button class="ccc-response ccc-response-unsure" data-response="withhold" aria-label="Choose not sure for zero points" ${controlsDisabled ? "disabled" : ""}><span aria-hidden="true">?</span><strong>Not sure</strong><kbd>↓</kbd></button>
        <button class="ccc-response ccc-response-right" data-response="right" aria-label="Choose right" ${controlsDisabled ? "disabled" : ""}><span aria-hidden="true">→</span><strong>Right</strong><kbd>→</kbd></button>
      </div>
      <p class="ccc-task-helper" aria-live="polite">${taskStage === "fixation" || taskStage === "interval" ? "The next pattern is about to appear." : taskStage === "feedback" ? "" : responseEnabled ? "Choose when the evidence is good enough." : "Look at the whole pattern first."}</p>
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
    </section>`);
}

function blockSummary(results: CccRecordedTrial[]): { accuracy: string; points: number; withholds: number } {
  const summary = summarizeCccAttentionScores(results.map((result) => result.scoring));
  return {
    accuracy: summary.answeredAccuracy === null ? "—" : `${Math.round(summary.answeredAccuracy * 100)}%`,
    points: summary.totalPoints,
    withholds: summary.withholdCount,
  };
}

function renderBlockComplete(): string {
  if (!journey) return renderWelcome();
  const block = currentBlock();
  if (!block) return renderComplete();
  const results = currentResults();
  const summary = blockSummary(results);
  const isPractice = taskMode === "practice";
  const isLast = !isPractice && journey.activeBlockIndex === journey.plan.blocks.length - 1;
  const copy = block.phase === "practice" ? {
    title: "You know the task.",
    body: "Next, the points and changing evidence become part of the training journey.",
  } : block.diagnostic ? {
    title: "Your first look is recorded.",
    body: "This first encounter is kept separate from the recovery practice that comes next.",
  } : {
    title: "Stage complete.",
    body: PHASE_COPY[block.phase as Exclude<typeof block.phase, "practice">].bridge,
  };
  return shell(`
    <section class="ccc-narrow-card">
      ${journeyRail(isPractice ? 0 : Math.min(journey.plan.blocks.length, journey.activeBlockIndex + 1), null)}
      <span class="ccc-kicker">${isPractice ? "Practice complete" : `Stage ${journey.activeBlockIndex + 1} complete`}</span>
      <h1>${copy.title}</h1>
      <p>${copy.body}</p>
      ${isPractice ? "" : `
        <div class="ccc-summary-grid">
          <article><span>Accuracy when answered</span><strong>${summary.accuracy}</strong></article>
          <article><span>Points this stage</span><strong>${formatPoints(summary.points)}</strong></article>
          <article><span>Guesses avoided</span><strong>${summary.withholds}</strong></article>
        </div>`}
      ${isPractice ? "" : `<p class="ccc-metric-note"><strong>Read these together.</strong> Accuracy covers answered items. Points also reflect timing and wrong choices. Guesses avoided shows when you chose not to force an answer.</p>`}
      <aside class="ccc-workflow-bridge"><span>Reconnect</span><strong>${isPractice ? WORKFLOW_CHOICES[journey.workflowChoice].example : workflowBridge(block.phase as Exclude<typeof block.phase, "practice">, journey.workflowChoice)}</strong></aside>
      <div class="ccc-actions">
        <button class="ccc-button ccc-button-primary" data-action="continue-after-block">${isLast ? "See your review" : "Continue"}</button>
        <button class="ccc-button ccc-button-quiet" data-action="back-welcome">Save and leave</button>
      </div>
    </section>`);
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
  `, "ccc-shift-view");
}

function renderComplete(): string {
  if (!journey) return renderWelcome();
  const reconnect = reconnectAction(journey.workflowChoice);
  const allResults = Object.values(journey.blockResults).flat();
  const summary = blockSummary(allResults);
  return shell(`
    <section class="ccc-complete-card">
      <span class="ccc-kicker">Find → Change → Recover → Return</span>
      <h1>You completed this attention journey.</h1>
      <p>You practised the same decision across arrows and moving patterns, returned to the original format, and then handled both formats in a changing sequence.</p>
      ${journeyRail(journey.plan.blocks.length, null)}
      <div class="ccc-summary-grid">
        <article><span>Accuracy when answered</span><strong>${summary.accuracy}</strong></article>
        <article><span>Total exercise points</span><strong>${formatPoints(summary.points)}</strong></article>
        <article><span>Guesses avoided</span><strong>${summary.withholds}</strong></article>
      </div>
      <p class="ccc-metric-note"><strong>This is exercise evidence.</strong> It shows how you handled the trained formats. The workflow step below is a separate prompt for applying the idea in context.</p>
      <aside class="ccc-reconnect-card">
        <span>Reconnect to the workflow</span>
        <h2>${reconnect.title}</h2>
        <p>${reconnect.action}</p>
      </aside>
      <aside class="ccc-evidence-note"><strong>Keep the outcomes separate.</strong><span>${EVIDENCE_BOUNDARY_COPY}</span></aside>
      <div class="ccc-actions">
        <button class="ccc-button ccc-button-primary" data-action="return-home">Return to overview</button>
        <button class="ccc-button ccc-button-quiet" data-action="restart-journey">Repeat the journey</button>
      </div>
    </section>`);
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
      <button class="ccc-button ccc-button-quiet" data-action="close-account">Back</button>
    </section>`);
}

function render(): void {
  const content = view === "welcome" ? renderWelcome()
    : view === "practice_intro" ? renderPracticeIntro()
      : view === "phase_intro" ? renderPhaseIntro()
        : view === "task" ? renderTask()
          : view === "paused" ? renderPaused()
            : view === "block_complete" ? renderBlockComplete()
              : view === "shift_view" ? renderShiftView()
                : view === "complete" ? renderComplete()
                  : renderAccount();
  appRoot.innerHTML = content;
  if (view === "shift_view") mountShiftView();
}

function createNewJourney(): void {
  const sessionId = crypto.randomUUID();
  const plan = createP0AttentionCarrierTransferPlan({ sessionId, seed: sessionId });
  const queues = Object.fromEntries(plan.blocks.map((block) => [
    block.id,
    plan.trials.filter((trial) => trial.blockId === block.id),
  ]));
  const results = Object.fromEntries(plan.blocks.map((block) => [block.id, [] as CccRecordedTrial[]]));
  const now = new Date().toISOString();
  journey = {
    storageVersion: 1,
    plan,
    workflowChoice: selectedWorkflow,
    activeBlockIndex: 0,
    blockQueues: queues,
    blockResults: results,
    practiceQueue: createP0PracticeTrials(plan),
    practiceResults: [],
    practiceComplete: false,
    shiftViewCompleted: false,
    events: [],
    startedAt: now,
    updatedAt: now,
    completedAt: null,
  };
  taskMode = "practice";
  recordEvent("journey_started", { workflowChoice: selectedWorkflow }, null);
  saveJourney();
}

function resumeJourney(): void {
  if (!journey) {
    setView("welcome");
    return;
  }
  if (journey.completedAt) {
    setView("complete");
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

function beginTrial(): void {
  clearTaskTiming();
  const trial = activeTrial();
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
  const previous = currentResults().at(-1)?.trial;
  if (previous && previous.regimeId !== trial.regimeId) {
    recordEvent("regime_transition", { from: previous.regimeId, to: trial.regimeId }, trial.blockId);
  }
  if (previous && previous.wrapperId !== trial.wrapperId) {
    recordEvent("wrapper_transition", {
      sourceWrapperId: previous.wrapperId,
      targetWrapperId: trial.wrapperId,
      transitionKind: trial.transitionKind,
      withinMixedBlock: trial.phase === "absolute_mix",
    }, trial.blockId);
  }
  render();
  taskTimers.push(window.setTimeout(() => {
    taskStage = "evidence";
    evidenceStartedAt = performance.now();
    render();
    startPotDisplay(trial);
    taskTimers.push(window.setTimeout(() => {
      responseEnabled = true;
      enableResponseControls();
    }, CCC_TRIAL_TIMING.minimumExposureBeforeAnswerMs));
    taskTimers.push(window.setTimeout(() => {
      completeTrial(null, "deadline");
    }, CCC_TRIAL_TIMING.maxResponseWindowMs));
  }, CCC_TRIAL_TIMING.fixationCueMs));
}

function enableResponseControls(): void {
  document.querySelectorAll<HTMLButtonElement>("[data-response]").forEach((button) => {
    button.disabled = false;
  });
  const helper = document.querySelector<HTMLElement>(".ccc-task-helper");
  if (helper) helper.textContent = "Choose when the evidence is good enough.";
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
  if (result.scoring.responseClass === "omission") return "Time ended — this item will return.";
  if (result.scoring.responseClass === "withhold") return "Good choice not to guess.";
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
  const result: CccRecordedTrial = {
    trial,
    response,
    scoring,
    recordedAt: new Date().toISOString(),
    viewportClass: currentViewportClass(),
    inputMode,
    focusLost,
  };
  if (taskMode === "practice") journey.practiceResults.push(result);
  else journey.blockResults[trial.blockId].push(result);
  if (!scoring.isValidDecision) appendReplacement(trial);
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
    validForProgression: scoring.validForProgression,
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
    taskTimers.push(window.setTimeout(beginTrial, CCC_TRIAL_TIMING.interTrialIntervalMs));
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
    validDecisionCount: results.filter((result) => result.scoring.isValidDecision).length,
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
    void finaliseJourney().finally(() => setView("complete"));
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
    if (view !== "task" || taskStage !== "evidence" || !responseEnabled || responseLocked) return;
    const inputMode: CccInputMode = event instanceof PointerEvent && event.pointerType === "touch" ? "touch" : "pointer";
    completeTrial(response, inputMode);
    return;
  }
  const action = button.dataset.action;
  if (action === "choose-workflow") {
    selectedWorkflow = button.dataset.workflow as WorkflowChoice;
    render();
  } else if (action === "begin-journey") {
    createNewJourney();
    setView("practice_intro");
  } else if (action === "continue-journey") {
    resumeJourney();
  } else if (action === "start-practice") {
    startTask("practice");
  } else if (action === "start-phase") {
    const block = currentBlock();
    if (journey && block?.shiftViewBefore && !journey.shiftViewCompleted) setView("shift_view");
    else startTask("guided");
  } else if (action === "continue-after-block") {
    continueAfterBlock();
  } else if (action === "pause-session") {
    recordEvent("pause", { taskStage });
    if (taskStage === "fixation" || taskStage === "evidence") completeTrial(null, "system", true, false, "aborted");
    else setView("paused");
  } else if (action === "resume-task") {
    recordEvent("resume", {});
    setView("task");
    beginTrial();
  } else if (action === "back-welcome" || action === "return-home") {
    setView("welcome");
  } else if (action === "restart-journey") {
    if (window.confirm("Start a fresh journey on this device? Your completed cloud record, if any, will not be deleted.")) {
      clearCccJourney();
      journey = null;
      setView("welcome");
    }
  } else if (action === "open-account") {
    accountMessage = "";
    setView("account");
  } else if (action === "close-account") {
    setView(journey?.completedAt ? "complete" : "welcome");
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
  if (view !== "task" || taskStage !== "evidence" || !responseEnabled || responseLocked) return;
  const response = event.key === "ArrowLeft" ? "left"
    : event.key === "ArrowRight" ? "right"
      : event.key === "ArrowDown" ? "withhold"
        : null;
  if (!response) return;
  event.preventDefault();
  completeTrial(response, "keyboard");
});

document.addEventListener("visibilitychange", () => {
  if (!document.hidden || view !== "task" || responseLocked) return;
  if (taskStage === "fixation" || taskStage === "evidence") {
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
    if (remote?.storageVersion === 1 && remote.plan?.appId === "cognitive_control_coach"
      && (!journey || Date.parse(remote.updatedAt) > Date.parse(journey.updatedAt))) {
      journey = remote;
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
