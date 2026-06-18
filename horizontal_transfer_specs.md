
## 1. Full core stimulus state space

### 1.1 Core visual state grammar

Use this as the canonical visual state object:

```ts
VisualState = {
  carrier: "arrow" | "optic_flow",
  frame: "absolute" | "relational",
  relation: "LEFT" | "RIGHT" | "UP" | "DOWN" | "OUT" | "IN" | "CW" | "CCW",
  colour: "blue" | "yellow" | "green" | "purple" | null,
  context: "K" | "L" | null,
  graph_state_id: string | null,
  graph_edge_id: string | null
}
```

The full app spec defines this same grammar with `carrier`, `frame`, `relation`, `colour` and `context`, with arrows and optic flow as the main carriers. 

### 1.2 Core relation dimensions

Use **four core binary axes** first:

| Frame      | Axis       | Values       | Wrapper IDs |
| ---------- | ---------- | ------------ | ----------- |
| Absolute   | Horizontal | LEFT / RIGHT | `abs_lr`    |
| Absolute   | Vertical   | UP / DOWN    | `abs_ud`    |
| Relational | Radial     | OUT / IN     | `rel_inout` |
| Relational | Tangential | CW / CCW     | `rel_cwccw` |

Then add optional extension axes:

| Frame      | Axis     | Values                 | Wrapper IDs  |
| ---------- | -------- | ---------------------- | ------------ |
| Absolute   | Diagonal | DIAG_A / DIAG_B        | `abs_diag`   |
| Relational | Spiral   | SPIRAL_OUT / SPIRAL_IN | `rel_spiral` |

The full app spec treats left/right and up/down as the core absolute axes, out/in and clockwise/anticlockwise as the core relational axes, with diagonal and spiral as later extensions. 

### 1.3 Carrier-specific implementation

#### Arrow carrier

Use for early and timing-sensitive layers:

```ts
ArrowStimulus = {
  carrier: "arrow",
  frame: "absolute" | "relational",
  relation_axis: "abs_lr" | "abs_ud" | "rel_inout" | "rel_cwccw" | "abs_diag" | "rel_spiral",
  relation_value: RelationValue,
  set_size: 5,
  possible_positions: 8,
  sampled_positions: 5,
  majority_ratio: "5:0" | "4:1" | "3:2",
  colour: Colour | null,
  mask: true,
  exposure_ms: adaptive
}
```

For Attention Control, the arrow display remains the psychometric anchor: five arrows, brief exposure, mask, binary response and adaptive exposure/majority ratio. 

#### Optic-flow carrier

Use as a **carrier-transfer wrapper**, especially for Path Prediction and later cross-carrier recovery:

```ts
OpticFlowStimulus = {
  carrier: "optic_flow",
  frame: "absolute" | "relational",
  flow_axis: "abs_lr" | "abs_ud" | "rel_inout" | "rel_cwccw" | "abs_diag" | "rel_spiral",
  relation_value: RelationValue,
  coherence: 1.00 | 0.80 | 0.60,
  speed: adaptive,
  aperture: "central" | "wide",
  colour: Colour | null,
  context: "K" | "L" | null,
  duration_ms: adaptive
}
```

Map optic flow like this:

| Relation        | Arrow version                          | Optic-flow version                        |
| --------------- | -------------------------------------- | ----------------------------------------- |
| LEFT / RIGHT    | arrows point left/right                | translational flow left/right             |
| UP / DOWN       | arrows point up/down                   | translational flow up/down                |
| OUT / IN        | arrows point away/towards centre       | expansion/contraction flow                |
| CW / CCW        | arrows tangent clockwise/anticlockwise | rotational flow CW/CCW                    |
| SPIRAL OUT / IN | radial + tangential arrow vector       | expansion+rotation / contraction+rotation |

For Attention Control, optic flow should initially be tagged as **wrapper-transfer evidence**, not the canonical bits/sec estimate, because arrows are cleaner for timing-sensitive capacity estimation.

## 2. Observable state-space size

For the **core visual grammar**:

```text
2 carriers × 8 core relation values × 4 colours = 64 coloured visual states
```

If context is explicit and independent:

```text
2 carriers × 8 relation values × 4 colours × 3 context states
= 192 context-expanded visual states
```

With optional diagonal and spiral added:

```text
2 carriers × 12 relation values × 4 colours
= 96 coloured visual states
```

With explicit context:

```text
2 × 12 × 4 × 3
= 288 context-expanded states
```

Do **not** expose this full space at once. Each block should activate a small slice:

```text
Attention Control: 1 binary axis, colour irrelevant
Relational Memory: 2–4 relation categories
Binding Memory: 4 relations × 2–4 colours
Path Prediction: 4–8 graph states
Reasoning: 1 relation family, 1–2 wrappers
```

