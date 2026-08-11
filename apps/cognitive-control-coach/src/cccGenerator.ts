import { OCTAGON_POSITIONS, vectorForRelation } from "./geometry";
import { hashSeed, mulberry32, shuffle } from "./random";
import {
  answersForWrapper,
  CCC_APP_ID,
  CCC_CONFIG_VERSION,
  CCC_P0_BLOCK_MICROCYCLES,
  CCC_P0_PRACTICE_VALID_TRIALS,
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
  CccAttentionTrialPurpose,
  CccP0Phase,
  CccRegimeId,
  CccRatio,
  CccSessionPlan,
  CccTransitionKind,
  CccWrapperId,
} from "./cccTypes";

export interface CreateP0AttentionPlanInput {
  sessionId?: string;
  planId?: string;
  regimePairIndex?: 0 | 1;
  /** Test-only override for the initial arrow block. */
  microcyclesPerWrapper?: number;
  seed?: string;
}

type BlockSpec = {
  id: string;
  stepId: string;
  label: string;
  phase: Exclude<CccP0Phase, "practice">;
  wrapperId: CccWrapperId | "mixed_abs";
  wrappers: readonly CccWrapperId[];
  sourceWrapperId: CccWrapperId | null;
  transitionKind: CccTransitionKind;
  purpose: CccAttentionTrialPurpose;
  microcycles: number;
  strictCarrierTransferBoundary: boolean;
  diagnostic: boolean;
  shiftViewBefore: boolean;
  assistedFirstContact: boolean;
};

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

function targetSequence(wrapperId: CccWrapperId, random: () => number, count = CCC_TRIAL_TIMING.validTrialsPerRegimeMicrocycle): CccAttentionAnswer[] {
  const answers = answersForWrapper(wrapperId);
  const repeat = Math.ceil(count / answers.length);
  return shuffle(random, answers.flatMap((answer) => Array<CccAttentionAnswer>(repeat).fill(answer))).slice(0, count);
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
  id: string;
  sessionId: string;
  blockId: string;
  trialIndex: number;
  blockTrialIndex: number;
  stepId: string;
  phase: CccP0Phase;
  purpose: CccAttentionTrialPurpose;
  wrapperId: CccWrapperId;
  sourceWrapperId: CccWrapperId | null;
  transitionKind: CccTransitionKind;
  strictCarrierTransferBoundary: boolean;
  regimeId: CccRegimeId;
  microcycleIndex: number;
  balancedSlotIndex: number;
  targetClass: CccAttentionAnswer;
  random: () => number;
  seed: string;
  practice: boolean;
  diagnostic: boolean;
  assistedFirstContact: boolean;
  replacementOfTrialId?: string | null;
}): CccAttentionTrialDefinition {
  const ratio = ratioForRandom(input.regimeId, input.random);
  const majorityCount = CCC_RATIO_MAJORITY_COUNTS[ratio];
  return {
    id: input.id,
    sessionId: input.sessionId,
    blockId: input.blockId,
    trialIndex: input.trialIndex,
    blockTrialIndex: input.blockTrialIndex,
    stage: "P0",
    stepId: input.stepId,
    phase: input.phase,
    operator: "attention",
    purpose: input.purpose,
    wrapperId: input.wrapperId,
    sourceWrapperId: input.sourceWrapperId,
    carrier: carrierForWrapper(input.wrapperId),
    referenceFrame: referenceFrameForWrapper(input.wrapperId),
    transitionKind: input.transitionKind,
    strictCarrierTransferBoundary: input.strictCarrierTransferBoundary,
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
    seed: input.seed,
    practice: input.practice,
    diagnostic: input.diagnostic,
    assistedFirstContact: input.assistedFirstContact,
    replacementOfTrialId: input.replacementOfTrialId ?? null,
  };
}

