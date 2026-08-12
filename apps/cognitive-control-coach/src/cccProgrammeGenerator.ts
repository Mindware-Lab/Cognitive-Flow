import { OCTAGON_POSITIONS, vectorForRelation } from "./geometry";
import { hashSeed, mulberry32, shuffle } from "./random";
import {
  answersForWrapper,
  CCC_APP_ID,
  CCC_CONFIG_VERSION,
  CCC_PROTOCOL_VERSION,
  CCC_RATIO_MAJORITY_COUNTS,
  CCC_REGIMES,
  CCC_TRIAL_TIMING,
  CCC_WM_RESPONSE_LABELS,
  CCC_WRAPPER_RESPONSE_LABELS,
} from "./cccConfig";
import { carrierForWrapper, referenceFrameForWrapper } from "./cccProgression";
import type {
  CccAttentionAnswer,
  CccAttentionBlockPlan,
  CccAttentionTrialDefinition,
  CccAttentionTrialPurpose,
  CccEstimand,
  CccOperator,
  CccProgrammePhase,
  CccProgrammeSessionKind,
  CccRatio,
  CccRegimeId,
  CccResponseChoice,
  CccSessionPlan,
  CccStageId,
  CccStimulusRelation,
  CccTransitionKind,
  CccWrapperId,
} from "./cccTypes";

type ProgrammePlanInput = {
  sessionId: string;
  seed: string;
  programmeRunId: string;
  programmeSessionNumber: number;
  kind: Exclude<CccProgrammeSessionKind, "p0_foundation">;
  regimePair: readonly [CccRegimeId, CccRegimeId];
  wmLevel: 1 | 2;
  delayedRecheckNotBefore?: string | null;
  includeFirstContact?: boolean;
};

type ProgrammeBlockSpec = {
  id: string;
  stepId: string;
  label: string;
  stage: Exclude<CccStageId, "P0" | "PublicLaunch">;
  operator: CccOperator;
  phase: CccProgrammePhase;
  estimand: Exclude<CccEstimand, "practice" | "signal_capacity">;
  wrapperId: CccWrapperId | "mixed_rel";
  wrappers: readonly CccWrapperId[];
  sourceWrapperId: CccWrapperId | null;
  transitionKind: CccTransitionKind;
  purpose: CccAttentionTrialPurpose;
  diagnostic: boolean;
  shiftViewBefore: boolean;
  strictCarrierTransferBoundary: boolean;
  wmNLevel: 1 | 2 | null;
};

const EASY_RATIO_QUOTA: readonly CccRatio[] = ["5:0", "5:0", "5:0", "4:1", "4:1", "3:2"];
const HARD_RATIO_QUOTA: readonly CccRatio[] = ["5:0", "4:1", "4:1", "3:2", "3:2", "3:2"];
const WM_RELATIONS: readonly CccStimulusRelation[] = ["in", "out", "cw", "ccw"];

function ratiosFor(regimeId: CccRegimeId, random: () => number): CccRatio[] {
  return shuffle(random, [...(CCC_REGIMES[regimeId].ratioPriors["5:0"] > 0.5 ? EASY_RATIO_QUOTA : HARD_RATIO_QUOTA)]);
}

function balancedAttentionTargets(wrapperId: CccWrapperId, random: () => number): CccAttentionAnswer[] {
  const choices = answersForWrapper(wrapperId);
  return shuffle(random, [choices[0], choices[0], choices[0], choices[1], choices[1], choices[1]]);
}

function stimulusItems(
  relation: CccStimulusRelation,
  majorityCount: 3 | 4 | 5,
  random: () => number,
  relationPool: readonly CccStimulusRelation[],
) {
  const foilPool = relationPool.filter((candidate) => candidate !== relation);
  const foil = foilPool[Math.floor(random() * foilPool.length)] || relation;
  const relations = shuffle(random, [
    ...Array<CccStimulusRelation>(majorityCount).fill(relation),
    ...Array<CccStimulusRelation>(5 - majorityCount).fill(foil),
  ]);
  const positions = shuffle(random, Array.from({ length: OCTAGON_POSITIONS.length }, (_, index) => index)).slice(0, 5);
  return positions.map((positionIndex, index) => {
    const position = OCTAGON_POSITIONS[positionIndex];
    return {
      positionIndex,
      position: { x: position.x, y: position.y },
      relation: relations[index],
      vector: vectorForRelation(relations[index] as Parameters<typeof vectorForRelation>[0], position),
    };
  });
}

