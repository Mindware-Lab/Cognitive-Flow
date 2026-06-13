# Cognitive Bandwidth Build Roadmap

## Phase 0: Scaffold

Deliver:

- Vite/TypeScript app
- base CSS and shell
- Supabase client
- migrations and RLS
- email authentication
- staging Cloudflare Pages project
- protocol and algorithm version constants

Exit criteria:

- app builds
- staging authentication works
- database security tests pass

## Phase 1: Direction Task

Deliver:

- SVG arrow renderer
- octagon geometry
- deterministic `abs_lr` generator
- fixation, stimulus, mask, response, and feedback runner
- frame timing logs
- tutorial
- in-memory and IndexedDB block buffer

Exit criteria:

- seeded trials reproduce exactly
- all responses derive correctly from vectors
- no network or storage work occurs during critical display states
- masks render correctly on representative devices

## Phase 2: Scoring and Adaptation

Deliver:

- grouping-search likelihood model
- capacity fit
- profile interval and confidence
- initial condition coverage
- Fisher-information selector
- adaptive stopping
- authenticated block submission
- server canonical finalization

Exit criteria:

- synthetic-user simulation meets documented bias and coverage limits
- client and server estimates agree
- Direction results and personal baselines render correctly

## Phase 3: Frame Task

Deliver:

- deterministic `rel_inout` generator
- Frame tutorial
- adaptive Frame sessions
- relational score language
- Frame Cost eligibility rules

Exit criteria:

- geometry and category tests pass
- comprehension pilot passes
- customer copy distinguishes the validated foundation from the experimental extension

## Phase 4: Product UX

Deliver:

- Today
- Train
- Results
- Settings
- interrupted-session recovery
- retry queue
- data export and deletion
- accessibility settings

Exit criteria:

- first-run and returning-user journeys work
- temporary network loss does not lose completed trials
- all critical UX checklist items pass

## Phase 5: Production Validation

Deliver:

- staging pilot
- real-device timing report
- test-retest report
- completion and abandonment report
- claims and privacy review
- production deployment

Exit criteria:

- supported device classes have acceptable timing behavior
- scoring confidence labels are backed by simulation and pilot evidence
- production Supabase and Cloudflare configurations are isolated from staging

## Post-Launch Phase

Add in this order:

1. `abs_ud`
2. `rel_cwccw`
3. validated mixed-wrapper blocks
4. research Wrapper Recovery metrics
5. customer-facing Flexible Bandwidth and Wrapper Recovery
6. diagonal and spiral only after comprehension and reliability studies

## Initial Release Definition of Done

A signed-in user can:

- run the timing check
- learn Direction and Frame rules
- complete Quick or Standard sessions
- resume interrupted work
- receive server-computed bandwidth estimates
- see confidence and timing quality
- see Frame Cost when eligible
- review personal history
- export or request deletion of data

The system can:

- reproduce every scored stimulus
- record actual exposure timing
- exclude contaminated trials
- validate submissions server-side
- fit the canonical grouping-search model
- adapt conditions
- preserve immutable trial records
- enforce private access through RLS
- deploy from this app directory to Cloudflare Pages

