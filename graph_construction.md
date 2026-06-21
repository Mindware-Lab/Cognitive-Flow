# IQ Coach Graph Construction and Complexity Specification

## Typed Markov Graph Engine for Relational Memory, Binding Memory, Path Prediction and Reasoning

**Product:** IQ Coach
**Protocol basis:** Trident-G Far Transfer Protocol
**Spec status:** v0.1 graph-engine specification
**Scope:** Graph construction, graph classes, complexity vectors, adaptive difficulty and layer projections
**Not in scope:** full app UX, dashboards, transfer score, matrix benchmark, pricing, onboarding, flow-state UX or general product architecture

---

# 1. Purpose

IQ Coach should use one shared graph engine to generate structured cognitive tasks across four higher layers:

```text
Relational Memory
→ Binding Memory
→ Path Prediction
→ Reasoning
```

The same hidden graph is projected into different cognitive operations:

```text
Relational Memory:
hold and compare graph-derived relations, states, edges or transformations across n-back delay

Binding Memory:
hold and compare bound graph states across n-back delay

Path Prediction:
learn what usually follows, detect graph violations and judge reachability

Reasoning:
recover the same graph relation in explicit symbolic, nonsense-semantic and domain-semantic form
```

The core principle is:

```text
one latent graph
multiple cognitive projections
adaptive complexity by graph family
```

Attention Control remains the lower-level signal-extraction layer. It can prepare graph tokens by extracting relations from brief displays, but it is not itself the main graph-learning layer.

---

# 2. Core Graph Object

Each graph is a versioned typed Markov state-transition graph.

```text
G = (S, E, K, P, τ, ρ, λ, L, W, D)
```

Where:

```text
S = finite set of latent states

E ⊆ S × S = directed graph-valid transitions

K = optional context set

P(s' | s, k) = transition probability from state s to state s' under context k

τ(e) = transformation/operator label on an edge

ρ(s) = relational state label

λ(s, w) = wrapper-specific rendering function

L = lure rules

W = allowed wrapper set

D = difficulty metadata
```

For context-free graphs:

```text
P(s' | s)
```

For context-gated graphs:

```text
P(s' | s, k)
```

Transition rows must sum to 1.

Missing directed edges mean probability 0 unless the graph explicitly marks the edge as possible but unobserved.

Do not call these causal graphs unless an intervention mechanic is present.

Use:

```text
predictive transition graph
probabilistic path graph
successor graph
graph-valid transition
graph-valid relation
```

Avoid as default:

```text
causal graph
```

unless the player can force, block, remove or perturb graph transitions.

---

# 3. GraphSpec Schema

Recommended TypeScript-style schema:

```ts
type GraphClass =
  | "order_chain"
  | "transformation_analogy"
  | "context_constraint"
  | "probabilistic_path";

type Wrapper =
  | "arrow"
  | "optic_flow"
  | "symbolic"
  | "nonsense_semantic"
  | "domain_semantic";

type ReferenceFrame =
  | "absolute"
  | "relational";

type RelationToken =
  | "LEFT"
  | "RIGHT"
  | "UP"
  | "DOWN"
  | "OUT"
  | "IN"
  | "CW"
  | "CCW";

type GraphState = {
  id: string;
  relation?: RelationToken;
  frame?: ReferenceFrame;
  carrier?: "arrow" | "optic_flow" | "symbolic";
  colour?: "blue" | "yellow" | "green" | "purple";
  context?: string | null;
  role?: "source" | "successor" | "target" | "blocked" | null;
  displayLabel?: string;
};

type GraphEdge = {
  id: string;
  from: string;
  to: string;
  probability: number;
  context?: string | null;
  transform?: string | null;
  edgeType:
    | "expected"
    | "rare_valid"
    | "invalid_lure"
    | "wrong_context"
    | "blocked_path"
    | "counterfactual"
    | "wrapper_shifted_valid";
};

type GraphDifficulty = {
  stateCount: number;
  edgeCount: number;
  activeRelationAlphabetSize: number;
  activeBoundStateSpaceSize: number;
  averageOutDegree: number;
  maxOutDegree: number;
  transitionEntropyMean: number;
  transitionEntropyMax: number;
  probabilityContrastMin: number;
  predictionHorizon: number;
  nBackLevel?: number;
  contextCount: number;
  bindingArity: number;
  lurePressure: number;
  wrapperShift: number;
  delayLevel: number;
  responseSetSize: number;
};

type RelationalGraphSpec = {
  graphId: string;
  graphVersion: string;
  graphClass: GraphClass;
  states: GraphState[];
  edges: GraphEdge[];
  contexts: string[];
  wrappers: Wrapper[];
  difficulty: GraphDifficulty;
  lureRules: LureRule[];
  projectionRules: ProjectionRules;
  reasoningTemplates: ReasoningTemplate[];
};
```

---

# 4. Shared State Grammar

The shared perceptual state grammar is:

```text
state =
carrier × frame × relation × colour × context
```

Where:

```text
carrier:
arrow | optic_flow | symbolic

frame:
absolute | relational

relation:
LEFT | RIGHT | UP | DOWN | OUT | IN | CW | CCW

colour:
blue | yellow | green | purple

context:
K | L | null
```

The full state space may be large, but each block should activate only a manageable subset.

Example:

```text
A = arrow + relational + OUT + blue + K
B = arrow + relational + CW + yellow + K
C = arrow + relational + IN + green + K
D = arrow + relational + CCW + purple + K
```

For early graph blocks, use:

```text
4–6 active states
2–6 active transitions
1 relation family
1 wrapper
low lure pressure
horizon 1
```

Later blocks can increase:

```text
state count
edge count
context count
binding arity
branching entropy
wrapper mixing
delay
```

---

# 5. Four Graph Classes

## 5.1 Order Chain Graph

**Graph class:** `order_chain`
**Reasoning family:** Order / Chain
**Core invariant:** ordered relations compose.

Basic form:

