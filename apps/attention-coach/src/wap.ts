import { chooseNextTransferState } from "./transferController";
import type { WapDecision, WapUserState } from "./types";

export function chooseNextPhase(state: WapUserState): WapDecision {
  return chooseNextTransferState(state);
}
