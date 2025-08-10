import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { TeamScore, ScoreEvent } from '../lib/types'
import { useProfile } from './useProfile'

export function useScoreboard() {
  const { profile } = useProfile()
  const [scores, setScores] = useState<TeamScore[]>([])
  const [events, setEvents] = useState<ScoreEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data: scoreRows, error: sErr } = await supabase
        .from('team_scores')
        .select('*')
        .order('points', { ascending: false })
      if (sErr) throw sErr

      const { data: eventRows, error: eErr } = await supabase
        .from('score_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)
      if (eErr) throw eErr

      setScores((scoreRows as TeamScore[]) || [])
      setEvents((eventRows as ScoreEvent[]) || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load scores')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    const channel = supabase
      .channel('scoreboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'team_scores' }, () => load())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'score_events' }, () => load())
      .subscribe()
    return () => {
      channel.unsubscribe()
    }
  }, [load])

  const adjustScore = async (team: TeamScore['team_id'], delta: number, reason?: string) => {
    if (!profile?.is_admin) {
      return { success: false, error: 'Admin access required' }
    }
    try {
      setUpdating(true)
      const { data, error } = await supabase.rpc('adjust_team_score', {
        team_id_param: team,
        delta_param: delta,
        reason_param: reason ?? null
      })
      if (error) throw error
      return { success: true, newPoints: data as number }
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Failed to adjust score' }
    } finally {
      setUpdating(false)
    }
  }

  return { scores, events, loading, updating, error, reload: load, adjustScore }
}
