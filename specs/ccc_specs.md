The CCC / Attention Control level can use the **same stimulus vocabulary** that later feeds Relational Memory and Binding Memory, but with a different task demand.

The clean structure is:

```text
CCC-A: Feature majority
→ extracts the relation token used later in Relational Memory

CCC-B: Conjunction majority
→ extracts the bound-state token used later in Binding Memory
```

So CCC becomes the **signal-extraction layer** for the later memory layers.

## 1. CCC-A: relation / feature majority

This is the simple arrow or optic-flow majority task.

### Arrow examples

```text
5 arrows:
3 OUT, 2 IN
Correct response: OUT
```

or:

```text
5 arrows:
4 CW, 1 CCW
Correct response: CW
```

### Optic-flow examples

```text
5 flow patches:
3 EXPAND, 2 CONTRACT
Correct response: EXPAND
```

or:

```text
5 flow patches:
4 CW flow, 1 CCW flow
Correct response: CW
```

This extracts the **relation token**:

```text
OUT
IN
CW
CCW
LEFT
RIGHT
EXPAND
CONTRACT
```

That same relation token then becomes the object of the **Relational Memory** task:

```text
Does the current relation match 2-back?
```

So yes:

```text
CCC-A extracts the relation.
Relational Memory holds the relation.
```

This fits the full app logic that Attention Control estimates how efficiently the user extracts a target relation from a brief, masked, noisy display, while Relational Memory asks whether the user can hold and compare relation tokens across delay. 

## 2. CCC-B: conjunction / bound-state majority

This is the binding precursor.

Instead of asking:

```text
Were most items OUT or IN?
```

you ask:

```text
Which relation × colour pair was most common?
```

Example 10-stimulus display:

```text
OUT + blue
OUT + yellow
IN + blue
OUT + blue
IN + yellow
OUT + blue
IN + blue
OUT + blue
OUT + yellow
IN + yellow
```

Counts:

```text
OUT + blue = 4
OUT + yellow = 2
IN + blue = 2
IN + yellow = 2
```

Correct response:

```text
OUT + blue
```

This extracts the **bound-state token**:

```text
OUT + blue
CW + yellow
LEFT + green
EXPAND + purple
```

That same bound state then becomes the object of the **Binding Memory** task:

```text
Does the current bound state match 2-back?
```

The full app spec already defines bound states as relation × colour, relation × colour × context, carrier × relation × colour, etc., and gives examples such as `OUT + blue`, `CW + yellow`, `LEFT + green`, and `IN + purple`. 

## 3. The 10-stimulus ratio structure

For the conjunction-majority CCC task, the Kimi-style ratio structure works well:

| Ratio        | Meaning                             | Use                       |
| ------------ | ----------------------------------- | ------------------------- |
| **10:0:0:0** | one bound pair dominates completely | easy / tutorial           |
| **7:1:1:1**  | strong bound-pair majority          | medium                    |
| **4:2:2:2**  | weak bound-pair majority            | hard / interference-heavy |

This is not a pure feature-extraction task anymore. It is better labelled internally as:

```text
Bound Signal Extraction
```

or:

```text
Conjunction Control
```

Publicly, it can still sit under **Attention Control**, but internally it should be treated as the bridge into **Binding Memory**.

## Recommended final mapping

| CCC subtask              | Stimulus type                            | Output token        | Feeds into           |
| ------------------------ | ---------------------------------------- | ------------------- | -------------------- |
| **Feature majority**     | 5 arrows or flow patches                 | relation            | Relational Memory    |
| **Conjunction majority** | 10 arrow/flow + colour items             | bound state         | Binding Memory       |
| **Graph stream**         | same bound states in transition sequence | path relation       | Path WM / Prediction |
| **Reasoning**            | same graph made explicit                 | inference structure | Reasoning            |

So the vertical chain becomes:

```text
CCC-A:
extract relation

Relational Memory:
hold relation

CCC-B:
extract bound state

Binding Memory:
hold bound state

Path WM / Prediction:
learn transitions between bound states

Reasoning:
recover the graph explicitly
```

## Key implementation rule

