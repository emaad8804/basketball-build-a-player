import { ARCHETYPES } from '../constants/archetypes'
import { GRADE_RANK } from '../constants/grades'
import type { AttributeKey, Group, LockedAttribute } from '../types'

const A_MINUS_RANK = GRADE_RANK['A-']

/**
 * Pick the archetype whose signature attributes best match the build.
 * Eligible archetypes need at least one signature attribute locked at A-
 * or better; if none qualify, fall back to the best raw fit so the
 * result is never null.
 */
export function assignArchetype(
  group: Group,
  locked: Partial<Record<AttributeKey, LockedAttribute>>,
): string {
  const defs = ARCHETYPES[group]

  const score = (signature: Partial<Record<AttributeKey, number>>): number => {
    let total = 0
    let weightSum = 0
    for (const [attr, weight] of Object.entries(signature) as [
      AttributeKey,
      number,
    ][]) {
      total += (locked[attr]?.rating ?? 70) * weight
      weightSum += weight
    }
    return weightSum > 0 ? total / weightSum : 0
  }

  const eligible = defs.filter((def) =>
    (Object.keys(def.signature) as AttributeKey[]).some((attr) => {
      const grade = locked[attr]?.grade
      return grade !== undefined && GRADE_RANK[grade] >= A_MINUS_RANK
    }),
  )

  const pool = eligible.length > 0 ? eligible : defs
  let best = pool[0]
  let bestScore = -Infinity
  for (const def of pool) {
    const s = score(def.signature)
    if (s > bestScore) {
      bestScore = s
      best = def
    }
  }
  return best.name
}
