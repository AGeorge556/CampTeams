import { useState, useEffect, lazy, Suspense } from 'react'
import { ArrowRight, Tent, Users, Heart } from 'lucide-react'
import Auth from './Auth'

const CampfireCanvas = lazy(() => import('./CampfireCanvas'))

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
  const [imgIndex, setImgIndex] = useState(0)
  const [imgVisible, setImgVisible] = useState(true)

  useEffect(() => {
    const cycle = setInterval(() => {
      setImgVisible(false)
      setTimeout(() => {
        setImgIndex(prev => (prev + 1) % SLIDESHOW_IMAGES.length)
        setImgVisible(true)
      }, 900)
    }, 10000)
    return () => clearInterval(cycle)
  }, [])

  if (showAuth) {
    return <Auth initialMode={authMode} onBack={() => setShowAuth(false)} />
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-black">

      {/* Photo background */}
      <div className="absolute inset-0">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(${SLIDESHOW_IMAGES[imgIndex]})`,
            opacity: imgVisible ? 0.45 : 0,
            transition: 'opacity 900ms ease',
          }}
        />
        {/* Gradient: heavier vignette at bottom so campfire glow pops */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/38 to-black/82" />
      </div>

      {/* Three.js campfire + stars layer */}
      <Suspense fallback={null}>
        <CampfireCanvas />
      </Suspense>

      {/* Page content */}
      <div className="relative z-10 min-h-screen flex flex-col">

        {/* Header */}
        <header className="flex items-center justify-between px-5 py-4 sm:px-8 sm:py-5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/10 border border-white/15 backdrop-blur-sm">
              <img
                src={LOGO_PATH}
                alt="BCH Youth"
                className="h-12 w-12 object-contain"
                onError={e => {
                  const el = e.currentTarget
                  el.style.display = 'none'
                  const placeholder = document.createElement('div')
                  placeholder.className = 'h-12 w-12 flex items-center justify-center'
                  placeholder.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" stroke="#fb923c" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`
                  el.parentElement?.appendChild(placeholder)
                }}
              />
            </div>
            <div>
              <p className="text-[10px] font-bold text-orange-400 uppercase tracking-[0.18em] leading-none mb-0.5">
                BCH Youth Program
              </p>
              <p className="text-base font-bold text-white leading-none">Camp Teams</p>
            </div>
          </div>

          <button
            onClick={() => { setAuthMode('signin'); setShowAuth(true) }}
            className="text-sm font-semibold text-white/85 px-4 py-2 rounded-lg bg-white/10 border border-white/15 backdrop-blur-sm hover:bg-white/18 hover:text-white focus:outline-none focus:ring-2 focus:ring-orange-400/60 transition-all duration-200"
          >
            Sign in
          </button>
        </header>

        {/* Hero */}
        <main className="flex-1 flex items-center justify-center px-5 py-10 sm:px-8">
          <div className="max-w-3xl mx-auto text-center">

            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-500/18 border border-orange-400/30 backdrop-blur-sm mb-7 anim-up" style={{ animationDelay: '0ms' }}>
              <img src={LOGO_PATH} alt="" className="h-5 w-5 object-contain" />
              <span className="text-xs font-bold text-orange-300 uppercase tracking-[0.16em]">
                BCH Youth Program
              </span>
            </div>

            {/* Main title */}
            <div className="mb-3 anim-up" style={{ animationDelay: '80ms' }}>
              <h1 className="text-[clamp(3rem,10vw,5.5rem)] font-bold text-white leading-none tracking-tight">
                Summer Camp
              </h1>
              <div className="text-[clamp(3rem,10vw,5.5rem)] font-bold leading-none tracking-tight" style={{ color: '#fb923c', textShadow: '0 0 40px rgba(251,146,60,0.45), 0 0 80px rgba(249,115,22,0.20)' }}>
                2026
              </div>
            </div>

            {/* Date */}
            <p className="text-lg sm:text-xl text-orange-200/90 font-medium mb-3 anim-up" style={{ animationDelay: '140ms' }}>
              August 20 – 23
            </p>

            {/* Sub-headline */}
            <p className="text-base sm:text-lg text-white/65 max-w-lg mx-auto leading-relaxed mb-10 anim-up" style={{ animationDelay: '200ms' }}>
              Teams, competition, worship, and four days you won't forget.
            </p>

            {/* CTA buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center mb-12 anim-up" style={{ animationDelay: '270ms' }}>
              <button
                onClick={() => { setAuthMode('signup'); setShowAuth(true) }}
                className="inline-flex items-center gap-2 px-7 py-3.5 text-base font-bold rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-orange-400 transition-all duration-200 hover:opacity-90 active:scale-[0.98]"
                style={{ background: 'linear-gradient(135deg, #f97316, #f59e0b)', boxShadow: '0 4px 24px rgba(249,115,22,0.40)' }}
              >
                Register for camp
                <ArrowRight className="h-4.5 w-4.5" />
              </button>

              <button
                onClick={() => { setAuthMode('signin'); setShowAuth(true) }}
                className="inline-flex items-center gap-2 px-7 py-3.5 text-base font-semibold rounded-xl text-white/90 bg-white/10 border border-white/20 backdrop-blur-sm hover:bg-white/18 hover:border-white/35 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all duration-200 active:scale-[0.98]"
              >
                Already registered
              </button>
            </div>

            {/* Feature row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 max-w-2xl mx-auto anim-up" style={{ animationDelay: '340ms' }}>
              <div className="bg-white/7 backdrop-blur-md rounded-xl p-4 border border-white/10 text-left hover:border-orange-400/30 transition-colors duration-300">
                <Tent className="h-5 w-5 text-orange-400 mb-2.5" />
                <h3 className="text-sm font-semibold text-white mb-1">Camp Registration</h3>
                <p className="text-xs text-white/55 leading-relaxed">Sign up and secure your spot in under two minutes.</p>
              </div>

              <div className="bg-white/7 backdrop-blur-md rounded-xl p-4 border border-white/10 text-left hover:border-amber-400/30 transition-colors duration-300">
                <Users className="h-5 w-5 text-amber-400 mb-2.5" />
                <h3 className="text-sm font-semibold text-white mb-1">Team Competition</h3>
                <p className="text-xs text-white/55 leading-relaxed">Pick a team and spend four days proving it's the best.</p>
              </div>

              <div className="bg-white/7 backdrop-blur-md rounded-xl p-4 border border-white/10 text-left hover:border-rose-400/30 transition-colors duration-300">
                <Heart className="h-5 w-5 text-rose-400 mb-2.5" />
                <h3 className="text-sm font-semibold text-white mb-1">Faith & Fellowship</h3>
                <p className="text-xs text-white/55 leading-relaxed">Morning devotions, evening worship, real community.</p>
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="px-5 py-4 text-center">
          <p className="text-xs text-white/30">© 2026 BCH Youth Program</p>
        </footer>
      </div>

      <style>{`
        @keyframes anim-up {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .anim-up {
          animation: anim-up 0.7s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        @media (prefers-reduced-motion: reduce) {
          .anim-up { animation: none; }
        }
      `}</style>
    </div>
  )
}
