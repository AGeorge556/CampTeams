import { useState, useEffect } from 'react'
import { Menu, X, Users, Calendar, Trophy, LogOut, Camera, QrCode, Home, Sun, Swords, User } from 'lucide-react'
import logoUrl from '../assets/Logo.png'
import { useAuth } from '../hooks/useAuth'
import { useProfile } from '../hooks/useProfile'
import { useLanguage } from '../contexts/LanguageContext'
import { useScheduleVisibility } from '../hooks/useScheduleVisibility'
import { useGalleryVisibility } from '../hooks/useGalleryVisibility'
import { useOilExtractionVisibility } from '../hooks/useOilExtractionVisibility'
import LanguageSwitcher from './LanguageSwitcher'
import { ThemeToggle } from './ThemeToggle'
import { useCamp } from '../contexts/CampContext'
import { TEAMS, TeamColor, supabase } from '../lib/supabase'

interface NavigationProps {
  currentPage: string
  onPageChange: (page: string) => void
}

export default function Navigation({ currentPage, onPageChange }: NavigationProps) {
  const { signOut, user } = useAuth()
  const { profile } = useProfile()
  const { t } = useLanguage()
  const { scheduleVisible } = useScheduleVisibility()
  const { galleryVisible } = useGalleryVisibility()
  const { oilExtractionVisible: bigGameVisible } = useOilExtractionVisibility()
  const { currentRegistration } = useCamp()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [newGalleryCount, setNewGalleryCount] = useState(0)

  useEffect(() => {
    if (!user?.id || !currentRegistration?.camp_id) return
    const campId = currentRegistration.camp_id
    const userId = user.id
    const lastSeen = localStorage.getItem(`gallery_seen_${userId}_${campId}`) || '1970-01-01'
    supabase
      .from('camp_gallery')
      .select('id', { count: 'exact', head: true })
      .eq('camp_id', campId)
      .eq('user_id', userId)
      .eq('status', 'approved')
      .gt('updated_at', lastSeen)
      .then(({ count }) => setNewGalleryCount(count || 0))
  }, [user?.id, currentRegistration?.camp_id])

  const handleSignOut = async () => {
    await signOut()
  }

  const userTeam = currentRegistration?.current_team
    ? TEAMS[currentRegistration.current_team as TeamColor]
    : null

  const userInitials = profile?.full_name
    ? profile.full_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : '?'

  const navigationItems = [
    { id: 'dashboard', name: 'Home', icon: Home },
    ...(profile?.is_admin || scheduleVisible ? [{ id: 'schedule', name: t('schedule'), icon: Calendar }] : []),
    { id: 'sports', name: t('teams'), icon: Trophy },
    { id: 'attendance-checkin', name: 'Check In', icon: QrCode },
    ...(profile?.is_admin || galleryVisible ? [{ id: 'gallery', name: t('gallery'), icon: Camera }] : []),
    ...(profile?.is_admin || bigGameVisible ? [{ id: 'big-game', name: 'Big Game', icon: Swords }] : []),
    { id: 'profile', name: 'Profile', icon: User },
  ]

  const handlePageChange = (page: string) => {
    if (page === 'gallery' && user?.id && currentRegistration?.camp_id) {
      localStorage.setItem(`gallery_seen_${user.id}_${currentRegistration.camp_id}`, new Date().toISOString())
      setNewGalleryCount(0)
    }
    onPageChange(page)
    setIsMenuOpen(false)
  }

  return (
    <header className="bg-[var(--color-bg)] border-b-2 border-[var(--color-border)] shadow-[var(--shadow-sm)] sticky top-0 z-50 transition-all duration-300">
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-12 xl:px-20">
        <div className="flex justify-between items-center h-[68px]">

          {/* Logo */}
          <button
            onClick={() => handlePageChange('dashboard')}
            className="flex items-center space-x-2.5 group"
          >
            <img
              src={logoUrl}
              alt="BCH Youth"
              className="h-11 w-11 rounded-xl object-contain shadow-md group-hover:shadow-lg transition-shadow duration-200"
            />
            <span className="text-sm font-bold text-[var(--color-primary)] uppercase tracking-widest">
              BCH Youth
            </span>
          </button>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center space-x-2">
            {navigationItems.map((item) => {
              const Icon = item.icon
              const isActive = currentPage === item.id
              const hasBadge = item.id === 'gallery' && newGalleryCount > 0
              return (
                <button
                  key={item.id}
                  onClick={() => handlePageChange(item.id)}
                  className={`relative flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-[var(--color-primary)] text-white shadow-md'
                      : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg-muted)]'
                  }`}
                >
                  <div className="relative">
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    {hasBadge && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full ring-1 ring-white dark:ring-[var(--color-bg)]" />
                    )}
                  </div>
                  <span>{item.name}</span>
                </button>
              )
            })}
          </nav>

          {/* Right side controls */}
          <div className="flex items-center space-x-2">
            <ThemeToggle />
            <LanguageSwitcher />

            {/* Desktop user info + logout */}
            <div className="hidden md:flex items-center space-x-2">
              {profile?.is_admin && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-200">
                  {t('admin')}
                </span>
              )}
              <div className="flex items-center space-x-2 pl-2 pr-3 py-1.5 rounded-full bg-[var(--color-bg-muted)] border border-[var(--color-border)]">
                <button
                  onClick={() => handlePageChange('profile')}
                  className="flex items-center space-x-2 focus:outline-none group"
                  title="My Profile"
                >
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm flex-shrink-0 group-hover:ring-2 group-hover:ring-[var(--color-primary)] transition-all ${userTeam?.color ?? 'bg-gray-400'}`}
                  >
                    {userInitials}
                  </div>
                  {userTeam && (
                    <span className="text-xs font-medium text-[var(--color-text-muted)] group-hover:text-[var(--color-text)] transition-colors">
                      {userTeam.name}
                    </span>
                  )}
                </button>
                <button
                  onClick={handleSignOut}
                  className="text-[var(--color-text-muted)] hover:text-[var(--color-danger)] transition-colors ml-1"
                  title={t('logout')}
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Mobile hamburger */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden inline-flex items-center justify-center p-2 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg-muted)] transition-colors"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu drawer */}
      {isMenuOpen && (
        <div className="md:hidden border-t-2 border-[var(--color-border)] bg-[var(--color-bg)] shadow-lg animate-slide-down">

          {/* User info header */}
          <div className="px-4 py-3 bg-[var(--color-bg-muted)] border-b border-[var(--color-border)] flex items-center space-x-3">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shadow ${userTeam?.color ?? 'bg-gray-400'}`}
            >
              {userInitials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[var(--color-text)] truncate">
                {profile?.full_name?.split(' ')[0] ?? 'Camper'}
              </p>
              <p className="text-xs text-[var(--color-text-muted)]">
                {userTeam ? `${userTeam.name} Team` : 'No team assigned'}
                {profile?.is_admin && ' • Admin'}
              </p>
            </div>
            <img src={logoUrl} alt="BCH Youth" className="w-11 h-11 rounded-xl object-contain" />
          </div>

          {/* Nav links */}
          <div className="px-3 py-3 space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon
              const isActive = currentPage === item.id
              const hasBadge = item.id === 'gallery' && newGalleryCount > 0
              return (
                <button
                  key={item.id}
                  onClick={() => handlePageChange(item.id)}
                  className={`flex items-center space-x-3 w-full px-4 py-3 rounded-xl text-base font-medium transition-all ${
                    isActive
                      ? 'bg-[var(--color-primary)] text-white shadow-sm'
                      : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg-muted)]'
                  }`}
                >
                  <div className="relative">
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    {hasBadge && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
                    )}
                  </div>
                  <span>{item.name}</span>
                  {hasBadge && (
                    <span className="ml-auto text-xs font-bold bg-red-500 text-white px-1.5 py-0.5 rounded-full">
                      {newGalleryCount}
                    </span>
                  )}
                </button>
              )
            })}

            {/* Logout */}
            <button
              onClick={handleSignOut}
              className="flex items-center space-x-3 w-full px-4 py-3 rounded-xl text-base font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40 transition-colors"
            >
              <LogOut className="h-5 w-5 flex-shrink-0" />
              <span>{t('logout')}</span>
            </button>
          </div>
        </div>
      )}
    </header>
  )
}
