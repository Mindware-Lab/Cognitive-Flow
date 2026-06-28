

### 1. **Experiment Factory Attention Network Test — MIT licence**

This is the most suitable ready-made MIT-licensed option I found:

**Repository:** `expfactory-experiments/attention-network-test`
**Licence:** MIT
**Why useful:** ready web experiment, attention-specific, established paradigm, directly relevant to executive attention/conflict control.

The GitHub page states that it is an “attention network test, derived from the attention network task” and shows an MIT licence. ([GitHub][2])

I would use it like this:

```text
Pre-training ANT
→ Attention Coach / CCC training block over 10–20 sessions
→ Post-training ANT
→ Follow-up ANT after delay
```

Key outcome variables:

```text
ANT executive conflict effect
ANT alerting effect
ANT orienting effect
overall RT
accuracy / error rate
RT variability
```

For your purposes, the **executive conflict effect** is probably the main external criterion, because it is closest to your attention-control construct. Alerting and orienting are useful secondary checks, especially for distinguishing true attention-control change from general vigilance or arousal shifts.

 

### 2. **jsSART — Sustained Attention to Response Task — MIT licence**

This is a customisable SART built with jsPsych, archived but MIT-licensed. The repo describes it as a “customizable Sustained Attention to Response Task” built with jsPsych, and the licence is listed as MIT. ([GitHub][3])

Use it if you want to test:

```text
sustained attention
lapses
commission errors
RT variability
fatigue sensitivity
```

The original SART literature is strong for sustained attention: Robertson et al. describe it as withholding keypresses to rare targets, and later work found it predictive of everyday attentional failures/action slips. ([PubMed][4])

For Attention Coach, SART is useful as a **state/lapse benchmark**, but it is less directly matched to the CCC mechanism than ANT or flanker.

 

Licence note: MIT is commercially friendly, but you should preserve the licence/copyright notices and check bundled dependencies/assets before shipping. This is especially important for older jsPsych/Experiment Factory code.

[1]: https://pubmed.ncbi.nlm.nih.gov/11970796/?utm_source=chatgpt.com "Testing the efficiency and independence of attentional ..."
[2]: https://github.com/expfactory-experiments/attention-network-test "GitHub - expfactory-experiments/attention-network-test: The attention network test, derived from the attention network task · GitHub"
[3]: https://github.com/shamrt/jsSART "GitHub - shamrt/jsSART: A customizable Sustained Attention to Response Task (SART; described in Robertson et al, 1997) measure, built with jsPsych. · GitHub"
[4]: https://pubmed.ncbi.nlm.nih.gov/9204482/?utm_source=chatgpt.com "performance correlates of everyday attentional failures in ..."
[5]: https://github.com/jspsych/jspsych-timelines "GitHub - jspsych/jspsych-timelines: Shareable, configurable timelines for jsPsych experiments · GitHub"
[6]: https://pmc.ncbi.nlm.nih.gov/articles/PMC11335792/?utm_source=chatgpt.com "Implementation of an online spacing flanker task and ... - PMC"
[7]: https://github.com/vekteo/GoNoGo_jsPsych "GitHub - vekteo/GoNoGo_jsPsych: This repository contains a Go/No-Go Task developed with jsPsych, based on the implementation by Bezdjian et al. (2009). The task is designed to measure response inhibition and cognitive control. · GitHub"

# Developer Specs

 I would specify the **15-minute benchmark** as:

```text
Short ANT:
32 practice trials
128 scored trials

SART:
18 practice trials
225 scored trials

Total scored trials:
353
```

This gives a reasonable applied benchmark while keeping the ANT caveat clear: the 10-minute ANT is acceptable for **RT and broad attention benchmarking**, but the three ANT network scores are less reliable than the full 288-trial version because they are difference scores. Weaver et al. found high correspondence for RT measures in a 10-minute ANT, but weaker correspondence for alerting, orienting and conflict network scores. ([PubMed][1])

## Developer outline

### A. Short ANT module

Use the Experiment Factory ANT as the licence-compatible base; the repository describes it as an Attention Network Test derived from the attention network task and lists an MIT licence. ([GitHub][2])

#### Recommended short configuration

