# Attention Coach / IQ Coach — Consumer UX Scores and Progress Specification

## v2.0 — WAP-consistent adaptive progression UX

**Status:** revised consumer UX specification aligned with Wrapper Adaptive Progression (WAP)  
**Supersedes:** earlier UX specification that implied a fixed 20-session pathway  
**Scope:** consumer-facing screens, score language, progress display, transfer access, target-envelope completion and self-guided continuation  
**Core UX change:** the app is presented as an adaptive training programme with a typical 20-session target envelope. New wrappers appear when the user’s learning curve is stable enough, not when a fixed session number is reached.

---

## Purpose

This UX specification defines the consumer-facing score screens for the Attention Coach / IQ Coach standalone app.

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

The user should not see research metrics such as MI recovery, alpha stability, beta alignment, ET thresholds, entropy values, trajectory windows, scratch-baseline models or WAP gate thresholds.

The consumer experience should answer three questions:

```text
1. How well am I extracting the important signal?
2. How well am I keeping signal + colour/features stable?
3. Is this skill carrying over when the display format changes?
```

The consumer experience should also make one progression rule clear:

```text
New challenges appear when your learning curve is stable.
```

The app should not imply that a wrapper swap occurs because a particular session number has been reached.

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
current phase
next challenge
learning curve
ready soon
calibrating
```

Avoid:

```text
CCC
BSE
WAP
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
slope threshold
gate failed
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
what exact learning-curve thresholds are used
```

## 1.4 Adaptive progression rule

The app should not be presented as a fixed 20-session course.

Use this framing:

```text
A typical 20-session adaptive programme.
New challenges appear when your learning curve is stable.
```

The app may still show:

```text
Session 7
Typical pathway: about 20 sessions
Current phase: Motion Foundation
```

Avoid:

```text
Session 7 of 20 means Motion Foundation starts now.
You unlocked the next phase because you reached session 8.
You failed to unlock the next phase.
```

The backend may use a 20-session target envelope for planning and completion messaging, but the UX should make clear that phase changes are readiness-based.

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
Show the current adaptive phase.
Show current phase status.
Show a small score summary.
Show Transfer Score access.
```

## 2.2 Train

Purpose:

```text
Start or resume the active training task.
Access tutorial or practice mode.
Show the current task focus.
```

## 2.3 Progress

Purpose:

```text
Show smoothed score curves across sessions.
Show the adaptive journey through the target envelope.
Show capacity trends.
Show phase movement as learning-curve based, not date based.
```

## 2.4 Transfer

Purpose:

```text
Make Transfer Score accessible at any time.
Show Motion Recovery, Relation Recovery, Mixed Flexibility and Return Strength.
Explain what is available now and what is still calibrating.
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

This score becomes clearer as new challenge formats are introduced and enough data are collected.
```

## 3.1 Transfer availability by actual WAP events

Transfer availability should depend on actual training events, not fixed session numbers.

| Actual event / state | Transfer display |
|---|---|
| Before first carrier swap | Calibrating · building baseline |
| After `T_CM_BASE` has enough post-transition evidence | Motion Recovery available |
| Before relational carrier swap has occurred | Relation Recovery · coming up / not enough evidence |
| After `T_CM_REL` has enough post-transition evidence | Relation Recovery available |
| After mixed phase has enough evidence | Mixed Flexibility available |
| After delayed / return-check evidence | Return Strength available |
| Target envelope reached before all events | Available components shown; unfinished components remain not enough evidence |
| Self-guided continuation adds enough data | Previously unavailable components may become available later |

The user should never have to wait until the target-envelope completion point to find the Transfer area. It should be visible from the start, with clear calibrating and not-enough-evidence states.

## 3.2 Transfer access copy

Use:

```text
Transfer Score
Calibrating

We are building the baseline needed to test whether your attention skill carries into changed formats.
```

Later:

```text
Transfer Score
Developing

Some parts are available now. Other parts will become clearer after more adaptive sessions.
```

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

