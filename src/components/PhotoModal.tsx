import React, { useEffect } from 'react'
import { X, ChevronLeft, ChevronRight, Download, User, Calendar, MessageCircle } from 'lucide-react'
import { GalleryPhoto } from '../lib/types'
import { useLanguage } from '../contexts/LanguageContext'

interface PhotoModalProps {
  photo: GalleryPhoto
  signedUrl: string | null
  onClose: () => void
  onNext?: () => void
  onPrevious?: () => void
  hasNext?: boolean
  hasPrevious?: boolean
}

export default function PhotoModal({ 
  photo, 
  signedUrl,
  onClose, 
  onNext, 
  onPrevious, 
  hasNext = false, 
  hasPrevious = false 
}: PhotoModalProps) {
  const { t } = useLanguage()

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'Escape':
          onClose()
          break
        case 'ArrowRight':
          if (hasNext && onNext) {
            onNext()
          }
          break
        case 'ArrowLeft':
          if (hasPrevious && onPrevious) {
            onPrevious()
          }
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose, onNext, onPrevious, hasNext, hasPrevious])

  const handleDownload = () => {
    if (!signedUrl) return
    const link = document.createElement('a')
    link.href = signedUrl
    link.download = `photo-${photo.id}.jpg`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-2 sm:p-4 mobile-safe-area">
      <div className="relative max-w-4xl max-h-full w-full h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-3 sm:p-4 bg-black bg-opacity-50 text-white">
          <h2 className="text-base sm:text-lg font-semibold">{t('photoPreview')}</h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleDownload}
              className="p-2 sm:p-2.5 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors touch-target"
              title={t('downloadPhoto')}
            >
              <Download className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 sm:p-2.5 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors touch-target"
              title={t('closePreview')}
            >
              <X className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          </div>
        </div>

        {/* Image Container */}
        <div className="flex-1 flex items-center justify-center relative">
          {/* Navigation Buttons */}
          {hasPrevious && onPrevious && (
            <button
              onClick={onPrevious}
              className="absolute left-2 sm:left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2.5 sm:p-3 rounded-full hover:bg-opacity-70 transition-colors z-10 touch-target"
              title={t('previousPhoto')}
            >
              <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>
          )}

          {hasNext && onNext && (
            <button
              onClick={onNext}
              className="absolute right-2 sm:right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2.5 sm:p-3 rounded-full hover:bg-opacity-70 transition-colors z-10 touch-target"
              title={t('nextPhoto')}
            >
              <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>
          )}

          {/* Image */}
          {signedUrl && (
            <img
              src={signedUrl}
              alt={photo.caption || 'Photo'}
              className="max-w-full max-h-full object-contain mobile-image"
            />
          )}
        </div>

        {/* Footer with Details */}
        <div className="p-3 sm:p-4 bg-black bg-opacity-50 text-white">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {/* Left side - Caption */}
            {photo.caption && (
              <div className="flex items-start space-x-2">
                <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs sm:text-sm font-medium">{t('description')}</p>
                  <p className="text-xs sm:text-sm text-gray-300">{photo.caption}</p>
                </div>
              </div>
            )}

            {/* Right side - Metadata */}
            <div className="flex flex-col space-y-2">
              <div className="flex items-center space-x-2">
                <User className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="text-xs sm:text-sm text-gray-300">{t('uploadedBy')}: {photo.user_id}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="text-xs sm:text-sm text-gray-300">{t('submittedOn')}: {formatDate(photo.submitted_at)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 