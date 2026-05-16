/*
 * Standalone reference extraction of the IQPro Zone Check / masked
 * majority-direction task core.
 *
 * This file is intentionally not imported by the IQPro app. It is a compact,
 * UI-free starting point for building a similar app from scratch.
 *
 * What is included:
 * - task configuration
 * - seeded pattern generation
 * - stream/condition selection
 * - adaptive staircase update
 * - response scoring
 * - probe feature summaries
 * - simple zone-route classification
 *
 * What is excluded:
 * - canvas drawing
 * - requestAnimationFrame timing
 * - keyboard/listener code
 * - localStorage/cloud sync
 * - IQPro shell integration
 */

export const DEFAULT_ZONE_TASK_CONFIG = Object.freeze({
  totalSeconds: 180,
  nArrows: 5,
  easyMajority: 4,
  hardMajority: 3,
  catchMajority: 5,
  fixationMs: 350,
  isiMs: 150,
  responseTimeoutMs: 1500,
  maskMs: 100,
  startStimMs: 80,
  minStimMs: 25,
  maxStimMs: 220,
  stepFrames: 1,
  bootstrapWarmupSeconds: 40,
  streamMix: Object.freeze({ stair: 0.75, probe: 0.2, catch: 0.05 }),
  catchProbeFracMax: 0.16,
  rtMinMs: 150,
  rtMaxMs: 1500,
  fastMs: 250,
  slowFloorMs: 1000,
  maxDroppedFrameFrac: 0.06,
  bpsScaleK: 0.28,
  baselineWindow: 14
});

