# Attention Coach Training Protocol Specs - Game Logic and Measurements

## v3.2 — fixed 20-session carrier-swap transfer programme with timing, staircase and bits/sec scoring

**Status:** revised measurement specification with fixed commercial 20-session programme, explicit stimulus timing, adaptive staircase sampling and canonical bits/sec scoring  
**Supersedes:** v3.1, v3.0 and v2.0 “Wrapper-Swap Progression & Metric Calculation Specification”  
**Scope:** CCC / Attention Control and BSE / Binding-style masked majority tasks using arrows and optic-flow carriers  
**Core change:** cross-modal transfer is computed only at **carrier-swap boundaries**, not at absolute→relative frame ramps.

---

## 0. Executive summary

The prior specification treated several improvements as “transfer”, including absolute→relative changes. This v3.0 specification separates three different phenomena:

```text
1. Carrier / wrapper swap
   arrow ↔ optic flow
   = cross-modal transfer candidate

2. Frame complexity ramp
   absolute → relational
   = within-modality relational abstraction

3. Mixed-carrier stability
   arrow + optic flow + absolute + relational mixed
   = flexible maintenance after transfer
```

The central rule is:

> **Do not compute cross-modal transfer efficiency from absolute→relative swaps.**

Absolute→relative transitions are **within-carrier complexity increases**. They estimate whether the learner can move from simple screen-centred direction to centre-relative relation inside the same carrier. They are diagnostically important, but they are not the main evidence for cross-modal invariance.

Cross-modal transfer efficiency is computed at these boundaries:

```text
Absolute arrows  → Absolute optic flow
Relative arrows  → Relative optic flow
```

The absolute→relative phases are used as **validation controls**:

```text
Absolute arrows → Relative arrows
= baseline relational-abstraction signature in the original carrier

Absolute optic flow → Relative optic flow
= validation that the carrier-swapped invariant supports relational abstraction in the new carrier
```

If the first carrier swap has worked, the later absolute→relative transition in optic flow should show a similar or compressed learning signature compared with the absolute→relative transition in arrows.

---

## 1. Core constructs and cells

### 1.1 Construct levels

This specification applies to both early masked-majority construct levels.

| Construct | Internal label | Public label | Core operation |
|---|---|---|---|
| CCC / ACC | `ACC` | Attention Control | Extract the target majority relation from brief noisy evidence. |
| BSE | `BSE` | Binding / Binding Focus | Extract or maintain a relation × feature conjunction under time pressure. |

The same transfer logic applies separately to each construct.

```text
ACC transfer
= does the base evidence-extraction invariant transfer across carrier?

BSE transfer
= does the bound feature/relation operation transfer across carrier?
```

Do not pool ACC and BSE transfer by default. Report them separately, then optionally combine them in a later composite.

---

### 1.2 Carrier × frame lattice

Each construct is measured in a 2 × 2 lattice.

| Cell | Carrier | Frame | Example response relation | Internal cell key |
|---|---|---|---|---|
| A | arrows | absolute | LEFT vs RIGHT / UP vs DOWN | `arrow_abs` |
| B | optic flow | absolute | LEFT vs RIGHT / UP vs DOWN motion | `flow_abs` |
| C | arrows | relational | OUT vs IN / CW vs CCW | `arrow_rel` |
| D | optic flow | relational | EXPAND vs CONTRACT / CW vs CCW flow | `flow_rel` |

The target invariant is not the display surface. It is the operation:

```text
brief evidence → extract target relation → respond / bind / compare
```

The carrier changes the surface. The frame changes the relation complexity.

---

## 2. Revised phase ordering

### 2.1 Arrows-first order

For the default commercial and primary validation route:

| Phase | Cell | Phase name | What is trained | What is measured |
|---|---|---|---|---|
| **P1** | `arrow_abs` | Absolute arrows | Base attention-control invariant in clean static carrier | local learning curve, asymptote, update geometry |
| **P2** | `flow_abs` | Absolute optic flow | Same absolute relation in new carrier | **cross-modal base transfer** |
| **P3** | `arrow_rel` | Relative arrows | Within-carrier relational abstraction baseline | frame-abstraction trajectory |
| **P4** | `flow_rel` | Relative optic flow | Relational abstraction in carrier-swapped surface | validation + **cross-modal relational transfer** |
| **P5** | all four cells | Mixed carrier × frame | Flexible switching across all cells | mixed stability and delayed recovery |
| **P6** | all four cells | Delayed re-check | Return after spacing / later sessions | consolidation and retained transfer |

Compact form:

```text
P1: Absolute arrows
→ P2: Absolute optic flow        [cross-modal base transfer]
→ P3: Relative arrows            [within-carrier frame baseline]
→ P4: Relative optic flow        [validation + relational carrier transfer]
→ P5: Mixed all four
→ P6: Delayed re-check
```

This replaces the older “absolute arrows → relative arrows → absolute flow → relative flow” interpretation.

---

### 2.2 Flow-first validation order

For counterbalanced validation cohorts:

| Phase | Cell | Phase name | What is measured |
|---|---|---|---|
| **P1** | `flow_abs` | Absolute optic flow | first-carrier baseline |
| **P2** | `arrow_abs` | Absolute arrows | cross-modal base transfer, flow→arrow |
| **P3** | `flow_rel` | Relative optic flow | within-carrier frame baseline |
| **P4** | `arrow_rel` | Relative arrows | validation + relational carrier transfer |
| **P5** | all four cells | Mixed | mixed stability |
| **P6** | all four cells | Delayed | consolidation |

For the commercial app, arrows-first remains the preferred user route. Flow-first is for screened validation participants only.

---

## 3. Transition taxonomy

Every phase boundary must be tagged by transition type.

| Transition | Boundary key | What it tests | Primary interpretation |
|---|---|---|---|
| `arrow_abs → flow_abs` | `T_CM_BASE` | Same absolute relation across carrier | **cross-modal transfer of base attention-control invariant** |
| `arrow_abs → arrow_rel` | `T_FRAME_ARROW` | Absolute→relative within arrows | **within-carrier relational abstraction baseline** |
| `flow_abs → flow_rel` | `T_FRAME_FLOW` | Absolute→relative within optic flow | **validation of transferred invariant in new carrier** |
| `arrow_rel → flow_rel` | `T_CM_REL` | Same relational frame across carrier | **cross-modal transfer of relational-frame invariant** |
| mixed all cells | `T_MIXED` | unpredictable carrier and frame switching | mixed-wrapper stability |
| delayed all cells | `T_DELAYED` | re-entry after time | retained transfer / consolidation |

