import type { WorkflowChoice } from "./cccCopy";
import type {
  CccAttentionTrialDefinition,
  CccRecordedTrial,
  CccRuntimeEvent,
  CccSessionPlan,
} from "./cccTypes";

export const CCC_LOCAL_STORAGE_KEY = "iqmindware:cognitive-control-coach:p0:v0.1";

export interface CccSavedJourney {
  storageVersion: 1;
  plan: CccSessionPlan;
  workflowChoice: WorkflowChoice;
  activeBlockIndex: number;
  blockQueues: Record<string, CccAttentionTrialDefinition[]>;
  blockResults: Record<string, CccRecordedTrial[]>;
  practiceQueue: CccAttentionTrialDefinition[];
  practiceResults: CccRecordedTrial[];
  practiceComplete: boolean;
  shiftViewCompleted: boolean;
  events: CccRuntimeEvent[];
  startedAt: string;
  updatedAt: string;
  completedAt: string | null;
}

export function loadCccJourney(storage: Pick<Storage, "getItem"> = window.localStorage): CccSavedJourney | null {
  try {
    const raw = storage.getItem(CCC_LOCAL_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<CccSavedJourney>;
    if (parsed.storageVersion !== 1 || !parsed.plan?.sessionId || !parsed.workflowChoice) return null;
    if (!Array.isArray(parsed.plan.blocks) || !Array.isArray(parsed.plan.trials)) return null;
    return parsed as CccSavedJourney;
  } catch {
    return null;
  }
}

export function saveCccJourney(journey: CccSavedJourney, storage: Pick<Storage, "setItem"> = window.localStorage): void {
  journey.updatedAt = new Date().toISOString();
  storage.setItem(CCC_LOCAL_STORAGE_KEY, JSON.stringify(journey));
}

export function clearCccJourney(storage: Pick<Storage, "removeItem"> = window.localStorage): void {
  storage.removeItem(CCC_LOCAL_STORAGE_KEY);
}

export function completedValidTrials(journey: CccSavedJourney): number {
  return Object.values(journey.blockResults)
    .flat()
    .filter((result) => result.scoring.isValidDecision).length;
}

export function plannedValidTrials(journey: CccSavedJourney): number {
  return journey.plan.blocks.reduce((total, block) => total + block.validTrialCount, 0);
}

export function journeyCompletionRatio(journey: CccSavedJourney): number {
  const planned = plannedValidTrials(journey);
  return planned > 0 ? Math.min(1, completedValidTrials(journey) / planned) : 0;
}
