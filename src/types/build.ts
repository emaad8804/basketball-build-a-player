import type { AttributeKey, Grade, Group, Player, Rarity, Team } from './player'
import type {
  FinalsResult,
  PlayInResult,
  PlayoffResult,
  SeasonResult,
} from './simulation'
import type { FlawId } from '../constants/flaws'
import type { RngCounters } from '../game-logic/rng'

export interface LockedAttribute {
  attribute: AttributeKey
  playerName: string
  playerTeam: string
  grade: Grade
  rating: number
  /** Rarity of the player this was stolen from (drives share squares). */
  rarity: Rarity
}

export interface ChemistryBonus {
  name: string
  bonus: number
  description: string
}

export type Screen =
  | 'landing'
  | 'game'
  | 'flaw'
  | 'team'
  | 'result'
  | 'season'
  | 'playin'
  | 'playoffs'
  | 'finals'
  | 'share'

export type GameMode = 'free' | 'daily'

export interface GameState {
  screen: Screen
  group: Group | null
  mode: GameMode
  /** Set in daily mode: which Daily Challenge this run is. */
  dailyNumber: number | null
  dailyDateKey: string | null
  /** Seed for all build-phase spins (daily mode shares one per day). */
  runSeed: number
  /** Per-event-type spin counters keying the counter-based RNG streams. */
  rngCounters: RngCounters
  lockedAttributes: Partial<Record<AttributeKey, LockedAttribute>>
  currentTeam: Team | null
  currentPlayer: Player | null
  respinsLeft: number
  /** Fatal Flaw outcome: null = clean, only meaningful once flawSpun. */
  flawId: FlawId | null
  flawSpun: boolean
  flawRerolled: boolean
  /** Team Destiny spin result — final, no rerolls. */
  homeTeam: Team | null
  overall: number | null
  baseOverall: number | null
  chemistryBonuses: ChemistryBonus[]
  archetype: string | null
  seasonResult: SeasonResult | null
  playInResult: PlayInResult | null
  playInGamesRevealed: number
  playoffResult: PlayoffResult | null
  finalsResult: FinalsResult | null
  playoffGamesRevealed: number
  finalsGamesRevealed: number
  legacyLabel: string | null
}
