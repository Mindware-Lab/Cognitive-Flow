
## 1. Current CCC game design

The latest CCC spec has shifted from the older “arrows only” version into a cleaner **Attention Control / signal-extraction layer** using the same stimulus vocabulary as later Relational Memory and Binding Memory, but without graph structure. The core split is:

```text
CCC-A: Feature majority
→ extracts a relation token

CCC-B: Conjunction majority
→ extracts a bound-state token
```

The spec explicitly says CCC is the “signal-extraction layer” for later memory layers.

### CCC-A: feature / relation majority

This is the purest MFT-M-style layer. The user sees a brief masked array and reports the majority relation.

For arrows:

```text
5 arrows
3 OUT, 2 IN
correct response = OUT
```

or:

```text
5 arrows
4 CW, 1 CCW
correct response = CW
```

For optic flow:

```text
5 flow patches
3 EXPAND, 2 CONTRACT
correct response = EXPAND
```

or:

```text
5 flow patches
4 CW flow, 1 CCW flow
correct response = CW
```

The extracted token is a relation such as `OUT`, `IN`, `CW`, `CCW`, `LEFT`, `RIGHT`, `EXPAND`, or `CONTRACT`, and this same relation token becomes the object later held by Relational Memory.

For the current version, I would lock CCC-A to:

```text
Carrier:
arrows
optic_flow

Frame:
absolute
relational

Binary relation axes:
LEFT / RIGHT
UP / DOWN
OUT / IN
CW / CCW
EXPAND / CONTRACT for optic flow radial blocks

Trial format:
5 items
majority ratios = 5:0, 4:1, 3:2
brief exposure
mask
binary response
```

The 5:0, 4:1 and 3:2 ratios already exist in the spec as the feature-majority ratio ladder, with 3:2 as the high-conflict condition requiring robust accumulation.

## 2. CCC-B: conjunction majority

CCC-B is not a pure control task anymore. It becomes the bridge into Binding Memory. The task changes from:

```text
Were most items OUT or IN?
```

to:

```text
Which relation × feature pair was most common?
```

The current spec gives colour as the binding dimension and uses 10-item displays with ratios such as 10:0:0:0, 7:1:1:1 and 4:2:2:2. It also states that this should be labelled internally as “Bound Signal Extraction” or “Conjunction Control”, while still sitting publicly under Attention Control.

For the current app direction, I would define CCC-B as:

```text
Carrier:
arrows or optic_flow

Primary relation:
LEFT / RIGHT
UP / DOWN
OUT / IN
CW / CCW
EXPAND / CONTRACT

Conjunction dimension:
colour, initially

Optional later context dimension:
speed
```

The reason I would use **colour first** for optic-flow conjunctions is that colour is a clean arbitrary binding dimension across both carriers. It lets you ask whether the user can bind:

```text
EXPAND + blue
CONTRACT + yellow
CW + green
CCW + purple
```

without changing the motion dynamics themselves. The optic-flow rationale file does allow “colour/speed” as parametric feature variation, but it frames these as dimensions superimposed on standard optic flow.

I would treat **speed** differently: useful, but not ideal as the first conjunction dimension in CCC. Speed changes the motion signal itself and can confound “direction extraction” with motion salience, temporal sampling, device timing, and perceived flow strength. It is better as either:

```text
1. an optic-flow difficulty parameter
2. a later context cue: FAST vs SLOW
3. a Path Prediction / context-gated graph variable
```

This is already consistent with the graph-supporting note, where speed/size is described as a context cue rather than simply another everyday binding dimension.

## 3. Important constraint: CCC is graph-neutral

This is the most important design correction for the current stage.

CCC should use the same token vocabulary as the graph stack, but **not the underlying graph transitions**. The current CCC spec states the key implementation rule clearly:

```text
CCC:
brief majority extraction, no graph transitions

Relational / Binding Memory:
same tokens, transition-neutral order

Path WM / Prediction:
same tokens, graph transitions switched on
```

That gives clean measurement while preserving a coherent stimulus universe.

So for CCC, do **not** generate sequences from Order/Chain, Transformation, Context/Constraint, or Probabilistic Path graphs. Use balanced randomised trial ordering. The user is extracting the current relation or bound relation, not learning a transition structure.

## 4. Counterbalanced transfer test for CCC

The counterbalanced transfer test is already well specified. For CCC specifically, the relevant transfer is:

```text
CCC arrows ↔ CCC optic flow
```

This tests whether signal extraction survives a carrier swap from static symbolic direction to dynamic motion direction.

The basic counterbalanced design should be:

```text
Group A:
arrows first → optic-flow transfer probe

Group B:
optic flow first → arrows transfer probe
```

The spec explicitly supports the 50/50 random start logic and notes that order/carryover effects should be modelled rather than ignored.

