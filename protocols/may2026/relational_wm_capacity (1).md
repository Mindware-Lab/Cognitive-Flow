



# CCC (bits/second) extended in working memory

We could extend the CCC estimation logic into an **extended workspace-over-time measure**, but it should not be treated as the same construct as MFT-M CCC.

The clean distinction is:

```text
MFT-M CCC
= how much task-relevant information can be processed per second under cognitive-control demand.

n-back workspace capacity
= how much task-relevant information can be encoded, held, updated, retrieved and compared across time.
```

So the n-back version would be closer to an **active workspace bandwidth / temporal workspace capacity** measure.

## 1. Why the extension is plausible

The MFT-M estimates CCC by manipulating:

```text
information load
÷
exposure time
=
required information-processing rate in bits/second
```

The original MFT-M varies majority/minority ratios and exposure times, then models accuracy as the required information-processing rate approaches or exceeds the person’s capacity.  The adaptive MFT-M-R uses the same general principle but selects more informative conditions and updates the CCC estimate more efficiently, using exposure times of 0.25, 0.5, 1 and 2 seconds and majority/minority ratios of 3:2, 4:1 and 2:1. 

An n-back extension would add a second dimension:

```text
information-processing rate
+
temporal workspace load
```

That temporal load comes from needing to hold the majority feature or relation across 1-back, 2-back, 3-back, etc.

## 2. The simple version: workspace load in bit-trials

For a Gabor majority n-back, first define the information in the feature being tracked.

Example:

```text
majority direction has 8 possible bins
H_direction = log2(8) = 3 bits

spacing has 4 possible bins
H_spacing = log2(4) = 2 bits

luminance has 4 possible bins
H_luminance = log2(4) = 2 bits
```

Then the n-back workspace load can be approximated as:

```text
workspace load = feature information × n-back level
```

So:

```text
1-back direction:
3 bits × 1 = 3 bit-trials

2-back direction:
3 bits × 2 = 6 bit-trials

3-back direction:
3 bits × 3 = 9 bit-trials
```

If the task requires an association, such as direction + spacing:

```text
H_pair = H_direction + H_spacing
       = 3 + 2
       = 5 bits
```

Then:

```text
2-back direction–spacing association:
5 bits × 2 = 10 bit-trials
```

This would give a simple **workspace span score**:

```text
maximum stable workspace load
=
highest bit-trial load sustained above criterion accuracy
```

For example:

```text
stable at 2-back with direction + spacing
but not stable at 3-back

workspace estimate ≈ 10 bit-trials
```

## 3. Add time: bit-seconds

If you know the trial spacing, you can convert this into a time-based measure:

```text
temporal workspace load
=
feature information × n-back level × trial interval
```

Example:

```text
H_pair = 5 bits
n = 2
trial interval = 2 seconds

temporal workspace load
= 5 × 2 × 2
= 20 bit-seconds
```

This is not “bits per second”. It is more like:

```text
how much structured information can be kept active across time
```

That may actually be more appropriate for a workspace measure.

## 4. A fuller model: Extended Workspace Capacity

A more formal model could estimate an individual latent parameter, call it:

```text
EWC = Extended Workspace Capacity
```

or:

```text
TWC = Temporal Workspace Capacity
```

For each trial condition, define:

```text
H_extract = perceptual majority-search information
H_feature = feature value information
H_binding = association or conjunction information
n = n-back level
T = trial interval / retention interval
L = lure/interference pressure
ET = exposure time
```

Then the total demand could be modelled as:

```text
D = perceptual_rate + workspace_load + lure_load
```

where:

```text
perceptual_rate = H_extract / ET

workspace_load = n × H_feature

or, time-weighted:

workspace_load_time = n × H_feature × T

lure_load = weighted penalty for recent-but-wrong matches
```

Then accuracy can be fitted with a psychometric or item-response-style model:

```text
P(correct)
=
chance + usable_accuracy_range × sigmoid(EWC - D)
```

In plain English:

```text
If task demand is below the person’s workspace capacity,
accuracy stays high.

If task demand exceeds capacity,
accuracy falls toward chance.
```

This mirrors the MFT-M logic, where accuracy declines as information rate exceeds CCC. The difference is that the n-back model includes **memory horizon and interference**, not just exposure-limited perceptual control.

## 5. Best model: separate CCC and workspace parameters

The strongest version would not collapse everything into one number. It would estimate at least two latent parameters:

```text
C_control
= perceptual-control bandwidth, close to MFT-M CCC

W_workspace
= active workspace load tolerated across n-back levels

I_lure
= susceptibility to interference/lures
```

A compact model might look like:

```text
P(correct)
=
f(
  C_control - perceptual_rate,
  W_workspace - n × H_feature,
  I_lure - lure_pressure
)
```

This matters because two users could have the same CCC but different workspace profiles:

```text
User A:
fast perceptual control, weak temporal maintenance

User B:
moderate perceptual control, strong n-back maintenance

User C:
good at 1-back, collapses under lure interference

User D:
good memory span, but poor majority extraction under speed
```

For IQ Mindware, that is useful because it supports a richer profile than one global score.

## 6. Adaptive computation

The adaptive version could work like CAT:

```text
1. Start with easy majority discrimination.
2. Estimate perceptual-control bandwidth.
3. Move to 1-back.
4. Select the next trial condition near the user’s current estimated threshold.
5. Vary one thing at a time:
   - n-level
   - feature entropy
   - exposure time
   - association load
   - lure pressure
6. Update posterior estimate after each trial or block.
7. Stop when the estimate stabilises.
```

The MFT-M-R paper shows that adaptive condition selection can substantially reduce administration length while retaining meaningful correlation with the original MFT-M estimate.  That gives a methodological precedent for doing the same with an n-back workspace task.

## 7. Product-facing interpretation

For Zone Coach:

```text
CCC / cognitive bandwidth
=
how much controlled information you can process per second right now
```

For the n-back extension:

```text
Workspace horizon
=
how much structured information you can hold, update and compare across time
```

Together:

```text
cognitive bandwidth
+
workspace horizon
=
active cognitive capacity profile
```

## Bottom line

Yes, you could extend the formal CCC idea into an n-back-based **workspace-over-time** measure.

The simplest computable score is:

```text
Workspace Load = feature bits × n-back level
```

The better score is:

```text
Temporal Workspace Load = feature bits × n-back level × retention time
```

The strongest scientific version is a fitted model estimating:

```text
perceptual-control bandwidth
+
active workspace capacity
+
lure/interference resistance
```

That would preserve the appeal of CCC as an objective bits/sec measure while adding the extra thing n-back gives you: **how well cognitive control can sustain structured information across time, not just process it in the moment.**


**Relational WM Capacity**

Idea: whatt about defining wm capacity (taking a hippocampal-episodic view) in terms of RELATIONS of bits? I assume that this is one tradition in understanding working memory capacity? How might we do this in the task, both interms of artibrary association binding, and relational binding for SR representations - could there be a generic way of doing this using concepts I've developed so far, adapting the gabor path stimuli for majority function n-backs on the 3 dimenions (assuming all this is presemantic/pre-global workspace, which I assume is closer to the hippocampal SR/cognitive maps)



There is a serious tradition in which working-memory capacity is understood less as “how many items can you hold?” and more as **how many bindings, relations, or relational dimensions can be maintained and processed at once**.

Halford’s relational-complexity theory explicitly argues that working-memory limits are best defined by the complexity of relations processed in parallel, where complexity depends on the number of related dimensions or arguments in the relation. ([Cambridge University Press & Assessment][1]) Oberauer’s binding account is even closer to your idea: WM capacity may specifically limit the maintenance of **temporary bindings**, such as which item occurred with which other item, in which position, or in which context. ([Journal of Cognition][2])

