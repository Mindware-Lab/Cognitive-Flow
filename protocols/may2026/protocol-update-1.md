
# IQ Coach — Working Memory Protocol Specification 
*High-Level Design: Gabor & Optic Flow Relational Engine*

---
Trident-G far-transfer training may expand and reshape the learner’s effective SR relational space by training variable abstraction and predictive transition structure across multiple relation families. With repeated wrapper variation, boundary testing, feedback and consolidation, these SR-style maps may become sufficiently compiled that candidate inferences are generated semi-automatically, while the global workspace selectively samples, verbalises, tests and stabilises the most relevant candidates.

The key is that the “expansion” should not be described simply as adding more facts or more strategies. It is better described as increasing the dimensionality, reach and usability of the relational state space. Training over sameness/difference, order, exclusion, transitivity, containment, causal/probabilistic relations, path constraints, counterfactuals, etc., would give the learner more abstract variables and transition operators. The Trident-G summary already makes this two-stage sequence explicit: first the system has to carve the state space into usable variables, then SR training learns transitions over those variables, and only then can boundary testing and slow Gc extraction produce a portable schema.

The “relatively automatically” part is also plausible, but needs careful wording. In Trident-G terms, the system should not become automatic in the sense of rigid stimulus–response habit. It should become automatic in the sense that candidate relational trajectories are pre-activated or cheaply sampled. That is, the learner no longer has to consciously construct every possible inference from scratch. Instead, trained SR maps make some paths, constraints, likely consequences and possible next moves more available to attention.

This would make the global workspace less like a brute-force reasoning engine and more like a selective broadcast and validation layer. The SR system supplies candidate transitions:

this state may lead there
this constraint blocks that path
this move opens that future state
this relation resembles a previously validated relation
Then the global workspace picks up the most task-relevant candidates through meta-epistemic prompts such as:

What must be true?
Can this path still reach the goal?
Which feature changed?
What would make this wrong?
What else could explain this?
That is also consistent with your protocol’s claim that meta-epistemic prompts do not train the reasoning operator directly. Instead, they act as global-workspace control handles that coordinate lower-level processes and make them reusable across tasks.

The recursive reasoning paper you uploaded gives a useful AI analogy. GRAM is not evidence for human SR training directly, but it supports the architectural plausibility of the idea that reasoning can improve when a system maintains multiple latent trajectories rather than collapsing into a single deterministic path. The paper explicitly argues that stochastic recursive latent reasoning allows multiple hypotheses, alternative strategies and parallel trajectory sampling. That maps neatly onto the Trident-G idea that an enriched SR relational space should allow multiple possible inference paths to be generated below full explicit reasoning, with conscious reasoning selecting and stabilising one or more of them.

## 1. System Architecture

The protocol is implemented as a **single relational-state engine** with two perceptual wrappers:

- **Wrapper A:** Gabor patch fields (orientation θ, spatial frequency f)
- **Wrapper B:** Optic flow patch fields (angle φ, speed v)

Both use **static circular apertures of identical size** positioned at fixed grid locations. The patches themselves never move; only their internal visual signal changes. This ensures that wrapper swaps test relational transfer, not spatial tracking or scale adaptation.

The engine runs four cognitive modes over these wrappers:

1. **State n-back** — feature maintenance
2. **Binding n-back** — arbitrary associative binding
3. **Relation n-back** — transformation tracking
4. **SR horizon** — successor-state prediction

All modes share the same trial structure, response logic, and adaptive scoring framework.

---

## 2. Stimulus System

### 2.1 Gabor Patches
- **Form:** Static circular aperture containing a sinusoidal grating
- **Features:** Orientation (θ) and spatial frequency (f)
- **Presentation:** Field of N patches (typically 5, 7, or 9) at fixed spatial positions
- **Majority function:** A target proportion of patches share the same θ and/or f; remainder are noise/distractors
- **Calibration variant:** Single patch (set size = 1) for pure perceptual-control thresholding

### 2.2 Optic Flow Patches
- **Form:** Static circular aperture containing a random-dot kinematogram (RDK) or drifting filtered noise
- **Features:** Angle/direction of motion (φ) and speed (v)
- **Presentation:** Same spatial layout as Gabor fields; same patch count; same aperture size
- **Majority function:** A target proportion of patches share coherent motion at φ and v; remainder contain random or orthogonal motion
- **Global flow variant (SR mode only):** All patches may jointly encode expansion, contraction, or rotation about a screen-center focus of expansion

