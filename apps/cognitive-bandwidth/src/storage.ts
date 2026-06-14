import type { StoredPrototypeRun } from "./types";

const RUNS_KEY = "iqcoach.cognitiveBandwidth.prototypeRuns";

export function loadRuns(): StoredPrototypeRun[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(RUNS_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveRun(run: StoredPrototypeRun): void {
  try {
    const runs = loadRuns();
    localStorage.setItem(RUNS_KEY, JSON.stringify([run, ...runs].slice(0, 10)));
  } catch {
    // The prototype remains usable when browser storage is unavailable.
  }
}
