import React from 'react'
import { Moon, Sun } from 'lucide-react'
import { useDarkMode } from '../contexts/DarkModeContext'

export default function DarkModeToggle() {
  const { isDarkMode, toggleDarkMode } = useDarkMode()

  return (
    <button
      onClick={toggleDarkMode}
      aria-label="Toggle dark mode"
      className="
        p-2 rounded-lg transition-all duration-300 ease-in-out
        bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700
        text-gray-700 dark:text-gray-300
        border border-gray-200 dark:border-gray-600
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800
        transform hover:scale-105 active:scale-95
      "
    >
      {isDarkMode ? (
        <Sun className="h-5 w-5 transition-transform duration-300 rotate-0" />
      ) : (
        <Moon className="h-5 w-5 transition-transform duration-300 rotate-0" />
      )}
    </button>
  )
}
