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
        max-w-[1440px] mx-auto px-4 sm:px-6 md:px-8 lg:px-10 xl:px-14
        pt-4 sm:pt-6 md:pt-8 pb-24 md:pb-8
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
        max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-14 py-3
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