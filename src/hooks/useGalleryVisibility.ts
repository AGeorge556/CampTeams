import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useToast } from '../components/Toast'

export function useGalleryVisibility() {
  const [galleryVisible, setGalleryVisible] = useState<boolean>(true)
  const [loading, setLoading] = useState(true)
  const { addToast } = useToast()

  useEffect(() => {
    fetchGalleryVisibility()
  }, [])

  const fetchGalleryVisibility = async () => {
    try {
      const { data, error } = await supabase
        .from('camp_settings')
        .select('gallery_visible')
        .single()
      if (error && (error as any).code !== 'PGRST116') {
        console.error('Error fetching gallery visibility:', error)
      } else {
        setGalleryVisible((data as any)?.gallery_visible ?? true)
      }
    } catch (error) {
      console.error('Error fetching gallery visibility:', error)
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
      const newVisibility = !galleryVisible
      const { error: updateError } = await supabase
        .from('camp_settings')
        .update({ gallery_visible: newVisibility })
        .neq('id', '00000000-0000-0000-0000-000000000000')
      if (updateError && (updateError as any).code !== 'PGRST116') {
        throw updateError
      }
      setGalleryVisible(newVisibility)
      addToast({
        type: 'success',
        title: 'Gallery Visibility Updated',
        message: `Gallery tab is now ${newVisibility ? 'visible' : 'hidden'} to campers`
      })
    } catch (error: any) {
      console.error('Error updating gallery visibility:', error)
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