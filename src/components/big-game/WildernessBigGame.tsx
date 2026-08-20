// The Wilderness: Big Game — in-app page shell.
//
// Two audiences reach this component. A camper (or anyone without the admin
// flag) gets the tribe-leader screen and nothing else — no tabs, no route
// tables, no way to look at another tribe. An admin gets the director's tools.
//
// The check here is a convenience, not a security boundary: every admin RPC
// re-checks is_admin_user() server-side, so a camper who forces this component
// into the admin branch still gets nothing but errors.

import { useState } from 'react';
import {
  ClipboardList,
  Flag,
  Gauge,
  Map as MapIcon,
  Settings2,
  Smartphone,
  Table2,
  Ticket,
} from 'lucide-react';
import { useProfile } from '../../hooks/useProfile';
import AdminDashboard from './AdminDashboard';
import FinaleDirector from './FinaleDirector';
import ScoreGrid from './ScoreGrid';
import CodeSheet from './CodeSheet';
import LeaderScreen from './LeaderScreen';
import ModeratorCards from './ModeratorCards';
import RouteMatrix from './RouteMatrix';
import SetupScreen from './SetupScreen';
import TribeSlips from './TribeSlips';

type AdminTab =
  | 'director'
  | 'scores'
  | 'finale'
  | 'setup'
  | 'routes'
  | 'codes'
  | 'cards'
  | 'slips'
  | 'leader';

const TABS: { id: AdminTab; label: string; icon: typeof Gauge }[] = [
  { id: 'director', label: 'Director', icon: Gauge },
  { id: 'scores', label: 'Scores', icon: Table2 },
  { id: 'finale', label: 'Finale', icon: Flag },
  { id: 'setup', label: 'Setup', icon: Settings2 },
  { id: 'routes', label: 'Route tables', icon: MapIcon },
  { id: 'codes', label: 'Code sheet', icon: ClipboardList },
  { id: 'cards', label: 'Moderator cards', icon: ClipboardList },
  { id: 'slips', label: 'Tribe slips', icon: Ticket },
  { id: 'leader', label: 'Leader view', icon: Smartphone },
];

export default function WildernessBigGame() {
  const { profile } = useProfile();
  const [tab, setTab] = useState<AdminTab>('director');

  if (!profile?.is_admin) {
    return <LeaderScreen />;
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-orange-500 via-amber-500 to-orange-600 rounded-2xl p-6 text-white shadow-md">
        <h1 className="text-2xl font-black tracking-tight">
          The Wilderness: Big Game
        </h1>
        <p className="text-sm text-white/80">
          12 tribes · 12 stations · 4 rounds, then the Finale. Rounds advance
          only when you advance them.
        </p>
      </div>

      <div
        className="flex gap-2 overflow-x-auto pb-1"
        role="tablist"
        aria-label="Big Game sections"
      >
        {TABS.map(({ id, label, icon: Icon }) => {
          const isActive = tab === id;
          return (
            <button
              key={id}
              role="tab"
              aria-selected={isActive}
              onClick={() => setTab(id)}
              className={`flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-[var(--color-primary)] text-white shadow-md'
                  : 'text-[var(--color-text-muted)] bg-[var(--color-bg-muted)] hover:text-[var(--color-text)]'
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </button>
          );
        })}
      </div>

      {tab === 'director' && <AdminDashboard />}
      {tab === 'scores' && <ScoreGrid />}
      {tab === 'finale' && <FinaleDirector />}
      {tab === 'setup' && <SetupScreen onViewRoutes={() => setTab('routes')} />}
      {tab === 'routes' && <RouteMatrix />}
      {tab === 'codes' && <CodeSheet />}
      {tab === 'cards' && <ModeratorCards />}
      {tab === 'slips' && <TribeSlips />}
      {tab === 'leader' && <LeaderScreen />}
    </div>
  );
}
