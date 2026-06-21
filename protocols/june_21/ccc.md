# IQ Coach CCC Component — Definitive Coding Plan

## 1. Core design decision

The CCC component should be implemented as the **Attention Control** layer of IQ Coach.

Its job is to estimate and train:

```text
brief controlled evidence extraction
under masking
under time pressure
with wrapper recovery tests
```

It should not become a full stimulus-stack game. The canonical CCC score should remain a clean masked-majority capacity estimate.

### Primary recommendation

Use a three-tier design:

```text
Tier 1 — CCC-Core
canonical scoring layer
arrows only
binary majority extraction
bits/sec

Tier 2 — CCC-Transfer
wrapper-recovery layer
same relation recovered across changed surfaces
not initially pooled into the canonical score

Tier 3 — CCC-Research
experimental carrier extensions
optic flow / Gabor / four-category / colour-lure variants
versioned separately
```

This preserves the construct while still supporting transfer.

---

## 2. What should be included in CCC?

## 2.1 Include in canonical CCC-Core

Use four orthogonal relation axes:

```text
absolute x-axis:
left / right

absolute y-axis:
up / down

relational radial axis:
out / in

relational tangential axis:
clockwise / anticlockwise
```

These are the clean v1 CCC dimensions.

They cover:

```text
absolute screen-centred extraction
relational centre-framed extraction
frame switching
relation recovery
mixed-wrapper stability
```

## 2.2 Exclude from canonical CCC-Core

Do not include these in the canonical CCC score:

```text
colour as a scored feature
context gates
relation × colour conjunctions
graph transitions
successor prediction
n-back memory
Gabor spatial frequency
Gabor orientation
optic-flow speed
optic-flow transition streams
reasoning items
semantic wrappers
```

These belong to later layers.

## 2.3 Optional later CCC-Transfer probes

After CCC-Core is stable, add non-canonical transfer probes:

```text
optic_flow.absolute.x_axis.left/right
optic_flow.absolute.y_axis.up/down
optic_flow.relational.radial_axis.expansion/contraction
optic_flow.relational.tangential_axis.clockwise/anticlockwise
```

These should initially produce:

```text
carrier_switch_cost
carrier_recovery_ratio
carrier_mixed_stability
```

not a direct pooled Attention Control score.

## 2.4 Optional Gabor research route

Gabor stimuli can be kept as a research bridge:

```text
gabor.absolute.orientation_axis.horizontal/vertical
gabor.absolute.spatial_frequency_axis.low/high
gabor.relational.radial_axis.radial_aligned/tangential_aligned
```

But Gabor should not be mandatory for the main app unless validation shows it adds useful transfer signal.

---

# 3. State grammar for CCC

Use a shared `VisualState` type, but restrict which fields are active in CCC-Core.

```ts
type Carrier = "arrow" | "optic_flow" | "gabor";

type Frame = "absolute" | "relational";

type Axis =
  | "x_axis"
  | "y_axis"
  | "radial_axis"
  | "tangential_axis"
  | "orientation_axis"
  | "spatial_frequency_axis"
  | "flow_speed_axis";

type Polarity =
  | "left"
  | "right"
  | "up"
  | "down"
  | "out"
  | "in"
  | "clockwise"
  | "anticlockwise"
  | "horizontal"
  | "vertical"
  | "radial_aligned"
  | "tangential_aligned"
  | "low_spatial_frequency"
  | "high_spatial_frequency"
  | "slow"
  | "fast"
  | "expansion"
  | "contraction";

type Colour = "blue" | "yellow" | "green" | "purple";

type Context = "K" | "L" | null;

type VisualState = {
  carrier: Carrier;
  frame: Frame;
  axis: Axis;
  polarity: Polarity;
  colour?: Colour;
  context?: Context;
};
```

For CCC-Core, enforce this subset:

```ts
type CCCCoreState =
  | {
      carrier: "arrow";
      frame: "absolute";
      axis: "x_axis";
      polarity: "left" | "right";
      colour?: undefined;
      context?: null;
    }
  | {
      carrier: "arrow";
      frame: "absolute";
      axis: "y_axis";
      polarity: "up" | "down";
      colour?: undefined;
      context?: null;
    }
  | {
      carrier: "arrow";
      frame: "relational";
      axis: "radial_axis";
      polarity: "out" | "in";
      colour?: undefined;
      context?: null;
    }
  | {
      carrier: "arrow";
      frame: "relational";
      axis: "tangential_axis";
      polarity: "clockwise" | "anticlockwise";
      colour?: undefined;
      context?: null;
    };
```

---

# 4. Wrapper IDs

Use explicit wrapper IDs.

```ts
type CCCWrapperId =
  | "arrow_abs_lr"
  | "arrow_abs_ud"
  | "arrow_rel_inout"
  | "arrow_rel_cwccw"
  | "optic_abs_lr"
  | "optic_abs_ud"
  | "optic_rel_expand_contract"
  | "optic_rel_cwccw"
  | "gabor_abs_orientation"
  | "gabor_abs_spatial_frequency"
  | "gabor_rel_radial_alignment";
```

Canonical v1 wrappers:

```text
arrow_abs_lr
arrow_abs_ud
arrow_rel_inout
arrow_rel_cwccw
```

Optional v2 / transfer wrappers:

```text
optic_abs_lr
optic_abs_ud
optic_rel_expand_contract
optic_rel_cwccw
```

Optional research wrappers:

```text
gabor_abs_orientation
gabor_abs_spatial_frequency
gabor_rel_radial_alignment
```

---

# 5. Trial object

