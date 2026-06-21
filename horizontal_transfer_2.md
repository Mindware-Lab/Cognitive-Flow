I would use a **learning-curve controller** with four decisions:

```text
stay
tune difficulty
probe new wrapper
mix wrappers
delay / re-check
```

The core rule should follow the Trident-G horizontal cycle:

```text
Wrapper A learning
→ flattening / local asymptote
→ Wrapper B probe
→ temporary dip
→ recovery
→ A+B mixed presentation
→ new flattening
→ Wrapper C probe
→ A+B+C mixed
→ delayed re-check
```

That is directly aligned with the protocol source, which treats wrapper change, temporary dip, recovery, mixed presentation and delayed re-check as the behavioural signature of transfer rather than local game fluency. 

## 1. Track a curve per wrapper, not one global curve

For each layer and wrapper, keep separate learning curves:

```ts
type WrapperCurve = {
  layer: "CCC" | "RelationalMemory" | "BindingMemory" | "PathPrediction";
  carrier: "arrow" | "gabor" | "optic_flow";
  frame: "absolute" | "relational";
  relationAxis: string;
  recentCapacity: number;
  recentAccuracy: number;
  balancedAccuracy: number;
  medianRT: number;
  lapseRate: number;
  falseAlarmRate?: number;
  lureErrorRate?: number;
  timingQuality: "good" | "acceptable" | "limited";
  estimateSE: number;
  slopeShort: number;
  slopeLong: number;
  trialsInWrapper: number;
  status: "learning" | "flattening" | "probe" | "recovering" | "mixed" | "delayed_recheck";
};
```

For CCC, capacity is bits/sec. For WM, relation-bit steps or binding-bit steps. For SR, successor-bit steps or horizon. The app spec already separates Attention Control, Relational Memory, Binding Memory and Path Prediction as different measurement layers, and the final system principle is to reward relations surviving noise, delay, binding, wrapper change and future-state prediction, not just improvement in one game. 

## 2. Use five swap triggers

### Trigger A — difficulty tuning, not wrapper swap

Use this when the user is still clearly learning the current wrapper.

```text
If slope is positive
AND accuracy is inside training band
AND timing quality is acceptable
→ stay in wrapper and tune difficulty
```

For CCC:

```text
increase demand by:
1. shorter exposure
2. harder majority ratio
3. smaller response window only later
```

For WM:

```text
increase demand by:
1. n-level
2. relation alphabet size
3. lure pressure
4. wrapper mixing later
```

For SR:

```text
increase demand by:
1. stronger branch discrimination
2. horizon length
3. rare-valid vs invalid lures
4. context-gated transitions
```

Do **not** swap while the curve is still rising. You want enough local learning for the invariant to be minimally stable before perturbing it.

### Trigger B — wrapper probe

Use this when the curve starts flattening.

```text
If recent slope ≈ 0
AND performance is stable in or above training band
AND minimum trials are met
AND timing/confidence are acceptable
→ introduce brief wrapper probe
```

For example:

```text
Gabor absolute orientation
→ Gabor relative radial/tangential

Gabor relative radial/tangential
→ optic-flow expansion/contraction

Arrow absolute left/right
→ Gabor absolute tilt

Gabor relation n-back
→ optic-flow relation n-back
```

This follows the protocol rule that flattening should prompt a controlled perturbation before the surface policy becomes too hardened. The source explicitly says flattening should be combined with readiness, error-pattern and confidence checks before harder wrapper perturbation. 

### Trigger C — recovery block

After the first probe, classify the dip.

```text
recovery_ratio = new_wrapper_score / old_wrapper_pre_swap_score
```

Suggested bands:

```text
Strong recovery:   ≥ 0.90
Moderate recovery: 0.75–0.89
Weak recovery:     0.60–0.74
Poor recovery:     < 0.60
```

Then route:

| Recovery pattern | Rule                                                  |
| ---------------- | ----------------------------------------------------- |
| **Strong**       | Move quickly to blocked B, then A/B mix.              |
| **Moderate**     | Train B with easier demand, then re-probe.            |
| **Weak**         | Add scaffolded contrast trials and reduce difficulty. |
| **Poor**         | Return to A, add foils/contrast, delay B.             |

The key is that a **temporary dip is not bad**. It is expected. The transfer signal is whether the user recovers the invariant under the changed surface. 

### Trigger D — mixed-wrapper block

Once B recovers, mix A and B.

Start gently:

```text
70% B / 30% A
```

Then:

```text
50% B / 50% A
```

Then:

```text
random A/B
```

Then, after flattening again:

```text
A/B/C mixed
```

The protocol source treats A+B mixing as important because it prevents re-freezing into either wrapper-specific routine and forces relation recovery before a surface shortcut dominates. 

### Trigger E — delayed re-check

After a successful mixed block, schedule delayed re-checks.

```text
same day: later block
next session: changed wrapper
after several sessions: mixed + lure probe
```

A structure should only be “banked” when it survives wrapper change, foils, mixed presentation, prediction/reasoning and delayed re-check, not merely because it improved locally. 

## 3. Practical swap rules by layer

### CCC / Attention Control

Use CCC mainly for evidence-extraction and carrier/frame recovery.

```text
A. Arrow absolute
B. Arrow relational
C. Gabor absolute
D. Gabor relational
E. Optic-flow absolute
F. Optic-flow relational
```

Suggested progression:

```text
arrow_abs → arrow_rel
arrow_rel → gabor_rel
gabor_rel → flow_rel
then mixed carrier/frame blocks
```

