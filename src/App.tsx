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

function App() {
  const { user, loading: authLoading } = useAuth()
  const { profile, loading: profileLoading } = useProfile()
  const [currentPage, setCurrentPage] = useState('dashboard')

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500"></div>
      </div>
    )
  }

  if (!user) {
    return <LandingPage />
  }

  if (!profile) {
    return <OnboardingForm />
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'schedule':
        return <Schedule />
      case 'sports':
        return <SportsSelection />
      default:
        return <Dashboard />
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50">
      <Navigation currentPage={currentPage} onPageChange={setCurrentPage} />
      <Layout>
        {renderPage()}
      </Layout>
    </div>
  )
}

export default App