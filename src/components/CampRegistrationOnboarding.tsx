import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useCamp } from '../contexts/CampContext'
import { useToast } from './Toast'
import { supabase } from '../lib/supabase'
import Button from './ui/Button'
import { UserCircle, Calendar, Snowflake, Sun, Users } from 'lucide-react'

export default function CampRegistrationOnboarding() {
  const { user } = useAuth()
  const { currentCamp, refreshRegistration } = useCamp()
  const { addToast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    full_name: '',
    grade: '',
    gender: '',
    preferred_team: '',
    participate_in_teams: true,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user || !currentCamp) return

    // Validation
    if (!formData.full_name.trim()) {
      addToast({
        type: 'error',
        title: 'Validation Error',
        message: 'Please enter your full name'
      })
      return
    }

    if (!formData.grade || parseInt(formData.grade) < 1 || parseInt(formData.grade) > 12) {
      addToast({
        type: 'error',
        title: 'Validation Error',
        message: 'Please enter a valid grade (1-12)'
      })
      return
    }

    if (!formData.gender) {
      addToast({
        type: 'error',
        title: 'Validation Error',
        message: 'Please select your gender'
      })
      return
    }

    if (formData.participate_in_teams && !formData.preferred_team) {
      addToast({
        type: 'error',
        title: 'Validation Error',
        message: 'Please select your preferred team'
      })
      return
    }

    setLoading(true)

    try {
      const { error } = await supabase
        .from('camp_registrations')
        .insert({
          user_id: user.id,
          camp_id: currentCamp.id,
          full_name: formData.full_name.trim(),
          grade: parseInt(formData.grade),
          gender: formData.gender,
          preferred_team: formData.participate_in_teams ? formData.preferred_team : null,
          current_team: null, // Will be assigned by admin
          participate_in_teams: formData.participate_in_teams,
          role: 'camper',
          switches_remaining: 3,
        })

      if (error) throw error

      addToast({
        type: 'success',
        title: 'Registration Successful!',
        message: `You've successfully registered for ${currentCamp.name}`
      })

      // Refresh the registration to load the new data
      await refreshRegistration()
    } catch (error: any) {
      console.error('Error registering for camp:', error)
      addToast({
        type: 'error',
        title: 'Registration Failed',
        message: error.message || 'Failed to register for camp. Please try again.'
      })
    } finally {
      setLoading(false)
    }
  }

  if (!currentCamp) return null

  const CampIcon = currentCamp.season === 'winter' ? Snowflake : Sun
  const campColor = currentCamp.season === 'winter'
    ? 'from-sky-500 to-blue-600'
    : 'from-orange-500 to-red-600'

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  }

  return (
    <div className="min-h-screen bg-[var(--gradient-app-bg)] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className={`inline-flex p-4 rounded-full bg-gradient-to-br ${campColor} text-white mb-4`}>
            <CampIcon className="w-12 h-12" />
          </div>
          <h1 className="text-4xl font-bold text-[var(--color-text)] mb-2">
            Register for {currentCamp.name}
          </h1>
          <div className="flex items-center justify-center space-x-2 text-[var(--color-text-muted)]">
            <Calendar className="w-4 h-4" />
            <span>{formatDate(currentCamp.start_date)} - {formatDate(currentCamp.end_date)}</span>
          </div>
        </div>

        {/* Registration Form */}
        <div className="bg-[var(--color-card-bg)] rounded-xl shadow-lg border border-[var(--color-border)] p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
                Full Name *
              </label>
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-muted)] text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-sky-500"
                placeholder="Enter your full name"
              />
            </div>

            {/* Grade */}
            <div>
              <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
                Grade *
              </label>
              <input
                type="number"
                min="1"
                max="12"
                value={formData.grade}
                onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-muted)] text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-sky-500"
                placeholder="Enter your grade (1-12)"
              />
            </div>

            {/* Gender */}
            <div>
              <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
                Gender *
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, gender: 'male' })}
                  className={`py-3 px-4 rounded-lg border-2 transition-all ${
                    formData.gender === 'male'
                      ? 'border-sky-500 bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300'
                      : 'border-[var(--color-border)] bg-[var(--color-bg-muted)] text-[var(--color-text)]'
                  }`}
                >
                  Male
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, gender: 'female' })}
                  className={`py-3 px-4 rounded-lg border-2 transition-all ${
                    formData.gender === 'female'
                      ? 'border-sky-500 bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300'
                      : 'border-[var(--color-border)] bg-[var(--color-bg-muted)] text-[var(--color-text)]'
                  }`}
                >
                  Female
                </button>
              </div>
            </div>

            {/* Participate in Teams */}
            <div>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.participate_in_teams}
                  onChange={(e) => setFormData({ ...formData, participate_in_teams: e.target.checked })}
                  className="w-5 h-5 rounded border-gray-300 text-sky-600 focus:ring-sky-500"
                />
                <span className="text-sm font-medium text-[var(--color-text)]">
                  I want to participate in team activities
                </span>
              </label>
            </div>

            {/* Preferred Team (only if participating) */}
            {formData.participate_in_teams && (
              <div>
                <label className="block text-sm font-medium text-[var(--color-text)] mb-3">
                  Preferred Team *
                </label>
                <div className="grid grid-cols-2 gap-4">
                  {['red', 'blue', 'green', 'yellow'].map((team) => (
                    <button
                      key={team}
                      type="button"
                      onClick={() => setFormData({ ...formData, preferred_team: team })}
                      className={`py-4 px-4 rounded-lg border-2 transition-all capitalize font-medium ${
                        formData.preferred_team === team
                          ? `border-${team}-500 bg-${team}-50 dark:bg-${team}-950 text-${team}-700 dark:text-${team}-300`
                          : 'border-[var(--color-border)] bg-[var(--color-bg-muted)] text-[var(--color-text)]'
                      }`}
                    >
                      <Users className="w-5 h-5 mx-auto mb-1" />
                      Team {team}
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-xs text-[var(--color-text-muted)]">
                  Note: Your preferred team is a suggestion. Final team assignment will be made by camp administrators for balanced teams.
                </p>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading}
              className={`w-full bg-gradient-to-r ${campColor} hover:opacity-90`}
              icon={<UserCircle />}
            >
              {loading ? 'Registering...' : 'Complete Registration'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
