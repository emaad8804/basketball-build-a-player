import { CENTER_TYPE_WEIGHTS, RARITY_WEIGHTS } from '../constants/attributes'
import { NBA_TEAMS } from '../constants/teams'
import { playersOnTeamInGroup } from '../data'
import type { CenterType, Group, Player, Rarity, Team } from '../types'
import type { Rand } from './rng'

function pickRandom<T>(items: T[], rand: Rand): T {
  return items[Math.floor(rand() * items.length)]
}

/**
 * Weighted pick by rarity tier: stars are harder to land than role
 * players. Weights renormalize over the tiers present in the pool.
 */
function pickRarityWeighted(players: Player[], rand: Rand): Player {
  if (players.length === 1) return players[0]

  const byRarity = new Map<Rarity, Player[]>()
  for (const p of players) {
    const list = byRarity.get(p.rarity)
    if (list) list.push(p)
    else byRarity.set(p.rarity, [p])
  }

  const presentTiers = [...byRarity.keys()]
  if (presentTiers.length === 1) return pickRandom(players, rand)

  const totalWeight = presentTiers.reduce(
    (sum, tier) => sum + RARITY_WEIGHTS[tier],
    0,
  )
  let roll = rand() * totalWeight
  for (const tier of presentTiers) {
    roll -= RARITY_WEIGHTS[tier]
    if (roll <= 0) return pickRandom(byRarity.get(tier)!, rand)
  }
  return pickRandom(byRarity.get(presentTiers[presentTiers.length - 1])!, rand)
}

/**
 * Spin a random NBA team that has at least one eligible player in the
 * chosen group (auto-respins internally so the user never lands on a
 * dead team — the spec's preferred graceful handling).
 */
export function spinTeam(group: Group, rand: Rand, excludeTeam?: string): Team {
  const eligible = NBA_TEAMS.filter(
    (t) =>
      playersOnTeamInGroup(t.name, group).length > 0 &&
      t.name !== excludeTeam,
  )
  const pool = eligible.length > 0 ? eligible : NBA_TEAMS
  return pickRandom(pool, rand)
}

export function getPlayersByTeamAndGroup(team: string, group: Group): Player[] {
  return playersOnTeamInGroup(team, group)
}

/**
 * For center spins: weight the pool 70% true centers, 20% hybrid bigs,
 * 10% small-ball. Weights renormalize over the types actually present.
 */
export function getCenterWeightedPlayerPool(
  players: Player[],
  rand: Rand,
): Player[] {
  const byType = new Map<CenterType, Player[]>()
  for (const p of players) {
    const type = p.centerType ?? 'true-center'
    const list = byType.get(type)
    if (list) list.push(p)
    else byType.set(type, [p])
  }

  const presentTypes = [...byType.keys()]
  if (presentTypes.length <= 1) return players

  const totalWeight = presentTypes.reduce(
    (sum, t) => sum + CENTER_TYPE_WEIGHTS[t],
    0,
  )
  let roll = rand() * totalWeight
  for (const type of presentTypes) {
    roll -= CENTER_TYPE_WEIGHTS[type]
    if (roll <= 0) return byType.get(type)!
  }
  return byType.get(presentTypes[presentTypes.length - 1])!
}

/**
 * Spin a player from the team+group. `excludePlayer` keeps Risk It /
 * respins from landing on the same player twice when alternatives exist.
 */
export function spinPlayer(
  team: string,
  group: Group,
  rand: Rand,
  excludePlayer?: string,
): Player | null {
  let pool = getPlayersByTeamAndGroup(team, group)
  if (pool.length === 0) return null
  if (excludePlayer && pool.length > 1) {
    pool = pool.filter((p) => p.name !== excludePlayer)
  }
  if (group === 'Centers') {
    pool = getCenterWeightedPlayerPool(pool, rand)
  }
  return pickRarityWeighted(pool, rand)
}
