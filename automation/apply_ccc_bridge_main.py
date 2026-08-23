from pathlib import Path

path = Path("apps/cognitive-control-coach/src/main.ts")
text = path.read_text(encoding="utf-8")


def replace_once(label: str, old: str, new: str) -> None:
    global text
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected exactly one match, found {count}")
    text = text.replace(old, new, 1)


replace_once(
    "bridge imports",
    '''} from "./cccRealLifePractice";
import {
  displayTrainingScore,''',
    '''} from "./cccRealLifePractice";
import {
  CCC_BRIDGE_MOVE_COPY,
  bridgeDelayedProbeDue,
  markExplicitBridgePrompt,
  recordBridgeObservation,
  type CccBridgeMove,
  type CccBridgeObservationKind,
} from "./cccBridgeProgression";
import {
  CCC_BRIDGE_MOVE_OPTIONS,
  bridgeActionForMove,
  bridgeCueOptions,
  bridgeSessionEndModel,
  bridgeWelcomeProbeModel,
  changedContextOptions,
  moveForCueOption,
} from "./cccBridgeExperience";
import {
  bridgeStateForProgramme,
  evaluateAndStoreBridgeAdvance,
} from "./cccBridgeProgramme";
import {
  displayTrainingScore,''',
)

replace_once(
    "bridge transient state",
    '''let realLifeBarrierOpen = false;
let suppressRealLifeCheckIn = false;
''',
    '''let realLifeBarrierOpen = false;
let suppressRealLifeCheckIn = false;
type BridgeProbeResponse = "used" | "recalled" | "no" | "unsure";
let bridgeRetrievalSelectedMove: CccBridgeMove | null = null;
let bridgePersonalCueId: string | null = null;
let bridgePersonalMove: CccBridgeMove | null = null;
let bridgeChangedContextWorkflow: WorkflowChoice | null = null;
let bridgeProbeResponse: BridgeProbeResponse | null = null;
''',
)

replace_once(
    "bridge helpers",
    '''function realLifePracticeState() {
  programme.realLifePractice ||= {
    currentMission: null,
    reviewedCount: 0,
    attemptedCount: 0,
    helpedCount: 0,
  };
  return programme.realLifePractice;
}

function queueRealLifePracticeCloudSave(successMessage: string): void {''',
    '''function realLifePracticeState() {
  programme.realLifePractice ||= {
    currentMission: null,
    reviewedCount: 0,
    attemptedCount: 0,
    helpedCount: 0,
  };
  return programme.realLifePractice;
}

function bridgeProgressionState() {
  return bridgeStateForProgramme(programme);
}

function persistBridgeState(): void {
  saveCccProgramme(programme);
  saveJourney();
}

function maybeAdvanceBridge(now = new Date()): void {
  if (realLifePracticeState().currentMission?.status === "pending") return;
  const result = evaluateAndStoreBridgeAdvance(programme, now);
  if (!result.advanced) return;
  recordEvent("bridge_level_advanced", {
    previousLevel: result.previousLevel,
    level: result.level,
    ceiling: result.ceiling,
    reason: result.reason,
    scoreAffecting: false,
  }, null);
  persistBridgeState();
}

function recordBridgeEvidence(
  kind: CccBridgeObservationKind,
  input: Partial<{
    move: CccBridgeMove;
    selectedMove: CccBridgeMove;
    retrievalCorrect: boolean;
    spontaneousRecall: boolean;
    spontaneousUse: boolean;
    sourceWorkflow: WorkflowChoice;
    targetWorkflow: WorkflowChoice;
    helped: boolean;
    notes: string;
  }> = {},
  now = new Date(),
): void {
  programme.bridgeProgression = recordBridgeObservation(bridgeProgressionState(), {
    kind,
    move: input.move ?? null,
    selectedMove: input.selectedMove ?? null,
    retrievalCorrect: input.retrievalCorrect ?? null,
    spontaneousRecall: input.spontaneousRecall ?? null,
    spontaneousUse: input.spontaneousUse ?? null,
    sourceWorkflow: input.sourceWorkflow ?? null,
    targetWorkflow: input.targetWorkflow ?? null,
    helped: input.helped ?? null,
    notes: input.notes ?? null,
  }, now);
  recordEvent("bridge_observation", {
    kind,
    bridgeLevel: programme.bridgeProgression.level,
    move: input.move ?? null,
    selectedMove: input.selectedMove ?? null,
    retrievalCorrect: input.retrievalCorrect ?? null,
    spontaneousRecall: input.spontaneousRecall ?? null,
    spontaneousUse: input.spontaneousUse ?? null,
    sourceWorkflow: input.sourceWorkflow ?? null,
    targetWorkflow: input.targetWorkflow ?? null,
    helped: input.helped ?? null,
    scoreAffecting: false,
  }, null);
  persistBridgeState();
}

function bridgeProbeIsDue(): boolean {
  const state = bridgeProgressionState();
  if (state.level === "b4_faded") {
    if (state.fadedProbeCount > 0) return false;
    const latestSessionAt = programme.sessions.at(-1)?.completedAt || journey?.completedAt || null;
    if (!latestSessionAt) return false;
    return !state.lastBridgeReviewAt || Date.parse(latestSessionAt) > Date.parse(state.lastBridgeReviewAt);
  }
  if (state.level === "b6_delayed") {
    return state.delayedProbeCount === 0 && bridgeDelayedProbeDue(state);
  }
  return false;
}

function bridgeMoveButtons(action: string): string {
  return CCC_BRIDGE_MOVE_OPTIONS.map((option) => `
    <button class="ccc-real-life-option" data-action="${action}" data-move="${option.move}">
      <strong>${option.label}</strong><span>${option.question}</span>
    </button>`).join("");
}

function resetBridgeTransientChoices(): void {
  bridgeRetrievalSelectedMove = null;
  bridgePersonalCueId = null;
  bridgePersonalMove = null;
  bridgeChangedContextWorkflow = null;
  bridgeProbeResponse = null;
}

function queueRealLifePracticeCloudSave(successMessage: string): void {''',
)

