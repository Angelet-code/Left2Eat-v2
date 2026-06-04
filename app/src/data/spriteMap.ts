import type { FoodCategory } from '../domain/food';

export type SpriteVariant =
  | 'protein'
  | 'carb'
  | 'fruit'
  | 'vegetable'
  | 'legume'
  | 'dairy'
  | 'fat'
  | 'cheese'
  | 'other'
  | 'generic';

const categorySprites: Record<FoodCategory, SpriteVariant> = {
  protein: 'protein',
  carb: 'carb',
  fruit: 'fruit',
  vegetable: 'vegetable',
  legume: 'legume',
  dairy: 'dairy',
  fat: 'fat',
  cheese: 'cheese',
  other: 'other',
};

const specificSprites: Record<string, SpriteVariant> = {
  'arroz-cocido': 'carb',
  'arroz-crudo': 'carb',
  'pechuga-de-pollo': 'protein',
  huevo: 'protein',
  'lentejas-cocidas': 'legume',
  'yogur-natural-desnatado-sin-lactosa': 'dairy',
  'atun-al-natural-escurrido': 'protein',
  platano: 'fruit',
  manzana: 'fruit',
  aguacate: 'fat',
  'aceite-de-oliva': 'fat',
  brocoli: 'vegetable',
};

export function resolveSpriteVariant(spriteKey: string, category: FoodCategory): SpriteVariant {
  return specificSprites[spriteKey] ?? categorySprites[category] ?? 'generic';
}