### 3.1 What no longer counts as cross-modal transfer

The following are **not** cross-modal transfer metrics:

```text
arrow_abs → arrow_rel
flow_abs → flow_rel
Frame Cost
Frame Efficiency
absolute-vs-relative capacity gap
```

They remain important diagnostics, but they do not answer whether the invariant crossed the carrier boundary.

---

## 4. Trial and session progression

### 4.1 General training rule

Each cell is trained to a local near-asymptote before the next cell is introduced.

```text
train current cell
→ detect local flattening
→ switch to next ordered cell
→ expect dip if boundary is disruptive
→ measure recovery
→ train to new asymptote
→ later mix cells
```

There are no sparse “probe-only” phases in the main commercial pathway. Each stimulus type is trained sufficiently to estimate a learning trajectory. The final phase mixes all four cells.

---

### 4.2 Fixed 20-session commercial programme

The commercial programme is **20 sessions total**. Gates adapt difficulty, trial allocation and confidence labels, but they do **not** extend the public programme beyond 20 sessions. Research mode may optionally extend phases when higher-confidence trajectory estimates are required.

| Sessions | Count | Phase | Primary cell(s) | Purpose | Main metric event |
|---:|---:|---|---|---|---|
| 1–5 | 5 | P1 | `arrow_abs` | establish a stable first-carrier absolute baseline and old-carrier update geometry | local asymptote / pre-swap baseline |
| 6–8 | 3 | P2 | `flow_abs` | measure recovery when the same absolute relation appears in optic flow | `T_CM_BASE` / base carrier-swap transfer |
| 9–12 | 4 | P3 | `arrow_rel` | establish the within-arrow absolute→relative learning signature | `T_FRAME_ARROW` / `FAB_arrow` |
| 13–15 | 3 | P4 | `flow_rel` | validate relational abstraction in flow and test relational carrier transfer | `T_FRAME_FLOW`, `FAV_flow`, `T_CM_REL` |
| 16–18 | 3 | P5 | all four | test flexible switching across carrier × frame cells | `T_MIXED` / mixed stability |
| 19–20 | 2 | P6 | all four | delayed mixed re-check after spacing | `T_DELAYED` / retained recovery |

Compact schedule:

```text
5 + 3 + 4 + 3 + 3 + 2 = 20 sessions
```

This allocation deliberately gives extra sessions to the first stable baseline (`arrow_abs`) and the within-arrow relational baseline (`arrow_rel`), because both are reference signatures for later transfer interpretation. The two carrier-swap target phases (`flow_abs`, `flow_rel`) still receive 3 sessions each, giving approximately 240 scored trials per target cell at 80 trials/session before mixed and delayed phases add further evidence.

#### Commercial gate rule

For the public 20-session programme:

```text
flattening / recovery gates adjust within-phase difficulty and confidence labels,
but the user still progresses through the 20-session arc.
```

If a phase has not reached a strong flattening or recovery signature by its scheduled end, the app should mark the relevant metric as:

```text
calibrating
surface-bound
needs more evidence
```

rather than extending the visible programme.

#### Research-mode extension rule

For validation cohorts only, phases may extend when:

```text
minimum trajectory windows are not met
OR matched scratch comparison is unavailable
OR timing quality is too poor for transfer-efficiency estimation
```

Any extension must be recorded as `research_mode_extension = true` and excluded from the standard commercial completion-rate analysis.

---

### 4.3 Within-session allocation

For 80 scored trials per session:

| Phase | Main cell | Old-cell rechecks | Recommended allocation |
|---|---|---|---|
| P1 | `arrow_abs` | none | 80 trials current cell |
| P2 | `flow_abs` | optional `arrow_abs` 10–20% | 64–72 current, 8–16 recheck |
| P3 | `arrow_rel` | optional `arrow_abs` 10–20% | 64–72 current, 8–16 recheck |
| P4 | `flow_rel` | optional `flow_abs` and `arrow_rel` | 56–64 current, 8–12 each reference cell |
| P5 | all four | all active | 20 trials per cell |
| P6 | all four | all active | 20 trials per cell or adaptive by uncertainty |

Recheck trials are not “transfer probes”; they are reference anchors for estimating trajectory shape, retention and mixed stability.


### 4.4 Construct scheduling inside the 20-session programme

The 20-session schedule defines the **carrier × frame progression**. It can be applied to `ACC` alone or to both `ACC` and `BSE`, but the trial budget must be explicit.

Recommended v1 implementation:

```text
ACC = primary 20-session measurement track
BSE = optional parallel track using the same phase labels and schema,
      reported with lower confidence unless enough trials are collected.
```

If both `ACC` and `BSE` are scored in the same 20-session programme, use one of these trial-budget policies:

| Policy | Trials/session | Consequence |
|---|---:|---|
| ACC-only v1 | 80 | Cleanest route for Attention Control transfer metrics. |
| ACC + light BSE | 80 total, e.g. 56 ACC / 24 BSE | BSE is exploratory / calibrating, not high-confidence. |
| ACC + full BSE | 120–160 total, split across constructs | Supports construct parity but increases session duration. |
| Sequential programmes | 20 sessions ACC, then 20 sessions BSE | Cleanest research route for BSE transfer, but not the same commercial arc. |

Do not imply that 80 trials/session can produce high-confidence Zhang–Tang-style trajectory metrics for both `ACC` and `BSE` unless the number of valid windows per construct is sufficient.

---

### 4.5 Stimulus presentation timing, adaptive staircase and bits/sec calculation

This section defines the implementation backbone for masked-majority `ACC` and `BSE` trials. It prevents engineering ambiguity about three separate operations:

```text
1. stimulus presentation timing
2. adaptive staircase sampling
3. canonical bits/sec scoring
```

The staircase is **not** the bits/sec formula. The staircase controls the exposure durations shown during gameplay so trials concentrate near the user’s current threshold. The canonical score is computed after the block from a fitted exposure-time threshold.

```text
adaptive staircase
→ collect near-threshold trials
→ fit P(correct) across exposure durations
→ extract ET_75
→ compute bits/sec = H / ET_75
```

---

#### 4.5.1 Trial presentation sequence

All `ACC` and `BSE` masked-majority trials should use the same basic trial sequence:

```text
fixation
→ stimulus display
→ backward mask
→ response window
→ feedback
→ inter-trial interval
```

