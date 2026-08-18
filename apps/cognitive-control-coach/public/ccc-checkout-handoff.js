(() => {
  const checkoutState = new URLSearchParams(window.location.search).get("checkout");
  if (checkoutState !== "complete" && checkoutState !== "access") return;

  const app = document.getElementById("app");
  if (!app) return;

  let cancelled = false;
  let verificationStarted = false;
  let scheduled = false;

  const schedule = () => {
    if (scheduled) return;
    scheduled = true;
    window.setTimeout(() => {
      scheduled = false;
      ensureCheckoutHandoff();
    }, 0);
  };

  const addHandoffMessage = (screen, message) => {
    if (screen.querySelector("[data-ccc-checkout-handoff-message]")) return;
    const heading = screen.querySelector("h1");
    if (!heading) return;
    const note = document.createElement("p");
    note.className = "ccc-account-message";
    note.dataset.cccCheckoutHandoffMessage = "true";
    note.textContent = message;
    heading.insertAdjacentElement("afterend", note);
  };

  const enhanceAuthScreen = (screen) => {
    if (screen.dataset.cccCheckoutHandoff === "ready") return;
    screen.dataset.cccCheckoutHandoff = "ready";

    const heading = screen.querySelector("h1");
    if (heading) heading.textContent = "Enter the code sent to your checkout email.";

    addHandoffMessage(
      screen,
      checkoutState === "complete"
        ? "Payment received. Enter the email address used at checkout and the six-digit IQ Mindware code we just sent."
        : "Enter the checkout email and the six-digit IQ Mindware code from your email to continue.",
    );

    const emailInput = screen.querySelector("#ccc-account-email");
    if (!emailInput) return;

    let codeInput = screen.querySelector("#ccc-account-code");
    if (!codeInput) {
      const codeLabel = document.createElement("label");
      codeLabel.className = "ccc-field";

      const codeLabelText = document.createElement("span");
      codeLabelText.textContent = "Sign-in code";

      codeInput = document.createElement("input");
      codeInput.id = "ccc-account-code";
      codeInput.type = "text";
      codeInput.inputMode = "numeric";
      codeInput.autocomplete = "one-time-code";
      codeInput.placeholder = "123456";
      codeInput.setAttribute("aria-label", "Six-digit IQ Mindware sign-in code");

      codeLabel.append(codeLabelText, codeInput);
      emailInput.closest("label")?.insertAdjacentElement("afterend", codeLabel);
    }

    if (!screen.querySelector("[data-action='verify-sign-in']")) {
      const existingSend = screen.querySelector("[data-action='send-sign-in']");
      const actions = document.createElement("div");
      actions.className = "ccc-auth-actions";

      const verify = document.createElement("button");
      verify.type = "button";
      verify.className = "ccc-button ccc-button-primary";
      verify.dataset.action = "verify-sign-in";
      verify.textContent = "Activate access";
      actions.append(verify);

      if (existingSend) {
        existingSend.className = "ccc-button ccc-button-secondary";
        existingSend.textContent = "Send a new code";
        actions.append(existingSend);
      }

      const codeLabel = codeInput.closest("label");
      codeLabel?.insertAdjacentElement("afterend", actions);
    }

    if (checkoutState === "complete") {
      const email = /** @type {HTMLInputElement} */ (emailInput);
      if (!email.value) email.focus({ preventScroll: true });
    }
  };

  const enhanceAccessScreen = (screen) => {
    const signOut = screen.querySelector("[data-action='sign-out']");
    if (signOut) {
      addHandoffMessage(
        screen,
        "Payment received. This browser is already signed in to an IQ Mindware account. If it is not the checkout email, choose ‘Use a different checkout email’ below and enter the code we sent.",
      );
    }
  };

  function ensureCheckoutHandoff() {
    if (cancelled || verificationStarted) return;

    const authScreen = app.querySelector(".ccc-auth-screen");
    if (authScreen) {
      enhanceAuthScreen(authScreen);
      return;
    }

    const accessScreen = app.querySelector(".ccc-access-screen");
    if (!accessScreen) return;

    enhanceAccessScreen(accessScreen);
    const signIn = accessScreen.querySelector("[data-action='access-sign-in']");
    if (signIn) {
      signIn.click();
      schedule();
    }
  }

  app.addEventListener("click", (event) => {
    const action = event.target instanceof Element
      ? event.target.closest("[data-action]")?.getAttribute("data-action")
      : null;
    if (action === "return-access") cancelled = true;
    if (action === "verify-sign-in") verificationStarted = true;
  }, true);

  const observer = new MutationObserver(schedule);
  observer.observe(app, { childList: true, subtree: true });

  window.setTimeout(ensureCheckoutHandoff, 250);
})();
