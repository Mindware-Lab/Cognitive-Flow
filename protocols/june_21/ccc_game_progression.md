# IQ Coach — MFT-M Attention Control Layer Specification

## User-facing name

**Attention Control Training**

## Internal names

```text
Layer: MFT-M / CCC / Attention Control
Primary construct: Attention Control Capacity
Core score unit: bits/sec
Transfer metric: Overall Transfer Score
```

## 1. Purpose

The MFT-M layer trains and estimates how efficiently the user can extract the relevant majority signal from brief, masked visual displays.

The layer is not only a speed task. It is the first horizontal-transfer layer in the IQ Coach stack. It asks whether the same basic operation can survive changes in stimulus wrapper:

```text
extract the majority signal
→ change the wrapper
→ recover the signal
→ mix wrappers
→ re-check after delay
```

This layer prepares later graph-based games by estimating which stimulus dimensions are currently usable for:

```text
Relational Memory
Binding Memory
Path Prediction
Reasoning
```

The MFT-M layer should therefore output:

```text
1. Core Attention Control bits/sec
2. Probe readiness for colour, spatial frequency and speed
3. Wrapper recovery / transfer metrics
4. User-facing band scores and bottleneck labels
```

## 2. User-facing UX bands

The dashboard should show five meaningful training bands.

| UX band                | Internal source     | User-facing meaning                           |
| ---------------------- | ------------------- | --------------------------------------------- |
| **Direction**          | arrow absolute      | Left/right and up/down majority extraction    |
| **Relative Direction** | arrow relative      | Out/in and clockwise/anticlockwise extraction |
| **Features**           | Gabor orientation   | Static form-feature extraction                |
| **Movement**           | optic-flow absolute | Left/right and up/down movement extraction    |
| **Relative Movement**  | optic-flow relative | Expansion/contraction and rotation extraction |

Each band displays:

```text
bits/sec
standardised score
status label
short explanation
progress bar
```

Status labels:

```text
Strong
Watch
Bottleneck
```

Recommended interpretation:

```text
Strong = continue building
Watch = needs more practice
Bottleneck = prioritise this band
```

## 3. Trial structure

Each trial follows the masked majority-function format.

```text
fixation
→ brief stimulus display
→ mask
→ response window
→ feedback
→ inter-trial interval
```

Recommended starting values:

```text
fixation: 300–600 ms jittered
stimulus exposure: adaptive
mask: 300–500 ms
response window: 2000–2500 ms
feedback: 150–300 ms
ITI: 250–500 ms
```

All scored core trials use five-item majority displays.

Majority ratios:

```text
5:0
4:1
3:2
```

These should be stored in a configurable entropy table.

Initial values:

```text
5:0 = 1.58 bits
4:1 = 2.91 bits
3:2 = 4.91 bits
```

These values should be treated as calibration defaults, not permanent constants.

## 4. Trial roles

Every MFT-M trial must be labelled before scoring.

```ts
type TrialRole =
  | "core_scored"
  | "probe_unscored"
  | "transfer_probe"
  | "delayed_recheck"
  | "excluded_timing";
```

Core scored trials enter the bits/sec estimate.

Probe trials do not enter the main bits/sec estimate.

Probe trials estimate whether colour, spatial frequency or speed can be safely used later in graph-based games.

## 5. Stimulus progression

The layer uses five main curriculum stages.

---

# Stage A — Direction

## A1. Alternating blocked wrappers

```text
arrow.absolute.x_axis
→ left vs right majority

arrow.absolute.y_axis
→ up vs down majority
```

Purpose:

```text
establish base screen-centred majority extraction
```

## A2. Mixed absolute block

Within mixed blocks:

```text
66–80% mixed absolute direction trials
20–33% colour majority probes
```

Core scored trials:

```text
left/right majority
up/down majority
mixed left/right + up/down
```

Probe trials:

```text
colour majority with all arrows sharing the same randomly selected direction
```

The colour probe is excluded from Direction bits/sec.

It produces:

```text
Colour Readiness: arrow absolute context
```

---

# Stage B — Relative Direction

## B1. Alternating blocked wrappers

```text
arrow.relational.radial_axis
→ out vs in majority

arrow.relational.tangential_axis
→ clockwise vs anticlockwise majority
```

Purpose:

```text
train centre-relative signal extraction
```

