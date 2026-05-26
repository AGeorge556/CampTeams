import { useState, useEffect, useCallback } from 'react'
import { z } from 'zod'
import { supabase } from '../lib/supabase'
import { TeamColor } from '../lib/types'
import { usePlayers } from './usePlayers'
import { useCamp } from '../contexts/CampContext'

interface TeamBalance {
  team: string
  total_count: number
  male_count: number
  female_count: number
}

interface TeamAcceptanceResult {
  canAccept: boolean
  reason: string
}

interface TeamSwitchResult {
  canSwitch: boolean
  reason: string
}

// Zod schemas for runtime validation
const TeamBalanceSchema = z.object({
  team: z.string(),
  total_count: z.number(),
  male_count: z.number(),
  female_count: z.number()
})

const TeamBalancesSchema = z.array(TeamBalanceSchema)

function isValidTeamBalanceArray(value: unknown): value is TeamBalance[] {
  return Array.isArray(value) &&
         value.every(item =>
           item &&
           typeof item === 'object' &&
           typeof item.team === 'string' &&
           typeof item.total_count === 'number' &&
           typeof item.male_count === 'number' &&
           typeof item.female_count === 'number'
         )
}

export function useTeamBalancing() {
  const { players } = usePlayers()
  const { currentCamp, currentRegistration } = useCamp()
  const [teamBalances, setTeamBalances] = useState<TeamBalance[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTeamBalances()
  }, [players])

  const loadTeamBalances = useCallback(() => {
    try {
      setLoading(true)

      // Validate players data structure
      if (!players || typeof players !== 'object') {
        console.warn('Invalid players data structure, resetting balances')
        setTeamBalances([])
        return
      }

      // Calculate balances from players data (already camp-scoped via usePlayers)
      // Admins are excluded from all counts so they don't consume team capacity slots.
      const teams = ['red', 'blue', 'green', 'yellow'] as const
      const balances: TeamBalance[] = teams.map(team => {
        const allPlayers = Array.isArray(players[team]) ? players[team] : []
        const teamPlayers = allPlayers.filter(p => !p?.is_admin)

        return {
          team,
          total_count: teamPlayers.length,
          male_count: teamPlayers.filter(p => p?.gender === 'male').length,
          female_count: teamPlayers.filter(p => p?.gender === 'female').length
        }
      })

      // Validate calculated balances with Zod before setting
      const validationResult = TeamBalancesSchema.safeParse(balances)
      if (validationResult.success) {
        setTeamBalances(validationResult.data)
      } else {
        console.error('Invalid balance calculation result:', validationResult.error)
        setTeamBalances([])
      }
    } catch (error) {
      console.error('Failed to load team balances:', error)
      // CRITICAL: Reset to safe state on error
      setTeamBalances([])
    } finally {
      setLoading(false)
    }
  }, [players])

  // Stable references via useCallback so consumers' useEffect deps don't
  // get a new function reference on every render (which causes infinite loops).

  const canTeamAcceptPlayer = useCallback(async (teamKey: TeamColor, userGender: string): Promise<TeamAcceptanceResult> => {
    const team = teamBalances.find(b => b.team === teamKey)
    if (!team) return { canAccept: false, reason: 'Team not found' }
    if (team.total_count >= 24) return { canAccept: false, reason: 'Team is at maximum capacity (24 players)' }
    const genderCount = userGender === 'male' ? team.male_count : team.female_count
    if (genderCount >= 12) return { canAccept: false, reason: `Team already has maximum ${userGender} players (12)` }
    return { canAccept: true, reason: 'Can join team' }
  }, [teamBalances])

  const canUserSwitchToTeam = useCallback(async (teamKey: TeamColor): Promise<TeamSwitchResult> => {
    if (!currentRegistration) return { canSwitch: false, reason: 'User not registered for this camp' }
    if (currentRegistration.current_team === teamKey) return { canSwitch: false, reason: 'Already on this team' }
    // For initial join (no current team) skip the switches check — first pick is free
    if (currentRegistration.current_team && (currentRegistration.switches_remaining ?? 0) <= 0) {
      return { canSwitch: false, reason: 'No team switches remaining' }
    }
    const acceptanceResult = await canTeamAcceptPlayer(teamKey, currentRegistration.gender)
    if (!acceptanceResult.canAccept) return { canSwitch: false, reason: acceptanceResult.reason }
    return { canSwitch: true, reason: 'Can switch to this team' }
  }, [currentRegistration, canTeamAcceptPlayer])

  const isTeamAtCapacity = useCallback((teamKey: TeamColor): boolean => {
    const team = teamBalances.find(b => b.team === teamKey)
    return team ? team.total_count >= 24 : false
  }, [teamBalances])

  const getTeamSize = useCallback((teamKey: TeamColor): number => {
    const team = teamBalances.find(b => b.team === teamKey)
    return team ? team.total_count : 0
  }, [teamBalances])

  const getMaxTeamSize = useCallback((): number => 24, [])

  const canTeamAcceptGender = useCallback(async (teamKey: TeamColor, gender: string): Promise<boolean> => {
    const team = teamBalances.find(b => b.team === teamKey)
    if (!team || team.total_count >= 24) return false
    const genderCount = gender === 'male' ? team.male_count : team.female_count
    return genderCount < 12
  }, [teamBalances])

  const getBestAvailableTeam = useCallback(async (userGender: string): Promise<TeamColor | null> => {
    const availableTeams: Array<{ team: TeamColor; count: number }> = []
    for (const teamKey of ['red', 'blue', 'green', 'yellow'] as TeamColor[]) {
      const canAccept = await canTeamAcceptGender(teamKey, userGender)
      if (canAccept) availableTeams.push({ team: teamKey, count: getTeamSize(teamKey) })
    }
    if (availableTeams.length === 0) return null
    availableTeams.sort((a, b) => a.count - b.count)
    return availableTeams[0].team
  }, [canTeamAcceptGender, getTeamSize])

  // EMERGENCY: Force teamBalances to always be an array
  const safeTeamBalances = Array.isArray(teamBalances) ? teamBalances : []

  if (!Array.isArray(safeTeamBalances)) {
    console.error('[useTeamBalancing] CRITICAL: teamBalances is not an array after validation!', typeof teamBalances, teamBalances)
  }

  return {
    teamBalances: safeTeamBalances,
    loading,
    canTeamAcceptPlayer,
    canUserSwitchToTeam,
    isTeamAtCapacity,
    getTeamSize,
    getMaxTeamSize,
    canTeamAcceptGender,
    getBestAvailableTeam,
    refresh: loadTeamBalances
  }
}
