import { useState } from 'react'
import { Users, Mail, Lock, UserPlus, LogIn, Clock, ArrowLeft } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useToast } from './Toast'
import Button from './ui/Button'
import Input from './ui/Input'

interface AuthProps {
  initialMode?: 'signup' | 'signin'
  onBack?: () => void
}

interface FormErrors {
  email?: string
  password?: string
}

export default function Auth({ initialMode = 'signin', onBack }: AuthProps) {
  const { signUp, signIn, resetPassword } = useAuth()
  const { addToast } = useToast()
  const [isSignUp, setIsSignUp] = useState(initialMode === 'signup')
  const [isForgotPassword, setIsForgotPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const [rateLimitCooldown, setRateLimitCooldown] = useState(0)
  const [showEmailConfirmation, setShowEmailConfirmation] = useState(false)
  const [showResetEmailSent, setShowResetEmailSent] = useState(false)

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    // Email validation
    if (!email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    // Password validation (skip for forgot password)
    if (!isForgotPassword) {
      if (!password) {
        newErrors.password = 'Password is required'
      } else if (password.length < 6) {
        newErrors.password = 'Password must be at least 6 characters'
      } else if (isSignUp && password.length < 8) {
        newErrors.password = 'Password must be at least 8 characters for signup'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()

    // Only validate email for forgot password
    if (!email.trim()) {
      setErrors({ email: 'Email is required' })
      addToast({
        type: 'error',
        title: 'Validation Error',
        message: 'Please enter your email address'
      })
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrors({ email: 'Please enter a valid email address' })
      addToast({
        type: 'error',
        title: 'Validation Error',
        message: 'Please enter a valid email address'
      })
      return
    }

    setLoading(true)

    try {
      const { error } = await resetPassword(email)
      if (error) {
        throw error
      }

      setShowResetEmailSent(true)
      addToast({
        type: 'success',
        title: 'Reset Email Sent',
        message: 'Check your email for a password reset link.'
      })
    } catch (error: any) {
      console.error('Password reset error:', error)
      addToast({
        type: 'error',
        title: 'Reset Failed',
        message: error.message || 'Failed to send reset email. Please try again.'
      })
    } finally {
      setLoading(false)
    }
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
      if (isSignUp) {
        const { error } = await signUp(email, password)
        if (error) {
          if (error.message.includes('over_email_send_rate_limit')) {
            const match = error.message.match(/after (\d+) seconds/)
            const seconds = match ? parseInt(match[1]) : 60
            startCooldownTimer(seconds)
            addToast({
              type: 'warning',
              title: 'Rate Limited',
              message: `Please wait ${seconds} seconds before trying again due to rate limiting.`
            })
          } else {
            throw error
          }
        } else {
          setShowEmailConfirmation(true)
          addToast({
            type: 'success',
            title: 'Account Created',
            message: 'Please check your email and click the confirmation link.'
          })
        }
      } else {
        const { error } = await signIn(email, password)
        if (error) {
          if (error.message.includes('Email not confirmed')) {
            addToast({
              type: 'info',
              title: 'Email Confirmation Required',
              message: 'Please check your email and click the confirmation link before signing in.'
            })
          } else {
            throw error
          }
        }
      }
    } catch (error: any) {
      console.error('Auth error:', error)
      addToast({
        type: 'error',
        title: 'Authentication Error',
        message: error.message || 'An error occurred during authentication.'
      })
    } finally {
      setLoading(false)
    }
  }

  const startCooldownTimer = (seconds: number) => {
    setRateLimitCooldown(seconds)
    const timer = setInterval(() => {
      setRateLimitCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const clearErrors = (field: keyof FormErrors) => {
    if (errors[field]) {
      setErrors({ ...errors, [field]: undefined })
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)] px-4 sm:px-6 lg:px-8">
      {onBack && (
        <Button
          onClick={onBack}
          variant="ghost"
          className="absolute top-6 left-6"
        >
          ← Back to Home
        </Button>
      )}
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center">
            <Users className="h-16 w-16 text-sky-500" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-[var(--color-text)]">
            {isForgotPassword ? 'Reset Password' : 'Winter Camp Team Selection'}
          </h2>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">
            {isForgotPassword
              ? 'Enter your email to receive a password reset link'
              : isSignUp
                ? 'Create your account to join a team'
                : 'Sign in to manage your team'}
          </p>
        </div>

        <form className="mt-8 space-y-6 bg-[var(--color-card-bg)] p-6 rounded-lg border border-[var(--color-border)]" onSubmit={isForgotPassword ? handleForgotPassword : handleSubmit}>
           <div className="space-y-4">
             <Input
               label="Email address"
                  type="email"
              icon={<Mail />}
                  value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                clearErrors('email')
              }}
              error={errors.email}
              placeholder="Enter your email"
                  required
            />

            {!isForgotPassword && (
              <Input
                label="Password"
                    type="password"
                icon={<Lock />}
                    value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  clearErrors('password')
                }}
                error={errors.password}
                placeholder="Enter your password"
                    required
                  />
            )}
          </div>

          {showEmailConfirmation && !isForgotPassword && (
            <div className="rounded-md bg-[var(--color-bg-muted)] border border-[var(--color-border)] p-4">
              <div className="flex">
                <Mail className="h-5 w-5 text-green-500 mt-0.5 mr-3" />
                <div className="text-sm text-green-700">
                  <p className="font-medium">Check your email!</p>
                  <p className="mt-1">We've sent you a confirmation link. Please click it to activate your account, then return here to sign in.</p>
                </div>
              </div>
            </div>
          )}

          {showResetEmailSent && isForgotPassword && (
            <div className="rounded-md bg-[var(--color-bg-muted)] border border-[var(--color-border)] p-4">
              <div className="flex">
                <Mail className="h-5 w-5 text-green-500 mt-0.5 mr-3" />
                <div className="text-sm text-green-700">
                  <p className="font-medium">Reset email sent!</p>
                  <p className="mt-1">Check your email for a password reset link. Click the link to set a new password.</p>
                </div>
              </div>
            </div>
          )}

          <Button
              type="submit"
            loading={loading || rateLimitCooldown > 0}
            icon={isForgotPassword ? <Mail /> : isSignUp ? <UserPlus /> : <LogIn />}
            className="w-full"
            >
              {loading || rateLimitCooldown > 0 ? (
              rateLimitCooldown > 0 ? (
                    <>
                      <Clock className="h-5 w-5 mr-2" />
                      Wait {rateLimitCooldown}s
                </>
              ) : (
                'Processing...'
              )
            ) : (
              isForgotPassword ? 'Send Reset Link' : isSignUp ? 'Create Account' : 'Sign In'
              )}
          </Button>

          {isForgotPassword ? (
            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setIsForgotPassword(false)
                  setShowResetEmailSent(false)
                  setErrors({})
                }}
                className="text-sm text-sky-600 hover:text-sky-700 font-medium inline-flex items-center"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Sign In
              </button>
            </div>
          ) : (
            <div className="text-center space-y-2">
              {!isSignUp && (
                <div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotPassword(true)
                      setErrors({})
                      setPassword('')
                    }}
                    className="text-sm text-sky-600 hover:text-sky-700 font-medium"
                  >
                    Forgot your password?
                  </button>
                </div>
              )}
              <div>
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(!isSignUp)
                    setErrors({})
                  }}
                  className="text-sm text-sky-600 hover:text-sky-700 font-medium"
                >
                  {isSignUp
                    ? 'Already have an account? Sign in'
                    : "Don't have an account? Sign up"
                  }
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}