import React, { useState, useEffect } from 'react'
import { Calendar, Clock, AlertTriangle, CheckCircle, Edit, Save, X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useProfile } from '../hooks/useProfile'
import { useToast } from './Toast'
import { ScheduleStatus, SessionWithDelay } from '../lib/types'

export default function ScheduleFinalizer() {
  const { profile } = useProfile()
  const { addToast } = useToast()
  const [scheduleStatus, setScheduleStatus] = useState<ScheduleStatus | null>(null)
  const [sessions, setSessions] = useState<SessionWithDelay[]>([])
  const [loading, setLoading] = useState(false)
  const [finalizing, setFinalizing] = useState(false)
  const [campStartDate, setCampStartDate] = useState('')
  const [editingSession, setEditingSession] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({
    start_time: '',
    end_time: '',
    delay_reason: ''
  })

  useEffect(() => {
    loadScheduleStatus()
    loadSessions()
  }, [])

  const loadScheduleStatus = async () => {
    try {
      const { data, error } = await supabase
        .rpc('get_schedule_status')

      if (error) throw error
      setScheduleStatus(data?.[0] || null)
    } catch (error) {
      console.error('Error loading schedule status:', error)
    }
  }

  const loadSessions = async () => {
    try {
      // Use direct query instead of RPC to avoid function return type issues
      const { data, error } = await supabase
        .from('camp_sessions')
        .select('*')
        .order('start_time', { ascending: true })

      if (error) throw error
      
      // Get schedule data separately
      const { data: scheduleData, error: scheduleError } = await supabase
        .from('camp_schedule')
        .select('*')

      if (scheduleError) throw scheduleError
      
      // Get camp settings for delay calculations
      const { data: settingsData, error: settingsError } = await supabase
        .from('camp_settings')
        .select('*')
        .single()

      if (settingsError) throw settingsError
      
      // Transform the data to match the expected format
      const transformedData = (data || []).map(session => {
        const scheduleItem = scheduleData?.find(s => s.id === session.schedule_id)
        
        // Calculate original time and delay info
        let originalStartTime = session.start_time
        let hasDelay = false
        let delayMinutes = 0
        
        if (scheduleItem && settingsData?.camp_start_date) {
          const originalTime = new Date(settingsData.camp_start_date)
          originalTime.setDate(originalTime.getDate() + (scheduleItem.day - 1))
          
          const [hours, minutes] = scheduleItem.time.split(':')
          originalTime.setHours(parseInt(hours), parseInt(minutes), 0, 0)
          
          originalStartTime = originalTime.toISOString()
          const currentTime = new Date(session.start_time)
          hasDelay = Math.abs(currentTime.getTime() - originalTime.getTime()) > 60000 // 1 minute tolerance
          delayMinutes = hasDelay ? Math.round((currentTime.getTime() - originalTime.getTime()) / 60000) : 0
        }
        
        return {
          ...session,
          original_start_time: originalStartTime,
          has_delay: hasDelay,
          delay_minutes: delayMinutes,
          schedule_day: scheduleItem?.day,
          schedule_time: scheduleItem?.time,
          schedule_activity: scheduleItem?.activity,
          schedule_location: scheduleItem?.location,
        } as SessionWithDelay
      })
      
      setSessions(transformedData)
    } catch (error) {
      console.error('Error loading sessions:', error)
    }
  }

  const finalizeSchedule = async () => {
    if (!campStartDate) {
      addToast({
        type: 'error',
        title: 'Error',
        message: 'Please select a camp start date'
      })
      return
    }

    setFinalizing(true)
    try {
      const { error } = await supabase
        .rpc('finalize_schedule', { camp_start_date_param: campStartDate })

      if (error) throw error

      addToast({
        type: 'success',
        title: 'Schedule Finalized',
        message: 'All sessions have been created successfully!'
      })

      loadScheduleStatus()
      loadSessions()
    } catch (error) {
      console.error('Error finalizing schedule:', error)
      addToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to finalize schedule'
      })
    } finally {
      setFinalizing(false)
    }
  }

  const updateSessionTimes = async (sessionId: string) => {
    if (!editForm.start_time || !editForm.end_time) {
      addToast({
        type: 'error',
        title: 'Error',
        message: 'Please fill in both start and end times'
      })
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase
        .rpc('update_session_times', {
          session_id: sessionId,
          new_start_time: editForm.start_time,
          new_end_time: editForm.end_time,
          delay_reason: editForm.delay_reason || null
        })

      if (error) throw error

      addToast({
        type: 'success',
        title: 'Session Updated',
        message: 'Session times have been updated successfully'
      })

      setEditingSession(null)
      setEditForm({ start_time: '', end_time: '', delay_reason: '' })
      loadSessions()
    } catch (error) {
      console.error('Error updating session:', error)
      addToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to update session times'
      })
    } finally {
      setLoading(false)
    }
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const formatDelay = (minutes: number) => {
    if (minutes === 0) return 'On time'
    const hours = Math.floor(Math.abs(minutes) / 60)
    const mins = Math.abs(minutes) % 60
    const delayText = minutes > 0 ? 'delayed' : 'early'
    if (hours > 0) {
      return `${hours}h ${mins}m ${delayText}`
    }
    return `${mins}m ${delayText}`
  }

  if (!profile?.is_admin) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Schedule Finalization</h3>
        <p className="text-sm text-gray-600">Finalize the camp schedule and manage session delays</p>
      </div>

      {/* Schedule Status */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-medium text-gray-900">Schedule Status</h4>
          {scheduleStatus?.finalized ? (
            <div className="flex items-center text-green-600">
              <CheckCircle className="h-5 w-5 mr-2" />
              <span className="font-medium">Finalized</span>
            </div>
          ) : (
            <div className="flex items-center text-orange-600">
              <AlertTriangle className="h-5 w-5 mr-2" />
              <span className="font-medium">Not Finalized</span>
            </div>
          )}
        </div>

        {scheduleStatus && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h5 className="font-medium text-gray-900">Camp Start Date</h5>
              <p className="text-sm text-gray-600">
                {scheduleStatus.camp_start_date 
                  ? new Date(scheduleStatus.camp_start_date).toLocaleDateString()
                  : 'Not set'
                }
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h5 className="font-medium text-gray-900">Total Sessions</h5>
              <p className="text-sm text-gray-600">{scheduleStatus.total_sessions}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h5 className="font-medium text-gray-900">Active Sessions</h5>
              <p className="text-sm text-gray-600">{scheduleStatus.active_sessions}</p>
            </div>
          </div>
        )}

        {!scheduleStatus?.finalized && (
          <div className="mt-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <h5 className="font-medium text-orange-900 mb-2">Finalize Schedule</h5>
            <p className="text-sm text-orange-700 mb-4">
              Set the camp start date and create all sessions from the schedule.
            </p>
            <div className="flex items-center space-x-4">
              <input
                type="date"
                value={campStartDate}
                onChange={(e) => setCampStartDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <button
                onClick={finalizeSchedule}
                disabled={finalizing || !campStartDate}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50"
              >
                {finalizing ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <Calendar className="h-4 w-4 mr-2" />
                )}
                Finalize Schedule
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Sessions with Delays */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <h4 className="text-lg font-medium text-gray-900">Session Management</h4>
        </div>
        <div className="divide-y divide-gray-200">
          {sessions.length === 0 ? (
            <div className="p-6 text-center text-gray-500">No sessions found</div>
          ) : (
            sessions.map((session) => (
              <div key={session.id} className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h5 className="text-lg font-medium text-gray-900">{session.name}</h5>
                      {session.has_delay && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          {session.delay_minutes && formatDelay(session.delay_minutes)}
                        </span>
                      )}
                      {session.schedule_day && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Day {session.schedule_day}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {formatDateTime(session.start_time)} - {formatDateTime(session.end_time)}
                      </div>
                      {session.schedule_location && (
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {session.schedule_location}
                        </div>
                      )}
                    </div>
                    {session.has_delay && session.original_start_time && (
                      <div className="mt-2 text-sm text-gray-600">
                        <span className="font-medium">Original time:</span> {formatDateTime(session.original_start_time)}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    {editingSession === session.id ? (
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => updateSessionTimes(session.id)}
                          disabled={loading}
                          className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                        >
                          <Save className="h-4 w-4 mr-2" />
                          Save
                        </button>
                        <button
                          onClick={() => {
                            setEditingSession(null)
                            setEditForm({ start_time: '', end_time: '', delay_reason: '' })
                          }}
                          className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                        >
                          <X className="h-4 w-4 mr-2" />
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setEditingSession(session.id)
                          setEditForm({
                            start_time: session.start_time.slice(0, 16),
                            end_time: session.end_time.slice(0, 16),
                            delay_reason: ''
                          })
                        }}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Times
                      </button>
                    )}
                  </div>
                </div>

                {/* Edit Form */}
                {editingSession === session.id && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          New Start Time
                        </label>
                        <input
                          type="datetime-local"
                          value={editForm.start_time}
                          onChange={(e) => setEditForm({ ...editForm, start_time: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          New End Time
                        </label>
                        <input
                          type="datetime-local"
                          value={editForm.end_time}
                          onChange={(e) => setEditForm({ ...editForm, end_time: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Delay Reason (Optional)
                        </label>
                        <input
                          type="text"
                          value={editForm.delay_reason}
                          onChange={(e) => setEditForm({ ...editForm, delay_reason: e.target.value })}
                          placeholder="e.g., Weather delay, equipment issue"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
} 