import { Home, Trophy, QrCode, Camera, Swords } from 'lucide-react'
import { useGalleryVisibility } from '../hooks/useGalleryVisibility'
import { useOilExtractionVisibility } from '../hooks/useOilExtractionVisibility'
import { useProfile } from '../hooks/useProfile'

interface BottomNavProps {
  currentPage: string
  onPageChange: (page: string) => void
}

export default function BottomNav({ currentPage, onPageChange }: BottomNavProps) {
  const { galleryVisible } = useGalleryVisibility()
  const { oilExtractionVisible: bigGameVisible } = useOilExtractionVisibility()
  const { profile } = useProfile()

  const items = [
    { id: 'dashboard', icon: Home, label: 'Home' },
    { id: 'sports', icon: Trophy, label: 'Sports' },
    { id: 'attendance-checkin', icon: QrCode, label: 'Check In' },
    ...(profile?.is_admin || galleryVisible ? [{ id: 'gallery', icon: Camera, label: 'Gallery' }] : []),
    ...(profile?.is_admin || bigGameVisible ? [{ id: 'big-game', icon: Swords, label: 'Big Game' }] : []),
  ]

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[var(--color-bg)] border-t-2 border-[var(--color-border)]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="flex items-stretch h-16">
        {items.map(({ id, icon: Icon, label }) => {
          const isActive = currentPage === id
          return (
            <button
              key={id}
              onClick={() => onPageChange(id)}
              className={`relative flex-1 flex flex-col items-center justify-center gap-1 transition-colors ${
                isActive
                  ? 'text-[var(--color-primary)]'
                  : 'text-[var(--color-text-muted)]'
              }`}
              aria-label={label}
            >
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-[var(--color-primary)]" />
              )}
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-medium leading-none">{label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
