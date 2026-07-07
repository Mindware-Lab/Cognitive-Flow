import "./styles.css";
import { createFreePlaySessionPlan, createSessionPlan, generateTrial, phaseIntro } from "./generator";
import { opticFlowAperturesForTrial, opticFlowMaskAperturesForTrial } from "./opticFlow";
import { NOMINAL_BANDS, PHASE_CELL, PHASE_NAMES, PHASE_ORDER_BY_GROUP, PROTOCOL_VERSION, TARGET_ENVELOPE_SESSIONS, phaseStatusForPhase, transitionEventsForPhaseAdvance } from "./protocol";
import { createFarTransferWindows, createScoreSnapshot, updateEvidenceFromResults } from "./scoring";
import { INITIAL_STAIRCASE_LEVEL, nextNLevelFromAccuracy } from "./staircase";
import { DEFAULT_PROGRESS, browserDeviceId, loadCloudSyncMode, loadProgress, newProgrammeRunId, progressForBrowserDevice, resetProgress, saveCloudSyncMode, saveProgress, type CloudSyncMode, type CompletionRoute, type LocalProgress, type ProgressScoreHistoryEntry, type ProgressScoreMetric, type ProofBenchmarkDomain, type ProofBenchmarkEntry, type ProofBenchmarkTimepoint } from "./storage";
import {
  currentAuthUser,
  deleteWorkingMemoryData,
  deleteProofBenchmark,
  exportWorkingMemoryData,
  fetchWorkingMemoryScratchBaselines,
  finalizeWorkingMemorySession,
  isSupabaseConfigured,
  loadRemoteProgress,
  onAuthChange,
  recordDeviceCheck,
  saveProofBenchmark,
  saveRemoteProgress,
  sendEmailSignInLink,
  signOutUser,
  submitWorkingMemoryBlock,
  type AuthUser,
} from "./supabaseClient";
import { runDeviceReadiness } from "./timing";
import { chooseNextPhase } from "./wap";
import type { CapacitySpeed, CellEvidence, CellKey, Construct, MiniBlockPlan, PhaseLabel, PhaseStatus, ProtocolGroup, ScratchBaseline, SessionPlan, TrialCondition, TrialDefinition, TrialResult } from "./types";

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
  | "coaching"
  | "proof"
  | "proof-entry"
  | "transfer"
  | "transfer-model"
  | "training-map"
  | "evidence"
  | "data-rights"
  | "profile";

type TaskStage = "ready" | "countdown" | "blank" | "fixation" | "stimulus" | "mask" | "response" | "feedback";
type StyleMode = "iq" | "legacy";
type ProgressDashboardMode = "overview" | "detail";
type SessionSource = "guided" | "guided_practice" | "free_play" | "preview" | "recheck" | "easier";
type PendingTaskStart =
  | { kind: "guided" }
  | { kind: "easier" }
  | { kind: "free"; construct: Construct; cellKey: CellKey; source: SessionSource; speed?: CapacitySpeed; phase?: PhaseLabel };
type SyncState = "local" | "checking" | "synced" | "pending" | "error";

const GENERATOR_VERSION = "wm-coach-generator-v0.1";
const ADAPTIVE_VERSION = "wm-coach-staircase-v0.1";
const SCORING_VERSION = "wm-coach-scoring-v0.1";

function freshDefaultProgress(programmeCycle = 1): LocalProgress {
  return {
    ...DEFAULT_PROGRESS,
    programmeRunId: newProgrammeRunId(programmeCycle),
    programmeCycle,
    completions: [],
    scoreHistory: [],
    scratchBaselines: [],
    proofBenchmarks: [],
  };
}

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
  countdownStep: number;
  responseStartedAt: number;
  stageTimer: number | null;
  displayTimer: number | null;
  pendingTrialResponse: string | null;
  pendingTrialRtMs: number | null;
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
  cloudSyncMode: CloudSyncMode;
  syncState: SyncState;
  syncMessage: string;
}

const app = document.querySelector<HTMLDivElement>("#app");
if (!app) throw new Error("Missing #app root.");
const appRoot = app;
const STYLE_MODE_KEY = "wmCoachStyleModeV2";
const cloudSyncAvailable = isSupabaseConfigured;
const initialCloudSyncMode: CloudSyncMode = cloudSyncAvailable ? loadCloudSyncMode() : "local";
const currentBrowserDeviceId = browserDeviceId();
const APP_BASE = import.meta.env.BASE_URL || "/";
const COACHING_CHECKOUT_URL = "https://buy.stripe.com/8x2bJ0bi96s06vLgtQ9ws0t";

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

function resolveInitialView(cloudSyncMode: CloudSyncMode): View {
  const queryView = new URLSearchParams(window.location.search).get("view");
  const allowedViews: View[] = [
    "auth",
    "data-rights",
    "welcome",
    "readiness",
    "tutorial",
    "today",
    "today-rationale",
    "break-plan",
    "free-play",
    "free-play-formats",
    "progress",
    "coaching",
    "proof",
    "proof-entry",
    "transfer",
    "transfer-model",
    "training-map",
    "evidence",
    "profile",
  ];
  if (cloudSyncAvailable && cloudSyncMode === "cloud") return "auth";
  return allowedViews.includes(queryView as View) ? (queryView as View) : "welcome";
}

function queryProtocolGroup(): ProtocolGroup | null {
  const value = new URLSearchParams(window.location.search).get("protocolGroup");
  return value === "validation_arrows_first" || value === "validation_flow_first" || value === "commercial_arrows_first"
    ? value
    : null;
}

