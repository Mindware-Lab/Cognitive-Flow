**Modified Gabor MFT-M: Relational Working Memory Capacity Spec**

## 1. Working construct

**Relational Working Memory Capacity (R-WMC)**, or more formally **Operational Relational Workspace Capacity**, is the capacity to:

> extract task-relevant features from noisy perceptual input, bind them into temporary feature relations, maintain and update those relations across short temporal horizons, resist lures, and use the resulting relational state for prediction or comparison.

This extends the MFT-M logic from **controlled evidence throughput** into **structured relational workspace over time**. The original MFT-M estimates CCC by manipulating information load and exposure time, with reported adult values around 3–4 bits/sec, while the adaptive MFT-M-R shows that CAT-style condition selection can make this estimation much shorter and still reliable. ([Nature][1]) The attached notes frame the same distinction: MFT-M CCC is a controlled perceptual evidence-throughput estimate, whereas the n-back extension becomes an active workspace / temporal relational capacity measure.  

## 2. Core task engine

The task uses a field of **Gabor patches** rather than arrows.

Each trial presents a randomised visual field:

```text
Gabor field:
- k patches
- random spatial locations
- one majority feature state
- minority / lure feature states
- brief exposure
- optional mask
- binary or multi-choice response
```

Each trial state is represented as:

```text
S_t = [θ_t, F_t, L_t]
```

where:

```text
θ = majority orientation / direction
F = majority spatial frequency / spacing
L = majority luminance / contrast
```

Example binning:

```text
orientation:        8 bins = 3 bits
spatial frequency:  4 bins = 2 bits
luminance/contrast: 4 bins = 2 bits
```

The task should keep locations random so the user cannot rely on fixed spatial positions. The relevant object is the **majority feature state**, not any individual patch.

## 3. Two-layer product role

The same engine supports two protocol wrappers.

| Wrapper                 | Function                                                            | Main output                                                 |
| ----------------------- | ------------------------------------------------------------------- | ----------------------------------------------------------- |
| **Zone / CCC mode**     | Estimate current controlled evidence throughput and state-readiness | C-Control, speed/accuracy stability, lapse/drift indicators |
| **R-WMC training mode** | Train relational workspace over time                                | A-Bind, R-Bind, S-Horizon, lure control, wrapper recovery   |

So the architecture is:

```text
same Gabor majority engine
→ Zone estimate layer
→ relational WM training layer
→ later puzzle/meta-epistemic transfer layer
```

## 4. Task modes

### Mode 0: Straight Gabor MFT-M / Zone block

Purpose: estimate current **controlled evidence throughput**.

User task:

```text
Which feature is in the majority?
```

or:

```text
Is the majority direction left/right?
Is the majority spacing high/low?
Is the majority contrast bright/dim?
```

Adaptive variables:

```text
exposure time
majority ratio
set size
mask strength
feature discrimination gap
```

Primary data:

```text
accuracy
RT
lapses / timeouts
RT variability
post-error recovery
speed–accuracy profile
within-session state drift
```

This block enables later Zone estimates, but the final Zone classification logic can be defined separately.

---

### Mode 1: Majority state n-back

Purpose: basic temporal maintenance of a presemantic feature state.

Example:

```text
Is the current majority orientation the same as 1-back?
```

Progression:

```text
1-back θ
1-back F
1-back L
2-back θ
2-back cued feature
```

Measures:

```text
feature-state maintenance
basic updating
majority extraction under memory load
```

---

### Mode 2: Arbitrary association binding

Purpose: temporary hippocampal-style feature binding.

Example:

```text
Was this orientation previously paired with this spacing?
```

Relation:

```text
θ ↔ F
θ ↔ L
F ↔ L
θ ↔ F ↔ L
```

Demand estimate:

```text
H_binding = log2(|D1| × |D2| × ... × |Dm|)
binding load = H_binding × n
```

Example:

```text
θ has 8 bins = 3 bits
F has 4 bins = 2 bits

H_binding = 5 bits

2-back θ↔F = 10 binding-bit steps
```

Output:

```text
A-Bind = highest binding-bit-step load sustained at criterion accuracy
```

---

### Mode 3: Relational transformation binding

Purpose: track **change relations** rather than feature identities.

Example:

```text
Did the majority orientation change in the same way as before?
```

State relation:

