
The most defensible version is:

```text
MFT-M / CCC-style training
→ trains uncertainty reduction, control capacity and information-rate handling

relational WM training
→ trains binding, maintenance and updating of structured relations

language-based reasoning
→ tests verbal/semantic inference over those trained relations

visuospatial reasoning
→ tests non-verbal/puzzle/geometric inference over the same relation types
```

So the combined protocol is not simply “WM training plus reasoning practice”. It becomes a **controlled relational inference protocol**.

## Why it is theoretically coherent

The Chen/Fan paper supports the idea that cognitive control is closely tied to intelligence, especially Gf. It measured cognitive control using CCC from the MFT-M and executive control from ANT-R, then found that cognitive control was strongly associated with working memory and with Gf/Gc, with the stronger relation to Gf. The authors interpret cognitive control as coordination of thoughts and actions under uncertainty, not just storage capacity. 

That fits your training stack well:

```text
MFT-M
= can the system coordinate information under uncertainty?

Relational WM
= can the system hold and update relations?

Reasoning wrappers
= can the system use those relations for inference across formats?
```

The key move is that the **same relational operators** should appear across both language and visuospatial reasoning.

For example:

| Relational operator     | WM training form     | Language reasoning wrapper | Visuospatial wrapper         |
| ----------------------- | -------------------- | -------------------------- | ---------------------------- |
| Same/different relation | relation n-back      | verbal analogy             | matrix/pattern analogy       |
| If–then transition      | sequence relation    | conditional reasoning      | path/maze rule               |
| Constraint satisfaction | feature binding      | syllogistic/deductive rule | grid puzzle                  |
| Probabilistic update    | cue–outcome relation | Bayesian scenario          | visual evidence accumulation |
| Successor relation      | state → next state   | causal chain               | path/reachability puzzle     |

That gives you a clean far-transfer hypothesis:

> Training should improve not because the surface task is repeated, but because the learner repeatedly reconstructs the same relational control policy across different representational wrappers.

## Why language + visuospatial wrappers matter

Using both formats is important because it protects against shallow transfer.

If a learner improves only on verbal reasoning, they may have learned a verbal strategy.
If they improve only on visuospatial puzzles, they may have learned a puzzle routine.
But if the same trained relation improves recovery across both, that is stronger evidence for a portable relational operator.

So the protocol should repeatedly ask:

```text
Can the same relation be recovered verbally?
Can it be recovered visuospatially?
Can it survive changed surface features?
Can it survive delay?
Can it be applied under controlled uncertainty?
```

That is very close to the Trident-G horizontal-transfer principle: the invariant must survive changed wrappers rather than merely improve within one trained task.

## Best formulation

I would frame the approach like this:

> A plausible a priori far-transfer protocol is to combine MFT-M-style cognitive-control capacity training with relational working-memory training, then require the trained relational structures to support inference across both language-based and visuospatial reasoning wrappers. MFT-M trains uncertainty reduction and control throughput, relational WM trains the active binding/updating substrate, and the reasoning wrappers test whether those relations become portable inference tools rather than task-specific routines.

## Important claim boundary

This is a good **mechanistic training hypothesis**, not yet a proven g-enhancement claim.

The claim should be:

```text
This is a theoretically motivated protocol for training controlled relational inference under uncertainty.
```

Not:

```text
This has already been shown to raise general intelligence.
```

## The strongest practical version

The training loop should look like:

```text
1. MFT-M / CCC block
   Train information-rate control and uncertainty reduction.

2. Relational WM block
   Train relation binding, updating and interference control.

3. Language reasoning wrapper
   Apply the relation to verbal inference.

4. Visuospatial reasoning wrapper
   Apply the same relation to puzzle/geometric inference.

5. Wrapper swap
   Change the surface but preserve the invariant.

6. Delayed probe
   Test whether the relation survives without immediate task context.
```

That gives you the strongest Trident-G interpretation:

```text
control capacity
+ relational workspace
+ cross-wrapper inference
+ delayed recovery
= credible far-transfer candidate
```
