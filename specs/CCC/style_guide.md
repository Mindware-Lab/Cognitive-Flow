# Attention Coach / IQ Coach

## CSS & App Style Guide

### IQ Mindware science-chic cognitive training interface

## 1. Product design principle

Attention Coach / IQ Coach should feel like:

**calm cognitive science + premium digital coaching + structured attention training**

The app should help users understand five things:

```text
capacity
progress
transfer
confidence
next step
```

The app should not expose internal research machinery. The user-facing interface should show simple, motivational, meaningful training indicators.

Use:

```text
Attention Control
Binding Focus
Transfer Score
Motion Recovery
Relation Recovery
Mixed Flexibility
Return Strength
Training Score
bits/sec
confidence
trend
```

Avoid consumer-facing use of:

```text
CCC
BSE
MIR
ASI
CBA
LISS
PRR
MI recovery
alpha stability
beta alignment
entropy
trajectory windows
ET thresholds
carrier-swap boundaries
psychometric model details
```

Final product rule:

```text
Show the user what is improving and whether it carries over.
Keep the transfer machinery in the background.
```

---

# 2. Visual identity

The interface should feel:

```text
clean
precise
calm
evidence-aware
lightly aspirational
not clinical
not gamey
not hype-driven
```

The visual style should use:

```text
white / pale-grey backgrounds
charcoal text
cyan action colour
deep blue structure
sparse lime success / transfer / validation highlights
rounded cards
thin blue outlines
soft shadows
subtle science motifs
minimal icons
```

Avoid:

```text
neon gradients
cartoon brains
generic AI imagery
casino-style gamification
large lime panels
heavy 3D
overloaded dashboards
medicalised deficit language
```

---

# 3. Core CSS tokens

```css
:root {
  /* Brand colours */
  --iq-blue: #22AAFF;
  --iq-blue-deep: #2764B7;
  --iq-lime: #CCFF66;
  --iq-lime-readable: #79B80E;
  --iq-charcoal: #333333;
  --iq-white: #FFFFFF;

  /* Neutral scale */
  --iq-grey-25: #FAFBFC;
  --iq-grey-50: #F5F7FA;
  --iq-grey-100: #EEF2F6;
  --iq-grey-200: #E0E0E0;
  --iq-grey-300: #C9D2DC;
  --iq-grey-500: #6D6D6D;
  --iq-grey-700: #46515C;
  --iq-grey-900: #182230;

  /* Semantic states */
  --iq-success: #8AD62A;
  --iq-warning: #FFB84D;
  --iq-risk: #FF6B6B;
  --iq-info: #22AAFF;

  /* Surfaces */
  --surface-main: #FFFFFF;
  --surface-soft: #F5F7FA;
  --surface-panel: rgba(255, 255, 255, 0.9);
  --surface-tint-blue: #F0F8FF;
  --surface-tint-lime: #F5FFE6;
  --surface-warning: #FFF8ED;
  --surface-risk: #FFF2F2;

  /* Text */
  --text-main: #182230;
  --text-body: #333333;
  --text-muted: #6D6D6D;
  --text-soft: #8A96A3;
  --text-inverse: #FFFFFF;

  /* Lines */
  --line-soft: #E0E0E0;
  --line-blue: #22AAFF;
  --line-blue-deep: #2764B7;
  --line-success: rgba(138, 214, 42, 0.55);

  /* Shadows */
  --shadow-soft: 0 8px 24px rgba(24, 34, 48, 0.08);
  --shadow-card: 0 12px 32px rgba(24, 34, 48, 0.10);
  --shadow-active: 0 0 0 4px rgba(34, 170, 255, 0.16);
  --shadow-success: 0 0 0 4px rgba(204, 255, 102, 0.24);

  /* Radius */
  --radius-xs: 6px;
  --radius-sm: 8px;
  --radius-md: 14px;
  --radius-lg: 22px;
  --radius-xl: 30px;
  --radius-pill: 999px;

  /* Spacing */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 24px;
  --space-6: 32px;
  --space-7: 48px;
  --space-8: 64px;

  /* Layout */
  --app-max-width: 1180px;
  --content-max-width: 920px;
  --task-max-width: 720px;

  /* Typography */
  --font-sans: Inter, Aptos, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  --font-mono: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
}
```

---

# 4. Global base styles

```css
* {
  box-sizing: border-box;
}

html {
  -webkit-text-size-adjust: 100%;
}

body {
  margin: 0;
  font-family: var(--font-sans);
  background: var(--surface-soft);
  color: var(--text-body);
  line-height: 1.5;
}

button,
input,
textarea,
select {
  font: inherit;
}

button {
  cursor: pointer;
}

a {
  color: var(--iq-blue-deep);
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}

img,
svg {
  max-width: 100%;
}

:focus-visible {
  outline: 3px solid rgba(34, 170, 255, 0.45);
  outline-offset: 3px;
}
```

---

# 5. Typography

Use a restrained type hierarchy. Avoid too many type sizes.

