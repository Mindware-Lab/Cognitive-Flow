# IQ Coach — WM Layer (Component 2) MVP Plan

## Arrow-Based Polar and Majority-Function n-back Capacity Layer

**Status:** Draft v0.1
**Product:** IQ Coach
**Layer:** Component 2 — n-back Capacity
**Depends on:** Component 1 — Arrow-based C-Control / Cognitive Bandwidth
**Purpose:** Build the first working-memory capacity layer using the same arrow stimuli, wrappers, masks and vector engine as the C-Control layer.

---

# 1. Core decision

Component 2 should use **the same arrow stimulus language as Component 1**.

No Gabor patches, no optic flow, no moving stimuli and no SR stream yet.

The n-back layer should train and estimate:

```text
relation maintenance
relation updating
majority-relation extraction over delay
lure resistance
adaptive n-back capacity
```

This gives a direct vertical progression:

```text
Component 1:
extract the current majority relation

Component 2:
extract, hold and compare relations across n-back delay
```

---

# 2. Two required n-back modes

Build two versions because they answer different measurement questions.

```text
Mode A:
Clean Polar n-back

Mode B:
Majority-Function n-back
```

## 2.1 Mode A — Clean Polar n-back

This is the clean relation-label n-back.

Each trial has one clear relation category.

Example:

```text
OUT → IN → OUT
```

At 2-back, the third trial is a match because:

```text
OUT matches OUT
```

Another example:

```text
SPIRAL OUT → CIRCLE LEFT → SPIRAL OUT
```

At 2-back, this is also a match.

### Purpose

Mode A estimates relatively pure relational working-memory capacity:

```text
Can the user hold and update relation labels over n-back delay?
```

It minimises perceptual uncertainty because each trial has one clear relation.

### User-facing name

```text
Frame Memory
```

or:

```text
Relation Memory
```

### Internal name

```text
RWM_clean
```

### Unit

```text
relation-bit steps
```

---

## 2.2 Mode B — Majority-Function n-back

This is the distinctive IQ Coach version.

Each trial is a full masked majority-arrow display, like Component 1.

Example:

```text
Trial t:
5 arrows around centre
3 OUT, 2 IN
latent majority relation = OUT

Trial t+1:
5 arrows
4 IN, 1 OUT
latent majority relation = IN

Trial t+2:
5 arrows
4 OUT, 1 IN
latent majority relation = OUT
```

At 2-back, trial `t+2` is a match because the current majority relation is the same as trial `t`.

### Purpose

Mode B estimates relational WM under uncertainty:

```text
Can the user extract a noisy majority relation,
hold the latent relation over delay,
and compare it with the current majority relation?
```

It combines:

```text
controlled evidence extraction
+ relation classification
+ working-memory updating
+ n-back comparison
+ lure resistance
```

### User-facing name

```text
Frame Memory Plus
```

or:

```text
Relational Memory Under Pressure
```

### Internal name

```text
RWM_uncertain
```

### Unit

Use a fitted capacity estimate, not direct bits/sec:

```text
fitted relational WM-under-uncertainty capacity
```

Internally compute demand from:

```text
H_extract / ET
+ H_relation × n
+ lure pressure
+ wrapper shift
```

---

# 3. Stimulus families

Use the same six wrappers as Component 1.

## 3.1 Absolute wrappers

| Wrapper    | Internal ID | Categories              |
| ---------- | ----------- | ----------------------- |
| Horizontal | `abs_lr`    | left / right            |
| Vertical   | `abs_ud`    | up / down               |
| Diagonal   | `abs_diag`  | diagonal A / diagonal B |

## 3.2 Polar wrappers

| Wrapper    | Internal ID  | Categories                 |
| ---------- | ------------ | -------------------------- |
| Radial     | `rel_inout`  | out / in                   |
| Tangential | `rel_cwccw`  | circle right / circle left |
| Spiral     | `rel_spiral` | spiral out / spiral in     |

