# Cognitive Control Coach

Standalone Cognitive Control Coach app, created from the Attention Coach scaffold while preserving the existing Attention Coach and WM Coach folders unchanged.

Canonical route: `/cognitive-control-coach/`

Legacy routes stay operational during development and early validation:

- `/attention-coach/`
- `/wm-coach/`

## Product Contract

- `docs/COGNITIVE_CONTROL_COACH_DUAL_ESTIMAND_PROTOCOL_v0.3.md` — current scientific and runtime contract
- `docs/PRODUCT_IMPLEMENTATION_SPEC_v0.2.md`
- Source app folder: `IQ-Coach/apps/cognitive-control-coach`
- P0: protected signal anchor, relative Attention policy and relative carrier transfer
- Guided P0: 80% relative In/Out observations; absolute Left/Right is practice and signal anchoring
- P1a: held-out and delayed relative-format portability validation
- P1b: upward relational-WM introduction and WM carrier transfer
- P1c: Return to Now and bidirectional operator integration
- Public launch waits for the complete Attention -> WM -> Attention journey

## Current Implementation Stage

The P0 protocol layer is implemented in:

- `src/cccConfig.ts`
- `src/cccProgression.ts`
- `src/cccGenerator.ts`
- `src/cccSignal.ts`
- `src/cccValue.ts`
- `src/cccFeedback.ts`
- `src/cccTypes.ts`

The playable runtime uses forced choice throughout, a frame-counted masked signal anchor, relative In/Out arrows, contraction/expansion optic flow, two niches per session and separate block feedback for signal, policy and trained-format portability. New CCC backend work uses the shared coach schema migration under `supabase/migrations/`.

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
