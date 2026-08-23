import type { CccProgrammeState } from "./cccTypes";
import {
  createInitialBridgeState,
  evaluateBridgeAdvance,
  migrateBridgeState,
  type CccBridgeAdvanceResult,
  type CccBridgeProgressionState,
} from "./cccBridgeProgression";

declare module "./cccTypes" {
  interface CccProgrammeState {
    /**
     * Real-life Bridge evidence is deliberately independent of cognitive task
     * scores and programme gates. Older saved programmes omit this field and
     * are migrated lazily when the Bridge layer is first used.
     */
    bridgeProgression?: CccBridgeProgressionState;
  }
}

export function bridgeStateForProgramme(programme: CccProgrammeState): CccBridgeProgressionState {
  programme.bridgeProgression = programme.bridgeProgression
    ? migrateBridgeState(programme.bridgeProgression)
    : createInitialBridgeState();
  return programme.bridgeProgression;
}

export function evaluateAndStoreBridgeAdvance(
  programme: CccProgrammeState,
  now = new Date(),
): CccBridgeAdvanceResult {
  const result = evaluateBridgeAdvance(bridgeStateForProgramme(programme), programme, now);
  programme.bridgeProgression = result.state;
  return result;
}
