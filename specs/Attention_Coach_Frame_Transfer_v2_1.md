# Attention Coach: Blocked Frame-Transfer Progression & Metric Calculation Specification
## v2.1 — Frame-first far-transfer revision

**Product:** Attention Coach / IQ Coach component  
**Constructs:** CCC / Attention Control and BSE / Binding  
**Status:** Revised from the previous wrapper-swap specification  
**Core change:** The primary far-transfer axis is now **absolute frame → relational frame**, not **static arrows → optic flow**.

---

# 1. Revision summary

The previous specification treated the main transfer question as a carrier swap:

```text
arrows / static carrier
→ optic-flow / motion carrier
```

The revised design treats carrier change as a **secondary robustness axis**. The primary training and transfer question is now:

```text
Can a user recover the same extraction or binding policy when the reference frame changes
from absolute screen-centred direction
to relational centre-framed direction?
```

The blocked progression is:

```text
absolute arrows
→ relative arrows
→ absolute optic flow
→ relative optic flow
→ final four-way mixed phase
```

There are **no interim probes**. Each stimulus type is trained as a blocked phase until near-asymptote. The final phase mixes all four conditions and provides the main transfer/stability readout.

---

# 2. Core design principle

The game has a 2 × 2 wrapper matrix:

| | **Absolute frame** | **Relational frame** |
|---|---:|---:|
| **Arrow carrier** | absolute arrows | relative arrows |
| **Optic-flow carrier** | absolute optic flow | relative optic flow |

This matrix is used at two vertical levels:

| Level | Construct | User-facing name | Core question |
|---:|---|---|---|
| 1 | CCC / Attention Control | Focus / Attention Control | Can the user extract the target signal under time pressure? |
| 2 | BSE / Bound Signal Extraction | Binding | Can the user extract and hold the relation × colour conjunction under time pressure? |

The main transfer axis is:

```text
absolute frame
→ relational frame
```

The secondary robustness axis is:

```text
arrow carrier
→ optic-flow carrier
```

The final mixed phase tests whether the user can maintain the same policy when both axes vary unpredictably.

---

# 3. Theoretical rationale

The revised sequence is intended to train the **reference-frame invariant** before treating optic flow as a transfer target.

The sequence means:

```text
absolute arrows:
learn clean signal extraction in the easiest, most stable carrier

relative arrows:
change the reference frame while keeping the carrier familiar

absolute optic flow:
change the carrier while returning to the simpler absolute frame

relative optic flow:
reconstruct the relational-frame operation in the dynamic carrier

four-way mixed:
test whether the policy survives unpredictable carrier × frame changes
```

This is better aligned with a blocked, no-probe design because each stage introduces one major demand at a time. The relative-frame shift is the deeper cognitive transform, while optic flow is the dynamic carrier robustness test.

---

# 4. What changed from v2.0

## 4.1 Removed or demoted

Remove from the core commercial specification:

```text
blind 50/50 carrier randomisation
flow-first default group
carrier_group A/B as the main user pathway
rescue gate for flow-first users
carrier-swap transfer as the main transfer metric
probe-carrier baseline as the main transfer calculation
Transfer Benefit based on static → flow change
Asymmetry Index as a commercial metric
```

These can remain in a separate research-mode validation protocol, but they should not define the commercial training arc.

## 4.2 Retained

Keep:

```text
20-session training arc
near-asymptote progression
80 trials per session
adaptive exposure timing
full trial-level logging
bits/sec objective capacity estimates
standardised score or band
final mixed phase
frame cost
carrier cost
binding cost
```

## 4.3 Reframed

Old framing:

```text
Main transfer = arrows/static → optic flow/motion
```

New framing:

```text
Main transfer = absolute frame → relational frame
Carrier robustness = arrows → optic flow
Final transfer evidence = four-way mixed stability
```

---

# 5. Stimulus cells and measure IDs

## 5.1 CCC / Attention Control measures

