import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { TEAM_COLORS, TeamColor } from '../lib/types'
import { usePlayers } from './usePlayers'
import { useProfile } from './useProfile'
import { MAX_PLAYERS_PER_GRADE } from '../lib/constants'

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
  const { profile } = useProfile()
  const [teamBalances, setTeamBalances] = useState<TeamBalance[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTeamBalances()
  }, [players])

  const loadTeamBalances = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .rpc('get_team_sizes')

      if (error) throw error

      const balances: TeamBalance[] = data.map((row: any) => ({
        team: row.team,
        total_count: row.size,
        male_count: row.male_count,
        female_count: row.female_count
      }))

      setTeamBalances(balances)
    } catch (error) {
      console.error('Failed to load team balances:', error)
    } finally {
      setLoading(false)
    }
  }

  // Check if a team can accept a player based on database validation
  const canTeamAcceptPlayer = async (teamKey: TeamColor, userGender: string): Promise<TeamAcceptanceResult> => {
    try {
      const { data, error } = await supabase
        .rpc('validate_team_assignment', {
          new_team: teamKey,
          user_gender: userGender
        })

      if (error) throw error

      const result = data[0]
      return {
        canAccept: result.can_assign,
        reason: result.reason
      }
    } catch (error) {
      console.error('Failed to validate team assignment:', error)
      return { canAccept: false, reason: 'Error validating team assignment' }
    }
  }

  // Check if user can switch to a specific team using database function
  const canUserSwitchToTeam = async (teamKey: TeamColor): Promise<TeamSwitchResult> => {
    if (!profile) {
      return { canSwitch: false, reason: 'User not authenticated' }
    }

    try {
      const { data, error } = await supabase
        .rpc('can_switch_team', {
          user_id: profile.id,
          new_team: teamKey
        })

      if (error) throw error

      const result = data[0]
      return {
        canSwitch: result.can_switch,
        reason: result.reason
      }
    } catch (error) {
      console.error('Failed to check team switch:', error)
      return { canSwitch: false, reason: 'Error checking team switch' }
    }
  }

  // Get team balance statistics from database
  const getTeamBalanceStats = async () => {
    try {
      const { data, error } = await supabase
        .rpc('get_team_balance_stats')

      if (error) throw error
      return data
    } catch (error) {
      console.error('Failed to get team balance stats:', error)
      return []
    }
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
    try {
      const stats = await getTeamBalanceStats()
      const teamStats = stats.find((s: any) => s.team === teamKey)
      
      if (!teamStats) return false
      
      if (gender === 'male') {
        return teamStats.can_accept_male
      } else {
        return teamStats.can_accept_female
      }
    } catch (error) {
      console.error('Failed to check gender acceptance:', error)
      return false
    }
  }

  // Get the best available team for a user (least populated)
  const getBestAvailableTeam = async (userGender: string): Promise<TeamColor | null> => {
    try {
      const stats = await getTeamBalanceStats()
      const availableTeams = stats.filter((team: any) => {
        if (userGender === 'male') {
          return team.can_accept_male
        } else {
          return team.can_accept_female
        }
      })

      if (availableTeams.length === 0) return null

      // Sort by total players (ascending) to get the least populated team
      availableTeams.sort((a: any, b: any) => a.total_players - b.total_players)
      
      return availableTeams[0].team as TeamColor
    } catch (error) {
      console.error('Failed to get best available team:', error)
      return null
    }
  }

  return {
    teamBalances,
    loading,
    canTeamAcceptPlayer,
    canUserSwitchToTeam,
    getTeamBalanceStats,
    isTeamAtCapacity,
    getTeamSize,
    getMaxTeamSize,
    canTeamAcceptGender,
    getBestAvailableTeam,
    refresh: loadTeamBalances
  }
}

