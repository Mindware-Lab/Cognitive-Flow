export type MarketMode =
  | "general"
  | "exam"
  | "college"
  | "professional"
  | "longevity"
  | "psychometric";

export type ReadinessBand = "strong" | "moderate" | "weak" | "critical";

export interface TransferProfileInput {
  bandwidthReadiness: number;
  frameMemoryReadiness: number;
  pathPredictionReadiness: number;
  reasoningTransferReadiness: number;
  srLureResistance: number;
  reasoningLureResistance: number;
}

export interface TransferProfile extends TransferProfileInput {
  lureResistance: number;
  transferReadiness: number;
  likelyBottleneck: string | null;
}

export interface DemoLayerResult {
  layer: "bandwidth" | "frame_memory" | "path_prediction" | "reasoning_transfer";
  score: number;
  metrics: Record<string, number | string | null>;
}

export interface DemoSession {
  sessionId: string;
  startedAt: string;
  completedAt: string;
  selectedMarketMode: MarketMode;
  layerResults: DemoLayerResult[];
  transferReadiness: number;
  likelyBottleneck: string | null;
}

export const MARKET_LABELS: Record<MarketMode, string> = {
  general: "General demo",
  exam: "Exam readiness",
  college: "College performance",
  professional: "High-pressure professional",
  longevity: "Cognitive longevity",
  psychometric: "Psychometric / job-test preparation",
};

export const MARKET_METRIC_LABELS: Record<
  MarketMode,
  {
    bandwidth: string;
    frame: string;
    memory: string;
    prediction: string;
    reasoning: string;
  }
> = {
  general: {
    bandwidth: "Evidence extraction",
    frame: "Relational extraction",
    memory: "Relation maintenance",
    prediction: "Future-state prediction",
    reasoning: "Explicit relation use",
  },
  exam: {
    bandwidth: "Timed focus",
    frame: "Question-rule framing",
    memory: "Holding rules in mind",
    prediction: "Seeing what follows",
    reasoning: "Novel exam wording",
  },
  college: {
    bandwidth: "Study focus",
    frame: "Problem framing",
    memory: "Holding concepts active",
    prediction: "Following implications",
    reasoning: "Reasoning across new examples",
  },
  professional: {
    bandwidth: "Signal extraction",
    frame: "Constraint framing",
    memory: "Constraint tracking",
    prediction: "Anticipating consequences",
    reasoning: "Decision logic",
  },
  longevity: {
    bandwidth: "Processing sharpness",
    frame: "Flexible attention",
    memory: "Keeping track of changes",
    prediction: "Pattern anticipation",
    reasoning: "Flexible rule use",
  },
  psychometric: {
    bandwidth: "Speeded extraction",
    frame: "Abstract frame use",
    memory: "Rule maintenance",
    prediction: "Matrix-style continuation",
    reasoning: "Logic / abstract reasoning",
  },
};

export const MARKET_INTERPRETATIONS: Record<MarketMode, string> = {
  general:
    "You are building a path from fast evidence extraction to explicit reasoning transfer.",
  exam:
    "This profile shows how timed focus, problem prediction and reasoning recovery combine under unfamiliar exam wording.",
  college:
    "This profile shows how study focus develops into holding, predicting and applying relations across new material.",
  professional:
    "This profile shows how signal extraction develops into downstream consequence prediction and decision logic.",
  longevity:
    "This profile shows flexible rule use alongside relation memory, pattern anticipation and lure resistance.",
  psychometric:
    "This profile shows how speeded extraction supports abstract continuation, rule maintenance and logic.",
};

export function readinessBand(score: number): ReadinessBand {
  if (score >= 80) return "strong";
  if (score >= 60) return "moderate";
  if (score >= 40) return "weak";
  return "critical";
}

export function computeTransferProfile(
  input: TransferProfileInput,
): TransferProfile {
  const lureResistance = Math.round(
    (input.srLureResistance + input.reasoningLureResistance) / 2,
  );
  const transferReadiness = Math.round(
    0.2 * input.bandwidthReadiness +
      0.2 * input.frameMemoryReadiness +
      0.25 * input.pathPredictionReadiness +
      0.25 * input.reasoningTransferReadiness +
      0.1 * lureResistance,
  );
  const layers = [
    ["Frame Memory", input.frameMemoryReadiness, input.bandwidthReadiness],
    [
      "Path Prediction",
      input.pathPredictionReadiness,
      input.frameMemoryReadiness,
    ],
    [
      "Reasoning Transfer",
      input.reasoningTransferReadiness,
      input.pathPredictionReadiness,
    ],
  ] as const;
  const bottleneck = layers.find(
    ([, current, previous]) => current < 60 && previous >= 70,
  );

  return {
    ...input,
    lureResistance,
    transferReadiness,
    likelyBottleneck: bottleneck ? bottleneck[0] : null,
  };
}