### 2.3 Display Parameters
- Patch size, eccentricity, and spacing are held constant across both wrappers
- Background luminance and contrast are normalized
- Exposure time (ET), inter-trial interval (ITI), and mask parameters are identical across wrappers
- All timing is frame-counted with dropped-frame detection

---

## 3. State Space & Information Model

Each trial defines a discrete visual state vector:

**Gabor:** `S_t = [θ_t, f_t]`  
**Flow:** `S_t = [φ_t, v_t]`

Feature bins (example discretization):

| Feature | Bins | Bits |
|---------|------|------|
| Orientation / Angle | 8 | 3 |
| Spatial Frequency / Speed | 4 | 2 |

**State entropy:** `H(S) = 3 + 2 = 5 feature bits` (per feature dimension tracked)

**Load metrics:**
- **State load:** `H_feature × n`
- **Binding load:** `H_binding × n` where `H_binding = H(θ) + H(f)` or `H(φ) + H(v)`
- **Relation load:** `H_relation × n` where `H_relation = H(Δθ) + H(Δf)` or `H(Δφ) + H(Δv)`
- **SR load:** `successor surprisal × horizon`

---

## 4. The Four Cognitive Modes

### 4.1 State n-back
**Question:** Was this feature the same as n trials ago?

- Gabor: "Was the majority orientation the same as 2-back?"
- Flow: "Was the majority flow angle the same as 2-back?"

**Measures:** Feature extraction, maintenance, and updating  
**Load:** `H_feature × n`

### 4.2 Binding n-back
**Question:** Did this feature belong with that feature?

- Gabor: "Was this majority orientation previously paired with this majority spatial frequency?"
- Flow: "Was this majority angle previously paired with this majority speed?"

**Measures:** Arbitrary associative binding, pattern separation  
**Load:** `H_binding × n`  
**Lures:** Same feature, wrong pairing; recent correct pair, wrong position

### 4.3 Relation n-back
**Question:** Did the change relation repeat?

- Gabor: "Did orientation change by the same amount as before?"
- Flow: "Did flow angle change by the same amount as before?"

**Measures:** Transformation tracking, invariant detection  
**Load:** `H_relation × n` where relation = `S_t − S_{t−n}`

### 4.4 SR Horizon Mode
**Question:** Can this state lead to the target / expected next state?

- Gabor: "Given this pattern, is this the expected next pattern?"
- Flow: "Given this flow trajectory, is this the expected next field?"

**Measures:** Successor prediction, path evaluation  
**Load:** `−log2 P(S_future | S_current)` or entropy of successor distribution

---

## 5. Session Structure

### 5.1 Standard Session (15 minutes)

| Block | Duration | Stimulus | Mode | Purpose |
|-------|----------|----------|------|---------|
| **CCC Calibration** | 2 min | Single Gabor patch | Perceptual discrimination | Estimate `C-Control` (bits/sec); establish baseline dynamics |
| **Feature Discrimination** | 1 min | Single Gabor patch | Threshold tracking | Estimate JNDs for θ and f |
| **State / Binding WM** | 4 min | Gabor field | State or Binding n-back | Build workspace substrate |
| **Relation / SR WM** | 5 min | Gabor field | Relation or SR n-back | Train transformation and predictive mapping |
| **Wrapper Perturbation** | 2 min | Flow field | Same mode, new wrapper | Test horizontal transfer and recovery |
| **Prompt / Micro-Mission** | 1 min | Text / voice prompt | Meta-epistemic bridge | Vertical transfer to explicit reasoning |

### 5.2 Express Mode (2–3 minutes)
- CCC Calibration only (40–60 trials)
- Used for daily state check-in (`MIND_READY`, `MIND_IN_ZONE`, `MIND_FLAT`)
- Feeds the criticality classifier with minimal load

### 5.3 Core / Calibration Mode (20–30 minutes)
- Extended trial count (150–250 trials) for stable entropy and DFA metrics
- Used for initial capacity profiling and periodic deep calibration

---

## 6. Adaptive Engine & Scoring

### 6.1 Target Band
- **Balanced accuracy target:** 70–82%
- If >85% for two consecutive mini-blocks: increase one demand parameter
- If 60–70%: hold current level
- If <60%: reduce demand or provide support (longer ET, wider discrimination gap)

