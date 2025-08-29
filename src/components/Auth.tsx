import { useState } from 'react'
import { Users, Mail, Lock, UserPlus, LogIn, Clock, ArrowLeft, Key } from 'lucide-react'
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

type AuthMode = 'signin' | 'signup' | 'forgot-password'

export default function Auth({ initialMode = 'signin', onBack }: AuthProps) {
  const { signUp, signIn, resetPassword } = useAuth()
  const { addToast } = useToast()
  const [mode, setMode] = useState<AuthMode>(initialMode === 'signup' ? 'signup' : 'signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const [rateLimitCooldown, setRateLimitCooldown] = useState(0)
  const [showEmailConfirmation, setShowEmailConfirmation] = useState(false)
  const [showPasswordResetSent, setShowPasswordResetSent] = useState(false)

  const isSignUp = mode === 'signup'
  const isSignIn = mode === 'signin'
  const isForgotPassword = mode === 'forgot-password'

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    // Email validation
    if (!email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    // Password validation (only for signup and signin)
    if ((isSignUp || isSignIn) && !password) {
      newErrors.password = 'Password is required'
    } else if (isSignUp && password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters for signup'
    } else if (isSignIn && password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
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
      if (isForgotPassword) {
        const { error } = await resetPassword(email)
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
          setShowPasswordResetSent(true)
          addToast({
            type: 'success',
            title: 'Password Reset Email Sent',
            message: 'Please check your email and click the reset link.'
          })
        }
      } else if (isSignUp) {
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

  const resetForm = () => {
    setEmail('')
    setPassword('')
    setErrors({})
    setShowEmailConfirmation(false)
    setShowPasswordResetSent(false)
  }

  const handleModeChange = (newMode: AuthMode) => {
    setMode(newMode)
    resetForm()
  }

  const getTitle = () => {
    switch (mode) {
      case 'signup':
        return 'Create Account'
      case 'signin':
        return 'Sign In'
      case 'forgot-password':
        return 'Reset Password'
    }
  }

  const getDescription = () => {
    switch (mode) {
      case 'signup':
        return 'Create your account to join a team'
      case 'signin':
        return 'Sign in to manage your team'
      case 'forgot-password':
        return 'Enter your email to receive a password reset link'
    }
  }

  const getSubmitButtonText = () => {
    if (loading || rateLimitCooldown > 0) {
      return rateLimitCooldown > 0 ? `Wait ${rateLimitCooldown}s` : 'Processing...'
    }
    
    switch (mode) {
      case 'signup':
        return 'Create Account'
      case 'signin':
        return 'Sign In'
      case 'forgot-password':
        return 'Send Reset Link'
    }
  }

  const getSubmitIcon = () => {
    switch (mode) {
      case 'signup':
        return <UserPlus />
      case 'signin':
        return <LogIn />
      case 'forgot-password':
        return <Key />
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
            <Users className="h-16 w-16 text-orange-500" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-[var(--color-text)]">
            Summer Camp Team Selection
          </h2>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">
            {getDescription()}
          </p>
        </div>
         
        <form className="mt-8 space-y-6 bg-[var(--color-card-bg)] p-6 rounded-lg border border-[var(--color-border)]" onSubmit={handleSubmit}>
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

            {(isSignUp || isSignIn) && (
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

          {showEmailConfirmation && (
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

          {showPasswordResetSent && (
            <div className="rounded-md bg-[var(--color-bg-muted)] border border-[var(--color-border)] p-4">
              <div className="flex">
                <Mail className="h-5 w-5 text-green-500 mt-0.5 mr-3" />
                <div className="text-sm text-green-700">
                  <p className="font-medium">Check your email!</p>
                  <p className="mt-1">We've sent you a password reset link. Please click it to reset your password, then return here to sign in.</p>
                </div>
              </div>
            </div>
          )}

          <Button
            type="submit"
            loading={loading || rateLimitCooldown > 0}
            icon={getSubmitIcon()}
            className="w-full"
          >
            {getSubmitButtonText()}
          </Button>

          <div className="text-center space-y-2">
            {isSignIn && (
              <button
                type="button"
                onClick={() => handleModeChange('forgot-password')}
                className="text-sm text-orange-600 hover:text-orange-700 font-medium block"
              >
                Forgot your password?
              </button>
            )}

            {isForgotPassword && (
              <button
                type="button"
                onClick={() => handleModeChange('signin')}
                className="text-sm text-orange-600 hover:text-orange-700 font-medium block"
              >
                ← Back to Sign In
              </button>
            )}

            {!isForgotPassword && (
              <button
                type="button"
                onClick={() => handleModeChange(isSignUp ? 'signin' : 'signup')}
                className="text-sm text-orange-600 hover:text-orange-700 font-medium block"
              >
                {isSignUp
                  ? 'Already have an account? Sign in'
                  : "Don't have an account? Sign up"
                }
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}