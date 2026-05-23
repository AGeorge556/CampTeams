import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const CACHE_KEY = 'vis_schedule'

export function useScheduleVisibility() {
  const [scheduleVisible, setScheduleVisible] = useState<boolean>(() => {
    const cached = localStorage.getItem(CACHE_KEY)
    return cached !== null ? cached === 'true' : true
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadScheduleVisibility()
  }, [])

  const loadScheduleVisibility = async () => {
    try {
      const { data, error } = await supabase
        .from('camp_settings')
        .select('schedule_visible')
        .single()
      if (error && (error as any).code !== 'PGRST116') {
        console.error('Error fetching schedule visibility:', error)
      } else {
        const value = (data as any)?.schedule_visible ?? true
        setScheduleVisible(value)
        localStorage.setItem(CACHE_KEY, String(value))
      }
    } catch (error) {
      console.error('Error loading schedule visibility:', error)
    } finally {
      setLoading(false)
    }
  }

  // Removed realtime subscription to mirror gallery/oil pattern

  const toggleScheduleVisibility = async () => {
    try {
      const newVisibility = !scheduleVisible
      const { error: updateError } = await supabase
        .from('camp_settings')
        .update({ schedule_visible: newVisibility })
        .neq('id', '00000000-0000-0000-0000-000000000000')
      if (updateError && (updateError as any).code !== 'PGRST116') {
        throw updateError
      }
      setScheduleVisible(newVisibility)
      localStorage.setItem(CACHE_KEY, String(newVisibility))
    } catch (error) {
      console.error('Error toggling schedule visibility:', error)
      throw error
    }
  }

  return {
    scheduleVisible,
    loading,
    toggleScheduleVisibility
  }
} 