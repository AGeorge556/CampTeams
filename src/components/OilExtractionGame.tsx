import React, { useState } from 'react'
import { useProfile } from '../hooks/useProfile'
import { useGameSessions } from '../hooks/useGameSessions'
import { useTeamWallets } from '../hooks/useTeamWallets'
import { UserRole } from '../lib/types'
import AdminDashboard from './oil-extraction/AdminDashboard'
import ShopOwnerDashboard from './oil-extraction/ShopOwnerDashboard'
import TeamLeaderDashboard from './oil-extraction/TeamLeaderDashboard'
import AdminCoinManagement from './oil-extraction/AdminCoinManagement'
import TeamExcavation from './oil-extraction/TeamExcavation'
import OilShop from './oil-extraction/OilShop'
import EconomyDashboard from './oil-extraction/EconomyDashboard'
import LoadingSpinner from './LoadingSpinner'

interface OilExtractionGameProps {
  onPageChange?: (page: string) => void
}

export default function OilExtractionGame({ onPageChange }: OilExtractionGameProps) {
  const { profile } = useProfile()
  const { loading: sessionsLoading } = useGameSessions()
  const { loading: walletsLoading } = useTeamWallets()

  if (!profile) {
    return <LoadingSpinner text="Loading profile..." />
  }

  if (sessionsLoading || walletsLoading) {
    return <LoadingSpinner text="Loading game data..." />
  }

  const renderDashboard = () => {
    const role = profile.role as UserRole

    switch (role) {
      case 'admin':
        return (
          <div className="space-y-6 sm:space-y-8">
            {/* Admin Controls Card */}
            <div className="bg-[var(--color-card-bg)] rounded-xl shadow-sm border border-[var(--color-border)] overflow-hidden">
              <div className="bg-gradient-to-r from-sky-500 to-sky-600 px-4 sm:px-6 py-3">
                <h2 className="text-lg sm:text-xl font-semibold text-white flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                  </svg>
                  Admin Controls
                </h2>
              </div>
              <div className="p-4 sm:p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <button
                    onClick={() => onPageChange?.('oil-extraction-admin')}
                    className="group relative flex items-center justify-center px-4 py-3 sm:py-4 border border-transparent text-sm sm:text-base font-medium rounded-lg text-white bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition-all duration-200 shadow-sm hover:shadow-md"
                  >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                    Coin Management
                  </button>
                  <button
                    onClick={() => onPageChange?.('oil-extraction-economy')}
                    className="group relative flex items-center justify-center px-4 py-3 sm:py-4 border border-transparent text-sm sm:text-base font-medium rounded-lg text-white bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all duration-200 shadow-sm hover:shadow-md"
                  >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    Economy Dashboard
                  </button>
                </div>
              </div>
            </div>
            <AdminDashboard />
          </div>
        )
      case 'shop_owner':
        return (
          <div className="space-y-6 sm:space-y-8">
            {/* Shop Actions Card */}
            <div className="bg-[var(--color-card-bg)] rounded-xl shadow-sm border border-[var(--color-border)] overflow-hidden">
              <div className="bg-gradient-to-r from-green-500 to-green-600 px-4 sm:px-6 py-3">
                <h2 className="text-lg sm:text-xl font-semibold text-white flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
                  </svg>
                  Shop Actions
                </h2>
              </div>
              <div className="p-4 sm:p-6">
                <button
                  onClick={() => onPageChange?.('oil-extraction-shop')}
                  className="w-full group relative flex items-center justify-center px-4 py-3 sm:py-4 border border-transparent text-sm sm:text-base font-medium rounded-lg text-white bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  Oil Trading Shop
                </button>
              </div>
            </div>
            <ShopOwnerDashboard />
          </div>
        )
      case 'team_leader':
        return (
          <div className="space-y-6 sm:space-y-8">
            {/* Team Actions Card */}
            <div className="bg-[var(--color-card-bg)] rounded-xl shadow-sm border border-[var(--color-border)] overflow-hidden">
              <div className="bg-gradient-to-r from-sky-500 to-sky-600 px-4 sm:px-6 py-3">
                <h2 className="text-lg sm:text-xl font-semibold text-white flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                  </svg>
                  Team Actions
                </h2>
              </div>
              <div className="p-4 sm:p-6">
                <button
                  onClick={() => onPageChange?.('oil-extraction-team')}
                  className="w-full group relative flex items-center justify-center px-4 py-3 sm:py-4 border border-transparent text-sm sm:text-base font-medium rounded-lg text-white bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  Excavation Site
                </button>
              </div>
            </div>
            <TeamLeaderDashboard />
          </div>
        )
      default:
        return (
          <div className="text-center py-8">
            <div className="bg-[var(--color-card-bg)] rounded-xl shadow-sm border border-[var(--color-border)] p-6 sm:p-8">
              <svg className="w-16 h-16 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <h2 className="text-xl sm:text-2xl font-bold text-[var(--color-text)] mb-4">
                Access Denied
              </h2>
              <p className="text-[var(--color-text-muted)] text-sm sm:text-base">
                You don't have permission to access the Oil Extraction Game.
              </p>
            </div>
          </div>
        )
    }
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          {/* Title and Description */}
          <div className="text-center sm:text-left mb-6">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[var(--color-text)] mb-2">
              Oil Extraction Game
            </h1>
            <p className="text-sm sm:text-base text-[var(--color-text-muted)] max-w-2xl mx-auto sm:mx-0">
              Welcome to the oil extraction game! Each team has a wallet with coins to spend on excavation and hints.
            </p>
          </div>

          {/* Role and Team Badges */}
          <div className="flex flex-wrap justify-center sm:justify-start gap-3 mb-6">
            <div className="inline-flex items-center px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-sm">
              <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
              {profile.role?.replace('_', ' ').toUpperCase()}
            </div>
            {profile.current_team && (
              <div className="inline-flex items-center px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium bg-gradient-to-r from-sky-500 to-sky-600 text-white shadow-sm">
                <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                </svg>
                {profile.current_team.toUpperCase()} TEAM
              </div>
            )}
          </div>

          {/* Economy Info Card */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-4 sm:p-6 mb-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <div className="ml-3 sm:ml-4 flex-1">
                <h3 className="text-sm sm:text-base font-semibold text-blue-900 mb-2">
                  How the Economy Works
                </h3>
                <div className="space-y-2 text-xs sm:text-sm text-blue-800">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-[var(--color-primary)] rounded-full mr-2"></div>
                    <span><strong>Coins (Orange):</strong> Used for playing - excavation & hints. Added by admins via mini-games.</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    <span><strong>Net Worth (Green):</strong> Used for winning - earned ONLY by selling oil barrels to shop owners.</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                    <span><strong>Key:</strong> Coins ≠ Net Worth. You spend coins to play, but only net worth determines the winner!</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Game Dashboard */}
        {renderDashboard()}
      </div>
    </div>
  )
}