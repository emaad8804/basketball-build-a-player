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
  /** 40-43 wins: one last chance via the play-in tournament. */
  playInEligible: boolean
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

/** One sudden-death play-in game; each has its own opponent. */
export interface PlayInGame extends SeriesGame {
  opponent: string
}

export interface PlayInResult {
  /** 42-43 wins get the forgiving 7/8 path; 40-41 must win two straight. */
  path: '7-8' | '9-10'
  games: PlayInGame[]
  survived: boolean
  /** Glass Bones struck on play-in night — the run ends before tip-off. */
  seasonEndingInjury?: boolean
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
