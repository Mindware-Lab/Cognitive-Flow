import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const indexSource = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const instructionSource = readFileSync(new URL("../public/ccc-wm-match-only.js", import.meta.url), "utf8");

describe("CCC relational WM instructions", () => {
  it("loads the Match-only instruction layer", () => {
    expect(indexSource).toContain("ccc-wm-match-only.js");
  });

  it("tells users to press only for matches and wait on non-matches", () => {
    expect(instructionSource).toContain("Tap Match only when the main direction is the same.");
    expect(instructionSource).toContain("If it is different, wait for the next pattern.");
    expect(instructionSource).toContain("Different from 1 step back: do not tap");
    expect(instructionSource).toContain('setText(matchButton.querySelector("kbd"), "Space")');
  });
});
