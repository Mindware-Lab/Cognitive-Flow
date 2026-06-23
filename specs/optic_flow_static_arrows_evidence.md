
## Why Optic Flow Has Special Status

### 1. Direct Functional Connectivity to the Hippocampal SR System

Optic flow regions (V3A, V6, hMT+) show **direct functional connectivity with hippocampus and retrosplenial cortex during first-person navigation**. In an fMRI study using first-person perspective navigation, right hMT+ showed significant functional connections with:
- **Hippocampus** (head and body)
- **Retrosplenial cortex**
- **Posterior parietal cortex**
- **Precuneus**
- **Medial prefrontal cortex** 

This is not generic visual processing — it's a **dedicated pathway for self-motion updating of spatial representations**. The authors explicitly note: "optic flow information drives head direction cells to maintain the direction and speed of a trajectory... [which] drive grid cell responses in the entorhinal cortex that in turn update place cells in the hippocampus" .

Gabor patches have **no equivalent dedicated pathway** to the hippocampal navigation system. They are processed through the ventral stream (V1→V2→V4→IT) for object/feature recognition, which connects to hippocampus but **not through the spatial updating circuit**.

### 2. Causal Control Over Hippocampal Place Cells

A 2024 closed-loop VR study demonstrated that **pure optic flow can causally drive and recalibrate hippocampal place cells** in the absence of any landmarks. Rats running in a dome with only moving light stripes (optic flow) showed:
- Place field drift controlled by optic flow gain
- **Recalibration of path integration gain** via neural feedback control
- The hippocampal system "continuously rebalances the influence of conflicting idiothetic cues to fine-tune the neural dynamics of path integration" 

This is critical: optic flow doesn't just *correlate* with hippocampal activity — it **controls** it. No comparable evidence exists for Gabor orientation driving place cell dynamics.

### 3. The Ventromedial "Where" Stream vs. Ventral "What" Stream

Rolls and colleagues' connectivity analyses reveal a **dedicated ventromedial visual stream** for scene/location information:
- V1→V2→V3→V4→VMV→PHA1-3 (parahippocampal scene area)→hippocampus
- This stream carries **"where" information** about locations in scenes
- Optic flow regions (V3, V6, MT+) feed into this stream via parietal cortex for **idiothetic update** 

Gabor orientation is processed in the **ventral "what" stream** (V1→V2→V4→IT), which supports object recognition but **not spatial updating**. While IT projects to hippocampus, it does so for **object-in-scene binding**, not for trajectory prediction.

---

## What Gabor Patches Can and Cannot Do

Gabor patches are well-studied in working memory research. They show:
- **Early visual cortex (EVC) maintenance** via persistent activity or synaptic traces 
- **Frontal module involvement** for attractor dynamics during delay periods 
- **Repulsive bias effects** on subsequent orientation perception from WM contents 

But critically, Gabor orientation WM tasks engage a **different circuit** than optic flow:
- **Gabor WM**: EVC→frontal (dorsolateral PFC)→parietal. This is the **frontoparietal control network** for feature maintenance.
- **Optic flow SR**: hMT+/V6→retrosplenial→hippocampal→entorhinal. This is the **navigational prediction network**.

Your paradigm aims to train **SR graph learning** — the predictive map of state transitions. The hippocampal-entorhinal system is the natural substrate for this. Gabor patches don't engage it directly; optic flow does.

---

## Could You Use Gabor Patches Anyway?

You *could*, but you'd be training a **different neural system** with different transfer properties:

| Feature | Optic Flow | Gabor Patches |
|--------|-----------|---------------|
| **Primary circuit** | Hippocampal-entorhinal (spatial SR) | Frontoparietal (feature WM) |
| **Natural SR substrate** | Yes — place/grid cells encode transitions | No — no transition-encoding cells |
| **Graph structure learning** | Supported by path integration mechanisms | Requires arbitrary association learning |
| **Transfer to spatial reasoning** | Direct — same circuit | Indirect — requires cross-system transfer |
| **Transfer to fluid intelligence** | Via hippocampal-prefrontal connectivity | Via frontoparietal capacity expansion |

If your goal is **navigational-binding SR graph learning** as a substrate for fluid intelligence, optic flow is the ecologically valid choice. Gabor patches would train working memory capacity, but not the **predictive map structure** you're targeting.

---


**Option: Optic flow with parametric feature variation**
- Standard optic flow (radial, laminar, circular)
- Superimpose colour/speed (later sound) as arbitrary binding dimensions
- This keeps the directional/navigational core while adding your conjunction training


