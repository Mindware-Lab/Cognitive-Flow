# IQ Coach Full App Specification

**Product:** IQ Coach
**Protocol basis:** Trident-G Far Transfer Protocol
**Spec status:** v0.2 naming-locked full-app specification
**Scope:** Full app architecture, shared graph engine, five core capacity games, transfer checks, benchmark measures, scoring, UX naming, data logging and claims boundary
**Core principle:** Use one shared conditional-probability graph engine across the cognitive stack, while measuring different cognitive operations at each layer.

---

# 1. Executive Summary

IQ Coach is a layered adaptive-intelligence training app designed to train, measure and track portable relational cognition.

The app trains five core capacities:

```text
Attention Control
→ Relational Memory
→ Binding Memory
→ Path Prediction
→ Reasoning
```

These are supported by a shared hidden graph engine. The graph is projected into different games:

```text
Relational Memory:
hold and compare graph-derived relations across delay

Binding Memory:
hold bound relation-colour-context states across delay

Path Prediction:
learn what usually follows and detect graph breaks

Reasoning:
recover the same graph relation in symbolic, nonsense-semantic and domain-semantic arguments
```

The user does not play unrelated mini-games. They encounter the same relational structure across multiple cognitive operations:

```text
extract the signal
→ hold the relation
→ bind the relation to context
→ predict from the relation
→ reason with the relation
→ recover it after wrapper change and delay
```

The app should not reward local game fluency alone. It should reward the capacity to extract, hold, bind, predict from and reason with relations across wrappers, lures, delay and external benchmarks.

---

# 2. Naming Standard

Use the following naming scheme everywhere in public UX.

| Layer | Technical capacity label   | Generic UX label  |
| ----- | -------------------------- | ----------------- |
| 1     | Attention Control Capacity | Attention Control |
| 2     | Relational WMC             | Relational Memory |
| 3     | Binding WMC                | Binding Memory    |
| 4     | Path Prediction Capacity   | Path Prediction   |
| 5     | Reasoning Capacity         | Reasoning         |

## 2.1 Public score cards

The five main public score cards are:

```text
Attention Control
Relational Memory
Binding Memory
Path Prediction
Reasoning
```

## 2.2 Deprecated public terms

Retire or demote these older public-facing names:

```text
Cognitive Bandwidth → Attention Control
Frame Bandwidth → Attention Control subscore or internal diagnostic
Frame Memory → Relational Memory
Majority Memory → Relational Memory subscore
Pattern Binding → Binding Memory
Successor Horizon Capacity → Path Prediction Capacity
ERRC / ERC → Reasoning Capacity
```

## 2.3 Internal / measurement terms

The following terms may remain in measurement documentation, model IDs, admin/debug views or raw estimate metadata:

```text
CCC / MFT-M model family
bits/sec
C_abs
C_rel
Frame Cost
relation-bit steps
transition-bit steps
binding-bit steps
S-Horizon
successor-bit steps
ERC / ERRC
fitted graph-reasoning capacity
```

## 2.4 Public score page copy

Use this approved copy:

```text
Today’s task profile

These provisional scores estimate how you performed across five core capacities: attention control, relational memory, binding memory, path prediction and reasoning. Stable personal baselines require repeated sessions.
```

For the full app, after sufficient repeated-session data:

```text
Your current training profile

These scores estimate your current profile across five core capacities: attention control, relational memory, binding memory, path prediction and reasoning. Scores are updated as your personal baseline becomes more stable.
```

---

# 3. Product Architecture

## 3.1 Five core layers

The full stack is:

```text
Layer 1:
Attention Control

Layer 2:
Relational Memory

Layer 3:
Binding Memory

Layer 4:
Path Prediction

Layer 5:
Reasoning
```

## 3.2 Transfer and proof layer

In addition to the five core capacities, the full app may include separate transfer and benchmark measures:

```text
Real-Life Transfer Check
Transfer Score
Matrix Reasoning Benchmark
```

These should be displayed separately from the five core capacities.

Recommended dashboard grouping:

```text
Core Capacities
1. Attention Control
2. Relational Memory
3. Binding Memory
4. Path Prediction
5. Reasoning

Transfer & Proof
6. Real-Life Transfer Check
7. Transfer Score
8. Matrix Reasoning Benchmark
```

## 3.3 Claims distinction

The five core capacities estimate app-native cognitive operations.

The transfer and benchmark measures test portability and external anchoring.

Do not present all scores as if they are the same type of measurement.

---

# 4. Shared Conditional-Probability Graph Engine

## 4.1 Core graph principle

The same Markov / conditional-probability graph can structure the Relational Memory, Binding Memory, Path Prediction and Reasoning games.

The task question changes by layer.

```text
Relational Memory:
Does the current graph-valid state, relation or edge match the one n trials back?

Binding Memory:
Does the current bound graph state match the one n trials back?

Path Prediction:
What usually comes next?
Did the graph just break?
Can this path still reach the target?

Reasoning:
What follows from the same graph when it is expressed in language?
```

## 4.2 Graph object

Each session or training block should be generated from a versioned graph object.

```json
{
  "graph_id": "chain_001",
  "graph_version": "0.2.0",
  "graph_class": "order_chain",
  "states": ["A", "B", "C", "D"],
  "transitions": {
    "A": {"B": 1.00},
    "B": {"C": 1.00},
    "C": {"D": 1.00}
  },
  "contexts": {},
  "wrappers": ["arrow", "optic_flow", "symbolic", "nonsense", "domain"],
  "lures": {},
  "difficulty": {},
  "reasoning_templates": []
}
```

For probabilistic path learning:

```json
{
  "graph_id": "path_001",
  "graph_version": "0.2.0",
  "graph_class": "probabilistic_path",
  "states": ["A", "B", "C", "D", "E"],
  "transitions": {
    "A": {"B": 0.80, "C": 0.20},
    "B": {"D": 0.90, "C": 0.10},
    "C": {"E": 0.90, "A": 0.10}
  },
  "contexts": {
    "K": {},
    "L": {}
  },
  "wrappers": ["arrow", "optic_flow", "symbolic", "nonsense", "domain"],
  "lures": {}
}
```

