# IQ Coach — Protocol Update 2 Revised

## Evaluation, claims boundary and implementation notes for the C-Control + relational WM engine

**Status:** revised companion document  
**Purpose:** clean rewrite of Protocol Update 2 so that it aligns with the new IQ Coach architecture: adapted MFT-M as C-Control / Cognitive Bandwidth, not as Zone classification or readiness routing.  
**Product scope:** IQ Coach, not the separate Zone / Flow app.

---

## 0. Executive verdict

Protocol Update 2 is strong, but it needed revision because it mixed three different layers:

```text
1. A genuine relational WM / SR training engine
2. A C-Control / CCC calibration block
3. A Zone / criticality classifier and readiness-routing layer
```

The first two belong inside IQ Coach. The third should now be separated into the Zone / Flow app.

The revised architecture is:

```text
IQ Coach
= C-Control / Cognitive Bandwidth
+ relational working memory
+ SR-horizon training
+ wrapper recovery
+ mindware-script bridge
+ delayed transfer probes
```

Not:

```text
IQ Coach
= Zone Check
+ MIND-state classification
+ reset / activate / widen routing
```

The adapted MFT-M-derived task should remain in IQ Coach, but only as the **entry-layer C-Control task**:

```text
controlled perceptual evidence extraction
→ bits/sec
→ Cognitive Bandwidth
→ adaptive training and measurement
```

It should not be used, in this protocol, to infer:

```text
MIND_READY
MIND_IN_ZONE
MIND_FLAT
MIND_LOCKED_IN
MIND_SPUN_OUT
```

Those labels, if retained at all, belong in a separate Zone / Flow product with its own evidence boundary.

---

## 1. What should be preserved from Protocol Update 2

The following elements are strong and should remain in the revised protocol.

### 1.1 The single relational-state engine

The basic engine remains valid:

```text
state
→ feature relation
→ transformation
→ successor path
→ goal-relevant action
```

This should now be implemented with two main wrappers:

```text
Wrapper A: Gabor patch fields
Wrapper B: optic-flow patch fields
```

The earlier “simple gratings” layer is no longer needed as a separate wrapper. A **single Gabor patch** or low-set-size Gabor display can perform the clean psychophysical baseline role.

Revised progression:

```text
single Gabor patch
→ small Gabor field
→ full Gabor field
→ optic-flow field
```

This preserves the useful clean-to-complex progression:

```text
clean variable
→ noisy majority variable
→ relational field
→ dynamic path / action-like wrapper
```

### 1.2 The information-theoretic load definitions

Keep these definitions.

| Load type | Formula | Meaning |
|---|---|---|
| **C-Control load** | `H_extract / ET` | controlled perceptual evidence extraction per unit time |
| **State Load** | `H_feature × n` | feature maintenance over `n` steps |
| **Binding Load** | `H_binding × n` | arbitrary association held across delay |
| **Relation Load** | `H_relation × n` | transformation tracking across delay |
| **SR Load** | `successor surprisal × horizon` | predictive path cost |

Concrete examples:

```text
orientation = 3 bits
2-back = 2
State Load = 3 × 2 = 6 bit-steps
```

```text
orientation + spacing = 5 bits
2-back = 2
Binding Load = 5 × 2 = 10 binding-bit steps
```

```text
Δorientation + Δspacing = 5 bits
2-back = 2
Relation Load = 5 × 2 = 10 relation-bit steps
```

### 1.3 The four relational modes

The four original modes remain, but they are now preceded by a C-Control entry block.

```text
Mode 0: C-Control / Cognitive Bandwidth
Mode 1: State n-back
Mode 2: Binding n-back
Mode 3: Relation n-back
Mode 4: SR horizon mode
```

The key product distinction is:

```text
Mode 0 = entry-layer capacity
Modes 1–4 = relational WM / SR training
```

### 1.4 The seven-parameter profile

Keep the multi-parameter scoring framework. It is methodologically stronger than a single n-back score.

| Score | User-facing label | Meaning | Best wrapper |
|---|---|---|---|
| **C-Control** | Cognitive Bandwidth | controlled perceptual evidence throughput | single Gabor / Gabor field |
| **State-WM** | Feature Hold | feature maintenance over `n` steps | Gabor / flow |
| **A-Bind** | Pattern Binding | arbitrary feature binding | Gabor |
| **R-Bind** | Change Tracking | transformation relation capacity | Gabor / flow |
| **S-Horizon** | Path Prediction | successor/path prediction capacity | flow / Gabor |
| **I-Lure** | Lure Resistance | interference susceptibility | Gabor |
| **W-Recovery** | Wrapper Recovery | recovery after wrapper shift | Gabor → flow |