```text
A → B → C → D
```

Deterministic transition matrix:

```text
P(B | A) = 1
P(C | B) = 1
P(D | C) = 1
```

Optional continuous loop:

```text
P(A | D) = 1
```

Main cognitive demand:

```text
ordered relation maintenance
graph distance
transitive reachability
cannot-tell boundary control
```

Layer projections:

```text
Relational Memory:
Does the current state, relation or edge match n-back?

Binding Memory:
Does the current bound chain state match n-back?

Path Prediction:
Is this transition expected?
Can A reach C?
Can A reach D?
Is C→A a reversal lure?

Reasoning:
A > B
B > C
Therefore A > C
```

Typical lures:

```text
reversal lure
broken-chain lure
skip-step lure
shared-anchor lure
wrong-lag lure
unsupported transitive conclusion
```

---

## 5.2 Transformation Analogy Graph

**Graph class:** `transformation_analogy`
**Reasoning family:** Transformation / Analogy
**Core invariant:** the same operator maps different states across surfaces.

Basic form:

```text
blue-IN     → blue-CW
green-IN    → green-CW
purple-IN   → purple-CW
```

Transformation:

```text
τ = rotate relation one step clockwise
```

Mathematical form:

```text
P(τ(s) | s) = 1 - ε
```

or deterministic:

```text
P(τ(s) | s) = 1
```

Main cognitive demand:

```text
same-change abstraction
operator identity
surface-distance resistance
role/filler preservation
```

Layer projections:

```text
Relational Memory:
Did the same transformation occur n-back?

Binding Memory:
Did the same transformation occur with the same bound colour or context?

Path Prediction:
Given state s, is τ(s) the expected successor?
Does the same change survive a wrapper shift?

Reasoning:
A changes to B in the same way C changes to D.
```

Typical lures:

```text
same endpoint, different transformation
same colour, wrong transformation
same direction, different step size
surface similarity without structural similarity
different-looking but same transformation
wrong role substitution
```

---

## 5.3 Context Constraint Graph

**Graph class:** `context_constraint`
**Reasoning family:** Context / Constraint
**Core invariant:** context determines which transitions are valid.

Basic form:

```text
If context K:
A → B

If context L:
A → C
```

Mathematical form:

```text
P(B | A, K) = 1
P(C | A, L) = 1
P(B | A, L) = 0
P(C | A, K) = 0
```

Main cognitive demand:

```text
context-gated relation selection
condition binding
constraint validity
missing-condition control
```

Layer projections:

```text
Relational Memory:
Does the current context-bound transition match n-back?

Binding Memory:
Does relation × colour × context match n-back?

Path Prediction:
Was this transition valid under the current context?
Was it valid locally but invalid globally?

Reasoning:
If context K, A leads to B.
Context K is active.
A occurred.
Therefore B follows.
```

Typical lures:

```text
wrong-context transition
missing-condition lure
single condition treated as sufficient
inclusive/exclusive OR confusion
valid edge under wrong context
context swap lure
```

---

## 5.4 Probabilistic Path Graph

**Graph class:** `probabilistic_path`
**Reasoning family:** Prediction / Strategic Path
**Core invariant:** current state constrains likely, rare, blocked and counterfactual futures.

Basic form:

```text
P(B | A) = .80
P(C | A) = .20
P(D | B) = .90
P(E | C) = .90
```

Main cognitive demand:

```text
future-state prediction
probability contrast
reachability
rare vs impossible discrimination
counterfactual separation
```

Layer projections:

```text
Relational Memory:
Hold and compare path states, edges or transition fragments across delay.

Binding Memory:
Hold bound path states or context-specific path fragments across delay.

Path Prediction:
Which next state is more likely?
Was the transition expected, rare or invalid?
Can the current path still reach the target?

Reasoning:
A usually leads to B.
B usually leads to D.
A sometimes leads to C.
C leads to E.
Therefore D is more likely, but E remains possible.
```

Typical lures:

```text
rare treated as impossible
possible treated as likely
old path treated as still reachable
invalid edge treated as rare-valid
counterfactual path treated as actual
wrong-context probability used
```

---

# 6. Graph Construction Pipeline

Each graph block should be generated through the following pipeline.

## Step 1 — Select graph class

```text
order_chain
transformation_analogy
context_constraint
probabilistic_path
```

## Step 2 — Select active state space

Define the number of active states:

```text
|S_active| = 2–8 for early/mid app use
```

Recommended ranges:

```text
early:
2–4 states

standard:
4–6 states

advanced:
6–10 states
```

## Step 3 — Select state dimensions

Choose active dimensions:

```text
relation only
relation × colour
relation × colour × context
edge × context
state × role
```

Recommended progression:

```text
relation
→ relation × colour
→ relation × colour × context
→ transition fragment
→ path fragment
```

## Step 4 — Build transitions

For each graph class:

```text
order_chain:
linear or near-linear edge sequence

transformation_analogy:
operator-defined edges

context_constraint:
context-specific transition matrices

probabilistic_path:
branching transition matrix
```

## Step 5 — Validate transition probabilities

For each state and context:

```text
Σ_s' P(s' | s, context) = 1
```

Missing edges:

```text
P(edge) = 0
```

Rare-valid edges:

```text
0 < P(edge) < expected_threshold
```

Invalid lures:

```text
P(edge) = 0
```

## Step 6 — Generate lures

Generate lures from graph structure, not random noise.

Lures should be:

```text
near-valid
structurally tempting
diagnostic of the target operation
```

Examples:

```text
wrong lag
wrong context
same colour / wrong relation
same relation / wrong colour
same endpoint / wrong transform
rare-valid vs invalid
blocked path
counterfactual path
cannot-tell inference lure
```

## Step 7 — Assign wrappers

Each graph can be rendered through one or more wrappers:

```text
arrow
optic_flow
symbolic
nonsense_semantic
domain_semantic
```

Wrapper shifts should preserve the graph relation while changing surface form.

