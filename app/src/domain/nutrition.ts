import type { DayContext, TrainingIntensity, TrainingType } from './days';
import type { NutritionTotals } from './meals';
import { isValidDateKey } from './dates';

export const NUTRITION_METHOD_ID = 'left2eat-nutrition-v1';

export type Sex = 'male' | 'female';
export type Objective = 'lose' | 'maintain' | 'gain';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'high' | 'athlete';
export type BalanceStatus = 'low' | 'ok' | 'high';

export type Profile = {
  sex: Sex;
  ageYears: number;
  heightCm: number;
  weightKg: number;
  objective: Objective;
  activityLevel: ActivityLevel;
  plannedTrainingsPerWeek: number;
  habitualStepsPerDay: number;
};

export type NutrientTarget = {
  target: number;
  range: [number, number];
  consumed: number;
  remaining: number;
  status: BalanceStatus;
};

export type DailyNutrition = {
  methodology: typeof NUTRITION_METHOD_ID;
  bmr: number;
  baselineLifestyleTdee: number;
  habitualTdee: number;
  dayAdjustedTdee: number;
  kcal: NutrientTarget;
  proteinG: NutrientTarget;
  carbsG: NutrientTarget;
  fatG: NutrientTarget;
  fiberG: NutrientTarget;
  priorities: string[];
  flags: string[];
  errors: string[];
  disclaimer: string;
};

export const VALID_SEX_VALUES = ['male', 'female'] as const;
export const VALID_OBJECTIVE_VALUES = ['lose', 'maintain', 'gain'] as const;
export const VALID_ACTIVITY_VALUES = ['sedentary', 'light', 'moderate', 'high', 'athlete'] as const;

export const DEFAULT_PROFILE: Profile = {
  sex: 'male',
  ageYears: 30,
  heightCm: 175,
  weightKg: 75,
  objective: 'maintain',
  activityLevel: 'light',
  plannedTrainingsPerWeek: 3,
  habitualStepsPerDay: 8000,
};

const ACTIVITY_MULTIPLIER: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.3,
  moderate: 1.4,
  high: 1.5,
  athlete: 1.6,
};

const OBJECTIVE_DELTA: Record<Objective, number> = {
  lose: -0.15,
  maintain: 0,
  gain: 0.1,
};

const PROTEIN_G_PER_KG: Record<Objective, number> = {
  lose: 1.8,
  maintain: 1.6,
  gain: 1.7,
};

const TRAINING_MET: Record<TrainingIntensity, number> = {
  easy: 4,
  normal: 6,
  hard: 8,
};

const DEFAULT_TRAINING_MINUTES: Record<TrainingType, number> = {
  none: 0,
  strength: 45,
  cardio: 45,
  'strength-cardio': 75,
};

export const NUTRITION_DISCLAIMER =
  'Left2Eat ofrece estimaciones orientativas para seguimiento personal; no es asesoramiento medico, dietetico ni clinico.';

const TRAINING_TYPE_VALUES = ['none', 'strength', 'cardio', 'strength-cardio'] as const;
const TRAINING_INTENSITY_VALUES = ['easy', 'normal', 'hard'] as const;

function oneOf<T extends string>(value: unknown, allowed: readonly T[]): value is T {
  return allowed.includes(value as T);
}

function safeNumber(value: number, fallback: number, min: number, max: number): number {
  return Number.isFinite(value) && value >= min && value <= max ? value : fallback;
}