replace_once(
    "real life check in",
    '''function renderRealLifeCheckIn(): string {
  const mission = realLifePracticeState().currentMission;
  if (!mission || mission.status !== "pending") return "";
  const move = REAL_LIFE_MOVE_COPY[mission.move];
  const preset = realLifePracticePresetForMission(mission);
  const choices = realLifeBarrierOpen
    ? (Object.entries(REAL_LIFE_BARRIER_COPY) as Array<[CccRealLifePracticeBarrier, string]>)
        .map(([value, label]) => `<button class="ccc-real-life-option" data-action="real-life-barrier" data-barrier="${value}">${label}</button>`)
        .join("")
    : (Object.entries(REAL_LIFE_OUTCOME_COPY) as Array<[CccRealLifePracticeOutcome, string]>)
        .map(([value, label]) => `<button class="ccc-real-life-option" data-action="real-life-outcome" data-outcome="${value}">${label}</button>`)
        .join("");
  return shell(`
    <section class="ccc-real-life-checkin-card">
      <div class="ccc-real-life-checkin-heading"><div><span class="ccc-kicker">Real-life check-in</span><h1>${realLifeBarrierOpen ? "What got in the way?" : "Did you try the strategy from last time?"}</h1></div><strong>${move.label}</strong></div>
      <aside class="ccc-real-life-mission-summary">
        <span>${escapeHtml(WORKFLOW_CHOICES[mission.workflow].label)}</span>
        <h2>${escapeHtml(preset.themeTitle)}</h2>
        <p>${escapeHtml(preset.missionAction)}</p>
      </aside>
      <div class="ccc-real-life-option-grid">${choices}</div>
      ${realLifeBarrierOpen ? `<button class="ccc-text-button" data-action="real-life-barrier-back">Back to the first question</button>` : ""}
      <p class="ccc-compact-boundary">This is a self-report about the strategy, kept separate from your training score.</p>
    </section>`, "ccc-real-life-checkin-view ccc-viewport-view");
}

function renderWelcome(): string {
  if (!suppressRealLifeCheckIn && realLifePracticeState().currentMission?.status === "pending") {
    return renderRealLifeCheckIn();
  }''',
    '''function renderRealLifeCheckIn(): string {
  const mission = realLifePracticeState().currentMission;
  if (!mission || mission.status !== "pending") return "";
  const bridge = bridgeProgressionState();
  const activeMove = (bridge.level === "b3_personalised" || bridge.level === "b5_changed_context") && bridge.personalMove
    ? bridge.personalMove
    : mission.move;
  const move = CCC_BRIDGE_MOVE_COPY[activeMove];
  const preset = realLifePracticePresetForMission(mission);
  const activeWorkflow = bridge.level === "b5_changed_context" && bridge.lastChangedContextWorkflow
    ? bridge.lastChangedContextWorkflow
    : mission.workflow;
  const activeCue = bridge.level === "b3_personalised" && bridge.personalCueClass
    ? bridge.personalCueClass
    : preset.missionCue;
  const activeAction = (bridge.level === "b3_personalised" || bridge.level === "b5_changed_context") && bridge.personalMove
    ? bridgeActionForMove(bridge.personalMove, activeWorkflow)
    : preset.missionAction;
  const choices = realLifeBarrierOpen
    ? (Object.entries(REAL_LIFE_BARRIER_COPY) as Array<[CccRealLifePracticeBarrier, string]>)
        .map(([value, label]) => `<button class="ccc-real-life-option" data-action="real-life-barrier" data-barrier="${value}">${label}</button>`)
        .join("")
    : (Object.entries(REAL_LIFE_OUTCOME_COPY) as Array<[CccRealLifePracticeOutcome, string]>)
        .map(([value, label]) => `<button class="ccc-real-life-option" data-action="real-life-outcome" data-outcome="${value}">${label}</button>`)
        .join("");
  return shell(`
    <section class="ccc-real-life-checkin-card">
      <div class="ccc-real-life-checkin-heading"><div><span class="ccc-kicker">Real-life check-in</span><h1>${realLifeBarrierOpen ? "What got in the way?" : "Did you try the method from last time?"}</h1></div><strong>${move.label}</strong></div>
      <aside class="ccc-real-life-mission-summary">
        <span>${escapeHtml(WORKFLOW_CHOICES[activeWorkflow].label)}</span>
        <h2>${escapeHtml(activeCue)}</h2>
        <p>${escapeHtml(activeAction)}</p>
        <small><strong>${move.label}</strong> — ${escapeHtml(move.definition)}</small>
      </aside>
      <div class="ccc-real-life-option-grid">${choices}</div>
      ${realLifeBarrierOpen ? `<button class="ccc-text-button" data-action="real-life-barrier-back">Back to the first question</button>` : ""}
      <p class="ccc-compact-boundary">This is a self-report about the method, kept separate from your training score.</p>
    </section>`, "ccc-real-life-checkin-view ccc-viewport-view");
}

function renderBridgeProbe(): string {
  const state = bridgeProgressionState();
  const model = bridgeWelcomeProbeModel(state);
  if (model.kind === "none") return "";
  if (bridgeProbeResponse === "used" || bridgeProbeResponse === "recalled") {
    return shell(`
      <section class="ccc-real-life-checkin-card">
        <div class="ccc-real-life-checkin-heading"><div><span class="ccc-kicker">${escapeHtml(model.kicker)}</span><h1>Which move came to mind?</h1></div></div>
        <p>${bridgeProbeResponse === "used" ? "Choose the method you used." : "Choose the method you remembered, even if you did not use it."}</p>
        <div class="ccc-real-life-option-grid">${bridgeMoveButtons("bridge-probe-move")}</div>
        <button class="ccc-text-button" data-action="bridge-probe-back">Back</button>
        <p class="ccc-compact-boundary">The move names appear only after you reported remembering a method. This remains separate from your training score.</p>
      </section>`, "ccc-real-life-checkin-view ccc-viewport-view");
  }
  return shell(`
    <section class="ccc-real-life-checkin-card">
      <div class="ccc-real-life-checkin-heading"><div><span class="ccc-kicker">${escapeHtml(model.kicker)}</span><h1>${escapeHtml(model.title)}</h1></div></div>
      <p>${escapeHtml(model.body)}</p>
      <div class="ccc-real-life-option-grid">
        <button class="ccc-real-life-option" data-action="bridge-probe-response" data-probe-response="used">Yes — and I used it</button>
        <button class="ccc-real-life-option" data-action="bridge-probe-response" data-probe-response="recalled">Yes — but I did not use it</button>
        <button class="ccc-real-life-option" data-action="bridge-probe-response" data-probe-response="no">No</button>
        <button class="ccc-real-life-option" data-action="bridge-probe-response" data-probe-response="unsure">Not sure</button>
      </div>
      <button class="ccc-text-button" data-action="bridge-probe-skip">Continue without reporting</button>
      <p class="ccc-compact-boundary">No answer changes your cognitive score or programme level.</p>
    </section>`, "ccc-real-life-checkin-view ccc-viewport-view");
}

function renderWelcome(): string {
  if (realLifePracticeState().currentMission?.status !== "pending") maybeAdvanceBridge();
  if (!suppressRealLifeCheckIn && realLifePracticeState().currentMission?.status === "pending") {
    return renderRealLifeCheckIn();
  }
  if (!suppressRealLifeCheckIn && bridgeProbeIsDue()) {
    return renderBridgeProbe();
  }''',
)

