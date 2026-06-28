## Developer summary: UX for sustained engagement in digital cognitive/health apps

The key finding is that **engagement is not simply time-on-app**. In digital behaviour-change research, engagement is usually treated as both behavioural use — amount, frequency, duration, depth — and subjective experience — attention, interest, affect, perceived usefulness. That distinction matters for Mindware Flow / IQ Coach because a user can “complete sessions” without feeling meaningfully guided, and can also enjoy the app without completing the protocol. ([PMC][1])

The problem is severe: health and fitness apps are often abandoned quickly, with industry data cited in a 2024 JMIR review reporting 66% abandonment of health apps and 69% abandonment of fitness apps within 90 days. Digital mental-health intervention data show wide variation, but sustained usage or completion in real-world studies can be very low, ranging from 0.5% to 28.6% in one cited review. ([JMIR][2]) ([Springer][3])

For a multi-day cognitive programme, the UX should therefore optimise for **return behaviour, clarity, perceived progress, trust and low cognitive friction**, not just “fun”.

---

## Evidence-backed UX principles

### 1. Make the daily loop obvious and tiny

The home screen should answer:

> What do I do today?
> How long will it take?
> Why is it worth doing?

This supports prompts/cues, action planning and habit formation. A 2023 systematic review found six behaviour-change techniques repeatedly associated with mobile health app engagement: **goal setting, self-monitoring, feedback, prompts/cues, rewards and social support**. ([Frontiers][4])

For Mindware Flow, this means the main CTA should remain something like:

> **Start today’s flow check — 3 min**

Do not start with a dashboard, score explanation or module menu.

---

### 2. Use guided “tunnelling”, not free exploration

Users should not have to decide between Zone Coach, Seeing Patterns, Flow Action, Reasoning Check and Progress every day. The app should route them.

Recommended default flow:

```text
Today
→ 3-min state check
→ one plain-language result
→ one recommended next step
→ completion card
→ progress dot
```

The user can override, but the app should provide the path. Persuasive-design reviews often discuss “tunnelling” or guided task flow; however, newer meta-analytic evidence cautions that simply adding more persuasive design principles does not reliably predict engagement or efficacy. The practical lesson is: use guided flow to reduce decision burden, not as manipulation. ([Nature][5])

---

### 3. Keep the intervention credible and low-jargon

Human-centred design research in digital mental health repeatedly finds that poor engagement and adoption may stem from weak user perspective and poor design integration. A JMIR mapping review concluded that human-centred design is still underused and that good design is a prerequisite for effective digital intervention science. ([JMIR Mental Health][6])

For your app, this supports the current spec direction:

```text
Good:
Check your state.
Train your control.
Get your next step.

Avoid:
CCC, MFT-M, ξ, δ, n-back, entropy, SR, criticality, adaptive intelligence score.
```

Keep the science in the architecture and the proof layer, not in the first-run copy.

---

### 4. Show progress as “continuity”, not performance pressure

For multi-day completion, progress should answer:

> Am I building the habit?
> Is the programme adapting?
> Is there a reason to come back tomorrow?

Use:

```text
session dots
week cards
session 5 profile reveal
gentle streak
current training focus
small “you are building consistency” messages
```

Avoid making daily scores the main reward. Your own IQ Coach spec already separates app-native capacities from transfer/proof measures and warns not to treat all scores as the same type of evidence. It also states that stable baselines need repeated sessions and that standardised scores should be hidden until calibration supports them. 

---

### 5. Give immediate task feedback, but delay interpretation

During the task:

```text
brief pulse
subtle correct/incorrect cue if needed
thin progress ring
no score
no graphs
no explanation
```

After the task:

```text
plain-language state
one reason
one next step
optional “help me understand this”
```

This matches evidence that feedback and self-monitoring support engagement, but avoids turning the active task into a performance-anxiety experience. ([Frontiers][4])

---

### 6. Use adaptive personalisation, but preserve autonomy

Personalisation is useful when it reduces burden:

```text
Scattered → Reset
Low Spark → Activate
Narrow Focus → Widen
In Flow → Train / Seeing Patterns
```

But the user should always have an escape hatch:

```text
Start recommended step
Do something easier
Take a proper break
Help me understand this
```

This is important because digital health engagement is affected by motivation, capability, opportunity, time burden and perceived fit. The evidence does not support forcing everyone through the same rigid pathway. ([Frontiers][4])

---

### 7. Use rewards sparingly

Rewards can help, but they should not become the product. The strongest reward system for Mindware Flow should be:

```text
session completed
streak maintained
profile becoming clearer
new pattern lane unlocked
proof slowly improving
```

G-Credits are acceptable only as a soft cosmetic layer. The core reward should be **competence and continuity**, not points. Reviews of gamification in cognitive training note that game elements may improve motivation and engagement, but can also distract from the cognitive task if poorly applied. ([PMC][7])

So I would use:

```text
+1 session completed
Week 1: Stabilise Focus
Profile unlocks after session 5
```

not:

```text
+25 G-Credits
leaderboard
rank
competitive streak pressure
```

---

## Multi-day programme structure for Mindware Flow

### First session

Goal: reduce uncertainty.

