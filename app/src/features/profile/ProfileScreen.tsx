import { Save } from 'lucide-react';
import { useMemo, useState } from 'react';
import { createDefaultDayContext } from '../../domain/days';
import { getActiveDateKey } from '../../domain/dates';
import { formatKcal, formatMacro } from '../../domain/format';
import { ZERO_TOTALS } from '../../domain/meals';
import {
  calculateDailyNutrition,
  type ActivityLevel,
  type Objective,
  type Profile,
  type Sex,
} from '../../domain/nutrition';
import { useAppState } from '../../state/AppStateProvider';
import { PixelButton } from '../../ui/PixelButton';
import { SegmentedControl } from '../../ui/SegmentedControl';
import { SurfaceCard } from '../../ui/SurfaceCard';

const sexOptions: Array<{ value: Sex; label: string }> = [
  { value: 'male', label: 'Hombre' },
  { value: 'female', label: 'Mujer' },
];

const objectiveOptions: Array<{ value: Objective; label: string }> = [
  { value: 'lose', label: 'Perder' },
  { value: 'maintain', label: 'Mantener' },
  { value: 'gain', label: 'Ganar' },
];

const activityOptions: Array<{ value: ActivityLevel; label: string }> = [
  { value: 'sedentary', label: 'Baja' },
  { value: 'light', label: 'Ligera' },
  { value: 'moderate', label: 'Media' },
  { value: 'high', label: 'Alta' },
  { value: 'athlete', label: 'Atleta' },
];

function NumberField({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
}): JSX.Element {
  return (
    <label className="field">
      <span>{label}</span>
      <input
        type="number"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.currentTarget.value))}
      />
    </label>
  );
}

export function ProfileScreen(): JSX.Element {
  const { state, dispatch } = useAppState();
  const [draft, setDraft] = useState<Profile>(state.profile);
  const [saved, setSaved] = useState(false);
  const dateKey = getActiveDateKey();
  const nutrition = useMemo(
    () => calculateDailyNutrition(draft, createDefaultDayContext(dateKey), ZERO_TOTALS),
    [dateKey, draft],
  );
  const dirty = JSON.stringify(draft) !== JSON.stringify(state.profile);

  function update<K extends keyof Profile>(key: K, value: Profile[K]) {
    setSaved(false);
    setDraft((current) => ({ ...current, [key]: value }));
  }

  return (
    <main className="screen profile-screen">
      <header className="screen-header">
        <h1>Perfil</h1>
        <p>Objetivos diarios orientativos.</p>
      </header>

      <SurfaceCard className="profile-form">
        <fieldset className="field fieldset">
          <legend>Sexo</legend>
          <SegmentedControl
            label="Sexo"
            value={draft.sex}
            options={sexOptions}
            onChange={(sex) => update('sex', sex)}
          />
        </fieldset>
        <NumberField label="Edad" value={draft.ageYears} min={13} max={90} onChange={(value) => update('ageYears', value)} />
        <NumberField label="Altura (cm)" value={draft.heightCm} min={120} max={230} onChange={(value) => update('heightCm', value)} />
        <NumberField label="Peso (kg)" value={draft.weightKg} min={35} max={250} step={0.1} onChange={(value) => update('weightKg', value)} />
        <fieldset className="field fieldset">
          <legend>Objetivo</legend>
          <SegmentedControl
            label="Objetivo"
            value={draft.objective}
            options={objectiveOptions}
            onChange={(objective) => update('objective', objective)}
          />
        </fieldset>
        <fieldset className="field fieldset">
          <legend>Actividad</legend>
          <SegmentedControl
            label="Actividad"
            value={draft.activityLevel}
            options={activityOptions}
            onChange={(activityLevel) => update('activityLevel', activityLevel)}
          />
        </fieldset>
        <NumberField
          label="Entrenos / semana"
          value={draft.plannedTrainingsPerWeek}
          min={0}
          max={14}
          onChange={(value) => update('plannedTrainingsPerWeek', value)}
        />
        <NumberField
          label="Pasos habituales"
          value={draft.habitualStepsPerDay}
          min={0}
          max={40000}
          step={500}
          onChange={(value) => update('habitualStepsPerDay', value)}
        />

        <PixelButton
          disabled={!dirty || nutrition.errors.length > 0}
          onClick={() => {
            dispatch({ type: 'updateProfile', profile: draft });
            setSaved(true);
          }}
        >
          <Save aria-hidden="true" size={20} />
          Guardar perfil
        </PixelButton>
        {nutrition.errors.length > 0 && (
          <p className="form-message form-message--error">Revisa los campos fuera de rango.</p>
        )}
        {saved && <p className="form-message">Perfil guardado.</p>}
      </SurfaceCard>

      <SurfaceCard className="profile-targets">
        <h2>Objetivo estimado</h2>
        <dl>
          <div>
            <dt>Calorias</dt>
            <dd>{formatKcal(nutrition.kcal.target)}</dd>
          </div>
          <div>
            <dt>Proteina</dt>
            <dd>{formatMacro(nutrition.proteinG.target)}</dd>
          </div>
          <div>
            <dt>Carbohidratos</dt>
            <dd>{formatMacro(nutrition.carbsG.target)}</dd>
          </div>
          <div>
            <dt>Grasas</dt>
            <dd>{formatMacro(nutrition.fatG.target)}</dd>
          </div>
          <div>
            <dt>Fibra</dt>
            <dd>{formatMacro(nutrition.fiberG.target)}</dd>
          </div>
        </dl>
        <p>{nutrition.disclaimer}</p>
      </SurfaceCard>
    </main>
  );
}
