import { describe, expect, it } from 'vitest';
import { baseFoods } from '../data/baseFoods';
import type { Food } from './food';
import {
  filterFoodsByMacro,
  getFoodMacroTags,
  recommendFoodsForMeal,
  type RecommendationNutrition,
} from './recommendations';

function food(id: string): Food {
  const found = baseFoods.find((item) => item.id === id);
  if (!found) throw new Error(`Missing food ${id}`);
  return found;
}

function testFood(id: string, values: Partial<Food> = {}): Food {
  return {
    id,
    name: id,
    aliases: [],
    category: 'other',
    kcal: 100,
    proteinG: 0,
    carbsG: 0,
    fatG: 0,
    fiberG: 0,
    servingLabel: 'ración (100 g)',
    servingGrams: 100,
    eyeballUnit: 'raciones',
    spriteKey: id,
    ...values,
  };
}

function nutrition(
  statuses: Partial<Record<keyof RecommendationNutrition, RecommendationNutrition[keyof RecommendationNutrition]['status']>>,
): RecommendationNutrition {
  return {
    kcal: { status: statuses.kcal ?? 'ok' },
    proteinG: { status: statuses.proteinG ?? 'ok' },
    carbsG: { status: statuses.carbsG ?? 'ok' },
    fatG: { status: statuses.fatG ?? 'ok' },
    fiberG: { status: statuses.fiberG ?? 'ok' },
  };
}

describe('food macro filters', () => {
  it('includes protein-dense foods and excludes simple carbs from protein results', () => {
    const results = filterFoodsByMacro(baseFoods, 'protein').map((item) => item.id);

    expect(results).toContain('pechuga-de-pollo');
    expect(results).not.toContain('arroz-cocido');
  });

  it('keeps secondary macro matches after primary macro matches', () => {
    const results = filterFoodsByMacro(
      [food('pechuga-de-pollo'), food('salmon'), food('crema-de-cacahuete')],
      'protein',
    ).map((item) => item.id);

    expect(results).toEqual(['pechuga-de-pollo', 'salmon', 'crema-de-cacahuete']);
  });

  it('treats salmon as a primary protein food by macro grams', () => {
    const results = filterFoodsByMacro(
      [food('salmon'), food('arroz-cocido'), food('aceite-de-oliva')],
      'protein',
    ).map((item) => item.id);

    expect(results).toEqual(['salmon']);
  });

  it('keeps lomo embuchado below primary fat foods in fat results', () => {
    const results = filterFoodsByMacro(
      [food('lomo-embuchado'), food('aceite-de-oliva'), food('arroz-cocido')],
      'fat',
    ).map((item) => item.id);

    expect(results).toEqual(['aceite-de-oliva', 'lomo-embuchado']);
  });

  it('allows foods to appear under multiple macro tags', () => {
    const tags = getFoodMacroTags(food('crema-de-cacahuete'));

    expect(tags).toEqual(expect.arrayContaining(['protein', 'carb', 'fiber', 'fat']));
    expect(filterFoodsByMacro(baseFoods, 'fiber').map((item) => item.id)).toContain(
      'crema-de-cacahuete',
    );
  });
});

