import React, { useState } from 'react'
import { useLanguage } from '../contexts/LanguageContext'
import { Globe, Sparkles, Star, Heart } from 'lucide-react'

const LanguageSwitcher: React.FC = () => {
  const { language, setLanguage, t } = useLanguage()
  const [isAnimating, setIsAnimating] = useState(false)

  const handleLanguageSwitch = () => {
    setIsAnimating(true)
    const newLanguage = language === 'en' ? 'ar' : 'en'
    
    // Add a small delay for the animation
    setTimeout(() => {
      setLanguage(newLanguage)
      setIsAnimating(false)
    }, 200)
  }

  const getLanguageLabel = () => {
    return language === 'en' ? 'العربية' : 'English'
  }

  const getLanguageFlag = () => {
    return language === 'en' ? '🇪🇬' : '🇺🇸'
  }

  const getFunMessage = () => {
    if (language === 'en') {
      return 'Switch to Arabic! 🇪🇬'
    } else {
      return 'تغيير للإنجليزية! 🇺🇸'
    }
  }

  return (
    <>
      {/* Mobile: Compact flag-only button */}
      <div className="md:hidden">
        <button
          onClick={handleLanguageSwitch}
          disabled={isAnimating}
          className={`
            relative group
            inline-flex items-center justify-center
            w-8 h-8 rounded-full
            transition-all duration-300 ease-in-out
            transform hover:scale-105 active:scale-95
            ${language === 'ar' 
              ? 'bg-gradient-to-r from-green-400 to-blue-500 text-white shadow-lg' 
              : 'bg-gradient-to-r from-blue-400 to-purple-500 text-white shadow-lg'
            }
            ${isAnimating ? 'animate-pulse' : ''}
            focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500
            disabled:opacity-50 disabled:cursor-not-allowed
          `}
          title={getFunMessage()}
        >
          <span className="text-lg transition-transform duration-300 group-hover:scale-110">
            {getLanguageFlag()}
          </span>
          {isAnimating && (
            <Sparkles className="absolute -top-1 -right-1 h-2 w-2 text-yellow-300 animate-bounce" />
          )}
        </button>
      </div>

      {/* Desktop: Full button with all elements */}
      <div className="hidden md:block">
        <button
          onClick={handleLanguageSwitch}
          disabled={isAnimating}
          className={`
            relative group
            inline-flex items-center gap-2 px-4 py-2
            rounded-full font-medium text-sm
            transition-all duration-300 ease-in-out
            transform hover:scale-105 active:scale-95
            ${language === 'ar' 
              ? 'bg-gradient-to-r from-green-400 to-blue-500 text-white shadow-lg hover:shadow-xl' 
              : 'bg-gradient-to-r from-blue-400 to-purple-500 text-white shadow-lg hover:shadow-xl'
            }
            ${isAnimating ? 'animate-pulse' : ''}
            hover:from-opacity-90 hover:to-opacity-90
            focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500
            disabled:opacity-50 disabled:cursor-not-allowed
          `}
          title={getFunMessage()}
        >
          {/* Animated Sparkles */}
          <div className="relative">
            <Globe className="h-5 w-5 transition-transform duration-300 group-hover:rotate-12" />
            {isAnimating && (
              <>
                <Sparkles className="absolute -top-1 -right-1 h-3 w-3 text-yellow-300 animate-bounce" />
                <Star className="absolute -bottom-1 -left-1 h-2 w-2 text-pink-300 animate-ping" />
              </>
            )}
          </div>

          {/* Language Text */}
          <span className="font-semibold transition-all duration-300">
            {getLanguageLabel()}
          </span>

          {/* Flag Emoji */}
          <span className="text-lg transition-transform duration-300 group-hover:scale-110">
            {getLanguageFlag()}
          </span>

          {/* Fun Icon */}
          <Heart className="h-4 w-4 text-pink-200 transition-all duration-300 group-hover:scale-125 group-hover:text-pink-100" />

          {/* Animated Border */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
        </button>
      </div>
    </>
  )
}

export default LanguageSwitcher 