```css
.iq-title {
  color: var(--text-main);
  font-size: clamp(2rem, 5vw, 4rem);
  line-height: 0.98;
  letter-spacing: -0.045em;
  font-weight: 820;
}

.iq-title--compact {
  font-size: clamp(1.8rem, 3.5vw, 3rem);
}

.iq-subtitle {
  color: var(--text-muted);
  font-size: 1.1rem;
  line-height: 1.55;
  max-width: 62ch;
}

.iq-section-title {
  color: var(--text-main);
  font-size: clamp(1.45rem, 2.5vw, 2.2rem);
  line-height: 1.1;
  letter-spacing: -0.035em;
  font-weight: 780;
}

.iq-card-title {
  color: var(--text-main);
  font-size: 1.25rem;
  line-height: 1.2;
  letter-spacing: -0.02em;
  font-weight: 760;
}

.iq-body {
  color: var(--text-body);
  font-size: 1rem;
  line-height: 1.55;
}

.iq-caption {
  color: var(--text-muted);
  font-size: 0.86rem;
  line-height: 1.4;
}

.iq-kicker,
.iq-label {
  color: var(--iq-blue-deep);
  font-size: 0.78rem;
  font-weight: 820;
  letter-spacing: 0.09em;
  text-transform: uppercase;
}

.iq-accent {
  color: var(--iq-blue);
}

.iq-highlight {
  color: var(--iq-lime-readable);
}

.iq-muted {
  color: var(--text-muted);
}
```

Headline examples:

```text
Train attention under change.

Your score improved.
Now test whether it transfers.

Today’s route:
Motion Foundation.
```

---

# 6. App shell

Use the full “science-chic” background for dashboards, profile, transfer and progress screens.

```css
.iq-app {
  min-height: 100vh;
  background:
    radial-gradient(circle at 86% 8%, rgba(34, 170, 255, 0.08), transparent 28rem),
    radial-gradient(circle at 10% 18%, rgba(204, 255, 102, 0.08), transparent 20rem),
    linear-gradient(180deg, #FFFFFF 0%, #F5F7FA 100%);
  color: var(--text-body);
}

.iq-container {
  width: min(100% - 32px, var(--app-max-width));
  margin-inline: auto;
  padding: var(--space-5) 0 var(--space-8);
}

.iq-content {
  width: min(100%, var(--content-max-width));
  margin-inline: auto;
}

.iq-main-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(280px, 0.8fr);
  gap: var(--space-5);
  align-items: start;
}

@media (max-width: 880px) {
  .iq-main-grid {
    grid-template-columns: 1fr;
  }
}
```

---

# 7. Brand header

```css
.iq-brand-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  padding: var(--space-4) 0 var(--space-5);
}

.iq-brand-lockup {
  display: inline-flex;
  align-items: center;
  gap: var(--space-3);
  color: var(--text-main);
  font-weight: 760;
  letter-spacing: -0.015em;
}

.iq-brand-mark {
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  color: var(--iq-blue-deep);
}

.iq-brand-divider {
  width: 1px;
  height: 24px;
  background: var(--line-soft);
}

.iq-brand-product {
  color: var(--iq-blue-deep);
  font-weight: 760;
}

.iq-header-actions {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}
```

Brand lockup examples:

```text
IQ Mindware | Attention Coach
IQ Mindware | IQ Coach
IQ Mindware | Exam Resilience
```

---

# 8. Primary navigation

The main app navigation should be fixed around five areas:

```text
Today
Train
Progress
Transfer
Profile
```

Settings may exist, but should sit under a secondary menu.

```css
.iq-nav {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 6px;
  background: rgba(255, 255, 255, 0.84);
  border: 1px solid var(--line-soft);
  border-radius: var(--radius-pill);
  box-shadow: var(--shadow-soft);
  backdrop-filter: blur(10px);
}

.iq-nav__item {
  min-height: 38px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 9px 15px;
  border-radius: var(--radius-pill);
  color: var(--text-muted);
  font-weight: 720;
  font-size: 0.94rem;
  text-decoration: none;
  transition: background 160ms ease, color 160ms ease, transform 160ms ease;
}

.iq-nav__item:hover {
  background: var(--surface-tint-blue);
  color: var(--iq-blue-deep);
  text-decoration: none;
}

.iq-nav__item[aria-current="page"] {
  background: var(--surface-tint-blue);
  color: var(--iq-blue-deep);
}

.iq-nav__item--transfer {
  color: var(--iq-blue-deep);
}

@media (max-width: 680px) {
  .iq-nav {
    width: 100%;
    overflow-x: auto;
    justify-content: flex-start;
    border-radius: var(--radius-lg);
  }

  .iq-nav__item {
    white-space: nowrap;
  }
}
```

---

# 9. Cards and panels