describe('meal recommendations', () => {
  it('excludes already selected foods', () => {
    const results = recommendFoodsForMeal(baseFoods, { selectedFoodIds: ['salmon'] }, 12);

    expect(results.map((item) => item.id)).not.toContain('salmon');
  });

  it('prioritizes carb and fiber complements after selecting protein', () => {
    const foods = [
      testFood('protein-selected', { category: 'protein', proteinG: 25 }),
      testFood('extra-protein', { category: 'protein', proteinG: 24 }),
      testFood('carb-option', { category: 'carb', carbsG: 30 }),
      testFood('fiber-option', { category: 'vegetable', fiberG: 4 }),
    ];
    const results = recommendFoodsForMeal(foods, { selectedFoodIds: ['protein-selected'] }, 3);

    expect(results.map((item) => item.id)).toEqual([
      'carb-option',
      'fiber-option',
      'extra-protein',
    ]);
  });

  it('focuses on the remaining plate gap after protein and carb are selected', () => {
    const foods = [
      testFood('protein-selected', { category: 'protein', proteinG: 25 }),
      testFood('carb-selected', { category: 'carb', carbsG: 30 }),
      testFood('extra-protein', { category: 'protein', proteinG: 24 }),
      testFood('extra-carb', { category: 'carb', carbsG: 32 }),
      testFood('fiber-option', { category: 'vegetable', fiberG: 4 }),
    ];
    const results = recommendFoodsForMeal(
      foods,
      {
        selectedFoodIds: ['protein-selected', 'carb-selected'],
        nutrition: nutrition({ proteinG: 'low', carbsG: 'low' }),
      },
      3,
    );

    expect(results[0].id).toBe('fiber-option');
  });

  it('prefers primary fiber foods over fiber-tagged carbs when fiber is the gap', () => {
    const foods = [
      testFood('protein-selected', { category: 'protein', proteinG: 25 }),
      testFood('carb-selected', { category: 'carb', carbsG: 30 }),
      testFood('fiber-tagged-carb', { category: 'carb', carbsG: 32, fiberG: 6 }),
      testFood('vegetable-option', { category: 'vegetable', fiberG: 4 }),
    ];
    const results = recommendFoodsForMeal(
      foods,
      {
        selectedFoodIds: ['protein-selected', 'carb-selected'],
        nutrition: nutrition({ fiberG: 'low' }),
      },
      2,
    );

    expect(results.map((item) => item.id)).toEqual(['vegetable-option', 'fiber-tagged-carb']);
  });

  it('pairs kefir with fruit, oats and peanut butter before savory proteins', () => {
    const foods = [
      food('kefir-natural'),
      food('salmon'),
      food('frutos-rojos'),
      food('crema-de-cacahuete'),
      food('avena'),
    ];
    const results = recommendFoodsForMeal(
      foods,
      {
        selectedFoodIds: ['kefir-natural'],
        nutrition: nutrition({ carbsG: 'low', fiberG: 'low', proteinG: 'low' }),
      },
      4,
    );

    const ids = results.map((item) => item.id);

    expect(ids.slice(0, 3)).toEqual(
      expect.arrayContaining(['frutos-rojos', 'avena', 'crema-de-cacahuete']),
    );
    expect(ids.at(-1)).toBe('salmon');
  });

  it('keeps peanut butter in the top kefir recommendations with the full library', () => {
    const ids = recommendFoodsForMeal(
      baseFoods,
      {
        selectedFoodIds: ['kefir-natural'],
        nutrition: nutrition({ carbsG: 'low', fiberG: 'low', proteinG: 'low' }),
      },
      6,
    ).map((item) => item.id);

    expect(ids).toContain('crema-de-cacahuete');
    expect(ids).not.toContain('salmon');
  });

  it('allows same-family chicken but pushes fish down after chicken', () => {
    const foods = [
      food('muslo-entero-de-pollo-air-fryer-con-hueso-y-piel'),
      food('alita-de-pollo-air-fryer-con-hueso-y-piel'),
      food('salmon'),
      food('arroz-cocido'),
    ];
    const results = recommendFoodsForMeal(
      foods,
      {
        selectedFoodIds: ['muslo-entero-de-pollo-air-fryer-con-hueso-y-piel'],
        nutrition: nutrition({ proteinG: 'low', carbsG: 'low' }),
      },
      3,
    );
    const ids = results.map((item) => item.id);

    expect(ids.indexOf('alita-de-pollo-air-fryer-con-hueso-y-piel')).toBeLessThan(
      ids.indexOf('salmon'),
    );
  });

  it('does not recommend a different bread above sensible bread pairings', () => {
    const foods = [
      food('pan'),
      food('pan-integral'),
      food('queso-curado'),
      food('tomate-cherry'),
      food('jamon-serrano'),
    ];
    const results = recommendFoodsForMeal(
      foods,
      {
        selectedFoodIds: ['pan'],
        nutrition: nutrition({ proteinG: 'low', fiberG: 'low' }),
      },
      4,
    );
    const ids = results.map((item) => item.id);

    expect(ids.slice(0, 3)).toEqual(
      expect.arrayContaining(['tomate-cherry', 'queso-curado', 'jamon-serrano']),
    );
    expect(ids.indexOf('pan-integral')).toBeGreaterThan(ids.indexOf('queso-curado'));
    expect(ids.indexOf('pan-integral')).toBeGreaterThan(ids.indexOf('jamon-serrano'));
  });

  it('pairs cheese with bread and tomato before yogurt', () => {
    const foods = [
      food('queso-curado'),
      food('yogur-griego-natural'),
      food('pan'),
      food('tomate-cherry'),
      food('jamon-serrano'),
    ];
    const results = recommendFoodsForMeal(
      foods,
      {
        selectedFoodIds: ['queso-curado'],
        nutrition: nutrition({ carbsG: 'low', fiberG: 'low', proteinG: 'low' }),
      },
      4,
    );
    const ids = results.map((item) => item.id);

    expect(ids.slice(0, 3)).toEqual(['pan', 'tomate-cherry', 'jamon-serrano']);
    expect(ids.at(-1)).toBe('yogur-griego-natural');
  });

  it('deprioritizes fatty foods when fat is already high', () => {
    const foods = [
      testFood('fat-option', { category: 'fat', fatG: 30 }),
      testFood('plain-option'),
    ];
    const results = recommendFoodsForMeal(
      foods,
      { selectedFoodIds: [], nutrition: nutrition({ fatG: 'high' }) },
      2,
    );

    expect(results.map((item) => item.id)).toEqual(['plain-option', 'fat-option']);
  });

  it('excludes drinks from meal recommendations', () => {
    const foods = [
      testFood('coffee', { category: 'drink' }),
      testFood('beer', { category: 'drink', kcal: 43, carbsG: 3.6 }),
      testFood('plain-option'),
    ];
    const results = recommendFoodsForMeal(foods, { selectedFoodIds: [] }, 3);

    expect(results.map((item) => item.id)).toEqual(['plain-option']);
  });

  it('does not use selected drinks as meal context', () => {
    const foods = [
      testFood('coffee', { category: 'drink' }),
      testFood('plain-option'),
      testFood('protein-option', { category: 'protein', proteinG: 25 }),
    ];
    const results = recommendFoodsForMeal(foods, { selectedFoodIds: ['coffee'] }, 3);

    expect(results.map((item) => item.id)).toEqual(['plain-option', 'protein-option']);
  });

  it('keeps original order when recommendation scores tie', () => {
    const foods = [testFood('first'), testFood('second'), testFood('third')];
    const results = recommendFoodsForMeal(foods, { selectedFoodIds: [] }, 3);

    expect(results.map((item) => item.id)).toEqual(['first', 'second', 'third']);
  });
});
