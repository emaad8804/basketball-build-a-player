/**
 * Team Destiny tiers (July 2026): where the wheel lands you shapes both
 * the regular season and championship odds.
 * strengthDelta lands on the 60-99 playoff strength scale (1 pt ≈ 2%
 * per-game win prob); winPctDelta shifts season win% (±0.17 ≈ ±14 wins,
 * before superstar carry — see carriedWinPctDelta).
 */

import type { Team } from '../types'
import { TEAM_TIER_HEX } from './designTokens'
import { NBA_TEAMS } from './teams'

export type TeamTierId =
  | 'contender'
  | 'playoff-lock'
  | 'middle'
  | 'rebuilding'
  | 'tanking'

export interface TeamTier {
  id: TeamTierId
  label: string
  color: string
  strengthDelta: number
  winPctDelta: number
  /** Flavor line shown on the team reveal card. */
  flavor: string
}

export const TEAM_TIERS: Record<TeamTierId, TeamTier> = {
  contender: {
    id: 'contender',
    label: 'Title Contender',
    color: TEAM_TIER_HEX.contender,
    strengthDelta: 4,
    winPctDelta: 0.17,
    flavor: 'A loaded roster built to win now — your title odds just jumped.',
  },
  'playoff-lock': {
    id: 'playoff-lock',
    label: 'Playoff Lock',
    color: TEAM_TIER_HEX['playoff-lock'],
    strengthDelta: 2,
    winPctDelta: 0.085,
    flavor: 'A proven playoff outfit. Real help on both ends.',
  },
  middle: {
    id: 'middle',
    label: 'Middle of the Pack',
    color: TEAM_TIER_HEX.middle,
    strengthDelta: 0,
    winPctDelta: 0,
    flavor: 'Decent pieces, no stars. This one is all on you.',
  },
  rebuilding: {
    id: 'rebuilding',
    label: 'Rebuilding',
    color: TEAM_TIER_HEX.rebuilding,
    strengthDelta: -3,
    winPctDelta: -0.11,
    flavor: 'Young, raw, and inconsistent — you will have to drag them.',
  },
  tanking: {
    id: 'tanking',
    label: 'Tanking',
    color: TEAM_TIER_HEX.tanking,
    strengthDelta: -5,
    winPctDelta: -0.17,
    flavor: 'The front office wants lottery balls. Your title odds are slim.',
  },
}

const TIER_ROSTERS: Record<TeamTierId, string[]> = {
  contender: [
    'Oklahoma City Thunder',
    'New York Knicks',
    'Cleveland Cavaliers',
    'Denver Nuggets',
    'Houston Rockets',
    // 2026 Western Conference champions — beat the 1-seed Thunder, lost
    // the Finals to the Knicks in 5.
    'San Antonio Spurs',
  ],
  'playoff-lock': [
    'Boston Celtics',
    'Minnesota Timberwolves',
    'Los Angeles Lakers',
    'Golden State Warriors',
    'Orlando Magic',
    'Detroit Pistons',
    'Milwaukee Bucks',
    'LA Clippers',
  ],
  middle: [
    'Indiana Pacers',
    'Philadelphia 76ers',
    'Miami Heat',
    'Atlanta Hawks',
    'Memphis Grizzlies',
    'Sacramento Kings',
    'Dallas Mavericks',
    'Toronto Raptors',
  ],
  rebuilding: [
    'Chicago Bulls',
    'Phoenix Suns',
    'Portland Trail Blazers',
    'New Orleans Pelicans',
    'Charlotte Hornets',
  ],
  tanking: ['Brooklyn Nets', 'Washington Wizards', 'Utah Jazz'],
}

export const TEAM_TIER_BY_NAME: Record<string, TeamTier> = Object.fromEntries(
  (Object.keys(TIER_ROSTERS) as TeamTierId[]).flatMap((tierId) =>
    TIER_ROSTERS[tierId].map((name) => [name, TEAM_TIERS[tierId]]),
  ),
)

export function teamTierFor(teamName: string): TeamTier {
  return TEAM_TIER_BY_NAME[teamName] ?? TEAM_TIERS.middle
}

/** Which team tiers plausibly occupy each playoff seed. */
export const SEED_TIER_POOL: Record<number, TeamTierId[]> = {
  1: ['contender'],
  2: ['contender'],
  3: ['contender', 'playoff-lock'],
  4: ['playoff-lock'],
  5: ['playoff-lock'],
  6: ['playoff-lock', 'middle'],
  7: ['middle'],
  8: ['middle', 'rebuilding'],
  9: ['middle', 'rebuilding'],
  10: ['rebuilding'],
}

/**
 * Teams that can plausibly hold `seed` in `conference`, excluding names
 * already used. Falls back to any unused team in the conference so a thin
 * pool can never crash the sim or draw the build's own team.
 */
export function teamsForSeed(
  seed: number,
  conference: 'East' | 'West',
  excluded: ReadonlySet<string>,
): Team[] {
  const tiers = SEED_TIER_POOL[seed] ?? []
  const inConference = NBA_TEAMS.filter(
    (t) => t.conference === conference && !excluded.has(t.name),
  )
  const pool = inConference.filter((t) => tiers.includes(teamTierFor(t.name).id))
  return pool.length > 0 ? pool : inConference
}

/** Superstar carry: overall where penalty relief starts / maxes out. */
const CARRY_START = 82
const CARRY_FULL = 94
const MAX_CARRY_RELIEF = 0.45

/**
 * Stars drag bad teams upward: a high overall shrinks a negative
 * winPctDelta by up to 45% (90 OVR ≈ 30% relief, enough to put a
 * tanking team in the play-in hunt). Good-team bonuses are untouched,
 * as is the playoff strengthDelta — a thin roster still hurts in May.
 */
export function carriedWinPctDelta(delta: number, overall: number): number {
  if (delta >= 0) return delta
  const carry = Math.min(
    1,
    Math.max(0, (overall - CARRY_START) / (CARRY_FULL - CARRY_START)),
  )
  return delta * (1 - MAX_CARRY_RELIEF * carry)
}