## Step 8 — Compute complexity vector

Compute `C(G)` before generating trials.

## Step 9 — Generate layer projections

Use the same graph to generate:

```text
Relational Memory trials
Binding Memory trials
Path Prediction streams and probes
Reasoning items
```

## Step 10 — Store graph version

Every generated block must store:

```text
graph_id
graph_version
graph_class
difficulty vector
wrapper set
lure rules
projection rules
```

This allows reproducibility and later item calibration.

---

# 7. General Graph Complexity Vector

Each graph should carry a formal complexity vector:

```text
C(G) =
⟨
|S|,
|E|,
A_rel,
A_bound,
b_mean,
b_max,
H_T,
ΔP_min,
h,
n,
|K|,
B,
L,
W,
D,
R
⟩
```

Where:

```text
|S| = active state count

|E| = active graph-valid edge count

A_rel = active relation alphabet size

A_bound = active bound-state space size

b_mean = average outgoing degree

b_max = maximum outgoing degree

H_T = mean transition entropy

ΔP_min = minimum probability contrast between competing valid successors

h = prediction horizon

n = n-back level

|K| = number of active contexts

B = binding arity

L = lure pressure

W = wrapper shift / wrapper mixing level

D = delay level

R = response-set complexity
```

This vector should be stored as metadata for every graph block.

---

# 8. Information-Theoretic Components

## 8.1 Relation entropy

```text
H_relation = log2(A_rel)
```

Examples:

```text
2 relations:
H_relation = 1 bit

4 relations:
H_relation = 2 bits
```

## 8.2 Bound-state entropy

```text
H_bound = log2(A_bound)
```

If:

```text
4 relations × 4 colours = 16 bound states
```

then:

```text
H_bound = log2(16) = 4 bits
```

## 8.3 Transition entropy

For each state:

```text
H_T(s) = -Σ_s' P(s' | s) log2 P(s' | s)
```

Mean graph transition entropy:

```text
H_T = mean_s H_T(s)
```

High entropy means the current state has several plausible futures.

Low entropy means one successor dominates.

## 8.4 Successor surprisal

For a one-step transition:

```text
I_successor = -log2 P(s' | s, k)
```

For a path of horizon h:

```text
I_path =
Σ_i=1..h [-log2 P(s_{t+i} | s_{t+i-1}, k)]
```

Optional discounted form:

```text
I_path_γ =
Σ_i=1..h γ^(i-1) × [-log2 P(s_{t+i} | s_{t+i-1}, k)]
```

## 8.5 Probability contrast cost

For a forced-choice likely-next probe:

```text
ΔP = |P(s_a | s) - P(s_b | s)|
```

Difficulty increases as `ΔP` decreases.

A simple cost term:

```text
ProbabilityContrastCost = 1 / (ΔP + ε)
```

or bounded:

```text
ProbabilityContrastCost = -log2(ΔP + ε)
```

Use a small ε only to prevent division or log errors.

---

# 9. Family-Specific Complexity Functions

## 9.1 Order Chain Complexity

Core dimensions:

```text
chain length
graph distance
skip distance
n-back level
reversal lure pressure
broken-chain lure pressure
wrapper shift
delay
```

Demand function:

```text
D_chain =
  a1·ChainLength
+ a2·GraphDistance
+ a3·SkipDistance
+ a4·n
+ a5·LurePressure
+ a6·WrapperShift
+ a7·Delay
```

Adaptive ladder:

```text
2-state chain
→ 3-state chain
→ 4-state chain
→ edge n-back
→ 2-step reachability
→ 3-step reachability
→ broken-chain lures
→ reversal lures
→ wrapper shift
→ delayed re-check
```

---

## 9.2 Transformation Analogy Complexity

Core dimensions:

```text
operator count
operator complexity
transformed dimension count
binding arity
surface distance
n-back level
same-endpoint lure pressure
wrong-operator lure pressure
wrapper shift
delay
```

Demand function:

```text
D_transform =
  a1·OperatorCount
+ a2·OperatorComplexity
+ a3·TransformedDimensionCount
+ a4·BindingArity
+ a5·SurfaceDistance
+ a6·n
+ a7·LurePressure
+ a8·WrapperShift
+ a9·Delay
```

Adaptive ladder:

```text
single operator
→ two operators
→ relation-only transformation
→ relation × colour transformation
→ same-endpoint lures
→ wrong-operator lures
→ mixed operators
→ wrapper shift
→ delayed same-change recovery
```

---

## 9.3 Context Constraint Complexity

Core dimensions:

```text
context count
rule count
condition count
context switch rate
binding arity
n-back level
wrong-context lure pressure
missing-condition lure pressure
wrapper shift
delay
```

Demand function:

```text
D_context =
  a1·ContextCount
+ a2·RuleCount
+ a3·ConditionCount
+ a4·ContextSwitchRate
+ a5·BindingArity
+ a6·n
+ a7·LurePressure
+ a8·WrapperShift
+ a9·Delay
```

Adaptive ladder:

```text
one context, one rule
→ two contexts, different successors
→ context × colour binding
→ wrong-context lures
→ missing-condition lures
→ context switches
→ context-gated path prediction
→ symbolic rule reasoning
→ delayed context recovery
```

---

## 9.4 Probabilistic Path Complexity

Core dimensions:

```text
state count
edge count
branching factor
transition entropy
probability contrast
successor surprisal
horizon length
rare-valid frequency
blocked-path lure pressure
counterfactual lure pressure
context gates
wrapper shift
delay
```

Demand function:

```text
D_path =
  a1·SuccessorSurprisal
+ a2·HorizonLength
+ a3·BranchingEntropy
+ a4·ProbabilityContrastCost
+ a5·RareValidLurePressure
+ a6·BlockedPathLurePressure
+ a7·CounterfactualLurePressure
+ a8·ContextGateCost
+ a9·WrapperShift
+ a10·Delay
```