If Binding Focus has less evidence than Attention Control, show:

```text
Binding Focus
Calibrating

This score is based on fewer trials, so it will update more gradually.
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

If not enough data exist:

```text
Transfer Score
Calibrating

This becomes clearer after your learning curve reaches new challenge formats.
```

## 4.4 Transfer sub-scores

| Score | User-facing meaning | Appears when |
|---|---|---|
| Motion Recovery | Static → moving patterns | after the motion foundation transition has enough evidence |
| Relation Recovery | Relative-direction skill in moving patterns | after the relational motion transition has enough evidence |
| Mixed Flexibility | Switching across all formats | after enough mixed-format evidence |
| Return Strength | Recovery after spacing | after enough return-check evidence |

---

# 5. Screen specification

## Screen A — Today screen

### Purpose

Daily entry point. The user should know what to do next, what phase they are currently in and whether the next challenge is ready yet.

### Required elements

```text
Greeting
Session number
Target-envelope progress label
Current phase
Current phase status
Primary CTA
Mini score summary
Transfer Score mini-card
```

### Example layout

```text
Welcome back

Session 7
Typical pathway: about 20 sessions
Current phase: Direction Foundation
Status: building a stable baseline

New challenges appear when your learning curve is stable.

[Start today’s session]

Current profile
Attention Control: 3.4 bits/sec · 104
Binding Focus: calibrating
Transfer Score: calibrating
```

### Alternative example when next wrapper is ready

```text
Welcome back

Session 9
Current phase: Direction Foundation
Next challenge: Motion Foundation is ready

Today you’ll practise the same attention skill in moving patterns. A short dip is normal when the display format changes.

[Start today’s session]
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
Current phase status
One-sentence task explanation
Normalise expected dips, where relevant
Estimated duration
Start button
```

### Phase-status copy

Use simple readiness language.

| Internal phase status | User-facing wording |
|---|---|
| `active` | Today continues your current training phase. |
| `extended_for_learning_curve` | We are keeping you in this phase a little longer so the baseline becomes clearer. |
| `ready_next_session` | Your next challenge is ready. |
| `timing_limited` | Device timing looked a little unstable, so today’s scores may be lower confidence. |
| `calibrating` | We are still collecting enough data for a stable estimate. |

Do not say:

```text
failed
not passed
gate failed
phase blocked
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
mini-block progress
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
learning-curve status
WAP status
research metrics
```

---

## Screen D — Mini-block transition / pause screen

### Purpose

Make the four-mini-block structure feel like a guided game rather than a long undifferentiated task.

### Required elements

```text
block complete message
next block label
short instruction if task mix changes
resume CTA
optional pause / exit
```

### Example

```text
Block 2 complete

Next: moving-pattern practice

The display format changes, but your job is the same: pick out the main direction.

[Continue]
```

For mixed phases:

```text
Next: mixed challenge

Static and moving patterns may switch from trial to trial. Watch the response buttons carefully.

[Continue]
```

---

## Screen E — Session complete screen

### Purpose

Give immediate feedback and reinforce progress.

### Required elements

```text
Session complete message
Attention Control card
Binding Focus card, when available
Transfer mini-card
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
Calibrating
Trend: needs more data

Transfer Score
Calibrating

Today’s note
Your current phase is still building a stable baseline. New challenges appear when the learning curve is ready.

[View progress]
[Done]
```

### Example after a format shift

```text
Today’s note
Moving patterns were harder than static patterns, which is normal during a format change. Your next sessions will help your attention recover in this new format.
```

### Transfer access

Include a small link:

```text
View Transfer Score
```

This opens the Transfer screen.

---

## Screen F — Main profile dashboard

### Purpose

Show the user’s current cognitive training profile.

### Required elements

```text
Top profile card
Attention Control card
Binding Focus card
Transfer Score card
2 × 2 format matrix
current phase / training focus note
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