From a hippocampal-episodic angle, the same move is also plausible. The hippocampus has been argued to support relational binding and comparison across space and time, including short-delay and perception-adjacent tasks, not only long-term declarative memory. ([Frontiers][3]) And the successor-representation account treats hippocampal maps as predictive maps: states are represented partly in terms of the future states they tend to lead to. 

So the construct you are reaching for could be:

```text
Relational Workspace Capacity
=
the amount of structured relational information
that can be extracted, bound, maintained, updated and compared
over short temporal horizons.
```

I would not call it simply “WM capacity” at first. I would call it **Relational Workspace Capacity** or **Temporal Relational Workspace Capacity**, and treat it as a new measure built from established traditions.

## The key distinction

Classic item n-back measures something like:

```text
item identity
→ hold over n steps
→ compare current item with previous item
```

Your Gabor majority-function n-back could instead measure:

```text
presemantic feature field
→ extract majority state
→ bind features or relations
→ maintain across n steps
→ compare arbitrary associations or transitions
→ estimate relation capacity over time
```

That gives you two related but distinct measures:

```text
1. Arbitrary Associative Binding Capacity
Can the user bind feature A with feature B across time?

2. Relational / SR Binding Capacity
Can the user track how one state changes into another across time?
```

The first is more episodic-binding-like. The second is more SR / cognitive-map-like.

## Task state space

For the Gabor majority task, define each trial as a presemantic state:

```text
S_t = [θ_t, F_t, L_t]
```

where:

```text
θ_t = majority orientation / direction
F_t = majority spatial frequency / spacing
L_t = majority luminance / clarity
```

Each dimension is discretised into bins for scoring, while still being presented perceptually rather than verbally.

Example:

```text
orientation: 8 bins  → 3 bits
spacing:     4 bins  → 2 bits
luminance:   4 bins  → 2 bits
```

So a full three-feature state has:

```text
H(S) = 3 + 2 + 2 = 7 feature bits
```

But the important thing is not just state bits. It is **relation bits**: how many feature relations, pairings, transitions, or successor predictions have to be held and compared.

## Arbitrary association binding

This tests whether the user can bind unrelated dimensions together.

Example task:

```text
At trial t:
majority orientation = 45°
majority spacing = medium

At trial t+n:
does this orientation belong with the spacing it was paired with before?
```

The relation is not meaningful in itself. It is an arbitrary temporary binding:

```text
θ ↔ F
orientation bound to spacing
```

A simple information score:

```text
H_binding = H(θ) + H(F)
```

If orientation has 8 bins and spacing has 4 bins:

```text
H_binding = log2(8) + log2(4)
          = 3 + 2
          = 5 binding bits
```

Then add the n-back horizon:

```text
binding workspace load = H_binding × n
```

So:

```text
1-back θ↔F = 5 × 1 = 5 binding-bit steps
2-back θ↔F = 5 × 2 = 10 binding-bit steps
3-back θ↔F = 5 × 3 = 15 binding-bit steps
```

This gives a clean behavioural measure:

```text
Arbitrary Binding Capacity
=
highest binding-bit-step load sustained above criterion accuracy.
```

For example, if a user is stable at 2-back θ↔F but unstable at 3-back:

```text
ABC ≈ 10 binding-bit steps
```

This is very close to the temporary-binding tradition in WM, but implemented with presemantic visual variables rather than words, digits, or object labels.

## Relational binding for SR-style representations

Now move from arbitrary pairings to transitions.

Define a transition relation:

```text
R_t = S_t → S_{t+1}
```

or, for n-back:

```text
R_t = S_{t-n} → S_t
```

For a single dimension:

```text
R_t^θ = θ_t - θ_{t-n}
```

So instead of remembering that the majority orientation was “45°”, the user tracks:

```text
orientation changed by +30°
```

That is a relation-between-states.

If there are 8 possible orientation-change bins:

```text
H_relationθ = log2(8) = 3 relation bits
```

If the task combines orientation change and spacing change:

```text
R_t = [Δθ, ΔF]
```

then:

```text
H_relation = H(Δθ) + H(ΔF)
           = 3 + 2
           = 5 relation bits
```

Again, add horizon:

```text
relational workspace load = H_relation × n
```

So:

```text
2-back [Δθ + ΔF] = 5 × 2 = 10 relational-bit steps
```

The key difference from arbitrary binding is:

```text
arbitrary binding:
which features belong together?

relational binding:
what transformation connects one state to another?

SR-style binding:
what future state becomes likely from this state?
```

## SR representation version

For the SR version, define states and successor probabilities.

```text
S_t = current majority-feature state
S_{t+h} = future state after horizon h
```

The relevant information is:

```text
P(S_{t+h} | S_t)
```

A simple SR demand measure is the entropy of the successor distribution:

```text
H_successor = H(S_{t+h} | S_t)
```

Low entropy means the current state strongly predicts a specific successor. High entropy means many future states are possible.

A trial can ask:

```text
Given the current pattern, is this the expected next pattern?
```

or:

```text
Did this state move along the same kind of path as before?
```

The trial’s SR information can also be scored by surprisal:

```text
SR surprisal = -log2 P(S_{t+h} | S_t)
```

So if the observed successor was highly predictable, it carries low surprisal. If it was rare under the learned transition map, it carries high surprisal.

A capacity-like score becomes:

```text
SR Horizon Capacity
=
maximum successor-relation information
the user can track across horizon h
above criterion accuracy.
```

In Trident-G language, this is very nice because it distinguishes:

```text
state extraction
→ arbitrary binding
→ transformation relation
→ successor prediction
→ horizon extension
```

## A generic computation

You could define total task demand as three separable components:

```text
D_total =
perceptual extraction demand
+ associative binding demand
+ relational/SR demand
```

More formally:

```text
D_trial =
H_extract / ET
+ α(H_binding × n)
+ β(H_relation × h)
+ γ(lure pressure)
```

where:

```text
H_extract / ET
= majority-function perceptual-control rate

H_binding × n
= arbitrary association load over n-back horizon

H_relation × h
= transformation or successor-relation load over horizon h

lure pressure
= recent-but-wrong matches, feature swaps, false relational matches
```

Then fit performance with a psychometric model:

```text
P(correct)
=
chance + usable_range × sigmoid(capacity - D_trial)
```

For product and research use, I would estimate separate latent parameters rather than one global score:

```text
C_control
= CCC-like perceptual-control bandwidth in bits/sec

W_bind
= arbitrary binding capacity in binding-bit steps

W_rel
= relational transformation capacity in relation-bit steps

W_SR
= successor-horizon capacity in SR-bit steps

I_lure
= interference / lure susceptibility
```

That gives you a much richer cognitive profile than a single n-back level.

## Concrete task modes

### 1. Majority state n-back

User tracks one majority feature.

```text
Is the current majority orientation the same as 1-back?
```

Measures:

```text
feature-state maintenance
majority extraction
basic n-back updating
```

### 2. Arbitrary association n-back

User tracks feature pairings.

```text
Was this orientation previously paired with this spacing?
```

or:

```text
Does this luminance belong with the orientation from 2-back?
```

Measures:

```text
temporary binding
episodic feature association
binding swap errors
```

This is your hippocampal-episodic binding mode.

### 3. Relational transformation n-back

User tracks changes.

```text
Did the majority orientation change in the same way as before?
```

or:

```text
Did orientation and spacing change together in the same pattern?
```

Measures:

```text
relation-between-states
transformation binding
relational updating
```

This is closer to fluid reasoning and matrix-style transformation tracking.

### 4. SR horizon mode

User tracks reachable future states.

```text
Given this pattern path, is the next pattern expected?
```

or:

```text
Can this state still lead to the target pattern?
```

Measures:

```text
successor prediction
temporal horizon
cognitive-map updating
path-like inference
```

This is the closest to hippocampal SR / cognitive-map logic.

## Presemantic / pre-global workspace issue

Your assumption is basically right, with one important caveat.

Using Gabor patches, majority-feature extraction, random locations, and continuous dimensions makes the task **less semantic and less verbally scaffolded** than ordinary n-back. That should reduce reliance on explicit global-workspace strategies such as “remember the letter B” or “apply the rule verbally”.

But it is not literally outside the global workspace. The user still receives an instruction, makes a conscious same/different judgement, and presses a response. So the safer framing is:

> **The task minimises semantic and verbal recoding, making it closer to presemantic relational-map construction than standard symbolic n-back.**

I would avoid saying:

```text
This directly measures hippocampal SR.
```

Better:

```text
This is a behavioural, presemantic, SR-inspired relational workspace task.
```

That keeps the claims clean while preserving the theoretical link.

## How this fits your Trident-G stack

This gives you a beautiful layered architecture:

```text
Z / Zone Coach
= estimate current cognitive-control bandwidth and readiness

WM-G state mode
= extract and maintain majority-feature states

WM-G arbitrary binding mode
= bind presemantic feature pairs across time

WM-G relational mode
= track transformations between majority states

WM-G SR mode
= track successor-like transitions and horizon structure

PS / Problem Space Inference
= apply the same relational-control operations in explicit puzzles

Meta-epistemic prompts
= later global-workspace handles for the same operations
```

So the presemantic Gabor task becomes the lower-level relational substrate. Puzzle/mindware training then lifts those operations into explicit problem spaces and global-workspace control policies.

## Suggested core metric names

I would use:

```text
CCC
Cognitive Control Capacity
bits/sec
```

for the Zone/MFT-M layer.

Then add:

```text
ABC
Associative Binding Capacity
binding-bit steps

RBC
Relational Binding Capacity
relation-bit steps

SRHC
Successor-Representation Horizon Capacity
SR-bit steps

RWC
Relational Workspace Capacity
composite of ABC + RBC + SRHC
```

A simple composite:

```text
RWC = z(ABC) + z(RBC) + z(SRHC) - z(lure errors)
```

A better research model would estimate these as latent parameters using adaptive trials.

## Bottom line

Yes — defining WM capacity in terms of **relations of bits** is highly compatible with both relational-complexity and temporary-binding traditions in working memory.

For your app, the cleanest formulation is:

> **Relational Workspace Capacity measures how many presemantic feature bindings, transformations, and successor-like relations a user can extract, hold, update and compare across time.**

The Gabor majority-function n-back can implement this generically by moving through four layers:

```text
majority state
→ arbitrary association
→ transformation relation
→ successor horizon
```

That gives you a principled bridge from MFT-M-style CCC to hippocampal-style relational maps, without prematurely claiming direct neural measurement.

[1]: https://www.cambridge.org/core/journals/behavioral-and-brain-sciences/article/processing-capacity-defined-by-relational-complexity-implications-for-comparative-developmental-and-cognitive-psychology/D2388E89B8614A0605D9EE55C6E47F18 "Processing capacity defined by relational complexity: Implications for comparative, developmental, and cognitive psychology | Behavioral and Brain Sciences | Cambridge Core"
[2]: https://journalofcognition.org/articles/10.5334/joc.86 "Working Memory Capacity Limits Memory for Bindings | Journal of Cognition"
[3]: https://www.frontiersin.org/journals/human-neuroscience/articles/10.3389/fnhum.2012.00146/full "Frontiers | The hippocampus supports multiple cognitive processes through relational binding and comparison"

---
##CODING THE TASK##

 **the task itself should be relatively straightforward to code**, especially as a browser-based canvas/WebGL task. The harder part is not coding the stimuli; it is turning the task into a **reliable, interpretable individual-differences measure**.

The coding is straightforward because the core loop is simple:

```text
generate Gabor field
→ compute majority feature state
→ display for controlled duration
→ optionally mask
→ collect Same/Different or Left/Right response
→ score accuracy, RT, lure type, n-level, relation type
→ update difficulty
→ repeat
```

A framework such as **jsPsych** is well suited to this because it is designed for browser-based behavioural experiments using plugins, and its canvas keyboard-response plugin can draw parametrically generated graphics while collecting responses. ([jspsych.org][1]) For tighter visual timing, jsPsych’s documentation specifically recommends the jspsych-psychophysics plugin, citing Kuroki’s plugin for more accurate display duration and stimulus onset asynchrony. ([jspsych.org][2]) PsychoPy/Pavlovia or Gorilla would also be viable, but web timing needs care; PsychoPy’s own documentation notes that timing in web-based experiments is generally poorer than local studies, and Gorilla documents its use of high-resolution timers and frame-counting for online stimulus timing. ([psychopy.org][3])

## Why the task is easy to implement

The stimulus generation can be modular.

```text
orientation θ
spatial frequency F
luminance/contrast L
majority ratio r
set size k
random positions
exposure time ET
mask strength
n-back level n
relation mode
```

Each trial can generate, for example, 5, 7, or 9 patches, with a majority sharing one feature value and the minority carrying lure values. Randomising locations prevents fixed-position strategies. The same engine can produce Zone Coach trials, arbitrary-association n-back trials, relational n-back trials and SR-style transition trials.

A minimal data row would look like:

```text
trial_id
user_id
session_id
mode
orientation_majority
spacing_majority
luminance_majority
majority_ratio
set_size
exposure_time_ms
mask_type
n_level
relation_type
target_answer
user_answer
correct
rt_ms
lure_type
device_refresh_rate
dropped_frame_flag
```

That is all quite manageable.

## Why individual-differences measurement is harder

The original MFT-M’s appeal is that it does not merely give “accuracy”. It estimates CCC by manipulating information entropy and exposure time, then fitting accuracy as a function of required information rate. Wu et al. describe this as estimating cognitive-control capacity in **bits per second**, with typical capacity around **3–4 bps**. ([Nature][4]) The adaptive MFT-M-R study then showed that adaptive trial selection could reduce the original 864-trial, 86-minute task to 216 trials and under 20 minutes while maintaining validity and reliability. ([PubMed][5])

That is the methodological standard to aim for. Your task can be coded quickly, but the measure becomes credible only when you show:

```text
internal consistency
test–retest reliability
stable adaptive estimates
sensitivity to individual differences
low device/timing contamination
expected relation to CCC, WM and reasoning measures
discriminant validity from simple RT or visual acuity
```

## A practical staged build

I would build it in four layers.

### Layer 1: fixed task prototype

Code the basic Gabor majority task first:

```text
orientation majority
spacing majority
luminance majority
3:2 / 4:1 / 5:2 style majority ratios
fixed exposure times
mask
binary response
```

This gives you a Zone Coach-like baseline and lets you check whether users understand the task.

### Layer 2: adaptive CCC-like mode

Add adaptive selection:

```text
majority ratio
set size
exposure time
mask strength
```

Estimate a CCC-like perceptual-control parameter:

```text
C_control = bits/sec estimate
```

This is the closest analogue to MFT-M.

### Layer 3: n-back binding mode

Add n-back:

```text
1-back → 2-back → 3-back
state match
orientation–spacing binding
orientation–luminance binding
spacing–luminance binding
```

