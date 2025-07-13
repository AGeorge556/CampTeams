import React, { useState } from 'react'
import { User, GraduationCap, Users, Heart, Save } from 'lucide-react'
import { useProfile } from '../hooks/useProfile'
import { useToast } from './Toast'
import { TEAMS, TeamColor } from '../lib/supabase'
import Button from './ui/Button'
import Input from './ui/Input'

interface FormData {
  full_name: string
  grade: number
  gender: 'male' | 'female'
  preferred_team: TeamColor
  friend_requests: string[]
}

interface FormErrors {
  full_name?: string
  friend_requests?: string
}

export default function OnboardingForm() {
  const { createProfile } = useProfile()
  const { addToast } = useToast()
  const [formData, setFormData] = useState<FormData>({
    full_name: '',
    grade: 7,
    gender: 'male',
    preferred_team: 'red',
    friend_requests: ['', '', '']
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [loading, setLoading] = useState(false)

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    // Validate full name
    if (!formData.full_name.trim()) {
      newErrors.full_name = 'Full name is required'
    } else if (formData.full_name.trim().length < 2) {
      newErrors.full_name = 'Full name must be at least 2 characters'
    } else if (formData.full_name.trim().length > 50) {
      newErrors.full_name = 'Full name must be less than 50 characters'
    }

    // Validate friend requests
    const validFriends = formData.friend_requests.filter(friend => friend.trim() !== '')
    if (validFriends.length > 0) {
      const uniqueFriends = new Set(validFriends.map(f => f.trim().toLowerCase()))
      if (uniqueFriends.size !== validFriends.length) {
        newErrors.friend_requests = 'Friend names must be unique'
      }
      
      for (const friend of validFriends) {
        if (friend.trim().length < 2) {
          newErrors.friend_requests = 'Friend names must be at least 2 characters'
          break
        }
        if (friend.trim().toLowerCase() === formData.full_name.trim().toLowerCase()) {
          newErrors.friend_requests = 'You cannot add yourself as a friend'
          break
        }
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      addToast({
        type: 'error',
        title: 'Validation Error',
        message: 'Please fix the errors in the form'
      })
      return
    }

    setLoading(true)

    try {
      // Filter out empty friend requests
      const filteredFriends = formData.friend_requests.filter(friend => friend.trim() !== '')
      
      const { error } = await createProfile({
        full_name: formData.full_name.trim(),
        grade: formData.grade,
        gender: formData.gender,
        preferred_team: formData.preferred_team,
        current_team: formData.preferred_team, // This will be overridden for admins
        friend_requests: filteredFriends,
        switches_remaining: 3,
        is_admin: false,
        participate_in_teams: true
      })

      if (error) throw error
      
      addToast({
        type: 'success',
        title: 'Welcome to Camp!',
        message: 'Your profile has been created successfully'
      })
      
      // Refresh the page to trigger the app to show the Dashboard
      window.location.reload()
    } catch (error: any) {
      console.error('Error creating profile:', error)
      addToast({
        type: 'error',
        title: 'Error',
        message: error.message || 'Failed to create profile. Please try again.'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleFriendRequestChange = (index: number, value: string) => {
    const newFriendRequests = [...formData.friend_requests]
    newFriendRequests[index] = value
    setFormData({ ...formData, friend_requests: newFriendRequests })
    
    // Clear friend request errors when user starts typing
    if (errors.friend_requests) {
      setErrors({ ...errors, friend_requests: undefined })
    }
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
            <Input
              label="Full Name"
              icon={<User />}
              value={formData.full_name}
              onChange={(e) => {
                setFormData({ ...formData, full_name: e.target.value })
                if (errors.full_name) {
                  setErrors({ ...errors, full_name: undefined })
                }
              }}
              error={errors.full_name}
              placeholder="Enter your full name"
              required
            />

            {/* Grade */}
            <div>
              <label htmlFor="grade" className="block text-sm font-medium text-gray-700 mb-1">
                Grade
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <GraduationCap className="h-5 w-5 text-gray-400" />
                </div>
                <select
                  id="grade"
                  value={formData.grade}
                  onChange={(e) => setFormData({ ...formData, grade: Number(e.target.value) })}
                  className="appearance-none block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Gender
              </label>
              <div className="space-y-2">
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preferred Team
              </label>
              <div className="grid grid-cols-2 gap-2">
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
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
                      className="appearance-none block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                      placeholder={`Friend ${index + 1} name`}
                    />
                  </div>
                ))}
              </div>
              {errors.friend_requests && (
                <p className="mt-1 text-sm text-red-600">{errors.friend_requests}</p>
              )}
            </div>
          </div>

          <Button
            type="submit"
            loading={loading}
            icon={<Save />}
            className="w-full"
          >
            Join Camp
          </Button>
        </form>
      </div>
    </div>
  )
}