If insufficient data:

```text
Transfer Score
Calibrating
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

| | Simple direction | Relative direction |
|---|---:|---:|
| Static patterns | score + bits/sec | score + bits/sec |
| Moving patterns | score + bits/sec | score + bits/sec |

Example:

```text
Static patterns / Simple direction
104 · 3.4 bits/sec

Moving patterns / Simple direction
96 · 2.8 bits/sec
```

Do not label this as `arrow_abs`, `flow_abs`, `arrow_rel` or `flow_rel`.

### Matrix low-data rule

For cells not yet available, show:

```text
Coming up
```

or:

```text
Not enough evidence yet
```

Do not show zero, blank, or a misleading low score.

### Training focus card

Example:

```text
Current training focus
You are still building a stable baseline in static direction patterns. This makes the later moving-pattern challenge more meaningful.
```

Example after extension:

```text
Current training focus
We are keeping you in this phase a little longer so your learning curve becomes clearer. This is normal in an adaptive programme.
```

Example in motion phase:

```text
Current training focus
Moving patterns are still more effortful than static patterns. This is expected during Motion Foundation.
```

Example for BSE lag:

```text
Current training focus
Your Attention Control score is clearer than your Binding Focus score. Binding Focus will update more slowly because it has fewer trials.
```

---

## Screen G — Progress over time

### Purpose

Show change across sessions.

### Required elements

```text
smoothed trend curve
raw session dots
actual phase shading
target-envelope marker
current phase marker
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

The Transfer chart mode is always available. If not enough data exist, show calibrating segments as faint future lines or placeholders.

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

Use the adaptive phase names:

```text
Direction Foundation
Motion Foundation
Relation Foundation
Motion Relations
Mixed Mastery
Return Check
```

### Phase shading rule

Phase shading should reflect actual WAP phase start and end points, not fixed session ranges.

If the user remains in a phase beyond the typical band, extend that phase’s shading and show:

```text
extended for clearer learning curve
```

If the user advances early, begin the next phase shading when the transition actually occurred.

---

## Screen H — Adaptive journey screen

### Purpose

Show the full target-envelope pathway without implying fixed phase dates.

### Required elements

```text
target-envelope progress bar
phase cards
current phase marker
next challenge preview
readiness status
simple explanation of expected dips
```

### Heading

Use:

```text
Your adaptive journey
```

or:

```text
Typical 20-session pathway
```

Avoid:

```text
20-session schedule
fixed programme
locked phases
```

### Nominal pathway table

| Typical stage | Phase | User explanation |
|---|---|---|
| Early baseline | Direction Foundation | Build your baseline with static direction patterns. |
| First format change | Motion Foundation | Practise the same attention skill in moving patterns. |
| Relation build | Relation Foundation | Shift from simple direction to centre-relative direction. |
| Relation in motion | Motion Relations | Recover relative-direction skill in moving patterns. |
| Flexible practice | Mixed Mastery | Switch between static, moving, simple and relative displays. |
| Return check | Return Check | Re-check what still carries over after spacing. |

### Phase-card states

Use:

```text
Current phase
Coming up next
Available when ready
Calibrating
Completed
```

Avoid:

```text
Locked
Failed
Not passed
```

### Example current-phase card

```text
Current phase
Direction Foundation

You are building the baseline that later motion challenges will compare against.

Status:
Still calibrating
```

### Example next-phase card

```text
Coming up next
Motion Foundation

This begins when your static direction learning curve is stable enough.
```

### If behind the target envelope

```text
This phase is taking a little longer, which is normal in an adaptive programme. The next challenge appears when the learning curve is stable enough.
```

### If ahead of the target envelope

```text
Your next challenge appeared earlier because the current learning curve was stable.
```

---

## Screen I — Transfer screen

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

You are still building the baseline needed to test carry-over. Your first transfer signal appears after the moving-pattern challenge has started and enough evidence has been collected.
```

### Motion Recovery card

Before available:

```text
Motion Recovery
Coming up

