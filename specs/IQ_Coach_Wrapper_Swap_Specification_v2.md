# IQ Coach: Wrapper-Swap Progression & Metric Calculation Specification
## v2.0 — Webapp / Supabase Implementation

---

## 1. Enrollment, Calibration & Group Assignment

### 1.1 Design Principle

Do **not** use blind 50/50 randomisation. Flow-first onboarding carries higher perceptual load, device-variability risk, and dropout potential. Instead, use a **calibration-gated, cohort-aware** assignment that protects user retention while preserving scientific validity.

### 1.2 Assignment Flow

```
User signs up
    ↓
2-minute calibration (10 arrow trials + 10 flow trials)
    ↓
Device timing tier assessed (excellent / good / poor)
    ↓
Cohort check (general_release vs validation)
    ↓
Assign carrier_group + assignment_method
```

### 1.3 Assignment Rules

| Cohort | Device Tier | `carrier_group` | `assignment_method` | Rationale |
|--------|-------------|-----------------|---------------------|-----------|
| `general_release` | `excellent` or `good` | `A` (arrows-first) | `default` | Product stability; arrows are psychometrically cleaner |
| `general_release` | `poor` | `A` (arrows-first) | `default` | Motion rendering unreliable; force arrows |
| `validation` | `excellent` or `good` | `A` or `B` (50/50) | `random` | Counterbalanced data for publication |
| `validation` | `poor` | `A` (arrows-first) | `default` | Exclude poor devices from randomisation |

**Default split:** 80% of signups → `general_release` (arrows-first). 20% → `validation` (50/50 randomised, device-screened).

### 1.4 Rescue Gate (Flow-First Only)

If a Group-B user is struggling after Session 3:

```
IF carrier_group = 'B' 
   AND session_count >= 3 
   AND mean_accuracy_last_40_trials < 0.55:

   SHOW modal: "Motion patterns can be tricky! 
                Want to switch to arrow training first?"

   IF user accepts:
       UPDATE carrier_group = 'A'
       RESET session progression to Phase 1
       FLAG original_assignment = 'B_rescued'
   ELSE:
       CONTINUE with Group B
       FLAG user as 'B_persevering'
```

This prevents flow-first dropouts while preserving intent-to-treat analysis for users who stick with it.

---

## 2. Supabase Schema

### 2.1 Core Tables

