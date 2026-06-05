import type { Food } from './food';
import type { BalanceStatus } from './nutrition';

export type MacroFilter = 'all' | 'protein' | 'carb' | 'fiber' | 'fat';

type FoodMacroTag = Exclude<MacroFilter, 'all'>;

type PairingProfile =
  | 'bread'
  | 'cheese'
  | 'chicken'
  | 'cold-cut'
  | 'dairy-bowl'
  | 'egg'
  | 'fish'
  | 'fruit'
  | 'grain'
  | 'legume'
  | 'nut-butter'
  | 'red-meat'
  | 'savory-fat'
  | 'seafood'
  | 'starchy-carb'
  | 'sweet-fat'
  | 'sweet-grain'
  | 'tortilla'
  | 'vegetable';

type NutrientStatus = {
  status: BalanceStatus;
};

export type RecommendationNutrition = {
  kcal: NutrientStatus;
  proteinG: NutrientStatus;
  carbsG: NutrientStatus;
  fatG: NutrientStatus;
  fiberG: NutrientStatus;
};

export type RecommendationContext = {
  selectedFoodIds: readonly string[];
  favoriteFoodIds?: readonly string[];
  nutrition?: RecommendationNutrition;
};

const LOW_STATUS_BY_TAG: Record<FoodMacroTag, keyof RecommendationNutrition> = {
  protein: 'proteinG',
  carb: 'carbsG',
  fiber: 'fiberG',
  fat: 'fatG',
};

const SECONDARY_MACRO_SHARE_THRESHOLD = 0.25;

const MIN_FILTER_MACRO_AMOUNT_G: Record<FoodMacroTag, number> = {
  protein: 3,
  carb: 5,
  fiber: 2,
  fat: 3,
};

const PLATE_TAGS: readonly FoodMacroTag[] = ['protein', 'carb', 'fiber'];

const PROTEIN_MAIN_PROFILES: readonly PairingProfile[] = [
  'chicken',
  'fish',
  'red-meat',
  'seafood',
];
const BREAD_LIKE_PROFILES: readonly PairingProfile[] = ['bread', 'tortilla'];
const SWEET_PROFILES: readonly PairingProfile[] = [
  'dairy-bowl',
  'fruit',
  'nut-butter',
  'sweet-fat',
  'sweet-grain',
];
const SAVORY_SIDE_PROFILES: readonly PairingProfile[] = [
  'grain',
  'legume',
  'savory-fat',
  'starchy-carb',
  'vegetable',
];

function isRecommendableFood(food: Food): boolean {
  return food.category !== 'drink';
}

export function getFoodMacroTags(food: Food): FoodMacroTag[] {
  const tags = new Set<FoodMacroTag>();

  if (food.category === 'protein' || food.category === 'dairy' || food.proteinG >= 18) {
    tags.add('protein');
  }
  if (food.category === 'carb' || food.category === 'fruit' || food.carbsG >= 20) {
    tags.add('carb');
  }
  if (food.category === 'vegetable' || food.category === 'legume' || food.fiberG >= 5) {
    tags.add('fiber');
  }
  if (food.category === 'fat' || food.category === 'cheese' || food.fatG >= 15) {
    tags.add('fat');
  }

  return Array.from(tags);
}

function getFilterMacroAmount(food: Food, tag: FoodMacroTag): number {
  if (tag === 'protein') return food.proteinG;
  if (tag === 'carb') return food.carbsG;
  if (tag === 'fiber') return food.fiberG;
  return food.fatG;
}

function getFilterMacroShare(food: Food, tag: FoodMacroTag): number {
  const totalMacroGrams = food.proteinG + food.carbsG + food.fatG + food.fiberG;
  return totalMacroGrams > 0 ? getFilterMacroAmount(food, tag) / totalMacroGrams : 0;
}

function getPrimaryFilterMacro(food: Food): FoodMacroTag | null {
  if (food.category === 'vegetable' || food.category === 'legume') return 'fiber';

  const macroGrams: Array<{ tag: FoodMacroTag; grams: number }> = [
    { tag: 'protein', grams: food.proteinG },
    { tag: 'carb', grams: food.carbsG },
    { tag: 'fat', grams: food.fatG },
    { tag: 'fiber', grams: food.fiberG },
  ];
  const primary = macroGrams.reduce((best, item) => (item.grams > best.grams ? item : best));

  return primary.grams > 0 ? primary.tag : null;
}

