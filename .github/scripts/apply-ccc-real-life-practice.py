from pathlib import Path

path = Path("apps/cognitive-control-coach/src/main.ts")
source = path.read_text(encoding="utf-8")

if 'import "./cccRealLifePractice.css";' in source:
    print("CCC real-life practice integration already present; no source patch needed.")
    raise SystemExit(0)


def between(text: str, start: str, end: str) -> str:
    a = text.index(start)
    b = text.index(end, a)
    return text[a:b]


def replace_once(text: str, old: str, new: str) -> str:
    if old not in text:
        raise RuntimeError(f"Required integration anchor not found: {old[:100]!r}")
    return text.replace(old, new, 1)


def replace_between(text: str, start: str, end: str, replacement: str) -> str:
    a = text.index(start)
    b = text.index(end, a)
    return text[:a] + replacement + text[b:]

access_before = between(source, "function renderAccess(): string {", "\nfunction renderData(): string {")
checkout_before = between(source, 'if (action === "start-product-checkout")', 'else if (action === "choose-tester-exercise")')

source = replace_once(
    source,
    'import "./cccStyles.css";\n',
    'import "./cccStyles.css";\nimport "./cccRealLifePractice.css";\n',
)

source = replace_once(
    source,
    'import { buildCccStrategyFeedback, type CccRegimeStrategyFeedback } from "./cccStrategy";\n',
    '''import {
  buildCccStrategyFeedback,
  type CccRegimeStrategyFeedback,
  type CccStrategyDirection,
} from "./cccStrategy";
import {
  createRealLifePracticeMission,
  REAL_LIFE_BARRIER_COPY,
  REAL_LIFE_MOVE_COPY,
  REAL_LIFE_OUTCOME_COPY,
  realLifePracticePresetForMission,
  resolveRealLifePracticePreset,
  type CccRealLifePracticeBarrier,
  type CccRealLifePracticeContext,
  type CccRealLifePracticeOutcome,
  type CccRealLifePracticePreset,
} from "./cccRealLifePractice";
''',
)

source = replace_once(
    source,
    'let wmPracticeFeedbackEnabled = false;\n',
    'let wmPracticeFeedbackEnabled = false;\nlet realLifeBarrierOpen = false;\nlet suppressRealLifeCheckIn = false;\n',
)

helpers = r'''function realLifePracticeState() {
  programme.realLifePractice ||= {
    currentMission: null,
    reviewedCount: 0,
    attemptedCount: 0,
    helpedCount: 0,
  };
  return programme.realLifePractice;
}

function queueRealLifePracticeCloudSave(successMessage: string): void {
  if (!journey || !cloudSyncActive()) return;
  journey.programme = programme;
  const pending = saveCccRemoteProgress(journey as unknown as Record<string, unknown>)
    .then(() => { cloudStatus = successMessage; })
    .catch((error) => {
      console.warn("Real-life practice cloud save is pending.", error);
      cloudStatus = "This device has your real-life practice update. Cloud sync will retry with later progress.";
    });
  pendingCloudSaves.push(pending);
  void pending.finally(() => {
    pendingCloudSaves = pendingCloudSaves.filter((candidate) => candidate !== pending);
  });
}

function strategyDirectionForBlock(
  block: CccAttentionBlockPlan,
  results: readonly CccRecordedTrial[],
): CccStrategyDirection | null {
  if (block.estimand === "signal_capacity") return null;
  const strategy = buildCccStrategyFeedback(results, block.regimePair, block.operator);
  const lead = strategy.regimes.find((item) => item.direction === "slow_down" || item.direction === "speed_up")
    || strategy.regimes.find((item) => item.direction === "well_balanced")
    || strategy.regimes[0];
  return lead?.direction || null;
}

function realLifeContextForBlock(
  block: CccAttentionBlockPlan,
  results: readonly CccRecordedTrial[],
): CccRealLifePracticeContext {
  return {
    workflow: journey?.workflowChoice || selectedWorkflow,
    operator: block.operator,
    transitionKind: block.transitionKind,
    phase: block.phase,
    strategyDirection: strategyDirectionForBlock(block, results),
  };
}

function realLifePresetForBlock(
  block: CccAttentionBlockPlan,
  results: readonly CccRecordedTrial[],
): CccRealLifePracticePreset {
  return resolveRealLifePracticePreset(realLifeContextForBlock(block, results));
}

function finalRealLifePractice(): {
  block: CccAttentionBlockPlan;
  context: CccRealLifePracticeContext;
  preset: CccRealLifePracticePreset;
} | null {
  if (!journey) return null;
  const block = [...journey.plan.blocks].reverse().find((candidate) => {
    if (candidate.phase === "practice") return false;
    return (journey!.blockResults[candidate.id] || []).some((result) => result.scoring.countsTowardQuota);
  }) || null;
  if (!block) return null;
  const results = journey.blockResults[block.id] || [];
  const context = realLifeContextForBlock(block, results);
  return { block, context, preset: resolveRealLifePracticePreset(context) };
}

function renderRealLifePracticeLens(preset: CccRealLifePracticePreset): string {
  const move = REAL_LIFE_MOVE_COPY[preset.move];
  return `<aside class="ccc-real-life-lens">
    <div class="ccc-real-life-lens-heading"><span>Real-life practice lens</span><strong>${move.label} · ${move.question}</strong></div>
    <h2>${escapeHtml(preset.title)}</h2>
    <p><span>When</span>${escapeHtml(preset.cue)}</p>
    <p><span>Try</span>${escapeHtml(preset.action)}</p>
  </aside>`;
}

'''
source = replace_once(source, "function clearTaskTiming(): void {", helpers + "function clearTaskTiming(): void {")

