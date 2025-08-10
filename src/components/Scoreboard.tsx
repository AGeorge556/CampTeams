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
    <div className="bg-white rounded-lg shadow p-4 sm:p-6">
      <h2 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6">Team Scoreboard</h2>

      {/* Bar Chart */}
      <div className="flex items-end justify-around gap-2 sm:gap-4 h-48 sm:h-64 md:h-72 mb-4 sm:mb-6">
        {teamIds.map(team => {
          const points = map[team] ?? 0
          const heightPct = Math.round((points / maxVal) * 100)
          const isTop = points === topVal && topVal > 0
          const teamData = TEAMS[team]
          return (
            <div key={team} className="flex flex-col items-center flex-1">
              <div className="w-full max-w-[40px] sm:max-w-[50px] md:max-w-[60px] lg:max-w-[72px] bg-gray-100 rounded-t-md overflow-hidden flex items-end justify-center h-36 sm:h-44 md:h-48 lg:h-56">
                <div
                  className={`w-full ${teamData.color} transition-all duration-700 ease-out rounded-t-md`}
                  style={{ height: `${heightPct}%` }}
                  aria-label={`${teamData.name} bar: ${points} points`}
                  title={`${teamData.name}: ${points} points`}
                />
              </div>
              <div className="mt-2 sm:mt-3 text-center">
                <div className="text-xs sm:text-sm font-medium text-gray-700">{teamData.name}</div>
                <div className={`text-sm sm:text-base md:text-lg lg:text-xl font-extrabold ${isTop ? 'text-orange-600' : 'text-gray-900'}`}>
                  {funLabel(points, isTop)}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600">
        {teamIds.map(team => {
          const teamData = TEAMS[team]
          return (
            <div key={team} className="flex items-center gap-1 sm:gap-2">
              <span className={`inline-block w-2 h-2 sm:w-3 sm:h-3 rounded ${teamData.color}`} />
              {teamData.name}
            </div>
          )
        })}
      </div>
    </div>
  )
}