function createTrial(input: {
  id: string;
  sessionId: string;
  blockId: string;
  trialIndex: number;
  blockTrialIndex: number;
  stage: CccAttentionTrialDefinition["stage"];
  stepId: string;
  phase: CccProgrammePhase;
  operator: CccOperator;
  estimand: CccEstimand;
  purpose: CccAttentionTrialPurpose;
  wrapperId: CccWrapperId;
  sourceWrapperId: CccWrapperId | null;
  transitionKind: CccTransitionKind;
  strictCarrierTransferBoundary: boolean;
  regimeId: CccRegimeId;
  microcycleIndex: number;
  balancedSlotIndex: number;
  ratio: CccRatio;
  targetClass: CccStimulusRelation;
  correctResponse: CccResponseChoice;
  random: () => number;
  seed: string;
  diagnostic: boolean;
  assistedFirstContact: boolean;
  wmNLevel?: 1 | 2 | null;
  wmIsMatch?: boolean | null;
  wmBuffer?: boolean;
  wmLureType?: "none" | "wrong_lag" | null;
}): CccAttentionTrialDefinition {
  const majorityCount = CCC_RATIO_MAJORITY_COUNTS[input.ratio];
  const attentionChoices = input.operator === "attention" ? answersForWrapper(input.wrapperId) : WM_RELATIONS;
  return {
    id: input.id,
    sessionId: input.sessionId,
    blockId: input.blockId,
    trialIndex: input.trialIndex,
    blockTrialIndex: input.blockTrialIndex,
    stage: input.stage,
    stepId: input.stepId,
    phase: input.phase,
    operator: input.operator,
    estimand: input.estimand,
    presentationMode: "self_paced_value",
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
    correctResponse: input.correctResponse,
    answerOptions: input.operator === "attention" ? CCC_WRAPPER_RESPONSE_LABELS[input.wrapperId].answerOptions : CCC_WM_RESPONSE_LABELS.answerOptions,
    responseLabels: input.operator === "attention" ? CCC_WRAPPER_RESPONSE_LABELS[input.wrapperId] : CCC_WM_RESPONSE_LABELS,
    stimulusItems: stimulusItems(input.targetClass, majorityCount, input.random, attentionChoices),
    coherenceNoiseLevel: 0,
    seed: input.seed,
    practice: false,
    diagnostic: input.diagnostic,
    assistedFirstContact: input.assistedFirstContact,
    exposureMsRequested: null,
    signalStaircaseLevel: null,
    wmNLevel: input.wmNLevel ?? null,
    wmIsMatch: input.wmIsMatch ?? null,
    wmBuffer: input.wmBuffer ?? false,
    wmLureType: input.wmLureType ?? null,
    replacementOfTrialId: null,
  };
}

function wrappersFor(spec: ProgrammeBlockSpec, random: () => number): CccWrapperId[] {
  if (spec.wrapperId !== "mixed_rel") return Array<CccWrapperId>(6).fill(spec.wrappers[0]);
  return shuffle(random, ["arrow_rel", "arrow_rel", "arrow_rel", "flow_rel", "flow_rel", "flow_rel"]);
}

