 # IQ Coach Shared Stimulus Generator Specification

Component: Shared stimulus generator  
Product: IQ Coach  
Target app path: `products/trident-g-iq/apps/iq-coach/`  
Spec version: v3 clean Markdown  
Purpose: Provide a reusable stimulus-generation layer for arrows, Gabor patches, optic-flow stimuli, colour metadata and circular-position debugging across the IQ Coach vertical stack.

---

## 1. Summary

Build a shared stimulus-generator component that plugs into the IQ Coach app and supports the common stimulus grammar used across the vertical stack:

```text
Attention Control
-> Relational Memory
-> Binding Memory
-> Path Prediction
-> Reasoning
```

The generator should provide a single shared interface for these carriers:

```text
arrow
gabor
optic_flow
```

Colour should be included as a feature/context dimension, not as a carrier.

The first implementation should prioritise:

```text
1. Shared grammar and geometry utilities
2. Numbered circular-position debug preview
3. Arrow carrier generator
4. Colour metadata support
5. Gabor carrier scaffold
6. Optic-flow carrier scaffold
7. Layer-specific integration hooks
```

The component must not force every layer to use every carrier. Each game layer should request only the carrier, wrapper and colour mode it needs.

---

## 2. Core architectural principle

Use a shared state grammar with independent carrier generators.

```text
VisualState / GraphSpec
        |
        v
Stimulus generator registry
        |
        v
arrowGenerator
gaborGenerator
opticFlowGenerator
        |
        v
layer-specific task logic
```

The state grammar is shared.

The carrier renderers are modular.

The game layers remain responsible for task logic, scoring, adaptation and feedback.

---

## 3. Key design rule

Do not duplicate arrow, Gabor or optic-flow generation separately inside each game layer.

Use:

```text
shared carrier generator
+ layer-specific task generator
```

Examples:

```text
arrowGenerator
= geometry, vectors, positions, rendering instructions

attentionControlGenerator
= masked majority trials, entropy, exposure, scoring

relationalMemoryGenerator
= n-back relation-token trials

bindingMemoryGenerator
= relation x colour/context binding

pathPredictionGenerator
= graph transitions, successor probes, break detection
```

This prevents drift in geometry, labels, wrapper IDs, relation-token handoff and metadata.

---

## 4. Why arrows should be included in the shared generator

Arrows are easy to implement, but they should still be a first-class shared carrier because they are the canonical carrier for the first IQ Coach build.

Arrows are used by:

```text
Attention Control:
extract the majority relation

Relational Memory:
hold and compare relation tokens

Binding Memory:
bind relation x colour/context

Path Prediction:
early graph-state / edge bridge

Reasoning:
visual-to-symbolic bridge or explanation examples
```

If arrows are implemented independently in each layer, the app risks inconsistency in:

```text
left/right labels
up/down labels
out/in radial geometry
clockwise/anticlockwise sign convention
position indexing
mask placement
colour handling
wrapper IDs
trial metadata
```

Therefore:

```text
arrowGenerator must be the first implemented shared carrier.
```

---

## 5. Proposed folder structure

Place the shared generator under the local IQ Coach app.

```text
products/trident-g-iq/apps/iq-coach/
  src/
    stimuli/
      grammar.ts
      geometry.ts
      registry.ts
      renderTypes.ts
      debugPreview.ts

      carriers/
        arrowGenerator.ts
        gaborGenerator.ts
        opticFlowGenerator.ts

      __tests__/
        geometry.test.ts
        arrowGenerator.test.ts
        gaborGenerator.test.ts
        opticFlowGenerator.test.ts
        registry.test.ts
        debugPreview.test.ts

    games/
      attentionControl/
        cccTrialGenerator.ts
        cccScoring.ts

      relationalMemory/
        relationalNBackGenerator.ts

      bindingMemory/
        bindingTrialGenerator.ts

      pathPrediction/
        pathPredictionGenerator.ts
```

If the app currently uses a different source layout, preserve the existing conventions but keep the conceptual separation:

```text
stimuli/
games/
engine/
```

---

## 6. Shared grammar

Create `src/stimuli/grammar.ts`.

