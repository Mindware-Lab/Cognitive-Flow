# Cognitive Control Coach Product And Implementation Spec v0.2

Status: v0.2 review amendments for developer implementation
Date: 2026-08-11
Product: IQ Mindware - Cognitive Control Coach
Canonical route: /cognitive-control-coach/
Source app path: IQ-Coach/apps/cognitive-control-coach

This document is retained as design history. The P0 response, estimand, reference-frame and feedback contract is superseded by `COGNITIVE_CONTROL_COACH_DUAL_ESTIMAND_PROTOCOL_v0.3.md`. In particular, P0 no longer exposes Withhold, and the main trained endpoint is relative In/Out rather than absolute Left/Right.

## Source And Route Decisions

- Use the new canonical live route `/cognitive-control-coach/`.
- Keep `/attention-coach/` and `/wm-coach/` operational during development and early validation.
- Do not redirect legacy routes until the complete P1 journey is live and legacy access has been tested.
- Create `IQ-Coach/apps/cognitive-control-coach`, initially based on Attention Coach.
- Preserve `IQ-Coach/apps/attention-coach` and `IQ-Coach/apps/wm-coach` unchanged.
- Preserve existing Attention Coach and WM Coach data separately.
- Do not convert existing progress into Cognitive Control Coach progression credit.
- Accounts and access may carry over, but portability, regimes, and value scores begin under the new versioned protocol.

## Backend Decision

Use the existing shared coach Supabase project, but implement a hybrid shared schema:

- `coach_sessions`
- `coach_trials`
- `coach_events`
- `coach_protocol_assignments`
- `cognitive_control_progress`

The generic tables must include `app_id`. Cognitive Control Coach state-machine details belong in `cognitive_control_progress`. Do not force future coaches to share Cognitive Control Coach's progression structure.

Recommended app id:

```text
cognitive_control_coach
```

## Public Scope

Build and privately pilot P0 first. The main public launch under the Cognitive Control Coach name should wait for P1: the complete Attention -> WM -> Attention journey.

An earlier release must be labelled as a preview.

## Response Labels

Attention response labels name the latent relation:

| Wrapper | Buttons |
| --- | --- |
| `arrow_abs` | Left / Right |
| `flow_abs` | Left / Right |
| `arrow_rel` | Inward / Outward |
| `flow_rel` | Inward / Outward |

Button positions remain stable within a user.

Relational WM always uses:

```text
Match / Different / Withhold
```

Withhold is always visible from P0.

## Classification Correction: Carrier Transfer vs Reference-Frame Extension

Strict horizontal carrier-transfer estimates are only:

- `arrow_abs <-> flow_abs`
- `arrow_rel <-> flow_rel`

Moving from `arrow_abs` to `arrow_rel` changes the reference-frame rule and response semantics. It remains within Attention Control, but it must be labelled internally as a reference-frame extension, not pristine carrier-only transfer.

Required attention sequence:

1. Stabilise absolute-arrow attention.
2. Transfer it to absolute flow.
3. Introduce the relative rule in the familiar arrow carrier with brief practice.
4. Transfer the relative rule from arrows to flow.
5. Mix all four formats to test broader attention portability.

`Shift the View` can appear before the absolute-to-relative transition, but that transition must not contribute to the strict carrier-transfer estimate.

## P0: Absolute Attention Carrier Transfer And Core Value Mechanic

P0 scope:

- Find the Signal only.
- `arrow_abs` and `flow_abs`.
- All four configurable regimes.
- Two regimes per session.
- Depleting points pot.
- Answer, Withhold, omission, and abort as distinct outcomes.
- Practice excluded from progression.
- Shift the View default-on behind a feature flag.
- First-contact, recovery, return, and mix controller.
- Core telemetry in the new `coach_*` schema.

## P1a: Relative Rule Extension And Full Attention Portability

P1a scope:

- Add `arrow_rel` and `flow_rel`.
- Treat `arrow_abs -> arrow_rel` as reference-frame extension.
- Treat `arrow_rel -> flow_rel` as strict relative carrier transfer.
- Add held-out and delayed checks.
- Gate Attention Portability only after recovery, mixed stability, policy flexibility, held-out survival, and delayed confirmation.
- Store supported unlock as `supported_unlock`, never as `attention_portable`.

## P1b: Upward WM Introduction And WM Carrier Transfer

P1b scope:

- Introduce relational WM only after Attention Portability or supported unlock.
- First WM block uses a familiar wrapper and familiar regime pair.
- Relational WM supports 1-back and 2-back at launch.
- WM responses are Match / Different / Withhold.
- Never switch operator and wrapper at the same boundary.
- Port the relational n-back generator concepts from WM Coach, but remove Binding WM from the core v1 path.

## P1c: Return To Now And Bidirectional Operator Integration

P1 must include formal downward reconstruction from WM back to Attention.

Required Return to Now loop:

1. Run a matched Attention microcycle before the WM block.
2. Train relational WM in the same wrapper and regimes.
3. Run a matched Return to Now Attention microcycle afterwards.
4. Apply targeted Attention remediation when WM errors appear to arise from present-relation extraction.
5. Later, use explicitly cued Attention <-> WM mini-blocks.
6. Never switch operator and wrapper simultaneously.

