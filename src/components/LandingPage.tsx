import { useState, useEffect } from 'react'
import { ArrowRight } from 'lucide-react'
import Auth from './Auth'

// Logo path - Replace with your church logo
const LOGO_PATH = '/logo.png'

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
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/10 backdrop-blur-sm rounded-lg border-2 border-cyan-400/50 shadow-neon-cyan">
              <img src={LOGO_PATH} alt="Church Logo" className="h-10 w-10 object-contain" onError={(e) => {
                // Fallback if logo doesn't exist yet
                e.currentTarget.style.display = 'none'
                e.currentTarget.parentElement!.innerHTML = '<div class="h-10 w-10 flex items-center justify-center text-2xl">⛪</div>'
              }} />
            </div>
            <h1 className="text-2xl font-bold text-white neon-text-white">CampTeams ⛺</h1>
          </div>
          <button
            onClick={handleSignIn}
            className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md text-white bg-gradient-to-r from-cyan-500/20 to-purple-500/20 backdrop-blur-sm border-2 border-cyan-400/50 hover:border-pink-400/50 hover:shadow-neon-pink focus:outline-none focus:ring-2 focus:ring-cyan-400 transition-all"
          >
            Sign In ✨
          </button>
        </header>

        {/* Hero Section */}
        <main className="flex-1 flex items-center justify-center px-6">
          <div className="max-w-4xl mx-auto text-center">
            {/* Main Heading */}
            <div className="mb-8 animate-fade-in-up">
              <div className="mb-4">
                <h3 className="text-xl md:text-2xl font-semibold text-white/90 mb-2 neon-text-yellow">
                  ✝️ BCH Youth Program ✝️
                </h3>
                <div className="w-16 h-1 bg-gradient-to-r from-cyan-400 via-pink-400 to-purple-400 mx-auto mb-4 shadow-neon-multi"></div>
              </div>
              <h2 className="text-5xl md:text-7xl font-bold text-white mb-4 drop-shadow-2xl neon-text-cyan">
                Camp Registration 🏕️
                <span className="block neon-text-pink">Website ✨</span>
              </h2>
              <p className="text-xl md:text-2xl text-white/90 max-w-2xl mx-auto drop-shadow-lg neon-text-white">
                Join an unforgettable faith-filled adventure 🙏
              </p>
            </div>

            {/* Features */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 max-w-4xl mx-auto">
              <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 border-2 border-cyan-400/50 hover:border-cyan-400 hover:shadow-neon-cyan transition-all transform hover:scale-105">
                <h4 className="text-lg font-semibold text-white mb-2 neon-text-cyan">🏔️ Multiple Camps</h4>
                <p className="text-white/80">Register for Winter ❄️ and Summer ☀️ camps throughout the year</p>
              </div>

              <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 border-2 border-pink-400/50 hover:border-pink-400 hover:shadow-neon-pink transition-all transform hover:scale-105">
                <h4 className="text-lg font-semibold text-white mb-2 neon-text-pink">🔥 Team Selection</h4>
                <p className="text-white/80">Choose your team and connect with friends 🤝</p>
              </div>

              <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 border-2 border-purple-400/50 hover:border-purple-400 hover:shadow-neon-purple transition-all transform hover:scale-105">
                <h4 className="text-lg font-semibold text-white mb-2 neon-text-purple">✝️ Faith & Fun</h4>
                <p className="text-white/80">Grow spiritually 📖 while having an amazing time 🎉</p>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
              <button
                onClick={handleGetStarted}
                className="inline-flex items-center px-8 py-4 border-2 border-cyan-400 text-lg font-bold rounded-lg text-white bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 transform hover:scale-105 transition-all duration-200 shadow-neon-cyan neon-text-white"
              >
                Get Started ⛺
                <ArrowRight className="ml-2 h-5 w-5" />
              </button>

              <button
                onClick={handleSignIn}
                className="inline-flex items-center px-8 py-4 text-lg font-bold rounded-lg text-white bg-white/10 backdrop-blur-sm border-2 border-pink-400/50 hover:border-pink-400 hover:shadow-neon-pink focus:outline-none focus:ring-2 focus:ring-pink-400 transition-all duration-200"
              >
                Sign In ✨
              </button>
            </div>

            {/* Additional Info */}
            <div className="text-sm text-white/70">
              <p>Join thousands of campers in a Christ-centered community ⛪✝️</p>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="p-6 text-center text-white/70 text-sm">
          <p>© 2026 BCH Youth Program • Christian Camp Registration Platform 🙏</p>
        </footer>
      </div>

      {/* CSS for animations and neon effects */}
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

        /* Neon text effects */
        .neon-text-cyan {
          text-shadow:
            0 0 5px rgba(6, 182, 212, 0.8),
            0 0 10px rgba(6, 182, 212, 0.6),
            0 0 20px rgba(6, 182, 212, 0.4),
            0 0 40px rgba(6, 182, 212, 0.2);
        }

        .neon-text-pink {
          text-shadow:
            0 0 5px rgba(236, 72, 153, 0.8),
            0 0 10px rgba(236, 72, 153, 0.6),
            0 0 20px rgba(236, 72, 153, 0.4),
            0 0 40px rgba(236, 72, 153, 0.2);
        }

        .neon-text-purple {
          text-shadow:
            0 0 5px rgba(168, 85, 247, 0.8),
            0 0 10px rgba(168, 85, 247, 0.6),
            0 0 20px rgba(168, 85, 247, 0.4),
            0 0 40px rgba(168, 85, 247, 0.2);
        }

        .neon-text-yellow {
          text-shadow:
            0 0 5px rgba(250, 204, 21, 0.8),
            0 0 10px rgba(250, 204, 21, 0.6),
            0 0 20px rgba(250, 204, 21, 0.4),
            0 0 40px rgba(250, 204, 21, 0.2);
        }

        .neon-text-white {
          text-shadow:
            0 0 5px rgba(255, 255, 255, 0.6),
            0 0 10px rgba(255, 255, 255, 0.4),
            0 0 20px rgba(255, 255, 255, 0.2);
        }

        /* Neon box shadows */
        .shadow-neon-cyan {
          box-shadow:
            0 0 10px rgba(6, 182, 212, 0.6),
            0 0 20px rgba(6, 182, 212, 0.4),
            0 0 30px rgba(6, 182, 212, 0.2);
        }

        .shadow-neon-pink {
          box-shadow:
            0 0 10px rgba(236, 72, 153, 0.6),
            0 0 20px rgba(236, 72, 153, 0.4),
            0 0 30px rgba(236, 72, 153, 0.2);
        }

        .shadow-neon-purple {
          box-shadow:
            0 0 10px rgba(168, 85, 247, 0.6),
            0 0 20px rgba(168, 85, 247, 0.4),
            0 0 30px rgba(168, 85, 247, 0.2);
        }

        .shadow-neon-multi {
          box-shadow:
            0 0 10px rgba(6, 182, 212, 0.6),
            0 0 20px rgba(236, 72, 153, 0.4),
            0 0 30px rgba(168, 85, 247, 0.2);
        }
      `}</style>
    </div>
  )
}