function addAttentionBlock(
  plan: Pick<CccSessionPlan, "sessionId" | "regimePair">,
  seed: string,
  spec: ProgrammeBlockSpec,
  blocks: CccAttentionBlockPlan[],
  trials: CccAttentionTrialDefinition[],
): void {
  const random = mulberry32(hashSeed(`${seed}:${spec.id}`));
  const blockStart = trials.length;
  for (const [regimeIndex, regimeId] of plan.regimePair.entries()) {
    const ratios = ratiosFor(regimeId, random);
    const wrappers = wrappersFor(spec, random);
    const targets = balancedAttentionTargets(wrappers[0], random);
    for (let slot = 0; slot < CCC_TRIAL_TIMING.validTrialsPerRegimeMicrocycle; slot += 1) {
      const wrapperId = wrappers[slot];
      const options = answersForWrapper(wrapperId);
      const target = options.includes(targets[slot]) ? targets[slot] : options[slot % 2];
      const trialIndex = trials.length + 1;
      trials.push(createTrial({
        id: `${spec.id}-trial-${String(trialIndex).padStart(3, "0")}`,
        sessionId: plan.sessionId,
        blockId: spec.id,
        trialIndex,
        blockTrialIndex: trials.length - blockStart + 1,
        stage: spec.stage,
        stepId: spec.stepId,
        phase: spec.phase,
        operator: "attention",
        estimand: spec.estimand,
        purpose: spec.purpose,
        wrapperId,
        sourceWrapperId: spec.sourceWrapperId,
        transitionKind: spec.transitionKind,
        strictCarrierTransferBoundary: spec.strictCarrierTransferBoundary,
        regimeId,
        microcycleIndex: regimeIndex + 1,
        balancedSlotIndex: slot + 1,
        ratio: ratios[slot],
        targetClass: target,
        correctResponse: target,
        random,
        seed: `${seed}:${spec.id}:${regimeId}:${slot + 1}`,
        diagnostic: spec.diagnostic,
        assistedFirstContact: spec.diagnostic,
      }));
    }
  }
  blocks.push({
    id: spec.id,
    index: blocks.length + 1,
    stage: spec.stage,
    stepId: spec.stepId,
    label: spec.label,
    operator: "attention",
    phase: spec.phase,
    estimand: spec.estimand,
    presentationMode: "self_paced_value",
    wrapperId: spec.wrapperId,
    wrappers: spec.wrappers,
    sourceWrapperId: spec.sourceWrapperId,
    transitionKind: spec.transitionKind,
    strictCarrierTransferBoundary: spec.strictCarrierTransferBoundary,
    regimePair: plan.regimePair,
    microcycleCount: 1,
    validTrialCount: trials.length - blockStart,
    practice: false,
    diagnostic: spec.diagnostic,
    shiftViewBefore: spec.shiftViewBefore,
    wmNLevel: null,
  });
}

function nextDifferentRelation(random: () => number, excluded: readonly CccStimulusRelation[]): CccStimulusRelation {
  const options = WM_RELATIONS.filter((relation) => !excluded.includes(relation));
  return options[Math.floor(random() * options.length)] || "in";
}

function addWmBlock(
  plan: Pick<CccSessionPlan, "sessionId" | "regimePair">,
  seed: string,
  spec: ProgrammeBlockSpec,
  blocks: CccAttentionBlockPlan[],
  trials: CccAttentionTrialDefinition[],
): void {
  const level = spec.wmNLevel || 1;
  const random = mulberry32(hashSeed(`${seed}:${spec.id}:wm:${level}`));
  const blockStart = trials.length;
  for (const [regimeIndex, regimeId] of plan.regimePair.entries()) {
    const scoredCount = CCC_TRIAL_TIMING.validTrialsPerRegimeMicrocycle;
    const total = scoredCount + level;
    const ratioQuota = ratiosFor(regimeId, random);
    const wrappers = spec.wrapperId === "mixed_rel"
      ? shuffle(random, Array.from({ length: total }, (_, index) => index % 2 ? "flow_rel" : "arrow_rel") as CccWrapperId[])
      : Array<CccWrapperId>(total).fill(spec.wrappers[0]);
    const relations: CccStimulusRelation[] = [];
    const matchSlots = new Set(shuffle(random, Array.from({ length: scoredCount }, (_, index) => index + level)).slice(0, scoredCount / 2));
    for (let slot = 0; slot < total; slot += 1) {
      const isBuffer = slot < level;
      const isMatch = !isBuffer && matchSlots.has(slot);
      const wrongLagFeasible = level === 2 && slot >= 2 && !isMatch;
      const useWrongLag = wrongLagFeasible && random() < 0.25 && relations[slot - 1] !== relations[slot - level];
      const relation = isMatch
        ? relations[slot - level]
        : useWrongLag
          ? relations[slot - 1]
          : nextDifferentRelation(random, slot >= level ? [relations[slot - level]] : []);
      relations.push(relation);
      const ratio = isBuffer ? "5:0" : ratioQuota[slot - level];
      const trialIndex = trials.length + 1;
      trials.push(createTrial({
        id: `${spec.id}-trial-${String(trialIndex).padStart(3, "0")}`,
        sessionId: plan.sessionId,
        blockId: spec.id,
        trialIndex,
        blockTrialIndex: trials.length - blockStart + 1,
        stage: spec.stage,
        stepId: spec.stepId,
        phase: spec.phase,
        operator: "relational_wm",
        estimand: "relational_wm",
        purpose: spec.purpose,
        wrapperId: wrappers[slot],
        sourceWrapperId: spec.sourceWrapperId,
        transitionKind: spec.transitionKind,
        strictCarrierTransferBoundary: spec.strictCarrierTransferBoundary,
        regimeId,
        microcycleIndex: regimeIndex + 1,
        balancedSlotIndex: isBuffer ? 0 : slot - level + 1,
        ratio,
        targetClass: relation,
        correctResponse: isMatch ? "match" : "different",
        random,
        seed: `${seed}:${spec.id}:${regimeId}:${slot + 1}`,
        diagnostic: spec.diagnostic,
        assistedFirstContact: spec.diagnostic,
        wmNLevel: level,
        wmIsMatch: isBuffer ? null : isMatch,
        wmBuffer: isBuffer,
        wmLureType: useWrongLag ? "wrong_lag" : "none",
      }));
    }
  }
  blocks.push({
    id: spec.id,
    index: blocks.length + 1,
    stage: spec.stage,
    stepId: spec.stepId,
    label: spec.label,
    operator: "relational_wm",
    phase: spec.phase,
    estimand: "relational_wm",
    presentationMode: "self_paced_value",
    wrapperId: spec.wrapperId,
    wrappers: spec.wrappers,
    sourceWrapperId: spec.sourceWrapperId,
    transitionKind: spec.transitionKind,
    strictCarrierTransferBoundary: spec.strictCarrierTransferBoundary,
    regimePair: plan.regimePair,
    microcycleCount: 1,
    validTrialCount: CCC_TRIAL_TIMING.validTrialsPerRegimeMicrocycle * plan.regimePair.length,
    practice: false,
    diagnostic: spec.diagnostic,
    shiftViewBefore: spec.shiftViewBefore,
    wmNLevel: level,
  });
}

