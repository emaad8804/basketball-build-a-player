import { ATTRIBUTE_KEYS, RESPINS_PER_BUILD } from '../constants/attributes'
import type {
  AttributeKey,
  GameState,
  LockedAttribute,
  Player,
} from '../types'
import { convertGradeToRating } from './grades'
import { zeroRngCounters } from './rng'

export function getAvailableAttributes(
  locked: Partial<Record<AttributeKey, LockedAttribute>>,
): AttributeKey[] {
  return ATTRIBUTE_KEYS.filter((key) => !(key in locked))
}

export function lockAttribute(
  locked: Partial<Record<AttributeKey, LockedAttribute>>,
  attribute: AttributeKey,
  player: Player,
  price?: number,
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
      rarity: player.rarity,
      ...(price !== undefined ? { price } : {}),
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
  | 'rngCounters'
  | 'lockedAttributes'
  | 'currentTeam'
  | 'currentPlayer'
  | 'respinsLeft'
  | 'flawId'
  | 'flawSpun'
  | 'flawRerolled'
  | 'homeTeam'
  | 'overall'
  | 'baseOverall'
  | 'chemistryBonuses'
  | 'archetype'
  | 'seasonResult'
  | 'playInResult'
  | 'playInGamesRevealed'
  | 'playoffResult'
  | 'finalsResult'
  | 'playoffGamesRevealed'
  | 'finalsGamesRevealed'
  | 'legacyLabel'
> {
  return {
    rngCounters: zeroRngCounters(),
    lockedAttributes: {},
    currentTeam: null,
    currentPlayer: null,
    respinsLeft: RESPINS_PER_BUILD,
    flawId: null,
    flawSpun: false,
    flawRerolled: false,
    homeTeam: null,
    overall: null,
    baseOverall: null,
    chemistryBonuses: [],
    archetype: null,
    seasonResult: null,
    playInResult: null,
    playInGamesRevealed: 0,
    playoffResult: null,
    finalsResult: null,
    playoffGamesRevealed: 0,
    finalsGamesRevealed: 0,
    legacyLabel: null,
  }
}