| Cell | Measure ID | Carrier | Frame | User-facing description |
|---|---|---|---|---|
| AA | `CCC_arrow_abs` | arrow | absolute | most arrows left/right or up/down |
| AR | `CCC_arrow_rel` | arrow | relational | most arrows in/out or clockwise/anticlockwise |
| FA | `CCC_flow_abs` | optic_flow | absolute | flow field moving left/right or up/down |
| FR | `CCC_flow_rel` | optic_flow | relational | flow expanding/contracting or rotating clockwise/anticlockwise |

## 5.2 BSE / Binding measures

| Cell | Measure ID | Carrier | Frame | User-facing description |
|---|---|---|---|---|
| AA | `BSE_arrow_abs_colour` | arrow | absolute | absolute relation × colour majority |
| AR | `BSE_arrow_rel_colour` | arrow | relational | relational relation × colour majority |
| FA | `BSE_flow_abs_colour` | optic_flow | absolute | absolute flow relation × colour majority |
| FR | `BSE_flow_rel_colour` | optic_flow | relational | relational flow relation × colour majority |

## 5.3 User-facing score names

Use simple public labels:

```text
Attention Control
Binding
Frame Transfer
Mixed Stability
Transfer Readiness
```

Keep these internal-only:

```text
CCC
BSE
bits/sec
Frame Cost
Carrier Cost
Frame Efficiency
Carrier Robustness
interaction cost
```

---

# 6. Training progression

## 6.1 Default 20-session pathway

Each blocked phase trains one cell of the 2 × 2 matrix to near-asymptote.

| Phase | Sessions | Cell | Stimulus type | Purpose |
|---:|---:|---|---|---|
| P1 | 1–4 | AA | absolute arrows | clean base extraction and binding |
| P2 | 5–8 | AR | relative arrows | reference-frame abstraction in familiar carrier |
| P3 | 9–12 | FA | absolute optic flow | carrier change with simpler frame |
| P4 | 13–16 | FR | relative optic flow | relational-frame reconstruction in dynamic carrier |
| P5 | 17–20 | AA + AR + FA + FR | four-way mixed | flexible transfer and stability test |

## 6.2 Session allocation

Recommended default:

```text
80 trials per session
```

Blocked phases:

| Construct | Trials/session | Notes |
|---|---:|---|
| CCC / Attention Control | 40 | adaptive exposure and ratio |
| BSE / Binding | 40 | relation × colour or equivalent bound token |

Mixed phase:

| Cell | CCC trials/session | BSE trials/session | Total per session |
|---|---:|---:|---:|
| AA | 10 | 10 | 20 |
| AR | 10 | 10 | 20 |
| FA | 10 | 10 | 20 |
| FR | 10 | 10 | 20 |
| **Total** | **40** | **40** | **80** |

## 6.3 Onboarding adjustment

If BSE is too demanding in session 1, use a soft ramp:

```text
Session 1:
60 CCC trials
20 BSE tutorial/easy trials

Session 2 onward:
40 CCC trials
40 BSE trials
```

Do not call this a failure or remediation. Present it as normal onboarding.

---

# 7. Near-asymptote criteria

A phase should normally run for four sessions. It may extend if performance is too noisy or if timing quality is poor.

Near-asymptote is defined per construct and cell.

A cell is considered near-asymptote when:

```text
minimum usable trials met
AND recent performance is in or above the target band
AND recent improvement slope is small
AND timing quality is acceptable
```

Suggested default:

```text
minimum usable trials per construct per cell = 120
preferred usable trials per construct per cell = 160

target balanced accuracy = 70–82%
flattening criterion = recent capacity slope near zero over last 2 sessions
high-performance ceiling = >85% with no further ET reduction available
```

## 7.1 Phase extension rule

```text
IF usable_trials < 120:
    extend phase by 1 session

ELSE IF timing_quality = poor:
    extend or simplify timing

ELSE IF accuracy < 60% for 2 sessions:
    keep phase but make exposure easier

ELSE IF recent_slope is still clearly positive:
    allow one extension session if the user is engaged

ELSE:
    advance to next phase
```

User-facing copy should avoid “failed gate”. Use:

```text
We are giving this skill one more session to stabilise.
```

or:

```text
Your next session continues this format so the score is more reliable.
```

---

# 8. Capacity estimation

Each measure estimates an objective capacity value:

```text
C_measure = accuracy-adjusted information extracted / adjusted exposure time
```

Unit:

```text
bits/sec
```

For CCC:

```text
D_CCC =
H_extract / ET_adjusted
+ frame_cost
+ carrier_cost
+ lure_cost
```

For BSE:

```text
D_BSE =
H_bound_token / ET_adjusted
+ frame_cost
+ carrier_cost
+ binding_cost
+ partial_match_lure_cost
```

Where:

```text
H_extract = entropy/information demand of the majority condition
H_bound_token = information demand of the relation × colour token
ET_adjusted = actual frame-counted exposure time
```

Use actual displayed frames, not requested milliseconds, for all timing-sensitive estimates.

---

# 9. Primary far-transfer calculation

## 9.1 Why the metric changes

Because there are no interim probes, the app should not calculate far transfer as:

```text
probe_post - probe_baseline
```

That would imply an untrained probe design that this protocol is no longer using.

Instead, the primary transfer calculation should ask:

```text
How much of the absolute-frame capacity survives when the same construct is rebuilt
in a relational frame?
```

This is a **frame-transfer** metric.

## 9.2 Notation

For each construct `k`:

```text
k ∈ {CCC, BSE}
```

Let:

```text
C_AA_k = asymptotic capacity in absolute arrows
C_AR_k = asymptotic capacity in relative arrows
C_FA_k = asymptotic capacity in absolute optic flow
C_FR_k = asymptotic capacity in relative optic flow
```

Let mixed-phase capacities be:

```text
M_AA_k
M_AR_k
M_FA_k
M_FR_k
```

---

# 10. Frame-transfer metrics

## 10.1 Frame Cost

Frame Cost is the capacity drop from absolute to relational frame within the same carrier.

```text
FrameCost_arrow_k = C_AA_k - C_AR_k
FrameCost_flow_k  = C_FA_k - C_FR_k
```

Lower is better.

## 10.2 Frame Efficiency

Frame Efficiency expresses how much of the absolute-frame capacity survives in the relational frame.

```text
FrameEfficiency_arrow_k = C_AR_k / C_AA_k
FrameEfficiency_flow_k  = C_FR_k / C_FA_k
```

Interpretation:

| Value | Meaning |
|---:|---|
| ≥ .90 | strong frame transfer |
| .75–.89 | good frame transfer |
| .60–.74 | developing frame transfer |
| < .60 | fragile frame transfer |

## 10.3 Frame Transfer Index

The primary far-transfer score is:

```text
FTI_k = 100 × weighted_mean(
    FrameEfficiency_arrow_k,
    FrameEfficiency_flow_k
)
```

Weights should depend on:

```text
trial count
timing quality
estimate confidence
recency
```

A simple MVP version can use equal weights once both carriers have enough data:

```text
FTI_k = 100 × mean(
    C_AR_k / C_AA_k,
    C_FR_k / C_FA_k
)
```

## 10.4 Frame Transfer Gain

Because there are no probe baselines, use an **entry-to-asymptote** learning metric for the relative phases.

For arrows:

```text
FrameTransferGain_arrow_k =
C_AR_asymptote_k - C_AR_entry_k
```

For optic flow:

```text
FrameTransferGain_flow_k =
C_FR_asymptote_k - C_FR_entry_k
```

Where:

```text
C_AR_entry_k = estimate from the first 20–40 usable trials of the relative-arrow phase
C_FR_entry_k = estimate from the first 20–40 usable trials of the relative-flow phase
```

This is not “pure transfer” in the strict experimental sense. It is the recovery curve of the relational frame after the preceding absolute-frame block.

## 10.5 Frame Reconstruction Slope

For each relative phase:

```text
FrameReconstructionSlope_arrow_k =
slope(C_AR_k across P2 sessions)

FrameReconstructionSlope_flow_k =
slope(C_FR_k across P4 sessions)
```

This captures how quickly the user reconstructs the policy in the relational frame.

---

# 11. Carrier robustness metrics

Carrier change remains important, but it is no longer the main transfer construct.

## 11.1 Carrier Cost

```text
CarrierCost_abs_k = C_AA_k - C_FA_k
CarrierCost_rel_k = C_AR_k - C_FR_k
```

