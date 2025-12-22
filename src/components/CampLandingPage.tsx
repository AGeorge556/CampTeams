import { useState } from 'react'
import { Calendar, Snowflake, Sun, ArrowRight, Sparkles } from 'lucide-react'
import { useCamp } from '../contexts/CampContext'
import Button from './ui/Button'

interface CampLandingPageProps {
  onEnter: () => void
}

export default function CampLandingPage({ onEnter }: CampLandingPageProps) {
  const { currentCamp, currentRegistration } = useCamp()
  const [entering, setEntering] = useState(false)

  if (!currentCamp || !currentRegistration) return null

  const CampIcon = currentCamp.season === 'winter' ? Snowflake : Sun
  const primaryColor = currentCamp.theme_primary_color || 'sky'
  const secondaryColor = currentCamp.theme_secondary_color || 'blue'
  const gradientClass = `from-${primaryColor}-500 to-${secondaryColor}-600`
  const bgGradientClass = `from-${primaryColor}-50 to-${secondaryColor}-50 dark:from-${primaryColor}-950 dark:to-${secondaryColor}-950`

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  }

  const handleEnter = () => {
    setEntering(true)
    // Store that user has viewed the landing page
    sessionStorage.setItem(`camp_landing_viewed_${currentCamp.id}`, 'true')
    setTimeout(() => {
      onEnter()
    }, 300)
  }

  return (
    <div className="min-h-screen bg-[var(--gradient-app-bg)] flex items-center justify-center px-4 py-12">
      <div className="max-w-4xl w-full">
        {/* Main Card */}
        <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${bgGradientClass} border-2 border-${primaryColor}-200 dark:border-${primaryColor}-800 shadow-2xl`}>
          {/* Decorative background elements */}
          <div className="absolute inset-0 opacity-10">
            <CampIcon className={`absolute top-8 right-8 w-48 h-48 text-${primaryColor}-500 animate-pulse`} />
            <CampIcon className={`absolute bottom-8 left-8 w-32 h-32 text-${secondaryColor}-500`} />
            <Sparkles className={`absolute top-1/2 left-1/4 w-16 h-16 text-${primaryColor}-400 animate-bounce`} />
          </div>

          <div className="relative z-10 p-8 md:p-12">
            {/* Welcome Header */}
            <div className="text-center mb-8">
              <div className={`inline-flex p-5 rounded-full bg-gradient-to-br ${gradientClass} text-white mb-6 shadow-xl animate-bounce`}>
                <CampIcon className="w-16 h-16" />
              </div>
              <h1 className="text-3xl md:text-5xl font-bold text-[var(--color-text)] mb-3">
                Welcome to {currentCamp.name}!
              </h1>
              <p className="text-lg md:text-xl text-[var(--color-text-muted)] mb-2">
                {currentRegistration.full_name.split(' ')[0]}, you're all set!
              </p>
              <div className="flex items-center justify-center space-x-2 text-[var(--color-text-muted)]">
                <Calendar className="w-5 h-5" />
                <span className="text-base md:text-lg">
                  {formatDate(currentCamp.start_date)} - {formatDate(currentCamp.end_date)}
                </span>
              </div>
            </div>

            {/* Bible Verse Section */}
            {currentCamp.bible_verse && (
              <div className="mb-10">
                <div className={`bg-gradient-to-br ${gradientClass} rounded-2xl p-8 md:p-10 shadow-2xl transform hover:scale-105 transition-transform duration-300`}>
                  <div className="text-center text-white">
                    <div className="text-xs uppercase tracking-widest mb-4 opacity-90 font-semibold">
                      Camp Theme
                    </div>
                    <blockquote className="text-xl md:text-3xl font-serif leading-relaxed mb-6">
                      "{currentCamp.bible_verse}"
                    </blockquote>
                    {currentCamp.verse_reference && (
                      <cite className="text-lg md:text-2xl font-semibold not-italic opacity-95">
                        — {currentCamp.verse_reference}
                      </cite>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Welcome Message */}
            <div className="text-center mb-8">
              <div className="bg-[var(--color-card-bg)] rounded-xl p-6 border border-[var(--color-border)] shadow-lg">
                <h2 className="text-xl md:text-2xl font-bold text-[var(--color-text)] mb-3">
                  You're Registered! 🎉
                </h2>
                <p className="text-[var(--color-text-muted)] text-base md:text-lg leading-relaxed">
                  Get ready for an amazing experience! You'll be able to join a team, participate in activities,
                  view the schedule, check scores, and much more.
                </p>
              </div>
            </div>

            {/* Enter Camp Button */}
            <div className="text-center">
              <Button
                onClick={handleEnter}
                disabled={entering}
                className={`
                  w-full md:w-auto px-12 py-6 text-xl md:text-2xl font-bold
                  bg-gradient-to-r ${gradientClass} hover:opacity-90
                  transform hover:scale-105 transition-all duration-300
                  shadow-2xl hover:shadow-3xl
                  ${entering ? 'scale-95 opacity-75' : ''}
                `}
                icon={entering ? undefined : <ArrowRight className="w-8 h-8" />}
              >
                {entering ? 'Entering Camp...' : 'Enter Camp Dashboard'}
              </Button>
              <p className="mt-4 text-sm text-[var(--color-text-muted)]">
                Click above to access your camp dashboard
              </p>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="text-center mt-6 text-sm text-[var(--color-text-muted)]">
          <p>You can always access this camp from the camp selection page</p>
        </div>
      </div>
    </div>
  )
}
