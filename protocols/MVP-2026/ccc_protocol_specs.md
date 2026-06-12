# IQ Coach — CCC Layer (Component 1) MVP Specification

## Arrow-Based Adaptive Cognitive Control Capacity Layer

**Status:** Draft v0.1
**Product:** IQ Coach
**Layer:** Component 1 — Cognitive Control Capacity
**Purpose:** Build the first IQ Coach app layer: an adaptive, arrow-based, masked majority-direction task that estimates and trains absolute and polar/relational cognitive-control bandwidth in bits/sec.

## First MVP design: NO SPIRAL OR DIAGONAL STIMULI (this may be added later).

---

# 1. Core product decision

The MVP uses **arrows only**.

Do not use Gabor patches, optic flow, random-dot motion, moving stimuli, HRV, Zone states, flow-state labels or readiness routing in this layer.

The vector engine should be implemented generally enough that later components can reuse the geometry logic for Gabor or other perceptual stimuli, but the current MVP stimulus set is entirely arrow-based.

---

# 2. Core constructs

The app estimates two related cognitive-control capacity scores.

| Construct                    | Internal name   | User-facing name    | Meaning                                                                             |
| ---------------------------- | --------------- | ------------------- | ----------------------------------------------------------------------------------- |
| Absolute C-Control           | `C_abs`         | Direction Bandwidth | Capacity for extracting the majority absolute direction from a masked arrow display |
| Polar / relational C-Control | `C_rel`         | Frame Bandwidth     | Capacity for extracting the majority direction relative to a centre/frame           |
| Derived cost                 | `C_abs - C_rel` | Frame Cost          | Extra processing cost of using a relational reference frame                         |
| Recovery metric              | `W_recovery`    | Wrapper Recovery    | How quickly performance recovers after a wrapper switch                             |
| Mixed-wrapper score          | `C_mix`         | Flexible Bandwidth  | Performance when absolute and polar wrappers are mixed                              |

The app should always show bits/sec after each test, but should distinguish between:

```text
Today's estimate
Recent baseline
Confidence / reliability flag
```

Example user-facing result:

```text
Direction Bandwidth: 3.4 bits/sec
Frame Bandwidth: 2.7 bits/sec
Frame Cost: 0.7 bits/sec
Training band: Stretch
Timing quality: Good
```

---

# 3. Task families

There are two main exercises:

```text
Exercise A: Absolute Direction Bandwidth
Exercise R: Polar / Frame Bandwidth
```

Each exercise contains three wrappers.

---

## 3.1 Exercise A — Absolute Direction Bandwidth

**Core rule:**
The user judges the majority absolute screen direction.

**Stimulus:**
Five static arrows arranged around a central fixation point.

**Response:**
Two large buttons or keyboard keys.

**Mask:**
A diamond, square, or high-contrast polygon mask appears at each possible arrow location immediately after stimulus offset.

**Wrappers:**

| Wrapper    | Internal ID | Response mapping         | User prompt                                                 |
| ---------- | ----------- | ------------------------ | ----------------------------------------------------------- |
| Horizontal | `abs_lr`    | Left vs Right            | “Were most arrows pointing left or right?”                  |
| Vertical   | `abs_ud`    | Up vs Down               | “Were most arrows pointing up or down?”                     |
| Diagonal   | `abs_diag`  | Diagonal A vs Diagonal B | “Were most arrows pointing this diagonal or that diagonal?” |

Diagonal mapping should use opposing 180-degree pairs, for example:

```text
45° vs 225°
or
135° vs 315°
```

Use one diagonal pair first, then optionally add the other as a later perturbation.

---

## 3.2 Exercise R — Polar / Frame Bandwidth

**Core rule:**
The user judges the majority direction relative to a centre point.

**Stimulus:**
Five static arrows arranged around a central point. Arrows do not move.

**Response:**
Two large buttons or keyboard keys.

**Mask:**
Same mask logic as absolute task.

**Wrappers:**

