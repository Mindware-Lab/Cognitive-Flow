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

[1]: https://www.jspsych.org/?utm_source=chatgpt.com "jsPsych"
[2]: https://www.jspsych.org/v7/overview/timing-accuracy/?utm_source=chatgpt.com "Timing Accuracy"
[3]: https://psychopy.org/online/cautions.html?utm_source=chatgpt.com "Caveats and cautions — PsychoPy v2026.1.3"
[4]: https://www.nature.com/articles/srep34025?utm_source=chatgpt.com "The Capacity of Cognitive Control Estimated from a ..."
[5]: https://pubmed.ncbi.nlm.nih.gov/34165352/?utm_source=chatgpt.com "Adaptive assessment of the capacity of cognitive control"
[6]: https://pmc.ncbi.nlm.nih.gov/articles/PMC7512138/?utm_source=chatgpt.com "The timing mega-study: comparing a range of experiment ..."
