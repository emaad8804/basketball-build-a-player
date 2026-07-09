import { useEffect, useRef, useState } from 'react'
import { NBA_TEAMS } from '../../constants/teams'
import { teamTierFor, TEAM_TIERS } from '../../constants/teamStrength'
import { useGame } from '../../state/GameContext'
import { ArrowRight, Dices, Landmark } from 'lucide-react'
import { prefersReducedMotion } from '../../utils/motion'
import { Button, TeamBadge } from '../shared/atoms'
import { TIER_ICONS } from '../shared/icons'

const SPIN_MS = 3000

/**
 * The Team Destiny spin: a slot-machine cycle through all 30 franchises
 * that decelerates onto the landing spot. No rerolls — where you land is
 * where you play.
 */
export function TeamSpinScreen() {
  const { state, dispatch } = useGame()
  // Resumed runs already have a landed team — re-enter at the reveal.
  const [phase, setPhase] = useState<'idle' | 'spinning' | 'revealed'>(
    state.homeTeam ? 'revealed' : 'idle',
  )
  const [flashIdx, setFlashIdx] = useState(0)
  const timer = useRef<number | null>(null)

  const homeTeam = state.homeTeam
  const tier = homeTeam ? teamTierFor(homeTeam.name) : null
  const boosted = (tier?.strengthDelta ?? 0) > 0
  const hurt = (tier?.strengthDelta ?? 0) < 0

  // Slot-machine flash: fast at first, decelerating until the reveal
  useEffect(() => {
    if (phase !== 'spinning') return
    const spinMs = prefersReducedMotion() ? 350 : SPIN_MS
    let elapsed = 0
    let cancelled = false
    const tick = (delay: number) => {
      timer.current = window.setTimeout(() => {
        if (cancelled) return
        setFlashIdx((i) => (i + 1 + Math.floor(Math.random() * 3)) % NBA_TEAMS.length)
        elapsed += delay
        if (elapsed < spinMs) tick(Math.min(60 + (elapsed / spinMs) ** 2 * 400, 460))
        else setPhase('revealed')
      }, delay)
    }
    tick(60)
    return () => {
      cancelled = true
      if (timer.current) clearTimeout(timer.current)
    }
  }, [phase])

  const spin = () => {
    dispatch({ type: 'SPIN_HOME_TEAM' })
    setPhase('spinning')
  }
  // Tap-to-settle: phase change unwinds the timer chain via effect cleanup
  const settle = () => {
    if (phase === 'spinning' && state.homeTeam) setPhase('revealed')
  }

  const revealed = phase === 'revealed' && homeTeam && tier
  const flashTeam = NBA_TEAMS[flashIdx]

  return (
    <div
      className="min-h-dvh px-4 py-8 flex flex-col items-center justify-center"
      style={{
        background: revealed
          ? `radial-gradient(ellipse at center, ${homeTeam.primaryColor}33 0%, #0b0e14 70%)`
          : 'radial-gradient(ellipse at center, #131a26 0%, #0b0e14 70%)',
        transition: 'background 0.7s',
      }}
    >
      <div className="text-center mb-8">
        <div className="text-xs uppercase tracking-[0.35em] text-accent font-semibold">
          The Draft of Fate
        </div>
        <h2 className="mt-2 font-display font-normal uppercase text-3xl sm:text-4xl text-white">
          {revealed ? homeTeam.name : 'TEAM DESTINY'}
        </h2>
        <p className="mt-2 text-sm text-muted max-w-md mx-auto">
          {phase === 'idle' &&
            'Your build is set. Your flaw is sealed. One question left: who do you play for?'}
          {phase === 'spinning' && 'The league decides…'}
          {revealed && tier.flavor}
        </p>
      </div>

      {/* Spinner / reveal card — tappable mid-spin to cut to the pick */}
      <div
        className={`min-h-[180px] flex items-center justify-center ${
          phase === 'spinning' ? 'cursor-pointer' : ''
        }`}
        onClick={settle}
      >
        {phase === 'idle' && (
          <div className="anim-glow-pulse rounded-full w-28 h-28 flex items-center justify-center bg-panel border-2 border-edge">
            <Landmark className="w-12 h-12 text-muted" aria-hidden />
          </div>
        )}
        {phase === 'spinning' && (
          <div
            className="anim-slot-spin flex flex-col items-center gap-2"
            key={flashIdx}
          >
            <TeamBadge team={flashTeam} size="lg" />
            <div className="font-display font-normal uppercase text-2xl tracking-widest text-white">
              {flashTeam.abbr}
            </div>
          </div>
        )}
        {revealed && (
          <div
            className="anim-burn-in w-full max-w-md rounded-2xl border-2 p-6 text-center"
            style={{
              borderColor: homeTeam.primaryColor,
              background: `linear-gradient(180deg, ${homeTeam.primaryColor}26, #0d1017)`,
              boxShadow: `0 0 50px ${homeTeam.primaryColor}44`,
            }}
          >
            <div className="flex justify-center">
              <TeamBadge team={homeTeam} size="lg" />
            </div>
            <div className="mt-3 font-display font-normal uppercase text-2xl text-white">
              {homeTeam.name}
            </div>
            <div
              className="mt-2 inline-block text-xs font-bold uppercase tracking-[0.25em] rounded-full border px-3 py-1"
              style={{
                color: tier.color,
                borderColor: `${tier.color}88`,
                backgroundColor: `${tier.color}14`,
              }}
            >
              {(() => {
                const Icon = TIER_ICONS[tier.id]
                return <Icon className="inline w-3.5 h-3.5 mr-1 align-[-2px]" aria-hidden />
              })()}
              {tier.label}
            </div>
            <div className="mt-3 text-sm font-semibold">
              <span className="text-muted">Championship odds: </span>
              {boosted && <span className="text-win">▲ boosted</span>}
              {hurt && <span className="text-loss">▼ slim</span>}
              {!boosted && !hurt && <span className="text-cream/80">— on your shoulders</span>}
            </div>
            <div className="mt-1 text-xs text-muted">
              {tier.winPctDelta !== 0 &&
                `${tier.winPctDelta > 0 ? '+' : ''}${Math.round(tier.winPctDelta * 82)} wins to the season · `}
              {tier.strengthDelta !== 0
                ? `${tier.strengthDelta > 0 ? '+' : ''}${tier.strengthDelta * 2}% per playoff game`
                : 'no playoff modifier'}
            </div>
          </div>
        )}
      </div>

      {/* Tier legend pre-spin */}
      {phase === 'idle' && (
        <div className="mt-6 flex flex-wrap justify-center gap-2 max-w-md">
          {Object.values(TEAM_TIERS).map((t) => (
            <span
              key={t.id}
              className="text-[11px] px-2 py-1 rounded-full border"
              style={{
                borderColor: `${t.color}66`,
                color: t.color,
                backgroundColor: `${t.color}14`,
              }}
            >
              {(() => {
                const Icon = TIER_ICONS[t.id]
                return <Icon className="inline w-3 h-3 mr-1 align-[-1px]" aria-hidden />
              })()}
              {t.label}
            </span>
          ))}
        </div>
      )}

      <div className="mt-8 flex flex-col items-center gap-3">
        {phase === 'spinning' && (
          <Button variant="ghost" onClick={settle} className="!px-4 !py-2 text-xs">
            Skip the suspense — show the team
          </Button>
        )}
        {phase === 'idle' && (
          <>
            <Button onClick={spin} className="px-8 text-lg inline-flex items-center gap-2">
              <Dices className="w-5 h-5" aria-hidden />
              Spin for Your Team
            </Button>
            <span className="text-xs text-muted">
              No trades. No outs. Where you land is where you play.
            </span>
          </>
        )}
        {revealed && (
          <Button onClick={() => dispatch({ type: 'ACCEPT_TEAM' })} className="px-8 inline-flex items-center gap-2">
            Sign the Contract
            <ArrowRight className="w-4 h-4" aria-hidden />
          </Button>
        )}
      </div>
    </div>
  )
}
