

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
[7]: https://app.gorilla.sc/openmaterials/195760 "Gorilla"

