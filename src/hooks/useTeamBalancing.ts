import { useState, useEffect, useCallback } from 'react'
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

      // Calculate balances from players data (already camp-scoped via usePlayers)
      const teams = ['red', 'blue', 'green', 'yellow']
      const balances: TeamBalance[] = teams.map(team => {
        const teamPlayers = players[team] || []
        return {
          team,
          total_count: teamPlayers.length,
          male_count: teamPlayers.filter(p => p.gender === 'male').length,
          female_count: teamPlayers.filter(p => p.gender === 'female').length
        }
      })

      setTeamBalances(balances)
    } catch (error) {
      console.error('Failed to load team balances:', error)
    } finally {
      setLoading(false)
    }
  }, [players])

  // Check if a team can accept a player
  const canTeamAcceptPlayer = async (teamKey: TeamColor, userGender: string): Promise<TeamAcceptanceResult> => {
    const team = teamBalances.find(b => b.team === teamKey)
    if (!team) {
      return { canAccept: false, reason: 'Team not found' }
    }

    // Team is full (24 players max)
    if (team.total_count >= 24) {
      return { canAccept: false, reason: 'Team is at maximum capacity (24 players)' }
    }

    // Check gender balance (max 12 per gender per team)
    const genderCount = userGender === 'male' ? team.male_count : team.female_count
    if (genderCount >= 12) {
      return { canAccept: false, reason: `Team already has maximum ${userGender} players (12)` }
    }

    return { canAccept: true, reason: 'Can join team' }
  }

  // Check if user can switch to a specific team
  const canUserSwitchToTeam = async (teamKey: TeamColor): Promise<TeamSwitchResult> => {
    if (!currentRegistration) {
      return { canSwitch: false, reason: 'User not registered for this camp' }
    }

    // Can't switch to current team
    if (currentRegistration.current_team === teamKey) {
      return { canSwitch: false, reason: 'Already on this team' }
    }

    // Check if user has switches remaining
    if ((currentRegistration.switches_remaining ?? 0) <= 0) {
      return { canSwitch: false, reason: 'No team switches remaining' }
    }

    // Check if team can accept the player
    const acceptanceResult = await canTeamAcceptPlayer(teamKey, currentRegistration.gender)
    if (!acceptanceResult.canAccept) {
      return { canSwitch: false, reason: acceptanceResult.reason }
    }

    return { canSwitch: true, reason: 'Can switch to this team' }
  }

  // Check if a team is at capacity (24 players)
  const isTeamAtCapacity = (teamKey: TeamColor): boolean => {
    const team = teamBalances.find(b => b.team === teamKey)
    return team ? team.total_count >= 24 : false
  }

  // Get the current size of a team
  const getTeamSize = (teamKey: TeamColor): number => {
    const team = teamBalances.find(b => b.team === teamKey)
    return team ? team.total_count : 0
  }

  // Get the maximum team size (always 24)
  const getMaxTeamSize = (): number => {
    return 24
  }

  // Check if a team can accept a specific gender
  const canTeamAcceptGender = async (teamKey: TeamColor, gender: string): Promise<boolean> => {
    const team = teamBalances.find(b => b.team === teamKey)
    if (!team) return false

    // Team full
    if (team.total_count >= 24) return false

    // Check gender balance
    const genderCount = gender === 'male' ? team.male_count : team.female_count
    return genderCount < 12
  }

  // Get the best available team for a user (least populated)
  const getBestAvailableTeam = async (userGender: string): Promise<TeamColor | null> => {
    const availableTeams: Array<{ team: TeamColor; count: number }> = []

    for (const teamKey of ['red', 'blue', 'green', 'yellow'] as TeamColor[]) {
      const canAccept = await canTeamAcceptGender(teamKey, userGender)
      if (canAccept) {
        availableTeams.push({
          team: teamKey,
          count: getTeamSize(teamKey)
        })
      }
    }

    if (availableTeams.length === 0) return null

    // Sort by count (ascending) to get the least populated team
    availableTeams.sort((a, b) => a.count - b.count)

    return availableTeams[0].team
  }

  return {
    teamBalances,
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
