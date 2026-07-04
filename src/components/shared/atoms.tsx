import type { ReactNode } from 'react'
import type { Grade, Rarity, Team } from '../../types'

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
    primary:
      'bg-ball text-white hover:bg-ball-bright shadow-lg shadow-ball/25',
    secondary:
      'bg-court-raised text-gray-100 border border-court-border hover:border-ball/60',
    ghost: 'text-gray-300 hover:text-white hover:bg-court-raised',
    danger:
      'bg-red-600/20 text-red-300 border border-red-500/40 hover:bg-red-600/35',
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

const gradeColors: Record<string, string> = {
  S: 'bg-gradient-to-br from-amber-300 to-orange-500 text-black',
  'A+': 'bg-gradient-to-br from-purple-400 to-fuchsia-600 text-white',
  A: 'bg-purple-500/85 text-white',
  'A-': 'bg-purple-500/60 text-white',
  'B+': 'bg-blue-500/80 text-white',
  B: 'bg-blue-500/55 text-white',
  'B-': 'bg-blue-500/35 text-blue-100',
  'C+': 'bg-slate-500/60 text-slate-100',
  C: 'bg-slate-500/40 text-slate-200',
  D: 'bg-slate-600/40 text-slate-300',
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
  Common: 'text-slate-300 border-slate-500/50 bg-slate-500/10',
  Rare: 'text-sky-300 border-sky-500/50 bg-sky-500/10',
  Elite: 'text-purple-300 border-purple-500/50 bg-purple-500/10',
  Legendary: 'text-amber-300 border-amber-500/60 bg-amber-500/10',
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
    <div className="bg-court-card border border-court-border rounded-xl px-3 py-2 text-center">
      <div className="text-[11px] uppercase tracking-wider text-gray-400">{label}</div>
      <div className="text-lg font-bold text-white">{value}</div>
    </div>
  )
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
      className={`bg-court-card border border-court-border rounded-2xl ${
        glow ? 'anim-glow-pulse border-ball/50' : ''
      } ${className}`}
    >
      {children}
    </div>
  )
}
