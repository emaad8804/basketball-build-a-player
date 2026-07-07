/**
 * Team Destiny tiers (July 2026): where the wheel lands you shapes both
 * the regular season (small) and championship odds (full force).
 * strengthDelta lands on the 60-99 playoff strength scale (1 pt ≈ 2%
 * per-game win prob); winPctDelta shifts season win% (±0.05 ≈ ±4 wins).
 */

import { TEAM_TIER_HEX } from './designTokens'

export type TeamTierId =
  | 'contender'
  | 'playoff-lock'
  | 'middle'
  | 'rebuilding'
  | 'tanking'

export interface TeamTier {
  id: TeamTierId
  label: string
  emoji: string
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
    emoji: '👑',
    color: TEAM_TIER_HEX.contender,
    strengthDelta: 3,
    winPctDelta: 0.05,
    flavor: 'A loaded roster built to win now — your title odds just jumped.',
  },
  'playoff-lock': {
    id: 'playoff-lock',
    label: 'Playoff Lock',
    emoji: '🔒',
    color: TEAM_TIER_HEX['playoff-lock'],
    strengthDelta: 1.5,
    winPctDelta: 0.025,
    flavor: 'A proven playoff outfit. Real help on both ends.',
  },
  middle: {
    id: 'middle',
    label: 'Middle of the Pack',
    emoji: '⚖️',
    color: TEAM_TIER_HEX.middle,
    strengthDelta: 0,
    winPctDelta: 0,
    flavor: 'Decent pieces, no stars. This one is all on you.',
  },
  rebuilding: {
    id: 'rebuilding',
    label: 'Rebuilding',
    emoji: '🧱',
    color: TEAM_TIER_HEX.rebuilding,
    strengthDelta: -2,
    winPctDelta: -0.03,
    flavor: 'Young, raw, and inconsistent — you will have to drag them.',
  },
  tanking: {
    id: 'tanking',
    label: 'Tanking',
    emoji: '🕳️',
    color: TEAM_TIER_HEX.tanking,
    strengthDelta: -4,
    winPctDelta: -0.05,
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
    'San Antonio Spurs',
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