This preserves the idea that the protocol should estimate a **capacity profile**, not a single “brain training score”.

### 1.5 The adaptive training band

Keep the adaptive band:

```text
target balanced accuracy = 70–82%
```

Keep the rules:

```text
If >85% for two mini-blocks:
    increase one demand only.

If 70–82%:
    stay in the current band.

If 60–70%:
    repeat with slight support.

If <60%:
    reduce n-level, relation arity, speed, exposure demand or lure pressure.
```

But revise the interpretation:

```text
This is an adaptive training band.
It is not a cognitive-state classifier.
```

### 1.6 The mindware bridge

Keep the mindware bridge. It is one of the strongest features of the protocol because it prevents the task from collapsing into thin perceptual practice.

| Perceptual operation | Mindware script | Reasoning / strategic analogue |
|---|---|---|
| State n-back | “Which feature matters?” | identify the variable |
| Binding n-back | “What belongs with what?” | map roles, constraints, evidence |
| Relation n-back | “What changed, what stayed invariant?” | infer transformation |
| SR horizon | “Can this path still reach the goal?” | evaluate next move |
| Lure control | “What is tempting but wrong?” | inhibit misleading solution |
| Wrapper swap | “What is the same rule in the new surface?” | transfer the strategy |

Keep the micro-mission prompt:

```text
Today, when facing a task decision, pause and ask:
1. What is the current state?
2. Which variable changed?
3. What future state does this move make reachable?
4. What tempting move is actually a lure?
```

---

## 2. What needed revision

### 2.1 Remove “Zone / calibration block” language

Original wording such as:

```text
Zone / calibration block
Zone Check
Express / Zone Check
first 2 minutes are the Zone Check
```

should become:

```text
Entry Capacity Block
C-Control Block
Cognitive Bandwidth Check
CCC Micro-Test
```

The first block estimates C-Control in bits/sec. It does not classify state.

### 2.2 Remove MIND-state classification from this protocol

Remove or relocate language such as:

```text
feeds MIND_READY / MIND_FLAT detection
feeds MIND_LOCKED_IN vs MIND_IN_ZONE discrimination
criticality classifier
classifier dynamics under load
MIND_IN_ZONE
MIND_FLAT
MIND_LOCKED_IN
MIND_SPUN_OUT
```

These concepts may belong in a separate Zone / Flow app, but they should not be part of the IQ Coach relational WM protocol.

### 2.3 Remove the claim that the same trial series feeds both capacity and state routing

The revised statement is:

```text
The trial series feeds capacity modelling, adaptive difficulty, reliability checks and proof-dashboard summaries. It does not, within this protocol, assign readiness-state labels or route the user to reset, activation or widening exercises.
```

### 2.4 Drop simple gratings as a separate wrapper

The original three-wrapper model was:

```text
simple gratings
→ Gabor fields
→ optic flow
```

The revised two-wrapper model is:

```text
single Gabor / low-set-size Gabor
→ multi-patch Gabor field
→ optic-flow field
```

This reduces implementation complexity without losing the psychophysical baseline function.

### 2.5 Reframe the evidence evaluation

The evidence evaluation should be retained but made product-safe. The protocol is theoretically strong but should not imply proven broad far transfer.

Use:

```text
Evidence-informed
transfer-oriented
evidence-generating
component-specific measurement
far-transfer hypothesis
```

Avoid:

```text
proven IQ increase
guaranteed g enhancement
validated flow detection
objective neural criticality measure
broad far transfer already established
```

---

## 3. Revised canonical architecture

The revised protocol uses a two-wrapper implementation.

```text
Wrapper A: Gabor patch fields
Wrapper B: optic-flow patch fields
```

### 3.1 Gabor wrapper

Gabor fields provide the main measurement and training engine.

They support:

```text
C-Control / Cognitive Bandwidth
feature discrimination
state n-back
binding n-back
relation n-back
lure control
within-wrapper perturbation
```

Gabor features:

```text
orientation θ
spatial frequency / spacing f
optional contrast / coherence dimension
```

State vector:

```text
S_t = [θ_t, f_t]
```

Optional expanded state vector:

```text
S_t = [θ_t, f_t, c_t]
```

where `c_t` may represent contrast, luminance, clarity or coherence.

### 3.2 Optic-flow wrapper

Optic flow provides the dynamic transfer and SR-horizon wrapper.

It supports:

```text
flow state tracking
flow binding
relation-n-back under dynamic surface
successor prediction
path reachability
action-like transfer probes
```

Flow features:

```text
flow angle φ
speed v
optional expansion / contraction / rotation dimension
```

State vector:

```text
S_t = [φ_t, v_t]
```

Optional expanded state vector:

```text
S_t = [φ_t, v_t, e_t]
```

where `e_t` may represent expansion, contraction, coherence or global-flow type.

### 3.3 Wrapper-shift logic

The main wrapper transfer test is:

```text
Gabor relation
→ same hidden relation
→ optic-flow surface
```

Examples:

```text
orientation change → angle change
spacing change → speed change
conjunction in Gabor → conjunction in flow
successor path in Gabor → successor path in flow
```

The key question is:

```text
Can the learner recover the same relation after the surface changes?
```

This is the horizontal-transfer test.

---

## 4. Revised session design

### 4.1 Standard 15-minute session

```text
Minute 0–2
Entry Capacity Block
Single Gabor / low-set-size Gabor
No memory load
Output: C-Control / Cognitive Bandwidth in bits/sec

Minute 2–6
State / Binding Block
Gabor field
Output: State-WM and/or A-Bind

Minute 6–11
Relation / SR Block
Gabor field
Output: R-Bind and early S-Horizon

Minute 11–13
Wrapper Perturbation
Same hidden relation under optic-flow wrapper
Output: W-Recovery and transfer cost

Minute 13–15
Prompt / Micro-Mission
Explicit mindware bridge
Output: reflection, transfer intention, delayed re-use cue
```

### 4.2 What the first block does

The first block estimates:

```text
C-Control / Cognitive Bandwidth
bits/sec
accuracy-adjusted perceptual evidence throughput
```

It can support:

```text
difficulty calibration
entry-capacity tracking
separation of perceptual-control limits from WM/relation limits
proof-dashboard trends
```

It does not support, in this protocol:

```text
flow-state classification
MIND-state labels
reset / activate / widen routing
clinical or wellbeing recommendations
```

### 4.3 Micro-test mode

A short standalone version may exist inside IQ Coach, but it should be named carefully.

Use:

```text
Cognitive Bandwidth Check
C-Control Micro-Test
Entry Capacity Probe
```

Do not use:

```text
Zone Check
Flow Check
State Check
```

The micro-test gives:

```text
C-Control estimate
today's training band
comparison with recent baseline
reliability / timing flags
```

Example user-facing output:

```text
Your Cognitive Bandwidth is close to your recent baseline.
Recommended training band: Standard.
Today's next block: Change Tracking.
```

---

## 5. Revised scoring model

### 5.1 Trial demand

The trial demand model is retained, with C-Control made explicit:

```text
D_trial = (H_extract / ET)
        + α(H_state × n)
        + β(H_binding × n)
        + γ(H_relation × h)
        + δ(lure_pressure)
        + ε(wrapper_shift)
        + ζ(successor_surprisal × horizon)
```

Where:

```text
H_extract / ET
= perceptual-control demand

H_state × n
= feature maintenance demand

H_binding × n
= arbitrary binding demand

H_relation × h
= transformation-tracking demand

lure_pressure
= interference / false-alarm demand

wrapper_shift
= transfer cost between surfaces

successor_surprisal × horizon
= predictive path demand
```

### 5.2 Psychometric function

Use:

```text
P(correct) = chance + usable_range × sigmoid(θ_capacity − D_trial)
```

The fitted capacity should be estimated separately for each relevant subscale:

```text
C-Control
State-WM
A-Bind
R-Bind
S-Horizon
I-Lure
W-Recovery
```

### 5.3 C-Control calculation

A practical C-Control calculation can be:

```text
C-Control = accuracy-adjusted information extracted / adjusted response time
```

Correct for:

```text
chance level
lapse rate
response deadline
exposure time
trial timing contamination
frame drops
```

C-Control should be reported as:

```text
bits/sec
```

User-facing label:

```text
Cognitive Bandwidth
```

Technical label:

```text
C-Control / Ĉ
```

---

## 6. Revised adaptive progression

