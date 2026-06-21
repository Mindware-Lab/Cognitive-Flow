# IQ Coach Horizontal Transfer Method v1

## Wrapper swaps across the full stimulus stack

## 1. Purpose

The purpose of horizontal transfer in IQ Coach is to test whether the learner can recover the same relation or operation when the surface format changes.

The app should not merely ask:

```text
Did performance improve in the trained format?
```

It should ask:

```text
Can the same relation survive a change in carrier, frame, feature, context, response surface, delay and lures?
```

The core transfer pattern is:

```text
train
→ flatten
→ probe
→ dip
→ recover
→ mix
→ delay
→ bank
```

A relation should only be treated as portable when it survives:

```text
wrapper change
mixed-wrapper presentation
near-miss lures
delay
vertical re-use in the next layer
```

---

## 2. Core v1 stimulus stack

Version 1 uses the orthogonal stimulus grammar.

```text
state =
carrier
× frame
× axis
× polarity
× optional feature
× optional colour/context
```

### 2.1 Carrier

```ts
type Carrier =
  | "arrow"
  | "gabor"
  | "optic_flow";
```

### 2.2 Frame

```ts
type Frame =
  | "absolute"
  | "relational";
```

### 2.3 Orthogonal axes only

Do not include diagonals or spirals in v1.

Allowed v1 axes:

```ts
type Axis =
  | "x_axis"
  | "y_axis"
  | "radial_axis"
  | "tangential_axis"
  | "orientation_axis"
  | "spatial_frequency_axis"
  | "flow_speed_axis";
```

Excluded in v1:

```text
diagonal axis
spiral axis
oblique Gabor offsets
combined expansion + rotation
diagonal optic flow
spiral optic flow
```

### 2.4 Polarity

```ts
type Polarity =
  | "left"
  | "right"
  | "up"
  | "down"
  | "out"
  | "in"
  | "clockwise"
  | "anticlockwise"
  | "horizontal"
  | "vertical"
  | "radial_aligned"
  | "tangential_aligned"
  | "low_spatial_frequency"
  | "high_spatial_frequency"
  | "slow"
  | "fast"
  | "expansion"
  | "contraction";
```

### 2.5 Colour and context

Colour is not a carrier. It is a binding or context dimension.

```ts
type Colour =
  | "blue"
  | "yellow"
  | "green"
  | "purple";

type Context =
  | "K"
  | "L"
  | null;
```

Colour use by layer:

```text
CCC / Attention Control:
colour absent, irrelevant or unscored lure

Relational Memory:
colour optional or irrelevant at first

Binding Memory:
colour becomes scored binding dimension

Path Prediction:
colour/context can gate transitions

Reasoning:
colour/context translates into symbolic or semantic conditions
```

---

## 3. Wrapper definition

A wrapper is the surface format in which the same relation appears.

In code:

```ts
type Wrapper = {
  carrier: Carrier;
  frame: Frame;
  axis: Axis;
  featureSet?: string[];
  colourMode?: "absent" | "irrelevant" | "binding" | "context_gate";
  responseSurface?: "binary" | "match_nonmatch" | "continue_break" | "valid_invalid" | "symbolic" | "semantic";
};
```

Examples:

```text
arrow.absolute.x_axis
arrow.absolute.y_axis
arrow.relational.radial_axis
arrow.relational.tangential_axis

gabor.absolute.orientation_axis
gabor.absolute.spatial_frequency_axis
gabor.relational.radial_axis

optic_flow.absolute.x_axis
optic_flow.absolute.y_axis
optic_flow.relational.radial_axis
optic_flow.relational.tangential_axis
optic_flow.absolute.flow_speed_axis
```

The invariant is not the wrapper.

The invariant is the operation or relation being recovered.

Examples:

```text
majority extraction
relation-token maintenance
relation × colour binding
same-change detection
successor prediction
valid transition recognition
explicit transitive inference
```

---

## 4. Universal horizontal-transfer controller

Every layer uses the same controller.

```text
Phase A: blocked current wrapper
Phase B: small new-wrapper probe
Phase C: recovery training
Phase D: mixed-wrapper stability
Phase E: delayed mixed re-check
Phase F: bank or recycle
```

### Phase A — Blocked current wrapper

Use mostly one wrapper to establish a local learning curve.

```text
100% Wrapper A
```

Goal:

```text
establish stable local estimate
```

Do not perturb yet if the learner is still improving.

---

### Phase B — Small new-wrapper probe

When flattening or stable no-change is detected, introduce a small probe.

```text
80% Wrapper A
20% Wrapper B
```

