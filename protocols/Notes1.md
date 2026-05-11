# **Cognitive Flow**
 
The key product distinction is:

| App layer                       |                                  Name |         MVP status | Purpose                                                                     |
| ------------------------------- | ------------------------------------: | -----------------: | --------------------------------------------------------------------------- |
| Core training and tracking task |                        **Zone Coach** |                Yes | 3-minute pre-semantic MFT-M training and CCC tracking                       |
| State-matched support actions   |                      **Flow Actions** |                Yes | brief reset, widening, or activation actions when the user is not trainable |
| Later training layer            | **Seeing Patterns / Relational Flow** |              Later | relational transformation training, gated by Zone Coach                     |
| Objective reasoning outcome     |           **Reasoning Transfer Test** |   Yes / early beta | short ICAR-based pre/post reasoning tracker                                 |
| Subjective flow outcome         |             **Flow Experience Check** |   Yes / early beta | short validated flow-experience check using the Flow Short Scale / FKS      |
| Evidence layer                  |              **Cognitive Flow Proof** | Website / internal | aggregate CCC, transfer, subjective flow, retention, and boundary reporting |

This makes **Cognitive Flow** an apt app name. It captures the full system: training attention control, tracking flow-readiness, routing the next action, measuring whether reasoning performance changes over time, and checking whether users actually experience more psychological flow.

---

# 2. Core product positioning — revised

### Product name

# **Cognitive Flow**

### Core feature

# **Zone Coach**

### Later training mode

# **Seeing Patterns**

Technical name: **Relational Flow**

### Objective reasoning tracker

# **Reasoning Transfer Test**

ICAR-based independent cognitive outcome measure.

### Subjective flow tracker

# **Flow Experience Check**

Psychological flow-experience measure.

### Suggested subtitle

> **Train attention control. Track cognitive capacity. Measure flow experience.**

### Simple product promise

> **A 3-minute cognitive control task that trains your focus state and tracks whether your capacity improves over time.**

### Public-facing description

> **Cognitive Flow uses a short visual attention-control task to train cognitive control, estimate your current flow-readiness, and guide your next action. Over time, it tracks whether your cognitive control capacity, independent reasoning outcomes, and subjective flow experience improve.**

### Claims to use

* Uses an MFT-M-derived behavioural attention-control task.
* Trains attention control under uncertainty.
* Estimates cognitive control capacity in bits per second.
* Tracks CCC trajectory over repeated sessions.
* Routes users to training, reset, widening, or activation depending on current state.
* Measures transfer using a short ICAR-based reasoning tracker.
* Measures subjective psychological flow separately using a short flow-experience check.
* Publishes aggregate outcomes and claims boundaries as evidence accumulates.

### Claims to avoid

* Proven to increase IQ.
* Diagnoses cognitive state.
* Treats anxiety, ADHD, burnout, depression, or insomnia.
* Induces flow state.
* Measures the brain directly.
* Guarantees far transfer.

The wording should move away from “wellness app” and towards:

> **evidence-generating cognitive-control training.**

Flow Actions remain part of the experience, but they should be framed as **training-readiness supports**, not as the core product.

---

# 3. System architecture — revised

## 3.1 Cognitive Flow app structure

Cognitive Flow should be organised as:

```text
Zone Coach → State Result → Continue / Flow Action → Optional Re-check / Done
```

Later, when Seeing Patterns / Relational Flow is enabled:

```text
Zone Coach → State Result → Seeing Patterns if suitable
                         → Flow Action if not suitable
                         → Reasoning Transfer Test at pre/post intervals
                         → Flow Experience Check at selected intervals
```

The Relational Flow source already makes Zone Coach sequentially required: Relational Flow is a Level 2 module with Zone Coach as prerequisite, runs after a 3-minute Zone Coach gate, and is explicitly parameterised by the Zone Coach regime classification. 

So the recommended architecture is:

| Component                             | Role                                                                                  |
| ------------------------------------- | ------------------------------------------------------------------------------------- |
| **Zone Coach**                        | Core attention-control training and tracking task                                     |
| **Flow Actions**                      | State-matched micro-interventions to restore trainability                             |
| **Seeing Patterns / Relational Flow** | Later transformation-relation training module                                         |
| **Reasoning Transfer Test**           | Short ICAR-based pre/post reasoning outcome tracker                                   |
| **Flow Experience Check**             | Short psychological flow-experience tracker                                           |
| **Proof layer**                       | Aggregate CCC, reasoning transfer, flow experience, responder, and boundary reporting |

---

## 3.2 Consumer layer versus backend layer

| Layer                   | User sees                                   | Backend records                                                        |
| ----------------------- | ------------------------------------------- | ---------------------------------------------------------------------- |
| Trial                   | simple visual task                          | ET, dimension, set size, ratio, response, RT, accuracy                 |
| Session                 | one state label and one next action         | CCC trajectory, SE, residual stream, ξ, δ, regime classification       |
| Flow Action             | one short guided exercise                   | action offered, completed, skipped, post-action re-check               |
| Progress                | weekly dots or simple heatmap               | posterior regime distribution, stability, recovery, adherence          |
| Reasoning Transfer Test | occasional short reasoning tracker          | ICAR item family scores, total score, timing, confidence               |
| Flow Experience Check   | occasional short subjective flow reflection | absorption, smoothness, concern/worry, subjective flow profile         |
| Coaching                | optional later insight                      | detailed profile, response patterns, action efficacy, transfer pattern |

The uploaded Zone MVP already points to this separation: it specifies a minimal abstract visual language, no score counters cluttering the stimulus display, a Zone Map shown between trials rather than during stimulus presentation, and a session heatmap as the main cross-session feedback mechanism. 

---

# 4. Zone Coach specification — revised emphasis

## 4.1 Purpose

**Zone Coach** is the core Cognitive Flow game. It should not be framed as a passive check-in. It is a brief, repeated **attention-control training task** that also estimates the user’s state.

Its primary training target is:

> **capacity of cognitive control: the rate at which the user can allocate attention flexibly under uncertainty.**

The uploaded spec defines four qualitative regime states, each with a distinct MFT-M signature, probe signature, and training response. These states are used to adapt task difficulty and recommend next action. 

For users, the labels should remain simple:

| Backend state   | Consumer label   | Plain meaning               |
| --------------- | ---------------- | --------------------------- |
| **In the Zone** | **In Flow**      | ready for focused challenge |
| **Flat**        | **Low Spark**    | steady but under-engaged    |
| **Locked In**   | **Narrow Focus** | sharp but rigid             |
| **Spun Out**    | **Scattered**    | overloaded or unstable      |

## 4.2 Scientific foundation — rewritten

The original MFT-M manipulates information rate by varying stimulus uncertainty and exposure time. Wu et al. used the relationship between response accuracy and information rate to estimate **capacity of cognitive control**, expressed in bits per second. Their key finding was that CCC is approximately **3–4 bps**, suggesting that high-level cognitive control is sharply capacity-limited. ([Nature][1])

This is strategically important for Cognitive Flow because CCC gives the app a principled primary outcome:

> **Does the user’s estimated cognitive control capacity improve over repeated training sessions?**

The Zone Coach source already treats CCC as a trial-updated metric derived from grouping-search maximum-likelihood estimation, with session-level CCC, estimation stability, regime distribution, zone time, recovery speed, and trajectory stored in the backend. 

Zhang et al. provide the strongest direct training precedent. Their study used MFT-M as an **attention-control training task**, not only as a measurement tool. Participants were healthy young adults, randomised to either MFT-M training or a sham programme for seven consecutive days. After training, the MFT-M group showed transfer to selected ANT-R attention conditions and verbal-memory learning trials, alongside ERP changes in 2-back and task-switching tasks. ([ScienceDirect][2])

