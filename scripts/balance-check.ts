/**
 * Monte-Carlo balance check: season outcomes by overall x team tier, and
 * realized spin rarity shares. Run with: npm run balance:check
 */
import { ATTRIBUTE_KEYS } from '../src/constants/attributes'
import { FLAWS, type FlawId } from '../src/constants/flaws'
import {
  TEAM_TIERS,
  carriedWinPctDelta,
  type TeamTierId,
} from '../src/constants/teamStrength'
import { NBA_TEAMS } from '../src/constants/teams'
import { spinPlayer } from '../src/game-logic/spin'
import { simulateFinals } from '../src/simulation/finalsSim'
import { rollGlassBones } from '../src/simulation/flawEffects'
import { simulatePlayIn } from '../src/simulation/playInSim'
import { simulatePlayoffs } from '../src/simulation/playoffSim'
import type { ActiveFlaw, BuildProfile } from '../src/simulation/profile'
import { simulateSeason } from '../src/simulation/seasonSim'
import type { AttributeKey, Group, Rarity } from '../src/types'

const RUNS = 2000
const OVERALLS = [78, 80, 82, 84, 86, 88, 90, 94, 96]
const TIER_IDS: TeamTierId[] = [
  'contender',
  'playoff-lock',
  'middle',
  'rebuilding',
  'tanking',
]

function makeProfile(overall: number, tierId: TeamTierId): BuildProfile {
  const ratings = {} as Record<AttributeKey, number>
  for (const key of ATTRIBUTE_KEYS) ratings[key] = overall
  const tier = TEAM_TIERS[tierId]
  return {
    group: 'Centers',
    overall,
    ratings,
    flaw: null,
    homeTeamName: null,
    homeConference: 'West',
    teamStrengthDelta: tier.strengthDelta,
    teamWinPctDelta: carriedWinPctDelta(tier.winPctDelta, overall),
  }
}

console.log(`Season outcomes (${RUNS} sims per cell)`)
console.log('cell = mean wins | playoff% (>=44 W) | play-in% (40-43 W) | modal seed')
const header = ['OVR', ...TIER_IDS].map((s) => s.padEnd(26)).join('')
console.log(header)

for (const overall of OVERALLS) {
  const cells = [String(overall).padEnd(26)]
  for (const tierId of TIER_IDS) {
    const profile = makeProfile(overall, tierId)
    let totalWins = 0
    let playoffs = 0
    let playIn = 0
    const seedCounts = new Map<number, number>()
    for (let i = 0; i < RUNS; i++) {
      const season = simulateSeason(profile)
      totalWins += season.wins
      if (season.madePlayoffs) playoffs++
      else if (season.playInEligible) playIn++
      seedCounts.set(season.seed, (seedCounts.get(season.seed) ?? 0) + 1)
    }
    const modalSeed = [...seedCounts.entries()].sort((a, b) => b[1] - a[1])[0][0]
    const cell = `${(totalWins / RUNS).toFixed(1)} W | ${pct(playoffs)} | ${pct(playIn)} | s${modalSeed}`
    cells.push(cell.padEnd(26))
  }
  console.log(cells.join(''))
}

function pct(n: number): string {
  return `${((n / RUNS) * 100).toFixed(0)}%`
}

// ---------------------------------------------------------------------------
// Playoff outcome tables (SIM_BALANCE.md §2). Mirrors the app's postseason
// chain in gameReducer's SIMULATE_PLAYOFFS: play-in survivors enter as the
// 8 seed, and Glass Bones rolls once more at the door of the NBA Finals.
// ---------------------------------------------------------------------------

type PostseasonOutcome =
  | 'missed'
  | 'elim-r1'
  | 'elim-r2'
  | 'elim-cf'
  | 'finals-injury'
  | 'finals-loss'
  | 'title'

interface SeriesRecord {
  length: number
  /** Lost the series 0-4 (the build got swept). */
  sweptLoss: boolean
  /** Series ended 4-0 either direction. */
  sweep: boolean
}

function runPostseason(profile: BuildProfile): {
  outcome: PostseasonOutcome
  series: SeriesRecord[]
} {
  const season = simulateSeason(profile)
  const playIn = season.playInEligible ? simulatePlayIn(profile, season) : null
  const qualified = season.madePlayoffs || playIn?.survived === true
  if (!qualified) return { outcome: 'missed', series: [] }

  const playoffs = simulatePlayoffs(
    profile,
    season,
    season.madePlayoffs ? undefined : 8,
  )
  const series: SeriesRecord[] = playoffs.rounds.map((r) => ({
    length: r.games.length,
    sweptLoss: !r.won && r.winsFor === 0,
    sweep: r.winsFor === 0 || r.winsAgainst === 0,
  }))

  if (!playoffs.reachedFinals) {
    const outcome: PostseasonOutcome =
      playoffs.eliminatedIn === 'First Round'
        ? 'elim-r1'
        : playoffs.eliminatedIn === 'Second Round'
          ? 'elim-r2'
          : 'elim-cf'
    return { outcome, series }
  }

  if (rollGlassBones(profile.flaw)) return { outcome: 'finals-injury', series }

  const finals = simulateFinals(profile, season)
  series.push({
    length: finals.games.length,
    sweptLoss: !finals.won && finals.winsFor === 0,
    sweep: finals.winsFor === 0 || finals.winsAgainst === 0,
  })
  return { outcome: finals.won ? 'title' : 'finals-loss', series }
}

interface CellStats {
  runs: number
  outcomes: Record<PostseasonOutcome, number>
  /** Runs in which the build lost at least one series 0-4. */
  sweptRuns: number
  seriesCount: number
  seriesGames: number
}

