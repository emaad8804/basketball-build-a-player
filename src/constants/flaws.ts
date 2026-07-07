import type { AttributeKey } from '../types'
import { FLAW_TIER_HEX } from './designTokens'

export type FlawTier = 'Minor' | 'Moderate' | 'Severe'

export type FlawId =
  | 'brick-at-the-line'
  | 'slow-starter'
  | 'injury-prone'
  | 'playoff-shrink'
  | 'ice-cold'
  | 'glass-bones'

export interface Flaw {
  id: FlawId
  name: string
  tier: FlawTier
  emoji: string
  /** Wheel weight; all flaw weights + NO_FLAW_WEIGHT sum to 100. */
  weight: number
  /** Player-facing effect summary shown when the flaw lands. */
  description: string
  /** Rating >= SOFTEN_THRESHOLD here halves the flaw's effect. */
  linkedAttribute: AttributeKey
}

export const NO_FLAW_WEIGHT = 50

/** Rating on the linked attribute at which a flaw's effect is halved. */
export const SOFTEN_THRESHOLD = 95

export const FLAWS: Flaw[] = [
  {
    id: 'brick-at-the-line',
    name: 'Brick at the Line',
    tier: 'Minor',
    emoji: '🧱',
    weight: 13,
    description:
      'Free throws betray you in tight games — close playoff losses pile up.',
    linkedAttribute: 'shooting',
  },
  {
    id: 'slow-starter',
    name: 'Slow Starter',
    tier: 'Minor',
    emoji: '🐌',
    weight: 13,
    description:
      'You sleepwalk through Games 1 and 2 of every playoff series.',
    linkedAttribute: 'iqClutch',
  },
  {
    id: 'injury-prone',
    name: 'Injury Prone',
    tier: 'Moderate',
    emoji: '🩹',
    weight: 8.5,
    description:
      'Every playoff game risks a knock that sits you for the next two.',
    linkedAttribute: 'frame',
  },
  {
    id: 'playoff-shrink',
    name: 'Playoff Shrink',
    tier: 'Moderate',
    emoji: '📉',
    weight: 8.5,
    description:
      'Regular-season monster, postseason mortal — your game shrinks when it counts.',
    linkedAttribute: 'iqClutch',
  },
  {
    id: 'ice-cold',
    name: 'Ice Cold in the Clutch',
    tier: 'Severe',
    emoji: '🧊',
    weight: 3.5,
    description:
      'Game 7s freeze you solid. The biggest moments are your worst.',
    linkedAttribute: 'iqClutch',
  },
  {
    id: 'glass-bones',
    name: 'Glass Bones',
    tier: 'Severe',
    emoji: '💀',
    weight: 3.5,
    description:
      'Every playoff round rolls the dice on a season-ending injury.',
    linkedAttribute: 'frame',
  },
]

export const FLAW_BY_ID: Record<FlawId, Flaw> = Object.fromEntries(
  FLAWS.map((f) => [f.id, f]),
) as Record<FlawId, Flaw>

export const FLAW_TIER_COLORS: Record<FlawTier, string> = FLAW_TIER_HEX
