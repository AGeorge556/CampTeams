import { useRef, useState, useEffect } from 'react'
import { Trophy, Clock } from 'lucide-react'
import { useScoreboard } from '../hooks/useScoreboard'
import { TEAMS } from '../lib/supabase'
import LoadingSpinner from './LoadingSpinner'

interface FlashState {
  delta: number
  key: number
}

export default function Scoreboard() {
  const { scores, loading, error } = useScoreboard()
  const prevScoresRef = useRef<Record<string, number>>({})
  const [flashTeams, setFlashTeams] = useState<Record<string, FlashState>>({})

  useEffect(() => {
    if (scores.length === 0) return
    const newFlashes: Record<string, FlashState> = {}
    scores.forEach(s => {
      const prev = prevScoresRef.current[s.team_id]
      if (prev !== undefined && s.points !== prev) {
        newFlashes[s.team_id] = { delta: s.points - prev, key: Date.now() }
      }
    })
    prevScoresRef.current = Object.fromEntries(scores.map(s => [s.team_id, s.points]))
    if (Object.keys(newFlashes).length === 0) return
    setFlashTeams(prev => ({ ...prev, ...newFlashes }))
    const timer = setTimeout(() => {
      setFlashTeams(prev => {
        const next = { ...prev }
        Object.keys(newFlashes).forEach(k => delete next[k])
        return next
      })
    }, 2100)
    return () => clearTimeout(timer)
  }, [scores])

  if (loading) return <LoadingSpinner text="Loading scores..." />
  if (error) return <div className="text-[var(--color-danger)] p-4 text-sm">{error}</div>

  const teamIds = ['red', 'blue', 'green', 'yellow'] as const
  const map: Record<string, number> = { red: 0, blue: 0, green: 0, yellow: 0 }
  const updatedAtMap: Record<string, string | undefined> = {}
  scores.forEach(s => { map[s.team_id] = s.points; updatedAtMap[s.team_id] = s.updated_at })

  const ranked = teamIds
    .map(id => ({ id, points: map[id], data: TEAMS[id], updatedAt: updatedAtMap[id] }))
    .sort((a, b) => b.points - a.points)

  const formatRelativeTime = (iso: string | undefined) => {
    if (!iso) return null
    const diff = Date.now() - new Date(iso).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'just now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    return null
  }

  const maxPts    = Math.max(1, ...ranked.map(t => t.points))
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
          const isLeader     = rank === 0 && hasScores
          const barPct       = `${Math.round((team.points / maxPts) * 100)}%`
          const flash        = flashTeams[team.id]
          const lastUpdated  = formatRelativeTime(team.updatedAt)

          return (
            <div
              key={team.id}
              className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
                isLeader
                  ? 'bg-amber-50/80 dark:bg-amber-950/20 ring-1 ring-amber-300/50 dark:ring-amber-700/30'
                  : 'bg-[var(--color-bg-muted)]'
              } ${flash ? 'score-flash' : ''}`}
            >
              {/* Floating delta badge */}
              {flash && (
                <span
                  key={flash.key}
                  className="float-up-fade absolute right-3 top-1 text-xs font-bold text-amber-600 dark:text-amber-400 pointer-events-none select-none"
                >
                  {flash.delta > 0 ? `+${flash.delta}` : flash.delta}
                </span>
              )}

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
                    className={`text-sm font-bold tabular-nums shrink-0 transition-all duration-300 ${
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
                {lastUpdated && (
                  <div className="flex items-center gap-1 mt-1">
                    <Clock className="h-2.5 w-2.5 text-[var(--color-text-muted)]" />
                    <span className="text-[10px] text-[var(--color-text-muted)]">{lastUpdated}</span>
                  </div>
                )}
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
