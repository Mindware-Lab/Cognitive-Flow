# CCC Bridge Progression — Low-Risk Implementation Plan

**Date:** 23 August 2026  
**Branch:** `feature/ccc-bridge-progression-20260823`  
**Scope:** Cognitive Control Coach only  
**Status:** Implementation plan before code integration

## 1. Goal

Evolve the existing CCC real-life practice layer from a repeated guided cue/action prompt into an adaptive Bridge progression that progressively reduces app support while keeping real-life evidence separate from cognitive task scores and progression.

The stable user-facing control vocabulary is:

- **FIND — Identify what matters now.** Question: *What matters?*
- **HOLD — Keep what matters available.** Question: *What must stay available?*
- **UPDATE — Change what needs changing; keep what still fits.** Question: *What changed?*
- **ACT — When you have enough, take the next useful step.** Question: *Enough to move?*

These labels are consumer language. The app should not require users to understand terms such as “metacognitive governor”, “policy recovery”, or “niche coupling”.

## 2. Preserve the existing architecture

The update must not change:

1. Stripe purchase → email sign-in → access resolution.
2. Supabase authentication or entitlement handling.
3. Cognitive task scoring, bits/sec metrics, n-back advancement, learning-curve gates, wrapper progression, delayed cognitive re-checks, or programme-completion rules.
4. Existing local/cloud programme persistence semantics.
5. The rule that real-life self-report does not affect training scores or progression.

The existing workflow-specific prompt library remains valuable. It should be reorganised under four stable moves rather than replaced with many new strategies.

## 3. Two coupled controllers

CCC should maintain two logically separate progressions:

### Cognitive transfer controller

Existing controller. Determines game progression from stabilisation, first-contact change, recovery, return, mix, relational-WM evidence, operator integration and delay.

### Bridge controller

New controller. Determines how independently the user is expected to recover and use FIND/HOLD/UPDATE/ACT outside the app.

The cognitive controller sets a **maximum Bridge ceiling**; Bridge advances within that ceiling using its own evidence. Bridge may lag cognitive transfer. It should not get substantially ahead of it.

Suggested ceiling mapping:

| Cognitive evidence | Maximum Bridge level |
| --- | --- |
| Initial stabilisation / little transfer evidence | B1 Guided |
| First wrapper contact / early transfer exposure | B2 Retrieval |
| Recovery evidence | B3 Personalised |
| Return evidence | B4 Faded |
| Mixed-wrapper evidence | B5 Changed Context |
| Delayed cognitive recovery / final delayed integration | B6 Delayed |

Relational-WM and P1c evidence can also raise the ceiling where appropriate, but a single unusually good session should not jump several Bridge stages without the minimum Bridge experiences below.

## 4. Bridge progression

### B1 — Guided

App supplies cue + move + definition + action + workflow example.

User sees the current style of “try this once” mission.

Minimum experience: at least two committed/reviewed guided missions before B2.

### B2 — Retrieval

App supplies the cue. User selects which move fits: FIND / HOLD / UPDATE / ACT.

After selection, reveal the stable definition and the workflow-specific action. Record selection accuracy and response without affecting cognitive scores.

Minimum experience: at least two retrieval opportunities, with enough evidence that the four moves are becoming discriminable.

### B3 — Personalised

User identifies or selects a recurring real-world cue class and chooses the move that should be recovered there. The app turns this into a compact cue-policy mission.

Prefer bounded choices plus an optional short “other” path rather than a large free-text form.

Minimum experience: at least one personal cue-policy mission attempted and reviewed.

### B4 — Faded

No new mission is supplied. On a later visit ask a weakly cued question before naming the four moves:

“Since your last session, did one of the CCC methods come to mind while you were doing something else?”

Only after a positive response ask which move it was. Record spontaneous recall/use separately from prompted use.

Minimum experience: at least one genuine faded interval.

### B5 — Changed Context

Use the same policy in a different user-relevant activity/context. Keep the move invariant while the context changes.

Example: HOLD after interruption in focused work → HOLD after interruption in AI-assisted work or planning.

Minimum experience: at least one changed-context attempt/review.

### B6 — Delayed

After a genuine elapsed interval with no explicit policy reminder, ask whether anything from CCC was used without the app reminding the user first. Only then identify the move/cue and outcome.

B6 is evidence of delayed unsupported recovery, not a reward badge and not a cognitive score.

## 5. Bridge data model