## 4.3 Conditional probability rules

For passive predictive graph learning:

```text
P(S_next | S_current)
```

For context-gated tasks:

```text
P(S_next | S_current, context)
```

Transition rows must sum to 1.

Missing directed edges mean probability zero.

## 4.4 Terminology rule

Use:

```text
predictive transition graph
probabilistic path graph
successor graph
graph-valid relation
graph-valid transition
```

Avoid:

```text
causal graph
```

unless the game includes interventions such as forcing, blocking or perturbing transitions.

---

# 5. Shared Stimulus Space

## 5.1 Core state grammar

Each visual state can be represented as:

```json
{
  "carrier": "arrow | optic_flow",
  "frame": "absolute | relational",
  "relation": "LEFT | RIGHT | UP | DOWN | OUT | IN | CW | CCW",
  "colour": "blue | yellow | green | purple",
  "context": "K | L | null"
}
```

## 5.2 Stimulus carriers

### Arrow carrier

Use for:

```text
Attention Control
Relational Memory
Binding Memory
early graph-WM
initial wrapper blocks
```

Strengths:

```text
psychometrically clean
fast to render
binary-opposite friendly
easy to score
good for timing-sensitive capacity estimation
```

### Optic-flow carrier

Use for:

```text
Path Prediction
predictive streams
future-state learning
trajectory-like reasoning
later wrapper transfer
```

Strengths:

```text
naturally dynamic
supports approach / retreat / rotation / expansion / contraction
fits future-state prediction
bridges to action-like inference
```

### Optional Gabor carrier

The Gabor carrier may be retained as an intermediate research wrapper.

Possible role:

```text
bridge between static arrows and optic flow
```

Do not make Gabor mandatory in the full app unless needed for a specific training or validation route.

## 5.3 Reference frames

Use two core geometrical frames.

### Frame 1 — absolute / Cartesian

Relation axes:

```text
left / right
up / down
```

### Frame 2 — relational / polar

Relation axes:

```text
out / in
clockwise / anticlockwise
```

Later extensions:

```text
spiral out / spiral in
diagonal A / diagonal B
mixed absolute + polar wrappers
```

## 5.4 Colour

Colour is used as a binding and context dimension.

Examples:

```text
same relation, different colour
same colour, different relation
colour-gated transition
colour-context rule
relation × colour conjunction
relation × colour × context conjunction
```

Colour should initially be irrelevant in early Attention Control blocks, then become progressively relevant in Relational Memory, Binding Memory, Path Prediction and Reasoning.

---

# 6. Relation Families

The same four graph classes organise Relational Memory, Binding Memory, Path Prediction and Reasoning.

## 6.1 Order / Chain

Graph form:

```text
A → B → C → D
```

Relational Memory task:

```text
Does the current graph-valid state, relation or edge match n-back?
```

Binding Memory task:

```text
Does the current bound chain state match n-back?
```

Path Prediction task:

```text
Is this transition expected?
Can A reach C?
Can A reach D?
```

Reasoning task:

```text
A > B
B > C
Therefore A > C
```

Core cognitive demand:

```text
ordered relation maintenance and transitive inference
```

## 6.2 Transformation / Analogy

Graph form:

```text
blue-IN → blue-CW
green-IN → green-CW
purple-IN → purple-CW
```

Hidden relation:

```text
same operator applies across surfaces
```

Relational Memory task:

```text
Did the same transformation occur n-back?
```

Binding Memory task:

```text
Did the same transformation occur with the same bound colour/context?
```

Path Prediction task:

```text
Which transformation is expected next?
Is this the same change under a new wrapper?
```

Reasoning task:

```text
A changes to B in the same way that C changes to D.
```

Core cognitive demand:

```text
same-change abstraction across state surfaces
```

## 6.3 Context / Constraint

Graph form:

```text
If context K:
A → B

If context L:
A → C
```

Relational Memory task:

```text
Does the current context-bound relation match n-back?
```

Binding Memory task:

```text
Does the current relation-colour-context conjunction match n-back?
```

Path Prediction task:

```text
Was this transition valid under the current colour or context?
```

Reasoning task:

```text
If context K, A leads to B.
Context K is active.
A occurred.
Therefore B follows.
```

Core cognitive demand:

```text
context-gated relation selection and constraint reasoning
```

## 6.4 Probabilistic Path

Graph form:

```text
P(B | A) = .80
P(C | A) = .20
P(D | B) = .90
P(E | C) = .90
```

Relational Memory task:

```text
Hold and compare path states, edges or transition fragments across delay.
```

Binding Memory task:

```text
Hold bound path states or context-specific path fragments across delay.
```

Path Prediction task:

```text
Which next state is more likely?
Was the current transition rare, invalid or expected?
Can the current path still reach the target?
```

Reasoning task:

```text
A usually leads to B.
B usually leads to D.
A sometimes leads to C.
C leads to E.
Therefore D is more likely, but E remains possible.
```

Core cognitive demand:

```text
future-state prediction, reachability and likelihood reasoning
```

---

# 7. Layer 1 — Attention Control

## 7.1 Technical capacity label

```text
Attention Control Capacity
```

## 7.2 Generic UX label

```text
Attention Control
```

## 7.3 Internal model family

```text
CCC / MFT-M / adaptive CCC model family
C_abs
C_rel
Frame Cost
Timing Quality
```

## 7.4 Unit

```text
bits/sec
```

## 7.5 Construct

Attention Control estimates how efficiently the user extracts the target relation from a brief, masked, noisy display.

It answers:

```text
How efficiently can the user extract the signal relation under time pressure?
```

## 7.6 Stimuli

Use arrow displays as the primary implementation.

Display:

```text
5 arrows around a centre
brief exposure
mask
binary response
```

## 7.7 Task families

### Absolute attention control

Binary-opposite wrappers:

```text
left vs right
up vs down
diagonal A vs diagonal B later
```

