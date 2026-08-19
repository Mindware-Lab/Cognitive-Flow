import { describe, expect, it } from "vitest";
import programmeGuide from "../public/ccc-programme-guide.js?raw";
import appHtml from "../index.html?raw";

describe("CCC programme orientation guide", () => {
  it("loads the guide without changing the timed task renderer", () => {
    expect(appHtml).toContain("ccc-programme-guide.js?v=20260819-1");
    expect(programmeGuide).toContain('const STORAGE_KEY = "iqm.ccc.programmeGuide.v1.seen"');
    expect(programmeGuide).toContain("How this programme works");
    expect(programmeGuide).toContain("The tasks change, but the goal stays clear");
    expect(programmeGuide).toContain("One guided session at a time");
  });

  it("auto-opens only at programme start and remains reopenable from the header", () => {
    expect(programmeGuide).toContain('document.querySelector(".ccc-welcome")');
    expect(programmeGuide).toContain("PROGRAMME\\s*0%");
    expect(programmeGuide).toContain('button.textContent = "Guide"');
    expect(programmeGuide).toContain('button.setAttribute("aria-label", "Open programme guide")');
  });

  it("keeps the guide usable on short screens and with keyboard escape", () => {
    expect(programmeGuide).toContain("max-height: calc(100dvh - 32px)");
    expect(programmeGuide).toContain("overflow: auto");
    expect(programmeGuide).toContain('event.key === "Escape"');
    expect(programmeGuide).toContain('role="dialog" aria-modal="true"');
  });
});
