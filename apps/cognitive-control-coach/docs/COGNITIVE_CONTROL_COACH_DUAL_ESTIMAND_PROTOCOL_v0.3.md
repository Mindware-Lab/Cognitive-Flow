# Cognitive Control Coach Dual-Estimand Protocol v0.3

Status: implementation contract for early-access P0 pilot

Date: 12 August 2026

App ID: `cognitive_control_coach`

Protocol version: `ccc-dual-estimand-v0.3`

Configuration version: `ccc-relative-pilot-v0.3`

Canonical route: `/cognitive-control-coach/`

## 1. Purpose and boundary

This protocol separates three questions that are presented as one consumer journey but must not be collapsed statistically:

1. **Signal — Attention Control:** how much competing majority-direction information can be resolved under protected, masked timing?
2. **Policy — Decision Fit:** how does viewing time and accuracy change with signal clarity, time cost and error cost?
3. **Transfer — Portability Progress:** does the relative In/Out decision survive a carrier change from radial arrows to expanding or contracting optic flow, recovery, return and mixing?

The app practises the same broad control loop shown in the Cognitive Stack:

> Find what matters → take in enough → make the call.

This theoretical loop does not permit the response contract of an established paradigm to be changed. All MFT-M-derived trials are forced choice. There is no voluntary Withhold or Not sure response.

## 2. Scientific status

The protected signal block is **MFT-M-derived**, not a literature-standard administration of the original MFT-M or the published CAT-based MFT-M-R.

- It retains backward masking, forced Left/Right majority classification, adaptive exposure and frame-level timing telemetry.
- It uses 24 observations and a transparent two-correct/one-error staircase over a fixed condition grid.
- The published adaptive MFT-M-R uses a calibrated computerised-adaptive-testing procedure and may administer up to 216 trials.
- The app estimate is therefore labelled **provisional** or **calibrating**. It must not be described as a validated clinical, diagnostic or literature-interchangeable CCC score without separate calibration and validation.

Relative arrows and relative optic flow are deliberate extensions of the majority-classification operator. Their transfer measures are app-specific and require empirical validation.

## 3. Reference-frame hierarchy

The main trained endpoint is relative relational control.

| Role | Static-arrow carrier | Motion carrier | Response |
| --- | --- | --- | --- |
| Familiarisation | absolute arrows | not used | Left / Right |
| Protected signal anchor | absolute arrows + mask | not used | Left / Right |
| Main policy training | radial arrows | not used | In / Out |
| Carrier transfer | radial arrows | contracting / expanding dot fields | In / Out latent relation; Contract / Expand visible motion labels |

For a radial arrow at location vector `r` with direction vector `v`:

- `OUT` when `dot(v, r) > 0`;
- `IN` when `dot(v, r) < 0`.

For optic flow:

- latent `IN` is displayed as **Contract**;
- latent `OUT` is displayed as **Expand**.

Lateral left/right optic flow is not part of the main guided journey. It may be retained only in separate familiarisation or validation work.

## 4. Session sequence

| Order | Phase | Wrapper | Estimand | Planned observations |
| ---: | --- | --- | --- | ---: |
| Practice | Learn the controls | `arrow_abs` | excluded | 4 valid forced choices |
| 1 | Signal anchor | `arrow_abs` + mask | signal capacity | 24 completed forced-choice or deadline observations |
| 2 | Relative stabilisation | `arrow_rel` | policy | 24 |
| 3 | Protected first contact | `flow_rel` | carrier transfer diagnostic | 12 |
| 4 | Motion recovery | `flow_rel` | transfer/recovery | 24 |
| 5 | Return | `arrow_rel` | return protection | 12 |
| 6 | Progressive mix | `arrow_rel` + `flow_rel` | portability | 24 |

The guided session contains 120 planned scored observations. Ninety-six (80%) use the relative In/Out operator.

## 5. Protected signal anchor

### 5.1 Trial contract