```sql
-- Users / participants
CREATE TABLE users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email text UNIQUE,
    carrier_group text NOT NULL CHECK (carrier_group IN ('A', 'B')),
    assignment_method text NOT NULL CHECK (assignment_method IN ('default', 'random', 'calibration', 'rescued')),
    device_timing_tier text NOT NULL CHECK (device_timing_tier IN ('excellent', 'good', 'poor')),
    cohort text NOT NULL DEFAULT 'general_release' CHECK (cohort IN ('general_release', 'validation')),
    current_phase text NOT NULL DEFAULT 'P1' CHECK (current_phase IN ('P1','P2','P3','P4','P5','P6','P7','P8')),
    current_session integer NOT NULL DEFAULT 1 CHECK (current_session BETWEEN 1 AND 20),
    p0_hyperparameter float,           -- fitted across all measures
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Capacity priors / posteriors per measure (Bayesian updating)
CREATE TABLE capacity_estimates (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES users(id) ON DELETE CASCADE,
    measure_id text NOT NULL CHECK (measure_id IN (
        'ACC_abs_arrow_lr', 'ACC_rel_arrow_inout',
        'BSE_abs_arrow_lr_colour', 'BSE_rel_arrow_inout_colour', 'BSE_rel_arrow_cwccw_colour',
        'ACC_abs_flow_lr', 'ACC_rel_flow_inout',
        'BSE_abs_flow_lr_colour', 'BSE_rel_flow_inout_colour', 'BSE_rel_flow_cwccw_colour'
    )),
    mu float NOT NULL,                  -- posterior mean C
    sigma float NOT NULL CHECK (sigma > 0), -- posterior SD
    n_trials_cumulative integer NOT NULL DEFAULT 0,
    last_updated_session integer NOT NULL,
    UNIQUE(user_id, measure_id)
);

-- Sessions
CREATE TABLE sessions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES users(id) ON DELETE CASCADE,
    session_number integer NOT NULL CHECK (session_number BETWEEN 1 AND 20),
    phase text NOT NULL,
    started_at timestamptz DEFAULT now(),
    completed_at timestamptz,
    n_trials_total integer DEFAULT 80,
    n_trials_usable integer DEFAULT 0,
    session_quality text DEFAULT 'pending' CHECK (session_quality IN ('pending', 'valid', 'degraded', 'invalid')),
    gate_status text DEFAULT 'in_progress' CHECK (gate_status IN ('in_progress', 'passed', 'failed', 'extended'))
);

-- Trials (one row per trial)
CREATE TABLE trials (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id uuid REFERENCES sessions(id) ON DELETE CASCADE,
    user_id uuid REFERENCES users(id) ON DELETE CASCADE,
    trial_index integer NOT NULL,
    measure_id text NOT NULL,
    carrier text NOT NULL CHECK (carrier IN ('arrow', 'flow')),
    frame text NOT NULL CHECK (frame IN ('absolute', 'relational')),
    ratio text NOT NULL,                -- e.g. '5:0', '4:1', '3:2', '6:0:0:0', '4:1:1:0', '3:1:1:1'
    exposure_time_ms integer NOT NULL,
    target_token text,
    user_response text,
    is_correct boolean,
    response_time_ms integer,
    dropped_frames integer DEFAULT 0,
    timing_quality text DEFAULT 'good' CHECK (timing_quality IN ('good', 'acceptable', 'poor')),
    created_at timestamptz DEFAULT now()
);

-- Composite scores (computed after each session)
CREATE TABLE composite_scores (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES users(id) ON DELETE CASCADE,
    session_number integer NOT NULL,
    composite_name text NOT NULL CHECK (composite_name IN (
        'CCC_arrow', 'CCC_flow', 'BSE_arrow', 'BSE_flow',
        'Frame_Cost_arrow', 'Frame_Cost_flow',
        'Carrier_Cost_CCC', 'Carrier_Cost_BSE', 'Binding_Cost',
        'Transfer_Benefit', 'Transfer_Effect_Size', 'Recovery_Slope'
    )),
    value float,
    se float,
    ci_lower float,
    ci_upper float,
    is_reportable boolean DEFAULT false,
    UNIQUE(user_id, session_number, composite_name)
);
```

### 2.2 Enrollment Function

```sql
CREATE OR REPLACE FUNCTION enroll_user(
    p_email text,
    p_device_tier text,
    p_cohort text DEFAULT 'general_release'
)
RETURNS TABLE (user_id uuid, carrier_group text, assignment_method text) AS $$
DECLARE
    v_group text;
    v_method text;
    v_user_id uuid;
BEGIN
    -- Validate inputs
    IF p_device_tier NOT IN ('excellent', 'good', 'poor') THEN
        RAISE EXCEPTION 'Invalid device tier: %', p_device_tier;
    END IF;
    IF p_cohort NOT IN ('general_release', 'validation') THEN
        RAISE EXCEPTION 'Invalid cohort: %', p_cohort;
    END IF;

    -- Assignment logic
    IF p_cohort = 'validation' AND p_device_tier IN ('excellent', 'good') THEN
        v_group := CASE WHEN random() < 0.5 THEN 'A' ELSE 'B' END;
        v_method := 'random';
    ELSE
        v_group := 'A';
        v_method := 'default';
    END IF;

    INSERT INTO users (email, carrier_group, assignment_method, device_timing_tier, cohort)
    VALUES (p_email, v_group, v_method, p_device_tier, p_cohort)
    RETURNING id INTO v_user_id;

    -- Initialise capacity priors for all measures
    INSERT INTO capacity_estimates (user_id, measure_id, mu, sigma, n_trials_cumulative, last_updated_session)
    SELECT 
        v_user_id,
        m.measure_id,
        2.0,    -- population prior mean
        1.0,    -- population prior SD
        0,
        0
    FROM (VALUES 
        ('ACC_abs_arrow_lr'), ('ACC_rel_arrow_inout'),
        ('BSE_abs_arrow_lr_colour'), ('BSE_rel_arrow_inout_colour'), ('BSE_rel_arrow_cwccw_colour'),
        ('ACC_abs_flow_lr'), ('ACC_rel_flow_inout'),
        ('BSE_abs_flow_lr_colour'), ('BSE_rel_flow_inout_colour'), ('BSE_rel_flow_cwccw_colour')
    ) AS m(measure_id);

    RETURN QUERY SELECT v_user_id, v_group, v_method;
END;
$$ LANGUAGE plpgsql;
```

