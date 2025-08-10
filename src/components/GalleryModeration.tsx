import React, { useState, useEffect } from 'react'
import { Shield, CheckCircle, XCircle, Trash2, Download, Filter, BarChart3, Eye, Users, Image, Clock } from 'lucide-react'
import { useGalleryModeration } from '../hooks/useGalleryModeration'
import { useLanguage } from '../contexts/LanguageContext'
import { useToast } from './Toast'
import { GalleryPhotoWithInfo, PhotoStatus } from '../lib/types'
import { PHOTO_STATUS_LABELS, PHOTO_STATUS_COLORS } from '../lib/types'
import Button from './ui/Button'
import LoadingSpinner from './LoadingSpinner'
import PhotoModal from './PhotoModal'
import { useGallery } from '../hooks/useGallery'

export default function GalleryModeration() {
  const { t } = useLanguage()
  const { addToast } = useToast()
  const {
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
    getRejectedPhotos
  } = useGalleryModeration()

  const { getSignedUrl } = useGallery()

  const [selectedPhoto, setSelectedPhoto] = useState<GalleryPhotoWithInfo | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)

  // Signed URL state for previews
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({})

  // Fetch signed URLs for all displayed photos
  useEffect(() => {
    const fetchUrls = async () => {
      const urlMap: Record<string, string> = {}
      await Promise.all(
        photosWithInfo.map(async (photo) => {
          if (photo.storage_path) {
            const url = await getSignedUrl(photo.storage_path)
            if (url) urlMap[photo.id] = url
          }
        })
      )
      setSignedUrls(urlMap)
    }
    fetchUrls()
  }, [photosWithInfo])

  const handleApprove = async (photoId: string) => {
    const result = await approvePhoto(photoId)
    if (result.success) {
      addToast({
        type: 'success',
        title: t('success'),
        message: t('photoApproved')
      })
    } else {
      addToast({
        type: 'error',
        title: t('error'),
        message: result.error || t('moderationError')
      })
    }
  }

  const handleReject = async (photoId: string) => {
    const result = await rejectPhoto(photoId)
    if (result.success) {
      addToast({
        type: 'success',
        title: t('success'),
        message: t('photoRejected')
      })
    } else {
      addToast({
        type: 'error',
        title: t('error'),
        message: result.error || t('moderationError')
      })
    }
  }

  const handleDelete = async (photoId: string) => {
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

  const pendingPhotos = getPendingPhotos()
  const approvedPhotos = getApprovedPhotos()
  const rejectedPhotos = getRejectedPhotos()

  if (loading) {
    return <LoadingSpinner text="Loading moderation panel..." />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Shield className="h-8 w-8 text-purple-500" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{t('photoModeration')}</h1>
              <p className="text-gray-600">Review and moderate photo submissions</p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            icon={<Filter className="h-4 w-4" />}
          >
            {t('filterByStatus')}
          </Button>
        </div>
      </div>

      {/* Statistics */}
      {stats && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center space-x-2 mb-4">
            <BarChart3 className="h-5 w-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">{t('galleryStats')}</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{stats.total_photos}</div>
              <div className="text-sm text-gray-600">{t('totalPhotos')}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{stats.pending_photos}</div>
              <div className="text-sm text-gray-600">{t('pendingCount')}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.approved_photos}</div>
              <div className="text-sm text-gray-600">{t('approvedCount')}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{stats.rejected_photos}</div>
              <div className="text-sm text-gray-600">{t('rejectedCount')}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.total_users}</div>
              <div className="text-sm text-gray-600">{t('totalUsers')}</div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      {showFilters && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('filterByStatus')}</h3>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={statusFilter === null ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter(null)}
            >
              {t('allPhotos')}
            </Button>
            <Button
              variant={statusFilter === 'pending' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('pending')}
            >
              {t('pendingApproval')} ({pendingPhotos.length})
            </Button>
            <Button
              variant={statusFilter === 'approved' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('approved')}
            >
              {t('approvedPhotos')} ({approvedPhotos.length})
            </Button>
            <Button
              variant={statusFilter === 'rejected' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('rejected')}
            >
              {t('rejectedPhotos')} ({rejectedPhotos.length})
            </Button>
          </div>
        </div>
      )}

      {/* Photos Grid */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          {statusFilter ? PHOTO_STATUS_LABELS[statusFilter] : t('allPhotos')} ({photosWithInfo.length})
        </h2>

        {photosWithInfo.length === 0 ? (
          <div className="text-center py-8">
            <Image className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">{t('noPhotosFound')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {photosWithInfo.map((photo) => (
              <div key={photo.id} className="border border-gray-200 rounded-lg overflow-hidden">
                {/* Photo */}
                <div className="relative group">
                  <img
                    src={signedUrls[photo.id] || photo.image_url}
                    alt={photo.caption || 'Photo'}
                    className="w-full h-48 object-cover cursor-pointer"
                    onClick={() => setSelectedPhoto(photo)}
                  />
                  
                  {/* Status Badge */}
                  <div className="absolute top-2 left-2">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${PHOTO_STATUS_COLORS[photo.status]}`}>
                      {getStatusIcon(photo.status)}
                      <span className="ml-1">{PHOTO_STATUS_LABELS[photo.status]}</span>
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="flex space-x-1">
                      <button
                        onClick={() => setSelectedPhoto(photo)}
                        className="bg-blue-500 text-white rounded-full p-1"
                        title={t('photoPreview')}
                      >
                        <Eye className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => {
                          const link = document.createElement('a')
                          link.href = photo.image_url
                          link.download = `photo-${photo.id}.jpg`
                          document.body.appendChild(link)
                          link.click()
                          document.body.removeChild(link)
                        }}
                        className="bg-green-500 text-white rounded-full p-1"
                        title={t('downloadPhoto')}
                      >
                        <Download className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Details */}
                <div className="p-4">
                  {/* Caption */}
                  {photo.caption && (
                    <p className="text-sm text-gray-600 mb-2">{photo.caption}</p>
                  )}

                  {/* Metadata */}
                  <div className="space-y-1 text-xs text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Users className="h-3 w-3" />
                      <span>{photo.user_name}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <span>{photo.team_name}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <span>{formatDate(photo.submitted_at)}</span>
                    </div>
                    {photo.reviewer_name && (
                      <div className="flex items-center space-x-1">
                        <span>{t('reviewedBy')}: {photo.reviewer_name}</span>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-4 flex space-x-2">
                    {photo.status === 'pending' && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleApprove(photo.id)}
                          loading={moderating === photo.id}
                          disabled={moderating !== null}
                          className="flex-1"
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          {t('approvePhoto')}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReject(photo.id)}
                          loading={moderating === photo.id}
                          disabled={moderating !== null}
                          className="flex-1"
                        >
                          <XCircle className="h-3 w-3 mr-1" />
                          {t('rejectPhoto')}
                        </Button>
                      </>
                    )}
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => setShowDeleteConfirm(photo.id)}
                      disabled={moderating !== null}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
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
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('confirmDelete')}</h3>
            <p className="text-gray-600 mb-6">{t('deletePhotoConfirm')}</p>
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(null)}
              >
                {t('cancelDelete')}
              </Button>
              <Button
                variant="danger"
                onClick={() => handleDelete(showDeleteConfirm)}
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