This gives Zone Coach a dual role:

| Role              | Meaning                                                                                           |
| ----------------- | ------------------------------------------------------------------------------------------------- |
| **Training task** | repeated practice near the CCC boundary trains flexible allocation of attention under uncertainty |
| **Tracking task** | the same behavioural data estimate CCC, regime state, recovery, and longitudinal trajectory       |

Cognitive Flow adapts MFT-M by replacing arrows with pre-semantic visual dimensions: orientation gratings, spatial-frequency patches, and luminance discs. The source spec argues that these dimensions lie on continuous manifolds and avoid semantic shortcuts that could allow users to solve the task through compiled verbal or symbolic categories. 

The claim posture should be:

> **Cognitive Flow uses a pre-semantic mobile adaptation of an MFT-M attention-control training task. The app tracks whether CCC improves over time and tests whether gains transfer to independent cognitive outcomes.**

Avoid:

> **The pre-semantic adaptation has already been proven to produce identical transfer effects.**

A stronger, grant-safe formulation is:

> **The expected mechanism is similar to MFT-M attention-control training, but the specific pre-semantic mobile implementation will be validated directly.**

---

# 5. Reasoning Transfer Test — new section

## 5.1 Purpose

Cognitive Flow needs a short independent outcome test so that the app is not relying only on task-specific Zone Coach improvement. The test should estimate whether repeated Zone Coach training, and later Seeing Patterns / Relational Flow training, is associated with improvement on independent reasoning tasks.

To avoid confusing reasoning outcomes with psychological flow, this measure should **not** be called a “flow test”. The recommended name is:

# **Reasoning Transfer Test**

Subtitle:

> **A short reasoning tracker built from public-domain ICAR item families.**

## 5.2 Why ICAR

The International Cognitive Ability Resource was developed as a public-domain cognitive ability measure suitable for large-scale and remote data collection. Its initial validation reported high general-factor saturation, consistent primary factor loadings across item types, strong corrected correlations with Shipley-2, and evidence of discriminative validity. ([ScienceDirect][3])

The ICAR item families include Three-Dimensional Rotation, Letter and Number Series, Matrix Reasoning, Verbal Reasoning, Progressive Matrices, Number Series, and Perceptual Maze, with the original validation focusing on the first four item types. ([ICAR Project][4])

This makes ICAR suitable for Cognitive Flow because it is:

* public-domain
* remote-administration friendly
* already structured around multiple cognitive ability item families
* compatible with pre/post tracking
* less legally problematic than proprietary IQ-test materials

## 5.3 Recommended test format

The most defensible short form is a **16-item ICAR-style tracker**, because the published ICAR work evaluated a 16-item sample test with four items each from the first four item families. ([ResearchGate][5])

### Recommended default

# **Reasoning Transfer Test — 16 item version**

| Item family                           | Items | Purpose                                    |
| ------------------------------------- | ----: | ------------------------------------------ |
| ICAR Matrix Reasoning                 |     4 | abstract nonverbal reasoning               |
| ICAR Letter and Number Series         |     4 | sequence induction and rule discovery      |
| ICAR Three-Dimensional Rotation / R3D |     4 | spatial transformation and mental rotation |
| ICAR Verbal Reasoning                 |     4 | broader reasoning / verbal abstraction     |

Estimated time:

```text
8–12 minutes
```

Use:

```text
Baseline → day 7 or session 7 → day 21/30 follow-up
```

This gives a short but credible pre/post outcome measure without making the main app feel like a formal IQ test.

## 5.4 Optional ultra-short version

An **8-item Reasoning Pulse** can be used for onboarding or periodic light checks, but it should not be treated as the main validation outcome.

| Item family              | Items |
| ------------------------ | ----: |
| Matrix Reasoning         |     2 |
| Letter and Number Series |     2 |
| R3D                      |     2 |
| Verbal Reasoning         |     2 |

Use label:

> **Reasoning Pulse**

