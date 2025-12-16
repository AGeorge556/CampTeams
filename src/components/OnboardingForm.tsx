import React, { useState } from 'react'
import { User, GraduationCap, Users, Save } from 'lucide-react'
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
}

interface FormErrors {
  full_name?: string
}

export default function OnboardingForm() {
  const { createProfile } = useProfile()
  const { addToast } = useToast()
  const [formData, setFormData] = useState<FormData>({
    full_name: '',
    grade: 7,
    gender: 'male',
    preferred_team: 'red'
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
      const { error } = await createProfile({
        full_name: formData.full_name.trim(),
        grade: formData.grade,
        gender: formData.gender,
        preferred_team: formData.preferred_team,
        current_team: formData.preferred_team, // This will be overridden for admins
        switches_remaining: 3,
        is_admin: false,
        participate_in_teams: true,
        role: 'camper'
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



  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--gradient-app-bg)] px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center">
            <Users className="h-16 w-16 text-sky-500" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-[var(--color-text)]">
            Welcome to Camp Teams!
          </h2>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">
            Please provide some information to complete your profile
          </p>
        </div>
        
        <form className="mt-8 space-y-6 bg-[var(--color-card-bg)] p-6 rounded-lg border border-[var(--color-border)]" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <Input
              label="Full Name"
              type="text"
              icon={<User />}
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              error={errors.full_name}
              placeholder="Enter your full name"
              required
            />

            <div>
              <label htmlFor="grade" className="block text-sm font-medium text-[var(--color-text)] mb-1">
                Grade Level
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <GraduationCap className="h-5 w-5 text-[var(--color-text-muted)]" />
                </div>
                <select
                  id="grade"
                  value={formData.grade}
                  onChange={(e) => setFormData({ ...formData, grade: Number(e.target.value) })}
                  className="appearance-none block w-full pl-10 pr-3 py-2 border border-[var(--color-border)] rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 focus:border-sky-500 sm:text-sm bg-[var(--color-input-bg)] text-[var(--color-text)]"
                  required
                >
                  <option value={7}>Grade 7</option>
                  <option value={8}>Grade 8</option>
                  <option value={9}>Grade 9</option>
                  <option value={10}>Grade 10</option>
                  <option value={11}>Grade 11</option>
                  <option value={12}>Grade 12</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
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
                      className="focus:ring-sky-500 h-4 w-4 text-sky-600 border-[var(--color-border)]"
                    />
                    <span className="ml-2 text-sm text-[var(--color-text)]">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
                Preferred Team
              </label>
              <div className="space-y-2">
                {Object.entries(TEAMS).map(([key, team]) => (
                  <label key={key} className="flex items-center">
                    <input
                      type="radio"
                      name="preferred_team"
                      value={key}
                      checked={formData.preferred_team === key}
                      onChange={(e) => setFormData({ ...formData, preferred_team: e.target.value as TeamColor })}
                      className="focus:ring-sky-500 h-4 w-4 text-sky-600 border-[var(--color-border)]"
                    />
                    <span className={`ml-2 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${team.lightColor} ${team.textColor}`}>
                      {team.name} Team
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <Button
            type="submit"
            loading={loading}
            icon={<Save />}
            className="w-full"
          >
            {loading ? 'Creating Profile...' : 'Complete Profile'}
          </Button>
        </form>
      </div>
    </div>
  )
}