function p1aSpecs(kind: ProgrammePlanInput["kind"], includeFirstContact = true): ProgrammeBlockSpec[] {
  if (kind === "p1a_delayed_recheck") {
    return [
      { id: "p1a-delayed-recheck", stepId: "p1a_delayed_relative_mix", label: "Fresh return check", stage: "P1a", operator: "attention", phase: "p1a_delayed_recheck", estimand: "transfer", wrapperId: "mixed_rel", wrappers: ["arrow_rel", "flow_rel"], sourceWrapperId: null, transitionKind: "mixed_attention_portability", purpose: "delayed_recheck", diagnostic: true, shiftViewBefore: false, strictCarrierTransferBoundary: false, wmNLevel: null },
      { id: "p1a-flow-recovery", stepId: "p1a_recovery", label: "Recover motion", stage: "P1a", operator: "attention", phase: "p1a_flow_recovery", estimand: "transfer", wrapperId: "flow_rel", wrappers: ["flow_rel"], sourceWrapperId: "flow_rel", transitionKind: "baseline_stabilization", purpose: "recovery", diagnostic: false, shiftViewBefore: false, strictCarrierTransferBoundary: false, wmNLevel: null },
      { id: "p1a-arrow-return", stepId: "p1a_return", label: "Protect the familiar rule", stage: "P1a", operator: "attention", phase: "p1a_arrow_return", estimand: "transfer", wrapperId: "arrow_rel", wrappers: ["arrow_rel"], sourceWrapperId: "flow_rel", transitionKind: "carrier_transfer", purpose: "return", diagnostic: false, shiftViewBefore: false, strictCarrierTransferBoundary: false, wmNLevel: null },
    ];
  }
  const specs: ProgrammeBlockSpec[] = [
    { id: "p1a-arrow-stabilise", stepId: "p1a_arrow_stabilise", label: "Stabilise the relative rule", stage: "P1a", operator: "attention", phase: "p1a_arrow_stabilisation", estimand: "policy", wrapperId: "arrow_rel", wrappers: ["arrow_rel"], sourceWrapperId: "arrow_rel", transitionKind: "baseline_stabilization", purpose: "training", diagnostic: false, shiftViewBefore: false, strictCarrierTransferBoundary: false, wmNLevel: null },
    { id: "p1a-flow-first-contact", stepId: "p1a_held_out_relative_recheck", label: "Protected motion check", stage: "P1a", operator: "attention", phase: "p1a_flow_first_contact", estimand: "transfer", wrapperId: "flow_rel", wrappers: ["flow_rel"], sourceWrapperId: "arrow_rel", transitionKind: "carrier_transfer", purpose: "carrier_probe", diagnostic: true, shiftViewBefore: true, strictCarrierTransferBoundary: true, wmNLevel: null },
    { id: "p1a-flow-recovery", stepId: "p1a_recovery", label: "Recover motion", stage: "P1a", operator: "attention", phase: "p1a_flow_recovery", estimand: "transfer", wrapperId: "flow_rel", wrappers: ["flow_rel"], sourceWrapperId: "flow_rel", transitionKind: "baseline_stabilization", purpose: "recovery", diagnostic: false, shiftViewBefore: false, strictCarrierTransferBoundary: false, wmNLevel: null },
    { id: "p1a-arrow-return", stepId: "p1a_return", label: "Protect the familiar rule", stage: "P1a", operator: "attention", phase: "p1a_arrow_return", estimand: "transfer", wrapperId: "arrow_rel", wrappers: ["arrow_rel"], sourceWrapperId: "flow_rel", transitionKind: "carrier_transfer", purpose: "return", diagnostic: false, shiftViewBefore: false, strictCarrierTransferBoundary: false, wmNLevel: null },
    { id: "p1a-relative-mix", stepId: "p1a_mix", label: "Stabilise across formats", stage: "P1a", operator: "attention", phase: "p1a_relative_mix", estimand: "transfer", wrapperId: "mixed_rel", wrappers: ["arrow_rel", "flow_rel"], sourceWrapperId: null, transitionKind: "mixed_attention_portability", purpose: "mix", diagnostic: false, shiftViewBefore: false, strictCarrierTransferBoundary: false, wmNLevel: null },
  ];
  return includeFirstContact ? specs : specs.filter((spec) => spec.phase !== "p1a_flow_first_contact");
}

