import "./styles.css";
import { buildAttentionBlockSubmissionPayload } from "./blockPayload";
import { selectFreshDelayedRecheckResults } from "./delayedEvidence";
import { createFreePlaySessionPlan, createSessionPlan, generateTrial, phaseIntro } from "./generator";
import { buildInterblockFeedback, createBlockFeedbackPoint, getInvariantPrompt, invariantPromptKey, type InterblockFeedback, type InterblockGraph } from "./interblockFeedback";
import { opticFlowAperturesForTrial, opticFlowMaskAperturesForTrial } from "./opticFlow";
import { NOMINAL_BANDS, PHASE_CELL, PHASE_NAMES, PHASE_ORDER_BY_GROUP, PROTOCOL_VERSION, TARGET_ENVELOPE_SESSIONS, phaseStatusForPhase, transitionEventsForPhaseAdvance } from "./protocol";
import { ABSOLUTE_PROGRESS_CELLS, RELATIONAL_PROGRESS_CELLS, evidenceForCells, progressMetricScores } from "./progressMetrics";
import { createFarTransferWindows, createScoreSnapshot, progressionResultsForEvidence, updateEvidenceFromResults } from "./scoring";
import { conditionForLevel, INITIAL_STAIRCASE_LEVEL, nextStaircaseLevel } from "./staircase";
import { migrateTransferControllerState, transferPathForState } from "./transferController";
import { ruleCueForTrial, shouldShowRuleCue, shouldShowRuleCueForTrial as shouldShowRuleCueForBlockTrial } from "./ruleCue";
import { stimulusTimingForTrial } from "./trialTiming";
import { eligibleFreePlayWrappers } from "./wrapperDefinitions";
import { DEFAULT_PROGRESS, browserDeviceId, cloudSyncModeForDataMode, compareProgressFreshness, loadDataMode, loadDataModeSeen, loadProgress, newerProgress, newProgrammeRunId, progressForBrowserDevice, resetProgress, saveDataMode, saveDataModeSeen, saveProgress, type CloudSyncMode, type CompletionRoute, type DataMode, type LocalProgress, type ProgressScoreHistoryEntry, type ProgressScoreMetric, type ProofBenchmarkDomain, type ProofBenchmarkEntry, type ProofBenchmarkTimepoint } from "./storage";
import {
  currentAuthUser,
  deleteAttentionData,
  deleteProofBenchmark,
  exportAttentionData,
  fetchAttentionScratchBaselines,
  finalizeAttentionSession,
  isSupabaseConfigured,
  loadGTrackHistory,
  loadStandardizedScores,
  loadRemoteProgress,
  onAuthChange,
  recordDeviceCheck,
  saveProofBenchmark,
  saveRemoteProgress,
  sendEmailSignInLink,
  signOutUser,
  submitAttentionBlock,
  type AuthUser,
  type StandardizedScoreRow,
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
  | "coaching"
  | "proof"
  | "proof-entry"
  | "transfer"
  | "transfer-model"
  | "training-map"
  | "evidence"
  | "data-rights"
  | "profile";

type TaskStage = "ready" | "rule_cue" | "fixation" | "stimulus" | "mask" | "response" | "feedback" | "paused";
type StyleMode = "iq" | "legacy";
type ProgressDashboardMode = "overview" | "detail";
type ProgressSectionMode = ProgressDashboardMode | "proof";
type SessionSource = "guided" | "guided_practice" | "free_play" | "preview" | "recheck" | "easier";
type PendingTaskStart =
  | { kind: "guided" }
  | { kind: "easier" }
  | { kind: "free"; construct: Construct; cellKey: CellKey; source: SessionSource };
type SyncState = "local" | "checking" | "synced" | "pending" | "error";
type StandardizedScoreSummary = {
  standardScore: number | null;
  zScore: number | null;
  normN: number | null;
  sessionNumber: number | null;
};

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
  ruleCueTrialId: string | null;
  responseStartedAt: number;
  activeBlockStartedAtMs: number | null;
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
  dataMode: DataMode;
  dataModeSeen: boolean;
  cloudSyncMode: CloudSyncMode;
  syncState: SyncState;
  syncMessage: string;
  standardizedScores: Record<string, StandardizedScoreSummary>;
}

const app = document.querySelector<HTMLDivElement>("#app");
if (!app) throw new Error("Missing #app root.");
const appRoot = app;
const STYLE_MODE_KEY = "attentionCoachStyleModeV2";
const cloudSyncAvailable = isSupabaseConfigured;
const initialDataMode: DataMode = cloudSyncAvailable ? loadDataMode() : "local";
const initialDataModeSeen = loadDataModeSeen();
const initialCloudSyncMode: CloudSyncMode = cloudSyncAvailable ? cloudSyncModeForDataMode(initialDataMode) : "local";
const currentBrowserDeviceId = browserDeviceId();
const APP_BASE = import.meta.env.BASE_URL || "/";
const COACHING_CHECKOUT_URL = "https://buy.stripe.com/8x2bJ0bi96s06vLgtQ9ws0t";
const PROTOCOL_ASSIGNMENT_VERSION = "counterbalance-v20260708";

function freshDefaultProgress(programmeCycle = 1): LocalProgress {
  return {
    ...DEFAULT_PROGRESS,
    programmeRunId: newProgrammeRunId(programmeCycle),
    programmeCycle,
  };
}

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

function resolveInitialView(cloudSyncMode: CloudSyncMode, dataModeSeen: boolean): View {
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
  if (allowedViews.includes(queryView as View)) return queryView as View;
  if (cloudSyncMode === "cloud" && !dataModeSeen) return "data-rights";
  return "welcome";
}

function queryProtocolGroup(): ProtocolGroup | null {
  const value = new URLSearchParams(window.location.search).get("protocolGroup");
  return value === "validation_arrows_first" || value === "validation_flow_first" || value === "commercial_arrows_first"
    ? value
    : null;
}

function isFreshProtocolProgress(progress: LocalProgress): boolean {
  return progress.sessionNumber <= 1 && progress.evidence.length === 0 && progress.completedTransitions.length === 0;
}

function protocolAssignmentSeed(): string {
  return `attention-coach:${PROTOCOL_ASSIGNMENT_VERSION}:${currentBrowserDeviceId}`;
}

function hashToBucket(seed: string): number {
  let hash = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) % 100;
}

function assignedProtocolGroup(seed: string): ProtocolGroup {
  const bucket = hashToBucket(seed);
  if (bucket < 70) return "commercial_arrows_first";
  if (bucket < 90) return "validation_arrows_first";
  return "validation_flow_first";
}

function withProtocolAssignment(progress: LocalProgress): LocalProgress {
  const queryGroup = queryProtocolGroup();
  const isFresh = isFreshProtocolProgress(progress);
  if (queryGroup) {
    const currentPhase = isFresh ? PHASE_ORDER_BY_GROUP[queryGroup][0] : progress.currentPhase;
    const assigned = {
      ...progress,
      protocolGroup: queryGroup,
      protocolAssignmentVersion: `${PROTOCOL_ASSIGNMENT_VERSION}:url_override`,
      protocolAssignmentSeed: "query:protocolGroup",
      protocolAssignedAt: progress.protocolAssignedAt || new Date().toISOString(),
      currentPhase,
      latestSnapshot: isFresh ? null : progress.latestSnapshot,
      scratchBaselines: [],
    };
    return {
      ...assigned,
      transferControllerState: migrateTransferControllerState({
        existing: isFresh ? null : assigned.transferControllerState,
        currentPhase,
        sessionNumber: assigned.sessionNumber,
        evidence: assigned.evidence,
        protocolGroup: queryGroup,
      }),
    };
  }
  if (progress.protocolAssignmentVersion || !isFresh) return progress;
  const seed = protocolAssignmentSeed();
  const protocolGroup = assignedProtocolGroup(seed);
  const currentPhase = PHASE_ORDER_BY_GROUP[protocolGroup][0];
  const assigned = {
    ...progress,
    protocolGroup,
    protocolAssignmentVersion: PROTOCOL_ASSIGNMENT_VERSION,
    protocolAssignmentSeed: seed,
    protocolAssignedAt: new Date().toISOString(),
    currentPhase,
    latestSnapshot: null,
    scratchBaselines: [],
  };
  return {
    ...assigned,
    transferControllerState: migrateTransferControllerState({
      existing: null,
      currentPhase,
      sessionNumber: assigned.sessionNumber,
      evidence: assigned.evidence,
      protocolGroup,
    }),
  };
}

function loadAssignedProgress(): LocalProgress {
  const progress = progressForBrowserDevice(loadProgress(), currentBrowserDeviceId);
  const assignedProgress = withProtocolAssignment(progress);
  if (assignedProgress === progress) return progress;
  saveProgress(assignedProgress);
  return assignedProgress;
}

const initialProgress = loadAssignedProgress();

let state: RuntimeState = {
  view: resolveInitialView(initialCloudSyncMode, initialDataModeSeen),
  progress: initialProgress,
  sessionPlan: null,
  activeBlockIndex: 0,
  activeTrialIndex: 0,
  blockResults: [],
  sessionResults: [],
  feedback: "",
  readinessRunning: false,
  taskStage: "ready",
  ruleCueTrialId: null,
  responseStartedAt: 0,
  activeBlockStartedAtMs: null,
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
  authReady: initialCloudSyncMode !== "cloud",
  authMessage: "",
  authBusy: false,
  dataMode: initialDataMode,
  dataModeSeen: initialDataModeSeen,
  cloudSyncMode: initialCloudSyncMode,
  syncState: initialCloudSyncMode === "cloud" ? "checking" : "local",
  syncMessage: initialCloudSyncMode === "cloud" ? "Checking sign-in." : "Cloud optional via data ethics page.",
  standardizedScores: {},
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
  if (!cloudSyncAvailable) return "Local demo";
  if (state.cloudSyncMode === "local") return "Local demo";
  if (!state.authReady) return "Checking sign-in";
  return state.authUser?.email || "Sign in required";
}

function dataStatusLabel(): string {
  return state.cloudSyncMode === "local" ? "Data ethics" : authLabel();
}

