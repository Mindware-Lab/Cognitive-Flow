# Attention Coach / IQ Coach — Consumer UX Scores and Progress Specification

## Purpose

This UX specification defines the consumer-facing score screens for the 20-session Attention Coach / IQ Coach programme.

The user should see meaningful, simple, motivational feedback about:

```text
Attention Control
Binding Focus
Transfer Score
Motion Recovery
Relation Recovery
Mixed Flexibility
Return Strength
```

The user should not see research metrics such as MI recovery, alpha stability, beta alignment, ET thresholds, entropy values, trajectory windows or scratch-baseline models.

The consumer experience should answer three questions:

```text
1. How well am I extracting the important signal?
2. How well am I keeping signal + colour/features stable?
3. Is this skill carrying over when the display format changes?
```

---

# 1. UX principles

## 1.1 Consumer language rule

Use plain-language training terms.

Use:

```text
Attention Control
Binding Focus
Transfer Score
Motion Recovery
Relation Recovery
Mixed Flexibility
Return Strength
Training Score
bits/sec
confidence
trend
```

Avoid:

```text
CCC
BSE
MIR
ASI
CBA
LISS
PRR
beta*
alpha stability
trajectory windows
carrier-swap boundary
absolute frame
relative frame
condition entropy
ET_75
lapse rate
psychometric fit
```

## 1.2 What the user should understand

The user should understand:

```text
Attention Control
= how efficiently I pick out the important signal.

Binding Focus
= how well I keep direction and colour together.

Transfer Score
= how well my trained skill carries across new formats.

Motion Recovery
= how well my attention skill carries from static to moving patterns.

Relation Recovery
= how well the relative-direction skill carries into moving patterns.

Mixed Flexibility
= how well I switch between formats.

Return Strength
= how well the skill returns after time away.
```

## 1.3 What the user should not have to understand

The user should not need to know:

```text
why a transition is a carrier-swap boundary
how the adaptive staircase works
how bits/sec is fitted
what entropy values are used
what model confidence threshold applies
how transfer metrics are computed
```

---

# 2. Navigation structure

Use five main areas:

```text
Today
Train
Progress
Transfer
Profile
```

## 2.1 Today

Purpose:

```text
Start the next session.
Show the current programme phase.
Show a small score summary.
```

## 2.2 Train

Purpose:

```text
Start or resume the active training task.
Access tutorial or practice mode.
```

## 2.3 Progress

Purpose:

```text
Show smoothed score curves across sessions.
Show 20-session journey.
Show capacity trends.
```

## 2.4 Transfer

Purpose:

```text
Make Transfer Score accessible at any time.
Show Motion Recovery, Relation Recovery, Mixed Flexibility and Return Strength.
Explain what is available now and what unlocks later.
```

This tab or card must always be available, even when the Transfer Score is still calibrating.

## 2.5 Profile

Purpose:

```text
Show latest Attention Control and Binding Focus scores.
Show score explanations.
Show confidence labels and claims boundary.
```

---

# 3. Global Transfer Score access rule

Transfer Score must be accessible at any time from at least three places:

```text
1. Today screen mini-card
2. Progress screen top summary or tab
3. Dedicated Transfer screen
```

When there is not enough data yet, the Transfer Score card should not disappear. It should show:

```text
Transfer Score
Calibrating

This score becomes clearer as you complete motion, relation, mixed and return-check sessions.
```

Availability states:

| Programme stage  | Transfer Score display          |
| ---------------- | ------------------------------- |
| Sessions 1–5     | Calibrating · building baseline |
| Sessions 6–8     | Early Motion Recovery available |
| Sessions 9–12    | Relation baseline building      |
| Sessions 13–15   | Relation Recovery available     |
| Sessions 16–18   | Mixed Flexibility available     |
| Sessions 19–20   | Return Strength available       |
| After session 20 | Full 20-session Transfer Score  |

