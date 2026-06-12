# IQ Coach — Meta Specification

## Overall Game Architecture, Scores, Sessions, Norms and Bottleneck Targeting

**Status:** Draft v0.1
**Product:** IQ Coach
**Protocol:** Trident-G Far Transfer Protocol
**Backend target:** Supabase / Postgres
**Primary design goal:** Train adaptive intelligence through layered cognitive capacity training, wrapper recovery and explicit reasoning transfer.

---

# 1. Product summary

IQ Coach is a layered cognitive training game.

It does not give one vague “brain score”. It tracks a structured profile across:

```text
controlled evidence extraction
→ relational evidence extraction
→ relation memory
→ associative binding
→ transformation tracking
→ path prediction
→ explicit reasoning transfer
→ wrapper recovery
→ delayed recovery
```

The core training principle is:

```text
train a relation
change the wrapper
recover the relation
mix wrappers
re-check after delay
```

The app should therefore measure both:

```text
local capacity
```

and:

```text
portability of that capacity across surface changes
```

---

# 2. Overall vertical architecture

The app has four major training layers.

## Layer 1 — Cognitive Bandwidth

**Internal:** `C_abs`, `C_rel`
**Consumer labels:** Cognitive Bandwidth, Frame Bandwidth
**Core task:** Arrow-based C-Control / majority-function task
**Purpose:** Measure and train controlled evidence extraction under time pressure.

Subtypes:

```text
absolute C-Control
relational / polar C-Control
```

Outputs:

```text
Cognitive Bandwidth
Frame Bandwidth
Frame Cost
```

---

## Layer 2 — Frame Memory / Majority Memory

**Internal:** `RWM_clean`, `RWM_uncertain`
**Consumer labels:** Frame Memory, Majority Memory, Change Tracking
**Core task:** Polar relation n-back and MFT-style majority n-back
**Purpose:** Measure and train relation maintenance, updating and comparison across delay.

Subtypes:

```text
clean polar n-back
majority-function n-back
```

Outputs:

```text
Frame Memory
Majority Memory
relation-bit steps
lure resistance
n-back level stability
```

---

## Layer 3 — Pattern Binding + Path Prediction

**Internal:** `A-Bind`, `C-Bind`, `R-Bind`, `S-Horizon`
**Consumer labels:** Pattern Binding, Change Tracking, Path Prediction
**Core task:** Gabor associative WM + continuous SR stream
**Purpose:** Bind visual states, track transformations and train continuous successor/path prediction.

Subtypes:

```text
associative WM
conjunctive binding
transformation tracking
continuous SR stream
sparse SR probes
```

Outputs:

```text
Pattern Binding
Change Tracking
Path Prediction
Lure Resistance
Wrapper Recovery
Delayed Recovery
```

---

## Layer 4 — Explicit Relational Reasoning

**Internal:** `ERRC`
**Consumer labels:** Reasoning Transfer, Reasoning Capacity, Rule Recovery
**Core task:** Symbolic, real-language and nonsense-semantic reasoning
**Purpose:** Test whether trained relations can be recovered explicitly across reasoning wrappers.

Subtypes:

```text
Order / Chain Reasoning
Transformation / Analogy Reasoning
Rule / Constraint Reasoning
Prediction / Strategic Path Reasoning
Mixed Reasoning
```

Outputs:

```text
Reasoning Transfer Capacity
Reasoning Lure Resistance
Reasoning Wrapper Recovery
Delayed Reasoning Recovery
```

---

# 3. Four SR-to-reasoning families

The same four relation families should organise both SR training and explicit reasoning.

| SR family                   | SR game mode | Reasoning family                      | Core invariant                        |
| --------------------------- | ------------ | ------------------------------------- | ------------------------------------- |
| Order & Chains              | Chain Flow   | Order / Chain Reasoning               | ordered relations compose             |
| Transformations & Analogies | Change Flow  | Transformation / Analogy Reasoning    | same change across surfaces           |
| Rules & Constraints         | Rule Flow    | Rule / Constraint Reasoning           | rules define valid and invalid states |
| Prediction & Strategy       | Path Flow    | Prediction / Strategic Path Reasoning | current state constrains future paths |