function collectCell(
  profile: BuildProfile,
  runs: number,
  pool?: SeriesRecord[],
): CellStats {
  const outcomes: Record<PostseasonOutcome, number> = {
    missed: 0,
    'elim-r1': 0,
    'elim-r2': 0,
    'elim-cf': 0,
    'finals-injury': 0,
    'finals-loss': 0,
    title: 0,
  }
  let sweptRuns = 0
  let seriesCount = 0
  let seriesGames = 0
  for (let i = 0; i < runs; i++) {
    const { outcome, series } = runPostseason(profile)
    outcomes[outcome]++
    if (series.some((s) => s.sweptLoss)) sweptRuns++
    seriesCount += series.length
    seriesGames += series.reduce((sum, s) => sum + s.length, 0)
    pool?.push(...series)
  }
  return { runs, outcomes, sweptRuns, seriesCount, seriesGames }
}

function pctOf(n: number, total: number): number {
  return Math.round((n / total) * 100)
}

function meanLength(stats: CellStats): string {
  return stats.seriesCount === 0
    ? '-'
    : `${(stats.seriesGames / stats.seriesCount).toFixed(2)}g`
}

const PLAYOFF_PAD = 44
const allSeries: SeriesRecord[] = []

console.log(`\nTable 2 — Playoff outcomes (${RUNS} sims per cell, % of all sims)`)
console.log(
  'cell = bracket% | T title% F reached-finals% | elim R1/R2/CF% | sw swept-in-a-series% | mean series length',
)
console.log(['OVR', ...TIER_IDS].map((s) => s.padEnd(PLAYOFF_PAD)).join(''))

for (const overall of OVERALLS) {
  const cells = [String(overall).padEnd(PLAYOFF_PAD)]
  for (const tierId of TIER_IDS) {
    const stats = collectCell(makeProfile(overall, tierId), RUNS, allSeries)
    const o = stats.outcomes
    const bracket = stats.runs - o.missed
    const reachedFinals = o['finals-injury'] + o['finals-loss'] + o.title
    const cell = [
      `${pctOf(bracket, stats.runs)}%`,
      `T${pctOf(o.title, stats.runs)} F${pctOf(reachedFinals, stats.runs)}`,
      `e${pctOf(o['elim-r1'], stats.runs)}/${pctOf(o['elim-r2'], stats.runs)}/${pctOf(o['elim-cf'], stats.runs)}`,
      `sw${pctOf(stats.sweptRuns, stats.runs)}`,
      meanLength(stats),
    ].join(' | ')
    cells.push(cell.padEnd(PLAYOFF_PAD))
  }
  console.log(cells.join(''))
}

console.log(`\nTable 3 — Flaw isolation (94 OVR on contender, ${RUNS} sims per row)`)
console.log(
  ['FLAW', 'title%', 'swept%', 'mean series length']
    .map((s) => s.padEnd(18))
    .join(''),
)

const flawRows: (FlawId | null)[] = [null, ...FLAWS.map((f) => f.id)]
for (const flawId of flawRows) {
  const profile = makeProfile(94, 'contender')
  if (flawId) {
    // Flat 94 ratings sit below SOFTEN_THRESHOLD, so the flaw is never softened.
    const flaw: ActiveFlaw = { id: flawId, softened: false, mult: 1 }
    profile.flaw = flaw
  }
  const stats = collectCell(profile, RUNS)
  console.log(
    [
      flawId ?? 'no-flaw',
      `${pctOf(stats.outcomes.title, stats.runs)}%`,
      `${pctOf(stats.sweptRuns, stats.runs)}%`,
      meanLength(stats),
    ]
      .map((s) => s.padEnd(18))
      .join(''),
  )
}

console.log(
  `\nTable 4 — League-wide series shape (${allSeries.length} series pooled across all Table 2 cells)`,
)
const lengthCounts = new Map<number, number>()
for (const s of allSeries) {
  lengthCounts.set(s.length, (lengthCounts.get(s.length) ?? 0) + 1)
}
for (const games of [4, 5, 6, 7]) {
  const count = lengthCounts.get(games) ?? 0
  console.log(
    `  ${String(games).padEnd(3)}games  ${((count / allSeries.length) * 100).toFixed(1)}%`,
  )
}
const sweepCount = allSeries.filter((s) => s.sweep).length
console.log(
  `  sweep share (4-0 either direction): ${((sweepCount / allSeries.length) * 100).toFixed(1)}%`,
)
console.log(
  `  mean series length: ${(allSeries.reduce((sum, s) => sum + s.length, 0) / allSeries.length).toFixed(2)} games`,
)

// Realized rarity shares: spin every team x group pool many times.
const SPINS_PER_POOL = 500
const GROUPS: Group[] = ['Guards', 'Forwards', 'Centers']
const rarityCounts = new Map<Rarity, number>()
let totalSpins = 0
for (const team of NBA_TEAMS) {
  for (const group of GROUPS) {
    for (let i = 0; i < SPINS_PER_POOL; i++) {
      const player = spinPlayer(team.name, group, Math.random)
      if (!player) break
      rarityCounts.set(player.rarity, (rarityCounts.get(player.rarity) ?? 0) + 1)
      totalSpins++
    }
  }
}

console.log(`\nRealized spin rarity shares (${totalSpins} spins across all team/group pools)`)
for (const [rarity, count] of [...rarityCounts.entries()].sort((a, b) => b[1] - a[1])) {
  console.log(`  ${rarity.padEnd(10)} ${((count / totalSpins) * 100).toFixed(1)}%`)
}
