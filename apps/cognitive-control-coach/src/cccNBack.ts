import type { CccStimulusRelation } from "./cccTypes";

export const CCC_NBACK_RELATIONS = ["in", "out", "cw", "ccw"] as const satisfies readonly CccStimulusRelation[];

export type CccNBackOutcome = "hit" | "miss" | "false_alarm" | "correct_rejection" | "buffer";

export function scheduleNBackMatches(
  scoredCount: number,
  level: number,
  matchFrequency: number,
  random: () => number,
): Set<number> {
  const targetCount = Math.max(1, Math.round(scoredCount * matchFrequency));
  const candidates = Array.from({ length: scoredCount }, (_value, index) => index + level);
  const chosen = new Set<number>();
  while (chosen.size < targetCount && candidates.length) {
    const nonAdjacent = candidates.filter((slot) => !chosen.has(slot - 1) && !chosen.has(slot + 1));
    const pool = nonAdjacent.length ? nonAdjacent : candidates;
    const slot = pool[Math.floor(random() * pool.length)];
    chosen.add(slot);
    candidates.splice(candidates.indexOf(slot), 1);
  }
  return chosen;
}

export function differentNBackRelation(
  excluded: readonly CccStimulusRelation[],
  random: () => number,
): CccStimulusRelation {
  const choices = CCC_NBACK_RELATIONS.filter((relation) => !excluded.includes(relation));
  return choices[Math.floor(random() * choices.length)] || "in";
}

export function classifyNBackOutcome(
  isBuffer: boolean,
  isMatch: boolean | null,
  matchPressed: boolean,
): CccNBackOutcome {
  if (isBuffer) return "buffer";
  if (isMatch) return matchPressed ? "hit" : "miss";
  return matchPressed ? "false_alarm" : "correct_rejection";
}

export function feedbackIconForNBackOutcome(
  outcome: CccNBackOutcome,
  enabled: boolean,
): "check" | "cross" | null {
  if (!enabled || outcome === "buffer" || outcome === "correct_rejection") return null;
  return outcome === "hit" ? "check" : "cross";
}
