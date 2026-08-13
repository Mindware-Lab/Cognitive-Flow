# Cognitive Control Coach

Standalone Cognitive Control Coach app, created from the Attention Coach scaffold while preserving the existing Attention Coach and WM Coach folders unchanged.

Canonical route: `/cognitive-control-coach/`

Legacy routes stay operational during development and early validation:

- `/attention-coach/`
- `/wm-coach/`

## Product Contract

- `docs/COGNITIVE_CONTROL_COACH_MULTISESSION_PROTOCOL_v0.4.md` — current v0.6 scientific and runtime contract (filename retained for links)
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
- `src/cccWmProgress.ts`

The playable runtime uses forced choice throughout, a frame-counted masked signal anchor, relative In/Out arrows, contraction/expansion optic flow, two niches per session and separate block feedback for signal, policy and trained-format portability. New CCC backend work uses the shared coach schema migration under `supabase/migrations/`.

P1b memory sessions use four A–B–A–B blocks, each with 20 scored comparisons plus `n` buffer items. The user chooses a presentation time before each block, and the task adapts by at most one n-back level after each A/B pair. The level is saved between days and restored from cloud progress when the user is signed in.

The programme is gate-based and its total length is performance-dependent. Programme completion is not synonymous with full transfer: repeated protected carrier change, recovery, return, mixed stability, relational-WM recovery, bidirectional re-entry and two fresh delayed checks are required. A supported unlock never awards `attention_portable` or `full_transfer`.

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
