(() => {
  const PATCH_DATASET_KEY = "cccSessionExitFixed";
  const PATCH_ATTRIBUTE = "data-ccc-session-exit-fixed";
  const WAIT_DATASET_KEY = "cccWaitExplained";
  const WAIT_ATTRIBUTE = "data-ccc-wait-explained";
  const GUIDE_DATASET_KEY = "cccSessionGuidance";
  const GUIDE_ATTRIBUTE = "data-ccc-session-guidance";

  function textMatchesSessionCap(value) {
    return /Continue next time/i.test(value)
      && /Today[’']s practice is complete/i.test(value);
  }

  function sessionProgressIsComplete() {
    const progress = document.querySelector(".ccc-header-progress [role='progressbar']");
    return progress?.getAttribute("aria-valuenow") === "100";
  }

  function replaceSessionStatus(review, capped) {
    if (!capped || review.querySelector(`[${PATCH_ATTRIBUTE}]`)) return;
    const status = review.querySelector(".ccc-learning-status");
    const target = status || document.createElement("p");
    if (!status) {
      target.className = "ccc-learning-status";
      review.querySelector(".ccc-actions")?.before(target);
    }
    const strong = document.createElement("strong");
    strong.textContent = "Today’s guided session is complete.";
    target.replaceChildren(
      strong,
      document.createTextNode(" Choose Finish and save to open the next session. This is a session cap, not a lockout."),
    );
    target.dataset[PATCH_DATASET_KEY] = "1";
  }

  function patchCompletedSessionExit() {
    const reviews = document.querySelectorAll(".ccc-review-view:not(.ccc-practice-review)");
    for (const review of reviews) {
      const leaveButton = review.querySelector("button[data-action='back-welcome']");
      const insightsButton = review.querySelector("button[data-action='show-block-insights']");
      if (!leaveButton || !insightsButton || leaveButton.dataset[PATCH_DATASET_KEY] === "1") continue;

      const capped = textMatchesSessionCap(review.textContent || "");
      if (!capped && !sessionProgressIsComplete()) continue;

      // Route through the app's existing continueAfterBlock() path. At a
      // session cap or final block that path records the completed session,
      // updates the programme gate, saves cloud progress and opens the next
      // programme action. Returning home directly leaves an unfinished
      // journey behind and causes the completed screen to repeat forever.
      leaveButton.dataset.action = "continue-after-block";
      leaveButton.dataset[PATCH_DATASET_KEY] = "1";
      leaveButton.textContent = "Finish and save";
      leaveButton.setAttribute("aria-label", "Finish and save today’s session");
      replaceSessionStatus(review, capped);
    }
  }

  function explainScheduledWait() {
    const cards = document.querySelectorAll(".ccc-programme-card");
    for (const card of cards) {
      const waitButton = Array.from(card.querySelectorAll("button[disabled]"))
        .find((button) => /Re-check opens/i.test(button.textContent || ""));
      if (!waitButton || card.querySelector(`[${WAIT_ATTRIBUTE}]`)) continue;

      const note = document.createElement("p");
      note.className = "ccc-soft-note";
      note.dataset[WAIT_DATASET_KEY] = "1";
      note.innerHTML = "<strong>Why there is a wait:</strong> This is a planned return check, not an account lock. The break lets the Coach test whether the skill can be recovered after time away. The button shows the exact opening time. Outside a scheduled return check, finishing and saving a session opens the next one.";
      waitButton.before(note);
    }
  }

  function extendProgrammeGuide() {
    const dialog = document.querySelector("#ccc-programme-guide .ccc-guide-dialog");
    const title = dialog?.querySelector("#ccc-guide-title");
    const list = dialog?.querySelector(".ccc-guide-checklist");
    if (!dialog || !title || !list || !/One guided session at a time/i.test(title.textContent || "")) return;
    if (list.querySelector(`[${GUIDE_ATTRIBUTE}]`)) return;

    const item = document.createElement("li");
    item.dataset[GUIDE_DATASET_KEY] = "1";
    item.innerHTML = "<strong>Finish and save when a session ends.</strong> This opens the next ordinary session. Only a scheduled return check asks you to wait, and the app shows the exact date and time when it will open.";
    list.appendChild(item);
  }

  function applyPatches() {
    patchCompletedSessionExit();
    explainScheduledWait();
    extendProgrammeGuide();
  }

  const observer = new MutationObserver(applyPatches);
  observer.observe(document.body, { childList: true, subtree: true });
  applyPatches();
})();
