import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const root = resolve('..');
const input = resolve(root, 'alimentos-macros.md');
const output = resolve('src/data/baseFoods.ts');

const raw = readFileSync(input, 'utf8');

function repairMojibake(value) {
  if (!/[ÃÂ]/.test(value)) {
    return value;
  }
  return Buffer.from(value, 'latin1').toString('utf8');
}

function stripUnit(value) {
  return Number.parseFloat(
    repairMojibake(value)
      .replace(',', '.')
      .replace(/\s*g$/i, '')
      .trim(),
  );
}

function normalize(value) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function slugify(value) {
  return normalize(value)
    .replace(/ñ/g, 'n')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function servingGrams(label) {
  const match = label.match(/\((\d+(?:[.,]\d+)?)\s*g\)/i);
  return match ? Number.parseFloat(match[1].replace(',', '.')) : 100;
}

function compactAliases(name) {
  const normalized = normalize(name);
  const aliases = new Set();
  const tokens = normalized
    .replace(/[^a-z0-9ñ\s]/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length >= 4);

  aliases.add(normalized);
  aliases.add(slugify(name).replaceAll('-', ' '));
  for (const token of tokens) {
    aliases.add(token);
  }
  return [...aliases].filter((alias) => alias !== normalize(name)).slice(0, 6);
}

const categories = [
  ['protein', /salm[oó]n|pollo|pavo|at[uú]n|jam[oó]n|anchoas|lomo|chorizo|fuet|salchich[oó]n|bacon|panceta|ternera|entrecot|merluza|bacalao|sardinas|boquerones|gambas|mejillones|huevo|prote[ií]na/],
  ['carb', /[ñn]oquis|patata|arroz|boniato|quinoa|couscous|pasta|pan|tortilla|avena|muesli/],
  ['fruit', /pl[aá]tano|ar[aá]ndanos|frutos rojos|sand[ií]a|mel[oó]n|manzana|naranja|pera|fresas|uvas|mandarina/],
  ['dairy', /k[eé]fir|yogur|leche|queso fresco/],
  ['legume', /lentejas|garbanzos|alubias|hummus/],
  ['vegetable', /ajitos|tomate|lechuga|espinacas|cebolla|pimiento|calabac[ií]n|br[oó]coli|zanahoria|coliflor/],
  ['fat', /aceite|cacahuete|chocolate|aguacate/],
  ['cheese', /queso|mozzarella|roquefort|ma[hó]n|entrepinares/],
];

function categoryFor(name) {
  const normalized = normalize(name);
  return categories.find(([, pattern]) => pattern.test(normalized))?.[0] ?? 'other';
}

const lines = raw.split(/\r?\n/).filter((line) => line.startsWith('| '));
const rows = lines
  .filter((line) => !line.includes('---'))
  .slice(1)
  .map((line) => line.split('|').slice(1, -1).map((cell) => cell.trim()));

const foods = rows.map((row) => {
  const [nameRaw, servingRaw, unitRaw, kcalRaw, proteinRaw, carbsRaw, fatRaw, fiberRaw] = row;
  const name = repairMojibake(nameRaw);
  const servingLabel = repairMojibake(servingRaw);
  const eyeballUnit = repairMojibake(unitRaw);
  const category = categoryFor(name);

  return {
    id: slugify(name),
    name,
    aliases: compactAliases(name),
    category,
    kcal: stripUnit(kcalRaw),
    proteinG: stripUnit(proteinRaw),
    carbsG: stripUnit(carbsRaw),
    fatG: stripUnit(fatRaw),
    fiberG: stripUnit(fiberRaw),
    servingLabel,
    servingGrams: servingGrams(servingLabel),
    eyeballUnit,
    spriteKey: slugify(name),
  };
});

const ids = new Map();
for (const food of foods) {
  const count = ids.get(food.id) ?? 0;
  ids.set(food.id, count + 1);
  if (count > 0) {
    food.id = `${food.id}-${count + 1}`;
  }
}

const source = `import type { Food } from '../domain/food';

export const baseFoods: readonly Food[] = ${JSON.stringify(foods, null, 2)};
`;

mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, source);
console.log(`Generated ${foods.length} foods into ${output}`);
