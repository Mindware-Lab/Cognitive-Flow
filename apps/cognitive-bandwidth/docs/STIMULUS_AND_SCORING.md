# Stimulus and Scoring Algorithms

## Launch Wrappers

```text
abs_lr:
  majority Left versus Right

rel_inout:
  majority Out versus In relative to a fixed centre
```

Later validation phases may add `abs_ud`, `rel_cwccw`, mixed blocks, diagonal, and spiral conditions.

## Geometry

Use eight possible positions on a fixed-radius octagon. Sample five unique positions per trial.

For item `i`:

```text
position p_i = [x_i, y_i]
centre c = [x_c, y_c]
radial vector r_i = normalize(p_i - c)
```

Absolute vectors:

```text
LEFT  = [-1, 0]
RIGHT = [ 1, 0]
```

Relative vectors:

```text
OUT =  r_i
IN  = -r_i
```

Render scored stimuli with SVG. Derive the correct answer from the generated vectors.

## Trial Generation

Each session receives a cryptographically random seed and a generator version. A deterministic seeded PRNG generates each trial.

For each trial:

1. Select wrapper and condition.
2. Sample five positions.
3. Select and balance the majority category.
4. Select majority count: 5, 4, or 3.
5. Assign majority and minority vectors.
6. Shuffle position assignments.
7. Store the generated descriptor and seed index.

Mini-block balancing:

- category counts differ by no more than one
- octagon positions are approximately balanced
- no condition repeats more than twice
- no category repeats more than three times
- catch trials appear unpredictably

## Majority Information

For five arrows:

```text
N_size = 5
N_maj = 3
P_group = choose(N_con, N_maj) / choose(N_size, N_maj)
H = log2(N_maj / P_group)
```

| Ratio | `P_group` | Entropy |
| --- | ---: | ---: |
| 5:0 | 1.0 | 1.58 bits |
| 4:1 | 0.4 | 2.91 bits |
| 3:2 | 0.1 | 4.91 bits |

Use `5:0` as a catch/lapse condition. Capacity estimation is driven primarily by `4:1` and `3:2`.

## Exposure Pool

Initial scoring pool:

```text
250 ms
500 ms
1000 ms
2000 ms
```

Quantize every exposure to whole measured display frames.

Only add shorter or intermediate exposures after a user has a stable estimate and Good timing quality.

## Display Timing

Before scored use:

1. collect at least 240 animation-frame intervals
2. discard 30 warm-up frames
3. calculate median interval and median absolute deviation
4. identify intervals above 1.5 times the median
5. assign Good, Acceptable, or Limited timing quality

For every trial record:

- requested and actual exposure
- expected and observed frame counts
- frame intervals
- refresh-rate estimate
- focus and visibility interruptions

Exclude contaminated trials from canonical scoring.

## Capacity Model

Use the MFT-M grouping-search model.

For candidate capacity `C`:

```text
n_samples = (2^C * ET_actual_sec) / N_maj
P_search = 1 - (1 - P_group)^n_samples
P_correct = P_search * p0 + (1 - P_search) * 0.5
```

Fit `C` by maximizing Bernoulli log likelihood over valid trials:

```text
logLik(C) =
  sum(
    y_t * log(P_correct_t(C))
    + (1 - y_t) * log(1 - P_correct_t(C))
  )
```

Launch defaults:

- search 0.0 to 10.0 bps
- grid step 0.01
- fixed `p0 = 0.98` for early sessions
- clamp predicted probabilities to `[0.001, 0.999]`

Fit lapse ceiling only after enough catch-trial data exists.

## Adaptive Selection

After initial condition coverage:

1. predict correctness at current `C`
2. estimate `dP/dC`
3. calculate Bernoulli Fisher information
4. apply timing, freshness, and coverage weights
5. sample probabilistically from the best candidates

```text
I = (dP/dC)^2 / (P * (1 - P))
```

Do not always pick one deterministic maximum-information condition.

Initial wrapper coverage:

- 16 core trials across `4:1`, `3:2`, and four exposure times
- 4 catch trials
- 4 pilot-informed repeats

## Confidence

Calculate:

- likelihood-curvature standard error
- 95% profile-likelihood interval
- valid timing proportion
- model-boundary status

Initial labels:

- High confidence
- Moderate confidence
- Still calibrating
- Timing limited

Thresholds remain versioned configuration until simulation and pilot reliability results support them.

## Derived Scores

```text
Direction Bandwidth = fitted C for abs_lr
Frame Bandwidth = fitted C for rel_inout
Frame Cost = Direction Bandwidth - Frame Bandwidth
```

Label Frame Bandwidth as `relational bits/sec`. It is an experimental extension, not an already validated MFT-M measure.

