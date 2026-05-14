i mean in the specs below, do we include the FKS? 

  

## Mindware Flow MVP: designer-facing required content

### 1. App identity and core framing

The MVP should present **Mindware Flow** as the whole app, with:

| User-facing name            | Role                                                                 |
| --------------------------- | -------------------------------------------------------------------- |
| **Zone Coach**              | 3-minute focus-state check and cognitive-control training task       |
| **Flow Actions**            | short reset, activation, or widening exercises after the state check |
| **Seeing Patterns**         | 8-minute pattern-training mode, initially Visual Patterns only       |
| **Reasoning Transfer Test** | occasional short reasoning tracker                                   |
| **Flow Experience Check**   | occasional subjective flow check                                     |
| **Progress / Proof**        | simple weekly progress and evidence-safe feedback                    |

The core product line can be:

> **Train attention control. Track cognitive capacity. Build better cognitive flow.**

The source positioning for Cognitive Flow is that Zone Coach is the core feature, Seeing Patterns is the later training mode, and the app should include objective reasoning and subjective flow checks as separate trackers. 

---

# 2. Required MVP screens

## A. Welcome / Home screen

Based on UI 1.

Must include:

| Element           | Required content                                            |
| ----------------- | ----------------------------------------------------------- |
| Greeting          | “Good morning, [Name]” or neutral “Welcome back”            |
| Primary CTA       | **Start today’s flow check**                                |
| Session promise   | “Takes about 3 minutes”                                     |
| Short explanation | “Check your state. Train your control. Get your next step.” |
| Calm icon row     | Track / Train / Reset / Progress / Proof or similar         |

Avoid heavy terms here: no CCC, ξ, δ, n-back, MFT-M, SR map, or optic flow.

---

## B. “How it works” onboarding

Based on UI 2.

Three cards are enough:

1. **Understand your focus**
   “A short visual task checks how your attention is performing today.”

2. **Get your next step**
   “You’ll be guided to train, reset, widen, or rest depending on your state.”

3. **Build over time**
   “Your progress is tracked across sessions, not from one score.”

This is consistent with the source architecture:

```text
Zone Coach → State Result → Continue / Flow Action → Optional Re-check / Done
```



---

## C. First task instruction screen

Based on UI 3.

For Zone Coach:

> **Just follow along**
> There’s no right or wrong feeling. Respond naturally.
> Duration: about 3 minutes.

For Seeing Patterns:

> **Watch how the pattern changes**
> Tap **Same** if the change keeps going.
> Tap **Different** if the pattern breaks.

The Seeing Patterns spec is explicit that the user-facing question is simply: **“Is this changing in the same way?”** 

---

## D. Zone Coach task screen

This is the core MVP training/check.

Must include:

| Element                         | Designer requirement                       |
| ------------------------------- | ------------------------------------------ |
| Dark or pale minimal background | Keep distraction low                       |
| Central stimulus area           | Visual patches/discs only                  |
| Simple response area            | Two large touch targets                    |
| Subtle progress cue             | Thin ring or small step indicator          |
| Minimal feedback                | brief pulse only                           |
| No visible score                | no accuracy, no CCC, no graphs during task |

Zone Coach uses pre-semantic visual dimensions: orientation gratings, spatial-frequency patches, and luminance discs, rather than semantic arrow stimuli. 

---

## E. State result screen

Based on UI 4, UI 5, and UI 8.

The app should show one plain-language state, not a technical regime.

| Backend state | User-facing label | Tone                       |
| ------------- | ----------------- | -------------------------- |
| In the Zone   | **In Flow**       | ready for training         |
| Flat          | **Low Spark**     | steady but under-activated |
| Locked In     | **Narrow Focus**  | sharp but rigid            |
| Spun Out      | **Scattered**     | overloaded or unstable     |

Example result cards:

> **You’re in flow right now**
> Your attention is steady enough for a focused training session.

> **Your mind is a bit overloaded right now**
> You may feel scattered, slower, or unfocused. This is completely normal.

> **Your focus is narrow today**
> You may be sharp, but less flexible. We’ll use a widening exercise first.

> **You’re running low today**
> A lighter session is recommended.

The source states that Zone Coach estimates regime state and routes the user to training, reset, widening, or activation depending on that state. 

---

## F. “What’s happening right now?” explanation screen

Based on UI 5.

This is optional after the state result, but should be available via “Help me understand this”.

Must include only 2–3 simple observations:

Example for Scattered:

> Your mind is jumping between things.
> It may be harder to stay with one task.
> A short reset may help.

Example for Low Spark:

> You’re responding steadily but slowly.
> Your brain may need a little activation.
> We’ll keep today’s challenge light.

No mechanisms, no equations, no clinical wording.

---

## G. Next-step recommendation screen

Based on UI 6.

Must include:

| State                      | Recommended next step                              |
| -------------------------- | -------------------------------------------------- |
| In Flow                    | Continue to Zone Coach training or Seeing Patterns |
| Low Spark                  | Activation exercise                                |
| Narrow Focus               | Widening exercise                                  |
| Scattered                  | Reset exercise                                     |
| Very poor/unstable session | Rest or “come back later”                          |

