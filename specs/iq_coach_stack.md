 

The stack becomes:

```text
Attention Control
→ extract the signal

Relational Memory
→ hold the relation

Binding Memory
→ hold the bound state

Path WM and Prediction
→ learn transitions between bound states
→ probe them through n-back, n-forward and surprise tasks

Reasoning
→ recover the same graph explicitly
```

That is actually very close to the naming-locked full app architecture: the full spec already says the five core capacities are **Attention Control → Relational Memory → Binding Memory → Path Prediction → Reasoning**, all supported by a shared hidden graph engine, with the user encountering the same relational structure across “extract the signal → hold the relation → bind the relation to context → predict from the relation → reason with the relation”.  

The one refinement I would make is to call the fourth layer **Path WM and Prediction** internally, but keep **Path Prediction** as the public label. That layer is doing more than passive prediction: it includes maintaining transition fragments, looking forward across graph distance, and detecting graph breaks. The full spec already defines Path Prediction as learning what usually follows, detecting graph breaks, and checking whether a path can still reach the target. 

## Revised layer logic

| Layer | Public label          | Core task question                                             | Main construct               |
| ----- | --------------------- | -------------------------------------------------------------- | ---------------------------- |
| 1     | **Attention Control** | Can I extract the relevant signal from noise?                  | Signal extraction            |
| 2     | **Relational Memory** | Can I hold the relation across delay?                          | Relation WMC                 |
| 3     | **Binding Memory**    | Can I hold the bound state, such as relation × colour?         | Binding WMC                  |
| 4     | **Path Prediction**   | Can I learn and use transitions between bound states?          | Path WM + SR-like prediction |
| 5     | **Reasoning**         | Can I recover the same graph in explicit symbolic/verbal form? | Reasoning transfer           |

## The important distinction

A and B support C and D, but they are not redundant.

```text
A. Attention Control:
extract LEFT / RIGHT / OUT / IN / CW / CCW from brief noisy displays

B. Relational Memory:
hold LEFT or OUT or CW across delay

C. Binding Memory:
hold LEFT + blue or OUT + yellow across delay

D. Path WM and Prediction:
learn that LEFT + blue usually leads to OUT + yellow,
then use that transition graph in n-back, n-forward and surprise detection
```

So the fourth layer is not just “Path Prediction” in a narrow sense. It is better thought of as:

```text
transition working memory
+
successor prediction
+
prediction-error monitoring
```

I’d recommend **two subgames inside one Path Prediction module**, rather than one fully combined game at first.

So publicly it is one app layer:

```text
Path Prediction
```

But internally it has two subgames:

```text
1. Look Ahead
   = graph n-forward

2. Graph Break
   = surprise / prediction-error key press
```

This matches your full app logic: Path Prediction is the layer where the user learns what usually follows, detects graph breaks, and checks whether a path can still reach the target. 

## Why separate them at first?

Because they measure different things.

### N-forward measures prospective recurrence

The user answers:

```text
Will this current bound state come back in 2 or 3 steps?
```

So this tests:

```text
future-state prediction
successor horizon
graph recurrence learning
```

Example:

```text
A → B → A
```

At `A`, 2-forward = Match.

### Surprise key-press measures graph violation detection

The user watches the stream and presses only when the graph breaks:

```text
A → B → D
```

If the graph expects `B → C`, then `B → D` is a surprise / foil.

This tests:

```text
prediction-error sensitivity
rare-vs-invalid discrimination
continuous monitoring
```

The full app spec already treats this as a distinct main mode: “Press when the next stimulus does not fit what usually happens,” with separate hit, miss, false alarm and correct rejection outcomes. 

## Why not fully combine them?

If the user has to do both at once:

```text
press Match if this state will recur in 2 steps
AND
press if the graph just broke
```

then errors become hard to interpret. A mistake could reflect:

```text
poor forward prediction
poor graph-break monitoring
response conflict
button confusion
working-memory overload
```

So the scores become less clean.

## Best structure

Use **one graph stream**, but run it in phases:

```text
Phase 1 — Exposure
Watch the graph pattern.

Phase 2 — Look Ahead
Tap Match if this state will return in 2 steps.

Phase 3 — Graph Break
Press when the stream breaks the usual pattern.

Phase 4 — Mixed challenge
Optional later: both operations appear in alternating mini-blocks.
```

This keeps the user experience coherent while preserving separate metrics.

## Recommended MVP

For the first app version:

| Subgame            | Public name     | Task                                               | Metric                       |
| ------------------ | --------------- | -------------------------------------------------- | ---------------------------- |
| Graph n-forward    | **Look Ahead**  | Predict whether current state recurs after n steps | Forward horizon              |
| Surprise key-press | **Graph Break** | Press when a transition violates the graph         | Prediction-error sensitivity |

Then later add an advanced combined mode:

```text
Predict & Detect
```

But I would only unlock that once the user is stable on both subgames separately.

## Final recommendation

Use:

```text
Path Prediction
├── Look Ahead
│   └── n-forward prediction
└── Graph Break
    └── surprise / prediction-error detection
```

So: **separate subgames, same graph, same session family, separate scores.** That gives you cleaner measurement and a better learning progression.

---

This also fits the SR rationale: successor representations encode states partly by their predictive relationships with future states, so a bound state becomes meaningful because of the future states it tends to lead to. ([PubMed][1])

## Same graph-based stimulus generation?

Yes — from **Relational Memory upward**, use the same graph-based stimulus generator.

The generator should create:

```text
state = carrier × frame × relation × colour × optional context
```

For example:

```text
A = arrow + relational + OUT + blue
B = arrow + relational + CW + yellow
C = optic_flow + relational + EXPAND + blue
D = optic_flow + relational + CONTRACT + yellow
```

Then each layer asks a different question of that same state grammar.

| Layer                  | Uses graph generator? | How                                                           |
| ---------------------- | --------------------: | ------------------------------------------------------------- |
| Attention Control      |                Partly | Uses relation tokens, but not full graph transition structure |
| Relational Memory      |                   Yes | Holds graph-derived relation tokens                           |
| Binding Memory         |                   Yes | Holds graph-derived bound states                              |
| Path WM and Prediction |                   Yes | Learns transitions between bound states                       |
| Reasoning              |                   Yes | Converts the same graph into explicit symbolic/verbal items   |

This preserves construct purity while keeping one coherent stimulus universe. The full app spec is already aligned with this: it states that the same Markov/conditional-probability graph can structure Relational Memory, Binding Memory, Path Prediction and Reasoning, while the task question changes by layer. 

## Final formulation

I’d lock the architecture as:

```text
1. Attention Control
Extract the signal from noisy arrow / optic-flow displays.

2. Relational Memory
Hold and compare relation tokens across delay.

3. Binding Memory
Hold and compare bound states such as relation × colour.

4. Path WM and Prediction
Learn transition graphs over bound states.
Probe with:
- graph n-back
- graph n-forward
- surprise / graph-break detection

5. Reasoning
Recover the same graph explicitly in symbolic, nonsense-semantic and domain-semantic reasoning.
```

That gives you a strong vertical progression:

```text
signal
→ relation
→ bound state
→ transition graph
→ explicit inference
```

And it prevents the app from becoming a set of disconnected mini-games.

[1]: https://pubmed.ncbi.nlm.nih.gov/30006364/?utm_source=chatgpt.com "Its Computational Logic and Neural Substrates - PubMed - NIH"
