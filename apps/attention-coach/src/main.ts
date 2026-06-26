import "./styles.css";
import { createFreePlaySessionPlan, createSessionPlan, generateTrial, phaseIntro } from "./generator";
import { opticFlowAperturesForTrial, opticFlowMaskAperturesForTrial } from "./opticFlow";
import { NOMINAL_BANDS, PHASE_CELL, PHASE_NAMES, phaseStatusForPhase, transitionEventsForPhaseAdvance } from "./protocol";
import { createScoreSnapshot } from "./scoring";
import { conditionForLevel, INITIAL_STAIRCASE_LEVEL, nextStaircaseLevel } from "./staircase";
import { DEFAULT_PROGRESS, loadProgress, resetProgress, saveProgress, type LocalProgress } from "./storage";
import { runDeviceReadiness } from "./timing";
import { chooseNextPhase } from "./wap";
import type { CellEvidence, CellKey, Construct, SessionPlan, TrialDefinition, TrialResult } from "./types";

type View =
  | "welcome"
  | "readiness"
  | "tutorial"
  | "today"
  | "free-play"
  | "briefing"
  | "task"
  | "block-break"
  | "complete"
  | "progress"
  | "transfer"
  | "transfer-model"
  | "profile";

type TaskStage = "ready" | "fixation" | "stimulus" | "mask" | "response" | "feedback";
type StyleMode = "iq" | "legacy";

interface RuntimeState {
  view: View;
  progress: LocalProgress;
  sessionPlan: SessionPlan | null;
  activeBlockIndex: number;
  activeTrialIndex: number;
  blockResults: TrialResult[];
  sessionResults: TrialResult[];
  feedback: "correct" | "incorrect" | "";
  readinessRunning: boolean;
  taskStage: TaskStage;
  responseStartedAt: number;
  stageTimer: number | null;
  staircaseLevels: Record<string, number>;
  sessionMode: "protocol" | "free";
}

const app = document.querySelector<HTMLDivElement>("#app");
if (!app) throw new Error("Missing #app root.");
const appRoot = app;
const STYLE_MODE_KEY = "attentionCoachStyleModeV2";

function resolveStyleMode(): StyleMode {
  const queryStyle = new URLSearchParams(window.location.search).get("style");
  if (queryStyle === "legacy" || queryStyle === "iq") {
    window.localStorage.setItem(STYLE_MODE_KEY, queryStyle);
    return queryStyle;
  }
  const saved = window.localStorage.getItem(STYLE_MODE_KEY);
  return saved === "iq" ? "iq" : "legacy";
}

let styleMode: StyleMode = resolveStyleMode();

function applyStyleMode(mode: StyleMode): void {
  styleMode = mode;
  document.documentElement.dataset.styleGuide = mode;
  document.body.dataset.styleGuide = mode;
  appRoot.dataset.styleGuide = mode;
  window.localStorage.setItem(STYLE_MODE_KEY, mode);
}

applyStyleMode(styleMode);

function resolveInitialView(): View {
  const queryView = new URLSearchParams(window.location.search).get("view");
  const allowedViews: View[] = ["welcome", "today", "free-play", "progress", "transfer", "transfer-model", "profile"];
  return allowedViews.includes(queryView as View) ? (queryView as View) : "welcome";
}

let state: RuntimeState = {
  view: resolveInitialView(),
  progress: loadProgress(),
  sessionPlan: null,
  activeBlockIndex: 0,
  activeTrialIndex: 0,
  blockResults: [],
  sessionResults: [],
  feedback: "",
  readinessRunning: false,
  taskStage: "ready",
  responseStartedAt: 0,
  stageTimer: null,
  staircaseLevels: {},
  sessionMode: "protocol",
};

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "\"": "&quot;",
      "'": "&#39;",
    };
    return entities[char] || char;
  });
}

function button(label: string, action: string, variant: "primary" | "secondary" | "ghost" = "primary"): string {
  return `<button class="ui-button ui-button-${variant}" data-action="${action}">${escapeHtml(label)}</button>`;
}

function shell(content: string, options: { task?: boolean; splash?: boolean } = {}): string {
  if (options.task) return `<main class="task-shell">${content}</main>`;
  if (options.splash) return `<main class="app-shell is-splash">${content}</main>`;
  return `
    <main class="app-shell">
      <header class="app-brand-bar">
        <img src="/iqmindware-logo.png" alt="IQ Mindware" />
        <span>Attention Coach</span>
      </header>
      <div class="app-content">${content}</div>
    </main>
  `;
}

function currentSnapshot() {
  return (
    state.progress.latestSnapshot ||
    createScoreSnapshot({
      sessionNumber: state.progress.sessionNumber,
      activePhase: state.progress.currentPhase,
      phaseStatus: state.progress.phaseStatus,
      nominalBand: NOMINAL_BANDS[state.progress.currentPhase],
      evidence: state.progress.evidence,
      completedTransitions: state.progress.completedTransitions,
    })
  );
}

function scoreText(value: number | null, suffix = ""): string {
  return value === null ? "Calibrating" : `${value}${suffix}`;
}

function consumerStatus(value: string | null | undefined): string {
  const labels: Record<string, string> = {
    insufficient_data: "Calibrating",
    calibrating: "Calibrating",
    moderate_confidence: "Moderate confidence",
    high_confidence: "High confidence",
    timing_limited: "Timing limited",
    unstable_estimate: "Unstable today",
    improving: "Improving",
    steady: "Steady",
    developing: "Developing",
    variable_today: "Variable today",
    needs_more_data: "Needs more data",
    coming_up: "Coming up",
    available: "Available",
    not_enough_evidence: "Still calibrating",
    current_phase: "Current focus",
    ready_next_session: "Ready soon",
    on_track: "On track",
    lagging: "Still calibrating",
    active: "In progress",
    flattening: "Getting steadier",
    ready_to_swap: "Next challenge ready",
    extended_for_learning_curve: "More practice here",
    mixed: "Flexible practice",
    delayed: "Return check",
  };
  return labels[value || ""] || (value ? value.replaceAll("_", " ") : "Calibrating");
}

