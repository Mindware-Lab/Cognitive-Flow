We have a **single relational-state engine** with three visual wrappers:

```text
1. simple gratings     = clean psychophysical baseline
2. Gabor patch fields  = main WM/SR measurement and training engine
3. optic flow          = dynamic path / strategic-action transfer wrapper
```

The key is that all three wrappers instantiate the same hidden structure:

```text
state → feature relation → transformation → successor path → goal-relevant action
```

That means the learner is not merely practising a surface. They are repeatedly recovering the same relational operators across changed perceptual forms, which fits the Trident-G principle that transfer requires variable abstraction, SR-style inference, wrapper variation, delayed re-checks and later deployment. 

## 1. Define a shared state-space

For each trial, define a visual state:

```text
S_t = [D1_t, D2_t, D3_t]
```

For **Gabor patches**, this might be:

```text
S_t = [orientation, spatial frequency / spacing, luminance / contrast]
```

For **simple gratings**:

```text
S_t = [orientation, spatial frequency, contrast]
```

For **optic flow**:

```text
S_t = [flow direction, speed, expansion / contraction]
```

The attached relational-WM document already suggests this kind of Gabor state vector and distinguishes simple state bits from relation bits, binding bits and successor-horizon demands. 

A practical discretisation could be:

| Dimension                        | Example bins | Information |
| -------------------------------- | -----------: | ----------: |
| Orientation / direction          |       8 bins |      3 bits |
| Spatial frequency / spacing      |       4 bins |      2 bits |
| Luminance / contrast / coherence |       4 bins |      2 bits |

So a full visual state can carry up to:

```text
H(S) = 3 + 2 + 2 = 7 feature bits
```

But the training target is not merely `H(S)`. It is:

```text
relations over S_t
```

## 2. Implement the four modes

### Mode 1 — State n-back

**Question:** “Was this feature the same?”

With gratings:

```text
Was the current grating orientation the same as 2-back?
```

With Gabor fields:

```text
Was the majority orientation the same as 2-back?
```

With optic flow:

```text
Was the dominant flow direction the same as 2-back?
```

This measures **feature maintenance and updating**.

Internal score:

```text
State Load = H_feature × n
```

Example:

```text
orientation = 3 bits
2-back = 2

State Load = 3 × 2 = 6 bit-steps
```

This is the entry layer: it checks whether the learner can extract and maintain a perceptual variable over time.

---

### Mode 2 — Binding n-back

**Question:** “Did this feature belong with that feature?”

With gratings:

```text
Was this orientation previously paired with this spatial frequency?
```

With Gabor fields:

```text
Did this majority orientation belong with this majority spacing from 2-back?
```

With optic flow:

```text
Was this flow direction paired with this speed before?
```

This measures **arbitrary associative binding**.

Internal score:

```text
Binding Load = H_binding × n
```

Example:

```text
orientation = 3 bits
spacing = 2 bits

H_binding = 5 bits

2-back binding = 5 × 2 = 10 binding-bit steps
```

This is where you can introduce **binding lures**:

```text
same orientation, wrong spacing
same spacing, wrong orientation
recent correct pair, wrong n-back position
```

Those lure errors are crucial because they measure interference and pattern separation, not just span.

---

### Mode 3 — Relation n-back

**Question:** “Did the change relation repeat?”

Now the learner tracks transformations rather than states.

With gratings:

```text
Did orientation change by the same amount as before?
```

With Gabor fields:

```text
Did majority orientation and spacing change together in the same way?
```

With optic flow:

```text
Did the flow field rotate / speed up / expand in the same transformation pattern?
```

A trial might encode:

```text
S_t = [orientation, spacing]

R_t = S_t - S_{t-n}

R_t = [Δorientation, Δspacing]
```

Internal score:

```text
Relation Load = H_relation × n
```

Example:

```text
Δorientation = 3 bits
Δspacing = 2 bits

H_relation = 5 bits

2-back relational transformation = 5 × 2 = 10 relation-bit steps
```

This is probably the most important mode for reasoning transfer because it trains:

```text
what changed?
what stayed invariant?
which relation survived the surface?
```

That maps directly onto matrix reasoning, puzzle solving and strategic action.

---

### Mode 4 — SR horizon mode

**Question:** “Can this state still lead to the target?”

This is the most Trident-G-specific mode.

Instead of asking for a past match, you define a transition map:

```text
S_t → S_{t+1} → S_{t+2}
```

The user learns, implicitly or semi-explicitly, that certain states lead to certain successor states.

With Gabor fields:

```text
If orientation increases, spacing usually decreases.
If contrast drops, the next orientation step is usually clockwise.
```

With optic flow:

```text
If the flow expands and accelerates, the target gate becomes reachable.
If the flow rotates left while slowing, the path is blocked.
```

The user can be asked:

```text
Is this the expected next state?
```

or:

```text
Can this current state still reach the target in two moves?
```

Internal score:

```text
SR Load = successor surprisal × horizon
```

where:

```text
successor surprisal = -log2 P(S_future | S_current)
```

In product terms, this becomes:

```text
Path Prediction
```

In theory terms, it is a behavioural, SR-inspired measure of how much predictive relational structure the learner can sample and use.

## 3. Why Gabor patches should be the main engine

I would use **Gabor patch fields** as the core measurement engine because they let you manipulate:

```text
majority ratio
set size
feature entropy
exposure time
masking
n-back level
binding load
relation load
lure pressure
```

They also minimise verbal recoding better than letters, digits or obvious shapes. The claim should remain behavioural rather than neural: this is an **SR-inspired relational workspace task**, not a direct hippocampal SR measure. Your document makes the same caution: the task reduces semantic and verbal scaffolding, but it is not literally outside the global workspace because the user still receives instructions and makes conscious responses. 

## 4. What gratings add

Simple gratings are useful for clean calibration.

Use them for:

```text
orientation discrimination
spatial-frequency discrimination
contrast discrimination
basic state n-back
basic binding n-back
```

They give you a low-noise baseline before adding the complexity of multi-item Gabor fields.

So the protocol could begin with:

```text
single grating → Gabor field → optic flow
```

This gives a controlled progression:

```text
clean variable
→ noisy majority variable
→ dynamic relational path
```

## 5. What optic flow adds

Optic flow is less clean psychometrically, but much better for **SR horizon** and **strategic action**.

It naturally encodes:

```text
direction
speed
acceleration
expansion / contraction
rotation
focus of expansion
approach / avoid affordance
path-to-goal
```

So it can bridge from abstract relation tracking to action-like inference:

```text
Where is this trajectory heading?
What future state follows?
Can this path still reach the goal?
Should I continue, switch, or inhibit?
```

This makes optic flow ideal for the final phase of training, where the relation becomes more action-oriented and strategic.

## 6. Measurement outputs

The app should estimate separate parameters, not one global “n-back score”.

| Score          | Meaning                                   | Best wrapper       |
| -------------- | ----------------------------------------- | ------------------ |
| **C-Control**  | controlled perceptual evidence throughput | gratings / Gabor   |
| **State-WM**   | feature maintenance over n steps          | all three          |
| **A-Bind**     | arbitrary feature binding                 | gratings / Gabor   |
| **R-Bind**     | transformation relation capacity          | Gabor / optic flow |
| **S-Horizon**  | successor/path prediction capacity        | optic flow / Gabor |
| **I-Lure**     | interference susceptibility               | Gabor              |
| **W-Recovery** | wrapper-swap recovery                     | Gabor → optic flow |

A compact scoring model would be:

```text
D_trial =
H_extract / ET
+ α(H_binding × n)
+ β(H_relation × h)
+ γ(lure pressure)
+ δ(wrapper shift)
```

Then fit:

```text
P(correct) =
chance + usable_range × sigmoid(capacity - D_trial)
```

The attached file already suggests this separation between perceptual-control bandwidth, workspace load and lure/interference susceptibility, rather than collapsing everything into one n-back number. 

## 7. Training protocol

A 15-minute session could look like this:

```text
1. Zone / calibration block       2 min
2. State or binding block         4 min
3. Relation / SR block            5 min
4. Wrapper perturbation           2 min
5. Prompt + micro-mission         2 min
```

Example:

```text
Minute 0–2
Gabor majority CCC-style calibration.

Minute 2–6
2-back orientation–spacing binding.

Minute 6–11
Relation n-back: did the change pattern repeat?

Minute 11–13
Wrapper swap: same relation, optic-flow surface.

Minute 13–15
Prompt:
“What changed, what stayed invariant, and what next state follows?”
```

This prevents the task from becoming thin n-back automation. The user learns to recover the same relation under altered perceptual conditions.

## 8. Adaptive progression

Use a near-critical training band:

```text
target accuracy = 70–82% balanced accuracy
```

Rules:

```text
If >85% for two mini-blocks:
increase one demand only.

If 70–82%:
stay in the current band.

If 60–70%:
repeat with slight support or slower timing.

If <60%:
reduce n-level, relation arity, speed, or lure pressure.
```

Never increase all difficulty dimensions at once. Rotate the target:

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

## 9. How it trains SR-relational space

The training arc should move from variable abstraction to predictive transition.

```text
Stage 1: identify variables
Which feature matters?

Stage 2: bind variables
What belongs with what?

Stage 3: track transformations
What changed, and how?

Stage 4: infer successors
What future state becomes likely?

Stage 5: transfer the relation
Can the same relation be recovered under a new wrapper?

Stage 6: apply as a mindware script
How does this help with a puzzle, plan or decision?
```

This follows the Trident-G idea that discrimination builds variables, WM binds variables, SR training learns transitions over variables, and slow Gc extracts the invariant after boundary testing and consolidation. 

## 10. Bridge into reasoning, problem solving and strategic action

After the perceptual block, give a short explicit bridge.

| Perceptual operation | Mindware script                             | Reasoning / strategic analogue   |
| -------------------- | ------------------------------------------- | -------------------------------- |
| State n-back         | “Which feature matters?”                    | identify the variable            |
| Binding n-back       | “What belongs with what?”                   | map roles, constraints, evidence |
| Relation n-back      | “What changed, what stayed invariant?”      | infer transformation             |
| SR horizon           | “Can this path still reach the goal?”       | evaluate next move               |
| Lure control         | “What is tempting but wrong?”               | inhibit misleading solution      |
| Wrapper swap         | “What is the same rule in the new surface?” | transfer the strategy            |

A strategic-action micro-mission might be:

```text
Today, when facing a task decision, pause and ask:
1. What is the current state?
2. Which variable changed?
3. What future state does this move make reachable?
4. What tempting move is actually a lure?
```

This is how the perceptual SR task becomes vertically integrated with global-workspace prompts and real-world action.

## 11. Best MVP version

For the first build, I would not start with optic flow. I would build:

```text
MVP 1:
Gabor majority state n-back
+ arbitrary binding n-back
+ relation n-back
+ lures
+ adaptive scoring
```

Then:

```text
MVP 2:
Add wrapper swaps:
Gabor layout change
colour theme change
density change
masking change
```

Then:

```text
MVP 3:
Add optic-flow SR horizon mode:
trajectory → successor → target reachability
```

The Gabor engine gives you the measurement backbone. Optic flow gives you the richer action/path-transfer layer.

## 12. Bottom line

The clean implementation is:

```text
gratings
= clean feature calibration

Gabor patch fields
= main relational WM capacity and training engine

optic flow
= dynamic SR horizon and strategic-action transfer wrapper
```

The four modes become:

```text
State n-back
= maintain the current variable

Binding n-back
= bind variables across time

Relation n-back
= track transformations between states

SR horizon mode
= infer reachable future states
```

