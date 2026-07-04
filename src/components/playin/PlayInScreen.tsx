import { useGame } from '../../state/GameContext'
import { Button } from '../shared/atoms'
import { GameCard } from '../playoffs/PlayoffsScreen'

/**
 * Play-in night: one (or two) sudden-death games between a 40-43 win
 * season and the lottery. Survive and you're the 8 seed.
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
        <div className="text-xs uppercase tracking-[0.3em] text-red-400 font-bold">
          🚨 Play-In Tournament
        </div>
        <h2 className="mt-2 text-3xl font-black text-white">Win or Go Home</h2>
        <p className="mt-2 text-sm text-gray-400 max-w-md mx-auto">
          {playIn.path === '7-8'
            ? `${state.seasonResult!.wins} wins bought you a second life: lose the first game and one final elimination game remains.`
            : `${state.seasonResult!.wins} wins means the hard road: win two straight elimination games or the season is over.`}
        </p>
      </div>

      <div className="mt-8 space-y-3">
        {revealed.map((game, i) => (
          <div key={game.gameNumber}>
            <div className="mb-1 text-xs uppercase tracking-wider text-gray-400 font-semibold">
              {playIn.path === '9-10' && game.gameNumber === 2
                ? 'Final Elimination Game'
                : game.gameNumber === 2
                  ? 'Last Chance Game'
                  : 'Elimination Game'}{' '}
              <span className="text-gray-500 normal-case">vs {game.opponent}</span>
            </div>
            <GameCard game={game} isLatest={i === revealed.length - 1} />
          </div>
        ))}
      </div>

      {injured && (
        <div className="mt-8 text-center anim-pop-in">
          <div className="anim-burn-in text-2xl font-black text-red-400">
            💀 Glass Bones Strikes
          </div>
          <p className="mt-2 text-gray-300 max-w-md mx-auto">
            A season-ending injury in the play-in warmups. The one-game season
            ended before tip-off.
          </p>
        </div>
      )}

      <div className="mt-8 text-center">
        {!injured && !allRevealed ? (
          <Button
            onClick={() => dispatch({ type: 'REVEAL_NEXT_PLAYIN_GAME' })}
            className="text-lg px-8 anim-glow-pulse !bg-red-700 hover:!bg-red-600 !shadow-red-900/40"
          >
            {revealed.length === 0
              ? '🏀 Tip Off — Season on the Line'
              : nextGame
                ? '🚨 One Last Chance'
                : ''}
          </Button>
        ) : !injured && playIn.survived ? (
          <div className="anim-pop-in">
            <div className="text-2xl font-black text-emerald-300">
              Season Saved — 8th Seed Claimed
            </div>
            <p className="mt-1 text-sm text-gray-400">
              The reward: a first-round date with the 1 seed.
            </p>
            <div className="mt-6">
              <Button
                onClick={() => dispatch({ type: 'SIMULATE_PLAYOFFS' })}
                className="text-lg px-8 anim-glow-pulse"
              >
                ⚔️ Enter the Playoffs — 8th Seed
              </Button>
            </div>
          </div>
        ) : allRevealed || injured ? (
          <div className="anim-pop-in">
            {!injured && (
              <div className="text-2xl font-black text-gray-200">
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