Adaptive ladder:

```text
deterministic transition
→ simple branch with high probability contrast
→ lower probability contrast
→ rare-valid transitions
→ invalid-edge lures
→ blocked-path probes
→ two-step horizon
→ three-step horizon
→ counterfactual lures
→ wrapper shift
→ delayed path recovery
```

---

# 10. Projection-Specific Demand

The same graph has different demand depending on which game layer uses it.

## 10.1 Relational Memory Projection

Relational Memory uses the graph as a target and lure generator.

Task question:

```text
Does the current graph-derived token match the one n trials back?
```

Token types:

```text
state token
relation token
operator token
edge token
path-fragment token
context-bound token
```

Demand:

```text
D_RM =
  α(H_token × n)
+ β(LurePressure)
+ γ(WrapperShift)
+ δ(ContextCost)
+ ε(ExtractionCost)
+ ζ(Delay)
```

Where:

```text
H_token = log2(number of active target tokens)
```

or, for probabilistic edges:

```text
H_token = -log2 P(edge)
```

Important rule:

```text
n-back level = temporal memory distance

graph complexity = structural demand of what must survive that distance
```

Do not treat n-back level alone as the whole difficulty.

---

## 10.2 Binding Memory Projection

Binding Memory uses the graph as a source of bound state tokens.

Task question:

```text
Does the current bound graph state match the one n trials back?
```

Bound token examples:

```text
relation × colour
relation × colour × context
edge × context
state × role
operator × colour
path-fragment × context
```

Demand:

```text
D_BM =
  α(H_bound × n)
+ β(PartialMatchLure)
+ γ(SwapLure)
+ δ(WrongContextLure)
+ ε(WrapperShift)
+ ζ(Delay)
```

Where:

```text
H_bound = log2(active bound-state space)
```

Binding arity increases difficulty:

```text
relation
→ relation × colour
→ relation × colour × context
→ edge × context
→ path-fragment × context
```

---

## 10.3 Path Prediction Projection

Path Prediction uses the graph as the object of predictive learning.

Task question:

```text
What usually comes next?
Did the graph just break?
Can this path still reach the target?
```

Core stream trials:

```text
expected transition
rare-valid transition
invalid transition
wrong-context transition
blocked-path event
wrapper-shifted valid transition
```

Demand:

```text
D_PP =
  α(SuccessorSurprisal)
+ β(HorizonLength)
+ γ(BranchingEntropy)
+ δ(ProbabilityContrastCost)
+ ε(RareValidLurePressure)
+ ζ(InvalidEdgeLurePressure)
+ η(BlockedPathCost)
+ θ(ContextGateCost)
+ ι(WrapperShift)
+ κ(Delay)
```

Scoring must separate:

```text
expected transition
rare-valid transition
invalid transition
```

A rare-valid transition is not an error in the graph.

An invalid transition is a graph break.

---

## 10.4 Reasoning Projection

Reasoning expresses the same graph as premises, rules, analogies or path claims.

Task question:

```text
What follows from the graph when expressed symbolically or verbally?
```

Reasoning wrappers:

```text
symbolic
nonsense_semantic
domain_semantic
```

Demand:

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

Information-theoretic additions:

```text
ConclusionSurprisal = -log2 P(conclusion | premises)

H_response = log2(number of response options)
```

Reasoning response types:

```text
Valid / Invalid / Cannot tell
Same relation / Different relation
Likely / Unlikely / Cannot tell
On path / Blocked / Cannot tell
Best conclusion: A / B / C / Cannot tell
```

---

# 11. Adaptive Difficulty Engine

## 11.1 General principle

Do not adapt only n-back level.

Adapt the graph.

Increase only one difficulty dimension at a time unless running a deliberate benchmark challenge.

Possible adaptive dimensions:

```text
n-back level
state count
edge count
relation alphabet size
bound state space
operator count
context count
condition count
branching factor
transition entropy
probability contrast
successor surprisal
horizon length
lure pressure
wrapper shift
delay
response-set complexity
```

## 11.2 Training band

Use a target training band:

```text
70–82% balanced accuracy
```

Adaptive rule:

```text
>85% for two mini-blocks:
increase one demand dimension

70–82%:
stay in current band

60–70%:
repeat with support or slightly lower demand

<60%:
reduce load
```

## 11.3 Recommended priority order

For Relational Memory:

```text
1. n-back level
2. relation alphabet size
3. lure pressure
4. wrapper variation
5. context cost
6. delay
```

For Binding Memory:

```text
1. n-back level
2. bound state space
3. partial-match lures
4. swap lures
5. context binding
6. wrapper shift
7. delay
```

For Path Prediction:

```text
1. one-step deterministic prediction
2. simple expected vs invalid distinction
3. rare-valid transitions
4. branching factor
5. lower probability contrast
6. two-step horizon
7. blocked-path probes
8. counterfactual probes
9. wrapper shift
10. delayed re-check
```

For Reasoning:

```text
1. premise count
2. relation count
3. graph distance
4. identity binding
5. context gates
6. operation mixing
7. lure pressure
8. wrapper shift
9. delay
10. larger response set
```

---

# 12. Graph Difficulty Levels

Each graph class should support discrete labelled levels for implementation.

## 12.1 Order Chain Levels

```text
Chain L1:
2 states, 1 edge, no lures

Chain L2:
3 states, 2 edges, 1-step prediction

Chain L3:
4 states, 3 edges, 2-step reachability

Chain L4:
edge n-back, wrong-lag lures

Chain L5:
broken-chain and reversal lures

Chain L6:
symbolic transitive reasoning wrapper

Chain L7:
delayed mixed-wrapper chain recovery
```

## 12.2 Transformation Analogy Levels

```text
Transform L1:
single operator, relation only

Transform L2:
two operators, relation only

Transform L3:
operator × colour binding

Transform L4:
same-endpoint lures

Transform L5:
wrong-operator and surface-similarity lures

Transform L6:
wrapper shift, same operator

Transform L7:
symbolic / nonsense same-relation reasoning

Transform L8:
delayed same-change recovery
```