For Mode A, each trial shows one clear category.

For Mode B, each trial shows a five-arrow majority display.

---

# 4. Trial types

## 4.1 Clean relation-label trial

Used in Mode A.

The display contains a clear exemplar of one category.

Example:

```text
all arrows OUT
```

or a simplified relation icon:

```text
single central relation display
```

The user does not judge a noisy majority. They encode the relation label for later n-back comparison.

### Trial sequence

```text
fixation
→ relation display
→ optional mask
→ response window
→ feedback
→ ITI
```

### User task

```text
Does this relation match the one n-back?
```

Buttons:

```text
Match
No match
```

---

## 4.2 Majority-function n-back trial

Used in Mode B.

The display is exactly like Component 1:

```text
5 arrows
majority ratio: 5:0, 4:1, or 3:2
brief exposure
mask
latent majority category
```

### Trial sequence

```text
fixation
→ masked majority-arrow display
→ response window
→ feedback
→ ITI
```

### User task

```text
Does the current majority relation match the one n-back?
```

Buttons:

```text
Match
No match
```

Important: the user is not asked directly:

```text
Which direction is in the majority?
```

Instead, they must infer the current latent majority and compare it with the stored latent majority from `n` trials ago.

---

# 5. n-back adaptive game logic

Use standard adaptive n-back progression.

Each block has a current `n`.

```text
n = 1, 2, 3, 4, ...
```

Start most users at:

```text
1-back
```

After a tutorial or successful calibration, allow progression to:

```text
2-back
```

## 5.1 Block size

Recommended MVP:

```text
20 + n trials per block
```

This preserves the usual n-back logic where early trials are not fully scorable until enough prior trials exist.

Alternative shorter mobile block:

```text
16 + n trials
```

Use 20+n for standard sessions and 16+n for quick sessions.

## 5.2 Scored trials

A trial becomes scorable only when:

```text
trial_index > n
```

For earlier trials:

```text
warm-up / buffer trials
```

Do not count these in accuracy.

---

# 6. Adaptive level rules

Use block-level adaptation.

## 6.1 Primary adaptive rule

After each block:

```text
if balanced_accuracy >= 85%
and false_alarm_rate <= 20%
and miss_rate <= 20%:
    increase n by 1

else if balanced_accuracy >= 70%
and balanced_accuracy < 85%:
    maintain n

else if balanced_accuracy < 70%:
    decrease n by 1
```

Minimum:

```text
n = 1
```

Optional later maximum for MVP:

```text
n = 5
```

Internally allow higher values later, but cap visible levels for first release.

## 6.2 Stricter Jaeggi-style alternative

For a classic block-error rule:

```text
if errors <= 2:
    increase n by 1

if errors >= 6:
    decrease n by 1

otherwise:
    maintain n
```

Use this only if block sizes are fixed and target/no-target ratios are tightly controlled.

## 6.3 Recommended IQ Coach rule

Use the accuracy-band rule for MVP because it is easier to combine with lures, majority ratios and wrapper shifts.

```text
85%+ = go up
70–84% = maintain
<70% = drop
```

But require false-alarm and miss-rate checks so users cannot progress by overusing one response.

---

# 7. Target / non-target balance

Each block should contain controlled proportions of:

```text
match trials
non-match trials
lure trials
```

Recommended starting proportions:

| Trial type | Proportion |
| ---------- | ---------: |
| Match      |        30% |
| Non-match  |        50% |
| Lure       |        20% |

Do not let match frequency drift too far from 30–40%, otherwise users can exploit response bias.

Use balanced accuracy and d-prime-like indices internally.

---

# 8. Lure types

Lures are essential because this layer should measure interference control, not simple familiarity.

## 8.1 Wrong-lag lure

The current relation matches a recent item, but not the correct n-back item.

Example at 2-back:

```text
OUT → IN → IN
```

The current `IN` matches 1-back, not 2-back.

Correct answer:

```text
No match
```

## 8.2 Same wrapper, wrong relation

Example:

```text
rel_inout:
OUT at t
IN at t+n
```

The wrapper is the same but the relation is wrong.

## 8.3 Same relation, wrong wrapper

Used later in mixed-wrapper training.

Example:

```text
t:
OUT

t+n:
SPIRAL OUT
```

Depending on task rule, this may be a no-match because the wrapper differs, or a higher-level match if the app is explicitly training abstract “outwardness”.

This must be controlled by task mode.

## 8.4 Majority ambiguity lure

Used in Mode B.

The current majority is close:

```text
3:2 ratio
```

and the majority category is opposite to a recent strong majority.

Example:

```text
t:
5 OUT, 0 IN

t+n:
3 IN, 2 OUT
```

This tests whether the user updates the latent relation rather than relying on the strongest recent memory.

## 8.5 Response-mapping lure

The visual direction is similar but the relational category differs.

Example:

```text
an arrow on the left side pointing right = IN
an arrow on the right side pointing right = OUT
```

This is especially important for polar n-back because it prevents absolute-direction recoding.

---

# 9. Adaptive demand ladder

Do not increase all difficulty parameters at once.

The preferred ladder is:

```text
1. Increase n
2. Add lure pressure
3. Add wrapper variation
4. Reduce exposure time
5. Reduce majority ratio
6. Mix wrappers
```

However, for Mode B, perceptual difficulty must remain calibrated against Component 1.

## 9.1 Mode A ladder: Clean Polar n-back

Mode A should adapt mainly through memory demand:

```text
n level
relation alphabet size
lure pressure
wrapper mixing
```

Progression:

```text
binary radial only
→ binary tangential only
→ binary spiral only
→ mixed polar wrappers
→ absolute + polar mixed wrappers
```

## 9.2 Mode B ladder: Majority-Function n-back

Mode B should adapt through both evidence extraction and memory demand.

Progression:

```text
long exposure, 5:0, 1-back
→ 4:1, 1-back
→ 3:2, 1-back
→ 5:0, 2-back
→ 4:1, 2-back
→ 3:2, 2-back
→ lures
→ wrapper mixing
```

A user should not be pushed to 3:2 at high n until they have a stable C-Control estimate for that wrapper.

---

# 10. Relationship to Component 1 scoring

Component 1 gives:

```text
C_abs
C_rel
bits/sec
wrapper-specific thresholds
timing quality
```

Component 2 should use those estimates to set the starting perceptual difficulty.

## 10.1 Starting exposure time

For each wrapper:

```text
starting_ET = ET_at_75_percent_accuracy_from_Component_1
```

Then add a safety margin:

```text
Mode A:
use comfortable exposure or no majority uncertainty

Mode B:
use ET slightly easier than threshold at first
```

Example:

```text
if rel_inout threshold = 160 ms
start majority n-back at 200–240 ms
```

This prevents the task from being impossible because it combines extraction and memory demands too early.

## 10.2 Component separation

Do not report Mode B as bits/sec.

Report:

```text
Frame Bandwidth = bits/sec from Component 1
Frame Memory = n-back capacity from Component 2
```

Keep the constructs separate.

---

# 11. Measurement model

## 11.1 Clean polar n-back load

For Mode A:

```text
RWM_clean_load = H_relation × n
```

Examples:

```text
IN/OUT only:
H_relation = 1 bit

2-back:
1 × 2 = 2 relation-bit steps
```

```text
IN, OUT, CIRCLE RIGHT, CIRCLE LEFT:
H_relation = 2 bits

2-back:
2 × 2 = 4 relation-bit steps
```

```text
six polar categories:
IN, OUT, CIRCLE RIGHT, CIRCLE LEFT, SPIRAL IN, SPIRAL OUT
H_relation = log2(6) = 2.58 bits

3-back:
2.58 × 3 = 7.74 relation-bit steps
```

