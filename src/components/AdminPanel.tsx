import React, { useState, useEffect } from 'react'
import { Shield, Users, Settings, Calendar, Download, UserX, UserCheck, Trophy, Zap } from 'lucide-react'
import { supabase, Profile, TEAMS, TeamColor } from '../lib/supabase'
import { useTeamBalance } from '../hooks/useTeamBalance'
import { useOilExtractionVisibility } from '../hooks/useOilExtractionVisibility'
import { useLanguage } from '../contexts/LanguageContext'
import { getGradeDisplayWithNumber } from '../lib/utils'

interface SportSelection {
  sport_id: string
  sport_name: string
  participants: Profile[]
}

export default function AdminPanel() {
  const { teamBalance } = useTeamBalance()
  const { oilExtractionVisible, toggleOilExtractionVisibility, loading: oilVisibilityLoading } = useOilExtractionVisibility()
  const { t } = useLanguage()
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [campSettings, setCampSettings] = useState<any>(null)
  const [sportSelections, setSportSelections] = useState<SportSelection[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedTeam, setSelectedTeam] = useState<TeamColor | 'all'>('all')
  const [activeTab, setActiveTab] = useState<'participants' | 'sports'>('participants')

  useEffect(() => {
    fetchProfiles()
    fetchCampSettings()
    fetchSportSelections()
  }, [])

  const fetchProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setProfiles(data || [])
    } catch (error) {
      console.error('Error fetching profiles:', error)
    }
  }

  const fetchCampSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('camp_settings')
        .select('*')
        .single()
      
      if (error) throw error
      setCampSettings(data)
    } catch (error) {
      console.error('Error fetching camp settings:', error)
    }
  }

  const fetchSportSelections = async () => {
    try {
      // Get all sport selections with user profiles
      const { data: selections, error: selectionsError } = await supabase
        .from('user_sport_selections')
        .select(`
          sport_id,
          profiles!inner(
            id,
            full_name,
            grade,
            gender,
            current_team,
            is_admin
          )
        `)

      if (selectionsError) throw selectionsError

      // Group by sport
      const sportMap = new Map<string, SportSelection>()
      
      selections?.forEach(selection => {
        const sportId = selection.sport_id
        const profile = selection.profiles as any
        
        if (!sportMap.has(sportId)) {
          sportMap.set(sportId, {
            sport_id: sportId,
            sport_name: getSportDisplayName(sportId),
            participants: []
          })
        }
        
        sportMap.get(sportId)!.participants.push(profile)
      })

      setSportSelections(Array.from(sportMap.values()))
    } catch (error) {
      console.error('Error fetching sport selections:', error)
    }
  }

  const getSportDisplayName = (sportId: string): string => {
    const sportNames: Record<string, string> = {
      'soccer': 'Soccer ⚽',
      'dodgeball': 'Dodgeball 🏐',
      'chairball': 'Chairball 🪑',
      'big-game': 'Big Game 🎯',
      'pool-time': 'Pool Time 🏊'
    }
    return sportNames[sportId] || sportId
  }

  const toggleTeamsLock = async () => {
    if (!campSettings) return
    
    setLoading(true)
    try {
      const { error } = await supabase
        .from('camp_settings')
        .update({
          teams_locked: !campSettings.teams_locked,
          lock_date: !campSettings.teams_locked ? new Date().toISOString() : null
        })
        .eq('id', campSettings.id)
      
      if (error) throw error
      
      await fetchCampSettings()
    } catch (error) {
      console.error('Error toggling teams lock:', error)
    } finally {
      setLoading(false)
    }
  }

  const reassignUser = async (userId: string, newTeam: TeamColor) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ current_team: newTeam })
        .eq('id', userId)
      
      if (error) throw error
      
      await fetchProfiles()
    } catch (error) {
      console.error('Error reassigning user:', error)
    }
  }

  const exportRoster = () => {
    const csvContent = "data:text/csv;charset=utf-8," + 
      "Name,Grade,Gender,Team,Switches Remaining,Join Date\n" +
      profiles.map(p => 
        `"${p.full_name}",${p.grade},${p.gender},${p.current_team || 'Unassigned'},${p.switches_remaining},${new Date(p.created_at).toLocaleDateString()}`
      ).join("\n")
    
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", "camp_roster.csv")
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const exportSportSelections = () => {
    const csvContent = "data:text/csv;charset=utf-8," + 
      "Sport,Name,Grade,Gender,Team,Admin\n" +
      sportSelections.flatMap(sport => 
        sport.participants.map(p => 
          `"${sport.sport_name}","${p.full_name}",${p.grade},${p.gender},${p.current_team || 'Unassigned'},${p.is_admin ? 'Yes' : 'No'}`
        )
      ).join("\n")
    
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", "sport_selections.csv")
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const filteredProfiles = selectedTeam === 'all' 
    ? profiles 
    : profiles.filter(p => p.current_team === selectedTeam)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Shield className="h-8 w-8 text-purple-500" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Admin Panel</h2>
              <p className="text-gray-600">Manage camp participants and settings</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('participants')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'participants'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Users className="h-4 w-4 inline mr-2" />
              Participant Management
            </button>
            <button
              onClick={() => setActiveTab('sports')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'sports'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Trophy className="h-4 w-4 inline mr-2" />
              Sport Selections
            </button>
          </nav>
        </div>
      </div>

      {/* Camp Settings */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Camp Settings</h3>
          <button
            onClick={toggleTeamsLock}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
          >
            <Settings className="h-4 w-4 mr-2" />
            {campSettings?.teams_locked ? 'Unlock Teams' : 'Lock Teams'}
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900">Teams Status</h4>
            <p className="text-sm text-gray-600">
              {campSettings?.teams_locked ? 'Locked' : 'Unlocked'}
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900">Lock Date</h4>
            <p className="text-sm text-gray-600">
              {campSettings?.lock_date 
                ? new Date(campSettings.lock_date).toLocaleDateString()
                : 'Not locked'
              }
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900">Max Team Size</h4>
            <p className="text-sm text-gray-600">{campSettings?.max_team_size || 50}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900">{t('oilExtractionVisibility')}</h4>
            <p className="text-sm text-gray-600">
              {oilExtractionVisible ? t('oilExtractionVisible') : t('oilExtractionHidden')}
            </p>
          </div>
        </div>
        
        {/* Oil Extraction Visibility Toggle */}
        <div className="mt-4 flex items-center justify-between p-4 bg-orange-50 border border-orange-200 rounded-lg">
          <div className="flex items-center">
            <Zap className="h-5 w-5 text-orange-600 mr-3" />
            <div>
              <h4 className="font-medium text-gray-900">{t('oilExtractionVisibility')}</h4>
              <p className="text-sm text-gray-600">
                {oilExtractionVisible ? t('oilExtractionVisible') : t('oilExtractionHidden')}
              </p>
            </div>
          </div>
          <button
            onClick={toggleOilExtractionVisibility}
            disabled={oilVisibilityLoading}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50"
          >
            {oilVisibilityLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <Zap className="h-4 w-4 mr-2" />
            )}
            {oilExtractionVisible ? t('hideOilExtraction') : t('showOilExtraction')}
          </button>
        </div>
      </div>

      {/* Content based on active tab */}
      {activeTab === 'participants' ? (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Participant Management</h3>
            <div className="flex space-x-2">
              <select
                value={selectedTeam}
                onChange={(e) => setSelectedTeam(e.target.value as TeamColor | 'all')}
                className="rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              >
                <option value="all">All Teams</option>
                {Object.entries(TEAMS).map(([key, team]) => (
                  <option key={key} value={key}>{team.name}</option>
                ))}
              </select>
              <button
                onClick={exportRoster}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </button>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Grade
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Gender
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Current Team
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Switches
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProfiles.map((profile) => (
                  <tr key={profile.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {profile.full_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {getGradeDisplayWithNumber(profile.grade)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {profile.gender}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {profile.current_team ? (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          TEAMS[profile.current_team].lightColor
                        } ${TEAMS[profile.current_team].textColor}`}>
                          {TEAMS[profile.current_team].name}
                        </span>
                      ) : (
                        <span className="text-gray-400">Unassigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {profile.switches_remaining}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <select
                        value={profile.current_team || ''}
                        onChange={(e) => reassignUser(profile.id, e.target.value as TeamColor)}
                        className="rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 text-sm"
                      >
                        <option value="">Unassigned</option>
                        {Object.entries(TEAMS).map(([key, team]) => (
                          <option key={key} value={key}>{team.name}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : activeTab === 'sports' ? (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Sport Selections</h3>
            <button
              onClick={exportSportSelections}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </button>
          </div>
          
          <div className="space-y-6">
            {sportSelections.map((sport) => (
              <div key={sport.sport_id} className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h4 className="text-lg font-semibold text-gray-900">{sport.sport_name}</h4>
                  <p className="text-sm text-gray-600">{sport.participants.length} participants</p>
                </div>
                <div className="px-6 py-4">
                  {sport.participants.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {sport.participants.map((participant) => (
                        <div key={participant.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{participant.full_name}</p>
                            <p className="text-xs text-gray-500">
                              {getGradeDisplayWithNumber(participant.grade)} • {participant.gender}
                              {participant.current_team && (
                                <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                  TEAMS[participant.current_team].lightColor
                                } ${TEAMS[participant.current_team].textColor}`}>
                                  {TEAMS[participant.current_team].name}
                                </span>
                              )}
                            </p>
                          </div>
                          {participant.is_admin && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                              Admin
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4">No participants yet</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}