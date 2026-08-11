# Cognitive Control Coach

Standalone Cognitive Control Coach app, created from the Attention Coach scaffold while preserving the existing Attention Coach and WM Coach folders unchanged.

Canonical route: `/cognitive-control-coach/`

Legacy routes stay operational during development and early validation:

- `/attention-coach/`
- `/wm-coach/`

## Product Contract

- `docs/PRODUCT_IMPLEMENTATION_SPEC_v0.2.md`
- Source app folder: `IQ-Coach/apps/cognitive-control-coach`
- P0: absolute Attention carrier transfer and core value mechanic
- P1a: relative-rule extension and full Attention Portability
- P1b: upward relational-WM introduction and WM carrier transfer
- P1c: Return to Now and bidirectional operator integration
- Public launch waits for the complete Attention -> WM -> Attention journey

## Current Implementation Stage

The P0 protocol layer is implemented in:

- `src/cccConfig.ts`
- `src/cccProgression.ts`
- `src/cccGenerator.ts`
- `src/cccValue.ts`
- `src/cccTypes.ts`

The copied Attention runtime remains as the UI scaffold while the CCC runtime is wired in stages. New CCC backend work uses the shared coach schema migration under `supabase/migrations/`.

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