```ts
export type StimulusCarrier =
  | "arrow"
  | "gabor"
  | "optic_flow";

export type Frame =
  | "absolute"
  | "relational";

export type Axis =
  | "x_axis"
  | "y_axis"
  | "radial_axis"
  | "tangential_axis"
  | "orientation_axis"
  | "spatial_frequency_axis"
  | "flow_direction_axis"
  | "flow_speed_axis";

export type ArrowPolarity =
  | "left"
  | "right"
  | "up"
  | "down"
  | "out"
  | "in"
  | "clockwise"
  | "anticlockwise";

export type GaborPolarity =
  | "horizontal"
  | "vertical"
  | "radial_aligned"
  | "tangential_aligned"
  | "low_spatial_frequency"
  | "high_spatial_frequency";

export type OpticFlowPolarity =
  | "left"
  | "right"
  | "up"
  | "down"
  | "expansion"
  | "contraction"
  | "clockwise"
  | "anticlockwise"
  | "slow"
  | "fast";

export type Polarity =
  | ArrowPolarity
  | GaborPolarity
  | OpticFlowPolarity;

export type Colour =
  | "blue"
  | "yellow"
  | "green"
  | "purple";

export type Context =
  | "K"
  | "L"
  | null;

export type ColourMode =
  | "absent"
  | "irrelevant"
  | "lure"
  | "binding"
  | "context_gate";

export type VisualState = {
  carrier: StimulusCarrier;
  frame: Frame;
  axis: Axis;
  polarity: Polarity;
  colour?: Colour;
  colourMode?: ColourMode;
  context?: Context;
};
```

---

## 7. Geometry utilities

Create `src/stimuli/geometry.ts`.

The generator must support the circular display currently used in the app.

Use 8 possible positions arranged around a centre point.

### 7.1 Position types

```ts
export type Position2D = {
  x: number;
  y: number;
};

export type Vector2D = {
  x: number;
  y: number;
};

export type IndexedPosition = {
  index: number;
  position: Position2D;
  angleRad: number;
  angleDeg: number;
};
```

### 7.2 Numbered circular positions

The debug view should support position labels:

```text
1, 2, 3, 4, 5, 6, 7, 8
```

around the circle.

Use clockwise indexing starting at the top by default:

```text
        1
    8       2
  7     +     3
    6       4
        5
```

Where:

```text
1 = top
2 = upper right
3 = right
4 = lower right
5 = bottom
6 = lower left
7 = left
8 = upper left
```

This helps initial manual checking of:

```text
position sampling
radial arrows
tangential arrows
mask placement
Gabor alignment
optic-flow direction
colour labels
```

### 7.3 Position generator

```ts
export function generateCirclePositions(options: {
  centre: Position2D;
  radiusPx: number;
  count?: number;
  startAngleDeg?: number;
  clockwise?: boolean;
  oneBasedIndex?: boolean;
}): IndexedPosition[] {
  const {
    centre,
    radiusPx,
    count = 8,
    startAngleDeg = -90,
    clockwise = true,
    oneBasedIndex = true
  } = options;

  const step = 360 / count;

  return Array.from({ length: count }, (_, i) => {
    const angleDeg = startAngleDeg + (clockwise ? i * step : -i * step);
    const angleRad = (angleDeg * Math.PI) / 180;

    return {
      index: oneBasedIndex ? i + 1 : i,
      angleDeg,
      angleRad,
      position: {
        x: centre.x + radiusPx * Math.cos(angleRad),
        y: centre.y + radiusPx * Math.sin(angleRad)
      }
    };
  });
}
```

### 7.4 Vector helpers

```ts
export function normalise(v: Vector2D): Vector2D {
  const length = Math.sqrt(v.x * v.x + v.y * v.y);
  if (length === 0) return { x: 0, y: 0 };
  return { x: v.x / length, y: v.y / length };
}

export function scale(v: Vector2D, k: number): Vector2D {
  return { x: v.x * k, y: v.y * k };
}

export function radialUnitVector(
  position: Position2D,
  centre: Position2D
): Vector2D {
  return normalise({
    x: position.x - centre.x,
    y: position.y - centre.y
  });
}

export function rotate90Clockwise(v: Vector2D): Vector2D {
  // Screen coordinates: y increases downward.
  return { x: -v.y, y: v.x };
}

export function rotate90Anticlockwise(v: Vector2D): Vector2D {
  // Screen coordinates: y increases downward.
  return { x: v.y, y: -v.x };
}
```

