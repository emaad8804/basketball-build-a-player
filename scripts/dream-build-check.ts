/**
 * Dream Build sanity checks: assignment model (one attribute per roll),
 * Hungarian vs brute force, tie-breaks, invariant fuzz over real rosters.
 * Run with: npm run dream:check
 */
import { ATTRIBUTE_KEYS, BUILD_GROUPS } from '../src/constants/attributes'
import { GRADE_RANK, GRADE_TO_RATING } from '../src/constants/grades'
import { OVERALL_WEIGHTS } from '../src/constants/weights'
import { ALL_PLAYERS } from '../src/data'
import { lockAttribute, trackRolledPlayer } from '../src/game-logic/build'
import { evaluateChemistryBonuses } from '../src/game-logic/chemistry'
import {
  biggestMiss,
  computeDreamBuildResult,
  dreamBuild,
  dreamLockedAttributes,
  dreamOverall,
  isPerfectRead,
  missedOVR,
  missedSlots,
  resolveRolledPlayers,
  type DreamBuild,
} from '../src/game-logic/dreamBuild'
import { computeBaseOverall, computeFinalOverall } from '../src/game-logic/overall'
import type {
  AttributeKey,
  Group,
  LockedAttribute,
  Player,
  PlayerGrades,
  Rarity,
} from '../src/types'

let failures = 0
function check(name: string, cond: boolean): void {
  if (!cond) {
    failures++
    console.error(`FAIL  ${name}`)
  } else {
    console.log(`ok    ${name}`)
  }
}

function makePlayer(
  name: string,
  gradeOverrides: Partial<PlayerGrades>,
  rarity: Rarity = 'Common',
): Player {
  const grades = {} as PlayerGrades
  for (const key of ATTRIBUTE_KEYS) grades[key] = gradeOverrides[key] ?? 'C'
  return {
    name,
    team: 'Test Team',
    primaryPosition: 'PG',
    secondaryPositions: [],
    eligibleGroups: ['Guards'],
    rarity,
    grades,
    tags: [],
    sTierAttributes: [],
  }
}

function usageCounts(dream: DreamBuild): Map<string, number> {
  const used = new Map<string, number>()
  for (const key of ATTRIBUTE_KEYS) {
    const name = dream[key].sourcePlayerName
    used.set(name, (used.get(name) ?? 0) + 1)
  }
  return used
}

function rollCounts(pool: Player[]): Map<string, number> {
  const rolls = new Map<string, number>()
  for (const p of pool) rolls.set(p.name, (rolls.get(p.name) ?? 0) + 1)
  return rolls
}

function withinRolls(dream: DreamBuild, pool: Player[]): boolean {
  const rolls = rollCounts(pool)
  for (const [name, count] of usageCounts(dream)) {
    if (count > (rolls.get(name) ?? 0)) return false
  }
  return true
}

/** Total base-OVR weight of an assignment (pre-scaling), for optimality checks. */
function baseWeight(group: Group, dream: DreamBuild): number {
  let total = 0
  for (const key of ATTRIBUTE_KEYS) {
    total += GRADE_TO_RATING[dream[key].grade] * OVERALL_WEIGHTS[group][key]
  }
  return total
}

/** Exhaustive max total weight over all one-node-per-slot assignments. */
function bruteForceBest(group: Group, pool: Player[]): number {
  const n = pool.length
  const usedNode = new Array<boolean>(n).fill(false)
  let best = 0
  const recurse = (slotIdx: number, total: number) => {
    if (slotIdx === ATTRIBUTE_KEYS.length) {
      if (total > best) best = total
      return
    }
    const key = ATTRIBUTE_KEYS[slotIdx]
    for (let j = 0; j < n; j++) {
      if (usedNode[j]) continue
      usedNode[j] = true
      recurse(
        slotIdx + 1,
        total + GRADE_TO_RATING[pool[j].grades[key]] * OVERALL_WEIGHTS[group][key],
      )
      usedNode[j] = false
    }
  }
  recurse(0, 0)
  return best
}