Recommended initial timing values:

| Element | Recommended value | Notes |
|---|---:|---|
| Fixation | 300–600 ms jittered | Keeps gaze centred and reduces anticipatory rhythm. |
| Stimulus exposure | adaptive | Main timing variable for capacity estimation; must be frame-counted. |
| Mask | 300–500 ms | Appears immediately after stimulus offset at the same item locations. |
| Response window | 2000–2500 ms | User may respond after the mask. |
| Feedback | 150–300 ms | Brief non-punitive pulse or sound. |
| ITI | 250–500 ms | Short reset before the next trial. |

Stimulus exposure is the primary timing variable for capacity estimation. Mask duration and response window may be adapted later, but v1 should primarily vary:

```text
carrier
frame
majority ratio
stimulus exposure
```

Do not show live score, entropy, ET threshold or model parameters during the task.

---

#### 4.5.2 Frame-counted exposure time

All speed-sensitive trials must store both requested and actual exposure timing.

Required fields:

```text
exposure_ms_requested
exposure_ms_actual
actual_stimulus_frames
device_refresh_rate_estimate
dropped_frame_count
timing_quality
```

The adjusted exposure time is:

```text
ET_adjusted_seconds = actual_stimulus_frames / refresh_rate_estimate
```

or, in milliseconds:

```text
ET_adjusted_ms = 1000 × actual_stimulus_frames / refresh_rate_estimate
```

Trials with poor timing quality should remain in the raw data but should be excluded from high-confidence capacity estimates.

Recommended timing-quality rule:

| Timing quality | Criterion | Scoring treatment |
|---|---|---|
| `good` | requested and actual exposure differ by ≤ 1 frame; no dropped frames | include in canonical estimate |
| `acceptable` | requested and actual exposure differ by ≤ 2 frames; ≤ 1 dropped frame | include with timing penalty / lower confidence |
| `poor` | > 2-frame error, > 1 dropped frame, tab hidden, or unstable refresh estimate | keep raw trial; exclude from high-confidence estimate |

---

#### 4.5.3 Majority-ratio information values

For five-item masked-majority trials, store condition entropy values in a versioned calibration table.

Initial values:

| Majority ratio | Initial information value |
|---|---:|
| 5:0 | 1.58 bits |
| 4:1 | 2.91 bits |
| 3:2 | 4.91 bits |

These values must be treated as calibration-table values, not permanently hard-coded constants.

Minimum calibration-table fields:

```text
calibration_table_id
model_version
construct
set_size
majority_ratio
H_condition_bits
source_note
created_at
retired_at
```

---

#### 4.5.4 Adaptive staircase sampling rule

Use a simple adaptive staircase or adaptive threshold tracker during gameplay.

Gameplay rule:

```text
correct at current demand
→ make the next comparable trial harder
→ usually shorter exposure or harder ratio

incorrect at current demand
→ make the next comparable trial easier
→ usually longer exposure or easier ratio
```

The v1 implementation should keep the staircase simple and robust:

```text
1. Use staircase logic to keep trials near threshold.
2. Do not rely on the final staircase step as the final score.
3. Fit the psychometric function post-block from all valid trials.
4. Extract ET_75 from the fitted function.
5. Compute bits/sec from ET_75.
```

A standard 2-down / 1-up staircase converges at approximately 70.7% correct, not exactly 75%. Therefore, for canonical scoring, prefer:

```text
simple staircase for sampling
+ post-hoc psychometric fit at 75% correct
```

Rather than:

```text
final staircase level = reported capacity
```

This keeps gameplay adaptive while making the score more defensible.

---

#### 4.5.5 Exposure-time candidate set

Use frame-safe exposure values rather than arbitrary millisecond values.

Recommended v1 candidate set at 60 Hz:

| Frames | Approx. exposure |
|---:|---:|
| 6 | 100 ms |
| 9 | 150 ms |
| 12 | 200 ms |
| 18 | 300 ms |
| 24 | 400 ms |
| 30 | 500 ms |
| 42 | 700 ms |
| 60 | 1000 ms |
| 90 | 1500 ms |

At higher refresh rates, use the same approximate millisecond targets but always calculate actual exposure from observed frame counts.

The adaptive engine may choose exposure values between these anchors after timing validation, but early implementation should use a discrete frame-safe set for stability.

---

#### 4.5.6 ACC bits/sec calculation

For Attention Control, the basic capacity estimate is:

```text
ACC_bps = H_condition / ET_adjusted_seconds
```

where:

```text
H_condition = information value for the current majority-ratio condition
ET_adjusted_seconds = frame-counted stimulus exposure duration
```

For a single-trial proxy:

```text
trial_bps = H_condition / (ET_adjusted_ms / 1000)
```

Single-trial bps is useful for adaptive sampling and debugging, but it is not the canonical score.

For a wrapper-level canonical estimate:

```text
ET_75 = fitted exposure duration required for approximately 75% correct
ACC_wrapper_bps = H_condition_at_threshold / (ET_75 / 1000)
```

Example:

```text
H_condition = 2.91 bits
ET_75 = 500 ms
ACC_wrapper_bps = 2.91 / 0.5 = 5.82 bits/sec
```

Recommended psychometric form:

```text
P_correct =
chance + usable_range × sigmoid(θ_ACC - D_trial)
```

where:

```text
chance = 0.50
usable_range = 1 - chance - lapse_rate

D_trial =
H_condition / ET_adjusted_seconds
+ wrapper_cost
+ frame_cost
+ lure_cost
+ timing_penalty
```

The canonical estimate should be produced or verified server-side from all valid trials in the relevant construct × carrier × frame cell.

---

#### 4.5.7 BSE bits/sec calculation

For `BSE`, use the same timing backbone but a different information term.

If the BSE task is a relation × colour majority or report task, use:

```text
H_token = log2(number of active response tokens)
```

Examples:

```text
2 relation choices = 1 bit
4 relation choices = 2 bits
4 relation × 4 colour tokens = 4 bits
```

The simple proxy is:

```text
BSE_bps = H_token / (ET_75 / 1000)
```

However, because BSE includes binding demand, the canonical fitted model should include binding and lure terms:

```text
D_BSE =
H_token / ET_adjusted_seconds
+ binding_cost
+ partial_match_lure_cost
+ wrapper_shift_cost
+ timing_penalty
```

Report BSE bits/sec only when enough trials are available. Otherwise mark BSE as:

```text
calibrating
exploratory
timing limited
```

