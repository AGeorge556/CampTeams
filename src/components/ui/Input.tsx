import React from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  icon?: React.ReactNode
  helperText?: string
}

export default function Input({
  label,
  error,
  icon,
  helperText,
  className = '',
  ...props
}: InputProps) {
  const inputClasses = `
    appearance-none block w-full pl-${icon ? '10' : '3'} pr-3 py-2 
    border rounded-md placeholder-gray-400 
    focus:outline-none focus:ring-2 focus:ring-offset-2 
    transition-colors
    ${error 
      ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
      : 'border-gray-300 focus:border-orange-500 focus:ring-orange-500'
    }
    ${className}
  `

  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <div className="h-5 w-5 text-gray-400">
              {icon}
            </div>
          </div>
        )}
        <input
          className={inputClasses}
          {...props}
        />
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
      {helperText && !error && (
        <p className="mt-1 text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  )
} 