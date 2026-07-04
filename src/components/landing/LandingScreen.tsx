import { useGame } from '../../state/GameContext'
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

export function LandingScreen() {
  const { dispatch } = useGame()
  const best = loadBestBuild()

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-4 py-12">
      <div className="anim-rise-in text-center max-w-2xl">
        <div className="text-6xl mb-4">🏀</div>
        <h1 className="text-4xl sm:text-6xl font-black tracking-tight bg-gradient-to-r from-ball-bright via-ball to-ball-deep bg-clip-text text-transparent">
          BUILD-A-PLAYER
        </h1>
        <p className="mt-4 text-gray-300 text-base sm:text-lg leading-relaxed">
          Spin NBA teams. Steal one skill from every player you land on.
          Assemble a 9-attribute superstar — then find out if your build can
          win a ring.
        </p>
      </div>

      <div className="mt-10 grid gap-4 w-full max-w-3xl sm:grid-cols-3">
        {GROUP_CARDS.map(({ group, title, desc, emoji }, i) => (
          <button
            key={group}
            onClick={() => dispatch({ type: 'SELECT_GROUP', group })}
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
        2 respins per build · 9 attributes · 1 legacy
      </p>
    </div>
  )
}