### 7.5 Required geometry tests

```text
generateCirclePositions returns 8 positions by default
position 1 is top
position 3 is right
position 5 is bottom
position 7 is left
radial vector at top points upward
radial vector at right points rightward
clockwise tangent at top points right
clockwise tangent at right points down
clockwise tangent at bottom points left
clockwise tangent at left points up
```

---

## 8. Render types

Create `src/stimuli/renderTypes.ts`.

```ts
import type { VisualState, Colour, ColourMode, Context } from "./grammar";
import type { Position2D, Vector2D } from "./geometry";

export type ColourRole =
  | "none"
  | "irrelevant_feature"
  | "lure_feature"
  | "binding_feature"
  | "context_gate";

export type ColourMetadata = {
  colour?: Colour;
  colourMode: ColourMode;
  colourRelevant: boolean;
  colourRole?: ColourRole;
  contextCue?: {
    type: "colour";
    value: Colour;
  };
};

export type RenderInstructionBase = {
  id: string;
  carrier: VisualState["carrier"];
  state: VisualState;
  position?: Position2D;
  debugIndex?: number;
  colour?: Colour;
  colourMetadata?: ColourMetadata;
};

export type ArrowRenderInstruction = RenderInstructionBase & {
  carrier: "arrow";
  direction: Vector2D;
  sizePx: number;
};

export type GaborRenderInstruction = RenderInstructionBase & {
  carrier: "gabor";
  orientationDeg: number;
  spatialFrequency: "low" | "high";
  phase?: number;
  sizePx: number;
};

export type OpticFlowRenderInstruction = RenderInstructionBase & {
  carrier: "optic_flow";
  flowType:
    | "translation"
    | "radial"
    | "rotation"
    | "speed";
  direction?: Vector2D;
  speed: "slow" | "fast";
  particleCount: number;
  apertureRadiusPx: number;
};

export type StimulusRenderInstruction =
  | ArrowRenderInstruction
  | GaborRenderInstruction
  | OpticFlowRenderInstruction;
```

---

## 9. Stimulus generator interface

Create `src/stimuli/registry.ts`.

```ts
import type { VisualState, StimulusCarrier } from "./grammar";
import type { StimulusRenderInstruction } from "./renderTypes";

export type StimulusGenerationOptions = {
  centre: { x: number; y: number };
  radiusPx: number;
  itemSizePx: number;
  selectedPositionIndices?: number[];
  debug?: boolean;
  seed?: string;
};

export type StimulusGenerator = {
  carrier: StimulusCarrier;
  supports(state: VisualState): boolean;
  generate(
    state: VisualState,
    options: StimulusGenerationOptions
  ): StimulusRenderInstruction;
  generateMany?(
    states: VisualState[],
    options: StimulusGenerationOptions
  ): StimulusRenderInstruction[];
};

const registry = new Map<StimulusCarrier, StimulusGenerator>();

export function registerStimulusGenerator(generator: StimulusGenerator): void {
  registry.set(generator.carrier, generator);
}

export function getStimulusGenerator(carrier: StimulusCarrier): StimulusGenerator {
  const generator = registry.get(carrier);

  if (!generator) {
    throw new Error(`No stimulus generator registered for carrier: ${carrier}`);
  }

  return generator;
}

export function generateStimulus(
  state: VisualState,
  options: StimulusGenerationOptions
): StimulusRenderInstruction {
  const generator = getStimulusGenerator(state.carrier);

  if (!generator.supports(state)) {
    throw new Error(`Carrier ${state.carrier} does not support the requested state`);
  }

  return generator.generate(state, options);
}
```

---

## 10. Colour and context handling

Colour belongs in the shared stimulus generator as a feature/context dimension.

It should not be implemented separately in each game layer.

It must not be treated as a carrier.

Use this rule:

```text
carrier = how the stimulus is visually expressed
colour = a feature, binding cue or context cue
```

Examples:

```text
arrow + blue
gabor + yellow
optic_flow + green
```

The carrier remains:

```text
arrow
gabor
optic_flow
```

### 10.1 Colour modes

Add this mode to layer/task configuration:

```ts
export type ColourMode =
  | "absent"
  | "irrelevant"
  | "lure"
  | "binding"
  | "context_gate";
```

Meaning:

| Colour mode | Meaning | Typical layer |
|---|---|---|
| `absent` | No colour variation. Stimuli use default visual style. | Early Attention Control |
| `irrelevant` | Colour is shown but should be ignored. | Attention Control transfer/lure checks |
| `lure` | Colour creates tempting but wrong similarity. | Relational Memory, Binding Memory |
| `binding` | Colour is part of the scored state. | Binding Memory |
| `context_gate` | Colour determines which transition/rule applies. | Path Prediction / SR, Reasoning bridge |

### 10.2 Layer-specific colour use

#### Attention Control

Colour should usually be:

```text
absent
```

or:

```text
irrelevant
```

The Attention Control task should not initially ask:

```text
Were most blue arrows pointing out?
```

because that turns the task into a conjunction-extraction / binding task.

Allowed early Attention Control use:

```text
same majority relation, mixed colours
response should ignore colour
```

Example:

```text
3 OUT arrows:
blue, yellow, green

2 IN arrows:
blue, purple

Correct answer:
OUT
```

Log this as:

```ts
colourMode: "irrelevant"
colourRelevant: false
```

or, when used deliberately as a distractor:

```ts
colourMode: "lure"
colourRelevant: false
```

Do not include colour in the canonical Attention Control bits/sec score unless a separate colour-conjunction Attention Control variant is deliberately created and versioned.

#### Relational Memory

Colour can be absent or irrelevant at first.

Later, colour can create lures:

```text
same relation, different colour
same colour, different relation
```

Example:

```text
Trial t:
OUT + blue

Trial t+n:
OUT + green
```

If the task rule is relation-only, this is a match.

If the task rule is bound-state memory, this belongs in Binding Memory, not Relational Memory.

Recommended modes:

```text
early Relational Memory:
colourMode = "absent" or "irrelevant"

lure Relational Memory:
colourMode = "lure"
colourRelevant = false
```

#### Binding Memory

Colour becomes scored in Binding Memory.

The core binding state is:

```text
relation x colour
```

or later:

```text
relation x colour x context
```

Example:

```text
t:
LEFT + blue

t+n:
LEFT + blue
```

Correct:

```text
Match
```

But:

```text
t:
LEFT + blue

t+n:
LEFT + green
```

Correct:

```text
No match
```

Binding Memory should use:

```ts
colourMode: "binding"
colourRelevant: true
```

Binding Memory should log:

```ts
boundState: {
  relation: "left",
  colour: "blue",
  context: null
}
```

#### Path Prediction / SR

Colour can serve two different SR roles.

A. Colour as part of the state:

```text
relation x colour
```

Example:

```text
blue OUT -> yellow CW
yellow CW -> green IN
```

Here colour is part of the state identity.

Use:

```ts
colourMode: "binding"
```

B. Colour as a context gate:

```text
If blue:
OUT -> CW

If yellow:
OUT -> IN
```

Here the same relation has different futures depending on colour.

Use:

```ts
colourMode: "context_gate"
```

and log:

```ts
contextCue: {
  type: "colour",
  value: "blue"
}
```

Do not describe this as causal unless the task includes interventions, blocking or forced transition changes.

In the SR layer, call it:

```text
context-gated transition
```

or:

```text
colour-gated transition
```

#### Reasoning bridge

Colour/context can be translated into symbolic or semantic rules.

Visual SR example:

```text
If blue, OUT leads to CW.
If yellow, OUT leads to IN.
Current cue is blue.
Current state is OUT.
Therefore, CW is the expected next state.
```

Symbolic reasoning version:

```text
If context K, A -> B.
If context L, A -> C.
Context K is active.
A occurred.
Therefore, B follows.
```

This supports vertical handoff:

```text
visual colour cue
-> context-gated transition
-> explicit rule / constraint reasoning
```

### 10.3 Colour palette

Use a small fixed palette.

```ts
export const STIMULUS_COLOURS = {
  blue: "#22AAFF",
  yellow: "#F5C542",
  green: "#6EE26E",
  purple: "#A879FF"
} as const;
```

Rules:

```text
Use sufficient contrast against the app background.
Do not rely on colour alone when accessibility mode is enabled.
Allow debug labels to display colour names.
Keep the palette stable for scoring and replay consistency.
```

Accessibility fallback:

```text
colour + small symbol
colour + label in debug mode
colour + border pattern if needed
```

