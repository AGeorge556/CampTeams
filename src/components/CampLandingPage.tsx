import { useState } from 'react'
import { Calendar, Sun, ArrowRight } from 'lucide-react'
import { useCamp } from '../contexts/CampContext'
import Button from './ui/Button'

interface CampLandingPageProps {
  onEnter: () => void
}

export default function CampLandingPage({ onEnter }: CampLandingPageProps) {
  const { currentCamp, currentRegistration } = useCamp()
  const [entering, setEntering] = useState(false)

  if (!currentCamp || !currentRegistration) return null

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  }

  const handleEnter = () => {
    setEntering(true)
    sessionStorage.setItem(`camp_landing_viewed_${currentCamp.id}`, 'true')
    setTimeout(() => { onEnter() }, 300)
  }

  return (
    <div className="min-h-screen bg-[var(--gradient-app-bg)] flex items-center justify-center px-4 py-12">
      <div className="max-w-2xl w-full">
        {/* Main Card */}
        <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-[var(--color-card-bg)] border border-[var(--color-border)] shadow-2xl">
          {/* Top accent strip */}
          <div className="h-2 bg-gradient-to-r from-amber-400 via-orange-500 to-red-500" />

          {/* Decorative sun */}
          <div className="absolute top-8 right-8 opacity-6 pointer-events-none">
            <Sun className="w-40 h-40 text-amber-300" />
          </div>

          <div className="relative z-10 p-8 md:p-12">
            {/* Welcome Header */}
            <div className="text-center mb-8">
              <div className="inline-flex p-5 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-white mb-6 shadow-lg">
                <Sun className="w-12 h-12" />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-[var(--color-text)] mb-2">
                Welcome to {currentCamp.name}!
              </h1>
              <p className="text-lg text-[var(--color-text-muted)] mb-3">
                {currentRegistration.full_name.split(' ')[0]}, you're all set
              </p>
              <div className="inline-flex items-center space-x-2 text-sm font-semibold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/40 px-4 py-2 rounded-full border border-orange-200 dark:border-orange-800">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(currentCamp.start_date)} – {formatDate(currentCamp.end_date)}</span>
              </div>
            </div>

            {/* Bible Verse */}
            {currentCamp.bible_verse && (
              <div className="mb-8">
                <div className="bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl p-7 md:p-9 shadow-lg">
                  <div className="text-center text-white">
                    <div className="text-xs uppercase tracking-widest mb-4 opacity-80 font-semibold">
                      Camp Theme
                    </div>
                    <blockquote className="text-xl md:text-2xl font-serif leading-relaxed mb-5">
                      "{currentCamp.bible_verse}"
                    </blockquote>
                    {currentCamp.verse_reference && (
                      <cite className="text-base md:text-lg font-semibold not-italic opacity-90">
                        — {currentCamp.verse_reference}
                      </cite>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* You're registered callout */}
            <div className="text-center mb-8">
              <div className="bg-[var(--color-bg-muted)] rounded-xl p-5 border border-[var(--color-border)]">
                <h2 className="text-lg font-bold text-[var(--color-text)] mb-2">
                  Registration confirmed
                </h2>
                <p className="text-[var(--color-text-muted)] text-sm md:text-base leading-relaxed">
                  Join a team, pick your sports, check the schedule, and follow the scoreboard — it's all waiting for you.
                </p>
              </div>
            </div>

            {/* Enter Button */}
            <div className="text-center">
              <Button
                onClick={handleEnter}
                disabled={entering}
                className={`w-full md:w-auto px-10 py-4 text-lg font-bold bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white transition-all duration-300 ${entering ? 'scale-95 opacity-75' : ''}`}
                icon={entering ? undefined : <ArrowRight className="w-6 h-6" />}
              >
                {entering ? 'Entering...' : 'Enter Camp Dashboard'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
