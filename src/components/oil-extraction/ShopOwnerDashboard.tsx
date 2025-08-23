import React, { useState } from 'react'
import { ShoppingCart, DollarSign, TrendingUp, Package } from 'lucide-react'
import { useTeamWallets } from '../../hooks/useTeamWallets'
import { useGameSessions } from '../../hooks/useGameSessions'
import { TeamWallet, GameLeaderboardEntry, OilTransaction } from '../../lib/types'
import { TEAM_NAMES, TEAM_COLORS, TRANSACTION_TYPE_LABELS, TRANSACTION_TYPE_COLORS } from '../../lib/types'
import Button from '../ui/Button'
import LoadingSpinner from '../LoadingSpinner'

export default function ShopOwnerDashboard() {
  const { wallets, leaderboard, loading: walletsLoading, updateWallet } = useTeamWallets()
  const { getActiveSession } = useGameSessions()
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null)
  const [purchaseAmount, setPurchaseAmount] = useState('')
  const [saleAmount, setSaleAmount] = useState('')

  const activeSession = getActiveSession()

  const handlePurchase = async (teamId: string, amount: number) => {
    try {
      await updateWallet(teamId, -amount, -amount, 'purchase', `Equipment purchase: ${amount} coins`)
      setPurchaseAmount('')
    } catch (error) {
      console.error('Failed to process purchase:', error)
    }
  }

  const handleSale = async (teamId: string, amount: number) => {
    try {
      await updateWallet(teamId, amount, amount, 'sell', `Oil sale: ${amount} coins`)
      setSaleAmount('')
    } catch (error) {
      console.error('Failed to process sale:', error)
    }
  }

  if (walletsLoading) {
    return <LoadingSpinner text="Loading shop dashboard..." />
  }

  return (
    <div className="space-y-8">
      {/* Game Status */}
      <div className="bg-[var(--color-card-bg)] rounded-lg shadow p-6 border border-[var(--color-border)]">
        <h2 className="text-xl font-semibold text-[var(--color-text)] mb-4">Game Status</h2>
        {activeSession ? (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-3 animate-pulse" />
              <div>
                <h3 className="font-medium text-[var(--color-text)]">Game Active</h3>
                <p className="text-sm text-[var(--color-text-muted)]">
                  Session ends: {new Date(activeSession.end_time).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-[var(--color-card-bg)] border border-[var(--color-border)] rounded-lg">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-[var(--color-accent-muted)] rounded-full mr-3" />
              <div>
                <h3 className="font-medium text-[var(--color-text)]">Game Inactive</h3>
                <p className="text-sm text-[var(--color-text-muted)]">No active game session</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Shop Management */}
      <div className="bg-[var(--color-card-bg)] rounded-lg shadow p-6 border border-[var(--color-border)]">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Shop Management</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Team Wallets */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Team Wallets</h3>
            <div className="space-y-3">
              {wallets.map((wallet) => (
                <div key={wallet.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      <div className={`w-4 h-4 rounded-full ${TEAM_COLORS[wallet.team_id]} mr-2`} />
                      <h4 className="font-medium">{TEAM_NAMES[wallet.team_id]}</h4>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => setSelectedTeam(selectedTeam === wallet.team_id ? null : wallet.team_id)}
                    >
                      {selectedTeam === wallet.team_id ? 'Hide' : 'Manage'}
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Coins</p>
                      <p className="font-semibold">{wallet.coins.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Net Worth</p>
                      <p className="font-semibold text-green-600">{wallet.net_worth.toLocaleString()}</p>
                    </div>
                  </div>
                  
                  {/* Shop Actions */}
                  {selectedTeam === wallet.team_id && (
                    <div className="mt-4 pt-4 border-t space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Equipment Purchase (coins)
                        </label>
                        <div className="flex space-x-2">
                          <input
                            type="number"
                            value={purchaseAmount}
                            onChange={(e) => setPurchaseAmount(e.target.value)}
                            className="flex-1 border rounded-md px-3 py-2 text-sm"
                            placeholder="Amount"
                            min="1"
                            max={wallet.coins}
                          />
                          <Button 
                            size="sm"
                            onClick={() => handlePurchase(wallet.team_id, parseInt(purchaseAmount) || 0)}
                            disabled={!purchaseAmount || parseInt(purchaseAmount) <= 0 || parseInt(purchaseAmount) > wallet.coins}
                          >
                            <ShoppingCart className="h-4 w-4 mr-1" />
                            Buy
                          </Button>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Oil Sale (coins)
                        </label>
                        <div className="flex space-x-2">
                          <input
                            type="number"
                            value={saleAmount}
                            onChange={(e) => setSaleAmount(e.target.value)}
                            className="flex-1 border rounded-md px-3 py-2 text-sm"
                            placeholder="Amount"
                            min="1"
                          />
                          <Button 
                            size="sm"
                            onClick={() => handleSale(wallet.team_id, parseInt(saleAmount) || 0)}
                            disabled={!saleAmount || parseInt(saleAmount) <= 0}
                          >
                            <DollarSign className="h-4 w-4 mr-1" />
                            Sell
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Leaderboard */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Leaderboard</h3>
            <div className="space-y-3">
              {leaderboard.map((entry) => (
                <div key={entry.team_id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center">
                    <div className={`w-6 h-6 rounded-full ${TEAM_COLORS[entry.team_id]} mr-3 flex items-center justify-center text-white text-xs font-bold`}>
                      {entry.rank}
                    </div>
                    <div>
                      <h4 className="font-medium text-sm">{TEAM_NAMES[entry.team_id]}</h4>
                      <p className="text-xs text-gray-500">
                        {entry.coins.toLocaleString()} coins
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-600 text-sm">
                      ${entry.net_worth.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500">Net Worth</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button 
            variant="outline" 
            className="h-20 flex-col"
            onClick={() => {
              // Add quick action for equipment sale
              console.log('Quick equipment sale')
            }}
          >
            <Package className="h-6 w-6 mb-2" />
            <span>Equipment Sale</span>
          </Button>
          <Button 
            variant="outline" 
            className="h-20 flex-col"
            onClick={() => {
              // Add quick action for oil purchase
              console.log('Quick oil purchase')
            }}
          >
            <TrendingUp className="h-6 w-6 mb-2" />
            <span>Oil Purchase</span>
          </Button>
          <Button 
            variant="outline" 
            className="h-20 flex-col"
            onClick={() => {
              // Add quick action for market analysis
              console.log('Market analysis')
            }}
          >
            <DollarSign className="h-6 w-6 mb-2" />
            <span>Market Analysis</span>
          </Button>
        </div>
      </div>
    </div>
  )
}