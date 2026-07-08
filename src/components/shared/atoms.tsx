import type { ReactNode } from 'react'
import type { Grade, Rarity, Team } from '../../types'
import { useCountUp } from './useCountUp'

export function Button({
  children,
  onClick,
  variant = 'primary',
  disabled = false,
  className = '',
}: {
  children: ReactNode
  onClick?: () => void
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  disabled?: boolean
  className?: string
}) {
  const base =
    'font-semibold rounded-xl px-5 py-3 transition-all duration-150 active:scale-95 disabled:opacity-40 disabled:pointer-events-none cursor-pointer text-sm sm:text-base'
  const variants = {
    primary: 'bg-accent text-cream hover:bg-accent-deep',
    secondary:
      'bg-raised text-cream border border-edge hover:border-muted',
    ghost: 'text-muted hover:text-cream hover:bg-raised',
    danger:
      'bg-loss/15 text-loss border border-loss/40 hover:bg-loss/25',
  }
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  )
}

// Grade ramp rides the rarity hues (S = legendary gold … C/D = common gray)
// so grade and rarity read as one system.
const gradeColors: Record<string, string> = {
  S: 'bg-rarity-legendary text-ink',
  'A+': 'bg-rarity-elite text-cream',
  A: 'bg-rarity-elite/80 text-cream',
  'A-': 'bg-rarity-elite/55 text-cream',
  'B+': 'bg-rarity-rare/85 text-cream',
  B: 'bg-rarity-rare/55 text-cream',
  'B-': 'bg-rarity-rare/35 text-cream',
  'C+': 'bg-rarity-common/45 text-cream',
  C: 'bg-rarity-common/30 text-cream/90',
  D: 'bg-rarity-common/20 text-muted',
}

export function GradeBadge({
  grade,
  size = 'md',
}: {
  grade: Grade
  size?: 'sm' | 'md' | 'lg'
}) {
  const sizes = {
    sm: 'text-xs px-1.5 py-0.5 min-w-6',
    md: 'text-sm px-2 py-0.5 min-w-8',
    lg: 'text-lg px-3 py-1 min-w-12',
  }
  return (
    <span
      className={`inline-block text-center font-bold rounded-md ${gradeColors[grade]} ${sizes[size]}`}
    >
      {grade}
    </span>
  )
}

const rarityColors: Record<Rarity, string> = {
  Common: 'text-rarity-common border-rarity-common/50 bg-rarity-common/10',
  Rare: 'text-rarity-rare border-rarity-rare/50 bg-rarity-rare/10',
  Elite: 'text-rarity-elite border-rarity-elite/50 bg-rarity-elite/10',
  Legendary: 'text-rarity-legendary border-rarity-legendary/60 bg-rarity-legendary/10',
}

/** Shared rarity text-color classes for chips outside RarityBadge. */
export const RARITY_TEXT: Record<Rarity, string> = {
  Common: 'text-rarity-common',
  Rare: 'text-rarity-rare',
  Elite: 'text-rarity-elite',
  Legendary: 'text-rarity-legendary',
}

export function RarityBadge({ rarity }: { rarity: Rarity }) {
  return (
    <span
      className={`inline-block text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${rarityColors[rarity]}`}
    >
      {rarity}
    </span>
  )
}

export function TeamBadge({ team, size = 'md' }: { team: Team; size?: 'md' | 'lg' }) {
  const dim = size === 'lg' ? 'w-16 h-16 text-xl' : 'w-10 h-10 text-sm'
  return (
    <div
      className={`${dim} rounded-full flex items-center justify-center font-extrabold shrink-0 border-2`}
      style={{
        backgroundColor: team.primaryColor,
        borderColor: team.secondaryColor,
        color: '#fff',
        textShadow: '0 1px 3px rgba(0,0,0,0.7)',
      }}
    >
      {team.abbr}
    </div>
  )
}

export function StatChip({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="bg-panel border border-edge rounded-xl px-3 py-2 text-center">
      <div className="text-[11px] uppercase tracking-wider text-muted">{label}</div>
      <div className="text-lg font-bold text-cream tabular-nums">{value}</div>
    </div>
  )
}

/** Number that counts up on reveal; handles one decimal place. */
export function CountUpValue({ value, decimals = 0 }: { value: number; decimals?: 0 | 1 }) {
  const scale = decimals === 1 ? 10 : 1
  const v = useCountUp(Math.round(value * scale))
  return <>{(v / scale).toFixed(decimals)}</>
}

export function Card({
  children,
  className = '',
  glow = false,
}: {
  children: ReactNode
  className?: string
  glow?: boolean
}) {
  return (
    <div
      className={`bg-panel border border-edge rounded-2xl ${
        glow ? 'anim-glow-pulse border-accent/50' : ''
      } ${className}`}
    >
      {children}
    </div>
  )
}
