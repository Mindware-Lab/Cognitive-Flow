
The full app spec already supports this logic: IQ Coach should track five capacities in a vertical stack and include wrapper recovery, path-prediction-to-reasoning recovery, lure resistance and mixed-wrapper performance as transfer components rather than treating all scores as one generic “brain score”.  

## The swap structure is coherent

I would formalise your swaps like this:

| Transfer test                                            | Direction          | What it tests                                                                                                              |
| -------------------------------------------------------- | ------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| **1. CCC arrows ↔ CCC optic flow**                       | carrier swap       | Can signal extraction survive static-symbolic ↔ dynamic-motion wrapper change?                                             |
| **2. Relational WM arrows ↔ relational WM optic flow**   | carrier swap       | Can relation maintenance survive carrier change?                                                                           |
| **3. Binding WM arrows ↔ binding WM optic flow**         | carrier swap       | Can relation × colour binding survive carrier change?                                                                      |
| **4. Graph n-back ↔ n-forward + surprise**               | operation swap     | Does transition WM support future prediction and graph-break detection, and vice versa?                                    |
| **5. Graph learning arrows ↔ graph learning optic flow** | graph carrier swap | Does learning a transition graph in one carrier transfer to the same graph in the other carrier?                           |
| **6. Graph performance ↔ reasoning performance**         | vertical transfer  | Does implicit/visual graph learning transfer into explicit reasoning, and does reasoning training scaffold graph learning? |

This maps well onto the Trident-G validation question: not just “did the user improve at the trained game?”, but did the relation survive wrapper change, foil interference, vertical reconstruction and delayed re-entry? 

## The main design refinement

I would distinguish **two axes** that your list partly combines:

```text
Carrier transfer:
arrows ↔ optic flow

Operation transfer:
n-back ↔ n-forward ↔ surprise

Vertical transfer:
graph performance ↔ reasoning performance
```

So swap 4 and swap 5 are related but not identical:

```text
Swap 4:
same graph / same carrier / different operation
graph n-back ↔ graph n-forward + surprise

Swap 5:
same graph / same operation family / different carrier
arrow graph learning ↔ optic-flow graph learning
```

That distinction matters because otherwise you will not know whether transfer failure came from a **carrier change** or an **operation change**.

## Random .50 starts make sense

Your proposed .50 / .50 counterbalancing is exactly the right basic strategy:

```text
Group A:
arrows first → optic flow transfer probe

Group B:
optic flow first → arrows transfer probe
```

and:

```text
Group A:
graph first → reasoning transfer probe

Group B:
reasoning first → graph transfer probe
```

This is essentially a within-subject / crossover logic, where order is counterbalanced to reveal order effects and possible carryover. The key caution is that within-subject designs are vulnerable to order and carryover effects, so the order itself must be modelled, not treated as nuisance noise. ([Open Text WSU][1])

## What asymmetries you could detect

Yes — over time, you could detect directional dependencies such as:

```text
Graph → Reasoning stronger than Reasoning → Graph
```

or:

```text
Optic flow → arrows easier than arrows → optic flow
```

or:

```text
Binding WM improvement predicts later graph learning,
but graph learning does not strongly improve basic binding WM.
```

This is exactly the kind of dependency IQ Coach should be built to discover. The app meta-spec already asks whether changes in earlier bottleneck layers predict later transfer layers, for example whether pattern binding improves change tracking or whether path prediction improves reasoning transfer. 

## How to calculate the transfer signal

For each swap, compute something like:

```text
Transfer recovery ratio =
performance on untrained wrapper after training
/
performance on trained wrapper before swap
```

And also:

```text
Asymmetry index =
Transfer(A → B) - Transfer(B → A)
```

Example:

```text
Arrow graph → optic-flow graph recovery = .82
Optic-flow graph → arrow graph recovery = .94

Asymmetry = .82 - .94 = -.12
```

That would suggest optic-flow graph training transfers better to arrows than arrows transfer to optic flow.

But you should also track:

```text
initial transfer dip
recovery slope
final mixed-wrapper stability
delayed recovery
lure resistance
```

The perceptual-learning literature supports this caution because transfer across perceptual wrappers can be specific or asymmetric, and transfer often depends on how training is varied and sequenced. Double-training studies show that transfer can improve when training includes exposure to the transfer-relevant dimension, but order and task structure matter. ([PMC][2])

## Recommended experimental structure

For each relation family, run a small transfer micro-cycle:

```text
1. Baseline A
2. Baseline B
3. Train A
4. Probe B
5. Mix A+B
6. Delayed re-check A+B
```

Counterbalanced version:

```text
Group 1:
A baseline → B baseline → train A → probe B

Group 2:
B baseline → A baseline → train B → probe A
```

For graph/reasoning:

```text
Group 1:
visual graph training → reasoning probe

Group 2:
reasoning training → visual graph probe
```

Then estimate:

```text
A → B transfer
B → A transfer
difference in recovery slope
delayed survival
whether transfer depends on baseline capacity
```

## One caution on reasoning-first

Reasoning-first may explicitly teach the graph rule, so if it improves graph learning later, that might reflect **top-down rule scaffolding** rather than the same kind of implicit graph transfer. That is not a problem, but it should be labelled clearly:

```text
Graph → Reasoning
= implicit/visual graph structure becomes explicit

Reasoning → Graph
= explicit rule scaffolds visual graph learning
```

Both are useful, but they are not psychologically identical.

## Final answer

Yes, this makes sense. The design becomes a **bidirectional transfer matrix**:

```text
arrows ↔ optic flow
relation ↔ bound state
graph WM ↔ graph prediction
visual graph ↔ explicit reasoning
```

And with randomised starting conditions, you can discover real systematic asymmetries:

```text
which wrappers transfer best
which layers support downstream layers
which operations scaffold others
which gains survive delay
which transfer paths are weak or brittle
```

That is much stronger than simply showing within-game improvement. It turns IQ Coach into an evidence-generating transfer engine rather than a set of disconnected training games.

[1]: https://opentext.wsu.edu/carriecuttler/chapter/experimental-design/?utm_source=chatgpt.com "5.2 Experimental Design – Research Methods in Psychology"
[2]: https://pmc.ncbi.nlm.nih.gov/articles/PMC3045109/?utm_source=chatgpt.com "Complete Transfer of Perceptual Learning across Retinal ..."
