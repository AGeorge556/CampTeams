import React, { useState, useEffect } from 'react'
import { Calendar } from 'lucide-react'
import { useLanguage } from '../contexts/LanguageContext'

interface CountdownTime {
  days: number
  hours: number
  minutes: number
  seconds: number
}

interface CountdownTimerProps {
  targetDate: string
  compact?: boolean
}

export default function CountdownTimer({ targetDate, compact = false }: CountdownTimerProps) {
  const { t } = useLanguage()
  const [countdown, setCountdown] = useState<CountdownTime>({ days: 0, hours: 0, minutes: 0, seconds: 0 })

  useEffect(() => {
    const campDate = new Date(targetDate)
    
    const updateCountdown = () => {
      const now = new Date()
      const difference = campDate.getTime() - now.getTime()
      
      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24))
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))
        const seconds = Math.floor((difference % (1000 * 60)) / 1000)
        
        setCountdown({ days, hours, minutes, seconds })
      }
    }
    
    updateCountdown()
    const timer = setInterval(updateCountdown, 1000)
    
    return () => clearInterval(timer)
  }, [targetDate])

  if (compact) {
    return (
      <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-lg p-4 border border-orange-100 dark:bg-transparent dark:border-[color:var(--card-border)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-orange-500" />
            <span className="text-sm font-medium text-gray-700 dark:text-[color:var(--text)]">{t('campStartsIn')}</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="text-center">
              <div className="text-lg font-bold text-orange-600">{countdown.days}</div>
              <div className="text-xs text-gray-500 dark:text-[color:var(--muted)]">{t('daysRemaining')}</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-orange-600">{countdown.hours}</div>
              <div className="text-xs text-gray-500 dark:text-[color:var(--muted)]">{t('hoursRemaining')}</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-orange-600">{countdown.minutes}</div>
              <div className="text-xs text-gray-500 dark:text-[color:var(--muted)]">{t('minutesRemaining')}</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-orange-600">{countdown.seconds}</div>
              <div className="text-xs text-gray-500 dark:text-[color:var(--muted)]">{t('secondsRemaining')}</div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-lg p-6 border border-orange-100 dark:bg-transparent dark:border-[color:var(--card-border)]">
      <div className="flex items-center justify-center mb-4">
        <Calendar className="h-5 w-5 text-orange-500 mr-2" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-[color:var(--text)]">{t('countdownToCamp')}</h3>
      </div>
      
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-white rounded-lg p-3 shadow-sm border border-orange-100 dark:bg-[color:var(--card-bg)] dark:border-[color:var(--card-border)]">
          <div className="text-2xl font-bold text-orange-600">{countdown.days}</div>
          <div className="text-xs text-gray-600 dark:text-[color:var(--muted)]">{t('daysRemaining')}</div>
        </div>
        <div className="bg-white rounded-lg p-3 shadow-sm border border-orange-100 dark:bg-[color:var(--card-bg)] dark:border-[color:var(--card-border)]">
          <div className="text-2xl font-bold text-orange-600">{countdown.hours}</div>
          <div className="text-xs text-gray-600 dark:text-[color:var(--muted)]">{t('hoursRemaining')}</div>
        </div>
        <div className="bg-white rounded-lg p-3 shadow-sm border border-orange-100 dark:bg-[color:var(--card-bg)] dark:border-[color:var(--card-border)]">
          <div className="text-2xl font-bold text-orange-600">{countdown.minutes}</div>
          <div className="text-xs text-gray-600 dark:text-[color:var(--muted)]">{t('minutesRemaining')}</div>
        </div>
        <div className="bg-white rounded-lg p-3 shadow-sm border border-orange-100 dark:bg-[color:var(--card-bg)] dark:border-[color:var(--card-border)]">
          <div className="text-2xl font-bold text-orange-600">{countdown.seconds}</div>
          <div className="text-xs text-gray-600 dark:text-[color:var(--muted)]">{t('secondsRemaining')}</div>
        </div>
      </div>
      
      <div className="mt-3 text-center text-sm text-gray-500 dark:text-[color:var(--muted)]">
        August 28, 2025
      </div>
    </div>
  )
} 