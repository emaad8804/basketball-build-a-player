import { ATTRIBUTE_KEYS } from '../constants/attributes'
import { GRADE_RANK } from '../constants/grades'
import { playerByName } from '../data'
import type {
  AttributeKey,
  Grade,
  Group,
  LockedAttribute,
  Player,
  Rarity,
} from '../types'
import { evaluateChemistryBonuses } from './chemistry'
import { convertGradeToRating } from './grades'
import { computeFinalOverall } from './overall'

export interface DreamSlot {
  attribute: AttributeKey
  grade: Grade
  sourcePlayerName: string
  sourcePlayerTeam: string
  sourcePlayerRarity: Rarity
}

export type DreamBuild = Record<AttributeKey, DreamSlot>

export interface DreamBuildResult {
  dream: DreamBuild
  dreamOVR: number
  missed: AttributeKey[]
  missedOVR: number
  perfectRead: boolean
}

type Locked = Partial<Record<AttributeKey, LockedAttribute>>

/** Resolve rolled names to players, preserving roll order; unknown names skipped. */
export function resolveRolledPlayers(names: string[]): Player[] {
  const players: Player[] = []
  for (const name of names) {
    const player = playerByName(name)
    if (player) players.push(player)
  }
  return players
}

/**
 * Best grade per attribute across the rolled pool. Strictly-greater
 * comparison keeps the FIRST player seen with the top grade (stable
 * tie-break — roll order matters). Null on an empty pool.
 */
export function dreamBuild(rolledPlayers: Player[]): DreamBuild | null {
  if (rolledPlayers.length === 0) return null
  const dream = {} as DreamBuild
  for (const key of ATTRIBUTE_KEYS) {
    let best: Player = rolledPlayers[0]
    for (const player of rolledPlayers) {
      if (GRADE_RANK[player.grades[key]] > GRADE_RANK[best.grades[key]]) {
        best = player
      }
    }
    dream[key] = {
      attribute: key,
      grade: best.grades[key],
      sourcePlayerName: best.name,
      sourcePlayerTeam: best.team,
      sourcePlayerRarity: best.rarity,
    }
  }
  return dream
}

/** Dream build in the LockedAttribute shape the overall/chemistry calcs eat. */
export function dreamLockedAttributes(dream: DreamBuild): Locked {
  const locked: Locked = {}
  for (const key of ATTRIBUTE_KEYS) {
    const slot = dream[key]
    locked[key] = {
      attribute: key,
      playerName: slot.sourcePlayerName,
      playerTeam: slot.sourcePlayerTeam,
      grade: slot.grade,
      rating: convertGradeToRating(slot.grade),
      rarity: slot.sourcePlayerRarity,
    }
  }
  return locked
}

/** Final OVR of the dream build — same pipeline as the real build (base + chemistry, capped). */
export function dreamOverall(group: Group, dream: DreamBuild): number {
  const locked = dreamLockedAttributes(dream)
  return computeFinalOverall(group, locked, evaluateChemistryBonuses(locked))
    .overall
}

/** Slots where the actual locked grade ranks strictly below the dream grade. */
export function missedSlots(actual: Locked, dream: DreamBuild): AttributeKey[] {
  return ATTRIBUTE_KEYS.filter((key) => {
    const lockedAttr = actual[key]
    return lockedAttr && GRADE_RANK[lockedAttr.grade] < GRADE_RANK[dream[key].grade]
  })
}

export function missedOVR(actualOVR: number, dreamOVR: number): number {
  return Math.max(0, dreamOVR - actualOVR)
}

export function isPerfectRead(missed: AttributeKey[]): boolean {
  return missed.length === 0
}

/** The single biggest miss (largest grade-rank gap; ties by attribute order) for the share hook. */
export function biggestMiss(
  actual: Locked,
  dream: DreamBuild,
  missed: AttributeKey[],
): { attribute: AttributeKey; slot: DreamSlot; actualGrade: Grade } | null {
  let best: { attribute: AttributeKey; slot: DreamSlot; actualGrade: Grade } | null =
    null
  let bestGap = 0
  for (const key of missed) {
    const lockedAttr = actual[key]
    if (!lockedAttr) continue
    const gap = GRADE_RANK[dream[key].grade] - GRADE_RANK[lockedAttr.grade]
    if (gap > bestGap) {
      bestGap = gap
      best = { attribute: key, slot: dream[key], actualGrade: lockedAttr.grade }
    }
  }
  return best
}

/**
 * One aggregator so the result screen and share text derive identically.
 * The pool is the rolled names plus any locked source not already tracked
 * (repairs pre-feature saves resumed mid-run, so dream >= actual always
 * holds per attribute). Null when the pool resolves empty.
 */
export function computeDreamBuildResult(
  group: Group,
  locked: Locked,
  actualOVR: number,
  rolledPlayerNames: string[],
): DreamBuildResult | null {
  const names = [...rolledPlayerNames]
  for (const key of ATTRIBUTE_KEYS) {
    const name = locked[key]?.playerName
    if (name && !names.includes(name)) names.push(name)
  }
  const dream = dreamBuild(resolveRolledPlayers(names))
  if (!dream) return null
  const dreamOVR = dreamOverall(group, dream)
  const missed = missedSlots(locked, dream)
  return {
    dream,
    dreamOVR,
    missed,
    missedOVR: missedOVR(actualOVR, dreamOVR),
    perfectRead: isPerfectRead(missed),
  }
}
