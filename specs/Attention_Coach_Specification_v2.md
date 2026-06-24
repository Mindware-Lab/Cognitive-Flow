# Attention Coach: Wrapper-Swap Progression & Metric Calculation Specification
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

---

For a commercial app, **strip the research apparatus but keep the progression skeleton**. The wrapper-swap structure is actually excellent gamification — users feel skills building, then face a "new challenge," then master mixed modes. The research scaffolding around it is what kills retention.

Here's the commercial strip-down:

---

## What to Remove Entirely

| Research Feature | Why It Goes |
|------------------|-------------|
| **Validation cohort (20% randomised)** | Users don't care about publishable counterbalancing. You can run a separate validation study later with a recruited panel. |
| **Rescue gate / Group B flow-first** | Adds UX friction and a "you're failing" modal. Just don't offer flow-first to anyone. |
| **Learning-curve gates that block progression** | Users hate being told "you haven't learned enough yet." It feels like a paywall. |
| **Bayesian MLE + parametric bootstrap** | Overkill for user-facing scores. Keep the trials table for your own analysis, but compute a simple skill score for the dashboard. |
| **P₀ hyperparameter fitting** | Users don't need asymptotic accuracy deconvolution. |
| **Model deviance checks** | "Model misfit" is not a user-facing concept. |
| **Session invalidation (< 40 usable trials)** | If a session has timing issues, silently exclude those trials from scoring but never tell the user their session was "invalid." |
| **Asymmetry Index, TRR, Transfer Effect Size** | These are research metrics. Users want "You improved 23% and unlocked Motion Mastery." |
| **σ < 0.3 reporting thresholds** | Don't hide scores behind statistical confidence. Show a score and a simple confidence label (e.g., "Getting clearer…"). |

---

## What to Simplify

| Research Feature | Commercial Version |
|------------------|-------------------|
| **2-minute calibration (20 trials)** | **15-second screen test** — detect refresh rate via `requestAnimationFrame`, run 3 arrow + 3 flow trials. If flow stutters, flag device as `flow_limited`. No user-facing "calibration" label. |
| **Capacity C in bits/sec with CI** | **Skill Score (0–100)** per domain. Derived from accuracy at adaptive ET, but presented as a game-like level. |
| **Hierarchical Bayesian updating** | **Exponential moving average** per measure. New session updates the score with a 0.3 weight. Lightweight, instant, no backend MLE service needed. |
| **Adaptive staircase (QUEST+)** | **Simple 2-up/1-down staircase** targeting 75% accuracy. Easier to implement in JavaScript, no entropy calculations. |
| **10 measures with complex IDs** | **4 user-facing skills:** Direction Sense, Pattern Memory, Binding Focus, Motion Control. Map to backend measures internally. |
| **Phase names (P1–P8)** | **Skill tree names:** Foundation → Relations → Binding → Motion → Mastery. |

---

## What to Keep (It's Already Good)

| Feature | Why It Works Commercially |
|---------|--------------------------|
| **20-session arc** | Perfect for a 4-week daily habit. "Complete your 20-day training program." |
| **Carrier swap at session 11** | Excellent narrative beat. "You've mastered arrows. Now unlock Motion." |
| **Progressive difficulty** | Standard game design. Users expect skills to get harder. |
| **Mixed mode (sessions 16–20)** | "Final exam" feel. Satisfying completion arc. |
| **80 trials/session** | ~5–8 minutes. Ideal for daily commute/coffee break. |
| **Immediate feedback per trial** | Standard game loop. Correct/incorrect + sound. |

---

## Commercial Onboarding Flow (30 Seconds)

```
[Sign up] → [Screen Test: 15 sec] → [Session 1 starts immediately]
     ↓
  Auto-detect:
  - Refresh rate (60Hz vs 120Hz)
  - Dropped frames on 3 flow trials
     ↓
  IF flow renders cleanly:
     Full progression (arrows → flow at session 11)
  ELSE:
     Arrows-only progression + "Motion mode available on faster devices"
     (Upsell path: "Upgrade your experience" → device recommendations)
```