## B2. Mixed relative block

Within mixed blocks:

```text
66–80% mixed relative direction trials
20–33% colour majority probes
```

Core scored trials:

```text
out/in majority
CW/CCW majority
mixed out/in + CW/CCW
```

Probe trials:

```text
colour majority with all arrows sharing the same randomly selected relative direction
```

The colour probe is excluded from Relative Direction bits/sec.

It produces:

```text
Colour Readiness: arrow relative context
```

---

# Stage C — Features

## C1. Alternating blocked Gabor orientation wrappers

```text
gabor.orientation_0_90
→ 0° vs 90° orientation majority

gabor.orientation_45_135
→ 45° vs 135° orientation majority
```

Purpose:

```text
remove symbolic arrow meaning while preserving static feature extraction
```

## C2. Mixed Gabor orientation block

Within mixed blocks:

```text
66–80% all orientation-majority trials
20–33% spatial-frequency majority probes
```

Core scored trials:

```text
0°/90° majority
45°/135° majority
mixed orientation majority
```

Probe trials:

```text
low vs high spatial-frequency majority
orientation fixed randomly per probe trial
```

The spatial-frequency probe is excluded from Features bits/sec initially.

It produces:

```text
Spatial-Frequency Readiness
```

Later, once enough data exist, spatial frequency can become a separately scored feature sub-band.

---

# Stage D — Movement

## D1. Alternating blocked optic-flow absolute wrappers

```text
optic_flow.absolute.x_axis
→ left vs right flow majority

optic_flow.absolute.y_axis
→ up vs down flow majority
```

Purpose:

```text
test dynamic motion extraction in screen-centred frames
```

## D2. Mixed absolute movement block

Within mixed blocks:

```text
66–80% mixed absolute optic-flow direction trials
20–33% speed majority probes
```

Core scored trials:

```text
left/right flow
up/down flow
mixed absolute flow direction
```

Probe trials:

```text
fast vs slow optic-flow majority
direction fixed randomly per probe trial
```

The speed probe is excluded from Movement bits/sec initially.

It produces:

```text
Speed Readiness: absolute movement context
```

---

# Stage E — Relative Movement

## E1. Alternating blocked optic-flow relative wrappers

```text
optic_flow.relational.radial_axis
→ expansion vs contraction

optic_flow.relational.tangential_axis
→ clockwise vs anticlockwise rotation
```

Purpose:

```text
train centre-relative movement extraction
```

## E2. Mixed relative movement block

Within mixed blocks:

```text
66–80% mixed relative optic-flow direction trials
20–33% speed majority probes
```

Core scored trials:

```text
expansion/contraction
rotation CW/CCW
mixed relative optic-flow direction
```

Probe trials:

```text
fast vs slow optic-flow majority
relative direction fixed randomly per probe trial
```

The speed probe is excluded from Relative Movement bits/sec initially.

It produces:

```text
Speed Readiness: relative movement context
```

---

## 6. Recommended 20-session coverage arc

This is a default first-pass exposure arc, not a mastery guarantee.

| Sessions | Main focus                                                                    |
| -------: | ----------------------------------------------------------------------------- |
|      1–3 | Stage A: Direction                                                            |
|      4–6 | Stage B: Relative Direction                                                   |
|     7–10 | Stage C: Features                                                             |
|    11–14 | Stage D: Movement                                                             |
|    15–18 | Stage E: Relative Movement                                                    |
|    19–20 | Mixed re-checks, weakest bands, delayed probes, graph-game eligibility update |

By session 20, the aim is:

```text
full first-pass exposure across the stimulus stack
initial learning curves
initial wrapper-recovery estimates
probe readiness estimates
weak-band identification
```

The aim is not to guarantee that every wrapper is fully banked by session 20.

## 7. Wrapper-switching rule

Each wrapper should maintain a rolling learning curve.

Track:

```text
capacity estimate
balanced accuracy
median RT
lapse rate
timing quality
difficulty level
slope over recent mini-blocks
```

A wrapper is considered ready for a new probe or swap when:

```text
minimum valid trials reached
balanced accuracy stable in or above training band
recent capacity slope near zero or flattening
confidence label acceptable
lapse rate acceptable
timing quality acceptable
```

Suggested MVP values:

```text
minimum valid scored trials per wrapper: 80
preferred valid scored trials per wrapper: 120–220
minimum mini-blocks before switching: 4
minimum sessions before banking: 2–3
```

Do not switch wrapper if:

```text
balanced accuracy < 60%
timing quality is poor
lapse rate is high
estimate uncertainty is wide
the user is still improving steeply
```

## 8. Probe percentage rule

Start new probes at:

```text
80% main trials
20% probe trials
```

Move to:

```text
66% main trials
33% probe trials
```

only after the probe dimension shows recoverable performance.

For established probes, a 66/33 split is acceptable.

For challenging wrappers, keep probes at 20% until readiness improves.

## 9. Mixed-wrapper progression

Use the following progression whenever a new wrapper is introduced.

```text
blocked A
→ A with small B probe
→ blocked B recovery if B is recoverable
→ 70% B / 30% A
→ 50% A / 50% B
→ random mixed A/B
→ delayed A/B re-check
```

For within-band alternation:

```text
Direction:
left/right ↔ up/down

Relative Direction:
out/in ↔ CW/CCW

Features:
0/90 ↔ 45/135

Movement:
flow left/right ↔ flow up/down

Relative Movement:
expansion/contraction ↔ rotation
```

For cross-band transfer:

```text
Direction → Relative Direction
Relative Direction → Features
Features → Movement
Movement → Relative Movement
```

## 10. Core bits/sec scoring

Only `core_scored` trials enter the main bits/sec estimate.

For each scored trial:

```text
trial_information_rate = H_ratio / ET_adjusted
```

Where:

```text
H_ratio = information demand of the majority ratio
ET_adjusted = actual display duration in seconds
```

For an MVP block estimate:

```text
mean_demand_rate = mean(H_ratio_i / ET_i)
```

Then adjust by performance:

```text
performance_quality =
max(0, (balanced_accuracy - chance) / (criterion - chance))
```

For binary decisions:

```text
chance = 0.50
criterion = 0.75
```

Then:

```text
ACC_block =
mean_demand_rate × performance_quality
```

Preferred fitted estimate:

```text
P(correct) =
chance + usable_range × sigmoid(theta_ACC - D_trial)
```

Where:

```text
D_trial =
H_ratio / ET_adjusted
+ wrapper_cost
+ frame_cost
+ lure_cost
```

The user-facing bits/sec value for each band should be the fitted demand rate at which predicted accuracy reaches the criterion.

Default criterion:

```text
75% predicted accuracy
```

## 11. Band-level scores

Calculate separate band estimates:

```text
ACC_direction
ACC_relative_direction
ACC_features
ACC_movement
ACC_relative_movement
```

Internal sub-scores:

```text
ACC_arrow_abs_x
ACC_arrow_abs_y
ACC_arrow_abs_mixed

ACC_arrow_rel_radial
ACC_arrow_rel_tangential
ACC_arrow_rel_mixed

ACC_gabor_orientation_0_90
ACC_gabor_orientation_45_135
ACC_gabor_orientation_mixed

ACC_flow_abs_x
ACC_flow_abs_y
ACC_flow_abs_mixed

ACC_flow_rel_radial
ACC_flow_rel_tangential
ACC_flow_rel_mixed
```

Band estimate rule:

```text
band_ACC =
weighted fitted mean of its relevant core scored wrappers
```

Weight by:

```text
valid trial count
timing quality
estimate confidence
recency
```

Do not include probe trials in band bits/sec.

## 12. Standardised band scores

Each band should show both:

```text
bits/sec
standardised score
```

Standardised score:

```text
Std = 100 + 15 × z
```

Where:

```text
z = (user_band_ACC - norm_group_mean_ACC) / norm_group_sd_ACC
```

If stable norms do not yet exist, use personal-baseline provisional scaling:

```text
Std_provisional =
100 + 15 × ((current_band_ACC - user_baseline_mean) / user_baseline_sd)
```

Label early scores:

```text
calibrating
moderate confidence
high confidence
timing limited
insufficient data
```

## 13. Probe-readiness metrics

Probe trials produce readiness metrics, not core bits/sec.

Probe dimensions:

```text
Colour Readiness
Spatial-Frequency Readiness
Speed Readiness
```

Probe readiness can be calculated as:

```text
Probe Readiness =
probe_accuracy_adjusted × timing_quality_weight × confidence_weight
```