### 10.4 Carrier rendering rules for colour

#### Arrow carrier

Colour may apply to:

```text
arrow fill
arrow stroke
small backing disc
```

Recommended first implementation:

```text
colour arrow body
keep mask neutral
```

#### Gabor carrier

Colour may apply to:

```text
patch tint
outer ring
small colour tag
```

Recommended first implementation:

```text
use neutral Gabor patch + coloured border ring
```

This preserves visibility of orientation/spatial-frequency information.

#### Optic-flow carrier

Colour may apply to:

```text
particles
aperture ring
state marker
```

Recommended first implementation:

```text
use coloured aperture ring or state marker
rather than recolouring all particles
```

This avoids reducing motion visibility.

### 10.5 Colour debug preview

Add colour controls to the debug preview.

Controls:

```text
Colour mode:
absent / irrelevant / lure / binding / context_gate

Colour:
blue / yellow / green / purple

Show colour labels:
on/off

Show context cue:
on/off
```

Required debug cases:

```text
arrow OUT + blue
arrow OUT + green
gabor radial_aligned + yellow
optic_flow expansion + purple
same relation / different colour
different relation / same colour
colour-gated transition placeholder
```

The debug view should make it obvious whether colour is:

```text
ignored
a lure
part of the binding
a context gate
```

### 10.6 Colour tests

Add tests for:

```text
colour metadata is preserved in GeneratedStimulusItem
colourMode = absent produces no scored colour field
colourMode = irrelevant sets colourRelevant = false
colourMode = binding sets colourRelevant = true
colourMode = context_gate creates contextCue metadata
Attention Control does not treat colour as scored unless explicitly configured
Binding Memory can generate relation x colour states
Path Prediction can generate colour-gated transition states
debug preview displays colour labels correctly
unsupported colour mode combinations throw clear errors
```

---

## 11. Arrow generator

Create `src/stimuli/carriers/arrowGenerator.ts`.

### 11.1 Supported arrow states

The arrow generator must support:

```text
arrow.absolute.x_axis.left
arrow.absolute.x_axis.right
arrow.absolute.y_axis.up
arrow.absolute.y_axis.down

arrow.relational.radial_axis.out
arrow.relational.radial_axis.in

arrow.relational.tangential_axis.clockwise
arrow.relational.tangential_axis.anticlockwise
```

### 11.2 Arrow generator rules

```ts
import type { StimulusGenerator, StimulusGenerationOptions } from "../registry";
import type { VisualState } from "../grammar";
import type { ArrowRenderInstruction } from "../renderTypes";
import {
  generateCirclePositions,
  radialUnitVector,
  scale,
  rotate90Clockwise,
  rotate90Anticlockwise
} from "../geometry";

function arrowDirectionForState(
  state: VisualState,
  position: { x: number; y: number },
  centre: { x: number; y: number }
) {
  if (state.frame === "absolute" && state.axis === "x_axis") {
    if (state.polarity === "left") return { x: -1, y: 0 };
    if (state.polarity === "right") return { x: 1, y: 0 };
  }

  if (state.frame === "absolute" && state.axis === "y_axis") {
    if (state.polarity === "up") return { x: 0, y: -1 };
    if (state.polarity === "down") return { x: 0, y: 1 };
  }

  if (state.frame === "relational" && state.axis === "radial_axis") {
    const r = radialUnitVector(position, centre);
    if (state.polarity === "out") return r;
    if (state.polarity === "in") return scale(r, -1);
  }

  if (state.frame === "relational" && state.axis === "tangential_axis") {
    const r = radialUnitVector(position, centre);
    if (state.polarity === "clockwise") return rotate90Clockwise(r);
    if (state.polarity === "anticlockwise") return rotate90Anticlockwise(r);
  }

  throw new Error(`Unsupported arrow state: ${JSON.stringify(state)}`);
}

export const arrowGenerator: StimulusGenerator = {
  carrier: "arrow",

  supports(state: VisualState): boolean {
    if (state.carrier !== "arrow") return false;

    if (state.frame === "absolute") {
      return (
        (state.axis === "x_axis" &&
          (state.polarity === "left" || state.polarity === "right")) ||
        (state.axis === "y_axis" &&
          (state.polarity === "up" || state.polarity === "down"))
      );
    }

    if (state.frame === "relational") {
      return (
        (state.axis === "radial_axis" &&
          (state.polarity === "out" || state.polarity === "in")) ||
        (state.axis === "tangential_axis" &&
          (state.polarity === "clockwise" ||
            state.polarity === "anticlockwise"))
      );
    }

    return false;
  },

  generate(
    state: VisualState,
    options: StimulusGenerationOptions
  ): ArrowRenderInstruction {
    const positions = generateCirclePositions({
      centre: options.centre,
      radiusPx: options.radiusPx
    });

    const selectedIndex = options.selectedPositionIndices?.[0] ?? 1;
    const indexedPosition =
      positions.find(p => p.index === selectedIndex) ?? positions[0];

    const direction = arrowDirectionForState(
      state,
      indexedPosition.position,
      options.centre
    );

    return {
      id: `${state.carrier}.${state.frame}.${state.axis}.${state.polarity}.${indexedPosition.index}`,
      carrier: "arrow",
      state,
      position: indexedPosition.position,
      debugIndex: indexedPosition.index,
      direction,
      sizePx: options.itemSizePx,
      colour: state.colour
    };
  }
};
```

