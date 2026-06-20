import "./styles.css";
import { CAPACITY_RESPONSE_WINDOW_MS } from "./capacityModel";
import { generateTrial } from "./generator";
import {
  arrowPolygonPoints,
  diamondPolygonPoints,
  vectorAngleDegrees,
  OCTAGON_POSITIONS,
} from "./geometry";
import { hashSeed, mulberry32 } from "./random";
import {
  RELATIONAL_NBACK_DISPLAY_MS,
  RELATIONAL_NBACK_RESPONSE_MS,
  classifyRelationalNBackResponse,
  generateRelationalNBackBlock,
  relationalNBackLabel,
  summarizeRelationalNBack,
} from "./relationalNBack";
import {
  OPTIC_FLOW_STATES,
  generateSrBlock,
  scoreSrBlock,
} from "./srPathPrediction";
import {
  REASONING_ITEMS,
  scoreReasoning,
} from "./reasoningTransfer";
import {
  MARKET_INTERPRETATIONS,
  MARKET_LABELS,
  MARKET_METRIC_LABELS,
  computeTransferProfile,
  readinessBand,
} from "./transferReadiness";
import { chooseNextCondition, estimateCapacity } from "./scoring";
import { loadRuns, saveDemoSession, saveRun } from "./storage";
import { submitPartnerFeedback } from "./supabaseClient";
import { runTimingCheck, waitFrames } from "./timing";
import type {
  CapacityEstimate,
  Category,
  StoredPrototypeRun,
  TimingCheck,
  TrialDefinition,
  TrialResult,
  WrapperId,
} from "./types";
import type {
  RelationalNBackLevel,
  RelationalNBackOutcome,
  RelationalNBackTrial,
} from "./relationalNBack";
import type {
  SrEvent,
  SrMetrics,
  SrOutcome,
  SrResponse,
  SrStateId,
} from "./srPathPrediction";
import type {
  ReasoningAnswer,
  ReasoningItem,
  ReasoningMetrics,
  ReasoningOutcome,
} from "./reasoningTransfer";
import type {
  MarketMode,
  ReadinessBand,
  TransferProfile,
} from "./transferReadiness";

type PathwayCheckpoint =
  | "intro"
  | "direction"
  | "bandwidth"
  | "memory"
  | "prediction"
  | "recovery";

type Phase =
  | "splash"
  | "welcome"
  | "scope"
  | "consent"
  | "science"
  | "timing"
  | "preferences"
  | "direction-tutorial"
  | "task"
  | "frame-tutorial"
  | "nback-intro"
  | "nback-task"
  | "nback-transition"
  | "nback-summary"
  | "sr-intro"
  | "sr-task"
  | "sr-summary"
  | "reasoning-intro"
  | "reasoning-task"
  | "transfer-check"
  | "dashboard"
  | "results"
  | "result-guidance"
  | "partner-outputs"
  | "pathway"
  | "feedback-details"
  | "thanks";

type TaskStage = "ready" | "fixation" | "stimulus" | "mask" | "response" | "feedback";
type DemoMode = "transfer-stack" | "exam-resilience";

interface AppState {
  demoMode: DemoMode;
  phase: Phase;
  consentedTelemetry: boolean;
  timing: TimingCheck | null;
  timingRunning: boolean;
  soundEnabled: boolean;
  wrapper: WrapperId | null;
  taskStage: TaskStage;
  currentTrial: TrialDefinition | null;
  currentCorrect: boolean | null;
  taskIndex: number;
  taskTotal: number;
  directionResults: TrialResult[];
  frameResults: TrialResult[];
  directionEstimate: CapacityEstimate | null;
  frameEstimate: CapacityEstimate | null;
  nBackLevel: RelationalNBackLevel;
  nBackTrials: RelationalNBackTrial[];
  nBackIndex: number;
  nBackStimulusVisible: boolean;
  nBackAcceptingResponse: boolean;
  nBackResponseCaptured: boolean;
  nBackTrialStartedAt: number;
  nBackResponseRtMs: number | null;
  nBackFeedback: string;
  nBackOutcomes1: RelationalNBackOutcome[];
  nBackOutcomes2: RelationalNBackOutcome[];
  selectedMarketMode: MarketMode;
  pathwayCheckpoint: PathwayCheckpoint;
  srEvents: SrEvent[];
  srIndex: number;
  srStage: "current" | "transition" | "probe" | "feedback";
  srAcceptingResponse: boolean;
  srResponse: SrResponse | null;
  srEventStartedAt: number;
  srOutcomes: SrOutcome[];
  srMetrics: SrMetrics | null;
  reasoningIndex: number;
  reasoningAcceptingResponse: boolean;
  reasoningFeedback: string;
  reasoningOutcomes: ReasoningOutcome[];
  reasoningMetrics: ReasoningMetrics | null;
  reasoningItemStartedAt: number;
  sessionStartedAt: string;
  skippedTasks: Set<"direction" | "frame" | "nback" | "sr" | "reasoning">;
  sessionSeed: string;
  statusMessage: string;
  feedbackSubmitted: boolean;
  feedbackDraft: {
    fit: string;
    evidence: string;
    interest: string;
    email: string;
  };
  runs: StoredPrototypeRun[];
}

const app = document.getElementById("app")!;

function initialDemoMode(): DemoMode {
  const params = new URLSearchParams(window.location.search);
  return params.get("demo") === "exam-resilience"
    ? "exam-resilience"
    : "transfer-stack";
}

const START_DEMO_MODE = initialDemoMode();

function isExamResilienceDemo(): boolean {
  return state.demoMode === "exam-resilience";
}

const state: AppState = {
  demoMode: START_DEMO_MODE,
  phase: "splash",
  consentedTelemetry: false,
  timing: null,
  timingRunning: false,
  soundEnabled: false,
  wrapper: null,
  taskStage: "ready",
  currentTrial: null,
  currentCorrect: null,
  taskIndex: 0,
  taskTotal: START_DEMO_MODE === "exam-resilience" ? 6 : 18,
  directionResults: [],
  frameResults: [],
  directionEstimate: null,
  frameEstimate: null,
  nBackLevel: 1,
  nBackTrials: [],
  nBackIndex: 0,
  nBackStimulusVisible: false,
  nBackAcceptingResponse: false,
  nBackResponseCaptured: false,
  nBackTrialStartedAt: 0,
  nBackResponseRtMs: null,
  nBackFeedback: "",
  nBackOutcomes1: [],
  nBackOutcomes2: [],
  selectedMarketMode: START_DEMO_MODE === "exam-resilience" ? "exam" : "general",
  pathwayCheckpoint: "intro",
  srEvents: [],
  srIndex: 0,
  srStage: "current",
  srAcceptingResponse: false,
  srResponse: null,
  srEventStartedAt: 0,
  srOutcomes: [],
  srMetrics: null,
  reasoningIndex: 0,
  reasoningAcceptingResponse: false,
  reasoningFeedback: "",
  reasoningOutcomes: [],
  reasoningMetrics: null,
  reasoningItemStartedAt: 0,
  sessionStartedAt: new Date().toISOString(),
  skippedTasks: new Set(),
  sessionSeed: createSessionSeed(),
  statusMessage: "",
  feedbackSubmitted: false,
  feedbackDraft: {
    fit: "",
    evidence: "",
    interest: "",
    email: "",
  },
  runs: loadRuns(),
};

let responseResolver: ((response: Category | null) => void) | null = null;
let responseStartedAt = 0;
let srResponseResolver: ((response: SrResponse) => void) | null = null;
let reasoningTimer = 0;
let activeTaskRun = 0;

