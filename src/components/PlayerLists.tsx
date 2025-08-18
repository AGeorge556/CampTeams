import React from 'react'
import { Users, User, ArrowRight, Shield } from 'lucide-react'
import { TEAMS, TeamColor, supabase } from '../lib/supabase'
import { usePlayers } from '../hooks/usePlayers'
import { useProfile } from '../hooks/useProfile'
import { useToast } from './Toast'
import { getGradeDisplayWithNumber } from '../lib/utils'
import Button from './ui/Button'
import LoadingSpinner from './LoadingSpinner'
import { useLanguage } from '../contexts/LanguageContext'

export default function PlayerLists() {
  const { t } = useLanguage()
  const { players, loading } = usePlayers()
  const { profile, updateProfile } = useProfile()
  const { addToast } = useToast()
  const [switching, setSwitching] = React.useState<string | null>(null)
  const [maxTeamSize, setMaxTeamSize] = React.useState<number>(25)
  const [teamsLocked, setTeamsLocked] = React.useState<boolean>(false)

  React.useEffect(() => {
    // Load camp settings for capacity and lock state
    ;(async () => {
      try {
        const { data, error } = await supabase
          .from('camp_settings')
          .select('max_team_size, teams_locked')
          .limit(1)
          .maybeSingle()
        if (!error && data) {
          if (typeof data.max_team_size === 'number') setMaxTeamSize(data.max_team_size)
          if (typeof data.teams_locked === 'boolean') setTeamsLocked(data.teams_locked)
        }
      } catch (e) {
        // Ignore; defaults are fine for UI hints
      }
    })()
  }, [])

  const getJoinBlockReason = (teamKey: string): string | null => {
    if (!profile) return 'You must be signed in.'
    if (profile.is_admin) return null
    if (teamsLocked) return 'Team switching is not allowed at this time.'
    if ((profile.switches_remaining ?? 0) <= 0) return 'You have no switches remaining.'

    const counts: Record<string, number> = {}
    const teamKeys = Object.keys(TEAMS) as Array<keyof typeof TEAMS>
    for (const k of teamKeys) {
      counts[k] = (players[k as keyof typeof players] || []).filter(p => p.participate_in_teams).length
    }

    const targetCount = counts[teamKey] || 0
    if (targetCount >= maxTeamSize) return 'This team is already full.'

    const targetPlayers = (players[teamKey] || []).filter(p => p.participate_in_teams)
    const male = targetPlayers.filter(p => p.gender === 'male').length
    const female = targetPlayers.filter(p => p.gender === 'female').length
    const newMale = male + (profile.gender === 'male' ? 1 : 0)
    const newFemale = female + (profile.gender === 'female' ? 1 : 0)
    if (Math.abs(newMale - newFemale) > 1) return 'Switch not allowed: Teams must stay gender balanced.'

    // Size balance after move: max - min <= 1
    const afterCounts = { ...counts }
    if (profile.current_team) afterCounts[profile.current_team] = Math.max(0, (afterCounts[profile.current_team] || 0) - 1)
    afterCounts[teamKey] = (afterCounts[teamKey] || 0) + 1
    const values = Object.values(afterCounts)
    const maxVal = Math.max(...values)
    const minVal = Math.min(...values)
    if (maxVal - minVal > 1) return 'Switch not allowed: Teams must stay balanced in size.'

    return null
  }

  const handleSwitchTeam = async (newTeam: TeamColor) => {
    if (!profile || switching) return
    
    setSwitching(newTeam)
    try {
      // Server-side validation with explicit reason only (single authoritative source)
      const { data: serverResult, error: validateError } = await (supabase as any)
        .rpc('can_switch_team_with_reason', {
          user_id: profile.id,
          new_team: newTeam
        }) as { data: { allowed: boolean; reason: string; details: any } | null, error: any }

      if (validateError) {
        throw validateError
      }

      if (!serverResult?.allowed) {
        const reason = (serverResult && typeof serverResult.reason === 'string') ? serverResult.reason : 'unknown'
        const details = serverResult?.details || {}
        
        let errorMessage = ''
        switch (reason) {
          case 'switch_limit':
          case 'no_switches_left':
            errorMessage = 'You have no switches remaining.'
            break
          case 'teams_locked':
            errorMessage = 'Team switching is not allowed at this time.'
            break
          case 'same_team': {
            const teamKey = (details.current_team ?? '') as keyof typeof TEAMS
            const teamName = teamKey && TEAMS[teamKey] ? TEAMS[teamKey].name : 'this'
            errorMessage = `You are already in the ${teamName} team.`
            break
          }
          case 'team_full':
            errorMessage = 'This team is already full.'
            break
          case 'gender_imbalance':
          case 'gender_team_imbalance':
            errorMessage = 'Switch not allowed: Teams must stay gender balanced.'
            break
          case 'size_imbalance':
          case 'team_balance':
            errorMessage = 'Switch not allowed: Teams must stay balanced in size.'
            break
          case 'grade_cap':
            errorMessage = `This team already has too many players from grade ${getGradeDisplayWithNumber(details.grade)}.`
            break
          default:
            errorMessage = 'Unable to switch teams at this time. Please try again later.'
        }

        addToast({
          type: 'error',
          title: t('cannotSwitchTeams'),
          message: errorMessage,
          duration: 4000
        })
        return
      }

      // No special overrides in the new rules

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
                  {profile && profile.current_team !== teamKey && profile.participate_in_teams && (
                    <Button
                      onClick={() => handleSwitchTeam(teamKey as TeamColor)}
                      loading={switching === teamKey}
                      icon={<ArrowRight />}
                      variant="ghost"
                      size="sm"
                      className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white border-white disabled:opacity-60 disabled:cursor-not-allowed"
                      disabled={Boolean(getJoinBlockReason(teamKey))}
                      title={getJoinBlockReason(teamKey) || ''}
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