### 6.2 Adaptive Parameters (rotated, never all at once)
1. Exposure time / speed (ET)
2. Feature discrimination gap (JND)
3. n-back level (n)
4. Binding load (number of bound dimensions)
5. Relation arity (number of transformed dimensions)
6. Lure pressure (frequency and recency of foils)
7. Wrapper (Gabor ↔ Flow)

### 6.3 Trial Demand Model

```
D_trial = (H_extract / ET)                    [perceptual control]
        + α(H_binding × n)                    [associative load]
        + β(H_relation × h)                   [relational load]
        + γ(lure_pressure)                    [interference]
        + δ(wrapper_shift)                    [transfer cost]
```

### 6.4 Psychometric Function

```
P(correct) = chance + usable_range × sigmoid(θ_capacity − D_trial)
```

Where `θ_capacity` is the fitted person-level parameter.

### 6.5 Output Metrics (PS-RWC Profile)

| Metric | Symbol | Unit | Definition |
|--------|--------|------|------------|
| **C-Control** | Ĉ | bits/sec | Perceptual-control bandwidth from CCC block |
| **A-Bind** | Ŵ_A | binding-bit steps | Max arbitrary binding load at criterion |
| **R-Bind** | Ŵ_R | relation-bit steps | Max transformation relation load at criterion |
| **S-Horizon** | Ŵ_S | SR-bit steps | Max successor prediction horizon at criterion |
| **I-Lure** | Î | d′ cost | Interference susceptibility from false alarms |
| **W-Recovery** | Ŵ_W | accuracy cost / trials | Performance drop and recovery slope after wrapper swap |

---

## 7. Training Progression

### 7.1 10-Day Arc (Minimum Viable)

| Day | Focus | Primary Load | Transfer Principle |
|-----|-------|------------|------------------|
| 1 | CCC baseline + feature discrimination | Speed / ET | Baseline cognitive bandwidth |
| 2 | Multi-feature majority (θ, f) | Discrimination gap | Variable abstraction |
| 3 | 1-back state tracking | n = 1 | Active workspace entry |
| 4 | 1-back arbitrary binding (θ↔f) | Binding load | Episodic feature binding |
| 5 | 2-back arbitrary binding | n = 2 | Temporal extension |
| 6 | 1-back relational change | Relation type | Transformation tracking |
| 7 | 2-back relational change | n + relation | Relational binding over time |
| 8 | Wrapper swap (Gabor → Flow) | Wrapper variation | Horizontal transfer |
| 9 | SR path / successor mode | Successor horizon | Predictive map training |
| 10 | Mixed delayed probe + prompt | Transfer test | Consolidation check |

### 7.2 20-Day Arc (Full Trident-G)

| Phase | Days | Aim |
|-------|------|-----|
| **Calibrate & Carve** | 1–4 | CCC baseline; feature discrimination; find Ψ-band range |
| **Build Binding** | 5–8 | Arbitrary associations; lure resistance; temporal extension |
| **Build Relational** | 9–12 | Transformation tracking; cross-feature relations; conjunctions |
| **Force Portability** | 13–16 | Wrapper swaps; breakpoint perturbation; recovery timing |
| **SR Horizon & Niche** | 17–20 | Successor prediction; prompts; implementation cues; delayed probes |

---

## 8. Criticality & State Classification Integration

The trial-level time-series from each session feeds the **Cognitive Criticality Classifier**.

### 8.1 Trial Efficiency Series
```
u_t = z(efficiency_t) = z(correct_t × bits_t / RT_t)
```
or residual RT after regressing out task-design effects (ratio, switch, ET, trial index).

### 8.2 Dynamics-Core Features
- `cog_rate` — median trial efficiency (linked to CCC)
- `cog_alpha1` — DFA scaling exponent on `u_t`
- `cog_lag1`, `cog_lag2` — autocorrelation (persistence)
- `cog_roughness` — local jaggedness
- `cog_sign_change` — alternation rate
- `cog_perm_entropy3` — ordinal unpredictability
- `switch_cost_rt`, `switch_cost_acc` — reconfiguration cost
- `perseveration` — post-error / post-switch response trapping

### 8.3 Product States

| State | Dynamical Signature | Meaning |
|-------|---------------------|---------|
| **MIND_READY** | Adequate rate, flexible dynamics, moderate engagement | Available; warm-up may help |
| **MIND_IN_ZONE** | High rate, `cog_alpha1 ≈ 1.0`, low persistence, low switch cost, organized updates | Near-critical cognition; optimal for deep work |
| **MIND_FLAT** | Low rate, sluggish dynamics, low engagement | Subcritical; needs activation |
| **MIND_LOCKED_IN** | High rate, high persistence, high switch cost, reduced entropy | Supercritical rigid; productive but brittle |
| **MIND_SPUN_OUT** | Erratic rate, high entropy, unstable accuracy, weak constraint | Supercritical chaotic; needs grounding |

