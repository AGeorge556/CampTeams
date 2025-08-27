import { useEffect, useState } from 'react'
import { Profile, supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

// Simple cache to prevent unnecessary re-fetching
const profileCache = new Map<string, { profile: Profile | null, timestamp: number }>()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

export function useProfile() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    if (!user) {
      setProfile(null)
      setLoading(false)
      setRetryCount(0)
      return
    }

    const fetchProfile = async () => {
      try {
        setLoading(true)
        
        // Check cache first
        const cached = profileCache.get(user.id)
        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
          setProfile(cached.profile)
          setLoading(false)
          setRetryCount(0)
          return
        }

        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (error) {
          if (error.code === 'PGRST116') {
            // Profile doesn't exist - this is expected for new users
            setProfile(null)
            profileCache.set(user.id, { profile: null, timestamp: Date.now() })
          } else {
            console.error('Error fetching profile:', error)
            // Retry logic for network errors
            if (retryCount < 3) {
              setTimeout(() => {
                setRetryCount(prev => prev + 1)
              }, 1000 * (retryCount + 1)) // Exponential backoff
              return
            }
            setProfile(null)
          }
        } else {
          setProfile(data)
          setRetryCount(0) // Reset retry count on success
          // Cache the successful result
          profileCache.set(user.id, { profile: data, timestamp: Date.now() })
        }
      } catch (error) {
        console.error('Error fetching profile:', error)
        // Retry logic for network errors
        if (retryCount < 3) {
          setTimeout(() => {
            setRetryCount(prev => prev + 1)
          }, 1000 * (retryCount + 1)) // Exponential backoff
          return
        }
        setProfile(null)
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [user, retryCount])

  const createProfile = async (profileData: Omit<Profile, 'id' | 'created_at' | 'updated_at'>) => {
    if (!user) return { error: 'No user' }

    const { data, error } = await supabase
      .from('profiles')
      .insert([{ ...profileData, id: user.id }])
      .select()
      .single()

    if (!error) {
      setProfile(data)
      // Update cache
      profileCache.set(user.id, { profile: data, timestamp: Date.now() })
    }

    return { data, error }
  }

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return { error: 'No user' }

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single()

    if (!error) {
      setProfile(data)
      // Update cache
      profileCache.set(user.id, { profile: data, timestamp: Date.now() })
    }

    return { data, error }
  }

  return {
    profile,
    loading,
    createProfile,
    updateProfile
  }
}