Goal:

```text
measure initial transfer dip
```

Do not fully replace the current wrapper until the new wrapper shows recoverable performance.

---

### Phase C — Recovery training

If Wrapper B is recoverable, increase its share.

```text
50% Wrapper A
50% Wrapper B
```

Then:

```text
30% Wrapper A
70% Wrapper B
```

Goal:

```text
train recovery while keeping the old wrapper as an anchor
```

---

### Phase D — Mixed-wrapper stability

Use unpredictable mixed blocks.

```text
random A / B
```

Then later:

```text
random A / B / C
```

Goal:

```text
test whether the learner recovers the invariant under wrapper uncertainty
```

---

### Phase E — Delayed mixed re-check

Re-test in a later session.

```text
Session N:
mixed-wrapper recovery

Session N+1 or later:
delayed mixed-wrapper re-check
```

Where possible, include:

```text
24+ hour re-check
```

Goal:

```text
test whether the recovered operation survives time
```

---

### Phase F — Bank or recycle

Bank the relation only if:

```text
recovery is moderate or strong
mixed-wrapper stability is acceptable
lure resistance is acceptable
delayed retention is acceptable
data quality is acceptable
```

Recycle if:

```text
recovery is weak
mixed-wrapper stability collapses
delayed retention collapses
lure errors remain high
timing or lapse quality is poor
```

---

## 5. Learning-state classifier

Do not depend on a fitted power-law curve.

Classify each wrapper into one learning state.

```ts
type LearningState =
  | "improving"
  | "flattening"
  | "stable_no_change"
  | "unstable"
  | "timing_limited"
  | "lapse_limited"
  | "overloaded"
  | "under_challenged";
```

### 5.1 Improving

```text
rolling estimate is rising beyond noise
accuracy is in the training band
data quality is acceptable
```

Action:

```text
continue current wrapper
increase task demand slightly
```

### 5.2 Flattening

```text
recent slope is near zero
next-window improvement is unlikely
accuracy is stable in or above the training band
timing quality is acceptable or good
lapse rate is not elevated
```

Action:

```text
prepare new-wrapper probe
```

### 5.3 Stable no-change

```text
no meaningful change across enough data
posterior improvement probability is neither clearly high nor low
pattern persists across at least two update windows
timing quality is not limited
lapse rate is acceptable
```

Action:

```text
probe new wrapper or scaffold current wrapper
```

### 5.4 Unstable

```text
wide posterior uncertainty
volatile accuracy
variable reaction times
insufficient valid trials
```

Action:

```text
continue calibration
do not swap yet
```

### 5.5 Timing-limited

```text
frame timing unreliable
refresh-rate estimate unstable
dropped frames high
```

Action:

```text
avoid swap
use safer exposure timing
do not display strong transfer score
```

### 5.6 Lapse-limited

```text
catch/easy errors high
timeouts high
attention lapses likely
```

Action:

```text
slow pacing
simplify
add easy catch trials
or recommend break
```

### 5.7 Overloaded

```text
accuracy collapses
RT instability rises
false alarms or misses spike
```

Action:

```text
reduce demand
return to anchor wrapper
do not introduce new wrapper
```

### 5.8 Under-challenged

```text
accuracy too high
low uncertainty
low error rate
little learning signal
```

Action:

```text
increase demand before wrapper swap
```

---

## 6. Minimum data before wrapper perturbation

Do not trigger wrapper perturbation until the current wrapper has:

```text
minimum: 120 valid scored trials
preferred: 150–220 valid scored trials
minimum sessions: 3
timing_quality ≠ limited
lapse_rate acceptable
accuracy not below 60%
```

Layer-specific exceptions are allowed for short demos, but not for stable scoring.

---

## 7. Smallest worthwhile change

Define a smallest worthwhile difference for each metric.

For CCC:

```text
SWD_CCC = max(0.15 bits/sec, 0.25 × posterior_sd_pooled)
```

For Relational Memory:

```text
SWD_RWM = max(0.15 relation-bit steps, 0.25 × posterior_sd_pooled)
```

For Binding Memory:

```text
SWD_BIND = max(0.15 binding-bit steps, 0.25 × posterior_sd_pooled)
```

For Path Prediction:

```text
SWD_PPC = max(0.15 successor-bit steps, 0.25 × posterior_sd_pooled)
```

For Reasoning:

```text
SWD_REASON = max(0.15 reasoning-demand units, 0.25 × posterior_sd_pooled)
```

Use SWD to prevent the app from overreacting to trivial changes.

---

## 8. Flattening rule

A wrapper is flattening when:

```text
P(slope_recent > slope_min) < 0.30

AND

P(next_window_score - current_score > SWD) < 0.30

AND

balanced accuracy is stable in or above the training band

AND

timing quality is acceptable or good

AND

lapse rate is not elevated
```

Suggested slope window:

```text
last 3–5 sessions
or
last 150–220 valid trials
```

---

## 9. Stable no-change rule

A wrapper is stable no-change when:

```text
abs(current_score - previous_window_score) < SWD

AND

posterior probability of improvement is between 0.40 and 0.60

AND

this persists across at least two update windows

AND

timing quality is not limited

AND

lapse rate is acceptable
```

This is important because not all users show a clean learning curve.

---

## 10. Do-not-swap conditions

Do not introduce a new wrapper if current stagnation is probably caused by:

```text
timing-limited estimates
high lapse rate
high timeout rate
response bias
poor comprehension
low valid trial count
very wide posterior uncertainty
accuracy below 60%
state instability
```

Route instead to:

```text
more calibration
easier exposure times
more catch/easy trials
slower pacing
instruction refresh
rest / retry later
```

---

## 11. Transfer metrics

Use the same metric family across all layers.

Let:

```text
A = trained wrapper
B = new wrapper
X_A_pre = stable score in A before probe
X_B_probe = first valid score in B during probe
X_B_recovered = rolling score in B after recovery
X_mix = mixed-wrapper score
X_delayed_mix = delayed mixed-wrapper score
```

Where X is:

```text
CCC:
bits/sec

Relational Memory:
relation-bit steps

Binding Memory:
binding-bit steps

Path Prediction:
successor-bit steps or horizon score

Reasoning:
reasoning-demand score or fitted reasoning theta
```

### 11.1 Switch cost

```text
SwitchCost = max(0, X_A_pre - X_B_probe) / X_A_pre
```

Interpretation:

```text
low switch cost:
strong immediate portability

moderate switch cost + later recovery:
useful transfer-learning signal

high switch cost + poor recovery:
wrapper-bound performance likely
```

Do not treat an initial dip as failure.

---

### 11.2 Recovery ratio

```text
RecoveryRatio = X_B_recovered / X_A_pre
```

Recovery bands:

```text
Strong recovery:
X_B_recovered ≥ X_A_pre - SWD

Moderate recovery:
X_B_recovered ≥ 0.80 × X_A_pre

Weak recovery:
X_B_recovered ≥ 0.60 × X_A_pre

Poor recovery:
X_B_recovered < 0.60 × X_A_pre
```

Posterior rule:

```text
assign a recovery band when P(band or better) ≥ 0.70
```

---

### 11.3 Recovery efficiency

```text
RecoveryEfficiency =
1 - min(1, trials_to_recovery / target_recovery_trials)
```

Suggested default:

```text
target_recovery_trials = 150
```

If recovery has not occurred:

```text
RecoveryEfficiency = 0
```

---

### 11.4 Mixed-wrapper stability

```text
MixedStability =
min(1, X_mix / mean(X_A_recent, X_B_recovered))
```

High mixed stability means the user is recovering the invariant rather than relying on blocked-wrapper preparation.

---

### 11.5 Delayed retention

```text
DelayedRetention =
min(1, X_delayed_mix / X_mix_immediate)
```

Suggested delayed re-check:

```text
next session
or
24+ hours later where possible
```

---

### 11.6 Data quality weight

```text
Q =
timing_quality_weight
× confidence_weight
× lapse_weight
```

Suggested weights:

```text
timing_quality_weight:
good = 1.00
acceptable = 0.85
limited = 0.40

confidence_weight:
good = 1.00
moderate = 0.85
early = 0.60
calibrating = 0.30

lapse_weight:
low = 1.00
moderate = 0.80
high = 0.50
```

Do not display a strong transfer claim when:

```text
Q < 0.70
```

---

## 12. Generic transfer score

For each wrapper swap:

```text
WrapperTransfer =
Q × weighted_mean(
  RecoveryScore,
  RecoveryEfficiency,
  MixedStability,
  DelayedRetention,
  LureResistance
)
```

Suggested v1 weights:

```text
RecoveryScore: 30%
RecoveryEfficiency: 15%
MixedStability: 25%
DelayedRetention: 20%
LureResistance: 10%
```

Do not include SwitchCost directly in the composite.

Report SwitchCost separately because the dip is part of the transfer signal.

---

## 13. Full stimulus-stack wrapper ladders

The full v1 ladder uses orthogonal carrier/frame/axis swaps.

