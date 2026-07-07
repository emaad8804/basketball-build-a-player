import { useEffect, useMemo, useRef, useState } from 'react'
import {
  FLAWS,
  FLAW_BY_ID,
  FLAW_TIER_COLORS,
  NO_FLAW_WEIGHT,
  SOFTEN_THRESHOLD,
} from '../../constants/flaws'
import type { FlawId } from '../../constants/flaws'
import { ATTRIBUTE_LABELS } from '../../constants/attributes'
import { useGame } from '../../state/GameContext'
import { Button } from '../shared/atoms'

/** Segment colors escalate toward blood red as severity rises. */
const SEGMENT_COLORS: Record<FlawId, string> = {
  'brick-at-the-line': '#a16207',
  'slow-starter': '#ca8a04',
  'injury-prone': '#c2410c',
  'playoff-shrink': '#ea580c',
  'ice-cold': '#b91c1c',
  'glass-bones': '#7f1d1d',
}

/** Wheel segments derived from FLAWS so odds and visuals can't drift. */
const SEGMENTS: { id: FlawId | null; weight: number; color: string }[] = [
  { id: null, weight: NO_FLAW_WEIGHT, color: '#14532d' },
  ...FLAWS.map((f) => ({ id: f.id, weight: f.weight, color: SEGMENT_COLORS[f.id] })),
]
const TOTAL_WEIGHT = SEGMENTS.reduce((s, x) => s + x.weight, 0)
const SPIN_MS = 3800

/** [startDeg, endDeg) of each segment, clockwise from the top pointer. */
function segmentArcs(): { id: FlawId | null; start: number; end: number }[] {
  let acc = 0
  return SEGMENTS.map((s) => {
    const start = (acc / TOTAL_WEIGHT) * 360
    acc += s.weight
    return { id: s.id, start, end: (acc / TOTAL_WEIGHT) * 360 }
  })
}

function wheelGradient(): string {
  let acc = 0
  const stops = SEGMENTS.map((s) => {
    const from = (acc / TOTAL_WEIGHT) * 360
    acc += s.weight
    const to = (acc / TOTAL_WEIGHT) * 360
    return `${s.color} ${from}deg ${to}deg`
  })
  return `conic-gradient(${stops.join(', ')})`
}

type Phase = 'idle' | 'spinning' | 'revealed'