The adaptive progression remains mostly unchanged, but its interpretation changes.

### 6.1 Training band

```text
target balanced accuracy = 70–82%
```

This is a **training difficulty band**, not a Ψ-state diagnosis.

### 6.2 Demand rotation

Rotate demand across days or sessions:

```text
Day 1: speed / exposure
Day 2: feature discrimination
Day 3: n-back horizon
Day 4: binding load
Day 5: relation load
Day 6: lure pressure
Day 7: wrapper transfer
Day 8: SR horizon
```

This reduces the risk of narrow automation and encourages variable abstraction.

### 6.3 Progression rule

Increase only one demand dimension at a time.

Examples:

```text
increase exposure speed, but keep n constant
increase n-level, but keep feature gap stable
increase lure pressure, but keep wrapper stable
change wrapper, but hold relation type constant
increase successor horizon, but reduce lure pressure
```

This is important because the aim is to force controlled adaptation without making the task uninterpretable.

---

## 7. Revised evidence and plausibility evaluation

### 7.1 Overall evaluation

The revised protocol is theoretically coherent and more defensible than standard n-back training because it decomposes performance into separable layers:

```text
C-Control
feature hold
binding
relation tracking
successor prediction
lure resistance
wrapper recovery
```

It is stronger than generic brain training because it asks whether the learner can recover relations across wrappers and then bridge those relations into explicit mindware scripts.

However, the far-transfer claim remains the highest-risk part. The broader WM-training literature is not favourable to generic claims that working-memory training reliably improves fluid intelligence. Therefore the product should remain evidence-generating and proof-led.

### 7.2 Claim-by-claim evaluation

| Claim cluster | Plausibility | Evidence posture | Revision needed |
|---|---|---|---|
| C-Control as perceptual evidence throughput | Strong | psychophysically plausible | keep as bits/sec capacity measure |
| State n-back | Strong | well-established updating task | keep, but do not overclaim WM broadly |
| Binding n-back | Strong | strong fit with feature-binding and lure logic | keep lures central |
| Relation n-back | Moderate | theoretically strong, less directly validated | treat as key hypothesis |
| SR horizon | Moderate to speculative | strongest Trident-G target, weakest direct evidence | use evidence-generating language |
| Gabor as main engine | Strong | good psychophysical control | keep |
| Optic flow as action wrapper | Moderate | plausible but less validated for reasoning transfer | treat as later MVP |
| Multi-parameter scoring | Strong | methodologically superior | keep |
| Mindware bridge | Moderate | plausible transfer support | require delayed probes |
| Broad far transfer | High-risk | not yet established | do not claim as proven |

### 7.3 Most important validation prediction

The most important empirical prediction is:

```text
Improvement in relation-n-back and wrapper-recovery performance should mediate later improvement on untrained reasoning-transfer tasks.
```

A practical test would be:

```text
C-Control gain
→ State-WM gain
→ A-Bind / R-Bind gain
→ W-Recovery gain
→ reasoning-transfer improvement
→ delayed retention
```

If relation-level and wrapper-recovery improvements do not predict transfer-task gains, the far-transfer claim should be weakened.

### 7.4 Required proof architecture

The protocol should collect:

```text
trained-task performance
near-transfer variants
untrained wrapper variants
reasoning-transfer checks
delayed re-checks
self-reported real-world use
micro-mission completion
```

The proof question is not:

```text
Did the user get better at the trained task?
```

The proof question is:

```text
Did the trained relation survive changed wrappers, delayed re-use and a different reasoning context?
```

---

## 8. Revised MVP roadmap

### MVP 1 — Gabor C-Control + relational WM

Build first:

```text
single Gabor C-Control block
Gabor field state n-back
Gabor field binding n-back
Gabor field relation n-back
binding and relation lures
adaptive 70–82% training band
basic PS-RWC profile
```

User-facing outputs:

```text
Cognitive Bandwidth
Feature Hold
Pattern Binding
Change Tracking
Lure Resistance
Today's Training Band
```

Do not build yet:

```text
optic-flow SR horizon
state classifier
Zone routing
HRV
mind-body alignment
complex proof dashboard
```

### MVP 2 — Wrapper transfer

Add:

```text
optic-flow fields
same-relation wrapper swap
Gabor → flow recovery curve
W-Recovery metric
within-wrapper perturbations: layout, density, colour, masking
```

Core question:

```text
Can the same relation be recovered under a different surface?
```