### 2.3 Row-Level Security (RLS)

```sql
-- Users can only read their own data
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY user_self ON users FOR ALL USING (auth.uid() = id);

-- Trials / sessions / scores only for owning user
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY session_self ON sessions FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = sessions.user_id AND users.id = auth.uid())
);

ALTER TABLE trials ENABLE ROW LEVEL SECURITY;
CREATE POLICY trial_self ON trials FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = trials.user_id AND users.id = auth.uid())
);

ALTER TABLE capacity_estimates ENABLE ROW LEVEL SECURITY;
CREATE POLICY cap_self ON capacity_estimates FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = capacity_estimates.user_id AND users.id = auth.uid())
);
```

---

## 3. Phase-by-Phase Progression & Trial Allocation

Session counts are **nominal**. True progression is gated by learning-curve criteria (Section 4). With 80 trials/session, trials are allocated as follows:

### 3.1 Group A: Arrows-First

| Phase | Nominal Sessions | Active Measures | Trials/Measure | Cumulative/Measure | Carrier |
|-------|-----------------|-----------------|---------------|------------------|---------|
| **P1: Baseline** | 1–3 | `ACC_abs_arrow_lr` | 120 | 120 | Arrows |
| | | `ACC_rel_arrow_inout` | 120 | 120 | Arrows |
| **P2: Frame Transfer** | 4–5 | `ACC_abs_arrow_lr` | 80 | 200 | Arrows |
| | | `ACC_rel_arrow_inout` | 80 | 200 | Arrows |
| **P3: BSE Intro** | 6–8 | `BSE_abs_arrow_lr_colour` | 120 | 120 | Arrows |
| | | `BSE_rel_arrow_inout_colour` | 120 | 120 | Arrows |
| **P4: BSE Expansion** | 9–10 | `BSE_abs_arrow_lr_colour` | 53 | 173 | Arrows |
| | | `BSE_rel_arrow_inout_colour` | 53 | 173 | Arrows |
| | | `BSE_rel_arrow_cwccw_colour` | 53 | 53 | Arrows |
| **P5: Carrier Swap** | 11–13 | `ACC_abs_flow_lr` | 80 | 80 | Flow |
| | | `ACC_rel_flow_inout` | 80 | 80 | Flow |
| | | `BSE_abs_flow_lr_colour` | 80 | 80 | Flow |
| **P6: Flow Recovery** | 14–15 | `BSE_abs_flow_lr_colour` | 80 | 160 | Flow |
| | | `BSE_rel_flow_inout_colour` | 80 | 80 | Flow |
| **P7: Mixed** | 16–18 | All 6 measures | 40 each | +40 | Mixed |
| **P8: Delayed** | 19–20 | All 6 measures | 27 each | +27 | Mixed |

### 3.2 Group B: Flow-First (Symmetric)

Same structure, carriers reversed. Flow measures accumulate sessions 1–10; arrow measures accumulate sessions 11–15.

---

## 4. Learning-Curve Gates (Advancement Criteria)

A participant **only advances** to the next phase when all active measures satisfy their gate. If not, the phase extends (sessions become flexible).

| Gate | Criterion | Minimum Sessions |
|------|-----------|------------------|
| **G1: Positive Learning** | Accuracy slope > 0 across last 40 trials (logistic regression, p < 0.05) | 2 sessions |
| **G2: Flattening** | Accuracy slope not significantly > 0 (p > 0.10) | 3 sessions |
| **G3: Criterion** | Mean accuracy in 70–82% band for 2 consecutive sessions | 2 sessions |
| **G4: Recovery** | After carrier swap, accuracy returns to within 10% of pre-swap level | 2 sessions |

### 4.1 Gate Logic per Phase

```
P1 (Baseline):     Must pass G1 + G2 before advancing to P2
P2 (Frame):        Must pass G3 before advancing to P3
P3 (BSE Intro):    Must pass G1 (binding learning) + G2 before advancing to P4
P4 (BSE Expansion):  Must pass G3 before advancing to P5
P5 (Carrier Swap): Must pass G4 (recovery) before advancing to P6
P6 (Recovery):     Must pass G3 before advancing to P7
P7–P8:             No gates; fixed 3 + 2 sessions
```

### 4.2 Supabase Gate Check (Edge Function)

