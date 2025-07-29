import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useToast } from '../components/Toast'

export function useGalleryVisibility() {
  const [galleryVisible, setGalleryVisible] = useState<boolean>(true)
  const [loading, setLoading] = useState(true)
  const { addToast } = useToast()

  useEffect(() => {
    fetchGalleryVisibility()
    const subscription = setupRealtimeSubscription()

    return () => {
      // Cleanup subscription
      subscription?.unsubscribe()
    }
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
    setLoading(true)
    try {
      // Optimistic UI update
      const newVisibility = !galleryVisible
      setGalleryVisible(newVisibility)

      const { error } = await supabase
        .rpc('toggle_gallery_visibility')

      if (error) throw error

      addToast({
        type: 'success',
        title: 'Gallery Visibility Updated',
        message: `Gallery tab is now ${newVisibility ? 'visible' : 'hidden'} to campers`
      })
    } catch (error: any) {
      console.error('Error toggling gallery visibility:', error)
      // Revert optimistic update on error
      setGalleryVisible(!galleryVisible)
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