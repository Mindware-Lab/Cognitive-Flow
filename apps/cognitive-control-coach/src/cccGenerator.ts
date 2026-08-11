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
  CCC_SIGNAL_ANCHOR_VALID_TRIALS,
  CCC_TRIAL_TIMING,
  CCC_WRAPPER_RESPONSE_LABELS,
} from "./cccConfig";
import { carrierForWrapper, referenceFrameForWrapper } from "./cccProgression";
import {
  CCC_SIGNAL_INITIAL_LEVEL,
  signalConditionForLevel,
} from "./cccSignal";
import type { DirectionRelation } from "./types";
import type {
  CccAttentionAnswer,
  CccAttentionBlockPlan,
  CccAttentionTrialDefinition,
  CccAttentionTrialPurpose,
  CccEstimand,
  CccP0Phase,
  CccPresentationMode,
  CccRatio,
  CccSessionPlan,
  CccTransitionKind,
  CccWrapperId,
  CccRegimeId,
} from "./cccTypes";

export interface CreateP0AttentionPlanInput {
  sessionId?: string;
  planId?: string;
  regimePairIndex?: 0 | 1;
  /** Test-only override for the initial relative-arrow block. */
  microcyclesPerWrapper?: number;
  seed?: string;
}

type BlockSpec = {
  id: string;
  stepId: string;
  label: string;
  phase: Exclude<CccP0Phase, "practice">;
  estimand: Exclude<CccEstimand, "practice">;
  presentationMode: CccPresentationMode;
  wrapperId: CccWrapperId | "mixed_rel";
  wrappers: readonly CccWrapperId[];
  sourceWrapperId: CccWrapperId | null;
  transitionKind: CccTransitionKind;
  purpose: CccAttentionTrialPurpose;
  microcycles: number;
  fixedTrialCount?: number;
  strictCarrierTransferBoundary: boolean;
  diagnostic: boolean;
  shiftViewBefore: boolean;
  assistedFirstContact: boolean;
};

const EASY_RATIO_QUOTA: readonly CccRatio[] = ["5:0", "5:0", "5:0", "4:1", "4:1", "3:2"];
const HARD_RATIO_QUOTA: readonly CccRatio[] = ["5:0", "4:1", "4:1", "3:2", "3:2", "3:2"];

function ratioSequence(regimeId: CccRegimeId, random: () => number): CccRatio[] {
  const quota = regimeId === "clear_sprint" || regimeId === "clean_precision"
    ? EASY_RATIO_QUOTA
    : HARD_RATIO_QUOTA;
  return shuffle(random, [...quota]);
}

function targetSequence(wrapperId: CccWrapperId, random: () => number, count: number): CccAttentionAnswer[] {
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
  estimand: CccEstimand;
  presentationMode: CccPresentationMode;
  purpose: CccAttentionTrialPurpose;
  wrapperId: CccWrapperId;
  sourceWrapperId: CccWrapperId | null;
  transitionKind: CccTransitionKind;
  strictCarrierTransferBoundary: boolean;
  regimeId: CccRegimeId;
  microcycleIndex: number;
  balancedSlotIndex: number;
  targetClass: CccAttentionAnswer;
  ratio: CccRatio;
  random: () => number;
  seed: string;
  practice: boolean;
  diagnostic: boolean;
  assistedFirstContact: boolean;
  exposureMsRequested?: number | null;
  signalStaircaseLevel?: number | null;
  replacementOfTrialId?: string | null;
}): CccAttentionTrialDefinition {
  const majorityCount = CCC_RATIO_MAJORITY_COUNTS[input.ratio];
  return {
    id: input.id,
    sessionId: input.sessionId,
    blockId: input.blockId,
    trialIndex: input.trialIndex,
    blockTrialIndex: input.blockTrialIndex,
    stage: "P0",
    stepId: input.stepId,
    phase: input.phase,
    estimand: input.estimand,
    presentationMode: input.presentationMode,
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
    ratio: input.ratio,
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
    exposureMsRequested: input.exposureMsRequested ?? null,
    signalStaircaseLevel: input.signalStaircaseLevel ?? null,
    replacementOfTrialId: input.replacementOfTrialId ?? null,
  };
}

