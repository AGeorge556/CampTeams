import { useState } from 'react'
import { Mail, Lock, UserPlus, LogIn, Clock, ArrowLeft } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useToast } from './Toast'
import Button from './ui/Button'
import Input from './ui/Input'

// Logo path - Replace with your church logo
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-pink-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 right-1/3 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      {onBack && (
        <Button
          onClick={onBack}
          variant="ghost"
          className="absolute top-6 left-6 text-white border-cyan-400/50 hover:border-cyan-400 hover:shadow-neon-cyan z-10"
        >
          ← Back to Home
        </Button>
      )}
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
            {isForgotPassword ? '🔑 Reset Password' : isSignUp ? '⛺ Join Camp Registration' : '✨ Welcome Back'}
          </h2>
          <p className="mt-2 text-sm text-gray-300">
            {isForgotPassword
              ? 'Enter your email to receive a password reset link 📧'
              : isSignUp
                ? 'Create your account to register for camp 🏕️'
                : 'Sign in to your account 🙏'}
          </p>
        </div>

        <form className="mt-8 space-y-6 bg-gray-900/50 backdrop-blur-md p-6 rounded-xl border-2 border-cyan-400/30 shadow-neon-multi" onSubmit={isForgotPassword ? handleForgotPassword : handleSubmit}>
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
            <div className="rounded-md bg-green-500/10 border-2 border-green-400/50 p-4 shadow-lg">
              <div className="flex">
                <Mail className="h-5 w-5 text-green-400 mt-0.5 mr-3" />
                <div className="text-sm text-green-200">
                  <p className="font-medium">Check your email! 📧✨</p>
                  <p className="mt-1">We've sent you a confirmation link. Please click it to activate your account, then return here to sign in.</p>
                </div>
              </div>
            </div>
          )}

          {showResetEmailSent && isForgotPassword && (
            <div className="rounded-md bg-green-500/10 border-2 border-green-400/50 p-4 shadow-lg">
              <div className="flex">
                <Mail className="h-5 w-5 text-green-400 mt-0.5 mr-3" />
                <div className="text-sm text-green-200">
                  <p className="font-medium">Reset email sent! 📧🔑</p>
                  <p className="mt-1">Check your email for a password reset link. Click the link to set a new password.</p>
                </div>
              </div>
            </div>
          )}

          <Button
              type="submit"
            loading={loading || rateLimitCooldown > 0}
            icon={isForgotPassword ? <Mail /> : isSignUp ? <UserPlus /> : <LogIn />}
            className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 border-2 border-cyan-400/50 shadow-neon-cyan font-bold"
            >
              {loading || rateLimitCooldown > 0 ? (
              rateLimitCooldown > 0 ? (
                    <>
                      <Clock className="h-5 w-5 mr-2" />
                      Wait {rateLimitCooldown}s ⏱️
                </>
              ) : (
                'Processing... ⚡'
              )
            ) : (
              isForgotPassword ? 'Send Reset Link 📧' : isSignUp ? 'Create Account ⛺' : 'Sign In ✨'
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
                className="text-sm text-cyan-400 hover:text-cyan-300 font-medium inline-flex items-center neon-text-cyan"
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
                    className="text-sm text-cyan-400 hover:text-cyan-300 font-medium neon-text-cyan"
                  >
                    Forgot your password? 🔑
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
                  className="text-sm text-pink-400 hover:text-pink-300 font-medium neon-text-pink"
                >
                  {isSignUp
                    ? 'Already have an account? Sign in ✨'
                    : "Don't have an account? Sign up ⛺"
                  }
                </button>
              </div>
            </div>
          )}
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

        .neon-text-pink {
          text-shadow:
            0 0 5px rgba(236, 72, 153, 0.8),
            0 0 10px rgba(236, 72, 153, 0.6),
            0 0 20px rgba(236, 72, 153, 0.4),
            0 0 40px rgba(236, 72, 153, 0.2);
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