Evidence status:

> **engagement-friendly progress check, not the primary transfer measure.**

## 5.5 Alternate forms

The app should use alternate forms to reduce practice effects.

| Timepoint     | Test                                         |
| ------------- | -------------------------------------------- |
| Baseline      | RTT-16 Form A                                |
| Post-training | RTT-16 Form B                                |
| Follow-up     | RTT-16 Form C, if enough items are available |

If item supply is limited, the app should randomise item order and avoid over-frequent retesting.

## 5.6 Outcome variables

Primary outcome:

```text
Reasoning Transfer Test total score
```

Secondary outcomes:

```text
Matrix Reasoning score
Letter/Number Series score
R3D score
Verbal Reasoning score
response time per item
completion time
confidence rating
```

Exploratory links to Zone Coach:

```text
CCC change → Reasoning Transfer Test total change
Zone time change → reasoning change
recovery speed change → Matrix/Series change
regime stability → reasoning test reliability
```

## 5.7 Claims posture

Use:

> **Cognitive Flow includes a short ICAR-based reasoning tracker to test whether gains extend beyond the training task.**

Avoid:

> **This is a full IQ test.**

Avoid:

> **This proves your IQ has increased.**

Better:

> **This gives an independent reasoning snapshot based on public-domain cognitive ability item families.**

---

# 6. Flow Experience Check — new section

## 6.1 Purpose

Cognitive Flow should also include a short subjective measure of **psychological flow**. This should be separate from the Reasoning Transfer Test. Reasoning tests measure objective cognitive outcomes; the Flow Experience Check measures how absorbed, smooth, and in control the user felt during a task or focus period.

Recommended name:

# **Flow Experience Check**

Subtitle:

> **A short reflection on how smooth, absorbed, and in control the session felt.**

This measure answers a different question:

> **Does the behavioural “In Flow” state correspond to the user’s subjective experience of flow?**

## 6.2 Recommended public instrument: Flow Short Scale / FKS

The strongest public candidate is the **Flow Short Scale / Flow-Kurzskala (FKS)** by Rheinberg, Vollmeyer, and Engeser. PsychArchives / Open Test Archive describes the FKS as a 16-item measure of flow experience with three factors: smooth automated progression, absorption, and concern. The archive reports internal consistency around **α = .90**, concern-component reliability between **α = .80 and .90**, and makes questionnaire materials available under **Public Use / CC-BY-SA 4.0** terms. ([PsychArchives][6])

This makes FKS suitable for Cognitive Flow because it is:

* short
* state-oriented
* suitable after a concrete activity
* publicly accessible through a reputable psychological test archive
* directly aligned with psychological flow rather than reasoning ability

Because CC-BY-SA has attribution and sharing obligations, the exact implementation should be checked before commercial embedding. The conservative approach is to use the official materials with correct attribution, or to use the scale initially in research/proof mode rather than as a fully branded proprietary in-app instrument.

## 6.3 Timing

The Flow Experience Check should not be shown after every Zone Coach session. Frequent flow questionnaires could increase self-monitoring and reduce the experience being measured.

Recommended timing:

| Timepoint     | Use                                         |
| ------------- | ------------------------------------------- |
| Baseline      | after first Zone Coach or first focus block |
| Post-training | after session 7 or day 7                    |
| Follow-up     | day 21 or day 30                            |
| Optional      | after selected “In Flow” focus blocks       |
| Research beta | before/after state-action validation blocks |

## 6.4 Outcome variables

Primary outcomes:

```text
flow_total
smooth_automated_progression
absorption
concern_or_worry
```

Exploratory links to Zone Coach:

```text
In Flow classification → higher flow_total
Zone time_pct → higher absorption
Recovery speed → lower concern/worry
CCC trajectory → flow_total change
Flow Action completion → later flow_total
```

## 6.5 Routine in-app micro-pulse

For routine app use, a very short non-validated pulse may be used, but it should not be labelled as the validated FKS.