This mapping is central.

The user should not experience four unrelated games. They should experience one relation family being trained at several levels:

```text
visual extraction
→ relation memory
→ continuous SR stream
→ explicit reasoning
→ delayed re-check
```

---

# 4. User-facing score system

Use consumer-friendly score names, while storing technical metrics in the backend.

## 4.1 Main dashboard scores

| User score              | Internal metrics                 | Meaning                                                                                |
| ----------------------- | -------------------------------- | -------------------------------------------------------------------------------------- |
| **Cognitive Bandwidth** | `C_abs`                          | How quickly and accurately the user extracts relevant visual information.              |
| **Frame Bandwidth**     | `C_rel`                          | How well the user extracts relations rather than simple features.                      |
| **Frame Cost**          | `C_abs - C_rel`, `C_rel / C_abs` | How much capacity drops when the task becomes relational.                              |
| **Frame Memory**        | `RWM_clean`                      | Relation memory under clean conditions.                                                |
| **Majority Memory**     | `RWM_uncertain`                  | Relation memory when the current relation must first be extracted from noisy evidence. |
| **Pattern Binding**     | `A-Bind`, `C-Bind`               | Ability to remember what belongs with what.                                            |
| **Change Tracking**     | `R-Bind`, `RWM`                  | Ability to track transformations across time.                                          |
| **Path Prediction**     | `S-Horizon`                      | How far ahead the user can use a learned transition structure.                         |
| **Lure Resistance**     | `I-Lure`, `R-Lure`               | Resistance to tempting but wrong near-matches.                                         |
| **Wrapper Recovery**    | `W-Recovery`, `R-WRecovery`      | Ability to recover the same relation after a surface change.                           |
| **Delayed Recovery**    | `D-Retention`, `R-Delay`         | Ability to recover a relation after time or distractors.                               |
| **Reasoning Transfer**  | `ERRC`                           | Ability to recover and combine relations in explicit reasoning tasks.                  |
| **Transfer Score**      | composite                        | Overall portability across wrapper shifts, delay and reasoning transfer.               |

---

# 5. Technical score definitions

## 5.1 Cognitive Bandwidth

```text
C_abs = accuracy-adjusted information extracted / adjusted exposure time
```

Unit:

```text
bits/sec
```

---

## 5.2 Frame Bandwidth

```text
C_rel = accuracy-adjusted relational information extracted / adjusted exposure time
```

Unit:

```text
relational bits/sec
```

---

## 5.3 Frame Cost

Use both difference and ratio.

```text
Frame Cost Difference = C_abs - C_rel
```

```text
Frame Efficiency Ratio = C_rel / C_abs
```

Interpretation:

```text
high C_abs + low C_rel = possible relational extraction bottleneck
```

---

## 5.4 Frame Memory

```text
RWM_clean = H_relation × n at criterion
```

Unit:

```text
relation-bit steps
```

---

## 5.5 Majority Memory

```text
D_trial =
  H_extract / ET
+ α(H_relation × n)
+ β(lure pressure)
+ γ(wrapper shift)
```

Estimate:

```text
RWM_uncertain_theta
```

Unit:

```text
fitted relational WM-under-uncertainty capacity
```

---

## 5.6 Pattern Binding

```text
A-Bind = H_binding × n at criterion
```

Examples:

```text
location + feature binding
orientation + frequency binding
full token binding
```

Unit:

```text
binding-bit steps
```

---

## 5.7 Change Tracking

```text
R-Bind = H_relation × horizon_or_lag
```

Measures:

```text
same-change tracking
transformation repeat
change-size tracking
cross-dimension transformation
```

Unit:

```text
relation-bit steps
```

