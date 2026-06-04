import { describe, expect, it } from 'vitest';
import { appReducer } from './appReducer';
import { createInitialState } from './initialState';
import { loadState, saveState } from '../storage/localStorage';
import { STORAGE_KEY } from '../storage/schema';

function storageMock(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear: () => map.clear(),
    getItem: (key) => map.get(key) ?? null,
    key: (index) => [...map.keys()][index] ?? null,
    removeItem: (key) => map.delete(key),
    setItem: (key, value) => {
      map.set(key, value);
    },
  };
}

describe('appReducer', () => {
  it('creates a day, adds a meal, edits quantity and removes the final item', () => {
    const dateKey = '2026-06-04';
    let state = createInitialState();

    state = appReducer(state, {
      type: 'addMeal',
      dateKey,
      items: [
        {
          foodId: 'arroz-cocido',
          quantityGrams: 100,
          quantityMode: 'grams',
        },
      ],
    });

    const meal = state.dayDrafts[dateKey].meals[0];
    const item = meal.items[0];
    expect(meal.items).toHaveLength(1);
    expect(item.snapshot.name).toBe('Arroz cocido');

    state = appReducer(state, {
      type: 'updateMealItemQuantity',
      dateKey,
      mealId: meal.id,
      itemId: item.id,
      quantityGrams: 150,
      quantityMode: 'grams',
    });
    expect(state.dayDrafts[dateKey].meals[0].items[0].quantityGrams).toBe(150);

    state = appReducer(state, {
      type: 'removeMealItem',
      dateKey,
      mealId: meal.id,
      itemId: item.id,
    });
    expect(state.dayDrafts[dateKey].meals).toHaveLength(0);
  });

  it('toggles favorites, updates profile and quantity mode', () => {
    let state = createInitialState();
    state = appReducer(state, { type: 'toggleFavorite', foodId: 'salmon' });
    expect(state.favoriteFoodIds).toEqual(['salmon']);
    state = appReducer(state, { type: 'toggleFavorite', foodId: 'salmon' });
    expect(state.favoriteFoodIds).toEqual([]);

    state = appReducer(state, { type: 'setQuantityMode', mode: 'eyeball' });
    expect(state.settings.quantityMode).toBe('eyeball');
    state = appReducer(state, { type: 'setQuantityMode', mode: 'cups' as never });
    expect(state.settings.quantityMode).toBe('eyeball');

    state = appReducer(state, {
      type: 'updateProfile',
      profile: { ...state.profile, weightKg: 80 },
    });
    expect(state.profile.weightKg).toBe(80);
  });
});

describe('localStorage adapter', () => {
  it('saves, loads and normalizes state', () => {
    const storage = storageMock();
    const state = appReducer(createInitialState(), {
      type: 'toggleFavorite',
      foodId: 'salmon',
    });

    saveState(state, storage);
    expect(storage.getItem(STORAGE_KEY)).toContain('salmon');
    expect(loadState(storage).favoriteFoodIds).toEqual(['salmon']);
  });

  it('tolerates corrupt JSON and incomplete records', () => {
    const storage = storageMock();
    storage.setItem(STORAGE_KEY, '{nope');
    expect(loadState(storage)).toEqual(createInitialState());

    storage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        schemaVersion: 0,
        favoriteFoodIds: ['salmon', 'salmon', 'missing'],
        profile: { weightKg: 82 },
        settings: { quantityMode: 'eyeball' },
      }),
    );
    const loaded = loadState(storage);
    expect(loaded.schemaVersion).toBe(1);
    expect(loaded.favoriteFoodIds).toEqual(['salmon']);
    expect(loaded.profile.weightKg).toBe(82);
    expect(loaded.profile.ageYears).toBe(30);
    expect(loaded.settings.quantityMode).toBe('eyeball');
  });

  it('drops impossible day keys and mismatched meal snapshots', () => {
    const storage = storageMock();
    storage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        dayDrafts: {
          '2026-02-31': {
            meals: [],
          },
          '2026-06-04': {
            meals: [
              {
                id: 'meal-1',
                createdAt: '2026-06-04T10:00:00.000Z',
                updatedAt: '2026-06-04T10:00:00.000Z',
                items: [
                  {
                    id: 'item-1',
                    foodId: 'salmon',
                    quantityGrams: 100,
                    quantityMode: 'grams',
                    snapshot: {
                      foodId: 'huevo',
                      name: 'Huevo',
                    },
                  },
                ],
              },
            ],
          },
        },
      }),
    );

    const loaded = loadState(storage);
    expect(loaded.dayDrafts['2026-02-31']).toBeUndefined();
    expect(loaded.dayDrafts['2026-06-04'].meals).toHaveLength(0);
  });

  it('does not throw when storage access fails', () => {
    const brokenStorage = {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('quota');
      },
    } as unknown as Storage;

    expect(loadState(brokenStorage)).toEqual(createInitialState());
    expect(() => saveState(createInitialState(), brokenStorage)).not.toThrow();
  });
});