```ts
type CCCTrial = {
  trial_id: string;
  user_id: string;
  session_id: string;
  block_id: string;
  trial_index: number;

  layer: "attention_control";
  measure_target:
    | "ACC_absolute"
    | "ACC_relational"
    | "ACC_wrapper_recovery"
    | "ACC_mixed_stability"
    | "ACC_transfer_probe";

  wrapper_id: CCCWrapperId;
  carrier: Carrier;
  frame: Frame;
  axis: Axis;

  set_size: 5;
  possible_positions: 8;
  sampled_positions: Position2D[];

  majority_ratio: "5:0" | "4:1" | "3:2";
  majority_polarity: Polarity;
  item_states: VisualState[];

  response_options: [string, string];
  correct_response: string;
  user_response?: string;
  is_correct?: boolean;

  exposure_ms_requested: number;
  exposure_ms_actual: number;
  mask_ms: number;
  response_deadline_ms: number;
  rt_ms?: number;

  actual_stimulus_frames: number;
  device_refresh_rate_estimate: number;
  dropped_frame_count: number;
  timing_quality: "good" | "acceptable" | "limited";

  difficulty_parameters: {
    H_majority_bits: number;
    ET_adjusted_seconds: number;
    wrapper_cost?: number;
    frame_cost?: number;
    lure_cost?: number;
    D_trial: number;
  };

  adaptive_state: {
    theta_prior: number;
    predicted_correct: number;
    information_value: number;
    training_band: "easy" | "target" | "stretch" | "overload";
  };

  created_at: string;
};
```

---

# 6. Renderer architecture

Build a general vector renderer, but expose only arrow CCC in v1.

## 6.1 Core geometry

```ts
type Position2D = {
  x: number;
  y: number;
};

type Vector2D = {
  x: number;
  y: number;
};

type RenderedItem = {
  position: Position2D;
  direction: Vector2D;
  state: VisualState;
};
```

## 6.2 Position generation

```ts
function generateOctagonPositions(
  centre: Position2D,
  radiusPx: number
): Position2D[] {
  // eight positions around the centre
}
```

## 6.3 Sample five positions

```ts
function sampleTrialPositions(
  allPositions: Position2D[],
  setSize = 5
): Position2D[] {
  // randomly sample five without replacement
}
```

## 6.4 Arrow vector rules

Absolute:

```ts
left  = { x: -1, y: 0 };
right = { x: 1, y: 0 };
up    = { x: 0, y: -1 };
down  = { x: 0, y: 1 };
```

Relational radial:

```ts
function radialUnitVector(position: Position2D, centre: Position2D): Vector2D {
  return normalise({
    x: position.x - centre.x,
    y: position.y - centre.y
  });
}

function radialDirection(
  polarity: "out" | "in",
  position: Position2D,
  centre: Position2D
): Vector2D {
  const r = radialUnitVector(position, centre);
  return polarity === "out" ? r : scale(r, -1);
}
```

Relational tangential:

```ts
function rotate90(v: Vector2D): Vector2D {
  return { x: -v.y, y: v.x };
}

function tangentialDirection(
  polarity: "clockwise" | "anticlockwise",
  position: Position2D,
  centre: Position2D
): Vector2D {
  const r = radialUnitVector(position, centre);
  const t = rotate90(r);

  // Confirm sign empirically in a unit test because screen y-axis is inverted.
  return polarity === "clockwise" ? t : scale(t, -1);
}
```

Required unit tests:

```text
top position + clockwise points right
right position + clockwise points down
bottom position + clockwise points left
left position + clockwise points up
```

Adjust the sign if screen coordinates reverse the mapping.

---

# 7. Trial generation

## 7.1 Majority ratio generation

```ts
type MajorityRatio = "5:0" | "4:1" | "3:2";

function ratioCounts(ratio: MajorityRatio): [number, number] {
  switch (ratio) {
    case "5:0": return [5, 0];
    case "4:1": return [4, 1];
    case "3:2": return [3, 2];
  }
}
```

## 7.2 Generate polarities

```ts
function generateMajorityPolarities(
  ratio: MajorityRatio,
  target: Polarity,
  opposite: Polarity
): Polarity[] {
  const [nTarget, nOpposite] = ratioCounts(ratio);
  return shuffle([
    ...Array(nTarget).fill(target),
    ...Array(nOpposite).fill(opposite)
  ]);
}
```

## 7.3 Wrapper config

```ts
type CCCWrapperConfig = {
  wrapper_id: CCCWrapperId;
  carrier: Carrier;
  frame: Frame;
  axis: Axis;
  polarities: [Polarity, Polarity];
  response_labels: [string, string];
  canonical: boolean;
  evidence_tier:
    | "adapted_published_model"
    | "principled_extension"
    | "internal_calibration"
    | "research_probe";
};
```

Canonical configs:

```ts
const CCC_CORE_WRAPPERS: CCCWrapperConfig[] = [
  {
    wrapper_id: "arrow_abs_lr",
    carrier: "arrow",
    frame: "absolute",
    axis: "x_axis",
    polarities: ["left", "right"],
    response_labels: ["Left", "Right"],
    canonical: true,
    evidence_tier: "adapted_published_model"
  },
  {
    wrapper_id: "arrow_abs_ud",
    carrier: "arrow",
    frame: "absolute",
    axis: "y_axis",
    polarities: ["up", "down"],
    response_labels: ["Up", "Down"],
    canonical: true,
    evidence_tier: "principled_extension"
  },
  {
    wrapper_id: "arrow_rel_inout",
    carrier: "arrow",
    frame: "relational",
    axis: "radial_axis",
    polarities: ["out", "in"],
    response_labels: ["Out", "In"],
    canonical: true,
    evidence_tier: "principled_extension"
  },
  {
    wrapper_id: "arrow_rel_cwccw",
    carrier: "arrow",
    frame: "relational",
    axis: "tangential_axis",
    polarities: ["clockwise", "anticlockwise"],
    response_labels: ["Circle Right", "Circle Left"],
    canonical: true,
    evidence_tier: "principled_extension"
  }
];
```

