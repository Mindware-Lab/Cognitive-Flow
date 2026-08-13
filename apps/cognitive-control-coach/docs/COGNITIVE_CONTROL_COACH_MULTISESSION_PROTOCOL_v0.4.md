# Cognitive Control Coach Multi-Session Protocol v0.7

Status: implementation contract for the public early-access programme
Date: 13 August 2026
Protocol version: `ccc-multisession-transfer-v0.7`
Configuration version: `ccc-programme-p1-v0.7`
Canonical route: `/cognitive-control-coach/`

## 1. Purpose and claims boundary

The programme implements one vertical control sequence:

```text
Attention: resolve the relation present now
→ Relational WM: hold and compare that relation over time
→ Return to Now: release memory load and recover the current relation
```

At each layer the task separates three functional questions:

1. **Extract:** was the current majority relation resolved?
2. **Accumulate:** was the relevant relation maintained or compared with enough evidence?
3. **Commit:** was a forced choice made within the deadline under the current value environment?

The programme tests performance across its trained arrow and optic-flow formats. `full_transfer` means that the complete **trained-format** evidence contract below passed. It is not evidence of far transfer to work, study, general intelligence, clinical function or everyday behaviour.

## 2. Response contracts

### 2.1 MFT-M-derived Attention anchor

- Masked adaptive absolute-arrow majority task.
- Forced Left/Right response on every valid observation.
- No voluntary Withhold or Not sure response.
- Provisional in-app signal estimate only; not a validated MFT-M-R score.

### 2.2 Relative Attention policy task

- Relative arrows: In/Out.
- Relative motion: In/Out, shown as circular patches of translating flecks moving towards or away from the one central fixation point.
- Forced two-choice response after at least 350 ms and before 4,000 ms.
- Deadline omissions are retained as unresolved observations.

### 2.3 Relational WM task

- Two latent relations: In and Out, matching the Attention task.
- Motion patches are clipping apertures only. Flecks translate along vectors defined relative to the single centre of the full stimulus field; individual patches do not expand, contract or rotate around their own centres.
- Five-item majority evidence at `5:0`, `4:1` or `3:2` clarity.
- Adaptive 1-back to 5-back level, preserved across sessions and devices when signed in.
- Forced Match/Different response; no voluntary abstention button.
- The first `n` items after each environment reset fill the memory buffer and are retained in telemetry but excluded from scores and gates.
- Each session has four blocks in A–B–A–B order. Each block contains 20 scored comparisons plus the first `n` buffer items.
- Before every block, the player chooses a fixed presentation time from 350 to 3,500 ms. The pattern is then masked for 350 ms before the separate response period.
- For easy pattern environments, the 20 scored comparisons contain 12 `5:0`, six `4:1` and two `3:2` patterns. Hard environments reverse the clear and close counts: two, six and twelve.
- Ten scored comparisons are Match and ten are Different. Above 1-back, 25% of feasible Different observations use a wrong-lag lure.
- Points drain during the chosen presentation time. Response latency after the mask is recorded but does not reduce the reward.

## 3. Four decision environments

| Environment | Evidence distribution per six scored observations | Correct pot | Error loss | Drain |
| --- | --- | ---: | ---: | ---: |
| Clear Sprint | 3 clear, 2 mixed, 1 close | +50 | −10 | 15 points/s |
| Calculated Risk | 1 clear, 2 mixed, 3 close | +50 | −10 | 15 points/s |
| Clean Precision | 3 clear, 2 mixed, 1 close | +10 | −50 | 2.5 points/s |
| Deep Check | 1 clear, 2 mixed, 3 close | +10 | −50 | 1.5 points/s |

Every session uses two distinct environments. Selection is constrained rather than purely random:

1. consider all six possible two-environment pairings;
2. prefer pairings whose constituent environments have the least cumulative exposure;
3. avoid repeating the immediately preceding pair where possible;
4. select deterministically among tied pairs from the session seed;
5. counterbalance within-session order;
6. store the pair, order and allocation rule.

This keeps exposure to all four environments within one session of balance while preserving variation between sessions.

## 4. Multi-session stages

### P0 — Foundation

1. Four unscored absolute Left/Right practice observations.
2. Twenty-four-observation protected signal anchor.
3. Relative-arrow stabilisation.
4. Protected first contact with relative optic flow.
5. Flow recovery.
6. Return to relative arrows.
7. Mixed relative arrows and flow.

The first-contact block is diagnostic. A performance dip is not itself a failure and is not reused as recovery credit.

### P1a — Repeated Attention portability and delayed confirmation

Consolidation sessions repeat:

```text
relative-arrow stability
→ flow recovery
→ return to arrows
→ mixed arrows/flow
```

If no protected carrier-change observation exists, the first P1a consolidation adds one; it is not repeated after genuine first contact has been recorded.

The delayed re-check is scheduled only after four criterion sessions have supplied recovery, return, mixed-format and two-environment coverage. P0 may contribute the first criterion session. The fresh delayed mixed block:

- opens no earlier than 18 hours after the qualifying session;
- targets 24–72 hours;
- appears before same-session recovery practice;
- requires at least 12 fresh scored decisions;
- requires at least 75% accuracy and no more than 10% omissions.

