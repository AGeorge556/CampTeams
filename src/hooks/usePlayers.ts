import { useEffect, useState, useCallback, useMemo } from 'react'
import { Profile, supabase } from '../lib/supabase'

export interface TeamPlayers {
  [key: string]: Profile[]
}

export function usePlayers() {
  const [players, setPlayers] = useState<TeamPlayers>({
    red: [],
    blue: [],
    green: [],
    yellow: []
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPlayers = useCallback(async () => {
    try {
      setError(null)
      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .not('current_team', 'is', null)
        .eq('participate_in_teams', true)
        .order('full_name')

      if (fetchError) {
        throw fetchError
      }

      // Group players by team
      const teamPlayers: TeamPlayers = {
        red: [],
        blue: [],
        green: [],
        yellow: []
      }
      
      data?.forEach(player => {
        if (player.current_team) {
          teamPlayers[player.current_team].push(player)
        }
      })
      
      setPlayers(teamPlayers)
    } catch (err: any) {
      console.error('Error fetching players:', err)
      setError(err.message || 'Failed to load players')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPlayers()

    // Subscribe to profile changes to update player lists in real-time
    const channel = supabase
      .channel('players')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'profiles' }, 
        () => {
          fetchPlayers()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchPlayers])

  // Memoize team statistics for performance
  const teamStats = useMemo(() => {
    const stats: Record<string, any> = {}
    
    Object.entries(players).forEach(([teamKey, teamPlayers]) => {
      const maleCount = teamPlayers.filter(p => p.gender === 'male').length
      const femaleCount = teamPlayers.filter(p => p.gender === 'female').length
      const grades = teamPlayers.map(p => p.grade)
      
      stats[teamKey] = {
        total: teamPlayers.length,
        male: maleCount,
        female: femaleCount,
        gradeRange: grades.length > 0 ? `${Math.min(...grades)} - ${Math.max(...grades)}` : 'N/A',
        avgGrade: grades.length > 0 ? (grades.reduce((sum, grade) => sum + grade, 0) / grades.length).toFixed(1) : 'N/A'
      }
    })
    
    return stats
  }, [players])

  return { 
    players, 
    loading, 
    error,
    teamStats,
    refetch: fetchPlayers
  }
} 