## 3. Wrapper IDs to implement

Use this core queue:

```ts
CORE_VISUAL_WRAPPERS = [
  "arrow_abs_lr",
  "arrow_abs_ud",
  "arrow_rel_inout",
  "arrow_rel_cwccw",
  "flow_abs_lr",
  "flow_abs_ud",
  "flow_rel_inout",
  "flow_rel_cwccw"
]
```

Use this extension queue:

```ts
EXTENSION_VISUAL_WRAPPERS = [
  "arrow_abs_diag",
  "arrow_rel_spiral",
  "flow_abs_diag",
  "flow_rel_spiral"
]
```

For Reasoning, use semantic wrappers:

```ts
REASONING_WRAPPERS = [
  "symbolic",
  "domain_semantic",
  "nonsense_semantic",
  "mixed"
]
```

Reasoning should train the same relation family across symbolic, real-language/domain and nonsense-semantic wrappers, then bank only after mixed and delayed performance. 

## 4. Typical trials per 18-minute core session

The full app spec recommends a 15–20 minute session, with an example 18-minute split: Attention Control 3 min, Relational Memory 4 min, Binding Memory 3 min, Path Prediction 5 min and Reasoning 3 min. 

| Layer             |  Time |                  Typical trial/event estimate |         20-session total |
| ----------------- | ----: | --------------------------------------------: | -----------------------: |
| Attention Control | 3 min |                          ~70–90 masked trials |             ~1,400–1,800 |
| Relational Memory | 4 min |                          ~45–65 n-back trials |               ~900–1,300 |
| Binding Memory    | 3 min |                  ~32–50 binding n-back trials |               ~640–1,000 |
| Path Prediction   | 5 min | ~90–120 transitions, ~10–18 diagnostic events | ~1,800–2,400 transitions |
| Reasoning         | 3 min |                                    ~4–6 items |            ~80–120 items |

The Relational Memory spec uses `20+n` trials per standard n-back block, with shorter `16+n` blocks for quick sessions.  The Reasoning spec defines a standard block as 4–8 items over 3–5 minutes, with fuller benchmark blocks every 5–7 sessions. 

## 5. Liberal wrapper-swap rules

### Core principle

Use **three different thresholds**:

```text
Probe threshold: enough to try the next wrapper.
Unlock threshold: enough to train the next wrapper.
Banking threshold: enough to count as transfer evidence.
```

This prevents the app from becoming over-conservative.

### Rule 1 — Probe early

Do not wait for full flattening before showing the next wrapper.

Allow a **next-wrapper probe** when:

```ts
current_wrapper.trials >= T_probe_min
AND balanced_accuracy >= 0.65
AND false_alarm_rate <= 0.35
AND miss_rate <= 0.35
AND timing_quality !== "poor"
```

Suggested `T_probe_min`:

| Layer             |                           Probe minimum |
| ----------------- | --------------------------------------: |
| Attention Control |                            24–36 trials |
| Relational Memory |                          1 n-back block |
| Binding Memory    |                           1 short block |
| Path Prediction   | 40–60 transitions + 4 diagnostic events |
| Reasoning         |                               3–4 items |

### Rule 2 — Switch on “good enough” stability, not perfect plateau

Switch from wrapper A to wrapper B when **any** of these is true:

```ts
// competence rule
balanced_accuracy >= 0.82 for 2 mini_blocks

// liberal flattening rule
balanced_accuracy >= 0.70
AND recent_slope <= small_positive_threshold
AND trials >= T_unlock_min

// quota rule
sessions_on_wrapper >= 2
AND balanced_accuracy >= 0.65
AND no severe response bias
```

This is deliberately more liberal than waiting for a strong plateau. It still respects the protocol because the swap tests recovery, and poor recovery simply becomes useful diagnostic information.

### Rule 3 — Freeze all other difficulty when swapping

A wrapper swap counts as a difficulty increase. So when changing wrapper:

```ts
do_not_increase([
  exposure_speed,
  n_back_level,
  relation_alphabet_size,
  colour_count,
  horizon_length,
  lure_pressure,
  premise_count
])
```

If anything, step down slightly:

```text
Attention Control: longer exposure or easier ratio
Relational Memory: same or lower n
Binding Memory: fewer colours
Path Prediction: shorter horizon / clearer probability contrast
Reasoning: fewer premises or easier response set
```

The full app progression rule already says to increase only one difficulty dimension at a time, with 70–82% balanced accuracy as the target band. 

### Rule 4 — Treat the dip as expected, not failure

Compute:

```ts
recovery_ratio =
  performance_new_wrapper_matched_demand
  / performance_old_wrapper_pre_switch_matched_demand
```

Use liberal bands:

| Recovery band | Rule                                              | Action                              |
| ------------- | ------------------------------------------------- | ----------------------------------- |
| Strong        | `>= .85` or within smallest worthwhile difference | move to mix quickly                 |
| Adequate      | `.70–.84`                                         | continue B, then mix                |
| Minimal       | `.60–.69`                                         | keep B but scaffold                 |
| Weak          | `< .60`                                           | return to A+B probes, reduce demand |

For unlock purposes, `.60+` is enough to continue. For transfer evidence, require `.70+` immediate recovery or `.80+` delayed/mixed recovery.

### Rule 5 — Mix earlier than a conservative protocol would

Once wrapper B has minimal recovery:

```ts
if recovery_ratio >= 0.70 OR balanced_accuracy_B >= 0.70:
  start_mix(A, B, ratio = 70/30)
```

Then progress:

```text
70% B / 30% A
→ 50% B / 50% A
→ random A/B
→ random A/B with lures
```

Move to the next wrapper when mixed performance is stable enough:

```ts
mixed_balanced_accuracy >= 0.68
AND severe_lure_errors === false
AND trials_mixed >= T_mix_min
```

For a liberal implementation, `0.68` mixed accuracy is acceptable for progression, but not for banking.

### Rule 6 — Use scheduled coverage quotas

To ensure most users reach all dimensions in 15–20 sessions, use a queue plus quotas:

```ts
target_core_wrappers_by_session_10 = 4
target_core_wrappers_by_session_15 = 6
target_core_wrappers_by_session_20 = 8
```

By session 20, each core wrapper should have at least:

| Layer             |                    Target exposure per core wrapper by Session 20 |
| ----------------- | ----------------------------------------------------------------: |
| Attention Control |                                                     80–120 trials |
| Relational Memory |                                                      50–80 trials |
| Binding Memory    |                                                      40–70 trials |
| Path Prediction   |                      100–150 transitions + 8–15 diagnostic events |
| Reasoning         | not visual-wrapper based; target 4 families × 3 semantic wrappers |

This is feasible within the 20-session trial budget above.

### Rule 7 — Separate “progression” from “banking”

A wrapper can be unlocked without being banked.

```ts
if unlock_passed:
  allow_next_wrapper_training = true

if banking_passed:
  count_as_transfer_evidence = true
```

Banking requires more:

```ts
mixed_wrapper_stability >= 0.70
AND lure_resistance_ok
AND delayed_recheck_passed
```

This matches the protocol’s distinction between local improvement, wrapper recovery, vertical transfer and delayed consolidation. 

## 6. Suggested 20-session wrapper coverage schedule

This is the practical liberal schedule I would use.

| Sessions | Visual wrapper goal                                                             | Transfer goal                                    |
| -------- | ------------------------------------------------------------------------------- | ------------------------------------------------ |
| 1–2      | `arrow_abs_lr`, `arrow_abs_ud`                                                  | establish absolute extraction and first swap     |
| 3–4      | `arrow_rel_inout`, `arrow_rel_cwccw`                                            | move into relational/polar wrappers              |
| 5        | mixed arrow core                                                                | test absolute + relational mixing                |
| 6–7      | `flow_abs_lr`, `flow_abs_ud`                                                    | carrier swap for absolute relations              |
| 8–9      | `flow_rel_inout`, `flow_rel_cwccw`                                              | carrier swap for relational relations            |
| 10       | mixed flow + arrow re-check                                                     | first full carrier/frame recovery check          |
| 11–13    | family-specific mixed wrappers                                                  | order, transformation, constraint, path families |
| 14–15    | delayed re-checks + lure-controlled mixes                                       | start banking transfer evidence                  |
| 16–18    | optional diagonal/spiral for high performers, otherwise weaker wrapper recovery | individualised expansion                         |
| 19–20    | benchmark + delayed mixed recovery                                              | transfer score evidence window                   |

Benchmark sessions every 5–7 sessions should include mixed wrappers, mixed relation families, delayed items, lure-controlled blocks and reasoning bridge items. 

## 7. Layer-specific wrapper rules

### Attention Control

Use arrows as the main capacity anchor.

Wrapper queue:

```text
arrow_abs_lr
→ arrow_abs_ud
→ mix absolute
→ arrow_rel_inout
→ arrow_rel_cwccw
→ mix relational
→ flow_abs_lr / flow_abs_ud probes
→ flow_rel_inout / flow_rel_cwccw probes
→ full mixed carrier checks
```

Do not initially treat optic-flow Attention Control as equivalent to arrow-based bits/sec. Tag it as:

```ts
evidence_tier: "carrier_transfer_probe"
```

### Relational Memory

Use the same wrapper queue, but with relation-token n-back and edge n-back.