---

# 8. Trial sequence

Each trial follows:

```text
fixation
→ stimulus
→ backward mask
→ response window
→ feedback
→ inter-trial interval
```

Recommended timing:

```ts
const DEFAULT_TIMING = {
  fixation_min_ms: 250,
  fixation_max_ms: 500,
  stimulus_exposure_ms: "adaptive",
  mask_ms: 350,
  response_deadline_ms: 2200,
  feedback_ms: 180,
  iti_ms: 250
};
```

The stimulus should not disappear early if the user responds early. Keep the exposure fixed and log early responses.

---

# 9. Information-rate and grouping-search model

The canonical CCC / Attention Control score must be estimated using an MFT-M-derived grouping-search likelihood.

The bits/sec score is **not** a direct per-trial throughput average.

The canonical score is:

```text
C_hat =
fitted capacity parameter in bits/sec
estimated from trial-level response accuracy
across entropy × exposure-time conditions
```

The UI may describe this as:

```text
estimated controlled evidence throughput in bits/sec
```

But the technical estimator must treat bits/sec as a fitted latent capacity parameter.

---

## 9.1 Entropy table

Use a configurable entropy table.

```ts
type EntropyTableRow = {
  set_size: 3 | 5;
  majority_ratio: "2:1" | "5:0" | "4:1" | "3:2";
  n_size: number;
  n_maj: number;
  n_con: number;
  p_group: number;
  H_majority_bits: number;
  table_version: string;
};
```

Initial consumer v1 may use five-arrow displays only:

```ts
const DEFAULT_FIVE_ARROW_ENTROPY_TABLE: EntropyTableRow[] = [
  {
    set_size: 5,
    majority_ratio: "5:0",
    n_size: 5,
    n_maj: 3,
    n_con: 5,
    p_group: 1.00,
    H_majority_bits: 1.58,
    table_version: "ccc_entropy_v0.2"
  },
  {
    set_size: 5,
    majority_ratio: "4:1",
    n_size: 5,
    n_maj: 3,
    n_con: 4,
    p_group: 0.40,
    H_majority_bits: 2.91,
    table_version: "ccc_entropy_v0.2"
  },
  {
    set_size: 5,
    majority_ratio: "3:2",
    n_size: 5,
    n_maj: 3,
    n_con: 3,
    p_group: 0.10,
    H_majority_bits: 4.91,
    table_version: "ccc_entropy_v0.2"
  }
];
```

Research mode may add the three-arrow condition:

```ts
{
  set_size: 3,
  majority_ratio: "2:1",
  n_size: 3,
  n_maj: 2,
  n_con: 2,
  p_group: 0.33,
  H_majority_bits: 2.58,
  table_version: "ccc_entropy_v0.2"
}
```

Do not hard-code these values inside the estimator.

---

## 9.2 Grouping-search quantities

For each trial condition:

```text
N_size =
total number of arrows

N_maj =
minimum majority sample size
for five arrows, N_maj = 3

N_con =
number of arrows in the majority direction

P_group =
probability that one random majority-sized sample is congruent

H_majority_bits =
log2(N_maj / P_group)
```

In implementation:

```ts
function computePGroup(nSize: number, nMaj: number, nCon: number): number {
  return combination(nCon, nMaj) / combination(nSize, nMaj);
}

function computeHMajorityBits(nMaj: number, pGroup: number): number {
  return Math.log2(nMaj / pGroup);
}
```

---

## 9.3 Trial information rate

For descriptive and adaptive purposes:

```text
R_trial =
H_majority_bits / ET_adjusted_seconds
```

Store:

```ts
difficulty_parameters: {
  H_majority_bits: number;
  ET_adjusted_seconds: number;
  R_trial_bps: number;
  p_group: number;
  n_size: number;
  n_maj: number;
  n_con: number;
}
```

Use `R_trial_bps` for:

```text
condition difficulty display in admin/debug views
adaptive condition selection
posterior information calculations
calibration plots
```

Do not use `R_trial_bps` alone as the user’s capacity score.

---

## 9.4 Effective exposure time

Primary rule:

```text
tau_eff =
ET_actual_seconds
```

when the stimulus is presented for a fixed exposure and is not terminated by response.

If a future variant allows response-terminated stimulus display:

```text
tau_eff =
min(ET_actual_seconds, RT_seconds)
```

For sensitivity analysis, also compute:

```text
tau_min =
min(ET_actual_seconds, RT_seconds)
```

but keep `ET_actual_seconds` as the primary scoring value for fixed-exposure masked trials.

---

## 9.5 Full grouping-search likelihood

The primary scientific scoring model should estimate `C` using the grouping-search likelihood.

Definitions:

```text
C =
capacity parameter in bits/sec

tau_eff =
effective exposure time in seconds

P_group =
probability of obtaining a congruent majority-sized sample

N_maj =
majority sample size

p0 =
baseline accuracy when a congruent sample is found

p_guess =
chance-level guessing probability
```

For a two-choice task:

```text
p_guess = 0.50
```

Expected number of scanned arrows:

```text
n_a =
2^C × tau_eff
```

Expected number of majority-sized samples:

```text
n_s =
n_a / N_maj
```

Probability that at least one congruent sample is found before the mask:

```text
P_VT =
1 - (1 - P_group)^n_s
```

Expected probability correct:

```text
P_correct =
P_VT × p0
+
(1 - P_VT) × p_guess
```

