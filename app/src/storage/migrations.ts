import { baseFoods } from '../data/baseFoods';
import { createDefaultDayContext, type DayContext, type DayDraft } from '../domain/days';
import { isValidDateKey } from '../domain/dates';
import { calculateDayTotals, roundTotals, type Meal, type MealItem, type NutritionTotals } from '../domain/meals';
import {
  calculateDailyNutrition,
  DEFAULT_PROFILE,
  VALID_ACTIVITY_VALUES,
  VALID_OBJECTIVE_VALUES,
  VALID_SEX_VALUES,
  type BalanceStatus,
  type NutrientTarget,
  type Profile,
} from '../domain/nutrition';
import { createInitialState } from '../state/initialState';
import { SCHEMA_VERSION, type AppState, type RegisteredDay } from './schema';

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function numberOr(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function stringOr<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

export function normalizeProfile(value: unknown): Profile {
  const raw = isObject(value) ? value : {};
  return {
    sex: stringOr(raw.sex, VALID_SEX_VALUES, DEFAULT_PROFILE.sex),
    ageYears: numberOr(raw.ageYears, DEFAULT_PROFILE.ageYears),
    heightCm: numberOr(raw.heightCm, DEFAULT_PROFILE.heightCm),
    weightKg: numberOr(raw.weightKg, DEFAULT_PROFILE.weightKg),
    objective: stringOr(
      raw.objective,
      VALID_OBJECTIVE_VALUES,
      DEFAULT_PROFILE.objective,
    ),
    activityLevel: stringOr(
      raw.activityLevel,
      VALID_ACTIVITY_VALUES,
      DEFAULT_PROFILE.activityLevel,
    ),
    plannedTrainingsPerWeek: numberOr(
      raw.plannedTrainingsPerWeek,
      DEFAULT_PROFILE.plannedTrainingsPerWeek,
    ),
    habitualStepsPerDay: numberOr(raw.habitualStepsPerDay, DEFAULT_PROFILE.habitualStepsPerDay),
  };
}

function normalizeMealItem(value: unknown): MealItem | null {
  if (!isObject(value) || !isObject(value.snapshot)) return null;
  const snapshot = value.snapshot;
  const foodId = typeof value.foodId === 'string' ? value.foodId : undefined;
  const snapshotFoodId = typeof snapshot.foodId === 'string' ? snapshot.foodId : foodId;
  const quantityGrams = numberOr(value.quantityGrams, 0);
  if (!foodId || !snapshotFoodId || snapshotFoodId !== foodId || quantityGrams <= 0) return null;

  return {
    id: typeof value.id === 'string' ? value.id : `item-${foodId}`,
    foodId,
    quantityGrams,
    quantityMode: stringOr(value.quantityMode, ['grams', 'eyeball'] as const, 'grams'),
    eyeballAmount: typeof value.eyeballAmount === 'number' ? value.eyeballAmount : undefined,
    snapshot: {
      foodId,
      name: typeof snapshot.name === 'string' ? snapshot.name : foodId,
      kcal: numberOr(snapshot.kcal, 0),
      proteinG: numberOr(snapshot.proteinG, 0),
      carbsG: numberOr(snapshot.carbsG, 0),
      fatG: numberOr(snapshot.fatG, 0),
      fiberG: numberOr(snapshot.fiberG, 0),
      servingLabel: typeof snapshot.servingLabel === 'string' ? snapshot.servingLabel : '100 g',
      servingGrams: numberOr(snapshot.servingGrams, 100),
      eyeballUnit: typeof snapshot.eyeballUnit === 'string' ? snapshot.eyeballUnit : 'raciones',
      spriteKey: typeof snapshot.spriteKey === 'string' ? snapshot.spriteKey : 'generic',
      category: stringOr(
        snapshot.category,
        ['protein', 'carb', 'fruit', 'vegetable', 'legume', 'dairy', 'fat', 'cheese', 'other'] as const,
        'other',
      ),
    },
  };
}

function normalizeMeal(value: unknown): Meal | null {
  if (!isObject(value)) return null;
  const items = Array.isArray(value.items)
    ? value.items.map(normalizeMealItem).filter((item): item is MealItem => item !== null)
    : [];
  if (items.length === 0) return null;
  const now = new Date().toISOString();

  return {
    id: typeof value.id === 'string' ? value.id : `meal-${now}`,
    createdAt: typeof value.createdAt === 'string' ? value.createdAt : now,
    updatedAt: typeof value.updatedAt === 'string' ? value.updatedAt : now,
    items,
  };
}

function normalizeDayContext(dateKey: string, value: unknown): DayContext {
  const raw = isObject(value) ? value : {};
  const defaultContext = createDefaultDayContext(dateKey);

  return {
    dateISO: dateKey,
    trainingType: stringOr(
      raw.trainingType,
      ['none', 'strength', 'cardio', 'strength-cardio'] as const,
      defaultContext.trainingType,
    ),
    trainingIntensity: stringOr(
      raw.trainingIntensity,
      ['easy', 'normal', 'hard'] as const,
      defaultContext.trainingIntensity,
    ),
    actualSteps: typeof raw.actualSteps === 'number' ? raw.actualSteps : undefined,
    trainingMinutes: typeof raw.trainingMinutes === 'number' ? raw.trainingMinutes : undefined,
  };
}

function normalizeTotals(value: unknown, fallback: NutritionTotals): NutritionTotals {
  const raw = isObject(value) ? value : {};
  return {
    kcal: numberOr(raw.kcal, fallback.kcal),
    proteinG: numberOr(raw.proteinG, fallback.proteinG),
    carbsG: numberOr(raw.carbsG, fallback.carbsG),
    fatG: numberOr(raw.fatG, fallback.fatG),
    fiberG: numberOr(raw.fiberG, fallback.fiberG),
  };
}

function normalizeTarget(value: unknown, fallback: NutrientTarget): NutrientTarget {
  const raw = isObject(value) ? value : {};
  const range: [number, number] =
    Array.isArray(raw.range) && raw.range.length >= 2
      ? [numberOr(raw.range[0], fallback.range[0]), numberOr(raw.range[1], fallback.range[1])]
      : [...fallback.range];

  return {
    target: numberOr(raw.target, fallback.target),
    range,
    consumed: numberOr(raw.consumed, fallback.consumed),
    remaining: numberOr(raw.remaining, fallback.remaining),
    status: stringOr(raw.status, ['low', 'ok', 'high'] as readonly BalanceStatus[], fallback.status),
  };
}

function normalizeDayDraft(dateKey: string, value: unknown): DayDraft {
  const raw = isObject(value) ? value : {};
  const context = isObject(raw.context) ? raw.context : {};
  const meals = Array.isArray(raw.meals)
    ? raw.meals.map(normalizeMeal).filter((meal): meal is Meal => meal !== null)
    : [];

  return {
    dateKey,
    context: normalizeDayContext(dateKey, context),
    meals,
  };
}

function normalizeRegisteredDay(dateKey: string, value: unknown): RegisteredDay | null {
  const raw = isObject(value) ? value : {};
  const meals = Array.isArray(raw.meals)
    ? raw.meals.map(normalizeMeal).filter((meal): meal is Meal => meal !== null)
    : [];
  if (meals.length === 0) return null;

  const context = normalizeDayContext(dateKey, isObject(raw.context) ? raw.context : {});
  const fallbackTotals = roundTotals(calculateDayTotals(meals));
  const totals = normalizeTotals(raw.totals, fallbackTotals);
  const profile = normalizeProfile(raw.profile);
  const fallbackNutrition = calculateDailyNutrition(profile, context, totals);
  const nutrition = isObject(raw.nutrition) ? raw.nutrition : {};

  return {
    dateKey,
    registeredAt: typeof raw.registeredAt === 'string' ? raw.registeredAt : new Date().toISOString(),
    profile,
    context,
    meals,
    totals,
    nutrition: {
      kcal: normalizeTarget(nutrition.kcal, fallbackNutrition.kcal),
      proteinG: normalizeTarget(nutrition.proteinG, fallbackNutrition.proteinG),
      carbsG: normalizeTarget(nutrition.carbsG, fallbackNutrition.carbsG),
      fatG: normalizeTarget(nutrition.fatG, fallbackNutrition.fatG),
      fiberG: normalizeTarget(nutrition.fiberG, fallbackNutrition.fiberG),
    },
  };
}

export function migrateState(raw: unknown): AppState {
  const defaults = createInitialState();
  if (!isObject(raw)) return defaults;

  const validFoodIds = new Set(baseFoods.map((food) => food.id));
  const favoriteFoodIds = Array.isArray(raw.favoriteFoodIds)
    ? [...new Set(raw.favoriteFoodIds)]
        .filter((id): id is string => typeof id === 'string')
        .filter((id) => validFoodIds.has(id))
    : [];
  const dayDrafts: Record<string, DayDraft> = {};
  const registeredDays: Record<string, RegisteredDay> = {};

  if (isObject(raw.dayDrafts)) {
    for (const [dateKey, draft] of Object.entries(raw.dayDrafts)) {
      if (isValidDateKey(dateKey)) {
        dayDrafts[dateKey] = normalizeDayDraft(dateKey, draft);
      }
    }
  }

  if (isObject(raw.registeredDays)) {
    for (const [dateKey, registeredDay] of Object.entries(raw.registeredDays)) {
      if (isValidDateKey(dateKey)) {
        const normalized = normalizeRegisteredDay(dateKey, registeredDay);
        if (normalized) registeredDays[dateKey] = normalized;
      }
    }
  }

  const settings = isObject(raw.settings) ? raw.settings : {};

  return {
    schemaVersion: SCHEMA_VERSION,
    profile: normalizeProfile(raw.profile),
    favoriteFoodIds,
    dayDrafts,
    registeredDays,
    settings: {
      quantityMode: stringOr(settings.quantityMode, ['grams', 'eyeball'] as const, 'grams'),
    },
  };
}
