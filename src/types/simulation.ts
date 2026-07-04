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

/** One game of any best-of-7 series (playoffs or Finals). */
export interface SeriesGame {
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
  /** Set when the player's Fatal Flaw visibly shaped this game. */
  flawEvent?: string
  /** Player sat this game out (Injury Prone). */
  dnp?: boolean
}

export interface PlayoffRound {
  round: PlayoffRoundName
  opponent: string
  opponentSeed: number
  won: boolean
  winsFor: number
  winsAgainst: number
  games: SeriesGame[]
  recap: string
}

export interface PlayoffResult {
  rounds: PlayoffRound[]
  reachedFinals: boolean
  eliminatedIn: PlayoffRoundName | null
  playoffStats: StatLine
  /** Glass Bones struck entering this round — the run ends here. */
  seasonEndingInjury?: PlayoffRoundName
}

export type FinalsGame = SeriesGame

export interface FinalsResult {
  opponent: string
  games: SeriesGame[]
  won: boolean
  winsFor: number
  winsAgainst: number
  finalsMvp: boolean
  averages: StatLine
}