function blockSpecs(initialArrowMicrocycles: number): BlockSpec[] {
  return [
    {
      id: "p0-signal-anchor",
      stepId: "p0_signal_anchor",
      label: "Check the signal",
      phase: "signal_anchor",
      estimand: "signal_capacity",
      presentationMode: "masked_forced_choice",
      wrapperId: "arrow_abs",
      wrappers: ["arrow_abs"],
      sourceWrapperId: null,
      transitionKind: "baseline_stabilization",
      purpose: "training",
      microcycles: 0,
      fixedTrialCount: CCC_SIGNAL_ANCHOR_VALID_TRIALS,
      strictCarrierTransferBoundary: false,
      diagnostic: true,
      shiftViewBefore: false,
      assistedFirstContact: false,
    },
    {
      id: "p0-arrow-rel-stabilise",
      stepId: "p0_arrow_rel_stabilise",
      label: "Find in and out",
      phase: "arrow_rel_stabilisation",
      estimand: "policy",
      presentationMode: "self_paced_value",
      wrapperId: "arrow_rel",
      wrappers: ["arrow_rel"],
      sourceWrapperId: "arrow_abs",
      transitionKind: "reference_frame_extension",
      purpose: "reference_extension",
      microcycles: initialArrowMicrocycles,
      strictCarrierTransferBoundary: false,
      diagnostic: false,
      shiftViewBefore: false,
      assistedFirstContact: false,
    },
    {
      id: "p0-flow-rel-first-contact",
      stepId: "p0_flow_rel_first_contact",
      label: "Meet expansion and contraction",
      phase: "flow_rel_first_contact",
      estimand: "transfer",
      presentationMode: "self_paced_value",
      wrapperId: "flow_rel",
      wrappers: ["flow_rel"],
      sourceWrapperId: "arrow_rel",
      transitionKind: "carrier_transfer",
      purpose: "carrier_probe",
      microcycles: CCC_P0_BLOCK_MICROCYCLES.flowFirstContact,
      strictCarrierTransferBoundary: true,
      diagnostic: true,
      shiftViewBefore: true,
      assistedFirstContact: true,
    },
    {
      id: "p0-flow-rel-recovery",
      stepId: "p0_flow_rel_recovery",
      label: "Settle into expansion and contraction",
      phase: "flow_rel_recovery",
      estimand: "transfer",
      presentationMode: "self_paced_value",
      wrapperId: "flow_rel",
      wrappers: ["flow_rel"],
      sourceWrapperId: "flow_rel",
      transitionKind: "baseline_stabilization",
      purpose: "recovery",
      microcycles: CCC_P0_BLOCK_MICROCYCLES.flowRecovery,
      strictCarrierTransferBoundary: false,
      diagnostic: false,
      shiftViewBefore: false,
      assistedFirstContact: false,
    },
    {
      id: "p0-arrow-rel-return",
      stepId: "p0_arrow_rel_return",
      label: "Return to radial arrows",
      phase: "arrow_rel_return",
      estimand: "transfer",
      presentationMode: "self_paced_value",
      wrapperId: "arrow_rel",
      wrappers: ["arrow_rel"],
      sourceWrapperId: "flow_rel",
      transitionKind: "carrier_transfer",
      purpose: "return",
      microcycles: CCC_P0_BLOCK_MICROCYCLES.arrowReturn,
      strictCarrierTransferBoundary: false,
      diagnostic: false,
      shiftViewBefore: false,
      assistedFirstContact: false,
    },
    {
      id: "p0-relative-mix",
      stepId: "p0_relative_mix",
      label: "Keep in and out across formats",
      phase: "relative_mix",
      estimand: "transfer",
      presentationMode: "self_paced_value",
      wrapperId: "mixed_rel",
      wrappers: ["arrow_rel", "flow_rel"],
      sourceWrapperId: null,
      transitionKind: "mixed_attention_portability",
      purpose: "mix",
      microcycles: CCC_P0_BLOCK_MICROCYCLES.relativeMix,
      strictCarrierTransferBoundary: false,
      diagnostic: false,
      shiftViewBefore: false,
      assistedFirstContact: false,
    },
  ];
}

