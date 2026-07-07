import { useGame } from '../../state/GameContext'
import { GROUP_LABELS } from '../../constants/attributes'
import { dailyGroup, dailyNumber, dailySeed, todayKey } from '../../game-logic/daily'
import { getDailyRecord, getDailyStats } from '../../game-logic/dailyStore'
import { loadBestBuild } from '../../utils/bestBuild'
import type { Group } from '../../types'

const GROUP_CARDS: {
  group: Group
  title: string
  desc: string
  emoji: string
}[] = [
  {
    group: 'Guards',
    title: 'Build-A-Guard',
    desc: 'Handles, shooting, and playmaking. Run the offense.',
    emoji: '⚡',
  },
  {
    group: 'Forwards',
    title: 'Build-A-Forward',
    desc: 'Two-way wings and do-it-all superstars.',
    emoji: '🔥',
  },
  {
    group: 'Centers',
    title: 'Build-A-Center',
    desc: 'Anchor the paint. True bigs, hybrids, and unicorns.',
    emoji: '🏔️',
  },
]

const GROUP_EMOJI: Record<Group, string> = {
  Guards: '⚡',
  Forwards: '🔥',
  Centers: '🏔️',
}

export function LandingScreen() {
  const { dispatch } = useGame()
  const best = loadBestBuild()

  const dateKey = todayKey()
  const dayNum = dailyNumber(dateKey)
  const group = dailyGroup(dateKey)
  const played = getDailyRecord(dateKey)
  const stats = getDailyStats()

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
      <div className="anim-rise-in text-center max-w-2xl">
        <div className="text-6xl mb-4">🏀</div>
        <h1 className="text-4xl sm:text-6xl font-black tracking-tight bg-gradient-to-r from-ball-bright via-ball to-ball-deep bg-clip-text text-transparent">
          HOOPER
        </h1>
        <p className="mt-4 text-gray-300 text-base sm:text-lg leading-relaxed">
          Spin NBA teams. Steal one skill from every player you land on.
          Build a 9-attribute superstar, survive the Fatal Flaw wheel — then
          find out if your build can win a ring.
        </p>
      </div>

      {/* Daily Challenge — the headline */}
      <div className="mt-10 w-full max-w-3xl">
        {played ? (
          <div className="anim-rise-in bg-court-card border border-court-border rounded-2xl p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-xs uppercase tracking-widest text-ball-bright font-bold">
                  🗓️ Daily Challenge #{dayNum} — played ✅
                </div>
                <div className="mt-1.5 text-lg font-bold text-white">
                  {played.overall} OVR {played.archetype}
                </div>
                <div className="mt-0.5 text-sm text-gray-400">
                  {played.teamAbbr && `${played.teamAbbr} · `}
                  {played.resultLine} · {played.legacyLabel}
                </div>
              </div>
              <div className="text-right text-sm text-gray-400">
                <div className="text-2xl">{played.flawId === null ? '🍀' : '☠️'}</div>
                Next challenge at midnight
              </div>
            </div>
          </div>
        ) : (
          <button
            onClick={startDaily}
            className="anim-rise-in w-full text-left bg-gradient-to-r from-ball-deep/30 via-court-card to-court-card border-2 border-ball/60 rounded-2xl p-5 sm:p-6 transition-all duration-200 hover:border-ball-bright hover:shadow-xl hover:shadow-ball/25 hover:-translate-y-0.5 cursor-pointer anim-glow-pulse"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-xs uppercase tracking-widest text-ball-bright font-bold">
                  🗓️ Daily Challenge #{dayNum}
                </div>
                <div className="mt-1.5 text-xl sm:text-2xl font-black text-white">
                  {GROUP_EMOJI[group]} {GROUP_LABELS[group]} Day
                </div>
                <div className="mt-1 text-sm text-gray-400">
                  Same spins for everyone today. One official run. Share your
                  result.
                </div>
              </div>
              <span className="text-sm font-bold bg-ball text-white rounded-xl px-5 py-2.5 shadow-lg shadow-ball/25">
                Play Today's ▶
              </span>
            </div>
          </button>
        )}

        {/* Streak strip */}
        {stats.played > 0 && (
          <div className="mt-3 flex flex-wrap justify-center gap-x-5 gap-y-1 text-xs text-gray-400">
            <span>
              🔥 Streak: <span className="font-bold text-white">{stats.streak}</span>
            </span>
            <span>
              🗓️ Played: <span className="font-bold text-white">{stats.played}</span>
            </span>
            <span>
              🏆 Titles: <span className="font-bold text-white">{stats.championships}</span>
            </span>
            <span>
              🍀 Clean runs: <span className="font-bold text-white">{stats.cleanRuns}</span>
            </span>
            {stats.bestOverall !== null && (
              <span>
                ★ Best: <span className="font-bold text-white">{stats.bestOverall} OVR</span>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Free play */}
      <div className="mt-8 w-full max-w-3xl">
        <div className="text-xs uppercase tracking-wider text-gray-500 font-semibold text-center">
          Free Play — unlimited runs, your choice of build
        </div>
        <div className="mt-3 grid gap-4 sm:grid-cols-3">
          {GROUP_CARDS.map(({ group: g, title, desc, emoji }, i) => (
            <button
              key={g}
              onClick={() => dispatch({ type: 'SELECT_GROUP', group: g })}
              className="anim-rise-in group text-left bg-court-card border border-court-border rounded-2xl p-5 transition-all duration-200 hover:border-ball hover:shadow-xl hover:shadow-ball/20 hover:-translate-y-1 cursor-pointer"
              style={{ animationDelay: `${0.1 + i * 0.08}s` }}
            >
              <div className="text-3xl">{emoji}</div>
              <div className="mt-3 text-lg font-bold text-white group-hover:text-ball-bright transition-colors">
                {title}
              </div>
              <div className="mt-1 text-sm text-gray-400">{desc}</div>
            </button>
          ))}
        </div>
      </div>

      {best && (
        <div className="mt-8 anim-rise-in flex items-center gap-2 bg-court-card border border-amber-400/40 rounded-full px-4 py-2">
          <span className="text-amber-300">★</span>
          <span className="text-sm text-gray-300">
            Personal best:{' '}
            <span className="font-bold text-white">{best.overall} OVR</span>{' '}
            {best.archetype} · {best.legacyLabel}
            {best.champion && ' 🏆'}
          </span>
        </div>
      )}

      <p className="mt-6 text-xs text-gray-500">
        2 respins per build · 9 attributes · 1 fatal flaw spin · 1 legacy
      </p>
    </div>
  )
}