Estimate:

```text
ABC = Associative Binding Capacity
```

for arbitrary feature pairings.

### Layer 4: relational / SR mode

Add transition relations:

```text
same change?
same direction of change?
same orientation-spacing transformation?
expected successor state?
```

Estimate:

```text
RBC  = Relational Binding Capacity
SRHC = Successor Horizon Capacity
```

This is the most Trident-G-relevant layer, but it should come after the simpler modes are stable.

## Individual-differences scoring

A first pass can be simple:

```text
capacity score =
highest difficulty level sustained at ≥70–75% balanced accuracy
```

But the better version is model-based:

```text
P(correct) =
chance + usable_range × sigmoid(capacity - demand)
```

where demand can be decomposed as:

```text
D =
H_extract / ET
+ α(H_binding × n)
+ β(H_relation × horizon)
+ γ(lure pressure)
```

That allows separate latent estimates:

```text
C_control  = perceptual control bandwidth
W_bind     = arbitrary binding capacity
W_rel      = relational binding capacity
W_SR       = successor horizon capacity
I_lure     = interference susceptibility
```

This is much more useful than just reporting “2-back level”.

## Key caveats

The main risks are not conceptual; they are psychometric and implementation risks.

First, online timing must be logged carefully. Browser experiments can be good enough for many behavioural tasks, but frame drops, refresh rates and device differences can contaminate short exposure-time estimates. The timing literature on online experiments shows that platforms differ and that precise stimulus timing needs explicit checks rather than assumptions. ([PMC][6])

Second, the Gabor majority task may partly measure low-level visual discrimination unless you include controls for brightness, screen size, contrast, response bias and comprehension.

Third, individual-differences reliability usually requires more trials than a consumer micro-session. A 3-minute Zone Coach can give a useful state estimate, but a research-grade RWC estimate may need multiple sessions or an adaptive stopping rule.

## Bottom line

Yes: **coding the task is relatively straightforward**.

A browser-based prototype could be built quickly using canvas/WebGL, with jsPsych, PsychoJS/Pavlovia, Gorilla, or a custom React/WebGL stack. The scientific work is in calibration and validation.

The best product/research architecture is:

```text
same Gabor majority engine
→ Zone Coach mode for CCC-like cognitive bandwidth
→ associative n-back mode for binding capacity
→ relational n-back mode for transformation capacity
→ SR horizon mode for successor-map capacity
```

That would give you a coherent individual-differences battery: not just “how fast can you process?”, but **how much structured relational information can you extract, bind, update and carry forward over time**.

Yes — I would design this as a **10–20 day progressive WM–CCC training game**, where each session begins with a short straight CCC-style block and then shifts into relational workspace training.

The scientific logic is sound, provided the claim boundary stays careful. MFT-M is attractive because it estimates cognitive-control capacity in **bits/sec** by manipulating information load and exposure time, with published estimates around **3–4 bps** in healthy adults. ([Nature][1]) The adaptive MFT-M-R also shows that computerised adaptive testing can shorten the task substantially while preserving meaningful validity and reliability, which supports the idea of an adaptive game engine. ([Sage Journals][2]) But ordinary WM training alone has weak evidence for broad far transfer, so the training game should embed WM load inside your wider transfer architecture: wrapper swaps, relational invariants, prompts, delayed probes and niche missions. ([Sage Journals][3])

## Core session structure: 10–15 minutes

Each session could have four parts:

```text
1. Zone / CCC calibration block      2–3 min
2. WM–CCC training block             7–9 min
3. Transfer prompt / micro-mission   1–2 min
4. Delayed cue / next-session hook   30–60 sec
```

The first block gives a daily **cognitive bandwidth** estimate. The second block trains the active workspace. The third block turns the implicit skill into a portable control policy. The fourth block sets up delayed reuse.

## Core adaptive variables

The task should adapt along five dimensions, but not all at once.

| Variable                  | Function                                | Use in training                                 |
| ------------------------- | --------------------------------------- | ----------------------------------------------- |
| **Speed / exposure time** | Increases bits/sec demand               | CCC block first, later robustness stressor      |
| **Discrimination gap**    | Makes feature differences subtler       | Secondary perturbation after relation is stable |
| **n-back level**          | Extends temporal workspace horizon      | Main WM progression                             |
| **Binding load**          | Adds arbitrary feature associations     | Episodic/hippocampal-style binding              |
| **Relational load**       | Adds transformation / SR-style tracking | Main far-transfer target                        |

A useful rule:

```text
Primary target = relation stability
Secondary stressors = speed and discrimination
```

So speed and discrimination should not simply make the game harder. They should test whether the learner can recover the same relation when the evidence becomes faster, subtler or less redundant.

## Adaptive rule

Use a near-critical training band rather than a simple “always harder” staircase.

```text
Target band:
70–82% balanced accuracy
RT stable
lure errors not exploding

If >85% for two mini-blocks:
change one variable only.

If 60–70%:
hold difficulty and repeat with a light wrapper change.

If <60%:
reduce speed, widen discrimination gap, or drop n-level.

If stable for 2–3 blocks:
force a breakpoint by changing wrapper, feature dimension or relation type.
```

This matches the Trident-G idea that the aim is not smooth task automation, but **controlled re-entry after local strategy disruption**.

## 10-day progression

This would be the minimal training arc.

| Day | Main game target                                                | Adaptive variable     | Transfer principle           |
| --: | --------------------------------------------------------------- | --------------------- | ---------------------------- |
|   1 | Straight majority-function CCC block                            | Speed / exposure time | Baseline cognitive bandwidth |
|   2 | Majority discrimination across orientation, spacing, luminance  | Discrimination gap    | Variable abstraction         |
|   3 | 1-back majority state tracking                                  | n = 1                 | Active workspace entry       |
|   4 | 1-back arbitrary association: orientation ↔ spacing             | Binding load          | Episodic feature binding     |
|   5 | 2-back arbitrary association                                    | n = 2                 | Temporal workspace extension |
|   6 | 1-back relational change: “same change or break?”               | Relation type         | Transformation tracking      |
|   7 | 2-back relational change                                        | n + relation          | Relational binding over time |
|   8 | Wrapper swap: new Gabor path surface, colour, density or layout | Wrapper variation     | Horizontal transfer          |
|   9 | SR-style path: “can this state still lead to the target?”       | Successor horizon     | Predictive map / SR training |
|  10 | Mixed delayed probe: CCC + untrained wrapper + prompt           | Transfer test         | Slow Gc candidate check      |

Typical progress may be: Day 1 should feel like Zone Coach. Days 2–5 build the workspace substrate. Days 6–9 are where the task becomes genuinely Trident-G rather than n-back. Day 10 tests whether the trained relation survives a new surface.

## 20-day progression

The 20-day version would be much stronger because it allows consolidation, breakpoint recovery and delayed testing.

| Phase                                      |  Days | Main aim                                          | What changes                                                        |
| ------------------------------------------ | ----: | ------------------------------------------------- | ------------------------------------------------------------------- |
| **Phase 1: Calibrate and carve variables** |   1–4 | Establish CCC baseline and feature discrimination | Speed, orientation, spacing, luminance                              |
| **Phase 2: Build binding capacity**        |   5–8 | Train arbitrary association binding               | θ↔F, θ↔L, F↔L, then 2-back                                          |
| **Phase 3: Build relational capacity**     |  9–12 | Track transformations between majority states     | Same-change, broken-change, conjunctions                            |
| **Phase 4: Force portability**             | 13–16 | Recover invariant across wrappers                 | New Gabor path surfaces, colour themes, noise, density              |
| **Phase 5: SR horizon and niche transfer** | 17–20 | Link task relation to real-world control policy   | Successor predictions, prompts, implementation cues, delayed probes |

