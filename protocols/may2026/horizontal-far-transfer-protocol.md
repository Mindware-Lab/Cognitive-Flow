# Horizontal Transfer for Gf Capacity

> **Practice first increases task-relevant mutual information around a relational invariant. As performance becomes efficient and the learning curve begins to flatten, a controlled wrapper swap perturbs the surface policy and forces re-entry into exploratory relational search. If the learner rapidly recovers the same operation in the new wrapper, this is evidence that learning has moved from surface-specific skill toward an SR-style relational invariant.**

That is well aligned with the documents.

## How the evidence stack fits

**Zhang–Tang** gives you the formal dynamical principle: productive learning is not pure exploration and not rigid optimisation, but a balance between maximum-entropy exploration and mutual-information constraint. Their PNAS paper frames heavy-tailed update distributions as arising from information-driven self-organisation in nonequilibrium learning, with maximum entropy promoting exploration and mutual information keeping updates task-relevant. ([PNAS][1]) Your Trident-G transfer document already maps this onto the Ψ-band as “enough entropy to reconfigure” plus “enough mutual information to remain relevant”. 

**Donner & Hardy** gives you the learning-curve/breakpoint logic. Their piecewise power-law analysis found that individual learning curves are better modelled as multiple local power-law pieces than as one smooth curve, and that later pieces often surpass earlier pieces after a brief performance drop. That supports your idea that learning may proceed through local exploitation phases punctuated by strategy shifts or reorganisations. 

**Kahn/Bassett/Daw** gives you the SR-learning bridge. Their paper treats the SR as a predictive world model that aggregates future state occupancy over multiple timesteps, and their trial-by-trial RT analysis suggests that human learners acquire SR-like predictive structure alongside lower-order recency effects.  This directly supports an **SR Horizon** block, but also warns that recency/lure controls are needed so you are not just measuring familiarity.

**Relational WM coding** gives you the trainable interface. Your protocol already specifies state n-back, binding n-back, relation n-back and SR horizon modes over Gabor and optic-flow wrappers, with relation load and successor load explicitly modelled.  This is the right place to operationalise the mechanism: the learner first binds variables, then tracks transformations, then predicts successors, then recovers the same relation under a wrapper shift.

## The strongest mechanistic model

I would formulate it like this:

```text
1. Variable carving
The learner identifies the relevant dimensions:
orientation, spacing, speed, direction, etc.

2. Relational WM binding
The learner binds variables across time:
what changed, what stayed invariant, what belongs with what.

3. Mutual-information focusing
Practice and speed pressure increase task-relevant information:
the learner stops sampling irrelevant surface cues.

4. Local SR compilation
The state → transition → successor structure becomes efficient:
candidate next states are pre-activated more cheaply.

5. Learning-curve flattening
Local gains diminish:
the current wrapper is becoming exploited.

6. Wrapper perturbation
The surface changes but the invariant is held constant:
Gabor → optic flow, layout change, density change, etc.

7. Dip-and-recovery test
A temporary drop is expected.
Fast recovery suggests the invariant has been abstracted.
Collapse suggests surface-specific policy.

8. Delayed re-check
The relation is retested later:
only delayed survival supports slow schematic Gc.
```

That is exactly the right interpretation of “horizontal transfer”: **not random variation, but invariant-preserving perturbation at the breakpoint.**

## I would slightly revise your wording

The phrase **“drive mutual information to an SR relational invariant”** is strong, but I would make it a little more precise:

> **Training increases the mutual information between the learner’s updates and the task-relevant relational invariant, while suppressing irrelevant surface cues. With repeated practice under moderate speed/load, the learner begins to compile an efficient SR-style predictive map: current state → transformation → likely successor. When local improvement flattens, the protocol changes the wrapper while preserving the same latent relation. The resulting dip-and-recovery profile tests whether the learner has abstracted the invariant or merely automated a surface policy.**

I would avoid saying “automate an SR” too strongly. Better:

```text
semi-automatise an SR-style predictive map
compile a predictive relational policy
make successor candidates cheaply available
```

This keeps the claim behavioural and computational rather than implying direct neural measurement.

## Design implication for IQ Coach

The app should not swap wrappers on a fixed random schedule. It should swap when the learner shows signs of local exploitation:

```text
high balanced accuracy
stable RT / efficiency
reduced learning slope
low lure errors
low relation-specific error
```

Then introduce the wrapper swap:

```text
same invariant
new surface
same response logic
controlled difficulty
measured swap cost
measured recovery slope
delayed re-check
```

So the key metric is not just accuracy. It is:

```text
W-Recovery =
initial performance drop after wrapper swap
+
number of trials/sessions to regain criterion
+
delayed retention of the same relation
```

This fits your protocol’s proposed `W-Recovery` metric and the 20-day arc where wrapper swaps are used to force portability before SR horizon and niche-linked prompts. 

## Evidence-status wording

The attached evidence review is exactly right to keep the claim disciplined: horizontal transfer, wrapper swaps and breakpoint-driven learning are **promising but less directly established**. It states that wrapper swaps preserving invariants and forcing slow schematic Gc are theoretically plausible, but not directly proven, and recommends measuring wrapper-swap cost, recovery slope, delayed survival and cross-wrapper performance rather than assuming transfer. 

So the safe product/research claim is:

> **The protocol uses wrapper swaps as a controlled perturbation to test whether a relational operation has become portable across surface forms. This is grounded in SR learning, relational WM, entropy–mutual-information dynamics and piecewise learning-curve evidence, but the full horizontal-transfer mechanism remains an empirical target of IQ Coach rather than an established outcome.**

That gives you a strong, evidence-aligned mechanism without overclaiming.


Donner, Y., & Hardy, J. L. (2015). Piecewise power laws in individual learning curves. *Psychonomic Bulletin & Review, 22*, 1308–1319. https://doi.org/10.3758/s13423-015-0811-x

Kahn, A. E., Bassett, D. S., & Daw, N. D. (2025). Trial-by-trial learning of successor representations in human behavior. *bioRxiv*. https://doi.org/10.1101/2024.11.07.622528

Rangarajan, P., & Rao, R. P. N. (2026). *Hierarchical active inference using successor representations*. arXiv. https://doi.org/10.48550/arXiv.2604.15679

Tenderra, R. M., & Theves, S. (2025). Human intelligence relates to neural measures of cognitive map formation. *Cell Reports, 44*(8), Article 116033. https://doi.org/10.1016/j.celrep.2025.116033

Zhang, X.-Y., & Tang, C. (2025). Heavy-tailed update distributions arise from information-driven self-organization in nonequilibrium learning. *Proceedings of the National Academy of Sciences of the United States of America, 122*(51), Article e2523012122. https://doi.org/10.1073/pnas.2523012122

