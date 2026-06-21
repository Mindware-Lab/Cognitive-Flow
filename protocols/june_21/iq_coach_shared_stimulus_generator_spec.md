# IQ Coach Shared Stimulus Generator Specification

**Component:** Shared stimulus generator  
**Product:** IQ Coach  
**Target app path:** `products/trident-g-iq/apps/iq-coach/`  
**Purpose:** Provide a reusable stimulus-generation layer for arrows, Gabor patches and optic-flow stimuli that can be called selectively by the IQ Coach game layers.

---

## 1. Summary

Build a shared stimulus-generator component that plugs into the IQ Coach app and supports the common stimulus grammar used across the vertical stack:

```text
Attention Control
→ Relational Memory
→ Binding Memory
→ Path Prediction
→ Reasoning
```

The generator should provide a single shared interface for:

```text
arrow
gabor
optic_flow
```

while keeping game logic separate from stimulus rendering logic.

The first implementation should prioritise:

```text
1. Arrow carrier
2. Numbered circular-position debug preview
3. Gabor carrier scaffold
4. Optic-flow carrier scaffold
5. Layer-specific integration hooks
```

The component must not force every game layer to use every carrier. Instead, each layer should request only the carrier and wrapper it needs.

---

## 2. Core architectural principle

Use a shared state grammar with independent carrier generators.

```text
VisualState / GraphSpec
        ↓
Stimulus generator registry
        ↓
arrowGenerator
gaborGenerator
opticFlowGenerator
        ↓
layer-specific task logic
```

The state grammar is shared.

The carrier renderers are modular.

The game layers remain responsible for task logic, scoring and adaptation.

---

## 3. Key design rule

Do not duplicate arrow, Gabor or optic-flow generation separately inside each game layer.

Instead:

```text
shared carrier generator
+ layer-specific task generator
```

For example:

```text
arrowGenerator
= geometry, vectors, positions, rendering instructions

attentionControlGenerator
= masked majority trials, entropy, exposure, scoring

relationalMemoryGenerator
= n-back relation-token trials

bindingMemoryGenerator
= relation × colour/context binding

pathPredictionGenerator
= graph transitions, successor probes, break detection
```

This prevents drift in geometry, labels, wrapper IDs, relation-token handoff and metadata.

---

## 4. Why arrows should be included in the shared generator

Although arrows are easy to implement, they should still be a first-class shared carrier because they are the canonical carrier for the first IQ Coach build.

Arrows are used by:

```text
Attention Control:
extract the majority relation

Relational Memory:
hold and compare relation tokens

Binding Memory:
bind relation × colour/context

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

export type VisualState = {
  carrier: StimulusCarrier;
  frame: Frame;
  axis: Axis;
  polarity: Polarity;
  colour?: Colour;
  context?: Context;
};
```

---

## 7. Geometry utilities

Create `src/stimuli/geometry.ts`.

The generator must support the circular display currently used in the app.

Use 8 possible positions arranged around a centre point.

### 7.1 Position type

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
  // screen coordinates: y increases downward
  return { x: -v.y, y: v.x };
}

export function rotate90Anticlockwise(v: Vector2D): Vector2D {
  // screen coordinates: y increases downward
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
import type { VisualState } from "./grammar";
import type { Position2D, Vector2D } from "./geometry";

export type RenderInstructionBase = {
  id: string;
  carrier: VisualState["carrier"];
  state: VisualState;
  position?: Position2D;
  debugIndex?: number;
  colour?: string;
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

## 10. Arrow generator

Create `src/stimuli/carriers/arrowGenerator.ts`.

### 10.1 Supported arrow states

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

### 10.2 Arrow generator rules

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
  },

  generateMany(
    states: VisualState[],
    options: StimulusGenerationOptions
  ): ArrowRenderInstruction[] {
    const positions = generateCirclePositions({
      centre: options.centre,
      radiusPx: options.radiusPx
    });

    const selectedIndices =
      options.selectedPositionIndices ??
      positions.slice(0, states.length).map(p => p.index);

    return states.map((state, i) => {
      const indexedPosition =
        positions.find(p => p.index === selectedIndices[i]) ?? positions[i];

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
    });
  }
};
```

### 10.3 Arrow generator tests

```text
left arrow returns direction {-1, 0}
right arrow returns direction {1, 0}
up arrow returns direction {0, -1}
down arrow returns direction {0, 1}
out arrow at position 1 points upward
in arrow at position 1 points downward
clockwise arrow at position 1 points rightward
anticlockwise arrow at position 1 points leftward
generateMany preserves debugIndex metadata
unsupported arrow state throws an error
```

---

## 11. Gabor generator

Create `src/stimuli/carriers/gaborGenerator.ts`.

### 11.1 Supported Gabor states

The Gabor generator should support v1 orthogonal states:

```text
gabor.absolute.orientation_axis.horizontal
gabor.absolute.orientation_axis.vertical

gabor.absolute.spatial_frequency_axis.low_spatial_frequency
gabor.absolute.spatial_frequency_axis.high_spatial_frequency