In code:

```ts
function predictCorrectGroupingSearch(params: {
  C_bps: number;
  tauEffSeconds: number;
  pGroup: number;
  nMaj: number;
  p0: number;
  pGuess: number;
}): number {
  const nA = Math.pow(2, params.C_bps) * params.tauEffSeconds;
  const nS = nA / params.nMaj;

  const pVT = 1 - Math.pow(1 - params.pGroup, nS);

  return pVT * params.p0 + (1 - pVT) * params.pGuess;
}
```

---

## 9.6 Baseline accuracy and lapse handling

Estimate or set:

```text
p0 =
accuracy when the user obtains a congruent sample
```

Initial implementation:

```text
p0 = fixed prior around 0.97
```

Preferred rolling implementation:

```text
p0 =
estimated from easy / high-congruency / long-exposure trials
with shrinkage to a stable prior
```

Also estimate:

```text
lapse_rate
```

Use lapse adjustment as:

```text
P_correct_lapse_adjusted =
(1 - lapse_rate) × P_correct
+
lapse_rate × p_guess
```

In code:

```ts
function applyLapseAdjustment(
  pCorrect: number,
  lapseRate: number,
  pGuess: number
): number {
  return (1 - lapseRate) * pCorrect + lapseRate * pGuess;
}
```

Do not allow high lapse rates to produce high-confidence capacity estimates.

---

## 9.7 Maximum-likelihood estimate

For a given wrapper and rolling window:

```text
C_hat =
argmax_C Σ log P(response_i | C, trial_i)
```

For each trial:

```text
if correct:
  log_likelihood += log(P_correct_i)

if incorrect:
  log_likelihood += log(1 - P_correct_i)
```

In code:

```ts
function logLikelihoodC(params: {
  C_bps: number;
  trials: CCCTrial[];
  p0: number;
  pGuess: number;
  lapseRate: number;
}): number {
  let ll = 0;

  for (const trial of params.trials) {
    const pRaw = predictCorrectGroupingSearch({
      C_bps: params.C_bps,
      tauEffSeconds: trial.difficulty_parameters.ET_adjusted_seconds,
      pGroup: trial.difficulty_parameters.p_group,
      nMaj: trial.difficulty_parameters.n_maj,
      p0: params.p0,
      pGuess: params.pGuess
    });

    const p = clamp(
      applyLapseAdjustment(pRaw, params.lapseRate, params.pGuess),
      1e-6,
      1 - 1e-6
    );

    ll += trial.is_correct ? Math.log(p) : Math.log(1 - p);
  }

  return ll;
}
```

Estimate `C_hat` using:

```text
grid search for MVP
bounded optimisation later
Bayesian posterior later
```

Recommended grid:

```ts
const C_GRID = range(0, 10, 0.01);
```

For web-app speed, a 0.05 grid is acceptable for live display, with server-side refinement.

---

## 9.8 Posterior estimate and standard error

The canonical estimate should be server-side.

Minimum output:

```ts
type GroupingSearchEstimate = {
  C_hat_bps: number;
  standard_error: number;
  log_likelihood_max: number;
  model_id: "mftm_grouping_search";
  model_version: string;
  p0: number;
  p_guess: number;
  lapse_rate: number;
  trial_count: number;
  valid_trial_count: number;
  timing_quality: "good" | "acceptable" | "limited";
};
```

For MVP:

```text
standard_error =
curvature-based approximation
or bootstrap / posterior SD over the C grid
```

Preferred robust approach:

```text
posterior(C) ∝ likelihood(C) × prior(C)
standard_error = posterior SD
```

Use a weakly informative prior:

```text
C ~ normal(3.5, 1.5)
truncated to 0–10 bps
```

This prior is for numerical stability only and should be versioned.

---

## 9.9 Wrapper costs

Do not add wrapper cost directly into the primary MFT-M likelihood for canonical `arrow_abs_lr`.

For other wrappers, estimate separate capacities first:

```text
C_arrow_abs_lr
C_arrow_abs_ud
C_arrow_rel_inout
C_arrow_rel_cwccw
```

Then compute wrapper differences as derived metrics:

```text
Frame Cost =
ACC_absolute - ACC_relational

Wrapper Cost =
C_anchor_wrapper - C_new_wrapper

Switch Cost =
max(0, X_A_pre - X_B_probe) / X_A_pre
```

Only introduce explicit wrapper-cost parameters after enough calibration data.

---

## 9.10 Primary vs fallback model

Use this model hierarchy:

```text
Primary scientific estimator:
full grouping-search likelihood

Secondary engineering estimator:
lapse-adjusted sigmoid

UI shorthand:
estimated controlled evidence throughput in bits/sec
```

The sigmoid form may be retained only as:

```text
debug approximation
fallback when grouping-search metadata are missing
rough adaptive pre-estimate during play
simulation convenience
```

Do not label the sigmoid estimate as the canonical MFT-M-derived score unless it has been validated against the grouping-search estimator.

Fallback form:

```ts
P_correct =
chance + usable_range * sigmoid(theta_user - D_trial)
```

but store:

```text
model_id = "sigmoid_fallback"
evidence_tier = "engineering_fallback"
```

---

## 9.11 Claims boundary for scoring

Allowed:

```text
Attention Control estimates controlled evidence extraction from a brief masked majority task.

The standard left/right version is MFT-M-derived.

The relational frame versions apply the same information-rate logic to experimental frame-based judgements.

Single-session scores are provisional.

The rolling estimate is the main product score.
```

Avoid:

```text
This is the full published MFT-M.

This is a full IQ test.

This proves IQ gain.

The relational versions are validated MFT-M scores.

A two-minute block gives a stable capacity estimate.
```

