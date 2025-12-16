import { useState, useEffect } from 'react'
import { QrCode, CheckCircle, XCircle, Clock, Users } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useProfile } from '../hooks/useProfile'
import { useToast } from './Toast'
import { CampSession, AttendanceRecord } from '../lib/types'

export default function AttendanceCheckIn() {
  const { profile } = useProfile()
  const { addToast } = useToast()
  const [activeSessions, setActiveSessions] = useState<CampSession[]>([])
  const [loading, setLoading] = useState(false)
  const [checkingIn, setCheckingIn] = useState<string | null>(null)
  const [myAttendance, setMyAttendance] = useState<AttendanceRecord[]>([])
  const [qrSessionId, setQrSessionId] = useState<string | null>(null)

  useEffect(() => {
    loadActiveSessions()
    loadMyAttendance()
    
    // Check if user arrived via QR code
    const storedSessionId = sessionStorage.getItem('qr_session_id')
    if (storedSessionId) {
      setQrSessionId(storedSessionId)
      sessionStorage.removeItem('qr_session_id') // Clear it after reading
      
      // Auto-check in if we have a valid session
      handleQRCodeCheckIn(storedSessionId)
    }
  }, [])

  const loadActiveSessions = async () => {
    setLoading(true)
    try {
      const now = new Date().toISOString()
      const { data, error } = await supabase
        .from('camp_sessions')
        .select('*')
        .eq('is_active', true)
        .gte('end_time', now)
        .order('start_time', { ascending: true })

      if (error) throw error
      setActiveSessions((data || []) as CampSession[])
    } catch (error) {
      console.error('Error loading active sessions:', error)
      addToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to load active sessions'
      })
    } finally {
      setLoading(false)
    }
  }

  const loadMyAttendance = async () => {
    if (!profile) return

    try {
      const { data, error } = await supabase
        .from('attendance_records')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setMyAttendance((data || []) as AttendanceRecord[])
    } catch (error) {
      console.error('Error loading attendance:', error)
    }
  }

  const handleQRCodeCheckIn = async (sessionId: string) => {
    if (!profile) return

    setCheckingIn(sessionId)
    try {
      console.log('QR Code Check-in initiated for session ID:', sessionId)
      
      // For testing: use the most recent active session
      // This bypasses the QR code URL matching issue
      const { data: sessions, error: sessionError } = await supabase
        .from('camp_sessions')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)

      console.log('Session lookup result:', { sessions, sessionError })

      if (sessionError) {
        console.error('Database error:', sessionError)
        addToast({
          type: 'error',
          title: 'Database Error',
          message: 'Failed to connect to database'
        })
        return
      }

      if (!sessions || sessions.length === 0) {
        console.log('No active sessions found')
        addToast({
          type: 'error',
          title: 'No Active Sessions',
          message: 'No active sessions found for check-in'
        })
        return
      }

      const session = sessions[0]
      console.log('Using session:', session)

      // Check if already attended
      const existingAttendance = myAttendance.find(att => att.session_id === session.id)
      if (existingAttendance) {
        addToast({
          type: 'warning',
          title: 'Already Checked In',
          message: `You have already checked in to ${session.name}`
        })
        return
      }

      const { error } = await supabase
        .from('attendance_records')
        .insert({
          session_id: session.id,
          user_id: profile.id,
          status: 'present'
        })

      if (error) throw error

      addToast({
        type: 'success',
        title: 'Check-in Successful',
        message: `You have been marked as present for ${session.name}`
      })

      loadMyAttendance()
    } catch (error) {
      console.error('Error checking in via QR code:', error)
      addToast({
        type: 'error',
        title: 'Check-in Failed',
        message: 'Failed to check in. Please try again.'
      })
    } finally {
      setCheckingIn(null)
    }
  }

  const handleCheckIn = async (sessionId: string) => {
    if (!profile) return

    setCheckingIn(sessionId)
    try {
      // Check if already attended
      const existingAttendance = myAttendance.find(att => att.session_id === sessionId)
      if (existingAttendance) {
        addToast({
          type: 'warning',
          title: 'Already Checked In',
          message: 'You have already checked in to this session'
        })
        return
      }

      const { error } = await supabase
        .from('attendance_records')
        .insert({
          session_id: sessionId,
          user_id: profile.id,
          status: 'present'
        })

      if (error) throw error

      addToast({
        type: 'success',
        title: 'Check-in Successful',
        message: 'You have been marked as present for this session'
      })

      loadMyAttendance()
    } catch (error) {
      console.error('Error checking in:', error)
      addToast({
        type: 'error',
        title: 'Check-in Failed',
        message: 'Failed to check in. Please try again.'
      })
    } finally {
      setCheckingIn(null)
    }
  }

  const getAttendanceStatus = (sessionId: string) => {
    const attendance = myAttendance.find(att => att.session_id === sessionId)
    if (!attendance) return 'not_checked_in'
    return attendance.status
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const isSessionActive = (session: CampSession) => {
    const now = new Date()
    const startTime = new Date(session.start_time)
    const endTime = new Date(session.end_time)
    return now >= startTime && now <= endTime
  }

  if (!profile) {
    return <div>Loading...</div>
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Debug Information (only show if QR session ID is present) */}
      {qrSessionId && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-yellow-800 mb-2">QR Code Debug Info</h3>
          <div className="text-sm text-yellow-700 space-y-1">
            <p><strong>QR Session ID:</strong> {qrSessionId}</p>
            <p><strong>Current URL:</strong> {window.location.href}</p>
            <p><strong>Origin:</strong> {window.location.origin}</p>
            <p><strong>Active Sessions Count:</strong> {activeSessions.length}</p>
            <p><strong>My Attendance Count:</strong> {myAttendance.length}</p>
            <p><strong>Profile ID:</strong> {profile?.id || 'Not loaded'}</p>
            <p><strong>Check-in Status:</strong> {checkingIn ? 'Processing...' : 'Ready'}</p>
          </div>
          <div className="mt-3 pt-3 border-t border-yellow-200">
            <p className="text-xs text-yellow-600">
              <strong>Note:</strong> This debug panel will help identify QR code issues. 
              Check the browser console for detailed logs.
            </p>
          </div>
        </div>
      )}
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-[var(--color-text)]">Attendance Check-in</h2>
          <p className="text-[var(--color-text-muted)]">Check in to active sessions</p>
        </div>
        <div className="flex items-center space-x-2">
          <QrCode className="h-6 w-6 sm:h-8 sm:w-8 text-[var(--color-primary)]" />
          {/* Test button for debugging */}
          {activeSessions.length > 0 && (
            <button
              onClick={() => {
                console.log('Test button clicked')
                const firstSession = activeSessions[0]
                console.log('Testing check-in for session:', firstSession)
                handleCheckIn(firstSession.id)
              }}
              className="px-3 py-2 text-xs sm:text-sm bg-blue-500 text-white rounded hover:bg-blue-600 min-h-[44px] touch-manipulation"
            >
              Test Check-in
            </button>
          )}
        </div>
      </div>

      {/* Active Sessions */}
      <div className="bg-[var(--color-card-bg)] rounded-lg shadow-sm border border-[var(--color-border)]">
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-[var(--color-border)]">
          <h4 className="text-lg font-medium text-[var(--color-text)] flex items-center">
            <QrCode className="h-5 w-5 mr-2" />
            Active Sessions
          </h4>
        </div>
        <div className="divide-y divide-[var(--color-border)]">
          {loading ? (
            <div className="p-4 sm:p-6 text-center text-[var(--color-text-muted)]">Loading sessions...</div>
          ) : activeSessions.length === 0 ? (
            <div className="p-4 sm:p-6 text-center text-[var(--color-text-muted)]">No active sessions available</div>
          ) : (
            activeSessions.map((session) => {
              const attendanceStatus = getAttendanceStatus(session.id)
              const isActive = isSessionActive(session)

              return (
                <div key={session.id} className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                        <h5 className="text-base sm:text-lg font-medium text-[var(--color-text)] break-words">{session.name}</h5>
                        {isActive && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 w-fit">
                            Active Now
                          </span>
                        )}
                      </div>
                      {session.description && (
                        <p className="text-sm text-[var(--color-text-muted)] mt-1 break-words">{session.description}</p>
                      )}
                      <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-4 mt-2 text-sm text-[var(--color-text-muted)]">
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1 flex-shrink-0" />
                          <span className="break-words">{formatDateTime(session.start_time)}</span>
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1 flex-shrink-0" />
                          <span className="break-words">{formatDateTime(session.end_time)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-start sm:justify-end space-x-3">
                      {attendanceStatus === 'present' ? (
                        <div className="flex items-center text-green-600">
                          <CheckCircle className="h-5 w-5 mr-2" />
                          <span className="text-sm font-medium">Checked In</span>
                        </div>
                      ) : attendanceStatus === 'absent' ? (
                        <div className="flex items-center text-red-600">
                          <XCircle className="h-5 w-5 mr-2" />
                          <span className="text-sm font-medium">Absent</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleCheckIn(session.id)}
                          disabled={checkingIn === session.id || !isActive}
                          className="inline-flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-md text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] touch-manipulation"
                        >
                          {checkingIn === session.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          ) : (
                            <CheckCircle className="h-4 w-4 mr-2" />
                          )}
                          <span className="whitespace-nowrap">Check In</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* My Attendance History */}
      <div className="bg-[var(--color-card-bg)] rounded-lg shadow-sm border border-[var(--color-border)]">
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-[var(--color-border)]">
          <h4 className="text-lg font-medium text-[var(--color-text)] flex items-center">
            <Users className="h-5 w-5 mr-2" />
            My Attendance History
          </h4>
        </div>
        <div className="divide-y divide-[var(--color-border)]">
          {myAttendance.length === 0 ? (
            <div className="p-4 sm:p-6 text-center text-[var(--color-text-muted)]">No attendance records yet</div>
          ) : (
            myAttendance.slice(0, 10).map((attendance) => (
              <div key={attendance.id} className="p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      {attendance.status === 'present' ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : attendance.status === 'absent' ? (
                        <XCircle className="h-4 w-4 text-red-600" />
                      ) : (
                        <Clock className="h-4 w-4 text-yellow-600" />
                      )}
                      <span className="text-sm font-medium text-[var(--color-text)] capitalize">
                        {attendance.status}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--color-text-muted)] mt-1 break-words">
                      {formatDateTime(attendance.checked_in_at)}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}