function getMacroFilterRank(food: Food, filter: FoodMacroTag): 0 | 1 | null {
  const primaryMacro = getPrimaryFilterMacro(food);
  const macroAmount = getFilterMacroAmount(food, filter);
  const hasPracticalAmount = macroAmount >= MIN_FILTER_MACRO_AMOUNT_G[filter];
  const isTaggedForMacro = getFoodMacroTags(food).includes(filter);

  if (primaryMacro === filter && (isTaggedForMacro || hasPracticalAmount)) {
    return 0;
  }

  if (
    isTaggedForMacro ||
    (hasPracticalAmount && getFilterMacroShare(food, filter) > SECONDARY_MACRO_SHARE_THRESHOLD)
  ) {
    return 1;
  }

  return null;
}

export function filterFoodsByMacro<T extends Food>(
  foods: readonly T[],
  filter: MacroFilter,
): T[] {
  if (filter === 'all') return [...foods];

  return foods
    .map((food, originalIndex) => ({
      food,
      originalIndex,
      rank: getMacroFilterRank(food, filter),
    }))
    .filter((item): item is { food: T; originalIndex: number; rank: 0 | 1 } => item.rank !== null)
    .sort((a, b) => {
      if (a.rank !== b.rank) return a.rank - b.rank;
      return a.originalIndex - b.originalIndex;
    })
    .map((item) => item.food);
}

function hasLowDailyNeed(
  tag: FoodMacroTag,
  nutrition: RecommendationNutrition | undefined,
): boolean {
  if (!nutrition) return false;
  return nutrition[LOW_STATUS_BY_TAG[tag]].status === 'low';
}

function matchesAnyTag(tags: readonly FoodMacroTag[], targetTags: ReadonlySet<FoodMacroTag>): boolean {
  return tags.some((tag) => targetTags.has(tag));
}

function getPrimaryRecommendationTag(food: Food, tags: readonly FoodMacroTag[]): FoodMacroTag | null {
  if (food.category === 'protein' || food.category === 'dairy') return 'protein';
  if (food.category === 'carb' || food.category === 'fruit') return 'carb';
  if (food.category === 'vegetable' || food.category === 'legume') return 'fiber';
  if (food.category === 'cheese') return 'protein';
  if (food.category === 'fat') return 'fat';
  return tags[0] ?? null;
}

function hasPlateTag(tags: readonly FoodMacroTag[]): boolean {
  return tags.some((tag) => PLATE_TAGS.includes(tag));
}

function hasAnyProfile(
  profiles: ReadonlySet<PairingProfile>,
  targets: readonly PairingProfile[],
): boolean {
  return targets.some((target) => profiles.has(target));
}

function getProteinMainProfile(profiles: ReadonlySet<PairingProfile>): PairingProfile | null {
  return PROTEIN_MAIN_PROFILES.find((profile) => profiles.has(profile)) ?? null;
}

function getPairingProfiles(food: Food): PairingProfile[] {
  if (
    food.id === 'kefir-natural' ||
    food.id === 'yogur-natural-desnatado-sin-lactosa' ||
    food.id === 'yogur-griego-natural' ||
    food.id === 'queso-fresco-batido' ||
    food.id === 'leche-semidesnatada'
  ) {
    return ['dairy-bowl'];
  }
  if (food.id.startsWith('pan-') || food.id === 'pan') return ['bread'];
  if (food.id.startsWith('tortilla-de-')) return ['tortilla'];
  if (food.id === 'avena' || food.id.startsWith('avena-') || food.id.startsWith('muesli-')) {
    return ['sweet-grain'];
  }
  if (food.id === 'crema-de-cacahuete') return ['nut-butter'];
  if (food.id === 'chocolate-negro') return ['sweet-fat'];
  if (food.id === 'aceite-de-oliva' || food.id === 'aguacate') return ['savory-fat'];
  if (food.id.includes('pollo') || food.id === 'pavo') return ['chicken'];
  if (
    food.id.includes('salmon') ||
    food.id.includes('atun') ||
    food.id.includes('merluza') ||
    food.id.includes('bacalao') ||
    food.id.includes('sardinas') ||
    food.id.includes('anchoas') ||
    food.id.includes('boquerones')
  ) {
    return ['fish'];
  }
  if (food.id.includes('gambas') || food.id.includes('mejillones')) return ['seafood'];
  if (food.id === 'ternera-magra' || food.id === 'entrecot') return ['red-meat'];
  if (
    food.id.includes('jamon') ||
    food.id === 'lomo-embuchado' ||
    food.id === 'chorizo' ||
    food.id === 'fuet' ||
    food.id === 'salchichon' ||
    food.id === 'bacon' ||
    food.id === 'panceta' ||
    food.id === 'pechuga-de-pavo-cocida'
  ) {
    return ['cold-cut'];
  }
  if (food.id === 'huevo') return ['egg'];
  if (food.category === 'cheese') return ['cheese'];
  if (food.category === 'fruit') return ['fruit'];
  if (food.category === 'vegetable') return ['vegetable'];
  if (food.category === 'legume') return ['legume'];
  if (food.category === 'carb') return ['starchy-carb'];
  if (food.category === 'protein') return ['red-meat'];
  if (food.category === 'fat') return ['savory-fat'];
  return [];
}

