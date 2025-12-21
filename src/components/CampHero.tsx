import { Calendar, Snowflake, Sun } from 'lucide-react'
import { useCamp } from '../contexts/CampContext'
import CountdownTimer from './CountdownTimer'

export default function CampHero() {
  const { currentCamp } = useCamp()

  if (!currentCamp) return null

  // Show camp hero only if the camp has a custom Bible verse
  if (!currentCamp.bible_verse) return null

  const CampIcon = currentCamp.season === 'winter' ? Snowflake : Sun

  // Get theme colors with fallbacks
  const primaryColor = currentCamp.theme_primary_color || 'sky'
  const secondaryColor = currentCamp.theme_secondary_color || 'blue'

  // Generate gradient class
  const gradientClass = `from-${primaryColor}-500 to-${secondaryColor}-600`
  const bgGradientClass = `from-${primaryColor}-50 to-${secondaryColor}-50 dark:from-${primaryColor}-950 dark:to-${secondaryColor}-950`

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  }

  return (
    <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${bgGradientClass} border-2 border-${primaryColor}-200 dark:border-${primaryColor}-800 shadow-xl mb-8`}>
      {/* Decorative background elements */}
      <div className="absolute inset-0 opacity-10">
        <CampIcon className="absolute top-4 right-4 w-32 h-32 text-${primaryColor}-500" />
        <CampIcon className="absolute bottom-4 left-4 w-24 h-24 text-${secondaryColor}-500" />
      </div>

      <div className="relative z-10 p-8">
        {/* Camp Header */}
        <div className="text-center mb-6">
          <div className={`inline-flex p-4 rounded-full bg-gradient-to-br ${gradientClass} text-white mb-4 shadow-lg`}>
            <CampIcon className="w-12 h-12" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-[var(--color-text)] mb-2">
            {currentCamp.name}
          </h1>
          <div className="flex items-center justify-center space-x-2 text-[var(--color-text-muted)]">
            <Calendar className="w-5 h-5" />
            <span className="text-lg">
              {formatDate(currentCamp.start_date)} - {formatDate(currentCamp.end_date)}
            </span>
          </div>
        </div>

        {/* Bible Verse - Camp Theme */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className={`bg-gradient-to-br ${gradientClass} rounded-xl p-8 shadow-2xl`}>
            <div className="text-center text-white">
              <div className="text-xs uppercase tracking-wider mb-3 opacity-90">
                Camp Theme
              </div>
              <blockquote className="text-2xl md:text-3xl font-serif leading-relaxed mb-4">
                "{currentCamp.bible_verse}"
              </blockquote>
              {currentCamp.verse_reference && (
                <cite className="text-lg md:text-xl font-semibold not-italic opacity-95">
                  — {currentCamp.verse_reference}
                </cite>
              )}
            </div>
          </div>
        </div>

        {/* Countdown Timer */}
        <div className="max-w-3xl mx-auto">
          <CountdownTimer targetDate={currentCamp.start_date} compact={false} />
        </div>
      </div>
    </div>
  )
}