Lower is better.

## 11.2 Carrier Robustness

```text
CarrierRobustness_abs_k = C_FA_k / C_AA_k
CarrierRobustness_rel_k = C_FR_k / C_AR_k
```

This tells us whether optic flow is still imposing a carrier-specific cost.

## 11.3 Why this is secondary

Carrier robustness answers:

```text
Does the skill survive a change from arrows to optic flow?
```

Frame transfer answers:

```text
Does the skill survive the deeper shift from absolute to relational reference frames?
```

In this revised protocol, frame transfer is the principal far-transfer metric, while carrier robustness is an important secondary diagnostic.

---

# 12. Mixed-phase metrics

The final mixed phase is the strongest evidence phase in this no-probe design.

## 12.1 Mixed Stability

For each construct and cell:

```text
MixedStability_cell_k = M_cell_k / C_cell_k
```

Where:

```text
C_cell_k = blocked asymptotic capacity for that cell
M_cell_k = mixed-phase capacity for that same cell
```

Overall:

```text
MixedStability_k =
100 × mean(
    M_AA_k / C_AA_k,
    M_AR_k / C_AR_k,
    M_FA_k / C_FA_k,
    M_FR_k / C_FR_k
)
```

Interpretation:

| Value | Meaning |
|---:|---|
| ≥ 90 | stable under mixed wrapper switching |
| 75–89 | good mixed stability |
| 60–74 | developing mixed stability |
| < 60 | wrapper-bound or switching-fragile |

## 12.2 Mixed Frame Stability

This focuses on whether relational-frame performance survives mixed presentation.

```text
MixedFrameStability_k =
100 × mean(
    M_AR_k / C_AR_k,
    M_FR_k / C_FR_k
)
```

This should be weighted more heavily than absolute-cell stability because the main transfer target is the relative frame.

## 12.3 Four-Way Flexibility Cost

```text
FourWayFlexibilityCost_k =
mean(C_AA_k, C_AR_k, C_FA_k, C_FR_k)
-
mean(M_AA_k, M_AR_k, M_FA_k, M_FR_k)
```

Lower is better.

---

# 13. Interaction metrics

The 2 × 2 matrix allows an important interaction test.

## 13.1 Frame × Carrier Interaction Cost

```text
FrameCostDifference_k =
abs(FrameCost_arrow_k - FrameCost_flow_k)
```

A small value means the relational-frame cost is similar across carriers.

A large value means the relational operation is carrier-dependent.

## 13.2 Normalised Interaction Cost

```text
NormalisedInteractionCost_k =
FrameCostDifference_k / mean(C_AA_k, C_AR_k, C_FA_k, C_FR_k)
```

## 13.3 Frame Generality Score

```text
FrameGenerality_k =
100 × (1 - clamp(NormalisedInteractionCost_k, 0, 1))
```

Higher is better.

This score answers:

```text
Is the absolute → relational frame shift behaving like the same operation
in arrows and optic flow?
```

---

# 14. Composite transfer scores

## 14.1 Construct-specific transfer score

For each construct:

```text
TransferScore_k =
0.50 × FrameTransferIndex_k
+ 0.30 × MixedFrameStability_k
+ 0.20 × FrameGenerality_k
```

Where:

```text
k = CCC or BSE
```

This makes the hierarchy explicit:

```text
frame transfer is primary
mixed relational stability is second
cross-carrier generality is third
```

## 14.2 Overall Transfer Readiness

```text
TransferReadiness =
0.45 × TransferScore_CCC
+ 0.45 × TransferScore_BSE
+ 0.10 × VerticalCoherence
```

## 14.3 Vertical Coherence

Vertical Coherence tests whether BSE is supported by CCC.

```text
VerticalCoherence =
100 × mean(
    BSE_FrameEfficiency_arrow / CCC_FrameEfficiency_arrow,
    BSE_FrameEfficiency_flow / CCC_FrameEfficiency_flow
)
```

Cap the ratio at 1.0 before multiplying by 100:

```text
VerticalCoherence_component =
min(1, BSE_FE / CCC_FE)
```

Interpretation:

```text
high Vertical Coherence:
binding transfer is keeping pace with attention-control transfer

low Vertical Coherence:
attention-control transfer is stronger than binding transfer;
binding is the likely limiting layer
```

---

# 15. Bottleneck logic

## 15.1 Attention-control frame bottleneck

Pattern:

```text
CCC_FrameEfficiency_arrow low
AND CCC_FrameEfficiency_flow low
```

Interpretation:

```text
The user extracts absolute direction adequately, but the relational reference frame remains costly.
```

User-facing wording:

```text
Current focus: relational attention control.
You are doing better when the direction is screen-based than when it is frame-based.
```

## 15.2 Binding-specific bottleneck

Pattern:

```text
CCC_FrameTransferIndex adequate
AND BSE_FrameTransferIndex low
```

Interpretation:

```text
The user can recover the relational frame, but adding colour/conjunction binding destabilises it.
```

User-facing wording:

```text
Current focus: binding.
Your attention control is transferring, but relation-colour binding still needs stabilising.
```

## 15.3 Carrier robustness bottleneck

Pattern:

```text
FrameEfficiency_arrow adequate
AND FrameEfficiency_flow low
```

Interpretation:

```text
The relational operation is working in arrows but not yet in optic flow.
```

User-facing wording:

```text
Current focus: motion robustness.
The same relation is easier in arrows than in motion patterns.
```

## 15.4 Mixed switching bottleneck

Pattern:

```text
blocked cell scores adequate
AND MixedFrameStability low
```

Interpretation:

```text
The user can perform each cell when blocked, but not when wrapper changes are unpredictable.
```

User-facing wording:

```text
Current focus: flexible switching.
You are doing well in each format, but the mixed challenge still costs performance.
```

---

# 16. User-facing dashboard

## 16.1 Main cards

```text
Attention Control
Binding
Frame Transfer
Mixed Stability
Transfer Readiness
```

## 16.2 Matrix display

For advanced users or detailed view:

```text
Attention Control

                 Absolute       Relational
Arrows           4.0 bps        3.2 bps
Motion           3.4 bps        2.7 bps

Frame Transfer: 82
Mixed Stability: 78
Current focus: relational motion
```

For Binding:

```text
Binding

                 Absolute       Relational
Arrows           2.8 bps        2.1 bps
Motion           2.3 bps        1.6 bps

Frame Transfer: 69
Mixed Stability: 64
Current focus: relation-colour binding
```

## 16.3 Simple progress language

Use:

```text
Frame Transfer
How well your skill carries from simple direction to frame-based direction.

Motion Robustness
How well the same skill survives when the display becomes motion-based.

Mixed Stability
How well the skill holds when formats are mixed together.

Binding
How well you keep colour and direction joined together under time pressure.
```

Avoid:

```text
far transfer proven
IQ gain
diagnosis
deficit
brain state
```

---

# 17. Supabase schema revision

## 17.1 Users table

Remove `carrier_group`, `assignment_method` and validation-only group logic from the commercial core.

```sql
CREATE TABLE users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email text UNIQUE,
    device_tier text DEFAULT 'unknown'
        CHECK (device_tier IN ('excellent', 'good', 'poor', 'unknown')),
    flow_enabled boolean DEFAULT true,
    current_phase text NOT NULL DEFAULT 'P1'
        CHECK (current_phase IN ('P1','P2','P3','P4','P5')),
    current_session integer NOT NULL DEFAULT 1
        CHECK (current_session BETWEEN 1 AND 30),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);
```

## 17.2 Capacity estimates

