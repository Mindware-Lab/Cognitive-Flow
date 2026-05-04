This is based on Alex Holgate's current UI/UX Figma Design, with additional information for review.


Apple’s current design guidance supports fast, enjoyable, interactive onboarding rather than long explanatory screens, which fits the Seeing Patterns tutorial approach. ([Apple Developer][1]) Mobile health engagement research also supports light use of feedback, self-monitoring, prompts, rewards, and goal setting, which supports your weekly dots, G-Credits, streaks, and completion rewards — provided they are not stressful or competitive. ([Frontiers][2])

---

# Mindware Flow MVP: Low-Stress Game Experience for UX Designer

## 1. Core experience

**Mindware Flow** should feel like:

> **A calm daily cognitive-flow game where the user checks their state, gets one recommended next step, completes a short training or reset action, earns progress, and comes back tomorrow.**

The core loop is:

```text
Arrive
→ Start today’s flow check
→ Get state result
→ Follow recommended action
→ Earn G-Credits
→ See simple progress
→ Return later
```

The product should not feel like a test centre, productivity dashboard, or IQ exam. It should feel more like a **guided training ritual** with light game rewards.

The uploaded specs support this separation: the user should see simple state labels and next actions, while the backend records the deeper CCC, regime, RT, reasoning, and flow data. 

---

# 2. Recommended top shortcut row

Because you now want **Earn** in the MVP, I would use:

```text
Today
Train
Earn
Progress
Settings
```

## Why not Reset as a top tab?

Reset should exist, but it should usually be **recommended contextually** after a Zone Coach result. If it is always a main tab, the app may feel more like a stress-management app. Mindware Flow is a cognitive training app with reset tools built in.

## Final top row spec

| Top shortcut | Opens                             | User meaning              |
| ------------ | --------------------------------- | ------------------------- |
| **Today**    | daily guided route                | “What should I do now?”   |
| **Train**    | Zone Coach + Seeing Patterns      | “Start training”          |
| **Earn**     | G-Credits screen                  | “How do I build rewards?” |
| **Progress** | gains, streak, checks             | “How am I improving?”     |
| **Settings** | account, reminders, evidence link | “Manage the app”          |

Inside **Progress**, include:

> **View evidence and proof dashboard →**

This opens the website, not an in-app Proof tab.

---

# 3. Minimal MVP must-include list

## Must include in the app

1. Welcome / Home screen
2. Top shortcut row: **Today / Train / Earn / Progress / Settings**
3. How it works screen
4. Zone Coach start screen
5. Zone Coach task screen
6. State result screen
7. State explanation screen
8. Recommended next-step screen
9. Reset breathing exercise
10. Widening / Open Field exercise
11. Activation / Light Up exercise
12. Seeing Patterns start screen
13. Seeing Patterns tutorial
14. Visual Patterns Game 1: Spot Patterns
15. Basic Visual Patterns Game 2: Track Change
16. Session complete screen
17. Earn G-Credits screen
18. Weekly progress / streak screen
19. Session 5 profile reveal
20. Reasoning Check entry screen
21. Progress screen with simple gain feedback
22. External link: **View evidence and proof dashboard**

## Keep out of the app as full screens

| Screen / feature               | Recommendation                     |
| ------------------------------ | ---------------------------------- |
| Full Proof tab                 | Move to website                    |
| Claims boundary screen         | Website                            |
| Supabase aggregate data        | Website proof dashboard            |
| FKS / Flow Short Scale details | Website or optional milestone flow |
| Flow Experience result screen  | Not needed in MVP                  |
| Redeem shop                    | “Coming later” only                |
| Leaderboards                   | Exclude                            |

The Zone Coach spec also explicitly rejects peer comparison and leaderboards because they would reward absolute ability rather than trainable trajectory. 

---

# 4. App journey

## First launch

```text
Welcome
→ How it works
→ Start today’s flow check
→ Zone Coach tutorial
→ Zone Coach 3-minute task
→ State result
→ Recommended next step
→ Earn G-Credits
→ Session complete
```

