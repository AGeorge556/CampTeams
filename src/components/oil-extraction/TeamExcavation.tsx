import React, { useState } from 'react'
import { useProfile } from '../../hooks/useProfile'
import { useGameSessions } from '../../hooks/useGameSessions'
import { useTeamWallets } from '../../hooks/useTeamWallets'
import { useOilExcavation } from '../../hooks/useOilExcavation'
import { useOilHints } from '../../hooks/useOilHints'
import { useLanguage } from '../../contexts/LanguageContext'
import LoadingSpinner from '../LoadingSpinner'
import { 
  AlertTriangle, 
  XCircle, 
  MapPin, 
  Package, 
  Lightbulb, 
  Coins, 
  TrendingUp,
  Users,
  Eye,
  EyeOff
} from 'lucide-react'
import { OilQuality, OIL_QUALITY_LABELS, OIL_QUALITY_COLORS, TEAM_NAMES, TEAM_COLORS } from '../../lib/constants'

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
    marking, 
    markSquare,
    unmarkSquare,
    canMark,
    canUnmark,
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
    message: string
  } | null>(null)

  const [showAllMarks, setShowAllMarks] = useState(false)

  // Check if user is team leader
  if (!profile || profile.role !== 'team_leader') {
    return (
      <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center">
        <div className="bg-[var(--color-card-bg)] rounded-lg shadow-lg p-8 max-w-md w-full mx-4 border border-[var(--color-border)]">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-[var(--color-text)] mb-2">Access Denied</h2>
            <p className="text-[var(--color-text-muted)]">
              Only team leaders can access the marking site.
            </p>
          </div>
        </div>
      </div>
    )
  }

  const teamWallet = wallets.find(w => w.team_id === profile.current_team)

  const handleMark = async (row: number, col: number) => {
    const squareId = row * 6 + col + 1
    const square = getSquareByPosition(row, col)
    
    if (!square) return
    
    let result
    if (square.marked_by_team === profile.current_team) {
      // Unmark if already marked by current team
      result = await unmarkSquare(squareId)
    } else {
      // Mark if not marked by any team
      result = await markSquare(squareId)
    }
    
    if (result.success) {
      setShowResult({
        success: true,
        message: result.message
      })
    } else {
      setShowResult({
        success: false,
        message: result.error || 'Failed to mark square'
      })
    }

    // Hide result after 3 seconds
    setTimeout(() => setShowResult(null), 3000)
  }

  const renderSquare = (row: number, col: number) => {
    const square = getSquareByPosition(row, col)
    const squareId = row * 6 + col + 1
    const isMarking = marking === squareId

    if (!square) {
      return (
        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-[var(--color-bg-muted)] rounded-lg flex items-center justify-center">
          <div className="text-[var(--color-text-muted)] text-xs">?</div>
        </div>
      )
    }

    // If square is marked by current team
    if (square.marked_by_team === profile.current_team) {
      return (
        <button
          onClick={() => handleMark(row, col)}
          disabled={isMarking}
          className={`w-12 h-12 sm:w-16 sm:h-16 rounded-lg border-2 border-solid transition-all ${
            TEAM_COLORS[profile.current_team! as keyof typeof TEAM_COLORS]
          } hover:opacity-80 ${isMarking ? 'animate-pulse' : ''}`}
        >
          {isMarking ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-4 w-4 sm:h-6 sm:w-6 border-b-2 border-white"></div>
            </div>
          ) : (
            <div className="flex items-center justify-center">
              <MapPin className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
            </div>
          )}
        </button>
      )
    }

    // If square is marked by another team
    if (square.marked_by_team && square.marked_by_team !== profile.current_team) {
      return (
        <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-lg border-2 border-solid flex items-center justify-center ${
          TEAM_COLORS[square.marked_by_team as keyof typeof TEAM_COLORS]
        }`}>
          <div className="flex items-center justify-center">
            <MapPin className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
          </div>
        </div>
      )
    }

    // If square is not marked and can be marked
    return (
      <button
        onClick={() => handleMark(row, col)}
        disabled={!canMark(squareId) || isMarking}
        className={`w-12 h-12 sm:w-16 sm:h-16 rounded-lg border-2 border-dashed transition-all ${
          canMark(squareId)
            ? 'border-[var(--color-border)] hover:border-[var(--color-text)] hover:bg-[var(--color-bg-muted)]'
            : 'border-[var(--color-border)] bg-[var(--color-bg-muted)] cursor-not-allowed'
        } ${isMarking ? 'animate-pulse' : ''}`}
      >
        {isMarking ? (
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
    return <LoadingSpinner text="Loading marking site..." />
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
              <h1 className="text-2xl sm:text-3xl font-bold text-[var(--color-text)]">Oil Marking Site</h1>
              <p className="text-[var(--color-text-muted)] mt-2 text-sm sm:text-base">
                Mark squares where you believe valuable oil is located. Compete with other teams to find the best spots!
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

        {/* Marking Grid */}
        <div className="mb-8">
          <div className="bg-[var(--color-card-bg)] rounded-lg shadow p-6 border border-[var(--color-border)]">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
              <h2 className="text-xl font-semibold text-[var(--color-text)]">Marking Grid</h2>
              <button
                onClick={() => setShowAllMarks(!showAllMarks)}
                className="inline-flex items-center px-3 py-2 border border-[var(--color-border)] text-sm font-medium rounded-md text-[var(--color-text)] bg-[var(--color-card-bg)] hover:bg-[var(--color-bg-muted)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
              >
                {showAllMarks ? (
                  <>
                    <EyeOff className="h-4 w-4 mr-2" />
                    Hide All Marks
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4 mr-2" />
                    Show All Marks
                  </>
                )}
              </button>
            </div>
            
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
                <div className="w-3 h-3 sm:w-4 sm:h-4 bg-[var(--color-bg-muted)] rounded mr-1 sm:mr-2 border-2 border-dashed border-[var(--color-border)]"></div>
                <span className="text-xs sm:text-sm text-[var(--color-text-muted)]">Unmarked</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 sm:w-4 sm:h-4 bg-blue-500 rounded mr-1 sm:mr-2 border-2 border-solid"></div>
                <span className="text-xs sm:text-sm text-[var(--color-text-muted)]">Marked by Blue Team</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 sm:w-4 sm:h-4 bg-red-500 rounded mr-1 sm:mr-2 border-2 border-solid"></div>
                <span className="text-xs sm:text-sm text-[var(--color-text-muted)]">Marked by Red Team</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 sm:w-4 sm:h-4 bg-green-500 rounded mr-1 sm:mr-2 border-2 border-solid"></div>
                <span className="text-xs sm:text-sm text-[var(--color-text-muted)]">Marked by Green Team</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 sm:w-4 sm:h-4 bg-yellow-500 rounded mr-1 sm:mr-2 border-2 border-solid"></div>
                <span className="text-xs sm:text-sm text-[var(--color-text-muted)]">Marked by Yellow Team</span>
              </div>
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
                              <span className="text-sm text-[var(--color-text-muted)]">Hint for: </span>
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${OIL_QUALITY_COLORS[hint.quality_hint_for as OilQuality]}`}>
                                {OIL_QUALITY_LABELS[hint.quality_hint_for as OilQuality]}
                              </span>
                            </div>
                          )}
                          
                          <p className="text-[var(--color-text)] mb-4">{hint.text}</p>
                          
                          <button
                            onClick={() => purchaseHint(hint.id)}
                            disabled={isPurchasing || (teamWallet?.coins || 0) < hint.cost}
                            className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                          >
                            {isPurchasing ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            ) : (
                              <Coins className="h-4 w-4 mr-2" />
                            )}
                            Purchase Hint ({hint.cost} coins)
                          </button>
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
                <div>
                  <h3 className="text-lg font-medium text-[var(--color-text)] mb-4">Your Purchased Hints</h3>
                  {getPurchasedHints().length > 0 ? (
                    <div className="grid grid-cols-1 gap-4">
                      {getPurchasedHints().map((hint) => (
                        <div key={hint.id} className="border rounded-lg p-4 bg-[var(--color-bg-muted)]">
                          <div className="flex items-center mb-2">
                            <Lightbulb className="h-5 w-5 text-yellow-500 mr-2" />
                            <span className="font-medium text-[var(--color-text)]">Hint</span>
                          </div>
                          
                          {hint.quality_hint_for && (
                            <div className="mb-2">
                              <span className="text-sm text-[var(--color-text-muted)]">Hint for: </span>
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${OIL_QUALITY_COLORS[hint.quality_hint_for as OilQuality]}`}>
                                {OIL_QUALITY_LABELS[hint.quality_hint_for as OilQuality]}
                              </span>
                            </div>
                          )}
                          
                          <p className="text-[var(--color-text)]">{hint.text}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Lightbulb className="h-12 w-12 text-[var(--color-text-muted)] mx-auto mb-4" />
                      <p className="text-[var(--color-text-muted)]">No hints purchased yet</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Result Toast */}
        {showResult && (
          <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg border ${
            showResult.success 
              ? 'bg-green-100 border-green-300 text-green-800' 
              : 'bg-red-100 border-red-300 text-red-800'
          }`}>
            <div className="flex items-center">
              <div className="flex-shrink-0">
                {showResult.success ? (
                  <div className="w-5 h-5 bg-green-400 rounded-full"></div>
                ) : (
                  <div className="w-5 h-5 bg-red-400 rounded-full"></div>
                )}
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium">{showResult.message}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}