```typescript
// supabase/functions/check-gates/index.ts
import { createClient } from '@supabase/supabase-js'

export async function checkPhaseGates(userId: string) {
  const supabase = createClient(...)

  // Fetch last 2 sessions for this user + phase
  const { data: sessions } = await supabase
    .from('sessions')
    .select('id, session_number, phase')
    .eq('user_id', userId)
    .order('session_number', { ascending: false })
    .limit(2)

  // Fetch trials for those sessions
  const sessionIds = sessions.map(s => s.id)
  const { data: trials } = await supabase
    .from('trials')
    .select('*')
    .in('session_id', sessionIds)
    .eq('timing_quality', 'good')  // only usable trials

  // Run gate logic per measure
  const gates = {
    g1: checkPositiveLearning(trials),   // slope > 0
    g2: checkFlattening(trials),          // slope not > 0
    g3: checkCriterion(trials),          // 70-82% band
    g4: checkRecovery(trials)             // within 10% pre-swap
  }

  // Update session gate_status
  const allPassed = Object.values(gates).every(g => g.passed)
  await supabase
    .from('sessions')
    .update({ gate_status: allPassed ? 'passed' : 'extended' })
    .eq('id', sessions[0].id)

  return { gates, advance: allPassed }
}
```

---

## 5. Capacity Estimation: Hierarchical Bayesian Updating

### 5.1 Psychometric Model

For each measure, capacity **C** is estimated using the TVA-based psychometric function:

$$P_{correct} = \gamma + (1 - \gamma - \lambda) \times \left(1 - \exp\left(-\frac{C \cdot ET}{N \cdot H_{token}}\right)\right)$$

| Parameter | Treatment | Value |
|-----------|-----------|-------|
| **C** | Estimated per measure, per participant | Fitted, bounds [0.1, 6.0] |
| **γ** | Fixed by response alternatives | 0.50 (K=2), 0.25 (K=4) |
| **λ** | Fixed hyperparameter | 0.02 |
| **N** | Fixed display size | 6 |
| **H_token** | Fixed by condition | 1.0 (binary), 2.0 (conjunction) |
| **P₀** | Participant-level hyperparameter across all measures | Fitted once per participant; stored in `users.p0_hyperparameter` |

### 5.2 Bayesian Updating Rule

Each measure maintains a posterior distribution across sessions:

$$\text{Prior}_s: C \sim \mathcal{N}(\mu_{s-1}, \sigma_{s-1}^2)$$

After session $s$ data $D_s$:

1. **Accumulate all historical trials** for this measure: $D_{all} = D_1 \cup D_2 \cup ... \cup D_s$
2. **Compute MLE**: $\hat{C}_{MLE} = \arg\max_C \mathcal{L}(C \mid D_{all})$
3. **Approximate SE** via parametric bootstrap (20 resamples of trial outcomes)
4. **Precision-weighted update**:
   $$\sigma_s^{-2} = \sigma_{s-1}^{-2} + SE_{MLE}^{-2}$$
   $$\mu_s = \frac{\sigma_{s-1}^{-2} \cdot \mu_{s-1} + SE_{MLE}^{-2} \cdot \hat{C}_{MLE}}{\sigma_s^{-2}}$$

### 5.3 Reporting Thresholds

| State | Condition | User Feedback |
|-------|-----------|---------------|
| **Calibrating** | σ > 0.5 or trials < 120 | "Calibrating your attention profile…" + progress bar |
| **Emerging** | 0.3 < σ ≤ 0.5 | Show score with wide confidence band |
| **Stable** | σ ≤ 0.3 | Show score with narrow CI; enable composites |
| **Diagnostic** | σ ≤ 0.2 | Enable Frame Cost, Carrier Cost, Transfer metrics |

### 5.4 Edge Function: Update Capacity