## 11.2 Majority-function n-back demand

For Mode B:

```text
D_trial =
  H_extract / ET_adjusted
  + α(H_relation × n)
  + β(lure_pressure)
  + γ(wrapper_shift)
```

Where:

```text
H_extract / ET_adjusted
= current perceptual evidence demand

H_relation × n
= memory demand

lure_pressure
= interference demand

wrapper_shift
= transfer / abstraction demand
```

Estimate capacity using a fitted curve:

```text
P(correct) =
chance + usable_range × sigmoid(theta_RWM - D_trial)
```

## 11.3 Response information caution

The standard n-back response is binary:

```text
Match / No match
```

So do not say that the response transmits 4 or 8 bits.

Say:

```text
The trial imposes relation-bit-step demand.
Capacity is estimated from adaptive performance across demand levels.
```

---

# 12. Optional cued-report probes

To estimate relation memory more directly, add sparse cued-report trials.

Example:

```text
What was the relation 2-back?
OUT / IN / CIRCLE RIGHT / CIRCLE LEFT
```

These should be occasional, not the main game.

Use them to compute:

```text
confusion matrix
relation recall accuracy
mutual information between target relation and reported relation
```

This gives a richer research signal while keeping the main game simple.

---

# 13. Horizontal wrapper cycle

Component 2 should reuse the horizontal cycle logic from Component 1.

## 13.1 Absolute n-back cycle

```text
abs_lr
→ abs_ud
→ mix(abs_lr, abs_ud)
→ abs_diag
→ mix(abs_lr, abs_ud, abs_diag)
```

## 13.2 Polar n-back cycle

```text
rel_inout
→ rel_cwccw
→ mix(rel_inout, rel_cwccw)
→ rel_spiral
→ mix(rel_inout, rel_cwccw, rel_spiral)
```

## 13.3 Cross-family mixed phase

Later:

```text
absolute wrappers
+ polar wrappers
```

This tests whether users can maintain the relevant category across changing coordinate systems.

Do not introduce this in the first few sessions.

---

# 14. Wrapper-switch rule

Within each exercise:

```text
train current wrapper
→ detect learning-curve flattening
→ switch to next wrapper
→ expect temporary dip
→ train until positive learning curve returns
→ mix old + new
→ train until mixed curve flattens
→ add next wrapper
```

Use the same flattening criteria as Component 1:

```text
recent slope near zero
accuracy stable in training band
minimum trials reached
confidence acceptable
```

For n-back, also require:

```text
false alarms not excessive
misses not excessive
n level stable or improving
```

---

# 15. Session structure

## 15.1 First n-back onboarding session

```text
1. Quick reminder: relation categories
2. Mode A tutorial: clean 1-back
3. Mode A block: radial clean n-back
4. Result: Frame Memory starting level
5. Short Mode B demo: majority n-back, easy 5:0 only
```

Duration:

```text
5–7 minutes
```

## 15.2 Standard Component 2 session

```text
1. Warm-up clean n-back: 1 block
2. Main adaptive n-back block: 2–3 blocks
3. Majority-function n-back block: 1–2 blocks
4. Result screen
```

Duration:

```text
6–10 minutes
```

## 15.3 Short daily version

```text
1 clean n-back block
1 majority n-back block
result screen
```

Duration:

```text
3–5 minutes
```

---

# 16. User-facing outputs

Show after each session:

```text
Frame Memory level
Majority Memory level
Best n-back level
Current training band
Wrapper status
Lure resistance
```

Example:

```text
Frame Memory: 2-back stable
Majority Memory: 1-back stretch
Best wrapper: Out/In
Working wrapper: Circle Right/Left
Lure Resistance: improving
Next: continue circle-direction memory
```

For a more technical results panel:

```text
RWM_clean: 4.0 relation-bit steps
RWM_uncertain: standard band at 2-back / 4:1
Current n: 2
False alarms: low
Misses: moderate
```

Do not show:

```text
IQ score
flow state
brain state
clinical interpretation
```

---

# 17. UI flow

## 17.1 Component card

Title:

```text
Frame Memory
```

Subtitle:

```text
Hold and compare visual relations across time.
```

Buttons:

```text
Start today’s memory block
Review relation categories
View progress
```

## 17.2 Tutorial copy

Clean n-back:

```text
You will see a stream of arrow relations.
Tap Match if the current relation is the same as the one n steps back.
Tap No Match if it is different.
```

Majority n-back:

```text
Now each display contains five arrows.
First work out the majority relation.
Then decide whether it matches the one n steps back.
```

## 17.3 Task screen

Must include:

```text
central stimulus area
two large buttons: Match / No Match
subtle n-level indicator
progress ring or block progress
sound toggle
brief feedback pulse
```

Do not show the current answer category during the task.

---

# 18. Feedback

Use immediate feedback.

Correct:

```text
soft pulse
small positive tone
```

Incorrect:

```text
brief red flash
short low error sound
optional tiny shake
```

Allow users to disable sound.

For repeated errors, use a micro-hint:

```text
Watch the relation, not the screen direction.
```

or:

```text
That matched a recent item, but not the n-back item.
```

Use hints sparingly.

---

# 19. Data model

## 19.1 Tables

```text
nback_sessions
nback_blocks
nback_trials
nback_estimates
nback_wrapper_states
nback_adaptive_events
```

## 19.2 Trial fields

```text
id
user_id
session_id
block_id
trial_index
mode                         // clean_relation | majority_function
exercise_type                 // absolute | relative | mixed
wrapper_id                    // abs_lr | abs_ud | abs_diag | rel_inout | rel_cwccw | rel_spiral
n_level
is_scorable
target_relation
current_relation
nback_relation
trial_type                    // match | nonmatch | lure | buffer
lure_type
majority_ratio                // null for clean mode
exposure_ms_requested
exposure_ms_actual
mask_ms
response
correct_response
is_correct
rt_ms
feedback_type
frame_count_expected
frame_count_observed
timing_quality
created_at
```

## 19.3 Block fields

```text
id
user_id
session_id
mode
wrapper_id
n_level_start
n_level_end
n_trials
n_scorable_trials
match_rate
lure_rate
balanced_accuracy
hit_rate
false_alarm_rate
miss_rate
median_rt
level_decision                // up | maintain | down
created_at
```

## 19.4 Estimate fields

```text
id
user_id
session_id
mode
wrapper_id
rwm_capacity
relation_bit_steps
n_level_best
balanced_accuracy
d_prime
lure_false_alarm_cost
majority_memory_capacity
confidence_label
created_at
```

---

# 20. Adaptive functions

Required functions:

```text
generateCleanNBackBlock(userState, wrapperState)
generateMajorityNBackBlock(userState, wrapperState)
selectNLevel(userState, mode, wrapper)
scoreNBackBlock(block)
decideNBackLevel(blockScore)
updateNBackWrapperState(wrapperState, blockScore)
detectNBackFlattening(wrapperState)
detectNBackRecovery(wrapperState)
chooseNBackWrapperMix(exerciseState)
computeRelationBitSteps(relationAlphabet, n)
computeMajorityNBackDemand(trial)
```

---

# 21. Pseudocode: level decision

```text
function decideNBackLevel(blockScore):

    if blockScore.scorableTrials < minimumScorableTrials:
        return "maintain"

    if blockScore.balancedAccuracy >= 0.85
       and blockScore.falseAlarmRate <= 0.20
       and blockScore.missRate <= 0.20:
        return "up"

    if blockScore.balancedAccuracy < 0.70:
        return "down"

    return "maintain"
```

Then:

```text
if decision == "up":
    n = n + 1

if decision == "down":
    n = max(1, n - 1)

if decision == "maintain":
    n = n
```

---

# 22. Pseudocode: majority n-back generation