```sql
CREATE TABLE capacity_estimates (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES users(id) ON DELETE CASCADE,
    measure_id text NOT NULL CHECK (measure_id IN (
        'CCC_arrow_abs',
        'CCC_arrow_rel',
        'CCC_flow_abs',
        'CCC_flow_rel',
        'BSE_arrow_abs_colour',
        'BSE_arrow_rel_colour',
        'BSE_flow_abs_colour',
        'BSE_flow_rel_colour'
    )),
    construct text NOT NULL CHECK (construct IN ('CCC','BSE')),
    carrier text NOT NULL CHECK (carrier IN ('arrow','optic_flow')),
    frame text NOT NULL CHECK (frame IN ('absolute','relational')),
    capacity_bps float,
    standard_score float,
    confidence_label text DEFAULT 'calibrating',
    n_trials_cumulative integer NOT NULL DEFAULT 0,
    asymptote_status text DEFAULT 'not_started'
        CHECK (asymptote_status IN ('not_started','active','near_asymptote','mixed','retired')),
    entry_capacity_bps float,
    asymptote_capacity_bps float,
    mixed_capacity_bps float,
    timing_quality text DEFAULT 'unknown',
    last_updated_session integer NOT NULL DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(user_id, measure_id)
);
```

## 17.3 Trials

```sql
CREATE TABLE trials (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES users(id) ON DELETE CASCADE,
    session_id uuid,
    session_number integer NOT NULL,
    phase text NOT NULL CHECK (phase IN ('P1','P2','P3','P4','P5')),
    trial_index integer NOT NULL,
    measure_id text NOT NULL,
    construct text NOT NULL CHECK (construct IN ('CCC','BSE')),
    carrier text NOT NULL CHECK (carrier IN ('arrow','optic_flow')),
    frame text NOT NULL CHECK (frame IN ('absolute','relational')),
    is_mixed_phase boolean DEFAULT false,
    ratio text,
    exposure_time_ms_requested integer,
    exposure_time_ms_actual integer,
    target_token text,
    user_response text,
    is_correct boolean,
    response_time_ms integer,
    dropped_frames integer DEFAULT 0,
    timing_quality text DEFAULT 'good'
        CHECK (timing_quality IN ('good','acceptable','poor')),
    created_at timestamptz DEFAULT now()
);
```

## 17.4 Composite scores

```sql
CREATE TABLE composite_scores (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES users(id) ON DELETE CASCADE,
    session_number integer NOT NULL,
    construct text CHECK (construct IN ('CCC','BSE','overall')),
    composite_name text NOT NULL CHECK (composite_name IN (
        'FrameCost_arrow',
        'FrameCost_flow',
        'FrameEfficiency_arrow',
        'FrameEfficiency_flow',
        'FrameTransferIndex',
        'FrameTransferGain_arrow',
        'FrameTransferGain_flow',
        'CarrierCost_abs',
        'CarrierCost_rel',
        'CarrierRobustness_abs',
        'CarrierRobustness_rel',
        'MixedStability',
        'MixedFrameStability',
        'FourWayFlexibilityCost',
        'FrameGenerality',
        'TransferScore',
        'VerticalCoherence',
        'TransferReadiness'
    )),
    value float,
    se float,
    ci_lower float,
    ci_upper float,
    confidence_label text DEFAULT 'calibrating',
    is_reportable boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    UNIQUE(user_id, session_number, construct, composite_name)
);
```

---

# 18. Progression controller

## 18.1 Phase mapping

```typescript
const PHASES = {
  P1: { carrier: 'arrow', frame: 'absolute', label: 'Absolute Arrows' },
  P2: { carrier: 'arrow', frame: 'relational', label: 'Relative Arrows' },
  P3: { carrier: 'optic_flow', frame: 'absolute', label: 'Absolute Motion' },
  P4: { carrier: 'optic_flow', frame: 'relational', label: 'Relative Motion' },
  P5: { carrier: 'mixed', frame: 'mixed', label: 'Four-Way Mixed' }
}
```

## 18.2 Advance rule

```typescript
function shouldAdvancePhase(phaseSummary) {
  if (phaseSummary.usableTrialsPerConstruct < 120) return false
  if (phaseSummary.timingQuality === 'poor') return false

  const cccReady = phaseSummary.CCC.nearAsymptote || phaseSummary.CCC.sessionsInPhase >= 4
  const bseReady = phaseSummary.BSE.nearAsymptote || phaseSummary.BSE.sessionsInPhase >= 4

  return cccReady && bseReady
}
```

## 18.3 Mixed phase selection

