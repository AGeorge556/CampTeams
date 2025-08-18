import React, { useState, useEffect } from 'react'
import { useLanguage } from '../contexts/LanguageContext'
import { Sparkles, Star, Heart, Globe } from 'lucide-react'

const LanguageNotification: React.FC = () => {
  const { language } = useLanguage()
  const [showNotification, setShowNotification] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    // Show notification when language changes
    setShowNotification(true)
    
    if (language === 'ar') {
      setMessage('أهلاً وسهلاً! تم تغيير اللغة للعربية 🇪🇬')
    } else {
      setMessage('Welcome! Language switched to English 🇺🇸')
    }

    // Hide notification after 3 seconds
    const timer = setTimeout(() => {
      setShowNotification(false)
    }, 3000)

    return () => clearTimeout(timer)
  }, [language])

  if (!showNotification) return null

  return (
    <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-right duration-500">
      <div className={`
        relative overflow-hidden
        bg-gradient-to-r from-orange-400 to-pink-500
        text-white px-6 py-4 rounded-lg shadow-lg
        border border-white/20 backdrop-blur-sm
        transform transition-all duration-300
        hover:scale-105
        ${language === 'ar' ? 'text-right' : 'text-left'}
      `}>
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <Sparkles className="absolute top-2 right-2 h-4 w-4 text-yellow-200 animate-bounce" />
          <Star className="absolute bottom-2 left-2 h-3 w-3 text-pink-200 animate-ping" />
          <Heart className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-2 w-2 text-red-200 animate-pulse" />
        </div>

        {/* Content */}
        <div className="relative z-10 flex items-center gap-3">
          <Globe className="h-5 w-5 animate-spin-slow" />
          <div>
            <p className="font-semibold text-sm">
              {message}
            </p>
            <p className="text-xs opacity-90 mt-1">
              {language === 'ar' ? 'استمتع بتجربة رائعة!' : 'Enjoy the amazing experience!'}
            </p>
          </div>
        </div>

        {/* Close button */}
        <button
          onClick={() => setShowNotification(false)}
          className="absolute top-2 right-2 text-white/70 hover:text-white transition-colors"
        >
          ×
        </button>

        {/* Animated border */}
        <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 animate-pulse" />
      </div>
    </div>
  )
}

export default LanguageNotification 