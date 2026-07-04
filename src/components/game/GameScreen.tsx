import { useEffect, useRef, useState } from 'react'
import { NBA_TEAMS } from '../../constants/teams'
import { GROUP_LABELS } from '../../constants/attributes'
import { computeBaseOverall } from '../../game-logic/overall'
import { getAvailableAttributes } from '../../game-logic/build'
import { useGame } from '../../state/GameContext'
import { Button, StatChip, TeamBadge } from '../shared/atoms'
import { AttributeBoard } from './AttributeBoard'
import { PlayerReveal } from './PlayerReveal'

/** Brief slot-machine name cycle before the real spin result lands. */
function useSpinAnimation(onDone: () => void) {
  const [spinning, setSpinning] = useState(false)
  const [flashName, setFlashName] = useState<string | null>(null)
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)

  const start = () => {
    if (spinning) return
    setSpinning(true)
    let ticks = 0
    timer.current = setInterval(() => {
      setFlashName(NBA_TEAMS[Math.floor(Math.random() * NBA_TEAMS.length)].abbr)
      ticks++
      if (ticks >= 12) {
        if (timer.current) clearInterval(timer.current)
        setFlashName(null)
        setSpinning(false)
        onDone()
      }
    }, 55)
  }

  useEffect(
    () => () => {
      if (timer.current) clearInterval(timer.current)
    },
    [],
  )

  return { spinning, flashName, start }
}

export function GameScreen() {
  const { state, dispatch } = useGame()
  const group = state.group!
  const available = getAvailableAttributes(state.lockedAttributes)
  const slotsRemaining = available.length
  const projected = computeBaseOverall(group, state.lockedAttributes)

  const teamSpin = useSpinAnimation(() => dispatch({ type: 'SPIN_TEAM' }))
  const playerSpin = useSpinAnimation(() => dispatch({ type: 'SPIN_PLAYER' }))

  return (
    <div className="min-h-dvh px-4 py-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-black text-white">
            Build-A-{GROUP_LABELS[group]}
          </h2>
          <button
            onClick={() => dispatch({ type: 'PLAY_AGAIN' })}
            className="text-xs text-gray-500 hover:text-gray-300 cursor-pointer"
          >
            ← Change build group
          </button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <StatChip label="Projected" value={projected} />
          <StatChip label="Slots Left" value={slotsRemaining} />
          <StatChip label="Respins" value={state.respinsLeft} />
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.1fr]">
        {/* Left: spin zone */}
        <div>
          <div className="bg-court-card border border-court-border rounded-2xl p-4 sm:p-5">
            <div className="flex items-center gap-3">
              <Button
                onClick={teamSpin.start}
                disabled={teamSpin.spinning || playerSpin.spinning || state.currentPlayer !== null}
              >
                🎰 Spin Team
              </Button>
              <Button
                variant="secondary"
                onClick={playerSpin.start}
                disabled={
                  !state.currentTeam ||
                  state.currentPlayer !== null ||
                  teamSpin.spinning ||
                  playerSpin.spinning
                }
              >
                👤 Spin Player
              </Button>
            </div>

            {/* Current team display */}
            <div className="mt-4 min-h-[64px] flex items-center gap-3">
              {teamSpin.flashName ? (
                <div className="anim-slot-spin text-3xl font-black text-ball-bright tracking-widest">
                  {teamSpin.flashName}
                </div>
              ) : state.currentTeam ? (
                <>
                  <TeamBadge team={state.currentTeam} size="lg" />
                  <div>
                    <div className="text-lg font-bold text-white anim-pop-in">
                      {state.currentTeam.name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {state.currentPlayer
                        ? 'Player revealed below'
                        : playerSpin.flashName
                          ? 'Spinning player…'
                          : 'Now spin a player'}
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-sm text-gray-500 italic">
                  Spin a team to start building
                </div>
              )}
            </div>
            {playerSpin.flashName && (
              <div className="anim-slot-spin text-xl font-bold text-gray-300">
                🔍 Scouting…
              </div>
            )}
          </div>

          {/* Player reveal */}
          {state.currentPlayer && (
            <div className="mt-4">
              <PlayerReveal player={state.currentPlayer} />
            </div>
          )}
        </div>

        {/* Right: build board */}
        <div>
          <div className="text-xs uppercase tracking-wider text-gray-400 font-semibold mb-2">
            Your Build — {9 - slotsRemaining}/9 locked
          </div>
          <AttributeBoard locked={state.lockedAttributes} />
        </div>
      </div>
    </div>
  )
}
