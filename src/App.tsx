import React, { useState, useEffect } from 'react'
import { useAuth } from './hooks/useAuth'
import { useProfile } from './hooks/useProfile'
import { useRulesAcceptance } from './hooks/useRulesAcceptance'
import { useOilExtractionVisibility } from './hooks/useOilExtractionVisibility'
import { useGalleryVisibility } from './hooks/useGalleryVisibility'
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

function App() {
  const { user, loading: authLoading } = useAuth()
  const { profile, loading: profileLoading } = useProfile()
  const [currentPage, setCurrentPage] = useState('dashboard')

  return (
    <ErrorBoundary>
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
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50">
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