function confidenceCopy(value: string | null | undefined): string {
  const labels: Record<string, string> = {
    insufficient_data: "More sessions are needed before this score is stable.",
    calibrating: "More sessions are needed before this score is stable.",
    moderate_confidence: "Enough data are available for a useful training estimate.",
    high_confidence: "This score is based on repeated stable sessions.",
    timing_limited: "Device timing may have affected the estimate.",
    unstable_estimate: "Today's session looked unusually variable.",
  };
  return labels[value || ""] || "More sessions make this estimate more reliable.";
}

function adaptiveProgrammeCopy(): string {
  return "Typical pathway: roughly 20 sessions, depending on learning curve progression.";
}

function nextChallengeCopy(stateValue: string): string {
  if (stateValue === "ready_next_session") return "A new challenge is ready for your next guided session.";
  if (stateValue === "not_enough_evidence") {
    return "You will stay here a little longer so the learning curve becomes clearer.";
  }
  return "New challenges appear when your learning curve is stable.";
}

function transferComponentCopy(label: string, status: string): string {
  if (status !== "available") {
    if (label === "Motion Recovery") return "After moving-pattern practice.";
    if (label === "Relation Recovery") return "After relative direction practice.";
    if (label === "Mixed Flexibility") return "After mixed-format practice.";
    return "After a later return check.";
  }
  if (label === "Motion Recovery") return "Static skill carrying into motion.";
  if (label === "Relation Recovery") return "Relative direction carrying into motion.";
  if (label === "Mixed Flexibility") return "Switching across formats.";
  return "Carry-over after time away.";
}

function staircaseKey(trial: TrialDefinition): string {
  return `${trial.construct}:${trial.cellKey}`;
}

function levelForTrial(trial: TrialDefinition): number {
  return state.staircaseLevels[staircaseKey(trial)] ?? INITIAL_STAIRCASE_LEVEL;
}

function clearStageTimer(): void {
  if (state.stageTimer !== null) {
    window.clearTimeout(state.stageTimer);
    state.stageTimer = null;
  }
}

function schedule(delayMs: number, callback: () => void): void {
  clearStageTimer();
  state.stageTimer = window.setTimeout(() => {
    state.stageTimer = null;
    callback();
  }, delayMs);
}

function setTaskStage(stage: TaskStage): void {
  state.taskStage = stage;
  render();
}

function renderWelcome(): string {
  return shell(`
    <section class="splash-card">
      <div class="splash-network splash-network-top" aria-hidden="true"></div>
      <div class="splash-network splash-network-side" aria-hidden="true"></div>
      <section class="splash-brand">
        <img src="/iqmindware-logo.png" alt="IQ Mindware" class="splash-logo" />
        <div class="splash-title">
          <h1>Attention <span class="iq-highlight">Coach</span></h1>
          <p>Adaptive attention and <span class="iq-highlight">transfer</span> training</p>
        </div>
        <div class="splash-divider" aria-hidden="true"><span></span></div>
        <p class="splash-protocol">Powered by the Trident G Far Transfer Protocol&trade;</p>
      </section>
      <div class="splash-wave splash-wave-one" aria-hidden="true"></div>
      <div class="splash-wave splash-wave-two" aria-hidden="true"></div>
      <section class="splash-footer">
        ${button("Enter Attention Coach", "start-readiness")}
        <button class="splash-link" data-action="nav-free-play">Choose a game</button>
        <small>Training indicators only</small>
      </section>
    </section>
  `, { splash: true });
}

function renderReadiness(): string {
  const readiness = state.progress.deviceReadiness;
  return shell(`
    <section class="panel">
      <p class="ui-eyebrow">Quick setup</p>
      <h1>Device check</h1>
      <p class="ui-body">A short check makes sure the arrows, moving dots, tap controls, and keyboard controls are ready for training. If timing is unstable, scores will be shown with lower confidence.</p>
      ${
        readiness
          ? `<div class="readiness-grid">
              <span>Display rate</span><strong>${readiness.refreshRateHz.toFixed(1)} Hz</strong>
              <span>Score confidence</span><strong>${consumerStatus(readiness.quality === "poor" ? "timing_limited" : "moderate_confidence")}</strong>
              <span>Motion games</span><strong>${readiness.flowEligible ? "Ready" : "Timing limited"}</strong>
            </div>`
          : `<div class="preview-field"><div class="flow-preview" aria-hidden="true"></div><p>Arrow and motion previews will run during the check.</p></div>`
      }
      <div class="action-row">
        ${button(readiness ? "Continue to practice" : state.readinessRunning ? "Checking..." : "Run readiness check", "run-readiness")}
        ${readiness ? button("Skip to today", "nav-today", "secondary") : ""}
      </div>
    </section>
  `);
}

function renderTutorial(): string {
  return shell(`
    <section class="panel tutorial-grid">
      <div>
        <p class="ui-eyebrow">Practice</p>
        <h1>How the game works</h1>
        <p class="ui-body">Each display appears briefly, then a mask covers it. Choose the direction, motion, or direction-colour pair that appears most often.</p>
      </div>
      <div class="instruction-card">
        <strong>Attention Control</strong>
        <p>Pick out the important signal: left or right, out or in, or the matching motion pattern.</p>
      </div>
      <div class="instruction-card">
        <strong>Binding Focus</strong>
        <p>Keep direction and colour together, then choose the pair that appears most often.</p>
      </div>
      <div class="instruction-card">
        <strong>Adaptive path</strong>
        <p>${adaptiveProgrammeCopy()} New challenges appear when your <span class="iq-highlight">learning curve</span> is stable.</p>
      </div>
      <div class="action-row">
        ${button("Go to today", "nav-today")}
        ${button("Choose practice", "nav-free-play", "secondary")}
      </div>
    </section>
  `);
}