function scorePairing(candidate: Food, selected: Food): number {
  const candidateProfiles = new Set(getPairingProfiles(candidate));
  const selectedProfiles = new Set(getPairingProfiles(selected));
  const candidateMainProtein = getProteinMainProfile(candidateProfiles);
  const selectedMainProtein = getProteinMainProfile(selectedProfiles);

  if (hasAnyProfile(candidateProfiles, BREAD_LIKE_PROFILES) && hasAnyProfile(selectedProfiles, BREAD_LIKE_PROFILES)) {
    return -50;
  }
  if (candidateProfiles.has('dairy-bowl') && selectedProfiles.has('cheese')) return -45;
  if (candidateProfiles.has('cheese') && selectedProfiles.has('dairy-bowl')) return -45;
  if (candidateMainProtein && selectedMainProtein) {
    if (candidateMainProtein === selectedMainProtein) return 18;
    if (
      (candidateMainProtein === 'fish' && selectedMainProtein === 'seafood') ||
      (candidateMainProtein === 'seafood' && selectedMainProtein === 'fish')
    ) {
      return 8;
    }
    return -42;
  }
  if (selectedProfiles.has('dairy-bowl')) {
    if (candidateProfiles.has('nut-butter')) return 85;
    if (hasAnyProfile(candidateProfiles, ['fruit', 'sweet-fat', 'sweet-grain'])) return 45;
    if (candidateProfiles.has('dairy-bowl')) return 10;
    if (candidateProfiles.has('cheese') || candidateMainProtein || hasAnyProfile(candidateProfiles, SAVORY_SIDE_PROFILES)) {
      return -38;
    }
  }
  if (candidateProfiles.has('dairy-bowl')) {
    if (selectedProfiles.has('nut-butter')) return 85;
    if (hasAnyProfile(selectedProfiles, ['fruit', 'sweet-fat', 'sweet-grain'])) return 45;
    if (selectedProfiles.has('cheese') || selectedMainProtein || hasAnyProfile(selectedProfiles, SAVORY_SIDE_PROFILES)) {
      return -38;
    }
  }
  if (hasAnyProfile(selectedProfiles, BREAD_LIKE_PROFILES)) {
    if (candidateProfiles.has('cheese')) return 55;
    if (
      hasAnyProfile(candidateProfiles, [
        'cold-cut',
        'egg',
        'legume',
        'nut-butter',
        'savory-fat',
        'vegetable',
      ])
    ) {
      return 38;
    }
    if (candidateMainProtein) return 18;
    if (candidateProfiles.has('dairy-bowl')) return -35;
  }
  if (hasAnyProfile(candidateProfiles, BREAD_LIKE_PROFILES)) {
    if (selectedProfiles.has('cheese')) return 55;
    if (
      hasAnyProfile(selectedProfiles, [
        'cold-cut',
        'egg',
        'legume',
        'nut-butter',
        'savory-fat',
        'vegetable',
      ])
    ) {
      return 38;
    }
    if (selectedMainProtein) return 18;
    if (selectedProfiles.has('dairy-bowl')) return -35;
  }
  if (selectedProfiles.has('cheese')) {
    if (hasAnyProfile(candidateProfiles, ['bread', 'cold-cut', 'egg', 'fruit', 'savory-fat', 'tortilla', 'vegetable'])) {
      return 35;
    }
    if (candidateProfiles.has('dairy-bowl')) return -45;
  }
  if (candidateProfiles.has('cheese')) {
    if (hasAnyProfile(selectedProfiles, ['bread', 'cold-cut', 'egg', 'fruit', 'savory-fat', 'tortilla', 'vegetable'])) {
      return 35;
    }
    if (selectedProfiles.has('dairy-bowl')) return -45;
  }
  if (selectedMainProtein) {
    if (hasAnyProfile(candidateProfiles, SAVORY_SIDE_PROFILES)) return 35;
    if (candidateProfiles.has('egg') || candidateProfiles.has('cold-cut')) return 12;
    if (hasAnyProfile(candidateProfiles, SWEET_PROFILES)) return -35;
  }
  if (candidateMainProtein) {
    if (hasAnyProfile(selectedProfiles, SAVORY_SIDE_PROFILES)) return 35;
    if (selectedProfiles.has('egg') || selectedProfiles.has('cold-cut')) return 12;
    if (hasAnyProfile(selectedProfiles, SWEET_PROFILES)) return -35;
  }
  if (hasAnyProfile(selectedProfiles, ['fruit', 'nut-butter', 'sweet-fat', 'sweet-grain'])) {
    if (hasAnyProfile(candidateProfiles, ['dairy-bowl', 'fruit', 'nut-butter', 'sweet-fat', 'sweet-grain'])) return 35;
    if (candidateMainProtein) return -35;
  }
  if (hasAnyProfile(candidateProfiles, ['fruit', 'nut-butter', 'sweet-fat', 'sweet-grain'])) {
    if (hasAnyProfile(selectedProfiles, ['dairy-bowl', 'fruit', 'nut-butter', 'sweet-fat', 'sweet-grain'])) return 35;
    if (selectedMainProtein) return -35;
  }
  if (hasAnyProfile(candidateProfiles, SAVORY_SIDE_PROFILES) && hasAnyProfile(selectedProfiles, SAVORY_SIDE_PROFILES)) {
    return 20;
  }

  return 0;
}

