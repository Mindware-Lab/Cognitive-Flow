# IQ Coach — C-Control and Relational Working-Memory Protocol Specification

*High-level design: adapted MFT-M entry-capacity task + Gabor and optic-flow relational engine*  
**Status:** revised protocol architecture  
**Purpose:** rewrite the working-memory protocol so that the adapted/adaptive MFT-M is treated as a trainable entry-layer intelligence measure, not as a state/zone classifier.

---

## 0. Core refactor

The adapted MFT-M is no longer treated as a state or zone classifier inside IQ Coach. In this protocol, it functions as the **entry-layer Cognitive Control Capacity task**.

Its purpose is to measure and train:

```text
controlled perceptual evidence extraction
→ cognitive control capacity
→ C-Control / Cognitive Bandwidth
→ bits/sec
```

It does **not** assign flow-state labels, readiness-state labels, mind-state classes, or reset/activation/widening routes. Those functions belong in a separate **Zone / Flow** app.

The IQ Coach protocol therefore becomes a layered adaptive-intelligence training stack:

```text
Layer 0: C-Control / Cognitive Bandwidth
Adapted MFT-M-style task
= controlled perceptual evidence throughput, measured in bits/sec

Layer 1: State and binding working memory
Gabor / flow feature tracking
= feature maintenance, arbitrary binding and interference control

Layer 2: Relational working memory
Gabor / flow transformation tracking
= change detection, invariant recovery and relation binding over time

Layer 3: SR horizon
Gabor / optic-flow successor prediction
= predictive transition sampling and path/reachability inference

Layer 4: Mindware bridge
Prompt + micro-mission
= explicit transfer handle into reasoning, planning and action
```

This is a cleaner scientific and product architecture. It avoids overloading one short task with too many claims. The adapted MFT-M-derived task becomes the **entry layer of intelligence as cognitive control capacity**, while Zone / Flow remains a separate product layer for readiness, subjective flow and state support.

---

## 1. Theoretical framing

Trident-G far-transfer training may expand and reshape the learner's effective SR relational space by training variable abstraction and predictive transition structure across multiple relation families. With repeated wrapper variation, boundary testing, feedback and consolidation, these SR-style maps may become sufficiently compiled that candidate inferences are generated semi-automatically, while the global workspace selectively samples, verbalises, tests and stabilises the most relevant candidates.

The key point is that this expansion should not be described as simply adding more facts or strategies. It is better described as increasing the **dimensionality, reach and usability of the relational state space**. Training over sameness/difference, order, exclusion, transitivity, containment, causal/probabilistic relations, path constraints, counterfactuals, etc., gives the learner more abstract variables and transition operators.

The revised sequence is:

```text
controlled evidence extraction
→ variable abstraction
→ working-memory binding
→ transformation tracking
→ successor prediction
→ wrapper recovery
→ prompt-guided problem solving
→ real-world strategic action
→ delayed re-check
```

The adapted MFT-M/CCC task occupies the first step in this sequence. It trains and measures the user's capacity to extract controlled perceptual evidence from brief displays under adaptive demand. In product language, this is **Cognitive Bandwidth**. In technical language, it is **C-Control**, expressed in **bits/sec**.

The “relatively automatic” part of the theory requires careful wording. In Trident-G terms, the system should not become automatic in the sense of rigid stimulus-response habit. It should become automatic in the sense that **candidate relational trajectories are pre-activated or cheaply sampled**. The learner no longer has to consciously construct every possible inference from scratch. Instead, trained SR maps make some paths, constraints, likely consequences and possible next moves more available to attention.

The global workspace then functions less like a brute-force reasoning engine and more like a **selective broadcast and validation layer**. The SR system supplies candidate transitions:

```text
this state may lead there
this constraint blocks that path
this move opens that future state
this relation resembles a previously validated relation
```

The global workspace samples the most task-relevant candidates through meta-epistemic prompts such as:

```text
What must be true?
Can this path still reach the goal?
Which feature changed?
What would make this wrong?
What else could explain this?
```

Meta-epistemic prompts do not train the reasoning operator directly. They act as global-workspace control handles that coordinate lower-level processes and make them reusable across tasks.

---

## 2. System architecture

The protocol is implemented as a **single relational-state engine** with two main perceptual wrappers:

- **Wrapper A:** Gabor patch fields: orientation `θ`, spatial frequency `f`
- **Wrapper B:** optic-flow patch fields: angle `φ`, speed `v`

The entry-capacity block may use a simplified single-patch or low-set-size variant derived from the adapted MFT-M logic. This block is used to estimate controlled evidence throughput before memory, binding or relation demands are introduced.

