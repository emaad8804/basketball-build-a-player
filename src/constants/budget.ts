/**
 * Budget Mode (BUDGET_MODE.md): fixed cap, every skill priced by grade.
 * Tiers ARE the difficulty setting; prices are whole $M for fast mental
 * math, non-linear so one elite skill costs as much as several mid ones.
 */

import type { Grade } from '../types'

export type BudgetTierId = 'superteam' | 'starter' | 'hard'

export interface BudgetTier {
  id: BudgetTierId
  label: string
  /** Total cap in $M. */
  budget: number
  blurb: string
  /** Tier pill color (inline-style pattern, same as team tiers). */
  color: string
}

export const BUDGET_TIERS: BudgetTier[] = [
  {
    id: 'superteam',
    label: 'Superteam',
    budget: 150,
    blurb: 'Forgiving — a couple of stars, then fill out the roster.',
    color: '#F5B301',
  },
  {
    id: 'starter',
    label: 'Starter',
    budget: 90,
    blurb: 'The sweet spot — every A forces a C somewhere else.',
    color: '#3FB950',
  },
  {
    id: 'hard',
    label: 'Hard',
    budget: 60,
    blurb: 'Punishing — mostly B/C land. An A is a real sacrifice.',
    color: '#F04438',
  },
]

export const BUDGET_TIER_BY_ID = Object.fromEntries(
  BUDGET_TIERS.map((t) => [t.id, t]),
) as Record<BudgetTierId, BudgetTier>

/**
 * Price per grade in $M. Jumps are deliberately non-decreasing toward the
 * top (2,2,2,2,4,8,8,8,10) so upgrading is always a meaningfully bigger
 * spend — one A (30) ≈ three C+'s (18).
 */
export const GRADE_TO_PRICE: Record<Grade, number> = {
  S: 48,
  'A+': 38,
  A: 30,
  'A-': 22,
  'B+': 14,
  B: 10,
  'B-': 8,
  'C+': 6,
  C: 4,
  D: 2,
}

/** Cheapest possible skill (a D) — below this you can never buy again. */
export const MIN_SKILL_PRICE = GRADE_TO_PRICE.D

/** The second respin's price tag ($M) — a conscious choice, not a deterrent. */
export const RESPIN_COST = 1

/**
 * Efficiency badge par: expected OVR for the tier's cap. The badge grades
 * you against your cap, not raw $/OVR, so Superteam runs aren't shamed
 * and leftover money stays neutral (spec §8).
 */
export const BUDGET_PAR_OVERALL: Record<BudgetTierId, number> = {
  superteam: 93,
  starter: 87,
  hard: 81,
}

/** First entry whose minDelta <= (overall - par) wins. */
export const EFFICIENCY_BADGES: { minDelta: number; label: string }[] = [
  { minDelta: 5, label: 'Bargain GM' },
  { minDelta: 0, label: 'Solid Value' },
  { minDelta: -6, label: 'Market Rate' },
  { minDelta: -Infinity, label: 'Max Contract' },
]
