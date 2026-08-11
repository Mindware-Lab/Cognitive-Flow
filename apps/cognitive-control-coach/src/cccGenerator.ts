import { OCTAGON_POSITIONS, vectorForRelation } from "./geometry";
import { hashSeed, mulberry32, shuffle } from "./random";
import {
  answersForWrapper,
  CCC_APP_ID,
  CCC_CONFIG_VERSION,
  CCC_PROTOCOL_VERSION,
  CCC_RATIO_MAJORITY_COUNTS,
  CCC_REGIME_PAIRS,
  CCC_REGIMES,
  CCC_TRIAL_TIMING,
  CCC_WRAPPER_RESPONSE_LABELS,
} from "./cccConfig";
import { carrierForWrapper, referenceFrameForWrapper } from "./cccProgression";
import type { DirectionRelation } from "./types";
import type {
  CccAttentionAnswer,
  CccAttentionBlockPlan,
  CccAttentionTrialDefinition,
  CccRegimeId,
  CccRatio,
  CccSessionPlan,
  CccWrapperId,
} from "./cccTypes";

export interface CreateP0AttentionPlanInput {
  sessionId?: string;
  planId?: string;
  regimePairIndex?: 0 | 1;
  microcyclesPerWrapper?: number;
  seed?: string;
}

const P0_WRAPPER_SEQUENCE: readonly CccWrapperId[] = ["arrow_abs", "flow_abs"];

function ratioForRandom(regimeId: CccRegimeId, random: () => number): CccRatio {
  const priors = CCC_REGIMES[regimeId].ratioPriors;
  const roll = random();
  let running = 0;
  for (const ratio of ["5:0", "4:1", "3:2"] as const) {
    running += priors[ratio];
    if (roll <= running) return ratio;
  }
  return "3:2";
}

function targetSequence(wrapperId: CccWrapperId, random: () => number): CccAttentionAnswer[] {
  const answers = answersForWrapper(wrapperId);
  const repeat = CCC_TRIAL_TIMING.validTrialsPerRegimeMicrocycle / answers.length;
  const targets = answers.flatMap((answer) => Array<CccAttentionAnswer>(repeat).fill(answer));
  return shuffle(random, targets);
}

function stimulusItemsForTrial(
  wrapperId: CccWrapperId,
  targetClass: CccAttentionAnswer,
  majorityCount: 3 | 4 | 5,
  random: () => number,
) {
  const answerOptions = answersForWrapper(wrapperId);
  const foil = answerOptions.find((answer) => answer !== targetClass) || targetClass;
  const relations = shuffle(random, [
    ...Array<CccAttentionAnswer>(majorityCount).fill(targetClass),
    ...Array<CccAttentionAnswer>(5 - majorityCount).fill(foil),
  ]);
  const positions = shuffle(random, Array.from({ length: OCTAGON_POSITIONS.length }, (_, index) => index)).slice(0, 5);
  return positions.map((positionIndex, itemIndex) => {
    const position = OCTAGON_POSITIONS[positionIndex];
    const relation = relations[itemIndex];
    return {
      positionIndex,
      position: { x: position.x, y: position.y },
      relation,
      vector: vectorForRelation(relation as DirectionRelation, position),
    };
  });
}

