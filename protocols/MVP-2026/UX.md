# CCC Protocol App — UX Flow Tree

## 0. App shell and global navigation

### 0.1 Mobile-first app shell

Use the selected clean “Screen C” aesthetic.

Core layout:

* White / pale background
* Sticky compact header
* Centred task card
* Large thumb-friendly controls
* Bottom navigation
* Soft metric cards
* Lime only for success / validation / “good signal”

Recommended bottom navigation:

* Today
* Train
* Results
* Settings

Rationale:

* “Today” keeps the app guided.
* “Train” gives direct access to the task modes.
* “Results” contains scores, progress and profile.
* “Settings” contains accessibility, data, sound and evidence links.

Progress should live inside Results rather than being a separate tab in the first MVP, to keep the app simpler on phones.

---

## 1. First launch / onboarding

### 1.1 Welcome screen

Purpose:
Introduce the app in one simple sentence.

User sees:

* “Cognitive Bandwidth”
* “Train your ability to extract the main direction from brief arrow displays.”
* Primary button: “Start setup”
* Secondary link: “How it works”

CSS style:

* `.app-screen`
* `.app-main.is-centred`
* `.ui-card`
* `.ui-heading-xl`
* `.ui-button-primary`

---

### 1.2 Claim boundary screen

Purpose:
Set safe expectations before any scores are shown.

User sees:

* “This is not an IQ test.”
* “The app estimates training scores from brief arrow tasks.”
* “Scores are shown with confidence and timing-quality labels.”
* Primary button: “Continue”

Do not use:

* “diagnosis”
* “brain state”
* “IQ increase”
* “clinical assessment”

This screen should be short and calm.

---

### 1.3 Device and timing check

Purpose:
Make sure the phone or browser can run masked trials reliably.

User sees:

* “Checking display timing”
* “This helps make your score more reliable.”
* Progress animation
* Result: “Timing looks good” or “Timing may be limited”

Possible outputs:

* Timing quality: Good
* Timing quality: Acceptable
* Timing quality: Limited

If timing is limited:

* Allow training
* Flag scores as lower confidence
* Avoid ultra-short exposures

---

### 1.4 Input preference screen

Purpose:
Let users choose response layout.

User sees:

* “Choose your response layout”
* Two-button layout: Left / Right
* Optional: “Swap button order”
* Optional: “Left-handed mode”
* Optional: “Sound feedback on/off”

This supports phone use and avoids frustration.

---

### 1.5 How it works screen

Purpose:
Explain the app without theory overload.

Three cards only:

1. See brief arrows
   “Five arrows appear very briefly.”

2. Choose the majority
   “Tap the direction most arrows were pointing.”

3. Track your bandwidth
   “After each session, you’ll see clear scores with confidence labels.”

Primary button:

* “Try the tutorial”

---

### 1.6 Tutorial: Direction Bandwidth

Purpose:
Teach the absolute direction task.

User sees:

* “Were most arrows pointing left or right?”
* Example display
* Prompt: “Look for the direction that happens most.”
* Practice trial with no scoring

Flow:

* Show example
* User taps Left / Right
* Show gentle feedback
* Repeat 2–3 times
* Continue to first calibration

---

### 1.7 Tutorial: Frame Bandwidth

Purpose:
Teach the relational / frame task only after Direction Bandwidth is understood.

User sees:

* “Now judge direction relative to the centre.”
* “Out means away from the centre.”
* “In means towards the centre.”
* Practice trial with no scoring

MVP note:
Keep this to In / Out first.
Circle Right / Circle Left can unlock later.
Do not introduce Spiral in the first MVP.

---

## 2. Today tab

### 2.1 Today home

Purpose:
Give one recommended action.

User sees:

* Greeting / short status
* “Today’s session”
* Recommended session card
* Estimated duration
* Main score snapshot
* Primary button: “Start”

Example card:

* “Today’s session: Direction Bandwidth”
* “6 minutes”
* “Current focus: improve majority-direction control”
* Button: “Start session”

Score snapshot:

* Direction Bandwidth: 3.4 bits/sec
* Frame Bandwidth: still calibrating
* Timing quality: Good

---

### 2.2 Today after onboarding

Purpose:
After the user has enough data, Today becomes adaptive.

Possible states:

New user:

* “Complete your first calibration.”

Returning user:

* “Continue your current wrapper.”

Benchmark due:

* “Benchmark session ready.”

Potential bottleneck:

* “Your profile suggests Frame Bandwidth may be the current training focus.”

Buttons:

* “Start recommended session”
* “Choose another session”
* “View why this was recommended”

---

### 2.3 Recommendation explanation

Purpose:
Make adaptive choices transparent.

User sees:

* “Why this session?”
* 2–3 short reasons

Example:

* “Your Direction Bandwidth estimate is stable.”
* “Your Frame Bandwidth is still calibrating.”
* “The next useful step is more In / Out frame training.”

Buttons:

* “Start”
* “Choose another session”

---

## 3. Train tab

### 3.1 Train menu

Purpose:
Let users choose task mode without overloading them.

Sections:

Recommended

* Continue current session
* Focus suggested layer

Core tests

* Direction Bandwidth
* Frame Bandwidth

Later / locked

* Flexible Bandwidth
* Wrapper Recovery
* Benchmark Session

Each card should show:

* What it trains
* Approximate duration
* Current status: Ready / Calibrating / Locked / Due

---

### 3.2 Direction Bandwidth start screen

Purpose:
Start absolute majority-direction task.

User sees:

* “Direction Bandwidth”
* “Choose the direction most arrows were pointing.”
* Current wrapper: Left / Right
* Duration: Quick / Standard
* Primary button: “Start”

Options:

* Quick test: 3–5 minutes
* Standard test: 6–10 minutes
* Calibration: longer, only during setup or benchmark

---

### 3.3 Frame Bandwidth start screen

Purpose:
Start relational / polar majority-direction task.

User sees:

* “Frame Bandwidth”
* “Choose the majority direction relative to the centre.”
* Current wrapper: Out / In
* Primary button: “Start”

Later wrappers:

* Circle Right / Circle Left
* Spiral Out / Spiral In — locked until later version

---

### 3.4 Flexible Bandwidth start screen

Purpose:
Mixed-wrapper task after the user has enough data.

Unlock condition:

* Direction and Frame tasks have usable estimates
* Wrapper recovery has been observed at least once

User sees:

* “Flexible Bandwidth”
* “Recover the same operation when the surface changes.”
* “This session mixes formats.”

Buttons:

* “Start mixed session”
* “Practise current wrapper first”

---

### 3.5 Benchmark Session start screen

Purpose:
Stable profile update.

User sees:

* “Benchmark Session”
* “A longer check to update your profile.”
* Duration: 15–20 minutes for CCC-only MVP
* Shows what will be measured:

  * Direction Bandwidth
  * Frame Bandwidth
  * Frame Cost
  * Flexible Bandwidth
  * Wrapper Recovery
  * Timing Quality

Button:

* “Start benchmark”

---

### 3.6 Focused Training start screen

Purpose:
Let the user target a potential bottleneck without forcing it.

Example:

* “Focus: Frame Bandwidth”
* “Your Direction Bandwidth is stable, but relation-based direction judgements are still costly.”

Buttons:

* “Focus on Frame Bandwidth”
* “Proceed as normal”
* “Not today”

---

## 4. Trial micro-flow

### 4.1 Ready screen

Purpose:
Prepare the user without stress.

User sees:

* Trial progress
* Current task label
* Short cue: “Focus on the majority.”
* Button: “Start trial”

For fast blocks, this can appear only at the beginning of the block.

---

### 4.2 Fixation state

Purpose:
Centre attention.

Screen:

* Central fixation cross
* No score
* No distracting text

Timing:

* 300–600 ms jittered

---

### 4.3 Stimulus state

Purpose:
Show five arrows briefly.

Screen:

* Five static arrows around central fixation
* No score
* No extra labels during active stimulus

