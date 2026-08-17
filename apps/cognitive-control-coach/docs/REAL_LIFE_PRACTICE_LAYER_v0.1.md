# Cognitive Control Coach — Real-Life Practice Layer v0.1

**Status:** Implemented on `feature/ccc-real-life-practice-20260817`  
**App:** Cognitive Control Coach  
**Purpose:** Connect abstract attention-control and relational-working-memory practice to one coherent strategic theme per training session, then one small cue-linked action in the user's chosen work, study, AI-assisted or everyday workflow.

## Claims boundary

This is an interpretation and practice layer. It does **not** convert a Cognitive Control Coach score into a claim of real-world transfer. Real-life responses remain self-report application evidence and are excluded from cognitive scores, standardised scores, badges and programme progression.

## Interpretation framework

| Move | Question | Practical role |
| --- | --- | --- |
| **Find** | What matters now? | Identify the result, question or fact that should guide the next choice. |
| **Hold** | What must stay available? | Keep the goal and one important constraint visible rather than relying on unaided memory. |
| **Update** | What changed, and what stays stable? | Revise the task state while preserving the useful goal, boundary or relationship. |
| **Act** | Is the next step supported enough? | Commit when the relevant information is clear enough for the stakes and reversibility of the choice. |

Find / Hold / Update / Act is now a **secondary interpretation vocabulary**, not four competing behavioural prescriptions.

## Core session rule

```text
ONE SESSION
→ ONE STRATEGIC THEME
→ EACH COMPLETED BLOCK = A DIFFERENT ANGLE ON THAT THEME
→ SESSION END = ONE CUE–ACTION IMPLEMENTATION INTENTION
→ ONE ACTIVE MISSION AT A TIME
```

The user loop is:

```text
choose a real-life workflow
→ begin a training session
→ resolve one theme from the current programme progression point
→ rotate an equivalent theme variant by programme session number
→ after each block, explain one concrete angle on the same theme
→ at session end, form one cue–action plan
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

## Strategic-theme resolver

Theme selection uses training information already available in the app:

```text
programme session kind
+ current progression phase
+ programme session number
+ block index
+ selected workflow
```

The session number rotates equivalent variants inside the same theme family. A user who needs several sessions to stabilise at one level therefore receives fresh examples without being pushed prematurely into the next strategic lesson.

Examples of theme families include:

- foundation → **Stay with what matters**;
- stable reference → **Keep the goal steady while the surface changes**;
- first carrier perturbation → **Ask what really changed**;
- recovery → **Change the method, keep the result**;
- return → **Return without starting over**;
- mixed carriers → **Switch formats without switching goals**;
- delayed return → **Restart from the last useful point**;
- relational WM introduction → **Keep the task state visible**;
- WM carrier change → **Update the details without losing what belongs together**;
- WM return/mix → **Bring the useful structure back across contexts**;
- attention/WM integration → **Use the right thinking operation at the right time**;
- final delayed integration → **Keep what still works after a break**.

The full mapping and variant pool are documented in `REAL_LIFE_STRATEGIC_THEME_MAPPING_v0.1.md`.

## Concrete-copy rule

Public copy must lead with a recognisable situation, not unexplained technical language.

Avoid standalone copy such as:

> HOLD — What must stay available?

> Preserve the invariant.

> Maintain the active model.

Preferred pattern:

```text
TODAY'S THEME
Keep the task state visible

THIS BLOCK
Keep one important limit attached to the result.

EXAMPLE
Keep “finish the proposal” + “keep it under two pages” visible
while new information arrives.

small secondary tag: HOLD
```

The example carries the meaning; the framework tag is secondary.

## Block reconnect

The existing block reconnect screen is retained. It is now **interpretation only**.

After a completed block it shows:

- the session's current strategic theme;
- a different angle on that same theme, based on the block just completed;
- a concrete example in the selected workflow;
- an explicit reminder that there is **no new action to remember yet**.

Block reconnects no longer use a repeated `When → Try` structure and do not create or save implementation intentions.

## Session completion mission

The existing completion reconnect screen remains the only commitment point.

It renders one explicit cue–action plan:

```text
IF THIS HAPPENS
[one recognisable cue]

THEN I'LL
[one small action]
```

If there is no existing mission, the user may choose:

- **I’ll try this once** — creates one pending mission from the last **actually completed** scored training block;
- **Maybe later** — leaves no new mission.

If an earlier mission is still pending, the app does not overwrite it. The same screen offers:

- **Keep current mission**;
- **Replace with today's mission**;
- **Maybe later**.

Replacement therefore requires an explicit user action.

A mission stores versioned identifiers and enum/state fields rather than duplicated copy:

```text
mission id
preset id + preset version
theme family id + theme id
source session id
programme session kind + session number
source block index
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

User-facing theme, explanation, cue and action strings are reconstructed from the versioned theme library.

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

- mission creation, replacement, deferral and review trigger an immediate `saveCccRemoteProgress` update when authenticated cloud sync is active;
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
- Components use `min-width: 0`, wrapping copy and bounded grids.
- Block examples use compact labelled rows that shrink on narrow phones.
- Outcome/barrier choices use two columns where space allows and one column on narrow phones.
- Tap targets remain at least 44 px high.
- Short-height breakpoints remove supporting copy before reducing tap targets.
- App-shell verification target: `scrollWidth <= clientWidth` and `scrollHeight <= clientHeight` on representative desktop, tablet and mobile viewports.

## Test requirements

1. P0 blocks share one session theme but receive different angles.
2. Integrated P1c blocks share one theme while exposing distinct Find/Hold/Update/Act angles.
3. Repeated sessions at one progression point rotate equivalent theme variants.
4. Every resolver path supplies a concrete workflow example.
5. Mission records reconstruct user-facing copy from versioned identifiers.
6. A pending mission cannot be replaced without an explicit replacement action.
7. “Not yet” remains pending rather than becoming reviewed.
8. Mission generation uses the last completed scored block, not the last planned block.
9. Real-life events remain score-neutral.
10. Local/cloud persistence round-trip.
11. Responsive/overflow checks.
12. Existing commerce/access regression suite remains green.
13. Static isolation check confirms the real-life module does not import Stripe, entitlement or authentication code.

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