replace_once(
    "complete reconnect",
    '''function renderCompleteReconnect(): string {
  if (!journey) return renderWelcome();
  const practice = finalRealLifePractice();
  if (!practice) return renderWelcome();
  const pendingMission = realLifePracticeState().currentMission?.status === "pending"
    ? realLifePracticeState().currentMission
    : null;
  const pendingPreset = pendingMission ? realLifePracticePresetForMission(pendingMission) : null;
  return shell(`
    <section class="ccc-complete-card ccc-reconnect-view">
      <span class="ccc-kicker">One strategy to test</span>
      <h1>${pendingMission ? "Choose which one mission to keep active." : "Turn today's theme into one thing to try."}</h1>
      <p class="ccc-reconnect-lead">${pendingMission
        ? "Your earlier mission is still open. You can keep it, or explicitly replace it with today's cue-action plan."
        : `Use this once in ${WORKFLOW_CHOICES[journey.workflowChoice].label.toLowerCase()}, then judge the result there.`}</p>
      ${renderRealLifeMissionLens(practice.preset)}
      ${pendingMission && pendingPreset ? `<aside class="ccc-real-life-mission-summary">
        <span>Current mission still active</span>
        <h2>${escapeHtml(pendingPreset.themeTitle)}</h2>
        <p>${escapeHtml(pendingPreset.missionAction)}</p>
      </aside>` : ""}
      <p class="ccc-compact-boundary"><strong>This is not a transfer score.</strong> Your next check-in records only what you noticed in the real task.</p>
      <div class="ccc-actions">
        ${pendingMission
          ? `<button class="ccc-button ccc-button-primary" data-action="keep-real-life-practice">Keep current mission</button>
             <button class="ccc-button ccc-button-secondary" data-action="replace-real-life-practice">Replace with today's mission</button>
             <button class="ccc-button ccc-button-quiet" data-action="return-home">Maybe later</button>`
          : `<button class="ccc-button ccc-button-primary" data-action="commit-real-life-practice">I’ll try this once</button>
             <button class="ccc-button ccc-button-quiet" data-action="return-home">Maybe later</button>`}
      </div>
    </section>`, "ccc-reconnect-screen ccc-viewport-view");
}''',
    '''function renderCompleteReconnect(): string {
  if (!journey) return renderWelcome();
  const practice = finalRealLifePractice();
  if (!practice) return renderWelcome();
  const pendingMission = realLifePracticeState().currentMission?.status === "pending"
    ? realLifePracticeState().currentMission
    : null;
  const pendingPreset = pendingMission ? realLifePracticePresetForMission(pendingMission) : null;
  if (pendingMission && pendingPreset) {
    return shell(`
      <section class="ccc-complete-card ccc-reconnect-view">
        <span class="ccc-kicker">One method at a time</span>
        <h1>Choose which mission to keep active.</h1>
        <p class="ccc-reconnect-lead">Your earlier mission is still open. Keep it, or explicitly replace it with today's cue-action plan.</p>
        ${renderRealLifeMissionLens(practice.preset)}
        <aside class="ccc-real-life-mission-summary">
          <span>Current mission still active</span>
          <h2>${escapeHtml(pendingPreset.themeTitle)}</h2>
          <p>${escapeHtml(pendingPreset.missionAction)}</p>
        </aside>
        <p class="ccc-compact-boundary"><strong>This is not a transfer score.</strong> Real-life reports stay separate from task performance.</p>
        <div class="ccc-actions">
          <button class="ccc-button ccc-button-primary" data-action="keep-real-life-practice">Keep current mission</button>
          <button class="ccc-button ccc-button-secondary" data-action="replace-real-life-practice">Replace with today's mission</button>
          <button class="ccc-button ccc-button-quiet" data-action="return-home">Maybe later</button>
        </div>
      </section>`, "ccc-reconnect-screen ccc-viewport-view");
  }

  const bridge = bridgeProgressionState();
  const model = bridgeSessionEndModel(bridge);
  const expectedMove = practice.preset.move;
  const expectedCopy = CCC_BRIDGE_MOVE_COPY[expectedMove];

  if (model.kind === "no_new_mission" || model.kind === "no_new_delayed_mission") {
    return shell(`
      <section class="ccc-complete-card ccc-reconnect-view">
        <span class="ccc-kicker">${escapeHtml(model.kicker)}</span>
        <h1>${escapeHtml(model.title)}</h1>
        <p class="ccc-reconnect-lead">${escapeHtml(model.body)}</p>
        <p class="ccc-compact-boundary"><strong>No extra task is required.</strong> Less prompting is part of the real-life practice progression.</p>
        <div class="ccc-actions"><button class="ccc-button ccc-button-primary" data-action="return-home">Return home</button></div>
      </section>`, "ccc-reconnect-screen ccc-viewport-view");
  }

  if (model.kind === "retrieval_mission") {
    if (!bridgeRetrievalSelectedMove) {
      return shell(`
        <section class="ccc-complete-card ccc-reconnect-view">
          <span class="ccc-kicker">${escapeHtml(model.kicker)}</span>
          <h1>${escapeHtml(model.title)}</h1>
          <p class="ccc-reconnect-lead">${escapeHtml(practice.preset.missionCue)}</p>
          <div class="ccc-real-life-option-grid">${bridgeMoveButtons("bridge-retrieval-move")}</div>
          <p class="ccc-compact-boundary">Choose before the app explains the suggested move. This does not affect your training score.</p>
        </section>`, "ccc-reconnect-screen ccc-viewport-view");
    }
    const selectedCorrect = bridgeRetrievalSelectedMove === expectedMove;
    return shell(`
      <section class="ccc-complete-card ccc-reconnect-view">
        <span class="ccc-kicker">${selectedCorrect ? "That fits" : "Suggested move"}</span>
        <h1>${expectedCopy.label} — ${escapeHtml(expectedCopy.definition)}</h1>
        <p class="ccc-reconnect-lead">${selectedCorrect
          ? `You recovered the move from the cue. ${expectedCopy.question}`
          : `This situation mainly calls for ${expectedCopy.label.toUpperCase()}. ${expectedCopy.question}`}</p>
        ${renderRealLifeMissionLens(practice.preset)}
        <div class="ccc-actions">
          <button class="ccc-button ccc-button-primary" data-action="commit-bridge-retrieval-mission">I’ll try this once</button>
          <button class="ccc-button ccc-button-quiet" data-action="return-home">Maybe later</button>
        </div>
      </section>`, "ccc-reconnect-screen ccc-viewport-view");
  }

  if (model.kind === "personalise_mission") {
    const cues = bridgeCueOptions(journey.workflowChoice);
    const chosenCue = bridgePersonalCueId ? cues.find((cue) => cue.id === bridgePersonalCueId) || null : null;
    if (!chosenCue) {
      return shell(`
        <section class="ccc-complete-card ccc-reconnect-view">
          <span class="ccc-kicker">${escapeHtml(model.kicker)}</span>
          <h1>${escapeHtml(model.title)}</h1>
          <p class="ccc-reconnect-lead">${escapeHtml(model.body)}</p>
          <div class="ccc-real-life-option-grid">${cues.map((cue) => `<button class="ccc-real-life-option" data-action="bridge-personal-cue" data-cue-id="${cue.id}"><strong>${escapeHtml(cue.label)}</strong><span>${escapeHtml(cue.detail)}</span></button>`).join("")}</div>
          <p class="ccc-compact-boundary">Choose a recurring situation, not an idealised one.</p>
        </section>`, "ccc-reconnect-screen ccc-viewport-view");
    }
    if (!bridgePersonalMove) {
      return shell(`
        <section class="ccc-complete-card ccc-reconnect-view">
          <span class="ccc-kicker">Your cue</span>
          <h1>${escapeHtml(chosenCue.label)}</h1>
          <p class="ccc-reconnect-lead">Which CCC move should this situation bring to mind?</p>
          <div class="ccc-real-life-option-grid">${bridgeMoveButtons("bridge-personal-move")}</div>
          <button class="ccc-text-button" data-action="bridge-personal-cue-back">Choose a different situation</button>
        </section>`, "ccc-reconnect-screen ccc-viewport-view");
    }
    const moveCopy = CCC_BRIDGE_MOVE_COPY[bridgePersonalMove];
    return shell(`
      <section class="ccc-complete-card ccc-reconnect-view">
        <span class="ccc-kicker">Personal cue ready</span>
        <h1>${moveCopy.label} — ${escapeHtml(moveCopy.definition)}</h1>
        <aside class="ccc-real-life-mission-summary">
          <span>If this happens</span><h2>${escapeHtml(chosenCue.label)}</h2>
          <p>${escapeHtml(bridgeActionForMove(bridgePersonalMove, journey.workflowChoice))}</p>
        </aside>
        <p class="ccc-compact-boundary">Try the cue–move link once. It stays separate from your cognitive score.</p>
        <div class="ccc-actions">
          <button class="ccc-button ccc-button-primary" data-action="commit-bridge-personal-mission">I’ll try this once</button>
          <button class="ccc-button ccc-button-quiet" data-action="return-home">Maybe later</button>
        </div>
      </section>`, "ccc-reconnect-screen ccc-viewport-view");
  }

  if (model.kind === "changed_context_mission") {
    const move = bridge.personalMove || expectedMove;
    const moveCopy = CCC_BRIDGE_MOVE_COPY[move];
    const sourceWorkflow = bridge.sourceWorkflow || journey.workflowChoice;
    const targets = changedContextOptions(sourceWorkflow);
    if (!bridgeChangedContextWorkflow) {
      return shell(`
        <section class="ccc-complete-card ccc-reconnect-view">
          <span class="ccc-kicker">${escapeHtml(model.kicker)}</span>
          <h1>${escapeHtml(model.title)}</h1>
          <p class="ccc-reconnect-lead"><strong>${moveCopy.label}</strong> stays the same. Choose another setting where it could be useful.</p>
          <div class="ccc-real-life-option-grid">${targets.map((target) => `<button class="ccc-real-life-option" data-action="bridge-changed-context" data-workflow="${target.workflow}"><strong>${escapeHtml(target.label)}</strong><span>${escapeHtml(target.example)}</span></button>`).join("")}</div>
          <p class="ccc-compact-boundary">Different situation; same underlying move.</p>
        </section>`, "ccc-reconnect-screen ccc-viewport-view");
    }
    return shell(`
      <section class="ccc-complete-card ccc-reconnect-view">
        <span class="ccc-kicker">Changed-context mission</span>
        <h1>${moveCopy.label} — ${escapeHtml(moveCopy.definition)}</h1>
        <aside class="ccc-real-life-mission-summary">
          <span>${escapeHtml(WORKFLOW_CHOICES[bridgeChangedContextWorkflow].label)}</span>
          <h2>Same move, different situation</h2>
          <p>${escapeHtml(bridgeActionForMove(move, bridgeChangedContextWorkflow))}</p>
        </aside>
        <div class="ccc-actions">
          <button class="ccc-button ccc-button-primary" data-action="commit-bridge-changed-context-mission">I’ll try this once</button>
          <button class="ccc-button ccc-button-quiet" data-action="return-home">Maybe later</button>
        </div>
      </section>`, "ccc-reconnect-screen ccc-viewport-view");
  }

  return shell(`
    <section class="ccc-complete-card ccc-reconnect-view">
      <span class="ccc-kicker">${escapeHtml(model.kicker)}</span>
      <h1>${escapeHtml(model.title)}</h1>
      <p class="ccc-reconnect-lead">${escapeHtml(model.body)}</p>
      <aside class="ccc-real-life-mission-summary">
        <span>${expectedCopy.label} · ${escapeHtml(expectedCopy.question)}</span>
        <h2>${escapeHtml(expectedCopy.definition)}</h2>
        <p><strong>If this happens:</strong> ${escapeHtml(practice.preset.missionCue)}</p>
        <p><strong>Then:</strong> ${escapeHtml(practice.preset.missionAction)}</p>
      </aside>
      <p class="ccc-compact-boundary"><strong>This is not a transfer score.</strong> Try it once in the real task, then report what happened.</p>
      <div class="ccc-actions">
        <button class="ccc-button ccc-button-primary" data-action="commit-real-life-practice">I’ll try this once</button>
        <button class="ccc-button ccc-button-quiet" data-action="return-home">Maybe later</button>
      </div>
    </section>`, "ccc-reconnect-screen ccc-viewport-view");
}''',
)

