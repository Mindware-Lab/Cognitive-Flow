import type {
  AttentionScoreSnapshot,
  BlockFeedbackPoint,
  CellEvidence,
  DeviceReadiness,
  FarTransferWindow,
  PhaseLabel,
  PhaseStatus,
  ProtocolGroup,
  ScratchBaseline,
  TransferControllerState,
  TransitionKey,
} from "./types";
import { migrateTransferControllerState } from "./transferController";

const PREFIX = "cognitive-control-coach";
const BROWSER_DEVICE_ID_KEY = `${PREFIX}:browserDeviceId`;

export function newProgrammeRunId(cycle: number): string {
  const suffix = typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return `programme-${cycle}-${suffix}`;
}

export type DataMode = "local" | "cloud_personal" | "cloud_benchmark";
export type CloudSyncMode = "local" | "cloud";
export type ProofBenchmarkDomain = "attention" | "working_memory" | "reasoning";
export type ProofBenchmarkTimepoint = "baseline" | "midpoint" | "post" | "follow_up" | "ad_hoc";
export type CompletionRoute = "guided" | "practice" | "free_play" | "easier" | "break";
export type ProgressScoreMetric =
  | "transfer"
  | "cognitiveBandwidth"
  | "frameBandwidth"
  | "patternBinding"
  | "wrapperRecovery"
  | "delayedRecovery";

export interface ProofBenchmarkEntry {
  id: string;
  domain: ProofBenchmarkDomain;
  timepoint: ProofBenchmarkTimepoint;
  label: string;
  score: number | null;
  raw?: number | null;
  maxRaw?: number | null;
  confidence: string;
  source: string;
  completedAt: string;
  notes: string;
}

export interface DailyCompletionEntry {
  id: string;
  date: string;
  route: CompletionRoute;
  completedAt: string;
  programmeRunId?: string;
  programmeCycle?: number;
  sessionNumber: number;
  phase: PhaseLabel;
}

export interface ProgressScoreHistoryEntry {
  programmeRunId?: string;
  programmeCycle?: number;
  sessionNumber: number;
  completedAt: string;
  phase: PhaseLabel;
  metrics: Partial<Record<ProgressScoreMetric, number | null>>;
}

export interface LocalProgress {
  programmeRunId: string;
  programmeCycle: number;
  sessionNumber: number;
  currentPhase: PhaseLabel;
  phaseStatus: PhaseStatus;
  completedTransitions: TransitionKey[];
  latestSnapshot: AttentionScoreSnapshot | null;
  deviceReadiness: DeviceReadiness | null;
  evidence: CellEvidence[];
  farTransferWindows: FarTransferWindow[];
  protocolGroup: ProtocolGroup;
  protocolAssignmentVersion: string | null;
  protocolAssignmentSeed: string | null;
  protocolAssignedAt: string | null;
  scratchBaselines: ScratchBaseline[];
  proofBenchmarks: ProofBenchmarkEntry[];
  completions: DailyCompletionEntry[];
  scoreHistory: ProgressScoreHistoryEntry[];
  blockFeedbackHistory: BlockFeedbackPoint[];
  seenInvariantPromptKeys: string[];
  profileRevealSeen: boolean;
  transferControllerState: TransferControllerState;
}

export const DEFAULT_PROGRESS: LocalProgress = {
  programmeRunId: newProgrammeRunId(1),
  programmeCycle: 1,
  sessionNumber: 1,
  currentPhase: "P1_ARROW_ABS",
  phaseStatus: "active",
  completedTransitions: [],
  latestSnapshot: null,
  deviceReadiness: null,
  evidence: [],
  farTransferWindows: [],
  protocolGroup: "commercial_arrows_first",
  protocolAssignmentVersion: null,
  protocolAssignmentSeed: null,
  protocolAssignedAt: null,
  scratchBaselines: [],
  proofBenchmarks: [],
  completions: [],
  scoreHistory: [],
  blockFeedbackHistory: [],
  seenInvariantPromptKeys: [],
  profileRevealSeen: false,
  transferControllerState: migrateTransferControllerState({
    currentPhase: "P1_ARROW_ABS",
    sessionNumber: 1,
    evidence: [],
  }),
};

export function progressWithProgrammeRun(progress: LocalProgress): LocalProgress {
  const maybeCycle = Number((progress as Partial<LocalProgress>).programmeCycle);
  const programmeCycle = Number.isFinite(maybeCycle) && maybeCycle >= 1 ? Math.floor(maybeCycle) : 1;
  const programmeRunId = typeof (progress as Partial<LocalProgress>).programmeRunId === "string" && progress.programmeRunId.trim()
    ? progress.programmeRunId
    : newProgrammeRunId(programmeCycle);
  const withRun = { ...progress, programmeRunId, programmeCycle };
  return {
    ...withRun,
    transferControllerState: migrateTransferControllerState({
      existing: withRun.transferControllerState,
      currentPhase: withRun.currentPhase,
      sessionNumber: withRun.sessionNumber,
      evidence: withRun.evidence || [],
      protocolGroup: withRun.protocolGroup,
    }),
  };
}

