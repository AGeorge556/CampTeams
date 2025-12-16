import { useState, useEffect } from 'react'
import { BarChart3, Users, Download } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useProfile } from '../hooks/useProfile'
import { useToast } from './Toast'
import { SessionWithAttendance, AttendanceWithUser, SESSION_TYPE_LABELS } from '../lib/types'

export default function AttendanceReports() {
  const { profile } = useProfile()
  const { addToast } = useToast()
  const [sessions, setSessions] = useState<SessionWithAttendance[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedSession, setSelectedSession] = useState<SessionWithAttendance | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterTeam, setFilterTeam] = useState<string>('all')

  useEffect(() => {
    loadSessionsWithAttendance()
  }, [])

  const loadSessionsWithAttendance = async () => {
    setLoading(true)
    try {
      // Get sessions with direct query
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('camp_sessions')
        .select('*')
        .order('start_time', { ascending: true })

      if (sessionsError) throw sessionsError

      // Get attendance records with direct query
      const { data: attendanceData, error: attendanceError } = await supabase
        .from('attendance_records')
        .select(`
          *,
          camp_sessions!inner(name),
          profiles!attendance_records_user_id_fkey(full_name, grade, gender, current_team)
        `)
        .order('created_at', { ascending: false })

      if (attendanceError) throw attendanceError

      // Transform the data to match the expected format
      const sessionsWithAttendance: SessionWithAttendance[] = (sessionsData || []).map((session: any) => {
        const sessionAttendance = (attendanceData || []).filter((att: any) => att.session_id === session.id)
        const presentCount = sessionAttendance.filter((att: any) => att.status === 'present').length
        const totalParticipants = sessionAttendance.length

        return {
          ...session,
          attendance_count: presentCount,
          total_participants: totalParticipants,
          attendance_records: sessionAttendance.map((att: any) => ({
            id: att.id,
            session_id: att.session_id,
            user_id: att.user_id,
            status: att.status,
            checked_in_at: att.checked_in_at,
            checked_in_by: att.checked_in_by,
            notes: att.notes,
            created_at: att.created_at,
            user: {
              id: att.user_id,
              full_name: att.profiles?.full_name || 'Unknown',
              grade: att.profiles?.grade || 0,
              gender: att.profiles?.gender || 'male',
              current_team: att.profiles?.current_team
            }
          })) as AttendanceWithUser[]
        } as SessionWithAttendance
      })

      setSessions(sessionsWithAttendance)
    } catch (error) {
      console.error('Error loading sessions with attendance:', error)
      addToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to load attendance data'
      })
    } finally {
      setLoading(false)
    }
  }

  const getAttendancePercentage = (session: SessionWithAttendance) => {
    if (session.total_participants === 0) return 0
    return Math.round((session.attendance_count / session.total_participants) * 100)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present':
        return 'text-green-600 bg-green-100'
      case 'absent':
        return 'text-red-600 bg-red-100'
      case 'late':
        return 'text-yellow-600 bg-yellow-100'
      case 'excused':
        return 'text-blue-600 bg-blue-100'
      default:
        return 'text-[var(--color-text-muted)] bg-[var(--color-bg-muted)]'
    }
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const exportAttendanceData = async (session: SessionWithAttendance) => {
    try {
      const csvData = [
        ['Name', 'Grade', 'Gender', 'Team', 'Status', 'Check-in Time'],
        ...session.attendance_records.map(record => [
          record.user.full_name,
          record.user.grade.toString(),
          record.user.gender,
          record.user.current_team || 'N/A',
          record.status,
          formatDateTime(record.checked_in_at)
        ])
      ]

      const csvContent = csvData.map(row => row.join(',')).join('\n')
      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `attendance-${session.name}-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      addToast({
        type: 'success',
        title: 'Export Successful',
        message: 'Attendance data has been exported'
      })
    } catch (error) {
      console.error('Error exporting data:', error)
      addToast({
        type: 'error',
        title: 'Export Failed',
        message: 'Failed to export attendance data'
      })
    }
  }

  const filteredAttendanceRecords = selectedSession?.attendance_records.filter(record => {
    const statusMatch = filterStatus === 'all' || record.status === filterStatus
    const teamMatch = filterTeam === 'all' || record.user.current_team === filterTeam
    return statusMatch && teamMatch
  }) || []

  if (!profile?.is_admin) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-[var(--color-text)]">Attendance Reports</h3>
        <p className="text-sm text-[var(--color-text-muted)]">View and manage attendance records</p>
      </div>

      {/* Sessions Overview */}
      <div className="bg-[var(--color-card-bg)] rounded-lg shadow-sm border border-[var(--color-border)]">
        <div className="px-6 py-4 border-b border-[var(--color-border)]">
          <h4 className="text-lg font-medium text-[var(--color-text)] flex items-center">
            <BarChart3 className="h-5 w-5 mr-2" />
            Sessions Overview
          </h4>
        </div>
        <div className="divide-y divide-[var(--color-border)]">
          {loading ? (
            <div className="p-6 text-center text-[var(--color-text-muted)]">Loading sessions...</div>
          ) : sessions.length === 0 ? (
            <div className="p-6 text-center text-[var(--color-text-muted)]">No sessions found</div>
          ) : (
            sessions.map((session) => (
              <div key={session.id} className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                        <h5 className="text-lg font-medium text-[var(--color-text)]">{session.name}</h5>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {SESSION_TYPE_LABELS[session.session_type]}
                      </span>
                    </div>
                    <p className="text-sm text-[var(--color-text-muted)] mt-1">
                      {formatDateTime(session.start_time)} - {formatDateTime(session.end_time)}
                    </p>
                    <div className="flex items-center space-x-4 mt-2">
                      <div className="flex items-center text-sm text-[var(--color-text-muted)]">
                        <Users className="h-4 w-4 mr-1" />
                        {session.attendance_count} / {session.total_participants} present
                      </div>
                      <div className="flex items-center text-sm text-[var(--color-text-muted)]">
                        <BarChart3 className="h-4 w-4 mr-1" />
                        {getAttendancePercentage(session)}% attendance
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setSelectedSession(session)}
                      className="inline-flex items-center px-3 py-2 border border-[var(--color-border)] shadow-sm text-sm font-medium rounded-md text-[var(--color-text)] bg-[var(--color-bg)] hover:bg-[var(--color-bg-muted)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500"
                    >
                      View Details
                    </button>
                    <button
                      onClick={() => exportAttendanceData(session)}
                      className="inline-flex items-center px-3 py-2 border border-[var(--color-border)] shadow-sm text-sm font-medium rounded-md text-[var(--color-text)] bg-[var(--color-bg)] hover:bg-[var(--color-bg-muted)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Session Details Modal */}
      {selectedSession && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[var(--color-card-bg)] rounded-lg max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto border border-[var(--color-border)]">
            <div className="p-6 border-b border-[var(--color-border)]">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-[var(--color-text)]">{selectedSession.name}</h3>
                  <p className="text-sm text-[var(--color-text-muted)]">
                    {formatDateTime(selectedSession.start_time)} - {formatDateTime(selectedSession.end_time)}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedSession(null)}
                  className="text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Filters */}
            <div className="p-6 border-b border-[var(--color-border)]">
              <div className="flex items-center space-x-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">Status</label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-3 py-2 border border-[var(--color-border)] rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 bg-[var(--color-bg)] text-[var(--color-text)]"
                  >
                    <option value="all">All Statuses</option>
                    <option value="present">Present</option>
                    <option value="absent">Absent</option>
                    <option value="late">Late</option>
                    <option value="excused">Excused</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">Team</label>
                  <select
                    value={filterTeam}
                    onChange={(e) => setFilterTeam(e.target.value)}
                    className="px-3 py-2 border border-[var(--color-border)] rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 bg-[var(--color-bg)] text-[var(--color-text)]"
                  >
                    <option value="all">All Teams</option>
                    <option value="red">Red Team</option>
                    <option value="blue">Blue Team</option>
                    <option value="green">Green Team</option>
                    <option value="yellow">Yellow Team</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Attendance Records */}
            <div className="p-6">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-[var(--color-border)]">
                  <thead className="bg-[var(--color-bg-muted)]">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
                        Grade
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
                        Team
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
                        Check-in Time
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-[var(--color-card-bg)] divide-y divide-[var(--color-border)]">
                    {filteredAttendanceRecords.map((record) => (
                      <tr key={record.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[var(--color-text)]">
                          {record.user.full_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--color-text-muted)]">
                          {record.user.grade}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--color-text-muted)]">
                          {record.user.current_team || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(record.status)}`}>
                            {record.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--color-text-muted)]">
                          {formatDateTime(record.checked_in_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}