Do not imply that `BSE_bps` is directly comparable to `ACC_bps` unless both models share the same calibration tier and confidence threshold.

---

#### 4.5.8 Canonical score rule

The engineering rule is:

```text
The staircase controls stimulus exposure during play and concentrates trials around the user’s current threshold.
The canonical bits/sec score is computed post-block from the fitted exposure-time threshold required to maintain criterion accuracy.
It is not computed from a single trial, and it is not simply the final staircase step.
```

For each wrapper cell, store:

```text
ET_75_ms
H_condition_at_threshold
capacity_bps
capacity_se
confidence_label
staircase_summary
model_version
calibration_table_id
```

---

#### 4.5.9 User-facing score rule

The user may see:

```text
Attention Control: X.X bits/sec
Binding Focus: X.X bits/sec
Confidence: calibrating / moderate / high
```

Do not show during gameplay:

```text
condition entropy
ET threshold
lapse rate
staircase level
model parameters
trajectory metrics
```

These remain backend or researcher-facing values.

---

## 5. Learning-curve gates

### 5.1 Flattening gate

A phase is ready to transition when the active cell shows local near-asymptote.

Recommended rule:

```text
minimum_trials_current_cell >= 240
AND recent_capacity_slope over K windows is near zero
AND balanced_accuracy is inside or slightly above target band
AND timing quality is acceptable
AND lapse rate is stable
```

Suggested values:

```text
K = 4 rolling windows
window_size = 40 trials
target balanced accuracy = 70–82%
flattening slope threshold = abs(slope) < 0.02 capacity units/window
```

Do not switch after one good session. The goal is to perturb a minimally stable invariant, not a noisy or unlearned policy.

---

### 5.2 Recovery gate

A new phase shows recovery when:

```text
capacity_new reaches 90% of its own local asymptote
OR
capacity_new reaches a pre-specified fraction of matched scratch asymptote
AND
accuracy / lapse / timing are stable
```

For transfer metrics, recovery should be measured continuously rather than reduced to a pass/fail gate.

---

## 6. Zhang–Tang trajectory logging

### 6.1 Why trajectory logging is needed

Capacity estimates alone do not capture transfer efficiency. A user may eventually learn the new carrier but still have learned it from scratch.

The transfer question is:

```text
Did the new carrier use the same already-discovered invariant,
or did it trigger a fresh search?
```

To answer this, the app must store update trajectories around phase transitions.

---

### 6.2 Behavioural implementation of update vectors

In a behavioural webapp, `w_t` is not a neural weight vector. It is the fitted state of the adaptive scoring model at window `t`.

Define:

```text
w_t =
[
  θ_capacity,
  wrapper_cost,
  frame_cost,
  lapse_rate,
  ET_threshold,
  ratio_sensitivity,
  lure_sensitivity,
  RT_variability,
  timing_penalty
]
```

Then:

```text
Δw_t = w_t - w_(t-1)
```

This gives a usable behavioural update vector for trajectory analysis.

For a more minimal implementation:

```text
w_t = [θ_capacity, ET_threshold, lapse_rate, RT_variability]
```

Store model version with every trajectory so future recalibration is possible.

---

### 6.3 Action / condition vector

For mutual-information calculations, define the condition vector `a_t` for each trial or window.

```text
a_t =
[
  carrier,
  frame,
  relation_axis,
  majority_ratio,
  exposure_time,
  mask_time,
  response_set,
  lure_type,
  timing_quality,
  construct
]
```

For window-level MI, aggregate condition features across the same window used for `Δw_t`.

---

### 6.4 Required trajectory fields

Create a trajectory-window table.

```sql
CREATE TABLE trajectory_windows (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    construct text NOT NULL CHECK (construct IN ('ACC','BSE')),
    phase text NOT NULL,
    cell_key text NOT NULL CHECK (cell_key IN ('arrow_abs','flow_abs','arrow_rel','flow_rel','mixed')),
    transition_key text,
    window_index integer NOT NULL,
    trial_start integer NOT NULL,
    trial_end integer NOT NULL,

    theta_capacity float,
    et_threshold_ms float,
    lapse_rate float,
    wrapper_cost float,
    frame_cost float,
    lure_sensitivity float,
    rt_median_ms float,
    rt_iqr_ms float,
    timing_penalty float,

    update_vector float8[],
    update_norm float,
    condition_vector_summary jsonb,

    mi_update_condition float,
    beta_star float,
    lambda_mi float,
    alpha_stability float,

    large_update_flag boolean DEFAULT false,
    loss_value float,
    created_at timestamptz DEFAULT now()
);
```

Important:

```text
mi_update_condition = I(Δw; a)
alpha_stability = λ × β*
```

If the full Zhang–Tang proxy model is not yet implemented, store `NULL` for these fields and compute them offline. Do not fake precision.

---

## 7. Primary transfer-efficiency metrics

All transfer-efficiency metrics are computed at carrier-swap boundaries:

```text
T_CM_BASE: arrow_abs → flow_abs
T_CM_REL:  arrow_rel → flow_rel
```

For counterbalanced validation:

```text
T_CM_BASE: flow_abs → arrow_abs
T_CM_REL:  flow_rel → arrow_rel
```

The same formulas apply with the old/new carrier reversed.

---

### 7.1 MI Recovery Ratio — `MIR`

After a carrier swap, track mutual information between update direction and condition structure:

```text
I(Δw; a)
```

Let:

```text
τ90_transfer = number of trajectory windows after swap required to reach 90% of the new asymptotic MI

τ90_scratch = matched from-scratch baseline for the same target cell
```

Then:

```text
MIR = (τ90_scratch - τ90_transfer) / τ90_scratch
```

Interpretation:

| MIR value | Meaning |
|---:|---|
| ≈ 0 | no measurable recovery advantage over scratch |
| > 0 | transfer faster than scratch |
| close to 1 | near-immediate recovery |
| < 0 | slower than scratch; possible negative transfer or overload |

#### τ90 definition

Let:

```text
MI_0 = mean MI in first post-swap window
MI_inf = mean MI in final stable window of new phase
MI_90 = MI_0 + 0.90 × (MI_inf - MI_0)
```

`τ90` is the first window where:

```text
MI_t >= MI_90
AND remains above MI_90 for at least M consecutive windows
```

Suggested:

```text
M = 2 windows
window_size = 40 trials
```

---

### 7.2 α-Stability Index — `ASI`