function blockSpecs(initialArrowMicrocycles: number): BlockSpec[] {
  return [
    {
      id: "p0-arrow-abs-stabilise",
      stepId: "p0_arrow_abs_stabilize",
      label: "Find the direction",
      phase: "arrow_stabilisation",
      wrapperId: "arrow_abs",
      wrappers: ["arrow_abs"],
      sourceWrapperId: null,
      transitionKind: "baseline_stabilization",
      purpose: "training",
      microcycles: initialArrowMicrocycles,
      strictCarrierTransferBoundary: false,
      diagnostic: false,
      shiftViewBefore: false,
      assistedFirstContact: false,
    },
    {
      id: "p0-flow-abs-first-contact",
      stepId: "p0_flow_abs_first_contact",
      label: "Meet the moving format",
      phase: "flow_first_contact",
      wrapperId: "flow_abs",
      wrappers: ["flow_abs"],
      sourceWrapperId: "arrow_abs",
      transitionKind: "carrier_transfer",
      purpose: "carrier_probe",
      microcycles: CCC_P0_BLOCK_MICROCYCLES.flowFirstContact,
      strictCarrierTransferBoundary: true,
      diagnostic: true,
      shiftViewBefore: true,
      assistedFirstContact: true,
    },
    {
      id: "p0-flow-abs-recovery",
      stepId: "p0_flow_abs_recovery",
      label: "Settle into the moving format",
      phase: "flow_recovery",
      wrapperId: "flow_abs",
      wrappers: ["flow_abs"],
      sourceWrapperId: "flow_abs",
      transitionKind: "baseline_stabilization",
      purpose: "recovery",
      microcycles: CCC_P0_BLOCK_MICROCYCLES.flowRecovery,
      strictCarrierTransferBoundary: false,
      diagnostic: false,
      shiftViewBefore: false,
      assistedFirstContact: false,
    },
    {
      id: "p0-arrow-abs-return",
      stepId: "p0_arrow_abs_return",
      label: "Return to the original format",
      phase: "arrow_return",
      wrapperId: "arrow_abs",
      wrappers: ["arrow_abs"],
      sourceWrapperId: "flow_abs",
      transitionKind: "carrier_transfer",
      purpose: "return",
      microcycles: CCC_P0_BLOCK_MICROCYCLES.arrowReturn,
      strictCarrierTransferBoundary: false,
      diagnostic: false,
      shiftViewBefore: false,
      assistedFirstContact: false,
    },
    {
      id: "p0-absolute-mix",
      stepId: "p0_absolute_mix",
      label: "Keep the goal as the format changes",
      phase: "absolute_mix",
      wrapperId: "mixed_abs",
      wrappers: ["arrow_abs", "flow_abs"],
      sourceWrapperId: null,
      transitionKind: "mixed_attention_portability",
      purpose: "mix",
      microcycles: CCC_P0_BLOCK_MICROCYCLES.absoluteMix,
      strictCarrierTransferBoundary: false,
      diagnostic: false,
      shiftViewBefore: false,
      assistedFirstContact: false,
    },
  ];
}

