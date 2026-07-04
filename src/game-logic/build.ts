import { ATTRIBUTE_KEYS, RESPINS_PER_BUILD } from '../constants/attributes'
import type {
  AttributeKey,
  GameState,
  LockedAttribute,
  Player,
} from '../types'
import { convertGradeToRating } from './grades'

export function getAvailableAttributes(
  locked: Partial<Record<AttributeKey, LockedAttribute>>,
): AttributeKey[] {
  return ATTRIBUTE_KEYS.filter((key) => !(key in locked))
}

export function lockAttribute(
  locked: Partial<Record<AttributeKey, LockedAttribute>>,
  attribute: AttributeKey,
  player: Player,
): Partial<Record<AttributeKey, LockedAttribute>> {
  if (attribute in locked) return locked
  const grade = player.grades[attribute]
  return {
    ...locked,
    [attribute]: {
      attribute,
      playerName: player.name,
      playerTeam: player.team,
      grade,
      rating: convertGradeToRating(grade),
    },
  }
}

export function isBuildComplete(
  locked: Partial<Record<AttributeKey, LockedAttribute>>,
): boolean {
  return getAvailableAttributes(locked).length === 0
}

export function emptyBuildState(): Pick<
  GameState,
  | 'lockedAttributes'
  | 'currentTeam'
  | 'currentPlayer'
  | 'respinsLeft'
  | 'overall'
  | 'baseOverall'
  | 'chemistryBonuses'
  | 'archetype'
  | 'seasonResult'
  | 'playoffResult'
  | 'finalsResult'
  | 'finalsGamesRevealed'
  | 'legacyLabel'
> {
  return {
    lockedAttributes: {},
    currentTeam: null,
    currentPlayer: null,
    respinsLeft: RESPINS_PER_BUILD,
    overall: null,
    baseOverall: null,
    chemistryBonuses: [],
    archetype: null,
    seasonResult: null,
    playoffResult: null,
    finalsResult: null,
    finalsGamesRevealed: 0,
    legacyLabel: null,
  }
}
