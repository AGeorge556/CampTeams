import React, { useState, useEffect, lazy, Suspense } from 'react'
import { useAuth } from './hooks/useAuth'
import { useProfile } from './hooks/useProfile'
import { useRulesAcceptance } from './hooks/useRulesAcceptance'
import { useGalleryVisibility } from './hooks/useGalleryVisibility'
import { ThemeProvider } from './contexts/ThemeContext'
import { useCamp } from './contexts/CampContext'
import Auth from './components/Auth'
import ResetPassword from './components/ResetPassword'
import OnboardingForm from './components/OnboardingForm'
import TeamSelection from './components/TeamSelection'
import CampRegistrationOnboarding from './components/CampRegistrationOnboarding'
import RulesAgreement from './components/RulesAgreement'
import Dashboard from './components/Dashboard'
import Schedule from './components/Schedule'
import SportsSelection from './components/SportsSelection'
const BigGame = lazy(() => import('./components/BigGame'))
import MyProfile from './components/MyProfile'
//
// Oil Extraction (old big game — kept for reference, safe to delete)
// import OilExtractionGame from './components/OilExtractionGame'
// import AdminCoinManagement from './components/oil-extraction/AdminCoinManagement'
// import TeamExcavation from './components/oil-extraction/TeamExcavation'
// import OilShop from './components/oil-extraction/OilShop'
// import EconomyDashboard from './components/oil-extraction/EconomyDashboard'
import Gallery from './components/Gallery'
import GalleryModeration from './components/GalleryModeration'
import Layout from './components/Layout'
import Navigation from './components/Navigation'
import BottomNav from './components/BottomNav'
import LandingPage from './components/LandingPage'
import ErrorBoundary from './components/ErrorBoundary'
import { ToastProvider } from './components/Toast'
import LoadingSpinner from './components/LoadingSpinner'
import { LanguageProvider } from './contexts/LanguageContext'
import { CampProvider } from './contexts/CampContext'
import LanguageNotification from './components/LanguageNotification'
import Scoreboard from './components/Scoreboard'
import ScoreboardAdmin from './components/ScoreboardAdmin'
import AttendanceCheckIn from './components/AttendanceCheckIn'
// SINGLE-CAMP MODE: CampSelection commented out — context auto-picks the active camp
// import CampSelection from './components/CampSelection'
import CampLandingPage from './components/CampLandingPage'
import { supabase } from './lib/supabase'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'