Zhang–Tang-style learning predicts that α stability should be briefly disrupted after a meaningful perturbation, then rapidly re-stabilise when the invariant is already in place.

Compute:

```text
α_t = λ_t × β*_t
```

Then:

```text
ASI = 1 - CV(α)_transfer / CV(α)_scratch
```

Interpretation:

| ASI value | Meaning |
|---:|---|
| > 0 | α re-stabilises faster than scratch |
| ≈ 0 | no stability advantage |
| < 0 | transfer phase is less stable than scratch |

Recommended window:

```text
post-swap W = first 4–6 trajectory windows
```

Do not report ASI if fewer than 4 valid post-swap windows are available.

---

### 7.3 Cross-Modal β* Alignment — `CBA`

Compute the leading principal component of update vectors in:

```text
old_final_window_set = final stable windows of old carrier
new_initial_window_set = first windows of new carrier
```

Let:

```text
u_old = first principal component of Δw in old_final_window_set
u_new = first principal component of Δw in new_initial_window_set
```

Then:

```text
CBA = |u_old · u_new| / (||u_old|| ||u_new||)
```

Interpretation:

| CBA | Meaning |
|---:|---|
| high | new carrier is extending the same low-dimensional update manifold |
| low | new carrier appears to trigger a different search direction |

Suggested minimum data:

```text
at least 4 update windows old carrier
at least 4 update windows new carrier
same model version
same construct
same frame
```

---

### 7.4 Large-Update Interevent Scaling Shift — `LISS`

Large updates indicate reorganisation events. Efficient transfer should require fewer disruptive large-update reorganisations than scratch learning.

Define a large update as:

```text
update_norm_t > median(update_norm_pre) + 3 × MAD(update_norm_pre)
```

or:

```text
update_norm_t > 90th percentile of user’s pre-swap update norms
```

Compute interevent intervals between large updates and fit:

```text
p(Δt) ∝ Δt^-γ
```

Then:

```text
LISS = (γ_transfer - γ_pre) / (γ_scratch - γ_pre)
```

Interpretation:

| LISS | Meaning |
|---:|---|
| > 0 | post-swap update events become less clustered / more stable than scratch |
| ≈ 0 | no advantage over scratch |
| < 0 | swap induces more disruptive updating than scratch |

Reliability rule:

```text
Do not report LISS unless there are at least 6 large-update events in the relevant comparison set.
```

For most individual users, LISS will often be an offline research metric, not a live dashboard metric.

---

### 7.5 Perturbation Response Ratio — `PRR`

After convergence in each phase, apply model or probe perturbations to a held-out set.

Perturbation types:

```text
small perturbation: δp = ±0.01 equivalent in model parameter space
large perturbation: δp = ±1.00 equivalent in model parameter space
```

For behavioural implementation, this can be approximated with held-out boundary probes:

```text
same relation, slightly changed timing
same relation, changed lure ratio
same relation, changed visual contrast/coherence
near-miss foil
```

Compute:

```text
PRR = mean(ΔL_scratch) / mean(ΔL_transfer)
```

Interpretation:

| PRR | Meaning |
|---:|---|
| > 1 | transferred representation is more robust than scratch |
| = 1 | no robustness advantage |
| < 1 | transfer representation is more fragile |

Important:

```text
PRR is a robustness metric, not a learning-speed metric.
```

---

## 8. Composite transfer-efficiency scores

### 8.1 Boundary-level transfer efficiency

For each carrier-swap boundary and construct:

```text
TE_boundary =
weighted_mean_z(
  MIR,
  ASI,
  CBA,
  LISS,
  log(PRR)
)
```

Recommended starting weights:

| Component | Weight | Reason |
|---|---:|---|
| MIR | 0.30 | direct recovery-speed signal |
| ASI | 0.20 | dynamical stability signal |
| CBA | 0.20 | manifold-alignment signal |
| LISS | 0.10 | large-update organisation signal |
| log(PRR) | 0.20 | robustness signal |

If LISS is unavailable, redistribute its weight proportionally to MIR, ASI, CBA and PRR.

---

### 8.2 Named transfer scores

Compute separately:

| Score | Boundary | Construct | Meaning |
|---|---|---|---|
| `ACC_CM_Base_TE` | `arrow_abs → flow_abs` | ACC | base attention-control carrier transfer |
| `ACC_CM_Rel_TE` | `arrow_rel → flow_rel` | ACC | relational-frame carrier transfer |
| `BSE_CM_Base_TE` | `arrow_abs → flow_abs` | BSE | base binding/extraction carrier transfer |
| `BSE_CM_Rel_TE` | `arrow_rel → flow_rel` | BSE | relational binding carrier transfer |

Optional composites:

```text
ACC_CrossModal_TE = mean(ACC_CM_Base_TE, ACC_CM_Rel_TE)

BSE_CrossModal_TE = mean(BSE_CM_Base_TE, BSE_CM_Rel_TE)

Overall_CrossModal_TE =
weighted_mean(ACC_CrossModal_TE, BSE_CrossModal_TE)
```

Do not compute `Overall_CrossModal_TE` until both base and relational transfer boundaries have been observed with sufficient confidence.

---

## 9. Absolute→relative validation metrics

Absolute→relative transitions are not transfer-efficiency boundaries. They are validation and diagnostic transitions.

They answer:

```text
Did the user form a deep enough carrier-invariant operation
that relational abstraction in the new carrier becomes easier, parallel or compressed?
```

---

### 9.1 Frame-Abstraction Baseline — `FAB_arrow`

From P3:

```text
FAB_arrow = trajectory_signature(arrow_abs → arrow_rel)
```

Includes:

```text
MI rise shape
β* decay / alignment trajectory
α disruption and restabilisation
capacity recovery curve
perturbation response
lure profile
```

---

### 9.2 Frame-Abstraction Validation — `FAV_flow`

From P4:

```text
FAV_flow = compare(
  trajectory_signature(flow_abs → flow_rel),
  trajectory_signature(arrow_abs → arrow_rel)
)
```

The expected positive signature is:

```text
flow absolute→relative curve is parallel to arrow absolute→relative
OR
flow absolute→relative curve is compressed relative to arrows
```

---

### 9.3 Validation submetrics

#### A. MI trajectory similarity — `FAV_MI_shape`

Use dynamic time warping or curve correlation between the two MI recovery curves.

```text
FAV_MI_shape = similarity(
  MI_curve_arrow_abs_to_rel,
  MI_curve_flow_abs_to_rel
)
```