This gives you a coherent Trident-G training stack:

```text
controlled evidence extraction
→ variable abstraction
→ binding
→ transformation tracking
→ successor prediction
→ wrapper recovery
→ prompt-guided problem solving
→ real-world strategic action
→ delayed re-check
```

That is much stronger than standard n-back because the training target is not “remember more items”. It is **expand, differentiate and sample the relational state space under goal constraints**.

---

## The integrated session design

You can collapse the two into a single session flow:

```
Minute 0–2   CCC Calibration Block
             → 40-60 trials, no memory load
             → yields: pure C-Control (bits/sec), baseline cog_rate
             → feeds: MIND_READY / MIND_FLAT detection

Minute 2–6   State n-back
             → yields: State-WM capacity

Minute 6–11  Binding / Relation n-back
             → yields: A-Bind, R-Bind
             → feeds: classifier dynamics under load

Minute 11–13 Wrapper perturbation
             → yields: W-Recovery
             → feeds: MIND_LOCKED_IN vs MIND_IN_ZONE discrimination

Minute 13–15 Prompt / micro-mission
             → yields: transfer bridge
```

In this design, the **first 2 minutes are the Zone Check**. The classifier runs on the **entire session's trial series**, but the `cog_rate` feature is anchored to the clean opening block. The later blocks add the capacity and load-sensitive dynamics layers.

---

## Why you still want a standalone shortcut

From a product perspective, users will not always want a 15-minute WM training session just to check their state. The **Express mode** in the classifier spec (40–50 trials, ~2–3 minutes) exists precisely for this use case.

| User intent | Session type | What they get |
|-------------|--------------|-------------|
| *"How am I right now?"* | Standalone Express (2–3 min) | `MIND_IN_ZONE` vs `MIND_FLAT` + `cog_rate` |
| *"Train my relational workspace"* | Full WM session (15 min) | Capacity profile + state-under-load + daily baseline |

So the **standalone Zone Check** should remain as an entry point and daily dashboard tool. The **full WM session** embeds the same Zone Check as its opening block, then extends into capacity training.

---

## The criticality angle

There is a deeper reason not to drop the clean CCC block. The classifier distinguishes `MIND_IN_ZONE` from `MIND_LOCKED_IN` partly by comparing **throughput** against **persistence/entropy**. If your throughput measure is already confounded by WM load, you lose the ability to detect the dangerous case where:

- A user has **high n-back performance** (apparent throughput)
- But is actually **rigidly locked-in** to a shallow strategy (high `cog_lag1`, low flexibility)

The clean CCC block provides the **unloaded baseline** against which loaded performance can be compared. If CCC is high but WM performance drops sharply, that signals load sensitivity. If both are high but dynamics are rigid, that signals `MIND_LOCKED_IN`.

---

## Bottom line

**Do not build a separate *game*.** Build a single task engine where:

1. **Express / Zone Check** = first 2–3 minutes (clean CCC block, 40–60 trials)
2. **Core / WM Training** = full 15-minute progression (CCC → state → binding → relation → wrapper)

The same trial-level data feeds both the capacity model (PS-RWC) and the criticality classifier. The clean opening block gives you the pure `cog_rate` baseline; the later blocks give you the capacity and dynamical-load measures.

Keep the **Express mode accessible as a standalone shortcut** for daily state checks, but it is technically just the first block of the same unified protocol.
---

### A. Core Architectural Claims
1. **Single engine, multiple wrappers**: The system should be implemented as *one* relational-state engine with three interchangeable visual wrappers (simple gratings, Gabor patch fields, optic flow).
2. **Shared hidden structure**: All three wrappers instantiate the same underlying cognitive operation: `state → feature relation → transformation → successor path → goal-relevant action`.
3. **Trident-G alignment**: Transfer requires variable abstraction, SR-style inference, wrapper variation, delayed re-checks, and later deployment—not just surface practice.

---

### B. State-Space & Information Claims
4. **Unified state vector**: Every trial has a visual state `S_t = [D1_t, D2_t, D3_t]` (e.g., orientation, spatial frequency, luminance/contrast).
5. **Discrete binning**: Dimensions should be binned into 8, 4, and 4 levels respectively, yielding ~7 feature bits per state.
6. **Target is relational, not storage**: The training target is not `H(S)` (state entropy) but *relations over* `S_t`.

---

### C. The Four Cognitive Modes (Operational Claims)
7. **State n-back** ("Was this feature the same?"): Measures feature maintenance/updating. Load = `H_feature × n`.
8. **Binding n-back** ("Did this feature belong with that feature?"): Measures arbitrary associative binding. Load = `H_binding × n`. Requires binding lures (same feature, wrong pairing).
9. **Relation n-back** ("Did the change relation repeat?"): Measures transformation tracking, not states. Load = `H_relation × n`. Encodes `R_t = S_t − S_{t−n}`.
10. **SR horizon mode** ("Can this state still lead to the target?"): Measures successor/path prediction via transition maps `S_t → S_{t+1} → S_{t+2}`. Load = successor surprisal × horizon.

---

### D. Wrapper-Specific Claims
11. **Gabor patches = main engine**: Best for manipulating majority ratio, set size, feature entropy, exposure time, masking, and lure pressure. Minimizes verbal recoding better than letters/digits.
12. **Gratings = clean calibration**: Best for low-noise baseline measurement of orientation/spatial-frequency/contrast discrimination and basic n-back.
13. **Optic flow = dynamic/action wrapper**: Best for SR horizon and strategic-action transfer because it naturally encodes direction, speed, acceleration, expansion/contraction, and path-to-goal affordances.
14. **Progressive complexity**: Protocol should move `gratings → Gabor fields → optic flow` (clean variable → noisy majority variable → dynamic relational path).

---