Example:

> **How did that feel?**
> Smooth
> Absorbed
> Effortful

Backend label:

```text
app_experience_pulse
not_validated_flow_scale
```

This can support personalisation without overburdening the user.

## 6.6 Claims posture

Use:

> **Cognitive Flow includes a short flow-experience check to test whether behavioural training states align with subjective flow.**

Avoid:

> **The app proves you were in flow.**

Avoid:

> **The app induces psychological flow.**

Better:

> **The app measures behavioural flow-readiness and separately samples subjective flow experience.**

---

# 7. Relationship to Seeing Patterns / Relational Flow — revised

Relational Flow should remain the technical name for the later Level 2 module. For users, the in-app label should be simpler:

# **Seeing Patterns**

This works because the user does not need to know about relational n-back, SR maps, successor representations, or transformation classes. The Relational Flow source already states that transformation-class vocabulary belongs in the data layer, while user-facing text should name recognisable cognitive skills or states. 

Recommended naming:

| Context                    | Name                                            |
| -------------------------- | ----------------------------------------------- |
| Grant / technical document | **Relational Flow**                             |
| App navigation             | **Seeing Patterns**                             |
| Website explanation        | **Seeing Patterns: powered by Relational Flow** |
| Evidence page              | **Relational Flow training protocol**           |

The source specification presents Relational Flow as Level 2, dependent on Zone Coach, with a 12–15 minute session after the Zone Coach gate and every-other-day pacing. It also defines transfer targets such as analogy, generalisation, perspective-taking, pattern recognition, problem decomposition, momentum/resolution reading, cycle recognition, and differential change detection. 

Revised app hierarchy:

```text
Cognitive Flow
├── Zone Coach              core MVP: train and track cognitive control
├── Flow Actions            state-matched reset / activation / widening
├── Reasoning Transfer Test short ICAR-based objective outcome tracker
├── Flow Experience Check   subjective psychological flow measure
├── Seeing Patterns         consumer-facing Level 2 training
├── Relational Flow         technical protocol behind Seeing Patterns
└── Proof                   aggregate evidence layer
```

---

# 8. Evidence review — revised emphasis

## 8.1 MFT-M and cognitive control capacity

The strongest scientific anchor is MFT-M. Wu et al. provided a quantitative model of cognitive control capacity by manipulating information entropy and exposure time in a perceptual decision-making task, estimating CCC at approximately **3–4 bits per second**. ([Nature][1])

For Cognitive Flow, this gives the app a measurable training target:

> **increase the user’s reliable cognitive control capacity over repeated sessions.**

The app should therefore track:

* CCC in bits per second
* standard error of CCC
* CCC trajectory over sessions
* zone time
* recovery speed
* regime stability
* relationship between CCC change and Reasoning Transfer Test change
* relationship between Zone state and Flow Experience Check scores

## 8.2 Zhang et al. and MFT-M as training

Zhang et al. are central because they treat MFT-M as a **training intervention**, not merely an assessment. Their study trained healthy young adults on MFT-M for seven consecutive days against a sham training control. The abstract reports transfer to selected ANT-R attention outcomes and verbal-memory learning trials, plus ERP changes on 2-back and task-switching tasks. ([ScienceDirect][2])

This supports the central design claim:

> **Zone Coach is a training task first and a state tracker second.**

More precisely:

> **Zone Coach trains attention control by repeatedly challenging users to allocate attention dynamically and flexibly under uncertainty, while simultaneously estimating the user’s CCC and regime state.**

The pre-semantic adaptation is intended to preserve the MFT-M control demand while reducing semantic shortcutting. The source specification explicitly replaces arrows with continuous pre-semantic dimensions: orientation gratings, spatial-frequency patches, and luminance discs. 

## 8.3 Independent reasoning outcome testing

