
## The Three Task Modes as SR Geometries

| Task Mode | What is matched | SR geometry learned | Core cognitive function |
|-----------|---------------|---------------------|------------------------|
| **Classic n-back** | Current stimulus matches stimulus from *n steps ago* | **Retrospective / explanatory**: "What led here?" | Working memory, credit assignment, causal tracing |
| **n-forward** | Current stimulus will match stimulus *n steps ahead* | **Prospective / affordance**: "What does this enable?" | Planning, goal-directed prediction, prospective control |
| **Surprise/violation** | Current stimulus violates the predicted transition | **Model-update / meta**: "What must I revise?" | Anomaly detection, belief revision, exploration |

All three use the **same graph structure** (Order, Transformation, Context, or Probabilistic Path) and the **same dimensional n-back scaffolding** (1D→2D→3D). Only the **target definition** changes.

---

## How Each Mode Maps to Each Graph Class

### 1. Order / Chain Graph: `A → B → C → D`

**Classic n-back (e.g., 2-back):**
- Sequence: `A, B, C, A, D, B...`
- Target: Press when current = stimulus from 2 steps back
- Match: `C` at position 3 matches `A` at position 1? No. `A` at position 4 matches `B` at position 2? No. `D` at position 5 matches `C` at position 3? No. `B` at position 6 matches `A` at position 4? No.
- *Wait* — in a pure chain without repeats, classic n-back is trivial (no matches). So we need **repeating elements** or **state revisits** in the sequence.

**Revised design for chain:** The chain is the *latent structure*, but the surface sequence includes revisits:
```
Latent: A → B → C → D → A → B → C → D...
Surface (with repeats): A, B, A, C, B, D, C, A, D, B...
```
Here the n-back detects when a state reoccurs after exactly n steps in the *surface sequence*, which requires tracking the latent graph to know which revisits are structurally valid.

**n-forward (e.g., +2-forward):**
- Press when current stimulus will reappear in 2 steps
- Requires predicting future revisits from the graph structure
- `A` at position 1: will `A` appear at position 3? Surface says yes (position 3 = A). Press.
- This is **prospective reachability**: from current state, what returns to itself in n steps?

**Surprise/violation:**
- Present `A → D` directly (skipping B, C)
- Violates the chain SR (M[A,D] = γ³, but intermediate states B, C were skipped)
- Press when transition is structurally impossible or skips required intermediates

---

### 2. Transformation / Analogy Graph

**Classic n-back:**
- Surface sequence: `blue-IN, green-IN, blue-CW, red-IN, green-CW...`
- Target: Match when same *surface item* repeats n-back
- `blue-CW` at position 3 doesn't match `green-IN` at position 1. No press.
- `green-CW` at position 5 matches `green-IN` at position 2? Only if we match by *base item*, not full conjunction. This requires **partial matching** — matching the "green" component across transformations.

**n-forward:**
- Press when current transformation will apply to a future item
- `blue-IN` at position 1: predict `blue-CW` will appear at position 3? Yes (if sequence is structured). Press.
- This trains **abstract transformation prediction**: "This IN item will become CW"

**Surprise/violation:**
- Present `blue-IN → blue-CCW` (wrong transformation direction)
- Violates the learned transformation rule (IN→CW, not IN→CCW)
- Press for rule violation

---

### 3. Context / Constraint Graph

**Classic n-back:**
- Surface: `(A,K), (C,K), (A,L), (B,K), (C,L)...`
- Target: Match full conjunction n-back
- `(A,L)` at position 3 doesn't match `(C,K)` at position 1. No press.
- `(B,K)` at position 4 matches... nothing 2 back. No press.

**n-forward:**
- Press when context-appropriate successor will appear
- `(A,K)` at position 1: predict `(B,K)` at position 3? Depends on sequence structure.
- Requires **conditional prediction**: "Given K, A leads to B"

**Surprise/violation:**
- Present `(A,L)` followed by `B` (instead of C)
- Violates context rule: in context L, A→C, not A→B
- Press for context-rule violation

---

### 4. Probabilistic Path Graph

**Classic n-back:**
- Surface sequence samples from the branching graph
- `A, B, D, A, C, E, A, B, D...`
- Match: `A` at position 4 matches `A` at position 1? Yes (4-back, but if n=3: no). 
- Actually with n=3: position 4 `A` matches position 1 `A`? 4-1=3, yes. Press.

**n-forward:**
- Press when a *high-probability path outcome* will appear n steps ahead
- `A` at position 1: predict `B` at position 2? Yes (P=0.8). Press.
- But this is trivial (next-step). For +2-forward: predict `D` at position 3? 
  - Path A→B→D has P=0.8×0.9=0.72
  - Path A→C→E has P=0.2×0.7=0.14
  - Path A→C→F has P=0.2×0.3=0.06
  - So `D` is most likely at +2. Press if `D` appears at position 3.