## 12.3 Context Constraint Levels

```text
Context L1:
one context, one rule

Context L2:
two contexts, different successors

Context L3:
context × colour binding

Context L4:
wrong-context lures

Context L5:
missing-condition lures

Context L6:
context-switching stream

Context L7:
symbolic if-then reasoning

Context L8:
mixed context + path reasoning

Context L9:
delayed context recovery
```

## 12.4 Probabilistic Path Levels

```text
Path L1:
deterministic one-step path

Path L2:
two-branch path, high probability contrast

Path L3:
rare-valid transitions introduced

Path L4:
invalid transitions introduced

Path L5:
two-step horizon

Path L6:
blocked-path probes

Path L7:
counterfactual lures

Path L8:
context-gated path probabilities

Path L9:
symbolic / domain probabilistic reasoning

Path L10:
delayed path recovery
```

---

# 13. Lure Taxonomy

Lures should be generated from the graph grammar.

## 13.1 Universal lures

```text
wrong-lag lure
same-feature lure
same-relation wrong-wrapper lure
same-colour wrong-relation lure
same-relation wrong-colour lure
rare-valid transition
invalid transition
wrong-context transition
blocked-path lure
counterfactual lure
cannot-tell lure
```

## 13.2 Class-specific lures

Order Chain:

```text
reversal
broken chain
shared lower anchor
unsupported skip
wrong identity substitution
```

Transformation Analogy:

```text
same endpoint / different transformation
same transformation / wrong role
surface similarity without structural similarity
same direction / different step size
```

Context Constraint:

```text
wrong context
missing condition
inclusive OR vs XOR
locally valid but globally invalid
context swap
```

Probabilistic Path:

```text
rare treated as impossible
possible treated as likely
invalid treated as rare
old path still treated as reachable
counterfactual treated as actual
```

---

# 14. Wrapper Rules

The graph relation must survive wrapper changes.

Wrappers:

```text
arrow
optic_flow
symbolic
nonsense_semantic
domain_semantic
```

Wrapper progression:

```text
blocked wrapper A
→ wrapper A with lures
→ wrapper B probe
→ wrapper B recovery
→ A/B mixed
→ wrapper C probe
→ A/B/C mixed
→ delayed re-check
```

Wrapper shift must preserve:

```text
graph_class
state-transition relation
lure class
reasoning relation
```

Wrapper shift may change:

```text
carrier
surface label
visual dynamics
semantic content
response format
```

The graph must store wrapper mapping explicitly:

```ts
type WrapperMapping = {
  wrapper: Wrapper;
  stateRenderMap: Record<string, RenderSpec>;
  edgeRenderMap?: Record<string, RenderSpec>;
  reasoningTemplateIds?: string[];
};
```

---

# 15. Graph-to-Layer Projection Functions

Implement one graph engine with projection functions.

```ts
generateRelationalMemoryTrials(graph, options)

generateBindingMemoryTrials(graph, options)

generatePathPredictionStream(graph, options)

generateReasoningItems(graph, options)
```

## 15.1 Relational Memory generator

Inputs:

```text
graph
n_level
token_type
target_ratio
lure_ratio
wrapper
```

Outputs:

```text
match trials
non-match trials
wrong-lag lures
graph-valid non-matches
invalid-edge lures if enabled
```

## 15.2 Binding Memory generator

Inputs:

```text
graph
n_level
bound_token_type
partial_match_lure_rate
swap_lure_rate
wrapper
```

Outputs:

```text
bound-state matches
bound-state non-matches
same-relation wrong-colour lures
same-colour wrong-relation lures
wrong-context lures
```

## 15.3 Path Prediction generator

Inputs:

```text
graph
horizon
stream_length
expected_rate
rare_valid_rate
invalid_rate
probe_rate
wrapper
```

Outputs:

```text
continuous transition stream
press-on-unexpected events
likely-next probes
reachability probes
rare / invalid / impossible probes
```

## 15.4 Reasoning generator

Inputs:

```text
graph
reasoning_wrapper
reasoning_family
difficulty_level
lure_rate
response_format
```

Outputs:

```text
valid items
invalid items
cannot-tell items
same-relation items
path-probability items
mixed-operation items
```

---

# 16. Acceptance Tests

Graph construction tests:

```text
Every graph has a graph_id and graph_version.

Every graph has one graph_class.

Every transition row sums to 1.

Every missing directed edge is treated as impossible unless explicitly marked otherwise.

Every rare-valid transition has probability > 0.

Every invalid transition has probability = 0.

Every context-gated transition is evaluated under the correct context.

Every graph has a computed complexity vector.

Every graph can project into at least two layer types.

The same graph_class can be rendered in at least two wrappers.

Lure labels are generated from graph rules, not arbitrary labels.
```

Measurement tests:

```text
Relational Memory demand is deterministic for the same graph, n and token type.

Binding Memory demand is deterministic for the same graph, n and bound token type.

Path Prediction successor surprisal is deterministic.

Reasoning demand is deterministic for the same graph, wrapper and response format.

Rare-valid and invalid transitions are scored differently.

Changing n-back level changes memory demand, not graph structure by itself.

Changing graph structure changes graph complexity even when n-back level is unchanged.
```

Adaptive tests:

```text
The adaptive engine changes only one demand dimension at a time.

If performance is >85% for two mini-blocks, one demand dimension increases.

If performance is 70–82%, demand is maintained.

If performance is <60%, demand decreases.

The engine can explain which dimension changed and why.

The engine never increases n-back level and branching entropy in the same ordinary training step.

Benchmark mode may override this, but must label the block as benchmark/challenge.
```

Transfer tests:

```text
Wrapper shift preserves graph_class and underlying transition relation.

Mixed-wrapper blocks preserve the same graph while changing rendering.

Delayed re-check uses the same graph relation with changed surface or delay.

The graph is not treated as learned unless performance survives lures and wrapper change.
```

