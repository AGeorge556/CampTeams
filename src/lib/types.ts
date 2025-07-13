export interface CampSession {
  id: string
  name: string
  description?: string
  session_type: 'sermon' | 'quiet_time' | 'activity' | 'meal' | 'other'
  start_time: string
  end_time: string
  is_active: boolean
  qr_code?: string
  schedule_id?: string
  created_by: string
  created_at: string
}

export interface ScheduleItem {
  id: string
  day: number
  time: string
  activity: string
  location: string
  description?: string
}

export interface SessionWithSchedule extends CampSession {
  schedule_day?: number
  schedule_time?: string
  schedule_activity?: string
  schedule_location?: string
}

export interface ScheduleStatus {
  finalized: boolean
  finalized_at?: string
  camp_start_date?: string
  total_sessions: number
  active_sessions: number
}

export interface SessionWithDelay extends SessionWithSchedule {
  original_start_time?: string
  has_delay: boolean
  delay_minutes?: number
}

export interface AttendanceRecord {
  id: string
  session_id: string
  user_id: string
  status: 'present' | 'absent' | 'late' | 'excused'
  checked_in_at: string
  checked_in_by?: string
  notes?: string
  created_at: string
}

export interface AttendanceWithUser extends AttendanceRecord {
  user: {
    id: string
    full_name: string
    grade: number
    gender: 'male' | 'female'
    current_team?: string
  }
}

export interface SessionWithAttendance extends CampSession {
  attendance_count: number
  total_participants: number
  attendance_records: AttendanceWithUser[]
}

export type SessionType = 'sermon' | 'quiet_time' | 'activity' | 'meal' | 'other'

export const SESSION_TYPE_LABELS: Record<SessionType, string> = {
  sermon: 'Sermon',
  quiet_time: 'Quiet Time',
  activity: 'Activity',
  meal: 'Meal',
  other: 'Other'
}

export const SESSION_TYPE_COLORS: Record<SessionType, string> = {
  sermon: 'bg-purple-100 text-purple-800',
  quiet_time: 'bg-blue-100 text-blue-800',
  activity: 'bg-green-100 text-green-800',
  meal: 'bg-orange-100 text-orange-800',
  other: 'bg-gray-100 text-gray-800'
} 