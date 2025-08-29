import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { GalleryPhoto, GalleryPhotoWithInfo, GalleryStats, PhotoUpload, GalleryFilters } from '../lib/types'
import { useProfile } from './useProfile'
import { useAuth } from './useAuth'

export function useGallery() {
  const { user } = useAuth()
  const { profile } = useProfile()
  const [photos, setPhotos] = useState<GalleryPhoto[]>([])
  const [approvedPhotos, setApprovedPhotos] = useState<GalleryPhoto[]>([])
  const [myPhotos, setMyPhotos] = useState<GalleryPhoto[]>([])
  const [stats, setStats] = useState<GalleryStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      loadPhotos()
      loadStats()
      subscribeToPhotos()
    }
  }, [user])

  const loadPhotos = async () => {
    if (!user) return

    try {
      setLoading(true)
      setError(null)

      // Load approved photos for public gallery
      const { data: approvedData, error: approvedError } = await supabase
        .from('gallery_photos')
        .select('*')
        .eq('status', 'approved')
        .order('submitted_at', { ascending: false })

      if (approvedError) throw approvedError
      setApprovedPhotos(approvedData || [])

      // Load user's own photos
      const { data: myData, error: myError } = await supabase
        .from('gallery_photos')
        .select('*')
        .eq('user_id', user.id)
        .order('submitted_at', { ascending: false })

      if (myError) throw myError
      setMyPhotos(myData || [])

      // Load all photos for admin
      if (profile?.is_admin) {
        const { data: allData, error: allError } = await supabase
          .from('gallery_photos')
          .select('*')
          .order('submitted_at', { ascending: false })

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
    if (!user) return

    const subscription = supabase
      .channel('gallery_photos')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'gallery_photos'
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

  const checkStorageBucket = async (): Promise<{ exists: boolean; error?: string }> => {
    try {
      const { data, error } = await supabase.storage.listBuckets()
      if (error) {
        return { exists: false, error: `Failed to list buckets: ${error.message}` }
      }
      
      const galleryBucket = data?.find(bucket => bucket.name === 'gallery-photos')
      if (!galleryBucket) {
        return { exists: false, error: 'Gallery storage bucket does not exist. Please contact an administrator.' }
      }
      
      return { exists: true }
    } catch (err) {
      return { exists: false, error: `Storage check failed: ${err instanceof Error ? err.message : 'Unknown error'}` }
    }
  }

  const uploadPhoto = async (photoUpload: PhotoUpload): Promise<{ success: boolean; error?: string }> => {
    if (!user || !profile) {
      return { success: false, error: 'User not authenticated' }
    }

    try {
      setUploading(true)
      setError(null)

      console.log('Starting upload for file:', photoUpload.file.name, 'Size:', photoUpload.file.size)

      // Check storage bucket first
      const bucketCheck = await checkStorageBucket()
      if (!bucketCheck.exists) {
        return { success: false, error: bucketCheck.error || 'Storage not configured properly' }
      }

      // Check file type (now including videos)
      const allowedTypes = [
        'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
        'video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'
      ]
      if (!allowedTypes.includes(photoUpload.file.type)) {
        return { success: false, error: 'Only image and video files are allowed (JPEG, PNG, GIF, WebP, MP4, WebM, OGG, MOV)' }
      }

      // Check file size (50MB limit)
      const maxSize = 50 * 1024 * 1024 // 50MB
      if (photoUpload.file.size > maxSize) {
        return { success: false, error: 'File size must be less than 50MB' }
      }

      // Upload to Supabase Storage (private bucket)
      const fileExt = photoUpload.file.name.split('.').pop()
      const storage_path = `${user.id}/${Date.now()}.${fileExt}`
      
      console.log('Uploading to storage path:', storage_path)
      
      const { error: uploadError } = await supabase.storage
        .from('gallery-photos')
        .upload(storage_path, photoUpload.file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        console.error('Storage upload error:', uploadError)
        throw new Error(`Storage upload failed: ${uploadError.message}`)
      }

      console.log('Storage upload successful, saving to database...')

      // Get the public URL for the uploaded file
      const { data: urlData } = supabase.storage
        .from('gallery-photos')
        .getPublicUrl(storage_path)

      const publicUrl = urlData?.publicUrl || ''

      // Save to database with both image_url and storage_path
      const { error: dbError } = await supabase
        .from('gallery_photos')
        .insert({
          user_id: user.id,
          team_id: profile.current_team,
          image_url: publicUrl, // Required field
          storage_path: storage_path, // New field for better management
          caption: photoUpload.caption || null
        })

      if (dbError) {
        console.error('Database insert error:', dbError)
        
        // If database insert fails, clean up the uploaded file
        await supabase.storage
          .from('gallery-photos')
          .remove([storage_path])
        
        throw new Error(`Database insert failed: ${dbError.message}`)
      }

      console.log('Upload completed successfully')
      return { success: true }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload photo'
      console.error('Upload error:', err)
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
        .from('gallery_photos')
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
        .from('gallery_photos')
        .delete()
        .eq('id', photoId)

      if (dbError) throw dbError

      // Delete from storage using storage_path
      if (photo.storage_path) {
        await supabase.storage
          .from('gallery-photos')
          .remove([photo.storage_path])
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
      filteredPhotos = filteredPhotos.filter(photo => photo.team_id === filters.team)
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