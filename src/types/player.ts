export type Grade =
  | 'S'
  | 'A+'
  | 'A'
  | 'A-'
  | 'B+'
  | 'B'
  | 'B-'
  | 'C+'
  | 'C'
  | 'D'

export type Group = 'Guards' | 'Forwards' | 'Centers'

export type Rarity = 'Common' | 'Rare' | 'Elite' | 'Legendary'

export type CenterType = 'true-center' | 'hybrid-big' | 'small-ball'

export type AttributeKey =
  | 'frame'
  | 'athleticism'
  | 'shooting'
  | 'finishing'
  | 'ballHandling'
  | 'playmaking'
  | 'defense'
  | 'rebounding'
  | 'iqClutch'

export type PlayerGrades = Record<AttributeKey, Grade>

export interface Player {
  name: string
  team: string
  primaryPosition: string
  secondaryPositions: string[]
  eligibleGroups: Group[]
  rarity: Rarity
  grades: PlayerGrades
  tags: string[]
  centerType?: CenterType
  /** Attributes for which this player is a curated S-tier (elite) talent. */
  sTierAttributes: AttributeKey[]
}

export interface Team {
  name: string
  abbr: string
  conference: 'East' | 'West'
  primaryColor: string
  secondaryColor: string
}
