import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { GalleryPhoto, GalleryPhotoWithInfo, GalleryStats, PhotoUpload, GalleryFilters } from '../lib/types'
import { useProfile } from './useProfile'
import { useAuth } from './useAuth'
import { useCamp } from '../contexts/CampContext'

export function useGallery() {
  const { user } = useAuth()
  const { profile } = useProfile()
  const { currentCamp, currentRegistration } = useCamp()
  const [photos, setPhotos] = useState<GalleryPhoto[]>([])
  const [approvedPhotos, setApprovedPhotos] = useState<GalleryPhoto[]>([])
  const [myPhotos, setMyPhotos] = useState<GalleryPhoto[]>([])
  const [stats, setStats] = useState<GalleryStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user && currentCamp) {
      loadPhotos()
      loadStats()
      subscribeToPhotos()
    }
  }, [user, currentCamp])

  const loadPhotos = async () => {
    if (!user || !currentCamp) return

    try {
      setLoading(true)
      setError(null)

      // Load approved photos for public gallery (camp-specific)
      const { data: approvedData, error: approvedError } = await supabase
        .from('camp_gallery')
        .select('*')
        .eq('camp_id', currentCamp.id)
        .eq('status', 'approved')
        .order('created_at', { ascending: false })

      if (approvedError) throw approvedError
      setApprovedPhotos(approvedData || [])

      // Load user's own photos (camp-specific)
      const { data: myData, error: myError } = await supabase
        .from('camp_gallery')
        .select('*')
        .eq('camp_id', currentCamp.id)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (myError) throw myError
      setMyPhotos(myData || [])

      // Load all photos for admin (camp-specific)
      if (profile?.is_admin) {
        const { data: allData, error: allError } = await supabase
          .from('camp_gallery')
          .select('*')
          .eq('camp_id', currentCamp.id)
          .order('created_at', { ascending: false })

        if (allError) throw allError
        setPhotos(allData || [])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load photos')
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    if (!user) return

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
    if (!user || !currentCamp) return

    const subscription = supabase
      .channel(`camp_gallery_${currentCamp.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'camp_gallery',
          filter: `camp_id=eq.${currentCamp.id}`
        },
        () => {
          loadPhotos()
          loadStats()
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }

  const getSignedUrl = async (storage_path: string | null) => {
    if (!storage_path) return null
    const { data, error } = await supabase.storage
      .from('gallery-photos')
      .createSignedUrl(storage_path, 60) // 60 seconds
    if (error) return null
    return data?.signedUrl || null
  }

  const uploadPhoto = async (photoUpload: PhotoUpload): Promise<{ success: boolean; error?: string }> => {
    if (!user || !currentCamp || !currentRegistration) {
      return { success: false, error: 'User not authenticated or camp not selected' }
    }

    try {
      setUploading(true)
      setError(null)

      // Check file type (now including videos)
      const allowedTypes = [
        'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
        'video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'
      ]
      if (!allowedTypes.includes(photoUpload.file.type)) {
        return { success: false, error: 'Only image and video files are allowed (JPEG, PNG, GIF, WebP, MP4, WebM, OGG, MOV)' }
      }

      // Upload to Supabase Storage (private bucket)
      const fileExt = photoUpload.file.name.split('.').pop()
      const storage_path = `${currentCamp.id}/${user.id}/${Date.now()}.${fileExt}`
      const { error: uploadError } = await supabase.storage
        .from('gallery-photos')
        .upload(storage_path, photoUpload.file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) throw uploadError

      // Save to database (do not store publicUrl)
      const { error: dbError } = await supabase
        .from('camp_gallery')
        .insert({
          camp_id: currentCamp.id,
          user_id: user.id,
          photo_url: storage_path, // Using storage_path as photo_url
          team: currentRegistration.current_team,
          caption: photoUpload.caption || null,
          status: 'pending'
        })

      if (dbError) throw dbError

      return { success: true }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload photo'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setUploading(false)
    }
  }

  const deletePhoto = async (photoId: string): Promise<{ success: boolean; error?: string }> => {
    if (!user) {
      return { success: false, error: 'User not authenticated' }
    }

    try {
      setError(null)

      // Get photo to check ownership and status
      const { data: photo, error: fetchError } = await supabase
        .from('camp_gallery')
        .select('*')
        .eq('id', photoId)
        .single()

      if (fetchError) throw fetchError

      // Check if user can delete this photo
      if (photo.user_id !== user.id) {
        return { success: false, error: 'You can only delete your own photos' }
      }

      if (photo.status !== 'pending') {
        return { success: false, error: 'You can only delete pending photos' }
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('camp_gallery')
        .delete()
        .eq('id', photoId)

      if (dbError) throw dbError

      // Delete from storage using photo_url (which contains the storage path)
      if (photo.photo_url) {
        await supabase.storage
          .from('gallery-photos')
          .remove([photo.photo_url])
      }

      return { success: true }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete photo'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  const getFilteredPhotos = (filters: GalleryFilters = {}): GalleryPhoto[] => {
    let filteredPhotos = photos

    if (filters.status) {
      filteredPhotos = filteredPhotos.filter(photo => photo.status === filters.status)
    }

    if (filters.team) {
      filteredPhotos = filteredPhotos.filter(photo => photo.team === filters.team)
    }

    if (filters.user) {
      filteredPhotos = filteredPhotos.filter(photo => photo.user_id === filters.user)
    }

    return filteredPhotos
  }

  return {
    photos,
    approvedPhotos,
    myPhotos,
    stats,
    loading,
    uploading,
    error,
    uploadPhoto,
    deletePhoto,
    getFilteredPhotos,
    getSignedUrl,
    refresh: loadPhotos
  }
} 