```text
R_t = S_t - S_{t-n}
```

Single-feature example:

```text
Δθ = current orientation - previous orientation
```

Multi-feature example:

```text
R_t = [Δθ, ΔF]
```

Demand estimate:

```text
H_relation = log2(|Δθ| × |ΔF| × |ΔL|)
relation load = H_relation × n × A_m
```

where:

```text
A_m = arity weight
m = number of jointly integrated variables
```

Output:

```text
R-Bind = highest transformation-relation load sustained at criterion accuracy
```

This is the most important bridge to later puzzle/problem-space reasoning.

---

### Mode 4: Successor / path horizon mode

Purpose: SR-inspired short-horizon predictive mapping.

Example:

```text
Given this pattern path, is the next pattern expected?
```

or:

```text
Can this state still lead to the target pattern?
```

Core object:

```text
P(S_{t+h} | S_t)
```

Demand estimate:

```text
SR surprisal = -log2 P(S_{t+h} | S_t)
```

Output:

```text
S-Horizon = maximum successor/path information sustained at criterion accuracy
```

This should be described carefully as **SR-inspired behavioural training**, not as a direct hippocampal SR measurement.

## 5. Core adaptive variables

| Variable               | Role                                        | Primary use                                   |
| ---------------------- | ------------------------------------------- | --------------------------------------------- |
| **Exposure time**      | Increases bits/sec demand                   | Zone block and robustness testing             |
| **Discrimination gap** | Makes θ/F/L harder to distinguish           | Variable abstraction and perceptual precision |
| **Majority ratio**     | Increases conflict/uncertainty              | CCC-like evidence control                     |
| **n-back level**       | Extends temporal horizon                    | Workspace load                                |
| **Relation arity**     | Increases number of variables jointly bound | Relational complexity                         |
| **Lure pressure**      | Adds recent-but-wrong states or pairings    | Interference control                          |
| **Wrapper variation**  | Changes surface without changing invariant  | Horizontal transfer                           |
| **Delay**              | Re-tests after time/sleep                   | Consolidation candidate                       |

Design rule:

```text
Primary target = stable relational control
Secondary stressors = speed and discrimination
```

Speed and discrimination should test robustness after the relation is stable, not swamp the relation too early.

## 6. Measurement model

A simple trial-demand model:

```text
D_i =
C_i + B_i + R_i + S_i + I_i
```

where:

```text
C_i = H_extract / ET
B_i = H_binding × n × A_m
R_i = H_relation × h × A_m
S_i = -log2 P(S_{t+h} | S_t)
I_i = lure pressure
```

Fit performance with:

```text
P(correct) =
guess + (1 - guess - lapse) × sigmoid(θ_person - D_i)
```

The core research score:

```text
R-WMC = fitted relational demand threshold
```

Example thresholds:

```text
R-WMC70 = demand level at 70% balanced accuracy
R-WMC75 = demand level at 75% balanced accuracy
R-WMC80 = demand level at 80% balanced accuracy
```

Use **balanced accuracy**, not raw accuracy, because same/different and lure distributions can otherwise bias the score.

## 7. Main sub-scores

| Sub-score      | Meaning                                 | Unit                           |
| -------------- | --------------------------------------- | ------------------------------ |
| **C-Control**  | CCC-like controlled evidence throughput | bits/sec                       |
| **D-Disc**     | feature discrimination threshold        | JND / slope                    |
| **A-Bind**     | arbitrary feature-binding capacity      | binding-bit steps              |
| **R-Bind**     | transformation-relation capacity        | relation-bit steps             |
| **S-Horizon**  | successor/path horizon capacity         | SR-bit steps                   |
| **I-Control**  | lure/interference resistance            | false-alarm cost / d′          |
| **W-Recovery** | wrapper-swap recovery                   | transfer cost / recovery slope |

Optional composite:

```text
R-WMC composite =
z(A-Bind)
+ z(R-Bind)
+ z(S-Horizon)
+ z(I-Control)
- z(wrapper-swap cost)
```

For research, the sub-scores are more important than the composite.

## 8. Zone-enabling data

The task should log enough data to support Zone Coach classification later.

Minimum Zone-relevant features:

```text
C-Control estimate
accuracy by exposure-time band
accuracy by discrimination gap
RT median
RT variability
lapse / timeout rate
post-error slowing or recovery
within-session drift
speed–accuracy instability
performance drop after perturbation
recovery after easier reset trials
```

