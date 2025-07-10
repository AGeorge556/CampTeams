import React, { useState } from 'react'
import { Users, Shuffle, Shield, BarChart3, RefreshCw } from 'lucide-react'
import { useProfile } from '../hooks/useProfile'
import { useTeamBalance } from '../hooks/useTeamBalance'
import { TEAMS, TeamColor, supabase } from '../lib/supabase'
import TeamCard from './TeamCard'
import AdminPanel from './AdminPanel'

export default function Dashboard() {
  const { profile, updateProfile } = useProfile()
  const { teamBalance } = useTeamBalance()
  const [loading, setLoading] = useState(false)
  const [showAdmin, setShowAdmin] = useState(false)

  const handleSwitchTeam = async (newTeam: TeamColor) => {
    if (!profile || loading) return
    
    setLoading(true)
    try {
      // Check if switch is allowed
      const { data: canSwitch, error: validateError } = await supabase
        .rpc('can_switch_team', {
          user_id: profile.id,
          new_team: newTeam
        })

      if (validateError) {
        throw validateError
      }

      if (!canSwitch) {
        alert('Team switch not allowed. You may have no switches remaining, teams are locked, or the team is full.')
        return
      }

      // Record the switch
      const { error: switchError } = await supabase
        .from('team_switches')
        .insert({
          user_id: profile.id,
          from_team: profile.current_team,
          to_team: newTeam
        })

      if (switchError) {
        throw switchError
      }

      // Update profile
      const { error: updateError } = await updateProfile({
        current_team: newTeam,
        switches_remaining: profile.switches_remaining - 1
      })

      if (updateError) {
        throw updateError
      }

    } catch (error: any) {
      console.error('Error switching team:', error)
      alert('Error switching team: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSurpriseMe = async () => {
    if (!profile || loading) return
    
    const availableTeams = Object.keys(TEAMS).filter(team => team !== profile.current_team) as TeamColor[]
    const randomTeam = availableTeams[Math.floor(Math.random() * availableTeams.length)]
    
    await handleSwitchTeam(randomTeam)
  }

  if (!profile) {
    return <div>Loading...</div>
  }

  const currentTeam = profile.current_team ? TEAMS[profile.current_team] : null

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
              Grade {profile.grade} • {profile.gender === 'male' ? 'Male' : 'Female'}
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

        {/* Current Team */}
        {currentTeam && (
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Current Team</h3>
            <div className={`inline-flex items-center px-4 py-2 rounded-lg ${currentTeam.lightColor} ${currentTeam.textColor}`}>
              <Users className="h-5 w-5 mr-2" />
              <span className="font-medium">{currentTeam.name} Team</span>
            </div>
          </div>
        )}

        {/* Switches Remaining */}
        <div className="mb-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">
              Team switches remaining: {profile.switches_remaining}
            </span>
            <div className="flex space-x-2">
              {profile.switches_remaining > 0 && (
                <button
                  onClick={handleSurpriseMe}
                  disabled={loading}
                  className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-indigo-600 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  <Shuffle className="h-4 w-4 mr-1" />
                  Surprise Me!
                </button>
              )}
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div 
              className="bg-orange-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(profile.switches_remaining / 3) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Friend Requests */}
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

      {/* Team Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Object.entries(TEAMS).map(([key, team]) => {
          const teamData = teamBalance.find(t => t.team === key)
          return (
            <TeamCard
              key={key}
              team={key as TeamColor}
              teamData={teamData}
              isCurrentTeam={profile.current_team === key}
              canSwitch={profile.switches_remaining > 0 && profile.current_team !== key}
              onSwitchTeam={handleSwitchTeam}
              loading={loading}
            />
          )
        })}
      </div>

      {/* Admin Panel */}
      {profile.is_admin && showAdmin && (
        <AdminPanel />
      )}
    </div>
  )
}