import React, { useState } from 'react'
import { Menu, X, Users, Calendar, Trophy, LogOut, Zap } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useProfile } from '../hooks/useProfile'
import { useLanguage } from '../contexts/LanguageContext'
import { useScheduleVisibility } from '../hooks/useScheduleVisibility'
import LanguageSwitcher from './LanguageSwitcher'

interface NavigationProps {
  currentPage: string
  onPageChange: (page: string) => void
}

export default function Navigation({ currentPage, onPageChange }: NavigationProps) {
  const { signOut } = useAuth()
  const { profile } = useProfile()
  const { t } = useLanguage()
  const { scheduleVisible } = useScheduleVisibility()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut()
  }

  const navigationItems = [
    { id: 'dashboard', name: t('dashboard'), icon: Users },
    ...(profile?.is_admin || scheduleVisible ? [{ id: 'schedule', name: t('schedule'), icon: Calendar }] : []),
    { id: 'sports', name: t('teams'), icon: Trophy },
    { id: 'oil-extraction', name: 'Oil Extraction', icon: Zap }
  ]

  const handlePageChange = (page: string) => {
    onPageChange(page)
    setIsMenuOpen(false)
  }

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Title */}
          <div className="flex items-center space-x-2">
            <Users className="h-8 w-8 text-orange-500" />
            <h1 className="text-xl font-bold text-gray-900">
              Camp Teams
            </h1>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            {navigationItems.map((item) => {
              const Icon = item.icon
              return (
                <button
                  key={item.id}
                  onClick={() => handlePageChange(item.id)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    currentPage === item.id
                      ? 'text-orange-600 bg-orange-50'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </button>
              )
            })}
          </nav>

          {/* User Info and Actions */}
          <div className="flex items-center space-x-4">
            {/* Language Switcher */}
            <LanguageSwitcher />
            
            {profile?.is_admin && (
              <span className="hidden md:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                {t('admin')}
              </span>
            )}
            
            {/* Desktop Sign Out */}
            <button
              onClick={handleSignOut}
              className="hidden md:inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-gray-500 bg-white hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
            >
              <LogOut className="h-4 w-4 mr-2" />
              {t('logout')}
            </button>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-orange-500"
            >
              {isMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t">
            {navigationItems.map((item) => {
              const Icon = item.icon
              return (
                <button
                  key={item.id}
                  onClick={() => handlePageChange(item.id)}
                  className={`flex items-center space-x-3 w-full px-3 py-2 rounded-md text-base font-medium transition-colors ${
                    currentPage === item.id
                      ? 'text-orange-600 bg-orange-50'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </button>
              )
            })}
            
            {/* Mobile Sign Out */}
            <button
              onClick={handleSignOut}
              className="flex items-center space-x-3 w-full px-3 py-2 rounded-md text-base font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <LogOut className="h-5 w-5" />
              <span>{t('logout')}</span>
            </button>
          </div>
        </div>
      )}
    </header>
  )
} 