### UX feel

Calm, guided, not evaluative.

Example copy:

> **Welcome to Mindware Flow**
> A short daily training loop for attention, flow-readiness, and reasoning progress.

Button:

> **Start today’s flow check**

---

## Daily session after onboarding

```text
Today
→ Start flow check
→ Zone Coach
→ State result
→ Recommended route:
   In Flow → Seeing Patterns
   Scattered → Breathe Out
   Narrow Focus → Open Field
   Low Spark → Light Up
→ Earn G-Credits
→ Progress nudge
→ Done
```

The Zone Coach architecture supports this route: it is a 3-minute task with regime/state classification and a five-session onboarding arc.  The broader Cognitive Flow spec frames Zone Coach as the core task, with Flow Actions, Seeing Patterns, reasoning checks, flow checks, and proof as separate layers. 

---

# 5. Screen-by-screen UX flow

## A. Welcome / Home screen

### Top row

```text
Today | Train | Earn | Progress | Settings
```

### Main card

> **Today’s Flow Check**
> Check your state, train your control, and get your next step.
> **Takes about 3 minutes**

Button:

> **Start**

### Secondary card

> **Your next session is ready**

or:

> **Next session ready tomorrow**

---

## B. How it works

Three cards only:

1. **Check your state**
   “A short visual task shows how ready your attention is today.”

2. **Follow one next step**
   “You’ll train, reset, widen, activate, or rest.”

3. **Build over time**
   “Your progress comes from consistency, not one perfect score.”

No theory, no CCC, no MFT-M, no SR maps.

---

## C. Zone Coach start screen

> **Flow Check**
> Respond naturally to the visual task.
> There is no need to force it.

Button:

> **Begin 3-minute check**

Behind the scenes this is Zone Coach, but the user-facing label can be **Flow Check** or **Today’s Flow Check**.

---

## D. Zone Coach task screen

Design requirements:

| Element              | Requirement                         |
| -------------------- | ----------------------------------- |
| central visual area  | simple visual patches/discs         |
| response controls    | two large buttons                   |
| progress cue         | small ring or bar                   |
| feedback             | subtle pulse                        |
| no score             | no accuracy, no IQ, no CCC          |
| no pressure language | avoid “fail”, “poor”, “low ability” |

Zone Coach uses pre-semantic stimuli such as orientation gratings, spatial frequency patches, and luminance discs, so the UI should remain abstract and non-verbal during trials. 

---

## E. State result screen

Use warm, non-judgemental state labels.

| Backend state | User-facing state | UX tone          |
| ------------- | ----------------- | ---------------- |
| In the Zone   | **In Flow**       | ready            |
| Flat          | **Low Spark**     | needs activation |
| Locked In     | **Narrow Focus**  | needs widening   |
| Spun Out      | **Scattered**     | needs reset      |

Example:

> **You’re in flow right now**
> Your attention is steady enough for a focused training round.

or:

> **You’re a little scattered today**
> That’s normal. We’ll steady things first.

The key is: **state is temporary, not identity**.

---

## F. Recommended next step

This is the main “coach” moment.

| State         | Next step              |
| ------------- | ---------------------- |
| In Flow       | Seeing Patterns        |
| Scattered     | Breathe Out            |
| Narrow Focus  | Open Field             |
| Low Spark     | Light Up               |
| Very unstable | Rest / come back later |

Example:

> **Your next step**
> **Breathe Out — 2 minutes**
> This will help steady your attention before training.

Buttons:

```text
Start
Choose something easier
I need a break
Help me understand this
```

---

# 6. Flow Actions

## 1. Breathe Out

Use for **Scattered**.

> **Breathe Out**
> Slow things down. Follow the circle.

Design:

| Element           | Requirement                    |
| ----------------- | ------------------------------ |
| visual            | expanding / contracting circle |
| duration          | 60–180 seconds                 |
| tone              | calming                        |
| reward            | +15 G-Credits                  |
| optional re-check | yes                            |

