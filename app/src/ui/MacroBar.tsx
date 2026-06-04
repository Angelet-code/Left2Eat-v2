import type { NutrientTarget } from '../domain/nutrition';
import { formatMacro } from '../domain/format';

type MacroBarProps = {
  label: string;
  nutrient: NutrientTarget;
  tone?: 'green' | 'orange' | 'red';
};

export function MacroBar({ label, nutrient, tone = 'green' }: MacroBarProps): JSX.Element {
  const [min, max] = nutrient.range;
  const denominator = Math.max(max, nutrient.target, 1);
  const progress = Math.min(100, Math.max(0, (nutrient.consumed / denominator) * 100));
  const statusText =
    nutrient.status === 'ok'
      ? 'bien'
      : nutrient.status === 'low'
        ? 'pendiente'
        : 'alto';

  return (
    <div className="macro-bar">
      <div className="macro-bar__header">
        <div className="macro-bar__title">
          <strong>{label}</strong>
          <span className={`macro-bar__status macro-bar__status--${nutrient.status}`}>
            {statusText}
            <span className="sr-only">
              , rango {formatMacro(min)} a {formatMacro(max)}
            </span>
          </span>
        </div>
        <span className="macro-bar__amount">
          {formatMacro(nutrient.consumed)} / {formatMacro(nutrient.target)}
        </span>
      </div>
      <div className="macro-bar__track" aria-hidden="true">
        <span
          className={`macro-bar__fill macro-bar__fill--${tone}`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
