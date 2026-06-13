## 1. Core scoring model

The original MFT-M estimates cognitive-control capacity by manipulating **stimulus uncertainty** and **exposure time**, then fitting the relation between response accuracy and information rate in bits/sec. Wu et al. report CCC around **3–4 bps** and define the estimate through model fitting to accuracy under different information-rate demands. 

For each trial/condition:

```text
N_size = number of arrows
N_maj  = number needed for a majority sample
N_con  = number of arrows in the majority direction
ET     = exposure time in seconds
C      = candidate capacity value in bits/sec
p0     = upper accuracy / non-lapse accuracy
p_guess = 0.5
```

For your five-arrow MVP:

```text
N_size = 5
N_maj  = 3
```

The grouping-search probability is:

```text
P_group = choose(N_con, N_maj) / choose(N_size, N_maj)
```

So the five-arrow entropy table is:

| Ratio | N_con | P_group | H = log2(N_maj / P_group) |
| ----- | ----: | ------: | ------------------------: |
| 5:0   |     5 |     1.0 |                 1.58 bits |
| 4:1   |     4 |     0.4 |                 2.91 bits |
| 3:2   |     3 |     0.1 |                 4.91 bits |

This matches the entropy values already in your CCC spec. 

The original MFT-M model then predicts the probability that the user voluntarily terminates the search before the stimulus disappears:

```text
P_VT(C) = 1 - (1 - P_group) ^ ((2^C × ET) / N_maj)
```

Expected accuracy:

```text
P_correct(C) = P_VT(C) × p0 + (1 - P_VT(C)) × p_guess
```

Equivalently:

```text
P_correct(C) = p0 - (1 - P_group)^((2^C × ET) / N_maj) × (p0 - p_guess)
```

This is the key equation to implement. Wu et al. use this time-constrained grouping-search model, with guessing at chance when the required information is not processed before stimulus offset. 

---

## 2. Fit capacity from trial data

For each wrapper, fit `C` by maximising the Bernoulli likelihood of the observed correct/incorrect responses:

```text
logLik(C) =
  Σ [ y_t × log(P_correct_t(C)) + (1 - y_t) × log(1 - P_correct_t(C)) ]
```

where:

```text
y_t = 1 if correct, 0 if incorrect
```

Then:

```text
C_hat = argmax logLik(C)
```

Wu et al. describe E[CCC] as the C value that best predicts empirical accuracy across conditions. 

For MVP, search:

```text
C ∈ 0.0 to 10.0 bps
step = 0.01 or 0.02
```

Then estimate uncertainty by one of:

```text
SE from likelihood curvature
bootstrap over trials
Bayesian posterior width
rolling within-session stability
```

---

## 3. Classic / absolute CCC algorithm

For **Direction Bandwidth**:

```text
wrapper_id = abs_lr
task = judge majority absolute direction
responses = Left / Right
```

Trial generation:

```text
1. Sample 5 positions from 8 octagon locations.
2. Choose ratio: 5:0, 4:1, or 3:2.
3. Choose majority category: left or right.
4. Create N_con arrows in majority category.
5. Create remaining arrows in minority category.
6. Present for ET.
7. Mask.
8. Record response, RT, actual frame timing, correctness.
```

Scoring:

```text
N_con = number of arrows pointing in the majority absolute direction
P_group = choose(N_con, 3) / choose(5, 3)
P_correct(C) = p0 - (1 - P_group)^((2^C × ET_actual) / 3) × (p0 - 0.5)
C_abs = argmax logLik(C)
```

Use `5:0` mainly as a catch/lapse condition. For capacity estimation, `4:1` and `3:2` carry more information, because congruent/easy conditions tend to sit near ceiling and do not discriminate capacity well. He et al. explicitly argue that congruent conditions are largely redundant for CCC estimation and that incongruent conditions discriminate ability better. 

---

## 4. Relational / polar CCC algorithm

For **Frame Bandwidth**:

```text
wrapper_id = rel_inout or rel_cwccw
task = judge majority relation relative to centre
responses = Out / In or Circle Right / Circle Left
```

The trial looks identical to the user: five arrows, brief exposure, mask, two buttons. The difference is how each arrow is classified.

For each arrow:

```text
position p_i = [x_i, y_i]
centre c = [x_c, y_c]
arrow vector v_i = unit vector
r_i = normalise(p_i - c)
```

Radial relation:

```text
OUT if dot(v_i, r_i) > 0
IN  if dot(v_i, r_i) < 0
```

Tangential relation:

```text
t_i = rotate90(r_i)
CIRCLE_RIGHT / CIRCLE_LEFT = sign(dot(v_i, t_i))
```

Your CCC spec already defines these polar wrappers and requires a unit test for screen-coordinate sign mapping. 

Then score exactly as above:

```text
N_con = number of arrows in the majority relational category
P_group = choose(N_con, 3) / choose(5, 3)
P_correct(C) = p0 - (1 - P_group)^((2^C × ET_actual) / 3) × (p0 - 0.5)
C_rel_wrapper = argmax logLik(C)
```

Compute:

```text
C_rel = weighted mean of rel_inout and rel_cwccw
Frame Cost = C_abs - C_rel
Frame Efficiency = C_rel / C_abs
```

For first MVP, I would keep:

```text
Classic: abs_lr
Relational 1: rel_inout
Relational 2: rel_cwccw
```

