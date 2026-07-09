import { useEffect, useRef, useState } from 'react'
import { useCountUp } from '../shared/useCountUp'

const MIN = 60
const MAX = 99
const R = 26
const CIRC = 2 * Math.PI * R

/** Animated projected-overall ring: fills 60→99 and pops on change. */
export function OverallRing({ value }: { value: number }) {
  // Fill follows the counted digits so ring and number rise as one
  const displayValue = useCountUp(value, true, 600)
  const frac = Math.max(0, Math.min(1, (displayValue - MIN) / (MAX - MIN)))
  const [pop, setPop] = useState(false)
  const prev = useRef(value)

  useEffect(() => {
    if (prev.current !== value) {
      prev.current = value
      setPop(true)
      const t = setTimeout(() => setPop(false), 500)
      return () => clearTimeout(t)
    }
  }, [value])

  return (
    <div
      className={`relative w-16 h-16 sm:w-[72px] sm:h-[72px] ${pop ? 'anim-ring-pop' : ''}`}
      title="Projected overall"
    >
      <svg viewBox="0 0 64 64" className="w-full h-full -rotate-90">
        <circle
          cx="32"
          cy="32"
          r={R}
          fill="none"
          stroke="var(--color-edge)"
          strokeWidth="6"
        />
        <circle
          cx="32"
          cy="32"
          r={R}
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={CIRC}
          strokeDashoffset={CIRC * (1 - frac)}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display font-normal text-lg sm:text-xl text-white leading-none tabular-nums">
          {displayValue}
        </span>
        <span className="text-[8px] uppercase tracking-wider text-muted">
          Proj
        </span>
      </div>
    </div>
  )
}