### 11.3 Arrow generator tests

```text
left arrow returns direction {-1, 0}
right arrow returns direction {1, 0}
up arrow returns direction {0, -1}
down arrow returns direction {0, 1}
out arrow at position 1 points upward
in arrow at position 1 points downward
clockwise arrow at position 1 points rightward
anticlockwise arrow at position 1 points leftward
unsupported arrow state throws an error
```

---

## 12. Gabor generator

Create `src/stimuli/carriers/gaborGenerator.ts`.

### 12.1 Supported Gabor states

The Gabor generator should support v1 orthogonal states:

```text
gabor.absolute.orientation_axis.horizontal
gabor.absolute.orientation_axis.vertical

gabor.absolute.spatial_frequency_axis.low_spatial_frequency
gabor.absolute.spatial_frequency_axis.high_spatial_frequency

gabor.relational.radial_axis.radial_aligned
gabor.relational.radial_axis.tangential_aligned
```

### 12.2 Role in the app

Gabor should be optional/research at first.

Use for:

```text
Binding Memory
static-form wrapper transfer
research bridge between arrows and optic flow
optional visual-pattern checks
```

Do not make Gabor mandatory for canonical Attention Control scoring.

### 12.3 Implementation notes

Use:

```text
horizontal = 0 degrees
vertical = 90 degrees
radial_aligned = angle from centre to item position
tangential_aligned = radial angle + 90 degrees
low_spatial_frequency = configured low value
high_spatial_frequency = configured high value
```

For the first implementation, it is acceptable to render placeholders:

```text
striped patch
orientation line
frequency label in debug mode
```

before implementing full Gabor pixel synthesis.

---

## 13. Optic-flow generator

Create `src/stimuli/carriers/opticFlowGenerator.ts`.

### 13.1 Supported optic-flow states

The optic-flow generator should support:

```text
optic_flow.absolute.x_axis.left
optic_flow.absolute.x_axis.right

optic_flow.absolute.y_axis.up
optic_flow.absolute.y_axis.down

optic_flow.relational.radial_axis.expansion
optic_flow.relational.radial_axis.contraction

optic_flow.relational.tangential_axis.clockwise
optic_flow.relational.tangential_axis.anticlockwise

optic_flow.absolute.flow_speed_axis.slow
optic_flow.absolute.flow_speed_axis.fast
```

### 13.2 Role in the app

Optic flow is the natural carrier for:

```text
Path Prediction
predictive streams
future-state learning
trajectory-like reasoning
later wrapper-transfer probes
```

It should not be part of the initial canonical CCC / Attention Control score.

### 13.3 Implementation notes

The optic-flow generator should return render instructions for the renderer/canvas layer.

It should be able to produce:

```text
translation field
radial expansion/contraction
rotational flow
slow/fast speed variants
```

The generator should not own path-prediction scoring or transition logic.

---

## 14. Debug preview component

Build a simple manual-check screen or component so the user/developer can inspect stimuli before integrating with scoring.

Suggested path:

```text
src/stimuli/debugPreview.ts
```

or, if the app has routes:

```text
products/trident-g-iq/apps/iq-coach/stimulus-debug
```