Use the **same stimulus vocabulary**, but change whether the order is graph-neutral or graph-structured:

```text
CCC:
brief majority extraction, no graph transitions

Relational / Binding Memory:
same tokens, transition-neutral order

Path WM / Prediction:
same tokens, graph transitions switched on
```

That gives you clean measurement while preserving one coherent stimulus universe.

---
## The Binary Stimulus Space

Every stimulus is a conjunction of binary dimensions:

| Dimension | Values |
|-----------|--------|
| Direction | Left (L) vs. Right (R) |
| Colour | Yellow (Y) vs. Blue (B) |
| [Optional] Size | Big vs. Small |
| [Optional] Speed | Fast vs. Slow |

So the full stimulus space is:
- **1D**: L or R (or Y or B, depending on task)
- **2D**: LY, LB, RY, RB

---

## Task 1: Feature Majority (1D Control)

**Stimuli:** Arrows (or optic flow patches) that vary in direction, with colour and size **randomised** (task-irrelevant)

**Ratios:** 5:0, 4:1, 3:2 (Left vs. Right)

| Ratio | Difficulty | Cognitive Demand |
|-------|-----------|------------------|
| 5:0 | Trivial | No conflict; pure signal detection |
| 4:1 | Easy | Weak conflict; minimal inhibition needed |
| 3:2 | Hard | Maximum conflict; requires robust accumulation |

**Control process trained:** 
- **Evidence accumulation** with competing alternatives
- **Inhibition** of prepotent response to the minority
- **Noise filtering** (ignoring random colour/size)

This is standard adaptive MFT. The random colour/size prevents simple feature counting strategies and forces direction-selective attention.

---

## Task 2: Conjunction Majority (2D Binding Control)

**Stimuli:** Same arrows, but now **both direction and colour are task-relevant**

The four possible conjunctions: LY, LB, RY, RB

**Ratios:** 
- 4:2:2:2 (one conjunction dominant, others equal)
- 7:1:1:1 (strong dominance)
- 10:0:0:0 (pure signal)

**Critical design:** The participant must report the **majority conjunction**, not just the majority feature.

Example stream (10 items):
```
LY, RY, LB, LY, RB, LY, RY, LB, LY, RB
```

Counts: LY=4, RY=2, LB=2, RB=2 → **Majority: LY**

**Control process trained:**
- **Conjunctive accumulation**: Maintain running tally of bound features
- **Feature binding under time pressure**: Each item must be encoded as a unit, not as independent features
- **Interference resolution**: LY and RY share "Y"; LY and LB share "L" — this creates **partial overlap interference**

---

## The Interference Structure: Why 2D Is Harder

| Conjunction | Shares feature with |
|-------------|---------------------|
| LY | LB (L), RY (Y) |
| LB | LY (L), RB (B) |
| RY | LY (Y), RB (R) |
| RB | LB (B), RY (R) |

Every conjunction **partially overlaps** with two others. This creates **binding ambiguity**: when you see "L", was it LY or LB? The participant cannot accumulate "L" and "Y" separately; they must maintain **conjunctive tokens**.

This is the **source of the binding demand** — and the hippocampal engagement.


---

## Optic Flow Implementation

The same logic applies to optic flow patches:

### 1D Feature Majority
- Flow direction: Expansion vs. Contraction (or Leftward vs. Rightward)
- Colour and size randomised
- Ratios: 5:0, 4:1, 3:2

### 2D Conjunction Majority
- Flow direction × colour
- Four conjunctions: Expansion-Yellow, Expansion-Blue, Contraction-Yellow, Contraction-Blue
- Ratios: 4:2:2:2, 7:1:1:1, 10:0:0:0


---

## The Adaptive Logic

The **adaptive component** tracks accuracy across ratio conditions and adjusts:

| If accuracy on... | Then... |
|-------------------|---------|
| 3:2 (feature) < 70% | Decrease stream length or increase ratio to 4:1 |
| 4:2:2:2 (conjunction) < 70% | Increase proportion of dominant conjunction or add 1D warm-up |
| 7:1:1:1 (conjunction) > 90% | Introduce 3D or decrease proportion |

