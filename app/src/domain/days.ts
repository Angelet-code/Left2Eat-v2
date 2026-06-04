import type { Meal } from './meals';

export type TrainingType = 'none' | 'strength' | 'cardio' | 'strength-cardio';
export type TrainingIntensity = 'easy' | 'normal' | 'hard';

export type DayContext = {
  dateISO: string;
  trainingType: TrainingType;
  trainingIntensity: TrainingIntensity;
  actualSteps?: number;
  trainingMinutes?: number;
};

export type DayDraft = {
  dateKey: string;
  context: DayContext;
  meals: Meal[];
};

export function createDefaultDayContext(dateKey: string): DayContext {
  return {
    dateISO: dateKey,
    trainingType: 'none',
    trainingIntensity: 'normal',
    actualSteps: undefined,
    trainingMinutes: undefined,
  };
}

export function createDayDraft(dateKey: string): DayDraft {
  return {
    dateKey,
    context: createDefaultDayContext(dateKey),
    meals: [],
  };
}
