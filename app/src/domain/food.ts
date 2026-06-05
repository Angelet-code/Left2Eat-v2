export type FoodCategory =
  | 'protein'
  | 'carb'
  | 'fruit'
  | 'vegetable'
  | 'legume'
  | 'dairy'
  | 'drink'
  | 'fat'
  | 'cheese'
  | 'other';

export type Food = {
  id: string;
  name: string;
  aliases: string[];
  category: FoodCategory;
  kcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
  servingLabel: string;
  servingGrams: number;
  eyeballUnit: string;
  spriteKey: string;
};

export type FoodSearchResult = Food & {
  favorite: boolean;
  score: number;
};

type FoodNameSource = Pick<Food, 'name'> & {
  id?: string;
  foodId?: string;
};

const SIMPLE_FOOD_NAMES_BY_ID: Record<string, string> = {
  'muslo-entero-de-pollo-air-fryer-con-hueso-y-piel': 'Muslo de pollo',
  'alita-de-pollo-air-fryer-con-hueso-y-piel': 'Alita de pollo',
};

const SIMPLE_FOOD_NAMES_BY_NAME: Record<string, string> = {
  'Muslo entero de pollo air fryer (con hueso y piel)': 'Muslo de pollo',
  'Alita de pollo air fryer (con hueso y piel)': 'Alita de pollo',
};

export function normalizeSearchText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function getDisplayFoodName(food: FoodNameSource): string {
  const stableId = food.id ?? food.foodId;
  if (stableId && SIMPLE_FOOD_NAMES_BY_ID[stableId]) {
    return SIMPLE_FOOD_NAMES_BY_ID[stableId];
  }

  return SIMPLE_FOOD_NAMES_BY_NAME[food.name] ?? food.name;
}

export function searchFoods(
  foods: readonly Food[],
  query: string,
  favoriteFoodIds: readonly string[] = [],
): FoodSearchResult[] {
  const normalizedQuery = normalizeSearchText(query);
  const favorites = new Set(favoriteFoodIds);

  return foods
    .map((food, index) => {
      const name = normalizeSearchText(food.name);
      const aliases = food.aliases.map(normalizeSearchText);
      const favorite = favorites.has(food.id);
      let score = 0;

      if (!normalizedQuery) {
        score = 1;
      } else if (name === normalizedQuery) {
        score = 100;
      } else if (name.startsWith(normalizedQuery)) {
        score = 80;
      } else if (name.includes(normalizedQuery)) {
        score = 60;
      } else if (aliases.some((alias) => alias === normalizedQuery)) {
        score = 45;
      } else if (aliases.some((alias) => alias.includes(normalizedQuery))) {
        score = 30;
      }

      return { ...food, favorite, score, originalIndex: index };
    })
    .filter((food) => food.score > 0)
    .sort((a, b) => {
      if (a.favorite !== b.favorite) return a.favorite ? -1 : 1;
      if (a.score !== b.score) return b.score - a.score;
      return a.originalIndex - b.originalIndex;
    })
    .map(({ originalIndex: _originalIndex, ...food }) => food);
}

export function getPrimaryMacro(food: Pick<Food, 'category'>): string {
  if (food.category === 'carb' || food.category === 'fruit') return 'carbohidrato';
  if (food.category === 'fat' || food.category === 'cheese') return 'grasa';
  if (food.category === 'vegetable' || food.category === 'legume') return 'fibra';
  if (food.category === 'drink') return 'bebida';
  if (food.category === 'dairy') return 'proteína';
  return 'proteína';
}
