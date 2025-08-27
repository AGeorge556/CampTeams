import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react'

export interface Toast {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

interface ToastContextType {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
  clearToasts: () => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

interface ToastProviderProps {
  children: ReactNode
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newToast: Toast = {
      ...toast,
      id,
      duration: toast.duration ?? 5000
    }

    setToasts(prev => [...prev, newToast])

    // Auto-remove toast after duration
    if (newToast.duration !== 0) {
      setTimeout(() => {
        removeToast(id)
      }, newToast.duration)
    }
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  const clearToasts = useCallback(() => {
    setToasts([])
  }, [])

  const getIcon = (type: Toast['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      case 'info':
        return <Info className="h-5 w-5 text-blue-500" />
    }
  }

  const getBackgroundColor = (type: Toast['type']) => {
    switch (type) {
      case 'success':
        return 'bg-[var(--toast-success-bg)] border-[var(--toast-success-border)]'
      case 'error':
        return 'bg-[var(--toast-error-bg)] border-[var(--toast-error-border)]'
      case 'warning':
        return 'bg-[var(--toast-warning-bg)] border-[var(--toast-warning-border)]'
      case 'info':
        return 'bg-[var(--toast-info-bg)] border-[var(--toast-info-border)]'
    }
  }

  const getTextColor = (type: Toast['type']) => {
    switch (type) {
      case 'success':
        return 'text-[var(--toast-success-text)]'
      case 'error':
        return 'text-[var(--toast-error-text)]'
      case 'warning':
        return 'text-[var(--toast-warning-text)]'
      case 'info':
        return 'text-[var(--toast-info-text)]'
    }
  }

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, clearToasts }}>
      {children}
      
      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`
              ${getBackgroundColor(toast.type)}
              border rounded-lg shadow-lg p-4 transform transition-all duration-300 ease-out
              animate-in slide-in-from-right-4 fade-in
            `}
          >
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 mt-0.5">
                {getIcon(toast.type)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className={`text-sm font-medium ${getTextColor(toast.type)}`}>
                    {toast.title}
                  </h4>
                  <button
                    onClick={() => removeToast(toast.id)}
                    className="flex-shrink-0 ml-2 text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                
                {toast.message && (
                  <p className={`mt-1 text-sm ${getTextColor(toast.type)}`}>
                    {toast.message}
                  </p>
                )}
                
                {toast.action && (
                  <button
                    onClick={toast.action.onClick}
                    className="mt-2 text-sm font-medium text-[var(--color-primary)] hover:text-[var(--color-accent)] transition-colors"
                  >
                    {toast.action.label}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
} 