import { useState } from 'react'
import { Mail, Lock, UserPlus, LogIn, Clock, ArrowLeft, Sun } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useToast } from './Toast'
import Button from './ui/Button'
import Input from './ui/Input'

const LOGO_PATH = '/logo.png'

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

    if (!email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email address'
    }

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

    if (!email.trim()) {
      setErrors({ email: 'Email is required' })
      addToast({ type: 'error', title: 'Validation Error', message: 'Please enter your email address' })
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrors({ email: 'Please enter a valid email address' })
      addToast({ type: 'error', title: 'Validation Error', message: 'Please enter a valid email address' })
      return
    }

    setLoading(true)

    try {
      const { error } = await resetPassword(email)
      if (error) throw error
      setShowResetEmailSent(true)
      addToast({ type: 'success', title: 'Reset Email Sent', message: 'Check your email for a password reset link.' })
    } catch (error: any) {
      console.error('Password reset error:', error)
      addToast({ type: 'error', title: 'Reset Failed', message: error.message || 'Failed to send reset email. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      addToast({ type: 'error', title: 'Validation Error', message: 'Please fix the errors in the form' })
      return
    }

    setLoading(true)

    try {
      if (isSignUp) {
        const { data, error } = await signUp(email, password)
        if (error) {
          if (error.message.includes('over_email_send_rate_limit') || error.message.includes('rate_limit')) {
            const match = error.message.match(/after (\d+) seconds/)
            const seconds = match ? parseInt(match[1]) : 60
            startCooldownTimer(seconds)
            addToast({ type: 'warning', title: 'Rate Limited', message: `Please wait ${seconds} seconds before trying again.` })
          } else {
            throw error
          }
        } else if (data?.session) {
          // Email confirmation disabled — user is signed in immediately
          addToast({ type: 'success', title: 'Account Created', message: 'Welcome to BCH Youth Summer Camp!' })
        } else {
          setShowEmailConfirmation(true)
          addToast({ type: 'success', title: 'Account Created', message: 'Please check your email and click the confirmation link.' })
        }
      } else {
        const { error } = await signIn(email, password)
        if (error) {
          if (error.message.includes('Email not confirmed')) {
            addToast({ type: 'info', title: 'Email Confirmation Required', message: 'Please check your email and click the confirmation link before signing in.' })
          } else {
            throw error
          }
        }
      }
    } catch (error: any) {
      console.error('Auth error:', error)
      addToast({ type: 'error', title: 'Authentication Error', message: error.message || 'An error occurred during authentication.' })
    } finally {
      setLoading(false)
    }
  }

  const startCooldownTimer = (seconds: number) => {
    setRateLimitCooldown(seconds)
    const timer = setInterval(() => {
      setRateLimitCooldown((prev) => {
        if (prev <= 1) { clearInterval(timer); return 0 }
        return prev - 1
      })
    }, 1000)
  }

  const clearErrors = (field: keyof FormErrors) => {
    if (errors[field]) setErrors({ ...errors, [field]: undefined })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--gradient-app-bg)] px-4 sm:px-6 lg:px-8">
      {onBack && (
        <button
          onClick={onBack}
          className="absolute top-6 left-6 inline-flex items-center text-sm font-medium text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Home
        </button>
      )}

      <div className="max-w-md w-full space-y-8">
        {/* Logo + Title */}
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-white rounded-2xl border border-[var(--color-border)] shadow-md">
              <img
                src={LOGO_PATH}
                alt="BCH Youth"
                className="h-20 w-20 object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                  e.currentTarget.parentElement!.innerHTML =
                    '<div class="h-14 w-14 flex items-center justify-center"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#f97316" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-10 h-10"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg></div>'
                }}
              />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-[var(--color-text)]">
            {isForgotPassword ? 'Reset your password' : isSignUp ? 'Join Summer Camp 2026' : 'Welcome back'}
          </h2>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            {isForgotPassword
              ? 'Enter your email to receive a reset link'
              : isSignUp
                ? 'Create an account to register for camp'
                : 'Sign in to your account'}
          </p>
          {!isForgotPassword && !isSignUp && (
            <div className="mt-2 inline-flex items-center space-x-1 text-xs font-semibold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/40 px-3 py-1 rounded-full border border-orange-200 dark:border-orange-800">
              <Sun className="h-3 w-3" />
              <span>August 20–23, 2026</span>
            </div>
          )}
        </div>

        {/* Form */}
        <form
          className="space-y-5 bg-[var(--color-card-bg)] p-6 sm:p-8 rounded-2xl border border-[var(--color-border)] shadow-md"
          onSubmit={isForgotPassword ? handleForgotPassword : handleSubmit}
        >
          <div className="space-y-4">
            <Input
              label="Email address"
              type="email"
              icon={<Mail />}
              value={email}
              onChange={(e) => { setEmail(e.target.value); clearErrors('email') }}
              error={errors.email}
              placeholder="you@example.com"
              required
            />

            {!isForgotPassword && (
              <Input
                label="Password"
                type="password"
                icon={<Lock />}
                value={password}
                onChange={(e) => { setPassword(e.target.value); clearErrors('password') }}
                error={errors.password}
                placeholder="Enter your password"
                required
              />
            )}
          </div>

          {showEmailConfirmation && !isForgotPassword && (
            <div className="rounded-xl bg-[var(--toast-success-bg)] border border-[var(--toast-success-border)] p-4">
              <div className="flex">
                <Mail className="h-5 w-5 text-[var(--toast-success-text)] mt-0.5 mr-3 shrink-0" />
                <div className="text-sm text-[var(--toast-success-text)]">
                  <p className="font-semibold">Check your email</p>
                  <p className="mt-1 opacity-90">We sent you a confirmation link. Click it to activate your account, then return here to sign in.</p>
                </div>
              </div>
            </div>
          )}

          {showResetEmailSent && isForgotPassword && (
            <div className="rounded-xl bg-[var(--toast-success-bg)] border border-[var(--toast-success-border)] p-4">
              <div className="flex">
                <Mail className="h-5 w-5 text-[var(--toast-success-text)] mt-0.5 mr-3 shrink-0" />
                <div className="text-sm text-[var(--toast-success-text)]">
                  <p className="font-semibold">Reset email sent</p>
                  <p className="mt-1 opacity-90">Check your inbox for a password reset link.</p>
                </div>
              </div>
            </div>
          )}

          <Button
            type="submit"
            loading={loading || rateLimitCooldown > 0}
            icon={isForgotPassword ? <Mail /> : isSignUp ? <UserPlus /> : <LogIn />}
            className="w-full bg-[var(--color-primary)] hover:opacity-90 text-white font-semibold"
          >
            {loading || rateLimitCooldown > 0
              ? rateLimitCooldown > 0
                ? <span className="flex items-center"><Clock className="h-4 w-4 mr-2" />Wait {rateLimitCooldown}s</span>
                : 'Processing...'
              : isForgotPassword ? 'Send Reset Link' : isSignUp ? 'Create Account' : 'Sign In'}
          </Button>

          {isForgotPassword ? (
            <div className="text-center">
              <button
                type="button"
                onClick={() => { setIsForgotPassword(false); setShowResetEmailSent(false); setErrors({}) }}
                className="text-sm text-[var(--color-primary)] hover:opacity-80 font-medium inline-flex items-center transition-opacity"
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
                    onClick={() => { setIsForgotPassword(true); setErrors({}); setPassword('') }}
                    className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors"
                  >
                    Forgot your password?
                  </button>
                </div>
              )}
              <div>
                <button
                  type="button"
                  onClick={() => { setIsSignUp(!isSignUp); setErrors({}) }}
                  className="text-sm font-medium text-[var(--color-primary)] hover:opacity-80 transition-opacity"
                >
                  {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}