Both Gabor and optic-flow wrappers use **static circular apertures of identical size** positioned at fixed grid locations. The patches themselves do not move. Only their internal visual signal changes. This ensures that wrapper swaps test relational transfer, not spatial tracking, scale adaptation or multiple-object tracking.

The engine now contains five functional modes:

1. **C-Control / CCC mode** — entry-layer controlled perceptual evidence extraction
2. **State n-back** — feature maintenance
3. **Binding n-back** — arbitrary associative binding
4. **Relation n-back** — transformation tracking
5. **SR horizon mode** — successor-state prediction

The first mode measures and trains the entry layer. The remaining four modes build the relational working-memory and SR layers.

---

## 3. Stimulus system

### 3.1 Entry-capacity stimulus: adapted MFT-M / CCC

**Purpose:** estimate C-Control / Cognitive Bandwidth in bits/sec.

The entry-capacity task should use brief, presemantic visual displays with adaptive difficulty. It should minimise verbal recoding and avoid explicit state/zone framing.

Suitable stimulus families include:

```text
single Gabor patch discrimination
small Gabor majority discrimination
orientation / spacing / contrast discrimination
brief masked perceptual decision trials
```

Core manipulated variables:

```text
feature entropy
exposure time
masking
majority ratio
discrimination gap
response deadline
trial information load
```

Primary output:

```text
C-Control / Ĉ = controlled perceptual evidence throughput in bits/sec
```

This block is not a readiness diagnosis. It is an entry-capacity measurement and training block.

### 3.2 Gabor patches

- **Form:** static circular aperture containing a sinusoidal grating
- **Features:** orientation `θ` and spatial frequency `f`
- **Presentation:** field of `N` patches, typically 5, 7 or 9, at fixed spatial positions
- **Majority function:** a target proportion of patches share the same `θ` and/or `f`; the remainder are noise or distractors
- **Calibration variant:** single patch or low-set-size display for pure perceptual-control thresholding

### 3.3 Optic-flow patches

- **Form:** static circular aperture containing a random-dot kinematogram or drifting filtered noise
- **Features:** angle/direction of motion `φ` and speed `v`
- **Presentation:** same spatial layout as Gabor fields, same patch count and same aperture size
- **Majority function:** a target proportion of patches share coherent motion at `φ` and `v`; the remainder contain random or orthogonal motion
- **Global flow variant:** in SR mode only, all patches may jointly encode expansion, contraction or rotation about a screen-centre focus of expansion

### 3.4 Display parameters

- Patch size, eccentricity and spacing are held constant across wrappers.
- Background luminance and contrast are normalised.
- Exposure time, inter-trial interval and mask parameters are frame-counted.
- Dropped-frame detection is logged.
- Trials with contaminated timing are flagged or excluded from C-Control estimation.

---

## 4. State space and information model

Each trial defines a discrete visual state vector.

For Gabor fields:

```text
S_t = [θ_t, f_t]
```

For optic-flow fields:

```text
S_t = [φ_t, v_t]
```

Example feature bins:

| Feature | Bins | Information |
|---|---:|---:|
| Orientation / angle | 8 | 3 bits |
| Spatial frequency / speed | 4 | 2 bits |

State entropy:

```text
H(S) = 3 + 2 = 5 feature bits
```

For a three-feature version, a third feature such as contrast, coherence or luminance can be added:

| Feature | Bins | Information |
|---|---:|---:|
| Orientation / angle | 8 | 3 bits |
| Spatial frequency / speed | 4 | 2 bits |
| Contrast / coherence | 4 | 2 bits |

Full state entropy in that version:

```text
H(S) = 3 + 2 + 2 = 7 feature bits
```

The important point is that the training target is not merely storage of `H(S)`. The target is the progressive control of:

```text
features
→ bindings
→ transformations
→ successor relations
→ relation families
```

Load metrics:

```text
C-Control load = H_extract / exposure time
State load     = H_feature × n
Binding load   = H_binding × n
Relation load  = H_relation × n
SR load        = successor surprisal × horizon
```

---

## 5. Cognitive modes

### 5.1 Mode 0 — C-Control / Cognitive Bandwidth

**Question:** Can the user extract the relevant perceptual evidence quickly and accurately under controlled demand?

Example task forms:

```text
Was the dominant orientation tilted left or right?
Was the majority pattern high or low frequency?
Was the target feature present or absent?
Did the brief display contain more A than B?
```

**Measures:** controlled perceptual evidence extraction, response selection, elementary cognitive control under time pressure.

**Primary unit:** bits/sec.

Example internal score:

```text
C-Control = usable information extracted / effective response time
```