Because improvements on Zone Coach could partly reflect task-specific learning, Cognitive Flow should include an independent reasoning tracker. ICAR is appropriate because it was developed as a public-domain resource for large-scale remote cognitive ability assessment, and its initial validation reported strong general-factor and validity evidence. ([ScienceDirect][3])

The **Reasoning Transfer Test** should therefore be a short ICAR-based pre/post battery, not a proprietary IQ test. Recommended first implementation:

```text
RTT-16 = 4 Matrix Reasoning + 4 Letter/Number Series + 4 R3D + 4 Verbal Reasoning
```

The primary transfer question is:

> **Do users who improve in CCC and Zone time also improve on independent ICAR-based reasoning outcomes?**

Secondary question:

> **Does adding Seeing Patterns / Relational Flow produce stronger transfer to Matrix Reasoning, Series, and R3D than Zone Coach alone?**

## 8.4 Subjective psychological flow testing

Cognitive Flow should not equate behavioural Zone Coach classification with subjective flow experience. The app should treat these as related but distinct constructs.

The **Flow Experience Check** should use the Flow Short Scale / FKS where possible. PsychArchives describes the FKS as a 16-item flow-experience measure with factors including smooth automated progression, absorption, and concern, and reports strong internal consistency. ([PsychArchives][6])

The key validation questions are:

> **Do In Flow classifications predict higher subjective flow-experience scores?**

> **Do Flow Actions increase later subjective flow experience when users begin Scattered, Narrow Focus, or Low Spark?**

> **Do CCC gains, Zone time, and subjective flow experience move together or dissociate?**

This is important because the app is called **Cognitive Flow**, but its claims should remain precise:

* Zone Coach estimates behavioural cognitive-control state.
* Reasoning Transfer Test measures objective reasoning transfer.
* Flow Experience Check measures subjective psychological flow.

## 8.5 Flow Actions as training-readiness supports

Flow Actions are not the core evidence claim. They are short support actions designed to help users return to a trainable state. Breathwork has RCT/meta-analytic support as a low-burden stress-management intervention, with Fincham et al. reporting lower self-reported stress for breathwork compared with non-breathwork controls. ([Nature][7]) Balban et al. also reported that brief daily cyclic sighing improved mood and reduced respiratory rate compared with mindfulness meditation in a remote randomised study. ([Stanford Health Care][8])

Focused-attention and open-monitoring practices provide a plausible basis for the Focus Dot and Open Field actions. Norris et al. reported attentional effects after a brief mindfulness meditation in novices, while Lippelt et al. reviewed differential effects of focused attention and open monitoring on attentional and cognitive-control processes. ([PMC][9])

The app-specific claim should remain narrow:

> **Flow Actions are tested as state-matched training-readiness supports, not as clinical interventions.**

---

# 9. Claims and evidence posture — revised

## Safe public wording

> **Cognitive Flow uses a 3-minute attention-control task inspired by MFT-M research to train and track cognitive control.**

> **The app estimates cognitive control capacity over time and tests whether training gains transfer to independent reasoning tasks.**

> **The app also includes a separate Flow Experience Check to test whether behavioural training states align with subjective psychological flow.**

> **When users are not in a good training state, the app recommends one short action to reset, widen, or activate before continuing.**

## Strong grant wording

> **Cognitive Flow combines a pre-semantic MFT-M-derived attention-control training task with longitudinal CCC estimation, an independent ICAR-based Reasoning Transfer Test, and a validated subjective Flow Experience Check. The central empirical question is whether repeated Zone Coach training increases CCC trajectory, whether CCC gains predict transfer to independent cognitive outcomes, and whether behavioural flow-readiness corresponds to subjective psychological flow.**

## Avoid

* proven IQ increase
* clinical diagnosis
* clinical treatment
* stress-reduction app
* wellness-only positioning
* guaranteed flow induction
* calling the ICAR reasoning tracker a “flow test”

---

# 10. Validation plan — add Reasoning Transfer Test and Flow Experience Check

## Phase 1: usability and task comprehension

