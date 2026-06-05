import { describe, expect, it } from 'vitest';
import { baseFoods } from '../data/baseFoods';
import { getActiveDateKey } from './dates';
import { searchFoods } from './food';
import { calculateDailyNutrition, DEFAULT_PROFILE } from './nutrition';
import {
  calculateDayTotals,
  calculateFoodMacros,
  calculateMealTotals,
  formatMealName,
  type Meal,
} from './meals';
import { createDefaultDayContext } from './days';

function food(id: string) {
  const found = baseFoods.find((item) => item.id === id);
  if (!found) throw new Error(`Missing food ${id}`);
  return found;
}

describe('baseFoods', () => {
  it('contains the 87 repaired seed foods', () => {
    expect(baseFoods).toHaveLength(87);
    expect(food('salmon').name).toBe('Salmón');
    expect(food('muslo-entero-de-pollo-air-fryer-con-hueso-y-piel').name).toBe('Muslo de pollo');
    expect(food('alita-de-pollo-air-fryer-con-hueso-y-piel').name).toBe('Alita de pollo');
    expect(food('atun-al-natural-escurrido').name).toBe('Atún al natural (escurrido)');
    expect(food('noquis').name).toBe('Ñoquis');
    expect(food('platano').name).toBe('Plátano');
    expect(food('arandanos').eyeballUnit).toBe('puñados');
    expect(food('pavo').servingLabel).toBe('ración (150 g)');
    expect(food('cafe-solo').category).toBe('drink');
    expect(food('cerveza').servingLabel).toBe('lata (330 g)');
  });

  it('converts comma decimals and keeps valid stable ids', () => {
    expect(food('pechuga-de-pollo').fatG).toBe(3.6);
    expect(food('atun-al-natural-escurrido').carbsG).toBe(0.9);
    expect(food('kefir-natural').proteinG).toBe(3.3);

    const ids = new Set(baseFoods.map((item) => item.id));
    expect(ids.size).toBe(baseFoods.length);
    for (const item of baseFoods) {
      expect(item.id).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
      expect(item.servingGrams).toBeGreaterThan(0);
      expect(item.kcal).toBeGreaterThanOrEqual(0);
      expect(item.proteinG).toBeGreaterThanOrEqual(0);
      expect(item.carbsG).toBeGreaterThanOrEqual(0);
      expect(item.fatG).toBeGreaterThanOrEqual(0);
      expect(item.fiberG).toBeGreaterThanOrEqual(0);
    }
  });

  it('searches by accented and unaccented terms and sorts favorites first', () => {
    expect(searchFoods(baseFoods, 'salmon')[0].id).toBe('salmon');
    expect(searchFoods(baseFoods, 'atún')[0].id).toBe('atun-al-natural-escurrido');
    expect(searchFoods(baseFoods, '', ['aguacate'])[0].id).toBe('aguacate');
  });
});

describe('meal calculations', () => {
  it('calculates food, meal and day totals from snapshots', () => {
    expect(calculateFoodMacros(food('arroz-cocido'), 100).kcal).toBe(130);
    const meal: Meal = {
      id: 'meal-1',
      createdAt: '2026-06-04T10:00:00.000Z',
      updatedAt: '2026-06-04T10:00:00.000Z',
      items: [
        {
          id: 'item-1',
          foodId: 'arroz-cocido',
          quantityGrams: 100,
          quantityMode: 'grams',
          snapshot: {
            ...food('arroz-cocido'),
            foodId: 'arroz-cocido',
          },
        },
        {
          id: 'item-2',
          foodId: 'huevo',
          quantityGrams: 60,
          quantityMode: 'grams',
          snapshot: {
            ...food('huevo'),
            foodId: 'huevo',
          },
        },
      ],
    };

    expect(calculateMealTotals(meal.items).kcal).toBeCloseTo(223);
    expect(calculateDayTotals([meal, meal]).kcal).toBeCloseTo(446);
    expect(formatMealName(meal)).toBe('Arroz cocido con huevo');
  });
});

describe('dates', () => {
  it('uses a 04:00 active-day cutoff', () => {
    expect(getActiveDateKey(new Date('2026-06-04T03:59:00'))).toBe('2026-06-03');
    expect(getActiveDateKey(new Date('2026-06-04T04:00:00'))).toBe('2026-06-04');
    expect(getActiveDateKey(new Date('2026-01-01T03:59:00'))).toBe('2025-12-31');
  });
});

describe('left2eat-nutrition-v1', () => {
  it('calculates BMR, TDEE, targets, balances and validations', () => {
    const nutrition = calculateDailyNutrition(
      DEFAULT_PROFILE,
      {
        ...createDefaultDayContext('2026-06-04'),
        trainingType: 'strength',
        trainingIntensity: 'normal',
        actualSteps: 8240,
      },
      { kcal: 1380, proteinG: 88, carbsG: 150, fatG: 52, fiberG: 18 },
    );

    expect(nutrition.methodology).toBe('left2eat-nutrition-v1');
    expect(nutrition.bmr).toBeCloseTo(1698.8, 1);
    expect(nutrition.dayAdjustedTdee).toBeGreaterThan(nutrition.baselineLifestyleTdee);
    expect(nutrition.kcal.target).toBeGreaterThan(2000);
    expect(nutrition.proteinG.status).toBe('low');
    expect(nutrition.fiberG.status).toBe('low');
    expect(nutrition.errors).toEqual([]);

    const invalid = calculateDailyNutrition(
      { ...DEFAULT_PROFILE, ageYears: 5, objective: 'bulk' as never },
      { ...createDefaultDayContext('bad-date'), trainingIntensity: 'wild' as never },
      { kcal: -1, proteinG: 0, carbsG: 0, fatG: 0, fiberG: 0 },
    );
    expect(invalid.errors).toContain('ageYears');
    expect(invalid.errors).toContain('objective');
    expect(invalid.errors).toContain('trainingIntensity');
    expect(invalid.errors).toContain('dateISO');
    expect(invalid.errors).toContain('kcal');
    expect(Number.isFinite(invalid.kcal.target)).toBe(true);
  });
});
