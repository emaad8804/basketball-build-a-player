/**
 * Monte-Carlo balance check: season outcomes by overall x team tier, and
 * realized spin rarity shares. Run with: npm run balance:check
 */
import { ATTRIBUTE_KEYS } from '../src/constants/attributes'
import {
  TEAM_TIERS,
  carriedWinPctDelta,
  type TeamTierId,
} from '../src/constants/teamStrength'
import { NBA_TEAMS } from '../src/constants/teams'
import { spinPlayer } from '../src/game-logic/spin'
import type { BuildProfile } from '../src/simulation/profile'
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
