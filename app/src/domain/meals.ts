import { getDisplayFoodName, type Food, type FoodCategory } from './food';

export type QuantityMode = 'grams' | 'eyeball';

export type NutritionTotals = {
  kcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
};

export type FoodSnapshot = {
  foodId: string;
  name: string;
  kcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
  servingLabel: string;
  servingGrams: number;
  eyeballUnit: string;
  spriteKey: string;
  category: FoodCategory;
};

export type MealItem = {
  id: string;
  foodId: string;
  quantityGrams: number;
  quantityMode: QuantityMode;
  eyeballAmount?: number;
  snapshot: FoodSnapshot;
};

export type Meal = {
  id: string;
  createdAt: string;
  updatedAt: string;
  items: MealItem[];
};

export type MealItemInput = {
  foodId: string;
  quantityGrams: number;
  quantityMode: QuantityMode;
  eyeballAmount?: number;
};

export const ZERO_TOTALS: NutritionTotals = {
  kcal: 0,
  proteinG: 0,
  carbsG: 0,
  fatG: 0,
  fiberG: 0,
};

export function createId(prefix: string): string {
  if (globalThis.crypto?.randomUUID) {
    return `${prefix}-${globalThis.crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function createFoodSnapshot(food: Food): FoodSnapshot {
  return {
    foodId: food.id,
    name: getDisplayFoodName(food),
    kcal: food.kcal,
    proteinG: food.proteinG,
    carbsG: food.carbsG,
    fatG: food.fatG,
    fiberG: food.fiberG,
    servingLabel: food.servingLabel,
    servingGrams: food.servingGrams,
    eyeballUnit: food.eyeballUnit,
    spriteKey: food.spriteKey,
    category: food.category,
  };
}

export function calculateFoodMacros(
  food: Food | FoodSnapshot,
  grams: number,
): NutritionTotals {
  if (!Number.isFinite(grams) || grams <= 0) {
    return { ...ZERO_TOTALS };
  }

  const factor = grams / 100;
  return {
    kcal: food.kcal * factor,
    proteinG: food.proteinG * factor,
    carbsG: food.carbsG * factor,
    fatG: food.fatG * factor,
    fiberG: food.fiberG * factor,
  };
}

export function addTotals(a: NutritionTotals, b: NutritionTotals): NutritionTotals {
  return {
    kcal: a.kcal + b.kcal,
    proteinG: a.proteinG + b.proteinG,
    carbsG: a.carbsG + b.carbsG,
    fatG: a.fatG + b.fatG,
    fiberG: a.fiberG + b.fiberG,
  };
}

export function calculateMealTotals(items: readonly MealItem[]): NutritionTotals {
  return items.reduce(
    (total, item) => addTotals(total, calculateFoodMacros(item.snapshot, item.quantityGrams)),
    { ...ZERO_TOTALS },
  );
}

export function calculateDayTotals(meals: readonly Meal[]): NutritionTotals {
  return meals.reduce((total, meal) => addTotals(total, calculateMealTotals(meal.items)), {
    ...ZERO_TOTALS,
  });
}

export function roundTotals(totals: NutritionTotals): NutritionTotals {
  return {
    kcal: Math.round(totals.kcal),
    proteinG: Math.round(totals.proteinG),
    carbsG: Math.round(totals.carbsG),
    fatG: Math.round(totals.fatG),
    fiberG: Math.round(totals.fiberG),
  };
}

export function createMealItem(food: Food, input: MealItemInput): MealItem {
  return {
    id: createId('item'),
    foodId: food.id,
    quantityGrams: input.quantityGrams,
    quantityMode: input.quantityMode,
    eyeballAmount: input.eyeballAmount,
    snapshot: createFoodSnapshot(food),
  };
}

export function formatMealName(meal: Pick<Meal, 'items'>): string {
  const names = meal.items.map((item) =>
    getDisplayFoodName({ name: item.snapshot.name, foodId: item.foodId }),
  );
  if (names.length === 0) return 'Comida sin alimentos';
  if (names.length === 1) return names[0];

  const normalizedNames = names.map((name, index) => {
    if (index === 0) return name;
    return name
      .replace(/\s*\([^)]*\)/g, '')
      .replace(/^(arroz|pan|pasta)\s+/i, '$1 ')
      .trim()
      .toLowerCase();
  });

  const [first, ...rest] = normalizedNames;
  if (rest.length === 1) return `${first} con ${rest[0]}`;
  return `${first} con ${rest.slice(0, -1).join(', ')} y ${rest.at(-1)}`;
}
