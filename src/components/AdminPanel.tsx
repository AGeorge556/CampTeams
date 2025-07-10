import React, { useState, useEffect } from 'react'
import { Shield, Users, Settings, Calendar, Download, UserX, UserCheck } from 'lucide-react'
import { supabase, Profile, TEAMS, TeamColor } from '../lib/supabase'
import { useTeamBalance } from '../hooks/useTeamBalance'

export default function AdminPanel() {
  const { teamBalance } = useTeamBalance()
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [campSettings, setCampSettings] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [selectedTeam, setSelectedTeam] = useState<TeamColor | 'all'>('all')

  useEffect(() => {
    fetchProfiles()
    fetchCampSettings()
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
      "Name,Grade,Gender,Team,Switches Remaining,Friend Requests,Join Date\n" +
      profiles.map(p => 
        `"${p.full_name}",${p.grade},${p.gender},${p.current_team || 'Unassigned'},${p.switches_remaining},"${p.friend_requests.join('; ')}",${new Date(p.created_at).toLocaleDateString()}`
      ).join("\n")
    
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", "camp_roster.csv")
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const filteredProfiles = selectedTeam === 'all' 
    ? profiles 
    : profiles.filter(p => p.current_team === selectedTeam)

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center">
          <Shield className="h-6 w-6 mr-2 text-purple-600" />
          Admin Panel
        </h2>
        <div className="flex space-x-2">
          <button
            onClick={exportRoster}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            <Download className="h-4 w-4 mr-2" />
            Export Roster
          </button>
          <button
            onClick={toggleTeamsLock}
            disabled={loading}
            className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              campSettings?.teams_locked
                ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                : 'bg-orange-600 hover:bg-orange-700 focus:ring-orange-500'
            } disabled:opacity-50`}
          >
            {campSettings?.teams_locked ? (
              <>
                <UserCheck className="h-4 w-4 mr-2" />
                Unlock Teams
              </>
            ) : (
              <>
                <UserX className="h-4 w-4 mr-2" />
                Lock Teams
              </>
            )}
          </button>
        </div>
      </div>

      {/* Camp Settings */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
          <Settings className="h-5 w-5 mr-2" />
          Camp Settings
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="font-medium">Teams Status:</span>
            <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
              campSettings?.teams_locked 
                ? 'bg-red-100 text-red-800' 
                : 'bg-green-100 text-green-800'
            }`}>
              {campSettings?.teams_locked ? 'Locked' : 'Open'}
            </span>
          </div>
          <div>
            <span className="font-medium">Max Team Size:</span>
            <span className="ml-2">{campSettings?.max_team_size || 50}</span>
          </div>
          <div>
            <span className="font-medium">Total Participants:</span>
            <span className="ml-2">{profiles.length}</span>
          </div>
        </div>
      </div>

      {/* Team Balance Stats */}
      <div className="mb-6">
        <h3 className="font-semibold text-gray-900 mb-4">Team Balance Statistics</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {teamBalance.map((team) => (
            <div key={team.team} className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">{TEAMS[team.team as TeamColor].name}</h4>
                <span className="text-2xl font-bold">{team.total_count}</span>
              </div>
              <div className="space-y-1 text-sm text-gray-600">
                <div>Gender: {team.male_count}M / {team.female_count}F</div>
                <div>Grades: 7({team.grade_7_count}) 8({team.grade_8_count}) 9({team.grade_9_count}) 10({team.grade_10_count}) 11({team.grade_11_count}) 12({team.grade_12_count})</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Participant Management */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Participant Management</h3>
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
                    {profile.grade}
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
    </div>
  )
}