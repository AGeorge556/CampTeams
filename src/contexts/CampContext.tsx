import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

interface Camp {
  id: string
  name: string
  season: 'winter' | 'summer'
  year: number
  start_date: string
  end_date: string
  is_active: boolean
  registration_open: boolean
  max_participants: number | null
  description: string
  bible_verse: string | null
  verse_reference: string | null
  theme_primary_color: string | null
  theme_secondary_color: string | null
  custom_content: Record<string, any> | null
}

interface CampRegistration {
  id: string
  camp_id: string
  user_id: string
  full_name: string
  grade: number
  gender: 'male' | 'female'
  current_team: string | null
  preferred_team: string | null
  switches_remaining: number
  participate_in_teams: boolean
  role: string
}

interface CampContextType {
  currentCamp: Camp | null
  currentRegistration: CampRegistration | null
  loading: boolean
  isRegistered: boolean
  selectCamp: (campId: string) => void
  clearCamp: () => void
  refreshRegistration: () => Promise<void>
}

const CampContext = createContext<CampContextType | undefined>(undefined)

export function CampProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [currentCamp, setCurrentCamp] = useState<Camp | null>(null)
  const [currentRegistration, setCurrentRegistration] = useState<CampRegistration | null>(null)
  const [loading, setLoading] = useState(true)

  // Get camp ID from URL parameters
  const getCampIdFromUrl = () => {
    const params = new URLSearchParams(window.location.search)
    return params.get('camp')
  }

  // Load camp data
  const loadCamp = async (campId: string) => {
    try {
      const { data: campData, error: campError } = await supabase
        .from('camps')
        .select('*')
        .eq('id', campId)
        .single()

      if (campError) throw campError
      setCurrentCamp(campData)
    } catch (error) {
      console.error('Error loading camp:', error)
      setCurrentCamp(null)
    }
  }

  // Load user's registration for this camp
  const loadRegistration = async (campId: string) => {
    if (!user) {
      setCurrentRegistration(null)
      return
    }

    try {
      const { data: regData, error: regError } = await supabase
        .from('camp_registrations')
        .select('*')
        .eq('camp_id', campId)
        .eq('user_id', user.id)
        .single()

      if (regError && regError.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw regError
      }

      setCurrentRegistration(regData || null)
    } catch (error) {
      console.error('Error loading registration:', error)
      setCurrentRegistration(null)
    }
  }

  // Load camp and registration data
  const loadCampData = async () => {
    setLoading(true)
    const campId = getCampIdFromUrl()

    if (!campId) {
      setCurrentCamp(null)
      setCurrentRegistration(null)
      setLoading(false)
      return
    }

    await loadCamp(campId)
    await loadRegistration(campId)
    setLoading(false)
  }

  // Initial load and URL change detection
  useEffect(() => {
    loadCampData()

    // Listen for URL changes (e.g., browser back/forward)
    const handlePopState = () => {
      loadCampData()
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [user])

  // Select a camp (navigate to it)
  const selectCamp = (campId: string) => {
    const url = new URL(window.location.href)
    url.searchParams.set('camp', campId)
    window.history.pushState({}, '', url.toString())
    loadCampData()
  }

  // Clear camp selection (go back to camp selection page)
  const clearCamp = () => {
    const url = new URL(window.location.href)
    url.searchParams.delete('camp')
    window.history.pushState({}, '', url.toString())
    setCurrentCamp(null)
    setCurrentRegistration(null)
  }

  // Refresh registration data (useful after registration/updates)
  const refreshRegistration = async () => {
    const campId = getCampIdFromUrl()
    if (campId) {
      await loadRegistration(campId)
    }
  }

  const value: CampContextType = {
    currentCamp,
    currentRegistration,
    loading,
    isRegistered: !!currentRegistration,
    selectCamp,
    clearCamp,
    refreshRegistration,
  }

  return <CampContext.Provider value={value}>{children}</CampContext.Provider>
}

export function useCamp() {
  const context = useContext(CampContext)
  if (context === undefined) {
    throw new Error('useCamp must be used within a CampProvider')
  }
  return context
}