replace_once(
    "journey reset bridge transient state",
    '''function createNewJourney(): void {
  const next = nextProgrammeAction(programme);
  if (next.type !== "session") return;
  const sessionId = crypto.randomUUID();''',
    '''function createNewJourney(): void {
  const next = nextProgrammeAction(programme);
  if (next.type !== "session") return;
  suppressRealLifeCheckIn = false;
  resetBridgeTransientChoices();
  const sessionId = crypto.randomUUID();''',
)

replace_once(
    "bridge advancement after completed session",
    '''  programme = progression.programme;
  journey.programme = programme;
  recordEvent("programme_gate_decision", {''',
    '''  programme = progression.programme;
  journey.programme = programme;
  maybeAdvanceBridge();
  recordEvent("programme_gate_decision", {''',
)

replace_once(
    "mark explicit Bridge prompt",
    '''  state.currentMission = createRealLifePracticeMission(
    practice.preset,
    practice.context,
    journey.plan.sessionId,
  );
  suppressRealLifeCheckIn = true;''',
    '''  state.currentMission = createRealLifePracticeMission(
    practice.preset,
    practice.context,
    journey.plan.sessionId,
  );
  programme.bridgeProgression = markExplicitBridgePrompt(bridgeProgressionState());
  suppressRealLifeCheckIn = true;''',
)