### 8.4 Mind-Body Alignment
Classifier outputs are structurally aligned with body-state classification (e.g., `BODY_ACTIVATED_NEAR_ZONE` ↔ `MIND_IN_ZONE`). Disagreement between mind and body classifiers is itself a usable signal (e.g., high cognitive effort with physical rigidity indicates recovery debt).

---

## 9. Product Outputs

### 9.1 User-Facing Labels
- **Cognitive Bandwidth** — from CCC block
- **Pattern Binding** — from A-Bind
- **Change Tracking** — from R-Bind
- **Path Prediction** — from S-Horizon
- **Today's Training Band** — Stable / Stretch / Overloaded

### 9.2 Internal Research Outputs
- Full PS-RWC parameter vector per session
- Trial-level time-series (anonymized) for model refinement
- State trajectory (MIND state proportions across session windows)
- Recovery metrics (wrapper-swap cost, post-breakpoint regain slope)

---

## 10. MVP Roadmap

### MVP 1: Gabor Relational Engine
- Single Gabor patch CCC calibration
- Gabor field: state n-back, binding n-back, relation n-back
- Lures and adaptive scoring
- Basic PS-RWC parameter estimation

### MVP 2: Wrapper Transfer
- Add flow patch fields (same size, same layout)
- Wrapper swap: Gabor → Flow at same relation level
- W-Recovery metric
- Criticality classifier on full session time-series

### MVP 3: SR Horizon & Integration
- Flow patch SR mode: trajectory → successor → target reachability
- Global flow patterns (expansion, rotation) for action-oriented inference
- Meta-epistemic prompts and micro-missions
- Full 20-day progression with delayed probes

---

## 11. Key Constraints & Cautions

1. **No moving patches.** Optic flow must be internal to static apertures. Moving patches would convert the task into multiple-object tracking, engaging dorsal-stream mechanisms outside the protocol's target workspace.
2. **Presemantic framing.** Avoid verbal labels for features. Use perceptual same/different judgments to minimize global-workspace recoding.
3. **No direct neural claims.** The task is an SR-inspired relational workspace measure, not a direct hippocampal or neural readout.
4. **Spaced practice required.** The 10-day arc is a minimum; 20 days with delayed re-checks is needed for slow schematic Gc consolidation claims.
5. **Balanced accuracy, not raw accuracy.** Same/different and lure distributions bias raw scores; use balanced accuracy for all adaptive decisions.
6. **Timing validation.** Online frame drops can contaminate short ET estimates. Log device timing flags and exclude contaminated trials from CCC estimation.

---

# SR Inference Space

## 1. Transitive / Ordinal Chains
**Logic:** If A > B and B > C, then A > C.

**Gabor implementation:**
- Three patches (or sequential fields) show orientations: θ_A = 60°, θ_B = 30°, θ_C = 0°.
- Training: learner tracks "clockwise from" relations across trials.
- Probe: given A and C without B, predict the implicit relation.

**Flow implementation:**
- Three patches show speeds: v_A = fast, v_B = medium, v_C = slow.
- Training: "faster than" links form a chain.
- Probe: does A flow faster than C?

**SR map encoding:** The successor matrix learns transition probabilities that preserve order. The implicit transitive inference (A > C) emerges from the composition of two learned steps.

**Expansion value:** Trains ordinal ranking, which underlies numerical reasoning, social hierarchy inference, and decision-making under uncertainty.

---

## 2. Analogical / Structural Mapping (A:B :: C:D)
**Logic:** The relation between A and B is the same as between C and D.

**Gabor implementation:**
- Field 1: majority orientation shifts from vertical to horizontal (Δθ = +90°).
- Field 2: majority spatial frequency shifts from low to high (Δf = +2 steps).
- Training: learner judges "same transformation type?"
- Probe: new field shows orientation shift; which frequency shift completes the analogy?

**Flow implementation:**
- Patch A: flow angle rotates 45° right while accelerating.
- Patch B: flow angle rotates 45° right while decelerating.
- Probe: given a new rotation+acceleration pattern, select the matching speed transformation.

