import { useGame } from '../../state/GameContext'
import type { PlayoffRound, SeriesGame } from '../../types'
import { Button, Card, StatChip } from '../shared/atoms'
import { useAutoTicker } from '../shared/useAutoTicker'

const ordinal = (n: number) =>
  n === 1 ? '1st' : n === 2 ? '2nd' : n === 3 ? '3rd' : `${n}th`

export function GameCard({ game, isLatest }: { game: SeriesGame; isLatest: boolean }) {
  return (
    <Card
      className={`p-3 sm:p-4 ${isLatest ? 'anim-card-flip' : ''} ${
        game.won ? '' : 'border-red-500/40'
      } ${game.isGame7 ? 'border-amber-500/60' : ''} ${game.dnp ? 'opacity-75' : ''}`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs uppercase tracking-wider text-gray-400 font-semibold">
              {game.isGame7 ? '🔥 GAME 7' : `Game ${game.gameNumber}`}
            </span>
            <span className="text-xs text-gray-500">
              Series {game.seriesFor}–{game.seriesAgainst}
            </span>
          </div>
          {game.flawEvent && (
            <div className="mt-1 inline-block text-xs font-bold text-red-300 bg-red-500/15 border border-red-500/40 rounded-full px-2.5 py-0.5">
              {game.flawEvent}
            </div>
          )}
          <div className="mt-0.5 font-bold text-white">
            {game.won ? 'Win' : 'Loss'}, {game.scoreFor}–{game.scoreAgainst}
          </div>
          <div className="mt-0.5 text-sm text-gray-300">
            {game.dnp ? (
              <span className="italic text-gray-500">Did not play</span>
            ) : (
              <>
                {game.statLine.pts} PTS · {game.statLine.reb} REB ·{' '}
                {game.statLine.ast} AST · {game.statLine.stl} STL ·{' '}
                {game.statLine.blk} BLK
              </>
            )}
          </div>
          <div className="mt-1 text-xs sm:text-sm text-gray-400">{game.recap}</div>
        </div>
        <div
          className={`text-2xl font-black shrink-0 ${
            game.won ? 'text-emerald-400' : 'text-red-400'
          }`}
        >
          {game.won ? 'W' : 'L'}
        </div>
      </div>
    </Card>
  )
}

function RoundSection({
  round,
  revealedGames,
  isLatestRound,
}: {
  round: PlayoffRound
  revealedGames: number
  isLatestRound: boolean
}) {
  const games = round.games.slice(0, revealedGames)
  const complete = revealedGames >= round.games.length

  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="text-sm uppercase tracking-wider text-gray-300 font-bold">
          {round.round}
          <span className="ml-2 text-gray-500 font-normal normal-case">
            vs {round.opponent} ({ordinal(round.opponentSeed)} seed)
          </span>
        </div>
        {complete && (
          <span
            className={`text-sm font-black ${
              round.won ? 'text-emerald-400' : 'text-red-400'
            }`}
          >
            {round.won ? 'WON' : 'LOST'} {round.winsFor}–{round.winsAgainst}
          </span>
        )}
      </div>
      <div className="mt-2 space-y-2">
        {games.map((game, i) => (
          <GameCard
            key={game.gameNumber}
            game={game}
            isLatest={isLatestRound && i === games.length - 1}
          />
        ))}
      </div>
      {complete && (
        <div
          className={`mt-2 text-sm rounded-xl px-4 py-2.5 border ${
            round.won
              ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-200'
              : 'bg-red-500/10 border-red-500/40 text-red-200'
          }`}
        >
          {round.recap}
        </div>
      )}
    </div>
  )
}