Use:

```text
five-arrow adaptive MFT-M-derived estimate
```

not:

```text
full MFT-M
```

unless the research mode implements the full condition structure.

---


# 10. Adaptive selector

The adaptive selector should choose ratio × exposure × wrapper conditions that are informative about the current posterior estimate of `C`.

The selector should use the grouping-search model, not the sigmoid model, for canonical scoring.

---

## 10.1 Candidate condition

```ts
type CCCCondition = {
  wrapper_id: CCCWrapperId;
  set_size: 3 | 5;
  majority_ratio: "2:1" | "5:0" | "4:1" | "3:2";
  exposure_ms_requested: number;
  mask_ms: number;
  response_deadline_ms: number;
  H_majority_bits: number;
  p_group: number;
  n_maj: number;
  expected_timing_quality: "good" | "acceptable" | "limited";
};
```

---

## 10.2 Expected information value

MVP approximation:

```text
information_value =
posterior_uncertainty
× discrimination_weight
× reliability_weight
× target_band_weight
```

Where:

```text
discrimination_weight
is highest when predicted accuracy is near the informative range

reliability_weight
penalises poor timing, very short exposures and unstable devices

target_band_weight
keeps training near the 70–82% range
```

In code:

```ts
function predictedCorrectForCondition(
  C_bps: number,
  condition: CCCCondition,
  p0: number,
  pGuess: number,
  lapseRate: number
): number {
  const pRaw = predictCorrectGroupingSearch({
    C_bps,
    tauEffSeconds: condition.exposure_ms_requested / 1000,
    pGroup: condition.p_group,
    nMaj: condition.n_maj,
    p0,
    pGuess
  });

  return applyLapseAdjustment(pRaw, lapseRate, pGuess);
}
```

---

## 10.3 Trial-selection rule

```ts
function selectNextCCCCondition(
  posterior: CCCPosterior,
  wrapperState: WrapperState,
  candidateConditions: CCCCondition[]
): CCCCondition {
  if (wrapperState.status === "new_probe") {
    return chooseEasierProbeCondition(candidateConditions);
  }

  const scored = candidateConditions.map(condition => {
    const p = predictedCorrectForCondition(
      posterior.mean_C_bps,
      condition,
      posterior.p0,
      0.5,
      posterior.lapse_rate
    );

    const discriminationWeight = binomialDiscriminationWeight(p);
    const reliability = reliabilityWeight(condition);
    const targetBand = targetBandWeight(p);

    const informationValue =
      posterior.sd_C_bps *
      discriminationWeight *
      reliability *
      targetBand;

    return { condition, informationValue };
  });

  return argmax(scored, x => x.informationValue).condition;
}
```

---

## 10.4 Training-band rules

Use these operational rules during gameplay:

```text
predicted accuracy 70–82%:
target training band

predicted accuracy > 85%:
increase one difficulty dimension

predicted accuracy 60–70%:
repeat with mild support

predicted accuracy < 60%:
reduce demand
```

Difficulty dimensions should be changed in this order:

```text
1. exposure duration
2. majority ratio
3. wrapper switch
4. mixed-wrapper uncertainty
5. lure pressure
```

Never increase multiple demand dimensions at once.

---

## 10.5 Do not over-adapt within unstable windows

Do not adapt aggressively when:

```text
fewer than 24 valid trials in the current mini-window
timing quality is limited
lapse rate is elevated
RT variability is extreme
response bias is high
posterior uncertainty is very wide
```

Route to:

```text
calibration
easier exposures
more catch trials
instruction refresh
same-wrapper stabilisation
```

---

# 11. Horizontal transfer controller

CCC should use wrapper progression as the central training algorithm.

## 11.1 Canonical v1 progression

```text
arrow_abs_lr
→ arrow_abs_ud
→ mix(arrow_abs_lr, arrow_abs_ud)
→ arrow_rel_inout
→ arrow_rel_cwccw
→ mix(arrow_rel_inout, arrow_rel_cwccw)
→ mixed absolute + relational review
→ delayed re-check
```

This is the recommended v1 progression.

## 11.2 Why no diagonal or spiral in v1?

Diagonal and spiral are useful later, but they violate the first clean orthogonal grammar and add extra interpretability load.

Use them only after the four orthogonal wrappers are stable:

```text
v2 extension:
arrow_abs_diag
arrow_rel_spiral
```

## 11.3 Transfer-controller state machine

```ts
type WrapperLearningState =
  | "locked"
  | "blocked_training"
  | "flattening"
  | "new_probe"
  | "recovery_training"
  | "mixed_training"
  | "delayed_recheck"
  | "banked"
  | "recycle";

type HorizontalCycleState = {
  active_wrappers: CCCWrapperId[];
  current_wrapper: CCCWrapperId;
  previous_wrapper?: CCCWrapperId;
  phase:
    | "blocked_A"
    | "probe_B"
    | "recover_B"
    | "mix_AB"
    | "probe_C"
    | "mix_ABC"
    | "delayed_recheck"
    | "bank_or_recycle";
};
```

## 11.4 Flattening detection

A wrapper is flattening when:

```text
recent capacity slope ≈ 0
AND next-window improvement probability is low
AND balanced accuracy is stable in or above target band
AND timing quality is acceptable or good
AND lapse rate is not elevated
AND minimum valid trials have been reached
```

Practical v1 rule:

```ts
function detectFlattening(wrapper: WrapperEstimateWindow): boolean {
  return (
    wrapper.valid_trials >= 120 &&
    wrapper.usable_sessions >= 2 &&
    wrapper.slope_recent < wrapper.slope_threshold &&
    wrapper.balanced_accuracy >= 0.70 &&
    wrapper.timing_quality !== "limited" &&
    wrapper.lapse_rate < wrapper.max_lapse_rate &&
    wrapper.estimate_confidence !== "insufficient_data"
  );
}
```

