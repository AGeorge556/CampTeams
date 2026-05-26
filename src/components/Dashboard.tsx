import React, { useState, useEffect, useRef, useMemo } from 'react'
import { Users, UserPlus, Download, RefreshCw, Calendar, Trophy, Camera, Megaphone } from 'lucide-react'
import { useProfile } from '../hooks/useProfile'
import { useCamp } from '../contexts/CampContext'
import { TEAMS, TeamColor, supabase } from '../lib/supabase'
import AdminPanel from './AdminPanel'
import PlayerLists from './PlayerLists'
import CountdownTimer from './CountdownTimer'
import Scoreboard from './Scoreboard'
import CampHero from './CampHero'
import { useLanguage } from '../contexts/LanguageContext'
import { SkeletonCard } from './LoadingSpinner'
import { getGradeDisplayWithNumber } from '../lib/utils'
import { useToast } from './Toast'
import { useScoreboard } from '../hooks/useScoreboard'

interface BibleVerse {
  verse: string
  reference: string
  translation: string
}

interface QuickAction {
  id: string
  title: string
  icon: React.ComponentType<{ className?: string }>
  action: () => void
  color: string
  available: boolean
}

interface DashboardProps {
  onPageChange?: (page: string) => void
}

export default function Dashboard({ onPageChange }: DashboardProps) {
  const { profile } = useProfile()
  const { currentCamp, currentRegistration } = useCamp()
  const { addToast } = useToast()
  const { t } = useLanguage()
  const [optInLoading, setOptInLoading] = useState(false)
  const [currentVerse, setCurrentVerse] = useState<BibleVerse | null>(null)
  const [backgroundImage, setBackgroundImage] = useState<string>('')
  const [generatingVerse, setGeneratingVerse] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [announcement, setAnnouncement] = useState<string | null>(null)
  const verseRef = useRef<HTMLDivElement>(null)
  const [mySportIds, setMySportIds] = useState<string[]>([])
  const { scores } = useScoreboard()

  useEffect(() => {
    if (!currentCamp?.id) return
    setAnnouncement((currentCamp.custom_content as any)?.announcement || null)
    const channel = supabase
      .channel(`camp_announcement_${currentCamp.id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'camps', filter: `id=eq.${currentCamp.id}` },
        (payload: any) => setAnnouncement(payload.new?.custom_content?.announcement || null)
      )
      .subscribe()
    return () => { channel.unsubscribe() }
  }, [currentCamp?.id])

  // Load user's sport selections
  useEffect(() => {
    if (!profile?.id) return
    supabase
      .from('user_sport_selections')
      .select('sport_id')
      .eq('user_id', profile.id)
      .then(({ data }) => {
        if (data) setMySportIds(data.map((r: { sport_id: string }) => r.sport_id))
      })
  }, [profile?.id])

  const daysUntilCamp = useMemo(() => {
    if (!currentCamp?.start_date) return 0
    const campStart = new Date(currentCamp.start_date)
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    return Math.ceil((campStart.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  }, [currentCamp?.start_date])

  const sportLabels: Record<string, string> = {
    soccer: 'Soccer',
    dodgeball: 'Dodgeball',
    chairball: 'Chairball',
    'big-game': 'Big Game',
    'pool-time': 'Pool Time',
  }

  const quickActions: QuickAction[] = [
    {
      id: 'sports',
      title: t('sportsSelection'),
      icon: Trophy,
      action: () => onPageChange?.('sports'),
      color: 'bg-gradient-to-br from-orange-500 to-amber-600',
      available: true,
    },
    {
      id: 'schedule',
      title: t('schedule'),
      icon: Calendar,
      action: () => onPageChange?.('schedule'),
      color: 'bg-gradient-to-br from-emerald-600 to-emerald-700',
      available: profile?.is_admin || false,
    },
    {
      id: 'gallery-moderation',
      title: t('photoModeration'),
      icon: Camera,
      action: () => onPageChange?.('gallery-moderation'),
      color: 'bg-gradient-to-br from-amber-700 to-orange-800',
      available: profile?.is_admin || false,
    },
  ]

  const motivationalVerses: BibleVerse[] = [
    { verse: t('philippiansVerse'), reference: t('philippians'), translation: t('niv') },
    { verse: t('jeremiahVerse'),    reference: t('jeremiah'),    translation: t('niv') },
    { verse: t('joshuaVerse'),      reference: t('joshua'),      translation: t('niv') },
    { verse: t('proverbsVerse'),    reference: t('proverbs'),    translation: t('niv') },
    { verse: t('psalmsVerse'),      reference: t('psalms'),      translation: t('niv') },
    { verse: t('isaiahVerse'),      reference: t('isaiah'),      translation: t('niv') },
    { verse: t('matthewVerse'),     reference: t('matthew'),     translation: t('niv') },
    { verse: t('galatiansVerse'),   reference: t('galatians'),   translation: t('niv') },
    { verse: t('psalms23Verse'),    reference: t('psalms') + ' 23:1-3', translation: t('niv') },
    { verse: t('romansVerse'),      reference: t('romans'),      translation: t('niv') },
  ]

  const scenicBackgrounds = [
    'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1200&h=800&fit=crop&auto=format',
    'https://images.unsplash.com/photo-1465101046530-73398c7f28ca?w=1200&h=800&fit=crop&auto=format',
    'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1200&h=800&fit=crop&auto=format',
    'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1200&h=800&fit=crop&auto=format',
    'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=1200&h=800&fit=crop&auto=format',
    'https://images.unsplash.com/photo-1468779060412-202c7ab43a10?w=1200&h=800&fit=crop&auto=format',
    'https://images.unsplash.com/photo-1465156799763-2c087c332922?w=1200&h=800&fit=crop&auto=format',
    'https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=1200&h=800&fit=crop&auto=format',
  ]

  useEffect(() => {
    const lastVerseDate = localStorage.getItem('lastVerseDate')
    const today = new Date().toDateString()
    if (lastVerseDate !== today) {
      generateRandomVerse()
      localStorage.setItem('lastVerseDate', today)
    } else {
      const savedVerse = localStorage.getItem('currentVerse')
      const savedBg    = localStorage.getItem('currentBackground')
      if (savedVerse && savedBg) {
        setCurrentVerse(JSON.parse(savedVerse))
        setBackgroundImage(savedBg)
      } else {
        generateRandomVerse()
      }
    }
  }, [])

  useEffect(() => {
    if (currentVerse) generateRandomVerse()
  }, [t])

  const generateRandomVerse = () => {
    setGeneratingVerse(true)
    setTimeout(() => {
      const v  = motivationalVerses[Math.floor(Math.random() * motivationalVerses.length)]
      const bg = scenicBackgrounds[Math.floor(Math.random() * scenicBackgrounds.length)]
      setCurrentVerse(v)
      setBackgroundImage(bg)
      localStorage.setItem('currentVerse', JSON.stringify(v))
      localStorage.setItem('currentBackground', bg)
      localStorage.setItem('lastVerseDate', new Date().toDateString())
      setGeneratingVerse(false)
    }, 800)
  }

  const downloadVerseImage = async () => {
    if (!verseRef.current || !currentVerse) return
    setDownloading(true)
    try {
      const tempDiv = document.createElement('div')
      tempDiv.style.cssText = `position:absolute;left:-9999px;width:1200px;height:800px;background-image:url(${backgroundImage});background-size:cover;background-position:center;display:flex;align-items:center;justify-content:center;font-family:Georgia,serif;color:white;text-align:center;border-radius:20px;overflow:hidden;`
      const overlay = document.createElement('div')
      overlay.style.cssText = 'position:absolute;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.35);'
      tempDiv.appendChild(overlay)
      const content = document.createElement('div')
      content.style.cssText = 'position:relative;z-index:1;max-width:800px;padding:0 60px;text-shadow:2px 2px 4px rgba(0,0,0,0.8);'
      content.innerHTML = `<div style="font-size:48px;margin-bottom:28px;font-weight:bold;line-height:1.4;">"${currentVerse.verse}"</div><div style="font-size:30px;font-style:italic;margin-bottom:16px;">— ${currentVerse.reference}</div><div style="font-size:22px;opacity:0.85;">${currentVerse.translation}</div>`
      tempDiv.appendChild(content)
      document.body.appendChild(tempDiv)
      const html2canvas = (await import('html2canvas')).default
      const result = await html2canvas(tempDiv, { width: 1200, height: 800, scale: 2, useCORS: true, allowTaint: true })
      result.toBlob((blob: Blob | null) => {
        if (blob) {
          const url  = URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.href = url
          link.download = `verse-${Date.now()}.png`
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          URL.revokeObjectURL(url)
          addToast({ type: 'success', title: 'Downloaded', message: t('bibleVerseDownloaded') })
        }
      }, 'image/png', 0.95)
      document.body.removeChild(tempDiv)
    } catch (err) {
      console.error('Download error:', err)
      addToast({ type: 'error', title: 'Download Failed', message: 'Could not save image. Please try again.' })
    } finally {
      setDownloading(false)
    }
  }

  const handleOptInToTeams = async () => {
    if (!currentRegistration) return
    setOptInLoading(true)
    try {
      const { supabase } = await import('../lib/supabase')
      const { error } = await supabase
        .from('camp_registrations')
        .update({ participate_in_teams: true })
        .eq('id', currentRegistration.id)
      if (error) throw error
      addToast({ type: 'success', title: 'Welcome to Teams!', message: 'You can now join a team and compete.' })
      window.location.reload()
    } catch (err: any) {
      addToast({ type: 'error', title: 'Error', message: err.message || 'Failed to opt in. Please try again.' })
    } finally {
      setOptInLoading(false)
    }
  }

  if (!profile || !currentCamp || !currentRegistration) {
    return (
      <div className="space-y-5">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    )
  }

  const currentTeam = currentRegistration.current_team && currentRegistration.current_team in TEAMS
    ? TEAMS[currentRegistration.current_team as TeamColor]
    : null
  const isAdminNotParticipating = profile.is_admin && !currentRegistration.participate_in_teams
  const visibleActions = quickActions.filter(a => a.available)
  const switchesLeft = currentRegistration.switches_remaining ?? 0
  const firstName = currentRegistration.full_name.split(' ')[0]
  const initials  = currentRegistration.full_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div className="space-y-5 pb-8">
      {/* ── Camp hero (bible verse + countdown) ── */}
      <CampHero />

      {/* ── Summary widgets (only when on a team) ── */}
      {currentRegistration.current_team && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

          {/* 1. Countdown to camp */}
          <div className="bg-[var(--color-card-bg)] rounded-2xl border border-[var(--color-border)] p-4 shadow-[var(--shadow-sm)] flex flex-col items-center justify-center text-center gap-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-orange-500">{currentCamp?.name ?? 'Camp'}</p>
            {daysUntilCamp > 0 ? (
              <>
                <p className="text-5xl font-black text-orange-500 leading-none">{daysUntilCamp}</p>
                <p className="text-xs text-[var(--color-text-muted)] font-medium">days to camp</p>
              </>
            ) : (
              <p className="text-xl font-bold text-orange-500 leading-snug">Camp is here!</p>
            )}
          </div>

          {/* 2. Team standing */}
          {(() => {
            const teamIds = ['red', 'blue', 'green', 'yellow'] as const
            const pointMap: Record<string, number> = { red: 0, blue: 0, green: 0, yellow: 0 }
            scores.forEach(s => { pointMap[s.team_id] = (s as any).points ?? 0 })
            const ranked = [...teamIds].sort((a, b) => pointMap[b] - pointMap[a])
            const userTeam = currentRegistration.current_team as TeamColor
            const rank = ranked.indexOf(userTeam) + 1
            const rankSuffix = ['', 'st', 'nd', 'rd', 'th'][rank] ?? 'th'
            const teamData = TEAMS[userTeam]
            return (
              <div className="bg-[var(--color-card-bg)] rounded-2xl border border-[var(--color-border)] p-4 shadow-[var(--shadow-sm)] flex flex-col items-center justify-center text-center gap-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)]">Team Standing</p>
                <div className="flex items-center gap-2">
                  <span
                    className="inline-block w-3 h-3 rounded-full flex-shrink-0"
                    style={{ background: teamData.colorValue }}
                  />
                  <span className="text-sm font-bold text-[var(--color-text)]">{teamData.name} Team</span>
                </div>
                <p className="text-3xl font-black leading-none" style={{ color: teamData.colorValue }}>
                  {rank}{rankSuffix}
                </p>
                <p className="text-xs text-[var(--color-text-muted)]">{pointMap[userTeam].toLocaleString()} pts</p>
              </div>
            )
          })()}

          {/* 3. My sports summary */}
          <div className="bg-[var(--color-card-bg)] rounded-2xl border border-[var(--color-border)] p-4 shadow-[var(--shadow-sm)] flex flex-col items-start gap-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)]">My Sports</p>
            {mySportIds.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {mySportIds.map(id => (
                  <span
                    key={id}
                    className="px-2.5 py-1 rounded-full text-xs font-semibold bg-[var(--color-bg-muted)] text-[var(--color-text)]"
                  >
                    {sportLabels[id] ?? id}
                  </span>
                ))}
              </div>
            ) : (
              <button
                onClick={() => onPageChange?.('sports')}
                className="text-sm font-semibold text-orange-500 hover:text-orange-600 transition-colors"
              >
                Pick your sports →
              </button>
            )}
          </div>

        </div>
      )}

      {/* ── Announcement banner ── */}
      {announcement && (
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 flex items-start gap-3 shadow-[var(--shadow-sm)]">
          <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center shrink-0 mt-0.5">
            <Megaphone className="h-4 w-4 text-amber-700 dark:text-amber-400" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-amber-700 dark:text-amber-500 uppercase tracking-widest mb-1">Announcement</p>
            <p className="text-sm text-amber-900 dark:text-amber-200 leading-relaxed">{announcement}</p>
          </div>
        </div>
      )}

      {/* ── Personal identity card ── */}
      <div className="bg-[var(--color-card-bg)] rounded-2xl border border-[var(--color-border)] overflow-hidden shadow-[var(--shadow-sm)]">
        {/* Team color stripe */}
        {currentTeam && (
          <div className="h-1" style={{ background: currentTeam.colorValue }} />
        )}

        <div className="p-5 sm:p-6">
          {/* Top row: avatar + name + switches */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 min-w-0">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-base font-black text-white shadow-md flex-shrink-0 select-none"
                style={{ background: currentTeam?.colorValue ?? 'var(--color-primary)' }}
              >
                {initials}
              </div>
              <div className="min-w-0">
                <h2 className="text-lg sm:text-xl font-bold text-[var(--color-text)] leading-tight truncate">
                  {t('welcomeMessageWithName').replace('{name}', firstName)}
                </h2>
                <p className="text-sm text-[var(--color-text-muted)] mt-0.5">
                  {getGradeDisplayWithNumber(currentRegistration.grade)}
                  {' · '}
                  {currentRegistration.gender === 'male' ? t('male') : t('female')}
                  {currentTeam && (
                    <span className="font-semibold" style={{ color: currentTeam.colorValue }}>
                      {' · '}{currentTeam.name} Team
                    </span>
                  )}
                </p>
              </div>
            </div>

            {/* Switches left */}
            {currentTeam && currentRegistration.participate_in_teams && (
              <div className="flex-shrink-0 text-right">
                <div className="flex gap-1.5 justify-end mb-1">
                  {[0, 1, 2].map(i => (
                    <div
                      key={i}
                      className="w-2.5 h-2.5 rounded-full transition-colors duration-300"
                      style={{ background: i < switchesLeft ? currentTeam.colorValue : 'var(--color-border)' }}
                    />
                  ))}
                </div>
                <p className="text-xs text-[var(--color-text-muted)]">{t('teamSwitchesRemaining')}</p>
              </div>
            )}
          </div>

          {/* Admin opt-in banner */}
          {isAdminNotParticipating && (
            <div className="mt-4 p-4 rounded-xl bg-[var(--color-bg-muted)] border border-[var(--color-border)] flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <Users className="h-5 w-5 text-[var(--color-primary)] flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-[var(--color-text)]">{t('teamAssignment')}</p>
                  <p className="text-xs text-[var(--color-text-muted)]">{t('teamMembers')}</p>
                </div>
              </div>
              <button
                onClick={handleOptInToTeams}
                disabled={optInLoading}
                className="flex-shrink-0 inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-sm font-semibold rounded-lg hover:opacity-90 disabled:opacity-50 active:scale-[0.97] transition-all"
              >
                {optInLoading
                  ? <div className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  : <UserPlus className="h-4 w-4" />
                }
                {t('teams')}
              </button>
            </div>
          )}

          {/* Quick actions */}
          {visibleActions.length > 0 && (
            <div
              className="mt-5 grid gap-3"
              style={{ gridTemplateColumns: `repeat(${Math.min(visibleActions.length, 3)}, 1fr)` }}
            >
              {visibleActions.map(action => {
                const Icon = action.icon
                return (
                  <button
                    key={action.id}
                    onClick={action.action}
                    className={`${action.color} flex flex-col items-center justify-center gap-2.5 rounded-xl text-white font-semibold text-sm hover:opacity-90 active:scale-[0.97] transition-all duration-200 shadow-sm`}
                    style={{ minHeight: '80px', padding: '16px 8px' }}
                  >
                    <Icon className="h-6 w-6" />
                    <span className="leading-tight text-center px-1">{action.title}</span>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Countdown (only if CampHero isn't shown) ── */}
      {!currentCamp.bible_verse && (
        <div className="bg-[var(--color-card-bg)] rounded-2xl border border-[var(--color-border)] p-5 sm:p-6 shadow-[var(--shadow-sm)]">
          <CountdownTimer targetDate={currentCamp.start_date} compact={false} />
        </div>
      )}

      {/* ── Scoreboard ── */}
      <Scoreboard />

      {/* ── Daily verse ── */}
      <div className="bg-[var(--color-card-bg)] rounded-2xl border border-[var(--color-border)] overflow-hidden shadow-[var(--shadow-sm)]">
        <div className="relative" style={{ minHeight: '260px' }}>
          {/* Background photo */}
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: backgroundImage
                ? `url(${backgroundImage})`
                : 'linear-gradient(135deg, #f97316, #92400e)',
              opacity: generatingVerse ? 0.4 : 1,
              transition: 'opacity 0.6s ease',
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/82 via-black/45 to-black/18" />

          {/* Floating controls */}
          <div className="absolute top-4 right-4 z-10 flex gap-2">
            {profile.is_admin && (
              <button
                onClick={generateRandomVerse}
                disabled={generatingVerse}
                title={t('newVerse')}
                className="p-2 rounded-lg bg-black/35 backdrop-blur-sm text-white/75 hover:text-white hover:bg-black/55 disabled:opacity-50 transition-all"
              >
                <RefreshCw className={`h-4 w-4 ${generatingVerse ? 'animate-spin' : ''}`} />
              </button>
            )}
            <button
              onClick={downloadVerseImage}
              disabled={downloading || !currentVerse}
              title={t('download')}
              className="p-2 rounded-lg bg-black/35 backdrop-blur-sm text-white/75 hover:text-white hover:bg-black/55 disabled:opacity-50 transition-all"
            >
              {downloading
                ? <div className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                : <Download className="h-4 w-4" />
              }
            </button>
          </div>

          {/* Verse */}
          <div className="relative z-10 flex flex-col justify-end p-6 sm:p-8" style={{ minHeight: '260px' }}>
            <p className="text-[11px] text-white/50 uppercase tracking-[0.18em] mb-3">
              {t('dailyInspiration')}
            </p>
            {generatingVerse ? (
              <div className="space-y-2.5">
                <div className="h-5 bg-white/20 rounded-md animate-pulse w-4/5" />
                <div className="h-5 bg-white/20 rounded-md animate-pulse w-full" />
                <div className="h-5 bg-white/15 rounded-md animate-pulse w-3/5" />
                <div className="h-4 bg-white/12 rounded-md animate-pulse w-1/3 mt-2" />
              </div>
            ) : currentVerse ? (
              <div ref={verseRef}>
                <p className="text-xl sm:text-2xl font-serif text-white leading-relaxed mb-3">
                  "{currentVerse.verse}"
                </p>
                <p className="text-sm font-semibold text-orange-300">
                  — {currentVerse.reference}
                </p>
                <p className="text-xs text-white/45 mt-1">{currentVerse.translation}</p>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* ── Team rosters ── */}
      <PlayerLists />

      {/* ── Admin panel ── */}
      {profile.is_admin && <AdminPanel />}
    </div>
  )
}
