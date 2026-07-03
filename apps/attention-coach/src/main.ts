import "./styles.css";
import { createFreePlaySessionPlan, createSessionPlan, generateTrial, phaseIntro } from "./generator";
import { opticFlowAperturesForTrial, opticFlowMaskAperturesForTrial } from "./opticFlow";
import { NOMINAL_BANDS, PHASE_CELL, PHASE_NAMES, PHASE_ORDER_BY_GROUP, PROTOCOL_VERSION, phaseStatusForPhase, transitionEventsForPhaseAdvance } from "./protocol";
import { createFarTransferWindows, createScoreSnapshot, updateEvidenceFromResults } from "./scoring";
import { conditionForLevel, INITIAL_STAIRCASE_LEVEL, nextStaircaseLevel } from "./staircase";
import { DEFAULT_PROGRESS, loadProgress, resetProgress, saveProgress, type CompletionRoute, type LocalProgress, type ProofBenchmarkDomain, type ProofBenchmarkEntry, type ProofBenchmarkTimepoint } from "./storage";
import {
  currentAuthUser,
  deleteProofBenchmark,
  fetchAttentionScratchBaselines,
  finalizeAttentionSession,
  isSupabaseConfigured,
  loadRemoteProgress,
  onAuthChange,
  recordDeviceCheck,
  saveProofBenchmark,
  saveRemoteProgress,
  sendEmailSignInLink,
  signOutUser,
  submitAttentionBlock,
  type AuthUser,
} from "./supabaseClient";
import { runDeviceReadiness } from "./timing";
import { chooseNextPhase } from "./wap";
import type { CellEvidence, CellKey, Construct, MiniBlockPlan, PhaseLabel, PhaseStatus, ProtocolGroup, ScratchBaseline, SessionPlan, TrialCondition, TrialDefinition, TrialResult } from "./types";

type View =
  | "auth"
  | "welcome"
  | "readiness"
  | "tutorial"
  | "today"
  | "today-rationale"
  | "break-plan"
  | "free-play"
  | "free-play-formats"
  | "briefing"
  | "pre-task-instructions"
  | "practice-intro"
  | "task"
  | "block-break"
  | "complete"
  | "progress"
  | "proof"
  | "proof-entry"
  | "transfer"
  | "transfer-model"
  | "training-map"
  | "evidence"
  | "profile";

type TaskStage = "ready" | "fixation" | "stimulus" | "mask" | "response" | "feedback";
type StyleMode = "iq" | "legacy";
type ProgressDashboardMode = "overview" | "detail";
type SessionSource = "guided" | "guided_practice" | "free_play" | "preview" | "recheck" | "easier";
type PendingTaskStart =
  | { kind: "guided" }
  | { kind: "easier" }
  | { kind: "free"; construct: Construct; cellKey: CellKey; source: SessionSource };
type SyncState = "local" | "checking" | "synced" | "pending" | "error";

const GENERATOR_VERSION = "attention-coach-generator-v0.1";
const ADAPTIVE_VERSION = "attention-coach-staircase-v0.1";
const SCORING_VERSION = "attention-coach-scoring-v0.1";

interface RuntimeState {
  view: View;
  progress: LocalProgress;
  sessionPlan: SessionPlan | null;
  activeBlockIndex: number;
  activeTrialIndex: number;
  blockResults: TrialResult[];
  sessionResults: TrialResult[];
  feedback: "correct" | "incorrect" | "";
  readinessRunning: boolean;
  taskStage: TaskStage;
  responseStartedAt: number;
  stageTimer: number | null;
  staircaseLevels: Record<string, number>;
  sessionMode: "protocol" | "free";
  sessionSource: SessionSource;
  progressionScored: boolean;
  guidedReturn: { sessionPlan: SessionPlan; activeBlockIndex: number } | null;
  progressDashboardMode: ProgressDashboardMode;
  pendingTaskStart: PendingTaskStart | null;
  editingProofBenchmarkId: string | null;
  viewHistory: View[];
  soundOn: boolean;
  authUser: AuthUser | null;
  authReady: boolean;
  authMessage: string;
  authBusy: boolean;
  syncState: SyncState;
  syncMessage: string;
}

const app = document.querySelector<HTMLDivElement>("#app");
if (!app) throw new Error("Missing #app root.");
const appRoot = app;
const STYLE_MODE_KEY = "attentionCoachStyleModeV2";
const betaAuthRequired = isSupabaseConfigured;
const APP_BASE = import.meta.env.BASE_URL || "/";

function resolveStyleMode(): StyleMode {
  const queryStyle = new URLSearchParams(window.location.search).get("style");
  if (queryStyle === "legacy" || queryStyle === "iq") {
    window.localStorage.setItem(STYLE_MODE_KEY, queryStyle);
    return queryStyle;
  }
  const saved = window.localStorage.getItem(STYLE_MODE_KEY);
  return saved === "iq" ? "iq" : "legacy";
}

let styleMode: StyleMode = resolveStyleMode();
let pendingBlockSubmissions: Promise<void>[] = [];

function applyStyleMode(mode: StyleMode): void {
  styleMode = mode;
  document.documentElement.dataset.styleGuide = mode;
  document.body.dataset.styleGuide = mode;
  appRoot.dataset.styleGuide = mode;
  window.localStorage.setItem(STYLE_MODE_KEY, mode);
}

applyStyleMode(styleMode);

function shouldStartOnToday(progress: LocalProgress): boolean {
  return progress.sessionNumber > 1 || progress.completions.length > 0;
}

function resolveInitialView(progress: LocalProgress): View {
  const queryView = new URLSearchParams(window.location.search).get("view");
  const allowedViews: View[] = [
    "auth",
    "welcome",
    "readiness",
    "tutorial",
    "today",
    "today-rationale",
    "break-plan",
    "free-play",
    "free-play-formats",
    "progress",
    "proof",
    "proof-entry",
    "transfer",
    "transfer-model",
    "training-map",
    "evidence",
    "profile",
  ];
  if (betaAuthRequired) return "auth";
  return allowedViews.includes(queryView as View) ? (queryView as View) : shouldStartOnToday(progress) ? "today" : "welcome";
}

function queryProtocolGroup(): ProtocolGroup | null {
  const value = new URLSearchParams(window.location.search).get("protocolGroup");
  return value === "validation_arrows_first" || value === "validation_flow_first" || value === "commercial_arrows_first"
    ? value
    : null;
}

function loadAssignedProgress(): LocalProgress {
  const progress = loadProgress();
  const assignedGroup = queryProtocolGroup();
  if (!assignedGroup || assignedGroup === progress.protocolGroup) return progress;
  const isFresh = progress.sessionNumber <= 1 && progress.evidence.length === 0 && progress.completedTransitions.length === 0;
  const firstPhase = PHASE_ORDER_BY_GROUP[assignedGroup][0];
  const assignedProgress = {
    ...progress,
    protocolGroup: assignedGroup,
    currentPhase: isFresh ? firstPhase : progress.currentPhase,
    latestSnapshot: isFresh ? null : progress.latestSnapshot,
    scratchBaselines: [],
  };
  saveProgress(assignedProgress);
  return assignedProgress;
}

const initialProgress = loadAssignedProgress();

let state: RuntimeState = {
  view: resolveInitialView(initialProgress),
  progress: initialProgress,
  sessionPlan: null,
  activeBlockIndex: 0,
  activeTrialIndex: 0,
  blockResults: [],
  sessionResults: [],
  feedback: "",
  readinessRunning: false,
  taskStage: "ready",
  responseStartedAt: 0,
  stageTimer: null,
  staircaseLevels: {},
  sessionMode: "protocol",
  sessionSource: "guided",
  progressionScored: true,
  guidedReturn: null,
  progressDashboardMode: "overview",
  pendingTaskStart: null,
  editingProofBenchmarkId: null,
  viewHistory: [],
  soundOn: true,
  authUser: null,
  authReady: !betaAuthRequired,
  authMessage: "",
  authBusy: false,
  syncState: betaAuthRequired ? "checking" : "local",
  syncMessage: betaAuthRequired ? "Checking beta sign-in." : "Local demo mode.",
};

function validScratchBaseline(value: ScratchBaseline): boolean {
  return Boolean(
    value &&
      value.modelVersion &&
      value.construct &&
      value.targetCell &&
      value.source &&
      (value.tau90Windows !== null || value.asymptoticCapacityBps !== null || value.asymptoticMiProxy !== null),
  );
}

async function hydrateScratchBaselines(): Promise<void> {
  try {
    const baselines = await fetchAttentionScratchBaselines({
      protocolGroup: state.progress.protocolGroup,
      deviceRefreshRateHz: state.progress.deviceReadiness?.refreshRateHz ?? null,
      timingQuality: state.progress.deviceReadiness?.quality ?? null,
      targetCells: ["flow_abs", "arrow_abs", "flow_rel", "arrow_rel"],
      constructs: ["ACC", "BSE"],
    });
    const valid = baselines.filter(validScratchBaseline);
    if (valid.length === 0) return;
    const byKey = new Map<string, ScratchBaseline>();
    for (const baseline of [...state.progress.scratchBaselines, ...valid]) {
      byKey.set(`${baseline.construct}:${baseline.targetCell}:${baseline.source}`, baseline);
    }
    state.progress = { ...state.progress, scratchBaselines: Array.from(byKey.values()) };
    persistProgress();
  } catch (error) {
    console.warn("Scratch baselines were not loaded.", error);
  }
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "\"": "&quot;",
      "'": "&#39;",
    };
    return entities[char] || char;
  });
}

function assetPath(path: string): string {
  return `${APP_BASE}${path.replace(/^\/+/, "")}`;
}

function authLabel(): string {
  if (!betaAuthRequired) return "Local demo";
  if (!state.authReady) return "Checking sign-in";
  return state.authUser?.email || "Sign in required";
}

function syncLabel(): string {
  const labels: Record<SyncState, string> = {
    local: "Local only",
    checking: "Checking sync",
    synced: "Synced",
    pending: "Sync pending",
    error: "Sync issue",
  };
  return labels[state.syncState];
}

function markSync(stateValue: SyncState, message: string): void {
  state.syncState = stateValue;
  state.syncMessage = message;
}

function persistProgressRemote(): void {
  if (!betaAuthRequired || !state.authUser) return;
  markSync("pending", "Saving programme state.");
  void saveRemoteProgress(state.progress)
    .then(() => {
      markSync("synced", "Programme state saved.");
      render();
    })
    .catch((error) => {
      console.warn("Progress state was not synced.", error);
      markSync("error", "Programme state could not be synced.");
      render();
    });
}

function persistProgress(): void {
  saveProgress(state.progress);
  persistProgressRemote();
}

async function restoreRemoteProgress(): Promise<void> {
  if (!betaAuthRequired || !state.authUser) return;
  markSync("checking", "Loading beta progress.");
  render();
  let nextView: View = "welcome";
  try {
    const remote = await loadRemoteProgress();
    if (remote) {
      state.progress = { ...DEFAULT_PROGRESS, ...remote };
      saveProgress(state.progress);
      markSync("synced", "Beta progress loaded.");
      nextView = shouldStartOnToday(state.progress) ? "today" : "welcome";
    } else {
      state.progress = { ...DEFAULT_PROGRESS };
      saveProgress(state.progress);
      await saveRemoteProgress(state.progress);
      markSync("synced", "New beta progress record created.");
      nextView = "welcome";
    }
  } catch (error) {
    console.warn("Remote progress was not loaded.", error);
    const detail = error instanceof Error ? error.message : "Unknown sync error.";
    markSync("error", `Could not load beta progress: ${detail}`);
    nextView = "welcome";
  }
  void hydrateScratchBaselines();
  state.view = nextView;
  state.viewHistory = [];
  render();
}

function button(label: string, action: string, variant: "primary" | "secondary" | "ghost" = "primary"): string {
  return `<button class="ui-button ui-button-${variant}" data-action="${action}">${escapeHtml(label)}</button>`;
}

function headerIcon(name: "back" | "home" | "sound-on" | "sound-off"): string {
  const icons: Record<"back" | "home" | "sound-on" | "sound-off", string> = {
    back: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14.5 6.5 9 12l5.5 5.5"/><path d="M10 12h9"/></svg>`,
    home: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4.5 11.5 12 5l7.5 6.5"/><path d="M7 10.5v8h10v-8"/><path d="M10 18.5v-5h4v5"/></svg>`,
    "sound-on": `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4.5 14.5h3.2l4.8 4v-13l-4.8 4H4.5z"/><path d="M16 9a4.8 4.8 0 0 1 0 6"/><path d="M18.5 6.8a8.4 8.4 0 0 1 0 10.4"/></svg>`,
    "sound-off": `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4.5 14.5h3.2l4.8 4v-13l-4.8 4H4.5z"/><path d="m16 9 4 6"/><path d="m20 9-4 6"/></svg>`,
  };
  return icons[name];
}

function shell(content: string, options: { task?: boolean; splash?: boolean } = {}): string {
  if (options.task) return `<main class="task-shell">${content}</main>`;
  if (options.splash) return `<main class="app-shell is-splash">${content}</main>`;
  const tabbedViews: View[] = [
    "today",
    "today-rationale",
    "break-plan",
    "free-play",
    "free-play-formats",
    "pre-task-instructions",
    "progress",
    "proof",
    "proof-entry",
  ];
  const contentClasses = [
    "app-content",
    `view-${state.view}`,
    tabbedViews.includes(state.view) ? "has-app-tabs" : "",
    betaAuthRequired ? "has-beta-status" : "",
  ].filter(Boolean).join(" ");
  const backControl = state.viewHistory.length > 0
    ? `<button class="app-nav-button app-back-button" data-action="nav-back" aria-label="Go back">${headerIcon("back")}</button>`
    : "";
  const homeControl = `<button class="app-nav-button app-home-button ${state.view === "today" ? "is-current" : ""}" data-action="nav-today" aria-label="Go to home screen">${headerIcon("home")}</button>`;
  const authControl = betaAuthRequired && state.authUser
    ? `<button class="app-auth-button" data-action="sign-out" title="${escapeHtml(authLabel())}">Sign out</button>`
    : betaAuthRequired
      ? `<button class="app-auth-button" data-action="nav-auth">Sign in</button>`
      : "";
  const soundControl = `<button class="app-nav-button app-sound-button ${state.soundOn ? "is-on" : "is-off"}" data-action="toggle-sound" aria-label="${state.soundOn ? "Turn sound feedback off" : "Turn sound feedback on"}">${headerIcon(state.soundOn ? "sound-on" : "sound-off")}</button>`;
  return `
    <main class="app-shell">
      <header class="app-brand-bar">
        <div class="app-header-left">${backControl}${homeControl}</div>
        <div class="app-header-brand">
          <img src="${assetPath("attention-coach-wordmark-v3.svg")}" alt="Attention Coach" />
        </div>
        <div class="app-header-right">${authControl}${soundControl}</div>
      </header>
      <div class="${contentClasses}">
        ${betaAuthRequired ? `<div class="beta-status-bar"><span>${escapeHtml(authLabel())}</span><strong>${escapeHtml(syncLabel())}</strong><em>${escapeHtml(state.syncMessage)}</em></div>` : ""}
        ${content}
      </div>
    </main>
  `;
}

function currentSnapshot() {
  return (
    state.progress.latestSnapshot ||
    createScoreSnapshot({
      sessionNumber: state.progress.sessionNumber,
      activePhase: state.progress.currentPhase,
      phaseStatus: state.progress.phaseStatus,
      nominalBand: NOMINAL_BANDS[state.progress.currentPhase],
      evidence: state.progress.evidence,
      completedTransitions: state.progress.completedTransitions,
      farTransferWindows: state.progress.farTransferWindows,
      scratchBaselines: state.progress.scratchBaselines,
      protocolGroup: state.progress.protocolGroup,
    })
  );
}

