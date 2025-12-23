import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { TeamScore, ScoreEvent } from '../lib/types'
import { useProfile } from './useProfile'
import { useCamp } from '../contexts/CampContext'

export function useScoreboard() {
  const { profile } = useProfile()
  const { currentCamp } = useCamp()
  const [scores, setScores] = useState<TeamScore[]>([])
  const [events, setEvents] = useState<ScoreEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!currentCamp) return

    setLoading(true)
    setError(null)
    try {
      const { data: scoreRows, error: sErr } = await supabase
        .from('camp_scoreboard')
        .select('*')
        .eq('camp_id', currentCamp.id)
        .order('score', { ascending: false })
      if (sErr) throw sErr

      // Map camp_scoreboard to TeamScore format
      const safeScoreRows = Array.isArray(scoreRows) ? scoreRows : []
      const mappedScores = safeScoreRows.map(row => ({
        team_id: row.team,
        points: row.score,
        updated_at: row.updated_at
      }))

      // Ensure we always set an array
      if (!Array.isArray(mappedScores)) {
        console.error('[useScoreboard] mappedScores is not an array, resetting to empty')
        setScores([])
      } else {
        setScores(mappedScores as TeamScore[])
      }
      // Note: score_events would need a camp-specific table too if needed
      // For now, we'll leave events empty for camp-specific scoreboards
      setEvents([])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load scores')
    } finally {
      setLoading(false)
    }
  }, [currentCamp])

  useEffect(() => {
    if (!currentCamp) return

    load()
    const channel = supabase
      .channel(`camp_scoreboard_${currentCamp.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'camp_scoreboard',
        filter: `camp_id=eq.${currentCamp.id}`
      }, () => load())
      .subscribe()
    return () => {
      channel.unsubscribe()
    }
  }, [load, currentCamp])

  const adjustScore = async (team: TeamScore['team_id'], delta: number, reason?: string) => {
    if (!profile?.is_admin || !currentCamp) {
      return { success: false, error: 'Admin access required or camp not selected' }
    }
    try {
      setUpdating(true)

      // Get current score for this team
      const { data: currentScore, error: fetchError } = await supabase
        .from('camp_scoreboard')
        .select('score')
        .eq('camp_id', currentCamp.id)
        .eq('team', team)
        .single()

      if (fetchError && fetchError.code !== 'PGRST116') throw fetchError

      const newScore = (currentScore?.score || 0) + delta

      // Update or insert the score
      const { error: upsertError } = await supabase
        .from('camp_scoreboard')
        .upsert({
          camp_id: currentCamp.id,
          team: team,
          score: Math.max(0, newScore), // Don't allow negative scores
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'camp_id,team'
        })

      if (upsertError) throw upsertError

      return { success: true, newPoints: Math.max(0, newScore) }
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Failed to adjust score' }
    } finally {
      setUpdating(false)
    }
  }

  return { scores, events, loading, updating, error, reload: load, adjustScore }
}
