import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { CoinTransactionWithAdmin } from '../lib/types'

export function useCoinTransactions() {
  const [transactions, setTransactions] = useState<CoinTransactionWithAdmin[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadTransactions()
    subscribeToTransactions()
  }, [])

  const loadTransactions = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .rpc('get_coin_transactions_with_admin')

      if (error) throw error
      setTransactions(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load transactions')
    } finally {
      setLoading(false)
    }
  }

  const subscribeToTransactions = () => {
    const subscription = supabase
      .channel('coin_transactions_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'coin_transactions'
        },
        () => {
          loadTransactions()
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }

  const addCoinsToTeam = async (
    teamId: string,
    amount: number,
    description?: string
  ) => {
    try {
      const { error } = await supabase
        .rpc('add_coins_to_team', {
          team_id_param: teamId,
          amount_param: amount,
          description_param: description
        })

      if (error) throw error
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add coins')
      throw err
    }
  }

  const formatTransactionDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  return {
    transactions,
    loading,
    error,
    addCoinsToTeam,
    formatTransactionDate,
    refresh: loadTransactions
  }
} 