---

## 5.8 Path Prediction

```text
SR_load = successor_surprisal × horizon
```

where:

```text
successor_surprisal = -log2 P(S_future | S_current)
```

Objective horizon:

```text
S-Horizon = max k where performance(k) ≥ criterion
```

Unit:

```text
SR-bit steps
```

or consumer-facing:

```text
steps ahead
```

---

## 5.9 Reasoning Transfer Capacity

```text
D_reason =
  α(PremiseCount)
+ β(RelationCount)
+ γ(IdentityBindingCount)
+ δ(OperationMix)
+ ε(LurePressure)
+ ζ(WrapperShift)
+ η(Delay)
+ θ(ResponseSetComplexity)
```

Fit:

```text
P(correct) =
chance + usable_range × sigmoid(ERRC_theta - D_reason)
```

User-facing:

```text
Reasoning Transfer Capacity
```

Technical:

```text
ERRC
```

---

# 6. Composite Transfer Score

The Transfer Score should not be a generic brain score.

It should mean:

```text
How well relations survive wrapper changes, delay and explicit reasoning transfer.
```

Suggested formula:

```text
Transfer Score =
  weighted_mean(
    Wrapper Recovery,
    Delayed Recovery,
    SR-to-Reasoning Recovery,
    Lure Resistance,
    Mixed-Wrapper Performance
  )
```

Initial weights:

```text
Wrapper Recovery: 25%
Delayed Recovery: 20%
SR-to-Reasoning Recovery: 25%
Lure Resistance: 15%
Mixed-Wrapper Performance: 15%
```

Keep these weights configurable.

Do not present Transfer Score until the user has enough data across multiple sessions.

Minimum requirement:

```text
at least 5 sessions
at least 2 relation families
at least 2 wrapper shifts
at least 1 delayed re-check
```

---

# 7. Session structure

The app should support three session types:

```text
Core Session
Focused Bottleneck Session
Benchmark Session
```

---

# 8. Core Session

The default Core Session should last:

```text
15–20 minutes
```

Recommended target:

```text
18 minutes
```

## 8.1 Core Session timing

| Block                          |    Time | Layer         | User label          |
| ------------------------------ | ------: | ------------- | ------------------- |
| Warm-up / Cognitive Bandwidth  | 1.5 min | Layer 1       | Cognitive Bandwidth |
| Relational Bandwidth           | 2.5 min | Layer 1       | Frame Bandwidth     |
| Frame Memory / Majority Memory |   3 min | Layer 2       | Frame Memory        |
| Pattern Binding                |   2 min | Layer 3A      | Pattern Binding     |
| Change Tracking                |   3 min | Layer 3A / 3B | Change Tracking     |
| Path Prediction stream         |   4 min | Layer 3B      | Path Prediction     |
| Reasoning Transfer bridge      |   2 min | Layer 4       | Reasoning Transfer  |

Total:

```text
18 minutes
```

## 8.2 Extended Core Session

Optional full session:

```text
21–24 minutes
```

Add:

```text
+2 min Reasoning Transfer
+2 min Path Prediction
+1–2 min sparse probes / delayed checks
```

---

# 9. Focused Bottleneck Session

A bottleneck-focused session should last:

```text
10–15 minutes
```

Purpose:

```text
target one likely weak layer while keeping a short bridge to adjacent layers
```

Example:

```text
Frame Bandwidth bottleneck session
```

Structure:

| Block             |    Time | Purpose                                    |
| ----------------- | ------: | ------------------------------------------ |
| quick baseline    |   1 min | check current state                        |
| bottleneck layer  | 6–8 min | main training                              |
| upstream support  |   2 min | easier prerequisite                        |
| downstream bridge |   2 min | test whether bottleneck affects next layer |
| summary           |  30 sec | show adaptation                            |

Example:

```text
If Frame Bandwidth is weak:
1 min Cognitive Bandwidth
8 min relational C-Control
2 min clean Frame Memory
2 min majority Memory bridge
```