### Relational / polar attention control

Binary-opposite wrappers:

```text
out vs in
clockwise vs anticlockwise
spiral out vs spiral in later
```

## 7.8 Trial structure

```text
fixation
brief arrow display
mask
response window
feedback
next trial
```

## 7.9 Adaptive variables

```text
exposure duration
majority ratio: 5:0, 4:1, 3:2
wrapper type
mask timing
mixed-wrapper status
device timing quality
```

## 7.10 Demand model

For masked majority trials:

```text
D_ACC =
  H_extract / ET_adjusted
+ wrapper_cost
+ frame_cost
+ lure_cost
```

Where:

```text
H_extract = entropy/information demand of the majority condition
ET_adjusted = actual frame-counted exposure duration
```

For five-item majority displays, store configurable entropy estimates by majority ratio:

```text
5:0
4:1
3:2
```

Do not hard-code final values permanently. Treat them as calibration-table values.

## 7.11 Scoring

For each wrapper:

```text
AttentionControl_wrapper =
accuracy-adjusted information extracted / adjusted exposure time
```

Recommended internal subscores:

```text
ACC_absolute
ACC_relational
Frame Cost = ACC_absolute − ACC_relational
Frame Efficiency = ACC_relational / ACC_absolute
Wrapper Recovery
Mixed-Wrapper Stability
Timing Quality
```

## 7.12 Bottleneck interpretation

Possible bottleneck signatures:

```text
low absolute + low relational:
basic controlled extraction bottleneck

normal absolute + low relational:
frame-relative extraction bottleneck

good blocked-wrapper scores + poor mixed-wrapper scores:
wrapper-recovery bottleneck
```

## 7.13 User-facing feedback

Example:

```text
Attention Control
3.4 bits/sec
Confidence: calibrating
Current focus: extracting the signal under time pressure
```

---

# 8. Layer 2 — Relational Memory

## 8.1 Technical capacity label

```text
Relational WMC
```

## 8.2 Generic UX label

```text
Relational Memory
```

## 8.3 Internal metrics

```text
relWMC
RWM_clean
RWM_uncertain
RWM_transition
```

## 8.4 Unit

```text
relation-bit steps
transition-bit steps
```

## 8.5 Construct

Relational WMC estimates the user’s ability to hold, update and compare relation tokens or graph-valid transition tokens across delay.

It answers:

```text
Can the user maintain the relevant relation across n-back delay while resisting lures?
```

## 8.6 Task logic

The graph is the stimulus generator and lure engine.

The user is not primarily predicting the next state. They are maintaining and comparing a graph-derived token across delay.

```text
Path Prediction:
learn P(S_next | S_current)

Relational Memory:
hold S_t, relation_t or edge_t and compare it with item t − n
```

## 8.7 Task modes

### Mode A — State n-back

Question:

```text
Does the current graph-valid state match the state n-back?
```

Example:

```text
t1: A
t2: B
t3: A

2-back:
A matches A
```

### Mode B — Relation-token n-back

Question:

```text
Does the current relation token match the relation n-back?
```

Example:

```text
t1: OUT
t2: CW
t3: OUT

2-back:
OUT matches OUT
```

### Mode C — Majority relation n-back

Each trial requires extraction first.

Example:

```text
Trial 1:
5 arrows, 3 OUT / 2 IN
latent relation = OUT

Trial 2:
5 arrows, 4 IN / 1 OUT
latent relation = IN

Trial 3:
5 arrows, 3 OUT / 2 IN
latent relation = OUT
```

At 2-back:

```text
Trial 3 matches Trial 1
```

### Mode D — Edge / transition n-back

This is the strongest bridge into Path Prediction.

Question:

```text
Does the current graph edge match the edge n-back?
```

Example:

```text
t1: A→B
t2: B→C
t3: A→B

2-back:
A→B matches A→B
```

## 8.8 Information demand

For relation-token n-back:

```text
H_relation = log2(number of active relation categories)
```

Examples:

```text
IN / OUT:
H_relation = 1 bit

IN / OUT / CW / CCW:
H_relation = 2 bits
```

Memory load:

```text
relWMC_load = H_relation × n
```

For transition n-back:

```text
H_transition = log2(number of active graph-valid transitions)
```

or, when probabilities are used:

```text
H_transition = -log2 P(edge)
```

Then:

```text
transitionWMC_load = H_transition × n
```

## 8.9 Majority relation demand

For majority n-back:

```text
D_relWMC_uncertain =
  H_extract / ET_adjusted
+ α(H_relation × n)
+ β(lure_pressure)
+ γ(wrapper_shift)
+ δ(graph_validity_cost)
```

## 8.10 Lure taxonomy

```text
valid non-match
wrong-lag lure
same-feature lure
same-relation wrong-wrapper lure
invalid graph edge
rare-but-valid edge
wrong-context gate
same-successor lure
```

Important rule:

```text
target = graph-valid and n-back matching
non-target ≠ noise
noise = whatever should not control the response on this trial
```

## 8.11 Scoring

Primary fitted score:

```text
relWMC = θ_relWMC
```

Operational estimate:

```text
Relational WMC =
maximum relation-bit-step or transition-bit-step demand sustained at criterion
```

Criterion:

```text
balanced accuracy in target band
false alarms within acceptable range
misses within acceptable range
minimum scorable trials met
```

## 8.12 User-facing feedback

Example:

```text
Relational Memory
6 relation-bit steps
Best stable level: 4-category 3-back
Confidence: moderate
Current focus: wrong-lag lures
```

---

# 9. Layer 3 — Binding Memory

## 9.1 Technical capacity label

```text
Binding WMC
```

## 9.2 Generic UX label

```text
Binding Memory
```

## 9.3 Internal metrics

```text
bindWMC
A-Bind
C-Bind
R-Bind
```

## 9.4 Unit

```text
binding-bit steps
```

## 9.5 Construct

Binding WMC estimates the user’s ability to maintain bound feature states over delay.

It answers:

```text
Can the user remember what belongs with what?
```

## 9.6 Bound state definition

A bound state can be:

```text
relation × colour
relation × colour × context
carrier × relation × colour
state × transition role
edge × context
```

Example:

```text
OUT + blue
CW + yellow
LEFT + green
IN + purple
```

## 9.7 Task mode — binding n-back

Question:

```text
Does the current bound state match the bound state n-back?
```

Example:

```text
t1: blue + OUT
t2: yellow + CW
t3: blue + OUT

2-back:
match
```

## 9.8 Information demand

If there are 4 relation categories and 4 colours:

```text
state_count = 4 × 4 = 16
H_bound_state = log2(16) = 4 bits
```

Binding memory load:

```text
bindWMC_load = H_bound_state × n
```

Examples:

```text
1-back = 4 binding-bit steps
2-back = 8 binding-bit steps
3-back = 12 binding-bit steps
```

If context is included:

```text
H_bound_state = log2(|relations × colours × contexts|)
```

## 9.9 Trial demand

```text
D_bindWMC =
  α(H_bound_state × n)
+ β(partial_match_lure)
+ γ(swap_lure)
+ δ(wrong_context_lure)
+ ε(wrapper_shift)
+ ζ(delay)
```

## 9.10 Diagnostic lures

```text
same relation, wrong colour
same colour, wrong relation
correct state, wrong context
correct colour, wrong graph role
swap lure
wrong-lag conjunction
wrapper-shifted conjunction lure
```

## 9.11 Scoring

Primary fitted score:

```text
bindWMC = θ_bindWMC
```

Operational estimate:

```text
Binding WMC =
maximum binding-bit-step demand sustained at criterion
```

Criterion:

```text
balanced accuracy in target band
partial-match false alarms below threshold
swap-lure false alarms below threshold
minimum trial count met
```

## 9.12 Bottleneck interpretation

Possible bottleneck signatures:

```text
good Relational WMC + low Binding WMC:
binding bottleneck

high partial-match false alarms:
feature memory without stable binding

high swap-lure errors:
role/filler binding instability

good binding in arrows + poor binding in optic flow:
carrier-specific binding cost
```

## 9.13 User-facing feedback

Example:

```text
Binding Memory
8 binding-bit steps
Confidence: calibrating
Current focus: relation-colour binding
```

---

# 10. Layer 4 — Path Prediction

## 10.1 Technical capacity label

```text
Path Prediction Capacity
```

## 10.2 Generic UX label

```text
Path Prediction
```

## 10.3 Internal metrics

```text
PPC
S-Horizon
S-Horizon_theta
```

## 10.4 Unit

```text
successor-bit steps
steps ahead
```

## 10.5 Construct

Path Prediction Capacity estimates how far ahead the user can use a learned transition graph.

It answers:

```text
Can the user learn what usually follows, what is reachable, and what violates the graph?
```

## 10.6 Gameplay principle

In Path Prediction, the graph is the thing the user is learning.

The central questions are:

```text
What usually comes next?
Did the graph just break?
Can this path still reach the target?
```

The Path Prediction layer uses continuous gameplay rather than constant questioning. Most trials are passive predictive exposure. User responses are sparse and diagnostic.

## 10.7 Main mode — press on unexpected

User instruction:

```text
Press when the next stimulus does not fit what usually happens.
```

Trial outcomes:

```text
Hit:
keypress on invalid or unexpected target

Miss:
no keypress on invalid or unexpected target

False alarm:
keypress on expected or valid transition

Correct rejection:
no keypress on expected or valid transition
```

Trial types:

```text
expected transition
rare-valid transition
invalid transition
wrong-context transition
blocked-path event
wrapper-shifted valid transition
```

Important scoring distinction:

```text
rare-valid transition ≠ invalid transition
```

## 10.8 Probe mode — more likely next

Example:

```text
Current state: A
Which is more likely next?
B or C
```

This trains:

```text
conditional probability comparison
successor expectation
branch strength discrimination
```

## 10.9 Probe mode — reachability

Example:

```text
Current path: A→C
Target: D
Can this path still reach D?
```

Response options:

```text
yes
no / blocked
cannot tell
```

## 10.10 Probe mode — likely / rare / impossible

Example:

```text
A→C occurred.
Was this transition likely, rare or impossible?
```

This trains the distinction between:

```text
likely
possible
rare
blocked
counterfactual
```

## 10.11 Successor surprisal

One-step successor surprisal:

```text
successor_surprisal =
-log2 P(S_next | S_current, context)
```

For horizon-k paths:

```text
D_PPC_k =
Σ over i=1..k [-log2 P(S_t+i | S_t+i-1, context)]
```

Optional discounting:

```text
D_PPC_k =
Σ γ^(i-1) × [-log2 P(S_t+i | S_t+i-1, context)]
```

## 10.12 Trial demand

```text
D_PPC =
  successor_surprisal
+ α(horizon_length)
+ β(branching_factor)
+ γ(probability_contrast_cost)
+ δ(rare_valid_lure)
+ ε(invalid_edge_lure)
+ ζ(blocked_path_cost)
+ η(context_gate_cost)
+ θ(wrapper_shift)
```

## 10.13 Scoring

Primary fitted score:

```text
PPC = θ_PPC
```

Operational horizon score:

```text
S-Horizon =
maximum future step k where performance ≥ criterion
```

Recommended criteria:

```text
expected-transition correct rejection adequate
invalid-transition hit rate adequate
false-alarm rate controlled
rare-valid discrimination above threshold
reachability probes above criterion
```

## 10.14 Submeasures

```text
Unexpected Detection
Rare-Valid Discrimination
Reachability Accuracy
Blocked-Path Detection
Context-Gated Prediction
Wrapper Recovery
Delayed Path Prediction Recovery
```

## 10.15 Bottleneck interpretation

Possible bottleneck signatures:

```text
good Binding WMC + poor Path Prediction:
successor-map bottleneck

good one-step prediction + poor two-step prediction:
horizon bottleneck

high false alarms on rare-valid transitions:
rare vs invalid discrimination bottleneck

good visual Path Prediction + poor Reasoning:
explicit graph recovery bottleneck
```