## 13.1 Within-carrier frame swaps

These test whether the learner can recover the same operation under a changed reference frame.

### Arrow

```text
arrow.absolute.x_axis
→ arrow.absolute.y_axis
→ arrow.relational.radial_axis
→ arrow.relational.tangential_axis
```

### Gabor

```text
gabor.absolute.orientation_axis
→ gabor.absolute.spatial_frequency_axis
→ gabor.relational.radial_axis
```

### Optic flow

```text
optic_flow.absolute.x_axis
→ optic_flow.absolute.y_axis
→ optic_flow.absolute.flow_speed_axis
→ optic_flow.relational.radial_axis
→ optic_flow.relational.tangential_axis
```

---

## 13.2 Cross-carrier swaps

These test whether the same relation survives a changed perceptual carrier.

### Static symbolic to static form-feature

```text
arrow.absolute.x_axis
→ gabor.absolute.orientation_axis
```

Example preserved invariant:

```text
binary feature extraction under brief uncertainty
```

### Static form-feature to dynamic motion

```text
gabor.absolute.spatial_frequency_axis
→ optic_flow.absolute.flow_speed_axis
```

Preserved invariant:

```text
low/high feature magnitude
```

### Relative static form to relative motion

```text
gabor.relational.radial_axis
→ optic_flow.relational.radial_axis
```

Preserved invariant:

```text
centre-relative radial relation
```

### Tangential relation transfer

```text
arrow.relational.tangential_axis
→ optic_flow.relational.tangential_axis
```

Preserved invariant:

```text
clockwise / anticlockwise relation relative to centre
```

---

## 13.3 Feature and binding swaps

These test whether the relation survives added binding load.

```text
relation only
→ relation × colour
→ relation × speed
→ relation × colour × speed
→ relation × colour/context
```

Example:

```text
optic_flow.relational.radial_axis.expansion
→ optic_flow.relational.radial_axis.expansion.fast
→ optic_flow.relational.radial_axis.expansion.fast.blue
```

---

## 14. Layer-specific horizontal transfer

## 14.1 Layer 1 — Attention Control / CCC

Invariant:

```text
extract the majority relation under masked, time-limited uncertainty
```

Score:

```text
bits/sec
```

Wrapper ladders:

```text
arrow.absolute.x_axis
→ arrow.absolute.y_axis
→ mixed arrow absolute

arrow.relational.radial_axis
→ arrow.relational.tangential_axis
→ mixed arrow relational

gabor.absolute.orientation_axis
→ gabor.absolute.spatial_frequency_axis
→ mixed Gabor absolute

gabor.relational.radial_axis
→ optic_flow.relational.radial_axis
→ mixed Gabor/flow relational

optic_flow.absolute.x_axis
→ optic_flow.absolute.y_axis
→ optic_flow.absolute.flow_speed_axis
→ mixed flow absolute

optic_flow.relational.radial_axis
→ optic_flow.relational.tangential_axis
→ mixed flow relational
```

CCC should preserve separate estimates:

```text
ACC_arrow_abs
ACC_arrow_rel
ACC_gabor_abs
ACC_gabor_rel
ACC_flow_abs
ACC_flow_rel
ACC_mixed
```

Do not collapse into one Attention Control score until there is sufficient data across active wrappers.

---

## 14.2 Layer 2 — Relational Memory

Invariant:

```text
hold and compare the relation across n-back delay
```

Score:

```text
relation-bit steps
```

Wrapper ladders:

```text
arrow relation n-back
→ gabor relation n-back
→ optic-flow relation n-back
→ mixed carrier relation n-back
→ delayed wrong-lag lure re-check
```

Within each carrier:

```text
absolute relation token
→ relational frame token
→ mixed absolute/relational tokens
```

Difficulty tuning before wrapper swap:

```text
increase n
increase relation alphabet size
add wrong-lag lures
add same-feature / wrong-relation lures
```

Swap only when:

```text
n-level stable for 2–3 blocks
balanced accuracy acceptable
false alarms controlled
misses controlled
wrong-lag lures not elevated
```

---

## 14.3 Layer 3A — Binding Memory

Invariant:

```text
remember what belongs with what
```

Score:

```text
binding-bit steps
```

Wrapper ladders:

```text
relation only
→ relation × colour
→ relation × carrier
→ relation × frame
→ relation × colour × carrier
→ relation × colour × carrier × frame
```

Example:

```text
gabor.relational.radial_aligned
→ gabor.relational.radial_aligned.blue
→ optic_flow.relational.expansion.blue
```

Lures:

```text
same relation / wrong colour
same colour / wrong relation
correct state / wrong context
wrong-lag conjunction
carrier-shifted conjunction lure
```

Swap only when:

```text
partial-match lure errors are low
swap-lure errors are low
bound-state n-back level is stable
```

Back off if the learner remembers features but loses their bindings.

---

## 14.4 Layer 3B — Change Tracking

Invariant:

```text
track the same transformation across changed surfaces
```

Score:

```text
relation-bit steps or transformation-demand score
```

Wrapper ladders:

```text
Gabor orientation change
→ Gabor spatial-frequency change
→ optic-flow speed change
→ optic-flow direction change
→ mixed transformation carrier
```

Preserved transformation examples:

```text
low → high
slow → fast

horizontal → vertical
left → right

radial-aligned → tangential-aligned
expansion → rotation
```

Lures:

```text
same endpoint / different transformation
same direction / different step size
surface similarity without structural similarity
wrong starting state
wrong feature dimension
```

---

## 14.5 Layer 4 — Path Prediction / SR

Invariant:

```text
learn the successor graph and predict expected, rare, invalid or blocked transitions
```

Score:

```text
successor-bit steps
S-Horizon
rare-valid discrimination
blocked-path detection
```

Wrapper ladders:

```text
Gabor state graph
→ Gabor feature graph
→ Gabor colour-context graph
→ optic-flow state graph
→ mixed Gabor/flow graph
→ delayed reachability probe
```

Core transfer swaps:

```text
gabor.orientation sequence
→ gabor.spatial_frequency sequence

gabor.spatial_frequency sequence
→ optic_flow.speed sequence

gabor.radial/tangential state graph
→ optic_flow.expansion/rotation state graph

colour-gated Gabor rule
→ colour-gated optic-flow rule
```

SR should include:

```text
expected transitions
rare-valid transitions
invalid transitions
wrong-context transitions
blocked paths
wrapper-shifted valid transitions
```

Swap only when:

```text
expected-transition correct rejection is adequate
invalid-transition hit rate is adequate
rare-valid transitions are not treated as invalid
reachability probes are above criterion
false alarms are controlled
```

---

## 14.6 Layer 5 — Reasoning

Invariant:

```text
recover the same relation explicitly in symbolic, nonsense-semantic and domain-semantic wrappers
```

Score:

```text
reasoning-demand level
fitted reasoning capacity
reasoning wrapper recovery
delayed reasoning recovery
```

Wrapper ladders:

```text
visual SR relation
→ symbolic reasoning
→ nonsense-semantic reasoning
→ domain-semantic reasoning
→ mixed reasoning
→ delayed reasoning re-check
```

Reasoning wrapper families:

```text
symbolic
nonsense-semantic
domain-semantic
```

Examples:

```text
SR:
A → B → C

Symbolic:
A > B, B > C, therefore A > C

Nonsense:
The flarn outranks the nidge.
The nidge outranks the borp.
Therefore the flarn outranks the borp.

Domain:
Plan A is safer than Plan B.
Plan B is safer than Plan C.
Therefore Plan A is safer than Plan C.
```

Lures:

```text
plausible invalid conclusion
valid but unfamiliar conclusion
cannot-tell treated as valid
single condition treated as sufficient
rare treated as impossible
counterfactual treated as actual
```

---

## 15. Cross-layer vertical bridge after horizontal recovery

A wrapper is not fully banked at one layer until it has at least a short bridge to the next layer.

Examples:

```text
CCC recovery
→ brief Relational Memory block using same relation

Relational Memory recovery
→ brief Binding Memory block using relation × colour

Binding recovery
→ brief SR transition block using bound states

SR recovery
→ brief Reasoning bridge using the same graph relation
```

This prevents wrapper recovery from remaining local to one task.

---

## 16. Session-level implementation

## 16.1 Core session

Default 15–20 minute session:

```text
1. Quick anchor check
2. Current layer training block
3. If flattening: wrapper probe
4. If recovering: mixed-wrapper block
5. Short downstream bridge
6. Summary and next wrapper state
```

## 16.2 Benchmark session

Every 5–7 sessions:

```text
mixed relation families
mixed wrappers
delayed items from prior sessions
lure-controlled items
reasoning bridge
```

Benchmark sessions update:

```text
Wrapper Recovery
Delayed Recovery
Lure Resistance
Mixed-Wrapper Performance
Transfer Score
```

---

## 17. Default 20-session horizontal-transfer arc

This is a default curriculum, not a rigid schedule.

### Sessions 1–3 — Anchor and calibration

```text
arrow absolute
arrow relational
basic Gabor absolute
```

