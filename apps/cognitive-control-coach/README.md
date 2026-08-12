# Cognitive Control Coach

Standalone Cognitive Control Coach app, created from the Attention Coach scaffold while preserving the existing Attention Coach and WM Coach folders unchanged.

Canonical route: `/cognitive-control-coach/`

Legacy routes stay operational during development and early validation:

- `/attention-coach/`
- `/wm-coach/`

## Product Contract

- `docs/COGNITIVE_CONTROL_COACH_MULTISESSION_PROTOCOL_v0.4.md` — current scientific and runtime contract
- `docs/COGNITIVE_CONTROL_COACH_DUAL_ESTIMAND_PROTOCOL_v0.3.md` — retained P0 design history
- `docs/PRODUCT_IMPLEMENTATION_SPEC_v0.2.md`
- Source app folder: `IQ-Coach/apps/cognitive-control-coach`
- P0: protected signal anchor, relative Attention policy and relative carrier transfer
- Guided P0: 80% relative In/Out observations; absolute Left/Right is practice and signal anchoring
- P1a: held-out and delayed relative-format portability validation
- P1b: upward relational-WM introduction and WM carrier transfer
- P1c: Return to Now and bidirectional operator integration
- Public launch waits for the complete Attention -> WM -> Attention journey

## Current Implementation Stage

The complete evidence-gated P0/P1a/P1b/P1c programme is implemented in:

- `src/cccConfig.ts`
- `src/cccProgression.ts`
- `src/cccGenerator.ts`
- `src/cccSignal.ts`
- `src/cccValue.ts`
- `src/cccFeedback.ts`
- `src/cccTypes.ts`
- `src/cccProgramme.ts`
- `src/cccProgrammeGenerator.ts`

The playable runtime uses forced choice throughout, a frame-counted masked signal anchor, relative In/Out arrows, contraction/expansion optic flow, two niches per session and separate block feedback for signal, policy and trained-format portability. New CCC backend work uses the shared coach schema migration under `supabase/migrations/`.

The implemented 124-choice journey is planned as an approximately 10–15 minute session. The versioned assumption model in `src/cccDuration.ts` estimates 8.2 minutes for a fast path, 11.6 minutes for the central scenario and 16.6 minutes for a deliberate path. These are pre-pilot planning values; observed duration telemetry must replace them.

The programme is gate-based. Its earliest consistently passing route is 15 sessions; 20 sessions remains the central pre-pilot planning case and 15–25 sessions the planning range. Programme completion is not synonymous with full transfer: repeated protected carrier change, recovery, return, mixed stability, relational-WM recovery, bidirectional re-entry and two fresh delayed checks are required. A supported unlock never awards `attention_portable` or `full_transfer`.

Each session uses two of four decision environments. The scheduler balances all six possible pairs across the programme, avoids an immediate pair repeat where possible and counterbalances within-session order. Full Transfer additionally requires all four environments to be represented with cumulative exposure balanced to within one session. When that final gate passes, the app opens a dedicated congratulations achievement screen; supported completion never receives it.

## Local Commands

```powershell
npm install
npm run test
npm run build
npm run dev
```

## Backend Shape

CCC uses the approved hybrid schema:

- Shared: `coach_sessions`, `coach_trials`, `coach_events`, `coach_protocol_assignments`
- App-specific: `cognitive_control_progress`

Existing Attention Coach and WM Coach data remain separate and are not converted into CCC progression credit.
