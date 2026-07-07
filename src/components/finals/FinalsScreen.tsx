import { useEffect } from 'react'
import confetti from 'canvas-confetti'
import { PALETTE, RARITY_HEX } from '../../constants/designTokens'
import { useGame } from '../../state/GameContext'
import { Button, StatChip } from '../shared/atoms'
import { GameCard } from '../playoffs/PlayoffsScreen'
import { useAutoTicker } from '../shared/useAutoTicker'

function fireChampionConfetti() {
  const defaults = { spread: 90, ticks: 220, gravity: 0.9, scalar: 1.1 }
  confetti({ ...defaults, particleCount: 120, origin: { x: 0.5, y: 0.6 }, colors: [PALETTE.accent, RARITY_HEX.Legendary, PALETTE.cream] })
  setTimeout(() => confetti({ ...defaults, particleCount: 80, angle: 60, origin: { x: 0, y: 0.7 } }), 250)
  setTimeout(() => confetti({ ...defaults, particleCount: 80, angle: 120, origin: { x: 1, y: 0.7 } }), 450)
}

export function FinalsScreen() {
  const { state, dispatch } = useGame()
  const finals = state.finalsResult!
  const revealed = finals.games.slice(0, state.finalsGamesRevealed)
  const allRevealed = state.finalsGamesRevealed >= finals.games.length
  const started = state.finalsGamesRevealed > 0

  useEffect(() => {
    if (allRevealed && finals.won) fireChampionConfetti()
  }, [allRevealed, finals.won])

  const pendingGame = allRevealed
    ? undefined
    : finals.games[state.finalsGamesRevealed]
  const lastRevealed = revealed[revealed.length - 1]
  const nextIsDrama =
    !!pendingGame &&
    (pendingGame.isGame7 ||
      !!pendingGame.flawEvent ||
      lastRevealed?.seriesFor === 3 ||
      lastRevealed?.seriesAgainst === 3)

  useAutoTicker({
    running: started && !allRevealed,
    revealedCount: state.finalsGamesRevealed,
    nextIsDrama,
    advance: () => dispatch({ type: 'REVEAL_NEXT_FINALS_GAME' }),
  })

  return (
    <div className="min-h-dvh px-4 py-8 max-w-3xl mx-auto">
      <div className="anim-rise-in text-center">
        <div className="text-xs uppercase tracking-widest text-gray-400">
          NBA Finals
        </div>
        <h2 className="mt-2 font-display font-normal uppercase text-2xl sm:text-3xl text-white">
          {state.homeTeam?.name ?? 'Your Build'}{' '}
          <span className="text-gray-500">vs</span> {finals.opponent}
        </h2>
      </div>

      <div className="mt-8 space-y-3">
        {revealed.map((game, i) => (
          <GameCard
            key={game.gameNumber}
            game={game}
            isLatest={i === revealed.length - 1}
          />
        ))}
      </div>

      {/* Drama tension frame while the ticker holds */}
      {started && !allRevealed && nextIsDrama && (
        <div className="mt-4 anim-glow-pulse text-center text-sm font-bold text-amber-300 bg-amber-500/10 border border-amber-500/40 rounded-xl px-4 py-3">
          {pendingGame?.isGame7
            ? '🔥 GAME 7 OF THE NBA FINALS. Legacy on the line.'
            : pendingGame?.flawEvent
              ? '⚠️ Something is wrong in the locker room…'
              : '⏳ A championship hangs on the next game.'}
        </div>
      )}

      <div className="mt-8 text-center">
        {!allRevealed ? (
          started ? (
            <div className="flex justify-center gap-3">
              <Button
                variant="secondary"
                onClick={() => dispatch({ type: 'REVEAL_NEXT_FINALS_GAME' })}
              >
                ⏩ Fast Forward
              </Button>
              <Button
                variant="ghost"
                onClick={() => dispatch({ type: 'REVEAL_ALL_FINALS_GAMES' })}
              >
                ⏭ Skip to Result
              </Button>
            </div>
          ) : (
            <Button
              onClick={() => dispatch({ type: 'REVEAL_NEXT_FINALS_GAME' })}
              className="text-lg px-8"
            >
              ▶️ Tip Off Game 1
            </Button>
          )
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
