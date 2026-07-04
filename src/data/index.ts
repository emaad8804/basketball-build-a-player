import type { Group, Player } from '../types'
import { GUARDS } from './guards'
import { FORWARDS } from './forwards'
import { CENTERS } from './centers'

export const ALL_PLAYERS: Player[] = [...GUARDS, ...FORWARDS, ...CENTERS]

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