Timing:

* Adaptive exposure duration
* Actual frame count logged

---

### 4.4 Mask state

Purpose:
Prevent after-image effects and preserve task logic.

Screen:

* Mask shapes appear at arrow locations
* Brief neutral transition
* No score

Timing:

* 300–500 ms

---

### 4.5 Response state

Purpose:
Collect response quickly and clearly.

Screen:

* Question:

  * “Were most arrows pointing left or right?”
  * or “Were most arrows pointing out or in?”
* Two large response buttons
* Progress bar
* Remaining time indicator

Do not show:

* Accuracy
* Bits/sec
* Trial difficulty
* Current threshold
* Entropy value

---

### 4.6 Feedback state

Purpose:
Give immediate, low-stress feedback.

Correct:

* Small lime / cyan pulse
* “Correct”
* Optional soft click

Incorrect:

* Brief red flash
* Small shake or pulse
* Optional low-volume sound

Keep feedback short.
Do not punish.
Do not show detailed metrics after every trial.

---

### 4.7 Mini-block pause

Purpose:
Let the user reset briefly.

Appears every short block, not after every trial.

User sees:

* “Short pause”
* “Accuracy over speed.”
* Progress: Trial 18 of 36
* Button: “Continue”

Optional:

* “Take a longer break”

---

## 5. Session completion

### 5.1 Session complete screen

Purpose:
Reward completion and show the main result clearly.

User sees:

* “Session complete”
* Main score card
* Today’s estimate
* Recent baseline
* Confidence label
* Timing quality

For Direction session:

* Direction Bandwidth: X.X bits/sec
* Recent baseline: X.X bits/sec
* Confidence: Moderate / High / Calibrating
* Timing quality: Good / Acceptable / Limited

For Frame session:

* Frame Bandwidth: X.X relational bits/sec
* Frame Cost: X.X bits/sec
* Frame Efficiency Ratio: XX%
* Confidence label
* Timing quality

Buttons:

* “Done”
* “View details”
* “Continue training”

---

### 5.2 Result explanation screen

Purpose:
Explain scores in plain language.

Score explanations:

Direction Bandwidth

* “How quickly and accurately you extract the majority direction from brief arrow displays.”

Frame Bandwidth

* “How well you judge direction relative to a centre or frame.”

Frame Cost

* “How much extra cost appears when the task becomes relational.”

Flexible Bandwidth

* “How well you keep performance when wrappers are mixed.”

Wrapper Recovery

* “How quickly you recover after the task format changes.”

Timing Quality

* “How reliable the display timing was for this session.”

Confidence

* “How much data the app currently has for this score.”

---

### 5.3 Next step screen

Purpose:
Convert results into an action.

Examples:

If score is still calibrating:

* “Next: complete one more Direction session.”

If Direction is stable but Frame is weak:

* “Next: start Frame Bandwidth training.”

If wrapper has flattened:

* “Next: try the next wrapper.”

If timing quality is limited:

* “Next: repeat with stable display timing.”

Buttons:

* “Start next step”
* “Return to Today”
* “View Results”

---

## 6. Results tab

### 6.1 Results overview

Purpose:
Give a clean score dashboard.

Primary score cards:

* Direction Bandwidth
* Frame Bandwidth
* Frame Cost
* Flexible Bandwidth
* Wrapper Recovery

Secondary status:

* Timing Quality
* Confidence
* Training Band
* Current Wrapper
* Recent Baseline

Each score should show:

* Today’s estimate
* Recent baseline
* Confidence label
* Direction of change

Do not show Transfer Score yet unless the app has enough data.

---

### 6.2 Score detail: Direction Bandwidth

Purpose:
Explain and track absolute direction control.

Sections:

* Current score
* Recent baseline
* Trend chart
* Wrapper breakdown:

  * Left / Right
  * Up / Down
  * Diagonal — future / locked if not in MVP
* Timing quality
* Confidence

---

### 6.3 Score detail: Frame Bandwidth

Purpose:
Explain and track relational / frame control.

Sections:

* Current score
* Recent baseline
* Trend chart
* Wrapper breakdown:

  * Out / In
  * Circle Right / Circle Left
  * Spiral — future / locked if not in MVP
* Frame Cost explanation
* Confidence

---

### 6.4 Score detail: Frame Cost

Purpose:
Make the relational cost understandable.

User sees:

* “Frame Cost = Direction Bandwidth minus Frame Bandwidth”
* “A lower cost means less drop when the task becomes relational.”
* Difference score
* Ratio score
* Trend over time

Possible label:

* “Still calibrating”
* “Low cost”
* “Moderate cost”
* “High current cost”

Avoid:

* “weakness”
* “deficit”
* “poor”

---

### 6.5 Score detail: Wrapper Recovery

Purpose:
Show transfer-relevant progress.

User sees:

* Current wrapper sequence
* Dip after wrapper change
* Recovery trend
* Trials or sessions to recover
* Current status:

  * Learning
  * Flattening
  * Recovered
  * Mixed
  * Still calibrating

Plain language:

* “This shows how quickly you recover the same task rule after the surface changes.”

---

### 6.6 Score detail: Flexible Bandwidth

Purpose:
Show mixed-wrapper control.

Unlock condition:

* Requires enough data across at least two wrappers.

User sees:

* Mixed-wrapper score
* Current wrapper mix
* Accuracy / capacity stability
* Lure or confusion notes if relevant

---

### 6.7 Profile summary

Purpose:
Summarise the current training profile.

Sections:

* Strongest current score
* Most improved score
* Current training focus
* Score confidence
* Suggested next session

Example:

* “Current training focus: Frame Bandwidth”
* “Your Direction score is stable, but frame-based judgements are still more costly.”

---

### 6.8 Population norms screen

Purpose:
Optional later screen.

MVP treatment:

* Show as “coming later” unless norm group is large enough.

User sees:

* “Personal baseline is available now.”
* “Population comparison will appear when there is enough comparable data.”

This avoids overclaiming early norms.

---

## 7. Training focus / bottleneck flow

### 7.1 Current training focus card

Purpose:
Offer adaptation without making a diagnosis.

User sees:

* “Current training focus”
* “Potential focus: Frame Bandwidth”
* Short explanation
* Choice buttons

Example:
“Your Direction Bandwidth is stable, but Frame Bandwidth is currently below your recent pattern. This may mean relational direction extraction is the best focus for the next session.”

Buttons:

* “Focus on this”
* “Proceed as normal”
* “Skip recommendation”

---

### 7.2 Focused session preview

Purpose:
Show what will happen before the user starts.

Example:
Frame Bandwidth focus:

* 1 minute Direction warm-up
* 6–8 minutes Frame Bandwidth
* 2 minutes mixed bridge
* Short result summary

Button:

* “Start focused session”

---

### 7.3 Focused session summary

Purpose:
Show whether the focus session helped.

User sees:

* Target score
* Downstream bridge score
* Timing quality
* Confidence
* Next recommendation

Example:

* “Frame Bandwidth improved today, but confidence is still moderate. We’ll re-check before changing your training route.”

---

## 8. Settings tab

### 8.1 Settings home

Sections:

* Account
* Sound and haptics
* Accessibility
* Display timing
* Reminders
* Data and privacy
* Evidence and claims

---

### 8.2 Accessibility settings

Options:

* Larger buttons
* Larger text
* Reduce motion
* High contrast
* Left-handed mode
* Swap response buttons
* Sound on/off

---

### 8.3 Timing and device settings

User sees:

* Last timing check
* Refresh rate estimate
* Timing quality history
* Button: “Run timing check again”

---

### 8.4 Data and privacy

Options:

* Export data
* Delete data
* Manage consent
* View privacy summary

---

### 8.5 Evidence link

Purpose:
Keep evidence material outside the core app.

User sees:

* “View evidence and proof dashboard”
* Opens website

This avoids turning the app into a claims-heavy proof interface.

---

## 9. Help and explanation screens