function buildTrial(input: {
  sessionId: string;
  blockId: string;
  trialIndex: number;
  blockTrialIndex: number;
  wrapperId: CccWrapperId;
  sourceWrapperId: CccWrapperId | null;
  regimeId: CccRegimeId;
  microcycleIndex: number;
  balancedSlotIndex: number;
  targetClass: CccAttentionAnswer;
  random: () => number;
}): CccAttentionTrialDefinition {
  const ratio = ratioForRandom(input.regimeId, input.random);
  const majorityCount = CCC_RATIO_MAJORITY_COUNTS[ratio];
  const transitionKind = input.sourceWrapperId && input.sourceWrapperId !== input.wrapperId ? "carrier_transfer" : "baseline_stabilization";
  const seed = [
    input.sessionId,
    input.blockId,
    input.trialIndex,
    input.wrapperId,
    input.regimeId,
    input.microcycleIndex,
    input.targetClass,
  ].join(":");
  return {
    id: `${input.blockId}-trial-${String(input.blockTrialIndex).padStart(2, "0")}`,
    sessionId: input.sessionId,
    blockId: input.blockId,
    trialIndex: input.trialIndex,
    blockTrialIndex: input.blockTrialIndex,
    stage: "P0",
    stepId: input.wrapperId === "arrow_abs" ? "p0_arrow_abs_stabilize" : "p0_flow_abs_transfer",
    operator: "attention",
    purpose: input.wrapperId === "arrow_abs" ? "training" : "carrier_probe",
    wrapperId: input.wrapperId,
    sourceWrapperId: input.sourceWrapperId,
    carrier: carrierForWrapper(input.wrapperId),
    referenceFrame: referenceFrameForWrapper(input.wrapperId),
    transitionKind,
    strictCarrierTransferBoundary: transitionKind === "carrier_transfer",
    regimeId: input.regimeId,
    microcycleIndex: input.microcycleIndex,
    balancedSlotIndex: input.balancedSlotIndex,
    ratio,
    majorityCount,
    targetClass: input.targetClass,
    correctResponse: input.targetClass,
    answerOptions: answersForWrapper(input.wrapperId),
    responseLabels: CCC_WRAPPER_RESPONSE_LABELS[input.wrapperId],
    stimulusItems: stimulusItemsForTrial(input.wrapperId, input.targetClass, majorityCount, input.random),
    coherenceNoiseLevel: 0,
    seed,
  };
}

export function createP0AttentionCarrierTransferPlan(input: CreateP0AttentionPlanInput = {}): CccSessionPlan {
  const seed = input.seed || input.sessionId || "ccc-p0-session";
  const random = mulberry32(hashSeed(seed));
  const sessionId = input.sessionId || `ccc-p0-${hashSeed(seed).toString(16)}`;
  const planId = input.planId || `${sessionId}:p0`;
  const regimePair = CCC_REGIME_PAIRS[input.regimePairIndex ?? (hashSeed(seed) % CCC_REGIME_PAIRS.length === 0 ? 0 : 1)];
  const microcyclesPerWrapper = input.microcyclesPerWrapper ?? CCC_TRIAL_TIMING.minimumBalancedMicrocyclesBeforeFlattening;
  const blocks: CccAttentionBlockPlan[] = [];
  const trials: CccAttentionTrialDefinition[] = [];
  let trialIndex = 0;

  P0_WRAPPER_SEQUENCE.forEach((wrapperId, wrapperIndex) => {
    const sourceWrapperId = wrapperIndex === 0 ? null : P0_WRAPPER_SEQUENCE[wrapperIndex - 1];
    const blockId = wrapperId === "arrow_abs" ? "p0-arrow-abs-stabilize" : "p0-flow-abs-transfer";
    const blockStart = trials.length;
    for (let microcycle = 1; microcycle <= microcyclesPerWrapper; microcycle += 1) {
      for (const regimeId of regimePair) {
        const targets = targetSequence(wrapperId, random);
        targets.forEach((targetClass, balancedSlotIndex) => {
          trialIndex += 1;
          trials.push(buildTrial({
            sessionId,
            blockId,
            trialIndex,
            blockTrialIndex: trials.length - blockStart + 1,
            wrapperId,
            sourceWrapperId,
            regimeId,
            microcycleIndex: microcycle,
            balancedSlotIndex: balancedSlotIndex + 1,
            targetClass,
            random,
          }));
        });
      }
    }
    const transitionKind = sourceWrapperId ? "carrier_transfer" : "baseline_stabilization";
    blocks.push({
      id: blockId,
      index: wrapperIndex + 1,
      stage: "P0",
      stepId: wrapperId === "arrow_abs" ? "p0_arrow_abs_stabilize" : "p0_flow_abs_transfer",
      label: wrapperId === "arrow_abs" ? "Stabilise absolute arrows" : "Transfer absolute rule to flow",
      operator: "attention",
      wrapperId,
      sourceWrapperId,
      transitionKind,
      strictCarrierTransferBoundary: transitionKind === "carrier_transfer",
      regimePair,
      microcycleCount: microcyclesPerWrapper,
      validTrialCount: trials.length - blockStart,
    });
  });

  return {
    planId,
    appId: CCC_APP_ID,
    protocolVersion: CCC_PROTOCOL_VERSION,
    configVersion: CCC_CONFIG_VERSION,
    sessionId,
    sessionType: "guided_p0",
    stage: "P0",
    operator: "attention",
    regimePair,
    shiftViewEligible: false,
    blocks,
    trials,
  };
}