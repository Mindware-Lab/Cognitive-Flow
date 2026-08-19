(() => {
  const STORAGE_KEY = "iqm.ccc.programmeGuide.v1.seen";
  const DIALOG_ID = "ccc-programme-guide";
  const STYLE_ID = "ccc-programme-guide-style";

  const pages = [
    {
      step: "1 of 3 · Your route",
      title: "How this programme works",
      intro: "You do not need to work out what exercise comes next. The programme guides the training for you.",
      body: `
        <div class="ccc-guide-route-grid">
          <article>
            <strong>Cognitive Control Coach</strong>
            <p>Work through short guided sessions. The Coach adjusts the sequence as you train attention control and working memory across changing formats.</p>
          </article>
          <article>
            <strong>Complete Cognitive Route</strong>
            <p>Use G Track for separate baseline and follow-up checks around the Coach. Treat those as measurements rather than exercises to practise.</p>
          </article>
        </div>
      `,
    },
    {
      step: "2 of 3 · What you will train",
      title: "The tasks change, but the goal stays clear",
      intro: "The programme begins with simple task rules and then asks you to recover the same kind of control when the display or memory demand changes.",
      body: `
        <div class="ccc-guide-step-grid">
          <article><span>1</span><div><strong>Find the signal</strong><p>Pick out the relevant direction or relationship from a brief display.</p></div></article>
          <article><span>2</span><div><strong>Hold and update</strong><p>Keep the relevant relationship in mind as new information arrives.</p></div></article>
          <article><span>3</span><div><strong>Work across changes</strong><p>The same underlying skill can appear in a different frame, pace or visual format.</p></div></article>
          <article><span>4</span><div><strong>Recover after a change</strong><p>A temporary dip when a format changes is expected. The programme looks at how you recover.</p></div></article>
        </div>
      `,
    },
    {
      step: "3 of 3 · How to use it",
      title: "One guided session at a time",
      intro: "You do not need a special strategy before you begin. Follow the instruction on the current screen and respond as naturally as you can.",
      body: `
        <ul class="ccc-guide-checklist">
          <li><strong>Do one guided session at a time.</strong> There is no advantage in pushing on when tired or losing concentration.</li>
          <li><strong>Do not chase the score.</strong> The programme is interested in the pattern across sessions and changes in format, not one perfect result.</li>
          <li><strong>Expect some tasks to feel unfamiliar.</strong> A dip after a format change is part of the training design, not a failure.</li>
          <li><strong>Use the reports as guidance.</strong> They explain how that part went and what the programme is doing next.</li>
        </ul>
        <p class="ccc-guide-note">If anything is unclear, you can reopen this guide at any time using <strong>Guide</strong> at the top of the app.</p>
      `,
    },
  ];

  let pageIndex = 0;
  let lastFocused = null;

  function hasSeenGuide() {
    try {
      return window.localStorage.getItem(STORAGE_KEY) === "1";
    } catch {
      return false;
    }
  }

  function markGuideSeen() {
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // The guide remains usable even when storage is unavailable.
    }
  }

  function installStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      .ccc-guide-launch {
        min-height: 42px;
        min-width: 64px;
        padding: 0 14px;
        border: 1px solid rgba(34, 170, 255, 0.48);
        border-radius: 999px;
        color: #fff;
        background: rgba(34, 170, 255, 0.12);
        font: inherit;
        font-size: 0.82rem;
        font-weight: 800;
        line-height: 1;
        cursor: pointer;
        flex: 0 0 auto;
      }
      .ccc-guide-launch:hover { background: rgba(34, 170, 255, 0.22); }
      .ccc-guide-launch:focus-visible { outline: 3px solid rgba(34, 170, 255, 0.58); outline-offset: 3px; }

      .ccc-guide-overlay {
        position: fixed;
        inset: 0;
        z-index: 3000;
        display: grid;
        place-items: center;
        padding: 16px;
        overflow: auto;
        background: rgba(7, 24, 39, 0.72);
        backdrop-filter: blur(5px);
      }
      .ccc-guide-dialog {
        width: min(660px, 100%);
        max-height: calc(100dvh - 32px);
        overflow: auto;
        scrollbar-gutter: stable;
        border: 1px solid #d9e4ec;
        border-radius: 22px;
        background: #fff;
        box-shadow: 0 22px 70px rgba(7, 24, 39, 0.28);
      }
      .ccc-guide-inner { padding: clamp(20px, 4vw, 34px); }
      .ccc-guide-topline {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        margin-bottom: 14px;
      }
      .ccc-guide-step {
        color: #0879bd;
        font-size: 0.78rem;
        font-weight: 850;
        letter-spacing: 0.06em;
        text-transform: uppercase;
      }
      .ccc-guide-close {
        width: 44px;
        height: 44px;
        display: grid;
        place-items: center;
        border: 1px solid #d7e1e9;
        border-radius: 999px;
        color: #13253a;
        background: #f7fafc;
        font-size: 1.35rem;
        line-height: 1;
        cursor: pointer;
      }
      .ccc-guide-dialog h2 {
        margin: 0;
        color: #071827;
        font-size: clamp(1.65rem, 4.6vw, 2.35rem);
        line-height: 1.08;
      }
      .ccc-guide-intro {
        margin: 12px 0 20px;
        color: #445b70;
        font-size: 1rem;
        line-height: 1.55;
      }
      .ccc-guide-route-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 12px;
      }
      .ccc-guide-route-grid article,
      .ccc-guide-step-grid article {
        border: 1px solid #dce6ee;
        border-radius: 16px;
        background: #f8fbfd;
      }
      .ccc-guide-route-grid article { padding: 16px; }
      .ccc-guide-route-grid strong,
      .ccc-guide-step-grid strong,
      .ccc-guide-checklist strong { color: #071827; }
      .ccc-guide-route-grid p,
      .ccc-guide-step-grid p { margin: 6px 0 0; color: #4c6275; line-height: 1.48; }
      .ccc-guide-step-grid { display: grid; gap: 10px; }
      .ccc-guide-step-grid article {
        display: grid;
        grid-template-columns: 42px minmax(0, 1fr);
        gap: 12px;
        align-items: start;
        padding: 12px 14px;
      }
      .ccc-guide-step-grid article > span {
        width: 36px;
        height: 36px;
        display: grid;
        place-items: center;
        border-radius: 999px;
        color: #071827;
        background: #ccff66;
        font-weight: 900;
      }
      .ccc-guide-checklist {
        display: grid;
        gap: 10px;
        margin: 0;
        padding: 0;
        list-style: none;
      }
      .ccc-guide-checklist li {
        position: relative;
        padding: 12px 14px 12px 42px;
        border: 1px solid #dce6ee;
        border-radius: 14px;
        color: #435b70;
        background: #f8fbfd;
        line-height: 1.48;
      }
      .ccc-guide-checklist li::before {
        content: "✓";
        position: absolute;
        left: 15px;
        top: 12px;
        color: #0879bd;
        font-weight: 900;
      }
      .ccc-guide-note {
        margin: 14px 0 0;
        padding: 12px 14px;
        border-left: 4px solid #22aaff;
        color: #435b70;
        background: #f1f9ff;
        line-height: 1.48;
      }
      .ccc-guide-actions {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        margin-top: 22px;
      }
      .ccc-guide-button {
        min-height: 48px;
        padding: 0 18px;
        border-radius: 12px;
        font: inherit;
        font-weight: 850;
        cursor: pointer;
      }
      .ccc-guide-button-secondary {
        border: 1px solid #cfdae3;
        color: #253b50;
        background: #fff;
      }
      .ccc-guide-button-primary {
        margin-left: auto;
        border: 1px solid #1598e9;
        color: #fff;
        background: #0879bd;
      }
      .ccc-guide-dots { display: flex; gap: 6px; align-items: center; }
      .ccc-guide-dots i { width: 8px; height: 8px; border-radius: 999px; background: #d3dee6; }
      .ccc-guide-dots i.is-active { width: 22px; background: #22aaff; }

      @media (max-width: 620px) {
        .ccc-guide-route-grid { grid-template-columns: minmax(0, 1fr); }
        .ccc-guide-inner { padding: 18px; }
        .ccc-guide-intro { margin-bottom: 14px; }
      }
      @media (max-height: 650px) {
        .ccc-guide-inner { padding-top: 16px; padding-bottom: 16px; }
        .ccc-guide-intro { margin: 8px 0 12px; font-size: 0.94rem; }
        .ccc-guide-route-grid article { padding: 12px; }
        .ccc-guide-step-grid { gap: 7px; }
        .ccc-guide-step-grid article { padding: 9px 11px; }
        .ccc-guide-checklist { gap: 7px; }
        .ccc-guide-checklist li { padding-top: 9px; padding-bottom: 9px; }
        .ccc-guide-actions { margin-top: 14px; }
      }
      @media (max-width: 520px) {
        .ccc-guide-launch { min-width: 52px; min-height: 40px; padding: 0 10px; font-size: 0.76rem; }
        .ccc-guide-actions { flex-wrap: wrap; }
        .ccc-guide-dots { order: -1; width: 100%; justify-content: center; }
      }
    `;
    document.head.appendChild(style);
  }

  function closeGuide() {
    const overlay = document.getElementById(DIALOG_ID);
    if (!overlay) return;
    markGuideSeen();
    overlay.remove();
    if (lastFocused && typeof lastFocused.focus === "function") lastFocused.focus();
  }

  function renderGuide() {
    const overlay = document.getElementById(DIALOG_ID);
    if (!overlay) return;
    const page = pages[pageIndex];
    const dots = pages.map((_, index) => `<i class="${index === pageIndex ? "is-active" : ""}"></i>`).join("");
    overlay.innerHTML = `
      <section class="ccc-guide-dialog" role="dialog" aria-modal="true" aria-labelledby="ccc-guide-title">
        <div class="ccc-guide-inner">
          <div class="ccc-guide-topline">
            <span class="ccc-guide-step">${page.step}</span>
            <button class="ccc-guide-close" type="button" data-guide-action="close" aria-label="Close programme guide">×</button>
          </div>
          <h2 id="ccc-guide-title">${page.title}</h2>
          <p class="ccc-guide-intro">${page.intro}</p>
          ${page.body}
          <div class="ccc-guide-actions">
            ${pageIndex > 0 ? `<button class="ccc-guide-button ccc-guide-button-secondary" type="button" data-guide-action="back">Back</button>` : `<span></span>`}
            <span class="ccc-guide-dots" aria-hidden="true">${dots}</span>
            <button class="ccc-guide-button ccc-guide-button-primary" type="button" data-guide-action="next">
              ${pageIndex === pages.length - 1 ? "Got it — return to programme" : "Next"}
            </button>
          </div>
        </div>
      </section>
    `;

    const dialog = overlay.querySelector(".ccc-guide-dialog");
    dialog?.scrollTo({ top: 0, behavior: "instant" });
    overlay.querySelector("[data-guide-action='next']")?.focus();
  }

  function openGuide(startPage = 0) {
    if (document.getElementById(DIALOG_ID)) return;
    installStyles();
    pageIndex = Math.max(0, Math.min(pages.length - 1, startPage));
    lastFocused = document.activeElement;
    const overlay = document.createElement("div");
    overlay.id = DIALOG_ID;
    overlay.className = "ccc-guide-overlay";
    overlay.addEventListener("click", (event) => {
      const action = event.target instanceof Element ? event.target.closest("[data-guide-action]")?.getAttribute("data-guide-action") : null;
      if (action === "close") return closeGuide();
      if (action === "back") {
        pageIndex = Math.max(0, pageIndex - 1);
        return renderGuide();
      }
      if (action === "next") {
        if (pageIndex >= pages.length - 1) return closeGuide();
        pageIndex += 1;
        return renderGuide();
      }
      if (event.target === overlay) closeGuide();
    });
    document.body.appendChild(overlay);
    renderGuide();
  }

  function installGuideButton() {
    installStyles();
    const header = document.querySelector(".ccc-header");
    if (!header || header.querySelector("[data-ccc-programme-guide]")) return;

    const button = document.createElement("button");
    button.type = "button";
    button.className = "ccc-guide-launch";
    button.dataset.cccProgrammeGuide = "1";
    button.textContent = "Guide";
    button.setAttribute("aria-label", "Open programme guide");
    button.addEventListener("click", () => openGuide(0));

    const dataButton = Array.from(header.querySelectorAll("button")).find((candidate) => /^data$/i.test((candidate.textContent || "").trim()));
    const targetParent = dataButton?.parentElement || header;
    targetParent.insertBefore(button, dataButton || null);
  }

  function maybeAutoOpen() {
    if (hasSeenGuide() || document.getElementById(DIALOG_ID)) return;
    const welcome = document.querySelector(".ccc-welcome");
    const header = document.querySelector(".ccc-header");
    const atProgrammeStart = /PROGRAMME\s*0%/i.test(header?.textContent || "");
    if (welcome && atProgrammeStart) openGuide(0);
  }

  function refresh() {
    installGuideButton();
    maybeAutoOpen();
  }

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && document.getElementById(DIALOG_ID)) closeGuide();
  });

  const observer = new MutationObserver(refresh);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", refresh, { once: true });
  else refresh();
})();