---

# 10. Benchmark Session

A Benchmark Session should occur every:

```text
5–7 sessions
```

Duration:

```text
20–25 minutes
```

Purpose:

```text
estimate stable profile
update norms
detect bottlenecks
measure wrapper recovery
measure delayed recovery
```

Structure:

| Block                             |    Time |
| --------------------------------- | ------: |
| Cognitive + Frame Bandwidth       |   4 min |
| Frame / Majority Memory           |   4 min |
| Pattern Binding + Change Tracking |   5 min |
| Path Prediction probes            |   4 min |
| Reasoning Transfer mixed block    | 6–8 min |
| Score summary                     |   1 min |

Benchmark sessions should include:

```text
mixed relation families
mixed wrappers
delayed items from prior sessions
lure-controlled items
```

---

# 11. Relation-family rotation

The Core Session should rotate the main relation family.

Example 7-day rotation:

| Day | Focus family                | SR stream         | Reasoning bridge           |
| --: | --------------------------- | ----------------- | -------------------------- |
|   1 | Order & Chains              | Chain Flow        | transitivity / cannot-tell |
|   2 | Transformations & Analogies | Change Flow       | same-change / analogy      |
|   3 | Rules & Constraints         | Rule Flow         | conjunction / XOR          |
|   4 | Prediction & Strategy       | Path Flow         | probability / reachability |
|   5 | Mixed review                | mixed SR stream   | mixed reasoning            |
|   6 | weakest family              | bottleneck-guided | bottleneck-guided          |
|   7 | delayed recovery            | re-entry checks   | delayed reasoning          |

---

# 12. Backend architecture

The backend should support:

```text
session logging
trial-level logging
adaptive state
population norms
personal baselines
bottleneck detection
longitudinal trend modelling
score summaries
```

Use Supabase/Postgres as the central store.

---

# 13. Backend table groups

## 13.1 User and profile tables

```text
profiles
user_settings
user_consent
user_baselines
user_norm_groups
```

## 13.2 Session tables

```text
training_sessions
session_blocks
session_summaries
```

## 13.3 Trial tables

```text
ccontrol_trials
nback_trials
binding_trials
sr_trials
reasoning_trials
```

## 13.4 Estimate tables

```text
capacity_estimates
score_snapshots
bottleneck_flags
adaptive_recommendations
```

## 13.5 Norm tables

```text
norm_groups
norm_distributions
metric_percentiles
metric_reliability
metric_version_history
```

## 13.6 Item tables

```text
stimulus_templates
transition_maps
reasoning_templates
item_calibration
lure_taxonomy
```

---

# 14. Norming system

The app should support two forms of comparison.

```text
personal baseline
population norm
```

## 14.1 Personal baseline

A personal baseline should be created after:

```text
3–5 usable sessions
```

Minimum data per metric:

```text
at least 3 estimates
acceptable timing quality
acceptable confidence label
```

Personal metrics:

```text
user_mean
user_sd
rolling_7_session_average
rolling_slope
best_recent_score
delayed_retention_ratio
```

---

## 14.2 Population norms

Population norms should be computed by norm groups.

Potential norm-group variables:

```text
age band
device class
input method
language
session count band
training exposure level
```

Do not over-segment early. Start with broad groups until enough data exists.

Minimum norm group rule:

```text
do not show percentile if group n < 100
```

For internal analysis, allow smaller exploratory groups, but do not present them as stable norms.

Population metrics:

```text
median
quartiles
percentiles
z-score
stanine / band label
confidence interval
sample size
metric reliability
```

---

# 15. Score confidence labels

Every user-facing score should have a confidence label.

```text
calibrating
moderate confidence
high confidence
timing limited
insufficient data
```

Score confidence depends on:

```text
number of trials
number of sessions
timing quality
internal consistency
recent volatility
device stability
lure balance
```

Example:

```text
Path Prediction: 2-step horizon
Confidence: moderate
```

---

# 16. Bottleneck theory in the app

A bottleneck is not a diagnosis.

A bottleneck is:

```text
a layer that appears to constrain performance in later layers relative to the user’s own profile and population norms
```

The app should phrase bottlenecks cautiously:

```text
Potential bottleneck
Likely bottleneck
Current limiting layer
Training focus suggested
```

Avoid:

```text
deficit
impairment
diagnosis
cognitive weakness
```

---

# 17. Bottleneck logic

A bottleneck flag should require evidence from several sources.

## 17.1 Basic bottleneck rule

A layer may be flagged when:

```text
score is low relative to personal profile
AND
score is low relative to population norm
AND
downstream scores are also suppressed
AND
upstream scores are adequate
```

Example:

```text
Cognitive Bandwidth: normal
Frame Bandwidth: low
Frame Memory: low
Pattern Binding: normal
Reasoning Transfer: low on relation-heavy items

Potential bottleneck:
Frame Bandwidth
```

---

# 18. Bottleneck layers

Track bottlenecks at these levels.

| Bottleneck layer    | Internal signals                  | Likely effect                                                      |
| ------------------- | --------------------------------- | ------------------------------------------------------------------ |
| Cognitive Bandwidth | low `C_abs`                       | basic extraction under time pressure may constrain everything else |
| Frame Bandwidth     | low `C_rel`, high Frame Cost      | relation extraction may constrain relation memory and SR training  |
| Frame Memory        | low `RWM_clean` / `RWM_uncertain` | relations may not stay stable over delay                           |
| Pattern Binding     | low `A-Bind`, high swap errors    | feature/role pairings may collapse under load                      |
| Change Tracking     | low `R-Bind`                      | transformations may not stay coherent                              |
| Path Prediction     | low `S-Horizon`                   | future-state prediction may be shallow                             |
| Lure Resistance     | high false lure acceptance        | near-matches may corrupt learning                                  |
| Wrapper Recovery    | low `W-Recovery`                  | user may overfit to surface wrappers                               |
| Delayed Recovery    | low `D-Retention`                 | gains may not consolidate                                          |
| Reasoning Transfer  | low `ERRC` relative to SR         | visual relation may not transfer into explicit reasoning           |

---

# 19. Bottleneck examples

## 19.1 Extraction bottleneck

Profile:

```text
Cognitive Bandwidth low
Frame Bandwidth low
all higher layers unstable
```

Interpretation:

```text
The user may be struggling at the evidence extraction layer.
```

Suggested next session:

```text
Cognitive Bandwidth focus
```

---

## 19.2 Relational extraction bottleneck

Profile:

```text
Cognitive Bandwidth average
Frame Bandwidth low
Frame Cost high
Frame Memory low
```

Interpretation:

```text
The user can extract features, but relational extraction is costly.
```

Suggested next session:

```text
Frame Bandwidth focus
```

---

## 19.3 Binding bottleneck

Profile:

```text
Frame Bandwidth adequate
Frame Memory adequate
Pattern Binding low
high swap-lure errors
```

Interpretation:

```text
Temporary feature or role bindings may be unstable.
```

Suggested next session:

```text
Pattern Binding focus
```

---

## 19.4 SR horizon bottleneck

Profile:

```text
Pattern Binding adequate
Change Tracking adequate
Path Prediction low
especially on 2-step or 3-step probes
```

Interpretation:

```text
The user can track local transformations but struggles to use them across future steps.
```

Suggested next session:

```text
Path Prediction focus
```

---

## 19.5 Transfer bottleneck

Profile:

```text
SR performance good
Reasoning Transfer weak
Wrapper Recovery weak
nonsense-semantics weak
```

Interpretation:

```text
The user may be learning the visual relation but not recovering it under explicit reasoning wrappers.
```

Suggested next session:

```text
Reasoning Transfer focus
```

---

