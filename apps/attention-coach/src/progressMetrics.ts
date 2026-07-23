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

export function trainingScoreFromCapacityBps(bitsPerSec: number | null): number | null {
  if (bitsPerSec === null) return null;
  return Math.round(85 + bitsPerSec * 5);
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
  return trainingScoreFromCapacityBps(evidenceForCells(evidence, construct, cells)?.currentCapacityBps ?? null);
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
