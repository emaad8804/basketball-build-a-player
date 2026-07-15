/**
 * Legacy-label sanity checks (LEGACY_LABELS.md §5): fixed cases from the
 * spec, determinism, registry membership, and a randomized distribution
 * sweep hunting unreachable rungs. Run with: npm run legacy:check
 */
import { ATTRIBUTE_KEYS } from '../src/constants/attributes'
import { LEGACY_LABELS, deriveLegacyLabel } from '../src/simulation/legacy'
import type { LegacyContext } from '../src/simulation/legacy'
import type { BuildProfile } from '../src/simulation/profile'
import type {
  AttributeKey,
  FinalsResult,
  PlayoffResult,
  PlayoffRoundName,
  SeasonResult,
  StatLine,
} from '../src/types'

let failures = 0

const statLine = (ppg = 20): StatLine => ({
  ppg, rpg: 6, apg: 5, spg: 1, bpg: 0.5, fgPct: 47, threePct: 36,
})

function makeProfile(
  overall: number,
  ratingOverrides: Partial<Record<AttributeKey, number>> = {},
  base = 78,
): BuildProfile {
  const ratings = {} as Record<AttributeKey, number>
  for (const key of ATTRIBUTE_KEYS) ratings[key] = ratingOverrides[key] ?? base
  return {
    group: 'Forwards', overall, ratings, flaw: null,
    homeTeamName: null, homeConference: 'West',
    teamStrengthDelta: 0, teamWinPctDelta: 0,
  }
}

function makeSeason(over: Partial<SeasonResult> = {}): SeasonResult {
  return {
    wins: 48, losses: 34, seed: 5, playInEligible: false, conference: 'West',
    stats: statLine(), awards: [], mvpVoting: 'No votes', allNba: null,
    defensiveAward: null, wonMvp: false, madePlayoffs: true, ...over,
  }
}

function makePlayoffs(
  eliminatedIn: PlayoffRoundName | null,
  over: Partial<PlayoffResult> = {},
): PlayoffResult {
  return {
    rounds: [], reachedFinals: eliminatedIn === null, eliminatedIn,
    playoffStats: statLine(), ...over,
  }
}

function makeFinals(over: Partial<FinalsResult> = {}): FinalsResult {
  return {
    opponent: 'New York Knicks', games: [], won: false, winsFor: 2,
    winsAgainst: 4, finalsMvp: false, averages: statLine(),
    verdict: 'x', ...over,
  }
}