# 20. Bottleneck scoring algorithm

## 20.1 Compute normalised scores

For each metric:

```text
personal_z = (score - user_recent_mean) / user_recent_sd
population_z = (score - norm_group_mean) / norm_group_sd
```

Also compute percentile:

```text
population_percentile
```

## 20.2 Compute relative layer gap

```text
relative_gap(layer_i) =
score_z(layer_i) - mean(score_z(adjacent_layers))
```

A negative relative gap suggests a possible bottleneck.

## 20.3 Compute downstream suppression

```text
downstream_suppression(layer_i) =
mean(z_scores_downstream) - mean(z_scores_upstream)
```

If downstream is low and upstream is adequate, the candidate bottleneck becomes more plausible.

## 20.4 Compute bottleneck likelihood

Suggested starting model:

```text
BottleneckScore(layer_i) =
  w1 * low_population_score
+ w2 * low_personal_score
+ w3 * relative_layer_gap
+ w4 * downstream_suppression
+ w5 * error_signature_match
+ w6 * recent_trend_weight
```

Output:

```text
none
watch
possible bottleneck
likely bottleneck
```

Do not show exact bottleneck probabilities to users in early MVP.

---

# 21. Error signatures

Bottlenecks should not be based only on low scores. They should also use error patterns.

| Layer               | Error signature                                                        |
| ------------------- | ---------------------------------------------------------------------- |
| Cognitive Bandwidth | missed brief displays, slow responses, timing sensitivity              |
| Frame Bandwidth     | feature correct but relation wrong                                     |
| Frame Memory        | correct current relation but wrong lag                                 |
| Pattern Binding     | swap errors, partial-match false alarms                                |
| Change Tracking     | same feature tracked but transformation missed                         |
| Path Prediction     | immediate step correct but future path wrong                           |
| Lure Resistance     | high false acceptance of near-matches                                  |
| Wrapper Recovery    | large dip after surface shift, slow recovery                           |
| Reasoning Transfer  | valid form rejected under nonsense wrapper, plausible invalid accepted |
| Delayed Recovery    | relation good immediately but poor after delay                         |

---

# 22. User-facing bottleneck page

The scores page can include a section:

```text
Current training focus
```

Example:

```text
Potential bottleneck: Pattern Binding

Your recent scores suggest that you are extracting relations well, but sometimes losing which features belong together when the task adds lures.

Next session options:
[Proceed as normal]
[Focus on Pattern Binding]
```

Another example:

```text
Potential bottleneck: Wrapper Recovery

You are doing well when the task format stays the same, but your performance dips when the same rule appears in a new format.

Next session options:
[Proceed as normal]
[Focus on Wrapper Recovery]
```

The user should always be able to choose:

```text
Proceed as normal
Focus on bottleneck
Skip recommendation
```

Do not force bottleneck sessions.

---

# 23. Bottleneck-adaptive session selection

## 23.1 Normal mode

Default:

```text
follow planned relation-family rotation
```

## 23.2 Bottleneck focus mode

If user chooses bottleneck focus:

```text
increase time spent on flagged layer
reduce time on non-target layers
keep a short upstream and downstream bridge
```

Example for Frame Bandwidth bottleneck:

```text
Cognitive Bandwidth: 1 min
Frame Bandwidth: 8 min
Frame Memory bridge: 3 min
Summary: 1 min
```

Example for Path Prediction bottleneck:

```text
Pattern Binding warm-up: 2 min
Change Tracking: 3 min
Path Prediction stream: 8 min
Sparse SR probes: 2 min
Summary: 1 min
```

Example for Reasoning Transfer bottleneck:

```text
SR relation refresher: 3 min
Symbolic reasoning: 3 min
Real-language reasoning: 3 min
Nonsense-semantics reasoning: 3 min
Mixed wrapper re-check: 2 min
Summary: 1 min
```

---

# 24. Bottleneck resolution

A bottleneck should be considered improving when:

```text
target layer score improves
target layer error signature weakens
downstream bridge score improves
wrapper recovery improves
delayed recovery does not collapse
```

Example:

```text
Pattern Binding bottleneck improved if:
A-Bind rises
swap errors fall
Change Tracking improves
Path Prediction does not deteriorate
```

Do not mark a bottleneck as resolved from one good session.

Suggested requirement:

```text
2–3 sessions showing improvement
or
one benchmark session confirming recovery
```

---

# 25. Adaptation hierarchy

When adapting sessions, follow this hierarchy.

```text
1. Safety / fatigue / timing quality
2. User choice
3. Current relation-family curriculum
4. Bottleneck hypothesis
5. Population norm comparison
6. Personal trend
7. Exploration of under-sampled layers
```

This prevents overfitting the app to a noisy bottleneck estimate.

---

# 26. Fatigue and state controls

Because low performance can reflect fatigue, distraction or poor timing, the app should avoid over-interpreting one bad session.

Flag session quality:

```text
good
noisy
fatigue suspected
timing limited
low engagement
insufficient data
```

Use:

```text
RT volatility
missed responses
sudden global drop
device timing quality
self-report optional
```

If all scores fall together, do not flag a specific bottleneck.

Instead show:

```text
Today looked globally harder than usual. We will re-check before changing your training focus.
```

---

# 27. Population norms and privacy

Population norms should be aggregated.

Do not expose:

```text
individual comparisons
raw trial data of other users
small-group percentiles
sensitive demographic labels
```

Norm reporting should be conservative:

```text
similar users
your recent baseline
training cohort
```

Examples:

```text
Your Frame Bandwidth is currently around the 62nd percentile among users with enough comparable data.
```

or:

```text
Compared with your own recent baseline, Pattern Binding is currently below your usual range.
```

---

# 28. Data quality requirements

Do not compute strong claims from weak data.

For each metric store:

```text
trial_count
session_count
timing_quality
device_class
input_method
confidence_label
norm_group_n
last_updated
metric_version
```

If confidence is low, show:

```text
still calibrating
```

rather than a percentile.

---

# 29. Backend computation schedule

## 29.1 Real-time during session

Compute:

```text
accuracy
RT
trial correctness
adaptive difficulty
block summary
```

## 29.2 Post-session

Compute:

```text
capacity estimates
score snapshot
bottleneck candidates
next-session recommendation
```

## 29.3 Nightly / scheduled jobs

Compute:

```text
population norms
metric distributions
item difficulty calibration
metric reliability
longitudinal trend summaries
```

---

# 30. Supabase implementation notes

Use client-side logging only for immediate session operations.

Use backend functions for:

```text
score computation
norm updates
bottleneck detection
recommendation generation
item calibration
```

Recommended principle:

```text
client records raw performance
backend computes interpretable scores
client displays summaries
```

Enable row-level security on user-specific tables.

Aggregate norms should be computed from anonymised or pseudonymised data.

---

# 31. Score page layout

## 31.1 Top summary

```text
Today’s training focus:
Path Prediction

Training band:
Standard → Stretch

Best current area:
Cognitive Bandwidth

Current focus area:
Pattern Binding
```

## 31.2 Main profile

```text
Control & Focus
- Cognitive Bandwidth
- Frame Bandwidth
- Frame Cost

Working Memory & Prediction
- Frame Memory
- Majority Memory
- Pattern Binding
- Change Tracking
- Path Prediction

Reasoning & Transfer
- Reasoning Transfer
- Wrapper Recovery
- Delayed Recovery
- Transfer Score
```

## 31.3 Bottleneck card

```text
Potential bottleneck:
Pattern Binding

Why:
Your relation extraction is stable, but swap-lure errors are higher than usual.

Next session:
[Proceed as normal]
[Focus on Pattern Binding]
```

---

# 32. User-facing score explanations

## Cognitive Bandwidth

