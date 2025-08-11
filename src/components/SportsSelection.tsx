import React, { useState, useEffect } from 'react'
import { Trophy, CheckCircle, XCircle, Save } from 'lucide-react'
import { supabase, TEAMS, type SportsMatch } from '../lib/supabase'
import { useProfile } from '../hooks/useProfile'
import { useLanguage } from '../contexts/LanguageContext'

interface Sport {
  id: string
  name: string
  description: string
  icon: string
  color: string
  participants: number
}

interface UserSportSelection {
  user_id: string
  sport_id: string
  created_at: string
}

export default function SportsSelection() {
  const { profile } = useProfile()
  const { t } = useLanguage()
  const [sports, setSports] = useState<Sport[]>([])
  const [userSelections, setUserSelections] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isAdmin, setIsAdmin] = useState<boolean>(false)

  // Tournament state
  const [matchesBySport, setMatchesBySport] = useState<Record<string, SportsMatch[]>>({})
  const [loadingMatches, setLoadingMatches] = useState<boolean>(false)
  const [statusMessage, setStatusMessage] = useState<string>('')

  const availableSports: Sport[] = [
    {
      id: 'soccer',
      name: t('soccer'),
      description: t('soccerDescription'),
      icon: '⚽',
      color: 'bg-green-500',
      participants: 0
    },
    {
      id: 'dodgeball',
      name: t('dodgeball'),
      description: t('dodgeballDescription'),
      icon: '🏐',
      color: 'bg-red-500',
      participants: 0
    },
    {
      id: 'chairball',
      name: t('chairball'),
      description: t('chairballDescription'),
      icon: '🪑',
      color: 'bg-blue-500',
      participants: 0
    },
    {
      id: 'big-game',
      name: t('bigGame'),
      description: t('bigGameDescription'),
      icon: '🎯',
      color: 'bg-purple-500',
      participants: 0
    },
    {
      id: 'pool-time',
      name: t('poolTime'),
      description: t('poolTimeDescription'),
      icon: '🏊',
      color: 'bg-cyan-500',
      participants: 0
    }
  ]

  useEffect(() => {
    loadSportsData()
    setIsAdmin(Boolean(profile?.is_admin))
  }, [profile])

  // Subscribe to realtime match updates
  useEffect(() => {
    const TOURNAMENT_SPORTS = new Set(['soccer', 'dodgeball', 'chairball'])
    const selectedTournamentSports = userSelections.filter((s) => TOURNAMENT_SPORTS.has(s))
    if (selectedTournamentSports.length === 0) return
    const channel = supabase
      .channel('sports_matches_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sports_matches' }, (payload) => {
        const changed: SportsMatch = payload.new as SportsMatch
        if (!changed || !TOURNAMENT_SPORTS.has(changed.sport_id) || !selectedTournamentSports.includes(changed.sport_id)) return
        setMatchesBySport((prev) => {
          const current = prev[changed.sport_id] || []
          const idx = current.findIndex((m) => m.id === changed.id)
          let updated: SportsMatch[]
          if (idx >= 0) {
            updated = [...current]
            updated[idx] = changed
          } else {
            updated = [...current, changed]
          }
          return { ...prev, [changed.sport_id]: sortMatches(updated) }
        })
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userSelections.join(',')])

  const loadSportsData = async () => {
    try {
      // Load user's current selections
      if (profile) {
        const { data: selections, error: selectionsError } = await supabase
          .from('user_sport_selections')
          .select('sport_id')
          .eq('user_id', profile.id)

        if (!selectionsError && selections) {
          setUserSelections(selections.map(s => s.sport_id))
        }
      }

      // Load participant counts for each sport
      const { data: participantCounts, error: countsError } = await supabase
        .from('user_sport_selections')
        .select('sport_id')

      if (!countsError && participantCounts) {
        const counts = participantCounts.reduce((acc, selection) => {
          acc[selection.sport_id] = (acc[selection.sport_id] || 0) + 1
          return acc
        }, {} as Record<string, number>)

        setSports(availableSports.map(sport => ({
          ...sport,
          participants: counts[sport.id] || 0
        })))
      } else {
        setSports(availableSports)
      }
    } catch (error) {
      console.error('Error loading sports data:', error)
      setSports(availableSports)
    } finally {
      setLoading(false)
    }
  }

  // Add eligibility logic
  const getEligibility = (sportId: string): { eligible: boolean; reason?: string } => {
    if (!profile) return { eligible: false, reason: 'Not logged in' };
    if (sportId === 'chairball' && profile.gender !== 'female') {
      return { eligible: false, reason: 'Chairball is for girls only.' };
    }
    if (sportId === 'soccer' && profile.gender !== 'male') {
      return { eligible: false, reason: 'Soccer is for boys only.' };
    }
    // Dodgeball and others: open to all
    return { eligible: true };
  };

  const toggleSport = async (sportId: string) => {
    if (!profile || saving) return;
    const { eligible, reason } = getEligibility(sportId);
    if (!eligible) {
      alert(reason || 'You are not eligible for this sport.');
      return;
    }

    setSaving(true)
    try {
      const isSelected = userSelections.includes(sportId)

      if (isSelected) {
        // Remove selection
        const { error } = await supabase
          .from('user_sport_selections')
          .delete()
          .eq('user_id', profile.id)
          .eq('sport_id', sportId)

        if (error) throw error

        setUserSelections(prev => prev.filter(id => id !== sportId))
      } else {
        // Add selection using upsert to handle duplicates
        const { error } = await supabase
          .from('user_sport_selections')
          .upsert({
            user_id: profile.id,
            sport_id: sportId
          }, {
            onConflict: 'user_id,sport_id'
          })

        if (error) throw error

        setUserSelections(prev => [...prev, sportId])
      }

      // Reload participant counts
      await loadSportsData()
    } catch (error) {
      console.error('Error updating sport selection:', error)
      alert('Error updating selection. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const getSportCard = (sport: Sport) => {
    const isSelected = userSelections.includes(sport.id);
    const eligibility = getEligibility(sport.id);
    return (
      <div
        key={sport.id}
        className={`relative bg-white rounded-lg shadow-sm border-2 transition-all duration-200 cursor-pointer hover:shadow-md ${
          isSelected ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-gray-300'
        } ${!eligibility.eligible ? 'opacity-50 cursor-not-allowed' : ''}`}
        onClick={() => eligibility.eligible && toggleSport(sport.id)}
        aria-disabled={!eligibility.eligible}
      >
        {/* Selection Indicator */}
        {isSelected && (
          <div className="absolute top-3 right-3">
            <CheckCircle className="h-6 w-6 text-green-500" />
          </div>
        )}
        {/* Sport Header */}
        <div className={`${sport.color} rounded-t-lg p-4 text-white`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">{sport.icon}</span>
              <div>
                <h3 className="font-bold text-lg">{sport.name}</h3>
                <p className="text-sm opacity-90">{sport.participants} {t('participants')}</p>
              </div>
            </div>
          </div>
        </div>
        {/* Sport Details */}
        <div className="p-4">
          <p className="text-gray-600 text-sm mb-4">{sport.description}</p>
          {/* Eligibility Message */}
          {!eligibility.eligible && (
            <div className="text-xs text-red-500 mb-2">{eligibility.reason}</div>
          )}
          {/* Participation Status */}
          <div className="flex items-center justify-between">
            <span className={`text-sm font-medium ${
              isSelected ? 'text-green-600' : 'text-gray-500'
            }`}>
              {isSelected ? t('youreParticipating') : t('clickToJoin')}
            </span>
            {saving && isSelected && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-500"></div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // ---------- Round-robin scheduling & persistence ----------
  const TEAM_KEYS: Array<keyof typeof TEAMS> = ['red', 'blue', 'green', 'yellow']

  const roundRobinPairs = (): Array<[string, string]> => {
    // All unique pairs of 4 teams
    const keys = TEAM_KEYS
    const pairs: Array<[string, string]> = []
    for (let i = 0; i < keys.length; i++) {
      for (let j = i + 1; j < keys.length; j++) {
        pairs.push([keys[i], keys[j]])
      }
    }
    return pairs
  }

  const sortMatches = (matches: SportsMatch[]): SportsMatch[] => {
    return [...matches].sort((a, b) => {
      const at = a.scheduled_time ? new Date(a.scheduled_time).getTime() : 0
      const bt = b.scheduled_time ? new Date(b.scheduled_time).getTime() : 0
      if (at !== bt) return at - bt
      // finals last
      if (a.final && !b.final) return 1
      if (!a.final && b.final) return -1
      return a.team_a.localeCompare(b.team_a)
    })
  }

  const ensureScheduleForSport = async (sportId: string) => {
    const TOURNAMENT_SPORTS = new Set(['soccer', 'dodgeball', 'chairball'])
    if (!TOURNAMENT_SPORTS.has(sportId)) return
    // Check if schedule exists
    const { data: existing, error } = await supabase
      .from('sports_matches')
      .select('*')
      .eq('sport_id', sportId)

    if (error) {
      console.error('Error loading matches:', error)
      return
    }

    if (existing && existing.length > 0) {
      setMatchesBySport((prev) => ({ ...prev, [sportId]: sortMatches(existing) }))
      return
    }

    if (!isAdmin) {
      setStatusMessage('Schedule will be generated by admins soon.')
      return
    }

    // Generate and insert round-robin
    const pairs = roundRobinPairs()
    const rows = pairs.map(([a, b]) => ({
      sport_id: sportId,
      team_a: a,
      team_b: b,
      status: 'scheduled' as const,
      final: false
    }))
    const { data: inserted, error: insertError } = await supabase
      .from('sports_matches')
      .insert(rows)
      .select('*')

    if (insertError) {
      console.error('Error creating schedule:', insertError)
      return
    }
    setMatchesBySport((prev) => ({ ...prev, [sportId]: sortMatches(inserted || []) }))
  }

  const fetchMatchesForSelectedSports = async () => {
    const TOURNAMENT_SPORTS = new Set(['soccer', 'dodgeball', 'chairball'])
    const selectedTournamentSports = userSelections.filter((s) => TOURNAMENT_SPORTS.has(s))
    if (selectedTournamentSports.length === 0) {
      setMatchesBySport({})
      return
    }
    setLoadingMatches(true)
    try {
      const { data, error } = await supabase
        .from('sports_matches')
        .select('*')
        .in('sport_id', selectedTournamentSports)

      if (error) throw error

      const grouped: Record<string, SportsMatch[]> = {}
      ;(data || []).forEach((m) => {
        if (!grouped[m.sport_id]) grouped[m.sport_id] = []
        grouped[m.sport_id].push(m)
      })
      Object.keys(grouped).forEach((sid) => (grouped[sid] = sortMatches(grouped[sid])))
      setMatchesBySport(grouped)

      // For any selected sport with no matches, try to ensure schedule
      await Promise.all(
        selectedTournamentSports
          .filter((sid) => !grouped[sid] || grouped[sid].length === 0)
          .map((sid) => ensureScheduleForSport(sid))
      )
    } catch (err) {
      console.error('Error fetching matches:', err)
    } finally {
      setLoadingMatches(false)
    }
  }

  useEffect(() => {
    fetchMatchesForSelectedSports()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userSelections.join(','), isAdmin])

  // ---------- Admin edits ----------
  const updateMatch = async (match: SportsMatch, updates: Partial<SportsMatch>) => {
    if (!isAdmin) return
    const next = { ...match, ...updates }
    // optimistic update
    setMatchesBySport((prev) => {
      const list = prev[match.sport_id] || []
      const idx = list.findIndex((m) => m.id === match.id)
      if (idx < 0) return prev
      const updated = [...list]
      updated[idx] = next
      return { ...prev, [match.sport_id]: sortMatches(updated) }
    })

    const { error } = await supabase
      .from('sports_matches')
      .update(updates)
      .eq('id', match.id)
    if (error) {
      console.error('Error updating match:', error)
      // reload this sport to reconcile
      await ensureScheduleForSport(match.sport_id)
    }
  }

  const onSaveScore = async (match: SportsMatch, scoreA: number | null, scoreB: number | null) => {
    // Normalize scores
    const sA = scoreA == null || Number.isNaN(scoreA) ? null : Math.max(0, Math.floor(scoreA))
    const sB = scoreB == null || Number.isNaN(scoreB) ? null : Math.max(0, Math.floor(scoreB))
    const status = sA != null && sB != null ? 'completed' : 'scheduled'
    await updateMatch(match, { score_a: sA, score_b: sB, status })
  }

  // ---------- Standings & finals ----------
  type StandingRow = {
    team: keyof typeof TEAMS
    played: number
    wins: number
    draws: number
    losses: number
    goalsFor: number
    goalsAgainst: number
    points: number
  }

  const computeStandings = (matches: SportsMatch[]): StandingRow[] => {
    const table: Record<keyof typeof TEAMS, StandingRow> = {
      red: initRow('red'),
      blue: initRow('blue'),
      green: initRow('green'),
      yellow: initRow('yellow')
    }
    matches.filter((m) => !m.final && m.status === 'completed' && m.score_a != null && m.score_b != null).forEach((m) => {
      const a = m.team_a as keyof typeof TEAMS
      const b = m.team_b as keyof typeof TEAMS
      const sa = m.score_a || 0
      const sb = m.score_b || 0
      table[a].played += 1
      table[b].played += 1
      table[a].goalsFor += sa
      table[a].goalsAgainst += sb
      table[b].goalsFor += sb
      table[b].goalsAgainst += sa
      if (sa > sb) {
        table[a].wins += 1
        table[b].losses += 1
        table[a].points += 3
      } else if (sa < sb) {
        table[b].wins += 1
        table[a].losses += 1
        table[b].points += 3
      } else {
        table[a].draws += 1
        table[b].draws += 1
        table[a].points += 1
        table[b].points += 1
      }
    })
    const rows = Object.values(table)
    const headToHead = (team1: keyof typeof TEAMS, team2: keyof typeof TEAMS): number => {
      // return positive if team1 ahead, negative if team2 ahead, 0 if equal
      const match = matches.find(
        (m) => !m.final && m.status === 'completed' && ((m.team_a === team1 && m.team_b === team2) || (m.team_a === team2 && m.team_b === team1))
      )
      if (!match || match.score_a == null || match.score_b == null) return 0
      const aAsT1 = match.team_a === team1
      const scoreT1 = aAsT1 ? match.score_a : match.score_b
      const scoreT2 = aAsT1 ? match.score_b : match.score_a
      if (scoreT1 > scoreT2) return 1
      if (scoreT1 < scoreT2) return -1
      return 0
    }

    rows.sort((r1, r2) => {
      if (r2.points !== r1.points) return r2.points - r1.points
      // tie-breaker 1: head-to-head result if a single match exists
      const h2h = headToHead(r1.team, r2.team)
      if (h2h !== 0) return -h2h // higher first
      // tie-breaker 2: goal difference
      const gd1 = r1.goalsFor - r1.goalsAgainst
      const gd2 = r2.goalsFor - r2.goalsAgainst
      if (gd2 !== gd1) return gd2 - gd1
      // tie-breaker 3: goals for
      if (r2.goalsFor !== r1.goalsFor) return r2.goalsFor - r1.goalsFor
      return 0
    })
    return rows
  }

  const initRow = (team: keyof typeof TEAMS): StandingRow => ({
    team,
    played: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    points: 0
  })

  const maybeCreateFinal = async (sportId: string) => {
    const list = matchesBySport[sportId] || []
    const nonFinal = list.filter((m) => !m.final)
    const allCompleted = nonFinal.length >= 6 && nonFinal.every((m) => m.status === 'completed')
    if (!allCompleted) return
    // Already has a final
    if (list.some((m) => m.final)) return
    if (!isAdmin) return
    // Determine top 2
    const standings = computeStandings(nonFinal)
    const [t1, t2] = standings.slice(0, 2)
    const { error } = await supabase
      .from('sports_matches')
      .insert({ sport_id: sportId, team_a: t1.team, team_b: t2.team, status: 'scheduled', final: true })
    if (error) console.error('Error creating final match:', error)
  }

  useEffect(() => {
    // Whenever matches change for any sport, check if final should be created
    const TOURNAMENT_SPORTS = new Set(['soccer', 'dodgeball', 'chairball'])
    const selectedTournamentSports = userSelections.filter((s) => TOURNAMENT_SPORTS.has(s))
    selectedTournamentSports.forEach((sid) => {
      void maybeCreateFinal(sid)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(matchesBySport)])

  const formatDateTimeLocal = (iso: string | null): string => {
    if (!iso) return ''
    const d = new Date(iso)
    const pad = (n: number) => String(n).padStart(2, '0')
    const yyyy = d.getFullYear()
    const mm = pad(d.getMonth() + 1)
    const dd = pad(d.getDate())
    const hh = pad(d.getHours())
    const mi = pad(d.getMinutes())
    return `${yyyy}-${mm}-${dd}T${hh}:${mi}`
  }

  const parseDateTimeLocal = (val: string): string | null => {
    if (!val) return null
    const dt = new Date(val)
    return isNaN(dt.getTime()) ? null : dt.toISOString()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center space-x-3">
          <Trophy className="h-8 w-8 text-orange-500" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('sportsSelection')}</h1>
            <p className="text-gray-600">{t('chooseSportsToParticipate')}</p>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">{t('howItWorks')}</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• {t('clickToJoinOrLeave')}</li>
          <li>• {t('participateInMultipleSports')}</li>
          <li>• {t('changesSavedAutomatically')}</li>
        </ul>
      </div>

      {/* Sports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sports.map(sport => getSportCard(sport))}
      </div>

      {/* Summary */}
      {userSelections.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('yourSports')}</h3>
          <div className="flex flex-wrap gap-2">
            {userSelections.map(sportId => {
              const sport = sports.find(s => s.id === sportId)
              return sport ? (
                <span
                  key={sportId}
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${sport.color} text-white`}
                >
                  {sport.icon} {sport.name}
                </span>
              ) : null
            })}
          </div>
          <p className="text-sm text-gray-600 mt-3">
            {t('participatingInSports')} {userSelections.length} {userSelections.length !== 1 ? t('teams') : t('teams')}
          </p>
          {/* Schedules and standings for selected sports */}
          <div className="mt-6 space-y-8">
            {loadingMatches && (
              <div className="text-sm text-gray-500">Loading schedule…</div>
            )}
            {statusMessage && (
              <div className="text-xs text-gray-500">{statusMessage}</div>
            )}
            {userSelections.filter((sid) => new Set(['soccer','dodgeball','chairball']).has(sid)).map((sportId) => {
              const list = matchesBySport[sportId] || []
              const standings = computeStandings(list)
              const sport = sports.find((s) => s.id === sportId)
              return (
                <div key={sportId} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-gray-900">{sport?.name || sportId} Schedule</h4>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="text-left text-gray-600">
                          <th className="py-2 pr-4">Match</th>
                          <th className="py-2 pr-4">Time</th>
                          <th className="py-2 pr-4">Score</th>
                          {isAdmin && <th className="py-2 pr-4">Admin</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {list.map((m) => (
                          <tr key={m.id} className="border-t">
                            <td className="py-2 pr-4">
                              <span className="font-medium">
                                {TEAMS[m.team_a as keyof typeof TEAMS]?.name} vs {TEAMS[m.team_b as keyof typeof TEAMS]?.name}
                              </span>
                              {m.final && (
                                <span className="ml-2 inline-block text-xs px-2 py-0.5 rounded bg-yellow-100 text-yellow-700">Final</span>
                              )}
                            </td>
                            <td className="py-2 pr-4">
                              {isAdmin ? (
                                <input
                                  type="datetime-local"
                                  className="border rounded px-2 py-1 text-sm"
                                  value={formatDateTimeLocal(m.scheduled_time)}
                                  onChange={(e) => updateMatch(m, { scheduled_time: parseDateTimeLocal(e.target.value) })}
                                />
                              ) : (
                                <span className="text-gray-700">
                                  {m.scheduled_time ? new Date(m.scheduled_time).toLocaleString() : 'TBD'}
                                </span>
                              )}
                            </td>
                            <td className="py-2 pr-4">
                              {isAdmin ? (
                                <div className="flex items-center gap-1">
                                  <input
                                    type="number"
                                    min={0}
                                    className="w-16 border rounded px-2 py-1 text-sm"
                                    defaultValue={m.score_a ?? ''}
                                    onBlur={(e) => onSaveScore(m, e.target.value === '' ? null : Number(e.target.value), m.score_b)}
                                  />
                                  <span className="px-1">-</span>
                                  <input
                                    type="number"
                                    min={0}
                                    className="w-16 border rounded px-2 py-1 text-sm"
                                    defaultValue={m.score_b ?? ''}
                                    onBlur={(e) => onSaveScore(m, m.score_a, e.target.value === '' ? null : Number(e.target.value))}
                                  />
                                </div>
                              ) : (
                                <span className="text-gray-800">
                                  {m.score_a != null && m.score_b != null ? `${m.score_a} - ${m.score_b}` : '—'}
                                </span>
                              )}
                            </td>
                            {isAdmin && (
                              <td className="py-2 pr-4 text-sm text-gray-600">
                                <select
                                  className="border rounded px-2 py-1"
                                  value={m.status}
                                  onChange={(e) => updateMatch(m, { status: e.target.value })}
                                >
                                  <option value="scheduled">Scheduled</option>
                                  <option value="completed">Completed</option>
                                  <option value="cancelled">Cancelled</option>
                                </select>
                              </td>
                            )}
                          </tr>
                        ))}
                        {list.length === 0 && (
                          <tr>
                            <td className="py-4 text-gray-500" colSpan={isAdmin ? 4 : 3}>No matches yet.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Standings */}
                  <div className="mt-6">
                    <h5 className="font-semibold text-gray-900 mb-2">Standings</h5>
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm">
                        <thead>
                          <tr className="text-left text-gray-600">
                            <th className="py-2 pr-4">Team</th>
                            <th className="py-2 pr-4">P</th>
                            <th className="py-2 pr-4">W</th>
                            <th className="py-2 pr-4">D</th>
                            <th className="py-2 pr-4">L</th>
                            <th className="py-2 pr-4">GF</th>
                            <th className="py-2 pr-4">GA</th>
                            <th className="py-2 pr-4">Pts</th>
                          </tr>
                        </thead>
                        <tbody>
                          {standings.map((row) => (
                            <tr key={row.team} className="border-t">
                              <td className="py-2 pr-4 font-medium">{TEAMS[row.team].name}</td>
                              <td className="py-2 pr-4">{row.played}</td>
                              <td className="py-2 pr-4">{row.wins}</td>
                              <td className="py-2 pr-4">{row.draws}</td>
                              <td className="py-2 pr-4">{row.losses}</td>
                              <td className="py-2 pr-4">{row.goalsFor}</td>
                              <td className="py-2 pr-4">{row.goalsAgainst}</td>
                              <td className="py-2 pr-4 font-semibold">{row.points}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Final note */}
                  <div className="mt-3 text-xs text-gray-500">
                    Finals are auto-created once all group matches are completed. Top two teams qualify.
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* No Selections */}
      {userSelections.length === 0 && (
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">{t('noSportsSelectedYet')}</h3>
          <p className="text-gray-600">{t('clickOnAnySportToStart')}</p>
        </div>
      )}
    </div>
  )
} 