### 9.1 Help overlay

Accessible from the header.

Contents:

* “What am I supposed to do?”
* “Why are there masks?”
* “What does bits/sec mean?”
* “Why is my score still calibrating?”
* “Why did the task change?”

Keep help contextual and short.

---

### 9.2 Score glossary

Plain-English glossary:

* Direction Bandwidth
* Frame Bandwidth
* Frame Cost
* Flexible Bandwidth
* Wrapper Recovery
* Timing Quality
* Confidence

---

## 10. Error and interruption states

### 10.1 Timing limited

Message:
“Display timing was unstable, so today’s score is marked timing limited.”

Actions:

* “Retry later”
* “Continue training”
* “Run timing check”

---

### 10.2 Interrupted session

Message:
“Session paused. Your completed trials were saved.”

Actions:

* “Resume”
* “Restart”
* “Return to Today”

---

### 10.3 Insufficient data

Message:
“This score is still calibrating.”

Show:

* Number of sessions needed
* Next recommended action

---

### 10.4 Global bad session

Message:
“Today looked harder across all scores. We’ll re-check before changing your training focus.”

This prevents over-interpreting fatigue, distraction or poor device timing.

---

## 11. Desktop / laptop adaptation

### 11.1 Desktop shell

Use the same visual system, but widen the interface.

Layout:

* Central task card
* Optional side panel with:

  * Score explanation
  * Current wrapper
  * Session progress
  * Help text

Do not add distracting real-time metrics during active trials.

---

### 11.2 Keyboard input

Support:

* Left / Right arrow keys
* Up / Down for vertical wrappers
* Optional A / L or F / J for laptop keyboards

Show keyboard hints only on desktop.

---

## 12. Recommended MVP screen list

Must-have screens:

1. Welcome
2. Claim boundary
3. Device timing check
4. Input preference
5. How it works
6. Direction tutorial
7. Frame tutorial
8. Today home
9. Train menu
10. Direction Bandwidth start
11. Frame Bandwidth start
12. Trial screen
13. Mini-block pause
14. Session complete
15. Result explanation
16. Next step
17. Results overview
18. Direction score detail
19. Frame score detail
20. Frame Cost detail
21. Wrapper Recovery detail
22. Current training focus
23. Focused session preview
24. Settings
25. Help / glossary
26. Timing-limited warning
27. Interrupted-session recovery
28. Insufficient-data state

Later screens:

1. Flexible Bandwidth start
2. Mixed-wrapper score detail
3. Benchmark session
4. Population norms
5. Transfer Score
6. Detailed export / research dashboard
7. Evidence dashboard link card

---

# Update to Revise the Above Specs

The UX should be more confident about the scientific basis. The app should not feel like a generic “focus game”; it should feel like an **objective cognitive-control capacity tool** with a training layer.

The strongest evidence-based positioning is:

**This app estimates cognitive control capacity for attention using an adaptive, MFT-M-inspired bits/sec method. It measures standard majority-direction control and extends this into relational / frame-based control, because relational processing is closely tied to fluid intelligence.**

The standard MFT-M foundation is solid: Wu et al. quantified cognitive control capacity in **bits per second**, estimating healthy young adults at roughly **3–4 bps**. ([Nature][1]) He et al. then showed that a computerised adaptive testing approach can estimate CCC more efficiently, with adaptive scores strongly related to the original MFT-M approach and high test–retest reliability, reducing the original 864-trial task to fewer than 216 trials. ([Sage Journals][2])

The IQ-relevance is also defensible. Chen et al. tested a cognitive-control model of intelligence using MFT-M and ANT-R measures of cognitive control alongside WAIS measures of general intelligence, including fluid intelligence and crystallised intelligence. ([Nature][3]) More broadly, attention resource capacity under high cognitive load has been linked with fluid reasoning intelligence in multiple-object tracking work, especially when attentional load is high. ([ResearchGate][4])

