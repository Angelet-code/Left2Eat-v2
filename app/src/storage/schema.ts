import type { DayDraft } from '../domain/days';
import type { QuantityMode } from '../domain/meals';
import type { Profile } from '../domain/nutrition';

export const STORAGE_KEY = 'left2eat:app-state';
export const SCHEMA_VERSION = 1;

export type AppSettings = {
  quantityMode: QuantityMode;
};

export type AppState = {
  schemaVersion: typeof SCHEMA_VERSION;
  profile: Profile;
  favoriteFoodIds: string[];
  dayDrafts: Record<string, DayDraft>;
  settings: AppSettings;
};
