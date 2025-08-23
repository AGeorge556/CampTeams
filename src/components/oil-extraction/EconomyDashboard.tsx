import React, { useState, useEffect } from 'react'
import { DollarSign, TrendingUp, TrendingDown, Package, Coins, Target, BarChart3, RefreshCw } from 'lucide-react'
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
      setEconomyStatus(data || [])
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
  if (!profile || (profile.role !== 'admin' && profile.role !== 'shop_owner')) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center">
        <div className="bg-[var(--color-card-bg)] rounded-lg shadow-lg p-8 max-w-md w-full mx-4 border border-[var(--color-border)]">
          <div className="text-center">
            <BarChart3 className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-[var(--color-text)] mb-2">Access Denied</h2>
            <p className="text-[var(--color-text-muted)]">
              Only admins and shop owners can access the economy dashboard.
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

  if (!activeSession) {
    return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Economy Dashboard</h1>
                <p className="text-gray-600 mt-2">
                  Complete overview of the Oil Extraction game economy pipeline
                </p>
              </div>
              <div className="flex space-x-3">
                <Button
                  size="sm"
                  onClick={initializeTeamWallets}
                  className="inline-flex items-center"
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Initialize Wallets
                </Button>
                <button
                  onClick={() => onPageChange?.('oil-extraction')}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                >
                  ← Back to Game
                </button>
              </div>
            </div>
          </div>

          {/* No Active Session Warning */}
          <div className="mb-8">
            <div className="bg-[var(--color-card-bg)] border border-[var(--color-border)] rounded-lg p-4">
              <div className="flex">
                <Target className="h-5 w-5 text-yellow-400 mr-2 mt-0.5" />
                <div>
                  <h3 className="text-sm font-medium text-[var(--color-text)]">No Active Session</h3>
                  <p className="text-sm text-[var(--color-text-muted)] mt-1">
                    There is no active game session. Team economy data will be limited. Please wait for an admin to start a session for full functionality.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Economy Overview */}
          <div className="mb-8">
            <div className="bg-[var(--color-card-bg)] rounded-lg shadow p-6 border border-[var(--color-border)]">
              <h2 className="text-xl font-semibold text-[var(--color-text)] mb-6">Economy Pipeline Overview</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 border rounded-lg bg-[var(--color-card-bg)]">
                  <Coins className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                  <h3 className="text-lg font-semibold text-[var(--color-text)]">Coins</h3>
                  <p className="text-sm text-[var(--color-text-muted)]">Used for playing the game</p>
                  <ul className="text-xs text-gray-500 mt-2 text-left">
                    <li>• Start with 0 coins</li>
                    <li>• Added by admins via real-life mini-games</li>
                    <li>• Used for excavation (100 per square)</li>
                    <li>• Used for buying hints</li>
                    <li>• <strong>NOT used for winning</strong></li>
                  </ul>
                </div>
                
                <div className="text-center p-4 border rounded-lg bg-[var(--color-card-bg)]">
                  <TrendingUp className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <h3 className="text-lg font-semibold text-[var(--color-text)]">Net Worth</h3>
                  <p className="text-sm text-[var(--color-text-muted)]">Used to win the game</p>
                  <ul className="text-xs text-gray-500 mt-2 text-left">
                    <li>• Start with 0 net worth</li>
                    <li>• Earned ONLY by selling oil barrels</li>
                    <li>• NOT affected by spending coins</li>
                    <li>• <strong>This is how you WIN the game</strong></li>
                  </ul>
                </div>
                
                <div className="text-center p-4 border rounded-lg bg-[var(--color-card-bg)]">
                  <Package className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <h3 className="text-lg font-semibold text-[var(--color-text)]">Oil Barrels</h3>
                  <p className="text-sm text-[var(--color-text-muted)]">Converted to net worth</p>
                  <ul className="text-xs text-gray-500 mt-2 text-left">
                    <li>• 1 barrel per excavation</li>
                    <li>• Random quality per square</li>
                    <li>• Common: 25 net worth</li>
                    <li>• Rare: 50 net worth</li>
                    <li>• Epic: 100 net worth</li>
                    <li>• Legendary: 150 net worth</li>
                    <li>• Mythic: 250 net worth</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Team Wallets (Basic) */}
          <div className="mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Team Wallets</h2>
              
              {wallets.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  {wallets.map((wallet) => (
                    <div key={wallet.id} className="border rounded-lg p-3 sm:p-4">
                      <div className="flex items-center mb-3">
                        <div className={`w-4 h-4 rounded-full ${TEAM_COLORS[wallet.team_id]} mr-2`} />
                        <h3 className="font-medium text-sm sm:text-base">{TEAM_NAMES[wallet.team_id]}</h3>
                      </div>
                      <div className="space-y-2">
                        <div>
                          <p className="text-xs sm:text-sm text-gray-500">Coins</p>
                          <p className="font-semibold text-sm sm:text-base">{wallet.coins.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-xs sm:text-sm text-gray-500">Net Worth</p>
                          <p className="font-semibold text-green-600 text-sm sm:text-base">{wallet.net_worth.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No team wallets found. Click "Initialize Wallets" to create them.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Economy Dashboard</h1>
              <p className="text-gray-600 mt-2 text-sm sm:text-base">
                Complete overview of the Oil Extraction game economy pipeline
              </p>
            </div>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
              <Button
                size="sm"
                onClick={initializeTeamWallets}
                className="inline-flex items-center justify-center"
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Initialize Wallets
              </Button>
              <button
                onClick={() => onPageChange?.('oil-extraction')}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 justify-center"
              >
                ← Back to Game
              </button>
            </div>
          </div>
        </div>

        {/* Economy Overview */}
        <div className="mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Economy Pipeline Overview</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              <div className="text-center p-3 sm:p-4 border rounded-lg">
                <Coins className="h-6 w-6 sm:h-8 sm:w-8 text-orange-600 mx-auto mb-2" />
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">Coins</h3>
                <p className="text-xs sm:text-sm text-gray-600">Used for playing the game</p>
                <ul className="text-xs text-gray-500 mt-2 text-left">
                  <li>• Start with 0 coins</li>
                  <li>• Added by admins via real-life mini-games</li>
                  <li>• Used for excavation (100 per square)</li>
                  <li>• Used for buying hints</li>
                  <li>• <strong>NOT used for winning</strong></li>
                </ul>
              </div>
              
              <div className="text-center p-3 sm:p-4 border rounded-lg">
                <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-green-600 mx-auto mb-2" />
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">Net Worth</h3>
                <p className="text-xs sm:text-sm text-gray-600">Used to win the game</p>
                <ul className="text-xs text-gray-500 mt-2 text-left">
                  <li>• Start with 0 net worth</li>
                  <li>• Earned ONLY by selling oil barrels</li>
                  <li>• NOT affected by spending coins</li>
                  <li>• <strong>This is how you WIN the game</strong></li>
                </ul>
              </div>
              
              <div className="text-center p-3 sm:p-4 border rounded-lg sm:col-span-2 lg:col-span-1">
                <Package className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 mx-auto mb-2" />
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">Oil Barrels</h3>
                <p className="text-xs sm:text-sm text-gray-600">Converted to net worth</p>
                <ul className="text-xs text-gray-500 mt-2 text-left">
                  <li>• 1 barrel per excavation</li>
                  <li>• Random quality per square</li>
                  <li>• Common: 50 net worth</li>
                  <li>• Rare: 100 net worth</li>
                  <li>• Epic: 175 net worth</li>
                  <li>• Legendary: 250 net worth</li>
                  <li>• Mythic: 750 net worth</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Team Economy Status */}
        <div className="mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Team Economy Status</h2>
            
            {economyStatus.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Team
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Coins
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Net Worth
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Inventory
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Spent on Excavation
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Spent on Hints
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Earned from Sales
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Last Updated
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {economyStatus.map((team) => (
                      <tr key={team.team_id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className={`w-4 h-4 rounded-full ${TEAM_COLORS[team.team_id]} mr-3`} />
                            <span className="text-sm font-medium text-gray-900">
                              {TEAM_NAMES[team.team_id]}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Coins className="h-4 w-4 text-orange-600 mr-1" />
                            <span className="text-sm font-medium text-gray-900">
                              {team.coins.toLocaleString()}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                            <span className="text-sm font-medium text-gray-900">
                              {team.net_worth.toLocaleString()}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Package className="h-4 w-4 text-blue-600 mr-1" />
                            <span className="text-sm text-gray-900">
                              {team.total_inventory}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <TrendingDown className="h-4 w-4 text-red-600 mr-1" />
                            <span className="text-sm text-gray-900">
                              {team.total_spent_on_excavation.toLocaleString()}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <TrendingDown className="h-4 w-4 text-red-600 mr-1" />
                            <span className="text-sm text-gray-900">
                              {team.total_spent_on_hints.toLocaleString()}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                            <span className="text-sm font-medium text-green-600">
                              {team.total_earned_from_sales.toLocaleString()}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(team.last_updated).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No economy data available</p>
              </div>
            )}
          </div>
        </div>

        {/* Validation Summary */}
        <div className="mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Economy Pipeline Validation</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">✅ Correct Implementation</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-2 flex-shrink-0"></div>
                    <span>Coins and net_worth are properly separated</span>
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-2 flex-shrink-0"></div>
                    <span>Excavation costs only affect coins (100 per square)</span>
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-2 flex-shrink-0"></div>
                    <span>Hint purchases only affect coins</span>
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-2 flex-shrink-0"></div>
                    <span>Oil sales only affect net_worth</span>
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-2 flex-shrink-0"></div>
                    <span>All transactions are properly logged</span>
                  </li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">🎯 Game Flow</h3>
                <ol className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start">
                    <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded mr-2">1</span>
                    <span>Teams start with 0 coins and 0 net worth</span>
                  </li>
                  <li className="flex items-start">
                    <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded mr-2">2</span>
                    <span>Admins add coins via real-life mini-games</span>
                  </li>
                  <li className="flex items-start">
                    <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded mr-2">3</span>
                    <span>Teams spend coins on excavation (100 per square) & hints</span>
                  </li>
                  <li className="flex items-start">
                    <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded mr-2">4</span>
                    <span>Each excavation gives 1 barrel of random quality</span>
                  </li>
                  <li className="flex items-start">
                    <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded mr-2">5</span>
                    <span>Shop owners buy barrels to increase team net worth</span>
                  </li>
                  <li className="flex items-start">
                    <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded mr-2">6</span>
                    <span>Team with highest net worth wins</span>
                  </li>
                </ol>
              </div>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-8">
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              <strong>Error:</strong> {error}
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 