```text
function generateMajorityNBackBlock(config):

    n = config.nLevel
    wrapper = config.wrapper
    ratioSchedule = config.ratios
    targetMatchRate = 0.30
    targetLureRate = 0.20

    relations = getRelationsForWrapper(wrapper)

    trials = []

    for trialIndex in 1 to blockLength:

        if trialIndex <= n:
            relation = sampleRelationBalanced(relations)
            trialType = "buffer"

        else:
            trialType = chooseTrialType(targetMatchRate, targetLureRate)

            if trialType == "match":
                relation = trials[trialIndex - n].targetRelation

            if trialType == "nonmatch":
                relation = sampleDifferentRelation(trials[trialIndex - n].targetRelation)

            if trialType == "lure":
                relation = generateLureRelation(trials, trialIndex, n)

        ratio = selectRatio(config, userState)
        arrows = generateMajorityArrowDisplay(wrapper, relation, ratio)

        trials.append({
            wrapper,
            n,
            relation,
            ratio,
            arrows,
            correctResponse
        })

    return trials
```

---

# 23. MVP build order

```text
1. Reuse Component 1 arrow renderer
2. Add relation-sequence generator
3. Add clean polar 1-back
4. Add clean polar adaptive n-level
5. Add clean polar lures
6. Add clean polar wrapper cycle
7. Add majority-function 1-back
8. Add majority-function adaptive n-level
9. Add majority ratios and masks
10. Add majority-function lures
11. Add result screen
12. Add relation-bit-step scoring
13. Add wrapper recovery metrics
14. Add persistence and progress history
```

---

# 24. MVP exclusions

Do not include yet:

```text
Gabor patches
optic flow
SR path prediction
verbal reasoning bridge
Mission Arena puzzles
HRV
Zone states
flow labels
clinical claims
IQ increase claims
```

Component 2 should stay focused:

```text
arrow relation n-back capacity
```

---

# 25. Claims boundary

The app may say:

```text
Frame Memory trains holding and comparing visual relations over time.
Majority Memory adds uncertainty: first extract the majority relation, then compare it with the relation n-back.
The task adapts the n-back level so you train near your current capacity.
```

Do not say:

```text
This raises IQ.
This proves far transfer.
This detects flow.
This diagnoses working-memory impairment.
```

---

# 26. Final MVP summary

Component 2 extends the arrow-based C-Control layer into adaptive n-back capacity training.

It contains:

```text
Clean Polar n-back:
relation labels across delay
output = relation-bit-step capacity

Majority-Function n-back:
masked majority displays across delay
output = relational WM under uncertainty

Adaptive logic:
85%+ = increase n
70–84% = maintain
<70% = drop n

Horizontal cycle:
train wrapper until flattening
switch wrapper
recover learning curve
mix wrappers
repeat

Core outputs:
Frame Memory
Majority Memory
Best n-back level
relation-bit steps
lure resistance
wrapper recovery
```

This gives IQ Coach a coherent second layer:

```text
Component 1:
extract the majority relation now

Component 2:
hold and compare the majority relation across time
```
---
**the MFT-style majority n-back gives a cleaner *processing-load* metric than a standard clean n-back**, but it does **not** give a cleaner pure WM-storage metric.

I would frame it like this:

```text
Clean relation n-back
= cleaner WM maintenance metric

MFT / majority-function n-back
= cleaner WM-processing-under-uncertainty metric
```

The key reason is that the MFT-M already has a principled information-rate logic: it estimates cognitive-control capacity by varying information load and exposure time, with Wu et al. reporting CCC around 3–4 bits/sec in the original masked majority-function task. ([PubMed][1]) The adaptive MFT-M paper then shows that the same kind of capacity estimate can be administered more efficiently using CAT-style adaptive selection rather than a long fixed schedule. ([PubMed][2]) Chen et al. also describe the MFT-M as theoretically independent of short- and long-term memory requirements, which is exactly why adding n-back creates a separable WM-processing layer on top of the C-Control baseline. ([Nature][3])