or:

```text
Ĉ = H_extract / RT_adjusted
```

with correction for accuracy, chance level, lapses and timing contamination.

This is the **entry layer** of the IQ Coach protocol. It checks whether the learner can extract and control a perceptual variable before higher working-memory and relational demands are added.

### 5.2 Mode 1 — State n-back

**Question:** Was this feature the same as `n` trials ago?

Examples:

```text
Gabor: Was the majority orientation the same as 2-back?
Flow:  Was the majority flow angle the same as 2-back?
```

**Measures:** feature extraction, maintenance and updating.

Load:

```text
State Load = H_feature × n
```

This mode trains **feature hold**: the ability to maintain a perceptual variable across time while updating it trial by trial.

### 5.3 Mode 2 — Binding n-back

**Question:** Did this feature belong with that feature?

Examples:

```text
Gabor: Was this majority orientation previously paired with this majority spatial frequency?
Flow:  Was this majority angle previously paired with this majority speed?
```

**Measures:** arbitrary associative binding and pattern separation.

Load:

```text
Binding Load = H_binding × n
```

Lure types:

```text
same feature, wrong pairing
same pairing, wrong temporal position
recent correct pair, wrong n-back position
single-feature match without full binding match
```

These lure trials are essential because they measure interference and pattern separation rather than simple span.

### 5.4 Mode 3 — Relation n-back

**Question:** Did the change relation repeat?

Examples:

```text
Gabor: Did orientation change by the same amount as before?
Flow:  Did flow angle change by the same amount as before?
```

The learner tracks transformations rather than states.

A trial can encode:

```text
S_t = [orientation, spacing]
R_t = S_t − S_{t−n}
R_t = [Δorientation, Δspacing]
```

Load:

```text
Relation Load = H_relation × n
```

This is the core relational-working-memory mode because it trains:

```text
what changed?
what stayed invariant?
which relation survived the surface?
```

It maps naturally onto matrix reasoning, puzzle solving and strategic action.

### 5.5 Mode 4 — SR horizon mode

**Question:** Can this state still lead to the target or expected next state?

Instead of asking for a past match, the protocol defines a transition map:

```text
S_t → S_{t+1} → S_{t+2}
```

Examples:

```text
Gabor: Given this pattern, is this the expected next pattern?
Flow:  Given this flow trajectory, is this the expected next field?
```

**Measures:** successor prediction, path evaluation and transition-map use.

Load:

```text
SR Load = −log2 P(S_future | S_current) × horizon
```

Product-facing name:

```text
Path Prediction
```

Theory-facing name:

```text
behavioural SR-inspired successor prediction
```

This is not a direct hippocampal SR measure. It is a behavioural task designed to train predictive relational structure.

---

## 6. Session structure

### 6.1 Standard session: 15 minutes

| Block | Duration | Stimulus | Mode | Purpose |
|---|---:|---|---|---|
| **Entry Capacity Block** | 2 min | single Gabor / adapted MFT-M variant | C-Control | estimate Cognitive Bandwidth / C-Control in bits/sec |
| **Feature Discrimination** | 1 min | single Gabor patch | threshold tracking | estimate JNDs for `θ` and `f`; tune later perceptual difficulty |
| **State / Binding WM** | 4 min | Gabor field | state or binding n-back | build feature hold and pattern binding |
| **Relation / SR WM** | 5 min | Gabor field | relation or SR mode | train transformation tracking and predictive mapping |
| **Wrapper Perturbation** | 2 min | flow field | same relation, new wrapper | test horizontal transfer and recovery |
| **Prompt / Micro-Mission** | 1 min | text / voice prompt | meta-epistemic bridge | connect perceptual operation to reasoning or action |

The first block is **not** a Zone Check. It is an entry-capacity probe. It gives the protocol a clean C-Control estimate before memory and relation demands are introduced.

### 6.2 Micro-test mode: 2–3 minutes

The short version should be called something like:

```text
Cognitive Bandwidth Check
Entry Capacity Probe
C-Control Micro-Test
```

It contains:

```text
40–60 trials
brief perceptual discrimination
adaptive exposure / difficulty
C-Control estimate in bits/sec
reliability and timing flags
```

It is used for:

```text
tracking C-Control over time
setting today's training band
calibrating difficulty for later blocks
monitoring training progress
```

It is not used for:

```text
flow-state classification
MIND_READY / MIND_IN_ZONE / MIND_FLAT labels
reset / activate / widen routing
clinical or wellbeing interpretation
```

### 6.3 Core calibration mode: 20–30 minutes

Extended calibration may be used during onboarding or periodic re-baselining.

