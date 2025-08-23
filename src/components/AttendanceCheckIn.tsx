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

  useEffect(() => {
    loadActiveSessions()
    loadMyAttendance()
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
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-[var(--color-text)]">Attendance Check-in</h3>
        <p className="text-sm text-[var(--color-text-muted)]">Check in to active camp sessions</p>
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
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                        <h5 className="text-base sm:text-lg font-medium text-[var(--color-text)]">{session.name}</h5>
                        {isActive && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 w-fit">
                            Active Now
                          </span>
                        )}
                      </div>
                      {session.description && (
                        <p className="text-sm text-[var(--color-text-muted)] mt-1">{session.description}</p>
                      )}
                      <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-4 mt-2 text-sm text-[var(--color-text-muted)]">
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          {formatDateTime(session.start_time)}
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          {formatDateTime(session.end_time)}
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
                          className="inline-flex items-center px-4 py-3 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed touch-target mobile-touch-feedback"
                        >
                          {checkingIn === session.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          ) : (
                            <CheckCircle className="h-4 w-4 mr-2" />
                          )}
                          Check In
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
                    <p className="text-xs text-[var(--color-text-muted)] mt-1">
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