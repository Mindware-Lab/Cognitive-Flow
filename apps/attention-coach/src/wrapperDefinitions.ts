import type { CellKey, TransferControllerState, WrapperId } from "./types";

export type Carrier = "arrow" | "flow";
export type ReferenceComputation = "fixed_axis" | "common_centre";
export type ResponseAxis = "left_right" | "in_out";

export interface WrapperDefinition {
  id: WrapperId;
  carrier: Carrier;
  referenceComputation: ReferenceComputation;
  responseAxis: ResponseAxis;
  heldOutByDefault: boolean;
}

export const ATOMIC_WRAPPERS: WrapperId[] = ["arrow_abs", "flow_abs", "arrow_rel", "flow_rel"];

export const WRAPPER_DEFINITIONS: Record<WrapperId, WrapperDefinition> = {
  arrow_abs: {
    id: "arrow_abs",
    carrier: "arrow",
    referenceComputation: "fixed_axis",
    responseAxis: "left_right",
    heldOutByDefault: false,
  },
  flow_abs: {
    id: "flow_abs",
    carrier: "flow",
    referenceComputation: "fixed_axis",
    responseAxis: "left_right",
    heldOutByDefault: false,
  },
  arrow_rel: {
    id: "arrow_rel",
    carrier: "arrow",
    referenceComputation: "common_centre",
    responseAxis: "in_out",
    heldOutByDefault: false,
  },
  flow_rel: {
    id: "flow_rel",
    carrier: "flow",
    referenceComputation: "common_centre",
    responseAxis: "in_out",
    heldOutByDefault: true,
  },
};

export function atomicWrapperForCell(cellKey: CellKey): WrapperId | null {
  return ATOMIC_WRAPPERS.includes(cellKey as WrapperId) ? (cellKey as WrapperId) : null;
}

export function responseAxisForCell(cellKey: CellKey): ResponseAxis {
  const wrapper = atomicWrapperForCell(cellKey);
  return wrapper ? WRAPPER_DEFINITIONS[wrapper].responseAxis : "left_right";
}

export function ruleCueForCell(cellKey: CellKey): string {
  return responseAxisForCell(cellKey) === "in_out" ? "IN / OUT" : "LEFT / RIGHT";
}

export function eligibleFreePlayWrappers(state: TransferControllerState | null | undefined): WrapperId[] {
  if (!state) return ["arrow_abs"];
  if (state.heldOutStatus !== "clean") return [...ATOMIC_WRAPPERS];
  return ATOMIC_WRAPPERS.filter((wrapper) => {
    if (wrapper === state.heldOutWrapper) return false;
    const wrapperState = state.wrapperStates?.[wrapper];
    return (
      wrapper === state.startWrapper ||
      wrapper === state.activeBaseWrapper ||
      wrapper === state.activeTargetWrapper ||
      Boolean(wrapperState && (wrapperState.status !== "locked" || wrapperState.validTrials > 0))
    );
  });
}
