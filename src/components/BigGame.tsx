import { useState, useEffect } from 'react'
import { Trophy, Star, Zap, Target, CheckCircle2, Users, Flame, Wind, Award } from 'lucide-react'
import { TEAMS, TeamColor } from '../lib/supabase'
import { useProfile } from '../hooks/useProfile'
import { useCamp } from '../contexts/CampContext'
import { useScoreboard } from '../hooks/useScoreboard'
import Scoreboard from './Scoreboard'

interface Challenge {
  id: string
  title: string
  description: string
  points: number
  icon: React.ComponentType<{ className?: string }>
  category: 'physical' | 'spiritual' | 'creative' | 'team'
}

const CHALLENGES: Challenge[] = [
  { id: 'spirit-chant',   title: 'Team Spirit Chant',     description: 'Perform an original team chant in front of everyone.',    points: 50,  icon: Zap,    category: 'team'      },
  { id: 'bible-trivia',   title: 'Bible Trivia Showdown', description: 'Be first to answer 5 consecutive trivia questions.',        points: 75,  icon: Star,   category: 'spiritual' },
  { id: 'relay-race',     title: 'Relay Race',             description: 'Win the team relay race.',                                  points: 100, icon: Wind,   category: 'physical'  },
  { id: 'verse-recite',   title: 'Verse Recitation',       description: 'Recite the camp verse perfectly from memory.',             points: 75,  icon: Target, category: 'spiritual' },
  { id: 'tug-of-war',     title: 'Tug of War',             description: 'Win the best-of-three tug of war.',                        points: 150, icon: Users,  category: 'physical'  },
  { id: 'campfire-story', title: 'Campfire Story',         description: 'Receive the most votes for best campfire story.',          points: 50,  icon: Flame,  category: 'creative'  },
  { id: 'talent-show',    title: 'Talent Show Act',        description: 'Perform a team talent and earn judge approval.',           points: 100, icon: Award,  category: 'creative'  },
  { id: 'scavenger',      title: 'Scavenger Hunt',         description: 'Complete the full camp-wide scavenger hunt first.',        points: 200, icon: Target, category: 'team'      },
  { id: 'worship-lead',   title: 'Lead Worship',           description: 'Have a team member lead a worship moment.',               points: 75,  icon: Star,   category: 'spiritual' },
  { id: 'grand-finale',   title: 'Grand Finale Challenge', description: 'Win the final all-teams showdown event.',                  points: 300, icon: Trophy, category: 'team'      },
]

const CATEGORY_COLORS: Record<Challenge['category'], string> = {
  physical:  'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400',
  spiritual: 'bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400',
  creative:  'bg-pink-100 text-pink-700 dark:bg-pink-950/40 dark:text-pink-400',
  team:      'bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400',
}

export default function BigGame() {
  const { profile } = useProfile()
  const { currentCamp } = useCamp()
  const { adjustScore } = useScoreboard()
  const [completions, setCompletions] = useState<Record<string, string[]>>({})
  const [awarding, setAwarding] = useState<string | null>(null)

  const storageKey = `bigGame_${currentCamp?.id ?? 'default'}`

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey)
      if (saved) setCompletions(JSON.parse(saved))
    } catch { /* ignore corrupt data */ }
  }, [storageKey])

  const toggleCompletion = async (challengeId: string, teamId: TeamColor) => {
    if (!profile?.is_admin) return
    const key = `${challengeId}:${teamId}`
    if (awarding === key) return

    const current = completions[challengeId] || []
    const alreadyDone = current.includes(teamId)

    if (!alreadyDone) {
      setAwarding(key)
      const challenge = CHALLENGES.find(c => c.id === challengeId)
      if (challenge) {
        await adjustScore(teamId, challenge.points, `Big Game: ${challenge.title}`)
      }
      setAwarding(null)
    }

    const next = alreadyDone
      ? { ...completions, [challengeId]: current.filter(t => t !== teamId) }
      : { ...completions, [challengeId]: [...current, teamId] }

    setCompletions(next)
    localStorage.setItem(storageKey, JSON.stringify(next))
  }

  const totalPossible = CHALLENGES.reduce((sum, c) => sum + c.points, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-orange-500 via-amber-500 to-orange-600 rounded-2xl p-6 text-white shadow-md">
        <div className="flex items-center gap-3 mb-2">
          <Trophy className="h-8 w-8 text-white/90" />
          <div>
            <h1 className="text-2xl font-black tracking-tight">Camp Challenge Board</h1>
            <p className="text-sm text-white/80">Compete in challenges to earn points for your team!</p>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-3 flex-wrap">
          <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-semibold">{CHALLENGES.length} challenges</span>
          <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-semibold">{totalPossible.toLocaleString()} pts available</span>
          {profile?.is_admin && (
            <span className="bg-white/25 border border-white/30 px-3 py-1 rounded-full text-xs font-semibold">Admin: tap team buttons to award points</span>
          )}
        </div>
      </div>

      {/* Challenge grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {CHALLENGES.map(challenge => {
          const completedTeams = completions[challenge.id] || []
          const Icon = challenge.icon

          return (
            <div
              key={challenge.id}
              className={`bg-[var(--color-card-bg)] rounded-2xl border overflow-hidden transition-shadow ${
                completedTeams.length > 0
                  ? 'border-orange-300 dark:border-orange-700 shadow-sm'
                  : 'border-[var(--color-border)]'
              }`}
            >
              <div className="p-4">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-950/40 flex items-center justify-center shrink-0">
                    <Icon className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-0.5">
                      <h3 className="font-bold text-[var(--color-text)] leading-tight text-sm">{challenge.title}</h3>
                      <span className="text-xs font-bold text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-950/40 px-2 py-0.5 rounded-full whitespace-nowrap shrink-0">
                        +{challenge.points}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">{challenge.description}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide ${CATEGORY_COLORS[challenge.category]}`}>
                    {challenge.category}
                  </span>

                  <div className="flex gap-1.5 flex-wrap justify-end">
                    {(Object.entries(TEAMS) as [TeamColor, typeof TEAMS[TeamColor]][]).map(([teamKey, teamConfig]) => {
                      const done = completedTeams.includes(teamKey)
                      const isLoading = awarding === `${challenge.id}:${teamKey}`
                      return (
                        <button
                          key={teamKey}
                          onClick={() => toggleCompletion(challenge.id, teamKey)}
                          disabled={!profile?.is_admin || isLoading}
                          title={profile?.is_admin ? (done ? `Remove ${teamConfig.name} completion` : `Award ${teamConfig.name} ${challenge.points} pts`) : undefined}
                          className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                            done
                              ? 'text-white shadow-sm'
                              : profile?.is_admin
                              ? 'text-[var(--color-text-muted)] bg-[var(--color-bg-muted)] border border-[var(--color-border)] hover:opacity-75 cursor-pointer'
                              : 'text-[var(--color-text-muted)] bg-[var(--color-bg-muted)] cursor-default'
                          }`}
                          style={done ? { background: teamConfig.colorValue } : undefined}
                        >
                          {isLoading
                            ? <span className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                            : done
                            ? <CheckCircle2 className="h-3 w-3" />
                            : null
                          }
                          {teamConfig.name}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {!profile?.is_admin && (
        <p className="text-center text-sm text-[var(--color-text-muted)]">
          Camp staff mark challenge completions — keep competing!
        </p>
      )}

      <Scoreboard />
    </div>
  )
}