function p1bSpecs(level: 1 | 2): ProgrammeBlockSpec[] {
  return [
    { id: "p1b-attention-bridge", stepId: "p1b_attention_bridge", label: "Find the current relation", stage: "P1b", operator: "attention", phase: "p1b_attention_bridge", estimand: "policy", wrapperId: "arrow_rel", wrappers: ["arrow_rel"], sourceWrapperId: "arrow_rel", transitionKind: "baseline_stabilization", purpose: "training", diagnostic: false, shiftViewBefore: false, strictCarrierTransferBoundary: false, wmNLevel: null },
    { id: "p1b-wm-arrow-stabilise", stepId: "p1b_wm_arrow_rel_intro", label: `Hold the relation · ${level}-back`, stage: "P1b", operator: "relational_wm", phase: "p1b_wm_arrow_stabilisation", estimand: "relational_wm", wrapperId: "arrow_rel", wrappers: ["arrow_rel"], sourceWrapperId: "arrow_rel", transitionKind: "wm_introduction", purpose: "wm_training", diagnostic: false, shiftViewBefore: false, strictCarrierTransferBoundary: false, wmNLevel: level },
    { id: "p1b-wm-flow-first-contact", stepId: "p1b_wm_flow_rel_transfer", label: "First memory check in motion", stage: "P1b", operator: "relational_wm", phase: "p1b_wm_flow_first_contact", estimand: "relational_wm", wrapperId: "flow_rel", wrappers: ["flow_rel"], sourceWrapperId: "arrow_rel", transitionKind: "wm_carrier_transfer", purpose: "wm_carrier_probe", diagnostic: true, shiftViewBefore: true, strictCarrierTransferBoundary: true, wmNLevel: level },
    { id: "p1b-wm-flow-recovery", stepId: "p1b_wm_flow_recovery", label: "Recover the held relation", stage: "P1b", operator: "relational_wm", phase: "p1b_wm_flow_recovery", estimand: "relational_wm", wrapperId: "flow_rel", wrappers: ["flow_rel"], sourceWrapperId: "flow_rel", transitionKind: "baseline_stabilization", purpose: "wm_recovery", diagnostic: false, shiftViewBefore: false, strictCarrierTransferBoundary: false, wmNLevel: level },
    { id: "p1b-wm-arrow-return", stepId: "p1b_wm_arrow_return", label: "Return with the relation", stage: "P1b", operator: "relational_wm", phase: "p1b_wm_arrow_return", estimand: "relational_wm", wrapperId: "arrow_rel", wrappers: ["arrow_rel"], sourceWrapperId: "flow_rel", transitionKind: "wm_carrier_transfer", purpose: "wm_return", diagnostic: false, shiftViewBefore: false, strictCarrierTransferBoundary: false, wmNLevel: level },
    { id: "p1b-wm-relative-mix", stepId: "p1b_wm_relative_mix", label: "Hold across arrows and motion", stage: "P1b", operator: "relational_wm", phase: "p1b_wm_relative_mix", estimand: "relational_wm", wrapperId: "mixed_rel", wrappers: ["arrow_rel", "flow_rel"], sourceWrapperId: null, transitionKind: "operator_integration", purpose: "wm_mix", diagnostic: false, shiftViewBefore: false, strictCarrierTransferBoundary: false, wmNLevel: level },
  ];
}

