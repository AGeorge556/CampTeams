import React, { useState, useEffect, useRef } from 'react'
import { Users, BarChart3, Sun, Star, Flame, Trees, Mountain, UserPlus, Download, RefreshCw, Calendar, Trophy, Activity, Camera } from 'lucide-react'
import { useProfile } from '../hooks/useProfile'
import { useCamp } from '../contexts/CampContext'
import { useTeamBalance } from '../hooks/useTeamBalance'
import { TEAMS, TeamColor } from '../lib/supabase'
import AdminPanel from './AdminPanel'
import PlayerLists from './PlayerLists'
import CountdownTimer from './CountdownTimer'
import Scoreboard from './Scoreboard'
import CampHero from './CampHero'
import { useLanguage } from '../contexts/LanguageContext'
import { SkeletonCard } from './LoadingSpinner'

import { getGradeDisplayWithNumber } from '../lib/utils'
import { useToast } from './Toast'

interface BibleVerse {
  verse: string
  reference: string
  translation: string
}

interface QuickAction {
  id: string
  title: string
  description: string
  icon: React.ComponentType<any>
  action: () => void
  color: string
  available: boolean
}

interface DashboardProps {
  onPageChange?: (page: string) => void
}

export default function Dashboard({ onPageChange }: DashboardProps) {
  const { profile, updateProfile } = useProfile()
  const { currentCamp, currentRegistration } = useCamp()
  const { teamBalance } = useTeamBalance()
  const { addToast } = useToast()
  const { t } = useLanguage()
  const [optInLoading, setOptInLoading] = useState(false)
  const [currentVerse, setCurrentVerse] = useState<BibleVerse | null>(null)
  const [backgroundImage, setBackgroundImage] = useState<string>('')
  const [generatingVerse, setGeneratingVerse] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const verseRef = useRef<HTMLDivElement>(null)

  // Quick Actions
  const quickActions: QuickAction[] = [
    {
      id: 'sports',
      title: t('sportsSelection'),
      description: t('chooseSportsToParticipate'),
      icon: Trophy,
      action: () => onPageChange?.('sports'),
      color: 'bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800',
      available: true
    },
    {
      id: 'schedule',
      title: t('schedule'),
      description: t('campSchedule'),
      icon: Calendar,
      action: () => onPageChange?.('schedule'),
      color: 'bg-gradient-to-br from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800',
      available: profile?.is_admin || false
    },
    {
      id: 'gallery-moderation',
      title: t('photoModeration'),
      description: 'Review and moderate photo submissions',
      icon: Camera,
      action: () => onPageChange?.('gallery-moderation'),
      color: 'bg-gradient-to-br from-violet-600 to-violet-700 hover:from-violet-700 hover:to-violet-800',
      available: profile?.is_admin || false
    },
    // {
    //   id: 'settings',
    //   title: t('settings'),
    //   description: 'Manage your preferences',
    //   icon: Settings,
    //   action: () => addToast({ type: 'info', title: 'Settings', message: 'Settings panel coming soon!' }),
    //   color: 'bg-gray-500 hover:bg-gray-600',
    //   available: true
    // }
  ]

  // Motivational Bible verses
  const motivationalVerses: BibleVerse[] = [
    {
      verse: t('philippiansVerse'),
      reference: t('philippians'),
      translation: t('niv')
    },
    {
      verse: t('jeremiahVerse'),
      reference: t('jeremiah'),
      translation: t('niv')
    },
    {
      verse: t('joshuaVerse'),
      reference: t('joshua'),
      translation: t('niv')
    },
    {
      verse: t('proverbsVerse'),
      reference: t('proverbs'),
      translation: t('niv')
    },
    {
      verse: t('psalmsVerse'),
      reference: t('psalms'),
      translation: t('niv')
    },
    {
      verse: t('isaiahVerse'),
      reference: t('isaiah'),
      translation: t('niv')
    },
    {
      verse: t('matthewVerse'),
      reference: t('matthew'),
      translation: t('niv')
    },
    {
      verse: t('galatiansVerse'),
      reference: t('galatians'),
      translation: t('niv')
    },
    {
      verse: t('psalms23Verse'),
      reference: t('psalms') + ' 23:1-3',
      translation: t('niv')
    },
    {
      verse: t('romansVerse'),
      reference: t('romans'),
      translation: t('niv')
    }
  ]

  // Scenic background images (unsplash URLs)
  const scenicBackgrounds = [
    "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1200&h=800&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?w=1200&h=800&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1200&h=800&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1200&h=800&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=1200&h=800&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1468779060412-202c7ab43a10?w=1200&h=800&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1465156799763-2c087c332922?w=1200&h=800&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=1200&h=800&fit=crop&auto=format" 
  ]

  useEffect(() => {
    // Check if we need to generate a new verse (every 24 hours)
    const lastVerseDate = localStorage.getItem('lastVerseDate')
    const today = new Date().toDateString()
    
    if (lastVerseDate !== today) {
      generateRandomVerse()
      localStorage.setItem('lastVerseDate', today)
    } else {
      // Load the saved verse from localStorage
      const savedVerse = localStorage.getItem('currentVerse')
      const savedBackground = localStorage.getItem('currentBackground')
      
      if (savedVerse && savedBackground) {
        setCurrentVerse(JSON.parse(savedVerse))
        setBackgroundImage(savedBackground)
      } else {
        generateRandomVerse()
      }
    }
  }, [])

  // Regenerate verse when language changes
  useEffect(() => {
    if (currentVerse) {
      generateRandomVerse()
    }
  }, [t]) // This will trigger when the translation function changes (language changes)

  const generateRandomVerse = () => {
    setGeneratingVerse(true)
    
    // Simulate loading for better UX
    setTimeout(() => {
      const randomVerse = motivationalVerses[Math.floor(Math.random() * motivationalVerses.length)]
      const randomBackground = scenicBackgrounds[Math.floor(Math.random() * scenicBackgrounds.length)]
      
      setCurrentVerse(randomVerse)
      setBackgroundImage(randomBackground)
      
      // Save to localStorage for persistence
      localStorage.setItem('currentVerse', JSON.stringify(randomVerse))
      localStorage.setItem('currentBackground', randomBackground)
      localStorage.setItem('lastVerseDate', new Date().toDateString())
      
      setGeneratingVerse(false)
    }, 1000)
  }

  const downloadVerseImage = async () => {
    if (!verseRef.current || !currentVerse) return
    
    setDownloading(true)
    try {
      // Create a canvas element
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('Could not get canvas context')
      
      // Set canvas size for high quality
      canvas.width = 1200
      canvas.height = 800
      
             // Create a temporary div to render the verse
       const tempDiv = document.createElement('div')
       tempDiv.style.position = 'absolute'
       tempDiv.style.left = '-9999px'
       tempDiv.style.width = '1200px'
       tempDiv.style.height = '800px'
       tempDiv.style.backgroundImage = backgroundImage ? `url(${backgroundImage})` : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
       tempDiv.style.backgroundSize = 'cover'
       tempDiv.style.backgroundPosition = 'center'
       tempDiv.style.display = 'flex'
       tempDiv.style.alignItems = 'center'
       tempDiv.style.justifyContent = 'center'
       tempDiv.style.fontFamily = 'Georgia, serif'
       tempDiv.style.color = 'white'
       tempDiv.style.textAlign = 'center'
       tempDiv.style.textShadow = '2px 2px 4px rgba(0,0,0,0.8)'
       tempDiv.style.borderRadius = '20px'
       tempDiv.style.overflow = 'hidden'
      
      // Add overlay for better text readability
      tempDiv.style.position = 'relative'
      const overlay = document.createElement('div')
      overlay.style.position = 'absolute'
      overlay.style.top = '0'
      overlay.style.left = '0'
      overlay.style.right = '0'
      overlay.style.bottom = '0'
      overlay.style.backgroundColor = 'rgba(0,0,0,0.3)'
      tempDiv.appendChild(overlay)
      
             // Add verse content
       const verseContent = document.createElement('div')
       verseContent.style.position = 'relative'
       verseContent.style.zIndex = '1'
       verseContent.style.maxWidth = '800px'
       verseContent.style.padding = '0 60px'
       verseContent.innerHTML = `
         <div style="font-size: 48px; margin-bottom: 30px; font-weight: bold; line-height: 1.4;">
           "${currentVerse.verse}"
         </div>
         <div style="font-size: 32px; font-style: italic; margin-bottom: 20px;">
           — ${currentVerse.reference}
         </div>
         <div style="font-size: 24px; opacity: 0.9;">
           ${currentVerse.translation}
         </div>
       `
      tempDiv.appendChild(verseContent)
      
      document.body.appendChild(tempDiv)
      
      // Use html2canvas to capture the div
      const html2canvas = (await import('html2canvas')).default
      const canvasResult = await html2canvas(tempDiv, {
        width: 1200,
        height: 800,
        scale: 2, // Higher quality
        useCORS: true,
        allowTaint: true
      })
      
             // Convert to blob and download
       canvasResult.toBlob((blob: Blob | null) => {
         if (blob) {
           const url = URL.createObjectURL(blob)
           const link = document.createElement('a')
           link.href = url
           link.download = `bible-verse-${Date.now()}.png`
           document.body.appendChild(link)
           link.click()
           document.body.removeChild(link)
           URL.revokeObjectURL(url)
           
           addToast({
             type: 'success',
             title: 'Download Complete',
             message: t('bibleVerseDownloaded')
           })
         }
       }, 'image/png', 0.95)
      
      document.body.removeChild(tempDiv)
    } catch (error) {
      console.error('Error downloading verse:', error)
      addToast({
        type: 'error',
        title: 'Download Failed',
        message: 'Could not download the image. Please try again.'
      })
    } finally {
      setDownloading(false)
    }
  }

  // Team switching is handled within PlayerLists to avoid duplicate logic here

  const handleOptInToTeams = async () => {
    if (!currentRegistration) return

    setOptInLoading(true)
    try {
      const { supabase } = await import('../lib/supabase')
      const { error } = await supabase
        .from('camp_registrations')
        .update({ participate_in_teams: true })
        .eq('id', currentRegistration.id)

      if (error) throw error

      addToast({
        type: 'success',
        title: 'Welcome to Teams!',
        message: 'You can now participate in team activities and switch teams.'
      })

      // Refresh the page to update the UI
      window.location.reload()
    } catch (error: any) {
      console.error('Error opting in to teams:', error)
      addToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to opt in to teams. Please try again.'
      })
    } finally {
      setOptInLoading(false)
    }
  }

  if (!profile || !currentCamp || !currentRegistration) {
    return (
      <div className="space-y-8">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    )
  }

  const currentTeam = currentRegistration.current_team && currentRegistration.current_team in TEAMS ? TEAMS[currentRegistration.current_team as TeamColor] : null
  const isAdminNotParticipating = profile.is_admin && !currentRegistration.participate_in_teams

  return (
    <div className="space-y-6 sm:space-y-8 mobile-safe-area mobile-scroll-smooth">
      {/* Camp Hero with Theme and Bible Verse */}
      <CampHero />

      {/* Enhanced User Info Card */}
      <div className="bg-[var(--color-card-bg)] rounded-xl shadow-sm p-4 sm:p-6 border border-[var(--color-border)]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex-1">
            <h2 className="text-xl sm:text-2xl font-bold text-[var(--color-text)] leading-tight">
              {t('welcomeMessageWithName').replace('{name}', currentRegistration.full_name.split(' ')[0])}
            </h2>
            <p className="text-[var(--color-text-muted)] text-sm sm:text-base mt-1">
              {getGradeDisplayWithNumber(currentRegistration.grade)} • {currentRegistration.gender === 'male' ? t('male') : t('female')} • {currentCamp.name}
            </p>
          </div>
        </div>

        {/* Enhanced Quick Actions */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-[var(--color-text)] mb-4 flex items-center">
            <Activity className="h-5 w-5 mr-2" />
            {t('quickActions')}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {quickActions.filter(action => action.available).map((action) => {
              const Icon = action.icon
              return (
                <button
                  key={action.id}
                  onClick={action.action}
                  className={`
                    ${action.color}
                    w-full min-h-[100px] sm:min-h-[120px] lg:min-h-[140px] 
                    text-white p-3 sm:p-4 rounded-xl transition-all duration-300
                    transform hover:scale-105 active:scale-95 focus:scale-105
                    flex flex-col items-center justify-center space-y-2 sm:space-y-3
                    shadow-lg hover:shadow-xl focus:shadow-xl
                    border-0 focus:outline-none focus:ring-4 focus:ring-white focus:ring-opacity-50
                    touch-manipulation select-none
                    animate-scale-in
                    relative overflow-hidden group
                  `}
                  style={{
                    minHeight: '60px',
                    touchAction: 'manipulation'
                  }}
                >
                  {/* Hover effect overlay */}
                  <div className="absolute inset-0 bg-white bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-300"></div>
                  
                  {/* Icon with enhanced styling */}
                  <div className="relative z-10">
                    <Icon className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 drop-shadow-sm text-white" />
                  </div>
                  
                  {/* Text content */}
                  <div className="relative z-10 text-center space-y-1">
                    <div className="font-semibold text-sm sm:text-base lg:text-lg leading-tight text-white drop-shadow-sm">
                      {action.title}
                    </div>
                    <div className="text-xs sm:text-sm text-white text-opacity-90 leading-relaxed px-1 drop-shadow-sm">
                      {action.description}
                    </div>
                  </div>
                  
                  {/* Ripple effect on mobile */}
                  <div className="absolute inset-0 bg-white bg-opacity-0 group-active:bg-opacity-20 transition-all duration-150"></div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Enhanced Admin Opt-in Section */}
        {isAdminNotParticipating && (
          <div className="mb-6 p-4 sm:p-6 bg-[var(--color-bg-muted)] border border-[var(--color-border)] rounded-xl shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-[var(--color-text)] mb-1 flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  {t('teamAssignment')}
                </h3>
                <p className="text-[var(--color-text-muted)] text-sm sm:text-base">
                  {t('teamMembers')}
                </p>
              </div>
              <button
                onClick={handleOptInToTeams}
                disabled={optInLoading}
                className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-4 focus:ring-blue-500 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl touch-manipulation min-h-[48px] min-w-[120px]"
              >
                {optInLoading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                ) : (
                  <UserPlus className="h-5 w-5 mr-2" />
                )}
                <span className="font-medium">{t('teams')}</span>
              </button>
            </div>
          </div>
        )}
        
        {currentTeam && (
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-[var(--color-text)] mb-2">{t('teamColor')}</h3>
            <div className={`inline-flex items-center px-4 py-2 rounded-lg ${currentTeam.lightColor} ${currentTeam.textColor}`}>
              <Users className="h-5 w-5 mr-2" />
              <span className="font-medium">{currentTeam.name} Team</span>
            </div>
          </div>
        )}
        <div className="mb-4 p-3 bg-[var(--color-bg-muted)] rounded-lg border border-[var(--color-border)]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-[var(--color-text-muted)]">
              {t('teamSwitchesRemaining')}: <span className="text-sky-600 font-bold">{currentRegistration.switches_remaining ?? 0}</span>
            </span>
          </div>
          <div className="w-full bg-[var(--color-bg-muted)] rounded-full h-3 overflow-hidden shadow-inner">
            <div
              className="bg-gradient-to-r from-sky-500 to-sky-600 h-3 rounded-full transition-all duration-500 ease-out shadow-sm"
              style={{ width: `${((currentRegistration.switches_remaining ?? 0) / 3) * 100}%` }}
            ></div>
          </div>
        </div>

      </div>

      {/* Motivational Bible Verse Section */}
      <div className="bg-[var(--color-card-bg)] rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-[var(--color-text)]">{t('dailyInspiration')}</h3>
            <p className="text-[var(--color-text-muted)]">{t('motivationalBibleVerse')}</p>
          </div>
           <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
             {profile.is_admin && (
               <button
                 onClick={generateRandomVerse}
                 disabled={generatingVerse}
                 className="inline-flex items-center justify-center px-4 py-3 border border-[var(--color-border)] shadow-lg text-sm font-semibold rounded-xl text-[var(--color-text)] bg-[var(--color-bg)] hover:bg-[var(--color-bg-muted)] focus:outline-none focus:ring-4 focus:ring-sky-500 focus:ring-opacity-50 disabled:opacity-50 transition-all duration-300 transform hover:scale-105 active:scale-95 touch-manipulation min-h-[48px]"
               >
                 {generatingVerse ? (
                   <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-sky-500 mr-2"></div>
                 ) : (
                   <RefreshCw className="h-5 w-5 mr-2" />
                 )}
                 <span className="font-medium">{t('newVerse')}</span>
               </button>
             )}
             <button
               onClick={downloadVerseImage}
               disabled={downloading || !currentVerse}
               className="inline-flex items-center justify-center px-4 py-3 border border-transparent text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-sky-600 to-red-600 hover:from-sky-700 hover:to-red-700 focus:outline-none focus:ring-4 focus:ring-sky-500 focus:ring-opacity-50 disabled:opacity-50 transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl touch-manipulation min-h-[48px]"
             >
               {downloading ? (
                 <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
               ) : (
                 <Download className="h-5 w-5 mr-2" />
               )}
               <span className="font-medium">{t('download')}</span>
             </button>
           </div>
        </div>
        
        {currentVerse && (
          <div 
            ref={verseRef}
            className="relative overflow-hidden rounded-lg"
            style={{
              backgroundImage: backgroundImage ? `url(${backgroundImage})` : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              minHeight: '300px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {/* Overlay for better text readability */}
            <div className="absolute inset-0 bg-black bg-opacity-40"></div>
            
            {/* Verse content */}
            <div className="relative z-10 text-center text-white px-8 py-12 max-w-4xl mx-auto">
              <div className="text-2xl md:text-3xl lg:text-4xl font-bold mb-6 leading-relaxed">
                "{currentVerse.verse}"
              </div>
              <div className="text-lg md:text-xl lg:text-2xl font-semibold mb-3">
                — {currentVerse.reference}
              </div>
              <div className="text-base md:text-lg opacity-90">
                {currentVerse.translation}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Large, Fun Countdown Section with Summer Icons */}
      <div className="relative p-4 sm:p-6">
        {/* Summer Icons - background/floating */}
        <Sun className="absolute left-2 sm:left-4 top-1 sm:top-2 text-cyan-200 opacity-30 w-16 h-16 sm:w-24 sm:h-24 animate-spin-slow" />
        <Star className="absolute right-4 sm:right-8 top-4 sm:top-8 text-yellow-200 opacity-30 w-12 h-12 sm:w-16 sm:h-16 animate-bounce" />
        <Flame className="absolute left-1/2 -translate-x-1/2 bottom-1 sm:bottom-2 text-cyan-300 opacity-20 w-16 h-16 sm:w-20 sm:h-20" />
        <Trees className="absolute left-4 sm:left-8 bottom-4 sm:bottom-8 text-green-200 opacity-30 w-16 h-16 sm:w-20 sm:h-20" />
        <Mountain className="absolute right-2 sm:right-4 bottom-2 sm:bottom-4 text-blue-200 opacity-30 w-20 h-20 sm:w-24 sm:h-24" />
        <div className="relative z-10 w-full">
          <CountdownTimer targetDate={currentCamp.start_date} compact={false} />
        </div>
      </div>

      {/* Scoreboard visible after Daily Inspiration */}
      <Scoreboard />

      {/* Player Lists */}
      <PlayerLists />

      {/* Enhanced Team Balance Overview */}
      <div className="bg-[var(--color-card-bg)] rounded-xl shadow-sm p-4 sm:p-6 border border-[var(--color-border)]">
        <h3 className="text-lg font-semibold text-[var(--color-text)] mb-4 flex items-center">
           <BarChart3 className="h-5 w-5 mr-2 text-blue-600" />
           {t('teamBalanceOverview')}
         </h3>
         <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
           {(() => {
             // Cache and validate teamBalance once per render
             if (!Array.isArray(teamBalance)) {
               console.error('[Dashboard] teamBalance is not an array:', typeof teamBalance, teamBalance)
               return null
             }

             return teamBalance.map((team) => {
               const teamKey = team.team as TeamColor
               const teamData = TEAMS[teamKey]
               return (
                 <div key={team.team} className="text-center group">
                   <div className={`inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20 rounded-full mb-3 transition-all duration-300 transform group-hover:scale-110 shadow-lg ${teamData.color}`}>
                     <span className="text-white font-bold text-lg sm:text-xl lg:text-2xl drop-shadow-sm">{team.total_count}</span>
                   </div>
                   <h4 className="font-semibold text-[var(--color-text)] text-sm sm:text-base lg:text-lg mb-1">{teamData.name}</h4>
                   <div className="flex justify-center items-center space-x-2 text-xs sm:text-sm text-[var(--color-text-muted)]">
                     <span className="flex items-center">
                       <div className="w-2 h-2 bg-blue-500 rounded-full mr-1"></div>
                       {team.male_count}M
                     </span>
                     <span className="flex items-center">
                       <div className="w-2 h-2 bg-pink-500 rounded-full mr-1"></div>
                       {team.female_count}F
                     </span>
                   </div>
                 </div>
               )
             })
           })()}
         </div>
       </div>

      {/* Admin Panel */}
      {profile.is_admin && (
        <>
          <AdminPanel />
        </>
      )}
    </div>
  )
}