function renderToday(): string {
  const snapshot = currentSnapshot();
  const phase = state.progress.currentPhase;
  return shell(`
    <nav class="tabs">
      ${navButton("Today", "nav-today", true)}
      ${navButton("Train", "nav-free-play")}
      ${navButton("Progress", "nav-progress")}
      ${navButton("Transfer", "nav-transfer")}
      ${navButton("Profile", "nav-profile")}
    </nav>
    <section class="dashboard">
      <div class="today-hero">
        <p class="ui-eyebrow">Session ${state.progress.sessionNumber}</p>
        <h1>${PHASE_NAMES[phase]}</h1>
        <p>${adaptiveProgrammeCopy()} New challenges appear when your <span class="iq-highlight">learning curve</span> is stable.</p>
        <div class="action-row">
          ${button("Start today's session", "start-briefing")}
          ${button("Choose practice", "nav-free-play", "secondary")}
        </div>
      </div>
      <button class="score-card score-card-large" data-action="nav-transfer">
        <span>Transfer Score</span>
        <strong>${scoreText(snapshot.transfer.score, " / 100")}</strong>
        <small>${consumerStatus(snapshot.transfer.status)}</small>
      </button>
      <div class="score-card">
        <span>Attention Control</span>
        <strong>${snapshot.attentionControl.bitsPerSec === null ? "Calibrating" : `${snapshot.attentionControl.bitsPerSec.toFixed(1)} bits/sec`}</strong>
        <small>${consumerStatus(snapshot.attentionControl.trend)}</small>
      </div>
      <div class="score-card">
        <span>Binding Focus</span>
        <strong>${snapshot.bindingFocus.bitsPerSec === null ? "Calibrating" : `${snapshot.bindingFocus.bitsPerSec.toFixed(1)} bits/sec`}</strong>
        <small>${consumerStatus(snapshot.bindingFocus.lagFlag || snapshot.bindingFocus.trend)}</small>
      </div>
    </section>
  `);
}

const FREE_PLAY_CELLS: Array<{ cell: CellKey; label: string; detail: string }> = [
  { cell: "arrow_abs", label: "Static Patterns", detail: "Left or right majority arrows." },
  { cell: "flow_abs", label: "Moving Patterns", detail: "Left or right majority motion." },
  { cell: "arrow_rel", label: "Relative Direction", detail: "Out or in relative to the centre." },
  { cell: "flow_rel", label: "Relative Motion", detail: "Out or in motion around the centre." },
  { cell: "mixed", label: "Mixed Challenge", detail: "Formats switch from trial to trial." },
];

function renderFreePlay(): string {
  const card = (construct: Construct, cell: CellKey, label: string, detail: string) => `
    <button class="game-card" data-free-construct="${construct}" data-free-cell="${cell}">
      <span>${construct === "ACC" ? "Attention Control" : "Binding Focus"}</span>
      <strong>${escapeHtml(label)}</strong>
      <small>${escapeHtml(detail)}</small>
    </button>
  `;
  return shell(`
    <nav class="tabs">
      ${navButton("Today", "nav-today")}
      ${navButton("Train", "nav-free-play", true)}
      ${navButton("Progress", "nav-progress")}
      ${navButton("Transfer", "nav-transfer")}
      ${navButton("Profile", "nav-profile")}
    </nav>
    <section class="panel train-panel">
      <p class="ui-eyebrow">Train</p>
      <h1>Choose a practice mode</h1>
      <p class="ui-body">Practise any Attention Coach format directly, or return to the guided path from Today. Practice mode uses the same brief display, mask, response controls, and keyboard options, but it does not change your guided learning path.</p>
      <div class="score-card train-guided-card">
        <span>Guided path</span>
        <strong>${PHASE_NAMES[state.progress.currentPhase]}</strong>
        <small>${adaptiveProgrammeCopy()}</small>
        ${button("Start guided session", "start-briefing", "secondary")}
      </div>
      <div class="game-grid">
        ${FREE_PLAY_CELLS.map(({ cell, label, detail }) => card("ACC", cell, label, detail)).join("")}
        ${FREE_PLAY_CELLS.map(({ cell, label, detail }) => card("BSE", cell, label, detail)).join("")}
      </div>
    </section>
  `);
}

function navButton(label: string, action: string, active = false): string {
  return `<button class="${active ? "is-active" : ""}" data-action="${action}">${label}</button>`;
}

function renderBriefing(): string {
  const phase = state.progress.currentPhase;
  const intro = phaseIntro(phase);
  return shell(`
    <section class="panel">
      <p class="ui-eyebrow">${NOMINAL_BANDS[phase]}</p>
      <h1>${intro.title}</h1>
      <p class="ui-body">${intro.body}</p>
      <p class="ui-body">This guided session has four short blocks and usually takes about 5-10 minutes. New challenges appear when your learning curve is stable, not because a fixed session number has arrived.</p>
      <div class="mini-block-map">
        <span>Block 1</span><span>Attention Control</span>
        <span>Block 2</span><span>Attention Control</span>
        <span>Block 3</span><span>Progress check</span>
        <span>Block 4</span><span>Binding Focus</span>
      </div>
      <p class="claims-note">During play you will not see scores or difficulty. Focus only on the stimulus and response labels.</p>
      ${button("Begin block 1", "begin-session")}
    </section>
  `);
}

function activeTrial(): TrialDefinition | null {
  if (!state.sessionPlan) return null;
  const block = state.sessionPlan.miniBlocks[state.activeBlockIndex];
  if (!block) return null;
  const baseTrial = state.sessionPlan.trials.find(
    (trial) => trial.miniBlockId === block.id && trial.trialIndex === state.activeTrialIndex,
  );
  if (!baseTrial) return null;
  return generateTrial(
    baseTrial.sessionId,
    baseTrial.miniBlockId,
    baseTrial.trialIndex,
    baseTrial.construct,
    baseTrial.phase,
    baseTrial.cellKey,
    baseTrial.isReferenceRecheck,
    conditionForLevel(levelForTrial(baseTrial)),
  );
}

