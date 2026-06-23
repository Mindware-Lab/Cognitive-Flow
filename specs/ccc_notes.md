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
