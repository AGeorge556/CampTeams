import React, { useState, useEffect } from 'react'
import { Trophy, CheckCircle, XCircle, Save } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useProfile } from '../hooks/useProfile'
import { useLanguage } from '../contexts/LanguageContext'

interface Sport {
  id: string
  name: string
  description: string
  icon: string
  color: string
  participants: number
}

interface UserSportSelection {
  user_id: string
  sport_id: string
  created_at: string
}

export default function SportsSelection() {
  const { profile } = useProfile()
  const { t } = useLanguage()
  const [sports, setSports] = useState<Sport[]>([])
  const [userSelections, setUserSelections] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const availableSports: Sport[] = [
    {
      id: 'soccer',
      name: t('soccer'),
      description: t('soccerDescription'),
      icon: '⚽',
      color: 'bg-green-500',
      participants: 0
    },
    {
      id: 'dodgeball',
      name: t('dodgeball'),
      description: t('dodgeballDescription'),
      icon: '🏐',
      color: 'bg-red-500',
      participants: 0
    },
    {
      id: 'chairball',
      name: t('chairball'),
      description: t('chairballDescription'),
      icon: '🪑',
      color: 'bg-blue-500',
      participants: 0
    },
    {
      id: 'big-game',
      name: t('bigGame'),
      description: t('bigGameDescription'),
      icon: '🎯',
      color: 'bg-purple-500',
      participants: 0
    },
    {
      id: 'pool-time',
      name: t('poolTime'),
      description: t('poolTimeDescription'),
      icon: '🏊',
      color: 'bg-cyan-500',
      participants: 0
    }
  ]

  useEffect(() => {
    loadSportsData()
  }, [profile])

  const loadSportsData = async () => {
    try {
      // Load user's current selections
      if (profile) {
        const { data: selections, error: selectionsError } = await supabase
          .from('user_sport_selections')
          .select('sport_id')
          .eq('user_id', profile.id)

        if (!selectionsError && selections) {
          setUserSelections(selections.map(s => s.sport_id))
        }
      }

      // Load participant counts for each sport
      const { data: participantCounts, error: countsError } = await supabase
        .from('user_sport_selections')
        .select('sport_id')

      if (!countsError && participantCounts) {
        const counts = participantCounts.reduce((acc, selection) => {
          acc[selection.sport_id] = (acc[selection.sport_id] || 0) + 1
          return acc
        }, {} as Record<string, number>)

        setSports(availableSports.map(sport => ({
          ...sport,
          participants: counts[sport.id] || 0
        })))
      } else {
        setSports(availableSports)
      }
    } catch (error) {
      console.error('Error loading sports data:', error)
      setSports(availableSports)
    } finally {
      setLoading(false)
    }
  }

  const toggleSport = async (sportId: string) => {
    if (!profile || saving) return

    setSaving(true)
    try {
      const isSelected = userSelections.includes(sportId)

      if (isSelected) {
        // Remove selection
        const { error } = await supabase
          .from('user_sport_selections')
          .delete()
          .eq('user_id', profile.id)
          .eq('sport_id', sportId)

        if (error) throw error

        setUserSelections(prev => prev.filter(id => id !== sportId))
      } else {
        // Add selection using upsert to handle duplicates
        const { error } = await supabase
          .from('user_sport_selections')
          .upsert({
            user_id: profile.id,
            sport_id: sportId
          }, {
            onConflict: 'user_id,sport_id'
          })

        if (error) throw error

        setUserSelections(prev => [...prev, sportId])
      }

      // Reload participant counts
      await loadSportsData()
    } catch (error) {
      console.error('Error updating sport selection:', error)
      alert('Error updating selection. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const getSportCard = (sport: Sport) => {
    const isSelected = userSelections.includes(sport.id)
    const isParticipating = userSelections.includes(sport.id)

    return (
      <div
        key={sport.id}
        className={`relative bg-white rounded-lg shadow-sm border-2 transition-all duration-200 cursor-pointer hover:shadow-md ${
          isSelected ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-gray-300'
        }`}
        onClick={() => toggleSport(sport.id)}
      >
        {/* Selection Indicator */}
        {isSelected && (
          <div className="absolute top-3 right-3">
            <CheckCircle className="h-6 w-6 text-green-500" />
          </div>
        )}

        {/* Sport Header */}
        <div className={`${sport.color} rounded-t-lg p-4 text-white`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">{sport.icon}</span>
              <div>
                <h3 className="font-bold text-lg">{sport.name}</h3>
                <p className="text-sm opacity-90">{sport.participants} {t('participants')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Sport Details */}
        <div className="p-4">
          <p className="text-gray-600 text-sm mb-4">{sport.description}</p>
          
          {/* Participation Status */}
          <div className="flex items-center justify-between">
            <span className={`text-sm font-medium ${
              isSelected ? 'text-green-600' : 'text-gray-500'
            }`}>
              {isSelected ? t('youreParticipating') : t('clickToJoin')}
            </span>
            
            {saving && isSelected && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-500"></div>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center space-x-3">
          <Trophy className="h-8 w-8 text-orange-500" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('sportsSelection')}</h1>
            <p className="text-gray-600">{t('chooseSportsToParticipate')}</p>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">{t('howItWorks')}</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• {t('clickToJoinOrLeave')}</li>
          <li>• {t('participateInMultipleSports')}</li>
          <li>• {t('changesSavedAutomatically')}</li>
        </ul>
      </div>

      {/* Sports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sports.map(sport => getSportCard(sport))}
      </div>

      {/* Summary */}
      {userSelections.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('yourSports')}</h3>
          <div className="flex flex-wrap gap-2">
            {userSelections.map(sportId => {
              const sport = sports.find(s => s.id === sportId)
              return sport ? (
                <span
                  key={sportId}
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${sport.color} text-white`}
                >
                  {sport.icon} {sport.name}
                </span>
              ) : null
            })}
          </div>
          <p className="text-sm text-gray-600 mt-3">
            {t('participatingInSports')} {userSelections.length} {userSelections.length !== 1 ? t('teams') : t('teams')}
          </p>
        </div>
      )}

      {/* No Selections */}
      {userSelections.length === 0 && (
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">{t('noSportsSelectedYet')}</h3>
          <p className="text-gray-600">{t('clickOnAnySportToStart')}</p>
        </div>
      )}
    </div>
  )
} 