import React from 'react'
import { useAuth } from './hooks/useAuth'
import { useProfile } from './hooks/useProfile'
import Auth from './components/Auth'
import OnboardingForm from './components/OnboardingForm'
import Dashboard from './components/Dashboard'
import Layout from './components/Layout'

function App() {
  const { user, loading: authLoading } = useAuth()
  const { profile, loading: profileLoading } = useProfile()

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500"></div>
      </div>
    )
  }

  if (!user) {
    return <Auth />
  }

  if (!profile) {
    return <OnboardingForm />
  }

  return (
    <Layout>
      <Dashboard />
    </Layout>
  )
}

export default App