High similarity means the relational abstraction process has the same learning signature in both carriers.

---

#### B. Compression ratio — `FAV_compression`

```text
FAV_compression =
τ90_frame_arrow / τ90_frame_flow
```

Interpretation:

| Value | Meaning |
|---:|---|
| > 1 | flow relational abstraction is compressed relative to arrow baseline |
| ≈ 1 | parallel learning signature |
| < 1 | flow relational abstraction is slower than arrow baseline |

This is a validation metric, not the primary cross-modal transfer metric.

---

#### C. β* trajectory parallelism — `FAV_beta_parallel`

```text
FAV_beta_parallel =
corr(β*_arrow_frame_curve, β*_flow_frame_curve)
```

High values indicate that directional update structure during relational abstraction is similar across carriers.

---

#### D. Perturbation equivalence — `FAV_PR_equivalence`

```text
FAV_PR_equivalence =
1 - |PR_flow_frame - PR_arrow_frame| / max(PR_flow_frame, PR_arrow_frame)
```

High values indicate similar robustness after relational abstraction.

---

### 9.4 Interpretation rule

| Pattern | Interpretation |
|---|---|
| strong `T_CM_BASE` + compressed `FAV_flow` | strong evidence that base carrier invariant supports later relational abstraction |
| weak `T_CM_BASE` + naïve-looking `FAV_flow` | optic-flow relations likely learned from scratch |
| strong `T_CM_BASE` + weak `T_CM_REL` | base extraction transferred, but relational-frame invariant did not |
| weak `T_CM_BASE` + strong `T_CM_REL` | possible late abstraction; inspect trajectories and mixed phase |
| strong mixed stability + strong delayed recovery | best evidence for portable carrier-invariant control |

---

## 10. Scratch baselines

### 10.1 Why scratch baselines are needed

MIR, ASI, LISS and PRR require a comparison against learning “from scratch”.

A within-user carrier swap is not enough by itself. If a user recovers quickly in the new carrier, we need to know whether that recovery is faster than a matched user who started there without prior invariant training.

---

### 10.2 Preferred research baseline

Use a screened, counterbalanced validation cohort.

```text
Group A:
arrow_abs → flow_abs → arrow_rel → flow_rel

Group B:
flow_abs → arrow_abs → flow_rel → arrow_rel
```

Then:

```text
Group A flow_abs transfer
is compared against
Group B flow_abs first-carrier scratch
```

and:

```text
Group B arrow_abs transfer
is compared against
Group A arrow_abs first-carrier scratch
```

The same logic applies to relational carrier transfer.

---

### 10.3 Commercial baseline

In the commercial app, avoid visible randomisation. Use:

```text
historical norm-matched scratch curves
device-tier-matched scratch curves
personal early-learning curve priors
```

Commercial transfer scores should be labelled as:

```text
Motion Recovery
Relation Recovery
Mixed Flexibility
```

rather than as definitive scientific transfer efficiency.

The full research transfer calculation can be run offline from logged trial data.

---

## 11. Supabase schema update

### 11.1 Phase and transition fields

Update the user/session schema to reflect the new phase order.

```sql
ALTER TABLE users
ADD COLUMN IF NOT EXISTS phase_order text DEFAULT 'arrow_abs__flow_abs__arrow_rel__flow_rel',
ADD COLUMN IF NOT EXISTS current_cell_key text
  CHECK (current_cell_key IN ('arrow_abs','flow_abs','arrow_rel','flow_rel','mixed')),
ADD COLUMN IF NOT EXISTS research_mode boolean DEFAULT false;
```

Recommended phase labels:

```text
P1_ARROW_ABS
P2_FLOW_ABS
P3_ARROW_REL
P4_FLOW_REL
P5_MIXED
P6_DELAYED
```

For flow-first research mode:

```text
P1_FLOW_ABS
P2_ARROW_ABS
P3_FLOW_REL
P4_ARROW_REL
P5_MIXED
P6_DELAYED
```

---

### 11.2 Trial table additions

Every trial must identify its carrier/frame cell and construct.

```sql
ALTER TABLE trials
ADD COLUMN IF NOT EXISTS construct text CHECK (construct IN ('ACC','BSE')),
ADD COLUMN IF NOT EXISTS cell_key text CHECK (cell_key IN ('arrow_abs','flow_abs','arrow_rel','flow_rel','mixed')),
ADD COLUMN IF NOT EXISTS transition_key text CHECK (transition_key IN (
  'T_CM_BASE',
  'T_FRAME_ARROW',
  'T_FRAME_FLOW',
  'T_CM_REL',
  'T_MIXED',
  'T_DELAYED'
)),
ADD COLUMN IF NOT EXISTS phase_label text,
ADD COLUMN IF NOT EXISTS is_reference_recheck boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS trajectory_window_id uuid;
```

---

#### 11.2.1 Timing, staircase and threshold fields

Speed-sensitive `ACC` and `BSE` trials must also store presentation timing and staircase metadata.

```sql
ALTER TABLE trials
ADD COLUMN IF NOT EXISTS exposure_ms_requested float,
ADD COLUMN IF NOT EXISTS exposure_ms_actual float,
ADD COLUMN IF NOT EXISTS actual_stimulus_frames integer,
ADD COLUMN IF NOT EXISTS device_refresh_rate_estimate float,
ADD COLUMN IF NOT EXISTS dropped_frame_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS mask_ms_requested float,
ADD COLUMN IF NOT EXISTS mask_ms_actual float,
ADD COLUMN IF NOT EXISTS response_window_ms integer,
ADD COLUMN IF NOT EXISTS fixation_ms integer,
ADD COLUMN IF NOT EXISTS iti_ms integer,
ADD COLUMN IF NOT EXISTS staircase_level integer,
ADD COLUMN IF NOT EXISTS staircase_direction text CHECK (staircase_direction IN ('harder','easier','maintain')),
ADD COLUMN IF NOT EXISTS H_condition_bits float,
ADD COLUMN IF NOT EXISTS calibration_table_id text;
```

Capacity estimates should store the fitted threshold used to compute bits/sec.

```sql
ALTER TABLE capacity_estimates
ADD COLUMN IF NOT EXISTS et_75_ms float,
ADD COLUMN IF NOT EXISTS h_condition_at_threshold_bits float,
ADD COLUMN IF NOT EXISTS capacity_bps float,
ADD COLUMN IF NOT EXISTS capacity_se float,
ADD COLUMN IF NOT EXISTS staircase_summary jsonb,
ADD COLUMN IF NOT EXISTS calibration_table_id text;
```