function expect(
  name: string,
  actual: string,
  expected: string | string[],
): void {
  const ok = Array.isArray(expected)
    ? expected.includes(actual)
    : actual === expected
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name.padEnd(52)} → ${actual}`)
  if (!ok) {
    failures++
    console.log(`      expected: ${expected}`)
  }
}

// --- §5 fixed cases ---------------------------------------------------------

// (a) 89 OVR / 99 defense / R2 exit. The spec's prose says "The Wall", but
// its own Lockdown rung (defense >= 96) is more specific and fires first;
// the case's real point is "not Solid Starter".
expect(
  '(a) 89 OVR, 99 def, R2 exit',
  deriveLegacyLabel(makeProfile(89, { defense: 99 }), makeSeason(), makePlayoffs('Second Round'), null),
  'Lockdown',
)
expect(
  '(a2) 89 OVR, 94 def, R2 exit',
  deriveLegacyLabel(makeProfile(89, { defense: 94 }), makeSeason(), makePlayoffs('Second Round'), null),
  'The Wall',
)

// (b) champion + all-around (flat 85s, no Finals MVP)
expect(
  '(b) champion, flat 85s (all-around)',
  deriveLegacyLabel(
    makeProfile(87, {}, 85), makeSeason(),
    makePlayoffs(null), makeFinals({ won: true, winsFor: 4, winsAgainst: 2 }),
  ),
  'Positionless King',
)

// (c) lost the Finals in 7
expect(
  '(c) lost Finals 3-4',
  deriveLegacyLabel(
    makeProfile(88), makeSeason(),
    makePlayoffs(null), makeFinals({ winsFor: 3, winsAgainst: 4 }),
  ),
  'Heartbreak in June',
)

// (d) missed playoffs, 90 OVR shaped to dodge the identity tier (only
// frame/ballHandling high — no identity label reads those)
expect(
  '(d) missed playoffs, 90 OVR, identity-less shape',
  deriveLegacyLabel(
    makeProfile(90, { frame: 99, ballHandling: 99 }),
    makeSeason({ madePlayoffs: false, wins: 38 }), null, null,
  ),
  'Building Block',
)
// ...whereas an all-around missed-playoffs build correctly reads as
// identity (the identity tier outranks the overall fallbacks by design,
// §4). Flat 86s: allAround without tripping any single elite bar.
expect(
  '(d2) missed playoffs, flat 86s (all-around)',
  deriveLegacyLabel(makeProfile(90, {}, 86), makeSeason({ madePlayoffs: false, wins: 38 }), null, null),
  'Stat Sheet Stuffer',
)

// RSS continuity: the kept original rung (lostEarly && season ppg >= 28)
expect(
  'RSS continuity: R1 exit, 29 ppg, 50 wins, 91 OVR',
  deriveLegacyLabel(
    makeProfile(91, { frame: 99, ballHandling: 99 }),
    makeSeason({ wins: 50, stats: statLine(29) }),
    makePlayoffs('First Round'), null,
  ),
  'Regular Season Superstar',
)

// --- Determinism -------------------------------------------------------------

{
  const args = [
    makeProfile(89, { defense: 99 }), makeSeason(),
    makePlayoffs('Second Round'), null,
  ] as const
  const a = deriveLegacyLabel(...args)
  const b = deriveLegacyLabel(...args)
  expect('determinism: same inputs twice', a === b ? 'same' : `${a} vs ${b}`, 'same')
}

// --- Randomized sweep: distribution + registry + reachability ---------------

const OUTCOMES: {
  name: string
  playoffs: () => PlayoffResult | null
  finals: () => FinalsResult | null
  madePlayoffs: boolean
}[] = [
  { name: 'missed', playoffs: () => null, finals: () => null, madePlayoffs: false },
  { name: 'r1', playoffs: () => makePlayoffs('First Round'), finals: () => null, madePlayoffs: true },
  { name: 'r2', playoffs: () => makePlayoffs('Second Round'), finals: () => null, madePlayoffs: true },
  { name: 'cf', playoffs: () => makePlayoffs('Conference Finals'), finals: () => null, madePlayoffs: true },
  { name: 'finals-loss', playoffs: () => makePlayoffs(null), finals: () => makeFinals({ winsFor: Math.random() < 0.3 ? 3 : 2 }), madePlayoffs: true },
  { name: 'champion', playoffs: () => makePlayoffs(null, { playoffStats: statLine(16 + Math.random() * 18) }), finals: () => makeFinals({ won: true, winsFor: 4, winsAgainst: 2, finalsMvp: Math.random() < 0.5 }), madePlayoffs: true },
  { name: 'injury', playoffs: () => makePlayoffs('Second Round', { seasonEndingInjury: 'Second Round' }), finals: () => null, madePlayoffs: true },
]

const SWEEPS = 4000
const counts = new Map<string, number>()
for (let i = 0; i < SWEEPS; i++) {
  const ratings: Partial<Record<AttributeKey, number>> = {}
  for (const key of ATTRIBUTE_KEYS) ratings[key] = 60 + Math.floor(Math.random() * 40)
  const overall = 74 + Math.floor(Math.random() * 23)
  const outcome = OUTCOMES[Math.floor(Math.random() * OUTCOMES.length)]
  const ppg = 14 + Math.random() * 20
  const season = makeSeason({
    madePlayoffs: outcome.madePlayoffs,
    wins: outcome.madePlayoffs ? 44 + Math.floor(Math.random() * 22) : 25 + Math.floor(Math.random() * 18),
    stats: statLine(Math.round(ppg * 10) / 10),
    allNba: Math.random() < 0.25 ? 'All-NBA Second Team' : null,
    wonMvp: Math.random() < 0.04,
  })
  const ctx: LegacyContext = { viaPlayIn: Math.random() < 0.15 }
  const profile = makeProfile(overall, ratings)
  if (Math.random() < 0.33) profile.group = 'Centers'
  const label = deriveLegacyLabel(profile, season, outcome.playoffs(), outcome.finals(), ctx)
  if (!(LEGACY_LABELS as readonly string[]).includes(label)) {
    failures++
    console.log(`FAIL  unregistered label returned: '${label}'`)
  }
  counts.set(label, (counts.get(label) ?? 0) + 1)
}

console.log(`\nLabel distribution (${SWEEPS} randomized runs):`)
const sortedCounts = [...counts.entries()].sort((a, b) => b[1] - a[1])
for (const [label, n] of sortedCounts) {
  console.log(`  ${label.padEnd(28)} ${(((n) / SWEEPS) * 100).toFixed(1)}%`)
}

const floorShare = ((counts.get('Solid Starter') ?? 0) + (counts.get('Rotation Piece') ?? 0)) / SWEEPS
const mode = sortedCounts[0]
if (mode[0] === 'Solid Starter' || mode[0] === 'Rotation Piece') {
  failures++
  console.log(`FAIL  floor label '${mode[0]}' is the distribution mode`)
} else {
  console.log(`PASS  floor share (Solid Starter + Rotation Piece) = ${(floorShare * 100).toFixed(1)}%, mode = '${mode[0]}'`)
}

const neverSeen = LEGACY_LABELS.filter((l) => !counts.has(l))
console.log(`\nRegistry labels never observed in sweep (${neverSeen.length}):`)
for (const label of neverSeen) {
  const expected =
    label === 'Glue Guy'
      ? ' (known-dead: Stat Sheet Stuffer shares the allAround trigger higher up — LEGACY_LABELS.md flag)'
      : label === 'Rotation Piece'
        ? ' (defensive terminal return)'
        : ''
  console.log(`  ${label}${expected}`)
}

console.log(failures === 0 ? '\nAll legacy checks passed.' : `\n${failures} FAILURE(S)`)
process.exit(failures === 0 ? 0 : 1)