For CCC only, I would implement the micro-cycle as:

```text
1. Baseline arrows
2. Baseline optic flow
3. Train assigned carrier
4. Probe untrained carrier
5. Mix arrows + optic flow
6. Delayed re-check
```

This mirrors the recommended experimental structure: baseline A, baseline B, train A, probe B, mix A+B, delayed re-check, with the order reversed for the counterbalanced group.

## 5. CCC transfer metrics

Use four transfer outputs, not just one.

### A. Transfer recovery ratio

```text
Transfer recovery ratio =
performance on untrained wrapper after training
/
performance on trained wrapper before swap
```

This is already specified in the transfer-test file.

For CCC:

```text
Arrow → optic-flow recovery =
optic-flow probe score after arrow training
/
arrow score before swap
```

and:

```text
Optic-flow → arrow recovery =
arrow probe score after optic-flow training
/
optic-flow score before swap
```

### B. Asymmetry index

```text
Asymmetry =
Transfer(A → B) - Transfer(B → A)
```

The current spec gives this as the way to detect directional dependency, such as optic flow transferring better to arrows than arrows to optic flow.

### C. Recovery slope

After the first transfer dip, measure how quickly the user climbs back toward their trained-wrapper level.

```text
recovery_slope =
change in untrained-wrapper score across post-swap mini-blocks
```

### D. Mixed-wrapper stability

After recovery, mix arrows and optic flow in random order and compute whether performance remains stable under carrier uncertainty.

```text
mixed stability =
mixed-wrapper performance / mean(blocked-wrapper performance)
```

The transfer spec also says to track the initial transfer dip, recovery slope, final mixed-wrapper stability, delayed recovery and lure resistance.

## 6. Bits/sec: what file is missing?

I did not find a dedicated GitHub implementation/spec file in `/specs` that objectively computes the CCC bits/sec quantities from gameplay. The current `ccc_specs.md` is strong on stimulus design, ratios and transfer logic, but a search of that file did not find `bits/sec`. ([GitHub][2])

The bits/sec computation is present in the full app specification rather than the current GitHub CCC file: Attention Control is the CCC / MFT-M / adaptive CCC model family, its unit is bits/sec, and its demand model is:

```text
D_ACC =
  H_extract / ET_adjusted
  + wrapper_cost
  + frame_cost
  + lure_cost
```

with `H_extract` as the entropy/information demand of the majority condition and `ET_adjusted` as actual frame-counted exposure duration. 

So I would add a new GitHub file:

```text
specs/attention_control_scoring.md
```

or, if moving toward implementation:

```text
src/scoring/attentionControl.ts
```

It should define:

```text
raw trial fields required:
carrier
frame
relation_axis
majority_ratio
set_size
target_relation
response
correct
rt_ms
requested_exposure_ms
actual_exposure_ms
actual_frames_displayed
refresh_rate_estimate
mask_ms
timing_quality
wrapper_id
is_transfer_probe
is_mixed_wrapper
```

and the objective score:

```text
effective_information =
H_ratio × accuracy_adjustment

bits_per_sec =
effective_information / ET_adjusted_seconds
```

For a first scoring version:

```text
H_ratio table:
5:0 = calibration-table low demand
4:1 = calibration-table medium demand
3:2 = calibration-table high demand
```

Do not hard-code the final entropy values permanently. Store them in a calibration table so they can be updated when empirical data arrives.

## 7. Recommended lock for CCC v1

I would lock CCC v1 like this:

```text
Public label:
Attention Control

Internal:
CCC / adaptive MFT-style majority task

Stimulus carriers:
arrows
optic_flow

CCC-A:
5-item feature-majority extraction
ratios: 5:0, 4:1, 3:2
outputs: relation token, bits/sec

CCC-B:
10-item relation × colour conjunction-majority extraction
ratios: 10:0:0:0, 7:1:1:1, 4:2:2:2
outputs: bound-state token, conjunction-control score

Graph status:
off
no transition probabilities
no graph walks
no SR structure

Transfer test:
counterbalanced arrows-first vs optic-flow-first
baseline both carriers
train one carrier
probe the other
mix
delayed re-check
```

Bottom line: the CCC layer is now best understood as **graph-neutral controlled signal extraction**. It creates the relation and bound-state tokens that later layers hold, bind, predict from and reason with, but it should not itself use the graph engine yet.

[1]: https://github.com/Mindware-Lab/IQ-Coach/tree/main/specs "IQ-Coach/specs at main · Mindware-Lab/IQ-Coach · GitHub"
[2]: https://github.com/Mindware-Lab/IQ-Coach/blob/main/specs/ccc_specs.md "IQ-Coach/specs/ccc_specs.md at main · Mindware-Lab/IQ-Coach · GitHub"


---

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
