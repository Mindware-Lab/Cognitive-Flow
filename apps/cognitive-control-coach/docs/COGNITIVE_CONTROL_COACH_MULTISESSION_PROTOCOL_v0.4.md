# Cognitive Control Coach Multi-Session Protocol v0.14

Status: implementation contract for the public early-access programme
Date: 16 August 2026
Protocol version: `ccc-multisession-transfer-v0.14`
Configuration version: `ccc-programme-p1-v0.14`
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
3. **Commit:** was the required choice made—or appropriately withheld—within the deadline under the current value environment?

The programme tests performance across its trained arrow and optic-flow formats. `full_transfer` means that the complete **trained-format** evidence contract below passed. It is not evidence of far transfer to work, study, general intelligence, clinical function or everyday behaviour.

## 2. Response contracts

### 2.1 MFT-M-derived Attention anchor

- Masked adaptive absolute-arrow majority task.
- Forced Left/Right response on every valid observation.
- No voluntary Withhold or Not sure response.
- Provisional in-app signal estimate only; not a validated MFT-M-R score.

### 2.2 Relative Attention policy task

- Relative arrows use one binary pair per display: In/Out or Clockwise/Anti-clockwise.
- Relative motion uses one binary pair per display: In/Out or Clockwise/Anti-clockwise. It is shown in five annular segments of translating flecks defined relative to the one central fixation point.
- Forced two-choice response after at least 350 ms and before 4,000 ms.
- Deadline omissions are retained as unresolved observations.

### 2.3 Relational WM task

- Four latent relations: In, Out, Clockwise and Anti-clockwise, matching the two Attention-task response pairs.
- Every five-item display uses only one coherent binary pair: In/Out or Clockwise/Anti-clockwise. Radial and rotational relations are never mixed within one display.
- Motion segments are clipping apertures only. Flecks translate along vectors defined relative to the single centre of the full stimulus field; individual segments do not expand, contract or rotate around their own centres.
- Dot speed follows a shallow full-field eccentricity gradient, so dots farther from the common centre move slightly faster in both radial and rotational displays.
- Five-item majority evidence at `5:0`, `4:1` or `3:2` clarity.
- Adaptive 1-back to 5-back level, preserved across sessions and devices when signed in.
- Match-only response rule: press **Match** when the current majority relation matches the relation `n` steps back; otherwise withhold the response.
- The first `n` items after each environment reset fill the memory buffer and are retained in telemetry but excluded from scores and gates.
- Each session has four blocks in A–B–A–B order. Each block contains 20 scored comparisons plus the first `n` buffer items.
- Before every block, the player chooses a fixed pattern-to-pattern pace from 350 to 3,500 ms. The n-back stream has no mask or blank interval: each pattern remains visible until the next pattern replaces it.
- For easy pattern environments, the 20 scored comparisons contain 12 `5:0`, six `4:1` and two `3:2` patterns. Hard environments reverse the clear and close counts: two, six and twelve.
- Ten scored comparisons are matches and ten are non-matches. A Match press on a non-match is a false alarm; withholding on a match is a miss; withholding on a non-match is a correct rejection. Above 1-back, 25% of feasible non-matches use a wrong-lag lure.
- Match-response latency is recorded within the continuous presentation cycle.

### 2.4 Shift the View transition pulse

- Fixed 30-second, score-neutral transition immediately after the source-wrapper feedback and before the first preview of a genuinely new target wrapper.
- Used only for protected first contact with a carrier swap. It is not used for practice, ordinary recovery, return blocks, mixed blocks, held-out checks or delayed re-checks.
- The display uses 120 dots, a 7.0-second full rotation, a 640 ms dot lifetime and the locked blue/green/lime palette on the pale app background.
- The user is told to actively group the dots into one coherent rotating sphere. Seeing two flat sheets or independent layers does not count as forming the target object.
- Once one sphere is seen, the user presses **Space** or the touch button for every reversal of the whole sphere as a single object. Independent changes in sheets, layers or dot groups are not counted.
- No reversal count, score or interpretation is shown. Formation time, whole-sphere reversal events, input mode, wrapper IDs and render settings remain in telemetry only.

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

### Performance used by the learning curves

