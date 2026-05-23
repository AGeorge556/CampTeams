import React from 'react'
import { Users, User, ArrowRight, AlertTriangle, Shield } from 'lucide-react'
import { TEAMS, TeamColor, supabase } from '../lib/supabase'
import { usePlayers } from '../hooks/usePlayers'
import { useProfile } from '../hooks/useProfile'
import { useCamp } from '../contexts/CampContext'
import { useTeamBalancing } from '../hooks/useTeamBalancing'
import { useToast } from './Toast'
import { getGradeDisplayWithNumber } from '../lib/utils'
import Button from './ui/Button'
import LoadingSpinner from './LoadingSpinner'
import { useLanguage } from '../contexts/LanguageContext'

export default function PlayerLists() {
  const { t } = useLanguage()
  const { players, loading } = usePlayers()
  const { profile } = useProfile()
  const { currentCamp, currentRegistration } = useCamp()
  const { teamBalances, canUserSwitchToTeam, isTeamAtCapacity } = useTeamBalancing()
  const { addToast } = useToast()
  const [switching, setSwitching] = React.useState<string | null>(null)
  const [teamValidation, setTeamValidation] = React.useState<Record<string, { canSwitch: boolean; reason: string }>>({})

  if (!players || typeof players !== 'object') {
    return (
      <div className="bg-[var(--color-card-bg)] rounded-2xl border border-[var(--color-border)] p-6 text-sm text-[var(--color-text-muted)]">
        Loading team rosters...
      </div>
    )
  }

  React.useEffect(() => {
    if (!currentRegistration) return
    const validate = async () => {
      const result: Record<string, { canSwitch: boolean; reason: string }> = {}
      for (const key of Object.keys(TEAMS)) {
        if (key !== currentRegistration.current_team) {
          result[key] = await canUserSwitchToTeam(key as TeamColor)
        }
      }
      setTeamValidation(result)
    }
    validate()
  }, [currentRegistration, canUserSwitchToTeam])

  const handleSwitchTeam = async (newTeam: TeamColor) => {
    if (!currentRegistration || !currentCamp || switching) return
    setSwitching(newTeam)
    try {
      const check = await canUserSwitchToTeam(newTeam)
      if (!check.canSwitch) {
        addToast({ type: 'error', title: t('cannotSwitchTeams'), message: check.reason })
        return
      }
      const { error: switchErr } = await supabase
        .from('team_switches')
        .insert({ user_id: currentRegistration.user_id, from_team: currentRegistration.current_team, to_team: newTeam })
      if (switchErr) throw switchErr
      const { error: updateErr } = await supabase
        .from('camp_registrations')
        .update({ current_team: newTeam, switches_remaining: (currentRegistration.switches_remaining || 0) - 1 })
        .eq('id', currentRegistration.id)
      if (updateErr) throw updateErr
      addToast({ type: 'success', title: t('teamSwitchSuccessful'), message: `${t('successfullyJoinedTeam')} ${TEAMS[newTeam].name} team!` })
      setTimeout(() => window.location.reload(), 500)
    } catch (err: any) {
      addToast({ type: 'error', title: 'Error', message: err.message || t('failedToSwitchTeams') })
    } finally {
      setSwitching(null)
    }
  }

  if (loading) {
    return (
      <div className="bg-[var(--color-card-bg)] rounded-2xl border border-[var(--color-border)] p-6">
        <LoadingSpinner text={t('loadingTeamRosters')} />
      </div>
    )
  }

  return (
    <div className="bg-[var(--color-card-bg)] rounded-2xl border border-[var(--color-border)] shadow-[var(--shadow-sm)] overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2.5 px-5 py-4 border-b border-[var(--color-border)]">
        <Users className="h-4.5 w-4.5 text-[var(--color-primary)]" />
        <h3 className="text-base font-bold text-[var(--color-text)]">{t('teamRosters')}</h3>
      </div>

      {/* Balance summary */}
      {Array.isArray(teamBalances) && teamBalances.length > 0 && (
        <div className="px-5 py-3 bg-[var(--color-bg-muted)] border-b border-[var(--color-border)] flex flex-wrap gap-4 text-xs text-[var(--color-text-muted)]">
          {teamBalances.map(b => (
            <span key={b.team} className="flex items-center gap-1.5">
              <span
                className="w-2 h-2 rounded-full inline-block"
                style={{ background: TEAMS[b.team as TeamColor].colorValue }}
              />
              <span className="font-semibold text-[var(--color-text)]">{TEAMS[b.team as TeamColor].name}</span>
              <span>{b.total_count}/24</span>
              {isTeamAtCapacity(b.team as TeamColor) && (
                <span className="text-[var(--color-danger)] font-semibold">FULL</span>
              )}
            </span>
          ))}
        </div>
      )}

      {/* Team grid */}
      <div className="p-4 sm:p-5 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {Object.entries(TEAMS).map(([teamKey, teamConfig]) => {
          const raw = players[teamKey]
          const teamPlayers = Array.isArray(raw) ? raw : []
          const campers = teamPlayers.filter(p => p && p.participate_in_teams && !p.is_admin)
          const admins  = teamPlayers.filter(p => p && p.is_admin)

          const validation = teamValidation[teamKey]
          const canSwitch  = validation?.canSwitch ?? false
          const switchReason = validation?.reason ?? 'Validating...'

          const isMyTeam = currentRegistration?.current_team === teamKey
          const canShowSwitch =
            profile &&
            !isMyTeam &&
            (currentRegistration?.switches_remaining || 0) > 0 &&
            currentRegistration?.participate_in_teams

          return (
            <div key={teamKey} className="rounded-xl overflow-hidden border border-[var(--color-border)]">
              {/* Team header */}
              <div className="px-3.5 py-3 text-white" style={{ background: teamConfig.colorValue }}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-bold text-sm leading-tight">{teamConfig.name}</h4>
                    <p className="text-xs opacity-80 mt-0.5">{campers.length}/24</p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    {isMyTeam && (
                      <span className="text-[10px] font-bold bg-white/25 px-1.5 py-0.5 rounded-full leading-none">
                        You
                      </span>
                    )}
                    {canShowSwitch && (
                      <Button
                        onClick={() => handleSwitchTeam(teamKey as TeamColor)}
                        loading={switching === teamKey}
                        disabled={!canSwitch}
                        icon={canSwitch ? <ArrowRight className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                        variant="ghost"
                        size="sm"
                        className={`text-[10px] px-2 py-1 leading-none ${
                          canSwitch
                            ? 'bg-white/20 text-white border-white/30 hover:bg-white/35'
                            : 'bg-white/10 text-white/60 border-white/15 cursor-not-allowed'
                        }`}
                        title={!canSwitch ? switchReason : undefined}
                      >
                        {canSwitch ? t('joinTeam') : 'Full'}
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Player list */}
              <div className="p-3 bg-[var(--color-card-bg)] min-h-[80px]">
                {campers.length === 0 && admins.length === 0 ? (
                  <p className="text-xs text-[var(--color-text-muted)] italic">Joining soon...</p>
                ) : (
                  <div className="flex flex-col gap-1">
                    {campers.map(p => (
                      <div key={p.id} className="flex items-center gap-1.5">
                        <User className="h-3 w-3 text-[var(--color-text-muted)] shrink-0" />
                        <span className="text-xs text-[var(--color-text)] truncate">{p.full_name}</span>
                        {p.role === 'team_leader' && (
                          <span className="text-[9px] font-bold text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/40 px-1 py-0.5 rounded leading-none shrink-0">
                            Leader
                          </span>
                        )}
                      </div>
                    ))}
                    {admins.map(p => (
                      <div key={p.id} className="flex items-center gap-1.5">
                        <Shield className="h-3 w-3 text-[var(--color-primary)] shrink-0" />
                        <span className="text-xs text-[var(--color-text)] truncate">{p.full_name}</span>
                        <span className="text-[9px] font-bold text-orange-700 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/40 px-1 py-0.5 rounded leading-none shrink-0">
                          Admin
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
