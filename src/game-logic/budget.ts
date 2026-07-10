import {
  BUDGET_PAR_OVERALL,
  BUDGET_TIER_BY_ID,
  EFFICIENCY_BADGES,
  GRADE_TO_PRICE,
} from '../constants/budget'
import type { BudgetTierId } from '../constants/budget'
import { GRADE_RANK } from '../constants/grades'
import type {
  AttributeKey,
  GameState,
  LockedAttribute,
  Player,
} from '../types'
import { getAvailableAttributes } from './build'

type Locked = Partial<Record<AttributeKey, LockedAttribute>>

/** Total $M spent this run (0 outside budget mode). */
export function budgetSpent(state: GameState): number {
  if (state.mode !== 'budget' || !state.budgetTier || state.budgetLeft === null)
    return 0
  return BUDGET_TIER_BY_ID[state.budgetTier].budget - state.budgetLeft
}

/** Cheapest price among this player's still-unlocked attributes. */
export function cheapestAvailablePrice(player: Player, locked: Locked): number {
  return Math.min(
    ...getAvailableAttributes(locked).map(
      (key) => GRADE_TO_PRICE[player.grades[key]],
    ),
  )
}

/** True when NO available skill on this slate is affordable (spec §7). */
export function isMinimumWageSlate(
  player: Player,
  locked: Locked,
  budgetLeft: number,
): boolean {
  return cheapestAvailablePrice(player, locked) > budgetLeft
}

/** All available attrs tied for the LOWEST grade — the free min-wage choices. */
export function minWageAttributes(
  player: Player,
  locked: Locked,
): AttributeKey[] {
  const available = getAvailableAttributes(locked)
  const lowest = Math.min(
    ...available.map((key) => GRADE_RANK[player.grades[key]]),
  )
  return available.filter((key) => GRADE_RANK[player.grades[key]] === lowest)
}

/**
 * $M this lock will charge: the grade's price, or 0 on a minimum-wage
 * slate. Returns null when the pick is illegal (unaffordable on a normal
 * slate, or not among the tied-lowest on a min-wage slate). Shared by the
 * reducer guard and the UI enabled-states so they can never disagree.
 */
export function lockCharge(
  player: Player,
  locked: Locked,
  budgetLeft: number,
  attribute: AttributeKey,
): number | null {
  if (attribute in locked) return null
  if (isMinimumWageSlate(player, locked, budgetLeft)) {
    return minWageAttributes(player, locked).includes(attribute) ? 0 : null
  }
  const price = GRADE_TO_PRICE[player.grades[attribute]]
  return price <= budgetLeft ? price : null
}

/** Badge from overall vs the tier's par — tier-relative, never $/OVR. */
export function efficiencyBadge(tier: BudgetTierId, overall: number): string {
  const delta = overall - BUDGET_PAR_OVERALL[tier]
  return EFFICIENCY_BADGES.find((b) => delta >= b.minDelta)!.label
}

/** e.g. "9.3 OVR per $10M" — the raw value stat under the badge. */
export function efficiencyLine(overall: number, spent: number): string {
  if (spent <= 0) return '—'
  return `${((overall / spent) * 10).toFixed(1)} OVR per $10M`
}
