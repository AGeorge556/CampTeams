import { useState, useEffect } from 'react'
import { Lock, Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useToast } from './Toast'
import Button from './ui/Button'
import Input from './ui/Input'

interface PasswordResetProps {
  onComplete?: () => void
}

interface FormErrors {
  password?: string
  confirmPassword?: string
}

export default function PasswordReset({ onComplete }: PasswordResetProps) {
  const { updatePassword } = useAuth()
  const { addToast } = useToast()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const [success, setSuccess] = useState(false)

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    // Password validation
    if (!password) {
      newErrors.password = 'Password is required'
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters'
    } else if (!/(?=.*[a-z])/.test(password)) {
      newErrors.password = 'Password must contain at least one lowercase letter'
    } else if (!/(?=.*[A-Z])/.test(password)) {
      newErrors.password = 'Password must contain at least one uppercase letter'
    } else if (!/(?=.*\d)/.test(password)) {
      newErrors.password = 'Password must contain at least one number'
    }

    // Confirm password validation
    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password'
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
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
      const { error } = await updatePassword(password)
      if (error) {
        throw error
      }

      setSuccess(true)
      addToast({
        type: 'success',
        title: 'Password Updated',
        message: 'Your password has been successfully updated. You can now sign in with your new password.'
      })

      // Call onComplete callback if provided
      if (onComplete) {
        setTimeout(() => {
          onComplete()
        }, 2000)
      }
    } catch (error: any) {
      console.error('Password reset error:', error)
      addToast({
        type: 'error',
        title: 'Password Update Failed',
        message: error.message || 'An error occurred while updating your password.'
      })
    } finally {
      setLoading(false)
    }
  }

  const clearErrors = (field: keyof FormErrors) => {
    if (errors[field]) {
      setErrors({ ...errors, [field]: undefined })
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)] px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full text-center">
          <div className="mb-6">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
          </div>
          <h1 className="text-2xl font-bold text-[var(--color-text)] mb-4">Password Updated Successfully!</h1>
          <p className="text-[var(--color-text-muted)] mb-6">
            Your password has been updated. You can now sign in with your new password.
          </p>
          <Button
            onClick={() => window.location.href = '/'}
            className="w-full"
          >
            Go to Sign In
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)] px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center">
            <Lock className="h-16 w-16 text-orange-500" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-[var(--color-text)]">
            Reset Your Password
          </h2>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">
            Enter your new password below
          </p>
        </div>
         
        <form className="mt-8 space-y-6 bg-[var(--color-card-bg)] p-6 rounded-lg border border-[var(--color-border)]" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="relative">
              <Input
                label="New Password"
                type={showPassword ? 'text' : 'password'}
                icon={<Lock />}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  clearErrors('password')
                }}
                error={errors.password}
                placeholder="Enter your new password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            <div className="relative">
              <Input
                label="Confirm New Password"
                type={showConfirmPassword ? 'text' : 'password'}
                icon={<Lock />}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value)
                  clearErrors('confirmPassword')
                }}
                error={errors.confirmPassword}
                placeholder="Confirm your new password"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="rounded-md bg-blue-50 border border-blue-200 p-4">
            <div className="flex">
              <Lock className="h-5 w-5 text-blue-500 mt-0.5 mr-3" />
              <div className="text-sm text-blue-700">
                <p className="font-medium">Password Requirements:</p>
                <ul className="mt-1 list-disc list-inside space-y-1">
                  <li>At least 8 characters long</li>
                  <li>Contains at least one lowercase letter</li>
                  <li>Contains at least one uppercase letter</li>
                  <li>Contains at least one number</li>
                </ul>
              </div>
            </div>
          </div>

          <Button
            type="submit"
            loading={loading}
            className="w-full"
          >
            Update Password
          </Button>
        </form>
      </div>
    </div>
  )
}