| Wrapper             | Internal ID  | Response mapping           | User prompt                                                         |
| ------------------- | ------------ | -------------------------- | ------------------------------------------------------------------- |
| Radial              | `rel_inout`  | Out vs In                  | “Were most arrows pointing out or in?”                              |
| Tangential / Circle | `rel_cwccw`  | Clockwise vs Anticlockwise | “Were most arrows pointing around the circle to the right or left?” |
| Spiral              | `rel_spiral` | Spiral Out vs Spiral In    | “Were most arrows forming spiral-out or spiral-in?”                 |

For the user-facing copy, avoid over-technical labels during the task. Use:

```text
Out / In
Circle Right / Circle Left
Spiral Out / Spiral In
```

Internally, store:

```text
radial
tangential
spiral
```

---

# 4. Formal vector definitions

The vector engine should represent each arrow by:

```text
position: p_i = [x_i, y_i]
direction: v_i = unit vector
centre: c = [x_c, y_c]
```

For polar wrappers:

```text
r_i = unit vector from centre to item i
t_i = tangential unit vector at item i
v_i = arrow unit vector
```

## 4.1 Radial in/out

```text
OUT if dot(v_i, r_i) > 0
IN  if dot(v_i, r_i) < 0
```

## 4.2 Tangential clockwise/anticlockwise

Use the perpendicular vector to the radial vector.

```text
t_i = rotate90(r_i)
```

Then classify by the sign of:

```text
dot(v_i, t_i)
```

Depending on screen coordinate convention, confirm the sign mapping empirically:

```text
positive = clockwise
negative = anticlockwise
```

or vice versa.

The implementation must include a unit test confirming the screen-coordinate mapping.

## 4.3 Spiral out/in

A spiral arrow combines radial and tangential components.

```text
spiral_out_right = normalise(+r_i + k t_i)
spiral_in_left   = normalise(-r_i - k t_i)
```

Use:

```text
k = 0.5
```

for MVP unless visual testing suggests a clearer angle is needed.

For the first implementation, use one clean opposite spiral pair:

```text
Spiral Out = outward + clockwise
Spiral In  = inward + anticlockwise
```

Later variants can counterbalance:

```text
outward + anticlockwise
inward + clockwise
```

But do not include both spiral conventions in the first MVP unless the tutorial is very clear.

---

# 5. Trial structure

Each trial follows the masked MFT-M-style sequence.

```text
fixation
→ arrow stimulus
→ mask
→ response window
→ feedback
→ inter-trial interval
```

Recommended initial timing:

| Element           |           MVP value | Notes                              |
| ----------------- | ------------------: | ---------------------------------- |
| Fixation          | 300–600 ms jittered | Keep user centred                  |
| Stimulus exposure |            adaptive | Frame-counted                      |
| Mask              |          300–500 ms | Same positions as arrows           |
| Response window   |        2000–2500 ms | Allow response after mask          |
| Feedback          |          150–300 ms | Red flash/error sound on incorrect |
| ITI               |          250–500 ms | Short, calm                        |

The original MFT-M used exposure-time manipulation and backward masking. The MVP should retain that logic but use adaptive trial selection rather than a fixed block schedule.

---

# 6. Stimulus layout

Use five arrows per trial.

Default spatial layout:

```text
8 possible positions arranged around an octagon
5 positions sampled per trial
central fixation point
small visual angle / compact radius
```

For polar tasks, the centre point is required.

For MVP:

```text
centre = screen centre
radius = fixed
arrow size = fixed
possible positions = 8
sampled positions per trial = 5
```

Do not jitter the centre in MVP. Centre jitter is a later perturbation.

---

# 7. Majority ratios

Use the five-arrow ratios from the five-arrow MFT-M version:

```text
5:0
4:1
3:2
```

Meaning:

| Ratio | Meaning                                 | Expected difficulty |
| ----- | --------------------------------------- | ------------------- |
| 5:0   | all arrows point to the target category | easiest / catch     |
| 4:1   | four target, one non-target             | medium              |
| 3:2   | three target, two non-target            | hardest             |

All wrappers must support the same ratio structure.

---

# 8. Adaptive CAT-style administration

The MVP should not use the original fixed MFT-M block schedule.

It should use an adaptive variant inspired by computerised adaptive testing.

## 8.1 Adaptive principle

At each mini-block or trial-selection step, choose the next condition that is expected to be most informative about the user’s current capacity estimate.

