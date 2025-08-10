import React, { useState, useRef, useEffect } from 'react'
import { Loader2 } from 'lucide-react'

interface MobileImageProps {
  src: string
  alt: string
  className?: string
  aspectRatio?: 'square' | '4:3' | '16:9' | 'auto'
  loading?: 'lazy' | 'eager'
  onLoad?: () => void
  onError?: () => void
  onClick?: () => void
  placeholder?: string
}

export default function MobileImage({
  src,
  alt,
  className = '',
  aspectRatio = 'auto',
  loading = 'lazy',
  onLoad,
  onError,
  onClick,
  placeholder
}: MobileImageProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)

  const aspectRatioClasses = {
    square: 'aspect-square',
    '4:3': 'aspect-[4/3]',
    '16:9': 'aspect-[16/9]',
    auto: ''
  }

  useEffect(() => {
    if (loading === 'lazy' && imgRef.current) {
      observerRef.current = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting && imgRef.current) {
              imgRef.current.src = src
              observerRef.current?.unobserve(entry.target)
            }
          })
        },
        {
          rootMargin: '50px 0px',
          threshold: 0.1
        }
      )

      observerRef.current.observe(imgRef.current)
    } else if (loading === 'eager' && imgRef.current) {
      imgRef.current.src = src
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [src, loading])

  const handleLoad = () => {
    setIsLoading(false)
    setIsLoaded(true)
    onLoad?.()
  }

  const handleError = () => {
    setIsLoading(false)
    setHasError(true)
    onError?.()
  }

  return (
    <div 
      className={`
        relative overflow-hidden rounded-lg bg-gray-100
        ${aspectRatioClasses[aspectRatio]}
        ${onClick ? 'cursor-pointer mobile-touch-feedback' : ''}
        ${className}
      `}
      onClick={onClick}
    >
      {/* Loading State */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      )}

      {/* Error State */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="text-center text-gray-500">
            <div className="text-sm font-medium">Failed to load image</div>
            {placeholder && (
              <div className="text-xs mt-1">{placeholder}</div>
            )}
          </div>
        </div>
      )}

      {/* Image */}
      <img
        ref={imgRef}
        alt={alt}
        className={`
          w-full h-full object-cover transition-opacity duration-300
          ${isLoaded ? 'opacity-100' : 'opacity-0'}
          ${aspectRatio === 'auto' ? 'aspect-auto' : ''}
        `}
        onLoad={handleLoad}
        onError={handleError}
        loading={loading}
        decoding="async"
      />

      {/* Placeholder for lazy loading */}
      {loading === 'lazy' && !isLoaded && !hasError && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}
    </div>
  )
}

// Optimized image component for gallery use
export function GalleryImage({
  src,
  alt,
  onClick,
  className = ''
}: {
  src: string
  alt: string
  onClick?: () => void
  className?: string
}) {
  return (
    <MobileImage
      src={src}
      alt={alt}
      aspectRatio="square"
      loading="lazy"
      onClick={onClick}
      className={`h-40 sm:h-48 ${className}`}
    />
  )
}

// Optimized image component for profile pictures
export function ProfileImage({
  src,
  alt,
  size = 'md',
  className = ''
}: {
  src: string
  alt: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  }

  return (
    <MobileImage
      src={src}
      alt={alt}
      aspectRatio="square"
      loading="eager"
      className={`${sizeClasses[size]} rounded-full ${className}`}
    />
  )
}

// Optimized image component for hero/banner images
export function HeroImage({
  src,
  alt,
  className = ''
}: {
  src: string
  alt: string
  className?: string
}) {
  return (
    <MobileImage
      src={src}
      alt={alt}
      aspectRatio="16:9"
      loading="eager"
      className={`w-full ${className}`}
    />
  )
}
