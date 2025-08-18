import React from 'react'
import { Users, User, Shield, ArrowRight, AlertTriangle, CheckCircle } from 'lucide-react'
import { TEAMS, TeamColor, supabase } from '../lib/supabase'
import { usePlayers } from '../hooks/usePlayers'
import { useProfile } from '../hooks/useProfile'
import { useTeamBalancing } from '../hooks/useTeamBalancing'
import { useToast } from './Toast'
import { getGradeDisplayWithNumber } from '../lib/utils'
import Button from './ui/Button'
import LoadingSpinner from './LoadingSpinner'
import { useLanguage } from '../contexts/LanguageContext'

export default function AdminTeamManagement() {
  const { t } = useLanguage()
  const { players, loading } = usePlayers()
  const { profile } = useProfile()
  const { teamBalances, canTeamAcceptPlayer } = useTeamBalancing()
  const { addToast } = useToast()
  const [movingPlayer, setMovingPlayer] = React.useState<string | null>(null)

  // Check if current user is admin
  if (!profile?.is_admin) {
    return null
  }

  const handleMovePlayer = async (playerId: string, newTeam: TeamColor) => {
    if (movingPlayer) return
    
    setMovingPlayer(playerId)
    try {
      // Get the player's current profile
      const { data: playerProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', playerId)
        .single()

      if (fetchError) {
        throw fetchError
      }

      if (!playerProfile) {
        throw new Error('Player not found')
      }

      // Check if the move would be allowed for regular users
      const teamAcceptance = canTeamAcceptPlayer(newTeam, playerProfile.gender)
      
      // Record the admin move
      const { error: moveError } = await supabase
        .from('team_switches')
        .insert({
          user_id: playerId,
          from_team: playerProfile.current_team,
          to_team: newTeam
        })

      if (moveError) {
        throw moveError
      }

      // Update the player's team
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ current_team: newTeam })
        .eq('id', playerId)

      if (updateError) {
        throw updateError
      }

      addToast({
        type: 'success',
        title: t('playerMovedSuccessfully'),
        message: `${playerProfile.full_name} has been moved to ${TEAMS[newTeam].name} team.`
      })

      // Refresh the page to update all components
      setTimeout(() => {
        window.location.reload()
      }, 500)

    } catch (error: any) {
      console.error('Error moving player:', error)
      addToast({
        type: 'error',
        title: 'Error',
        message: error.message || t('failedToMovePlayer')
      })
    } finally {
      setMovingPlayer(null)
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <LoadingSpinner text={t('loadingTeamRosters')} />
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
        <Shield className="h-5 w-5 mr-2 text-purple-600" />
        {t('adminTeamManagement')}
      </h3>
      
      {/* Team Balance Summary */}
      {teamBalances.length > 0 && (
        <div className="mb-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
          <div className="flex items-center mb-3">
            <CheckCircle className="h-5 w-5 mr-2 text-purple-600" />
            <h4 className="font-medium text-purple-900">{t('teamBalanceSummary')}</h4>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {teamBalances.map((balance) => (
              <div key={balance.team} className="text-center">
                <div className="font-semibold text-purple-800">{TEAMS[balance.team as TeamColor].name}</div>
                <div className="text-sm text-purple-600">
                  {balance.total_count} {t('players')} • {balance.male_count} {t('male')} • {balance.female_count} {t('female')}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {Object.entries(TEAMS).map(([teamKey, teamConfig]) => {
          const teamPlayers = (players[teamKey] || [])
          const nonAdminPlayers = teamPlayers.filter(p => p.participate_in_teams)
          const adminPlayers = teamPlayers.filter(p => !p.participate_in_teams)
          
          return (
            <div key={teamKey} className="mb-8">
              <div className={`${teamConfig.color} rounded-lg p-4 text-white`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-lg">{teamConfig.name} Team</h4>
                    <span className="text-sm opacity-90">{nonAdminPlayers.length} {t('players')}</span>
                  </div>
                  <div className="text-xs opacity-75">
                    {t('adminOverride')}
                  </div>
                </div>
              </div>

              {/* Player List with Move Options */}
              <div className="bg-white rounded-b-lg p-4 border-t-0 border shadow-sm">
                <div className="space-y-3">
                  {nonAdminPlayers.map((p) => (
                    <div key={p.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-2 text-gray-500" />
                        <div>
                          <div className="font-medium text-sm">{p.full_name}</div>
                          <div className="text-xs text-gray-500">
                            {getGradeDisplayWithNumber(p.grade)}, {p.gender === 'male' ? t('male') : t('female')}
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-1">
                        {Object.entries(TEAMS).map(([targetTeamKey, targetTeamConfig]) => {
                          if (targetTeamKey === teamKey) return null
                          
                          const teamAcceptance = canTeamAcceptPlayer(targetTeamKey as TeamColor, p.gender)
                          const isMoving = movingPlayer === p.id
                          
                          return (
                            <Button
                              key={targetTeamKey}
                              onClick={() => handleMovePlayer(p.id, targetTeamKey as TeamColor)}
                              loading={isMoving}
                              disabled={!teamAcceptance.canAccept || isMoving}
                              icon={teamAcceptance.canAccept ? <ArrowRight /> : <AlertTriangle />}
                              variant="ghost"
                              size="xs"
                              className={`${
                                teamAcceptance.canAccept 
                                  ? 'hover:bg-blue-100 text-blue-600' 
                                  : 'opacity-50 cursor-not-allowed text-gray-400'
                              }`}
                              title={!teamAcceptance.canAccept ? teamAcceptance.reason : `Move to ${targetTeamConfig.name} team`}
                            >
                              {targetTeamConfig.name}
                            </Button>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                  
                  {adminPlayers.map((p) => (
                    <div key={p.id} className="flex items-center p-2 bg-purple-50 rounded-lg">
                      <Shield className="h-4 w-4 mr-2 text-purple-500" />
                      <div>
                        <div className="font-medium text-sm text-purple-800">{p.full_name}</div>
                        <div className="text-xs text-purple-600">{t('admin')}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