function createSessionSeed(): string {
  const values = new Uint32Array(4);
  crypto.getRandomValues(values);
  return Array.from(values, (value) => value.toString(16).padStart(8, "0")).join("");
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function categories(wrapper: WrapperId): [Category, Category] {
  return wrapper === "abs_lr" ? ["left", "right"] : ["out", "in"];
}

function categoryLabel(category: Category): string {
  return category[0].toUpperCase() + category.slice(1);
}

function responseButtonContent(category: Category, key: "left" | "right"): string {
  const symbol = key === "left" ? "&larr;" : "&rarr;";
  const keyLabel = key === "left" ? "Left arrow key" : "Right arrow key";
  return `<span>${categoryLabel(category)}</span><kbd aria-label="${keyLabel}">${symbol}</kbd>`;
}

function header(title: string, subtitle = "Partner evaluation prototype", backAction = ""): string {
  return `
    <header class="app-header">
      ${
        backAction
          ? `<button class="ui-icon-button ui-back-button" data-action="${backAction}" aria-label="Go back">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M15 5 8 12l7 7M8.5 12H20" />
              </svg>
              <span>Back</span>
            </button>`
          : `<span aria-hidden="true"></span>`
      }
      <div>
        <p class="app-title">${escapeHtml(title)}</p>
        <p class="app-subtitle">${escapeHtml(subtitle)}</p>
      </div>
      <button class="ui-icon-button ui-sound-button" data-action="toggle-sound" aria-label="Toggle sound">
        ${state.soundEnabled ? "Sound" : "Muted"}
      </button>
    </header>
  `;
}

function shell(content: string, options: { title?: string; subtitle?: string; back?: string; task?: boolean } = {}): string {
  return `
    <div class="app-root">
      <div class="app-shell ${options.task ? "is-task" : ""}">
        <section class="app-screen ${options.task ? "task-screen" : ""}">
          ${options.title ? header(options.title, options.subtitle, options.back) : ""}
          ${content}
        </section>
      </div>
    </div>
  `;
}

function button(label: string, action: string, kind = "primary", extra = ""): string {
  return `<button class="ui-button ui-button-${kind}" data-action="${action}" ${extra}>${label}</button>`;
}

function skipTaskButton(): string {
  return `
    <button class="task-skip-button" data-action="skip-current-test">
      Skip this test
      <span aria-hidden="true">&rarr;</span>
    </button>
  `;
}

function infoRow(index: string, title: string, body: string): string {
  return `
    <div class="info-row">
      <span class="info-index">${index}</span>
      <div><strong>${title}</strong><p>${body}</p></div>
    </div>
  `;
}

const BENEFIT_CHIPS = [
  "AI-skills support",
  "Employability",
  "Study performance",
  "Graduate development",
  "Evidence checking",
  "Transferable problem solving",
];

const EXAM_REASONING_ITEMS: readonly ReasoningItem[] = [
  {
    id: "exam-nonsense-transitive-valid",
    wrapper: "nonsense_semantic",
    family: "order_chain",
    operations: ["transitivity"],
    premises: [
      "Every dax is above a mip.",
      "Every mip is above a lorn.",
    ],
    conclusion: "Therefore, every dax is above a lorn.",
    correctAnswer: "valid",
    difficulty: 1,
    linkedSrStructure: "A_B_C",
    feedback: "Correct - the relation carries through the chain.",
  },
  {
    id: "exam-nonsense-reversed-invalid",
    wrapper: "nonsense_semantic",
    family: "order_chain",
    operations: ["transitivity"],
    lureType: "reversed_relation",
    premises: [
      "A nalo is inside every vesh.",
      "A vesh is inside every tarm.",
    ],
    conclusion: "Therefore, a tarm is inside a nalo.",
    correctAnswer: "invalid",
    difficulty: 1,
    linkedSrStructure: "A_B_C",
    feedback: "Correct - the conclusion reverses the relation.",
  },
  {
    id: "exam-nonsense-identity-valid",
    wrapper: "nonsense_semantic",
    family: "order_chain",
    operations: ["identity"],
    premises: [
      "If a glim is paired with a roven, choose path K.",
      "This trial shows a glim paired with a roven.",
    ],
    conclusion: "Therefore, path K follows.",
    correctAnswer: "valid",
    difficulty: 2,
    linkedSrStructure: "A_B_C",
    feedback: "Correct - the same pairing rule applies.",
  },
  {
    id: "exam-nonsense-shared-anchor-cannot-tell",
    wrapper: "nonsense_semantic",
    family: "order_chain",
    operations: ["transitivity"],
    lureType: "shared_lower_anchor",
    premises: [
      "Fep is higher than jund.",
      "Marl is higher than jund.",
    ],
    conclusion: "Therefore, fep is higher than marl.",
    correctAnswer: "cannot_tell",
    difficulty: 2,
    linkedSrStructure: "D_B_C",
    feedback: "Correct - both share jund, but their relation is unknown.",
  },
  {
    id: "exam-nonsense-wrong-identity-invalid",
    wrapper: "nonsense_semantic",
    family: "order_chain",
    operations: ["identity_transitivity"],
    lureType: "wrong_identity",
    premises: [
      "A plim before a sarn means switch.",
      "A plim before a dorn means hold.",
    ],
    conclusion: "A plim before a dorn means switch.",
    correctAnswer: "invalid",
    difficulty: 2,
    linkedSrStructure: "mixed",
    feedback: "Correct - the second cue changes the rule.",
  },
  {
    id: "exam-meaningful-one-error-valid",
    wrapper: "nonsense_semantic",
    family: "order_chain",
    operations: ["transitivity"],
    premises: [
      "Every conclusion based only on one practice error is an overgeneralization.",
      "The thought 'I will fail the exam' is based only on one practice error.",
    ],
    conclusion: "Therefore, the thought 'I will fail the exam' is an overgeneralization.",
    correctAnswer: "valid",
    difficulty: 1,
    linkedSrStructure: "A_B_C",
    feedback: "Correct - the thought belongs to the class named in the rule.",
  },
  {
    id: "exam-meaningful-feedback-invalid",
    wrapper: "nonsense_semantic",
    family: "order_chain",
    operations: ["transitivity"],
    lureType: "reversed_relation",
    premises: [
      "Every well-supported revision plan uses feedback from mistakes.",
      "This revision plan uses feedback from mistakes.",
    ],
    conclusion: "Therefore, this revision plan is well-supported.",
    correctAnswer: "invalid",
    difficulty: 1,
    linkedSrStructure: "A_B_C",
    feedback: "Correct - the conclusion reverses the rule; feedback may be necessary without being sufficient.",
  },
  {
    id: "exam-meaningful-anxiety-valid",
    wrapper: "nonsense_semantic",
    family: "order_chain",
    operations: ["identity"],
    premises: [
      "If a signal is a temporary state, it is not a stable ability level.",
      "Pre-exam anxiety is a temporary state.",
    ],
    conclusion: "Therefore, pre-exam anxiety is not a stable ability level.",
    correctAnswer: "valid",
    difficulty: 2,
    linkedSrStructure: "A_B_C",
    feedback: "Correct - the stated rule applies to the stated case.",
  },
  {
    id: "exam-meaningful-mock-score-cannot-tell",
    wrapper: "nonsense_semantic",
    family: "order_chain",
    operations: ["transitivity"],
    lureType: "shared_lower_anchor",
    premises: [
      "My mock score was lower than my target score.",
      "My first practice score was lower than my target score.",
    ],
    conclusion: "Therefore, my mock score was lower than my first practice score.",
    correctAnswer: "cannot_tell",
    difficulty: 2,
    linkedSrStructure: "D_B_C",
    feedback: "Correct - both scores share the same anchor, but their relation to each other is unknown.",
  },
  {
    id: "exam-meaningful-rounding-invalid",
    wrapper: "nonsense_semantic",
    family: "order_chain",
    operations: ["identity_transitivity"],
    lureType: "wrong_identity",
    premises: [
      "If a question says estimate, rounding is allowed.",
      "This question says calculate exactly.",
    ],
    conclusion: "Therefore, rounding is allowed.",
    correctAnswer: "invalid",
    difficulty: 2,
    linkedSrStructure: "mixed",
    feedback: "Correct - a different instruction does not trigger the estimate rule.",
  },
];

const EXAM_REASONING_SEQUENCE: readonly ReasoningItem[] = (() => {
  const nonsenseItems = EXAM_REASONING_ITEMS.filter((item) =>
    item.id.startsWith("exam-nonsense"),
  );
  const meaningfulItems = EXAM_REASONING_ITEMS.filter((item) =>
    item.id.startsWith("exam-meaningful"),
  );
  const sequence: ReasoningItem[] = [];
  const count = Math.max(nonsenseItems.length, meaningfulItems.length);

  for (let index = 0; index < count; index += 1) {
    if (nonsenseItems[index]) sequence.push(nonsenseItems[index]);
    if (meaningfulItems[index]) sequence.push(meaningfulItems[index]);
  }

  return sequence;
})();

function activeReasoningItems(): readonly ReasoningItem[] {
  return isExamResilienceDemo() ? EXAM_REASONING_SEQUENCE : REASONING_ITEMS;
}

function benefitChips(limit = BENEFIT_CHIPS.length): string {
  return `
    <div class="benefit-chips" aria-label="Potential pilot applications">
      ${BENEFIT_CHIPS.slice(0, limit).map((label) => `<span>${label}</span>`).join("")}
    </div>
  `;
}

function percent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

function bandwidthReadiness(): number {
  if (!state.directionEstimate && !state.frameEstimate) return 0;
  const values = [state.directionEstimate, state.frameEstimate]
    .filter((estimate): estimate is CapacityEstimate => Boolean(estimate))
    .map((estimate) => estimate.accuracy * 100);
  return Math.round(values.reduce((total, value) => total + value, 0) / values.length);
}

function frameMemoryReadiness(): number {
  if (!state.nBackOutcomes1.length && !state.nBackOutcomes2.length) return 0;
  const oneBack = summarizeRelationalNBack(1, state.nBackOutcomes1).accuracy * 100;
  const twoBack = summarizeRelationalNBack(2, state.nBackOutcomes2).accuracy * 100;
  return Math.round(state.nBackOutcomes2.length ? 0.4 * oneBack + 0.6 * twoBack : oneBack);
}

function transferProfile(): TransferProfile | null {
  if (!state.srMetrics || !state.reasoningMetrics) return null;
  return computeTransferProfile({
    bandwidthReadiness: bandwidthReadiness(),
    frameMemoryReadiness: frameMemoryReadiness(),
    pathPredictionReadiness: state.srMetrics.pathPredictionReadiness,
    reasoningTransferReadiness:
      state.reasoningMetrics.reasoningTransferReadiness,
    srLureResistance: state.srMetrics.lureResistance * 100,
    reasoningLureResistance: state.reasoningMetrics.lureResistance * 100,
  });
}

function marketSelector(): string {
  return `
    <label class="market-selector">
      <span>Interpretation lens</span>
      <select data-market-mode>
        ${(Object.keys(MARKET_LABELS) as MarketMode[])
          .map(
            (mode) =>
              `<option value="${mode}" ${state.selectedMarketMode === mode ? "selected" : ""}>${MARKET_LABELS[mode]}</option>`,
          )
          .join("")}
      </select>
    </label>
  `;
}

function pathwayLayerCard(
  layer: number,
  technical: string,
  title: string,
  interpretation: string,
  score: number | null,
  detail: string,
  active: boolean,
  skipped = false,
): string {
  const band: ReadinessBand | "pending" =
    score === null ? "pending" : readinessBand(score);
  return `
    <article class="pathway-layer is-${band} ${active ? "is-active" : ""}">
      <span class="pathway-number">${layer}</span>
      <div class="pathway-copy">
        <span class="pathway-technical">${technical}</span>
        <h2>${title}</h2>
        <p>${interpretation}</p>
      </div>
      <div class="pathway-metric">
        <strong>${skipped ? "—" : score === null ? "--" : score}</strong>
        <span>${skipped ? "Skipped" : score === null ? "Not started" : detail}</span>
      </div>
    </article>
  `;
}

function renderPathwayDiagram(
  checkpoint: PathwayCheckpoint,
  final = false,
): string {
  const exam = isExamResilienceDemo();
  const labels = exam
    ? {
        bandwidth: "Timed focus + question-rule framing",
        frame: "exam cue control",
        memory: "Holding rules in mind",
        prediction: "Seeing what follows",
        reasoning: "Exam thought validity",
      }
    : MARKET_METRIC_LABELS[state.selectedMarketMode];
  const directionDone = Boolean(state.directionEstimate);
  const bandwidthDone = Boolean(state.frameEstimate);
  const memoryDone = Boolean(state.nBackOutcomes2.length);
  const predictionDone = Boolean(state.srMetrics);
  const reasoningDone = Boolean(state.reasoningMetrics);
  const directionSkipped = state.skippedTasks.has("direction");
  const frameSkipped = state.skippedTasks.has("frame");
  const memorySkipped = state.skippedTasks.has("nback");
  const predictionSkipped = state.skippedTasks.has("sr");
  const reasoningSkipped = state.skippedTasks.has("reasoning");
  const profile = transferProfile();
  const layerOneScore = bandwidthDone ? bandwidthReadiness() : null;
  const layerTwoScore = memoryDone ? frameMemoryReadiness() : null;
  const layerThreeScore = predictionDone
    ? state.srMetrics!.pathPredictionReadiness
    : null;
  const layerFourScore = reasoningDone
    ? state.reasoningMetrics!.reasoningTransferReadiness
    : null;
  const activeLayer =
    checkpoint === "intro" || checkpoint === "direction"
      ? 1
      : checkpoint === "bandwidth"
        ? 2
        : checkpoint === "memory"
          ? 3
          : 4;
  const next = {
    intro: [exam ? "Begin the exam-resilience demo" : "Begin the transfer-stack demo", "start-pathway"],
    direction: ["Continue to frame-shift control", "continue-frame"],
    bandwidth: ["Continue to relational working memory", "continue-memory"],
    memory: ["Continue to path prediction", "continue-sr"],
    prediction: ["Continue to reasoning transfer", "continue-reasoning"],
    recovery: ["Continue to transfer check", "start-transfer-check"],
  }[checkpoint];
  const checkpointCopy = {
    intro:
      exam
        ? "Four connected layers test whether focus, rule holding, prediction and appraisal reasoning stay stable under exam pressure."
        : "Four connected layers test whether a relation survives speed, memory load, prediction and explicit reasoning.",
    direction:
      exam
        ? "The focus layer is complete. The next task changes the rule and tests whether the relation can still be recovered."
        : "Simple evidence extraction is complete. The rule now changes to centre-relative direction.",
    bandwidth:
      exam
        ? "The rule-control layer is complete. The next task tests whether the relation stays active over delay."
        : "The control layer is complete. The next task tests whether the relation remains active over delay.",
    memory:
      exam
        ? "Rule holding is complete. The next layer tests prediction and recovery when the path changes."
        : "Frame memory is complete. The next layer tests prediction from a hidden visual path.",
    prediction:
      exam
        ? "Path prediction is complete. The final task tests whether exam-related conclusions follow from their premises."
        : "Path prediction is complete. The final task asks whether the same structure is recognised in words.",
    recovery:
      "The reasoning layer is complete. The final check turns the pattern into a small implementation intention.",
  }[checkpoint];
  const profileCopy = exam
    ? "This profile shows how timed focus, rule holding, path prediction and appraisal reasoning combine under exam pressure."
    : MARKET_INTERPRETATIONS[state.selectedMarketMode];
  return shell(`
    <main class="pathway-main ${final ? "is-final" : ""} ${exam ? "is-exam-demo" : ""}">
      <section class="pathway-hero">
        <div>
          <p class="ui-eyebrow">${final ? "Final exam-readiness profile" : "Vertical transfer stack"}</p>
          <h1 class="ui-heading-lg">${exam ? "Exam resilience pathway" : "From control practice to reasoning transfer"}</h1>
          <p class="ui-body">${checkpointCopy}</p>
        </div>
        ${exam ? "" : marketSelector()}
      </section>
      <section class="pathway-profile">
        <div>
          <span>Transfer Readiness</span>
          <strong>${profile ? profile.transferReadiness : "--"}</strong>
          <small>${profile ? `/100 · ${readinessBand(profile.transferReadiness)}` : "Builds as each layer completes"}</small>
        </div>
        <p>${profileCopy}</p>
      </section>
      <section class="pathway-stack">
        ${pathwayLayerCard(
          1,
          exam ? "Attention Control" : "Cognitive Bandwidth",
          "Focus under pressure",
          `${labels.bandwidth} + ${labels.frame}`,
          layerOneScore,
          bandwidthDone
            ? `${state.directionEstimate?.capacityBps.toFixed(1) ?? "skipped"} / ${state.frameEstimate?.capacityBps.toFixed(1) ?? "skipped"} bps`
            : directionDone
              ? "Direction block complete"
              : directionSkipped
                ? "Direction block skipped"
                : "Demo readiness",
          activeLayer === 1,
          directionSkipped && frameSkipped,
        )}
        ${pathwayLayerCard(
          2,
          "Frame Memory",
          "Hold the relation active",
          labels.memory,
          layerTwoScore,
          memoryDone ? "1-back + 2-back" : "Demo readiness",
          activeLayer === 2,
          memorySkipped,
        )}
        ${pathwayLayerCard(
          3,
          "Path Prediction",
          "Predict the next and later step",
          labels.prediction,
          layerThreeScore,
          predictionDone
            ? `${state.srMetrics!.srHorizonScore}-step horizon`
            : "Demo readiness",
          activeLayer === 3,
          predictionSkipped,
        )}
        ${pathwayLayerCard(
          4,
          exam ? "Appraisal Reasoning" : "Reasoning Transfer",
          exam ? "Test the conclusion" : "Recover the rule in words",
          labels.reasoning,
          layerFourScore,
          reasoningDone
            ? `${percent(state.reasoningMetrics!.lureResistance)} lure resistance`
            : "Demo readiness",
          activeLayer === 4,
          reasoningSkipped,
        )}
      </section>
      ${
        final
          ? `<section class="pathway-interpretation">
              <strong>${profile?.likelyBottleneck ? `Likely bottleneck: ${profile.likelyBottleneck}` : profile ? "No single demo bottleneck flagged" : "Incomplete demo profile"}</strong>
              <p>${profile ? dashboardInterpretation(profile) : "Some tests were skipped, so the demo does not calculate a complete Transfer Readiness profile. Completed task signals remain available for review."}</p>
            </section>
            <div class="stack-sm">
              ${button("View partner pilot outputs", "dashboard-continue")}
              ${button("Run the demo again", "restart", "secondary")}
            </div>`
          : `<div class="pathway-action">
              ${button(next[0], next[1])}
              <p>Development-stage signals only. Not an IQ test, clinical screen or selection tool.</p>
            </div>`
      }
    </main>
  `, { title: final ? "Transfer Readiness" : "IQ Coach Pathway" });
}

function renderWelcome(): string {
  if (isExamResilienceDemo()) {
    return renderExamResilienceDashboard("intro");
  }
  return renderPathwayDiagram("intro");
}

function renderSplash(): string {
  const exam = isExamResilienceDemo();
  return `
    <div class="splash-root">
      <main class="splash-screen">
        <div class="splash-network splash-network-top" aria-hidden="true"></div>
        <div class="splash-network splash-network-side" aria-hidden="true"></div>
        <section class="splash-brand">
          <img src="/iqmindware-logo.png" alt="IQ Mindware" class="splash-logo" />
          <div class="splash-title">
            <h1>${exam ? "Exam Resilience" : "IQ Coach"}</h1>
            <p>${exam ? "Mechanism demo for focus, memory and appraisal reasoning" : "Cognitive performance training app"}</p>
          </div>
          <div class="splash-divider" aria-hidden="true"><span></span></div>
          <p class="splash-protocol">Powered by the Trident G Far Transfer Protocol&trade;</p>
        </section>
        <div class="splash-wave splash-wave-one" aria-hidden="true"></div>
        <div class="splash-wave splash-wave-two" aria-hidden="true"></div>
        <section class="splash-footer">
          ${button(exam ? "Enter Exam Resilience Demo" : "Enter IQ Coach", "enter-demo")}
          <a href="https://iqmindware.com" target="_blank" rel="noopener">
            <span aria-hidden="true">&#8853;</span> iqmindware.com
          </a>
          <small>HRP Lab</small>
        </section>
      </main>
    </div>
  `;
}

function renderScope(): string {
  if (isExamResilienceDemo()) {
    return shell(`
      <main class="app-main compact-main">
        <section class="stack-md">
          <p class="ui-eyebrow">Proposal demo</p>
          <h1 class="ui-heading-lg">Exam Resilience Training</h1>
          <p class="ui-body">This short demonstration shows how IQ Coach could be adapted for maths or exam anxiety. It illustrates a vertical training pathway from focus under pressure to appraisal reasoning and recovery after errors.</p>
        </section>
        <section class="ui-card scope-card">
          <h2 class="ui-card-title">The demo communicates</h2>
          <ul class="check-list">
            <li>Attention control under evaluative pressure</li>
            <li>Working-memory interference and relation holding</li>
            <li>Prediction and path recovery after disruption</li>
            <li>Validity testing for exam-related thoughts</li>
            <li>A bottleneck map for partner discussion</li>
          </ul>
          <h2 class="ui-card-title danger-title">It does not claim</h2>
          <ul class="check-list is-boundary">
            <li>Diagnosis or treatment of anxiety</li>
            <li>Validated individual assessment</li>
            <li>Guaranteed exam improvement</li>
            <li>Replacement for academic support or therapy</li>
          </ul>
        </section>
        ${button("Choose privacy settings", "scope-continue")}
      </main>
    `, { title: "Exam Resilience", back: "back-welcome" });
  }
  return shell(`
    <main class="app-main compact-main">
      <section class="stack-md">
        <p class="ui-eyebrow">Before you begin</p>
        <h1 class="ui-heading-lg">A training preview, not a selection test</h1>
        <p class="ui-body">This prototype demonstrates the first IQ Coach training layer and the kind of progress signals a partner pilot could generate. It is not an individual assessment, IQ test, hiring tool or clinical screen.</p>
      </section>
      <section class="ui-card scope-card">
        <h2 class="ui-card-title">Use this demo to review</h2>
        <ul class="check-list">
          <li>The task experience</li>
          <li>The training logic</li>
          <li>Example progress metrics</li>
          <li>Possible pilot fit</li>
          <li>De-identified cohort reporting</li>
        </ul>
        <h2 class="ui-card-title danger-title">Do not use it for</h2>
        <ul class="check-list is-boundary">
          <li>Hiring or promotion decisions</li>
          <li>Diagnosis or clinical interpretation</li>
          <li>Education placement</li>
          <li>Inferred IQ</li>
        </ul>
      </section>
      ${button("Choose privacy settings", "scope-continue")}
    </main>
  `, { title: "Cognitive Bandwidth", back: "back-welcome" });
}

function renderConsent(): string {
  return shell(`
    <main class="app-main compact-main">
      <section class="stack-sm">
        <p class="ui-eyebrow">Privacy choice</p>
        <h1 class="ui-heading-lg">Choose how you review the demo</h1>
        <p class="ui-body">The training preview works either way. Anonymous usability sharing is optional and does not include an individual IQ or selection score.</p>
      </section>
      <section class="choice-grid">
        <button class="choice-card ${!state.consentedTelemetry ? "is-selected" : ""}" data-action="consent-private">
          <strong>Try privately</strong>
          <span>Do not save anonymous usability feedback.</span>
        </button>
        <button class="choice-card ${state.consentedTelemetry ? "is-selected" : ""}" data-action="consent-telemetry">
          <strong>Share usability data</strong>
          <span>Allow anonymous completion and device-quality signals.</span>
        </button>
      </section>
      ${button("Continue to training logic", "consent-continue")}
    </main>
  `, { title: "Privacy Settings", back: "back-consent" });
}

function renderScience(): string {
  if (isExamResilienceDemo()) {
    return renderExamSessionStep(1, "Check this device", "science-continue");
  }
  return shell(`
    <main class="app-main compact-main">
      <section class="stack-sm">
        <p class="ui-eyebrow">Training logic</p>
        <h1 class="ui-heading-lg">First layer: control under changing demands</h1>
        <p class="ui-body">This demo shows two short control challenges. The first trains simple majority-direction control. The second trains frame-shift control: judging direction relative to a centre. In a full IQ Coach pilot, this control layer feeds into working-memory, pattern-tracking, reasoning and carry-over checks.</p>
      </section>
      <div class="measure-grid">
        <article class="measure-card">
          <div class="measure-icon">D</div>
          <div><h2>Focus Under Pressure</h2><p>Pick out the majority direction from a brief masked display.</p></div>
        </article>
        <article class="measure-card">
          <div class="measure-icon is-frame">F</div>
          <div><h2>Frame-Shift Control</h2><p>Use a changed reference frame: out or in relative to a centre.</p></div>
        </article>
        <article class="measure-card is-wide">
          <div class="measure-icon is-why">W</div>
          <div><h2>Why it matters</h2><p>Learning, work and AI-use tasks often require people to ignore surface fluency, select relevant information and adapt when the rule changes.</p></div>
        </article>
      </div>
      <section class="ui-tip-card">
        <span class="tip-symbol">i</span>
        <p>Technical layer: Direction Bandwidth and experimental Frame Bandwidth remain available as development metrics. They are not a full IQ score.</p>
      </section>
      ${button("Check this device", "science-continue")}
    </main>
  `, { title: "Scientific Scope", back: "back-scope" });
}

function timingMetric(label: string, value: string, good: boolean): string {
  return `<div class="timing-row"><span>${label}</span><strong class="${good ? "is-good" : ""}">${value}</strong></div>`;
}

function renderTiming(): string {
  const timing = state.timing;
  return shell(`
    <main class="app-main timing-main">
      <section class="centre stack-sm">
        <div class="timing-orbit ${state.timingRunning ? "is-running" : ""}"><span></span></div>
        <p class="ui-eyebrow">Display timing</p>
        <h1 class="ui-heading-lg">${state.timingRunning ? "Checking frame stability" : timing ? "Timing check complete" : "Check display timing"}</h1>
        <p class="ui-body">Masked trials depend on stable browser display timing. Keep this tab visible while the check runs.</p>
      </section>
      <section class="ui-card timing-card">
        ${
          timing
            ? `
              ${timingMetric("Refresh estimate", `${timing.refreshRateHz.toFixed(1)} Hz`, timing.refreshRateHz > 0)}
              ${timingMetric("Frame variation", `${timing.frameMadMs.toFixed(2)} ms`, timing.frameMadMs <= 1.5)}
              ${timingMetric("Late frames", `${(timing.droppedFrameRate * 100).toFixed(1)}%`, timing.droppedFrameRate <= 0.05)}
              <div class="timing-quality is-${timing.quality.toLowerCase()}">Device quality: ${timing.quality}</div>
            `
            : `<div class="timing-placeholder">The check samples animation frames for about two seconds.</div>`
        }
      </section>
      <div class="stack-sm">
        ${
          timing
            ? button("Continue", "timing-continue") + button("Run check again", "run-timing", "ghost")
            : button(state.timingRunning ? "Checking..." : "Run timing check", "run-timing", "primary", state.timingRunning ? "disabled" : "")
        }
      </div>
    </main>
  `, { title: "Device Check", back: "back-science" });
}

function renderPreferences(): string {
  return shell(`
    <main class="app-main compact-main setup-main">
      <section class="stack-sm">
        <p class="ui-eyebrow">Response setup</p>
        <h1 class="ui-heading-lg">Choose how you respond</h1>
        <p class="ui-body">Click the buttons or use the left and right arrow keys. Both methods are scored identically.</p>
      </section>
      <section class="ui-card preview-card">
        <p class="task-preview-question">Were most arrows pointing left or right?</p>
        ${renderStimulus(generateTrial("preview", "abs_lr", 1, { ratio: "4:1", exposureMs: 1000 }, true), "stimulus")}
        <div class="response-grid">
          <button class="task-response-button preview-response">${responseButtonContent("left", "left")}</button>
          <button class="task-response-button preview-response">${responseButtonContent("right", "right")}</button>
        </div>
      </section>
      <div class="preference-list">
        <button class="setting-row" data-action="toggle-sound">
          <span><strong>Sound feedback</strong><small>Use a quiet tone after each response.</small></span>
          <span class="toggle ${state.soundEnabled ? "is-on" : ""}"><i></i></span>
        </button>
      </div>
      ${button("Start Direction tutorial", "preferences-continue")}
    </main>
  `, { title: "Response Setup", back: "back-timing" });
}

function tutorialContent(wrapper: WrapperId): string {
  const direction = wrapper === "abs_lr";
  const exam = isExamResilienceDemo();
  const example = generateTrial("tutorial", wrapper, direction ? 2 : 4, { ratio: "4:1", exposureMs: 1000 }, true);
  return shell(`
    <main class="app-main compact-main tutorial-main">
      <section class="centre stack-sm">
        <p class="ui-eyebrow">Training skill</p>
        <h1 class="ui-heading-lg">${direction ? "Focus under pressure" : exam ? "Recover the relation" : "Frame-shift control"}</h1>
        <p class="ui-body">${
          direction
            ? "Five arrows appear briefly. Choose whether most pointed Left or Right. This illustrates quick selection of the relevant signal under time pressure."
            : exam
              ? "Now the task requires deciding whether the majority of arrows points towards the centre or away from the centre."
              : "Now the rule changes. Ignore simple screen direction and judge whether most arrows point towards or away from the centre. This trains flexible control when the reference frame changes."
        }</p>
      </section>
      <section class="ui-card preview-card">
        <p class="task-preview-question">${
          direction ? "Were most arrows pointing left or right?" : "Were most arrows pointing out or in?"
        }</p>
        ${renderStimulus(example, "stimulus")}
        <div class="response-grid">
          <span class="tutorial-answer">${direction ? "Left" : "Out"}</span>
          <span class="tutorial-answer">${direction ? "Right" : "In"}</span>
        </div>
      </section>
      <section class="mini-steps">
        <span>${direction ? "Select the signal" : "Use the centre"}</span><span>Choose the majority</span><span>Accuracy before speed</span>
      </section>
      <div class="ui-tip-card">
        <span class="tip-symbol">i</span>
        <p>${direction ? "The arrows disappear behind masks before you respond." : "Out means away from the centre. In means towards the centre."}</p>
      </div>
      ${button(`Start ${direction ? "focus" : "frame-control"} practice`, direction ? "start-direction" : "start-frame")}
    </main>
  `, {
    title: `${direction ? "Direction" : "Frame"} Tutorial`,
    back: direction ? "back-preferences" : "back-direction-tutorial",
  });
}

function arrowSvg(trial: TrialDefinition): string {
  const points = arrowPolygonPoints();
  return trial.items
    .map((item) => {
      const angle = vectorAngleDegrees(item.vector);
      return `
        <g transform="translate(${item.position.x} ${item.position.y}) rotate(${angle})">
          <polygon points="${points}" fill="currentColor" />
        </g>
      `;
    })
    .join("");
}

function masksSvg(): string {
  return OCTAGON_POSITIONS.map(
    (position) => `<polygon points="${diamondPolygonPoints(position)}" />`,
  ).join("");
}

function renderStimulus(trial: TrialDefinition | null, stage: TaskStage): string {
  const showFixation = stage === "fixation" || stage === "stimulus";
  const showArrows = stage === "stimulus" && trial;
  const showMasks = stage === "mask";
  return `
    <div class="stimulus-wrap" aria-label="Brief arrow display">
      <svg class="stimulus-svg" viewBox="0 0 100 100" role="img" aria-hidden="true">
        <circle cx="50" cy="50" r="34" class="orbit-line" />
        ${showArrows ? `<g class="stimulus-arrows">${arrowSvg(trial)}</g>` : ""}
        ${showMasks ? `<g class="stimulus-masks">${masksSvg()}</g>` : ""}
        ${showFixation || trial?.wrapperId === "rel_inout" ? `<g class="fixation"><line x1="46.5" y1="50" x2="53.5" y2="50"/><line x1="50" y1="46.5" x2="50" y2="53.5"/></g>` : ""}
      </svg>
    </div>
  `;
}

function renderTask(): string {
  const wrapper = state.wrapper!;
  const [first, second] = categories(wrapper);
  const stage = state.taskStage;
  const progress = Math.min(100, (state.taskIndex / state.taskTotal) * 100);
  const prompt =
    wrapper === "abs_lr"
      ? "Were most arrows pointing left or right?"
      : "Were most arrows pointing out or in?";
  const showResponses = stage === "response";
  return shell(`
    <main class="task-main">
      <div class="task-topline">
        <span>${wrapper === "abs_lr" ? "Focus-control practice" : "Frame-control practice"}</span>
        <span>${Math.min(state.taskIndex + 1, state.taskTotal)} / ${state.taskTotal}</span>
      </div>
      <div class="task-progress"><span style="width:${progress}%"></span></div>
      <section class="task-stage is-${stage}">
        <div class="task-stage-copy">
          <p>${stage === "ready" ? "Focus on the majority." : showResponses ? prompt : "&nbsp;"}</p>
        </div>
        ${renderStimulus(state.currentTrial, stage)}
        <div class="task-feedback" aria-live="polite">
          ${
            stage === "feedback"
              ? `<strong class="${state.currentCorrect ? "is-correct" : "is-incorrect"}">${state.currentCorrect ? "Correct" : "Not this time"}</strong>`
              : ""
          }
        </div>
      </section>
      <div class="response-grid task-responses">
        <button class="task-response-button" data-response="${first}" aria-keyshortcuts="ArrowLeft" ${showResponses ? "" : "disabled"}>${responseButtonContent(first, "left")}</button>
        <button class="task-response-button" data-response="${second}" aria-keyshortcuts="ArrowRight" ${showResponses ? "" : "disabled"}>${responseButtonContent(second, "right")}</button>
      </div>
      <p class="task-footnote">${wrapper === "abs_lr" ? "Choose the majority direction." : "Use the centre as your reference point. Choose the majority."} Click or use &larr; / &rarr;.</p>
      ${skipTaskButton()}
    </main>
  `, { task: true });
}

function renderRelationalNBackStimulus(
  trial: RelationalNBackTrial | null,
  visible = true,
): string {
  const points = arrowPolygonPoints();
  const arrows =
    trial && visible
      ? trial.arrows
          .map((arrow) => {
            const angle = vectorAngleDegrees(arrow.vector);
            return `
              <g transform="translate(${arrow.position.x} ${arrow.position.y}) rotate(${angle})">
                <polygon points="${points}" fill="currentColor" />
              </g>
            `;
          })
          .join("")
      : "";
  return `
    <div class="nback-stimulus-wrap" aria-label="Paired relative-direction arrows">
      <svg class="stimulus-svg" viewBox="0 0 100 100" role="img" aria-hidden="true">
        <circle cx="50" cy="50" r="31" class="orbit-line nback-orbit" />
        <circle cx="50" cy="50" r="2.2" class="nback-centre-dot" />
        <g class="stimulus-arrows">${arrows}</g>
      </svg>
    </div>
  `;
}

function nBackRelationLegend(): string {
  return `
    <div class="nback-relation-grid" aria-label="Relative-direction classes">
      ${(["in", "out", "clockwise", "counterclockwise", "spiral_in", "spiral_out"] as const)
        .map((relation) => `<span>${relationalNBackLabel(relation)}</span>`)
        .join("")}
    </div>
  `;
}

function renderNBackIntro(): string {
  const example = generateRelationalNBackBlock("nback-preview", 1)[0];
  return shell(`
    <main class="app-main compact-main nback-intro-main">
      <section class="stack-sm centre">
        <p class="ui-eyebrow">Next layer: working memory</p>
        <h1 class="ui-heading-lg">Track relative direction over time</h1>
        <p class="ui-body">Each display contains two arrows at opposite points around a centre. Track the relationship they express, regardless of where the pair appears.</p>
      </section>
      <section class="ui-card nback-preview-card">
        ${renderRelationalNBackStimulus(example)}
        ${nBackRelationLegend()}
      </section>
      <section class="ui-tip-card">
        <span class="tip-symbol">i</span>
        <p>Press <strong>MATCH</strong> only when the current relationship is the same as the one shown n trials ago. Otherwise, do nothing.</p>
      </section>
      <div class="mini-steps">
        <span>1-back: 11 trials</span><span>Then 2-back</span><span>One MATCH button</span>
      </div>
      ${button("Start 1-back preview", "start-nback-1")}
    </main>
  `, { title: "Relational Working Memory" });
}

function renderNBackTask(): string {
  const trial = state.nBackTrials[state.nBackIndex] ?? null;
  const total = state.nBackTrials.length;
  const warmUp = state.nBackIndex < state.nBackLevel;
  const progress = total ? ((state.nBackIndex + 1) / total) * 100 : 0;
  return shell(`
    <main class="nback-task-main">
      <div class="task-topline">
        <span>Relational ${state.nBackLevel}-back</span>
        <span>${Math.min(state.nBackIndex + 1, total)} / ${total}</span>
      </div>
      <div class="task-progress"><span style="width:${progress}%"></span></div>
      <section class="nback-task-stage">
        <div class="nback-level-badge">${state.nBackLevel}-back</div>
        ${renderRelationalNBackStimulus(trial, state.nBackStimulusVisible)}
        <p class="nback-status" aria-live="polite">${
          state.nBackFeedback ||
          (warmUp
            ? "Build the sequence"
            : state.nBackResponseCaptured
              ? "Match marked"
              : "Same relation as before?")
        }</p>
      </section>
      <button class="nback-match-button ${state.nBackResponseCaptured ? "is-marked" : ""}" data-action="nback-match" ${warmUp || !state.nBackAcceptingResponse || state.nBackResponseCaptured ? "disabled" : ""}>
        <span>MATCH</span><kbd>M / Space</kbd>
      </button>
      <p class="task-footnote">Respond to the relationship, not the pair's position.</p>
      ${skipTaskButton()}
    </main>
  `, { title: "Working Memory Preview", task: true });
}

function renderNBackTransition(): string {
  const summary = summarizeRelationalNBack(1, state.nBackOutcomes1);
  return shell(`
    <main class="app-main compact-main nback-transition-main">
      <div class="completion-mark">&#10003;</div>
      <section class="centre stack-sm">
        <p class="ui-eyebrow">1-back complete</p>
        <h1 class="ui-heading-lg">Now hold two relations apart</h1>
        <p class="ui-body">In 2-back, compare each relationship with the one shown two trials earlier.</p>
      </section>
      <section class="ui-card nback-block-result">
        <span>1-back preview accuracy</span>
        <strong>${Math.round(summary.accuracy * 100)}%</strong>
        <small>${summary.hits} hits · ${summary.falseAlarms} false alarms</small>
      </section>
      <div class="ui-tip-card">
        <span class="tip-symbol">2</span>
        <p>The first two displays build the sequence. After that, press MATCH only when the relation repeats from two trials ago.</p>
      </div>
      ${button("Start 2-back preview", "start-nback-2")}
    </main>
  `, { title: "Relational Working Memory" });
}

function renderNBackSummary(): string {
  const oneBack = summarizeRelationalNBack(1, state.nBackOutcomes1);
  const twoBack = summarizeRelationalNBack(2, state.nBackOutcomes2);
  return shell(`
    <main class="app-main compact-main">
      <section class="centre stack-sm">
        <div class="completion-mark">&#10003;</div>
        <p class="ui-eyebrow">Working-memory preview complete</p>
        <h1 class="ui-heading-lg">Relational updating layer complete</h1>
        <p class="ui-body">These short blocks demonstrate relation tracking at increasing working-memory load. They are training previews, not stable capacity estimates.</p>
      </section>
      <div class="result-grid nback-result-grid">
        <article class="result-card">
          <span class="metric-label">Relational 1-back</span>
          <strong>${Math.round(oneBack.accuracy * 100)}%</strong>
          <span>${oneBack.hits} hits · ${oneBack.falseAlarms} false alarms</span>
        </article>
        <article class="result-card">
          <span class="metric-label">Relational 2-back</span>
          <strong>${Math.round(twoBack.accuracy * 100)}%</strong>
          <span>${twoBack.hits} hits · ${twoBack.falseAlarms} false alarms</span>
        </article>
      </div>
      <div class="boundary-note"><strong>Demo signal.</strong> A production pilot would use repeated adaptive blocks, response-bias checks and rolling progress estimates.</div>
      ${button("Return to the transfer pathway", "nback-summary-continue")}
    </main>
  `, { title: "Working Memory Preview" });
}

function opticFlowDots(): Array<{ x: number; y: number; r: number; opacity: number }> {
  return Array.from({ length: 24 }, (_, index) => {
    const angle = ((index * 137.508 + 19) % 360) * (Math.PI / 180);
    const radius = 7 + ((index * 29) % 36);
    const wobble = ((index * 17) % 9) - 4;
    const dot = {
      x: 50 + Math.cos(angle) * (radius + wobble * 0.35),
      y: 50 + Math.sin(angle) * (radius - wobble * 0.25),
      r: 0.8 + ((index * 7) % 7) * 0.12,
      opacity: 0.48 + ((index * 11) % 7) * 0.06,
    };
    const paired = {
      x: 100 - dot.x,
      y: 100 - dot.y,
      r: dot.r,
      opacity: dot.opacity,
    };
    return [dot, paired];
  }).flat();
}

function rotatingFlowDots(): Array<{ x: number; y: number; r: number; opacity: number }> {
  return Array.from({ length: 36 }, (_, index) => {
    const ring = index % 3;
    const angle = ((index * 31 + ring * 12) % 360) * (Math.PI / 180);
    const radius = 16 + ring * 10;
    return {
      x: 50 + Math.cos(angle) * radius,
      y: 50 + Math.sin(angle) * radius,
      r: 0.9 + ring * 0.12,
      opacity: 0.46 + ring * 0.12,
    };
  });
}

function animatedDot(
  dot: { x: number; y: number; r: number; opacity: number },
  index: number,
  stateId: SrStateId,
): string {
  const dx = dot.x - 50;
  const dy = dot.y - 50;
  const delay = `${-(index % 6) * 0.13}s`;
  const duration = stateId === "rotation" ? "1.2s" : "0.95s";
  const from =
    stateId === "expansion" || stateId === "rotation"
      ? [50 + dx * 0.25, 50 + dy * 0.25]
      : stateId === "diagonal_contraction"
        ? [50 + dx * 1.12 + 8, 50 + dy * 1.12 - 8]
        : [50 + dx * 1.16, 50 + dy * 1.16];
  const to =
    stateId === "expansion" || stateId === "rotation"
      ? [50 + dx * 1.18, 50 + dy * 1.18]
      : stateId === "diagonal_contraction"
        ? [50 + dx * 0.34 - 4, 50 + dy * 0.34 + 4]
        : [50 + dx * 0.26, 50 + dy * 0.26];

  return `
    <circle class="optic-dot" cx="${dot.x.toFixed(2)}" cy="${dot.y.toFixed(2)}" r="${dot.r.toFixed(2)}" opacity="${dot.opacity.toFixed(2)}">
      <animate attributeName="cx" values="${from[0].toFixed(2)};${to[0].toFixed(2)}" dur="${duration}" begin="${delay}" repeatCount="indefinite" />
      <animate attributeName="cy" values="${from[1].toFixed(2)};${to[1].toFixed(2)}" dur="${duration}" begin="${delay}" repeatCount="indefinite" />
      <animate attributeName="opacity" values="0.2;${dot.opacity.toFixed(2)};0.12" dur="${duration}" begin="${delay}" repeatCount="indefinite" />
    </circle>
  `;
}

function rotatingDot(
  dot: { x: number; y: number; r: number; opacity: number },
  index: number,
): string {
  const delay = `${-(index % 9) * 0.1}s`;
  const dx = dot.x - 50;
  const dy = dot.y - 50;
  const radius = Math.hypot(dx, dy);
  const startAngle = Math.atan2(dy, dx);
  const points = Array.from({ length: 7 }, (_, pointIndex) => {
    const angle = startAngle + (Math.PI * 2 * pointIndex) / 6;
    return {
      x: 50 + Math.cos(angle) * radius,
      y: 50 + Math.sin(angle) * radius,
    };
  });
  const xValues = points.map((point) => point.x.toFixed(2)).join(";");
  const yValues = points.map((point) => point.y.toFixed(2)).join(";");
  return `
    <circle class="optic-dot" cx="${dot.x.toFixed(2)}" cy="${dot.y.toFixed(2)}" r="${dot.r.toFixed(2)}" opacity="${dot.opacity.toFixed(2)}">
      <animate attributeName="cx" values="${xValues}" dur="1.2s" begin="${delay}" repeatCount="indefinite" />
      <animate attributeName="cy" values="${yValues}" dur="1.2s" begin="${delay}" repeatCount="indefinite" />
      <animate attributeName="opacity" values="0.3;${dot.opacity.toFixed(2)};0.3" dur="0.9s" begin="${delay}" repeatCount="indefinite" />
    </circle>
  `;
}

function renderOpticFlowState(stateId: SrStateId): string {
  const flow = OPTIC_FLOW_STATES[stateId];
  const sourceDots = stateId === "rotation" ? rotatingFlowDots() : opticFlowDots();
  const dots = sourceDots
    .map((dot, index) =>
      stateId === "rotation"
        ? rotatingDot(dot, index)
        : animatedDot(dot, index, stateId),
    )
    .join("");
  const dotGroup = `<g class="optic-dot-group">${dots}</g>`;
  return `
    <div class="optic-flow-field" aria-label="${flow.label}">
      <svg class="optic-flow-patch optic-flow-${stateId}" viewBox="0 0 100 100" aria-hidden="true">
        <defs>
          <clipPath id="optic-flow-clip-${stateId}">
            <circle cx="50" cy="50" r="48" />
          </clipPath>
        </defs>
        <circle class="optic-flow-boundary" cx="50" cy="50" r="48" />
        <g clip-path="url(#optic-flow-clip-${stateId})">
          ${dotGroup}
        </g>
      </svg>
    </div>
  `;
}

function renderSrIntro(): string {
  return shell(`
    <main class="app-main compact-main sr-intro-main">
      <section class="centre stack-sm">
        <p class="ui-eyebrow">Layer 3 · Path Prediction</p>
        <h1 class="ui-heading-lg">Watch the optic-flow sequence</h1>
        <p class="ui-body">There are different types of flow in each pattern. Observe the flow pattern for a while and press the button when you sense there is a change in the pattern.</p>
      </section>
      <section class="ui-card sr-preview-card">
        <div class="sr-preview-flow">
          ${renderOpticFlowState("expansion")}
          <span>&rarr;</span>
          ${renderOpticFlowState("rotation")}
          <span>&rarr;</span>
          ${renderOpticFlowState("contraction")}
        </div>
      </section>
      <section class="mini-steps">
        <span>moving forward</span>
        <span>rotating right</span>
        <span>moving backwards</span>
      </section>
      <div class="ui-tip-card">
        <span class="tip-symbol">i</span>
        <p>This is a visual demonstration only. The final profile uses fixed illustrative values, not performance scores.</p>
      </div>
      ${button("Start path-prediction game", "start-sr")}
    </main>
  `, { title: "Path Prediction" });
}

function renderSrTask(): string {
  const event = state.srEvents[state.srIndex];
  const progress = state.srEvents.length
    ? ((state.srIndex + 1) / state.srEvents.length) * 100
    : 0;
  const responseAttempted = state.srResponse !== null && state.srResponse !== "none";
  return shell(`
    <main class="sr-task-main">
      <div class="task-topline">
        <span>Press when the sequence looks wrong</span>
        <span>${Math.min(state.srIndex + 1, state.srEvents.length)} / ${state.srEvents.length}</span>
      </div>
      <div class="task-progress"><span style="width:${progress}%"></span></div>
      <section class="sr-task-stage">
        <div class="sr-stream-state">${event ? renderOpticFlowState(event.currentStateId) : ""}</div>
        <div class="sr-feedback" aria-live="polite">${
          state.srStage === "feedback" && responseAttempted
            ? state.srResponse === event?.correctResponse
              ? "&#10003;"
              : "&times;"
            : ""
        }</div>
      </section>
      <button class="sr-break-button ${state.srResponse === "break" ? "is-marked" : ""}" data-sr-response="break">Sequence looks wrong <kbd>Space</kbd></button>
      ${skipTaskButton()}
    </main>
  `, { title: "Path Prediction", task: true });
}

function renderSrSummary(): string {
  if (isExamResilienceDemo()) {
    return shell(`
      <main class="app-main compact-main">
        <section class="centre stack-sm">
          <div class="completion-mark">&#10003;</div>
          <p class="ui-eyebrow">Path-prediction training complete</p>
          <h1 class="ui-heading-lg">You completed the movement pattern task.</h1>
          <p class="ui-body">This demo shows how we can learn to predict patterns.</p>
        </section>
        ${button("Return to today's session", "sr-summary-continue")}
      </main>
    `, { title: "Path Prediction" });
  }
  const metrics = state.srMetrics!;
  return shell(`
    <main class="app-main compact-main">
      <section class="centre stack-sm">
        <div class="completion-mark">&#10003;</div>
        <p class="ui-eyebrow">Path-prediction layer complete</p>
        <h1 class="ui-heading-lg">Your visual prediction signal is ready</h1>
      </section>
      <div class="metric-quad">
        <span><strong>${percent(metrics.immediateAccuracy)}</strong>Immediate next-state</span>
        <span><strong>${percent(metrics.lookaheadAccuracy)}</strong>Look-ahead</span>
        <span><strong>${percent(metrics.lureResistance)}</strong>Foil rejection</span>
        <span><strong>${percent(metrics.identityRoleTransfer)}</strong>Role transfer</span>
      </div>
      <section class="ui-card sr-horizon-card">
        <span>SR Horizon</span>
        <strong>${metrics.srHorizonScore}-step</strong>
        <p>${metrics.srHorizonScore === 2 ? "Downstream prediction is emerging." : metrics.srHorizonScore === 1 ? "Immediate prediction is stronger than look-ahead." : "The immediate path needs more exposure."}</p>
      </section>
      ${button("Return to the transfer pathway", "sr-summary-continue")}
    </main>
  `, { title: "Path Prediction" });
}

function renderReasoningIntro(): string {
  if (isExamResilienceDemo()) {
    return shell(`
      <main class="app-main compact-main reasoning-intro-main">
        <section class="centre stack-sm">
          <p class="ui-eyebrow">Layer 4 · Appraisal Reasoning</p>
          <h1 class="ui-heading-lg">Test your reasoning skills.</h1>
          <p class="ui-body">This game requires you to evaluate the validity of arguments. Some arguments have nonsense words (but may still have sound logic), while others relate to exam-taking.</p>
        </section>
        <section class="ui-card reasoning-example">
          <strong>These are your argument evaluation response options.</strong>
        </section>
        <div class="reasoning-answer-preview">
          <span>Valid</span><span>Invalid</span><span>Cannot tell</span>
        </div>
        <div class="ui-tip-card">
          <span class="tip-symbol">i</span>
          <p>The exam questions are validity checks, not reassurance. Judge whether each conclusion follows from the stated premises.</p>
        </div>
        ${button("Start appraisal reasoning", "start-reasoning")}
      </main>
    `, { title: "Appraisal Reasoning" });
  }
  return shell(`
    <main class="app-main compact-main reasoning-intro-main">
      <section class="centre stack-sm">
        <p class="ui-eyebrow">Layer 4 · Reasoning Transfer</p>
        <h1 class="ui-heading-lg">Recognise the same structure in words</h1>
        <p class="ui-body">You just practised a pattern visually. Now decide whether each conclusion follows from the premises.</p>
      </section>
      <section class="ui-card reasoning-example">
        <span>A &gt; B</span>
        <span>B &gt; C</span>
        <strong>Therefore, A &gt; C</strong>
      </section>
      <div class="reasoning-answer-preview">
        <span>Valid</span><span>Invalid</span><span>Cannot tell</span>
      </div>
      <div class="ui-tip-card">
        <span class="tip-symbol">i</span>
        <p>Some items use unfamiliar words. Judge only what follows from the stated premises.</p>
      </div>
      ${button("Start reasoning transfer", "start-reasoning")}
    </main>
  `, { title: "Reasoning Transfer" });
}

function renderReasoningTask(): string {
  const items = activeReasoningItems();
  const item = items[state.reasoningIndex];
  const progress = ((state.reasoningIndex + 1) / items.length) * 100;
  const exam = isExamResilienceDemo();
  const itemType = exam
    ? item.id.startsWith("exam-nonsense")
      ? "New-word rule check"
      : "Exam argument check"
    : item.wrapper === "symbolic"
      ? "Symbolic relation"
      : "New-word relation";
  return shell(`
    <main class="reasoning-task-main">
      <div class="task-topline">
        <span>${itemType}</span>
        <span>${state.reasoningIndex + 1} / ${items.length}</span>
      </div>
      <div class="task-progress"><span style="width:${progress}%"></span></div>
      <section class="reasoning-item-card">
        <div class="reasoning-premises">
          ${item.premises.map((premise) => `<p>${premise}</p>`).join("")}
        </div>
        <div class="reasoning-conclusion">${item.conclusion}</div>
        <p class="reasoning-feedback" aria-live="polite">${state.reasoningFeedback}</p>
      </section>
      <div class="reasoning-response-grid">
        ${(["valid", "invalid", "cannot_tell"] as ReasoningAnswer[])
          .map(
            (answer, index) =>
              `<button data-reasoning-answer="${answer}" ${state.reasoningAcceptingResponse ? "" : "disabled"}><kbd>${index + 1}</kbd>${answer === "cannot_tell" ? "Cannot tell" : categoryLabel(answer as Category)}</button>`,
          )
          .join("")}
      </div>
      <p class="task-footnote">Accuracy matters more than speed. Use buttons or keys 1, 2 and 3.</p>
      ${skipTaskButton()}
    </main>
  `, { title: exam ? "Appraisal Reasoning" : "Reasoning Transfer", task: true });
}

function dashboardInterpretation(profile: TransferProfile): string {
  const mode = state.selectedMarketMode;
  const bottleneck = profile.likelyBottleneck;
  if (!bottleneck) {
    return `${MARKET_INTERPRETATIONS[mode]} No single layer fell below the demo bottleneck threshold.`;
  }
  const focus = {
    "Frame Memory":
      "holding the relevant relation active before increasing prediction load",
    "Path Prediction":
      "seeing what follows from the current state before the answer is explicit",
    "Reasoning Transfer":
      "recovering the relation explicitly across unfamiliar wording and lures",
  }[bottleneck];
  return `${MARKET_INTERPRETATIONS[mode]} The next demo focus would be ${focus}.`;
}

function resultMetric(label: string, technicalLabel: string, estimate: CapacityEstimate, relational = false): string {
  return `
    <article class="result-card">
      <span class="metric-label">${label}</span>
      <strong>${estimate.capacityBps.toFixed(1)}</strong>
      <span>technical estimate: ${technicalLabel}, ${relational ? "relational " : ""}bits/sec</span>
      <small>${(estimate.accuracy * 100).toFixed(0)}% correct across ${estimate.validTrials} demonstration trials</small>
    </article>
  `;
}

function renderResults(): string {
  const direction = state.directionEstimate!;
  const frame = state.frameEstimate!;
  return shell(`
    <main class="app-main compact-main">
      <section class="centre stack-sm">
        <div class="completion-mark">&#10003;</div>
        <p class="ui-eyebrow">Training preview complete</p>
        <h1 class="ui-heading-lg">Your control-training preview is complete</h1>
        <p class="ui-body">These values preview the training signals IQ Coach can generate.</p>
      </section>
      <div class="result-grid">
        ${resultMetric("Focus Under Pressure", "Direction Bandwidth", direction)}
        ${resultMetric("Frame-Shift Control", "Frame Bandwidth", frame, true)}
      </div>
      <div class="quality-strip">
        <span>Device Quality <strong>${state.timing?.quality ?? "Unknown"}</strong></span>
        <span>Confidence Level <strong>Demo estimate</strong></span>
      </div>
      ${button("See training interpretation", "results-continue")}
    </main>
  `, { title: "Training Preview" });
}

function renderResultGuidance(): string {
  const direction = state.directionEstimate!;
  const frame = state.frameEstimate!;
  const frameCost = direction.capacityBps - frame.capacityBps;
  const nextFocus = frame.capacityBps <= direction.capacityBps ? "Frame-shift control" : "Focus under pressure";
  return shell(`
    <main class="app-main compact-main">
      <section class="stack-sm">
        <p class="ui-eyebrow">Training interpretation</p>
        <h1 class="ui-heading-lg">What the preview could guide next</h1>
        <p class="ui-body">A production pilot would combine repeated sessions, confidence intervals and carry-over checks before changing a participant's route.</p>
      </section>
      <section class="ui-card frame-cost-card">
        <div><span>Flexibility Cost</span><strong>${frameCost.toFixed(1)} bits/sec</strong></div>
        <p>Extra load when the task changed from simple direction to centre-based direction. Technical metric: Frame Cost.</p>
      </section>
      <section class="ui-card next-focus-card">
        <p class="ui-eyebrow">Suggested next training focus</p>
        <h2>${nextFocus}</h2>
        <p>IQ Coach would adapt the next block to train this skill at a suitable challenge level.</p>
      </section>
      ${benefitChips(3)}
      <div class="boundary-note"><strong>Development-stage signal.</strong> This short demo is not validated for individual assessment. Pilot use requires repeated measures, confidence labels and independent reliability testing.</div>
      ${button("View partner pilot outputs", "guidance-continue")}
    </main>
  `, { title: "Training Interpretation", back: "back-guidance" });
}

function renderPartnerOutputs(): string {
  return shell(`
    <main class="app-main compact-main">
      <section class="stack-sm">
        <p class="ui-eyebrow">Pilot reporting</p>
        <h1 class="ui-heading-lg">What partners could receive from a pilot</h1>
        <p class="ui-body">First, each participant receives practical development feedback rather than a ranking or selection score.</p>
      </section>
      <article class="ui-card output-card output-card-featured">
        <p class="ui-eyebrow">Participant feedback</p>
        <h2>Each participant can see</h2>
        <ul class="plain-list">
          <li>Strongest area</li>
          <li>Improving area</li>
          <li>Next training focus</li>
          <li>Carry-over result</li>
          <li>Reasoning benchmark trend</li>
        </ul>
      </article>
      ${benefitChips(4)}
      ${button("Share partner feedback", "outputs-continue")}
    </main>
  `, { title: "Participant Outputs", back: "back-partner-outputs" });
}

function examLayerStatus(score: number): "strong" | "watch" | "bottleneck" {
  if (score >= 74) return "strong";
  if (score >= 58) return "watch";
  return "bottleneck";
}

function examLayerCard(
  index: number,
  title: string,
  body: string,
  score: number,
  accent: "blue" | "purple" | "teal" | "orange" | "green",
  note: string,
): string {
  const status = examLayerStatus(score);
  const labels = {
    strong: ["Strong", "Keep it up"],
    watch: ["Watch", "Needs more practice"],
    bottleneck: ["Bottleneck", "Focus here first"],
  }[status];
  return `
    <article class="exam-layer exam-layer-${accent} is-${status}">
      <div class="exam-layer-index">${index}</div>
      <div class="exam-layer-icon" aria-hidden="true"></div>
      <div class="exam-layer-copy">
        <h2>${title}</h2>
        <p>${body}</p>
      </div>
      <div class="exam-layer-score">
        <strong>${score}</strong><span>/100</span>
        <i><b style="width:${score}%"></b></i>
      </div>
      <div class="exam-layer-status">
        <strong>${labels[0]}</strong>
        <span>${note || labels[1]}</span>
      </div>
    </article>
  `;
}

function examScoreLevelCard(
  index: number,
  title: string,
  body: string,
  score: number,
  color: string,
  iconBg: string,
  icon: string,
  status: "Strong" | "Watch" | "Bottleneck",
  statusTone: "green" | "orange" | "red",
  note = "",
): string {
  const statusIcon = status === "Strong" ? "&#128578;" : status === "Watch" ? "&#128528;" : "&#128577;";
  return `
    <div class="card level-card">
      <div class="level-badge" style="background:${color};">${index}</div>
      <div class="level-icon" style="background:${iconBg};">${icon}</div>
      <div class="level-info">
        <h3>${title}</h3>
        <p>${body}</p>
      </div>
      <div class="level-score">
        <div class="num-row"><span class="num" style="color:${color};">${score}</span><span class="denom">/100</span></div>
        <div class="bar-track"><div class="bar-fill" style="width:${score}%; background:${color};"></div></div>
      </div>
      <div class="level-status">
        <span class="status-row pill ${statusTone}">${status} <span>${statusIcon}</span></span>
        ${note ? `<p class="status-note">${note}</p>` : ""}
      </div>
    </div>
  `;
}

function renderExamResilienceDashboard(mode: "intro" | "final" = "final"): string {
  const isIntro = mode === "intro";
  return shell(`
    <main class="exam-score-page">
      <div class="exam-score-content">
        <div class="hero">
          <h1>Exam Resilience Training</h1>
          <p>Build focus, memory and calm thinking for better exam performance. <span class="cap">&#127891;</span></p>
        </div>

        <div class="card readiness">
          <div class="readiness-left">
            <h2>Overall Transfer Readiness</h2>
            <div class="readiness-score">
              <span class="num">67</span><span class="denom">/100</span>
              <span class="pill green">Developing</span>
            </div>
            <p class="sub">You're building strong skills.</p>
          </div>

          <div class="readiness-mid"></div>

          <div class="readiness-trend">
            <svg viewBox="0 0 170 60" fill="none" aria-hidden="true">
              <polyline points="5,48 25,40 45,44 65,30 85,34 105,18 125,22 145,8"
                        stroke="#3b6fe0" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
              <circle cx="145" cy="8" r="5" fill="#3b6fe0"/>
            </svg>
            <p>Keep practising to improve</p>
          </div>

          <div class="readiness-icon" aria-hidden="true">
            <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
              <path d="M22 50 L22 56 Q22 59 25 59 L37 59 Q40 59 40 56 L40 50" stroke="#9db8ee" stroke-width="2.2" fill="none"/>
              <path d="M22 44 Q14 38 14 28 Q14 14 31 12 Q48 14 48 28 Q48 38 40 44 L40 50 L22 50 Z" stroke="#9db8ee" stroke-width="2.2" fill="none"/>
              <path d="M24 26 Q26 22 31 22 Q36 22 36 27 Q40 27 40 31 Q40 35 36 35 Q34 39 29 38 Q24 37 24 32 Q21 31 22 28 Q22 26 24 26 Z" stroke="#7fa3ec" stroke-width="1.6" fill="none"/>
              <line x1="31" x2="31" y1="2" y2="8" stroke="#9db8ee" stroke-width="2.2" stroke-linecap="round"/>
              <line x1="20" x2="16" y1="6" y2="10" stroke="#9db8ee" stroke-width="2.2" stroke-linecap="round"/>
              <line x1="42" x2="46" y1="6" y2="10" stroke="#9db8ee" stroke-width="2.2" stroke-linecap="round"/>
            </svg>
          </div>
        </div>

        <h2 class="section-title">Your Training Levels</h2>

        ${examScoreLevelCard(
          1,
          "Focus Under Pressure",
          "Stay with the cue despite worry and time pressure.",
          80,
          "#1d56d8",
          "#e7eefd",
          `<svg viewBox="0 0 24 24" fill="none" stroke="#1d56d8" stroke-width="1.8">
             <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z"/>
             <circle cx="12" cy="12" r="3.2"/>
           </svg>`,
          "Strong",
          "green",
        )}
        ${examScoreLevelCard(
          2,
          "Hold the Information",
          "Hold what the question asks and how ideas connect.",
          62,
          "#7c3aed",
          "#f1e9fc",
          `<svg viewBox="0 0 24 24" fill="none" stroke="#7c3aed" stroke-width="1.6">
             <path d="M9 4c-2.2 0-3.8 1.7-3.8 3.6 0 .6.1 1.1.4 1.6-1.1.5-1.9 1.7-1.9 3 0 1.1.6 2.1 1.5 2.7-.2.4-.3.9-.3 1.4 0 1.7 1.4 3 3.1 3 .3 0 .6 0 .9-.1.5 1 1.5 1.8 2.7 1.8h.4V5.7C11.4 4.7 10.3 4 9 4Z"/>
             <path d="M15 4c2.2 0 3.8 1.7 3.8 3.6 0 .6-.1 1.1-.4 1.6 1.1.5 1.9 1.7 1.9 3 0 1.1-.6 2.1-1.5 2.7.2.4.3.9.3 1.4 0 1.7-1.4 3-3.1 3-.3 0-.6 0-.9-.1-.5 1-1.5 1.8-2.7 1.8h-.4V5.7C12.6 4.7 13.7 4 15 4Z"/>
           </svg>`,
          "Watch",
          "orange",
        )}
        ${examScoreLevelCard(
          3,
          "Predict the Next Step",
          "Predict the next move: try, skip, check or return.",
          48,
          "#0f9b8e",
          "#e3f6f4",
          `<svg viewBox="0 0 24 24" fill="none" stroke="#0f9b8e" stroke-width="2">
             <path d="M4 16c2-1 3-5 6-6 2-.7 3 1.3 5 .6 2-.7 3-4 5-4.6" stroke-linecap="round"/>
             <path d="M16 4.8h4v4" stroke-linecap="round" stroke-linejoin="round"/>
           </svg>`,
          "Bottleneck",
          "red",
          "This may slow your exam performance.",
        )}
        ${examScoreLevelCard(
          4,
          "Think It Through",
          "Infer what follows and resist catastrophic appraisals.",
          55,
          "#ea7c1f",
          "#fdedda",
          `<svg viewBox="0 0 24 24" fill="none" stroke="#ea7c1f" stroke-width="1.8">
             <path d="M21 12a8 8 0 1 1-3.5-6.6" stroke-linecap="round"/>
             <path d="M3 11l2-2 2 2" stroke-linecap="round" stroke-linejoin="round"/>
             <text x="9" y="15.5" font-size="8" stroke="none" fill="#ea7c1f" font-weight="700">?!</text>
           </svg>`,
          "Bottleneck",
          "red",
          "Unhelpful thoughts can hold you back.",
        )}
        ${examScoreLevelCard(
          5,
          "Implement & Adapt",
          "Carry out the plan, then adapt from feedback.",
          72,
          "#1fa34a",
          "#e3f6e8",
          `<svg viewBox="0 0 24 24" fill="none" stroke="#1fa34a" stroke-width="2">
             <circle cx="12" cy="12" r="9"/>
             <path d="M8 12.5l2.5 2.5L16 9" stroke-linecap="round" stroke-linejoin="round"/>
           </svg>`,
          "Watch",
          "orange",
          "Building consistency will help.",
        )}

        <div class="card legend-card">
          <h3 class="legend-title">How to read this</h3>
          <div class="legend">
            <div class="legend-item">
              <div class="label green">&#128578; Strong</div>
              <p class="desc">Keep it up!</p>
            </div>
            <div class="legend-item">
              <div class="label orange">&#128528; Watch</div>
              <p class="desc">Needs more practice</p>
            </div>
            <div class="legend-item">
              <div class="label red">&#128577; Bottleneck</div>
              <p class="desc">Focus here first</p>
            </div>
          </div>
        </div>

        <div class="exam-score-actions">
        ${
          isIntro
            ? button("Begin the exam-resilience demo", "start-pathway")
            : button("Please provide pilot feedback", "dashboard-continue")
        }
        </div>
      </div>
    </main>
  `);
}

function renderExamSessionStep(
  currentStep: 1 | 2 | 3 | 4 | 5,
  actionLabel: string,
  action: string,
): string {
  const tasks = [
    ["Focus Under Pressure", "Stay with the cue despite worry and time pressure.", "#1d56d8"],
    ["Hold the Information", "Hold what the question asks and how ideas connect.", "#7c3aed"],
    ["Predict the Next Step", "Predict the next move: try, skip, check or return.", "#0f9b8e"],
    ["Think It Through", "Infer what follows and resist catastrophic appraisals.", "#ea7c1f"],
    ["Implement & Adapt", "Carry out the plan, then adapt from feedback.", "#1fa34a"],
  ] as const;
  const progress = (currentStep - 1) * 25;
  return shell(`
    <main class="exam-session-page">
      <div class="exam-session-content">
        <div class="hero">
          <h1>Today's Training Session</h1>
          <p>Five quick tasks to sharpen your exam resilience.</p>
        </div>
        <div class="card progress-card">
          <h2>Session Progress</h2>
          <div class="progress-track"><div class="progress-fill" style="width:${progress}%;"></div></div>
          <div class="stepper">
            ${[1, 2, 3, 4, 5].map((step, index) => `
              <div class="step-dot ${step < currentStep ? "done" : step === currentStep ? "current" : ""}">${step < currentStep ? "✓" : step}</div>
              ${index < 4 ? `<div class="step-line ${step < currentStep ? "done" : ""}"></div>` : ""}
            `).join("")}
          </div>
          <p class="progress-caption">${currentStep === 1 ? "Let's begin today's session." : currentStep === 5 ? "Last task - finish strong." : `Task ${currentStep} of 5 - keep going.`}</p>
        </div>
        <h2 class="section-title">Today's Tasks</h2>
        <section class="session-task-list">
          ${tasks.map(([title, body, color], index) => {
            const step = index + 1;
            const done = step < currentStep;
            const current = step === currentStep;
            const status = done ? "done" : current ? "current" : "upcoming";
            return `
              <div class="card level-card ${status}" ${current ? `style="--lvl-color:${color};"` : ""}>
                <div class="level-marker" style="background:${done || current ? color : "#c7cbd6"};">${done ? "✓" : step}</div>
                <div class="level-info"><h3>${title}</h3><p>${body}</p></div>
                <div class="level-status"><span class="status-pill ${status}">${current ? '<span class="pulse-dot"></span>In progress' : done ? "Completed" : "Up next"}</span></div>
              </div>
            `;
          }).join("")}
        </section>
        <div class="card session-legend">
          <h3 class="legend-title">How to read this</h3>
          <div class="legend">
            <div class="legend-item"><div class="label done-label">✓ Completed</div><p class="desc">Task finished</p></div>
            <div class="legend-item"><div class="label current-label">● In progress</div><p class="desc">You are here</p></div>
            <div class="legend-item"><div class="label upcoming-label"># Up next</div><p class="desc">Not started yet</p></div>
          </div>
        </div>
        <div class="exam-score-actions">${button(actionLabel, action)}</div>
      </div>
    </main>
  `);
}

function renderTransferCheck(): string {
  return shell(`
    <main class="exam-session-page">
      <div class="exam-session-content is-transfer-check">
        <div class="hero">
          <h1>Implement & Adapt</h1>
          <p>Turn the reasoning practice into a small exam-pressure plan.</p>
        </div>
        <div class="card progress-card">
          <h2>Session Progress</h2>
          <div class="progress-track"><div class="progress-fill" style="width:100%;"></div></div>
          <div class="stepper">
            ${[1, 2, 3, 4].map(() => `<div class="step-dot done">✓</div><div class="step-line done"></div>`).join("")}
            <div class="step-dot current">5</div>
          </div>
          <p class="progress-caption">Last task - finish strong.</p>
        </div>
        <section class="card transfer-check-panel">
          <div class="implementation-rating">
            <label for="implementation-rating">Use the slider to assess how well you implemented the last session's intention.</label>
            <input id="implementation-rating" type="range" min="0" max="10" value="5" />
            <div class="slider-labels"><span>not at all</span><span>very well</span></div>
          </div>
          <div class="implementation-plan">
            <h2>In the next exam practice or real exam I will implement the following:</h2>
            <div class="implementation-card-stack">
              <article class="implementation-card"><span>1</span><p>If I notice &ldquo;I&rsquo;m going to fail&rdquo; after seeing a hard question, then I will map the chain: cue &rarr; appraisal &rarr; body response &rarr; next action.</p></article>
              <article class="implementation-card"><span>2</span><p>If this exam feeling seems new or frightening, then I will ask: What is this similar to that I have already handled?</p></article>
              <article class="implementation-card"><span>3</span><p>If I am stuck for more than 90 seconds, then I will ask: &ldquo;Is my problem solving strategy still worth pursuing, or should I switch to another question and come back later?&rdquo;</p></article>
            </div>
          </div>
        </section>
        <div class="transfer-profile-action">${button("View training profile", "transfer-check-complete")}</div>
      </div>
    </main>
  `);
}

function renderPathway(): string {
  if (isExamResilienceDemo()) {
    const sessionStep = {
      intro: [1, "Begin today's first task", "start-pathway"],
      direction: [1, "Continue to in-out arrow game", "continue-frame"],
      bandwidth: [2, "Continue to hold-the-information task", "continue-memory"],
      memory: [3, "Continue to predict-the-next-step task", "continue-sr"],
      prediction: [4, "Continue to think-it-through task", "continue-reasoning"],
      recovery: [5, "Start implement-and-adapt check", "start-transfer-check"],
    }[state.pathwayCheckpoint] as [1 | 2 | 3 | 4 | 5, string, string];
    return renderExamSessionStep(sessionStep[0], sessionStep[1], sessionStep[2]);
  }
  return renderPathwayDiagram(state.pathwayCheckpoint);
}

function renderFeedbackDetails(): string {
  return shell(`
    <main class="app-main compact-main">
      <section class="stack-sm">
        <p class="ui-eyebrow">Partner feedback</p>
        <h1 class="ui-heading-lg">Pilot fit and evidence needs</h1>
        <p class="ui-body">These details help separate product interest from the validation work still required.</p>
      </section>
      <form class="feedback-form compact-feedback" data-form="feedback">
        <label>Where could this fit?
          <textarea name="fit" rows="2" placeholder="Programme, audience, pilot, or use case">${escapeHtml(state.feedbackDraft.fit)}</textarea>
        </label>
        <label>What evidence would you need?
          <textarea name="evidence" rows="2" placeholder="Reliability, transfer evidence, device validation...">${escapeHtml(state.feedbackDraft.evidence)}</textarea>
        </label>
        <label>Interest
          <select name="interest" required>
            <option value="">Choose one</option>
            ${["Discuss a pilot", "Discuss an affiliate relationship", "Discuss research collaboration", "Possibly, after further validation", "Not currently"].map((option) => `<option ${state.feedbackDraft.interest === option ? "selected" : ""}>${option}</option>`).join("")}
          </select>
        </label>
        <label>Contact email (optional)
          <input type="email" name="email" value="${escapeHtml(state.feedbackDraft.email)}" placeholder="Only for requested follow-up" />
        </label>
        <label class="honeypot" aria-hidden="true">Website
          <input type="text" name="website" tabindex="-1" autocomplete="off" />
        </label>
        ${state.statusMessage ? `<p class="form-status">${escapeHtml(state.statusMessage)}</p>` : ""}
        <button class="ui-button ui-button-primary" type="submit">Submit feedback</button>
      </form>
    </main>
  `, { title: "Partner Review", back: "back-feedback-details" });
}

function renderThanks(): string {
  return shell(`
    <main class="app-main hero-main">
      <div class="completion-mark">&#10003;</div>
      <section class="centre stack-sm">
        <p class="ui-eyebrow">Evaluation complete</p>
        <h1 class="ui-heading-xl">Thank you for reviewing this cognitive training app and providing feedback.</h1>
        <p class="hero-lead">For research collaborations, pilot studies, niche adaptations, licensing, or commercial partnership enquiries, please contact Dr Mark Ashton Smith at <a href="mailto:mark@iqmindware.com">mark@iqmindware.com</a>.</p>
      </section>
      <div class="stack-sm">
        ${button("Run the prototype again", "restart")}
      </div>
    </main>
  `);
}

function render(): void {
  switch (state.phase) {
    case "splash":
      app.innerHTML = renderSplash();
      break;
    case "welcome":
      app.innerHTML = renderWelcome();
      break;
    case "scope":
      app.innerHTML = renderScope();
      break;
    case "consent":
      app.innerHTML = renderConsent();
      break;
    case "science":
      app.innerHTML = renderScience();
      break;
    case "timing":
      app.innerHTML = renderTiming();
      break;
    case "preferences":
      app.innerHTML = renderPreferences();
      break;
    case "direction-tutorial":
      app.innerHTML = tutorialContent("abs_lr");
      break;
    case "frame-tutorial":
      app.innerHTML = tutorialContent("rel_inout");
      break;
    case "nback-intro":
      app.innerHTML = renderNBackIntro();
      break;
    case "nback-task":
      app.innerHTML = renderNBackTask();
      break;
    case "nback-transition":
      app.innerHTML = renderNBackTransition();
      break;
    case "nback-summary":
      app.innerHTML = renderNBackSummary();
      break;
    case "sr-intro":
      app.innerHTML = renderSrIntro();
      break;
    case "sr-task":
      app.innerHTML = renderSrTask();
      break;
    case "sr-summary":
      app.innerHTML = renderSrSummary();
      break;
    case "reasoning-intro":
      app.innerHTML = renderReasoningIntro();
      break;
    case "reasoning-task":
      app.innerHTML = renderReasoningTask();
      break;
    case "transfer-check":
      app.innerHTML = renderTransferCheck();
      break;
    case "dashboard":
      app.innerHTML = isExamResilienceDemo()
        ? renderExamResilienceDashboard()
        : renderPathwayDiagram("prediction", true);
      break;
    case "task":
      app.innerHTML = renderTask();
      break;
    case "results":
      app.innerHTML = renderResults();
      break;
    case "result-guidance":
      app.innerHTML = renderResultGuidance();
      break;
    case "partner-outputs":
      app.innerHTML = renderPartnerOutputs();
      break;
    case "pathway":
      app.innerHTML = renderPathway();
      break;
    case "feedback-details":
      app.innerHTML = renderFeedbackDetails();
      break;
    case "thanks":
      app.innerHTML = renderThanks();
      break;
  }
}

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
}

