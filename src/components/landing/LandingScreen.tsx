import { useState } from 'react'
import { CalendarDays, Clover, Flame, Play, RotateCw, Skull, Star, Trash2, Trophy } from 'lucide-react'
import { useGame } from '../../state/GameContext'
import { GROUP_LABELS } from '../../constants/attributes'
import { dailyGroup, dailyNumber, dailySeed, todayKey } from '../../game-logic/daily'
import { getDailyRecord, getDailyStats } from '../../game-logic/dailyStore'
import { clearRun, loadRun } from '../../state/persistence'
import { loadBestBuild } from '../../utils/bestBuild'
import { GROUP_ICONS } from '../shared/icons'
import type { Group, Screen } from '../../types'

/** Where a resumed run picks back up, in player language. */
const SCREEN_LABELS: Partial<Record<Screen, string>> = {
  game: 'mid-build',
  flaw: 'at the Fatal Flaw wheel',
  team: 'at Team Destiny',
  result: 'build complete',
  season: 'season simmed',
  playin: 'on Play-In night',
  playoffs: 'mid-playoffs',
  finals: 'in the NBA Finals',
  share: 'career complete',
}

const GROUP_CARDS: {
  group: Group
  title: string
  desc: string
}[] = [
  {
    group: 'Guards',
    title: 'Build-A-Guard',
    desc: 'Handles, shooting, and playmaking. Run the offense.',
  },
  {
    group: 'Forwards',
    title: 'Build-A-Forward',
    desc: 'Two-way wings and do-it-all superstars.',
  },
  {
    group: 'Centers',
    title: 'Build-A-Center',
    desc: 'Anchor the paint. True bigs, hybrids, and unicorns.',
  },
]

