# **Cognitive Flow**

## **Technical Grant & Product Specification**

### Adaptive Perceptual–Relational Training with a Minimal Wellness-Style Consumer Interface

## 1. Executive summary

**Cognitive Flow** is a proposed mobile web app for short, adaptive cognitive training sessions built around **pre-semantic visual transformation tracking**. The core task is not standard item-matching n-back. Instead of asking whether the current stimulus is the same as a previous stimulus, users judge whether the **way the stimulus is changing** is the same.

The user-facing question is simple:

> **Is this changing in the same way?**

The technical engine is more sophisticated. It combines:

1. **Sensory discrimination**: detecting increasingly subtle changes in orientation, spacing, motion angle, speed, contrast, or coherence.
2. **Working-memory updating**: maintaining recent transformation patterns across 1-back and 2-back demands.
3. **Relational integration**: judging relations between transformations rather than matching item identity.
4. **Portability validation**: testing whether the same relation can be tracked across different visual “wrappers”, such as Gabor-like patterns and optic-flow displays.

The first implementation should focus on the **Visual Patterns** lane: a single Gabor-like patch varying in **angle**, **spacing**, and later **clarity**. A second **Motion Flow** lane should be treated as a later or experimental lane until display timing, motion coherence, dot density, refresh-rate stability, and device variability are validated. The Motion Flow lane should be based on two primary continuous dimensions:

* **flow angle / spiral angle**: the balance between radial and tangential motion
* **flow speed**: the rate or magnitude of the motion field

Polarity, such as outward versus inward flow or clockwise versus anticlockwise rotational bias, should initially be controlled at **block level**, not switched unpredictably within early blocks.

The consumer product should feel extremely simple: a calm, elegant, 8-minute training ritual with minimal feedback and an enjoyable wellness-style visual aesthetic. The app should collect detailed adaptive and psychophysical data internally, but the user should see only what supports the next action.

> **The science stays in the engine. The user experiences a calm cognitive flow ritual.**

The evidence posture is deliberately cautious:

> **Cognitive Flow is an evidence-informed, novel training paradigm designed to train subtle change detection, pattern tracking, and rule updating under load. Its transfer effects should be measured, not assumed.**

This is consistent with the broader literature: perceptual learning supports sensory discrimination training, but often with specificity; working-memory training shows reliable near transfer but contested far transfer; and relational integration is the more promising mechanism because it trains relations rather than item identity. Ahissar and Hochstein showed that easy perceptual-learning conditions generalise more, whereas harder conditions become more specific to trained orientation and retinal position. ([PubMed][1]) Zhang et al. found that auditory discrimination learning interacts with working memory, especially where across-trial variation must be maintained and updated.

---

# 2. Product positioning

## 2.1 Product name

**Cognitive Flow**

### Suggested subtitle

> **Adaptive pattern training for focus and cognitive performance.**

### Public-facing description

> **Cognitive Flow is a short adaptive training app designed to help users practise subtle change detection, pattern tracking, and focused cognitive control in a calm daily routine.**

### Scientific claim posture

Use:

> **Designed to support focused cognitive training.**
> **Designed around clear goals, simple feedback, and calibrated challenge.**
> **Measures whether training gains transfer to independent cognitive trackers.**

Avoid:

> **Proven to increase IQ.**
> **Clinically validated cognitive enhancement.**
> **Induces flow state.**
> **Measures your brain state.**
> **Guarantees far transfer.**

---

# 3. System concept

## 3.1 Consumer layer versus data layer

Cognitive Flow should separate the **consumer experience** from the **scientific data engine**.

| Layer               | Purpose                         | User sees                                        | System records                                       |
| ------------------- | ------------------------------- | ------------------------------------------------ | ---------------------------------------------------- |
| **Consumer UI**     | Calm, low-friction session flow | Simple task, subtle feedback, session complete   | Nothing technical shown                              |
| **Training engine** | Adaptive task control           | Same / Different responses                       | RT, accuracy, gap, n, trial type, contrast/coherence |
| **Coaching layer**  | Optional later feedback         | Summary insights, patterns, recommendations      | Longitudinal learning and error profiles             |
| **Proof layer**     | Aggregate evidence              | Public claims boundaries and anonymised outcomes | Transfer, retention, portability, responder patterns |

The existing Zone Coach spec already points in this direction by using a minimal abstract visual language and explicitly avoiding score counters cluttering the stimulus display.  The Relational Flow spec contains a richer SR-map architecture, but that should not be exposed in the first consumer MVP. The current Relational Flow source includes nodes, depth rings, edges, spontaneous recombination, frontier highlights, and consolidation reveals, which are valuable internally but too heavy for first-use consumer flow. 

## 3.2 Design target

The consumer app should feel like:

> **a calm 8-minute pattern ritual**

not:

> **a cognitive science dashboard**

The user-facing loop is:

> **Check state → Train pattern → Finish calmly → Return later.**

---

# 4. Consumer Feedback Policy — MVP

> **The app collects rich data internally, but the user sees only what helps the next action.**

The consumer MVP should preserve a simple wellness-style UI: minimal abstract visuals, low cognitive overhead, and feedback that supports flow rather than analysis.

## 4.1 Stripped-down feedback model

For the MVP, Pattern Training feedback should be reduced to **four simple user-facing outputs**.

| Moment          | What user sees                                       | What stays hidden                                             |
| --------------- | ---------------------------------------------------- | ------------------------------------------------------------- |
| Before task     | “Today’s pattern session: Visual Patterns”           | n-level, gap size, contrast level, adaptive parameters        |
| During task     | subtle correct / miss pulse only                     | accuracy, RT, false alarms, threshold estimates               |
| After task      | “Nice work — your pattern tracking was steady today” | balanced accuracy, gap level, stream-specific errors          |
| Progress screen | 7-day dots + “Next session ready tomorrow”           | SR depth, breadth, portability score, consolidation estimator |

Instead of exposing:

> Precision Score
> Stable Gap
> Portability Probe
> Conjunction False-Same Error
> Cross-family Portability Score

the MVP should show:

> **Today’s Flow**
> **Pattern Session Complete**
> **You’re building consistency**
> **Next session: tomorrow / in 2 days**

## 4.2 What to remove from the consumer MVP

The following should move to **internal analytics**, the website proof layer, or a later **coach/pro dashboard**:

* precision scores
* stable gap thresholds
* unlocked pattern types
* explicit portability probes
* SR map depth
* SR map breadth
* edge thickening
* spontaneous recombination
* “how far ahead you can think”
* “range of your thinking”
* detailed n-back statistics
* contrast/coherence levels
* cross-family transfer scores

## 4.3 Minimal Pattern Training UI flow

### 1. Start screen

One card:

> **Pattern Training**
> Train your ability to notice subtle changes.
> **Start: 8 minutes**

Optional lane choice only:

> **Visual Patterns**
> **Motion Flow**

No explanation of Gabor, optic flow, SR maps, n-back, contrast, or transfer.

### 2. Tutorial

The first-use tutorial should be extremely short and interactive. Apple’s Human Interface Guidelines recommend fast, fun onboarding and teaching through interaction rather than long instruction screens.

User sees:

> **Same** = the change keeps going
> **Different** = the pattern breaks

Then 5 guided trials.

After that, no further explanation is shown during standard training.

### 3. During task

Only show:

* stimulus
* Same / Different buttons
* subtle feedback pulse
* optional thin progress ring

Do not show:

* score
* accuracy
* streak
* gap level
* scientific terminology
* n-back level
* contrast level
* portability status

### 4. End screen

One sentence, one button.

Examples:

> **Session complete**
> Your pattern tracking was steady today.
> **Done**

or:

> **Good session**
> Today was a lighter training day.
> **Done**

or:

> **Reset recommended**
> Come back after a short break.
> **Done**

The feedback should be **state-like**, not metric-like.

### 5. Progress screen

Keep only a simple 7-day or 14-day row of dots.

Example:

> **This week**
> ● ● ○ ● ○ ● ○
> 4 sessions completed

Optional short line:

> **You’re building consistency.**

