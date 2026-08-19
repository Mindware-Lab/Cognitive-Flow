import { describe, expect, it } from "vitest";
import appHtml from "../index.html?raw";
import sessionExitFix from "../public/ccc-session-exit-fix.js?raw";

describe("CCC session exit and planned-wait guidance", () => {
  it("loads the session-exit patch after the programme guide", () => {
    expect(appHtml).toContain("ccc-programme-guide.js?v=20260819-1");
    expect(appHtml).toContain("ccc-session-exit-fix.js?v=20260819-1");
    expect(appHtml.indexOf("ccc-session-exit-fix.js")).toBeGreaterThan(appHtml.indexOf("ccc-programme-guide.js"));
  });

  it("routes a capped or final completed block through the existing finalisation path", () => {
    expect(sessionExitFix).toContain(".ccc-review-view:not(.ccc-practice-review)");
    expect(sessionExitFix).toContain("button[data-action='back-welcome']");
    expect(sessionExitFix).toContain('button.dataset.action = "continue-after-block"');
    expect(sessionExitFix).toContain('button.textContent = "Finish and save"');
    expect(sessionExitFix).toContain("sessionProgressIsComplete");
    expect(sessionExitFix).toContain(".ccc-insights-view, .ccc-block-reconnect-view");
    expect(sessionExitFix).toContain("sessionEndPending");
    expect(sessionExitFix).toContain("data-ccc-session-status-fixed");
  });

  it("distinguishes an ordinary session cap from the deliberate delayed re-check", () => {
    expect(sessionExitFix).toContain("This is a session cap, not a lockout.");
    expect(sessionExitFix).toContain("This is a planned return check, not an account lock.");
    expect(sessionExitFix).toContain("Re-check opens");
    expect(sessionExitFix).toContain("Only a scheduled return check asks you to wait");
  });
});