function sanitizeProfile(profile: Profile): Profile {
  return {
    sex: oneOf(profile.sex, VALID_SEX_VALUES) ? profile.sex : DEFAULT_PROFILE.sex,
    ageYears: safeNumber(profile.ageYears, DEFAULT_PROFILE.ageYears, 13, 90),
    heightCm: safeNumber(profile.heightCm, DEFAULT_PROFILE.heightCm, 120, 230),
    weightKg: safeNumber(profile.weightKg, DEFAULT_PROFILE.weightKg, 35, 250),
    objective: oneOf(profile.objective, VALID_OBJECTIVE_VALUES)
      ? profile.objective
      : DEFAULT_PROFILE.objective,
    activityLevel: oneOf(profile.activityLevel, VALID_ACTIVITY_VALUES)
      ? profile.activityLevel
      : DEFAULT_PROFILE.activityLevel,
    plannedTrainingsPerWeek: safeNumber(
      profile.plannedTrainingsPerWeek,
      DEFAULT_PROFILE.plannedTrainingsPerWeek,
      0,
      14,
    ),
    habitualStepsPerDay: safeNumber(
      profile.habitualStepsPerDay,
      DEFAULT_PROFILE.habitualStepsPerDay,
      0,
      40000,
    ),
  };
}

function sanitizeDayContext(dayContext: DayContext): DayContext {
  return {
    dateISO: dayContext.dateISO,
    trainingType: oneOf(dayContext.trainingType, TRAINING_TYPE_VALUES)
      ? dayContext.trainingType
      : 'none',
    trainingIntensity: oneOf(dayContext.trainingIntensity, TRAINING_INTENSITY_VALUES)
      ? dayContext.trainingIntensity
      : 'normal',
    actualSteps:
      dayContext.actualSteps === undefined
        ? undefined
        : safeNumber(dayContext.actualSteps, 0, 0, 70000),
    trainingMinutes:
      dayContext.trainingMinutes === undefined
        ? undefined
        : safeNumber(dayContext.trainingMinutes, 0, 0, 300),
  };
}

function sanitizeTotals(totals: NutritionTotals): NutritionTotals {
  return {
    kcal: Math.max(0, Number.isFinite(totals.kcal) ? totals.kcal : 0),
    proteinG: Math.max(0, Number.isFinite(totals.proteinG) ? totals.proteinG : 0),
    carbsG: Math.max(0, Number.isFinite(totals.carbsG) ? totals.carbsG : 0),
    fatG: Math.max(0, Number.isFinite(totals.fatG) ? totals.fatG : 0),
    fiberG: Math.max(0, Number.isFinite(totals.fiberG) ? totals.fiberG : 0),
  };
}

function roundTo(value: number, step: number): number {
  return Math.round(value / step) * step;
}

function roundOne(value: number): number {
  return Math.round(value * 10) / 10;
}

function stepKcal(steps: number, weightKg: number): number {
  return steps * weightKg * 0.0005;
}

function trainingKcal(minutes: number, intensity: TrainingIntensity, weightKg: number): number {
  return (TRAINING_MET[intensity] * 3.5 * weightKg * minutes) / 200;
}

function plannedTrainingKcalPerDay(profile: Profile): number {
  const moderateKcal = trainingKcal(45, 'normal', profile.weightKg);
  return (profile.plannedTrainingsPerWeek * moderateKcal) / 7;
}

function actualTrainingKcal(context: DayContext, profile: Profile): number {
  if (context.trainingType === 'none') return 0;
  const minutes = context.trainingMinutes ?? DEFAULT_TRAINING_MINUTES[context.trainingType];
  return trainingKcal(minutes, context.trainingIntensity, profile.weightKg);
}

function statusFor(value: number, range: [number, number]): BalanceStatus {
  if (value < range[0]) return 'low';
  if (value > range[1]) return 'high';
  return 'ok';
}

function target(
  consumed: number,
  targetValue: number,
  range: [number, number],
  displayStep = 1,
): NutrientTarget {
  const roundedTarget = roundTo(targetValue, displayStep);
  const roundedRange: [number, number] = [
    roundTo(range[0], displayStep),
    roundTo(range[1], displayStep),
  ];

  return {
    target: roundedTarget,
    range: roundedRange,
    consumed: roundOne(consumed),
    remaining: roundOne(roundedTarget - consumed),
    status: statusFor(consumed, roundedRange),
  };
}

