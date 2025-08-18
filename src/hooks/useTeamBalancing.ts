import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { TeamColor } from '../lib/supabase'
import { usePlayers } from './usePlayers'
import { useProfile } from './useProfile'

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

  // Check if a team can accept a player based on balancing rules
  const canTeamAcceptPlayer = (teamKey: TeamColor, userGender: string): TeamAcceptanceResult => {
    if (!teamBalances.length) {
      return { canAccept: false, reason: 'Loading team data...' }
    }

    const targetTeam = teamBalances.find(b => b.team === teamKey)
    if (!targetTeam) {
      return { canAccept: false, reason: 'Team not found' }
    }

    // Check absolute team size limit
    if (targetTeam.total_count >= 50) {
      return { canAccept: false, reason: 'Team is at maximum capacity' }
    }

    // Find minimum team size and gender counts across all teams
    const minTeamSize = Math.min(...teamBalances.map(b => b.total_count))
    const minMaleCount = Math.min(...teamBalances.map(b => b.male_count))
    const minFemaleCount = Math.min(...teamBalances.map(b => b.female_count))

    // Check team size balance (teams should stay within 1 player difference)
    if (targetTeam.total_count > minTeamSize + 1) {
      return { canAccept: false, reason: 'Team size balance would be disrupted' }
    }

    // Check gender balance across teams
    if (userGender === 'male') {
      if (targetTeam.male_count > minMaleCount + 1) {
        return { canAccept: false, reason: 'Gender balance would be disrupted' }
      }
    } else {
      if (targetTeam.female_count > minFemaleCount + 1) {
        return { canAccept: false, reason: 'Gender balance would be disrupted' }
      }
    }

    // Check grade limit (max 4 players per grade per team)
    if (profile) {
      const teamPlayers = (players[teamKey] || []).filter(p => p.participate_in_teams)
      const playersInSameGrade = teamPlayers.filter(p => p.grade === profile.grade)
      if (playersInSameGrade.length >= 4) {
        return { canAccept: false, reason: 'Maximum players per grade reached' }
      }
    }

    return { canAccept: true, reason: 'Team can accept player' }
  }

  // Check if user can switch to a specific team
  const canSwitchToTeam = async (newTeam: TeamColor): Promise<SwitchResult> => {
    if (!profile) {
      return { canSwitch: false, reason: 'User profile not found' }
    }

    try {
      const { data, error } = await supabase
        .rpc('can_switch_team', {
          user_id: profile.id,
          new_team: newTeam
        })

      if (error) {
        console.error('Error checking team switch:', error)
        return { canSwitch: false, reason: 'Error checking team switch' }
      }

      if (data && data.length > 0) {
        return {
          canSwitch: data[0].can_switch,
          reason: data[0].reason
        }
      }

      return { canSwitch: false, reason: 'Unknown error' }
    } catch (error) {
      console.error('Error checking team switch:', error)
      return { canSwitch: false, reason: 'Error checking team switch' }
    }
  }

  // Get recommended team for user
  const getRecommendedTeam = async (): Promise<{ team: string; reason: string } | null> => {
    if (!profile) return null

    try {
      const { data, error } = await supabase
        .rpc('get_recommended_team', {
          user_id: profile.id
        })

      if (error) {
        console.error('Error getting recommended team:', error)
        return null
      }

      if (data && data.length > 0) {
        return {
          team: data[0].recommended_team,
          reason: data[0].reason
        }
      }

      return null
    } catch (error) {
      console.error('Error getting recommended team:', error)
      return null
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

import { TEAMS } from '../lib/supabase'
