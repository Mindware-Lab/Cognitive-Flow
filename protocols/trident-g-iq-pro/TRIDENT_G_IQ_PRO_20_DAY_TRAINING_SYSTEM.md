# Trident G IQ Pro 20-Day Training System

This document summarizes the current IQ Pro app training system as implemented in `products/trident-g-iq/apps/iq-pro`.

The app combines three training protocols:

1. Zone Coach: a 3-minute masked majority-direction readiness check.
2. Capacity Gym: adaptive n-back style cognitive-control training.
3. Reasoning Gym: adaptive reasoning-transfer items.

The coach-led system uses Zone Coach to create a daily training contract. That contract sets how much Capacity Gym and Reasoning Gym work should be completed before the session is considered done.

## Programme Shape

The core programme target is 20 coach-led core sessions. In practice this is the "20-day" training system when run once per day.

Core session phases:

| Sessions | Phase | Purpose |
| --- | --- | --- |
| 1-5 | Foundation | Build clean response habits with easier forms first. |
| 6-10 | Portability | Carry the skill into less familiar forms. |
| 11-15 | Integration | Combine skills under more control pressure. |
| 16-20 | Transfer | Hold the skill in the hardest transfer forms. |

The unified coach tracks completion in `coachState.programme.coreSessionNumber`. Support sessions are tracked separately and do not advance the core 20-session count.

## Coach-Led Daily Contract

The current app creates a unified coach contract after a valid Zone Check, or after the user explicitly skips the Zone Check. The contract records:

- session number and phase
- Zone route state
- route class
- target Capacity blocks
- target Reasoning items
- completed Capacity blocks
- completed Reasoning items
- selected Capacity family
- selected Reasoning family

Current route targets in `app.js`:

| Zone route | Route class | Capacity target | Reasoning target | Counts toward core 20 |
| --- | --- | ---: | ---: | --- |
| In Zone | core | 10 blocks | 10 items | Yes |
| Flat | core | 5 blocks | 8 items | Yes |
| Locked In | support | 4 blocks | 4 items | No |
| Spun Out | support | 3 blocks | 4 items | No |
| Invalid | recovery | 0 blocks | 0 items | No |

Note: older Zone handoff logic labels `Flat` as support, but the current unified coach contract treats `Flat` as a reduced core route that still counts toward the 20-session programme.

## Session Flow

The intended coach-led flow is:

1. Start in coach mode.
2. Run Zone Coach unless a fresh valid Zone Check already exists.
3. Zone Coach creates the unified contract.
4. Complete the Capacity Gym target.
5. Switch to Reasoning Gym.
6. Complete the Reasoning Gym target.
7. When both targets are complete, the contract is marked complete.
8. If the route counts toward core 20, the core session counter advances.

The UI strongly guides Capacity first. If Capacity is complete and Reasoning remains, the app prompts "Go to Reasoning Gym". If Reasoning is complete and Capacity remains, it prompts the user to return to Capacity Gym.

## 1. Zone Coach

Zone Coach is the pre-training readiness and route-setting protocol. In the app it is called "Zone Check" or "Zone Pulse".

Primary implementation files:

- `runtime/zone/probe.js`
- `runtime/zone/classifier.js`
- `runtime/zone/handoff.js`
- `app.js`

### What The User Does

The user completes a 3-minute masked majority-direction task:

- A fixation is shown.
- Five arrows appear briefly.
- A mask appears.
- The user presses left or right based on the direction most arrows pointed.
- Early keypresses before the response window are counted as false starts.
- Switching tabs, losing focus, or unstable browser timing can invalidate the run.

### Core Task Logic

Configuration in `ZONE_PROBE_CONFIG`:

- duration: 180 seconds
- arrows per trial: 5
- easy trials: 4 arrows point in the majority direction
- hard trials: 3 arrows point in the majority direction
- catch trials: all 5 arrows point in the same direction
- response timeout: 1500 ms
- stimulus starts around 80 ms and adapts between 25 ms and 220 ms
- bootstrap warmup: 40 seconds
- stream mix after warmup: 75% stair, 20% probe, 5% catch

During the bootstrap period, the app alternates easy and hard staircase trials. Once enough data exists, it freezes easy/hard probe durations based on recent staircase performance.

### Scoring And Features

The classifier extracts features from probe and catch trials:

- accuracy
- median reaction time
- reaction-time variability
- timeout rate
- slow lapse rate
- fast response rate
- fast error rate
- reaction-time volatility
- error burstiness
- reaction-time drift
- error drift
- post-error slowing
- catch failure rate
- bits-per-second estimate from staircase exposure duration

The app maintains personal baselines from recent valid Zone runs and uses those baselines to classify the current state.

### Zone States

The current states are:

- `in_zone`: low lapse/catch failure, stable responding, no dominant off-zone signature.
- `flat`: cold or low-energy signature, with more timeouts, slow lapses, slow-tail drift, or catch failures.
- `overloaded_explore`: unstable or scattered signature, with high variability, fast errors, or error bursts.
- `overloaded_exploit`: rigid/locked-in signature, with post-error slowing and slow steady responding.
- `invalid`: timing, focus, or task-quality failure.

