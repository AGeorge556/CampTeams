import React, { useState, useEffect, useRef } from 'react'
import { Users, Shield, BarChart3, Sun, Star, Flame, Trees, Mountain, UserPlus, Download, RefreshCw } from 'lucide-react'
import { useProfile } from '../hooks/useProfile'
import { useTeamBalance } from '../hooks/useTeamBalance'
import { TEAMS, TeamColor, supabase } from '../lib/supabase'
import AdminPanel from './AdminPanel'
import PlayerLists from './PlayerLists'
import CountdownTimer from './CountdownTimer'

import { getGradeDisplayWithNumber } from '../lib/utils'
import { useToast } from './Toast'

interface BibleVerse {
  verse: string
  reference: string
  translation: string
}

export default function Dashboard() {
  const { profile, updateProfile } = useProfile()
  const { teamBalance } = useTeamBalance()
  const { addToast } = useToast()
  const [loading, setLoading] = useState(false)
  const [showAdmin, setShowAdmin] = useState(false)
  const [optInLoading, setOptInLoading] = useState(false)
  const [currentVerse, setCurrentVerse] = useState<BibleVerse | null>(null)
  const [backgroundImage, setBackgroundImage] = useState<string>('')
  const [generatingVerse, setGeneratingVerse] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const verseRef = useRef<HTMLDivElement>(null)

  // Motivational Bible verses
  const motivationalVerses: BibleVerse[] = [
    {
      verse: "I can do all things through Christ who strengthens me.",
      reference: "Philippians 4:13",
      translation: "NKJV"
    },
    {
      verse: "For I know the plans I have for you, declares the Lord, plans to prosper you and not to harm you, plans to give you hope and a future.",
      reference: "Jeremiah 29:11",
      translation: "NIV"
    },
    {
      verse: "Be strong and courageous. Do not be afraid; do not be discouraged, for the Lord your God will be with you wherever you go.",
      reference: "Joshua 1:9",
      translation: "NIV"
    },
    {
      verse: "Trust in the Lord with all your heart and lean not on your own understanding; in all your ways submit to him, and he will make your paths straight.",
      reference: "Proverbs 3:5-6",
      translation: "NIV"
    },
    {
      verse: "The Lord is my strength and my shield; my heart trusts in him, and he helps me.",
      reference: "Psalm 28:7",
      translation: "NIV"
    },
    {
      verse: "But those who hope in the Lord will renew their strength. They will soar on wings like eagles; they will run and not grow weary, they will walk and not be faint.",
      reference: "Isaiah 40:31",
      translation: "NIV"
    },
    {
      verse: "Come to me, all you who are weary and burdened, and I will give you rest.",
      reference: "Matthew 11:28",
      translation: "NIV"
    },
    {
      verse: "Let us not become weary in doing good, for at the proper time we will reap a harvest if we do not give up.",
      reference: "Galatians 6:9",
      translation: "NIV"
    },
    {
      verse: "The Lord is my shepherd, I lack nothing. He makes me lie down in green pastures, he leads me beside quiet waters, he refreshes my soul.",
      reference: "Psalm 23:1-3",
      translation: "NIV"
    },
    {
      verse: "And we know that in all things God works for the good of those who love him, who have been called according to his purpose.",
      reference: "Romans 8:28",
      translation: "NIV"
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
             message: 'Your Bible verse image has been downloaded!'
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

  const handleSwitchTeam = async (newTeam: TeamColor) => {
    if (!profile || loading) return
    setLoading(true)
    try {
      const { data: canSwitch, error: validateError } = await supabase
        .rpc('can_switch_team', {
          user_id: profile.id,
          new_team: newTeam
        })
      if (validateError) throw validateError
      if (!canSwitch) {
        alert('Team switch not allowed. You may have no switches remaining, teams are locked, or the team is full.')
        return
      }
      const { error: switchError } = await supabase
        .from('team_switches')
        .insert({
          user_id: profile.id,
          from_team: profile.current_team,
          to_team: newTeam
        })
      if (switchError) throw switchError
      const { error: updateError } = await updateProfile({
        current_team: newTeam,
        switches_remaining: profile.switches_remaining - 1
      })
      if (updateError) throw updateError
    } catch (error) {
      console.error('Error switching team:', (error as any))
      alert('Error switching team: ' + (error as any).message)
    } finally {
      setLoading(false)
    }
  }

  const handleOptInToTeams = async () => {
    if (!profile || optInLoading) return
    
    setOptInLoading(true)
    try {
      // Find the team with the least players for balanced assignment
      const teamCounts = teamBalance.reduce((acc, team) => {
        acc[team.team] = team.total_count
        return acc
      }, {} as Record<string, number>)
      
      const leastPopulatedTeam = Object.entries(teamCounts)
        .sort(([,a], [,b]) => a - b)[0][0] as TeamColor
      
      const { error } = await updateProfile({
        participate_in_teams: true,
        current_team: leastPopulatedTeam
      })
      
      if (error) throw error
      
      addToast({
        type: 'success',
        title: 'Welcome to Teams!',
        message: `You have been assigned to the ${TEAMS[leastPopulatedTeam].name} team. You can now switch teams like other participants.`
      })
      
      // Refresh the page to update all components
      setTimeout(() => {
        window.location.reload()
      }, 1000)
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

  if (!profile) {
    return <div>Loading...</div>
  }

  const currentTeam = profile.current_team ? TEAMS[profile.current_team] : null
  const isAdminNotParticipating = profile.is_admin && !profile.participate_in_teams

  return (
    <div className="space-y-8">
      {/* User Info Card */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Welcome back, {profile.full_name}!
            </h2>
            <p className="text-gray-600">
              {getGradeDisplayWithNumber(profile.grade)} • {profile.gender === 'male' ? 'Male' : 'Female'}
            </p>
          </div>
          {profile.is_admin && (
            <button
              onClick={() => setShowAdmin(!showAdmin)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            >
              <Shield className="h-4 w-4 mr-2" />
              {showAdmin ? 'Hide Admin' : 'Show Admin'}
            </button>
          )}
        </div>

        {/* Admin Opt-in Section */}
        {isAdminNotParticipating && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-blue-900 mb-1">Join Team Activities</h3>
                <p className="text-blue-700 text-sm">
                  As an admin, you're not currently participating in team activities. 
                  Click below to join a team and participate in camp activities with the participants.
                </p>
              </div>
              <button
                onClick={handleOptInToTeams}
                disabled={optInLoading}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {optInLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <UserPlus className="h-4 w-4 mr-2" />
                )}
                Join Teams
              </button>
            </div>
          </div>
        )}
        
        {currentTeam && (
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Current Team</h3>
            <div className={`inline-flex items-center px-4 py-2 rounded-lg ${currentTeam.lightColor} ${currentTeam.textColor}`}>
              <Users className="h-5 w-5 mr-2" />
              <span className="font-medium">{currentTeam.name} Team</span>
            </div>
          </div>
        )}
        <div className="mb-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">
              Team switches remaining: {profile.switches_remaining}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div 
              className="bg-orange-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(profile.switches_remaining / 3) * 100}%` }}
            ></div>
          </div>
        </div>
        {profile.friend_requests.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Friend Requests</h3>
            <div className="flex flex-wrap gap-2">
              {profile.friend_requests.map((friend, index) => (
                <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                  {friend}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Motivational Bible Verse Section */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Daily Inspiration</h3>
            <p className="text-gray-600">A motivational Bible verse to start your day</p>
          </div>
          <div className="flex space-x-2">
            {profile.is_admin && (
              <button
                onClick={generateRandomVerse}
                disabled={generatingVerse}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50"
              >
                {generatingVerse ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-500 mr-2"></div>
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                New Verse
              </button>
            )}
            <button
              onClick={downloadVerseImage}
              disabled={downloading || !currentVerse}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50"
            >
              {downloading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Download
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
      <div className="relative p-6">
        {/* Summer Icons - background/floating */}
        <Sun className="absolute left-4 top-2 text-orange-200 opacity-30 w-24 h-24 animate-spin-slow" />
        <Star className="absolute right-8 top-8 text-yellow-200 opacity-30 w-16 h-16 animate-bounce" />
        <Flame className="absolute left-1/2 -translate-x-1/2 bottom-2 text-orange-300 opacity-20 w-20 h-20" />
        <Trees className="absolute left-8 bottom-8 text-green-200 opacity-30 w-20 h-20" />
        <Mountain className="absolute right-4 bottom-4 text-blue-200 opacity-30 w-24 h-24" />
        <div className="relative z-10 w-full">
          <CountdownTimer targetDate="2025-08-28T00:00:00" compact={false} />
        </div>
      </div>

            {/* Player Lists */}
            <PlayerLists />



      {/* Team Balance Overview */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <BarChart3 className="h-5 w-5 mr-2" />
          Team Balance Overview
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {teamBalance.map((team) => (
            <div key={team.team} className="text-center">
              <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-2 ${TEAMS[team.team as TeamColor].color}`}>
                <span className="text-white font-bold text-lg">{team.total_count}</span>
              </div>
              <h4 className="font-medium text-gray-900">{TEAMS[team.team as TeamColor].name}</h4>
              <p className="text-sm text-gray-600">
                {team.male_count}M / {team.female_count}F
              </p>
            </div>
          ))}
        </div>
      </div>



      {/* Admin Panel */}
      {profile.is_admin && showAdmin && (
        <AdminPanel />
      )}
    </div>
  )
}