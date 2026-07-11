import { ATTRIBUTE_KEYS } from '../constants/attributes'
import { GRADE_RANK, GRADE_TO_RATING } from '../constants/grades'
import { OVERALL_WEIGHTS } from '../constants/weights'
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

/** Resolve roll-instances to players, preserving order AND duplicates; unknown names skipped. */
export function resolveRolledPlayers(names: string[]): Player[] {
  const players: Player[] = []
  for (const name of names) {
    const player = playerByName(name)
    if (player) players.push(player)
  }
  return players
}

/**
 * Hungarian algorithm (Jonker–Volgenant potentials formulation) for the
 * rectangular min-cost assignment with rows <= cols. Returns the column
 * assigned to each row. Deterministic for a given matrix.
 */
function minCostAssignment(cost: number[][]): number[] {
  const n = cost.length
  const m = cost[0].length
  const INF = Number.MAX_SAFE_INTEGER
  const u = new Array<number>(n + 1).fill(0)
  const v = new Array<number>(m + 1).fill(0)
  const colToRow = new Array<number>(m + 1).fill(0)
  const way = new Array<number>(m + 1).fill(0)
  for (let i = 1; i <= n; i++) {
    colToRow[0] = i
    let j0 = 0
    const minv = new Array<number>(m + 1).fill(INF)
    const used = new Array<boolean>(m + 1).fill(false)
    do {
      used[j0] = true
      const i0 = colToRow[j0]
      let delta = INF
      let j1 = 0
      for (let j = 1; j <= m; j++) {
        if (used[j]) continue
        const cur = cost[i0 - 1][j - 1] - u[i0] - v[j]
        if (cur < minv[j]) {
          minv[j] = cur
          way[j] = j0
        }
        if (minv[j] < delta) {
          delta = minv[j]
          j1 = j
        }
      }
      for (let j = 0; j <= m; j++) {
        if (used[j]) {
          u[colToRow[j]] += delta
          v[j] -= delta
        } else {
          minv[j] -= delta
        }
      }
      j0 = j1
    } while (colToRow[j0] !== 0)
    do {
      const j1 = way[j0]
      colToRow[j0] = colToRow[j1]
      j0 = j1
    } while (j0)
  }
  const rowToCol = new Array<number>(n).fill(-1)
  for (let j = 1; j <= m; j++) {
    if (colToRow[j] > 0) rowToCol[colToRow[j] - 1] = j - 1
  }
  return rowToCol
}

/** Maximum-weight version: rows <= cols, non-negative integer weights. */
function maxWeightAssignment(weights: number[][]): number[] {
  let max = 0
  for (const row of weights) {
    for (const w of row) if (w > max) max = w
  }
  return minCostAssignment(weights.map((row) => row.map((w) => max - w)))
}

/**
 * The exact per-attribute term the base-OVR formula uses, scaled so that
 * total-weight ties break toward earlier-rolled players: every complete
 * assignment uses exactly one earliness bonus per slot, and a real weight
 * difference (>= 1 pre-scaling) always dominates the bonus sum.
 */
function slotWeight(
  group: Group,
  attribute: AttributeKey,
  player: Player,
  rollIndex: number,
  poolSize: number,
): number {
  const base = GRADE_TO_RATING[player.grades[attribute]] * OVERALL_WEIGHTS[group][attribute]
  return base * (poolSize + 1) + (poolSize - rollIndex)
}

function toSlot(attribute: AttributeKey, player: Player): DreamSlot {
  return {
    attribute,
    grade: player.grades[attribute],
    sourcePlayerName: player.name,
    sourcePlayerTeam: player.team,
    sourcePlayerRarity: player.rarity,
  }
}

/**
 * Best build assemblable under the real one-lock-per-roll rule: each
 * roll-instance supplies at most one attribute (a player rolled twice may
 * supply two), and the player-to-slot assignment maximizes total base OVR
 * via maximum-weight bipartite matching. NOT a per-slot max — a single
 * roll of an elite player occupies exactly one slot. Null on empty pool.
 */
export function dreamBuild(
  group: Group,
  rolledPlayers: Player[],
): DreamBuild | null {
  const n = rolledPlayers.length
  if (n === 0) return null
  const dream = {} as DreamBuild

  if (n >= ATTRIBUTE_KEYS.length) {
    // rows = 9 slots, cols = roll-instances
    const weights = ATTRIBUTE_KEYS.map((key) =>
      rolledPlayers.map((p, j) => slotWeight(group, key, p, j, n)),
    )
    const assigned = maxWeightAssignment(weights)
    ATTRIBUTE_KEYS.forEach((key, i) => {
      dream[key] = toSlot(key, rolledPlayers[assigned[i]])
    })
  } else {
    // Degenerate pool (< 9 roll-instances, e.g. repaired partial save):
    // assign each roll-instance to its best slot, then fill leftovers
    // greedily from the best available grade. Never crash.
    const weights = rolledPlayers.map((p, j) =>
      ATTRIBUTE_KEYS.map((key) => slotWeight(group, key, p, j, n)),
    )
    const assigned = maxWeightAssignment(weights)
    rolledPlayers.forEach((p, j) => {
      const key = ATTRIBUTE_KEYS[assigned[j]]
      dream[key] = toSlot(key, p)
    })
    for (const key of ATTRIBUTE_KEYS) {
      if (dream[key]) continue
      let best = rolledPlayers[0]
      for (const p of rolledPlayers) {
        if (GRADE_RANK[p.grades[key]] > GRADE_RANK[best.grades[key]]) best = p
      }
      dream[key] = toSlot(key, best)
    }
    return dream
  }

  // One attribute per roll — the constraint that keeps the dream honest
  assertUsageWithinRolls(dream, rolledPlayers)
  return dream
}

function assertUsageWithinRolls(dream: DreamBuild, rolledPlayers: Player[]): void {
  const rolls = new Map<string, number>()
  for (const p of rolledPlayers) rolls.set(p.name, (rolls.get(p.name) ?? 0) + 1)
  const used = new Map<string, number>()
  for (const key of ATTRIBUTE_KEYS) {
    const name = dream[key].sourcePlayerName
    used.set(name, (used.get(name) ?? 0) + 1)
  }
  for (const [name, count] of used) {
    if (count > (rolls.get(name) ?? 0)) {
      throw new Error(
        `dreamBuild: ${name} assigned ${count} slots but rolled ${rolls.get(name) ?? 0} time(s)`,
      )
    }
  }
}

/** DreamBuild -> the LockedAttribute shape the overall/chemistry calcs eat. */
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
 * The pool is the roll-instances plus any shortfall against the locked
 * build's per-player usage (repairs pre-feature saves resumed mid-run, so
 * the actual build is always a feasible assignment and dream base OVR >=
 * actual base OVR). Null when the pool resolves empty.
 */
export function computeDreamBuildResult(
  group: Group,
  locked: Locked,
  actualOVR: number,
  rolledPlayerNames: string[],
): DreamBuildResult | null {
  const names = [...rolledPlayerNames]
  const usage = new Map<string, number>()
  for (const key of ATTRIBUTE_KEYS) {
    const name = locked[key]?.playerName
    if (name) usage.set(name, (usage.get(name) ?? 0) + 1)
  }
  for (const [name, used] of usage) {
    const have = names.reduce((c, n) => (n === name ? c + 1 : c), 0)
    for (let i = have; i < used; i++) names.push(name)
  }
  const dream = dreamBuild(group, resolveRolledPlayers(names))
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