Possible later Zone outputs:

```text
In Range
Flat
Rigid
Scattered
Overloaded
Recovering
```

But those state labels should be calibrated later against repeated-session data, subjective state checks, and possibly external performance outcomes.

## 9. Training session structure

A 10–15 minute session:

```text
0:00–1:00
orientation / readiness instruction

1:00–3:00
Zone / straight Gabor MFT-M block

3:00–6:00
feature discrimination and majority extraction

6:00–10:00
n-back state / association / relation block

10:00–12:00
wrapper perturbation or lure block

12:00–14:00
meta-epistemic prompt bridge

14:00–15:00
implementation cue or delayed-probe setup
```

## 10. Training progression

Minimal 10-day arc:

| Day | Focus                                            | Internal target                 |
| --: | ------------------------------------------------ | ------------------------------- |
|   1 | Straight Gabor MFT-M                             | C-Control baseline              |
|   2 | Orientation / spacing / luminance discrimination | D-Disc                          |
|   3 | 1-back majority state                            | state maintenance               |
|   4 | 1-back θ↔F association                           | A-Bind                          |
|   5 | 2-back association                               | temporal binding                |
|   6 | 1-back same-change relation                      | R-Bind entry                    |
|   7 | 2-back transformation                            | relational horizon              |
|   8 | Wrapper swap                                     | horizontal transfer             |
|   9 | successor/path prediction                        | S-Horizon                       |
|  10 | mixed delayed probe                              | consolidation / transfer signal |

Preferred 20-day arc:

```text
Days 1–4:
calibrate bandwidth and discrimination

Days 5–8:
build arbitrary binding

Days 9–12:
build relational transformation tracking

Days 13–16:
force wrapper portability and breakpoint recovery

Days 17–20:
train successor horizon, prompts and delayed transfer probes
```

## 11. Adaptive control rule

Use near-critical training rather than a simple staircase.

```text
Target band:
70–82% balanced accuracy
RT stable
lure errors controlled

If >85% for two mini-blocks:
increase one variable only.

If 60–70%:
hold level and repeat with minor wrapper variation.

If <60%:
reduce exposure pressure, widen discrimination gap, or lower n/arity.

If stable for 2–3 blocks:
change wrapper, feature dimension, or relation type to prevent surface-specific automation.
```

This keeps the task in a training band rather than collapsing into either boredom or guessing.

## 12. Data schema

Minimum trial row:

```text
trial_id
user_id
session_id
date_time
mode
block_id
stimulus_seed

set_size
majority_ratio
patch_locations_randomised

theta_majority
frequency_majority
luminance_majority

theta_bins
frequency_bins
luminance_bins

exposure_time_ms
mask_type
mask_duration_ms
response_window_ms

n_level
relation_mode
relation_arity
binding_type
successor_horizon
lure_type
wrapper_id

target_answer
user_answer
correct
rt_ms
timeout
post_error_trial
dropped_frame_flag
device_refresh_rate
screen_size_estimate
```

This supports both product analytics and future cognitive-science validation.

## 13. User-facing layer

Avoid exposing technical labels too early.

| Research construct | User-facing label   |
| ------------------ | ------------------- |
| C-Control          | Cognitive Bandwidth |
| D-Disc             | Signal Clarity      |
| A-Bind             | Pattern Pairing     |
| R-Bind             | Change Tracking     |
| S-Horizon          | Path Prediction     |
| I-Control          | Lure Resistance     |
| W-Recovery         | Reset Recovery      |
| R-WMC              | Active Workspace    |

## 14. Claim boundary

Safe claim:

> This task measures and trains controlled evidence extraction, feature discrimination, temporary feature binding, relational updating, lure resistance and short-horizon path prediction under adaptive perceptual and memory demands.

Avoid for now:

```text
raises IQ
directly measures hippocampal SR
objectively measures flow
diagnoses cognitive impairment
guarantees far transfer
```

Research hypothesis:

> R-WMC should predict unique variance in puzzle efficiency, relational reasoning, decision consistency, learning rate and wrapper-swap recovery above and beyond straight CCC.

## 15. Compressed architecture