It contains:

```text
150–250 trials across C-Control and feature discrimination
stable psychometric threshold estimation
device timing validation
lapse estimation
baseline capacity profile
```

It can support:

```text
initial PS-RWC profile
personal baseline estimation
difficulty calibration
research-quality reliability checks
```

It should not be described as a state-diagnosis session.

---

## 7. Adaptive engine and scoring

### 7.1 Adaptive training band

The protocol uses an adaptive training band:

```text
target balanced accuracy = 70–82%
```

Rules:

```text
If >85% for two consecutive mini-blocks:
    increase one demand parameter only.

If 70–82%:
    remain in the current band.

If 60–70%:
    hold or repeat with slight support.

If <60%:
    reduce demand or provide support.
```

This is a **difficulty-control rule**, not a state classifier. It keeps the task challenging enough to train without collapsing into frustration, automation or noise.

### 7.2 Adaptive parameters

Rotate adaptive parameters. Do not increase all of them at once.

1. Exposure time / speed
2. Feature discrimination gap / JND
3. Majority ratio
4. Set size
5. n-back level
6. Binding load
7. Relation arity
8. Lure pressure
9. Wrapper shift
10. Successor horizon

### 7.3 Trial demand model

```text
D_trial = (H_extract / ET)                    [C-Control / perceptual control]
        + α(H_state × n)                      [state maintenance]
        + β(H_binding × n)                    [associative load]
        + γ(H_relation × h)                   [relational load]
        + δ(lure_pressure)                    [interference]
        + ε(wrapper_shift)                    [transfer cost]
        + ζ(successor_surprisal × horizon)    [SR horizon]
```

### 7.4 Psychometric function

```text
P(correct) = chance + usable_range × sigmoid(θ_capacity − D_trial)
```

where `θ_capacity` is the fitted person-level parameter for the relevant subscale.

Separate fitted capacities should be estimated rather than collapsing all behaviour into one global score.

### 7.5 C-Control scoring

C-Control is estimated from trials with minimal memory and relation load.

A practical implementation can use:

```text
C-Control = effective information load / adjusted response time
```

with corrections for:

```text
accuracy
chance level
lapse rate
exposure time
response deadline
trial timing contamination
device frame drops
```

The output should be expressed as:

```text
bits/sec
```

User-facing label:

```text
Cognitive Bandwidth
```

Research-facing label:

```text
C-Control / Ĉ
```

---

## 8. Output metrics: PS-RWC profile

The app should estimate separate parameters, not one global n-back score.

| Layer | User-facing name | Technical metric | Unit | Definition |
|---|---|---|---|---|
| Entry capacity | **Cognitive Bandwidth** | C-Control / `Ĉ` | bits/sec | controlled perceptual evidence throughput |
| State maintenance | **Feature Hold** | State-WM / `Ŵ_State` | state-bit steps | max feature-maintenance load at criterion |
| Binding | **Pattern Binding** | A-Bind / `Ŵ_A` | binding-bit steps | max arbitrary binding load at criterion |
| Transformation | **Change Tracking** | R-Bind / `Ŵ_R` | relation-bit steps | max transformation relation load at criterion |
| Prediction | **Path Prediction** | S-Horizon / `Ŵ_S` | SR-bit steps | max successor prediction horizon at criterion |
| Interference | **Lure Resistance** | I-Lure / `Î` | d′ cost or false-alarm cost | susceptibility to misleading lures |
| Transfer | **Wrapper Recovery** | W-Recovery / `Ŵ_W` | accuracy cost / recovery trials | performance drop and recovery slope after wrapper shift |

### 8.1 Product-facing outputs

The user should see:

```text
Cognitive Bandwidth
Feature Hold
Pattern Binding
Change Tracking
Path Prediction
Lure Resistance
Wrapper Recovery
Today's Training Band
```

Example user-facing result:

```text
Your Cognitive Bandwidth today was slightly above your recent baseline.
Your next training band is Standard → Stretch.
Today's focus: Pattern Binding, level 2.
```

Avoid:

```text
You are in flow.
You are flat.
You are locked in.
You are scattered.
Your brain is in a supercritical state.
```

Those labels belong to the separate Zone / Flow app, not this IQ Coach protocol.

### 8.2 Internal research outputs

Internal outputs may include:

```text
full PS-RWC parameter vector per session
trial-level time series
capacity trends
lapse rate
RT distribution
accuracy distribution
balanced accuracy
lure false-alarm profile
wrapper-swap recovery curve
device timing flags
```

These can be used for model refinement, adaptive difficulty, reliability monitoring and later validation work.

---