### MVP 3 — SR horizon and path prediction

Add:

```text
successor-state prediction
trajectory → successor → target reachability
probabilistic successors
delayed probes
Path Prediction score
```

Core question:

```text
Can the current state still reach the target, and what future state becomes likely?
```

### MVP 4 — Mission bridge and proof

Add:

```text
mindware prompt bridge
micro-missions
delayed re-checks
reasoning-transfer pulse
proof dashboard summaries
```

Core question:

```text
Can the trained relation be used outside the perceptual task?
```

---

## 9. Revised product language

### 9.1 Use this language

```text
Cognitive Bandwidth
C-Control
attention control capacity
controlled evidence extraction
feature hold
pattern binding
change tracking
path prediction
lure resistance
wrapper recovery
adaptive training band
transfer-oriented training
proof-led training
```

### 9.2 Avoid this language inside IQ Coach

```text
Zone Check
flow detector
MIND_READY
MIND_IN_ZONE
MIND_FLAT
MIND_LOCKED_IN
MIND_SPUN_OUT
criticality classifier
mind-body alignment
reset / activate / widen routing
clinical state
neural criticality measure
```

### 9.3 Claims boundary

Use:

```text
IQ Coach is designed to train and measure component mechanisms of adaptive intelligence, including cognitive control capacity, relational working memory, transformation tracking and successor prediction.
```

Use:

```text
The protocol is evidence-generating. Transfer is tested through wrapper swaps, delayed probes and reasoning-transfer checks.
```

Avoid:

```text
IQ Coach is proven to raise IQ.
IQ Coach objectively detects flow.
IQ Coach diagnoses your cognitive state.
IQ Coach directly measures hippocampal successor representations.
```

---

## 10. Revised complete protocol summary

The clean implementation is:

```text
single Gabor / adapted MFT-M-style block
= C-Control / Cognitive Bandwidth
= controlled perceptual evidence throughput in bits/sec

Gabor patch fields
= main relational WM capacity and training engine
= feature hold, pattern binding, change tracking, lure resistance

Optic-flow fields
= dynamic SR horizon and action-like transfer wrapper
= path prediction, successor sampling, wrapper recovery

Mindware prompts
= explicit bridge from perceptual operations into reasoning and strategic action
```

The training stack is:

```text
controlled evidence extraction
→ variable abstraction
→ feature hold
→ pattern binding
→ transformation tracking
→ successor prediction
→ wrapper recovery
→ prompt-guided problem solving
→ real-world strategic action
→ delayed re-check
```

This is stronger than standard n-back because the aim is not simply to remember more items. The aim is to expand, differentiate and sample a relational state space under controlled demand, then test whether the resulting relations survive changed wrappers and delayed use.

---

## 11. Relationship to the separate Zone / Flow app

The separate Zone / Flow app can still exist, but it should now be architecturally distinct.

```text
IQ Coach
= capacity-profiled adaptive intelligence training

Zone / Flow
= readiness support, subjective flow check, reset / activation / widening, HRV/body-state integration
```

If the Zone / Flow app uses a short cognitive task, it should be validated and described separately. It should not be treated as the same thing as IQ Coach's C-Control task unless there is a deliberate shared-infrastructure design with separate outputs.

The same raw cognitive task family may technically be reused, but the interpretation must remain separate:

```text
In IQ Coach:
C-Control = capacity layer, bits/sec.

In Zone / Flow:
state estimate = readiness-support signal, requiring its own validation.
```

---

## 12. Final bottom line

Protocol Update 2 should be revised, but not discarded.

The strongest material to keep is:

```text
bit-step load definitions
four relational modes
multi-parameter scoring
adaptive band
mindware bridge
wrapper-recovery logic
SR-inspired path prediction
claims caution
```

The material to remove or relocate is:

```text
Zone Check framing
Express state check
MIND-state classifier
criticality routing
mind-body alignment
simple gratings as separate wrapper
claims implying objective flow detection
```

The revised product architecture is:

```text
C-Control
→ State-WM
→ A-Bind
→ R-Bind
→ S-Horizon
→ I-Lure
→ W-Recovery
→ Mindware bridge
→ delayed transfer proof
```

This makes Protocol Update 2 consistent with the new IQ Coach direction: the adapted MFT-M becomes a trainable **entry-layer intelligence measure** in bits/sec, while state/zone checking becomes a separate app rather than a routing layer inside the cognitive-training protocol.