Passing sets `attention_portable`. Three unsuccessful valid delayed checks after at least five Attention sessions may set `supported_unlock`. Supported unlock permits P1b training but never sets `attention_portable` or `full_transfer`.

### P1b — Relational WM and carrier recovery

Before the first scored use of each n-back level, a level-specific onboarding gate runs in familiar relative arrows:

1. a plain-language rule and worked example;
2. `n` unscored memory-loading patterns;
3. four easy 5:0 practice comparisons with Correct/Incorrect feedback only;
4. passage after at least three correct comparisons, otherwise another four-comparison attempt.

Practice carries no points, does not contribute to progression or transfer evidence and uses the default comfortable presentation time. Completion is stored separately for each level across sessions and devices when signed in. A voluntary **Practise again** action remains available from the block guide without removing an existing completion record.

Each session uses two contrasting decision environments selected from the four environments. It runs:

```text
environment A at the saved n-back level
→ environment B at the same level
→ adapt the level by at most one step
→ environment A at the adjusted level
→ environment B at the same adjusted level
```

After each A/B pair, the level increases when balanced accuracy is at least 85%, omissions are no more than 10%, and both miss and false-alarm rates are no more than 20%. It decreases when balanced accuracy is below 70%; otherwise it holds. The level is bounded to 1–5.

The level reached at the end of the session is saved in programme state. The next session, including a later day or restored signed-in session, starts at that saved level.

The horizontal format sequence remains evidence-gated: arrow stabilisation → first motion contact → motion recovery → arrow return → mixed formats. A format swap happens only after recent pair-level capacity has flattened at one n-back level with acceptable accuracy, misses, false alarms and omissions; it is not triggered by completing a fixed number of trials alone.

### P1c — Return to Now and bidirectional integration

Each session holds one carrier fixed across:

```text
Attention entry
→ relational WM
→ Attention re-entry
→ relational WM integration
```

Successive P1c sessions alternate arrow and flow carriers. A final delayed re-entry is scheduled after at least four passing Attention re-entry and integration sessions, with both carriers represented. The final session begins with a fresh Attention block before same-day memory practice.

`full_transfer` requires that final delayed block to pass at the same 12-observation, 75%-accuracy and 10%-omission criterion, with all four decision environments represented and their cumulative exposures balanced to within one session. A failed final delayed check schedules another fresh check and does not award completion or transfer.

## 5. Minimum, typical and supported paths

The route contains these minimum fixed components plus the performance-dependent P1b stage:

| Stage | Minimum sessions |
| --- | ---: |
| P0 | 1 |
| P1a consolidation + delayed confirmation | 4 additional |
| P1b adaptive n-back stability and WM format recovery | Performance-dependent |
| P1c bidirectional integration + final delayed re-entry | 5 |
| **Complete path** | **Performance-dependent** |

P1b duration is intentionally performance-dependent because the format changes follow a stable learning curve rather than a fixed session count. Telemetry must estimate observed session and gate distributions.

## 6. Status semantics

| Internal status | Meaning | Permitted consumer interpretation |
| --- | --- | --- |
| `building` | One or more protected gates are incomplete | Transfer evidence is still building |
| `attention_portable` | P1a immediate and delayed Attention gates passed | The relative Attention rule returned across trained formats after delay |
| `supported_unlock` | Repeated valid attempts did not pass P1a, but training support opened P1b | The next layer is available with support; transfer was not established |
| `full_transfer` | All P0–P1c trained-format gates, including both delayed checks, passed | Full trained-format transfer evidence in this programme |
| `supported_completion` | P1b/P1c completed following supported unlock | Programme completed; not full transfer |

Finishing a session or completing a fixed count never produces a transfer label by itself.

The congratulations achievement screen is permitted only when the stored programme status is `full_transfer`. It presents Full Transfer as a trained-programme game achievement and retains an explicit boundary that it is not evidence of general, workflow or clinical transfer. `supported_completion` uses the ordinary evidence screen.

## 7. Feedback

Every block reports plain-language, separable readings:

- accuracy by clarity;
- median viewing time by environment;
- points retained;
- omissions;
- provisional signal rate where the protected anchor exists;
- relational-memory balanced accuracy, misses, false alarms and wrong-lag errors;
- the current and next n-back level after each A/B pair;
- the current evidence gate and what remains missing.

Workflow prompts are transfer intentions, not transfer outcomes. Users are told to judge real-world benefit in the real task.

## 8. Persistence and auditability

The programme state stores:

- programme run and session identifiers;
- the attained n-back level, within-session pending level and WM format stage;
- the set of n-back levels whose onboarding practice has been completed;
- pair-level WM learning-curve history;
- stage and session kind;
- environment exposure counts and pair history;
- protected delayed not-before and target-window timestamps;
- evidence counters for first contact, recovery, return, mixing, WM, re-entry and delayed checks;
- `attention_portable` versus `supported_unlock` explicitly;
- versioned gate decisions and reasons.

Interrupted or focus-invalidated observations are replaced deterministically. Deadline omissions are retained. Memory-buffer observations are not replaced merely because they are unscored.

## 9. Validation boundary

The implementation is suitable for early-access engineering and pilot evaluation. Before efficacy claims, it requires device-timing validation, test–retest work, calibration of the short signal anchor, empirical gate thresholds, held-out policy prediction and external transfer outcomes.