## The distinction

### Clean polar n-back

Example:

```text
OUT → IN → OUT
```

At 2-back, this is a match.

This gives a clean estimate of:

```text
relation maintenance
updating
n-back matching
```

The load is:

```text
H_relation × n
```

So if the relation alphabet is:

```text
OUT / IN
```

then:

```text
H_relation = 1 bit
2-back = 2 relation-bit steps
```

That is clean for **WM maintenance**, but it lacks the MFT-style controlled-evidence component.

### MFT / majority-function n-back

Example:

```text
Trial 1: 5 arrows, 3 OUT / 2 IN → latent relation OUT
Trial 2: 5 arrows, 4 IN / 1 OUT → latent relation IN
Trial 3: 5 arrows, 3 OUT / 2 IN → latent relation OUT
```

At 2-back, Trial 3 is a match.

This gives a cleaner metric for **WM processing bits** because each trial has a quantifiable evidence-extraction demand before the n-back comparison:

```text
extract the latent majority relation
→ hold it across delay
→ compare it with current latent relation
→ reject lures
```

The demand model becomes:

```text
D_trial =
  H_extract / ET_adjusted
  + α(H_relation × n)
  + β(lure pressure)
  + γ(wrapper shift)
```

That is more informative than plain n-back because you can separate:

```text
C-Control / evidence extraction
from
relation maintenance across n
from
interference/lure resistance
```

## But do not call it pure “WM bits/sec”

I would avoid saying:

```text
MFT n-back directly measures working-memory bits/sec
```

That would be too strong, because a standard n-back response is still usually binary:

```text
Match / No match
```

So the response itself does not transmit all the relation information. Better wording:

```text
MFT n-back estimates working-memory processing capacity under quantified perceptual information load.
```

or:

```text
MFT n-back gives a fitted WM-processing capacity based on relation-bit-step demand plus evidence-extraction demand.
```

## Best metric set

I would use three separate numbers:

| Layer                           | Task                  | Metric          | Unit                  |
| ------------------------------- | --------------------- | --------------- | --------------------- |
| Evidence extraction             | Polar MFT-M           | `C_rel`         | bits/sec              |
| Clean relation maintenance      | Clean polar n-back    | `RWM_clean`     | relation-bit steps    |
| WM processing under uncertainty | MFT / majority n-back | `RWM_uncertain` | fitted capacity index |

For the third one, you can report a user-friendly score:

```text
Majority Memory: 2-back at 4:1, standard band
```

and internally compute:

```text
RWM_uncertain =
fitted θ from D_trial =
H_extract / ET + H_relation × n + lure pressure
```

## Practical conclusion

So, yes: **the MFT version is the cleaner route if what you want is “WM processing bits” rather than simple n-back level**.

But the clean architecture is:

```text
1. Polar MFT-M
   = Frame Bandwidth / C_rel / bits/sec

2. Clean polar n-back
   = relation maintenance / relation-bit steps

3. MFT majority n-back
   = WM processing under uncertainty / fitted capacity
```

In product terms:

```text
Frame Bandwidth tells you how fast the relation can be extracted.
Frame Memory tells you how well the relation can be held.
Majority Memory tells you how well the relation can be extracted and held under noisy, time-limited conditions.
```

That third metric is probably the most Trident-G distinctive, but it should sit **on top of** the first two, not replace them.

[1]: https://pubmed.ncbi.nlm.nih.gov/27659950/?utm_source=chatgpt.com "The Capacity of Cognitive Control Estimated From a ... - PubMed"
[2]: https://pubmed.ncbi.nlm.nih.gov/34165352/?utm_source=chatgpt.com "Adaptive assessment of the capacity of cognitive control"
[3]: https://www.nature.com/articles/s41598-019-39685-2?utm_source=chatgpt.com "Testing a Cognitive Control Model of Human Intelligence"