### 14.1 Required debug modes

The preview must support:

```text
1. Circle position labels only
2. Arrow absolute left/right
3. Arrow absolute up/down
4. Arrow relational out/in
5. Arrow relational clockwise/anticlockwise
6. Gabor placeholder orientations
7. Gabor radial/tangential alignment
8. Optic-flow placeholder directions
9. Colour mode preview
```

### 14.2 Numbered-circle display

The first debug view should show only the circle positions.

```text
        1
    8       2
  7     +     3
    6       4
        5
```

The centre should be clearly marked.

Each numbered position should be rendered exactly where an item can appear.

The debug UI should allow:

```text
toggle labels on/off
toggle centre marker on/off
toggle sample five positions
toggle all eight positions
toggle colour labels
```

### 14.3 Debug controls

Useful controls:

```text
Carrier:
arrow / gabor / optic_flow

Frame:
absolute / relational

Axis:
x_axis / y_axis / radial_axis / tangential_axis / orientation_axis / spatial_frequency_axis / flow_speed_axis

Polarity:
depends on selected carrier/frame/axis

Position:
1-8 or all

Colour mode:
absent / irrelevant / lure / binding / context_gate

Colour:
blue / yellow / green / purple

Show debug labels:
on/off

Show vectors:
on/off

Show masks:
on/off

Sample five:
on/off
```

### 14.4 Debug acceptance tests

```text
position labels match expected circle layout
position 1 is top
position 3 is right
position 5 is bottom
position 7 is left
five-position sample displays exactly five items
mask positions align with item positions
arrow vectors match expected polarity
Gabor radial/tangential placeholders align with position
optic-flow placeholders show correct direction class
colour labels and roles display correctly
```

---

## 15. Layer integration contract

Each layer should call the shared stimulus generator but remain responsible for its own game logic.

### 15.1 Attention Control

Uses the generator to render current trial items.

```text
Task question:
Which relation is in the majority?
```

Primary carrier:

```text
arrow
```

Canonical v1 scoring wrappers:

```text
arrow_abs_lr
arrow_rel_inout
```

Extensible wrapper support:

```text
arrow_abs_ud
arrow_rel_cwccw
```

Later transfer probes:

```text
optic_abs_lr
optic_abs_ud
optic_rel_expand_contract
optic_rel_cwccw
gabor_abs_orientation
gabor_rel_radial_alignment
```

Do not pool transfer-probe carriers into canonical Attention Control scoring until calibrated.

### 15.2 Relational Memory

Uses the generator to render relation tokens or majority-derived relation displays.

```text
Task question:
Does the current relation match n-back?
```

Primary carrier:

```text
arrow
```

Optional transfer carriers:

```text
gabor
optic_flow
```

### 15.3 Binding Memory

Uses the generator to render relation x colour/context conjunctions.

```text
Task question:
Does the current bound state match n-back?
```

Primary carriers:

```text
arrow
gabor
```

Optional dynamic transfer:

```text
optic_flow
```

Colour becomes scored here, not in early Attention Control.

### 15.4 Path Prediction

Uses the generator to project graph states and transitions into visual form.

```text
Task question:
What usually comes next?
Did the graph break?
Can this path still reach the target?
```

Primary carrier:

```text
optic_flow
```

Bridge carriers:

```text
arrow
gabor
```

### 15.5 Reasoning

Reasoning is primarily symbolic, nonsense-semantic or domain-semantic.

The stimulus generator may be used only for:

```text
visual-to-symbolic bridge
instruction examples
relation family previews
```

---

## 16. Wrapper IDs

Use stable wrapper IDs.

```ts
export type WrapperId =
  | "arrow_abs_lr"
  | "arrow_abs_ud"
  | "arrow_rel_inout"
  | "arrow_rel_cwccw"

  | "gabor_abs_orientation"
  | "gabor_abs_spatial_frequency"
  | "gabor_rel_radial_alignment"

  | "optic_abs_lr"
  | "optic_abs_ud"
  | "optic_rel_expand_contract"
  | "optic_rel_cwccw"
  | "optic_abs_speed";
```

Wrapper ID should always be logged in trial payloads.

---

## 17. Metadata contract

Every generated stimulus item should carry enough metadata for debugging, logging and later scoring.