gabor.relational.radial_axis.radial_aligned
gabor.relational.radial_axis.tangential_aligned
```

### 11.2 Role in the app

Gabor should be optional/research at first.

Use for:

```text
Binding Memory
static-form wrapper transfer
research bridge between arrows and optic flow
optional visual-pattern checks
```

Do not make Gabor mandatory for canonical Attention Control scoring.

### 11.3 Generator behaviour

The Gabor generator should return render instructions only. It should not render pixels itself unless the current app architecture already uses canvas rendering inside generators.

```ts
export const gaborGenerator: StimulusGenerator = {
  carrier: "gabor",

  supports(state) {
    if (state.carrier !== "gabor") return false;

    return (
      (state.frame === "absolute" &&
        state.axis === "orientation_axis" &&
        (state.polarity === "horizontal" || state.polarity === "vertical")) ||
      (state.frame === "absolute" &&
        state.axis === "spatial_frequency_axis" &&
        (state.polarity === "low_spatial_frequency" ||
          state.polarity === "high_spatial_frequency")) ||
      (state.frame === "relational" &&
        state.axis === "radial_axis" &&
        (state.polarity === "radial_aligned" ||
          state.polarity === "tangential_aligned"))
    );
  },

  generate(state, options) {
    // Return GaborRenderInstruction.
    // Absolute horizontal = 0 deg.
    // Absolute vertical = 90 deg.
    // Relational radial/tangential should use the indexed position angle.
    throw new Error("Implement gaborGenerator.generate");
  }
};
```

### 11.4 Gabor implementation notes

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

## 12. Optic-flow generator

Create `src/stimuli/carriers/opticFlowGenerator.ts`.

### 12.1 Supported optic-flow states

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

### 12.2 Role in the app

Optic flow is the natural carrier for:

```text
Path Prediction
predictive streams
future-state learning
trajectory-like reasoning
later wrapper-transfer probes
```

It should not be part of the initial canonical CCC score.

### 12.3 Generator behaviour

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

## 13. Debug preview component

Build a simple manual-check screen or component so the user/developer can inspect stimuli before integrating with scoring.

Suggested path:

```text
src/stimuli/debugPreview.ts
```

or, if the app has routes:

```text
/products/trident-g-iq/apps/iq-coach/stimulus-debug
```

### 13.1 Required debug modes

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
```

### 13.2 Numbered-circle display

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
```

### 13.3 Debug controls

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
1–8 or all

Show debug labels:
on/off

Show vectors:
on/off

Show masks:
on/off

Sample five:
on/off
```

### 13.4 Debug acceptance tests

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
```

---

## 14. Layer integration contract

Each layer should call the shared stimulus generator but remain responsible for its own game logic.

### 14.1 Attention Control

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
optic_flow_abs_lr
optic_flow_abs_ud
optic_flow_rel_expand_contract
optic_flow_rel_cwccw
gabor_abs_orientation
gabor_rel_radial_alignment
```

Do not pool transfer-probe carriers into canonical Attention Control scoring until calibrated.

### 14.2 Relational Memory

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

### 14.3 Binding Memory

Uses the generator to render relation × colour/context conjunctions.

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

### 14.4 Path Prediction

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

### 14.5 Reasoning

Reasoning is primarily symbolic, nonsense-semantic or domain-semantic.

The stimulus generator may be used only for:

```text
visual-to-symbolic bridge
instruction examples
relation family previews
```

---

## 15. Wrapper IDs

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

## 16. Metadata contract

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
```

---

## 17. Acceptance criteria

### 17.1 Shared architecture

```text
arrow, gabor and optic_flow use the same VisualState grammar
generators are registered through a shared registry
game layers do not reimplement carrier geometry
unsupported states throw clear errors
```

### 17.2 Arrow implementation

```text
absolute left/right works
absolute up/down works
relational out/in works
relational clockwise/anticlockwise works
circle positions are indexed correctly
debug labels render correctly
```

### 17.3 Gabor implementation

```text
horizontal/vertical placeholder works
low/high spatial frequency placeholder works
radial/tangential alignment works
debug orientation labels are available
```

### 17.4 Optic-flow implementation

```text
translation left/right works
translation up/down works
expansion/contraction works
clockwise/anticlockwise rotation works
slow/fast placeholder works
debug flow labels are available
```

### 17.5 Layer integration

```text
Attention Control can call arrowGenerator for five-arrow majority trials
Relational Memory can call arrowGenerator for relation-token displays
Binding Memory can call arrow/gabor generators with colour metadata
Path Prediction can call opticFlowGenerator for transition displays
```

---

## 18. Build order

### Phase 1 — Shared grammar and geometry

```text
1. grammar.ts
2. geometry.ts
3. renderTypes.ts
4. registry.ts
5. numbered-circle debug preview
6. geometry tests
```

### Phase 2 — Arrow carrier

```text
7. arrowGenerator.ts
8. arrow absolute x/y states
9. arrow relational radial/tangential states
10. arrow generator tests
11. integrate with existing five-arrow majority task
```

### Phase 3 — Debug preview integration

```text
12. route or local component for stimulus preview
13. circle position labels
14. arrow vector preview
15. mask-position preview
16. sample-five preview
```

### Phase 4 — Gabor scaffold

```text
17. gaborGenerator.ts
18. orientation placeholders
19. spatial-frequency placeholders
20. radial/tangential alignment placeholders
21. gabor tests
```

### Phase 5 — Optic-flow scaffold

```text
22. opticFlowGenerator.ts
23. translation placeholders
24. expansion/contraction placeholders
25. rotation placeholders
26. speed placeholders
27. optic-flow tests
```

### Phase 6 — Layer hooks

```text
28. Attention Control integration
29. Relational Memory hook
30. Binding Memory hook
31. Path Prediction hook
32. metadata logging
```

---

## 19. Final implementation principle

The stimulus generator is not the game.

It is the shared projection layer that turns a common state grammar into visual stimuli.

```text
shared state grammar
+ independent carrier generators
+ layer-specific task logic
+ separate scoring by layer/wrapper
```

Arrows should be implemented first and reused everywhere.

Gabor and optic flow should be independent generator modules that can be called selectively.

Canonical Attention Control scoring remains arrow-based until other carriers are separately calibrated.

The full-stack transfer logic is preserved because the same relation tokens can be projected across different carriers and layers without duplicating geometry or stimulus rules.