Mobile health engagement research links engagement with behaviour-change techniques such as feedback, self-monitoring, prompts/cues, rewards, goal setting, and social support. For Cognitive Flow, these should be implemented in the lightest possible way: weekly dots, brief feedback, and a timely return prompt.

## 4.4 Revised engagement layer

The engagement loop should be:

> **Start → Play → Finish → Return**

Not:

> **Analyse → Compare → Interpret → Optimise**

For MVP:

| Need        | Minimal implementation        |
| ----------- | ----------------------------- |
| Reward      | calm completion animation     |
| Progress    | weekly dots                   |
| Return hook | “Next session ready tomorrow” |
| Confidence  | “You’re building consistency” |
| Guidance    | one recommended next action   |

For later coaching:

| Advanced feature                | Where it belongs     |
| ------------------------------- | -------------------- |
| precision thresholds            | coach/pro dashboard  |
| transfer probes                 | proof/research layer |
| SR map                          | advanced user mode   |
| individual strategy advice      | coaching option      |
| detailed longitudinal analytics | website dashboard    |

---

# 5. Use of colour and aesthetic “vibe”

Colour should be used to make the app more enjoyable, calming, and visually distinctive, without changing the underlying scientific task.

Colour can act as a **visual wrapper**, not a scored rule dimension in the MVP. For example:

* blue/cyan theme
* purple/lavender theme
* rose/red theme
* amber/gold theme

The task remains the same: the user tracks angle, spacing, flow angle, speed, clarity, or conjunction rules. Colour simply changes the emotional tone and makes the experience feel less clinical.

Recommended rule:

> **Colour changes the vibe, not the science.**

Colour can also support later **wrapper variation**: the same underlying task can be practised across different colour palettes to reduce overfitting to one visual appearance. However, colour should not become a scored dimension until a later advanced conjunction mode. Red/green dependence should be avoided for accessibility.

---

# 6. Core task specification

## 6.1 Core design principle

All games use a single central perceptual event per trial. This is a critical constraint because multiple-object displays create a binding problem: the user must work out which object corresponds to which earlier object, consuming the working-memory resources that should instead be directed towards transformation detection. The Relational Flow spec explicitly identifies single-object transformation as the target load profile. 

The first MVP can support two bounded training lanes:

| User-facing lane    | Technical stimulus family | Main dimensions                                 |
| ------------------- | ------------------------- | ----------------------------------------------- |
| **Visual Patterns** | Gabor-like patch          | angle, spacing, contrast                        |
| **Motion Flow**     | optic-flow field          | flow angle, speed, coherence, contrast          |
| **Mixed Challenge** | cross-family validation   | same relation across visual and motion variants |

For launch, **Visual Patterns** should be the scored MVP. **Motion Flow** should remain experimental until device variability and optic-flow parameters are validated.

## 6.2 Core response rule

The response is binary:

> **Same** = the current change pattern continues.
> **Different** = the current change pattern has broken.

The user is not asked whether the image is identical. The user is asked whether the **change relation** is the same. This follows the Relational Flow trial logic: the learner judges whether the current stimulus stands in the same transformation relation to a previous stimulus as the target transformation, using a same/different response. 

## 6.3 Four internal learning processes

| Internal process           | Game implementation                                        | Transfer expectation                |
| -------------------------- | ---------------------------------------------------------- | ----------------------------------- |
| **Tuning / honing**        | smaller gaps, lower contrast, faster timing                | near transfer, precision            |
| **Reconfiguration**        | new dimension, new rule, new n, new stimulus family        | intermediate/far transfer candidate |
| **Portability validation** | same relation across Gabor, flow, and conjunction variants | key evidence test                   |
| **Consolidation**          | rest / every-other-day spacing / delayed re-check          | needed for slow gist extraction     |

In Trident-G terms, **tuning/honing** maps onto performance improvement within a current relational map. **Reconfiguration** means shifting to a new relation, dimension, rule, memory horizon, or stimulus family. **Portability validation** tests whether an acquired relation survives a new wrapper. **Consolidation** provides time for slower schematic extraction.

The key implication is:

> **Far transfer is unlikely to come from sensory honing alone. It is more plausible when honing is embedded inside reconfiguration, portability validation, and consolidation.**

The Trident-G framing should remain primarily internal in the grant document and technical appendix. The main public and partner-facing language should use mainstream constructs: perceptual learning, working-memory updating, relational integration, rule abstraction, visual attention, processing speed, and transfer validation.

---

# 7. Common trial logic

The game maintains a current **change rule**. Most trials continue the rule. Some trials break it.

Example orientation rule:

```text
current rule = +30° orientation change
```

| Trial | Orientation | Change | Correct response      |
| ----: | ----------: | -----: | --------------------- |
|     1 |         20° |      — | no response           |
|     2 |         50° |   +30° | Same / start tracking |
|     3 |         80° |   +30° | Same                  |
|     4 |        110° |   +30° | Same                  |
|     5 |        130° |   +20° | Different             |
|     6 |        150° |   +20° | Same                  |
|     7 |        170° |   +20° | Same                  |

After a break, the new change becomes the rule to track.

Recommended trial balance:

| Trial type          | Proportion |
| ------------------- | ---------: |
| Continuation / Same |     65–75% |
| Break / Different   |     25–35% |

Breaks should not be too rare. If only 10% of trials are breaks, users can overuse “Same” and still score well. Internally, the primary accuracy measure should be balanced accuracy:

```text
balanced_accuracy = (same_accuracy + different_accuracy) / 2
```

---

# 8. Stimulus lane A: Visual Patterns

Each trial displays a single Gabor-like patch.

Internal parameters:

```text
orientation_angle_degrees
spatial_frequency
contrast
phase
patch_size
presentation_duration_ms
response_window_ms
cue_type
trial_type
colour_theme
```

User-facing labels:

| Internal dimension                         | User label                |
| ------------------------------------------ | ------------------------- |
| Orientation                                | Angle                     |
| Spatial frequency                          | Spacing                   |
| Contrast                                   | Clarity                   |
| Orientation + spatial frequency            | Pattern                   |
| Orientation + spatial frequency + contrast | Pattern under low clarity |
| Colour theme                               | Vibe / theme              |

Technical words such as “Gabor”, “spatial frequency”, “phase”, “n-back”, and “relational transformation” should not appear in the live task.

The Zone Coach source already uses pre-semantic orientation gratings, spatial-frequency patches, and luminance discs, specifically because these dimensions are continuous rather than semantic categories. 

## 8.1 Visual Patterns adaptive variables

| Difficulty lever      | Function                | Use                   |
| --------------------- | ----------------------- | --------------------- |
| Orientation gap       | rule/discrimination gap | primary adaptation    |
| Spatial-frequency gap | rule/discrimination gap | primary adaptation    |
| Timing                | speed pressure          | secondary adaptation  |
| Contrast              | signal-quality pressure | late-stage adaptation |
| Colour theme          | aesthetic wrapper       | not scored in MVP     |

Contrast is a signal-quality modifier, not the main rule dimension. It should be introduced only after the user can reliably track the rule at normal contrast.

---

# 9. Stimulus lane B: Motion Flow

Motion Flow uses a sparse-dot optic-flow field or equivalent full-field motion stimulus. The Relational Flow spec defines optic flow as a dynamic stimulus family involving expansion, contraction, rotation, shear, and related flow parameters. It also specifies sparse dot fields, limited dot lifetime, full-field coverage, and MT/MST-oriented global flow processing rather than object identity tracking. 

For the Cognitive Flow implementation, this should be simplified into two primary adaptive dimensions:

1. **Flow angle / spiral angle**
2. **Flow speed**

The previous broader “flow type” formulation should remain in the research architecture, but the user-facing and MVP technical design should use **continuous flow angle** and **speed** as the clean primary pair.

## 9.1 Motion Flow angle

**Flow angle** is a continuous parameter that defines the balance between radial and tangential motion.

Internally:

```text
flow_angle_degrees = angle of local motion vector relative to the radial direction
```

A simple conceptual mapping:

| Flow angle | Perceptual pattern          |
| ---------: | --------------------------- |
|         0° | pure expansion              |
|        30° | gentle outward spiral       |
|        60° | stronger outward spiral     |
|        90° | pure rotation               |
|       120° | inward spiral with rotation |
|       180° | pure contraction            |