```typescript
// supabase/functions/update-capacity/index.ts
export async function updateCapacity(userId: string, measureId: string, sessionNum: number) {
  // 1. Fetch all usable trials for this measure
  const { data: trials } = await supabase
    .from('trials')
    .select('*')
    .eq('user_id', userId)
    .eq('measure_id', measureId)
    .in('timing_quality', ['good', 'acceptable'])

  // 2. Fetch current prior
  const { data: prior } = await supabase
    .from('capacity_estimates')
    .select('mu, sigma')
    .eq('user_id', userId)
    .eq('measure_id', measureId)
    .single()

  // 3. MLE + bootstrap SE (Python/SciPy via Edge Function or external service)
  const { C_mle, se } = await computeMLE(trials, measureId, prior.mu)

  // 4. Kalman-like update
  const priorPrec = 1 / (prior.sigma ** 2)
  const dataPrec = 1 / (se ** 2)
  const postPrec = priorPrec + dataPrec
  const postMu = (priorPrec * prior.mu + dataPrec * C_mle) / postPrec
  const postSigma = Math.sqrt(1 / postPrec)

  // 5. Write back
  await supabase
    .from('capacity_estimates')
    .update({
      mu: postMu,
      sigma: postSigma,
      n_trials_cumulative: trials.length,
      last_updated_session: sessionNum
    })
    .eq('user_id', userId)
    .eq('measure_id', measureId)

  return { mu: postMu, sigma: postSigma }
}
```

---

## 6. Adaptive Staircase (QUEST+ / ZEST)

### 6.1 Why Adaptive

| Method | Effective Trials at Threshold | Equivalent Fixed-ET Trials |
|--------|-------------------------------|---------------------------|
| Fixed ET (8 values × 10 trials) | ~20 | 80 |
| QUEST+ adaptive | ~70 | ~240 |

Adaptive staircase **triples effective statistical power** without increasing session length.

### 6.2 Per-Measure Staircase State

Stored in `capacity_estimates` as JSON or separate table:

```sql
ALTER TABLE capacity_estimates ADD COLUMN quest_state jsonb;
```

```json
{
  "et_prior": [100, 200, 300, 500, 800, 1000, 1500, 2000],
  "posterior": [0.05, 0.10, 0.20, 0.30, 0.20, 0.10, 0.04, 0.01],
  "last_et": 500,
  "trials_at_et": {"100": 2, "200": 3, "500": 5}
}
```

### 6.3 Trial Selection Logic

```typescript
function selectNextET(questState: QuestState): number {
  // Expected information gain for each candidate ET
  const infoGains = questState.et_prior.map(et => {
    const pCorrect = psychometricFunction(et, questState.currentCMu)
    const entropyBefore = entropy(questState.posterior)

    // Simulate correct and incorrect outcomes
    const posteriorIfCorrect = updatePosterior(questState, et, true)
    const posteriorIfIncorrect = updatePosterior(questState, et, false)

    const expectedEntropy = 
      pCorrect * entropy(posteriorIfCorrect) + 
      (1 - pCorrect) * entropy(posteriorIfIncorrect)

    return entropyBefore - expectedEntropy
  })

  // Select ET with maximum expected information gain
  const bestIndex = infoGains.indexOf(Math.max(...infoGains))
  return questState.et_prior[bestIndex]
}
```

---

## 7. Metric Calculation Timeline

### 7.1 Individual Capacity Scores (C)

| Measure ID | First Reportable | Stable (σ < 0.3) | Full Precision |
|------------|-----------------|-------------------|----------------|
| `ACC_abs_arrow_lr` | Session 3 | Session 5 | Session 8 |
| `ACC_rel_arrow_inout` | Session 3 | Session 5 | Session 8 |
| `BSE_abs_arrow_lr_colour` | Session 8 | Session 10 | Session 12 |
| `BSE_rel_arrow_inout_colour` | Session 8 | Session 10 | Session 12 |
| `BSE_rel_arrow_cwccw_colour` | Session 10 | Session 12 | Session 15 |
| `ACC_abs_flow_lr` | Session 13 | Session 15 | Session 18 |
| `ACC_rel_flow_inout` | Session 13 | Session 15 | Session 18 |
| `BSE_abs_flow_lr_colour` | Session 13 | Session 15 | Session 18 |
| `BSE_rel_flow_inout_colour` | Session 15 | Session 17 | Session 19 |
| `BSE_rel_flow_cwccw_colour` | Session 15 | Session 17 | Session 19 |

### 7.2 Composite Scores

