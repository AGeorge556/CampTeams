// Application Constants
export const APP_NAME = 'CampTeams'
export const APP_VERSION = '1.0.0'

// Camp Configuration
export const CAMP_START_DATE = '2025-08-28T00:00:00'
export const MAX_TEAM_SIZE = 50
export const MAX_SWITCHES_PER_USER = 3
export const MAX_PLAYERS_PER_GRADE = 4


// Grade Configuration
export const GRADES = [7, 8, 9, 10, 11, 12] as const
export const GRADE_NAMES = {
  7: '1st Preparatory',
  8: '2nd Preparatory', 
  9: '3rd Preparatory',
  10: '1st Secondary',
  11: '2nd Secondary',
  12: '3rd Secondary'
} as const

// Team Configuration
export const TEAM_COLORS = ['red', 'blue', 'green', 'yellow'] as const
export const TEAM_NAMES = {
  red: 'Red',
  blue: 'Blue',
  green: 'Green',
  yellow: 'Yellow'
} as const

// Sports Configuration
export const AVAILABLE_SPORTS = [
  { id: 'soccer', name: 'Soccer', icon: '⚽' },
  { id: 'dodgeball', name: 'Dodgeball', icon: '🏐' },
  { id: 'chairball', name: 'Chairball', icon: '🏀' }
] as const

// Schedule Configuration
export const CAMP_DAYS = 4
export const TIME_SLOTS = [
  '07:00', '07:30', '08:00', '08:30', '09:00', '09:30',
  '10:00', '10:30', '11:00', '11:30', '12:00', '12:30',
  '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30', '18:00', '18:30',
  '19:00', '19:30', '20:00', '20:30', '21:00', '21:30'
] as const

// Validation Rules
export const VALIDATION_RULES = {
  name: {
    minLength: 2,
    maxLength: 50
  },
  email: {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },
  password: {
    minLength: 8,
    maxLength: 128
  },
  friendName: {
    minLength: 2,
    maxLength: 30
  }
} as const

// UI Configuration
export const TOAST_DURATION = 5000 // 5 seconds
export const DEBOUNCE_DELAY = 300 // 300ms
export const REFRESH_DELAY = 500 // 500ms

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  VALIDATION_ERROR: 'Please fix the errors in the form.',
  AUTH_ERROR: 'Authentication failed. Please try again.',
  TEAM_SWITCH_ERROR: 'Unable to switch teams. Please try again.',
  PROFILE_UPDATE_ERROR: 'Unable to update profile. Please try again.',
  SCHEDULE_UPDATE_ERROR: 'Unable to update schedule. Please try again.',
  SPORTS_UPDATE_ERROR: 'Unable to update sports preferences. Please try again.'
} as const

// Success Messages
export const SUCCESS_MESSAGES = {
  PROFILE_CREATED: 'Profile created successfully!',
  TEAM_SWITCHED: 'Team switched successfully!',
  PROFILE_UPDATED: 'Profile updated successfully!',
  SCHEDULE_UPDATED: 'Schedule updated successfully!',
  SPORTS_UPDATED: 'Sports preferences updated successfully!'
} as const 