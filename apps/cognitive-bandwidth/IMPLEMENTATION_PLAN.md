# IQ Coach Cognitive Bandwidth Webapp Plan

**Status:** implementation plan  
**App package:** `apps/cognitive-bandwidth` in the `Mindware-Lab/IQ-Coach` repository  
**Initial release:** Direction Bandwidth plus Frame Bandwidth  
**Reference implementation:** Mission Arena in `trident-g-platform/products/trident-g-iq/apps/puzzle-arena`

## 1. Product Decision

Build a standalone, mobile-first webapp for adaptive masked-arrow cognitive-control testing and training.

The first production release contains only:

- `abs_lr`: majority Left versus Right
- `rel_inout`: majority Out versus In relative to a fixed centre
- email magic-link authentication
- device timing check
- scored Quick and Standard sessions
- Direction Bandwidth
- Frame Bandwidth
- Frame Cost
- recent personal baseline
- confidence and timing-quality labels
- session history and simple results trends

Do not include in the first production release:

- diagonal arrows
- spiral arrows
- Gabor patches
- optic flow
- moving stimuli
- Zone or flow-state classification
- HRV
- leaderboards
- population percentiles
- IQ scores or IQ-gain claims
- forced bottleneck routing
- commerce unless a separate entitlement requirement is confirmed

Stage later wrappers as follows:

1. `abs_ud`: Up versus Down
2. `rel_cwccw`: Circle Right versus Circle Left
3. mixed blocks across validated wrappers
4. numeric Wrapper Recovery and Flexible Bandwidth
5. diagonal and spiral only after comprehension and reliability studies

This resolves the conflict between the broad draft specification and the later MVP notes that explicitly exclude diagonal and spiral stimuli.

## 2. Scientific Claims Boundary

Use these claims:

- "Objective behavioural estimate of cognitive-control capacity"
- "Direction Bandwidth is based on MFT-M-style majority-direction methods"
- "Scores are estimated from accuracy across controlled information demands"
- "Scores are shown with timing-quality and confidence labels"
- "Frame Bandwidth is an experimental relational extension of the same task logic"
- "These are IQ-relevant component measures, not a full IQ test"

Do not say:

- "scientifically validated app" before the implementation itself has reliability data
- "Frame Bandwidth is a validated MFT-M score"
- "this is your IQ"
- "this proves your IQ increased"
- "clinical assessment" or "diagnosis"
- "guaranteed far transfer"

Recommended onboarding wording:

> Measure and train cognitive control capacity.
>
> Direction Bandwidth uses a brief masked-arrow task based on peer-reviewed cognitive-control capacity methods. Frame Bandwidth extends the task to direction relative to a centre. Scores are IQ-relevant component measures, not a full IQ test.

The science page must distinguish:

- peer-reviewed MFT-M foundation
- this app's browser implementation
- experimental relational extension
- current validation status

## 3. Repository Placement

Use this structure in `Mindware-Lab/IQ-Coach`:

```text
apps/
  cognitive-bandwidth/
    README.md
    IMPLEMENTATION_PLAN.md
    package.json
    package-lock.json
    index.html
    vite.config.ts
    tsconfig.json
    public/
      _redirects
      icons/
    src/
      main.ts
      styles.css
      app/
        state.ts
        routes.ts
        render.ts
      auth/
        account.ts
        supabaseClient.ts
      task/
        geometry.ts
        generator.ts
        renderer.ts
        trialRunner.ts
        timing.ts
        masks.ts
      scoring/
        mftmModel.ts
        estimateCapacity.ts
        confidence.ts
        baselines.ts
        derivedScores.ts
      adaptive/
        conditionPool.ts
        information.ts
        selector.ts
        stopping.ts
        wrapperState.ts
      data/
        api.ts
        localQueue.ts
        contracts.ts
      ui/
        screens/
        components/
        copy.ts
      audio/
        feedback.ts
    tests/
      unit/
      simulation/
      browser/
    supabase/
      config.toml
      migrations/
      functions/
        submit-ccc-block/
        finalize-ccc-session/
        export-ccc-data/
        delete-ccc-data/
```

Do not put runtime code under `protocols/`. That directory should remain the scientific and product source material.

## 4. Technical Stack

Match Mission Arena unless implementation pressure justifies a change:

- Vite
- TypeScript
- framework-neutral DOM rendering
- CSS using the supplied `iqm-ccc-app-style.css` as the starting design layer
- `@supabase/supabase-js`
- Supabase Auth, Postgres, RLS, and Edge Functions
- Cloudflare Pages
- Vitest for unit and simulation tests
- Playwright for browser flow tests

