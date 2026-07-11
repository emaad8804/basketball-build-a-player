import type { Group, Player } from '../types'
import { ALL_GENERATED_PLAYERS } from './generated/players.generated'

// Roster + grades are generated from the 2K sheet + real stats.
// Regenerate with: npm run data:build  (see scripts/build-player-data.js)
export const ALL_PLAYERS: Player[] = ALL_GENERATED_PLAYERS

/** team name -> group -> players. Precomputed so spin logic is O(1). */
const teamGroupIndex = new Map<string, Map<Group, Player[]>>()

for (const player of ALL_PLAYERS) {
  let byGroup = teamGroupIndex.get(player.team)
  if (!byGroup) {
    byGroup = new Map()
    teamGroupIndex.set(player.team, byGroup)
  }
  for (const group of player.eligibleGroups) {
    const list = byGroup.get(group)
    if (list) list.push(player)
    else byGroup.set(group, [player])
  }
}

/** name -> player. Names are unique across the generated roster. */
const playerByNameIndex = new Map<string, Player>(
  ALL_PLAYERS.map((p) => [p.name, p]),
)

export function playerByName(name: string): Player | undefined {
  return playerByNameIndex.get(name)
}

export function playersOnTeamInGroup(team: string, group: Group): Player[] {
  return teamGroupIndex.get(team)?.get(group) ?? []
}

export function teamsWithPlayersInGroup(group: Group): string[] {
  const teams: string[] = []
  for (const [team, byGroup] of teamGroupIndex) {
    if ((byGroup.get(group)?.length ?? 0) > 0) teams.push(team)
  }
  return teams
}