function responseForCurrentTrial(): Promise<Category | null> {
  responseStartedAt = performance.now();
  return new Promise((resolve) => {
    const timeout = window.setTimeout(() => {
      responseResolver = null;
      resolve(null);
    }, CAPACITY_RESPONSE_WINDOW_MS);
    responseResolver = (response) => {
      window.clearTimeout(timeout);
      responseResolver = null;
      resolve(response);
    };
  });
}

function playFeedback(correct: boolean): void {
  if (!state.soundEnabled) return;
  const context = new AudioContext();
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.frequency.value = correct ? 620 : 190;
  gain.gain.setValueAtTime(0.035, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.1);
  oscillator.connect(gain).connect(context.destination);
  oscillator.addEventListener("ended", () => {
    void context.close();
  });
  oscillator.start();
  oscillator.stop(context.currentTime + 0.1);
}

async function runTrial(
  trial: TrialDefinition,
  runId: number,
): Promise<TrialResult | null> {
  state.currentTrial = trial;
  state.taskStage = "fixation";
  state.currentCorrect = null;
  render();
  await wait(300 + Math.floor(Math.random() * 300));
  if (runId !== activeTaskRun) return null;

  state.taskStage = "stimulus";
  render();
  const medianFrame = state.timing?.medianFrameMs || 1000 / 60;
  const expectedFrames = Math.max(1, Math.round(trial.exposureMs / medianFrame));
  const hiddenAtStart = document.hidden;
  const exposure = await waitFrames(expectedFrames);
  if (runId !== activeTaskRun) return null;
  const actualExposure = exposure.end - exposure.start;

  state.taskStage = "mask";
  render();
  await wait(350);
  if (runId !== activeTaskRun) return null;

  state.taskStage = "response";
  render();
  const response = await responseForCurrentTrial();
  if (runId !== activeTaskRun) return null;
  const rtMs = response === null ? null : performance.now() - responseStartedAt;
  const isCorrect = response === trial.correctResponse;
  state.currentCorrect = isCorrect;
  state.taskStage = "feedback";
  render();
  playFeedback(isCorrect);
  await wait(220);
  if (runId !== activeTaskRun) return null;

  return {
    trial,
    response,
    isCorrect,
    rtMs,
    exposureMsActual: actualExposure,
    frameCountExpected: expectedFrames,
    frameCountObserved: exposure.observed,
    timingContaminated:
      hiddenAtStart ||
      document.hidden ||
      Math.abs(exposure.observed - expectedFrames) > 1 ||
      Math.abs(actualExposure - trial.exposureMs) > 12,
  };
}

