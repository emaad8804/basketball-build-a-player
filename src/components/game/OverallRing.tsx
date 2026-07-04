import { useEffect, useRef, useState } from 'react'

const MIN = 60
const MAX = 99
const R = 26
const CIRC = 2 * Math.PI * R

/** Animated projected-overall ring: fills 60→99 and pops on change. */
export function OverallRing({ value }: { value: number }) {
  const frac = Math.max(0, Math.min(1, (value - MIN) / (MAX - MIN)))
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
          stroke="var(--color-court-border)"
          strokeWidth="6"
        />
        <circle
          cx="32"
          cy="32"
          r={R}
          fill="none"
          stroke="var(--color-ball)"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={CIRC}
          strokeDashoffset={CIRC * (1 - frac)}
          style={{ transition: 'stroke-dashoffset 0.6s cubic-bezier(0.22, 1, 0.36, 1)' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg sm:text-xl font-black text-white leading-none">
          {value}
        </span>
        <span className="text-[8px] uppercase tracking-wider text-gray-400">
          Proj
        </span>
      </div>
    </div>
  )
}
