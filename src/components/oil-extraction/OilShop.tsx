import React, { useState } from 'react'
import { ShoppingCart, DollarSign, Package, TrendingUp, History, AlertTriangle, CheckCircle, XCircle, Plus, Minus, Lightbulb, PlusCircle } from 'lucide-react'
import { useProfile } from '../../hooks/useProfile'
import { useGameSessions } from '../../hooks/useGameSessions'
import { useOilExcavation } from '../../hooks/useOilExcavation'
import { useOilSales } from '../../hooks/useOilSales'
import { useOilHints } from '../../hooks/useOilHints'
import { OilQuality, OIL_QUALITY_COLORS, OIL_QUALITY_LABELS, TEAM_NAMES, TEAM_COLORS } from '../../lib/types'
import Button from '../ui/Button'
import LoadingSpinner from '../LoadingSpinner'

interface OilShopProps {
  onPageChange?: (page: string) => void
}

const OIL_PRICES: Record<OilQuality, number> = {
  common: 50,
  rare: 100,
  epic: 175,
  legendary: 250,
  mythic: 750
}

export default function OilShop({ onPageChange }: OilShopProps) {
  const { profile } = useProfile()
  const { getActiveSession } = useGameSessions()
  const activeSession = getActiveSession()
  const { allTeamsInventory } = useOilExcavation(activeSession?.id)
  const { 
    salesHistory, 
    statistics, 
    loading, 
    error, 
    purchasing, 
    buyOilFromTeam 
  } = useOilSales(activeSession?.id)
  const { 
    analytics: hintAnalytics, 
    createHint 
  } = useOilHints(activeSession?.id)

  const [selectedTeam, setSelectedTeam] = useState<string>('')
  const [purchaseQuantities, setPurchaseQuantities] = useState<Record<string, number>>({})
  const [showResult, setShowResult] = useState<{
    success: boolean
    message: string
  } | null>(null)
  const [showHintForm, setShowHintForm] = useState(false)
  const [newHint, setNewHint] = useState({
    text: '',
    qualityHintFor: '',
    cost: 50
  })

  // Check if user is shop owner
  if (!profile || profile.role !== 'shop_owner') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600">
              Only shop owners can access the oil shop.
            </p>
          </div>
        </div>
      </div>
    )
  }

  const handlePurchase = async (teamId: string, quality: OilQuality) => {
    const quantity = purchaseQuantities[`${teamId}-${quality}`] || 1
    
    if (quantity <= 0) {
      setShowResult({
        success: false,
        message: 'Please select a valid quantity'
      })
      return
    }

    const result = await buyOilFromTeam(teamId, quality, quantity)
    
    if (result.success) {
      setShowResult({
        success: true,
        message: `Successfully purchased ${result.quantity_sold} ${OIL_QUALITY_LABELS[result.quality!]} oil barrel(s) for ${result.total_amount} coins`
      })
      // Reset quantity
      setPurchaseQuantities(prev => ({
        ...prev,
        [`${teamId}-${quality}`]: 1
      }))
    } else {
      setShowResult({
        success: false,
        message: result.error || 'Failed to purchase oil'
      })
    }

    // Hide result after 4 seconds
    setTimeout(() => setShowResult(null), 4000)
  }

  const handleCreateHint = async () => {
    if (!newHint.text.trim()) {
      setShowResult({
        success: false,
        message: 'Please enter hint text'
      })
      return
    }

    const result = await createHint(newHint.text, newHint.qualityHintFor, newHint.cost)
    
    if (result.success) {
      setShowResult({
        success: true,
        message: 'Hint created successfully!'
      })
      setNewHint({ text: '', qualityHintFor: '', cost: 50 })
      setShowHintForm(false)
    } else {
      setShowResult({
        success: false,
        message: result.error || 'Failed to create hint'
      })
    }

    setTimeout(() => setShowResult(null), 4000)
  }

  const updateQuantity = (teamId: string, quality: OilQuality, change: number) => {
    const key = `${teamId}-${quality}`
    const currentQuantity = purchaseQuantities[key] || 1
    const newQuantity = Math.max(1, currentQuantity + change)
    
    setPurchaseQuantities(prev => ({
      ...prev,
      [key]: newQuantity
    }))
  }

  const isPurchasing = (teamId: string, quality: OilQuality) => {
    return purchasing?.teamId === teamId && purchasing?.quality === quality
  }

  const getTeamInventory = (teamId: string) => {
    return allTeamsInventory.find(team => team.team_id === teamId)
  }

  const getAvailableQuantity = (teamId: string, quality: OilQuality) => {
    const inventory = getTeamInventory(teamId)
    if (!inventory) return 0
    
    switch (quality) {
      case 'common': return inventory.common_count
      case 'rare': return inventory.rare_count
      case 'epic': return inventory.epic_count
      case 'legendary': return inventory.legendary_count
      case 'mythic': return inventory.mythic_count
      default: return 0
    }
  }

  if (loading) {
    return <LoadingSpinner text="Loading oil shop..." />
  }

  if (!activeSession) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No Active Session</h2>
            <p className="text-gray-600">
              There is no active game session. Please wait for an admin to start a session.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Oil Trading Shop</h1>
              <p className="text-gray-600 mt-2 text-sm sm:text-base">
                Purchase oil barrels from teams at fixed market prices
              </p>
              <div className="mt-4 p-3 sm:p-4 bg-green-50 rounded-lg border border-green-200">
                <h3 className="text-sm font-semibold text-green-900 mb-2">💡 Important:</h3>
                <div className="text-xs text-green-800 space-y-1">
                  <p><strong>When you buy oil barrels:</strong></p>
                  <p>• Teams get <strong>net worth</strong> (not coins)</p>
                  <p>• Net worth is how teams WIN the game</p>
                  <p>• Coins are only used for excavation and hints</p>
                </div>
              </div>
            </div>
            <button
              onClick={() => onPageChange?.('oil-extraction')}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 w-full sm:w-auto justify-center"
            >
              ← Back to Game
            </button>
          </div>
        </div>

        {/* Shop Statistics */}
        {statistics && (
          <div className="mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Shop Statistics</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                <div className="text-center p-3 sm:p-4 border rounded-lg">
                  <div className="text-xl sm:text-2xl font-bold text-green-600">{statistics.total_sales}</div>
                  <div className="text-xs sm:text-sm text-gray-500">Total Barrels Sold</div>
                </div>
                <div className="text-center p-3 sm:p-4 border rounded-lg">
                  <div className="text-xl sm:text-2xl font-bold text-blue-600">{statistics.total_revenue.toLocaleString()}</div>
                  <div className="text-xs sm:text-sm text-gray-500">Total Revenue</div>
                </div>
                <div className="text-center p-3 sm:p-4 border rounded-lg">
                  <div className="text-xl sm:text-2xl font-bold text-purple-600">
                    {statistics.top_selling_team && ['red', 'blue', 'green', 'yellow'].includes(statistics.top_selling_team) 
                      ? TEAM_NAMES[statistics.top_selling_team as 'red' | 'blue' | 'green' | 'yellow'] 
                      : 'None'}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-500">Top Selling Team</div>
                </div>
                <div className="text-center p-3 sm:p-4 border rounded-lg">
                  <div className="text-xl sm:text-2xl font-bold text-orange-600">
                    {statistics.top_selling_team_amount.toLocaleString()}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-500">Top Team Revenue</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Team Inventories */}
        <div className="mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Team Inventories</h2>
            
            <div className="space-y-6">
              {(['red', 'blue', 'green', 'yellow'] as const).map(teamId => {
                const inventory = getTeamInventory(teamId)
                if (!inventory || inventory.total_count === 0) return null

                return (
                  <div key={teamId} className="border rounded-lg p-4">
                    <div className="flex items-center mb-4">
                      <div className={`w-6 h-6 rounded-full ${TEAM_COLORS[teamId]} mr-3`} />
                      <h3 className="text-lg font-semibold">{TEAM_NAMES[teamId]}</h3>
                      <div className="ml-auto text-sm text-gray-500">
                        Total: {inventory.total_count} barrels
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4">
                      {(['common', 'rare', 'epic', 'legendary', 'mythic'] as OilQuality[]).map(quality => {
                        const available = getAvailableQuantity(teamId, quality)
                        const price = OIL_PRICES[quality]
                        const quantity = purchaseQuantities[`${teamId}-${quality}`] || 1
                        const totalCost = price * quantity

                        if (available === 0) return null

                        return (
                          <div key={quality} className="border rounded-lg p-3">
                            <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mb-2 ${OIL_QUALITY_COLORS[quality]}`}>
                              <span className="hidden sm:inline">{OIL_QUALITY_LABELS[quality]}</span>
                              <span className="sm:hidden">{OIL_QUALITY_LABELS[quality].charAt(0)}</span>
                            </div>
                            <div className="text-xs sm:text-sm text-gray-600 mb-2">
                              Available: {available}
                            </div>
                            <div className="text-xs sm:text-sm text-gray-600 mb-2">
                              Price: {price} coins
                            </div>
                            
                            {/* Quantity Controls */}
                            <div className="flex items-center justify-between mb-2">
                              <button
                                onClick={() => updateQuantity(teamId, quality, -1)}
                                disabled={quantity <= 1}
                                className="p-1 rounded hover:bg-gray-100 disabled:opacity-50"
                              >
                                <Minus className="h-3 w-3" />
                              </button>
                              <span className="text-xs sm:text-sm font-medium">{quantity}</span>
                              <button
                                onClick={() => updateQuantity(teamId, quality, 1)}
                                disabled={quantity >= available}
                                className="p-1 rounded hover:bg-gray-100 disabled:opacity-50"
                              >
                                <Plus className="h-3 w-3" />
                              </button>
                            </div>
                            
                            <div className="text-xs sm:text-sm font-medium text-gray-900 mb-2">
                              Total: {totalCost} coins
                            </div>
                            
                            <Button
                              size="sm"
                              onClick={() => handlePurchase(teamId, quality)}
                              disabled={isPurchasing(teamId, quality)}
                              className="w-full text-xs"
                            >
                              {isPurchasing(teamId, quality) ? (
                                <div className="flex items-center justify-center">
                                  <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-white mr-1 sm:mr-2"></div>
                                  <span className="hidden sm:inline">Purchasing...</span>
                                  <span className="sm:hidden">Buying...</span>
                                </div>
                              ) : (
                                <div className="flex items-center justify-center">
                                  <ShoppingCart className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                                  <span className="hidden sm:inline">Buy</span>
                                  <span className="sm:hidden">Buy</span>
                                </div>
                              )}
                            </Button>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Sales History */}
        <div className="mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Recent Sales History</h2>
            
            {salesHistory.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Team
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Quality
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Quantity
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Price/Barrel
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Sold By
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {salesHistory.slice(0, 10).map((sale) => (
                      <tr key={sale.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className={`w-4 h-4 rounded-full ${TEAM_COLORS[sale.team_id]} mr-2`} />
                            <span className="text-sm font-medium text-gray-900">
                              {TEAM_NAMES[sale.team_id]}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${OIL_QUALITY_COLORS[sale.quality]}`}>
                            {OIL_QUALITY_LABELS[sale.quality]}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {sale.quantity}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {sale.price_per_barrel} coins
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                          {sale.total_amount} coins
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {sale.shop_owner_name || 'Unknown'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(sale.created_at).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <History className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No sales recorded yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Hint Management */}
        <div className="mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Hint Management</h2>
              <Button
                size="sm"
                onClick={() => setShowHintForm(!showHintForm)}
                className="inline-flex items-center"
              >
                <PlusCircle className="h-4 w-4 mr-1" />
                {showHintForm ? 'Cancel' : 'Create Hint'}
              </Button>
            </div>

            {/* Create Hint Form */}
            {showHintForm && (
              <div className="mb-6 p-4 border rounded-lg bg-gray-50">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Hint</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Hint Text
                    </label>
                    <textarea
                      value={newHint.text}
                      onChange={(e) => setNewHint(prev => ({ ...prev, text: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      rows={3}
                      placeholder="Enter hint text..."
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Quality Hint For (Optional)
                      </label>
                      <input
                        type="text"
                        value={newHint.qualityHintFor}
                        onChange={(e) => setNewHint(prev => ({ ...prev, qualityHintFor: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="e.g., center, corner, mythic"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Cost (coins)
                      </label>
                      <input
                        type="number"
                        value={newHint.cost}
                        onChange={(e) => setNewHint(prev => ({ ...prev, cost: parseInt(e.target.value) || 0 }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                        min="1"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button
                      size="sm"
                      onClick={handleCreateHint}
                      className="inline-flex items-center"
                    >
                      <Lightbulb className="h-4 w-4 mr-1" />
                      Create Hint
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Hint Analytics */}
            {hintAnalytics.length > 0 && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Hint Analytics</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Hint
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Cost
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Purchases
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Revenue
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Teams Purchased
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {hintAnalytics.map((hint) => (
                        <tr key={hint.hint_id}>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900 font-medium">
                              {hint.hint_text.length > 50 
                                ? `${hint.hint_text.substring(0, 50)}...` 
                                : hint.hint_text
                              }
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {hint.cost} coins
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {hint.total_purchases}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                            {hint.total_revenue} coins
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                         {hint.teams_purchased.length > 0 ? (
                               <div className="flex space-x-1">
                                 {hint.teams_purchased.map((teamId) => (
                                   <div key={teamId} className={`w-3 h-3 rounded-full ${TEAM_COLORS[teamId as 'red' | 'blue' | 'green' | 'yellow']}`} />
                                 ))}
                               </div>
                             ) : (
                               <span className="text-gray-400">None</span>
                             )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Result Notification */}
        {showResult && (
          <div className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
            showResult.success ? 'bg-green-100 border border-green-400' : 'bg-red-100 border border-red-400'
          }`}>
            <div className="flex items-center">
              {showResult.success ? (
                <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600 mr-2" />
              )}
              <span className={showResult.success ? 'text-green-800' : 'text-red-800'}>
                {showResult.message}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 