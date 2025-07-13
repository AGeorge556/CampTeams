import React, { useState } from 'react'
import { Users, Mail, Lock, UserPlus, LogIn, Clock, AlertCircle } from 'lucide-react'
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
  const { signUp, signIn } = useAuth()
  const { addToast } = useToast()
  const [isSignUp, setIsSignUp] = useState(initialMode === 'signup')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const [rateLimitCooldown, setRateLimitCooldown] = useState(0)
  const [showEmailConfirmation, setShowEmailConfirmation] = useState(false)

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    // Email validation
    if (!email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    // Password validation
    if (!password) {
      newErrors.password = 'Password is required'
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    } else if (isSignUp && password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters for signup'
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
      if (isSignUp) {
        const { error } = await signUp(email, password)
        if (error) {
          if (error.message.includes('over_email_send_rate_limit')) {
            const match = error.message.match(/after (\d+) seconds/)
            const seconds = match ? parseInt(match[1]) : 60
            setRateLimitCooldown(seconds)
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-yellow-50 px-4 sm:px-6 lg:px-8">
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
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Summer Camp Team Selection
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {isSignUp ? 'Create your account to join a team' : 'Sign in to manage your team'}
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
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
          </div>

          {showEmailConfirmation && (
            <div className="rounded-md bg-green-50 border border-green-200 p-4">
              <div className="flex">
                <Mail className="h-5 w-5 text-green-500 mt-0.5 mr-3" />
                <div className="text-sm text-green-700">
                  <p className="font-medium">Check your email!</p>
                  <p className="mt-1">We've sent you a confirmation link. Please click it to activate your account, then return here to sign in.</p>
                </div>
              </div>
            </div>
          )}

          <Button
            type="submit"
            loading={loading || rateLimitCooldown > 0}
            icon={isSignUp ? <UserPlus /> : <LogIn />}
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
              isSignUp ? 'Create Account' : 'Sign In'
            )}
          </Button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-sm text-orange-600 hover:text-orange-700 font-medium"
            >
              {isSignUp 
                ? 'Already have an account? Sign in' 
                : "Don't have an account? Sign up"
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}