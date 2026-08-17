# Cognitive Control Coach — Real-Life Practice Layer v0.1

**Status:** Implementation-ready / feature branch  
**App:** Cognitive Control Coach  
**Purpose:** Connect abstract attention-control and relational-working-memory practice to one small, cue-linked action in the user's chosen work, study, AI-assisted or everyday workflow.

## Claims boundary

This is an interpretation and practice layer. It does **not** convert a Cognitive Control Coach score into a claim of real-world transfer. Real-life responses remain self-report application evidence and are excluded from cognitive scores, standardised scores, badges and programme progression.

## Interpretation framework

| Move | Question | Practical role |
| --- | --- | --- |
| **Find** | What matters now? | Identify the result, question or fact that should guide the next choice. |
| **Hold** | What must stay available? | Keep the goal and one important constraint visible rather than relying on unaided memory. |
| **Update** | What changed, and what stays stable? | Revise the task state while preserving the governing goal or rule. |
| **Act** | Is the next step supported enough? | Commit when the relevant information is clear enough for the stakes and reversibility of the choice. |

The user loop is:

```text
choose a real-life workflow
→ train
→ translate the trained operation into Find / Hold / Update / Act
→ form one cue–strategy plan
→ “I’ll try this once”
→ try it in the real task
→ report the outcome on a later visit
```

## Workflow contexts

The existing four workflow presets remain the only context collected:

- Focused work
- Demanding study
- AI-assisted work
- Everyday planning

No free-text task details are required.

## Prompt resolver

Prompt selection uses training information already available in the app.

1. Relational-working-memory block → **Hold** using `GOAL · CONSTRAINT · NEXT`.
2. Carrier/reference-frame/mixed transition → **Update**, separating surface change from the stable rule.
3. Delayed return / return-to-now → **Act**, reconstructing the last completed and next useful step.
4. Attention strategy indicates slow down → **Find**, checking one decision-relevant fact.
5. Attention strategy indicates speed up → **Act**, taking a reversible next step when evidence is clear enough.
6. Otherwise → the selected workflow's **workflow-specific baseline move**.

Workflow baselines are deliberately heterogeneous rather than forcing every default prompt into Find:

| Workflow | Baseline move | Example |
| --- | --- | --- |
| Focused work | Find | Return to the one result you are trying to complete. |
| Demanding study | Update | Ask what a new source or section changes about the main question. |
| AI-assisted work | Hold | Keep the main goal and one non-negotiable requirement visible. |
| Everyday planning | Act | Reconstruct the last completed and next useful step after interruption. |

## Block reconnect

After a relevant block, show one compact **Real-life practice lens** containing:

- active move and its question;
- a recognisable workflow cue;
- one action to try outside the app;
- the boundary: **Treat this as a strategy to test. Judge it by what happens in the real task.**

The lens replaces long explanatory copy rather than adding a new scrolling page.

## Session completion mission

At the existing completion reconnect screen, offer:

- **I’ll try this once** — creates one pending mission from the last **actually completed** scored training block;
- **Maybe later** — leaves no new mission.

A mission stores only versioned identifiers and enum/state fields required to reconstruct the prompt:

```text
mission id
preset id + preset version
source session id
workflow
operator
transition kind
phase
strategy direction
Find/Hold/Update/Act move
created time
status
outcome/barrier enums
review/defer timestamps and counts
```

Prompt title, cue and action strings are reconstructed from the versioned preset library and are not duplicated into saved user state.

## Next-visit check-in

Before normal home/resume content, a pending mission asks:

> Did you try the strategy from last time?

Responses:

- Yes—it helped
- I tried it, but it did not help
- The situation made it difficult
- Not yet

**Not yet** defers the check for the remainder of the current visit but keeps the mission pending for a later visit.

If the situation made it difficult, ask:

- I forgot at the relevant moment
- Too many interruptions
- Not enough time or authority
- The strategy did not fit

These responses localise a possible constraint in the cue, setting, resources or strategy. They are not trait or diagnostic labels.

## Measurement isolation

Real-life events use `scoreAffecting: false` and must not enter:

- `buildCccSessionMetrics`;
- personalised baseline-100 training scores;
- population standardisation;
- learning-curve gates;
- n-back progression;
- transfer-status gates;
- badges or programme-completion decisions.

The app may keep aggregate application counts such as attempted/reviewed/helped, but these remain a separate practice record.

## Persistence

Local mode:

- mission/check-in state is saved with programme/journey state.

Cloud modes:

- mission creation, deferral and review trigger an immediate `saveCccRemoteProgress` update when authenticated cloud sync is active;
- this allows the pending mission to follow the user to another device;
- failures fall back to local persistence and use the existing later-sync mechanism.

No new Supabase table, Stripe object, entitlement rule, checkout product, auth redirect or email-sign-in mechanism is introduced by this layer.

## Commerce and access isolation

The feature must not modify the existing sequence:

```text
Stripe checkout
→ checkout email
→ email link / six-digit sign-in code
→ authenticated account
→ active cognitive_control_coach entitlement
→ app access
```

Protected production paths remain governed by the existing `createIqCoachCheckoutSession`, `sendEmailSignInLink`, `verifyEmailSignInCode` and `resolveIqCoachAccess` flow. The real-life-practice module imports none of the commerce/auth client code.

## Responsive acceptance criteria

- No new `overflow: auto` or `overflow: scroll` container.
- New components use `min-width: 0`, wrapping copy and bounded grids.
- Outcome/barrier choices use two columns where space allows and one column on narrow phones.
- Tap targets remain at least 44 px high.
- Short-height breakpoints remove supporting copy before reducing tap targets.
- App-shell verification target: `scrollWidth <= clientWidth` and `scrollHeight <= clientHeight` on representative desktop, tablet and mobile viewports.

## Test requirements

1. Resolver coverage for every Find/Hold/Update/Act branch.
2. Mission records versioned identifiers without duplicated prompt strings.
3. Prompt reconstruction from a saved mission.
4. “Not yet” remains pending rather than becoming reviewed.
5. Mission generation uses the last completed scored block, not the last planned block.
6. Real-life events remain score-neutral.
7. Local/cloud persistence round-trip.
8. Responsive/overflow checks.
9. Existing commerce/access regression suite remains green.
10. Static isolation check confirms the real-life module does not import Stripe, entitlement or authentication code.

## Release sequence

```text
implement on isolated IQ-Coach feature branch
→ run TypeScript build + full Vitest suite
→ confirm commerce/access tests
→ verify desktop/tablet/mobile layout
→ review diff against production source
→ merge only after verification
→ build dist
→ copy dist to trident-g-platform published route
→ deploy through trident-g-platform/main
→ verify live purchase, sign-in, entitlement and returning-user paths
```
