import { useState, useEffect } from 'react'
import { Lock, CheckCircle, AlertCircle } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useToast } from './Toast'
import Button from './ui/Button'
import Input from './ui/Input'

// Logo path - Replace with your church logo
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 px-4 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-red-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-pink-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>

        <div className="max-w-md w-full text-center relative z-10">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-gradient-to-br from-red-500/20 to-pink-500/20 backdrop-blur-sm rounded-xl border-2 border-red-400/50 shadow-neon-red">
              <AlertCircle className="h-16 w-16 text-red-400" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2 neon-text-red">❌ Invalid Reset Link</h1>
          <p className="text-gray-300 mb-6">
            This password reset link is invalid or has expired. Please request a new one 🔑
          </p>
          <Button
            onClick={() => window.location.href = '/'}
            className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-400 hover:to-pink-400 border-2 border-red-400/50 shadow-neon-red font-bold"
          >
            Return to Home 🏠
          </Button>
        </div>

        {/* CSS for neon effects */}
        <style>{`
          .neon-text-red {
            text-shadow:
              0 0 5px rgba(239, 68, 68, 0.8),
              0 0 10px rgba(239, 68, 68, 0.6),
              0 0 20px rgba(239, 68, 68, 0.4),
              0 0 40px rgba(239, 68, 68, 0.2);
          }

          .shadow-neon-red {
            box-shadow:
              0 0 10px rgba(239, 68, 68, 0.6),
              0 0 20px rgba(239, 68, 68, 0.4),
              0 0 30px rgba(239, 68, 68, 0.2);
          }
        `}</style>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-green-900/20 to-gray-900 px-4 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-green-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>

        <div className="max-w-md w-full text-center relative z-10">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-gradient-to-br from-green-500/20 to-cyan-500/20 backdrop-blur-sm rounded-xl border-2 border-green-400/50 shadow-neon-green animate-pulse">
              <CheckCircle className="h-16 w-16 text-green-400" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2 neon-text-green">✅ Password Updated!</h1>
          <p className="text-gray-300 mb-6">
            Your password has been successfully reset. Redirecting to home... 🎉
          </p>
        </div>

        {/* CSS for neon effects */}
        <style>{`
          .neon-text-green {
            text-shadow:
              0 0 5px rgba(34, 197, 94, 0.8),
              0 0 10px rgba(34, 197, 94, 0.6),
              0 0 20px rgba(34, 197, 94, 0.4),
              0 0 40px rgba(34, 197, 94, 0.2);
          }

          .shadow-neon-green {
            box-shadow:
              0 0 10px rgba(34, 197, 94, 0.6),
              0 0 20px rgba(34, 197, 94, 0.4),
              0 0 30px rgba(34, 197, 94, 0.2);
          }
        `}</style>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 px-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-pink-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 right-1/3 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="max-w-md w-full space-y-8 relative z-10">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 backdrop-blur-sm rounded-xl border-2 border-cyan-400/50 shadow-neon-cyan">
              <img
                src={LOGO_PATH}
                alt="Church Logo"
                className="h-16 w-16 object-contain"
                onError={(e) => {
                  // Fallback if logo doesn't exist yet
                  e.currentTarget.style.display = 'none'
                  e.currentTarget.parentElement!.innerHTML = '<div class="h-16 w-16 flex items-center justify-center text-4xl">⛪</div>'
                }}
              />
            </div>
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-white neon-text-cyan">
            🔑 Set New Password
          </h2>
          <p className="mt-2 text-sm text-gray-300">
            Enter your new password below 🔒
          </p>
        </div>

        <form
          className="mt-8 space-y-6 bg-gray-900/50 backdrop-blur-md p-6 rounded-xl border-2 border-cyan-400/30 shadow-neon-multi"
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
            <div className="rounded-md bg-red-500/10 border-2 border-red-400/50 p-4 shadow-lg">
              <p className="text-sm text-red-200">❌ {error}</p>
            </div>
          )}

          <Button
            type="submit"
            loading={loading}
            icon={<Lock />}
            className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 border-2 border-cyan-400/50 shadow-neon-cyan font-bold"
          >
            {loading ? 'Updating Password... ⚡' : 'Update Password 🔐'}
          </Button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => window.location.href = '/'}
              className="text-sm text-cyan-400 hover:text-cyan-300 font-medium neon-text-cyan"
            >
              Cancel and return to home 🏠
            </button>
          </div>
        </form>
      </div>

      {/* CSS for neon effects */}
      <style>{`
        /* Neon text effects */
        .neon-text-cyan {
          text-shadow:
            0 0 5px rgba(6, 182, 212, 0.8),
            0 0 10px rgba(6, 182, 212, 0.6),
            0 0 20px rgba(6, 182, 212, 0.4),
            0 0 40px rgba(6, 182, 212, 0.2);
        }

        /* Neon box shadows */
        .shadow-neon-cyan {
          box-shadow:
            0 0 10px rgba(6, 182, 212, 0.6),
            0 0 20px rgba(6, 182, 212, 0.4),
            0 0 30px rgba(6, 182, 212, 0.2);
        }

        .shadow-neon-multi {
          box-shadow:
            0 0 10px rgba(6, 182, 212, 0.6),
            0 0 20px rgba(236, 72, 153, 0.4),
            0 0 30px rgba(168, 85, 247, 0.2);
        }
      `}</style>
    </div>
  )
}