```css
.iq-card {
  background: var(--surface-panel);
  border: 1px solid var(--line-soft);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-soft);
  padding: var(--space-5);
  backdrop-filter: blur(10px);
}

.iq-card--active {
  border-color: rgba(34, 170, 255, 0.55);
  box-shadow: var(--shadow-card), var(--shadow-active);
}

.iq-card--success {
  border-color: var(--line-success);
  background: linear-gradient(180deg, #FFFFFF 0%, var(--surface-tint-lime) 100%);
}

.iq-card--muted {
  background: var(--surface-soft);
  box-shadow: none;
}

.iq-card--dashed {
  border-style: dashed;
}

.iq-panel-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-4);
  margin-bottom: var(--space-4);
}

.iq-card-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
}

.iq-divider {
  height: 1px;
  background: var(--line-soft);
  margin: var(--space-5) 0;
}
```

---

# 10. Buttons

```css
.iq-btn {
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  padding: 0 var(--space-5);
  border: 1px solid transparent;
  border-radius: var(--radius-pill);
  font-weight: 760;
  font-size: 0.96rem;
  text-decoration: none;
  transition: transform 160ms ease, box-shadow 160ms ease, background 160ms ease;
}

.iq-btn:hover {
  text-decoration: none;
}

.iq-btn--primary {
  background: linear-gradient(180deg, var(--iq-blue) 0%, var(--iq-blue-deep) 100%);
  color: var(--text-inverse);
  box-shadow: 0 10px 24px rgba(39, 100, 183, 0.24);
}

.iq-btn--primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 14px 30px rgba(39, 100, 183, 0.28);
}

.iq-btn--secondary {
  background: #FFFFFF;
  color: var(--iq-blue-deep);
  border-color: rgba(39, 100, 183, 0.25);
}

.iq-btn--soft {
  background: var(--surface-tint-blue);
  color: var(--iq-blue-deep);
}

.iq-btn--success {
  background: var(--iq-lime);
  color: #173300;
}

.iq-btn--ghost {
  background: transparent;
  color: var(--iq-blue-deep);
}

.iq-btn--block {
  width: 100%;
}
```

Button text examples:

```text
Start today’s session
View Transfer Score
View progress
Continue training
Run return check
Done
```

Avoid:

```text
Unlock genius
Boost IQ now
Crush the challenge
Fix your brain
```

---

# 11. Today screen

Purpose: give the user a clear route into the next session.

Required elements:

```text
Greeting
Session count
Current phase
Primary CTA
Mini score summary
Transfer Score mini-card
```

```css
.today-hero {
  display: grid;
  grid-template-columns: minmax(0, 1.25fr) minmax(280px, 0.75fr);
  gap: var(--space-5);
  align-items: stretch;
  margin-top: var(--space-4);
}

.today-hero__main {
  padding: clamp(24px, 5vw, 48px);
}

.today-session-pill {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: 7px 12px;
  border-radius: var(--radius-pill);
  background: var(--surface-tint-blue);
  color: var(--iq-blue-deep);
  font-size: 0.86rem;
  font-weight: 760;
}

.today-phase {
  margin-top: var(--space-4);
  color: var(--text-muted);
  font-size: 1.05rem;
}

.today-actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
  margin-top: var(--space-5);
}

.today-summary {
  display: grid;
  gap: var(--space-3);
}

.today-mini-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  padding: var(--space-3) 0;
  border-bottom: 1px solid var(--line-soft);
}

.today-mini-row:last-child {
  border-bottom: 0;
}

@media (max-width: 860px) {
  .today-hero {
    grid-template-columns: 1fr;
  }
}
```

Example copy:

```text
Welcome back

Session 7 of 20
Current phase: Motion Foundation

Today you’ll practise carrying your attention skill into moving patterns.

[Start today’s session]

Current profile
Attention Control: 3.4 bits/sec · 104
Binding Focus: calibrating
Transfer Score: calibrating
```

---

# 12. Pre-session briefing

Purpose: prepare the user without overexplaining the machinery.

```css
.briefing-card {
  max-width: 760px;
  margin: var(--space-6) auto;
  text-align: left;
}

.briefing-phase {
  display: inline-flex;
  align-items: center;
  padding: 6px 12px;
  border-radius: var(--radius-pill);
  background: var(--surface-tint-blue);
  color: var(--iq-blue-deep);
  font-size: 0.84rem;
  font-weight: 780;
}

.briefing-note {
  margin-top: var(--space-4);
  padding: var(--space-4);
  border-radius: var(--radius-md);
  background: var(--surface-soft);
  color: var(--text-muted);
}
```

Phase copy:

```text
Direction Foundation
Build your attention baseline with static direction patterns.

Motion Foundation
The same skill now appears in moving patterns. A short dip is normal when the format changes.

Relation Foundation
Now the task shifts from simple direction to direction relative to the centre.

Motion Relations
You’ll practise recovering relative direction in moving patterns.

Mixed Mastery
Formats will now switch unpredictably, so your attention has to stay flexible.

Return Check
This re-check shows what still carries over after spacing.
```

---

# 13. Low-distraction task screen

Task screens should be much quieter than dashboards. During a live task, do not show score cards, accuracy, bits/sec, Training Score, Transfer Score, staircase level, difficulty labels, entropy or any research metrics.

Show only:

```text
central stimulus area
two or four large response buttons
thin progress indicator
minimal feedback pulse
sound toggle
pause button
```

