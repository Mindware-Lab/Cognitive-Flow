# IQ Coach 10-Minute Working Memory Benchmark

**Internal name:** `WMC-B10`
**Working title:** Working Memory Capacity & Binding Check
**Version:** `0.1.0`
**Target route:** `/cognitive-performance-tests/working-memory`
**Target duration:** 9–11 minutes, including practice
**Platform:** React + TypeScript + Vite + jsPsych
**Hosting:** Cloudflare Pages
**Data store:** Existing IQ Coach Supabase project
**Status:** Provisional research and product benchmark

---

# 1. Product decision

Build one short benchmark containing two complementary measures:

```text
Part A — Visuospatial Complex Span
Measures storage while performing intervening processing.

Part B — Visual Binding Change Detection
Measures whether visual identities remain bound to their correct locations.
```

Do not use n-back in this benchmark.

Relational n-back and binding n-back are already app-native training measures. The benchmark should provide a partially independent outcome rather than retesting the same task mechanic.

This fits the IQ Coach architecture:

```text
Training:
Relational Memory
Binding Memory

Independent benchmark:
Visuospatial Complex Span
Visual Binding Change Detection
```

The existing IQ Coach specification distinguishes relational WM from binding WM and defines them as separate capacities. The benchmark should preserve that separation rather than collapsing them immediately into one undifferentiated WM score.

---

# 2. Scientific and psychometric status

Complex-span tasks combine memory storage with an intervening processing demand. Oswald et al. demonstrated that complex-span batteries can be shortened through principled item sampling, but their published work does **not** validate this exact ten-minute battery. This implementation must therefore be described as a provisional measure requiring calibration, reliability testing and validation.

Approved wording:

> This test provides provisional estimates of visuospatial working-memory capacity and visual binding precision.

Do not say:

```text
This is a clinical working-memory test.
This diagnoses working-memory impairment.
This is equivalent to a WAIS working-memory score.
This proves that training has increased intelligence.
```

---

# 3. Open-source and licence boundaries

## 3.1 Core framework

### jsPsych

Repository:

[github.com/jspsych/jsPsych](https://github.com/jspsych/jsPsych)

Documentation:

[jspsych.org](https://www.jspsych.org/latest/)

Use jsPsych as the behavioural-task engine. It is designed for browser-based experiments, using timelines and plugins to present stimuli and collect responses and response times.

Pin:

```json
"jspsych": "8.2.3"
```

The current repository package identifies version 8.2.3 and an MIT licence.

Suggested plugins:

```text
@jspsych/plugin-browser-check
@jspsych/plugin-instructions
@jspsych/plugin-fullscreen
@jspsych/plugin-html-button-response
@jspsych/plugin-canvas-button-response
```

Use package versions compatible with jsPsych 8.2.3 and commit the lockfile.

## 3.2 MIT-licensed span reference

### Counting Span jsPsych

Repository:

[github.com/vekteo/Counting_Span_jsPsych](https://github.com/vekteo/Counting_Span_jsPsych)

This repository provides a browser-based storage-plus-processing span task. Its existing version requires participants to count visual targets, retain the counts and recall them serially.

The project is MIT licensed and permits commercial use, modification and distribution, provided the copyright and licence notice are retained.

Use it for:

```text
timeline architecture
set construction
serial-recall handling
trial metadata conventions
general span-task flow
```

Do not retain its researcher-scored response system. The IQ Coach test must be fully self-administered.

## 3.3 Optional simple-span reference

### Digit Span jsPsych

Repository:

[github.com/vekteo/Digit_Span_jsPsych](https://github.com/vekteo/Digit_Span_jsPsych)

The repository contains an MIT-licensed browser digit-span implementation with practice trials, progression rules and automated typed recall.

Digit span is **not part of WMC-B10 v0.1**. It may be used as:

```text
a development reference
a future verbal-memory comparator
a basic quality-control task
```

## 3.4 Change-detection design reference

### Shahar Lab visual-array task

Repository:

[github.com/shahar-lab/working_memory_capacity_change_detection_task](https://github.com/shahar-lab/working_memory_capacity_change_detection_task)

The task displays coloured objects, removes them, and then probes whether the colour at one location is the same or different. Its code shows the basic visual-array and single-location-probe logic.

Treat this repository as **methodological reference only**. Do not copy its code, images or other assets unless a project-level commercial licence is independently confirmed.

## 3.5 Attribution file

Add:

```text
THIRD_PARTY_NOTICES.md
```

It must contain:

```text
jsPsych — MIT licence
Copyright © jsPsych contributors

Counting Span Task — MIT licence
Copyright © 2021 Teodóra Vékony
```

If substantial Counting Span code is reused, preserve its full MIT notice.

---

# 4. Technical architecture

Use:

```text
React
TypeScript
Vite
jsPsych 8.2.3
Vitest
Supabase JavaScript client
Cloudflare Pages
```

## 4.1 React/jsPsych separation

React owns:

```text
app shell
routing
welcome screen
consent/start notice
results screen
error states
data submission status
```

jsPsych owns:

```text
instructions during testing
practice trials
timed stimulus presentation
responses
trial-level data
task transitions
```

Mount jsPsych inside an isolated container:

```html
<div id="jspsych-root"></div>
```

Do not allow React state changes or parent re-renders during a timed trial.

## 4.2 Suggested repository structure

```text
src/
  app/
    App.tsx
    routes.tsx

  pages/
    WorkingMemoryTestPage.tsx
    WorkingMemoryResultsPage.tsx

  wm-test/
    config/
      wmTestConfig.ts
      tokenPalette.ts
      forms.ts

    engine/
      createWmTimeline.ts
      random.ts
      quality.ts
      visibilityMonitor.ts

    complex-span/
      createComplexSpanTimeline.ts
      generateSymmetryPattern.ts
      generateSpatialSequence.ts
      renderSymmetryPattern.ts
      renderSpatialGrid.ts
      renderSpatialRecall.ts
      scoreComplexSpan.ts
      types.ts

    binding/
      createBindingTimeline.ts
      generateBindingTrial.ts
      renderMemoryArray.ts
      renderBindingProbe.ts
      scoreBinding.ts
      types.ts

    scoring/
      scoreWmAttempt.ts
      dPrime.ts
      confidence.ts
      types.ts

    persistence/
      saveAttempt.ts
      localQueue.ts
      supabaseClient.ts

  styles/
    wm-test.css

public/
  _redirects
  third-party/
    licences/

tests/
  complex-span/
  binding/
  scoring/
  generation/
  e2e/

docs/
  wm-capacity-binding-test-v0.1.md

THIRD_PARTY_NOTICES.md
```

---

# 5. Full test journey

```text
Welcome and claims notice
→ Device and browser check
→ Fullscreen request
→ Part A instructions
→ Part A practice
→ Part A scored sets
→ Short transition card
→ Part B instructions
→ Part B practice
→ Part B scored trials
→ Data submission
→ Provisional result
```

Target median duration:

| Component                          |       Target |
| ---------------------------------- | -----------: |
| Start and device check             |    30–45 sec |
| Complex-span instructions/practice |    60–75 sec |
| Complex-span scored task           |      4–5 min |
| Binding instructions/practice      |    45–60 sec |
| Binding scored task                |    3–3.5 min |
| Result and submission              |    15–30 sec |
| **Total**                          | **9–11 min** |

---

# 6. Start and device-quality screen

Display:

> **Working Memory Check**
> This short test measures how well you hold visual information while processing something else, and how accurately you remember which visual features belonged where.
>
> Use a laptop or desktop. Work somewhere quiet and avoid switching tabs.
>
> Takes about 10 minutes.

Buttons:

```text
Start test
Return to tests
```

## 6.1 V0 device requirements

Recommended:

```text
desktop or laptop
physical keyboard plus mouse/trackpad
viewport at least 900 × 650 CSS pixels
modern Chrome, Edge, Firefox or Safari
```

For a smaller viewport:

> This test currently requires a larger screen. Please reopen it on a laptop or desktop.

Do not include mobile or small-tablet scores in the same calibration sample.

## 6.2 Log at start

```ts
interface DeviceMetadata {
  userAgent: string;
  platform: string;
  viewportWidth: number;
  viewportHeight: number;
  screenWidth: number;
  screenHeight: number;
  devicePixelRatio: number;
  touchPoints: number;
  preferredLanguage: string;
  timezone: string;
  fullscreenEntered: boolean;
  estimatedRefreshRate?: number;
}
```

---

# 7. Part A: Visuospatial Complex Span

## 7.1 Construct

The participant alternates between:

```text
processing:
judge whether a visual pattern is symmetrical

storage:
remember one highlighted grid location
```

At the end of each set, the participant reproduces the locations in their original order.

User-facing name:

```text
Working Memory Capacity
```

Internal measure:

```text
visuospatial_complex_span
```

## 7.2 User instruction

> You will first decide whether a black-and-white pattern is symmetrical.
> After each decision, one square in a grid will light up. Remember its position.
> At the end of the set, select the squares in the same order.

Buttons during processing:

```text
Symmetrical
Not symmetrical
```

Keyboard alternatives:

```text
F = symmetrical
J = not symmetrical
```

Keep the button positions and key mappings constant throughout the test.

## 7.3 Symmetry stimulus

Render an algorithmically generated:

```text
8 × 8 black-and-white matrix
```

Display size:

```text
240 × 240 CSS pixels
```

Cell gap:

```text
1–2 pixels
```

### Symmetrical pattern generation

1. Generate the left four columns randomly.
2. Maintain black-cell density between 35% and 65%.
3. Mirror the left half onto the right half.
4. Reject patterns with:

   * fewer than 16 black cells;
   * more than 48 black cells;
   * identical rows throughout;
   * extremely obvious solid blocks.

### Asymmetrical pattern generation

1. Generate a valid symmetrical pattern.
2. Flip between two and four cells on only one side.
3. Include at least:

   * one changed cell close to the centre;
   * one changed cell further from the centre.
4. Verify computationally that the finished pattern is not vertically symmetrical.
5. Reject patterns with an accidental secondary symmetry that makes the answer ambiguous.

Balance scored processing trials:

```text
50% symmetrical
50% asymmetrical
```

There are 42 scored processing judgements, giving exactly:

```text
21 symmetrical
21 asymmetrical
```

## 7.4 Storage stimulus

Show a:

```text
4 × 4 spatial grid
```

One cell is highlighted for:

```text
650 ms
```

Default colours:

```text
grid background: white or very pale grey
grid line: #6D6D6D
highlight: #22AAFF
```

No location may repeat within a set.

Reject spatial sequences containing:

```text
three or more consecutive cells in one row
three or more consecutive cells in one column
three or more consecutive cells on one diagonal
simple clockwise or anticlockwise perimeter runs
alternation between only two locations
```

The purpose is to reduce easy geometric chunking without making the sequences unnatural.

## 7.5 Trial timing

For every processing-storage pair:

```text
fixation                    250 ms
symmetry pattern            until response, maximum 3,000 ms
post-response blank         150 ms
highlighted location        650 ms
post-location blank         150 ms
```

If no symmetry response occurs within 3,000 ms:

```text
record processing omission
score processing item incorrect
continue to the storage stimulus
```

Do not give trial-level feedback during scored sets.

## 7.6 Set schedule

Practice:

```text
4 individual symmetry examples with feedback
1 practice set at size 2
1 practice set at size 3
```

Scored task:

```text
12 sets
3 sets at each size:
2, 3, 4 and 5
```

Total stored locations:

```text
3 × (2 + 3 + 4 + 5) = 42
```

Randomise set order using these constraints:

```text
first scored set must be size 2 or 3
no set size appears more than twice consecutively
do not use a simple ascending or descending sequence
each four-set quarter should contain at least three different sizes
```

## 7.7 Recall screen

Display the 4 × 4 grid without a highlighted location.

Instruction:

> Select the locations in the order they appeared.

When the participant selects cells:

```text
first cell shows “1”
second cell shows “2”
third cell shows “3”
...
```

Buttons:

```text
Undo
Clear
Submit
```

Rules:

```text
a cell cannot be selected twice
Submit activates when the required number of cells is selected
recall has a soft 30-second limit
show a gentle time reminder after 20 seconds
```

Do not show correctness feedback after scored sets.

---

# 8. Part A scoring

## 8.1 Primary score

```text
Complex Span Partial-Credit Unit Score
```

Formula:

```ts
complexSpanPCU =
  exactSerialPositionsCorrect /
  totalSerialPositions;
```

Example:

```text
Target:   3, 8, 11, 2
Response: 3, 8, 2, 11

Exact serial positions correct:
positions 1 and 2

PCU:
2 / 4 = .50
```

## 8.2 Secondary scores

```ts
complexSpanItemAccuracy
complexSpanWholeSetAccuracy
complexSpanAbsoluteScore
complexSpanMaximumStableSetSize
processingAccuracy
processingMedianRt
processingOmissionRate
transpositionRate
intrusionRate
```

Definitions:

```text
Item accuracy:
Target locations recalled, irrespective of order / total target locations.

Whole-set accuracy:
Perfectly recalled sets / 12.

Absolute score:
Sum of set sizes for all perfectly recalled sets.

Maximum stable set size:
Largest set size at which at least two of three sets were recalled perfectly.

Transposition:
A target location recalled in the wrong serial position.

Intrusion:
A recalled location that was not in the target set.
```

## 8.3 Processing validity gate

```text
processing accuracy ≥ 85%:
acceptable

processing accuracy 75–84.9%:
limited confidence

processing accuracy < 75%:
complex-span estimate invalid
```

A low processing score indicates that the participant may have prioritised memory storage by neglecting the processing task.

---

# 9. Part B: Visual Binding Change Detection

## 9.1 Construct

The participant remembers several visual tokens and their locations.

After a short delay, one location is probed. The participant decides whether the token shown there is the same as before.

The critical condition is a **swap lure**:

```text
the probe token was present in memory
but belonged to a different location
```

This separates memory for token identity from memory for the correct token-location binding.

User-facing name:

```text
Binding Precision
```

Internal measure:

```text
token_location_binding_change_detection
```

## 9.2 User instruction

> Several visual tokens will appear briefly. Remember which token appears in each location.
>
> One location will then be tested. Choose **Same** if the original token is shown there, or **Different** if it has changed.

Responses:

```text
F or left button = Same
J or right button = Different
```

## 9.3 Token design

Use eight internally generated tokens.

Each token must contain:

```text
a colour
and
a simple internal pattern or mark
```

This reduces dependence on colour discrimination alone.

Suggested colour set:

```ts
const TOKEN_COLOURS = [
  "#0072B2",
  "#E69F00",
  "#009E73",
  "#CC79A7",
  "#D55E00",
  "#56B4E9",
  "#F0E442",
  "#333333"
];
```

Suggested pattern set:

```text
solid
horizontal stripe
vertical stripe
diagonal stripe
central dot
central ring
cross
two dots
```

A token is a:

```text
34–40 px circle or rounded square
with a dark outline
```

Generate these through Canvas or SVG. Do not use copied image assets.

## 9.4 Spatial layout

Use 12 fixed possible positions around an invisible oval or circular field.

Example:

```text
four upper positions
four middle positions
four lower positions
```

Requirements:

```text
minimum centre-to-centre distance: 80 px
all positions remain visible at the minimum supported viewport
no overlapping tokens
probe uses exactly one previously occupied location
```

## 9.5 Set sizes

Use:

```text
3 tokens
5 tokens
7 tokens
```

Tokens must be unique within an array.

## 9.6 Trial types

### Same

The probe token is identical to the original token at the probed location.

Correct response:

```text
Same
```

### Novel change

The probe token was not present anywhere in the original array.

Correct response:

```text
Different
```

### Swap change

The probe token originally appeared at another occupied location in the same array.

Correct response:

```text
Different
```

The swap condition is the primary binding-specific lure.

## 9.7 Trial count

Practice:

```text
6 trials at set size 3
2 Same
2 Novel change
2 Swap change
feedback enabled
```

Scored task:

```text
54 trials
```

For each set size:

```text
18 trials:
6 Same
6 Novel change
6 Swap change
```

Total:

|  Set size |   Same |  Novel |   Swap |  Total |
| --------: | -----: | -----: | -----: | -----: |
|         3 |      6 |      6 |      6 |     18 |
|         5 |      6 |      6 |      6 |     18 |
|         7 |      6 |      6 |      6 |     18 |
| **Total** | **18** | **18** | **18** | **54** |

Randomisation constraints:

```text
no more than three trials of one condition consecutively
no more than three trials of one set size consecutively
each 18-trial third contains all set sizes and all conditions
left/right response frequencies remain balanced
```

## 9.8 Trial timing

```text
fixation                   300 ms
memory array               500 ms
blank retention interval   900 ms
single-location probe      until response, maximum 2,500 ms
inter-trial interval       250 ms
```

If no response occurs:

```text
record omission
score incorrect
continue
```

No feedback during scored trials.

---

# 10. Part B scoring

Treat “change” as the signal.

```text
Hit:
Different response on a Novel or Swap trial.

False alarm:
Different response on a Same trial.
```

Use log-linear corrections so that perfect rates do not produce infinite z-scores.

```ts
correctedHitRate =
  (hits + 0.5) /
  (changeTrials + 1);

correctedFalseAlarmRate =
  (falseAlarms + 0.5) /
  (sameTrials + 1);

dPrime =
  z(correctedHitRate) -
  z(correctedFalseAlarmRate);
```

Compute:

```ts
bindingDPrimeOverall
bindingDPrimeNovel
bindingDPrimeSwap
bindingSwapCost
bindingBalancedAccuracy
bindingMedianRt
bindingOmissionRate
bindingResponseBias
```

Where:

```ts
bindingSwapCost =
  bindingDPrimeNovel -
  bindingDPrimeSwap;
```

Interpretation:

```text
higher overall d′:
better change detection

higher swap d′:
better token-location binding

larger positive swap cost:
greater difficulty rejecting a familiar token in the wrong location
```

## 10.1 Exploratory capacity estimate

Calculate internally, but do not display publicly in v0.1:

```ts
K = setSize * (hitRate - falseAlarmRate);
```

Store:

```text
K_3
K_5
K_7
K_max
```

Mark these fields:

```text
evidence_tier = exploratory
```

---

# 11. Results model

Do not produce one public combined WM score in v0.1.

Show two cards.

## Card 1

> **Working Memory Capacity**
> How well you maintained a sequence while making other visual judgements.

Display:

```text
serial recall: XX%
processing accuracy: XX%
confidence: calibrating / limited
```

## Card 2

> **Binding Precision**
> How accurately you remembered which visual token belonged in each location.

Display:

```text
balanced accuracy: XX%
swap-lure accuracy: XX%
confidence: calibrating / limited
```

Footer:

> These are provisional estimates from one short assessment. Stable comparisons require repeated tests and calibration data.

## 11.1 Future combined score

Only create a composite after collecting calibration data.

Candidate future formula:

```ts
wmBenchmarkIndex =
  mean(
    z(complexSpanPCU),
    z(bindingDPrimeSwap)
  );
```

Do not calculate this using arbitrary assumed means and standard deviations.

---

# 12. Quality and confidence rules

Use existing IQ Coach confidence labels:

```text
insufficient data
calibrating
moderate confidence
high confidence
timing limited
unstable estimate
```

## Single valid attempt

Return:

```text
calibrating
```

## Timing limited

Return when any of these apply:

```text
more than 5% of trials affected by tab visibility changes
fullscreen exited during scored testing
more than 10% timing deviation from requested display durations
viewport resized during testing
more than one complex-span set voided
```

## Unstable estimate

Return when:

```text
overall omission rate > 10%
median response time < 200 ms
one response used on > 90% of binding trials
processing accuracy < 75%
binding Same accuracy or Change accuracy < 55%
```

## Moderate confidence

Future rule:

```text
at least two valid attempts
acceptable timing
test–retest difference within calibrated bounds
```

## High confidence

Future rule:

```text
at least three valid attempts
acceptable timing and device consistency
estimated score uncertainty below the validated threshold
```

---

# 13. Interruption handling

Listen for:

```text
visibilitychange
blur
focus
fullscreenchange
resize
```

## Complex span

If interruption occurs during a set:

```text
void the entire set
do not score it
append one replacement set of the same size
use a newly generated sequence
```

Allow one replacement set only.

If another interruption occurs:

```text
complete the attempt
mark complex-span confidence timing limited
```

## Binding task

If interruption occurs during a trial:

```text
void the trial
append a replacement trial with the same set size and condition
use new locations and tokens
```

Do not repeat the original stimulus.

---

# 14. Deterministic forms and randomisation

Every attempt must store:

```ts
attemptId
testVersion
scoringVersion
formId
randomSeed
```

Use a deterministic seeded PRNG.

Recommended:

```text
seedrandom
```

Form cycle:

```text
A → B → C → A
```

Each form should use:

```text
the same set sizes
the same trial counts
the same timing
different generated stimuli
```

Do not reuse an exact complex-span spatial sequence or binding array within the same participant’s recent attempts.

All random generation must be reproducible from:

```text
formId + randomSeed + testVersion
```

---

# 15. Data model

Use the existing IQ Coach convention of storing raw trials separately from derived scores. The canonical score should eventually be calculated or verified server-side rather than trusting only a client-side result.

## 15.1 Attempt record

```ts
interface WmTestAttempt {
  attemptId: string;
  participantId: string;
  sessionId?: string;

  status:
    | "started"
    | "submitted"
    | "scored"
    | "void"
    | "duplicate";

  testVersion: string;
  scoringVersion: string;
  formId: "A" | "B" | "C";
  randomSeed: string;

  startedAt: string;
  submittedAt?: string;
  scoredAt?: string;

  deviceMetadata: DeviceMetadata;
  qualityMetadata: QualityMetadata;
}
```

## 15.2 Complex-span set record

```ts
interface ComplexSpanSetRecord {
  attemptId: string;
  setIndex: number;
  setSize: 2 | 3 | 4 | 5;
  isPractice: boolean;
  isReplacement: boolean;
  isVoided: boolean;

  symmetryItems: {
    patternId: string;
    isSymmetrical: boolean;
    response: "symmetrical" | "not_symmetrical" | null;
    isCorrect: boolean;
    rtMs: number | null;
    requestedDurationMs?: number;
    actualDurationMs?: number;
  }[];

  targetLocations: number[];
  recalledLocations: number[];

  exactSerialCorrect: number;
  targetItemsRecalled: number;
  transpositions: number;
  intrusions: number;
  wholeSetCorrect: boolean;
  recallRtMs: number;

  interruptionFlag: boolean;
}
```

## 15.3 Binding trial record

```ts
interface BindingTrialRecord {
  attemptId: string;
  trialIndex: number;
  isPractice: boolean;
  isReplacement: boolean;
  isVoided: boolean;

  setSize: 3 | 5 | 7;
  condition: "same" | "novel_change" | "swap_change";

  memoryLocations: number[];
  memoryTokenIds: string[];

  probeLocation: number;
  originalTokenId: string;
  probeTokenId: string;

  correctResponse: "same" | "different";
  response: "same" | "different" | null;
  isCorrect: boolean;
  rtMs: number | null;

  memoryArrayRequestedMs: number;
  memoryArrayActualMs: number;
  retentionRequestedMs: number;
  retentionActualMs: number;

  interruptionFlag: boolean;
}
```

## 15.4 Score record

```ts
interface WmTestScores {
  attemptId: string;
  testVersion: string;
  scoringVersion: string;

  complexSpanPCU: number | null;
  complexSpanItemAccuracy: number | null;
  complexSpanWholeSetAccuracy: number | null;
  complexSpanAbsoluteScore: number | null;
  complexSpanMaximumStableSetSize: number | null;
  processingAccuracy: number | null;
  processingMedianRt: number | null;
  processingOmissionRate: number | null;
  transpositionRate: number | null;
  intrusionRate: number | null;

  bindingDPrimeOverall: number | null;
  bindingDPrimeNovel: number | null;
  bindingDPrimeSwap: number | null;
  bindingSwapCost: number | null;
  bindingBalancedAccuracy: number | null;
  bindingMedianRt: number | null;
  bindingOmissionRate: number | null;
  bindingResponseBias: number | null;

  exploratoryK3: number | null;
  exploratoryK5: number | null;
  exploratoryK7: number | null;

  complexSpanConfidence: ConfidenceLabel;
  bindingConfidence: ConfidenceLabel;
  overallQualityLabel: ConfidenceLabel;
}
```

---

# 16. Supabase integration

Preferred tables:

```text
iqc_session_attempts
iqc_trials
iqc_capacity_estimates
```

Use:

```text
layer = wm_benchmark
```

Measure targets:

```text
visuospatial_complex_span
visual_binding_change_detection
```

Metric names:

```text
wm_complex_span_pcu
wm_processing_accuracy
wm_transposition_rate
wm_binding_dprime
wm_binding_swap_dprime
wm_binding_swap_cost
```

## 16.1 Environment variables

```text
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
VITE_WM_TEST_VERSION
VITE_WM_SCORING_VERSION
```

Never place a Supabase service-role key in the browser bundle.

## 16.2 Submission flow

```text
1. Create attempt with status started.
2. Run the complete test locally.
3. Save raw scored and voided trials.
4. Calculate client-side provisional scores.
5. Submit raw trials plus provisional scores.
6. Server-side RPC or Edge Function recomputes scores.
7. Store canonical estimate.
8. Return status scored.
```

If the network is unavailable:

```text
store encrypted or minimally identifying payload locally
mark submission pending
retry when connectivity returns
show result as provisional
```

No email address or directly identifying data should be stored in the trial table.

---

# 17. Cloudflare Pages deployment

Cloudflare Pages supports Git-connected deployment and automatically deploys new pushes. Pull requests can receive separate preview URLs.

Use:

```text
Production branch: main
Build command: npm run build
Build output directory: dist
```

Cloudflare documents `npm run build` and `dist` for React/Vite projects.

Environment variables should be configured under:

```text
Workers & Pages
→ project
→ Settings
→ Environment variables
```

Cloudflare provides branch, commit and deployment URL variables automatically.

## 17.1 SPA routing

Create:

```text
public/_redirects
```

Contents:

```text
/* /index.html 200
```

Cloudflare Pages supports relative-URL proxying with status code 200 through `_redirects`.

## 17.2 Deployment requirements

Every pull request should run:

```text
npm run lint
npm run typecheck
npm run test
npm run build
```

Cloudflare preview deployment must be tested before merging to `main`.

---

# 18. Automated tests

## 18.1 Symmetry generation

Test that:

```text
every symmetrical pattern equals its vertical reflection
every asymmetrical pattern differs from its vertical reflection
black-cell density remains within configured bounds
exactly 21 of 42 scored patterns are symmetrical
identical seeds reproduce identical patterns
different forms produce different patterns
```

## 18.2 Spatial sequence generation

Test that:

```text
no location repeats within a set
sequence length equals requested set size
all locations fall between 0 and 15
forbidden simple geometric runs are rejected
each form contains exactly three sets of each size
```

## 18.3 Binding generation

Test that:

```text
all tokens in the memory array are unique
probe location was occupied during encoding
Same probe equals original target token
Novel probe token was absent from the memory array
Swap probe token came from another occupied location
each set size has six trials of each condition
```

## 18.4 Scoring

Create fixed fixtures for:

```text
perfect complex-span recall
partial serial recall
transpositions
intrusions
perfect binding performance
all-Same response bias
all-Different response bias
zero hits
zero false alarms
```

Confirm that d′ never returns:

```text
Infinity
-Infinity
NaN
```

## 18.5 E2E

Using Playwright:

```text
complete a full valid attempt
complete an attempt with one interruption
reject unsupported viewport
resume a pending upload
render a result after successful scoring
render a provisional result after upload failure
```

---

# 19. Acceptance criteria

The MVP is complete when:

1. A participant can complete the full battery without researcher input.
2. Median completion time in internal testing is 9–11 minutes.
3. Complex span contains 12 scored sets and 42 stored locations.
4. Binding detection contains 54 scored trials.
5. All stimulus generation is deterministic from the stored seed.
6. No copyrighted or unlicensed third-party stimulus assets are used.
7. Raw trials, voided trials and derived scores are stored separately.
8. The complex-span processing validity rule is enforced.
9. Swap lures are scored separately from novel changes.
10. Tab switches and fullscreen exits are logged.
11. Pull requests generate working Cloudflare preview deployments.
12. The result page describes scores as provisional and non-diagnostic.
13. No standard score, percentile or IQ interpretation is displayed without calibration data.
14. MIT licence notices are preserved.

---

# 20. Initial validation pathway

## Technical pilot

```text
N = 20–30
```

Test:

```text
task comprehension
duration
browser compatibility
stimulus timing
ceiling/floor effects
response bias
data completeness
```

## Calibration pilot

```text
N ≥ 100
```

Estimate:

```text
score distributions
item/set difficulty
internal consistency
set-size effects
swap-lure effect
device effects
completion quality
```

Do not present population percentiles at this stage.

## Test–retest study

```text
N ≥ 50
interval: 7–14 days
alternate forms: A and B
```

Assess:

```text
test–retest reliability
practice effects
form equivalence
standard error of measurement
```

## Convergent validation

Compare with at least:

```text
a recognised complex-span task
a visuospatial span measure
a standard visual-array/change-detection measure
IQ Coach Relational Memory
IQ Coach Binding Memory
matrix reasoning as a downstream external benchmark
```

---

# 21. Codex implementation directive

Build `WMC-B10 v0.1.0` as a React/Vite/TypeScript application using jsPsych 8.2.3 for the timed task engine.

Implement two sections:

```text
A. Visuospatial Complex Span
- symmetry judgement
- 4 × 4 location memory
- 12 scored sets
- three sets at sizes 2, 3, 4 and 5
- partial-credit serial recall as primary score

B. Visual Binding Change Detection
- token-location arrays
- set sizes 3, 5 and 7
- Same, Novel and Swap conditions
- 54 scored trials
- swap d′ and overall d′ as primary scores
```

Generate every stimulus internally from a deterministic seed. Do not copy images or code from repositories whose commercial licence has not been verified.

Use the existing IQ Coach Supabase conventions where available. Store raw trials separately from derived estimates. Treat client-side scores as provisional and support canonical server-side rescoring.

Deploy to Cloudflare Pages from GitHub using:

```text
npm run build
dist
```

Add unit, scoring, generation and Playwright E2E tests. Include a `THIRD_PARTY_NOTICES.md` file and preserve all applicable MIT notices.

The public result must show two provisional subscores:

```text
Working Memory Capacity
Binding Precision
```

Do not display a combined standard score, percentile, diagnostic label or IQ interpretation in v0.1.

---

 
## Recommended provisional benchmarking system

Use three distinct labels internally:

```text
literature_anchor
= broad expectations from similar published paradigms

provisional_app_band
= an IQ Mindware engineering interpretation

population_norm
= calculated only from WMC-B10 users
```

The first release should display only `provisional_app_band`.

---

# 1. Visuospatial Complex Span benchmarks

The primary metric is:

```text
Complex Span PCU
= exact serial positions correct / 42
```

Because the task contains only set sizes 2–5 and includes easier sets in every attempt, PCU should not be interpreted like a conventional span ceiling.

## Suggested initial bands

|       PCU | Correct serial positions | Initial label          |
| --------: | -----------------------: | ---------------------- |
|   `< .50` |               0–20 of 42 | Low task performance   |
| `.50–.64` |                    21–26 | Developing             |
| `.65–.79` |                    27–33 | Typical-range estimate |
| `.80–.89` |                    34–37 | Strong                 |
|   `≥ .90` |                    38–42 | Very strong            |

These are **not published percentile boundaries**. They are sensible engineering priors for a task modelled on standard complex-span procedures and should be replaced as soon as your own distribution begins to stabilise.

### Additional interpretation rules

A high memory score should not be shown as strong WMC unless:

```text
processing accuracy ≥ 85%
processing omission rate ≤ 5%
no major interruption flags
```

Suggested processing-quality interpretation:

| Symmetry accuracy | Interpretation                   |
| ----------------: | -------------------------------- |
|            `<75%` | Invalid complex-span estimate    |
|          `75–84%` | Limited confidence               |
|          `85–94%` | Acceptable processing engagement |
|            `≥95%` | Strong processing accuracy       |

Do not reward processing accuracy itself as WM capacity. It is a validity and secondary-performance measure.

## Maximum stable set size

This can provide a simpler user-facing description:

| Maximum stable size | Rough interpretation                                     |
| ------------------: | -------------------------------------------------------- |
|                   2 | Relations or locations become unstable under modest load |
|                   3 | Moderate visuospatial span                               |
|                   4 | Strong visuospatial span                                 |
|                   5 | Very strong performance within this test range           |

This is useful descriptively, but PCU should remain the main score because maximum span is coarse and sensitive to a small number of sets.

---

# 2. Binding Change Detection benchmarks

There are three different outcomes:

```text
Novel-change discrimination
Swap-change discrimination
Exploratory K capacity
```

They should not be interpreted identically.

## 2.1 Exploratory K capacity

Calculate K using **Same versus Novel-change trials only**:

```text
K = set size × (hit rate − false-alarm rate)
```

Do not mix swap trials into K. Swap trials add binding interference and violate the simpler assumptions behind the capacity estimate.

A broad literature anchor for healthy young adults is approximately three to four visual items, although task conditions can move estimates markedly and the fixed-slot interpretation remains debated. ([Wikipedia][2])

Suggested initial K bands:

|    `K_max` | Initial interpretation                        |
| ---------: | --------------------------------------------- |
|     `<1.5` | Low visual retention on this task             |
| `1.5–2.49` | Developing                                    |
| `2.5–3.49` | Broad typical range                           |
| `3.5–4.49` | Strong                                        |
|     `≥4.5` | Very strong or potentially strategy-sensitive |

Treat scores above about five cautiously. They can reflect excellent performance, but may also indicate ceiling effects, favourable response bias or a mismatch between the K model and the task.

Store K but do not make it the headline score in v0.1.

---

## 2.2 d′ benchmarks

Unlike K, d′ measures discrimination rather than an estimated number of stored items.

The following are conventional performance interpretations rather than population norms:

|          d′ | Discrimination |
| ----------: | -------------- |
|     `<0.50` | Weak           |
| `0.50–0.99` | Modest         |
| `1.00–1.49` | Clear          |
| `1.50–1.99` | Strong         |
|     `≥2.00` | Very strong    |

Apply these separately to:

```text
bindingDPrimeNovel
bindingDPrimeSwap
```

The most meaningful binding-specific measure is:

```text
Swap d′
```

because the token is familiar but appears in the wrong location.

---

## 2.3 Swap cost

Define:

```text
bindingSwapCost =
novel-change d′ − swap-change d′
```

Suggested descriptive bands:

|   Swap cost | Initial interpretation                  |
| ----------: | --------------------------------------- |
|     `<0.10` | Little detectable binding-specific cost |
| `0.10–0.39` | Small cost                              |
| `0.40–0.79` | Moderate cost                           |
|     `≥0.80` | Large binding-specific cost             |

A **smaller swap cost is generally better**, provided both d′ values are above chance. A near-zero cost is not positive when both novel and swap discrimination are poor.

Therefore use a two-stage interpretation:

```ts
if (novelDPrime < 0.5 && swapDPrime < 0.5) {
  interpretation = "weak overall discrimination";
} else {
  interpretation = classifySwapCost(novelDPrime - swapDPrime);
}
```

---

# 3. Expected set-size profile

The shape of performance across set sizes is more informative than one overall percentage.

Use these as rough pilot expectations rather than score bands:

| Set size | Expected pattern                                                   |
| -------: | ------------------------------------------------------------------ |
|        3 | High accuracy for most attentive healthy adults                    |
|        5 | Meaningful individual differences should emerge                    |
|        7 | Performance should approach capacity limits and expose swap errors |

A plausible technical-pilot target would be:

```text
Set size 3:
median balanced accuracy approximately .80 or higher

Set size 5:
median approximately .65–.85

Set size 7:
median approximately .55–.75
```

Those ranges are design targets, not published norms. If set-size 3 is below about .75 for much of the pilot sample, the tokens, timing or instructions are probably too difficult. If set-size 7 remains above .85, the task is probably too easy.

---

# 4. Provisional user-facing interpretation

I would initially display bands rather than standard scores.

## Working Memory Capacity

```ts
function getComplexSpanBand(pcu: number): string {
  if (pcu < 0.50) return "low_task_performance";
  if (pcu < 0.65) return "developing";
  if (pcu < 0.80) return "standard";
  if (pcu < 0.90) return "strong";
  return "very_strong";
}
```

## Binding Precision

Use swap d′ as the primary result:

```ts
function getBindingBand(swapDPrime: number): string {
  if (swapDPrime < 0.50) return "low_task_performance";
  if (swapDPrime < 1.00) return "developing";
  if (swapDPrime < 1.50) return "standard";
  if (swapDPrime < 2.00) return "strong";
  return "very_strong";
}
```

User-facing copy:

> **Working Memory Capacity: Standard range**
> You maintained about 72% of the visual sequence information in its correct order. This is a provisional task-based estimate.

> **Binding Precision: Strong**
> You were generally able to reject familiar visual tokens when they appeared in the wrong location.

Avoid:

```text
You are at the 63rd percentile.
Your working-memory IQ is 106.
You are above average for your age.
```

---

# 5. How to replace the provisional bands

The bands should be versioned:

```text
benchmark_version = "literature-anchor-0.1"
```

Then transition to app data in stages.

## Fewer than 100 valid users

Show:

```text
provisional task band
personal baseline
raw score
confidence label
```

Do not show percentiles.

## 100–299 valid users

Calculate:

```text
sample median
quartiles
empirical percentile
bootstrap confidence intervals
```

Label:

> Compared with the current IQ Coach calibration sample.

Do not call these population norms.

## 300–999 valid users

Create provisional sample standard scores:

```text
100 + 15 × z
```

Prefer empirical percentile ranks if the score distribution is skewed or bounded.

Stratify only if subgroup sizes permit:

```text
age band
device class
first language
test exposure
```

## 1,000+ valid users

Fit a proper scoring model:

* form-equivalence adjustment;
* age effects;
* device effects;
* practice effects;
* test–retest reliability;
* measurement error;
* possibly beta-binomial or IRT-style modelling for serial-position outcomes;
* signal-detection hierarchical modelling for binding trials.

Only then consider stable standard scores.

---

# 6. Important limitation

The literature gives you useful **expected locations and task-shape checks**, but not defensible norms for this exact instrument. Even small changes to:

```text
pattern complexity
processing deadline
storage duration
recall interface
token distinctiveness
retention interval
set-size mixture
swap frequency
```

can change the distribution.

Therefore the best interim policy is:

> Use published research to establish whether results look psychologically plausible, but use only IQ Coach data to establish where an individual stands relative to other users.

## Recommended v0.1 output

```text
Working Memory Capacity
Raw: 31/42 serial positions
PCU: .738
Band: Standard
Confidence: Calibrating

Binding Precision
Novel d′: 1.71
Swap d′: 1.29
Swap cost: 0.42
Exploratory K: 3.2
Band: Standard
Confidence: Calibrating
```

That gives users meaningful feedback immediately without pretending that externally borrowed cut-offs are psychometric norms.

[1]: https://link.springer.com/article/10.3758/s13428-014-0543-2 "The development of a short domain-general measure of working memory capacity | Behavior Research Methods | Springer Nature Link"
[2]: https://en.wikipedia.org/wiki/Visual_short-term_memory?utm_source=chatgpt.com "Visual short-term memory"