## 9. Capacity time-series and diagnostics

The trial-level time series may be useful, but it should not be used here to classify the user into cognitive states.

### 9.1 Trial efficiency series

A trial efficiency variable can be retained for internal analysis:

```text
u_t = z(correct_t × bits_t / RT_t)
```

or:

```text
u_t = residual RT / accuracy-adjusted efficiency after regressing out task-design effects
```

Possible design effects:

```text
exposure time
majority ratio
feature entropy
trial index
switch status
lure status
n-back level
relation load
wrapper identity
```

### 9.2 Diagnostic features

Useful diagnostic features may include:

```text
median C-Control
capacity trend across blocks
lapse rate
post-error slowing
post-lure recovery
RT variability
accuracy variability
switch cost
wrapper-shift cost
recovery slope
frame-drop contamination
```

These diagnostics support:

```text
difficulty adaptation
reliability checks
training-band selection
research modelling
proof-dashboard summaries
```

They do not support, within this document:

```text
MIND_READY classification
MIND_IN_ZONE classification
MIND_FLAT classification
MIND_LOCKED_IN classification
MIND_SPUN_OUT classification
mind-body alignment claims
wellbeing recommendations
clinical interpretations
```

### 9.3 Relationship to the separate Zone / Flow app

A separate Zone / Flow app may use its own cognitive, subjective and physiological measures to estimate readiness or flow-support routes.

That product may include:

```text
state check
subjective flow pulse
reset / activate / widen routes
HRV or RR-informed body readiness
mind-body alignment
```

However, those functions are not part of this IQ Coach working-memory protocol.

The clean separation is:

```text
IQ Coach:
capacity-profiled adaptive training
C-Control → WM → relation → SR → mindware bridge

Zone / Flow app:
readiness, subjective flow, reset, activation, widening and HRV/body-state support
```

---

## 10. Training progression

### 10.1 Ten-day minimum viable arc

| Day | Focus | Primary load | Transfer principle |
|---:|---|---|---|
| 1 | C-Control baseline + feature discrimination | speed / exposure time | establish Cognitive Bandwidth baseline |
| 2 | Multi-feature majority discrimination | discrimination gap / majority ratio | variable abstraction |
| 3 | 1-back state tracking | `n = 1` | feature hold |
| 4 | 1-back arbitrary binding | binding load | episodic feature binding |
| 5 | 2-back arbitrary binding | temporal extension | binding across delay |
| 6 | 1-back relational change | relation type | transformation tracking |
| 7 | 2-back relational change | n + relation | relational binding over time |
| 8 | Wrapper swap: Gabor → Flow | wrapper variation | horizontal transfer |
| 9 | SR path / successor mode | successor horizon | predictive map training |
| 10 | Mixed delayed probe + prompt | transfer test | consolidation check |

### 10.2 Twenty-day full Trident-G arc

| Phase | Days | Aim |
|---|---:|---|
| **Calibrate & Carve** | 1–4 | C-Control baseline, feature discrimination, variable abstraction |
| **Build Binding** | 5–8 | arbitrary associations, lure resistance, temporal extension |
| **Build Relational** | 9–12 | transformation tracking, cross-feature relations, conjunctions |
| **Force Portability** | 13–16 | wrapper swaps, breakpoint perturbation, recovery timing |
| **SR Horizon & Niche** | 17–20 | successor prediction, prompts, implementation cues, delayed probes |

### 10.3 Role of the C-Control layer across the arc

C-Control should be used to:

```text
set initial difficulty
track entry-capacity training gains
estimate Cognitive Bandwidth trends
separate perceptual-control limits from WM/relation limits
support proof dashboards without overclaiming
```

It should not be used to:

```text
claim objective flow detection
diagnose cognitive state
route reset / activate / widen exercises
make clinical or wellbeing claims
```

---

## 11. MVP roadmap

### MVP 1: C-Control + Gabor relational engine

Build first:

```text
adapted MFT-M / CCC entry-capacity block
single Gabor patch discrimination
Gabor field state n-back
Gabor field binding n-back
Gabor field relation n-back
lures
adaptive scoring
basic PS-RWC profile
```

Outputs:

```text
Cognitive Bandwidth
Feature Hold
Pattern Binding
Change Tracking
Lure Resistance
Today's Training Band
```

Do not include:

```text
MIND-state labels
Zone routing
Flow Actions
HRV
criticality classifier
mind-body alignment
```

### MVP 2: Wrapper transfer

Add:

```text
flow patch fields with same size and layout
Gabor → Flow wrapper swap
same relation under changed wrapper
W-Recovery metric
wrapper-swap recovery curve
```