// 1. Spec-mandated: one all-S elite rolled ONCE occupies exactly ONE slot
{
  const luka = makePlayer('Luka Elite', {
    frame: 'S', athleticism: 'S', shooting: 'S', finishing: 'S', ballHandling: 'S',
    playmaking: 'S', defense: 'S', rebounding: 'S', iqClutch: 'S',
  }, 'Legendary')
  const fillers = Array.from({ length: 9 }, (_, i) =>
    makePlayer(`Filler ${i}`, { shooting: 'B' }),
  )
  const dream = dreamBuild('Guards', [luka, ...fillers])!
  const lukaSlots = usageCounts(dream).get('Luka Elite') ?? 0
  check('one elite roll occupies exactly ONE slot', lukaSlots === 1)
  check('remaining 8 slots filled by other players', ATTRIBUTE_KEYS.filter(
    (k) => dream[k].sourcePlayerName !== 'Luka Elite',
  ).length === 8)
  check('no player used more than rolled', withinRolls(dream, [luka, ...fillers]))
  // Marginal advantage: fillers all have B shooting but C elsewhere, so the
  // S upgrade is worth the most on the highest-weight attribute where the
  // alternative is worst. For Guards, shooting (17) has a B alternative
  // (S-B = 17 rating pts * 17) while ballHandling (16) only has C
  // (S-C = 33 pts * 16) -> Luka belongs on ballHandling, not shooting.
  check('elite lands where marginal advantage is greatest (ballHandling)',
    dream.ballHandling.sourcePlayerName === 'Luka Elite')
  check('shooting slot takes a filler B instead', dream.shooting.grade === 'B')
}

// 2. A player rolled TWICE fills two slots when optimal
{
  const star = makePlayer('Star', { shooting: 'S', playmaking: 'S' })
  const fillers = Array.from({ length: 8 }, (_, i) => makePlayer(`F${i}`, {}))
  const pool = [star, ...fillers.slice(0, 7), star] // rolled twice
  const dream = dreamBuild('Guards', pool)!
  const starSlots = usageCounts(dream).get('Star') ?? 0
  check('player rolled twice fills exactly two slots', starSlots === 2)
  check('twice-rolled star takes shooting and playmaking',
    dream.shooting.sourcePlayerName === 'Star' && dream.playmaking.sourcePlayerName === 'Star')
}

// 3. Hungarian matches brute force on small real-roster pools
{
  let seed = 7
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0
    return seed / 4294967296
  }
  let mismatches = 0
  for (let t = 0; t < 20; t++) {
    const group = BUILD_GROUPS[Math.floor(rand() * BUILD_GROUPS.length)]
    const n = 9 + Math.floor(rand() * 3) // 9-11
    const pool: Player[] = []
    while (pool.length < n) {
      pool.push(ALL_PLAYERS[Math.floor(rand() * ALL_PLAYERS.length)])
    }
    const dream = dreamBuild(group, pool)!
    if (baseWeight(group, dream) !== bruteForceBest(group, pool)) mismatches++
    if (!withinRolls(dream, pool)) mismatches++
  }
  check('Hungarian total equals brute-force optimum (20 pools, N 9-11)', mismatches === 0)
}

// 4. Tie-break: grade-identical players -> earlier roll credited; reproducible
{
  const early = makePlayer('Early', { shooting: 'S' })
  const late = makePlayer('Late', { shooting: 'S' })
  const fillers = Array.from({ length: 8 }, (_, i) => makePlayer(`F${i}`, {}))
  const pool = [early, late, ...fillers]
  const a = dreamBuild('Guards', pool)!
  const b = dreamBuild('Guards', pool)!
  check('tie-break: earlier-rolled twin gets the S slot', a.shooting.sourcePlayerName === 'Early')
  check('deterministic: identical output across calls',
    JSON.stringify(a) === JSON.stringify(b))
}

// 5. Invariant fuzz over real rosters: actual build feasible in the pool
{
  let seed = 42
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0
    return seed / 4294967296
  }
  let violations = 0
  for (let i = 0; i < 1000; i++) {
    const group = BUILD_GROUPS[Math.floor(rand() * BUILD_GROUPS.length)]
    const n = 9 + Math.floor(rand() * 7) // 9-15 roll-instances
    const pool: Player[] = []
    while (pool.length < n) {
      pool.push(ALL_PLAYERS[Math.floor(rand() * ALL_PLAYERS.length)])
    }
    // Actual build: assign 9 distinct roll-instances to the 9 slots
    // (respects one-lock-per-roll, mirrors a real run)
    const order = pool.map((_, j) => j).sort(() => rand() - 0.5)
    let actual: Partial<Record<AttributeKey, LockedAttribute>> = {}
    ATTRIBUTE_KEYS.forEach((key, s) => {
      actual = lockAttribute(actual, key, pool[order[s]])
    })
    const actualBase = computeBaseOverall(group, actual)
    const actualOVR = computeFinalOverall(
      group,
      actual,
      evaluateChemistryBonuses(actual),
    ).overall
    const result = computeDreamBuildResult(
      group,
      actual,
      actualOVR,
      pool.map((p) => p.name),
    )!
    const dreamBase = computeBaseOverall(group, dreamLockedAttributes(result.dream))
    const downgraded = ATTRIBUTE_KEYS.some(
      (key) => GRADE_RANK[result.dream[key].grade] < GRADE_RANK[actual[key]!.grade],
    )
    if (
      dreamBase < actualBase ||
      result.missedOVR < 0 ||
      (result.perfectRead && result.missedOVR !== 0) ||
      (downgraded && result.missed.length === 0) ||
      !withinRolls(result.dream, pool)
    ) {
      violations++
    }
  }
  check('fuzz (1000 runs): dream base >= actual base, missedOVR >= 0, perfect => 0, downgrade => missed, usage <= rolls', violations === 0)
}