This makes Motion Flow directly analogous to the Visual Patterns **Angle** dimension. The user does not need to know this. The interface can still simply say “Motion” or “Flow”.

Optic-flow research supports this kind of continuous parameterisation. Duffy and Wurtz reported that MSTd neurons respond to large-field rotating, expanding, and planar motion patterns, and described MSTd responses as relevant to the analysis of optic flow generated by observer movement. ([PubMed][1]) Wurtz and Duffy also describe MSTd response properties as forming a continuum from single-component sensitivity to multiple-component sensitivity across optic-flow components. ([PubMed][2])

## 9.2 Motion Flow speed

**Flow speed** defines the magnitude or rate of the motion field.

Internally, this may be represented as:

```text
flow_speed
radial_rate
tangential_rate
expansion_rate
rotation_rate
```

In the simplified MVP, the adaptive **Speed** dimension should be a single scalar that scales the vector field while preserving the current flow angle.

Example:

```text
flow_vector = flow_speed × unit_vector(flow_angle)
```

This keeps the user’s task clear: the motion either changes by the same amount or it breaks.

## 9.3 Motion Flow polarity

Polarity should initially be controlled at **block level**.

Examples:

| Block type          | Polarity context                   | What varies within block |
| ------------------- | ---------------------------------- | ------------------------ |
| Outward block       | expansion-side flow                | flow angle and speed     |
| Inward block        | contraction-side flow              | flow angle and speed     |
| Clockwise block     | clockwise tangential component     | flow angle and speed     |
| Anticlockwise block | anticlockwise tangential component | flow angle and speed     |

This avoids letting users solve the task through coarse polarity detection. If expansion repeatedly flips to contraction inside a block, users may simply detect “in versus out” rather than tracking continuous angle or speed.

Recommended MVP rule:

> **Within a block, vary angle and speed smoothly. Between blocks, vary polarity.**

## 9.4 Motion Flow internal parameters

```text
flow_angle_degrees
flow_speed
flow_polarity
radial_component
tangential_component
expansion_rate
rotation_rate
motion_coherence
dot_density
dot_lifetime
dot_contrast
presentation_duration_ms
response_window_ms
cue_type
trial_type
colour_theme
```

## 9.5 Motion Flow user-facing labels

| Internal dimension        | User label           |
| ------------------------- | -------------------- |
| Flow angle / spiral angle | Motion / Flow        |
| Flow speed                | Speed                |
| Coherence                 | Clarity              |
| Dot contrast              | Clarity              |
| Polarity                  | Hidden block context |
| Colour theme              | Vibe / theme         |

In optic flow, the equivalent of “spatial frequency” is less natural. The better second dimension is:

> **flow speed / motion rate**

The better analogue of Gabor **orientation angle** is:

> **flow angle / spiral angle**

## 9.6 Motion Flow adaptive variables

| Difficulty lever | Function                | Use                       |
| ---------------- | ----------------------- | ------------------------- |
| Flow-angle gap   | rule/discrimination gap | primary adaptation        |
| Flow-speed gap   | rule/discrimination gap | primary adaptation        |
| Motion coherence | signal-quality pressure | secondary/late adaptation |
| Dot contrast     | signal-quality pressure | late adaptation           |
| Timing           | speed pressure          | secondary adaptation      |
| Polarity         | block-level context     | not rapidly mixed in MVP  |
| Colour theme     | aesthetic wrapper       | not scored in MVP         |

For Motion Flow, **coherence** may be a better analogue of contrast than dot contrast alone, because it manipulates how much of the field carries useful global motion signal.

---

# 10. General adaptive difficulty hierarchy

Do not adapt too many difficulty levers at once. The recommended hierarchy is:

1. **Rule gap**: visual angle, spacing, flow angle, flow speed.
2. **Memory load**: 1-back → 2-back.
3. **Rule complexity**: single dimension → conjunction.
4. **Speed pressure**: shorter stimulus duration or response window.
5. **Signal quality**: lower contrast or lower motion coherence.
6. **Polarity variation**: introduced between blocks before any within-block mixing.

This keeps interpretation clean. If the app reduces the gap and lowers contrast at the same time, errors become ambiguous: the user may have failed because the stimulus was too faint rather than because the relation was too difficult.

## 10.1 Visual Patterns gap ladders

| Difficulty band | Orientation gap | Spatial-frequency gap |                     Contrast |
| --------------- | --------------: | --------------------: | ---------------------------: |
| Easy            |          30–40° |                30–40% |                         high |
| Medium          |          20–30° |                20–30% |                         high |
| Hard            |          10–20° |                10–20% |                       medium |
| Very hard       |           5–10° |                 5–10% | medium/low, after validation |

## 10.2 Motion Flow gap ladders

| Difficulty band | Flow-angle gap | Flow-speed gap |                          Coherence / contrast |
| --------------- | -------------: | -------------: | --------------------------------------------: |
| Easy            |         30–40° |          large |                                          high |
| Medium          |         20–30° |         medium |                                          high |
| Hard            |         10–20° |          small |                                        medium |
| Very hard       |          5–10° |         subtle | lower coherence or contrast, after validation |

---

# 11. The three games

## 11.1 Game 1: Spot Patterns

### Purpose

Train simple transformation tracking.

### Task type

**1-back continuation/break detection**

### Visual Patterns version

Stimulus: single Gabor-like patch.

Dimensions:

* Angle block
* Spacing block
* later Clarity block, if contrast is added as a signal-quality challenge

User rule:

> “Watch how the pattern is changing. Tap Same if it keeps changing in the same way. Tap Different if the pattern breaks.”

Technical rule:

```text
if current_change == previous_change:
    correct_response = Same
else:
    correct_response = Different
```

Initial settings:

```text
n = 1
trials = 32
same_ratio = 0.70
different_ratio = 0.30
orientation_gap_start = 30–40°
sf_gap_start = 30–40%
stimulus_duration = 1000–1200 ms
response_window = 1800–2200 ms
contrast = high
```

### Motion Flow version

Stimulus: optic-flow field.

Dimensions:

* Flow angle / spiral angle
* Flow speed
* Clarity: coherence or dot contrast, later only
* Polarity: block-level context only

Example: flow-angle block

| Trial | Flow angle | Perceptual pattern      | Correct response |
| ----: | ---------: | ----------------------- | ---------------- |
|     1 |         0° | pure expansion          | no response      |
|     2 |        30° | gentle outward spiral   | Same / start     |
|     3 |        60° | stronger outward spiral | Same             |
|     4 |        90° | pure rotation           | Same             |
|     5 |       105° | smaller angle change    | Different        |
|     6 |       120° | continues new change    | Same             |

Example: speed block

| Trial | Flow angle | Flow speed | Correct response |
| ----: | ---------: | ---------: | ---------------- |
|     1 |        30° |        1.0 | no response      |
|     2 |        30° |        1.3 | Same / start     |
|     3 |        30° |        1.6 | Same             |
|     4 |        30° |        1.9 | Same             |
|     5 |        30° |        2.0 | Different        |
|     6 |        30° |        2.1 | Same             |

Primary internal metrics:

```text
accuracy
balanced_accuracy
same_accuracy
different_accuracy
false_alarm_rate
miss_rate
median_reaction_time
gap_level
flow_angle_gap
flow_speed_gap
contrast_or_coherence_level
flow_polarity
colour_theme
```

---

## 11.2 Game 2: Track Change

### Purpose

Train updating of transformation patterns over a short working-memory gap.

### Task type

**2-back transformation tracking**

### Visual Patterns version

Stimulus: single Gabor-like patch.

Dimensions alternate with cues:

```text
Angle → Spacing → Angle → Spacing
```

User rule:

> “Track the Angle and Spacing streams. Each cue tells you what to follow. Tap Same if this change matches the earlier change in that stream.”

Example orientation stream:

| Orientation event | Orientation change | Compare with | Correct response |
| ----------------: | -----------------: | -----------: | ---------------- |
|                O1 |               +30° |            — | no response      |
|                O2 |               +20° |            — | no response      |
|                O3 |               +30° |           O1 | Same             |
|                O4 |               +20° |           O2 | Same             |
|                O5 |               +10° |           O3 | Different        |
|                O6 |               +20° |           O4 | Same             |