But for the first scoring anchor, keep the CCC model clean. The CCC source specifies adaptive masked majority displays, wrapper-specific capacity estimates, training band, timing quality and fitted wrapper costs. 

Swap only when:

```text
balanced accuracy ≥ 75–82%
recent slope near zero
minimum 80–120 trials in wrapper
timing quality good/acceptable
estimate SE acceptable
lapse rate low
```

Do not swap when:

```text
timing limited
accuracy unstable
lapse rate high
RT variability suddenly high
user is only succeeding on easy 5:0 trials
```

### Relational Memory

Here the swap target is not just perceptual extraction but relation maintenance.

Possible sequence:

```text
Gabor relation token n-back
→ Gabor relative-frame n-back
→ optic-flow relation n-back
→ mixed Gabor/flow n-back
→ delayed wrong-lag lure re-check
```

Swap when:

```text
n-level stable for 2–3 blocks
balanced accuracy ≥ 80%
false alarms and misses both controlled
wrong-lag lure errors not high
```

Do not swap if the user is progressing by response bias, for example saying “no match” too often.

### Binding Memory

Here colour/context becomes relevant.

Sequence:

```text
relation only
→ relation × colour
→ relation × colour × carrier
→ relation × colour × carrier × frame
```

Swap when:

```text
partial-match lure errors are low
swap-lure errors are low
bound-state n-back level is stable
```

Back off if:

```text
same relation / wrong colour false alarms rise
same colour / wrong relation false alarms rise
```

In that case the bottleneck is binding, not wrapper transfer.

### Path Prediction / SR

Here optic flow should become more central.

Sequence:

```text
Gabor state transitions
→ Gabor/flow wrapper swap
→ optic-flow path prediction
→ mixed graph with rare-valid and invalid edges
→ delayed reachability probe
```

This matches the earlier protocol source: MVP 2 adds flow patch fields, Gabor → Flow wrapper swap, same relation under changed wrapper, W-Recovery and wrapper-swap recovery curves; MVP 3 adds flow-patch SR mode, trajectory → successor → target reachability and delayed probes. 

Swap when:

```text
one-step expected transitions are stable
rare-valid transitions are not treated as invalid
reachability probes are above criterion
false alarms to expected transitions are controlled
```

## 4. Use three learning-curve states

### 1. Acquisition curve

The user is still learning.

```text
slope > threshold
accuracy improving
difficulty increasing
```

Rule:

```text
stay and tune demand
```

### 2. Flattening curve

The user is locally stable.

```text
slope ≈ 0
accuracy stable
demand stable or high
```

Rule:

```text
probe new wrapper
```

### 3. Transfer recovery curve

The user has been perturbed.

```text
initial dip
then slope positive
then return toward baseline
```

Rule:

```text
train B until recovery
then mix A+B
```

## 5. Concrete controller logic

```ts
function chooseNextBlock(curve, userState) {
  if (curve.timingQuality === "limited") {
    return "repeat_current_with_safer_timing";
  }

  if (curve.lapseRate > 0.15) {
    return "reduce_load_or_pause";
  }

  if (curve.status === "learning" && curve.slopeShort > POSITIVE_SLOPE) {
    return "stay_and_increase_demand_slightly";
  }

  if (
    curve.status === "learning" &&
    Math.abs(curve.slopeShort) < FLAT_SLOPE &&
    curve.balancedAccuracy >= 0.75 &&
    curve.trialsInWrapper >= MIN_TRIALS &&
    curve.estimateSE <= MAX_SE
  ) {
    return "probe_next_wrapper";
  }

  if (curve.status === "probe") {
    if (curve.recoveryRatio >= 0.90) return "start_mixed_block";
    if (curve.recoveryRatio >= 0.75) return "train_new_wrapper";
    if (curve.recoveryRatio >= 0.60) return "scaffold_new_wrapper";
    return "return_to_previous_wrapper_with_foils";
  }

  if (curve.status === "mixed" && curve.balancedAccuracy >= 0.75) {
    return "increase_mix_or_schedule_delayed_recheck";
  }

  return "continue_current_wrapper";
}
```

## 6. Recommended 20-session carrier/frame progression

This should be adaptive, not rigid, but a good default arc is:

| Sessions | Focus                       | Swap logic                                       |
| -------: | --------------------------- | ------------------------------------------------ |
|      1–3 | Arrow/Gabor absolute anchor | Establish baseline and timing quality.           |
|      4–6 | Relative-frame version      | Swap absolute → relational after flattening.     |
|      7–9 | Gabor field WM/binding      | Add feature and relation maintenance.            |
|    10–12 | Gabor relational + lures    | Add wrong-lag, partial-match and boundary foils. |
|    13–15 | Gabor → optic-flow transfer | Probe changed carrier after flattening.          |
|    16–17 | Mixed Gabor/flow            | A/B mixing and recovery scoring.                 |
|    18–19 | SR path prediction          | Use optic-flow and graph transitions.            |
|       20 | Delayed mixed re-check      | Test whether relation survives delay.            |

This matches the broader protocol arc: component foundations first, horizontal wrapper transfer next, vertical integration/reasoning after that, and delayed consolidation before banking the structure. 

## 7. The main rule in one sentence

Use this as the controller principle:

```text
Do not swap because the user improved.
Swap when the current wrapper is stable enough that a new wrapper can test whether the relation, not the surface routine, has been learned.
```

Or even more compactly:

```text
Improve → flatten → perturb → dip → recover → mix → delay → bank.
```
