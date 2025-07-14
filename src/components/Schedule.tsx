import React, { useState } from 'react'
import { Calendar, Clock, Users, Settings, BarChart3, Edit, Plus, Menu, X } from 'lucide-react'
import { useProfile } from '../hooks/useProfile'
import { useLanguage } from '../contexts/LanguageContext'
import SessionManager from './SessionManager'
import AttendanceReports from './AttendanceReports'
import ScheduleFinalizer from './ScheduleFinalizer'
import ScheduleSessionManager from './ScheduleSessionManager'
import ScheduleEditor from './ScheduleEditor'

export default function Schedule() {
  const { profile } = useProfile()
  const { t } = useLanguage()
  const [activeTab, setActiveTab] = useState<'sessions' | 'reports' | 'schedule' | 'finalize' | 'editor'>('sessions')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  if (!profile?.is_admin) {
    return null
  }

  const tabs = [
    {
      id: 'sessions' as const,
      name: 'Session Management',
      icon: Clock,
      description: 'Create and manage individual camp sessions'
    },
    {
      id: 'editor' as const,
      name: 'Schedule Editor',
      icon: Edit,
      description: 'Edit camp schedule activities, times, and locations'
    },
    {
      id: 'schedule' as const,
      name: 'Schedule Sessions',
      icon: Calendar,
      description: 'Manage schedule items and create sessions from schedule'
    },
    {
      id: 'finalize' as const,
      name: 'Schedule Finalization',
      icon: Settings,
      description: 'Finalize the camp schedule and manage session delays'
    },
    {
      id: 'reports' as const,
      name: 'Attendance Reports',
      icon: BarChart3,
      description: 'View attendance statistics and reports'
    }
  ]

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-4 md:p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 md:space-x-3">
            <Calendar className="h-6 w-6 md:h-8 md:w-8 text-blue-500" />
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-gray-900">Schedule Management</h2>
              <p className="text-sm md:text-base text-gray-600">Manage camp schedule, sessions, and attendance</p>
            </div>
          </div>
          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow-sm">
        {/* Desktop Navigation */}
        <div className="hidden md:block border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4 inline mr-2" />
                  {tab.name}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Mobile Navigation */}
        <div className={`md:hidden ${mobileMenuOpen ? 'block' : 'hidden'}`}>
          <div className="px-4 py-2 space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id)
                    setMobileMenuOpen(false)
                  }}
                  className={`w-full text-left px-4 py-3 rounded-lg font-medium text-sm transition-colors duration-200 ${
                    activeTab === tab.id
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center">
                    <Icon className="h-5 w-5 mr-3" />
                    <div>
                      <div className="font-medium">{tab.name}</div>
                      <div className="text-xs text-gray-500">{tab.description}</div>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Mobile Tab Indicator */}
        <div className="md:hidden px-4 py-3 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {(() => {
                const activeTabData = tabs.find(tab => tab.id === activeTab)
                const Icon = activeTabData?.icon || Clock
                return (
                  <>
                    <Icon className="h-5 w-5 mr-2 text-blue-500" />
                    <span className="font-medium text-gray-900">{activeTabData?.name}</span>
                  </>
                )
              })()}
            </div>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-gray-400 hover:text-gray-500"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Content based on active tab */}
      {activeTab === 'sessions' && (
        <div className="bg-white rounded-lg shadow-sm p-4 md:p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Session Management</h3>
            <p className="text-sm text-gray-600">Create and manage individual camp sessions</p>
          </div>
          <SessionManager />
        </div>
      )}

      {activeTab === 'editor' && (
        <div className="bg-white rounded-lg shadow-sm p-4 md:p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Schedule Editor</h3>
            <p className="text-sm text-gray-600">Edit camp schedule activities, times, and locations</p>
          </div>
          <ScheduleEditor />
        </div>
      )}

      {activeTab === 'schedule' && (
        <div className="bg-white rounded-lg shadow-sm p-4 md:p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Schedule Sessions</h3>
            <p className="text-sm text-gray-600">Manage schedule items and create sessions from schedule</p>
          </div>
          <ScheduleSessionManager />
        </div>
      )}

      {activeTab === 'finalize' && (
        <div className="bg-white rounded-lg shadow-sm p-4 md:p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Schedule Finalization</h3>
            <p className="text-sm text-gray-600">Finalize the camp schedule and manage session delays</p>
          </div>
          <ScheduleFinalizer />
        </div>
      )}

      {activeTab === 'reports' && (
        <div className="bg-white rounded-lg shadow-sm p-4 md:p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Attendance Reports</h3>
            <p className="text-sm text-gray-600">View attendance statistics and reports</p>
          </div>
          <AttendanceReports />
        </div>
      )}
    </div>
  )
} 