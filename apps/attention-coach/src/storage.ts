import type { AttentionScoreSnapshot, CellEvidence, DeviceReadiness, PhaseLabel, PhaseStatus, TransitionKey } from "./types";

const PREFIX = "attention-coach";

export interface LocalProgress {
  sessionNumber: number;
  currentPhase: PhaseLabel;
  phaseStatus: PhaseStatus;
  completedTransitions: TransitionKey[];
  latestSnapshot: AttentionScoreSnapshot | null;
  deviceReadiness: DeviceReadiness | null;
  evidence: CellEvidence[];
}

export const DEFAULT_PROGRESS: LocalProgress = {
  sessionNumber: 1,
  currentPhase: "P1_ARROW_ABS",
  phaseStatus: "active",
  completedTransitions: [],
  latestSnapshot: null,
  deviceReadiness: null,
  evidence: [],
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