Goal:

```text
baseline timing
basic extraction
initial relation profile
```

### Sessions 4–6 — Frame transfer

```text
absolute → relational
x/y → radial/tangential
```

Goal:

```text
test reference-frame recovery
```

### Sessions 7–9 — Static carrier transfer

```text
arrow → Gabor
orientation → spatial frequency
Gabor absolute → Gabor relational
```

Goal:

```text
test static-form transfer without relying on symbolic arrows
```

### Sessions 10–12 — WM and binding pressure

```text
relation n-back
relation × colour n-back
wrong-lag lures
partial-match lures
```

Goal:

```text
test whether the relation survives delay and binding load
```

### Sessions 13–15 — Dynamic carrier transfer

```text
Gabor → optic flow
spatial frequency → speed
radial/tangential → expansion/rotation
```

Goal:

```text
test static-to-dynamic carrier recovery
```

### Sessions 16–17 — Mixed carrier/frame recovery

```text
Gabor/optic-flow mixed
absolute/relational mixed
relation × colour/context mixed
```

Goal:

```text
test unpredictable wrapper recovery
```

### Sessions 18–19 — SR path prediction

```text
state graph
expected/rare/invalid transitions
reachability probes
blocked-path probes
```

Goal:

```text
test successor-map learning from the same state grammar
```

### Session 20 — Delayed mixed re-check and reasoning bridge

```text
delayed mixed carrier/frame/block
visual SR relation → symbolic/nonsense/domain reasoning
```

Goal:

```text
test delayed recovery and explicit relation recovery
```

---

## 18. Backend state model

Track wrapper state separately for each layer.

```ts
type Layer =
  | "attention_control"
  | "relational_memory"
  | "binding_memory"
  | "change_tracking"
  | "path_prediction"
  | "reasoning";

type WrapperLearningState =
  | "blocked_anchor"
  | "improving"
  | "flattening"
  | "stable_no_change"
  | "probe"
  | "recovering"
  | "mixed"
  | "delayed_recheck"
  | "banked"
  | "recycle";

type WrapperCurve = {
  userId: string;
  layer: Layer;
  wrapperId: string;
  carrier: Carrier;
  frame: Frame;
  axis: Axis;
  polaritySet: string[];
  featureSet?: string[];
  colourMode?: "absent" | "irrelevant" | "binding" | "context_gate";
  scoreMetric: "bits_per_sec" | "relation_bit_steps" | "binding_bit_steps" | "successor_bit_steps" | "reasoning_theta";
  currentScore: number;
  previousScore: number;
  posteriorSd: number;
  slopeRecent: number;
  balancedAccuracy: number;
  falseAlarmRate?: number;
  missRate?: number;
  lureErrorRate?: number;
  timingQuality?: "good" | "acceptable" | "limited";
  lapseRate: number;
  validTrials: number;
  sessionsInWrapper: number;
  state: WrapperLearningState;
};
```

---

## 19. Swap controller pseudocode

```ts
function chooseHorizontalTransferAction(curve: WrapperCurve): TransferAction {
  if (curve.timingQuality === "limited") {
    return "fix_timing_or_repeat_safe_conditions";
  }

  if (curve.lapseRate > 0.15) {
    return "slow_pacing_or_reduce_load";
  }

  if (curve.validTrials < 120 || curve.sessionsInWrapper < 3) {
    return "continue_calibration";
  }

  if (curve.balancedAccuracy < 0.60) {
    return "reduce_difficulty_and_refresh_instructions";
  }

  if (isUnderChallenged(curve)) {
    return "increase_demand_within_current_wrapper";
  }

  if (isImproving(curve)) {
    return "continue_current_wrapper";
  }

  if (isFlattening(curve) || isStableNoChange(curve)) {
    return "start_80_20_new_wrapper_probe";
  }

  if (curve.state === "probe") {
    return "classify_switch_cost_and_route_recovery";
  }

  if (curve.state === "recovering") {
    return "increase_new_wrapper_share";
  }

  if (curve.state === "mixed") {
    return "schedule_delayed_recheck_or_add_next_wrapper";
  }

  if (curve.state === "delayed_recheck") {
    return "bank_or_recycle_wrapper";
  }

  return "continue_current_wrapper";
}
```

---

## 20. Banked relation rule

A relation can be banked only when:

```text
local performance is stable
new-wrapper recovery is moderate or strong
mixed-wrapper stability is acceptable
delayed retention is acceptable
lure resistance is acceptable
downstream bridge does not collapse
data quality is acceptable
```

Do not bank from:

```text
one good session
same-wrapper improvement only
uncalibrated timing
high lapse rates
high lure errors
no delayed re-check
```

---

## 21. User-facing language

Do not say:

```text
You have achieved far transfer.
Your IQ has improved.
This proves the training generalised.
```

Use:

```text
You recovered the same rule in a new format.
Your transfer strength is improving.
This relation is becoming less tied to one surface.
The next check will test whether it still holds after delay.
```

---

## 22. Final v1 method

The definite v1 horizontal-transfer method is:

```text
1. Train one wrapper until learning is stable.
2. Do not assume a power-law curve.
3. Classify the wrapper state using slope, uncertainty, accuracy, timing and lapse checks.
4. When flattening or stable no-change appears, introduce a small 80/20 wrapper probe.
5. Measure switch cost.
6. If recoverable, increase the new wrapper share.
7. Move into unpredictable mixed-wrapper blocks.
8. Add lures to sharpen the invariant.
9. Re-check after delay.
10. Bridge the recovered relation into the next layer.
11. Only bank the relation if recovery, mixing, lure resistance and delayed retention are acceptable.
```

In one line:

```text
Train the relation, change the surface, recover the rule, mix the wrappers, test it later, then use it one layer higher.
```


---

Best framing:
a hypothesis-led, evidence-generating training protocol
that operationalises piecewise learning, perturbation, recovery,
interleaving and delayed transfer checks.
```

I think by “Yonni and Tayler” you mean **Yoni Donner & Joseph Hardy’s** paper on piecewise power laws. Their study analysed **25,280 individual learning curves**, each with **500 measurements** across four cognitive tasks, and found that **piecewise power laws** fit individual learning curves better than a single smooth power law. Crucially, later pieces often exceeded earlier ones after a brief performance drop at transition points. ([PubMed][1])

That is strongly aligned with your proposed method:

```text
Blocked wrapper learning
→ flattening
→ wrapper perturbation
→ brief dip
→ recovery
→ later higher piece
→ mixed wrapper stability
```

## 1. Why it fits Donner & Hardy’s piecewise power-law account

The protocol is not assuming one smooth learning curve. It assumes something more like this:

```text
Wrapper A:
local improvement curve

transition:
wrapper swap / perturbation

Wrapper B:
new local improvement curve

mixed A+B:
new reconstruction curve

delayed re-check:
retention / consolidation curve
```

That is exactly the kind of behavioural structure that a **piecewise** account expects: local smooth improvement within a regime, separated by transition points where strategy, representation or task mapping changes. Donner & Hardy’s key result was that individual learning curves are often better treated as multiple segments than as one continuous law. ([Springer][2])

So your protocol should not be:

```text
Fit one power law.
Wait until it flattens.
Assume learning is done.
```

It should be:

```text
Detect local stabilisation.
Introduce a principled perturbation.
Measure dip and recovery.
Fit local pieces post hoc.
Use recovery as the transfer signal.
```

That is much better aligned with the piecewise literature.

## 2. Why it fits the Zhang & Tang paper

The attached Zhang & Tang paper argues that learning in neural networks can show signatures of criticality and heavy-tailed update dynamics, arising from a balance between **maximum-entropy exploration** and **mutual-information constraint** with the task objective. The PNAS abstract describes learning as a nonequilibrium process shaped by the trade-off between randomness and relevance, with power-law statistics in updates and intermittent large update intervals. ([PNAS][3])

Your horizontal-transfer protocol maps onto that in a plausible way:

| Zhang & Tang idea                 | Horizontal-transfer analogue                                                            |
| --------------------------------- | --------------------------------------------------------------------------------------- |
| Maximum entropy / exploration     | Wrapper swap, carrier change, frame change, mixed wrappers                              |
| Mutual-information constraint     | Same invariant relation, same graph structure, lures, scoring criterion                 |
| Heavy-tailed/intermittent updates | Large representational updates at wrapper transition points                             |
| Nonequilibrium learning           | Do not settle into one surface routine; perturb near local stability                    |
| Critical balance                  | Keep challenge high enough to reopen search, but constrained enough to recover the rule |

So the protocol is consistent with the **computational spirit** of Zhang & Tang:

```text
Open the search space,
but constrain it around a task-relevant invariant.
```

The caveat is important: Zhang & Tang studied **artificial neural network training**, not human app-based cognitive training. So this is a **theoretical analogy**, not direct validation.

## 3. Why it fits skill-learning literature more generally

The method also fits several classic skill-learning principles.

### Blocked first, then varied/interleaved

Skill learning often benefits from some initial blocked practice before variability or interleaving is introduced. Your protocol does this:

```text
blocked wrapper
→ stable local relation
→ wrapper probe
→ mixed wrappers
```

That is compatible with contextual interference and desirable-difficulty findings: interleaving can hurt immediate performance but improve retention and transfer. Bjork & Bjork describe interleaving as a way to introduce useful learning dynamics, while contextual-interference work shows that random/interleaved practice can improve long-term retention and transfer despite worse acquisition performance. ([bjorklab.psych.ucla.edu][4])

### Perturbation should be desirable, not destructive

The protocol’s recovery bands are important. A wrapper swap should cause a **recoverable dip**, not collapse:

```text
too easy:
no transfer test

