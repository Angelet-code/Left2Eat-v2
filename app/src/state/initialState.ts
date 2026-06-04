import { DEFAULT_PROFILE } from '../domain/nutrition';
import { SCHEMA_VERSION, type AppState } from '../storage/schema';

export function createInitialState(): AppState {
  return {
    schemaVersion: SCHEMA_VERSION,
    profile: { ...DEFAULT_PROFILE },
    favoriteFoodIds: [],
    dayDrafts: {},
    registeredDays: {},
    settings: {
      quantityMode: 'grams',
    },
  };
}