This is a true 2-back structure because the user must maintain and compare recent transformation states rather than simply detect immediate change.

### Motion Flow version

Stimulus: optic-flow event.

Dimensions can alternate between:

```text
Flow → Speed → Flow → Speed
```

or, internally:

```text
Flow angle → Flow speed → Flow angle → Flow speed
```

Example flow-angle stream:

| Flow event | Flow angle | Compare with | Correct response |
| ---------: | ---------: | -----------: | ---------------- |
|         F1 |         0° |            — | no response      |
|         F2 |        30° |            — | no response      |
|         F3 |         0° |           F1 | Same             |
|         F4 |        30° |           F2 | Same             |
|         F5 |        20° |           F3 | Different        |
|         F6 |        30° |           F4 | Same             |

Example speed stream:

| Flow event | Speed | Compare with | Correct response |
| ---------: | ----: | -----------: | ---------------- |
|         S1 |   1.0 |            — | no response      |
|         S2 |   1.3 |            — | no response      |
|         S3 |   1.0 |           S1 | Same             |
|         S4 |   1.3 |           S2 | Same             |
|         S5 |   1.1 |           S3 | Different        |
|         S6 |   1.3 |           S4 | Same             |

Initial settings:

```text
n = 2
cue_mode = alternating
trials = 40
same_ratio = 0.65–0.70
different_ratio = 0.30–0.35
stimulus_duration = 1100–1500 ms
response_window = 2200 ms
contrast_or_coherence = high
polarity = block-level
```

Primary internal metrics:

```text
balanced_accuracy
dimension_specific_accuracy
angle_accuracy
spacing_accuracy
flow_angle_accuracy
flow_speed_accuracy
switch_cost
median_rt_by_dimension
n_back_error_rate
flow_polarity
colour_theme
```

---

## 11.3 Game 3: Find the Rule

### Purpose

Train conjunction-based rule tracking.

### Task type

**Conjunction transformation tracking**

A response is Same only if the whole rule continues.

### Visual Patterns version

Stimulus: single Gabor-like patch where both orientation and spatial frequency can change.

Example conjunction rule:

```text
orientation increases by +30°
AND
spatial frequency increases by ×1.20
```

| Trial | Orientation | Spatial frequency | Change      | Correct response |
| ----: | ----------: | ----------------: | ----------- | ---------------- |
|     1 |         20° |               2.0 | —           | no response      |
|     2 |         50° |               2.4 | +30°, ×1.20 | Same / start     |
|     3 |         80° |               2.9 | +30°, ×1.20 | Same             |
|     4 |        110° |               3.5 | +30°, ×1.20 | Same             |
|     5 |        130° |               4.2 | +20°, ×1.20 | Different        |
|     6 |        150° |               5.0 | +20°, ×1.20 | Same             |
|     7 |        170° |               5.5 | +20°, ×1.10 | Different        |

### Motion Flow version

Stimulus: optic-flow field where both **flow angle** and **flow speed** can change.

Example conjunction rule:

```text
flow angle increases by +30°
AND
flow speed increases by +0.3 units
```

A break can occur in:

* flow angle only
* flow speed only
* both flow angle and flow speed

Example:

| Trial | Flow angle | Flow speed | Change     | Correct response |
| ----: | ---------: | ---------: | ---------- | ---------------- |
|     1 |         0° |        1.0 | —          | no response      |
|     2 |        30° |        1.3 | +30°, +0.3 | Same / start     |
|     3 |        60° |        1.6 | +30°, +0.3 | Same             |
|     4 |        90° |        1.9 | +30°, +0.3 | Same             |
|     5 |       105° |        2.2 | +15°, +0.3 | Different        |
|     6 |       120° |        2.5 | +15°, +0.3 | Same             |
|     7 |       135° |        2.6 | +15°, +0.1 | Different        |

### Cross-family portability version

This tests whether the user can apply the same abstract relation across stimulus families.

| Phase             | Stimulus family | Relation                                       |
| ----------------- | --------------- | ---------------------------------------------- |
| Training          | Gabor           | same amount of orientation change              |
| Portability probe | Motion Flow     | same amount of flow-angle change               |
| Training          | Gabor           | same proportional spacing change               |
| Portability probe | Motion Flow     | same proportional speed change                 |
| Validation        | Mixed           | same relation alternates across Gabor and Flow |

This is a **validation probe**, not a guaranteed training claim.

Progression:

| Stage | Rule                                                    |
| ----- | ------------------------------------------------------- |
| 3A    | 1-back, single-dimension break                          |
| 3B    | 1-back, either dimension can break                      |
| 3C    | 1-back conjunction                                      |
| 3D    | 2-back conjunction                                      |
| 3E    | cross-family portability probe                          |
| 3F    | smaller gaps + faster timing + lower contrast/coherence |
| 3G    | polarity variation between blocks                       |

Primary internal metrics:

```text
conjunction_accuracy
single_dimension_break_detection
dual_dimension_break_detection
orientation_only_error_rate
sf_only_error_rate
flow_angle_error_rate
flow_speed_error_rate
conjunction_false_same_rate
cross_family_portability_score
median_rt
adaptive_gap_level
flow_angle_gap
flow_speed_gap
contrast_or_coherence_level
flow_polarity
colour_theme
```

---

# 12. Honing, reconfiguration, portability, and consolidation blocks

## 12.1 Block A: Hone

Purpose:

> make perception and rule tracking more precise.

Examples:

* smaller angle gaps
* smaller spacing gaps
* smaller flow-angle gaps
* smaller flow-speed gaps
* lower contrast
* lower coherence
* faster timing

Expected transfer:

> near transfer and precision.

## 12.2 Block B: Reconfigure

Purpose:

> make the user rebuild the rule-space.

Examples:

* Angle → Spacing
* Visual Patterns → Motion Flow
* 1-back → 2-back
* single dimension → conjunction
* known rule → new hidden rule
* outward polarity block → inward polarity block

Expected transfer:

> intermediate/far transfer candidate.

## 12.3 Block C: Validate portability

Purpose:

> test whether the trained relation survives a new wrapper.

Examples:

* same relation across Gabor and Motion Flow
* same change pattern across visual angle and flow angle
* same proportional-change pattern across spacing and speed
* same conjunction logic across visual and motion lanes
* same rule across different colour themes

Expected transfer:

> key evidence test.

## 12.4 Block D: Consolidate

Purpose:

> allow slower schematic extraction.

Examples:

* every-other-day spacing
* delayed re-checks
* review without new difficulty
* sleep/recovery-sensitive scheduling

The Relational Flow source proposes 12–15 minute sessions after a Zone Coach gate and every-other-day pacing. 

---

# 13. Recommended session structure

For the first consumer MVP:

```text
Zone Check: 2–3 minutes
Pattern Training: 8 minutes
Total session: 10–12 minutes
```

Pattern Training structure:

```text
Game 1: 2–3 minutes
Game 2: 3 minutes
Game 3: 3–4 minutes
Optional portability probe: internal only, not surfaced as a user-facing feature
```

Initial release should prioritise **Visual Patterns**. Motion Flow should be in the architecture and pilot roadmap, but not a scored launch claim.

---

# 14. MVP exclusions

Avoid in the first consumer version:

* 3-back and 4-back
* multi-object displays
* semantic stimuli such as letters, numbers, icons, or faces
* go/no-go response mode
* simultaneous reduction of gap, contrast, and timing
* low-contrast tasks without brightness/device checks
* optic-flow claims before psychophysical piloting
* rapid within-block polarity switching in Motion Flow
* SR-map UI
* precision dashboards
* explicit transfer claims
* IQ improvement claims

---

# 15. Risk controls and development gates

> **Build the app as a staged evidence funnel: first prove comprehension, then learning, then retention, then portability.**

Do not make portability, optic flow, or Trident-G exposition carry the MVP.

## 15.1 Cognitive opacity

The task is not self-evident. A **Tutorial Brain** phase should be included before scored trials.

