import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useScheduleVisibility() {
  const [scheduleVisible, setScheduleVisible] = useState(true)
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
      
      if (error) {
        // Handle different error types gracefully
        if (error.code === 'PGRST116') {
          // No rows returned - use default value
          setScheduleVisible(true)
        } else if (error.code === 'PGRST301' || error.code === '42501') {
          // Permission denied or insufficient privileges - use default value
          console.warn('Permission denied accessing camp_settings, using default visibility')
          setScheduleVisible(true)
        } else {
          console.error('Error fetching schedule visibility:', error)
          // Use default value on error
          setScheduleVisible(true)
        }
      } else {
        setScheduleVisible(data?.schedule_visible ?? true)
      }
    } catch (error) {
      console.error('Error loading schedule visibility:', error)
      // Use default value on any error
      setScheduleVisible(true)
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
      if (updateError && updateError.code !== 'PGRST116') {
        throw updateError
      }
      setScheduleVisible(newVisibility)
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