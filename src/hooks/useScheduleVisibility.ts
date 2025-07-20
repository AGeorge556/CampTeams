import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useScheduleVisibility() {
  const [scheduleVisible, setScheduleVisible] = useState(true)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadScheduleVisibility()
    const subscription = setupRealtimeSubscription()

    return () => {
      // Cleanup subscription
      subscription?.unsubscribe()
    }
  }, [])

  const loadScheduleVisibility = async () => {
    try {
      const { data, error } = await supabase
        .rpc('get_schedule_visibility')

      if (error) throw error
      setScheduleVisible(data || true)
    } catch (error) {
      console.error('Error loading schedule visibility:', error)
    } finally {
      setLoading(false)
    }
  }

  const setupRealtimeSubscription = () => {
    const subscription = supabase
      .channel('camp_settings_changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'camp_settings'
        },
        (payload) => {
          // Update the schedule visibility when camp_settings changes
          if (payload.new && typeof payload.new.schedule_visible === 'boolean') {
            setScheduleVisible(payload.new.schedule_visible)
          }
        }
      )
      .subscribe()

    return subscription
  }

  const toggleScheduleVisibility = async () => {
    // Optimistic UI update
    const newVisibility = !scheduleVisible
    setScheduleVisible(newVisibility)

    try {
      const { error } = await supabase
        .rpc('toggle_schedule_visibility')

      if (error) throw error
    } catch (error) {
      console.error('Error toggling schedule visibility:', error)
      // Revert optimistic update on error
      setScheduleVisible(!newVisibility)
      throw error
    }
  }

  return {
    scheduleVisible,
    loading,
    toggleScheduleVisibility
  }
} 