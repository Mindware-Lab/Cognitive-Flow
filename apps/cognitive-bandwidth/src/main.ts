import "./styles.css";
import { generateTrial } from "./generator";
import { vectorAngleDegrees, OCTAGON_POSITIONS } from "./geometry";
import { hashSeed, mulberry32 } from "./random";
import { chooseNextCondition, estimateCapacity } from "./scoring";
import { loadRuns, saveRun } from "./storage";
import {
  isSupabaseConfigured,
  sendMagicLink,
  submitPartnerFeedback,
} from "./supabaseClient";
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

type Phase =
  | "welcome"
  | "scope"
  | "science"
  | "timing"
  | "preferences"
  | "direction-tutorial"
  | "task"
  | "frame-tutorial"
  | "results"
  | "roadmap"
  | "feedback"
  | "thanks";

type TaskStage = "ready" | "fixation" | "stimulus" | "mask" | "response" | "feedback";

interface AppState {
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
  sessionSeed: string;
  statusMessage: string;
  feedbackSubmitted: boolean;
  runs: StoredPrototypeRun[];
}

const app = document.getElementById("app")!;

const state: AppState = {
  phase: "welcome",
  consentedTelemetry: false,
  timing: null,
  timingRunning: false,
  soundEnabled: false,
  wrapper: null,
  taskStage: "ready",
  currentTrial: null,
  currentCorrect: null,
  taskIndex: 0,
  taskTotal: 18,
  directionResults: [],
  frameResults: [],
  directionEstimate: null,
  frameEstimate: null,
  sessionSeed: createSessionSeed(),
  statusMessage: "",
  feedbackSubmitted: false,
  runs: loadRuns(),
};

let responseResolver: ((response: Category | null) => void) | null = null;
let responseStartedAt = 0;

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

function wrapperLabel(wrapper: WrapperId): string {
  return wrapper === "abs_lr" ? "Direction" : "Frame";
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
          ? `<button class="ui-icon-button" data-action="${backAction}" aria-label="Go back">&larr;</button>`
          : `<span aria-hidden="true"></span>`
      }
      <div>
        <p class="app-title">${escapeHtml(title)}</p>
        <p class="app-subtitle">${escapeHtml(subtitle)}</p>
      </div>
      <button class="ui-icon-button" data-action="toggle-sound" aria-label="Toggle sound">
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

function infoRow(index: string, title: string, body: string): string {
  return `
    <div class="info-row">
      <span class="info-index">${index}</span>
      <div><strong>${title}</strong><p>${body}</p></div>
    </div>
  `;
}

function renderWelcome(): string {
  return shell(`
    <main class="app-main hero-main">
      <div class="prototype-badge">CCC protocol prototype</div>
      <section class="hero-copy">
        <p class="ui-eyebrow">IQ Coach</p>
        <h1 class="ui-heading-xl">Measure and train cognitive control capacity.</h1>
        <p class="hero-lead">Try a short partner demonstration of standard and relational attention control using brief masked-arrow displays.</p>
      </section>
      <section class="ui-card how-card">
        <p class="ui-eyebrow">How it works</p>
        ${infoRow("1", "See brief arrows", "Five arrows appear briefly, then disappear behind masks.")}
        ${infoRow("2", "Choose the majority", "Respond to the direction most arrows were pointing.")}
        ${infoRow("3", "Review the concept", "See an illustrative estimate and the full development roadmap.")}
      </section>
      <div class="stack-sm">
        ${button("Try the prototype", "start")}
        ${button("Review the protocol", "open-protocol", "secondary")}
      </div>
      <p class="privacy-line">Private by default. Anonymous usability data is optional.</p>
    </main>
  `);
}

function renderScope(): string {
  return shell(`
    <main class="app-main">
      <section class="stack-md">
        <p class="ui-eyebrow">Before you begin</p>
        <h1 class="ui-heading-lg">A prototype, not an individual assessment</h1>
        <p class="ui-body">This experience demonstrates the proposed task, interface, and scoring architecture. Its measurements are preliminary and are not yet validated for individual assessment.</p>
      </section>
      <section class="ui-card scope-card">
        <h2 class="ui-card-title">Appropriate use</h2>
        <ul class="check-list">
          <li>Evaluate the task and product concept</li>
          <li>Consider programme or pilot fit</li>
          <li>Provide usability and development feedback</li>
        </ul>
        <h2 class="ui-card-title danger-title">Do not use it for</h2>
        <ul class="check-list is-boundary">
          <li>Diagnosis or clinical decisions</li>
          <li>Recruitment or employee assessment</li>
          <li>Education placement or inferred IQ</li>
        </ul>
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
      ${button("Continue", "scope-continue")}
    </main>
  `, { title: "Cognitive Bandwidth", back: "back-welcome" });
}