```text
How quickly and accurately you can pick out the important information from a brief display.
```

## Frame Bandwidth

```text
How well you can detect the relationship between patterns, not just the patterns themselves.
```

## Frame Memory

```text
How well you can hold a relation in mind and compare it with a later relation.
```

## Majority Memory

```text
How well you can extract a relation from noisy evidence and hold it across time.
```

## Pattern Binding

```text
How well you can remember what belongs with what.
```

## Change Tracking

```text
How well you can track how a pattern changes over time.
```

## Path Prediction

```text
How far ahead you can predict whether a pattern can continue or still reach a target.
```

## Reasoning Transfer

```text
How well you can use the same rule in symbols, language and unfamiliar examples.
```

## Wrapper Recovery

```text
How well you recover the same rule when the surface changes.
```

## Delayed Recovery

```text
How well the rule survives after time has passed.
```

## Transfer Score

```text
How portable your trained relations are across new formats, delays and reasoning contexts.
```

---

# 33. MVP scope

MVP should include:

```text
Layer 1:
Cognitive Bandwidth
Frame Bandwidth

Layer 2:
Frame Memory
Majority Memory

Layer 3:
Pattern Binding
Change Tracking
Path Prediction

Layer 4:
Reasoning Transfer

Cross-cutting:
Lure Resistance
Wrapper Recovery
Delayed Recovery
basic bottleneck detection
personal baseline
early population norms
```

MVP should not include:

```text
clinical labels
official IQ score claims
high-stakes assessment
automated diagnosis
unreviewed LLM-generated reasoning items
complex demographic norm claims
```

---

# 34. Validation path

The app’s internal validation should test:

```text
Cognitive Bandwidth gain
→ Frame Bandwidth gain
→ Frame Memory / Pattern Binding gain
→ Change Tracking gain
→ Path Prediction gain
→ Reasoning Transfer gain
→ Wrapper Recovery
→ Delayed Recovery
```

The key research question is:

```text
Do changes in earlier bottleneck layers predict changes in later transfer layers?
```

Examples:

```text
Does improving Frame Bandwidth reduce Frame Cost and improve Majority Memory?

Does improving Pattern Binding reduce lure errors and improve Change Tracking?

Does improving Path Prediction improve Reasoning Transfer on matched relation families?

Does Wrapper Recovery predict delayed transfer more strongly than local task improvement?
```

---

# 35. Claim boundary

The app may say:

```text
IQ Coach tracks several component skills involved in adaptive reasoning.
It adapts training based on your current profile.
It can flag possible bottlenecks in the training stack.
It tests whether trained relations survive changed formats and delayed re-checks.
```

The app should not say:

```text
This diagnoses cognitive deficits.
This proves your IQ has increased.
This replaces a psychometric IQ test.
This guarantees far transfer.
This detects brain states.
```

Safe bottleneck wording:

```text
Your current profile suggests this layer may be limiting later performance. You can choose to focus on it next session, or continue the standard programme.
```

---

# 36. Final architecture summary

IQ Coach is a four-layer adaptive training system.

```text
Layer 1:
Cognitive and relational evidence extraction

Layer 2:
Relational memory under clean and uncertain conditions

Layer 3:
Associative binding, transformation tracking and path prediction

Layer 4:
Explicit relational reasoning across symbolic, real-language and nonsense-semantic wrappers
```

The app tracks:

```text
capacity
lure resistance
wrapper recovery
delayed recovery
reasoning transfer
```

The backend supports:

```text
personal baselines
population norms
adaptive recommendations
bottleneck detection
longitudinal validation
```

The core user loop is:

```text
Train the relation.
Change the surface.
Recover the rule.
Test it later.
Use it in reasoning.
```

The core adaptive loop is:

```text
Measure profile.
Detect likely bottleneck.
Offer normal or focused session.
Train targeted layer.
Check downstream bridge.
Update profile.
```

This completes the meta-spec for IQ Coach.
