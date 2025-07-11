import React, { useState } from 'react'
import { User, GraduationCap, Users, Heart, Save } from 'lucide-react'
import { useProfile } from '../hooks/useProfile'
import { TEAMS, TeamColor } from '../lib/supabase'

export default function OnboardingForm() {
  const { createProfile } = useProfile()
  const [formData, setFormData] = useState({
    full_name: '',
    grade: 7,
    gender: 'male' as 'male' | 'female',
    preferred_team: 'red' as TeamColor,
    friend_requests: ['', '', '']
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Filter out empty friend requests
      const filteredFriends = formData.friend_requests.filter(friend => friend.trim() !== '')
      
      const { error } = await createProfile({
        full_name: formData.full_name,
        grade: formData.grade,
        gender: formData.gender,
        preferred_team: formData.preferred_team,
        current_team: formData.preferred_team, // Start with preferred team
        friend_requests: filteredFriends,
        switches_remaining: 3,
        is_admin: false
      })

      if (error) throw error
      
      // Refresh the page to trigger the app to show the Dashboard
      window.location.reload()
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleFriendRequestChange = (index: number, value: string) => {
    const newFriendRequests = [...formData.friend_requests]
    newFriendRequests[index] = value
    setFormData({ ...formData, friend_requests: newFriendRequests })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-yellow-50 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Users className="h-16 w-16 text-orange-500 mx-auto" />
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Welcome to Camp!
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Tell us about yourself to get started
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Full Name */}
            <div>
              <label htmlFor="full_name" className="block text-sm font-medium text-gray-700">
                Full Name
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="full_name"
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  required
                  className="appearance-none block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                  placeholder="Enter your full name"
                />
              </div>
            </div>

            {/* Grade */}
            <div>
              <label htmlFor="grade" className="block text-sm font-medium text-gray-700">
                Grade
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <GraduationCap className="h-5 w-5 text-gray-400" />
                </div>
                <select
                  id="grade"
                  value={formData.grade}
                  onChange={(e) => setFormData({ ...formData, grade: Number(e.target.value) })}
                  className="appearance-none block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                >
                  <option value={7}>1st Preparatory (7)</option>
                  <option value={8}>2nd Preparatory (8)</option>
                  <option value={9}>3rd Preparatory (9)</option>
                  <option value={10}>1st Secondary (10)</option>
                  <option value={11}>2nd Secondary (11)</option>
                  <option value={12}>3rd Secondary (12)</option>
                </select>
              </div>
            </div>

            {/* Gender */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Gender
              </label>
              <div className="mt-2 space-y-2">
                {[
                  { value: 'male', label: 'Male' },
                  { value: 'female', label: 'Female' }
                ].map((option) => (
                  <label key={option.value} className="flex items-center">
                    <input
                      type="radio"
                      name="gender"
                      value={option.value}
                      checked={formData.gender === option.value}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value as 'male' | 'female' })}
                      className="focus:ring-orange-500 h-4 w-4 text-orange-600 border-gray-300"
                    />
                    <span className="ml-2 text-sm text-gray-700">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Preferred Team */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Preferred Team
              </label>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {Object.entries(TEAMS).map(([key, team]) => (
                  <label key={key} className="flex items-center">
                    <input
                      type="radio"
                      name="preferred_team"
                      value={key}
                      checked={formData.preferred_team === key}
                      onChange={(e) => setFormData({ ...formData, preferred_team: e.target.value as TeamColor })}
                      className="focus:ring-orange-500 h-4 w-4 text-orange-600 border-gray-300"
                    />
                    <span className={`ml-2 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${team.lightColor} ${team.textColor}`}>
                      {team.name}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Friend Requests */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Friend Requests (Optional)
              </label>
              <p className="text-xs text-gray-500 mb-2">
                Enter up to 3 friends' names you'd like to be on the same team with
              </p>
              <div className="space-y-2">
                {formData.friend_requests.map((friend, index) => (
                  <div key={index} className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Heart className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      value={friend}
                      onChange={(e) => handleFriendRequestChange(index, e.target.value)}
                      className="appearance-none block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                      placeholder={`Friend ${index + 1} name`}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  <Save className="h-5 w-5 mr-2" />
                  Join Camp
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}