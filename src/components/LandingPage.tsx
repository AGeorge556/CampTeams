import React, { useState, useEffect } from 'react'
import { Users, Calendar, Sun, Star, ArrowRight, Flame, Trees, Mountain, Cloud, Moon, Snowflake, Leaf, Rainbow } from 'lucide-react'
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
      {/* Animated Background Decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
        {/* Top Left Cluster */}
        <Sun size={160} className="absolute top-2 left-2 text-orange-200 opacity-40 animate-spin-slow" />
        <Cloud size={100} className="absolute top-24 left-24 text-blue-100 opacity-30 animate-cloud-move" />
        <Star size={60} className="absolute top-40 left-10 text-yellow-300 opacity-40 animate-bounce" />
        {/* Top Right Cluster */}
        <Rainbow size={140} className="absolute top-0 right-1/4 text-pink-200 opacity-30 animate-float" />
        <Moon size={90} className="absolute top-10 right-10 text-gray-300 opacity-20 animate-float-reverse" />
        <Snowflake size={70} className="absolute top-32 right-24 text-blue-200 opacity-20 animate-spin-slow" />
        {/* Center Floating */}
        <Flame size={100} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-orange-300 opacity-30 animate-pulse-strong" />
        <Star size={80} className="absolute top-1/2 left-1/3 text-yellow-400 opacity-30 animate-wiggle" />
        <Leaf size={70} className="absolute top-1/2 right-1/3 text-green-300 opacity-30 animate-leaf-float" />
        {/* Bottom Left Cluster */}
        <Trees size={120} className="absolute bottom-10 left-10 text-green-200 opacity-40 animate-float" />
        <Mountain size={110} className="absolute bottom-0 left-1/4 text-blue-200 opacity-30 animate-float-reverse" />
        <Cloud size={80} className="absolute bottom-24 left-32 text-blue-100 opacity-20 animate-cloud-move" />
        {/* Bottom Right Cluster */}
        <Flame size={80} className="absolute bottom-10 right-10 text-orange-200 opacity-30 animate-pulse" />
        <Leaf size={60} className="absolute bottom-24 right-24 text-green-400 opacity-30 animate-leaf-float" />
        <Star size={50} className="absolute bottom-32 right-10 text-yellow-300 opacity-30 animate-bounce" />
        {/* Center Foreground */}
        <Sun size={60} className="absolute top-1/2 left-1/2 translate-x-16 -translate-y-1/2 text-orange-100 opacity-30 animate-spin-slow" />
        <Snowflake size={40} className="absolute top-2/3 left-1/2 -translate-x-1/2 text-blue-100 opacity-20 animate-spin-slow" />
        <Rainbow size={80} className="absolute top-1/3 right-1/2 text-pink-100 opacity-20 animate-slide-horizontal" />
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
              <div className="mb-4">
                <h3 className="text-xl md:text-2xl font-semibold text-orange-600 mb-2">
                  BCH Youth Program Presents
                </h3>
                <div className="w-16 h-1 bg-orange-500 mx-auto mb-4"></div>
              </div>
              <h2 className="text-5xl md:text-7xl font-bold text-gray-900 mb-4">
                Summer Camp
                <span className="block text-orange-600">Team Selection</span>
              </h2>
              <p className="text-xl md:text-2xl text-gray-600 max-w-2xl mx-auto">
                Join your friends, make new ones, and find your perfect team for an unforgettable summer adventure getting closer to God!
              </p>
              <p className="text-lg text-gray-500 mt-4 max-w-2xl mx-auto">
                Experience faith, friendship, and fun in a Christ-centered environment where every camper grows spiritually and socially. 
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
                August 28, 2025 • Get ready for a faith-filled adventure!
              </div>
            </div>

            {/* Features */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 max-w-4xl mx-auto">
              <div className="bg-white rounded-lg p-6 shadow-lg border border-orange-100">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                  <Users className="h-6 w-6 text-orange-600" />
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">Join Your Team</h4>
                <p className="text-gray-600">Choose from 4 exciting teams and find your perfect match in a Christian community</p>
              </div>
              
              <div className="bg-white rounded-lg p-6 shadow-lg border border-orange-100">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                  <Star className="h-6 w-6 text-orange-600" />
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">Grow in Faith</h4>
                <p className="text-gray-600">Build meaningful friendships and strengthen your faith through fellowship and activities</p>
              </div>
              
              <div className="bg-white rounded-lg p-6 shadow-lg border border-orange-100">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                  <Flame className="h-6 w-6 text-orange-600" />
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">Christian Adventure</h4>
                <p className="text-gray-600">Experience the best Christian summer camp with balanced teams and spiritual growth</p>
              </div>
            </div>
            {/* CTA Button */}
            <div className="mb-8">
              <button
                onClick={handleGetStarted}
                className="inline-flex items-center px-8 py-4 border border-transparent text-lg font-medium rounded-lg text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transform hover:scale-105 transition-all duration-200 shadow-lg"
              >
                Join Our Camp
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
          <p>© 2025 BCH Youth Program • Christian Summer Camp Team Selection Platform</p>
        </footer>
      </div>
    </div>
  )
} 