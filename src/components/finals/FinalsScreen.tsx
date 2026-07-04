import { useGame } from '../../state/GameContext'
import { Button, Card, StatChip } from '../shared/atoms'

export function FinalsScreen() {
  const { state, dispatch } = useGame()
  const finals = state.finalsResult!
  const revealed = finals.games.slice(0, state.finalsGamesRevealed)
  const allRevealed = state.finalsGamesRevealed >= finals.games.length
  const nextIsGame7 =
    !allRevealed && finals.games[state.finalsGamesRevealed].isGame7

  return (
    <div className="min-h-dvh px-4 py-8 max-w-3xl mx-auto">
      <div className="anim-rise-in text-center">
        <div className="text-xs uppercase tracking-widest text-gray-400">
          NBA Finals
        </div>
        <h2 className="mt-2 text-2xl sm:text-3xl font-black text-white">
          Your Build <span className="text-gray-500">vs</span> {finals.opponent}
        </h2>
      </div>

      <div className="mt-8 space-y-3">
        {revealed.map((game, i) => {
          const isLatest = i === revealed.length - 1
          return (
            <Card
              key={game.gameNumber}
              className={`p-4 ${isLatest ? 'anim-card-flip' : ''} ${
                game.won ? '' : 'border-red-500/40'
              } ${game.isGame7 ? 'border-amber-500/60 anim-glow-pulse' : ''}`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs uppercase tracking-wider text-gray-400 font-semibold">
                      {game.isGame7 ? '🔥 GAME 7' : `Game ${game.gameNumber}`}
                    </span>
                    <span className="text-xs text-gray-500">
                      Series {game.seriesFor}–{game.seriesAgainst}
                    </span>
                  </div>
                  <div className="mt-0.5 text-lg font-bold text-white">
                    {game.won ? 'Win' : 'Loss'}, {game.scoreFor}–{game.scoreAgainst}
                  </div>
                  <div className="mt-0.5 text-sm text-gray-300 font-medium">
                    {game.statLine.pts} PTS · {game.statLine.reb} REB ·{' '}
                    {game.statLine.ast} AST · {game.statLine.stl} STL ·{' '}
                    {game.statLine.blk} BLK
                  </div>
                  <div className="mt-1 text-sm text-gray-400">{game.recap}</div>
                </div>
                <div
                  className={`text-3xl font-black shrink-0 ${
                    game.won ? 'text-emerald-400' : 'text-red-400'
                  }`}
                >
                  {game.won ? 'W' : 'L'}
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      <div className="mt-8 text-center">
        {!allRevealed ? (
          <Button
            onClick={() => dispatch({ type: 'REVEAL_NEXT_FINALS_GAME' })}
            className={`text-lg px-8 ${nextIsGame7 ? 'anim-glow-pulse' : ''}`}
          >
            {revealed.length === 0
              ? '▶️ Tip Off Game 1'
              : nextIsGame7
                ? '🔥 GAME 7 — Winner Takes All'
                : `▶️ Next Game (Game ${revealed.length + 1})`}
          </Button>
        ) : (
          <div className="anim-pop-in">
            <div
              className={`text-4xl font-black ${
                finals.won ? 'text-amber-300' : 'text-gray-300'
              }`}
            >
              {finals.won ? '🏆 NBA CHAMPION' : 'Runner-Up'}
            </div>
            <div className="mt-1 text-gray-400">
              {finals.won
                ? `Won the series ${finals.winsFor}–${finals.winsAgainst}`
                : `Lost the series ${finals.winsFor}–${finals.winsAgainst}`}
              {finals.won && finals.finalsMvp && ' · Finals MVP'}
            </div>

            <div className="mt-6 grid grid-cols-3 sm:grid-cols-7 gap-2 text-left">
              <StatChip label="PPG" value={finals.averages.ppg} />
              <StatChip label="RPG" value={finals.averages.rpg} />
              <StatChip label="APG" value={finals.averages.apg} />
              <StatChip label="SPG" value={finals.averages.spg} />
              <StatChip label="BPG" value={finals.averages.bpg} />
              <StatChip label="FG%" value={finals.averages.fgPct} />
              <StatChip label="3PT%" value={finals.averages.threePct} />
            </div>

            <div className="mt-8">
              <Button onClick={() => dispatch({ type: 'GOTO_SHARE' })} className="text-lg px-8">
                See Final Legacy
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
