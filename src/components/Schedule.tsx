import React, { useState, useEffect } from 'react'
import { Calendar, Clock, Edit3, Save, X, Plus, Trash2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useProfile } from '../hooks/useProfile'

interface ScheduleItem {
  id: string
  day: number
  time: string
  activity: string
  location: string
  description?: string
}

interface DaySchedule {
  day: number
  title: string
  items: ScheduleItem[]
}

export default function Schedule() {
  const { profile } = useProfile()
  const [schedule, setSchedule] = useState<DaySchedule[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<string | null>(null)
  const [editMode, setEditMode] = useState(false)
  const [selectedDay, setSelectedDay] = useState(1)
  const [newItem, setNewItem] = useState<Partial<ScheduleItem>>({})

  const defaultSchedule: DaySchedule[] = [
    {
      day: 1,
      title: "Day 1",
      items: [
        { id: '1-1', day: 1, time: '08:00', activity: 'Depart from Cairo', location: 'Church', description: 'Meet at church for departure' },
        { id: '1-2', day: 1, time: '08:30', activity: 'Travel to Camp', location: 'Bus', description: 'Journey to camp location' },
        { id: '1-3', day: 1, time: '10:00', activity: 'Arrive at Camp', location: 'Camp House', description: 'Unload and settle in' },
        { id: '1-4', day: 1, time: '10:30', activity: 'Orientation', location: 'Main Hall', description: 'Camp rules and introductions' },
        { id: '1-5', day: 1, time: '11:00', activity: 'Team Assignments', location: 'Outdoor Area', description: 'Meet your team members' },
        { id: '1-6', day: 1, time: '12:00', activity: 'Lunch', location: 'Dining Hall', description: 'Team lunch together' },
        { id: '1-7', day: 1, time: '13:00', activity: 'Free Time', location: 'Camp Grounds', description: 'Explore the camp' },
        { id: '1-8', day: 1, time: '14:00', activity: 'Sports Activities', location: 'Sports Field', description: 'Soccer, dodgeball, chairball' },
        { id: '1-9', day: 1, time: '15:30', activity: 'Snack Break', location: 'Dining Hall', description: 'Refreshments' },
        { id: '1-10', day: 1, time: '16:00', activity: 'Team Building', location: 'Outdoor Area', description: 'Team challenges and games' },
        { id: '1-11', day: 1, time: '17:30', activity: 'Dinner', location: 'Dining Hall', description: 'Evening meal' },
        { id: '1-12', day: 1, time: '19:00', activity: 'Evening Program', location: 'Main Hall', description: 'Worship and fellowship' },
        { id: '1-13', day: 1, time: '21:00', activity: 'Lights Out', location: 'Cabins', description: 'Prepare for bed' }
      ]
    },
    {
      day: 2,
      title: "Day 2",
      items: [
        { id: '2-1', day: 2, time: '07:00', activity: 'Wake Up', location: 'Cabins', description: 'Morning routine' },
        { id: '2-2', day: 2, time: '07:30', activity: 'Breakfast', location: 'Dining Hall', description: 'Morning meal' },
        { id: '2-3', day: 2, time: '08:30', activity: 'Morning Devotion', location: 'Outdoor Chapel', description: 'Spiritual time' },
        { id: '2-4', day: 2, time: '09:00', activity: 'Sports Tournament', location: 'Sports Field', description: 'Soccer matches' },
        { id: '2-5', day: 2, time: '10:30', activity: 'Dodgeball Games', location: 'Indoor Gym', description: 'Team dodgeball' },
        { id: '2-6', day: 2, time: '12:00', activity: 'Lunch', location: 'Dining Hall', description: 'Team lunch' },
        { id: '2-7', day: 2, time: '13:00', activity: 'Chairball Tournament', location: 'Sports Field', description: 'Chairball matches' },
        { id: '2-8', day: 2, time: '14:30', activity: 'Water Activities', location: 'Lake', description: 'Swimming and water games' },
        { id: '2-9', day: 2, time: '16:00', activity: 'Snack Break', location: 'Dining Hall', description: 'Refreshments' },
        { id: '2-10', day: 2, time: '16:30', activity: 'Team Challenges', location: 'Outdoor Area', description: 'Obstacle courses' },
        { id: '2-11', day: 2, time: '18:00', activity: 'Dinner', location: 'Dining Hall', description: 'Evening meal' },
        { id: '2-12', day: 2, time: '19:30', activity: 'Campfire', location: 'Fire Pit', description: 'Songs and stories' },
        { id: '2-13', day: 2, time: '21:00', activity: 'Lights Out', location: 'Cabins', description: 'Prepare for bed' }
      ]
    },
    {
      day: 3,
      title: "Day 3",
      items: [
        { id: '3-1', day: 3, time: '07:00', activity: 'Wake Up', location: 'Cabins', description: 'Morning routine' },
        { id: '3-2', day: 3, time: '07:30', activity: 'Breakfast', location: 'Dining Hall', description: 'Morning meal' },
        { id: '3-3', day: 3, time: '08:30', activity: 'Morning Devotion', location: 'Outdoor Chapel', description: 'Spiritual time' },
        { id: '3-4', day: 3, time: '09:00', activity: 'Championship Matches', location: 'Sports Field', description: 'Final soccer games' },
        { id: '3-5', day: 3, time: '10:30', activity: 'Dodgeball Finals', location: 'Indoor Gym', description: 'Championship dodgeball' },
        { id: '3-6', day: 3, time: '12:00', activity: 'Lunch', location: 'Dining Hall', description: 'Team lunch' },
        { id: '3-7', day: 3, time: '13:00', activity: 'Chairball Finals', location: 'Sports Field', description: 'Championship chairball' },
        { id: '3-8', day: 3, time: '14:30', activity: 'Award Ceremony', location: 'Main Hall', description: 'Trophy presentation' },
        { id: '3-9', day: 3, time: '15:00', activity: 'Free Time', location: 'Camp Grounds', description: 'Relax and explore' },
        { id: '3-10', day: 3, time: '16:30', activity: 'Snack Break', location: 'Dining Hall', description: 'Refreshments' },
        { id: '3-11', day: 3, time: '17:00', activity: 'Talent Show', location: 'Main Hall', description: 'Performances and fun' },
        { id: '3-12', day: 3, time: '18:30', activity: 'Dinner', location: 'Dining Hall', description: 'Evening meal' },
        { id: '3-13', day: 3, time: '20:00', activity: 'Final Campfire', location: 'Fire Pit', description: 'Closing ceremony' },
        { id: '3-14', day: 3, time: '21:00', activity: 'Lights Out', location: 'Cabins', description: 'Prepare for bed' }
      ]
    },
    {
      day: 4,
      title: "Day 4",
      items: [
        { id: '4-1', day: 4, time: '07:00', activity: 'Wake Up', location: 'Cabins', description: 'Morning routine' },
        { id: '4-2', day: 4, time: '07:30', activity: 'Breakfast', location: 'Dining Hall', description: 'Morning meal' },
        { id: '4-3', day: 4, time: '08:00', activity: 'Pack Up', location: 'Cabins', description: 'Clean and pack belongings' },
        { id: '4-4', day: 4, time: '08:30', activity: 'Final Devotion', location: 'Outdoor Chapel', description: 'Closing prayer' },
        { id: '4-5', day: 4, time: '09:00', activity: 'Goodbyes', location: 'Main Hall', description: 'Farewell to new friends' },
        { id: '4-6', day: 4, time: '09:30', activity: 'Load Bus', location: 'Camp Entrance', description: 'Board bus for return' },
        { id: '4-7', day: 4, time: '10:00', activity: 'Depart Camp', location: 'Bus', description: 'Journey back to Cairo' },
        { id: '4-8', day: 4, time: '11:30', activity: 'Arrive at Church', location: 'Church', description: 'Return to church' }
      ]
    }
  ]

  useEffect(() => {
    loadSchedule()
  }, [])

  const loadSchedule = async () => {
    try {
      const { data, error } = await supabase
        .from('camp_schedule')
        .select('*')
        .order('day', { ascending: true })
        .order('time', { ascending: true })

      if (error) {
        console.error('Error loading schedule:', error)
        setSchedule(defaultSchedule)
      } else {
        if (data && data.length > 0) {
          const organizedSchedule = defaultSchedule.map(day => ({
            ...day,
            items: data.filter(item => item.day === day.day)
          }))
          setSchedule(organizedSchedule)
        } else {
          setSchedule(defaultSchedule)
        }
      }
    } catch (error) {
      console.error('Error loading schedule:', error)
      setSchedule(defaultSchedule)
    } finally {
      setLoading(false)
    }
  }

  const saveSchedule = async () => {
    if (!profile?.is_admin) return

    try {
      // Clear existing schedule
      await supabase.from('camp_schedule').delete().neq('id', '0')
      
      // Insert new schedule
      const allItems = schedule.flatMap(day => day.items)
      const { error } = await supabase
        .from('camp_schedule')
        .insert(allItems)

      if (error) throw error
      
      setEditMode(false)
    } catch (error) {
      console.error('Error saving schedule:', error)
      alert('Error saving schedule')
    }
  }

  const addItem = (day: number) => {
    const newItem: ScheduleItem = {
      id: `${day}-${Date.now()}`,
      day,
      time: '12:00',
      activity: 'New Activity',
      location: 'Location',
      description: 'Description'
    }

    setSchedule(prev => prev.map(d => 
      d.day === day 
        ? { ...d, items: [...d.items, newItem] }
        : d
    ))
  }

  const updateItem = (day: number, itemId: string, field: keyof ScheduleItem, value: string) => {
    setSchedule(prev => prev.map(d => 
      d.day === day 
        ? { 
            ...d, 
            items: d.items.map(item => 
              item.id === itemId 
                ? { ...item, [field]: value }
                : item
            )
          }
        : d
    ))
  }

  const deleteItem = (day: number, itemId: string) => {
    setSchedule(prev => prev.map(d => 
      d.day === day 
        ? { ...d, items: d.items.filter(item => item.id !== itemId) }
        : d
    ))
  }

  const generateTimeOptions = () => {
    const options = []
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
        options.push(time)
      }
    }
    return options
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500"></div>
      </div>
    )
  }

  const selectedDaySchedule = schedule.find(day => day.day === selectedDay)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Calendar className="h-8 w-8 text-orange-500" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Camp Schedule</h1>
              <p className="text-gray-600">4-day adventure schedule</p>
            </div>
          </div>
          {profile?.is_admin && (
            <div className="flex space-x-2">
              {editMode ? (
                <>
                  <button
                    onClick={saveSchedule}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </button>
                  <button
                    onClick={() => setEditMode(false)}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setEditMode(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                >
                  <Edit3 className="h-4 w-4 mr-2" />
                  Edit Schedule
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Day Tabs */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {schedule.map((day) => (
              <button
                key={day.day}
                onClick={() => setSelectedDay(day.day)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  selectedDay === day.day
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {day.title}
              </button>
            ))}
          </nav>
        </div>

        {/* Selected Day Schedule */}
        {selectedDaySchedule && (
          <div className="p-6">
            <div className="space-y-4">
              {selectedDaySchedule.items.map((item) => (
                <div key={item.id} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex-shrink-0">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-orange-500" />
                      {editMode ? (
                        <select
                          value={item.time}
                          onChange={(e) => updateItem(selectedDay, item.id, 'time', e.target.value)}
                          className="border border-gray-300 rounded px-2 py-1 text-sm"
                        >
                          {generateTimeOptions().map(time => (
                            <option key={time} value={time}>{time}</option>
                          ))}
                        </select>
                      ) : (
                        <span className="font-medium text-gray-900">{item.time}</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex-1">
                    {editMode ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={item.activity}
                          onChange={(e) => updateItem(selectedDay, item.id, 'activity', e.target.value)}
                          className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                          placeholder="Activity"
                        />
                        <input
                          type="text"
                          value={item.location}
                          onChange={(e) => updateItem(selectedDay, item.id, 'location', e.target.value)}
                          className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                          placeholder="Location"
                        />
                        <input
                          type="text"
                          value={item.description || ''}
                          onChange={(e) => updateItem(selectedDay, item.id, 'description', e.target.value)}
                          className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                          placeholder="Description (optional)"
                        />
                      </div>
                    ) : (
                      <div>
                        <h3 className="font-semibold text-gray-900">{item.activity}</h3>
                        <p className="text-sm text-gray-600">{item.location}</p>
                        {item.description && (
                          <p className="text-sm text-gray-500 mt-1">{item.description}</p>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {editMode && (
                    <button
                      onClick={() => deleteItem(selectedDay, item.id)}
                      className="flex-shrink-0 text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
              
              {editMode && (
                <button
                  onClick={() => addItem(selectedDay)}
                  className="w-full flex items-center justify-center px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-orange-400 hover:text-orange-600 transition-colors"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Activity
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 