```ts
const ANT_SHORT_CONFIG = {
  task_id: "ant_short_10min",
  practice_trials: 32,
  scored_trials: 128,
  blocks: 2,
  trials_per_block: 64,

  cue_types: [
    "no_cue",
    "centre_cue",
    "double_cue",
    "spatial_cue"
  ],

  flanker_types: [
    "congruent",
    "incongruent"
  ],

  target_locations: [
    "above_fixation",
    "below_fixation"
  ],

  target_directions: [
    "left",
    "right"
  ],

  repetitions_per_cell: 4,

  response_keys: {
    left: "ArrowLeft",
    right: "ArrowRight"
  },

  practice_feedback: true,
  scored_feedback: false
};
```

This gives:

```text
4 cue types
× 2 flanker types
× 2 target locations
× 2 target directions
× 4 repetitions
= 128 scored trials
```

The full original ANT used **24 practice trials** followed by **3 × 96 scored trials = 288 scored trials**; each original experimental block contained 96 trials from the full factorial design. ([w3.ual.es][3]) A common online implementation likewise uses 24 practice trials and 3 blocks of 96, with a total time around 25 minutes including instructions. ([psytoolkit.org][4])

For your 10-minute version, I would use the **128-trial short version** rather than trying to preserve the full 288-trial design. A recent short ANT implementation used **2 blocks of 64 trials = 128 total trials**, with cue and flanker types presented equiprobably. ([Springer][5])

#### ANT scoring fields

```ts
type AntTrial = {
  trial_index: number;
  block_index: number;
  is_practice: boolean;

  cue_type: "no_cue" | "centre_cue" | "double_cue" | "spatial_cue";
  flanker_type: "congruent" | "incongruent";
  target_location: "above_fixation" | "below_fixation";
  target_direction: "left" | "right";

  response: "left" | "right" | null;
  correct_response: "left" | "right";
  is_correct: boolean;
  rt_ms: number | null;

  too_fast: boolean;      // e.g. rt < 200 ms
  timeout: boolean;
  excluded: boolean;
};
```

#### ANT summary scores

Use **median RT on correct scored trials**.

```ts
const antScores = {
  mean_rt_correct_ms,
  median_rt_correct_ms,
  accuracy,

  conflict_cost_ms:
    median_rt_incongruent_correct - median_rt_congruent_correct,

  alerting_benefit_ms:
    median_rt_no_cue_correct - median_rt_double_cue_correct,

  orienting_benefit_ms:
    median_rt_centre_cue_correct - median_rt_spatial_cue_correct,

  conflict_accuracy_cost:
    accuracy_congruent - accuracy_incongruent,

  alerting_accuracy_benefit:
    accuracy_double_cue - accuracy_no_cue,

  orienting_accuracy_benefit:
    accuracy_spatial_cue - accuracy_centre_cue
};
```

For the short version, I would label:

```text
Executive / conflict: moderate confidence
Alerting: calibrating
Orienting: calibrating
Overall ANT RT: moderate confidence
```

Do not overclaim alerting/orienting change from one short session.

---

### B. SART module

Use `jsSART` as the licence-compatible base if you want a jsPsych implementation; the repository states that it is a customisable SART built with jsPsych and lists an MIT licence. ([GitHub][6])

#### Recommended SART configuration

```ts
const SART_CONFIG = {
  task_id: "sart_4_3min",
  practice_trials: 18,
  scored_trials: 225,

  stimulus_set: ["1", "2", "3", "4", "5", "6", "7", "8", "9"],
  no_go_digit: "3",

  go_trials: 200,
  no_go_trials: 25,

  digit_duration_ms: 250,
  mask_or_blank_duration_ms: 900,
  soa_ms: 1150,

  response_key: "Space",
  response_rule: "press_for_every_digit_except_3",

  practice_feedback: true,
  scored_feedback: false,

  randomisation: {
    mode: "random_constrained",
    min_no_go_distance: 5,
    max_no_go_distance: 12
  }
};
```

A standard open SART material uses **225 trials plus 18 practice trials**, with each number shown for **250 ms** followed by a **900 ms mask**. ([Gorilla][7]) That gives:

```text
225 × 1150 ms = 258.75 seconds
= 4.31 minutes
```

#### SART scoring fields

