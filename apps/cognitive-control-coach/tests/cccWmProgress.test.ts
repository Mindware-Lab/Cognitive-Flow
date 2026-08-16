import { describe, expect, it } from "vitest";
import { createInitialProgrammeState, migrateCccProgrammeState } from "../src/cccProgramme";
import { createProgrammeSessionPlan } from "../src/cccProgrammeGenerator";
import { loadCccProgramme, saveCccProgramme } from "../src/cccStorage";
import { cccWmCurveIsStable, evaluateCccWmPair } from "../src/cccWmProgress";
import { scoreCccAttentionTrial } from "../src/cccValue";
import type { CccAttentionTrialDefinition, CccRecordedTrial, CccWmLearningCurveHistoryPoint } from "../src/cccTypes";

const plan = createProgrammeSessionPlan({
  sessionId: "wm-level-test",
  seed: "wm-level-test",
  programmeRunId: "wm-level-test",
  programmeSessionNumber: 1,
  kind: "p1b_wm_bridge",
  regimePair: ["clear_sprint", "deep_check"],
  wmLevel: 2,
  wmPairLevels: [2, 2],
});

const pairTrials = plan.trials.filter((trial) => {
  const block = plan.blocks.find((candidate) => candidate.id === trial.blockId);
  return block?.wmPairIndex === 1 && !trial.wmBuffer;
});

function recorded(
  trial: CccAttentionTrialDefinition,
  response: CccRecordedTrial["response"],
  presentationMs = 1200,
): CccRecordedTrial {
  const responseTimeMs = response === null ? null : 700;
  const prepared = { ...trial, exposureMsRequested: presentationMs };
  return {
    trial: prepared,
    response,
    scoring: scoreCccAttentionTrial({ trial: prepared, response, responseTimeMs }),
    recordedAt: "2026-08-13T12:00:00.000Z",
    viewportClass: "desktop",
    inputMode: response === null ? "deadline" : "keyboard",
    focusLost: false,
    exposureMsActual: presentationMs,
    actualStimulusFrames: null,
    deviceRefreshRateEstimate: null,
    timingQuality: "not_applicable",
  };
}

function answersWithWrongDifferent(count: number): CccRecordedTrial[] {
  let wrongDifferent = 0;
  return pairTrials.map((trial) => {
    const shouldBeWrong = trial.wmIsMatch === false && wrongDifferent < count;
    if (shouldBeWrong) wrongDifferent += 1;
    return recorded(trial, shouldBeWrong ? "match" : trial.correctResponse);
  });
}

describe("CCC n-back pair progression", () => {
  it("changes wrapper from a flat capacity curve rather than an absolute accuracy score", () => {
    const history: CccWmLearningCurveHistoryPoint[] = Array.from({ length: 4 }, (_value, index) => ({
      sessionId: `flat-${index}`,
      wrapperStage: "flow_recovery",
      pairIndex: index % 2 ? 2 : 1,
      nLevel: 2,
      observationCount: 40,
      balancedAccuracy: 0.55,
      omissionRate: 0.25,
      missRate: 0.4,
      falseAlarmRate: 0.4,
      lureFalseAlarmRate: 0.4,
      meanPresentationMs: 1200,
      presentationRateHz: 1000 / 1200,
      informationThroughputBps: 0.55,
      capacityIndex: 0.55,
    }));
    expect(cccWmCurveIsStable(history)).toBe(true);
    expect(cccWmCurveIsStable(history.map((point, index) => ({ ...point, capacityIndex: 0.4 + index * 0.2 })))).toBe(false);
  });

  it("steps up only after strong balanced performance across both conditions", () => {
    const decision = evaluateCccWmPair(pairTrials.map((trial) => recorded(trial, trial.correctResponse)), 2);
    expect(decision).toMatchObject({ direction: "increase", currentLevel: 2, nextLevel: 3, observationCount: 40 });
    expect(decision.balancedAccuracy).toBe(1);
  });

  it("defines working-memory performance as accuracy-adjusted relational throughput", () => {
    const responses = pairTrials.map((trial) => recorded(trial, trial.correctResponse, 1200));
    const comfortable = evaluateCccWmPair(responses, 2);
    const faster = evaluateCccWmPair(
      pairTrials.map((trial) => recorded(trial, trial.correctResponse, 600)),
      2,
    );
    expect(comfortable.presentationRateHz).toBeCloseTo(1000 / 1200);
    expect(faster.capacityIndex).toBeCloseTo(comfortable.capacityIndex * 2);
  });

  it("holds the level when false alarms are too high despite adequate overall accuracy", () => {
    const decision = evaluateCccWmPair(answersWithWrongDifferent(7), 2);
    expect(decision.balancedAccuracy).toBeCloseTo(0.875);
    expect(decision.falseAlarmRate).toBe(0.25);
    expect(decision).toMatchObject({ direction: "maintain", nextLevel: 2 });
  });

  it("steps down below the maintenance floor and never leaves the 1-to-5 range", () => {
    const poor = pairTrials.map((trial) => recorded(trial, trial.answerOptions.find((answer) => answer !== trial.correctResponse)!));
    expect(evaluateCccWmPair(poor, 2)).toMatchObject({ direction: "decrease", nextLevel: 1 });
    expect(evaluateCccWmPair(poor, 1)).toMatchObject({ direction: "decrease", nextLevel: 1 });
    const perfect = pairTrials.map((trial) => recorded(trial, trial.correctResponse));
    expect(evaluateCccWmPair(perfect, 5)).toMatchObject({ direction: "increase", nextLevel: 5 });
  });

  it("preserves and safely migrates the saved level used by the next session", () => {
    const programme = createInitialProgrammeState();
    programme.wmLevel = 4;
    programme.wmPracticeCompletedLevels = [1, 2];
    let stored = "";
    saveCccProgramme(programme, { setItem: (_key, value) => { stored = value; } });
    const restored = migrateCccProgrammeState(loadCccProgramme({ getItem: () => stored })!);
    expect(restored.wmLevel).toBe(4);
    expect(restored.wmPracticeCompletedLevels).toEqual([1, 2]);
    const legacy = JSON.parse(JSON.stringify(programme));
    legacy.wmLevel = 9;
    expect(migrateCccProgrammeState(legacy).wmLevel).toBe(5);
    delete legacy.wmPracticeCompletedLevels;
    expect(migrateCccProgrammeState(legacy).wmPracticeCompletedLevels).toEqual([]);
  });
});