```text
Welcome
→ How it works
→ Zone Coach tutorial
→ 3-min check
→ state result
→ recommended Flow Action
→ completion card
```

No heavy progress dashboard yet.

### Sessions 2–4

Goal: build habit.

```text
Today
→ state check
→ recommended route
→ completion
→ weekly dots
```

Introduce Seeing Patterns only when the user is ready, not as a second confusing product.

### Session 5

Goal: create a meaningful retention moment.

```text
Zone Coach
→ result
→ profile reveal
→ “your pattern is becoming clearer”
→ optional Flow Check
→ completion
```

This fits your own spec’s use of repeated sessions for stable personal baselines and confidence labels. 

### After session 5

Goal: deepen the programme.

```text
state check
→ state-matched route
→ Seeing Patterns / Reset / Widen / Activate
→ occasional Reasoning Check
→ weekly proof
```

This also fits the Trident-G principle: do not reward local fluency alone; test whether the relation survives wrapper change, delay, lures and reasoning transfer. 

---

## Should you include the FKS / Flow Short Scale?

Yes, but **not as a daily core burden**.

If by FKS you mean the **Flow-Kurzskala / Flow Short Scale**, it is designed to measure subjective flow experience. It is suitable as an occasional validation or research measure, not as the app’s main state classifier. ([PsychArchives][8])

Recommended implementation:

```text
Daily:
3-item Flow Experience Check
Smooth / Absorbed / Effortful-worried

Session 5 or weekly:
optional fuller FKS/FSS-style check

Research / validation mode:
full validated scale
```

Keep the distinction clear:

```text
Zone Coach = behavioural state estimate
Flow Check / FKS = subjective experience
```

Do not say “the app detected flow” from the FKS. Say:

> Your response suggests the session felt smooth and absorbed.

---

## Developer requirements

### Must implement

```text
1. One dominant daily CTA.
2. A 3-minute default daily route.
3. State-based routing with user override.
4. Minimal in-task UI.
5. Completion card after every session.
6. Weekly dots / streak / profile reveal.
7. Optional explanation screen, never forced.
8. Progress framed as confidence building over sessions.
9. Prompt/cue system for return behaviour.
10. Claims boundary and proof layer.
```

### Should implement later

```text
1. Personalised reminder timing.
2. Session recovery if interrupted.
3. Adaptive “easier today” route.
4. Weekly reflection / Real-Life Transfer Check.
5. A/B tests for onboarding length and profile reveal timing.
6. FKS/FSS validation mode.
```

### Avoid

```text
1. Long tutorials.
2. Technical terms in consumer UI.
3. Daily graphs before baseline stability.
4. Leaderboards.
5. Over-notification.
6. Reward economies as the main motivator.
7. Clinical, diagnostic or IQ-gain language.
8. Forcing users through hard sessions when state is poor.
```

NICE’s evidence standards framework is also relevant if this moves towards a digital health positioning: it is designed to help developers and evaluators identify digital health technologies likely to benefit users and to understand what good evidence looks like. ([NICE][9])

---

## Bottom line

For Mindware Flow, the best evidence-aligned UX is:

```text
short daily action
+ guided next step
+ low-friction task screen
+ meaningful progress over days
+ optional explanation
+ cautious proof layer
+ adaptive routing
+ subjective flow check kept separate from behavioural state
```

The product should feel less like a “brain training dashboard” and more like:

> **A calm daily cognitive training route that tells me what to do today, helps me complete it, and gradually shows evidence that something is stabilising.**

[1]: https://pmc.ncbi.nlm.nih.gov/articles/PMC5526809/?utm_source=chatgpt.com "Conceptualising engagement with digital behaviour change ..."
[2]: https://www.jmir.org/2024/1/e56897/ "Journal of Medical Internet Research - When and Why Adults Abandon Lifestyle Behavior and Mental Health Mobile Apps: Scoping Review"
[3]: https://link.springer.com/article/10.1186/s44247-024-00105-9 "Engagement and retention in digital mental health interventions: a narrative review | BMC Digital Health | Springer Nature Link"
[4]: https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2023.1227443/full "Frontiers | Potential associations between behavior change techniques and engagement with mobile health apps: a systematic review"
[5]: https://www.nature.com/articles/s41746-025-01567-5 "A meta-analysis of persuasive design, engagement, and efficacy in 92 RCTs of mental health apps | npj Digital Medicine"
[6]: https://mental.jmir.org/2022/6/e35591 "JMIR Mental Health - Human-Centered Design Approaches in Digital Mental Health Interventions: Exploratory Mapping Review"
[7]: https://pmc.ncbi.nlm.nih.gov/articles/PMC7445616/?utm_source=chatgpt.com "The Effects of Gamification on Computerized Cognitive Training"
[8]: https://www.psycharchives.org/en/item/87af4b18-6170-4b39-8627-8ef2513da25c?utm_source=chatgpt.com "FKS - Flow-Kurzskala"
[9]: https://www.nice.org.uk/what-nice-does/digital-health/evidence-standards-framework-esf-for-digital-health-technologies "Evidence standards framework (ESF) for digital health technologies | NICE"
