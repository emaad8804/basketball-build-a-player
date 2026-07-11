/**
 * Dream Build sanity checks: recombination, tie-breaks, OVR pipeline
 * identity, monotonicity fuzz. Run with: npm run dream:check
 */
import { ATTRIBUTE_KEYS, BUILD_GROUPS } from '../src/constants/attributes'
import { GRADE_RANK } from '../src/constants/grades'
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
} from '../src/game-logic/dreamBuild'
import { computeFinalOverall } from '../src/game-logic/overall'
import type {
  AttributeKey,
  Grade,
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

// 1. Recombination picks the per-attribute max; first-seen wins ties
{
  const p1 = makePlayer('One', { shooting: 'A', defense: 'B' })
  const p2 = makePlayer('Two', { shooting: 'S', frame: 'A-' })
  const p3 = makePlayer('Three', { shooting: 'S', defense: 'A+' })
  const dream = dreamBuild([p1, p2, p3])!
  check('recombination: best shooting is S', dream.shooting.grade === 'S')
  check(
    'tie-break: first-seen S shooter wins',
    dream.shooting.sourcePlayerName === 'Two',
  )
  check('recombination: best defense from Three', dream.defense.sourcePlayerName === 'Three')
  check('recombination: best frame from Two', dream.frame.sourcePlayerName === 'Two')
  check(
    'tie-break: all-C attribute credits first player',
    dream.athleticism.sourcePlayerName === 'One',
  )
  check('empty pool -> null', dreamBuild([]) === null)
}

// 2. dreamOverall === the real final-overall pipeline on the same locked shape
{
  const pool = [
    makePlayer('A', { shooting: 'S', ballHandling: 'A', playmaking: 'A' }),
    makePlayer('B', { frame: 'A+', defense: 'A', rebounding: 'A-' }),
  ]
  const dream = dreamBuild(pool)!
  const locked = dreamLockedAttributes(dream)
  const expected = computeFinalOverall(
    'Guards',
    locked,
    evaluateChemistryBonuses(locked),
  ).overall
  check('dreamOverall matches computeFinalOverall pipeline', dreamOverall('Guards', dream) === expected)
}

// 3. Chemistry uplift: recombination triggers Floor General when no single
//    assignment does (playmaking A from one player, iqClutch A from another)
{
  const p1 = makePlayer('Passer', { playmaking: 'A' })
  const p2 = makePlayer('Brain', { iqClutch: 'A' })
  let actual: Partial<Record<AttributeKey, LockedAttribute>> = {}
  for (const key of ATTRIBUTE_KEYS) actual = lockAttribute(actual, key, p1)
  const actualBonuses = evaluateChemistryBonuses(actual)
  const actualOVR = computeFinalOverall('Guards', actual, actualBonuses).overall
  // Synthetic players aren't in the real DB, so exercise the pure pieces
  // directly rather than the name-resolving aggregator
  const dream = dreamBuild([p1, p2])!
  const missed = missedSlots(actual, dream)
  const delta = missedOVR(actualOVR, dreamOverall('Guards', dream))
  const dreamLocked = dreamLockedAttributes(dream)
  const dreamBonuses = evaluateChemistryBonuses(dreamLocked)
  check(
    'chemistry uplift: actual build has no Floor General',
    !actualBonuses.some((b) => b.name === 'Floor General'),
  )
  check(
    'chemistry uplift: dream build triggers Floor General',
    dreamBonuses.some((b) => b.name === 'Floor General'),
  )
  check('chemistry uplift: missed slot is iqClutch', missed.join() === 'iqClutch')
  check('chemistry uplift: missedOVR > 0', delta > 0)
  const top = biggestMiss(actual, dream, missed)
  check(
    'biggestMiss: iqClutch A from Brain',
    top?.attribute === 'iqClutch' && top.slot.sourcePlayerName === 'Brain',
  )
}

// 4. Monotonicity fuzz over real roster data
{
  let seed = 42
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0
    return seed / 4294967296
  }
  let violations = 0
  for (let i = 0; i < 2000; i++) {
    const group = BUILD_GROUPS[Math.floor(rand() * BUILD_GROUPS.length)]
    const poolSize = 3 + Math.floor(rand() * 10)
    const pool: Player[] = []
    for (let j = 0; j < poolSize; j++) {
      const p = ALL_PLAYERS[Math.floor(rand() * ALL_PLAYERS.length)]
      if (!pool.includes(p)) pool.push(p)
    }
    let actual: Partial<Record<AttributeKey, LockedAttribute>> = {}
    for (const key of ATTRIBUTE_KEYS) {
      actual = lockAttribute(actual, key, pool[Math.floor(rand() * pool.length)])
    }
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
    if (
      result.dreamOVR < actualOVR ||
      result.missedOVR < 0 ||
      (result.perfectRead && result.missedOVR !== 0)
    ) {
      violations++
    }
    for (const key of ATTRIBUTE_KEYS) {
      if (GRADE_RANK[result.dream[key].grade] < GRADE_RANK[actual[key]!.grade]) {
        violations++
      }
    }
  }
  check('fuzz (2000 runs): dreamOVR >= actualOVR, missedOVR >= 0, perfect => 0 delta, dream >= actual per slot', violations === 0)
}