function syncLabel(): string {
  const labels: Record<SyncState, string> = {
    local: "Local demo",
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

function benchmarkScoringSelected(): boolean {
  return state.dataMode === "cloud_benchmark";
}

function benchmarkContributionActive(): boolean {
  return cloudSyncActive() && benchmarkScoringSelected();
}

function markDataModeSeen(): void {
  state.dataModeSeen = true;
  saveDataModeSeen();
}

function dataModeLabel(mode: DataMode = state.dataMode): string {
  const labels: Record<DataMode, string> = {
    local: "Local demo",
    cloud_personal: "Cloud personal",
    cloud_benchmark: "Cloud standard scores",
  };
  return labels[mode];
}

function standardScoreMap(rows: StandardizedScoreRow[]): Record<string, StandardizedScoreSummary> {
  const byMetric: Record<string, StandardizedScoreSummary> = {};
  for (const row of rows) {
    if (byMetric[row.metric_key]) continue;
    byMetric[row.metric_key] = {
      standardScore: row.standard_score,
      zScore: row.z_score,
      normN: row.norm_n,
      sessionNumber: row.session_number,
    };
  }
  return byMetric;
}

async function hydrateStandardizedScores(): Promise<void> {
  if (!benchmarkContributionActive()) {
    state.standardizedScores = {};
    return;
  }
  try {
    state.standardizedScores = standardScoreMap(await loadStandardizedScores("attention_coach"));
    render();
  } catch (error) {
    console.warn("Standardised scores were not loaded.", error);
  }
}

async function hydrateGTrackProofScores(): Promise<void> {
  if (!cloudSyncActive()) return;
  try {
    const entries = gTrackEntriesFromHistory(await loadGTrackHistory());
    if (!entries.length) return;
    const manualEntries = state.progress.proofBenchmarks.filter((entry) => !entry.id.startsWith("gtrack-"));
    const byId = new Map<string, ProofBenchmarkEntry>();
    [...manualEntries, ...entries].forEach((entry) => byId.set(entry.id, entry));
    state.progress = { ...state.progress, proofBenchmarks: Array.from(byId.values()) };
    persistProgress();
    render();
  } catch (error) {
    console.warn("G Track proof scores were not loaded.", error);
  }
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

type AttentionAudioContext = AudioContext & { webkitAudioContext?: never };

let feedbackAudioContext: AudioContext | null = null;

function createFeedbackAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AudioContextCtor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextCtor) return null;
  try {
    return new AudioContextCtor() as AttentionAudioContext;
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

function playErrorFeedbackSound(): void {
  if (!state.soundOn) return;
  const audio = feedbackAudio();
  if (!audio) return;
  const now = audio.currentTime + 0.01;
  const steps: Array<{ frequency: number; start: number; duration: number; type: OscillatorType; gain: number }> = [
    { frequency: 220, start: 0, duration: 0.13, type: "square", gain: 0.035 },
    { frequency: 165, start: 0.1, duration: 0.18, type: "triangle", gain: 0.045 },
  ];
  for (const step of steps) {
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    oscillator.type = step.type;
    oscillator.frequency.setValueAtTime(step.frequency, now + step.start);
    gain.gain.setValueAtTime(0.0001, now + step.start);
    gain.gain.exponentialRampToValueAtTime(step.gain, now + step.start + 0.018);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + step.start + step.duration);
    oscillator.connect(gain).connect(audio.destination);
    oscillator.start(now + step.start);
    oscillator.stop(now + step.start + step.duration + 0.025);
  }
}

async function restoreRemoteProgress(): Promise<void> {
  if (!cloudSyncActive()) return;
  let nextView: View = state.dataModeSeen ? "welcome" : "data-rights";
  if (!state.dataModeSeen && (state.view === "welcome" || state.view === "auth")) {
    state.view = nextView;
    state.viewHistory = [];
  }
  markSync("checking", "Loading beta progress.");
  render();
  try {
    const remote = await loadRemoteProgress();
    if (remote) {
      const localProgress = progressForBrowserDevice(state.progress, currentBrowserDeviceId);
      const remoteProgress = progressForBrowserDevice({ ...DEFAULT_PROGRESS, ...remote }, currentBrowserDeviceId);
      const localIsNewer = compareProgressFreshness(localProgress, remoteProgress) > 0;
      const selectedProgress = newerProgress(localProgress, remoteProgress);
      state.progress = withProtocolAssignment(selectedProgress);
      saveProgress(state.progress);
      if (localIsNewer) {
        await saveRemoteProgress(state.progress);
        markSync("synced", "Newer browser progress restored to cloud.");
      } else {
        markSync("synced", "Beta progress loaded.");
      }
      nextView = state.dataModeSeen ? "welcome" : "data-rights";
    } else {
      state.progress = withProtocolAssignment(freshDefaultProgress());
      saveProgress(state.progress);
      await saveRemoteProgress(state.progress);
      markSync("synced", "New beta progress record created.");
      nextView = state.dataModeSeen ? "welcome" : "data-rights";
    }
  } catch (error) {
    console.warn("Remote progress was not loaded.", error);
    const detail = error instanceof Error ? error.message : "Unknown sync error.";
    markSync("error", `Could not load beta progress: ${detail}`);
    nextView = state.dataModeSeen ? "welcome" : "data-rights";
  }
  void hydrateScratchBaselines();
  void hydrateStandardizedScores();
  void hydrateGTrackProofScores();
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
  const preAuthGate = state.cloudSyncMode === "cloud" && !state.authUser;
  const showBetaStatus = false;
  const contentClasses = [
    "app-content",
    `view-${state.view}`,
    tabbedViews.includes(state.view) ? "has-app-tabs" : "",
    showBetaStatus ? "has-beta-status" : "",
  ].filter(Boolean).join(" ");
  const backControl = !preAuthGate && state.viewHistory.length > 0
    ? `<button class="app-nav-button app-back-button" data-action="nav-back" aria-label="Go back">${headerIcon("back")}</button>`
    : "";
  const homeControl = preAuthGate ? "" : `<button class="app-nav-button app-home-button ${state.view === "today" ? "is-current" : ""}" data-action="nav-today" aria-label="Go to home screen">${headerIcon("home")}</button>`;
  const authControl = preAuthGate
    ? ""
    : cloudSyncAvailable && state.cloudSyncMode === "cloud" && state.authUser
    ? `<button class="app-auth-button" data-action="nav-data-rights" title="${escapeHtml(authLabel())}">Data</button>`
    : cloudSyncAvailable
      ? `<button class="app-auth-button" data-action="${state.cloudSyncMode === "cloud" ? "nav-auth" : "nav-data-rights"}">${state.cloudSyncMode === "cloud" ? "Sign in" : "Data"}</button>`
      : "";
  const soundControl = `<button class="app-nav-button app-sound-button ${state.soundOn ? "is-on" : "is-off"}" data-action="toggle-sound" aria-label="${state.soundOn ? "Turn sound feedback off" : "Turn sound feedback on"}">${headerIcon(state.soundOn ? "sound-on" : "sound-off")}</button>`;
  return `
    <main class="app-shell">
      <header class="app-brand-bar">
        <div class="app-header-left">${backControl}${homeControl}</div>
        <div class="app-header-brand">
          ${preAuthGate ? "" : `<img src="${assetPath("attention-coach-wordmark-v3.svg")}" alt="Attention Coach" />`}
        </div>
        <div class="app-header-right">${authControl}${soundControl}</div>
      </header>
      <div class="${contentClasses}">
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

function readinessStatusLabel(quality: string | null | undefined): string {
  return quality === "poor" ? "Low confidence" : "Pass";
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
  P1_ARROW_ABS: "Build a cognitive control baseline.",
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
  active: "Building",
  flattening: "Ready for a change",
  ready_to_swap: "Ready for a change",
  recovering: "Recovering",
  extended_for_learning_curve: "Building",
  mixed: "Stable across formats",
  delayed: "Re-check due",
  completed: "Portable",
  ready_for_next_challenge: "Ready for a change",
  recovering_new_format: "New format dip",
  mixed_stability: "Ready to mix",
  return_check: "Return check",
  calibrating: "Building",
};

function appTabs(active: "today" | "session" | "progress" | "coaching"): string {
  return `
    <nav class="tabs">
      ${navButton("Today", "nav-today", active === "today")}
      ${navButton("Session", "nav-free-play", active === "session")}
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
    .filter((entry) => entry.route === "guided")
    .sort((a, b) => b.completedAt.localeCompare(a.completedAt))[0] || null;
}

function guidedCompletedToday(): boolean {
  return state.progress.completions.some((entry) => entry.route === "guided" && entry.date === todayIso());
}

function guidedSessionsCompleted(): number {
  return Math.max(0, Math.min(TARGET_ENVELOPE_SESSIONS, state.progress.sessionNumber - 1));
}

function hasReturnGap(): boolean {
  const latest = latestCompletion();
  return Boolean(latest && daysBetweenIsoDates(latest.date, todayIso()) >= 2);
}

function programmeProgressDots(completed = guidedSessionsCompleted()): string {
  const dots = Array.from({ length: TARGET_ENVELOPE_SESSIONS }, (_, index) => {
    const isComplete = index < completed;
    const label = `Guided session ${index + 1}${isComplete ? " complete" : " not complete"}`;
    return `<span class="${isComplete ? "is-complete" : ""}" title="${escapeHtml(label)}">${isComplete ? index + 1 : ""}</span>`;
  });
  return [dots.slice(0, 10), dots.slice(10, 20)]
    .map((row) => `<div class="programme-dot-row">${row.join("")}</div>`)
    .join("");
}

function programmeProgressCard(completed = guidedSessionsCompleted()): string {
  return `
    <section class="programme-progress-card">
      <div>
        <span>Programme progress</span>
        <strong>${completed} of ${TARGET_ENVELOPE_SESSIONS} guided sessions complete</strong>
        <small>Full programme: ${TARGET_ENVELOPE_SESSIONS} guided sessions. New challenge formats appear when your learning curve is ready.</small>
      </div>
      <div class="programme-dots" aria-label="20 guided session programme progress">${programmeProgressDots(completed)}</div>
    </section>
  `;
}

function completionEntry(route: CompletionRoute, sessionNumber = state.progress.sessionNumber, phase = state.progress.currentPhase) {
  return {
    id: `completion-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    date: todayIso(),
    route,
    completedAt: new Date().toISOString(),
    programmeRunId: state.progress.programmeRunId,
    programmeCycle: state.progress.programmeCycle,
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
    return "The rule is the same, but the surface is different. This helps test whether you learned the underlying skill rather than memorising one display.";
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
      why: "Practice helps you learn the display. It does not change your session number, phase, or transfer score.",
      startLabel: "Start practice",
    };
  }
  if (pending?.kind === "free") {
    const construct = pending.construct === "BSE" ? "Binding Stability" : "Signal Control";
    return {
      title: `${construct} practice`,
      what: "You will practise a selected format outside today's guided session.",
      focus: pending.construct === "BSE" ? "Keep direction and colour together." : "Choose the majority direction. Accuracy before speed.",
      why: "Practice helps you learn the display. It does not change your session number, phase, or transfer score.",
      startLabel: "Start practice",
    };
  }
  return {
    title: "Today's attention session",
    what: "You will complete the guided task chosen for your current learning curve.",
    focus: "Choose the majority direction. Accuracy before speed.",
    why: phaseRationale(state.progress.currentPhase),
    startLabel: "Start guided session",
  };
}

function renderPreTaskInstructions(): string {
  const copy = pendingTaskCopy();
  const sameDayGuidedWarning = state.pendingTaskStart?.kind === "guided" && guidedCompletedToday()
    ? `<div class="same-day-warning-card">
        <strong>Another guided session today?</strong>
        <p>You can continue, but the programme is designed around steady daily sessions. Extra sessions may be lower quality if you are tired.</p>
      </div>`
    : "";
  return shell(`
    ${appTabs(state.pendingTaskStart?.kind === "free" ? "session" : "today")}
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
      ${sameDayGuidedWarning}
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

function pauseTask(): void {
  if (state.view !== "task" || state.taskStage === "feedback" || state.taskStage === "paused") return;
  clearStageTimer();
  state.feedback = "";
  state.responseStartedAt = 0;
  state.taskStage = "paused";
  render();
}

function resumePausedTask(): void {
  if (state.view !== "task" || state.taskStage !== "paused") return;
  state.feedback = "";
  state.responseStartedAt = 0;
  state.taskStage = "ready";
  render();
  schedule(350, startTrialPresentation);
}

function renderAuth(): string {
  const headline = "Email sign in";
  const linkSent = state.authMessage.startsWith("Check your email");
  if (linkSent) {
    return shell(`
      <section class="auth-screen">
        <div class="auth-card">
          <p class="auth-message">${escapeHtml(state.authMessage)}</p>
        </div>
      </section>
    `);
  }
  return shell(`
    <section class="auth-screen">
      <div class="auth-card">
        <p class="ui-eyebrow">${escapeHtml(dataModeLabel())}</p>
        <h1>${escapeHtml(headline)}</h1>
        <p class="ui-body">Enter your email to receive a secure sign-in link.</p>
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
        <p class="auth-message">${escapeHtml(state.authMessage || "You will receive a secure sign-in link. Use the email linked to your IQ Mindware access.")}</p>
      </div>
    </section>
  `);
}

function dataModeCard(mode: DataMode, title: string, copy: string, action: string): string {
  const selected = state.dataMode === mode;
  return `<button class="data-mode-card ${selected ? "is-selected" : ""}" data-action="${action}" aria-pressed="${selected ? "true" : "false"}">
    <span class="data-mode-card-kicker">${mode === "local" ? "Local only" : mode === "cloud_personal" ? "Private sync" : "Standardised sync"}</span>
    <strong>${escapeHtml(title)}</strong>
    <p>${escapeHtml(copy)}</p>
    <span class="mode-select-pill">${selected ? "Selected" : "Choose"}</span>
  </button>`;
}

function dataRemovalCard(cloudActive: boolean): string {
  return `<button class="data-mode-card data-removal-card" data-action="delete-attention-data">
    <span class="data-mode-card-kicker">Delete</span>
    <strong>Remove data</strong>
    <p>${cloudActive ? "Delete your cloud Attention Coach data and reset this browser." : "Reset this browser's local Attention Coach progress."}</p>
    <span class="mode-select-pill">${cloudActive ? "Delete cloud data" : "Reset local data"}</span>
  </button>`;
}

function renderDataRights(): string {
  const cloudActive = cloudSyncActive();
  const continueLabel = state.authUser ? "Continue testing" : "Sign in";
  const cloudCopy = cloudSyncAvailable
    ? "Choose a data option before training."
    : "Cloud sync is not configured for this build.";
  return shell(`
    <section class="data-rights-screen">
      <section class="data-rights-hero">
        <p class="ui-eyebrow">Data rights</p>
        <h1>Your data stays under your control.</h1>
        <p>${escapeHtml(cloudCopy)}</p>
      </section>
      <section class="data-mode-grid">
        ${dataModeCard("cloud_personal", "Cloud personal", "Syncs Attention Coach progress across IQ Mindware apps without population-standardised scores.", "select-data-cloud-personal")}
        ${dataModeCard("cloud_benchmark", "Cloud standard scores", "Syncs progress and shows standardised scores when the comparison sample is sufficient.", "select-data-cloud-benchmark")}
        ${dataRemovalCard(cloudActive)}
      </section>
      <section class="ethics-boundary-card">
        <strong>Non-selection boundary</strong>
        <p>Scores are personal training signals. The app does not create certificates, rankings, employer links, or score APIs.</p>
      </section>
      ${state.authUser ? `<div class="data-rights-primary-action">${button(continueLabel, "continue-after-data-rights")}</div>` : ""}
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
  setDataMode(mode === "cloud" ? "cloud_personal" : "local");
}

function setDataMode(mode: DataMode): void {
  state.dataMode = cloudSyncAvailable ? mode : "local";
  state.cloudSyncMode = cloudSyncModeForDataMode(state.dataMode);
  saveDataMode(state.dataMode);
  if (state.cloudSyncMode === "local") {
    state.syncState = "local";
    state.syncMessage = "Cloud optional via data ethics page.";
    state.standardizedScores = {};
  } else {
    state.syncState = state.authUser ? "checking" : "pending";
    state.syncMessage = state.authUser
      ? state.dataMode === "cloud_benchmark" ? "Cloud standard scores selected." : "Cloud personal selected."
      : "Sign in to sync devices.";
    void hydrateStandardizedScores();
    void hydrateGTrackProofScores();
  }
}

async function exportCurrentData(): Promise<void> {
  try {
    if (cloudSyncActive()) {
      const exported = await exportAttentionData();
      downloadJson(`attention-coach-cloud-export-${todayIso()}.json`, exported);
      markSync("synced", "Cloud data export created.");
    } else {
      downloadJson(`attention-coach-local-export-${todayIso()}.json`, {
        exportedAt: new Date().toISOString(),
        mode: "local",
        progress: state.progress,
      });
      markSync("local", "Local data export created.");
    }
  } catch (error) {
    console.warn("Attention data export failed.", error);
    markSync("error", error instanceof Error ? error.message : "Data export failed.");
  }
  render();
}

async function deleteCurrentData(): Promise<void> {
  const target = cloudSyncActive() ? "cloud Attention Coach data and local browser progress" : "local Attention Coach progress in this browser";
  if (!window.confirm(`Permanently delete ${target}? This cannot be undone.`)) return;
  try {
    if (cloudSyncActive()) await deleteAttentionData();
    resetProgress();
    state.progress = withProtocolAssignment(freshDefaultProgress());
    state.sessionPlan = null;
    state.sessionMode = "protocol";
    state.sessionSource = "guided";
    state.progressionScored = true;
    state.guidedReturn = null;
    state.progressDashboardMode = "overview";
    state.pendingTaskStart = null;
    state.editingProofBenchmarkId = null;
    state.viewHistory = [];
    markSync(state.cloudSyncMode === "cloud" ? "synced" : "local", "Attention Coach data deleted.");
    go("welcome", { replace: true });
  } catch (error) {
    console.warn("Attention data deletion failed.", error);
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
        <img src="${assetPath("attention-coach-wordmark-v3.svg")}" alt="Attention Coach" class="splash-wordmark" />
        <div class="splash-title">
          <p>Train attention control and cognitive capacity.</p>
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
      </section>
      <div class="splash-wave splash-wave-one" aria-hidden="true"></div>
      <div class="splash-wave splash-wave-two" aria-hidden="true"></div>
      <section class="splash-footer">
        ${button("Start today's session", "start-readiness")}
        ${button("Choose a practice game", "nav-free-play-formats", "secondary")}
        <a class="splash-site-link" href="https://www.iqmindware.com" target="_blank" rel="noreferrer"><img class="splash-site-icon" src="${assetPath("trident-splash-icon.png")}" alt="" aria-hidden="true" />www.iqmindware.com</a>
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
              <span>Timing check</span><strong>${readinessStatusLabel(readiness.quality)}</strong>
              <span>Motion games</span><strong>${readiness.flowEligible ? "Pass" : "Low confidence"}</strong>
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
        <p class="ui-eyebrow">Signal foundation</p>
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
        ${button("Start signal foundation", "begin-session")}
        ${button("Today's plan", "nav-today", "secondary")}
      </div>
    </section>
  `);
}

function renderToday(): string {
  const phase = state.progress.currentPhase;
  const completedToday = guidedCompletedToday();
  if (guidedSessionsCompleted() >= TARGET_ENVELOPE_SESSIONS) {
    return shell(`
      ${appTabs("today")}
      <section class="daily-loop-screen">
        <div class="today-action-card programme-complete-panel">
          <p class="ui-eyebrow">20-session envelope reached</p>
          <h1>Mixed transfer practice continues</h1>
          <p class="ui-body">You have reached the planned ${TARGET_ENVELOPE_SESSIONS}-session envelope. Guided sessions now continue as mixed practice, return checks, and delayed re-checks when needed.</p>
          <div class="today-primary-actions">
            ${button("Continue guided practice", "start-guided-instructions")}
            <button class="secondary-link-button" data-action="nav-progress">View progress</button>
            <button class="secondary-link-button" data-action="nav-free-play">Practice only</button>
          </div>
        </div>
        <div class="today-plan-card">
          ${programmeProgressCard(TARGET_ENVELOPE_SESSIONS)}
        </div>
      </section>
    `);
  }
  const returnCopy = hasReturnGap()
    ? `<p class="return-cue">Welcome back. Your guided session is ready; you can also choose an easier practice today.</p>`
    : "";
  const completedTodayCopy = completedToday
    ? `<p class="return-cue is-complete-today">Today's guided session is complete. Come back tomorrow, or choose short Practice only.</p>`
    : "";
  return shell(`
    ${appTabs("today")}
    <section class="daily-loop-screen">
      <div class="today-action-card">
        <p class="ui-eyebrow">Today - Session ${Math.min(state.progress.sessionNumber, TARGET_ENVELOPE_SESSIONS)} of ${TARGET_ENVELOPE_SESSIONS}</p>
        <h1>Today's attention session</h1>
        <p class="ui-body">Recommended: one guided session per day. Practice mode is optional.</p>
        ${returnCopy}
        ${completedTodayCopy}
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
          ${button("Start today's attention session", "start-guided-instructions")}
          <button class="secondary-link-button" data-action="start-easier-instructions">Practice only</button>
          <button class="secondary-link-button" data-action="nav-today-rationale">Why this?</button>
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

const FREE_PLAY_CELLS: Array<{ cell: CellKey; label: string; detail: string }> = [
  { cell: "arrow_abs", label: "Signal foundation", detail: "Static arrows and simple signal control." },
  { cell: "flow_abs", label: "Motion Foundation", detail: "Moving patterns with the same rule." },
  { cell: "arrow_rel", label: "Relation Foundation", detail: "Use relationships around the centre." },
  { cell: "flow_rel", label: "Motion Relations", detail: "Recover relational control in motion." },
  { cell: "mixed", label: "Mixed Practice", detail: "Formats switch from trial to trial." },
];

const FREE_PLAY_GROUPS: Record<Construct, { title: string; detail: string; icon: string }> = {
  ACC: {
    title: "Signal Control",
    detail: "Pick out the main signal in brief displays.",
    icon: "target",
  },
  BSE: {
    title: "Binding Stability",
    detail: "Keep feature and colour bound.",
    icon: "binding",
  },
};

function freePlayCellIcon(cell: CellKey): string {
  if (cell === "arrow_abs") return "target";
  if (cell === "flow_abs") return "transfer";
  if (cell === "arrow_rel") return "relational";
  if (cell === "flow_rel") return "pathway";
  return "list";
}

function renderFreePlay(): string {
  return shell(`
    ${appTabs("session")}
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
          <span>${miniIcon("calendar-check")}</span>
          <strong>Today's coached session</strong>
          <p>This implements the Trident G Far Transfer Protocol for guided progress.</p>
          ${button("Today's Session", "nav-today", "secondary")}
        </article>
        <article class="train-choice-card is-orange">
          <span>${miniIcon("gamepad")}</span>
          <strong>Practice games</strong>
          <p>Try different games without changing your coached pathway or progress status.</p>
          ${button("Choose a game", "nav-free-play-formats", "secondary")}
        </article>
        <article class="train-choice-card is-green">
          <span>${miniIcon("map")}</span>
          <strong>Training explained</strong>
          <p>See how the sessions connect and why they target cognitive control capacity.</p>
          ${button("View map", "nav-training-map", "secondary")}
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
  const eligibleWrappers = eligibleFreePlayWrappers(state.progress.transferControllerState);
  const eligibleCells = FREE_PLAY_CELLS.filter(({ cell }) =>
    cell === "mixed" ? eligibleWrappers.length >= 2 : eligibleWrappers.includes(cell as Exclude<CellKey, "mixed">),
  );
  const card = (construct: Construct, cell: CellKey, label: string, detail: string) => `
    <button class="practice-format-card" data-free-construct="${construct}" data-free-cell="${cell}">
      <span class="practice-format-icon" aria-hidden="true">${miniIcon(freePlayCellIcon(cell))}</span>
      <span class="practice-format-copy">
        <strong>${escapeHtml(label)}</strong>
        <small>${escapeHtml(detail)}</small>
      </span>
    </button>
  `;
  const group = (construct: Construct) => {
    const groupMeta = FREE_PLAY_GROUPS[construct];
    return `
      <section class="practice-format-group" aria-label="${groupMeta.title}">
        <div class="practice-format-heading">
          <span class="section-icon is-purple" aria-hidden="true">${miniIcon(groupMeta.icon)}</span>
          <span>
            <strong>${groupMeta.title}</strong>
            <small>${groupMeta.detail}</small>
          </span>
        </div>
        <div class="practice-format-grid">
          ${eligibleCells.map(({ cell, label, detail }) => card(construct, cell, label, detail)).join("")}
        </div>
      </section>
    `;
  };
  return shell(`
    ${appTabs("session")}
    <section class="train-screen free-play-formats-screen">
      <div class="practice-format-note">
        <strong>Free Play</strong>
        <span>Practice only - this does not advance phase, WAP readiness, or transfer scores.</span>
      </div>
      <div class="practice-format-layout">
        ${group("ACC")}
        ${group("BSE")}
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
        <p>Train attention to signal, change the display, then check if the attention skill survives the change.</p>
      </div>
      <div class="action-row">
        ${button("Start training", "begin-session")}
      </div>
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
    {
      probeStatus: baseTrial.probeStatus,
      evidencePurpose: baseTrial.evidencePurpose,
      mixRatio: baseTrial.mixRatio,
      mappingTiming: baseTrial.mappingTiming,
      lureType: baseTrial.lureType,
      transferEventId: baseTrial.transferEventId,
    },
  );
}

function currentBlockHasVariableResponseAxis(): boolean {
  const block = state.sessionPlan?.miniBlocks[state.activeBlockIndex];
  return block ? shouldShowRuleCue(block.cells) : false;
}

function shouldShowRuleCueForTrial(trial: TrialDefinition): boolean {
  const block = state.sessionPlan?.miniBlocks[state.activeBlockIndex];
  return Boolean(block && shouldShowRuleCueForBlockTrial(block.cells, trial));
}

function renderTask(): string {
  const trial = activeTrial();
  const block = state.sessionPlan?.miniBlocks[state.activeBlockIndex];
  if (!trial || !block) return renderToday();
  const blockProgress = state.activeTrialIndex + 1;
  const blockTotal = currentBlockTrialCount();
  const isPaused = state.taskStage === "paused";
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
    : state.taskStage === "rule_cue"
      ? ruleCueForTrial(trial)
    : isPaused
      ? "Paused."
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
        ${isPaused
          ? `<div class="task-paused-note" aria-live="polite"><strong>Paused</strong><span>Resume when ready.</span></div>`
          : state.taskStage === "rule_cue"
            ? `<div class="trial-rule-cue" aria-live="polite"><span>Rule</span><strong>${escapeHtml(ruleCueForTrial(trial))}</strong></div>`
            : stimulusSvg(trial, state.taskStage)}
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
      <p class="task-footnote">${trial.construct === "BSE" ? "Keep direction and colour together." : "Choose the majority direction."} Click or tap the matching target.</p>
      <div class="task-controls">
        <button class="task-skip-button" data-action="${isPaused ? "resume-paused-session" : "pause-session"}"><span>${isPaused ? "R" : "II"}</span> ${isPaused ? "Resume" : "Pause"}</button>
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
  if (optionCount === 2 || optionCount === 4) {
    return `<span class="response-label">${label}</span>${responseTargetIcon(option)}`;
  }
  return `<span>${label}</span><kbd>${index + 1}</kbd>`;
}

function renderSparklineGraph(graph: InterblockGraph): string {
  const width = 220;
  const height = 72;
  const left = 10;
  const right = 10;
  const top = 8;
  const bottom = 14;
  const plotWidth = width - left - right;
  const plotHeight = height - top - bottom;
  const points = graph.points.slice(-8);
  const valueFor = (raw: number | null, delta: number | null): number | null => {
    if (graph.mode === "delta") return delta;
    return raw;
  };
  const smoothFor = (raw: number | null, smoothed: number | null): number | null => {
    if (smoothed === null) return null;
    if (graph.mode === "delta") return graph.baseline === null ? null : smoothed - graph.baseline;
    return smoothed;
  };
  const yFor = (value: number): number => {
    const clamped = Math.max(graph.axisMin, Math.min(graph.axisMax, value));
    return top + (1 - (clamped - graph.axisMin) / Math.max(1, graph.axisMax - graph.axisMin)) * plotHeight;
  };
  const xFor = (index: number): number => left + (points.length <= 1 ? plotWidth / 2 : (index / (points.length - 1)) * plotWidth);
  const rawPoints = points
    .map((point, index) => {
      const value = valueFor(point.rawValue, point.deltaFromBaseline);
      return value === null ? null : { x: xFor(index), y: yFor(value), value };
    })
    .filter((point): point is { x: number; y: number; value: number } => point !== null);
  const smoothPoints = points
    .map((point, index) => {
      const value = smoothFor(point.rawValue, point.smoothedValue);
      return value === null ? null : { x: xFor(index), y: yFor(value) };
    })
    .filter((point): point is { x: number; y: number } => point !== null);
  const smoothPath = smoothPoints.map((point, index) => `${index === 0 ? "M" : "L"}${point.x.toFixed(1)} ${point.y.toFixed(1)}`).join(" ");
  const baselineValue = graph.mode === "delta" ? 0 : graph.baseline;
  const baselineLine = baselineValue === null || baselineValue < graph.axisMin || baselineValue > graph.axisMax
    ? ""
    : `<line class="interblock-graph-baseline" x1="${left}" x2="${width - right}" y1="${yFor(baselineValue).toFixed(1)}" y2="${yFor(baselineValue).toFixed(1)}" />`;
  const latest = points[points.length - 1];
  const latestValue = graph.mode === "delta" ? latest?.deltaFromBaseline : latest?.rawValue;
  const latestText = latestValue === null || latestValue === undefined
    ? "Calibrating"
    : `${graph.mode === "delta" && latestValue > 0 ? "+" : ""}${graph.unit === "%" ? Math.round(latestValue) : latestValue.toFixed(1)}${graph.unit === "%" ? "%" : ""}`;
  return `
    <section class="interblock-graph-card">
      <div class="interblock-graph-head">
        <span>${escapeHtml(graph.label)}</span>
        <strong>${escapeHtml(latestText)}</strong>
      </div>
      <svg class="interblock-sparkline" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeHtml(graph.label)} trend">
        <rect class="interblock-graph-bg" x="0" y="0" width="${width}" height="${height}" rx="8"></rect>
        ${baselineLine}
        ${smoothPath ? `<path class="interblock-graph-smooth" d="${smoothPath}" />` : ""}
        ${rawPoints.map((point) => `<circle class="interblock-graph-point" cx="${point.x.toFixed(1)}" cy="${point.y.toFixed(1)}" r="3.2" />`).join("")}
      </svg>
      <small>${graph.mode === "delta" ? "Change from your baseline" : "Raw blocks + smoothed trend"}</small>
    </section>
  `;
}

function renderInvariantPromptCard(prompt: string | null): string {
  if (!prompt) return "";
  return `
    <section class="invariant-prompt-card">
      <span>Format cue</span>
      <strong>${escapeHtml(prompt)}</strong>
    </section>
  `;
}

function renderInterblockProgressCard(feedback: InterblockFeedback | null): string {
  if (!feedback) return "";
  return `
    <section class="interblock-progress-card">
      <div class="interblock-progress-copy">
        <span>Block feedback</span>
        <strong>${escapeHtml(feedback.phaseLabelText)}</strong>
        <p>${escapeHtml(feedback.interpretationText)}</p>
      </div>
      <div class="interblock-graph-grid">
        ${renderSparklineGraph(feedback.accuracyGraph)}
        ${renderSparklineGraph(feedback.coreGraph)}
      </div>
      <div class="interblock-next-row">
        <span>${escapeHtml(feedback.confidenceLabel.replaceAll("_", " "))}</span>
        <p>${escapeHtml(feedback.nextActionText)}</p>
      </div>
    </section>
  `;
}

function currentInvariantPrompt(): { key: string; prompt: string } | null {
  if (state.sessionMode !== "protocol" || state.activeBlockIndex !== 0) return null;
  const key = invariantPromptKey(state.progress.currentPhase, state.progress.protocolGroup, state.progress.programmeRunId);
  if (!key || state.progress.seenInvariantPromptKeys.includes(key)) return null;
  const prompt = getInvariantPrompt({ phase: state.progress.currentPhase, protocolGroup: state.progress.protocolGroup });
  return prompt ? { key, prompt } : null;
}

function markCurrentInvariantPromptSeen(): void {
  const current = currentInvariantPrompt();
  if (!current) return;
  state.progress = {
    ...state.progress,
    seenInvariantPromptKeys: [...state.progress.seenInvariantPromptKeys, current.key].slice(-80),
  };
  persistProgress();
}

function recordGuidedBlockFeedback(block: MiniBlockPlan, results: TrialResult[]): void {
  if (state.sessionMode !== "protocol" || !state.progressionScored) return;
  const point = createBlockFeedbackPoint({
    programmeRunId: state.progress.programmeRunId,
    programmeCycle: state.progress.programmeCycle,
    sessionNumber: state.progress.sessionNumber,
    phase: state.progress.currentPhase,
    phaseStatus: state.progress.phaseStatus,
    block,
    results,
  });
  if (!point) return;
  state.progress = {
    ...state.progress,
    blockFeedbackHistory: [...(state.progress.blockFeedbackHistory || []), point].slice(-160),
  };
  persistProgress();
}

function renderBlockBreak(): string {
  const nextBlock = state.sessionPlan?.miniBlocks[state.activeBlockIndex];
  if (!nextBlock) return renderComplete();
  const copy = blockTrainingCopy(nextBlock);
  const example = exampleTrialForBlock(nextBlock, state.sessionPlan?.phase || state.progress.currentPhase);
  const feedback = buildInterblockFeedback({
    history: state.progress.blockFeedbackHistory || [],
    currentProgrammeRunId: state.progress.programmeRunId,
    wapStatus: state.progress.phaseStatus,
    phase: state.progress.currentPhase,
  });
  const prompt = currentInvariantPrompt();
  return shell(`
    ${renderInterblockProgressCard(feedback)}
    ${renderInvariantPromptCard(prompt?.prompt || null)}
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
        <p>10 quick trials. No progress score.</p>
      </div>
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
        <span>${block.construct === "BSE" ? "Keep feature + direction linked" : "Pick out the signal"}</span>
        <span>Choose the majority</span>
        <span>Accuracy before speed</span>
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
        <h1>${isSetupPractice ? `Ready for training block ${returnIndex + 1}` : isEasierPractice ? "Practice complete" : `${Math.round((correct / total) * 100)}% correct`}</h1>
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
  const lastGuided = latestGuidedCompletion();
  if ((lastGuided?.sessionNumber || 0) >= TARGET_ENVELOPE_SESSIONS) {
    return shell(`
      <section class="panel result-panel programme-complete-panel">
        <p class="ui-eyebrow">20-session envelope reached</p>
        <h1>Mixed transfer practice continues</h1>
        <p class="ui-body">Guided sessions now continue as mixed transfer practice, return checks, and delayed re-checks when needed.</p>
        ${programmeProgressCard(TARGET_ENVELOPE_SESSIONS)}
        <div class="session-read-card is-green">
          <span>Next option</span>
          <strong>Continue guided practice</strong>
          <p>This keeps your current transfer state and adds maintenance or re-check sessions.</p>
        </div>
        <div class="action-row">
          ${button("Continue guided practice", "start-guided-instructions")}
          ${button("View progress", "nav-progress", "secondary")}
          ${button("Practice only", "nav-free-play", "ghost")}
        </div>
      </section>
    `);
  }
  if (state.progress.sessionNumber === 6 && state.progress.profileRevealSeen) {
    return shell(`
      <section class="panel result-panel">
        <p class="ui-eyebrow">Session 5 complete</p>
        <h1>Your pattern is becoming clearer.</h1>
        <p class="ui-body">The app now has enough sessions to start showing how your attention session is developing.</p>
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
      ${programmeProgressCard()}
      <p class="return-cue is-complete-today">Today's guided session is complete. Come back tomorrow, or choose short Practice only.</p>
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
      <figure class="training-map-figure is-brain-diagram">
        ${brainNetworkDiagram()}
      </figure>
      <div class="training-map-note">
        <strong>Brain-based design</strong>
        <span>Attention Coach is evidence-based brain training, targeting the brain networks and structures above for attention control, flexible updating, relational processing, and working-memory, through adaptive training.</span>
      </div>
      <div class="action-row">
        ${button("Session hub", "nav-free-play", "secondary")}
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

type GTrackHistoryRow = Awaited<ReturnType<typeof loadGTrackHistory>>[number];

function finiteScore(value: unknown): number | null {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function gTrackStandardScore(row: GTrackHistoryRow, metric: string): number | null {
  return finiteScore(row.issuedNorm?.[metric]?.standardScore) ?? finiteScore(row.latestNorm?.[metric]?.standardScore);
}

function gTrackEntriesFromHistory(rows: GTrackHistoryRow[]): ProofBenchmarkEntry[] {
  return rows.flatMap((row) => {
    const completedAt = String(row.completedAt || todayIso()).slice(0, 10);
    if (row.completionQuality && row.completionQuality !== "valid") return [];
    if (row.testId === "psi-core") {
      const entries: ProofBenchmarkEntry[] = [];
      const focusScore = gTrackStandardScore(row, "focus");
      if (focusScore !== null) {
        entries.push({
          id: `gtrack-attention-${row.id}-focus`,
          domain: "attention",
          timepoint: "ad_hoc",
          label: "G Track Focus",
          score: focusScore,
          confidence: row.issuedNorm?.focus?.normStatus?.confidence || row.latestNorm?.focus?.normStatus?.confidence || "G Track",
          source: "G Track",
          completedAt,
          notes: "Imported from signed-in G Track history.",
        });
      }
      const processingScore = gTrackStandardScore(row, "processing");
      if (processingScore !== null) {
        entries.push({
          id: `gtrack-working-memory-${row.id}-processing`,
          domain: "working_memory",
          timepoint: "ad_hoc",
          label: "G Track Processing",
          score: processingScore,
          confidence: row.issuedNorm?.processing?.normStatus?.confidence || row.latestNorm?.processing?.normStatus?.confidence || "G Track",
          source: "G Track",
          completedAt,
          notes: "Imported from signed-in G Track history.",
        });
      }
      return entries;
    }
    const reasoningScore = gTrackStandardScore(row, "theta");
    return reasoningScore === null
      ? []
      : [{
        id: `gtrack-reasoning-${row.id}-theta`,
        domain: "reasoning",
        timepoint: "ad_hoc",
        label: "G Track Matrix",
        score: reasoningScore,
        confidence: row.issuedNorm?.theta?.normStatus?.confidence || row.latestNorm?.theta?.normStatus?.confidence || "G Track",
        source: "G Track",
        completedAt,
        notes: "Imported from signed-in G Track history.",
      }];
  });
}

function proofEntriesFor(domain: ProofBenchmarkDomain): ProofBenchmarkEntry[] {
  return state.progress.proofBenchmarks
    .filter((entry) => entry.domain === domain)
    .sort((a, b) => a.completedAt.localeCompare(b.completedAt));
}

function proofStatus(score: number | null): string {
  if (score === null) return "No score yet";
  if (score >= 115) return "Strong";
  if (score >= 105) return "Above average";
  if (score >= 90) return "Typical range";
  return "Needs re-check";
}

function proofBarPercent(score: number | null): number {
  if (score === null) return 0;
  return Math.max(4, Math.min(100, ((score - 70) / 60) * 100));
}

function proofSparkline(entries: ProofBenchmarkEntry[]): string {
  const scored = entries.filter((entry) => entry.score !== null && entry.score !== undefined).slice(-3);
  if (scored.length < 2) return "";
  const points = scored.map((entry, index) => {
    const left = scored.length === 1 ? 50 : (index / (scored.length - 1)) * 100;
    const top = 100 - proofBarPercent(entry.score);
    return `<i style="left:${left}%;top:${top}%"></i>`;
  }).join("");
  return `<span class="proof-mini-trend" aria-hidden="true">${points}</span>`;
}

function proofSummaryCard(domain: ProofBenchmarkDomain): string {
  const entries = proofEntriesFor(domain);
  const latest = entries[entries.length - 1] || null;
  const scoredEntries = entries.filter((entry) => entry.score !== null && entry.score !== undefined);
  const baseline = entries.find((entry) => entry.timepoint === "baseline" && entry.score !== null) || scoredEntries[0] || null;
  const change = latest?.score !== null && latest?.score !== undefined && baseline?.score !== null && baseline?.score !== undefined
    ? latest.score - baseline.score
    : null;
  const shortLabels: Record<ProofBenchmarkDomain, string> = {
    attention: "Attention",
    working_memory: "Working memory",
    reasoning: "Reasoning",
  };
  const latestScore = latest?.score ?? null;
  const scoreText = latestScore === null ? "--" : Math.round(latestScore).toString();
  const status = proofStatus(latestScore);
  const source = latest?.source || (latest ? "Manual" : "G Track");
  return `
    <article class="proof-summary-card">
      <div class="proof-card-top">
        <span>${shortLabels[domain]}</span>
        <strong>${scoreText}</strong>
      </div>
      <div class="proof-score-bar" aria-label="${shortLabels[domain]} score ${scoreText}">
        <b></b>
        <i style="width:${proofBarPercent(latestScore)}%"></i>
      </div>
      <div class="proof-card-meta">
        <small>${escapeHtml(status)}${latest ? ` · ${escapeHtml(source)}` : ""}</small>
        <small>${latest ? escapeHtml(latest.completedAt || "No date") : "Take or add a G Track check."}</small>
      </div>
      <div class="proof-card-foot">
        ${change === null || latest === baseline ? "<em>Baseline pending</em>" : `<em>${change > 0 ? "+" : ""}${Math.round(change)} since first check</em>`}
        ${proofSparkline(scoredEntries)}
      </div>
    </article>
  `;
}

function proofEntryRows(): string {
  if (state.progress.proofBenchmarks.length === 0) {
    return `<p class="empty-proof-note">No HRP Lab benchmark entries yet. Add scores manually when the external tests are available.</p>`;
  }
  return [...state.progress.proofBenchmarks]
    .sort((a, b) => b.completedAt.localeCompare(a.completedAt))
    .map((entry) => {
      const isGTrack = entry.id.startsWith("gtrack-") || entry.source === "G Track";
      return `
        <div class="proof-entry-row">
          <span>${escapeHtml(PROOF_DOMAIN_LABELS[entry.domain])}</span>
          <strong>${escapeHtml(entry.label)} - ${entry.score ?? "No score"}</strong>
          <small>${escapeHtml(PROOF_TIMEPOINT_LABELS[entry.timepoint])} - ${escapeHtml(entry.completedAt || "No date")} - ${escapeHtml(entry.confidence || "Confidence not set")}</small>
          ${isGTrack ? "<em>Synced from G Track</em>" : `<button data-proof-edit="${escapeHtml(entry.id)}">Edit</button><button data-proof-delete="${escapeHtml(entry.id)}">Delete</button>`}
        </div>
      `;
    }).join("");
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
        <p>Use this for your own external benchmark records. Entries stay separate from Attention Coach training scores and are not certificates, credentials, or institutional reports.</p>
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
    ${appTabs("progress")}
    <section class="proof-screen proof-overview-screen no-scroll-screen">
      ${renderDashboardHeader("Progress", "proof", "Private benchmark check-ins stay separate from coach scores.")}
      <div class="proof-hero">
        <p class="ui-eyebrow">G Track check-in</p>
        <h1>Three quick proof signals</h1>
        <p>Signed-in G Track scores and private entries stay separate from coach training scores.</p>
      </div>
      <section class="proof-summary-grid">
        ${proofSummaryCard("attention")}
        ${proofSummaryCard("working_memory")}
        ${proofSummaryCard("reasoning")}
      </section>
      <section class="overview-next-card proof-next-card">
        <p><strong>Use as a check-in.</strong> These are not IQ scores, certificates, or selection evidence.</p>
        <div class="dashboard-actions proof-actions">
          ${button("Add manual score", "nav-proof-entry")}
          ${button("View details", "nav-proof-entry", "secondary")}
        </div>
      </section>
    </section>
  `);
}

function renderProofEntry(): string {
  return shell(`
    ${appTabs("progress")}
    <section class="proof-screen proof-entry-screen">
      ${renderDashboardHeader("Progress", "proof", "Private benchmark check-ins stay separate from coach scores.")}
      <div class="proof-hero compact-page-header">
        <p class="ui-eyebrow">Private benchmark entry</p>
        <h1>Manual records.</h1>
        <p>Entries stay separate from training scores and are never labelled as credentials or selection evidence.</p>
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

function averageScore(values: Array<number | null>): number | null {
  const available = values.filter((value): value is number => value !== null);
  if (available.length === 0) return null;
  return Math.round(available.reduce((total, value) => total + value, 0) / available.length);
}

function changeFromStart(score: number | null): number | null {
  return score === null ? null : score - 100;
}

function statusForScore(score: number | null, focus = false): string {
  if (score === null) return "Calibrating";
  if (focus) return "Bottleneck";
  if (score >= 110) return "Strong";
  if (score < 96) return "Bottleneck";
  if (score < 105) return "Watch";
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
  if (status === "Above benchmark") return "Above the opted-in benchmark range.";
  if (status === "Typical range") return "Within the opted-in benchmark range.";
  if (status === "Below benchmark") return "Below the opted-in benchmark range.";
  if (status === "Benchmark pending") return "Needs signed-in benchmark data.";
  if (status === "Watch") return "Needs more consistency.";
  if (status === "Bottleneck") return "Likely limiting transfer.";
  if (status === "Developing") return "Building steadily.";
  return "More guided data needed.";
}

function transferStatus(score: number | null): string {
  if (score === null) return "Calibrating";
  if (benchmarkScoringSelected()) {
    if (score >= 110) return "Above benchmark";
    if (score < 90) return "Below benchmark";
    return "Typical range";
  }
  if (score >= 8) return "Strong";
  if (score >= 0) return "Developing";
  if (score >= -7) return "Watch";
  return "Bottleneck";
}

function averageNullableScores(values: Array<number | null>): number | null {
  const available = values.filter((value): value is number => value !== null);
  if (available.length === 0) return null;
  return Math.round(available.reduce((total, value) => total + value, 0) / available.length);
}

function scoreHistoryEntryFromState(input: {
  programmeRunId: string;
  programmeCycle: number;
  sessionNumber: number;
  completedAt: string;
  phase: PhaseLabel;
  protocolGroup: ProtocolGroup;
  evidence: CellEvidence[];
  snapshot: ReturnType<typeof createScoreSnapshot>;
}): ProgressScoreHistoryEntry {
  const metricScores = progressMetricScores({
    evidence: input.evidence,
    protocolGroup: input.protocolGroup,
    activePhase: input.phase,
  });
  return {
    programmeRunId: input.programmeRunId,
    programmeCycle: input.programmeCycle,
    sessionNumber: input.sessionNumber,
    completedAt: input.completedAt,
    phase: input.phase,
    metrics: {
      transfer: input.snapshot.transfer.score,
      cognitiveBandwidth: metricScores.cognitiveBandwidth,
      frameBandwidth: metricScores.frameBandwidth,
      patternBinding: metricScores.patternBinding,
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

const STANDARD_SCORE_METRIC_KEYS: Record<ProgressScoreMetric, string> = {
  transfer: "transfer.score",
  cognitiveBandwidth: "control.training_score",
  frameBandwidth: "transfer.relation_recovery",
  patternBinding: "binding.training_score",
  wrapperRecovery: "transfer.motion_recovery",
  delayedRecovery: "transfer.return_strength",
};

function benchmarkScoreForMetric(metric: ProgressScoreMetric): number | null {
  if (!benchmarkScoringSelected()) return null;
  const row = state.standardizedScores[STANDARD_SCORE_METRIC_KEYS[metric]];
  if (!row || row.standardScore === null || (row.normN !== null && row.normN < 2)) return null;
  return Math.round(row.standardScore);
}

function scoreDisplayForMetric(metric: ProgressScoreMetric, personalDelta: number | null): number | null {
  return benchmarkScoringSelected() ? benchmarkScoreForMetric(metric) : personalDelta;
}

function statusForMetricDisplay(metric: ProgressScoreMetric, personalDelta: number | null): string {
  if (!benchmarkScoringSelected()) return statusForDelta(personalDelta);
  const standardScore = benchmarkScoreForMetric(metric);
  if (standardScore === null) return "Benchmark pending";
  if (standardScore >= 110) return "Above benchmark";
  if (standardScore < 90) return "Below benchmark";
  return "Typical range";
}

function scoreUnitLabel(): string {
  return benchmarkScoringSelected() ? "std" : "pts";
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

function progressDashboardPresentationModel(): ProgressDashboardPresentationModel {
  const snapshot = state.progress.latestSnapshot;
  const metricScores = progressMetricScores({
    evidence: state.progress.evidence,
    protocolGroup: state.progress.protocolGroup,
    activePhase: state.progress.currentPhase,
  });
  const absoluteEvidence = evidenceForCells(state.progress.evidence, "ACC", ABSOLUTE_PROGRESS_CELLS[state.progress.protocolGroup]);
  const relationalEvidence = evidenceForCells(state.progress.evidence, "ACC", RELATIONAL_PROGRESS_CELLS[state.progress.protocolGroup]);
  const activeCell = PHASE_CELL[state.progress.currentPhase];
  const bindingEvidence =
    evidenceFor("BSE", activeCell) ||
    evidenceForCells(state.progress.evidence, "BSE", ABSOLUTE_PROGRESS_CELLS[state.progress.protocolGroup]) ||
    evidenceForCells(state.progress.evidence, "BSE", RELATIONAL_PROGRESS_CELLS[state.progress.protocolGroup]);
  const signalScore = metricScores.cognitiveBandwidth;
  const relationalScore = metricScores.frameBandwidth;
  const bindingScore = metricScores.patternBinding;
  const wrapperRecoveryScore = averageScore([
    snapshot?.transfer.motionRecovery.score ?? null,
    snapshot?.transfer.relationRecovery.score ?? null,
  ]);
  const returnScore = snapshot?.transfer.returnStrength.score ?? null;
  const overallScore = snapshot?.attentionControl.trainingScore ?? null;
  const transferReadiness = snapshot?.transfer.score ?? null;
  const transferRelative = deltaFromBaseline("transfer", transferReadiness);
  const cognitiveRelative = deltaFromBaseline("cognitiveBandwidth", signalScore);
  const frameRelative = deltaFromBaseline("frameBandwidth", relationalScore);
  const bindingRelative = deltaFromBaseline("patternBinding", bindingScore);
  const wrapperRelative = deltaFromBaseline("wrapperRecovery", wrapperRecoveryScore);
  const delayedRelative = deltaFromBaseline("delayedRecovery", returnScore);
  return {
    transferRawScore: transferReadiness,
    transferDelta: scoreDisplayForMetric("transfer", transferRelative.delta),
    transferBaseline: transferRelative.baseline,
    confidence: confidenceForEvidence(state.progress.evidence.find((item) => item.construct === "ACC") || null),
    trend: [
      { session: "Start", score: overallScore === null ? null : 100, transfer: null },
      { session: `S${Math.max(1, state.progress.sessionNumber - 1)}`, score: overallScore, transfer: transferReadiness },
    ],
    transferTrend: transferDeltaTrend(transferReadiness),
    skills: [
      {
        metric: "cognitiveBandwidth",
        label: "Cognitive Bandwidth",
        subtitle: "Pick out the relevant direction signal accurately and quickly.",
        rawScore: signalScore,
        scoreDelta: scoreDisplayForMetric("cognitiveBandwidth", cognitiveRelative.delta),
        baseline: cognitiveRelative.baseline,
        status: statusForMetricDisplay("cognitiveBandwidth", cognitiveRelative.delta),
        statusNote: statusNoteFor(statusForMetricDisplay("cognitiveBandwidth", cognitiveRelative.delta)),
        confidence: confidenceForEvidence(absoluteEvidence),
        tone: "blue",
        icon: "signal",
      },
      {
        metric: "frameBandwidth",
        label: "Frame Bandwidth",
        subtitle: "Use the relation in the display, not just the surface feature.",
        rawScore: relationalScore,
        scoreDelta: scoreDisplayForMetric("frameBandwidth", frameRelative.delta),
        baseline: frameRelative.baseline,
        status: statusForMetricDisplay("frameBandwidth", frameRelative.delta),
        statusNote: statusNoteFor(statusForMetricDisplay("frameBandwidth", frameRelative.delta)),
        confidence: confidenceForEvidence(relationalEvidence),
        tone: "purple",
        icon: "relational",
      },
      {
        metric: "patternBinding",
        label: "Pattern Binding",
        subtitle: "Keep direction and colour linked while extracting the dominant pattern.",
        rawScore: bindingScore,
        scoreDelta: scoreDisplayForMetric("patternBinding", bindingRelative.delta),
        baseline: bindingRelative.baseline,
        status: statusForMetricDisplay("patternBinding", bindingRelative.delta),
        statusNote: statusNoteFor(statusForMetricDisplay("patternBinding", bindingRelative.delta)),
        confidence: confidenceForEvidence(bindingEvidence),
        tone: "teal",
        icon: "binding",
      },
      {
        metric: "wrapperRecovery",
        label: "Wrapper Recovery",
        subtitle: "Recover the same control skill when the display format changes.",
        rawScore: wrapperRecoveryScore,
        scoreDelta: scoreDisplayForMetric("wrapperRecovery", wrapperRelative.delta),
        baseline: wrapperRelative.baseline,
        status: statusForMetricDisplay("wrapperRecovery", wrapperRelative.delta),
        statusNote: statusNoteFor(statusForMetricDisplay("wrapperRecovery", wrapperRelative.delta)),
        confidence: confidenceForEvidence(evidenceFor("ACC", "mixed")),
        tone: "orange",
        icon: "transfer",
      },
      {
        metric: "delayedRecovery",
        label: "Delayed Recovery",
        subtitle: "Return to a trained skill after interruption or delay.",
        rawScore: returnScore,
        scoreDelta: scoreDisplayForMetric("delayedRecovery", delayedRelative.delta),
        baseline: delayedRelative.baseline,
        status: statusForMetricDisplay("delayedRecovery", delayedRelative.delta),
        statusNote: statusNoteFor(statusForMetricDisplay("delayedRecovery", delayedRelative.delta)),
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

function progressDashboardSegmentedControl(active: ProgressSectionMode): string {
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
      <button class="${active === "proof" ? "is-active" : ""}" data-action="nav-proof">
        <span class="segment-icon" aria-hidden="true">${miniIcon("shield")}</span>
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

function dashboardChange(value: number | null): string {
  return value === null ? "" : signedValue(value);
}

function dashboardPercent(value: number | null): number {
  return value === null ? 0 : clampPercent(value);
}

function dashboardDeltaPercent(value: number | null): number {
  if (benchmarkScoringSelected()) return value === null ? 0 : clampPercent(((value - 70) / 60) * 100);
  return value === null ? 0 : clampPercent(50 + value * 2.5);
}

function transferPillTone(status: string): string {
  if (status === "Strong" || status === "Above benchmark") return "green";
  if (status === "Bottleneck" || status === "Below benchmark") return "red";
  if (status === "Calibrating" || status === "Benchmark pending") return "blue";
  return "orange";
}

function progressStatusTone(status: string): string {
  if (status === "Strong" || status === "Above benchmark") return "green";
  if (status === "Bottleneck" || status === "Below benchmark") return "red";
  if (status === "Calibrating" || status === "Benchmark pending") return "blue";
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
    "calendar-check": `<svg ${common}><path d="M8 2v4"/><path d="M16 2v4"/><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18"/><path d="M8 16l2.2 2.2L16 12.5"/></svg>`,
    gamepad: `<svg ${common}><path d="M6.5 11h11A3.5 3.5 0 0 1 21 14.5v1A3.5 3.5 0 0 1 17.5 19c-1.2 0-2.1-.6-2.8-1.5H9.3C8.6 18.4 7.7 19 6.5 19A3.5 3.5 0 0 1 3 15.5v-1A3.5 3.5 0 0 1 6.5 11Z"/><path d="M8 14v3"/><path d="M6.5 15.5h3"/><path d="M16.5 15h.01"/><path d="M18.5 16.5h.01"/></svg>`,
    map: `<svg ${common}><path d="M9 18l-6 3V6l6-3 6 3 6-3v15l-6 3-6-3Z"/><path d="M9 3v15"/><path d="M15 6v15"/></svg>`,
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

function renderDashboardHeader(title: string, mode: ProgressSectionMode, note: string): string {
  return `
    <div class="dashboard-header" aria-label="${escapeHtml(title)} - ${escapeHtml(note)}">
      ${progressDashboardSegmentedControl(mode)}
    </div>
  `;
}

function metricBoundaryStrip(): string {
  return `
    <section class="metric-boundary-strip">
      <span>${miniIcon("shield")}Training signal only</span>
      <small>Scores are context-limited estimates from specific tasks, not fixed traits, IQ scores, credentials, or institutional selection evidence.</small>
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
          <strong class="skill-change ${skill.scoreDelta === null || skill.scoreDelta >= 0 ? "is-up" : "is-down"}">${scoreUnitLabel()}</strong>
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
            <div class="progress-level-num"><span>${dashboardScore(skill.scoreDelta)}</span><small>${scoreUnitLabel()}</small></div>
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
          <strong>${guidedSessionsCompleted()} of ${TARGET_ENVELOPE_SESSIONS} guided sessions</strong>
          <small>Current guided session: ${Math.min(state.progress.sessionNumber, TARGET_ENVELOPE_SESSIONS)}</small>
        </div>
        <div class="programme-dots">${programmeProgressDots()}</div>
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
      ${metricBoundaryStrip()}
      <section class="overview-next-card">
        <p><strong>Next step:</strong> Continue the guided session from Today, or choose an easier practice option without changing your progress path.</p>
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
  const model = progressDashboardPresentationModel();
  const transferState = transferStatus(model.transferDelta);
  const transferTone = transferPillTone(transferState);
  return `
    <section class="dashboard-screen dashboard-overview progress-score-page">
      ${renderDashboardHeader("Progress", "overview", "Track transfer, bottlenecks and attention-control levels.")}
      <section class="progress-readiness-card">
        <div class="progress-readiness-left">
          <h2>Cognitive Control Capacity</h2>
          <div class="progress-readiness-score">
            <span class="num ${model.transferDelta === null ? "is-placeholder" : ""}">${dashboardScore(model.transferDelta)}</span><span class="denom">${scoreUnitLabel()}</span>
            <span class="progress-pill is-${transferTone}">${escapeHtml(transferState)}</span>
          </div>
          ${model.transferDelta === null ? "" : `<p>${benchmarkScoringSelected() ? "Standard score against opted-in benchmark users." : "Change from your early-session baseline."}</p>`}
        </div>
        <div class="progress-readiness-mid"></div>
        <div class="progress-readiness-trend">
          ${transferDeltaSparkline(model.transferTrend)}
          <p>${model.transferDelta === null ? (benchmarkScoringSelected() ? "Benchmark pending" : "Calibrating baseline") : (benchmarkScoringSelected() ? "Personal trend retained locally" : "20-session trend from baseline")}</p>
        </div>
        <div class="progress-readiness-icon" aria-hidden="true">
          <img src="${assetPath("trident-g-fpt-logo.png")}" alt="" />
        </div>
      </section>
      ${metricBoundaryStrip()}
      <section class="progress-level-list">${renderProgressLevelCards(model)}</section>
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
          <strong class="skill-change ${skill.scoreDelta === null || skill.scoreDelta >= 0 ? "is-up" : "is-down"}">${scoreUnitLabel()}</strong>
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
      ${renderDashboardHeader("Score Detail", "detail", benchmarkScoringSelected() ? "Scores are standardised against opted-in benchmark users." : "Scores are relative to your own starting point.")}
      <section class="score-explainer-strip">
        <span><i class="marker hollow"></i>100 = ${benchmarkScoringSelected() ? "benchmark average" : "your starting point"}</span>
        <span><i class="marker blue"></i>Above 100 = ${benchmarkScoringSelected() ? "above benchmark average" : "above your start"}</span>
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
        <em>${benchmarkScoringSelected() ? "These standardised scores use opted-in app data only." : "These scores show change from your own starting point."} They are not IQ scores, certificates, or selection evidence.</em>
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

function renderCoaching(): string {
  return shell(`
    ${appTabs("coaching")}
    <section class="coaching-screen">
      <div class="coaching-hero">
        <p class="ui-eyebrow">One-to-one coaching</p>
        <h1>Book a personal Zoom review.</h1>
        <p>Use a short coaching session to review your Attention Coach pattern, decide the right pace, and choose what to do next.</p>
        <div class="coaching-actions">
          ${button("Book Zoom coaching", "open-coaching-checkout")}
          ${button("What will my coach see?", "nav-data-rights", "secondary")}
        </div>
      </div>
      <section class="coaching-value-grid" aria-label="What one-to-one coaching adds">
        <article>
          <span>${miniIcon("chart")}</span>
          <strong>Review your progress</strong>
          <p>Your coach reviews your training pattern, possible attention bottlenecks, and what looks reliable so far.</p>
        </article>
        <article>
          <span>${miniIcon("pathway")}</span>
          <strong>Plan next steps</strong>
          <p>Get guidance on whether to continue, slow down, repeat a step, change emphasis, or take a break.</p>
        </article>
        <article>
          <span>${miniIcon("signal")}</span>
          <strong>Understand results</strong>
          <p>Talk through score patterns, transfer checks, proof signals, and where more sessions are needed.</p>
        </article>
        <article>
          <span>${miniIcon("shield")}</span>
          <strong>Keep claims careful</strong>
          <p>Coaching helps interpret training signals for personal use. It is not a certificate, diagnosis, or selection report.</p>
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
  if (state.cloudSyncMode === "cloud" && state.authReady && !state.authUser && state.view !== "auth" && state.view !== "data-rights" && state.view !== "welcome") {
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
    `${state.progress.programmeRunId}:attention-${state.progress.sessionNumber}-${phase}`,
    state.progress.programmeRunId,
    state.progress.programmeCycle,
    state.progress.transferControllerState,
  );
  state.activeBlockIndex = 0;
  state.activeTrialIndex = 0;
  state.blockResults = [];
  state.sessionResults = [];
  state.feedback = "";
  state.taskStage = "ready";
  state.ruleCueTrialId = null;
  state.responseStartedAt = 0;
  state.activeBlockStartedAtMs = null;
  state.staircaseLevels = {};
  state.sessionMode = "protocol";
  state.sessionSource = phase === "P6_DELAYED" ? "recheck" : "guided";
  state.progressionScored = true;
  state.guidedReturn = null;
  pendingBlockSubmissions = [];
  go("block-break");
}

function prepareFreePlay(construct: Construct, cellKey: CellKey, source: SessionSource = "free_play"): void {
  clearStageTimer();
  const transferPath = transferPathForState(state.progress.transferControllerState);
  const freePlayPool = eligibleFreePlayWrappers(state.progress.transferControllerState);
  if (
    state.progress.transferControllerState?.heldOutStatus === "clean" &&
    (cellKey === transferPath.heldOutWrapper || (cellKey === "mixed" && freePlayPool.includes(transferPath.heldOutWrapper))) &&
    source !== "guided_practice"
  ) {
    state.progress = {
      ...state.progress,
      transferControllerState: {
        ...state.progress.transferControllerState,
        heldOutStatus: "contaminated",
        legacyStatus: state.progress.transferControllerState.legacyStatus === "none"
          ? "rebaseline_required"
          : state.progress.transferControllerState.legacyStatus,
      },
    };
    persistProgress();
  }
  state.sessionPlan = createFreePlaySessionPlan(construct, cellKey, undefined, freePlayPool);
  state.activeBlockIndex = 0;
  state.activeTrialIndex = 0;
  state.blockResults = [];
  state.sessionResults = [];
  state.feedback = "";
  state.taskStage = "ready";
  state.ruleCueTrialId = null;
  state.responseStartedAt = 0;
  state.activeBlockStartedAtMs = null;
  state.staircaseLevels = {};
  state.sessionMode = "free";
  state.sessionSource = source;
  state.progressionScored = false;
  state.guidedReturn = null;
}

function beginFreePlay(construct: Construct, cellKey: CellKey, source: SessionSource = "free_play"): void {
  prepareFreePlay(construct, cellKey, source);
  go("task");
  schedule(500, startTrialPresentation);
}

function startGuidedInstructions(): void {
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
    prepareFreePlay("ACC", PHASE_CELL[state.progress.currentPhase], "easier");
    go("practice-intro");
    return;
  }
  prepareFreePlay(pending.construct, pending.cellKey, pending.source);
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
  state.ruleCueTrialId = null;
  state.responseStartedAt = 0;
  state.activeBlockStartedAtMs = null;
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
  state.ruleCueTrialId = null;
  state.responseStartedAt = 0;
  state.activeBlockStartedAtMs = null;
  state.sessionMode = "protocol";
  state.sessionSource = state.progress.currentPhase === "P6_DELAYED" ? "recheck" : "guided";
  state.progressionScored = true;
  state.guidedReturn = null;
  return true;
}

function beginRestoredGuidedBlock(): void {
  if (!restoreGuidedReturn()) return;
  state.activeBlockStartedAtMs = performance.now();
  go("task");
  schedule(350, startTrialPresentation);
}

function startTrialPresentation(): void {
  const trial = activeTrial();
  if (!trial || state.view !== "task") return;
  if (state.activeBlockStartedAtMs === null) state.activeBlockStartedAtMs = performance.now();
  if (shouldShowRuleCueForTrial(trial) && state.ruleCueTrialId !== trial.id) {
    state.ruleCueTrialId = trial.id;
    setTaskStage("rule_cue");
    schedule(420, startTrialPresentation);
    return;
  }
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
    if (state.sessionMode === "free") {
      state.activeTrialIndex = 0;
      completeSession();
      return;
    }
    const block = state.sessionPlan?.miniBlocks[state.activeBlockIndex];
    if (block) recordGuidedBlockFeedback(block, [...state.blockResults]);
    submitCurrentGuidedBlock([...state.blockResults]);
    state.activeBlockIndex += 1;
    state.activeTrialIndex = 0;
    state.blockResults = [];
    state.activeBlockStartedAtMs = null;
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
  state.ruleCueTrialId = null;
  state.responseStartedAt = 0;
  if (state.sessionMode === "free") {
    completeSession();
    return;
  }
  const block = state.sessionPlan?.miniBlocks[state.activeBlockIndex];
  if (block) recordGuidedBlockFeedback(block, [...state.blockResults]);
  submitCurrentGuidedBlock([...state.blockResults]);
  state.activeBlockIndex += 1;
  state.activeTrialIndex = 0;
  state.blockResults = [];
  state.activeBlockStartedAtMs = null;
  if (state.activeBlockIndex >= (state.sessionPlan?.miniBlocks.length || 1)) {
    completeSession();
  } else {
    go("block-break");
  }
}

function blockSubmissionPayload(plan: SessionPlan, block: MiniBlockPlan, results: TrialResult[]) {
  return buildAttentionBlockSubmissionPayload({
    plan,
    block,
    results,
    protocolGroup: state.progress.protocolGroup,
    transferState: state.progress.transferControllerState,
    generatorVersion: GENERATOR_VERSION,
    adaptiveVersion: ADAPTIVE_VERSION,
    scoringVersion: SCORING_VERSION,
  });
}

function submitCurrentGuidedBlock(results: TrialResult[]): void {
  const plan = state.sessionPlan;
  const block = plan?.miniBlocks[state.activeBlockIndex];
  if (!plan || !block || !state.progressionScored || state.sessionMode !== "protocol") return;
  if (!cloudSyncActive()) return;
  if (results.length !== block.trialCount || block.trialCount !== 20) return;
  const submission = submitAttentionBlock(blockSubmissionPayload(plan, block, results)).catch((error) => {
    console.warn("Attention block was not submitted.", error);
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
  void Promise.allSettled(submissions).then(() => finalizeAttentionSession({
    clientSessionId: plan.sessionId,
    protocolVersion: PROTOCOL_VERSION,
    programmeRunId: plan.programmeRunId,
    programmeCycle: plan.programmeCycle,
    dataMode: state.dataMode,
    benchmarkConsent: benchmarkContributionActive(),
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
      startCarrier: state.progress.transferControllerState.startCarrier,
      startCohort: state.progress.transferControllerState.startCohort,
      startWrapper: state.progress.transferControllerState.startWrapper,
      carrierTargetWrapper: state.progress.transferControllerState.carrierTargetWrapper,
      frameTargetWrapper: state.progress.transferControllerState.frameTargetWrapper,
      heldOutWrapper: state.progress.transferControllerState.heldOutWrapper,
      heldOutStatus: state.progress.transferControllerState.heldOutStatus,
      programmeRunId: plan.programmeRunId,
      programmeCycle: plan.programmeCycle,
      completedSession: {
        sessionNumber: input.completedSessionNumber,
        programmeRunId: plan.programmeRunId,
        programmeCycle: plan.programmeCycle,
        completedAt: input.completedAt,
        phase: input.completedPhase,
        phaseStatus: input.completedPhaseStatus,
        protocolGroup: state.progress.protocolGroup,
        startCarrier: state.progress.transferControllerState.startCarrier,
        startCohort: state.progress.transferControllerState.startCohort,
      },
      nextState: {
        sessionNumber: input.nextSessionNumber,
        programmeRunId: plan.programmeRunId,
        programmeCycle: plan.programmeCycle,
        phase: input.nextPhase,
        phaseStatus: input.nextPhaseStatus,
        nominalBand: NOMINAL_BANDS[input.nextPhase],
      },
      scoreSnapshotState: {
        sessionNumber: input.snapshot.sessionNumber,
        activePhase: input.snapshot.activePhase,
        phaseStatus: input.snapshot.phaseStatus,
      },
      dataMode: state.dataMode,
      benchmarkConsent: benchmarkContributionActive(),
      scratchBaselineSources: input.snapshot.farTransfer?.boundarySignals.map((signal) => ({
        boundary: signal.boundary,
        source: signal.scratchBaselineSource,
        targetCell: signal.targetCell,
        transferEfficiency: signal.transferEfficiency,
        stabilityAdvantage: signal.stabilityAdvantage,
      })),
    },
  })).then(() => {
    void hydrateStandardizedScores();
    void hydrateGTrackProofScores();
  }).catch((error) => {
    console.warn("Attention session was not finalized.", error);
  });
}

function progressionEvidenceResults(results: TrialResult[]): TrialResult[] {
  return progressionResultsForEvidence(results, state.progress.transferControllerState.activeTargetWrapper);
}

function delayedRecheckResults(results: TrialResult[]): TrialResult[] {
  const plan = state.sessionPlan;
  if (!plan) return [];
  return selectFreshDelayedRecheckResults(results, {
    sessionId: plan.sessionId,
    programmeRunId: plan.programmeRunId,
    programmeCycle: plan.programmeCycle,
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
  const evidenceResults = progressionEvidenceResults(state.sessionResults);
  const freshDelayedResults = delayedRecheckResults(state.sessionResults);
  const freshDelayedEvidence = freshDelayedResults.length ? updateEvidenceFromResults([], freshDelayedResults) : undefined;
  const updatedEvidence = updateEvidenceFromResults(state.progress.evidence, evidenceResults);
  const farTransferWindows = createFarTransferWindows({
    existingWindows: state.progress.farTransferWindows,
    results: evidenceResults,
    sessionNumber: state.progress.sessionNumber,
  });
  const decision = chooseNextPhase({
    currentPhase: state.progress.currentPhase,
    sessionNumber: state.progress.sessionNumber,
    phaseStatus: state.progress.phaseStatus,
    protocolGroup: state.progress.protocolGroup,
    completedTransitions: state.progress.completedTransitions,
    evidence: updatedEvidence,
    freshDelayedEvidence,
    transferControllerState: state.progress.transferControllerState,
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
    programmeRunId: state.progress.programmeRunId,
    programmeCycle: state.progress.programmeCycle,
    sessionNumber: completedSessionNumber,
    completedAt: guidedCompletion.completedAt,
    phase: completedPhase,
    protocolGroup: state.progress.protocolGroup,
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
    transferControllerState: decision.transferControllerState || state.progress.transferControllerState,
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
  if (state.taskStage !== "response") return;
  clearStageTimer();
  const trial = activeTrial();
  if (!trial) return;
  const isCorrect = response === trial.correctResponse;
  if (!isCorrect && response !== null) playErrorFeedbackSound();
  const currentLevel = levelForTrial(trial);
  state.staircaseLevels[staircaseKey(trial)] = nextStaircaseLevel(currentLevel, isCorrect);
  state.feedback = isCorrect ? "correct" : "incorrect";
  state.taskStage = "feedback";
  const responseAt = performance.now();
  const block = state.sessionPlan?.miniBlocks[state.activeBlockIndex];
  const timing = stimulusTimingForTrial(trial);
  const result: TrialResult = {
    trial,
    blockPurpose: block?.evidencePurpose,
    blockStartedAtMs: state.activeBlockStartedAtMs ?? undefined,
    completedAtMs: responseAt,
    programmeRunId: state.sessionPlan?.programmeRunId,
    programmeCycle: state.sessionPlan?.programmeCycle,
    response,
    isCorrect,
    rtMs: response === null ? null : Math.round(responseAt - state.responseStartedAt),
    exposureMsActual: timing.exposureMsActual,
    actualStimulusFrames: timing.actualStimulusFrames,
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
  if (state.soundOn) feedbackAudio();
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
  const preAuthGate = state.cloudSyncMode === "cloud" && !state.authUser;
  const preAuthAllowedActions = new Set([
    "send-login-link",
    "nav-auth",
    "nav-data-rights",
    "select-data-cloud-personal",
    "select-data-cloud-benchmark",
    "enable-cloud-sync",
    "use-local-only",
    "select-data-local",
  ]);
  if (preAuthGate && !preAuthAllowedActions.has(action)) {
    state.authMessage = state.authMessage || "Sign in is required to use this app.";
    go("auth");
    return;
  }
  if (action === "send-login-link") {
    if (state.dataMode === "local") setDataMode("cloud_personal");
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
    setDataMode("cloud_personal");
    state.viewHistory = [];
    go("data-rights", { replace: true });
  } else if (action === "enable-cloud-sync") {
    setDataMode("cloud_personal");
    if (state.authUser) {
      await restoreRemoteProgress();
    } else {
      state.authMessage = "Enter your email to continue with this data option.";
      go("auth");
    }
  } else if (action === "use-local-only" || action === "select-data-local") {
    setDataMode("cloud_personal");
    state.authMessage = "Sign in is required to use this app.";
    go("auth");
  } else if (action === "select-data-cloud-personal") {
    setDataMode("cloud_personal");
    if (state.authUser) {
      markDataModeSeen();
      go("data-rights", { replace: true });
    } else {
      state.authMessage = "Enter your email to continue with Cloud personal.";
      go("auth");
    }
  } else if (action === "select-data-cloud-benchmark") {
    setDataMode("cloud_benchmark");
    if (state.authUser) {
      markDataModeSeen();
      go("data-rights", { replace: true });
    } else {
      state.authMessage = "Enter your email to continue with Cloud standard scores.";
      go("auth");
    }
  } else if (action === "continue-after-data-rights") {
    markDataModeSeen();
    if (state.cloudSyncMode === "cloud" && !state.authUser) {
      state.authMessage = "Enter your email to continue with this data option.";
      go("auth");
    } else {
      go("readiness");
    }
  } else if (action === "export-attention-data") {
    await exportCurrentData();
  } else if (action === "delete-attention-data") {
    await deleteCurrentData();
  } else if (action === "nav-auth") go("auth");
  else if (action === "nav-data-rights") go("data-rights");
  else if (action === "nav-welcome") go("welcome");
  else if (action === "nav-back") goBack();
  else if (action === "start-readiness") {
    if (!state.dataModeSeen) go("data-rights");
    else go("readiness");
  }
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
    markCurrentInvariantPromptSeen();
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
    pauseTask();
  }
  else if (action === "resume-paused-session") resumePausedTask();
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
      progress: withProtocolAssignment(freshDefaultProgress()),
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
  else if (action === "restart-guided-programme") {
    const preservedReadiness = state.progress.deviceReadiness;
    const preservedProtocolGroup = state.progress.protocolGroup;
    const preservedProtocolAssignmentVersion = state.progress.protocolAssignmentVersion;
    const preservedProtocolAssignmentSeed = state.progress.protocolAssignmentSeed;
    const preservedProtocolAssignedAt = state.progress.protocolAssignedAt;
    const preservedScratchBaselines = state.progress.scratchBaselines;
    const nextProgrammeCycle = (state.progress.programmeCycle || 1) + 1;
    const restartPhase = PHASE_ORDER_BY_GROUP[preservedProtocolGroup][0];
    clearStageTimer();
    state = {
      ...state,
      progress: {
        ...DEFAULT_PROGRESS,
        programmeRunId: newProgrammeRunId(nextProgrammeCycle),
        programmeCycle: nextProgrammeCycle,
        currentPhase: restartPhase,
        deviceReadiness: preservedReadiness,
        protocolGroup: preservedProtocolGroup,
        protocolAssignmentVersion: preservedProtocolAssignmentVersion,
        protocolAssignmentSeed: preservedProtocolAssignmentSeed,
        protocolAssignedAt: preservedProtocolAssignedAt,
        scratchBaselines: preservedScratchBaselines,
        transferControllerState: migrateTransferControllerState({
          existing: null,
          currentPhase: restartPhase,
          sessionNumber: 1,
          evidence: [],
          protocolGroup: preservedProtocolGroup,
        }),
      },
      sessionPlan: null,
      sessionMode: "protocol",
      sessionSource: "guided",
      progressionScored: true,
      guidedReturn: null,
      progressDashboardMode: "overview",
      pendingTaskStart: null,
      editingProofBenchmarkId: null,
      viewHistory: [],
    };
    persistProgress();
    go("today", { replace: true });
  }
});

window.addEventListener("keydown", (event) => {
  if (state.view !== "task" || state.taskStage !== "response" || event.repeat) return;
  const trial = activeTrial();
  if (!trial) return;
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