export function validateNutritionInputs(
  profile: Profile,
  dayContext: DayContext,
  totals: NutritionTotals,
): string[] {
  const errors: string[] = [];

  if (!oneOf(profile.sex, VALID_SEX_VALUES)) errors.push('sex');
  if (!oneOf(profile.objective, VALID_OBJECTIVE_VALUES)) errors.push('objective');
  if (!oneOf(profile.activityLevel, VALID_ACTIVITY_VALUES)) errors.push('activityLevel');
  if (!oneOf(dayContext.trainingType, TRAINING_TYPE_VALUES)) errors.push('trainingType');
  if (!oneOf(dayContext.trainingIntensity, TRAINING_INTENSITY_VALUES)) {
    errors.push('trainingIntensity');
  }
  if (profile.ageYears < 13 || profile.ageYears > 90) errors.push('ageYears');
  if (profile.heightCm < 120 || profile.heightCm > 230) errors.push('heightCm');
  if (profile.weightKg < 35 || profile.weightKg > 250) errors.push('weightKg');
  if (profile.plannedTrainingsPerWeek < 0 || profile.plannedTrainingsPerWeek > 14) {
    errors.push('plannedTrainingsPerWeek');
  }
  if (profile.habitualStepsPerDay < 0 || profile.habitualStepsPerDay > 40000) {
    errors.push('habitualStepsPerDay');
  }
  if (!isValidDateKey(dayContext.dateISO)) errors.push('dateISO');
  if (
    dayContext.actualSteps !== undefined &&
    (dayContext.actualSteps < 0 || dayContext.actualSteps > 70000)
  ) {
    errors.push('actualSteps');
  }
  if (
    dayContext.trainingMinutes !== undefined &&
    (dayContext.trainingMinutes < 0 || dayContext.trainingMinutes > 300)
  ) {
    errors.push('trainingMinutes');
  }
  for (const key of ['kcal', 'proteinG', 'fatG', 'carbsG', 'fiberG'] as const) {
    if (!Number.isFinite(totals[key]) || totals[key] < 0) errors.push(key);
  }

  return errors;
}

