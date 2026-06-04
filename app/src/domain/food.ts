export type FoodCategory =
  | 'protein'
  | 'carb'
  | 'fruit'
  | 'vegetable'
  | 'legume'
  | 'dairy'
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

export function normalizeSearchText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
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
  if (food.category === 'dairy') return 'proteina';
  return 'proteina';
}