This keeps the stack small and consistent with the existing app. A UI framework is not required for the first two task wrappers.

## 5. UX Information Architecture

Bottom navigation:

- Today
- Train
- Results
- Settings

Do not show the bottom navigation during an active trial block.

### 5.1 First-run flow

```text
Welcome
-> Scientific basis and scope
-> Device timing check
-> Input and accessibility preferences
-> How it works
-> Direction tutorial
-> Frame tutorial
-> Email sign-in
-> First Direction calibration
-> Result
-> Recommended next step
```

Tutorials and the timing check can run before sign-in. Require sign-in before the first scored session so that scored data always belongs to an authenticated user.

### 5.2 Returning-user flow

```text
Today
-> recommended session
-> ready screen
-> mini-blocks
-> session result
-> next step
-> Today or Results
```

### 5.3 Screen set for the first release

Implement these screens or screen states:

1. Welcome
2. Scientific basis and scope
3. Device timing check
4. Input preferences
5. How it works
6. Direction tutorial
7. Frame tutorial
8. Email sign-in and link-sent state
9. Today
10. Train menu
11. Direction session setup
12. Frame session setup
13. Ready state
14. Fixation state
15. Stimulus state
16. Mask state
17. Response state
18. Feedback state
19. Mini-block pause
20. Interrupted-session recovery
21. Session result
22. Result explanation
23. Results overview
24. Direction detail
25. Frame detail
26. Frame Cost detail
27. Settings
28. Help and glossary
29. Timing-limited warning
30. Still-calibrating state

Several items are states of the same route rather than separate pages.

### 5.4 Active task screen

During trials show only:

- fixation or stimulus field
- response controls when responses are allowed
- subtle session progress
- optional sound toggle before a block
- pause/exit control between mini-blocks

Do not show during active trials:

- current accuracy
- bits/sec
- threshold
- entropy
- difficulty labels
- recent score
- technical wrapper names

### 5.5 Visual design

Use the supplied CSS and six onboarding assets as the design baseline:

- white or very pale background
- cyan primary action
- deep blue text and structure
- lime only for success or valid timing
- red only for brief errors
- rounded cards
- large response controls
- compact sticky header outside active trials
- mobile edge-to-edge shell
- desktop centred shell no wider than 900 px

Apply the Trident G-IQ shell contract:

- desktop: `min(900px, calc(100% - 24px))`
- mobile: `100%` width and `100dvh`
- mobile scrolling with bottom-nav reserve
- no scrolling inside the active trial field

## 6. Session Types

### Quick

- minimum 36 trials
- maximum 48 trials
- intended duration: about 3-5 minutes
- produces a today's estimate
- usually Moderate or Calibrating confidence

### Standard

- minimum 72 trials
- maximum 96 trials
- intended duration: about 6-10 minutes
- canonical training and profile session

### Benchmark

- 72 Direction plus 72 Frame trials
- intended duration: about 15-20 minutes with a break
- not required for initial onboarding
- enable after both tasks have been learned

### Research calibration

- up to 216 trials
- hidden behind a research/admin flag
- not part of the normal consumer journey

The stopping rule may end a session after the minimum when the estimate is sufficiently stable. The initial stability threshold must remain versioned and configurable until simulation and pilot data justify a final value.

## 7. Trial Sequence

Each scored trial is:

```text
fixation
-> stimulus
-> mask
-> response
-> feedback
-> inter-trial interval
```

Initial timing:

| State | Value |
| --- | --- |
| Fixation | random 300-600 ms |
| Stimulus | selected from frame-quantized exposure pool |
| Mask | 350 ms default |
| Response deadline | 2500 ms after mask onset |
| Feedback | 180 ms |
| ITI | random 250-450 ms |

The response buttons should be disabled during fixation, stimulus, and mask. This makes the perceptual exposure interval independent of motor response timing.

Masks should appear at all eight possible item positions, not only the five sampled positions.

## 8. Stimulus Geometry

Use eight possible positions on a fixed-radius octagon and sample five without replacement.

For each item:

```text
position p_i = [x_i, y_i]
centre c = [x_c, y_c]
radial unit vector r_i = normalize(p_i - c)
arrow unit vector v_i
```

### Absolute Left/Right

```text
LEFT  = [-1, 0]
RIGHT = [ 1, 0]
```

### Relative Out/In

```text
OUT v_i =  r_i
IN  v_i = -r_i
```

### Later Circle Right/Left