---

# 17. Implementation Priority

## Phase 1 — GraphSpec core

```text
GraphSpec schema
GraphState schema
GraphEdge schema
transition-row validation
difficulty vector computation
basic lure labels
```

## Phase 2 — Four graph constructors

```text
buildOrderChainGraph()
buildTransformationAnalogyGraph()
buildContextConstraintGraph()
buildProbabilisticPathGraph()
```

## Phase 3 — Projection functions

```text
Relational Memory projection
Binding Memory projection
Path Prediction projection
Reasoning projection
```

## Phase 4 — Adaptive complexity engine

```text
performance band logic
one-dimension-at-a-time rule
family-specific adaptive ladders
complexity logging
explanation of difficulty changes
```

## Phase 5 — Validation layer

```text
acceptance tests
deterministic demand tests
rare-valid vs invalid tests
wrapper-preservation tests
delayed re-check tests
```

---

# 18. Final Design Rule

The graph engine should not merely generate sequences.

It should generate structured, typed, reusable relational worlds.

The user should encounter the same hidden structure across:

```text
memory
binding
prediction
reasoning
wrapper change
delay
```

The compact rule is:

```text
Do not adapt only the task.

Adapt the graph.
```

More precisely:

```text
increase n to test memory horizon

increase state count to test state-space load

increase binding arity to test relation-feature binding

increase branching entropy to test probabilistic prediction

increase context count to test rule selection

increase operator complexity to test analogy

increase lure pressure to test boundary precision

increase wrapper shift to test transfer

increase delay to test consolidation
```

The final graph-engine principle is:

```text
Capacity is estimated by how much typed graph complexity the user can handle while maintaining criterion performance across memory, binding, prediction and reasoning projections.
```
---
Yes — that is almost exactly the right architecture. I would make one refinement:

```text id="f51o9c"
Do not generate separate graphs for each layer.
Generate 1–3 session graphs, then project those same graphs into each layer.
```

The graph spec explicitly supports this: one shared graph engine should generate structured tasks for **Relational Memory → Binding Memory → Path Prediction → Reasoning**, with the same hidden graph projected into different cognitive operations. It also states that Attention Control/CCC remains the lower-level signal-extraction layer rather than the main graph-learning layer. 

## Recommended session design

For a normal training session, I would use:

```text id="9w9kne"
1 primary graph class
+ 1 secondary/review graph class
+ optional delayed probe graph
```

So usually:

```text id="dyyz5p"
1–2 graph classes per session
```

not all four every time.

For a benchmark session, you can use:

```text id="m6bk68"
2–4 graph classes
```

because the goal is broader profiling rather than efficient learning.

## Why not train all four reasoning classes every game?

If every session trains:

```text id="p79xvk"
Order
Transformation
Context / Constraint
Probabilistic Path
```

then each graph gets too little depth. The user may experience variety, but you lose a clean learning curve and clean recovery signal.

Better:

```text id="il5oyf"
standard session:
one focus family deeply
one review/bridge family lightly

benchmark:
all four families sampled
```

A good weekly rotation would be:

| Day/session | Primary graph                | Secondary graph       |
| ----------- | ---------------------------- | --------------------- |
| 1           | Order / Chain                | Transformation        |
| 2           | Transformation / Analogy     | Order review          |
| 3           | Context / Constraint         | Transformation review |
| 4           | Probabilistic Path           | Context review        |
| 5           | Mixed review                 | weakest family        |
| 6           | Wrapper-transfer focus       | delayed graph         |
| 7           | Benchmark / delayed re-check | all families lightly  |

## Your proposed pipeline, refined

### 1. Generate session graphs

At session start, generate a small graph bundle:

```ts id="y97tzk"
SessionGraphBundle = {
  primaryGraph: GraphSpec,
  secondaryGraph?: GraphSpec,
  delayedProbeGraph?: GraphSpec,
  benchmarkGraphs?: GraphSpec[]
}
```

For a standard session:

```text id="ooa3yo"
primaryGraph = the main family being trained
secondaryGraph = previous family or adjacent family
delayedProbeGraph = old graph from a prior session
```

Each graph should have a stored graph class, active states, transitions, lures, wrappers and difficulty vector. The spec says every generated block should store graph ID, version, graph class, difficulty vector, wrapper set, lure rules and projection rules. 

### 2. Run CCC as a wrapper-readiness gate

Yes. CCC should run before the graph games and answer:

```text id="d9s8m9"
Which stimulus wrappers can this user currently extract reliably today?
```

For example:

```text id="lixl5o"
arrow absolute: ready
arrow relational: ready
Gabor orientation: ready
Gabor frequency: stretch
optic-flow expansion/contraction: probe only
optic-flow rotation: not ready today
```

Then the graph games use this to select renderings.

```ts id="u4k8s1"
eligibleWrappers = {
  train: ["arrow.absolute", "arrow.relational", "gabor.orientation"],
  probe: ["optic_flow.radial"],
  exclude: ["optic_flow.rotation"]
}
```

Important: CCC should **not** generate the graph. It constrains the graph’s rendering layer.

So the logic is:

```text id="jaxfwl"
CCC:
Can the user extract this wrapper?

Graph games:
Can the user use the graph relation through that wrapper?
```

### 3. Use the same graphs for Relational n-back

Yes.

The Relational Memory projection should use the graph to generate:

```text id="81bfdr"
state-token n-back
relation-token n-back
operator-token n-back
edge-token n-back
context-bound token n-back
```

Example with a transformation graph:

```text id="1vjeex"
Graph:
blue-IN → blue-CW
green-IN → green-CW

Relational n-back token:
operator = rotate one step clockwise

Task:
Did the same transformation occur n-back?
```

The graph spec defines Relational Memory exactly this way: the graph acts as the target and lure generator, and the task asks whether the current graph-derived token matches the one n trials back. 