function generateSignalAnchorTrials(
  spec: BlockSpec,
  sessionId: string,
  seed: string,
  startingTrialIndex: number,
  regimeId: CccRegimeId,
): CccAttentionTrialDefinition[] {
  const random = mulberry32(hashSeed(`${seed}:${spec.id}`));
  const count = spec.fixedTrialCount || CCC_SIGNAL_ANCHOR_VALID_TRIALS;
  const targets = targetSequence("arrow_abs", random, count);
  const condition = signalConditionForLevel(CCC_SIGNAL_INITIAL_LEVEL);
  return targets.map((targetClass, index) => buildTrial({
    id: `${spec.id}-trial-${String(startingTrialIndex + index + 1).padStart(3, "0")}`,
    sessionId,
    blockId: spec.id,
    trialIndex: startingTrialIndex + index + 1,
    blockTrialIndex: index + 1,
    stepId: spec.stepId,
    phase: spec.phase,
    estimand: spec.estimand,
    presentationMode: spec.presentationMode,
    purpose: spec.purpose,
    wrapperId: "arrow_abs",
    sourceWrapperId: spec.sourceWrapperId,
    transitionKind: spec.transitionKind,
    strictCarrierTransferBoundary: false,
    regimeId,
    microcycleIndex: 0,
    balancedSlotIndex: index + 1,
    targetClass,
    ratio: condition.ratio,
    random,
    seed: `${seed}:${spec.id}:${index + 1}`,
    practice: false,
    diagnostic: true,
    assistedFirstContact: false,
    exposureMsRequested: condition.exposureMs,
    signalStaircaseLevel: CCC_SIGNAL_INITIAL_LEVEL,
  }));
}

