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
  primary: 'bg-[var(--color-primary)] hover:opacity-90 text-[var(--color-primary-contrast)] border-transparent shadow-[var(--neon-glow)] hover:shadow-none transition-all duration-300',
  secondary: 'bg-[var(--color-accent)] hover:opacity-90 text-white border-transparent shadow-[var(--neon-glow)] hover:shadow-none transition-all duration-300',
  outline: 'bg-transparent hover:bg-[var(--color-bg-muted)] text-[var(--color-text)] border-[var(--color-border)] hover:border-[var(--color-primary)] hover:shadow-[var(--neon-glow)] transition-all duration-300',
  ghost: 'bg-transparent hover:bg-[var(--color-bg-muted)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] border-transparent transition-colors duration-300',
  danger: 'bg-[var(--color-danger)] hover:opacity-90 text-white border-transparent shadow-[var(--neon-glow)] hover:shadow-none transition-all duration-300',
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