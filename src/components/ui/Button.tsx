import React from 'react'
import { Loader2 } from 'lucide-react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'mobile-primary' | 'mobile-secondary' | 'mobile-outline'
  size?: 'sm' | 'md' | 'lg' | 'mobile'
  loading?: boolean
  icon?: React.ReactNode
  children: React.ReactNode
  fullWidth?: boolean
  mobileOptimized?: boolean
}

const variants = {
  primary: 'bg-orange-600 hover:bg-orange-700 text-white border-transparent focus:ring-orange-500',
  secondary: 'bg-gray-600 hover:bg-gray-700 text-white border-transparent focus:ring-gray-500',
  outline: 'bg-transparent hover:bg-gray-50 text-gray-700 border-gray-300 focus:ring-orange-500',
  ghost: 'bg-transparent hover:bg-gray-100 text-gray-700 border-transparent focus:ring-orange-500',
  danger: 'bg-red-600 hover:bg-red-700 text-white border-transparent focus:ring-red-500',
  'mobile-primary': 'btn-mobile-primary',
  'mobile-secondary': 'btn-mobile-secondary',
  'mobile-outline': 'btn-mobile-outline'
}

const sizes = {
  sm: 'px-3 py-1.5 text-sm min-h-[36px]',
  md: 'px-4 py-2 text-sm min-h-[40px]',
  lg: 'px-6 py-3 text-base min-h-[48px]',
  mobile: 'px-4 py-3 text-base min-h-[48px] min-w-[48px]'
}

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  children,
  disabled,
  className = '',
  fullWidth = false,
  mobileOptimized = false,
  ...props
}: ButtonProps) {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-md border focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed mobile-touch-feedback'
  
  // Use mobile-optimized classes if specified or if using mobile variants
  const isMobileVariant = variant.startsWith('mobile-')
  const shouldUseMobileClasses = mobileOptimized || isMobileVariant
  
  const buttonClasses = shouldUseMobileClasses 
    ? `${variants[variant]} ${sizes.mobile} ${fullWidth ? 'w-full' : ''} ${className}`
    : `${baseClasses} ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}`
  
  return (
    <button
      className={buttonClasses}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <Loader2 className="animate-spin h-4 w-4 mr-2" />
      )}
      {!loading && icon && (
        <span className="mr-2">{icon}</span>
      )}
      {children}
    </button>
  )
} 