Zone Coach does not itself complete a training session. It sets the route for Capacity Gym and Reasoning Gym.

## 2. Capacity Gym

Capacity Gym is the adaptive working-memory and cognitive-control training protocol.

Primary implementation files:

- `runtime/hub-engine.js`
- `runtime/scheduler.js`
- `runtime/metrics.js`
- `app.js`

### What The User Does

The user completes blocks of rapid n-back style trials. Each block has a target modality or relation. The user responds when the current item matches the item from N turns ago on the active target.

A block uses:

- a 3-2-1 countdown
- a sequence of trials
- a stimulus display window
- a response window
- per-trial hit, miss, false-alarm, and correct-rejection scoring

The app supports single-target blocks and dual-target blocks. In dual-target blocks, relation and surface responses are tracked separately.

### Capacity Families And Wrappers

Coach-led Capacity Gym cycles through families. Current core family cycle:

`flex -> bind -> relate -> resist -> flex -> relate -> bind -> resist -> relate`, then repeats.

For 20 core sessions this yields:

| Session | Capacity family |
| ---: | --- |
| 1 | Flex |
| 2 | Bind |
| 3 | Relate |
| 4 | Resist |
| 5 | Flex |
| 6 | Relate |
| 7 | Bind |
| 8 | Resist |
| 9 | Relate |
| 10 | Flex |
| 11 | Bind |
| 12 | Relate |
| 13 | Resist |
| 14 | Flex |
| 15 | Relate |
| 16 | Bind |
| 17 | Resist |
| 18 | Relate |
| 19 | Flex |
| 20 | Bind |

Families and wrappers:

| Family | Wrappers |
| --- | --- |
| Flex | `hub_cat`, `hub_noncat`, `hub_concept` |
| Bind | `and_cat`, `and_noncat` |
| Resist | `resist_vectors`, `resist_words`, `resist_concept` |
| Emotion | `emotion_faces`, `emotion_words` |
| Relate | `relate_vectors`, `relate_numbers`, `relate_vectors_dual`, `relate_numbers_dual` |

The current core coach cycle does not explicitly schedule Emotion, although the runtime supports it.

### Core Block Logic

Key Capacity constants:

- base trials per block: 20
- maximum N: 7
- slow SOA: 3000 ms
- fast SOA: 1400 ms
- display window: 65% of SOA
- match rate: about 30%
- lure rate: about 10%

The scheduler creates a sequence of match and non-match trials. The engine then creates display objects for the selected wrapper and target modality.

Target examples:

- location
- color
- symbol
- combined dimensions such as location-symbol or location-color
- relation
- dual relation/surface targets

### Adaptation

Capacity Gym adapts N by block outcome:

- `UP`: accuracy at least 90%.
- `HOLD`: accuracy between 75% and 90%.
- `DOWN`: accuracy below 75%.

For dual-target blocks:

- `UP`: relation accuracy at least 80%, surface accuracy at least 80%, and combined accuracy at least 90%.
- `DOWN`: relation accuracy below 75%, surface accuracy below 75%, or combined accuracy below 75%.

`UP` increases N by 1 up to 7. `DOWN` decreases N by 1 down to 1.

### Capacity Transfer Score

After each block, the app computes a Far Transfer Score from:

- core correctness
- complexity held
- stability and efficiency
- portability across wrappers, speed, family, or task form

Capacity blocks award g plasticity cells. The reward combines transfer score, improvement, stretch, and clean-hold bonuses.

## 3. Reasoning Gym

Reasoning Gym is the adaptive explicit reasoning-transfer protocol.

Primary implementation files:

- `runtime/reasoning/engine.js`
- `runtime/reasoning/families/relation-fit/*`
- `runtime/reasoning/families/must-follow/*`
- `app.js`

### What The User Does

The user answers short reasoning items. Items may be multiple choice, true/false, or multi-select. The app gives immediate feedback and records response quality and timing.

Coach-led Reasoning Gym uses two families:

- Relation Fit
- Must Follow

Current reasoning family cycle:

`relation_fit -> must_follow`, repeating across core sessions.

### Relation Fit

Relation Fit trains whether a candidate answer preserves a target relation or satisfies a relational constraint.

Examples of relation types:

- older/younger
- taller/shorter
- earlier/later
- north/south
- left/right
- heavier/lighter
- contains/inside
- same route
- all different
- comparative or directional made-up relations

Subtypes:

- `same_relation`: keep the same relationship.
- `resolve_slots`: satisfy a constraint match.

### Must Follow

Must Follow trains what is logically forced by the premises.

Subtypes:

- `choose_forced`: choose the one certain answer.
- `select_forced`: select all certain answers.

### Reasoning Block Logic

Core constants:

- core session target: 20
- core blocks per standalone reasoning session: 2
- core items per block: 5
- support items per block: 4
- manual item options: 4, 5, or 6
- partial reasoning sessions stay fresh for 39 minutes

In the unified coach flow, Reasoning Gym uses the contract target rather than a fixed standalone session target:

- In Zone: 10 reasoning items
- Flat: 8 reasoning items
- Locked In: 4 reasoning items
- Spun Out: 4 reasoning items

For core `In Zone` routes, items are grouped as 5 per block. For reduced/support routes, blocks use up to 4 items.

### Reasoning Adaptation

Reasoning blocks produce:

- accuracy
- precision and recall for multi-select items
- timeout count
- late-collapse flag
- mean response time
- error metrics
- Reasoning Transfer Score

The block decision is:

- `UP` if accuracy is at least 85%, no late collapse, multi-select precision and recall are at least 75%, and timeouts are at most 1.
- `DOWN` if accuracy is below 70%, late collapse occurs, multi-select precision or recall is below 60%, or timeouts are above 2.
- otherwise `HOLD`.

The family state then adapts tier, wrapper mode, speed, and subtype:

- successful early Relation Fit progresses from `same_relation` toward `resolve_slots`
- successful early Must Follow progresses from `choose_forced` toward `select_forced`
- later success can move from real-world wrappers to mixed/nonsense wrappers
- stable performance can unlock faster speed
- failure resets toward real-world, normal speed, and lower tier

### Reasoning Transfer Score

Reasoning Transfer Score combines:

- core correctness
- complexity held
- stability and efficiency
- portability into mixed or nonsense wrappers

Reasoning blocks also award g plasticity cells.

## Coach-Led Transition Protocol

### Fresh Zone Requirement

A fresh Zone Check remains valid for training for 39 minutes. If there is no fresh valid Zone Check before the first coach-led block, the app recommends a Zone Pulse.

The user can skip the Zone Pulse. Skipping creates a standard `In Zone` core route, labels the route as skipped, and creates a normal coach contract.

### Contract Creation

A valid Zone Check automatically creates a contract when either Capacity or Reasoning is in coach mode and no active contract already exists.

The contract locks the day's targets. Re-checking and replanning clears unfinished coached progress and asks the user to run a fresh Zone Check.

### Capacity To Reasoning

The primary flow is Capacity first:

1. Start the capacity route.
2. Complete the required number of Capacity blocks.
3. The app records each block against the contract.
4. Once Capacity target is complete, the app prompts the user to switch to Reasoning Gym.
5. Reasoning Gym completes the remaining item target.

### Reasoning To Capacity

If the user completes Reasoning first, or Reasoning is already done, the app checks whether Capacity blocks remain. If they do, it prompts the user to return to Capacity Gym.

### Completion

A contract is complete when:

- `capacityCompletedBlocks >= capacityTargetBlocks`
- `reasoningCompletedItems >= reasoningTargetItems`

When complete:

- the active contract is moved to completed history
- core routes advance the 20-session programme counter
- support routes advance the support-session counter
- completed block rewards remain in the wallet

### Recovery And Support Logic

Invalid Zone Check:

- no coach contract is created
- Capacity and Reasoning targets are zero
- user is prompted to repeat the check or use light manual practice

Locked In:

- support route
- reduced Capacity and Reasoning targets
- does not count toward core 20
- Reasoning family defaults to Must Follow

Spun Out:

- support route
- reduced Capacity and Reasoning targets
- does not count toward core 20
- Reasoning family defaults to Relation Fit

Flat:

- reduced core route in the current unified coach
- fewer Capacity blocks and Reasoning items
- still counts toward the 20-session core programme when completed

## Data And Progress Tracking

The app stores local state and queues cloud sync events for:

- Capacity history
- Reasoning history
- Zone runtime history
- unified coach contracts
- wallet/g plasticity cell events
- active module

Important storage keys:

- `tg_iq_live_capacity_v2`
- `tg_iq_live_reasoning_v1`
- `tg_iq_live_unified_coach_v1`
- `tg_iq_live_economy_v1`
- `iqmw.capacity.handoffFromZone`

Cloud/event hooks include:

- `zone_check_complete`
- `capacity_block_complete`
- `reasoning_block_complete`

## Implementation Map

| Area | Main files |
| --- | --- |
| App shell and unified coach | `app.js` |
| Zone task runtime | `runtime/zone/probe.js` |
| Zone classification | `runtime/zone/classifier.js` |
| Zone handoff | `runtime/zone/handoff.js` |
| Capacity block engine | `runtime/hub-engine.js` |
| Capacity scheduling | `runtime/scheduler.js` |
| Capacity metrics | `runtime/metrics.js` |
| Reasoning engine | `runtime/reasoning/engine.js` |
| Relation Fit generator | `runtime/reasoning/families/relation-fit/` |
| Must Follow generator | `runtime/reasoning/families/must-follow/` |

## High-Level Summary

The current Trident G IQ Pro app is a 20-session coached training system. Each core session starts with Zone Coach to estimate current control state. The result creates a contract that sets the amount and type of Capacity Gym and Reasoning Gym work. Capacity Gym trains adaptive n-back control across task families and wrappers. Reasoning Gym trains explicit relational and logical transfer. The coach joins them into a single session protocol: assess state, assign route, complete Capacity target, complete Reasoning target, then advance the 20-session programme only when the route qualifies as core.