## 11.5 Wrapper switch

When flattening is detected:

```text
unlock next wrapper
begin with easier exposure and ratio
expect dip
train recovery
then mix old and new wrappers
```

```ts
function updateHorizontalCycle(state: HorizontalCycleState): HorizontalCycleState {
  const current = getWrapperEstimate(state.current_wrapper);

  if (detectDoNotSwap(current)) {
    return keepTrainingOrScaffold(state);
  }

  if (detectFlattening(current)) {
    const next = getNextWrapper(state.current_wrapper);

    if (next) {
      return {
        ...state,
        previous_wrapper: state.current_wrapper,
        current_wrapper: next,
        active_wrappers: [state.current_wrapper, next],
        phase: "probe_B"
      };
    }
  }

  if (detectRecovery(state.current_wrapper, state.previous_wrapper)) {
    return {
      ...state,
      phase: "mix_AB"
    };
  }

  if (detectMixedStability(state.active_wrappers)) {
    return {
      ...state,
      phase: "delayed_recheck"
    };
  }

  return state;
}
```

## 11.6 Do-not-swap conditions

Do not introduce a new wrapper if:

```text
accuracy < 60%
high lapse rate
high timeout rate
response bias
poor comprehension
low valid trial count
timing-limited estimates
wide posterior uncertainty
volatile RTs
```

Route instead to:

```text
more calibration
slower exposure
more catch trials
instruction refresh
same-wrapper stabilisation
```

---

# 12. Transfer metrics

Use the same transfer metrics across CCC and later layers.

Let:

```text
A = trained wrapper
B = new wrapper
X_A_pre = stable capacity in A before probe
X_B_probe = first valid capacity in B during probe
X_B_recovered = rolling capacity in B after recovery
X_mix = mixed-wrapper capacity
X_delayed_mix = delayed mixed-wrapper capacity
```

## 12.1 Switch Cost

```text
SwitchCost = max(0, X_A_pre - X_B_probe) / X_A_pre
```

## 12.2 Recovery Ratio

```text
RecoveryRatio = X_B_recovered / X_A_pre
```

Recovery bands:

```text
Strong:
X_B_recovered >= X_A_pre - SWD

Moderate:
X_B_recovered >= 0.80 * X_A_pre

Weak:
X_B_recovered >= 0.60 * X_A_pre

Poor:
X_B_recovered < 0.60 * X_A_pre
```

## 12.3 Recovery Efficiency

```text
RecoveryEfficiency =
1 - min(1, trials_to_recovery / target_recovery_trials)
```

Default:

```text
target_recovery_trials = 150
```

## 12.4 Mixed-wrapper stability

```text
MixedStability =
min(1, X_mix / mean(X_A_recent, X_B_recovered))
```

## 12.5 Delayed retention

```text
DelayedRetention =
min(1, X_delayed_mix / X_mix_immediate)
```

---

# 13. Scores and outputs

## 13.1 Canonical user-facing score

Use the public label:

```text
Attention Control
```

 ## 13.2 Internal metrics

```ts
type CCCEstimate = {
  user_id: string;
  session_id: string;
  measure_id: string;

  public_label: "Attention Control";

  technical_label:
    | "ACC_absolute"
    | "ACC_relational"
    | "ACC_wrapper_recovery"
    | "ACC_mixed_stability"
    | "ACC_transfer_probe";

  model_id:
    | "mftm_grouping_search"
    | "adaptive_mftm_grouping_search"
    | "relational_grouping_search_extension"
    | "sigmoid_fallback";

  model_version: string;

  evidence_tier:
    | "adapted_published_model"
    | "principled_extension"
    | "internal_calibration"
    | "research_probe"
    | "engineering_fallback";

  wrapper_id?: CCCWrapperId;

  theta_estimate: number;
  objective_capacity_bits_per_sec: number;
  standard_error: number;

  p0: number;
  p_guess: number;
  lapse_rate: number;

  entropy_table_version: string;
  estimator_method:
    | "maximum_likelihood"
    | "posterior_grid"
    | "bootstrap"
    | "fallback_sigmoid";

  confidence_label:
    | "insufficient data"
    | "calibrating"
    | "moderate confidence"
    | "high confidence"
    | "timing limited"
    | "unstable estimate";

  trial_count: number;
  valid_trial_count: number;

  timing_quality: "good" | "acceptable" | "limited";

  frame_cost?: number;
  frame_efficiency?: number;

  switch_cost?: number;
  recovery_ratio?: number;
  recovery_efficiency?: number;
  mixed_stability?: number;
  delayed_retention?: number;

  created_at: string;
};
```

---

## 13.3 Score definitions

```text
ACC_absolute:
weighted capacity across arrow_abs_lr and arrow_abs_ud

ACC_relational:
weighted capacity across arrow_rel_inout and arrow_rel_cwccw

Frame Cost:
ACC_absolute - ACC_relational

Frame Efficiency:
ACC_relational / ACC_absolute

Wrapper Recovery:
recovery after wrapper switch

Mixed-Wrapper Stability:
performance under unpredictable wrapper mixing
```

Weights should depend on:

```text
trial count
recency
standard error
timing quality
confidence label
```

---

# 14. Colour handling

Colour should be treated carefully.

## 14.1 CCC-Core

```text
colour = absent
```

or:

```text
colour = irrelevant, unscored
```

Do not ask:

```text
Were most blue arrows out?
```

in the canonical CCC score.

That becomes a conjunction-extraction task and starts to overlap with Binding Memory.