checkin = r'''function renderRealLifeCheckIn(): string {
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
        <h2>${escapeHtml(preset.title)}</h2>
        <p>${escapeHtml(preset.action)}</p>
      </aside>
      <div class="ccc-real-life-option-grid">${choices}</div>
      ${realLifeBarrierOpen ? `<button class="ccc-text-button" data-action="real-life-barrier-back">Back to the first question</button>` : ""}
      <p class="ccc-compact-boundary">This is a self-report about the strategy, kept separate from your training score.</p>
    </section>`, "ccc-real-life-checkin-view ccc-viewport-view");
}

'''
source = replace_once(source, "function renderWelcome(): string {\n", checkin + "function renderWelcome(): string {\n  if (!suppressRealLifeCheckIn && realLifePracticeState().currentMission?.status === \"pending\") {\n    return renderRealLifeCheckIn();\n  }\n")

block_reconnect = r'''function renderBlockReconnect(): string {
  if (!journey) return renderWelcome();
  const block = currentBlock();
  if (!block || block.phase === "practice") return renderWelcome();
  const learningCurve = evaluateCccLearningCurve(block, currentResults(), undefined, programme.evidence.attentionLearningCurve);
  const exposureStopped = learningCurve.status === "exposure_ceiling";
  const isLast = exposureStopped || journey.activeBlockIndex === journey.plan.blocks.length - 1;
  const preset = realLifePresetForBlock(block, currentResults());
  return shell(`
    <section class="ccc-narrow-card ccc-block-reconnect-card">
      <div class="ccc-stage-line"><span>Stage ${journey.activeBlockIndex + 1} complete</span><span>${Math.round(journeyCompletionRatio(journey) * 100)}% complete</span></div>
      <span class="ccc-kicker">Connect to ${WORKFLOW_CHOICES[journey.workflowChoice].label.toLowerCase()}</span>
      <h1>Translate this block into one real-life move.</h1>
      ${renderRealLifePracticeLens(preset)}
      <p class="ccc-soft-note">Treat this as a strategy to test. Judge it by what happens in the real task.</p>
      <div class="ccc-actions">
        <button class="ccc-button ccc-button-primary" data-action="continue-after-block">${exposureStopped ? "Finish today’s practice" : isLast ? "See your journey review" : block.operator === "relational_wm" ? "Continue to the next block" : "Continue to the next stage"}</button>
        <button class="ccc-button ccc-button-quiet" data-action="back-welcome">Save and leave</button>
      </div>
    </section>`, "ccc-block-reconnect-view ccc-viewport-view");
}
'''
source = replace_between(source, "function renderBlockReconnect(): string {", "\nfunction renderShiftView(): string {", block_reconnect)

complete_reconnect = r'''function renderCompleteReconnect(): string {
  if (!journey) return renderWelcome();
  const practice = finalRealLifePractice();
  if (!practice) return renderWelcome();
  return shell(`
    <section class="ccc-complete-card ccc-reconnect-view">
      <span class="ccc-kicker">One strategy to test</span>
      <h1>Take one move back to your task.</h1>
      <p class="ccc-reconnect-lead">Use the cue once in ${WORKFLOW_CHOICES[journey.workflowChoice].label.toLowerCase()}, then judge the result there.</p>
      ${renderRealLifePracticeLens(practice.preset)}
      <p class="ccc-compact-boundary"><strong>This is not a transfer score.</strong> Your next check-in records only what you noticed in the real task.</p>
      <div class="ccc-actions">
        <button class="ccc-button ccc-button-primary" data-action="commit-real-life-practice">I’ll try this once</button>
        <button class="ccc-button ccc-button-quiet" data-action="return-home">Maybe later</button>
      </div>
    </section>`, "ccc-reconnect-screen ccc-viewport-view");
}
'''
source = replace_between(source, "function renderCompleteReconnect(): string {", "\nfunction dataModeCard(", complete_reconnect)