function renderTask(): string {
  const trial = activeTrial();
  const block = state.sessionPlan?.miniBlocks[state.activeBlockIndex];
  if (!trial || !block) return renderToday();
  const blockProgress = state.activeTrialIndex + 1;
  const responseEnabled = state.taskStage === "response";
  const prompt = responseEnabled
    ? trial.construct === "BSE"
      ? "Which direction-colour pair was most common?"
      : trial.cellKey === "flow_rel"
        ? "Was most motion expanding out or contracting in?"
        : trial.cellKey === "flow_abs"
          ? "Was most motion moving left or right?"
          : trial.cellKey.includes("rel")
            ? "Were most arrows pointing out or in?"
            : "Were most arrows pointing left or right?"
    : state.taskStage === "ready"
      ? "Focus on the centre."
      : "&nbsp;";
  return shell(`
    <section class="task-main">
      <div class="task-topline">
        <span>${escapeHtml(block.label)}</span>
        <span>${blockProgress} / 20</span>
      </div>
      <div class="task-progress"><span style="width:${((blockProgress - 1) / 20) * 100}%"></span></div>
        <p class="ui-eyebrow">Block ${state.activeBlockIndex + 1} of ${state.sessionPlan?.miniBlocks.length || 1} - ${escapeHtml(block.label)}</p>
      <section class="task-stage is-${state.taskStage}">
        <div class="task-stage-copy"><p>${prompt}</p></div>
        ${stimulusSvg(trial, state.taskStage)}
        <div class="task-feedback" aria-live="polite">
          ${
            state.taskStage === "feedback"
              ? `<strong class="is-${state.feedback}">${state.feedback === "correct" ? "Correct" : "Not this time"}</strong>`
              : ""
          }
        </div>
      </section>
      <div class="response-grid task-responses">
        ${trial.responseOptions
          .map((option, index) => `<button class="response-button" data-response="${escapeHtml(option)}" ${responseEnabled ? "" : "disabled"}>${responseButtonContent(option, index, trial.responseOptions.length)}</button>`)
          .join("")}
      </div>
      <p class="task-footnote">${trial.construct === "BSE" ? "Keep direction and colour together." : "Choose the majority direction."} Click, tap, or use the keyboard.</p>
      <div class="task-controls">
        <button class="task-skip-button" data-action="pause-session"><span>II</span> Pause</button>
        <button class="task-skip-button" data-action="toggle-sound"><span>S</span> Sound</button>
        <button class="task-skip-button" data-action="end-block"><span>E</span> End</button>
      </div>
    </section>
  `, { task: true });
}

function arrowPolygonPoints(): string {
  return "-5,-4 5,0 -5,4 -2,0";
}

function vectorAngleDegrees(vector: { x: number; y: number }): number {
  return (Math.atan2(vector.y, vector.x) * 180) / Math.PI;
}

function diamondPolygonPoints(position: { x: number; y: number }): string {
  const size = 7.2;
  return `${position.x},${position.y - size} ${position.x + size},${position.y} ${position.x},${position.y + size} ${position.x - size},${position.y}`;
}

function masksSvg(trial: TrialDefinition): string {
  return trial.items.map((item) => `<polygon points="${diamondPolygonPoints(item.position)}" />`).join("");
}

function safeSvgId(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]/g, "-");
}

function renderFixation(): string {
  return `<g class="fixation"><line x1="46.5" y1="50" x2="53.5" y2="50"/><line x1="50" y1="46.5" x2="50" y2="53.5"/></g>`;
}

function formatNumber(value: number): string {
  return value.toFixed(2);
}

function renderOpticFlowApertures(trial: TrialDefinition, clipRootId: string): string {
  return opticFlowAperturesForTrial(trial)
    .map((aperture) => {
      const clipId = `${clipRootId}-ap-${aperture.index}`;
      const dots = aperture.dots
        .map(
          (dot) => `
            <circle class="optic-dot" cx="${formatNumber(dot.x)}" cy="${formatNumber(dot.y)}" r="${formatNumber(dot.r)}" fill="${dot.color}" opacity="${formatNumber(dot.opacity)}">
              <animate attributeName="cx" values="${formatNumber(dot.fromX)};${formatNumber(dot.toX)}" dur="${dot.durationMs}ms" begin="${dot.delayMs}ms" repeatCount="indefinite" />
              <animate attributeName="cy" values="${formatNumber(dot.fromY)};${formatNumber(dot.toY)}" dur="${dot.durationMs}ms" begin="${dot.delayMs}ms" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.14;${formatNumber(dot.opacity)};0.16" dur="${dot.durationMs}ms" begin="${dot.delayMs}ms" repeatCount="indefinite" />
            </circle>
          `,
        )
        .join("");
      return `
        <defs>
          <clipPath id="${clipId}">
            <circle cx="${formatNumber(aperture.x)}" cy="${formatNumber(aperture.y)}" r="${formatNumber(aperture.radius)}" />
          </clipPath>
        </defs>
        <circle class="optic-aperture-bg" cx="${formatNumber(aperture.x)}" cy="${formatNumber(aperture.y)}" r="${formatNumber(aperture.radius)}" />
        <g clip-path="url(#${clipId})">
          <g class="optic-dot-group">${dots}</g>
        </g>
        <circle class="optic-aperture-shell" cx="${formatNumber(aperture.x)}" cy="${formatNumber(aperture.y)}" r="${formatNumber(aperture.radius)}" stroke="${aperture.color}" />
      `;
    })
    .join("");
}

function renderOpticFlowMaskApertures(trial: TrialDefinition, clipRootId: string): string {
  return opticFlowMaskAperturesForTrial(trial)
    .map((aperture) => {
      const clipId = `${clipRootId}-mask-${aperture.index}`;
      const dots = aperture.dots
        .map((dot) => {
          const size = dot.r * 1.75;
          const points = `${formatNumber(dot.x)},${formatNumber(dot.y - size)} ${formatNumber(dot.x + size)},${formatNumber(dot.y)} ${formatNumber(dot.x)},${formatNumber(dot.y + size)} ${formatNumber(dot.x - size)},${formatNumber(dot.y)}`;
          return `<polygon class="optic-mask-dot" points="${points}" opacity="${formatNumber(dot.opacity)}" />`;
        })
        .join("");
      return `
        <defs>
          <clipPath id="${clipId}">
            <circle cx="${formatNumber(aperture.x)}" cy="${formatNumber(aperture.y)}" r="${formatNumber(aperture.radius)}" />
          </clipPath>
        </defs>
        <circle class="optic-aperture-bg" cx="${formatNumber(aperture.x)}" cy="${formatNumber(aperture.y)}" r="${formatNumber(aperture.radius)}" />
        <g clip-path="url(#${clipId})">
          <g class="optic-mask-field">${dots}</g>
        </g>
        <circle class="optic-aperture-shell is-mask" cx="${formatNumber(aperture.x)}" cy="${formatNumber(aperture.y)}" r="${formatNumber(aperture.radius)}" />
      `;
    })
    .join("");
}