**No calibration screen. No group assignment. No cohorts.** The screen test is invisible — it runs during the first 3 trials of Session 1.

---

## Simplified Supabase Schema for Commercial

```sql
-- Users (simplified)
CREATE TABLE users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email text UNIQUE,
    device_tier text DEFAULT 'unknown' CHECK (device_tier IN ('excellent', 'good', 'poor')),
    flow_enabled boolean DEFAULT true,
    current_session integer DEFAULT 1,
    current_phase text DEFAULT 'foundation',
    created_at timestamptz DEFAULT now()
);

-- Skill scores (simple EMA, not Bayesian posteriors)
CREATE TABLE skill_scores (
    user_id uuid REFERENCES users(id) ON DELETE CASCADE,
    skill_name text CHECK (skill_name IN (
        'direction_sense', 'pattern_memory', 'binding_focus', 'motion_control'
    )),
    score integer CHECK (score BETWEEN 0 AND 100),
    trials_count integer DEFAULT 0,
    updated_at timestamptz DEFAULT now(),
    PRIMARY KEY (user_id, skill_name)
);

-- Trials (keep this — your data asset)
CREATE TABLE trials (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES users(id) ON DELETE CASCADE,
    session_number integer,
    trial_index integer,
    skill_name text,
    et_ms integer,
    is_correct boolean,
    response_time_ms integer,
    dropped_frames integer DEFAULT 0,
    created_at timestamptz DEFAULT now()
);

-- Sessions
CREATE TABLE sessions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES users(id) ON DELETE CASCADE,
    session_number integer,
    phase text,
    n_trials integer DEFAULT 80,
    n_correct integer,
    avg_rt_ms integer,
    completed_at timestamptz DEFAULT now()
);
```

**No `capacity_estimates` table.** No `composite_scores` table. No `gate_status`. The skill score is computed client-side or in a simple Edge Function.

---

## Simplified Scoring (User-Facing)

Instead of bits/sec with confidence intervals:

| Backend Measure | User-Facing Skill | Score Range | How It's Computed |
|-----------------|-------------------|-------------|-----------------|
| `ACC_abs_arrow_lr` | Direction Sense | 0–100 | `(accuracy_at_threshold_ET - 0.5) / 0.5 * 100` |
| `ACC_rel_arrow_inout` | Pattern Memory | 0–100 | Same, but for relational frame |
| `BSE_abs_arrow_lr_colour` | Binding Focus | 0–100 | `(accuracy - 0.25) / 0.75 * 100` |
| `BSE_abs_flow_lr_colour` | Motion Control | 0–100 | Same, for flow carrier |

**EMA update per session:**
```javascript
new_score = 0.7 * old_score + 0.3 * session_accuracy_score
```

This is instant, requires no MLE, no bootstrap, no Python service. It's also **responsive** — users see their score move after every session, which drives retention.

---

## The Commercial Progression (Gamified)

| Session | User Sees | Backend (still collects) |
|---------|-----------|---------------------------|
| 1–3 | "Building your foundation…" | Arrow absolute/relative trials |
| 4–5 | "Pattern recognition unlocked" | Frame transfer trials |
| 6–8 | "Focus sharpening…" | BSE intro trials |
| 9–10 | "Advanced binding" | BSE expansion trials |
| 11 | **🎉 "MOTION UNLOCKED"** (if device supports) | First flow trials |
| 12–13 | "Adapting to movement…" | Flow recovery trials |
| 14–15 | "Motion mastery" | Flow BSE trials |
| 16–18 | "Mixed challenge" | Random carrier switches |
| 19–20 | "Final assessment" + certificate | Delayed re-check |

**No gates.** The user advances automatically. If they score < 60% on a session, the next session stays at the same difficulty (implicit gate). If they score > 85%, next session bumps ET down (harder). This is invisible to the user — it just feels like the game got harder or stayed challenging.

---