```ts
export type GeneratedStimulusItem = {
  id: string;
  wrapperId: WrapperId;
  carrier: StimulusCarrier;
  frame: Frame;
  axis: Axis;
  polarity: Polarity;
  positionIndex?: number;
  position?: Position2D;
  vector?: Vector2D;
  colour?: Colour;
  colourMode?: ColourMode;
  colourRelevant?: boolean;
  colourRole?:
    | "none"
    | "irrelevant_feature"
    | "lure_feature"
    | "binding_feature"
    | "context_gate";
  context?: Context;
  debugLabel?: string;
  renderInstruction: StimulusRenderInstruction;
};
```

For Attention Control trial payloads, include:

```text
wrapperId
carrier
frame
axis
polarity
positionIndex
majorityRatio
majorityPolarity
itemStates
renderInstructions
maskPositions
colourMode
colourRelevant
```

---

## 18. Acceptance criteria

### 18.1 Shared architecture

```text
arrow, gabor and optic_flow use the same VisualState grammar
generators are registered through a shared registry
game layers do not reimplement carrier geometry
unsupported states throw clear errors
```

### 18.2 Arrow implementation

```text
absolute left/right works
absolute up/down works
relational out/in works
relational clockwise/anticlockwise works
circle positions are indexed correctly
debug labels render correctly
```

### 18.3 Colour implementation

```text
colour metadata is preserved
colourMode = absent produces no scored colour field
colourMode = irrelevant sets colourRelevant = false
colourMode = binding sets colourRelevant = true
colourMode = context_gate creates contextCue metadata
debug preview displays colour labels correctly
```

### 18.4 Gabor implementation

```text
horizontal/vertical placeholder works
low/high spatial-frequency placeholder works
radial/tangential alignment works
debug orientation labels are available
```

### 18.5 Optic-flow implementation

```text
translation left/right works
translation up/down works
expansion/contraction works
clockwise/anticlockwise rotation works
slow/fast placeholder works
debug flow labels are available
```

### 18.6 Layer integration

```text
Attention Control can call arrowGenerator for five-arrow majority trials
Relational Memory can call arrowGenerator for relation-token displays
Binding Memory can call arrow/gabor generators with colour metadata
Path Prediction can call opticFlowGenerator for transition displays
```

---

## 19. Build order

### Phase 1 - Shared grammar and geometry

```text
1. grammar.ts
2. geometry.ts
3. renderTypes.ts
4. registry.ts
5. colour metadata support
6. numbered-circle debug preview
7. geometry tests
```

### Phase 2 - Arrow carrier

```text
8. arrowGenerator.ts
9. arrow absolute x/y states
10. arrow relational radial/tangential states
11. arrow generator tests
12. integrate with existing five-arrow majority task
```

### Phase 3 - Debug preview integration

```text
13. route or local component for stimulus preview
14. circle position labels
15. arrow vector preview
16. mask-position preview
17. sample-five preview
18. colour-mode preview
```

### Phase 4 - Gabor scaffold

```text
19. gaborGenerator.ts
20. orientation placeholders
21. spatial-frequency placeholders
22. radial/tangential alignment placeholders
23. colour ring/tag support
24. Gabor tests
```

### Phase 5 - Optic-flow scaffold

```text
25. opticFlowGenerator.ts
26. translation placeholders
27. expansion/contraction placeholders
28. rotation placeholders
29. speed placeholders
30. colour aperture/marker support
31. optic-flow tests
```

### Phase 6 - Layer hooks

```text
32. Attention Control integration
33. Relational Memory hook
34. Binding Memory hook
35. Path Prediction hook
36. metadata logging
```

---

## 20. Final implementation principle

The stimulus generator is not the game.

It is the shared projection layer that turns a common state grammar into visual stimuli.

```text
shared state grammar
+ independent carrier generators
+ shared colour/context handling
+ layer-specific task logic
+ separate scoring by layer/wrapper
```

Arrows should be implemented first and reused everywhere.

Gabor and optic flow should be independent generator modules that can be called selectively.

Colour should be implemented once as a feature/context dimension, then used differently by each layer.

Canonical Attention Control scoring remains arrow-based until other carriers are separately calibrated.

The full-stack transfer logic is preserved because the same relation tokens can be projected across different carriers, colours and layers without duplicating geometry or stimulus rules.