```css
.task-screen {
  min-height: 100vh;
  background: #FFFFFF;
  display: grid;
  grid-template-rows: auto 1fr auto;
  color: var(--text-main);
}

.task-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  padding: var(--space-4);
}

.task-session-label {
  color: var(--text-muted);
  font-size: 0.88rem;
  font-weight: 700;
}

.task-controls {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.task-icon-btn {
  width: 40px;
  height: 40px;
  display: grid;
  place-items: center;
  border: 1px solid var(--line-soft);
  border-radius: 50%;
  background: #FFFFFF;
  color: var(--iq-blue-deep);
}

.task-progress {
  height: 4px;
  background: var(--iq-grey-100);
  border-radius: var(--radius-pill);
  overflow: hidden;
}

.task-progress__fill {
  height: 100%;
  width: var(--progress, 0%);
  background: var(--iq-blue);
  border-radius: inherit;
}

.task-stage {
  display: grid;
  place-items: center;
  padding: var(--space-5);
}

.task-stimulus-panel {
  width: min(100%, 680px);
  min-height: clamp(280px, 48vh, 420px);
  display: grid;
  place-items: center;
  background: #FFFFFF;
  border: 1px solid var(--line-soft);
  border-radius: var(--radius-xl);
  box-shadow: 0 8px 28px rgba(24, 34, 48, 0.06);
}

.task-stimulus {
  display: grid;
  place-items: center;
  min-width: 120px;
  min-height: 120px;
  font-size: clamp(3rem, 12vw, 7rem);
  font-weight: 840;
  color: var(--text-main);
}

.task-stimulus--active {
  color: var(--iq-blue-deep);
}

.task-stimulus--probe {
  outline: 3px solid rgba(34, 170, 255, 0.28);
  border-radius: var(--radius-lg);
}

.task-response-grid {
  width: min(100% - 32px, 680px);
  margin: 0 auto var(--space-5);
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-3);
}

.task-response-grid--four {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.task-response-btn {
  min-height: 64px;
  border: 1px solid var(--line-soft);
  border-radius: var(--radius-md);
  background: #FFFFFF;
  color: var(--text-main);
  font-weight: 760;
  box-shadow: 0 4px 14px rgba(24, 34, 48, 0.05);
}

.task-response-btn:active {
  transform: translateY(1px);
}

.task-response-btn kbd {
  display: inline-grid;
  place-items: center;
  min-width: 32px;
  height: 32px;
  margin-right: var(--space-2);
  border-radius: var(--radius-sm);
  background: var(--surface-soft);
  border: 1px solid var(--line-soft);
  color: var(--iq-blue-deep);
  font-family: var(--font-mono);
}

.task-feedback-pulse {
  position: fixed;
  left: 50%;
  bottom: 116px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--iq-blue);
  opacity: 0;
  transform: translateX(-50%) scale(0.8);
}

.task-feedback-pulse.is-visible {
  opacity: 1;
  transform: translateX(-50%) scale(1);
}
```

---

# 14. Session complete screen

Purpose: reinforce progress, normalise expected dips and preview the next route.

```css
.complete-screen {
  max-width: 920px;
  margin: var(--space-6) auto;
}

.complete-header {
  text-align: center;
  margin-bottom: var(--space-6);
}

.complete-score-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: var(--space-4);
}

.complete-note {
  margin-top: var(--space-5);
  padding: var(--space-4);
  border-radius: var(--radius-md);
  background: var(--surface-tint-blue);
  color: var(--text-body);
}

.complete-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: var(--space-3);
  margin-top: var(--space-5);
}
```

Example copy:

```text
Nice work today

Moving patterns were harder than static patterns, which is normal during a format change. Your next session will keep practising motion recovery.

[View progress]
[View Transfer Score]
[Done]
```

---

# 15. Score cards

The canonical consumer score names are:

```text
Attention Control
Binding Focus
Transfer Score
Motion Recovery
Relation Recovery
Mixed Flexibility
Return Strength
```

```css
.score-card {
  background: #FFFFFF;
  border: 1px solid var(--line-soft);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
  box-shadow: var(--shadow-soft);
}

.score-card__label {
  color: var(--iq-blue-deep);
  font-size: 0.78rem;
  font-weight: 820;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.score-card__value {
  margin-top: var(--space-2);
  color: var(--text-main);
  font-size: clamp(2rem, 4vw, 3rem);
  line-height: 1;
  font-weight: 840;
  letter-spacing: -0.045em;
}

.score-card__subvalue {
  margin-top: var(--space-2);
  color: var(--text-muted);
  font-size: 0.95rem;
  font-weight: 650;
}

.score-card__description {
  margin-top: var(--space-3);
  color: var(--text-body);
  font-size: 0.95rem;
  line-height: 1.45;
}

.score-card__footer {
  margin-top: var(--space-4);
  padding-top: var(--space-3);
  border-top: 1px solid var(--line-soft);
}
```

Example component:

```html
<article class="score-card">
  <div class="score-card__label">Attention Control</div>
  <div class="score-card__value">3.4 bits/sec</div>
  <div class="score-card__subvalue">Training Score: 104 · Confidence: moderate</div>
  <p class="score-card__description">
    How efficiently you pick out the important signal from a brief display.
  </p>
</article>
```

