import type { AttributeKey, Group, LockedAttribute } from '../types'
import { ATTRIBUTE_KEYS } from '../constants/attributes'
import { FLAW_BY_ID, SOFTEN_THRESHOLD } from '../constants/flaws'
import type { FlawId } from '../constants/flaws'

/** The build's Fatal Flaw as the sims see it. */
export interface ActiveFlaw {
  id: FlawId
  /** Linked attribute >= SOFTEN_THRESHOLD halves every effect. */
  softened: boolean
  /** Effect multiplier: 1 normally, 0.5 when softened. */
  mult: number
}

/** Flattened numeric view of a completed build, consumed by all sims. */
export interface BuildProfile {
  group: Group
  overall: number
  ratings: Record<AttributeKey, number>
  flaw: ActiveFlaw | null
}

export function makeBuildProfile(
  group: Group,
  overall: number,
  locked: Partial<Record<AttributeKey, LockedAttribute>>,
  flawId: FlawId | null = null,
): BuildProfile {
  const ratings = {} as Record<AttributeKey, number>
  for (const key of ATTRIBUTE_KEYS) {
    ratings[key] = locked[key]?.rating ?? 70
  }

  let flaw: ActiveFlaw | null = null
  if (flawId) {
    const softened =
      ratings[FLAW_BY_ID[flawId].linkedAttribute] >= SOFTEN_THRESHOLD
    flaw = { id: flawId, softened, mult: softened ? 0.5 : 1 }
  }

  return { group, overall, ratings, flaw }
}
