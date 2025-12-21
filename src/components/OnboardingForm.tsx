import React, { useState } from 'react'
import { User, Save } from 'lucide-react'
import { useProfile } from '../hooks/useProfile'
import { useToast } from './Toast'
import Button from './ui/Button'
import Input from './ui/Input'

interface FormData {
  full_name: string
}

interface FormErrors {
  full_name?: string
}

export default function OnboardingForm() {
  const { createProfile } = useProfile()
  const { addToast } = useToast()
  const [formData, setFormData] = useState<FormData>({
    full_name: ''
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
        is_admin: false
      })

      if (error) throw error

      addToast({
        type: 'success',
        title: 'Welcome!',
        message: 'Your profile has been created. Now select a camp to register for!'
      })

      // Refresh the page to trigger the app to show camp selection
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
            <User className="h-16 w-16 text-sky-500" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-[var(--color-text)]">
            Welcome to Camp Registration!
          </h2>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">
            Let's start by creating your profile
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

            <div className="bg-sky-50 dark:bg-sky-950 border border-sky-200 dark:border-sky-800 rounded-lg p-4">
              <p className="text-sm text-sky-800 dark:text-sky-200">
                <strong>Note:</strong> You'll provide additional details (grade, gender, team preference) when you register for a specific camp.
              </p>
            </div>
          </div>

          <Button
            type="submit"
            loading={loading}
            icon={<Save />}
            className="w-full"
          >
            {loading ? 'Creating Profile...' : 'Continue to Camp Selection'}
          </Button>
        </form>
      </div>
    </div>
  )
}