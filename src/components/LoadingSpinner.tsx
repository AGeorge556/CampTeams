import React from 'react'
import { Loader2 } from 'lucide-react'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  text?: string
  fullScreen?: boolean
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
  xl: 'h-12 w-12'
}

export default function LoadingSpinner({ 
  size = 'md', 
  className = '', 
  text,
  fullScreen = false 
}: LoadingSpinnerProps) {
  const spinner = (
    <div className={`flex items-center justify-center ${className}`}>
      <Loader2 className={`animate-spin text-orange-500 ${sizeClasses[size]}`} />
      {text && (
        <span className="ml-2 text-sm text-gray-600">{text}</span>
      )}
    </div>
  )

  if (fullScreen) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className={`animate-spin text-orange-500 ${sizeClasses.xl} mx-auto mb-4`} />
          {text && (
            <p className="text-gray-600">{text}</p>
          )}
        </div>
      </div>
    )
  }

  return spinner
} 