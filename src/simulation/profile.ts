import type { AttributeKey, Group, LockedAttribute } from '../types'
import { ATTRIBUTE_KEYS } from '../constants/attributes'

/** Flattened numeric view of a completed build, consumed by all sims. */
export interface BuildProfile {
  group: Group
  overall: number
  ratings: Record<AttributeKey, number>
}

export function makeBuildProfile(
  group: Group,
  overall: number,
  locked: Partial<Record<AttributeKey, LockedAttribute>>,
): BuildProfile {
  const ratings = {} as Record<AttributeKey, number>
  for (const key of ATTRIBUTE_KEYS) {
    ratings[key] = locked[key]?.rating ?? 70
  }
  return { group, overall, ratings }
}
