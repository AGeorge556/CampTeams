import React, { useState } from 'react'
import { Play, Square, Plus, Trash2, DollarSign, TrendingUp } from 'lucide-react'
import { useGameSessions } from '../../hooks/useGameSessions'
import { useTeamWallets } from '../../hooks/useTeamWallets'
import { useCoinTransactions } from '../../hooks/useCoinTransactions'
import { supabase } from '../../lib/supabase'
import { GameSession, TeamWallet, GameLeaderboardEntry } from '../../lib/types'
import { TEAM_NAMES, TEAM_COLORS } from '../../lib/types'
import Button from '../ui/Button'
import LoadingSpinner from '../LoadingSpinner'

export default function AdminDashboard() {
  const { sessions, loading: sessionsLoading, createSession, startSession, stopSession, deleteSession, getActiveSession } = useGameSessions()
  const { wallets, leaderboard, loading: walletsLoading, updateWallet, refresh: refreshWallets } = useTeamWallets()
  const { addCoinsToTeam } = useCoinTransactions()
  const [showCreateSession, setShowCreateSession] = useState(false)
  const [newSessionData, setNewSessionData] = useState({ startTime: '', endTime: '' })

  const activeSession = getActiveSession()

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createSession(newSessionData.startTime, newSessionData.endTime)
      setShowCreateSession(false)
      setNewSessionData({ startTime: '', endTime: '' })
    } catch (error) {
      console.error('Failed to create session:', error)
    }
  }

  const handleAddCoins = async (teamId: string, amount: number, description?: string) => {
    try {
      await addCoinsToTeam(teamId, amount, description)
      // The real-time subscription will automatically update the UI
      // But we can also manually refresh to ensure immediate update
      setTimeout(() => refreshWallets(), 100)
    } catch (error) {
      console.error('Failed to add coins:', error)
    }
  }

  const handleStartSession = async (sessionId: string) => {
    try {
      // Start the session
      await startSession(sessionId)
      
      // Initialize the oil grid for this session
      const { error: gridError } = await supabase
        .rpc('initialize_oil_grid', { session_id_param: sessionId })
      
      if (gridError) {
        console.error('Failed to initialize oil grid:', gridError)
      }
    } catch (error) {
      console.error('Failed to start session:', error)
    }
  }

  if (sessionsLoading || walletsLoading) {
    return <LoadingSpinner text="Loading admin dashboard..." />
  }

  return (
    <div className="space-y-8">
      {/* Game Session Management */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Game Session Management</h2>
          <Button onClick={() => setShowCreateSession(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Session
          </Button>
        </div>

        {/* Active Session Status */}
        {activeSession && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-green-900">Active Session</h3>
                <p className="text-sm text-green-700">
                  Started: {new Date(activeSession.start_time).toLocaleString()}
                </p>
                <p className="text-sm text-green-700">
                  Ends: {new Date(activeSession.end_time).toLocaleString()}
                </p>
              </div>
              <Button 
                variant="danger" 
                onClick={() => stopSession(activeSession.id)}
              >
                <Square className="h-4 w-4 mr-2" />
                Stop Session
              </Button>
            </div>
          </div>
        )}

        {/* Sessions List */}
        <div className="space-y-3">
          {sessions.map((session) => (
            <div key={session.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border rounded-lg gap-3">
              <div>
                <p className="font-medium text-sm sm:text-base">
                  {new Date(session.start_time).toLocaleDateString()} - {new Date(session.end_time).toLocaleDateString()}
                </p>
                <p className="text-sm text-gray-500">
                  {session.is_active ? 'Active' : 'Inactive'}
                </p>
              </div>
              <div className="flex space-x-2">
                {!session.is_active && (
                  <Button 
                    size="sm"
                    onClick={() => handleStartSession(session.id)}
                    className="text-xs px-2 py-1"
                  >
                    <Play className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                    Start
                  </Button>
                )}
                <Button 
                  variant="danger" 
                  size="sm"
                  onClick={() => deleteSession(session.id)}
                  className="text-xs px-2 py-1"
                >
                  <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Team Wallets Management */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Team Wallets</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {wallets.map((wallet) => (
            <div key={wallet.id} className="border rounded-lg p-4">
              <div className="flex items-center mb-3">
                <div className={`w-4 h-4 rounded-full ${TEAM_COLORS[wallet.team_id]} mr-2`} />
                <h3 className="font-medium">{TEAM_NAMES[wallet.team_id]}</h3>
              </div>
              <div className="space-y-2">
                <div>
                  <p className="text-sm text-gray-500">Coins</p>
                  <p className="font-semibold">{wallet.coins.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Net Worth</p>
                  <p className="font-semibold text-green-600">{wallet.net_worth.toLocaleString()}</p>
                </div>
                <div className="grid grid-cols-2 gap-1">
                  <Button 
                    size="sm" 
                    onClick={() => handleAddCoins(wallet.team_id, 25, 'Mini-game reward')}
                    className="text-xs px-2 py-1"
                  >
                    +25
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={() => handleAddCoins(wallet.team_id, 50, 'Mini-game reward')}
                    className="text-xs px-2 py-1"
                  >
                    +50
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={() => handleAddCoins(wallet.team_id, 75, 'Mini-game reward')}
                    className="text-xs px-2 py-1"
                  >
                    +75
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={() => handleAddCoins(wallet.team_id, 100, 'Mini-game reward')}
                    className="text-xs px-2 py-1"
                  >
                    +100
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

              {/* Leaderboard */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Leaderboard</h2>
          <div className="space-y-3">
            {leaderboard.map((entry) => (
              <div key={entry.team_id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border rounded-lg gap-3">
                <div className="flex items-center">
                  <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full ${TEAM_COLORS[entry.team_id]} mr-3 flex items-center justify-center text-white font-bold text-sm sm:text-base`}>
                    {entry.rank}
                  </div>
                  <div>
                    <h3 className="font-medium text-sm sm:text-base">{TEAM_NAMES[entry.team_id]}</h3>
                    <p className="text-xs sm:text-sm text-gray-500">
                      {entry.coins.toLocaleString()} coins
                    </p>
                  </div>
                </div>
                <div className="text-center sm:text-right">
                  <p className="font-semibold text-green-600 text-sm sm:text-base">
                    ${entry.net_worth.toLocaleString()}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-500">Net Worth</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      {/* Create Session Modal */}
      {showCreateSession && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Create New Game Session</h3>
            <form onSubmit={handleCreateSession} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Time
                </label>
                <input
                  type="datetime-local"
                  value={newSessionData.startTime}
                  onChange={(e) => setNewSessionData({ ...newSessionData, startTime: e.target.value })}
                  className="w-full border rounded-md px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Time
                </label>
                <input
                  type="datetime-local"
                  value={newSessionData.endTime}
                  onChange={(e) => setNewSessionData({ ...newSessionData, endTime: e.target.value })}
                  className="w-full border rounded-md px-3 py-2"
                  required
                />
              </div>
              <div className="flex space-x-3">
                <Button type="submit" className="flex-1">
                  Create Session
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowCreateSession(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
} 