| Tutorial stage | What happens                                                                                 | Data status                |
| -------------- | -------------------------------------------------------------------------------------------- | -------------------------- |
| **Show**       | Animated demo: grating turns, with subtle ghost/arrow showing the change                     | Not scored                 |
| **Guide**      | 5–10 trials with exaggerated changes and immediate explanation: “Same change” / “New change” | Not scored                 |
| **Fade**       | annotation disappears, but changes remain easy                                               | Practice scored separately |
| **Play**       | normal training starts                                                                       | Scored                     |

This slightly compromises the pure pre-semantic ideal during onboarding, but tutorial trials are not counted as evidence data. The source spec already states that transformation-class vocabulary should remain in the data layer, with user-facing text naming recognisable cognitive skills rather than technical transformation classes. 

Comprehension gates:

* User must get **4 of 5 guided trials correct** before entering Game 1.
* User must pass a one-screen concept check: “Are you matching the picture or the change?”
* If the user fails twice, the app switches to the simpler prompt: **“Did the pattern break?”**

## 15.2 Pilot stages

### Round 1: comprehension / usability pilot

**n = 5–8**, think-aloud, unscored prototype.

Success criteria:

* ≥80% understand the task within 60 seconds
* ≥80% can explain “same change” in their own words
* ≥80% pass practice within 2 attempts
* mean confidence rating ≥3.5/5 after tutorial
* no more than one participant says they are “just guessing”

Small formative usability testing is appropriate here because the aim is to find obvious UX failures, not estimate treatment effects.

### Round 2: learning-curve pilot

**n = 15–20**, five sessions, Game 1 only.

Success criteria:

* clear within-person improvement in balanced accuracy or reduced gap threshold
* dropout ≤25% by session 5
* ≥70% reach a stable Game 1 threshold
* strategy reports indicate relational tracking rather than random guessing
* no obvious device class effect swamping performance

### Round 3: progression pilot

**n = 25–40**, Games 1–3.

Success criteria:

* Game 1 improvement predicts Game 2 entry performance
* Game 2 users show genuine 2-back sensitivity, not immediate-change responding
* Game 3 false-Same errors decline over sessions
* portability probes show at least a measurable signal, not necessarily a strong effect

## 15.3 Optic flow as v1.1

For the first consumer MVP:

> **Visual Patterns = scored MVP. Motion Flow = experimental lane until device noise is characterised.**

Motion Flow requires:

* device refresh-rate detection
* frame-based animation timing
* brightness/contrast check
* reduced reliance on very brief presentations
* timing-quality flags stored with every session
* minimum viable display criteria for scored data
* calibration trials for coherence/rate thresholds
* calibration of flow-angle discriminability
* calibration of flow-speed discriminability
* block-level polarity testing before any within-block polarity mixing

## 15.4 Portability validation as hypothesis

Portability is the key test, not a guaranteed result.

| Result                     | Interpretation                                 | Product response                |
| -------------------------- | ---------------------------------------------- | ------------------------------- |
| **Near transfer only**     | useful perceptual precision / pattern training | keep as focused training        |
| **Within-family transfer** | relation generalises across Gabor variants     | strengthen Visual Patterns lane |
| **Cross-family transfer**  | relation survives Gabor → Flow                 | strong portability evidence     |
| **No portability**         | relation is wrapper-specific                   | report boundary, adjust task    |

Public proof line:

> **Cognitive Flow tests whether gains stay within the trained pattern surface or transfer across new pattern types.**

Not:

> **Cognitive Flow training transfers across pattern types.**

---

# 16. Evidence review

## 16.1 Sensory discrimination and perceptual learning

Visual perceptual learning provides a strong foundation for Cognitive Flow because it shows that perceptual systems remain trainable through active discrimination practice. People can improve at discriminating orientation, spatial frequency, motion direction, contrast, and related visual features. This directly supports the use of Gabor-like orientation and spacing tasks as a first stimulus family.

The important nuance is that perceptual learning is not uniformly narrow or uniformly general. Ahissar and Hochstein showed that the specificity of perceptual learning depends on task difficulty: easier training conditions generalised across orientation and retinal position, whereas harder fine-grained discrimination became more specific to trained orientation and position. Their reverse-hierarchy interpretation is especially relevant because it suggests that broad, easier training may first engage more general visual representations, while harder discrimination later tunes more specific lower-level mechanisms. ([Nature][1])

This is directly useful for Cognitive Flow. The app should not simply push users immediately into the smallest possible perceptual gaps. It should begin with easier, more generalisable transformations, then gradually narrow the gap only after the user has stabilised the rule. That gives a principled sequence:

> **general pattern recognition → relational rule tracking → fine sensory honing.**

A further reason to avoid an overly pessimistic interpretation comes from later perceptual-learning work. Yu’s review argues that some classic “specificities” of visual perceptual learning may partly reflect training design, and that procedures such as double training and task-plus-exposure can allow learning to transfer to new locations or orientations. Yu frames perceptual learning partly as rule-based learning by a higher-level decision unit, rather than only as local sensory retuning. ([Sage Journals][2])

This supports Cognitive Flow’s design logic: transfer is more plausible when perceptual discrimination is embedded in **rule tracking, varied wrappers, and portability probes**, rather than repeated as a fixed stimulus discrimination.

**Implication:**
Small-gap honing is useful, but it should not be the whole training programme. The strongest design is a staged sequence: start with easy relational patterns that can generalise, then add fine discrimination, then test whether the learned relation survives new colours, stimulus ranges, timings, and eventually Motion Flow variants.

---

## 16.2 Contrast and signal detection

Contrast sensitivity is not merely a low-level visual threshold. It is affected by attention, adaptation, and task demands. Pestilli, Viera, and Carrasco showed that attention and contrast adaptation both alter contrast sensitivity, with attention increasing sensitivity at attended locations and helping restore sensitivity after adaptation. This supports treating contrast as part of an attentional signal-detection system, not simply as a passive visual variable. ([PMC][3])

There is also evidence that complex perceptual-attentional training can improve contrast sensitivity. Li, Polat, Makous, and Bavelier reported that action video game training enhanced the contrast sensitivity function, suggesting that demanding perceptual-attentional activities can improve basic visual signal extraction. ([Nature][4])

This does not mean that contrast fading alone should be treated as a route to cognitive transfer. The stronger interpretation is that contrast can serve as a **signal-quality challenge** inside a broader rule-tracking task. In Cognitive Flow, low-contrast trials can increase the demand on visual selection, attentional stability, and evidence accumulation while the user continues to track a transformation relation.

For the MVP, contrast should therefore remain a late-stage adaptive variable. The user should first understand the rule and show stable same/different tracking at normal contrast. Only then should the app reduce contrast or clarity, and even then it should log screen brightness, device class, and performance separately so that low visibility is not mistaken for weak cognition.

**Implication:**
Contrast should be used positively but narrowly: it is a useful way to increase signal-detection pressure and attentional demand within a rule-tracking task, not the central claim of the intervention. The app can plausibly train performance under lower signal clarity, but broader cognitive transfer must be measured separately.

---

## 16.3 Optic flow and global motion

Optic flow is a strong candidate for a later Motion Flow lane because it is naturally dynamic, relational, and continuous. It is not just “moving dots”. Structured optic flow can represent expansion, contraction, rotation, translation, shear, and spiral-like combinations, which makes it well suited to a same/different transformation-tracking task.

Duffy and Wurtz found that MSTd neurons respond to large-field motion patterns including expansion, rotation, and planar motion, supporting the idea that the visual system has mechanisms sensitive to structured global motion fields. ([PubMed][5]) Wurtz and Duffy further described MSTd responses as forming a continuum from single-component sensitivity to multiple-component sensitivity, which supports treating expansion, rotation, contraction, and spiral-like flows as points within a continuous transformation space rather than only as discrete categories. ([PubMed][6])

This matters for the updated Motion Flow specification. The two cleanest dimensions are:

> **flow angle** and **flow speed.**

Flow angle is the balance between radial and tangential motion. Pure expansion, pure contraction, pure rotation, and spirals can be treated as special cases in this space. Speed then controls the magnitude or rate of the motion field. This gives Motion Flow a clear analogue of the Visual Patterns lane:

| Visual Patterns             | Motion Flow               |
| --------------------------- | ------------------------- |
| Gabor orientation angle     | flow angle / spiral angle |
| spatial frequency / spacing | flow speed / motion rate  |
| contrast                    | dot contrast / coherence  |
| colour theme                | aesthetic wrapper         |

This makes Motion Flow scientifically attractive because it can test whether users learn an abstract relation such as “same amount of change” across static and dynamic perceptual families.

The caveat is technical rather than conceptual. Optic-flow perception depends on timing, dot density, dot lifetime, coherence, contrast, refresh rate, screen size, and viewing conditions. These parameters can vary substantially across mobile devices. Therefore, Motion Flow should be treated as a v1.1 or experimental lane until device-level calibration is complete.

**Implication:**
Motion Flow is more than plausible: it is a theoretically rich transfer wrapper because it turns relational tracking into dynamic global-motion tracking. However, it should be piloted after Visual Patterns, with flow angle and flow speed as the primary dimensions and polarity controlled initially at block level.

---

## 16.4 Working memory and n-back

The working-memory training literature is mixed, but it should not be read as simply negative. Melby-Lervåg, Redick, and Hulme found reliable improvements on intermediate transfer measures, including verbal and visuospatial working-memory outcomes, but did not find convincing far-transfer evidence to nonverbal ability, verbal ability, reading, arithmetic, or similar broad outcomes when working-memory training was compared with treated controls. ([Sage Journals][7])

That result is important because it shows both sides of the evidence. It warns against claiming that any n-back-style task will raise intelligence, but it also supports the idea that working-memory training can improve trained and related updating functions. Cognitive Flow should therefore avoid presenting itself as a standard n-back programme.

The stronger rationale is that Cognitive Flow uses n-back structure as a **load mechanism**, not as the whole intervention. The user is not matching item identity. They are tracking whether a **transformation relation** is the same across time. In Game 2, the user must hold recent transformation states in memory and compare the current change to an earlier change. In Game 3, the user must update a conjunction rule. This moves the task closer to relational updating and rule abstraction than standard item-matching n-back.

**Implication:**
The app should not claim broad far transfer from n-back load alone. Its working-memory component is best described as maintaining and updating perceptual relations under load. The most defensible expected transfer is to similar updating, visual working-memory, and relational comparison tasks, with far transfer measured as an exploratory outcome.

---

## 16.5 Sensory discrimination and working-memory interaction

The strongest bridge between sensory training and cognitive training comes from studies showing that sensory discrimination can interact with working memory when stimuli vary across trials and must be compared, maintained, and updated.

Zhang et al. provide especially relevant evidence. They found that auditory frequency and duration discrimination ability correlated with tone n-back working-memory performance. They also found bidirectional transfer under some conditions: variable-frequency discrimination training transferred to working-memory learning, and working-memory training transferred back to auditory discrimination. Crucially, fixed-frequency training did not show the same pattern. The authors argued that the key mechanism involved across-trial stimulus variation and the management of interference or updating demands. ([PLOS][8])

This maps closely onto Cognitive Flow. The app is not just asking whether two stimuli differ. It is asking whether a transformation relation continues or breaks, across variable sequences, with 1-back and 2-back structure. That means the sensory component is deliberately coupled to working-memory updating.

This strengthens the scientific rationale considerably. The likely active ingredient is not “sensory sharpening” alone. It is:

> **variable sensory discrimination under relational working-memory control.**

**Implication:**
Cognitive Flow should emphasise the interaction between sensory variation and working-memory updating. The task becomes more cognitively meaningful because the user must hold, compare, and revise transformation relations across trials.

---

## 16.6 Perceptual-discrimination training versus working-memory training

Covey, Shucard, and Shucard provide a particularly relevant precedent because they directly compared adaptive n-back working-memory training with adaptive visual-search/perceptual-discrimination training. Both training protocols lasted 20 sessions over approximately four weeks, and the perceptual-discrimination task was designed to target perceptual discrimination without working-memory demands while being matched to the n-back task for difficulty and engagement. ([ScienceDirect][9])

This is useful because it shows that perceptual-discrimination training and working-memory training are separable but potentially complementary mechanisms. The study title and abstract emphasise overlapping and distinct neurocognitive processes, and the bibliographic record confirms that the work focused on ERP evidence and transfer of training gains. ([SUNY Research Connect][10])

For Cognitive Flow, the value of this evidence is not that it proves the combined paradigm will work. Rather, it supports the logic that perceptual discrimination and working-memory updating can be combined in a principled way. Cognitive Flow’s novelty is that it does not merely place the two tasks side by side. It integrates them into a single paradigm in which the user tracks perceptual transformations across memory lags.

**Implication:**
The Cognitive Flow paradigm has a meaningful empirical precedent: perceptual-discrimination and working-memory mechanisms can each affect training outcomes, and the proposed app combines them in a single relational task. Direct validation is still required, but the combination is not arbitrary.

---

## 16.7 Combined sensory-cognitive training

Combined sensory-cognitive training is already an active intervention direction, especially in ageing and clinical contexts. Kawata et al. randomised healthy older adults into auditory-cognitive, auditory-only, cognitive-only, and active-control groups. Their design manipulated both auditory difficulty and cognitive task difficulty, and they used behavioural and MRI outcomes to evaluate training effects. The study found that auditory and cognitive components affected different outcomes, and it reported training-related brain plasticity measures in older adults. ([Frontiers][11])

This evidence is not a direct demonstration that a Gabor or optic-flow app will improve reasoning. However, it does support an important general principle: sensory training and cognitive training can be combined systematically, and the interaction between sensory challenge and cognitive challenge can be studied experimentally rather than treated as speculation.

The relevance to Cognitive Flow is architectural. Cognitive Flow similarly combines a sensory manipulation layer with cognitive-control demands. In Visual Patterns, the sensory layer is angle, spacing, and contrast. In Motion Flow, the sensory layer is flow angle, speed, coherence, and contrast. The cognitive layer is relation tracking, same/different judgement, 1-back/2-back updating, and conjunction-rule monitoring.

**Implication:**
Combined sensory-cognitive training is a real research category. Cognitive Flow should be framed as a novel visual/perceptual-relational member of that category, with its own validation plan rather than borrowing direct claims from auditory ageing work.

---

## 16.8 Relational integration

Relational integration is central because Cognitive Flow is not primarily a sensory-threshold game. The user is learning to compare **relations between transformations**.

The uploaded Wang, Sun, and Xiao paper is relevant because it tested relational integration training using 1-back and 2-back relational comparison tasks. The study treated relational integration as a key subcomponent of working memory and a strong predictor of fluid intelligence, and it reported EEG microstate changes interpreted as modulation of frontoparietal networks associated with fluid intelligence. ([ResearchGate][12])

The behavioural transfer evidence should still be interpreted cautiously. Neural modulation is not the same as proving broad behavioural far transfer. However, the design principle is highly relevant: training should target relations, not just items. Cognitive Flow operationalises this with perceptual transformations rather than numerical or symbolic relations.

This is the strongest theoretical bridge from the task to fluid-intelligence-style outcomes. Matrix reasoning and abstract reasoning tasks depend heavily on tracking transformations, relations, and invariants. Cognitive Flow trains a pre-semantic version of that operation:

> **detect the relation, hold it briefly, compare it with a new relation, and update when the rule changes.**

**Implication:**
The relevant target is not item memory, and not sensory discrimination alone. It is relation-between-transformations. This makes Cognitive Flow closer to relational working-memory training than to ordinary n-back or simple perceptual learning.

---

## 16.9 Speed-of-processing and visual-attention transfer

The Useful Field of View literature provides one of the strongest precedents for broader transfer from adaptive visual training. UFOV training is not simple sensory discrimination: it combines visual processing speed, divided attention, selective attention, peripheral detection, and adaptive challenge. Edwards et al. reviewed 44 UFOV studies from 17 randomised trials and reported effects on speed of processing and attention, with some transfer to everyday functional outcomes and evidence for durability of trained-skill improvements. ([PubMed][13])

