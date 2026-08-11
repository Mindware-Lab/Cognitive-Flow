# IQ Mindware App Design System

**Version:** 0.1.0
**Status:** working brand library; Cognitive Control Coach is the reference implementation
**Owner:** HRP Lab Ltd
**Applies to:** IQ Mindware cognitive-performance and human–AI workflow apps

## 1. Design proposition

IQ Mindware apps should feel like a calm, contemporary cognitive instrument:

> **Institutional precision with controlled vitality.**

They are neither arcade-style brain games nor clinical portals. The interface should help a person understand what to do now, complete a cognitively demanding exercise with minimal distraction, see what the result does and does not mean, and reconnect the exercise to a defined workflow.

The system combines:

- deep navy structure;
- predominantly white and pale-grey working surfaces;
- IQ Mindware cyan for active paths and primary actions;
- teal and amber only where they clarify the recurring cognitive-control loop;
- lime reserved for meaningful completion, accepted evidence or a passed check;
- Manrope typography;
- thin geometric icons and restrained signal motifs;
- explicit separation of exercise performance, transfer evidence and workflow change.

## 2. Brand hierarchy

```text
HRP Lab
research, theory, protocol engineering and governance

IQ Mindware
cognitive-performance products and workflow tools

Cognitive Control Coach
the first reference app using this design system
```

The IQ Mindware eye is the parent mark. Each app adds its product name as a secondary label rather than inventing an unrelated identity.

## 3. Colour system

### 3.1 Foundation palette

| Role | Token | Value | Use |
|---|---|---:|---|
| Deep structure | `--iqm-navy-1000` | `#04111D` | Focus frames and dark emphasis |
| Institutional navy | `--iqm-navy-950` | `#071827` | Header and primary dark surface |
| Primary ink | `--iqm-ink` | `#13253A` | Text on light surfaces |
| Supporting ink | `--iqm-ink-soft` | `#53677B` | Secondary text |
| Canvas | `--iqm-canvas` | `#F7F9FB` | Main app background |
| Alternate canvas | `--iqm-canvas-alt` | `#EEF3F7` | Focus and section contrast |
| Surface | `--iqm-surface` | `#FFFFFF` | Cards and task stages |
| Hairline | `--iqm-line` | `#D8E1EA` | Dividers and quiet boundaries |
| Primary cyan | `--iqm-cyan` | `#22AAFF` | Primary action, active path, selection |
| Accessible cyan text | `--iqm-cyan-700` | `#0874BA` | Links and cyan text on white |

Aim for roughly:

```text
75% white / pale neutral
20% navy / ink / cyan
under 5% evidence and supporting colours
```

### 3.2 Cognitive-control semantics

The Cognitive Stack for Interventions establishes three recurring control problems. The app system translates these into a stable semantic triad:

| Control problem | Consumer language | Colour | Token |
|---|---|---:|---|
| Extract | Find what matters | Blue | `--iqm-extract` |
| Accumulate | Take in enough | Teal | `--iqm-accumulate`; `--iqm-accumulate-text` for small text |
| Commit | Make the call | Amber | `--iqm-commit`; `--iqm-commit-text` for small text |

Use the triad to explain a control sequence, not to colour every surface. The dominant interaction colour remains cyan.
The darker `-text` variants preserve the hue while meeting contrast requirements on pale surfaces.

### 3.3 Evidence and outcome colours

| Meaning | Colour | Rule |
|---|---:|---|
| Completed / checked / accepted evidence | Lime `#CCFF66` | Sparse; use navy text on lime |
| Error needing correction | Coral `#C94C55` | Pair with an icon and words |
| Accumulation / careful withhold | Teal `#087F86` | Pair with explicit copy |
| Overloaded profile or reasoning layer | Violet `#6D55BD` | Diagrams and labelled profiles only |
| Regulated profile | Green `#2F8B4B` | Labelled state/profile communication only |

Colour must never be the sole carrier of meaning. Every status needs readable text and, where helpful, a shape or icon.

## 4. Typography

Use **Manrope Variable** for the app shell, headings, body copy, controls and metrics.

```css
font-family: "Manrope Variable", Manrope, Inter, system-ui, sans-serif;
```

Rules:

- use sentence case;
- use strong weight and spacing rather than all caps for ordinary headings;
- reserve compact uppercase labels for eyebrows and state labels;
- use negative letter spacing only on large headings and metrics;
- keep body copy at 16 px or above with generous line height;
- keep lines of explanatory copy below about 70 characters where practical;
- do not use a technical monospace face in the consumer journey.

## 5. Spatial and surface language

- Use an 8 px base rhythm, with 12 px and 24 px as common component intervals.
- Default radii: 12 px controls, 16 px cards, 24 px major containers.
- Use hairline borders to define most surfaces; reserve shadows for major cards and focus surfaces.
- Prefer asymmetrical two-zone compositions: proposition or instruction on the left, system state or visual model on the right.
- Use empty space to separate decisions. Do not fill every area with metrics or decoration.
- A task screen may use a stronger focus frame, but the stimulus and response area should remain visually quiet.

## 6. Core component contracts

### App header

- dark navy;
- IQ Mindware eye and master-brand name first;
- app name as a secondary line;
- one progress/save area on the right;
- 44 px minimum controls;
- no full website navigation during training.

### Primary action