function loadAssignedProgress(): LocalProgress {
  const progress = progressForBrowserDevice(loadProgress(), currentBrowserDeviceId);
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
  view: resolveInitialView(initialCloudSyncMode),
  progress: initialProgress,
  sessionPlan: null,
  activeBlockIndex: 0,
  activeTrialIndex: 0,
  blockResults: [],
  sessionResults: [],
  feedback: "",
  readinessRunning: false,
  taskStage: "ready",
  countdownStep: 0,
  responseStartedAt: 0,
  stageTimer: null,
  displayTimer: null,
  pendingTrialResponse: null,
  pendingTrialRtMs: null,
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
  authReady: initialCloudSyncMode !== "cloud",
  authMessage: "",
  authBusy: false,
  cloudSyncMode: initialCloudSyncMode,
  syncState: initialCloudSyncMode === "cloud" ? "checking" : "local",
  syncMessage: initialCloudSyncMode === "cloud" ? "Checking sign-in." : "Cloud optional via data ethics page.",
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
  if (!cloudSyncActive()) return;
  try {
    const baselines = await fetchWorkingMemoryScratchBaselines({
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
  if (!cloudSyncAvailable) return "Local demo";
  if (state.cloudSyncMode === "local") return "Local only";
  if (!state.authReady) return "Checking sign-in";
  return state.authUser?.email || "Sign in required";
}

function dataStatusLabel(): string {
  return state.cloudSyncMode === "local" ? "Data ethics" : authLabel();
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

function cloudSyncActive(): boolean {
  return cloudSyncAvailable && state.cloudSyncMode === "cloud" && Boolean(state.authUser);
}

function persistProgressRemote(): void {
  if (!cloudSyncActive()) return;
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

type WmAudioContext = AudioContext & { webkitAudioContext?: never };

let feedbackAudioContext: AudioContext | null = null;

function createFeedbackAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AudioContextCtor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextCtor) return null;
  try {
    return new AudioContextCtor() as WmAudioContext;
  } catch (error) {
    console.warn("Sound feedback could not start.", error);
    return null;
  }
}

function feedbackAudio(): AudioContext | null {
  if (!feedbackAudioContext) feedbackAudioContext = createFeedbackAudioContext();
  if (feedbackAudioContext?.state === "suspended") {
    void feedbackAudioContext.resume().catch((error) => console.warn("Sound feedback could not resume.", error));
  }
  return feedbackAudioContext;
}

function playToneSequence(steps: Array<{ frequency: number; start: number; duration: number; type?: OscillatorType; gain?: number }>): void {
  if (!state.soundOn) return;
  const audio = feedbackAudio();
  if (!audio) return;
  const now = audio.currentTime + 0.01;
  for (const step of steps) {
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    oscillator.type = step.type || "sine";
    oscillator.frequency.setValueAtTime(step.frequency, now + step.start);
    gain.gain.setValueAtTime(0.0001, now + step.start);
    gain.gain.exponentialRampToValueAtTime(step.gain || 0.055, now + step.start + 0.018);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + step.start + step.duration);
    oscillator.connect(gain).connect(audio.destination);
    oscillator.start(now + step.start);
    oscillator.stop(now + step.start + step.duration + 0.025);
  }
}

function playFeedbackSound(outcome: "correct" | "incorrect" | "enabled"): void {
  if (outcome === "correct") {
    playToneSequence([
      { frequency: 660, start: 0, duration: 0.11, gain: 0.045 },
      { frequency: 880, start: 0.095, duration: 0.15, gain: 0.055 },
    ]);
    return;
  }
  if (outcome === "enabled") {
    playToneSequence([{ frequency: 740, start: 0, duration: 0.12, gain: 0.04 }]);
    return;
  }
  playToneSequence([
    { frequency: 220, start: 0, duration: 0.13, type: "square", gain: 0.035 },
    { frequency: 165, start: 0.1, duration: 0.18, type: "triangle", gain: 0.045 },
  ]);
}

async function restoreRemoteProgress(): Promise<void> {
  if (!cloudSyncActive()) return;
  markSync("checking", "Loading beta progress.");
  render();
  let nextView: View = "welcome";
  try {
    const remote = await loadRemoteProgress();
    if (remote) {
      state.progress = progressForBrowserDevice({ ...DEFAULT_PROGRESS, ...remote }, currentBrowserDeviceId);
      saveProgress(state.progress);
      markSync("synced", "Beta progress loaded.");
      nextView = "welcome";
    } else {
      state.progress = freshDefaultProgress();
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
    "coaching",
    "proof",
    "proof-entry",
    "data-rights",
  ];
  const showBetaStatus = cloudSyncAvailable && !["progress", "coaching", "proof", "proof-entry", "training-map", "evidence"].includes(state.view);
  const contentClasses = [
    "app-content",
    `view-${state.view}`,
    tabbedViews.includes(state.view) ? "has-app-tabs" : "",
    showBetaStatus ? "has-beta-status" : "",
  ].filter(Boolean).join(" ");
  const backControl = state.viewHistory.length > 0
    ? `<button class="app-nav-button app-back-button" data-action="nav-back" aria-label="Go back">${headerIcon("back")}</button>`
    : "";
  const homeControl = `<button class="app-nav-button app-home-button ${state.view === "today" ? "is-current" : ""}" data-action="nav-today" aria-label="Go to home screen">${headerIcon("home")}</button>`;
  const authControl = cloudSyncAvailable && state.cloudSyncMode === "cloud" && state.authUser
    ? `<button class="app-auth-button" data-action="nav-data-rights" title="${escapeHtml(authLabel())}">Data</button>`
    : cloudSyncAvailable
      ? `<button class="app-auth-button" data-action="nav-data-rights">${state.cloudSyncMode === "cloud" ? "Sign in" : "Data"}</button>`
      : "";
  const soundControl = `<button class="app-nav-button app-sound-button ${state.soundOn ? "is-on" : "is-off"}" data-action="toggle-sound" aria-label="${state.soundOn ? "Turn sound feedback off" : "Turn sound feedback on"}">${headerIcon(state.soundOn ? "sound-on" : "sound-off")}</button>`;
  return `
    <main class="app-shell app-view-${state.view}">
      <header class="app-brand-bar">
        <div class="app-header-left">${backControl}${homeControl}</div>
        <div class="app-header-brand">
          <img src="${assetPath("wm-coach-wordmark.png")}" alt="Working Memory Coach" />
        </div>
        <div class="app-header-right">${authControl}${soundControl}</div>
      </header>
      <div class="${contentClasses}">
        ${showBetaStatus ? `<div class="beta-status-bar"><button class="beta-status-link" data-action="nav-data-rights">${escapeHtml(dataStatusLabel())}</button><strong>${escapeHtml(syncLabel())}</strong><em>${escapeHtml(state.syncMessage)}</em></div>` : ""}
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
  P5_ARROW_MIXED: "Static arrows now alternate between absolute and relative frames.",
  P6_FLOW_MIXED: "Optic-flow patterns now alternate between absolute and relative frames.",
  P5_FLOW_MIXED: "Optic-flow patterns now alternate between absolute and relative frames.",
  P6_ARROW_MIXED: "Static arrows now alternate between absolute and relative frames.",
  P7_FULL_MIXED: "Arrows, optic flow, absolute frames and relative frames now alternate.",
  P8_BIND_ARROW_REL: "The app now asks you to bind relative arrow relations with colour.",
  P9_BIND_FLOW_REL: "The app now asks you to bind relative optic-flow relations with colour.",
  P8_BIND_FLOW_REL: "The app now asks you to bind relative optic-flow relations with colour.",
  P9_BIND_ARROW_REL: "The app now asks you to bind relative arrow relations with colour.",
  P10_BIND_MIXED: "Binding demands now continue while carrier and frame demands switch.",
  P11_DELAYED: "The app re-checks whether the skill comes back after time away.",
  P5_MIXED: "Formats now alternate. The goal is to keep the rule stable when the surface changes unpredictably.",
  P6_DELAYED: "The app re-checks whether the skill comes back after time away.",
};

const PHASE_GOAL_COPY: Record<PhaseLabel, string> = {
  P1_ARROW_ABS: "Build a cognitive control baseline.",
  P2_FLOW_ABS: "recover the same signal skill in moving patterns.",
  P3_ARROW_REL: "use the pattern's relationship, not just its surface direction.",
  P4_FLOW_REL: "recover the relational skill in motion patterns.",
  P1_FLOW_ABS: "build a clear Working Memory-control baseline in motion patterns.",
  P2_ARROW_ABS: "recover the same signal skill in static arrows.",
  P3_FLOW_REL: "use the movement pattern's relationship to the centre.",
  P4_ARROW_REL: "recover the relational skill in static arrows.",
  P5_ARROW_MIXED: "switch absolute and relative frames within static arrows.",
  P6_FLOW_MIXED: "switch absolute and relative frames within optic flow.",
  P5_FLOW_MIXED: "switch absolute and relative frames within optic flow.",
  P6_ARROW_MIXED: "switch absolute and relative frames within static arrows.",
  P7_FULL_MIXED: "keep the rule stable while carrier and frame both change.",
  P8_BIND_ARROW_REL: "bind relative arrow relations with colour.",
  P9_BIND_FLOW_REL: "bind relative optic-flow relations with colour.",
  P8_BIND_FLOW_REL: "bind relative optic-flow relations with colour.",
  P9_BIND_ARROW_REL: "bind relative arrow relations with colour.",
  P10_BIND_MIXED: "keep relation and colour bound while formats switch.",
  P11_DELAYED: "re-check whether the skill returns after spacing.",
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

function appTabs(active: "today" | "train" | "progress" | "coaching"): string {
  return `
    <nav class="tabs">
      ${navButton("Today", "nav-today", active === "today")}
      ${navButton("Train", "nav-free-play", active === "train")}
      ${navButton("Progress", "nav-progress", active === "progress")}
      ${navButton("Coaching", "nav-coaching", active === "coaching")}
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

function latestGuidedCompletion() {
  return [...state.progress.completions]
    .filter((entry) => entry.route === "guided" && entry.programmeRunId === state.progress.programmeRunId)
    .sort((a, b) => b.completedAt.localeCompare(a.completedAt))[0] || null;
}

function guidedCompletedToday(): boolean {
  return latestGuidedCompletion()?.date === todayIso();
}

function guidedSessionsCompleted(): number {
  return state.progress.completions.filter((entry) => entry.route === "guided" && entry.programmeRunId === state.progress.programmeRunId).length;
}

function hasReturnGap(): boolean {
  const latest = latestCompletion();
  return Boolean(latest && daysBetweenIsoDates(latest.date, todayIso()) >= 2);
}

function programmeProgressDots(completedCount = guidedSessionsCompleted()): string {
  const dots = Array.from({ length: TARGET_ENVELOPE_SESSIONS }, (_, index) => {
    const sessionNumber = index + 1;
    const complete = index < completedCount;
    return `<span class="${complete ? "is-complete" : ""}" title="Session ${sessionNumber}${complete ? " complete" : ""}">${complete ? sessionNumber : ""}</span>`;
  });
  return `
    <div class="programme-dots" aria-label="${completedCount} of ${TARGET_ENVELOPE_SESSIONS} guided sessions complete">
      <div class="programme-dot-row">${dots.slice(0, 10).join("")}</div>
      <div class="programme-dot-row">${dots.slice(10).join("")}</div>
    </div>
  `;
}

function programmeProgressCard(): string {
  const completedCount = guidedSessionsCompleted();
  return `
    <section class="programme-progress-card">
      <span>Programme progress</span>
      <strong>${completedCount} of ${TARGET_ENVELOPE_SESSIONS} guided sessions complete</strong>
      <p>Full programme: ${TARGET_ENVELOPE_SESSIONS} guided sessions. New challenge formats appear when your learning curve is ready.</p>
      ${programmeProgressDots(completedCount)}
    </section>
  `;
}

function completionEntry(route: CompletionRoute, sessionNumber = state.progress.sessionNumber, phase = state.progress.currentPhase) {
  return {
    id: `completion-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    date: todayIso(),
    route,
    completedAt: new Date().toISOString(),
    sessionNumber,
    phase,
    programmeRunId: state.progress.programmeRunId,
    programmeCycle: state.progress.programmeCycle,
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
  if (phase === "P5_ARROW_MIXED" || phase === "P6_FLOW_MIXED" || phase === "P5_FLOW_MIXED" || phase === "P6_ARROW_MIXED" || phase === "P7_FULL_MIXED" || phase === "P10_BIND_MIXED" || phase === "P5_MIXED") return PHASE_STATUS_COPY.mixed_stability;
  if (phase === "P11_DELAYED" || phase === "P6_DELAYED") return PHASE_STATUS_COPY.return_check;
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
      alt="Brain systems linked to Relational Memory, including fronto-parietal, prefrontal, and hippocampal medial temporal support."
      width="726"
      height="390"
    />
  `;
}

function blockTrainingCopy(block: MiniBlockPlan): { title: string; body: string; tip: string } {
  if (block.construct === "BSE") {
    return {
      title: "Binding Stability",
      body: "This block asks you to remember the relation-colour pair and press MATCH only when the same pair repeats N back.",
      tip: "Track the pair as one item. Practice is only to learn the display.",
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
    body: "This block builds the basic n-back rule: press MATCH when the current item repeats the item N back.",
    tip: "Respond only for matches. Withhold when the item is new.",
  };
}

function renderProgrammeRationale(): string {
  return `
    <section class="programme-rationale-card">
      <p class="ui-eyebrow">Why this programme?</p>
      <h2>Train the skill, then test whether it survives change.</h2>
      <div class="rationale-grid">
        <span>You are training controlled Working Memory: picking out goal-relevant information from brief, noisy displays.</span>
        <span>The display changes on purpose. If the same rule survives a new format, that is stronger evidence than getting better at one screen.</span>
        <span>Later sessions mix formats and re-check after spacing because useful learning should return after time away.</span>
      </div>
      <p class="claims-note compact-note">Flexible Working Memory helps you keep the right goal active under pressure, distraction, or uncertainty. This is training support, not a diagnosis or clinical treatment.</p>
    </section>
  `;
}

function phaseRationale(phase: PhaseLabel): string {
  if (phase === "P2_FLOW_ABS" || phase === "P2_ARROW_ABS" || phase === "P4_FLOW_REL" || phase === "P4_ARROW_REL") {
    return "The rule is the same, but the surface is different. This helps test whether you learned the underlying skill rather than memorising one display.";
  }
  if (phase === "P5_ARROW_MIXED" || phase === "P6_FLOW_MIXED" || phase === "P5_FLOW_MIXED" || phase === "P6_ARROW_MIXED") return "The carrier stays familiar, but the frame changes. This isolates frame flexibility before the display becomes fully mixed.";
  if (phase === "P7_FULL_MIXED") return "Both carrier and frame now switch. This trains flexible Working Memory: keeping the right goal active under pressure, distraction, or uncertainty.";
  if (phase === "P8_BIND_ARROW_REL" || phase === "P9_BIND_FLOW_REL" || phase === "P8_BIND_FLOW_REL" || phase === "P9_BIND_ARROW_REL") return "This phase adds conjunction pressure: relation and colour have to be kept together as one memory item.";
  if (phase === "P10_BIND_MIXED") return "Binding now has to survive format switching, not only a single familiar display.";
  if (phase === "P11_DELAYED" || phase === "P6_DELAYED") return "This re-check asks whether the trained skill returns after spacing, not only during same-day practice.";
  if (phase === "P5_MIXED") return "Formats now switch. This trains flexible Working Memory: keeping the right goal active under pressure, distraction, or uncertainty.";
  if (phase === "P3_ARROW_REL" || phase === "P3_FLOW_REL") return "This phase asks you to use the relationship to the centre, not just the surface direction. That makes the Working Memory rule more flexible.";
  return "This phase builds your starting point for controlled Working Memory: picking out goal-relevant information from brief, noisy displays.";
}

function sessionGoalCopy(phase: PhaseLabel): string {
  if (phase === "P5_ARROW_MIXED" || phase === "P6_FLOW_MIXED" || phase === "P5_FLOW_MIXED" || phase === "P6_ARROW_MIXED") return "Switch absolute and relative frames within one carrier.";
  if (phase === "P7_FULL_MIXED") return "Switch carriers and frames while keeping the same goal active.";
  if (phase === "P8_BIND_ARROW_REL" || phase === "P9_BIND_FLOW_REL" || phase === "P8_BIND_FLOW_REL" || phase === "P9_BIND_ARROW_REL") return "Keep relation and colour bound together.";
  if (phase === "P10_BIND_MIXED") return "Keep bindings stable while formats switch.";
  if (phase === "P11_DELAYED" || phase === "P6_DELAYED") return "Re-check whether the skill returns after time away.";
  if (phase === "P5_MIXED") return "Switch formats while keeping the same goal active.";
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
      focus: "Press MATCH only for N-back repeats. Withhold for non-matches.",
      why: "Practice helps you learn the display. It does not change your session number, phase, or transfer score.",
      startLabel: "Start practice",
    };
  }
  if (pending?.kind === "free") {
    const construct = pending.construct === "BSE" ? "Binding Stability" : "Signal Control";
    return {
      title: `${construct} practice`,
      what: "You will practise a selected format outside today's guided session.",
      focus: pending.construct === "BSE" ? "Match the same relation-colour pair N back." : "Match the same relation N back.",
      why: "Practice helps you learn the display. It does not change your session number, phase, or transfer score.",
      startLabel: "Start practice",
    };
  }
  return {
    title: "Today's Working Memory session",
    what: "You will complete the guided task chosen for your current learning curve.",
    focus: "Press MATCH for N-back repeats; otherwise do nothing.",
    why: phaseRationale(state.progress.currentPhase),
    startLabel: "Start guided session",
  };
}

function renderPreTaskInstructions(): string {
  const copy = pendingTaskCopy();
  const sameDayWarning = state.pendingTaskStart?.kind === "guided" && guidedCompletedToday()
    ? `<div class="same-day-warning-card"><strong>You can continue, but the programme is designed around steady daily sessions.</strong><p>Extra sessions may be lower quality if you are tired.</p></div>`
    : "";
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
      ${sameDayWarning}
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
  if (trial.isWarmup) return `Remember the sequence. Matches can start after ${trial.nLevel} items.`;
  if (trial.construct === "BSE") return `Press MATCH if this relation-colour pair is the same as ${trial.nLevel} back.`;
  if (trial.cellKey.includes("flow")) return `Press MATCH if this motion relation is the same as ${trial.nLevel} back.`;
  return `Press MATCH if this arrow relation is the same as ${trial.nLevel} back.`;
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
    instruction: "Practice helps you learn the display. It does not change your session number, phase, or transfer score.",
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
  if (state.displayTimer !== null) {
    window.clearTimeout(state.displayTimer);
    state.displayTimer = null;
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

const COUNTDOWN_STEPS = ["3", "2", "1"];
const COUNTDOWN_STEP_MS = 700;
const INTER_STIMULUS_BLANK_MS = 83;
const TASK_SPEED_SOA_MS: Record<CapacitySpeed, number> = {
  slow: 3000,
  fast: 1400,
};
const TASK_SPEED_DISPLAY_RATIO = 0.65;

function renderAuth(): string {
  return shell(`
    <section class="auth-screen">
      <div class="auth-card">
        <img src="${assetPath("iqmindware-logo.png")}" alt="IQ Mindware" />
        <p class="ui-eyebrow">Cloud sync</p>
        <h1>Sign in for cloud sync</h1>
        <p class="ui-body">Local-only training remains available. If you enable cloud sync, guided trial logs, device checks, progress state, score snapshots, and manual benchmark entries are saved to your Supabase account so your programme can continue across devices.</p>
        <section class="ethics-compact-panel">
          <strong>Use boundary</strong>
          <span>Your data is for personal training support. It is not a diagnosis, IQ score, certificate, employer report, ranking, or selection record.</span>
        </section>
        ${
          isSupabaseConfigured
            ? `<label>Email
                <input id="auth-email" type="email" autocomplete="email" placeholder="you@example.com" />
              </label>
              <div class="action-row">
                ${button(state.authBusy ? "Sending..." : "Send sign-in link", "send-login-link")}
                ${button("Use local only", "use-local-only", "secondary")}
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

function renderDataRights(): string {
  const cloudActive = cloudSyncActive();
  const modeLabel = state.cloudSyncMode === "cloud" ? "Cloud sync selected" : "Local-only selected";
  const cloudCopy = cloudSyncAvailable
    ? state.cloudSyncMode === "cloud"
      ? "Cloud sync is opt-in. Remote saves happen only while you are signed in."
      : "Cloud sync is available, but raw trial logs and progress are not uploaded in local-only mode."
    : "Cloud sync is not configured for this build.";
  return shell(`
    <section class="data-rights-screen">
      <section class="data-rights-hero">
        <p class="ui-eyebrow">Data rights</p>
        <h1>Your cognitive data stays under your control.</h1>
        <p>${escapeHtml(cloudCopy)}</p>
      </section>
      <section class="data-rights-grid">
        <article class="data-rights-card is-blue">
          <span>Mode</span>
          <strong>${escapeHtml(modeLabel)}</strong>
          <p>${state.cloudSyncMode === "cloud" ? "Progress can continue across signed-in devices." : "Data is stored in this browser only. Enable cloud sync to switch devices or recover progress after clearing browser data."}</p>
          <div class="data-rights-actions">
            ${cloudSyncAvailable ? state.cloudSyncMode === "cloud" ? button("Use local only", "use-local-only", "secondary") : button("Enable cloud sync", "enable-cloud-sync", "primary") : ""}
            ${state.cloudSyncMode === "cloud" && state.authUser ? button("Sign out", "sign-out", "ghost") : ""}
          </div>
        </article>
        <article class="data-rights-card is-green">
          <span>Export</span>
          <strong>Machine-readable copy</strong>
          <p>Export local progress, or your full cloud record when cloud sync is active.</p>
          <div class="data-rights-actions">${button(cloudActive ? "Export cloud data" : "Export local data", "export-wm-data")}</div>
        </article>
        <article class="data-rights-card is-red">
          <span>Delete</span>
          <strong>Permanent removal</strong>
          <p>${cloudActive ? "Delete your cloud Working Memory Coach data and reset this browser." : "Reset this browser's local Working Memory Coach progress."}</p>
          <div class="data-rights-actions">${button(cloudActive ? "Delete cloud data" : "Reset local data", "delete-wm-data", "secondary")}</div>
        </article>
      </section>
      <section class="ethics-boundary-card">
        <strong>Non-selection boundary</strong>
        <p>Scores and benchmark notes are personal training signals. The app does not generate certificates, share-to-employer links, public rankings, or institutional score APIs.</p>
      </section>
    </section>
  `);
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

function setCloudSyncMode(mode: CloudSyncMode): void {
  state.cloudSyncMode = cloudSyncAvailable ? mode : "local";
  saveCloudSyncMode(state.cloudSyncMode);
  if (state.cloudSyncMode === "local") {
    state.syncState = "local";
    state.syncMessage = "Cloud optional via data ethics page.";
  } else {
    state.syncState = state.authUser ? "checking" : "pending";
    state.syncMessage = state.authUser ? "Cloud sync enabled." : "Sign in to sync devices.";
  }
}

async function exportCurrentData(): Promise<void> {
  try {
    if (cloudSyncActive()) {
      const exported = await exportWorkingMemoryData();
      downloadJson(`wm-coach-cloud-export-${todayIso()}.json`, exported);
      markSync("synced", "Cloud data export created.");
    } else {
      downloadJson(`wm-coach-local-export-${todayIso()}.json`, {
        exportedAt: new Date().toISOString(),
        mode: "local",
        progress: state.progress,
      });
      markSync("local", "Local data export created.");
    }
  } catch (error) {
    console.warn("Working Memory data export failed.", error);
    markSync("error", error instanceof Error ? error.message : "Data export failed.");
  }
  render();
}

async function deleteCurrentData(): Promise<void> {
  const target = cloudSyncActive() ? "cloud Working Memory Coach data and local browser progress" : "local Working Memory Coach progress in this browser";
  if (!window.confirm(`Permanently delete ${target}? This cannot be undone.`)) return;
  try {
    if (cloudSyncActive()) await deleteWorkingMemoryData();
    resetProgress();
    state.progress = freshDefaultProgress();
    state.sessionPlan = null;
    state.sessionMode = "protocol";
    state.sessionSource = "guided";
    state.progressionScored = true;
    state.guidedReturn = null;
    state.progressDashboardMode = "overview";
    state.pendingTaskStart = null;
    state.editingProofBenchmarkId = null;
    state.viewHistory = [];
    markSync(state.cloudSyncMode === "cloud" ? "synced" : "local", "Working Memory Coach data deleted.");
    go("welcome", { replace: true });
  } catch (error) {
    console.warn("Working Memory data deletion failed.", error);
    markSync("error", error instanceof Error ? error.message : "Data deletion failed.");
    render();
  }
}

function renderWelcome(): string {
  return shell(`
    <section class="splash-card">
      <div class="splash-network splash-network-top" aria-hidden="true"></div>
      <div class="splash-network splash-network-side" aria-hidden="true"></div>
      <section class="splash-brand">
        <img src="${assetPath("iqmindware-logo-spec.png")}" alt="IQ Mindware" class="splash-logo" />
        <img src="${assetPath("wm-coach-wordmark.png")}" alt="Working Memory Coach" class="splash-wordmark" />
        <div class="splash-title">
          <p>Train Relational Memory and cognitive capacity.</p>
          <small>First step: quick setup, then today's guided Working Memory session.</small>
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
        ${button("Start today's session", "start-readiness")}
        ${button("Choose a practice game", "nav-free-play", "secondary")}
        <small class="splash-support-note">Setup first; the guided session takes about 5-10 minutes.</small>
        <button class="splash-link" data-action="nav-training-map">Brain basis</button>
        <a class="splash-site-link" href="https://www.iqmindware.com" target="_blank" rel="noreferrer">www.iqmindware.com</a>
      </section>
    </section>
  `, { splash: true });
}

function renderReadiness(): string {
  const readiness = state.progress.deviceReadiness;
  const screenTestCopy = state.readinessRunning
    ? "Keep this tab visible."
    : "Takes a few seconds.";
  return shell(`
    <section class="panel readiness-panel">
      <p class="ui-eyebrow">${readiness ? "Setup check complete" : "Quick setup"}</p>
      <h1>${readiness ? "Device check complete" : "Device check"}</h1>
      <p class="ui-body">${
        readiness
          ? "Ready on this browser/device. Recheck after switching device, display, browser, or power mode."
          : "Checks display timing before training starts."
      }</p>
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
        ${button(readiness ? "Today's plan" : state.readinessRunning ? "Checking..." : "Run readiness check", readiness ? "nav-today" : "run-readiness")}
        ${readiness ? button("Run check again", "run-readiness", "secondary") : ""}
        ${!readiness ? button("Today's plan", "nav-today", "secondary") : ""}
      </div>
    </section>
  `);
}

function renderTutorial(): string {
  return shell(`
    <section class="panel tutorial-grid direction-tutorial">
      <div class="direction-tutorial-copy">
        <p class="ui-eyebrow">Direction foundation</p>
        <h1>Match the item N back.</h1>
        <p class="ui-body">A sequence appears one item at a time. Press MATCH only when the current item repeats the item N back.</p>
      </div>
      <div class="direction-demo" role="img" aria-label="Example n-back sequence with a repeated arrow relation">
        <div class="direction-demo-grid" aria-hidden="true">
          <span>&rarr;</span>
          <span>&larr;</span>
          <span>&uarr;</span>
          <span>&larr;</span>
          <span>&darr;</span>
        </div>
        <strong>2-back match</strong>
      </div>
      <div class="tutorial-cues">
        <article class="instruction-card"><strong>Watch</strong><p>Keep the recent items in mind.</p></article>
        <article class="instruction-card"><strong>Match</strong><p>Press only when the item repeats N back.</p></article>
        <article class="instruction-card"><strong>Withhold</strong><p>Do nothing when it is not a match.</p></article>
      </div>
      <div class="action-row">
        ${button("Start n-back foundation", "begin-session")}
        ${button("Today's plan", "nav-today", "secondary")}
      </div>
    </section>
  `);
}

function renderToday(): string {
  const phase = state.progress.currentPhase;
  const completedCount = guidedSessionsCompleted();
  const completeToday = guidedCompletedToday();
  if (completedCount >= TARGET_ENVELOPE_SESSIONS) {
    return shell(`
      ${appTabs("today")}
      <section class="daily-loop-screen">
        <div class="today-action-card programme-complete-card">
          <p class="ui-eyebrow">${TARGET_ENVELOPE_SESSIONS}-session programme complete</p>
          <h1>Congratulations</h1>
          <p class="ui-body">You completed the guided ${TARGET_ENVELOPE_SESSIONS}-session Working Memory Coach programme.</p>
          <p class="return-cue is-complete-today">You can review progress, practise freely, or start another ${TARGET_ENVELOPE_SESSIONS}-session block.</p>
          <div class="today-primary-actions">
            ${button(`Start another ${TARGET_ENVELOPE_SESSIONS} sessions`, "restart-guided-programme")}
            <button class="secondary-link-button" data-action="nav-progress">View progress</button>
            <button class="secondary-link-button" data-action="start-easier-instructions">Practice only</button>
          </div>
        </div>
        <div class="today-plan-card">
          ${programmeProgressCard()}
        </div>
      </section>
    `);
  }
  const returnCopy = completeToday
    ? `<p class="return-cue is-complete-today">Today's guided session is complete. Come back tomorrow, or choose short Practice only.</p>`
    : hasReturnGap()
      ? `<p class="return-cue">Welcome back. Your guided session is ready; you can also choose an easier practice today.</p>`
      : "";
  return shell(`
    ${appTabs("today")}
    <section class="daily-loop-screen">
      <div class="today-action-card">
        <p class="ui-eyebrow">Today - Session ${Math.min(state.progress.sessionNumber, TARGET_ENVELOPE_SESSIONS)} of ${TARGET_ENVELOPE_SESSIONS}</p>
        <h1>Today's Working Memory session</h1>
        <p class="ui-body">Recommended: one guided session per day. Practice mode is optional.</p>
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
          ${button("Start today's Working Memory session", "start-guided-instructions")}
          <button class="secondary-link-button" data-action="start-easier-instructions">Practice only</button>
          <button class="secondary-link-button" data-action="nav-today-rationale">Why today?</button>
        </div>
      </div>
      <div class="today-plan-card">
        ${programmeProgressCard()}
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
        ${button("Start today's session", "start-guided-instructions", "secondary")}
        ${button("Brain basis", "nav-training-map", "ghost")}
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
        <p class="ui-body">If today is a poor fit for training, the better choice is to pause deliberately rather than force a hard session. This records continuity without changing your progress path.</p>
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

type FreePlayFormat = { cell: CellKey; label: string; detail: string; phase?: PhaseLabel };

const FREE_PLAY_FORMATS: Record<Construct, FreePlayFormat[]> = {
  ACC: [
    { cell: "arrow_abs", label: "Direction foundation", detail: "Static arrows and simple signal control." },
    { cell: "flow_abs", label: "Motion Foundation", detail: "Moving patterns with the same rule." },
    { cell: "arrow_rel", label: "Relation Foundation", detail: "Use relationships around the centre." },
    { cell: "flow_rel", label: "Motion Relations", detail: "Recover relational control in motion." },
    { cell: "mixed", phase: "P5_ARROW_MIXED", label: "Mixed Arrow Frames", detail: "Static arrows switch between absolute and relative frames." },
    { cell: "mixed", phase: "P6_FLOW_MIXED", label: "Mixed Flow Frames", detail: "Optic flow switches between absolute and relative frames." },
    { cell: "mixed", phase: "P7_FULL_MIXED", label: "Full Mixed N-back", detail: "Arrows, optic flow, absolute and relative frames all switch." },
  ],
  BSE: [
    { cell: "arrow_rel", phase: "P8_BIND_ARROW_REL", label: "Binding Arrow Relations", detail: "Relative arrows with colour conjunctions." },
    { cell: "flow_rel", phase: "P9_BIND_FLOW_REL", label: "Binding Flow Relations", detail: "Relative optic flow with colour conjunctions." },
    { cell: "mixed", phase: "P10_BIND_MIXED", label: "Mixed Binding N-back", detail: "Colour bindings across changing carriers and frames." },
  ],
};

const FREE_PLAY_COLUMNS: Array<{ title: string; detail: string; icon: string; items: Array<{ construct: Construct; format: FreePlayFormat }> }> = [
  {
    title: "Core + Integration",
    detail: "Build the four base displays, then combine them.",
    icon: "target",
    items: [
      { construct: "ACC", format: FREE_PLAY_FORMATS.ACC[0] },
      { construct: "ACC", format: FREE_PLAY_FORMATS.ACC[1] },
      { construct: "ACC", format: FREE_PLAY_FORMATS.ACC[2] },
      { construct: "ACC", format: FREE_PLAY_FORMATS.ACC[3] },
      { construct: "ACC", format: FREE_PLAY_FORMATS.ACC[6] },
    ],
  },
  {
    title: "Frame + Binding",
    detail: "Practise frame switching and colour conjunctions.",
    icon: "binding",
    items: [
      { construct: "ACC", format: FREE_PLAY_FORMATS.ACC[4] },
      { construct: "ACC", format: FREE_PLAY_FORMATS.ACC[5] },
      { construct: "BSE", format: FREE_PLAY_FORMATS.BSE[0] },
      { construct: "BSE", format: FREE_PLAY_FORMATS.BSE[1] },
      { construct: "BSE", format: FREE_PLAY_FORMATS.BSE[2] },
    ],
  },
];

function freePlayCellIcon(cell: CellKey): string {
  if (cell === "arrow_abs") return "target";
  if (cell === "flow_abs") return "transfer";
  if (cell === "arrow_rel") return "relational";
  if (cell === "flow_rel") return "pathway";
  return "list";
}

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
          <strong>Today's coached session</strong>
          <p>This implements the Trident G Far Transfer Protocol for guided progress.</p>
          ${button("Today's Session", "nav-today", "secondary")}
        </article>
        <article class="train-choice-card is-orange">
          <span>${miniIcon("target")}</span>
          <strong>Practice games</strong>
          <p>Try different games without changing your coached pathway or progress status.</p>
          ${button("Choose a game", "nav-free-play-formats", "secondary")}
        </article>
        <article class="train-choice-card is-green">
          <span>${miniIcon("chart")}</span>
          <strong>Training explained</strong>
          <p>See how the sessions connect and why they target cognitive control capacity.</p>
          ${button("Brain basis", "nav-training-map", "secondary")}
        </article>
      </div>
      <div class="free-play-copy">
        <strong>Coached session vs practice</strong>
        <span>Only the Today session advances the programme. Practice games are for familiarisation.</span>
      </div>
    </section>
  `);
}

function renderFreePlayFormats(): string {
  const card = (construct: Construct, format: FreePlayFormat) => `
    <button type="button" class="practice-format-card" data-free-construct="${construct}" data-free-cell="${format.cell}"${format.phase ? ` data-free-phase="${format.phase}"` : ""}>
      <span class="practice-format-icon" aria-hidden="true">${miniIcon(freePlayCellIcon(format.cell))}</span>
      <span class="practice-format-copy">
        <strong>${escapeHtml(format.label)}</strong>
        <small>${escapeHtml(format.detail)}</small>
      </span>
    </button>
  `;
  const group = (column: (typeof FREE_PLAY_COLUMNS)[number]) => {
    return `
      <section class="practice-format-group" aria-label="${column.title}">
        <div class="practice-format-heading">
          <span class="section-icon is-purple" aria-hidden="true">${miniIcon(column.icon)}</span>
          <span>
            <strong>${column.title}</strong>
            <small>${column.detail}</small>
          </span>
        </div>
        <div class="practice-format-grid">
          ${column.items.map((item) => card(item.construct, item.format)).join("")}
        </div>
      </section>
    `;
  };
  return shell(`
    ${appTabs("train")}
    <section class="train-screen free-play-formats-screen">
      <div class="practice-format-note">
        <strong>Free Play</strong>
        <span>Practice only - this does not advance phase, WAP readiness, or transfer scores.</span>
      </div>
      <div class="practice-format-layout">
        ${FREE_PLAY_COLUMNS.map((column) => group(column)).join("")}
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
      <div class="action-row">
        ${button("Preview first game", "begin-session")}
        ${button("Today's plan", "nav-today", "secondary")}
      </div>
    </section>
  `);
}

function activeTrial(): TrialDefinition | null {
  if (!state.sessionPlan) return null;
  const block = state.sessionPlan.miniBlocks[state.activeBlockIndex];
  if (!block) return null;
  return state.sessionPlan.trials.find(
    (trial) => trial.miniBlockId === block.id && trial.trialIndex === state.activeTrialIndex,
  ) || null;
}

function renderTaskCue(trial: TrialDefinition): string {
  const speedButton = (speed: CapacitySpeed, label: string) => `
    <button type="button" class="task-speed-button${trial.capacitySpeed === speed ? " is-active" : ""}" data-action="set-task-speed" data-speed="${speed}" aria-pressed="${trial.capacitySpeed === speed ? "true" : "false"}">${label}</button>
  `;
  return `
    <div class="task-stage-copy">
      <strong class="task-n-level">N=${trial.nLevel}</strong>
      <span class="task-speed-control" aria-label="Task speed">
        ${speedButton("slow", "Slow")}
        ${speedButton("fast", "Fast")}
      </span>
    </div>
  `;
}

function renderTask(): string {
  const trial = activeTrial();
  const block = state.sessionPlan?.miniBlocks[state.activeBlockIndex];
  if (!trial || !block) return renderToday();
  const blockProgress = state.activeTrialIndex + 1;
  const blockTotal = currentBlockTrialCount();
  const responseEnabled = state.taskStage === "stimulus" || state.taskStage === "mask" || state.taskStage === "response";
  return shell(`
    <section class="task-main">
      <div class="task-topline">
        <span>${escapeHtml(block.label)}</span>
        <span>${blockProgress} / ${blockTotal}</span>
      </div>
      <div class="task-progress"><span style="width:${((blockProgress - 1) / blockTotal) * 100}%"></span></div>
        <p class="ui-eyebrow">Block ${state.activeBlockIndex + 1} of ${state.sessionPlan?.miniBlocks.length || 1} - ${escapeHtml(block.label)}</p>
      <section class="task-stage is-${state.taskStage}">
        ${renderTaskCue(trial)}
        ${stimulusSvg(trial, state.taskStage)}
      </section>
      <div class="capacity-response-row task-responses">
        <button class="response-button is-control" data-action="pause-session">Pause</button>
        ${trial.responseOptions
          .map((option, index) => `<button class="response-button is-match${state.pendingTrialResponse === option ? " is-captured" : ""}" data-response="${escapeHtml(option)}" ${responseEnabled && !state.pendingTrialResponse ? "" : "disabled"}>${responseButtonContent(option, index, trial.responseOptions.length)}</button>`)
          .join("")}
        <button class="response-button is-stop" data-action="end-block">Stop</button>
      </div>
      <p class="task-footnote">${trial.construct === "BSE" ? "Track relation plus colour." : "Track the relation."} Tap MATCH for n-back repeats; withhold when it is not a match.</p>
    </section>
  `, { task: true });
}

function arrowPathData(): string {
  return "M0 -13 15 0 6 0 6 18 -6 18 -6 0 -15 0Z";
}

function tokenColorHex(color: string | null | undefined): string {
  if (color === "yellow") return "#d9a900";
  if (color === "green") return "#2f9e44";
  if (color === "purple") return "#7c3aed";
  if (color === "blue") return "#1d56d8";
  return "#ffffff";
}

function capacityCountdownMarkup(): string {
  if (state.taskStage !== "countdown") return "";
  return `<div class="capacity-countdown" aria-live="assertive">${escapeHtml(COUNTDOWN_STEPS[state.countdownStep] || COUNTDOWN_STEPS[0])}</div>`;
}

function renderCapacityMarkers(trial: TrialDefinition): string {
  return (trial.capacityDisplay.markerPositions || [])
    .map((point) => `<span class="capacity-hub-marker" style="left:${point.xPct}%;top:${point.yPct}%;"></span>`)
    .join("");
}

function resistVectorRotation(label: string | undefined): number {
  if (label === "Up") return -90;
  if (label === "Down") return 90;
  if (label === "Left") return 180;
  return 0;
}

function renderCapacityArrowToken(trial: TrialDefinition, visible: boolean): string {
  const point = trial.capacityDisplay.pointPct || { xPct: 50, yPct: 50 };
  const color = tokenColorHex(trial.capacityDisplay.colour || trial.colour);
  const rotation = resistVectorRotation(trial.capacityDisplay.symbolLabel);
  return `
    <div class="capacity-hub-token wm-arrow-token${visible ? "" : " is-hidden"}" style="left:${point.xPct}%;top:${point.yPct}%;color:${color};">
      <svg class="capacity-resist-arrow" viewBox="0 0 100 100" aria-hidden="true" style="transform:rotate(${rotation}deg);">
        <path d="M90 50 L50 90 L50 70 L10 70 L10 30 L50 30 L50 10 Z"></path>
      </svg>
    </div>
  `;
}

function renderRelateVectorToken(token: { pointPct: { xPct: number; yPct: number }; angleDeg: number; colour?: string | null }, visible: boolean): string {
  const rotationDeg = Number(token.angleDeg || 0) + 90;
  const color = tokenColorHex(token.colour);
  return `
    <div class="capacity-hub-token capacity-hub-token--relate${visible ? "" : " is-hidden"}" style="left:${token.pointPct.xPct}%;top:${token.pointPct.yPct}%;color:${color};">
      <svg class="capacity-relate-arrow" viewBox="0 0 48 48" aria-hidden="true" style="transform:rotate(${rotationDeg}deg);">
        <path d="M24 6 39 23H30V42H18V23H9L24 6Z"></path>
      </svg>
    </div>
  `;
}

function flowVectorForTrial(trial: TrialDefinition, x: number, y: number): { x: number; y: number } {
  const relation = trial.items[0]?.relation || "right";
  const dx = x - 50;
  const dy = y - 50;
  const len = Math.hypot(dx, dy) || 1;
  const radial = { x: dx / len, y: dy / len };
  if (relation === "left") return { x: -1, y: 0 };
  if (relation === "right") return { x: 1, y: 0 };
  if (relation === "up") return { x: 0, y: -1 };
  if (relation === "down") return { x: 0, y: 1 };
  if (relation === "out") return radial;
  if (relation === "in") return { x: -radial.x, y: -radial.y };
  if (relation === "cw") return { x: radial.y, y: -radial.x };
  return { x: -radial.y, y: radial.x };
}

function flowColorHex(trial: TrialDefinition): string {
  if (trial.construct === "BSE") return tokenColorHex(trial.capacityDisplay.colour || trial.colour);
  return "#dce8ff";
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function renderCentralFlowField(trial: TrialDefinition, visible: boolean): string {
  const color = flowColorHex(trial);
  const seed = Math.abs(hashString(trial.id));
  const relation = trial.items[0]?.relation || "right";
  const isContract = relation === "in";
  const isRotate = relation === "cw" || relation === "ccw";
  const isExpandOrContract = relation === "out" || relation === "in";
  const isTranslate = !isRotate && !isExpandOrContract;
  const translationVector = flowVectorForTrial(trial, 50, 50);
  const perpendicular = { x: -translationVector.y, y: translationVector.x };
  const shapes = Array.from({ length: 68 }, (_, index) => {
    const angle = ((index * 137.5 + seed) % 360) * Math.PI / 180;
    const depth = 0.32 + (((index * 53 + seed) % 100) / 99) * 0.68;
    const opacity = (trial.construct === "BSE" ? 0.58 : 0.66) + depth * 0.2;
    const duration = Math.round(1320 - depth * 520 + (index % 5) * 34);
    const delay = -((index * 47 + seed) % duration);
    const dotRadius = 0.22 + depth * 0.78;
    const baseRadial = 5 + ((index * 23 + seed) % 31);
    const baseX = 50 + Math.cos(angle) * baseRadial;
    const baseY = 50 + Math.sin(angle) * baseRadial;
    let fromX = baseX;
    let fromY = baseY;
    let toX = baseX;
    let toY = baseY;
    let orbitRotation = 0;
    let dotRadiusValues = `${dotRadius.toFixed(2)};${dotRadius.toFixed(2)}`;

    if (isTranslate) {
      const lateral = -36 + (((index * 29 + seed) % 100) / 99) * 72;
      const travel = 44;
      fromX = 50 - translationVector.x * travel + perpendicular.x * lateral;
      fromY = 50 - translationVector.y * travel + perpendicular.y * lateral;
      toX = 50 + translationVector.x * travel + perpendicular.x * lateral;
      toY = 50 + translationVector.y * travel + perpendicular.y * lateral;
    } else if (isExpandOrContract) {
      const innerRadius = 1.4 + (index % 4) * 0.7;
      const outerRadius = 44;
      const fromRadius = isContract ? outerRadius : innerRadius;
      const toRadius = isContract ? innerRadius : outerRadius;
      fromX = 50 + Math.cos(angle) * fromRadius;
      fromY = 50 + Math.sin(angle) * fromRadius;
      toX = 50 + Math.cos(angle) * toRadius;
      toY = 50 + Math.sin(angle) * toRadius;
      dotRadiusValues = isContract
        ? `${(dotRadius * 1.18).toFixed(2)};${(dotRadius * 0.42).toFixed(2)}`
        : `${(dotRadius * 0.42).toFixed(2)};${(dotRadius * 1.18).toFixed(2)}`;
    } else {
      const orbitRadius = 7 + ((index * 19 + seed) % 30);
      fromX = 50 + Math.cos(angle) * orbitRadius;
      fromY = 50 + Math.sin(angle) * orbitRadius;
      toX = fromX;
      toY = fromY;
      orbitRotation = relation === "cw" ? 360 : -360;
    }

    if (index % 5 === 0) {
      const patchWidth = 0.85 + depth * 1.55;
      const patchHeight = 0.46 + depth * 0.68;
      const rotation = (angle * 180) / Math.PI + (isRotate ? 84 : 0);
      if (isRotate) {
        return `<g class="central-flow-patch-node" transform="rotate(0 50 50)">
          <animateTransform attributeName="transform" type="rotate" values="0 50 50;${orbitRotation} 50 50" dur="${duration}ms" begin="${delay}ms" repeatCount="indefinite" />
          <g transform="translate(${fromX.toFixed(2)} ${fromY.toFixed(2)}) rotate(${rotation.toFixed(2)})">
            <rect class="central-flow-patch" x="${(-patchWidth / 2).toFixed(2)}" y="${(-patchHeight / 2).toFixed(2)}" width="${patchWidth.toFixed(2)}" height="${patchHeight.toFixed(2)}" rx="0.32" fill="${color}" opacity="${visible ? opacity.toFixed(2) : "0"}"></rect>
          </g>
        </g>`;
      }
      return `<g class="central-flow-patch-node" transform="translate(${fromX.toFixed(2)} ${fromY.toFixed(2)})">
        <animateTransform attributeName="transform" type="translate" values="${fromX.toFixed(2)} ${fromY.toFixed(2)};${toX.toFixed(2)} ${toY.toFixed(2)}" dur="${duration}ms" begin="${delay}ms" repeatCount="indefinite" />
        <g transform="rotate(${rotation.toFixed(2)})">
          <rect class="central-flow-patch" x="${(-patchWidth / 2).toFixed(2)}" y="${(-patchHeight / 2).toFixed(2)}" width="${patchWidth.toFixed(2)}" height="${patchHeight.toFixed(2)}" rx="0.32" fill="${color}" opacity="${visible ? opacity.toFixed(2) : "0"}">
          </rect>
        </g>
      </g>`;
    }
    if (isRotate) {
      return `<g class="central-flow-dot-node" transform="rotate(0 50 50)">
        <animateTransform attributeName="transform" type="rotate" values="0 50 50;${orbitRotation} 50 50" dur="${duration}ms" begin="${delay}ms" repeatCount="indefinite" />
        <circle class="central-flow-dot" cx="${fromX.toFixed(2)}" cy="${fromY.toFixed(2)}" r="${dotRadius.toFixed(2)}" fill="${color}" opacity="${visible ? opacity.toFixed(2) : "0"}"></circle>
      </g>`;
    }
    return `<circle class="central-flow-dot" cx="${fromX.toFixed(2)}" cy="${fromY.toFixed(2)}" r="${dotRadius.toFixed(2)}" fill="${color}" opacity="${visible ? opacity.toFixed(2) : "0"}">
      <animate attributeName="cx" values="${fromX.toFixed(2)};${toX.toFixed(2)}" dur="${duration}ms" begin="${delay}ms" repeatCount="indefinite" />
      <animate attributeName="cy" values="${fromY.toFixed(2)};${toY.toFixed(2)}" dur="${duration}ms" begin="${delay}ms" repeatCount="indefinite" />
      ${isExpandOrContract ? `<animate attributeName="r" values="${dotRadiusValues}" dur="${duration}ms" begin="${delay}ms" repeatCount="indefinite" />` : ""}
    </circle>`;
  }).join("");
  return `
    <svg class="central-flow-svg" viewBox="0 0 100 100" aria-hidden="true">
      <defs><clipPath id="flow-disk-${safeSvgId(trial.id)}"><circle cx="50" cy="50" r="39" /></clipPath></defs>
      <circle class="central-flow-disk" cx="50" cy="50" r="39" />
      <g clip-path="url(#flow-disk-${safeSvgId(trial.id)})">${visible ? shapes : ""}</g>
      <circle class="central-flow-ring" cx="50" cy="50" r="39" />
    </svg>
  `;
}

function hashString(input: string): number {
  let hash = 0;
  for (let index = 0; index < input.length; index += 1) hash = Math.imul(31, hash) + input.charCodeAt(index);
  return hash >>> 0;
}

function capacityArenaSvg(trial: TrialDefinition, stage: TaskStage): string {
  const visible = stage === "stimulus" || stage === "response";
  const countdown = capacityCountdownMarkup();
  const wrapperClass = trial.capacityWrapper === "relate_vectors" ? "is-relate" : trial.capacityWrapper === "optic_flow" ? "is-flow" : "is-resist";
  const content = trial.capacityWrapper === "optic_flow"
    ? renderCentralFlowField(trial, visible)
    : trial.capacityWrapper === "relate_vectors"
      ? (trial.capacityDisplay.pairTokens || []).map((token) => renderRelateVectorToken(token, visible)).join("")
      : renderCapacityArrowToken(trial, visible);
  return `
    <div class="stimulus-wrap capacity-hub-wrap" aria-label="N-back display">
      <div class="capacity-hub-arena ${wrapperClass}">
        <div class="capacity-hub-ring"></div>
        ${trial.capacityWrapper === "optic_flow" ? "" : renderCapacityMarkers(trial)}
        ${countdown}
        ${content}
      </div>
    </div>
  `;
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
  const showFlow = stage === "stimulus" || stage === "response";
  const clipId = `optic-clip-${safeSvgId(trial.id)}`;
  return `
    <div class="stimulus-wrap is-flow" aria-label="Brief optic-flow display">
      <svg class="stimulus-svg optic-task-svg" viewBox="0 0 100 100" role="img" aria-hidden="true">
        <circle cx="50" cy="50" r="34" class="orbit-line" />
        ${showFlow ? `<g class="optic-apertures">${renderOpticFlowApertures(trial, clipId)}</g>` : ""}
        ${stage === "mask" ? `<g class="optic-apertures is-mask">${renderOpticFlowMaskApertures(trial, clipId)}</g>` : ""}
        ${showFixation ? renderFixation() : ""}
      </svg>
    </div>
  `;
}

function stimulusSvg(trial: TrialDefinition, stage: TaskStage): string {
  if (trial.capacityWrapper) return capacityArenaSvg(trial, stage);
  if (trial.cellKey.includes("flow")) return flowStimulusSvg(trial, stage);

  const showFixation = stage === "ready" || stage === "fixation" || stage === "stimulus";
  const showArrows = stage === "stimulus" || stage === "response";
  const showMasks = stage === "mask";
  const arrows = trial.items
    .map((item) => {
      const angle = vectorAngleDegrees(item.vector);
      const color = item.color === "yellow" ? "#d9a900" : item.color === "green" ? "#2f9e44" : item.color === "purple" ? "#7c3aed" : item.color === "blue" ? "#1d56d8" : "currentColor";
      return `
        <g transform="translate(${item.position.x} ${item.position.y}) rotate(${angle})">
          <path class="wm-nback-arrow" d="${arrowPathData()}" fill="${color}" />
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

function colorForResponse(option: string): "blue" | "yellow" {
  return option.endsWith("_yellow") ? "yellow" : "blue";
}

function responseTargetIcon(option: string): string {
  const relation = relationForResponse(option);
  const color = colorForResponse(option);
  const common = `viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"`;
  const arrow = (path: string) => `<svg ${common} aria-hidden="true">${path}</svg>`;
  const path =
    relation === "left"
      ? `<path d="M22 16H9"/><path d="M14 10l-6 6 6 6"/>`
      : relation === "right"
        ? `<path d="M10 16h13"/><path d="M18 10l6 6-6 6"/>`
        : relation === "out"
          ? `<path d="M16 16 7 7"/><path d="M7 7h7"/><path d="M7 7v7"/><path d="M16 16l9-9"/><path d="M25 7h-7"/><path d="M25 7v7"/>`
          : relation === "in"
            ? `<path d="M6 6l9 9"/><path d="M15 15H8"/><path d="M15 15V8"/><path d="M26 6l-9 9"/><path d="M17 15h7"/><path d="M17 15V8"/>`
            : relation === "cw"
              ? `<path d="M8 10a9 9 0 0 1 14 2"/><path d="M22 6v6h-6"/>`
              : relation === "ccw"
                ? `<path d="M24 10a9 9 0 0 0-14 2"/><path d="M10 6v6h6"/>`
                : `<path d="M10 16h12"/><path d="M18 10l6 6-6 6"/>`;
  return `<span class="response-target-icon is-${color} is-${escapeHtml(relation)}">${arrow(path)}</span>`;
}

function responseButtonContent(option: string, index: number, optionCount: number): string {
  const label = labelForResponse(option);
  if (optionCount === 1) {
    return `<span class="response-label">${label}</span>`;
  }
  if (optionCount === 2 || optionCount === 4) {
    return `<span class="response-label">${label}</span>${responseTargetIcon(option)}`;
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
      <div class="action-row">
        ${button("Practice first", "start-block-practice", "secondary")}
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
  const isPreparedPractice = state.sessionMode === "free" && !state.guidedReturn;
  const backAction = state.sessionSource === "free_play" ? "nav-free-play-formats" : "nav-today";
  return shell(`
    <section class="panel practice-intro-panel">
      <div class="practice-intro-copy">
        <h1>${escapeHtml(copy.title)}</h1>
        <p class="ui-body">${escapeHtml(copy.body)}</p>
      </div>
      <section class="practice-preview-card">
        <p class="task-preview-question">${escapeHtml(questionForTrial(example))}</p>
        ${stimulusSvg(example, "stimulus")}
        <div class="response-grid practice-answer-grid">
          ${example.responseOptions.map((option) => `<span class="practice-answer">${labelForResponse(option)}</span>`).join("")}
        </div>
      </section>
      <section class="mini-steps practice-mini-steps">
        <span>${block.construct === "BSE" ? "Keep relation + colour linked" : "Track the relation"}</span>
        <span>Press MATCH for repeats</span>
        <span>Withhold for non-matches</span>
      </section>
      <div class="ui-tip-card practice-tip-card">
        <span class="tip-symbol">i</span>
        <p>${escapeHtml(copy.tip)} ${isPreparedPractice ? "Practice is short and does not change your guided progress." : "You will get 10 practice trials before the guided block."}</p>
      </div>
      <div class="action-row">
        ${
          isPreparedPractice
            ? `${button("Start practice", "resume-block")}${button("Back", backAction, "secondary")}`
            : `${button(`Start practice block ${block.index}`, "begin-block-practice")}${button(`Begin training block ${block.index}`, "resume-block", "secondary")}${button("Back to block options", "nav-block-options", "ghost")}`
        }
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
      <section class="panel result-panel">
        <p class="ui-eyebrow">${isSetupPractice ? "Practice block complete" : isEasierPractice ? "Easier practice complete" : "Practice complete"}</p>
        <h1>${isSetupPractice ? `Ready for training block ${returnIndex + 1}` : isEasierPractice ? "Practice kept the session warm" : `${Math.round((correct / total) * 100)}% correct`}</h1>
        <p class="ui-body">${
          isSetupPractice
            ? "Practice helps you learn the display. It does not change your session number, phase, or transfer score."
            : isEasierPractice
              ? "Practice helps you learn the display. It does not change your session number, phase, or transfer score."
              : "Practice helps you learn the display. It does not change your session number, phase, or transfer score."
        }</p>
        <div class="action-row">
          ${isSetupPractice ? button(`Begin training block ${returnIndex + 1}`, "finish-practice-begin-block") : button("Choose another practice", "nav-free-play")}
          ${button(isSetupPractice ? "Back to block options" : "Return to Today", isSetupPractice ? "finish-practice-back-to-block" : "finish-complete", "secondary")}
        </div>
      </section>
    `);
  }
  const completedCount = guidedSessionsCompleted();
  if (completedCount >= TARGET_ENVELOPE_SESSIONS) {
    return shell(`
      <section class="panel result-panel programme-complete-card">
        <p class="ui-eyebrow">${TARGET_ENVELOPE_SESSIONS}-session programme complete</p>
        <h1>Congratulations</h1>
        <p class="ui-body">You completed the guided ${TARGET_ENVELOPE_SESSIONS}-session Working Memory Coach programme.</p>
        ${programmeProgressCard()}
        <div class="action-row">
          ${button("View progress", "nav-progress")}
          ${button(`Start another ${TARGET_ENVELOPE_SESSIONS} sessions`, "restart-guided-programme", "secondary")}
          ${button("Practice only", "start-easier-instructions", "ghost")}
        </div>
      </section>
    `);
  }
  if (state.progress.sessionNumber === 6 && state.progress.profileRevealSeen) {
    return shell(`
      <section class="panel result-panel">
        <p class="ui-eyebrow">Session 5 complete</p>
        <h1>Your pattern is becoming clearer.</h1>
        <p class="ui-body">The app now has enough sessions to start showing how your Working Memory session is developing.</p>
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
      ${programmeProgressCard()}
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
        <div class="action-row">${button("Brain basis", "nav-training-map", "secondary")}</div>
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
  return renderBrainBasis();
}

function renderBrainBasis(): string {
  return shell(`
    <section class="evidence-screen brain-basis-screen">
      <figure class="brain-pathway-strip" aria-label="Training pathway from simple practice to portable Working Memory skill">
        <img
          src="${assetPath("trident-g-far-transfer-protocol.png")}"
          alt="Start simple, change the display, keep the same rule, mix formats, and use the skill more widely."
          width="1433"
          height="213"
        />
      </figure>
      <article class="evidence-visual-card evidence-brain-card">
        ${brainNetworkDiagram()}
        <p>Working Memory Coach is evidence-informed, not a clinical assessment. The design is based on Working Memory-control training, adaptive visual-Working Memory measurement, relational processing, motion-format transfer and delayed re-checks.</p>
      </article>
      <div class="evidence-principle-grid">
        <article class="evidence-principle-card is-blue">
          <span>${miniIcon("signal")}</span>
          <strong>Relational Memory</strong>
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
    </section>
  `);
}

function renderTransferModel(): string {
  return renderBrainBasis();
}

function renderEvidence(): string {
  return renderBrainBasis();
}

const PROOF_DOMAIN_LABELS: Record<ProofBenchmarkDomain, string> = {
  relational_memory: "Relational Memory Benchmark",
  binding_memory: "Binding Memory Benchmark",
  reasoning: "Reasoning Benchmark",
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
    relational_memory: "Relational",
    binding_memory: "Binding",
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
        <h2>Private benchmark note</h2>
        <p>Use this for your own external benchmark records. Entries stay separate from Working Memory Coach training scores and are not certificates, credentials, or institutional reports.</p>
      </div>
      <label>Domain
        <select id="proof-domain">
          ${optionTags(PROOF_DOMAIN_LABELS, editing?.domain || "relational_memory")}
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
    ${appTabs("progress")}
    ${progressDashboardSegmentedControl("proof")}
    <section class="proof-screen proof-overview-screen no-scroll-screen">
      <div class="proof-hero">
        <p class="ui-eyebrow">Proof</p>
        <h1>Valid external tests</h1>
        <p>Prove your gains with G Track's short psychometric tests.</p>
      </div>
      <section class="proof-summary-grid">
        ${proofSummaryCard("relational_memory")}
        ${proofSummaryCard("binding_memory")}
        ${proofSummaryCard("reasoning")}
      </section>
      <section class="overview-next-card proof-next-card">
        <p><strong>Private records only.</strong> The app does not verify, certify, or transmit these scores to organisations.</p>
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
    ${appTabs("progress")}
    ${progressDashboardSegmentedControl("proof")}
    <section class="proof-screen proof-entry-screen">
      <div class="proof-hero compact-page-header">
        <p class="ui-eyebrow">Private benchmark entry</p>
        <h1>Manual records.</h1>
        <p>Entries stay separate from training scores and are never labelled as IQ improvement, credentials, or selection evidence.</p>
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
  if (cloudSyncActive()) {
    void saveProofBenchmark(entry).catch((error) => {
      console.warn("Proof benchmark was not synced.", error);
      markSync("error", "Benchmark entry could not be synced.");
    });
  }
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
  metric: ProgressScoreMetric;
  label: string;
  subtitle: string;
  rawScore: number | null;
  scoreDelta: number | null;
  baseline: number | null;
  status: string;
  statusNote: string;
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
  capacityNLevel: number | null;
  capacityStatus: string;
  capacityNote: string;
  nextSupportRoute: string;
  transferRawScore: number | null;
  transferDelta: number | null;
  transferBaseline: number | null;
  confidence: string;
  trend: Array<{ session: string; score: number | null; transfer: number | null }>;
  transferTrend: Array<{ session: string; delta: number | null }>;
  skills: DashboardSkillModel[];
  transferDetails: DashboardTransferModel[];
};

function evidenceFor(construct: Construct, cellKey: CellKey): CellEvidence | null {
  return state.progress.evidence.find((item) => item.construct === construct && item.cellKey === cellKey) || null;
}

function scoreForEvidence(construct: Construct, cellKey: CellKey): number | null {
  const evidence = evidenceFor(construct, cellKey);
  return nLevelScore(evidence?.stableNLevel ?? evidence?.currentNLevel ?? evidence?.currentCapacityBps ?? null);
}

function averageScore(values: Array<number | null>): number | null {
  const available = values.filter((value): value is number => value !== null);
  if (available.length === 0) return null;
  return Math.round(available.reduce((total, value) => total + value, 0) / available.length);
}

function nLevelScore(nLevel: number | null): number | null {
  if (nLevel === null) return null;
  return Math.round(nLevel);
}

function changeFromStart(score: number | null): number | null {
  return score === null ? null : score - 100;
}

function statusForScore(score: number | null, focus = false): string {
  if (score === null) return "Calibrating";
  if (focus) return "Bottleneck";
  if (score >= 4) return "Strong";
  if (score < 2) return "Bottleneck";
  if (score < 3) return "Watch";
  return "Developing";
}

function statusForDelta(delta: number | null): string {
  if (delta === null) return "Calibrating";
  if (delta >= 8) return "Strong";
  if (delta <= -8) return "Bottleneck";
  if (delta < 0) return "Watch";
  return "Developing";
}

function statusNoteFor(status: string): string {
  if (status === "Strong") return "Stable enough to build on.";
  if (status === "Watch") return "Needs more consistency.";
  if (status === "Bottleneck") return "May be limiting far transfer.";
  if (status === "Developing") return "Evidence is building.";
  return "More guided transfer data needed.";
}

function transferStatus(score: number | null): string {
  if (score === null) return "Calibrating";
  if (score >= 8) return "Strong";
  if (score >= 0) return "Developing";
  if (score >= -7) return "Watch";
  return "Bottleneck";
}

function scoreForEvidenceSet(evidence: CellEvidence[], construct: Construct, cellKey: CellKey): number | null {
  const item = evidence.find((entry) => entry.construct === construct && entry.cellKey === cellKey);
  return nLevelScore(item?.currentNLevel ?? item?.currentCapacityBps ?? null);
}

function averageNullableScores(values: Array<number | null>): number | null {
  const available = values.filter((value): value is number => value !== null);
  if (available.length === 0) return null;
  return Math.round(available.reduce((total, value) => total + value, 0) / available.length);
}

function scoreHistoryEntryFromState(input: {
  sessionNumber: number;
  completedAt: string;
  phase: PhaseLabel;
  evidence: CellEvidence[];
  snapshot: ReturnType<typeof createScoreSnapshot>;
}): ProgressScoreHistoryEntry {
  const activeCell = PHASE_CELL[input.phase];
  const patternBinding =
    scoreForEvidenceSet(input.evidence, "BSE", activeCell) ||
    scoreForEvidenceSet(input.evidence, "BSE", "arrow_abs") ||
    scoreForEvidenceSet(input.evidence, "BSE", "flow_abs") ||
    scoreForEvidenceSet(input.evidence, "BSE", "arrow_rel") ||
    scoreForEvidenceSet(input.evidence, "BSE", "flow_rel");
  return {
    sessionNumber: input.sessionNumber,
    completedAt: input.completedAt,
    phase: input.phase,
    programmeRunId: state.progress.programmeRunId,
    programmeCycle: state.progress.programmeCycle,
    metrics: {
      transfer: input.snapshot.transfer.score,
      cognitiveBandwidth: scoreForEvidenceSet(input.evidence, "ACC", "arrow_abs"),
      frameBandwidth: scoreForEvidenceSet(input.evidence, "ACC", "arrow_rel"),
      patternBinding,
      wrapperRecovery: averageNullableScores([
        input.snapshot.transfer.motionRecovery.score,
        input.snapshot.transfer.relationRecovery.score,
      ]),
      delayedRecovery: input.snapshot.transfer.returnStrength.score,
    },
  };
}

function baselineForMetric(metric: ProgressScoreMetric, current: number | null): number | null {
  const values = (state.progress.scoreHistory || [])
    .map((entry) => entry.metrics?.[metric] ?? null)
    .filter((value): value is number => value !== null)
    .slice(0, 3);
  if (values.length > 0) return Math.round(values.reduce((total, value) => total + value, 0) / values.length);
  return current;
}

function deltaFromBaseline(metric: ProgressScoreMetric, current: number | null): { baseline: number | null; delta: number | null } {
  const baseline = baselineForMetric(metric, current);
  return {
    baseline,
    delta: current === null || baseline === null ? null : Math.round(current - baseline),
  };
}

function transferDeltaTrend(current: number | null): Array<{ session: string; delta: number | null }> {
  const baseline = baselineForMetric("transfer", current);
  const historyPoints = (state.progress.scoreHistory || [])
    .filter((entry) => entry.metrics?.transfer !== null && entry.metrics?.transfer !== undefined)
    .slice(-20)
    .map((entry) => ({
      session: `S${entry.sessionNumber}`,
      delta: baseline === null ? null : Math.round((entry.metrics.transfer || 0) - baseline),
    }));
  if (historyPoints.length > 0) return historyPoints;
  return [{ session: "Now", delta: current === null || baseline === null ? null : Math.round(current - baseline) }];
}

function confidenceForEvidence(evidence: CellEvidence | null): string {
  if (!evidence || evidence.validTrials < 80) return "";
  if (evidence.timingQuality === "poor") return "Measured cautiously";
  if (evidence.validTrials < 240) return "Early read";
  return evidence.validTrials >= 360 ? "Reliable" : "Becoming reliable";
}

function capacityStatusForModel(input: { capacityN: number | null; transferScore: number | null; confidence: string }): string {
  if (input.capacityN === null || !input.confidence) return "Calibrating";
  if (input.transferScore !== null && input.transferScore >= 80) return "Transfer holding";
  if (input.transferScore !== null) return "Transfer developing";
  return "N-level emerging";
}

function capacityNoteForStatus(status: string): string {
  if (status === "Transfer holding") return "Stable task structure is surviving format changes.";
  if (status === "Transfer developing") return "Capacity is present; transfer evidence is still being built.";
  if (status === "N-level emerging") return "Stable N-level is emerging before full transfer evidence.";
  return "Guided sessions are still building a baseline.";
}

function nextSupportRouteForStatus(status: string): string {
  if (status === "Transfer holding") return "Next: add mixed, delayed, or proof checks.";
  if (status === "Transfer developing") return "Next: continue the guided transfer route.";
  if (status === "N-level emerging") return "Next: keep the daily guided route stable.";
  return "Next: complete more guided sessions.";
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
  const wrapperRecoveryScore = averageScore([
    snapshot?.transfer.motionRecovery.score ?? null,
    snapshot?.transfer.relationRecovery.score ?? null,
  ]);
  const returnScore = snapshot?.transfer.returnStrength.score ?? null;
  const overallScore = snapshot?.workingMemoryControl.trainingScore ?? null;
  const transferReadiness = snapshot?.transfer.score ?? null;
  const transferRelative = deltaFromBaseline("transfer", transferReadiness);
  const cognitiveRelative = deltaFromBaseline("cognitiveBandwidth", signalScore);
  const frameRelative = deltaFromBaseline("frameBandwidth", relationalScore);
  const bindingRelative = deltaFromBaseline("patternBinding", bindingScore);
  const wrapperRelative = deltaFromBaseline("wrapperRecovery", wrapperRecoveryScore);
  const delayedRelative = deltaFromBaseline("delayedRecovery", returnScore);
  const confidence = confidenceForEvidence(state.progress.evidence.find((item) => item.construct === "ACC") || null);
  const capacityStatus = capacityStatusForModel({ capacityN: signalScore, transferScore: transferReadiness, confidence });
  return {
    capacityNLevel: signalScore,
    capacityStatus,
    capacityNote: capacityNoteForStatus(capacityStatus),
    nextSupportRoute: nextSupportRouteForStatus(capacityStatus),
    transferRawScore: transferReadiness,
    transferDelta: transferRelative.delta,
    transferBaseline: transferRelative.baseline,
    confidence,
    trend: [
      { session: "Start", score: overallScore === null ? null : 100, transfer: null },
      { session: `S${Math.max(1, state.progress.sessionNumber - 1)}`, score: overallScore, transfer: transferReadiness },
    ],
    transferTrend: transferDeltaTrend(transferReadiness),
    skills: [
      {
        metric: "cognitiveBandwidth",
        label: "Relational Control",
        subtitle: "Keep the n-back relation stable across arrow and optic-flow displays.",
        rawScore: signalScore,
        scoreDelta: cognitiveRelative.delta,
        baseline: cognitiveRelative.baseline,
        status: statusForDelta(cognitiveRelative.delta),
        statusNote: statusNoteFor(statusForDelta(cognitiveRelative.delta)),
        confidence: confidenceForEvidence(evidenceFor("ACC", "arrow_abs")),
        tone: "blue",
        icon: "signal",
      },
      {
        metric: "frameBandwidth",
        label: "Frame Transfer",
        subtitle: "Keep the task rule stable when the frame changes from absolute to relational.",
        rawScore: relationalScore,
        scoreDelta: frameRelative.delta,
        baseline: frameRelative.baseline,
        status: statusForDelta(frameRelative.delta),
        statusNote: statusNoteFor(statusForDelta(frameRelative.delta)),
        confidence: confidenceForEvidence(evidenceFor("ACC", "arrow_rel")),
        tone: "purple",
        icon: "relational",
      },
      {
        metric: "patternBinding",
        label: "Binding Under Interference",
        subtitle: "Keep relation and colour bound together while the n-back demand continues.",
        rawScore: bindingScore,
        scoreDelta: bindingRelative.delta,
        baseline: bindingRelative.baseline,
        status: statusForDelta(bindingRelative.delta),
        statusNote: statusNoteFor(statusForDelta(bindingRelative.delta)),
        confidence:
          confidenceForEvidence(evidenceFor("BSE", activeCell)) ||
          confidenceForEvidence(state.progress.evidence.find((item) => item.construct === "BSE") || null),
        tone: "teal",
        icon: "binding",
      },
      {
        metric: "wrapperRecovery",
        label: "Wrapper Recovery",
        subtitle: "Recover the same control skill when the display format changes.",
        rawScore: wrapperRecoveryScore,
        scoreDelta: wrapperRelative.delta,
        baseline: wrapperRelative.baseline,
        status: statusForDelta(wrapperRelative.delta),
        statusNote: statusNoteFor(statusForDelta(wrapperRelative.delta)),
        confidence: confidenceForEvidence(evidenceFor("ACC", "mixed")),
        tone: "orange",
        icon: "transfer",
      },
      {
        metric: "delayedRecovery",
        label: "Delayed Recovery",
        subtitle: "Return to a trained skill after interruption or delay.",
        rawScore: returnScore,
        scoreDelta: delayedRelative.delta,
        baseline: delayedRelative.baseline,
        status: statusForDelta(delayedRelative.delta),
        statusNote: statusNoteFor(statusForDelta(delayedRelative.delta)),
        confidence: snapshot?.transfer.returnStrength.score === null ? "" : consumerStatus(snapshot?.transfer.returnStrength.confidence),
        tone: "green",
        icon: "return",
      },
    ],
    transferDetails: [
      {
        label: "Wrapper Recovery",
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
        label: "Wrapper Switching",
        shortLabel: "Switching",
        score: snapshot?.transfer.mixedFlexibility.score ?? null,
        change: null,
        helper: "How well you stay stable when formats alternate.",
        tone: "orange",
      },
      {
        label: "Delayed Recovery",
        shortLabel: "Return",
        score: snapshot?.transfer.returnStrength.score ?? null,
        change: null,
        helper: "How well the skill returns after spacing or re-checks.",
        tone: "green",
      },
    ],
  };
}

function progressDashboardSegmentedControl(active: ProgressDashboardMode | "proof"): string {
  return `
    <div class="progress-segmented" aria-label="Progress dashboard view">
      <button class="${active !== "overview" ? "is-active" : ""}" data-action="nav-progress-overview">
        <span class="segment-icon" aria-hidden="true">${miniIcon("chart")}</span>
        Overview
      </button>
      <button class="${active !== "proof" ? "is-active" : ""}" data-action="nav-proof">
        <span class="segment-icon" aria-hidden="true">${miniIcon("list")}</span>
        Proof
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
  return value === null ? "--" : signedValue(value);
}

function dashboardNLevel(value: number | null): string {
  return value === null ? "--" : `${value}`;
}

function dashboardChange(value: number | null): string {
  return value === null ? "" : signedValue(value);
}

function dashboardPercent(value: number | null): number {
  return value === null ? 0 : clampPercent(value);
}

function dashboardDeltaPercent(value: number | null): number {
  return value === null ? 0 : clampPercent(50 + value * 2.5);
}

function transferPillTone(status: string): string {
  if (status === "Strong" || status === "Transfer holding") return "green";
  if (status === "Bottleneck") return "red";
  if (status === "Calibrating" || status === "N-level emerging") return "blue";
  return "orange";
}

function progressStatusTone(status: string): string {
  if (status === "Strong") return "green";
  if (status === "Bottleneck") return "red";
  if (status === "Calibrating") return "blue";
  return "orange";
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
    brain: `<svg ${common}><path d="M9 4c-2.3 0-4 1.7-4 3.8 0 .6.1 1.1.4 1.6A3.7 3.7 0 0 0 4 16c0 2 1.6 3.6 3.6 3.6.5 0 1-.1 1.4-.3.7 1 1.7 1.7 3 1.7V5.8C11.4 4.7 10.3 4 9 4Z"/><path d="M15 4c2.3 0 4 1.7 4 3.8 0 .6-.1 1.1-.4 1.6A3.7 3.7 0 0 1 20 16c0 2-1.6 3.6-3.6 3.6-.5 0-1-.1-1.4-.3-.7 1-1.7 1.7-3 1.7V5.8C12.6 4.7 13.7 4 15 4Z"/></svg>`,
    check: `<svg ${common}><circle cx="12" cy="12" r="9"/><path d="M8 12.5l2.5 2.5L16 9"/></svg>`,
    watch: `<svg ${common}><circle cx="12" cy="12" r="9"/><path d="M8 12h8"/><path d="M8 16h8"/><path d="M12 7v3"/></svg>`,
    alert: `<svg ${common}><circle cx="12" cy="12" r="9"/><path d="M12 7v6"/><path d="M12 17h.01"/></svg>`,
    calibrate: `<svg ${common}><path d="M4 12a8 8 0 0 1 8-8"/><path d="M20 12a8 8 0 0 1-8 8"/><path d="M12 4V2"/><path d="M12 22v-2"/><circle cx="12" cy="12" r="3"/></svg>`,
    shield: `<svg ${common}><path d="M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6l7-3z"/><path d="M9 12l2 2 4-5"/></svg>`,
    pathway: `<svg ${common}><path d="M5 17c2-6 12 0 14-8"/><circle cx="5" cy="17" r="2"/><circle cx="19" cy="9" r="2"/></svg>`,
    flag: `<svg ${common}><path d="M6 21V4"/><path d="M6 4h11l-2 4 2 4H6"/></svg>`,
    rocket: `<svg ${common}><path d="M5 19c3-1 6-3 8-6s3-6 6-8c-1 4-3 7-6 10s-6 5-10 6c1-1 1-2 2-2z"/><path d="M9 15l-2 2"/><path d="M14 10l2-2"/></svg>`,
  };
  return icons[name] || icons.chart;
}

function statusIconName(status: string): string {
  if (status === "Strong") return "check";
  if (status === "Bottleneck") return "alert";
  if (status === "Calibrating") return "calibrate";
  return "watch";
}

function transferDeltaSparkline(points: Array<{ session: string; delta: number | null }>): string {
  const width = 170;
  const height = 60;
  const available = points.filter((point): point is { session: string; delta: number } => point.delta !== null);
  const chartPoints = available.length > 0 ? available : [{ session: "Now", delta: 0 }];
  const yFor = (value: number) => 54 - (clampPercent(50 + value * 2.5) / 100) * 48;
  const xFor = (index: number) => chartPoints.length === 1 ? 154 : 7 + (index / (chartPoints.length - 1)) * 147;
  const path = chartPoints.map((point, index) => `${index === 0 ? "M" : "L"} ${xFor(index).toFixed(1)} ${yFor(point.delta).toFixed(1)}`).join(" ");
  const last = chartPoints[chartPoints.length - 1];
  const lastX = xFor(chartPoints.length - 1);
  const lastY = yFor(last.delta);
  return `
    <svg viewBox="0 0 ${width} ${height}" fill="none" aria-hidden="true">
      <line x1="6" x2="164" y1="${yFor(0).toFixed(1)}" y2="${yFor(0).toFixed(1)}" stroke="#dce5f4" stroke-width="2" stroke-dasharray="4 5" />
      <path d="${path}" stroke="#3b6fe0" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
      <circle cx="${lastX.toFixed(1)}" cy="${lastY.toFixed(1)}" r="5" fill="#3b6fe0" />
    </svg>
  `;
}

function renderCoaching(): string {
  return shell(`
    ${appTabs("coaching")}
    <section class="coaching-screen">
      <div class="coaching-hero">
        <p class="ui-eyebrow">Cognitive coaching</p>
        <h1>Add a coach to your training.</h1>
        <p>Book a short review to understand your progress, choose the right pace, and decide what to do next.</p>
        <div class="coaching-actions">
          ${button("Book cognitive coaching", "open-coaching-checkout")}
          ${button("What will my coach see?", "nav-data-rights", "secondary")}
        </div>
      </div>
      <section class="coaching-value-grid" aria-label="What coaching adds">
        <article>
          <span>${miniIcon("chart")}</span>
          <strong>Review your progress</strong>
          <p>Your coach reviews your training pattern, identifies possible cognitive bottlenecks, and explains what they may mean in plain English.</p>
        </article>
        <article>
          <span>${miniIcon("pathway")}</span>
          <strong>Plan next steps</strong>
          <p>Get clear guidance on whether to continue, slow down, repeat a step, change focus, or take a break.</p>
        </article>
        <article>
          <span>${miniIcon("signal")}</span>
          <strong>Understand your results</strong>
          <p>See what looks reliable, what is still settling, and what needs more sessions before it can be interpreted confidently.</p>
        </article>
        <article>
          <span>${miniIcon("shield")}</span>
          <strong>Use proof carefully</strong>
          <p>Talk through outside test results, progress checks, and what they can &mdash; and cannot &mdash; show.</p>
        </article>
      </section>
      <figure class="coaching-protocol-strip">
        <img
          src="${assetPath("trident-g-far-transfer-protocol.png")}"
          alt="Trident G far transfer protocol pathway: start simple, change the display, keep the same rule, mix formats, and use the skill more widely."
          width="1433"
          height="213"
        />
      </figure>
    </section>
  `);
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
    <svg class="dashboard-trend-svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="Overall Working Memory Score and Transfer Readiness trend">
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

function metricBoundaryStrip(): string {
  return `
    <section class="metric-boundary-strip">
      <span>${miniIcon("shield")}Capacity evidence only</span>
      <small>These are context-limited Trident-G training estimates: stable N-level, transfer checks, timing quality and confidence. They are not IQ scores, diagnoses, credentials, or selection evidence.</small>
    </section>
  `;
}

function progressProofAccessCard(): string {
  return `
    <section class="progress-proof-card">
      <div>
        <span>${miniIcon("shield")}</span>
        <strong>Proof records</strong>
        <p>Keep external test entries separate from daily training scores and review them from Progress.</p>
      </div>
      <div class="dashboard-actions proof-actions">
        ${button("Proof overview", "nav-proof", "secondary")}
        ${button("Add entry", "nav-proof-entry", "ghost")}
      </div>
    </section>
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
          <strong class="skill-score ${dashboardToneClass(skill.tone)}">${dashboardScore(skill.scoreDelta)}</strong>
          <strong class="skill-change ${skill.scoreDelta === null || skill.scoreDelta >= 0 ? "is-up" : "is-down"}">Δ</strong>
          ${statusChip(skill.status, skill.tone)}
          <span class="skill-confidence">${confidenceDot(skill.tone, skill.confidence)}</span>
        </div>
      `,
    )
    .join("");
}

function renderProgressLevelCards(model: ProgressDashboardPresentationModel): string {
  return model.skills
    .filter((skill) => skill.label !== "Wrapper Recovery" && skill.label !== "Delayed Recovery")
    .map((skill, index) => {
      const statusTone = progressStatusTone(skill.status);
      return `
        <article class="progress-level-card ${dashboardToneClass(skill.tone)} is-status-${statusTone}">
          <div class="progress-level-badge">${index + 1}</div>
          <div class="progress-level-icon" aria-hidden="true">${miniIcon(skill.icon)}</div>
          <div class="progress-level-info">
            <h3>${escapeHtml(skill.label)}</h3>
            <p>${escapeHtml(skill.subtitle)}</p>
          </div>
          <div class="progress-level-score">
            <div class="progress-level-num"><span>${dashboardNLevel(skill.rawScore)}</span><small>N</small></div>
            <div class="progress-level-bar"><i style="width:${dashboardDeltaPercent(skill.scoreDelta)}%"></i></div>
          </div>
          <div class="progress-level-status">
            <strong>${escapeHtml(skill.status)}<span aria-hidden="true">${miniIcon(statusIconName(skill.status))}</span></strong>
            <p>${escapeHtml(skill.statusNote)}</p>
          </div>
        </article>
      `;
    })
    .join("");
}

function renderEarlyProgressDashboard(): string {
  return `
    <section class="dashboard-screen dashboard-overview">
      ${renderDashboardHeader("Progress", "overview", "Building continuity before score detail unlocks.")}
      <section class="continuity-card">
        <div>
          <span>Guided continuity</span>
          <strong>Session ${Math.min(state.progress.sessionNumber, TARGET_ENVELOPE_SESSIONS)} of ${TARGET_ENVELOPE_SESSIONS}</strong>
          <small>${guidedSessionsCompleted()} guided session${guidedSessionsCompleted() === 1 ? "" : "s"} completed in this programme</small>
        </div>
        ${programmeProgressDots()}
        <p>Complete five guided sessions before the app shows score detail as a more reliable personal pattern. For now, the goal is consistency, fit, and a clear learning curve.</p>
      </section>
      <section class="early-progress-grid">
        <article class="early-progress-card is-blue">
          <span>What is building?</span>
          <strong>Your starting point</strong>
          <p>The coach is collecting repeated sessions so later changes can be interpreted with more confidence.</p>
        </article>
        <article class="early-progress-card is-green">
          <span>Today session</span>
          <strong>Guided training</strong>
          <p>Use the Today screen to start the current guided session, or choose easier practice if today is a poor fit.</p>
        </article>
        <article class="early-progress-card is-orange">
          <span>Profile reveal</span>
          <strong>${Math.max(0, 5 - Math.max(0, state.progress.sessionNumber - 1))} guided session${Math.max(0, 5 - Math.max(0, state.progress.sessionNumber - 1)) === 1 ? "" : "s"} to go</strong>
          <p>Your pattern becomes clearer after session 5. Score detail stays secondary until then.</p>
        </article>
      </section>
      <section class="overview-next-card">
        <p><strong>Next step:</strong> Continue the guided session from Today, or choose an easier practice option without changing your progress path.</p>
        <div class="dashboard-actions">
          ${button("Guided Session", "start-guided-instructions")}
          ${button("Practice only", "start-easier-instructions", "secondary")}
          ${button("Coaching", "nav-coaching", "ghost")}
        </div>
      </section>
      ${metricBoundaryStrip()}
    </section>
  `;
}

function renderOverviewDashboard(): string {
  const model = progressDashboardPresentationModel();
  const transferState = model.capacityStatus;
  const transferTone = transferPillTone(transferState);
  return `
    <section class="dashboard-screen dashboard-overview progress-score-page">
      ${renderDashboardHeader("Progress", "overview", "Track capacity under pressure and far-transfer evidence.")}
      <section class="progress-readiness-card">
        <div class="progress-readiness-left">
          <h2>Capacity Under Pressure</h2>
          <div class="progress-readiness-score">
            <span class="num ${model.capacityNLevel === null ? "is-placeholder" : ""}">${dashboardNLevel(model.capacityNLevel)}</span><span class="denom">stable N</span>
            <span class="progress-pill is-${transferTone}">${escapeHtml(transferState)}</span>
          </div>
          <p>${escapeHtml(model.capacityNote)}</p>
        </div>
        <div class="progress-readiness-mid"></div>
        <div class="progress-readiness-trend">
          ${transferDeltaSparkline(model.transferTrend)}
          <p>${escapeHtml(model.nextSupportRoute)}</p>
        </div>
        <div class="progress-readiness-icon" aria-hidden="true">
          <img src="${assetPath("trident-g-fpt-logo.png")}" alt="" />
        </div>
      </section>
      <section class="progress-level-list">${renderProgressLevelCards(model)}</section>
      ${metricBoundaryStrip()}
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
          <strong class="skill-score ${dashboardToneClass(skill.tone)}">${dashboardScore(skill.scoreDelta)}</strong>
          <strong class="skill-change ${skill.scoreDelta === null || skill.scoreDelta >= 0 ? "is-up" : "is-down"}">Δ</strong>
          ${skillScale(skill.rawScore, skill.tone)}
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
        <em>These scores show change from your own starting point. They are not IQ scores, certificates, or selection evidence.</em>
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
  if (state.cloudSyncMode === "cloud" && state.authReady && !state.authUser && state.view !== "auth" && state.view !== "data-rights") {
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
    coaching: renderCoaching,
    proof: renderProof,
    "proof-entry": renderProofEntry,
    transfer: renderTransfer,
    "transfer-model": renderTransferModel,
    "training-map": renderTrainingMap,
    evidence: renderEvidence,
    "data-rights": renderDataRights,
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
    state.progress.nLevels || {},
    state.progress.programmeRunId,
    state.progress.programmeCycle,
  );
  state.activeBlockIndex = 0;
  state.activeTrialIndex = 0;
  state.blockResults = [];
  state.sessionResults = [];
  state.feedback = "";
  state.taskStage = "ready";
  state.responseStartedAt = 0;
  state.pendingTrialResponse = null;
  state.pendingTrialRtMs = null;
  state.staircaseLevels = {};
  state.sessionMode = "protocol";
  state.sessionSource = phase === "P11_DELAYED" || phase === "P6_DELAYED" ? "recheck" : "guided";
  state.progressionScored = true;
  state.guidedReturn = null;
  pendingBlockSubmissions = [];
  go("block-break");
}

function prepareFreePlay(construct: Construct, cellKey: CellKey, source: SessionSource = "free_play", speed: CapacitySpeed = "slow", phase?: PhaseLabel): void {
  clearStageTimer();
  state.sessionPlan = createFreePlaySessionPlan(construct, cellKey, speed, phase);
  state.activeBlockIndex = 0;
  state.activeTrialIndex = 0;
  state.blockResults = [];
  state.sessionResults = [];
  state.feedback = "";
  state.taskStage = "ready";
  state.responseStartedAt = 0;
  state.pendingTrialResponse = null;
  state.pendingTrialRtMs = null;
  state.staircaseLevels = {};
  state.sessionMode = "free";
  state.sessionSource = source;
  state.progressionScored = false;
  state.guidedReturn = null;
}

function beginFreePlay(construct: Construct, cellKey: CellKey, source: SessionSource = "free_play", speed: CapacitySpeed = "slow", phase?: PhaseLabel): void {
  prepareFreePlay(construct, cellKey, source, speed, phase);
  go("task");
  startTaskCountdown();
}

function startGuidedInstructions(): void {
  if (guidedSessionsCompleted() >= TARGET_ENVELOPE_SESSIONS) {
    go("today");
    return;
  }
  if (!state.progress.deviceReadiness) {
    state.pendingTaskStart = null;
    go("readiness");
    return;
  }
  if (guidedCompletedToday()) {
    state.pendingTaskStart = { kind: "guided" };
    go("pre-task-instructions");
    return;
  }
  state.pendingTaskStart = null;
  go("briefing");
}

function startEasierInstructions(): void {
  state.pendingTaskStart = { kind: "easier" };
  go("pre-task-instructions");
}

function startFreeInstructions(construct: Construct, cellKey: CellKey, source: SessionSource = "free_play", speed: CapacitySpeed = "slow", phase?: PhaseLabel): void {
  state.pendingTaskStart = { kind: "free", construct, cellKey, source, speed, phase };
  go("pre-task-instructions");
}

function restartGuidedProgramme(): void {
  const previous = state.progress;
  const programmeCycle = (previous.programmeCycle || 1) + 1;
  state.progress = {
    ...freshDefaultProgress(programmeCycle),
    protocolGroup: previous.protocolGroup,
    deviceReadiness: previous.deviceReadiness,
    scratchBaselines: previous.scratchBaselines,
    proofBenchmarks: previous.proofBenchmarks,
  };
  clearStageTimer();
  state.sessionPlan = null;
  state.sessionMode = "protocol";
  state.sessionSource = "guided";
  state.progressionScored = true;
  state.guidedReturn = null;
  state.pendingTaskStart = null;
  state.progressDashboardMode = "overview";
  state.viewHistory = [];
  persistProgress();
  go("today", { replace: true });
}

function startPendingTask(): void {
  const pending = state.pendingTaskStart;
  state.pendingTaskStart = null;
  if (!pending || pending.kind === "guided") {
    go("briefing");
    return;
  }
  if (pending.kind === "easier") {
    prepareFreePlay("ACC", PHASE_CELL[state.progress.currentPhase], "easier", "slow");
    go("practice-intro");
    return;
  }
  prepareFreePlay(pending.construct, pending.cellKey, pending.source, pending.speed || "slow", pending.phase);
  go("practice-intro");
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
  state.pendingTrialResponse = null;
  state.pendingTrialRtMs = null;
  state.staircaseLevels = {};
  state.sessionMode = "free";
  state.sessionSource = "guided_practice";
  state.progressionScored = false;
  go("task");
  startTaskCountdown();
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
  state.pendingTrialResponse = null;
  state.pendingTrialRtMs = null;
  state.sessionMode = "protocol";
  state.sessionSource = state.progress.currentPhase === "P11_DELAYED" || state.progress.currentPhase === "P6_DELAYED" ? "recheck" : "guided";
  state.progressionScored = true;
  state.guidedReturn = null;
  return true;
}

function beginRestoredGuidedBlock(): void {
  if (!restoreGuidedReturn()) return;
  go("task");
  startTaskCountdown();
}

function setActiveTaskSpeed(speed: CapacitySpeed): void {
  const plan = state.sessionPlan;
  const block = plan?.miniBlocks[state.activeBlockIndex];
  if (!plan || !block) return;
  const soaMs = TASK_SPEED_SOA_MS[speed];
  const exposureMs = Math.round(soaMs * TASK_SPEED_DISPLAY_RATIO);
  block.speed = speed;
  plan.trials
    .filter((trial) => trial.miniBlockId === block.id && trial.trialIndex >= state.activeTrialIndex)
    .forEach((trial) => {
      trial.capacitySpeed = speed;
      trial.soaMs = soaMs;
      trial.exposureMsRequested = exposureMs;
    });
  render();
}

function startTaskCountdown(stepIndex = 0): void {
  if (!activeTrial() || state.view !== "task") return;
  clearStageTimer();
  state.pendingTrialResponse = null;
  state.pendingTrialRtMs = null;
  state.countdownStep = Math.max(0, Math.min(COUNTDOWN_STEPS.length - 1, stepIndex));
  setTaskStage("countdown");
  state.stageTimer = window.setTimeout(() => {
    state.stageTimer = null;
    if (state.countdownStep < COUNTDOWN_STEPS.length - 1) {
      startTaskCountdown(state.countdownStep + 1);
    } else {
      startTrialPresentation();
    }
  }, COUNTDOWN_STEP_MS);
}

function startTrialPresentation(): void {
  const trial = activeTrial();
  if (!trial || state.view !== "task") return;
  clearStageTimer();
  state.pendingTrialResponse = null;
  state.pendingTrialRtMs = null;
  state.responseStartedAt = performance.now();
  setTaskStage("stimulus");
  state.displayTimer = window.setTimeout(() => {
    state.displayTimer = null;
    if (state.taskStage === "stimulus") setTaskStage("response");
  }, trial.exposureMsRequested);
  state.stageTimer = window.setTimeout(() => {
    state.stageTimer = null;
    finishTrialWindow();
  }, trial.soaMs);
}

function continueAfterFeedback(): void {
  state.feedback = "";
  state.activeTrialIndex += 1;
  state.taskStage = "ready";
  state.responseStartedAt = 0;
  state.pendingTrialResponse = null;
  state.pendingTrialRtMs = null;
  if (state.activeTrialIndex >= currentBlockTrialCount()) {
    if (state.sessionMode === "free") {
      if (state.activeBlockIndex + 1 < (state.sessionPlan?.miniBlocks.length || 1)) {
        state.activeBlockIndex += 1;
        state.activeTrialIndex = 0;
        state.blockResults = [];
        go("block-break");
        return;
      }
      state.activeTrialIndex = 0;
      completeSession();
      return;
    }
    const block = state.sessionPlan?.miniBlocks[state.activeBlockIndex];
    if (block) updateGuidedNLevel(block, state.blockResults);
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
  setTaskStage("blank");
  state.stageTimer = window.setTimeout(() => {
    state.stageTimer = null;
    startTrialPresentation();
  }, INTER_STIMULUS_BLANK_MS);
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
  const block = state.sessionPlan?.miniBlocks[state.activeBlockIndex];
  if (block) updateGuidedNLevel(block, state.blockResults);
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
    programmeRunId: plan.programmeRunId,
    programmeCycle: plan.programmeCycle,
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
      appId: result.trial.appId,
      layer: result.trial.layer,
      publicLabel: result.trial.publicLabel,
      technicalLabel: result.trial.technicalLabel,
      stimulusCarrier: result.trial.stimulusCarrier,
      frame: result.trial.frame,
      relationFamily: result.trial.relationFamily,
      relation: result.trial.relation,
      colour: result.trial.colour,
      wrapperId: result.trial.wrapperId,
      nLevel: result.trial.nLevel,
      activeRelationSetSize: result.trial.activeRelationSetSize,
      activeRelationsJson: result.trial.activeRelationsJson,
      lureType: result.trial.lureType,
      confidenceLabel: result.trial.confidenceLabel,
      modelVersion: result.trial.modelVersion,
      isWarmup: result.trial.isWarmup,
      isMatch: result.trial.isMatch,
      targetTrialId: result.trial.targetTrialId,
    })),
  };
}

function balancedAccuracyForBlock(results: TrialResult[]): number {
  if (!results.length) return 0;
  return results.filter((result) => result.isCorrect).length / results.length;
}

function updateGuidedNLevel(block: MiniBlockPlan, results: TrialResult[]): void {
  if (!state.progressionScored || state.sessionMode !== "protocol" || results.length !== block.trialCount) return;
  const nextLevel = nextNLevelFromAccuracy(block.nLevel, balancedAccuracyForBlock(results));
  state.progress = {
    ...state.progress,
    nLevels: {
      ...(state.progress.nLevels || {}),
      [block.wrapperId]: nextLevel,
      [`${block.construct}:${block.cells[0]}`]: nextLevel,
    },
  };
}

function submitCurrentGuidedBlock(results: TrialResult[]): void {
  const plan = state.sessionPlan;
  const block = plan?.miniBlocks[state.activeBlockIndex];
  if (!plan || !block || !state.progressionScored || state.sessionMode !== "protocol") return;
  if (!cloudSyncActive()) return;
  if (results.length !== block.trialCount) return;
  const submission = submitWorkingMemoryBlock(blockSubmissionPayload(plan, block, results)).catch((error) => {
    console.warn("Working Memory block was not submitted.", error);
  });
  pendingBlockSubmissions.push(submission);
}

function finalizeGuidedSession(input: {
  snapshot: ReturnType<typeof createScoreSnapshot>;
  decision: ReturnType<typeof chooseNextPhase>;
  transitionKeys: string[];
  completedSessionNumber: number;
  completedAt: string;
  completedPhase: PhaseLabel;
  completedPhaseStatus: PhaseStatus;
  nextSessionNumber: number;
  nextPhase: PhaseLabel;
  nextPhaseStatus: PhaseStatus;
}): void {
  const plan = state.sessionPlan;
  if (!plan || !state.progressionScored || state.sessionMode !== "protocol") return;
  if (!cloudSyncActive()) return;
  const submissions = pendingBlockSubmissions;
  pendingBlockSubmissions = [];
  void Promise.allSettled(submissions).then(() => finalizeWorkingMemorySession({
    clientSessionId: plan.sessionId,
    programmeRunId: plan.programmeRunId,
    programmeCycle: plan.programmeCycle,
    snapshot: input.snapshot,
    scoringVersion: SCORING_VERSION,
    controllerEvent: {
      fromPhase: input.decision.fromPhase,
      toPhase: input.decision.toPhase,
      shouldTransition: input.decision.shouldTransition,
      transitionKeys: input.transitionKeys,
      phaseStatus: input.decision.phaseStatus,
      reason: input.decision.reason,
      readiness: input.decision.readiness,
      protocolGroup: state.progress.protocolGroup,
      programmeRunId: plan.programmeRunId,
      programmeCycle: plan.programmeCycle,
      completedSession: {
        sessionNumber: input.completedSessionNumber,
        completedAt: input.completedAt,
        phase: input.completedPhase,
        phaseStatus: input.completedPhaseStatus,
        protocolGroup: state.progress.protocolGroup,
        programmeRunId: plan.programmeRunId,
        programmeCycle: plan.programmeCycle,
      },
      nextState: {
        sessionNumber: input.nextSessionNumber,
        phase: input.nextPhase,
        phaseStatus: input.nextPhaseStatus,
        nominalBand: NOMINAL_BANDS[input.nextPhase],
        programmeRunId: plan.programmeRunId,
        programmeCycle: plan.programmeCycle,
      },
      scoreSnapshotState: {
        sessionNumber: input.snapshot.sessionNumber,
        activePhase: input.snapshot.activePhase,
        phaseStatus: input.snapshot.phaseStatus,
      },
      scratchBaselineSources: input.snapshot.farTransfer?.boundarySignals.map((signal) => ({
        boundary: signal.boundary,
        source: signal.scratchBaselineSource,
        targetCell: signal.targetCell,
        transferEfficiency: signal.transferEfficiency,
        stabilityAdvantage: signal.stabilityAdvantage,
      })),
    },
  })).catch((error) => {
    console.warn("Working Memory session was not finalized.", error);
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
  const completedPhaseStatus = state.progress.phaseStatus;
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
    protocolGroup: state.progress.protocolGroup,
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
  const scoreHistoryEntry = scoreHistoryEntryFromState({
    sessionNumber: completedSessionNumber,
    completedAt: guidedCompletion.completedAt,
    phase: completedPhase,
    evidence: updatedEvidence,
    snapshot,
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
    scoreHistory: [...(state.progress.scoreHistory || []), scoreHistoryEntry].slice(-30),
    profileRevealSeen: state.progress.profileRevealSeen || shouldRevealProfile,
  };
  persistProgress();
  finalizeGuidedSession({
    snapshot,
    decision,
    transitionKeys,
    completedSessionNumber,
    completedAt: guidedCompletion.completedAt,
    completedPhase,
    completedPhaseStatus,
    nextSessionNumber: state.progress.sessionNumber,
    nextPhase,
    nextPhaseStatus: nextStatus,
  });
  go("complete");
}

function answerTrial(response: string | null): void {
  if (response === null) return;
  if (state.taskStage !== "stimulus" && state.taskStage !== "response") return;
  if (state.pendingTrialResponse) return;
  const trial = activeTrial();
  if (!trial) return;
  state.pendingTrialResponse = response;
  state.pendingTrialRtMs = Math.max(0, Math.round(performance.now() - state.responseStartedAt));
  if (response === trial.correctResponse) {
    playFeedbackSound("correct");
  } else {
    if (state.stageTimer !== null) {
      window.clearTimeout(state.stageTimer);
      state.stageTimer = null;
    }
    finishTrialWindow();
    return;
  }
  render();
}

function finishTrialWindow(): void {
  if (state.displayTimer !== null) {
    window.clearTimeout(state.displayTimer);
    state.displayTimer = null;
  }
  const trial = activeTrial();
  if (!trial) return;
  const response = state.pendingTrialResponse;
  const isCorrect = response === trial.correctResponse;
  state.feedback = isCorrect ? "correct" : "incorrect";
  const result: TrialResult = {
    trial,
    response,
    isCorrect,
    rtMs: state.pendingTrialRtMs,
    exposureMsActual: trial.exposureMsRequested,
    actualStimulusFrames: Math.max(1, Math.round(trial.exposureMsRequested / 16.67)),
    deviceRefreshRateEstimate: state.progress.deviceReadiness?.refreshRateHz || 60,
    droppedFrameCount: 0,
    timingQuality: state.progress.deviceReadiness?.quality || "good",
  };
  state.blockResults.push(result);
  state.sessionResults.push(result);
  if (!isCorrect) playFeedbackSound("incorrect");
  continueAfterFeedback();
}

appRoot.addEventListener("click", async (event) => {
  const target = event.target as HTMLElement;
  if (state.soundOn) feedbackAudio();
  const freeCard = target.closest<HTMLElement>("[data-free-construct][data-free-cell]");
  if (freeCard) {
    startFreeInstructions(
      freeCard.dataset.freeConstruct as Construct,
      freeCard.dataset.freeCell as CellKey,
      "free_play",
      freeCard.dataset.freeSpeed === "fast" ? "fast" : "slow",
      freeCard.dataset.freePhase as PhaseLabel | undefined,
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
    if (cloudSyncActive()) {
      void deleteProofBenchmark(deleteId).catch((error) => {
        console.warn("Proof benchmark was not deleted remotely.", error);
        markSync("error", "Benchmark delete could not be synced.");
      });
    }
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
    setCloudSyncMode("cloud");
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
    setCloudSyncMode("local");
    state.viewHistory = [];
    go("data-rights", { replace: true });
  } else if (action === "enable-cloud-sync") {
    setCloudSyncMode("cloud");
    if (state.authUser) {
      await restoreRemoteProgress();
    } else {
      state.authMessage = "Enter your email to enable cloud sync.";
      go("auth");
    }
  } else if (action === "use-local-only") {
    setCloudSyncMode("local");
    if (state.authUser) {
      await signOutUser().catch((error) => console.warn("Sign out after local mode failed.", error));
      state.authUser = null;
    }
    state.authReady = true;
    go(state.view === "auth" ? "welcome" : "data-rights", { replace: true });
  } else if (action === "export-wm-data") {
    await exportCurrentData();
  } else if (action === "delete-wm-data") {
    await deleteCurrentData();
  } else if (action === "nav-auth") go("auth");
  else if (action === "nav-data-rights") go("data-rights");
  else if (action === "nav-welcome") go("welcome");
  else if (action === "nav-back") goBack();
  else if (action === "start-readiness") go("readiness");
  else if (action === "run-readiness") {
    if (state.readinessRunning) return;
    state.readinessRunning = true;
    state.progress = { ...state.progress, deviceReadiness: null };
    render();
    const readiness = {
      ...(await runDeviceReadiness()),
      browserDeviceId: currentBrowserDeviceId,
    };
    state.progress = { ...state.progress, deviceReadiness: readiness };
    persistProgress();
    if (cloudSyncActive()) {
      void recordDeviceCheck(readiness).catch((error) => {
        console.warn("Device check was not synced.", error);
        markSync("error", "Device check could not be synced.");
      });
    }
    void hydrateScratchBaselines();
    state.readinessRunning = false;
    go("readiness");
  } else if (action === "nav-today") go("today");
  else if (action === "nav-today-rationale") go("today-rationale");
  else if (action === "nav-break-plan") go("break-plan");
  else if (action === "nav-tutorial") go("briefing");
  else if (action === "nav-free-play") go("free-play");
  else if (action === "nav-free-play-formats") go("free-play-formats");
  else if (action === "set-task-speed") {
    const speed = target.closest<HTMLElement>("[data-speed]")?.dataset.speed === "fast" ? "fast" : "slow";
    setActiveTaskSpeed(speed);
  }
  else if (action === "nav-coaching") go("coaching");
  else if (action === "open-coaching-checkout") window.location.href = COACHING_CHECKOUT_URL;
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
  else if (action === "restart-guided-programme") restartGuidedProgramme();
  else if (action === "start-easier-instructions") startEasierInstructions();
  else if (action === "start-pending-task") startPendingTask();
  else if (action === "begin-session") beginSession();
  else if (action === "start-block-practice") startCurrentBlockPractice();
  else if (action === "begin-block-practice") startCurrentBlockPractice();
  else if (action === "nav-block-options") go("block-break");
  else if (action === "finish-practice-begin-block") beginRestoredGuidedBlock();
  else if (action === "finish-practice-back-to-block") {
    if (restoreGuidedReturn()) go("block-break");
  }
  else if (action === "resume-block") {
    state.taskStage = "ready";
    go("task");
    startTaskCountdown();
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
    if (state.soundOn) playFeedbackSound("enabled");
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
      progress: freshDefaultProgress(),
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
  const responseEnabled = state.taskStage === "stimulus" || state.taskStage === "mask" || state.taskStage === "response";
  if (state.view !== "task" || !responseEnabled || event.repeat) return;
  const trial = activeTrial();
  if (!trial) return;
  if ((event.code === "Space" || event.code === "Enter") && trial.responseOptions.includes("MATCH")) {
    event.preventDefault();
    if (state.soundOn) feedbackAudio();
    answerTrial("MATCH");
    return;
  }
  const number = Number(event.key);
  if (Number.isInteger(number) && number >= 1 && number <= trial.responseOptions.length) {
    event.preventDefault();
    if (state.soundOn) feedbackAudio();
    answerTrial(trial.responseOptions[number - 1]);
  }
});

async function initialiseBetaAuth(): Promise<void> {
  if (!cloudSyncAvailable || state.cloudSyncMode === "local") {
    state.authReady = true;
    state.syncState = "local";
    state.syncMessage = cloudSyncAvailable
      ? "Cloud optional via data ethics page."
      : "Local demo mode.";
    render();
    void hydrateScratchBaselines();
    return;
  }

  state.authReady = false;
  state.syncState = "checking";
  state.syncMessage = "Checking sign-in.";
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
      state.syncMessage = "Sign in to sync devices.";
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
    if (user && state.cloudSyncMode === "cloud") {
      void restoreRemoteProgress();
    } else {
      if (state.cloudSyncMode === "cloud") {
        state.view = "auth";
        state.viewHistory = [];
        state.syncState = "pending";
        state.syncMessage = "Sign in to sync devices.";
      } else {
        state.syncState = "local";
        state.syncMessage = "Cloud optional via data ethics page.";
      }
      render();
    }
  });
}

void initialiseBetaAuth();










