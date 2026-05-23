import { useState, useEffect } from 'react'
import { ArrowRight, Sun, Tent, Heart, Users } from 'lucide-react'
import Auth from './Auth'

const LOGO_PATH = '/logo.png'

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

  useEffect(() => {
    const interval = setInterval(() => {
      setFadeState('fade-out')
      setTimeout(() => {
        setCurrentImageIndex((prev) => (prev + 1) % SLIDESHOW_IMAGES.length)
        setFadeState('fade-in')
      }, 1000)
    }, 10000)
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
      {/* Background slideshow */}
      <div className="absolute inset-0">
        <div
          className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ${
            fadeState === 'fade-in' ? 'opacity-100' : 'opacity-0'
          }`}
          style={{ backgroundImage: `url(${SLIDESHOW_IMAGES[currentImageIndex]})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/65 via-black/50 to-black/70" />
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col">

        {/* Header */}
        <header className="flex justify-between items-center p-5 sm:p-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/15 backdrop-blur-sm rounded-xl border border-orange-400/40 shadow-summer">
              <img
                src={LOGO_PATH}
                alt="Church Logo"
                className="h-10 w-10 object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                  e.currentTarget.parentElement!.innerHTML =
                    '<div class="h-10 w-10 flex items-center justify-center text-2xl">⛺</div>'
                }}
              />
            </div>
            <div>
              <p className="text-xs font-bold text-orange-300 uppercase tracking-widest leading-none">
                BCH Youth Program
              </p>
              <h1 className="text-xl font-bold text-white summer-text-glow leading-tight">
                Camp Teams
              </h1>
            </div>
          </div>

          <button
            onClick={handleSignIn}
            className="inline-flex items-center px-4 py-2 text-sm font-semibold rounded-xl text-white bg-white/10 backdrop-blur-sm border border-white/25 hover:bg-white/20 hover:border-orange-400/60 focus:outline-none focus:ring-2 focus:ring-orange-400 transition-all duration-200"
          >
            Sign In
          </button>
        </header>

        {/* Hero */}
        <main className="flex-1 flex items-center justify-center px-5 sm:px-6 py-8">
          <div className="max-w-4xl mx-auto text-center">

            {/* Badge */}
            <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-orange-500/20 border border-orange-400/40 backdrop-blur-sm mb-6 animate-fade-in-up">
              <Sun className="h-4 w-4 text-orange-300" />
              <span className="text-sm font-semibold text-orange-200 uppercase tracking-wider">
                BCH Youth Program ✝️
              </span>
              <Sun className="h-4 w-4 text-orange-300" />
            </div>

            {/* Main heading */}
            <div className="mb-8 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
              <h2 className="text-5xl sm:text-6xl md:text-7xl font-bold text-white mb-4 drop-shadow-2xl leading-tight">
                Summer Camp
                <span className="block text-orange-300 summer-text-glow">2026 ⛺</span>
              </h2>
              <p className="text-xl md:text-2xl text-white/85 max-w-2xl mx-auto drop-shadow-lg">
                An unforgettable faith-filled adventure awaits 🙏
              </p>
            </div>

            {/* Feature cards */}
            <div
              className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-10 max-w-4xl mx-auto animate-fade-in-up"
              style={{ animationDelay: '0.2s' }}
            >
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 sm:p-6 border border-orange-400/30 hover:border-orange-400/60 hover:bg-white/15 transition-all duration-200 transform hover:scale-105">
                <Tent className="h-8 w-8 text-orange-300 mb-3 mx-auto" />
                <h4 className="text-base font-bold text-white mb-2">☀️ Summer Camp 2026</h4>
                <p className="text-sm text-white/75">
                  Register for an epic summer camp — full of adventure, faith, and fun
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 sm:p-6 border border-amber-400/30 hover:border-amber-400/60 hover:bg-white/15 transition-all duration-200 transform hover:scale-105">
                <Users className="h-8 w-8 text-amber-300 mb-3 mx-auto" />
                <h4 className="text-base font-bold text-white mb-2">🔥 Team Selection</h4>
                <p className="text-sm text-white/75">
                  Choose your team, compete together, and build lifelong friendships
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 sm:p-6 border border-green-400/30 hover:border-green-400/60 hover:bg-white/15 transition-all duration-200 transform hover:scale-105">
                <Heart className="h-8 w-8 text-green-300 mb-3 mx-auto" />
                <h4 className="text-base font-bold text-white mb-2">✝️ Faith & Adventure</h4>
                <p className="text-sm text-white/75">
                  Grow spiritually 📖 through outdoor adventures and Christ-centered community
                </p>
              </div>
            </div>

            {/* CTA buttons */}
            <div
              className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8 animate-fade-in-up"
              style={{ animationDelay: '0.3s' }}
            >
              <button
                onClick={handleGetStarted}
                className="inline-flex items-center px-8 py-4 text-lg font-bold rounded-2xl text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 focus:outline-none focus:ring-2 focus:ring-orange-400 transform hover:scale-105 transition-all duration-200 shadow-summer"
              >
                Register Now ⛺
                <ArrowRight className="ml-2 h-5 w-5" />
              </button>

              <button
                onClick={handleSignIn}
                className="inline-flex items-center px-8 py-4 text-lg font-bold rounded-2xl text-white bg-white/10 backdrop-blur-sm border-2 border-white/30 hover:border-white/60 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all duration-200"
              >
                Sign In ✨
              </button>
            </div>

            <p className="text-sm text-white/60 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
              Join the BCH community for a Christ-centered summer experience ⛪✝️
            </p>
          </div>
        </main>

        {/* Footer */}
        <footer className="p-5 sm:p-6 text-center text-white/55 text-sm">
          <p>© 2026 BCH Youth Program • Summer Camp Registration Platform 🏕️</p>
        </footer>
      </div>

      <style>{`
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.8s ease-out both;
        }

        /* Warm summer sun glow */
        .summer-text-glow {
          text-shadow:
            0 0 6px  rgba(251, 146, 60, 0.7),
            0 0 14px rgba(251, 146, 60, 0.5),
            0 0 28px rgba(251, 146, 60, 0.3);
        }

        /* Campfire glow box-shadow */
        .shadow-summer {
          box-shadow:
            0 0 10px rgba(249, 115, 22, 0.5),
            0 0 22px rgba(249, 115, 22, 0.3),
            0 0 40px rgba(249, 115, 22, 0.15);
        }
      `}</style>
    </div>
  )
}
