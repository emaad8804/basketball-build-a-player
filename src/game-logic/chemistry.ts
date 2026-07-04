import { CHEMISTRY_RULES } from '../constants/chemistry'
import { GRADE_RANK } from '../constants/grades'
import type { AttributeKey, ChemistryBonus, LockedAttribute } from '../types'

/**
 * Evaluate which chemistry bonuses a completed build triggers.
 * A rule triggers when every condition attribute is locked at or above
 * its minimum grade; the bonus upgrades from base to strong when the
 * build clears the thresholds by `strongMargin` total grade-ranks.
 */
export function evaluateChemistryBonuses(
  locked: Partial<Record<AttributeKey, LockedAttribute>>,
): ChemistryBonus[] {
  const bonuses: ChemistryBonus[] = []

  for (const rule of CHEMISTRY_RULES) {
    let met = true
    let margin = 0
    for (const cond of rule.conditions) {
      const lockedAttr = locked[cond.attribute]
      if (!lockedAttr || GRADE_RANK[lockedAttr.grade] < GRADE_RANK[cond.minGrade]) {
        met = false
        break
      }
      margin += GRADE_RANK[lockedAttr.grade] - GRADE_RANK[cond.minGrade]
    }
    if (!met) continue

    const bonus =
      rule.strongMargin > 0 && margin >= rule.strongMargin
        ? rule.strongBonus
        : rule.baseBonus
    bonuses.push({ name: rule.name, bonus, description: rule.description })
  }

  return bonuses
}
