import { useGame } from '../../state/GameContext'
import { Button, Card, StatChip } from '../shared/atoms'

export function PlayoffsScreen() {
  const { state, dispatch } = useGame()
  const playoffs = state.playoffResult!
  const stats = playoffs.playoffStats

  return (
    <div className="min-h-dvh px-4 py-8 max-w-3xl mx-auto">
      <div className="anim-rise-in text-center">
        <div className="text-xs uppercase tracking-widest text-gray-400">
          Playoff Run
        </div>
        <h2 className="mt-2 text-3xl font-black text-white">
          {playoffs.reachedFinals
            ? 'Through to the NBA Finals!'
            : `Eliminated — ${playoffs.eliminatedIn}`}
        </h2>
      </div>

      <div className="mt-8 space-y-3">
        {playoffs.rounds.map((round, i) => (
          <Card
            key={round.round}
            className={`p-4 anim-rise-in ${round.won ? '' : 'border-red-500/40'}`}
          >
            <div className="flex items-center justify-between gap-3" style={{ animationDelay: `${i * 0.12}s` }}>
              <div>
                <div className="text-xs uppercase tracking-wider text-gray-400 font-semibold">
                  {round.round}
                </div>
                <div className="mt-0.5 text-lg font-bold text-white">
                  {round.won ? 'Won' : 'Lost'} {round.winsFor}–{round.winsAgainst}{' '}
                  <span className="text-gray-400 font-normal">vs {round.opponent}</span>
                </div>
                <div className="mt-1 text-sm text-gray-400">{round.recap}</div>
              </div>
              <div
                className={`text-2xl font-black shrink-0 ${
                  round.won ? 'text-emerald-400' : 'text-red-400'
                }`}
              >
                {round.won ? 'W' : 'L'}
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-6">
        <div className="text-xs uppercase tracking-wider text-gray-400 font-semibold mb-2">
          Playoff Stats
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          <StatChip label="PPG" value={stats.ppg} />
          <StatChip label="RPG" value={stats.rpg} />
          <StatChip label="APG" value={stats.apg} />
          <StatChip label="SPG" value={stats.spg} />
          <StatChip label="BPG" value={stats.bpg} />
        </div>
      </div>

      <div className="mt-8 text-center">
        {playoffs.reachedFinals ? (
          <Button
            onClick={() => dispatch({ type: 'REVEAL_NEXT_FINALS_GAME' })}
            className="text-lg px-8"
          >
            🏟️ Play the NBA Finals
          </Button>
        ) : (
          <Button onClick={() => dispatch({ type: 'GOTO_SHARE' })} className="text-lg px-8">
            See Final Legacy
          </Button>
        )}
      </div>
    </div>
  )
}