export function createSeededRng(seed = Date.now()) {
  let state = seed >>> 0;
  return function rng() {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function mean(values) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
}

export function sd(values) {
  if (values.length < 2) return 0;
  const avg = mean(values);
  const variance = values.reduce((sum, value) => sum + ((value - avg) ** 2), 0) / (values.length - 1);
  return Math.sqrt(Math.max(0, variance));
}

export function median(values) {
  if (!values.length) return null;
  const sorted = values.slice().sort((left, right) => left - right);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

export function percentile(values, percentileValue) {
  if (!values.length) return null;
  const sorted = values.slice().sort((left, right) => left - right);
  const index = clamp((sorted.length - 1) * percentileValue, 0, sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index - lower;
  return sorted[lower] * (1 - weight) + sorted[upper] * weight;
}

export function ewma(values, alpha = 0.25) {
  if (!values.length) return null;
  return values.reduce((acc, value, index) => (index === 0 ? value : (alpha * value) + ((1 - alpha) * acc)), values[0]);
}

function shuffle(values, rng) {
  const next = values.slice();
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(rng() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }
  return next;
}

export function makeMajorityPattern({
  majorityCount,
  nArrows = DEFAULT_ZONE_TASK_CONFIG.nArrows,
  rng = Math.random
} = {}) {
  const majority = rng() < 0.5 ? "L" : "R";
  const minority = majority === "L" ? "R" : "L";
  const pattern = [
    ...Array.from({ length: majorityCount }, () => majority),
    ...Array.from({ length: nArrows - majorityCount }, () => minority)
  ];
  return {
    pattern: shuffle(pattern, rng),
    correct: majority
  };
}

export function framesFromMs(ms, frameMs) {
  return Math.max(1, Math.round(ms / frameMs));
}

export function createTaskState({
  frameMs = 16.6667,
  historyRows = [],
  config = DEFAULT_ZONE_TASK_CONFIG
} = {}) {
  const minFrames = Math.max(2, framesFromMs(config.minStimMs, frameMs));
  const maxFrames = Math.max(minFrames + 2, framesFromMs(config.maxStimMs, frameMs));
  const startFrames = clamp(framesFromMs(config.startStimMs, frameMs), minFrames + 1, maxFrames - 1);
  const previousFrames = lastProbeFrames(historyRows);

  return {
    frameMs,
    minFrames,
    maxFrames,
    startedAtMs: 0,
    falseStarts: 0,
    timing: { droppedFrac: 0 },
    stairs: {
      easy: { frames: startFrames, streak: 0, hist: [] },
      hard: { frames: startFrames, streak: 0, hist: [] }
    },
    probeDurFrames: previousFrames
      ? {
        easy: previousFrames.easy,
        hard: previousFrames.hard,
        catch: Math.round((previousFrames.easy + previousFrames.hard) / 2),
        frozen: true
      }
      : {
        easy: startFrames,
        hard: startFrames,
        catch: startFrames,
        frozen: false
      },
    planner: {
      nextStair: "easy",
      nextProbe: "easy",
      counts: { stair: 0, probe: 0, catch: 0 }
    },
    trials: []
  };
}

export function freezeProbeDurations(taskState) {
  if (taskState.probeDurFrames.frozen) return taskState.probeDurFrames;
  const easy = taskState.stairs.easy.hist.slice(-20);
  const hard = taskState.stairs.hard.hist.slice(-20);
  const easyFrames = easy.length ? Math.round(mean(easy)) : taskState.stairs.easy.frames;
  const hardFrames = hard.length ? Math.round(mean(hard)) : taskState.stairs.hard.frames;

  taskState.probeDurFrames.easy = Math.max(2, easyFrames);
  taskState.probeDurFrames.hard = Math.max(2, hardFrames);
  taskState.probeDurFrames.catch = Math.max(2, Math.round((easyFrames + hardFrames) / 2));
  taskState.probeDurFrames.frozen = true;
  return taskState.probeDurFrames;
}

export function chooseTrial({
  elapsedMs,
  taskState,
  config = DEFAULT_ZONE_TASK_CONFIG,
  rng = Math.random
}) {
  const planner = taskState.planner;

  if (!taskState.probeDurFrames.frozen && elapsedMs < config.bootstrapWarmupSeconds * 1000) {
    const condition = planner.nextStair;
    planner.nextStair = condition === "easy" ? "hard" : "easy";
    return { stream: "stair", condition };
  }

  if (!taskState.probeDurFrames.frozen) {
    freezeProbeDurations(taskState);
  }

  const mix = config.streamMix;
  const totalMix = mix.stair + mix.probe + mix.catch;
  let streamRoll = rng() * totalMix;
  let stream = "stair";
  for (const key of ["stair", "probe", "catch"]) {
    streamRoll -= mix[key];
    if (streamRoll <= 0) {
      stream = key;
      break;
    }
  }

  const probeLike = planner.counts.probe + planner.counts.catch;
  const catchFraction = probeLike ? planner.counts.catch / probeLike : 0;
  const totalCount = planner.counts.stair + planner.counts.probe + planner.counts.catch;
  if (stream === "catch" && (catchFraction > config.catchProbeFracMax || totalCount < 8)) {
    stream = "probe";
  }

  if (stream === "stair") {
    const condition = planner.nextStair;
    planner.nextStair = condition === "easy" ? "hard" : "easy";
    return { stream, condition };
  }

  if (stream === "probe") {
    const condition = planner.nextProbe;
    planner.nextProbe = condition === "easy" ? "hard" : "easy";
    return { stream, condition };
  }

  return { stream: "catch", condition: "catch" };
}

export function majorityCountForCondition(condition, config = DEFAULT_ZONE_TASK_CONFIG) {
  if (condition === "easy") return config.easyMajority;
  if (condition === "hard") return config.hardMajority;
  return config.catchMajority;
}

export function stimulusFramesForTrial({ stream, condition, taskState }) {
  if (stream === "stair") return taskState.stairs[condition].frames;
  if (stream === "probe") return condition === "easy" ? taskState.probeDurFrames.easy : taskState.probeDurFrames.hard;
  return taskState.probeDurFrames.catch;
}

export function createTrial({
  elapsedMs,
  taskState,
  config = DEFAULT_ZONE_TASK_CONFIG,
  rng = Math.random
}) {
  const plan = chooseTrial({ elapsedMs, taskState, config, rng });
  const majorityCount = majorityCountForCondition(plan.condition, config);
  const pattern = makeMajorityPattern({ majorityCount, nArrows: config.nArrows, rng });
  const stimFrames = clamp(
    Math.round(stimulusFramesForTrial({ ...plan, taskState })),
    taskState.minFrames,
    taskState.maxFrames
  );

  return {
    ...plan,
    majorityCount,
    pattern: pattern.pattern,
    correct: pattern.correct,
    stimFrames
  };
}

export function scoreResponse({ trial, key, rtMs }) {
  const responded = key === "ArrowLeft" || key === "ArrowRight" || key === "L" || key === "R";
  const choice = responded
    ? (key === "ArrowLeft" || key === "L" ? "L" : "R")
    : null;

  return {
    choice,
    rtMs: Number.isFinite(rtMs) ? Math.round(rtMs) : null,
    timedOut: !responded,
    isCorrect: responded ? choice === trial.correct : false
  };
}

export function applyTrialResult({
  trial,
  response,
  taskState,
  config = DEFAULT_ZONE_TASK_CONFIG
}) {
  if (trial.stream === "stair") {
    const stair = taskState.stairs[trial.condition];
    stair.hist.push(stair.frames);
    if (response.isCorrect) {
      stair.streak += 1;
      if (stair.streak >= 2) {
        stair.frames = Math.max(taskState.minFrames, stair.frames - config.stepFrames);
        stair.streak = 0;
      }
    } else {
      stair.frames = Math.min(taskState.maxFrames, stair.frames + config.stepFrames);
      stair.streak = 0;
    }
  }

  taskState.planner.counts[trial.stream] += 1;
  const completedTrial = {
    tMs: Math.round(trial.elapsedMs ?? 0),
    stream: trial.stream,
    cond: trial.condition,
    stimFrames: trial.stimFrames,
    correct: trial.correct,
    choice: response.choice,
    rtMs: response.rtMs,
    timedOut: response.timedOut,
    isCorrect: response.isCorrect
  };
  taskState.trials.push(completedTrial);
  return completedTrial;
}

function tailMean(history, count = 20) {
  const tail = history.slice(-count);
  return tail.length ? mean(tail) : null;
}

export function bitsPerSecondFromStairs(stairs, frameMs, config = DEFAULT_ZONE_TASK_CONFIG) {
  const easyFrames = tailMean(stairs.easy.hist);
  const hardFrames = tailMean(stairs.hard.hist);
  const easySeconds = Number.isFinite(easyFrames) ? easyFrames * frameMs / 1000 : null;
  const hardSeconds = Number.isFinite(hardFrames) ? hardFrames * frameMs / 1000 : null;
  const easy = Number.isFinite(easySeconds) && easySeconds > 0 ? config.bpsScaleK * (1 / easySeconds) : null;
  const hard = Number.isFinite(hardSeconds) && hardSeconds > 0 ? config.bpsScaleK * (1 / hardSeconds) : null;

  return {
    easy,
    hard,
    combined: Number.isFinite(easy) && Number.isFinite(hard) ? (easy + hard) / 2 : (easy ?? hard),
    easyFrames,
    hardFrames
  };
}

function rtLag1(values) {
  if (values.length < 3) return null;
  const left = values.slice(0, -1);
  const right = values.slice(1);
  const leftMean = mean(left);
  const rightMean = mean(right);
  const numerator = left.reduce((sum, value, index) => sum + ((value - leftMean) * (right[index] - rightMean)), 0);
  const leftDenom = Math.sqrt(left.reduce((sum, value) => sum + ((value - leftMean) ** 2), 0));
  const rightDenom = Math.sqrt(right.reduce((sum, value) => sum + ((value - rightMean) ** 2), 0));
  return leftDenom && rightDenom ? numerator / (leftDenom * rightDenom) : null;
}

function thirdsSlope(probeTrials) {
  if (!probeTrials.length) return { rtSlope: null, errSlope: null };
  const size = Math.ceil(probeTrials.length / 3);
  const chunks = [0, 1, 2]
    .map((index) => probeTrials.slice(index * size, (index + 1) * size))
    .filter((chunk) => chunk.length);
  if (chunks.length < 2) return { rtSlope: null, errSlope: null };
  const rtValues = chunks.map((chunk) => mean(chunk.filter((trial) => Number.isFinite(trial.rtMs)).map((trial) => trial.rtMs)));
  const errorValues = chunks.map((chunk) => chunk.filter((trial) => !trial.isCorrect).length / chunk.length);
  const firstRt = rtValues.find(Number.isFinite);
  const lastRt = rtValues.slice().reverse().find(Number.isFinite);
  return {
    rtSlope: Number.isFinite(firstRt) && Number.isFinite(lastRt) ? lastRt - firstRt : null,
    errSlope: errorValues.length >= 2 ? errorValues[errorValues.length - 1] - errorValues[0] : null
  };
}

export function computeProbeFeatures(trials, config = DEFAULT_ZONE_TASK_CONFIG) {
  const probeTrials = trials.filter((trial) => trial.stream === "probe");
  const catchTrials = trials.filter((trial) => trial.stream === "catch");
  const allRt = probeTrials.filter((trial) => Number.isFinite(trial.rtMs)).map((trial) => trial.rtMs);
  const boundedRt = allRt.filter((value) => value >= config.rtMinMs && value <= config.rtMaxMs);
  const probeCount = probeTrials.length;
  const catchCount = catchTrials.length;
  const accuracy = probeCount ? probeTrials.filter((trial) => trial.isCorrect).length / probeCount : null;
  const rtMed = median(boundedRt);
  const rtMean = mean(boundedRt);
  const rtCV = Number.isFinite(rtMean) && rtMean > 0 ? sd(boundedRt) / rtMean : null;
  const timeoutRate = probeCount ? probeTrials.filter((trial) => trial.timedOut).length / probeCount : null;
  const p90 = percentile(boundedRt, 0.9);
  const rtTailIndex = Number.isFinite(p90) && Number.isFinite(rtMed) ? p90 - rtMed : null;
  const slowThreshold = Number.isFinite(rtMed) ? Math.max(config.slowFloorMs, 3 * rtMed) : config.slowFloorMs;
  const slowLapseRate = probeCount ? probeTrials.filter((trial) => Number.isFinite(trial.rtMs) && trial.rtMs > slowThreshold).length / probeCount : null;
  const fastRate = probeCount ? probeTrials.filter((trial) => Number.isFinite(trial.rtMs) && trial.rtMs < config.fastMs).length / probeCount : null;
  const fastErrorRate = probeCount ? probeTrials.filter((trial) => !trial.isCorrect && Number.isFinite(trial.rtMs) && trial.rtMs < config.fastMs).length / probeCount : null;

  let rtVolatility = null;
  if (boundedRt.length >= 3) {
    const diffs = [];
    for (let index = 1; index < boundedRt.length; index += 1) {
      diffs.push(Math.abs(boundedRt[index] - boundedRt[index - 1]));
    }
    rtVolatility = median(diffs);
  }

  let errorRun = 0;
  let maxErrorRun = 0;
  for (const trial of probeTrials) {
    if (!trial.isCorrect) {
      errorRun += 1;
      maxErrorRun = Math.max(maxErrorRun, errorRun);
    } else {
      errorRun = 0;
    }
  }

  const binCount = Math.min(5, Math.max(2, Math.floor(probeCount / 4) || 0));
  const errorBins = [];
  if (binCount >= 2) {
    const binSize = Math.ceil(probeCount / binCount);
    for (let index = 0; index < binCount; index += 1) {
      const chunk = probeTrials.slice(index * binSize, (index + 1) * binSize);
      if (chunk.length) errorBins.push(chunk.filter((trial) => !trial.isCorrect).length / chunk.length);
    }
  }
  const errorBurstiness = probeCount ? maxErrorRun + ((sd(errorBins) ** 2) * 10) : null;
  const { rtSlope, errSlope } = thirdsSlope(probeTrials);

  const afterError = [];
  const afterCorrect = [];
  for (let index = 1; index < probeTrials.length; index += 1) {
    const previous = probeTrials[index - 1];
    const current = probeTrials[index];
    if (!Number.isFinite(current.rtMs)) continue;
    if (previous.isCorrect) afterCorrect.push(current.rtMs);
    else afterError.push(current.rtMs);
  }

  const pes = afterError.length && afterCorrect.length ? mean(afterError) - mean(afterCorrect) : null;
  const catchFails = catchTrials.filter((trial) => !trial.isCorrect).length;

  return {
    probe: {
      n: probeCount,
      acc: accuracy,
      rtMed,
      rtCV,
      timeoutRate,
      slowLapseRate,
      rtTailIndex,
      fastRate,
      fastErrorRate,
      rtVolatility,
      errorBurstiness,
      rtSlope,
      errSlope,
      PES: pes,
      rtLag1: rtLag1(allRt),
      throughputProxy: Number.isFinite(accuracy) && Number.isFinite(rtMed) && rtMed > 0
        ? accuracy / (rtMed / 1000)
        : null
    },
    catchFailRate: catchCount ? catchFails / catchCount : null,
    counts: {
      catchN: catchCount,
      catchFails,
      pesSupport: afterError.length
    }
  };
}

export function validZoneRows(rows) {
  return rows.filter((row) => row?.valid && Number.isFinite(row?.bitsPerSecond) && row?.state !== "invalid");
}

export function computeBaselines(rows, config = DEFAULT_ZONE_TASK_CONFIG) {
  const validRows = validZoneRows(rows);
  const windowRows = validRows.slice(-config.baselineWindow);
  const pick = (selector) => windowRows.map(selector).filter(Number.isFinite);
  return {
    count: validRows.length,
    bps: pick((row) => row.bitsPerSecond),
    rtCV: pick((row) => row.features?.probe?.rtCV),
    timeout: pick((row) => row.features?.probe?.timeoutRate),
    pes: pick((row) => row.features?.probe?.PES)
  };
}

export function lastProbeFrames(rows) {
  for (let index = rows.length - 1; index >= 0; index -= 1) {
    const frames = rows[index]?.probeDurFrames;
    if (rows[index]?.valid && frames && Number.isFinite(frames.easy) && Number.isFinite(frames.hard)) {
      return {
        easy: Math.round(frames.easy),
        hard: Math.round(frames.hard)
      };
    }
  }
  return null;
}

function normalizeScore(value, low, high) {
  if (!Number.isFinite(value)) return 0;
  return clamp((value - low) / (high - low), 0, 1);
}

export function classifyZone({ valid, invalidReason, features, bitsPerSecond, baselines }) {
  if (!valid) {
    return {
      state: "invalid",
      confidence: "Low",
      reasons: [invalidReason || "Timing or focus quality failed"],
      scores: null
    };
  }

  const probe = features.probe || {};
  const coldScore =
    (2.4 * normalizeScore(probe.timeoutRate, 0.02, 0.12))
    + (2.0 * normalizeScore(probe.slowLapseRate, 0.02, 0.1))
    + (1.4 * normalizeScore(probe.rtTailIndex, 100, 320))
    + (1.2 * normalizeScore(probe.rtSlope, 20, 120))
    + (1.2 * normalizeScore(probe.errSlope, 0.02, 0.1))
    + (2.0 * normalizeScore(features.catchFailRate, 0.08, 0.25));

  const exploreScore =
    (1.6 * normalizeScore(probe.rtCV, 0.22, 0.4))
    + (1.3 * normalizeScore(probe.rtVolatility, 60, 170))
    + (2.0 * normalizeScore(probe.fastErrorRate, 0.02, 0.12))
    + (1.4 * normalizeScore(probe.errorBurstiness, 1.8, 4.8))
    + (0.6 * normalizeScore(probe.fastRate, 0.08, 0.26));

  const slowSteady = (0.7 * normalizeScore(probe.rtMed, 560, 900))
    + (0.35 * normalizeScore(-(probe.rtVolatility ?? 0), -160, -45))
    + (0.25 * normalizeScore(-(probe.fastErrorRate ?? 0), -0.08, -0.005));
  const exploitScore =
    (1.7 * normalizeScore(probe.PES, 45, 180))
    + slowSteady
    + (0.25 * normalizeScore(-(probe.fastErrorRate ?? 0), -0.08, -0.005))
    + (0.25 * normalizeScore(-(probe.rtVolatility ?? 0), -160, -45));

  const bpsBaseline = ewma(baselines.bps);
  const bpsSpread = sd(baselines.bps);
  const bpsOk = (baselines.count < 3)
    || !Number.isFinite(bpsBaseline)
    || !Number.isFinite(bitsPerSecond)
    || bitsPerSecond >= bpsBaseline - Math.max(0.25, 0.5 * (bpsSpread || 0.5));

  const catchOk = !Number.isFinite(features.catchFailRate) || features.catchFailRate <= 0.16;
  const inZone = (baselines.count < 2)
    ? ((probe.n || 0) >= 18 && coldScore < 1.9 && exploreScore < 2.2 && exploitScore < 2.4 && catchOk)
    : ((probe.n || 0) >= 18 && coldScore < 2.4 && exploreScore < 2.7 && exploitScore < 2.8 && catchOk && bpsOk);

  let state = "in_zone";
  if (!inZone) {
    state = [
      ["flat", coldScore],
      ["overloaded_explore", exploreScore],
      ["overloaded_exploit", exploitScore]
    ].sort((left, right) => right[1] - left[1])[0][0];
  }

  const ranked = [
    ["flat", coldScore],
    ["overloaded_explore", exploreScore],
    ["overloaded_exploit", exploitScore]
  ].sort((left, right) => right[1] - left[1]);
  const margin = (ranked[0]?.[1] ?? 0) - (ranked[1]?.[1] ?? 0);
  let confidence = state === "in_zone"
    ? (baselines.count >= 5 ? "Medium" : "Low")
    : (margin >= 1.2 ? "High" : margin >= 0.5 ? "Medium" : "Low");

  if ((probe.n || 0) < 16) confidence = "Low";
  if (state === "overloaded_exploit" && (features.counts?.pesSupport || 0) < 8) confidence = "Low";
  if (state === "in_zone" && baselines.count >= 5 && confidence === "Medium" && (probe.n || 0) >= 24) {
    confidence = "High";
  }

  const reasonMap = {
    flat: ["Timeouts/lapses", "Slow-tail drift", "Catch failures"],
    overloaded_explore: ["RT variability", "Fast errors", "Error burstiness"],
    overloaded_exploit: ["Post-error slowing", "Slow steady responding", "Low exploratory variability"],
    in_zone: ["Low lapse/catch failure", "Low variability and burstiness", "No dominant off-zone signature"]
  };

  return {
    state,
    confidence,
    reasons: reasonMap[state] || [],
    scores: {
      flat: Number(coldScore.toFixed(3)),
      overloaded_explore: Number(exploreScore.toFixed(3)),
      overloaded_exploit: Number(exploitScore.toFixed(3))
    }
  };
}

export function summarizeTaskRun({
  sessionId = `zone_${Date.now()}`,
  taskState,
  valid = true,
  invalidReason = null,
  historyRows = [],
  config = DEFAULT_ZONE_TASK_CONFIG
}) {
  if (!taskState.probeDurFrames.frozen) {
    freezeProbeDurations(taskState);
  }

  const bits = bitsPerSecondFromStairs(taskState.stairs, taskState.frameMs, config);
  const features = computeProbeFeatures(taskState.trials, config);
  const baselines = computeBaselines(historyRows, config);
  const route = classifyZone({
    valid,
    invalidReason,
    features,
    bitsPerSecond: bits.combined,
    baselines
  });

  return {
    sessionId,
    timestamp: Date.now(),
    valid,
    invalidReason: valid ? null : (invalidReason || "Timing or focus quality failed"),
    state: route.state,
    confidence: route.confidence,
    reasons: route.reasons,
    bitsPerSecond: Number.isFinite(bits.combined) ? Number(bits.combined.toFixed(3)) : null,
    timing: {
      frameMs: Number(taskState.frameMs.toFixed(3)),
      hz: Number((1000 / taskState.frameMs).toFixed(1)),
      droppedFrac: Number((taskState.timing?.droppedFrac || 0).toFixed(4))
    },
    probeDurFrames: {
      easy: taskState.probeDurFrames.easy,
      hard: taskState.probeDurFrames.hard,
      catch: taskState.probeDurFrames.catch
    },
    features,
    counts: {
      totalTrials: taskState.trials.length,
      stairTrials: taskState.trials.filter((trial) => trial.stream === "stair").length,
      probeTrials: taskState.trials.filter((trial) => trial.stream === "probe").length,
      catchTrials: taskState.trials.filter((trial) => trial.stream === "catch").length,
      falseStarts: taskState.falseStarts || 0,
      catchFails: features.counts.catchFails,
      pesSupport: features.counts.pesSupport
    },
    baselines: {
      priorValidCount: baselines.count,
      bpsEwma: Number.isFinite(ewma(baselines.bps)) ? Number(ewma(baselines.bps).toFixed(3)) : null
    },
    scores: route.scores
  };
}

/*
 * Example non-UI simulation.
 *
 * In a real app, each trial should be rendered in this order:
 * fixation -> blank ISI -> arrows for trial.stimFrames -> mask -> response.
 * Then call scoreResponse/applyTrialResult with the user's input.
 */
export function simulateTaskRun({
  seed = 1234,
  frameMs = 16.6667,
  durationMs = DEFAULT_ZONE_TASK_CONFIG.totalSeconds * 1000,
  userModel = defaultUserModel,
  historyRows = [],
  config = DEFAULT_ZONE_TASK_CONFIG
} = {}) {
  const rng = createSeededRng(seed);
  const taskState = createTaskState({ frameMs, historyRows, config });
  let elapsedMs = 0;

  while (elapsedMs < durationMs) {
    const trial = createTrial({ elapsedMs, taskState, config, rng });
    trial.elapsedMs = elapsedMs;
    const user = userModel({ trial, rng, elapsedMs });
    const response = scoreResponse({ trial, key: user.key, rtMs: user.rtMs });
    applyTrialResult({ trial, response, taskState, config });

    elapsedMs += config.fixationMs
      + config.isiMs
      + (trial.stimFrames * frameMs)
      + config.maskMs
      + Math.min(user.rtMs ?? config.responseTimeoutMs, config.responseTimeoutMs);
  }

  return summarizeTaskRun({ taskState, historyRows, config });
}

export function defaultUserModel({ trial, rng }) {
  const accuracy = trial.condition === "easy" ? 0.92 : trial.condition === "hard" ? 0.78 : 0.97;
  const correct = rng() < accuracy;
  const key = correct
    ? (trial.correct === "L" ? "ArrowLeft" : "ArrowRight")
    : (trial.correct === "L" ? "ArrowRight" : "ArrowLeft");
  const rtMs = Math.round(430 + (rng() * 260));
  return { key, rtMs };
}
