import type { DayContext, DayDraft } from '../domain/days';
import type { Meal, NutritionTotals, QuantityMode } from '../domain/meals';
import type { NutrientTarget, Profile } from '../domain/nutrition';

export const STORAGE_KEY = 'left2eat:app-state';
export const SCHEMA_VERSION = 2;

export type AppSettings = {
  quantityMode: QuantityMode;
};

export type RegisteredDay = {
  dateKey: string;
  registeredAt: string;
  profile: Profile;
  context: DayContext;
  meals: Meal[];
  totals: NutritionTotals;
  nutrition: {
    kcal: NutrientTarget;
    proteinG: NutrientTarget;
    carbsG: NutrientTarget;
    fatG: NutrientTarget;
    fiberG: NutrientTarget;
  };
};

export type AppState = {
  schemaVersion: typeof SCHEMA_VERSION;
  profile: Profile;
  favoriteFoodIds: string[];
  dayDrafts: Record<string, DayDraft>;
  registeredDays: Record<string, RegisteredDay>;
  settings: AppSettings;
};