```text
Gabor MFT-M engine
→ C-Control / Zone-ready evidence throughput
→ feature discrimination
→ majority state n-back
→ arbitrary association binding
→ relational transformation binding
→ successor/path horizon
→ wrapper perturbation
→ delayed probe
→ puzzle + meta-epistemic prompt layer
```

## 16. MVP scope

First build only:

```text
1. Gabor majority discrimination
2. adaptive exposure time
3. orientation and spatial-frequency dimensions
4. 1-back majority state
5. 1-back θ↔F binding
6. basic lure trials
7. full trial logging
8. provisional C-Control, A-Bind and R-Bind outputs
```

Defer:

```text
full SR horizon mode
multi-day adaptive model fitting
formal Zone classifier
public claims about transfer
clinical or educational outcome claims
```

That gives a clean first implementation: one shared engine, usable for Zone-style readiness estimation and as the lower-level R-WMC training substrate before the later puzzle/meta-epistemic transfer layer.

---

#Far Transfer Principles


**The modified Gabor MFT-M / R-WMC protocol can adopt the far-transfer principles**, but with a clear distinction:

> **The Gabor R-WMC task is the lower-to-middle transfer engine. It trains state access, variable abstraction, controlled evidence extraction, WM binding, relational updating and SR-style path tracking. Full far transfer only emerges when this is linked to wrapper swaps, puzzle/problem-space application, prompts, implementation cues, niche feedback and delayed probes.**

That is very consistent with the attached transfer theory, which states that far transfer is not produced by repeating a task, but by maintaining trainable Ψ-band access, constructing variables, tuning predictive relational maps, perturbing wrappers near asymptote, validating portability, integrating across cognitive layers, coupling to real-world cues and allowing consolidation into slow schematic Gc. 

## How the R-WMC protocol maps onto far-transfer principles

| Far-transfer principle          | How the Gabor R-WMC task implements it                                                                                          | Status                |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | --------------------- |
| **Ψ-band access**               | Zone / CCC block estimates whether the user is in a trainable performance band rather than overloaded, flat or scattered.       | Core                  |
| **Entropy–MI balance**          | Adaptive exposure time, majority ratio and discrimination gap create uncertainty, while the task goal keeps search constrained. | Core                  |
| **Variable abstraction**        | Orientation, spatial frequency and luminance/contrast force the learner to identify which variable matters.                     | Core                  |
| **WM variable binding**         | n-back state, arbitrary association and feature-pair binding require temporary relational maintenance.                          | Core                  |
| **SR-style relational mapping** | Transformation and successor/path modes move from “what is this?” to “what changes?” and “what follows?”.                       | Core                  |
| **Breakpoint perturbation**     | Wrapper changes, feature swaps, lure blocks and sudden surface changes after stability prevent brittle surface automation.      | Needed explicitly     |
| **Horizontal transfer**         | Same relation is tested across changed Gabor layouts, density, colour, noise, feature dimension and timing.                     | Strong if designed in |
| **Vertical transfer**           | Lower-level relational skill is linked to prompts such as “Which feature changed?” or “Can this path still reach the goal?”.    | Needs prompt layer    |
| **Niche transfer**              | Later puzzle tasks and real-world micro-prompts test whether the control policy activates outside the perceptual task.          | Needs extra layer     |
| **Delayed consolidation**       | Delayed re-checks, next-day probes and return tests assess whether the structure survives after time/sleep.                     | Needs scheduling      |

## The key point

The Gabor task should not be treated as far transfer by itself. On its own, it is still a controlled perceptual/WM training task. It becomes far-transfer-aligned when it is embedded in this sequence:

```text
Zone / CCC readiness
→ variable discrimination
→ majority-state n-back
→ arbitrary binding
→ relational transformation tracking
→ successor/path prediction
→ wrapper perturbation
→ puzzle/problem-space transfer
→ meta-epistemic prompt
→ implementation cue
→ delayed probe
```

That sequence maps closely onto the transfer theory’s hierarchy:

```text
discrimination builds variables
WM binds variables
SR training learns transitions over variables
boundary testing validates the relation
slow Gc extracts the invariant
```

The attached theory specifically emphasises that variable abstraction must come before SR inference, because the system first has to carve the surface into usable dimensions before relational transfer can occur. 

## What the protocol already does well

The modified Gabor MFT-M is especially strong for the **lower transfer stack**:

```text
controlled evidence extraction
+ feature discrimination
+ temporary binding
+ relational updating
+ lure resistance
+ speed/discrimination robustness
```

That means it is not just “n-back with patches”. It becomes a presemantic relational workspace task that prepares the learner for later explicit problem-space reasoning.

Its strongest far-transfer-relevant move is this:

```text
surface feature
→ abstract variable
→ bound relation
→ transformation
→ successor path
```

That is exactly the kind of structure needed before moving into puzzles and meta-epistemic prompts.

## What must be added for full Trident-G transfer

To fully adopt the far-transfer protocol, I would add five explicit design requirements.

### 1. Wrapper swaps

Do not keep the same Gabor surface too stable.

Use:

```text
layout changes
patch density changes
colour/contrast theme changes
orientation-to-spacing swaps
noise/mask changes
new response mappings
```

But preserve the same underlying relation.

The test is:

```text
Can the user recover the same relation when the surface changes?
```

### 2. Breakpoint days / blocks

After the user stabilises, perturb the task before surface automation hardens.

Example:

```text
stable on θ↔F binding
→ switch to F↔L binding
→ preserve same association logic
→ look for dip-and-recovery
```

The transfer theory treats this dip-and-recovery as important because it suggests re-entry into the Ψ-band rather than mere repetition of a surface routine. 

### 3. Prompt bridge

After the perceptual task, give one compact global-workspace prompt:

```text
Which feature changed?
What belongs with what?
What relation stayed the same?
Can this path still reach the goal?
What is tempting but wrong?
```

This maps the implicit operation onto a language-accessible control handle. The attached theory describes prompts as compact control policies that coordinate attention, WM binding, SR search and action, rather than as intelligence itself. 

### 4. Puzzle handoff

After the R-WMC block, use a short puzzle/problem-space task that calls on the same operation.

Example mapping:

| R-WMC operation         | Puzzle handoff                                       |
| ----------------------- | ---------------------------------------------------- |
| Feature discrimination  | Identify the relevant variable in a puzzle state     |
| Arbitrary binding       | Track which rule belongs to which object             |
| Transformation tracking | Detect what changed after a move                     |
| SR path horizon         | Ask whether a current state can still reach the goal |
| Lure resistance         | Identify the tempting but invalid move               |

This is where the protocol moves from presemantic relational control to explicit problem-solving.

### 5. Delayed probe

Retest the same invariant later:

```text
same day delayed probe
next-session return test
untrained wrapper
brief puzzle transfer task
```

Without delay, you mainly have performance gain. With delayed survival, you begin testing slow schematic Gc candidates.

## Compressed conclusion

Yes — the protocol is far-transfer-aligned if designed as:

```text
Gabor MFT-M / Zone block
= state and evidence-control gate

Relational WM block
= variable binding and SR-style relational workspace training

Wrapper perturbation
= horizontal transfer test

Prompt bridge
= vertical transfer handle

Puzzle handoff
= explicit problem-space deployment

Implementation cue / delayed probe
= niche and consolidation test
```

## 2. Optic Flow CCC & RWMC

An **optic-flow version** would be a very natural horizontal wrapper for the Gabor R-WMC task.

The Gabor version trains majority extraction over relatively static feature dimensions:

```text
orientation / direction
spatial frequency / spacing
luminance / contrast
```

An optic-flow wrapper would train the same abstract operations, but over **dynamic motion-field variables**:

```text
local motion direction
radial expansion / contraction
rotation
translation
speed
heading / focus-of-expansion location
motion coherence
```

That is useful because it tests whether the learner has acquired the deeper invariant:

```text
extract majority state
→ bind feature relations
→ update over time
→ track transformations
→ resist lures
→ recover the same rule under a new surface
```

rather than simply becoming skilled at static Gabor patch patterns. This fits the Trident-G horizontal-transfer principle: the same relational invariant should survive changed wrappers, boundary cases and delayed re-checks. 

## Why optic flow is a good wrapper

Optic flow is already a standard way of studying global motion perception, self-motion and heading judgement. Random-dot kinematograms are commonly used to manipulate global motion coherence, where some elements carry signal motion and others act as noise. ([Frontiers][1]) Studies also use radial optic-flow displays to measure expansion/contraction discrimination and motion coherence thresholds, which is directly analogous to your majority-function logic. ([ScienceDirect][2])