// 6. trackRolledPlayer now records multiplicity; resolve keeps duplicates
{
  const a = trackRolledPlayer([], 'Curry')
  const b = trackRolledPlayer(a, 'Herro')
  const c = trackRolledPlayer(b, 'Curry')
  check('trackRolledPlayer: appends every roll, duplicates kept', c.join() === 'Curry,Herro,Curry')
  const real = ALL_PLAYERS[0]
  const resolved = resolveRolledPlayers(['No Such Player', real.name, real.name])
  check('resolveRolledPlayers: skips unknowns, keeps duplicates + order',
    resolved.length === 2 && resolved[0] === real && resolved[1] === real)
}

// 7. Old-save repair: locked usage exceeding the rolled list is topped up
{
  const p1 = ALL_PLAYERS[0]
  const p2 = ALL_PLAYERS[1]
  let actual: Partial<Record<AttributeKey, LockedAttribute>> = {}
  for (const key of ATTRIBUTE_KEYS) actual = lockAttribute(actual, key, p1)
  const actualBase = computeBaseOverall('Guards', actual)
  const actualOVR = computeFinalOverall(
    'Guards',
    actual,
    evaluateChemistryBonuses(actual),
  ).overall
  // p1 locked 9 times but rolled list only has p2 (pre-feature save)
  const result = computeDreamBuildResult('Guards', actual, actualOVR, [p2.name])!
  const dreamBase = computeBaseOverall('Guards', dreamLockedAttributes(result.dream))
  check('pool repair: dream base >= actual base despite untracked locked sources', dreamBase >= actualBase)
  check('pool repair: usage within repaired rolls',
    (usageCounts(result.dream).get(p1.name) ?? 0) <= 9)
  check('empty pool overall: no names, no locks -> null', computeDreamBuildResult('Guards', {}, 70, []) === null)
}

// 8. Degenerate pool (< 9 roll-instances) doesn't crash and fills all slots
{
  const solo = makePlayer('Solo', { shooting: 'S' })
  const dream = dreamBuild('Guards', [solo])!
  check('sub-9 pool: all 9 slots filled without crashing',
    ATTRIBUTE_KEYS.every((key) => dream[key] !== undefined))
  check('sub-9 pool: S shooting kept', dream.shooting.grade === 'S')
}

// 9. Small pure helpers
{
  const p1 = ALL_PLAYERS[0]
  let actual: Partial<Record<AttributeKey, LockedAttribute>> = {}
  for (const key of ATTRIBUTE_KEYS) actual = lockAttribute(actual, key, p1)
  const selfDream = dreamBuild('Guards', Array(9).fill(p1))!
  check('self-pool: locking one player 9 times is a Perfect Read',
    isPerfectRead(missedSlots(actual, selfDream)))
  check('missedOVR clamps at 0', missedOVR(90, 88) === 0)
  const twin = makePlayer('Twin', { shooting: 'S', iqClutch: 'A' })
  const weak = makePlayer('Weak', {})
  let weakLocked: Partial<Record<AttributeKey, LockedAttribute>> = {}
  for (const key of ATTRIBUTE_KEYS) weakLocked = lockAttribute(weakLocked, key, weak)
  const d = dreamBuild('Guards', [twin, weak, ...Array(7).fill(weak)])!
  const missed = missedSlots(weakLocked, d)
  const top = biggestMiss(weakLocked, d, missed)
  check('biggestMiss: largest grade gap wins (S shooting)', top?.attribute === 'shooting')
  check('dreamOverall runs the real pipeline', typeof dreamOverall('Guards', d) === 'number')
}

if (failures > 0) {
  console.error(`\n${failures} check(s) failed`)
  process.exit(1)
}
console.log('\nAll dream-build checks passed')