export function createP0AttentionCarrierTransferPlan(input: CreateP0AttentionPlanInput = {}): CccSessionPlan {
  const seed = input.seed || input.sessionId || "ccc-p0-session";
  const random = mulberry32(hashSeed(seed));
  const sessionId = input.sessionId || `ccc-p0-${hashSeed(seed).toString(16)}`;
  const planId = input.planId || `${sessionId}:p0`;
  const pairIndex = input.regimePairIndex ?? (hashSeed(seed) % CCC_REGIME_PAIRS.length === 0 ? 0 : 1);
  const regimePair = CCC_REGIME_PAIRS[pairIndex];
  const arrowMicrocycles = input.microcyclesPerWrapper ?? CCC_P0_BLOCK_MICROCYCLES.arrowStabilisation;
  const blocks: CccAttentionBlockPlan[] = [];
  const trials: CccAttentionTrialDefinition[] = [];
  let trialIndex = 0;

  blockSpecs(arrowMicrocycles).forEach((spec, blockIndex) => {
    const blockStart = trials.length;
    for (let microcycleIndex = 1; microcycleIndex <= spec.microcycles; microcycleIndex += 1) {
      for (const regimeId of regimePair) {
        const wrapperTrials: CccAttentionTrialDefinition[] = [];
        for (const wrapperId of spec.wrappers) {
          const targets = targetSequence(wrapperId, random);
          targets.forEach((targetClass, balancedSlotIndex) => {
            trialIndex += 1;
            const trialSeed = `${seed}:${spec.id}:${microcycleIndex}:${regimeId}:${wrapperId}:${balancedSlotIndex + 1}`;
            wrapperTrials.push(buildTrial({
              id: `${spec.id}-trial-${String(trialIndex).padStart(3, "0")}`,
              sessionId,
              blockId: spec.id,
              trialIndex,
              blockTrialIndex: 0,
              stepId: spec.stepId,
              phase: spec.phase,
              purpose: spec.purpose,
              wrapperId,
              sourceWrapperId: spec.sourceWrapperId,
              transitionKind: spec.transitionKind,
              strictCarrierTransferBoundary: spec.strictCarrierTransferBoundary,
              regimeId,
              microcycleIndex,
              balancedSlotIndex: balancedSlotIndex + 1,
              targetClass,
              random,
              seed: trialSeed,
              practice: false,
              diagnostic: spec.diagnostic,
              assistedFirstContact: spec.assistedFirstContact,
            }));
          });
        }
        const ordered = spec.wrapperId === "mixed_abs" ? shuffle(random, wrapperTrials) : wrapperTrials;
        ordered.forEach((trial) => {
          trials.push({ ...trial, blockTrialIndex: trials.length - blockStart + 1 });
        });
      }
    }
    blocks.push({
      id: spec.id,
      index: blockIndex + 1,
      stage: "P0",
      stepId: spec.stepId,
      label: spec.label,
      operator: "attention",
      phase: spec.phase,
      wrapperId: spec.wrapperId,
      wrappers: spec.wrappers,
      sourceWrapperId: spec.sourceWrapperId,
      transitionKind: spec.transitionKind,
      strictCarrierTransferBoundary: spec.strictCarrierTransferBoundary,
      regimePair,
      microcycleCount: spec.microcycles,
      validTrialCount: trials.length - blockStart,
      practice: false,
      diagnostic: spec.diagnostic,
      shiftViewBefore: spec.shiftViewBefore,
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
    shiftViewEligible: true,
    blocks,
    trials,
  };
}

export function createP0PracticeTrials(plan: CccSessionPlan): CccAttentionTrialDefinition[] {
  const random = mulberry32(hashSeed(`${plan.sessionId}:practice`));
  const perRegime = Math.max(2, Math.ceil(CCC_P0_PRACTICE_VALID_TRIALS / plan.regimePair.length));
  const trials: CccAttentionTrialDefinition[] = [];
  for (const regimeId of plan.regimePair) {
    const targets = targetSequence("arrow_abs", random, perRegime);
    targets.forEach((targetClass, slot) => {
      const trialIndex = trials.length + 1;
      trials.push(buildTrial({
        id: `p0-practice-trial-${trialIndex}`,
        sessionId: plan.sessionId,
        blockId: "p0-practice",
        trialIndex: -trialIndex,
        blockTrialIndex: trialIndex,
        stepId: "p0_practice",
        phase: "practice",
        purpose: "practice",
        wrapperId: "arrow_abs",
        sourceWrapperId: null,
        transitionKind: "baseline_stabilization",
        strictCarrierTransferBoundary: false,
        regimeId,
        microcycleIndex: 0,
        balancedSlotIndex: slot + 1,
        targetClass,
        random,
        seed: `${plan.sessionId}:practice:${regimeId}:${slot + 1}`,
        practice: true,
        diagnostic: false,
        assistedFirstContact: false,
      }));
    });
  }
  return shuffle(random, trials).slice(0, CCC_P0_PRACTICE_VALID_TRIALS).map((trial, index) => ({
    ...trial,
    blockTrialIndex: index + 1,
  }));
}

export function createP0PracticeBlock(plan: CccSessionPlan): CccAttentionBlockPlan {
  return {
    id: "p0-practice",
    index: 0,
    stage: "P0",
    stepId: "p0_practice",
    label: "Learn the task",
    operator: "attention",
    phase: "practice",
    wrapperId: "arrow_abs",
    wrappers: ["arrow_abs"],
    sourceWrapperId: null,
    transitionKind: "baseline_stabilization",
    strictCarrierTransferBoundary: false,
    regimePair: plan.regimePair,
    microcycleCount: 0,
    validTrialCount: CCC_P0_PRACTICE_VALID_TRIALS,
    practice: true,
    diagnostic: false,
    shiftViewBefore: false,
  };
}

export function createCccReplacementTrial(
  original: CccAttentionTrialDefinition,
  replacementIndex: number,
  trialIndex = original.trialIndex + replacementIndex * 10000,
): CccAttentionTrialDefinition {
  const seed = `${original.seed}:replacement:${replacementIndex}`;
  const random = mulberry32(hashSeed(seed));
  return buildTrial({
    id: `${original.id}-r${replacementIndex}`,
    sessionId: original.sessionId,
    blockId: original.blockId,
    trialIndex,
    blockTrialIndex: original.blockTrialIndex,
    stepId: original.stepId,
    phase: original.phase,
    purpose: original.purpose,
    wrapperId: original.wrapperId,
    sourceWrapperId: original.sourceWrapperId,
    transitionKind: original.transitionKind,
    strictCarrierTransferBoundary: original.strictCarrierTransferBoundary,
    regimeId: original.regimeId,
    microcycleIndex: original.microcycleIndex,
    balancedSlotIndex: original.balancedSlotIndex,
    targetClass: original.targetClass,
    random,
    seed,
    practice: original.practice,
    diagnostic: original.diagnostic,
    assistedFirstContact: original.assistedFirstContact,
    replacementOfTrialId: original.replacementOfTrialId || original.id,
  });
}