function renderScience(): string {
  return shell(`
    <main class="app-main">
      <section class="stack-sm">
        <p class="ui-eyebrow">Scientific basis and scope</p>
        <h1 class="ui-heading-lg">Two related control tasks</h1>
        <p class="ui-body">Direction Bandwidth uses MFT-M-style majority-direction methods. Frame Bandwidth applies the same majority operation relative to a centre and remains an experimental extension.</p>
      </section>
      <div class="measure-grid">
        <article class="measure-card">
          <div class="measure-icon">D</div>
          <div><h2>Direction Bandwidth</h2><p>Extract the majority absolute direction from a brief display.</p></div>
        </article>
        <article class="measure-card">
          <div class="measure-icon is-frame">F</div>
          <div><h2>Frame Bandwidth</h2><p>Judge majority direction relative to a centre or frame.</p></div>
        </article>
      </div>
      <section class="ui-tip-card">
        <span class="tip-symbol">i</span>
        <p>These are IQ-relevant component measures, not a full IQ test. A production score requires more trials and independent reliability evidence.</p>
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
              <div class="timing-quality is-${timing.quality.toLowerCase()}">Timing quality: ${timing.quality}</div>
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
    <main class="app-main">
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
  const example = generateTrial("tutorial", wrapper, direction ? 2 : 4, { ratio: "4:1", exposureMs: 1000 }, true);
  return shell(`
    <main class="app-main tutorial-main">
      <section class="centre stack-sm">
        <p class="ui-eyebrow">${direction ? "Direction" : "Frame"} tutorial</p>
        <h1 class="ui-heading-lg">${direction ? "Choose the majority direction" : "Judge direction relative to the centre"}</h1>
        <p class="ui-body">${
          direction
            ? "Five arrows appear briefly. Choose whether most pointed Left or Right."
            : "Out means away from the centre. In means towards the centre."
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
        <span>See brief arrows</span><span>Choose the majority</span><span>Accuracy before speed</span>
      </section>
      <div class="ui-tip-card">
        <span class="tip-symbol">i</span>
        <p>${direction ? "The arrows disappear behind masks before you respond." : "The arrows are static. Only their relation to the centre changes."}</p>
      </div>
      ${button(`Start ${direction ? "Direction" : "Frame"} practice`, direction ? "start-direction" : "start-frame")}
    </main>
  `, {
    title: `${direction ? "Direction" : "Frame"} Tutorial`,
    back: direction ? "back-preferences" : "back-direction-tutorial",
  });
}

function arrowSvg(trial: TrialDefinition): string {
  return trial.items
    .map((item) => {
      const angle = vectorAngleDegrees(item.vector);
      return `
        <g transform="translate(${item.position.x} ${item.position.y}) rotate(${angle})">
          <line x1="-4.4" y1="0" x2="3.2" y2="0" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" />
          <path d="M 1.1 -3.2 L 5 0 L 1.1 3.2 Z" fill="currentColor" />
        </g>
      `;
    })
    .join("");
}

function masksSvg(): string {
  return OCTAGON_POSITIONS.map(
    (position) =>
      `<rect x="${position.x - 4}" y="${position.y - 4}" width="8" height="8" rx="1.2" transform="rotate(45 ${position.x} ${position.y})" />`,
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
        <span>${wrapperLabel(wrapper)} demonstration</span>
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
      <p class="task-footnote">Click or use &larr; / &rarr;. ${state.taskIndex < 3 ? "Guided practice: no estimate is recorded." : "Prototype estimate: illustrative only."}</p>
    </main>
  `, { task: true });
}

function resultMetric(label: string, estimate: CapacityEstimate, relational = false): string {
  return `
    <article class="result-card">
      <span class="metric-label">${label}</span>
      <strong>${estimate.capacityBps.toFixed(1)}</strong>
      <span>${relational ? "relational " : ""}bits/sec</span>
      <small>${(estimate.accuracy * 100).toFixed(0)}% correct across ${estimate.validTrials} demonstration trials</small>
    </article>
  `;
}

function renderResults(): string {
  const direction = state.directionEstimate!;
  const frame = state.frameEstimate!;
  const frameCost = direction.capacityBps - frame.capacityBps;
  return shell(`
    <main class="app-main">
      <section class="centre stack-sm">
        <div class="completion-mark">✓</div>
        <p class="ui-eyebrow">Prototype session complete</p>
        <h1 class="ui-heading-lg">The demonstration estimates are ready</h1>
        <p class="ui-body">These values show how the proposed scoring interface works. The short session is insufficient for individual assessment.</p>
      </section>
      <div class="result-grid">
        ${resultMetric("Direction Bandwidth", direction)}
        ${resultMetric("Frame Bandwidth", frame, true)}
      </div>
      <section class="ui-card frame-cost-card">
        <div><span>Illustrative Frame Cost</span><strong>${frameCost.toFixed(1)} bits/sec</strong></div>
        <p>The current difference between standard direction control and direction judged relative to a centre.</p>
      </section>
      <div class="quality-strip">
        <span>Timing quality <strong>${state.timing?.quality ?? "Unknown"}</strong></span>
        <span>Reliability <strong>Illustrative only</strong></span>
      </div>
      <div class="boundary-note"><strong>Not validated for individual assessment.</strong> A production estimate uses longer adaptive sessions, server validation, confidence intervals, and independent reliability testing.</div>
      ${button("See the full product roadmap", "results-continue")}
    </main>
  `, { title: "Prototype Results" });
}

function renderRoadmap(): string {
  return shell(`
    <main class="app-main">
      <section class="stack-sm">
        <p class="ui-eyebrow">Development roadmap</p>
        <h1 class="ui-heading-lg">What the full product adds</h1>
        <p class="ui-body">This prototype establishes the task and partner experience. Production development adds measurement, security, and longitudinal layers.</p>
      </section>
      <section class="roadmap-list">
        ${infoRow("1", "Longer adaptive sessions", "Quick and Standard modes with better condition coverage.")}
        ${infoRow("2", "Canonical server scoring", "Validated submissions, immutable trials, and versioned estimates.")}
        ${infoRow("3", "Confidence and baselines", "Profile likelihood intervals, timing flags, and personal trends.")}
        ${infoRow("4", "Secure accounts", "Supabase email authentication, private results, export, and deletion.")}
        ${infoRow("5", "Validation programme", "Real-device timing, comprehension, reliability, and test-retest studies.")}
      </section>
      ${
        isSupabaseConfigured
          ? `
            <form class="ui-card sign-in-card" data-form="magic-link">
              <h2 class="ui-card-title">Optional partner access</h2>
              <p class="ui-body">Send a secure magic link to continue this evaluation across devices.</p>
              <input class="ui-input" type="email" name="email" placeholder="you@organisation.com" required />
              <button class="ui-button ui-button-secondary" type="submit">Send magic link</button>
              ${state.statusMessage ? `<p class="form-status">${escapeHtml(state.statusMessage)}</p>` : ""}
            </form>
          `
          : `<div class="config-note">Email sign-in is ready in the code and activates when Supabase environment variables are configured.</div>`
      }
      ${button("Share partner feedback", "roadmap-continue")}
    </main>
  `, { title: "Full Product", back: "back-results" });
}

function renderFeedback(): string {
  return shell(`
    <main class="app-main">
      <section class="stack-sm">
        <p class="ui-eyebrow">Partner feedback</p>
        <h1 class="ui-heading-lg">Should this move to a pilot?</h1>
        <p class="ui-body">Your response helps separate product interest from the scientific validation work still required.</p>
      </section>
      <form class="feedback-form" data-form="feedback">
        <label>Organisation or audience
          <select name="audience" required>
            <option value="">Choose one</option>
            <option>Education or training</option>
            <option>Corporate learning</option>
            <option>Research or university</option>
            <option>Cognitive performance practice</option>
            <option>Affiliate or referral partner</option>
            <option>Funding or product development</option>
            <option>Other</option>
          </select>
        </label>
        <fieldset>
          <legend>How clear were the tasks?</legend>
          <div class="rating-row">
            ${[1, 2, 3, 4, 5].map((value) => `<label><input type="radio" name="clarity" value="${value}" required><span>${value}</span></label>`).join("")}
          </div>
        </fieldset>
        <fieldset>
          <legend>How credible did the experience feel?</legend>
          <div class="rating-row">
            ${[1, 2, 3, 4, 5].map((value) => `<label><input type="radio" name="credibility" value="${value}" required><span>${value}</span></label>`).join("")}
          </div>
        </fieldset>
        <label>Where could this fit?
          <textarea name="fit" rows="3" placeholder="Programme, audience, pilot, or use case"></textarea>
        </label>
        <label>What evidence would you need?
          <textarea name="evidence" rows="3" placeholder="Reliability, norms, transfer evidence, device validation..."></textarea>
        </label>
        <label>Interest
          <select name="interest" required>
            <option value="">Choose one</option>
            <option>Discuss a pilot</option>
            <option>Discuss an affiliate relationship</option>
            <option>Discuss research collaboration</option>
            <option>Possibly, after further validation</option>
            <option>Not currently</option>
          </select>
        </label>
        <label>Contact email (optional)
          <input type="email" name="email" placeholder="Only for requested follow-up" />
        </label>
        <label class="honeypot" aria-hidden="true">Website
          <input type="text" name="website" tabindex="-1" autocomplete="off" />
        </label>
        ${state.statusMessage ? `<p class="form-status">${escapeHtml(state.statusMessage)}</p>` : ""}
        <button class="ui-button ui-button-primary" type="submit">Submit feedback</button>
      </form>
    </main>
  `, { title: "Partner Review", back: "back-roadmap" });
}

function renderThanks(): string {
  return shell(`
    <main class="app-main hero-main">
      <div class="completion-mark">✓</div>
      <section class="centre stack-sm">
        <p class="ui-eyebrow">Evaluation complete</p>
        <h1 class="ui-heading-xl">Thank you for reviewing Cognitive Bandwidth.</h1>
        <p class="hero-lead">The next decision should consider both partner demand and validation feasibility. Positive feedback alone does not establish measurement validity.</p>
      </section>
      <section class="ui-card">
        <h2 class="ui-card-title">Decision gate</h2>
        <div class="decision-grid">
          <span><strong>Revise</strong>Improve task, positioning, or burden.</span>
          <span><strong>Pilot</strong>Run supervised usability and reliability work.</span>
          <span><strong>Develop</strong>Fund the authenticated adaptive product.</span>
          <span><strong>Collaborate</strong>Define a research or integration partnership.</span>
        </div>
      </section>
      <div class="stack-sm">
        ${button("Run the prototype again", "restart")}
        ${button("Review implementation plan", "open-implementation", "secondary")}
      </div>
    </main>
  `);
}

function render(): void {
  switch (state.phase) {
    case "welcome":
      app.innerHTML = renderWelcome();
      break;
    case "scope":
      app.innerHTML = renderScope();
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
    case "task":
      app.innerHTML = renderTask();
      break;
    case "results":
      app.innerHTML = renderResults();
      break;
    case "roadmap":
      app.innerHTML = renderRoadmap();
      break;
    case "feedback":
      app.innerHTML = renderFeedback();
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
    }, 2500);
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

async function runTrial(trial: TrialDefinition): Promise<TrialResult> {
  state.currentTrial = trial;
  state.taskStage = "fixation";
  state.currentCorrect = null;
  render();
  await wait(300 + Math.floor(Math.random() * 300));

  state.taskStage = "stimulus";
  render();
  const medianFrame = state.timing?.medianFrameMs || 1000 / 60;
  const expectedFrames = Math.max(1, Math.round(trial.exposureMs / medianFrame));
  const hiddenAtStart = document.hidden;
  const exposure = await waitFrames(expectedFrames);
  const actualExposure = exposure.end - exposure.start;

  state.taskStage = "mask";
  render();
  await wait(350);

  state.taskStage = "response";
  render();
  const response = await responseForCurrentTrial();
  const rtMs = response === null ? null : performance.now() - responseStartedAt;
  const isCorrect = response === trial.correctResponse;
  state.currentCorrect = isCorrect;
  state.taskStage = "feedback";
  render();
  playFeedback(isCorrect);
  await wait(220);

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
      Math.abs(actualExposure - trial.exposureMs) > medianFrame * 1.5,
  };
}