### 4. Use the same graphs for Binding Memory

Yes.

Binding Memory should use the same graph but change the token type:

```text id="44sytl"
relation
→ relation × colour
→ relation × colour × context
→ edge × context
→ path-fragment × context
```

Example:

```text id="36kpqx"
Relational Memory:
OUT matches OUT

Binding Memory:
OUT + blue matches OUT + blue
but not OUT + green
```

This is where the same graph becomes a binding task rather than just a relation-maintenance task. The spec defines Binding Memory as comparing bound graph states, with bound tokens such as `relation × colour`, `relation × colour × context`, `edge × context`, and `path-fragment × context`. 

### 5. Use the same graphs for Path Prediction

Yes — this is the strongest part of the design.

The same graph now becomes the thing the user learns:

```text id="2pbsbc"
What usually follows?
Did the graph break?
Can this path still reach the target?
Was this transition rare, invalid or blocked?
```

Example:

```text id="vwq8ci"
A → B → C → D
```

Relational n-back asks:

```text id="gbl902"
Did this edge match the one 2-back?
```

Binding n-back asks:

```text id="hzsyvq"
Did this bound state match the one 2-back?
```

Path Prediction asks:

```text id="6iqmwu"
If A appeared, was B expected?
Can A reach C?
Is C→A a reversal lure?
```

The graph spec’s Path Prediction projection uses expected transitions, rare-valid transitions, invalid transitions, wrong-context transitions, blocked-path events and wrapper-shifted valid transitions. 

### 6. Use the same graphs for Explicit Reasoning

Yes.

The explicit reasoning layer should express the same graph as:

```text id="m5ubcw"
symbolic
nonsense-semantic
domain-semantic
```

For example:

```text id="pz6kj1"
Visual graph:
A → B → C

Symbolic:
A leads to B.
B leads to C.
Therefore, A can reach C.

Nonsense:
The flarn leads to the nidge.
The nidge leads to the borp.
Therefore, the flarn can reach the borp.

Domain:
Step A leads to Step B.
Step B leads to Step C.
Therefore, Step A can eventually reach Step C.
```

The spec says Reasoning should express the same graph as premises, rules, analogies or path claims, with symbolic, nonsense-semantic and domain-semantic wrappers. 

## Concrete session flow

A standard session could look like this:

```text id="4gvfi8"
0. Select session focus
   Example: Transformation / Analogy

1. Generate graph bundle
   primaryGraph = transformation_analogy
   secondaryGraph = order_chain review
   delayedProbeGraph = previous context_constraint graph

2. CCC wrapper check
   Test arrow absolute / arrow relational / Gabor / optic-flow as needed

3. Select rendering wrappers
   trainWrapper = best reliable wrapper
   probeWrapper = one stretch wrapper
   excludeWrapper = currently unreliable wrapper

4. Relational Memory block
   same graph, relation/operator token n-back

5. Binding Memory block
   same graph, relation × colour or operator × colour n-back

6. Path Prediction block
   same graph, expected / invalid / rare-valid stream

7. Reasoning bridge
   same graph expressed symbolically or verbally

8. Optional delayed re-check
   old graph, changed wrapper, short block

9. Update graph and wrapper states
   Store graph performance, wrapper recovery, lures, delay status
```

## Example: one graph across all layers

### Graph class

```text id="icgo6u"
transformation_analogy
```

### Hidden graph

```text id="z5arcl"
blue-IN → blue-CW
green-IN → green-CW
purple-IN → purple-CW
```

### Core invariant

```text id="qwg2yo"
same operator: rotate relation one step clockwise
```

### CCC

```text id="ylyhpe"
Can the user extract IN, OUT, CW, CCW in the selected wrapper?
```

### Relational Memory

```text id="onw10p"
Did the same transformation occur 2-back?
```

### Binding Memory

```text id="5hbemo"
Did the same transformation occur with the same colour 2-back?
```

### Path Prediction

```text id="tktq6p"
Given blue-IN, is blue-CW the expected successor?
Is blue-OUT a wrong-operator lure?
```

### Reasoning

```text id="j5psku"
A changes to B in the same way C changes to D.
Same relation or different relation?
```

This gives you a clean vertical line:

```text id="edx5h6"
extract relation
→ hold transformation
→ bind transformation to colour
→ predict transformation outcome
→ reason explicitly about same-change
```

## How many graphs per game?

My recommendation:

| Session type                | Graph classes | Graph objects | Purpose                            |
| --------------------------- | ------------: | ------------: | ---------------------------------- |
| Short daily                 |             1 |             1 | Focused training                   |
| Standard 15–20 min          |           1–2 |           2–3 | Primary training + review/probe    |
| Benchmark                   |             4 |           4–8 | Broad profile                      |
| Delayed transfer session    |           2–3 |           3–5 | Old graph recovery across wrappers |
| Adaptive bottleneck session |             1 |           1–2 | Repair one weak layer              |

For the normal product:

```text id="o6ki69"
one primary graph class per session
one secondary or delayed graph for review
```

That is enough.

## Key design rule

The graph should be the stable object. The layer should change the question.

```text id="m94jw5"
Same graph.
Different cognitive operation.
Different wrapper.
Different lure.
Different delay.
```

So yes, your six steps work, with this refinement:

```text id="s0vm22"
CCC constrains wrappers.
The graph bundle drives WM, Binding, Path Prediction and Reasoning.
Each block uses a projection of the same graph, not a newly unrelated graph.
```

That gives the game a coherent vertical stack rather than five separate mini-games.

---

Yes — exactly. The graph should define the **depth of the skill**, not just the visual sequence.

A good formulation is:

```text
graph class = type of inference
graph depth = complexity of that inference
layer projection = how that inference is tested
```

So an `order_chain` graph, for example, can be shallow or deep:

```text
L1: A → B
L2: A → B → C
L3: A → B → C → D
L4: A → B → C with reversal lures
L5: delayed / mixed-wrapper chain recovery
```

