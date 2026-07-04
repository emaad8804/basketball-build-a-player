import { useEffect, useRef, useState } from 'react'
import { NBA_TEAMS } from '../../constants/teams'
import { teamTierFor, TEAM_TIERS } from '../../constants/teamStrength'
import { useGame } from '../../state/GameContext'
import { Button, TeamBadge } from '../shared/atoms'

const SPIN_MS = 3000

/**
 * The Team Destiny spin: a slot-machine cycle through all 30 franchises
 * that decelerates onto the landing spot. No rerolls — where you land is
 * where you play.
 */
export function TeamSpinScreen() {
  const { state, dispatch } = useGame()
  const [phase, setPhase] = useState<'idle' | 'spinning' | 'revealed'>('idle')
  const [flashIdx, setFlashIdx] = useState(0)
  const timer = useRef<number | null>(null)

  const homeTeam = state.homeTeam
  const tier = homeTeam ? teamTierFor(homeTeam.name) : null
  const boosted = (tier?.strengthDelta ?? 0) > 0
  const hurt = (tier?.strengthDelta ?? 0) < 0

  // Slot-machine flash: fast at first, decelerating until the reveal
  useEffect(() => {
    if (phase !== 'spinning') return
    let elapsed = 0
    let cancelled = false
    const tick = (delay: number) => {
      timer.current = window.setTimeout(() => {
        if (cancelled) return
        setFlashIdx((i) => (i + 1 + Math.floor(Math.random() * 3)) % NBA_TEAMS.length)
        elapsed += delay
        if (elapsed < SPIN_MS) tick(Math.min(60 + (elapsed / SPIN_MS) ** 2 * 400, 460))
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
        <div className="text-xs uppercase tracking-[0.35em] text-ball-bright font-semibold">
          The Draft of Fate
        </div>
        <h2 className="mt-2 text-3xl sm:text-4xl font-black text-white">
          {revealed ? homeTeam.name : 'TEAM DESTINY'}
        </h2>
        <p className="mt-2 text-sm text-gray-400 max-w-md mx-auto">
          {phase === 'idle' &&
            'Your build is set. Your flaw is sealed. One question left: who do you play for?'}
          {phase === 'spinning' && 'The league decides…'}
          {revealed && tier.flavor}
        </p>
      </div>

      {/* Spinner / reveal card */}
      <div className="min-h-[180px] flex items-center justify-center">
        {phase === 'idle' && (
          <div className="text-6xl anim-glow-pulse rounded-full w-28 h-28 flex items-center justify-center bg-court-card border-2 border-court-border">
            🏟️
          </div>
        )}
        {phase === 'spinning' && (
          <div
            className="anim-slot-spin flex flex-col items-center gap-2"
            key={flashIdx}
          >
            <TeamBadge team={flashTeam} size="lg" />
            <div className="text-2xl font-black tracking-widest text-white">
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
            <div className="mt-3 text-2xl font-black text-white">
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
              {tier.emoji} {tier.label}
            </div>
            <div className="mt-3 text-sm font-semibold">
              <span className="text-gray-400">Championship odds: </span>
              {boosted && <span className="text-emerald-300">▲ boosted</span>}
              {hurt && <span className="text-red-400">▼ slim</span>}
              {!boosted && !hurt && <span className="text-gray-300">— on your shoulders</span>}
            </div>
            <div className="mt-1 text-xs text-gray-500">
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
              {t.emoji} {t.label}
            </span>
          ))}
        </div>
      )}

      <div className="mt-8 flex flex-col items-center gap-3">
        {phase === 'idle' && (
          <>
            <Button onClick={spin} className="px-8 text-lg">
              🎰 Spin for Your Team
            </Button>
            <span className="text-xs text-gray-500">
              No trades. No outs. Where you land is where you play.
            </span>
          </>
        )}
        {revealed && (
          <Button onClick={() => dispatch({ type: 'ACCEPT_TEAM' })} className="px-8">
            Sign the Contract →
          </Button>
        )}
      </div>
    </div>
  )
}