Unlock next wrapper when:

```ts
balanced_accuracy >= .70
AND false_alarm_rate <= .30
AND miss_rate <= .30
AND n_level_stable_or_improving
```

Wrong-lag lures should be present before banking. The Relational Memory spec explicitly treats wrong-lag, same-feature, wrong-wrapper, invalid-edge and rare-valid cases as lures or non-targets. 

### Binding Memory

Introduce colour progressively:

```text
2 colours → 4 colours → colour/context gate → cross-carrier binding
```

Do not start Binding with the full 64-state space. Use:

```text
4 relations × 2 colours = 8 states
```

then:

```text
4 relations × 4 colours = 16 states
```

The full spec defines Binding Memory as maintaining relation-colour/context states, with `4 relations × 4 colours = 16` states and `H_bound_state = log2(16) = 4 bits`. 

### Path Prediction

Use optic flow earlier here than in Attention Control.

Recommended wrapper order:

```text
arrow graph states
→ optic-flow graph states
→ mixed arrow/flow graph states
→ delayed graph recovery
```

The Path Prediction layer is the natural place for optic flow because the spec describes it as learning what usually follows, detecting graph breaks and judging whether a path can still reach a target. 

### Reasoning

Use semantic wrappers, not arrow/flow wrappers:

```text
symbolic
→ domain-semantic
→ nonsense-semantic
→ mixed semantic block
→ delayed mixed block
```

But map each item back to the same graph family:

```text
order_chain
transformation_analogy
context_constraint
probabilistic_path
```

This preserves vertical transfer from visual graph learning into explicit reasoning.

## 8. Code-level wrapper state machine

Use this state model:

```ts
type WrapperStatus =
  | "locked"
  | "probe"
  | "active_blocked"
  | "recovery"
  | "mixed"
  | "delayed_recheck"
  | "banked"
  | "scaffolded";

type WrapperState = {
  wrapper_id: string;
  layer: "attention" | "relational_memory" | "binding_memory" | "path_prediction" | "reasoning";
  status: WrapperStatus;
  trials_seen: number;
  sessions_seen: number;
  balanced_accuracy: number;
  false_alarm_rate: number;
  miss_rate: number;
  lure_error_rate: number;
  theta_estimate?: number;
  standard_error?: number;
  recent_slope?: number;
  recovery_ratio?: number;
  timing_quality?: "good" | "ok" | "poor";
  last_seen_session: number;
  due_delayed_recheck: boolean;
}
```

### Selection rule

```ts
function chooseNextWrapper(userState, layer, sessionIndex) {
  if (hasDueDelayedRecheck(layer)) return dueDelayedWrapper(layer);

  if (hasActiveRecoveryWrapper(layer)) return recoveryWrapper(layer);

  if (coverageBehindSchedule(layer, sessionIndex)) return nextUnderCoveredWrapper(layer);

  if (currentWrapperEligibleForMix(layer)) return mixedWrapperBlock(layer);

  if (currentWrapperEligibleForProbe(layer)) return nextCoreWrapperProbe(layer);

  return currentTrainingWrapper(layer);
}
```

### Liberal progression rule

```ts
function updateWrapperStatus(w) {
  if (w.timing_quality === "poor") return "scaffolded";

  if (w.balanced_accuracy < 0.60) return "scaffolded";

  if (
    w.balanced_accuracy >= 0.82 &&
    w.false_alarm_rate <= 0.25 &&
    w.miss_rate <= 0.25
  ) return "probe";

  if (
    w.balanced_accuracy >= 0.70 &&
    w.recent_slope !== undefined &&
    w.recent_slope <= SMALL_POSITIVE_SLOPE &&
    w.trials_seen >= T_UNLOCK_MIN[w.layer]
  ) return "probe";

  if (
    w.sessions_seen >= 2 &&
    w.balanced_accuracy >= 0.65 &&
    w.false_alarm_rate <= 0.35 &&
    w.miss_rate <= 0.35
  ) return "probe";

  return w.status;
}
```

## 9. Final recommended rule set

The app-wide rule can be compressed to this:

```text
1. Train one wrapper briefly.
2. Add foils once the user is minimally stable.
3. Probe the next wrapper early.
4. If the dip is not catastrophic, continue.
5. Reduce other difficulty during the wrapper shift.
6. Mix old and new wrappers quickly.
7. Do not wait for perfect asymptotes.
8. Use quotas so every core dimension is sampled by Session 15–20.
9. Bank only mixed, lure-resistant, delayed recovery.
10. Treat weak recovery as a bottleneck signal, not as a reason to stop the curriculum.
```

That gives you the right balance: **liberal enough for product momentum**, but still faithful to Trident-G because the app distinguishes unlock/progression from genuine transfer evidence.
