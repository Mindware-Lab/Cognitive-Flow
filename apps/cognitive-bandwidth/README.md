# IQ Coach Transfer Stack Demo

Partner-facing demonstration of a vertical transfer pathway from cognitive
bandwidth through frame memory and visual path prediction to explicit
reasoning transfer.

## Initial Release

The first release includes:

- Focus Under Pressure: user-facing label for Direction Bandwidth
- Frame-Shift Control: user-facing label for Frame Bandwidth
- Flexibility Cost: user-facing label for Frame Cost
- Relational Working Memory: mono vector 1-back and 2-back previews
- Path Prediction: fixed 34-event non-verbal Gabor stream with break,
  immediate-successor, and look-ahead probes
- Reasoning Transfer: eight symbolic and nonsense-semantic relation items
- responsive pathway diagram with live layer status and bottleneck flags
- segment-specific interpretation lenses
- final demo Transfer Readiness dashboard
- email magic-link authentication
- frame-counted browser timing
- adaptive condition selection
- personal baselines, confidence labels, and timing-quality labels
- Cloudflare Pages frontend with a Supabase backend

The relational working-memory preview follows IQ Pro's mono `relate_vectors`
mechanic: paired arrows appear at opposite points around a centre, and the
player presses MATCH when the canonical relative direction repeats at lag `n`.
It uses six relations (in, out, clockwise, counterclockwise, spiral in, spiral
out) and fixed `10 + n` blocks: 11 trials at 1-back and 12 at 2-back.

Additional CCC wrappers, dual n-back, population norms, leaderboards,
Zone-state integration, and IQ-gain claims remain outside the initial release.

The readiness scores are deliberately illustrative demo signals. They combine
block performance to communicate the proposed product logic and are not stable
norms, IQ scores, clinical outputs, or selection measures.

## Documentation

- [Implementation plan](IMPLEMENTATION_PLAN.md)
- [UX flow](docs/UX_FLOW.md)
- [Stimulus and scoring algorithms](docs/STIMULUS_AND_SCORING.md)
- [Architecture, data, and deployment](docs/ARCHITECTURE_AND_DATA.md)
- [Build roadmap](docs/BUILD_ROADMAP.md)
- [Partner evaluation prototype protocol](docs/PARTNER_EVALUATION_PROTOCOL.md)

## Planned Stack

- Vite
- TypeScript
- SVG stimulus rendering
- Supabase Auth, Postgres, RLS, and Edge Functions
- Cloudflare Pages
- Vitest and Playwright

## Source Protocols

The source specifications and visual references are under:

```text
protocols/MVP-2026/
```

The primary protocol files are:

- `ccc_protocol_specs.md`
- `CCC_capacity_measures.md`
- `UX.md`
- `iqm-ccc-app-style.css`
- `assets/1.png` through `assets/6.png`

## Current Status

The partner-evaluation vertical slice is implemented. It includes:

- scientific scope and prototype boundaries
- optional anonymous usability consent
- browser frame-timing check
- mouse and left/right arrow-key response controls
- Direction and Frame tutorials
- guided and adaptive demonstration trials
- SVG stimulus and mask rendering
- paper-proportional, versioned arrow and mask geometry
- provisional MFT-M grouping-search estimates
- practical training results with technical metrics shown second
- partner pilot outputs and de-identified cohort-report examples
- the four-layer IQ Coach pathway with returns between task components
- local demo-session logging for the final transfer profile
- partner feedback flow
- optional Supabase magic-link entry when environment variables are configured
- deployable Supabase partner-feedback storage and Edge Function

Run locally:

```powershell
npm.cmd install
npm.cmd run dev
```

Build and test:

```powershell
npm.cmd run build
npm.cmd test
```

Cloudflare Pages:

```powershell
npm.cmd run build
npx.cmd wrangler pages deploy dist --project-name iq-coach-cognitive-bandwidth
```

Supabase backend:

1. Apply the migrations in `supabase/migrations/`, including `202606140001_partner_feedback.sql` and `202606190001_partner_feedback_simplified.sql`.
2. Deploy `supabase/functions/partner-feedback`.
3. Configure `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