export function calculateDailyNutrition(
  profile: Profile,
  dayContext: DayContext,
  totals: NutritionTotals,
): DailyNutrition {
  const errors = validateNutritionInputs(profile, dayContext, totals);
  const safeProfile = sanitizeProfile(profile);
  const safeDayContext = sanitizeDayContext(dayContext);
  const safeTotals = sanitizeTotals(totals);
  const bmr =
    safeProfile.sex === 'male'
      ? 10 * safeProfile.weightKg + 6.25 * safeProfile.heightCm - 5 * safeProfile.ageYears + 5
      : 10 * safeProfile.weightKg + 6.25 * safeProfile.heightCm - 5 * safeProfile.ageYears - 161;
  const baselineLifestyleTdee = bmr * ACTIVITY_MULTIPLIER[safeProfile.activityLevel];
  const habitualStepKcal = stepKcal(safeProfile.habitualStepsPerDay, safeProfile.weightKg);
  const habitualTrainingKcal = plannedTrainingKcalPerDay(safeProfile);
  const habitualTdee = baselineLifestyleTdee + habitualStepKcal + habitualTrainingKcal;
  const actualStepKcal =
    safeDayContext.actualSteps === undefined
      ? habitualStepKcal
      : stepKcal(safeDayContext.actualSteps, safeProfile.weightKg);
  const dayTrainingKcal = actualTrainingKcal(safeDayContext, safeProfile);
  const dayAdjustedTdee = baselineLifestyleTdee + actualStepKcal + dayTrainingKcal;
  const rawKcalTarget = dayAdjustedTdee * (1 + OBJECTIVE_DELTA[safeProfile.objective]);
  const kcalTarget =
    safeProfile.objective === 'lose' ? Math.max(rawKcalTarget, bmr * 1.1) : rawKcalTarget;
  const kcalRange: [number, number] =
    safeProfile.objective === 'lose'
      ? [kcalTarget - 300, kcalTarget + 100]
      : [kcalTarget - 100, kcalTarget + 100];

  const proteinGoalG = safeProfile.weightKg * PROTEIN_G_PER_KG[safeProfile.objective];
  const proteinRangeG: [number, number] = [
    safeProfile.weightKg * 1.4,
    safeProfile.weightKg * 2.2,
  ];
  const fatGoalG = Math.max(safeProfile.weightKg * 0.8, (kcalTarget * 0.25) / 9);
  const fatRangeG: [number, number] = [safeProfile.weightKg * 0.6, (kcalTarget * 0.35) / 9];
  const fiberGoalG = Math.max(25, (kcalTarget / 1000) * 14);
  const fiberRangeG: [number, number] = [25, 45];
  const carbGoalG = Math.max(0, (kcalTarget - proteinGoalG * 4 - fatGoalG * 9) / 4);
  const carbRangeG: [number, number] = [
    Math.max(0, (kcalTarget - proteinRangeG[1] * 4 - fatRangeG[1] * 9) / 4),
    Math.max(0, (kcalTarget - proteinRangeG[0] * 4 - fatRangeG[0] * 9) / 4),
  ];

  const flags: string[] = [];
  if (rawKcalTarget < bmr * 1.1) flags.push('veryLowKcalTarget');
  if (fiberGoalG > 45) flags.push('veryHighFiber');
  if (
    safeDayContext.actualSteps !== undefined &&
    Math.abs(safeDayContext.actualSteps - safeProfile.habitualStepsPerDay) > 12000
  ) {
    flags.push('largeStepDeviation');
  }
  if (safeDayContext.trainingMinutes && !safeDayContext.trainingIntensity) {
    flags.push('trainingWithoutIntensity');
  }
  const macroKcal = safeTotals.proteinG * 4 + safeTotals.carbsG * 4 + safeTotals.fatG * 9;
  if (safeTotals.kcal > 0 && Math.abs(safeTotals.kcal - macroKcal) > 0.15 * safeTotals.kcal) {
    flags.push('macroEnergyMismatch');
  }

  const kcal = target(safeTotals.kcal, kcalTarget, kcalRange, 10);
  const proteinG = target(safeTotals.proteinG, proteinGoalG, proteinRangeG);
  const fatG = target(safeTotals.fatG, fatGoalG, fatRangeG);
  const carbsG = target(safeTotals.carbsG, carbGoalG, carbRangeG);
  const fiberG = target(safeTotals.fiberG, fiberGoalG, fiberRangeG);

  const priorities = [
    kcal.status === 'high' ? 'Bajar calorias para volver al rango' : null,
    kcal.status === 'low' ? 'Cubrir energia pendiente sin descuidar macros' : null,
    proteinG.status === 'low' ? 'Cubrir proteina pendiente' : null,
    fiberG.status === 'low' ? 'Subir fibra con alimentos sencillos' : null,
    fatG.status === 'high' ? 'Moderar grasas hoy' : null,
    carbsG.status === 'low' ? 'Usar carbohidratos para completar energia' : null,
    'Preferir consistencia antes que perfeccion de un solo dia',
  ].filter((priority): priority is string => priority !== null);

  return {
    methodology: NUTRITION_METHOD_ID,
    bmr: roundOne(bmr),
    baselineLifestyleTdee: roundOne(baselineLifestyleTdee),
    habitualTdee: roundOne(habitualTdee),
    dayAdjustedTdee: roundOne(dayAdjustedTdee),
    kcal,
    proteinG,
    carbsG,
    fatG,
    fiberG,
    priorities,
    flags,
    errors,
    disclaimer: NUTRITION_DISCLAIMER,
  };
}