---

# 16. Transfer Score card

Transfer Score must never disappear. It can be:

```text
Calibrating
Early signal
Developing
Complete
```

But the user must always be able to access it from:

```text
Today screen
Progress screen
Transfer screen
```

```css
.transfer-card {
  background: #FFFFFF;
  border: 1px solid rgba(39, 100, 183, 0.22);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-soft);
  padding: var(--space-5);
}

.transfer-card--calibrating {
  background: linear-gradient(180deg, #FFFFFF 0%, #F5F7FA 100%);
  border-style: dashed;
}

.transfer-card--active {
  border-color: rgba(34, 170, 255, 0.55);
  box-shadow: var(--shadow-card), var(--shadow-active);
}

.transfer-card--strong {
  border-color: rgba(138, 214, 42, 0.55);
  background: linear-gradient(180deg, #FFFFFF 0%, var(--surface-tint-lime) 100%);
}

.transfer-card__status {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-radius: var(--radius-pill);
  background: var(--surface-tint-blue);
  color: var(--iq-blue-deep);
  font-size: 0.82rem;
  font-weight: 760;
}

.transfer-card__value {
  margin-top: 12px;
  font-size: clamp(2rem, 5vw, 3.5rem);
  line-height: 1;
  font-weight: 840;
  letter-spacing: -0.045em;
  color: var(--text-main);
}

.transfer-card__note {
  margin-top: 12px;
  color: var(--text-muted);
  font-size: 0.95rem;
}

.transfer-subscore-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
  gap: var(--space-4);
}
```

Early copy:

```text
Transfer Score
Calibrating

This score becomes clearer as you complete motion, relation, mixed and return-check sessions.
```

Developing copy:

```text
Transfer Score
68 / 100
Developing

How well your trained attention skill carries across changing display formats.
```

Claims note:

```text
Transfer Score is a training indicator. It shows whether skills practised in one display format appear to carry into changed formats. It is not a diagnosis or an official IQ score.
```

---

# 17. Confidence labels

Use these confidence labels:

```text
calibrating
moderate confidence
high confidence
timing limited
unstable today
```

```css
.confidence-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 10px;
  border-radius: var(--radius-pill);
  font-size: 0.78rem;
  font-weight: 760;
  line-height: 1;
}

.confidence-pill--calibrating {
  background: var(--surface-soft);
  color: var(--text-muted);
}

.confidence-pill--moderate {
  background: var(--surface-tint-blue);
  color: var(--iq-blue-deep);
}

.confidence-pill--high {
  background: var(--surface-tint-lime);
  color: #4E7A00;
}

.confidence-pill--timing {
  background: var(--surface-warning);
  color: #8A5700;
}

.confidence-pill--unstable {
  background: var(--surface-risk);
  color: #A12A2A;
}
```

Consumer meanings:

```text
Calibrating
More sessions are needed before this score is stable.

Moderate confidence
Enough data are available for a useful training estimate.

High confidence
This score is based on repeated stable sessions.

Timing limited
Device timing may have affected the estimate.

Unstable today
Today’s session looked unusually variable.
```

---

# 18. Progress charts

Progress charts should show:

```text
small dots = actual session scores
solid line = smoothed trend
phase shading = programme stage
```

Do not hide variability. Variability is normal, especially around new display formats.

```css
.progress-chart {
  background: #FFFFFF;
  border: 1px solid var(--line-soft);
  border-radius: var(--radius-xl);
  padding: var(--space-5);
  box-shadow: var(--shadow-soft);
}

.progress-chart__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-4);
  margin-bottom: var(--space-4);
}

.chart-toggle {
  display: inline-flex;
  gap: 4px;
  padding: 4px;
  border-radius: var(--radius-pill);
  border: 1px solid var(--line-soft);
  background: #FFFFFF;
}

.chart-toggle__btn {
  border: 0;
  border-radius: var(--radius-pill);
  padding: 8px 12px;
  background: transparent;
  color: var(--text-muted);
  font-weight: 720;
}

.chart-toggle__btn[aria-pressed="true"] {
  background: var(--surface-tint-blue);
  color: var(--iq-blue-deep);
}

.chart-dot {
  fill: #FFFFFF;
  stroke: var(--iq-blue-deep);
  stroke-width: 2;
}

.chart-dot--transfer {
  stroke: var(--iq-lime-readable);
}

.chart-line {
  fill: none;
  stroke: var(--iq-blue);
  stroke-width: 3;
  stroke-linecap: round;
}

.chart-line--transfer {
  stroke: var(--iq-lime-readable);
}

.chart-phase-band {
  fill: rgba(34, 170, 255, 0.06);
}

.chart-phase-label {
  fill: var(--text-muted);
  font-size: 12px;
  font-weight: 700;
}

.chart-placeholder {
  stroke: var(--iq-grey-300);
  stroke-width: 2;
  stroke-dasharray: 5 6;
  fill: none;
}
```

Chart modes:

```text
Capacity
Attention Control
Binding Focus

Transfer
Transfer Score
Motion Recovery
Relation Recovery
Mixed Flexibility
Return Strength
```

---

# 19. 20-session journey screen

Use the 20-session journey as a clear pathway, not a locked progression.

Use:

```text
Current phase
Complete
Coming up next
Available later
```

Avoid:

```text
Locked
Failed
Passed
Deficit
Weak
```

```css
.journey-grid {
  display: grid;
  gap: var(--space-4);
}

.journey-progress {
  height: 10px;
  background: var(--iq-grey-100);
  border-radius: var(--radius-pill);
  overflow: hidden;
}

.journey-progress__fill {
  height: 100%;
  width: var(--progress, 0%);
  background: linear-gradient(90deg, var(--iq-blue), var(--iq-blue-deep));
  border-radius: inherit;
}

.phase-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
  gap: var(--space-4);
}

.phase-card {
  background: #FFFFFF;
  border: 1px solid var(--line-soft);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  box-shadow: var(--shadow-soft);
}

.phase-card--current {
  border-color: var(--iq-blue);
  box-shadow: var(--shadow-card), var(--shadow-active);
}

.phase-card--complete {
  border-color: var(--line-success);
}

.phase-card--upcoming {
  background: var(--surface-soft);
  color: var(--text-muted);
  box-shadow: none;
}

.phase-status {
  display: inline-flex;
  padding: 4px 10px;
  border-radius: var(--radius-pill);
  font-size: 0.75rem;
  font-weight: 780;
  background: var(--surface-tint-blue);
  color: var(--iq-blue-deep);
}

.phase-card--complete .phase-status {
  background: var(--surface-tint-lime);
  color: #4E7A00;
}

.phase-card__sessions {
  margin-top: var(--space-3);
  color: var(--text-muted);
  font-size: 0.86rem;
  font-weight: 700;
}

.phase-card__title {
  margin-top: var(--space-2);
  color: var(--text-main);
  font-size: 1.08rem;
  font-weight: 780;
}

.phase-card__copy {
  margin-top: var(--space-2);
  color: var(--text-muted);
  font-size: 0.94rem;
}
```

Phase schedule:

```text
Sessions 1–5
Direction Foundation
Build your baseline with static direction patterns.

Sessions 6–8
Motion Foundation
Practise the same attention skill in moving patterns.

Sessions 9–12
Relation Foundation
Shift from simple direction to centre-relative direction.

Sessions 13–15
Motion Relations
Recover relative-direction skill in moving patterns.

Sessions 16–18
Mixed Mastery
Switch between static, moving, simple and relative displays.

Sessions 19–20
Return Check
Re-check what still carries over after spacing.
```

---

# 20. 2 × 2 format matrix

The Profile dashboard should show a simple matrix.

Use plain labels:

```text
Static patterns
Moving patterns
Simple direction
Relative direction
```

Do not expose internal labels such as:

```text
arrow_abs
flow_abs
arrow_rel
flow_rel
```

```css
.format-matrix {
  overflow: hidden;
  border: 1px solid var(--line-soft);
  border-radius: var(--radius-lg);
  background: #FFFFFF;
  box-shadow: var(--shadow-soft);
}

.format-matrix table {
  width: 100%;
  border-collapse: collapse;
}

.format-matrix th,
.format-matrix td {
  padding: var(--space-4);
  border-bottom: 1px solid var(--line-soft);
  border-right: 1px solid var(--line-soft);
  text-align: left;
  vertical-align: top;
}

.format-matrix th {
  background: var(--surface-soft);
  color: var(--text-muted);
  font-size: 0.82rem;
  font-weight: 780;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.format-matrix td {
  color: var(--text-main);
  font-weight: 720;
}

.format-matrix tr:last-child td {
  border-bottom: 0;
}

.format-matrix th:last-child,
.format-matrix td:last-child {
  border-right: 0;
}

.matrix-score {
  display: block;
  font-size: 1.2rem;
  font-weight: 820;
  color: var(--text-main);
}

.matrix-subscore {
  display: block;
  margin-top: 4px;
  color: var(--text-muted);
  font-size: 0.88rem;
}
```

Example cell:

```text
Static patterns / Simple direction
104 · 3.4 bits/sec
```

---

# 21. Feedback states

Feedback should sound like coaching, not judgement.

```css
.feedback-note {
  display: flex;
  gap: var(--space-3);
  align-items: flex-start;
  padding: var(--space-4);
  border-radius: var(--radius-md);
  border: 1px solid var(--line-soft);
  background: #FFFFFF;
}

.feedback-note--info {
  border-left: 5px solid var(--iq-blue);
  background: var(--surface-tint-blue);
}

.feedback-note--success {
  border-left: 5px solid var(--iq-lime);
  background: var(--surface-tint-lime);
}

.feedback-note--warning {
  border-left: 5px solid var(--iq-warning);
  background: var(--surface-warning);
}

.feedback-note--risk {
  border-left: 5px solid var(--iq-risk);
  background: var(--surface-risk);
}

.feedback-note__title {
  font-weight: 780;
  color: var(--text-main);
}

.feedback-note__copy {
  margin-top: 4px;
  color: var(--text-body);
  font-size: 0.94rem;
}
```

