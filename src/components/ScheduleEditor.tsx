import React, { useState, useEffect } from 'react'
import { Calendar, Clock, MapPin, Edit, Plus, Trash2, Save, X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useProfile } from '../hooks/useProfile'
import { useCamp } from '../contexts/CampContext'
import { useToast } from './Toast'
import { ScheduleItem } from '../lib/types'

export default function ScheduleEditor() {
  const { profile } = useProfile()
  const { currentCamp } = useCamp()
  const { addToast } = useToast()
  const [scheduleItems, setScheduleItems] = useState<ScheduleItem[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedDay, setSelectedDay] = useState<number>(1)
  const [editingItem, setEditingItem] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editForm, setEditForm] = useState({
    day: 1,
    time: '',
    activity: '',
    location: '',
    description: ''
  })

  useEffect(() => {
    if (currentCamp) {
      loadScheduleItems()
    }
  }, [currentCamp])

  const loadScheduleItems = async () => {
    if (!currentCamp) return

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('camp_schedules')
        .select('*')
        .eq('camp_id', currentCamp.id)
        .order('day', { ascending: true })
        .order('time_slot', { ascending: true })

      if (error) throw error
      setScheduleItems(
        (data || []).map(item => ({
          ...item,
          time: item.time_slot, // Map time_slot to time for compatibility
          activity: item.title, // Map title to activity for compatibility
          description: item.description ?? undefined,
        }))
      )
    } catch (error) {
      console.error('Error loading schedule items:', error)
      addToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to load schedule items'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editForm.activity || !editForm.time || !editForm.location || !currentCamp) {
      addToast({
        type: 'error',
        title: 'Error',
        message: 'Please fill in all required fields'
      })
      return
    }

    setLoading(true)
    try {
      if (editingItem) {
        // Update existing item
        const { error } = await supabase
          .from('camp_schedules')
          .update({
            day: editForm.day,
            time_slot: editForm.time,
            title: editForm.activity,
            location: editForm.location,
            description: editForm.description || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingItem)

        if (error) throw error

        addToast({
          type: 'success',
          title: 'Success',
          message: 'Schedule item updated successfully'
        })
      } else {
        // Create new item
        const { error } = await supabase
          .from('camp_schedules')
          .insert({
            camp_id: currentCamp.id,
            day: editForm.day,
            time_slot: editForm.time,
            title: editForm.activity,
            location: editForm.location,
            description: editForm.description || null
          })

        if (error) throw error

        addToast({
          type: 'success',
          title: 'Success',
          message: 'Schedule item created successfully'
        })
      }

      resetForm()
      loadScheduleItems()
    } catch (error) {
      console.error('Error saving schedule item:', error)
      addToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to save schedule item'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this schedule item?')) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('camp_schedules')
        .delete()
        .eq('id', itemId)

      if (error) throw error

      addToast({
        type: 'success',
        title: 'Success',
        message: 'Schedule item deleted successfully'
      })

      loadScheduleItems()
    } catch (error) {
      console.error('Error deleting schedule item:', error)
      addToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to delete schedule item'
      })
    } finally {
      setLoading(false)
    }
  }

  const editItem = (item: ScheduleItem) => {
    setEditingItem(item.id)
    setEditForm({
      day: item.day,
      time: item.time,
      activity: item.activity,
      location: item.location,
      description: item.description || ''
    })
    setShowAddForm(true)
  }

  const resetForm = () => {
    setEditForm({
      day: selectedDay,
      time: '',
      activity: '',
      location: '',
      description: ''
    })
    setEditingItem(null)
    setShowAddForm(false)
  }

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour
    return `${displayHour}:${minutes} ${ampm}`
  }

  const getScheduleItemsForDay = (day: number) => {
    return scheduleItems.filter(item => item.day === day)
  }

  if (!profile?.is_admin) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-[var(--color-text)]">Schedule Editor</h3>
        <p className="text-sm text-[var(--color-text-muted)]">Edit camp schedule activities, times, and locations</p>
      </div>

      {/* Day Selection */}
      <div className="bg-[var(--color-card-bg)] rounded-lg shadow-sm p-6 border border-[var(--color-border)]">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-medium text-[var(--color-text)]">Select Day</h4>
          <button
            onClick={() => {
              setEditForm({ ...editForm, day: selectedDay })
              setShowAddForm(true)
            }}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Activity
          </button>
        </div>
        
        <div className="grid grid-cols-4 gap-2">
          {[1, 2, 3, 4].map((day) => (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                selectedDay === day
                  ? 'bg-blue-100 text-blue-700 border border-blue-300'
                  : 'bg-[var(--color-bg-muted)] text-[var(--color-text)] hover:bg-[var(--color-bg-muted)]'
               }`}
             >
              Day {day}
            </button>
          ))}
        </div>
      </div>

      {/* Add/Edit Form */}
        {showAddForm && (
        <div className="bg-[var(--color-card-bg)] rounded-lg shadow-sm p-6 border border-[var(--color-border)]">
          <h4 className="text-lg font-medium text-[var(--color-text)] mb-4">
            {editingItem ? 'Edit Schedule Item' : 'Add New Activity'}
          </h4>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">
                  Day
                </label>
                <select
                  value={editForm.day}
                  onChange={(e) => setEditForm({ ...editForm, day: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-[var(--color-border)] rounded-md bg-[var(--color-input-bg)] focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {[1, 2, 3, 4].map((day) => (
                    <option key={day} value={day}>Day {day}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">
                  Time
                </label>
                <input
                  type="time"
                  value={editForm.time}
                  onChange={(e) => setEditForm({ ...editForm, time: e.target.value })}
                  className="w-full px-3 py-2 border border-[var(--color-border)] rounded-md bg-[var(--color-input-bg)] focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>
            
            <div>
                <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">
                Activity
              </label>
              <input
                type="text"
                value={editForm.activity}
                onChange={(e) => setEditForm({ ...editForm, activity: e.target.value })}
                className="w-full px-3 py-2 border border-[var(--color-border)] rounded-md bg-[var(--color-input-bg)] focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Morning Devotion, Sports Activities"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">
                Location
              </label>
              <input
                type="text"
                value={editForm.location}
                onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                className="w-full px-3 py-2 border border-[var(--color-border)] rounded-md bg-[var(--color-input-bg)] focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Main Hall, Sports Field"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">
                Description (Optional)
              </label>
              <textarea
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-[var(--color-border)] rounded-md bg-[var(--color-input-bg)] focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Additional details about this activity"
              />
            </div>

            <div className="flex space-x-3">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {editingItem ? 'Update' : 'Create'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="inline-flex items-center px-4 py-2 border border-[var(--color-border)] text-sm font-medium rounded-md text-[var(--color-text)] bg-[var(--color-bg)] hover:bg-[var(--color-bg-muted)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Schedule Items for Selected Day */}
      <div className="bg-[var(--color-card-bg)] rounded-lg shadow-sm">
        <div className="px-6 py-4 border-b border-[var(--color-border)]">
          <h4 className="text-lg font-medium text-[var(--color-text)]">Day {selectedDay} Schedule</h4>
        </div>
        <div className="divide-y divide-[var(--color-border)]">
          {getScheduleItemsForDay(selectedDay).length === 0 ? (
            <div className="p-6 text-center text-[var(--color-text-muted)]">No activities scheduled for Day {selectedDay}</div>
          ) : (
            getScheduleItemsForDay(selectedDay).map((item) => (
              <div key={item.id} className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h5 className="text-lg font-medium text-[var(--color-text)]">{item.activity}</h5>
                    </div>
                    <div className="flex items-center space-x-4 mt-2 text-sm text-[var(--color-text-muted)]">
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
                      <p className="text-sm text-[var(--color-text-muted)] mt-1">{item.description}</p>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => editItem(item)}
                      className="inline-flex items-center px-3 py-2 border border-[var(--color-border)] shadow-sm text-sm font-medium rounded-md text-[var(--color-text)] bg-[var(--color-bg)] hover:bg-[var(--color-bg-muted)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="inline-flex items-center px-3 py-2 border border-red-300 shadow-sm text-sm font-medium rounded-md text-red-700 bg-[var(--color-bg)] hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
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
    </div>
  )
}