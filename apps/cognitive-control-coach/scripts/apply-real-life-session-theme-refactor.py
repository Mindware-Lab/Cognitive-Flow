from pathlib import Path

path = Path("apps/cognitive-control-coach/src/main.ts")
text = path.read_text(encoding="utf-8")

replacements = []

replacements.append((r'''function realLifeContextForBlock(
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
}''', r'''function realLifeContextForBlock(
  block: CccAttentionBlockPlan,
  results: readonly CccRecordedTrial[],
): CccRealLifePracticeContext {
  return {
    workflow: journey?.workflowChoice || selectedWorkflow,
    operator: block.operator,
    transitionKind: block.transitionKind,
    phase: block.phase,
    strategyDirection: strategyDirectionForBlock(block, results),
    sessionId: journey?.plan.sessionId,
    sessionKind: journey?.plan.programmeSessionKind,
    sessionNumber: journey?.plan.programmeSessionNumber,
    blockIndex: block.index,
  };
}'''))

replacements.append((r'''function renderRealLifePracticeLens(preset: CccRealLifePracticePreset): string {
  const move = REAL_LIFE_MOVE_COPY[preset.move];
  return `<aside class="ccc-real-life-lens">
    <div class="ccc-real-life-lens-heading"><span>Real-life practice lens</span><strong>${move.label} · ${move.question}</strong></div>
    <h2>${escapeHtml(preset.title)}</h2>
    <p><span>When</span>${escapeHtml(preset.cue)}</p>
    <p><span>Try</span>${escapeHtml(preset.action)}</p>
  </aside>`;
}''', r'''function renderRealLifePracticeLens(preset: CccRealLifePracticePreset): string {
  const move = REAL_LIFE_MOVE_COPY[preset.move];
  return `<aside class="ccc-real-life-lens">
    <div class="ccc-real-life-lens-heading"><span>Today's theme</span><strong>${move.label}</strong></div>
    <h2>${escapeHtml(preset.themeTitle)}</h2>
    <p><span>This block</span>${escapeHtml(preset.angleTitle)}. ${escapeHtml(preset.explanation)}</p>
    <p><span>Example</span>One practical example: ${escapeHtml(preset.example)}</p>
  </aside>`;
}

function renderRealLifeMissionLens(preset: CccRealLifePracticePreset): string {
  const move = REAL_LIFE_MOVE_COPY[preset.move];
  return `<aside class="ccc-real-life-lens ccc-real-life-mission-lens">
    <div class="ccc-real-life-lens-heading"><span>Today's theme</span><strong>${move.label}</strong></div>
    <h2>${escapeHtml(preset.themeTitle)}</h2>
    <p><span>If this happens</span>${escapeHtml(preset.missionCue)}</p>
    <p><span>Then I’ll</span>${escapeHtml(preset.missionAction)}</p>
  </aside>`;
}'''))

replacements.append((r'''      <aside class="ccc-real-life-mission-summary">
        <span>${escapeHtml(WORKFLOW_CHOICES[mission.workflow].label)}</span>
        <h2>${escapeHtml(preset.title)}</h2>
        <p>${escapeHtml(preset.action)}</p>
      </aside>''', r'''      <aside class="ccc-real-life-mission-summary">
        <span>${escapeHtml(WORKFLOW_CHOICES[mission.workflow].label)}</span>
        <h2>${escapeHtml(preset.themeTitle)}</h2>
        <p>${escapeHtml(preset.missionAction)}</p>
      </aside>'''))

replacements.append((r'''  return shell(`
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
    </section>`, "ccc-block-reconnect-view ccc-viewport-view");''', r'''  return shell(`
    <section class="ccc-narrow-card ccc-block-reconnect-card">
      <div class="ccc-stage-line"><span>Stage ${journey.activeBlockIndex + 1} complete</span><span>${Math.round(journeyCompletionRatio(journey) * 100)}% complete</span></div>
      <span class="ccc-kicker">Connect to ${WORKFLOW_CHOICES[journey.workflowChoice].label.toLowerCase()}</span>
      <h1>See how today's theme showed up in this block.</h1>
      ${renderRealLifePracticeLens(preset)}
      <p class="ccc-soft-note"><strong>No new action to remember yet.</strong> At the end of the session, you can choose one strategy to try once.</p>
      <div class="ccc-actions">
        <button class="ccc-button ccc-button-primary" data-action="continue-after-block">${exposureStopped ? "Finish today’s practice" : isLast ? "See your journey review" : block.operator === "relational_wm" ? "Continue to the next block" : "Continue to the next stage"}</button>
        <button class="ccc-button ccc-button-quiet" data-action="back-welcome">Save and leave</button>
      </div>
    </section>`, "ccc-block-reconnect-view ccc-viewport-view");'''))

replacements.append((r'''function renderCompleteReconnect(): string {
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
}''', r'''function renderCompleteReconnect(): string {
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
}'''))

replacements.append((r'''function commitRealLifePractice(): void {
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
}''', r'''function commitRealLifePractice(replacePending = false): void {
  if (!journey) return;
  const practice = finalRealLifePractice();
  if (!practice) return;
  const state = realLifePracticeState();
  if (state.currentMission?.status === "pending" && !replacePending) {
    setView("complete_reconnect");
    return;
  }
  const previousMission = state.currentMission?.status === "pending" ? state.currentMission : null;
  state.currentMission = createRealLifePracticeMission(
    practice.preset,
    practice.context,
    journey.plan.sessionId,
  );
  suppressRealLifeCheckIn = true;
  realLifeBarrierOpen = false;
  recordEvent(previousMission ? "real_life_practice_replaced" : "real_life_practice_committed", {
    missionId: state.currentMission.id,
    previousMissionId: previousMission?.id || null,
    presetId: state.currentMission.presetId,
    presetVersion: state.currentMission.presetVersion,
    themeId: state.currentMission.themeId,
    themeFamilyId: state.currentMission.themeFamilyId,
    move: state.currentMission.move,
    workflowChoice: state.currentMission.workflow,
    scoreAffecting: false,
  }, null);
  saveCccProgramme(programme);
  saveJourney();
  queueRealLifePracticeCloudSave(previousMission
    ? "Your replacement real-life practice mission is synced."
    : "Your real-life practice mission is synced.");
  setView("welcome");
}'''))

replacements.append((r'''  } else if (action === "commit-real-life-practice") {
    commitRealLifePractice();
  } else if (action === "real-life-outcome") {''', r'''  } else if (action === "commit-real-life-practice") {
    commitRealLifePractice();
  } else if (action === "keep-real-life-practice") {
    const mission = realLifePracticeState().currentMission;
    suppressRealLifeCheckIn = true;
    realLifeBarrierOpen = false;
    recordEvent("real_life_practice_kept", {
      missionId: mission?.status === "pending" ? mission.id : null,
      scoreAffecting: false,
    }, null);
    setView("welcome");
  } else if (action === "replace-real-life-practice") {
    commitRealLifePractice(true);
  } else if (action === "real-life-outcome") {'''))

for index, (old, new) in enumerate(replacements, start=1):
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"Replacement {index} expected exactly once, found {count}")
    text = text.replace(old, new, 1)

path.write_text(text, encoding="utf-8")
print(f"Applied {len(replacements)} CCC session-theme replacements to {path}")
