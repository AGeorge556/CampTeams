import { useState, useEffect } from 'react'
import { Lock, CheckCircle, AlertCircle } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useToast } from './Toast'
import Button from './ui/Button'
import Input from './ui/Input'

export default function ResetPassword() {
  const { updatePassword } = useAuth()
  const { addToast } = useToast()
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string>()
  const [isValidToken, setIsValidToken] = useState(true)

  useEffect(() => {
    // Check if we have a valid recovery token in the URL
    const hashParams = new URLSearchParams(window.location.hash.substring(1))
    const accessToken = hashParams.get('access_token')
    const type = hashParams.get('type')

    if (!accessToken || type !== 'recovery') {
      setIsValidToken(false)
    }
  }, [])

  const validatePasswords = (): boolean => {
    if (!newPassword) {
      setError('Password is required')
      return false
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters')
      return false
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return false
    }

    setError(undefined)
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validatePasswords()) {
      addToast({
        type: 'error',
        title: 'Validation Error',
        message: error || 'Please check your password'
      })
      return
    }

    setLoading(true)

    try {
      const { error: updateError } = await updatePassword(newPassword)

      if (updateError) {
        throw updateError
      }

      setSuccess(true)
      addToast({
        type: 'success',
        title: 'Password Updated',
        message: 'Your password has been successfully reset!'
      })

      // Redirect to home after 2 seconds
      setTimeout(() => {
        window.location.href = '/'
      }, 2000)
    } catch (error: any) {
      console.error('Password update error:', error)
      setError(error.message || 'Failed to update password')
      addToast({
        type: 'error',
        title: 'Update Failed',
        message: error.message || 'Failed to update password. Please try again.'
      })
    } finally {
      setLoading(false)
    }
  }

  if (!isValidToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)] px-4">
        <div className="max-w-md w-full text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-[var(--color-text)] mb-2">Invalid Reset Link</h1>
          <p className="text-[var(--color-text-muted)] mb-6">
            This password reset link is invalid or has expired. Please request a new one.
          </p>
          <Button onClick={() => window.location.href = '/'}>
            Return to Home
          </Button>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)] px-4">
        <div className="max-w-md w-full text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-[var(--color-text)] mb-2">Password Updated!</h1>
          <p className="text-[var(--color-text-muted)] mb-6">
            Your password has been successfully reset. Redirecting to home...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)] px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Lock className="h-16 w-16 text-sky-500 mx-auto" />
          <h2 className="mt-6 text-3xl font-extrabold text-[var(--color-text)]">
            Set New Password
          </h2>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">
            Enter your new password below
          </p>
        </div>

        <form
          className="mt-8 space-y-6 bg-[var(--color-card-bg)] p-6 rounded-lg border border-[var(--color-border)]"
          onSubmit={handleSubmit}
        >
          <div className="space-y-4">
            <Input
              label="New Password"
              type="password"
              icon={<Lock />}
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value)
                setError(undefined)
              }}
              error={error && !confirmPassword ? error : undefined}
              placeholder="Enter new password"
              required
            />

            <Input
              label="Confirm Password"
              type="password"
              icon={<Lock />}
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value)
                setError(undefined)
              }}
              error={error && confirmPassword ? error : undefined}
              placeholder="Confirm new password"
              required
            />
          </div>

          {error && (
            <div className="rounded-md bg-red-50 border border-red-200 p-4">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <Button
            type="submit"
            loading={loading}
            icon={<Lock />}
            className="w-full"
          >
            {loading ? 'Updating Password...' : 'Update Password'}
          </Button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => window.location.href = '/'}
              className="text-sm text-sky-600 hover:text-sky-700 font-medium"
            >
              Cancel and return to home
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
