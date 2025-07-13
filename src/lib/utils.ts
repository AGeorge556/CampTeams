import { GRADE_NAMES, MAX_PLAYERS_PER_GRADE, GRADES } from './constants'

export const getGradeDisplayName = (grade: number): string => {
  return GRADE_NAMES[grade as keyof typeof GRADE_NAMES] || `Grade ${grade}`
}

export const getGradeDisplayWithNumber = (grade: number): string => {
  return `${getGradeDisplayName(grade)} (${grade})`
}

// Re-export constants for backward compatibility
export { MAX_PLAYERS_PER_GRADE, GRADES }

// Validation utilities
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export const validateName = (name: string): boolean => {
  return name.trim().length >= 2 && name.trim().length <= 50
}

export const validatePassword = (password: string): boolean => {
  return password.length >= 8 && password.length <= 128
}

// Formatting utilities
export const formatDate = (date: string | Date): string => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

export const formatTime = (time: string): string => {
  const [hours, minutes] = time.split(':')
  const hour = parseInt(hours)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour
  return `${displayHour}:${minutes} ${ampm}`
}

// Team utilities
export const getTeamColorClass = (team: string): string => {
  const teamColors = {
    red: 'bg-red-500',
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    yellow: 'bg-yellow-500'
  }
  return teamColors[team as keyof typeof teamColors] || 'bg-gray-500'
}

export const getTeamTextColor = (team: string): string => {
  const textColors = {
    red: 'text-red-600',
    blue: 'text-blue-600',
    green: 'text-green-600',
    yellow: 'text-yellow-600'
  }
  return textColors[team as keyof typeof textColors] || 'text-gray-600'
}

// Array utilities
export const chunkArray = <T>(array: T[], size: number): T[][] => {
  const chunks: T[][] = []
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size))
  }
  return chunks
}

export const uniqueArray = <T>(array: T[]): T[] => {
  return [...new Set(array)]
}

// Debounce utility
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func(...args), delay)
  }
}

// Local storage utilities
export const setLocalStorage = (key: string, value: any): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (error) {
    console.error('Error setting localStorage:', error)
  }
}

export const getLocalStorage = <T>(key: string, defaultValue: T): T => {
  try {
    const item = localStorage.getItem(key)
    return item ? JSON.parse(item) : defaultValue
  } catch (error) {
    console.error('Error getting localStorage:', error)
    return defaultValue
  }
}

// Error handling utilities
export const handleError = (error: any, fallbackMessage: string = 'An error occurred'): string => {
  if (typeof error === 'string') {
    return error
  }
  if (error?.message) {
    return error.message
  }
  return fallbackMessage
}

// Performance utilities
export const memoize = <T extends (...args: any[]) => any>(
  func: T,
  getKey: (...args: Parameters<T>) => string
): T => {
  const cache = new Map<string, ReturnType<T>>()
  
  return ((...args: Parameters<T>): ReturnType<T> => {
    const key = getKey(...args)
    if (cache.has(key)) {
      return cache.get(key)!
    }
    const result = func(...args)
    cache.set(key, result)
    return result
  }) as T
} 