So the optic-flow wrapper gives you a principled dynamic equivalent of the Gabor majority task:

```text
Gabor majority:
Which static feature dominates?

Optic-flow majority:
Which motion-flow pattern dominates?
```

## Basic design

Instead of Gabor patches, show multiple small **motion apertures/windows** at random screen locations.

Each aperture contains a mini random-dot or texture-flow field.

Example trial:

```text
12 small windows appear at random locations.

Majority windows:
radial expansion

Minority / lure windows:
radial contraction or rotation

User response:
What is the majority flow type?
```

The windows should be randomly located each trial, so the user cannot rely on fixed positions. The task object becomes the **population-level motion relation**, not “the top-left patch”.

## Candidate optic-flow variables

| Variable                     | Example values                                                                      | Use                           |
| ---------------------------- | ----------------------------------------------------------------------------------- | ----------------------------- |
| **Flow type**                | expansion, contraction, clockwise rotation, counter-clockwise rotation, translation | primary majority feature      |
| **Heading / focus location** | centre, left, right, upper, lower                                                   | SR / path-like wrapper        |
| **Speed**                    | slow, medium, fast                                                                  | discrimination and difficulty |
| **Coherence**                | 80%, 60%, 40%, etc.                                                                 | signal-to-noise manipulation  |
| **Aperture count**           | 5, 7, 9, 12 windows                                                                 | set-size / sampling load      |
| **Aperture lifetime**        | brief vs stable windows                                                             | temporal evidence pressure    |
| **Noise motion**             | random direction, opposite flow, lure flow                                          | interference control          |

This gives you the optic-flow equivalents of the Gabor levers:

```text
Gabor orientation gap      → motion direction / heading gap
Gabor majority ratio       → flow coherence / majority-window ratio
Gabor exposure time        → motion duration
Gabor luminance/contrast   → dot contrast / coherence / speed
Gabor relation tracking    → flow transition tracking
```

## Majority-function optic-flow block

This would be the Zone-compatible version.

User task:

```text
Which flow pattern is in the majority?
```

Examples:

```text
expanding vs contracting
clockwise vs counter-clockwise
leftward vs rightward translation
centre-expansion vs off-centre expansion
```

Adaptive variables:

```text
exposure duration
motion coherence
number of windows
majority ratio
speed difference
mask / post-motion noise
```

Possible internal output:

```text
Motion-Control Capacity
= controlled extraction of global motion majority under time/noise pressure
```

I would not call this CCC in the strict original sense yet. It would be an **optic-flow CCC analogue** until validated against the original MFT-M.

## WM / n-back variants

Once the majority-flow task works, it can extend into the same R-WMC ladder.

### 1. Flow-state n-back

```text
Was the current majority flow type the same as 1-back?
```

Example:

```text
Trial t-1: expansion
Trial t: expansion
Answer: same
```

Measures:

```text
dynamic feature-state maintenance
motion-field majority extraction
updating under motion noise
```

### 2. Arbitrary association binding

Bind a motion variable to another feature.

```text
Was this flow type previously paired with this speed?
```

or:

```text
Was this expansion pattern previously paired with this aperture colour?
```

Internal relation:

```text
flow type ↔ speed
flow type ↔ heading location
flow type ↔ colour/context cue
```

This gives the optic-flow equivalent of:

```text
θ ↔ F
```

in the Gabor version.

### 3. Relational transformation n-back

Track changes in flow patterns:

```text
Did the majority flow change in the same way as before?
```

Example:

```text
expansion → contraction
then
clockwise rotation → counter-clockwise rotation
```

The user judges whether the **relation** is the same:

```text
opposite-flow transformation
same-change
different-change
directional shift
```

This is closer to the transfer target than simply remembering “expansion”.

### 4. SR / path-horizon mode

This is where optic flow becomes especially interesting.

Because optic flow naturally implies self-motion, path, heading and reachable states, you can ask:

```text
Given this flow path, is the next motion state expected?
```

or:

```text
Can this heading still reach the target?
```

This connects nicely to successor-representation style training:

```text
current motion state
→ likely next motion state
→ reachable path
→ predicted consequence
```

Optic flow has been used in human and animal sensory-evidence tasks involving navigation to remembered locations, which makes it a plausible wrapper for path-like evidence accumulation and prediction. ([Journal of Neuroscience][3])

