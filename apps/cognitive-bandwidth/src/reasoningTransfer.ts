export type ReasoningAnswer = "valid" | "invalid" | "cannot_tell";
export type ReasoningWrapper = "symbolic" | "nonsense_semantic";
export type ReasoningOperation =
  | "transitivity"
  | "identity"
  | "identity_transitivity";

export interface ReasoningItem {
  id: string;
  wrapper: ReasoningWrapper;
  family: "order_chain";
  operations: ReasoningOperation[];
  lureType?:
    | "shared_lower_anchor"
    | "wrong_identity"
    | "reversed_relation";
  premises: string[];
  conclusion: string;
  correctAnswer: ReasoningAnswer;
  difficulty: 1 | 2 | 3;
  linkedSrStructure: "A_B_C" | "D_B_C" | "mixed";
  feedback: string;
}

export interface ReasoningOutcome {
  item: ReasoningItem;
  answer: ReasoningAnswer | null;
  correct: boolean;
  rtMs: number;
}

export interface ReasoningMetrics {
  accuracy: number;
  transitivityAccuracy: number;
  identityAccuracy: number;
  lureResistance: number;
  nonsenseWrapperAccuracy: number;
  meanRt: number | null;
  srToReasoningRecovery: number;
  reasoningTransferReadiness: number;
}

export const REASONING_ITEMS: readonly ReasoningItem[] = [
  {
    id: "symbolic-transitive-valid",
    wrapper: "symbolic",
    family: "order_chain",
    operations: ["transitivity"],
    premises: ["A > B.", "B > C."],
    conclusion: "Therefore, A > C.",
    correctAnswer: "valid",
    difficulty: 1,
    linkedSrStructure: "A_B_C",
    feedback: "Correct - same relation, new surface.",
  },
  {
    id: "symbolic-reversed-invalid",
    wrapper: "symbolic",
    family: "order_chain",
    operations: ["transitivity"],
    lureType: "reversed_relation",
    premises: ["A > B.", "B > C."],
    conclusion: "Therefore, C > A.",
    correctAnswer: "invalid",
    difficulty: 1,
    linkedSrStructure: "A_B_C",
    feedback: "The conclusion reverses the relation.",
  },
  {
    id: "symbolic-identity-valid",
    wrapper: "symbolic",
    family: "order_chain",
    operations: ["identity"],
    premises: ["D = A.", "A > B."],
    conclusion: "Therefore, D > B.",
    correctAnswer: "valid",
    difficulty: 2,
    linkedSrStructure: "D_B_C",
    feedback: "Correct - identity preserves A's role.",
  },
  {
    id: "symbolic-shared-anchor-lure",
    wrapper: "symbolic",
    family: "order_chain",
    operations: ["transitivity"],
    lureType: "shared_lower_anchor",
    premises: ["A > B.", "C > B."],
    conclusion: "Therefore, A > C.",
    correctAnswer: "cannot_tell",
    difficulty: 2,
    linkedSrStructure: "mixed",
    feedback: "Good catch - the premises do not tell us that.",
  },
  {
    id: "nonsense-transitive-valid",
    wrapper: "nonsense_semantic",
    family: "order_chain",
    operations: ["transitivity"],
    premises: [
      "The dax is higher than the norr.",
      "The norr is higher than the vemp.",
    ],
    conclusion: "Therefore, the dax is higher than the vemp.",
    correctAnswer: "valid",
    difficulty: 2,
    linkedSrStructure: "A_B_C",
    feedback: "Correct - same relation, new surface.",
  },
  {
    id: "nonsense-identity-transitive-valid",
    wrapper: "nonsense_semantic",
    family: "order_chain",
    operations: ["identity_transitivity"],
    premises: [
      "The lome has the same rank as the dax.",
      "The dax is higher than the norr.",
      "The norr is higher than the vemp.",
    ],
    conclusion: "Therefore, the lome is higher than the vemp.",
    correctAnswer: "valid",
    difficulty: 3,
    linkedSrStructure: "D_B_C",
    feedback: "Correct - identity and the chain support the conclusion.",
  },
  {
    id: "nonsense-shared-anchor-lure",
    wrapper: "nonsense_semantic",
    family: "order_chain",
    operations: ["transitivity"],
    lureType: "shared_lower_anchor",
    premises: [
      "The dax is higher than the norr.",
      "The vemp is higher than the norr.",
    ],
    conclusion: "Therefore, the dax is higher than the vemp.",
    correctAnswer: "cannot_tell",
    difficulty: 2,
    linkedSrStructure: "mixed",
    feedback: "Good catch - the premises do not tell us that.",
  },
  {
    id: "nonsense-wrong-identity-lure",
    wrapper: "nonsense_semantic",
    family: "order_chain",
    operations: ["identity"],
    lureType: "wrong_identity",
    premises: [
      "The lome has the same rank as the dax.",
      "The norr is higher than the vemp.",
    ],
    conclusion: "Therefore, the lome is higher than the vemp.",
    correctAnswer: "cannot_tell",
    difficulty: 3,
    linkedSrStructure: "mixed",
    feedback: "The identity statement does not connect lome to norr.",
  },
];

function accuracy(outcomes: readonly ReasoningOutcome[]): number {
  if (!outcomes.length) return 0;
  return outcomes.filter((outcome) => outcome.correct).length / outcomes.length;
}

export function scoreReasoning(
  outcomes: readonly ReasoningOutcome[],
  pathPredictionReadiness: number,
): ReasoningMetrics {
  const transitivity = outcomes.filter((outcome) =>
    outcome.item.operations.some((operation) =>
      operation.includes("transitivity"),
    ),
  );
  const identity = outcomes.filter((outcome) =>
    outcome.item.operations.some((operation) => operation.includes("identity")),
  );
  const lures = outcomes.filter((outcome) => Boolean(outcome.item.lureType));
  const nonsense = outcomes.filter(
    (outcome) => outcome.item.wrapper === "nonsense_semantic",
  );
  const correctRts = outcomes
    .filter((outcome) => outcome.correct)
    .map((outcome) => outcome.rtMs);
  const meanRt = correctRts.length
    ? correctRts.reduce((total, value) => total + value, 0) / correctRts.length
    : null;
  const overallAccuracy = accuracy(outcomes);
  const identityAccuracy = accuracy(identity);
  const lureResistance = accuracy(lures);
  const nonsenseWrapperAccuracy = accuracy(nonsense);
  const rtQuality = Math.max(
    0,
    Math.min(1, 1 - (((meanRt ?? 15000) - 5000) / 10000)),
  );
  const readiness =
    0.35 * overallAccuracy +
    0.2 * identityAccuracy +
    0.2 * lureResistance +
    0.15 * nonsenseWrapperAccuracy +
    0.1 * rtQuality;
  const reasoningTransferReadiness = Math.round(readiness * 100);
  const pathScore = pathPredictionReadiness / 100;
  const srToReasoningRecovery = Math.round(
    100 *
      (0.5 * readiness +
        0.3 * pathScore +
        0.2 * Math.min(readiness, pathScore)),
  );

  return {
    accuracy: overallAccuracy,
    transitivityAccuracy: accuracy(transitivity),
    identityAccuracy,
    lureResistance,
    nonsenseWrapperAccuracy,
    meanRt,
    srToReasoningRecovery,
    reasoningTransferReadiness,
  };
}