The user should never have to wait until session 20 to find the Transfer area. It should be visible from the start, with clear “not enough data yet” states.

---

# 4. Main visible scores

## 4.1 Attention Control

Display:

```text
Attention Control
X.X bits/sec
Training Score: 104
Confidence: moderate
Trend: improving
```

Plain-language description:

```text
How efficiently you pick out the important signal from a brief display.
```

## 4.2 Binding Focus

Display:

```text
Binding Focus
X.X bits/sec
Training Score: 96
Confidence: calibrating
Trend: developing
```

Plain-language description:

```text
How well you keep direction and colour together while responding quickly.
```

## 4.3 Transfer Score

Display:

```text
Transfer Score
68 / 100
Developing
Confidence: calibrating
```

Plain-language description:

```text
How well your trained attention skill carries across new display formats.
```

## 4.4 Transfer sub-scores

| Score             | User-facing meaning                         | Appears                          |
| ----------------- | ------------------------------------------- | -------------------------------- |
| Motion Recovery   | Static → moving patterns                    | After motion foundation sessions |
| Relation Recovery | Relative-direction skill in moving patterns | After motion relations sessions  |
| Mixed Flexibility | Switching across all formats                | During mixed mastery             |
| Return Strength   | Recovery after spacing                      | During return check              |

---

# 5. Screen specification

## Screen A — Today screen

### Purpose

Daily entry point. The user should know what to do next and where they are in the 20-session pathway.

### Required elements

```text
Greeting
Session count
Current phase
Primary CTA
Mini score summary
Transfer Score mini-card
```

### Example layout

```text
Welcome back

Session 7 of 20
Current phase: Motion Foundation

Today you’ll practise carrying your attention skill into moving patterns.

[Start today’s session]

Current profile
Attention Control: 3.4 bits/sec · 104
Binding Focus: calibrating
Transfer Score: calibrating
```

### Transfer access

The Transfer Score mini-card must be tappable.

Tap target:

```text
View Transfer Score
```

If early in the programme:

```text
Transfer Score
Calibrating

We are building the baseline needed to test carry-over across formats.
```

---

## Screen B — Pre-session briefing

### Purpose

Prepare the user for the current phase without technical explanation.

### Required elements

```text
Current phase name
One-sentence task explanation
Normalise expected dips
Estimated duration
Start button
```

### Phase-specific copy

#### Direction Foundation

```text
Build your attention baseline with static direction patterns.
```

#### Motion Foundation

```text
The same skill now appears in moving patterns. A short dip is normal when the format changes.
```

#### Relation Foundation

```text
Now the task shifts from simple direction to direction relative to the centre.
```

#### Motion Relations

```text
You’ll practise recovering relative direction in moving patterns.
```

#### Mixed Mastery

```text
Formats will now switch unpredictably, so your attention has to stay flexible.
```

#### Return Check

```text
This re-check shows what still carries over after spacing.
```

---

## Screen C — Task screen

### Purpose

Keep attention on the task.

### Required elements

```text
central stimulus area
two or four large response buttons, depending on task
thin progress indicator
minimal feedback pulse
sound toggle
pause button
```

### Do not show during the task

```text
bits/sec
Training Score
Transfer Score
accuracy
staircase level
difficulty
entropy
ET threshold
research metrics
```

---

## Screen D — Session complete screen

### Purpose

Give immediate feedback and reinforce progress.

### Required elements

```text
Session complete message
Attention Control card
Binding Focus card, when available
Today’s interpretation
Next-session preview
Button to view full progress
Button to continue / finish
```

### Example

```text
Nice work today

Attention Control
3.4 bits/sec
Training Score: 104
Trend: improving

Binding Focus
2.1 bits/sec
Training Score: 96
Trend: developing

Today’s note
Moving patterns were harder than static patterns, which is normal during a format change. Your next session will keep practising motion recovery.

[View progress]
[Done]
```

