import React from 'react'
import { Users, ArrowRight, Lock } from 'lucide-react'
import { TEAMS, TeamColor } from '../lib/supabase'
import { TeamBalance } from '../hooks/useTeamBalance'

interface TeamCardProps {
  team: TeamColor
  teamData?: TeamBalance
  isCurrentTeam: boolean
  canSwitch: boolean
  onSwitchTeam: (team: TeamColor) => void
  loading: boolean
}

export default function TeamCard({
  team,
  teamData,
  isCurrentTeam,
  canSwitch,
  onSwitchTeam,
  loading
}: TeamCardProps) {
  const teamConfig = TEAMS[team]
  const totalCount = teamData?.total_count || 0
  const maxSize = 50 // This should come from camp settings
  const progress = (totalCount / maxSize) * 100

  return (
    <div className={`bg-[var(--color-bg)] dark:bg-[var(--color-bg-muted)] rounded-lg overflow-hidden border transition-all duration-300 ${
      isCurrentTeam 
        ? 'border-[var(--color-primary)] shadow-[var(--neon-glow)]' 
        : 'border-[var(--color-border)] hover:border-[var(--color-primary)] hover:shadow-[var(--neon-glow)]'
    }`}>
      {/* Header */}
      <div className={`${teamConfig.color} p-4 text-white`}>
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg">{teamConfig.name} Team</h3>
          <Users className="h-6 w-6" />
        </div>
        <div className="mt-2">
          <div className="flex justify-between text-sm opacity-90">
            <span>Members: {totalCount}</span>
            <span>{Math.round(progress)}% Full</span>
          </div>
          <div className="w-full bg-white bg-opacity-20 rounded-full h-2 mt-1">
            <div 
              className="bg-white h-2 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(progress, 100)}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="p-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Gender Balance</span>
            <span className="font-medium">
              {teamData?.male_count || 0}M / {teamData?.female_count || 0}F
            </span>
          </div>
          
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Grade Range</span>
            <span className="font-medium">
              7-12
            </span>
          </div>

          {/* Grade Distribution */}
          <div className="mt-3">
            <div className="text-xs text-gray-500 mb-1">Grade Distribution</div>
            <div className="grid grid-cols-6 gap-1">
              {[7, 8, 9, 10, 11, 12].map(grade => {
                const count = teamData?.[`grade_${grade}_count` as keyof TeamBalance] as number || 0
                return (
                  <div key={grade} className="text-center">
                    <div className={`h-2 ${teamConfig.color} rounded-sm opacity-${count > 0 ? '100' : '20'}`}></div>
                    <div className="text-xs text-gray-500 mt-1">{grade}</div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Action Button */}
      <div className="p-4 pt-0">
        {isCurrentTeam ? (
          <div className={`w-full py-2 px-4 rounded-md text-center font-medium ${teamConfig.lightColor} ${teamConfig.textColor}`}>
            Your Current Team
          </div>
        ) : canSwitch ? (
          <button
            onClick={() => onSwitchTeam(team)}
            disabled={loading}
            className={`w-full py-2 px-4 rounded-md font-medium text-white transition-colors ${teamConfig.color} hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-${team}-500 disabled:opacity-50`}
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mx-auto"></div>
            ) : (
              <div className="flex items-center justify-center">
                <ArrowRight className="h-4 w-4 mr-2" />
                Switch to {teamConfig.name}
              </div>
            )}
          </button>
        ) : (
          <div className="w-full py-2 px-4 rounded-md text-center font-medium bg-gray-100 text-gray-500 flex items-center justify-center">
            <Lock className="h-4 w-4 mr-2" />
            No Switches Left
          </div>
        )}
      </div>
    </div>
  )
}