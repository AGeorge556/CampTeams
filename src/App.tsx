import React, { useState } from 'react'
import { useAuth } from './hooks/useAuth'
import { useProfile } from './hooks/useProfile'
import Auth from './components/Auth'
import OnboardingForm from './components/OnboardingForm'
import Dashboard from './components/Dashboard'
import Schedule from './components/Schedule'
import SportsSelection from './components/SportsSelection'
import Layout from './components/Layout'
import Navigation from './components/Navigation'
import LandingPage from './components/LandingPage'
import ErrorBoundary from './components/ErrorBoundary'
import { ToastProvider } from './components/Toast'
import LoadingSpinner from './components/LoadingSpinner'
import { LanguageProvider } from './contexts/LanguageContext'
import LanguageNotification from './components/LanguageNotification'

function App() {
  const { user, loading: authLoading } = useAuth()
  const { profile, loading: profileLoading } = useProfile()
  const [currentPage, setCurrentPage] = useState('dashboard')

  return (
    <ErrorBoundary>
      <LanguageProvider>
      <ToastProvider>
        {authLoading || profileLoading ? (
          <LoadingSpinner fullScreen text="Loading..." />
        ) : !user ? (
          <LandingPage />
        ) : !profile ? (
          <OnboardingForm />
        ) : (
          <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50">
            <Navigation currentPage={currentPage} onPageChange={setCurrentPage} />
    <Layout>
              {(() => {
                switch (currentPage) {
                  case 'schedule':
                    return <Schedule />
                  case 'sports':
                    return <SportsSelection />
                  default:
                    return <Dashboard onPageChange={setCurrentPage} />
                }
              })()}
    </Layout>
              <LanguageNotification />
          </div>
        )}
      </ToastProvider>
      </LanguageProvider>
    </ErrorBoundary>
  )
}

export default App