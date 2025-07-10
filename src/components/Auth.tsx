import React, { useState } from 'react'
import { Users, Mail, Lock, UserPlus, LogIn, Clock, AlertCircle } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

interface AuthProps {
  initialMode?: 'signup' | 'signin'
  onBack?: () => void
}

export default function Auth({ initialMode = 'signin', onBack }: AuthProps) {
  const { signUp, signIn } = useAuth()
  const [isSignUp, setIsSignUp] = useState(initialMode === 'signup')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [rateLimitCooldown, setRateLimitCooldown] = useState(0)
  const [showEmailConfirmation, setShowEmailConfirmation] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (isSignUp) {
        const { error } = await signUp(email, password)
        if (error) {
          if (error.message.includes('over_email_send_rate_limit')) {
            const match = error.message.match(/after (\d+) seconds/)
            const seconds = match ? parseInt(match[1]) : 60
            setRateLimitCooldown(seconds)
            startCooldownTimer(seconds)
            setError(`Please wait ${seconds} seconds before trying again due to rate limiting.`)
          } else {
            throw error
          }
        } else {
          setShowEmailConfirmation(true)
          setError('')
        }
      } else {
        const { error } = await signIn(email, password)
        if (error) {
          if (error.message.includes('Email not confirmed')) {
            setError('Please check your email and click the confirmation link before signing in.')
          } else {
            throw error
          }
        }
      }
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const startCooldownTimer = (seconds: number) => {
    const timer = setInterval(() => {
      setRateLimitCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          setError('')
          return 0
        }
        setError(`Please wait ${prev - 1} seconds before trying again due to rate limiting.`)
        return prev - 1
      })
    }, 1000)
  }

  const getErrorIcon = () => {
    if (error.includes('rate limit')) return <Clock className="h-5 w-5 text-orange-500" />
    if (error.includes('Email not confirmed')) return <Mail className="h-5 w-5 text-blue-500" />
    return <AlertCircle className="h-5 w-5 text-red-500" />
  }

  const getErrorStyle = () => {
    if (error.includes('rate limit')) return 'bg-orange-50 text-orange-700 border-orange-200'
    if (error.includes('Email not confirmed')) return 'bg-blue-50 text-blue-700 border-blue-200'
    return 'bg-red-50 text-red-700 border-red-200'
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-yellow-50 px-4 sm:px-6 lg:px-8">
      {onBack && (
        <button
          onClick={onBack}
          className="absolute top-6 left-6 text-gray-600 hover:text-gray-900 transition-colors"
        >
          ← Back to Home
        </button>
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
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="appearance-none block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="appearance-none block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                  placeholder="Enter your password"
                />
              </div>
            </div>
          </div>

          {showEmailConfirmation && !error && (
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

          {error && (
            <div className={`rounded-md border p-4 ${getErrorStyle()}`}>
              <div className="flex">
                {getErrorIcon()}
                <div className="ml-3">
                  <div className="text-sm font-medium">
                    {error.includes('rate limit') && 'Rate Limited'}
                    {error.includes('Email not confirmed') && 'Email Confirmation Required'}
                    {!error.includes('rate limit') && !error.includes('Email not confirmed') && 'Error'}
                  </div>
                  <div className="text-sm mt-1">{error}</div>
                  {error.includes('Email not confirmed') && (
                    <div className="text-sm mt-2">
                      <p>Don't see the email? Check your spam folder or try signing up again.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading || rateLimitCooldown > 0}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading || rateLimitCooldown > 0 ? (
                <>
                  {loading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <Clock className="h-5 w-5 mr-2" />
                      Wait {rateLimitCooldown}s
                    </>
                  )}
                </>
              ) : (
                <>
                  {isSignUp ? (
                    <UserPlus className="h-5 w-5 mr-2" />
                  ) : (
                    <LogIn className="h-5 w-5 mr-2" />
                  )}
                  {isSignUp ? 'Sign up' : 'Sign in'}
                </>
              )}
            </button>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp)
                setError('')
                setShowEmailConfirmation(false)
                setRateLimitCooldown(0)
              }}
              className="text-sm text-orange-600 hover:text-orange-500"
            >
              {isSignUp
                ? 'Already have an account? Sign in'
                : "Don't have an account? Sign up"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}