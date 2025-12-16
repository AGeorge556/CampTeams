import React, { useState, useEffect } from 'react'
import { DollarSign, TrendingUp, TrendingDown, Package, Coins, Target, BarChart3, RefreshCw, Users, Activity } from 'lucide-react'
import { useProfile } from '../../hooks/useProfile'
import { useGameSessions } from '../../hooks/useGameSessions'
import { useTeamWallets } from '../../hooks/useTeamWallets'
import { supabase } from '../../lib/supabase'
import { TEAM_NAMES, TEAM_COLORS } from '../../lib/types'
import Button from '../ui/Button'
import LoadingSpinner from '../LoadingSpinner'

interface EconomyStatus {
  team_id: 'red' | 'blue' | 'green' | 'yellow'
  coins: number
  net_worth: number
  total_inventory: number
  total_spent_on_excavation: number
  total_spent_on_hints: number
  total_earned_from_sales: number
  last_updated: string
}

interface EconomyDashboardProps {
  onPageChange?: (page: string) => void
}

export default function EconomyDashboard({ onPageChange }: EconomyDashboardProps) {
  const { profile } = useProfile()
  const { getActiveSession, loading: sessionsLoading } = useGameSessions()
  const activeSession = getActiveSession()
  const { wallets, loading: walletsLoading } = useTeamWallets()
  const [economyStatus, setEconomyStatus] = useState<EconomyStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    console.log('EconomyDashboard useEffect - activeSession:', activeSession)
    if (activeSession?.id) {
      loadEconomyStatus()
    } else {
      // If no active session, still set loading to false
      setLoading(false)
    }
  }, [activeSession?.id])

  const loadEconomyStatus = async () => {
    if (!activeSession?.id) return
    
    try {
      setLoading(true)
      const { data, error } = await supabase
        .rpc('get_team_economy_status', { session_id_param: activeSession.id })

      if (error) throw error
      setEconomyStatus(
        (data || []).map((item: { team_id: string }) => ({
          ...item,
          team_id: item.team_id as 'red' | 'blue' | 'green' | 'yellow',
        }))
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load economy status')
    } finally {
      setLoading(false)
    }
  }

  const initializeTeamWallets = async () => {
    try {
      const { error } = await supabase.rpc('initialize_team_wallets')
      if (error) throw error
      
      // Refresh the data
      await loadEconomyStatus()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize team wallets')
    }
  }

  // Check if user has admin access
  if (!profile?.is_admin) {
    return (
      <div className="min-h-screen bg-[var(--gradient-app-bg)] flex items-center justify-center">
        <div className="bg-[var(--color-card-bg)] rounded-lg shadow-lg p-8 max-w-md w-full mx-4 border border-[var(--color-border)]">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-[var(--color-text)] mb-2">Access Denied</h2>
            <p className="text-[var(--color-text-muted)]">
              You need admin privileges to access this page.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Debug logging
  console.log('EconomyDashboard render - loading:', loading, 'walletsLoading:', walletsLoading, 'sessionsLoading:', sessionsLoading, 'activeSession:', activeSession)
  
  if (loading || walletsLoading || sessionsLoading) {
    return <LoadingSpinner text="Loading economy dashboard..." />
  }

  // Calculate summary stats
  const totalMarketCap = economyStatus.reduce((sum, team) => sum + team.coins, 0)
  const totalNetWorth = economyStatus.reduce((sum, team) => sum + team.net_worth, 0)
  const activePlayers = economyStatus.filter(team => team.coins > 0).length
  const totalTransactions = economyStatus.reduce((sum, team) => 
    sum + team.total_spent_on_excavation + team.total_spent_on_hints + team.total_earned_from_sales, 0
  )

  return (
    <div className="min-h-screen bg-[var(--gradient-app-bg)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <button
            onClick={() => onPageChange?.('oil-extraction')}
            className="inline-flex items-center px-4 py-2 border border-[var(--color-border)] text-sm font-medium rounded-md text-[var(--color-text)] bg-[var(--color-bg)] hover:bg-[var(--color-bg-muted)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
          >
            ← Back to Game
          </button>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[var(--color-text)]">Economy Dashboard</h1>
          <p className="text-[var(--color-text-muted)] mt-2">
            Monitor the oil extraction game economy and team performance.
          </p>
        </div>

        {/* Economy Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-[var(--color-card-bg)] rounded-lg p-6 border border-[var(--color-border)]">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-[var(--color-text-muted)]">Total Market Cap</p>
                <p className="text-2xl font-bold text-[var(--color-text)]">${totalMarketCap.toLocaleString()}</p>
              </div>
            </div>
            <div className="mt-4">
              <ul className="text-xs text-[var(--color-text-muted)] mt-2 text-left">
                <li>• Total coins in circulation</li>
                <li>• Based on current oil prices</li>
              </ul>
            </div>
          </div>

          <div className="bg-[var(--color-card-bg)] rounded-lg p-6 border border-[var(--color-border)]">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-[var(--color-text-muted)]">Total Net Worth</p>
                <p className="text-2xl font-bold text-[var(--color-text)]">${totalNetWorth.toLocaleString()}</p>
              </div>
            </div>
            <div className="mt-4">
              <ul className="text-xs text-[var(--color-text-muted)] mt-2 text-left">
                <li>• Total team net worth</li>
                <li>• From oil sales</li>
              </ul>
            </div>
          </div>

          <div className="bg-[var(--color-card-bg)] rounded-lg p-6 border border-[var(--color-border)]">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-[var(--color-text-muted)]">Active Players</p>
                <p className="text-2xl font-bold text-[var(--color-text)]">{activePlayers}</p>
              </div>
            </div>
            <div className="mt-4">
              <ul className="text-xs text-[var(--color-text-muted)] mt-2 text-left">
                <li>• Teams with coins</li>
                <li>• Participating in economy</li>
              </ul>
            </div>
          </div>

          <div className="bg-[var(--color-card-bg)] rounded-lg p-6 border border-[var(--color-border)]">
            <div className="flex items-center">
              <div className="p-2 bg-sky-100 rounded-lg">
                <Activity className="h-6 w-6 text-sky-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-[var(--color-text-muted)]">Total Transactions</p>
                <p className="text-2xl font-bold text-[var(--color-text)]">{totalTransactions}</p>
              </div>
            </div>
            <div className="mt-4">
              <ul className="text-xs text-[var(--color-text-muted)] mt-2 text-left">
                <li>• All time transactions</li>
                <li>• Economic activity</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Team Wallets */}
        <div className="bg-[var(--color-card-bg)] rounded-lg shadow p-6 border border-[var(--color-border)]">
          <h2 className="text-xl font-semibold text-[var(--color-text)] mb-6">Team Wallets</h2>
          
          {wallets.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {wallets.map((wallet) => {
                const teamName = TEAM_NAMES[wallet.team_id as keyof typeof TEAM_NAMES]
                const teamColor = TEAM_COLORS[wallet.team_id as keyof typeof TEAM_COLORS]
                return (
                  <div key={wallet.team_id} className="bg-[var(--color-bg-muted)] rounded-lg p-4 border border-[var(--color-border)]">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-[var(--color-text)]">{teamName}</h3>
                      <div className={`w-4 h-4 rounded-full ${teamColor}`}></div>
                    </div>
                    <div className="space-y-2">
                      <div>
                        <p className="text-xs sm:text-sm text-[var(--color-text-muted)]">Coins</p>
                        <p className="font-bold text-[var(--color-text)]">{wallet.coins.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm text-[var(--color-text-muted)]">Net Worth</p>
                        <p className="font-bold text-green-600">${wallet.net_worth.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-[var(--color-text-muted)]">No team wallets found. Click "Initialize Wallets" to create them.</p>
            </div>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="mt-8">
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              <strong>Error:</strong> {error}
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 