---

## 2. Open Field

Use for **Narrow Focus**.

> **Open Field**
> Soften your focus. Notice the whole screen.

Design:

| Element  | Requirement                |
| -------- | -------------------------- |
| visual   | widening glow / soft field |
| duration | 60–120 seconds             |
| tone     | spacious                   |
| reward   | +15 G-Credits              |

---

## 3. Light Up

Use for **Low Spark**.

> **Light Up**
> Wake up your attention with a short focus drill.

Design:

| Element  | Requirement                |
| -------- | -------------------------- |
| visual   | gold / amber pulse         |
| task     | light tapping or tracking  |
| duration | 60–90 seconds              |
| tone     | energising but not intense |
| reward   | +15 G-Credits              |

---

# 7. Seeing Patterns

## User-facing role

> **Seeing Patterns**
> Train your ability to notice how things change.

This should feel like the “game” part of the app.

The Seeing Patterns spec supports a minimal consumer experience: the user sees only the stimulus, Same/Different buttons, subtle feedback, and a progress cue, while technical measures stay hidden. 

## Tutorial

> **Same** = the change keeps going
> **Different** = the pattern breaks

Flow:

```text
Show
→ Guide
→ Fade
→ Play
```

Apple’s onboarding guidance also supports teaching through interaction rather than long instruction screens. ([Apple Developer][1])

## Game 1: Spot Patterns

User task:

> Tap Same if the pattern keeps changing in the same way.
> Tap Different if the pattern breaks.

MVP status:

> Include fully.

## Game 2: Track Change

User task:

> Track the pattern over a short gap.

MVP status:

> Include lightly.

## Game 3: Find the Rule

MVP status:

> Show as locked, beta, or coming later.

---

# 8. Earn system

## Keep Earn, but make it gentle

The UI source already points to an Earn economy: G-Credits, session rewards, streaks, level-up, and an Earn page. For Mindware Flow, this can work well if rewards are tied to **healthy training behaviour**, not “being smart”.

## Currency

Use:

> **G-Credits**

This fits the wider Trident G / IQ Mindware ecosystem.

## Earn screen

Title:

> **Earn G-Credits**

Subtitle:

> Build your training habit and unlock progress rewards.

Balance card:

> **Your balance**
> **1,275 G-Credits**

## Ways to earn

| Action                                       | Reward |
| -------------------------------------------- | -----: |
| Complete today’s Flow Check                  |    +25 |
| Complete Seeing Patterns                     |    +30 |
| Follow your recommended action               |    +15 |
| Complete Breathe Out / Open Field / Light Up |    +15 |
| Daily check-in                               |    +10 |
| Maintain a streak                            |    +15 |
| Complete 5-session calibration               |   +100 |
| Complete Reasoning Check                     |    +40 |
| Complete Flow Experience milestone           |    +30 |
| Return after a rest day                      |    +10 |

## Critical rule

> **Reward completion, consistency, recovery, and following the coach — not raw ability.**

Do not reward:

| Avoid                     | Why                                 |
| ------------------------- | ----------------------------------- |
| high IQ score             | creates status anxiety              |
| always being In Flow      | not fully controllable              |
| fastest RT                | encourages speed-accuracy trade-off |
| perfect sessions          | punishes exploration                |
| leaderboards              | wrong comparison frame              |
| multiple sessions per day | may undermine consolidation         |

This also matches the existing spec’s emphasis on structural gamification rather than cosmetic rewards. 

---

# 9. Level-up system

Keep this simple.

## Level labels

| Level | Label           | Unlock                 |
| ----- | --------------- | ---------------------- |
| 1     | Start Flow      | Zone Coach             |
| 2     | Stabilise       | Flow Actions           |
| 3     | Notice Patterns | Seeing Patterns Game 1 |
| 4     | Track Change    | Seeing Patterns Game 2 |
| 5     | Reasoning Check | Reasoning milestone    |
| 6     | Build Flow      | Progress trends        |