## The Core Principle

The SR literature suggests that **the brain has multiple SR systems**:
- **Hippocampal-entorhinal**: For spatial/navigational state spaces, driven by optic flow, head direction, grid cells
- **Frontostriatal**: For action-value state spaces, driven by reward prediction errors
- **Frontoparietal**: For cognitive state spaces, driven by task rules and attention

Your paradigm targets the **hippocampal-entorhinal SR** because it's the one linked to structured cognitive maps and fluid intelligence. To engage it, you need **navigational-directional input** — optic flow, not static orientation.

The dimensional n-back scaffolding (1D→2D→3D) works **on top of** this base input. The question isn't "optic flow or Gabors?" but rather:

> *"What is the most basic directional/navigational signal that the hippocampal SR system can bind arbitrary features to?"*

The answer from the literature is clear: **optic flow**. It's the native language of the path integrator.

---

## Practical Recommendation

Use **optic flow as the base directional dimension** for all four graph classes, with colour and sound as the arbitrary binding dimensions. If you need more experimental control, use **parametric optic flow** (speed, direction, pattern type) rather than substituting Gabor orientation.

The neural prediction would be:
- **Posterior hippocampus**: Tracks optic flow transitions (the graph structure)
- **Anterior hippocampus**: Binds colour/sound conjunctions to flow states
- **Entorhinal cortex**: Maintains the stable metric structure across all conditions

---

Multiple static arrows are a strong alternative to optic flow, and in some ways a better controlled stimulus. But the critical question is whether they engage the **same hippocampal-navigational SR circuit** or a **different, more frontoparietal one**. The distinction matters for your transfer claims.

---

## Static Arrows vs. Optic Flow: What Changes

| Property | Optic Flow | Static Arrow Arrays |
|----------|-----------|---------------------|
| **Motion signal** | Real/continuous motion energy | Implied/static direction |
| **Primary visual processing** | hMT+/V5, V3A, V6 (dorsal motion stream) | V1→V2→V4→IT (ventral form stream) + parietal (spatial attention) |
| **Naturalistic self-motion cue** | Yes — directly signals heading | No — symbolic/communicative |
| **Hippocampal engagement mechanism** | Path integration via optic flow gain | Likely via **spatial attention/imagined movement** or **symbolic rule encoding** |
| **Experimental control** | Lower (luminance, speed, coherence) | Higher (orientation, colour, number, arrangement) |
| **Cognitive load** | Lower (automatic processing) | Higher (requires decoding/interpretation) |

The key difference: **optic flow is an idiothetic self-motion signal**; static arrows are **exteroceptive directional symbols**. The brain processes these through partially overlapping but distinct pathways.

---

## Evidence for Static Directional Cues Engaging Hippocampal Circuits

There is relevant evidence, but it's more indirect than for optic flow:

### 1. Retrosplenial Cortex Responds to Both Optic Flow and Static Directional Cues

The retrosplenial cortex (RSC) — a key hub between visual cortex and hippocampus — is activated by:
- **Heading direction** from optic flow during navigation
- **Landmark-based orientation** (static cues indicating direction)
- **Implied motion** and **scene perspective**

RSC damage impairs **heading retrieval** even when landmarks are static. This suggests RSC can bridge static directional cues to the hippocampal navigation system, but likely through a **different computational route** (landmark recognition → heading inference) than optic flow (direct path integration update).

### 2. Parietal-Hippocampal Interactions for Spatial Attention

The posterior parietal cortex (PPC) processes **spatial attention to static directional cues** (e.g., arrows in Posner tasks). PPC has strong connections to:
- **Hippocampus** (via retrosplenial/parahippocampal)
- **Prefrontal cortex** (frontoparietal control network)

Static arrows could engage hippocampus **via parietal attention mechanisms** rather than via direct path integration. The hippocampus would represent "attended direction" rather than "experienced self-motion."

### 3. Symbolic Spatial Reasoning Activates Hippocampus

Studies of **map reading** and **symbolic spatial reasoning** show hippocampal engagement when participants:
- Imagine movement along a route from a map
- Infer heading from static compass-like cues
- Perform mental rotation of spatial layouts

This suggests the hippocampus can operate on **symbolically transformed spatial information**, not just direct sensory motion. But the engagement is typically **weaker and more anterior** than for actual navigation.

---