async function runDemonstration(wrapper: WrapperId): Promise<void> {
  const runId = ++activeTaskRun;
  state.phase = "task";
  state.wrapper = wrapper;
  state.taskStage = "ready";
  state.taskTotal = isExamResilienceDemo() ? 6 : 18;
  state.taskIndex = 0;
  state.currentTrial = null;
  render();
  await wait(650);
  if (runId !== activeTaskRun) return;

  const results: TrialResult[] = [];
  const random = mulberry32(hashSeed(`${state.sessionSeed}:${wrapper}:adaptive`));
  for (let index = 0; index < state.taskTotal; index += 1) {
    const practice = index < 3;
    const condition = practice
      ? {
          ratio: index === 0 ? ("5:0" as const) : ("4:1" as const),
          exposureMs: 1000,
        }
      : chooseNextCondition(results, state.timing?.quality === "Limited", random);
    state.taskIndex = index;
    const trial = generateTrial(state.sessionSeed, wrapper, index, condition, practice);
    const result = await runTrial(trial, runId);
    if (!result || runId !== activeTaskRun) return;
    results.push(result);
    if (wrapper === "abs_lr") state.directionResults = [...results];
    else state.frameResults = [...results];
    await wait(180);
    if (runId !== activeTaskRun) return;
  }

  if (wrapper === "abs_lr") {
    state.directionResults = results;
    state.directionEstimate = estimateCapacity(results);
    if (isExamResilienceDemo()) {
      state.phase = "frame-tutorial";
    } else {
      state.pathwayCheckpoint = "direction";
      state.phase = "pathway";
    }
  } else {
    state.frameResults = results;
    state.frameEstimate = estimateCapacity(results);
    saveCompletedRun();
    state.pathwayCheckpoint = "bandwidth";
    state.phase = "pathway";
  }
  state.currentTrial = null;
  render();
}