If the project uses a differently named estimate table, add the same fields to the canonical estimate table for `ACC` and `BSE`.

---

### 11.3 Transition-events table

```sql
CREATE TABLE IF NOT EXISTS transfer_transition_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    construct text NOT NULL CHECK (construct IN ('ACC','BSE')),
    transition_key text NOT NULL CHECK (transition_key IN (
      'T_CM_BASE',
      'T_FRAME_ARROW',
      'T_FRAME_FLOW',
      'T_CM_REL',
      'T_MIXED',
      'T_DELAYED'
    )),
    from_cell_key text NOT NULL,
    to_cell_key text NOT NULL,
    from_phase text NOT NULL,
    to_phase text NOT NULL,
    transition_type text NOT NULL CHECK (transition_type IN (
      'carrier_swap',
      'frame_ramp',
      'mixed_switch',
      'delayed_recheck'
    )),
    is_cross_modal_transfer_boundary boolean NOT NULL DEFAULT false,
    is_validation_boundary boolean NOT NULL DEFAULT false,
    started_at timestamptz DEFAULT now(),
    completed_at timestamptz,
    notes jsonb
);
```

Rules:

```text
T_CM_BASE and T_CM_REL:
is_cross_modal_transfer_boundary = true

T_FRAME_ARROW and T_FRAME_FLOW:
is_validation_boundary = true
is_cross_modal_transfer_boundary = false
```

---

### 11.4 Transfer-metrics table

```sql
CREATE TABLE IF NOT EXISTS transfer_metrics (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    construct text NOT NULL CHECK (construct IN ('ACC','BSE')),
    transition_event_id uuid REFERENCES transfer_transition_events(id),
    transition_key text NOT NULL,
    metric_name text NOT NULL CHECK (metric_name IN (
      'MIR',
      'ASI',
      'CBA',
      'LISS',
      'PRR',
      'TE_boundary',
      'FAV_MI_shape',
      'FAV_compression',
      'FAV_beta_parallel',
      'FAV_PR_equivalence',
      'Mixed_Stability',
      'Delayed_Recovery'
    )),
    value float,
    se float,
    ci_lower float,
    ci_upper float,
    confidence_label text CHECK (confidence_label IN (
      'insufficient data',
      'calibrating',
      'moderate confidence',
      'high confidence',
      'timing limited',
      'unstable estimate'
    )),
    scratch_baseline_source text CHECK (scratch_baseline_source IN (
      'counterbalanced_cohort',
      'historical_norm',
      'within_user_proxy',
      'not_required'
    )),
    model_version text NOT NULL,
    created_at timestamptz DEFAULT now()
);
```

---

## 12. Metric computation pipeline

### 12.1 Post-session computation

After every session:

```text
1. validate timing quality
2. update trial-level correctness and RT summaries
3. update capacity estimate for active cell
4. create trajectory windows
5. compute Δw vectors
6. compute or queue MI / β* / α estimates
7. check flattening or recovery status
8. update phase state
9. if transition boundary exists, update transfer metrics
```

---

### 12.2 Transfer calculation pseudocode

```typescript
function computeCarrierSwapTransfer(userId, construct, transitionKey) {

  assert(transitionKey === 'T_CM_BASE' || transitionKey === 'T_CM_REL')

  const event = getTransitionEvent(userId, construct, transitionKey)
  const oldWindows = getFinalStableWindows(event.from_cell_key)
  const newWindows = getPostSwapWindows(event.to_cell_key)

  const scratch = getMatchedScratchBaseline({
    construct,
    targetCell: event.to_cell_key,
    deviceTier,
    ageBand,
    researchMode
  })

  const MIR  = computeMIR(newWindows, scratch)
  const ASI  = computeASI(newWindows, scratch)
  const CBA  = computeCBA(oldWindows, newWindows)
  const LISS = computeLISS(oldWindows, newWindows, scratch)
  const PRR  = computePRR(event, scratch)

  const TE_boundary = weightedComposite({
    MIR,
    ASI,
    CBA,
    LISS,
    logPRR: Math.log(PRR)
  })

  return storeTransferMetrics(...)
}
```

---

### 12.3 Validation calculation pseudocode

```typescript
function computeFrameValidation(userId, construct) {

  const arrowFrame = getTransitionEvent(userId, construct, 'T_FRAME_ARROW')
  const flowFrame  = getTransitionEvent(userId, construct, 'T_FRAME_FLOW')

  assert(arrowFrame.transition_type === 'frame_ramp')
  assert(flowFrame.transition_type === 'frame_ramp')

  const arrowCurve = getTrajectorySignature(arrowFrame)
  const flowCurve  = getTrajectorySignature(flowFrame)

  const FAV_MI_shape =
    compareCurveShape(arrowCurve.mi, flowCurve.mi)

  const FAV_compression =
    tau90(arrowCurve.mi) / tau90(flowCurve.mi)

  const FAV_beta_parallel =
    correlation(arrowCurve.betaStar, flowCurve.betaStar)

  const FAV_PR_equivalence =
    perturbationEquivalence(arrowFrame, flowFrame)

  return storeValidationMetrics(...)
}
```

---

## 13. Dashboard logic

### 13.1 Research dashboard

Show a transition matrix.

| Boundary | Type | ACC status | BSE status | Interpretation |
|---|---|---|---|---|
| Absolute arrows → Absolute flow | carrier swap | MIR / ASI / CBA / PRR | MIR / ASI / CBA / PRR | base cross-modal invariant |
| Absolute arrows → Relative arrows | frame ramp | validation baseline | validation baseline | arrow relational abstraction |
| Absolute flow → Relative flow | frame ramp | validation comparison | validation comparison | did flow inherit the abstraction signature? |
| Relative arrows → Relative flow | carrier swap | MIR / ASI / CBA / PRR | MIR / ASI / CBA / PRR | relational-frame cross-modal invariant |
| Mixed all four | mixed | stability | stability | flexible switching |
| Delayed all four | delayed | recovery | recovery | consolidation |

Research view may show:

```text
MIR
ASI
CBA
LISS
PRR
TE_boundary
FAV metrics
confidence intervals
scratch baseline source
```

---

### 13.2 Consumer dashboard

Do not show Zhang–Tang metrics directly.

Show:

```text
Attention Control
Binding Focus
Motion Recovery
Relation Recovery
Mixed Flexibility
Delayed Recovery
```