replace_once(
    "bridge metadata in mission event",
    '''    move: state.currentMission.move,
    workflowChoice: state.currentMission.workflow,
    scoreAffecting: false,''',
    '''    move: state.currentMission.move,
    workflowChoice: state.currentMission.workflow,
    bridgeLevel: bridgeProgressionState().level,
    bridgePromptStrength: bridgeSessionEndModel(bridgeProgressionState()).promptStrength,
    scoreAffecting: false,''',
)

replace_once(
    "bridge review evidence",
    '''  mission.status = "reviewed";
  mission.outcome = outcome;
  mission.barrier = barrier;
  mission.reviewedAt = now;
  state.reviewedCount += 1;
  state.attemptedCount += 1;
  if (outcome === "helped") state.helpedCount += 1;
  realLifeBarrierOpen = false;
  recordEvent("real_life_practice_reviewed", {''',
    '''  const bridgeLevelAtReview = bridgeProgressionState().level;
  mission.status = "reviewed";
  mission.outcome = outcome;
  mission.barrier = barrier;
  mission.reviewedAt = now;
  state.reviewedCount += 1;
  state.attemptedCount += 1;
  if (outcome === "helped") state.helpedCount += 1;
  if (bridgeLevelAtReview === "b1_guided") {
    recordBridgeEvidence("guided_review", {
      move: mission.move,
      sourceWorkflow: mission.workflow,
      helped: outcome === "helped",
    }, new Date(now));
  } else if (bridgeLevelAtReview === "b3_personalised") {
    recordBridgeEvidence("personal_mission_review", {
      move: bridgeProgressionState().personalMove || mission.move,
      sourceWorkflow: bridgeProgressionState().sourceWorkflow || mission.workflow,
      helped: outcome === "helped",
    }, new Date(now));
  } else if (bridgeLevelAtReview === "b5_changed_context") {
    recordBridgeEvidence("changed_context_review", {
      move: bridgeProgressionState().personalMove || mission.move,
      sourceWorkflow: bridgeProgressionState().sourceWorkflow || mission.workflow,
      targetWorkflow: bridgeProgressionState().lastChangedContextWorkflow || mission.workflow,
      helped: outcome === "helped",
    }, new Date(now));
  }
  maybeAdvanceBridge(new Date(now));
  realLifeBarrierOpen = false;
  suppressRealLifeCheckIn = true;
  recordEvent("real_life_practice_reviewed", {''',
)