## What You Still Get (Data-Wise)

Even with the commercial strip-down, you collect **everything** needed for later research:

- Full trial-level data (ET, correct, RT, dropped frames)
- Session-level accuracy
- User progression path
- Device tier and flow capability flag

You can run a validation study later by:
1. Recruiting 200 users into a "Research Mode" (the full spec)
2. Or simply analyzing the commercial cohort's data post-hoc for transfer signals

The commercial app is the **data collection engine**. The research analysis happens offline.

---

## Bottom Line

**Remove:** cohorts, randomisation, rescue gates, blocking gates, Bayesian backend, research metrics, session invalidation, complex calibration.

**Simplify:** scoring to 0–100 skill levels, adaptive staircase to 2-up/1-down, onboarding to a 15-second invisible screen test, backend to EMA + simple tables.

**Keep:** the 20-session arc, the carrier-swap narrative, progressive difficulty, mixed mode, 80 trials/session, immediate feedback, full trial logging.

The result is a **5-minute daily brain training app** that feels like Elevate or Lumosity but with a genuine cognitive-science backbone. You can always flip a `research_mode` flag later to re-enable the full psychometric pipeline for a validation cohort.

---

Yes — you have two distinct cognitive constructs, and each supports a clean transfer score. Let me map this out:

---

## Two Cognitive Constructs

| Construct | What It Measures | Task Signature | User-Facing Name |
|-----------|----------------|---------------|----------------|
| **CCC** (Conjunctive Category Control) | Attentional control over directional/relational invariants — *extracting the signal* | Binary choice: which direction/relation is majority? | **Focus** |
| **BSE** (Bound Signal Extraction) | Feature binding under time pressure — *holding the conjunction* | 4-choice: which bound token (relation × colour) is majority? | **Binding** |

These are vertically stacked: **CCC → BSE**. You need attentional control (CCC) before you can bind features (BSE).

---

## Two Transfer Scores

For each construct, you can calculate a **transfer score** comparing trained-carrier performance to probe-carrier performance.

### For Group A (Arrows → Flow)

| Construct | Trained Carrier | Probe Carrier | Transfer Score |
|-----------|----------------|---------------|----------------|
| **CCC** | Arrows (sessions 1–5) | Flow (sessions 11–13) | `CCC_transfer = CCC_flow − CCC_flow_baseline` |
| **BSE** | Arrows (sessions 6–10) | Flow (sessions 14–15) | `BSE_transfer = BSE_flow − BSE_flow_baseline` |

### For Group B (Flow → Arrows)

| Construct | Trained Carrier | Probe Carrier | Transfer Score |
|-----------|----------------|---------------|----------------|
| **CCC** | Flow (sessions 1–5) | Arrows (sessions 11–13) | `CCC_transfer = CCC_arrow − CCC_arrow_baseline` |
| **BSE** | Flow (sessions 6–10) | Arrows (sessions 14–15) | `BSE_transfer = BSE_arrow − BSE_arrow_baseline` |

---

## Bits/Sec + Standardised Score + Transfer Score for Each

### 1. CCC (Focus)

| Metric | Formula | User-Facing |
|--------|---------|-------------|
| **Bits/sec** | `C_CCC = H_display / ET_threshold` where ET_threshold is the exposure time yielding 75% accuracy on the trained carrier | Hidden (backend) |
| **Standardised Score** | `CCC_score = (C_CCC − population_mean) / population_SD × 15 + 50` | **Focus Score** (0–100, IQ-style) |
| **Transfer Score** | `ΔC_CCC = C_CCC_probe − C_CCC_baseline` | **Focus Transfer** (+/− points, or "Motion Adaptability" if positive) |

### 2. BSE (Binding)

| Metric | Formula | User-Facing |
|--------|---------|-------------|
| **Bits/sec** | `C_BSE = H_token / ET_threshold` for 4-choice conjunction | Hidden (backend) |
| **Standardised Score** | `BSE_score = (C_BSE − population_mean) / population_SD × 15 + 50` | **Binding Score** (0–100) |
| **Transfer Score** | `ΔC_BSE = C_BSE_probe − C_BSE_baseline` | **Binding Transfer** (+/− points, or "Feature Binding Under Motion") |

