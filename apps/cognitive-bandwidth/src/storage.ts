import type { DemoSession } from "./transferReadiness";
import type { StoredPrototypeRun } from "./types";

const RUNS_KEY = "iqcoach.cognitiveBandwidth.prototypeRuns";
const SESSIONS_KEY = "iqcoach.transferStack.demoSessions";

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

export function saveDemoSession(session: DemoSession): void {
  try {
    const parsed = JSON.parse(localStorage.getItem(SESSIONS_KEY) || "[]");
    const sessions = Array.isArray(parsed) ? parsed : [];
    localStorage.setItem(
      SESSIONS_KEY,
      JSON.stringify([session, ...sessions].slice(0, 10)),
    );
  } catch {
    // The demo remains usable when browser storage is unavailable.
  }
}