### E. Measurement & Scoring Claims
15. **Multi-parameter output**: The app should estimate separate parameters, not one global n-back score. Proposed metrics:
    - **C-Control**: controlled perceptual evidence throughput
    - **State-WM**: feature maintenance over *n* steps
    - **A-Bind**: arbitrary feature binding
    - **R-Bind**: transformation relation capacity
    - **S-Horizon**: successor/path prediction capacity
    - **I-Lure**: interference susceptibility
    - **W-Recovery**: wrapper-swap recovery
16. **Trial difficulty model**: `D_trial = H_extract/ET + α(H_binding × n) + β(H_relation × h) + γ(lure pressure) + δ(wrapper shift)`.
17. **Psychometric function**: Fit `P(correct) = chance + usable_range × sigmoid(capacity − D_trial)`.

---

### F. Training Protocol Claims
18. **Session structure**: 15-minute sessions with calibration, state/binding blocks, relation/SR blocks, wrapper perturbation, and a prompt/micro-mission.
19. **Adaptive near-critical band**: Target 70–82% balanced accuracy. Increase only *one* demand dimension at a time if >85% for two mini-blocks; reduce if <60%.
20. **Rotating difficulty dimensions**: Cycle daily through speed, feature discrimination, n-back horizon, binding load, relation load, lure pressure, wrapper transfer, and SR horizon—never all at once.

---

### G. Transfer & Generalization Claims
21. **Six-stage training arc**: (1) identify variables → (2) bind variables → (3) track transformations → (4) infer successors → (5) transfer the relation under new wrapper → (6) apply as mindware script.
22. **Vertical integration**: Perceptual operations map to explicit "mindware scripts":
    - State n-back → "Which feature matters?"
    - Binding n-back → "What belongs with what?"
    - Relation n-back → "What changed, what stayed invariant?"
    - SR horizon → "Can this path still reach the goal?"
    - Lure control → "What is tempting but wrong?"
    - Wrapper swap → "What is the same rule in the new surface?"
23. **Real-world bridge**: End sessions with a strategic-action micro-mission (e.g., pause before decisions and ask: current state? changed variable? reachable future state? tempting lure?).

---

### H. Implementation & Development Claims
24. **MVP 1**: Gabor majority state n-back + binding n-back + relation n-back + lures + adaptive scoring.
25. **MVP 2**: Add wrapper swaps (layout, colour, density, masking changes).
26. **MVP 3**: Add optic-flow SR horizon mode (trajectory → successor → target reachability).
27. **Not a neural measure**: The task is an *SR-inspired relational workspace task*, not a direct hippocampal successor representation measure. It reduces verbal scaffolding but remains within the global workspace (conscious instructions/responses).

 
---

## A. Core Architectural Claims

### A1. Single engine, multiple wrappers
**Claim:** One relational-state engine with three interchangeable visual wrappers (gratings, Gabor fields, optic flow).

**Literature mapping:** The idea of shared cognitive operations across perceptual formats is consistent with amodal representational theories (e.g., Baddeley’s episodic buffer, structured event complexes in PFC). However, the empirical literature on WM training strongly suggests that transfer is *material-specific*: Gathercole et al. (2019) found that transfer is significant "when both the trained and untrained tasks used material in the same domain, such as verbal or visuospatial" but far transfer across domains is minimal.

**Plausibility:** **Moderate** as an architectural ideal; **Weak** as an empirical prediction about transfer. The protocol assumes that because the *hidden structure* is shared, transfer will occur. The literature suggests that even when tasks share executive demands, surface format dominates transfer boundaries.

**Trident-G tension:** The theory itself acknowledges this risk: "first the system has to carve the state space into usable variables, then SR training learns transitions over those variables." If the wrappers are too perceptually distinct, the learner may fail to extract the common variable. The protocol's progression (gratings → Gabor → optic flow) is a partial solution, but the theory would demand more explicit "variable highlighting" during wrapper swaps.

---

### A2. Shared hidden structure: `state → feature relation → transformation → successor path → goal-relevant action`
**Claim:** All wrappers instantiate the same underlying relational operator sequence.

**Literature mapping:** This maps cleanly onto the SR framework in cognitive neuroscience. Stachenfeld et al. (2017) and recent fMRI work show that human hippocampus and visual cortex encode successor-like representations that predict future states from current ones. The protocol's sequence is essentially a behaviorally-operationalized SR with an explicit goal-relevant action appended.

**Plausibility:** **Strong** as a theoretical construct; **Moderate** as a claim about what naive participants will spontaneously learn. The SR literature typically involves explicit reward/transition structures or spatial navigation. It is not yet established that participants will implicitly extract SR-style maps from rapidly changing Gabor fields without explicit goal markers.

**Trident-G alignment:** Excellent alignment. The theory explicitly states that "SR training learns transitions over variables." The protocol's five-stage arc (identify → bind → track → infer → transfer) mirrors the theory's "carve state space → learn transitions → boundary testing → slow Gc extraction."

---

## B. State-Space & Information Claims

### B1–B2. Unified state vector `S_t = [D1, D2, D3]` with ~7 feature bits
**Claim:** Discretized visual states carry quantifiable information loads.