Example:

> **Your next step**
> Recommended for you
> **Let’s reset your focus — 3 min**
> This short exercise can help steady your attention before training.

Buttons:

1. **Start my reset**
2. **I need a proper break**
3. **Give me something easier**
4. **Help me understand this**

Flow Actions should be framed as **training-readiness supports**, not clinical interventions or the main evidence claim. 

---

# 3. Required MVP exercises/resources

## 1. Zone Coach

**Required in MVP.**

Purpose:

> 3-minute cognitive-control training and state check.

Designer-facing task summary:

> The user responds to short visual displays. The app estimates today’s focus state and adapts the next step.

Must include:

| Item                                             | Required             |
| ------------------------------------------------ | -------------------- |
| 3-minute session length                          | yes                  |
| simple visual task                               | yes                  |
| orientation / spacing / brightness-style stimuli | yes                  |
| basic feedback pulse                             | yes                  |
| result state                                     | yes                  |
| next-step recommendation                         | yes                  |
| onboarding arc                                   | yes, 5 sessions      |
| profile reveal                                   | yes, after session 5 |

Zone Coach has a 3-minute session target and a 5-session onboarding arc, with real-time regime classification and CCC trajectory as its main outputs. 

---

## 2. Flow Action: Reset

Based on UI 7.

Use when: **Scattered / overloaded / unstable**.

Exercise:

> **Breathe out**
> Slow things down. Just follow your breath.

Required design elements:

| Element                | Requirement                               |
| ---------------------- | ----------------------------------------- |
| Large breathing circle | expands/contracts                         |
| Timer                  | 60–180 seconds                            |
| Copy                   | very sparse                               |
| End state              | “You’re more focused now” or “Good reset” |
| Optional re-check      | yes                                       |

This is the most important Flow Action for MVP.

---

## 3. Flow Action: Widen

Use when: **Narrow Focus / Locked In**.

Exercise name:

> **Open Field**

Copy:

> Soften your focus. Notice the whole screen, not just the centre.

Design:

| Element              | Requirement               |
| -------------------- | ------------------------- |
| Soft expanding field | circle or glow widens     |
| Gentle instruction   | “Notice the edges”        |
| Timer                | 60–120 seconds            |
| End card             | “Your focus is wider now” |

This should visually contrast with Reset: less breathing, more field expansion.

---

## 4. Flow Action: Activate

Use when: **Low Spark / Flat**.

Exercise name:

> **Light Up**

Copy:

> Wake up your attention with a short active focus drill.

Design:

| Element                         | Requirement             |
| ------------------------------- | ----------------------- |
| Brighter gold/amber tone        | matches UI 4/10 style   |
| Short tapping or tracking drill | 60–90 seconds           |
| Slightly energising animation   | pulse, spark, glow      |
| End card                        | “You’re more alert now” |

This should not feel like meditation. It should feel like a light cognitive warm-up.

---

## 5. Seeing Patterns: Visual Patterns

**Include in minimal MVP, but keep simple.**

This should be the first scored pattern-training lane. The source spec recommends Visual Patterns as the first implementation, using a single Gabor-like patch varying in angle, spacing, and later clarity, while Motion Flow should remain experimental until display timing and device variability are validated. 

Designer-facing task:

> Watch how the pattern changes. Tap Same if the change keeps going. Tap Different if the pattern breaks.

Required exercise flow:

| Stage    | Content                                      |
| -------- | -------------------------------------------- |
| Tutorial | 5 guided trials                              |
| Game 1   | Spot Patterns, 1-back continuation/break     |
| Game 2   | Track Change, simple 2-back pattern tracking |
| Game 3   | Find the Rule, simple conjunction rule       |
| End      | calm completion card                         |

For MVP, I would include **Game 1 fully**, **Game 2 lightly**, and **Game 3 as a locked/coming-soon or short beta challenge**. That keeps development and comprehension risk lower.

---

## 6. Seeing Patterns tutorial

Required because the task is not self-evident.

Copy:

> **Same** = the change keeps going
> **Different** = the pattern breaks

Then:

| Step  | Requirement             |
| ----- | ----------------------- |
| Show  | animated pattern change |
| Guide | 5 easy trials           |
| Fade  | remove explanation      |
| Play  | begin scored session    |

The Seeing Patterns spec recommends a short interactive tutorial and says users should see only the stimulus, Same/Different buttons, subtle feedback pulse, and optional thin progress ring during the task. 

---

## 7. Reasoning Transfer Test

**Include as a minimal resource, not a daily exercise.**

This should live in Progress / Proof / Baseline.

Designer-facing name:

> **Reasoning Check**

Technical name:

> Reasoning Transfer Test

Required copy:

> A short reasoning snapshot used to test whether training gains extend beyond the app task.

MVP version:

| Version                         | Use                         |
| ------------------------------- | --------------------------- |
| 8-item Reasoning Pulse          | onboarding / light progress |
| 16-item Reasoning Transfer Test | baseline and post-training  |

The spec recommends a 16-item ICAR-style Reasoning Transfer Test, with Matrix Reasoning, Letter/Number Series, 3D Rotation, and Verbal Reasoning item families. 