Purpose:

```text
test horizontal transfer and recovery, not readiness state
```

### MVP 3: SR horizon and integration

Add:

```text
flow patch SR mode
trajectory → successor → target reachability
global flow patterns: expansion, contraction, rotation
meta-epistemic prompts
micro-missions
20-day progression
delayed probes
```

Purpose:

```text
train predictive transition sampling and bridge it into reasoning/action scripts
```

### Later integration with IQ Coach

IQ Coach can then integrate this protocol with:

```text
Mission Arena
Reasoning Transfer Test
self-report applied intelligence check
proof dashboard
delayed re-checks
real-world mission prompts
```

But the C-Control block remains an entry-capacity layer, not a state-routing tool.

---

## 12. Key constraints and cautions

1. **C-Control is not a state classifier.** It measures controlled perceptual evidence throughput in bits/sec.
2. **No flow-state claims from C-Control alone.** Do not claim the task objectively detects flow.
3. **No MIND-state labels in this protocol.** MIND_READY, MIND_IN_ZONE, MIND_FLAT, MIND_LOCKED_IN and MIND_SPUN_OUT belong, if used at all, in a separate Zone / Flow system.
4. **No moving patches.** Optic flow must be internal to static apertures. Moving patches would convert the task into multiple-object tracking.
5. **Presemantic framing.** Avoid verbal feature labels where possible. Use perceptual same/different or majority judgements to minimise verbal recoding.
6. **No direct neural claims.** The task is an SR-inspired behavioural relational-workspace measure, not a direct hippocampal or neural readout.
7. **Balanced accuracy, not raw accuracy.** Same/different and lure distributions can bias raw scores.
8. **Timing validation is essential.** Online frame drops can contaminate short exposure-time estimates.
9. **Spaced practice is required.** The 10-day arc is a minimum; 20 days with delayed re-checks is better for slow schematic Gc claims.
10. **Transfer remains evidence-generating.** Treat far transfer as a design target and empirical question, not as a guaranteed outcome.

---

# SR Inference Space

The following relation families define the expanded SR relational-space curriculum. The C-Control layer provides the entry-capacity foundation, but these relation families are where the protocol becomes a relational far-transfer system.

## 1. Transitive / ordinal chains

**Logic:** If A > B and B > C, then A > C.

**Gabor implementation:**

- Three patches or sequential fields show orientations: `θ_A = 60°`, `θ_B = 30°`, `θ_C = 0°`.
- Training: learner tracks “clockwise from” relations across trials.
- Probe: given A and C without B, predict the implicit relation.

**Flow implementation:**

- Three patches show speeds: `v_A = fast`, `v_B = medium`, `v_C = slow`.
- Training: learner tracks “faster than” links.
- Probe: does A flow faster than C?

**SR map encoding:** The successor matrix learns transition probabilities that preserve order. The implicit transitive inference emerges from the composition of learned steps.

**Expansion value:** Trains ordinal ranking, which underlies numerical reasoning, social hierarchy inference and decision-making under uncertainty.

---

## 2. Analogical / structural mapping

**Logic:** The relation between A and B is the same as the relation between C and D.

```text
A:B :: C:D
```

**Gabor implementation:**

- Field 1: majority orientation shifts from vertical to horizontal: `Δθ = +90°`.
- Field 2: majority spatial frequency shifts from low to high: `Δf = +2 steps`.
- Training: learner judges “same transformation type?”
- Probe: new field shows an orientation shift; learner selects the frequency shift that completes the analogy.

**Flow implementation:**

- Patch A: flow angle rotates 45° right while accelerating.
- Patch B: flow angle rotates 45° right while decelerating.
- Probe: given a new rotation-plus-acceleration pattern, select the matching speed transformation.

**SR map encoding:** The system learns that certain state-difference vectors are equivalent across feature dimensions. This is a second-order relation: a relation between relations.

**Expansion value:** Core to matrix reasoning, scientific analogy and metaphorical reasoning.

---

## 3. Progression / trend extrapolation

**Logic:**

```text
A → A + Δ → A + 2Δ → predict A + 3Δ
```

**Gabor implementation:**

- Trial `t`: `θ = 0°`
- Trial `t+1`: `θ = 45°`
- Trial `t+2`: `θ = 90°`
- Probe: is the expected next orientation `135°`?

**Flow implementation:**

- Sequential fields show coherent flow angle rotating 30° clockwise each trial.
- Probe: is the next field consistent with the trend or a lure?

**SR map encoding:** The successor representation captures not just state-to-state transitions but the derivative of change. The predictive map encodes:

```text
S_{t+1} = S_t + Δ
```

