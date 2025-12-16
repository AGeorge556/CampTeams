import React, { useState } from 'react'
import { Plus, DollarSign, Clock, User, AlertTriangle } from 'lucide-react'
import { useProfile } from '../../hooks/useProfile'
import { useTeamWallets } from '../../hooks/useTeamWallets'
import { useCoinTransactions } from '../../hooks/useCoinTransactions'
import { TEAM_NAMES, TEAM_COLORS } from '../../lib/types'
import Button from '../ui/Button'
import LoadingSpinner from '../LoadingSpinner'

interface AdminCoinManagementProps {
  onPageChange?: (page: string) => void
}

export default function AdminCoinManagement({ onPageChange }: AdminCoinManagementProps) {
  const { profile } = useProfile()
  const { wallets, loading: walletsLoading, refresh: refreshWallets } = useTeamWallets()
  const { transactions, loading: transactionsLoading, addCoinsToTeam, formatTransactionDate } = useCoinTransactions()
  
  const [selectedTeam, setSelectedTeam] = useState<string>('')
  const [selectedAmount, setSelectedAmount] = useState<number>(25)
  const [description, setDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Check if user is admin
  if (!profile || (!profile.is_admin && profile.role !== 'admin')) {
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

  const handleAddCoins = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedTeam) {
      alert('Please select a team')
      return
    }

    setIsSubmitting(true)
    try {
      await addCoinsToTeam(selectedTeam, selectedAmount, description || undefined)
      setDescription('')
      await refreshWallets()
    } catch (error) {
      console.error('Failed to add coins:', error)
      alert('Failed to add coins. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const coinAmounts = [25, 50, 75, 100]

  if (walletsLoading || transactionsLoading) {
    return <LoadingSpinner text="Loading admin coin management..." />
  }

  return (
    <div className="min-h-screen bg-[var(--gradient-app-bg)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-[var(--color-text)]">Admin Coin Management</h1>
              <p className="text-[var(--color-text-muted)] mt-2">
                Manage team wallets and coin distribution for the oil extraction game.
              </p>
            </div>
            <button
              onClick={() => onPageChange?.('oil-extraction')}
              className="inline-flex items-center px-4 py-2 border border-[var(--color-border)] text-sm font-medium rounded-md text-[var(--color-text)] bg-[var(--color-bg)] hover:bg-[var(--color-bg-muted)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500"
            >
              ← Back to Game
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          {/* Add Coins Form */}
          <div className="bg-[var(--color-card-bg)] rounded-lg shadow p-6 border border-[var(--color-border)]">
            <h2 className="text-xl font-semibold text-[var(--color-text)] mb-6">Add Coins to Team</h2>
            
            <form onSubmit={handleAddCoins} className="space-y-6">
              {/* Team Selection */}
              <div>
                <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
                  Select Team
                </label>
                <select
                  value={selectedTeam}
                  onChange={(e) => setSelectedTeam(e.target.value)}
                  className="w-full border border-[var(--color-border)] rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent bg-[var(--color-input-bg)] text-[var(--color-text)]"
                  required
                >
                  <option value="">Select a team...</option>
                  {wallets.map((wallet) => (
                    <option key={wallet.id} value={wallet.team_id}>
                      {TEAM_NAMES[wallet.team_id]} (Current: {wallet.coins.toLocaleString()} coins)
                    </option>
                  ))}
                </select>
              </div>

              {/* Coin Amount Selection */}
              <div>
                <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
                  Amount
                </label>
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  {coinAmounts.map((amount) => (
                    <button
                      key={amount}
                      type="button"
                      onClick={() => setSelectedAmount(amount)}
                      className={`p-2 sm:p-3 border rounded-lg text-center transition-colors ${
                        selectedAmount === amount
                          ? 'border-[var(--color-primary)] bg-[var(--color-accent-glow)] text-[var(--color-primary)]'
                          : 'border-[var(--color-border)] hover:border-[var(--color-border-hover)]'
                      }`}
                    >
                      <div className="flex items-center justify-center">
                        <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                        <span className="font-semibold text-sm sm:text-base">+{amount}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
                  Reason (Optional)
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g., Daily bonus, Event reward, etc."
                  className="w-full border border-[var(--color-border)] rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent bg-[var(--color-input-bg)] text-[var(--color-text)]"
                />
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                loading={isSubmitting}
                disabled={!selectedTeam || isSubmitting}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add {selectedAmount} Coins
              </Button>
            </form>
          </div>

          {/* Team Wallets Overview */}
          <div className="bg-[var(--color-card-bg)] rounded-lg shadow p-6 border border-[var(--color-border)]">
            <h2 className="text-xl font-semibold text-[var(--color-text)] mb-6">Team Wallets Overview</h2>
            
            <div className="space-y-4">
              {wallets.map((wallet) => (
                <div key={wallet.id} className="border rounded-lg p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-center">
                      <div className={`w-4 h-4 rounded-full ${TEAM_COLORS[wallet.team_id]} mr-3`} />
                      <div>
                        <h3 className="font-medium text-sm sm:text-base">{TEAM_NAMES[wallet.team_id]}</h3>
                        <p className="text-xs sm:text-sm text-[var(--color-text-muted)]">
                          Last updated: {new Date(wallet.updated_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-center sm:text-right">
                      <p className="font-semibold text-base sm:text-lg">{wallet.coins.toLocaleString()}</p>
                      <p className="text-xs sm:text-sm text-[var(--color-text-muted)]">coins</p>
                      <p className="font-semibold text-green-600 text-base sm:text-lg">${wallet.net_worth.toLocaleString()}</p>
                      <p className="text-xs sm:text-sm text-[var(--color-text-muted)]">net worth</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Transaction History */}
        <div className="mt-8 bg-[var(--color-card-bg)] rounded-lg shadow p-6 border border-[var(--color-border)]">
          <h2 className="text-xl font-semibold text-[var(--color-text)] mb-6">Transaction History</h2>
          
          {transactions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-[var(--color-border)]">
                <thead className="bg-[var(--color-bg-muted)]">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
                      Admin
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
                      Team
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
                      Reason
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-[var(--color-bg)] divide-y divide-[var(--color-border)]">
                  {transactions.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-[var(--color-bg-muted)]">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <User className="h-4 w-4 text-[var(--color-text-muted)] mr-2" />
                          <span className="text-sm font-medium text-[var(--color-text)]">
                            {transaction.admin_name}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className={`w-3 h-3 rounded-full ${TEAM_COLORS[transaction.team_id as keyof typeof TEAM_COLORS]} mr-2`} />
                          <span className="text-sm text-[var(--color-text)]">
                            {TEAM_NAMES[transaction.team_id as keyof typeof TEAM_NAMES]}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm font-semibold ${
                          transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {transaction.amount > 0 ? '+' : ''}{transaction.amount.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-[var(--color-text)]">
                          {transaction.description || 'No description'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 text-[var(--color-text-muted)] mr-2" />
                          <span className="text-sm text-[var(--color-text-muted)]">
                            {formatTransactionDate(transaction.created_at)}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <DollarSign className="h-12 w-12 text-[var(--color-text-muted)] mx-auto mb-4" />
              <p className="text-[var(--color-text-muted)]">No transactions yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 