The attached graph spec says the graph engine should generate “structured, typed, reusable relational worlds”, with capacity estimated by how much **typed graph complexity** the user can handle across memory, binding, prediction and reasoning projections. 

## 1. Graphs define inference type

The graph class determines the kind of skill being trained:

| Graph class              | Skill / inference type                             | Core invariant                        |
| ------------------------ | -------------------------------------------------- | ------------------------------------- |
| `order_chain`            | chain / transitive / reachability inference        | ordered relations compose             |
| `transformation_analogy` | same-change / analogy inference                    | same operator maps different states   |
| `context_constraint`     | rule / condition / constraint inference            | context determines what is valid      |
| `probabilistic_path`     | likely / rare / blocked / counterfactual inference | current state constrains future paths |

So the graph class answers:

```text
What kind of inference is this?
```

## 2. Graph depth defines skill complexity

The graph depth answers:

```text
How much structure must the learner maintain, bind, predict or reason through?
```

That depth can be controlled through the graph complexity vector:

```text
state count
edge count
relation alphabet size
bound-state space
operator count
context count
branching entropy
probability contrast
successor surprisal
prediction horizon
n-back level
lure pressure
wrapper shift
delay
response-set complexity
```

So yes: the graph is not just the content. It is the **difficulty object**.

## 3. For relational n-back

The graph specifies:

```text
token type
n-level
relation alphabet size
lure type
wrapper shift
delay
```

Example:

```text
Graph:
A → B → C → D

Relational n-back token:
edge token

n = 2

Task:
Does the current edge match the edge 2-back?
```

Lures are graph-derived:

```text
wrong-lag edge
reversal edge
broken-chain edge
same successor / wrong source
same relation / wrong wrapper
```

So difficulty is not just:

```text
2-back vs 3-back
```

It is:

```text
2-back over what kind of graph token, with what lure pressure?
```

That is a much better model.

## 4. For binding / associative-memory n-back

The same graph specifies the bound state space:

```text
relation
→ relation × colour
→ relation × colour × context
→ edge × context
→ path-fragment × context
```

Example:

```text
A = OUT + blue
B = CW + yellow
C = IN + green

Task:
Does the current bound state match the one 2-back?
```

Lures:

```text
same relation, wrong colour
same colour, wrong relation
wrong context
wrong graph role
wrong-lag conjunction
wrapper-shifted conjunction
```

So Binding Memory depth is controlled by:

```text
binding arity × n-level × lure pressure × wrapper shift
```

In simple terms:

```text
Relational n-back:
Can you hold the relation?

Binding n-back:
Can you hold what belongs with what?
```

## 5. For predictive path games

The graph determines the **inference structure of prediction**.

For example:

```text
P(B | A) = .80
P(C | A) = .20
P(D | B) = .90
P(E | C) = .90
```

Shallow Path Prediction:

```text
What usually follows A?
```

Deeper Path Prediction:

```text
If A goes to C, can the path still reach D?
```

Even deeper:

```text
Was C rare, impossible, blocked, or counterfactual?
```

The depth is determined by:

```text
branching factor
transition entropy
probability contrast
successor surprisal
horizon length
rare-valid lures
invalid-edge lures
blocked-path lures
counterfactual lures
context gates
wrapper shifts
```

So yes: the graph specifies the complexity of the **predictive inference**, not just the next stimulus.

## 6. For reasoning

The reasoning layer should express the same graph as an explicit inference problem.

Example graph:

```text
A → B → C
```

Shallow reasoning item:

```text
A leads to B.
B leads to C.
Therefore, A can reach C.
```

Deeper item:

```text
A leads to B.
B leads to C.
D also leads to C.
Therefore, A leads to D.
```

Correct answer:

```text
Cannot tell
```

So the graph determines the reasoning demand:

```text
graph distance
premise count
relation count
identity bindings
context gates
branching entropy
lure pressure
wrapper difficulty
response-set complexity
delay
```

I would avoid making the reasoning layer purely `true / false`. Use:

```text
Valid / Invalid / Cannot tell
```

or:

```text
Likely / Rare / Impossible
```

or:

```text
On path / Blocked / Cannot tell
```

That preserves the distinction between invalid, unsupported, rare and merely uncertain.

## 7. The core implementation principle

Each session graph should produce a set of **projection specifications**:

```ts
GraphProjectionDepth = {
  relationalMemory: {
    tokenType: "relation" | "edge" | "operator" | "path_fragment",
    nLevel: 1 | 2 | 3 | 4,
    lurePressure: number,
    wrapperShift: number
  },

  bindingMemory: {
    boundTokenType: "relation_colour" | "relation_colour_context" | "edge_context",
    nLevel: 1 | 2 | 3 | 4,
    partialMatchLures: number,
    swapLures: number,
    wrapperShift: number
  },

  pathPrediction: {
    horizon: 1 | 2 | 3,
    branchingEntropy: number,
    probabilityContrast: number,
    rareValidRate: number,
    invalidRate: number,
    blockedPathRate: number
  },

  reasoning: {
    premiseCount: number,
    graphDistance: number,
    relationCount: number,
    contextGateCount: number,
    lureType: string[],
    responseFormat: "valid_invalid_cannot_tell" | "likely_rare_impossible" | "on_path_blocked"
  }
}
```

So the graph does two jobs:

```text
1. Defines the inference family.
2. Defines the depth of the inference across layers.
```

## 8. Best final formulation

I would define capacity like this:

```text
Capacity = the amount of typed graph complexity a user can handle at criterion performance.
```

Then each layer estimates a different version of that:

```text
Relational Memory:
How much graph-token complexity can be held across delay?

Binding Memory:
How much bound-state complexity can be held across delay?

Path Prediction:
How much successor-graph complexity can be used to predict futures?

Reasoning:
How much explicit graph-inference complexity can be solved across symbolic, nonsense and domain wrappers?
```

 e skill.