1. Fixation: 350 ms.
2. Five-arrow majority display: adaptive requested exposure.
3. Backward visual mask.
4. Forced Left/Right response, including when uncertain.
5. Response deadline after mask: 2,400 ms.
6. No points, niches or reward drain.

### 5.2 Adaptive grid

The initial level is `4:1` at 500 ms. Difficulty increases with two consecutive correct responses and decreases after an incorrect response or deadline omission.

| Level | Ratio | Requested exposure |
| ---: | --- | ---: |
| 0 | 5:0 | 1,500 ms |
| 1 | 5:0 | 1,000 ms |
| 2 | 4:1 | 1,000 ms |
| 3 | 4:1 | 700 ms |
| 4 | 4:1 | 500 ms |
| 5 | 3:2 | 700 ms |
| 6 | 3:2 | 500 ms |
| 7 | 3:2 | 300 ms |
| 8 | 3:2 | 200 ms |
| 9 | 3:2 | 150 ms |

The staircase is an efficient pilot mechanism, not the item-information algorithm used by MFT-M-R CAT.

### 5.3 Timing telemetry

Each signal trial records:

- requested exposure;
- actual exposure;
- actual stimulus frames;
- estimated refresh rate;
- timing-quality grade;
- response time measured from mask onset;
- adaptive level;
- ratio, response, correctness and deadline status.

Focus loss, abort or early invalidation is replaced with a deterministic equivalent trial. A timing-clean deadline omission is retained as incorrect and is not replaced.

### 5.4 Provisional signal estimate

For timing-clean observations, trial demand is:

```text
information bits for ratio / actual exposure seconds
```

with versioned pilot information values:

- `5:0 = 1.58 bits`;
- `4:1 = 2.91 bits`;
- `3:2 = 4.91 bits`.

A bounded psychometric curve with a 0.50 forced-choice floor and provisional lapse parameter is fitted after at least 16 valid observations. The displayed value is the estimated demand at 75% accuracy, rounded to 0.1 bits/second.

This estimate must remain labelled provisional until the short anchor is calibrated against a full MFT-M/MFT-M-R administration and its reliability is established.

## 6. Policy task

### 6.1 Trial contract

1. Fixation: 350 ms.
2. Relative stimulus remains visible.
3. Responses unlock after 350 ms.
4. Participant commits with the best forced choice by 4,000 ms.
5. Correct choices retain the remaining pot; incorrect choices incur the niche-specific loss.
6. Deadline omission receives zero points and remains an unresolved observation.

Viewing time is processing time on a continuously available array. It is not an objective count of independent evidence samples. Claims about sequential sampling require a later glimpse-based or temporally refreshed evidence design.

### 6.2 Two niches per session

One of two counterbalanced pairs is selected deterministically per session:

- Clear Sprint + Deep Check; or
- Calculated Risk + Clean Precision.

| Niche | Clarity quota per six trials | Correct pot | Error loss | Drain |
| --- | --- | ---: | ---: | ---: |
| Clear Sprint | 3 clear, 2 mixed, 1 close | +50 | -10 | 15 points/s |
| Calculated Risk | 1 clear, 2 mixed, 3 close | +50 | -10 | 15 points/s |
| Clean Precision | 3 clear, 2 mixed, 1 close | +10 | -50 | 2.5 points/s |
| Deep Check | 1 clear, 2 mixed, 3 close | +10 | -50 | 1.5 points/s |

The two target classes are balanced within every niche microcycle. Ratio quotas are constrained rather than left to random sampling. Niche order is counterbalanced from the session seed.

### 6.3 Policy estimands

The app records, but does not combine into a single validated score:

- accuracy by clarity (`5:0`, `4:1`, `3:2`);
- median decision time by niche and clarity;
- deadline-omission rate;
- realised points and percentage of available points retained;
- observed decision-time change between higher-error-cost and faster-drain conditions;
- wrapper, phase and transition effects.

