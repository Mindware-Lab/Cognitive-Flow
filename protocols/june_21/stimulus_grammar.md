# IQ Coach Stimulus Syntax v1

## Orthogonal state-space specification

## 1. Design rule

Version 1 uses only orthogonal stimulus dimensions.

Do not include:

```text
diagonal direction
oblique Gabor tilt
spiral motion
spiral arrow direction
±45° relational Gabor offset
mixed oblique axes
```

The first version should be built around clean binary-opposite axes:

```text
left / right
up / down
out / in
clockwise / anticlockwise
horizontal / vertical
radial / tangential
slow / fast
low / high
```

The purpose is to create a shared stimulus grammar that can be reused across:

```text
Attention Control
Relational Memory
Binding Memory
Path Prediction
Reasoning
```

The same state-space is used at each layer, but the cognitive operation changes.

```text
Attention Control:
extract the current relation

Relational Memory:
hold and compare the relation across delay

Binding Memory:
bind relation to colour, speed, frequency or context

Path Prediction:
learn transitions between states

Reasoning:
recover the same relation in symbolic or semantic form
```

---

## 2. Core syntax

Use this as the top-level state object:

```ts
type VisualState = {
  carrier: Carrier;
  frame: Frame;
  axis: Axis;
  polarity: Polarity;
  feature?: FeatureState;
  colour?: Colour;
  context?: Context;
};
```

The conceptual formula is:

```text
state =
carrier
× frame
× axis
× polarity
× optional feature
× optional colour/context
```

---

## 3. Carrier

```ts
type Carrier =
  | "arrow"
  | "gabor"
  | "optic_flow";
```

### Carrier meaning

```text
arrow:
static symbolic-direction carrier

gabor:
static form-feature carrier

optic_flow:
dynamic motion-field carrier
```

---

## 4. Frame

```ts
type Frame =
  | "absolute"
  | "relational";
```

### Absolute frame

The relation is defined in screen-centred coordinates.

```text
left / right
up / down
horizontal / vertical
slow / fast
```

### Relational frame

The relation is defined relative to a centre point.

```text
out / in
clockwise / anticlockwise
radial / tangential
expansion / contraction
rotation clockwise / rotation anticlockwise
```

---

## 5. Axis

```ts
type Axis =
  // absolute screen axes
  | "x_axis"
  | "y_axis"

  // relational polar axes
  | "radial_axis"
  | "tangential_axis"

  // Gabor feature axes
  | "orientation_axis"
  | "spatial_frequency_axis"

  // optic-flow feature axes
  | "flow_direction_axis"
  | "flow_speed_axis";
```

---

## 6. Polarity

Polarity is the binary value on the selected axis.

```ts
type Polarity =
  // absolute direction
  | "left"
  | "right"
  | "up"
  | "down"

  // relational arrow or flow direction
  | "out"
  | "in"
  | "clockwise"
  | "anticlockwise"

  // Gabor orientation
  | "horizontal"
  | "vertical"

  // Gabor spatial frequency
  | "low_spatial_frequency"
  | "high_spatial_frequency"

  // Gabor relational orientation
  | "radial_aligned"
  | "tangential_aligned"

  // optic-flow speed
  | "slow"
  | "fast"

  // optic-flow radial motion
  | "expansion"
  | "contraction";
```

---

## 7. Carrier-specific syntax

## 7.1 Arrow states

### Arrow absolute states

```ts
type ArrowAbsoluteState =
  | {
      carrier: "arrow";
      frame: "absolute";
      axis: "x_axis";
      polarity: "left" | "right";
    }
  | {
      carrier: "arrow";
      frame: "absolute";
      axis: "y_axis";
      polarity: "up" | "down";
    };
```

Examples:

```text
arrow.absolute.x_axis.left
arrow.absolute.x_axis.right
arrow.absolute.y_axis.up
arrow.absolute.y_axis.down
```

### Arrow relational states

```ts
type ArrowRelationalState =
  | {
      carrier: "arrow";
      frame: "relational";
      axis: "radial_axis";
      polarity: "out" | "in";
    }
  | {
      carrier: "arrow";
      frame: "relational";
      axis: "tangential_axis";
      polarity: "clockwise" | "anticlockwise";
    };
```

Examples:

```text
arrow.relational.radial_axis.out
arrow.relational.radial_axis.in
arrow.relational.tangential_axis.clockwise
arrow.relational.tangential_axis.anticlockwise
```

### Arrow v1 exclusions

Do not include:

```text
diagonal arrows
spiral arrows
oblique arrow directions
```

---

## 7.2 Gabor states

A Gabor has an orientation axis, not an intrinsic direction vector. Therefore, Gabor relational states should use radial/tangential alignment, not out/in or clockwise/anticlockwise direction.

### Gabor absolute states

```ts
type GaborAbsoluteState =
  | {
      carrier: "gabor";
      frame: "absolute";
      axis: "orientation_axis";
      polarity: "horizontal" | "vertical";
    }
  | {
      carrier: "gabor";
      frame: "absolute";
      axis: "spatial_frequency_axis";
      polarity: "low_spatial_frequency" | "high_spatial_frequency";
    };
```