lifecycle = r'''function commitRealLifePractice(): void {
  if (!journey) return;
  const practice = finalRealLifePractice();
  if (!practice) return;
  const state = realLifePracticeState();
  state.currentMission = createRealLifePracticeMission(
    practice.preset,
    practice.context,
    journey.plan.sessionId,
  );
  suppressRealLifeCheckIn = true;
  realLifeBarrierOpen = false;
  recordEvent("real_life_practice_committed", {
    missionId: state.currentMission.id,
    presetId: state.currentMission.presetId,
    presetVersion: state.currentMission.presetVersion,
    move: state.currentMission.move,
    workflowChoice: state.currentMission.workflow,
    scoreAffecting: false,
  }, null);
  saveCccProgramme(programme);
  saveJourney();
  queueRealLifePracticeCloudSave("Your real-life practice mission is synced.");
  setView("welcome");
}

function reviewRealLifePractice(
  outcome: CccRealLifePracticeOutcome,
  barrier: CccRealLifePracticeBarrier | null = null,
): void {
  const state = realLifePracticeState();
  const mission = state.currentMission;
  if (!mission || mission.status !== "pending") return;
  const now = new Date().toISOString();
  if (outcome === "not_yet") {
    mission.deferredCount += 1;
    mission.lastDeferredAt = now;
    realLifeBarrierOpen = false;
    suppressRealLifeCheckIn = true;
    recordEvent("real_life_practice_deferred", {
      missionId: mission.id,
      presetId: mission.presetId,
      deferredCount: mission.deferredCount,
      scoreAffecting: false,
    }, null);
    saveCccProgramme(programme);
    saveJourney();
    queueRealLifePracticeCloudSave("Your real-life practice mission remains available for your next visit.");
    setView("welcome");
    return;
  }
  mission.status = "reviewed";
  mission.outcome = outcome;
  mission.barrier = barrier;
  mission.reviewedAt = now;
  state.reviewedCount += 1;
  state.attemptedCount += 1;
  if (outcome === "helped") state.helpedCount += 1;
  realLifeBarrierOpen = false;
  recordEvent("real_life_practice_reviewed", {
    missionId: mission.id,
    presetId: mission.presetId,
    outcome,
    barrier,
    scoreAffecting: false,
  }, null);
  saveCccProgramme(programme);
  saveJourney();
  queueRealLifePracticeCloudSave("Your real-life practice check-in is synced.");
  setView("welcome");
}

'''
source = replace_once(source, "function continueAfterBlock(): void {", lifecycle + "function continueAfterBlock(): void {")

source = replace_once(
    source,
    '''  } else if (action === "choose-workflow") {
    selectedWorkflow = button.dataset.workflow as WorkflowChoice;
    render();
  } else if (action === "show-workflow") {''',
    '''  } else if (action === "choose-workflow") {
    selectedWorkflow = button.dataset.workflow as WorkflowChoice;
    render();
  } else if (action === "commit-real-life-practice") {
    commitRealLifePractice();
  } else if (action === "real-life-outcome") {
    const outcome = button.dataset.outcome as CccRealLifePracticeOutcome | undefined;
    if (!outcome || !(outcome in REAL_LIFE_OUTCOME_COPY)) return;
    if (outcome === "setting_difficult") {
      realLifeBarrierOpen = true;
      render();
    } else {
      reviewRealLifePractice(outcome);
    }
  } else if (action === "real-life-barrier") {
    const barrier = button.dataset.barrier as CccRealLifePracticeBarrier | undefined;
    if (barrier && barrier in REAL_LIFE_BARRIER_COPY) reviewRealLifePractice("setting_difficult", barrier);
  } else if (action === "real-life-barrier-back") {
    realLifeBarrierOpen = false;
    render();
  } else if (action === "show-workflow") {''',
)

source = replace_once(
    source,
    '''  } else if (action === "begin-next-session") {
    createNewJourney();''',
    '''  } else if (action === "begin-next-session") {
    if (realLifePracticeState().currentMission?.status === "pending" && !suppressRealLifeCheckIn) {
      setView("welcome");
      return;
    }
    createNewJourney();''',
)

access_after = between(source, "function renderAccess(): string {", "\nfunction renderData(): string {")
checkout_after = between(source, 'if (action === "start-product-checkout")', 'else if (action === "choose-tester-exercise")')
if access_before != access_after:
    raise RuntimeError("Refusing patch: checkout/email sign-in rendering changed.")
if checkout_before != checkout_after:
    raise RuntimeError("Refusing patch: checkout/auth/access action handling changed.")

required_markers = [
    'data-action="start-product-checkout"',
    "createIqCoachCheckoutSession",
    "resolveIqCoachAccess",
    "sendEmailSignInLink",
    "verifyEmailSignInCode",
    'scoreAffecting: false',
    'data-action="commit-real-life-practice"',
    'data-action="real-life-outcome"',
]
for marker in required_markers:
    if marker not in source:
        raise RuntimeError(f"Required marker missing after patch: {marker}")

path.write_text(source, encoding="utf-8")
print("Integrated CCC real-life practice layer without modifying commerce/auth sections.")
