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
      if (error && (error as any).code !== 'PGRST116') {
        console.error('Error fetching schedule visibility:', error)
      } else {
        setScheduleVisible((data as any)?.schedule_visible ?? true)
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