function App() {
  const { user, loading: authLoading } = useAuth()
  const { profile, loading: profileLoading } = useProfile()
  const [currentPage, setCurrentPage] = useState('dashboard')
  const [authCallbackStatus, setAuthCallbackStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  // Check if we're on the reset password page
  const isResetPasswordPage = window.location.pathname.includes('/auth/reset-password') ||
    (window.location.hash.includes('type=recovery') && window.location.hash.includes('access_token'))

  // If on reset password page, show that component
  if (isResetPasswordPage) {
    return (
      <ErrorBoundary>
        <ThemeProvider>
          <LanguageProvider>
            <ToastProvider>
              <ResetPassword />
            </ToastProvider>
          </LanguageProvider>
        </ThemeProvider>
      </ErrorBoundary>
    )
  }

  // Handle auth callback from email links
  useEffect(() => {
    const handleAuthCallback = async () => {
      // Check if we're on an auth callback URL
      const urlParams = new URLSearchParams(window.location.search)
      const accessToken = urlParams.get('access_token')
      const refreshToken = urlParams.get('refresh_token')
      const error = urlParams.get('error')
      const errorDescription = urlParams.get('error_description')

      if (accessToken && refreshToken) {
        setAuthCallbackStatus('loading')
        try {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          })

          if (sessionError) {
            console.error('Auth callback error:', sessionError)
            setAuthCallbackStatus('error')
          } else {
            setAuthCallbackStatus('success')
            // Clear the URL parameters
            window.history.replaceState({}, document.title, window.location.pathname)
            // Reload the page to update the auth state
            setTimeout(() => {
              window.location.reload()
            }, 2000)
          }
        } catch (error) {
          console.error('Auth callback error:', error)
          setAuthCallbackStatus('error')
        }
      } else if (error) {
        console.error('Auth error:', error, errorDescription)
        setAuthCallbackStatus('error')
      }
    }

    handleAuthCallback()
  }, [])

  // Handle QR code URLs for attendance check-in
  useEffect(() => {
    const handleQRCodeURL = () => {
      // Check for attendance query parameter
      const urlParams = new URLSearchParams(window.location.search)
      const attendanceSessionId = urlParams.get('attendance')
      
      if (attendanceSessionId) {
        // Navigate to attendance check-in page with session ID
        setCurrentPage('attendance-checkin')
        
        // Store the session ID in sessionStorage for the attendance component to use
        sessionStorage.setItem('qr_session_id', attendanceSessionId)
        
        // Clean up the URL by removing the query parameter
        const newUrl = window.location.pathname
        window.history.replaceState({}, document.title, newUrl)
        
        return
      }
      
      // Also check for path-based attendance URLs (for backward compatibility)
      const path = window.location.pathname
      const attendanceMatch = path.match(/^\/attendance\/(session_.+)$/)
      if (attendanceMatch) {
        const sessionId = attendanceMatch[1]
        
        // Navigate to attendance check-in page with session ID
        setCurrentPage('attendance-checkin')
        
        // Store the session ID in sessionStorage for the attendance component to use
        sessionStorage.setItem('qr_session_id', sessionId)
        
        // Clean up the URL
        window.history.replaceState({}, document.title, '/')
        
        return
      }
    }

    handleQRCodeURL()
  }, [])

  // Show auth callback UI if processing
  if (authCallbackStatus === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--gradient-app-bg)] px-4">
        <div className="max-w-md w-full text-center">
          <div className="mb-6">
            <Loader2 className="h-16 w-16 text-orange-500 mx-auto animate-spin" />
          </div>
          <h1 className="text-2xl font-bold text-[var(--color-text)] mb-4">Processing Authentication</h1>
          <p className="text-[var(--color-text-muted)]">Please wait while we complete your sign-in...</p>
        </div>
      </div>
    )
  }

  if (authCallbackStatus === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--gradient-app-bg)] px-4">
        <div className="max-w-md w-full text-center">
          <div className="mb-6">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
          </div>
          <h1 className="text-2xl font-bold text-[var(--color-text)] mb-4">Authentication Successful</h1>
          <p className="text-[var(--color-text-muted)] mb-6">Redirecting to the app...</p>
          <div className="flex items-center justify-center">
            <Loader2 className="h-5 w-5 text-green-500 animate-spin mr-2" />
            <span className="text-green-600">Loading...</span>
          </div>
        </div>
      </div>
    )
  }

  if (authCallbackStatus === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--gradient-app-bg)] px-4">
        <div className="max-w-md w-full text-center">
          <div className="mb-6">
            <XCircle className="h-16 w-16 text-red-500 mx-auto" />
          </div>
          <h1 className="text-2xl font-bold text-[var(--color-text)] mb-4">Authentication Failed</h1>
          <p className="text-[var(--color-text-muted)] mb-6">There was an error processing your authentication. Please try signing in again.</p>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <LanguageProvider>
          <ToastProvider>
            <CampProvider>
              <AppContent
                user={user}
                authLoading={authLoading}
                profile={profile}
                profileLoading={profileLoading}
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
              />
            </CampProvider>
          </ToastProvider>
        </LanguageProvider>
      </ThemeProvider>
    </ErrorBoundary>
  )
}

