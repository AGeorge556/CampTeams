import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { GameSession } from '../lib/types'

export function useGameSessions() {
  const [sessions, setSessions] = useState<GameSession[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadSessions()
    subscribeToSessions()
  }, [])

  const loadSessions = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('game_sessions')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setSessions(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sessions')
    } finally {
      setLoading(false)
    }
  }

  const subscribeToSessions = () => {
    const subscription = supabase
      .channel('game_sessions_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'game_sessions'
        },
        () => {
          loadSessions()
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }

  const createSession = async (startTime: string, endTime: string) => {
    try {
      const { data, error } = await supabase
        .from('game_sessions')
        .insert({
          start_time: startTime,
          end_time: endTime,
          is_active: false
        })
        .select()
        .single()

      if (error) throw error
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create session')
      throw err
    }
  }

  const startSession = async (sessionId: string) => {
    try {
      // First, deactivate all other sessions
      await supabase
        .from('game_sessions')
        .update({ is_active: false })
        .neq('id', sessionId)

      // Then activate the selected session
      const { data, error } = await supabase
        .from('game_sessions')
        .update({ is_active: true })
        .eq('id', sessionId)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start session')
      throw err
    }
  }

  const stopSession = async (sessionId: string) => {
    try {
      const { data, error } = await supabase
        .from('game_sessions')
        .update({ is_active: false })
        .eq('id', sessionId)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to stop session')
      throw err
    }
  }

  const deleteSession = async (sessionId: string) => {
    try {
      const { error } = await supabase
        .from('game_sessions')
        .delete()
        .eq('id', sessionId)

      if (error) throw error
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete session')
      throw err
    }
  }

  const getActiveSession = () => {
    return sessions.find(session => session.is_active)
  }

  return {
    sessions,
    loading,
    error,
    createSession,
    startSession,
    stopSession,
    deleteSession,
    getActiveSession,
    refresh: loadSessions
  }
} 