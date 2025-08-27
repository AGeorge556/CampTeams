import React, { useState, useEffect } from 'react'
import { useAuth } from './hooks/useAuth'
import { useProfile } from './hooks/useProfile'
import { useRulesAcceptance } from './hooks/useRulesAcceptance'
import { useOilExtractionVisibility } from './hooks/useOilExtractionVisibility'
import { useGalleryVisibility } from './hooks/useGalleryVisibility'
import { ThemeProvider } from './contexts/ThemeContext'
import Auth from './components/Auth'
import OnboardingForm from './components/OnboardingForm'
import RulesAgreement from './components/RulesAgreement'
import Dashboard from './components/Dashboard'
import Schedule from './components/Schedule'
import SportsSelection from './components/SportsSelection'
import OilExtractionGame from './components/OilExtractionGame'
import AdminCoinManagement from './components/oil-extraction/AdminCoinManagement'
import TeamExcavation from './components/oil-extraction/TeamExcavation'
import OilShop from './components/oil-extraction/OilShop'
import EconomyDashboard from './components/oil-extraction/EconomyDashboard'
import Gallery from './components/Gallery'
import GalleryModeration from './components/GalleryModeration'
import Layout from './components/Layout'
import Navigation from './components/Navigation'
import LandingPage from './components/LandingPage'
import ErrorBoundary from './components/ErrorBoundary'
import { ToastProvider } from './components/Toast'
import LoadingSpinner from './components/LoadingSpinner'
import { LanguageProvider } from './contexts/LanguageContext'
import LanguageNotification from './components/LanguageNotification'
import Scoreboard from './components/Scoreboard'
import ScoreboardAdmin from './components/ScoreboardAdmin'
import AttendanceCheckIn from './components/AttendanceCheckIn'
import { supabase } from './lib/supabase'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'

function App() {
  const { user, loading: authLoading } = useAuth()
  const { profile, loading: profileLoading } = useProfile()
  const [currentPage, setCurrentPage] = useState('dashboard')
  const [authCallbackStatus, setAuthCallbackStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

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
      const path = window.location.pathname
      
      // Check if URL matches attendance QR code pattern: /attendance/session_*
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
            <AppContent 
            user={user} 
            authLoading={authLoading} 
            profile={profile} 
            profileLoading={profileLoading}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
          />
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
  user: any
  authLoading: boolean
  profile: any
  profileLoading: boolean
  currentPage: string
  setCurrentPage: (page: string) => void
}) {
  const { hasAccepted, loading: rulesLoading } = useRulesAcceptance()
  const { oilExtractionVisible } = useOilExtractionVisibility()
  const { galleryVisible } = useGalleryVisibility()

  // Redirect to dashboard if user is on oil extraction page but it's hidden and they're not admin
  useEffect(() => {
    if (currentPage.startsWith('oil-extraction') && !oilExtractionVisible && !profile?.is_admin) {
      setCurrentPage('dashboard')
    }
  }, [currentPage, oilExtractionVisible, profile?.is_admin, setCurrentPage])

  // Redirect to dashboard if user is on gallery page but it's hidden and they're not admin
  useEffect(() => {
    if (currentPage.startsWith('gallery') && !galleryVisible && !profile?.is_admin) {
      setCurrentPage('dashboard')
    }
  }, [currentPage, galleryVisible, profile?.is_admin, setCurrentPage])

  if (authLoading || profileLoading || rulesLoading) {
    return <LoadingSpinner fullScreen text="Loading..." />
  }

  if (!user) {
    return <LandingPage />
  }

  if (!profile) {
    return <OnboardingForm />
  }

  if (hasAccepted === false) {
    return <RulesAgreement />
  }

  return (
    <div className="min-h-screen bg-[var(--gradient-app-bg)]">
      <Navigation currentPage={currentPage} onPageChange={setCurrentPage} />
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
            case 'oil-extraction':
              return <OilExtractionGame onPageChange={setCurrentPage} />
            case 'oil-extraction-admin':
              return <AdminCoinManagement onPageChange={setCurrentPage} />
            case 'oil-extraction-team':
              return <TeamExcavation onPageChange={setCurrentPage} />
            case 'oil-extraction-shop':
              return <OilShop onPageChange={setCurrentPage} />
            case 'oil-extraction-economy':
              return <EconomyDashboard onPageChange={setCurrentPage} />
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