function scoreText(value: number | null, suffix = ""): string {
  return value === null ? "Calibrating" : `${value}${suffix}`;
}

function consumerStatus(value: string | null | undefined): string {
  const labels: Record<string, string> = {
    insufficient_data: "Calibrating",
    calibrating: "Calibrating",
    moderate_confidence: "Moderate confidence",
    high_confidence: "High confidence",
    timing_limited: "Timing limited",
    unstable_estimate: "Unstable today",
    improving: "Improving",
    steady: "Steady",
    developing: "Developing",
    variable_today: "Variable today",
    needs_more_data: "Needs more data",
    coming_up: "Coming up",
    available: "Available",
    not_enough_evidence: "Still calibrating",
    current_phase: "Current focus",
    ready_next_session: "Ready soon",
    on_track: "On track",
    lagging: "Still calibrating",
    active: "In progress",
    flattening: "Getting steadier",
    ready_to_swap: "Next challenge ready",
    extended_for_learning_curve: "More practice here",
    mixed: "Flexible practice",
    delayed: "Return check",
  };
  return labels[value || ""] || (value ? value.replaceAll("_", " ") : "Calibrating");
}

function confidenceCopy(value: string | null | undefined): string {
  const labels: Record<string, string> = {
    insufficient_data: "More sessions are needed before this score is stable.",
    calibrating: "More sessions are needed before this score is stable.",
    moderate_confidence: "Enough data are available for a useful training estimate.",
    high_confidence: "This score is based on repeated stable sessions.",
    timing_limited: "Device timing may have affected the estimate.",
    unstable_estimate: "Today's session looked unusually variable.",
  };
  return labels[value || ""] || "More sessions make this estimate more reliable.";
}

function adaptiveProgrammeCopy(): string {
  return "Typical pathway: roughly 20 sessions, depending on learning curve progression.";
}

function nextChallengeCopy(stateValue: string): string {
  if (stateValue === "ready_next_session") return "A new challenge is ready for your next guided session.";
  if (stateValue === "not_enough_evidence") {
    return "You will stay here a little longer so the learning curve becomes clearer.";
  }
  return "New challenges appear when your learning curve is stable.";
}

const PHASE_WHY_COPY: Record<PhaseLabel, string> = {
  P1_ARROW_ABS: "We are building your starting point with static arrow displays.",
  P2_FLOW_ABS: "The display changes from static arrows to moving patterns. The skill is the same: pick out the main signal.",
  P3_ARROW_REL: "Now the task becomes more relational. You judge how items relate to the centre, not just which way they point on the screen.",
  P4_FLOW_REL: "The app checks whether the relational skill carries into motion patterns.",
  P1_FLOW_ABS: "We are building your starting point with moving patterns.",
  P2_ARROW_ABS: "The display changes from moving patterns to static arrows. The skill is the same: pick out the main signal.",
  P3_FLOW_REL: "Now the motion task becomes more relational. You judge how movement relates to the centre.",
  P4_ARROW_REL: "The app checks whether the relational skill carries into static arrow patterns.",
  P5_MIXED: "Formats now alternate. The goal is to keep the rule stable when the surface changes unpredictably.",
  P6_DELAYED: "The app re-checks whether the skill comes back after time away.",
};

const PHASE_GOAL_COPY: Record<PhaseLabel, string> = {
  P1_ARROW_ABS: "build a clear attention-control baseline.",
  P2_FLOW_ABS: "recover the same signal skill in moving patterns.",
  P3_ARROW_REL: "use the pattern's relationship, not just its surface direction.",
  P4_FLOW_REL: "recover the relational skill in motion patterns.",
  P1_FLOW_ABS: "build a clear attention-control baseline in motion patterns.",
  P2_ARROW_ABS: "recover the same signal skill in static arrows.",
  P3_FLOW_REL: "use the movement pattern's relationship to the centre.",
  P4_ARROW_REL: "recover the relational skill in static arrows.",
  P5_MIXED: "keep the rule stable while formats alternate.",
  P6_DELAYED: "re-check whether the skill returns after spacing.",
};

const PHASE_STATUS_COPY: Record<PhaseStatus | "ready_for_next_challenge" | "recovering_new_format" | "mixed_stability" | "return_check" | "calibrating", string> = {
  active: "Building a clear learning curve.",
  flattening: "Getting steadier.",
  ready_to_swap: "Your next challenge is ready.",
  recovering: "Checking recovery in the new format.",
  extended_for_learning_curve: "Still building a clear learning curve.",
  mixed: "Testing flexible switching.",
  delayed: "Re-checking whether the skill returns.",
  completed: "Guided pathway complete.",
  ready_for_next_challenge: "Your next challenge is ready.",
  recovering_new_format: "Checking recovery in the new format.",
  mixed_stability: "Testing flexible switching.",
  return_check: "Re-checking whether the skill returns.",
  calibrating: "Still collecting enough reliable data.",
};

