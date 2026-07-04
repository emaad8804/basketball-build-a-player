import { useEffect, useRef, useState } from 'react'
import { NBA_TEAMS } from '../../constants/teams'
import { GROUP_LABELS } from '../../constants/attributes'
import { computeBaseOverall } from '../../game-logic/overall'
import { getAvailableAttributes } from '../../game-logic/build'
import { useGame } from '../../state/GameContext'
import { Button, StatChip, TeamBadge } from '../shared/atoms'
import { AttributeBoard } from './AttributeBoard'
import { PlayerReveal } from './PlayerReveal'
import { OverallRing } from './OverallRing'

/**
 * Slot-machine flash that plays automatically whenever a new team is
 * dealt (teams can no longer be manually re-spun for free).
 */
function useTeamDealFlash(teamName: string | undefined) {
  const [flashName, setFlashName] = useState<string | null>(null)
  const lastTeam = useRef<string | undefined>(undefined)

  useEffect(() => {
    if (!teamName || teamName === lastTeam.current) return
    lastTeam.current = teamName
    let ticks = 0
    const timer = setInterval(() => {
      setFlashName(NBA_TEAMS[Math.floor(Math.random() * NBA_TEAMS.length)].abbr)
      ticks++
      if (ticks >= 10) {
        clearInterval(timer)
        setFlashName(null)
      }
    }, 55)
    return () => clearInterval(timer)
  }, [teamName])

  return flashName
}

export function GameScreen() {
  const { state, dispatch } = useGame()
  const group = state.group!
  const available = getAvailableAttributes(state.lockedAttributes)
  const slotsRemaining = available.length
  const projected = computeBaseOverall(group, state.lockedAttributes)

  const teamFlash = useTeamDealFlash(state.currentTeam?.name)
  const [playerSpinning, setPlayerSpinning] = useState(false)

  const spinPlayer = () => {
    if (playerSpinning) return
    setPlayerSpinning(true)
    setTimeout(() => {
      setPlayerSpinning(false)
      dispatch({ type: 'SPIN_PLAYER' })
    }, 650)
  }

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
        <div className="flex items-center gap-2">
          <OverallRing value={projected} />
          <StatChip label="Slots Left" value={slotsRemaining} />
          <StatChip label="Respins" value={state.respinsLeft} />
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.1fr]">
        {/* Left: dealt team + spin player */}
        <div>
          <div className="bg-court-card border border-court-border rounded-2xl p-4 sm:p-5">
            {/* Dealt team display */}
            <div className="min-h-[64px] flex items-center gap-3">
              {teamFlash ? (
                <div className="anim-slot-spin text-3xl font-black text-ball-bright tracking-widest">
                  {teamFlash}
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
                        : playerSpinning
                          ? 'Scouting…'
                          : 'Your dealt team — spin a player'}
                    </div>
                  </div>
                </>
              ) : null}
            </div>

            <div className="mt-3 flex items-center gap-3">
              <Button
                onClick={spinPlayer}
                disabled={
                  !state.currentTeam ||
                  state.currentPlayer !== null ||
                  playerSpinning ||
                  teamFlash !== null
                }
              >
                🎰 Spin Player
              </Button>
              {playerSpinning && (
                <span className="anim-slot-spin text-xl font-bold text-gray-300">
                  🔍
                </span>
              )}
            </div>
          </div>

          {/* Player reveal */}
          {state.currentPlayer && !playerSpinning && (
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
