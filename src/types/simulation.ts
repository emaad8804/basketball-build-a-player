export interface StatLine {
  ppg: number
  rpg: number
  apg: number
  spg: number
  bpg: number
  fgPct: number
  threePct: number
}

export interface SeasonResult {
  wins: number
  losses: number
  seed: number
  conference: 'East' | 'West'
  stats: StatLine
  awards: string[]
  mvpVoting: string
  allNba: string | null
  defensiveAward: string | null
  wonMvp: boolean
  madePlayoffs: boolean
}

export type PlayoffRoundName =
  | 'First Round'
  | 'Second Round'
  | 'Conference Finals'
  | 'NBA Finals'

export interface PlayoffRound {
  round: PlayoffRoundName
  opponent: string
  won: boolean
  winsFor: number
  winsAgainst: number
  recap: string
}

export interface PlayoffResult {
  rounds: PlayoffRound[]
  reachedFinals: boolean
  eliminatedIn: PlayoffRoundName | null
  playoffStats: StatLine
}

export interface FinalsGame {
  gameNumber: number
  won: boolean
  scoreFor: number
  scoreAgainst: number
  seriesFor: number
  seriesAgainst: number
  statLine: {
    pts: number
    reb: number
    ast: number
    stl: number
    blk: number
  }
  recap: string
  isGame7: boolean
}

export interface FinalsResult {
  opponent: string
  games: FinalsGame[]
  won: boolean
  winsFor: number
  winsAgainst: number
  finalsMvp: boolean
  averages: StatLine
}
