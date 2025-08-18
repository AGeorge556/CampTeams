import { useState, useEffect } from 'react'
import { TEAMS, TeamColor } from '../lib/supabase'
import { usePlayers } from './usePlayers'
import { useProfile } from './useProfile'
import {
	MAX_TEAM_SIZE,
	MAX_PLAYERS_PER_GRADE,
	MAX_TEAM_SIZE_DIFFERENCE,
	MAX_GENDER_DIFFERENCE_ACROSS_TEAMS,
} from '../lib/constants'

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

interface SwitchResult {
  canSwitch: boolean
  reason: string
}

export function useTeamBalancing() {
  const { players } = usePlayers()
  const { profile } = useProfile()
  const [teamBalances, setTeamBalances] = useState<TeamBalance[]>([])
  const [loading, setLoading] = useState(true)

  // Calculate team balances from current player data
  useEffect(() => {
    if (!players) return

    const balances: TeamBalance[] = Object.entries(TEAMS).map(([teamKey, teamConfig]) => {
      const teamPlayers = (players[teamKey] || []).filter(p => p.participate_in_teams && !p.is_admin)
      const maleCount = teamPlayers.filter(p => p.gender === 'male').length
      const femaleCount = teamPlayers.filter(p => p.gender === 'female').length
      
      return {
        team: teamKey,
        total_count: teamPlayers.length,
        male_count: maleCount,
        female_count: femaleCount
      }
    })

    setTeamBalances(balances)
    setLoading(false)
  }, [players])

  // Check if a team can accept a player based on balancing rules (join-only projection)
  const canTeamAcceptPlayer = (teamKey: TeamColor, userGender: string): TeamAcceptanceResult => {
    if (!teamBalances.length) {
      return { canAccept: false, reason: 'Loading team data...' }
    }

    const targetTeam = teamBalances.find(b => b.team === teamKey)
    if (!targetTeam) {
      return { canAccept: false, reason: 'Team not found' }
    }

    // Check absolute team size limit
    if (targetTeam.total_count >= MAX_TEAM_SIZE) {
      return { canAccept: false, reason: 'Team is at maximum capacity' }
    }

    // Only check absolute team size limit (24 players max)
    // Remove overly restrictive balancing rules that prevent reasonable team growth

    // Check grade limit (max 4 players per grade per team)
    if (profile) {
      const teamPlayers = (players[teamKey] || []).filter(p => p.participate_in_teams && !p.is_admin)
      const playersInSameGrade = teamPlayers.filter(p => p.grade === profile.grade)
      if (playersInSameGrade.length >= MAX_PLAYERS_PER_GRADE) {
        return { canAccept: false, reason: 'Maximum players per grade reached' }
      }
    }

    return { canAccept: true, reason: 'Team can accept player' }
  }

  // Check if user can switch to a specific team (full client-side projection)
  const canSwitchToTeam = async (newTeam: TeamColor): Promise<SwitchResult> => {
    if (!profile) return { canSwitch: false, reason: 'User profile not found' }

    // Admins never count toward restrictions and can always move
    if (profile.is_admin) {
      return { canSwitch: true, reason: 'Admin override' }
    }

    if (profile.current_team === newTeam) {
      return { canSwitch: false, reason: 'Already on this team' }
    }

    if (!profile.is_admin && (profile.switches_remaining || 0) <= 0) {
      return { canSwitch: false, reason: 'No switches remaining' }
    }

    const fromTeam = (profile.current_team || '') as TeamColor
    const userGender = profile.gender

    // Basic capacity/grade checks using the join-only helper
    const acceptCheck = canTeamAcceptPlayer(newTeam, userGender)
    if (!acceptCheck.canAccept && !profile.is_admin) {
      return { canSwitch: false, reason: acceptCheck.reason }
    }

    // Only check if the target team would exceed 24 players
    // Remove overly restrictive balancing rules that prevent reasonable team switching

    return { canSwitch: true, reason: 'Switch allowed' }
  }

  // Get recommended team for user (client-side)
  const getRecommendedTeam = async (): Promise<{ team: string; reason: string } | null> => {
    if (!profile) return null

    // Prefer teams with the smallest total size, then smallest gender count for the user's gender
    const minSize = Math.min(...teamBalances.map(b => b.total_count))
    const smallestTeams = teamBalances.filter(b => b.total_count === minSize)

    const genderKey = profile.gender === 'male' ? 'male_count' : 'female_count'
    const minGender = Math.min(...smallestTeams.map(b => b[genderKey as 'male_count' | 'female_count']))
    const candidates = smallestTeams.filter(b => b[genderKey as 'male_count' | 'female_count'] === minGender)

    if (!candidates.length) return null

    const chosen = candidates[0]
    return {
      team: chosen.team,
      reason: 'Chosen to maintain even team and gender distribution'
    }
  }

  // Get teams that can accept the current user
  const getAvailableTeams = (): TeamColor[] => {
    if (!profile) return []

    return Object.keys(TEAMS).filter(teamKey => {
      const result = canTeamAcceptPlayer(teamKey as TeamColor, profile.gender)
      return result.canAccept
    }) as TeamColor[]
  }

  return {
    teamBalances,
    loading,
    canTeamAcceptPlayer,
    canSwitchToTeam,
    getRecommendedTeam,
    getAvailableTeams
  }
}