**Surprise/violation:**
- Two distinct violation types:
  1. **Rare but valid**: `A → C` (P=0.2) — high surprise, but structurally possible
  2. **Impossible**: `A → E` directly (no path) — model-breaking, requires revision

- Press only for type 2 (impossible), or press with different keys for rare vs. impossible

---

## The Unified Training Protocol

For each graph class, the full protocol is:

```
Phase 0: Graph exposure (passive observation of transitions)
  → SR learns basic structure

Phase 1: 1D task mode training
  → Train classic n-back on single dimension (flow)
  → Train n-forward on single dimension
  → Train surprise detection on single dimension

Phase 2: 2D task mode training  
  → Same three modes, now with conjunctions (flow+colour)
  → Target definition shifts to conjunction matching

Phase 3: 3D task mode training
  → Same three modes, full conjunctions (flow+colour+sound)
  → Now operating over bound "objects" in the graph

Phase 4: Cross-mode generalisation
  → Test: after training all three modes in 3D, can the model
    - Do n-back in a new graph class?
    - Do n-forward in a trained graph class with new surface features?
    - Detect surprise types it hasn't explicitly trained on?
```

---

## Critical Design Choice: How to Define "Match" in n-Forward

In classic n-back, "match" is identity: `stimulus_t == stimulus_{t-n}`.

In n-forward, "match" requires **predicting a future identity**. But the future hasn't happened yet. Two implementations:

**Implementation A: Deferred feedback**
- Trial at time t: "Will this stimulus reappear at t+n?"
- No immediate feedback; feedback given at t+n
- Requires maintaining prediction in working memory until verification
- More cognitively demanding; closer to prospective planning

**Implementation B: Structured sequences with known repeats**
- Sequence is pre-generated with known future repeats
- At time t, the model can verify immediately whether the stimulus at t will appear at t+n (because the sequence is deterministic)
- Easier to implement; less ecological validity

**Implementation C: Probabilistic prediction with graded feedback**
- At time t, model predicts which state will appear at t+n
- Feedback is probabilistic: "Your prediction was the most likely outcome" vs. "Your prediction was possible but rare" vs. "Your prediction was impossible"
- Trains full probabilistic SR

I think **Implementation A** is most interesting for your framework — it forces the model to maintain a **prospective representation** in working memory, which is exactly what fluid reasoning requires.

---

## Neural Predictions by Mode × Graph Interaction

| | Order/Chain | Transformation | Context | Probabilistic |
|---|---|---|---|---|
| **n-back** | Posterior hippocampus (serial order) | ATL (abstract roles) | DLPFC (rule maintenance) | Hippocampus (expected visitation) |
| **n-forward** | RLPFC (prospective integration) | RLPFC (analogical mapping) | RLPFC + DLPFC (conditional planning) | vmPFC/striatum (value/likelihood) |
| **surprise** | Hippocampal PE (missing intermediates) | RLPFC (rule violation) | ACC (conflict) | Hippocampus + anterior (rare vs. impossible distinction) |

The key prediction: **RLPFC engagement increases from n-back → n-forward → surprise** across all graph classes, because the cognitive demand shifts from maintenance → prediction → model revision. But the **hippocampal engagement pattern** differs by graph class, reflecting the different SR structures being learned.

---

## One Deeper Point: The Three Modes as Three Time Horizons

Your three modes can be seen as operating at three **temporal horizons** relative to the present:

```
Past ←—————————— Now ——————————→ Future
  n-back          |            n-forward
   (τ-trace)      |         (Ψ-band prospect)
                  |
            surprise/violation
            (model update trigger)
```

- **n-back** = τ-bounded: how far back can I trace causal influence?
- **n-forward** = Ψ-bounded: how far ahead can I project affordances?
- **surprise** = meta-monitoring: when does the model itself need updating?

This is exactly the Trident G architecture you developed: τ-trace for backward binding, Ψ-band for forward control, and Phase 0 gating for model violation. The three task modes are **empirical probes** into these three subsystems.

---

## A Final Synthesis: The Complete Paradigm

Your full training system is:

```
4 Graph Classes × 3 Task Modes × 3 Dimensional Phases = 36 training conditions

Plus: Cross-condition generalisation tests
Plus: Neural readouts (fMRI/EEG) for each cell
```

This is ambitious but tractable. The key insight is that **you don't need 36 independent trainings** — the SR learning algorithm is the same throughout. What changes is:
1. The graph structure (transition matrix T)
2. The reward function (what counts as a "match")
3. The state representation dimensionality (1D→2D→3D)

The model's capacity to generalise across these variations is itself the measure of fluid intelligence — the ability to apply the same underlying relational structure to novel surface forms and novel inference demands.

Does this capture the full architecture you were envisioning? I'm particularly interested in whether you see the three modes as **interleaved within a session** (to force rapid switching) or **blocked by session** (to allow deeper SR formation before switching).