and hold spiral/diagonal for later, since your own CCC spec says the first MVP should use arrows only and avoid spiral/diagonal initially. 

---

## 5. Adaptive CAT procedure

Use the He et al. adaptive method rather than the original fixed 864-trial task. Their adaptive paper reports that CAT-style MFT-M scores correlated with the original MFT-M and reduced administration from 864 trials/about 86 minutes to 216 trials/under 20 minutes. 

### Step 1: Initial calibration

For each active wrapper:

```text
Run 24 baseline trials:
2 repetitions × 12 conditions
```

For your five-arrow app, use:

```text
ratios: 5:0, 4:1, 3:2
ETs: e.g., 120, 180, 250, 350 ms
```

or, if you want a more paper-faithful calibration:

```text
ratios: 4:1, 3:2 plus sparse 5:0 catch trials
ETs: 250, 500, 1000, 2000 ms initially
```

He et al. used two 12-trial baseline blocks to estimate initial E[CCC]. 

### Step 2: Estimate current C

After each trial or mini-block:

```text
C_hat = argmax logLik(C)
SE_hat = estimate uncertainty
```

### Step 3: Select the next condition

For each candidate condition:

```text
candidate = ratio × ET × wrapper
```

Compute:

```text
predicted_p = P_correct(C_hat)
discrimination = abs(dP_correct/dC at C_hat)
information_value =
    discrimination
  × uncertainty_weight
  × reliability_weight
  × usage_penalty
```

He et al. selected highly discriminating items and used weighting to avoid repeatedly selecting the same condition. 

Practical MVP rule:

```text
Target predicted accuracy ≈ 70–82%.
If accuracy is too high, shorten ET or use harder ratio.
If accuracy is too low, lengthen ET or use easier ratio.
If timing is unreliable, avoid very short ETs.
```

This aligns with your CCC spec’s training band and adaptive-selection logic. 

### Step 4: Stop when stable

For app use:

| Mode        | Min trials | Max trials | Use                    |
| ----------- | ---------: | ---------: | ---------------------- |
| Micro-check |         36 |         72 | quick daily estimate   |
| Standard    |         72 |        144 | usable session score   |
| Calibration |        144 |        216 | onboarding / benchmark |

Stop when:

```text
n_trials >= min_trials
AND SE_hat < threshold
```

or:

```text
n_trials == max_trials
```

Your CCC spec already gives these same MVP trial bands and confidence labels. 

---

## 6. Implementation pseudocode

```text
function estimateCCC(trials, wrapper_id):

    valid_trials = removeTimingContaminated(trials)

    p0 = estimateNonLapseAccuracy(valid_trials)
         // from 5:0 catch trials or lapse model
         // constrain p0 between .90 and .995 initially

    best_C = null
    best_LL = -Infinity

    for C from 0.0 to 10.0 step 0.01:

        LL = 0

        for trial in valid_trials:

            ET = trial.exposure_ms_actual / 1000
            N_size = 5
            N_maj = 3
            N_con = trial.majority_count

            P_group = choose(N_con, N_maj) / choose(N_size, N_maj)

            P_VT = 1 - (1 - P_group) ^ ((2^C * ET) / N_maj)

            P_correct = P_VT * p0 + (1 - P_VT) * 0.5

            P_correct = clamp(P_correct, 0.001, 0.999)

            if trial.is_correct:
                LL += log(P_correct)
            else:
                LL += log(1 - P_correct)

        if LL > best_LL:
            best_LL = LL
            best_C = C

    SE = estimateSEfromLikelihoodCurve()
    confidence = confidenceLabel(SE, n_trials, timing_quality)

    return {
        wrapper_id,
        capacity_bps: best_C,
        capacity_se: SE,
        confidence_label: confidence,
        n_trials: count(valid_trials),
        timing_quality
    }
```

---

## 7. Relational extension with wrapper cost

For the research-grade estimate, report `C_rel` directly from the same fitted model. For the product adaptive engine, you can also keep the simpler demand model from your CCC spec:

```text
D_trial = H_majority / ET_adjusted + wrapper_cost
```

But I would treat that as an **adaptive difficulty-control score**, not as the primary MFT-M-derived bps estimate. The more defensible bits/sec score is the original grouping-search `C_hat`.

Use wrapper cost like this:

```text
wrapper_cost(abs_lr) = 0
wrapper_cost(rel_inout) = fitted difficulty shift
wrapper_cost(rel_cwccw) = fitted difficulty shift
```

Then:

```text
Frame Cost = C_abs - C_rel
```

This keeps the consumer-facing metric simple:

```text
Direction Bandwidth: 3.6 bps
Frame Bandwidth: 2.9 bps
Frame Cost: 0.7 bps
```

and preserves the construct separation already in your app spec. 

---

## 8. Recommended MVP scoring policy

Use this hierarchy:

```text
Primary research-style score:
C_abs and C_rel from grouping-search maximum likelihood.

Secondary app-training score:
threshold band from adaptive psychometric model.

Reliability:
SE, timing quality, number of trials, lapse rate.

Progress:
rolling baseline, not single-session overinterpretation.
```

Show users:

```text
Direction Bandwidth
Frame Bandwidth
Frame Cost
Confidence
Timing quality
Training band
```

Store internally:

```text
capacity_bps
capacity_se
wrapper_id
ratio
ET_actual
P_group
P_correct_predicted
log_likelihood
lapse_rate
timing_contaminated
frame_count_observed
```