async function runDemonstration(wrapper: WrapperId): Promise<void> {
  state.phase = "task";
  state.wrapper = wrapper;
  state.taskStage = "ready";
  state.taskIndex = 0;
  state.currentTrial = null;
  render();
  await wait(650);

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
    const result = await runTrial(trial);
    results.push(result);
    await wait(180);
  }

  if (wrapper === "abs_lr") {
    state.directionResults = results;
    state.directionEstimate = estimateCapacity(results);
    state.phase = "frame-tutorial";
  } else {
    state.frameResults = results;
    state.frameEstimate = estimateCapacity(results);
    saveCompletedRun();
    state.phase = "results";
  }
  state.currentTrial = null;
  render();
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

function resetPrototype(): void {
  state.phase = "welcome";
  state.timing = null;
  state.directionResults = [];
  state.frameResults = [];
  state.directionEstimate = null;
  state.frameEstimate = null;
  state.currentTrial = null;
  state.sessionSeed = createSessionSeed();
  state.feedbackSubmitted = false;
  state.statusMessage = "";
  render();
}

app.addEventListener("click", async (event) => {
  const target = event.target as HTMLElement;
  const responseElement = target.closest<HTMLElement>("[data-response]");
  if (responseElement && responseResolver && state.taskStage === "response") {
    responseResolver(responseElement.dataset.response as Category);
    return;
  }

  const actionElement = target.closest<HTMLElement>("[data-action]");
  if (!actionElement) return;
  const action = actionElement.dataset.action;
  if (action === "start") state.phase = "scope";
  else if (action === "back-welcome") state.phase = "welcome";
  else if (action === "consent-private") state.consentedTelemetry = false;
  else if (action === "consent-telemetry") state.consentedTelemetry = true;
  else if (action === "scope-continue") state.phase = "science";
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
  } else if (action === "results-continue") state.phase = "roadmap";
  else if (action === "back-results") state.phase = "results";
  else if (action === "roadmap-continue") state.phase = "feedback";
  else if (action === "back-roadmap") state.phase = "roadmap";
  else if (action === "restart") {
    resetPrototype();
    return;
  } else if (action === "open-protocol") {
    window.open(
      "https://github.com/Mindware-Lab/IQ-Coach/blob/main/protocols/MVP-2026/ccc_protocol_specs.md",
      "_blank",
      "noopener",
    );
  } else if (action === "open-implementation") {
    window.open(
      "https://github.com/Mindware-Lab/IQ-Coach/blob/main/apps/cognitive-bandwidth/IMPLEMENTATION_PLAN.md",
      "_blank",
      "noopener",
    );
  }
  render();
});