export function PlayoffsScreen() {
  const { state, dispatch } = useGame()
  const playoffs = state.playoffResult!
  const stats = playoffs.playoffStats
  // Play-in survivors enter as the 8 seed regardless of season record
  const seed = state.seasonResult!.madePlayoffs ? state.seasonResult!.seed : 8

  // Distribute the flat reveal cursor across rounds
  let remaining = state.playoffGamesRevealed
  const roundReveals = playoffs.rounds.map((round) => {
    const shown = Math.min(remaining, round.games.length)
    remaining -= shown
    return shown
  })
  const totalGames = playoffs.rounds.reduce((s, r) => s + r.games.length, 0)
  const allRevealed = state.playoffGamesRevealed >= totalGames
  const started = state.playoffGamesRevealed > 0

  const activeRoundIdx = roundReveals.findIndex(
    (shown, i) => shown < playoffs.rounds[i].games.length,
  )
  const currentRound =
    activeRoundIdx === -1
      ? playoffs.rounds[playoffs.rounds.length - 1]
      : playoffs.rounds[activeRoundIdx]
  const pendingGame =
    activeRoundIdx === -1
      ? undefined
      : currentRound.games[roundReveals[activeRoundIdx]]
  const lastRevealedInRound =
    activeRoundIdx === -1 || roundReveals[activeRoundIdx] === 0
      ? undefined
      : currentRound.games[roundReveals[activeRoundIdx] - 1]
  // Drama beat when the pending game is a Game 7, an elimination game,
  // or a moment the Fatal Flaw authored
  const nextIsDrama =
    !!pendingGame &&
    (pendingGame.isGame7 ||
      !!pendingGame.flawEvent ||
      lastRevealedInRound?.seriesFor === 3 ||
      lastRevealedInRound?.seriesAgainst === 3)

  useAutoTicker({
    running: started && !allRevealed,
    revealedCount: state.playoffGamesRevealed,
    nextIsDrama,
    advance: () => dispatch({ type: 'REVEAL_NEXT_PLAYOFF_GAME' }),
  })

  const injuryRound = playoffs.seasonEndingInjury

  return (
    <div className="min-h-dvh px-4 py-8 max-w-3xl mx-auto">
      <div className="anim-rise-in text-center">
        <div className="text-xs uppercase tracking-widest text-gray-400">
          Playoff Run — {ordinal(seed)} seed
        </div>
        <h2 className="mt-2 text-3xl font-black text-white">
          The Road to the Finals
        </h2>
        {/* Round progress chips */}
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          {['First Round', 'Second Round', 'Conference Finals'].map((name) => {
            const round = playoffs.rounds.find((r) => r.round === name)
            const idx = playoffs.rounds.findIndex((r) => r.round === name)
            const done = round && idx !== -1 && roundReveals[idx] >= round.games.length
            const status = !round
              ? 'notreached'
              : done
                ? round.won
                  ? 'won'
                  : 'lost'
                : idx === activeRoundIdx
                  ? 'active'
                  : 'pending'
            return (
              <span
                key={name}
                className={`text-xs font-semibold rounded-full px-3 py-1 border ${
                  status === 'won'
                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/50'
                    : status === 'lost'
                      ? 'bg-red-500/15 text-red-300 border-red-500/50'
                      : status === 'active'
                        ? 'bg-ball/15 text-ball-bright border-ball/60'
                        : 'bg-court-raised text-gray-500 border-court-border'
                }`}
              >
                {name}
              </span>
            )
          })}
        </div>
      </div>

      <div className="mt-6 space-y-6">
        {playoffs.rounds.map((round, i) =>
          roundReveals[i] > 0 || i === activeRoundIdx ? (
            <RoundSection
              key={round.round}
              round={round}
              revealedGames={roundReveals[i]}
              isLatestRound={i === activeRoundIdx || (allRevealed && i === playoffs.rounds.length - 1)}
            />
          ) : null,
        )}
      </div>

      {/* Drama tension frame while the ticker holds */}
      {started && !allRevealed && nextIsDrama && (
        <div className="mt-4 anim-glow-pulse text-center text-sm font-bold text-amber-300 bg-amber-500/10 border border-amber-500/40 rounded-xl px-4 py-3">
          {pendingGame?.isGame7
            ? '🔥 GAME 7. Winner moves on. Loser goes home.'
            : pendingGame?.flawEvent
              ? '⚠️ Something is wrong in the locker room…'
              : '⏳ Elimination stakes. Everything on the line.'}
        </div>
      )}

      <div className="mt-8 text-center">
        {!allRevealed ? (
          started ? (
            <div className="flex justify-center gap-3">
              <Button
                variant="secondary"
                onClick={() => dispatch({ type: 'REVEAL_NEXT_PLAYOFF_GAME' })}
              >
                ⏩ Fast Forward
              </Button>
              <Button
                variant="ghost"
                onClick={() => dispatch({ type: 'REVEAL_ALL_PLAYOFF_GAMES' })}
              >
                ⏭ Skip to Result
              </Button>
            </div>
          ) : (
            <Button
              onClick={() => dispatch({ type: 'REVEAL_NEXT_PLAYOFF_GAME' })}
              className="text-lg px-8"
            >
              ▶️ Tip Off the Playoffs
            </Button>
          )
        ) : (
          <div className="anim-pop-in">
            {injuryRound ? (
              <>
                <div className="anim-burn-in text-2xl font-black text-red-400">
                  💀 Glass Bones Strikes
                </div>
                <p className="mt-2 text-gray-300 max-w-md mx-auto">
                  A season-ending injury before the {injuryRound}. The run is
                  over — not by a better team, but by a body that betrayed a
                  championship build.
                </p>
                <div className="mt-6">
                  <Button
                    onClick={() => dispatch({ type: 'GOTO_SHARE' })}
                    className="text-lg px-8"
                  >
                    See Final Legacy
                  </Button>
                </div>
              </>
            ) : playoffs.reachedFinals ? (
              <>
                <div className="text-2xl font-black text-ball-bright">
                  Through to the NBA Finals!
                </div>
                <div className="mt-6">
                  <Button
                    onClick={() => dispatch({ type: 'REVEAL_NEXT_FINALS_GAME' })}
                    className="text-lg px-8 anim-glow-pulse"
                  >
                    🏟️ Play the NBA Finals
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="text-2xl font-black text-gray-200">
                  Eliminated — {playoffs.eliminatedIn}
                </div>
                <div className="mt-4 grid grid-cols-3 sm:grid-cols-5 gap-2 text-left">
                  <StatChip label="PPG" value={stats.ppg} />
                  <StatChip label="RPG" value={stats.rpg} />
                  <StatChip label="APG" value={stats.apg} />
                  <StatChip label="SPG" value={stats.spg} />
                  <StatChip label="BPG" value={stats.bpg} />
                </div>
                <div className="mt-6">
                  <Button
                    onClick={() => dispatch({ type: 'GOTO_SHARE' })}
                    className="text-lg px-8"
                  >
                    See Final Legacy
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