function flowStimulusSvg(trial: TrialDefinition, stage: TaskStage): string {
  const showFixation = stage === "ready" || stage === "fixation" || stage === "stimulus";
  const clipId = `optic-clip-${safeSvgId(trial.id)}`;
  return `
    <div class="stimulus-wrap is-flow" aria-label="Brief optic-flow display">
      <svg class="stimulus-svg optic-task-svg" viewBox="0 0 100 100" role="img" aria-hidden="true">
        <circle cx="50" cy="50" r="34" class="orbit-line" />
        ${stage === "stimulus" ? `<g class="optic-apertures">${renderOpticFlowApertures(trial, clipId)}</g>` : ""}
        ${stage === "mask" ? `<g class="optic-apertures is-mask">${renderOpticFlowMaskApertures(trial, clipId)}</g>` : ""}
        ${showFixation ? renderFixation() : ""}
      </svg>
    </div>
  `;
}

function stimulusSvg(trial: TrialDefinition, stage: TaskStage): string {
  if (trial.cellKey.includes("flow")) return flowStimulusSvg(trial, stage);

  const showFixation = stage === "ready" || stage === "fixation" || stage === "stimulus";
  const showArrows = stage === "stimulus";
  const showMasks = stage === "mask";
  const arrows = trial.items
    .map((item) => {
      const angle = vectorAngleDegrees(item.vector);
      const color = item.color === "yellow" ? "#d9a900" : "currentColor";
      return `
        <g transform="translate(${item.position.x} ${item.position.y}) rotate(${angle})">
          <polygon points="${arrowPolygonPoints()}" fill="${color}" />
        </g>
      `;
    })
    .join("");
  return `
    <div class="stimulus-wrap ${trial.cellKey.includes("flow") ? "is-flow" : ""}" aria-label="Brief arrow display">
      <svg class="stimulus-svg" viewBox="0 0 100 100" role="img" aria-hidden="true">
        <circle cx="50" cy="50" r="34" class="orbit-line" />
        ${showArrows ? `<g class="stimulus-arrows">${arrows}</g>` : ""}
        ${showMasks ? `<g class="stimulus-masks">${masksSvg(trial)}</g>` : ""}
        ${showFixation || trial.cellKey.includes("rel") ? renderFixation() : ""}
      </svg>
    </div>
  `;
}

