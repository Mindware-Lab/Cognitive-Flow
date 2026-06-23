 

I would define each inference class as a **graph family**, then vary the **graph reliability**:

```text
High signal graph: 95% expected transition, 5% foil/noise
Medium signal graph: 85% expected transition, 15% foil/noise
Low signal graph: 75% expected transition, 25% foil/noise
```

This fits the SR framing because successor representations encode expected future state occupancy, not merely the next observed item. In other words, the learner is building a predictive map of what tends to follow what. ([PMC][1])

## Core rule

I would define it like this:

```text
Graph-valid stimuli = signal stream
Noise stimuli = foil stream
n-back / n-forward = graph-valid only
surprise detection = graph-valid + foil/noise
```

So, yes:

> **N-back and n-forward should use only stimuli generated from the graph itself, including conjunctions. Foils should be reserved for prediction-error / surprise / graph-break trials.**

That keeps the constructs clean.

## Why this is better

If n-back and n-forward include off-graph foils, the task becomes ambiguous:

```text
Did the user fail memory/prediction?
Or did they fail graph-validity filtering?
```

So keep the distinction:

| Stream type               | Contains                           | Used for                    | What it measures                               |
| ------------------------- | ---------------------------------- | --------------------------- | ---------------------------------------------- |
| **Graph-only stream**     | valid graph states/transitions     | n-back, n-forward           | memory and prediction within learned structure |
| **Signal + noise stream** | valid graph transitions plus foils | surprise / prediction-error | detection of graph violations                  |
| **Probe stream**          | selected graph and foil examples   | benchmark checks            | explicit discrimination                        |

The n-back task remains a past-comparison task, where the user judges whether the current stimulus matches the one n trials ago. ([PMC][2]) The n-forward version becomes the prospective mirror: “will this same graph state recur n steps ahead?”

## State tokens

Use 2D conjunctions for the graph stream:

```text
state = relation × colour
```

Examples:

```text
Left + Yellow
Right + Blue
Expansion + Yellow
Clockwise + Blue
```

Speed or size can be used later as:

```text
context cue
difficulty parameter
noise intensity
```

rather than as a third bound dimension in the early game.

## Four graph families

### 1. Order / Chain graph

This trains ordered relation composition.

```text
A → B → C → D → A
```

Example with conjunctions:

```text
Left-Yellow
→ Right-Yellow
→ Right-Blue
→ Left-Blue
→ Left-Yellow
```

Signal transition:

```text
A → B with .95, .85, or .75 probability
```

Noise / foil:

```text
A → C
A → D
wrong skip
wrong reversal
wrong colour-pair
```

N-back uses only graph-valid sequence items:

```text
A → B → C → D → A
```

N-forward asks whether the current state returns after n steps:

```text
A → B → C → A
```

At A, 3-forward = match.

Surprise detection includes foils:

```text
A → B → D
```

where `B → D` violates the expected chain.

### 2. Transformation / Analogy graph

This trains “same-change” abstraction.

```text
A transforms to B by operator T
C transforms to D by the same operator T
```

Example:

```text
Left-Yellow → Right-Yellow
Left-Blue → Right-Blue
Expansion-Yellow → Clockwise-Yellow
Expansion-Blue → Clockwise-Blue
```

Signal:

```text
same operator preserved
colour/context preserved
```

Noise / foil:

```text
same colour but wrong transformation
same transformation but wrong colour
surface-similar but structurally wrong
```

N-back:

```text
Did the same transformation occur n trials back?
```

N-forward:

```text
Will this transformed state recur in 2 or 3 steps?
```

Surprise:

```text
Press if the expected operator changes unexpectedly.
```

### 3. Context / Constraint graph

This trains context-gated inference.

Here speed or size becomes very useful as the context cue.

```text
If FAST: A → B
If SLOW: A → C
```

or:

```text
If BIG: Yellow gates direction
If SMALL: Blue gates flow
```

Example:

```text
Fast + Left-Yellow → Right-Yellow
Slow + Left-Yellow → Left-Blue
```

Signal:

```text
transition obeys the active context rule
```

Noise / foil:

```text
right transition under wrong context
right colour under wrong rule
missing-condition lure
context switch ignored
```

N-back:

```text
Did the same context-bound relation occur n-back?
```

N-forward:

```text
Given this context, will the current bound state recur n steps ahead?
```

Surprise:

```text
Press if the transition violates the current context.
```

### 4. Probabilistic Path graph

This trains branching prediction and likelihood discrimination.

```text
A → B with .75/.85/.95
A → C with remaining probability
B → D
C → E
```

This is the most SR-like family because the learner must distinguish:

```text
likely
rare
reachable
blocked
invalid
```

SR models are useful here because they represent expected future state occupancy rather than a single deterministic next step. ([PubMed][3])

Example:

```text
A = Left-Yellow
B = Right-Yellow
C = Left-Blue
D = Expansion-Yellow
E = Contraction-Blue
```

At 95% signal:

```text
A → B most of the time
A → C rarely or as controlled noise
```

At 75% signal:

```text
A → B still dominates
A → C appears more often
```

Here you need a careful distinction:

```text
rare-valid transition ≠ foil
invalid transition = foil/noise
```

So, if `A → C` is part of the graph, it is **not noise**. It is a rare graph-valid branch. If `A → X` is not in the graph at all, it is a foil.

## Practical implementation

Each block should have a graph object:

```json
{
  "graph_class": "order_chain",
  "signal_probability": 0.85,
  "states": ["A", "B", "C", "D"],
  "state_bindings": {
    "A": "Left + Yellow",
    "B": "Right + Yellow",
    "C": "Right + Blue",
    "D": "Left + Blue"
  },
  "signal_edges": {
    "A": "B",
    "B": "C",
    "C": "D",
    "D": "A"
  },
  "foil_edges": {
    "A": ["C", "D"],
    "B": ["D", "A"]
  }
}
```

Then generate three streams from it:

```text
Graph n-back stream:
valid graph path only

Graph n-forward stream:
valid graph path only

Surprise stream:
valid graph path + occasional foil transitions
```

## Signal:noise ladder

Use graph reliability as a difficulty parameter:

| Level | Signal transition | Noise / foil rate | Interpretation             |
| ----: | ----------------: | ----------------: | -------------------------- |
|     1 |               95% |                5% | very learnable graph       |
|     2 |               85% |               15% | moderate uncertainty       |
|     3 |               75% |               25% | noisy but still structured |
|     4 |               65% |               35% | advanced / benchmark only  |

I would not go below 75% in ordinary training at first, because the graph may feel too random unless the user has already learned the structure.

## Best rule

The strongest design is:

```text
N-back:
memory for graph-valid states or edges.

N-forward:
prediction of graph-valid future recurrence.

Surprise:
foil/noise detection against the learned graph.
```

So the answer is yes, with one important refinement:

> Use signal:noise to control the **training stream**, but keep n-back and n-forward scoring anchored to **graph-valid states and transitions**. Let foils appear mainly in surprise detection and benchmark discrimination trials.

That gives you a clean separation between:

```text
memory
prediction
prediction-error detection
```

[1]: https://pmc.ncbi.nlm.nih.gov/articles/PMC6941356/?utm_source=chatgpt.com "The successor representation in human reinforcement learning"
[2]: https://pmc.ncbi.nlm.nih.gov/articles/PMC11618482/?utm_source=chatgpt.com "A computational approach to the N-back task - PMC - NIH"
[3]: https://pubmed.ncbi.nlm.nih.gov/37166847/?utm_source=chatgpt.com "A probabilistic successor representation for context- ..."
