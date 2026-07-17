import { OVERALL_CAP } from '../constants/chemistry'
import { OVERALL_WEIGHTS } from '../constants/weights'
import { ATTRIBUTE_KEYS } from '../constants/attributes'
import type {
  AttributeKey,
  ChemistryBonus,
  Group,
  LockedAttribute,
} from '../types'

/**
 * Weighted average of locked attribute ratings using group-specific weights.
 * Unlocked attributes count as a neutral 70 (the league-average placeholder
 * every sim anchors on) so a projected overall can be shown mid-build; once
 * all 9 are locked this is the true base overall.
 */
export function computeBaseOverall(
  group: Group,
  locked: Partial<Record<AttributeKey, LockedAttribute>>,
): number {
  const weights = OVERALL_WEIGHTS[group]
  let total = 0
  for (const key of ATTRIBUTE_KEYS) {
    const rating = locked[key]?.rating ?? 70
    total += rating * weights[key]
  }
  return Math.round(total / 100)
}

export function computeFinalOverall(
  group: Group,
  locked: Partial<Record<AttributeKey, LockedAttribute>>,
  bonuses: ChemistryBonus[],
): { baseOverall: number; overall: number } {
  const baseOverall = computeBaseOverall(group, locked)
  const bonusTotal = bonuses.reduce((sum, b) => sum + b.bonus, 0)
  return {
    baseOverall,
    overall: Math.min(OVERALL_CAP, baseOverall + bonusTotal),
  }
}
