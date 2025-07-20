import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { OilHintWithPurchaseStatus, HintPurchaseResult, HintAnalytics, CreateHintResult } from '../lib/types'
import { useProfile } from './useProfile'

export function useOilHints(sessionId?: string) {
  const { profile } = useProfile()
  const [hints, setHints] = useState<OilHintWithPurchaseStatus[]>([])
  const [analytics, setAnalytics] = useState<HintAnalytics[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [purchasing, setPurchasing] = useState<string | null>(null)

  useEffect(() => {
    if (sessionId && profile?.current_team) {
      loadHints()
      if (profile.role === 'shop_owner') {
        loadAnalytics()
      }
      subscribeToHints()
    }
  }, [sessionId, profile?.current_team, profile?.role])

  const loadHints = async () => {
    if (!sessionId || !profile?.current_team) return
    
    try {
      setLoading(true)
      const { data, error } = await supabase
        .rpc('get_available_hints_for_team', { 
          team_id_param: profile.current_team, 
          session_id_param: sessionId 
        })

      if (error) throw error
      setHints(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load hints')
    } finally {
      setLoading(false)
    }
  }

  const loadAnalytics = async () => {
    if (!sessionId) return
    
    try {
      const { data, error } = await supabase
        .rpc('get_hint_analytics', { session_id_param: sessionId })

      if (error) throw error
      setAnalytics(data || [])
    } catch (err) {
      console.error('Failed to load hint analytics:', err)
    }
  }

  const subscribeToHints = () => {
    if (!sessionId) return

    const subscription = supabase
      .channel('oil_hints_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'oil_hints',
          filter: `session_id=eq.${sessionId}`
        },
        () => {
          loadHints()
          if (profile?.role === 'shop_owner') {
            loadAnalytics()
          }
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }

  const purchaseHint = async (hintId: string): Promise<HintPurchaseResult> => {
    if (!sessionId) {
      return { success: false, error: 'No active session' }
    }

    if (!profile?.current_team) {
      return { success: false, error: 'You are not assigned to a team' }
    }

    if (profile.role !== 'team_leader') {
      return { success: false, error: 'Only team leaders can purchase hints' }
    }

    setPurchasing(hintId)

    try {
      const { data, error } = await supabase
        .rpc('purchase_hint', {
          hint_id_param: hintId,
          session_id_param: sessionId
        })

      if (error) {
        return { success: false, error: error.message }
      }

      return {
        success: true,
        hint_text: data.hint_text,
        cost: data.cost,
        remaining_coins: data.remaining_coins
      }
    } catch (err) {
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Failed to purchase hint' 
      }
    } finally {
      setPurchasing(null)
    }
  }

  const createHint = async (
    hintText: string,
    qualityHintFor: string,
    cost: number
  ): Promise<CreateHintResult> => {
    if (!sessionId) {
      return { success: false, error: 'No active session' }
    }

    if (profile?.role !== 'shop_owner') {
      return { success: false, error: 'Only shop owners can create hints' }
    }

    try {
      const { data, error } = await supabase
        .rpc('create_hint', {
          hint_text_param: hintText,
          quality_hint_for_param: qualityHintFor,
          cost_param: cost,
          session_id_param: sessionId
        })

      if (error) {
        return { success: false, error: error.message }
      }

      return {
        success: true,
        hint_id: data.hint_id,
        message: data.message
      }
    } catch (err) {
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Failed to create hint' 
      }
    }
  }

  const getAvailableHints = (): OilHintWithPurchaseStatus[] => {
    return hints.filter(hint => !hint.is_purchased)
  }

  const getPurchasedHints = (): OilHintWithPurchaseStatus[] => {
    return hints.filter(hint => hint.is_purchased)
  }

  const isPurchasing = (hintId: string): boolean => {
    return purchasing === hintId
  }

  return {
    hints,
    analytics,
    loading,
    error,
    purchasing,
    purchaseHint,
    createHint,
    getAvailableHints,
    getPurchasedHints,
    isPurchasing,
    refresh: () => {
      loadHints()
      if (profile?.role === 'shop_owner') {
        loadAnalytics()
      }
    }
  }
} 