Progression uses the **shape** of a performance learning curve, not an absolute performance score. Information throughput in bits per second is the vertical axis; the recent slope and range determine whether learning has locally flattened. Slope and range are divided by the recent mean so that the gate is scale-free and does not impose a hidden absolute bits-per-second requirement.

The protected masked Attention anchor follows the MFT-M measurement logic: each majority ratio has a published grouping-search information value, and the imposed information rate is that value divided by actual stimulus exposure time. The short in-app psychometric fit estimates the information rate associated with criterion performance. It is reported as a **provisional MFT-M-derived signal-capacity estimate**, because this abbreviated adaptive implementation is not a validated MFT-M or MFT-M-R administration.

For self-paced Attention transfer blocks, each balanced microcycle produces a separate training measure:

```text
ratio information: 5:0 = 1.58 bits; 4:1 = 2.91 bits; 3:2 = 4.91 bits
correct information = sum(correct response × ratio information)
Attention throughput = correct information / total effective processing time in seconds
```

Errors and omissions contribute processing time but zero correct information. Effective processing time is the recorded decision/value time, with the configured exposure or response window used only as a fallback. This measure therefore combines accuracy, evidence difficulty and speed in a common bits-per-second unit. It is explicitly labelled **MFT-M-derived correct information throughput** rather than MFT-M capacity: unlike the protected anchor, the self-paced task does not experimentally impose exposure duration and fit an accuracy-by-information-rate function. Decision value and error cost remain separate feedback dimensions rather than arbitrary weights inside the capacity ordinate.

For relational n-back, each completed A/B pair produces an app-derived information-throughput measure:

```text
relation information = log2(4 relation states) = 2 bits
presentation rate = 1000 / mean presentation time in milliseconds
WM throughput = 2 bits × n-back level × presentation rate
                × balanced accuracy
                × (1 − wrong-lag false-alarm rate)
```

When no wrong-lag observations are available, the overall false-alarm rate is used. Thus a person who sustains the same accuracy and interference control at a faster presentation rate has higher measured performance. This is a relational information-throughput training metric, not a published MFT-M capacity estimate. Wrapper progression still depends only on whether recent WM throughput has flattened at one n-back level. The 85%/70% pair thresholds described below adapt `n`; they do not pass a wrapper gate.

P1c normalises Attention and WM throughput to their configured task maxima before averaging them into each carrier-specific integration point. Separate arrow and optic-flow integration curves must flatten before the final delayed re-entry.

### P0 — Foundation

1. Four unscored absolute Left/Right practice observations.
2. Twenty-four-observation protected signal anchor.
3. Relative-arrow training until the person's learning curve reaches a local plateau.

The later carrier stages are not pre-scheduled inside P0. The arrow plateau, rather than a fixed score or exposure count, authorises the first optic-flow check in P1a.

### P1a — Repeated Attention portability and delayed confirmation

P1a follows one evidence-gated carrier sequence:

```text
relative-arrow plateau
→ protected first optic-flow contact
→ optic-flow recovery plateau
→ arrow-return plateau
→ alternating arrow/flow plateau
```

Only the current stage is scheduled. A stage continues across sessions until the recent performance curve is flat and locally stable. A ten-microcycle session cap ends practice for the day but never authorises the next wrapper by itself.

The first optic-flow block is diagnostic: it records the carrier-change dip and is never reused as recovery evidence. Optic-flow recovery is judged from its own subsequent learning curve; it is not required to equal the arrow score. During the mixed stage, complete balanced microcycles alternate between arrows and optic flow rather than mixing carriers within one display.

The delayed re-check is scheduled only after the alternating-format learning curve has flattened. The delayed mixed sequence:

- opens no earlier than 18 hours after the qualifying session;
- targets 24–72 hours;
- preserves the first post-delay microcycle as the fresh re-entry observation;
- alternates arrow and optic-flow microcycles;
- continues until the re-entry learning curve flattens or the session cap is reached.

Curve stabilisation sets `attention_portable`. Three unsuccessful valid delayed curve attempts after at least five Attention sessions may set `supported_unlock`. Supported unlock permits P1b training but never sets `attention_portable` or `full_transfer`.

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

After each A/B pair, the level increases when balanced accuracy is at least 85%, omissions are no more than 10%, and both miss and false-alarm rates are no more than 20%. It decreases when balanced accuracy is below 70%; otherwise it holds. The level is bounded to 1–5. These values adapt task difficulty; they do not authorise a wrapper transition.

