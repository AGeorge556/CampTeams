import { Trophy } from 'lucide-react'
import { useScoreboard } from '../hooks/useScoreboard'
import { TEAMS } from '../lib/supabase'
import LoadingSpinner from './LoadingSpinner'

export default function Scoreboard() {
  const { scores, loading, error } = useScoreboard()

  if (loading) return <LoadingSpinner text="Loading scores..." />
  if (error) return <div className="text-[var(--color-danger)] p-4 text-sm">{error}</div>

  const teamIds = ['red', 'blue', 'green', 'yellow'] as const
  const map: Record<string, number> = { red: 0, blue: 0, green: 0, yellow: 0 }
  scores.forEach(s => { map[s.team_id] = s.points })

  const ranked = teamIds
    .map(id => ({ id, points: map[id], data: TEAMS[id] }))
    .sort((a, b) => b.points - a.points)

  const maxPts   = Math.max(1, ...ranked.map(t => t.points))
  const hasScores = ranked.some(t => t.points > 0)

  const suffix = (rank: number) =>
    rank === 0 ? 'st' : rank === 1 ? 'nd' : rank === 2 ? 'rd' : 'th'

  return (
    <div className="bg-[var(--color-card-bg)] rounded-2xl border border-[var(--color-border)] p-5 sm:p-6 shadow-[var(--shadow-sm)]">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-base font-bold text-[var(--color-text)]">Scoreboard</h2>
        <Trophy className="h-5 w-5 text-amber-500" />
      </div>

      <div className="space-y-2.5">
        {ranked.map((team, rank) => {
          const isLeader = rank === 0 && hasScores
          const barPct   = `${Math.round((team.points / maxPts) * 100)}%`

          return (
            <div
              key={team.id}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
                isLeader
                  ? 'bg-amber-50/80 dark:bg-amber-950/20 ring-1 ring-amber-300/50 dark:ring-amber-700/30'
                  : 'bg-[var(--color-bg-muted)]'
              }`}
            >
              {/* Rank label */}
              <span
                className={`w-7 text-xs font-bold tabular-nums shrink-0 ${
                  isLeader ? 'text-amber-600 dark:text-amber-400' : 'text-[var(--color-text-muted)]'
                }`}
              >
                {rank + 1}{suffix(rank)}
              </span>

              {/* Team color tile */}
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: team.data.colorValue }}
              >
                {isLeader && <Trophy className="h-3.5 w-3.5 text-white" />}
              </div>

              {/* Name + progress bar + points */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="text-sm font-semibold text-[var(--color-text)]">
                    {team.data.name}
                  </span>
                  <span
                    className={`text-sm font-bold tabular-nums shrink-0 ${
                      isLeader ? 'text-amber-600 dark:text-amber-400' : 'text-[var(--color-text)]'
                    }`}
                  >
                    {team.points.toLocaleString()} pts
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-[var(--color-border)] overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700 ease-out"
                    style={{ width: barPct, background: team.data.colorValue }}
                  />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {!hasScores && (
        <p className="text-center text-sm text-[var(--color-text-muted)] mt-3">
          No scores yet — competition starts soon.
        </p>
      )}
    </div>
  )
}
