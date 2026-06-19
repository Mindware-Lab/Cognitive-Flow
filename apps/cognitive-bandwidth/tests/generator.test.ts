import { describe, expect, it } from "vitest";
import { DEMO_CONDITIONS, generateTrial } from "../src/generator";

describe("trial generator", () => {
  it("is deterministic for a seed and index", () => {
    const first = generateTrial("seed", "abs_lr", 4, { ratio: "3:2", exposureMs: 500 });
    const second = generateTrial("seed", "abs_lr", 4, { ratio: "3:2", exposureMs: 500 });
    expect(second).toEqual(first);
  });

  it("uses five unique positions and the requested majority count", () => {
    const trial = generateTrial("seed", "abs_lr", 5, { ratio: "4:1", exposureMs: 1000 });
    expect(new Set(trial.items.map((item) => item.positionIndex)).size).toBe(5);
    expect(
      trial.items.filter((item) => item.category === trial.majorityCategory),
    ).toHaveLength(4);
  });

  it("creates radial opposites for the frame wrapper", () => {
    const trial = generateTrial("frame-seed", "rel_inout", 2, {
      ratio: "5:0",
      exposureMs: 1000,
    });
    for (const item of trial.items) {
      const radialX = item.position.x - 50;
      const radialY = item.position.y - 50;
      const dot = radialX * item.vector.x + radialY * item.vector.y;
      expect(item.category === "out" ? dot : -dot).toBeGreaterThan(0);
    }
  });

  it("includes every fixed-five estimation ratio across the adaptive MVP exposure grid", () => {
    expect(DEMO_CONDITIONS).toEqual(
      ["4:1", "3:2"].flatMap((ratio) =>
        [120, 160, 200, 250, 320, 400, 500, 650, 800, 1000].map(
          (exposureMs) => ({ ratio, exposureMs }),
        ),
      ),
    );
  });
});
