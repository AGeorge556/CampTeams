import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

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
  const [teamBalance, setTeamBalance] = useState<TeamBalance[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTeamBalance = async () => {
      try {
        const { data, error } = await supabase
          .rpc('get_team_balance')

        if (error) {
          console.error('Error fetching team balance:', error)
        } else {
          setTeamBalance(data || [])
        }
      } catch (error) {
        console.error('Error fetching team balance:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchTeamBalance()

    // Subscribe to profile changes to update balance in real-time
    const channel = supabase
      .channel('team-balance')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'profiles' }, 
        () => {
          fetchTeamBalance()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return { teamBalance, loading }
}