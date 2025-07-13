import React, { useState, useEffect } from 'react'
import { Calendar, Clock, MapPin, Users, Plus, Play, Pause } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useProfile } from '../hooks/useProfile'
import { useToast } from './Toast'
import { ScheduleItem, SessionWithSchedule, SessionType, SESSION_TYPE_LABELS, SESSION_TYPE_COLORS } from '../lib/types'

export default function ScheduleSessionManager() {
  const { profile } = useProfile()
  const { addToast } = useToast()
  const [scheduleItems, setScheduleItems] = useState<ScheduleItem[]>([])
  const [sessions, setSessions] = useState<SessionWithSchedule[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedDay, setSelectedDay] = useState<number>(1)
  const [creatingSessions, setCreatingSessions] = useState(false)

  useEffect(() => {
    loadScheduleItems()
    loadSessions()
  }, [])

  const loadScheduleItems = async () => {
    try {
      const { data, error } = await supabase
        .from('camp_schedule')
        .select('*')
        .order('day', { ascending: true })
        .order('time', { ascending: true })

      if (error) throw error
      setScheduleItems(data || [])
    } catch (error) {
      console.error('Error loading schedule items:', error)
      addToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to load schedule items'
      })
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
      
      // Transform the data to match the expected format
      const transformedData = (data || []).map(session => {
        const scheduleItem = scheduleData?.find(s => s.id === session.schedule_id)
        return {
          ...session,
          schedule_day: scheduleItem?.day,
          schedule_time: scheduleItem?.time,
          schedule_activity: scheduleItem?.activity,
          schedule_location: scheduleItem?.location,
        } as SessionWithSchedule
      })
      
      setSessions(transformedData)
    } catch (error) {
      console.error('Error loading sessions:', error)
      addToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to load sessions'
      })
    }
  }

  const createSessionsForDay = async (day: number) => {
    if (!profile?.is_admin) return

    setCreatingSessions(true)
    try {
      // Try to use the database function first
      const { error: dbFunctionError } = await supabase
        .rpc('create_sessions_for_day', { day_number: day })

      if (!dbFunctionError) {
        // Database function worked
        addToast({
          type: 'success',
          title: 'Sessions Created',
          message: `Successfully created sessions for Day ${day} using database function`
        })
        loadSessions()
        return
      }

      // Fallback to client-side implementation
      console.log('Database function not available, using client-side implementation')
      
      // Get schedule items for the selected day
      const { data: scheduleItems, error: scheduleError } = await supabase
        .from('camp_schedule')
        .select('*')
        .eq('day', day)
        .order('time')

      if (scheduleError) throw scheduleError

      if (!scheduleItems || scheduleItems.length === 0) {
        addToast({
          type: 'warning',
          title: 'No Schedule Items',
          message: `No schedule items found for Day ${day}`
        })
        return
      }

      // Create sessions for each schedule item
      const sessionPromises = scheduleItems.map(async (item) => {
        // Check if session already exists
        const { data: existingSession } = await supabase
          .from('camp_sessions')
          .select('id')
          .eq('schedule_id', item.id)
          .single()

        if (existingSession) {
          return null // Session already exists
        }

        // Determine session type based on activity
        const sessionType = getSessionTypeFromActivity(item.activity)

        // Calculate session times
        const baseDate = new Date('2025-08-25') // Base camp start date
        const sessionDate = new Date(baseDate)
        sessionDate.setDate(baseDate.getDate() + (day - 1))

        const [hours, minutes] = item.time.split(':')
        const sessionStart = new Date(sessionDate)
        sessionStart.setHours(parseInt(hours), parseInt(minutes), 0, 0)

        const sessionEnd = new Date(sessionStart)
        sessionEnd.setHours(sessionStart.getHours() + 1) // Default 1 hour duration

        // Create the session
        const { data: newSession, error: sessionError } = await supabase
          .from('camp_sessions')
          .insert({
            name: item.activity,
            description: item.description,
            session_type: sessionType,
            start_time: sessionStart.toISOString(),
            end_time: sessionEnd.toISOString(),
            schedule_id: item.id,
            qr_code: btoa(Math.random().toString(36) + Date.now().toString(36)), // Simple QR code generation
            created_by: profile.id,
            is_active: false // Start as inactive
          })
          .select()
          .single()

        if (sessionError) {
          console.error(`Error creating session for ${item.activity}:`, sessionError)
          return null
        }

        return newSession
      })

      const results = await Promise.all(sessionPromises)
      const createdSessions = results.filter(session => session !== null)

      addToast({
        type: 'success',
        title: 'Sessions Created',
        message: `Successfully created ${createdSessions.length} sessions for Day ${day} using client-side implementation`
      })

      loadSessions()
    } catch (error) {
      console.error('Error creating sessions:', error)
      addToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to create sessions'
      })
    } finally {
      setCreatingSessions(false)
    }
  }

  const toggleSessionActive = async (sessionId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('camp_sessions')
        .update({ is_active: !isActive })
        .eq('id', sessionId)

      if (error) throw error

      addToast({
        type: 'success',
        title: 'Session Updated',
        message: `Session ${isActive ? 'deactivated' : 'activated'} successfully`
      })

      loadSessions()
    } catch (error) {
      console.error('Error updating session:', error)
      addToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to update session'
      })
    }
  }

  const getScheduleItemsForDay = (day: number) => {
    return scheduleItems.filter(item => item.day === day)
  }

  const getSessionsForDay = (day: number) => {
    return sessions.filter(session => session.schedule_day === day)
  }

  const getSessionTypeFromActivity = (activity: string): SessionType => {
    const lowerActivity = activity.toLowerCase()
    if (lowerActivity.includes('devotion') || lowerActivity.includes('prayer')) return 'sermon'
    if (lowerActivity.includes('breakfast') || lowerActivity.includes('lunch') || lowerActivity.includes('dinner')) return 'meal'
    if (lowerActivity.includes('sports') || lowerActivity.includes('game') || lowerActivity.includes('tournament')) return 'activity'
    if (lowerActivity.includes('free time') || lowerActivity.includes('pack')) return 'other'
    return 'activity'
  }

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour
    return `${displayHour}:${minutes} ${ampm}`
  }

  if (!profile?.is_admin) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Schedule-Based Sessions</h3>
        <p className="text-sm text-gray-600">Create attendance sessions from the camp schedule</p>
      </div>

      {/* Day Selection */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-medium text-gray-900">Select Day</h4>
          <button
            onClick={() => createSessionsForDay(selectedDay)}
            disabled={creatingSessions}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50"
          >
            {creatingSessions ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <Plus className="h-4 w-4 mr-2" />
            )}
            Create Sessions for Day {selectedDay}
          </button>
        </div>
        
        <div className="grid grid-cols-4 gap-2">
          {[1, 2, 3, 4].map((day) => (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                selectedDay === day
                  ? 'bg-orange-100 text-orange-700 border border-orange-300'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Day {day}
            </button>
          ))}
        </div>
      </div>

      {/* Schedule Items for Selected Day */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <h4 className="text-lg font-medium text-gray-900">Day {selectedDay} Schedule</h4>
        </div>
        <div className="divide-y divide-gray-200">
          {getScheduleItemsForDay(selectedDay).map((item) => {
            const existingSession = sessions.find(s => s.schedule_id === item.id)
            const sessionType = getSessionTypeFromActivity(item.activity)

            return (
              <div key={item.id} className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h5 className="text-lg font-medium text-gray-900">{item.activity}</h5>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${SESSION_TYPE_COLORS[sessionType]}`}>
                        {SESSION_TYPE_LABELS[sessionType]}
                      </span>
                      {existingSession && (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          existingSession.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {existingSession.is_active ? 'Active' : 'Inactive'}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {formatTime(item.time)}
                      </div>
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-1" />
                        {item.location}
                      </div>
                    </div>
                    {item.description && (
                      <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    {existingSession ? (
                      <button
                        onClick={() => toggleSessionActive(existingSession.id, existingSession.is_active)}
                        className={`inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md ${
                          existingSession.is_active
                            ? 'text-red-700 bg-white hover:bg-red-50 border-red-300'
                            : 'text-green-700 bg-white hover:bg-green-50 border-green-300'
                        } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500`}
                      >
                        {existingSession.is_active ? (
                          <>
                            <Pause className="h-4 w-4 mr-2" />
                            Deactivate
                          </>
                        ) : (
                          <>
                            <Play className="h-4 w-4 mr-2" />
                            Activate
                          </>
                        )}
                      </button>
                    ) : (
                      <span className="text-sm text-gray-400">No session created</span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Active Sessions Overview */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <h4 className="text-lg font-medium text-gray-900">Active Sessions</h4>
        </div>
        <div className="divide-y divide-gray-200">
          {sessions.filter(s => s.is_active).length === 0 ? (
            <div className="p-6 text-center text-gray-500">No active sessions</div>
          ) : (
            sessions
              .filter(s => s.is_active)
              .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
              .map((session) => (
                <div key={session.id} className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h5 className="text-lg font-medium text-gray-900">{session.name}</h5>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${SESSION_TYPE_COLORS[session.session_type as SessionType]}`}>
                          {SESSION_TYPE_LABELS[session.session_type as SessionType]}
                        </span>
                        {session.schedule_day && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Day {session.schedule_day}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {new Date(session.start_time).toLocaleDateString()}
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          {new Date(session.start_time).toLocaleTimeString()} - {new Date(session.end_time).toLocaleTimeString()}
                        </div>
                        {session.schedule_location && (
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-1" />
                            {session.schedule_location}
                          </div>
                        )}
                      </div>
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