Or as a threshold estimate:

```text
Probe Threshold =
minimum exposure duration at which probe accuracy reaches criterion
```

Simple readiness bands:

```text
Ready:
balanced accuracy ≥ 75%
minimum trials met
timing quality acceptable

Stretch:
balanced accuracy 65–74%

Probe only:
balanced accuracy 55–64%

Not ready:
balanced accuracy < 55%
```

Probe readiness affects later game eligibility:

```text
Colour Ready
→ colour may be used in Binding Memory

Spatial Frequency Ready
→ spatial frequency may be used as a graph-state feature

Speed Ready
→ speed may be used in Movement / Path Prediction graph states
```

Probe readiness must not inflate Attention Control.

## 14. Transfer metrics

Transfer metrics should sit beside bits/sec, not inside it.

Core transfer measures:

```text
Initial Transfer Ratio
Switch Cost
Recovered Transfer Ratio
Recovery Gain
Recovery Slope
Mixed-Wrapper Stability
Delayed Recovery
```

## 14.1 Initial Transfer Ratio

When moving from wrapper A to wrapper B:

```text
Initial Transfer Ratio =
ACC_B_initial / ACC_A_recent
```

## 14.2 Switch Cost

```text
Switch Cost =
1 - (ACC_B_initial / ACC_A_recent)
```

Bits/sec version:

```text
Switch Cost bits/sec =
ACC_A_recent - ACC_B_initial
```

## 14.3 Recovered Transfer Ratio

```text
Recovered Transfer Ratio =
ACC_B_recovered / ACC_A_recent
```

## 14.4 Recovery Gain

```text
Recovery Gain =
ACC_B_recovered - ACC_B_initial
```

## 14.5 Recovery Slope

```text
Recovery Slope =
slope of ACC_B over recent mini-blocks
```

MVP version:

```text
Recovery Slope =
(ACC_B_later - ACC_B_initial) / number_of_B_blocks
```

## 14.6 Mixed-Wrapper Stability

```text
Mixed Stability =
ACC_mixed / weighted_mean(ACC_A_blocked, ACC_B_blocked)
```

Interpretation:

```text
0.90–1.00 = strong mixed-wrapper stability
0.80–0.89 = developing stability
0.70–0.79 = watch
<0.70 = bottleneck
```

## 14.7 Delayed Recovery

```text
Delayed Recovery =
ACC_delayed_recheck / ACC_recovered_previous_session
```

## 15. Overall Transfer Score

The top UX card should show an overall score out of 100.

Recommended formula:

```text
Overall Transfer Score =
weighted_mean(
  Recovered Transfer Ratio,
  Mixed-Wrapper Stability,
  Delayed Recovery,
  Recovery Slope,
  Probe Readiness
)
```

Initial weights:

```text
Recovered Transfer Ratio: 30%
Mixed-Wrapper Stability: 25%
Delayed Recovery: 20%
Recovery Slope: 15%
Probe Readiness: 10%
```

Probe Readiness should be capped so that strong probes cannot compensate for poor core wrapper recovery.

Example cap:

```text
probe contribution ≤ 10% of total score
```

## 16. Band status labels

Each band receives a status label.

Use both bits/sec and transfer information.

## Strong

Criteria:

```text
standardised score ≥ 100
or recent personal trend positive

and

mixed-wrapper stability ≥ .85
and timing quality acceptable
```

## Watch

Criteria:

```text
standardised score 90–99
or transfer stability incomplete
or probe readiness only partial
```

## Bottleneck

Criteria:

```text
standardised score < 90
or mixed-wrapper stability < .75
or delayed recovery < .80
or recovery slope flat after wrapper swap
```

The bottleneck label should not imply deficit or diagnosis.

User-facing tone:

```text
Focus here first.
Train wrapper recovery here.
This band is still building.
```

## 17. Session-generation algorithm

At session start:

```text
1. Load user profile and recent band estimates.
2. Select one primary band.
3. Select one secondary or delayed band.
4. Choose wrappers using readiness and transfer history.
5. Allocate core/probe proportions.
6. Generate trials.
7. Run mini-blocks.
8. Update bits/sec, probe readiness and transfer metrics separately.
9. Update dashboard bands.
10. Pass eligible dimensions to graph-based games.
```

