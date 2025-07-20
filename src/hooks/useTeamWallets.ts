import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { TeamWallet, OilTransaction, GameLeaderboardEntry, TeamWalletWithTransactions } from '../lib/types'
import { useProfile } from './useProfile'

export function useTeamWallets() {
  const [wallets, setWallets] = useState<TeamWallet[]>([])
  const [leaderboard, setLeaderboard] = useState<GameLeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { profile } = useProfile()

  useEffect(() => {
    loadWallets()
    loadLeaderboard()
    subscribeToWallets()
  }, [])

  const loadWallets = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('team_wallets')
        .select('*')
        .order('team_id')

      if (error) throw error
      setWallets(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load wallets')
    } finally {
      setLoading(false)
    }
  }

  const loadLeaderboard = async () => {
    try {
      const { data, error } = await supabase
        .rpc('get_game_leaderboard')

      if (error) throw error
      setLeaderboard(data || [])
    } catch (err) {
      console.error('Failed to load leaderboard:', err)
    }
  }

  const subscribeToWallets = () => {
    const subscription = supabase
      .channel('team_wallets_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'team_wallets'
        },
        () => {
          loadWallets()
          loadLeaderboard()
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }

  const getTeamWallet = async (teamId: string): Promise<TeamWalletWithTransactions | null> => {
    try {
      const { data, error } = await supabase
        .rpc('get_team_wallet_with_transactions', { team_id_param: teamId })

      if (error) throw error
      
      if (data && data.length > 0) {
        const walletData = data[0]
        return {
          id: walletData.wallet_id,
          team_id: walletData.team_id as 'red' | 'blue' | 'green' | 'yellow',
          coins: walletData.coins,
          net_worth: walletData.net_worth,
          updated_at: walletData.updated_at,
          transactions: walletData.transactions as OilTransaction[]
        }
      }
      
      return null
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load team wallet')
      return null
    }
  }

  const updateWallet = async (
    teamId: string,
    coinsChange: number,
    netWorthChange: number,
    transactionType: OilTransaction['transaction_type'],
    description?: string
  ) => {
    try {
      const { error } = await supabase
        .rpc('update_team_wallet', {
          team_id_param: teamId,
          coins_change: coinsChange,
          net_worth_change: netWorthChange,
          transaction_type_param: transactionType,
          description_param: description
        })

      if (error) throw error
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update wallet')
      throw err
    }
  }

  const canAccessTeamWallet = (teamId: string): boolean => {
    if (!profile) return false
    
    // Admins can access all wallets
    if (profile.is_admin || profile.role === 'admin') return true
    
    // Shop owners can access all wallets
    if (profile.role === 'shop_owner') return true
    
    // Team leaders can only access their own team's wallet
    if (profile.role === 'team_leader' && profile.current_team === teamId) return true
    
    return false
  }

  const getAccessibleWallets = (): TeamWallet[] => {
    if (!profile) return []
    
    // Admins and shop owners can see all wallets
    if (profile.is_admin || profile.role === 'admin' || profile.role === 'shop_owner') {
      return wallets
    }
    
    // Team leaders can only see their own team's wallet
    if (profile.role === 'team_leader' && profile.current_team) {
      return wallets.filter(wallet => wallet.team_id === profile.current_team)
    }
    
    return []
  }

  return {
    wallets,
    leaderboard,
    loading,
    error,
    getTeamWallet,
    updateWallet,
    canAccessTeamWallet,
    getAccessibleWallets,
    refresh: () => {
      loadWallets()
      loadLeaderboard()
    }
  }
} 