The relational version has a strong theoretical basis. Relational integration has been found to predict fluid reasoning above and beyond several working-memory tasks. ([Springer][5]) A later Intelligence paper reported that a relation-processing factor was statistically equivalent to a fluid-reasoning factor loaded by hallmark Gf tests. ([IDEAS/RePEc][6]) So your “Frame Bandwidth” score can be presented as an **IQ-relevant relational attention-control measure**, provided we clearly state that it is an IQ-relevant component measure, not a full IQ score.

There is also direct training-relevance evidence. Zhang et al. reported that attention-control training using MFT-M showed transfer effects on cognitive tasks, with the PubMed record noting broad transfer scope and effects influenced by the trained content / task form. ([PubMed][7]) Your own CCC spec already supports the key scoring architecture: Direction Bandwidth, Frame Bandwidth, Frame Cost, Wrapper Recovery and Flexible Bandwidth, all shown with bits/sec, recent baseline and confidence / reliability flags.  The meta-spec also sensibly avoids “official IQ score” and “guaranteed far transfer” claims, while allowing claims about component skills involved in adaptive reasoning and transfer testing. 

## Recommended positioning change

I would **not** lead with “This is not an IQ test.” That sounds defensive.

Instead, lead with:

> **Objective cognitive-control capacity scores**
> This app estimates how efficiently you extract goal-relevant information from brief displays. Scores are shown in bits/sec, based on peer-reviewed cognitive-control capacity methods.

Then add the boundary afterwards:

> These scores are IQ-relevant cognitive measures, not a full psychometric IQ test.

That gives you the confidence without overclaiming.

## UX flow changes

### Replace “Claim boundary” with “Scientific basis and scope”

Current screen:

> This is not an IQ test.

Better screen:

> **A scientific measure of cognitive control capacity**
> The task estimates how much goal-relevant information you can process under time pressure.
> Your score is shown in bits/sec, with confidence and timing-quality labels.
> These are IQ-relevant attention-control measures, not a full IQ test.

Button:

> Continue setup

### Update the Welcome screen

Use:

> **Measure and train cognitive control capacity**
> Get objective bits/sec scores for standard and relational attention control.

Small supporting line:

> Based on MFT-M-style cognitive-control capacity estimation and adaptive trial selection.

Primary button:

> Start setup

Secondary:

> See the science

### Update “How it works”

Instead of only:

> See brief arrows / Choose the majority / Track your bandwidth

Use:

1. **Brief masked displays**
   Five arrows appear briefly, then disappear behind masks.

2. **Objective bandwidth estimate**
   The app estimates how much information you can control accurately per second.

3. **Standard and relational control**
   Direction Bandwidth measures standard attention control. Frame Bandwidth measures relational control, which is closely linked to fluid reasoning.

### Update Results explanation

**Direction Bandwidth**

> Your objective estimate of standard cognitive-control capacity: how efficiently you extract the majority direction from a brief masked display.

**Frame Bandwidth**

> Your estimate of relational cognitive-control capacity: how efficiently you judge direction relative to a centre or frame. Relational processing is one of the core abilities involved in fluid intelligence.

**Frame Cost**

> The extra processing cost of moving from standard direction control to relational frame-based control. A lower cost means the relational version is becoming more efficient.

**Wrapper Recovery**

> How quickly you recover the same control operation when the task format changes. This matters because transfer depends on recovering the same rule under new surfaces.

## Copy block for the UX spec

# Scientific positioning update for the CCC app

The CCC app should be positioned as a scientific cognitive-control capacity tool, not a generic attention game.

The app provides objective behavioural estimates of cognitive control capacity for attention. It uses brief masked arrow displays and adaptive trial selection to estimate how much goal-relevant information the user can process accurately per second.

The core score is shown in bits/sec.

The app measures two forms of cognitive control capacity:

## Direction Bandwidth

Direction Bandwidth measures standard cognitive-control capacity.

The user sees a brief display of arrows and chooses the majority absolute direction. This estimates how efficiently they can extract the relevant direction signal from competing information under time pressure.

User-facing explanation:

“Direction Bandwidth shows how quickly and accurately you can pick out the main direction from a brief display.”

