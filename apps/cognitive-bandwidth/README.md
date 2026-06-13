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

Planning and implementation documentation only. Runtime code has not yet been scaffolded.