function p1cSpecs(kind: ProgrammePlanInput["kind"], sessionNumber: number, level: 1 | 2): ProgrammeBlockSpec[] {
  const wrapper: CccWrapperId = sessionNumber % 2 === 0 ? "arrow_rel" : "flow_rel";
  const carrierLabel = wrapper === "arrow_rel" ? "arrows" : "motion";
  const delayed = kind === "p1c_delayed_integration";
  return [
    { id: delayed ? "p1c-delayed-reentry" : "p1c-attention-entry", stepId: delayed ? "p1c_delayed_reentry" : "p1c_attention_entry", label: delayed ? "Fresh re-entry after time away" : `Read the present in ${carrierLabel}`, stage: "P1c", operator: "attention", phase: delayed ? "p1c_delayed_reentry" : "p1c_attention_entry", estimand: "transfer", wrapperId: wrapper, wrappers: [wrapper], sourceWrapperId: wrapper, transitionKind: "return_to_now", purpose: delayed ? "delayed_recheck" : "return_to_now", diagnostic: delayed, shiftViewBefore: false, strictCarrierTransferBoundary: false, wmNLevel: null },
    { id: "p1c-wm-hold", stepId: "p1c_wm_hold", label: `Hold the relation · ${level}-back`, stage: "P1c", operator: "relational_wm", phase: "p1c_wm_hold", estimand: "relational_wm", wrapperId: wrapper, wrappers: [wrapper], sourceWrapperId: wrapper, transitionKind: "operator_integration", purpose: "wm_training", diagnostic: false, shiftViewBefore: false, strictCarrierTransferBoundary: false, wmNLevel: level },
    { id: "p1c-attention-reentry", stepId: "p1c_return_to_now_attention", label: "Return to what is here now", stage: "P1c", operator: "attention", phase: "p1c_attention_reentry", estimand: "transfer", wrapperId: wrapper, wrappers: [wrapper], sourceWrapperId: wrapper, transitionKind: "return_to_now", purpose: "return_to_now", diagnostic: false, shiftViewBefore: false, strictCarrierTransferBoundary: false, wmNLevel: null },
    { id: "p1c-operator-mix", stepId: "p1c_cued_operator_miniblocks", label: "Switch the operation, keep the format", stage: "P1c", operator: "relational_wm", phase: "p1c_operator_mix", estimand: "relational_wm", wrapperId: wrapper, wrappers: [wrapper], sourceWrapperId: wrapper, transitionKind: "operator_integration", purpose: "operator_integration", diagnostic: false, shiftViewBefore: false, strictCarrierTransferBoundary: false, wmNLevel: level },
  ];
}

export function createProgrammeSessionPlan(input: ProgrammePlanInput): CccSessionPlan {
  const stage = input.kind.startsWith("p1a") ? "P1a" : input.kind.startsWith("p1b") ? "P1b" : "P1c";
  const sessionType = stage === "P1a" ? "portability_check" : stage === "P1b" ? "wm_bridge" : "return_to_now";
  const specs = stage === "P1a" ? p1aSpecs(input.kind, input.includeFirstContact ?? true) : stage === "P1b" ? p1bSpecs(input.wmLevel) : p1cSpecs(input.kind, input.programmeSessionNumber, input.wmLevel);
  const plan: CccSessionPlan = {
    planId: `${input.sessionId}:${input.kind}`,
    appId: CCC_APP_ID,
    protocolVersion: CCC_PROTOCOL_VERSION,
    configVersion: CCC_CONFIG_VERSION,
    sessionId: input.sessionId,
    sessionType,
    stage,
    operator: stage === "P1a" ? "attention" : "integrated",
    programmeRunId: input.programmeRunId,
    programmeSessionNumber: input.programmeSessionNumber,
    programmeSessionKind: input.kind,
    delayedRecheckNotBefore: input.delayedRecheckNotBefore ?? null,
    regimePair: input.regimePair,
    shiftViewEligible: specs.some((spec) => spec.shiftViewBefore),
    blocks: [],
    trials: [],
  };
  for (const spec of specs) {
    if (spec.operator === "attention") addAttentionBlock(plan, input.seed, spec, plan.blocks, plan.trials);
    else addWmBlock(plan, input.seed, spec, plan.blocks, plan.trials);
  }
  return plan;
}