## Example 20-day day-by-day version

| Day | Session focus                   | Game form                                                        |
| --: | ------------------------------- | ---------------------------------------------------------------- |
|   1 | CCC baseline                    | Majority direction, adaptive speed                               |
|   2 | Discrimination calibration      | Orientation and spacing gaps                                     |
|   3 | Multi-feature majority          | Orientation / spacing / luminance cued blocks                    |
|   4 | Speed × discrimination boundary | Find stable Ψ-band training range                                |
|   5 | 1-back state                    | Same majority feature as previous trial                          |
|   6 | 1-back association              | Was this orientation paired with this spacing?                   |
|   7 | 2-back association              | Same feature-pair from two trials ago?                           |
|   8 | Lure-resistance block           | Recent-but-wrong pairings                                        |
|   9 | 1-back transformation           | Did the majority change the same way?                            |
|  10 | 2-back transformation           | Same change relation across a gap                                |
|  11 | Cross-feature transformation    | Orientation change → spacing change                              |
|  12 | Conjunction relation            | Orientation + spacing must both preserve relation                |
|  13 | Wrapper swap 1                  | Same relation, new Gabor path layout                             |
|  14 | Wrapper swap 2                  | Same relation, lower clarity / changed colour theme              |
|  15 | Breakpoint day                  | Sudden surface perturbation after local stability                |
|  16 | Recovery day                    | Faster recovery of the invariant                                 |
|  17 | SR path mode                    | Which state is reachable from this one?                          |
|  18 | SR horizon extension            | 2-step path / successor prediction                               |
|  19 | Niche prompt day                | “Which feature changed?” / “Can this path still reach the goal?” |
|  20 | Delayed transfer probe          | Untrained wrapper + reasoning/puzzle micro-task                  |

## What the game is actually training

The progression should move through four increasingly abstract capacities:

```text
1. CCC / bandwidth
How much controlled visual information can be processed per second?

2. Associative binding
Can feature A be bound to feature B across time?

3. Relational binding
Can a transformation between states be held and compared?

4. SR horizon
Can the learner track which states lead to which later states?
```

The hippocampal/SR framing is especially useful for the later phases. The successor-representation account treats the hippocampus as a predictive map, representing states partly in terms of their likely future states rather than as isolated present inputs. ([PubMed][4]) So the final phase should not just ask, “is this the same as before?” It should ask, in presemantic form:

```text
Given this pattern path, what comes next?
Can this state still reach the target?
Did the path relation survive the wrapper swap?
```

## User-facing game progression

The user does not need to see “CCC”, “SR”, “ψ-band” or “relational binding”. The game could expose simple level names:

| Internal construct  | User-facing level name     |
| ------------------- | -------------------------- |
| CCC baseline        | **Find Your Flow Speed**   |
| Discrimination      | **Spot the Signal**        |
| State n-back        | **Hold the Pattern**       |
| Association binding | **Pair the Pattern**       |
| Relational binding  | **Track the Change**       |
| Wrapper transfer    | **New Surface, Same Rule** |
| SR horizon          | **Follow the Path**        |
| Delayed probe       | **Return Test**            |

## Scoring system

Avoid a single global score. Use four internal scores:

```text
C-Control
= bits/sec estimate from majority-function block

A-Bind
= highest arbitrary association load sustained

R-Bind
= highest transformation relation load sustained

S-Horizon
= highest successor/path horizon sustained
```

A simple game-facing score could be:

```text
Today’s Training Band:
Stable / Stretch / Overloaded

Progress:
Bandwidth
Binding
Change Tracking
Path Prediction
```

Internally, you can compute:

```text
C_control = estimated bits/sec

A_bind = max(H_binding × n) at criterion accuracy

R_bind = max(H_relation × n) at criterion accuracy

S_horizon = max(SR surprisal or successor-load × horizon) at criterion accuracy
```

## Transfer layer after each session

This is where the game stops being ordinary WM training.

After the training block, give one compact meta-epistemic prompt:

| Session type      | Prompt                                                      |
| ----------------- | ----------------------------------------------------------- |
| Discrimination    | “Which feature changed?”                                    |
| Binding           | “What belongs with what?”                                   |
| Relational change | “What stayed the same beneath the change?”                  |
| SR path           | “Can this path still reach the goal?”                       |
| Wrapper swap      | “What is the same rule in the new surface?”                 |
| Breakpoint        | “What failed: the surface strategy or the deeper relation?” |

Then add a tiny implementation intention:

```text
If I feel stuck today,
then I will ask:
“What feature actually changed?”
```

or:

```text
If a task becomes confusing,
then I will look for:
state → change → next possible state.
```

Implementation intentions have strong evidence as a cue-to-action deployment method, with a meta-analysis reporting a medium-to-large effect on goal attainment. ([kops.uni-konstanz.de][5]) That makes them a good fit for your niche-transfer layer.

## Concrete 15-minute session example

```text
Minute 0–1
Readiness check / instruction.

Minute 1–3
Straight CCC block:
majority direction under adaptive exposure time.

Minute 3–6
Feature discrimination:
orientation or spacing gap adjusts.

Minute 6–10
WM block:
1-back or 2-back association / relation tracking.

Minute 10–12
Wrapper perturbation:
same relation, changed surface.

Minute 12–14
Transfer prompt:
“What stayed the same beneath the change?”

Minute 14–15
Implementation cue:
“If I hit confusion today, I will look for the changed variable first.”
```

## The main design principle

For Days 1–5, the player learns to process and hold the variables.

For Days 6–12, the player learns relations between variables.

For Days 13–20, the player learns that the relation survives changes in surface, timing, clarity, context and later use.

That gives you the compact training arc:

```text
bits/sec
→ discrimination
→ state binding
→ arbitrary association
→ relational transformation
→ successor path
→ wrapper transfer
→ prompt
→ implementation cue
→ delayed probe
```

## Bottom line

A strong 10-day version is feasible, but the **20-day version is more faithful to Trident-G far transfer** because it gives enough room for:

```text
local tuning
→ breakpoint perturbation
→ recovery
→ wrapper swap
→ delayed probe
→ niche cue
→ slow schematic extraction
```

---
The construct worth building here is not “n-back level” and not just “working-memory capacity”. I would define a new **operational workspace capacity for problem solving** that is grounded in existing theory but specific enough to become a measurement and training paradigm.

A good name would be:

## Problem-Solving Relational Workspace Capacity

**PS-RWC** = the capacity to extract, bind, maintain, update and use task-relevant relations over short temporal horizons under speed, discrimination and interference demands.

In Trident-G terms:

```text
PS-RWC
= cognitive-control bandwidth
+ temporary binding capacity
+ n-tuple relational integration
+ successor-horizon tracking
+ lure/interference resistance
+ wrapper recovery
```

This is the presemantic / lower-level substrate that would feed into puzzle problem spaces and meta-epistemic prompts later.

## Why this is theoretically legitimate

There are four strong traditions to build on.

First, **relational complexity theory** defines processing load in terms of the number of related variables or dimensions that must be processed in parallel. Halford, Wilson and Phillips explicitly argue that working-memory limits are best defined by the complexity of relations that can be processed, where unary, binary, ternary and quaternary relations differ by the number of dimensions or sources of variation involved. ([PhilPapers][1])

Second, **binding accounts of working memory** argue that the limiting factor is not simply remembering items, but maintaining temporary bindings. Oberauer’s binding hypothesis states that WM capacity specifically limits short-term maintenance of temporary bindings, and his experiments support the claim that error rates rise as the number of bindings to maintain increases. ([Journal of Cognition][2])