function captureNBackMatch(): void {
  if (
    state.phase !== "nback-task" ||
    !state.nBackAcceptingResponse ||
    state.nBackResponseCaptured ||
    state.nBackIndex < state.nBackLevel
  ) {
    return;
  }
  state.nBackResponseCaptured = true;
  state.nBackResponseRtMs = performance.now() - state.nBackTrialStartedAt;
  render();
}

async function runRelationalNBackBlock(level: RelationalNBackLevel): Promise<void> {
  const runId = ++activeTaskRun;
  state.phase = "nback-task";
  state.nBackLevel = level;
  state.nBackTrials = generateRelationalNBackBlock(state.sessionSeed, level);
  state.nBackIndex = 0;
  state.nBackFeedback = "";
  render();

  const outcomes: RelationalNBackOutcome[] = [];
  for (let index = 0; index < state.nBackTrials.length; index += 1) {
    const trial = state.nBackTrials[index];
    state.nBackIndex = index;
    state.nBackStimulusVisible = true;
    state.nBackAcceptingResponse = index >= level;
    state.nBackResponseCaptured = false;
    state.nBackResponseRtMs = null;
    state.nBackFeedback = "";
    state.nBackTrialStartedAt = performance.now();
    render();

    await wait(RELATIONAL_NBACK_DISPLAY_MS);
    if (runId !== activeTaskRun) return;
    state.nBackStimulusVisible = false;
    render();
    await wait(RELATIONAL_NBACK_RESPONSE_MS - RELATIONAL_NBACK_DISPLAY_MS);
    if (runId !== activeTaskRun) return;

    state.nBackAcceptingResponse = false;
    const responded = state.nBackResponseCaptured;
    const classification = classifyRelationalNBackResponse(
      trial.isMatch,
      responded,
    );
    const isCorrect =
      classification === "hit" || classification === "correct_rejection";
    outcomes.push({
      trial,
      responded,
      isCorrect,
      classification,
      rtMs: state.nBackResponseRtMs,
    });
    if (level === 1) state.nBackOutcomes1 = [...outcomes];
    else state.nBackOutcomes2 = [...outcomes];
    state.nBackFeedback =
      index < level ? "Sequence ready" : isCorrect ? "Correct" : "Not this time";
    render();
    playFeedback(isCorrect);
    await wait(180);
    if (runId !== activeTaskRun) return;
  }

  state.nBackStimulusVisible = false;
  state.nBackAcceptingResponse = false;
  state.nBackResponseCaptured = false;
  state.nBackTrialStartedAt = 0;
  state.nBackResponseRtMs = null;
  state.nBackFeedback = "";
  if (level === 1) {
    state.nBackOutcomes1 = outcomes;
    state.phase = "nback-transition";
  } else {
    state.nBackOutcomes2 = outcomes;
    state.phase = "nback-summary";
  }
  render();
}

