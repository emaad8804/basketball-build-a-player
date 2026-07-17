import { Play, Siren, Skull, Swords } from 'lucide-react'
import { useGame } from '../../state/GameContext'
import { Button } from '../shared/atoms'
import { GameCard } from '../playoffs/PlayoffsScreen'

/**
 * Play-in night, NBA rules: seeds 7-8 play for the 7 seed (loser gets one
 * more life vs the 9v10 winner for the 8 seed); seeds 9-10 must win two
 * straight. Survive and you carry your claimed seed into the bracket.
 */
export function PlayInScreen() {
  const { state, dispatch } = useGame()
  const playIn = state.playInResult!
  const revealed = playIn.games.slice(0, state.playInGamesRevealed)
  const allRevealed = state.playInGamesRevealed >= playIn.games.length
  const nextGame = allRevealed ? undefined : playIn.games[state.playInGamesRevealed]
  const injured = playIn.seasonEndingInjury === true

  return (
    <div
      className="min-h-dvh px-4 py-8 max-w-3xl mx-auto"
      style={{
        background:
          'radial-gradient(ellipse at top, rgba(153, 27, 27, 0.18) 0%, transparent 60%)',
      }}
    >
      <div className="anim-rise-in text-center">
        <div className="text-xs uppercase tracking-[0.3em] text-loss font-bold inline-flex items-center gap-1.5">
          <Siren className="w-3.5 h-3.5" aria-hidden />
          Play-In Tournament
        </div>
        <h2 className="mt-2 font-display font-normal uppercase text-3xl text-white">Win or Go Home</h2>
        <p className="mt-2 text-sm text-muted max-w-md mx-auto">
          {playIn.path === '7-8'
            ? `${state.seasonResult!.wins} wins earned the 7 vs 8 game: win it and the 7 seed is yours — lose, and one final game against the 9/10 winner decides the 8 seed.`
            : `${state.seasonResult!.wins} wins means the hard road: win the 9 vs 10 game, then beat the 7/8 loser — two straight or the season is over.`}
        </p>
      </div>

      <div className="mt-8 space-y-3">
        {revealed.map((game, i) => (
          <div key={game.gameNumber}>
            <div className="mb-1 text-xs uppercase tracking-wider text-muted font-semibold">
              {game.gameNumber === 2
                ? '8th Seed Game'
                : playIn.path === '7-8'
                  ? '7 vs 8 Game'
                  : '9 vs 10 Elimination Game'}{' '}
              <span className="text-muted normal-case">vs {game.opponent}</span>
            </div>
            <GameCard game={game} isLatest={i === revealed.length - 1} />
          </div>
        ))}
      </div>

      {injured && (
        <div className="mt-8 text-center anim-pop-in">
          <div className="anim-burn-in font-display font-normal uppercase text-2xl text-loss inline-flex items-center gap-2">
            <Skull className="w-6 h-6" aria-hidden />
            Glass Bones Strikes
          </div>
          <p className="mt-2 text-cream/80 max-w-md mx-auto">
            A season-ending injury in the play-in warmups. The one-game season
            ended before tip-off.
          </p>
        </div>
      )}

      <div className="mt-8 text-center">
        {!injured && !allRevealed ? (
          <Button
            onClick={() => dispatch({ type: 'REVEAL_NEXT_PLAYIN_GAME' })}
            className="text-lg px-8 anim-glow-pulse !bg-red-700 hover:!bg-red-600 !text-cream"
          >
            <span className="inline-flex items-center gap-2">
              {revealed.length === 0 ? (
                <>
                  <Play className="w-5 h-5" aria-hidden />
                  Tip Off — Season on the Line
                </>
              ) : nextGame ? (
                <>
                  <Siren className="w-5 h-5" aria-hidden />
                  One Last Chance
                </>
              ) : null}
            </span>
          </Button>
        ) : !injured && playIn.survived ? (
          <div className="anim-pop-in">
            <div className="font-display font-normal uppercase text-2xl text-win">
              Season Saved — {playIn.seed}th Seed Claimed
            </div>
            <p className="mt-1 text-sm text-muted">
              The reward: a first-round date with the {playIn.seed === 7 ? 2 : 1} seed.
            </p>
            <div className="mt-6">
              <Button
                onClick={() => dispatch({ type: 'SIMULATE_PLAYOFFS' })}
                className="text-lg px-8 anim-glow-pulse inline-flex items-center gap-2"
              >
                <Swords className="w-5 h-5" aria-hidden />
                Enter the Playoffs — {playIn.seed}th Seed
              </Button>
            </div>
          </div>
        ) : allRevealed || injured ? (
          <div className="anim-pop-in">
            {!injured && (
              <div className="font-display font-normal uppercase text-2xl text-cream/90">
                Eliminated on Play-In Night
              </div>
            )}
            <div className="mt-6">
              <Button
                onClick={() => dispatch({ type: 'SIMULATE_PLAYOFFS' })}
                className="text-lg px-8"
              >
                See Final Legacy
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