The level reached at the end of the session is saved in programme state. The next session, including a later day or restored signed-in session, starts at that saved level.

The horizontal format sequence remains evidence-gated: arrow plateau → first motion contact → motion recovery plateau → arrow-return plateau → mixed-format plateau. A wrapper changes only when the recent pair-level accuracy-adjusted throughput curve has flattened at one n-back level. Balanced accuracy, omissions, misses and false alarms remain feedback and difficulty-adaptation variables, but none is an absolute wrapper-progression score. In the mixed stage, the four A–B–A–B blocks alternate arrow, flow, arrow and flow carriers; carriers never change within an n-back stream.

### P1c — Return to Now and bidirectional integration

Each session holds one carrier fixed across:

```text
Attention entry
→ relational WM
→ Attention re-entry
→ relational WM integration
```

Successive P1c sessions alternate arrow and flow carriers. Each session adds one combined Attention/WM integration-curve point. A final delayed re-entry is scheduled only after separate arrow and optic-flow integration curves have each supplied at least three points and flattened. The final session begins with a fresh Attention block before same-day memory practice.

`full_transfer` requires the final delayed re-entry curve to flatten, with all four decision environments represented and their cumulative exposures balanced to within one session. No fixed accuracy score is used. A delayed curve that remains unstable schedules another fresh check and does not award completion or transfer.

## 5. Minimum, typical and supported paths

The route contains these minimum fixed components plus the performance-dependent P1b stage:

| Stage | Minimum sessions |
| --- | ---: |
| P0 | 1 |
| P1a carrier curves + delayed confirmation | Performance-dependent |
| P1b adaptive n-back stability and WM format recovery | Performance-dependent |
| P1c bidirectional integration + final delayed re-entry | Performance-dependent |
| **Complete path** | **Performance-dependent** |

P1a, P1b and P1c duration is intentionally performance-dependent because every format change follows a personal learning-curve plateau rather than a fixed score or session count. Telemetry must estimate observed plateau, dip, recovery and re-entry distributions.

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

- the task-performance information-throughput metric used by the learning curve;
- accuracy by clarity;
- median viewing time by environment;
- points retained;
- omissions;
- provisional signal rate where the protected anchor exists;
- relational-memory balanced accuracy, misses, false alarms and wrong-lag errors;
- the current and next n-back level after each A/B pair;
- the current evidence gate and what remains missing.

The progress graph leads with the same Attention and relational-WM bits-per-second measures used by the learning curves. Accuracy, decision time, retained value and decision balance remain visible as component or diagnostic metrics; they are not substituted for the progression ordinate.

Workflow prompts are transfer intentions, not transfer outcomes. Users are told to judge real-world benefit in the real task.

## 8. Persistence and auditability

The programme state stores:

- programme run and session identifiers;
- the Attention format stage, attained n-back level, within-session pending level and WM format stage;
- the set of n-back levels whose onboarding practice has been completed;
- stage-specific Attention, pair-level WM and carrier-specific integration learning-curve histories;
- stage and session kind;
- environment exposure counts and pair history;
- protected delayed not-before and target-window timestamps;
- the protected first-contact dip and curve evidence for recovery, return, mixing, WM, re-entry and delayed checks;
- `attention_portable` versus `supported_unlock` explicitly;
- versioned gate decisions and reasons.

Interrupted or focus-invalidated observations are replaced deterministically. Deadline omissions are retained. Memory-buffer observations are not replaced merely because they are unscored.

## 9. Validation boundary

The implementation is suitable for early-access engineering and pilot evaluation. Before efficacy claims, it requires device-timing validation, test–retest work, calibration of the short signal anchor, empirical calibration of curve-window and stability parameters, held-out policy prediction and external transfer outcomes.

## 10. MFT-M measurement references

- Wu, Y.-H. et al. (2016), *Measuring human cognitive capacity using a visual-spatial task*. Scientific Reports 6, 34025. https://www.nature.com/articles/srep34025
- He, Y. et al. (2022), *A new adaptive procedure for measuring working memory capacity*. Quarterly Journal of Experimental Psychology. https://journals.sagepub.com/doi/10.1177/17470218211030838