where `Δ` is itself a state variable.

**Expansion value:** Underlies time-series prediction, physical intuition and strategic planning.

---

## 4. Conjunctive / compositional rules

**Logic:** A and B together predict C. Neither alone is sufficient.

**Gabor implementation:**

- Rule: if `θ = vertical` and `f = high`, then the next state has higher contrast or brightness.
- Training: learner sees sequences where the conjunction determines the successor.
- Lure: vertical + low frequency should not trigger the same successor.

**Flow implementation:**

- Rule: if `φ = rightward` and `v = fast`, then the next field expands.
- Probe: rightward + slow should not trigger expansion.

**SR map encoding:** The transition probability `P(S_future | S_current)` is conditioned on the joint state vector, not independent features. The SR matrix must represent multi-dimensional conjunctions.

**Expansion value:** Trains configural reasoning, necessary-cause inference and resistance to simple heuristics.

---

## 5. Conditional / probabilistic rules

**Logic:** If A, then probably B, but not always. Track confidence.

**Gabor implementation:**

- 80% of the time, high spatial frequency is followed by clockwise rotation.
- 20% of the time, it is followed by counter-clockwise rotation.
- Training: learner tracks the conditional probability, not a deterministic rule.
- Probe: given high frequency, is the next state the common or rare successor?

**Flow implementation:**

- Fast flow usually leads to expansion.
- Sometimes it leads to contraction.
- Learner must encode the probabilistic transition map.

**SR map encoding:** This is the canonical SR formulation. The successor matrix encodes expected future occupancy: each state is represented by the vector of states it leads to, weighted by probability.

**Expansion value:** Core to decision-making under uncertainty, causal learning and expected-value computation.

---

## 6. Mutual exclusion / XOR relations

**Logic:** A or B, but not both. The presence of one predicts the absence of the other.

**Gabor implementation:**

- Two patches in a field: one vertical, one horizontal.
- Rule: if vertical is majority, horizontal must be minority, and vice versa.
- Probe: field shows both at equal strength, creating a constraint violation.

**Flow implementation:**

- Rule: expansion and rotation are mutually exclusive in the global field.
- Probe: field shows both simultaneously, creating an anomaly.

**SR map encoding:** The transition matrix has zero or near-zero probability for certain joint states. The map learns constraint structure: which state combinations are unreachable.

**Expansion value:** Underlies logical negation, anomaly detection and consistency checking in reasoning.

---

## 7. Hierarchical / containment relations

**Logic:** State A is nested within or subordinate to state B. Changing B changes A, but not vice versa.

**Gabor implementation:**

- Global field property: overall contrast level sets the context.
- Local patch property: orientation within that context.
- Rule: when global contrast drops, all orientations shift by `+15°`.
- Probe: does local orientation change predict global contrast? No. This tests asymmetry.

**Flow implementation:**

- Global flow: expansion rate of the whole field.
- Local flow: angle of individual patches.
- Rule: global expansion modulates local speed, but local speed does not modulate global expansion.

**SR map encoding:** The successor representation encodes asymmetric influence. The higher-level state variable acts as a latent cause that reshapes the transition structure of lower-level variables.

**Expansion value:** Trains context sensitivity, nested rule systems and understanding of scope/scale in reasoning.

---

## 8. Counterfactual / path-dependent relations

**Logic:** What would have happened if the other path had been taken? Compare actual and possible trajectories.

**Gabor implementation:**

- At trial `t`, the field implies two possible successor states.
- Trial `t+1` shows the actual successor.
- Probe: was the other state still possible from trial `t`?

**Flow implementation:**

- Flow field at `t` suggests two possible future directions.
- At `t+1`, one path is realised.
- Probe: given the state at `t+2`, could it have been reached from the unrealised path at `t`?

**SR map encoding:** The SR map naturally represents multiple future possibilities from each state. Counterfactual reasoning requires that the learner maintains the branching structure, not just the taken path.

**Expansion value:** Core to strategic reasoning, regret-based learning and planning.

---

## 9. Equivalence / substitution classes

**Logic:** A and B are distinct surface states but functionally equivalent in the transition structure.

**Gabor implementation:**

- `θ = 45°` with `f = low` produces the same successor as `θ = 135°` with `f = high`.
- Training: learner sees that two different surface patterns lead to the same next state.
- Probe: new pattern → predict successor based on equivalence class, not surface identity.

**Flow implementation:**

- `φ = 0°` with `v = fast` leads to expansion.
- `φ = 180°` with `v = slow` also leads to expansion.
- Learner extracts expansion as the invariant outcome.

