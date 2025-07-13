import React from 'react'
import { Loader2 } from 'lucide-react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  icon?: React.ReactNode
  children: React.ReactNode
}

const variants = {
  primary: 'bg-orange-600 hover:bg-orange-700 text-white border-transparent focus:ring-orange-500',
  secondary: 'bg-gray-600 hover:bg-gray-700 text-white border-transparent focus:ring-gray-500',
  outline: 'bg-transparent hover:bg-gray-50 text-gray-700 border-gray-300 focus:ring-orange-500',
  ghost: 'bg-transparent hover:bg-gray-100 text-gray-700 border-transparent focus:ring-orange-500',
  danger: 'bg-red-600 hover:bg-red-700 text-white border-transparent focus:ring-red-500'
}

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base'
}

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  children,
  disabled,
  className = '',
  ...props
}: ButtonProps) {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-md border focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
  
  return (
    <button
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
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