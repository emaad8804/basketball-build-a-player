import type { AttributeKey, Grade, Group, Player, Team } from './player'
import type {
  FinalsResult,
  PlayoffResult,
  SeasonResult,
} from './simulation'

export interface LockedAttribute {
  attribute: AttributeKey
  playerName: string
  playerTeam: string
  grade: Grade
  rating: number
}

export interface ChemistryBonus {
  name: string
  bonus: number
  description: string
}

export type Screen =
  | 'landing'
  | 'game'
  | 'result'
  | 'season'
  | 'playoffs'
  | 'finals'
  | 'share'

export interface GameState {
  screen: Screen
  group: Group | null
  lockedAttributes: Partial<Record<AttributeKey, LockedAttribute>>
  currentTeam: Team | null
  currentPlayer: Player | null
  respinsLeft: number
  overall: number | null
  baseOverall: number | null
  chemistryBonuses: ChemistryBonus[]
  archetype: string | null
  seasonResult: SeasonResult | null
  playoffResult: PlayoffResult | null
  finalsResult: FinalsResult | null
  playoffGamesRevealed: number
  finalsGamesRevealed: number
  legacyLabel: string | null
}
