import type { WorkflowChoice } from "./cccCopy";
import type {
  CccAttentionTrialDefinition,
  CccNBackLevel,
  CccRecordedTrial,
  CccRuntimeEvent,
  CccProgrammeState,
  CccSessionPlan,
} from "./cccTypes";

export const CCC_LOCAL_STORAGE_KEY = "iqmindware:cognitive-control-coach:journey:v0.4";
export const CCC_LEGACY_LOCAL_STORAGE_KEY = "iqmindware:cognitive-control-coach:p0:v0.3";
export const CCC_PROGRAMME_STORAGE_KEY = "iqmindware:cognitive-control-coach:programme:v0.4";
export const CCC_COMPARISON_MODE_KEY = "iqmindware:cognitive-control-coach:comparison-mode:v1";

export type CccSavedComparisonMode = "personal" | "population";

export function loadCccComparisonMode(storage: Pick<Storage, "getItem"> = window.localStorage): CccSavedComparisonMode {
  return storage.getItem(CCC_COMPARISON_MODE_KEY) === "population" ? "population" : "personal";
}

export function saveCccComparisonMode(mode: CccSavedComparisonMode, storage: Pick<Storage, "setItem"> = window.localStorage): void {
  storage.setItem(CCC_COMPARISON_MODE_KEY, mode);
}

export interface CccSavedJourney {
  storageVersion: 3;
  programme: CccProgrammeState;
  plan: CccSessionPlan;
  workflowChoice: WorkflowChoice;
  activeBlockIndex: number;
  blockQueues: Record<string, CccAttentionTrialDefinition[]>;
  blockResults: Record<string, CccRecordedTrial[]>;
  practiceQueue: CccAttentionTrialDefinition[];
  practiceResults: CccRecordedTrial[];
  practiceComplete: boolean;
  wmPracticeLevel: CccNBackLevel | null;
  shiftViewCompleted: boolean;
  events: CccRuntimeEvent[];
  startedAt: string;
  updatedAt: string;
  completedAt: string | null;
}

export function loadCccJourney(storage: Pick<Storage, "getItem"> = window.localStorage): CccSavedJourney | null {
  try {
    const raw = storage.getItem(CCC_LOCAL_STORAGE_KEY) || storage.getItem(CCC_LEGACY_LOCAL_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<CccSavedJourney>;
    if (![2, 3].includes(Number(parsed.storageVersion)) || !parsed.plan?.sessionId || !parsed.workflowChoice) return null;
    if (!Array.isArray(parsed.plan.blocks) || !Array.isArray(parsed.plan.trials)) return null;
    return { ...parsed, storageVersion: 3, wmPracticeLevel: parsed.wmPracticeLevel ?? null } as CccSavedJourney;
  } catch {
    return null;
  }
}

export function saveCccJourney(journey: CccSavedJourney, storage: Pick<Storage, "setItem"> = window.localStorage): void {
  journey.updatedAt = new Date().toISOString();
  storage.setItem(CCC_LOCAL_STORAGE_KEY, JSON.stringify(journey));
  storage.setItem(CCC_PROGRAMME_STORAGE_KEY, JSON.stringify(journey.programme));
}

export function clearCccJourney(storage: Pick<Storage, "removeItem"> = window.localStorage): void {
  storage.removeItem(CCC_LOCAL_STORAGE_KEY);
  storage.removeItem(CCC_LEGACY_LOCAL_STORAGE_KEY);
}

export function loadCccProgramme(storage: Pick<Storage, "getItem"> = window.localStorage): CccProgrammeState | null {
  try {
    const raw = storage.getItem(CCC_PROGRAMME_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<CccProgrammeState>;
    return parsed.programmeVersion === 1 && parsed.programmeRunId ? parsed as CccProgrammeState : null;
  } catch {
    return null;
  }
}

export function saveCccProgramme(programme: CccProgrammeState, storage: Pick<Storage, "setItem"> = window.localStorage): void {
  programme.updatedAt = new Date().toISOString();
  storage.setItem(CCC_PROGRAMME_STORAGE_KEY, JSON.stringify(programme));
}

export function clearCccProgramme(storage: Pick<Storage, "removeItem"> = window.localStorage): void {
  storage.removeItem(CCC_PROGRAMME_STORAGE_KEY);
}

export function completedValidTrials(journey: CccSavedJourney): number {
  return Object.values(journey.blockResults)
    .flat()
    .filter((result) => result.scoring.countsTowardQuota).length;
}

export function plannedValidTrials(journey: CccSavedJourney): number {
  return journey.plan.blocks.reduce((total, block) => total + block.validTrialCount, 0);
}

export function journeyCompletionRatio(journey: CccSavedJourney): number {
  const planned = plannedValidTrials(journey);
  return planned > 0 ? Math.min(1, completedValidTrials(journey) / planned) : 0;
}