Browser coordinates use positive Y downwards. Define and unit test the convention:

```text
clockwise tangent     = [-r_y, r_x]
anticlockwise tangent = [ r_y, -r_x]
```

Do not rely on an untested `rotate90` sign.

### Rendering

Use SVG or Canvas rather than CSS pseudo-elements for scored stimuli. SVG provides:

- exact geometry
- deterministic rotation
- easy high-DPI rendering
- accessible separation between visual stimulus and DOM controls
- consistent server/client trial descriptions

The supplied CSS arrow can remain for tutorials and non-scored previews.

## 9. Trial Generation Algorithm

Each session receives:

- a cryptographically random session seed
- a generator version
- an ordered adaptive condition plan

Use a deterministic seeded PRNG after the session seed is created. Store the seed and generator version so a submitted trial can be reconstructed.

For each trial:

1. Select the wrapper and condition.
2. Select five of eight positions without replacement.
3. Select majority category using block-level balancing.
4. Select majority count: 5, 4, or 3.
5. Assign majority and minority categories to sampled positions.
6. Shuffle assignments.
7. Build exact vectors from the wrapper geometry.
8. Derive the correct response from the vectors, not from a client-supplied answer label.
9. Store the full generated descriptor and random seed index.

Balancing requirements per mini-block:

- majority categories differ by no more than one trial
- each octagon position appears approximately equally often
- no condition repeats more than twice consecutively
- no majority category repeats more than three times consecutively
- catch trials appear unpredictably

## 10. Majority Conditions

For five arrows:

```text
N_size = 5
N_maj = 3
```

For majority count `N_con`:

```text
P_group = choose(N_con, N_maj) / choose(N_size, N_maj)
H = log2(N_maj / P_group)
```

| Ratio | N_con | P_group | H |
| --- | ---: | ---: | ---: |
| 5:0 | 5 | 1.0 | 1.58 bits |
| 4:1 | 4 | 0.4 | 2.91 bits |
| 3:2 | 3 | 0.1 | 4.91 bits |

Important:

- `5:0` is a catch/lapse condition.
- With `P_group = 1`, it contributes essentially no information about capacity `C`.
- Capacity estimation should be driven mainly by `4:1` and `3:2`.

## 11. Exposure-Time Pool

Use the paper-faithful initial pool:

```text
250 ms
500 ms
1000 ms
2000 ms
```

Quantize each duration to whole frames after measuring the display refresh interval.

After a user has a stable estimate and Good timing quality, the adaptive pool may add:

```text
167 ms
333 ms
750 ms
1500 ms
```

Do not use 120-350 ms as the entire initial pool. Under the grouping-search model, many `3:2` trials in that range are close to chance for a typical 3-4 bps estimate and therefore do not span the useful response curve.

Very short conditions are training challenges, not initial calibration conditions.

## 12. Display Timing Algorithm

### 12.1 Timing check

Before scored use:

1. Run at least 240 `requestAnimationFrame` intervals.
2. Ignore the first 30 warm-up frames.
3. Compute median frame interval.
4. Compute median absolute deviation.
5. Count intervals larger than 1.5 times the median as dropped/late frames.
6. record refresh-rate estimate, viewport, device pixel ratio, browser, and visibility interruptions.

Provisional labels:

```text
Good:
  dropped/late frames <= 1%
  interval MAD <= 0.6 ms

Acceptable:
  dropped/late frames <= 5%
  interval MAD <= 1.5 ms

Limited:
  otherwise
```

These thresholds are configuration values and must be validated on real devices.

### 12.2 Trial exposure

For a target exposure:

```text
target_frames = round(target_ms / median_frame_interval_ms)
```

The trial runner:

1. schedules the stimulus on `requestAnimationFrame`
2. records the first painted stimulus timestamp
3. counts rendered frames
4. swaps stimulus for mask on the target frame
5. records the mask timestamp

Use:

```text
ET_actual_sec = (mask_timestamp - stimulus_first_timestamp) / 1000
```

Also retain:

```text
frame_count_expected
frame_count_observed
frame_intervals
exposure_ms_requested
exposure_ms_actual
```

Mark a trial timing-contaminated when:

- the page becomes hidden
- the trial loses focus
- a frame interval exceeds 1.5 times the measured median
- actual duration differs from requested duration by more than one frame
- the device rotates or resizes during the exposure

Do not make network requests, update storage, or rerender unrelated DOM during fixation, stimulus, or mask.

## 13. Primary Capacity Model