**SR map encoding:** The system learns that certain state-difference vectors are equivalent across feature dimensions. This is "second-order relation" — a relation between relations.

**Expansion value:** Core to matrix reasoning (Raven's), scientific analogy, and metaphorical reasoning.

---

## 3. Progression / Trend Extrapolation
**Logic:** A → A+Δ → A+2Δ → predict A+3Δ.

**Gabor implementation:**
- Trial t: θ = 0°
- Trial t+1: θ = 45°
- Trial t+2: θ = 90°
- Probe: what is the expected θ at t+3? (135°)

**Flow implementation:**
- Sequential fields show coherent flow angle rotating 30° clockwise each trial.
- Probe: is the next field consistent with the trend, or a lure (random angle)?

**SR map encoding:** The successor representation captures not just state-to-state transitions but the *derivative* of change. The predictive map encodes `S_{t+1} = S_t + Δ` where Δ is itself a state variable.

**Expansion value:** Underlies time-series prediction, physical intuition, and strategic planning ("if this trend continues...").

---

## 4. Conjunctive / Compositional Rules
**Logic:** A AND B together predict C. Neither alone is sufficient.

**Gabor implementation:**
- State rule: IF (θ = vertical) AND (f = high) THEN next state has L = bright.
- Training: learner sees sequences where the conjunction determines the successor.
- Lure: vertical + low frequency → no brightness change (tests conjunction vs. single-cue strategy).

**Flow implementation:**
- IF (φ = rightward) AND (v = fast) THEN next field expands.
- Probe: rightward + slow → does expansion follow? (No, lure.)

**SR map encoding:** The transition probability `P(S_future | S_current)` is conditioned on the joint state vector, not independent features. The SR matrix must represent multi-dimensional conjunctions.

**Expansion value:** Trains configural reasoning, necessary-cause inference, and resistance to simple heuristics.

---

## 5. Conditional / Probabilistic Rules
**Logic:** If A, then probably B (but not always). Track confidence.

**Gabor implementation:**
- 80% of the time, high spatial frequency is followed by clockwise rotation.
- 20% of the time, it is followed by counter-clockwise.
- Training: learner tracks the conditional probability, not a deterministic rule.
- Probe: given high frequency, is the next state the common or rare successor?

**Flow implementation:**
- Fast flow usually (70%) leads to expansion in the next field.
- Sometimes (30%) it leads to contraction.
- Learner must encode the probabilistic transition map.

**SR map encoding:** This is the canonical SR formulation. The successor matrix `M` explicitly encodes expected future occupancy: each state is represented by the vector of states it leads to, weighted by probability. Stachenfeld et al.'s predictive map is exactly this.

**Expansion value:** Core to decision-making under uncertainty, causal learning, and expected-value computation.

---

## 6. Mutual Exclusion / XOR Relations
**Logic:** A or B, but not both. The presence of one predicts the absence of the other.

**Gabor implementation:**
- Two patches in a field: one vertical, one horizontal.
- Rule: if vertical is majority, horizontal must be minority (and vice versa).
- Probe: field shows both at equal strength → violates exclusion (anomaly detection).

**Flow implementation:**
- Rule: expansion and rotation are mutually exclusive in the global field.
- Probe: field shows both simultaneously → anomaly.

**SR map encoding:** The transition matrix has zero or near-zero probability for certain joint states. The map learns *constraint structure* — which state combinations are unreachable.

**Expansion value:** Underlies logical negation, anomaly detection, and consistency checking in reasoning.

---

## 7. Hierarchical / Containment Relations
**Logic:** State A is nested within / subordinate to state B. Changing B changes A, but not vice versa.

**Gabor implementation:**
- Global field property: overall contrast level (sets the "context").
- Local patch property: orientation within that context.
- Rule: when global contrast drops, all orientations shift by +15° (context determines local state).
- Probe: does local orientation change predict global contrast? (No — tests asymmetry.)

**Flow implementation:**
- Global flow: expansion rate of the whole field.
- Local flow: angle of individual patches.
- Rule: global expansion modulates local speed, but local speed does not modulate global expansion.

**SR map encoding:** The successor representation encodes asymmetric influence. The "higher-level" state variable acts as a latent cause that reshapes the transition structure of lower-level variables.

**Expansion value:** Trains context sensitivity, nested rule systems, and understanding of scope/scale in reasoning.

---

## 8. Counterfactual / Path-Dependent Relations
**Logic:** What would have happened if I had taken the other path? Compare actual vs. possible trajectories.

**Gabor implementation:**
- At trial t, the field splits implicitly: two possible successor states were probable.
- Trial t+1 shows the actual successor.
- Probe: "Was the *other* state still possible from trial t?" (Yes/No — tests whether the learner held both options in mind.)

**Flow implementation:**
- Flow field at t suggests two possible future directions (e.g., leftward or rightward rotation both plausible).
- At t+1, one path is realized.
- Probe: given the state at t+2, could it have been reached from the *unrealized* path at t?

**SR map encoding:** The SR map naturally represents *multiple* future possibilities from each state. Counterfactual reasoning requires that the learner maintains the branching structure, not just the taken path. This is the "multiple latent trajectories" logic from the GRAM paper applied to human cognition.

**Expansion value:** Core to strategic reasoning, regret-based learning, and planning ("if I do X instead of Y...").

---

## 9. Equivalence / Substitution Classes
**Logic:** A and B are distinct surface states but functionally equivalent in the transition structure.

**Gabor implementation:**
- θ = 45° with f = low produces the same successor as θ = 135° with f = high.
- Training: learner sees that two different surface patterns lead to the same next state.
- Probe: new pattern → predict successor based on equivalence class, not surface identity.

**Flow implementation:**
- φ = 0° with v = fast → expansion.
- φ = 180° with v = slow → also expansion.
- Learner extracts that *expansion* is the invariant outcome, not the specific angle/speed combination.

**SR map encoding:** The SR map clusters states by their successor consequences. This is "state abstraction" — collapsing the raw state space into a lower-dimensional "latent cause" space.

**Expansion value:** Underlies concept formation, category induction, and transfer of learning across superficially different problems.

---

## 10. Delayed / Distant Horizon Relations
**Logic:** A → [gap] → B. The relation spans interruptions or distractors.

**Gabor implementation:**
- Standard n-back already does this (1-back, 2-back, 3-back).
- Extension: insert "distractor trials" (different relation family) between A and B.
- Probe: does the A→B relation survive the intervening structure?

**Flow implementation:**
- Flow trajectory is interrupted by random noise fields.
- Probe: after the noise, does the trajectory continue as predicted?

**SR map encoding:** Tests whether the SR map is robust to off-policy experience. The transition matrix must maintain its structure even when the learner is not actively sampling from it.

**Expansion value:** Critical for real-world reasoning, where relevant cues are rarely contiguous. Tests "slow schematic Gc" — the stability of relational knowledge over time.

---

## Summary: The Relational Space Expansion Arc

| Stage | Relation Family | Cognitive Operation | Trident-G Phase |
|-------|----------------|---------------------|-----------------|
| 1 | State maintenance | Feature hold | Variable extraction |
| 2 | Arbitrary binding | A ↔ B | Binding |
| 3 | Transitive chains | A > B > C → A > C | Local SR composition |
| 4 | Progression/trend | A → A+Δ | Derivative tracking |
| 5 | Analogy | A:B :: C:D | Second-order relation |
| 6 | Conjunction | A ∧ B → C | Configural rule |
| 7 | Conditional | P(B\|A) = 0.8 | Probabilistic SR |
| 8 | Mutual exclusion | A XOR B | Constraint structure |
| 9 | Hierarchy | B modulates A | Asymmetric influence |
| 10 | Counterfactual | A → B vs A → C' | Branching trajectory |
| 11 | Equivalence | A ≡ B by consequence | State abstraction |
| 12 | Delayed horizon | A → [gap] → B | Consolidation / Gc |

---

## Practical Implementation Strategy

You cannot train all 12 simultaneously. The recommended progression:

**Days 1–5:** State, binding, transitive chains, simple progression.  
**Days 6–10:** Analogy, conjunction, conditional probability.  
**Days 11–15:** Mutual exclusion, hierarchy, counterfactual.  
**Days 16–20:** Equivalence classes, delayed probes, mixed relation blocks.

The **mixed relation block** (Day 20) is the critical transfer test: the learner must identify *which relation family* applies to the current trial, then execute the appropriate inference. This is the "global-workspace selection" layer — the meta-epistemic prompt becomes: *"What kind of relation is this?"* rather than *"What is the answer?"*

This architecture makes the SR relational space genuinely **multi-dimensional**. The learner is not just learning "what comes next" in one domain; they are building a library of transition operators that the global workspace can sample from during novel problem solving.
