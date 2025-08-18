import React from 'react'
import { Users, User, ArrowRight, AlertTriangle, Shield, Info } from 'lucide-react'
import { TEAMS, TeamColor, supabase } from '../lib/supabase'
import { usePlayers } from '../hooks/usePlayers'
import { useProfile } from '../hooks/useProfile'
import { useTeamBalancing } from '../hooks/useTeamBalancing'
import { useToast } from './Toast'
import { getGradeDisplayWithNumber } from '../lib/utils'
import Button from './ui/Button'
import LoadingSpinner from './LoadingSpinner'
import { useLanguage } from '../contexts/LanguageContext'

export default function PlayerLists() {
  const { t } = useLanguage()
  const { players, loading } = usePlayers()
  const { profile, updateProfile } = useProfile()
  const { teamBalances, canTeamAcceptPlayer, canSwitchToTeam } = useTeamBalancing()
  const { addToast } = useToast()
  const [switching, setSwitching] = React.useState<string | null>(null)

  const handleSwitchTeam = async (newTeam: TeamColor) => {
    if (!profile || switching) return
    
    setSwitching(newTeam)
    try {
      // Check if switch is allowed using the new balancing logic
      const switchResult = await canSwitchToTeam(newTeam)

      if (!switchResult.canSwitch) {
        addToast({
          type: 'error',
          title: t('cannotSwitchTeams'),
          message: switchResult.reason
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
        switches_remaining: (profile.switches_remaining || 0) - 1
      })

      if (updateError) {
        throw updateError
      }

      addToast({
        type: 'success',
        title: t('teamSwitchSuccessful'),
        message: `${t('successfullyJoinedTeam')} ${TEAMS[newTeam].name} team!`
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
        message: error.message || t('failedToSwitchTeams')
      })
    } finally {
      setSwitching(null)
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
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 transition-colors duration-300">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center transition-colors duration-300">
        <Users className="h-5 w-5 mr-2" />
        {t('teamRosters')}
      </h3>
      
      {/* Team Balance Summary */}
      {teamBalances.length > 0 && (
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700 transition-colors duration-300">
          <div className="flex items-center mb-3">
            <Info className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" />
            <h4 className="font-medium text-blue-900 dark:text-blue-100">{t('teamBalanceSummary')}</h4>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {teamBalances.map((balance) => (
              <div key={balance.team} className="text-center">
                <div className="font-semibold text-blue-800 dark:text-blue-200">{TEAMS[balance.team as TeamColor].name}</div>
                <div className="text-sm text-blue-600 dark:text-blue-300">
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
          const nonAdminPlayers = teamPlayers.filter(p => p.participate_in_teams && !p.is_admin)
          const adminPlayers = teamPlayers.filter(p => p.is_admin)
          return (
            <div key={teamKey} className="mb-8">
              <div className={`${teamConfig.color} rounded-lg p-4 text-white`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-lg">{teamConfig.name} Team</h4>
                    <span className="text-sm opacity-90">{nonAdminPlayers.length} {t('players')}</span>
                    {profile && profile.current_team === teamKey && (
                      <div className="mt-1">
                        <span className="inline-flex items-center px-2 py-1 bg-white bg-opacity-20 rounded-full text-xs font-medium">
                          {t('yourCurrentTeam')}
                        </span>
                      </div>
                    )}
                  </div>
                  {profile && profile.current_team !== teamKey && (profile.switches_remaining || 0) > 0 && profile.participate_in_teams && (() => {
                    const teamAcceptance = canTeamAcceptPlayer(teamKey as TeamColor, profile.gender)
                    return (
                      <Button
                        onClick={() => handleSwitchTeam(teamKey as TeamColor)}
                        loading={switching === teamKey}
                        disabled={!teamAcceptance.canAccept}
                        icon={teamAcceptance.canAccept ? <ArrowRight /> : <AlertTriangle className="text-red-600" />}
                        variant="ghost"
                        size="sm"
                        className={`${
                          teamAcceptance.canAccept 
                            ? 'bg-white bg-opacity-20 text-white border-white hover:bg-opacity-30' 
                            : 'bg-red-100 text-red-800 border-red-300 opacity-90 cursor-not-allowed'
                        }`}
                        title={!teamAcceptance.canAccept ? teamAcceptance.reason : undefined}
                      >
                        {teamAcceptance.canAccept ? t('joinTeam') : teamAcceptance.reason}
                      </Button>
                    )
                  })()}
                </div>
              </div>

              {/* Player List */}
              <div className="bg-white dark:bg-gray-800 rounded-b-lg p-4 border-t-0 border shadow-sm transition-colors duration-300">
                <div className="flex flex-wrap gap-2">
                  {nonAdminPlayers.map((p) => {
                    const roles: { label: string; color: string; icon: React.ReactNode }[] = []
                    if (p.is_admin) roles.push({ label: 'Admin', color: 'bg-purple-100 text-purple-800 border border-purple-300', icon: <Shield className="h-3 w-3 mr-1 text-purple-500" /> })
                    if (p.role === 'shop_owner') roles.push({ label: 'Shop Owner', color: 'bg-yellow-100 text-yellow-800 border border-yellow-300', icon: <User className="h-3 w-3 mr-1 text-yellow-500" /> })
                    if (p.role === 'team_leader') roles.push({ label: 'Team Leader', color: 'bg-blue-100 text-blue-800 border border-blue-300', icon: <User className="h-3 w-3 mr-1 text-blue-500" /> })
                    if (p.role === 'camper' || (!p.is_admin && p.role !== 'shop_owner' && p.role !== 'team_leader')) roles.push({ label: 'Camper', color: 'bg-green-100 text-green-800 border border-green-300', icon: <User className="h-3 w-3 mr-1 text-green-500" /> })
                    return (
                      <span key={p.id} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 mr-2 transition-colors duration-300">
                        <User className="h-4 w-4 mr-1 text-orange-500" />
                        {p.full_name} {!p.is_admin && <span className="ml-1 text-xs text-gray-500 dark:text-gray-400">({getGradeDisplayWithNumber(p.grade)}, {p.gender === 'male' ? t('male') : t('female')})</span>}
                        {roles.map((role, idx) => (
                          <span key={idx} className={`ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${role.color}`}>{role.icon}{role.label}</span>
                        ))}
                      </span>
                    )
                  })}
                                     {adminPlayers.map((p) => {
                     const roles: { label: string; color: string; icon: React.ReactNode }[] = []
                     if (p.is_admin) roles.push({ label: 'Admin', color: 'bg-purple-100 text-purple-800 border border-purple-300', icon: <Shield className="h-3 w-3 mr-1 text-purple-500" /> })
                     if (p.role === 'shop_owner') roles.push({ label: 'Shop Owner', color: 'bg-yellow-100 text-yellow-800 border border-yellow-300', icon: <User className="h-3 w-3 mr-1 text-yellow-500" /> })
                     if (p.role === 'team_leader') roles.push({ label: 'Team Leader', color: 'bg-blue-100 text-blue-800 border border-blue-300', icon: <User className="h-3 w-3 mr-1 text-blue-500" /> })
                     if (p.role === 'camper' || (!p.is_admin && p.role !== 'shop_owner' && p.role !== 'team_leader')) roles.push({ label: 'Camper', color: 'bg-green-100 text-green-800 border border-green-300', icon: <User className="h-3 w-3 mr-1 text-green-500" /> })
                     return (
                       <span key={p.id} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 border border-purple-300 dark:border-purple-600 mr-2 transition-colors duration-300">
                         <Shield className="h-4 w-4 mr-1 text-purple-500" />
                         {p.full_name}
                         {roles.map((role, idx) => (
                           <span key={idx} className={`ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${role.color}`}>{role.icon}{role.label}</span>
                         ))}
                       </span>
                     )
                   })}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
} 