| Composite | Formula | First Reportable | Stable |
|-----------|---------|-----------------|--------|
| **CCC_arrow** | Mean(`ACC_abs_arrow_lr`, `ACC_rel_arrow_inout`) | Session 5 | Session 8 |
| **CCC_flow** | Mean(`ACC_abs_flow_lr`, `ACC_rel_flow_inout`) | Session 15 | Session 18 |
| **BSE_arrow** | Inverse-variance weighted mean of 3 arrow BSE measures | Session 12 | Session 15 |
| **BSE_flow** | Inverse-variance weighted mean of 3 flow BSE measures | Session 17 | Session 19 |
| **Frame_Cost_arrow** | `ACC_abs_arrow_lr` − mean(relational arrows) | Session 8 | Session 12 |
| **Frame_Cost_flow** | `ACC_abs_flow_lr` − mean(relational flow) | Session 15 | Session 18 |
| **Carrier_Cost_CCC** | `CCC_arrow` − `CCC_flow` | Session 15 | Session 18 |
| **Carrier_Cost_BSE** | `BSE_arrow` − `BSE_flow` | Session 17 | Session 20 |
| **Binding_Cost** | Cohen's d(`CCC_arrow` − `BSE_arrow`) | Session 12 | Session 15 |

### 7.3 Transfer Metrics (Revised, Non-Ratio)

**Abandoned:** TRR (Transfer Rate Ratio) — too unstable due to division by noisy training gain.

**Adopted:** Raw transfer benefit + standardized effect sizes.

| Metric | Formula | Group A | Group B | Reportable |
|--------|---------|---------|---------|------------|
| **Transfer Benefit** | ΔC = C_probe_post − C_probe_baseline | Flow ΔC (sessions 15 vs 11) | Arrow ΔC (sessions 15 vs 11) | Session 15 |
| **Transfer Effect Size** | d = ΔC / SE_pooled | Flow d | Arrow d | Session 15 |
| **Recovery Slope** | β = ΔC/Δsession (sessions 11–15) | Flow β | Arrow β | Session 15 |
| **Asymmetry Index** | AI = ΔC(A→B) − ΔC(B→A) | — | — | Session 15 (both groups, n > 200 per group) |

### 7.4 Longitudinal Metrics (Sessions 16–20)

| Metric | Calculation | Purpose |
|--------|-------------|---------|
| **Mixed Stability** | SD(C) across mixed sessions | Can user maintain invariant across unpredictable carrier switches? |
| **Delayed Retention** | C at session 20 vs session 15 | Does transfer survive 5-session delay? |
| **Learning Rate** | Slope of C across all training sessions | Individual learning speed |

---

## 8. Data Accumulation by Session (Group A Example)

| Session | New Data | Measures Updated | Cumulative/Measure |
|---------|----------|------------------|-------------------|
| 1 | 80 trials | `ACC_abs`, `ACC_rel` | 40 each |
| 2 | 80 trials | `ACC_abs`, `ACC_rel` | 80 each |
| 3 | 80 trials | `ACC_abs`, `ACC_rel` | 120 each |
| 4 | 80 trials | `ACC_abs`, `ACC_rel` | 160 each |
| 5 | 80 trials | `ACC_abs`, `ACC_rel` | 200 each |
| 6 | 80 trials | `BSE_abs`, `BSE_rel_inout` | 40 each (new) |
| 7 | 80 trials | `BSE_abs`, `BSE_rel_inout` | 80 each |
| 8 | 80 trials | `BSE_abs`, `BSE_rel_inout` | 120 each |
| 9 | 80 trials | `BSE_abs`, `BSE_rel_inout`, `BSE_rel_cwccw` | 160, 160, 27 |
| 10 | 80 trials | `BSE_abs`, `BSE_rel_inout`, `BSE_rel_cwccw` | 200, 200, 53 |
| 11 | 80 trials | `ACC_abs_flow`, `ACC_rel_flow`, `BSE_abs_flow` | 27 each (new) |
| 12 | 80 trials | `ACC_abs_flow`, `ACC_rel_flow`, `BSE_abs_flow` | 53 each |
| 13 | 80 trials | `ACC_abs_flow`, `ACC_rel_flow`, `BSE_abs_flow` | 80 each |
| 14 | 80 trials | `BSE_abs_flow`, `BSE_rel_flow` | 120, 40 |
| 15 | 80 trials | `BSE_abs_flow`, `BSE_rel_flow` | 160, 80 |
| 16–18 | 240 trials | All 6 measures | +40 each |
| 19–20 | 160 trials | All 6 measures | +27 each |

---

## 9. Quality Control & Exclusions

### 9.1 Per-Trial Timing Flags