This is highly relevant to the claim posture for Cognitive Flow. It suggests that broad transfer is more plausible when the task trains a functionally meaningful visual-attentional process, not when it merely sharpens one narrow sensory threshold. Cognitive Flow should therefore be described as **adaptive perceptual-relational training**, not just sensory discrimination training.

The strongest analogy is not “UFOV proves Cognitive Flow will transfer”. The stronger and more accurate analogy is:

> **adaptive visual tasks can show transfer when they combine perceptual challenge with attention, timing, and controlled task demands.**

Cognitive Flow extends this logic into transformation tracking, working-memory updating, and relational comparison.

**Implication:**
Cognitive Flow’s transfer hypothesis is more credible when framed around adaptive visual attention, processing efficiency, rule tracking, and updating under load, rather than around raw sensory sharpening.

---

## 16.10 Overall evidence interpretation

The evidence base supports a **layered transfer hypothesis**.

The strongest evidence is for improvement on trained and closely related perceptual discriminations. The next strongest evidence concerns transfer to related perceptual, attentional, and processing-speed tasks, especially when training is adaptive, variable, and attentionally demanding. There is also meaningful evidence that sensory discrimination can interact with working memory when the task requires across-trial comparison and updating. Relational integration evidence supports the idea that relation-based training is more relevant to fluid-intelligence-style outcomes than item-matching alone.

The remaining open question is whether the **specific Cognitive Flow combination** produces reliable transfer beyond the trained task. That should be treated as the central empirical question, not assumed in advance.

**Revised implication:**

> **Cognitive Flow is not relying on sensory discrimination alone. Its transfer hypothesis rests on the combination of adaptive sensory discrimination, relational transformation tracking, working-memory updating, varied wrappers, and portability testing. The evidence base supports this as a plausible and testable pathway, with strongest expectations for near and intermediate transfer and exploratory expectations for broader reasoning outcomes.**

[1]: https://www.nature.com/articles/387401a0?utm_source=chatgpt.com "Task difficulty and the specificity of perceptual learning | Nature"
[2]: https://journals.sagepub.com/doi/10.1068/ic406?utm_source=chatgpt.com "Visual Perceptual Learning and its Specificity and Transfer: A New Perspective - Cong Yu, 2011"
[3]: https://pmc.ncbi.nlm.nih.gov/articles/PMC2633480/?utm_source=chatgpt.com "How do attention and adaptation affect contrast sensitivity? - PMC"
[4]: https://www.nature.com/articles/nn.2296?utm_source=chatgpt.com "Enhancing the contrast sensitivity function through action video game training | Nature Neuroscience"
[5]: https://pubmed.ncbi.nlm.nih.gov/1875243/?utm_source=chatgpt.com "Sensitivity of MST neurons to optic flow stimuli. I. A continuum of response selectivity to large-field stimuli - PubMed"
[6]: https://pubmed.ncbi.nlm.nih.gov/1599144/?utm_source=chatgpt.com "Neuronal correlates of optic flow stimulation - PubMed"
[7]: https://journals.sagepub.com/doi/10.1177/1745691616635612?utm_source=chatgpt.com "Working Memory Training Does Not Improve Performance on Measures of Intelligence or Other Measures of “Far Transfer” - Monica Melby-Lervåg, Thomas S. Redick, Charles Hulme, 2016"
[8]: https://journals.plos.org/plosone/article?id=10.1371%2Fjournal.pone.0147320&utm_source=chatgpt.com "Auditory Discrimination Learning: Role of Working Memory | PLOS One"
[9]: https://www.sciencedirect.com/science/article/abs/pii/S001002771830218X?utm_source=chatgpt.com "Working memory training and perceptual discrimination training impact overlapping and distinct neurocognitive processes: Evidence from event-related potentials and transfer of training gains - ScienceDirect"
[10]: https://researchconnect.suny.edu/en/publications/working-memory-training-and-perceptual-discrimination-training-im/?utm_source=chatgpt.com "Working memory training and perceptual discrimination training impact overlapping and distinct neurocognitive processes: Evidence from event-related potentials and transfer of training gains - SUNY Research Connect"
[11]: https://www.frontiersin.org/journals/aging-neuroscience/articles/10.3389/fnagi.2022.826672/full?utm_source=chatgpt.com "Frontiers | Auditory Cognitive Training Improves Brain Plasticity in Healthy Older Adults: Evidence From a Randomized Controlled Trial"
[12]: https://www.researchgate.net/publication/388279701_Relational_Integration_Training_Modulated_the_Frontoparietal_Network_for_Fluid_Intelligence_An_EEG_Microstates_Study?utm_source=chatgpt.com "Relational Integration Training Modulated the Frontoparietal Network for Fluid Intelligence: An EEG Microstates Study | Request PDF"
[13]: https://pubmed.ncbi.nlm.nih.gov/29175362/?utm_source=chatgpt.com "Systematic review and meta-analyses of useful field of view cognitive training - PubMed"

---

# 17. Evidence synthesis

| Claim                                                                                          | Evidence status                                                                                                                   | Recommended use                             |
| ---------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| Users can improve trained Gabor orientation/SF discrimination                                  | Strong evidence from visual perceptual learning                                                                                   | Safe                                        |
| Users can improve trained contrast/signal-detection performance                                | Good evidence that contrast sensitivity is trainable, but gains may be stimulus- and task-specific                                | Safe if framed narrowly                     |
| Users can improve trained transformation tracking                                              | Strongly plausible and directly testable within the app                                                                           | Safe                                        |
| Users may transfer to similar untrained Gabor or visual-rule variants                          | Plausible to moderately supported, especially when training begins with easier/generalising conditions and uses wrapper variation | Measure and report                          |
| Users can improve trained optic-flow / global-motion discrimination                            | Plausible and grounded in optic-flow neuroscience, but requires device and stimulus calibration                                   | Measure first                               |
| Users can improve trained flow-angle and flow-speed tracking                                   | Plausible and technically coherent, but requires pilot calibration                                                                | Measure first                               |
| Users may transfer across visual pattern variants, colour themes, timings, and stimulus ranges | Plausible near/intermediate transfer                                                                                              | Measure and report                          |
| Users may transfer from Visual Patterns to Motion Flow                                         | Ambitious but testable portability hypothesis                                                                                     | Treat as key validation target, not a claim |
| Users may improve visual attention or processing-speed tasks                                   | Moderately plausible, with UFOV/speed-of-processing training as a relevant precedent                                              | Measure cautiously                          |
| Users may improve working-memory updating tasks                                                | Plausible for 2-back and conjunction variants, especially where variable stimulus relations must be maintained and updated        | Treat as exploratory but credible           |
| Users may improve relational reasoning or matrix-style trackers                                | Theoretically plausible because the task trains relation-between-transformations, but unproven for this paradigm                  | Measure, do not promise                     |
| Users will improve IQ/general intelligence                                                     | Not established                                                                                                                   | Avoid                                       |
| The app can identify transfer boundaries                                                       | Strong methodological claim if the Proof layer is implemented transparently                                                       | Safe and strategically useful               |


---

# 18. Proposed validation plan

## 18.1 Near transfer

Use untrained variants of trained stimulus families:

* new orientation ranges
* new spatial-frequency ranges
* new contrast levels
* new flow-angle ranges
* new flow-speed ranges
* new coherence levels
* new timing conditions
* new colour themes

## 18.2 Intermediate transfer

Use:

* visual change-detection tasks
* perceptual rule-tracking tasks
* geometric transformation tasks
* visual search / processing-speed measures
* global motion / optic-flow discrimination tasks
* flow-angle discrimination tasks
* flow-speed discrimination tasks

## 18.3 Working-memory transfer

Use:

* visual 2-back
* non-Gabor relational n-back
* updating tasks with non-identical stimuli
* feature-binding updating tasks

## 18.4 Reasoning transfer

Use:

* ICAR-style matrix reasoning
* abstract pattern completion
* Sandia-like relational matrix tasks, if available and appropriate
* geometric relation-transfer tasks

## 18.5 Portability validation

