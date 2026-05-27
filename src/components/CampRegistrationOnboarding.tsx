import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useCamp } from '../contexts/CampContext'
import { useToast } from './Toast'
import { supabase } from '../lib/supabase'
import Button from './ui/Button'
import { UserCircle, Calendar, Snowflake, Sun, Phone, User } from 'lucide-react'
import { validateName, validateAge, validatePhone, validateGrade, validateGender, sanitizeText, sanitizePhone, validate } from '../lib/inputValidation'

export default function CampRegistrationOnboarding() {
  const { user } = useAuth()
  const { currentCamp, refreshRegistration } = useCamp()
  const { addToast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    full_name: '',
    age: '',
    mobile_number: '',
    parent_name: '',
    parent_number: '',
    grade: '',
    gender: '',
    participate_in_teams: true,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user || !currentCamp) return

    // Validate all fields with shared validators
    const check = validate(
      validateName(formData.full_name),
      validateAge(formData.age),
      validatePhone(formData.mobile_number),
      validateName(formData.parent_name),
      validatePhone(formData.parent_number),
      validateGrade(formData.grade),
      validateGender(formData.gender),
    )
    if (!check.ok) {
      addToast({ type: 'error', title: 'Validation Error', message: check.error! })
      return
    }

    // Sanitize before writing
    const fullName = sanitizeText(formData.full_name)
    const parentName = sanitizeText(formData.parent_name)
    const mobile = sanitizePhone(formData.mobile_number)
    const parentPhone = sanitizePhone(formData.parent_number)

    setLoading(true)

    try {
      const { error } = await supabase
        .from('camp_registrations')
        .insert({
          user_id: user.id,
          camp_id: currentCamp.id,
          full_name: fullName,
          age: parseInt(formData.age),
          mobile_number: mobile,
          parent_name: parentName,
          parent_number: parentPhone,
          grade: parseInt(formData.grade),
          gender: formData.gender,
          preferred_team: null,
          current_team: null, // Assigned via TeamSelection step
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
    ? 'from-orange-500 to-amber-600'
    : 'from-orange-500 to-red-500'

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
                className="w-full px-4 py-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-muted)] text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-orange-400"
                placeholder="Enter your full name"
              />
            </div>

            {/* Age */}
            <div>
              <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
                Age *
              </label>
              <input
                type="number"
                min="10"
                max="25"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-muted)] text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-orange-400"
                placeholder="Enter your age"
              />
            </div>

            {/* Mobile Number */}
            <div>
              <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
                Mobile Number *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-[var(--color-text-muted)]" />
                </div>
                <input
                  type="tel"
                  value={formData.mobile_number}
                  onChange={(e) => setFormData({ ...formData, mobile_number: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-muted)] text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-orange-400"
                  placeholder="Enter your mobile number"
                />
              </div>
            </div>

            {/* Parent Name */}
            <div>
              <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
                Parent/Guardian Name *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-[var(--color-text-muted)]" />
                </div>
                <input
                  type="text"
                  value={formData.parent_name}
                  onChange={(e) => setFormData({ ...formData, parent_name: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-muted)] text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-orange-400"
                  placeholder="Enter parent/guardian name"
                />
              </div>
            </div>

            {/* Parent Number */}
            <div>
              <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
                Parent/Guardian Phone Number *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-[var(--color-text-muted)]" />
                </div>
                <input
                  type="tel"
                  value={formData.parent_number}
                  onChange={(e) => setFormData({ ...formData, parent_number: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-muted)] text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-orange-400"
                  placeholder="Enter parent/guardian phone number"
                />
              </div>
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
                className="w-full px-4 py-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-muted)] text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-orange-400"
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
                      ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300'
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
                      ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300'
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
                  className="w-5 h-5 rounded border-gray-300 text-orange-600 focus:ring-orange-400"
                />
                <span className="text-sm font-medium text-[var(--color-text)]">
                  I want to participate in team activities
                </span>
              </label>
            </div>

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