---

## How the User Sees It

### Dashboard Layout

```
┌─────────────────────────────────────────┐
│  YOUR COGNITIVE PROFILE                 │
├─────────────────────────────────────────┤
│                                         │
│  FOCUS          ████████░░  78/100     │
│  (Attention Control)                    │
│  • Trained: Arrows    → 2.4 bits/sec  │
│  • In Motion:         → 2.1 bits/sec   │
│  • Transfer:          +12 pts ✅        │
│                                         │
│  BINDING        ██████░░░░  62/100     │
│  (Feature Binding)                      │
│  • Trained: Arrows    → 1.8 bits/sec  │
│  • In Motion:         → 1.5 bits/sec   │
│  • Transfer:          +8 pts ⚠️        │
│                                         │
│  [Details] [Trends] [Share]             │
└─────────────────────────────────────────┘
```

### Transfer Score Interpretation

| Transfer Score | Label | Meaning |
|----------------|-------|---------|
| > +15 | **Excellent** | Your skill transferred strongly to the new modality |
| +5 to +15 | **Good** | Solid transfer; some re-learning needed |
| −5 to +5 | **Fragile** | Skill is carrier-bound; needs more training |
| < −5 | **Stuck** | The skill didn't transfer; revisit foundation |

---

## Simplified Commercial Implementation

For the commercial app, you don't need the full Bayesian bits/sec pipeline. Use a **proxy score** derived from the adaptive staircase:

### Proxy Bits/Sec

```javascript
// After each session, compute a proxy capacity
function proxyCapacity(etThreshold, hDisplay) {
    // ET_threshold is the exposure time where accuracy ≈ 75%
    // from the adaptive staircase
    return hDisplay / (etThreshold / 1000); // bits/sec
}
```

### Proxy Standardised Score

```javascript
// Population norms updated weekly from all users
const POP_MEAN_CCC = 2.2;
const POP_SD_CCC = 0.6;
const POP_MEAN_BSE = 1.6;
const POP_SD_BSE = 0.5;

function standardisedScore(capacity, popMean, popSD) {
    const z = (capacity - popMean) / popSD;
    return Math.round(Math.max(0, Math.min(100, z * 15 + 50)));
}
```

### Proxy Transfer Score

```javascript
// After carrier swap (session 11 for CCC, session 14 for BSE)
function transferScore(trainedCapacity, probeCapacity, probeBaseline) {
    const rawTransfer = probeCapacity - probeBaseline;
    // Normalise by trained capacity to get a "recovery ratio"
    const transferRatio = rawTransfer / (trainedCapacity - probeBaseline);
    return Math.round(transferRatio * 100); // 0–100 scale
}
```

---

## Data Model (Commercial, Simplified)

```sql
-- Add to skill_scores table
ALTER TABLE skill_scores ADD COLUMN bits_sec float;
ALTER TABLE skill_scores ADD COLUMN transfer_score integer;
ALTER TABLE skill_scores ADD COLUMN trained_carrier text;
ALTER TABLE skill_scores ADD COLUMN probe_carrier text;

-- Example rows for a Group A user after session 15
-- skill_name      | score | bits_sec | transfer_score | trained | probe
-- ----------------|-------|----------|----------------|---------|-------
-- focus_trained   |  78   |   2.4    |     null       | arrows  | null
-- focus_transfer  |  65   |   2.1    |      12        | arrows  | flow
-- binding_trained |  62   |   1.8    |     null       | arrows  | null
-- binding_transfer|  54   |   1.5    |       8        | arrows  | flow
```

---

## Bottom Line