**Literature mapping:** Gabor patches are a standard psychophysical stimulus in visual WM research. Bays, Schneegans, and others have used orientation-discrimination and contrast-judgment tasks with Gabor stimuli to probe WM-perception interactions. The information-theoretic framing (bits per dimension) is less common in human WM studies but is standard in computational cognitive science (e.g., Brady et al.'s resource models).

**Plausibility:** **Strong** for gratings and Gabor fields; **Moderate** for optic flow, where "state" is inherently dynamic and continuous. The protocol treats flow as a static snapshot `S_t = [direction, speed, expansion]`, but optic flow is defined by temporal derivatives. This is a meaningful simplification.

**Trident-G alignment:** Good. The theory requires "usable variables" to be carved out of raw input. Binning continuous dimensions into discrete states is exactly the kind of variable abstraction the theory demands.

---

## C. The Four Cognitive Modes

### C1. State n-back ("Was this feature the same?")
**Claim:** Measures feature maintenance/updating. Load = `H_feature × n`.

**Literature mapping:** Standard n-back is one of the most studied WM paradigms. Meta-analyses confirm it loads heavily on frontoparietal updating networks. However, Redick & Lindsey (2013) found n-back and complex span are only weakly correlated, suggesting n-back captures updating rather than the full WM construct.

**Plausibility:** **Strong**. This is the most empirically grounded component of the protocol.

**Trident-G alignment:** Acceptable but shallow. The theory would classify this as low-level variable maintenance. The protocol correctly positions it as "entry layer," but the theory's real interest begins at binding and transformation.

---

### C2. Binding n-back ("Did this feature belong with that feature?")
**Claim:** Measures arbitrary associative binding. Load = `H_binding × n`. Requires binding lures.

**Literature mapping:** Feature binding in visual WM is well-established. Bays, Wu & Husain (2011) and Schneegans & Bays (2017, 2019) have shown that features are stored in a shared neural resource and that binding errors (swap errors) increase with competition and load. The protocol's lure structures (same orientation, wrong spacing) directly mirror the "swap error" paradigm in the WM literature.

**Plausibility:** **Strong**. The binding load metric is behaviorally tractable, and the lure logic has direct precedent in the binding literature.

**Trident-G alignment:** Strong. Binding is the step where "WM binds variables" in the theory. The lure mechanism is particularly well-aligned because it forces pattern separation, which the theory would associate with hippocampal indexing and boundary testing.

---

### C3. Relation n-back ("Did the change relation repeat?")
**Claim:** Tracks transformations rather than states. Load = `H_relation × n`.

**Literature mapping:** Relational WM is less commonly studied than feature WM, but there is evidence that tracking *changes* and *transformations* engages distinct mechanisms. The n-back literature has examined "relational processing" as a potential active ingredient in dual n-back training. One study found that dual n-back performance was predicted by relational WM measures, though training did not improve relational WM per se.

**Plausibility:** **Moderate**. The logic is sound, but the empirical literature on training *transformation tracking* specifically is thin. There is stronger evidence from matrix reasoning and analogy literatures that relational processing is trainable (e.g., Klauer et al.'s figural induction training), but those paradigms are explicit, not n-back variants.

**Trident-G alignment:** Very strong. This is the core of the theory: "what changed, what stayed invariant?" The protocol correctly identifies this as "probably the most important mode for reasoning transfer."

---

### C4. SR horizon mode ("Can this state still lead to the target?")
**Claim:** Measures successor/path prediction via transition maps. Load = successor surprisal × horizon.

**Literature mapping:** Successor representations have been identified in human hippocampus and early visual cortex during predictive anticipation tasks. However, the typical human SR studies use spatial navigation or discrete state-transition tasks with explicit structure. Using Gabor fields to train implicit SR-style maps is novel. The "successor surprisal" metric is well-formed mathematically but has not been used as a behavioral training target in humans.

**Plausibility:** **Moderate–Weak** as a training mechanism; **Strong** as a theoretical target. The risk is that without explicit transition structure or reward, participants may not learn the predictive map. The protocol's use of optic flow for this mode is clever because flow naturally encodes self-motion consequences, but the empirical bridge is speculative.

**Trident-G alignment:** Excellent. This is the most Trident-G-specific mode. The theory explicitly wants "predictive transitions across multiple relation families." The protocol's "Path Prediction" product framing is exactly the SR → action policy link the theory describes.

**Critical caveat:** The protocol acknowledges this is "an SR-inspired relational workspace task, not a direct hippocampal SR measure." This caution is well-placed. The GRAM paper (2026) provides an *architectural analogy* for multiple trajectory sampling, but it is evidence for machine reasoning, not human cognitive training.

---

## D. Wrapper-Specific Claims

### D1. Gabor patches = main engine
**Claim:** Best for manipulating majority ratio, set size, feature entropy, etc.; minimizes verbal recoding.

**Literature mapping:** Gabor patches are standard in visual psychophysics and have been used in dual-task WM paradigms to study orientation/contrast maintenance. The claim that they minimize verbal recoding is consistent with the visuospatial WM literature (e.g., Logie's visuospatial sketchpad).

**Plausibility:** **Strong**.

**Trident-G alignment:** Good. Gabor fields force "variable abstraction" because the participant must extract a majority orientation from noise, which aligns with the theory's emphasis on carving variables from noisy input.

---

### D2. Gratings = clean calibration
**Claim:** Low-noise baseline for orientation/spatial-frequency/contrast discrimination.

**Plausibility:** **Strong**. Standard psychophysical practice.

---

### D3. Optic flow = dynamic/action wrapper
**Claim:** Best for SR horizon and strategic-action transfer because it encodes direction, speed, acceleration, affordances.

**Literature mapping:** Direct empirical evidence for optic flow cognitive training improving executive function or reasoning is sparse in the search results. Optic flow is well-studied in navigation and self-motion processing (medial superior temporal area, MST), but its use in abstract relational training is novel.

**Plausibility:** **Moderate** theoretically; **Weak** empirically. The protocol makes a strong theoretical case that flow bridges to "action-like inference," but there is little direct evidence that training on optic flow relations transfers to matrix reasoning or strategic decision-making.

**Trident-G alignment:** The theory would approve of the *intent* (action-oriented wrapper), but would flag a risk: if optic flow is too domain-specific (self-motion/navigation), the "portable Y variable" may not transfer to puzzle-solving or planning. The theory demands that the relation, not the domain, be what transfers.

---

## E. Measurement & Scoring Claims

### E1. Multi-parameter output (C-Control, State-WM, A-Bind, R-Bind, S-Horizon, I-Lure, W-Recovery)
**Claim:** Separate parameters rather than one global n-back score.

**Literature mapping:** This is a significant improvement over standard n-back training studies, which typically use a single accuracy or d-prime score. The WM training literature has been criticized for treating WM as a monolithic capacity.

**Plausibility:** **Strong**. The psychometric decomposition is methodologically superior and aligns with contemporary WM models (e.g., Oberauer's interference model, Bays' resource model).

**Trident-G alignment:** Strong. The theory explicitly rejects "one global score" because it wants to track the differentiation of the relational state space. Separate metrics for binding, relation, and lure susceptibility map onto the theory's constructs.

---

### E2. Trial difficulty model and psychometric function
**Claim:** `D_trial = H_extract/ET + α(H_binding × n) + ...`; fit sigmoid capacity model.

**Plausibility:** **Moderate**. The model is well-formed and standard in item-response theory, but the specific weighting parameters (α, β, γ, δ) would need empirical calibration. The "exposure time" denominator is a nice touch that links to the "controlled perceptual evidence throughput" idea.

---

## F. Training Protocol Claims

### F1. Session structure and adaptive near-critical band (70–82% accuracy)
**Claim:** 15-minute sessions with calibration, state/binding/relation/SR blocks, wrapper perturbation, and micro-mission.

**Literature mapping:** Adaptive difficulty is widely accepted as necessary for effective cognitive training (Lövdén et al., 2010). The near-critical band is consistent with the "desirable difficulties" literature and the TRAIN method's emphasis on mismatch between demand and supply.

**Plausibility:** **Strong**. The structure is evidence-informed.

**Trident-G alignment:** Good, but with a tension. The theory emphasizes "delayed re-checks and later deployment." A 15-minute session with a micro-mission at the end provides *immediate* bridging, but the theory's "slow schematic Gc" requires consolidation over days/weeks with spaced practice. The protocol would need to specify how the 15-minute sessions are distributed over time.

---

### F2. Rotating difficulty dimensions daily
**Claim:** Never increase all dimensions at once; rotate target across days.

**Plausibility:** **Strong**. This is consistent with variable priority training (e.g., Kramer et al.) and prevents automatization of a single strategy.

**Trident-G alignment:** Excellent. "Variable abstraction" and "wrapper variation" are core theory principles. Rotating demands forces the system to repeatedly recover relations under changed conditions.

---

## G. Transfer & Generalization Claims

### G1. Six-stage training arc ending in "mindware script"
**Claim:** Perceptual operations map to explicit reasoning scripts (e.g., "What changed, what stayed invariant?" → infer transformation).

**Literature mapping:** The "mindware" terminology and explicit bridging is consistent with the TRAIN method and strategy-based training literature, which argues that far transfer requires higher-order relational scaffolds, not just WM updating. However, the empirical evidence that such explicit bridging produces *far* transfer (as opposed to near transfer) is still limited. Second-order meta-analyses find that when placebo effects and publication bias are controlled, far-transfer effects equal zero regardless of training program.

**Plausibility:** **Moderate** for near transfer; **Weak** for far transfer to Gf/reasoning. The protocol's vertical integration is theoretically elegant, but the meta-analytic baseline is harsh: even complex span training, n-back training, video-game training, and music training show null far transfer when properly controlled.

**Trident-G alignment:** This is where the theory makes its most specific and risky prediction. The theory claims that far transfer occurs when:
1. SR-guided inference is portable across wrappers
2. Vertically integrated with attention/WM/control policies
3. Coupled to real-world niche cues
4. Recoverable after delay

The protocol addresses (1) and (2) well, but (3) and (4) are underdeveloped. The "micro-mission" is a start for (3), but "recoverable after delay" requires spaced testing, which the protocol does not specify.

---

### G2. "Semi-automatic candidate inference generation"
**Claim:** With training, SR maps generate candidate inferences semi-automatically; GW selects and validates.

**Literature mapping:** This is the most theoretically ambitious claim. It maps onto the GRAM architecture (stochastic latent trajectories + selection), but GRAM is an AI system, not a human cognitive model. In humans, there is evidence from hippocampal "time cell" and "place cell" work that predictive codes are generated automatically, and from PFC literature that cognitive control selects among candidates. However, the claim that *training* on a Gabor n-back task will produce this automaticity for *reasoning* problems is speculative.

**Plausibility:** **Speculative**. It is a strong, falsifiable prediction, but currently lacks direct empirical support.

**Trident-G alignment:** Core to the theory. The theory explicitly warns that automaticity must remain "Ψ-band compatible"—not collapsing into brittle fast Gc. The protocol's lure-control and wrapper-swap mechanisms are designed to prevent this, which is theoretically sophisticated.

---

## H. Implementation Claims

### H1–H3. MVP progression (Gabor → wrapper swaps → optic flow)
**Claim:** Build Gabor engine first, then wrapper swaps, then optic flow.

**Plausibility:** **Strong** as an engineering strategy. This is the most defensible implementation path.

---

## Summary Assessment Table

| Claim Cluster | Plausibility | Literature Support | Trident-G Alignment | Key Risk |
|---------------|--------------|-------------------|---------------------|----------|
| Single engine, multiple wrappers | Moderate | Weak for far transfer | Good, but needs explicit variable highlighting | Surface format may block variable extraction |
| Shared hidden structure (SR sequence) | Strong | Moderate (SR in hippocampus/V1) | Excellent | Participants may not extract implicit SR without explicit structure |
| State n-back | Strong | Strong | Acceptable (shallow) | May not differentiate from standard n-back |
| Binding n-back | Strong | Strong | Strong | Swap-error modeling is well-established |
| Relation n-back | Moderate | Weak direct evidence | Very strong | Empirical literature on transformation training is thin |
| SR horizon mode | Moderate–Weak | Weak for this format | Excellent | Most speculative training target; needs validation |
| Gabor as main engine | Strong | Strong | Good | — |
| Optic flow as action wrapper | Moderate | Weak empirical bridge | Moderate (domain-specificity risk) | May not transfer to non-navigation reasoning |
| Multi-parameter scoring | Strong | Strong (methodologically) | Strong | Parameter weighting needs calibration |
| Adaptive 70–82% band | Strong | Strong | Good | Needs spaced practice for Gc consolidation |
| Six-stage arc + mindware | Moderate | Weak for far transfer | Strong theory, high risk empirically | Meta-analyses show null far transfer for all programs |
| Semi-automatic inference | Speculative | Very weak | Core theory | Strongest falsifiability; needs neural or behavioral validation |

---

## Bottom-Line Evaluation

**The protocol is theoretically coherent and represents a significant conceptual advance over standard n-back training.** Its decomposition of WM into state/binding/relation/SR components, its multi-parameter scoring, and its wrapper-variation logic are all well-aligned with the Trident-G theory and with emerging cognitive neuroscience.

**However, the protocol is swimming against a strong empirical current.** The WM training literature consistently shows that far transfer to fluid intelligence and reasoning is small or null when active controls and publication bias are accounted for. The protocol's response to this—relational training over multiple wrappers with explicit mindware bridging—is theoretically the right move, but it is not yet empirically validated.

**The three qualifications the Trident-G theory itself raises are exactly the right ones to stress:**
1. **Variables, not surfaces:** The protocol must ensure wrapper swaps genuinely highlight invariant relations, not just add perceptual noise.
2. **Ψ-band compatibility:** The training must prevent collapse into automatic stimulus-response habits; the lure and wrapper-swap mechanisms are good safeguards.
3. **Consolidation and delayed re-entry:** The 15-minute session structure needs to be embedded in a spaced, multi-week protocol with delayed post-tests to claim slow schematic Gc.

**Most testable prediction:** If this protocol works, near transfer to untrained n-back variants should be substantial, and *the degree of near transfer to relation-n-back variants should mediate far transfer to matrix reasoning*—replicating and extending the mediation pattern found in standard n-back studies. If that mediation fails, the far-transfer claim collapses regardless of the theory's elegance.

---

# Update 

Here are the specific definitions, formulas, and structural elements from the original protocol that should be **preserved verbatim** in the simplified two-wrapper spec, plus notes on what adapts because gratings are gone.

---

## 1. Information-Theoretic Load Definitions (Keep Exactly)

These are the core formalism. They do not depend on the number of wrappers.

| Load Type | Formula | Meaning |
|-----------|---------|---------|
| **State Load** | `H_feature × n` | Feature maintenance over *n* steps |
| **Binding Load** | `H_binding × n` | Arbitrary association hold |
| **Relation Load** | `H_relation × n` | Transformation tracking hold |
| **SR Load** | `successor surprisal × horizon` | Predictive path cost |

**Concrete bit-step examples to keep:**

```text
orientation = 3 bits, 2-back → State Load = 6 bit-steps
orientation + spacing = 5 bits, 2-back → Binding Load = 10 binding-bit steps
Δorientation + Δspacing = 5 bits, 2-back → Relation Load = 10 relation-bit steps
```

**Adaptation:** The examples now reference only Gabor `[θ, f]` and Flow `[φ, v]`. The 3-bit + 2-bit logic remains identical.

---

## 2. Trial Demand Model & Psychometric Function (Keep Exactly)

The original demand formula is architecturally clean and should not change:

```text
D_trial =
  H_extract / ET
  + α(H_binding × n)
  + β(H_relation × h)
  + γ(lure pressure)
  + δ(wrapper shift)
```

**Adaptation for two wrappers:** `wrapper_shift` is now simpler. It captures:
- Gabor ↔ Flow domain switch (the main transfer cost)
- Layout/density/colour perturbations within a wrapper (secondary cost)

The psychometric function stays:

```text
P(correct) = chance + usable_range × sigmoid(capacity - D_trial)
```

---

## 3. The Four Modes: Questions, Lures, and Internal Logic (Keep Exactly)

The original question templates are product-ready and theoretically precise. Port them directly:

### Mode 1 — State n-back
> "Was the current [majority orientation / majority flow angle] the same as 2-back?"

### Mode 2 — Binding n-back
> "Did this [orientation] belong with this [spacing] from 2-back?"  
> (or: "Was this [flow angle] paired with this [speed] before?")

**Lure definitions to preserve verbatim:**
```text
same orientation, wrong spacing
same spacing, wrong orientation
recent correct pair, wrong n-back position
```

### Mode 3 — Relation n-back
> "Did the [majority orientation and spacing / flow angle and speed] change together in the same way?"

With the transformation encoding:
```text
R_t = S_t - S_{t-n}
R_t = [Δorientation, Δspacing]  or  [Δangle, Δspeed]
```

### Mode 4 — SR Horizon
> "Can this current state still reach the target in two moves?"  
> "Is this the expected next state?"

And the surprisal definition:
```text
successor surprisal = -log2 P(S_future | S_current)
```

---

## 4. Multi-Parameter Scoring Framework (Keep Exactly)

The original 7-parameter output table is methodologically superior to a single score. Preserve it entirely:

| Score | Meaning | Best Wrapper |
|-------|---------|--------------|
| **C-Control** | controlled perceptual evidence throughput | Gabor (single patch) / Gabor field |
| **State-WM** | feature maintenance over *n* steps | both |
| **A-Bind** | arbitrary feature binding | Gabor |
| **R-Bind** | transformation relation capacity | Gabor / Flow |
| **S-Horizon** | successor/path prediction capacity | Flow / Gabor |
| **I-Lure** | interference susceptibility | Gabor |
| **W-Recovery** | wrapper-swap recovery | Gabor → Flow |

**Adaptation:** "Gratings" is removed from the C-Control row. Single Gabor patch (set size = 1) serves the same clean-calibration role.

---

## 5. Session Architecture & Timing (Keep Structure, Adapt Block 1)

The original 15-minute session is a strong template:

```text
1. Zone / calibration block       2 min
2. State or binding block         4 min
3. Relation / SR block            5 min
4. Wrapper perturbation           2 min
5. Prompt + micro-mission         2 min
```

**Adaptation:** Block 1 now uses **single Gabor patches** (set size = 1) for the CCC-style calibration, replacing simple gratings. The later blocks use multi-patch Gabor fields and flow fields as specified in the new spec.

The minute-by-minute example from the original also adapts cleanly:

```text
Minute 0–2   Single Gabor patch CCC calibration (no majority extraction)
Minute 2–6   Gabor field: 2-back orientation–spacing binding
Minute 6–11  Gabor field: Relation n-back (change pattern repeat)
Minute 11–13 Wrapper swap: same relation, flow-patch surface
Minute 13–15 Prompt: "What changed, what stayed invariant, what next?"
```

---

## 6. Adaptive Progression Rules (Keep Exactly)

The near-critical band and rotation schedule are evidence-informed and should not change:

**Target band:**
```text
70–82% balanced accuracy
```

**Rules:**
```text
If >85% for two mini-blocks: increase one demand only.
If 70–82%: stay.
If 60–70%: repeat with slight support.
If <60%: reduce n-level, relation arity, speed, or lure pressure.
```

**Daily rotation (keep verbatim):**
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

---

## 7. Training Arc & Mindware Bridge (Keep Exactly)

The six-stage arc is the Trident-G backbone and should be preserved verbatim:

```text
Stage 1: identify variables       → Which feature matters?
Stage 2: bind variables           → What belongs with what?
Stage 3: track transformations    → What changed, and how?
Stage 4: infer successors         → What future state becomes likely?
Stage 5: transfer the relation    → Can the same relation be recovered under a new wrapper?
Stage 6: apply as mindware script → How does this help with a puzzle, plan or decision?
```

**The mindware script table (keep exactly):**

| Perceptual operation | Mindware script | Reasoning analogue |
|----------------------|-----------------|-------------------|
| State n-back | "Which feature matters?" | identify the variable |
| Binding n-back | "What belongs with what?" | map roles, constraints, evidence |
| Relation n-back | "What changed, what stayed invariant?" | infer transformation |
| SR horizon | "Can this path still reach the goal?" | evaluate next move |
| Lure control | "What is tempting but wrong?" | inhibit misleading solution |
| Wrapper swap | "What is the same rule in the new surface?" | transfer the strategy |

**The micro-mission prompt (keep exactly):**
```text
Today, when facing a task decision, pause and ask:
1. What is the current state?
2. Which variable changed?
3. What future state does this move make reachable?
4. What tempting move is actually a lure?
```

---

## 8. Theoretical Framing & Caution (Keep Exactly)

The original caution about claims is essential and becomes even more important when simplifying:

> **"The claim should remain behavioural rather than neural: this is an SR-inspired relational workspace task, not a direct hippocampal SR measure."**

And:
> **"The task reduces semantic and verbal scaffolding, but it is not literally outside the global workspace because the user still receives instructions and makes conscious responses."**

These boundary definitions protect the protocol from overclaiming.

---

## 9. MVP Progression (Keep Structure, Already Aligned)

The original MVP roadmap is actually perfectly aligned with the simplified two-wrapper design:

```text
MVP 1:
Gabor majority state n-back
+ arbitrary binding n-back
+ relation n-back
+ lures
+ adaptive scoring

MVP 2:
Add wrapper swaps:
Gabor layout change
colour theme change
density change
masking change

MVP 3:
Add optic-flow SR horizon mode:
trajectory → successor → target reachability
```

**Note:** In the simplified spec, MVP 2's "wrapper swaps" explicitly include the Gabor → Flow switch as the primary transfer test, with layout/colour/density as secondary within-wrapper perturbations.

---

## 10. The "Bottom Line" Stack (Keep Exactly)

The original summary of the training target is clearer than most academic abstracts. Preserve it:

```text
controlled evidence extraction
→ variable abstraction
→ binding
→ transformation tracking
→ successor prediction
→ wrapper recovery
→ prompt-guided problem solving
→ real-world strategic action
→ delayed re-check
```

---

## What Explicitly Adapts Due to Dropping Gratings

| Original Element | Simplified Adaptation | Rationale |
|------------------|----------------------|-----------|
| **Simple gratings** as clean baseline | **Single Gabor patch** (set size = 1) | Same psychometric function, no need for separate stimulus class |
| **3-wrapper progression** (gratings → Gabor → flow) | **Set-size progression** (1 patch → small field → full field → flow field) | Clean variable → noisy majority → dynamic relation |
| **3D state vector** `[θ, f, L]` | **2D core** `[θ, f]` / `[φ, v]` with **optional 3rd dimension** (luminance/coherence) added later for load scaling | Simplifies MVP; third dimension can be reintroduced as a difficulty parameter |
| **Wrapper shift cost δ** across 3 formats | **Wrapper shift cost δ** across 2 formats + within-wrapper layout shifts | Easier to interpret: δ now isolates feature-domain transfer (orientation/frequency → angle/speed) |

---

## Consolidated: The "Keep List"

If you are editing the high-level spec, **copy-paste these sections directly** from the original with only wrapper-name substitutions:

1. All bit-step formulas and concrete examples
2. The `D_trial` demand equation and `P(correct)` psychometric function
3. The four mode question templates and lure definitions
4. The 7-parameter scoring table
5. The adaptive band rules and daily rotation schedule
6. The six-stage training arc
7. The mindware script table
8. The micro-mission prompt text
9. The theoretical caution / claim boundary
10. The bottom-line training stack

**The only material that needs rewriting** is anything referencing "simple gratings" (repoint to single Gabor patch) and the wrapper-specific role descriptions (now two wrappers instead of three).
