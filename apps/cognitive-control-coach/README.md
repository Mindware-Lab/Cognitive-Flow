# Cognitive Control Coach

Standalone Cognitive Control Coach app built from the earlier Attention Coach scaffold.

Canonical public route: `/cognitive-control-coach/`

`/attention-coach/` is retained only as a redirect and historical source reference. Attention Coach is no longer a separate public offer.

## Public Product Proposition

Cognitive Control Coach trains three connected capabilities:

1. **Attention control** — recover the task-relevant majority relation under interference and changing visual formats.
2. **Relative-frame working memory** — hold and compare `IN / OUT / CLOCKWISE / ANTI-CLOCKWISE` relations in relative-frame n-back tasks, including transfer between arrow and optic-flow carriers.
3. **Adaptive decision timing** — learn when to commit under different speed, accuracy, reward and mistake-cost trade-offs rather than using one fixed response style.

Approved compact description:

> Train attention control, relative-frame working memory and decision timing. Recover the important relation, compare it across relative-frame n-back sequences, and adapt how quickly you decide when the trade-offs change.

The public tagline remains:

> **Focus, hold and update what matters.**

Supporting copy must make clear that the product includes working-memory and decision-making training, not only attention practice.

## Product Contract

- `docs/COGNITIVE_CONTROL_COACH_MULTISESSION_PROTOCOL_v0.4.md` — current v0.12 scientific and runtime contract; filename retained for existing links
- `docs/COGNITIVE_CONTROL_COACH_DUAL_ESTIMAND_PROTOCOL_v0.3.md` — retained P0 design history
- `docs/PRODUCT_IMPLEMENTATION_SPEC_v0.2.md`
- Source app folder: `IQ-Coach/apps/cognitive-control-coach`
- P0: protected signal anchor, relative attention policy and relative carrier transfer
- P1a: held-out and delayed relative-format portability validation
- P1b: relative-frame working-memory introduction and carrier transfer
- P1c: Return to Now and bidirectional operator integration

## Current Implementation

The complete evidence-gated P0/P1a/P1b/P1c programme is implemented in the `src/` modules, including `cccProgrammeGenerator.ts`, `cccLearningCurve.ts` and `cccWmProgress.ts`.

The runtime uses forced choice, a frame-counted masked signal anchor, relative radial or rotational arrows, and annular optic-flow segments defined relative to the common centre of the task field. Dots farther from the centre move slightly faster according to a shallow full-field motion gradient. It provides separate feedback for signal performance, decision strategy and transfer across trained formats.

### Relative-frame n-back

P1b memory sessions use four A–B–A–B blocks. The remembered token is the current spatial relation to the common centre (`IN`, `OUT`, `CLOCKWISE` or `ANTI-CLOCKWISE`), not an isolated object feature. Every display uses one coherent binary pair—radial or rotational—and never mixes the two. Users compare the current relation with the relation one or more steps back while the carrier can change between static arrows and moving optic-flow segments. The stream is continuous: each pattern remains visible until the next pattern replaces it, without an intervening mask or blank interval.

The user receives a worked example and short unscored practice before a new n-back level. Presentation time is selected before each scored block, n-back level adapts by at most one level after each A/B pair, and progress is restored from cloud storage when the user is signed in.

### Decision-making environments

Each session samples two of four decision environments. Together they vary:

- evidence clarity;
- time pressure;
- the reward available for a correct response;
- the cost of an error.

This trains selective speeding and slowing. The user should commit promptly when evidence is clear or delay is costly, but take more time when evidence is ambiguous or mistakes are expensive. The scheduler balances all six environment pairs across the programme and avoids immediate pair repetition where possible.

### Transfer boundary

Programme completion is not synonymous with full transfer. Protected carrier change, recovery, return, mixed stability, relative-frame WM recovery, bidirectional re-entry and two fresh delayed checks are required. A supported unlock never awards `attention_portable` or `full_transfer`.

## Local Commands

```powershell
npm install
npm test
npm run build
npm run dev
```

## Backend Shape

CCC uses the approved hybrid schema:

- Shared: `coach_sessions`, `coach_trials`, `coach_events`, `coach_protocol_assignments`
- App-specific: `cognitive_control_progress`

Historical Attention Coach and WM Coach data remain separate and are not converted into CCC progression credit.