export function createP0AttentionCarrierTransferPlan(input: CreateP0AttentionPlanInput = {}): CccSessionPlan {
  const seed = input.seed || input.sessionId || "ccc-p0-session";
  const random = mulberry32(hashSeed(seed));
  const sessionId = input.sessionId || `ccc-p0-${hashSeed(seed).toString(16)}`;
  const planId = input.planId || `${sessionId}:p0`;
  const pairIndex = input.regimePairIndex ?? (hashSeed(seed) % CCC_REGIME_PAIRS.length === 0 ? 0 : 1);
  const basePair = CCC_REGIME_PAIRS[pairIndex];
  const regimePair = (hashSeed(`${seed}:niche-order`) % 2 === 0 ? [...basePair] : [...basePair].reverse()) as [CccRegimeId, CccRegimeId];
  const arrowMicrocycles = input.microcyclesPerWrapper ?? CCC_P0_BLOCK_MICROCYCLES.arrowRelStabilisation;
  const blocks: CccAttentionBlockPlan[] = [];
  const trials: CccAttentionTrialDefinition[] = [];

  blockSpecs(arrowMicrocycles).forEach((spec, blockIndex) => {
    const blockStart = trials.length;
    if (spec.estimand === "signal_capacity") {
      trials.push(...generateSignalAnchorTrials(spec, sessionId, seed, trials.length, regimePair[0]));
    } else {
      for (let microcycleIndex = 1; microcycleIndex <= spec.microcycles; microcycleIndex += 1) {
        for (const regimeId of regimePair) {
          const count = CCC_TRIAL_TIMING.validTrialsPerRegimeMicrocycle;
          const ratios = ratioSequence(regimeId, random);
          const wrappers = spec.wrapperId === "mixed_rel"
            ? shuffle(random, ["arrow_rel", "arrow_rel", "arrow_rel", "flow_rel", "flow_rel", "flow_rel"] as CccWrapperId[])
            : Array<CccWrapperId>(count).fill(spec.wrappers[0]);
          const targets = targetSequence(spec.wrappers[0], random, count);
          for (let slot = 0; slot < count; slot += 1) {
            const wrapperId = wrappers[slot];
            const answerOptions = answersForWrapper(wrapperId);
            const targetClass = answerOptions.includes(targets[slot]) ? targets[slot] : answerOptions[slot % answerOptions.length];
            const trialIndex = trials.length + 1;
            trials.push(buildTrial({
              id: `${spec.id}-trial-${String(trialIndex).padStart(3, "0")}`,
              sessionId,
              blockId: spec.id,
              trialIndex,
              blockTrialIndex: trials.length - blockStart + 1,
              stepId: spec.stepId,
              phase: spec.phase,
              estimand: spec.estimand,
              presentationMode: spec.presentationMode,
              purpose: spec.purpose,
              wrapperId,
              sourceWrapperId: spec.sourceWrapperId,
              transitionKind: spec.transitionKind,
              strictCarrierTransferBoundary: spec.strictCarrierTransferBoundary,
              regimeId,
              microcycleIndex,
              balancedSlotIndex: slot + 1,
              targetClass,
              ratio: ratios[slot],
              random,
              seed: `${seed}:${spec.id}:${microcycleIndex}:${regimeId}:${slot + 1}`,
              practice: false,
              diagnostic: spec.diagnostic,
              assistedFirstContact: spec.assistedFirstContact,
            }));
          }
        }
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
      estimand: spec.estimand,
      presentationMode: spec.presentationMode,
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
  const targets = targetSequence("arrow_abs", random, CCC_P0_PRACTICE_VALID_TRIALS);
  return targets.map((targetClass, index) => buildTrial({
    id: `p0-practice-trial-${index + 1}`,
    sessionId: plan.sessionId,
    blockId: "p0-practice",
    trialIndex: -(index + 1),
    blockTrialIndex: index + 1,
    stepId: "p0_practice",
    phase: "practice",
    estimand: "practice",
    presentationMode: "self_paced_value",
    purpose: "practice",
    wrapperId: "arrow_abs",
    sourceWrapperId: null,
    transitionKind: "baseline_stabilization",
    strictCarrierTransferBoundary: false,
    regimeId: plan.regimePair[index % plan.regimePair.length],
    microcycleIndex: 0,
    balancedSlotIndex: index + 1,
    targetClass,
    ratio: index < 2 ? "5:0" : "4:1",
    random,
    seed: `${plan.sessionId}:practice:${index + 1}`,
    practice: true,
    diagnostic: false,
    assistedFirstContact: false,
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
    estimand: "practice",
    presentationMode: "self_paced_value",
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

export function adaptSignalTrial(
  original: CccAttentionTrialDefinition,
  staircaseLevel: number,
): CccAttentionTrialDefinition {
  const condition = signalConditionForLevel(staircaseLevel);
  const seed = `${original.seed}:adaptive-level:${staircaseLevel}`;
  const random = mulberry32(hashSeed(seed));
  return buildTrial({
    id: original.id,
    sessionId: original.sessionId,
    blockId: original.blockId,
    trialIndex: original.trialIndex,
    blockTrialIndex: original.blockTrialIndex,
    stepId: original.stepId,
    phase: original.phase,
    estimand: original.estimand,
    presentationMode: original.presentationMode,
    purpose: original.purpose,
    wrapperId: original.wrapperId,
    sourceWrapperId: original.sourceWrapperId,
    transitionKind: original.transitionKind,
    strictCarrierTransferBoundary: original.strictCarrierTransferBoundary,
    regimeId: original.regimeId,
    microcycleIndex: original.microcycleIndex,
    balancedSlotIndex: original.balancedSlotIndex,
    targetClass: original.targetClass,
    ratio: condition.ratio,
    random,
    seed,
    practice: original.practice,
    diagnostic: original.diagnostic,
    assistedFirstContact: original.assistedFirstContact,
    exposureMsRequested: condition.exposureMs,
    signalStaircaseLevel: staircaseLevel,
    replacementOfTrialId: original.replacementOfTrialId,
  });
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
    estimand: original.estimand,
    presentationMode: original.presentationMode,
    purpose: original.purpose,
    wrapperId: original.wrapperId,
    sourceWrapperId: original.sourceWrapperId,
    transitionKind: original.transitionKind,
    strictCarrierTransferBoundary: original.strictCarrierTransferBoundary,
    regimeId: original.regimeId,
    microcycleIndex: original.microcycleIndex,
    balancedSlotIndex: original.balancedSlotIndex,
    targetClass: original.targetClass,
    ratio: original.ratio,
    random,
    seed,
    practice: original.practice,
    diagnostic: original.diagnostic,
    assistedFirstContact: original.assistedFirstContact,
    exposureMsRequested: original.exposureMsRequested,
    signalStaircaseLevel: original.signalStaircaseLevel,
    replacementOfTrialId: original.replacementOfTrialId || original.id,
  });
}
