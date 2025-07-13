import React, { useState } from 'react'
import { Users, Shield, BarChart3, Sun, Star, Flame, Trees, Mountain, UserPlus } from 'lucide-react'
import { useProfile } from '../hooks/useProfile'
import { useTeamBalance } from '../hooks/useTeamBalance'
import { TEAMS, TeamColor, supabase } from '../lib/supabase'
import AdminPanel from './AdminPanel'
import PlayerLists from './PlayerLists'
import CountdownTimer from './CountdownTimer'
import { getGradeDisplayWithNumber } from '../lib/utils'
import { useToast } from './Toast'

export default function Dashboard() {
  const { profile, updateProfile } = useProfile()
  const { teamBalance } = useTeamBalance()
  const { addToast } = useToast()
  const [loading, setLoading] = useState(false)
  const [showAdmin, setShowAdmin] = useState(false)
  const [optInLoading, setOptInLoading] = useState(false)

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

      {/* Large, Fun Countdown Section with Summer Icons */}
      <div className="relative flex items-center justify-center py-12">
        {/* Summer Icons - background/floating */}
        <Sun className="absolute left-4 top-2 text-orange-200 opacity-30 w-24 h-24 animate-spin-slow" />
        <Star className="absolute right-8 top-8 text-yellow-200 opacity-30 w-16 h-16 animate-bounce" />
        <Flame className="absolute left-1/2 -translate-x-1/2 bottom-2 text-orange-300 opacity-20 w-20 h-20" />
        <Trees className="absolute left-8 bottom-8 text-green-200 opacity-30 w-20 h-20" />
        <Mountain className="absolute right-4 bottom-4 text-blue-200 opacity-30 w-24 h-24" />
        <div className="relative z-10 w-full max-w-2xl mx-auto">
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