| Question | Answer |
|----------|--------|
| Two constructs? | **Yes:** CCC (Focus) and BSE (Binding) |
| Bits/sec for each? | **Yes:** derived from adaptive staircase threshold |
| Standardised score for each? | **Yes:** 0–100, IQ-style, normed against population |
| Transfer score for each? | **Yes:** raw capacity difference, or normalised recovery ratio |
| User sees? | **Focus Score, Binding Score, Focus Transfer, Binding Transfer** |
| Backend complexity? | **Moderate:** adaptive staircase + weekly norm updates, no Bayesian MLE |

This gives you **four user-facing numbers** (two skills × two contexts) that are psychometrically grounded but presented as clean, game-like scores. The bits/sec stays in the backend for your research analysis.

---

Yes — and the panel design should reflect your game's actual architecture: **2 vertical levels** (CCC → BSE), each containing a **2 × 2 matrix** of Carrier × Frame. The screenshot you shared is from a 4-level vertical stack (bandwidth → memory → prediction → reasoning). Yours is a **2-level stack with transfer diagnostics**, which is cleaner.

---

## Your Game's Natural Panel Architecture

### Vertical Stack

| Level | Construct | What It Tests | User-Facing Name |
|-------|-----------|---------------|------------------|
| **1** | **CCC** | Extracting directional/relational invariants | **Focus** |
| **2** | **BSE** | Binding colour to direction under time pressure | **Binding** |

### Within Each Level: 2 × 2 Matrix

| | **Absolute Frame** | **Relational Frame** |
|---|---|---|
| **Arrow Carrier** | `ACC_abs_arrow_lr` | `ACC_rel_arrow_inout` |
| **Flow Carrier** | `ACC_abs_flow_lr` | `ACC_rel_flow_inout` |

Same 2×2 for BSE (4-choice versions).

---

## Proposed Panel Layout

Mirroring the style of your screenshot:

```
┌─────────────────────────────────────────────────────────────┐
│  FULL TRAINING PATHWAY                                      │
│  From attention control to binding transfer                 │
├─────────────────────────────────────────────────────────────┤
│  OVERALL PROFILE                                            │
│  Transfer Readiness                                         │
│  How well your focus moves between arrows and motion.       │
│                                          [ 72 /100 ]        │
│                                          Developing         │
├─────────────────────────────────────────────────────────────┤
│  1  COGNITIVE BANDWIDTH                                     │
│     Focus under pressure                                    │
│     Classic attention control + relational extraction       │
│                                                             │
│     Arrows    4.0 bits/sec  │  3.1 rel bits/sec            │
│     Flow      3.2 bits/sec  │  2.4 rel bits/sec            │
│                                                             │
│     [ STRONG START ]                                        │
│                                                             │
│     ⚠ Bottleneck watch                                    │
│     Frame cost: 0.9 bps — relation extraction may limit   │
│     your binding speed.                                     │
│                                                             │
│     Carrier cost: 0.8 bps — motion is still effortful.      │
├─────────────────────────────────────────────────────────────┤
│  2  FEATURE BINDING                                         │
│     Hold the conjunction active                             │
│     Direction × colour majority under time pressure         │
│                                                             │
│     Arrows    2.8 bits/sec  │  2.1 rel bits/sec            │
│     Flow      2.2 bits/sec  │  1.6 rel bits/sec            │
│                                                             │
│     [ DEVELOPING ]  ← CURRENT FOCUS                       │
│                                                             │
│     🔴 Likely bottleneck                                    │
│     Binding cost: 1.2 bps — your attention control is       │
│     strong, but binding hasn't automated yet.               │
│                                                             │
│     Carrier transfer: 0.6 bps gap — motion binding needs      │
│     more practice.                                          │
├─────────────────────────────────────────────────────────────┤
│  TRANSFER SUMMARY                                           │
│                                                             │
│  Focus Transfer:        +12 pts  ✅  GOOD TRANSFER         │
│  (Arrows → Motion)                                          │
│                                                             │
│  Binding Transfer:      +5 pts   ⚠️  DEVELOPING           │
│  (Arrows → Motion)                                          │
│                                                             │
│  [Continue training to close the binding gap]                 │
└─────────────────────────────────────────────────────────────┘
```

