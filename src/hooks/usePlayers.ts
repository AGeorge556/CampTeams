import { useEffect, useState, useCallback, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { useCamp } from '../contexts/CampContext'

export interface CampPlayer {
  id: string
  user_id: string
  full_name: string
  grade: number
  gender: 'male' | 'female'
  current_team: string | null
  preferred_team: string | null
  switches_remaining: number
  participate_in_teams: boolean
  role: string
  age?: number
  mobile_number?: string
  parent_name?: string
  parent_number?: string
  is_admin: boolean
}

export interface TeamPlayers {
  [key: string]: CampPlayer[]
}

export function usePlayers() {
  const { currentCamp } = useCamp()
  const [players, setPlayers] = useState<TeamPlayers>({
    red: [],
    blue: [],
    green: [],
    yellow: []
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPlayers = useCallback(async () => {
    if (!currentCamp) {
      setLoading(false)
      return
    }

    try {
      setError(null)
      setLoading(true)

      // Fetch camp registrations for this specific camp
      const { data, error: fetchError } = await supabase
        .from('camp_registrations')
        .select('*')
        .eq('camp_id', currentCamp.id)
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

      data?.forEach(registration => {
        if (registration.current_team) {
          // Map camp_registration to CampPlayer format
          const player: CampPlayer = {
            id: registration.id,
            user_id: registration.user_id,
            full_name: registration.full_name,
            grade: registration.grade,
            gender: registration.gender,
            current_team: registration.current_team,
            preferred_team: registration.preferred_team,
            switches_remaining: registration.switches_remaining ?? 0,
            participate_in_teams: registration.participate_in_teams,
            role: registration.role || 'camper',
            age: registration.age,
            mobile_number: registration.mobile_number,
            parent_name: registration.parent_name,
            parent_number: registration.parent_number,
            is_admin: registration.role === 'admin'
          }
          teamPlayers[registration.current_team].push(player)
        }
      })

      // Only update state if data actually changed (deep comparison by JSON)
      setPlayers(prev => {
        const prevJSON = JSON.stringify(prev)
        const newJSON = JSON.stringify(teamPlayers)
        return prevJSON === newJSON ? prev : teamPlayers
      })
    } catch (err: any) {
      console.error('Error fetching players:', err)
      setError(err.message || 'Failed to load players')
    } finally {
      setLoading(false)
    }
  }, [currentCamp])

  useEffect(() => {
    if (!currentCamp) return

    fetchPlayers()

    // Subscribe to camp_registrations changes for this camp
    const channel = supabase
      .channel(`camp_players_${currentCamp.id}`)
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'camp_registrations',
          filter: `camp_id=eq.${currentCamp.id}`
        },
        () => {
          fetchPlayers()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchPlayers, currentCamp])

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
