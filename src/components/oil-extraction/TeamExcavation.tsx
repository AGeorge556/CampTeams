import React, { useState } from 'react'
import { MapPin, Coins, Package, Users, AlertTriangle, CheckCircle, XCircle, Lightbulb, ShoppingCart, TrendingUp } from 'lucide-react'
import { useProfile } from '../../hooks/useProfile'
import { useGameSessions } from '../../hooks/useGameSessions'
import { useTeamWallets } from '../../hooks/useTeamWallets'
import { useOilExcavation } from '../../hooks/useOilExcavation'
import { useOilHints } from '../../hooks/useOilHints'
import { OilQuality, OIL_QUALITY_COLORS, OIL_QUALITY_LABELS, TEAM_NAMES, TEAM_COLORS } from '../../lib/types'
import Button from '../ui/Button'
import LoadingSpinner from '../LoadingSpinner'

interface TeamExcavationProps {
  onPageChange?: (page: string) => void
}

export default function TeamExcavation({ onPageChange }: TeamExcavationProps) {
  const { profile } = useProfile()
  const { getActiveSession } = useGameSessions()
  const { wallets, loading: walletsLoading } = useTeamWallets()
  const activeSession = getActiveSession()
  const { 
    grid, 
    teamInventory, 
    allTeamsInventory, 
    loading, 
    error, 
    excavating, 
    excavateSquare,
    getSquareByPosition 
  } = useOilExcavation(activeSession?.id)
  const { 
    hints, 
    loading: hintsLoading, 
    purchaseHint, 
    getAvailableHints, 
    getPurchasedHints,
    isPurchasing 
  } = useOilHints(activeSession?.id)

  const [showResult, setShowResult] = useState<{
    success: boolean
    quality?: OilQuality
    message: string
  } | null>(null)

  // Check if user is team leader
  if (!profile || profile.role !== 'team_leader') {
    return (
      <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center">
        <div className="bg-[var(--color-card-bg)] rounded-lg shadow-lg p-8 max-w-md w-full mx-4 border border-[var(--color-border)]">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-[var(--color-text)] mb-2">Access Denied</h2>
            <p className="text-[var(--color-text-muted)]">
              Only team leaders can access the excavation site.
            </p>
          </div>
        </div>
      </div>
    )
  }

  const teamWallet = wallets.find(w => w.team_id === profile.current_team)
  const canExcavate = teamWallet && teamWallet.coins >= 100

  const handleExcavate = async (row: number, col: number) => {
    const squareId = row * 6 + col + 1
    const square = getSquareByPosition(row, col)
    
    if (!square || square.is_excavated) return
    
    if (!canExcavate) {
      setShowResult({
        success: false,
        message: 'You need at least 100 coins to excavate!'
      })
      return
    }

    const result = await excavateSquare(squareId)
    
    if (result.success) {
      setShowResult({
        success: true,
        quality: result.quality,
        message: `Successfully excavated ${OIL_QUALITY_LABELS[result.quality!]} oil!`
      })
    } else {
      setShowResult({
        success: false,
        message: result.error || 'Failed to excavate'
      })
    }

    // Hide result after 3 seconds
    setTimeout(() => setShowResult(null), 3000)
  }

  const renderSquare = (row: number, col: number) => {
    const square = getSquareByPosition(row, col)
    const squareId = row * 6 + col + 1
    const isExcavating = excavating === squareId

    if (!square) {
      return (
        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-[var(--color-bg-muted)] rounded-lg flex items-center justify-center">
          <div className="text-[var(--color-text-muted)] text-xs">?</div>
        </div>
      )
    }

    if (square.is_excavated) {
      return (
        <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-lg flex items-center justify-center border-2 ${
          square.excavated_by_team ? TEAM_COLORS[square.excavated_by_team] : 'bg-[var(--color-bg-muted)]'
        }`}>
          <div className={`px-1 sm:px-2 py-1 rounded text-xs font-medium ${OIL_QUALITY_COLORS[square.quality as OilQuality]}`}>
            <span className="hidden sm:inline">{OIL_QUALITY_LABELS[square.quality as OilQuality]}</span>
            <span className="sm:hidden">{OIL_QUALITY_LABELS[square.quality as OilQuality].charAt(0)}</span>
          </div>
        </div>
      )
    }

    return (
      <button
        onClick={() => handleExcavate(row, col)}
        disabled={!canExcavate || isExcavating}
        className={`w-12 h-12 sm:w-16 sm:h-16 rounded-lg border-2 border-dashed transition-all ${
          canExcavate
            ? 'border-[var(--color-border)] hover:border-[var(--color-text)] hover:bg-[var(--color-bg-muted)]'
            : 'border-[var(--color-border)] bg-[var(--color-bg-muted)] cursor-not-allowed'
        } ${isExcavating ? 'animate-pulse' : ''}`}
      >
        {isExcavating ? (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-4 w-4 sm:h-6 sm:w-6 border-b-2 border-orange-600"></div>
          </div>
        ) : (
          <div className="flex items-center justify-center">
            <MapPin className="h-4 w-4 sm:h-6 sm:w-6 text-[var(--color-text-muted)]" />
          </div>
        )}
      </button>
    )
  }

  if (loading || walletsLoading || hintsLoading) {
    return <LoadingSpinner text="Loading excavation site..." />
  }

  if (!activeSession) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center">
        <div className="bg-[var(--color-card-bg)] rounded-lg shadow-lg p-8 max-w-md w-full mx-4 border border-[var(--color-border)]">
          <div className="text-center">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-[var(--color-text)] mb-2">No Active Session</h2>
            <p className="text-[var(--color-text-muted)]">
              There is no active game session. Please wait for an admin to start a session.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[var(--color-text)]">Oil Excavation Site</h1>
              <p className="text-[var(--color-text-muted)] mt-2 text-sm sm:text-base">
                Shared excavation grid - compete with other teams to find the best oil!
              </p>
            </div>
            <button
              onClick={() => onPageChange?.('oil-extraction')}
              className="inline-flex items-center px-4 py-2 border border-[var(--color-border)] text-sm font-medium rounded-md text-[var(--color-text)] bg-[var(--color-card-bg)] hover:bg-[var(--color-bg-muted)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 w-full sm:w-auto justify-center"
            >
              ← Back to Game
            </button>
          </div>
        </div>

        {/* Team Status */}
        <div className="mb-8">
          <div className="bg-[var(--color-card-bg)] rounded-lg shadow p-6 border border-[var(--color-border)]">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center">
                <div className={`w-8 h-8 rounded-full ${TEAM_COLORS[profile.current_team! as keyof typeof TEAM_COLORS]} mr-3`} />
                <div>
                  <h2 className="text-xl font-semibold text-[var(--color-text)]">{TEAM_NAMES[profile.current_team! as keyof typeof TEAM_NAMES]}</h2>
                  <p className="text-[var(--color-text-muted)]">Team Leader</p>
                </div>
              </div>
              <div className="text-center sm:text-right">
                <div className="flex items-center justify-center sm:justify-end">
                  <Coins className="h-5 w-5 text-orange-600 mr-2" />
                  <span className="text-2xl font-bold text-orange-600">
                    {teamWallet?.coins.toLocaleString() || 0}
                  </span>
                </div>
                <p className="text-sm text-[var(--color-text-muted)]">Available Coins</p>
                {!canExcavate && (
                  <p className="text-sm text-red-500">Need 100+ coins to excavate</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Team Wallet Details */}
        <div className="mb-8">
          <div className="bg-[var(--color-card-bg)] rounded-lg shadow p-6 border border-[var(--color-border)]">
            <h2 className="text-xl font-semibold text-[var(--color-text)] mb-6">Your Team's Wallet</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="text-center p-6 border rounded-lg bg-[var(--color-card-bg)]">
                <Coins className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                <h3 className="text-lg font-semibold text-[var(--color-text)]">Coins</h3>
                <div className="text-3xl font-bold text-orange-600">
                  {teamWallet?.coins || 0}
                </div>
                <p className="text-sm text-[var(--color-text-muted)] mt-2">Used for playing the game</p>
                <div className="text-xs text-[var(--color-text-muted)] mt-2">
                  • Start with 0 coins<br/>
                  • Added by admins via real-life mini-games<br/>
                  • Used for excavation (100 per square)<br/>
                  • Used for buying hints<br/>
                  • <strong>NOT used for winning</strong>
                </div>
              </div>
              
              <div className="text-center p-6 border rounded-lg bg-[var(--color-card-bg)]">
                <TrendingUp className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <h3 className="text-lg font-semibold text-[var(--color-text)]">Net Worth</h3>
                <div className="text-3xl font-bold text-green-600">
                  {teamWallet?.net_worth || 0}
                </div>
                <p className="text-sm text-[var(--color-text-muted)] mt-2">Used to win the game</p>
                <div className="text-xs text-[var(--color-text-muted)] mt-2">
                  • Start with 0 net worth<br/>
                  • Earned ONLY by selling oil barrels<br/>
                  • NOT affected by spending coins<br/>
                  • <strong>This is how you WIN the game</strong>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Excavation Grid */}
        <div className="mb-8">
          <div className="bg-[var(--color-card-bg)] rounded-lg shadow p-6 border border-[var(--color-border)]">
            <h2 className="text-xl font-semibold text-[var(--color-text)] mb-6">Excavation Grid</h2>
            
            <div className="flex justify-center overflow-x-auto">
              <div className="grid grid-cols-6 gap-1 sm:gap-2">
                {Array.from({ length: 5 }, (_, row) =>
                  Array.from({ length: 6 }, (_, col) => (
                    <div key={`${row}-${col}`}>
                      {renderSquare(row, col)}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Grid Legend */}
            <div className="mt-6 flex flex-wrap justify-center gap-2 sm:gap-4">
              <div className="flex items-center">
                <div className="w-3 h-3 sm:w-4 sm:h-4 bg-[var(--color-bg-muted)] rounded mr-1 sm:mr-2"></div>
                <span className="text-xs sm:text-sm text-[var(--color-text-muted)]">Unexcavated</span>
              </div>
              {(['common', 'rare', 'epic', 'legendary', 'mythic'] as OilQuality[]).map(quality => (
                <div key={quality} className="flex items-center">
                  <div className={`w-3 h-3 sm:w-4 sm:h-4 rounded mr-1 sm:mr-2 ${OIL_QUALITY_COLORS[quality]}`}></div>
                  <span className="text-xs sm:text-sm text-[var(--color-text-muted)]">
                    <span className="hidden sm:inline">{OIL_QUALITY_LABELS[quality]}</span>
                    <span className="sm:hidden">{OIL_QUALITY_LABELS[quality].charAt(0)}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Team Inventory */}
        <div className="mb-8">
          <div className="bg-[var(--color-card-bg)] rounded-lg shadow p-6 border border-[var(--color-border)]">
            <h2 className="text-xl font-semibold text-[var(--color-text)] mb-6">Your Team's Inventory</h2>

            {teamInventory.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4">
                {teamInventory.map((item) => (
                  <div key={item.quality} className="text-center p-3 sm:p-4 border rounded-lg bg-[var(--color-card-bg)]">
                    <div className={`inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium mb-2 ${OIL_QUALITY_COLORS[item.quality]}`}>
                      <span className="hidden sm:inline">{OIL_QUALITY_LABELS[item.quality]}</span>
                      <span className="sm:hidden">{OIL_QUALITY_LABELS[item.quality].charAt(0)}</span>
                    </div>
                    <div className="text-xl sm:text-2xl font-bold text-[var(--color-text)]">{item.quantity}</div>
                    <div className="text-xs sm:text-sm text-[var(--color-text-muted)]">barrels</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-[var(--color-text-muted)] mx-auto mb-4" />
                <p className="text-[var(--color-text-muted)]">No oil collected yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Hints Shop */}
        <div className="mb-8">
          <div className="bg-[var(--color-card-bg)] rounded-lg shadow p-6 border border-[var(--color-border)]">
            <h2 className="text-xl font-semibold text-[var(--color-text)] mb-6">Hints Shop</h2>
            
            {hintsLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
                <p className="text-[var(--color-text-muted)] mt-2">Loading hints...</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Available Hints */}
                <div>
                  <h3 className="text-lg font-medium text-[var(--color-text)] mb-4">Available Hints</h3>
                  {getAvailableHints().length > 0 ? (
                    <div className="grid grid-cols-1 gap-4">
                      {getAvailableHints().map((hint) => (
                        <div key={hint.id} className="border rounded-lg p-4">
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-3 gap-2">
                            <div className="flex items-center">
                              <Lightbulb className="h-5 w-5 text-yellow-500 mr-2" />
                              <span className="font-medium text-[var(--color-text)]">Hint</span>
                            </div>
                            <div className="text-center sm:text-right">
                              <div className="text-lg font-bold text-orange-600">{hint.cost}</div>
                              <div className="text-sm text-[var(--color-text-muted)]">coins</div>
                            </div>
                          </div>
                          
                          {hint.quality_hint_for && (
                            <div className="mb-2">
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {hint.quality_hint_for}
                              </span>
                            </div>
                          )}
                          
                          <div className="mb-4">
                            <p className="text-[var(--color-text-muted)] text-sm">
                              {hint.hint_text.length > 100 
                                ? `${hint.hint_text.substring(0, 100)}...` 
                                : hint.hint_text
                              }
                            </p>
                          </div>
                          
                          <Button
                            size="sm"
                            onClick={async () => {
                              const result = await purchaseHint(hint.id)
                              if (result.success) {
                                setShowResult({
                                  success: true,
                                  message: `Hint purchased! ${result.hint_text}`
                                })
                              } else {
                                setShowResult({
                                  success: false,
                                  message: result.error || 'Failed to purchase hint'
                                })
                              }
                              setTimeout(() => setShowResult(null), 4000)
                            }}
                            disabled={isPurchasing(hint.id) || !canExcavate}
                            className="w-full"
                          >
                            {isPurchasing(hint.id) ? (
                              <div className="flex items-center justify-center">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Purchasing...
                              </div>
                            ) : (
                              <div className="flex items-center justify-center">
                                <ShoppingCart className="h-4 w-4 mr-1" />
                                Buy Hint
                              </div>
                            )}
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Lightbulb className="h-12 w-12 text-[var(--color-text-muted)] mx-auto mb-4" />
                      <p className="text-[var(--color-text-muted)]">No hints available</p>
                    </div>
                  )}
                </div>

                {/* Purchased Hints */}
                {getPurchasedHints().length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium text-[var(--color-text)] mb-4">Your Purchased Hints</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {getPurchasedHints().map((hint) => (
                          <div key={hint.id} className="border rounded-lg p-4 bg-[var(--color-card-bg)]">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center">
                                <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                                <span className="font-medium text-[var(--color-text)]">Purchased</span>
                              </div>
                              <div className="text-right">
                                <div className="text-sm text-[var(--color-text-muted)]">Cost: {hint.cost} coins</div>
                              </div>
                            </div>
                          
                            {hint.quality_hint_for && (
                              <div className="mb-2">
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-[var(--color-bg-muted)] text-[var(--color-text)]">
                                  {hint.quality_hint_for}
                                </span>
                              </div>
                            )}
                          
                            <div>
                              <p className="text-[var(--color-text-muted)] text-sm">{hint.hint_text}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* All Teams Summary */}
        <div className="mb-8">
          <div className="bg-[var(--color-card-bg)] rounded-lg shadow p-6 border border-[var(--color-border)]">
            <h2 className="text-xl font-semibold text-[var(--color-text)] mb-6">All Teams Progress</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {allTeamsInventory.map((team) => (
                <div key={team.team_id} className="border rounded-lg p-4">
                  <div className="flex items-center mb-3">
                    <div className={`w-4 h-4 rounded-full ${TEAM_COLORS[team.team_id]} mr-2`} />
                    <h3 className="font-medium">{TEAM_NAMES[team.team_id]}</h3>
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Total:</span>
                      <span className="font-semibold">{team.total_count}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Mythic:</span>
                      <span className="text-red-600 font-semibold">{team.mythic_count}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Legendary:</span>
                      <span className="text-orange-600 font-semibold">{team.legendary_count}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
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