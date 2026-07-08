import type {
  WorkingMemoryScoreSnapshot,
  CellEvidence,
  DeviceReadiness,
  FarTransferWindow,
  PhaseLabel,
  PhaseStatus,
  ProtocolGroup,
  ScratchBaseline,
  TransitionKey,
} from "./types";

const PREFIX = "wm-coach";
const BROWSER_DEVICE_ID_KEY = `${PREFIX}:browserDeviceId`;

export type DataMode = "local" | "cloud_personal" | "cloud_benchmark";
export type CloudSyncMode = "local" | "cloud";
export type ProofBenchmarkDomain = "relational_memory" | "binding_memory" | "reasoning";
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
  sessionNumber: number;
  phase: PhaseLabel;
  programmeRunId: string;
  programmeCycle: number;
}

export interface ProgressScoreHistoryEntry {
  sessionNumber: number;
  completedAt: string;
  phase: PhaseLabel;
  metrics: Partial<Record<ProgressScoreMetric, number | null>>;
  programmeRunId: string;
  programmeCycle: number;
}

export interface LocalProgress {
  programmeRunId: string;
  programmeCycle: number;
  sessionNumber: number;
  currentPhase: PhaseLabel;
  phaseStatus: PhaseStatus;
  completedTransitions: TransitionKey[];
  latestSnapshot: WorkingMemoryScoreSnapshot | null;
  nLevels: Record<string, number>;
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
  profileRevealSeen: boolean;
}

export const DEFAULT_PROGRESS: LocalProgress = {
  programmeRunId: newProgrammeRunId(1),
  programmeCycle: 1,
  sessionNumber: 1,
  currentPhase: "P1_ARROW_ABS",
  phaseStatus: "active",
  completedTransitions: [],
  latestSnapshot: null,
  nLevels: {},
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
  profileRevealSeen: false,
};

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
  const progressWithRun = progressWithProgrammeRun(progress);
  const readiness = progressWithRun.deviceReadiness;
  if (!readiness) return progressWithRun;
  return readiness.browserDeviceId === currentBrowserDeviceId
    ? progressWithRun
    : { ...progressWithRun, deviceReadiness: null };
}

export function newProgrammeRunId(cycle: number): string {
  const random = typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return `wm-programme-${cycle}-${random}`;
}

export function progressWithProgrammeRun(progress: LocalProgress): LocalProgress {
  const programmeCycle = Number.isFinite(progress.programmeCycle) && progress.programmeCycle > 0
    ? Math.round(progress.programmeCycle)
    : 1;
  const programmeRunId = progress.programmeRunId || newProgrammeRunId(programmeCycle);
  return {
    ...progress,
    programmeCycle,
    programmeRunId,
    completions: (progress.completions || []).map((entry) => ({
      ...entry,
      programmeRunId: entry.programmeRunId || programmeRunId,
      programmeCycle: entry.programmeCycle || programmeCycle,
    })),
    scoreHistory: (progress.scoreHistory || []).map((entry) => ({
      ...entry,
      programmeRunId: entry.programmeRunId || programmeRunId,
      programmeCycle: entry.programmeCycle || programmeCycle,
    })),
  };
}


