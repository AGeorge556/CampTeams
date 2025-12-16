import { useState, useEffect } from 'react'
import { Users, Save, AlertCircle } from 'lucide-react'
import { useCamp } from '../contexts/CampContext'
import { useToast } from './Toast'
import { TEAMS, TeamColor } from '../lib/supabase'
import Button from './ui/Button'
import { supabase } from '../lib/supabase'
import { useTeamBalancing } from '../hooks/useTeamBalancing'

export default function TeamSelection() {
  const { currentCamp, currentRegistration, refreshRegistration } = useCamp()
  const { addToast } = useToast()
  const { canTeamAcceptPlayer } = useTeamBalancing()
  const [selectedTeam, setSelectedTeam] = useState<TeamColor>('red')
  const [loading, setLoading] = useState(false)
  const [teamStatus, setTeamStatus] = useState<Record<TeamColor, { canAccept: boolean; reason: string }>>({} as any)

  // Check team availability on mount and when selection changes
  useEffect(() => {
    const checkTeamAvailability = async () => {
      if (!currentRegistration) return

      const status: Record<TeamColor, { canAccept: boolean; reason: string }> = {} as any

      for (const team of TEAMS) {
        const result = await canTeamAcceptPlayer(team.value, currentRegistration.gender)
        status[team.value] = result
      }

      setTeamStatus(status)
    }

    checkTeamAvailability()
  }, [currentRegistration])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!currentRegistration) return

    // Validate team can accept player
    const canAccept = teamStatus[selectedTeam]?.canAccept
    if (!canAccept) {
      addToast({
        type: 'error',
        title: 'Cannot Join Team',
        message: teamStatus[selectedTeam]?.reason || 'This team cannot accept more players'
      })
      return
    }

    setLoading(true)

    try {
      const { error } = await supabase
        .from('camp_registrations')
        .update({
          current_team: selectedTeam,
          switches_remaining: 3
        })
        .eq('id', currentRegistration.id)

      if (error) throw error

      addToast({
        type: 'success',
        title: 'Team Selected!',
        message: `You've joined the ${selectedTeam} team!`
      })

      // Refresh the registration data
      await refreshRegistration()
    } catch (error: any) {
      console.error('Error selecting team:', error)
      addToast({
        type: 'error',
        title: 'Error',
        message: error.message || 'Failed to select team. Please try again.'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--gradient-app-bg)] px-4">
      <div className="max-w-2xl w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center">
            <Users className="h-16 w-16 text-[var(--color-primary)]" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-[var(--color-text)]">
            Welcome, {currentRegistration?.full_name}!
          </h2>
          <p className="mt-2 text-lg text-[var(--color-text-muted)]">
            Select your team for {currentCamp?.name}
          </p>
        </div>

        <form
          className="mt-8 space-y-6 bg-[var(--color-card-bg)] p-8 rounded-lg border border-[var(--color-border)] shadow-lg"
          onSubmit={handleSubmit}
        >
          <div>
            <label className="block text-sm font-medium text-[var(--color-text)] mb-4">
              Choose Your Team
            </label>
            <div className="grid grid-cols-2 gap-4">
              {TEAMS.map((team) => {
                const isAvailable = teamStatus[team.value]?.canAccept !== false
                return (
                <button
                  key={team.value}
                  type="button"
                  onClick={() => isAvailable && setSelectedTeam(team.value)}
                  disabled={!isAvailable}
                  className={`relative p-6 rounded-lg border-2 transition-all ${
                    selectedTeam === team.value
                      ? `border-${team.value}-500 bg-${team.value}-50 ring-2 ring-${team.value}-500 ring-opacity-50`
                      : 'border-[var(--color-border)] bg-[var(--color-bg)] hover:border-[var(--color-border-hover)]'
                  } ${!isAvailable ? 'opacity-50 cursor-not-allowed' : ''}`}
                  style={{
                    borderColor: selectedTeam === team.value ? team.color : undefined,
                    backgroundColor: selectedTeam === team.value ? `${team.color}20` : undefined
                  }}
                >
                  {selectedTeam === team.value && isAvailable && (
                    <div
                      className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center text-white text-sm"
                      style={{ backgroundColor: team.color }}
                    >
                      ✓
                    </div>
                  )}
                  {!isAvailable && (
                    <div className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center bg-red-500 text-white text-sm">
                      <AlertCircle className="w-4 h-4" />
                    </div>
                  )}
                  <div className="flex flex-col items-center space-y-3">
                    <div
                      className="w-16 h-16 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: `${team.color}30` }}
                    >
                      <div
                        className="w-12 h-12 rounded-full"
                        style={{ backgroundColor: team.color }}
                      />
                    </div>
                    <span
                      className="text-lg font-semibold"
                      style={{ color: selectedTeam === team.value ? team.color : 'var(--color-text)' }}
                    >
                      {team.label}
                    </span>
                    {!isAvailable && (
                      <span className="text-xs text-red-500 text-center">
                        Full
                      </span>
                    )}
                  </div>
                </button>
              )})}
            </div>
          </div>

          <div className="pt-4">
            <Button
              type="submit"
              loading={loading}
              icon={<Save />}
              className="w-full"
            >
              {loading ? 'Joining Team...' : 'Join Team'}
            </Button>
          </div>

          <div className="text-center text-sm text-[var(--color-text-muted)]">
            <p>You can switch teams up to 3 times later</p>
          </div>
        </form>
      </div>
    </div>
  )
}