The user-facing bits/sec score must come from the MFT-M grouping-search model, not from the simpler `H / ET at 75%` threshold.

For a candidate capacity `C`:

```text
n_samples = (2^C * ET_actual_sec) / N_maj

P_search =
  1 - (1 - P_group)^n_samples

P_correct =
  P_search * p0
  + (1 - P_search) * p_guess
```

Where:

```text
p_guess = 0.5
p0 = upper non-lapse accuracy
```

Equivalent form:

```text
P_correct =
  p0
  - (1 - P_group)^((2^C * ET_actual_sec) / N_maj)
    * (p0 - 0.5)
```

### 13.1 Fit

For valid trials:

```text
logLik(C) =
  sum(
    y_t * log(P_correct_t(C))
    + (1 - y_t) * log(1 - P_correct_t(C))
  )
```

Estimate:

```text
C_hat = argmax logLik(C)
```

MVP implementation:

- search `C` from 0.0 to 10.0 bps
- grid step 0.01
- optionally refine around the maximum with a bounded one-dimensional optimizer
- clamp probabilities to `[0.001, 0.999]`
- version every scoring change

### 13.2 Lapse ceiling `p0`

For a user's first sessions:

- use `p0 = 0.98`
- use `5:0` catches to calculate and display lapse quality separately

After at least 12 valid catch trials across sessions:

- fit `p0` jointly with `C`
- constrain `p0` to `[0.90, 0.995]`
- use a documented regularizing prior
- preserve the fixed-`p0` score as a versioned historical score

Do not fit a free lapse parameter from a small single session.

### 13.3 Exclusions

Exclude from the canonical fit:

- tutorial trials
- timing-contaminated trials
- trials during hidden/background state
- trials with malformed stimulus data
- responses after the deadline

Retain excluded trials for audit and training-history purposes.

## 14. Confidence Calculation

Compute both:

- observed-information standard error from the likelihood curvature
- 95% profile-likelihood interval

Profile interval:

```text
2 * (logLik_max - logLik(C)) <= 3.84
```

Provisional labels:

```text
High confidence:
  valid trials >= 72
  profile interval width <= 0.8 bps
  valid timing proportion >= 0.90
  estimate not on model boundary

Moderate confidence:
  valid trials >= 36
  profile interval width <= 1.5 bps
  valid timing proportion >= 0.80

Still calibrating:
  otherwise

Timing limited:
  session timing quality is Limited, regardless of statistical width
```

These are launch defaults, not scientific constants. Validate them with simulation and pilot test-retest data.

## 15. Adaptive Condition Selection

Use the grouping-search model for both scoring and item information.

After the initial condition coverage, for each candidate `ratio x exposure`:

1. predict `p = P_correct(C_hat)`
2. estimate `dp/dC` numerically at `C_hat`
3. compute Bernoulli Fisher information:

```text
I_condition =
  (dp/dC)^2 / (p * (1 - p))
```

4. apply operational weights:

```text
selection_weight =
  I_condition
  * timing_reliability
  * freshness_weight
  * coverage_weight
```

5. sample probabilistically from the top-weighted conditions

Do not always select the single maximum. Weighted sampling prevents narrow overuse and matches the adaptive paper's goal of balancing information with item exposure.

### 15.1 Initial 24-trial coverage

For a new wrapper:

- 16 core trials: two repetitions of each `4:1` and `3:2` condition across 250, 500, 1000, and 2000 ms
- 4 catch trials: `5:0`, balanced category
- 4 additional high-information repeats selected from pilot defaults

Then begin adaptive selection.

### 15.2 Ongoing catch trials

Schedule one `5:0` catch approximately every 8-12 trials with randomized placement.

### 15.3 Safety bands

Operational guardrails:

- avoid candidates with predicted accuracy below 0.55 unless deliberately probing the lower curve
- avoid candidates above 0.95 except catches
- if recent accuracy is below 0.60, force an easier informative condition
- if timing is Acceptable or Limited, remove exposures shorter than 250 ms
- never change more than one demand dimension as an immediate response to a short streak

The 70-82% training band is a training-control target, not the definition of the bits/sec score.

## 16. Adaptive Stopping

Stop when either:

```text
valid_trials >= minimum
AND confidence target reached
AND both majority categories have adequate coverage
AND both 4:1 and 3:2 have adequate coverage
```

or:

```text
valid_trials == maximum
```

Never stop early based only on recent accuracy.

## 17. Direction, Frame, and Derived Scores

### 17.1 Direction Bandwidth

At launch:

```text
C_abs = fitted C for abs_lr
```