Good feedback copy:

```text
Moving patterns were harder than static patterns, which is normal during a format change.

Your attention control is stronger than your binding focus, so the next useful step is making colour–direction pairings more automatic.

Your transfer signal is still calibrating. More sessions are needed before this score is stable.

Today looked unusually variable. Treat this as a training signal, not a failure.
```

Avoid:

```text
You failed.
Your performance is weak.
Your attention is impaired.
Your brain score is poor.
```

---

# 22. Claims boundary component

Use this on:

```text
Profile dashboard
Transfer screen
Programme complete screen
Score-detail screens
```

```css
.claims-note {
  display: flex;
  gap: var(--space-3);
  align-items: flex-start;
  padding: var(--space-4);
  border: 1px solid var(--line-soft);
  border-radius: var(--radius-md);
  background: var(--surface-soft);
  color: var(--text-muted);
  font-size: 0.88rem;
  line-height: 1.45;
}

.claims-note__icon {
  color: var(--iq-blue-deep);
  flex: 0 0 auto;
}

.claims-note strong {
  color: var(--text-main);
}
```

Standard copy:

```text
These are training indicators. They are not a diagnosis, not an official IQ test and not proof of general intelligence change. More sessions make the profile more reliable.
```

Transfer-specific copy:

```text
Transfer Score is a training indicator. It shows whether skills practised in one display format appear to carry into changed formats. It is not a diagnosis or an official IQ score.
```

---

# 23. Forms and controls

```css
.iq-input,
.iq-select,
.iq-textarea {
  width: 100%;
  border: 1px solid var(--line-soft);
  border-radius: var(--radius-md);
  background: #FFFFFF;
  color: var(--text-main);
  padding: 12px 14px;
  font: inherit;
  box-shadow: inset 0 1px 0 rgba(24, 34, 48, 0.03);
}

.iq-input:focus,
.iq-select:focus,
.iq-textarea:focus {
  outline: none;
  border-color: var(--iq-blue);
  box-shadow: var(--shadow-active);
}

.iq-slider {
  accent-color: var(--iq-blue-deep);
}

.iq-toggle {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  color: var(--text-muted);
  font-size: 0.94rem;
}
```

Use forms only where they help:

```text
confidence judgement
readiness check
reflection prompt
practice mode selection
return-check scheduling
```

Avoid long setup forms before training.

---

# 24. Icons and diagrams

Icon style:

```text
thin line icons
cyan by default
lime only for success / validation
inside circles or rounded squares
no cartoon robots
no detailed brain illustrations
```

Useful icon categories:

```text
target
connected nodes
clock
shield / check
clipboard
warning triangle
path / branch
eye / signal
motion lines
return arrow
```

```css
.iq-icon {
  width: 40px;
  height: 40px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: var(--surface-tint-blue);
  color: var(--iq-blue-deep);
}

.iq-icon--success {
  background: var(--surface-tint-lime);
  color: #4E7A00;
}

.iq-icon--muted {
  background: var(--surface-soft);
  color: var(--text-muted);
}

.diagram-card {
  background: rgba(255, 255, 255, 0.86);
  border: 1px solid var(--line-soft);
  border-radius: var(--radius-xl);
  padding: var(--space-5);
  box-shadow: var(--shadow-soft);
}

.diagram-node {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 58px;
  padding: var(--space-3) var(--space-4);
  border: 2px solid var(--iq-blue);
  border-radius: var(--radius-md);
  background: #FFFFFF;
  color: var(--text-main);
  font-weight: 720;
}

.diagram-node--central {
  width: 128px;
  height: 128px;
  border-radius: 50%;
  border-color: var(--iq-blue-deep);
  text-align: center;
}

.diagram-node--validated {
  border-color: var(--iq-lime);
  background: var(--surface-tint-lime);
}

.diagram-line {
  stroke: var(--iq-blue);
  stroke-width: 2;
  fill: none;
}

.diagram-line--dashed {
  stroke-dasharray: 6 6;
}
```

Diagram labels for this app:

```text
Static pattern
Moving pattern
Simple direction
Relative direction
Recover
Mix
Return check
Transfer
```

---

# 25. Background textures

Use only subtle, non-distracting science texture. Never use background motifs on active task screens.

```css
.science-bg {
  background:
    radial-gradient(circle at 10% 15%, rgba(34, 170, 255, 0.07), transparent 22rem),
    radial-gradient(circle at 90% 10%, rgba(204, 255, 102, 0.08), transparent 18rem),
    linear-gradient(180deg, #FFFFFF 0%, #F5F7FA 100%);
}

.dot-matrix {
  background-image: radial-gradient(rgba(39, 100, 183, 0.16) 1px, transparent 1px);
  background-size: 12px 12px;
}

.corner-network {
  position: absolute;
  pointer-events: none;
  opacity: 0.12;
}
```

Use sparingly:

```text
dot matrix
faint node network
subtle orbit line
light grey diagonal panel
transparent relation graph
```

---

# 26. Motion and interaction

Use motion only to support comprehension. Avoid distracting animation during trials.

```css
@media (prefers-reduced-motion: no-preference) {
  .fade-up {
    animation: fade-up 220ms ease-out both;
  }

  .score-pop {
    animation: score-pop 260ms ease-out both;
  }

  @keyframes fade-up {
    from {
      opacity: 0;
      transform: translateY(8px);
    }

    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes score-pop {
    from {
      opacity: 0;
      transform: scale(0.96);
    }

    to {
      opacity: 1;
      transform: scale(1);
    }
  }
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.001ms !important;
    animation-iteration-count: 1 !important;
    scroll-behaviour: auto !important;
    transition-duration: 0.001ms !important;
  }
}
```

Use motion for:

```text
screen transition
score reveal
feedback note appearance
phase progress
transfer recovery animation
```

Avoid:

```text
confetti overload
bouncing icons
flashing score updates
animations during stimulus presentation
```

---

# 27. Responsive rules

```css
@media (max-width: 760px) {
  .iq-container {
    width: min(100% - 24px, var(--app-max-width));
    padding-top: var(--space-3);
  }

  .iq-brand-header {
    flex-direction: column;
    align-items: stretch;
  }

  .iq-title {
    font-size: clamp(2rem, 10vw, 3.2rem);
  }

  .iq-card {
    padding: var(--space-4);
    border-radius: var(--radius-md);
  }

  .score-card__value {
    font-size: 2.2rem;
  }

  .task-response-grid {
    width: min(100% - 24px, 680px);
  }

  .task-response-btn {
    min-height: 58px;
  }
}
```

---

# 28. Accessibility rules

Minimum requirements:

```text
All task buttons must have accessible labels.
Do not rely on colour alone.
Keep touch targets at least 44px high.
Respect reduced-motion preferences.
Maintain strong contrast for text.
Use aria-current for navigation.
Use aria-pressed for toggles.
Keep score explanations available in plain language.
```

Avoid placing crucial feedback only in:

```text
colour
animation
sound
tiny icons
hover states
```

---

# 29. Copy style

Tone:

```text
calm
precise
encouraging
practical
not hype-driven
not diagnostic
```

Prefer:

```text
Your attention control is improving.
This score is still calibrating.
A short dip is normal when the display format changes.
Your next useful step is motion recovery.
This is a training indicator, not an official IQ score.
```

Avoid:

```text
You failed.
Your attention is weak.
Your brain age is poor.
Your IQ has increased.
This proves general intelligence change.
```

Core consumer question:

```text
What improved?
Is it stable?
Does it carry over?
What should I do next?
```

---

# 30. Component names for design/dev

Use consistent component names:

```text
AppShell
BrandHeader
MainNav
TodayHero
SessionBriefing
TaskScreen
TaskStimulusPanel
TaskResponseGrid
SessionComplete
ScoreCard
TransferCard
TransferPanel
ConfidencePill
ProgressChart
JourneyScreen
PhaseCard
FormatMatrix
ClaimsNote
FeedbackNote
ProfileDashboard
ScoreDetailScreen
ProgrammeComplete
SelfGuidedPractice
```

Recommended CSS prefix:

```text
iq-
```

Examples:

```css
.iq-card
.iq-btn
.iq-nav
.iq-title
.iq-container
```

Product-specific classes:

```css
.task-screen
.score-card
.transfer-card
.phase-card
.claims-note
.confidence-pill
.format-matrix
```

---

# 31. Screen-by-screen visual summary

## Today

Visual priority:

```text
1. Start today’s session
2. Current phase
3. Mini profile
4. Transfer Score mini-card
```

## Train / Task

Visual priority:

```text
1. Stimulus
2. Response buttons
3. Thin progress
4. Pause / sound controls
```

Do not show scores during the task.

## Session complete

Visual priority:

```text
1. Completion message
2. Attention Control
3. Binding Focus
4. Today’s interpretation
5. View progress / Transfer link
```

## Progress

Visual priority:

```text
1. Capacity / Transfer toggle
2. Smoothed trend line
3. Raw session dots
4. Phase shading
```

## Transfer

Visual priority:

```text
1. Transfer Score
2. Availability state
3. Motion Recovery
4. Relation Recovery
5. Mixed Flexibility
6. Return Strength
7. Claims boundary
```

## Profile

Visual priority:

```text
1. Attention & Transfer Profile
2. Transfer Score
3. Attention Control
4. Binding Focus
5. 2 × 2 format matrix
6. Current training focus
7. Confidence note
```

---

# 32. Final implementation rule

Use this as the guiding implementation rule:

```text
Dashboard screens can explain.
Task screens must protect attention.
Transfer screens must stay visible from the start.
Research metrics stay in the background.
Consumer feedback should always answer:
what improved,
is it stable,
does it carry over,
and what should happen next.
```

Final brand line:

```text
Clean interface.
Clear cognitive route.
Evidence-aware feedback.
Transfer before claims.
```
