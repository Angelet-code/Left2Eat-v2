import { BookOpenCheck } from 'lucide-react';
import { SurfaceCard } from '../../ui/SurfaceCard';

export function HistoryScreen(): JSX.Element {
  return (
    <main className="screen history-screen">
      <header className="screen-header">
        <h1>Historial</h1>
        <p>Snapshots estables de dias registrados.</p>
      </header>
      <SurfaceCard className="empty-state history-placeholder">
        <BookOpenCheck aria-hidden="true" size={38} />
        <strong>Aun no hay dias registrados</strong>
        <p>
          Cuando registres dias completos, apareceran aqui como snapshots de solo lectura.
        </p>
      </SurfaceCard>
    </main>
  );
}
