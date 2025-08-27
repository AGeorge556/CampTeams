import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { OilGridSquare, OilInventoryItem, TeamInventorySummary, MarkingResult, TeamScore, RevealResult } from '../lib/types'
import { useProfile } from './useProfile'

export function useOilExcavation(sessionId?: string) {
  const { profile } = useProfile()
  const [grid, setGrid] = useState<OilGridSquare[]>([])
  const [teamInventory, setTeamInventory] = useState<OilInventoryItem[]>([])
  const [allTeamsInventory, setAllTeamsInventory] = useState<TeamInventorySummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [marking, setMarking] = useState<number | null>(null)

  useEffect(() => {
    if (sessionId) {
      loadGrid()
      loadTeamInventory()
      loadAllTeamsInventory()
      subscribeToGrid()
      subscribeToInventory()
    }
  }, [sessionId])

  const loadGrid = async () => {
    if (!sessionId) return
    
    try {
      setLoading(true)
      const { data, error } = await supabase
        .rpc('get_oil_grid_with_marks', { session_id_param: sessionId })

      if (error) throw error
      setGrid(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load grid')
    } finally {
      setLoading(false)
    }
  }

  const loadTeamInventory = async () => {
    if (!sessionId || !profile?.current_team) return
    
    try {
      const { data, error } = await supabase
        .rpc('get_team_inventory', { 
          team_id_param: profile.current_team, 
          session_id_param: sessionId 
        })

      if (error) throw error
      setTeamInventory(data || [])
    } catch (err) {
      console.error('Failed to load team inventory:', err)
    }
  }

  const loadAllTeamsInventory = async () => {
    if (!sessionId) return
    
    try {
      const { data, error } = await supabase
        .rpc('get_all_teams_inventory', { session_id_param: sessionId })

      if (error) throw error
      setAllTeamsInventory(data || [])
    } catch (err) {
      console.error('Failed to load all teams inventory:', err)
    }
  }

  const subscribeToGrid = () => {
    if (!sessionId) return

    const subscription = supabase
      .channel('oil_grid_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'oil_grid',
          filter: `session_id=eq.${sessionId}`
        },
        () => {
          loadGrid()
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'team_marks',
          filter: `session_id=eq.${sessionId}`
        },
        () => {
          loadGrid()
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }

  const subscribeToInventory = () => {
    if (!sessionId) return

    const subscription = supabase
      .channel('oil_inventory_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'oil_inventory',
          filter: `session_id=eq.${sessionId}`
        },
        () => {
          loadTeamInventory()
          loadAllTeamsInventory()
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }

  const markSquare = async (squareId: number): Promise<MarkingResult> => {
    if (!sessionId) {
      return { success: false, error: 'No active session' }
    }

    if (!profile?.current_team) {
      return { success: false, error: 'You are not assigned to a team' }
    }

    if (profile.role !== 'team_leader') {
      return { success: false, error: 'Only team leaders can mark squares' }
    }

    setMarking(squareId)

    try {
      const { data, error } = await supabase
        .rpc('mark_square', {
          square_id_param: squareId,
          session_id_param: sessionId
        })

      if (error) {
        return { success: false, error: error.message }
      }

      return {
        success: true,
        message: data.message || 'Square marked successfully'
      }
    } catch (err) {
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Failed to mark square' 
      }
    } finally {
      setMarking(null)
    }
  }

  const unmarkSquare = async (squareId: number): Promise<MarkingResult> => {
    if (!sessionId) {
      return { success: false, error: 'No active session' }
    }

    if (!profile?.current_team) {
      return { success: false, error: 'You are not assigned to a team' }
    }

    if (profile.role !== 'team_leader') {
      return { success: false, error: 'Only team leaders can unmark squares' }
    }

    setMarking(squareId)

    try {
      const { data, error } = await supabase
        .rpc('unmark_square', {
          square_id_param: squareId,
          session_id_param: sessionId
        })

      if (error) {
        return { success: false, error: error.message }
      }

      return {
        success: true,
        message: data.message || 'Square unmarked successfully'
      }
    } catch (err) {
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Failed to unmark square' 
      }
    } finally {
      setMarking(null)
    }
  }

  const revealAllMarks = async (): Promise<RevealResult> => {
    if (!sessionId) {
      return { success: false, error: 'No active session' }
    }

    if (!profile?.is_admin) {
      return { success: false, error: 'Only admins can reveal marks' }
    }

    try {
      const { data, error } = await supabase
        .rpc('reveal_all_marks', { session_id_param: sessionId })

      if (error) {
        return { success: false, error: error.message }
      }

      return {
        success: true,
        message: data.message || 'Marks revealed successfully',
        scores: data.scores || []
      }
    } catch (err) {
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Failed to reveal marks' 
      }
    }
  }

  const canMark = (squareId: number): boolean => {
    if (!profile?.current_team || profile.role !== 'team_leader') return false
    
    const square = grid.find(s => s.square_id === squareId)
    if (!square) return false
    
    // Check if square is already marked by any team
    if (square.marked_by_team) return false
    
    return true
  }

  const canUnmark = (squareId: number): boolean => {
    if (!profile?.current_team || profile.role !== 'team_leader') return false
    
    const square = grid.find(s => s.square_id === squareId)
    if (!square) return false
    
    // Check if square is marked by current team
    return square.marked_by_team === profile.current_team
  }

  const getSquareByPosition = (row: number, col: number): OilGridSquare | null => {
    const squareId = row * 6 + col + 1
    return grid.find(s => s.square_id === squareId) || null
  }

  const getTeamInventorySummary = (teamId: string): TeamInventorySummary | null => {
    return allTeamsInventory.find(t => t.team_id === teamId) || null
  }

  return {
    grid,
    teamInventory,
    allTeamsInventory,
    loading,
    error,
    marking,
    markSquare,
    unmarkSquare,
    revealAllMarks,
    canMark,
    canUnmark,
    getSquareByPosition,
    getTeamInventorySummary,
    refresh: () => {
      loadGrid()
      loadTeamInventory()
      loadAllTeamsInventory()
    }
  }
} 