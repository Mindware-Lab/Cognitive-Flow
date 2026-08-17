(() => {
  "use strict";

  const copy = {
    kicker: "Attention · working memory · decisions",
    lead:
      "Train attention control, relative-frame working memory and decision timing across changing formats, speeds and reward–penalty trade-offs.",
    facts: [
      "Attention + relative-frame WM",
      "Four decision environments",
      "Progress at your pace",
    ],
    panelTitle: "The display and trade-offs change. The control sequence stays connected.",
    moves: [
      {
        title: "Find the relation",
        body: "Recover the majority direction under interference.",
      },
      {
        title: "Hold and compare",
        body: "Use relative-frame In/Out n-back to compare the current relation with one or more steps back.",
      },
      {
        title: "Choose for the trade-off",
        body: "Adapt decision time when speed, accuracy, rewards and mistake costs change.",
      },
    ],
  };

  function setText(node, value) {
    if (node && node.textContent !== value) node.textContent = value;
  }

  function applyProductCopy() {
    const hero = document.querySelector(".ccc-hero");
    if (!hero) return;

    setText(hero.querySelector(".ccc-kicker"), copy.kicker);
    setText(hero.querySelector(".ccc-lead"), copy.lead);

    hero.querySelectorAll(".ccc-hero-facts span").forEach((node, index) => {
      if (copy.facts[index]) setText(node, copy.facts[index]);
    });

    const panel = hero.querySelector(".ccc-control-panel");
    if (!panel) return;
    setText(panel.querySelector("h2"), copy.panelTitle);

    panel.querySelectorAll(".ccc-control-strip article").forEach((article, index) => {
      const item = copy.moves[index];
      if (!item) return;
      setText(article.querySelector("strong"), item.title);
      setText(article.querySelector("small"), item.body);
    });
  }

  const observer = new MutationObserver(applyProductCopy);
  observer.observe(document.documentElement, { childList: true, subtree: true });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", applyProductCopy, { once: true });
  } else {
    applyProductCopy();
  }
})();
