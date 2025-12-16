import React, { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, QrCode, Users, Clock, Calendar, CalendarDays, CheckCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useProfile } from '../hooks/useProfile'
import { useToast } from './Toast'
import { CampSession, SessionType, SESSION_TYPE_LABELS, SESSION_TYPE_COLORS } from '../lib/types'
import QRCode from './QRCode'

interface SessionManagerProps {
  onSessionCreated?: (session: CampSession) => void
}

export default function SessionManager({ onSessionCreated }: SessionManagerProps) {
  const { profile } = useProfile()
  const { addToast } = useToast()
  const [sessions, setSessions] = useState<CampSession[]>([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingSession, setEditingSession] = useState<CampSession | null>(null)
  const [selectedSession, setSelectedSession] = useState<CampSession | null>(null)
  const [showQR, setShowQR] = useState(false)


  const [formData, setFormData] = useState({
    name: '',
    description: '',
    session_type: 'sermon' as SessionType,
    start_time: '',
    end_time: ''
  })

  useEffect(() => {
    loadSessions()
  }, [])

  const loadSessions = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('camp_sessions')
        .select('*')
        .order('start_time', { ascending: false })

      if (error) throw error
      setSessions(data as unknown as CampSession[])
    } catch (error) {
      console.error('Error loading sessions:', error)
      addToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to load sessions'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile) return

    setLoading(true)
    try {
      // Generate a proper QR code URL for attendance check-in using query parameters
      const siteUrl = window.location.origin
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const qrCodeUrl = `${siteUrl}/?attendance=${sessionId}`

      // Convert datetime-local values to proper ISO strings with timezone
      const convertToISOString = (datetimeLocal: string) => {
        if (!datetimeLocal) return null
        // Create a Date object from the datetime-local value (which is in local time)
        const date = new Date(datetimeLocal)
        // Convert to ISO string to include timezone information
        return date.toISOString()
      }

      const sessionData = {
        ...formData,
        start_time: convertToISOString(formData.start_time),
        end_time: convertToISOString(formData.end_time),
        created_by: profile.id,
        qr_code: qrCodeUrl
      }

      if (editingSession) {
        const { error } = await supabase
          .from('camp_sessions')
          .update(sessionData)
          .eq('id', editingSession.id)

        if (error) throw error
        addToast({
          type: 'success',
          title: 'Success',
          message: 'Session updated successfully'
        })
      } else {
        const { data, error } = await supabase
          .from('camp_sessions')
          .insert(sessionData)
          .select()
          .single()

        if (error) throw error
        addToast({
          type: 'success',
          title: 'Success',
          message: 'Session created successfully'
        })
        onSessionCreated?.(data as unknown as CampSession)
      }

      resetForm()
      loadSessions()
    } catch (error) {
      console.error('Error saving session:', error)
      addToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to save session'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (sessionId: string) => {
    if (!confirm('Are you sure you want to delete this session?')) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('camp_sessions')
        .delete()
        .eq('id', sessionId)

      if (error) throw error
      addToast({
        type: 'success',
        title: 'Success',
        message: 'Session deleted successfully'
      })
      loadSessions()
    } catch (error) {
      console.error('Error deleting session:', error)
      addToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to delete session'
      })
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      session_type: 'sermon',
      start_time: '',
      end_time: ''
    })
    setEditingSession(null)
    setShowForm(false)
  }

  const editSession = (session: CampSession) => {
    setEditingSession(session)
    
    // Convert ISO datetime strings to datetime-local format
    const convertToDatetimeLocal = (isoString: string) => {
      if (!isoString) return ''
      const date = new Date(isoString)
      // Format as YYYY-MM-DDTHH:MM for datetime-local input
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const hours = String(date.getHours()).padStart(2, '0')
      const minutes = String(date.getMinutes()).padStart(2, '0')
      return `${year}-${month}-${day}T${hours}:${minutes}`
    }
    
    setFormData({
      name: session.name,
      description: session.description || '',
      session_type: session.session_type,
      start_time: convertToDatetimeLocal(session.start_time),
      end_time: convertToDatetimeLocal(session.end_time)
    })
    setShowForm(true)
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  if (!profile?.is_admin) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-[var(--color-text)]">Session Management</h3>
          <p className="text-sm text-[var(--color-text-muted)]">Create and manage camp sessions</p>
        </div>
        <div className="flex space-x-2">


        </div>
      </div>

      {/* Manual Session Form */}
    <div className="flex items-center justify-between mb-4">
        <h4 className="text-lg font-medium text-[var(--color-text)]">Manual Session Creation</h4>
        <button
          onClick={() => setShowForm(true)}
      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Session
        </button>
      </div>

      {/* Session Form */}
        {showForm && (
        <div className="bg-[var(--color-card-bg)] rounded-lg shadow-sm p-4 sm:p-6 border border-[var(--color-border)]">
          <h4 className="text-lg font-medium text-[var(--color-text)] mb-4">
            {editingSession ? 'Edit Session' : 'Create New Session'}
          </h4>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                  <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">
                    Session Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-[var(--color-border)] rounded-md bg-[var(--color-input-bg)] text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-sky-500"
                    required
                  />
                </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">
                  Session Type
                </label>
                <select
                  value={formData.session_type}
                  onChange={(e) => setFormData({ ...formData, session_type: e.target.value as SessionType })}
                  className="w-full px-3 py-2 border border-[var(--color-border)] rounded-md bg-[var(--color-input-bg)] text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  {Object.entries(SESSION_TYPE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-[var(--color-border)] rounded-md bg-[var(--color-input-bg)] text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">
                  Start Time
                </label>
                <input
                  type="datetime-local"
                  value={formData.start_time}
                  onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                  className="w-full px-3 py-2 border border-[var(--color-border)] rounded-md bg-[var(--color-input-bg)] text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-sky-500"
                  required
                />
              </div>
              <div>
                  <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">
                  End Time
                </label>
                <input
                  type="datetime-local"
                  value={formData.end_time}
                  onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                    className="w-full px-3 py-2 border border-[var(--color-border)] rounded-md bg-[var(--color-input-bg)] text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-sky-500"
                  required
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center justify-center px-4 py-3 sm:px-4 sm:py-2 border border-transparent text-sm font-medium rounded-md text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 disabled:opacity-50 min-h-[44px] touch-manipulation"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : null}
                <span className="whitespace-nowrap">{editingSession ? 'Update Session' : 'Create Session'}</span>
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="inline-flex items-center justify-center px-4 py-3 sm:px-4 sm:py-2 border border-[var(--color-border)] text-sm font-medium rounded-md text-[var(--color-text)] bg-[var(--color-card-bg)] hover:bg-[var(--color-bg-muted)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 min-h-[44px] touch-manipulation"
              >
                <span className="whitespace-nowrap">Cancel</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Sessions List */}
      <div className="bg-[var(--color-card-bg)] rounded-lg shadow-sm">
        <div className="px-4 sm:px-6 py-4 border-b border-[var(--color-border)]">
          <h4 className="text-lg font-medium text-[var(--color-text)]">Active Sessions</h4>
        </div>
        <div className="divide-y divide-[var(--color-border)]">
          {loading ? (
            <div className="p-6 text-center text-[var(--color-text-muted)]">Loading sessions...</div>
          ) : sessions.length === 0 ? (
            <div className="p-6 text-center text-[var(--color-text-muted)]">No sessions created yet</div>
          ) : (
            sessions.map((session) => (
              <div key={session.id} className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between space-y-4 sm:space-y-0">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                      <h5 className="text-base sm:text-lg font-medium text-[var(--color-text)] break-words">{session.name}</h5>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium w-fit ${SESSION_TYPE_COLORS[session.session_type]}`}>
                        {SESSION_TYPE_LABELS[session.session_type]}
                      </span>
                    </div>
                    {session.description && (
                      <p className="text-sm text-[var(--color-text-muted)] mt-1 break-words">{session.description}</p>
                    )}
                    <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-4 mt-2 text-sm text-[var(--color-text-muted)]">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1 flex-shrink-0" />
                        <span className="break-words">{formatDateTime(session.start_time)}</span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1 flex-shrink-0" />
                        <span className="break-words">{formatDateTime(session.end_time)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
                    <button
                      onClick={() => {
                        setSelectedSession(session)
                        setShowQR(true)
                      }}
                      className="inline-flex items-center justify-center px-4 py-3 sm:px-3 sm:py-2 border border-[var(--color-border)] shadow-sm text-sm font-medium rounded-md text-[var(--color-text)] bg-[var(--color-card-bg)] hover:bg-[var(--color-bg-muted)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 min-h-[44px] touch-manipulation"
                    >
                      <QrCode className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span className="whitespace-nowrap">QR Code</span>
                    </button>
                    <button
                      onClick={() => editSession(session)}
                      className="inline-flex items-center justify-center px-4 py-3 sm:px-3 sm:py-2 border border-[var(--color-border)] shadow-sm text-sm font-medium rounded-md text-[var(--color-text)] bg-[var(--color-card-bg)] hover:bg-[var(--color-bg-muted)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 min-h-[44px] touch-manipulation"
                    >
                      <Edit className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span className="whitespace-nowrap">Edit</span>
                    </button>
                    <button
                      onClick={() => handleDelete(session.id)}
                      className="inline-flex items-center justify-center px-4 py-3 sm:px-3 sm:py-2 border border-[var(--color-border)] shadow-sm text-sm font-medium rounded-md bg-[var(--color-card-bg)] hover:bg-[var(--color-bg-muted)] focus:outline-none focus:ring-2 focus:ring-offset-2 min-h-[44px] touch-manipulation"
                      style={{ color: 'var(--color-error,#dc2626)' }}
                    >
                      <Trash2 className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span className="whitespace-nowrap">Delete</span>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* QR Code Modal */}
      {showQR && selectedSession && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 sm:p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 break-words">QR Code for {selectedSession.name}</h3>
              <button
                onClick={() => setShowQR(false)}
                className="text-gray-400 hover:text-gray-600 p-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                ×
              </button>
            </div>
            <div className="flex justify-center">
              <QRCode value={selectedSession.qr_code || ''} size={Math.min(250, window.innerWidth - 80)} />
            </div>
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-600 mb-2 font-medium">QR Code URL:</p>
              <p className="text-xs text-gray-800 break-all font-mono">
                {selectedSession.qr_code || 'No QR code generated'}
              </p>
            </div>
            <p className="text-sm text-gray-600 mt-4 text-center">
              Display this QR code for participants to scan and check in
            </p>
          </div>
        </div>
      )}
    </div>
  )
}