Each condition is defined by:

```text
wrapper
ratio
exposure_ms
mask_ms
set_size
response_deadline
```

For MVP, set size remains fixed at 5.

The adaptive engine varies:

```text
wrapper
ratio
exposure time
```

and optionally:

```text
mask duration
response deadline
```

## 8.2 Capacity estimate

Each user has a fitted capacity parameter for each exercise/wrapper.

```text
theta_abs_lr
theta_abs_ud
theta_abs_diag
theta_rel_inout
theta_rel_cwccw
theta_rel_spiral
theta_abs_overall
theta_rel_overall
```

The core score is estimated in bits/sec:

```text
C = H_condition / ET_adjusted
```

The model should estimate:

```text
P(correct | C_user, H_condition, ET, wrapper)
```

A practical MVP psychometric form:

```text
P_correct = chance + usable_range * sigmoid(theta - D_trial)
```

where:

```text
chance = 0.5
usable_range = 1 - chance - lapse_rate
D_trial = H_condition / ET_adjusted + wrapper_cost
```

For each wrapper, estimate `theta` as the information rate where predicted accuracy reaches criterion.

Default criterion:

```text
75% correct
```

Training band:

```text
70–82% balanced accuracy
```

## 8.3 Condition information

Each candidate condition should have an estimated information value.

A simple MVP approximation:

```text
information_value(condition)
= uncertainty(theta_estimate)
× expected_discrimination(condition, theta_estimate)
× reliability_weight(condition)
```

Choose conditions near the user’s current threshold, because those trials are most informative.

Operationally:

```text
If current accuracy is high:
    select harder ratio or shorter exposure

If current accuracy is low:
    select easier ratio or longer exposure

If estimate is unstable:
    select a condition near current threshold with high reliability

If timing quality is poor:
    avoid very short exposures and flag result
```

## 8.4 Stopping rule

Stop a test when either:

```text
minimum_trials completed AND estimate_SE below threshold
```

or:

```text
maximum_trials reached
```

Recommended MVP values:

| Test type     | Minimum trials | Maximum trials |
| ------------- | -------------: | -------------: |
| Quick test    |             36 |             72 |
| Standard test |             72 |            144 |
| Calibration   |            144 |            216 |

Show bits/sec after every test, but include a reliability flag:

```text
High confidence
Moderate confidence
Still calibrating
Timing limited
```

---

# 9. Information-rate computation

The scoring service must support condition-level entropy values.

## 9.1 Starting entropy table

Use the established MFT-M grouping-search entropy values for absolute five-arrow ratios as the starting point:

| Ratio | Entropy label | Initial H value |
| ----- | ------------: | --------------: |
| 5:0   |           low |       1.58 bits |
| 4:1   |        medium |       2.91 bits |
| 3:2   |          high |       4.91 bits |

These values should be stored in a configurable table, not hard-coded into the scoring logic.

## 9.2 Relative/polar entropy adjustment

For polar tasks, use the same ratio entropy as the starting `H_majority`, then add or fit a wrapper transform cost.

MVP formula:

```text
D_trial = H_majority / ET_adjusted + wrapper_cost
```

where:

```text
wrapper_cost(abs_lr) = 0
wrapper_cost(abs_ud) = fitted
wrapper_cost(abs_diag) = fitted
wrapper_cost(rel_inout) = fitted
wrapper_cost(rel_cwccw) = fitted
wrapper_cost(rel_spiral) = fitted
```

Do not assume `rel_inout`, `rel_cwccw`, and `rel_spiral` have identical entropy. They share the same majority structure, but they add different transformation demands.

The app should learn these costs empirically.

## 9.3 Adjusted exposure time

Use frame-counted timing.

```text
ET_adjusted = actual_frames_displayed / refresh_rate_estimate
```

If frame timing is unreliable:

```text
flag trial as timing_contaminated
exclude from high-confidence capacity fit
retain for rough training history
```

---

# 10. Feedback design

The MVP should include immediate error feedback.

## 10.1 Correct feedback

Use subtle positive feedback:

```text
small green/blue pulse
soft click
brief button highlight
```

## 10.2 Incorrect feedback

Use:

```text
brief red flash
short error sound
small shake or pulse
```

Keep feedback short and non-punitive.

Recommended:

```text
red flash: 150–250 ms
error sound: 80–150 ms
volume: low
```

Allow users to disable sounds.

Feedback should not reveal technical scores during the task.

Do not show:

```text
accuracy
bits/sec
current threshold
condition entropy
trial difficulty
```

during the active block.

---

# 11. Horizontal wrapper cycle

The app should implement wrapper swaps within each exercise using a learning-curve rule.

There are separate cycles for:

```text
Absolute CCC
Relative / polar CCC
```

## 11.1 Absolute wrapper cycle

Progression:

```text
abs_lr
→ abs_ud
→ mix(abs_lr, abs_ud)
→ abs_diag
→ mix(abs_lr, abs_ud, abs_diag)
```

## 11.2 Relative wrapper cycle

Progression:

```text
rel_inout
→ rel_cwccw
→ mix(rel_inout, rel_cwccw)
→ rel_spiral
→ mix(rel_inout, rel_cwccw, rel_spiral)
```

## 11.3 Learning-curve flattening

For each wrapper, maintain a rolling learning curve.

Track:

```text
capacity estimate
balanced accuracy
median RT
lapse rate
trial difficulty level
slope over recent mini-blocks
```

A wrapper is considered flattening when:

```text
slope_capacity over last K mini-blocks < slope_threshold
AND accuracy remains in or above training band
AND estimate confidence is acceptable
```

Suggested MVP values:

```text
K = 4 mini-blocks
slope_threshold = small positive value near zero
minimum_trials_per_wrapper = 80
minimum_sessions_per_wrapper = 1–2
```

Do not switch after a single good block.

## 11.4 Wrapper switch rule

When the current wrapper flattens:

```text
switch to next harder wrapper
hold ratio/exposure difficulty initially easier
expect a temporary dip
train until clear positive learning slope appears
```

A clear new learning curve is detected when:

```text
slope_capacity over recent mini-blocks > learning_slope_threshold
OR
balanced accuracy improves across two consecutive mini-blocks at same/harder demand
```

Then:

```text
continue training new wrapper until flattening begins
mix old + new wrappers
```

## 11.5 Mixed-wrapper rule

When a new wrapper shows recovery, begin mixed blocks.

Example:

```text
70% new wrapper
30% previous wrapper
```

Then:

```text
50/50 old/new
```

Then:

```text
random mixed presentation
```

A mixed block tests whether the majority operation is portable rather than wrapper-bound.

## 11.6 Repeat cycle

When mixed performance flattens:

```text
introduce next wrapper
repeat dip → recovery → mix
```

This is the MVP implementation of horizontal transfer.

---

# 12. App screens

## 12.1 Component home

Title:

```text
Cognitive Bandwidth
```

Subtitle:

```text
Measure how quickly you can extract the main direction from brief arrow displays.
```

Buttons:

```text
Start Direction Test
Start Frame Test
Continue Training
View Results
```

## 12.2 Exercise selection

Cards:

```text
Direction Bandwidth
Left/right, up/down and diagonal majority direction.

Frame Bandwidth
In/out, circle direction and spiral direction relative to a centre.
```

## 12.3 Tutorial: absolute

Example copy:

```text
You will see five arrows very briefly.
Choose the direction most arrows were pointing.
The display will be masked, so respond from your first clear impression.
```

## 12.4 Tutorial: radial

Example copy:

```text
Now judge direction relative to the centre.
Out means the arrow points away from the centre.
In means the arrow points towards the centre.
```

## 12.5 Tutorial: circle

Example copy:

```text
The arrows are still static.
Judge which way most arrows point around the circle.
Circle Right means clockwise.
Circle Left means anticlockwise.
```

## 12.6 Tutorial: spiral

Example copy:

```text
A spiral arrow points partly around the circle and partly in or out.
Choose whether most arrows form Spiral Out or Spiral In.
```

## 12.7 Task screen

Must include:

```text
central stimulus area
large response buttons
subtle progress bar/ring
optional sound toggle
no visible score during trials
```

## 12.8 Result screen

Show after every test:

```text
Direction Bandwidth: X.X bits/sec
Frame Bandwidth: X.X bits/sec
Frame Cost: X.X bits/sec
Wrapper Recovery: improving / stable / still calibrating
Training band: easy / standard / stretch
Timing quality: good / acceptable / limited
```

Example copy:

```text
Your Direction Bandwidth today was 3.6 bits/sec.
Your Frame Bandwidth was 2.9 bits/sec.
The frame task added a 0.7 bits/sec cost.
Next: continue radial frame training until the curve flattens.
```

---

# 13. Data model

## 13.1 Tables

Minimum Supabase tables:

```text
ccontrol_sessions
ccontrol_blocks
ccontrol_trials
ccontrol_estimates
ccontrol_wrapper_states
ccontrol_adaptive_events
```

## 13.2 Trial fields

Each trial should log:

```text
id
user_id
session_id
block_id
trial_index
exercise_type              // absolute | relative
wrapper_id                 // abs_lr | abs_ud | abs_diag | rel_inout | rel_cwccw | rel_spiral
ratio                      // 5:0 | 4:1 | 3:2
majority_category
minority_category
arrow_positions_json
arrow_vectors_json
exposure_ms_requested
exposure_ms_actual
mask_ms
response_window_ms
response
correct_response
is_correct
rt_ms
feedback_type
sound_enabled
frame_count_expected
frame_count_observed
refresh_rate_estimate
timing_quality
timing_contaminated
created_at
```

## 13.3 Estimate fields

```text
id
user_id
session_id
exercise_type
wrapper_id
capacity_bps
capacity_se
confidence_label
n_trials
accuracy
balanced_accuracy
median_rt
lapse_rate
frame_cost_bps
wrapper_recovery_score
learning_curve_slope
training_band
created_at
```

## 13.4 Wrapper-state fields

```text
user_id
exercise_type
wrapper_id
status                     // locked | active | flattening | recovered | mixed | mastered
current_capacity_bps
recent_slope
recent_accuracy
recent_trials
next_wrapper_id
mixing_ratio
last_switched_at
created_at
updated_at
```

---

# 14. Adaptive engine functions

Required functions:

```text
generateTrial(userState, exerciseType)
selectNextCondition(userState, wrapperState)
estimateCapacity(trialHistory)
updateWrapperState(wrapperState, estimate)
detectFlattening(wrapperState)
detectRecovery(wrapperState)
chooseWrapperMix(exerciseState)
computeBitsPerSecond(condition, timing)
computeTimingQuality(frameLog)
```

---

# 15. Pseudocode: adaptive condition selection

```text
function selectNextCondition(userEstimate, wrapperState):

    if wrapperState.status == "new":
        choose easier exposure and ratio
        return condition

    candidateConditions = all conditions for active wrapper

    for each condition:
        compute predicted_correct
        compute information_value
        downweight if timing risk high
        downweight if condition recently overused

    choose condition with highest information_value

    if recent_accuracy > 0.85 for two mini-blocks:
        increase one demand dimension

    if recent_accuracy < 0.60:
        reduce one demand dimension

    return selected_condition
```

---

# 16. Pseudocode: horizontal cycle

```text
function updateHorizontalCycle(exerciseState):

    activeWrapper = exerciseState.activeWrapper

    if detectFlattening(activeWrapper):
        nextWrapper = getNextWrapper(activeWrapper)

        if nextWrapper exists:
            unlock(nextWrapper)
            setActiveWrapper(nextWrapper)
            initialiseEasierDemand(nextWrapper)
            markEvent("wrapper_switch")
            return

    if detectRecovery(activeWrapper) and hasPreviousWrapper(activeWrapper):
        beginMixedBlock(previousWrapper, activeWrapper)
        markEvent("wrapper_mix_started")
        return

    if detectFlattening(mixedWrapperSet):
        nextWrapper = getNextWrapper(mixedWrapperSet)

        if nextWrapper exists:
            unlock(nextWrapper)
            setActiveWrapper(nextWrapper)
            markEvent("next_wrapper_switch")
```

---

# 17. Scoring outputs

Always compute:

```text
C_abs_overall
C_rel_overall
C_abs_by_wrapper
C_rel_by_wrapper
Frame Cost
Frame Ratio
Wrapper Recovery
Timing Quality
Confidence Label
```

