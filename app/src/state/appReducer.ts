import { baseFoods } from '../data/baseFoods';
import { createDayDraft, type DayContext } from '../domain/days';
import { getActiveDateKey } from '../domain/dates';
import {
  createId,
  createMealItem,
  type Meal,
  type MealItemInput,
  type QuantityMode,
} from '../domain/meals';
import type { Profile } from '../domain/nutrition';
import type { AppState } from '../storage/schema';

export type AppAction =
  | { type: 'ensureActiveDay'; now?: string }
  | { type: 'setDayContext'; dateKey: string; context: Partial<DayContext> }
  | { type: 'addMeal'; dateKey: string; items: MealItemInput[] }
  | {
      type: 'updateMealItemQuantity';
      dateKey: string;
      mealId: string;
      itemId: string;
      quantityGrams: number;
      quantityMode: QuantityMode;
      eyeballAmount?: number;
    }
  | { type: 'removeMealItem'; dateKey: string; mealId: string; itemId: string }
  | { type: 'deleteMeal'; dateKey: string; mealId: string; confirmed?: boolean }
  | { type: 'toggleFavorite'; foodId: string }
  | { type: 'updateProfile'; profile: Profile }
  | { type: 'setQuantityMode'; mode: QuantityMode }
  | { type: 'hydrate'; state: AppState };

const foodById = new Map(baseFoods.map((food) => [food.id, food]));
const quantityModes = ['grams', 'eyeball'] as const;

function isQuantityMode(value: unknown): value is QuantityMode {
  return quantityModes.includes(value as QuantityMode);
}

function ensureDay(state: AppState, dateKey: string): AppState {
  if (state.dayDrafts[dateKey]) return state;
  return {
    ...state,
    dayDrafts: {
      ...state.dayDrafts,
      [dateKey]: createDayDraft(dateKey),
    },
  };
}

function updateMeals(state: AppState, dateKey: string, meals: Meal[]): AppState {
  return {
    ...state,
    dayDrafts: {
      ...state.dayDrafts,
      [dateKey]: {
        ...state.dayDrafts[dateKey],
        meals,
      },
    },
  };
}

function validMealInput(input: MealItemInput): boolean {
  return (
    foodById.has(input.foodId) &&
    Number.isFinite(input.quantityGrams) &&
    input.quantityGrams > 0 &&
    isQuantityMode(input.quantityMode)
  );
}

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'hydrate':
      return action.state;

    case 'ensureActiveDay': {
      const dateKey = getActiveDateKey(action.now ? new Date(action.now) : new Date());
      return ensureDay(state, dateKey);
    }

    case 'setDayContext': {
      const withDay = ensureDay(state, action.dateKey);
      const day = withDay.dayDrafts[action.dateKey];
      return {
        ...withDay,
        dayDrafts: {
          ...withDay.dayDrafts,
          [action.dateKey]: {
            ...day,
            context: {
              ...day.context,
              ...action.context,
              dateISO: action.dateKey,
            },
          },
        },
      };
    }

    case 'addMeal': {
      const validItems = action.items.filter(validMealInput);
      if (validItems.length === 0) return state;
      const withDay = ensureDay(state, action.dateKey);
      const now = new Date().toISOString();
      const meal: Meal = {
        id: createId('meal'),
        createdAt: now,
        updatedAt: now,
        items: validItems.map((input) => createMealItem(foodById.get(input.foodId)!, input)),
      };
      return updateMeals(withDay, action.dateKey, [...withDay.dayDrafts[action.dateKey].meals, meal]);
    }

    case 'updateMealItemQuantity': {
      if (
        !Number.isFinite(action.quantityGrams) ||
        action.quantityGrams <= 0 ||
        !isQuantityMode(action.quantityMode)
      ) {
        return state;
      }
      const day = state.dayDrafts[action.dateKey];
      if (!day) return state;
      const now = new Date().toISOString();
      const meals = day.meals.map((meal) => {
        if (meal.id !== action.mealId) return meal;
        return {
          ...meal,
          updatedAt: now,
          items: meal.items.map((item) =>
            item.id === action.itemId
              ? {
                  ...item,
                  quantityGrams: action.quantityGrams,
                  quantityMode: action.quantityMode,
                  eyeballAmount: action.eyeballAmount,
                }
              : item,
          ),
        };
      });
      return updateMeals(state, action.dateKey, meals);
    }

    case 'removeMealItem': {
      const day = state.dayDrafts[action.dateKey];
      if (!day) return state;
      const now = new Date().toISOString();
      const meals = day.meals
        .map((meal) => {
          if (meal.id !== action.mealId) return meal;
          return {
            ...meal,
            updatedAt: now,
            items: meal.items.filter((item) => item.id !== action.itemId),
          };
        })
        .filter((meal) => meal.items.length > 0);
      return updateMeals(state, action.dateKey, meals);
    }

    case 'deleteMeal': {
      const day = state.dayDrafts[action.dateKey];
      if (!day) return state;
      const meal = day.meals.find((candidate) => candidate.id === action.mealId);
      if (!meal) return state;
      if (meal.items.length > 0 && !action.confirmed) return state;
      return updateMeals(
        state,
        action.dateKey,
        day.meals.filter((candidate) => candidate.id !== action.mealId),
      );
    }

    case 'toggleFavorite': {
      if (!foodById.has(action.foodId)) return state;
      const exists = state.favoriteFoodIds.includes(action.foodId);
      return {
        ...state,
        favoriteFoodIds: exists
          ? state.favoriteFoodIds.filter((foodId) => foodId !== action.foodId)
          : [...state.favoriteFoodIds, action.foodId],
      };
    }

    case 'updateProfile':
      return {
        ...state,
        profile: action.profile,
      };

    case 'setQuantityMode':
      if (!isQuantityMode(action.mode)) return state;
      return {
        ...state,
        settings: {
          ...state.settings,
          quantityMode: action.mode,
        },
      };

    default:
      return state;
  }
}
