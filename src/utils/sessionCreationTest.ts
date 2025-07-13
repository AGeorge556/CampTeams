// Test utility for session creation logic
// This can be used to verify the client-side session creation works correctly

export interface ScheduleItem {
  id: string
  day: number
  time: string
  activity: string
  location: string
  description?: string
}

export interface SessionData {
  name: string
  description?: string
  session_type: 'sermon' | 'quiet_time' | 'activity' | 'meal' | 'other'
  start_time: string
  end_time: string
  schedule_id: string
  is_active: boolean
}

export const getSessionTypeFromActivity = (activity: string): 'sermon' | 'quiet_time' | 'activity' | 'meal' | 'other' => {
  const lowerActivity = activity.toLowerCase()
  if (lowerActivity.includes('devotion') || lowerActivity.includes('prayer')) return 'sermon'
  if (lowerActivity.includes('breakfast') || lowerActivity.includes('lunch') || lowerActivity.includes('dinner')) return 'meal'
  if (lowerActivity.includes('sports') || lowerActivity.includes('game') || lowerActivity.includes('tournament')) return 'activity'
  if (lowerActivity.includes('free time') || lowerActivity.includes('pack')) return 'other'
  return 'activity'
}

export const createSessionsFromSchedule = (
  scheduleItems: ScheduleItem[],
  baseDate: string = '2025-08-25'
): SessionData[] => {
  return scheduleItems.map(item => {
    const sessionType = getSessionTypeFromActivity(item.activity)
    
    // Calculate session times
    const baseDateObj = new Date(baseDate)
    const sessionDate = new Date(baseDateObj)
    sessionDate.setDate(baseDateObj.getDate() + (item.day - 1))

    const [hours, minutes] = item.time.split(':')
    const sessionStart = new Date(sessionDate)
    sessionStart.setHours(parseInt(hours), parseInt(minutes), 0, 0)

    const sessionEnd = new Date(sessionStart)
    sessionEnd.setHours(sessionStart.getHours() + 1) // Default 1 hour duration

    return {
      name: item.activity,
      description: item.description,
      session_type: sessionType,
      start_time: sessionStart.toISOString(),
      end_time: sessionEnd.toISOString(),
      schedule_id: item.id,
      is_active: false
    }
  })
}

// Test data
export const testScheduleItems: ScheduleItem[] = [
  {
    id: '1-1',
    day: 1,
    time: '08:00',
    activity: 'Morning Devotion',
    location: 'Chapel',
    description: 'Start the day with prayer and reflection'
  },
  {
    id: '1-2',
    day: 1,
    time: '09:00',
    activity: 'Breakfast',
    location: 'Dining Hall',
    description: 'Team breakfast together'
  },
  {
    id: '1-3',
    day: 1,
    time: '10:00',
    activity: 'Soccer Tournament',
    location: 'Sports Field',
    description: 'Team soccer matches'
  },
  {
    id: '1-4',
    day: 1,
    time: '12:00',
    activity: 'Lunch',
    location: 'Dining Hall',
    description: 'Team lunch'
  },
  {
    id: '1-5',
    day: 1,
    time: '14:00',
    activity: 'Free Time',
    location: 'Camp Grounds',
    description: 'Explore and relax'
  }
]

// Test function
export const testSessionCreation = () => {
  console.log('Testing session creation logic...')
  
  const sessions = createSessionsFromSchedule(testScheduleItems)
  
  console.log('Created sessions:')
  sessions.forEach((session, index) => {
    console.log(`${index + 1}. ${session.name}`)
    console.log(`   Type: ${session.session_type}`)
    console.log(`   Time: ${new Date(session.start_time).toLocaleString()} - ${new Date(session.end_time).toLocaleString()}`)
    console.log(`   Schedule ID: ${session.schedule_id}`)
    console.log('')
  })
  
  return sessions
}

// Export for use in components
export default {
  getSessionTypeFromActivity,
  createSessionsFromSchedule,
  testSessionCreation
} 