## 10.16 User-facing feedback

Example:

```text
Path Prediction
2-step horizon
Confidence: moderate
Current focus: rare vs blocked paths
```

---

# 11. Layer 5 — Reasoning

## 11.1 Technical capacity label

```text
Reasoning Capacity
```

## 11.2 Generic UX label

```text
Reasoning
```

## 11.3 Internal metrics

```text
RC
ERC
ERRC
Reasoning_theta
```

## 11.4 Unit

```text
fitted graph-reasoning capacity
reasoning demand level
```

## 11.5 Construct

Reasoning Capacity estimates the user’s ability to recover and use the same graph relation in explicit symbolic, nonsense-semantic and meaningful domain forms.

It answers:

```text
Can the user reason explicitly with the same relation learned in the graph stack?
```

## 11.6 Reasoning wrappers

Use three main wrappers.

```text
symbolic
nonsense-semantic
domain-customised semantic
```

### Symbolic example

```text
A > B
B > C
Therefore A > C
```

### Nonsense-semantic example

```text
The flarn outranks the nidge.
The nidge outranks the borp.
Therefore the flarn outranks the borp.
```

### Domain-semantic example

```text
Plan A is safer than Plan B.
Plan B is safer than Plan C.
Therefore Plan A is safer than Plan C.
```

## 11.7 Domain customisation

Domain-semantic reasoning can be adapted to market or user segment.

Examples:

```text
symbolic / numeric for mathematics and STEM
professional scenarios for knowledge workers
study scenarios for students
evidence-sensitive reframing for wellbeing or CBT-adjacent segments
sport / performance scenarios
```

Important boundary:

```text
CBT-adjacent content must be framed as evidence-sensitive reframing or appraisal reasoning, not therapy, diagnosis or treatment.
```

## 11.8 Response formats

```text
Valid / Invalid / Cannot tell
Same relation / Different relation
Likely / Unlikely / Cannot tell
On path / Blocked / Cannot tell
Best conclusion: A / B / C / Cannot tell
```

## 11.9 Graph-derived demand model

```text
D_reasoning =
  α(GraphDistance)
+ β(PremiseCount)
+ γ(RelationCount)
+ δ(IdentityBindingCount)
+ ε(ContextGateCount)
+ ζ(BranchingEntropy)
+ η(LurePressure)
+ θ(WrapperDifficulty)
+ ι(ResponseSetComplexity)
+ κ(Delay)
```

Information-theoretic components can include:

```text
BranchingEntropy =
-Σ P(S_next | S_current) log2 P(S_next | S_current)

ConclusionSurprisal =
-log2 P(conclusion | premises)

H_response =
log2(number of response options)
```

## 11.10 Scoring

Primary fitted score:

```text
Reasoning Capacity = θ_reasoning
```

Fit:

```text
P(correct) =
chance + usable_range × sigmoid(θ_reasoning − D_reasoning)
```

Subscales:

```text
Reasoning_Order
Reasoning_Transform
Reasoning_Constraint
Reasoning_Path
Reasoning_Mixed
Reasoning Lure Resistance
Reasoning Wrapper Recovery
Delayed Reasoning Recovery
```

## 11.11 Relation families in reasoning

### Order / Chain

```text
A > B
B > C
Therefore A > C
```

Core demand:

```text
graph distance
premise count
transitive links
cannot-tell lures
```

### Transformation / Analogy

```text
A changes to B in the same way C changes to D.
```

Core demand:

```text
same-change abstraction
operator identity
surface-change resistance
```

### Context / Constraint

```text
If context K, A leads to B.
Context K is active.
A occurred.
Therefore B follows.
```

Core demand:

```text
context gate
condition sufficiency
missing-condition lures
```

### Probabilistic Path

```text
A usually leads to B.
B usually leads to D.
A sometimes leads to C.
C leads to E.
Therefore D is more likely, but E remains possible.
```

Core demand:

```text
probability comparison
reachability
rare vs impossible
counterfactual path separation
```

## 11.12 Bottleneck interpretation

Possible bottleneck signatures:

```text
good Path Prediction + poor Reasoning:
visual graph learned but explicit reasoning transfer weak

good symbolic + poor nonsense:
semantic unfamiliarity or form recovery cost

good symbolic + poor domain:
applied wrapper transfer bottleneck

high false acceptance of cannot-tell lures:
over-inference bottleneck
```

## 11.13 User-facing feedback

Example:

```text
Reasoning
Level 5
Confidence: moderate
Strongest family: Order / Chain
Current focus: Context / Constraint
```

---

# 12. Global Fitted-Capacity Model

## 12.1 Common model form

All app-native core measures may use a common fitted-capacity form:

```text
P(correct) =
chance + usable_range × sigmoid(θ_layer − D_trial)
```

Where:

```text
θ_layer = fitted user capacity for that layer
D_trial = objective demand of the trial
```

General demand form:

```text
D_trial =
  information demand
+ memory demand
+ binding demand
+ graph distance
+ successor surprisal
+ context-gate cost
+ lure pressure
+ wrapper shift cost
+ delay cost
+ timing penalty
```

Each layer uses a different subset of this model.

## 12.2 Evidence tiers

Every measurement model must store an evidence tier.

```text
direct_published_model
adapted_published_model
principled_extension
internal_calibration
exploratory_composite
```

Suggested mapping:

```text
Attention Control Capacity:
direct_published_model / adapted_published_model

Relational WMC:
principled_extension

Binding WMC:
principled_extension

Path Prediction Capacity:
principled_extension

Reasoning Capacity:
internal_calibration

Transfer Score:
exploratory_composite

Real-Life Transfer Check:
self-report application evidence

Matrix Reasoning Benchmark:
external benchmark
```

## 12.3 MeasurementModelRegistry fields

Each score model should store:

```text
model_id
model_version
public_label
technical_label
evidence_tier
unit
demand_formula
fit_method
standard_error_method
confidence_label_rules
calibration_table_version
created_at
retired_at
```

Model versions are immutable once used in production.

Any model change creates a new model version.

Old raw trials may be rescored under a new model, but old score records must remain preserved.

---

# 13. Confidence Labels

Every score should have a confidence label.

Allowed labels:

```text
insufficient data
calibrating
moderate confidence
high confidence
timing limited
unstable estimate
```

Confidence depends on:

```text
number of trials
number of sessions
standard error
timing quality
internal consistency
recent volatility
lure balance
wrapper coverage
device stability
```

Do not show precise standardised scores or percentiles unless calibration data supports them.

---

# 14. Transfer and Benchmark Measures

## 14.1 Real-Life Transfer Check

User-facing:

```text
Real-Life Transfer Check
```

Internal:

```text
RLT
ApplicationTransfer
TransferSelfReport
```

Unit:

```text
Likert-scale composite
change score
```

Construct:

```text
Does the user report applying trained cognitive operations outside the app?
```

RLT is not a hard capacity measure. It is subjective application evidence.

Prompt stem:

```text
Over the past 7 days, I noticed myself...
```

Example items:

```text
spotting patterns or rules more quickly in work, study or daily tasks
holding several parts of a problem in mind without losing the structure
noticing when a tempting answer or explanation did not quite fit
predicting what might happen next before acting
checking whether a conclusion really followed from the evidence
transferring a strategy from the app to a real task
recovering a useful way of thinking after a delay
adapting when the same problem appeared in a different format
```

Use this boundary:

```text
Your responses suggest whether you are noticing app-related strategies in real tasks.
This is subjective application evidence, not a standalone proof of cognitive change.
```

## 14.2 Transfer Score

User-facing:

```text
Transfer Score
```

Alternative:

```text
Cognitive Performance Transfer Index
```

Internal:

```text
FTC
TransferComposite
```

Construct:

```text
Do trained relations survive surface change, delay, interference and explicit reasoning transfer?
```

It should not mean:

```text
general brain score
full IQ score
guaranteed real-world transfer
```

Minimum data requirements:

```text
at least 5 usable sessions
at least 2 relation families
at least 2 wrapper shifts
at least 1 delayed re-check
minimum confidence for at least 3 core capacity measures
```

Candidate components:

```text
Wrapper Recovery
Delayed Recovery
Path-Prediction-to-Reasoning Recovery
Lure Resistance
Mixed-Wrapper Performance
Real-Life Transfer Check
Matrix Reasoning Trend
```

Capacity scores and transfer scores are not the same.

```text
Attention Control, Relational WMC, Binding WMC, Path Prediction Capacity, Reasoning Capacity:
how much structured information the user can handle

Transfer Score:
how well that structure survives transfer tests
```

## 14.3 Matrix Reasoning Benchmark

User-facing:

```text
Matrix Reasoning Benchmark
```

Internal:

```text
MRB
MatricesTheta
MatrixBenchmarkScore
```

Construct:

```text
How does the user perform on a separate matrix reasoning test before and after training?
```

MRB should not be treated as the same thing as Transfer Score.

Recommended design:

```text
short forms
non-overlapping forms where possible
pre-training form
post-training form
follow-up form
```

Core outputs:

```text
raw correct
theta estimate
standard error
sample-norm standard score
percentile only if norm group is large enough
```

Display rules:

```text
n < 30:
do not show normed score

30 ≤ n < 100:
show sample calibration only

n ≥ 100:
show provisional sample norm

n ≥ 300:
show moderate-confidence sample norm

n ≥ 1000:
show stronger norm bands, still labelled sample norms unless representative sampling exists
```

Claims boundary:

```text
This is a matrix reasoning benchmark used to track performance outside the training games.
```

Avoid:

```text
This is your official IQ.
This proves your IQ changed.
This is a clinical or diagnostic test.
```

---

# 15. Standardisation and Norming

## 15.1 Personal baselines

Create a personal baseline after:

```text
3–5 usable sessions
```

Store:

```text
user_mean
user_sd
rolling_7_session_average
best_recent_score
recent_slope
volatility
confidence_label
```

## 15.2 Population norms

Norm groups may include:

```text
age band
device class
input method
language
training exposure level
session count band
```

Minimum display threshold:

```text
do not show population percentile if group n < 100
```

## 15.3 Standard score conversion

For stable metrics:

```text
standard_score =
100 + 15 × ((score − norm_mean) / norm_sd)
```

For early or low-confidence estimates:

```text
show bands before precise percentiles
```

Example bands:

```text
calibrating
emerging
standard
strong
advanced
```

---

# 16. Bottleneck Logic

A bottleneck is not a diagnosis.

A bottleneck is:

```text
a layer that appears to constrain downstream performance relative to the user’s own profile and current norm group
```

## 16.1 Basic bottleneck rule

Flag a potential bottleneck when:

```text
layer score is low relative to personal baseline
AND/OR low relative to population norm
AND downstream scores are suppressed
AND upstream scores are adequate
AND error signatures match the layer
```

## 16.2 Bottleneck patterns

### Attention Control bottleneck

Pattern:

```text
low Attention Control
low Relational Memory
unstable Binding Memory / Path Prediction
```

Interpretation:

```text
signal extraction may be limiting the whole stack
```

### Relational Memory bottleneck

Pattern:

```text
adequate Attention Control
low Relational Memory
wrong-lag lure errors
```

Interpretation:

```text
relations may not survive delay and interference
```

### Binding Memory bottleneck

Pattern:

```text
adequate Relational Memory
low Binding Memory
partial-match errors
```

Interpretation:

```text
features may be remembered separately but not bound reliably
```

### Path Prediction bottleneck

Pattern:

```text
adequate Binding Memory
low Path Prediction
good immediate transitions but poor 2-step reachability
```

Interpretation:

```text
the user may track local states but not future paths
```

### Reasoning bottleneck

Pattern:

```text
adequate Path Prediction
low Reasoning
high cannot-tell or semantic wrapper errors
```

