import { useState } from 'react'
import { useScoreboard } from '../hooks/useScoreboard'
import { TEAMS, TeamColor } from '../lib/supabase'
import Button from './ui/Button'
import LoadingSpinner from './LoadingSpinner'

export default function ScoreboardAdmin() {
  const { events, loading, updating, error, adjustScore, reload } = useScoreboard()
  const [selectedTeam, setSelectedTeam] = useState<TeamColor>('red')
  const [delta, setDelta] = useState<number>(1)
  const [reason, setReason] = useState<string>('')
  
  if (loading) return <LoadingSpinner text="Loading scoreboard..." />

  return (
    <div className="space-y-6">
      <div className="bg-[var(--color-card-bg)] rounded-lg shadow p-6 border border-[var(--color-border)]">
        <h2 className="text-xl font-bold text-[var(--color-text)] mb-4">Scoreboard Admin</h2>
  {error && <div className="text-[var(--color-error,#dc2626)] mb-3">{error}</div>}
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-sm text-[var(--color-text-muted)] mb-1">Team</label>
            <select value={selectedTeam} onChange={e => setSelectedTeam(e.target.value as TeamColor)} className="border rounded px-3 py-2 border-[var(--color-border)] bg-[var(--color-card-bg)] text-[var(--color-text)]">
              {Object.keys(TEAMS).map(t => (
                <option key={t} value={t}>{TEAMS[t as TeamColor].name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-[var(--color-text-muted)] mb-1">Points (+/-)</label>
            <input type="number" value={delta} onChange={e => setDelta(Number(e.target.value))} className="border rounded px-3 py-2 w-28 border-[var(--color-border)] bg-[var(--color-card-bg)] text-[var(--color-text)]" />
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm text-[var(--color-text-muted)] mb-1">Reason (optional)</label>
            <input type="text" value={reason} onChange={e => setReason(e.target.value)} className="border rounded px-3 py-2 w-full border-[var(--color-border)] bg-[var(--color-card-bg)] text-[var(--color-text)]" />
          </div>
          <Button onClick={async () => {
            const res = await adjustScore(selectedTeam, delta, reason)
            if (!res.success) {
              alert(res.error)
              return
            }
            // Refresh scores in-app and also refresh page as requested
            try { await reload() } catch {}
            setTimeout(() => {
              try { window.location.reload() } catch {}
            }, 150)
          }} loading={updating}>
            Apply
          </Button>
        </div>
      </div>

      <div className="bg-[var(--color-card-bg)] rounded-lg shadow p-6 border border-[var(--color-border)]">
        <h3 className="text-lg font-semibold text-[var(--color-text)] mb-3">Recent Changes</h3>
        <div className="space-y-2 max-h-96 overflow-auto">
          {events.map(ev => (
            <div key={ev.id} className="flex items-center justify-between border rounded p-2 border-[var(--color-border)] bg-[var(--color-card-bg)]">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${TEAMS[ev.team_id].color}`} />
                <div className="font-medium">{TEAMS[ev.team_id].name}</div>
                <div className={ev.delta >= 0 ? 'font-semibold' : 'font-semibold'} style={{ color: ev.delta >= 0 ? 'var(--color-success,#16a34a)' : 'var(--color-error,#dc2626)' }}>
                  {ev.delta >= 0 ? `+${ev.delta}` : ev.delta}
                </div>
                {ev.reason && <div className="text-[var(--color-text-muted)]">- {ev.reason}</div>}
              </div>
              <div className="text-xs text-[var(--color-text-muted)]">{new Date(ev.created_at).toLocaleString()}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
