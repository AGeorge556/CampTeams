import { useState, useEffect } from 'react'
import { Users, ArrowRight } from 'lucide-react'
import Auth from './Auth'

// Import images from the slideshow folder
// You'll need to add images to src/assets/slideshow/
// For now, we'll use a placeholder array that you can update
const SLIDESHOW_IMAGES = [
  '/src/assets/slideshow/image1.jpg',
  '/src/assets/slideshow/image2.jpg',
  '/src/assets/slideshow/image3.jpg',
  '/src/assets/slideshow/image4.jpg',
  '/src/assets/slideshow/image5.jpg',
]

export default function LandingPage() {
  const [showAuth, setShowAuth] = useState(false)
  const [authMode, setAuthMode] = useState<'signup' | 'signin'>('signup')
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [fadeState, setFadeState] = useState<'fade-in' | 'fade-out'>('fade-in')

  // Slideshow logic - change image every 10 seconds with fade effect
  useEffect(() => {
    const interval = setInterval(() => {
      // Start fade out
      setFadeState('fade-out')

      // After fade out completes (1 second), change image and fade in
      setTimeout(() => {
        setCurrentImageIndex((prev) => (prev + 1) % SLIDESHOW_IMAGES.length)
        setFadeState('fade-in')
      }, 1000)
    }, 10000) // Change every 10 seconds

    return () => clearInterval(interval)
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
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Slideshow */}
      <div className="absolute inset-0">
        {/* Background Image with fade animation */}
        <div
          className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ${
            fadeState === 'fade-in' ? 'opacity-100' : 'opacity-0'
          }`}
          style={{
            backgroundImage: `url(${SLIDESHOW_IMAGES[currentImageIndex]})`,
          }}
        />
        {/* Dark overlay for better text readability */}
        <div className="absolute inset-0 bg-black/60" />
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <header className="flex justify-between items-center p-6">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
              <Users className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">CampTeams</h1>
          </div>
          <button
            onClick={handleSignIn}
            className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md text-white bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all"
          >
            Sign In
          </button>
        </header>

        {/* Hero Section */}
        <main className="flex-1 flex items-center justify-center px-6">
          <div className="max-w-4xl mx-auto text-center">
            {/* Main Heading */}
            <div className="mb-8 animate-fade-in-up">
              <div className="mb-4">
                <h3 className="text-xl md:text-2xl font-semibold text-white/90 mb-2">
                  BCH Youth Program
                </h3>
                <div className="w-16 h-1 bg-white/50 mx-auto mb-4"></div>
              </div>
              <h2 className="text-5xl md:text-7xl font-bold text-white mb-4 drop-shadow-2xl">
                Camp Team
                <span className="block text-sky-400">Selection</span>
              </h2>
              <p className="text-xl md:text-2xl text-white/90 max-w-2xl mx-auto drop-shadow-lg">
                Join an unforgettable faith-filled adventure
              </p>
            </div>

            {/* Features */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 max-w-4xl mx-auto">
              <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 border border-white/20 hover:bg-white/20 transition-all">
                <h4 className="text-lg font-semibold text-white mb-2">Multiple Camps</h4>
                <p className="text-white/80">Register for Winter and Summer camps throughout the year</p>
              </div>

              <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 border border-white/20 hover:bg-white/20 transition-all">
                <h4 className="text-lg font-semibold text-white mb-2">Team Selection</h4>
                <p className="text-white/80">Choose your team and connect with friends</p>
              </div>

              <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 border border-white/20 hover:bg-white/20 transition-all">
                <h4 className="text-lg font-semibold text-white mb-2">Faith & Fun</h4>
                <p className="text-white/80">Grow spiritually while having an amazing time</p>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
              <button
                onClick={handleGetStarted}
                className="inline-flex items-center px-8 py-4 border border-transparent text-lg font-medium rounded-lg text-sky-900 bg-white hover:bg-white/90 focus:outline-none focus:ring-2 focus:ring-white/50 transform hover:scale-105 transition-all duration-200 shadow-2xl"
              >
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </button>

              <button
                onClick={handleSignIn}
                className="inline-flex items-center px-8 py-4 text-lg font-medium rounded-lg text-white bg-white/10 backdrop-blur-sm border-2 border-white/30 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all duration-200"
              >
                Sign In
              </button>
            </div>

            {/* Additional Info */}
            <div className="text-sm text-white/70">
              <p>Join thousands of campers in a Christ-centered community</p>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="p-6 text-center text-white/70 text-sm">
          <p>© 2026 BCH Youth Program • Christian Camp Team Selection Platform</p>
        </footer>
      </div>

      {/* CSS for animations */}
      <style>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in-up {
          animation: fade-in-up 1s ease-out;
        }
      `}</style>
    </div>
  )
}