## 18. Band-selection priority

Prioritise bands by:

```text
bottleneck status
low mixed-wrapper stability
low delayed recovery
needed downstream graph eligibility
insufficient data
planned curriculum progression
```

Do not always train the weakest band if the user lacks the prerequisite wrapper readiness.

## 19. Data model

Each trial should store:

```ts
type MFTMTrial = {
  trialId: string;
  userId: string;
  sessionId: string;
  blockId: string;

  trialRole:
    | "core_scored"
    | "probe_unscored"
    | "transfer_probe"
    | "delayed_recheck"
    | "excluded_timing";

  uxBand:
    | "direction"
    | "relative_direction"
    | "features"
    | "movement"
    | "relative_movement";

  carrier:
    | "arrow"
    | "gabor"
    | "optic_flow";

  frame:
    | "absolute"
    | "relational"
    | null;

  wrapperId: string;
  featureAxis:
    | "direction"
    | "orientation"
    | "spatial_frequency"
    | "speed"
    | "colour";

  targetDimension: string;

  majorityRatio:
    | "5:0"
    | "4:1"
    | "3:2";

  H_ratio: number;
  exposureMs: number;
  actualFrames: number;
  ET_adjusted: number;

  correct: boolean;
  response: string;
  rtMs: number;

  timingQuality: "good" | "acceptable" | "poor";
  lapseFlag: boolean;

  previousWrapperId?: string;
  transferDistance?: number;
  isMixedWrapperTrial: boolean;
};
```

Block-level tables should store:

```text
band
wrapper_id
trial_count
valid_trial_count
balanced_accuracy
median_rt
lapse_rate
timing_quality
bits_sec_estimate
standardised_score
probe_readiness
transfer_metrics
confidence_label
```

## 20. Downstream handoff to graph games

The MFT-M layer should provide eligibility flags to the graph engine.

Example:

```ts
type StimulusEligibility = {
  direction: "ready" | "stretch" | "probe_only" | "not_ready";
  relativeDirection: "ready" | "stretch" | "probe_only" | "not_ready";
  features: "ready" | "stretch" | "probe_only" | "not_ready";
  movement: "ready" | "stretch" | "probe_only" | "not_ready";
  relativeMovement: "ready" | "stretch" | "probe_only" | "not_ready";

  colour: "ready" | "stretch" | "probe_only" | "not_ready";
  spatialFrequency: "ready" | "stretch" | "probe_only" | "not_ready";
  speed: "ready" | "stretch" | "probe_only" | "not_ready";
};
```

Downstream rules:

```text
Relational Memory:
use ready bands for scored blocks;
use stretch bands for small wrapper probes.

Binding Memory:
use colour only when Colour Readiness is adequate.

Path Prediction:
use movement and relative movement when optic-flow extraction is adequate.

Reasoning:
does not require visual wrapper readiness, but can use graph classes already trained visually.
```

## 21. Acceptance tests

The implementation should pass these tests.

### Trial role tests

```text
Probe trials never enter core bits/sec.
Excluded timing trials never enter fitted capacity.
Delayed re-check trials are tagged separately.
```

### Bits/sec tests

```text
Changing exposure changes trial demand.
Changing majority ratio changes trial demand.
Band bits/sec uses only core scored trials.
Probe performance does not inflate band bits/sec.
```

### Transfer tests

```text
Wrapper switch stores previous_wrapper_id.
Initial Transfer Ratio is computed after first B probe.
Mixed-Wrapper Stability is computed only from mixed-wrapper blocks.
Delayed Recovery is computed only from later re-checks.
```

### Probe-readiness tests

```text
Colour probes update colour eligibility only.
Spatial-frequency probes update spatial-frequency eligibility only.
Speed probes update speed eligibility only.
```

### UX tests

```text
Every band shows bits/sec.
Every band shows a standardised score.
Every band shows one status label.
Overall Transfer Score is separate from bits/sec.
Bottleneck language remains non-diagnostic.
```

## 22. Final design rule

The MFT-M layer should not merely train faster responding.

It should build a calibrated map of which signal-extraction wrappers the user can recover under change.

The compact rule is:

```text
bits/sec = extraction capacity

probe readiness = usable future dimensions

transfer metrics = portability across wrappers
```

The user sees five simple training bands.

The system stores a much richer map:

```text
Direction
Relative Direction
Features
Movement
Relative Movement

plus

colour readiness
spatial-frequency readiness
speed readiness
wrapper recovery
mixed-wrapper stability
delayed recovery
```

This makes the MFT-M layer the front-end calibration and transfer engine for the whole IQ Coach stack.

___

Yes. The key constraint is:

```text
The MFT-M / CCC layer cannot try to cover the whole A–E stimulus stack in one session.
```

If the full IQ Coach stack needs to fit into about **20 minutes**, the MFT-M layer should usually take **2.5–4 minutes**, with **5–6 minutes only in a CCC-focused session**.

The scoring notes already separate core bits/sec, probe readiness and transfer metrics, which makes this feasible: each session only needs a small number of core trials plus a small probe or re-check, rather than full calibration of every wrapper every time. 

## Recommended 20-minute stack

A good default session would be:

| Block                         |      Time | Purpose                                                     |
| ----------------------------- | --------: | ----------------------------------------------------------- |
| **MFT-M / Attention Control** | **3 min** | CCC wrapper readiness, one primary band, one probe/re-check |
| **Relational Memory**         |   3.5 min | relation-token or edge-token n-back                         |
| **Binding Memory**            |   3.5 min | relation × colour/context n-back                            |
| **Path Prediction**           |     5 min | predictive graph stream + sparse probes                     |
| **Reasoning**                 |     3 min | explicit bridge from the same graph                         |
| **Result / routing screen**   |   1–2 min | update profile, show next focus                             |

Total:

```text
19–20 minutes
```

## MFT-M session constraint

For normal sessions, MFT-M should do:

```text
one primary CCC band
+ one secondary probe or delayed re-check
```

not all five bands.

Example 3-minute MFT-M block:

| Segment                  |      Time | Content                                            |
| ------------------------ | --------: | -------------------------------------------------- |
| Quick warm-up            | 20–30 sec | easy trials in current band                        |
| Primary mini-block       | 75–90 sec | core scored trials                                 |
| Mixed-wrapper mini-block | 45–60 sec | current wrapper + previous wrapper                 |
| Probe / delayed re-check | 30–45 sec | colour, spatial frequency, speed, or prior wrapper |
| Micro-summary            |    10 sec | silent backend update or quick transition          |

This gives roughly **70–100 trials**, depending on response speed and exposure timing. That is enough to update a rolling estimate, but not enough to fully validate a new wrapper from scratch.

## How the full CCC progression fits

The A–E progression should unfold **across sessions**, not within each session:

```text
A. Direction
B. Relative Direction
C. Features
D. Movement
E. Relative Movement
```

A 20-session first-pass arc could be:

| Sessions | CCC focus                                              |
| -------: | ------------------------------------------------------ |
|      1–3 | Direction                                              |
|      4–6 | Relative Direction                                     |
|     7–10 | Features                                               |
|    11–14 | Movement                                               |
|    15–18 | Relative Movement                                      |
|    19–20 | weakest bands, mixed-wrapper re-checks, delayed probes |

So the “20” refers to **20 sessions for first-pass stack coverage**, not 20 minutes for all wrappers.

## Practical rule

Use this constraint:

```text
Normal 20-min session:
MFT-M = 15–20% of total time

CCC-focused session:
MFT-M = 25–30% of total time

Benchmark session:
MFT-M = 20–25% of total time, but shorten later blocks
```

So:

```text
Normal: 3 min CCC
Focused: 5–6 min CCC
Benchmark: 4–5 min CCC
```

## What this means for generation

At session start, the scheduler should choose:

```text
1 primary CCC band
1 probe dimension
optional delayed re-check
```

Example:

```text
Session 8:
Primary band = Features
Core scored = Gabor orientation
Probe = spatial frequency
Delayed re-check = Relative Direction mixed
```

Then the graph games should use only the dimensions marked as ready or stretch.

## Bottom line

Yes — there should be a strict training-time constraint. For a 20-minute full-stack session, the MFT-M layer should be **brief, selective and rolling**:

```text
3 minutes per session
one band focus
one probe or re-check
no attempt to cover all wrappers
```

Across ~20 sessions, this can provide full first-pass coverage of the CCC stimulus stack while still leaving enough time for Relational Memory, Binding Memory, Path Prediction and Reasoning.