## 14.2 CCC-Transfer lure

Later, colour may be introduced as an irrelevant distractor:

```text
same majority relation, mixed colours
response should ignore colour
```

Log:

```text
colour_lure_present = true
colour_lure_type = irrelevant_feature
```

But do not include colour in the scoring target.

## 14.3 Binding layer

Colour becomes scored here:

```text
relation × colour
relation × colour × context
```

This protects construct validity:

```text
CCC = extract the signal relation
Binding Memory = remember what belongs with what
Path Prediction = learn what follows from bound states
Reasoning = infer what follows explicitly
```

---

# 15. Carrier handling

## 15.1 Arrows

Use arrows for canonical CCC.

Reasons:

```text
fast rendering
clean binary opposites
strong timing control
simple masking
direct majority extraction
easy psychometric interpretation
```

## 15.2 Optic flow

Use optic flow for later transfer probes, not initial canonical scoring.

Good optic-flow CCC probes:

```text
left / right translation
up / down translation
expansion / contraction
clockwise / anticlockwise rotation
```

Initial output:

```text
optic_flow_switch_cost
optic_flow_recovery_ratio
optic_flow_mixed_stability
```

Only pool optic-flow into Attention Control after enough calibration.

## 15.3 Gabor

Use Gabor only if needed as a research wrapper.

Possible Gabor probes:

```text
horizontal / vertical orientation
low / high spatial frequency
radial / tangential alignment
```

Do not require Gabor for the commercial v1 unless it improves validation.

---

# 16. Session structure

## 16.1 Quick demo session

Duration:

```text
3–5 minutes
```

Structure:

```text
tutorial
8–12 arrow_abs_lr trials
8–12 arrow_abs_ud trials
8–12 arrow_rel_inout trials
8–12 arrow_rel_cwccw trials
simple provisional profile
```

Output:

```text
Attention Control: provisional
Absolute extraction: calibrating
Relational extraction: calibrating
Frame Cost: demo only
```

## 16.2 Standard training block

Duration:

```text
3 minutes inside the full 15–20 minute IQ Coach session
```

Structure:

```text
1 min current anchor wrapper
1 min active transfer/recovery wrapper
1 min mixed or calibration trials
```

## 16.3 Benchmark session

Every:

```text
5–7 sessions
```

Include:

```text
all four canonical CCC wrappers
mixed absolute/relational block
delayed re-check items
lure-controlled block if enabled
```

---

# 17. Database tables

Minimum Supabase tables:

```text
iqc_ccc_wrapper_configs
iqc_ccc_entropy_table
iqc_trial_logs
iqc_capacity_estimates
iqc_horizontal_cycle_state
iqc_timing_quality_logs
```

## 17.1 `iqc_ccc_wrapper_configs`

```sql
create table iqc_ccc_wrapper_configs (
  wrapper_id text primary key,
  carrier text not null,
  frame text not null,
  axis text not null,
  polarity_a text not null,
  polarity_b text not null,
  response_label_a text not null,
  response_label_b text not null,
  canonical boolean not null default false,
  evidence_tier text not null,
  config_version text not null,
  active boolean not null default true,
  created_at timestamptz default now()
);
```

## 17.2 `iqc_ccc_entropy_table`

```sql
create table iqc_ccc_entropy_table (
  entropy_id uuid primary key default gen_random_uuid(),
  set_size int not null,
  majority_ratio text not null,
  h_majority_bits numeric not null,
  table_version text not null,
  active boolean not null default true,
  created_at timestamptz default now()
);
```

## 17.3 `iqc_horizontal_cycle_state`

```sql
create table iqc_horizontal_cycle_state (
  cycle_id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  layer text not null,
  current_wrapper_id text not null,
  previous_wrapper_id text,
  phase text not null,
  active_wrapper_ids text[] not null,
  last_switch_at timestamptz,
  last_mix_started_at timestamptz,
  delayed_recheck_due_at timestamptz,
  state_json jsonb not null default '{}',
  updated_at timestamptz default now()
);
```
## 17.4 `iqc_ccc_model_versions`

```sql
create table iqc_ccc_model_versions (
  model_version_id uuid primary key default gen_random_uuid(),
  model_id text not null,
  model_version text not null,
  entropy_table_version text not null,
  estimator_method text not null,
  p0_strategy text not null,
  lapse_strategy text not null,
  prior_json jsonb not null default '{}',
  notes text,
  active boolean not null default true,
  created_at timestamptz default now()
);
```

## 17.5 `iqc_ccc_trial_model_fields`

If trial logs are generic, ensure the following fields are included in trial metadata:

```sql
alter table iqc_trial_logs
add column if not exists p_group numeric,
add column if not exists n_size int,
add column if not exists n_maj int,
add column if not exists n_con int,
add column if not exists h_majority_bits numeric,
add column if not exists r_trial_bps numeric,
add column if not exists entropy_table_version text,
add column if not exists et_adjusted_seconds numeric,
add column if not exists model_relevant boolean default true;
```

 ---

# 18. Build order

 ## Phase 1 — Canonical arrow CCC

```text
1. Wrapper config table
2. Entropy table with N_size, N_maj, N_con, P_group and H_majority_bits
3. Arrow vector renderer
4. Octagon position generator
5. Mask renderer
6. Trial runner
7. Keyboard/touch response handler
8. Timing logger
9. Raw trial logging
10. Basic correctness feedback
11. Grouping-search likelihood scorer
12. Server-side canonical C_hat estimate
13. Confidence labels and standard error
14. Result screen
```

## Phase 2 — Four orthogonal wrappers