---

## 8. Flow Experience Check

**Include as a minimal occasional check.**

Designer-facing name:

> **Flow Check**

Copy:

> How smooth, absorbed, and in control did that feel?

MVP version:

3-item pulse:

| Prompt              | Response      |
| ------------------- | ------------- |
| Smooth              | slider or 1–5 |
| Absorbed            | slider or 1–5 |
| Effortful / worried | slider or 1–5 |

Do not present it as a diagnosis or as proof that the user “was in flow”. The source explicitly separates behavioural Zone Coach state from subjective psychological flow experience. 

---

# 4. Required progress and reward resources

## A. Session completion card

Based on UI 9 and UI 12.

Use:

> **Nice work today**
> ✓ checked your focus
> ✓ trained your mind
> ✓ improved your clarity

Button:

> **See you soon**

Keep this.

## B. Weekly journey / streak

Based on UI 11.

Use:

> **7 Day Streak**
> Week 1: Stabilise Focus
> You’re building a strong foundation.

Zone Coach includes a session heatmap and a session 5 profile reveal as engagement mechanics. 

## C. G-Credits

I would **not include G-Credits in the minimal MVP** unless they are only cosmetic and not central. The current specs lean away from cosmetic gamification and towards structural progress: state, streak, session completion, weekly dots, and profile reveal. If retained from UI 9–10, use them as a soft reward layer only, not as the main progress system.

Better MVP wording:

> **+1 session completed**
> **You’re building consistency**

rather than:

> **+25 G-Credits**

---

# 5. Minimum navigation

For the designer, use five tabs or five home cards:

| Tab/card     | Purpose                                        |
| ------------ | ---------------------------------------------- |
| **Today**    | start today’s check/session                    |
| **Train**    | Zone Coach + Seeing Patterns                   |
| **Reset**    | Flow Actions library                           |
| **Progress** | streak, weekly dots, profile                   |
| **Proof**    | claims boundaries, reasoning check, flow check |

The Proof tab can be very light in MVP:

> What we measure
> What we do not claim
> Your reasoning checks
> Your flow checks

This aligns with the source emphasis that Mindware Flow/Cognitive Flow should be evidence-generating cognitive-control training, not a generic wellness app. 

---

# 6. Designer-facing “must include” list

## Must include in the minimal MVP

1. Welcome screen
2. How it works screen
3. Zone Coach start screen
4. Zone Coach task screen
5. State result screen
6. State explanation screen
7. Recommended next step screen
8. Reset breathing exercise
9. Widening/open-field exercise
10. Activation/light-up exercise
11. Seeing Patterns start screen
12. Seeing Patterns tutorial
13. Visual Patterns Game 1: Spot Patterns
14. Basic Visual Patterns Game 2: Track Change
15. Session complete screen
16. Weekly progress/streak screen
17. Session 5 profile reveal
18. Reasoning Check entry screen
19. Flow Check entry screen
20. Proof/claims boundary screen

---

# 7. Keep out of the minimal MVP

These should stay hidden, internal, or later:

| Exclude from designer MVP      | Reason                                  |
| ------------------------------ | --------------------------------------- |
| SR map UI                      | too complex for first-use consumer flow |
| optic-flow scored lane         | device/timing validation needed first   |
| full Relational Flow map       | too heavy                               |
| explicit n-back labels         | intimidating and unnecessary            |
| CCC graphs                     | useful internally, not first-run UX     |
| ξ / δ / cusp geometry language | technical layer only                    |
| precision score                | too analytic                            |
| portability score              | proof layer later                       |
| IQ increase claims             | unsafe and premature                    |
| clinical claims                | avoid                                   |
| leaderboards                   | wrong incentive                         |
| heavy tutorials                | breaks flow                             |

The Seeing Patterns spec explicitly says the MVP should hide precision scores, stable gaps, SR depth/breadth, detailed n-back statistics, contrast/coherence levels, and cross-family transfer scores from the consumer UI. 

---

# 8. Suggested MVP session journey

## First session

```text
Welcome
→ How it works
→ Zone Coach tutorial
→ Zone Coach 3-min check
→ State result
→ Recommended Flow Action
→ Completion card
```

## Second to fourth sessions

```text
Today screen
→ Zone Coach
→ State result
→ Flow Action or Seeing Patterns Game 1
→ Completion card
→ Weekly progress dots
```

## Fifth session

```text
Zone Coach
→ State result
→ Profile reveal
→ Optional Reasoning Check
→ Completion card
```

## After session 5

```text
Zone Coach
→ State-matched route:
   In Flow → Seeing Patterns
   Scattered → Reset
   Narrow Focus → Widen
   Low Spark → Activate
→ Optional re-check
→ Completion
```

---

# 9. Simple designer brief summary

The designer should build **Mindware Flow** as:

> **A calm cognitive training app where users complete a short focus-state check, receive one simple state result, do one recommended action, and gradually unlock a simple pattern-training exercise.**

The app should feel like UI 1–12: soft cards, large centred visuals, simple purple/gold gradients, sparse copy, friendly feedback, and a clear next button. The science should be present in the structure, not in the wording.