**SR map encoding:** The SR map clusters states by their successor consequences. This is state abstraction: collapsing the raw state space into a lower-dimensional latent-cause space.

**Expansion value:** Underlies concept formation, category induction and transfer of learning across superficially different problems.

---

## 10. Delayed / distant-horizon relations

**Logic:** A relation spans interruptions or distractors.

```text
A → [gap] → B
```

**Gabor implementation:**

- Standard n-back already implements this in simple form.
- Extension: insert distractor trials from another relation family between A and B.
- Probe: does the A→B relation survive the intervening structure?

**Flow implementation:**

- Flow trajectory is interrupted by random noise fields.
- Probe: after the noise, does the trajectory continue as predicted?

**SR map encoding:** Tests whether the SR map is robust to off-policy experience. The transition matrix must maintain its structure even when the learner is not actively sampling from it.

**Expansion value:** Critical for real-world reasoning, where relevant cues are rarely contiguous. This tests slow schematic Gc: the stability of relational knowledge over time.

---

## 11. Summary: relational-space expansion arc

| Stage | Relation family | Cognitive operation | Trident-G phase |
|---:|---|---|---|
| 0 | C-Control | controlled evidence extraction | entry capacity |
| 1 | State maintenance | feature hold | variable extraction |
| 2 | Arbitrary binding | A ↔ B | binding |
| 3 | Transitive chains | A > B > C → A > C | local SR composition |
| 4 | Progression / trend | A → A + Δ | derivative tracking |
| 5 | Analogy | A:B :: C:D | second-order relation |
| 6 | Conjunction | A ∧ B → C | configural rule |
| 7 | Conditional | P(B|A) = .80 | probabilistic SR |
| 8 | Mutual exclusion | A XOR B | constraint structure |
| 9 | Hierarchy | B modulates A | asymmetric influence |
| 10 | Counterfactual | A → B versus A → C' | branching trajectory |
| 11 | Equivalence | A ≡ B by consequence | state abstraction |
| 12 | Delayed horizon | A → [gap] → B | consolidation / Gc |

---

## 12. Practical implementation strategy

Do not train all relation families simultaneously.

Recommended progression:

```text
Days 1–5:
C-Control, state maintenance, binding, transitive chains, simple progression

Days 6–10:
analogy, conjunction, conditional probability

Days 11–15:
mutual exclusion, hierarchy, counterfactual relations

Days 16–20:
equivalence classes, delayed probes, mixed relation blocks
```

The mixed relation block is the critical transfer test. The learner must identify which relation family applies to the current trial, then execute the appropriate inference.

The meta-epistemic prompt becomes:

```text
What kind of relation is this?
```

rather than merely:

```text
What is the answer?
```

This architecture makes the SR relational space genuinely multi-dimensional. The learner is not just learning what comes next in one domain. They are building a library of transition operators that the global workspace can sample from during novel problem solving.

---

## 13. Canonical product split

The revised product architecture is:

```text
IQ Coach
= C-Control + relational WM + SR horizon + mission transfer + proof

Zone / Flow app
= readiness check + subjective flow pulse + reset / activate / widen + HRV/body-state support
```

### IQ Coach should say

```text
Train attention control.
Measure Cognitive Bandwidth.
Build pattern binding, change tracking and path prediction.
Test whether cognitive skills survive new wrappers and delayed re-use.
```

### IQ Coach should not say

```text
This detects your flow state.
This diagnoses whether you are flat, locked-in or scattered.
This routes your brain state to recovery exercises.
This measures your neural criticality.
```

### Zone / Flow can say, with appropriate evidence boundaries

```text
Check your readiness.
Notice your flow experience.
Use reset, activation or widening exercises.
Track state patterns over time.
```

The split improves scientific discipline, product clarity and validation strategy.

---

## 14. Bottom line

The adapted MFT-M-derived task should be retained, but its role should be narrowed and strengthened.

It becomes:

```text
Layer 0 of IQ Coach:
Cognitive Control Capacity
Cognitive Bandwidth
controlled perceptual evidence throughput
bits/sec
```

It is no longer:

```text
a Zone Check
a flow detector
a mind-state classifier
a reset/activation/widening router
```

That makes the overall stack cleaner:

```text
C-Control
→ feature hold
→ pattern binding
→ change tracking
→ successor prediction
→ wrapper recovery
→ prompt-guided problem solving
→ delayed re-check
```

This is a stronger basis for IQ Coach than state-gated routing because it treats the MFT-M adaptation as a genuine trainable measurement layer, just as relational working memory is a trainable measurement layer. State and zone support can then be developed separately in the Zone / Flow app without compromising the claims architecture of IQ Coach.
