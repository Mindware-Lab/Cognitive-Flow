import { describe, expect, it } from "vitest";
import appHtml from "../index.html?raw";
import viewportSafety from "../public/ccc-viewport-safety.css?raw";

describe("CCC result-screen viewport safety", () => {
  it("loads the dedicated viewport safety stylesheet", () => {
    expect(appHtml).toContain("ccc-viewport-safety.css?v=20260819-1");
  });

  it("allows result and progress screens to scroll vertically when needed", () => {
    expect(viewportSafety).toContain(".ccc-review-view .ccc-main");
    expect(viewportSafety).toContain(".ccc-insights-view .ccc-main");
    expect(viewportSafety).toContain(".ccc-complete-view .ccc-main");
    expect(viewportSafety).toContain(".ccc-progress-view .ccc-main");
    expect(viewportSafety).toContain("overflow-y: auto !important");
    expect(viewportSafety).toContain("scrollbar-gutter: stable");
  });

  it("removes the max-height trap from review cards without making the task screen scroll", () => {
    expect(viewportSafety).toContain("max-height: none !important");
    expect(viewportSafety).toContain("overflow: visible !important");
    expect(viewportSafety).not.toContain(".ccc-task-view .ccc-main");
  });

  it("compresses dense report grids on short or narrow displays", () => {
    expect(viewportSafety).toContain("@media (max-height: 760px)");
    expect(viewportSafety).toContain("@media (max-width: 720px), (max-height: 660px)");
    expect(viewportSafety).toContain("grid-template-columns: repeat(2, minmax(0, 1fr)) !important");
  });
});
