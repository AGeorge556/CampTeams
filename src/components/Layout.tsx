import React from 'react'

interface LayoutProps {
  children: React.ReactNode
  className?: string
  mobileOptimized?: boolean
}

export default function Layout({ children, className = '', mobileOptimized = true }: LayoutProps) {
  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <main className={`
        max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 
        py-4 sm:py-6 md:py-8
        ${mobileOptimized ? 'mobile-safe-area' : ''}
        ${className}
      `}>
        {children}
      </main>
    </div>
  )
}

// Mobile-specific layout variants
export function MobileLayout({ children, className = '' }: { children: React.ReactNode, className?: string }) {
  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <main className={`
        max-w-full mx-auto px-4 py-4
        mobile-safe-area
        ${className}
      `}>
        {children}
      </main>
    </div>
  )
}

// Compact layout for mobile
export function CompactLayout({ children, className = '' }: { children: React.ReactNode, className?: string }) {
  return (
    <div className="min-h-screen bg-[var(--gradient-app-bg)]">
      <main className={`
        max-w-7xl mx-auto px-3 py-3
        mobile-safe-area
        ${className}
      `}>
        {children}
      </main>
    </div>
  )
}

// Full-width layout for mobile
export function FullWidthLayout({ children, className = '' }: { children: React.ReactNode, className?: string }) {
  return (
    <div className="min-h-screen bg-[var(--gradient-app-bg)]">
      <main className={`
        w-full px-0 py-0
        mobile-safe-area
        ${className}
      `}>
        {children}
      </main>
    </div>
  )
}