| Trained relation               | Portability probe                 |
| ------------------------------ | --------------------------------- |
| Gabor orientation change       | optic-flow angle change           |
| Gabor spacing change           | optic-flow speed change           |
| Gabor conjunction rule         | flow angle + speed conjunction    |
| 1-back visual pattern          | 1-back motion pattern             |
| 2-back visual pattern          | 2-back motion pattern             |
| Gabor rule in one colour theme | same rule in another colour theme |
| Outward flow-angle relation    | inward flow-angle relation        |
| Clockwise flow-angle relation  | anticlockwise flow-angle relation |

## 18.6 Control outcomes

Use tasks where transfer is not strongly expected:

* vocabulary
* simple reaction time
* non-visual verbal memory
* semantic knowledge

---

# 19. Backend data model for coaching and proof

The consumer UI hides detail, but the backend should record rich trial-level and session-level data.

## 19.1 Trial-level data

```text
user_id
session_id
trial_index
game_id
stimulus_lane
stimulus_family
colour_theme
n_level
cue_type
trial_type
target_relation
actual_relation
same_or_different
user_response
correct
reaction_time_ms
orientation_angle
spatial_frequency
contrast
flow_angle_degrees
flow_speed
flow_polarity
radial_component
tangential_component
expansion_rate
rotation_rate
coherence
dot_density
dot_lifetime
device_quality_tier
timestamp
```

## 19.2 Session-level data

```text
session_duration
completion_status
balanced_accuracy
same_accuracy
different_accuracy
median_rt
timeout_rate
adaptive_level
difficulty_adjustment
contrast_or_coherence_level
flow_angle_level
flow_speed_level
flow_polarity_context
game_progression_status
error_profile
state_check_result
```

## 19.3 Coaching/pro layer outputs

Reserved for later:

* precision thresholds
* stability of pattern tracking
* Game 1 → Game 2 progression readiness
* conjunction error profile
* training consistency
* delayed re-check performance
* within-family portability
* cross-family portability
* flow-angle tracking stability
* flow-speed tracking stability
* polarity-generalisation profile
* device-quality-adjusted learning curves

---

# 20. Public proof wording

Recommended public claim:

> **Cognitive Flow Pattern Training is designed to train subtle change detection, pattern tracking, and rule updating under load. The app then tests whether these gains transfer to independent cognitive trackers.**

Recommended evidence-page claim:

> **The task is informed by evidence from perceptual learning, working-memory updating, relational integration, optic-flow perception, contrast sensitivity, and sensory-cognitive training. The specific Cognitive Flow combination is novel, so transfer is treated as an empirical question and reported as aggregate evidence accumulates.**

Avoid:

> **Proven to increase IQ.**
> **Clinically validated cognitive enhancement.**
> **Contrast training improves cognition.**
> **Sensory discrimination training produces far transfer to intelligence.**
> **Optic-flow training transfers to real-world reasoning.**
> **Flow-angle training improves intelligence.**

---

# 21. References

Ahissar, M., & Hochstein, S. (1997). Task difficulty and the specificity of perceptual learning. *Nature, 387*(6631), 401–406. [https://doi.org/10.1038/387401a0](https://doi.org/10.1038/387401a0)

Covey, T. J., Shucard, J. L., & Shucard, D. W. (2019). Working memory training and perceptual discrimination training impact overlapping and distinct neurocognitive processes: Evidence from event-related potentials and transfer of training gains. *Cognition, 182*, 50–72. [https://doi.org/10.1016/j.cognition.2018.08.012](https://doi.org/10.1016/j.cognition.2018.08.012)

Duffy, C. J., & Wurtz, R. H. (1991). Sensitivity of MST neurons to optic flow stimuli. I. A continuum of response selectivity to large-field stimuli. *Journal of Neurophysiology, 65*(6), 1329–1345. [https://doi.org/10.1152/jn.1991.65.6.1329](https://doi.org/10.1152/jn.1991.65.6.1329)

Edwards, J. D., Fausto, B. A., Tetlow, A. M., Corona, R. T., & Valdés, E. G. (2018). Systematic review and meta-analyses of useful field of view cognitive training. *Neuroscience & Biobehavioral Reviews, 84*, 72–91. [https://doi.org/10.1016/j.neubiorev.2017.11.004](https://doi.org/10.1016/j.neubiorev.2017.11.004)

Ferguson, M. A., & Henshaw, H. (2015). Auditory training can improve working memory, attention, and communication in adverse conditions for adults with hearing loss. *Frontiers in Psychology, 6*, Article 556. [https://doi.org/10.3389/fpsyg.2015.00556](https://doi.org/10.3389/fpsyg.2015.00556)

Kawata, N. Y. S., Nouchi, R., Oba, K., Matsuzaki, Y., & Kawashima, R. (2022). Auditory cognitive training improves brain plasticity in healthy older adults: Evidence from a randomized controlled trial. *Frontiers in Aging Neuroscience, 14*, Article 826672. [https://doi.org/10.3389/fnagi.2022.826672](https://doi.org/10.3389/fnagi.2022.826672)

Klauer, K. J., & Phye, G. D. (2008). Inductive reasoning: A training approach. *Review of Educational Research, 78*(1), 85–123. [https://doi.org/10.3102/0034654307313402](https://doi.org/10.3102/0034654307313402)

Li, R., Polat, U., Makous, W., & Bavelier, D. (2009). Enhancing the contrast sensitivity function through action video game training. *Nature Neuroscience, 12*(5), 549–551. [https://doi.org/10.1038/nn.2296](https://doi.org/10.1038/nn.2296)

Melby-Lervåg, M., Redick, T. S., & Hulme, C. (2016). Working memory training does not improve performance on measures of intelligence or other measures of “far transfer”: Evidence from a meta-analytic review. *Perspectives on Psychological Science, 11*(4), 512–534. [https://doi.org/10.1177/1745691616635612](https://doi.org/10.1177/1745691616635612)

Milne-Ives, M., Homer, S. R., Andrade, J., & Meinert, E. (2023). Potential associations between behavior change techniques and engagement with mobile health apps: A systematic review. *Frontiers in Psychology, 14*, Article 1227443. [https://doi.org/10.3389/fpsyg.2023.1227443](https://doi.org/10.3389/fpsyg.2023.1227443)

Orban, G. A., Lagae, L., Raiguel, S., Xiao, D., & Maes, H. (1995). The speed tuning of medial superior temporal (MST) cell responses to optic-flow components. *Perception, 24*(3), 269–285. [https://doi.org/10.1068/p240269](https://doi.org/10.1068/p240269)

Pestilli, F., Viera, G., & Carrasco, M. (2007). How do attention and adaptation affect contrast sensitivity? *Journal of Vision, 7*(7), Article 9. [https://doi.org/10.1167/7.7.9](https://doi.org/10.1167/7.7.9)

Wang, Z., Sun, T., & Xiao, F. (2025). Relational integration training modulated the frontoparietal network for fluid intelligence: An EEG microstates study. *Brain Topography, 38*, Article 24. [https://doi.org/10.1007/s10548-024-01099-3](https://doi.org/10.1007/s10548-024-01099-3)

Wurtz, R. H., & Duffy, C. J. (1992). Neuronal correlates of optic flow stimulation. *Annals of the New York Academy of Sciences, 656*, 205–219. [https://doi.org/10.1111/j.1749-6632.1992.tb25210.x](https://doi.org/10.1111/j.1749-6632.1992.tb25210.x)

Yu, C. (2011). Visual perceptual learning and its specificity and transfer: A new perspective. *i-Perception, 2*(7), 873–875. [https://doi.org/10.1068/ic406](https://doi.org/10.1068/ic406)

Zhang, Y.-X., Moore, D. R., Guiraud, J., Molloy, K., Yan, T.-T., & Amitay, S. (2016). Auditory discrimination learning: Role of working memory. *PLOS ONE, 11*(1), Article e0147320. [https://doi.org/10.1371/journal.pone.0147320](https://doi.org/10.1371/journal.pone.0147320)

[1]: https://pubmed.ncbi.nlm.nih.gov/1875243/?utm_source=chatgpt.com "Sensitivity of MST neurons to optic flow stimuli. I. A continuum of response selectivity to large-field stimuli - PubMed"
[2]: https://pubmed.ncbi.nlm.nih.gov/1599144/?utm_source=chatgpt.com "Neuronal correlates of optic flow stimulation - PubMed"
