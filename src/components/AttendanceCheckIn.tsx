import { useState, useEffect } from 'react'
import { QrCode, CheckCircle, XCircle, Clock, Users, AlertCircle } from 'lucide-react'
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
  const [qrValidationError, setQrValidationError] = useState<string | null>(null)
  const [scannedSessionId, setScannedSessionId] = useState<string | null>(null)
  const [scannedSessionValid, setScannedSessionValid] = useState(false)

  useEffect(() => {
    loadActiveSessions()
    loadMyAttendance()
    
    // Check if user arrived via QR code
    const storedSessionId = sessionStorage.getItem('qr_session_id')
    if (storedSessionId) {
      setQrSessionId(storedSessionId)
      setScannedSessionId(storedSessionId)
      sessionStorage.removeItem('qr_session_id') // Clear it after reading
      
      // Validate the scanned session
      validateScannedSession(storedSessionId)
    } else {
      // Clear any existing scanned session state if no QR code was scanned
      setScannedSessionId(null)
      setScannedSessionValid(false)
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
    setQrValidationError(null)
    
    try {
      console.log('QR Code Check-in initiated for session ID:', sessionId)
      
      // Validate that the session exists and is active
      const { data: session, error: sessionError } = await supabase
        .from('camp_sessions')
        .select('*')
        .eq('id', sessionId)
        .eq('is_active', true)
        .single()

      if (sessionError || !session) {
        console.error('Session validation failed:', sessionError)
        setQrValidationError('Invalid or inactive session. Please scan a valid QR code.')
        addToast({
          type: 'error',
          title: 'Invalid Session',
          message: 'This QR code is not valid or the session is not active.'
        })
        return
      }

      console.log('Validated session:', session)

      // Check if session is currently active (within time window)
      const now = new Date()
      const startTime = new Date(session.start_time)
      const endTime = new Date(session.end_time)
      
      if (now < startTime) {
        setQrValidationError('Session has not started yet. Please wait until the session begins.')
        addToast({
          type: 'warning',
          title: 'Session Not Started',
          message: 'This session has not started yet. Please wait until the scheduled time.'
        })
        return
      }
      
      if (now > endTime) {
        setQrValidationError('Session has ended. Check-in is no longer available.')
        addToast({
          type: 'warning',
          title: 'Session Ended',
          message: 'This session has ended. Check-in is no longer available.'
        })
        return
      }

      // Check if already attended
      const existingAttendance = myAttendance.find(att => att.session_id === session.id)
      if (existingAttendance) {
        setQrValidationError('You have already checked in to this session.')
        addToast({
          type: 'warning',
          title: 'Already Checked In',
          message: `You have already checked in to ${session.name}`
        })
        return
      }

      // Create attendance record
      const { error: attendanceError } = await supabase
        .from('attendance_records')
        .insert({
          session_id: session.id,
          user_id: profile.id,
          status: 'present'
        })

      if (attendanceError) throw attendanceError

      addToast({
        type: 'success',
        title: 'Check-in Successful',
        message: `You have been marked as present for ${session.name}`
      })

      // Clear QR session ID and scanned session state, then reload data
      setQrSessionId(null)
      setScannedSessionId(null)
      setScannedSessionValid(false)
      loadMyAttendance()
    } catch (error) {
      console.error('Error checking in via QR code:', error)
      setQrValidationError('Failed to check in. Please try again.')
      addToast({
        type: 'error',
        title: 'Check-in Failed',
        message: 'Failed to check in. Please try again.'
      })
    } finally {
      setCheckingIn(null)
    }
  }

  const validateScannedSession = async (sessionId: string) => {
    try {
      const { data: session, error } = await supabase
        .from('camp_sessions')
        .select('*')
        .eq('id', sessionId)
        .eq('is_active', true)
        .single()

      if (error || !session) {
        setScannedSessionValid(false)
        return
      }

      // Check if session is currently active (within time window)
      const now = new Date()
      const startTime = new Date(session.start_time)
      const endTime = new Date(session.end_time)
      
      if (now >= startTime && now <= endTime) {
        setScannedSessionValid(true)
      } else {
        setScannedSessionValid(false)
      }
    } catch (error) {
      console.error('Error validating scanned session:', error)
      setScannedSessionValid(false)
    }
  }

  const handleManualCheckIn = async (sessionId: string) => {
    if (!profile || !scannedSessionId || sessionId !== scannedSessionId) {
      addToast({
        type: 'error',
        title: 'Invalid Check-in',
        message: 'You must scan a QR code to check in to this session.'
      })
      return
    }

    await handleQRCodeCheckIn(sessionId)
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
      {/* QR Code Validation Error */}
      {qrValidationError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
            <h3 className="text-lg font-medium text-red-800">QR Code Error</h3>
          </div>
          <p className="text-sm text-red-700 mt-1">{qrValidationError}</p>
          <button
            onClick={() => setQrValidationError(null)}
            className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* QR Code Processing Status */}
      {checkingIn && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-2"></div>
            <h3 className="text-lg font-medium text-blue-800">Processing QR Code</h3>
          </div>
          <p className="text-sm text-blue-700 mt-1">Validating your check-in...</p>
        </div>
      )}

      {/* QR Code Scanned Successfully */}
      {scannedSessionId && scannedSessionValid && !checkingIn && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
            <h3 className="text-lg font-medium text-green-800">QR Code Scanned Successfully</h3>
          </div>
          <p className="text-sm text-green-700 mt-1">
            You can now check in to the session below. The check-in button will only appear for the session you scanned.
          </p>
        </div>
      )}
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-[var(--color-text)]">Attendance Check-in</h2>
          <p className="text-[var(--color-text-muted)]">Scan QR codes to check in to sessions</p>
        </div>
        <div className="flex items-center space-x-2">
          <QrCode className="h-6 w-6 sm:h-8 sm:w-8 text-[var(--color-primary)]" />
        </div>
      </div>

      {/* QR Code Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <QrCode className="h-5 w-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="text-lg font-medium text-blue-800">How to Check In</h3>
            <p className="text-sm text-blue-700 mt-1">
              To check in to a session, you must scan the QR code provided by your camp leader. 
              Once you scan a valid QR code, a check-in button will appear for that specific session. 
              Manual check-in is not available without scanning a QR code first.
            </p>
          </div>
        </div>
      </div>

      {/* Active Sessions (Read-only) */}
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
                    <div className="flex items-center justify-start sm:justify-end">
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
                      ) : scannedSessionId === session.id && scannedSessionValid ? (
                        <button
                          onClick={() => handleManualCheckIn(session.id)}
                          disabled={checkingIn === session.id}
                          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-primary)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {checkingIn === session.id ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Checking In...
                            </>
                          ) : (
                            <>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Check In
                            </>
                          )}
                        </button>
                      ) : (
                        <div className="flex items-center text-gray-500">
                          <QrCode className="h-4 w-4 mr-2" />
                          <span className="text-sm font-medium">Scan QR Code to Check In</span>
                        </div>
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