This appears after you have practised both static and moving patterns.
```

After available:

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
Coming up

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

Before available:

```text
Mixed Flexibility
Coming up

This checks how well you switch between formats when they appear unpredictably.
```

After available:

```text
Mixed Flexibility
70 / 100
Developing

You are learning to switch between static, moving, simple and relative displays.
```

### Return Strength card

Before available:

```text
Return Strength
Coming up

This checks what still carries over after spacing.
```

After available:

```text
Return Strength
68 / 100
Developing

This shows how well the skill returned after spacing.
```

### Explanation note

```text
Transfer Score is a training indicator. It shows whether skills practised in one display format appear to carry into changed formats. It is not a diagnosis or an official IQ score.
```

---

## Screen J — Score-detail screens

### Purpose

Explain each score clearly.

Each visible score should have a detail screen.

## J.1 Attention Control detail

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

## J.2 Binding Focus detail

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

If BSE is lagging:

```text
This score is still calibrating because Binding Focus has fewer trials than Attention Control in the first version of the app.
```

## J.3 Transfer Score detail

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

## Screen K — Target-envelope complete screen

### Purpose

Summarise the target-envelope period and guide the next step.

This screen may appear around the target-envelope completion point, but it must not imply that all transfer components are complete if WAP has not yet generated enough evidence.

### Required elements

```text
completion message
Attention Control change
Binding Focus change
Transfer Score
available transfer components
unfinished transfer components
strongest area
current focus area
recommended next step
self-guided mode CTA
```

### Example when all main components are available

```text
Target-envelope complete

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

### Example when not all transfer components are available

```text
Target-envelope complete

Your programme has reached the target-envelope point, but some transfer components still need more evidence.

Available now:
Attention Control
Binding Focus
Motion Recovery

Still calibrating:
Relation Recovery
Mixed Flexibility
Return Strength

You can continue in self-guided practice to complete these checks.

[Continue self-guided practice]
[View Transfer Score]
```

---

## Screen L — Self-guided gameplay mode

### Purpose

Allow continued use after the target-envelope period.

### Required elements

```text
mode selector
recommended practice
free practice
mixed challenge
return check
progress logging
unfinished transfer components
```

### Copy

```text
Self-guided practice

You have completed the target-envelope period. You can now keep practising, revisit weaker areas, run mixed challenges or schedule return checks.

Your scores will continue to update. Any transfer components that were still calibrating may become available as more evidence is collected.
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
not enough evidence
```

## 6.2 Consumer wording

| Confidence label | User-facing meaning |
|---|---|
| Calibrating | More sessions are needed before this score is stable. |
| Moderate confidence | Enough data are available for a useful training estimate. |
| High confidence | This score is based on repeated stable sessions. |
| Timing limited | Device timing may have affected the estimate. |
| Unstable today | Today’s session looked unusually variable. |
| Not enough evidence | This component has not had enough relevant trials yet. |

## 6.3 Low-data display

Never hide the score area completely. Show:

```text
Calibrating
```

or:

```text
Coming up
```

or:

```text
Not enough evidence yet
```

with a clear explanation.

Example:

```text
Binding Focus
Calibrating

This score becomes clearer after more colour–direction trials.
```

Example:

```text
Relation Recovery
Not enough evidence yet

This appears after the relative-direction skill has been practised in both static and moving formats.
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
Target-envelope complete screen
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
WAP gate thresholds
capacity slope
minimum trial thresholds
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
4. Mini-block transition / pause screen
5. Session complete screen
6. Main profile dashboard
7. Progress over time screen
8. Adaptive journey screen
9. Transfer screen
10. Score-detail screens
11. Target-envelope complete screen
12. Self-guided gameplay screen
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
learning-curve controller events
```

In one line:

```text
Show the user what is improving, when the next challenge is ready, and whether skill carries over; keep the transfer machinery in the background.
```