```ts
type SartTrial = {
  trial_index: number;
  is_practice: boolean;

  digit: "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9";
  trial_type: "go" | "no_go";

  response_made: boolean;
  rt_ms: number | null;

  is_correct: boolean;
  error_type:
    | "none"
    | "commission"   // pressed on no-go
    | "omission"     // failed to press on go
    | "too_fast"
    | "timeout";

  excluded: boolean;
};
```

#### SART summary scores

```ts
const sartScores = {
  go_accuracy,
  no_go_accuracy,

  commission_error_rate,  // false alarms on no-go trials
  omission_error_rate,    // missed go responses

  mean_go_rt_ms,
  median_go_rt_ms,
  sd_go_rt_ms,
  coefficient_of_variation_rt,

  very_fast_response_rate, // e.g. rt < 150 or 200 ms
  slow_lapse_rate,         // e.g. rt > user/task threshold

  post_error_slowing_ms,
  time_on_task_slope_rt,
  time_on_task_slope_errors
};
```

For Attention Coach, the most useful SART metrics are:

```text
commission error rate
omission rate
RT variability
time-on-task worsening
very fast anticipatory responses
```

---

## Full benchmark structure

```ts
const ATTENTION_BENCHMARK_15MIN = {
  id: "attention_benchmark_ant_sart_v1",

  modules: [
    {
      module: "ANT_SHORT",
      practice_trials: 32,
      scored_trials: 128,
      estimated_duration_min: 9.5
    },
    {
      module: "SART",
      practice_trials: 18,
      scored_trials: 225,
      estimated_duration_min: 4.3
    }
  ],

  total_practice_trials: 50,
  total_scored_trials: 353,
  estimated_total_duration_min: 14.5,

  include_break_between_modules: true,
  break_duration_sec: 30
};
```

## Composite scoring

Use separate subscores first, then an exploratory composite.

```ts
const attentionBenchmarkScores = {
  executive_control: z_reverse(ant.conflict_cost_ms),

  alerting: z_positive(ant.alerting_benefit_ms),

  orienting: z_positive(ant.orienting_benefit_ms),

  sustained_stability: mean([
    z_reverse(sart.commission_error_rate),
    z_reverse(sart.omission_error_rate),
    z_reverse(sart.coefficient_of_variation_rt)
  ]),

  attention_benchmark_composite: weightedMean({
    executive_control: 0.40,
    sustained_stability: 0.35,
    alerting: 0.15,
    orienting: 0.10
  })
};
```

User-facing labels:

```text
Executive Attention
Sustained Stability
Alerting
Orienting
Attention Benchmark Composite
```

Confidence labels:

```ts
if (ant.scored_valid_trials < 100) ant_confidence = "insufficient";
else ant_confidence = "calibrating";

if (sart.valid_go_trials < 160 || sart.valid_no_go_trials < 20)
  sart_confidence = "insufficient";
else
  sart_confidence = "moderate";
```

## Recommended final developer instruction

Build the default benchmark as:

```text
ANT short:
32 practice + 128 scored

SART:
18 practice + 225 scored

Total:
50 practice + 353 scored
```

Show the composite only as an **external attention benchmark**, not as the Attention Coach training score itself. Keep the ANT network scores cautious, especially alerting and orienting, and treat SART as the main sustained-attention/lapse-stability component.

[1]: https://pubmed.ncbi.nlm.nih.gov/24205860/ "Evaluation of a 10-minute version of the Attention Network Test - PubMed"
[2]: https://github.com/expfactory-experiments/attention-network-test "GitHub - expfactory-experiments/attention-network-test: The attention network test, derived from the attention network task · GitHub"
[3]: https://w3.ual.es/personal/tdaza/Fan%20y%20cols.pdf "Testing the Efficiency and Independence of Attentional Networks"
[4]: https://psytoolkit.org/experiment-library/ant.html "Attention Network Test (ANT)"
[5]: https://link.springer.com/article/10.1186/s41235-025-00676-9 "The sonic energy of background music impacts cognitive performances: a behavioral and physiological investigation | Cognitive Research: Principles and Implications | Springer Nature Link"
[6]: https://github.com/shamrt/jsSART "GitHub - shamrt/jsSART: A customizable Sustained Attention to Response Task (SART; described in Robertson et al, 1997) measure, built with jsPsych. · GitHub"