After `abs_ud` is validated, retain wrapper-specific scores. Do not silently average wrappers that have materially different difficulty or reliability.

### 17.2 Frame Bandwidth

At launch:

```text
C_rel = fitted C for rel_inout
```

Use the same grouping-search likelihood, but label the result:

```text
relational bits/sec
```

This is an experimental extension because the relational transform is not part of the original MFT-M validation.

Do not add a fitted wrapper cost to the primary score. A wrapper-cost parameter may be used later for adaptive control and research modelling, but it must not replace the direct fitted `C_rel`.

### 17.3 Frame Cost

```text
Frame Cost = C_abs - C_rel
```

Only show a numeric value when:

- both estimates have at least Moderate confidence
- both have Good or Acceptable timing
- both were measured on the same device class
- estimates are from the same benchmark or within the recent baseline window

Otherwise show:

```text
Frame Cost: still calibrating
```

### 17.4 Frame Efficiency

Internal:

```text
Frame Efficiency = C_rel / C_abs
```

Do not make this a primary launch metric. It is unstable when either estimate has low confidence.

### 17.5 Recent baseline

Use the last five usable estimates for the same wrapper and scoring version.

Compute an inverse-variance weighted mean with a cap on any single session's weight. If standard errors are unavailable, use an equally weighted median.

Do not mix:

- different scoring versions
- different wrappers
- Limited timing sessions
- research and consumer protocols with different condition pools

## 18. Wrapper Progression

Wrapper progression is phase 1b, not launch-critical.

Proposed sequence:

```text
abs_lr
-> abs_ud
-> mixed abs_lr/abs_ud

rel_inout
-> rel_cwccw
-> mixed rel_inout/rel_cwccw
```

Minimum switch eligibility:

- at least 80 valid trials in the current wrapper
- at least two usable sessions
- Moderate or High confidence
- four recent mini-block estimates
- no global timing or engagement problem

Provisional flattening rule:

```text
absolute capacity slope < 0.05 bps per mini-block
AND slope confidence interval includes zero
AND balanced accuracy remains within or above training band
AND condition demand has not decreased
for two consecutive windows
```

After switching:

- start with easier informative conditions
- record immediate switch cost
- do not present a numeric Wrapper Recovery score until enough new-wrapper data exists
- use user-facing statuses: Learning, Recovering, Stable, Mixed

## 19. Flexible Bandwidth and Recovery

Do not launch these as numeric scores.

After at least two validated wrappers:

### Mixed-wrapper capacity

Fit `C_mix` from interleaved trials where the active response rule is clearly cued before each trial or mini-block.

Also calculate:

```text
Mix Cost =
  weighted unmixed capacity - C_mix
```

### Switch metrics

Store:

- pre-switch wrapper capacity
- first new-wrapper block capacity
- switch cost in bps
- valid trials to stable new-wrapper estimate
- mixed-block cost

Before publishing "Wrapper Recovery" as a customer score, define and validate a metric that does not confuse inherent wrapper difficulty with learning recovery.

## 20. Result Presentation

Primary result card:

```text
Direction Bandwidth
3.4 bits/sec

Today's estimate
Recent baseline: 3.2 bits/sec
Confidence: Moderate
Timing quality: Good
```

Frame result:

```text
Frame Bandwidth
2.8 relational bits/sec

Today's estimate
Recent baseline: 2.7
Confidence: Moderate
Timing quality: Good
```

Frame Cost:

```text
Frame Cost
0.6 bits/sec

This is the current difference between standard direction control
and direction judged relative to a centre.
```

Avoid evaluative bands such as "poor" or "deficit". Training-band labels should describe session demand:

- Foundation
- Standard
- Stretch

## 21. Authentication

Reuse the Mission Arena email OTP pattern:

```ts
supabase.auth.signInWithOtp({
  email,
  options: {
    emailRedirectTo: stableAppUrl,
    shouldCreateUser: true,
  },
});
```

Requirements:

- PKCE-compatible Supabase browser client
- stable production redirect URL
- local redirect URLs for development
- separate staging Supabase project for preview deployments
- session restoration on load
- auth change listener
- sign out
- account deletion flow

Recommended UX:

- tutorial before auth
- sign in before first scored session
- no password UI in MVP
- no entitlement gate unless commercial access is explicitly required

If the app becomes paid, reuse Mission Arena's private email-grant and entitlement pattern rather than trusting a browser-submitted email.

## 22. Data Architecture

Do not write to the network during timing-critical trial states.

Flow:

```text
trial runs in memory
-> trial appended to local block buffer
-> mini-block ends
-> buffer saved to IndexedDB
-> authenticated batch submitted
-> server validates and inserts
-> session finalization computes canonical estimates
```

Use IndexedDB rather than `localStorage` for unsynced trial payloads.

## 23. Supabase Tables

### `ccc_device_checks`

```text
id uuid
user_id uuid
device_key text
user_agent text
viewport_width integer
viewport_height integer
device_pixel_ratio numeric
refresh_rate_hz numeric
median_frame_ms numeric
frame_mad_ms numeric
dropped_frame_rate numeric
timing_quality text
created_at timestamptz
```

### `ccc_sessions`

```text
id uuid
user_id uuid
session_type text
exercise_type text
primary_wrapper_id text
status text
generator_version text
adaptive_version text
scoring_version text
session_seed text
device_check_id uuid
started_at timestamptz
completed_at timestamptz
abandoned_at timestamptz
client_timezone text
valid_trial_count integer
timing_quality text
created_at timestamptz
updated_at timestamptz
```

### `ccc_blocks`

```text
id uuid
session_id uuid
user_id uuid
block_index integer
wrapper_id text
block_type text
planned_trials integer
completed_trials integer
started_at timestamptz
completed_at timestamptz
created_at timestamptz
```

### `ccc_trials`

```text
id uuid
session_id uuid
block_id uuid
user_id uuid
trial_index integer
wrapper_id text
ratio text
majority_count integer
majority_category text
condition_exposure_ms integer
stimulus_seed_index integer
positions_json jsonb
vectors_json jsonb
correct_response text
response text
is_correct boolean
rt_ms integer
fixation_ms integer
mask_ms integer
response_deadline_ms integer
exposure_ms_requested numeric
exposure_ms_actual numeric
frame_count_expected integer
frame_count_observed integer
frame_intervals_json jsonb
refresh_rate_hz numeric
timing_quality text
timing_contaminated boolean
contamination_reason text
predicted_p numeric
condition_information numeric
selector_weight numeric
feedback_type text
client_trial_id uuid
created_at timestamptz
```

Unique constraint:

```text
(session_id, client_trial_id)
```

This makes block retries idempotent.

### `ccc_estimates`

```text
id uuid
session_id uuid
user_id uuid
exercise_type text
wrapper_id text
scoring_version text
capacity_bps numeric
capacity_se numeric
profile_ci_low numeric
profile_ci_high numeric
p0 numeric
valid_trials integer
catch_trials integer
catch_accuracy numeric
accuracy numeric
balanced_accuracy numeric
median_rt_ms numeric
lapse_rate numeric
timing_valid_proportion numeric
confidence_label text
created_at timestamptz
```

### `ccc_score_snapshots`

```text
id uuid
user_id uuid
session_id uuid
direction_bps numeric
frame_bps numeric
frame_cost_bps numeric
frame_efficiency numeric
direction_confidence text
frame_confidence text
baseline_direction_bps numeric
baseline_frame_bps numeric
scoring_version text
created_at timestamptz
```

### `ccc_wrapper_states`

```text
user_id uuid
exercise_type text
wrapper_id text
status text
current_capacity_bps numeric
recent_slope numeric
recent_accuracy numeric
valid_trials integer
usable_sessions integer
mixing_ratio numeric
next_wrapper_id text
last_switched_at timestamptz
updated_at timestamptz
primary key (user_id, exercise_type, wrapper_id)
```

### `ccc_adaptive_events`

```text
id uuid
user_id uuid
session_id uuid
event_type text
payload jsonb
algorithm_version text
created_at timestamptz
```

Examples:

- `condition_selected`
- `condition_forced_easier`
- `timing_pool_restricted`
- `early_stop_reached`
- `wrapper_switch_recommended`
- `session_resumed`

## 24. Row-Level Security

Enable RLS on every user table.

Policies:

- authenticated users can read their own rows
- clients cannot update or delete immutable raw trials
- trial insertion occurs through an authenticated Edge Function
- canonical estimates can only be inserted by service-role backend code
- users can request export or deletion through authenticated functions
- no public trial or score reads

Do not expose the service-role key to the browser.

## 25. Edge Functions

### `submit-ccc-block`

Responsibilities:

- verify JWT
- validate payload schema and size
- verify session ownership and open status
- reconstruct trial descriptors from session seed and generator version
- verify correct responses
- reject duplicate client trial IDs idempotently
- sanity-check actual timing and RT
- insert block and trials transactionally
- return accepted trial count and contamination flags

