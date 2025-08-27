import React from 'react'

interface LoadingSpinnerProps {
  fullScreen?: boolean
  text?: string
  size?: 'sm' | 'md' | 'lg'
  type?: 'spinner' | 'skeleton' | 'dots'
}

interface SkeletonProps {
  className?: string
  lines?: number
  height?: string
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '', lines = 1, height = 'h-4' }) => {
  return (
    <div className={`animate-pulse ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={`bg-[var(--color-bg-muted)] rounded ${height} mb-2 ${i === lines - 1 ? 'w-3/4' : 'w-full'} transition-all duration-300`}
        />
      ))}
    </div>
  )
}

export const SkeletonCard: React.FC = () => (
  <div className="bg-[var(--color-card-bg)] rounded-lg shadow-[var(--shadow-md)] p-6 animate-pulse transition-all duration-300 border border-[var(--color-border)]">
    <div className="flex items-center space-x-4 mb-4">
      <div className="w-12 h-12 bg-[var(--color-bg-muted)] rounded-full"></div>
      <div className="flex-1">
        <div className="h-4 bg-[var(--color-bg-muted)] rounded w-3/4 mb-2"></div>
        <div className="h-3 bg-[var(--color-bg-muted)] rounded w-1/2"></div>
      </div>
    </div>
    <div className="space-y-3">
      <div className="h-4 bg-[var(--color-bg-muted)] rounded"></div>
      <div className="h-4 bg-[var(--color-bg-muted)] rounded w-5/6"></div>
      <div className="h-4 bg-[var(--color-bg-muted)] rounded w-4/6"></div>
    </div>
  </div>
)

export default function LoadingSpinner({ 
  fullScreen = false, 
  text = 'Loading...', 
  size = 'md',
  type = 'spinner'
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  }

  const renderLoader = () => {
    switch (type) {
      case 'dots':
        return (
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-[var(--color-primary)] rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-[var(--color-primary)] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-[var(--color-primary)] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
        )
      case 'skeleton':
        return <Skeleton lines={3} />
      default:
        return (
          <div className={`animate-spin rounded-full border-2 border-[var(--color-border)] border-t-orange-500 ${sizeClasses[size]}`}></div>
        )
    }
  }

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-[var(--color-bg)] bg-opacity-90 flex items-center justify-center z-50">
        <div className="text-center">
          {renderLoader()}
          {text && (
            <p className="mt-4 text-[var(--color-text-muted)] font-medium">{text}</p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center p-4">
      <div className="text-center">
        {renderLoader()}
        {text && (
          <p className="mt-2 text-[var(--color-text-muted)] text-sm">{text}</p>
        )}
      </div>
    </div>
  )
}