## Frame Bandwidth

Frame Bandwidth measures relational cognitive-control capacity.

The user judges the majority direction relative to a centre or frame. This adds a relational processing demand, because the user must judge the arrow direction in relation to another reference point rather than simply reading off left, right, up or down.

User-facing explanation:

“Frame Bandwidth shows how well you can detect direction in relation to a centre or frame, not just the direction itself.”

## Frame Cost

Frame Cost compares standard and relational control.

It shows how much extra processing cost appears when the task moves from simple direction extraction to frame-based relational extraction.

User-facing explanation:

“Frame Cost shows how much harder the task becomes when you need to use a relation, not just a simple direction.”

## Intelligence-relevant positioning

The app should clearly explain that these scores are IQ-relevant cognitive measures.

Cognitive control supports the ability to select, coordinate and use goal-relevant information. Relational processing is especially important for fluid intelligence, because fluid reasoning depends on detecting and applying relations in novel problems.

The app should therefore say:

“These scores are related to abilities involved in fluid intelligence, especially attention control and relational processing. They are not a full IQ test and do not replace a psychometric assessment.”

## Recommended onboarding language

Title:

“Measure cognitive control capacity”

Body:

“This app estimates how efficiently you control attention under time pressure. You will complete brief masked arrow tasks, and the app will estimate your cognitive bandwidth in bits/sec.”

Second paragraph:

“You will train two forms of control: standard direction control and relational frame-based control. The relational version matters because fluid intelligence depends heavily on detecting and using relations.”

Button:

“Start setup”

## Recommended score screen language

Session complete:

“Your cognitive-control estimate is ready.”

Direction Bandwidth:

“Your standard attention-control capacity today was X.X bits/sec.”

Frame Bandwidth:

“Your relational attention-control capacity today was X.X relational bits/sec.”

Frame Cost:

“The relational frame added a cost of X.X bits/sec.”

Confidence:

“This score is marked moderate confidence because the app is still building your baseline.”

Timing quality:

“Timing quality was good, so this estimate is usable for your training profile.”

## Claims to use

Use:

“Objective cognitive-control capacity estimate”

“Bits/sec score”

“Based on MFT-M-style cognitive-control capacity methods”

“Adaptive trial selection”

“IQ-relevant attention-control measure”

“Relational processing is closely linked to fluid intelligence”

“Tracks standard and relational control separately”

“Shows confidence and timing-quality labels”

Avoid:

“This is your IQ”

“This proves your IQ increased”

“Clinical diagnosis”

“Brain-state detection”

“Guaranteed far transfer”

“Medical assessment”

The practical shift is: **make the science visible early**, but keep the active trial screen clean. The user should know before and after training that this is an objective, IQ-relevant cognitive-control capacity estimate; during trials, they should only see the task.

[1]: https://www.nature.com/articles/srep34025?utm_source=chatgpt.com "The Capacity of Cognitive Control Estimated from a ..."
[2]: https://journals.sagepub.com/doi/10.1177/17470218211030838?utm_source=chatgpt.com "Adaptive assessment of the capacity of cognitive control"
[3]: https://www.nature.com/articles/s41598-019-39685-2?utm_source=chatgpt.com "Testing a Cognitive Control Model of Human Intelligence"
[4]: https://www.researchgate.net/publication/325857286_The_characterization_of_attention_resource_capacity_and_its_relationship_with_fluid_reasoning_intelligence_A_multiple_object_tracking_study?utm_source=chatgpt.com "The characterization of attention resource capacity and its ..."
[5]: https://link.springer.com/article/10.3758/s13421-013-0366-x?utm_source=chatgpt.com "The relational integration task explains fluid reasoning above ..."
[6]: https://ideas.repec.org/a/eee/intell/v82y2020ics0160289620300672.html?utm_source=chatgpt.com "Fluid reasoning is equivalent to relation processing"
[7]: https://pubmed.ncbi.nlm.nih.gov/38777117/?utm_source=chatgpt.com "Attention control training and transfer effects on cognitive ..."