// 5. Degenerate corner: misses exist but the OVR delta rounds to 0
{
  const grades: Grade[] = ['S', 'A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'D']
  let found = false
  outer: for (const group of BUILD_GROUPS) {
    for (const key of ATTRIBUTE_KEYS) {
      for (let g = 1; g < grades.length; g++) {
        const base = makePlayer('Base', { [key]: grades[g] })
        const better = makePlayer('Better', { [key]: grades[g - 1] })
        let actual: Partial<Record<AttributeKey, LockedAttribute>> = {}
        for (const k of ATTRIBUTE_KEYS) actual = lockAttribute(actual, k, base)
        const actualOVR = computeFinalOverall(
          group,
          actual,
          evaluateChemistryBonuses(actual),
        ).overall
        const dream = dreamBuild([base, better])!
        const missed = missedSlots(actual, dream)
        const delta = missedOVR(actualOVR, dreamOverall(group, dream))
        if (missed.length > 0 && delta === 0) {
          check('degenerate corner: missed slots with 0 OVR delta is reachable and not perfectRead', !isPerfectRead(missed))
          found = true
          break outer
        }
      }
    }
  }
  if (!found) console.log('note  degenerate corner (miss with 0 delta) not constructible from single-step grades — fine')
}

// 6. trackRolledPlayer + resolveRolledPlayers
{
  const a = trackRolledPlayer([], 'Curry')
  const b = trackRolledPlayer(a, 'Herro')
  const c = trackRolledPlayer(b, 'Curry')
  check('trackRolledPlayer: dedupes, keeps first-seen order', c.join() === 'Curry,Herro')
  check('trackRolledPlayer: no-op returns same reference', trackRolledPlayer(c, 'Curry') === c)
  const real = ALL_PLAYERS[0]
  const resolved = resolveRolledPlayers(['No Such Player', real.name])
  check('resolveRolledPlayers: skips unknown names, preserves order', resolved.length === 1 && resolved[0] === real)
}

// 7. Pool repair: a locked source missing from the rolled list still counts
{
  const p1 = ALL_PLAYERS[0]
  const p2 = ALL_PLAYERS[1]
  let actual: Partial<Record<AttributeKey, LockedAttribute>> = {}
  for (const key of ATTRIBUTE_KEYS) actual = lockAttribute(actual, key, p1)
  const actualOVR = computeFinalOverall(
    'Guards',
    actual,
    evaluateChemistryBonuses(actual),
  ).overall
  // p1 locked everywhere but absent from the rolled list (pre-feature save)
  const result = computeDreamBuildResult('Guards', actual, actualOVR, [p2.name])!
  const holds = ATTRIBUTE_KEYS.every(
    (key) => GRADE_RANK[result.dream[key].grade] >= GRADE_RANK[actual[key]!.grade],
  )
  check('pool repair: dream >= actual per slot despite untracked locked source', holds)
  check('empty pool overall: no names, no locks -> null', computeDreamBuildResult('Guards', {}, 70, []) === null)
  check('missedOVR clamps at 0', missedOVR(90, 88) === 0)
  check('isPerfectRead on empty miss list', isPerfectRead(missedSlots(actual, dreamBuild([p1])!)))
}

if (failures > 0) {
  console.error(`\n${failures} check(s) failed`)
  process.exit(1)
}
console.log('\nAll dream-build checks passed')
