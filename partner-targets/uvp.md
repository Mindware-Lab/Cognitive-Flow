**IQ Coach is not a conventional brain-training app built around isolated games. It is a layered cognitive-performance training system that trains whether useful relations can be extracted, held, bound, predicted from, reasoned with, recovered after surface change, and re-checked after delay.**

The GitHub spec now gives you a coherent product architecture: five core capacities — **Attention Control, Relational Memory, Binding Memory, Path Prediction and Reasoning** — supported by a shared hidden graph engine rather than separate mini-games. The same underlying relational structure is projected into different cognitive operations, so the user moves from extracting the signal, to holding the relation, binding it to context, predicting from it, reasoning with it, and recovering it after wrapper change and delay. ([GitHub][1])

# IQ Coach: Partner-Facing Intervention Summary

IQ Coach is a cognitive-performance training app based on the Trident-G Far Transfer Protocol. It is designed to train portable adaptive cognition rather than narrow improvement on one repeated task.

The intervention trains five core capacities:

1. **Attention Control**
   The user learns to extract the relevant signal from brief, noisy displays under time pressure.

2. **Relational Memory**
   The user learns to hold and compare relations across delay, while resisting tempting wrong-lag or near-match lures.

3. **Binding Memory**
   The user learns to maintain what belongs with what, such as relation-colour-context conjunctions.

4. **Path Prediction**
   The user learns probabilistic transition structures: what usually follows, what is rare but possible, what is invalid, and whether a path can still reach a goal.

5. **Reasoning**
   The user recovers the same relational structure in symbolic, nonsense-semantic and applied reasoning formats.

The distinctive design principle is that these are not unrelated games. IQ Coach uses a shared conditional-probability graph engine underneath the training stack. The same hidden relation can appear as a visual pattern, a memory demand, a bound state, a predictive path, or an explicit reasoning item. This allows the app to measure not only whether the user improves locally, but whether the same relation survives transformation across cognitive layers.

The app’s training logic is based on three transfer tests:

**Horizontal transfer**
Can the user recover the same relation after the surface changes, for example from arrows to optic flow, or from visual to symbolic reasoning?

**Vertical transfer**
Can the user reconstruct the same relation across processing layers: attention, memory, binding, prediction and reasoning?

**Delayed transfer**
Can the user recover the relation later, after interference, delay or changed task conditions?

The commercial significance is that IQ Coach can give partners more than a generic “brain score”. It can provide a structured cognitive profile showing where a user’s performance may be limited: signal extraction, relational memory, binding, future-state prediction, explicit reasoning, wrapper recovery or delayed recovery.

The strongest claim is not that IQ Coach already proves IQ gains. The defensible claim is that it provides an evidence-generating training and measurement system for testing whether cognitive operations become more portable across changed surfaces, interference, delay and applied reasoning contexts.

For partners, IQ Coach can be positioned as a cognitive-performance training and validation platform for education, professional performance, assessment preparation, decision-readiness, cognitive longevity and research-backed product pilots.

## What makes it genuinely distinctive

The first unique feature is the **shared graph engine**. The `graph_construction.md` spec defines a typed Markov state-transition graph with states, directed graph-valid transitions, optional contexts, transition probabilities, transformation labels, wrapper-specific renderings, lure rules and difficulty metadata. That makes IQ Coach more like a structured cognitive engine than a set of independent games. ([GitHub][2])

The second unique feature is the **same state grammar across layers**: carrier × frame × relation × colour × context. This lets the app move from arrows and optic flow to symbolic, nonsense-semantic and domain-semantic reasoning without changing the underlying relational structure. ([GitHub][2])

The third unique feature is **transfer as the product logic**, not a marketing add-on. The horizontal-transfer spec defines wrapper swaps, probe/unlock/banking thresholds, expected dip-and-recovery after wrapper change, and recovery bands. This makes the temporary performance drop after a changed surface diagnostically useful rather than just a failure state. ([GitHub][3])

The fourth unique feature is the **separation between capacity scores and transfer/proof measures**. The full-app spec keeps the five core capacities separate from Real-Life Transfer Check, Transfer Score and Matrix Reasoning Benchmark. That is important for credibility because app-native capacity estimates are not presented as the same thing as external validation. ([GitHub][1])

The fifth unique feature is the **claims boundary**. The attached Trident-G protocol explicitly frames the system as an evidence-generating protocol, not a medical, diagnostic or guaranteed IQ-gain intervention. Its defensible claim is that it is designed to train and test portability of relational control policies across wrappers, cognitive layers, real-world cues and delay. 

## Proposal angle I would use

For partners, I would lead with:

**“IQ Coach trains cognitive performance under change.”**

Then explain that most brain-training products ask whether someone gets better at the trained task. IQ Coach asks a harder question:

**Can the same useful relation survive a changed surface, memory delay, lure interference, predictive reasoning demand and later re-check?**

That question is directly aligned with the protocol’s validation logic: the important outcome is not simply trained-game improvement, but whether the trained relation or policy survives wrapper change, foil interference, vertical reconstruction, applied use and delayed re-entry. 

[1]: https://github.com/Mindware-Lab/IQ-Coach/blob/main/IQ-Coach_specs.md "IQ-Coach/IQ-Coach_specs.md at main · Mindware-Lab/IQ-Coach · GitHub"
[2]: https://github.com/Mindware-Lab/IQ-Coach/blob/main/graph_construction.md "IQ-Coach/graph_construction.md at main · Mindware-Lab/IQ-Coach · GitHub"
[3]: https://github.com/Mindware-Lab/IQ-Coach/blob/main/horizontal_transfer_specs.md "IQ-Coach/horizontal_transfer_specs.md at main · Mindware-Lab/IQ-Coach · GitHub"