### Transfer access

Include a small link:

```text
View Transfer Score
```

This opens the Transfer screen.

---

## Screen E — Main profile dashboard

### Purpose

Show the user’s current cognitive training profile.

### Required elements

```text
Top profile card
Attention Control card
Binding Focus card
Transfer Score card
2 × 2 format matrix
training focus note
confidence note
```

### Top card

Recommended heading:

```text
Attention & Transfer Profile
```

Show:

```text
Transfer Score
68 / 100
Developing
```

The top card should link to the full Transfer screen.

### Capacity cards

#### Attention Control

```text
Attention Control
3.4 bits/sec
Training Score: 104
Confidence: moderate

How efficiently you pick out the important signal.
```

#### Binding Focus

```text
Binding Focus
2.1 bits/sec
Training Score: 96
Confidence: calibrating

How well you keep direction and colour together.
```

### 2 × 2 consumer matrix

Use plain labels:

|                 | Simple direction | Relative direction |
| --------------- | ---------------: | -----------------: |
| Static patterns | score + bits/sec |   score + bits/sec |
| Moving patterns | score + bits/sec |   score + bits/sec |

Example:

```text
Static patterns / Simple direction
104 · 3.4 bits/sec

Moving patterns / Simple direction
96 · 2.8 bits/sec
```

Do not label this as `arrow_abs`, `flow_abs`, `arrow_rel` or `flow_rel`.

### Training focus card

Example:

```text
Current training focus
Moving patterns are still more effortful than static patterns. This is expected during Motion Foundation.
```

or:

```text
Current training focus
Your attention control is stronger than your binding focus, so the next useful step is making colour–direction pairings more automatic.
```

---

## Screen F — Progress over time

### Purpose

Show change across sessions.

### Required elements

```text
smoothed trend curve
raw session dots
phase shading
session count
toggle between Capacity and Transfer
```

### Default chart mode

```text
Capacity
```

Shows:

```text
Attention Control
Binding Focus
```

### Transfer chart mode

Shows:

```text
Transfer Score
Motion Recovery
Relation Recovery
Mixed Flexibility
Return Strength
```

The Transfer chart mode is always available. If not enough data exist, show locked/calibrating segments as faint future lines or placeholders.

### Smoothing rule

Show both:

```text
small dots = actual session scores
solid line = smoothed trend
```

Suggested smoothing:

```text
smoothed_score_t =
0.65 × smoothed_score_t-1
+ 0.35 × current_score_t
```

Alternative:

```text
3-session rolling average
```

The design should not hide session variability. Variability is normal, especially around new display formats.

### Phase labels

Use the 20-session phase names:

```text
Direction Foundation
Motion Foundation
Relation Foundation
Motion Relations
Mixed Mastery
Return Check
```

---

## Screen G — 20-session journey screen

### Purpose

Show the full programme pathway.

### Required elements

```text
20-session progress bar
phase cards
current phase marker
next phase preview
simple explanation of expected dips
```

### Phase schedule

| Sessions | Phase                | User explanation                                             |
| -------: | -------------------- | ------------------------------------------------------------ |
|      1–5 | Direction Foundation | Build your baseline with static direction patterns.          |
|      6–8 | Motion Foundation    | Practise the same attention skill in moving patterns.        |
|     9–12 | Relation Foundation  | Shift from simple direction to centre-relative direction.    |
|    13–15 | Motion Relations     | Recover relative-direction skill in moving patterns.         |
|    16–18 | Mixed Mastery        | Switch between static, moving, simple and relative displays. |
|    19–20 | Return Check         | Re-check what still carries over after spacing.              |

### Language rule

Use:

```text
Coming up next
```

Avoid:

```text
Locked
```

Do not imply that users must “pass” hidden gates to continue the 20-session programme.

The backend may adapt difficulty and confidence labels, but the consumer programme should feel like a clear 20-session journey.