| Flag | Criterion | Action |
|------|-----------|--------|
| **Good** | 0 dropped frames, ET ± 1 frame | Include in estimation |
| **Acceptable** | ≤ 1 dropped frame, ET ± 2 frames | Include in estimation |
| **Poor** | > 1 dropped frame OR ET error > ± 2 frames | Exclude from C estimation; use for adaptive only |

### 9.2 Session-Level Flags

| Flag | Criterion | Action |
|------|-----------|--------|
| **Valid** | ≥ 60 usable trials, ≥ 2 measures stable | Report scores |
| **Degraded** | 40–59 usable trials, or 1 measure unstable | Report with warning banner |
| **Invalid** | < 40 usable trials | Discard session; repeat phase |

### 9.3 Model Fit Checks

After each session, compute **deviance** of the fitted model. If deviance exceeds threshold:
- Flag measure as "model misfit"
- Do not update Bayesian prior for that measure
- Increase adaptive sampling at mid-range ETs next session

---

## 10. User-Facing Dashboard Logic

### 10.1 What the User Sees

| Session | Display |
|---------|---------|
| 1–2 | "Calibrating…" + progress bar |
| 3–5 | CCC score ± CI (emerging) |
| 6–8 | CCC score + "Binding skill unlocking…" |
| 9–10 | CCC + BSE scores ± CI |
| 11 | **Carrier swap event** — "New challenge: motion patterns" |
| 12–13 | Flow score ± wide CI (detecting dip) |
| 14–15 | Flow score narrowing + "Recovery detected" |
| 16–18 | All scores + "Mixed mastery" |
| 19–20 | Final scores + longitudinal trend graph |

### 10.2 What the Researcher Sees (Backend)

- Session-by-session C estimates with SE for all 10 measures
- Learning-curve plots with gate annotations
- Transfer benefit with 95% CI
- Asymmetry index (if n > 200 per group)
- Model deviance and timing quality reports
- Rescue-gate flags (`B_rescued`, `B_persevering`)

---

## 11. Summary: Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| **Calibration-gated assignment** | Protects retention; flow-first only for capable devices/users |
| **Cohort split (80/20)** | Product stability for most; publishable science from validation subset |
| **Rescue gate** | Prevents flow-first dropouts; preserves intent-to-treat for analysis |
| **Counterbalanced groups** | Enables asymmetry test; controls for order effects |
| **Carrier-first, not mixed** | Builds genuine trained invariant before testing transfer |
| **Adaptive staircase** | 3× power vs fixed ET with same trial count |
| **Hierarchical Bayes** | Borrows strength across sessions; enables early reporting |
| **P₀ as hyperparameter** | Solves identifiability; avoids per-session overfitting |
| **Raw benefit, not TRR** | Avoids ratio instability; scientifically cleaner |
| **Learning-curve gates** | Ensures invariant is actually learned before swap |
| **σ < 0.3 threshold** | Prevents reporting noisy, misleading scores |
| **Supabase RLS** | Secure per-user data isolation |

---

## 12. Implementation Checklist

### Backend (Supabase)
- [ ] Run schema migrations (users, sessions, trials, capacity_estimates, composite_scores)
- [ ] Deploy `enroll_user()` function
- [ ] Deploy Edge Function: `check-gates`
- [ ] Deploy Edge Function: `update-capacity`
- [ ] Deploy Edge Function: `select-next-et` (adaptive staircase)
- [ ] Enable RLS policies on all tables
- [ ] Set up calibration trial endpoint (10 arrow + 10 flow)
- [ ] Implement rescue-gate UI modal + `UPDATE users` logic

### Frontend
- [ ] Calibration screen (2 min, auto-detects device tier)
- [ ] Session player (80 trials, adaptive ET selection)
- [ ] Real-time timing quality monitoring (dropped frame detection)
- [ ] Dashboard with score states: Calibrating → Emerging → Stable → Diagnostic
- [ ] Carrier-swap event animation (Session 11)
- [ ] Longitudinal trend graph (Sessions 16–20)

### Analysis Pipeline
- [ ] Python/SciPy MLE fitting service (or WebAssembly in browser)
- [ ] Parametric bootstrap for SE estimation
- [ ] Composite score calculator (runs after each session)
- [ ] Transfer metric calculator (runs after Session 15)
- [ ] Export pipeline for validation-cohort data

---

*This specification treats the 20-session structure as a single longitudinal experiment with 1,600 trials per participant, not 20 independent snapshots. That is the only way to extract reliable transfer metrics from 80 trials/session.*
