import type { AttributeKey, Group } from '../types'

export const ATTRIBUTE_KEYS: AttributeKey[] = [
  'frame',
  'athleticism',
  'shooting',
  'finishing',
  'ballHandling',
  'playmaking',
  'defense',
  'rebounding',
  'iqClutch',
]

export const ATTRIBUTE_LABELS: Record<AttributeKey, string> = {
  frame: 'Frame',
  athleticism: 'Athleticism',
  shooting: 'Shooting',
  finishing: 'Finishing',
  ballHandling: 'Ball Handling',
  playmaking: 'Playmaking',
  defense: 'Defense',
  rebounding: 'Rebounding',
  iqClutch: 'IQ / Clutch',
}

export const BUILD_GROUPS: Group[] = ['Guards', 'Forwards', 'Centers']

export const GROUP_LABELS: Record<Group, string> = {
  Guards: 'Guard',
  Forwards: 'Forward',
  Centers: 'Center',
}

export const RESPINS_PER_BUILD = 2

export const CENTER_TYPE_WEIGHTS: Record<string, number> = {
  'true-center': 70,
  'hybrid-big': 20,
  'small-ball': 10,
}