Third, individual-differences work suggests WM is not unitary. Unsworth and colleagues found that capacity, attention control and secondary memory were each related to WM and fluid intelligence, and jointly accounted for the WM–Gf relationship. That supports building a multidimensional capacity profile rather than one global n-back score. ([PMC][3])

Fourth, relational integration is directly relevant to reasoning. Chuderski’s relational integration task was designed to measure the process that binds mental representations into more complex relational structures, and it predicted fluid reasoning above other WM tasks. ([Springer][4])

So the construct has a good theoretical spine:

```text
attention-control bandwidth
→ temporary bindings
→ n-tuple relations
→ relational integration
→ problem-solving readiness
```

## The core operational unit: relation-bits

The key move is to stop counting “items” and start counting **relations over variables**.

Let a trial state be:

```text
S_t = [θ_t, F_t, L_t]
```

where:

```text
θ = majority orientation / direction
F = majority spatial frequency / spacing
L = majority luminance / clarity
```

Each dimension has a controlled number of bins:

```text
orientation: 8 bins = 3 bits
spacing:     4 bins = 2 bits
luminance:   4 bins = 2 bits
```

A simple state has:

```text
H(S) = log2(8 × 4 × 4)
     = 7 bits
```

But PS-RWC is not just state entropy. It is the capacity to bind and use **relations** over those states.

## 1. Arbitrary association binding

This is the episodic-binding mode.

Example:

```text
Was this orientation previously paired with this spacing?
```

The binding is arbitrary:

```text
θ ↔ F
```

The information demand is:

```text
H_binding = log2(|θ| × |F|)
```

If orientation has 8 values and spacing has 4:

```text
H_binding = log2(8 × 4)
          = 5 bits
```

Then include temporal horizon:

```text
binding-bit steps = H_binding × n
```

So:

```text
1-back θ↔F = 5 relation-bit steps
2-back θ↔F = 10 relation-bit steps
3-back θ↔F = 15 relation-bit steps
```

This gives a clean objective measure:

```text
Associative Binding Capacity
= maximum binding-bit steps sustained above criterion accuracy.
```

This would measure the user’s ability to maintain arbitrary presemantic feature bindings under interference.

## 2. N-tuple relational binding

This is where it becomes closer to problem solving.

A binary binding is:

```text
R(θ, F)
```

A ternary binding is:

```text
R(θ, F, L)
```

A quaternary binding could include a temporal or contextual variable:

```text
R(θ, F, L, time-position)
```

The information demand is:

```text
H_tuple = log2(|D1| × |D2| × ... × |Dm|)
```

or:

```text
H_tuple = Σ log2(|Dj|)
```

where `m` is the relation arity.

But arity should not be collapsed into bits alone. A ternary relation with the same number of total alternatives as a binary relation may still be cognitively harder because more variables must be integrated simultaneously. That is precisely the point of relational-complexity theory. ([PhilPapers][1])

So the task demand should include both:

```text
information load = how many alternatives
relational arity = how many variables must be jointly bound
```

A useful operational formula:

```text
tuple demand = H_tuple × n × A_m
```

where:

```text
A_m = arity weight
m = 1, 2, 3, 4...
```

A simple starting arity weight could be:

```text
A_m = m
```

A stronger model could estimate arity weights empirically.

## 3. Relational transformation binding

This is the fluid-reasoning-like mode.

Instead of remembering:

```text
orientation = 45°
spacing = medium
```

the learner tracks:

```text
orientation changed by +30°
spacing increased by one step
```

So the relevant object is:

```text
ΔS_t = S_t - S_{t-n}
```

A single-dimension relation:

```text
Δθ
```

A two-dimensional relation:

```text
[Δθ, ΔF]
```

A three-dimensional relation:

```text
[Δθ, ΔF, ΔL]
```

The information demand is:

```text
H_relation = log2(|Δθ| × |ΔF| × |ΔL|)
```

Then:

```text
relational-bit steps = H_relation × n × A_m
```

This gives:

```text
Relational Binding Capacity
= maximum transformation-relation demand sustained above criterion.
```

This is probably the most important sub-measure for later puzzle transfer, because puzzles require exactly this sort of capacity: maintaining how variables transform, constrain or imply each other.

## 4. Successor-horizon capacity

This is the SR-inspired mode.

A successor representation is not just “what is this state?” but “what future states does this state make likely?” Stachenfeld, Botvinick and Gershman argue that the hippocampus can be understood as a predictive map, representing states in terms of their successor states rather than just their current sensory content. ([gershmanlab.com][5])

In the task, this becomes:

```text
given S_t, what state or relation is likely at S_{t+h}?
```

You can define SR demand using surprisal:

```text
SR_surprisal = -log2 P(S_{t+h} | S_t)
```

or entropy:

```text
H_successor = H(S_{t+h} | S_t)
```

Then measure:

```text
SR Horizon Capacity
= maximum successor-relation information tracked across horizon h.
```

This would be the closest behavioural analogue of a hippocampal predictive-map measure, while still avoiding the stronger claim that the app directly measures hippocampal SRs.

## The overall PS-RWC model

For each trial, define objective demand as:

```text
D_i =
C_i + B_i + R_i + S_i + I_i
```

where:

```text
C_i = perceptual-control demand
B_i = arbitrary binding demand
R_i = relational transformation demand
S_i = successor-horizon demand
I_i = interference / lure demand
```

More concretely:

```text
C_i = H_extract / ET

B_i = H_binding × n × A_m

R_i = H_relation × h × A_m

S_i = -log2 P(S_{t+h} | S_t)

I_i = lure pressure
```

Then fit accuracy with a psychometric or item-response model:

```text
P(correct) =
guess + (1 - guess - lapse) × sigmoid(θ - D_i)
```

where:

```text
θ = person-level PS-RWC estimate
D_i = trial-level demand
```

The **PS-RWC score** is the fitted demand level at which the person can still perform reliably.

For example:

```text
PS-RWC70 = demand level at 70% balanced accuracy
PS-RWC75 = demand level at 75% balanced accuracy
PS-RWC80 = demand level at 80% balanced accuracy
```

For measurement, I would use **balanced accuracy**, not raw accuracy, because Same/Different and lure distributions can bias raw scores.

## Better: multidimensional PS-RWC

The strongest scientific version would estimate several latent parameters:

| Parameter      | Meaning                               | Unit                             |
| -------------- | ------------------------------------- | -------------------------------- |
| **C-Control**  | CCC-like perceptual-control bandwidth | bits/sec                         |
| **D-Disc**     | feature discrimination threshold      | JND / slope                      |
| **A-Bind**     | arbitrary feature-binding capacity    | binding-bit steps                |
| **R-Bind**     | transformation-relation capacity      | relation-bit steps               |
| **S-Horizon**  | successor / path horizon capacity     | SR-bit steps                     |
| **I-Control**  | lure/interference resistance          | false-alarm cost / d′            |
| **W-Recovery** | wrapper-swap recovery                 | transfer cost and recovery slope |

This is better than one composite because Unsworth et al.’s findings imply that WM-related individual differences are multifaceted, not a single source of variance. ([PMC][3])

A composite can still be produced:

```text
PS-RWC composite =
z(C-Control)
+ z(A-Bind)
+ z(R-Bind)
+ z(S-Horizon)
- z(I-Control errors)
- z(wrapper-swap cost)
```

But the sub-scores are scientifically more valuable.

## Objective measures to collect

Here are the objective measures I would build into the paradigm.

