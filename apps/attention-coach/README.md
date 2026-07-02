# Attention Coach

Standalone WAP-based Attention Coach app.

## Source Specs

- `specs/CCC/TrainingProtocol_specs_v2.md`
- `specs/CCC/attention_coach_ux.md`
- `UX/digital_health.apps_ux.md`
- `apps/cognitive-bandwidth` exam-resilience demo CSS and interaction style

## Architecture

- Vite + TypeScript frontend
- Modular DOM-free protocol modules in `src/protocol.ts`, `src/generator.ts`, `src/wap.ts`, and `src/scoring.ts`
- Supabase tables and Edge Functions under `supabase/`
- Cloudflare Pages config in `wrangler.toml`

## Local Commands

```powershell
npm install
npm run test
npm run build
npm run dev
```

## Protocol Defaults

- WAP = Wrapper Adaptive Progression
- 20 sessions is a target envelope only
- Scored session = 80 trials total = four 20-trial mini-blocks
- V1 split = 60 ACC + 20 BSE
- ACC drives WAP progression
- BSE is collected every session but does not block wrapper swaps