Target loop:

```text
Attention -> Relational WM -> Attention re-entry
```

## Provisional Pilot Configuration: ccc-pilot-v0.1

All values must be remotely configurable and versioned.

### Shared Trial Timing

| Parameter | Starting value |
| --- | ---: |
| Fixation/orienting cue | 350 ms |
| Minimum exposure before answering | 350 ms |
| Maximum response window | 4000 ms |
| Outcome feedback | 350 ms |
| Inter-trial interval | 250 ms |
| Voluntary Withhold | 0 points |
| Omission | 0 points, recorded separately |
| Balanced microcycle | 6 valid trials per regime |
| Minimum before flattening assessment | 3 balanced microcycles |

Use one 4000 ms deadline initially. Response times stay comparable while reward drain supplies time pressure.

### Decision Environments

| Regime | 5:0 | 4:1 | 3:2 | Correct pot | Error loss | Drain |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Clear Sprint | 60% | 30% | 10% | +50 | -10 | 15 points/s |
| Calculated Risk | 10% | 30% | 60% | +50 | -10 | 15 points/s |
| Clean Precision | 60% | 30% | 10% | +10 | -50 | 2.5 points/s |
| Deep Check | 10% | 30% | 60% | +10 | -50 | 1.5 points/s |

These are stimulus-distribution priors, not deterministic rules. Target classes must be balanced within each wrapper and regime. For the first pilot, manipulate majority ratio only; defer added coherence/noise dimensions until the timing and payoff behaviour is understood.

Only two regimes run in one session:

- Clear Sprint + Deep Check
- Calculated Risk + Clean Precision

### Relational WM Parameters

| Parameter | Starting value |
| --- | ---: |
| Onset-to-onset cadence | 4500 ms |
| Response deadline | 4000 ms |
| Initial level | 1-back |
| Launch progression | 1-back -> 2-back |
| Match frequency | 50% |
| Different frequency | 50% |
| Wrong-lag lures | 25% of feasible Different trials |
| Regime transition | Reset memory buffer |
| Buffer items | First `n` items excluded from scoring |
| Suggested n-level advancement | >=75% answered accuracy and <=10% omissions for two balanced cycles |

The next item must remain on the fixed cadence even when the player responds early. Faster responses must not alter the memory task itself.

### Delayed And Supported Unlock Rules

- Delayed re-entry requires at least 18 hours.
- Target delayed interval is 24-72 hours.
- Use at least 12 fresh valid decisions, balanced across the two regimes.
- Offer supported unlock after three valid but unsuccessful portability checks, provided at least five Attention sessions have been completed.
- Store supported unlock as `supported_unlock`, never as `attention_portable`.

## Shift The View Implementation

Consumer builds:

- Show the 30-second reversible sphere at eligible major transitions.
- Keep the public label Shift the View.
- Do not call it an entropy intervention.
- Store `shift_view_enabled` and stimulus parameters in configuration.
- Provide a duration-matched reduced-motion transition.
- Never use reversal taps, sphere formation, or condition assignment in difficulty, routing, scores, or unlocks.
- Put deterministic pulse-versus-neutral allocation behind explicit research configuration.

## Telemetry Requirements Added By v0.2

Trial records must capture:

- `app_id`
- `protocol_version`
- `config_version`
- `operator`
- `wrapper`
- `regime`
- `phase`
- `relation_class`
- `evidence_level`
- `majority_ratio`
- `n_level` where relevant
- `match_status` where relevant
- `lure_type` where relevant
- `initial_reward`
- `drain_rate_per_second`
- `error_loss`
- `withhold_value`
- `omission_value`
- `minimum_exposure_ms`
- `deadline_ms`
- `response_class`
- `correct`
- `response_time_ms`
- `reward_remaining`
- `points_realised`
- `normalised_value`
- `practice`
- `diagnostic`
- `assisted_first_contact`
- `valid_for_progression`
- `invalid_reason`
- `viewport_class`
- `input_mode`

Events must capture:

- regime transitions
- wrapper transitions
- operator transitions
- Shift the View exposure and interactions
- Return to Now microcycle boundaries
- focus loss, background tab, pause, resize, abort, and timing-quality events
- controller decisions with rule version, inputs, and reason

## Revised Development Sequence

```text
P0: absolute Attention carrier transfer and core value mechanic
P1a: relative-rule extension and full Attention Portability
P1b: upward WM introduction and WM carrier transfer
P1c: Return to Now and bidirectional operator integration
Public launch: complete Cognitive Control Coach journey
```

## Remaining Implementation Questions

These are pilot/engineering lock questions, not product-direction blockers:

1. Exact UI wording and icon set for the four regimes.
2. Exact visual design language for the renamed app.
3. Whether the first preview build should expose `/cognitive-control-coach/` only behind access control or via an unlinked public preview.
4. The remote-configuration source for `ccc-pilot-v0.1` values.
5. The exact SQL column split between typed fields and JSON payload fields in `coach_trials` and `coach_events`.
6. The migration plan for account access without progression credit conversion.
7. The final QA matrix for desktop/mobile/reduced-motion before private pilot.