## The Critical Design Question for Your Paradigm

Can static arrows support **SR graph learning** in the hippocampal-entorhinal system? The answer is **probably yes, but with caveats**:

### What Would Work Well

**Radiating arrows (optic flow analogue):**
- Array of arrows pointing outward from center
- Creates a **global radial pattern** similar to expansion flow
- Likely engages **looming/heading detection mechanisms** in parietal cortex
- Could support "move forward" vs. "move backward" graph states

**Uniform directional arrows (all up/down/left/right):**
- Clear categorical direction signal
- Easy to bind with colour/sound in 2D/3D n-back
- Supports **discrete state spaces** (N, S, E, W) rather than continuous heading

### What Would Be Weaker

- **Continuous trajectory prediction**: Static arrows don't support the fine-grained heading integration that optic flow provides. The SR would be **categorical** (states = arrow directions) rather than **metric** (states = positions in continuous space).
- **Automatic path integration**: With optic flow, the brain automatically updates position. With static arrows, the participant must **actively interpret and simulate** movement. This adds a frontoparietal "decoding" layer before hippocampal engagement.
- **Speed/velocity encoding**: Static arrows have no natural speed parameter. You'd need to vary arrow size, number, or flash rate — all more arbitrary than optic flow speed.

---

## A Hybrid Proposal: Use Both, as a Generalisation Test

Rather than choosing one, you could design the paradigm to **train with optic flow, test with static arrows** (or vice versa). This tests a key claim:

> *Does SR graph learning transfer across sensory modalities (dynamic flow → static symbols)?*

If it does, this demonstrates **abstract relational coding** — the hippocampus has learned the graph structure independent of the surface format. This is exactly the **portable Y variable** from your Trident G framework: the invariant relational structure that persists across surface changes.

### Proposed Design

| Phase | Stimulus | Purpose |
|-------|----------|---------|
| **Training (Phases 1-3)** | Optic flow + colour + sound | Build hippocampal SR via naturalistic path integration |
| **Transfer Test A** | Static radiating arrows + same colour/sound bindings | Test: does SR transfer to symbolic directional cues? |
| **Transfer Test B** | Static uniform arrows + new colour/sound bindings | Test: does SR transfer to new surface features? |
| **Transfer Test C** | Optic flow + new colour/sound bindings | Test: is the SR bound to specific features or abstract? |

---

## Neural Predictions: Optic Flow vs. Static Arrows

| Region | Optic Flow Prediction | Static Arrow Prediction |
|--------|----------------------|------------------------|
| **hMT+/V5** | Strong, early activation | Weak or absent |
| **V3A/V6** | Strong heading-related | Weak |
| **Posterior parietal** | Moderate (spatial updating) | Strong (spatial attention, direction decoding) |
| **Retrosplenial** | Strong (heading integration) | Moderate (landmark-based orientation) |
| **Posterior hippocampus** | Strong (path integration) | Moderate (spatial memory, categorical direction) |
| **Anterior hippocampus** | Moderate (feature binding) | Moderate to strong (symbolic binding) |
| **Entorhinal cortex** | Strong (grid cell update) | Weaker (less metric structure to encode) |
| **RLPFC** | Moderate (prospective planning) | Stronger (more symbolic/decoding demand) |
| **DLPFC** | Weak | Moderate (rule-based attention) |

The pattern suggests: **static arrows shift load from posterior hippocampus/entorhinal (metric SR) to anterior hippocampus/RLPFC (symbolic/categorical SR)**. Both are valid, but they train **different geometries** of the same underlying graph.

---

## Practical Recommendation

**Use optic flow as the primary training stimulus** for the reasons outlined: direct hippocampal engagement, naturalistic path integration, and stronger evidence base for SR learning.

**Use static arrow arrays as a deliberate transfer condition** to test whether the learned SR is:
1. **Modality-specific** (bound to optic flow dynamics) or
2. **Abstract-relational** (transferable to symbolic directional cues)

This gives you the best of both: ecological validity for training, plus experimental control and generalisation testing for theory.

If you do use static arrows in training, **radiating arrays** (mimicking expansion/contraction flow) are preferable to uniform arrows because they better approximate the **heading/looming signal** that parietal-RSC-hippocampus circuits are tuned for.
- **RLPFC**: Engages during n-forward and surprise detection (prospective/meta operations)

This gives you the **navigational-binding SR** you're after, with direct relevance to the hippocampal-prefrontal circuit for fluid intelligence.