---

## Screen H — Transfer screen

### Purpose

Make Transfer Score accessible at any time and explain carry-over without exposing research metrics.

### Required elements

```text
Transfer Score top card
Availability state
Motion Recovery card
Relation Recovery card
Mixed Flexibility card
Return Strength card
short explanation
progress chart link
```

### Top card

```text
Transfer Score
68 / 100
Developing

How well your trained attention skill carries across changing display formats.
```

### Early state example

```text
Transfer Score
Calibrating

You are still building the baseline needed to test carry-over. Your first transfer signal appears after Motion Foundation.
```

### Motion Recovery card

```text
Motion Recovery
72 / 100
Developing

Your attention skill is beginning to carry from static patterns into moving patterns. Some dip is normal when the format changes.
```

### Relation Recovery card

Before available:

```text
Relation Recovery
Coming later

This appears after you practise relative direction in both static and moving patterns.
```

After available:

```text
Relation Recovery
64 / 100
Developing

You are learning to recover relative direction when the display changes into motion.
```

### Mixed Flexibility card

```text
Mixed Flexibility
Coming in sessions 16–18

This checks how well you switch between formats when they appear unpredictably.
```

### Return Strength card

```text
Return Strength
Coming in sessions 19–20

This checks what still carries over after spacing.
```

### Explanation note

```text
Transfer Score is a training indicator. It shows whether skills practised in one display format appear to carry into changed formats. It is not a diagnosis or an official IQ score.
```

---

## Screen I — Score-detail screens

### Purpose

Explain each score clearly.

Each visible score should have a detail screen.

## I.1 Attention Control detail

Show:

```text
Attention Control
How efficiently you pick out the important signal from a brief display.

Current estimate:
3.4 bits/sec

Training Score:
104

Trend:
Improving

Confidence:
Moderate
```

Explanation:

```text
Bits/sec is an estimate of how much useful visual information you can extract per second in this task. It is a training measure, not an IQ score.
```

## I.2 Binding Focus detail

Show:

```text
Binding Focus
How well you keep direction and colour together while responding quickly.

Current estimate:
2.1 bits/sec

Training Score:
96

Trend:
Developing

Confidence:
Calibrating
```

Explanation:

```text
This is harder than simple attention control because you are keeping the right pairing active, not just detecting a direction.
```

## I.3 Transfer Score detail

Show:

```text
Transfer Score
How well your trained attention skill carries across new display formats.

Current estimate:
68 / 100

Status:
Developing

Confidence:
Calibrating
```

Subscores:

```text
Motion Recovery
Relation Recovery
Mixed Flexibility
Return Strength
```

Explanation:

```text
A higher Transfer Score means the skill is recovering more smoothly when the format changes. A lower score means the skill may still depend on the original format.
```

Claims boundary:

```text
This is a training indicator, not proof of general intelligence change.
```

---

## Screen J — Programme complete screen

### Purpose

Summarise the 20-session programme and guide the next step.

### Required elements

```text
completion message
Attention Control change
Binding Focus change
Transfer Score
strongest area
current focus area
recommended next step
self-guided mode CTA
```

### Example

```text
20-session programme complete

Your strongest gain:
Attention Control

Current focus:
Binding Focus in moving patterns

Transfer Score:
72 / 100
Developing

Your results suggest that your attention skill is beginning to carry across formats, with more room to strengthen colour–direction binding under motion.

[Continue self-guided practice]
[Repeat mixed challenge]
[Run a return check later]
[View full progress]
```

---

## Screen K — Self-guided gameplay mode

### Purpose

Allow continued use after the formal 20-session pathway.

### Required elements

```text
mode selector
recommended practice
free practice
mixed challenge
return check
progress logging
```

### Copy

```text
Self-guided practice

You have completed the structured 20-session programme. You can now keep practising, revisit weaker areas, run mixed challenges or schedule return checks.

Your scores will continue to update, but the formal 20-session Transfer Score remains the main programme summary.
```