function latestProgressTimestamp(progress: LocalProgress): number {
  const timestamps = [
    ...((progress.completions || []).map((entry) => entry.completedAt)),
    ...((progress.scoreHistory || []).map((entry) => entry.completedAt)),
    ...((progress.proofBenchmarks || []).map((entry) => entry.completedAt)),
  ];
  return timestamps.reduce((latest, value) => {
    const time = Date.parse(value || "");
    return Number.isFinite(time) ? Math.max(latest, time) : latest;
  }, 0);
}

function totalEvidenceTrials(progress: LocalProgress): number {
  return (progress.evidence || []).reduce((total, item) => total + (Number(item.validTrials) || 0), 0);
}

function completedGuidedSessionCount(progress: LocalProgress): number {
  const sessionFromProgress = Math.max(0, Math.floor(Number(progress.sessionNumber) || 1) - 1);
  const latestGuidedCompletion = (progress.completions || [])
    .filter((entry) => entry.route === "guided")
    .reduce((max, entry) => Math.max(max, Number(entry.sessionNumber) || 0), 0);
  const latestScoreSession = (progress.scoreHistory || [])
    .reduce((max, entry) => Math.max(max, Number(entry.sessionNumber) || 0), 0);
  return Math.max(sessionFromProgress, latestGuidedCompletion, latestScoreSession);
}

export function compareProgressFreshness(left: LocalProgress, right: LocalProgress): number {
  const leftCycle = Math.max(1, Math.floor(Number(left.programmeCycle) || 1));
  const rightCycle = Math.max(1, Math.floor(Number(right.programmeCycle) || 1));
  if (leftCycle !== rightCycle) return leftCycle - rightCycle;

  const leftCompleted = completedGuidedSessionCount(left);
  const rightCompleted = completedGuidedSessionCount(right);
  if (leftCompleted !== rightCompleted) return leftCompleted - rightCompleted;

  const leftTimestamp = latestProgressTimestamp(left);
  const rightTimestamp = latestProgressTimestamp(right);
  if (leftTimestamp !== rightTimestamp) return leftTimestamp - rightTimestamp;

  return totalEvidenceTrials(left) - totalEvidenceTrials(right);
}

export function newerProgress(left: LocalProgress, right: LocalProgress): LocalProgress {
  return compareProgressFreshness(left, right) >= 0 ? left : right;
}

export function loadProgress(): LocalProgress {
  const raw = localStorage.getItem(`${PREFIX}:progress`);
  if (!raw) return DEFAULT_PROGRESS;
  try {
    return progressWithProgrammeRun({ ...DEFAULT_PROGRESS, ...JSON.parse(raw) } as LocalProgress);
  } catch {
    return DEFAULT_PROGRESS;
  }
}

export function saveProgress(progress: LocalProgress): void {
  localStorage.setItem(`${PREFIX}:progress`, JSON.stringify(progress));
}

export function resetProgress(): void {
  localStorage.removeItem(`${PREFIX}:progress`);
}

export function loadCloudSyncMode(): CloudSyncMode {
  return cloudSyncModeForDataMode(loadDataMode());
}

export function saveCloudSyncMode(mode: CloudSyncMode): void {
  saveDataMode(mode === "cloud" ? "cloud_benchmark" : "local");
}

export function cloudSyncModeForDataMode(mode: DataMode): CloudSyncMode {
  return mode === "local" ? "local" : "cloud";
}

export function loadDataMode(): DataMode {
  const saved = localStorage.getItem(`${PREFIX}:dataMode`);
  const userChoice = localStorage.getItem(`${PREFIX}:dataModeUserChoice`);
  if (saved === "cloud_personal" && userChoice === "cloud_personal") return "cloud_personal";
  if (saved === "cloud_benchmark") return "cloud_benchmark";
  return "cloud_benchmark";
}

export function saveDataMode(mode: DataMode): void {
  localStorage.setItem(`${PREFIX}:dataMode`, mode);
  localStorage.setItem(`${PREFIX}:dataModeUserChoice`, mode);
  localStorage.setItem(`${PREFIX}:cloudSyncMode`, cloudSyncModeForDataMode(mode));
}

export function loadDataModeSeen(): boolean {
  return localStorage.getItem(`${PREFIX}:dataModeSeen`) === "true";
}

export function saveDataModeSeen(): void {
  localStorage.setItem(`${PREFIX}:dataModeSeen`, "true");
}

export function clearDataModeSeen(): void {
  localStorage.removeItem(`${PREFIX}:dataModeSeen`);
}

export function browserDeviceId(): string {
  const existing = localStorage.getItem(BROWSER_DEVICE_ID_KEY);
  if (existing) return existing;
  const generated = typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `browser-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  localStorage.setItem(BROWSER_DEVICE_ID_KEY, generated);
  return generated;
}

export function progressForBrowserDevice(progress: LocalProgress, currentBrowserDeviceId: string): LocalProgress {
  const normalised = progressWithProgrammeRun(progress);
  const readiness = normalised.deviceReadiness;
  if (!readiness) return normalised;
  return readiness.browserDeviceId === currentBrowserDeviceId
    ? normalised
    : { ...normalised, deviceReadiness: null };
}