# Standardised Scores

I would implement **standardised scores from day 1**, but label them as **provisional calibration scores** until your own sample is large enough. The attached test plan already gives the two-test battery: **Short ANT: 32 practice + 128 scored trials** and **SART: 18 practice + 225 scored trials**, using MIT-licensed Experiment Factory ANT and jsSART sources. 

The key product rule is: show a score immediately, but never imply it is an official general-population norm until calibration supports it. Your IQ Coach spec already requires confidence labels, server-side canonical scoring, raw-trial preservation, norm-group IDs, standard scores where supported, and fallback bands when calibration is weak. 

## Developer spec: Standardised Attention Benchmark v1

### 1. Public score names

Use these user-facing scores:

```ts
type AttentionBenchmarkPublicScore =
  | "Executive Attention"
  | "Sustained Stability"
  | "Alerting"
  | "Orienting"
  | "Attention Benchmark Composite";
```

Internal metric names:

```ts
type AttentionBenchmarkMetric =
  | "ant_conflict_cost_ms"
  | "ant_alerting_benefit_ms"
  | "ant_orienting_benefit_ms"
  | "ant_median_rt_correct_ms"
  | "ant_accuracy"
  | "sart_commission_error_rate"
  | "sart_omission_error_rate"
  | "sart_go_rt_cv"
  | "sart_median_go_rt_ms"
  | "sart_time_on_task_error_slope"
  | "attention_executive_z"
  | "attention_sustained_z"
  | "attention_composite_z";
```

### 2. Norming principle from launch

From launch, scores should be standardised against a **versioned seed norm table**.

```text
Launch state:
standardised against seed calibration table

After n ≥ 100 valid users:
standardised against IQ Mindware provisional sample norm

After n ≥ 300:
moderate-confidence sample norm

After n ≥ 1000:
stronger sample norm, still not “official population norm”
```

User-facing wording at launch:

```text
Standard score: 102
Confidence: provisional calibration
This score is standardised against the current IQ Mindware calibration table and will become more precise as more users complete the benchmark.
```

Avoid:

```text
General population IQ-style attention score
Official percentile
Clinical attention score
Diagnostic attention result
```

### 3. Database tables

#### `attention_benchmark_attempts`

```sql
create table attention_benchmark_attempts (
  attempt_id uuid primary key default gen_random_uuid(),
  user_id uuid,
  benchmark_version text not null,
  ant_version text not null,
  sart_version text not null,
  status text not null check (status in ('started', 'submitted', 'scored', 'void', 'duplicate')),
  idempotency_key text unique not null,
  started_at timestamptz default now(),
  submitted_at timestamptz,
  scored_at timestamptz,

  device_class text,
  input_method text,
  browser text,
  viewport_width int,
  viewport_height int,
  device_pixel_ratio numeric,
  refresh_rate_estimate numeric,
  timing_quality text
);
```

#### `attention_benchmark_trials`

```sql
create table attention_benchmark_trials (
  trial_id uuid primary key default gen_random_uuid(),
  attempt_id uuid references attention_benchmark_attempts(attempt_id),
  user_id uuid,

  task text not null check (task in ('ANT_SHORT', 'SART')),
  trial_index int not null,
  block_index int,
  is_practice boolean not null default false,

  -- ANT fields
  cue_type text,
  flanker_type text,
  target_location text,
  target_direction text,

  -- SART fields
  digit text,
  trial_type text,

  response text,
  correct_response text,
  response_made boolean,
  is_correct boolean,
  rt_ms numeric,

  error_type text,
  too_fast boolean default false,
  timeout boolean default false,
  excluded boolean default false,

  exposure_ms_requested numeric,
  exposure_ms_actual numeric,
  timing_quality text,
  created_at timestamptz default now()
);
```

#### `attention_norm_groups`

