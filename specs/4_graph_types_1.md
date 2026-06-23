
## 1. Order / Chain Graph

**Structure:** `A → B → C → D` (deterministic linear chain)

**SR Form:**
```
M = [1   γ   γ²  γ³
     0   1   γ   γ²
     0   0   1   γ
     0   0   0   1]
```
Each row is the expected future visitation distribution from that state.

**Dimensional N-Back Implementation:**
- **Phase 1 (1D):** Pure flow sequence. Match flow state n-back.
- **Phase 2 (2D):** Flow+colour bound to chain position. Match conjunction n-back.
- **Phase 3 (3D):** Full conjunction with sound. Match triple n-back.

**Inference Training:**
- **Transitive inference:** The SR naturally encodes that `A` can reach `C` (via `M[A,C] = γ²`). The model learns reachability without explicit training on `A→C` pairs.
- **Violation detection:** Present `A→C` directly (skipping `B`). This violates the SR prediction and should produce a prediction error signal.

**Neural Prediction:**
- Hippocampal place/item cells show **forward skewed tuning** — cells active at `A` fire in anticipation of `B` and `C` during learning.
- RLPFC engaged when asked "Can A reach D?" (integration of multiple chain steps).

**Reasoning Readout:**
> `A > B`, `B > C`, therefore `A > C`

This is the simplest case — the SR *is* the transitive closure of the relation.

---

## 2. Transformation / Analogy Graph

**Structure:** Same operator applied across different "surfaces" or item types:
```
blue-IN → blue-CW
green-IN → green-CW
red-IN → red-CW
```

This is not a linear chain but a **parallel set of isomorphic transformations**. The graph structure is:
```
IN_blue → CW_blue
IN_green → CW_green
IN_red → CW_red
```

**SR Form:**
The SR here must represent **relational invariance** — the transformation `IN→CW` is the same regardless of the colour. This requires the SR to operate over **abstracted states** or **role-filler bindings**.

**Dimensional N-Back Implementation:**
- **Phase 1 (1D):** Learn individual transitions: `blue-IN → blue-CW`, etc.
- **Phase 2 (2D):** Now introduce a *second dimension* — shape. `blue-circle-IN → blue-circle-CW`, `blue-square-IN → blue-square-CW`. The task is to match the *transformation*, not the item.
- **Phase 3 (3D):** Full conjunction where the target is defined by the transformation type: "Press when the same transformation (IN→CW) occurred n-back, regardless of surface features."

**Critical Design:** The n-back target is not "same stimulus" but "same *relation* applied to different stimuli." This requires the SR to factorise:
```
M(surface, transformation, surface', transformation') 
  = δ(transformation, transformation') × f(surface, surface')
```

**Inference Training:**
- **Analogical mapping:** The model learns that `IN→CW` is a reusable transformation. When encountering `yellow-IN`, it can predict `yellow-CW` without explicit training.
- **Same-different abstraction:** The SR must represent the transformation as independent of the filler.

**Neural Prediction:**
- **Anterior hippocampus / ATL:** Engaged in encoding the abstract transformation (the "role" structure).
- **RLPFC:** Heavily engaged during Phase 3 when matching across different surfaces — this is second-order relational matching (matching relations between relations) .
- **Parietal cortex:** Maintains the structured representation of "what changed in what way" .

**Reasoning Readout:**
> `A changes to B in the same way C changes to D`

This is the core of analogical reasoning. Your paradigm trains it by requiring the SR to predict not the next item, but the next *transformation*.

---

## 3. Context / Constraint Graph

**Structure:** Context-gated transitions:
```
If context K: A → B, C → D
If context L: A → C, C → E
```

The same state `A` has different successors depending on context. This is a **non-Markovian** structure at the level of raw states — `A` alone is insufficient to predict the future; you need `A+K` or `A+L`.

**SR Form:**
The SR must be **conditional**: `M(A→B | K)` is high, but `M(A→B | L)` is near zero. This requires the state space to be augmented:
```
States = {(A,K), (A,L), (B,K), (C,K), (C,L), ...}
```

Or equivalently, the SR becomes a **tensor**: `M[state, context, future_state]`.

**Dimensional N-Back Implementation:**
- **Phase 1 (1D):** Simple context+state conjunction. Match `(A,K)` n-back.
- **Phase 2 (2D):** The context itself varies on a dimension (e.g., background colour = context). Match state n-back *within* context.
- **Phase 3 (3D):** The n-back target is defined by context-rule: "Press when the transition matches the *context-appropriate* successor, not just any successor."

**Critical Design:** Violation trials present `A → B` when context is `L` (where `A→C` is correct). The model must detect that this transition is *impossible* given the context, even though `A→B` is valid in other contexts.

**Inference Training:**
- **Conditional reasoning:** "If K, then A→B; K is active; A occurred; therefore B follows."
- **Constraint checking:** The model learns that some transitions are contextually invalid, not just statistically rare.

**Neural Prediction:**
- **DLPFC:** Engaged in maintaining and applying the context rule — selecting the appropriate transition set .
- **Hippocampus:** Encodes the conjunctive state `(A,K)` as a distinct node in the SR.
- **ACC:** Monitors conflict when a familiar transition (A→B) is presented in the wrong context.