| Measure                    | Computation                                   | Interpretation                      |
| -------------------------- | --------------------------------------------- | ----------------------------------- |
| **Bits/sec threshold**     | `H_extract / ET` at criterion                 | cognitive-control bandwidth         |
| **Feature JND**            | psychometric threshold for θ, F, L            | discrimination precision            |
| **Binding-bit threshold**  | `H_binding × n` at criterion                  | arbitrary association capacity      |
| **Relation-bit threshold** | `H_relation × n × A_m` at criterion           | relational integration capacity     |
| **SR horizon threshold**   | max `h` or surprisal at criterion             | successor-map horizon               |
| **Lure cost**              | false alarms to recent-but-wrong states       | interference susceptibility         |
| **Swap cost**              | drop after wrapper change                     | horizontal transfer cost            |
| **Recovery slope**         | trials to regain criterion after perturbation | re-entry / breakpoint recovery      |
| **Delay retention**        | next-day or later re-check                    | consolidation candidate             |
| **Mutual information**     | `I(target; response)`                         | actual transmitted task information |

The mutual-information measure is especially attractive. Instead of saying “the user was 75% correct”, you can estimate:

```text
I(target; response) = H(target) - H(target | response)
```

This gives actual behavioural information transmission in bits/trial. Combined with response time, you can compute:

```text
effective relational throughput = I(target; response) / trial time
```

That would be an excellent bridge between MFT-M’s bits/sec logic and the relational workspace construct.

## How this feeds into problem solving

A puzzle problem space requires the learner to hold and manipulate:

```text
current state
possible moves
constraints
candidate relations
consequences
goal distance
counterexamples
```

So PS-RWC should predict puzzle performance better than a standard n-back score because it measures the presemantic operations puzzles require:

```text
what belongs with what?
which variable changed?
which relation still holds?
which move changes the state?
which future state becomes reachable?
```

This maps directly onto later meta-epistemic prompts:

| PS-RWC sub-capacity | Later prompt                                   |
| ------------------- | ---------------------------------------------- |
| Discrimination      | “Which feature changed?”                       |
| Arbitrary binding   | “What belongs with what?”                      |
| Relational binding  | “What relation stayed invariant?”              |
| SR horizon          | “Can this path still reach the goal?”          |
| Lure control        | “What is tempting but wrong?”                  |
| Wrapper recovery    | “What is the same rule under the new surface?” |

So the measurement paradigm becomes a bridge from **presemantic relational workspace** to **explicit problem-space reasoning**.

## Crucial caution: do not make this just another n-back

The technical literature gives a warning here. Standard n-back and updating tasks are not interchangeable with working-memory capacity or intelligence measures. A recent reanalysis found that updating-specific variance contributed only 15% to individual differences in updating tasks and did not correlate with fluid intelligence or independent WM measures; the part that did correlate was mainly the maintenance component. ([Psychologisches Institut UZH][6])

So the construct should not be:

```text
n-back level = intelligence
```

It should be:

```text
relational information maintained and used under controlled interference
```

This is why the task must include:

```text
temporary binding
relation arity
lure control
successor horizon
wrapper perturbation
delayed probes
```

not just higher n.

## Suggested study design

For cognitive science studies, I would validate PS-RWC in phases.

### Study 1: psychometric calibration

Estimate:

```text
test–retest reliability
split-half reliability
adaptive stopping SE
practice effects
device/timing effects
factor structure
```

Key question:

```text
Do C-Control, A-Bind, R-Bind and S-Horizon separate psychometrically?
```

### Study 2: convergent validity

Correlate PS-RWC with:

```text
MFT-M / CCC
complex span
visual working memory K
relational integration task
Raven / ICAR Matrix Reasoning
standard n-back
```

Prediction:

```text
R-Bind and S-Horizon should relate more strongly to matrix reasoning / relational integration than straight state n-back.
```

### Study 3: problem-solving validity

Use bounded puzzle tasks:

```text
Towers
Mines / hidden information
constraint grids
path puzzles
logic placement
```

Outcome measures:

```text
solution time
move efficiency
candidate reduction
hint use
branching-factor reduction
post-error recovery
wrapper-swap cost
```

Prediction:

```text
PS-RWC should predict efficient solution-path discovery, not just final correctness.
```

### Study 4: decision-making validity

Relate PS-RWC to probabilistic decision-making:

```text
expected-value maximisation
probability matching resistance
evidence threshold from drift-diffusion modelling
decision consistency under uncertainty
```

This would extend the CCC decision-making logic into a richer relational-workspace account. The recent CCC decision paper reports that high-CCC participants showed more expected-value-maximising responses under uncertainty, so PS-RWC could test whether relational binding and SR horizon add predictive validity beyond CCC alone. ([ScienceDirect][7])

### Study 5: learning capacity and transfer

Measure whether PS-RWC predicts:

```text
learning rate across novel rule families
speed of recovery after wrapper swap
delayed retention
near transfer
intermediate transfer
real-world mission completion
```

This is where the Trident-G transfer architecture becomes testable.

## Best working definition

I would define the construct as:

> **Problem-Solving Relational Workspace Capacity is the amount of task-relevant relational information a person can extract, bind, maintain, update and use across short temporal horizons, under perceptual ambiguity, speed pressure and interference, before accuracy collapses.**

And the operational score:

> **PS-RWC is the fitted relation-demand level, expressed in relation-bit steps or relation-bit seconds, at which the individual maintains criterion performance across arbitrary binding, transformation binding and successor-horizon trials.**

The concise formula is:

```text
PS-RWC ≈ threshold[D]

where

D =
H_extract / ET
+ H_binding × n × A_m
+ H_relation × h × A_m
+ SR_surprisal
+ lure pressure
```

This is not just a training score. It is a candidate individual-differences construct that could be tested against g, decision-making, problem-solving efficiency and learning capacity.

## Practical recommendation

Build the paradigm with three levels of output:

```text
1. Consumer / game output
Cognitive Bandwidth
Pattern Binding
Change Tracking
Path Prediction

2. Research output
C-Control
A-Bind
R-Bind
S-Horizon
I-Control
W-Recovery

3. Scientific construct
Problem-Solving Relational Workspace Capacity
```

That gives you a careful bridge from existing technical theory to a novel measurement paradigm, while keeping the claims defensible and empirically testable.

Yes — I think that is the right conceptual move, with one qualification.

**CCC is still useful**, but it is probably best understood as a relatively “thin” measure of **controlled evidence throughput**: how much task-relevant information can be selected and processed per second under perceptual uncertainty. In the original MFT-M paper, CCC is estimated from accuracy as information rate rises, and the authors report a typical capacity of about **3–4 bits/sec**. ([Nature][1]) But the task itself is still a brief perceptual decision task: majority direction under exposure-time and masking constraints. That makes it highly attractive for Zone Coach, state-readiness, attention-control bandwidth and decision-under-uncertainty work, but less complete as a model of problem-solving capacity.

For problem solving, your proposed **Problem-Solving Relational Workspace Capacity** is likely the more behaviourally meaningful construct, because it adds the missing ingredients: temporary binding, n-tuple relational integration, lure control, and successor-style horizon tracking. Working-memory research supports this direction: Oberauer argues that WM capacity specifically limits the maintenance of temporary bindings, not merely isolated items. ([Journal of Cognition][2]) Unsworth et al. also show that WM’s relation to fluid intelligence is multifactorial, involving capacity, attention control and secondary-memory retrieval rather than a single undifferentiated capacity. ([PMC][3])

So I would frame the distinction like this:

```text
CCC
= controlled perceptual evidence throughput
= how much relevant information can be selected and processed per second

PS-RWC
= operational relational workspace capacity
= how much structured relational information can be bound, updated, protected and used over time
```

The first is closer to **cognitive-control bandwidth**. The second is closer to the actual workspace needed for **problem solving, reasoning, learning and decision-making**.

## Why CCC alone is incomplete

You are right that “control capacity” becomes under-specified unless we ask: control over what?

In the MFT-M, the answer is:

```text
control over perceptual evidence selection under uncertainty
```

That is meaningful. It is not merely sensory capacity, because the task requires resolving conflicting information and selecting the majority direction under time pressure. However, it does not directly require the person to maintain bindings across several steps, compare transformations, track goal states, or update a problem-space representation. The original authors themselves note that the MFT-M involves visuo-spatial perceptual decision-making and that generalisation to other cognitive domains remains an open question. ([Nature][1])

So CCC should not be dismissed, but it should be positioned carefully:

```text
CCC is not full operational intelligence.
CCC is a controlled evidence-throughput parameter.
```

That is still powerful, especially because a recent decision-making study found that higher CCC was associated with more expected-value-maximising choices under uncertainty, apparently by supporting more cautious evidence thresholds and resistance to probability matching. ([ScienceDirect][4])

## Why PS-RWC may be more behaviourally useful

Problem solving usually requires:

```text
holding several variables
binding variables into relations
tracking which constraints apply
updating states after moves
resisting tempting but invalid moves
predicting reachable future states
recovering the same structure under a new wrapper
```

That is not just bits/sec. It is **relation-bits over time**.

This is where your construct becomes stronger. It turns the MFT-M principle into a richer operational workspace model:

```text
D =
H_extract / ET
+ H_binding × n
+ H_relation × horizon
+ SR_surprisal
+ lure pressure
```

So the person’s capacity is not only:

```text
How much information can you process per second?
```

but:

```text
How much structured relational information can you keep usable across time?
```

That is much closer to what problem solving demands.

## A good hierarchy

I would build the model as a hierarchy rather than a replacement:

| Layer         | Construct                       | Best use                                                |
| ------------- | ------------------------------- | ------------------------------------------------------- |
| **C-Control** | CCC / bits/sec                  | state, readiness, controlled evidence throughput        |
| **D-Disc**    | discrimination threshold        | perceptual precision and evidence quality               |
| **A-Bind**    | arbitrary binding capacity      | temporary episodic-style feature binding                |
| **R-Bind**    | relational binding capacity     | transformation tracking and relational integration      |
| **S-Horizon** | successor/path horizon          | SR-style predictive workspace                           |
| **PS-RWC**    | composite operational workspace | problem solving, learning, reasoning, decision capacity |

So CCC becomes the **input bandwidth** layer. PS-RWC becomes the **operational workspace** layer.

## The claim boundary

I would not say yet:

```text
PS-RWC is more useful than CCC.
```

I would say:

> **PS-RWC is likely to be more behaviourally predictive than CCC for complex problem-solving outcomes, because it extends controlled evidence throughput into temporary binding, relational integration and successor-horizon use.**

That is an empirical hypothesis. The studies would test whether PS-RWC predicts unique variance in:

```text
matrix reasoning
bounded puzzle efficiency
expected-value maximisation
problem-space search
learning rate
wrapper-swap recovery
delayed transfer
```

above and beyond CCC.

## Best conceptual wording

The clean formulation might be:

> **CCC measures the rate at which controlled evidence can be extracted from a noisy perceptual field. PS-RWC measures the amount of relational structure that can be kept operational for problem solving once that evidence has been extracted.**

That gives you a defensible bridge:

```text
perceptual control capacity
→ relational workspace capacity
→ problem-space reasoning
→ meta-epistemic prompt use
→ real-world niche deployment
```

In product terms, CCC is excellent for **Zone Coach**. PS-RWC is probably the better core construct for **IQ Coach / WM–Puzzle Epistemic Transfer**.

[1]: https://www.nature.com/articles/srep34025?utm_source=chatgpt.com "The Capacity of Cognitive Control Estimated from a ..."
[2]: https://journalofcognition.org/articles/10.5334/joc.86?utm_source=chatgpt.com "Working Memory Capacity Limits Memory for Bindings"
[3]: https://pmc.ncbi.nlm.nih.gov/articles/PMC4484859/?utm_source=chatgpt.com "Working Memory and Fluid Intelligence: Capacity, Attention ..."
[4]: https://www.sciencedirect.com/science/article/pii/S1053811926003046?utm_source=chatgpt.com "Cognitive Control Networks Drive Expected-Value ..."


---

[1]: https://philpapers.org/rec/HALPCD "Graeme S. Halford, William H. Wilson & Steven Phillips, Processing capacity defined by relational complexity: Implications for comparative, developmental, and cognitive psychology - PhilPapers"
[2]: https://journalofcognition.org/articles/10.5334/joc.86 "Working Memory Capacity Limits Memory for Bindings | Journal of Cognition"
[3]: https://pmc.ncbi.nlm.nih.gov/articles/PMC4484859/ "
            Working Memory and Fluid Intelligence: Capacity, Attention Control, and Secondary Memory Retrieval - PMC
        "
[4]: https://link.springer.com/article/10.3758/s13421-013-0366-x?utm_source=chatgpt.com "The relational integration task explains fluid reasoning above ..."
[5]: https://gershmanlab.com/pubs/Stachenfeld17.pdf?utm_source=chatgpt.com "The hippocampus as a predictive map"
[6]: https://www.psychologie.uzh.ch/dam/jcr%3Aae6c9922-c463-4184-9750-92fe2f5c5a08/Frischkorn_vBastian_Souza_Oberauer_JEPG_2022.pdf "AP-XGEJ210123 1341..1357"
[7]: https://www.sciencedirect.com/science/article/pii/S1053811926003046?utm_source=chatgpt.com "Cognitive Control Networks Drive Expected-Value ..."



[1]: https://www.nature.com/articles/srep34025?utm_source=chatgpt.com "The Capacity of Cognitive Control Estimated from a ..."
[2]: https://journals.sagepub.com/doi/10.1177/17470218211030838?utm_source=chatgpt.com "Adaptive assessment of the capacity of cognitive control"
[3]: https://journals.sagepub.com/doi/10.1177/1745691616635612?utm_source=chatgpt.com "Working Memory Training Does Not Improve Performance ..."
[4]: https://pubmed.ncbi.nlm.nih.gov/28967910/?utm_source=chatgpt.com "The hippocampus as a predictive map"
[5]: https://kops.uni-konstanz.de/entities/publication/2e749bfb-8533-437c-8203-7e788c910c5f?utm_source=chatgpt.com "Implementation intentions and goal achievement - KOPS"


[1]: https://www.jspsych.org/?utm_source=chatgpt.com "jsPsych"
[2]: https://www.jspsych.org/v7/overview/timing-accuracy/?utm_source=chatgpt.com "Timing Accuracy"
[3]: https://psychopy.org/online/cautions.html?utm_source=chatgpt.com "Caveats and cautions — PsychoPy v2026.1.3"
[4]: https://www.nature.com/articles/srep34025?utm_source=chatgpt.com "The Capacity of Cognitive Control Estimated from a ..."
[5]: https://pubmed.ncbi.nlm.nih.gov/34165352/?utm_source=chatgpt.com "Adaptive assessment of the capacity of cognitive control"
[6]: https://pmc.ncbi.nlm.nih.gov/articles/PMC7512138/?utm_source=chatgpt.com "The timing mega-study: comparing a range of experiment ..."