Extend the current `realLifePractice` state additively. Existing saved states must remain valid.

Suggested new fields:

- `bridgeVersion`
- `level` (`b1_guided` … `b6_delayed`)
- `highestLevelReached`
- `guidedReviewedCount`
- `retrievalAttemptCount`
- `retrievalCorrectCount`
- `personalCueCreatedCount`
- `personalMissionReviewedCount`
- `fadedProbeCount`
- `spontaneousRecallCount`
- `spontaneousUseCount`
- `changedContextReviewedCount`
- `delayedProbeCount`
- `delayedUnsupportedUseCount`
- `lastExplicitPromptAt`
- `lastBridgeReviewAt`
- `personalCueClass` / `personalMove` where appropriate
- history records for Bridge observations

Mission records may add:

- `bridgeLevel`
- `promptStrength`
- `sourceContext`
- `targetContext`
- `retrievalSelectedMove`
- `retrievalCorrect`
- `userPersonalised`

All new fields must be optional or migrated with defaults to protect persisted v0.14 users.

## 6. Advancement rules

Do not use calendar day alone. Programme/session number is a pacing signal, not the gate.

Bridge advancement requires both:

1. **Bridge evidence** — the minimum experience for the current level; and
2. **Cognitive ceiling** — sufficient existing transfer evidence to permit the next level.

Do not regress Bridge because of one failed prompt or difficult real-world situation. A failure should route support, not punish the user.

Examples:

- Forgotten cue → retain/re-strengthen retrieval/cue mapping.
- Strategy mismatch → provide a different move/policy example.
- Interruptions → record contextual interference; do not lower task score.
- Time/authority → flag likely niche constraint; do not prescribe more cognitive training as the default response.

## 7. UX principles

1. Keep added interaction under roughly 30–90 seconds per relevant session.
2. Never introduce Bridge prompts during timed cognitive trials.
3. Keep one dominant call to action per screen and preserve mobile/desktop no-overflow constraints.
4. Explanations fade with Bridge progression:
   - early: move + definition + question + example;
   - middle: move + question;
   - later: move only;
   - faded/delayed: situation first, move only after retrieval.
5. Use the same four definitions everywhere.
6. Avoid presenting a single “Bridge score”. Show evidence states such as Guided use, Policy recovery, Personal cue, Independent use, Changed context and Delayed use.
7. Existing outcome/barrier choices remain and are extended only where needed.

## 8. Implementation sequence

### Step 1 — Pure controller and migration

Create a standalone `cccBridgeProgression.ts` module containing types, stable move definitions, cognitive-ceiling calculation, Bridge advancement rules, safe migration/defaults and helper functions. No UI change yet.

### Step 2 — Extend real-life state safely

Update `cccRealLifePractice.ts` additively so missions can carry Bridge metadata while old missions still render and review correctly.

### Step 3 — Add focused unit tests

Test migration of legacy state, cognitive ceilings, minimum-experience gates, no-regression behaviour, delayed timing, and the separation of Bridge state from cognitive programme evidence.

### Step 4 — Integrate UI one level at a time

Preserve B1 using the current UI first. Add B2 retrieval, B3 personalisation, B4 faded probe, B5 changed-context prompt and B6 delayed probe behind the Bridge controller. Do not alter task/scoring code.

### Step 5 — Regression testing

At minimum verify:

- existing CCC programme/gating tests;
- real-life-practice tests;
- commerce/access regression (`cccCommerce.test.ts`);
- TypeScript build;
- desktop and mobile viewport behaviour;
- existing saved-state migration.

### Step 6 — Review before production merge

Compare the feature branch with `coach-splash-trident-icon-20260715`. Confirm that auth/commerce/Supabase entitlement files are unchanged. Only after tests pass should the change be merged into the active CCC branch and then copied/deployed through the established production path.

## 9. Acceptance criteria

The implementation is acceptable when:

- current users can resume without reset caused by Bridge-state changes;
- B1 behaviour remains familiar;
- Bridge support can advance adaptively without changing game progression;
- game progression can cap, but not falsely prove, Bridge progression;
- FIND/HOLD/UPDATE/ACT definitions are consistent and progressively faded;
- B4/B6 probes ask about spontaneous/unsupported recovery before supplying the move name;
- real-life barriers remain separate from cognitive scores;
- no commerce/auth files or access flow are changed;
- tests cover migration, controller rules and existing purchase/access regressions.
