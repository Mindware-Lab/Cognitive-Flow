
```text
n-back:
Does the current item match the item n trials ago?

n-forward:
Will the current item match the item n trials ahead?
```

Classic n-back asks whether the current stimulus matches the one presented *n* trials earlier, so your proposed n-forward simply reverses the temporal direction of the comparison. ([PsyToolkit][1]) The key difference is that n-forward is not mainly working memory updating. It is **predictive graph inference**: the player must use the learned transition structure to anticipate whether the same state will recur after a given horizon.

## The clean game rule

For **2-forward**:

```text
Press Match if the current stimulus will be the same as the stimulus two trials from now.
```

For **3-forward**:

```text
Press Match if the current stimulus will be the same as the stimulus three trials from now.
```

Example 2-forward sequence:

```text
t1: A
t2: B
t3: A
```

At `t1`, the correct response is:

```text
Match
```

because `A` returns at `t3`.

Example 3-forward sequence:

```text
t1: A
t2: B
t3: C
t4: A
```

At `t1`, the correct response is:

```text
Match
```

because `A` returns at `t4`.

In the app, the user does **not** wait until the future stimulus appears before responding. They commit a prediction now, and the app scores it when the future item arrives.

## Why this is useful

This is more elegant than asking, “What comes two steps ahead?” because the response stays binary:

```text
Match / No match
```

So the user experience remains close to n-back, but the construct changes:

| Task               | Temporal direction | Main operation              |
| ------------------ | -----------------: | --------------------------- |
| n-back             |     Past → present | Working-memory comparison   |
| n-forward          |   Present → future | Predictive graph comparison |
| surprise detection |  Expected → actual | Prediction-error monitoring |

Successor-representation theory is relevant here because SRs encode states partly in terms of expected future state occupancy. In other words, a current state is represented by the future states it tends to lead to. ([PMC][2]) Your n-forward task is therefore a very clean behavioural probe of whether the user has learned the expected future-state structure.

## The scoring trick: delayed feedback queue

Internally, the app should create a pending prediction record.

```text
At trial t:
current_state = A
n_forward = 2
user_response = Match / No match
store prediction

At trial t+2:
future_state = A or not-A
resolve prediction
give feedback
```

So each response is scored later:

```text
target = current_state_t == state_t+n
```

For a bound-state version:

```text
target = bound_state_t == bound_state_t+n
```

Example:

```text
t1: Left + Yellow
t2: Right + Blue
t3: Left + Yellow
```

At `t1`, 2-forward = Match.

But:

```text
t1: Left + Yellow
t2: Right + Blue
t3: Left + Blue
```

At `t1`, 2-forward = No match, because the relation matches but the colour does not.

## Two possible versions

### 1. Realised n-forward

This scores against the actual future item in the generated stream.

```text
Will the current item actually be the same in n trials?
```

This is easy to implement and intuitive. The app pre-generates the sequence, records the correct future match status, and scores the user’s prediction later.

Best for:

```text
gameplay
learning curves
adaptive training
simple UX
```

### 2. Expected n-forward

This scores against the graph’s probability structure.

```text
Is this state likely to recur at horizon n?
```

Here the target is based on:

```text
P(S_t+n = S_t | S_t)
```

This is more theoretically pure for SR-style learning, because it tests the learned transition map rather than the luck of one sampled path.

Best for:

```text
benchmark probes
research-grade path prediction
probabilistic graph learning
```

For the app, I would use **realised n-forward for the game** and **expected n-forward for sparse probes or benchmark blocks**.

## Graph design requirement

The graph has to contain loops or return paths, otherwise n-forward matching becomes too rare.

Good 2-forward graph:

```text
A → B → A
C → D → C
```

Good 3-forward graph:

```text
A → B → C → A
D → E → F → D
```

For transformation graphs:

```text
Left-Yellow → Right-Yellow → Left-Yellow
```

For optic flow:

```text
Expansion-Blue → Clockwise-Blue → Expansion-Blue
```

For context/constraint graphs:

```text
If Yellow:
A → B → A

If Blue:
A → C → D
```

This lets the app create clean n-forward match and non-match trials.

## Useful lures

The best lures would be near-matches:

```text
same relation, wrong colour
same colour, wrong relation
same state at wrong forward lag
same next state, wrong two-step future
rare return treated as certain return
invalid transition treated as rare return
```

Example wrong-lag lure:

```text
t1: A
t2: A
t3: B
```

At `t1`, for 2-forward:

```text
No match
```

Even though A appears at 1-forward.

Example partial binding lure:

```text
t1: Left + Yellow
t2: Right + Blue
t3: Left + Blue
```

At `t1`, for 2-forward:

```text
No match
```

The direction returns, but the full bound state does not.

## Best final definition

I would define Graph n-forward as:

> **A prospective match task in which the player predicts whether the current graph state or bound state will recur after n future steps.**

User-facing copy:

```text
Look ahead.
Tap Match if this pattern will come back in 2 steps.
Tap No match if it will not.
```

Technical copy:

```text
Graph n-forward estimates horizon-specific successor prediction by requiring a current response about whether S_t will equal S_t+n.
```

So yes — your formulation is the cleanest version. It preserves the simple Match/No Match UX of n-back, but turns the operation into future-state prediction rather than past-state memory.

[1]: https://www.psytoolkit.org/experiment-library/touch_nback2.html?utm_source=chatgpt.com "N-Back (2-back) task"
[2]: https://pmc.ncbi.nlm.nih.gov/articles/PMC6941356/?utm_source=chatgpt.com "The successor representation in human reinforcement learning"