Example copy:

```text
Motion Recovery
Your attention-control skill is starting to carry over from arrows to motion patterns.

Relation Recovery
You are learning to recover the same relation when the task changes from screen direction to centre-relative direction.

Mixed Flexibility
You are practising switching between arrows, motion, simple direction and relative direction.
```

Avoid:

```text
MI recovery
β*
α-stability
power-law interevent scaling
criticality
```

in public UX.

---

## 14. Updated commercial simplification

The commercial app can still use a simple 0–100 score, but the internal transfer logic must respect carrier-swap boundaries.

### 14.1 Commercial phase names

| Technical phase | User-facing phase name |
|---|---|
| `arrow_abs` | Direction Foundation |
| `flow_abs` | Motion Foundation |
| `arrow_rel` | Relation Foundation |
| `flow_rel` | Motion Relations |
| mixed | Mixed Mastery |
| delayed | Return Check |

---

### 14.2 Commercial proxy scores

If full trajectory metrics are not yet available:

| Proxy | Boundary | Formula | Public label |
|---|---|---|---|
| base carrier recovery | `arrow_abs → flow_abs` | time / trials to recover to matched motion baseline | Motion Recovery |
| relational carrier recovery | `arrow_rel → flow_rel` | time / trials to recover to matched relational-motion baseline | Relation Recovery |
| mixed stability | all cells | SD or drop across random carrier/frame switches | Mixed Flexibility |
| delayed recovery | all cells later | later score / prior mixed score | Return Strength |

Important:

```text
Do not use arrow_abs → arrow_rel as Motion Recovery or Transfer.
```

That transition is a relation-ramp score, not a carrier-swap score.

---

### 14.3 User-facing feedback bands

| Score band | Label | Meaning |
|---:|---|---|
| 80–100 | Strong transfer signal | New surface recovered quickly. |
| 60–79 | Developing transfer | Some recovery, still adapting. |
| 40–59 | Surface-bound | Skill may still depend on the original format. |
| <40 | Rebuild foundation | The new surface behaved more like scratch learning. |

Use cautious language:

```text
suggests
appears
currently looks
needs more data
```

Do not say:

```text
proves far transfer
proves intelligence gain
```

---

## 15. Interpretation examples

### 15.1 Strong base cross-modal transfer

Pattern:

```text
T_CM_BASE:
MIR high
ASI positive
CBA high
PRR > 1

T_FRAME_FLOW:
compressed relative to T_FRAME_ARROW
```

Interpretation:

```text
The user appears to have formed a base attention-control invariant that transfers from static arrows to motion. The later relational abstraction in flow is easier because the flow carrier is not being learned from scratch.
```

---

### 15.2 Carrier-specific learning

Pattern:

```text
T_CM_BASE:
MIR ≈ 0
CBA low
ASI ≈ 0 or negative

T_FRAME_FLOW:
looks like naïve learning
```

Interpretation:

```text
The arrow skill did not strongly transfer into optic flow. Flow is being learned as a new carrier. Continue flow foundation before treating motion relations as transfer evidence.
```

---

### 15.3 Base transfer without relational transfer

Pattern:

```text
T_CM_BASE strong
T_FRAME_FLOW acceptable
T_CM_REL weak
```

Interpretation:

```text
The base extraction operation transferred across carrier, but the relational-frame operation has not yet become carrier-invariant.
```

Training response:

```text
more relative-arrow and relative-flow alternation
near-miss lures
mixed relational-only blocks
```

---

### 15.4 Good local scores but weak transfer

Pattern:

```text
high arrow_abs
high arrow_rel
high flow_abs eventually
slow MIR
low CBA
poor mixed stability
```

Interpretation:

```text
The user can learn each cell locally, but the invariant is still not portable across carriers. This is local fluency, not strong cross-modal transfer.
```

---

## 16. Implementation checklist

### Backend

- [ ] Replace old P1–P8 sequence with the new carrier-swap-first phase order.
- [ ] Add `cell_key`, `construct`, `transition_key`, `phase_label` to trial records.
- [ ] Add timing fields: requested/actual exposure, actual frames, refresh-rate estimate and dropped-frame count.
- [ ] Add staircase and threshold fields: staircase level, ET_75, H at threshold and capacity_bps.
- [ ] Add `transfer_transition_events`.
- [ ] Add `trajectory_windows`.
- [ ] Add `transfer_metrics`.
- [ ] Implement matched scratch-baseline lookup.
- [ ] Implement `computeCarrierSwapTransfer()`.
- [ ] Implement `computeFrameValidation()`.
- [ ] Preserve raw trials and old estimates for rescoring.

### Scoring

- [ ] Compute capacity separately for each construct × carrier × frame cell.
- [ ] Use adaptive staircase for sampling, but compute canonical bits/sec from fitted ET_75.
- [ ] Store majority-ratio entropy values in a versioned calibration table, not as hard-coded constants.
- [ ] Exclude poor-timing trials from high-confidence capacity estimates while preserving them in raw data.
- [ ] Compute update vectors from fitted model states.
- [ ] Estimate or queue MI / β* / α metrics.
- [ ] Compute MIR, ASI, CBA, LISS and PRR only at carrier-swap boundaries.
- [ ] Compute FAV metrics only for absolute→relative validation comparisons.
- [ ] Compute mixed and delayed metrics separately.

### Frontend

- [ ] Rename phases in user-friendly terms.
- [ ] Do not label absolute→relative gains as transfer.
- [ ] Show Motion Recovery after `arrow_abs → flow_abs`.
- [ ] Show Relation Recovery only after relational carrier boundary is observed.
- [ ] Show Mixed Flexibility in final all-cell phase.
- [ ] Keep technical metrics, ET thresholds, staircase levels and entropy values out of consumer UI.

### Research export

- [ ] Export trial-level data.
- [ ] Export trajectory windows.
- [ ] Export transition-event metadata.
- [ ] Export transfer metrics with model versions.
- [ ] Export scratch-baseline source and confidence labels.
- [ ] Preserve counterbalanced cohort assignment for validation analysis.

---

## 17. Final rule

The governing measurement rule is:

```text
Carrier swap = transfer boundary.
Frame ramp = validation boundary.
Mixed phase = flexibility test.
Delayed phase = consolidation test.
```

In one line:

> **Measure transfer efficiency where the carrier changes; use absolute→relative ramps to test whether the transferred invariant is deep enough to support relational abstraction.**
