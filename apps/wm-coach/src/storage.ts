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
}

export interface ProgressScoreHistoryEntry {
  sessionNumber: number;
  completedAt: string;
  phase: PhaseLabel;
  metrics: Partial<Record<ProgressScoreMetric, number | null>>;
}

export interface LocalProgress {
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
  scratchBaselines: ScratchBaseline[];
  proofBenchmarks: ProofBenchmarkEntry[];
  completions: DailyCompletionEntry[];
  scoreHistory: ProgressScoreHistoryEntry[];
  profileRevealSeen: boolean;
}

export const DEFAULT_PROGRESS: LocalProgress = {
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
    return { ...DEFAULT_PROGRESS, ...JSON.parse(raw) } as LocalProgress;
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
  return localStorage.getItem(`${PREFIX}:cloudSyncMode`) === "cloud" ? "cloud" : "local";
}

export function saveCloudSyncMode(mode: CloudSyncMode): void {
  localStorage.setItem(`${PREFIX}:cloudSyncMode`, mode);
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
  const readiness = progress.deviceReadiness;
  if (!readiness) return progress;
  return readiness.browserDeviceId === currentBrowserDeviceId
    ? progress
    : { ...progress, deviceReadiness: null };
}