Mode options:

```text
Recommended practice
Focus on the area that most needs reinforcement.

Mixed challenge
Switch between static, moving, simple and relative displays.

Return check
Re-check what carries over after time away.

Practice a specific skill
Choose Attention Control, Binding Focus or Motion Recovery.
```

---

# 6. Score availability and confidence rules

## 6.1 Confidence labels

Use:

```text
calibrating
moderate confidence
high confidence
timing limited
unstable today
```

## 6.2 Consumer wording

| Confidence label    | User-facing meaning                                       |
| ------------------- | --------------------------------------------------------- |
| Calibrating         | More sessions are needed before this score is stable.     |
| Moderate confidence | Enough data are available for a useful training estimate. |
| High confidence     | This score is based on repeated stable sessions.          |
| Timing limited      | Device timing may have affected the estimate.             |
| Unstable today      | Today’s session looked unusually variable.                |

## 6.3 Low-data display

Never hide the score area completely. Show:

```text
Calibrating
```

or:

```text
Coming later
```

with a clear explanation.

Example:

```text
Binding Focus
Calibrating

This score becomes clearer after more colour–direction trials.
```

---

# 7. Standardised score display

## 7.1 Training Score

Use a simple standardised score alongside bits/sec when supported.

Example:

```text
Attention Control
3.4 bits/sec
Training Score: 104
```

## 7.2 Consumer explanation

```text
Training Score compares your current estimate with your own baseline and, when enough data are available, with broader app norms.
```

## 7.3 Display caution

Do not show precise normed scores until enough calibration data are available.

Fallback states:

```text
developing
standard
strong
advanced
```

or:

```text
calibrating
```

---

# 8. Trend display

## 8.1 Show both raw and smoothed values

The progress graph should show:

```text
session dots = actual session estimates
solid line = smoothed trend
```

## 8.2 Why

Users should see that day-to-day variation is normal while still understanding the longer-term trend.

## 8.3 Trend labels

Use:

```text
improving
steady
developing
variable today
needs more data
```

Avoid:

```text
failed
poor
weak
deficit
impaired
```

---

# 9. Claims boundary note

Every profile or transfer screen should include a small note:

```text
These are training indicators. They are not a diagnosis, not an official IQ test and not proof of general intelligence change. More sessions make the profile more reliable.
```

Use this note especially on:

```text
Profile dashboard
Transfer screen
Programme complete screen
Score-detail screens
```

---

# 10. Background-only research metrics

The following must stay hidden from consumer UX:

```text
MIR
ASI
CBA
LISS
PRR
MI recovery
beta*
alpha stability
large-update events
trajectory windows
scratch baseline source
condition entropy
ET_75
staircase level
lapse rate
model parameters
calibration-table IDs
```

These may be shown only in:

```text
research dashboard
admin/debug view
data export
internal validation reports
```

---

# 11. Minimum consumer screen set for MVP

The minimum viable consumer UX should include:

```text
1. Today screen
2. Pre-session briefing
3. Task screen
4. Session complete screen
5. Main profile dashboard
6. Progress over time screen
7. 20-session journey screen
8. Transfer screen
9. Score-detail screens
10. Programme complete screen
11. Self-guided gameplay screen
```

If build scope is tight, the most important screens are:

```text
Today
Task
Session complete
Profile dashboard
Progress
Transfer
```

The Transfer screen should not be deferred, because Transfer Score must be accessible at any time, even while calibrating.

---

# 12. Final UX rule

The consumer should see:

```text
capacity
progress
transfer
confidence
next step
```

The researcher should see:

```text
timing
thresholds
trajectory metrics
carrier-swap boundaries
validation signatures
scratch baselines
model versions
```

In one line:

```text
Show the user what is improving and whether it carries over; keep the transfer machinery in the background.
```