Interpretation:

```text
graph learning may not be transferring into explicit reasoning
```

### Transfer bottleneck

Pattern:

```text
good app scores
low wrapper recovery
low delayed recovery
low Real-Life Transfer Check
flat Matrix Reasoning Benchmark trend
```

Interpretation:

```text
local game performance may not yet be portable
```

## 16.3 Cautious wording

Use:

```text
Potential bottleneck
Likely bottleneck
Current training focus
This layer may be limiting later performance
```

Avoid:

```text
deficit
impairment
diagnosis
brain weakness
```

---

# 17. Adaptive Progression

## 17.1 General adaptation principle

Increase only one difficulty dimension at a time.

Possible dimensions:

```text
exposure speed
n-back level
relation alphabet size
state alphabet size
bound state space
transition alphabet size
branching factor
transition entropy
probability contrast
horizon length
premise count
inference links
lure pressure
wrapper mixing
delay
```

Do not increase several at once unless deliberately running a benchmark challenge.

## 17.2 Target training band

Use:

```text
70–82% balanced accuracy
```

as the main adaptive training band.

Rules:

```text
>85% for two mini-blocks:
increase one demand dimension

70–82%:
stay in current band

60–70%:
repeat with slight support or slower timing

<60%:
reduce load
```

## 17.3 Wrapper cycle

The stack should follow:

```text
train wrapper A
→ detect flattening
→ switch to wrapper B
→ expect temporary dip
→ train recovery
→ mix A+B
→ switch to wrapper C
→ mix A+B+C
→ delayed re-check
```

This applies to:

```text
Attention Control wrappers
Relational Memory wrappers
Binding Memory wrappers
Path Prediction visual wrappers
Reasoning semantic wrappers
```

---

# 18. Full App Session Structure

## 18.1 Core training session

Target duration:

```text
15–20 minutes
```

Recommended structure:

```text
1. Attention Control warm-up / capacity estimate
2. Relational Memory adaptive n-back
3. Binding Memory adaptive n-back
4. Path Prediction stream
5. Reasoning bridge
6. short score summary
```

Example 18-minute split:

```text
Attention Control: 3 min
Relational Memory: 4 min
Binding Memory: 3 min
Path Prediction: 5 min
Reasoning: 3 min
```

## 18.2 Benchmark session

Every:

```text
5–7 sessions
```

Purpose:

```text
update profile
measure wrapper recovery
measure delayed recovery
test relation-family transfer
refresh capacity estimates
```

Should include:

```text
mixed relation families
mixed wrappers
delayed items from prior sessions
lure-controlled blocks
reasoning bridge items
optional Matrix Reasoning Benchmark
Real-Life Transfer Check
```

## 18.3 Relation-family cycle

A full training pathway should rotate through:

```text
order_chain
transformation_analogy
context_constraint
probabilistic_path
mixed review
```

The app may focus on one graph family per session, then run mixed-wrapper and mixed-family checks at benchmark intervals.

---

# 19. Data and Logging

## 19.1 Core tables

Recommended Supabase tables:

```text
iqc_participants
iqc_session_attempts
iqc_sessions
iqc_graph_specs
iqc_trials
iqc_capacity_estimates
iqc_reasoning_templates
iqc_matrix_attempts
iqc_transfer_check_responses
iqc_score_snapshots
iqc_bottleneck_flags
iqc_adaptive_recommendations
```

## 19.2 Attempt states

Allowed attempt states:

```text
started
submitted
scored
void
duplicate
```

`iqc_session_attempts` fields:

```text
attempt_id
participant_id
session_id
status
idempotency_key
started_at
submitted_at
scored_at
```

## 19.3 Shared trial fields

All trials should store:

```text
user_id
session_id
attempt_id
block_id
trial_index
layer
measure_target
relation_family
graph_id
state_id
edge_id
current_wrapper
stimulus_carrier
frame
relation
colour
context
target_status
lure_type
response
correct_response
is_correct
rt_ms
exposure_ms_requested
exposure_ms_actual
difficulty_parameters
adaptive_state
timing_quality
created_at
```

## 19.4 Timing metadata

Log timing fields on all Attention Control and speed-sensitive trials:

```text
device_refresh_rate_estimate
actual_stimulus_frames
actual_exposure_ms
dropped_frame_count
visibility_change_flag
input_method
browser
viewport_size
device_pixel_ratio
timing_quality
```

Trials with poor timing quality remain in raw data but are excluded from high-confidence Attention Control estimates.

## 19.5 Capacity estimate fields

`iqc_capacity_estimates` should store:

```text
user_id
session_id
attempt_id
measure_id
metric_name
public_label
technical_label
model_id
model_version
evidence_tier
theta_estimate
raw_score
objective_capacity
standard_score
standard_error
confidence_label
wrapper_id
relation_family
norm_group_id
personal_z
population_z
trial_count
timing_quality
created_at
```

## 19.6 Server-side scoring

Client-side scores are display-only during play.

The canonical estimate is produced or verified server-side.

Rule:

```text
Client computes live feedback only.
Server stores raw trials and produces the canonical estimate.
```

Store raw trials and derived estimates separately so models can be recalibrated later without losing provenance.

---

# 20. Reasoning Template Versioning

Reasoning items must be template-backed and reviewable.

Fields:

```text
reasoning_template_id
reasoning_template_version
graph_class
wrapper_type
domain
premise_count
inference_links
lure_type
correct_response
review_status
```

Allowed review statuses:

```text
drafted
human_reviewed
approved
retired
```

No unreviewed LLM-generated reasoning items should appear in the public app.

---

# 21. Dashboard UX

## 21.1 Main pathway display

The full dashboard should show the five core capacities in a vertical stack:

```text
Attention Control
↓
Relational Memory
↓
Binding Memory
↓
Path Prediction
↓
Reasoning
```

Potential bottlenecks should be shown between the layers.

Each layer should show:

```text
objective capacity
standardised score, when supported
confidence label
current trend
training focus
```