Goal:

> Confirm users understand Zone Coach and complete a 3-minute training session without confusion.

## Phase 2: CCC signal validation

Goal:

> Confirm that Zone Coach produces stable CCC estimates and regime classifications over repeated sessions.

Key outcomes:

* CCC_session
* SE_CCC
* zone_time_pct
* recovery speed
* regime classification confidence
* device timing quality

## Phase 3: training response

Goal:

> Test whether repeated Zone Coach use improves CCC trajectory over 5–7 sessions.

Primary outcome:

```text
change in CCC bps
```

Secondary outcomes:

```text
zone time
recovery speed
RT variance
classification stability
```

## Phase 4: independent reasoning transfer

Goal:

> Test whether Zone Coach gains transfer to a short ICAR-based reasoning tracker.

Design:

```text
Baseline Reasoning Transfer Test
7 days Zone Coach
Post Reasoning Transfer Test alternate form
Optional 30-day delayed Reasoning Transfer Test
```

Primary transfer outcome:

```text
RTT-16 total score change
```

Subscale outcomes:

```text
Matrix Reasoning
Letter/Number Series
R3D
Verbal Reasoning
```

Exploratory analyses:

```text
CCC change → RTT change
Zone time change → RTT change
Recovery speed change → Matrix/Series change
Regime stability → RTT reliability
```

## Phase 5: subjective flow validation

Goal:

> Test whether Zone Coach’s behavioural state classifications correspond to subjective psychological flow experience.

Design:

```text
Flow Experience Check after selected Zone Coach sessions
Flow Experience Check after selected focus blocks
Flow Experience Check after Flow Actions + re-check
```

Primary outcomes:

```text
FKS total score
smooth automated progression
absorption
concern/worry
```

Exploratory analyses:

```text
In Flow classification → FKS total
Zone time_pct → absorption
RT variance → concern/worry
CCC change → FKS change
Flow Action completion → later FKS score
```

## Phase 6: additive value of Seeing Patterns / Relational Flow

Goal:

> Test whether adding Seeing Patterns produces incremental transfer beyond Zone Coach alone.

Comparison:

| Group   | Training                     |
| ------- | ---------------------------- |
| Group A | Zone Coach only              |
| Group B | Zone Coach + Seeing Patterns |
| Group C | Active control               |

Outcome:

* CCC change
* RTT-16 change
* Matrix Reasoning change
* R3D change
* Series change
* relational transfer task change
* Flow Experience Check change

---

# 11. Backend data model additions

## 11.1 Reasoning Transfer Test data

```text
user_id
test_id
form_id
timepoint
item_family
item_id
response
correct
response_time_ms
confidence_rating
total_score
matrix_score
series_score
r3d_score
verbal_score
completion_time
```

## 11.2 Flow Experience Check data

```text
user_id
flow_check_id
timepoint
context
zone_state_before
zone_time_pct
ccc_session
fks_total
smooth_progression_score
absorption_score
concern_score
app_experience_pulse_items
validated_scale_used
licence_version
```

## 11.3 Integrated proof variables

```text
ccc_change
zone_time_change
reasoning_transfer_change
flow_experience_change
state_action_response
zone_reentry_after_action
subjective_flow_after_action
reasoning_transfer_after_zone_training
reasoning_transfer_after_seeing_patterns
```

---

# 12. Final recommendation

The document should now position Cognitive Flow as:

> **evidence-generating cognitive-control training**, not primarily a wellness app.

The core message should be:

> **Zone Coach trains cognitive control using a pre-semantic MFT-M-derived task, estimates CCC in bits per second, tracks whether CCC improves over time, tests whether gains transfer to independent ICAR-based reasoning outcomes, and separately measures subjective psychological flow.**

Flow Actions remain useful, but they are secondary:

> **They help users return to a trainable state, so the cognitive training can continue.**

The best naming structure is:

```text
Cognitive Flow = whole app
Zone Coach = core MFT-M-derived training/tracking task
Seeing Patterns = consumer-facing Level 2 training mode
Relational Flow = technical protocol behind Seeing Patterns
Reasoning Transfer Test = short ICAR-based objective reasoning tracker
Flow Experience Check = subjective psychological flow measure
Cognitive Flow Proof = aggregate evidence layer
```

---

# References

Balban, M. Y., Neri, E., Kogon, M. M., Weed, L., Nouriani, B., Jo, B., Holl, G., Zeitzer, J. M., Spiegel, D., & Huberman, A. D. (2023). Brief structured respiration practices enhance mood and reduce physiological arousal. *Cell Reports Medicine, 4*(1), Article 100895.

Condon, D. M., & Revelle, W. (2014). The international cognitive ability resource: Development and initial validation of a public-domain measure. *Intelligence, 43*, 52–64.

Fincham, G. W., Strauss, C., Montero-Marin, J., & Cavanagh, K. (2023). Effect of breathwork on stress and mental health: A meta-analysis of randomised-controlled trials. *Scientific Reports, 13*, Article 432.

Lippelt, D. P., Hommel, B., & Colzato, L. S. (2014). Focused attention, open monitoring and loving kindness meditation: Effects on attention, conflict monitoring, and creativity: A review. *Frontiers in Psychology, 5*, Article 1083.

Norris, C. J., Creem, D., Hendler, R., & Kober, H. (2018). Brief mindfulness meditation improves attention in novices: Evidence from ERPs and moderation by neuroticism. *Frontiers in Human Neuroscience, 12*, Article 315.

Rheinberg, F., Vollmeyer, R., & Engeser, S. (2019). *FKS. Flow-Kurzskala*. Open Test Archive, ZPID.

Wu, T., Dufford, A. J., Mackie, M.-A., Egan, L. J., & Fan, J. (2016). The capacity of cognitive control estimated from a perceptual decision making task. *Scientific Reports, 6*, Article 34025.

Zhang, H., Fan, S., Yang, J., Yi, J., Guan, L., He, H., Zhang, X., Luo, Y., & Guan, Q. (2024). Attention control training and transfer effects on cognitive tasks. *Neuropsychologia, 200*, Article 108910.

[1]: https://www.nature.com/articles/srep34025 "The Capacity of Cognitive Control Estimated from a Perceptual Decision Making Task | Scientific Reports"
[2]: https://www.sciencedirect.com/science/article/abs/pii/S0028393224001258 "Attention control training and transfer effects on cognitive tasks - ScienceDirect"
[3]: https://www.sciencedirect.com/science/article/pii/S0160289614000051?utm_source=chatgpt.com "The international cognitive ability resource: Development and initial validation of a public-domain measure - ScienceDirect"
[4]: https://icar-project.com/projects/icar-project/wiki/Item_types "Item types - International Cognitive Ability Resource - The ICAR Project"
[5]: https://www.researchgate.net/publication/260232260_The_international_cognitive_ability_resource_Development_and_initial_validation_of_a_public-domain_measure?utm_source=chatgpt.com "(PDF) The international cognitive ability resource: Development and initial validation of a public-domain measure"
[6]: https://www.psycharchives.org/en/item/87af4b18-6170-4b39-8627-8ef2513da25c "FKS - Flow-Kurzskala | PsychArchives"
[7]: https://www.nature.com/articles/s41598-022-27247-y?utm_source=chatgpt.com "Effect of breathwork on stress and mental health: A meta-analysis of randomised-controlled trials | Scientific Reports"
[8]: https://stanfordhealthcare.org/publications/867/867953.html?utm_source=chatgpt.com "867953 | Stanford Health Care"
[9]: https://pmc.ncbi.nlm.nih.gov/articles/PMC6088366/?utm_source=chatgpt.com "Brief Mindfulness Meditation Improves Attention in Novices: Evidence From ERPs and Moderation by Neuroticism - PMC"
