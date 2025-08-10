import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useToast } from '../components/Toast'

export function useGalleryVisibility() {
  const [galleryVisible, setGalleryVisible] = useState<boolean>(true)
  const [loading, setLoading] = useState(true)
  const { addToast } = useToast()

  useEffect(() => {
    fetchGalleryVisibility()
    // Keep a persistent subscription so refreshes reflect DB state
    const subscription = setupRealtimeSubscription()
    return () => subscription?.unsubscribe()
  }, [])

  const fetchGalleryVisibility = async () => {
    try {
      const { data, error } = await supabase
        .rpc('get_gallery_visibility')

      if (error) throw error
      setGalleryVisible(data || true)
    } catch (error) {
      console.error('Error loading gallery visibility:', error)
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
          // Update the gallery visibility when camp_settings changes
          if (payload.new && typeof payload.new.gallery_visible === 'boolean') {
            setGalleryVisible(payload.new.gallery_visible)
          }
        }
      )
      .subscribe()

    return subscription
  }

  const toggleGalleryVisibility = async () => {
    // Do not optimistically update; rely on DB persisted state to avoid client-side resets
    setLoading(true)
    try {
      const { error } = await supabase.rpc('toggle_gallery_visibility')
      if (error) throw error
      // Re-fetch to ensure we reflect the stored value
      await fetchGalleryVisibility()
      addToast({
        type: 'success',
        title: 'Gallery Visibility Updated',
        message: `Gallery tab is now ${!galleryVisible ? 'visible' : 'hidden'} to campers`
      })
    } catch (error: any) {
      console.error('Error toggling gallery visibility:', error)
      addToast({
        type: 'error',
        title: 'Error',
        message: error.message || 'Failed to update gallery visibility'
      })
    } finally {
      setLoading(false)
    }
  }

  return {
    galleryVisible,
    loading,
    toggleGalleryVisibility
  }
} 