The progression is **individualised**: each participant advances from 1D→2D→3D at their own pace, with the adaptive algorithm ensuring the binding demand is always at the edge of capacity.

---

## Neural Predictions: 1D vs. 2D vs. 3D (3D not in the MVP)

| Region | 1D Feature Majority | 2D Conjunction Majority | 3D Triple Conjunction |
|--------|---------------------|------------------------|----------------------|
| **Early visual (V1-V4)** | Feature-selective tuning | Conjunction-selective emerging | Conjunction-dominant |
| **hMT+/V6** | Strong (optic flow) | Moderate (flow + colour binding) | Moderate (weaker flow signal) |
| **Posterior parietal (IPS)** | Accumulator, spatial attention | Binding accumulator | Hierarchical accumulator |
| **DLPFC** | Response selection, inhibition | Conjunction selection | Dimensional rule maintenance |
| **RLPFC** | Weak | Moderate (relational integration) | Strong (hierarchical binding) |
| **Anterior hippocampus** | Weak | Strong (conjunctive coding) | Stronger (triple binding) |
| **Posterior hippocampus** | Weak (if arrows) / Moderate (if flow) | Moderate (context coding) | Moderate (metric structure) |
| **Entorhinal cortex** | Weak | Moderate (grid update for context) | Moderate |
| **ATL** | Weak | Moderate (semantic integration) | Strong (feature integration) |



---

## Connection to Four Graph Classes

You can embed each graph class within the MFT structure:

| Graph Class | How It Modifies the MFT |
|-------------|------------------------|
| **Order/Chain** | The stream is generated by walking the chain: LY→RY→LB→RB→LY... The majority is computed over this structured sequence, not random sampling. Violations (skipping chain steps) are surprise trials. |
| **Transformation** | The stream applies a transformation: all items rotate 90° CW each step. Majority is computed over the transformed sequence. |
| **Context/Constraint** | A context cue indicates which dimension to track: "If border green, track direction majority; if border red, track colour majority." |
| **Probabilistic Path** | The stream is generated by a branching graph. The "majority" is the most probable path outcome, not the most frequent item. |

---

## The Critical Empirical Test

Your design allows a **clean dissociation**:

| Comparison | What It Tests |
|------------|-------------|
| 1D arrows vs. 1D optic flow | Does the directional domain (symbolic vs. motion) affect control network engagement? |
| 1D vs. 2D (same domain) | Does adding binding increase hippocampal engagement? |
| 2D arrows vs. 2D optic flow | Does binding interact with directional domain? |
| Random stream vs. Graph-structured stream | Does graph structure facilitate or interfere with majority accumulation? |

---

## One Design Refinement: The "Binding Load" Manipulation

Within 2D, you can vary **binding demand independently** of ratio difficulty:

| Condition | Description | Binding Load |
|-----------|-----------|--------------|
| **Pure conjunction** | Report majority of LY, LB, RY, RB | High |
| **Partial report** | Report majority direction (ignoring colour) | Medium (bind then discard) |
| **Feature report** | Report majority colour (direction randomised) | Low |

This tests whether the hippocampal binding is **automatic** (always engaged when conjunctions are present) or **strategic** (engaged only when task-relevant).

---

## Summary

Your binary stimulus + ratio structure is methodologically elegant because:

1. **Stimulus format is constant** — only the task instruction changes (feature vs. conjunction vs. triple)
2. **Difficulty is parametric** — ratios provide fine-grained control
3. **Binding demand is quantifiable** — 2D has 4 conjunctions, 3D has 8
4. **Interference is structured** — partial overlap creates natural binding ambiguity
5. **Adaptive progression is smooth** — 1D→2D→3D with individualised pacing

The neural prediction is clear: **1D trains frontoparietal control; 2D adds hippocampal conjunctive coding; 3D adds RLPFC hierarchical integration**. This maps directly onto the SR→binding→reasoning progression you've been developing.

Does this capture the design you had in mind? I'm particularly interested in whether you want the **graph structure** (Order, Transformation, etc.) to be **explicit** (participants know the structure) or **implicit** (they learn it through exposure, and the MFT tests whether they've learned it).