function waitForSrResponse(timeoutMs: number): Promise<SrResponse> {
  return new Promise((resolve) => {
    const timeout = window.setTimeout(() => {
      srResponseResolver = null;
      resolve("none");
    }, timeoutMs);
    srResponseResolver = (response) => {
      window.clearTimeout(timeout);
      srResponseResolver = null;
      resolve(response);
    };
  });
}

function captureSrResponse(response: SrResponse): void {
  if (
    state.phase !== "sr-task" ||
    !state.srAcceptingResponse ||
    state.srResponse !== null ||
    !srResponseResolver
  ) {
    return;
  }
  state.srResponse = response;
  srResponseResolver(response);
  render();
}

async function runSrBlock(): Promise<void> {
  const runId = ++activeTaskRun;
  state.phase = "sr-task";
  state.srEvents = generateSrBlock(state.sessionSeed);
  state.srOutcomes = [];
  state.srMetrics = null;
  render();

  for (let index = 0; index < state.srEvents.length; index += 1) {
    const event = state.srEvents[index];
    state.srIndex = index;
    state.srStage = "current";
    state.srAcceptingResponse = true;
    state.srResponse = null;
    state.srEventStartedAt = performance.now();
    render();
    const response = await waitForSrResponse(850);
    if (runId !== activeTaskRun) return;
    const rtMs =
      response === "none" ? null : performance.now() - state.srEventStartedAt;
    state.srAcceptingResponse = false;
    state.srResponse = response;
    const correct =
      event.eventType === "stream"
        ? response === "break"
          ? false
          : null
        : response === event.correctResponse;
    state.srOutcomes.push({ event, response, correct, rtMs });
    state.srStage = "feedback";
    render();
    if (response !== "none" && correct !== null) playFeedback(correct);
    await wait(180);
    if (runId !== activeTaskRun) return;
  }

  state.srAcceptingResponse = false;
  state.srResponse = null;
  state.srMetrics = scoreSrBlock(state.srOutcomes);
  state.phase = "sr-summary";
  render();
}