function AppContent({
  user,
  authLoading,
  profile,
  profileLoading,
  currentPage,
  setCurrentPage
}: {
  user: ReturnType<typeof useAuth>['user']
  authLoading: boolean
  profile: ReturnType<typeof useProfile>['profile']
  profileLoading: boolean
  currentPage: string
  setCurrentPage: (page: string) => void
}) {
  const { hasAccepted, loading: rulesLoading } = useRulesAcceptance()
  const { galleryVisible } = useGalleryVisibility()
  const { currentCamp, currentRegistration, isRegistered, loading: campLoading } = useCamp()
  const [showCampLanding, setShowCampLanding] = useState(false)

  // Check if user should see the camp landing page
  useEffect(() => {
    if (currentCamp && isRegistered && !campLoading) {
      const hasViewedLanding = sessionStorage.getItem(`camp_landing_viewed_${currentCamp.id}`)
      if (!hasViewedLanding) {
        setShowCampLanding(true)
      } else {
        setShowCampLanding(false)
      }
    }
  }, [currentCamp, isRegistered, campLoading])

  // BIG GAME ROUTE GUARD — Uncomment and update when new game is added
  // useEffect(() => {
  //   if (currentPage === 'big-game' && !bigGameVisible && !profile?.is_admin) {
  //     setCurrentPage('dashboard')
  //   }
  // }, [currentPage, bigGameVisible, profile?.is_admin, setCurrentPage])

  // Redirect to dashboard if user is on gallery page but it's hidden and they're not admin
  useEffect(() => {
    if (currentPage.startsWith('gallery') && !galleryVisible && !profile?.is_admin) {
      setCurrentPage('dashboard')
    }
  }, [currentPage, galleryVisible, profile?.is_admin, setCurrentPage])

  if (authLoading || profileLoading || rulesLoading || campLoading) {
    return <LoadingSpinner fullScreen text="Loading..." />
  }

  if (!user) {
    return <LandingPage />
  }

  // Only show onboarding if user exists but profile is null AND profile loading is complete
  if (!profile && !profileLoading) {
    return <OnboardingForm />
  }

  // If profile is still loading, show loading spinner
  if (profileLoading) {
    return <LoadingSpinner fullScreen text="Loading profile..." />
  }

  if (hasAccepted === false) {
    return <RulesAgreement />
  }

  // SINGLE-CAMP MODE: if auto-select found no active camp, show a message
  // To restore multi-camp selection: uncomment CampSelection import above and swap this block
  if (!currentCamp) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--gradient-app-bg)] px-4">
        <div className="text-center">
          <p className="text-2xl font-bold text-[var(--color-text)] mb-2">No Active Camp</p>
          <p className="text-[var(--color-text-muted)]">Please check back soon — camp registration will open shortly.</p>
        </div>
      </div>
    )
  }

  // If camp is selected but user is not registered for it, check registration_open first
  if (currentCamp && !isRegistered && !campLoading) {
    if (!currentCamp.registration_open) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--gradient-app-bg)] px-4">
          <div
            style={{
              background: 'var(--color-card-bg)',
              border: '1px solid var(--color-border)',
              borderRadius: '12px',
              padding: '2.5rem',
              maxWidth: '420px',
              width: '100%',
              textAlign: 'center',
            }}
          >
            <p style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🔒</p>
            <h1
              style={{
                fontSize: '1.5rem',
                fontWeight: 700,
                color: 'var(--color-text)',
                marginBottom: '0.75rem',
              }}
            >
              {currentCamp.name}
            </h1>
            <p
              style={{
                color: 'var(--color-text)',
                fontWeight: 500,
                marginBottom: '0.5rem',
              }}
            >
              Registration is currently closed.
            </p>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
              Please contact the camp organizers for more information.
            </p>
          </div>
        </div>
      )
    }
    return <CampRegistrationOnboarding />
  }

  // Show camp landing page after registration (only once per session)
  if (showCampLanding && currentCamp && isRegistered) {
    return (
      <CampLandingPage
        onEnter={() => {
          setShowCampLanding(false)
        }}
      />
    )
  }

  // If user is registered for camp but no team assigned, show team selection
  // Admins bypass this so they can still access the admin panel without a team
  if (currentRegistration && !currentRegistration.current_team && !profile?.is_admin) {
    return <TeamSelection />
  }

  return (
    <div className="min-h-screen bg-[var(--gradient-app-bg)]">
      <Navigation currentPage={currentPage} onPageChange={setCurrentPage} />
      <BottomNav currentPage={currentPage} onPageChange={setCurrentPage} />
      <Layout>
        {(() => {
          switch (currentPage) {
            case 'schedule':
              return <Schedule />
            case 'sports':
              return <SportsSelection />
            case 'gallery':
              return <Gallery />
            case 'gallery-moderation':
              return <GalleryModeration />
            case 'scoreboard':
              return <Scoreboard />
            case 'scoreboard-admin':
              return <ScoreboardAdmin />
            case 'attendance-checkin':
              return <AttendanceCheckIn />
            case 'big-game':
              return <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-primary)]" /></div>}><BigGame /></Suspense>
            case 'profile':
              return <MyProfile />
            //
            // Oil Extraction routes (old big game — safe to delete)
            // case 'oil-extraction':
            //   return <OilExtractionGame onPageChange={setCurrentPage} />
            // case 'oil-extraction-admin':
            //   return <AdminCoinManagement onPageChange={setCurrentPage} />
            // case 'oil-extraction-team':
            //   return <TeamExcavation onPageChange={setCurrentPage} />
            // case 'oil-extraction-shop':
            //   return <OilShop onPageChange={setCurrentPage} />
            // case 'oil-extraction-economy':
            //   return <EconomyDashboard onPageChange={setCurrentPage} />
            default:
              return <Dashboard onPageChange={setCurrentPage} />
          }
        })()}
      </Layout>
      <LanguageNotification />
    </div>
  )
}

export default App