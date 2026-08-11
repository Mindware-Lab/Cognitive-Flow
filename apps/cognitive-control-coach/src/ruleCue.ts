import { atomicWrapperForCell, responseAxisForCell, ruleCueForCell as wrapperRuleCueForCell } from "./wrapperDefinitions";
import type { CellKey, TrialDefinition } from "./types";

export type PresentationStage = "rule_cue" | "fixation" | "stimulus" | "mask" | "response";

export function shouldShowRuleCue(blockCells: CellKey[]): boolean {
  const axes = new Set(blockCells.map(responseAxisForCell));
  return axes.size > 1;
}

export function ruleCueForTrial(trial: TrialDefinition): "LEFT / RIGHT" | "IN / OUT" {
  return wrapperRuleCueForCell(trial.cellKey) as "LEFT / RIGHT" | "IN / OUT";
}

export function shouldShowRuleCueForTrial(blockCells: CellKey[], trial: TrialDefinition): boolean {
  return shouldShowRuleCue(blockCells) && atomicWrapperForCell(trial.cellKey) !== null;
}

export function presentationStagesForTrial(blockCells: CellKey[], trial: TrialDefinition): PresentationStage[] {
  return [
    ...(shouldShowRuleCueForTrial(blockCells, trial) ? (["rule_cue"] as const) : []),
    "fixation",
    "stimulus",
    "mask",
    "response",
  ];
}
