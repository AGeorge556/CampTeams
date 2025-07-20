import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { OilSaleWithOwner, OilPurchaseResult, ShopStatistics } from '../lib/types'
import { useProfile } from './useProfile'

export function useOilSales(sessionId?: string) {
  const { profile } = useProfile()
  const [salesHistory, setSalesHistory] = useState<OilSaleWithOwner[]>([])
  const [statistics, setStatistics] = useState<ShopStatistics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [purchasing, setPurchasing] = useState<{
    teamId: string
    quality: string
    quantity: number
  } | null>(null)

  useEffect(() => {
    if (sessionId) {
      loadSalesHistory()
      loadStatistics()
      subscribeToSales()
    }
  }, [sessionId])

  const loadSalesHistory = async () => {
    if (!sessionId) return
    
    try {
      setLoading(true)
      const { data, error } = await supabase
        .rpc('get_oil_sales_history', { session_id_param: sessionId })

      if (error) throw error
      setSalesHistory(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sales history')
    } finally {
      setLoading(false)
    }
  }

  const loadStatistics = async () => {
    if (!sessionId) return
    
    try {
      const { data, error } = await supabase
        .rpc('get_shop_statistics', { session_id_param: sessionId })

      if (error) throw error
      
      if (data && data.length > 0) {
        const stats = data[0]
        setStatistics({
          total_sales: stats.total_sales,
          total_revenue: stats.total_revenue,
          sales_by_quality: stats.sales_by_quality as any || {},
          top_selling_team: stats.top_selling_team,
          top_selling_team_amount: stats.top_selling_team_amount
        })
      }
    } catch (err) {
      console.error('Failed to load shop statistics:', err)
    }
  }

  const subscribeToSales = () => {
    if (!sessionId) return

    const subscription = supabase
      .channel('oil_sales_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'oil_sales',
          filter: `session_id=eq.${sessionId}`
        },
        () => {
          loadSalesHistory()
          loadStatistics()
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }

  const buyOilFromTeam = async (
    teamId: string, 
    quality: string, 
    quantity: number
  ): Promise<OilPurchaseResult> => {
    if (!sessionId) {
      return { success: false, error: 'No active session' }
    }

    if (!profile || profile.role !== 'shop_owner') {
      return { success: false, error: 'Only shop owners can buy oil' }
    }

    setPurchasing({ teamId, quality, quantity })

    try {
      const { data, error } = await supabase
        .rpc('buy_oil_from_team', {
          team_id_param: teamId,
          quality_param: quality,
          quantity_param: quantity,
          session_id_param: sessionId
        })

      if (error) {
        return { success: false, error: error.message }
      }

      return {
        success: true,
        quantity_sold: data.quantity_sold,
        quality: data.quality as any,
        price_per_barrel: data.price_per_barrel,
        total_amount: data.total_amount,
        remaining_inventory: data.remaining_inventory
      }
    } catch (err) {
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Failed to purchase oil' 
      }
    } finally {
      setPurchasing(null)
    }
  }

  const getSalesByTeam = (teamId: string): OilSaleWithOwner[] => {
    return salesHistory.filter(sale => sale.team_id === teamId)
  }

  const getSalesByQuality = (quality: string): OilSaleWithOwner[] => {
    return salesHistory.filter(sale => sale.quality === quality)
  }

  const getTotalRevenue = (): number => {
    return salesHistory.reduce((total, sale) => total + sale.total_amount, 0)
  }

  const getTotalSales = (): number => {
    return salesHistory.reduce((total, sale) => total + sale.quantity, 0)
  }

  return {
    salesHistory,
    statistics,
    loading,
    error,
    purchasing,
    buyOilFromTeam,
    getSalesByTeam,
    getSalesByQuality,
    getTotalRevenue,
    getTotalSales,
    refresh: () => {
      loadSalesHistory()
      loadStatistics()
    }
  }
} 