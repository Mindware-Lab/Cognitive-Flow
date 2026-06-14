# Published MFT-M Consistency

## Current Direction Task

| Published property | Current implementation | Status |
| --- | --- | --- |
| Eight equidistant positions around fixation | Fixed-radius octagon | Consistent |
| Unique locations sampled without replacement | Five of eight per trial | Consistent for set size five |
| Horizontal left/right arrows | `abs_lr` vectors are `[-1, 0]` and `[1, 0]` | Consistent |
| Simultaneous arrow presentation | One SVG group shown on the same frame | Consistent |
| Eight solid diamond masks at all possible positions | Eight SVG diamonds replace the arrows | Consistent |
| Arrow length `0.37°` | Relative length fixed at `0.37 / 1.5` of radius | Proportionally consistent |
| Mask diameter `0.37°` | Exactly equal to rendered arrow length | Proportionally consistent |
| Item-centre radius approximately `1.5°` | Fixed renderer radius | Proportionally consistent |
| Exposure times 250, 500, 1000, 2000 ms | Frame-quantized pool uses all four | Consistent |
| Five-arrow ratios `5:0`, `4:1`, `3:2` | Same ratios; `5:0` used sparsely as a lapse check | Consistent adaptation |
| Set sizes 1, 3, and 5 | Set size fixed at five | Deliberate MVP adaptation |
| Adaptive incongruent pool `2:1`, `4:1`, `3:2` | Uses `4:1` and `3:2`; omits set-size-three `2:1` | Deliberate fixed-five adaptation |

## Important Limits

The renderer preserves the published geometry ratios at every CSS size, but an ordinary
web browser cannot guarantee absolute degrees of visual angle without calibrating physical
screen dimensions and viewing distance.

The original paper specifies total arrow length, not a complete arrowhead/shaft drawing.
Geometry version 1 therefore fixes and tests a conventional silhouette with a head length
of 35%, head width of 54%, and shaft width of 18% of total arrow length.

The Frame task changes arrow orientation relative to the centre. It uses the same display
geometry and majority operation, but it is an experimental extension rather than a
published MFT-M condition.

The partner prototype also differs from the laboratory procedure in session length,
mask/response sequencing, and the number of trials. It must continue to be described as
MFT-M-style or MFT-M-derived until a calibrated validation protocol reproduces the full
administration and establishes score correspondence.
