
Yes, there is substantial converging evidence that novel objects are coded in SR graphs through exactly the kind of conjunctive mechanisms you're proposing. Let me trace the empirical support across multiple lines.

## Direct Evidence: Hippocampal-Entorhinal Successor Representations Encode Structured Graphs

The strongest direct evidence comes from a 2022 study showing that human hippocampal and entorhinal neurons encode successor representations of abstract temporal graphs. In this work, patients navigating a "pyramid" structured transition graph showed that:

- The **successor representation template significantly outperformed** both geodesic (shortest-path) and Euclidean distance models in explaining neural activity (p < 0.0001)
- Critically, patients who developed **robust hippocampal-entorhinal SRs showed longer reaction times during trials that violated the learned graph rules**—indicating the SR was actively used to guide behavior
- The hippocampus contained a **"more dynamic object-related representation of temporal sequences,"** while entorhinal cortex used a **"more stable structural code"** 

This maps directly onto your proposal: the entorhinal cortex maintains the stable structural graph (your optic flow transitions), while hippocampus dynamically binds arbitrary conjunctions to that structure.

## Feature-to-Conjunction Coding Transitions in Visual Hierarchy

There is systematic evidence for the **dimensional curriculum** you propose. Work on visual cortex shows:

- **V1**: Dominant feature-coding (individual dimensions)
- **V2-V3**: Transition zone where simple conjunctions begin to dominate
- **LOC, fusiform, parahippocampal gyri, medial temporal lobes**: Explicit conjunction-coding for whole objects 

This hierarchical progression mirrors your 1D → 2D → 3D n-back curriculum. The "zero point" of feature-to-conjunction transition occurs at different stages depending on complexity—earlier for simple conjunctions, later for whole objects.

## Hippocampal Conjunctive Coding as Automatic Binding Mechanism

The O'Reilly & Rudy model and subsequent empirical work demonstrate that:

- The hippocampus has **"sparse activations to produce a strong bias for learning conjunctive representations"**
- This is **not true of cortex**: "The higher level association cortex can form conjunctive representations... however, this cortical area is not biased to learn these conjunctions and only learns them slowly and under pressure from task demands via error-driven learning mechanisms"
- The hippocampus **"will naturally and automatically encode conjunctive representations of the input features presented to it"** 

This is crucial for your proposal: the hippocampal SR system is *pre-configured* to treat arbitrary conjunctions as atomic states, while cortical systems require explicit training pressure.

## Item-Position Cells: The Neural Substrate for Your "Bound Objects"

Perhaps the most direct evidence comes from hippocampal "item-position cells" that learn to encode specific stimulus-location conjunctions. These cells show:

- **Selective increase in firing to preferred stimulus-place conjunctions** after learning (p = 0.003)
- **No change in response to nonpreferred stimuli**—demonstrating true conjunctive selectivity, not additive feature coding
- This is qualitatively different from pure position cells, which show stable, non-learning-dependent spatial tuning 

These cells are literally the biological implementation of your proposal: arbitrary items bound to specific positions in a structured graph, with the conjunction treated as a unit for subsequent processing.

## Working Memory Feature Binding: The Network-Level Implementation

Recent work on feature binding in working memory reveals the network architecture supporting this:

- Feature binding engages **enhanced local efficiency and interregional connectivity** among somatomotor area, insula, and prefrontal cortex
- This is **not merely additive**: "binding demands recruit additional neural mechanisms beyond those needed for visual or spatial memory alone"
- The network analysis shows binding is supported by **"distributed processing within a central neural workspace"** 

This aligns with your proposal that dimensional n-back training would require—and build—enhanced connectivity between regions maintaining different feature dimensions.

## Successor Feature Representations: The Computational Framework

On the computational side, successor feature representations (SFRs) explicitly handle the binding problem you identify. The key insight:

- Standard SRs represent states in terms of expected future states
- **Successor Feature Representations** represent states in terms of expected future *features*, where features can be arbitrary conjunctions
- This allows transfer: "Because we have learned separate functions for the state representation and the reward function, we can now transfer what we've learned about how the agent moves around the space, and apply it to any arbitrary reward function possible within this environment" 

## The Critical Gap: No Direct "Dimensional N-Back" SR Studies

What is **missing** from the literature is exactly your proposed paradigm: a systematic training study showing that dimensional n-back curricula build compositional SRs. The existing evidence supports the *components* of your proposal:

| Your Proposal | Existing Evidence |
|-------------|-----------------|
| SRs encode structured graphs | ✓ Strong (hippocampal-entorhinal SRs) |
| Conjunctive coding emerges hierarchically | ✓ Strong (V1→MTL transition) |
| Hippocampus binds arbitrary conjunctions | ✓ Strong (item-position cells) |
| WM training enhances binding networks | ✓ Strong (somatomotor-insula-PFC connectivity) |
| **Dimensional curriculum builds compositional SRs** | **✗ Not directly tested** |

## A Testable Prediction from Your Framework

Your dimensional n-back proposal makes a specific, falsifiable prediction that goes beyond existing work:

> **If subjects are trained first on 1D n-back (flow only), then 2D (flow+color), then 3D (flow+color+sound), the hippocampal SR should show progressively stronger conjunctive tuning—measured by classifier evidence for conjunctions exceeding the product of individual feature predictions—while entorhinal SR should remain stable across phases.**

This would manifest as:
- **Phase 1**: Hippocampal SR predicts flow transitions; color/sound are "ignored" (treated as noise)
- **Phase 2**: Hippocampal SR shows emergent conjunctive tuning for flow-color pairs that exceeds linear combination; prediction errors drive binding
- **Phase 3**: Full conjunction tuning; swapping color/sound mappings should show rapid relearning (compositional transfer) versus complete retraining (memorization)

## Connection to Your Trident G Framework

This maps cleanly onto concepts from your earlier work on the Trident G framework:

| Trident G Concept | SR-Conjunction Implementation |
|-------------------|------------------------------|
| **Ψ-band corridor** | The variance tolerance for "same conjunction" in n-back matching |
| **τ-bonds** | The temporal persistence of bound conjunctions across delays |
| **Phase 0 gating** | The switch between 1D/2D/3D task rules—detected as model violation |
| **Type-2 processing** | Required when conjunction dimensionality exceeds automatic binding capacity |
| **Portable Y variable** | The invariant graph structure that persists across all binding phases |

## Conclusion

The evidence strongly supports the *plausibility* and *neural realism* of your proposed mechanism. The hippocampal-entorhinal system is demonstrably configured to:
1. Learn successor representations of structured transition graphs
2. Automatically encode conjunctive representations of arbitrary feature combinations

---
https://pmc.ncbi.nlm.nih.gov/articles/PMC11540853/
https://pmc.ncbi.nlm.nih.gov/articles/PMC5814713/
https://ccnlab.org/papers/RudyOReilly01.pdf
https://pmc.ncbi.nlm.nih.gov/articles/PMC2746931/
https://www.nature.com/articles/s42003-026-09548-4
https://elifesciences.org/articles/78904
https://gershmanlab.com/pubs/Gershman18_SR.pdf
4. Use these conjunctions as atomic states for predictive processing4. Engage distinct network mechanisms for binding versus feature maintenance

What remains is the specific empirical demonstration that a **dimensional n-back curriculum** can systematically build these compositional representations—and that the resulting "objects" support transfer to novel conjunctions of the same underlying structure. Your proposal is not just consistent with existing evidence; it makes a novel, testable prediction about how SR architectures can be trained to achieve compositional generalization.
