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
      const teamPlayers = (players[teamKey] || []).filter(p => p.participate_in_teams)
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

    // Project a join into the target team and verify balances across teams
    const projected = teamBalances.map(b => ({ ...b }))
    const projIdx = projected.findIndex(b => b.team === teamKey)
    if (projIdx >= 0) {
      projected[projIdx].total_count += 1
      if (userGender === 'male') projected[projIdx].male_count += 1
      else projected[projIdx].female_count += 1
    }

    const sizes = projected.map(b => b.total_count)
    if (Math.max(...sizes) - Math.min(...sizes) > MAX_TEAM_SIZE_DIFFERENCE) {
      return { canAccept: false, reason: 'Team size balance would be disrupted' }
    }

    const maleCounts = projected.map(b => b.male_count)
    if (Math.max(...maleCounts) - Math.min(...maleCounts) > MAX_GENDER_DIFFERENCE_ACROSS_TEAMS) {
      return { canAccept: false, reason: 'Gender balance would be disrupted' }
    }

    const femaleCounts = projected.map(b => b.female_count)
    if (Math.max(...femaleCounts) - Math.min(...femaleCounts) > MAX_GENDER_DIFFERENCE_ACROSS_TEAMS) {
      return { canAccept: false, reason: 'Gender balance would be disrupted' }
    }

    // Check grade limit (max 4 players per grade per team)
    if (profile) {
      const teamPlayers = (players[teamKey] || []).filter(p => p.participate_in_teams)
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

    // Project the move across all teams and verify final distribution
    const projected = teamBalances.map(b => ({ ...b }))
    const fromIdx = projected.findIndex(b => b.team === fromTeam)
    const toIdx = projected.findIndex(b => b.team === newTeam)

    if (toIdx >= 0) {
      projected[toIdx].total_count += 1
      if (userGender === 'male') projected[toIdx].male_count += 1
      else projected[toIdx].female_count += 1
    }
    if (fromIdx >= 0) {
      projected[fromIdx].total_count = Math.max(0, projected[fromIdx].total_count - 1)
      if (userGender === 'male') projected[fromIdx].male_count = Math.max(0, projected[fromIdx].male_count - 1)
      else projected[fromIdx].female_count = Math.max(0, projected[fromIdx].female_count - 1)
    }

    const sizes = projected.map(b => b.total_count)
    if (Math.max(...sizes) - Math.min(...sizes) > MAX_TEAM_SIZE_DIFFERENCE && !profile.is_admin) {
      return { canSwitch: false, reason: 'Team balance must be maintained' }
    }

    const maleCounts = projected.map(b => b.male_count)
    if (Math.max(...maleCounts) - Math.min(...maleCounts) > MAX_GENDER_DIFFERENCE_ACROSS_TEAMS && !profile.is_admin) {
      return { canSwitch: false, reason: 'Gender balance must be maintained' }
    }

    const femaleCounts = projected.map(b => b.female_count)
    if (Math.max(...femaleCounts) - Math.min(...femaleCounts) > MAX_GENDER_DIFFERENCE_ACROSS_TEAMS && !profile.is_admin) {
      return { canSwitch: false, reason: 'Gender balance must be maintained' }
    }

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

