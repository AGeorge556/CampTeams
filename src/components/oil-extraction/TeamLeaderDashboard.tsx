import React, { useState, useEffect } from 'react'
import { Users, DollarSign, TrendingUp, Activity, Clock } from 'lucide-react'
import { useProfile } from '../../hooks/useProfile'
import { useTeamWallets } from '../../hooks/useTeamWallets'
import { useGameSessions } from '../../hooks/useGameSessions'
import { TeamWalletWithTransactions, OilTransaction, GameLeaderboardEntry } from '../../lib/types'
import { TEAM_NAMES, TEAM_COLORS, TRANSACTION_TYPE_LABELS, TRANSACTION_TYPE_COLORS } from '../../lib/types'
import Button from '../ui/Button'
import LoadingSpinner from '../LoadingSpinner'

export default function TeamLeaderDashboard() {
  const { profile } = useProfile()
  const { getTeamWallet, leaderboard, loading: walletsLoading } = useTeamWallets()
  const { getActiveSession } = useGameSessions()
  const [teamWallet, setTeamWallet] = useState<TeamWalletWithTransactions | null>(null)
  const [loading, setLoading] = useState(true)

  const activeSession = getActiveSession()
  const teamId = profile?.current_team

  useEffect(() => {
    if (teamId) {
      loadTeamWallet()
    }
  }, [teamId])

  const loadTeamWallet = async () => {
    if (!teamId) return
    
    setLoading(true)
    try {
      const wallet = await getTeamWallet(teamId)
      setTeamWallet(wallet)
    } catch (error) {
      console.error('Failed to load team wallet:', error)
    } finally {
      setLoading(false)
    }
  }

  const getTeamRank = () => {
    if (!teamId) return null
    return leaderboard.find(entry => entry.team_id === teamId)
  }

  const formatTransactionDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  if (walletsLoading || loading) {
    return <LoadingSpinner text="Loading team dashboard..." />
  }

  if (!teamId) {
    return (
      <div className="text-center py-8">
        <h2 className="text-2xl font-bold text-[var(--color-text)] mb-4">
          No Team Assigned
        </h2>
        <p className="text-[var(--color-text-muted)]">
          You need to be assigned to a team to access the Oil Extraction Game.
        </p>
      </div>
    )
  }

  const teamRank = getTeamRank()

  return (
    <div className="space-y-8">
      {/* Team Status */}
  <div className="bg-[var(--color-card-bg)] rounded-lg shadow p-6 border border-[var(--color-border)]">
    <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <div className={`w-8 h-8 rounded-full ${teamId && TEAM_COLORS[teamId as keyof typeof TEAM_COLORS]} mr-3`} />
            <div>
      <h2 className="text-2xl font-bold text-[var(--color-text)]">{TEAM_NAMES[teamId as keyof typeof TEAM_NAMES]}</h2>
      <p className="text-[var(--color-text-muted)]">Team Leader Dashboard</p>
            </div>
          </div>
          {teamRank && (
            <div className="text-right">
              <p className="text-sm text-gray-500">Current Rank</p>
              <p className="text-2xl font-bold text-sky-600">#{teamRank.rank}</p>
            </div>
          )}
        </div>

        {/* Game Status */}
        <div className="mb-6">
          {activeSession ? (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-3 animate-pulse" />
                <div>
                  <h3 className="font-medium text-green-900">Game Active</h3>
                  <p className="text-sm text-green-700">
                    Session ends: {new Date(activeSession.end_time).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-[var(--color-bg-muted)] border border-[var(--color-border)] rounded-lg">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-[var(--color-accent-muted)] rounded-full mr-3" />
                <div>
                  <h3 className="font-medium text-gray-900">Game Inactive</h3>
                  <p className="text-sm text-gray-700">No active game session</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Team Wallet */}
        {teamWallet && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-r from-orange-50 to-yellow-50 p-6 rounded-lg border">
              <div className="flex items-center mb-2">
                <DollarSign className="h-5 w-5 text-sky-600 mr-2" />
                <h3 className="font-semibold text-gray-900">Coins</h3>
              </div>
              <p className="text-3xl font-bold text-sky-600">
                {teamWallet.coins.toLocaleString()}
              </p>
              <p className="text-sm text-gray-600">Available for trading</p>
            </div>

            <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-lg border">
              <div className="flex items-center mb-2">
                <TrendingUp className="h-5 w-5 text-green-600 mr-2" />
                <h3 className="font-semibold text-gray-900">Net Worth</h3>
              </div>
              <p className="text-3xl font-bold text-green-600">
                ${teamWallet.net_worth.toLocaleString()}
              </p>
              <p className="text-sm text-gray-600">Total team value</p>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border">
              <div className="flex items-center mb-2">
                <Activity className="h-5 w-5 text-blue-600 mr-2" />
                <h3 className="font-semibold text-gray-900">Transactions</h3>
              </div>
              <p className="text-3xl font-bold text-blue-600">
                {teamWallet.transactions.length}
              </p>
              <p className="text-sm text-gray-600">Total transactions</p>
            </div>
          </div>
        )}
      </div>

      {/* Transaction History */}
      {teamWallet && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Transaction History</h2>
          {teamWallet.transactions.length > 0 ? (
            <div className="space-y-3">
              {teamWallet.transactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full ${TRANSACTION_TYPE_COLORS[transaction.transaction_type]} mr-3`} />
                    <div>
                      <h4 className="font-medium text-sm">
                        {TRANSACTION_TYPE_LABELS[transaction.transaction_type]}
                      </h4>
                      {transaction.description && (
                        <p className="text-xs text-gray-500">{transaction.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold text-sm ${
                      transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaction.amount > 0 ? '+' : ''}{transaction.amount.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatTransactionDate(transaction.created_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No transactions yet</p>
            </div>
          )}
        </div>
      )}

      {/* Leaderboard */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Leaderboard</h2>
        <div className="space-y-3">
          {leaderboard.map((entry) => (
            <div 
              key={entry.team_id} 
              className={`flex items-center justify-between p-4 border rounded-lg ${
                entry.team_id === teamId ? 'bg-[var(--color-accent-glow)] border-[var(--color-primary)]' : ''
              }`}
            >
              <div className="flex items-center">
                <div className={`w-8 h-8 rounded-full ${TEAM_COLORS[entry.team_id]} mr-3 flex items-center justify-center text-white font-bold`}>
                  {entry.rank}
                </div>
                <div>
                  <h3 className="font-medium">{TEAM_NAMES[entry.team_id]}</h3>
                  <p className="text-sm text-gray-500">
                    {entry.coins.toLocaleString()} coins
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-green-600">
                  ${entry.net_worth.toLocaleString()}
                </p>
                <p className="text-sm text-gray-500">Net Worth</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Team Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button 
            variant="outline" 
            className="h-16 flex-col"
            onClick={() => {
              // Add action for oil collection
              console.log('Oil collection action')
            }}
          >
            <TrendingUp className="h-6 w-6 mb-2" />
            <span>Collect Oil</span>
          </Button>
          <Button 
            variant="outline" 
            className="h-16 flex-col"
            onClick={() => {
              // Add action for team strategy
              console.log('Team strategy action')
            }}
          >
            <Users className="h-6 w-6 mb-2" />
            <span>Team Strategy</span>
          </Button>
        </div>
      </div>
    </div>
  )
}