function startReasoningTask(): void {
  activeTaskRun += 1;
  window.clearTimeout(reasoningTimer);
  state.reasoningIndex = 0;
  state.reasoningOutcomes = [];
  state.reasoningMetrics = null;
  state.reasoningFeedback = "";
  state.reasoningAcceptingResponse = false;
  state.phase = "reasoning-task";
  render();
  beginReasoningItem();
}

function beginReasoningItem(): void {
  const runId = activeTaskRun;
  state.reasoningFeedback = "";
  state.reasoningAcceptingResponse = false;
  state.reasoningItemStartedAt = performance.now();
  render();
  window.setTimeout(() => {
    if (state.phase !== "reasoning-task" || runId !== activeTaskRun) return;
    state.reasoningAcceptingResponse = true;
    state.reasoningItemStartedAt = performance.now();
    render();
    reasoningTimer = window.setTimeout(() => {
      if (runId === activeTaskRun) void answerReasoningItem(null);
    }, 15000);
  }, 750);
}

async function answerReasoningItem(answer: ReasoningAnswer | null): Promise<void> {
  const runId = activeTaskRun;
  if (
    state.phase !== "reasoning-task" ||
    (!state.reasoningAcceptingResponse && answer !== null)
  ) {
    return;
  }
  window.clearTimeout(reasoningTimer);
  const items = activeReasoningItems();
  const item = items[state.reasoningIndex];
  const correct = answer === item.correctAnswer;
  state.reasoningAcceptingResponse = false;
  state.reasoningOutcomes.push({
    item,
    answer,
    correct,
    rtMs: performance.now() - state.reasoningItemStartedAt,
  });
  state.reasoningFeedback = correct
    ? item.feedback
    : answer === null
      ? "Time is up - continue to the next relation."
      : "Not quite - this conclusion does not follow as marked.";
  render();
  playFeedback(correct);
  await wait(1000);
  if (runId !== activeTaskRun) return;

  if (state.reasoningIndex + 1 >= items.length) {
    state.reasoningMetrics = scoreReasoning(
      state.reasoningOutcomes,
      state.srMetrics?.pathPredictionReadiness ?? 0,
    );
    saveCompletedTransferSession();
    if (isExamResilienceDemo()) {
      state.pathwayCheckpoint = "recovery";
      state.phase = "pathway";
    } else {
      state.phase = "dashboard";
    }
    render();
    return;
  }
  state.reasoningIndex += 1;
  beginReasoningItem();
}

