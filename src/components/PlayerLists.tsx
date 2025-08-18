import React from 'react'
import { Users, User, ArrowRight, Shield } from 'lucide-react'
import { TEAMS, TeamColor, supabase } from '../lib/supabase'
import { usePlayers } from '../hooks/usePlayers'
import { useProfile } from '../hooks/useProfile'
import { useToast } from './Toast'
import { getGradeDisplayWithNumber, MAX_PLAYERS_PER_GRADE } from '../lib/utils'
import Button from './ui/Button'
import LoadingSpinner from './LoadingSpinner'
import { useLanguage } from '../contexts/LanguageContext'

export default function PlayerLists() {
  const { t } = useLanguage()
  const { players, loading } = usePlayers()
  const { profile, updateProfile } = useProfile()
  const { addToast } = useToast()
  const [switching, setSwitching] = React.useState<string | null>(null)

  const handleSwitchTeam = async (newTeam: TeamColor) => {
    if (!profile || switching) return
    
    setSwitching(newTeam)
    try {
      // Check grade limits for the target team
      const targetTeamPlayers = (players[newTeam] || []).filter(p => p.participate_in_teams)
      const playersInSameGrade = targetTeamPlayers.filter(p => p.grade === profile.grade)
      
      if (playersInSameGrade.length >= MAX_PLAYERS_PER_GRADE) {
        addToast({
          type: 'error',
          title: t('cannotSwitchTeams'),
          message: `Cannot switch to ${TEAMS[newTeam].name} team. Maximum of ${MAX_PLAYERS_PER_GRADE} players per grade (${getGradeDisplayWithNumber(profile.grade)}) has been reached.`
        })
        return
      }

      // Check gender balance for the target team (difference ≤ 2)
      const maleCount = targetTeamPlayers.filter(p => p.gender === 'male').length
      const femaleCount = targetTeamPlayers.filter(p => p.gender === 'female').length
      const newMaleCount = profile.gender === 'male' ? maleCount + 1 : maleCount
      const newFemaleCount = profile.gender === 'female' ? femaleCount + 1 : femaleCount
      if (Math.abs(newMaleCount - newFemaleCount) > 2) {
        addToast({
          type: 'error',
          title: t('cannotSwitchTeams'),
          message: t('genderBalanceLimitReached')
        })
        return
      }

      // Global near-even distribution: user's gender should not exceed min count + 1 across teams
      const teams = Object.keys(TEAMS)
      const countsByTeam = teams.reduce<Record<string, { male: number; female: number }>>((acc, key) => {
        const list = (players[key as keyof typeof players] || []).filter(p => p.participate_in_teams)
        acc[key] = {
          male: list.filter(p => p.gender === 'male').length,
          female: list.filter(p => p.gender === 'female').length
        }
        return acc
      }, {})
      const minMale = Math.min(...teams.map(k => countsByTeam[k].male))
      const minFemale = Math.min(...teams.map(k => countsByTeam[k].female))
      if (profile.gender === 'male') {
        if (newMaleCount > minMale + 1) {
          addToast({
            type: 'error',
            title: t('cannotSwitchTeams'),
            message: t('teamSwitchNotAllowed')
          })
          return
        }
      } else {
        if (newFemaleCount > minFemale + 1) {
          addToast({
            type: 'error',
            title: t('cannotSwitchTeams'),
            message: t('teamSwitchNotAllowed')
          })
          return
        }
      }

      // Server-side validation with explicit reason
      const { data: serverResult, error: validateError } = await (supabase as any)
        .rpc('can_switch_team_with_reason', {
          user_id: profile.id,
          new_team: newTeam
        }) as { data: { allowed: boolean; reason: string } | null, error: any }

      if (validateError) {
        throw validateError
      }

      if (!serverResult?.allowed) {
        const reason = (serverResult && typeof serverResult.reason === 'string') ? serverResult.reason : 'unknown'
        const messages: Record<string, string> = {
          no_switches_left: t('You have no team switches remaining.'),
          teams_locked: t('Team switching is currently locked.'),
          same_team: t('You are already in this team.'),
          team_full: t('The selected team is full.'),
          grade_cap: t('The grade limit for this team has been reached.'),
          gender_team_imbalance: t('Switching to this team would cause a gender imbalance.'),
          unknown: t('Team switching is not allowed for an unknown reason.')
        };
        const reasonMessage = messages[reason as keyof typeof messages]

        addToast({
          type: 'error',
          title: t('cannotSwitchTeams'),
          message: reasonMessage
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
        switches_remaining: (profile.switches_remaining ?? 0) - 1
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
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
        <Users className="h-5 w-5 mr-2" />
        {t('teamRosters')}
      </h3>
      
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
                    {profile && profile.current_team === teamKey && (
                      <div className="mt-1">
                        <span className="inline-flex items-center px-2 py-1 bg-white bg-opacity-20 rounded-full text-xs font-medium">
                          {t('yourCurrentTeam')}
                        </span>
                      </div>
                    )}
                  </div>
                  {profile && profile.current_team !== teamKey && (profile.switches_remaining ?? 0) > 0 && profile.participate_in_teams && (
                    <Button
                      onClick={() => handleSwitchTeam(teamKey as TeamColor)}
                      loading={switching === teamKey}
                      icon={<ArrowRight />}
                      variant="ghost"
                      size="sm"
                      className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white border-white"
                    >
                      {t('joinTeam')}
                    </Button>
                  )}
                </div>
              </div>

              {/* Player List */}
              <div className="bg-white rounded-b-lg p-4 border-t-0 border shadow-sm">
                <div className="flex flex-wrap gap-2">
                  {nonAdminPlayers.map((p) => {
                    const roles: { label: string; color: string; icon: React.ReactNode }[] = []
                    if (p.is_admin) roles.push({ label: 'Admin', color: 'bg-purple-100 text-purple-800 border border-purple-300', icon: <Shield className="h-3 w-3 mr-1 text-purple-500" /> })
                    if (p.role === 'shop_owner') roles.push({ label: 'Shop Owner', color: 'bg-yellow-100 text-yellow-800 border border-yellow-300', icon: <User className="h-3 w-3 mr-1 text-yellow-500" /> })
                    if (p.role === 'team_leader') roles.push({ label: 'Team Leader', color: 'bg-blue-100 text-blue-800 border border-blue-300', icon: <User className="h-3 w-3 mr-1 text-blue-500" /> })
                    if (p.role === 'camper' || (!p.is_admin && p.role !== 'shop_owner' && p.role !== 'team_leader')) roles.push({ label: 'Camper', color: 'bg-green-100 text-green-800 border border-green-300', icon: <User className="h-3 w-3 mr-1 text-green-500" /> })
                    return (
                      <span key={p.id} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800 mr-2">
                        <User className="h-4 w-4 mr-1 text-orange-500" />
                        {p.full_name} {!p.is_admin && <span className="ml-1 text-xs text-gray-500">({getGradeDisplayWithNumber(p.grade)}, {p.gender === 'male' ? t('male') : t('female')})</span>}
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
                       <span key={p.id} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800 border border-purple-300 mr-2">
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