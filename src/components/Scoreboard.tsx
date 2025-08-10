import React from 'react'
import { useScoreboard } from '../hooks/useScoreboard'
import { TEAMS } from '../lib/supabase'
import LoadingSpinner from './LoadingSpinner'

export default function Scoreboard() {
  const { scores, loading, error } = useScoreboard()

  if (loading) return <LoadingSpinner text="Loading scores..." />
  if (error) return <div className="text-red-600">{error}</div>

  // Ensure all teams are displayed, default to 0
  const teamIds = ['red', 'blue', 'green', 'yellow'] as const
  const map: Record<string, number> = { red: 0, blue: 0, green: 0, yellow: 0 }
  scores.forEach(s => { map[s.team_id] = s.points })

  const values = teamIds.map(t => map[t])
  const maxVal = Math.max(1, ...values)
  const topVal = Math.max(...values)

  const funLabel = (points: number, isTop: boolean) => {
    if (isTop && points > 0) return `${points} pts 🏆`
    if (points >= 50) return `${points} pts 🔥`
    if (points >= 10) return `${points} pts ✨`
    if (points > 0) return `${points} pts 💪`
    return `${points} pts 😴`
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold mb-6">Team Scoreboard</h2>

      {/* Bar Chart */}
      <div className="flex items-end justify-around gap-4 h-64 md:h-72 mb-6">
        {teamIds.map(team => {
          const points = map[team] ?? 0
          const heightPct = Math.round((points / maxVal) * 100)
          const isTop = points === topVal && topVal > 0
          return (
            <div key={team} className="flex flex-col items-center flex-1">
              <div className="w-full max-w-[60px] md:max-w-[72px] bg-gray-100 rounded-t-md overflow-hidden flex items-end justify-center h-48 md:h-56">
                <div
                  className={`w-full ${TEAMS[team].color} transition-all duration-700 ease-out rounded-t-md`}
                  style={{ height: `${heightPct}%` }}
                  aria-label={`${TEAMS[team].name} bar: ${points} points`}
                  title={`${TEAMS[team].name}: ${points} points`}
                />
              </div>
              <div className="mt-3 text-center">
                <div className="text-sm font-medium text-gray-700">{TEAMS[team].name}</div>
                <div className={`text-lg md:text-xl font-extrabold ${isTop ? 'text-orange-600' : 'text-gray-900'}`}>
                  {funLabel(points, isTop)}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-600">
        {teamIds.map(team => (
          <div key={team} className="flex items-center gap-2">
            <span className={`inline-block w-3 h-3 rounded ${TEAMS[team].color}`} />
            {TEAMS[team].name}
          </div>
        ))}
      </div>
    </div>
  )
}