## 21.2 Score card fields

Each core capacity card should include:

```text
capacity name
objective capacity
standardised score or band
confidence label
plain-language meaning
current training focus
```

## 21.3 Example layer cards

### Attention Control

```text
Attention Control
3.4 bits/sec
Standard score: 97
Confidence: calibrating
Focus: signal extraction under time pressure
```

### Relational Memory

```text
Relational Memory
6 relation-bit steps
Standard score: 94
Confidence: moderate
Focus: wrong-lag lures
```

### Binding Memory

```text
Binding Memory
8 binding-bit steps
Standard score: 98
Confidence: moderate
Focus: partial-match lures
```

### Path Prediction

```text
Path Prediction
2-step horizon
Standard score: 91
Confidence: calibrating
Focus: rare vs blocked paths
```

### Reasoning

```text
Reasoning
Level 5
Standard score: 103
Confidence: moderate
Focus: context/constraint reasoning
```

## 21.4 Standardised-score caution

Do not show precise population standard scores without adequate calibration data.

Use this fallback:

```text
standardised score:
calibrating
```

or:

```text
band:
developing / standard / strong / advanced
```

---

# 22. Privacy, Consent and Access Boundary

The app should include a plain-language start notice.

Required points:

```text
IQ Coach is not a clinical or diagnostic tool.
IQ Coach is not an official IQ test.
Scores are training estimates, not medical or educational diagnoses.
Stable personal baselines require repeated sessions.
For younger users, use should be age-appropriate and privacy-protective.
```

Minimum age for public demo and self-directed use:

```text
16+
```

Data design principles:

```text
guest-first
pseudonymous participant ID
email capture separate from task data unless user opts in
delete/export route
no special-category health data in v0 unless explicitly justified and consented
high-privacy defaults for under-18 access
```

---

# 23. Claims Boundary

IQ Coach may say:

```text
IQ Coach estimates component skills involved in adaptive reasoning.
It uses layered games to train attention control, relational memory, binding memory, path prediction and reasoning.
It tests whether trained relations survive changed wrappers, lures and delayed re-checks.
It estimates possible bottlenecks in the training stack.
```

IQ Coach should not say:

```text
This is a full IQ test.
This proves your IQ has increased.
This diagnoses cognitive deficits.
This detects brain states.
This is a clinical tool.
This guarantees far transfer.
```

Safe product claim:

```text
IQ Coach is a layered adaptive-intelligence training system that tests whether relations can be extracted, held, bound, predicted from and reasoned with across changing formats.
```

---

# 24. Build Priority

## Phase 1 — Core scoring backbone

```text
Attention Control bits/sec
Relational WMC relation-bit steps
Binding WMC binding-bit steps
Path Prediction anomaly/probe scoring
Reasoning item difficulty model
MeasurementModelRegistry
trial logging
confidence labels
```

## Phase 2 — Full graph stack

```text
versioned GraphSpec
relation-token n-back
binding n-back
edge / transition n-back
continuous Path Prediction stream
press-on-unexpected response
likely-next probes
reachability probes
nonsense-semantic reasoning templates
domain-semantic reasoning templates
```

## Phase 3 — Transfer scoring

```text
wrapper recovery
lure resistance
delayed recovery
Path-Prediction-to-Reasoning recovery
Transfer Score v0.1
```

## Phase 4 — External validation

```text
Real-Life Transfer Check
Matrix Reasoning Benchmark
pre/post/follow-up comparisons
sample norms
standard score calibration
```

## Phase 5 — Bottleneck dashboard

```text
vertical layer profile
relative layer gaps
downstream suppression
error signatures
training focus recommendation
standardised score display
market lens views
```

---

# 25. Acceptance Tests

## 25.1 Public naming tests

Public UI text scan confirms score cards use only:

```text
Attention Control
Relational Memory
Binding Memory
Path Prediction
Reasoning
```

Deprecated public terms do not appear in:

```text
onboarding
score cards
task titles
CTAs
route metadata
public dashboard labels
```

Deprecated or technical terms may appear only in:

```text
docs/measurement-spec.md
admin/debug views
estimate metadata
internal model IDs
```

## 25.2 Graph tests

```text
graph transition rows sum to 1
missing directed edges are impossible
rare-valid and invalid transitions score differently
context-gated edges are valid only in the correct context
same graph can project into Relational Memory, Binding Memory, Path Prediction and Reasoning
```

## 25.3 Measurement tests

```text
Attention Control demand calculation follows the implemented CCC / adaptive CCC model table
Relational Memory demand calculations are deterministic
Binding Memory demand calculations are deterministic
Path Prediction successor-surprisal calculations are deterministic
Reasoning demand calculations are deterministic
confidence labels degrade with low trial count or poor timing
standardised scores are hidden unless norm thresholds are met
```

## 25.4 API tests

```text
session start creates participant and attempt
submit records graph, raw trials, estimates and attempt state
duplicate submit is rejected by idempotency key
server-side estimate is canonical
raw trials and derived estimates are stored separately
```

## 25.5 Claims tests

Public copy must not imply:

```text
diagnosis
official IQ testing
proven IQ increase
guaranteed far transfer
clinical treatment
brain-state detection
```

---

# 26. Final System Principle

The whole system should be governed by this rule:

```text
Do not reward local game fluency alone.

Reward the capacity to extract, hold, bind, predict from and reason with relations across wrappers, lures, delay and external benchmarks.
```

Compact form:

```text
Attention Control extracts the signal.
Relational WMC holds the relation.
Binding WMC preserves the conjunction.
Path Prediction Capacity predicts the path.
Reasoning Capacity explains what follows.
Real-Life Transfer Check asks whether it appears in life.
Transfer Score tests whether it transfers.
Matrix Reasoning Benchmark anchors the stack to an external reasoning benchmark.
```

The defining IQ Coach question is not:

```text
Did the user get better at one game?
```

It is:

```text
Did the relation survive noise, delay, binding demands, wrapper change, future-state prediction and explicit reasoning?
```