replace_once(
    "bridge click actions",
    '''  } else if (action === "choose-workflow") {
    selectedWorkflow = button.dataset.workflow as WorkflowChoice;
    render();
  } else if (action === "commit-real-life-practice") {
    commitRealLifePractice();''',
    '''  } else if (action === "choose-workflow") {
    selectedWorkflow = button.dataset.workflow as WorkflowChoice;
    render();
  } else if (action === "bridge-retrieval-move") {
    const move = button.dataset.move as CccBridgeMove | undefined;
    const practice = finalRealLifePractice();
    if (!move || !(move in CCC_BRIDGE_MOVE_COPY) || !practice) return;
    bridgeRetrievalSelectedMove = move;
    recordBridgeEvidence("retrieval_attempt", {
      move: practice.preset.move,
      selectedMove: move,
      retrievalCorrect: move === practice.preset.move,
      sourceWorkflow: journey?.workflowChoice || selectedWorkflow,
    });
    render();
  } else if (action === "commit-bridge-retrieval-mission") {
    commitRealLifePractice();
  } else if (action === "bridge-personal-cue") {
    const cueId = button.dataset.cueId || "";
    if (!journey || !moveForCueOption(cueId)) return;
    bridgePersonalCueId = cueId;
    bridgePersonalMove = null;
    render();
  } else if (action === "bridge-personal-cue-back") {
    bridgePersonalCueId = null;
    bridgePersonalMove = null;
    render();
  } else if (action === "bridge-personal-move") {
    const selectedMove = button.dataset.move as CccBridgeMove | undefined;
    if (!journey || !bridgePersonalCueId || !selectedMove || !(selectedMove in CCC_BRIDGE_MOVE_COPY)) return;
    const cue = bridgeCueOptions(journey.workflowChoice).find((candidate) => candidate.id === bridgePersonalCueId);
    const suggestedMove = moveForCueOption(bridgePersonalCueId);
    if (!cue || !suggestedMove) return;
    bridgePersonalMove = suggestedMove;
    recordBridgeEvidence("personal_cue_created", {
      move: suggestedMove,
      selectedMove,
      sourceWorkflow: journey.workflowChoice,
      notes: cue.label,
    });
    programme.bridgeProgression!.personalMove = suggestedMove;
    persistBridgeState();
    render();
  } else if (action === "commit-bridge-personal-mission") {
    commitRealLifePractice();
  } else if (action === "bridge-changed-context") {
    const workflow = button.dataset.workflow as WorkflowChoice | undefined;
    if (!workflow || !(workflow in WORKFLOW_CHOICES)) return;
    bridgeChangedContextWorkflow = workflow;
    render();
  } else if (action === "commit-bridge-changed-context-mission") {
    if (bridgeChangedContextWorkflow) {
      const bridge = bridgeProgressionState();
      bridge.lastChangedContextWorkflow = bridgeChangedContextWorkflow;
      bridge.sourceWorkflow ||= journey?.workflowChoice || selectedWorkflow;
      programme.bridgeProgression = bridge;
      persistBridgeState();
    }
    commitRealLifePractice();
  } else if (action === "bridge-probe-response") {
    const response = button.dataset.probeResponse as BridgeProbeResponse | undefined;
    if (!response || !["used", "recalled", "no", "unsure"].includes(response)) return;
    if (response === "used" || response === "recalled") {
      bridgeProbeResponse = response;
      render();
      return;
    }
    const level = bridgeProgressionState().level;
    recordBridgeEvidence(level === "b6_delayed" ? "delayed_probe" : "faded_probe", {
      spontaneousRecall: false,
      spontaneousUse: false,
      sourceWorkflow: bridgeProgressionState().sourceWorkflow || selectedWorkflow,
    });
    maybeAdvanceBridge();
    bridgeProbeResponse = null;
    suppressRealLifeCheckIn = true;
    setView("welcome");
  } else if (action === "bridge-probe-move") {
    const move = button.dataset.move as CccBridgeMove | undefined;
    if (!move || !(move in CCC_BRIDGE_MOVE_COPY) || !bridgeProbeResponse) return;
    const level = bridgeProgressionState().level;
    recordBridgeEvidence(level === "b6_delayed" ? "delayed_probe" : "faded_probe", {
      move,
      selectedMove: move,
      spontaneousRecall: true,
      spontaneousUse: bridgeProbeResponse === "used",
      sourceWorkflow: bridgeProgressionState().sourceWorkflow || selectedWorkflow,
    });
    maybeAdvanceBridge();
    bridgeProbeResponse = null;
    suppressRealLifeCheckIn = true;
    setView("welcome");
  } else if (action === "bridge-probe-back") {
    bridgeProbeResponse = null;
    render();
  } else if (action === "bridge-probe-skip") {
    bridgeProbeResponse = null;
    suppressRealLifeCheckIn = true;
    setView("welcome");
  } else if (action === "commit-real-life-practice") {
    commitRealLifePractice();''',
)

path.write_text(text, encoding="utf-8")
print("CCC Bridge main.ts integration transform applied successfully")
