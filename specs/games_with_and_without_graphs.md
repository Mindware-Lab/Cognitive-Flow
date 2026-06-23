## Core rule

For **Relational Memory** and **Binding Memory**, the stimuli should come from the same state grammar used later in the graph:

```text
relation
bound state = relation × colour
optional context = speed / size / cue
carrier = arrow / optic flow
```

But the **order of presentation should be neutralised**:

```text
randomised
balanced
counterbalanced
no reliable transition probabilities
no learnable path structure
```

Then, in **Path WM and Prediction**, you switch on the transition graph:

```text
A → B → C
P(B | A) = .85
P(C | B) = .85
foils = off-graph or wrong-context transitions
```

This aligns with the full app principle that the same hidden graph engine can structure Relational Memory, Binding Memory, Path Prediction and Reasoning, but that the **task question changes by layer**. The spec explicitly distinguishes holding graph-derived relations or bound states from learning what usually follows or detecting graph breaks. 

## Why not use the exact graph sequence in Relational/Binding Memory?

Because it would confound the score.

If a user does well on Binding Memory while the sequence is already graph-structured, you do not know whether they are:

```text
holding the bound state in working memory
```

or

```text
predicting the next state from the graph
```

So for clean scoring:

```text
Relational Memory = hold the relation
Binding Memory = hold the bound state
Path WM / Prediction = learn transitions between bound states
```

The full spec also separates these constructs: Relational Memory asks whether a graph-valid state, relation or edge matches n-back, Binding Memory asks whether the bound graph state matches n-back, while Path Prediction asks what usually comes next, whether the graph broke, and whether the path can still reach the target. 

## Recommended implementation

### 1. Relational Memory: graph vocabulary, neutral order

Use the relations that will matter later:

```text
OUT
IN
CW
CCW
LEFT
RIGHT
EXPAND
CONTRACT
```

But present them in balanced pseudo-random order:

```text
OUT → CW → IN → OUT → CCW → CW
```

Task:

```text
Does the current relation match 2-back?
```

No transition learning target yet.

### 2. Binding Memory: graph state set, neutral order

Use bound states from the same graph family:

```text
A = OUT + blue
B = CW + yellow
C = IN + green
D = CCW + purple
```

But randomise / balance them:

```text
A → C → A → D → B → D
```

Task:

```text
Does the current bound state match 2-back?
```

Again, no path learning target yet.

### 3. Path WM and Prediction: graph structure active

Now use the same states, but impose transitions:

```text
A → B → C → D → A
```

or:

```text
A → B with .85
A → C with .15
B → D
C → E
```

Tasks:

```text
Graph n-back:
Does the current state or edge match n-back?

Graph n-forward:
Will this state recur in n steps?

Surprise:
Did the transition break the graph?
```

## Best final distinction

| Layer                    | Uses same state vocabulary? | Uses actual graph transitions? | Why                                             |
| ------------------------ | --------------------------: | -----------------------------: | ----------------------------------------------- |
| **Attention Control**    |                      Partly |                             No | Extract signal only                             |
| **Relational Memory**    |                         Yes |               No, or flattened | Measures relation maintenance                   |
| **Binding Memory**       |                         Yes |               No, or flattened | Measures bound-state maintenance                |
| **Path WM / Prediction** |                         Yes |                            Yes | Measures transition learning and prediction     |
| **Reasoning**            |             Yes, translated |                  Yes, explicit | Measures graph recovery in symbolic/verbal form |

## Practical design phrase

I’d describe it this way in the specs:

> Relational Memory and Binding Memory use the same graph-derived state vocabulary as the Path layer, but their core diagnostic blocks neutralise transition structure. Path WM and Prediction activates the graph’s transition structure and tests whether the learner can use it through n-back, n-forward and surprise-detection tasks.

That gives you the strongest vertical stack:

```text
same elements
different operation
cleaner measurement
```

Rather than:

```text
same elements + same sequence everywhere
confounded memory and prediction
```