function scorePairings(candidate: Food, selectedFoods: readonly Food[]): number {
  if (selectedFoods.length === 0) return 0;
  const scores = selectedFoods.map((selected) => scorePairing(candidate, selected));
  const worstScore = Math.min(...scores);
  const averageScore = scores.reduce((total, score) => total + score, 0) / scores.length;
  return Math.round(worstScore < -30 ? worstScore : averageScore);
}

function getDiversityProfile(food: Food): PairingProfile | 'other' {
  return getPairingProfiles(food)[0] ?? 'other';
}

function selectDiverseRecommendations<T extends { food: Food; originalIndex: number; score: number }>(
  rankedItems: T[],
  limit: number,
): T[] {
  const selected: T[] = [];
  const remaining = [...rankedItems];
  const profileCounts = new Map<PairingProfile | 'other', number>();

  while (remaining.length > 0 && selected.length < limit) {
    let bestIndex = 0;
    let bestAdjustedScore = -Infinity;

    for (const [index, item] of remaining.entries()) {
      const profile = getDiversityProfile(item.food);
      const adjustedScore = item.score - (profileCounts.get(profile) ?? 0) * 28;
      const bestItem = remaining[bestIndex];

      if (
        adjustedScore > bestAdjustedScore ||
        (adjustedScore === bestAdjustedScore &&
          (item.score > bestItem.score ||
            (item.score === bestItem.score && item.originalIndex < bestItem.originalIndex)))
      ) {
        bestIndex = index;
        bestAdjustedScore = adjustedScore;
      }
    }

    const [nextItem] = remaining.splice(bestIndex, 1);
    const profile = getDiversityProfile(nextItem.food);
    profileCounts.set(profile, (profileCounts.get(profile) ?? 0) + 1);
    selected.push(nextItem);
  }

  return selected;
}

export function recommendFoodsForMeal(
  foods: readonly Food[],
  context: RecommendationContext,
  limit = 6,
): Food[] {
  const selectedIds = new Set(context.selectedFoodIds);
  const favoriteIds = new Set(context.favoriteFoodIds ?? []);
  const recommendableFoods = foods.filter(isRecommendableFood);
  const selectedFoods = recommendableFoods.filter((food) => selectedIds.has(food.id));
  const selectedTags = new Set<FoodMacroTag>();

  for (const food of selectedFoods) {
    for (const tag of getFoodMacroTags(food)) {
      selectedTags.add(tag);
    }
  }
  const missingPlateTags = new Set(PLATE_TAGS.filter((tag) => !selectedTags.has(tag)));
  const shouldCompletePlate = selectedFoods.length > 0 && missingPlateTags.size > 0;

  const rankedItems = recommendableFoods
    .map((food, originalIndex) => {
      const tags = getFoodMacroTags(food);
      const primaryTag = getPrimaryRecommendationTag(food, tags);
      let score = 0;

      if (tags.some((tag) => hasLowDailyNeed(tag, context.nutrition))) {
        score += 30;
      }
      if (shouldCompletePlate && primaryTag && missingPlateTags.has(primaryTag)) {
        score += 50;
      } else if (shouldCompletePlate && matchesAnyTag(tags, missingPlateTags)) {
        score += 25;
      } else if (shouldCompletePlate && hasPlateTag(tags)) {
        score -= 10;
      }
      score += scorePairings(food, selectedFoods);
      if (favoriteIds.has(food.id)) {
        score += 8;
      }
      if (context.nutrition?.fatG.status === 'high' && tags.includes('fat')) {
        score -= 24;
      }
      if (context.nutrition?.kcal.status === 'high' && food.kcal > 250) {
        score -= 16;
      }

      return { food, originalIndex, score };
    })
    .filter((item) => !selectedIds.has(item.food.id))
    .sort((a, b) => {
      if (a.score !== b.score) return b.score - a.score;
      return a.originalIndex - b.originalIndex;
    });

  if (selectedFoods.length === 0) {
    return rankedItems.slice(0, limit).map((item) => item.food);
  }

  return selectDiverseRecommendations(rankedItems, limit)
    .map((item) => item.food);
}