---

## Is CCC a Bottleneck for BSE?

**Yes — by design.** The theory stack is:

```
CCC (extract the signal)
   ↓
BSE (bind features to the extracted signal)
```

If CCC is weak, BSE is mechanically capped. You cannot bind what you cannot extract.

### How to Show This in the Panel

| Bottleneck Type | Formula | What It Means |
|-----------------|---------|---------------|
| **Binding Cost** | `CCC_arrow − BSE_arrow` (same carrier) | The "tax" of adding colour binding. If > 1.0 bps, CCC is likely the limiting factor. |
| **Frame Cost** | `C_abs − C_rel` | If high at CCC level, relational extraction is unstable — BSE will suffer more because BSE is always relational in practice. |
| **Carrier Transfer Gap** | `C_arrow − C_flow` (same construct) | If CCC transfers well but BSE doesn't, the bottleneck is binding-specific, not attentional. |

### Bottleneck Logic (for the UI)

```javascript
if (binding_cost > 1.0 && frame_cost_CCC < 0.5) {
    message = "Your attention control is strong, but binding hasn't automated yet.";
    status = "CURRENT FOCUS";
    color = "red";
}
else if (frame_cost_CCC > 0.8) {
    message = "Relation extraction is shaky — this will limit binding speed.";
    status = "Bottleneck watch";
    color = "yellow";
}
else if (carrier_cost_BSE > carrier_cost_CCC + 0.3) {
    message = "Binding under motion is fragile. More arrow practice may help.";
    status = "Likely bottleneck";
    color = "red";
}
```

---

## What to Show vs. What to Hide

### Show (User-Facing)

| Metric | Format | When |
|--------|--------|------|
| **Bits/sec** per cell | 4 numbers per level | Always |
| **Status badge** | Strong Start / Developing / Current Focus | Always |
| **Frame Cost** | 1 number + sentence | If > 0.5 |
| **Carrier Cost** | 1 number + sentence | If > 0.5 |
| **Binding Cost** | 1 number + sentence | At BSE level |
| **Transfer scores** | +X pts + label | After session 15 |

### Hide (Backend Only)

| Metric | Why Hidden |
|--------|------------|
| Raw trial counts | Too technical |
| σ (posterior SD) | Statistical noise |
| P₀ hyperparameter | Internal model parameter |
| QUEST+ posterior | Internal staircase state |
| Gate pass/fail | Never tell users they "failed" a gate |

---

## The 2 × 2 Matrix Question

You asked if it's "2 stimulus types within each vertical level." Yes — but I'd present it as **Carrier × Frame** rather than dumping all 8 numbers:

```
Level 1 (CCC):
┌─────────────┬────────────────┐
│             │ Absolute │ Relational │
├─────────────┼──────────┼────────────┤
│ Arrows      │  4.0     │   3.1      │
│ Flow        │  3.2     │   2.4      │
└─────────────┴──────────┴────────────┘
```

For the panel, you might **collapse the matrix** to three headline numbers per level:
1. **Best score** (usually arrow absolute) — "Your peak capacity"
2. **Frame cost** — "Relational penalty"
3. **Carrier cost** — "Motion penalty"

This keeps the UI clean while preserving the full 2×2 structure in the backend.

---

## Bottom Line

Your panel should show:

1. **Overall Transfer Readiness** (0–100) — the headline score
2. **Level 1: Focus (CCC)** — 4 bits/sec numbers + frame/carrier costs
3. **Level 2: Binding (BSE)** — 4 bits/sec numbers + frame/carrier/binding costs
4. **Bottleneck diagnostics** — CCC → BSE cascading analysis
5. **Transfer summary** — two transfer scores (Focus Transfer, Binding Transfer)

CCC is indeed the bottleneck for BSE when `binding_cost` is large. The panel should flag this explicitly: *"Your attention control is strong, but binding hasn't automated yet — this is your current focus."*