- one dominant action per screen;
- cyan background with dark navy text for reliable contrast;
- direct verb-led copy: **Begin practice**, **Continue**, **See your review**;
- secondary and leave actions remain quieter.

### Selection card

- thin neutral border at rest;
- cyan border and a visible check when selected;
- icon, title and one short explanatory sentence;
- use `aria-pressed` or the appropriate native selection semantics.

### Journey rail

- five or fewer labelled steps;
- numbered pending step, cyan current step, lime completed step with a tick;
- the current step also uses `aria-current="step"`;
- continuity is the reward; do not turn the rail into competitive pressure.

### Task surface

- stable response positions;
- stimulus remains the visual centre;
- condition cue sits above the stimulus;
- time/value information is visible but subordinate;
- active controls meet a 44 × 44 px minimum target;
- pause is always available;
- the task must survive 320 px width and 200% zoom.

### Feedback state

- show a symbol, plain-language message and value consequence;
- distinguish correct, careful withhold, incorrect and interrupted states;
- preserve the answered stimulus for the feedback moment;
- do not use celebratory animation on every trial;
- delay detailed interpretation until the stage review.

### Evidence boundary

Every review layer should distinguish:

```text
Practise
what changed inside the trained exercise

Transfer
what survives a changed or separate task

Apply
what changes in the defined workflow
```

An exercise score must not be presented as evidence of workplace, study or everyday improvement.

## 7. Engagement without manipulation

Long-term engagement should come from clarity, competence, continuity and perceived relevance.

Use:

- a guided next step;
- brief practice before scoring;
- meaningful stage completion;
- saved progress and interruption recovery;
- a workflow context chosen by the user;
- short explanations of what metrics mean;
- a concrete reconnect action after the exercise;
- delayed or separate checks where the protocol defines them.

Avoid:

- leaderboards;
- punitive streaks;
- confetti as the primary reward;
- invented precision or a single “brain score”;
- excessive notifications;
- technical labels in the main journey;
- forced disclosure of confidential work, study or health details;
- engagement metrics treated as proof of benefit.

## 8. Motion

Motion must communicate a state transition or be intrinsic to the task.

Allowed:

- short progress transitions;
- a selected card changing state;
- a route node completing;
- the task’s own moving stimulus;
- the separately governed Shift the View exercise.

Avoid:

- decorative particle storms;
- continuous background motion;
- parallax;
- autoplay carousels;
- rapid glow effects;
- animations that compete with the cognitive task.

Respect `prefers-reduced-motion`. A reduced-motion alternative must preserve timing and meaning where the protocol requires a matched interval.

## 9. Accessibility baseline

Target WCAG 2.2 AA and test at 320, 375, 768, 1024, 1280 and 1440 px.

Required:

- semantic heading order;
- visible focus styles;
- keyboard operation;
- no focus hidden behind fixed interface elements;
- at least 44 × 44 px targets for the app even though WCAG’s minimum is smaller;
- sufficient contrast;
- status not conveyed by colour alone;
- labelled progress controls;
- interruption-safe saving;
- reduced motion;
- controls that remain in stable positions;
- no timed reading requirement outside the task mechanism;
- concise instructions available immediately before each new mechanic.

## 10. Consumer copy

The tone is calm, direct, adult and evidence-bounded.

Use:

```text
Find what matters.
Take in enough.
Make the call.
Train through change.
Reconnect to the task that matters.
```

Avoid exposing terms such as:

```text
carrier transfer
reference-frame extension
entropy pulse
operator integration
valid observation
diagnostic trial
```

Internal labels remain in versioned telemetry and research documentation.

## 11. Product variation

All IQ Mindware apps share the shell, typography, action hierarchy, progress language, accessibility baseline and evidence boundary. Each app may vary:

- its task geometry;
- one supporting semantic colour;
- its journey labels;
- its representational motif;
- its workflow examples;
- its outcome and transfer displays.

The family should be recognisable without making every app visually identical.

## 12. Reference implementation

The first implementation is:

```text
apps/cognitive-control-coach/
```

Shared tokens are in:

```text
UX/iqmindware-app-design-system/tokens.css
```

The Cognitive Control Coach stylesheet aliases shared tokens locally so its product-specific styles remain isolated.

## 13. Evidence and standards basis

The system draws on:

- the IQ Mindware workflow website design system and August 2026 workflow pivot;
- the Cognitive Stack for Interventions and its Extract → Accumulate → Commit semantics;
- [WCAG 2.2](https://www.w3.org/TR/WCAG22/);
- the [NHS digital service manual](https://service-manual.nhs.uk/), including its WCAG 2.2 implementation guidance;
- user-centred digital-health engagement literature, in which engagement is treated as goal-directed and multidimensional rather than time-on-app alone;
- IQ Mindware’s claims boundary: practice, transfer and workflow outcomes remain distinct.

## 14. Release checklist

- [ ] The screen has one obvious next action.
- [ ] The user can state where they are and what happens next.
- [ ] The task surface is quieter than the surrounding explanation screens.
- [ ] Cyan marks action; lime marks genuine completion or evidence.
- [ ] Every colour state also has words or an icon.
- [ ] Metrics explain their scope.
- [ ] Workflow copy does not imply measured real-life improvement.
- [ ] Keyboard, 200% zoom, reduced motion and mobile layouts have been checked.
- [ ] Task mechanics and telemetry are unchanged by decorative styling.
- [ ] The product does not resemble an arcade, crypto dashboard or clinical portal.
