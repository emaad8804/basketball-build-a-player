import { ATTRIBUTE_KEYS, ATTRIBUTE_LABELS } from '../constants/attributes'
import { ALL_PLAYERS } from '../data'
import type { AttributeKey, Group, LockedAttribute, Player } from '../types'
import { convertGradeToRating } from './grades'

export interface BuildReport {
  best: { attribute: AttributeKey; label: string; rating: number }[]
  weakest: { attribute: AttributeKey; label: string; rating: number }[]
  comparison: Player
  scoutingReport: string
}

export function analyzeBuild(
  group: Group,
  locked: Partial<Record<AttributeKey, LockedAttribute>>,
  archetype: string,
): BuildReport {
  const rated = ATTRIBUTE_KEYS.map((key) => ({
    attribute: key,
    label: ATTRIBUTE_LABELS[key],
    rating: locked[key]?.rating ?? 70,
  }))
  const sorted = [...rated].sort((a, b) => b.rating - a.rating)
  const best = sorted.slice(0, 3)
  const weakest = sorted.slice(-2).reverse()

  // Closest real player: min squared-distance across all 9 attribute ratings,
  // restricted to players eligible in this group
  const pool = ALL_PLAYERS.filter((p) => p.eligibleGroups.includes(group))
  let comparison = pool[0]
  let bestDist = Infinity
  for (const player of pool) {
    let dist = 0
    for (const key of ATTRIBUTE_KEYS) {
      const diff =
        convertGradeToRating(player.grades[key]) - (locked[key]?.rating ?? 70)
      dist += diff * diff
    }
    if (dist < bestDist) {
      bestDist = dist
      comparison = player
    }
  }

  const strengths = best
    .slice(0, 2)
    .map((b) => b.label.toLowerCase())
    .join(' and ')
  const weakness = weakest[0].label.toLowerCase()
  const scoutingReport =
    `A ${archetype.toLowerCase()} whose game is built on ${strengths}. ` +
    `Profiles closest to ${comparison.name}. ` +
    (weakest[0].rating <= 74
      ? `Scouts flag ${weakness} as the clear hole opponents will attack.`
      : `No glaring weaknesses — even the ${weakness} holds up at this level.`)

  return { best, weakest, comparison, scoutingReport }
}