```text
15. arrow_abs_lr
16. arrow_abs_ud
17. arrow_rel_inout
18. arrow_rel_cwccw
19. radial/tangential geometry tests
20. wrapper-specific grouping-search estimates
21. Frame Cost
22. Frame Efficiency
```

## Phase 3 — Adaptive selector

```text
23. posterior grid or ML estimate
24. expected information value selector
25. target-band condition selection
26. timing-quality gates
27. lapse-rate gates
28. fallback sigmoid only for debug / emergency display
```

## Phase 4 — Horizontal controller

```text
29. learning-curve windows
30. flattening detection
31. wrapper-switch rule
32. recovery detection
33. mixed-wrapper blocks
34. delayed re-check schedule
35. wrapper recovery metrics
36. mixed-wrapper stability metrics
```

## Phase 5 — Full app integration

```text
37. Attention Control score card
38. bottleneck dashboard feed
39. relation-token handoff to Relational Memory
40. benchmark session support
41. server-side canonical scoring
42. model versioning
43. confidence labels
44. calibration export
```

## Phase 6 — Transfer probes

```text
45. optic-flow renderer
46. optic-flow wrapper configs
47. carrier switch cost
48. carrier recovery ratio
49. optional Gabor research wrappers
50. calibration review
```

---
---

# 19. Acceptance tests

## 19.1 Geometry tests

```text
left/right arrows render correctly
up/down arrows render correctly
out arrows point away from centre
in arrows point towards centre
clockwise tangential arrows follow screen convention
anticlockwise tangential arrows follow screen convention
```

## 19.2 Trial-generation tests

```text
each trial has exactly 5 arrows
positions are sampled from 8 possible locations
majority ratios are correct
correct response equals generated majority polarity
mask appears at the correct item positions
```

## 19.3 Timing tests

```text
actual frame count is logged
actual exposure is computed from frame count
dropped frames are detected
timing-limited trials are excluded from high-confidence fitting
```

## 19.4 Scoring tests

```text
entropy values come from the config table
P_group is computed correctly from N_size, N_maj and N_con
H_majority_bits = log2(N_maj / P_group)
R_trial_bps = H_majority_bits / ET_adjusted_seconds
grouping-search predicted accuracy is deterministic
maximum-likelihood C_hat is recoverable in simulation
posterior SD / SE decreases with more valid trials
p_guess = 0.50 for two-choice trials
p0 strategy is versioned
lapse adjustment is applied consistently
sigmoid fallback is not used as the canonical scientific estimate
wrapper-specific estimates are separate
absolute and relational scores are not pooled prematurely
Frame Cost is not shown until sufficient data exists
timing-limited trials are excluded from high-confidence fitting
server-side estimate is canonical
```

## 19.5 Horizontal transfer tests

```text
wrapper does not switch before minimum valid trials
wrapper does not switch when timing quality is limited
wrapper switches after flattening
new wrapper starts easier
initial dip is logged
recovery ratio is computed
mixed-wrapper block begins only after recovery
delayed re-check is scheduled
```

## 19.6 Claims tests

Public copy must not say:

```text
IQ score
diagnosis
flow detection
brain-state detection
guaranteed transfer
proven IQ increase
```
## 19.7 Simulation recovery tests

Before production scoring is trusted, run synthetic-data tests.

Required simulations:

```text
Generate synthetic users with known C values:
C = 1, 2, 3, 4, 5, 6 bps

Generate trials across:
5:0
4:1
3:2
multiple exposure durations

Simulate responses using the grouping-search model.

Fit C_hat from the simulated responses.

Check whether:
C_hat recovers the true C within acceptable tolerance
SE decreases as trial count increases
lapse inflation lowers confidence
timing-limited trials degrade confidence
short demo sessions remain labelled provisional
```

Acceptance criterion:

```text
The estimator must recover monotonic rank ordering of simulated users
before it is used for public-facing progress claims.
```

---

# 20. Final implementation principle

The CCC component should answer one clean question:

```text
How efficiently can the user extract the relevant relation from brief noisy evidence?
```

It should not answer:

```text
Can the user bind colour?
Can the user remember relations over delay?
Can the user predict future states?
Can the user reason explicitly?
```

Those are later layers.

Maximum transfer is achieved not by stuffing every stimulus dimension into CCC, but by:

```text
clean canonical measurement
→ orthogonal wrapper progression
→ dip-and-recovery tracking
→ mixed-wrapper stability
→ delayed re-check
→ vertical handoff into Relational Memory, Binding Memory, Path Prediction and Reasoning
```

In compact form:

```text
CCC extracts the relation.
Relational Memory holds it.
Binding Memory preserves conjunctions.
Path Prediction learns where it leads.
Reasoning explains what follows.
Transfer tests whether it survives change.
```


 

 
 

# Add Section 19.7: Simulation recovery tests


---


# Updated final implementation summary

The production MVP should implement:

```text
brief Direction Bandwidth
+
brief Frame Bandwidth
```

using:

```text
five-arrow masked majority displays
adaptive ratio / exposure selection
full grouping-search likelihood scoring
fixed or estimated p0
p_guess = .50
lapse adjustment
ET_actual / tau_eff timing correction
separate C_abs and C_rel estimates
rolling multi-session posterior estimates
conservative confidence labels
evidence-safe reporting
```

The most important scoring rule is:

```text
Do not make H / ET the score.

H / ET defines trial demand.
C_hat is the fitted capacity parameter.
```

The most important product rule is:

```text
Do not make the single short block carry the scientific claim.

The rolling estimate is the product score.
```

The clean product promise is:

```text
Measure controlled evidence extraction briefly.
Track it across sessions.
Separate standard direction extraction from experimental relational frame extraction.
Test whether the trained relation survives wrapper change.
Show progress only when the data are stable enough.
```

