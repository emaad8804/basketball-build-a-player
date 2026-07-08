import { useEffect, useRef, useState } from 'react'
import { Dices, Search } from 'lucide-react'
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
 *
 * Spoiler guard (DESIGN.md §7): the reducer commits the dealt team
 * synchronously, but the flash interval only starts after paint — so the
 * first post-dispatch frame would show the real team. The gate below is
 * computed during render: until the flash has *finished* (settledTeam),
 * callers get a placeholder, never the committed team.
 */
function useTeamDealFlash(teamName: string | undefined) {
  const [flashName, setFlashName] = useState<string | null>(null)
  const settledTeam = useRef<string | undefined>(undefined)

  useEffect(() => {
    if (!teamName || teamName === settledTeam.current) return
    let ticks = 0
    const timer = setInterval(() => {
      setFlashName(NBA_TEAMS[Math.floor(Math.random() * NBA_TEAMS.length)].abbr)
      ticks++
      if (ticks >= 10) {
        clearInterval(timer)
        settledTeam.current = teamName // settle only when the flash ends
        setFlashName(null)
      }
    }, 55)
    return () => clearInterval(timer)
  }, [teamName])

  // Render-phase gate: masks the first post-dispatch frame, before the
  // interval's first tick fires.
  const concealing = !!teamName && teamName !== settledTeam.current
  return concealing ? (flashName ?? '· · ·') : null
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
          <h2 className="font-display font-normal uppercase text-2xl text-white">
            Build-A-{GROUP_LABELS[group]}
            {state.mode === 'daily' && (
              <span className="ml-2 align-middle text-xs font-bold uppercase tracking-wider text-accent bg-accent/15 border border-accent/50 rounded-full px-2.5 py-1">
                Daily #{state.dailyNumber}
              </span>
            )}
          </h2>
          <button
            onClick={() => dispatch({ type: 'PLAY_AGAIN' })}
            className="text-xs text-muted hover:text-cream cursor-pointer"
          >
            {state.mode === 'daily' ? '← Abandon daily run' : '← Change build group'}
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
          <div className="bg-panel border border-edge rounded-2xl p-4 sm:p-5">
            {/* Dealt team display */}
            <div className="min-h-[64px] flex items-center gap-3">
              {teamFlash ? (
                <div className="anim-slot-spin font-display font-normal uppercase text-3xl text-accent tracking-widest">
                  {teamFlash}
                </div>
              ) : state.currentTeam ? (
                <>
                  <TeamBadge team={state.currentTeam} size="lg" />
                  <div>
                    <div className="text-lg font-bold text-cream anim-pop-in">
                      {state.currentTeam.name}
                    </div>
                    <div className="text-xs text-muted">
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
                className="inline-flex items-center gap-2"
              >
                <Dices className="w-4 h-4" aria-hidden />
                Spin Player
              </Button>
              {playerSpinning && (
                <span className="anim-slot-spin text-muted">
                  <Search className="w-5 h-5" aria-hidden />
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
          <div className="text-xs uppercase tracking-wider text-muted font-semibold mb-2">
            Your Build — {9 - slotsRemaining}/9 locked
          </div>
          <AttributeBoard locked={state.lockedAttributes} />
        </div>
      </div>
    </div>
  )
}