function labelForResponse(option: string): string {
  return option.replace("_", " + ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function relationForResponse(option: string): string {
  return option.split("_")[0];
}

function responseArrowForOption(option: string, index: number, optionCount: number): { symbol: string; key: string; label: string } {
  const relation = relationForResponse(option);
  if (optionCount === 2) {
    if (relation === "left") return { symbol: "&larr;", key: "ArrowLeft", label: "Left arrow key" };
    if (relation === "right") return { symbol: "&rarr;", key: "ArrowRight", label: "Right arrow key" };
    if (relation === "up" || relation === "out") return { symbol: "&uarr;", key: "ArrowUp", label: "Up arrow key" };
    if (relation === "down" || relation === "in") return { symbol: "&darr;", key: "ArrowDown", label: "Down arrow key" };
    return index === 0
      ? { symbol: "&larr;", key: "ArrowLeft", label: "Left arrow key" }
      : { symbol: "&rarr;", key: "ArrowRight", label: "Right arrow key" };
  }
  const arrows = [
    { symbol: "&larr;", key: "ArrowLeft", label: "Left arrow key" },
    { symbol: "&uarr;", key: "ArrowUp", label: "Up arrow key" },
    { symbol: "&darr;", key: "ArrowDown", label: "Down arrow key" },
    { symbol: "&rarr;", key: "ArrowRight", label: "Right arrow key" },
  ];
  return arrows[index] || { symbol: `${index + 1}`, key: `${index + 1}`, label: `Number ${index + 1} key` };
}

function responseButtonContent(option: string, index: number, optionCount: number): string {
  const label = labelForResponse(option);
  if (optionCount === 2 || optionCount === 4) {
    const key = responseArrowForOption(option, index, optionCount);
    return `<span>${label}</span><kbd aria-label="${key.label}">${key.symbol}</kbd>`;
  }
  return `<span>${label}</span><kbd>${index + 1}</kbd>`;
}

function renderBlockBreak(): string {
  const nextBlock = state.sessionPlan?.miniBlocks[state.activeBlockIndex];
  if (!nextBlock) return renderComplete();
  return shell(`
    <section class="panel">
      <p class="ui-eyebrow">Block complete</p>
      <h1>${escapeHtml(nextBlock.label)}</h1>
      <p class="ui-body">${escapeHtml(nextBlock.instruction)}</p>
      ${button(`Start block ${nextBlock.index}`, "resume-block")}
    </section>
  `);
}

function renderComplete(): string {
  if (state.sessionMode === "free") {
    const correct = state.sessionResults.filter((result) => result.isCorrect).length;
    const total = state.sessionResults.length || 1;
    return shell(`
      <section class="panel">
        <p class="ui-eyebrow">Practice complete</p>
        <h1>${Math.round((correct / total) * 100)}% correct</h1>
        <p class="ui-body">This practice block used the same brief display, mask, response controls, and keyboard options as guided training. It did not change your guided learning path or transfer profile.</p>
        <div class="action-row">
          ${button("Choose another practice", "nav-free-play")}
          ${button("Return to Today", "finish-complete", "secondary")}
        </div>
      </section>
    `);
  }
  const snapshot = currentSnapshot();
  return shell(`
    <section class="panel">
      <p class="ui-eyebrow">Session complete</p>
      <h1>Nice work today</h1>
      <div class="result-grid">
        <div class="score-card">
          <span>Attention Control</span>
          <strong>${snapshot.attentionControl.bitsPerSec === null ? "Calibrating" : `${snapshot.attentionControl.bitsPerSec.toFixed(1)} bits/sec`}</strong>
          <small>${consumerStatus(snapshot.attentionControl.confidence)}</small>
        </div>
        <div class="score-card">
          <span>Binding Focus</span>
          <strong>${snapshot.bindingFocus.bitsPerSec === null ? "Calibrating" : `${snapshot.bindingFocus.bitsPerSec.toFixed(1)} bits/sec`}</strong>
          <small>${consumerStatus(snapshot.bindingFocus.lagFlag || snapshot.bindingFocus.confidence)}</small>
        </div>
      </div>
      <p class="ui-body">Today's note: ${confidenceCopy(snapshot.attentionControl.confidence)}</p>
      <p class="ui-body">Next: ${escapeHtml(snapshot.nextChallenge.label)}. ${nextChallengeCopy(snapshot.nextChallenge.state)}</p>
      <div class="action-row">
        ${button("View progress", "nav-progress")}
        ${button("View Transfer Score", "nav-transfer", "secondary")}
        ${button("Done", "finish-complete", "secondary")}
      </div>
    </section>
  `);
}

function renderTransfer(): string {
  const snapshot = currentSnapshot();
  const components = [
    snapshot.transfer.motionRecovery,
    snapshot.transfer.relationRecovery,
    snapshot.transfer.mixedFlexibility,
    snapshot.transfer.returnStrength,
  ];
  return shell(`
    <nav class="tabs">
      ${navButton("Today", "nav-today")}
      ${navButton("Train", "nav-free-play")}
      ${navButton("Progress", "nav-progress")}
      ${navButton("Transfer", "nav-transfer", true)}
      ${navButton("Profile", "nav-profile")}
    </nav>
    <section class="dashboard transfer-dashboard">
      <div class="today-hero compact-hero">
        <p class="ui-eyebrow">Transfer</p>
        <h1>${snapshot.transfer.score === null ? "Calibrating" : `${snapshot.transfer.score} / 100`}</h1>
        <p>${snapshot.transfer.score === null ? "Building the baseline for carry-over." : "Skill carrying across changing display formats."}</p>
        <div class="action-row">${button("How transfer works", "nav-transfer-model", "secondary")}</div>
      </div>
      ${components
        .map(
          (component) => `
            <div class="score-card">
              <span>${component.label}</span>
              <strong>${component.score === null ? consumerStatus(component.status) : `${component.score} / 100`}</strong>
              <small>${transferComponentCopy(component.label, component.status)}</small>
            </div>
          `,
        )
        .join("")}
      <p class="claims-note compact-note">Training indicator only. Not a diagnosis or official IQ score.</p>
    </section>
  `);
}

function renderTransferModel(): string {
  return shell(`
    <nav class="tabs">
      ${navButton("Today", "nav-today")}
      ${navButton("Train", "nav-free-play")}
      ${navButton("Progress", "nav-progress")}
      ${navButton("Transfer", "nav-transfer", true)}
      ${navButton("Profile", "nav-profile")}
    </nav>
    <section class="panel transfer-model-panel">
      <div class="transfer-model-copy">
        <p class="ui-eyebrow">Transfer model</p>
        <p class="transfer-protocol-note">Based on the Trident G Far Transfer Protocol.</p>
      </div>
      <figure class="transfer-model-figure">
        <img
          src="/attention-transfer-model.png"
          alt="Horizontal transfer route showing absolute arrows, absolute optic flow, relative arrows, mixed practice, delayed re-check, and the portable attention-control invariant."
          width="1200"
          height="978"
        />
      </figure>
      <div class="action-row">
        ${button("Back to Transfer", "nav-transfer")}
      </div>
    </section>
  `);
}

function renderProgress(): string {
  return shell(`
    <nav class="tabs">
      ${navButton("Today", "nav-today")}
      ${navButton("Train", "nav-free-play")}
      ${navButton("Progress", "nav-progress", true)}
      ${navButton("Transfer", "nav-transfer")}
      ${navButton("Profile", "nav-profile")}
    </nav>
    <section class="panel progress-panel">
      <p class="ui-eyebrow">Adaptive journey</p>
      <h1>Progress</h1>
      <p class="ui-body">Roughly 20 sessions; pace follows your learning curve.</p>
      <button class="score-card score-card-large progress-transfer-card" data-action="nav-transfer">
        <span>Transfer Score</span>
        <strong>${scoreText(currentSnapshot().transfer.score, " / 100")}</strong>
        <small>${consumerStatus(currentSnapshot().transfer.status)}</small>
      </button>
      <div class="journey-list">
        ${Object.entries(PHASE_NAMES)
          .map(([phase, name]) => `<span class="${phase === state.progress.currentPhase ? "is-current" : ""}">${name}<small>${phase === state.progress.currentPhase ? "Current focus" : "Coming up"}</small></span>`)
          .join("")}
      </div>
    </section>
  `);
}

function scoreForCell(cell: CellKey): string {
  const evidence = state.progress.evidence.find((item) => item.construct === "ACC" && item.cellKey === cell);
  if (!evidence || evidence.currentCapacityBps === null) return "Calibrating";
  const training = scoreText(Math.round(85 + evidence.currentCapacityBps * 5));
  return `${training} · ${evidence.currentCapacityBps.toFixed(1)} bits/sec`;
}

function renderProfile(): string {
  const snapshot = currentSnapshot();
  return shell(`
    <nav class="tabs">
      ${navButton("Today", "nav-today")}
      ${navButton("Train", "nav-free-play")}
      ${navButton("Progress", "nav-progress")}
      ${navButton("Transfer", "nav-transfer")}
      ${navButton("Profile", "nav-profile", true)}
    </nav>
    <section class="dashboard profile-dashboard">
      <div class="today-hero compact-hero">
        <p class="ui-eyebrow">Profile</p>
        <h1>Attention Profile</h1>
        <p>Scores, confidence, transfer and next focus.</p>
      </div>
      <button class="score-card score-card-large" data-action="nav-transfer"><span>Transfer Score</span><strong>${scoreText(snapshot.transfer.score, " / 100")}</strong><small>${consumerStatus(snapshot.transfer.status)}</small></button>
      <div class="score-card"><span>Attention Control</span><strong>${scoreText(snapshot.attentionControl.trainingScore)}</strong><small>${consumerStatus(snapshot.attentionControl.confidence)}</small></div>
      <div class="score-card"><span>Binding Focus</span><strong>${scoreText(snapshot.bindingFocus.trainingScore)}</strong><small>${consumerStatus(snapshot.bindingFocus.confidence)}</small></div>
      <div class="score-card"><span>Current focus</span><strong>${PHASE_NAMES[state.progress.currentPhase]}</strong><small>${consumerStatus(state.progress.phaseStatus)}</small></div>
      <div class="format-matrix">
        <span></span><strong>Simple direction</strong><strong>Relative direction</strong>
        <strong>Static patterns</strong><span>${scoreForCell("arrow_abs")}</span><span>${scoreForCell("arrow_rel")}</span>
        <strong>Moving patterns</strong><span>${scoreForCell("flow_abs")}</span><span>${scoreForCell("flow_rel")}</span>
      </div>
      <div class="score-card">
        <span>Display style</span>
        <strong>${styleMode === "iq" ? "Style guide" : "Legacy preview"}</strong>
        <small>Visual style only.</small>
        ${button(styleMode === "iq" ? "Use legacy look" : "Use style guide", "toggle-style", "secondary")}
      </div>
      <p class="claims-note compact-note">Training indicators only. More sessions make the profile more reliable.</p>
      ${button("Reset local demo progress", "reset-progress", "ghost")}
    </section>
  `);
}

function render(): void {
  const views: Record<View, () => string> = {
    welcome: renderWelcome,
    readiness: renderReadiness,
    tutorial: renderTutorial,
    today: renderToday,
    "free-play": renderFreePlay,
    briefing: renderBriefing,
    task: renderTask,
    "block-break": renderBlockBreak,
    complete: renderComplete,
    progress: renderProgress,
    transfer: renderTransfer,
    "transfer-model": renderTransferModel,
    profile: renderProfile,
  };
  appRoot.innerHTML = views[state.view]();
}

function go(view: View): void {
  state.view = view;
  render();
}

function beginSession(): void {
  clearStageTimer();
  const phase = state.progress.currentPhase;
  state.sessionPlan = createSessionPlan(
    state.progress.sessionNumber,
    phase,
    state.progress.phaseStatus,
    NOMINAL_BANDS[phase],
  );
  state.activeBlockIndex = 0;
  state.activeTrialIndex = 0;
  state.blockResults = [];
  state.sessionResults = [];
  state.feedback = "";
  state.taskStage = "ready";
  state.responseStartedAt = 0;
  state.staircaseLevels = {};
  state.sessionMode = "protocol";
  go("task");
  schedule(500, startTrialPresentation);
}

function beginFreePlay(construct: Construct, cellKey: CellKey): void {
  clearStageTimer();
  state.sessionPlan = createFreePlaySessionPlan(construct, cellKey);
  state.activeBlockIndex = 0;
  state.activeTrialIndex = 0;
  state.blockResults = [];
  state.sessionResults = [];
  state.feedback = "";
  state.taskStage = "ready";
  state.responseStartedAt = 0;
  state.staircaseLevels = {};
  state.sessionMode = "free";
  go("task");
  schedule(500, startTrialPresentation);
}

function startTrialPresentation(): void {
  const trial = activeTrial();
  if (!trial || state.view !== "task") return;
  setTaskStage("fixation");
  schedule(420, () => {
    setTaskStage("stimulus");
    schedule(trial.exposureMsRequested, () => {
      setTaskStage("mask");
      schedule(380, () => {
        state.responseStartedAt = performance.now();
        setTaskStage("response");
        schedule(2400, () => answerTrial(null));
      });
    });
  });
}

function continueAfterFeedback(): void {
  state.feedback = "";
  state.activeTrialIndex += 1;
  state.taskStage = "ready";
  state.responseStartedAt = 0;
  if (state.activeTrialIndex >= 20) {
    state.activeBlockIndex += 1;
    state.activeTrialIndex = 0;
    state.blockResults = [];
    if (state.activeBlockIndex >= (state.sessionPlan?.miniBlocks.length || 1)) {
      completeSession();
    } else {
      go("block-break");
    }
    return;
  }
  go("task");
  schedule(350, startTrialPresentation);
}

function endCurrentBlock(): void {
  clearStageTimer();
  state.feedback = "";
  state.taskStage = "ready";
  state.responseStartedAt = 0;
  if (state.sessionMode === "free") {
    completeSession();
    return;
  }
  state.activeBlockIndex += 1;
  state.activeTrialIndex = 0;
  state.blockResults = [];
  if (state.activeBlockIndex >= (state.sessionPlan?.miniBlocks.length || 1)) {
    completeSession();
  } else {
    go("block-break");
  }
}

function updateEvidence(results: TrialResult[]): CellEvidence[] {
  const existing = new Map<string, CellEvidence>();
  for (const item of state.progress.evidence) existing.set(`${item.construct}:${item.cellKey}`, { ...item });
  for (const result of results) {
    const key = `${result.trial.construct}:${result.trial.cellKey}`;
    const current =
      existing.get(key) ||
      ({
        construct: result.trial.construct,
        cellKey: result.trial.cellKey,
        validTrials: 0,
        rollingWindowCount: 0,
        recentCapacitySlope: 0.04,
        balancedAccuracy: 0,
        lapseRate: 0.12,
        timingQuality: "good",
        localAsymptoteBps: null,
        currentCapacityBps: null,
      } satisfies CellEvidence);
    current.validTrials += 1;
    const correctCount = Math.round(current.balancedAccuracy * Math.max(0, current.validTrials - 1)) + (result.isCorrect ? 1 : 0);
    current.balancedAccuracy = correctCount / current.validTrials;
    current.rollingWindowCount = Math.floor(current.validTrials / 40);
    current.currentCapacityBps = Math.max(1, 2.2 + current.balancedAccuracy * 4.2 - current.lapseRate);
    current.localAsymptoteBps = Math.max(current.localAsymptoteBps || 0, current.currentCapacityBps);
    current.recentCapacitySlope = current.validTrials >= 240 && current.balancedAccuracy >= 0.7 ? 0.01 : 0.04;
    if (result.timingQuality === "poor") current.timingQuality = "poor";
    else if (result.timingQuality === "acceptable" && current.timingQuality === "good") current.timingQuality = "acceptable";
    existing.set(key, current);
  }
  return Array.from(existing.values());
}

function completeSession(): void {
  if (state.sessionMode === "free") {
    go("complete");
    return;
  }
  const updatedEvidence = updateEvidence(state.sessionResults);
  const decision = chooseNextPhase({
    currentPhase: state.progress.currentPhase,
    sessionNumber: state.progress.sessionNumber,
    phaseStatus: state.progress.phaseStatus,
    completedTransitions: state.progress.completedTransitions,
    evidence: updatedEvidence,
  });
  const transitionKeys = decision.shouldTransition
    ? transitionEventsForPhaseAdvance(decision.fromPhase, decision.toPhase)
    : [];
  const completedTransitions = Array.from(new Set([...state.progress.completedTransitions, ...transitionKeys]));
  const nextPhase = decision.shouldTransition ? decision.toPhase : state.progress.currentPhase;
  const nextStatus = decision.shouldTransition ? phaseStatusForPhase(nextPhase) : decision.phaseStatus;
  const snapshot = createScoreSnapshot({
    sessionNumber: state.progress.sessionNumber,
    activePhase: nextPhase,
    phaseStatus: nextStatus,
    nominalBand: NOMINAL_BANDS[nextPhase],
    evidence: updatedEvidence,
    completedTransitions,
  });
  state.progress = {
    ...state.progress,
    sessionNumber: state.progress.sessionNumber + 1,
    currentPhase: nextPhase,
    phaseStatus: nextStatus,
    completedTransitions,
    evidence: updatedEvidence,
    latestSnapshot: snapshot,
  };
  saveProgress(state.progress);
  go("complete");
}

function answerTrial(response: string | null): void {
  if (state.taskStage !== "response") return;
  clearStageTimer();
  const trial = activeTrial();
  if (!trial) return;
  const isCorrect = response === trial.correctResponse;
  const currentLevel = levelForTrial(trial);
  state.staircaseLevels[staircaseKey(trial)] = nextStaircaseLevel(currentLevel, isCorrect);
  state.feedback = isCorrect ? "correct" : "incorrect";
  state.taskStage = "feedback";
  const responseAt = performance.now();
  const result: TrialResult = {
    trial,
    response,
    isCorrect,
    rtMs: response === null ? null : Math.round(responseAt - state.responseStartedAt),
    exposureMsActual: trial.exposureMsRequested,
    actualStimulusFrames: Math.max(1, Math.round(trial.exposureMsRequested / 16.67)),
    deviceRefreshRateEstimate: state.progress.deviceReadiness?.refreshRateHz || 60,
    droppedFrameCount: 0,
    timingQuality: state.progress.deviceReadiness?.quality || "good",
  };
  state.blockResults.push(result);
  state.sessionResults.push(result);
  render();
  schedule(260, continueAfterFeedback);
}

appRoot.addEventListener("click", async (event) => {
  const target = event.target as HTMLElement;
  const freeCard = target.closest<HTMLElement>("[data-free-construct][data-free-cell]");
  if (freeCard) {
    beginFreePlay(
      freeCard.dataset.freeConstruct as Construct,
      freeCard.dataset.freeCell as CellKey,
    );
    return;
  }
  const response = target.closest<HTMLButtonElement>("[data-response]");
  if (response) {
    answerTrial(response.dataset.response || "");
    return;
  }
  const action = target.closest<HTMLElement>("[data-action]")?.dataset.action;
  if (!action) return;
  if (action === "start-readiness") go("readiness");
  else if (action === "run-readiness") {
    state.readinessRunning = true;
    render();
    state.progress = { ...state.progress, deviceReadiness: await runDeviceReadiness() };
    saveProgress(state.progress);
    state.readinessRunning = false;
    go("tutorial");
  } else if (action === "nav-today") go("today");
  else if (action === "nav-free-play") go("free-play");
  else if (action === "nav-progress") go("progress");
  else if (action === "nav-transfer") go("transfer");
  else if (action === "nav-transfer-model") go("transfer-model");
  else if (action === "nav-profile") go("profile");
  else if (action === "start-briefing") go("briefing");
  else if (action === "begin-session") beginSession();
  else if (action === "resume-block") {
    state.taskStage = "ready";
    go("task");
    schedule(350, startTrialPresentation);
  }
  else if (action === "finish-complete") go("today");
  else if (action === "pause-session") {
    clearStageTimer();
    state.taskStage = "ready";
    go("block-break");
  }
  else if (action === "end-block") endCurrentBlock();
  else if (action === "toggle-sound") render();
  else if (action === "toggle-style") {
    applyStyleMode(styleMode === "iq" ? "legacy" : "iq");
    render();
  }
  else if (action === "reset-progress") {
    resetProgress();
    clearStageTimer();
    state = { ...state, progress: DEFAULT_PROGRESS, sessionPlan: null, sessionMode: "protocol" };
    go("welcome");
  }
});

window.addEventListener("keydown", (event) => {
  if (state.view !== "task" || state.taskStage !== "response" || event.repeat) return;
  const trial = activeTrial();
  if (!trial) return;
  if (trial.responseOptions.length === 2 || trial.responseOptions.length === 4) {
    const responseIndex = trial.responseOptions.findIndex(
      (option, index) => responseArrowForOption(option, index, trial.responseOptions.length).key === event.key,
    );
    if (responseIndex >= 0) {
      event.preventDefault();
      answerTrial(trial.responseOptions[responseIndex]);
    }
    return;
  }
  const number = Number(event.key);
  if (Number.isInteger(number) && number >= 1 && number <= trial.responseOptions.length) {
    event.preventDefault();
    answerTrial(trial.responseOptions[number - 1]);
  }
});

render();
