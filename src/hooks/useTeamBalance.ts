import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useCamp } from '../contexts/CampContext'

export interface TeamBalance {
  team: string
  total_count: number
  male_count: number
  female_count: number
  grade_7_count: number
  grade_8_count: number
  grade_9_count: number
  grade_10_count: number
  grade_11_count: number
  grade_12_count: number
}

export function useTeamBalance() {
  const { currentCamp } = useCamp()
  const [teamBalance, setTeamBalance] = useState<TeamBalance[]>([
    { team: 'red', total_count: 0, male_count: 0, female_count: 0, grade_7_count: 0, grade_8_count: 0, grade_9_count: 0, grade_10_count: 0, grade_11_count: 0, grade_12_count: 0 },
    { team: 'blue', total_count: 0, male_count: 0, female_count: 0, grade_7_count: 0, grade_8_count: 0, grade_9_count: 0, grade_10_count: 0, grade_11_count: 0, grade_12_count: 0 },
    { team: 'green', total_count: 0, male_count: 0, female_count: 0, grade_7_count: 0, grade_8_count: 0, grade_9_count: 0, grade_10_count: 0, grade_11_count: 0, grade_12_count: 0 },
    { team: 'yellow', total_count: 0, male_count: 0, female_count: 0, grade_7_count: 0, grade_8_count: 0, grade_9_count: 0, grade_10_count: 0, grade_11_count: 0, grade_12_count: 0 }
  ])
  const [loading, setLoading] = useState(true)

  const fetchTeamBalance = useCallback(async () => {
    if (!currentCamp) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)

      // Fetch all registrations for this camp who participate in teams
      const { data, error } = await supabase
        .from('camp_registrations')
        .select('current_team, gender, grade')
        .eq('camp_id', currentCamp.id)
        .eq('participate_in_teams', true)
        .not('current_team', 'is', null)

      if (error) {
        console.error('Error fetching team balance:', error)
        setTeamBalance([
          { team: 'red', total_count: 0, male_count: 0, female_count: 0, grade_7_count: 0, grade_8_count: 0, grade_9_count: 0, grade_10_count: 0, grade_11_count: 0, grade_12_count: 0 },
          { team: 'blue', total_count: 0, male_count: 0, female_count: 0, grade_7_count: 0, grade_8_count: 0, grade_9_count: 0, grade_10_count: 0, grade_11_count: 0, grade_12_count: 0 },
          { team: 'green', total_count: 0, male_count: 0, female_count: 0, grade_7_count: 0, grade_8_count: 0, grade_9_count: 0, grade_10_count: 0, grade_11_count: 0, grade_12_count: 0 },
          { team: 'yellow', total_count: 0, male_count: 0, female_count: 0, grade_7_count: 0, grade_8_count: 0, grade_9_count: 0, grade_10_count: 0, grade_11_count: 0, grade_12_count: 0 }
        ])
        return
      }

      // Calculate balance for each team
      const teams = ['red', 'blue', 'green', 'yellow']
      const balance: TeamBalance[] = teams.map(team => {
        const teamRegistrations = Array.isArray(data) ? data.filter(r => r.current_team === team) : []

        return {
          team,
          total_count: teamRegistrations.length,
          male_count: teamRegistrations.filter(r => r.gender === 'male').length,
          female_count: teamRegistrations.filter(r => r.gender === 'female').length,
          grade_7_count: teamRegistrations.filter(r => r.grade === 7).length,
          grade_8_count: teamRegistrations.filter(r => r.grade === 8).length,
          grade_9_count: teamRegistrations.filter(r => r.grade === 9).length,
          grade_10_count: teamRegistrations.filter(r => r.grade === 10).length,
          grade_11_count: teamRegistrations.filter(r => r.grade === 11).length,
          grade_12_count: teamRegistrations.filter(r => r.grade === 12).length,
        }
      })

      if (!Array.isArray(balance)) {
        console.error('[useTeamBalance] balance calculation failed, resetting to default')
        setTeamBalance([
          { team: 'red', total_count: 0, male_count: 0, female_count: 0, grade_7_count: 0, grade_8_count: 0, grade_9_count: 0, grade_10_count: 0, grade_11_count: 0, grade_12_count: 0 },
          { team: 'blue', total_count: 0, male_count: 0, female_count: 0, grade_7_count: 0, grade_8_count: 0, grade_9_count: 0, grade_10_count: 0, grade_11_count: 0, grade_12_count: 0 },
          { team: 'green', total_count: 0, male_count: 0, female_count: 0, grade_7_count: 0, grade_8_count: 0, grade_9_count: 0, grade_10_count: 0, grade_11_count: 0, grade_12_count: 0 },
          { team: 'yellow', total_count: 0, male_count: 0, female_count: 0, grade_7_count: 0, grade_8_count: 0, grade_9_count: 0, grade_10_count: 0, grade_11_count: 0, grade_12_count: 0 }
        ])
      } else {
        setTeamBalance(balance)
      }
    } catch (error) {
      console.error('Error fetching team balance:', error)
    } finally {
      setLoading(false)
    }
  }, [currentCamp])

  useEffect(() => {
    if (!currentCamp) return

    fetchTeamBalance()

    // Subscribe to camp_registrations changes for this camp
    const channel = supabase
      .channel(`team-balance-${currentCamp.id}`)
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'camp_registrations',
          filter: `camp_id=eq.${currentCamp.id}`
        },
        () => {
          fetchTeamBalance()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchTeamBalance, currentCamp])

  return { teamBalance, loading }
}
