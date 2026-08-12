# Cognitive Control Coach Multi-Session Protocol v0.4

Status: implementation contract for the public early-access programme
Date: 12 August 2026
Protocol version: `ccc-multisession-transfer-v0.4`
Configuration version: `ccc-programme-p1-v0.4`
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
- Relative optic flow: Contract/Expand.
- Forced two-choice response after at least 350 ms and before 4,000 ms.
- Deadline omissions are retained as unresolved observations.

### 2.3 Relational WM task

- Four latent relations: In, Out, Clockwise and Anticlockwise.
- Five-item majority evidence at `5:0`, `4:1` or `3:2` clarity.
- 1-back followed by 2-back.
- Forced Match/Different response; no voluntary abstention button.
- The first `n` items after each environment reset fill the memory buffer and are retained in telemetry but excluded from scores and gates.
- Evidence onset follows a fixed 5,000-ms cadence. Faster responses do not bring the next memory item forward.
- At 2-back, 25% of feasible Different observations use a wrong-lag lure.

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

Each session uses:

```text
Attention in relative arrows
→ relational WM in the same arrow format
→ protected WM first contact in flow
→ flow WM recovery
→ return to arrow WM
→ mixed arrow/flow WM
```

The operator and carrier never change at the same boundary. The first passing arrow-WM session advances subsequent sessions from 1-back to 2-back. P1c opens only after:

- five passing arrow-WM stability blocks in total;
- at least four passing flow-recovery blocks;
- at least four passing return blocks;
- at least four passing mixed-format WM blocks.

Each criterion block requires at least 12 scored observations, at least 75% accuracy and no more than 10% omissions.

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

Under consistently passing performance, the earliest route is:

| Stage | Minimum sessions |
| --- | ---: |
| P0 | 1 |
| P1a consolidation + delayed confirmation | 4 additional |
| P1b 1-/2-back stability and WM format recovery | 5 |
| P1c bidirectional integration + final delayed re-entry | 5 |
| **Earliest complete path** | **15** |

The planning range remains 15–25 sessions. Twenty sessions is the central pre-pilot planning case. These are programme-design values, not empirical learning-time norms; telemetry must estimate observed session and gate distributions.

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
- median decision time by the two environments;
- points retained;
- omissions;
- provisional signal rate where the protected anchor exists;
- relational-memory accuracy for scored Match/Different observations;
- the current evidence gate and what remains missing.

Workflow prompts are transfer intentions, not transfer outcomes. Users are told to judge real-world benefit in the real task.

## 8. Persistence and auditability

The programme state stores:

- programme run and session identifiers;
- stage and session kind;
- environment exposure counts and pair history;
- protected delayed not-before and target-window timestamps;
- evidence counters for first contact, recovery, return, mixing, WM, re-entry and delayed checks;
- `attention_portable` versus `supported_unlock` explicitly;
- versioned gate decisions and reasons.

Interrupted or focus-invalidated observations are replaced deterministically. Deadline omissions are retained. Memory-buffer observations are not replaced merely because they are unscored.

## 9. Validation boundary

The implementation is suitable for early-access engineering and pilot evaluation. Before efficacy claims, it requires device-timing validation, test–retest work, calibration of the short signal anchor, empirical gate thresholds, held-out policy prediction and external transfer outcomes.
