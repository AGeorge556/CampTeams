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
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600">
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
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Coin Management</h1>
              <p className="text-gray-600 mt-2">
                Manage team coins and view transaction history
              </p>
            </div>
            <button
              onClick={() => onPageChange?.('oil-extraction')}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
            >
              ← Back to Game
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          {/* Add Coins Form */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Add Coins to Team</h2>
            
            <form onSubmit={handleAddCoins} className="space-y-6">
              {/* Team Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Team
                </label>
                <select
                  value={selectedTeam}
                  onChange={(e) => setSelectedTeam(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  required
                >
                  <option value="">Choose a team...</option>
                  {wallets.map((wallet) => (
                    <option key={wallet.id} value={wallet.team_id}>
                      {TEAM_NAMES[wallet.team_id]} (Current: {wallet.coins.toLocaleString()} coins)
                    </option>
                  ))}
                </select>
              </div>

              {/* Coin Amount Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Coin Amount
                </label>
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  {coinAmounts.map((amount) => (
                    <button
                      key={amount}
                      type="button"
                      onClick={() => setSelectedAmount(amount)}
                      className={`p-2 sm:p-3 border rounded-lg text-center transition-colors ${
                        selectedAmount === amount
                          ? 'border-orange-500 bg-orange-50 text-orange-700'
                          : 'border-gray-300 hover:border-gray-400'
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (Optional)
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g., Bonus for good performance"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
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
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Team Wallets Overview</h2>
            
            <div className="space-y-4">
              {wallets.map((wallet) => (
                <div key={wallet.id} className="border rounded-lg p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-center">
                      <div className={`w-4 h-4 rounded-full ${TEAM_COLORS[wallet.team_id]} mr-3`} />
                      <div>
                        <h3 className="font-medium text-sm sm:text-base">{TEAM_NAMES[wallet.team_id]}</h3>
                        <p className="text-xs sm:text-sm text-gray-500">
                          Last updated: {new Date(wallet.updated_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-center sm:text-right">
                      <p className="font-semibold text-base sm:text-lg">{wallet.coins.toLocaleString()}</p>
                      <p className="text-xs sm:text-sm text-gray-500">coins</p>
                      <p className="font-semibold text-green-600 text-base sm:text-lg">${wallet.net_worth.toLocaleString()}</p>
                      <p className="text-xs sm:text-sm text-gray-500">net worth</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Transaction History */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Transaction History</h2>
          
          {transactions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Admin
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Team
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {transactions.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <User className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-sm font-medium text-gray-900">
                            {transaction.admin_name}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className={`w-3 h-3 rounded-full ${TEAM_COLORS[transaction.team_id as keyof typeof TEAM_COLORS]} mr-2`} />
                          <span className="text-sm text-gray-900">
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
                        <span className="text-sm text-gray-900">
                          {transaction.description || 'No description'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-500">
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
              <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No transactions yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 