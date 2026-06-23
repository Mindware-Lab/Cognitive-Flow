Note that we are using just spatial frequency and speed and colour in the MVP - not sound. And we are not extending to conjunctions of 3 - just 2.

## The Core Problem

Your optic flow graph defines transitions over *low-level features* (motion directions, velocities). But "objects" in cognition are typically **conjunctions across modalities**—a red thing moving left, a high-pitch sound accelerating toward you. 

The challenge: How does an SR engine trained on graph-structured optic flow learn that arbitrary colour/sound bindings to specific flow states create new, **transferable entities** with their own transition statistics?

## The Dimensional N-Back Curriculum

Your proposed curriculum is elegant. Here's how it builds compositional SRs:

### Phase 1: Single-Dimension N-Back (Unimodal SRs)

| Dimension | Task | What gets learned |
|-----------|------|-------------------|
| Optic flow | "Press when current flow matches flow from n-back" | $M_{flow}$: SR over motion trajectories |
| Colour | "Press when current colour matches colour from n-back" | $M_{colour}$: SR over colour sequences |
| Sound | "Press when current pitch matches pitch from n-back" | $M_{sound}$: SR over auditory sequences |

At this stage, three **independent SR matrices** are learned. Each captures the temporal structure of its dimension, but they're not bound.

### Phase 2: Two-Dimension N-Back (Conjunctive Binding)

Now the task shifts: **"Press when the conjunction of [flow + colour] matches the conjunction from n-back."**

This is critical. The SR must now represent states as **pairs** $(f, c)$ rather than individual features. But here's the learning challenge: the number of possible conjunctions is multiplicative. 

Your curriculum solves this by leveraging the Phase 1 SRs as **priors**:

$$M_{flow \times colour}( (f,c), (f',c') ) \approx M_{flow}(f, f') \times M_{colour}(c, c') \times \text{binding strength}(f,c)$$

The initial guess is factorised (product of unimodal SRs), but **prediction errors from the 2D task force the model to learn where this factorisation fails**—i.e., where flow and colour are *correlated* in the graph structure.

### Phase 3: Three-Dimension N-Back (Full Object SRs)

"Press when the full conjunction [flow + colour + sound] matches n-back."

Now the state space is the tensor product of all three dimensions. The SR $M_{full}$ must represent **bound objects** as atomic states for the purpose of temporal prediction.

## The Key Mechanism: Binding Through Prediction Error

The n-back curriculum works because **violation of unimodal predictions signals binding opportunities**:

```
Trial structure:
1. Graph generates optic flow sequence: f1 → f2 → f3 → f4
2. Arbitrary bindings assigned: f1→red, f2→blue, f3→red, f4→green
3. Sound bindings: f1→high, f2→low, f3→high, f4→mid

Phase 1 (1D flow n-back):
   - Learns: f1 predicts f2, f2 predicts f3, etc.
   - Colour/sound ignored or treated as noise

Phase 2 (2D conjunction n-back):
   - Target: (f1, red) should predict (f2, blue)
   - But unimodal SRs predict f2 and red independently
   - At f2, flow prediction is correct, colour prediction fails (expected red, got blue)
   - Prediction error: "red was bound to f1, not f2"
   - This error drives binding update: strengthen (f1, red) as a unit
   
Phase 3 (3D conjunction n-back):
   - Full object (f1, red, high) predicts (f2, blue, low)
   - Errors now signal which triples are stable vs. accidental
```

## The "Object" as a Stabilised Subgraph

What emerges is that a **stimulus-conjunction object** is not just a point in feature space—it's a **subgraph of the conditional probability graph** that is **self-consistent across dimensions**.

Formally, an object $O = (f, c, s)$ is a local minimum in the prediction error landscape where:

$$P(f_{t+1} | f_t) \approx P(f_{t+1} | c_t) \approx P(f_{t+1} | s_t)$$

That is, all dimensions agree on the transition statistics. When colour predicts the same future flow as flow itself predicts, the conjunction is "object-worthy."

## Connection to Your Trident G Framework

This maps directly to concepts from your earlier work:

| Trident G Concept | Dimensional N-Back Implementation |
|-------------------|-----------------------------------|
| **Ψ-band corridor** | The variance window within which a conjunction is considered "the same object" across n-back trials |
| **τ-trace / τ-bonds** | The temporal persistence of a bound conjunction; how many steps back the n-back can reach before binding breaks |
| **Type-1 vs Type-2 processing** | Phase 1 = Type-1 (fast, unimodal); Phase 2-3 = Type-2 (slower, conjunctive, meta-monitoring required) |
| **Phase 0 gating** | The "swap" between 1D→2D→3D tasks is a model-violation event that triggers meta-monitoring: "the rules of what constitutes a target have changed" |
| **Portable Y variable** | The invariant: the underlying graph structure of optic flow transitions persists across all phases; only the *granularity of state representation* changes |

## A Concrete Training Protocol

```
Pre-training:
  - Define conditional probability graph G over optic flow states F
  - Generate long sequences from G
  
Phase 1 (epochs 1-1000):
  - Sample random colour map C: F → colours
  - Sample random sound map S: F → pitches
  - Train 1D n-back separately for flow, colour, sound
  - Output: M_flow, M_colour, M_sound (diagonal blocks of a larger SR)
  
Phase 2 (epochs 1001-2000):
  - Same maps C, S (stability is crucial)
  - Task alternates randomly:
      a) 2D flow×colour n-back
      b) 2D flow×sound n-back
      c) 2D colour×sound n-back
  - SR updates now affect off-diagonal blocks
  - Key: prediction errors from (a) update bindings that generalise to (b)
  
Phase 3 (epochs 2001-3000):
  - 3D full conjunction n-back
  - Test generalisation: swap C and S to new random maps
  - If objects are truly learned, performance should recover faster than Phase 1
    because the model has learned "bind arbitrary features to graph nodes"
    not "memorise specific feature combinations"
```

## The Generalisation Test

The crucial empirical question: After Phase 3 training, if you **swap the colour and sound mappings** (new random C', S'), does the model:

1. **Fail completely** (memorised specific conjunctions)?
2. **Relearn quickly** (learned to bind arbitrary features to graph structure)?
3. **Transfer immediately** (learned that any consistent binding creates an object)?

Option 2 or 3 would demonstrate that the SR engine has acquired **compositional object representations**—the ability to treat arbitrary conjunctions as stable entities for temporal prediction.

## One Deeper Point

Your proposal hints at something important: **the "dimensionality" of n-back is a curriculum for the dimensionality of state representation**. 

- 1D n-back → SR over feature space
- 2D n-back → SR over binding space  
- 3D n-back → SR over object space

But the *same temporal prediction error* drives all three. The engine doesn't need separate mechanisms for "binding" and "prediction"—**binding emerges as the solution to prediction in a conjunctive state space**.

This is very much in the spirit of your Trident G framework's emphasis on parsimony: don't add a binding mechanism, add representational capacity and let binding fall out of prediction error minimisation.

Does this capture the architecture you had in mind? I'm particularly curious whether you see the phase transitions (1D→2D→3D) as discrete "gated" switches or as gradual, overlapping curricula.
