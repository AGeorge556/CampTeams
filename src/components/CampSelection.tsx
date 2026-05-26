import { useState, useEffect } from 'react'
import { Calendar, Users, CheckCircle, Clock, Tent, ArrowRight, Info } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { useCamp } from '../contexts/CampContext'
import { useToast } from './Toast'
import Button from './ui/Button'
import LoadingSpinner from './LoadingSpinner'

interface Camp {
  id: string
  name: string
  season: 'winter' | 'summer'
  year: number
  start_date: string
  end_date: string
  is_active: boolean
  registration_open: boolean
  max_participants: number | null
  description: string
  registered_count: number
  spots_available: number | null
  bible_verse: string | null
  verse_reference: string | null
  theme_primary_color: string | null
  theme_secondary_color: string | null
  custom_content: Record<string, any> | null
}

interface CampRegistration {
  id: string
  camp_id: string
  user_id: string
}

export default function CampSelection() {
  const { user } = useAuth()
  const { selectCamp } = useCamp()
  const { addToast } = useToast()
  const [camps, setCamps] = useState<Camp[]>([])
  const [registrations, setRegistrations] = useState<CampRegistration[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCampsAndRegistrations()
  }, [user])

  const loadCampsAndRegistrations = async () => {
    try {
      const { data: campsData, error: campsError } = await supabase
        .rpc('get_camps_with_stats')

      if (campsError) throw campsError

      setCamps(Array.isArray(campsData) ? campsData : [])

      if (user) {
        const { data: regsData, error: regsError } = await supabase
          .from('camp_registrations')
          .select('id, camp_id, user_id')
          .eq('user_id', user.id)

        if (regsError) throw regsError
        setRegistrations(Array.isArray(regsData) ? regsData : [])
      }
    } catch (error: any) {
      if (error?.code === 'PGRST202' || error?.message?.includes('get_camps_with_stats')) {
        addToast({
          type: 'error',
          title: 'Database Setup Required',
          message: 'The multi-camp system needs to be set up. Please run the database migrations.'
        })
      } else {
        addToast({ type: 'error', title: 'Error', message: 'Failed to load camps. Please try again.' })
      }
      setCamps([])
      setRegistrations([])
    } finally {
      setLoading(false)
    }
  }

  const isRegistered = (campId: string) => registrations.some(reg => reg.camp_id === campId)

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  if (loading) {
    return <LoadingSpinner fullScreen text="Loading camps..." />
  }

  return (
    <div className="min-h-screen bg-[var(--gradient-app-bg)] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-[var(--color-text)] mb-4">
            Choose Your Camp
          </h1>
          <p className="text-lg text-[var(--color-text-muted)] max-w-2xl mx-auto">
            Select a camp to join. Each camp has its own teams, schedule, and activities!
          </p>
        </div>

        {/* Camps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {camps.map((camp) => {
            const registered = isRegistered(camp.id)
            const isFull = camp.max_participants !== null && camp.spots_available !== null && camp.spots_available <= 0
            const canRegister = camp.registration_open && !isFull

            return (
              <div
                key={camp.id}
                className={`relative rounded-xl border-2 transition-all duration-300 bg-[var(--color-card-bg)] ${
                  camp.is_active
                    ? 'border-orange-300 dark:border-orange-700 shadow-lg'
                    : 'border-[var(--color-border)] opacity-75'
                } hover:shadow-xl transform hover:-translate-y-1`}
              >
                {camp.is_active && (
                  <div className="absolute -top-3 -right-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-1 rounded-full text-sm font-semibold shadow-lg flex items-center space-x-1">
                    <CheckCircle className="w-4 h-4" />
                    <span>Active</span>
                  </div>
                )}

                {registered && (
                  <div className="absolute -top-3 -left-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white px-4 py-1 rounded-full text-sm font-semibold shadow-lg flex items-center space-x-1">
                    <CheckCircle className="w-4 h-4" />
                    <span>Registered</span>
                  </div>
                )}

                <div className="p-6">
                  {/* Camp Icon & Name */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-3 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 text-white">
                        <Tent className="w-8 h-8" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-[var(--color-text)]">
                          {camp.name}
                        </h3>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-[var(--color-text-muted)] mb-4">
                    {camp.description}
                  </p>

                  {/* Camp Details */}
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center space-x-2 text-sm">
                      <Calendar className="w-4 h-4 text-orange-500" />
                      <span className="text-[var(--color-text)]">
                        {formatDate(camp.start_date)} – {formatDate(camp.end_date)}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2 text-sm">
                      <Users className="w-4 h-4 text-orange-500" />
                      <span className="text-[var(--color-text)]">
                        {camp.max_participants !== null
                          ? `${camp.registered_count} / ${camp.max_participants} registered`
                          : `${camp.registered_count} registered`
                        }
                      </span>
                      {isFull && (
                        <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full font-semibold">
                          FULL
                        </span>
                      )}
                    </div>

                    {!camp.registration_open && (
                      <div className="flex items-center space-x-2 text-sm text-amber-600">
                        <Clock className="w-4 h-4" />
                        <span>Registration closed</span>
                      </div>
                    )}
                  </div>

                  {/* Progress Bar */}
                  {camp.max_participants !== null && (
                    <div className="mb-4">
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="h-2 rounded-full bg-gradient-to-r from-orange-500 to-red-600 transition-all duration-500"
                          style={{ width: `${Math.min((camp.registered_count / camp.max_participants) * 100, 100)}%` }}
                        />
                      </div>
                      <p className="text-xs text-[var(--color-text-muted)] mt-1">
                        {camp.spots_available} spots available
                      </p>
                    </div>
                  )}

                  {/* Action Button */}
                  <Button
                    onClick={() => selectCamp(camp.id)}
                    disabled={!canRegister && !registered}
                    className={`w-full ${
                      registered
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'
                        : canRegister
                        ? 'bg-gradient-to-r from-orange-500 to-red-600 hover:opacity-90'
                        : 'bg-gray-400 cursor-not-allowed'
                    }`}
                    icon={registered ? <CheckCircle /> : <ArrowRight />}
                  >
                    {registered
                      ? 'Enter Camp'
                      : isFull
                      ? 'Camp Full'
                      : !camp.registration_open
                      ? 'Registration Closed'
                      : 'Join Camp'}
                  </Button>

                  {!camp.is_active && (
                    <div className="mt-3 flex items-center justify-center space-x-2 text-xs text-[var(--color-text-muted)]">
                      <Info className="w-4 h-4" />
                      <span>This camp will open soon</span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Help Text */}
        <div className="text-center text-sm text-[var(--color-text-muted)] mt-8">
          <p>Each camp is independent with its own teams, schedule, gallery, and activities.</p>
          <p className="mt-2">You can register for multiple camps!</p>
        </div>
      </div>
    </div>
  )
}
