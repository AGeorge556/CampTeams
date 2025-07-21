import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export function useRulesAcceptance() {
  const { user } = useAuth()
  const [hasAccepted, setHasAccepted] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setHasAccepted(null)
      setLoading(false)
      return
    }

    const checkRulesAcceptance = async () => {
      try {
        const { data, error } = await supabase.rpc('has_accepted_rules', {
          user_id_param: user.id
        })

        if (error) {
          console.error('Error checking rules acceptance:', error)
          setHasAccepted(false)
        } else {
          setHasAccepted(data)
        }
      } catch (error) {
        console.error('Error checking rules acceptance:', error)
        setHasAccepted(false)
      } finally {
        setLoading(false)
      }
    }

    checkRulesAcceptance()
  }, [user])

  const acceptRules = async () => {
    if (!user) return { error: 'No user' }

    try {
      const { data, error } = await supabase.rpc('accept_rules', {
        user_id_param: user.id
      })

      if (error) {
        return { error }
      }

      setHasAccepted(true)
      return { success: true }
    } catch (error: any) {
      console.error('Error accepting rules:', error)
      return { error: error.message || 'Failed to accept rules' }
    }
  }

  return {
    hasAccepted,
    loading,
    acceptRules
  }
} 