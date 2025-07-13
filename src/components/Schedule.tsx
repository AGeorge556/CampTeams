import React, { useState } from 'react'
import { Calendar, Clock, Users, Settings, BarChart3, Edit, Plus } from 'lucide-react'
import { useProfile } from '../hooks/useProfile'
import SessionManager from './SessionManager'
import AttendanceReports from './AttendanceReports'
import ScheduleFinalizer from './ScheduleFinalizer'
import ScheduleSessionManager from './ScheduleSessionManager'
import ScheduleEditor from './ScheduleEditor'

export default function Schedule() {
  const { profile } = useProfile()
  const [activeTab, setActiveTab] = useState<'sessions' | 'reports' | 'schedule' | 'finalize' | 'editor'>('sessions')

  if (!profile?.is_admin) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Calendar className="h-8 w-8 text-blue-500" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Schedule Management</h2>
              <p className="text-gray-600">Manage camp schedule, sessions, and attendance</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('sessions')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'sessions'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Clock className="h-4 w-4 inline mr-2" />
              Session Management
            </button>
            <button
              onClick={() => setActiveTab('editor')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'editor'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Edit className="h-4 w-4 inline mr-2" />
              Schedule Editor
            </button>
            <button
              onClick={() => setActiveTab('schedule')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'schedule'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Calendar className="h-4 w-4 inline mr-2" />
              Schedule Sessions
            </button>
            <button
              onClick={() => setActiveTab('finalize')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'finalize'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Settings className="h-4 w-4 inline mr-2" />
              Schedule Finalization
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'reports'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <BarChart3 className="h-4 w-4 inline mr-2" />
              Attendance Reports
            </button>
          </nav>
        </div>
      </div>

      {/* Content based on active tab */}
      {activeTab === 'sessions' && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Session Management</h3>
            <p className="text-sm text-gray-600">Create and manage individual camp sessions</p>
          </div>
          <SessionManager />
        </div>
      )}

      {activeTab === 'editor' && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Schedule Editor</h3>
            <p className="text-sm text-gray-600">Edit camp schedule activities, times, and locations</p>
          </div>
          <ScheduleEditor />
        </div>
      )}

      {activeTab === 'schedule' && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Schedule Sessions</h3>
            <p className="text-sm text-gray-600">Manage schedule items and create sessions from schedule</p>
          </div>
          <ScheduleSessionManager />
        </div>
      )}

      {activeTab === 'finalize' && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Schedule Finalization</h3>
            <p className="text-sm text-gray-600">Finalize the camp schedule and manage session delays</p>
          </div>
          <ScheduleFinalizer />
        </div>
      )}

      {activeTab === 'reports' && (
        <div className="bg-white rounded-lg shadow-sm p-6">
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