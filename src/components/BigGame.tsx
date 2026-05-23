// ============================================================
// BIG GAME PLACEHOLDER — Ready for Summer Camp 2026's next big game
//
// HOW TO SET UP YOUR NEW BIG GAME:
// 1. Replace this file with your new game implementation
// 2. App.tsx  → uncomment the import     (search: BIG GAME IMPORT)
// 3. App.tsx  → uncomment the route case (search: BIG GAME ROUTE)
// 4. Navigation.tsx → uncomment nav item (search: BIG GAME NAV)
// 5. Add any hooks in src/hooks/
// 6. Add any Supabase tables as needed
// 7. Update the admin visibility toggle label in AdminPanel.tsx
// ============================================================

import { Trophy, Flame, Star } from 'lucide-react'

interface BigGameProps {
  onPageChange?: (page: string) => void
}

export default function BigGame({ onPageChange: _onPageChange }: BigGameProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-64 p-8">
      <div className="text-center max-w-lg">
        <div className="mb-6">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-2xl bg-gradient-to-br from-orange-400 to-amber-500 text-white shadow-xl">
            <Trophy className="h-12 w-12" />
          </div>
        </div>

        <div className="flex items-center justify-center space-x-2 mb-3">
          <Flame className="h-5 w-5 text-orange-500 animate-bounce" />
          <h2 className="text-3xl font-bold text-[var(--color-text)]">Big Game</h2>
          <Flame className="h-5 w-5 text-orange-500 animate-bounce" />
        </div>

        <p className="text-[var(--color-text-muted)] mb-6 text-lg">
          The next epic challenge is coming — stay tuned for Summer Camp 2026's big game!
        </p>

        <div className="flex items-center justify-center space-x-1 mb-8">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className="h-5 w-5 text-amber-400 fill-amber-400" />
          ))}
        </div>

        <div className="bg-[var(--color-bg-muted)] rounded-xl p-5 border border-[var(--color-border)] text-left">
          <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-2">
            Developer Note
          </p>
          <p className="text-sm text-[var(--color-text-muted)]">
            Replace{' '}
            <code className="bg-[var(--color-bg)] px-1.5 py-0.5 rounded text-[var(--color-primary)] font-mono text-xs">
              src/components/BigGame.tsx
            </code>{' '}
            with your new game implementation, then follow the comments at the top of this file
            to wire up routes and navigation.
          </p>
        </div>
      </div>
    </div>
  )
}
