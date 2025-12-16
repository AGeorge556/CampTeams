import { useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signUp = async (email: string, password: string) => {
    // Build a safe, absolute redirect URL for email links
    const siteUrlEnv = import.meta.env.VITE_SITE_URL as string | undefined
    const siteUrl = (siteUrlEnv && typeof siteUrlEnv === 'string' ? siteUrlEnv : window.location.origin).replace(/\/$/, '')
    const redirectTo = `${siteUrl}/auth/callback`

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectTo
      }
    })
    return { data, error }
  }

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    return { data, error }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    return { error }
  }

  const resetPassword = async (email: string) => {
    // Build a safe, absolute redirect URL for password reset links
    const siteUrlEnv = import.meta.env.VITE_SITE_URL as string | undefined
    const siteUrl = (siteUrlEnv && typeof siteUrlEnv === 'string' ? siteUrlEnv : window.location.origin).replace(/\/$/, '')
    const redirectTo = `${siteUrl}/auth/reset-password`

    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo
    })
    return { data, error }
  }

  const updatePassword = async (newPassword: string) => {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword
    })
    return { data, error }
  }

  return {
    user,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updatePassword
  }
}