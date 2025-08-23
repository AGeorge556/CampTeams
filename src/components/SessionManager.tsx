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
      const sessionData = {
        ...formData,
        created_by: profile.id,
        qr_code: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
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
    setFormData({
      name: session.name,
      description: session.description || '',
      session_type: session.session_type,
      start_time: session.start_time.slice(0, 16), // Format for datetime-local input
      end_time: session.end_time.slice(0, 16)
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
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Session
        </button>
      </div>

      {/* Session Form */}
        {showForm && (
        <div className="bg-[var(--color-card-bg)] rounded-lg shadow-sm p-6 border border-[var(--color-border)]">
          <h4 className="text-lg font-medium text-[var(--color-text)] mb-4">
            {editingSession ? 'Edit Session' : 'Create New Session'}
          </h4>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">
                  Session Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-[var(--color-border)] rounded-md bg-[var(--color-input-bg)] focus:outline-none focus:ring-2 focus:ring-orange-500"
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
                  className="w-full px-3 py-2 border border-[var(--color-border)] rounded-md bg-[var(--color-input-bg)] focus:outline-none focus:ring-2 focus:ring-orange-500"
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Time
                </label>
                <input
                  type="datetime-local"
                  value={formData.start_time}
                  onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Time
                </label>
                <input
                  type="datetime-local"
                  value={formData.end_time}
                  onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                />
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : null}
                {editingSession ? 'Update Session' : 'Create Session'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Sessions List */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <h4 className="text-lg font-medium text-gray-900">Active Sessions</h4>
        </div>
        <div className="divide-y divide-gray-200">
          {loading ? (
            <div className="p-6 text-center text-gray-500">Loading sessions...</div>
          ) : sessions.length === 0 ? (
            <div className="p-6 text-center text-gray-500">No sessions created yet</div>
          ) : (
            sessions.map((session) => (
              <div key={session.id} className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h5 className="text-lg font-medium text-gray-900">{session.name}</h5>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${SESSION_TYPE_COLORS[session.session_type]}`}>
                        {SESSION_TYPE_LABELS[session.session_type]}
                      </span>
                    </div>
                    {session.description && (
                      <p className="text-sm text-gray-600 mt-1">{session.description}</p>
                    )}
                    <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {formatDateTime(session.start_time)}
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {formatDateTime(session.end_time)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        setSelectedSession(session)
                        setShowQR(true)
                      }}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                    >
                      <QrCode className="h-4 w-4 mr-2" />
                      QR Code
                    </button>
                    <button
                      onClick={() => editSession(session)}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(session.id)}
                      className="inline-flex items-center px-3 py-2 border border-red-300 shadow-sm text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">QR Code for {selectedSession.name}</h3>
              <button
                onClick={() => setShowQR(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            <div className="flex justify-center">
              <QRCode value={selectedSession.qr_code || ''} size={250} />
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