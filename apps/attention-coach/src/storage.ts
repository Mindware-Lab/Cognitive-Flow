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

const PREFIX = "attention-coach";
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
  saveDataMode(mode === "cloud" ? "cloud_personal" : "local");
}

export function cloudSyncModeForDataMode(mode: DataMode): CloudSyncMode {
  return mode === "local" ? "local" : "cloud";
}

export function loadDataMode(): DataMode {
  const saved = localStorage.getItem(`${PREFIX}:dataMode`);
  if (saved === "local" || saved === "cloud_personal" || saved === "cloud_benchmark") return saved;
  return localStorage.getItem(`${PREFIX}:cloudSyncMode`) === "cloud" ? "cloud_personal" : "local";
}

export function saveDataMode(mode: DataMode): void {
  localStorage.setItem(`${PREFIX}:dataMode`, mode);
  localStorage.setItem(`${PREFIX}:cloudSyncMode`, cloudSyncModeForDataMode(mode));
}

export function loadDataModeSeen(): boolean {
  return localStorage.getItem(`${PREFIX}:dataModeSeen`) === "true";
}

export function saveDataModeSeen(): void {
  localStorage.setItem(`${PREFIX}:dataModeSeen`, "true");
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