export function FlawScreen() {
  const { state, dispatch } = useGame()
  const [phase, setPhase] = useState<Phase>('idle')
  const [rotation, setRotation] = useState(0)
  const spinTimer = useRef<number | null>(null)
  const arcs = useMemo(segmentArcs, [])
  const gradient = useMemo(wheelGradient, [])

  const flaw = state.flawId ? FLAW_BY_ID[state.flawId] : null
  const canReroll =
    state.flawSpun &&
    state.flawId !== null &&
    !state.flawRerolled &&
    state.respinsLeft > 0
  const softened =
    flaw !== null &&
    (state.lockedAttributes[flaw.linkedAttribute]?.rating ?? 70) >=
      SOFTEN_THRESHOLD

  // When a spin outcome lands in state, aim the wheel at its segment
  useEffect(() => {
    if (phase !== 'spinning' || !state.flawSpun) return
    const arc = arcs.find((a) => a.id === state.flawId)!
    const width = arc.end - arc.start
    // Land inside the middle 70% of the segment, pointer at top
    const jitter = (Math.random() - 0.5) * width * 0.7
    const targetMod = (360 - (arc.start + width / 2 + jitter) + 360) % 360
    setRotation((prev) => {
      const delta = (targetMod - (prev % 360) + 360) % 360
      return prev + 4 * 360 + delta
    })
    spinTimer.current = window.setTimeout(() => setPhase('revealed'), SPIN_MS)
    return () => {
      if (spinTimer.current) clearTimeout(spinTimer.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, state.flawSpun, state.flawId, state.flawRerolled])

  const spin = () => {
    setPhase('spinning')
    dispatch({ type: 'SPIN_FLAW' })
  }
  const reroll = () => {
    setPhase('spinning')
    dispatch({ type: 'REROLL_FLAW' })
  }

  const revealed = phase === 'revealed'
  const clean = revealed && state.flawId === null

  return (
    <div
      className={`min-h-dvh px-4 py-8 flex flex-col items-center justify-center transition-colors duration-700 ${
        clean ? 'bg-emerald-950/40' : ''
      }`}
      style={{
        background: clean
          ? undefined
          : 'radial-gradient(ellipse at center, #1a0a0a 0%, #050203 70%)',
      }}
    >
      {clean && <div className="anim-relief-flash fixed inset-0 pointer-events-none" />}

      <div className="text-center mb-6">
        <div className="text-xs uppercase tracking-[0.35em] text-red-400/80 font-semibold">
          The Mandatory Tenth Spin
        </div>
        <h2 className="mt-2 font-display font-normal uppercase text-3xl sm:text-4xl text-white">
          {clean ? 'CLEAN BUILD' : revealed && flaw ? flaw.name : 'THE FATAL FLAW'}
        </h2>
        <p className="mt-2 text-sm text-gray-400 max-w-md mx-auto">
          {phase === 'idle' &&
            'Every career has one question mark. Time to find yours.'}
          {phase === 'spinning' && 'The wheel decides…'}
          {clean && 'The wheel spared you. No flaw. No excuses.'}
          {revealed && flaw && flaw.description}
        </p>
      </div>

      {/* Wheel */}
      <div className="relative">
        {/* Pointer */}
        <div
          className="absolute left-1/2 -top-2 -translate-x-1/2 z-10 w-0 h-0"
          style={{
            borderLeft: '12px solid transparent',
            borderRight: '12px solid transparent',
            borderTop: `18px solid ${clean ? '#34d399' : '#fca5a5'}`,
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.8))',
          }}
        />
        <div
          className="rounded-full border-4"
          style={{
            width: 'min(78vw, 320px)',
            height: 'min(78vw, 320px)',
            background: gradient,
            borderColor: clean ? '#059669' : '#450a0a',
            boxShadow: clean
              ? '0 0 60px rgba(52, 211, 153, 0.45)'
              : '0 0 50px rgba(153, 27, 27, 0.35), inset 0 0 40px rgba(0,0,0,0.6)',
            transform: `rotate(${rotation}deg)`,
            transition: `transform ${SPIN_MS}ms cubic-bezier(0.12, 0.8, 0.2, 1)`,
          }}
        />
        {/* Hub */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div
            className={`w-20 h-20 rounded-full flex items-center justify-center text-3xl border-2 ${
              clean
                ? 'bg-emerald-900 border-emerald-500'
                : 'bg-[#170606] border-red-900'
            }`}
          >
            {clean ? '🍀' : revealed && flaw ? flaw.emoji : '🎱'}
          </div>
        </div>
      </div>

      {/* Legend (pre-spin) */}
      {phase === 'idle' && (
        <div className="mt-5 flex flex-wrap justify-center gap-2 max-w-md">
          <span className="text-[11px] px-2 py-1 rounded-full border border-emerald-700 text-emerald-300 bg-emerald-900/30">
            No Flaw · {NO_FLAW_WEIGHT}%
          </span>
          {FLAWS.map((f) => (
            <span
              key={f.id}
              className="text-[11px] px-2 py-1 rounded-full border"
              style={{
                borderColor: `${FLAW_TIER_COLORS[f.tier]}66`,
                color: FLAW_TIER_COLORS[f.tier],
                backgroundColor: `${FLAW_TIER_COLORS[f.tier]}14`,
              }}
            >
              {f.emoji} {f.name} · {f.weight}%
            </span>
          ))}
        </div>
      )}

      {/* Revealed flaw card */}
      {revealed && flaw && (
        <div
          className="anim-burn-in mt-6 max-w-md w-full rounded-2xl border-2 p-5 text-center"
          style={{
            borderColor: FLAW_TIER_COLORS[flaw.tier],
            background: `linear-gradient(180deg, ${FLAW_TIER_COLORS[flaw.tier]}1f, #0a0405)`,
          }}
        >
          <div
            className="text-xs font-bold uppercase tracking-[0.3em]"
            style={{ color: FLAW_TIER_COLORS[flaw.tier] }}
          >
            {flaw.tier} Flaw
          </div>
          <div className="mt-1 font-display font-normal uppercase text-2xl text-white">
            {flaw.emoji} {flaw.name}
          </div>
          <p className="mt-2 text-sm text-gray-300">{flaw.description}</p>
          {softened && (
            <p className="mt-2 text-xs text-emerald-300">
              Your {SOFTEN_THRESHOLD}+ {ATTRIBUTE_LABELS[flaw.linkedAttribute]} softens
              this flaw — its effect is halved.
            </p>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="mt-7 flex flex-col items-center gap-3">
        {phase === 'idle' && (
          <>
            <Button onClick={spin} className="!bg-red-700 hover:!bg-red-600 !shadow-red-900/40 px-8">
              Spin the Flaw Wheel
            </Button>
            <span className="text-xs text-gray-500">
              {state.respinsLeft > 0
                ? `${state.respinsLeft} Respin${state.respinsLeft === 1 ? '' : 's'} banked — insurance if the wheel turns on you`
                : 'No Respins banked. Whatever lands, sticks.'}
            </span>
          </>
        )}

        {revealed && (
          <>
            {clean ? (
              <Button onClick={() => dispatch({ type: 'ACCEPT_FLAW' })} className="px-8">
                Find Your Team →
              </Button>
            ) : (
              <>
                {canReroll && (
                  <Button
                    onClick={reroll}
                    className="!bg-red-700 hover:!bg-red-600 !shadow-red-900/40 px-6"
                  >
                    🔄 Burn a Respin — Reroll the Wheel
                  </Button>
                )}
                <Button
                  variant={canReroll ? 'secondary' : 'primary'}
                  onClick={() => dispatch({ type: 'ACCEPT_FLAW' })}
                  className="px-8"
                >
                  Accept Your Fate →
                </Button>
                {canReroll && (
                  <span className="text-xs text-gray-500">
                    The reroll spins the full wheel — same {NO_FLAW_WEIGHT}% escape odds.
                  </span>
                )}
                {!canReroll && state.flawRerolled && (
                  <span className="text-xs text-red-400/80">
                    The wheel has spoken twice. This one is yours to carry.
                  </span>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}