## Why small windows are a good idea

Using arbitrary small windows helps preserve the majority-function structure:

```text
many local samples
→ extract dominant relation
→ ignore minority/lure samples
```

If you use one full-field optic-flow display, the task becomes more like standard heading perception. That is useful, but less directly analogous to MFT-M majority sampling.

Small windows let you keep the MFT-M logic:

```text
sample multiple elements
find the dominant feature/relation
respond before evidence disappears
```

A good starting version would be:

```text
9 apertures
5 majority flow
4 lure flow
750 ms duration
binary response
random aperture positions
```

Then adapt:

```text
9 apertures → 12 apertures
5:4 majority → 7:5 majority
750 ms → 500 ms → 250 ms
high coherence → lower coherence
single flow dimension → flow + speed binding
```

## How it supports horizontal transfer

The key is to preserve the **same abstract training operation** while changing the surface.

| Gabor wrapper            | Optic-flow wrapper        | Invariant                 |
| ------------------------ | ------------------------- | ------------------------- |
| majority orientation     | majority flow type        | extract dominant variable |
| orientation-spacing pair | flow-speed pair           | arbitrary binding         |
| orientation change       | flow transformation       | relational update         |
| Gabor path               | optic-flow path           | successor horizon         |
| minority patches         | lure-flow windows         | interference control      |
| new layout               | new aperture distribution | wrapper recovery          |

So a horizontal-transfer probe could be:

```text
Train:
Gabor θ↔F binding

Probe:
optic-flow type↔speed binding

Question:
Does the user recover the same binding operation under a new dynamic wrapper?
```

That is a much stronger transfer test than simply using more Gabor variants.

## Main cautions

The optic-flow version will be more visually demanding, so I would treat it as a later wrapper, not the first MVP.

Key confounds:

```text
motion sensitivity
screen refresh rate
device performance
vestibular/motion discomfort
low-level visual acuity
contrast sensitivity
speed perception
motion coherence threshold
```

Also, optic flow may engage more dorsal-stream/global-motion processing than the static Gabor task. That is useful, but it means poor performance could reflect motion-processing limitations rather than relational workspace limitations. There is evidence that optic-flow/global motion tasks are sensitive to visual motion processing differences across groups and development, so calibration matters. ([PMC][4])

## Best implementation path

I would sequence it like this:

```text
Phase 1:
Gabor R-WMC engine
static majority + binding + relation modes

Phase 2:
Optic-flow majority block
flow type, speed, coherence, exposure time

Phase 3:
Optic-flow n-back
flow-state and flow-speed binding

Phase 4:
Optic-flow relational mode
same-change / opposite-change / heading-shift relations

Phase 5:
Cross-wrapper probes
Gabor relation → optic-flow relation
optic-flow relation → puzzle relation
```

## Bottom line

An optic-flow version is a strong horizontal wrapper.

The clean formulation is:

> **The optic-flow wrapper tests whether the same majority extraction, binding, relational updating and successor-horizon operations survive when the perceptual surface changes from static Gabor feature fields to dynamic motion-flow fields.**

That makes it valuable for far transfer because it prevents the system from becoming merely “good at Gabor patches”. It gives you a dynamic, motion-based wrapper for testing whether the deeper relational workspace operation is actually portable.

[1]: https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2014.00583/full?utm_source=chatgpt.com "Global processing in amblyopia: a review"
[2]: https://www.sciencedirect.com/science/article/pii/S0042698915000942?utm_source=chatgpt.com "Development of radial optic flow pattern sensitivity at ..."
[3]: https://www.jneurosci.org/content/42/27/5451?utm_source=chatgpt.com "Sensory Evidence Accumulation Using Optic Flow in a ..."
[4]: https://pmc.ncbi.nlm.nih.gov/articles/PMC3061234/?utm_source=chatgpt.com "Distinct Visual Motion Processing Impairments In Aging and ..."


The safe claim is:

> **The modified Gabor MFT-M R-WMC protocol implements the lower and middle layers of the Trident-G far-transfer architecture: Ψ-band gating, variable abstraction, relational binding, SR-style transition tracking, wrapper perturbation and delayed portability testing. Full far-transfer claims require the added puzzle, prompt, implementation and niche-validation layers.**