Decision Fit is an observed within-session policy comparison. A positive time shift means the participant looked longer in the higher-error-cost condition; it does not by itself establish optimality. Optimal-policy or expected-regret claims require a separately fitted and held-out predictive policy model.

## 7. Transfer protection

The transfer controller preserves distinct evidence phases:

1. relative-arrow stabilisation;
2. Shift the View (score-neutral);
3. protected first contact with relative optic flow;
4. optic-flow recovery;
5. return to relative arrows;
6. mixed relative arrows and relative flow.

Only the first `arrow_rel → flow_rel` block has `strictCarrierTransferBoundary = true`. Recovery trials are never relabelled as first contact. First-contact results are diagnostic and excluded from ordinary progression credit.

Portability Progress reports performance within these trained formats. It is not far-transfer evidence and does not establish improvement in work, study, AI-assisted activity or everyday planning.

## 8. Block feedback contract

Every guided block has two feedback screens followed by a workflow bridge.

### Screen 1: headline reading

- signal block: patterns resolved, provisional signal rate, timing quality;
- policy/transfer block: best-choice accuracy, typical decision time, points kept.

### Screen 2: interpretable graphs

- accuracy by clarity: Clear, Mixed, Close;
- viewing time by the two session niches;
- observed time shift when mistakes cost more;
- plain-language explanation of what the comparison does and does not mean.

### Consumer labels

| Technical layer | Consumer label | Plain-language question |
| --- | --- | --- |
| protected capacity anchor | Attention Control signal | How much competing pattern could you resolve under brief viewing? |
| policy adjustment | Decision Fit | Did your viewing time and accuracy change with the demands? |
| trained carrier transfer | Portability Progress | Did the In/Out decision hold across arrows and motion? |

The workflow bridge gives a real-life application prompt but explicitly states that the app score does not measure real-life improvement.

## 9. Validity, replacement and exclusions

- **Answer:** valid forced-choice decision.
- **Deadline omission:** valid observation, incorrect/unresolved, not replaced.
- **Focus loss or abort:** invalid observation, replaced, excluded from scoring.
- **Policy response before 350 ms:** invalid observation, replaced.
- **Practice:** excluded from all estimands.
- **Signal anchor:** excluded from points, policy and transfer estimands.
- **First contact:** retained as diagnostic carrier-transfer evidence, excluded from ordinary progression.
- **Shift the View:** score-neutral and excluded from all task scores.

## 10. Claims boundary and validation programme

Permitted current language:

- practises attention control;
- records how decisions change with clarity, time pressure and error cost;
- demonstrates performance across trained In/Out arrow and motion formats;
- provides a provisional in-app signal estimate.

Not currently permitted:

- validated MFT-M-R score;
- improvement in general cognitive control capacity;
- calibrated confidence or prediction accuracy;
- optimal evidence accumulation;
- far transfer to work, study or everyday performance;
- clinical, diagnostic or treatment claims.

Required empirical work includes timing validation across devices, calibration against full MFT-M/MFT-M-R, test–retest reliability, recovery/return benchmarks, held-out policy prediction and external outcome testing.

## 11. Implementation sources

- `src/cccConfig.ts` — versioned timing, niches and response labels.
- `src/cccGenerator.ts` — constrained session, relative carriers and protected phases.
- `src/cccSignal.ts` — adaptive signal grid and timing contract.
- `src/cccValue.ts` — forced-choice value and quota scoring.
- `src/cccFeedback.ts` — separate signal, policy and transfer summaries.
- `src/main.ts` — masked signal runtime, radial optic flow and feedback screens.
- `src/blockPayload.ts` — estimand, timing and validity telemetry.

## 12. Primary methodological anchors

- Wu et al. (2016), *The capacity of cognitive control estimated from a perceptual decision making task*, Scientific Reports, 6, 34025. https://doi.org/10.1038/srep34025
- He et al. (2022), *Adaptive assessment of the capacity of cognitive control*, Quarterly Journal of Experimental Psychology, 75(1), 43–52. https://doi.org/10.1177/17470218211030838