```typescript
function selectMixedTrial(trialIndex) {
  const cells = [
    { carrier: 'arrow', frame: 'absolute' },
    { carrier: 'arrow', frame: 'relational' },
    { carrier: 'optic_flow', frame: 'absolute' },
    { carrier: 'optic_flow', frame: 'relational' }
  ]

  const constructs = ['CCC', 'BSE']

  return balancedRandomChoice(cells, constructs)
}
```

---

# 19. Scoring pseudocode

## 19.1 Frame transfer

```typescript
function computeFrameTransfer(capacities, construct) {
  const AA = capacities[construct].arrow.absolute.asymptote
  const AR = capacities[construct].arrow.relational.asymptote
  const FA = capacities[construct].optic_flow.absolute.asymptote
  const FR = capacities[construct].optic_flow.relational.asymptote

  const feArrow = AR / AA
  const feFlow = FR / FA

  const frameTransferIndex = 100 * mean([feArrow, feFlow])

  const frameCostArrow = AA - AR
  const frameCostFlow = FA - FR

  const frameGenerality = 100 * (
    1 - clamp(
      Math.abs(frameCostArrow - frameCostFlow) / mean([AA, AR, FA, FR]),
      0,
      1
    )
  )

  return {
    FrameEfficiency_arrow: feArrow,
    FrameEfficiency_flow: feFlow,
    FrameCost_arrow: frameCostArrow,
    FrameCost_flow: frameCostFlow,
    FrameTransferIndex: frameTransferIndex,
    FrameGenerality: frameGenerality
  }
}
```

## 19.2 Mixed stability

```typescript
function computeMixedStability(blocked, mixed, construct) {
  const cells = ['AA', 'AR', 'FA', 'FR']

  const ratios = cells.map(cell => mixed[construct][cell] / blocked[construct][cell])

  const relationalRatios = [
    mixed[construct].AR / blocked[construct].AR,
    mixed[construct].FR / blocked[construct].FR
  ]

  return {
    MixedStability: 100 * mean(ratios),
    MixedFrameStability: 100 * mean(relationalRatios),
    FourWayFlexibilityCost:
      mean(cells.map(cell => blocked[construct][cell]))
      - mean(cells.map(cell => mixed[construct][cell]))
  }
}
```

## 19.3 Construct transfer score

```typescript
function computeTransferScore(frame, mixed) {
  return (
    0.50 * frame.FrameTransferIndex +
    0.30 * mixed.MixedFrameStability +
    0.20 * frame.FrameGenerality
  )
}
```

## 19.4 Overall transfer readiness

```typescript
function computeTransferReadiness(transferCCC, transferBSE, verticalCoherence) {
  return (
    0.45 * transferCCC +
    0.45 * transferBSE +
    0.10 * verticalCoherence
  )
}
```

---

# 20. Reporting timeline

## 20.1 Blocked cell reporting

| Phase | Sessions | First reportable | Stable enough for composites |
|---|---:|---:|---:|
| Absolute arrows | 1–4 | session 2 | session 4 |
| Relative arrows | 5–8 | session 6 | session 8 |
| Absolute optic flow | 9–12 | session 10 | session 12 |
| Relative optic flow | 13–16 | session 14 | session 16 |
| Four-way mixed | 17–20 | session 18 | session 20 |

## 20.2 Transfer metrics reporting

| Metric | First reportable | Stronger confidence |
|---|---:|---:|
| FrameEfficiency_arrow | session 8 | session 8–9 |
| FrameTransferGain_arrow | session 8 | session 8–9 |
| CarrierRobustness_abs | session 12 | session 12–13 |
| FrameEfficiency_flow | session 16 | session 16–17 |
| FrameTransferIndex | session 16 | session 17 |
| MixedFrameStability | session 18 | session 20 |
| TransferScore_CCC | session 18 | session 20 |
| TransferScore_BSE | session 18 | session 20 |
| TransferReadiness | session 18 | session 20 |

---

# 21. Commercial interpretation

## 21.1 What the user sees

During sessions 1–16, the user sees a clear progression:

```text
Foundation
→ Frame Skills
→ Motion Skills
→ Motion Frame Skills
→ Mixed Mastery
```

Suggested labels:

| Phase | User-facing label |
|---|---|
| P1 | Direction Foundation |
| P2 | Frame Skills |
| P3 | Motion Skills |
| P4 | Motion Frame Skills |
| P5 | Mixed Mastery |

## 21.2 Transfer wording

Use:

```text
Frame Transfer
Motion Robustness
Mixed Stability
Transfer Readiness
```

Avoid:

```text
far transfer proven
carrier transfer proves IQ change
motion transfer means intelligence improvement
```

## 21.3 Result card examples

```text
Frame Transfer: 78
Your focus skill is carrying well from simple direction to frame-based direction.

Motion Robustness: 71
The same skill is still more effortful in motion patterns.

Mixed Stability: 66
You are building flexibility when the formats are mixed together.
```

---

# 22. Research interpretation

This no-probe design is not a pure untrained-transfer experiment.

It is a **blocked reconstruction and final mixed-stability design**.

The strongest defensible interpretation is:

```text
The user learned each cell to near-asymptote.
Transfer quality is estimated from:
1. how much capacity survives the absolute → relational shift,
2. how similar that shift is across carriers,
3. how much performance survives final four-way mixing.
```

Do not describe:

```text
relative flow performance as untrained transfer
mixed phase as proof of broad far transfer
absolute-to-relative improvement as causal transfer without qualification
```

Safer research wording:

```text
The protocol estimates relational-frame reconstruction, carrier robustness and mixed-wrapper stability after blocked training across the full carrier × frame matrix.
```

---

# 23. Optional validation-mode extension

A separate research mode may counterbalance the carrier order while preserving the frame-first rule within each carrier.

Commercial default:

```text
arrow absolute
→ arrow relational
→ flow absolute
→ flow relational
→ mixed
```

Validation alternative:

```text
flow absolute
→ flow relational
→ arrow absolute
→ arrow relational
→ mixed
```

This allows later estimation of carrier-order effects without changing the core transfer metric.

Important:

```text
Even in validation mode, the main transfer axis remains absolute → relational frame.
```

---

# 24. Implementation checklist

## Backend

- [ ] Replace carrier-group progression with fixed phase progression.
- [ ] Update measure IDs to the 8-cell construct × carrier × frame model.
- [ ] Store entry, asymptote and mixed capacity estimates per cell.
- [ ] Add Frame Transfer Index composite.
- [ ] Add Mixed Frame Stability composite.
- [ ] Add Frame Generality / interaction metric.
- [ ] Demote carrier transfer to Carrier Robustness.
- [ ] Keep full trial logging with timing quality.
- [ ] Keep server-side canonical scoring.

## Frontend

- [ ] Update training map to Foundation → Frame Skills → Motion Skills → Motion Frame Skills → Mixed Mastery.
- [ ] Remove flow-first onboarding.
- [ ] Remove rescue gate.
- [ ] Show Frame Transfer as primary transfer metric.
- [ ] Show Motion Robustness as secondary.
- [ ] Show Mixed Stability after final mixed phase.
- [ ] Avoid “probe” language in user-facing copy.
- [ ] Avoid any claim that transfer is proven.

## Analytics

- [ ] Calculate per-cell blocked asymptote.
- [ ] Calculate per-cell mixed stability.
- [ ] Calculate absolute → relational frame efficiency for arrows and optic flow.
- [ ] Calculate carrier robustness separately for absolute and relational frames.
- [ ] Calculate frame × carrier interaction cost.
- [ ] Calculate CCC and BSE transfer scores separately.
- [ ] Calculate vertical coherence between CCC and BSE.

---

# 25. Final system principle

The revised system should be governed by this rule:

```text
Do not treat motion transfer as the main far-transfer signal.
Treat the absolute → relational frame shift as the primary transfer target,
and use optic flow to test whether that relational-frame operation survives a dynamic carrier.
```

Compact form:

```text
Absolute arrows build the base signal policy.
Relative arrows train frame abstraction.
Absolute optic flow tests carrier robustness.
Relative optic flow reconstructs the frame abstraction in motion.
Four-way mixed play tests flexible transfer.
```

The defining question is:

```text
Did the user merely get better at each blocked format,
or did the extraction and binding policy survive the reference-frame shift
and remain stable when all four formats were mixed?
```
