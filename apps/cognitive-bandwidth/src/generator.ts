import { OCTAGON_POSITIONS, radialVector } from "./geometry";
import { hashSeed, mulberry32, shuffle } from "./random";
import type {
  Category,
  Ratio,
  StimulusItem,
  TrialCondition,
  TrialDefinition,
  WrapperId,
} from "./types";

const RATIO_COUNTS: Record<Ratio, 3 | 4 | 5> = {
  "5:0": 5,
  "4:1": 4,
  "3:2": 3,
};

export const DEMO_CONDITIONS: TrialCondition[] = [
  { ratio: "4:1", exposureMs: 250 },
  { ratio: "4:1", exposureMs: 500 },
  { ratio: "4:1", exposureMs: 1000 },
  { ratio: "4:1", exposureMs: 2000 },
  { ratio: "3:2", exposureMs: 250 },
  { ratio: "3:2", exposureMs: 500 },
  { ratio: "3:2", exposureMs: 1000 },
  { ratio: "3:2", exposureMs: 2000 },
];

function categoriesFor(wrapperId: WrapperId): [Category, Category] {
  return wrapperId === "abs_lr" ? ["left", "right"] : ["out", "in"];
}

function vectorFor(category: Category, positionIndex: number) {
  if (category === "left") return { x: -1, y: 0 };
  if (category === "right") return { x: 1, y: 0 };
  const radial = radialVector(OCTAGON_POSITIONS[positionIndex]);
  return category === "out" ? radial : { x: -radial.x, y: -radial.y };
}

export function generateTrial(
  sessionSeed: string,
  wrapperId: WrapperId,
  seedIndex: number,
  condition: TrialCondition,
  practice = false,
): TrialDefinition {
  const random = mulberry32(hashSeed(`${sessionSeed}:${wrapperId}:${seedIndex}`));
  const [first, second] = categoriesFor(wrapperId);
  const majorityCategory = random() < 0.5 ? first : second;
  const minorityCategory = majorityCategory === first ? second : first;
  const majorityCount = RATIO_COUNTS[condition.ratio];
  const categories = shuffle(random, [
    ...Array<Category>(majorityCount).fill(majorityCategory),
    ...Array<Category>(5 - majorityCount).fill(minorityCategory),
  ]);
  const positions = shuffle(random, Array.from({ length: 8 }, (_, index) => index)).slice(0, 5);
  const items: StimulusItem[] = positions.map((positionIndex, itemIndex) => ({
    positionIndex,
    position: OCTAGON_POSITIONS[positionIndex],
    category: categories[itemIndex],
    vector: vectorFor(categories[itemIndex], positionIndex),
  }));
  return {
    id: `${wrapperId}-${seedIndex}`,
    wrapperId,
    seedIndex,
    ratio: condition.ratio,
    exposureMs: condition.exposureMs,
    majorityCount,
    majorityCategory,
    correctResponse: majorityCategory,
    items,
    practice,
  };
}
