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
  const { teamBalances, canUserSwitchToTeam, isTeamAtCapacity, getTeamSize } = useTeamBalancing()
  const { addToast } = useToast()
  const [switching, setSwitching] = React.useState<string | null>(null)
  const [teamValidation, setTeamValidation] = React.useState<Record<string, { canSwitch: boolean; reason: string }>>({})

  // Pre-validate team switches for current user
  React.useEffect(() => {
    if (!profile) return

    const validateTeams = async () => {
      const validation: Record<string, { canSwitch: boolean; reason: string }> = {}
      
      for (const teamKey of Object.keys(TEAMS)) {
        if (teamKey !== profile.current_team) {
          const result = await canUserSwitchToTeam(teamKey as TeamColor)
          validation[teamKey] = result
        }
      }
      
      setTeamValidation(validation)
    }

    validateTeams()
  }, [profile, canUserSwitchToTeam])

  const handleSwitchTeam = async (newTeam: TeamColor) => {
    if (!profile || switching) return
    
    setSwitching(newTeam)
    try {
      // Check if switch is allowed using the database validation
      const switchResult = await canUserSwitchToTeam(newTeam)

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
      <div className="bg-[var(--color-card-bg)] rounded-lg shadow-sm p-6 border border-[var(--color-border)]">
        <LoadingSpinner text={t('loadingTeamRosters')} />
      </div>
    )
  }

  return (
    <div className="bg-[var(--color-card-bg)] rounded-lg shadow-sm p-6 border border-[var(--color-border)]">
      <h3 className="text-lg font-semibold text-[var(--color-text)] mb-6 flex items-center">
        <Users className="h-5 w-5 mr-2" />
        {t('teamRosters')}
      </h3>
      
      {/* Team Balance Summary */}
      {teamBalances.length > 0 && (
        <div className="mb-6 p-4 bg-[var(--color-bg-muted)] rounded-lg border border-[var(--color-border)]">
          <div className="flex items-center mb-3">
            <Info className="h-5 w-5 mr-2 text-blue-600" />
            <h4 className="font-medium text-[var(--color-text)]">{t('teamBalanceSummary')}</h4>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {teamBalances.map((balance) => (
              <div key={balance.team} className="text-center">
                <div className="font-semibold text-[var(--color-text)]">{TEAMS[balance.team as TeamColor].name}</div>
                <div className="text-sm text-[var(--color-text-muted)]">
                  {balance.total_count}/24 {t('players')}  {balance.male_count} {t('male')}  {balance.female_count} {t('female')}
                  {isTeamAtCapacity(balance.team as TeamColor) && (
                    <div className="text-red-600 text-xs font-medium mt-1">FULL</div>
                  )}
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
          const teamValidationResult = teamValidation[teamKey]
          const canSwitch = teamValidationResult?.canSwitch ?? false
          const switchReason = teamValidationResult?.reason ?? 'Validating...'
          
          return (
            <div key={teamKey} className="mb-8">
              <div className={`${teamConfig.color} rounded-lg p-4 text-white`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-lg">{teamConfig.name} Team</h4>
                    <span className="text-sm opacity-90">{nonAdminPlayers.length}/24 {t('players')}</span>
                    {profile && profile.current_team === teamKey && (
                      <div className="mt-1">
                        <span className="inline-flex items-center px-2 py-1 bg-[var(--color-bg-muted)] rounded-full text-xs font-medium text-[var(--color-text)] border border-[var(--color-border)]">
                          {t('yourCurrentTeam')}
                        </span>
                      </div>
                    )}
                  </div>
                  {profile && profile.current_team !== teamKey && (profile.switches_remaining || 0) > 0 && profile.participate_in_teams && (
                    <Button
                      onClick={() => handleSwitchTeam(teamKey as TeamColor)}
                      loading={switching === teamKey}
                      disabled={!canSwitch}
                      icon={canSwitch ? <ArrowRight /> : <AlertTriangle className="text-red-600" />}
                      variant="ghost"
                      size="sm"
                      className={`${
                        canSwitch 
                          ? 'bg-[var(--color-bg)] bg-opacity-20 text-[var(--color-text)] border-[var(--color-border)] hover:bg-opacity-30' 
                          : 'bg-red-100 text-red-800 border-red-300 opacity-90 cursor-not-allowed'
                      }`}
                      title={!canSwitch ? switchReason : undefined}
                    >
                      {canSwitch ? t('joinTeam') : switchReason}
                    </Button>
                  )}
                </div>
              </div>

              {/* Player List */}
              <div className="bg-[var(--color-card-bg)] rounded-b-lg p-4 border-t-0 border border-[var(--color-border)] shadow-sm">
                <div className="flex flex-wrap gap-2">
                  {nonAdminPlayers.map((p) => {
                    const roles: { label: string; color: string; icon: React.ReactNode }[] = []
                    if (p.is_admin) roles.push({ label: 'Admin', color: 'bg-purple-100 text-purple-800 border border-purple-300', icon: <Shield className="h-3 w-3 mr-1 text-purple-500" /> })
                    if (p.role === 'shop_owner') roles.push({ label: 'Shop Owner', color: 'bg-yellow-100 text-yellow-800 border border-yellow-300', icon: <User className="h-3 w-3 mr-1 text-yellow-500" /> })
                    if (p.role === 'team_leader') roles.push({ label: 'Team Leader', color: 'bg-blue-100 text-blue-800 border border-blue-300', icon: <User className="h-3 w-3 mr-1 text-blue-500" /> })
                    if (p.role === 'camper' || (!p.is_admin && p.role !== 'shop_owner' && p.role !== 'team_leader')) roles.push({ label: 'Camper', color: 'bg-green-100 text-green-800 border border-green-300', icon: <User className="h-3 w-3 mr-1 text-green-500" /> })
                    return (
                      <span key={p.id} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-[var(--color-bg-muted)] text-[var(--color-text)] mr-2 border border-[var(--color-border)]">
                        <User className="h-4 w-4 mr-1 text-orange-500" />
                        {p.full_name} {!p.is_admin && <span className="ml-1 text-xs text-[var(--color-text-muted)]">({getGradeDisplayWithNumber(p.grade)}, {p.gender === 'male' ? t('male') : t('female')})</span>}
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
                      <span key={p.id} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-[var(--color-bg-muted)] text-[var(--color-text)] border border-[var(--color-border)] mr-2">
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