# Cognitive Bandwidth

IQ Coach's first webapp component: an adaptive, masked-arrow task for estimating and training cognitive-control capacity.

## Initial Release

The first release includes:

- Direction Bandwidth: majority Left versus Right
- Frame Bandwidth: majority Out versus In relative to a centre
- Frame Cost: the difference between usable Direction and Frame estimates
- email magic-link authentication
- frame-counted browser timing
- adaptive condition selection
- personal baselines, confidence labels, and timing-quality labels
- Cloudflare Pages frontend with a Supabase backend

Diagonal, spiral, mixed-wrapper, population-norm, leaderboard, Zone-state, and IQ-gain features are outside the initial release.

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
- response preferences
- Direction and Frame tutorials
- guided and adaptive demonstration trials
- SVG stimulus and mask rendering
- provisional MFT-M grouping-search estimates
- illustrative results and Frame Cost
- product roadmap and partner feedback flow
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

1. Apply `supabase/migrations/202606140001_partner_feedback.sql`.
2. Deploy `supabase/functions/partner-feedback`.
3. Configure `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