function appTabs(active: "today" | "train" | "progress" | "proof"): string {
  return `
    <nav class="tabs">
      ${navButton("Today", "nav-today", active === "today")}
      ${navButton("Train", "nav-free-play", active === "train")}
      ${navButton("Progress", "nav-progress", active === "progress")}
      ${navButton("Proof", "nav-proof", active === "proof")}
    </nav>
  `;
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function daysBetweenIsoDates(fromIso: string, toIso: string): number {
  const from = new Date(`${fromIso}T00:00:00`);
  const to = new Date(`${toIso}T00:00:00`);
  return Math.round((to.getTime() - from.getTime()) / 86400000);
}

function latestCompletion() {
  return [...state.progress.completions].sort((a, b) => b.completedAt.localeCompare(a.completedAt))[0] || null;
}

function hasReturnGap(): boolean {
  const latest = latestCompletion();
  return Boolean(latest && daysBetweenIsoDates(latest.date, todayIso()) >= 2);
}

function completionDots(): string {
  const recent = state.progress.completions.slice(-7);
  return Array.from({ length: 7 }, (_, index) => {
    const completion = recent[index];
    return `<span class="${completion ? "is-complete" : ""}" title="${completion ? escapeHtml(completion.route.replaceAll("_", " ")) : "Not yet"}">${completion ? index + 1 : ""}</span>`;
  }).join("");
}

function completionEntry(route: CompletionRoute, sessionNumber = state.progress.sessionNumber, phase = state.progress.currentPhase) {
  return {
    id: `completion-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    date: todayIso(),
    route,
    completedAt: new Date().toISOString(),
    sessionNumber,
    phase,
  };
}

function recordCompletion(route: CompletionRoute, sessionNumber = state.progress.sessionNumber, phase = state.progress.currentPhase): void {
  const entry = completionEntry(route, sessionNumber, phase);
  state.progress = {
    ...state.progress,
    completions: [...state.progress.completions, entry].slice(-60),
  };
  persistProgress();
}

function phaseStatusCopy(phase: PhaseLabel, status: PhaseStatus): string {
  if (phase === "P2_FLOW_ABS" || phase === "P4_FLOW_REL" || phase === "P2_ARROW_ABS" || phase === "P4_ARROW_REL") return PHASE_STATUS_COPY.recovering_new_format;
  if (phase === "P5_MIXED") return PHASE_STATUS_COPY.mixed_stability;
  if (phase === "P6_DELAYED") return PHASE_STATUS_COPY.return_check;
  return PHASE_STATUS_COPY[status] || PHASE_STATUS_COPY.calibrating;
}

function comingNextPhase(phase: PhaseLabel): string {
  const order = PHASE_ORDER_BY_GROUP[state.progress.protocolGroup];
  const index = order.indexOf(phase);
  const next = order[index + 1];
  return next ? PHASE_NAMES[next] : "Ongoing return checks";
}

function brainNetworkDiagram(): string {
  return `
    <img
      class="brain-network-image"
      src="${assetPath("attention-brain-network.png")}"
      alt="Brain systems linked to attention control, including fronto-parietal, prefrontal, and hippocampal medial temporal support."
      width="726"
      height="390"
    />
  `;
}

function blockTrainingCopy(block: MiniBlockPlan): { title: string; body: string; tip: string } {
  if (block.construct === "BSE") {
    return {
      title: "Binding Stability",
      body: "This block asks you to keep direction and colour linked, then choose the pair that appears most often.",
      tip: "Use the response labels. Practice is only to learn the display.",
    };
  }
  if (block.cells.some((cell) => cell.includes("rel"))) {
    return {
      title: "Relational Control",
      body: "This block asks you to judge how items relate to the centre, not just which way they point on the screen.",
      tip: "Out means away from the centre. In means towards the centre.",
    };
  }
  if (block.cells.some((cell) => cell.includes("flow"))) {
    return {
      title: "Motion Recovery",
      body: "This block keeps the same signal-control rule, but the display moves.",
      tip: "Look for the main motion signal, then respond from your clearest impression.",
    };
  }
  return {
    title: "Signal Control",
    body: "This block builds the basic rule: pick out the direction most items follow.",
    tip: "Accuracy before speed. The display will be brief.",
  };
}

function renderProgrammeRationale(): string {
  return `
    <section class="programme-rationale-card">
      <p class="ui-eyebrow">Why this programme?</p>
      <h2>Train the skill, then test whether it survives change.</h2>
      <div class="rationale-grid">
        <span>You are training controlled attention: picking out goal-relevant information from brief, noisy displays.</span>
        <span>The display changes on purpose. If the same rule survives a new format, that is stronger evidence than getting better at one screen.</span>
        <span>Later sessions mix formats and re-check after spacing because useful learning should return after time away.</span>
      </div>
      <p class="claims-note compact-note">Flexible attention helps you keep the right goal active under pressure, distraction, or uncertainty. This is training support, not a diagnosis or clinical treatment.</p>
    </section>
  `;
}

function phaseRationale(phase: PhaseLabel): string {
  if (phase === "P2_FLOW_ABS" || phase === "P2_ARROW_ABS" || phase === "P4_FLOW_REL" || phase === "P4_ARROW_REL") {
    return "The rule is the same, but the surface is different. This helps test whether you learned the underlying skill rather than memorising one display. A short dip is normal when the visual format changes.";
  }
  if (phase === "P5_MIXED") return "Formats now switch. This trains flexible attention: keeping the right goal active under pressure, distraction, or uncertainty.";
  if (phase === "P6_DELAYED") return "This re-check asks whether the trained skill returns after spacing, not only during same-day practice.";
  if (phase === "P3_ARROW_REL" || phase === "P3_FLOW_REL") return "This phase asks you to use the relationship to the centre, not just the surface direction. That makes the attention rule more flexible.";
  return "This phase builds your starting point for controlled attention: picking out goal-relevant information from brief, noisy displays.";
}

function sessionGoalCopy(phase: PhaseLabel): string {
  if (phase === "P5_MIXED") return "Switch formats while keeping the same goal active.";
  if (phase === "P6_DELAYED") return "Re-check whether the skill returns after time away.";
  if (phase === "P3_ARROW_REL" || phase === "P3_FLOW_REL") return "Use the relation to the centre, not just the surface direction.";
  if (phase === "P2_FLOW_ABS" || phase === "P2_ARROW_ABS" || phase === "P4_FLOW_REL" || phase === "P4_ARROW_REL") {
    return "Keep the same rule when the display changes.";
  }
  return "Pick out goal-relevant information from brief, noisy displays.";
}

function pendingTaskCopy(): { title: string; what: string; focus: string; why: string; startLabel: string } {
  const pending = state.pendingTaskStart;
  if (pending?.kind === "easier") {
    return {
      title: "Practice only",
      what: "You will practise the current display style without changing your progress path.",
      focus: "Choose the majority direction. Accuracy before speed.",
      why: "Practice keeps the habit moving on lower-energy days, but it does not advance phase or transfer scores.",
      startLabel: "Start practice",
    };
  }
  if (pending?.kind === "free") {
    const construct = pending.construct === "BSE" ? "Binding Stability" : "Signal Control";
    return {
      title: `${construct} practice`,
      what: "You will practise a selected format outside today's guided route.",
      focus: pending.construct === "BSE" ? "Keep direction and colour together." : "Choose the majority direction. Accuracy before speed.",
      why: "Free practice helps you learn a display, but it does not change your guided progress path.",
      startLabel: "Start practice",
    };
  }
  return {
    title: "Today's attention route",
    what: "You will complete the guided task chosen for your current learning curve.",
    focus: "Choose the majority direction. Accuracy before speed.",
    why: phaseRationale(state.progress.currentPhase),
    startLabel: "Start guided session",
  };
}

function renderPreTaskInstructions(): string {
  const copy = pendingTaskCopy();
  return shell(`
    ${appTabs(state.pendingTaskStart?.kind === "free" ? "train" : "today")}
    <section class="pre-task-screen">
      <div class="pre-task-hero">
        <p class="ui-eyebrow">Before you start</p>
        <h1>${escapeHtml(copy.title)}</h1>
      </div>
      <div class="pre-task-grid">
        <article class="instruction-card"><strong>What you'll do</strong><p>${escapeHtml(copy.what)}</p></article>
        <article class="instruction-card"><strong>What to focus on</strong><p>${escapeHtml(copy.focus)}</p></article>
        <article class="instruction-card"><strong>Why this matters</strong><p>${escapeHtml(copy.why)}</p></article>
      </div>
      <div class="wrapper-swap-card">
        <strong>Why the format changes</strong>
        <p>The rule is the same, but the surface is different. This helps test whether you learned the underlying skill rather than memorising one display.</p>
      </div>
      <div class="action-row">
        ${button(copy.startLabel, "start-pending-task")}
        ${button("Skip instructions", "start-pending-task", "secondary")}
      </div>
    </section>
  `);
}

function currentBlockTrialCount(): number {
  return state.sessionPlan?.miniBlocks[state.activeBlockIndex]?.trialCount || 20;
}

function practiceConditionForIndex(index: number): TrialCondition {
  if (index < 2) return { ratio: "5:0", exposureMs: 1000 };
  if (index < 5) return { ratio: "4:1", exposureMs: 1000 };
  return { ratio: "4:1", exposureMs: 700 };
}

function questionForTrial(trial: TrialDefinition): string {
  if (trial.construct === "BSE") return "Which direction-colour pair was most common?";
  if (trial.cellKey === "flow_rel") return "Was most motion expanding out or contracting in?";
  if (trial.cellKey === "flow_abs") return "Was most motion moving left or right?";
  if (trial.cellKey.includes("rel")) return "Were most arrows pointing out or in?";
  return "Were most arrows pointing left or right?";
}

function exampleTrialForBlock(block: MiniBlockPlan, phase: PhaseLabel): TrialDefinition {
  const cell = block.cells[0] || PHASE_CELL[phase];
  return generateTrial(
    `practice-preview-${phase}-${block.id}`,
    `preview-${block.id}`,
    0,
    block.construct,
    phase,
    cell,
    false,
    { ratio: "4:1", exposureMs: 1000 },
  );
}

function createPracticePlanForBlock(sourcePlan: SessionPlan, block: MiniBlockPlan): SessionPlan {
  const cells = block.cells.slice(0, 10);
  const practiceSeed = `${sourcePlan.sessionId}:practice:${block.id}:${Date.now()}`;
  const practiceBlock: MiniBlockPlan = {
    ...block,
    id: `practice-${block.id}`,
    label: `${block.label} practice`,
    instruction: "Practice uses the same display style as the next guided block. It does not decide your progress score.",
    cells,
    trialCount: cells.length,
    currentTrials: cells.filter((cell) => cell === PHASE_CELL[sourcePlan.phase]).length,
    referenceTrials: cells.filter((cell) => cell !== PHASE_CELL[sourcePlan.phase]).length,
  };
  return {
    ...sourcePlan,
    sessionId: practiceSeed,
    sessionNumber: 0,
    nominalBand: "guided practice",
    miniBlocks: [practiceBlock],
    trials: cells.map((cell, index) =>
      generateTrial(
        practiceSeed,
        practiceBlock.id,
        index,
        block.construct,
        sourcePlan.phase,
        cell,
        false,
        practiceConditionForIndex(index),
      ),
    ),
  };
}

function transferComponentCopy(label: string, status: string): string {
  if (status !== "available") {
    if (label === "Motion Recovery") return "After moving-pattern practice.";
    if (label === "Relation Recovery") return "After relative direction practice.";
    if (label === "Mixed Flexibility") return "After mixed-format practice.";
    return "After a later return check.";
  }
  if (label === "Motion Recovery") return "Static skill carrying into motion.";
  if (label === "Relation Recovery") return "Relative direction carrying into motion.";
  if (label === "Mixed Flexibility") return "Switching across formats.";
  return "Carry-over after time away.";
}

function staircaseKey(trial: TrialDefinition): string {
  return `${trial.construct}:${trial.cellKey}`;
}

function levelForTrial(trial: TrialDefinition): number {
  return state.staircaseLevels[staircaseKey(trial)] ?? INITIAL_STAIRCASE_LEVEL;
}

function clearStageTimer(): void {
  if (state.stageTimer !== null) {
    window.clearTimeout(state.stageTimer);
    state.stageTimer = null;
  }
}

function schedule(delayMs: number, callback: () => void): void {
  clearStageTimer();
  state.stageTimer = window.setTimeout(() => {
    state.stageTimer = null;
    callback();
  }, delayMs);
}

function setTaskStage(stage: TaskStage): void {
  state.taskStage = stage;
  render();
}

function renderAuth(): string {
  return shell(`
    <section class="auth-screen">
      <div class="auth-card">
        <img src="${assetPath("iqmindware-logo.png")}" alt="IQ Mindware" />
        <p class="ui-eyebrow">Beta access</p>
        <h1>Sign in to Attention Coach.</h1>
        <p class="ui-body">Use your email to access the free beta. Guided training data is saved to Supabase so your route and scores can build over time.</p>
        ${
          isSupabaseConfigured
            ? `<label>Email
                <input id="auth-email" type="email" autocomplete="email" placeholder="you@example.com" />
              </label>
              <div class="action-row">
                ${button(state.authBusy ? "Sending..." : "Send sign-in link", "send-login-link")}
              </div>`
            : `<p class="claims-note">Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY before inviting beta testers.</p>
              <div class="action-row">${button("Continue local demo", "nav-welcome")}</div>`
        }
        <p class="auth-message">${escapeHtml(state.authMessage || "You will receive a secure magic link. No paid account is required.")}</p>
        <p class="splash-claims">Training support only. Not a diagnosis, clinical treatment, brain measurement, or IQ score.</p>
      </div>
    </section>
  `);
}

function renderWelcome(): string {
  return shell(`
    <section class="splash-card">
      <div class="splash-network splash-network-top" aria-hidden="true"></div>
      <div class="splash-network splash-network-side" aria-hidden="true"></div>
      <section class="splash-brand">
        <img src="${assetPath("iqmindware-logo-spec.png")}" alt="IQ Mindware" class="splash-logo" />
        <img src="${assetPath("attention-coach-wordmark-v3.svg")}" alt="Attention Coach" class="splash-wordmark" />
        <div class="splash-title">
          <p>Train attention control and cognitive capacity.</p>
          <small>First step: quick setup, then today's guided attention route.</small>
        </div>
        <div class="splash-divider" aria-hidden="true"><span></span></div>
        <p class="splash-protocol">Based on the Trident-G transfer-training protocol&trade;</p>
        <div class="splash-rationale-grid">
          <article>
            <strong>Why train?</strong>
            <span>Improves focus, extracting signal from noise and flexible cognitive control.</span>
          </article>
          <article>
            <strong>How it trains</strong>
            <span>By training relational stimuli it targets the brain's executive control networks.</span>
          </article>
          <article>
            <strong>What changes over time</strong>
            <span>Later sessions check that your training is building real cognitive skills.</span>
          </article>
        </div>
        <p class="splash-claims">Training support only. Not a diagnosis, clinical treatment, brain measurement, or IQ score.</p>
      </section>
      <div class="splash-wave splash-wave-one" aria-hidden="true"></div>
      <div class="splash-wave splash-wave-two" aria-hidden="true"></div>
      <section class="splash-footer">
        ${button("Start today's route", "start-readiness")}
        ${button("Choose a practice game", "nav-free-play", "secondary")}
        <small class="splash-support-note">Setup first; the guided route takes about 5-10 minutes.</small>
        <button class="splash-link" data-action="nav-training-map">How it works</button>
        <a class="splash-site-link" href="https://www.iqmindware.com" target="_blank" rel="noreferrer">www.iqmindware.com</a>
      </section>
    </section>
  `, { splash: true });
}

function renderReadiness(): string {
  const readiness = state.progress.deviceReadiness;
  const screenTestCopy = state.readinessRunning
    ? "Screen test running. Keep this tab visible while the app checks frame stability."
    : "The check samples display frames for a few seconds before training starts.";
  return shell(`
    <section class="panel">
      <p class="ui-eyebrow">${readiness ? "Setup check complete" : "Quick setup"}</p>
      <h1>${readiness ? "Device check complete" : "Device check"}</h1>
      <p class="ui-body">${
        readiness
          ? "Your display timing and motion preview are ready for practice. If timing changes later, you can run the check again."
          : "A short check makes sure the arrows, moving dots, tap controls, and keyboard controls are ready for training. If timing is unstable, scores will be shown with lower confidence."
      }</p>
      <div class="flow-rationale-card">
        <strong>Why this step?</strong>
        <p>The coach uses brief displays and timing changes. Checking the device first keeps training feedback about your attention rather than about screen timing problems.</p>
      </div>
      ${
        readiness
          ? `<div class="readiness-grid">
              <span>Display rate</span><strong>${readiness.refreshRateHz.toFixed(1)} Hz</strong>
              <span>Score confidence</span><strong>${consumerStatus(readiness.quality === "poor" ? "timing_limited" : "moderate_confidence")}</strong>
              <span>Motion games</span><strong>${readiness.flowEligible ? "Ready" : "Timing limited"}</strong>
            </div>`
          : `<div class="preview-field screen-test-field ${state.readinessRunning ? "is-running" : ""}">
              <div class="screen-test-display" role="img" aria-label="Display timing check">
                <span aria-hidden="true"></span>
              </div>
              <strong>${state.readinessRunning ? "Checking frame stability" : "Display timing ready to check"}</strong>
              <p>${screenTestCopy}</p>
            </div>`
      }
      <div class="action-row">
        ${button(readiness ? "Continue setup" : state.readinessRunning ? "Checking..." : "Run readiness check", readiness ? "nav-tutorial" : "run-readiness")}
        ${readiness ? button("Run check again", "run-readiness", "secondary") : ""}
      </div>
    </section>
  `);
}

function renderTutorial(): string {
  return shell(`
    <section class="panel tutorial-grid direction-tutorial">
      <div class="direction-tutorial-copy">
        <p class="ui-eyebrow">Direction foundation</p>
        <h1>Pick the majority direction.</h1>
        <p class="ui-body">A brief display appears. Answer with the direction most items follow.</p>
      </div>
      <div class="direction-demo" role="img" aria-label="Example display where most items point right">
        <div class="direction-demo-grid" aria-hidden="true">
          <span>&rarr;</span>
          <span>&rarr;</span>
          <span>&larr;</span>
          <span>&rarr;</span>
          <span>&rarr;</span>
        </div>
        <strong>Most point right</strong>
      </div>
      <div class="tutorial-cues">
        <article class="instruction-card"><strong>Look</strong><p>Catch the overall direction.</p></article>
        <article class="instruction-card"><strong>Ignore</strong><p>Some items may disagree.</p></article>
        <article class="instruction-card"><strong>Answer</strong><p>Accuracy first, then speed.</p></article>
      </div>
      <div class="action-row">
        ${button("Start direction foundation", "begin-session")}
      </div>
    </section>
  `);
}

function renderToday(): string {
  const phase = state.progress.currentPhase;
  const returnCopy = hasReturnGap()
    ? `<p class="return-cue">Welcome back. Your guided route is ready; you can also choose an easier practice today.</p>`
    : "";
  return shell(`
    ${appTabs("today")}
    <section class="daily-loop-screen">
      <div class="today-action-card">
        <p class="ui-eyebrow">Today - Session ${state.progress.sessionNumber}</p>
        <h1>Today's attention route</h1>
        <p class="ui-body">Continue your guided programme. The app chooses today's task based on your current learning curve.</p>
        ${returnCopy}
        <div class="today-phase-grid">
          <div class="phase-tile is-blue">
            <span>What do I do today?</span>
            <strong>${PHASE_NAMES[phase]}</strong>
          </div>
          <div class="phase-tile is-green">
            <span>How long will it take?</span>
            <strong>6-8 minutes</strong>
          </div>
          <div class="phase-tile is-orange">
            <span>Why is it worth doing?</span>
            <strong>${escapeHtml(PHASE_GOAL_COPY[phase])}</strong>
          </div>
        </div>
        <div class="today-primary-actions">
          ${button("Start today's attention route", "start-guided-instructions")}
          <button class="secondary-link-button" data-action="start-easier-instructions">Practice only</button>
          <button class="secondary-link-button" data-action="nav-today-rationale">Why today?</button>
        </div>
      </div>
      <div class="today-plan-card">
        <div class="session-dots" aria-label="Recent completion dots">${completionDots()}</div>
        <div class="today-time-card">
          <span>Coming next</span>
          <strong>${escapeHtml(comingNextPhase(phase))}</strong>
        </div>
        <div class="action-row">
          ${button("Why this route?", "nav-today-rationale", "secondary")}
          ${button("Programme map", "nav-training-map", "ghost")}
        </div>
      </div>
    </section>
  `);
}

function renderTodayRationale(): string {
  const phase = state.progress.currentPhase;
  const status = phaseStatusCopy(phase, state.progress.phaseStatus);
  return shell(`
    ${appTabs("today")}
    <section class="daily-loop-screen today-rationale-screen">
      <div class="why-today-card">
        <div>
          <span class="section-icon is-purple">${miniIcon("target")}</span>
          <div>
            <p class="ui-eyebrow">Why this today?</p>
            <h2>${escapeHtml(PHASE_WHY_COPY[phase])}</h2>
          </div>
        </div>
        <p>${escapeHtml(phaseRationale(phase))}</p>
        <p class="learning-curve-note">New challenges appear when your current learning curve is stable. Current status: ${escapeHtml(status)}.</p>
      </div>
      ${renderProgrammeRationale()}
      <div class="action-row">
        ${button("Back to Today", "nav-today")}
        ${button("Start today's route", "start-guided-instructions", "secondary")}
        ${button("Training map", "nav-training-map", "ghost")}
      </div>
    </section>
  `);
}

function renderBreakPlan(): string {
  return shell(`
    ${appTabs("today")}
    <section class="daily-loop-screen break-plan-screen">
      <div class="today-action-card">
        <p class="ui-eyebrow">Recovery option</p>
        <h1>Take a proper break.</h1>
        <p class="ui-body">If today is a poor fit for training, the better route is to pause deliberately rather than force a hard session. This records continuity without changing your progress path.</p>
      </div>
      <div class="flow-rationale-card">
        <strong>Why this is allowed</strong>
        <p>Useful programmes preserve autonomy. Skipping a hard task on a poor-state day can protect trust and make returning tomorrow more likely.</p>
      </div>
      <div class="action-row">
        ${button("Mark break and return to Today", "complete-break")}
        ${button("Do practice instead", "start-easier-instructions", "secondary")}
      </div>
    </section>
  `);
}

const FREE_PLAY_CELLS: Array<{ cell: CellKey; label: string; detail: string }> = [
  { cell: "arrow_abs", label: "Direction Foundation", detail: "Static arrows and simple signal control." },
  { cell: "flow_abs", label: "Motion Foundation", detail: "Moving patterns with the same rule." },
  { cell: "arrow_rel", label: "Relation Foundation", detail: "Use relationships around the centre." },
  { cell: "flow_rel", label: "Motion Relations", detail: "Recover relational control in motion." },
  { cell: "mixed", label: "Mixed Practice", detail: "Formats switch from trial to trial." },
];

function renderFreePlay(): string {
  return shell(`
    ${appTabs("train")}
    <section class="train-screen no-scroll-screen">
      <figure class="train-protocol-strip">
        <img
          src="${assetPath("trident-g-far-transfer-protocol.png")}"
          alt="Trident G far transfer protocol pathway: start simple, change the display, keep the same rule, mix formats, and use the skill more widely."
          width="1433"
          height="213"
        />
      </figure>
      <div class="train-choice-grid">
        <article class="train-choice-card is-blue">
          <span>${miniIcon("rocket")}</span>
          <strong>Today's coached route</strong>
          <p>The main programme route. This is where guided progress is advanced.</p>
          ${button("Go to Today", "nav-today", "secondary")}
        </article>
        <article class="train-choice-card is-orange">
          <span>${miniIcon("target")}</span>
          <strong>Practice games</strong>
          <p>Try task formats without changing your coached pathway or progress status.</p>
          ${button("Choose a game", "nav-free-play-formats", "secondary")}
          <em>Practice only</em>
        </article>
        <article class="train-choice-card is-green">
          <span>${miniIcon("chart")}</span>
          <strong>Training map</strong>
          <p>See how the phases connect and why the display changes over time.</p>
          ${button("View map", "nav-training-map", "secondary")}
        </article>
      </div>
      <div class="free-play-copy">
        <strong>Coached route vs practice</strong>
        <span>Only the Today route advances the programme. Practice games are for familiarisation.</span>
      </div>
    </section>
  `);
}

function renderFreePlayFormats(): string {
  const card = (construct: Construct, cell: CellKey, label: string, detail: string) => `
    <button class="game-card" data-free-construct="${construct}" data-free-cell="${cell}">
      <span>${construct === "ACC" ? "Signal Control" : "Binding Stability"}</span>
      <strong>${escapeHtml(label)}</strong>
      <small>${escapeHtml(detail)}</small>
    </button>
  `;
  return shell(`
    ${appTabs("train")}
    <section class="train-screen free-play-formats-screen">
      <div class="train-header-card compact-page-header">
        <p class="ui-eyebrow">Free Play</p>
        <h1>Choose one format.</h1>
        <p class="ui-body">Practice only - this does not advance phase, WAP readiness, or transfer scores.</p>
      </div>
      <div class="game-grid compact-game-grid">
        ${FREE_PLAY_CELLS.map(({ cell, label, detail }) => card("ACC", cell, label, detail)).join("")}
        ${FREE_PLAY_CELLS.map(({ cell, label, detail }) => card("BSE", cell, label, detail)).join("")}
      </div>
    </section>
  `);
}

function navButton(label: string, action: string, active = false): string {
  return `<button class="${active ? "is-active" : ""}" data-action="${action}">${label}</button>`;
}

function renderBriefing(): string {
  const phase = state.progress.currentPhase;
  const intro = phaseIntro(phase);
  return shell(`
    <section class="panel session-overview-panel">
      <div class="session-overview-copy">
        <p class="ui-eyebrow">${NOMINAL_BANDS[phase]}</p>
        <h1>${intro.title}</h1>
        <p class="ui-body">${escapeHtml(sessionGoalCopy(phase))}</p>
      </div>
      <div class="session-transfer-strip" aria-label="Training flow">
        <span>${miniIcon("target")} Signal</span>
        <span>${miniIcon("transfer")} Change</span>
        <span>${miniIcon("chart")} Transfer</span>
      </div>
      <div class="flow-rationale-card">
        <strong>Why this helps</strong>
        <p>Train the rule, change the display, then check what survives.</p>
      </div>
      ${button("Preview first game", "begin-session")}
    </section>
  `);
}

function activeTrial(): TrialDefinition | null {
  if (!state.sessionPlan) return null;
  const block = state.sessionPlan.miniBlocks[state.activeBlockIndex];
  if (!block) return null;
  const baseTrial = state.sessionPlan.trials.find(
    (trial) => trial.miniBlockId === block.id && trial.trialIndex === state.activeTrialIndex,
  );
  if (!baseTrial) return null;
  return generateTrial(
    baseTrial.sessionId,
    baseTrial.miniBlockId,
    baseTrial.trialIndex,
    baseTrial.construct,
    baseTrial.phase,
    baseTrial.cellKey,
    baseTrial.isReferenceRecheck,
    state.progressionScored
      ? conditionForLevel(levelForTrial(baseTrial))
      : { ratio: baseTrial.ratio, exposureMs: baseTrial.exposureMsRequested },
  );
}

function renderTask(): string {
  const trial = activeTrial();
  const block = state.sessionPlan?.miniBlocks[state.activeBlockIndex];
  if (!trial || !block) return renderToday();
  const blockProgress = state.activeTrialIndex + 1;
  const blockTotal = currentBlockTrialCount();
  const responseEnabled = state.taskStage === "response";
  const prompt = responseEnabled
    ? trial.construct === "BSE"
      ? "Which direction-colour pair was most common?"
      : trial.cellKey === "flow_rel"
        ? "Was most motion expanding out or contracting in?"
        : trial.cellKey === "flow_abs"
          ? "Was most motion moving left or right?"
          : trial.cellKey.includes("rel")
            ? "Were most arrows pointing out or in?"
            : "Were most arrows pointing left or right?"
    : state.taskStage === "ready"
      ? "Focus on the centre."
      : "&nbsp;";
  return shell(`
    <section class="task-main">
      <div class="task-topline">
        <span>${escapeHtml(block.label)}</span>
        <span>${blockProgress} / ${blockTotal}</span>
      </div>
      <div class="task-progress"><span style="width:${((blockProgress - 1) / blockTotal) * 100}%"></span></div>
        <p class="ui-eyebrow">Block ${state.activeBlockIndex + 1} of ${state.sessionPlan?.miniBlocks.length || 1} - ${escapeHtml(block.label)}</p>
      <section class="task-stage is-${state.taskStage}">
        <div class="task-stage-copy"><p>${prompt}</p></div>
        ${stimulusSvg(trial, state.taskStage)}
        <div class="task-feedback" aria-live="polite">
          ${
            state.taskStage === "feedback"
              ? `<strong class="is-${state.feedback}">${state.feedback === "correct" ? "Correct" : "Not this time"}</strong>`
              : ""
          }
        </div>
      </section>
      <div class="response-grid task-responses">
        ${trial.responseOptions
          .map((option, index) => `<button class="response-button" data-response="${escapeHtml(option)}" ${responseEnabled ? "" : "disabled"}>${responseButtonContent(option, index, trial.responseOptions.length)}</button>`)
          .join("")}
      </div>
      <p class="task-footnote">${trial.construct === "BSE" ? "Keep direction and colour together." : "Choose the majority direction."} Click, tap, or use the keyboard.</p>
      <div class="task-controls">
        <button class="task-skip-button" data-action="pause-session"><span>II</span> Pause</button>
        <button class="task-skip-button" data-action="toggle-sound"><span>S</span> Sound ${state.soundOn ? "on" : "off"}</button>
        <button class="task-skip-button" data-action="end-block"><span>E</span> End</button>
      </div>
    </section>
  `, { task: true });
}

function arrowPolygonPoints(): string {
  return "-5,-4 5,0 -5,4 -2,0";
}

function vectorAngleDegrees(vector: { x: number; y: number }): number {
  return (Math.atan2(vector.y, vector.x) * 180) / Math.PI;
}

function diamondPolygonPoints(position: { x: number; y: number }): string {
  const size = 7.2;
  return `${position.x},${position.y - size} ${position.x + size},${position.y} ${position.x},${position.y + size} ${position.x - size},${position.y}`;
}

function masksSvg(trial: TrialDefinition): string {
  return trial.items.map((item) => `<polygon points="${diamondPolygonPoints(item.position)}" />`).join("");
}

function safeSvgId(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]/g, "-");
}

function renderFixation(): string {
  return `<g class="fixation"><line x1="46.5" y1="50" x2="53.5" y2="50"/><line x1="50" y1="46.5" x2="50" y2="53.5"/></g>`;
}

function formatNumber(value: number): string {
  return value.toFixed(2);
}

function renderOpticFlowApertures(trial: TrialDefinition, clipRootId: string): string {
  return opticFlowAperturesForTrial(trial)
    .map((aperture) => {
      const clipId = `${clipRootId}-ap-${aperture.index}`;
      const dots = aperture.dots
        .map(
          (dot) => `
            <circle class="optic-dot" cx="${formatNumber(dot.x)}" cy="${formatNumber(dot.y)}" r="${formatNumber(dot.r)}" fill="${dot.color}" opacity="${formatNumber(dot.opacity)}">
              <animate attributeName="cx" values="${formatNumber(dot.fromX)};${formatNumber(dot.toX)}" dur="${dot.durationMs}ms" begin="${dot.delayMs}ms" repeatCount="indefinite" />
              <animate attributeName="cy" values="${formatNumber(dot.fromY)};${formatNumber(dot.toY)}" dur="${dot.durationMs}ms" begin="${dot.delayMs}ms" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.14;${formatNumber(dot.opacity)};0.16" dur="${dot.durationMs}ms" begin="${dot.delayMs}ms" repeatCount="indefinite" />
            </circle>
          `,
        )
        .join("");
      return `
        <defs>
          <clipPath id="${clipId}">
            <circle cx="${formatNumber(aperture.x)}" cy="${formatNumber(aperture.y)}" r="${formatNumber(aperture.radius)}" />
          </clipPath>
        </defs>
        <circle class="optic-aperture-bg" cx="${formatNumber(aperture.x)}" cy="${formatNumber(aperture.y)}" r="${formatNumber(aperture.radius)}" />
        <g clip-path="url(#${clipId})">
          <g class="optic-dot-group">${dots}</g>
        </g>
        <circle class="optic-aperture-shell" cx="${formatNumber(aperture.x)}" cy="${formatNumber(aperture.y)}" r="${formatNumber(aperture.radius)}" stroke="${aperture.color}" />
      `;
    })
    .join("");
}

function renderOpticFlowMaskApertures(trial: TrialDefinition, clipRootId: string): string {
  return opticFlowMaskAperturesForTrial(trial)
    .map((aperture) => {
      const clipId = `${clipRootId}-mask-${aperture.index}`;
      const dots = aperture.dots
        .map((dot) => {
          const size = dot.r * 1.75;
          const points = `${formatNumber(dot.x)},${formatNumber(dot.y - size)} ${formatNumber(dot.x + size)},${formatNumber(dot.y)} ${formatNumber(dot.x)},${formatNumber(dot.y + size)} ${formatNumber(dot.x - size)},${formatNumber(dot.y)}`;
          return `<polygon class="optic-mask-dot" points="${points}" opacity="${formatNumber(dot.opacity)}" />`;
        })
        .join("");
      return `
        <defs>
          <clipPath id="${clipId}">
            <circle cx="${formatNumber(aperture.x)}" cy="${formatNumber(aperture.y)}" r="${formatNumber(aperture.radius)}" />
          </clipPath>
        </defs>
        <circle class="optic-aperture-bg" cx="${formatNumber(aperture.x)}" cy="${formatNumber(aperture.y)}" r="${formatNumber(aperture.radius)}" />
        <g clip-path="url(#${clipId})">
          <g class="optic-mask-field">${dots}</g>
        </g>
        <circle class="optic-aperture-shell is-mask" cx="${formatNumber(aperture.x)}" cy="${formatNumber(aperture.y)}" r="${formatNumber(aperture.radius)}" />
      `;
    })
    .join("");
}

function flowStimulusSvg(trial: TrialDefinition, stage: TaskStage): string {
  const showFixation = stage === "ready" || stage === "fixation" || stage === "stimulus";
  const clipId = `optic-clip-${safeSvgId(trial.id)}`;
  return `
    <div class="stimulus-wrap is-flow" aria-label="Brief optic-flow display">
      <svg class="stimulus-svg optic-task-svg" viewBox="0 0 100 100" role="img" aria-hidden="true">
        <circle cx="50" cy="50" r="34" class="orbit-line" />
        ${stage === "stimulus" ? `<g class="optic-apertures">${renderOpticFlowApertures(trial, clipId)}</g>` : ""}
        ${stage === "mask" ? `<g class="optic-apertures is-mask">${renderOpticFlowMaskApertures(trial, clipId)}</g>` : ""}
        ${showFixation ? renderFixation() : ""}
      </svg>
    </div>
  `;
}

function stimulusSvg(trial: TrialDefinition, stage: TaskStage): string {
  if (trial.cellKey.includes("flow")) return flowStimulusSvg(trial, stage);

  const showFixation = stage === "ready" || stage === "fixation" || stage === "stimulus";
  const showArrows = stage === "stimulus";
  const showMasks = stage === "mask";
  const arrows = trial.items
    .map((item) => {
      const angle = vectorAngleDegrees(item.vector);
      const color = item.color === "yellow" ? "#d9a900" : "currentColor";
      return `
        <g transform="translate(${item.position.x} ${item.position.y}) rotate(${angle})">
          <polygon points="${arrowPolygonPoints()}" fill="${color}" />
        </g>
      `;
    })
    .join("");
  return `
    <div class="stimulus-wrap ${trial.cellKey.includes("flow") ? "is-flow" : ""}" aria-label="Brief arrow display">
      <svg class="stimulus-svg" viewBox="0 0 100 100" role="img" aria-hidden="true">
        <circle cx="50" cy="50" r="34" class="orbit-line" />
        ${showArrows ? `<g class="stimulus-arrows">${arrows}</g>` : ""}
        ${showMasks ? `<g class="stimulus-masks">${masksSvg(trial)}</g>` : ""}
        ${showFixation || trial.cellKey.includes("rel") ? renderFixation() : ""}
      </svg>
    </div>
  `;
}

function labelForResponse(option: string): string {
  return option.replace("_", " + ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function relationForResponse(option: string): string {
  return option.split("_")[0];
}

function responseArrowForOption(option: string, index: number, optionCount: number): { symbol: string; key: string; label: string } {
  const relation = relationForResponse(option);
  if (optionCount === 2) {
    if (relation === "left") return { symbol: "&larr;", key: "ArrowLeft", label: "Left arrow key" };
    if (relation === "right") return { symbol: "&rarr;", key: "ArrowRight", label: "Right arrow key" };
    if (relation === "up" || relation === "out") return { symbol: "&uarr;", key: "ArrowUp", label: "Up arrow key" };
    if (relation === "down" || relation === "in") return { symbol: "&darr;", key: "ArrowDown", label: "Down arrow key" };
    return index === 0
      ? { symbol: "&larr;", key: "ArrowLeft", label: "Left arrow key" }
      : { symbol: "&rarr;", key: "ArrowRight", label: "Right arrow key" };
  }
  const arrows = [
    { symbol: "&larr;", key: "ArrowLeft", label: "Left arrow key" },
    { symbol: "&uarr;", key: "ArrowUp", label: "Up arrow key" },
    { symbol: "&darr;", key: "ArrowDown", label: "Down arrow key" },
    { symbol: "&rarr;", key: "ArrowRight", label: "Right arrow key" },
  ];
  return arrows[index] || { symbol: `${index + 1}`, key: `${index + 1}`, label: `Number ${index + 1} key` };
}

function responseButtonContent(option: string, index: number, optionCount: number): string {
  const label = labelForResponse(option);
  if (optionCount === 2 || optionCount === 4) {
    const key = responseArrowForOption(option, index, optionCount);
    return `<span>${label}</span><kbd aria-label="${key.label}">${key.symbol}</kbd>`;
  }
  return `<span>${label}</span><kbd>${index + 1}</kbd>`;
}

function renderBlockBreak(): string {
  const nextBlock = state.sessionPlan?.miniBlocks[state.activeBlockIndex];
  if (!nextBlock) return renderComplete();
  const copy = blockTrainingCopy(nextBlock);
  const example = exampleTrialForBlock(nextBlock, state.sessionPlan?.phase || state.progress.currentPhase);
  return shell(`
    <section class="panel block-briefing-panel game-preview-panel">
      <div class="game-preview-copy">
        <p class="ui-eyebrow">Next game</p>
        <h1>${escapeHtml(copy.title)}</h1>
        <p class="ui-body">${escapeHtml(copy.body)}</p>
      </div>
      <section class="practice-preview-card game-preview-card">
        <p class="task-preview-question">${escapeHtml(questionForTrial(example))}</p>
        ${stimulusSvg(example, "stimulus")}
        <div class="response-grid practice-answer-grid">
          ${example.responseOptions.map((option) => `<span class="practice-answer">${labelForResponse(option)}</span>`).join("")}
        </div>
      </section>
      <div class="block-practice-card">
        <strong>Optional practice</strong>
        <p>${escapeHtml(copy.tip)} Practice is short and does not change your progress score.</p>
      </div>
      <div class="action-row">
        ${button("Try short practice", "start-block-practice", "secondary")}
        ${button("Start training", "resume-block")}
      </div>
    </section>
  `);
}

function renderPracticeIntro(): string {
  const plan = state.sessionPlan;
  const block = plan?.miniBlocks[state.activeBlockIndex];
  if (!plan || !block) return renderToday();
  const copy = blockTrainingCopy(block);
  const example = exampleTrialForBlock(block, plan.phase);
  return shell(`
    <section class="panel practice-intro-panel">
      <div class="practice-intro-copy">
        <p class="ui-eyebrow">Practice block ${block.index}</p>
        <h1>${escapeHtml(copy.title)}</h1>
        <p class="ui-body">${escapeHtml(copy.body)}</p>
        <p class="ui-body">Practice is here to make the display understandable before the scored guided block begins.</p>
      </div>
      <section class="practice-preview-card">
        <p class="task-preview-question">${escapeHtml(questionForTrial(example))}</p>
        ${stimulusSvg(example, "stimulus")}
        <div class="response-grid practice-answer-grid">
          ${example.responseOptions.map((option) => `<span class="practice-answer">${labelForResponse(option)}</span>`).join("")}
        </div>
      </section>
      <section class="mini-steps practice-mini-steps">
        <span>${block.construct === "BSE" ? "Keep feature + direction linked" : "Pick out the signal"}</span>
        <span>Choose the majority</span>
        <span>Accuracy before speed</span>
      </section>
      <div class="ui-tip-card practice-tip-card">
        <span class="tip-symbol">i</span>
        <p>${escapeHtml(copy.tip)} You will get 10 practice trials before the guided block.</p>
      </div>
      <div class="action-row">
        ${button(`Start practice block ${block.index}`, "begin-block-practice")}
        ${button(`Begin training block ${block.index}`, "resume-block", "secondary")}
        ${button("Back to block options", "nav-block-options", "ghost")}
      </div>
    </section>
  `);
}

function renderComplete(): string {
  if (state.sessionMode === "free") {
    const correct = state.sessionResults.filter((result) => result.isCorrect).length;
    const total = state.sessionResults.length || 1;
    const isSetupPractice = state.sessionSource === "guided_practice";
    const isEasierPractice = state.sessionSource === "easier";
    const returnIndex = state.guidedReturn?.activeBlockIndex ?? 0;
    return shell(`
      <section class="panel">
        <p class="ui-eyebrow">${isSetupPractice ? "Practice block complete" : isEasierPractice ? "Easier practice complete" : "Practice complete"}</p>
        <h1>${isSetupPractice ? `Ready for training block ${returnIndex + 1}` : isEasierPractice ? "Practice kept the route warm" : `${Math.round((correct / total) * 100)}% correct`}</h1>
        <p class="ui-body">${
          isSetupPractice
            ? "Practice helped you learn this block's display. It did not decide your progress score."
            : isEasierPractice
              ? "This was unscored practice using your current display style. It did not change your session number, phase, WAP readiness, or transfer scores."
              : "This practice block used the same brief display, mask, response controls, and keyboard options as guided training. It did not change your guided learning path."
        }</p>
        <div class="action-row">
          ${isSetupPractice ? button(`Begin training block ${returnIndex + 1}`, "finish-practice-begin-block") : button("Choose another practice", "nav-free-play")}
          ${button(isSetupPractice ? "Back to block options" : "Return to Today", isSetupPractice ? "finish-practice-back-to-block" : "finish-complete", "secondary")}
        </div>
      </section>
    `);
  }
  if (state.progress.sessionNumber === 6 && state.progress.profileRevealSeen) {
    return shell(`
      <section class="panel result-panel">
        <p class="ui-eyebrow">Session 5 complete</p>
        <h1>Your pattern is becoming clearer.</h1>
        <p class="ui-body">The app now has enough sessions to start showing how your attention route is developing.</p>
        <div class="action-row">
          ${button("View progress", "nav-progress")}
          ${button("Back to Today", "finish-complete", "secondary")}
        </div>
      </section>
    `);
  }
  const phase = state.progress.currentPhase;
  const status = phaseStatusCopy(phase, state.progress.phaseStatus);
  return shell(`
    <section class="panel result-panel">
      <p class="ui-eyebrow">Session complete</p>
      <h1>Nice work today</h1>
      <div class="session-read-card is-blue">
        <span>Today's read</span>
        <strong>${escapeHtml(status)}</strong>
        <p>The app keeps the current phase until your learning curve is stable enough for the next challenge.</p>
      </div>
      <div class="result-grid">
        <div class="phase-tile is-green">
          <span>What changed</span>
          <strong>${escapeHtml(PHASE_WHY_COPY[phase])}</strong>
        </div>
        <div class="phase-tile is-orange">
          <span>What happens next</span>
          <strong>${escapeHtml(nextChallengeCopy(currentSnapshot().nextChallenge.state))}</strong>
        </div>
      </div>
      <div class="action-row">
        ${button("View progress", "nav-progress")}
        ${button("Done", "finish-complete", "secondary")}
      </div>
    </section>
  `);
}

function renderTransfer(): string {
  const snapshot = currentSnapshot();
  const components = [
    snapshot.transfer.motionRecovery,
    snapshot.transfer.relationRecovery,
    snapshot.transfer.mixedFlexibility,
    snapshot.transfer.returnStrength,
  ];
  return shell(`
    ${appTabs("progress")}
    <section class="dashboard transfer-dashboard">
      <div class="today-hero compact-hero">
        <p class="ui-eyebrow">Transfer</p>
        <h1>${snapshot.transfer.score === null ? "Calibrating" : `${snapshot.transfer.score} / 100`}</h1>
        <p>${snapshot.transfer.score === null ? "Building the baseline for carry-over." : "Skill carrying across changing display formats."}</p>
        <div class="action-row">${button("Training map", "nav-training-map", "secondary")}</div>
      </div>
      ${components
        .map(
          (component) => `
            <div class="score-card">
              <span>${component.label}</span>
              <strong>${component.score === null ? consumerStatus(component.status) : `${component.score} / 100`}</strong>
              <small>${transferComponentCopy(component.label, component.status)}</small>
            </div>
          `,
        )
        .join("")}
      <p class="claims-note compact-note">Training indicator only. Not a formal assessment or official IQ score.</p>
    </section>
  `);
}

function renderTrainingMap(): string {
  return shell(`
    <section class="training-map-screen">
      <figure class="transfer-model-figure training-map-figure">
        <img
          src="${assetPath("attention-transfer-model-v2.png")}"
          alt="Training map showing static arrows, moving patterns, relational formats, mixed practice, and a delayed return check."
          width="1537"
          height="1023"
        />
      </figure>
      <div class="training-map-note">
        <strong>Coached pathway</strong>
        <span>New challenges appear when your current learning curve is stable. This helps with cognitive skill transfer. Practice training can help you understand the training games.</span>
      </div>
      <div class="action-row">
        ${button("Why this design?", "nav-evidence")}
        ${button("Training hub", "nav-free-play", "secondary")}
      </div>
    </section>
  `);
}

function renderTransferModel(): string {
  return renderTrainingMap();
}

function renderEvidence(): string {
  return shell(`
    <section class="evidence-screen">
      <div class="evidence-hero">
        <p class="ui-eyebrow">Why this design?</p>
        <p>These systems are linked to attention control, flexible updating and working memory. This is rationale, not a brain measurement.</p>
      </div>
      <article class="evidence-visual-card evidence-brain-card">
        ${brainNetworkDiagram()}
        <p>Attention Coach is evidence-informed, not a clinical assessment. The design is based on attention-control training, adaptive visual-attention measurement, relational processing, motion-format transfer and delayed re-checks.</p>
      </article>
      <div class="evidence-principle-grid">
        <article class="evidence-principle-card is-blue">
          <span>${miniIcon("signal")}</span>
          <strong>Attention control</strong>
          <p>Practise selecting the important signal under time pressure.</p>
        </article>
        <article class="evidence-principle-card is-green">
          <span>${miniIcon("relational")}</span>
          <strong>Relational processing</strong>
          <p>Practise using relationships, not just surface features.</p>
        </article>
        <article class="evidence-principle-card is-purple">
          <span>${miniIcon("binding")}</span>
          <strong>Working memory support</strong>
          <p>Hold the rule active while the display format changes.</p>
        </article>
      </div>
      <div class="action-row">
        ${button("Back to training map", "nav-training-map")}
      </div>
    </section>
  `);
}

const PROOF_DOMAIN_LABELS: Record<ProofBenchmarkDomain, string> = {
  attention: "Attention Benchmark",
  working_memory: "Working Memory Benchmark",
  reasoning: "Matrix Reasoning Benchmark",
};

const PROOF_TIMEPOINT_LABELS: Record<ProofBenchmarkTimepoint, string> = {
  baseline: "Baseline",
  midpoint: "Midpoint",
  post: "Post",
  follow_up: "Follow-up",
  ad_hoc: "Ad hoc",
};

function proofEntriesFor(domain: ProofBenchmarkDomain): ProofBenchmarkEntry[] {
  return state.progress.proofBenchmarks
    .filter((entry) => entry.domain === domain)
    .sort((a, b) => a.completedAt.localeCompare(b.completedAt));
}

function proofSummaryCard(domain: ProofBenchmarkDomain): string {
  const entries = proofEntriesFor(domain);
  const latest = entries[entries.length - 1] || null;
  const baseline = entries.find((entry) => entry.timepoint === "baseline" && entry.score !== null) || null;
  const change = latest?.score !== null && latest?.score !== undefined && baseline?.score !== null && baseline?.score !== undefined
    ? latest.score - baseline.score
    : null;
  const shortLabels: Record<ProofBenchmarkDomain, string> = {
    attention: "Attention",
    working_memory: "Working memory",
    reasoning: "Reasoning",
  };
  return `
    <article class="proof-summary-card">
      <span>${shortLabels[domain]}</span>
      <strong>${latest?.score === null || latest?.score === undefined ? "No entry" : latest.score}</strong>
      <small>${latest ? `${escapeHtml(PROOF_TIMEPOINT_LABELS[latest.timepoint])} - ${escapeHtml(latest.confidence || "Confidence not set")}` : "Add when available."}</small>
      ${change === null ? "" : `<em>${change > 0 ? "+" : ""}${change} from baseline</em>`}
    </article>
  `;
}

function proofEntryRows(): string {
  if (state.progress.proofBenchmarks.length === 0) {
    return `<p class="empty-proof-note">No HRP Lab benchmark entries yet. Add scores manually when the external tests are available.</p>`;
  }
  return [...state.progress.proofBenchmarks]
    .sort((a, b) => b.completedAt.localeCompare(a.completedAt))
    .map((entry) => `
      <div class="proof-entry-row">
        <span>${escapeHtml(PROOF_DOMAIN_LABELS[entry.domain])}</span>
        <strong>${escapeHtml(entry.label)} - ${entry.score ?? "No score"}</strong>
        <small>${escapeHtml(PROOF_TIMEPOINT_LABELS[entry.timepoint])} - ${escapeHtml(entry.completedAt || "No date")} - ${escapeHtml(entry.confidence || "Confidence not set")}</small>
        <button data-proof-edit="${escapeHtml(entry.id)}">Edit</button>
        <button data-proof-delete="${escapeHtml(entry.id)}">Delete</button>
      </div>
    `).join("");
}

function optionTags<T extends string>(values: Record<T, string>, selected: T): string {
  return (Object.keys(values) as T[])
    .map((value) => `<option value="${value}" ${value === selected ? "selected" : ""}>${escapeHtml(values[value])}</option>`)
    .join("");
}

function renderProofForm(): string {
  const editing = state.progress.proofBenchmarks.find((entry) => entry.id === state.editingProofBenchmarkId) || null;
  return `
    <section class="proof-form-card">
      <div>
        <p class="ui-eyebrow">${editing ? "Edit benchmark" : "Manual entry"}</p>
        <h2>HRP Lab G Tests score</h2>
        <p>Use this for external benchmark scores when the HRP Lab G Tests app is available. Entries stay separate from Attention Coach training scores.</p>
      </div>
      <label>Domain
        <select id="proof-domain">
          ${optionTags(PROOF_DOMAIN_LABELS, editing?.domain || "attention")}
        </select>
      </label>
      <label>Test label
        <input id="proof-label" value="${escapeHtml(editing?.label || "")}" placeholder="ANT/SART, visual n-back, Matrix A-D, custom" />
      </label>
      <label>Timepoint
        <select id="proof-timepoint">
          ${optionTags(PROOF_TIMEPOINT_LABELS, editing?.timepoint || "baseline")}
        </select>
      </label>
      <label>Score
        <input id="proof-score" type="number" inputmode="decimal" value="${editing?.score ?? ""}" placeholder="Score" />
      </label>
      <label>Confidence
        <input id="proof-confidence" value="${escapeHtml(editing?.confidence || "")}" placeholder="Early read, reliable, measured cautiously" />
      </label>
      <label>Date
        <input id="proof-date" type="date" value="${escapeHtml(editing?.completedAt || todayIso())}" />
      </label>
      <label class="proof-notes">Notes
        <textarea id="proof-notes" placeholder="Optional notes">${escapeHtml(editing?.notes || "")}</textarea>
      </label>
      <div class="action-row proof-form-actions">
        ${button(editing ? "Save changes" : "Add benchmark entry", "save-proof-benchmark")}
        ${editing ? button("Cancel edit", "cancel-proof-edit", "secondary") : ""}
      </div>
    </section>
  `;
}

function renderProof(): string {
  return shell(`
    ${appTabs("proof")}
    <section class="proof-screen proof-overview-screen no-scroll-screen">
      <div class="proof-hero">
        <p class="ui-eyebrow">Proof</p>
        <h1>Valid external tests</h1>
        <p>Prove your gains with G Track's short psychometric tests.</p>
      </div>
      <section class="proof-summary-grid">
        ${proofSummaryCard("attention")}
        ${proofSummaryCard("working_memory")}
        ${proofSummaryCard("reasoning")}
      </section>
      <section class="overview-next-card proof-next-card">
        <p><strong>Manual records only.</strong> Use this for HRP Lab G Tests or other external benchmark scores.</p>
        <div class="dashboard-actions proof-actions">
          ${button("Add entry", "nav-proof-entry")}
          ${button("View entries", "nav-proof-entry", "secondary")}
        </div>
      </section>
    </section>
  `);
}

function renderProofEntry(): string {
  return shell(`
    ${appTabs("proof")}
    <section class="proof-screen proof-entry-screen">
      <div class="proof-hero compact-page-header">
        <p class="ui-eyebrow">Proof entry</p>
        <h1>Manual benchmark records.</h1>
        <p>Use this page for HRP Lab G Tests scores. Entries stay separate from training scores and are never labelled as IQ improvement.</p>
      </div>
      ${renderProofForm()}
      <section class="proof-entries-card">
        <strong>Benchmark entries</strong>
        ${proofEntryRows()}
      </section>
    </section>
  `);
}

function inputValue(id: string): string {
  return (appRoot.querySelector<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(`#${id}`)?.value || "").trim();
}

function saveProofBenchmarkEntry(): void {
  const domain = inputValue("proof-domain") as ProofBenchmarkDomain;
  const timepoint = inputValue("proof-timepoint") as ProofBenchmarkTimepoint;
  const scoreRaw = inputValue("proof-score");
  const score = scoreRaw === "" ? null : Number(scoreRaw);
  if (!PROOF_DOMAIN_LABELS[domain] || !PROOF_TIMEPOINT_LABELS[timepoint] || (scoreRaw !== "" && Number.isNaN(score))) return;
  const existing = state.progress.proofBenchmarks.find((entry) => entry.id === state.editingProofBenchmarkId);
  const entry: ProofBenchmarkEntry = {
    id: existing?.id || `proof-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    domain,
    timepoint,
    label: inputValue("proof-label") || PROOF_DOMAIN_LABELS[domain],
    score,
    confidence: inputValue("proof-confidence"),
    source: "HRP Lab G Tests",
    completedAt: inputValue("proof-date") || todayIso(),
    notes: inputValue("proof-notes"),
  };
  state.progress = {
    ...state.progress,
    proofBenchmarks: existing
      ? state.progress.proofBenchmarks.map((item) => (item.id === existing.id ? entry : item))
      : [...state.progress.proofBenchmarks, entry],
  };
  state.editingProofBenchmarkId = null;
  persistProgress();
  void saveProofBenchmark(entry).catch((error) => {
    console.warn("Proof benchmark was not synced.", error);
    markSync("error", "Benchmark entry could not be synced.");
  });
  go("proof-entry", { replace: true });
}

const DEMO_PROGRESS_DASHBOARD_MODEL = {
  overallScore: 108,
  overallChange: 8,
  transferReadiness: 67,
  confidence: "Becoming reliable",
  activeGuidedFocus: "Transfer Flexibility",
  currentPhase: "Mixed Mastery",
  comingNext: "Return Check",
  whyFocus: "The app is checking whether your skill stays stable when formats switch.",
  pathwayNote: "New challenges appear when your current learning curve is stable.",
  lowDataStates: {
    baseline: "Building your starting point",
    transfer: "Transfer Readiness: Calibrating",
    early: "Confidence: Early read",
    cautious: "Confidence: Measured cautiously",
    variable: "Confidence: Variable lately",
    baselineCopy: "Complete a few more guided sessions so we can compare future progress with your baseline.",
    transferCopy: "This appears after the app has tested changed formats, switching and re-checks.",
  },
  trend: [
    { session: "S1", score: 100, transfer: 88 },
    { session: "S3", score: 107, transfer: 86 },
    { session: "S5", score: 111, transfer: 91 },
    { session: "S7", score: 117, transfer: 97 },
    { session: "S9", score: 118, transfer: 101 },
  ],
  skills: [
    {
      label: "Signal Control",
      subtitle: "Pick out the important cue under time pressure.",
      score: 112,
      change: 12,
      status: "Strong",
      confidence: "Reliable",
      tone: "blue",
      icon: "signal",
    },
    {
      label: "Relational Control",
      subtitle: "Use the pattern's relationship, not just its surface direction.",
      score: 106,
      change: 6,
      status: "Building",
      confidence: "Becoming reliable",
      tone: "purple",
      icon: "relational",
    },
    {
      label: "Binding Stability",
      subtitle: "Keep the right relation linked to the right feature as the display changes.",
      score: 98,
      change: -2,
      status: "Watch",
      confidence: "Becoming reliable",
      tone: "teal",
      icon: "binding",
    },
    {
      label: "Transfer Flexibility",
      subtitle: "Recover the same skill across changing formats.",
      score: 94,
      change: -6,
      status: "Focus here",
      confidence: "Reliable",
      tone: "orange",
      icon: "transfer",
    },
    {
      label: "Return Strength",
      subtitle: "Bring the skill back after time away.",
      score: 103,
      change: 3,
      status: "Building",
      confidence: "Early read",
      tone: "green",
      icon: "return",
    },
  ],
  transferDetails: [
    {
      label: "Motion Recovery",
      shortLabel: "Motion",
      score: 64,
      change: 12,
      helper: "How well the skill carries from static displays into moving patterns.",
      tone: "teal",
    },
    {
      label: "Relational Recovery",
      shortLabel: "Relation",
      score: 59,
      change: 8,
      helper: "How well the relative-direction skill carries into the motion format.",
      tone: "purple",
    },
    {
      label: "Flexible Switching",
      shortLabel: "Switching",
      score: 51,
      change: 4,
      helper: "How well you stay stable when formats alternate.",
      tone: "orange",
    },
    {
      label: "Return Strength",
      shortLabel: "Return",
      score: 62,
      change: 10,
      helper: "How well the skill returns after spacing or re-checks.",
      tone: "green",
    },
  ],
} as const;

type DashboardSkillModel = {
  label: string;
  subtitle: string;
  score: number | null;
  change: number | null;
  status: string;
  confidence: string;
  tone: string;
  icon: string;
};

type DashboardTransferModel = {
  label: string;
  shortLabel: string;
  score: number | null;
  change: number | null;
  helper: string;
  tone: string;
};

type ProgressDashboardPresentationModel = {
  overallScore: number | null;
  overallChange: number | null;
  transferReadiness: number | null;
  confidence: string;
  trend: Array<{ session: string; score: number | null; transfer: number | null }>;
  skills: DashboardSkillModel[];
  transferDetails: DashboardTransferModel[];
};

function evidenceFor(construct: Construct, cellKey: CellKey): CellEvidence | null {
  return state.progress.evidence.find((item) => item.construct === construct && item.cellKey === cellKey) || null;
}

function scoreForEvidence(construct: Construct, cellKey: CellKey): number | null {
  return trainingScoreFromBits(evidenceFor(construct, cellKey)?.currentCapacityBps ?? null);
}

function averageScore(values: Array<number | null>): number | null {
  const available = values.filter((value): value is number => value !== null);
  if (available.length === 0) return null;
  return Math.round(available.reduce((total, value) => total + value, 0) / available.length);
}

function trainingScoreFromBits(bitsPerSec: number | null): number | null {
  if (bitsPerSec === null) return null;
  return Math.round(85 + bitsPerSec * 5);
}

function changeFromStart(score: number | null): number | null {
  return score === null ? null : score - 100;
}

function statusForScore(score: number | null, focus = false): string {
  if (score === null) return "Calibrating";
  if (focus) return "Focus here";
  if (score >= 110) return "Strong";
  if (score < 100) return "Watch";
  return "Building";
}

function confidenceForEvidence(evidence: CellEvidence | null): string {
  if (!evidence || evidence.validTrials < 80) return "";
  if (evidence.timingQuality === "poor") return "Measured cautiously";
  if (evidence.validTrials < 240) return "Early read";
  return evidence.validTrials >= 360 ? "Reliable" : "Becoming reliable";
}

function progressDashboardPresentationModel(): ProgressDashboardPresentationModel {
  const snapshot = state.progress.latestSnapshot;
  const signalScore = scoreForEvidence("ACC", "arrow_abs");
  const relationalScore = scoreForEvidence("ACC", "arrow_rel");
  const activeCell = PHASE_CELL[state.progress.currentPhase];
  const bindingScore =
    scoreForEvidence("BSE", activeCell) ||
    scoreForEvidence("BSE", "arrow_abs") ||
    scoreForEvidence("BSE", "flow_abs") ||
    scoreForEvidence("BSE", "arrow_rel") ||
    scoreForEvidence("BSE", "flow_rel");
  const transferFlexScore = state.progress.currentPhase === "P5_MIXED" || state.progress.currentPhase === "P6_DELAYED"
    ? averageScore([
        scoreForEvidence("ACC", "arrow_abs"),
        scoreForEvidence("ACC", "flow_abs"),
        scoreForEvidence("ACC", "arrow_rel"),
        scoreForEvidence("ACC", "flow_rel"),
      ])
    : null;
  const returnScore = snapshot?.transfer.returnStrength.score ?? null;
  const overallScore = snapshot?.attentionControl.trainingScore ?? null;
  const transferReadiness = snapshot?.transfer.score ?? null;
  return {
    overallScore,
    overallChange: changeFromStart(overallScore),
    transferReadiness,
    confidence: confidenceForEvidence(state.progress.evidence.find((item) => item.construct === "ACC") || null),
    trend: [
      { session: "Start", score: overallScore === null ? null : 100, transfer: null },
      { session: `S${Math.max(1, state.progress.sessionNumber - 1)}`, score: overallScore, transfer: transferReadiness },
    ],
    skills: [
      {
        label: "Signal Control",
        subtitle: "Pick out the important cue under time pressure.",
        score: signalScore,
        change: changeFromStart(signalScore),
        status: statusForScore(signalScore),
        confidence: confidenceForEvidence(evidenceFor("ACC", "arrow_abs")),
        tone: "blue",
        icon: "signal",
      },
      {
        label: "Relational Control",
        subtitle: "Use the pattern's relationship, not just its surface direction.",
        score: relationalScore,
        change: changeFromStart(relationalScore),
        status: statusForScore(relationalScore),
        confidence: confidenceForEvidence(evidenceFor("ACC", "arrow_rel")),
        tone: "purple",
        icon: "relational",
      },
      {
        label: "Binding Stability",
        subtitle: "Keep the right relation linked to the right feature as the display changes.",
        score: bindingScore,
        change: changeFromStart(bindingScore),
        status: statusForScore(bindingScore),
        confidence:
          confidenceForEvidence(evidenceFor("BSE", activeCell)) ||
          confidenceForEvidence(state.progress.evidence.find((item) => item.construct === "BSE") || null),
        tone: "teal",
        icon: "binding",
      },
      {
        label: "Transfer Flexibility",
        subtitle: "Recover the same skill across changing formats.",
        score: transferFlexScore,
        change: changeFromStart(transferFlexScore),
        status: statusForScore(transferFlexScore, state.progress.currentPhase === "P5_MIXED"),
        confidence: confidenceForEvidence(evidenceFor("ACC", "mixed")),
        tone: "orange",
        icon: "transfer",
      },
      {
        label: "Return Strength",
        subtitle: "Bring the skill back after time away.",
        score: returnScore,
        change: changeFromStart(returnScore),
        status: statusForScore(returnScore),
        confidence: snapshot?.transfer.returnStrength.score === null ? "" : consumerStatus(snapshot?.transfer.returnStrength.confidence),
        tone: "green",
        icon: "return",
      },
    ],
    transferDetails: [
      {
        label: "Motion Recovery",
        shortLabel: "Motion",
        score: snapshot?.transfer.motionRecovery.score ?? null,
        change: null,
        helper: "How well the skill carries from static displays into moving patterns.",
        tone: "teal",
      },
      {
        label: "Relational Recovery",
        shortLabel: "Relation",
        score: snapshot?.transfer.relationRecovery.score ?? null,
        change: null,
        helper: "How well the relative-direction skill carries into the motion format.",
        tone: "purple",
      },
      {
        label: "Flexible Switching",
        shortLabel: "Switching",
        score: snapshot?.transfer.mixedFlexibility.score ?? null,
        change: null,
        helper: "How well you stay stable when formats alternate.",
        tone: "orange",
      },
      {
        label: "Return Strength",
        shortLabel: "Return",
        score: snapshot?.transfer.returnStrength.score ?? null,
        change: null,
        helper: "How well the skill returns after spacing or re-checks.",
        tone: "green",
      },
    ],
  };
}

function progressDashboardSegmentedControl(active: ProgressDashboardMode): string {
  const scoreDetailReady = canShowScoreDetail();
  return `
    <div class="progress-segmented" aria-label="Progress dashboard view">
      <button class="${active === "overview" ? "is-active" : ""}" data-action="nav-progress-overview">
        <span class="segment-icon" aria-hidden="true">${miniIcon("chart")}</span>
        Overview
      </button>
      <button class="${active === "detail" ? "is-active" : ""}" data-action="${scoreDetailReady ? "nav-progress-detail" : "nav-progress-overview"}">
        <span class="segment-icon" aria-hidden="true">${miniIcon("list")}</span>
        ${scoreDetailReady ? "Score Detail" : "Unlocks after S5"}
      </button>
    </div>
  `;
}

function canShowScoreDetail(): boolean {
  return state.progress.sessionNumber > 5 || state.progress.profileRevealSeen;
}

function signedValue(value: number): string {
  return value > 0 ? `+${value}` : `${value}`;
}

function dashboardScore(value: number | null): string {
  return value === null ? "" : `${value}`;
}

function dashboardChange(value: number | null): string {
  return value === null ? "" : signedValue(value);
}

function dashboardToneClass(tone: string): string {
  return `is-${tone}`;
}

function statusClass(status: string): string {
  return `is-${status.toLowerCase().replaceAll(" ", "-")}`;
}

function clampPercent(value: number): number {
  return Math.max(0, Math.min(100, value));
}

function scorePosition(score: number): number {
  return clampPercent(((score - 80) / 50) * 100);
}

function miniIcon(name: string): string {
  const common = `viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"`;
  const icons: Record<string, string> = {
    chart: `<svg ${common}><path d="M4 19h16"/><path d="M7 16l3-4 4 2 4-7"/><path d="M18 7h2v2"/></svg>`,
    list: `<svg ${common}><path d="M8 6h12"/><path d="M8 12h12"/><path d="M8 18h12"/><path d="M4 6h.01"/><path d="M4 12h.01"/><path d="M4 18h.01"/></svg>`,
    signal: `<svg ${common}><path d="M4 12c4-5 12-5 16 0"/><path d="M7 12c3-3 7-3 10 0"/><circle cx="12" cy="12" r="2.8"/></svg>`,
    relational: `<svg ${common}><rect x="4" y="9" width="7" height="7" rx="1"/><rect x="13" y="5" width="7" height="7" rx="1"/><path d="M11 12h2"/><path d="M8 9V6h5"/></svg>`,
    binding: `<svg ${common}><circle cx="7" cy="17" r="2"/><circle cx="17" cy="7" r="2"/><path d="M8.5 15.5l7-7"/><path d="M13 7h2"/><path d="M17 9v2"/></svg>`,
    transfer: `<svg ${common}><path d="M7 7h10l-3-3"/><path d="M17 7l-3 3"/><path d="M17 17H7l3 3"/><path d="M7 17l3-3"/></svg>`,
    return: `<svg ${common}><path d="M19 12a7 7 0 1 1-2.05-4.95"/><path d="M19 5v6h-6"/></svg>`,
    target: `<svg ${common}><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/><path d="M12 2v3"/><path d="M22 12h-3"/><path d="M12 22v-3"/><path d="M2 12h3"/></svg>`,
    shield: `<svg ${common}><path d="M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6l7-3z"/><path d="M9 12l2 2 4-5"/></svg>`,
    pathway: `<svg ${common}><path d="M5 17c2-6 12 0 14-8"/><circle cx="5" cy="17" r="2"/><circle cx="19" cy="9" r="2"/></svg>`,
    flag: `<svg ${common}><path d="M6 21V4"/><path d="M6 4h11l-2 4 2 4H6"/></svg>`,
    rocket: `<svg ${common}><path d="M5 19c3-1 6-3 8-6s3-6 6-8c-1 4-3 7-6 10s-6 5-10 6c1-1 1-2 2-2z"/><path d="M9 15l-2 2"/><path d="M14 10l2-2"/></svg>`,
  };
  return icons[name] || icons.chart;
}

function trendChartSvg(points: ProgressDashboardPresentationModel["trend"]): string {
  const width = 420;
  const height = 150;
  const left = 38;
  const right = 14;
  const top = 14;
  const bottom = 28;
  const plotWidth = width - left - right;
  const plotHeight = height - top - bottom;
  const yFor = (value: number) => top + ((130 - value) / 60) * plotHeight;
  const xFor = (index: number) => left + (index / (points.length - 1)) * plotWidth;
  const pathFor = (key: "score" | "transfer") => {
    const available = points
      .map((point, index) => ({ value: point[key], index }))
      .filter((point): point is { value: number; index: number } => point.value !== null);
    return available.map((point, pathIndex) => `${pathIndex === 0 ? "M" : "L"} ${xFor(point.index).toFixed(1)} ${yFor(point.value).toFixed(1)}`).join(" ");
  };
  const dotsFor = (key: "score" | "transfer", className: string) =>
    points
      .map((point, index) => ({ value: point[key], index }))
      .filter((point): point is { value: number; index: number } => point.value !== null)
      .map((point) => `<circle class="${className}" cx="${xFor(point.index).toFixed(1)}" cy="${yFor(point.value).toFixed(1)}" r="3.4" />`)
      .join("");
  const xLabels = points
    .map((point, index) => `<text x="${xFor(index).toFixed(1)}" y="${height - 7}" text-anchor="middle">${point.session}</text>`)
    .join("");
  const grid = [70, 100, 130]
    .map(
      (value) => `
        <line class="${value === 100 ? "baseline" : "grid"}" x1="${left}" x2="${width - right}" y1="${yFor(value).toFixed(1)}" y2="${yFor(value).toFixed(1)}" />
        <text class="axis-label" x="8" y="${(yFor(value) + 4).toFixed(1)}">${value}</text>
      `,
    )
    .join("");
  const scorePath = pathFor("score");
  const transferPath = pathFor("transfer");
  return `
    <svg class="dashboard-trend-svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="Overall Attention Score and Transfer Readiness trend">
      ${grid}
      ${scorePath ? `<path class="score-line" d="${scorePath}" />` : ""}
      ${transferPath ? `<path class="transfer-line" d="${transferPath}" />` : ""}
      ${dotsFor("score", "score-dot")}
      ${dotsFor("transfer", "transfer-dot")}
      <line class="axis" x1="${left}" x2="${width - right}" y1="${height - bottom}" y2="${height - bottom}" />
      <line class="axis" x1="${left}" x2="${left}" y1="${top}" y2="${height - bottom}" />
      ${xLabels}
    </svg>
  `;
}

function confidenceDot(tone: string, label: string): string {
  if (!label) return "";
  return `<span class="confidence-dot ${dashboardToneClass(tone)}" aria-hidden="true"></span><span>${escapeHtml(label)}</span>`;
}

function statusChip(status: string, tone: string): string {
  return `<span class="status-chip ${statusClass(status)} ${dashboardToneClass(tone)}">${escapeHtml(status)}</span>`;
}

function skillScale(score: number | null, tone: string): string {
  const now = score === null ? null : scorePosition(score);
  const start = scorePosition(100);
  return `
    <div class="score-scale" aria-label="Score scale from 80 to 130">
      <div class="score-scale-labels">
        <span>80</span><span>90</span><span>100</span><span>110</span><span>120</span><span>130</span>
      </div>
      <div class="score-scale-track">
        <span class="score-scale-start" style="left:${start}%"></span>
        ${now === null ? "" : `<span class="score-scale-now ${dashboardToneClass(tone)}" style="left:${now}%"></span>`}
      </div>
      <div class="score-scale-notes">
        <span style="left:${start}%">Start</span>
        ${now === null ? "" : `<span style="left:${now}%">Now</span>`}
      </div>
    </div>
  `;
}

function renderDashboardHeader(title: string, mode: ProgressDashboardMode, note: string): string {
  return `
    <div class="dashboard-header" aria-label="${escapeHtml(title)} - ${escapeHtml(note)}">
      ${progressDashboardSegmentedControl(mode)}
    </div>
  `;
}

function renderOverviewSkillRows(model: ProgressDashboardPresentationModel): string {
  return model.skills
    .map(
      (skill, index) => `
        <div class="dashboard-skill-row ${dashboardToneClass(skill.tone)}">
          <span class="skill-number ${dashboardToneClass(skill.tone)}">${index + 1}</span>
          <span class="skill-icon ${dashboardToneClass(skill.tone)}" aria-hidden="true">${miniIcon(skill.icon)}</span>
          <span class="skill-copy">
            <strong>${escapeHtml(skill.label)}</strong>
          </span>
          <strong class="skill-score ${dashboardToneClass(skill.tone)}">${dashboardScore(skill.score)}</strong>
          <strong class="skill-change ${skill.change === null || skill.change >= 0 ? "is-up" : "is-down"}">${dashboardChange(skill.change)}</strong>
          ${statusChip(skill.status, skill.tone)}
          <span class="skill-confidence">${confidenceDot(skill.tone, skill.confidence)}</span>
        </div>
      `,
    )
    .join("");
}

function renderEarlyProgressDashboard(): string {
  return `
    <section class="dashboard-screen dashboard-overview">
      ${renderDashboardHeader("Progress", "overview", "Building continuity before score detail unlocks.")}
      <section class="continuity-card">
        <div>
          <span>Guided continuity</span>
          <strong>Session ${state.progress.sessionNumber}</strong>
          <small>${state.progress.completions.length} route${state.progress.completions.length === 1 ? "" : "s"} completed</small>
        </div>
        <div class="session-dots">${completionDots()}</div>
        <p>Complete five guided sessions before the app turns score detail into a stable profile. For now, the goal is consistency, fit, and a clear learning curve.</p>
      </section>
      <section class="early-progress-grid">
        <article class="early-progress-card is-blue">
          <span>What is building?</span>
          <strong>Your starting point</strong>
          <p>The coach is collecting repeated sessions so later changes can be interpreted with more confidence.</p>
        </article>
        <article class="early-progress-card is-green">
          <span>Today route</span>
          <strong>Guided training</strong>
          <p>Use the Today screen to start the current guided route, or choose easier practice if today is a poor fit.</p>
        </article>
        <article class="early-progress-card is-orange">
          <span>Profile reveal</span>
          <strong>${Math.max(0, 5 - Math.max(0, state.progress.sessionNumber - 1))} guided session${Math.max(0, 5 - Math.max(0, state.progress.sessionNumber - 1)) === 1 ? "" : "s"} to go</strong>
          <p>Your pattern becomes clearer after session 5. Score detail stays secondary until then.</p>
        </article>
      </section>
      <section class="overview-next-card">
        <p><strong>Next step:</strong> Continue the guided route from Today, or choose an easier practice option without changing your progress path.</p>
        <div class="dashboard-actions">
          ${button("Guided Session", "start-guided-instructions")}
          ${button("Practice only", "start-easier-instructions", "secondary")}
          ${button("Proof", "nav-proof", "ghost")}
        </div>
      </section>
    </section>
  `;
}

function renderOverviewDashboard(): string {
  if (!canShowScoreDetail()) return renderEarlyProgressDashboard();
  const model = progressDashboardPresentationModel();
  return `
    <section class="dashboard-screen dashboard-overview">
      ${renderDashboardHeader("Progress", "overview", "Track what is changing and what to train next.")}
      <section class="continuity-card">
        <div>
          <span>Guided continuity</span>
          <strong>Session ${state.progress.sessionNumber}</strong>
          <small>${state.progress.completions.length} route${state.progress.completions.length === 1 ? "" : "s"} completed</small>
        </div>
        <div class="session-dots">${completionDots()}</div>
        <p>${state.progress.sessionNumber > 5 ? "Your pattern is becoming clearer. The app is showing how your attention route is developing." : "Complete a few guided sessions so the app can build a steadier picture."}</p>
      </section>
      <section class="overview-summary-card">
        <div class="overall-score-panel">
          <span>Overall Attention Score</span>
          <strong>${dashboardScore(model.overallScore)}</strong>
          <small class="positive-change">${model.overallChange === null ? "" : `${dashboardChange(model.overallChange)} since your starting point`}</small>
          <em>Starting point = 100</em>
        </div>
        <div class="summary-metrics-panel">
          <div>${miniIcon("target")}<span><strong>Transfer Readiness</strong><small>${model.transferReadiness === null ? "" : `${model.transferReadiness} / 100`}</small></span></div>
          <div>${miniIcon("shield")}<span><strong>Confidence</strong><small>${escapeHtml(model.confidence)}</small></span></div>
        </div>
        <div class="overview-trend">
          <div class="chart-heading">
            <strong>Overall change</strong>
            <span><i class="legend-line score"></i>Score</span>
            <span><i class="legend-line transfer"></i>Transfer</span>
          </div>
          ${trendChartSvg(model.trend)}
        </div>
      </section>
      <section class="skills-overview-card">
        <div class="skills-table-heading">
          <span>Skill</span><span>Score</span><span>Change</span><span>Status</span><span>Confidence</span>
        </div>
        ${renderOverviewSkillRows(model)}
      </section>
      <section class="overview-next-card">
        <p><strong>Guided progression:</strong> New challenges appear when your current learning curve is stable. Independent benchmark checks live in Proof and stay separate from training scores.</p>
        <div class="dashboard-actions">
          ${button("Guided Session", "start-next-guided-session")}
          ${button("Free Play", "nav-free-play", "secondary")}
          ${button("Proof", "nav-proof", "ghost")}
        </div>
      </section>
    </section>
  `;
}

function renderDetailSkillRows(model: ProgressDashboardPresentationModel): string {
  return model.skills
    .map(
      (skill, index) => `
        <div class="detail-skill-row ${dashboardToneClass(skill.tone)}" title="${escapeHtml(skill.subtitle)}">
          <span class="skill-number ${dashboardToneClass(skill.tone)}">${index + 1}</span>
          <span class="skill-icon ${dashboardToneClass(skill.tone)}" aria-hidden="true">${miniIcon(skill.icon)}</span>
          <span class="detail-skill-copy">
            <strong>${escapeHtml(skill.label)}</strong>
          </span>
          <strong class="skill-score ${dashboardToneClass(skill.tone)}">${dashboardScore(skill.score)}</strong>
          <strong class="skill-change ${skill.change === null || skill.change >= 0 ? "is-up" : "is-down"}">${dashboardChange(skill.change)}</strong>
          ${skillScale(skill.score, skill.tone)}
          <span class="detail-status">${statusChip(skill.status, skill.tone)}<small>${confidenceDot(skill.tone, skill.confidence)}</small></span>
        </div>
      `,
    )
    .join("");
}

function renderTransferDetailCards(model: ProgressDashboardPresentationModel): string {
  return model.transferDetails
    .map(
      (item) => `
        <div class="transfer-mini-card ${dashboardToneClass(item.tone)}" title="${escapeHtml(item.helper)}">
          <span>${escapeHtml(item.label)}</span>
          <strong>${item.score === null ? "" : `${item.score}`}<small>${item.score === null ? "" : "/100"}</small></strong>
          <em>${dashboardChange(item.change)}</em>
        </div>
      `,
    )
    .join("");
}

function renderScoreDetailDashboard(): string {
  const model = progressDashboardPresentationModel();
  return `
    <section class="dashboard-screen dashboard-detail">
      ${renderDashboardHeader("Score Detail", "detail", "Scores are relative to your own starting point.")}
      <section class="score-explainer-strip">
        <span><i class="marker hollow"></i>100 = your starting point</span>
        <span><i class="marker blue"></i>Above 100 = above your start</span>
        <span><i class="marker orange"></i>Below 100 = currently below your start</span>
      </section>
      <section class="detail-skills-card">
        ${renderDetailSkillRows(model)}
      </section>
      <section class="transfer-detail-strip">
        <div class="transfer-detail-heading">
          <strong>Transfer details</strong>
          <span>Changed formats, switching and re-checks.</span>
        </div>
        <div class="transfer-mini-grid">${renderTransferDetailCards(model)}</div>
      </section>
      <section class="score-legend-strip">
        <em>These scores show change from your own starting point, not an IQ score.</em>
        ${button("How scores work", "nav-evidence", "ghost")}
      </section>
    </section>
  `;
}

function renderProgress(): string {
  if (!canShowScoreDetail()) state.progressDashboardMode = "overview";
  return shell(`
    ${appTabs("progress")}
    ${state.progressDashboardMode === "detail" ? renderScoreDetailDashboard() : renderOverviewDashboard()}
  `);
}

function scoreForCell(cell: CellKey): string {
  const evidence = state.progress.evidence.find((item) => item.construct === "ACC" && item.cellKey === cell);
  if (!evidence || evidence.currentCapacityBps === null) return "Calibrating";
  const training = scoreText(Math.round(85 + evidence.currentCapacityBps * 5));
  return `${training} training score`;
}

function renderProfile(): string {
  return renderProgress();
}

function render(): void {
  if (betaAuthRequired && state.authReady && !state.authUser && state.view !== "auth") {
    state.view = "auth";
    state.viewHistory = [];
  }
  const views: Record<View, () => string> = {
    auth: renderAuth,
    welcome: renderWelcome,
    readiness: renderReadiness,
    tutorial: renderTutorial,
    today: renderToday,
    "today-rationale": renderTodayRationale,
    "break-plan": renderBreakPlan,
    "free-play": renderFreePlay,
    "free-play-formats": renderFreePlayFormats,
    briefing: renderBriefing,
    "pre-task-instructions": renderPreTaskInstructions,
    "practice-intro": renderPracticeIntro,
    task: renderTask,
    "block-break": renderBlockBreak,
    complete: renderComplete,
    progress: renderProgress,
    proof: renderProof,
    "proof-entry": renderProofEntry,
    transfer: renderTransfer,
    "transfer-model": renderTransferModel,
    "training-map": renderTrainingMap,
    evidence: renderEvidence,
    profile: renderProfile,
  };
  appRoot.innerHTML = views[state.view]();
}

function go(view: View, options: { replace?: boolean } = {}): void {
  if (!options.replace && view !== state.view) {
    state.viewHistory = [...state.viewHistory, state.view].slice(-20);
  }
  state.view = view;
  render();
}

function goBack(): void {
  const previous = state.viewHistory.pop();
  if (!previous) return;
  clearStageTimer();
  state.view = previous;
  render();
}

function beginSession(): void {
  clearStageTimer();
  const phase = state.progress.currentPhase;
  state.sessionPlan = createSessionPlan(
    state.progress.sessionNumber,
    phase,
    state.progress.phaseStatus,
    NOMINAL_BANDS[phase],
  );
  state.activeBlockIndex = 0;
  state.activeTrialIndex = 0;
  state.blockResults = [];
  state.sessionResults = [];
  state.feedback = "";
  state.taskStage = "ready";
  state.responseStartedAt = 0;
  state.staircaseLevels = {};
  state.sessionMode = "protocol";
  state.sessionSource = phase === "P6_DELAYED" ? "recheck" : "guided";
  state.progressionScored = true;
  state.guidedReturn = null;
  pendingBlockSubmissions = [];
  go("block-break");
}

function beginFreePlay(construct: Construct, cellKey: CellKey, source: SessionSource = "free_play"): void {
  clearStageTimer();
  state.sessionPlan = createFreePlaySessionPlan(construct, cellKey);
  state.activeBlockIndex = 0;
  state.activeTrialIndex = 0;
  state.blockResults = [];
  state.sessionResults = [];
  state.feedback = "";
  state.taskStage = "ready";
  state.responseStartedAt = 0;
  state.staircaseLevels = {};
  state.sessionMode = "free";
  state.sessionSource = source;
  state.progressionScored = false;
  state.guidedReturn = null;
  go("task");
  schedule(500, startTrialPresentation);
}

function startGuidedInstructions(): void {
  state.pendingTaskStart = null;
  go("briefing");
}

function startEasierInstructions(): void {
  state.pendingTaskStart = { kind: "easier" };
  go("pre-task-instructions");
}

function startFreeInstructions(construct: Construct, cellKey: CellKey, source: SessionSource = "free_play"): void {
  state.pendingTaskStart = { kind: "free", construct, cellKey, source };
  go("pre-task-instructions");
}

function startPendingTask(): void {
  const pending = state.pendingTaskStart;
  state.pendingTaskStart = null;
  if (!pending || pending.kind === "guided") {
    go("briefing");
    return;
  }
  if (pending.kind === "easier") {
    beginFreePlay("ACC", PHASE_CELL[state.progress.currentPhase], "easier");
    return;
  }
  beginFreePlay(pending.construct, pending.cellKey, pending.source);
}

function startCurrentBlockPractice(): void {
  const guidedPlan = state.sessionPlan;
  const block = guidedPlan?.miniBlocks[state.activeBlockIndex];
  if (!guidedPlan || !block) return;
  clearStageTimer();
  const returnIndex = state.activeBlockIndex;
  state.guidedReturn = { sessionPlan: guidedPlan, activeBlockIndex: returnIndex };
  state.sessionPlan = createPracticePlanForBlock(guidedPlan, block);
  state.activeBlockIndex = 0;
  state.activeTrialIndex = 0;
  state.blockResults = [];
  state.sessionResults = [];
  state.feedback = "";
  state.taskStage = "ready";
  state.responseStartedAt = 0;
  state.staircaseLevels = {};
  state.sessionMode = "free";
  state.sessionSource = "guided_practice";
  state.progressionScored = false;
  go("task");
  schedule(500, startTrialPresentation);
}

function restoreGuidedReturn(): boolean {
  if (!state.guidedReturn) return false;
  state.sessionPlan = state.guidedReturn.sessionPlan;
  state.activeBlockIndex = state.guidedReturn.activeBlockIndex;
  state.activeTrialIndex = 0;
  state.blockResults = [];
  state.sessionResults = [];
  state.feedback = "";
  state.taskStage = "ready";
  state.responseStartedAt = 0;
  state.sessionMode = "protocol";
  state.sessionSource = state.progress.currentPhase === "P6_DELAYED" ? "recheck" : "guided";
  state.progressionScored = true;
  state.guidedReturn = null;
  return true;
}

function beginRestoredGuidedBlock(): void {
  if (!restoreGuidedReturn()) return;
  go("task");
  schedule(350, startTrialPresentation);
}

function startTrialPresentation(): void {
  const trial = activeTrial();
  if (!trial || state.view !== "task") return;
  setTaskStage("fixation");
  schedule(420, () => {
    setTaskStage("stimulus");
    schedule(trial.exposureMsRequested, () => {
      setTaskStage("mask");
      schedule(380, () => {
        state.responseStartedAt = performance.now();
        setTaskStage("response");
        schedule(2400, () => answerTrial(null));
      });
    });
  });
}

function continueAfterFeedback(): void {
  state.feedback = "";
  state.activeTrialIndex += 1;
  state.taskStage = "ready";
  state.responseStartedAt = 0;
  if (state.activeTrialIndex >= currentBlockTrialCount()) {
    submitCurrentGuidedBlock([...state.blockResults]);
    state.activeBlockIndex += 1;
    state.activeTrialIndex = 0;
    state.blockResults = [];
    if (state.activeBlockIndex >= (state.sessionPlan?.miniBlocks.length || 1)) {
      completeSession();
    } else {
      go("block-break");
    }
    return;
  }
  go("task");
  schedule(350, startTrialPresentation);
}

function endCurrentBlock(): void {
  clearStageTimer();
  state.feedback = "";
  state.taskStage = "ready";
  state.responseStartedAt = 0;
  if (state.sessionMode === "free") {
    completeSession();
    return;
  }
  submitCurrentGuidedBlock([...state.blockResults]);
  state.activeBlockIndex += 1;
  state.activeTrialIndex = 0;
  state.blockResults = [];
  if (state.activeBlockIndex >= (state.sessionPlan?.miniBlocks.length || 1)) {
    completeSession();
  } else {
    go("block-break");
  }
}

function blockSubmissionPayload(plan: SessionPlan, block: MiniBlockPlan, results: TrialResult[]) {
  return {
    clientSessionId: plan.sessionId,
    clientBlockId: block.id,
    sessionNumber: plan.sessionNumber,
    phaseLabel: plan.phase,
    phaseStatus: plan.phaseStatus,
    nominalSessionBand: plan.nominalBand,
    protocolVersion: PROTOCOL_VERSION,
    generatorVersion: GENERATOR_VERSION,
    adaptiveVersion: ADAPTIVE_VERSION,
    scoringVersion: SCORING_VERSION,
    blockIndex: block.index,
    construct: block.construct,
    label: block.label,
    trials: results.map((result) => ({
      clientTrialId: result.trial.id,
      construct: result.trial.construct,
      cellKey: result.trial.cellKey,
      transitionKey: result.trial.transitionKey,
      phaseLabel: result.trial.phase,
      isReferenceRecheck: result.trial.isReferenceRecheck,
      response: result.response,
      correctResponse: result.trial.correctResponse,
      isCorrect: result.isCorrect,
      rtMs: result.rtMs,
      ratio: result.trial.ratio,
      exposureMsRequested: result.trial.exposureMsRequested,
      exposureMsActual: result.exposureMsActual,
      actualStimulusFrames: result.actualStimulusFrames,
      deviceRefreshRateEstimate: result.deviceRefreshRateEstimate,
      droppedFrameCount: result.droppedFrameCount,
      timingQuality: result.timingQuality,
    })),
  };
}

function submitCurrentGuidedBlock(results: TrialResult[]): void {
  const plan = state.sessionPlan;
  const block = plan?.miniBlocks[state.activeBlockIndex];
  if (!plan || !block || !state.progressionScored || state.sessionMode !== "protocol") return;
  if (results.length !== block.trialCount || block.trialCount !== 20) return;
  const submission = submitAttentionBlock(blockSubmissionPayload(plan, block, results)).catch((error) => {
    console.warn("Attention block was not submitted.", error);
  });
  pendingBlockSubmissions.push(submission);
}

function finalizeGuidedSession(snapshot: ReturnType<typeof createScoreSnapshot>, decision: ReturnType<typeof chooseNextPhase>, transitionKeys: string[]): void {
  const plan = state.sessionPlan;
  if (!plan || !state.progressionScored || state.sessionMode !== "protocol") return;
  const submissions = pendingBlockSubmissions;
  pendingBlockSubmissions = [];
  void Promise.allSettled(submissions).then(() => finalizeAttentionSession({
    clientSessionId: plan.sessionId,
    snapshot,
    scoringVersion: SCORING_VERSION,
    controllerEvent: {
      fromPhase: decision.fromPhase,
      toPhase: decision.toPhase,
      shouldTransition: decision.shouldTransition,
      transitionKeys,
      phaseStatus: decision.phaseStatus,
      reason: decision.reason,
      readiness: decision.readiness,
      protocolGroup: state.progress.protocolGroup,
      scratchBaselineSources: snapshot.farTransfer?.boundarySignals.map((signal) => ({
        boundary: signal.boundary,
        source: signal.scratchBaselineSource,
        targetCell: signal.targetCell,
        transferEfficiency: signal.transferEfficiency,
        stabilityAdvantage: signal.stabilityAdvantage,
      })),
    },
  })).catch((error) => {
    console.warn("Attention session was not finalized.", error);
  });
}

function completeSession(): void {
  if (state.sessionMode === "free") {
    if (state.sessionSource !== "guided_practice") {
      recordCompletion(state.sessionSource === "easier" ? "easier" : "free_play");
    }
    go("complete");
    return;
  }
  const completedSessionNumber = state.progress.sessionNumber;
  const completedPhase = state.progress.currentPhase;
  const guidedCompletion = completionEntry("guided", completedSessionNumber, completedPhase);
  const shouldRevealProfile = completedSessionNumber === 5 && !state.progress.profileRevealSeen;
  const updatedEvidence = updateEvidenceFromResults(state.progress.evidence, state.sessionResults);
  const farTransferWindows = createFarTransferWindows({
    existingWindows: state.progress.farTransferWindows,
    results: state.sessionResults,
    sessionNumber: state.progress.sessionNumber,
  });
  const decision = chooseNextPhase({
    currentPhase: state.progress.currentPhase,
    sessionNumber: state.progress.sessionNumber,
    phaseStatus: state.progress.phaseStatus,
    completedTransitions: state.progress.completedTransitions,
    evidence: updatedEvidence,
  });
  const transitionKeys = decision.shouldTransition
    ? transitionEventsForPhaseAdvance(decision.fromPhase, decision.toPhase)
    : [];
  const completedTransitions = Array.from(new Set([...state.progress.completedTransitions, ...transitionKeys]));
  const nextPhase = decision.shouldTransition ? decision.toPhase : state.progress.currentPhase;
  const nextStatus = decision.shouldTransition ? phaseStatusForPhase(nextPhase) : decision.phaseStatus;
  const snapshot = createScoreSnapshot({
    sessionNumber: state.progress.sessionNumber,
    activePhase: nextPhase,
    phaseStatus: nextStatus,
    nominalBand: NOMINAL_BANDS[nextPhase],
    evidence: updatedEvidence,
    completedTransitions,
    farTransferWindows,
    scratchBaselines: state.progress.scratchBaselines,
    protocolGroup: state.progress.protocolGroup,
  });
  state.progress = {
    ...state.progress,
    sessionNumber: state.progress.sessionNumber + 1,
    currentPhase: nextPhase,
    phaseStatus: nextStatus,
    completedTransitions,
    evidence: updatedEvidence,
    farTransferWindows,
    latestSnapshot: snapshot,
    completions: [...state.progress.completions, guidedCompletion].slice(-60),
    profileRevealSeen: state.progress.profileRevealSeen || shouldRevealProfile,
  };
  persistProgress();
  finalizeGuidedSession(snapshot, decision, transitionKeys);
  go("complete");
}

function answerTrial(response: string | null): void {
  if (state.taskStage !== "response") return;
  clearStageTimer();
  const trial = activeTrial();
  if (!trial) return;
  const isCorrect = response === trial.correctResponse;
  const currentLevel = levelForTrial(trial);
  state.staircaseLevels[staircaseKey(trial)] = nextStaircaseLevel(currentLevel, isCorrect);
  state.feedback = isCorrect ? "correct" : "incorrect";
  state.taskStage = "feedback";
  const responseAt = performance.now();
  const result: TrialResult = {
    trial,
    response,
    isCorrect,
    rtMs: response === null ? null : Math.round(responseAt - state.responseStartedAt),
    exposureMsActual: trial.exposureMsRequested,
    actualStimulusFrames: Math.max(1, Math.round(trial.exposureMsRequested / 16.67)),
    deviceRefreshRateEstimate: state.progress.deviceReadiness?.refreshRateHz || 60,
    droppedFrameCount: 0,
    timingQuality: state.progress.deviceReadiness?.quality || "good",
  };
  state.blockResults.push(result);
  state.sessionResults.push(result);
  render();
  schedule(260, continueAfterFeedback);
}

appRoot.addEventListener("click", async (event) => {
  const target = event.target as HTMLElement;
  const freeCard = target.closest<HTMLElement>("[data-free-construct][data-free-cell]");
  if (freeCard) {
    startFreeInstructions(
      freeCard.dataset.freeConstruct as Construct,
      freeCard.dataset.freeCell as CellKey,
      "free_play",
    );
    return;
  }
  const proofEdit = target.closest<HTMLElement>("[data-proof-edit]");
  if (proofEdit) {
    state.editingProofBenchmarkId = proofEdit.dataset.proofEdit || null;
    go("proof-entry");
    return;
  }
  const proofDelete = target.closest<HTMLElement>("[data-proof-delete]");
  if (proofDelete?.dataset.proofDelete) {
    const deleteId = proofDelete.dataset.proofDelete;
    state.progress = {
      ...state.progress,
      proofBenchmarks: state.progress.proofBenchmarks.filter((entry) => entry.id !== deleteId),
    };
    persistProgress();
    void deleteProofBenchmark(deleteId).catch((error) => {
      console.warn("Proof benchmark was not deleted remotely.", error);
      markSync("error", "Benchmark delete could not be synced.");
    });
    go("proof-entry");
    return;
  }
  const response = target.closest<HTMLButtonElement>("[data-response]");
  if (response) {
    answerTrial(response.dataset.response || "");
    return;
  }
  const action = target.closest<HTMLElement>("[data-action]")?.dataset.action;
  if (!action) return;
  if (action === "send-login-link") {
    const email = inputValue("auth-email");
    if (!email) {
      state.authMessage = "Enter an email address first.";
      render();
      return;
    }
    state.authBusy = true;
    state.authMessage = "Sending sign-in link...";
    render();
    try {
      await sendEmailSignInLink(email);
      state.authMessage = "Check your email for the secure sign-in link.";
    } catch (error) {
      state.authMessage = error instanceof Error ? error.message : "Could not send sign-in link.";
    }
    state.authBusy = false;
    render();
  } else if (action === "sign-out") {
    clearStageTimer();
    await signOutUser();
    state.authUser = null;
    state.authReady = true;
    state.viewHistory = [];
    go("auth", { replace: true });
  } else if (action === "nav-auth") go("auth");
  else if (action === "nav-welcome") go("welcome");
  else if (action === "nav-back") goBack();
  else if (action === "start-readiness") go("readiness");
  else if (action === "run-readiness") {
    if (state.readinessRunning) return;
    const isRecheck = state.progress.deviceReadiness !== null;
    state.readinessRunning = true;
    state.progress = { ...state.progress, deviceReadiness: null };
    render();
    const readiness = await runDeviceReadiness();
    state.progress = { ...state.progress, deviceReadiness: readiness };
    persistProgress();
    void recordDeviceCheck(readiness).catch((error) => {
      console.warn("Device check was not synced.", error);
      markSync("error", "Device check could not be synced.");
    });
    void hydrateScratchBaselines();
    state.readinessRunning = false;
    go(isRecheck ? "readiness" : "briefing");
  } else if (action === "nav-today") go("today");
  else if (action === "nav-today-rationale") go("today-rationale");
  else if (action === "nav-break-plan") go("break-plan");
  else if (action === "nav-tutorial") go("briefing");
  else if (action === "nav-free-play") go("free-play");
  else if (action === "nav-free-play-formats") go("free-play-formats");
  else if (action === "nav-proof") go("proof");
  else if (action === "nav-proof-entry") go("proof-entry");
  else if (action === "nav-progress") {
    state.progressDashboardMode = "overview";
    go("progress");
  }
  else if (action === "nav-progress-overview") {
    state.progressDashboardMode = "overview";
    go("progress");
  }
  else if (action === "nav-progress-detail") {
    state.progressDashboardMode = "detail";
    go("progress");
  }
  else if (action === "nav-transfer") go("progress");
  else if (action === "nav-transfer-model") go("training-map");
  else if (action === "nav-training-map") go("training-map");
  else if (action === "nav-evidence") go("evidence");
  else if (action === "nav-profile") go("profile");
  else if (action === "start-briefing") go("briefing");
  else if (action === "start-next-guided-session") startGuidedInstructions();
  else if (action === "start-guided-instructions") startGuidedInstructions();
  else if (action === "start-easier-instructions") startEasierInstructions();
  else if (action === "start-pending-task") startPendingTask();
  else if (action === "begin-session") beginSession();
  else if (action === "start-block-practice") go("practice-intro");
  else if (action === "begin-block-practice") startCurrentBlockPractice();
  else if (action === "nav-block-options") go("block-break");
  else if (action === "finish-practice-begin-block") beginRestoredGuidedBlock();
  else if (action === "finish-practice-back-to-block") {
    if (restoreGuidedReturn()) go("block-break");
  }
  else if (action === "resume-block") {
    state.taskStage = "ready";
    go("task");
    schedule(350, startTrialPresentation);
  }
  else if (action === "finish-complete") go("today");
  else if (action === "complete-break") {
    recordCompletion("break");
    go("today");
  }
  else if (action === "pause-session") {
    clearStageTimer();
    state.taskStage = "ready";
    go("block-break");
  }
  else if (action === "end-block") endCurrentBlock();
  else if (action === "toggle-sound") {
    state.soundOn = !state.soundOn;
    render();
  }
  else if (action === "toggle-style") {
    applyStyleMode(styleMode === "iq" ? "legacy" : "iq");
    render();
  }
  else if (action === "save-proof-benchmark") saveProofBenchmarkEntry();
  else if (action === "cancel-proof-edit") {
    state.editingProofBenchmarkId = null;
    go("proof-entry");
  }
  else if (action === "reset-progress") {
    resetProgress();
    clearStageTimer();
    state = {
      ...state,
      progress: DEFAULT_PROGRESS,
      sessionPlan: null,
      sessionMode: "protocol",
      sessionSource: "guided",
      progressionScored: true,
      guidedReturn: null,
      progressDashboardMode: "overview",
      pendingTaskStart: null,
      editingProofBenchmarkId: null,
      viewHistory: [],
      soundOn: true,
    };
    persistProgress();
    go("welcome", { replace: true });
  }
});

window.addEventListener("keydown", (event) => {
  if (state.view !== "task" || state.taskStage !== "response" || event.repeat) return;
  const trial = activeTrial();
  if (!trial) return;
  if (trial.responseOptions.length === 2 || trial.responseOptions.length === 4) {
    const responseIndex = trial.responseOptions.findIndex(
      (option, index) => responseArrowForOption(option, index, trial.responseOptions.length).key === event.key,
    );
    if (responseIndex >= 0) {
      event.preventDefault();
      answerTrial(trial.responseOptions[responseIndex]);
    }
    return;
  }
  const number = Number(event.key);
  if (Number.isInteger(number) && number >= 1 && number <= trial.responseOptions.length) {
    event.preventDefault();
    answerTrial(trial.responseOptions[number - 1]);
  }
});

async function initialiseBetaAuth(): Promise<void> {
  if (!betaAuthRequired) {
    state.authReady = true;
    state.syncState = "local";
    state.syncMessage = "Local demo mode.";
    render();
    void hydrateScratchBaselines();
    return;
  }

  state.authReady = false;
  state.syncState = "checking";
  state.syncMessage = "Checking beta sign-in.";
  render();

  try {
    const user = await currentAuthUser();
    state.authUser = user;
    state.authReady = true;
    if (user) {
      await restoreRemoteProgress();
    } else {
      state.view = "auth";
      state.syncState = "pending";
      state.syncMessage = "Sign in to enable beta data sync.";
      render();
    }
  } catch (error) {
    console.warn("Auth initialisation failed.", error);
    state.authReady = true;
    state.view = "auth";
    state.syncState = "error";
    state.syncMessage = "Could not check beta sign-in.";
    render();
  }

  onAuthChange((user) => {
    state.authUser = user;
    state.authReady = true;
    if (user) {
      void restoreRemoteProgress();
    } else {
      state.view = "auth";
      state.viewHistory = [];
      state.syncState = "pending";
      state.syncMessage = "Sign in to enable beta data sync.";
      render();
    }
  });
}

void initialiseBetaAuth();
