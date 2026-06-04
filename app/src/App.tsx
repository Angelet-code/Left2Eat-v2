import { Apple, BookOpen, CalendarDays, UserRound } from 'lucide-react';
import { useState } from 'react';
import { FoodsScreen } from './features/foods/FoodsScreen';
import { HistoryScreen } from './features/history/HistoryScreen';
import { ProfileScreen } from './features/profile/ProfileScreen';
import { TodayScreen } from './features/today/TodayScreen';
import { AppStateProvider } from './state/AppStateProvider';

type TabId = 'today' | 'foods' | 'history' | 'profile';

const tabs: Array<{
  id: TabId;
  label: string;
  icon: typeof CalendarDays;
}> = [
  { id: 'today', label: 'Hoy', icon: CalendarDays },
  { id: 'foods', label: 'Alimentos', icon: Apple },
  { id: 'history', label: 'Historial', icon: BookOpen },
  { id: 'profile', label: 'Perfil', icon: UserRound },
];

function AppShell(): JSX.Element {
  const [activeTab, setActiveTab] = useState<TabId>('today');

  return (
    <div className="app-frame">
      {activeTab === 'today' && <TodayScreen />}
      {activeTab === 'foods' && <FoodsScreen />}
      {activeTab === 'history' && <HistoryScreen />}
      {activeTab === 'profile' && <ProfileScreen />}

      <nav className="bottom-nav" aria-label="Principal">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const selected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              aria-current={selected ? 'page' : undefined}
              className={selected ? 'is-active' : ''}
              onClick={() => setActiveTab(tab.id)}
            >
              <Icon aria-hidden="true" size={21} strokeWidth={2.3} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

export default function App(): JSX.Element {
  return (
    <AppStateProvider>
      <AppShell />
    </AppStateProvider>
  );
}
