(() => {
  "use strict";

  const params = new URLSearchParams(window.location.search);
  const checkoutState = params.get("checkout");
  if (checkoutState !== "complete" && checkoutState !== "access") return;

  const app = document.getElementById("app");
  if (!app) return;

  const COACH_URL = "https://www.iqmindware.com/cognitive-control-coach/?checkout=access";
  const G_TRACK_URL = "https://www.iqmindware.com/g-track-test-battery/";
  const STYLE_ID = "ccc-access-route-links-style";

  function ensureStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      .ccc-route-links {
        box-sizing: border-box;
        width: 100%;
        margin: 1rem 0 1.1rem;
        padding: 1rem;
        border: 1px solid rgba(34, 170, 255, 0.32);
        border-radius: 18px;
        background: rgba(34, 170, 255, 0.07);
      }
      .ccc-route-links * { box-sizing: border-box; }
      .ccc-route-links__eyebrow {
        display: block;
        margin: 0 0 .35rem;
        color: #2764B7;
        font-size: .78rem;
        font-weight: 800;
        letter-spacing: .08em;
        text-transform: uppercase;
      }
      .ccc-route-links h2 {
        margin: 0 0 .45rem;
        color: #13283c;
        font-size: clamp(1.05rem, 2.3vw, 1.3rem);
        line-height: 1.2;
      }
      .ccc-route-links p {
        margin: 0;
        color: #53677b;
        font-size: .96rem;
        line-height: 1.5;
      }
      .ccc-route-links__actions {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: .7rem;
        margin-top: .9rem;
      }
      .ccc-route-links__button {
        display: flex;
        min-height: 48px;
        align-items: center;
        justify-content: center;
        padding: .78rem 1rem;
        border: 2px solid #168fd4;
        border-radius: 999px;
        text-align: center;
        text-decoration: none;
        font-weight: 800;
        line-height: 1.2;
      }
      .ccc-route-links__button--primary {
        background: #168fd4;
        color: #fff;
      }
      .ccc-route-links__button--secondary {
        background: #fff;
        color: #126b9f;
      }
      .ccc-route-links__note {
        margin-top: .8rem !important;
        font-size: .87rem !important;
      }
      @media (max-width: 620px) {
        .ccc-route-links { padding: .9rem; border-radius: 16px; }
        .ccc-route-links__actions { grid-template-columns: 1fr; }
      }
    `;
    document.head.append(style);
  }

  function makePanel() {
    const panel = document.createElement("section");
    panel.className = "ccc-route-links";
    panel.dataset.cccRouteLinks = "true";
    panel.setAttribute("aria-label", "IQ Mindware app links");

    const eyebrow = document.createElement("span");
    eyebrow.className = "ccc-route-links__eyebrow";
    eyebrow.textContent = checkoutState === "complete" ? "Payment received" : "Your IQ Mindware apps";

    const heading = document.createElement("h2");
    heading.textContent = "Open your apps here";

    const intro = document.createElement("p");
    intro.textContent = "Complete Route purchasers have both apps. Start with G Track for your baseline, then continue with Cognitive Control Coach.";

    const actions = document.createElement("div");
    actions.className = "ccc-route-links__actions";

    const gTrack = document.createElement("a");
    gTrack.className = "ccc-route-links__button ccc-route-links__button--primary";
    gTrack.href = G_TRACK_URL;
    gTrack.textContent = "Open G Track";

    const coach = document.createElement("a");
    coach.className = "ccc-route-links__button ccc-route-links__button--secondary";
    coach.href = COACH_URL;
    coach.textContent = "Open Cognitive Control Coach";

    actions.append(gTrack, coach);

    const note = document.createElement("p");
    note.className = "ccc-route-links__note";
    note.textContent = "If you purchased Coach only, use the Coach button. On a new device, sign in with the email address used at checkout and the six-digit code sent to that email.";

    panel.append(eyebrow, heading, intro, actions, note);
    return panel;
  }

  function enhance() {
    ensureStyles();
    const screen = app.querySelector(".ccc-access-screen, .ccc-auth-screen");
    if (!screen || screen.querySelector("[data-ccc-route-links]")) return;

    const heading = screen.querySelector("h1");
    const anchor = screen.querySelector(".ccc-account-message") || heading;
    const panel = makePanel();
    if (anchor) anchor.insertAdjacentElement("afterend", panel);
    else screen.prepend(panel);
  }

  const observer = new MutationObserver(enhance);
  observer.observe(app, { childList: true, subtree: true });
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", enhance, { once: true });
  } else {
    enhance();
  }
})();