**Reasoning Readout:**
> If context `K`, `A` leads to `B`; `K` is active; `A` occurred; therefore `B` follows

This is modus ponens, implemented as SR prediction over context-augmented states.

---

## 4. Probabilistic Path Graph

**Structure:** Branching transitions with probabilities:
```
A --0.8--> B --0.9--> D
 \--0.2--> C --0.7--> E
           \--0.3--> F
```

**SR Form:**
The SR naturally handles this — `M(A,B) = 0.8γ`, `M(A,C) = 0.2γ`, etc. The expected future visitation counts incorporate the probabilities. But the *reasoning* requires more: evaluating **likelihood of paths**, **counterfactuals**, and **impossibility vs. improbability**.

**Dimensional N-Back Implementation:**
- **Phase 1 (1D):** Match high-probability transitions n-back. Learn the "usual" path.
- **Phase 2 (2D):** Introduce a second dimension where the *probability itself* is cued (e.g., a sound indicates "likely" vs. "rare"). Match transitions conditional on probability cue.
- **Phase 3 (3D):** The n-back target includes **violation detection for impossible paths** (probability = 0) versus **rare but possible paths** (probability = 0.2). Press for "rare" transitions, don't press for "impossible" transitions.

**Critical Design:** This is where your **improbability/violation SR** (from the first question) becomes central. The model must learn:
- `A→B` is probable (expected, low surprise)
- `A→C` is rare (unexpected, high surprise, but valid)
- `A→D` is impossible (violates graph structure, model-breaking)

**Inference Training:**
- **Future-state prediction:** "What is the most likely outcome?"
- **Counterfactual reasoning:** "If A had gone to C instead of B, what would follow?"
- **Reachability under uncertainty:** "Is D reachable from A?" (Yes, via B with high probability)
- **Risk assessment:** "Is E possible from A?" (Yes, but requires the rare path)

**Neural Prediction:**
- **Hippocampus:** Encodes the probabilistic SR — the expected future visitation distribution.
- **Ventromedial PFC / striatum:** Evaluates path value/likelihood trade-offs.
- **RLPFC:** Engaged when comparing counterfactual paths ("What if A→C instead of A→B?").
- **Anterior hippocampus:** May show stronger activation for rare transitions, reflecting prediction error.

**Reasoning Readout:**
> `A` usually leads to `B`; `B` leads to `D`; `A` sometimes leads to `C`; therefore `D` is more likely, but `E` remains possible

This captures **probabilistic reasoning**, **counterfactual thinking**, and **possibility vs. probability** distinctions — all core to fluid intelligence.

---

## Integration: The Full Paradigm as a Curriculum

Your four graph classes form a **progressive curriculum** for training SR-based reasoning:

| Stage | Graph Class | What the SR Learns | Reasoning Capacity Built |
|-------|------------|-------------------|------------------------|
| 1 | Order/Chain | Linear reachability | Transitive inference, serial order |
| 2 | Transformation | Abstracted relations across surfaces | Analogy, same-different, structural mapping |
| 3 | Context/Constraint | Conditional transition structures | Rule use, modus ponens, conditional reasoning |
| 4 | Probabilistic Path | Branching, uncertainty, surprise | Probabilistic reasoning, counterfactuals, risk |

Each stage uses the **same dimensional n-back scaffolding** (1D→2D→3D) but with different graph structures. The progression is:
- **Early (1D):** Learn the raw transition structure
- **Middle (2D):** Bind arbitrary features to graph nodes, learn conjunctions
- **Late (3D):** Operate over the bound objects with the full inference class

---

## A Key Prediction: Transfer Hierarchy

If your framework is correct, training on later graph classes should transfer to earlier ones, but not vice versa:

```
Probabilistic Path training → transfers to Context → Transformation → Order
Order training → does NOT transfer to Probabilistic Path
```

Why? Because later graph classes **subsume** the representational requirements of earlier ones. A probabilistic path SR can represent deterministic chains (as a special case where P=1). But a chain SR cannot represent branching probabilities without restructuring.

This is testable: train groups on each graph class, then test on all four reasoning readouts. The transfer pattern would reveal the representational hierarchy of SR-based reasoning.

---

## Connection to Your Trident G Framework

| Trident G Concept | Graph Class Implementation |
|-------------------|---------------------------|
| **Ψ-band corridor** | The variance tolerance for "same transition" in probabilistic paths |
| **τ-bonds** | The temporal persistence of context across the n-back delay |
| **Phase 0 gating** | The switch between graph classes (detected as model violation) |
| **Type-2 processing** | Required for Transformation (analogy) and Context (rule) graphs |
| **Meta-monitoring** | Detecting when the current graph class no longer applies |
| **Portable Y variable** | The invariant SR learning algorithm across all graph classes |

Does this architecture capture what you had in mind? I'm particularly interested in whether you see the graph classes as **sequential curriculum stages** or as **parallel training streams** that the model alternates between.