moderate dip:
good perturbation

large unrecoverable collapse:
wrong wrapper or too much entropy
```

That is exactly the “desirable difficulty” logic: the difficulty is useful only when the learner can still reconstruct the target relation.

### Strategy and representation matter

Taylor and Ivry’s work on motor learning shows that flexible cognitive strategies contribute to learning and adaptation, not just implicit recalibration. ([PubMed][5]) That supports your vertical bridge:

```text
perceptual wrapper recovery
→ relational WM
→ binding
→ SR path prediction
→ explicit reasoning / mindware script
```

In other words, transfer should not rely only on low-level perceptual adaptation. The learner should also be able to recover the relation explicitly in a changed format.

## 4. The best interpretation

The protocol is consistent with this combined picture:

```text
Local practice produces a local skill curve.
Wrapper change creates a transition point.
A good transition produces a temporary dip.
Recovery shows that the invariant can be reconstructed.
Mixed wrappers prevent surface lock-in.
Delayed re-checks test consolidation.
Vertical bridging tests whether the relation has become usable beyond the original task.
```

That is very compatible with:

```text
piecewise power laws
contextual interference
desirable difficulties
strategy-sensitive skill learning
self-organising learning dynamics
```

## 5. The main caveat

The protocol should not claim:

```text
This proves far transfer.
This guarantees intelligence gain.
The brain is following power laws exactly.
```

It should claim:

```text
This protocol is designed to generate and measure transfer-relevant learning signatures:
local learning,
transition dip,
recovery,
mixed-wrapper stability,
lure resistance,
delayed retention
and vertical re-use.
```

That is a much stronger scientific position.

## 6. Practical modelling recommendation

Use power-law or piecewise-power-law fitting **post hoc**, not as the only online controller.

Online, use:

```text
rolling slope
posterior uncertainty
accuracy stability
lapse rate
timing quality
recovery ratio
mixed-wrapper stability
delayed retention
```

Then, for analysis, fit:

```text
single power law
single exponential
piecewise power law
piecewise exponential
state-space / change-point model
```

The key empirical prediction is:

```text
A successful horizontal-transfer protocol should show:
1. local improvement within wrappers,
2. a measurable dip at wrapper swap,
3. faster recovery over repeated swaps,
4. reduced future switch cost,
5. better mixed-wrapper stability,
6. delayed survival,
7. later vertical re-use.
```

That is the learning-curve signature you want.

## Bottom line

Yes — the protocol is consistent with Zhang & Tang, with Donner & Hardy’s piecewise learning-curve results, and with broader skill-learning principles. The strongest formulation is:

```text
IQ Coach uses wrapper swaps as controlled change-points in learning.

Each wrapper produces local skill acquisition.
Each swap tests whether the learned relation is surface-bound.
Recovery after the swap is the transfer signal.
Mixed-wrapper and delayed re-checks test whether the invariant has become portable.
```

That makes the protocol scientifically coherent without overclaiming that the existing literature has already validated the full Trident-G implementation.

[1]: https://pubmed.ncbi.nlm.nih.gov/25711183/?utm_source=chatgpt.com "Piecewise power laws in individual learning curves"
[2]: https://link.springer.com/article/10.3758/s13423-015-0811-x?utm_source=chatgpt.com "Piecewise power laws in individual learning curves"
[3]: https://www.pnas.org/doi/10.1073/pnas.2523012122?utm_source=chatgpt.com "Heavy-tailed update distributions arise from information ..."
[4]: https://bjorklab.psych.ucla.edu/wp-content/uploads/sites/13/2016/04/EBjork_RBjork_2011.pdf?utm_source=chatgpt.com "Creating Desirable Difficulties to Enhance Learning"
[5]: https://pubmed.ncbi.nlm.nih.gov/21390266/?utm_source=chatgpt.com "Flexible cognitive strategies during motor learning - PubMed"
