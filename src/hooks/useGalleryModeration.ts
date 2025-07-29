import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { GalleryPhotoWithInfo, GalleryStats, PhotoStatus } from '../lib/types'
import { useAuth } from './useAuth'
import { useProfile } from './useProfile'

export function useGalleryModeration() {
  const { user } = useAuth()
  const { profile } = useProfile()
  const [photosWithInfo, setPhotosWithInfo] = useState<GalleryPhotoWithInfo[]>([])
  const [stats, setStats] = useState<GalleryStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [moderating, setModerating] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<PhotoStatus | null>(null)

  useEffect(() => {
    if (user && profile?.is_admin) {
      loadPhotosWithInfo()
      loadStats()
      subscribeToPhotos()
    }
  }, [user, profile?.is_admin, statusFilter])

  const loadPhotosWithInfo = async () => {
    if (!user || !profile?.is_admin) return

    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .rpc('get_gallery_photos_with_info', {
          status_filter: statusFilter
        })

      if (error) throw error
      setPhotosWithInfo(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load photos')
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    if (!user || !profile?.is_admin) return

    try {
      const { data, error } = await supabase
        .rpc('get_gallery_stats')

      if (error) throw error
      setStats(data?.[0] || null)
    } catch (err) {
      console.error('Failed to load gallery stats:', err)
    }
  }

  const subscribeToPhotos = () => {
    if (!user || !profile?.is_admin) return

    const subscription = supabase
      .channel('gallery_moderation')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'gallery_photos'
        },
        () => {
          loadPhotosWithInfo()
          loadStats()
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }

  const approvePhoto = async (photoId: string): Promise<{ success: boolean; error?: string }> => {
    if (!user || !profile?.is_admin) {
      return { success: false, error: 'Admin access required' }
    }

    try {
      setModerating(photoId)
      setError(null)

      const { data, error } = await supabase
        .rpc('approve_photo', {
          photo_id_param: photoId,
          admin_id_param: user.id
        })

      if (error) throw error
      if (!data) {
        return { success: false, error: 'Photo not found or already processed' }
      }

      return { success: true }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to approve photo'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setModerating(null)
    }
  }

  const rejectPhoto = async (photoId: string): Promise<{ success: boolean; error?: string }> => {
    if (!user || !profile?.is_admin) {
      return { success: false, error: 'Admin access required' }
    }

    try {
      setModerating(photoId)
      setError(null)

      const { data, error } = await supabase
        .rpc('reject_photo', {
          photo_id_param: photoId,
          admin_id_param: user.id
        })

      if (error) throw error
      if (!data) {
        return { success: false, error: 'Photo not found or already processed' }
      }

      return { success: true }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reject photo'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setModerating(null)
    }
  }

  const deletePhoto = async (photoId: string): Promise<{ success: boolean; error?: string }> => {
    if (!user || !profile?.is_admin) {
      return { success: false, error: 'Admin access required' }
    }

    try {
      setModerating(photoId)
      setError(null)

      // Get photo details first
      const { data: photo, error: fetchError } = await supabase
        .from('gallery_photos')
        .select('*')
        .eq('id', photoId)
        .single()

      if (fetchError) throw fetchError

      // Delete from database
      const { error: dbError } = await supabase
        .from('gallery_photos')
        .delete()
        .eq('id', photoId)

      if (dbError) throw dbError

      // Delete from storage
      const imageUrl = photo.image_url
      const fileName = imageUrl.split('/').pop()
      if (fileName) {
        const userFolder = imageUrl.split('/').slice(-2, -1)[0] // Get user folder
        await supabase.storage
          .from('gallery-photos')
          .remove([`${userFolder}/${fileName}`])
      }

      return { success: true }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete photo'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setModerating(null)
    }
  }

  const getPendingPhotos = (): GalleryPhotoWithInfo[] => {
    return photosWithInfo.filter(photo => photo.status === 'pending')
  }

  const getApprovedPhotos = (): GalleryPhotoWithInfo[] => {
    return photosWithInfo.filter(photo => photo.status === 'approved')
  }

  const getRejectedPhotos = (): GalleryPhotoWithInfo[] => {
    return photosWithInfo.filter(photo => photo.status === 'rejected')
  }

  const getPhotosByTeam = (teamId: string): GalleryPhotoWithInfo[] => {
    return photosWithInfo.filter(photo => photo.team_id === teamId)
  }

  const getPhotosByUser = (userId: string): GalleryPhotoWithInfo[] => {
    return photosWithInfo.filter(photo => photo.user_id === userId)
  }

  return {
    photosWithInfo,
    stats,
    loading,
    moderating,
    error,
    statusFilter,
    setStatusFilter,
    approvePhoto,
    rejectPhoto,
    deletePhoto,
    getPendingPhotos,
    getApprovedPhotos,
    getRejectedPhotos,
    getPhotosByTeam,
    getPhotosByUser,
    refresh: loadPhotosWithInfo
  }
} 