### `finalize-ccc-session`

Responsibilities:

- verify JWT and session ownership
- load canonical valid trials
- fit wrapper capacity
- calculate profile interval and confidence
- calculate recent baselines
- calculate Frame Cost when eligible
- update wrapper state
- write estimate and score snapshot
- close the session
- return the customer result

The client may show a provisional local estimate while waiting, but the server result is canonical.

### `export-ccc-data`

- authenticated only
- exports the user's sessions, trials, estimates, and settings
- excludes service-only fields

### `delete-ccc-data`

- authenticated only
- records explicit confirmation
- deletes or anonymizes according to the final privacy policy
- optionally triggers Supabase account deletion through an admin-controlled process

## 26. API Contracts

Define request and response schemas in TypeScript and validate again in Edge Functions.

Every payload includes:

- `schemaVersion`
- `generatorVersion`
- `adaptiveVersion`
- `scoringVersion`
- idempotency identifier

Never infer historical score semantics from current code.

## 27. Cloudflare Pages

Recommended project:

```text
iq-coach-cognitive-bandwidth
```

Configuration:

```text
Repository: Mindware-Lab/IQ-Coach
Root directory: apps/cognitive-bandwidth
Build command: npm ci && npm run build
Output directory: dist
Production branch: main
```

Environment variables:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
VITE_APP_ENV
VITE_APP_URL
VITE_PROTOCOL_VERSION
```

Use a dedicated stable domain, for example:

```text
bandwidth.iqmindware.com
```

or a confirmed IQ Coach subdomain.

Add:

```text
public/_redirects
/* /index.html 200
```

Use separate staging values for preview deployments. Do not allow Cloudflare preview URLs to write into production behavioural data by default.

## 28. Privacy and Data Handling

Treat trial-level cognitive performance as sensitive behavioural data.

Requirements:

- explicit privacy summary before the first scored session
- clear reason for collecting trial timing and device data
- no ad trackers in active task routes
- no raw email copied into app tables
- UUID user references only
- data export
- data deletion
- documented retention period
- aggregate research use requires separate consent
- research consent is not bundled into basic account creation

The app should work without population-comparison consent.

## 29. Accessibility

Support:

- minimum 48 px touch targets
- keyboard controls on desktop
- left-handed button order
- swap response buttons
- reduced motion
- larger text outside the stimulus field
- high contrast mode
- sound off by default or remembered user choice
- visual feedback in addition to sound

Scored arrow geometry and size must remain fixed within a protocol version. Accessibility modes must not silently alter the scored stimulus definition. If a visual accommodation changes stimulus size or contrast, record it and use a separate protocol variant.

## 30. Testing Strategy

### Geometry unit tests

- all eight octagon positions
- radial Out and In vectors
- clockwise and anticlockwise screen-coordinate mapping
- correct category after SVG rotation
- majority count and response derivation

### Generator tests

- deterministic output for seed and version
- five unique positions
- exact 5:0, 4:1, and 3:2 counts
- block balancing
- no prohibited repeat streaks

### Scoring tests

- `P_group` table
- predicted probabilities at known `C` and exposure values
- likelihood maximum from synthetic data
- boundary estimates
- timing exclusions
- profile interval
- client/server parity

### Simulation tests

For simulated users at:

```text
C = 1, 2, 3, 4, 5, 6 bps
p0 = 0.92, 0.96, 0.98
```

Run thousands of virtual sessions and measure:

- bias
- RMSE
- confidence-interval coverage
- stopping length
- condition exposure
- failure rate at model boundaries

Do not ship confidence thresholds until these simulations pass documented acceptance limits.

### Browser tests

- onboarding
- magic-link return handling
- timing check
- tutorial
- scored session
- pause/resume
- offline block queue
- finalization
- result history
- export/delete entry points

### Real-device QA

Required devices:

- iPhone Safari at 60 Hz
- modern iPhone Pro Safari at 120 Hz
- Android Chrome at 60 Hz
- Android high-refresh Chrome
- desktop Chrome
- desktop Safari
- desktop Firefox

Playwright cannot validate real display timing. Use recorded real-device timing logs and manual visual checks.

## 31. Observability

Record app errors without recording stimulus or score payloads in third-party logs.

Internal operational metrics:

- auth failures
- block submission failures
- session finalization failures
- timing-quality distribution by device class
- contamination rate
- abandoned-session rate
- estimate boundary rate
- average trials to stop

Use Supabase logs or a privacy-reviewed error service. Do not send raw trial arrays to Cloudflare Web Analytics.

## 32. Build Phases

### Phase 0: repository and backend scaffold

- create app package
- add Vite/TypeScript/CSS
- create Supabase migrations
- configure email auth
- configure staging Cloudflare Pages
- establish protocol and scoring version constants

Acceptance:

- app builds
- auth works in staging
- RLS tests pass

### Phase 1: deterministic Direction task

- SVG arrow renderer
- octagon geometry
- `abs_lr` generator
- fixation/stimulus/mask/response runner
- frame timing logs
- tutorial
- local trial buffer

Acceptance:

- all generated trials are deterministic and correctly scored
- no network activity during critical states
- real-device masks render at all positions

### Phase 2: scoring and adaptive Direction session

- grouping-search model
- likelihood fit
- confidence interval
- 24-trial coverage
- Fisher-information selector
- adaptive stopping
- server canonical finalization

Acceptance:

- simulation bias and coverage meet thresholds
- client/server estimates match
- Direction result and baseline render correctly

### Phase 3: Frame task

- `rel_inout` vector generator
- Frame tutorial
- Frame adaptive sessions
- relational score wording
- Frame Cost eligibility rules

Acceptance:

- geometry tests pass
- user comprehension pilot passes
- results clearly distinguish validated foundation from relational extension

### Phase 4: persistence and customer UX

- Today
- Train
- Results
- Settings
- interrupted-session recovery
- IndexedDB retry queue
- data export/delete
- accessibility options

Acceptance:

- complete first-run and returning-user flows
- no data loss during refresh or temporary network loss

### Phase 5: production validation

- staging pilot
- test-retest analysis
- device timing analysis
- completion and dropout analysis
- copy and claims review
- production Cloudflare deploy

### Phase 1b after launch

- `abs_ud`
- `rel_cwccw`
- mixed-wrapper blocks
- recovery research metrics
- only then customer-facing Flexible Bandwidth/Wrapper Recovery

## 33. Definition of Done for Initial Release

A signed-in user can:

- complete device timing validation
- learn the Left/Right and Out/In tasks
- run a Quick or Standard Direction session
- run a Quick or Standard Frame session
- resume after an interruption
- receive server-computed Direction and Frame estimates
- see confidence and timing-quality labels
- see Frame Cost when eligible
- see a recent personal baseline
- review prior usable sessions
- change input, sound, and accessibility preferences
- export or request deletion of their data

The system can:

- reproduce every stimulus from seed and version
- log actual exposure timing
- reject contaminated trials from canonical estimates
- validate submitted responses server-side
- fit the grouping-search model
- select informative conditions adaptively
- preserve immutable raw trial history
- keep all user data private under RLS
- deploy from the IQ Coach repository to Cloudflare Pages

## 34. Decisions Still Requiring Product Confirmation

Recommended defaults are shown first.

1. **Access model:** free account for MVP; add entitlements later if sold separately.
2. **Production domain:** dedicated IQ Coach subdomain rather than an IQMindware website subpath.
3. **Supabase project:** reuse the existing IQMindware project for unified identity, with app-prefixed tables and functions; use a separate staging project.
4. **First scored session:** Direction first, Frame offered after the Direction result.
5. **Sound:** off by default, remembered if enabled.
6. **Research consent:** separate optional consent after account creation.
7. **Population norms:** unavailable until a preregistered minimum sample and reliability standard are met.

## 35. Source Materials

Local product sources:

- `protocols/MVP-2026/ccc_protocol_specs.md`
- `protocols/MVP-2026/CCC_capacity_measures.md`
- `protocols/MVP-2026/UX.md`
- `protocols/MVP-2026/iqm-ccc-app-style.css`
- `protocols/MVP-2026/assets/1.png` through `6.png`
- attached CCC UX flow and scientific-positioning documents
- Mission Arena frontend, Supabase migrations, auth, Edge Functions, and Cloudflare deployment scripts

Primary scientific references:

- Wu et al. (2016), *The Capacity of Cognitive Control Estimated from a Perceptual Decision Making Task*: https://www.nature.com/articles/srep34025
- He et al. (2022), *Adaptive assessment of the capacity of cognitive control*: https://doi.org/10.1177/17470218211030838
- Chen et al. (2019), *Testing a Cognitive Control Model of Human Intelligence*: https://www.nature.com/articles/s41598-019-39685-2
- Zhang et al. (2024), *Attention control training and transfer effects on cognitive tasks*: https://pubmed.ncbi.nlm.nih.gov/38777117/

