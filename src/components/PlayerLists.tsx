import React from 'react'
import { Users, User, GraduationCap, ArrowRight, AlertTriangle } from 'lucide-react'
import { TEAMS, TeamColor, supabase } from '../lib/supabase'
import { usePlayers } from '../hooks/usePlayers'
import { useProfile } from '../hooks/useProfile'
import { useToast } from './Toast'
import { getGradeDisplayWithNumber, MAX_PLAYERS_PER_GRADE, GRADES } from '../lib/utils'
import Button from './ui/Button'
import LoadingSpinner from './LoadingSpinner'

export default function PlayerLists() {
  const { players, loading } = usePlayers()
  const { profile, updateProfile } = useProfile()
  const { addToast } = useToast()
  const [switching, setSwitching] = React.useState<string | null>(null)

  const handleSwitchTeam = async (newTeam: TeamColor) => {
    if (!profile || switching) return
    
    setSwitching(newTeam)
    try {
      // Check grade limits for the target team
      const targetTeamPlayers = players[newTeam] || []
      const playersInSameGrade = targetTeamPlayers.filter(p => p.grade === profile.grade)
      
      if (playersInSameGrade.length >= MAX_PLAYERS_PER_GRADE) {
        addToast({
          type: 'error',
          title: 'Cannot Switch Teams',
          message: `Cannot switch to ${TEAMS[newTeam].name} team. Maximum of ${MAX_PLAYERS_PER_GRADE} players per grade (${getGradeDisplayWithNumber(profile.grade)}) has been reached.`
        })
        return
      }

      // Check if switch is allowed
      const { data: canSwitch, error: validateError } = await supabase
        .rpc('can_switch_team', {
          user_id: profile.id,
          new_team: newTeam
        })

      if (validateError) {
        throw validateError
      }

      if (!canSwitch) {
        addToast({
          type: 'error',
          title: 'Cannot Switch Teams',
          message: 'Team switch not allowed. You may have no switches remaining, teams are locked, or the team is full.'
        })
        return
      }

      // Record the switch
      const { error: switchError } = await supabase
        .from('team_switches')
        .insert({
          user_id: profile.id,
          from_team: profile.current_team,
          to_team: newTeam
        })

      if (switchError) {
        throw switchError
      }

      // Update profile
      const { error: updateError } = await updateProfile({
        current_team: newTeam,
        switches_remaining: profile.switches_remaining - 1
      })

      if (updateError) {
        throw updateError
      }

      addToast({
        type: 'success',
        title: 'Team Switch Successful',
        message: `You have successfully joined the ${TEAMS[newTeam].name} team!`
      })

      // Refresh the page to ensure all components update properly
      setTimeout(() => {
        window.location.reload()
      }, 500)

    } catch (error: any) {
      console.error('Error switching team:', error)
      addToast({
        type: 'error',
        title: 'Error',
        message: error.message || 'Failed to switch teams. Please try again.'
      })
    } finally {
      setSwitching(null)
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <LoadingSpinner text="Loading team rosters..." />
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
        <Users className="h-5 w-5 mr-2" />
        Team Rosters
      </h3>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {Object.entries(TEAMS).map(([teamKey, teamConfig]) => {
          const teamPlayers = players[teamKey as TeamColor] || []
          const sortedPlayers = [...teamPlayers].sort((a, b) => {
            // Sort by grade first, then by name
            if (a.grade !== b.grade) {
              return a.grade - b.grade
            }
            return a.full_name.localeCompare(b.full_name)
          })

          return (
            <div key={teamKey} className="space-y-4">
              {/* Team Header */}
              <div className={`${teamConfig.color} rounded-lg p-4 text-white`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-lg">{teamConfig.name} Team</h4>
                    <span className="text-sm opacity-90">{teamPlayers.length} players</span>
                    {profile && profile.current_team === teamKey && (
                      <div className="mt-1">
                        <span className="inline-flex items-center px-2 py-1 bg-white bg-opacity-20 rounded-full text-xs font-medium">
                          Your Current Team
                        </span>
                      </div>
                    )}
                  </div>
                  {profile && profile.current_team !== teamKey && profile.switches_remaining > 0 && profile.participate_in_teams && (
                    <Button
                      onClick={() => handleSwitchTeam(teamKey as TeamColor)}
                      loading={switching === teamKey}
                      icon={<ArrowRight />}
                      variant="ghost"
                      size="sm"
                      className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white border-white"
                    >
                      Join Team
                    </Button>
                  )}
                </div>
              </div>

              {/* Player List */}
              <div className="space-y-2">
                {sortedPlayers.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <User className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No players assigned</p>
                  </div>
                ) : (
                  sortedPlayers.map((player) => (
                    <div
                      key={player.id}
                      className="bg-gray-50 rounded-lg p-3 border border-gray-200 hover:border-gray-300 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 truncate">
                            {player.full_name}
                          </div>
                          <div className="flex items-center text-sm text-gray-600 mt-1">
                            <GraduationCap className="h-3 w-3 mr-1" />
                            <span>{getGradeDisplayWithNumber(player.grade)}</span>
                            <span className="mx-2">•</span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              player.gender === 'male' 
                                ? 'bg-blue-100 text-blue-800' 
                                : 'bg-pink-100 text-pink-800'
                            }`}>
                              {player.gender === 'male' ? 'Male' : 'Female'}
                            </span>
                          </div>
                        </div>
                        
                        {/* Switches remaining indicator */}
                        <div className="ml-2">
                          <div className={`w-2 h-2 rounded-full ${
                            player.switches_remaining > 0 
                              ? 'bg-green-400' 
                              : 'bg-gray-300'
                          }`} 
                          title={`${player.switches_remaining} switches remaining`}
                          />
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Team Summary */}
              {teamPlayers.length > 0 && (
                <div className="text-xs text-gray-500 space-y-1">
                  <div className="flex justify-between">
                    <span>Gender Balance:</span>
                    <span>
                      {teamPlayers.filter(p => p.gender === 'male').length}M / 
                      {teamPlayers.filter(p => p.gender === 'female').length}F
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Grade Range:</span>
                    <span>
                      {Math.min(...teamPlayers.map(p => p.grade))} - {Math.max(...teamPlayers.map(p => p.grade))}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Avg Grade:</span>
                    <span>
                      {(teamPlayers.reduce((sum, p) => sum + p.grade, 0) / teamPlayers.length).toFixed(1)}
                    </span>
                  </div>
                  
                  {/* Grade Distribution */}
                  <div className="mt-2 pt-2 border-t border-gray-200">
                    <div className="text-xs font-medium mb-1">Grade Distribution:</div>
                    <div className="grid grid-cols-6 gap-1">
                      {GRADES.map(grade => {
                        const count = teamPlayers.filter(p => p.grade === grade).length
                        const isAtLimit = count >= MAX_PLAYERS_PER_GRADE
                        return (
                          <div key={grade} className="text-center">
                            <div className={`h-2 ${teamConfig.color} rounded-sm ${isAtLimit ? 'opacity-100' : 'opacity-60'}`}></div>
                            <div className="text-xs mt-1">
                              {grade}
                              {isAtLimit && <span className="text-red-500">*</span>}
                            </div>
                            <div className="text-xs text-gray-400">{count}/{MAX_PLAYERS_PER_GRADE}</div>
                          </div>
                        )
                      })}
                    </div>
                    {GRADES.some(grade => teamPlayers.filter(p => p.grade === grade).length >= MAX_PLAYERS_PER_GRADE) && (
                      <div className="text-xs text-red-500 mt-1 flex items-center">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        * Grade limit reached
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
} 