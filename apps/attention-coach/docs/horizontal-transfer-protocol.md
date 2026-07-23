# Attention Coach Horizontal Transfer Protocol

Implementation reference for `attention-horizontal-v2`.

## Wrapper Definitions

The four protocol wrapper IDs are preserved for compatibility:

| Wrapper | Carrier | Reference computation | Response axis |
| --- | --- | --- | --- |
| `arrow_abs` | arrow | fixed axis | LEFT / RIGHT |
| `flow_abs` | local optic-flow patches | fixed axis | LEFT / RIGHT |
| `arrow_rel` | arrow | common centre | IN / OUT |
| `flow_rel` | local optic-flow patches | common centre | IN / OUT |

`arrow_abs` and `flow_abs` classify each item by net left/right direction independent of item position. `arrow_rel` and `flow_rel` classify each item by whether its vector points inward or outward relative to the shared display centre.

Clockwise, anticlockwise, spiral, displaced-centre, response-remapping, evidence-accumulation, and working-memory variants are outside this four-wrapper route.

## Controller Route

The evidence-gated route remains:

```text
arrow_abs
-> diagnostic flow_abs probes
-> formal 20% flow_abs probe
-> flow_abs recovery
-> return to arrow_abs
-> progressive arrow_abs / flow_abs mixing
-> arrow_rel probe and recovery
-> return to arrow_abs
-> progressive arrow_abs / arrow_rel mixing
-> protected flow_rel probe
-> flow_rel recovery
-> all-four-wrapper mixing
-> delayed all-four-wrapper re-check
```

Session number alone must not advance the route. Accuracy above 82% must not block progression when the configured stability gates pass.

## Evidence Rules

Diagnostic target-wrapper trials are logged but excluded from target-wrapper recovery and progression evidence. Base-wrapper trials from the same diagnostic block remain valid evidence.

Mixed trials must store the actual atomic wrapper used on the trial. `mixed` remains a compatibility label, not an atomic wrapper.

## Rule Cues

Per-trial cues are shown only when a block can switch between response axes:

```text
LEFT / RIGHT
IN / OUT
```

Cue time precedes fixation and is excluded from stimulus exposure timing and capacity calculations.

## Held-Out And Delayed Status

Before the protected `flow_rel` probe, `flow_rel` is excluded from free-play pools. Any premature `flow_rel` exposure marks the held-out condition contaminated or rebaseline-needed.

Portable status requires a fresh delayed-recheck block with all-four-wrapper evidence passing the existing mixed-stability and timing checks. Historical mixed evidence and ordinary training trials from the same session do not count toward the delayed decision.
