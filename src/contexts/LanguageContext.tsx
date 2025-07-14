import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { Language, getTranslation, getTranslationWithPlural, getContextualTranslation, translations, TranslationContext } from '../lib/languages'

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: keyof typeof translations.en, context?: TranslationContext) => string
  tPlural: (key: keyof typeof translations.en, count: number, context?: TranslationContext) => string
  tContextual: (key: keyof typeof translations.en, context: TranslationContext) => string
  isRTL: boolean
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

interface LanguageProviderProps {
  children: ReactNode
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    // Get language from localStorage or default to English
    const savedLanguage = localStorage.getItem('language') as Language
    return savedLanguage && ['en', 'ar'].includes(savedLanguage) ? savedLanguage : 'en'
  })

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    localStorage.setItem('language', lang)
    
    // Update document direction for RTL support
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'
    document.documentElement.lang = lang
  }

  const t = (key: keyof typeof translations.en, context?: TranslationContext): string => {
    return getTranslation(language, key, context)
  }

  const tPlural = (key: keyof typeof translations.en, count: number, context?: TranslationContext): string => {
    return getTranslationWithPlural(language, key, count, context)
  }

  const tContextual = (key: keyof typeof translations.en, context: TranslationContext): string => {
    return getContextualTranslation(language, key, context)
  }

  const isRTL = language === 'ar'

  useEffect(() => {
    // Set initial document direction
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr'
    document.documentElement.lang = language
  }, [language])

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, tPlural, tContextual, isRTL }}>
      {children}
    </LanguageContext.Provider>
  )
}

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
} 