app.addEventListener("submit", async (event) => {
  const form = event.target as HTMLFormElement;
  if (!(form instanceof HTMLFormElement)) return;
  event.preventDefault();
  if (form.dataset.form === "magic-link") {
    const email = String(new FormData(form).get("email") || "").trim();
    state.statusMessage = "Sending secure link...";
    render();
    try {
      await sendMagicLink(email);
      state.statusMessage = "Check your email for the secure sign-in link.";
    } catch (error) {
      state.statusMessage = error instanceof Error ? error.message : "Could not send the sign-in link.";
    }
    render();
  } else if (form.dataset.form === "feedback") {
    const values = new FormData(form);
    const directionBps = state.directionEstimate?.capacityBps ?? 0;
    const frameBps = state.frameEstimate?.capacityBps ?? 0;
    const payload = {
      runId: state.sessionSeed,
      prototypeVersion: "partner-prototype-v1",
      audience: String(values.get("audience") || ""),
      clarity: Number(values.get("clarity")),
      credibility: Number(values.get("credibility")),
      fit: String(values.get("fit") || ""),
      evidence: String(values.get("evidence") || ""),
      interest: String(values.get("interest") || ""),
      email: String(values.get("email") || ""),
      timingQuality: state.timing?.quality || "Limited",
      directionBps,
      frameBps,
      frameCostBps: directionBps - frameBps,
      website: String(values.get("website") || ""),
    };
    state.statusMessage = isSupabaseConfigured ? "Submitting feedback..." : "";
    render();
    try {
      const submittedRemotely = await submitPartnerFeedback(payload);
      if (!submittedRemotely && state.consentedTelemetry) {
        localStorage.setItem(
          `iqcoach.cognitiveBandwidth.feedback.${state.sessionSeed}`,
          JSON.stringify({ ...payload, submittedAt: new Date().toISOString() }),
        );
      }
    } catch (error) {
      state.statusMessage =
        error instanceof Error ? error.message : "Feedback could not be submitted.";
      state.phase = "feedback";
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
