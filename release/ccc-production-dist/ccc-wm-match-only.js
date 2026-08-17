(() => {
  "use strict";

  function setText(node, value) {
    if (node && node.textContent !== value) node.textContent = value;
  }

  function replaceExactText(root, from, to) {
    root.querySelectorAll("p, span, small, strong").forEach((node) => {
      if (node.textContent?.trim() === from) setText(node, to);
    });
  }

  function applyInstructions() {
    const root = document.querySelector("#app");
    if (!root) return;

    replaceExactText(
      root,
      "Choose Match when the main direction is the same, or Different when it has changed.",
      "Tap Match only when the main direction is the same. If it is different, wait for the next pattern.",
    );
    replaceExactText(root, "Different from 1 step back: Different", "Different from 1 step back: do not tap");
    replaceExactText(
      root,
      "Choose Match or Different.",
      "Tap Match only when the relation repeats. If it is different, wait for the next pattern.",
    );
    replaceExactText(root, "Match or Different", "Tap only for a match");
    replaceExactText(
      root,
      "Choose Match or Different before the next pattern.",
      "Tap Match only if the relation repeats. If it is different, wait for the next pattern.",
    );

    root.querySelectorAll(".ccc-task-helper").forEach((node) => {
      const text = node.textContent?.trim() || "";
      const result = text.match(/^Choose Match or Different by comparing with (\d+) (step|steps) back\.$/);
      if (result) {
        setText(node, `Tap Match only if it matches ${result[1]} ${result[2]} back. If it is different, wait for the next pattern.`);
      }
    });

    root.querySelectorAll(".ccc-response-row").forEach((row) => {
      const matchButton = row.querySelector("button[data-response='match']");
      const differentButton = row.querySelector("button[data-response='different']");
      if (!matchButton || differentButton) return;
      row.setAttribute("aria-label", "Tap Match only when the relation repeats");
      row.style.gridTemplateColumns = "minmax(0, 1fr)";
      row.style.width = "min(26rem, 100%)";
      row.style.marginInline = "auto";
      matchButton.setAttribute("aria-label", "Tap Match when the relation repeats");
      setText(matchButton.querySelector("kbd"), "Space");
    });

    root.querySelectorAll(".ccc-task-view").forEach((taskView) => {
      const matchButton = taskView.querySelector("button[data-response='match']");
      const differentButton = taskView.querySelector("button[data-response='different']");
      if (!matchButton || differentButton) return;
      taskView.querySelectorAll(".ccc-signal-result.is-neutral, .ccc-result-panel.is-neutral").forEach((panel) => {
        const outcome = panel.querySelector("strong");
        if (outcome?.textContent?.trim() !== "No response") return;
        setText(outcome, "Missed match");
        panel.classList.remove("is-neutral");
        panel.classList.add("is-incorrect");
        setText(panel.querySelector(".ccc-feedback-icon"), "×");
      });
    });
  }

  const observer = new MutationObserver(applyInstructions);
  observer.observe(document.documentElement, { childList: true, subtree: true });

  window.addEventListener("keydown", (event) => {
    if (event.code !== "Space" || event.repeat) return;
    const target = event.target;
    if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement) return;
    const taskView = document.querySelector(".ccc-task-view");
    const matchButton = taskView?.querySelector("button[data-response='match']:not(:disabled)");
    const differentButton = taskView?.querySelector("button[data-response='different']");
    if (!(matchButton instanceof HTMLButtonElement) || differentButton) return;
    event.preventDefault();
    matchButton.click();
  }, true);

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", applyInstructions, { once: true });
  } else {
    applyInstructions();
  }
})();
