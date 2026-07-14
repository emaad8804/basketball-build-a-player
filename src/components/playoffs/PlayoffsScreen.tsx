import { Flame, Hourglass, Play, Skull, TriangleAlert } from 'lucide-react'
import { useGame } from '../../state/GameContext'
import type { PlayoffRound, SeriesGame } from '../../types'
import { Button, Card, CountUpValue, StatChip } from '../shared/atoms'
import { useAutoTicker } from '../shared/useAutoTicker'
import { useCountUp } from '../shared/useCountUp'
import { useRevealScroll } from '../shared/useRevealScroll'

const ordinal = (n: number) =>
  n === 1 ? '1st' : n === 2 ? '2nd' : n === 3 ? '3rd' : `${n}th`

/** Stat line with count-up on the freshly revealed game. */
function StatLineText({ line, animate }: { line: SeriesGame['statLine']; animate: boolean }) {
  const pts = useCountUp(line.pts, animate)
  const reb = useCountUp(line.reb, animate)
  const ast = useCountUp(line.ast, animate)
  return (
    <span className="tabular-nums">
      {pts} PTS · {reb} REB · {ast} AST · {line.stl} STL · {line.blk} BLK
    </span>
  )
}

/** Broadcast score-bug row: one game, scannable at a glance. */
export function GameCard({ game, isLatest }: { game: SeriesGame; isLatest: boolean }) {
  // The feed grows below the fold — keep the freshest game on screen
  const scrollRef = useRevealScroll<HTMLDivElement>(isLatest)
  return (
    <Card
      ref={scrollRef}
      className={`p-3 sm:p-4 ${isLatest ? 'anim-card-flip' : ''} ${
        game.won ? '' : 'border-loss/40'
      } ${game.isGame7 ? 'border-rarity-legendary/60' : ''} ${game.dnp ? 'opacity-75' : ''}`}
    >
      <div className="flex items-center gap-3">
        {/* Score bug: W/L + score up front, like a broadcast bottom-line */}
        <div
          className={`shrink-0 w-14 rounded-lg py-2 text-center font-display font-normal text-2xl leading-none ${
            game.won ? 'bg-win/15 text-win' : 'bg-loss/15 text-loss'
          }`}
        >
          {game.won ? 'W' : 'L'}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs uppercase tracking-wider text-muted font-semibold inline-flex items-center gap-1">
              {game.isGame7 && <Flame className="w-3.5 h-3.5 text-rarity-legendary" aria-hidden />}
              {game.isGame7 ? 'Game 7' : `Game ${game.gameNumber}`}
            </span>
            {typeof game.home === 'boolean' && (
              <span className="text-xs text-muted font-semibold">
                {game.home ? 'vs' : '@'}
              </span>
            )}
            <span className="font-bold text-cream tabular-nums">
              {game.scoreFor}–{game.scoreAgainst}
            </span>
            <span className="text-xs text-muted tabular-nums">
              Series {game.seriesFor}–{game.seriesAgainst}
            </span>
          </div>
          {game.flawEvent && (
            <div className="mt-1 inline-block text-xs font-bold text-loss bg-loss/15 border border-loss/40 rounded-full px-2.5 py-0.5">
              {game.flawEvent}
            </div>
          )}
          <div className="mt-0.5 text-sm text-cream/80">
            {game.dnp ? (
              <span className="italic text-muted">Did not play</span>
            ) : (
              <StatLineText line={game.statLine} animate={isLatest} />
            )}
          </div>
          <div className="mt-1 text-xs sm:text-sm text-muted">{game.recap}</div>
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
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="text-sm uppercase tracking-wider text-cream/80 font-bold">
          {round.round}
          <span className="ml-2 text-muted font-normal normal-case">
            vs {round.opponent} ({ordinal(round.opponentSeed)} seed)
          </span>
        </div>
        <div className="flex items-center gap-2">
          {/* W/L series dot-tracker */}
          <span className="flex items-center gap-1" aria-label="series results">
            {/* Always 7 slots — deriving the count from round.games.length
                would spoil the series length before the games are revealed. */}
            {Array.from({ length: 7 }, (_, i) => {
              const game = i < revealedGames ? round.games[i] : null
              return game ? (
                <span
                  key={i}
                  className={`w-2.5 h-2.5 rounded-full ${game.won ? 'bg-win' : 'bg-loss'}`}
                  title={`Game ${game.gameNumber}: ${game.won ? 'W' : 'L'}`}
                />
              ) : (
                <span key={i} className="w-2.5 h-2.5 rounded-full border border-muted/40" />
              )
            })}
          </span>
          {complete && (
            <span
              className={`text-sm font-bold tabular-nums ${
                round.won ? 'text-win' : 'text-loss'
              }`}
            >
              {round.won ? 'WON' : 'LOST'} {round.winsFor}–{round.winsAgainst}
            </span>
          )}
        </div>
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
              ? 'bg-win/10 border-win/40 text-win'
              : 'bg-loss/10 border-loss/40 text-loss'
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

  // Runs after the last GameCard's own scroll — the verdict wins the frame
  const resultRef = useRevealScroll<HTMLDivElement>(allRevealed)
  const injuryRound = playoffs.seasonEndingInjury

  return (
    <div className="min-h-dvh px-4 py-8 max-w-3xl mx-auto">
      <div className="anim-rise-in text-center">
        <div className="text-xs uppercase tracking-widest text-muted">
          Playoff Run — {ordinal(seed)} seed
        </div>
        <h2 className="mt-2 font-display font-normal uppercase text-3xl text-white">
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
                    ? 'bg-win/15 text-win border-win/50'
                    : status === 'lost'
                      ? 'bg-loss/15 text-loss border-loss/50'
                      : status === 'active'
                        ? 'bg-accent/15 text-accent border-accent/60'
                        : 'bg-raised text-muted border-edge'
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
        <div className="mt-4 anim-glow-pulse text-center text-sm font-bold text-rarity-legendary bg-rarity-legendary/10 border border-rarity-legendary/40 rounded-xl px-4 py-3">
          <span className="inline-flex items-center gap-2">
            {pendingGame?.isGame7 ? (
              <Flame className="w-4 h-4" aria-hidden />
            ) : pendingGame?.flawEvent ? (
              <TriangleAlert className="w-4 h-4" aria-hidden />
            ) : (
              <Hourglass className="w-4 h-4" aria-hidden />
            )}
            {pendingGame?.isGame7
              ? 'GAME 7. Winner moves on. Loser goes home.'
              : pendingGame?.flawEvent
                ? 'Something is wrong in the locker room…'
                : 'Elimination stakes. Everything on the line.'}
          </span>
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
                Fast Forward
              </Button>
              <Button
                variant="ghost"
                onClick={() => dispatch({ type: 'REVEAL_ALL_PLAYOFF_GAMES' })}
              >
                Skip to Result
              </Button>
            </div>
          ) : (
            <Button
              onClick={() => dispatch({ type: 'REVEAL_NEXT_PLAYOFF_GAME' })}
              className="text-lg px-8 inline-flex items-center gap-2"
            >
              <Play className="w-5 h-5" aria-hidden />
              Tip Off the Playoffs
            </Button>
          )
        ) : (
          <div ref={resultRef} className="anim-pop-in">
            {injuryRound ? (
              <>
                <div className="anim-burn-in font-display font-normal uppercase text-2xl text-loss inline-flex items-center gap-2">
                  <Skull className="w-6 h-6" aria-hidden />
                  Glass Bones Strikes
                </div>
                <p className="mt-2 text-cream/80 max-w-md mx-auto">
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
                <div className="font-display font-normal uppercase text-2xl text-accent">
                  Through to the NBA Finals!
                </div>
                <div className="mt-6">
                  <Button
                    onClick={() => dispatch({ type: 'REVEAL_NEXT_FINALS_GAME' })}
                    className="text-lg px-8 anim-glow-pulse inline-flex items-center gap-2"
                  >
                    <Play className="w-5 h-5" aria-hidden />
                    Play the NBA Finals
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="font-display font-normal uppercase text-2xl text-cream/90">
                  Eliminated — {playoffs.eliminatedIn}
                </div>
                <div className="mt-4 grid grid-cols-3 sm:grid-cols-5 gap-2 text-left">
                  <StatChip label="PPG" value={<CountUpValue value={stats.ppg} decimals={1} />} />
                  <StatChip label="RPG" value={<CountUpValue value={stats.rpg} decimals={1} />} />
                  <StatChip label="APG" value={<CountUpValue value={stats.apg} decimals={1} />} />
                  <StatChip label="SPG" value={<CountUpValue value={stats.spg} decimals={1} />} />
                  <StatChip label="BPG" value={<CountUpValue value={stats.bpg} decimals={1} />} />
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