## 17.1 Overall absolute score

```text
C_abs_overall = weighted mean of active/mastered absolute wrapper capacities
```

Weights should depend on:

```text
trial count
confidence
recency
timing quality
```

## 17.2 Overall relative score

```text
C_rel_overall = weighted mean of active/mastered polar wrapper capacities
```

## 17.3 Frame Cost

```text
Frame Cost = C_abs_overall - C_rel_overall
```

If insufficient data:

```text
Frame Cost: still calibrating
```

## 17.4 Wrapper Recovery

```text
W_recovery = capacity_after_switch / capacity_before_switch
```

or:

```text
W_recovery = trials_to_return_to_90_percent_of_previous_wrapper_level
```

Use both internally.

---

# 18. MVP exclusions

Do not build in this layer:

```text
Gabor stimuli
optic flow
moving stimuli
HRV
Zone states
flow-state classification
criticality labels
SR horizon
working-memory n-back
reasoning transfer test
micro-missions
leaderboards
IQ increase claims
clinical claims
```

The only possible exception is the reusable vector-engine architecture, which should not be coupled to arrows so tightly that later Gabor/vector-like stimuli become hard to add.

---

# 19. Claims boundary

The app may say:

```text
This test estimates your Cognitive Bandwidth from brief masked arrow displays.
Direction Bandwidth measures absolute majority-direction control.
Frame Bandwidth measures majority-direction control relative to a centre or frame.
The app adapts trial difficulty to estimate your current bandwidth efficiently.
```

The app should not say:

```text
This is your IQ.
This proves your intelligence has increased.
This detects flow.
This diagnoses your brain state.
This measures neural criticality.
This guarantees far transfer.
```

---

# 20. Implementation priorities

## Build order

```text
1. Arrow vector renderer
2. Absolute left/right wrapper
3. Masked trial runner
4. Trial logging
5. Bits/sec scoring table
6. Adaptive condition selector
7. Result screen
8. Absolute vertical wrapper
9. Absolute diagonal wrapper
10. Horizontal-cycle controller for absolute wrappers
11. Relative in/out wrapper
12. Relative circle right/left wrapper
13. Relative spiral wrapper
14. Horizontal-cycle controller for relative wrappers
15. Mixed-wrapper blocks
16. Confidence and timing-quality flags
```

## Definition of done

A user can:

```text
start a Cognitive Bandwidth session
complete masked absolute arrow trials
receive a Direction Bandwidth bits/sec score
complete masked polar arrow trials
receive a Frame Bandwidth bits/sec score
see Frame Cost
receive immediate error feedback
progress through wrapper swaps based on learning-curve flattening
have all trials logged with timing-quality flags
resume training with the correct next wrapper/mix state
```

---

# 21. Key developer caution

The most important implementation risk is timing.

For all masked trials:

```text
use requestAnimationFrame
log actual frame counts
estimate refresh rate
avoid ultra-short exposures until timing is validated
flag dropped frames
exclude contaminated trials from high-confidence estimates
```

The second major risk is interpretability.

Do not pool all wrappers too early. Estimate wrappers separately first, then mix only after flattening and recovery. This preserves the distinction between:

```text
absolute direction control
polar frame control
wrapper recovery
flexible mixed-wrapper control
```

---

# 22. Final MVP summary

The first IQ Coach component is an adaptive, arrow-only, masked majority-direction capacity layer.

It contains:

```text
Absolute Direction Bandwidth:
left/right → up/down → diagonal → mixed

Polar Frame Bandwidth:
out/in → circle right/left → spiral out/in → mixed

Adaptive CAT-style trial selection:
condition chosen by expected information value near current threshold

Scoring:
bits/sec after every test
C_abs
C_rel
Frame Cost
Wrapper Recovery
confidence and timing-quality flags

Training logic:
train until learning curve flattens
switch wrapper
detect dip and renewed learning
mix wrappers
repeat
```

This gives IQ Coach a clean first measurement/training layer: not generic brain training, not a Zone Check, and not a Gabor/optic-flow system, but an adaptive arrow-based cognitive-control capacity engine.
