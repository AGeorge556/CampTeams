import { useEffect, useState } from 'react'
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

  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .not('current_team', 'is', null)
          .order('full_name')

        if (error) {
          console.error('Error fetching players:', error)
        } else {
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
        }
      } catch (error) {
        console.error('Error fetching players:', error)
      } finally {
        setLoading(false)
      }
    }

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
  }, [])

  return { players, loading }
} 