export function LandingScreen() {
  const { dispatch } = useGame()
  const best = loadBestBuild()
  // Interrupted run (reload, evicted mobile tab) — offered once, discardable
  const [savedRun, setSavedRun] = useState(loadRun)
  const discardRun = () => {
    clearRun()
    setSavedRun(null)
  }

  const dateKey = todayKey()
  const dayNum = dailyNumber(dateKey)
  const group = dailyGroup(dateKey)
  const played = getDailyRecord(dateKey)
  const stats = getDailyStats()
  const DailyGroupIcon = GROUP_ICONS[group]

  const startDaily = () =>
    dispatch({
      type: 'SELECT_GROUP',
      group,
      seed: dailySeed(dateKey),
      mode: 'daily',
      dailyNumber: dayNum,
      dailyDateKey: dateKey,
    })

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-4 py-12">
      {/* Hero: centered on phones, anchored left on desktop to break the stack */}
      <div className="anim-rise-in w-full max-w-3xl text-center sm:text-left sm:flex sm:items-end sm:justify-between sm:gap-8">
        <h1 className="font-display font-normal uppercase text-6xl sm:text-8xl leading-none text-accent">
          Hooper
        </h1>
        <p className="mt-4 sm:mt-0 sm:max-w-sm text-cream/80 text-base leading-relaxed sm:text-right">
          Spin NBA teams. Steal one skill from every player you land on. Build
          a superstar, survive the Fatal Flaw wheel — then chase a ring.
        </p>
      </div>

      {/* Interrupted run — resume beats restarting a 3-minute career */}
      {savedRun && (
        <div className="mt-8 w-full max-w-3xl anim-rise-in bg-panel border border-edge rounded-2xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-sm font-bold text-cream">
              {savedRun.mode === 'daily'
                ? `Daily #${savedRun.dailyNumber} in progress`
                : 'Run in progress'}
            </div>
            <div className="mt-0.5 text-sm text-muted">
              {Object.keys(savedRun.lockedAttributes).length}/9 locked
              {savedRun.group && ` · ${GROUP_LABELS[savedRun.group]} build`}
              {savedRun.homeTeam && ` · ${savedRun.homeTeam.abbr}`}
              {SCREEN_LABELS[savedRun.screen] && ` · ${SCREEN_LABELS[savedRun.screen]}`}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => dispatch({ type: 'RESUME_RUN', saved: savedRun })}
              className="inline-flex items-center gap-2 text-sm font-bold bg-accent hover:bg-accent-deep text-ink rounded-xl px-4 py-2.5 transition-colors cursor-pointer"
            >
              <RotateCw className="w-4 h-4" aria-hidden />
              Resume
            </button>
            <button
              onClick={discardRun}
              className="inline-flex items-center gap-2 text-sm font-semibold text-muted hover:text-cream rounded-xl px-3 py-2.5 cursor-pointer"
              aria-label="Discard the saved run"
            >
              <Trash2 className="w-4 h-4" aria-hidden />
              Discard
            </button>
          </div>
        </div>
      )}

      {/* Daily Challenge — the headline */}
      <div className="mt-8 w-full max-w-3xl">
        {played ? (
          <div className="anim-rise-in bg-panel border border-edge rounded-2xl p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-xs uppercase tracking-widest text-accent font-bold inline-flex items-center gap-1.5">
                  <CalendarDays className="w-3.5 h-3.5" aria-hidden />
                  Daily Challenge #{dayNum} — played
                </div>
                <div className="mt-1.5 text-lg font-bold text-cream">
                  {played.overall} OVR {played.archetype}
                </div>
                <div className="mt-0.5 text-sm text-muted">
                  {played.teamAbbr && `${played.teamAbbr} · `}
                  {played.resultLine} · {played.legacyLabel}
                </div>
              </div>
              <div className="text-right text-sm text-muted">
                <div className="flex justify-end">
                  {played.flawId === null ? (
                    <Clover className="w-6 h-6 text-win" aria-hidden />
                  ) : (
                    <Skull className="w-6 h-6 text-loss" aria-hidden />
                  )}
                </div>
                Next challenge at midnight
              </div>
            </div>
          </div>
        ) : (
          <button
            onClick={startDaily}
            className="anim-rise-in w-full text-left bg-panel border-2 border-accent/60 rounded-2xl p-5 sm:p-6 transition-all duration-200 hover:border-accent hover:-translate-y-0.5 cursor-pointer"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-xs uppercase tracking-widest text-accent font-bold inline-flex items-center gap-1.5">
                  <CalendarDays className="w-3.5 h-3.5" aria-hidden />
                  Daily Challenge #{dayNum}
                </div>
                <div className="mt-1.5 font-display font-normal uppercase text-2xl sm:text-3xl text-cream inline-flex items-center gap-2">
                  <DailyGroupIcon className="w-6 h-6 text-accent" aria-hidden />
                  {GROUP_LABELS[group]} Day
                </div>
                <div className="mt-1 text-sm text-muted">
                  Same spins for everyone today. One official run. Share your
                  result.
                </div>
              </div>
              <span className="inline-flex items-center gap-2 text-sm font-bold bg-accent text-ink rounded-xl px-5 py-2.5">
                Play Today's
                <Play className="w-4 h-4" aria-hidden />
              </span>
            </div>
          </button>
        )}

        {/* Streak strip */}
        {stats.played > 0 && (
          <div className="mt-3 flex flex-wrap justify-center gap-x-5 gap-y-1 text-xs text-muted">
            <span className="inline-flex items-center gap-1">
              <Flame className="w-3.5 h-3.5" aria-hidden />
              Streak: <span className="font-bold text-cream">{stats.streak}</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <CalendarDays className="w-3.5 h-3.5" aria-hidden />
              Played: <span className="font-bold text-cream">{stats.played}</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <Trophy className="w-3.5 h-3.5" aria-hidden />
              Titles: <span className="font-bold text-cream">{stats.championships}</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <Clover className="w-3.5 h-3.5" aria-hidden />
              Clean runs: <span className="font-bold text-cream">{stats.cleanRuns}</span>
            </span>
            {stats.bestOverall !== null && (
              <span className="inline-flex items-center gap-1">
                <Star className="w-3.5 h-3.5" aria-hidden />
                Best: <span className="font-bold text-cream">{stats.bestOverall} OVR</span>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Free play */}
      <div className="mt-8 w-full max-w-3xl">
        <div className="text-xs uppercase tracking-wider text-muted font-semibold text-center">
          Free Play — unlimited runs, your choice of build
        </div>
        <div className="mt-3 grid gap-4 sm:grid-cols-3">
          {GROUP_CARDS.map(({ group: g, title, desc }, i) => {
            const Icon = GROUP_ICONS[g]
            return (
              <button
                key={g}
                onClick={() => dispatch({ type: 'SELECT_GROUP', group: g })}
                className="anim-rise-in group text-left bg-panel border border-edge rounded-2xl p-5 transition-all duration-200 hover:border-accent hover:-translate-y-1 cursor-pointer"
                style={{ animationDelay: `${0.1 + i * 0.08}s` }}
              >
                <Icon className="w-7 h-7 text-accent" aria-hidden />
                <div className="mt-3 font-display font-normal uppercase text-lg text-cream group-hover:text-accent transition-colors">
                  {title}
                </div>
                <div className="mt-1 text-sm text-muted">{desc}</div>
              </button>
            )
          })}
        </div>
      </div>

      {best && (
        <div className="mt-8 anim-rise-in flex items-center gap-2 bg-panel border border-rarity-legendary/40 rounded-full px-4 py-2">
          <Star className="w-4 h-4 text-rarity-legendary" aria-hidden />
          <span className="text-sm text-cream/80">
            Personal best:{' '}
            <span className="font-bold text-cream">{best.overall} OVR</span>{' '}
            {best.archetype} · {best.legacyLabel}
            {best.champion && (
              <Trophy className="ml-1 inline w-3.5 h-3.5 text-rarity-legendary" aria-hidden />
            )}
          </span>
        </div>
      )}

      <p className="mt-6 text-xs text-muted">
        2 respins per build · 9 attributes · 1 fatal flaw spin · 1 legacy
      </p>
    </div>
  )
}
