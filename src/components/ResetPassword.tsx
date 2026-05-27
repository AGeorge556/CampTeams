import { useState, useEffect } from 'react'
import { Lock, CheckCircle, AlertCircle } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useToast } from './Toast'
import Button from './ui/Button'
import Input from './ui/Input'
import { validatePassword } from '../lib/inputValidation'

const LOGO_PATH = '/logo.png'

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
    const hashParams = new URLSearchParams(window.location.hash.substring(1))
    const accessToken = hashParams.get('access_token')
    const type = hashParams.get('type')
    if (!accessToken || type !== 'recovery') {
      setIsValidToken(false)
    }
  }, [])

  const validatePasswords = (): boolean => {
    const pwResult = validatePassword(newPassword, true)
    if (!pwResult.ok) { setError(pwResult.error); return false }
    if (newPassword !== confirmPassword) { setError('Passwords do not match'); return false }
    setError(undefined)
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validatePasswords()) {
      addToast({ type: 'error', title: 'Validation Error', message: error || 'Please check your password' })
      return
    }
    setLoading(true)
    try {
      const { error: updateError } = await updatePassword(newPassword)
      if (updateError) throw updateError
      setSuccess(true)
      addToast({ type: 'success', title: 'Password Updated', message: 'Your password has been successfully reset!' })
      setTimeout(() => { window.location.href = '/' }, 2000)
    } catch (error: any) {
      console.error('Password update error:', error)
      setError(error.message || 'Failed to update password')
      addToast({ type: 'error', title: 'Update Failed', message: error.message || 'Failed to update password. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  if (!isValidToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--gradient-app-bg)] px-4">
        <div className="max-w-md w-full text-center">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-red-50 dark:bg-red-950/40 rounded-2xl border border-red-200 dark:border-red-800">
              <AlertCircle className="h-14 w-14 text-red-500" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-[var(--color-text)] mb-2">Invalid Reset Link</h1>
          <p className="text-[var(--color-text-muted)] mb-6">
            This password reset link is invalid or has expired. Please request a new one.
          </p>
          <Button onClick={() => window.location.href = '/'} className="bg-[var(--color-primary)] hover:opacity-90 text-white">
            Return to Home
          </Button>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--gradient-app-bg)] px-4">
        <div className="max-w-md w-full text-center">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-green-50 dark:bg-green-950/40 rounded-2xl border border-green-200 dark:border-green-800">
              <CheckCircle className="h-14 w-14 text-green-500" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-[var(--color-text)] mb-2">Password Updated</h1>
          <p className="text-[var(--color-text-muted)]">
            Your password has been successfully reset. Redirecting to home...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--gradient-app-bg)] px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-white rounded-2xl border border-[var(--color-border)] shadow-md">
              <img
                src={LOGO_PATH}
                alt="BCH Youth"
                className="h-14 w-14 object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                  e.currentTarget.parentElement!.innerHTML =
                    '<div class="h-14 w-14 flex items-center justify-center"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#f97316" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-10 h-10"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg></div>'
                }}
              />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-[var(--color-text)]">Set new password</h2>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">Enter your new password below</p>
        </div>

        <form
          className="space-y-5 bg-[var(--color-card-bg)] p-6 sm:p-8 rounded-2xl border border-[var(--color-border)] shadow-md"
          onSubmit={handleSubmit}
        >
          <div className="space-y-4">
            <Input
              label="New Password"
              type="password"
              icon={<Lock />}
              value={newPassword}
              onChange={(e) => { setNewPassword(e.target.value); setError(undefined) }}
              error={error && !confirmPassword ? error : undefined}
              placeholder="Enter new password"
              required
            />
            <Input
              label="Confirm Password"
              type="password"
              icon={<Lock />}
              value={confirmPassword}
              onChange={(e) => { setConfirmPassword(e.target.value); setError(undefined) }}
              error={error && confirmPassword ? error : undefined}
              placeholder="Confirm new password"
              required
            />
          </div>

          {error && (
            <div className="rounded-xl bg-[var(--toast-error-bg)] border border-[var(--toast-error-border)] p-4">
              <p className="text-sm text-[var(--toast-error-text)]">{error}</p>
            </div>
          )}

          <Button
            type="submit"
            loading={loading}
            icon={<Lock />}
            className="w-full bg-[var(--color-primary)] hover:opacity-90 text-white font-semibold"
          >
            {loading ? 'Updating...' : 'Update Password'}
          </Button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => window.location.href = '/'}
              className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors"
            >
              Cancel and return to home
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
