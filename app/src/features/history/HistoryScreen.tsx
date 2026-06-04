import { BookOpenCheck } from 'lucide-react';
import { formatShortDate } from '../../domain/dates';
import { formatKcal, formatMacro } from '../../domain/format';
import { formatMealName } from '../../domain/meals';
import { useAppState } from '../../state/AppStateProvider';
import { SurfaceCard } from '../../ui/SurfaceCard';

export function HistoryScreen(): JSX.Element {
  const { state } = useAppState();
  const registeredDays = Object.values(state.registeredDays).sort((a, b) =>
    b.dateKey.localeCompare(a.dateKey),
  );

  return (
    <main className="screen history-screen">
      <header className="screen-header">
        <h1>Historial</h1>
        <p>Snapshots estables de dias registrados.</p>
      </header>
      {registeredDays.length === 0 ? (
        <SurfaceCard className="empty-state history-placeholder">
          <BookOpenCheck aria-hidden="true" size={38} />
          <strong>Aun no hay dias registrados</strong>
          <p>
            Cuando registres dias completos, apareceran aqui como snapshots de solo lectura.
          </p>
        </SurfaceCard>
      ) : (
        <section className="history-list" aria-label="Dias registrados">
          {registeredDays.map((day) => (
            <SurfaceCard className="history-day-card" key={day.dateKey}>
              <div className="history-day-card__header">
                <div>
                  <strong>{formatShortDate(day.dateKey)}</strong>
                  <span>{day.meals.length === 1 ? '1 comida' : `${day.meals.length} comidas`}</span>
                </div>
                <span>{formatKcal(day.totals.kcal)}</span>
              </div>
              <dl>
                <div>
                  <dt>Proteina</dt>
                  <dd>{formatMacro(day.totals.proteinG)}</dd>
                </div>
                <div>
                  <dt>Carbohidratos</dt>
                  <dd>{formatMacro(day.totals.carbsG)}</dd>
                </div>
                <div>
                  <dt>Grasas</dt>
                  <dd>{formatMacro(day.totals.fatG)}</dd>
                </div>
                <div>
                  <dt>Fibra</dt>
                  <dd>{formatMacro(day.totals.fiberG)}</dd>
                </div>
              </dl>
              <ul>
                {day.meals.map((meal) => (
                  <li key={meal.id}>{formatMealName(meal)}</li>
                ))}
              </ul>
            </SurfaceCard>
          ))}
        </section>
      )}
    </main>
  );
}
