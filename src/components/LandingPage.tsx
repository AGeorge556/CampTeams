import { useState, useEffect } from 'react'
import { Users, Calendar, Sun, Star, ArrowRight, Flame, Trees, Mountain, Cloud, Moon, Snowflake, Leaf, Rainbow } from 'lucide-react'
import Auth from './Auth'
import { CAMP_START_DATE } from '../lib/constants'

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
    const campDate = new Date(CAMP_START_DATE)

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
    <div className="min-h-screen bg-[var(--color-bg)] relative overflow-hidden transition-colors duration-300">
      {/* Animated Background Decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
        {/* Top Left Cluster */}
        <Sun size={160} className="absolute top-2 left-2 text-cyan-200 opacity-40 animate-spin-slow" />
        <Cloud size={100} className="absolute top-24 left-24 text-blue-100 opacity-30 animate-cloud-move" />
        <Star size={60} className="absolute top-40 left-10 text-yellow-300 opacity-40 animate-bounce" />
        {/* Top Right Cluster */}
        <Rainbow size={140} className="absolute top-0 right-1/4 text-pink-200 opacity-30 animate-float" />
        <Moon size={90} className="absolute top-10 right-10 text-gray-300 opacity-20 animate-float-reverse" />
        <Snowflake size={70} className="absolute top-32 right-24 text-blue-200 opacity-20 animate-spin-slow" />
        {/* Center Floating */}
        <Flame size={100} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-cyan-300 opacity-30 animate-pulse-strong" />
        <Star size={80} className="absolute top-1/2 left-1/3 text-yellow-400 opacity-30 animate-wiggle" />
        <Leaf size={70} className="absolute top-1/2 right-1/3 text-green-300 opacity-30 animate-leaf-float" />
        {/* Bottom Left Cluster */}
        <Trees size={120} className="absolute bottom-10 left-10 text-green-200 opacity-40 animate-float" />
        <Mountain size={110} className="absolute bottom-0 left-1/4 text-blue-200 opacity-30 animate-float-reverse" />
        <Cloud size={80} className="absolute bottom-24 left-32 text-blue-100 opacity-20 animate-cloud-move" />
        {/* Bottom Right Cluster */}
        <Flame size={80} className="absolute bottom-10 right-10 text-cyan-200 opacity-30 animate-pulse" />
        <Leaf size={60} className="absolute bottom-24 right-24 text-green-400 opacity-30 animate-leaf-float" />
        <Star size={50} className="absolute bottom-32 right-10 text-yellow-300 opacity-30 animate-bounce" />
        {/* Center Foreground */}
        <Sun size={60} className="absolute top-1/2 left-1/2 translate-x-16 -translate-y-1/2 text-sky-100 opacity-30 animate-spin-slow" />
        <Snowflake size={40} className="absolute top-2/3 left-1/2 -translate-x-1/2 text-blue-100 opacity-20 animate-spin-slow" />
        <Rainbow size={80} className="absolute top-1/3 right-1/2 text-pink-100 opacity-20 animate-slide-horizontal" />
      </div>
      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <header className="flex justify-between items-center p-6">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-sky-500 rounded-lg">
              <Users className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-[var(--color-text)]">CampTeams</h1>
          </div>
          <button
            onClick={handleSignIn}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-sky-600 bg-[var(--color-bg)] hover:bg-[var(--color-bg-muted)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition-colors"
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
                <h3 className="text-xl md:text-2xl font-semibold text-sky-600 mb-2">
                  BCH Youth Program Presents
                </h3>
                <div className="w-16 h-1 bg-sky-500 mx-auto mb-4"></div>
              </div>
              <h2 className="text-5xl md:text-7xl font-bold text-[var(--color-text)] mb-4">
                Winter Camp
                <span className="block text-sky-600">Team Selection</span>
              </h2>
              <p className="text-xl md:text-2xl text-[var(--color-text-muted)] max-w-2xl mx-auto">
                Join your friends, make new ones, and find your perfect team for an unforgettable winter adventure getting closer to God!
              </p>
              <p className="text-lg text-[var(--color-text-muted)] mt-4 max-w-2xl mx-auto">
                Experience faith, friendship, and fun in a Christ-centered environment where every camper grows spiritually and socially. 
              </p>
            </div>

            {/* Countdown Section */}
            <div className="mb-12">
              <div className="flex items-center justify-center mb-4">
                <Calendar className="h-6 w-6 text-sky-500 mr-2" />
                <h3 className="text-2xl font-semibold text-[var(--color-text)]">Camp Starts In</h3>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
                <div className="bg-[var(--color-card-bg)] rounded-lg p-4 shadow-lg border border-[var(--color-border)]">
                  <div className="text-3xl md:text-4xl font-bold text-sky-600">{countdown.days}</div>
                  <div className="text-sm text-[var(--color-text-muted)]">Days</div>
                </div>
                <div className="bg-[var(--color-card-bg)] rounded-lg p-4 shadow-lg border border-[var(--color-border)]">
                  <div className="text-3xl md:text-4xl font-bold text-sky-600">{countdown.hours}</div>
                  <div className="text-sm text-[var(--color-text-muted)]">Hours</div>
                </div>
                <div className="bg-[var(--color-card-bg)] rounded-lg p-4 shadow-lg border border-[var(--color-border)]">
                  <div className="text-3xl md:text-4xl font-bold text-sky-600">{countdown.minutes}</div>
                  <div className="text-sm text-[var(--color-text-muted)]">Minutes</div>
                </div>
                <div className="bg-[var(--color-card-bg)] rounded-lg p-4 shadow-lg border border-[var(--color-border)]">
                  <div className="text-3xl md:text-4xl font-bold text-sky-600">{countdown.seconds}</div>
                  <div className="text-sm text-[var(--color-text-muted)]">Seconds</div>
                </div>
              </div>
              
              <div className="mt-4 text-sm text-[var(--color-text-muted)]">
                January 22, 2026 • Get ready for a faith-filled adventure!
              </div>
            </div>

            {/* Features */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 max-w-4xl mx-auto">
              <div className="bg-[var(--color-card-bg)] rounded-lg p-6 shadow-lg border border-[var(--color-border)]">
                <div className="w-12 h-12 bg-sky-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                  <Users className="h-6 w-6 text-sky-600" />
                </div>
                <h4 className="text-lg font-semibold text-[var(--color-text)] mb-2">Join Your Team</h4>
                <p className="text-[var(--color-text-muted)]">Choose from 4 exciting teams and find your perfect match in a Christian community</p>
              </div>
              
              <div className="bg-[var(--color-card-bg)] rounded-lg p-6 shadow-lg border border-[var(--color-border)]">
                <div className="w-12 h-12 bg-sky-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                  <Star className="h-6 w-6 text-sky-600" />
                </div>
                <h4 className="text-lg font-semibold text-[var(--color-text)] mb-2">Grow in Faith</h4>
                <p className="text-[var(--color-text-muted)]">Build meaningful friendships and strengthen your faith through fellowship and activities</p>
              </div>
              
              <div className="bg-[var(--color-card-bg)] rounded-lg p-6 shadow-lg border border-[var(--color-border)]">
                <div className="w-12 h-12 bg-sky-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                  <Flame className="h-6 w-6 text-sky-600" />
                </div>
                <h4 className="text-lg font-semibold text-[var(--color-text)] mb-2">Christian Adventure</h4>
                <p className="text-[var(--color-text-muted)]">Experience the best Christian winter camp with balanced teams and spiritual growth</p>
              </div>
            </div>
            {/* CTA Button */}
            <div className="mb-8">
              <button
                onClick={handleGetStarted}
                className="inline-flex items-center px-8 py-4 border border-transparent text-lg font-medium rounded-lg text-white bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transform hover:scale-105 transition-all duration-200 shadow-lg"
              >
                Join Our Camp
                <ArrowRight className="ml-2 h-5 w-5" />
              </button>
            </div>

            {/* Additional Info */}
            <div className="text-sm text-[var(--color-text-muted)]">
              <p>Already have an account? 
                <button
                  onClick={handleSignIn}
                  className="text-sky-600 hover:text-sky-700 font-medium ml-1"
                >
                  Sign in here
                </button>
              </p>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="p-6 text-center text-[var(--color-text-muted)] text-sm">
          <p>© 2026 BCH Youth Program • Christian Winter Camp Team Selection Platform</p>
        </footer>
      </div>
    </div>
  )
}