## Session 5 profile reveal

After session 5:

> **Your Flow Profile is ready**
> We can now personalise your training route.

Show one of:

```text
Mostly In Flow
Low Spark pattern
Narrow Focus pattern
Scattered pattern
Mixed profile
```

The Zone spec already treats the session 5 profile reveal as a re-engagement moment after calibration. 

---

# 10. Progress screen

The Progress screen should be motivating, not diagnostic.

```text
Progress

This week
● ● ○ ● ● ○ ○
4 sessions completed

Processing Speed
Your responses are getting quicker while staying accurate.

Flow
4 of your last 6 sessions were In Flow.

Reasoning
+2 on your latest Reasoning Check.

G-Credits
1,275 earned so far.

View evidence and proof dashboard →
```

## Progress cards

| Card                 | User-facing wording                      | Backend                                |
| -------------------- | ---------------------------------------- | -------------------------------------- |
| **Processing Speed** | “Getting quicker while staying accurate” | RT, correct RT, timeout rate           |
| **Flow**             | “More sessions are landing In Flow”      | zone time, regime stability, recovery  |
| **Reasoning**        | “+2 on latest Reasoning Check”           | item score / relation-processing score |
| **Consistency**      | “4 sessions this week”                   | adherence                              |
| **G-Credits**        | “1,275 earned”                           | reward ledger                          |

For reasoning, use:

> **Reasoning Check**

or:

> **Reasoning / IQ-style tracker**

Avoid:

> IQ increased
> +7 IQ points
> Your IQ is higher

The uploaded cognitive-flow spec similarly recommends a Reasoning Transfer Test as a short reasoning tracker while avoiding claims that it is a full IQ test or proves IQ increase. 

---

# 11. Website proof dashboard

Move scientific proof to the website.

App link:

> **View evidence and proof dashboard →**

Website sections:

| Section                | Content                                                        |
| ---------------------- | -------------------------------------------------------------- |
| **What we measure**    | processing speed, attention control, flow-readiness, reasoning |
| **User progress data** | Supabase-backed aggregate outcomes                             |
| **Reasoning outcomes** | baseline vs post-training change                               |
| **Flow outcomes**      | Zone Coach state + optional FKS / Flow Short Scale             |
| **Claims boundary**    | no diagnosis, no guaranteed IQ increase, no clinical claims    |
| **Protocol notes**     | Zone Coach, Seeing Patterns, Reasoning Check                   |
| **Evidence status**    | what is validated, what is being tested                        |

The public proof wording in the Seeing Patterns spec is already cautious: the app should say it is designed to train subtle change detection, pattern tracking, and rule updating, and that transfer is measured rather than promised. 

---

# 12. Final stitched UX brief

Give the designer this summary:

> **Mindware Flow is a calm, low-stress cognitive-flow game. The user arrives, checks their state with a 3-minute visual task, receives one simple state result, follows one recommended action, earns G-Credits, and sees gentle progress over time. The app rewards consistency, recovery, and following the adaptive route — not raw IQ, perfect scores, or competition.**

The MVP should feel like:

```text
Start → Play → Recover if needed → Earn → Progress → Return
```

not:

```text
Analyse → Compare → Optimise → Worry
```

And the core screen set should now be:

```text
Welcome
Today
Train
Earn
Progress
Settings
Zone Coach
State Result
Recommended Action
Flow Actions
Seeing Patterns
Reasoning Check
Session Complete
Profile Reveal
External Proof Link
```

This gives you a coherent, enjoyable app experience while preserving the scientific architecture behind it.

[1]: https://developer.apple.com/design/human-interface-guidelines/onboarding?utm_source=chatgpt.com "Onboarding | Apple Developer Documentation"
[2]: https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2023.1227443/full?utm_source=chatgpt.com "Frontiers | Potential associations between behavior change techniques and engagement with mobile health apps: a systematic review"
