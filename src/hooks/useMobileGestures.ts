import { useEffect, useRef, useState, useCallback } from 'react'

interface SwipeConfig {
  minSwipeDistance?: number
  maxSwipeTime?: number
}

interface SwipeCallbacks {
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  onSwipeUp?: () => void
  onSwipeDown?: () => void
}

interface TouchPoint {
  x: number
  y: number
  time: number
}

export function useSwipeGesture(
  elementRef: React.RefObject<HTMLElement>,
  callbacks: SwipeCallbacks,
  config: SwipeConfig = {}
) {
  const { minSwipeDistance = 50, maxSwipeTime = 300 } = config
  const touchStart = useRef<TouchPoint | null>(null)
  const touchEnd = useRef<TouchPoint | null>(null)

  const onTouchStart = useCallback((e: TouchEvent) => {
    touchEnd.current = null
    touchStart.current = {
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
      time: Date.now()
    }
  }, [])

  const onTouchMove = useCallback((e: TouchEvent) => {
    touchEnd.current = {
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
      time: Date.now()
    }
  }, [])

  const onTouchEnd = useCallback(() => {
    if (!touchStart.current || !touchEnd.current) return

    const distanceX = touchStart.current.x - touchEnd.current.x
    const distanceY = touchStart.current.y - touchEnd.current.y
    const timeDiff = touchEnd.current.time - touchStart.current.time

    const isSwipe = timeDiff < maxSwipeTime
    const isLongEnough = Math.abs(distanceX) > minSwipeDistance || Math.abs(distanceY) > minSwipeDistance

    if (isSwipe && isLongEnough) {
      const isHorizontalSwipe = Math.abs(distanceX) > Math.abs(distanceY)

      if (isHorizontalSwipe) {
        if (distanceX > 0 && callbacks.onSwipeLeft) {
          callbacks.onSwipeLeft()
        } else if (distanceX < 0 && callbacks.onSwipeRight) {
          callbacks.onSwipeRight()
        }
      } else {
        if (distanceY > 0 && callbacks.onSwipeUp) {
          callbacks.onSwipeUp()
        } else if (distanceY < 0 && callbacks.onSwipeDown) {
          callbacks.onSwipeDown()
        }
      }
    }
  }, [callbacks, minSwipeDistance, maxSwipeTime])

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    element.addEventListener('touchstart', onTouchStart, { passive: true })
    element.addEventListener('touchmove', onTouchMove, { passive: true })
    element.addEventListener('touchend', onTouchEnd, { passive: true })

    return () => {
      element.removeEventListener('touchstart', onTouchStart)
      element.removeEventListener('touchmove', onTouchMove)
      element.removeEventListener('touchend', onTouchEnd)
    }
  }, [elementRef, onTouchStart, onTouchMove, onTouchEnd])
}

export function usePullToRefresh(
  onRefresh: () => Promise<void>,
  threshold: number = 80
) {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [pullDistance, setPullDistance] = useState(0)
  const startY = useRef<number>(0)
  const currentY = useRef<number>(0)
  const elementRef = useRef<HTMLDivElement>(null)

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (elementRef.current?.scrollTop === 0) {
      startY.current = e.touches[0].clientY
    }
  }, [])

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (elementRef.current?.scrollTop === 0 && startY.current > 0) {
      currentY.current = e.touches[0].clientY
      const distance = Math.max(0, currentY.current - startY.current)
      const pullDistance = Math.min(distance * 0.5, threshold * 2)
      setPullDistance(pullDistance)
    }
  }, [threshold])

  const handleTouchEnd = useCallback(async () => {
    if (pullDistance >= threshold && !isRefreshing) {
      setIsRefreshing(true)
      setPullDistance(0)
      try {
        await onRefresh()
      } finally {
        setIsRefreshing(false)
      }
    } else {
      setPullDistance(0)
    }
    startY.current = 0
    currentY.current = 0
  }, [pullDistance, threshold, isRefreshing, onRefresh])

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    element.addEventListener('touchstart', handleTouchStart, { passive: true })
    element.addEventListener('touchmove', handleTouchMove, { passive: false })
    element.addEventListener('touchend', handleTouchEnd, { passive: true })

    return () => {
      element.removeEventListener('touchstart', handleTouchStart)
      element.removeEventListener('touchmove', handleTouchMove)
      element.removeEventListener('touchend', handleTouchEnd)
    }
  }, [handleTouchStart, handleTouchMove, handleTouchEnd])

  return {
    elementRef,
    isRefreshing,
    pullDistance,
    shouldShowRefreshIndicator: pullDistance > 0
  }
}

export function useMobileScroll() {
  const [isScrolling, setIsScrolling] = useState(false)
  const scrollTimeout = useRef<NodeJS.Timeout>()

  const handleScroll = useCallback(() => {
    setIsScrolling(true)
    
    if (scrollTimeout.current) {
      clearTimeout(scrollTimeout.current)
    }
    
    scrollTimeout.current = setTimeout(() => {
      setIsScrolling(false)
    }, 150)
  }, [])

  useEffect(() => {
    return () => {
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current)
      }
    }
  }, [])

  return {
    isScrolling,
    handleScroll
  }
}

export function useMobileOrientation() {
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait')

  useEffect(() => {
    const updateOrientation = () => {
      setOrientation(window.innerHeight > window.innerWidth ? 'portrait' : 'landscape')
    }

    updateOrientation()
    window.addEventListener('resize', updateOrientation)
    window.addEventListener('orientationchange', updateOrientation)

    return () => {
      window.removeEventListener('resize', updateOrientation)
      window.removeEventListener('orientationchange', updateOrientation)
    }
  }, [])

  return orientation
}

export function useMobileKeyboard() {
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false)
  const initialViewportHeight = useRef<number>(window.innerHeight)

  useEffect(() => {
    const handleResize = () => {
      const currentHeight = window.innerHeight
      const heightDifference = initialViewportHeight.current - currentHeight
      
      // If height difference is significant, keyboard is likely open
      setIsKeyboardOpen(heightDifference > 150)
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return isKeyboardOpen
}