```sql
create table attention_norm_groups (
  norm_group_id uuid primary key default gen_random_uuid(),

  benchmark_version text not null,
  metric_name text not null,

  source_type text not null check (
    source_type in (
      'seed_calibration',
      'iqmindware_sample',
      'research_sample',
      'partner_sample'
    )
  ),

  age_band text not null default 'all_16_plus',
  device_class text not null default 'all',
  input_method text not null default 'all',
  language text not null default 'en',
  training_exposure_band text not null default 'untrained_or_unknown',

  n_valid int not null,
  mean numeric not null,
  sd numeric not null,
  median numeric,
  mad numeric,

  direction text not null check (direction in ('higher_better', 'lower_better')),
  norm_confidence text not null check (
    norm_confidence in (
      'seed',
      'sample_calibration',
      'provisional',
      'moderate',
      'strong'
    )
  ),

  created_at timestamptz default now(),
  retired_at timestamptz
);
```

#### `attention_benchmark_scores`

```sql
create table attention_benchmark_scores (
  score_id uuid primary key default gen_random_uuid(),
  attempt_id uuid references attention_benchmark_attempts(attempt_id),
  user_id uuid,

  benchmark_version text not null,
  metric_name text not null,
  public_label text not null,

  raw_score numeric,
  z_score numeric,
  standard_score numeric,
  percentile numeric,

  norm_group_id uuid references attention_norm_groups(norm_group_id),
  norm_source_type text,
  norm_confidence text,

  standard_error numeric,
  confidence_label text not null,

  valid_trial_count int,
  excluded_trial_count int,
  timing_quality text,

  created_at timestamptz default now()
);
```

### 4. Seed norm table

Create a frozen v0 seed table before launch. This should be editable only by migration, never silently updated.

```ts
type SeedNormMetric = {
  metric_name: AttentionBenchmarkMetric;
  mean: number;
  sd: number;
  direction: "higher_better" | "lower_better";
  source_note: string;
  norm_confidence: "seed";
};
```

Use seed norms only for standard-score display. They are not validation evidence.

```ts
const SEED_NORM_POLICY = {
  label: "provisional calibration",
  allow_standard_score: true,
  allow_percentile: false,
  allow_population_claim: false
};
```

At launch, show:

```text
Standard score: 102
Confidence: provisional calibration
```

Do not show:

```text
72nd percentile
```

until sample norm group n ≥ 100.

### 5. Metric direction rules

Lower is better:

```ts
const LOWER_BETTER = [
  "ant_conflict_cost_ms",
  "ant_median_rt_correct_ms",
  "sart_commission_error_rate",
  "sart_omission_error_rate",
  "sart_go_rt_cv",
  "sart_median_go_rt_ms",
  "sart_time_on_task_error_slope"
];
```

Higher is better:

```ts
const HIGHER_BETTER = [
  "ant_alerting_benefit_ms",
  "ant_orienting_benefit_ms",
  "ant_accuracy"
];
```

For ANT alerting and orienting, allow standard scores but use low confidence until enough data accumulates.

### 6. Standard-score conversion

```ts
function computeZ(raw: number, normMean: number, normSd: number, direction: "higher_better" | "lower_better") {
  if (!Number.isFinite(raw) || !Number.isFinite(normMean) || !Number.isFinite(normSd) || normSd <= 0) {
    return null;
  }

  return direction === "higher_better"
    ? (raw - normMean) / normSd
    : (normMean - raw) / normSd;
}

function zToStandardScore(z: number) {
  return 100 + 15 * z;
}
```

Clamp only for display, not storage:

```ts
function displayStandardScore(score: number) {
  return Math.round(Math.max(55, Math.min(145, score)));
}
```

Store the unclamped standard score.

### 7. ANT scoring

Use correct scored trials only.

```ts
const antRawScores = {
  ant_median_rt_correct_ms,
  ant_accuracy,

  ant_conflict_cost_ms:
    medianRt("incongruent") - medianRt("congruent"),

  ant_alerting_benefit_ms:
    medianRt("no_cue") - medianRt("double_cue"),

  ant_orienting_benefit_ms:
    medianRt("centre_cue") - medianRt("spatial_cue")
};
```

Exclusion rules:

```ts
const ANT_EXCLUSION_RULES = {
  exclude_practice: true,
  exclude_incorrect_for_rt: true,
  too_fast_ms: 200,
  timeout_ms: 1700,
  min_valid_trials_total: 100,
  min_valid_trials_per_conflict_cell: 40,
  min_valid_trials_per_cue_cell: 20
};
```

Confidence:

```ts
function antConfidence(validTrials: number, timingQuality: string) {
  if (validTrials < 100) return "insufficient data";
  if (timingQuality === "limited") return "timing limited";
  return "calibrating";
}
```

### 8. SART scoring

Use scored trials only.

```ts
const sartRawScores = {
  sart_commission_error_rate:
    noGoPresses / validNoGoTrials,

  sart_omission_error_rate:
    missedGoTrials / validGoTrials,

  sart_median_go_rt_ms:
    median(goCorrectRt),

  sart_go_rt_cv:
    sd(goCorrectRt) / mean(goCorrectRt),

  sart_time_on_task_error_slope:
    slope(errorRateByQuintile)
};
```

Exclusion rules:

```ts
const SART_EXCLUSION_RULES = {
  exclude_practice: true,
  too_fast_ms: 150,
  min_valid_go_trials: 160,
  min_valid_no_go_trials: 20,
  max_missing_rate: 0.35
};
```

Confidence:

```ts
function sartConfidence(validGo: number, validNoGo: number, timingQuality: string) {
  if (validGo < 160 || validNoGo < 20) return "insufficient data";
  if (timingQuality === "limited") return "timing limited";
  return "moderate confidence";
}
```

### 9. Subscale computation

Compute metric z-scores first.

```ts
const executiveAttentionZ = meanFinite([
  z("ant_conflict_cost_ms"),
]);

const sustainedStabilityZ = meanFinite([
  z("sart_commission_error_rate"),
  z("sart_omission_error_rate"),
  z("sart_go_rt_cv")
]);

const alertingZ = z("ant_alerting_benefit_ms");
const orientingZ = z("ant_orienting_benefit_ms");
```

Composite:

```ts
const attentionCompositeZ = weightedMeanFinite({
  executiveAttentionZ: 0.40,
  sustainedStabilityZ: 0.35,
  alertingZ: 0.15,
  orientingZ: 0.10
});
```

Minimum for composite:

```ts
const COMPOSITE_RULES = {
  require_executive_attention: true,
  require_sustained_stability: true,
  allow_missing_alerting_or_orienting: true,
  min_component_weight_available: 0.75
};
```

If alerting or orienting is missing/low-confidence, re-normalise weights over available components but mark composite confidence lower.

### 10. Public display rules from day 1

#### Launch / seed norm phase

```ts
if (norm.source_type === "seed_calibration") {
  showStandardScore = true;
  showPercentile = false;
  label = "provisional calibration";
}
```

Example:

```text
Executive Attention
Standard score: 101
Confidence: provisional calibration
```

#### Sample norm phase

```ts
if (norm.n_valid < 30) {
  showStandardScore = false;
  showBand = true;
  band = "calibrating";
}

if (norm.n_valid >= 30 && norm.n_valid < 100) {
  showStandardScore = true;
  showPercentile = false;
  label = "sample calibration";
}

if (norm.n_valid >= 100 && norm.n_valid < 300) {
  showStandardScore = true;
  showPercentile = true;
  label = "provisional sample norm";
}

if (norm.n_valid >= 300 && norm.n_valid < 1000) {
  showStandardScore = true;
  showPercentile = true;
  label = "moderate-confidence sample norm";
}

if (norm.n_valid >= 1000) {
  showStandardScore = true;
  showPercentile = true;
  label = "stronger sample norm";
}
```

This follows your existing norming ladder: no normed score below n = 30, sample calibration at 30–99, provisional sample norm from n ≥ 100, moderate confidence from n ≥ 300, and stronger sample norms from n ≥ 1000. 

### 11. Bands

Use bands alongside standard scores from launch.

```ts
function scoreBand(standardScore: number) {
  if (standardScore < 85) return "developing";
  if (standardScore < 115) return "standard";
  if (standardScore < 130) return "strong";
  return "advanced";
}
```

Launch display:

```text
Attention Benchmark Composite
Standard score: 104
Band: standard
Confidence: provisional calibration
```

### 12. Required score records per attempt

Each completed benchmark should generate these rows in `attention_benchmark_scores`:

```text
Executive Attention
Sustained Stability
Alerting
Orienting
Attention Benchmark Composite
```

Optional internal rows:

```text
ANT Conflict Cost
ANT Median RT
ANT Accuracy
SART Commission Error Rate
SART Omission Error Rate
SART RT Variability
```

