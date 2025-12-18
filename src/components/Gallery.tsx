import React, { useState, useEffect } from 'react'
import { Camera, Upload, Image, Clock, CheckCircle, XCircle, Trash2, Eye, Plus, X } from 'lucide-react'
import { useGallery } from '../hooks/useGallery'
import { useProfile } from '../hooks/useProfile'
import { useLanguage } from '../contexts/LanguageContext'
import { useToast } from './Toast'
import { PhotoUpload, GalleryPhoto, PhotoStatus } from '../lib/types'
import { PHOTO_STATUS_LABELS, PHOTO_STATUS_COLORS } from '../lib/types'
import Button from './ui/Button'
import LoadingSpinner from './LoadingSpinner'
import PhotoModal from './PhotoModal'

export default function Gallery() {
  const { t } = useLanguage()
  const { profile } = useProfile()
  const { addToast } = useToast()
  const {
    approvedPhotos,
    myPhotos,
    stats,
    loading,
    uploading,
    error,
    uploadPhoto,
    deletePhoto,
    getSignedUrl
  } = useGallery()

  const [showUpload, setShowUpload] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<PhotoUpload[]>([])
  const [captions, setCaptions] = useState<Record<string, string>>({})
  const [selectedPhoto, setSelectedPhoto] = useState<GalleryPhoto | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)

  // Signed URL state for previews
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({})

  // Fetch signed URLs for all displayed photos
  useEffect(() => {
    const fetchUrls = async () => {
      const allPhotos = [...myPhotos, ...approvedPhotos]
      const urlMap: Record<string, string> = {}
      await Promise.all(
        allPhotos.map(async (photo) => {
          if (photo.photo_url) {
            const url = await getSignedUrl(photo.photo_url)
            if (url) urlMap[photo.id] = url
          }
        })
      )
      setSignedUrls(urlMap)
    }
    fetchUrls()
  }, [myPhotos, approvedPhotos])

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    const newUploads: PhotoUpload[] = files.map(file => ({
      file,
      preview: URL.createObjectURL(file)
    }))
    
    setSelectedFiles(prev => [...prev, ...newUploads]) // No file limit
  }

  const removeFile = (index: number) => {
    const removed = selectedFiles[index]
    if (removed.preview) {
      URL.revokeObjectURL(removed.preview)
    }
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
    setCaptions(prev => {
      const newCaptions = { ...prev }
      delete newCaptions[removed.file.name]
      return newCaptions
    })
  }

  const handleCaptionChange = (fileName: string, caption: string) => {
    setCaptions(prev => ({
      ...prev,
      [fileName]: caption
    }))
  }

  const handleSubmit = async () => {
    if (selectedFiles.length === 0) {
      addToast({
        type: 'error',
        title: t('error'),
        message: 'Please select at least one file'
      })
      return
    }

    let successCount = 0
    let errorCount = 0

    for (const upload of selectedFiles) {
      const result = await uploadPhoto({
        ...upload,
        caption: captions[upload.file.name] || undefined
      })

      if (result.success) {
        successCount++
      } else {
        errorCount++
        addToast({
          type: 'error',
          title: t('uploadError'),
          message: result.error || 'Failed to upload photo'
        })
      }
    }

    if (successCount > 0) {
      addToast({
        type: 'success',
        title: t('uploadSuccess'),
        message: `Successfully uploaded ${successCount} file${successCount > 1 ? 's' : ''}`
      })
    }

    // Clean up
    selectedFiles.forEach(upload => {
      if (upload.preview) {
        URL.revokeObjectURL(upload.preview)
      }
    })
    setSelectedFiles([])
    setCaptions({})
    setShowUpload(false)
  }

  const handleDeletePhoto = async (photoId: string) => {
    const result = await deletePhoto(photoId)
    if (result.success) {
      addToast({
        type: 'success',
        title: t('success'),
        message: t('photoDeleted')
      })
    } else {
      addToast({
        type: 'error',
        title: t('error'),
        message: result.error || 'Failed to delete photo'
      })
    }
    setShowDeleteConfirm(null)
  }

  const getStatusIcon = (status: PhotoStatus) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />
      case 'approved':
        return <CheckCircle className="h-4 w-4" />
      case 'rejected':
        return <XCircle className="h-4 w-4" />
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  if (loading) {
    return <LoadingSpinner text="Loading gallery..." />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[var(--color-card-bg)] rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Camera className="h-8 w-8 text-sky-500" />
            <div>
              <h1 className="text-2xl font-bold text-[var(--color-text)]">{t('gallery')}</h1>
              <p className="text-[var(--color-text-muted)]">Share your camp memories with photos</p>
            </div>
          </div>
          <Button
            onClick={() => setShowUpload(true)}
            icon={<Plus className="h-4 w-4" />}
          >
            {t('uploadPhoto')}
          </Button>
        </div>
      </div>

      {/* Upload Section */}
      {showUpload && (
        <div className="bg-[var(--color-card-bg)] rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[var(--color-text)]">{t('uploadPhotos')}</h2>
            <button
              onClick={() => setShowUpload(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* File Selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
              {t('selectPhotos')} (Images and videos)
            </label>
            <input
              type="file"
              multiple
              accept="image/*,video/*"
              onChange={handleFileSelect}
              className="block w-full text-sm text-[var(--color-text-muted)] file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-orange-50 file:text-sky-700 hover:file:bg-sky-100"
            />
          </div>

          {/* Selected Files Preview */}
          {selectedFiles.length > 0 && (
            <div className="mb-4">
              <h3 className="text-sm font-medium text-[var(--color-text)] mb-2">Selected Files:</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {selectedFiles.map((upload, index) => (
                  <div key={index} className="relative group">
                    {upload.file.type.startsWith('video/') ? (
                      <video
                        src={upload.preview}
                        className="w-full h-32 object-cover rounded-lg"
                        controls
                      />
                    ) : (
                      <img
                        src={upload.preview}
                        alt="Preview"
                        className="w-full h-32 object-cover rounded-lg"
                      />
                    )}
                    <button
                      onClick={() => removeFile(index)}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                    <input
                      type="text"
                      placeholder={t('addCaption')}
                      value={captions[upload.file.name] || ''}
                      onChange={(e) => handleCaptionChange(upload.file.name, e.target.value)}
                      className="mt-2 w-full text-sm border border-[var(--color-border)] rounded-md px-2 py-1 text-[var(--color-text)] bg-[var(--color-card-bg)]"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => setShowUpload(false)}
            >
              {t('cancel')}
            </Button>
            <Button
              onClick={handleSubmit}
              loading={uploading}
              disabled={selectedFiles.length === 0}
            >
              {t('submitPhotos')}
            </Button>
          </div>
        </div>
      )}

      {/* My Submissions */}
      <div className="bg-[var(--color-card-bg)] rounded-lg shadow-sm p-4 sm:p-6">
        <h2 className="text-lg font-semibold text-[var(--color-text)] mb-4">{t('mySubmissions')}</h2>
        
        {myPhotos.length === 0 ? (
          <div className="text-center py-8">
            <Image className="h-12 w-12 text-[var(--color-text-muted)] mx-auto mb-4" />
            <p className="text-[var(--color-text-muted)]">{t('noPhotosYet')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {myPhotos.map((photo) => (
              <div key={photo.id} className="relative group mobile-touch-feedback">
                {(() => {
                  const isVideo = photo.storage_path?.toLowerCase().match(/\.(mp4|webm|ogg|mov)$/)
                  return isVideo ? (
                    <div className="relative w-full h-40 sm:h-48">
                      <video
                        src={signedUrls[photo.id] || photo.image_url}
                        className="w-full h-full object-cover rounded-lg cursor-pointer mobile-image"
                        onClick={() => setSelectedPhoto(photo)}
                        muted
                        preload="metadata"
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-black bg-opacity-50 rounded-full p-2">
                          <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <img
                      src={signedUrls[photo.id] || photo.image_url}
                      alt={photo.caption || 'Photo'}
                      className="w-full h-40 sm:h-48 object-cover rounded-lg cursor-pointer mobile-image"
                      onClick={() => setSelectedPhoto(photo)}
                      loading="lazy"
                    />
                  )
                })()}
                
                {/* Status Badge */}
                <div className="absolute top-2 left-2">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${PHOTO_STATUS_COLORS[photo.status]}`}>
                    {getStatusIcon(photo.status)}
                    <span className="ml-1 hidden sm:inline">{PHOTO_STATUS_LABELS[photo.status]}</span>
                    <span className="ml-1 sm:hidden">{PHOTO_STATUS_LABELS[photo.status].charAt(0)}</span>
                  </span>
                </div>

                {/* Actions */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="flex space-x-1">
                    <button
                      onClick={() => setSelectedPhoto(photo)}
                      className="bg-blue-500 text-white rounded-full p-1.5 sm:p-1 touch-target"
                    >
                      <Eye className="h-3 w-3 sm:h-3 sm:w-3" />
                    </button>
                    {photo.status === 'pending' && (
                      <button
                        onClick={() => setShowDeleteConfirm(photo.id)}
                        className="bg-red-500 text-white rounded-full p-1.5 sm:p-1 touch-target"
                      >
                        <Trash2 className="h-3 w-3 sm:h-3 sm:w-3" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Caption */}
                {photo.caption && (
                  <div className="mt-2">
                    <p className="text-sm text-[var(--color-text-muted)] truncate">{photo.caption}</p>
                  </div>
                )}

                {/* Date */}
                <div className="mt-1">
                  <p className="text-xs text-[var(--color-text-muted)]">{formatDate(photo.submitted_at)}</p>
                </div>
              </div>
            ))}
          </div>
         )}
       </div>

      {/* Public Gallery */}
      <div className="bg-[var(--color-card-bg)] rounded-lg shadow-sm p-4 sm:p-6">
        <h2 className="text-lg font-semibold text-[var(--color-text)] mb-4">{t('publicGallery')}</h2>
        
        {approvedPhotos.length === 0 ? (
          <div className="text-center py-8">
            <Image className="h-12 w-12 text-[var(--color-text-muted)] mx-auto mb-4" />
            <p className="text-[var(--color-text-muted)]">{t('noPhotosFound')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
            {approvedPhotos.map((photo) => (
              <div key={photo.id} className="relative group mobile-touch-feedback">
                {(() => {
                  const isVideo = photo.storage_path?.toLowerCase().match(/\.(mp4|webm|ogg|mov)$/)
                  return isVideo ? (
                    <div className="relative w-full h-40 sm:h-48">
                      <video
                        src={signedUrls[photo.id] || photo.image_url}
                        className="w-full h-full object-cover rounded-lg cursor-pointer mobile-image"
                        onClick={() => setSelectedPhoto(photo)}
                        muted
                        preload="metadata"
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-black bg-opacity-50 rounded-full p-2">
                          <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <img
                      src={signedUrls[photo.id] || photo.image_url}
                      alt={photo.caption || 'Photo'}
                      className="w-full h-40 sm:h-48 object-cover rounded-lg cursor-pointer mobile-image"
                      onClick={() => setSelectedPhoto(photo)}
                      loading="lazy"
                    />
                  )
                })()}
                
                {/* Actions */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => setSelectedPhoto(photo)}
                    className="bg-blue-500 text-white rounded-full p-1.5 sm:p-1 touch-target"
                  >
                    <Eye className="h-3 w-3 sm:h-3 sm:w-3" />
                  </button>
                </div>

                {/* Caption */}
                {photo.caption && (
                  <div className="mt-2">
                    <p className="text-sm text-[var(--color-text-muted)] truncate">{photo.caption}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Photo Modal */}
      {selectedPhoto && (
        <PhotoModal
          photo={selectedPhoto}
          signedUrl={signedUrls[selectedPhoto.id] || null}
          onClose={() => setSelectedPhoto(null)}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[var(--color-card-bg)] rounded-lg p-6 max-w-md w-full mx-4 border border-[var(--color-border)]">
            <h3 className="text-lg font-semibold text-[var(--color-text)] mb-4">{t('confirmDelete')}</h3>
            <p className="text-[var(--color-text-muted)] mb-6">{t('deletePhotoConfirm')}</p>
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(null)}
              >
                {t('cancelDelete')}
              </Button>
              <Button
                variant="danger"
                onClick={() => handleDeletePhoto(showDeleteConfirm!)}
              >
                {t('confirmDeletePhoto')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}