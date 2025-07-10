import React, { useState, useEffect } from 'react'
import { Users, Calendar, Sun, Star, ArrowRight, Flame, Trees, Mountain } from 'lucide-react'
import Auth from './Auth'

interface CountdownTime {
  days: number
  hours: number
  minutes: number
  seconds: number
}

export default function LandingPage() {
  const [countdown, setCountdown] = useState<CountdownTime>({ days: 0, hours: 0, minutes: 0, seconds: 0 })
  const [showAuth, setShowAuth] = useState(false)
  const [authMode, setAuthMode] = useState<'signup' | 'signin'>('signup')

  useEffect(() => {
    const campDate = new Date('2025-08-28T00:00:00')
    
    const updateCountdown = () => {
      const now = new Date()
      const difference = campDate.getTime() - now.getTime()
      
      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24))
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))
        const seconds = Math.floor((difference % (1000 * 60)) / 1000)
        
        setCountdown({ days, hours, minutes, seconds })
      }
    }
    
    updateCountdown()
    const timer = setInterval(updateCountdown, 1000)
    
    return () => clearInterval(timer)
  }, [])

  const handleGetStarted = () => {
    setAuthMode('signup')
    setShowAuth(true)
  }

  const handleSignIn = () => {
    setAuthMode('signin')
    setShowAuth(true)
  }

  if (showAuth) {
    return <Auth initialMode={authMode} onBack={() => setShowAuth(false)} />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-yellow-50 to-orange-100 relative overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-10 left-10 text-orange-200 opacity-20">
          <Sun size={120} />
        </div>
        <div className="absolute top-20 right-20 text-yellow-200 opacity-20">
          <Star size={80} />
        </div>
        <div className="absolute bottom-20 left-20 text-green-200 opacity-20">
          <Trees size={100} />
        </div>
        <div className="absolute bottom-10 right-10 text-blue-200 opacity-20">
          <Mountain size={90} />
        </div>
        <div className="absolute top-1/2 left-1/4 text-orange-200 opacity-15">
          <Flame size={60} />
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <header className="flex justify-between items-center p-6">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-orange-500 rounded-lg">
              <Users className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">CampTeams</h1>
          </div>
          <button
            onClick={handleSignIn}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-orange-600 bg-white hover:bg-orange-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors"
          >
            Sign In
          </button>
        </header>

        {/* Hero Section */}
        <main className="flex-1 flex items-center justify-center px-6">
          <div className="max-w-4xl mx-auto text-center">
            {/* Main Heading */}
            <div className="mb-8">
              <h2 className="text-5xl md:text-7xl font-bold text-gray-900 mb-4">
                Summer Camp
                <span className="block text-orange-600">Team Selection</span>
              </h2>
              <p className="text-xl md:text-2xl text-gray-600 max-w-2xl mx-auto">
                Join your friends, make new ones, and find your perfect team for an unforgettable summer adventure!
              </p>
            </div>

            {/* Countdown Section */}
            <div className="mb-12">
              <div className="flex items-center justify-center mb-4">
                <Calendar className="h-6 w-6 text-orange-500 mr-2" />
                <h3 className="text-2xl font-semibold text-gray-900">Camp Starts In</h3>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
                <div className="bg-white rounded-lg p-4 shadow-lg border border-orange-100">
                  <div className="text-3xl md:text-4xl font-bold text-orange-600">{countdown.days}</div>
                  <div className="text-sm text-gray-600">Days</div>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-lg border border-orange-100">
                  <div className="text-3xl md:text-4xl font-bold text-orange-600">{countdown.hours}</div>
                  <div className="text-sm text-gray-600">Hours</div>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-lg border border-orange-100">
                  <div className="text-3xl md:text-4xl font-bold text-orange-600">{countdown.minutes}</div>
                  <div className="text-sm text-gray-600">Minutes</div>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-lg border border-orange-100">
                  <div className="text-3xl md:text-4xl font-bold text-orange-600">{countdown.seconds}</div>
                  <div className="text-sm text-gray-600">Seconds</div>
                </div>
              </div>
              
              <div className="mt-4 text-sm text-gray-500">
                August 28, 2025 • Get ready for the adventure of a lifetime!
              </div>
            </div>

            {/* Features */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 max-w-4xl mx-auto">
              <div className="bg-white rounded-lg p-6 shadow-lg border border-orange-100">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                  <Users className="h-6 w-6 text-orange-600" />
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">Join Your Team</h4>
                <p className="text-gray-600">Choose from 4 exciting teams and find your perfect match</p>
              </div>
              
              <div className="bg-white rounded-lg p-6 shadow-lg border border-orange-100">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                  <Star className="h-6 w-6 text-orange-600" />
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">Make Friends</h4>
                <p className="text-gray-600">Request to be with your friends and build new connections</p>
              </div>
              
              <div className="bg-white rounded-lg p-6 shadow-lg border border-orange-100">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                  <Flame className="h-6 w-6 text-orange-600" />
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">Summer Adventure</h4>
                <p className="text-gray-600">Experience the best summer camp with balanced teams</p>
              </div>
            </div>

            {/* CTA Button */}
            <div className="mb-8">
              <button
                onClick={handleGetStarted}
                className="inline-flex items-center px-8 py-4 border border-transparent text-lg font-medium rounded-lg text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transform hover:scale-105 transition-all duration-200 shadow-lg"
              >
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </button>
            </div>

            {/* Additional Info */}
            <div className="text-sm text-gray-500">
              <p>Already have an account? 
                <button
                  onClick={handleSignIn}
                  className="text-orange-600 hover:text-orange-700 font-medium ml-1"
                >
                  Sign in here
                </button>
              </p>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="p-6 text-center text-gray-500 text-sm">
          <p>© 2025 CampTeams • Summer Camp Team Selection Platform</p>
        </footer>
      </div>
    </div>
  )
} 