Examples:

```text
gabor.absolute.orientation_axis.horizontal
gabor.absolute.orientation_axis.vertical
gabor.absolute.spatial_frequency_axis.low_spatial_frequency
gabor.absolute.spatial_frequency_axis.high_spatial_frequency
```

### Gabor relational states

```ts
type GaborRelationalState =
  {
    carrier: "gabor";
    frame: "relational";
    axis: "radial_axis";
    polarity: "radial_aligned" | "tangential_aligned";
  };
```

Examples:

```text
gabor.relational.radial_axis.radial_aligned
gabor.relational.radial_axis.tangential_aligned
```

### Gabor v1 exclusions

Do not include:

```text
left-tilted vs right-tilted
45° vs 135°
±45° radial offset
oblique orientation progression
phase drift
moving Gabors
```

Those can be added later as v2 or research wrappers.

---

## 7.3 Optic-flow states

Optic flow has true motion vectors, so it can support both absolute and relational motion states.

### Optic-flow absolute states

```ts
type OpticFlowAbsoluteState =
  | {
      carrier: "optic_flow";
      frame: "absolute";
      axis: "x_axis";
      polarity: "left" | "right";
      feature?: { speed: "slow" | "fast" };
    }
  | {
      carrier: "optic_flow";
      frame: "absolute";
      axis: "y_axis";
      polarity: "up" | "down";
      feature?: { speed: "slow" | "fast" };
    }
  | {
      carrier: "optic_flow";
      frame: "absolute";
      axis: "flow_speed_axis";
      polarity: "slow" | "fast";
    };
```

Examples:

```text
optic_flow.absolute.x_axis.left.slow
optic_flow.absolute.x_axis.right.fast
optic_flow.absolute.y_axis.up.slow
optic_flow.absolute.y_axis.down.fast
optic_flow.absolute.flow_speed_axis.slow
optic_flow.absolute.flow_speed_axis.fast
```

### Optic-flow relational states

```ts
type OpticFlowRelationalState =
  | {
      carrier: "optic_flow";
      frame: "relational";
      axis: "radial_axis";
      polarity: "expansion" | "contraction";
      feature?: { speed: "slow" | "fast" };
    }
  | {
      carrier: "optic_flow";
      frame: "relational";
      axis: "tangential_axis";
      polarity: "clockwise" | "anticlockwise";
      feature?: { speed: "slow" | "fast" };
    };
```

Examples:

```text
optic_flow.relational.radial_axis.expansion.slow
optic_flow.relational.radial_axis.contraction.fast
optic_flow.relational.tangential_axis.clockwise.slow
optic_flow.relational.tangential_axis.anticlockwise.fast
```

### Optic-flow v1 exclusions

Do not include:

```text
spiral flow
diagonal translation
combined expansion + rotation
continuous speed gradients
multi-speed fields
```

---

## 8. Colour

Colour should not be treated as a carrier.

Colour is a binding, context or wrapper dimension.

```ts
type Colour =
  | "blue"
  | "yellow"
  | "green"
  | "purple";
```

### Colour use by layer

```text
Attention Control:
colour absent, irrelevant or a non-scored wrapper

Relational Memory:
colour optional, usually irrelevant at first

Binding Memory:
colour becomes a scored binding dimension

Path Prediction:
colour can act as a context gate or state feature

Reasoning:
colour/context can be translated into symbolic or semantic conditions
```

### Colour examples

```text
arrow.relational.radial_axis.out.blue
gabor.absolute.orientation_axis.horizontal.yellow
optic_flow.relational.radial_axis.expansion.green
```

---

## 9. Context

Context is an optional hidden or visible rule gate.

```ts
type Context =
  | "K"
  | "L"
  | null;
```

Use context later for rule/constraint families:

```text
If context K:
  OUT → CW

If context L:
  OUT → IN
```

In v1, context can be implemented as colour:

```text
blue = context K
yellow = context L
```

or stored separately:

```ts
context: "K"
colour: "blue"
```

---

## 10. Version 1 state grammar

The full v1 syntax can be written as:

```ts
type StimulusStateV1 =
  | ArrowAbsoluteState
  | ArrowRelationalState
  | GaborAbsoluteState
  | GaborRelationalState
  | OpticFlowAbsoluteState
  | OpticFlowRelationalState;
```

With optional binding fields:

```ts
type BoundStimulusStateV1 = StimulusStateV1 & {
  colour?: Colour;
  context?: Context;
};
```

---

## 11. Compact symbolic notation

Use a compact notation for graph and logging.

```text
carrier.frame.axis.polarity[.feature][.colour][.context]
```

Examples:

```text
arrow.abs.x.left
arrow.abs.y.up
arrow.rel.radial.out
arrow.rel.tangent.cw

gabor.abs.orientation.horizontal
gabor.abs.orientation.vertical
gabor.abs.sf.low
gabor.abs.sf.high
gabor.rel.radial.radial_aligned
gabor.rel.radial.tangential_aligned

flow.abs.x.left.fast
flow.abs.y.up.slow
flow.rel.radial.expand.fast
flow.rel.radial.contract.slow
flow.rel.tangent.cw.fast
flow.rel.tangent.ccw.slow
```

---

## 12. State-space size

### Relation-only state space

If each active block uses four relation categories:

```text
H_relation = log2(4) = 2 bits
```

Example active set:

```text
LEFT
RIGHT
UP
DOWN
```

or:

```text
OUT
IN
CW
CCW
```

### Relation × colour state space

If using four relation categories and four colours:

```text
state_count = 4 × 4 = 16
H_bound_state = log2(16) = 4 bits
```

### Relation × feature × colour state space

Example:

```text
optic-flow relational:
4 relations × 2 speeds × 4 colours
= 32 bound states
H = log2(32) = 5 bits
```

Do not expose the full state space immediately. Use small active subsets:

```text
4 active relation states
2 active colours
1 active carrier
1 active frame
```

Then expand through wrapper swaps.

---

## 13. Layer mapping

## 13.1 Attention Control

Question:

```text
Which relation is currently in the majority?
```

Use:

```text
carrier × frame × relation
```

Colour should be absent or irrelevant.

Example:

```text
5 Gabor patches
3 radial-aligned
2 tangential-aligned
Correct relation: radial-aligned
```

## 13.2 Relational Memory

Question:

```text
Does the current relation match n-back?
```

Use:

```text
carrier × frame × relation
```

Example:

```text
OUT → CW → OUT
2-back = match
```

## 13.3 Binding Memory

Question:

```text
Does the current bound state match n-back?
```

Use:

```text
carrier × frame × relation × colour/context
```

Example:

```text
OUT + blue → CW + yellow → OUT + blue
2-back = match
```

## 13.4 Path Prediction

Question:

```text
What usually comes next?
Did the transition break the graph?
Can this path still reach the target?
```

Use:

```text
state → transition → successor state
```

Example:

```text
blue OUT → yellow CW
yellow CW → green IN
```

The user learns:

```text
OUT-blue usually leads to CW-yellow
```

## 13.5 Reasoning

Question:

```text
What follows from the same relation expressed symbolically or verbally?
```

Example symbolic translation:

```text
If blue OUT, then yellow CW.
Blue OUT occurred.
Therefore yellow CW is expected.
```

---

## 14. Orthogonal wrapper progression

A simple v1 progression:

```text
1. arrow absolute x-axis
2. arrow absolute y-axis
3. arrow relational radial axis
4. arrow relational tangential axis

5. gabor absolute orientation axis
6. gabor absolute spatial-frequency axis
7. gabor relational radial/tangential alignment

8. optic-flow absolute x-axis
9. optic-flow absolute y-axis
10. optic-flow relational radial axis
11. optic-flow relational tangential axis
12. optic-flow speed axis
```

Then add mixed blocks:

```text
arrow absolute x/y mixed
arrow relational radial/tangential mixed
gabor absolute orientation/SF mixed
gabor relational alignment mixed
flow absolute x/y mixed
flow relational radial/tangential mixed
gabor ↔ optic-flow transfer
arrow ↔ gabor transfer
delayed mixed re-check
```

---

## 15. Valid v1 state examples

```json
{
  "carrier": "arrow",
  "frame": "absolute",
  "axis": "x_axis",
  "polarity": "left"
}
```

```json
{
  "carrier": "gabor",
  "frame": "relational",
  "axis": "radial_axis",
  "polarity": "radial_aligned",
  "colour": "blue"
}
```

```json
{
  "carrier": "optic_flow",
  "frame": "relational",
  "axis": "radial_axis",
  "polarity": "expansion",
  "feature": {
    "speed": "fast"
  },
  "colour": "yellow",
  "context": "K"
}
```

---

## 16. Invalid v1 states

These should be rejected by the state validator:

```json
{
  "carrier": "gabor",
  "frame": "relational",
  "axis": "radial_axis",
  "polarity": "out"
}
```

Reason:

```text
Gabor orientation has no intrinsic out/in direction.
Use radial_aligned or tangential_aligned instead.
```

```json
{
  "carrier": "arrow",
  "frame": "absolute",
  "axis": "diagonal_axis",
  "polarity": "diagonal_a"
}
```

Reason:

```text
Diagonals are not included in v1.
```

```json
{
  "carrier": "optic_flow",
  "frame": "relational",
  "axis": "spiral_axis",
  "polarity": "spiral_out"
}
```

Reason:

```text
Spiral flow is not included in v1.
```

---

## 17. Final v1 principle

The first version should train:

```text
same relation
×
absolute or relational frame
×
arrow, Gabor or optic-flow carrier
×
optional colour/context binding
×
memory, binding and SR operations
```

But it should avoid oblique and spiral dimensions until the orthogonal grammar is stable.

The clean v1 rule is:

```text
orthogonal first,
oblique later,
spiral last.
```
