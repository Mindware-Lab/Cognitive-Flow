import { PHASE_CELL } from "./protocol";
import type { CellEvidence, CellKey, Construct, PhaseLabel, ProtocolGroup } from "./types";

export const ABSOLUTE_PROGRESS_CELLS: Record<ProtocolGroup, CellKey[]> = {
  commercial_arrows_first: ["arrow_abs", "flow_abs"],
  validation_arrows_first: ["arrow_abs", "flow_abs"],
  validation_flow_first: ["flow_abs", "arrow_abs"],
};

export const RELATIONAL_PROGRESS_CELLS: Record<ProtocolGroup, CellKey[]> = {
  commercial_arrows_first: ["arrow_rel", "flow_rel"],
  validation_arrows_first: ["arrow_rel", "flow_rel"],
  validation_flow_first: ["flow_rel", "arrow_rel"],
};

const BINDING_FALLBACK_CELLS: CellKey[] = ["arrow_abs", "flow_abs", "arrow_rel", "flow_rel"];

export function nLevelScore(nLevel: number | null): number | null {
  if (nLevel === null) return null;
  return Math.round(nLevel);
}

export function evidenceNLevel(evidence: CellEvidence | null): number | null {
  return evidence?.stableNLevel ?? evidence?.currentNLevel ?? evidence?.currentCapacityBps ?? null;
}

export function evidenceForCells(
  evidence: CellEvidence[],
  construct: Construct,
  cells: CellKey[],
): CellEvidence | null {
  for (const cell of cells) {
    const match = evidence.find((entry) => entry.construct === construct && entry.cellKey === cell);
    if (match) return match;
  }
  return null;
}

export function scoreForEvidenceCells(
  evidence: CellEvidence[],
  construct: Construct,
  cells: CellKey[],
): number | null {
  return nLevelScore(evidenceNLevel(evidenceForCells(evidence, construct, cells)));
}

export function progressMetricScores(input: {
  evidence: CellEvidence[];
  protocolGroup: ProtocolGroup;
  activePhase: PhaseLabel;
}): {
  cognitiveBandwidth: number | null;
  frameBandwidth: number | null;
  patternBinding: number | null;
} {
  const activeCell = PHASE_CELL[input.activePhase];
  const absoluteCells = ABSOLUTE_PROGRESS_CELLS[input.protocolGroup];
  const relationalCells = RELATIONAL_PROGRESS_CELLS[input.protocolGroup];
  return {
    cognitiveBandwidth: scoreForEvidenceCells(input.evidence, "ACC", absoluteCells),
    frameBandwidth: scoreForEvidenceCells(input.evidence, "ACC", relationalCells),
    patternBinding: scoreForEvidenceCells(input.evidence, "BSE", [
      activeCell,
      ...absoluteCells,
      ...relationalCells,
      ...BINDING_FALLBACK_CELLS,
    ]),
  };
}