### 13. Versioning

Every score must store:

```ts
type MeasurementModelRegistryEntry = {
  model_id: string;
  model_version: string;
  public_label: string;
  technical_label: string;
  evidence_tier:
    | "adapted_published_model"
    | "internal_calibration"
    | "exploratory_composite";

  unit: "standard_score_100_15" | "z_score" | "ms" | "error_rate";
  norm_source_type: "seed_calibration" | "iqmindware_sample";
  calibration_table_version: string;

  created_at: string;
  retired_at?: string;
};
```

Suggested mapping:

```ts
const MODEL_REGISTRY = [
  {
    model_id: "ant_short_conflict_v1",
    public_label: "Executive Attention",
    evidence_tier: "adapted_published_model"
  },
  {
    model_id: "sart_stability_v1",
    public_label: "Sustained Stability",
    evidence_tier: "adapted_published_model"
  },
  {
    model_id: "attention_composite_v1",
    public_label: "Attention Benchmark Composite",
    evidence_tier: "exploratory_composite"
  }
];
```

### 14. Backend scoring pipeline

```text
1. Client runs ANT + SART.
2. Client submits raw trial data.
3. Server validates attempt and timing metadata.
4. Server applies exclusion rules.
5. Server computes raw metrics.
6. Server selects best available norm group.
7. Server computes z and standard score.
8. Server assigns confidence label.
9. Server writes immutable score records.
10. Client displays server-returned canonical scores.
```

Your existing spec already states that client-side scores should be display-only, while the canonical estimate should be produced or verified server-side, with raw trials and derived estimates stored separately. 

### 15. Norm group selection

Priority order:

```ts
const NORM_GROUP_PRIORITY = [
  "age_band + device_class + input_method + language + untrained",
  "age_band + device_class + language + untrained",
  "age_band + input_method + language + untrained",
  "age_band + language + untrained",
  "all_16_plus + device_class + input_method + language",
  "all_16_plus + all_device + all_input + language",
  "seed_calibration"
];
```

Use the most specific group with sufficient `n_valid`.

### 16. Retest / practice-effect handling

Do not treat score increases as training gains unless the model accounts for retest exposure.

Add:

```sql
alter table attention_benchmark_attempts
add column benchmark_attempt_number int,
add column days_since_previous_attempt numeric,
add column training_sessions_since_previous_attempt int;
```

Later add retest-adjusted norms:

```ts
adjusted_z =
  observed_z - expected_retest_gain_z[attempt_number];
```

From launch, display change cautiously:

```text
Change since baseline: +5 standard-score points
Interpretation: provisional; short attention tasks can show practice effects.
```

### 17. User-facing copy

At launch:

```text
Your Attention Benchmark score is standardised against the current IQ Mindware calibration table. It is not a diagnosis or an official population percentile. The score will become more precise as the calibration sample grows.
```

After n ≥ 100:

```text
Your score is standardised against the current IQ Mindware sample for this benchmark version. Percentiles are provisional.
```

After n ≥ 1000:

```text
Your score is standardised against the current IQ Mindware sample for this benchmark version. This is still a training benchmark, not a clinical or official IQ test.
```

### 18. Acceptance tests

Developer tests should confirm:

```text
ANT raw metrics are computed only from correct scored trials.
SART commission and omission errors are computed from correct denominators.
Lower-better metrics reverse correctly before standardisation.
Seed norms produce a standard score but no percentile.
n < 30 sample norms do not show normed score.
n ≥ 100 sample norms allow provisional percentile.
Poor timing downgrades confidence.
Composite is hidden if executive or sustained components are missing.
Raw trials remain stored when score model versions change.
Derived scores are immutable by model version.
```

## Bottom line

Build standardised scores from the beginning using:

```text
Day 1:
Seed-calibration standard scores, no percentile

n ≥ 30:
sample calibration scores

n ≥ 100:
provisional sample standard scores + percentiles

n ≥ 300:
moderate-confidence sample norms

n ≥ 1000:
stronger sample norms, still labelled as IQ Mindware sample norms
```

That gives users the standardised feedback you need commercially, while keeping the measurement claims safe.

[7]: https://app.gorilla.sc/openmaterials/195760 "Gorilla"