function saveCompletedTransferSession(): void {
  const profile = transferProfile();
  if (!profile || !state.srMetrics || !state.reasoningMetrics) return;
  const oneBack = summarizeRelationalNBack(1, state.nBackOutcomes1);
  const twoBack = summarizeRelationalNBack(2, state.nBackOutcomes2);
  saveDemoSession({
    sessionId: state.sessionSeed,
    startedAt: state.sessionStartedAt,
    completedAt: new Date().toISOString(),
    selectedMarketMode: state.selectedMarketMode,
    transferReadiness: profile.transferReadiness,
    likelyBottleneck: profile.likelyBottleneck,
    layerResults: [
      {
        layer: "bandwidth",
        score: profile.bandwidthReadiness,
        metrics: {
          directionBps: state.directionEstimate?.capacityBps ?? null,
          frameBps: state.frameEstimate?.capacityBps ?? null,
          frameCostBps:
            state.directionEstimate && state.frameEstimate
              ? state.directionEstimate.capacityBps -
                state.frameEstimate.capacityBps
              : null,
        },
      },
      {
        layer: "frame_memory",
        score: profile.frameMemoryReadiness,
        metrics: {
          oneBackAccuracy: oneBack.accuracy,
          twoBackAccuracy: twoBack.accuracy,
        },
      },
      {
        layer: "path_prediction",
        score: profile.pathPredictionReadiness,
        metrics: {
          immediateAccuracy: state.srMetrics.immediateAccuracy,
          lookaheadAccuracy: state.srMetrics.lookaheadAccuracy,
          lureResistance: state.srMetrics.lureResistance,
          identityRoleTransfer: state.srMetrics.identityRoleTransfer,
          srHorizonScore: state.srMetrics.srHorizonScore,
        },
      },
      {
        layer: "reasoning_transfer",
        score: profile.reasoningTransferReadiness,
        metrics: {
          accuracy: state.reasoningMetrics.accuracy,
          identityAccuracy: state.reasoningMetrics.identityAccuracy,
          lureResistance: state.reasoningMetrics.lureResistance,
          nonsenseWrapperAccuracy:
            state.reasoningMetrics.nonsenseWrapperAccuracy,
          srToReasoningRecovery:
            state.reasoningMetrics.srToReasoningRecovery,
        },
      },
    ],
  });
}

function saveCompletedRun(): void {
  if (!state.timing || !state.directionEstimate || !state.frameEstimate) return;
  const run: StoredPrototypeRun = {
    id: state.sessionSeed,
    completedAt: new Date().toISOString(),
    timing: state.timing,
    direction: state.directionEstimate,
    frame: state.frameEstimate,
    frameCost: state.directionEstimate.capacityBps - state.frameEstimate.capacityBps,
    consentedTelemetry: state.consentedTelemetry,
  };
  saveRun(run);
  state.runs = loadRuns();
}

function skipCurrentTest(): void {
  activeTaskRun += 1;
  window.clearTimeout(reasoningTimer);
  reasoningTimer = 0;

  if (responseResolver) responseResolver(null);
  responseResolver = null;
  if (srResponseResolver) srResponseResolver("none");
  srResponseResolver = null;

  state.nBackAcceptingResponse = false;
  state.srAcceptingResponse = false;
  state.reasoningAcceptingResponse = false;

  if (state.phase === "task" && state.wrapper === "abs_lr") {
    state.skippedTasks.add("direction");
    state.currentTrial = null;
    if (isExamResilienceDemo()) {
      state.phase = "frame-tutorial";
    } else {
      state.pathwayCheckpoint = "direction";
      state.phase = "pathway";
    }
  } else if (state.phase === "task" && state.wrapper === "rel_inout") {
    state.skippedTasks.add("frame");
    state.currentTrial = null;
    state.pathwayCheckpoint = "bandwidth";
    state.phase = "pathway";
  } else if (state.phase === "nback-task") {
    state.skippedTasks.add("nback");
    state.nBackStimulusVisible = false;
    state.pathwayCheckpoint = "memory";
    state.phase = "pathway";
  } else if (state.phase === "sr-task") {
    state.skippedTasks.add("sr");
    state.srResponse = null;
    state.pathwayCheckpoint = "prediction";
    state.phase = "pathway";
  } else if (state.phase === "reasoning-task") {
    state.skippedTasks.add("reasoning");
    state.reasoningFeedback = "";
    if (isExamResilienceDemo()) {
      state.pathwayCheckpoint = "recovery";
      state.phase = "pathway";
    } else {
      state.phase = "dashboard";
    }
  }
  render();
}

function resetPrototype(): void {
  window.clearTimeout(reasoningTimer);
  srResponseResolver = null;
  state.phase = "splash";
  state.timing = null;
  state.directionResults = [];
  state.frameResults = [];
  state.directionEstimate = null;
  state.frameEstimate = null;
  state.currentTrial = null;
  state.nBackLevel = 1;
  state.nBackTrials = [];
  state.nBackIndex = 0;
  state.nBackStimulusVisible = false;
  state.nBackAcceptingResponse = false;
  state.nBackResponseCaptured = false;
  state.nBackTrialStartedAt = 0;
  state.nBackResponseRtMs = null;
  state.nBackFeedback = "";
  state.nBackOutcomes1 = [];
  state.nBackOutcomes2 = [];
  state.taskTotal = state.demoMode === "exam-resilience" ? 6 : 18;
  state.selectedMarketMode = state.demoMode === "exam-resilience" ? "exam" : "general";
  state.pathwayCheckpoint = "intro";
  state.srEvents = [];
  state.srIndex = 0;
  state.srStage = "current";
  state.srAcceptingResponse = false;
  state.srResponse = null;
  state.srEventStartedAt = 0;
  state.srOutcomes = [];
  state.srMetrics = null;
  state.reasoningIndex = 0;
  state.reasoningAcceptingResponse = false;
  state.reasoningFeedback = "";
  state.reasoningOutcomes = [];
  state.reasoningMetrics = null;
  state.reasoningItemStartedAt = 0;
  state.sessionStartedAt = new Date().toISOString();
  state.skippedTasks = new Set();
  state.sessionSeed = createSessionSeed();
  state.feedbackSubmitted = false;
  state.feedbackDraft = {
    fit: "",
    evidence: "",
    interest: "",
    email: "",
  };
  state.statusMessage = "";
  render();
}

app.addEventListener("click", async (event) => {
  const target = event.target as HTMLElement;
  const srResponseElement = target.closest<HTMLElement>("[data-sr-response]");
  if (srResponseElement) {
    captureSrResponse(srResponseElement.dataset.srResponse as SrResponse);
    return;
  }
  const reasoningElement = target.closest<HTMLElement>(
    "[data-reasoning-answer]",
  );
  if (reasoningElement) {
    void answerReasoningItem(
      reasoningElement.dataset.reasoningAnswer as ReasoningAnswer,
    );
    return;
  }
  const responseElement = target.closest<HTMLElement>("[data-response]");
  if (responseElement && responseResolver && state.taskStage === "response") {
    responseResolver(responseElement.dataset.response as Category);
    return;
  }

  const actionElement = target.closest<HTMLElement>("[data-action]");
  if (!actionElement) return;
  const action = actionElement.dataset.action;
  if (action === "skip-current-test") {
    skipCurrentTest();
    return;
  }
  if (action === "enter-demo") state.phase = "welcome";
  else if (action === "start-pathway") state.phase = "scope";
  else if (action === "view-pilot-outputs") state.phase = "partner-outputs";
  else if (action === "back-welcome") state.phase = "welcome";
  else if (action === "consent-private") state.consentedTelemetry = false;
  else if (action === "consent-telemetry") state.consentedTelemetry = true;
  else if (action === "scope-continue") {
    state.phase = isExamResilienceDemo() ? "science" : "consent";
  }
  else if (action === "back-consent") state.phase = "scope";
  else if (action === "consent-continue") state.phase = "science";
  else if (action === "back-scope") state.phase = "scope";
  else if (action === "science-continue") state.phase = "timing";
  else if (action === "back-science") state.phase = "science";
  else if (action === "run-timing" && !state.timingRunning) {
    state.timingRunning = true;
    state.timing = null;
    render();
    state.timing = await runTimingCheck();
    state.timingRunning = false;
  } else if (action === "timing-continue") state.phase = "preferences";
  else if (action === "back-timing") state.phase = "timing";
  else if (action === "toggle-sound") state.soundEnabled = !state.soundEnabled;
  else if (action === "preferences-continue") state.phase = "direction-tutorial";
  else if (action === "back-preferences") state.phase = "preferences";
  else if (action === "start-direction") {
    void runDemonstration("abs_lr");
    return;
  } else if (action === "back-direction-tutorial") state.phase = "direction-tutorial";
  else if (action === "start-frame") {
    void runDemonstration("rel_inout");
    return;
  } else if (action === "continue-frame") {
    state.phase = "frame-tutorial";
  } else if (action === "continue-memory") {
    state.phase = "nback-intro";
  } else if (action === "start-nback-1") {
    void runRelationalNBackBlock(1);
    return;
  } else if (action === "start-nback-2") {
    void runRelationalNBackBlock(2);
    return;
  } else if (action === "nback-match") {
    captureNBackMatch();
    return;
  } else if (action === "nback-summary-continue") {
    state.pathwayCheckpoint = "memory";
    state.phase = "pathway";
  } else if (action === "continue-sr") {
    state.phase = "sr-intro";
  } else if (action === "start-sr") {
    void runSrBlock();
    return;
  } else if (action === "sr-summary-continue") {
    state.pathwayCheckpoint = "prediction";
    state.phase = "pathway";
  } else if (action === "continue-reasoning") {
    state.phase = "reasoning-intro";
  } else if (action === "start-reasoning") {
    startReasoningTask();
    return;
  } else if (action === "start-transfer-check") {
    state.phase = "transfer-check";
  } else if (action === "transfer-check-complete") {
    state.phase = "dashboard";
  } else if (action === "dashboard-continue") {
    state.phase = "partner-outputs";
  } else if (action === "results-continue") state.phase = "result-guidance";
  else if (action === "back-results") state.phase = "results";
  else if (action === "guidance-continue") state.phase = "partner-outputs";
  else if (action === "back-guidance") state.phase = "results";
  else if (action === "outputs-continue") state.phase = "feedback-details";
  else if (action === "back-partner-outputs") {
    state.phase = state.reasoningMetrics
      ? "dashboard"
      : state.directionEstimate && state.frameEstimate
        ? "result-guidance"
        : "welcome";
  } else if (action === "back-feedback-details") state.phase = "partner-outputs";
  else if (action === "restart") {
    resetPrototype();
    return;
  } else if (action === "open-protocol") {
    window.open(
      "https://github.com/Mindware-Lab/IQ-Coach/blob/main/protocols/MVP-2026/ccc_protocol_specs.md",
      "_blank",
      "noopener",
    );
  }
  render();
});

app.addEventListener("change", (event) => {
  const target = event.target as HTMLSelectElement;
  if (!target.matches("[data-market-mode]")) return;
  state.selectedMarketMode = target.value as MarketMode;
  render();
});

app.addEventListener("submit", async (event) => {
  const form = event.target as HTMLFormElement;
  if (!(form instanceof HTMLFormElement)) return;
  event.preventDefault();
  if (form.dataset.form === "feedback") {
    const values = new FormData(form);
    state.feedbackDraft.fit = String(values.get("fit") || "");
    state.feedbackDraft.evidence = String(values.get("evidence") || "");
    state.feedbackDraft.interest = String(values.get("interest") || "");
    state.feedbackDraft.email = String(values.get("email") || "");
    const directionBps = state.directionEstimate?.capacityBps ?? 0;
    const frameBps = state.frameEstimate?.capacityBps ?? 0;
    const payload = {
      runId: state.sessionSeed,
      prototypeVersion: "partner-prototype-v1",
      fit: state.feedbackDraft.fit,
      evidence: state.feedbackDraft.evidence,
      interest: state.feedbackDraft.interest,
      email: state.feedbackDraft.email,
      timingQuality: state.timing?.quality || "Limited",
      directionBps,
      frameBps,
      frameCostBps: directionBps - frameBps,
      website: String(values.get("website") || ""),
    };
    state.statusMessage = "Submitting feedback...";
    render();
    try {
      await submitPartnerFeedback(payload);
    } catch (error) {
      state.statusMessage =
        error instanceof Error ? error.message : "Feedback could not be submitted.";
      state.phase = "feedback-details";
      render();
      return;
    }
    state.statusMessage = "";
    state.feedbackSubmitted = true;
    state.phase = "thanks";
    render();
  }
});

window.addEventListener("keydown", (event) => {
  if (
    state.phase === "sr-task" &&
    !event.repeat &&
    (event.key === " " || event.key.toLowerCase() === "b")
  ) {
    event.preventDefault();
    captureSrResponse("break");
    return;
  }
  if (state.phase === "sr-task" && !event.repeat) {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      captureSrResponse("left");
      return;
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      captureSrResponse("right");
      return;
    }
  }
  if (
    state.phase === "reasoning-task" &&
    state.reasoningAcceptingResponse &&
    !event.repeat
  ) {
    const answers: Record<string, ReasoningAnswer> = {
      "1": "valid",
      "2": "invalid",
      "3": "cannot_tell",
    };
    const answer = answers[event.key];
    if (answer) {
      event.preventDefault();
      void answerReasoningItem(answer);
      return;
    }
  }
  if (
    state.phase === "nback-task" &&
    !event.repeat &&
    (event.key === " " || event.key.toLowerCase() === "m")
  ) {
    event.preventDefault();
    captureNBackMatch();
    return;
  }
  if (!responseResolver || state.taskStage !== "response" || !state.wrapper) return;
  const [first, second] = categories(state.wrapper);
  if (event.repeat) return;
  if (event.key === "ArrowLeft") {
    event.preventDefault();
    responseResolver(first);
  } else if (event.key === "ArrowRight") {
    event.preventDefault();
    responseResolver(second);
  }
});

render();
